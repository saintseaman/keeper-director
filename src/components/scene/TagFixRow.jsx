import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { SCENE_AXES } from '@/lib/sceneAxes';
import PadAxesEditor from './PadAxesEditor';

// Строка звука в панели «Теги»: показывает, по каким осям нет тегов,
// и по тапу разворачивает редактор для проставки прямо здесь.
// В режиме выделения (selectable) слева — чекбокс, а тап по строке переключает выбор.
export default function TagFixRow({ pad, override, missing, onChangeAxes, selectable, selected, onToggleSelect }) {
  const [open, setOpen] = useState(false);
  const Icon = getIcon(pad.icon);
  const missingLabels = missing.map((id) => SCENE_AXES.find((a) => a.id === id)?.label).filter(Boolean);
  const done = missing.length === 0;

  return (
    <div className={`rounded-xl border bg-white/[0.03] overflow-hidden transition-colors ${selectable && selected ? 'border-orange-400/60' : 'border-white/10'}`}>
      <button
        onClick={() => (selectable ? onToggleSelect(pad.id) : setOpen((v) => !v))}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        {selectable && (
          <span className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selected ? 'bg-orange-500/80 border-orange-400' : 'border-white/20'}`}>
            {selected && <Check size={13} className="text-white" />}
          </span>
        )}
        <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon size={17} className={done ? 'text-emerald-300' : 'text-orange-300'} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-white/85 truncate">{pad.title}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {done ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-300/80">
                <CheckCircle2 size={11} /> размечено
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-orange-300/80">
                <AlertCircle size={11} /> нет: {missingLabels.join(', ')}
              </span>
            )}
          </div>
        </div>
        {!selectable && (open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />)}
      </button>

      {!selectable && open && (
        <div className="px-3 pb-3 pt-1 border-t border-white/10">
          <PadAxesEditor
            pad={pad}
            override={override}
            onChange={(axes) => onChangeAxes(pad.id, axes)}
          />
        </div>
      )}
    </div>
  );
}