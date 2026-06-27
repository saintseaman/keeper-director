import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Перекачивает звуки из Google Drive (стрим) в постоянное хранилище приложения,
// чтобы воспроизведение было мгновенным без стрима. Берёт пэды, у которых url
// всё ещё указывает на streamDriveAudio, скачивает файл из Drive, загружает в
// сторадж приложения и заменяет url на быстрый CDN-адрес.
//
// Работает маленькими пакетами (limit), чтобы укладываться в лимит времени.
// Фронт вызывает повторно, пока remaining > 0.
//
// POST { limit?: number }  → { processed, converted, remaining, errors: [] }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) { /* empty body ok */ }
    const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 8);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Все пэды, ещё висящие на стримере.
    const all = await base44.asServiceRole.entities.Pad.list('-created_date', 1000);
    const pending = all.filter((p) => p.url && p.url.includes('streamDriveAudio'));
    const batch = pending.slice(0, limit);

    const errors = [];
    let converted = 0;

    for (const pad of batch) {
      try {
        const fileId = new URL(pad.url).searchParams.get('fileId');
        if (!fileId) { errors.push({ id: pad.id, error: 'no fileId' }); continue; }

        // Качаем файл из Drive.
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!driveRes.ok) {
          errors.push({ id: pad.id, error: `drive ${driveRes.status}` });
          continue;
        }

        const blob = await driveRes.blob();
        const name = (pad.title || 'sound').replace(/[^\w.-]+/g, '_').slice(0, 60) + '.wav';
        const file = new File([blob], name, { type: 'audio/wav' });

        // Заливаем в постоянное хранилище приложения.
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

        await base44.asServiceRole.entities.Pad.update(pad.id, { url: file_url });
        converted++;
      } catch (e) {
        errors.push({ id: pad.id, error: e.message });
      }
    }

    return Response.json({
      processed: batch.length,
      converted,
      remaining: pending.length - converted,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});