import React from 'react';
import {
  CloudRain, CloudLightning, Flame, Wind, DoorOpen, Footprints,
  Ear, Megaphone, Music, HeartPulse, Skull, Square, Volume2,
} from 'lucide-react';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';
import { ACCENTS } from '@/lib/demoScene';

const ICONS = {
  CloudRain, CloudLightning, Flame, Wind, DoorOpen, Footprints,
  Ear, Megaphone, Music, HeartPulse, Skull, Square,
};

// Одна кнопка демо-сцены. Использует встроенный синтез audioEngine —
// ни Google Диска, ни файлов, ни аккаунта. Loop → тумблер с активным
// состоянием; one-shot → повторный триггер; cut → останов всего.
export default function DemoPad({ sound, onCut }) {
  const isLoop = sound.kind === 'loop';
  const active = useIsSoundActive(isLoop ? sound.id : '__never__');
  const Icon = ICONS[sound.icon] || Volume2;
  const accent = ACCENTS[sound.accent] || ACCENTS.slate;

  const handlePress = () => {
    if (sound.kind === 'cut') { onCut(); return; }
    if (sound.kind === 'oneshot') {
      audioEngine.trigger(sound.id, sound.label);
      return;
    }
    // loop — тумблер
    if (audioEngine.isPlaying(sound.id)) audioEngine.stop(sound.id, 0.4);
    else audioEngine.play(sound.id, sound.label, sound.volume, true);
  };

  const isCut = sound.kind === 'cut';

  return (
    <button
      onClick={handlePress}
      className={`group relative flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl border bg-graphite/60 backdrop-blur-sm transition-all duration-200 select-none active:scale-[0.97]
        ${active ? accent.active : `${accent.idle} hover:bg-white/[0.04]`}
        ${isCut ? 'bg-rose-950/40' : ''}`}
    >
      <Icon
        size={26}
        strokeWidth={1.8}
        className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`}
      />
      <span className="text-[10px] sm:text-[11px] font-heading tracking-wide text-center leading-tight px-1">
        {sound.label}
      </span>

      {/* Индикатор активного лупа */}
      {isLoop && active && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-current sound-active" />
      )}
      {sound.kind === 'oneshot' && (
        <span className="absolute top-2 right-2 text-[7px] font-mono tracking-widest text-current/50 uppercase">1×</span>
      )}
    </button>
  );
}