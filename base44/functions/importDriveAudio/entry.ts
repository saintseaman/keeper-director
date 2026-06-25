import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Завантажує аудіофайл з Google Диску і кладе його у сховище застосунку.
// payload: { fileId, name } → повертає { file_url, name }.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileId = body && body.fileId;
    const name = (body && body.name) || 'drive-audio.mp3';
    if (!fileId) return Response.json({ error: 'fileId is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Завантажуємо вміст файлу.
    const dl = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!dl.ok) {
      const text = await dl.text();
      return Response.json({ error: 'Download failed', details: text }, { status: 502 });
    }

    const contentType = dl.headers.get('content-type') || 'audio/mpeg';
    const blob = await dl.blob();
    const file = new File([blob], name, { type: contentType });

    // Перекладаємо у сховище застосунку, отримуємо постійний URL.
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return Response.json({ file_url, name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});