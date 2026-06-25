import React, { useRef, useState } from 'react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive, useAudioActions } from '@/lib/useAudio';
import { usePadFiles } from '@/lib/usePadFiles';
import { audioEngine } from '@/lib/audioEngine';
import PadEditDialog from './PadEditDialog';

const LONG_PRESS_MS = 500;

// Один пэд драм-пада в стиле Pioneer DDJ.
// Короткий тап — воспроизведение; зажатие (long-press) — редактирование (загрузка MP3).
export default function Pad({ sound, index }) {
  const isActive = useIsSoundActive(sound?.id);
  const { toggle, trigger, stop } = useAudioActions();
  const { getFile } = usePadFiles();
  const [editOpen, setEditOpen] = useState(false);
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);

  if (!sound) {
    return <div className="aspect-square rounded-xl bg-[#0c0c0c] border border-white/5" />;
  }

  const Icon = getIcon(sound.icon);
  const file = getFile(sound.id);
  const isOneShot = !sound.isLoopable;

  const fire = () => {
    if (file) {
      // У пэда свой MP3.
      if (isOneShot) {
        audioEngine.triggerFile(sound.id, file.url);
      } else {
        if (audioEngine.isPlaying(sound.id)) stop(sound.id);
        else audioEngine.playFile(sound.id, file.url, sound.title, 0.6, true);
      }
      return;
    }
    if (isOneShot) trigger(sound.id, sound.title);
    else toggle(sound.id, sound.title, 0.6, true);
  };

  const startPress = () => {
    longFiredRef.current = false;
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      setEditOpen(true);
      if (navigator.vibrate) navigator.vibrate(15);
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!longFiredRef.current) fire(); // короткий тап
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <>
      <button
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className={`group relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-1.5 select-none touch-none transition-all duration-100 active:scale-[0.96]
          ${isActive
            ? 'bg-gradient-to-b from-orange-500/30 to-orange-600/10 border-orange-400/70 shadow-[0_0_24px_-2px_rgba(249,115,22,0.55)]'
            : 'bg-gradient-to-b from-[#1c1c1e] to-[#141414] border-white/10 hover:border-white/25'}
        `}
      >
        <span className={`absolute top-2 left-2.5 text-[9px] font-mono tracking-widest ${isActive ? 'text-orange-200/80' : 'text-white/25'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className={`absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.9)]' : isOneShot ? 'bg-rose-500/40' : 'bg-cyan-500/40'}`} />

        {/* Метка пользовательского MP3 */}
        {file && (
          <span className="absolute bottom-2 left-2.5 text-[8px] font-mono tracking-widest text-orange-300/70">MP3</span>
        )}

        <Icon size={26} className={isActive ? 'text-orange-100' : 'text-white/70 group-hover:text-white'} strokeWidth={1.5} />

        <span className={`px-1 text-[10px] font-medium leading-tight text-center tracking-wide truncate max-w-full ${isActive ? 'text-orange-50' : 'text-white/55 group-hover:text-white/80'}`}>
          {sound.title}
        </span>
      </button>

      <PadEditDialog sound={sound} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}