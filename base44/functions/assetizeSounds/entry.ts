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
    // По одному файлу за вызов — так укладываемся во время даже на крупных WAV.
    const limit = Math.min(Math.max(Number(body.limit) || 1, 1), 3);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Пэды на стримере, ещё не помеченные как «слишком большие». Помеченные
    // (asset_skipped) больше не пытаемся качать — они остаются на стриме с
    // кэшем браузера и не блокируют очередь.
    const all = await base44.asServiceRole.entities.Pad.list('-created_date', 1000);
    const pending = all.filter(
      (p) => p.url && p.url.includes('streamDriveAudio') && !p.asset_skipped
    );
    const batch = pending.slice(0, limit);

    const errors = [];
    let converted = 0;
    let skipped = 0;

    for (const pad of batch) {
      try {
        const fileId = new URL(pad.url).searchParams.get('fileId');
        if (!fileId) { errors.push({ id: pad.id, error: 'no fileId' }); continue; }

        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!driveRes.ok) {
          errors.push({ id: pad.id, error: `drive ${driveRes.status}` });
          continue;
        }

        const name = (pad.title || 'sound').replace(/[^\w.-]+/g, '_').slice(0, 60) + '.wav';

        let file;
        try {
          // Читаем файл в память. Крупные WAV (40+ МБ) могут не поместиться —
          // тогда ловим ошибку памяти ниже и помечаем пэд как пропущенный.
          const buf = new Uint8Array(await driveRes.arrayBuffer());
          file = new File([buf], name, { type: 'audio/wav' });
        } catch (memErr) {
          // Слишком большой для воркера — помечаем, чтобы не блокировал очередь.
          await base44.asServiceRole.entities.Pad.update(pad.id, { asset_skipped: true });
          skipped++;
          continue;
        }

        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        await base44.asServiceRole.entities.Pad.update(pad.id, { url: file_url });
        converted++;
      } catch (e) {
        // Любая иная ошибка памяти на больших файлах → тоже помечаем пропуск.
        if (/memory/i.test(e.message || '')) {
          try { await base44.asServiceRole.entities.Pad.update(pad.id, { asset_skipped: true }); skipped++; } catch (_) {}
        } else {
          errors.push({ id: pad.id, error: e.message });
        }
      }
    }

    const remaining = pending.length - converted - skipped;
    return Response.json({
      processed: batch.length,
      converted,
      skipped,
      remaining,
      done: remaining === 0,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});