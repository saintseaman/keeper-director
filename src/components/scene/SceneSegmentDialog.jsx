import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Check, Pencil, Trash2, Plus, Music, XCircle } from 'lucide-react';
import { axisValue, padAxes } from '@/lib/sceneAxes';
import { segmentBg } from '@/lib/segmentBackgrounds';
import { audioEngine } from '@/lib/audioEngine';
import DriveImportDialog from '@/components/pad/DriveImportDialog';

// Диалог сегмента колеса (напр. «Город»): импорт звука с Google Диска
// (с автопривязкой тега сегмента), переименование и удаление звуков сегмента.
export default function SceneSegmentDialog({
  axisId,
  valueId,
  open,
  onClose,
  pads,
  overrides,
  addPads,
  updatePad,
  removePad,
  setOverride,
  onRemoveSegment,
}) {
  const [driveOpen, setDriveOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');

  const value = axisId && valueId ? axisValue(axisId, valueId) : null;
  const bg = valueId ? segmentBg(valueId) : null;

  // Звуки, помеченные тегом этого сегмента.
  const segmentPads = useMemo(() => {
    if (!value) return [];
    return pads.filter((p) => (padAxes(p, overrides[p.id])[axisId] || []).includes(valueId));
  }, [pads, overrides, axisId, valueId, value]);

  // Импорт с Drive → создаём пэд и сразу привязываем тег сегмента.
  const handleImport = ({ url, name }) => {
    const id = `drive_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    addPads([{ id, title: name, url, category: 'atmosphere', icon: 'Music' }]);
    const existingAxes = overrides[id]?.axes || {};
    const axisTags = Array.from(new Set([...(existingAxes[axisId] || []), valueId]));
    setOverride(id, { axes: { ...existingAxes, [axisId]: axisTags } });
  };

  const startRename = (pad) => {
    setEditingId(pad.id);
    setDraftName(pad.title || '');
  };
  const commitRename = (pad) => {
    const name = draftName.trim();
    if (name && name !== pad.title) updatePad(pad.id, { title: name });
    setEditingId(null);
    setDraftName('');
  };

  if (!value) return null;
  const Icon = value.icon;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm p-0 overflow-hidden">
          {/* Шапка с фоном сегмента */}
          <div className="relative h-28">
            {bg && (
              <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
            <DialogHeader className="absolute bottom-0 left-0 right-0 p-4">
              <DialogTitle className="flex items-center gap-2 text-white">
                <Icon size={18} className="text-orange-300" />
                <span className="font-mono tracking-wider text-sm uppercase">{value.label}</span>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-4 pt-2 space-y-3">
            <button
              onClick={() => setDriveOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500/15 border border-orange-400/40 px-3 py-2.5 text-[12px] font-mono tracking-wider text-orange-200 hover:bg-orange-500/25 transition-colors"
            >
              <Plus size={15} />
              ИМПОРТ С GOOGLE ДИСКА
            </button>

            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {segmentPads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-white/35">
                  Нет звуков в этом сегменте. Импортируйте с Google Диска.
                </div>
              ) : (
                segmentPads.map((pad) => (
                  <div
                    key={pad.id}
                    className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 p-2"
                  >
                    <Music size={15} className="text-orange-400 shrink-0" />
                    {editingId === pad.id ? (
                      <Input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitRename(pad)}
                        onBlur={() => commitRename(pad)}
                        className="flex-1 h-7 bg-white/5 border-white/10 text-xs text-white"
                      />
                    ) : (
                      <span className="flex-1 text-xs text-white/85 truncate">{pad.title}</span>
                    )}
                    {editingId === pad.id ? (
                      <button onClick={() => commitRename(pad)} className="text-emerald-400 p-1">
                        <Check size={15} />
                      </button>
                    ) : (
                      <button onClick={() => startRename(pad)} className="text-white/40 hover:text-orange-300 p-1">
                        <Pencil size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (audioEngine.isPlaying(pad.id)) audioEngine.stop(pad.id);
                        removePad(pad.id);
                      }}
                      className="text-white/30 hover:text-rose-300 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {onRemoveSegment && (
              <button
                onClick={() => { onRemoveSegment(axisId, valueId); onClose(); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2 text-[11px] font-mono tracking-wider text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <XCircle size={14} />
                УДАЛИТЬ СЕГМЕНТ С КОЛЕСА
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DriveImportDialog open={driveOpen} onClose={() => setDriveOpen(false)} onImport={handleImport} />
    </>
  );
}