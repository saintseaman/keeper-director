import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tags as TagsIcon, Check } from 'lucide-react';
import { SCENE_AXES, AXIS_CHIP_CLASS } from '@/lib/sceneAxes';

// Диалог массового присвоения тегов: выбираем общие значения по осям,
// они добавляются ко ВСЕМ выбранным звукам (не затирая их текущие теги).
export default function BulkTagDialog({ open, count, onClose, onApply }) {
  const [picked, setPicked] = useState({}); // { axisId: [valueId, ...] }

  useEffect(() => {
    if (open) setPicked({});
  }, [open]);

  const toggle = (axisId, valueId) => {
    setPicked((prev) => {
      const cur = prev[axisId] || [];
      const next = cur.includes(valueId) ? cur.filter((v) => v !== valueId) : [...cur, valueId];
      return { ...prev, [axisId]: next };
    });
  };

  const total = Object.values(picked).reduce((n, arr) => n + arr.length, 0);

  const apply = () => {
    // отбрасываем пустые оси
    const clean = {};
    for (const [axisId, arr] of Object.entries(picked)) {
      if (arr.length) clean[axisId] = arr;
    }
    onApply(clean);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-mono tracking-wider uppercase text-white/90">
            <TagsIcon size={16} className="text-orange-400" />
            Теги для {count} звук{count % 10 === 1 && count % 100 !== 11 ? 'а' : 'ов'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {SCENE_AXES.map((axis) => {
            const cls = AXIS_CHIP_CLASS[axis.color];
            const selected = picked[axis.id] || [];
            return (
              <div key={axis.id}>
                <span className="text-[10px] font-mono tracking-[0.15em] text-white/35 uppercase mb-1.5 block">
                  {axis.label}
                </span>
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

        <button
          onClick={apply}
          disabled={total === 0}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500/20 border border-orange-400/50 px-3 py-2.5 text-[12px] font-mono tracking-wider text-orange-200 hover:bg-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Check size={15} />
          ПРИМЕНИТЬ КО ВСЕМ
        </button>
      </DialogContent>
    </Dialog>
  );
}