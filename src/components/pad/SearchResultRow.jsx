import React from 'react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive, useAudioActions } from '@/lib/useAudio';
import { usePadFiles } from '@/lib/usePadFiles';
import { audioEngine } from '@/lib/audioEngine';

// Одна строка результата поиска: тап — воспроизведение (как на пэде).
export default function SearchResultRow({ sound }) {
  const isActive = useIsSoundActive(sound.id);
  const { toggle, trigger, stop } = useAudioActions();
  const { getFile } = usePadFiles();

  const Icon = getIcon(sound.icon);
  const file = getFile(sound.id);
  const isOneShot = !sound.isLoopable;

  const fire = () => {
    if (file) {
      if (isOneShot) audioEngine.triggerFile(sound.id, file.url);
      else if (audioEngine.isPlaying(sound.id)) stop(sound.id);
      else audioEngine.playFile(sound.id, file.url, sound.title, 0.6, true);
      return;
    }
    if (isOneShot) trigger(sound.id, sound.title);
    else toggle(sound.id, sound.title, 0.6, true);
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
        <div className={`text-sm leading-tight truncate ${isActive ? 'text-orange-50' : 'text-white/80'}`}>{sound.title}</div>
        <div className="text-[10px] font-mono tracking-wide text-white/30 truncate">
          {sound.category}{sound.tags?.length ? ' · ' + sound.tags.join(' · ') : ''}
        </div>
      </div>
      <span className={`shrink-0 w-2 h-2 rounded-full ${isActive ? 'bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.9)]' : isOneShot ? 'bg-rose-500/40' : 'bg-cyan-500/40'}`} />
    </button>
  );
}