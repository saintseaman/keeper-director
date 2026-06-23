import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAudio } from '@/lib/useAudio';

export default function PanicButton() {
  const { panic } = useAudio();
  const [triggered, setTriggered] = useState(false);

  const handlePanic = () => {
    panic();
    setTriggered(true);
    setTimeout(() => setTriggered(false), 1000);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handlePanic}
      className={`
        w-full py-4 rounded-lg border-2 flex items-center justify-center gap-3 transition-all font-heading tracking-widest text-sm uppercase
        ${triggered
          ? 'bg-red-800/60 border-red-600 panic-glow text-red-100'
          : 'bg-red-950/40 border-red-900/50 hover:bg-red-900/40 text-red-300'
        }
      `}
    >
      <AlertTriangle size={20} className={triggered ? 'text-red-300' : 'text-red-500'} />
      PANIC
      <AlertTriangle size={20} className={triggered ? 'text-red-300' : 'text-red-500'} />
    </motion.button>
  );
}