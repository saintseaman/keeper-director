import React, { useState } from 'react';
import { Square, Disc3, FolderDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';
import { SOUNDS } from '@/lib/soundData';
import { useCustomPads } from '@/lib/useCustomPads';
import PadDeck from '@/components/pad/PadDeck';
import DriveFolderDialog from '@/components/pad/DriveFolderDialog';

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

  const activeCount = Object.values(activeSounds).filter(v => v.isPlaying !== false).length;

  // Базові 45 слотів (5 дек) + сторінки з власних пэдів з Google Диска.
  const baseDecks = paginate(SOUNDS, 9).slice(0, 5);
  const customDecks = paginate(customPads, 9);
  const decks = [...baseDecks, ...customDecks];

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

      {/* Дека */}
      <div className="flex-1 min-h-0 px-4 pt-4 pb-3">
        <PadDeck pages={decks} onRemoveCustom={removePad} />
      </div>

      <DriveFolderDialog
        open={folderOpen}
        onClose={() => setFolderOpen(false)}
        onImported={(sounds) => addPads(sounds)}
      />
    </div>
  );
}