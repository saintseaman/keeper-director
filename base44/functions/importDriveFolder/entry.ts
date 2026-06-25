import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Імпорт цілої папки з Google Диска.
// payload: { folderId }  → завантажує всі аудіофайли з папки у сховище
// застосунку та повертає [{ title, url, category, icon }] з категорією/іконкою,
// вгаданою за назвою файлу.
//
// Аналіз назви — проста система ключових слів, що відповідає категоріям
// застосунку (atmosphere / events / creatures / horror / madness / jumpscare).

// Ключове слово → { category, icon }. Перший збіг виграє (порядок важливий).
const KEYWORD_RULES = [
  // jumpscare
  [['jumpscare', 'jump', 'scare', 'sting', 'shock'], 'jumpscare', 'AlertTriangle'],
  // madness
  [['madness', 'insan', 'sanity', 'tinnitus', 'drone', 'cosmic', 'warp', 'distort'], 'madness', 'BrainCircuit'],
  // creatures
  [['monster', 'creature', 'beast', 'cult', 'chant', 'ghoul', 'deep', 'shoggoth', 'byakhee', 'migo', 'mi-go', 'nightgaunt', 'elder', 'growl', 'snarl', 'gurgle'], 'creatures', 'Bug'],
  // horror
  [['whisper', 'breath', 'heartbeat', 'heart', 'scream', 'scratch', 'moan', 'ghost', 'horror', 'creepy', 'eerie', 'dread', 'reverse'], 'horror', 'Ghost'],
  // events
  [['door', 'slam', 'glass', 'break', 'explosion', 'blast', 'gun', 'shot', 'collapse', 'chase', 'combat', 'drum', 'lock', 'fall', 'impact', 'crash', 'hit', 'event'], 'events', 'Zap'],
  // atmosphere (rain, wind, fire, ambient...)
  [['rain', 'storm', 'wind', 'thunder', 'ocean', 'wave', 'sea', 'water', 'drip', 'fire', 'crackle', 'forest', 'jungle', 'desert', 'arctic', 'cave', 'clock', 'tick', 'bell', 'train', 'fog', 'mist', 'ambient', 'ambience', 'atmos', 'room', 'night', 'underground', 'library', 'birds', 'wood', 'creak'], 'atmosphere', 'CloudFog'],
];

const CATEGORY_ICON = {
  atmosphere: 'CloudFog',
  events: 'Zap',
  creatures: 'Bug',
  horror: 'Ghost',
  madness: 'BrainCircuit',
  jumpscare: 'AlertTriangle',
};

function cleanTitle(name) {
  // Прибрати розширення та службові символи, зробити Title Case.
  const base = name.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) return 'Sound';
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

function guessCategory(name) {
  const lower = name.toLowerCase();
  for (const [keywords, category, icon] of KEYWORD_RULES) {
    if (keywords.some((k) => lower.includes(k))) {
      return { category, icon };
    }
  }
  return { category: 'atmosphere', icon: CATEGORY_ICON.atmosphere };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const folderId = body && body.folderId;
    if (!folderId) return Response.json({ error: 'folderId is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // 1) Список аудіофайлів у папці.
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'audio/' and trashed = false`,
      fields: 'files(id,name,mimeType)',
      orderBy: 'name',
      pageSize: '200',
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
    const driveFiles = listData.files || [];

    // 2) Завантажити кожен файл і перекласти у сховище застосунку.
    const sounds = [];
    for (const f of driveFiles) {
      try {
        const dl = await fetch(
          `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!dl.ok) continue;
        const contentType = dl.headers.get('content-type') || 'audio/mpeg';
        const blob = await dl.blob();
        const file = new File([blob], f.name, { type: contentType });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const { category, icon } = guessCategory(f.name);
        // Атмосфера/істоти/безумство — зацикленi; події/jumpscare — одноразові.
        const isLoopable = !['events', 'jumpscare'].includes(category);
        sounds.push({
          id: `custom_${f.id}`,
          title: cleanTitle(f.name),
          url: file_url,
          category,
          icon,
          isLoopable,
        });
      } catch {
        /* пропускаємо проблемний файл, продовжуємо інші */
      }
    }

    return Response.json({ sounds, total: driveFiles.length, imported: sounds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});