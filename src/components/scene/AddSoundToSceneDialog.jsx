import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, FolderUp, Plus, Check, X } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';

// Диалог добавления звука в сцену.
// Сверху — поиск по своей библиотеке (выбрать из имеющихся), кнопка импорта
// папки со звуками. Уже входящие в сцену звуки помечены галочкой и тап по ним
// убирает их из сцены.
export default function AddSoundToSceneDialog({ open, onClose, pads, sceneIds, onAdd, onRemove, onImport }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? pads.filter((p) => (p.title || '').toLowerCase().includes(q))
      : pads;
    return list.slice(0, 100);
  }, [pads, query]);

  const inScene = (id) => sceneIds.has(id);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
            Добавить звук в сцену
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col min-h-0 gap-3 pt-2">
          <button
            onClick={onImport}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600/20 border border-orange-500/40 p-2.5 text-xs text-orange-200 hover:bg-orange-600/30 transition-colors"
          >
            <FolderUp size={15} />
            Импортировать папку
          </button>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск в библиотеке…"
              className="pl-8 pr-7 bg-white/5 border-white/10 text-xs text-white placeholder:text-white/30"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 -mr-1 pr-1">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-white/30">
                Ничего не найдено
              </div>
            ) : (
              filtered.map((p) => {
                const Icon = getIcon(p.icon);
                const added = inScene(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => (added ? onRemove(p.id) : onAdd(p.id))}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      added
                        ? 'bg-orange-500/15 border-orange-400/50'
                        : 'bg-white/5 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <Icon size={16} className={added ? 'text-orange-300 shrink-0' : 'text-white/50 shrink-0'} />
                    <span className={`flex-1 text-sm truncate ${added ? 'text-orange-50' : 'text-white/80'}`}>
                      {p.title}
                    </span>
                    {added
                      ? <Check size={15} className="text-orange-300 shrink-0" />
                      : <Plus size={15} className="text-white/40 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}