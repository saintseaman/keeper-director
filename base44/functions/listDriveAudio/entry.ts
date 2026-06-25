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

    // Тільки аудіо, не у кошику; за потреби — фільтр по назві.
    let q = "mimeType contains 'audio/' and trashed = false";
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
    return Response.json({ files: data.files || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});