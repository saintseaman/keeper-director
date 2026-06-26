import React, { useState, useMemo } from 'react';
import { Square, Disc3, FolderDown, SlidersHorizontal } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';
import { useCustomPads } from '@/lib/useCustomPads';
import { padCategory } from '@/lib/padCategories';
import PadDeck from '@/components/pad/PadDeck';
import CategoryTabs from '@/components/pad/CategoryTabs';
import DriveFolderDialog from '@/components/pad/DriveFolderDialog';
import MixerDialog from '@/components/pad/MixerDialog';

// Розбити масив звуків на сторінки по 9 пэдів.
function paginate(list, size = 9) {
  const pages = [];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages;
}

export default function Home() {
  const { activeSounds, masterVolume, setMasterVolume, stopAll } = useAudio();
  const { pads: customPads, addPads, removePad } = useCustomPads();
  const [folderOpen, setFolderOpen] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(null); // null = «Все»

  const activeCount = Object.values(activeSounds).filter(v => v.isPlaying !== false).length;

  // Счётчики пэдов по категориям (для вкладок).
  const counts = useMemo(() => {
    const acc = {};
    for (const p of customPads) { const c = padCategory(p); acc[c] = (acc[c] || 0) + 1; }
    return acc;
  }, [customPads]);

  // Пэды выбранной категории (или все). Затем режем на страницы по 9.
  const filtered = useMemo(
    () => (activeCat ? customPads.filter((p) => padCategory(p) === activeCat) : customPads),
    [customPads, activeCat]
  );
  const decks = paginate(filtered, 9);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Top bar — минимальная "рейка" как у Pioneer */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Disc3 size={18} className={`text-orange-400 ${activeCount > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Drumpad</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Импорт папки с Google Диска */}
          <button
            onClick={() => setFolderOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-white/10 text-white/60 hover:border-orange-400/40 hover:text-orange-300 transition-colors"
            title="Импорт папки с Google Диска"
          >
            <FolderDown size={13} />
            <span className="hidden sm:inline">DRIVE</span>
          </button>

          {/* Настройки всех кнопок (микшер) */}
          <button
            onClick={() => setMixerOpen(true)}
            disabled={customPads.length === 0}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider border transition-colors
              ${customPads.length === 0
                ? 'bg-white/5 border-white/10 text-white/25'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-orange-400/40 hover:text-orange-300'}`}
            title="Настройки всех кнопок"
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">МИКС</span>
          </button>

          {/* Master */}
          <div className="flex items-center gap-2 w-28">
            <span className="text-[9px] font-mono text-white/40 tracking-widest">MST</span>
            <Slider
              value={[Math.round(masterVolume * 100)]}
              onValueChange={([v]) => setMasterVolume(v / 100)}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-orange-400 [&_[role=slider]]:border-orange-300 [&_[role=slider]]:w-3.5 [&_[role=slider]]:h-3.5 [&_.range]:bg-orange-500/70"
            />
          </div>
          {/* Stop all */}
          <button
            onClick={() => stopAll(0.4)}
            disabled={activeCount === 0}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider transition-all
              ${activeCount > 0 ? 'bg-rose-600/20 border border-rose-500/50 text-rose-300' : 'bg-white/5 border border-white/10 text-white/25'}`}
          >
            <Square size={12} className={activeCount > 0 ? 'fill-rose-400' : ''} />
            {activeCount > 0 ? activeCount : 'STOP'}
          </button>
        </div>
      </div>

      {/* Вкладки категорий */}
      {customPads.length > 0 && (
        <div className="px-4 pt-3">
          <CategoryTabs active={activeCat} onChange={setActiveCat} counts={counts} total={customPads.length} />
        </div>
      )}

      {/* Дека */}
      <div className="flex-1 min-h-0 px-4 pt-4 pb-3">
        {decks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <FolderDown size={32} className="text-white/20" />
            <p className="text-sm text-white/50 font-mono tracking-wide">Нет пэдов</p>
            <button
              onClick={() => setFolderOpen(true)}
              className="rounded-lg px-4 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-orange-400/40 text-orange-300 hover:bg-orange-400/10 transition-colors"
            >
              Импортировать папку с Google Диска
            </button>
          </div>
        ) : (
          <PadDeck pages={decks} onRemoveCustom={removePad} />
        )}
      </div>

      <DriveFolderDialog
        open={folderOpen}
        onClose={() => setFolderOpen(false)}
        onImported={(sounds) => addPads(sounds)}
      />

      <MixerDialog
        open={mixerOpen}
        onClose={() => setMixerOpen(false)}
        pads={customPads}
      />
    </div>
  );
}