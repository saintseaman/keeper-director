import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Шукає папку «Scary_sounds» на Google Диску і повертає список усіх її
// аудіофайлів — включно з файлами у вкладених підпапках (Sounds, Sounds2…) —
// легко, без завантаження вмісту, щоб застосунок міг порівняти з уже
// імпортованими пэдами й запропонувати додати нові.
//
// Повертає: { folderId, folderName, files: [{ id, name }] }
// Якщо папку не знайдено — { folderId: null, files: [] }.

const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm|aiff|aif|wma|mp2|ape|wv|mka|caf|3gp|amr)$/i;
const PLAYLIST_EXT = /\.(m3u|m3u8|pls|cue|wpl|xspf)$/i;
// Розширення явно НЕ-аудіо: документи, архіви, зображення, відео тощо.
// Усе інше (включно з файлами без розширення та octet-stream) вважаємо аудіо —
// у папці «Scary_sounds» так зберігаються звуки без розширення (Scary Sounds.p01…).
const NON_AUDIO_EXT = /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff?|pdf|docx?|xlsx?|pptx?|txt|rtf|csv|json|xml|html?|zip|rar|7z|tar|gz|exe|dmg|iso|mp4|mov|avi|mkv|wmv|flv|m4v|par|par2|sfv|nfo|md5|p\d{2,3}|r\d{2,3})$/i;

// Чи вважати файл аудіо: явне аудіо-розширення або audio/* mime, АБО файл без
// явного не-аудіо розширення (octet-stream / без розширення), окрім плейлистів.
function isAudio(c) {
  const name = c.name || '';
  const mime = c.mimeType || '';
  if (PLAYLIST_EXT.test(name)) return false;
  if (NON_AUDIO_EXT.test(name)) return false;
  if (mime.includes('audio/') || AUDIO_EXT.test(name)) return true;
  // Файли без аудіо-розширення: приймаємо octet-stream та файли без крапки в назві.
  if (mime === 'application/octet-stream') return true;
  if (!/\.[a-z0-9]{1,5}$/i.test(name)) return true;
  return false;
}

async function listChildren(accessToken, parentId) {
  const out = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${parentId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id,name,mimeType)',
      orderBy: 'name',
      pageSize: '300',
      spaces: 'drive',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Drive list error: ${await res.text()}`);
    const data = await res.json();
    out.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // 1) Знайти папку за назвою «Scary_sounds» (Google `name =` нечутливий до регістру).
    const folderParams = new URLSearchParams({
      q: "mimeType = 'application/vnd.google-apps.folder' and name = 'Scary_sounds' and trashed = false",
      fields: 'files(id,name)',
      pageSize: '5',
      spaces: 'drive',
    });
    const folderRes = await fetch(`https://www.googleapis.com/drive/v3/files?${folderParams}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!folderRes.ok) {
      const text = await folderRes.text();
      return Response.json({ error: 'Drive folder lookup error', details: text }, { status: 502 });
    }
    const folderData = await folderRes.json();
    const folder = (folderData.files || [])[0];
    if (!folder) return Response.json({ folderId: null, folderName: null, files: [] });

    // 2) Рекурсивно зібрати всі аудіофайли з папки та її підпапок.
    // Обхід ПОРІВНЯМИ (BFS): увесь поточний рівень папок скануємо паралельно
    // (Promise.all), що в рази швидше за послідовний обхід на дереві з десятків
    // вкладених бібліотек. Без цього скан упирається в таймаут функції.
    const FOLDER_MIME = 'application/vnd.google-apps.folder';
    const files = [];
    const seen = new Set();
    let level = [folder.id];
    seen.add(folder.id);
    while (level.length) {
      const results = await Promise.all(level.map((id) => listChildren(accessToken, id)));
      const nextLevel = [];
      for (const children of results) {
        for (const c of children) {
          if (c.mimeType === FOLDER_MIME) {
            if (!seen.has(c.id)) {
              seen.add(c.id);
              nextLevel.push(c.id);
            }
          } else if (isAudio(c)) {
            files.push({ id: c.id, name: c.name });
          }
        }
      }
      level = nextLevel;
    }

    return Response.json({ folderId: folder.id, folderName: folder.name, files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});