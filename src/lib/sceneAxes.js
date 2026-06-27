// ─────────────────────────────────────────────────────────────
// Оси сцены — многомерная классификация звуков «по обстоятельствам».
// В отличие от плоской category (тип звука), оси описывают КОНТЕКСТ:
// где мы (локация), что происходит (действие), погода/время, настроение.
//
// Каждый пэд может нести теги по нескольким осям одновременно.
// Теги хранятся в override пэда под ключом `axes` = { location: [...], ... }.
// Если ручных тегов нет — угадываем автоматически по названию (autoAxes).
// ─────────────────────────────────────────────────────────────
import {
  Building2, Trees, Beer, Mountain, Waves, Home, Skull, Landmark,
  Compass, Swords, MessageCircle, Footprints, Hexagon, Coffee,
  CloudRain, Sun, CloudLightning, Moon, CloudFog,
  Smile, Flame, Ghost, HelpCircle,
  BookOpen, Eye, Microscope, Ship, Library, Brain,
  Anchor, Fish, Pentagon, Tornado, Snowflake, Star,
  Car, Train, Factory, DoorOpen, Spade, Hammer, Wind,
} from 'lucide-react';

// Иконки, доступные для пользовательских сегментов (имя → компонент).
export const AXIS_ICON_CHOICES = {
  Skull, Ghost, Eye, Brain, Star, Pentagon, Hexagon, Flame,
  Building2, Home, Trees, Mountain, Waves, Anchor, Ship, Fish,
  Landmark, Library, BookOpen, Microscope, Compass, Swords,
  MessageCircle, Footprints, Coffee, Beer, CloudRain, CloudLightning,
  CloudFog, Moon, Sun, Snowflake, Tornado, Smile, HelpCircle,
  Car, Train, Factory, DoorOpen, Spade, Hammer, Wind,
};

// Каждая ось: id, label, иконка-«заголовок», и список значений.
// value.kw — ключевые слова (EN + RU/UA) для авто-определения по названию.
export const SCENE_AXES = [
  {
    id: 'location',
    label: 'Локация',
    color: 'sky',
    values: [
      { id: 'city', label: 'Город', icon: Building2, kw: ['city', 'town', 'street', 'urban', 'город', 'улиц', 'місто'] },
      { id: 'suburb', label: 'Пригород', icon: Home, kw: ['suburb', 'village', 'house', 'home', 'manor', 'пригород', 'деревн', 'дом', 'село'] },
      { id: 'cafe', label: 'Кафе/Таверна', icon: Beer, kw: ['cafe', 'tavern', 'inn', 'pub', 'bar', 'restaurant', 'кафе', 'таверн', 'бар', 'трактир'] },
      { id: 'forest', label: 'Лес', icon: Trees, kw: ['forest', 'jungle', 'wood', 'tree', 'swamp', 'nature', 'лес', 'ліс', 'природ', 'дик', 'джунгл', 'болот'] },
      { id: 'car', label: 'Машина', icon: Car, kw: ['car', 'vehicle', 'engine', 'auto', 'motorcycle', 'foley', 'авто', 'машин', 'двигун', 'двигат', 'мотоцикл', 'фари'] },
      { id: 'train', label: 'Поезд/Вокзал', icon: Train, kw: ['train', 'station', 'platform', 'rail', 'потяг', 'поїзд', 'поезд', 'вокзал', 'платформ'] },
      { id: 'factory', label: 'Завод', icon: Factory, kw: ['factory', 'industrial', 'crane', 'workshop', 'завод', 'кран', 'цех', 'фабр', 'заводськ'] },
      { id: 'dungeon', label: 'Подземелье', icon: Mountain, kw: ['dungeon', 'cave', 'crypt', 'tomb', 'cellar', 'basement', 'underground', 'подземель', 'пещер', 'склеп', 'подвал'] },
      { id: 'sea', label: 'Море', icon: Waves, kw: ['sea', 'ocean', 'ship', 'harbor', 'dock', 'beach', 'wave', 'river', 'water', 'море', 'океан', 'хвил', 'річк', 'корабл', 'порт', 'пляж'] },
      { id: 'temple', label: 'Храм', icon: Landmark, kw: ['church', 'temple', 'cathedral', 'shrine', 'bell', 'церков', 'храм', 'собор', 'дзвон'] },
      { id: 'asylum', label: 'Лечебница', icon: Brain, kw: ['asylum', 'sanatorium', 'hospital', 'madhouse', 'лечебниц', 'психиатр', 'больниц', 'санатор'] },
      { id: 'library', label: 'Библиотека', icon: Library, kw: ['library', 'archive', 'study', 'arkham', 'miskatonic', 'библиотек', 'архив', 'кабинет'] },
      { id: 'university', label: 'Университет', icon: BookOpen, kw: ['university', 'college', 'academy', 'miskatonic', 'университет', 'академ', 'колледж'] },
      { id: 'ruins', label: 'Руины', icon: Pentagon, kw: ['ruins', 'rlyeh', 'cyclopean', 'ancient city', 'руин', 'рльех', 'развалин', 'древн'] },
      { id: 'ship_deck', label: 'Корабль', icon: Ship, kw: ['ship', 'vessel', 'boat', 'deck', 'корабл', 'судно', 'палуб'] },
    ],
  },
  {
    id: 'action',
    label: 'Действие',
    color: 'emerald',
    values: [
      { id: 'explore', label: 'Исследование', icon: Compass, kw: ['explore', 'investigation', 'ambient', 'ambience', 'mystery', 'исследован', 'расследован', 'эмбиент', 'фон'] },
      { id: 'combat', label: 'Бой', icon: Swords, kw: ['combat', 'fight', 'battle', 'chase', 'drum', 'war', 'бой', 'битва', 'сражен', 'погон', 'барабан'] },
      { id: 'dialogue', label: 'Диалог', icon: MessageCircle, kw: ['dialogue', 'talk', 'conversation', 'social', 'диалог', 'разговор', 'беседа'] },
      { id: 'travel', label: 'Путешествие', icon: Footprints, kw: ['travel', 'journey', 'road', 'walk', 'march', 'путешеств', 'дорог', 'поход', 'марш'] },
      { id: 'ritual', label: 'Ритуал', icon: Hexagon, kw: ['ritual', 'summon', 'spell', 'incantation', 'sacrifice', 'chant', 'ритуал', 'призыв', 'закл', 'жертв'] },
      { id: 'rest', label: 'Отдых', icon: Coffee, kw: ['rest', 'calm', 'peace', 'sleep', 'camp', 'отдых', 'покой', 'привал', 'лагерь', 'сон'] },
      { id: 'investigate', label: 'Расследование', icon: Eye, kw: ['investigate', 'clue', 'search', 'detective', 'расследов', 'улик', 'поиск', 'обыск'] },
      { id: 'research', label: 'Исследование тайн', icon: Microscope, kw: ['research', 'lore', 'tome', 'study', 'occult', 'исследован тайн', 'фолиант', 'оккульт', 'манускрипт'] },
      { id: 'sanity', label: 'Безумие', icon: Brain, kw: ['sanity', 'madness', 'insanity', 'panic', 'безуми', 'рассудок', 'паник', 'помешат'] },
      { id: 'summon', label: 'Призыв', icon: Star, kw: ['summon', 'awaken', 'great old one', 'cthulhu', 'призыв', 'пробужд', 'ктулху', 'древн'] },
      { id: 'creak', label: 'Скрип', icon: Hammer, kw: ['creak', 'squeak', 'metal scrape', 'скрип', 'скоблен', 'дребезг'] },
      { id: 'impact', label: 'Удар', icon: Swords, kw: ['impact', 'hit', 'punch', 'gunshot', 'shot', 'удар', 'постріл', 'выстрел'] },
      { id: 'door', label: 'Двери', icon: DoorOpen, kw: ['door', 'gate', 'slam', 'дверь', 'двер', 'ворот'] },
      { id: 'cards', label: 'Карты/Игра', icon: Spade, kw: ['card', 'dice', 'deal', 'gambl', 'карт', 'грал', 'кост'] },
    ],
  },
  {
    id: 'weather',
    label: 'Погода',
    color: 'violet',
    values: [
      { id: 'rain', label: 'Дождь', icon: CloudRain, kw: ['rain', 'drizzle', 'дождь', 'дощ', 'ливень'] },
      { id: 'sunny', label: 'Солнечно', icon: Sun, kw: ['sun', 'sunny', 'day', 'clear', 'солнц', 'сонц', 'ясн', 'день'] },
      { id: 'storm', label: 'Гроза', icon: CloudLightning, kw: ['storm', 'thunder', 'lightning', 'гроза', 'гром', 'буря', 'молни'] },
      { id: 'night', label: 'Ночь', icon: Moon, kw: ['night', 'dark', 'moon', 'ночь', 'ноч', 'тьма', 'лун'] },
      { id: 'fog', label: 'Туман', icon: CloudFog, kw: ['fog', 'mist', 'туман', 'мгл'] },
      { id: 'wind', label: 'Ветер', icon: Wind, kw: ['wind', 'gust', 'breeze', 'gale', 'ветер', 'вітер', 'порив', 'ураган'] },
      { id: 'fire', label: 'Огонь', icon: Flame, kw: ['fire', 'flame', 'campfire', 'burning', 'огонь', 'вогонь', 'вогню', 'полум', 'пожеж'] },
      { id: 'underwater', label: 'Под водой', icon: Fish, kw: ['underwater', 'deep', 'abyss', 'submerged', 'под вод', 'глубин', 'бездн', 'затоплен'] },
      { id: 'cosmic', label: 'Космос', icon: Star, kw: ['cosmic', 'void', 'stars', 'space', 'космос', 'пустот', 'звёзд', 'звезд', 'бездн'] },
      { id: 'snow', label: 'Снег', icon: Snowflake, kw: ['snow', 'blizzard', 'ice', 'arctic', 'снег', 'метел', 'лёд', 'лед', 'арктик'] },
    ],
  },
  {
    id: 'mood',
    label: 'Настроение',
    color: 'rose',
    values: [
      { id: 'calm', label: 'Спокойно', icon: Smile, kw: ['calm', 'peace', 'gentle', 'soft', 'спокой', 'мирн', 'тих'] },
      { id: 'tense', label: 'Напряжённо', icon: Flame, kw: ['tense', 'suspense', 'danger', 'напряж', 'опасн', 'тревож'] },
      { id: 'horror', label: 'Ужас', icon: Ghost, kw: ['horror', 'creepy', 'eerie', 'dread', 'fear', 'scream', 'whisper', 'ужас', 'жуть', 'страх', 'крик', 'шёпот', 'шепот'] },
      { id: 'mystery', label: 'Тайна', icon: HelpCircle, kw: ['mystery', 'eerie', 'unknown', 'тайна', 'загадк', 'неизвестн'] },
    ],
  },
];

// Цветовые классы чипов (литеральные строки — чтобы их не вырезал purge).
export const AXIS_CHIP_CLASS = {
  sky:     { on: 'bg-sky-500/25 border-sky-400/70 text-sky-100',         off: 'border-white/10 text-sky-300/50 hover:border-sky-400/40' },
  emerald: { on: 'bg-emerald-500/25 border-emerald-400/70 text-emerald-100', off: 'border-white/10 text-emerald-300/50 hover:border-emerald-400/40' },
  violet:  { on: 'bg-violet-500/25 border-violet-400/70 text-violet-100', off: 'border-white/10 text-violet-300/50 hover:border-violet-400/40' },
  rose:    { on: 'bg-rose-500/25 border-rose-400/70 text-rose-100',       off: 'border-white/10 text-rose-300/50 hover:border-rose-400/40' },
};

// Реестр пользовательских сегментов { [axisId]: [{ id, label, icon, kw }] }.
// useAxes держит его в синхроне со storage, чтобы axisValue() резолвил и кастомные.
let customRegistry = {};
export function setCustomRegistry(map) {
  customRegistry = map || {};
}

// Резолвер иконки: built-in хранят компонент, кастомные — имя (строку) Lucide.
export function resolveAxisIcon(icon) {
  if (!icon) return HelpCircle;
  if (typeof icon !== 'string') return icon; // уже компонент
  return AXIS_ICON_CHOICES[icon] || HelpCircle;
}

// Быстрый доступ к значению оси по id (built-in + кастомные).
export function axisValue(axisId, valueId) {
  const axis = SCENE_AXES.find((a) => a.id === axisId);
  const builtIn = axis?.values.find((v) => v.id === valueId);
  if (builtIn) return builtIn;
  const custom = (customRegistry[axisId] || []).find((v) => v.id === valueId);
  if (custom) return { ...custom, icon: resolveAxisIcon(custom.icon) };
  return null;
}

// Авто-определение тегов пэда по его названию (+ старая category как подсказка).
// Возвращает { location: [...ids], action: [...], weather: [...], mood: [...] }.
export function autoAxes(pad) {
  const text = `${pad?.title || ''} ${pad?.category || ''}`.toLowerCase();
  const result = {};
  for (const axis of SCENE_AXES) {
    const all = [...axis.values, ...(customRegistry[axis.id] || [])];
    const hits = all
      .filter((v) => (v.kw || []).some((k) => text.includes(k)))
      .map((v) => v.id);
    if (hits.length) result[axis.id] = hits;
  }
  return result;
}

// Итоговые теги пэда. Приоритет источников:
//  1) ручной override (override.axes) — пользователь правил вручную;
//  2) сохранённые на записи пэда оси (pad.axes) — ground truth с момента импорта;
//  3) авто-угадывание по имени (autoAxes) — легаси-фоллбэк для старых пэдов
//     без сохранённых осей.
// Так мы перестаём перегадывать оси в рантайме для каждого импортированного звука.
export function padAxes(pad, override) {
  const manual = override?.axes || {};
  const stored = pad?.axes || {};
  const hasStored = Object.values(stored).some((v) => Array.isArray(v) && v.length);
  const auto = hasStored ? {} : autoAxes(pad);
  const merged = {};
  for (const axis of SCENE_AXES) {
    const m = manual[axis.id];
    const s = stored[axis.id];
    if (Array.isArray(m) && m.length) merged[axis.id] = m;
    else if (Array.isArray(s) && s.length) merged[axis.id] = s;
    else if (auto[axis.id]) merged[axis.id] = auto[axis.id];
    else merged[axis.id] = [];
  }
  return merged;
}

// Список осей, по которым у пэда НЕТ ни одного тега (ни ручного, ни авто).
// Используется в панели «Теги» для подсветки звуков, которые надо доразметить.
export function missingAxes(axes) {
  return SCENE_AXES.filter((axis) => !(axes[axis.id] || []).length).map((axis) => axis.id);
}

// Подходит ли пэд под выбранный фильтр (по одному значению на ось, AND между осями).
// selection = { location: 'city'|null, action: ..., ... }. Пустые оси игнорируются.
export function padMatchesSelection(axes, selection) {
  for (const axisId of Object.keys(selection)) {
    const want = selection[axisId];
    if (!want) continue; // ось не выбрана — не фильтруем
    const tags = axes[axisId] || [];
    if (!tags.includes(want)) return false;
  }
  return true;
}