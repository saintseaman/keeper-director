import React from 'react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive, useAudioActions } from '@/lib/useAudio';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { audioEngine } from '@/lib/audioEngine';
import { padAxes, axisValue, SCENE_AXES } from '@/lib/sceneAxes';
import { recordRecentPad } from '@/lib/usePadLibrary';

// Строка результата поиска по СВОЕЙ библиотеке: тап — мгновенное
// воспроизведение (как на пэде). Drive-пэд всегда несёт url.
export default function PadSearchRow({ pad }) {
  const isActive = useIsSoundActive(pad.id);
  const { stop } = useAudioActions();
  const { getOverride } = useSoundOverrides();

  const ov = getOverride(pad.id);
  const title = ov.title ?? pad.title;
  const Icon = getIcon(ov.icon ?? pad.icon);
  const volume = typeof ov.volume === 'number' ? ov.volume : 0.6;
  const isLoopable = typeof ov.isLoopable === 'boolean' ? ov.isLoopable : !!pad.isLoopable;
  const isOneShot = !isLoopable;

  // Человекочитаемые ярлыки тегов для подписи под названием.
  const axes = padAxes(pad, ov);
  const tagLabels = [];
  for (const axis of SCENE_AXES) {
    for (const valId of axes[axis.id] || []) {
      const v = axisValue(axis.id, valId);
      if (v?.label) tagLabels.push(v.label);
    }
  }

  const fire = () => {
    if (audioEngine.isPlaying(pad.id)) { stop(pad.id, 0); return; }
    if (!pad.url) return;
    recordRecentPad(pad.id);
    if (isOneShot) audioEngine.triggerFile(pad.id, pad.url, title, volume);
    else audioEngine.playFile(pad.id, pad.url, title, volume, true);
  };

  return (
    <button
      onClick={fire}
      className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99]
        ${isActive
          ? 'bg-gradient-to-r from-orange-500/25 to-transparent border-orange-400/60'
          : 'bg-[#161616] border-white/10 hover:border-white/25'}`}
    >
      <Icon size={20} strokeWidth={1.6} className={isActive ? 'text-orange-200 shrink-0' : 'text-white/60 shrink-0'} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-tight truncate ${isActive ? 'text-orange-50' : 'text-white/80'}`}>{title}</div>
        {tagLabels.length > 0 && (
          <div className="text-[10px] font-mono tracking-wide text-white/30 truncate">
            {tagLabels.join(' · ')}
          </div>
        )}
      </div>
      <span className={`shrink-0 w-2 h-2 rounded-full ${isActive ? 'bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.9)]' : isOneShot ? 'bg-rose-500/40' : 'bg-cyan-500/40'}`} />
    </button>
  );
}