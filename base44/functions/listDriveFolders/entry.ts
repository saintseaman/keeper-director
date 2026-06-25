import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Повертає список папок Google Диска для навігації при імпорті.
// Payload:
//   { q }        — пошук по назві по всьому диску (ігнорує parentId)
//   { parentId } — папки всередині вказаної папки ('root' за замовчуванням)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let search = '';
    let parentId = 'root';
    try {
      const body = await req.json();
      search = (body && body.q ? String(body.q) : '').trim();
      if (body && body.parentId) parentId = String(body.parentId);
    } catch { /* без тіла — гаразд */ }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    let q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    if (search) {
      // Пошук по всьому диску за назвою.
      const safe = search.replace(/'/g, "\\'");
      q += ` and name contains '${safe}'`;
    } else {
      // Навігація: показуємо лише папки всередині поточної.
      q += ` and '${parentId}' in parents`;
    }

    const params = new URLSearchParams({
      q,
      fields: 'files(id,name)',
      orderBy: 'name',
      pageSize: '200',
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
    return Response.json({ folders: data.files || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});