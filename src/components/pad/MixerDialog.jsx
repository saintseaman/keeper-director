import React from 'react';
import { SlidersHorizontal, Repeat, Zap, Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { getIcon } from '@/lib/iconMap';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { audioEngine } from '@/lib/audioEngine';

// Микшер всех кнопок: громкость + режим (зацикленный/разовый) для каждого пэда.
export default function MixerDialog({ open, onClose, pads = [] }) {
  const { getOverride, setOverride } = useSoundOverrides();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-orange-400" />
            Настройки кнопок
          </DialogTitle>
        </DialogHeader>

        {pads.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">Нет импортированных кнопок</p>
        ) : (
          <div className="space-y-4 pt-1">
            {pads.map((sound) => {
              const ov = getOverride(sound.id);
              const title = ov.title ?? sound.title;
              const volume = typeof ov.volume === 'number' ? ov.volume : 0.6;
              const isLoop = typeof ov.isLoopable === 'boolean' ? ov.isLoopable : !!sound.isLoopable;
              const Icon = getIcon(ov.icon ?? sound.icon);

              return (
                <div key={sound.id} className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-orange-300 shrink-0" />
                    <span className="flex-1 text-sm text-white/85 truncate">{title}</span>
                    <span className="text-[10px] font-mono text-white/35">{Math.round(volume * 100)}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 size={13} className="text-white/30 shrink-0" />
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={([v]) => {
                        setOverride(sound.id, { volume: v });
                        if (audioEngine.isPlaying(sound.id)) audioEngine.setVolume(sound.id, v);
                      }}
                      className="[&_[role=slider]]:bg-orange-400 [&_[role=slider]]:border-orange-300 [&_.range]:bg-orange-500/70"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOverride(sound.id, { isLoopable: true })}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] transition-colors
                        ${isLoop ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200' : 'bg-white/5 border-white/10 text-white/45 hover:border-white/25'}`}
                    >
                      <Repeat size={13} /> Зацикленный
                    </button>
                    <button
                      onClick={() => {
                        if (audioEngine.isPlaying(sound.id)) audioEngine.stop(sound.id);
                        setOverride(sound.id, { isLoopable: false });
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] transition-colors
                        ${!isLoop ? 'bg-rose-500/20 border-rose-400/60 text-rose-200' : 'bg-white/5 border-white/10 text-white/45 hover:border-white/25'}`}
                    >
                      <Zap size={13} /> Разовый
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}