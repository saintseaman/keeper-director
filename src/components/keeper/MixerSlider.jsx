import React from 'react';
import { getIcon } from '@/lib/iconMap';
import { X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';

export default function MixerSlider({ soundId, title, icon, volume }) {
  const { setVolume, stop } = useAudio();
  const IconComponent = getIcon(icon);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded flex items-center justify-center bg-brass/10 shrink-0">
        <IconComponent size={16} className="text-brass" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-heading tracking-wide text-parchment mb-1.5 truncate">{title}</p>
        <Slider
          value={[Math.round(volume * 100)]}
          onValueChange={([v]) => setVolume(soundId, v / 100)}
          max={100}
          step={1}
          className="[&_[role=slider]]:bg-brass [&_[role=slider]]:border-brass-dim [&_[role=slider]]:w-5 [&_[role=slider]]:h-5"
        />
      </div>
      <span className="text-[10px] text-parchment-dim w-8 text-right">{Math.round(volume * 100)}%</span>
      <button onClick={() => stop(soundId, 0.5)} className="p-1 text-parchment-dim hover:text-red-400 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}