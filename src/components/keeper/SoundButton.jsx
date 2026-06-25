import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive, useAudioActions } from '@/lib/useAudio';
import { localizedSoundTitle } from '@/lib/contentI18n';
import { useLang } from '@/lib/LangContext';
import { useMode } from '@/lib/ModeContext';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import SoundEditDialog from './SoundEditDialog';

export default function SoundButton({ sound, size = 'normal' }) {
  // Селекторна підписка (M5): перемальовуємось лише при зміні статусу СВОГО звуку.
  const isActive = useIsSoundActive(sound.id);
  const { toggle, trigger } = useAudioActions();
  const { lang } = useLang();
  const { isEdit } = useMode();
  const { getOverride } = useSoundOverrides();
  const [editOpen, setEditOpen] = useState(false);

  const IconComponent = getIcon(sound.icon);
  const override = getOverride(sound.id);
  const playVolume = typeof override.baseVolume === 'number' ? override.baseVolume : 0.5;

  const handlePress = () => {
    // У режимі Edit тап відкриває редактор (нічого не програється під час підготовки).
    if (isEdit) {
      setEditOpen(true);
      return;
    }
    if (sound.isLoopable) {
      toggle(sound.id, sound.title, playVolume, true);
    } else {
      trigger(sound.id, sound.title);
    }
  };

  const isJumpscare = sound.category === 'jumpscare';
  const sizeClasses = size === 'large' ? 'min-h-[80px] p-4' : 'min-h-[64px] p-3';

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handlePress}
        className={`
          relative rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-1.5
          ${sizeClasses}
          ${isEdit ? 'border-dashed' : ''}
          ${isJumpscare
            ? isActive
              ? 'bg-red-900/60 border-red-700/80 panic-glow'
              : 'bg-red-950/40 border-red-900/40 hover:bg-red-900/30'
            : isActive
              ? 'bg-brass-dim/20 border-brass/40 brass-glow'
              : 'bg-graphite-light/60 border-border hover:bg-graphite-light'
          }
        `}
      >
        {isActive && !isEdit && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-brass/5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Іконка налаштувань — лише в режимі Edit */}
        {isEdit && (
          <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-brass-dim/30 border border-brass/40 flex items-center justify-center">
            <Settings2 size={11} className="text-brass-glow" />
          </div>
        )}

        {/* Позначка «перевірено» */}
        {override.verified && (
          <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-500/70" />
        )}

        <IconComponent
          size={size === 'large' ? 24 : 20}
          className={isActive ? 'text-brass-glow' : isJumpscare ? 'text-red-400' : 'text-parchment-dim'}
        />
        <span className={`text-xs font-heading tracking-wide leading-tight text-center
          ${isActive ? 'text-brass-glow' : isJumpscare ? 'text-red-300' : 'text-parchment-dim'}
        `}>
          {localizedSoundTitle(sound.id, lang, sound.title)}
        </span>
        {isActive && sound.isLoopable && !isEdit && (
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brass-glow sound-active" />
        )}
      </motion.button>

      <SoundEditDialog sound={sound} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}