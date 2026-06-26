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
} from 'lucide-react';

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
      { id: 'forest', label: 'Лес', icon: Trees, kw: ['forest', 'jungle', 'wood', 'tree', 'swamp', 'лес', 'джунгл', 'болот'] },
      { id: 'dungeon', label: 'Подземелье', icon: Mountain, kw: ['dungeon', 'cave', 'crypt', 'tomb', 'cellar', 'basement', 'underground', 'подземель', 'пещер', 'склеп', 'подвал'] },
      { id: 'sea', label: 'Море', icon: Waves, kw: ['sea', 'ocean', 'ship', 'harbor', 'dock', 'beach', 'море', 'океан', 'корабл', 'порт', 'пляж'] },
      { id: 'temple', label: 'Храм', icon: Landmark, kw: ['church', 'temple', 'cathedral', 'shrine', 'церков', 'храм', 'собор'] },
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
      { id: 'fog', label: 'Туман', icon: CloudFog, kw: ['fog', 'mist', 'wind', 'туман', 'мгл', 'ветер', 'вітер'] },
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

// Быстрый доступ к значению оси по id.
export function axisValue(axisId, valueId) {
  const axis = SCENE_AXES.find((a) => a.id === axisId);
  return axis?.values.find((v) => v.id === valueId) || null;
}

// Авто-определение тегов пэда по его названию (+ старая category как подсказка).
// Возвращает { location: [...ids], action: [...], weather: [...], mood: [...] }.
export function autoAxes(pad) {
  const text = `${pad?.title || ''} ${pad?.category || ''}`.toLowerCase();
  const result = {};
  for (const axis of SCENE_AXES) {
    const hits = axis.values
      .filter((v) => v.kw.some((k) => text.includes(k)))
      .map((v) => v.id);
    if (hits.length) result[axis.id] = hits;
  }
  return result;
}

// Итоговые теги пэда: ручные (override.axes) приоритетнее авто.
// Если по оси нет ни ручных, ни авто-тегов — ось пустая (пэд «универсальный»).
export function padAxes(pad, override) {
  const manual = override?.axes || {};
  const auto = autoAxes(pad);
  const merged = {};
  for (const axis of SCENE_AXES) {
    const m = manual[axis.id];
    if (Array.isArray(m) && m.length) merged[axis.id] = m;
    else if (auto[axis.id]) merged[axis.id] = auto[axis.id];
    else merged[axis.id] = [];
  }
  return merged;
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