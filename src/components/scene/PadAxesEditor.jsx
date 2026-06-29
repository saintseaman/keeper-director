import React, { useState, useEffect } from 'react';
import { Check, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SCENE_AXES, AXIS_CHIP_CLASS, autoAxes } from '@/lib/sceneAxes';

// Редактор тегов пэда по осям сцены. Множественный выбор внутри оси.
// Без ручной правки используются авто-теги (autoAxes) — здесь показаны
// бледными как подсказка. Клик фиксирует выбор вручную (override.axes).
//
// Правки копятся в локальном черновике и применяются ТОЛЬКО по кнопке
// «Сохранить» — так можно проставить сразу несколько тегов, и строка не
// перескакивает по списку после каждого клика.
export default function PadAxesEditor({ pad, override, onChange }) {
  const auto = autoAxes(pad);
  // Локальный черновик выбора по осям. Инициализируем из override (ручные)
  // или авто-подсказок, чтобы пользователь сразу видел текущее состояние.
  const initDraft = () => {
    const manual = override?.axes || {};
    const draft = {};
    for (const axis of SCENE_AXES) {
      draft[axis.id] = manual[axis.id] || auto[axis.id] || [];
    }
    return draft;
  };
  const [draft, setDraft] = useState(initDraft);
  const [isEffect, setIsEffect] = useState(!!pad.isEffect);
  const [dirty, setDirty] = useState(false);

  // Если пэд/оверрайды поменялись извне — пересобираем черновик.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(initDraft()); setIsEffect(!!pad.isEffect); setDirty(false); }, [pad.id, override]);

  const toggle = (axisId, valueId) => {
    setDraft((prev) => {
      const current = prev[axisId] || [];
      const next = current.includes(valueId)
        ? current.filter((v) => v !== valueId)
        : [...current, valueId];
      return { ...prev, [axisId]: next };
    });
    setDirty(true);
  };

  const save = () => {
    onChange(draft, isEffect);
    setDirty(false);
  };

  return (
    <div className="space-y-3">
      {/* Флаг «Эффект» — отдельная секция над осями. Звук уходит в шторку
          эффектов и исключается из автоподбора атмосферы. */}
      <div className="flex items-center justify-between rounded-lg border border-orange-400/25 bg-orange-500/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-orange-300" />
          <div className="leading-tight">
            <div className="text-[12px] text-white/85">Эффект (для шторки)</div>
            <div className="text-[10px] text-white/35">Разовый звук, не для атмосферы</div>
          </div>
        </div>
        <Switch
          checked={isEffect}
          onCheckedChange={(v) => { setIsEffect(v); setDirty(true); }}
        />
      </div>

      {SCENE_AXES.map((axis) => {
        const cls = AXIS_CHIP_CLASS[axis.color];
        const selected = draft[axis.id] || [];
        const manualSet = override?.axes || {};
        const isAuto = !manualSet[axis.id] && (auto[axis.id]?.length > 0);
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

      <button
        onClick={save}
        disabled={!dirty}
        className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-mono tracking-wider transition-colors ${
          dirty
            ? 'bg-orange-500/20 border border-orange-400/50 text-orange-200 hover:bg-orange-500/30'
            : 'bg-white/5 border border-white/10 text-white/30'
        }`}
      >
        <Check size={14} />
        {dirty ? 'СОХРАНИТЬ ТЕГИ' : 'СОХРАНЕНО'}
      </button>
    </div>
  );
}