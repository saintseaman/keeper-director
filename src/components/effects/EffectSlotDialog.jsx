import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileAudio, Check, Trash2, CheckCircle2 } from 'lucide-react';
import IconPicker from '@/components/pad/IconPicker';
import SingleFileUploadDialog from '@/components/pad/SingleFileUploadDialog';

// Диалог редактирования одного слота эффектов: название, иконка, импорт звука,
// очистка слота. Long-press по слоту открывает этот диалог.
export default function EffectSlotDialog({ slot, open, onClose, onSave, onClear }) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('Zap');
  const [url, setUrl] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // При открытии — подтянуть текущие значения слота в черновик.
  useEffect(() => {
    if (open && slot) {
      setTitle(slot.isEmpty ? '' : (slot.title || ''));
      setIcon(slot.icon || 'Zap');
      setUrl(slot.url || null);
    }
  }, [open, slot]);

  if (!slot) return null;

  const save = () => {
    onSave(slot.id, {
      title: title.trim() || 'Эффект',
      icon,
      url: url || null,
      isEmpty: false,
    });
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
              Слот эффекта
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-2">
            {/* Название */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-white/40 uppercase mb-1.5">
                Название
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название эффекта…"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/85 placeholder:text-white/25 focus:border-orange-400/50 focus:outline-none"
              />
            </div>

            {/* Выбор иконки */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-white/40 uppercase mb-1.5">
                Иконка
              </label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            {/* Импорт звука */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-white/40 uppercase mb-1.5">
                Звук
              </label>
              <button
                onClick={() => setUploadOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-orange-400/40 bg-orange-500/5 py-3 text-orange-200 hover:bg-orange-500/10 transition-colors"
              >
                {url
                  ? <><CheckCircle2 size={18} className="text-emerald-300" /><span className="text-xs font-mono tracking-wider">Звук загружен</span></>
                  : <><FileAudio size={18} /><span className="text-xs font-mono tracking-wider">Импортировать звук</span></>}
              </button>
            </div>

            {/* Действия */}
            <div className="flex items-center gap-2 pt-1">
              {!slot.isEmpty && (
                <button
                  onClick={() => { onClear(slot.id); onClose(); }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider bg-rose-600/15 border border-rose-500/40 text-rose-300 hover:bg-rose-600/25 transition-colors"
                >
                  <Trash2 size={13} />
                  ОЧИСТИТЬ
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-auto rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-white/10 text-white/55 hover:text-white/85 transition-colors"
              >
                ОТМЕНА
              </button>
              <button
                onClick={save}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider bg-orange-500/20 border border-orange-400/50 text-orange-200 hover:bg-orange-500/30 transition-colors"
              >
                <Check size={14} />
                СОХРАНИТЬ
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SingleFileUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImport={({ url: fileUrl, name }) => {
          setUrl(fileUrl);
          if (!title.trim()) setTitle(name || '');
        }}
      />
    </>
  );
}