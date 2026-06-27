import React from 'react';
import { Camera, Layers, X } from 'lucide-react';

// Лента «снимков микса» — быстрые заготовки сцены.
// Тап по снимку → мгновенно переключает текущий микс на сохранённый.
// Кнопка с камерой → сохраняет текущий играющий микс как новый снимок.
// Крестик на снимке → удаляет его.
export default function MixPresetBar({ presets, activeCount, onSave, onApply, onRemove }) {
  const hasPresets = presets.length > 0;
  if (!hasPresets && activeCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-white/10 bg-[#0c0c0c] overflow-x-auto no-scrollbar">
      <button
        onClick={onSave}
        disabled={activeCount === 0}
        title={activeCount === 0 ? 'Запустите звуки, чтобы сохранить микс' : 'Сохранить текущий микс как снимок'}
        className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider border transition-colors
          ${activeCount === 0
            ? 'bg-white/5 border-white/10 text-white/25'
            : 'bg-orange-500/15 border-orange-400/50 text-orange-200 hover:bg-orange-500/25'}`}
      >
        <Camera size={13} />
        СНИМОК
      </button>

      {presets.map((p) => (
        <div
          key={p.id}
          className="group shrink-0 relative flex items-center rounded-lg border border-white/10 bg-white/5 hover:border-orange-400/40 transition-colors"
        >
          <button
            onClick={() => onApply(p)}
            className="flex items-center gap-1.5 pl-3 pr-2 py-2 text-[11px] font-mono tracking-wide text-white/70 hover:text-orange-200 transition-colors"
            title="Переключиться на этот микс"
          >
            <Layers size={13} className="text-orange-300/70" />
            <span className="max-w-[120px] truncate">{p.name}</span>
            <span className="text-white/30">·{(p.layers || []).length}</span>
          </button>
          <button
            onClick={() => onRemove(p.id)}
            title="Удалить снимок"
            className="shrink-0 p-1.5 mr-0.5 rounded-md text-white/30 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}