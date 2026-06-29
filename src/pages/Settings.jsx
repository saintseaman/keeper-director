import React, { useState } from 'react';
import { Settings as SettingsIcon, Volume2, Library, FolderUp, Trash2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';
import { useCustomPads } from '@/lib/useCustomPads';
import LangSelector from '@/components/pad/LangSelector';
import FolderUploadDialog from '@/components/pad/FolderUploadDialog';

export default function Settings() {
  const { masterVolume, setMasterVolume } = useAudio();
  const { pads, addPads, removePad } = useCustomPads();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <SettingsIcon size={18} className="text-orange-400" />
        <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Настройки</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Громкость */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/60">
            <Volume2 size={15} />
            <span className="text-[11px] font-mono tracking-widest uppercase">Общая громкость</span>
          </div>
          <Slider
            value={[Math.round(masterVolume * 100)]}
            onValueChange={([v]) => setMasterVolume(v / 100)}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-orange-400 [&_[role=slider]]:border-orange-300 [&_.range]:bg-orange-500/70"
          />
        </div>

        {/* Язык */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/60">Язык</span>
          <LangSelector />
        </div>

        {/* Библиотека звуков */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Library size={15} />
              <span className="text-[11px] font-mono tracking-widest uppercase">Библиотека звуков</span>
            </div>
            <span className="text-[11px] font-mono text-white/40">Всего: {pads.length}</span>
          </div>

          <button
            onClick={() => setImportOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-orange-400/40 bg-orange-500/5 py-3 text-orange-200 hover:bg-orange-500/10 transition-colors"
          >
            <FolderUp size={16} />
            <span className="text-xs font-mono tracking-wider">Импортировать звуки</span>
          </button>

          {pads.length === 0 ? (
            <p className="text-xs text-white/40 py-2">Пока нет звуков. Импортируйте папку.</p>
          ) : (
            <div className="space-y-1.5">
              {pads.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-white/80">{p.title}</span>
                  <button
                    onClick={() => removePad(p.id)}
                    title="Удалить звук"
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <FolderUploadDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(sounds) => addPads(sounds)}
      />
    </div>
  );
}