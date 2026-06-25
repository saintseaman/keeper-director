// Master sound catalog — all sounds available in the app
// Each sound has: id, title, category, tags, icon, isLoopable, color

export const SOUND_CATEGORIES = [
  { id: 'atmosphere', label: 'Atmosphere', icon: 'CloudFog' },
  { id: 'events', label: 'Events', icon: 'Zap' },
  { id: 'creatures', label: 'Creatures', icon: 'Bug' },
  { id: 'horror', label: 'Horror', icon: 'Skull' },
  { id: 'madness', label: 'Madness', icon: 'BrainCircuit' },
  { id: 'jumpscare', label: 'Jump Scare', icon: 'AlertTriangle' },
];

export const SOUNDS = [
  // ATMOSPHERE
  { id: 'rain_heavy', title: 'Heavy Rain', category: 'atmosphere', tags: ['outdoor', 'storm', 'night'], icon: 'CloudRain', isLoopable: true, color: 'brass' },
  { id: 'rain_light', title: 'Light Rain', category: 'atmosphere', tags: ['outdoor', 'calm', 'night'], icon: 'CloudDrizzle', isLoopable: true, color: 'brass' },
  { id: 'wind_howling', title: 'Howling Wind', category: 'atmosphere', tags: ['outdoor', 'storm', 'desolate'], icon: 'Wind', isLoopable: true, color: 'brass' },
  { id: 'wind_gentle', title: 'Gentle Breeze', category: 'atmosphere', tags: ['outdoor', 'calm'], icon: 'Wind', isLoopable: true, color: 'brass' },
  { id: 'thunder', title: 'Thunder', category: 'atmosphere', tags: ['storm', 'outdoor', 'dramatic'], icon: 'CloudLightning', isLoopable: true, color: 'brass' },
  { id: 'ocean_waves', title: 'Ocean Waves', category: 'atmosphere', tags: ['ocean', 'ship', 'coast'], icon: 'Waves', isLoopable: true, color: 'brass' },
  { id: 'fire_crackling', title: 'Crackling Fire', category: 'atmosphere', tags: ['indoor', 'mansion', 'warm'], icon: 'Flame', isLoopable: true, color: 'brass' },
  { id: 'clock_ticking', title: 'Clock Ticking', category: 'atmosphere', tags: ['indoor', 'mansion', 'tension'], icon: 'Clock', isLoopable: true, color: 'brass' },
  { id: 'dripping_water', title: 'Dripping Water', category: 'atmosphere', tags: ['cave', 'basement', 'tunnel'], icon: 'Droplets', isLoopable: true, color: 'brass' },
  { id: 'creaking_wood', title: 'Creaking Wood', category: 'atmosphere', tags: ['mansion', 'ship', 'old'], icon: 'TreePine', isLoopable: true, color: 'brass' },
  { id: 'footsteps_slow', title: 'Slow Footsteps', category: 'atmosphere', tags: ['indoor', 'stalking', 'tension'], icon: 'Footprints', isLoopable: true, color: 'brass' },
  { id: 'chains_rattling', title: 'Rattling Chains', category: 'atmosphere', tags: ['dungeon', 'prison', 'dark'], icon: 'Link', isLoopable: true, color: 'brass' },
  { id: 'fog_ambience', title: 'Fog Ambience', category: 'atmosphere', tags: ['outdoor', 'mist', 'eerie'], icon: 'CloudFog', isLoopable: true, color: 'brass' },
  { id: 'library_quiet', title: 'Quiet Library', category: 'atmosphere', tags: ['library', 'university', 'study'], icon: 'BookOpen', isLoopable: true, color: 'brass' },
  { id: 'train_moving', title: 'Moving Train', category: 'atmosphere', tags: ['train', 'travel', 'rhythm'], icon: 'Train', isLoopable: true, color: 'brass' },
  { id: 'church_bells', title: 'Church Bells', category: 'atmosphere', tags: ['church', 'town', 'ominous'], icon: 'Bell', isLoopable: false, color: 'brass' },
  { id: 'arctic_wind', title: 'Arctic Wind', category: 'atmosphere', tags: ['arctic', 'cold', 'expedition'], icon: 'Snowflake', isLoopable: true, color: 'brass' },
  { id: 'jungle_ambient', title: 'Jungle Night', category: 'atmosphere', tags: ['jungle', 'expedition', 'insects'], icon: 'TreePalm', isLoopable: true, color: 'brass' },
  { id: 'desert_wind', title: 'Desert Wind', category: 'atmosphere', tags: ['desert', 'egypt', 'sand'], icon: 'Sun', isLoopable: true, color: 'brass' },
  { id: 'underground', title: 'Deep Underground', category: 'atmosphere', tags: ['cave', 'catacomb', 'deep'], icon: 'Mountain', isLoopable: true, color: 'brass' },

  // EVENTS
  { id: 'door_open_creak', title: 'Door Creak', category: 'events', tags: ['door', 'enter', 'suspense'], icon: 'DoorOpen', isLoopable: false, color: 'burgundy' },
  { id: 'door_slam', title: 'Door Slam', category: 'events', tags: ['door', 'loud', 'shock'], icon: 'DoorClosed', isLoopable: false, color: 'burgundy' },
  { id: 'glass_break', title: 'Breaking Glass', category: 'events', tags: ['break', 'window', 'shock'], icon: 'GlassWater', isLoopable: false, color: 'burgundy' },
  { id: 'explosion', title: 'Explosion', category: 'events', tags: ['combat', 'destruction', 'loud'], icon: 'Bomb', isLoopable: false, color: 'burgundy' },
  { id: 'gunshot', title: 'Gunshot', category: 'events', tags: ['combat', 'weapon', 'shock'], icon: 'Crosshair', isLoopable: false, color: 'burgundy' },
  { id: 'collapse', title: 'Cave Collapse', category: 'events', tags: ['cave', 'destruction', 'panic'], icon: 'Mountain', isLoopable: false, color: 'burgundy' },
  { id: 'chase_music', title: 'Chase', category: 'events', tags: ['chase', 'run', 'tension'], icon: 'Zap', isLoopable: true, color: 'burgundy' },
  { id: 'combat_drums', title: 'Combat Drums', category: 'events', tags: ['combat', 'fight', 'action'], icon: 'Swords', isLoopable: true, color: 'burgundy' },
  { id: 'investigation', title: 'Investigation', category: 'events', tags: ['search', 'clue', 'mystery'], icon: 'Search', isLoopable: true, color: 'burgundy' },
  { id: 'discovery', title: 'Discovery', category: 'events', tags: ['revelation', 'clue', 'dramatic'], icon: 'Lightbulb', isLoopable: false, color: 'burgundy' },
  { id: 'lock_pick', title: 'Lock Picking', category: 'events', tags: ['lock', 'break', 'stealth'], icon: 'KeyRound', isLoopable: false, color: 'burgundy' },
  { id: 'falling', title: 'Falling', category: 'events', tags: ['fall', 'pit', 'danger'], icon: 'ArrowDown', isLoopable: false, color: 'burgundy' },

  // CREATURES
  { id: 'cultist_chant', title: 'Cultist Chant', category: 'creatures', tags: ['cult', 'ritual', 'human'], icon: 'Users', isLoopable: true, color: 'burgundy' },
  { id: 'deep_one_gurgle', title: 'Deep One', category: 'creatures', tags: ['deep_one', 'water', 'monster'], icon: 'Fish', isLoopable: false, color: 'burgundy' },
  { id: 'shoggoth_mass', title: 'Shoggoth', category: 'creatures', tags: ['shoggoth', 'ancient', 'horror'], icon: 'CircleDot', isLoopable: true, color: 'burgundy' },
  { id: 'byakhee_screech', title: 'Byakhee Screech', category: 'creatures', tags: ['byakhee', 'flying', 'monster'], icon: 'Bird', isLoopable: false, color: 'burgundy' },
  { id: 'elder_thing', title: 'Elder Presence', category: 'creatures', tags: ['elder', 'ancient', 'cosmic'], icon: 'Eye', isLoopable: true, color: 'burgundy' },
  { id: 'ghoul_snarl', title: 'Ghoul Snarl', category: 'creatures', tags: ['ghoul', 'underground', 'monster'], icon: 'Skull', isLoopable: false, color: 'burgundy' },
  { id: 'mi_go_buzz', title: 'Mi-Go Buzzing', category: 'creatures', tags: ['mi_go', 'alien', 'insect'], icon: 'Bug', isLoopable: true, color: 'burgundy' },
  { id: 'nightgaunt', title: 'Nightgaunt', category: 'creatures', tags: ['nightgaunt', 'flying', 'silent'], icon: 'Eclipse', isLoopable: true, color: 'burgundy' },

  // HORROR
  { id: 'whisper_voices', title: 'Whispers', category: 'horror', tags: ['whisper', 'voice', 'paranoia'], icon: 'Ear', isLoopable: true, color: 'burgundy' },
  { id: 'heavy_breathing', title: 'Heavy Breathing', category: 'horror', tags: ['breath', 'close', 'panic'], icon: 'Wind', isLoopable: true, color: 'burgundy' },
  { id: 'heartbeat_slow', title: 'Slow Heartbeat', category: 'horror', tags: ['heart', 'tension', 'dread'], icon: 'Heart', isLoopable: true, color: 'burgundy' },
  { id: 'heartbeat_fast', title: 'Racing Heart', category: 'horror', tags: ['heart', 'panic', 'fear'], icon: 'HeartPulse', isLoopable: true, color: 'burgundy' },
  { id: 'scratching', title: 'Scratching', category: 'horror', tags: ['scratch', 'wall', 'unknown'], icon: 'Grip', isLoopable: true, color: 'burgundy' },
  { id: 'distant_scream', title: 'Distant Scream', category: 'horror', tags: ['scream', 'far', 'unknown'], icon: 'Megaphone', isLoopable: false, color: 'burgundy' },
  { id: 'eerie_music_box', title: 'Music Box', category: 'horror', tags: ['music', 'child', 'eerie'], icon: 'Music', isLoopable: true, color: 'burgundy' },
  { id: 'reverse_speech', title: 'Reversed Speech', category: 'horror', tags: ['voice', 'backwards', 'occult'], icon: 'Undo', isLoopable: true, color: 'burgundy' },
  { id: 'metal_scraping', title: 'Metal Scraping', category: 'horror', tags: ['metal', 'industrial', 'dread'], icon: 'Wrench', isLoopable: true, color: 'burgundy' },
  { id: 'moaning', title: 'Moaning', category: 'horror', tags: ['voice', 'ghost', 'pain'], icon: 'Ghost', isLoopable: true, color: 'burgundy' },

  // MADNESS
  { id: 'sanity_loss', title: 'Sanity Loss', category: 'madness', tags: ['madness', 'insanity', 'mind'], icon: 'BrainCircuit', isLoopable: false, color: 'burgundy' },
  { id: 'distortion', title: 'Reality Warp', category: 'madness', tags: ['madness', 'distortion', 'unreal'], icon: 'Spline', isLoopable: true, color: 'burgundy' },
  { id: 'tinnitus', title: 'Tinnitus', category: 'madness', tags: ['ring', 'ear', 'madness'], icon: 'Ear', isLoopable: true, color: 'burgundy' },
  { id: 'laughter_mad', title: 'Mad Laughter', category: 'madness', tags: ['laugh', 'insanity', 'human'], icon: 'Laugh', isLoopable: false, color: 'burgundy' },
  { id: 'cosmic_drone', title: 'Cosmic Drone', category: 'madness', tags: ['cosmic', 'void', 'ancient'], icon: 'Orbit', isLoopable: true, color: 'burgundy' },
  { id: 'multiple_voices', title: 'Overlapping Voices', category: 'madness', tags: ['voices', 'crowd', 'madness'], icon: 'Users', isLoopable: true, color: 'burgundy' },

  // JUMP SCARES
  { id: 'jump_slam', title: 'SLAM', category: 'jumpscare', tags: ['shock', 'loud', 'instant'], icon: 'AlertTriangle', isLoopable: false, color: 'red' },
  { id: 'jump_scream', title: 'SCREAM', category: 'jumpscare', tags: ['scream', 'loud', 'instant'], icon: 'AlertTriangle', isLoopable: false, color: 'red' },
  { id: 'jump_shatter', title: 'SHATTER', category: 'jumpscare', tags: ['glass', 'loud', 'instant'], icon: 'AlertTriangle', isLoopable: false, color: 'red' },
  { id: 'jump_roar', title: 'ROAR', category: 'jumpscare', tags: ['monster', 'loud', 'instant'], icon: 'AlertTriangle', isLoopable: false, color: 'red' },
  { id: 'jump_whisper', title: 'WHISPER', category: 'jumpscare', tags: ['close', 'surprise', 'instant'], icon: 'AlertTriangle', isLoopable: false, color: 'red' },
  { id: 'jump_bang', title: 'BANG', category: 'jumpscare', tags: ['gun', 'loud', 'instant'], icon: 'AlertTriangle', isLoopable: false, color: 'red' },
];

export const PRESET_SCENES = [
  {
    id: 'scene_mansion',
    title: 'Abandoned Mansion',
    description: 'A decrepit Victorian mansion. Dust motes float in moonlight through broken windows.',
    category: 'location',
    icon: 'Building',
    tags: ['mansion', 'indoor', 'classic', 'investigation'],
    layers: [
      { sound_name: 'Creaking Wood', volume: 40, icon: 'TreePine' },
      { sound_name: 'Howling Wind', volume: 25, icon: 'Wind' },
      { sound_name: 'Clock Ticking', volume: 15, icon: 'Clock' },
      { sound_name: 'Slow Footsteps', volume: 10, icon: 'Footprints' },
    ],
    timeline_events: [
      { time_seconds: 30, sound_name: 'Door Creak', description: 'A door creaks somewhere upstairs' },
      { time_seconds: 120, sound_name: 'Slow Footsteps', description: 'Footsteps from above' },
      { time_seconds: 240, sound_name: 'Whispers', description: 'Faint whispers from the walls' },
      { time_seconds: 360, sound_name: 'Door Slam', description: 'A door slams shut' },
    ],
  },
  {
    id: 'scene_asylum',
    title: 'Abandoned Asylum',
    description: 'Long corridors with peeling paint. Flickering lights cast dancing shadows.',
    category: 'location',
    icon: 'Building2',
    tags: ['hospital', 'asylum', 'indoor', 'madness'],
    layers: [
      { sound_name: 'Dripping Water', volume: 30, icon: 'Droplets' },
      { sound_name: 'Metal Scraping', volume: 15, icon: 'Wrench' },
      { sound_name: 'Distant Scream', volume: 10, icon: 'Megaphone' },
      { sound_name: 'Slow Footsteps', volume: 20, icon: 'Footprints' },
    ],
    timeline_events: [
      { time_seconds: 45, sound_name: 'Metal Scraping', description: 'Something scrapes along the wall' },
      { time_seconds: 150, sound_name: 'Mad Laughter', description: 'Laughter echoes from a distant ward' },
      { time_seconds: 300, sound_name: 'Door Slam', description: 'Heavy door slams' },
    ],
  },
  {
    id: 'scene_catacombs',
    title: 'The Catacombs',
    description: 'Narrow passages carved from ancient stone. The air is cold and stale.',
    category: 'location',
    icon: 'Skull',
    tags: ['underground', 'catacomb', 'dark', 'ancient'],
    layers: [
      { sound_name: 'Dripping Water', volume: 35, icon: 'Droplets' },
      { sound_name: 'Deep Underground', volume: 40, icon: 'Mountain' },
      { sound_name: 'Rattling Chains', volume: 10, icon: 'Link' },
      { sound_name: 'Whispers', volume: 8, icon: 'Ear' },
    ],
    timeline_events: [
      { time_seconds: 60, sound_name: 'Scratching', description: 'Scratching from behind the walls' },
      { time_seconds: 180, sound_name: 'Ghoul Snarl', description: 'A wet snarl from the darkness' },
      { time_seconds: 300, sound_name: 'Cave Collapse', description: 'Rocks fall behind you' },
    ],
  },
  {
    id: 'scene_ritual',
    title: 'The Ritual',
    description: 'Hooded figures circle a glowing sigil. Their chanting grows louder.',
    category: 'ritual',
    icon: 'Hexagon',
    tags: ['cult', 'ritual', 'ceremony', 'occult'],
    layers: [
      { sound_name: 'Cultist Chant', volume: 50, icon: 'Users' },
      { sound_name: 'Cosmic Drone', volume: 30, icon: 'Orbit' },
      { sound_name: 'Crackling Fire', volume: 20, icon: 'Flame' },
      { sound_name: 'Heavy Breathing', volume: 10, icon: 'Wind' },
    ],
    timeline_events: [
      { time_seconds: 60, sound_name: 'Discovery', description: 'The chanting intensifies' },
      { time_seconds: 180, sound_name: 'Elder Presence', description: 'Something answers the call' },
      { time_seconds: 300, sound_name: 'Sanity Loss', description: 'Reality begins to fracture' },
    ],
  },
  {
    id: 'scene_ship',
    title: 'Ship at Sea',
    description: 'A tramp steamer rolling through fog-shrouded waters.',
    category: 'location',
    icon: 'Ship',
    tags: ['ship', 'ocean', 'fog', 'travel'],
    layers: [
      { sound_name: 'Ocean Waves', volume: 45, icon: 'Waves' },
      { sound_name: 'Creaking Wood', volume: 30, icon: 'TreePine' },
      { sound_name: 'Fog Ambience', volume: 20, icon: 'CloudFog' },
      { sound_name: 'Rattling Chains', volume: 10, icon: 'Link' },
    ],
    timeline_events: [
      { time_seconds: 90, sound_name: 'Deep One', description: 'Something surfaces nearby' },
      { time_seconds: 240, sound_name: 'Whispers', description: 'The sea whispers' },
    ],
  },
  {
    id: 'scene_arctic',
    title: 'Arctic Expedition',
    description: 'Endless white expanse. The wind never stops. Something watches from the ice.',
    category: 'location',
    icon: 'Snowflake',
    tags: ['arctic', 'cold', 'expedition', 'isolated'],
    layers: [
      { sound_name: 'Arctic Wind', volume: 50, icon: 'Snowflake' },
      { sound_name: 'Howling Wind', volume: 30, icon: 'Wind' },
      { sound_name: 'Slow Heartbeat', volume: 10, icon: 'Heart' },
    ],
    timeline_events: [
      { time_seconds: 120, sound_name: 'Elder Presence', description: 'Something ancient stirs beneath the ice' },
      { time_seconds: 300, sound_name: 'Sanity Loss', description: 'The isolation takes its toll' },
    ],
  },
  {
    id: 'scene_church',
    title: 'Desecrated Church',
    description: 'Overturned pews. Defaced saints. The altar is stained dark.',
    category: 'location',
    icon: 'Church',
    tags: ['church', 'indoor', 'occult', 'dark'],
    layers: [
      { sound_name: 'Howling Wind', volume: 20, icon: 'Wind' },
      { sound_name: 'Whispers', volume: 25, icon: 'Ear' },
      { sound_name: 'Music Box', volume: 10, icon: 'Music' },
      { sound_name: 'Moaning', volume: 8, icon: 'Ghost' },
    ],
    timeline_events: [
      { time_seconds: 60, sound_name: 'Church Bells', description: 'The bell tolls, though no one pulls the rope' },
      { time_seconds: 200, sound_name: 'Reversed Speech', description: 'Voices speak backwards' },
    ],
  },
  {
    id: 'scene_library',
    title: 'Forbidden Library',
    description: 'Ancient tomes line the walls. Some of them seem to breathe.',
    category: 'location',
    icon: 'BookOpen',
    tags: ['library', 'university', 'study', 'occult'],
    layers: [
      { sound_name: 'Quiet Library', volume: 40, icon: 'BookOpen' },
      { sound_name: 'Clock Ticking', volume: 25, icon: 'Clock' },
      { sound_name: 'Crackling Fire', volume: 15, icon: 'Flame' },
      { sound_name: 'Whispers', volume: 5, icon: 'Ear' },
    ],
    timeline_events: [
      { time_seconds: 90, sound_name: 'Discovery', description: 'You find a passage that shouldn\'t be there' },
      { time_seconds: 240, sound_name: 'Sanity Loss', description: 'The text starts to make terrible sense' },
    ],
  },
  {
    id: 'scene_cemetery',
    title: 'Midnight Cemetery',
    description: 'Fog clings to weathered headstones. The ground feels... soft.',
    category: 'location',
    icon: 'Cross',
    tags: ['cemetery', 'outdoor', 'night', 'undead'],
    layers: [
      { sound_name: 'Fog Ambience', volume: 40, icon: 'CloudFog' },
      { sound_name: 'Gentle Breeze', volume: 25, icon: 'Wind' },
      { sound_name: 'Scratching', volume: 15, icon: 'Grip' },
      { sound_name: 'Heavy Breathing', volume: 8, icon: 'Wind' },
    ],
    timeline_events: [
      { time_seconds: 60, sound_name: 'Ghoul Snarl', description: 'Something moves between the graves' },
      { time_seconds: 180, sound_name: 'Moaning', description: 'A low moan from underground' },
    ],
  },
  {
    id: 'scene_chase',
    title: 'The Chase',
    description: 'It found you. Run.',
    category: 'event',
    icon: 'Zap',
    tags: ['chase', 'action', 'panic', 'tension'],
    layers: [
      { sound_name: 'Chase', volume: 50, icon: 'Zap' },
      { sound_name: 'Racing Heart', volume: 40, icon: 'HeartPulse' },
      { sound_name: 'Heavy Breathing', volume: 30, icon: 'Wind' },
    ],
    timeline_events: [
      { time_seconds: 15, sound_name: 'Door Slam', description: 'A door bursts open behind you' },
      { time_seconds: 45, sound_name: 'Breaking Glass', description: 'Glass shatters as it follows' },
      { time_seconds: 90, sound_name: 'Falling', description: 'You stumble' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH: sound title → sound id
// Побудовано автоматично з SOUNDS. Новий звук додається ЛИШЕ в SOUNDS —
// мапа оновлюється сама. Раніше ця мапа дублювалася в 3 файлах.
// ─────────────────────────────────────────────────────────────
const SOUND_NAME_TO_ID = SOUNDS.reduce((acc, s) => {
  acc[s.title] = s.id;
  return acc;
}, {});

export function getSoundIdByName(name) {
  return SOUND_NAME_TO_ID[name] || null;
}

export function getSoundsByCategory(category) {
  return SOUNDS.filter(s => s.category === category);
}

// Расстояние Левенштейна — для устойчивости к опечаткам (короткие слова).
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Профессиональный поиск: несколько слов (AND), по title+tags+category,
// fuzzy-устойчивость к опечаткам. Возвращает результаты, отсортированные
// по релевантности (точное совпадение в названии — выше).
export function searchSounds(query) {
  const raw = (query || '').toLowerCase().trim();
  if (!raw) return SOUNDS;
  const terms = raw.split(/\s+/).filter(Boolean);

  const scoreSound = (s) => {
    const title = s.title.toLowerCase();
    const haystack = [title, ...s.tags, s.category];
    let total = 0;
    for (const term of terms) {
      let best = 0;
      // прямое вхождение
      if (title.includes(term)) best = title.startsWith(term) ? 100 : 60;
      else if (s.tags.some(t => t.includes(term))) best = 50;
      else if (s.category.includes(term)) best = 40;
      else {
        // fuzzy: ищем слово в haystack с близким расстоянием
        for (const field of haystack) {
          for (const word of field.split(/[\s_-]+/)) {
            if (!word) continue;
            const maxDist = term.length <= 4 ? 1 : 2;
            if (Math.abs(word.length - term.length) <= maxDist && levenshtein(word, term) <= maxDist) {
              best = Math.max(best, 25);
            }
          }
        }
      }
      if (best === 0) return -1; // это слово не нашлось — звук не подходит (AND)
      total += best;
    }
    return total;
  };

  return SOUNDS
    .map(s => ({ s, score: scoreSound(s) }))
    .filter(x => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.s);
}