import React from 'react';
import { Zap } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useCustomPads } from '@/lib/useCustomPads';

// Список звуков, помеченных как «Эффект» (pad.isEffect === true).
// Тап по звуку — назначить его в редактируемый слот шторки.
export default function EffectPadPicker({ onPick }) {
  const { pads } = useCustomPads();
  const effects = (pads || [])
    .filter((p) => p.isEffect && p.url)
    .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru'));

  if (effects.length === 0) {
    return (
      <p className="text-[11px] text-white/35 leading-snug">
        Нет звуков-эффектов. Пометьте звук как «Эффект» на странице «Теги»
        или импортируйте файл выше.
      </p>
    );
  }

  return (
    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
      {effects.map((p) => {
        const Icon = getIcon(p.icon);
        return (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            className="w-full flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left hover:border-orange-400/40 hover:bg-orange-500/5 transition-colors"
          >
            <span className="shrink-0 w-7 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon size={14} className="text-orange-300" />
            </span>
            <span className="min-w-0 flex-1 text-[12px] text-white/80 truncate">{p.title}</span>
            <Zap size={12} className="shrink-0 text-orange-400/60" />
          </button>
        );
      })}
    </div>
  );
}