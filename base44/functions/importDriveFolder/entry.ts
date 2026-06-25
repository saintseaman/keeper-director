import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Імпорт цілої папки з Google Диска.
// payload: { folderId }  → завантажує всі аудіофайли з папки у сховище
// застосунку та повертає [{ title, url, category, icon }] з категорією/іконкою,
// вгаданою за назвою файлу.
//
// Аналіз назви — проста система ключових слів, що відповідає категоріям
// застосунку (atmosphere / events / creatures / horror / madness / jumpscare).

// Ключове слово → { category, icon }. Перший збіг виграє (порядок важливий).
// Словник орієнтований на кампанії Call of Cthulhu / D&D: міфи, ритуали,
// істоти, локації та події. Підтримує EN + RU/UA терміни.
const KEYWORD_RULES = [
  // jumpscare — різкі лякалки
  [['jumpscare', 'jump', 'scare', 'sting', 'shock', 'startle', 'pounce', 'reveal', 'gotcha', 'лякал', 'испуг', 'пугал'], 'jumpscare', 'AlertTriangle'],
  // madness — божевілля, втрата розуму, космічний жах
  [['madness', 'insan', 'sanity', 'tinnitus', 'drone', 'cosmic', 'warp', 'distort', 'dream', 'nightmare', 'hallucinat', 'void', 'abyss', 'dissonan', 'unreal', 'dimension', 'azathoth', 'yog', 'nyarlathotep', 'hastur', 'безум', 'разум', 'кошмар', 'сон', 'бездн', 'пустот'], 'madness', 'BrainCircuit'],
  // creatures — істоти й культи Міфів
  [['monster', 'creature', 'beast', 'cult', 'chant', 'chanting', 'ghoul', 'deep', 'deep one', 'shoggoth', 'byakhee', 'migo', 'mi-go', 'nightgaunt', 'elder', 'great old one', 'cthulhu', 'dagon', 'hydra', 'tentacle', 'eldritch', 'spawn', 'hound', 'tindalos', 'rat', 'bat', 'bats', 'bee', 'bees', 'insect', 'swarm', 'animal', 'wolf', 'howl', 'growl', 'snarl', 'gurgle', 'roar', 'hiss', 'shriek', 'screech', 'ктулху', 'культ', 'тварь', 'монстр', 'существ', 'щупаль', 'вой', 'рык', 'летуч', 'крыс', 'насеком'], 'creatures', 'Bug'],
  // horror — напруга, привиди, тіла й жах
  [['whisper', 'breath', 'breathing', 'heartbeat', 'heart', 'scream', 'screaming', 'scratch', 'moan', 'groan', 'ghost', 'spirit', 'phantom', 'haunt', 'horror', 'creepy', 'eerie', 'dread', 'reverse', 'blood', 'gore', 'flesh', 'bone', 'corpse', 'death', 'dying', 'sob', 'crying', 'laugh', 'cackle', 'возглас', 'крик', 'шёпот', 'шепот', 'дыхан', 'призрак', 'дух', 'кровь', 'смех', 'плач', 'стон', 'ужас', 'жуть'], 'horror', 'Ghost'],
  // events — дії, удари, ритуали, бій
  [['door', 'slam', 'glass', 'break', 'explosion', 'blast', 'gun', 'shot', 'gunshot', 'collapse', 'chase', 'combat', 'fight', 'battle', 'drum', 'lock', 'fall', 'impact', 'crash', 'hit', 'punch', 'sword', 'blade', 'knife', 'stab', 'ritual', 'summon', 'spell', 'incantation', 'sacrifice', 'gong', 'footstep', 'step', 'knock', 'event', 'дверь', 'выстрел', 'взрыв', 'бой', 'удар', 'ритуал', 'шаг', 'стук', 'меч', 'жертв'], 'events', 'Zap'],
  // atmosphere — фон, локації, природа, ембієнт
  [['rain', 'storm', 'wind', 'thunder', 'ocean', 'wave', 'sea', 'water', 'drip', 'fire', 'crackle', 'forest', 'jungle', 'desert', 'arctic', 'swamp', 'marsh', 'cave', 'cavern', 'dungeon', 'crypt', 'tomb', 'graveyard', 'cemetery', 'church', 'temple', 'manor', 'mansion', 'attic', 'cellar', 'basement', 'ship', 'harbor', 'dock', 'village', 'town', 'city', 'street', 'tavern', 'inn', 'market', 'clock', 'tick', 'bell', 'toll', 'train', 'fog', 'mist', 'ambient', 'ambience', 'atmos', 'room', 'night', 'underground', 'library', 'birds', 'crow', 'raven', 'owl', 'wood', 'creak', 'дождь', 'ветер', 'гром', 'море', 'волн', 'огонь', 'лес', 'пещер', 'склеп', 'кладбищ', 'церков', 'храм', 'таверн', 'колокол', 'туман', 'ночь', 'комнат', 'птиц'], 'atmosphere', 'CloudFog'],
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
  // Прибрати розширення та службові символи.
  let base = name.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Зрізати службовий префікс «scary sound» (і варіанти) на початку назви.
  base = base.replace(/^scary\s*sounds?\s*/i, '').trim();
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
    // Відсіюємо плейлисти та не-аудіо контейнери (Drive іноді тегує їх як audio/*).
    const driveFiles = (listData.files || []).filter(
      (f) => !/\.(m3u|m3u8|pls|cue|wpl|xspf)$/i.test(f.name || '')
    );

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