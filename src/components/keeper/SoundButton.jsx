import React from 'react';
import { motion } from 'framer-motion';
import { getIcon } from '@/lib/iconMap';
import { useAudio } from '@/lib/useAudio';

export default function SoundButton({ sound, size = 'normal' }) {
  const { activeSounds, toggle, trigger } = useAudio();
  const isActive = !!activeSounds[sound.id];

  const IconComponent = getIcon(sound.icon);

  const handlePress = () => {
    if (sound.isLoopable) {
      toggle(sound.id, sound.title, 0.5, true);
    } else {
      trigger(sound.id, sound.title);
    }
  };

  const isJumpscare = sound.category === 'jumpscare';
  const sizeClasses = size === 'large' ? 'min-h-[80px] p-4' : 'min-h-[64px] p-3';

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={handlePress}
      className={`
        relative rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-1.5
        ${sizeClasses}
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
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-brass/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <IconComponent
        size={size === 'large' ? 24 : 20}
        className={isActive ? 'text-brass-glow' : isJumpscare ? 'text-red-400' : 'text-parchment-dim'}
      />
      <span className={`text-xs font-heading tracking-wide leading-tight text-center
        ${isActive ? 'text-brass-glow' : isJumpscare ? 'text-red-300' : 'text-parchment-dim'}
      `}>
        {sound.title}
      </span>
      {isActive && sound.isLoopable && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brass-glow sound-active" />
      )}
    </motion.button>
  );
}