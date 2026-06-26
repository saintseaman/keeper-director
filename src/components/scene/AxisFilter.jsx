import React from 'react';
import { SCENE_AXES, AXIS_CHIP_CLASS } from '@/lib/sceneAxes';

// Ряды чипов по осям сцены. По одному выбранному значению на ось (toggle).
// selection = { location, action, weather, mood }; onSelect(axisId, valueId|null).
export default function AxisFilter({ selection, onSelect }) {
  return (
    <div className="space-y-3">
      {SCENE_AXES.map((axis) => {
        const cls = AXIS_CHIP_CLASS[axis.color];
        return (
          <div key={axis.id}>
            <div className="text-[10px] font-mono tracking-[0.2em] text-white/35 uppercase mb-1.5 px-0.5">
              {axis.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {axis.values.map((v) => {
                const active = selection[axis.id] === v.id;
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => onSelect(axis.id, active ? null : v.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-colors ${active ? cls.on : cls.off}`}
                  >
                    <Icon size={13} />
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