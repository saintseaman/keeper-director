import React from 'react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive, useAudioActions } from '@/lib/useAudio';

// Один пэд драм-пада в стиле Pioneer DDJ.
// loopable -> toggle (горит, пока играет), one-shot -> trigger (вспышка).
export default function Pad({ sound, index }) {
  const isActive = useIsSoundActive(sound?.id);
  const { toggle, trigger } = useAudioActions();

  if (!sound) {
    // Пустой слот — глухой неактивный пэд, чтобы сетка 3x3 всегда держала форму.
    return <div className="aspect-square rounded-xl bg-[#0c0c0c] border border-white/5" />;
  }

  const Icon = getIcon(sound.icon);
  const isOneShot = !sound.isLoopable;

  const handlePress = () => {
    if (isOneShot) trigger(sound.id, sound.title);
    else toggle(sound.id, sound.title, 0.6, true);
  };

  return (
    <button
      onClick={handlePress}
      className={`group relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-1.5 select-none transition-all duration-100 active:scale-[0.96]
        ${isActive
          ? 'bg-gradient-to-b from-orange-500/30 to-orange-600/10 border-orange-400/70 shadow-[0_0_24px_-2px_rgba(249,115,22,0.55)]'
          : 'bg-gradient-to-b from-[#1c1c1e] to-[#141414] border-white/10 hover:border-white/25'}
      `}
    >
      {/* Номер слота — как на железе */}
      <span className={`absolute top-2 left-2.5 text-[9px] font-mono tracking-widest ${isActive ? 'text-orange-200/80' : 'text-white/25'}`}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Индикатор loop / one-shot */}
      <span className={`absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.9)]' : isOneShot ? 'bg-rose-500/40' : 'bg-cyan-500/40'}`} />

      <Icon size={26} className={isActive ? 'text-orange-100' : 'text-white/70 group-hover:text-white'} strokeWidth={1.5} />

      <span className={`px-1 text-[10px] font-medium leading-tight text-center tracking-wide truncate max-w-full ${isActive ? 'text-orange-50' : 'text-white/55 group-hover:text-white/80'}`}>
        {sound.title}
      </span>
    </button>
  );
}