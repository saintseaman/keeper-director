import React from 'react';
import { Square, Disc3 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';
import { SOUNDS } from '@/lib/soundData';
import PadDeck from '@/components/pad/PadDeck';

// 5 дек по 9 пэдов = 45 слотов.
const DECKS = Array.from({ length: 5 }, (_, i) => SOUNDS.slice(i * 9, i * 9 + 9));

export default function Home() {
  const { activeSounds, masterVolume, setMasterVolume, stopAll } = useAudio();
  const activeCount = Object.values(activeSounds).filter(v => v.isPlaying !== false).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Top bar — минимальная "рейка" как у Pioneer */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Disc3 size={18} className={`text-orange-400 ${activeCount > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Drumpad</span>
        </div>

        <div className="flex items-center gap-3">
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
        <PadDeck pages={DECKS} />
      </div>
    </div>
  );
}