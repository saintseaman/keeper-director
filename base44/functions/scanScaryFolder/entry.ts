import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Шукає папку «scary sounds» на Google Диску і повертає список її
// аудіофайлів (легко, без завантаження вмісту), щоб застосунок міг
// порівняти з уже імпортованими пэдами й запропонувати додати нові.
//
// Повертає: { folderId, folderName, files: [{ id, name }] }
// Якщо папку не знайдено — { folderId: null, files: [] }.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // 1) Знайти папку за назвою «scary sounds» (без врахування регістру).
    const folderParams = new URLSearchParams({
      q: "mimeType = 'application/vnd.google-apps.folder' and name = 'scary sounds' and trashed = false",
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
    // Google `name =` нечутливий до регістру, але підстрахуємось і за «contains».
    let folder = (folderData.files || [])[0];
    if (!folder) {
      const altParams = new URLSearchParams({
        q: "mimeType = 'application/vnd.google-apps.folder' and name contains 'scary' and trashed = false",
        fields: 'files(id,name)',
        pageSize: '10',
        spaces: 'drive',
      });
      const altRes = await fetch(`https://www.googleapis.com/drive/v3/files?${altParams}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (altRes.ok) {
        const altData = await altRes.json();
        folder = (altData.files || []).find((f) => /scary\s*sounds?/i.test(f.name || ''));
      }
    }
    if (!folder) return Response.json({ folderId: null, folderName: null, files: [] });

    // 2) Перелічити аудіофайли у папці (за mime або розширенням).
    const extQ = ['.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus', '.webm', '.aiff', '.aif', '.wma']
      .map((ext) => `name contains '${ext}'`)
      .join(' or ');
    const params = new URLSearchParams({
      q: `'${folder.id}' in parents and (mimeType contains 'audio/' or ${extQ}) and trashed = false`,
      fields: 'files(id,name,mimeType)',
      orderBy: 'name',
      pageSize: '300',
      spaces: 'drive',
    });
    const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listRes.ok) {
      const text = await listRes.text();
      return Response.json({ error: 'Drive list error', details: text }, { status: 502 });
    }
    const listData = await listRes.json();
    const audioExt = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm|aiff|aif|wma)$/i;
    const files = (listData.files || [])
      .filter(
        (f) =>
          ((f.mimeType || '').includes('audio/') || audioExt.test(f.name || '')) &&
          !/\.(m3u|m3u8|pls|cue|wpl|xspf)$/i.test(f.name || '')
      )
      .map((f) => ({ id: f.id, name: f.name }));

    return Response.json({ folderId: folder.id, folderName: folder.name, files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});