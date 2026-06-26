import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Повертає список аудіофайлів з Google Диску користувача.
// Необовʼязковий payload: { q } — пошуковий рядок по назві.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let search = '';
    try {
      const body = await req.json();
      search = (body && body.q ? String(body.q) : '').trim();
    } catch { /* без тіла — гаразд */ }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Аудіо за mime АБО за розширенням (Drive іноді тегує wav/m4a/flac
    // як video/* чи application/octet-stream). Не у кошику; за потреби — фільтр по назві.
    const extQ = ['.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus', '.webm', '.aiff', '.aif', '.wma']
      .map((ext) => `name contains '${ext}'`)
      .join(' or ');
    let q = `(mimeType contains 'audio/' or ${extQ}) and trashed = false`;
    if (search) {
      const safe = search.replace(/'/g, "\\'");
      q += ` and name contains '${safe}'`;
    }

    const params = new URLSearchParams({
      q,
      fields: 'files(id,name,mimeType,size)',
      orderBy: 'modifiedTime desc',
      pageSize: '100',
      spaces: 'drive',
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: 'Drive API error', details: text }, { status: 502 });
    }
    const data = await res.json();
    // Подстрахуемся: Drive query (name contains) может зацепить лишнее
    // (например таблицы). Оставляем только настоящее аудио — по mime
    // или по расширению В КОНЦЕ имени.
    const audioExt = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm|aiff|aif|wma)$/i;
    const files = (data.files || []).filter(
      (f) => (f.mimeType || '').includes('audio/') || audioExt.test(f.name || '')
    );
    return Response.json({ files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});