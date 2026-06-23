import React from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/useAudio';

const TRIGGERS = [
  { id: 'jump_slam', label: 'SLAM', emoji: '💥' },
  { id: 'door_slam', label: 'DOOR', emoji: '🚪' },
  { id: 'chase_music', label: 'CHASE', emoji: '🏃' },
  { id: 'shoggoth_mass', label: 'MONSTER', emoji: '👁' },
  { id: 'cultist_chant', label: 'RITUAL', emoji: '🕯' },
  { id: 'heartbeat_fast', label: 'PANIC', emoji: '💀' },
];

export default function QuickTrigger() {
  const { trigger, toggle } = useAudio();

  const handleTrigger = (t) => {
    if (t.id === 'chase_music' || t.id === 'cultist_chant' || t.id === 'heartbeat_fast') {
      toggle(t.id, t.label, 0.6, true);
    } else {
      trigger(t.id, t.label);
    }
  };

  return (
    <div className="grid grid-cols-6 gap-1.5">
      {TRIGGERS.map(t => (
        <motion.button
          key={t.id}
          whileTap={{ scale: 0.85 }}
          onClick={() => handleTrigger(t)}
          className="flex flex-col items-center justify-center py-2.5 rounded-lg bg-graphite-light/80 border border-border hover:border-brass-dim/30 transition-all"
        >
          <span className="text-lg leading-none">{t.emoji}</span>
          <span className="text-[9px] font-heading tracking-wider text-parchment-dim mt-1">{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
}