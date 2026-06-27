import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { audioEngine } from '@/lib/audioEngine';

// Поканальный слайдер громкости одного слоя сцены.
// Показывается только пока слой играет. Меняет громкость живого голоса
// через audioEngine.setVolume (значение читаем из активного состояния движка).
export default function LayerVolumeSlider({ padId }) {
  const initial = audioEngine.getState().activeSounds[padId]?.volume ?? 0.6;
  const [vol, setVol] = useState(initial);

  const onChange = ([v]) => {
    const next = v / 100;
    setVol(next);
    audioEngine.setVolume(padId, next);
  };

  return (
    <div className="flex items-center gap-2 px-3 pb-2.5 -mt-0.5">
      <Volume2 size={13} className="text-orange-300/70 shrink-0" />
      <Slider
        value={[Math.round(vol * 100)]}
        min={0}
        max={100}
        step={1}
        onValueChange={onChange}
        className="flex-1"
      />
      <span className="text-[10px] font-mono text-white/40 w-7 text-right tabular-nums">
        {Math.round(vol * 100)}
      </span>
    </div>
  );
}