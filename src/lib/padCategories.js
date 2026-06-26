// ─────────────────────────────────────────────────────────────
// Справочник категорий пэдов для панели звуков.
// 6 групп для быстрого доступа за столом. Каждый пэд несёт поле
// category; значения ниже совпадают с тем, что проставляет импорт.
// ─────────────────────────────────────────────────────────────
import { CloudFog, Skull, Droplet, MessageCircle, Bell, Music } from 'lucide-react';

export const PAD_CATEGORIES = [
  { id: 'atmosphere', label: 'Атмосфера', icon: CloudFog, color: 'sky' },
  { id: 'creatures', label: 'Монстры', icon: Skull, color: 'violet' },
  { id: 'gore', label: 'Гор', icon: Droplet, color: 'rose' },
  { id: 'voices', label: 'Крики', icon: MessageCircle, color: 'amber' },
  { id: 'events', label: 'События', icon: Bell, color: 'emerald' },
  { id: 'music', label: 'Музыка', icon: Music, color: 'orange' },
];

// Категория по умолчанию для пэдов с неизвестным/пустым значением.
export const FALLBACK_CATEGORY = 'music';

// Статические классы Tailwind на категорию (active / inactive чипа вкладки).
// Литеральные строки — чтобы их не вырезал purge.
export const CAT_TAB_CLASS = {
  sky:     { on: 'bg-sky-500/20 border-sky-400/60 text-sky-200',         off: 'text-sky-300/50' },
  violet:  { on: 'bg-violet-500/20 border-violet-400/60 text-violet-200', off: 'text-violet-300/50' },
  rose:    { on: 'bg-rose-500/20 border-rose-400/60 text-rose-200',       off: 'text-rose-300/50' },
  amber:   { on: 'bg-amber-500/20 border-amber-400/60 text-amber-200',     off: 'text-amber-300/50' },
  emerald: { on: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200', off: 'text-emerald-300/50' },
  orange:  { on: 'bg-orange-500/20 border-orange-400/60 text-orange-200',  off: 'text-orange-300/50' },
};

// Нормализовать category пэда к одной из известных групп.
export function padCategory(pad) {
  const c = pad?.category;
  return PAD_CATEGORIES.some((g) => g.id === c) ? c : FALLBACK_CATEGORY;
}