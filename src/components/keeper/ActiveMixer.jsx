import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';
import MixerSlider from './MixerSlider';
import { SOUNDS } from '@/lib/soundData';
import { useLang } from '@/lib/LangContext';

export default function ActiveMixer() {
  const { activeSounds, masterVolume, setMasterVolume, stopAll } = useAudio();
  const { t } = useLang();

  const activeEntries = Object.entries(activeSounds).filter(([, v]) => v.isPlaying !== false);

  if (activeEntries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-graphite/60 p-4 text-center">
        <p className="text-xs text-muted-foreground font-display italic">{t('noActiveSounds')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-graphite/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 size={14} className="text-brass" />
          <span className="text-xs font-heading tracking-wide text-parchment">{t('activeMixer')}</span>
          <span className="text-[10px] bg-brass/20 text-brass px-1.5 py-0.5 rounded">{activeEntries.length}</span>
        </div>
        <button onClick={() => stopAll(0.8)} className="text-[10px] font-heading tracking-wider text-red-400 hover:text-red-300 transition-colors uppercase">
          {t('stopAll')}
        </button>
      </div>

      {/* Master volume */}
      <div className="flex items-center gap-3 pb-2 mb-2 border-b border-border">
        <VolumeX size={14} className="text-parchment-dim shrink-0" />
        <Slider
          value={[Math.round(masterVolume * 100)]}
          onValueChange={([v]) => setMasterVolume(v / 100)}
          max={100}
          step={1}
          className="[&_[role=slider]]:bg-brass [&_[role=slider]]:border-brass-dim [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_.range]:bg-brass-dim"
        />
        <Volume2 size={14} className="text-parchment-dim shrink-0" />
      </div>

      {/* Per-sound sliders */}
      <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
        {activeEntries.map(([soundId, data]) => {
          const soundDef = SOUNDS.find(s => s.id === soundId);
          return (
            <MixerSlider
              key={soundId}
              soundId={soundId}
              title={data.title || soundDef?.title || soundId}
              icon={soundDef?.icon || 'Volume2'}
              volume={data.volume || 0.5}
            />
          );
        })}
      </div>
    </div>
  );
}