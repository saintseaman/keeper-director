import React from 'react';
import { X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getIcon } from '@/lib/iconMap';
import { audioEngine } from '@/lib/audioEngine';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { usePlaySound } from '@/lib/usePlaySound';

// Нижняя лента «собранной сцены»: чипы активных звуков с микшером громкости.
// activePads: массив пэдов (sound-объектов), которые сейчас играют.
function SceneChip({ sound }) {
  const { resolve } = usePlaySound();
  const { setOverride } = useSoundOverrides();
  const meta = resolve(sound);
  const Icon = getIcon(meta?.icon);

  // Текущая громкость из активного узла (быстрее, чем override) с фолбэком.
  const live = audioEngine.activeSounds?.[sound.id]?.volume;
  const vol = typeof live === 'number' ? live : (meta?.volume ?? 0.6);

  return (
    <div className="flex-shrink-0 w-[148px] rounded-xl bg-white/[0.06] border border-orange-400/40 p-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-400/20 ring-1 ring-orange-300/40 text-orange-100 flex-shrink-0">
          <Icon size={14} strokeWidth={1.8} />
        </span>
        <span className="flex-1 text-[11px] font-semibold leading-tight text-orange-50 truncate">{meta?.title}</span>
        <button
          onClick={() => audioEngine.stop(sound.id, 0.25)}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-white/40 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
          title="Убрать"
        >
          <X size={13} />
        </button>
      </div>
      <Slider
        value={[Math.round(vol * 100)]}
        onValueChange={([v]) => {
          audioEngine.setVolume(sound.id, v / 100);
          setOverride(sound.id, { volume: v / 100 });
        }}
        max={100}
        step={1}
        className="[&_[role=slider]]:bg-orange-400 [&_[role=slider]]:border-orange-300 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_.range]:bg-orange-500/70"
      />
    </div>
  );
}

export default function SceneTray({ activePads }) {
  if (activePads.length === 0) return null;

  return (
    <div className="border-t border-white/10 bg-black/40 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono tracking-widest text-orange-300/70 uppercase">Сцена · {activePads.length}</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
        {activePads.map((p) => <SceneChip key={p.id} sound={p} />)}
      </div>
    </div>
  );
}