import React from 'react';
import { Settings as SettingsIcon, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';
import LangSelector from '@/components/pad/LangSelector';

export default function Settings() {
  const { masterVolume, setMasterVolume } = useAudio();

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
      </div>
    </div>
  );
}