import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Імпорт цілої папки з Google Диска (МИТТЄВО, без завантаження файлів).
// payload: { folderId, recursive? }  → перелічує всі аудіофайли (за замовч.
// рекурсивно, включно з підпапками) і повертає [{ id, title, url, category,
// icon, isLoopable }], де url — посилання на публічний стрімер streamDriveAudio.
// Раніше функція качала кожен файл у сховище, що для великих папок (десятки
// файлів) перевищувало ліміт часу й давало 500 «Не удалось импортировать папку».

const APP_ID = Deno.env.get('BASE44_APP_ID');
const STREAM_BASE = `https://base44.app/api/apps/${APP_ID}/functions/streamDriveAudio?fileId=`;
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

// Точніше: підбираємо конкретну іконку під зміст назви (перший збіг виграє),
// щоб пэд був зрозумілий з першого погляду, а не лише за категорією.
const ICON_RULES = [
  [['rain', 'дожд', 'злив'], 'CloudRain'],
  [['storm', 'thunder', 'lightning', 'гром', 'буря', 'молни'], 'CloudLightning'],
  [['wind', 'gale', 'breeze', 'ветер', 'вітер'], 'Wind'],
  [['ocean', 'wave', 'sea', 'water', 'море', 'волн', 'вод'], 'Waves'],
  [['drip', 'drop', 'капл', 'крап'], 'Droplets'],
  [['fire', 'flame', 'crackle', 'burn', 'огон', 'плам', 'костёр', 'костер'], 'Flame'],
  [['forest', 'jungle', 'wood', 'tree', 'лес', 'дерев'], 'TreePine'],
  [['snow', 'arctic', 'ice', 'cold', 'frost', 'снег', 'лёд', 'лед', 'холод'], 'Snowflake'],
  [['mountain', 'cliff', 'гор', 'скал'], 'Mountain'],
  [['fog', 'mist', 'туман', 'мгл'], 'CloudFog'],
  [['night', 'moon', 'ночь', 'ноч', 'лун'], 'Moon'],
  [['sun', 'day', 'dawn', 'солнц', 'сонц', 'день'], 'Sun'],
  [['bird', 'crow', 'raven', 'owl', 'птиц', 'ворон', 'сов'], 'Bird'],
  [['clock', 'tick', 'час', 'тикан'], 'Clock'],
  [['bell', 'toll', 'gong', 'колокол', 'дзвін'], 'Bell'],
  [['train', 'поезд', 'потяг'], 'Train'],
  [['ship', 'boat', 'harbor', 'dock', 'корабл', 'судн', 'порт', 'гавань'], 'Ship'],
  [['church', 'temple', 'cathedral', 'церков', 'храм', 'собор'], 'Church'],
  [['library', 'book', 'библиотек', 'бібліотек', 'книг'], 'BookOpen'],
  [['city', 'town', 'street', 'market', 'tavern', 'inn', 'город', 'улиц', 'таверн', 'рынок', 'місто'], 'Building2'],
  [['key', 'lock', 'ключ', 'замок'], 'KeyRound'],
  [['door', 'дверь', 'двер'], 'DoorOpen'],
  [['footstep', 'step', 'walk', 'шаг', 'крок', 'ход'], 'Footprints'],
  [['knock', 'стук'], 'Hand'],
  [['glass', 'break', 'shatter', 'стекл', 'скл', 'разбит'], 'GlassWater'],
  [['explosion', 'blast', 'bomb', 'взрыв', 'вибух'], 'Bomb'],
  [['gun', 'shot', 'выстрел', 'постріл'], 'Crosshair'],
  [['sword', 'blade', 'knife', 'stab', 'меч', 'клинок', 'нож'], 'Swords'],
  [['ritual', 'summon', 'spell', 'incantation', 'sacrifice', 'ритуал', 'закл', 'жертв'], 'Hexagon'],
  [['drum', 'барабан'], 'Music'],
  [['heart', 'heartbeat', 'pulse', 'сердц', 'серц', 'пульс'], 'HeartPulse'],
  [['whisper', 'шёпот', 'шепот', 'шепіт'], 'Ear'],
  [['breath', 'breathing', 'дыхан', 'дихан'], 'Wind'],
  [['scream', 'shriek', 'screech', 'крик', 'вопл'], 'Megaphone'],
  [['laugh', 'cackle', 'смех', 'регіт'], 'Laugh'],
  [['cry', 'sob', 'moan', 'groan', 'плач', 'стон', 'рыдан'], 'Megaphone'],
  [['ghost', 'spirit', 'phantom', 'haunt', 'призрак', 'дух', 'привид'], 'Ghost'],
  [['blood', 'gore', 'flesh', 'bone', 'corpse', 'кровь', 'кров', 'плоть', 'кост', 'труп'], 'Skull'],
  [['rat', 'mouse', 'крыс', 'мыш', 'миш'], 'Bug'],
  [['bat', 'bats', 'летуч', 'кажан'], 'Bird'],
  [['bee', 'insect', 'swarm', 'насеком', 'рой', 'пчёл', 'пчел'], 'Bug'],
  [['wolf', 'howl', 'волк', 'вой', 'виття'], 'Skull'],
  [['fish', 'deep one', 'dagon', 'hydra', 'рыб', 'риб'], 'Fish'],
  [['tentacle', 'cthulhu', 'eldritch', 'spawn', 'щупаль', 'ктулху'], 'Orbit'],
  [['cult', 'chant', 'chanting', 'культ', 'песнопен'], 'Users'],
  [['eye', 'watch', 'stare', 'глаз', 'око', 'взгляд'], 'Eye'],
  [['cosmic', 'void', 'abyss', 'dimension', 'warp', 'космос', 'бездн', 'пустот', 'измерен'], 'Orbit'],
  [['dream', 'nightmare', 'hallucinat', 'сон', 'кошмар', 'галлюцин'], 'Brain'],
  [['drone', 'tinnitus', 'dissonan', 'дрон', 'звон', 'диссонанс'], 'Volume2'],
  [['jumpscare', 'jump', 'scare', 'sting', 'shock', 'startle', 'лякал', 'испуг', 'пугал'], 'AlertTriangle'],
];

function guessIcon(lower, fallback) {
  for (const [keywords, icon] of ICON_RULES) {
    if (keywords.some((k) => lower.includes(k))) return icon;
  }
  return fallback;
}

function cleanTitle(name) {
  // Прибрати розширення та службові символи.
  let base = name.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Зрізати службовий префікс «scary sound» (і варіанти) на початку назви.
  base = base.replace(/^scary\s*sounds?\s*/i, '').trim();
  // Зрізати числовий префікс-нумерацію на початку (напр. «01 », «12-»).
  base = base.replace(/^\d+\s*[.\-)]?\s*/, '').trim();
  if (!base) return 'Sound';
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

function guessCategory(name) {
  const lower = name.toLowerCase();
  let category = 'atmosphere';
  let catIcon = CATEGORY_ICON.atmosphere;
  for (const [keywords, cat, icon] of KEYWORD_RULES) {
    if (keywords.some((k) => lower.includes(k))) {
      category = cat;
      catIcon = icon;
      break;
    }
  }
  // Спершу пробуємо конкретну іконку за змістом, інакше — іконку категорії.
  const icon = guessIcon(lower, catIcon);
  return { category, icon };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const folderId = body && body.folderId;
    // За замовчуванням обходимо й вкладені підпапки (напр. Scary_sounds/Sounds…).
    // Передайте recursive:false, щоб узяти лише прямі файли папки.
    const recursive = !(body && body.recursive === false);
    if (!folderId) return Response.json({ error: 'folderId is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const FOLDER_MIME = 'application/vnd.google-apps.folder';
    const audioExt = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm|aiff|aif|wma)$/i;
    const playlistExt = /\.(m3u|m3u8|pls|cue|wpl|xspf)$/i;

    // Перелічити всіх прямих дітей папки (з пагінацією).
    async function listChildren(parentId) {
      const out = [];
      let pageToken = '';
      do {
        const p = new URLSearchParams({
          q: `'${parentId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id,name,mimeType)',
          orderBy: 'name',
          pageSize: '300',
          spaces: 'drive',
        });
        if (pageToken) p.set('pageToken', pageToken);
        const r = await fetch(`https://www.googleapis.com/drive/v3/files?${p}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) throw new Error(`Drive list error: ${await r.text()}`);
        const d = await r.json();
        out.push(...(d.files || []));
        pageToken = d.nextPageToken || '';
      } while (pageToken);
      return out;
    }

    // 1) Зібрати аудіофайли — лише з папки, або рекурсивно з підпапок.
    const driveFiles = [];
    const queue = [folderId];
    const seen = new Set();
    while (queue.length) {
      const parentId = queue.shift();
      if (seen.has(parentId)) continue;
      seen.add(parentId);
      const children = await listChildren(parentId);
      for (const c of children) {
        if (c.mimeType === FOLDER_MIME) {
          if (recursive) queue.push(c.id);
        } else if (
          ((c.mimeType || '').includes('audio/') || audioExt.test(c.name || '')) &&
          !playlistExt.test(c.name || '')
        ) {
          driveFiles.push(c);
        }
      }
    }

    // 2) Чисті метадані пэда — без завантаження файлів. Звук грається через
    // публічний стрімер streamDriveAudio за id, тож імпорт миттєвий.
    const sounds = [];
    for (const f of driveFiles) {
      const { category, icon } = guessCategory(f.name || '');
      // Атмосфера/істоти/безумство — зацикленi; події/jumpscare — одноразові.
      const isLoopable = !['events', 'jumpscare'].includes(category);
      sounds.push({
        id: `custom_${f.id}`,
        title: cleanTitle(f.name || 'Sound'),
        url: `${STREAM_BASE}${f.id}`,
        category,
        icon,
        isLoopable,
      });
    }

    return Response.json({ sounds, total: driveFiles.length, imported: sounds.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});