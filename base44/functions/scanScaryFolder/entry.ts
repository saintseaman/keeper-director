import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Шукає папку «Scary_sounds» на Google Диску і повертає список усіх її
// аудіофайлів — включно з файлами у вкладених підпапках (Sounds, Sounds2…) —
// легко, без завантаження вмісту, щоб застосунок міг порівняти з уже
// імпортованими пэдами й запропонувати додати нові.
//
// Повертає: { folderId, folderName, files: [{ id, name }] }
// Якщо папку не знайдено — { folderId: null, files: [] }.

const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm|aiff|aif|wma)$/i;
const PLAYLIST_EXT = /\.(m3u|m3u8|pls|cue|wpl|xspf)$/i;

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
    const FOLDER_MIME = 'application/vnd.google-apps.folder';
    const files = [];
    const queue = [folder.id];
    const seen = new Set();
    while (queue.length) {
      const parentId = queue.shift();
      if (seen.has(parentId)) continue;
      seen.add(parentId);
      const children = await listChildren(accessToken, parentId);
      for (const c of children) {
        if (c.mimeType === FOLDER_MIME) {
          queue.push(c.id);
        } else if (
          ((c.mimeType || '').includes('audio/') || AUDIO_EXT.test(c.name || '')) &&
          !PLAYLIST_EXT.test(c.name || '')
        ) {
          files.push({ id: c.id, name: c.name });
        }
      }
    }

    return Response.json({ folderId: folder.id, folderName: folder.name, files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});