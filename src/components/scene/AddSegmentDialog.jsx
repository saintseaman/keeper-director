import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { SCENE_AXES } from '@/lib/sceneAxes';

// Диалог добавления нового сегмента в выбранное кольцо колеса.
export default function AddSegmentDialog({ axisId, open, onClose, onAdd }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (open) setLabel('');
  }, [open]);

  const axis = SCENE_AXES.find((a) => a.id === axisId);

  const submit = () => {
    const name = label.trim();
    if (!name) return;
    onAdd(axisId, { label: name, icon: 'Star' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-wider uppercase text-white/90">
            Новый сегмент{axis ? ` · ${axis.label}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">Название</label>
            <Input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Например: Подземный город"
              className="bg-white/5 border-white/10 text-sm text-white"
            />
          </div>

          <button
            onClick={submit}
            disabled={!label.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500/20 border border-orange-400/50 px-3 py-2.5 text-[12px] font-mono tracking-wider text-orange-200 hover:bg-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={15} />
            ДОБАВИТЬ
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}