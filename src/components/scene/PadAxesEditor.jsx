import React from 'react';
import { SCENE_AXES, AXIS_CHIP_CLASS, autoAxes } from '@/lib/sceneAxes';

// Редактор тегов пэда по осям сцены. Множественный выбор внутри оси.
// Без ручной правки используются авто-теги (autoAxes) — здесь показаны
// бледными как подсказка. Клик фиксирует выбор вручную (override.axes).
export default function PadAxesEditor({ pad, override, onChange }) {
  const manual = override?.axes || {};
  const auto = autoAxes(pad);

  const toggle = (axisId, valueId) => {
    const current = manual[axisId] || auto[axisId] || [];
    const next = current.includes(valueId)
      ? current.filter((v) => v !== valueId)
      : [...current, valueId];
    onChange({ ...manual, [axisId]: next });
  };

  return (
    <div className="space-y-3">
      {SCENE_AXES.map((axis) => {
        const cls = AXIS_CHIP_CLASS[axis.color];
        const selected = manual[axis.id] || auto[axis.id] || [];
        const isAuto = !manual[axis.id] && (auto[axis.id]?.length > 0);
        return (
          <div key={axis.id}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-mono tracking-[0.15em] text-white/35 uppercase">{axis.label}</span>
              {isAuto && <span className="text-[9px] text-white/25">авто</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {axis.values.map((v) => {
                const active = selected.includes(v.id);
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => toggle(axis.id, v.id)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${active ? cls.on : cls.off}`}
                  >
                    <Icon size={11} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}