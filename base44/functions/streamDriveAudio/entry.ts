import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Публічний стрімер аудіо з Google Диску — віддає байти файлу за його id,
// щоб тег <audio src> міг грати звук БЕЗ перекачування у сховище застосунку.
// Це робить імпорт миттєвим: ми зберігаємо лише метадані пэда + посилання сюди.
//
// Виклик (GET): /streamDriveAudio?fileId=<DRIVE_FILE_ID>
// Підтримує HTTP Range (перемотка у плеєрі) — пробрасуємо заголовок на Диск.

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');
    if (!fileId) {
      return new Response('fileId is required', { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const headers = { Authorization: `Bearer ${accessToken}` };
    const range = req.headers.get('range');
    if (range) headers.Range = range;

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers }
    );

    if (!driveRes.ok && driveRes.status !== 206) {
      const text = await driveRes.text();
      return new Response(`Drive error: ${text}`, { status: driveRes.status });
    }

    // Пробрасуємо тіло потоком + ключові заголовки для <audio> (тип, розмір,
    // підтримка перемотки). Дозволяємо CORS, щоб плеєр у застосунку міг грати.
    const respHeaders = new Headers();
    respHeaders.set('Content-Type', driveRes.headers.get('content-type') || 'audio/mpeg');
    respHeaders.set('Accept-Ranges', 'bytes');
    respHeaders.set('Cache-Control', 'public, max-age=31536000');
    respHeaders.set('Access-Control-Allow-Origin', '*');
    const len = driveRes.headers.get('content-length');
    if (len) respHeaders.set('Content-Length', len);
    const cr = driveRes.headers.get('content-range');
    if (cr) respHeaders.set('Content-Range', cr);

    return new Response(driveRes.body, {
      status: driveRes.status,
      headers: respHeaders,
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});