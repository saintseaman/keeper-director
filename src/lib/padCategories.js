// ─────────────────────────────────────────────────────────────
// Справочник категорий пэдов для панели звуков.
// Группы для быстрого доступа за столом. Каждый пэд несёт поле
// category; значения ниже совпадают с тем, что проставляет импорт.
//
// Раздутая «Атмосфера» дробится на смысловые подгруппы (погода,
// природа, дом/интерьер, техника/транспорт) уже на UI-слое — по
// ключевым словам в названии. Импорт и оси сцены не трогаем.
// ─────────────────────────────────────────────────────────────
import {
  CloudFog, Skull, Droplet, MessageCircle, Bell, Music,
  CloudRain, Trees, Home, Car,
} from 'lucide-react';

export const PAD_CATEGORIES = [
  { id: 'atmosphere', label: 'Атмосфера', icon: CloudFog, color: 'sky' },
  { id: 'weather', label: 'Погода', icon: CloudRain, color: 'cyan' },
  { id: 'nature', label: 'Природа', icon: Trees, color: 'green' },
  { id: 'interior', label: 'Дом/Интерьер', icon: Home, color: 'amber' },
  { id: 'tech', label: 'Техника', icon: Car, color: 'slate' },
  { id: 'creatures', label: 'Монстры', icon: Skull, color: 'violet' },
  { id: 'gore', label: 'Гор', icon: Droplet, color: 'rose' },
  { id: 'voices', label: 'Крики', icon: MessageCircle, color: 'orange' },
  { id: 'events', label: 'События', icon: Bell, color: 'emerald' },
  { id: 'music', label: 'Музыка', icon: Music, color: 'orange' },
];

// Категория по умолчанию для пэдов с неизвестным/пустым значением.
export const FALLBACK_CATEGORY = 'music';

// Подкатегории, на которые дробим «Атмосферу» по ключевым словам названия.
// Порядок важен: первое совпадение выигрывает.
const ATMOSPHERE_SPLIT = [
  { id: 'weather',  kw: ['rain', 'storm', 'thunder', 'wind', 'snow', 'fog', 'mist', 'blizzard', 'lightning', 'дожд', 'гроз', 'гром', 'ветер', 'снег', 'туман', 'метел', 'молни', 'ливень'] },
  { id: 'nature',   kw: ['forest', 'tree', 'water', 'river', 'sea', 'ocean', 'wave', 'bird', 'wind', 'cave', 'fire', 'campfire', 'лес', 'вод', 'река', 'море', 'волн', 'птиц', 'пещер', 'костёр', 'костер', 'огон'] },
  { id: 'interior', kw: ['door', 'knock', 'clock', 'creak', 'footstep', 'stairs', 'house', 'room', 'fireplace', 'candle', 'дверь', 'дверц', 'стук', 'часы', 'скрип', 'шаг', 'лестниц', 'дом', 'комнат', 'камин', 'свеч'] },
  { id: 'tech',     kw: ['car', 'engine', 'vehicle', 'machine', 'radio', 'phone', 'electric', 'motor', 'train', 'foley', 'маши', 'двигат', 'мотор', 'радио', 'телефон', 'электр', 'поезд', 'техник', 'авто'] },
];

// Нормализовать category пэда к одной из известных групп.
// Для атмосферных пэдов уточняем подгруппу по ключевым словам названия.
export function padCategory(pad) {
  const c = pad?.category;
  if (c === 'atmosphere') {
    const text = `${pad?.title || ''}`.toLowerCase();
    for (const sub of ATMOSPHERE_SPLIT) {
      if (sub.kw.some((k) => text.includes(k))) return sub.id;
    }
    return 'atmosphere';
  }
  return PAD_CATEGORIES.some((g) => g.id === c) ? c : FALLBACK_CATEGORY;
}

// Статические классы Tailwind на категорию (active / inactive чипа вкладки).
// Литеральные строки — чтобы их не вырезал purge.
export const CAT_TAB_CLASS = {
  sky:     { on: 'bg-sky-500/20 border-sky-400/60 text-sky-200',         off: 'text-sky-300/50' },
  cyan:    { on: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200',       off: 'text-cyan-300/50' },
  green:   { on: 'bg-green-500/20 border-green-400/60 text-green-200',    off: 'text-green-300/50' },
  slate:   { on: 'bg-slate-500/20 border-slate-400/60 text-slate-200',    off: 'text-slate-300/50' },
  violet:  { on: 'bg-violet-500/20 border-violet-400/60 text-violet-200', off: 'text-violet-300/50' },
  rose:    { on: 'bg-rose-500/20 border-rose-400/60 text-rose-200',       off: 'text-rose-300/50' },
  amber:   { on: 'bg-amber-500/20 border-amber-400/60 text-amber-200',     off: 'text-amber-300/50' },
  emerald: { on: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200', off: 'text-emerald-300/50' },
  orange:  { on: 'bg-orange-500/20 border-orange-400/60 text-orange-200',  off: 'text-orange-300/50' },
};