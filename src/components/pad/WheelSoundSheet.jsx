import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive } from '@/lib/useAudio';
import { usePlaySound } from '@/lib/usePlaySound';

// Карточка звука в выезжающей панели сектора.
function SoundCard({ sound }) {
  const active = useIsSoundActive(sound.id);
  const { resolve, toggle } = usePlaySound();
  const meta = resolve(sound);
  const Icon = getIcon(meta?.icon);

  return (
    <button
      onClick={() => toggle(sound)}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 aspect-[4/5] transition-colors
        ${active
          ? 'bg-orange-500/20 border-orange-400/70 text-orange-100 shadow-[0_0_18px_-4px_rgba(249,115,22,0.55)]'
          : 'bg-white/[0.04] border-white/10 text-white/85 hover:border-white/30 hover:bg-white/[0.07]'}`}
    >
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-full ring-1
          ${active ? 'bg-orange-400/25 ring-orange-300/50' : 'bg-black/40 ring-white/10'}`}
      >
        <Icon size={18} strokeWidth={1.7} />
      </span>
      <span className="w-full text-[10px] font-semibold leading-tight text-center [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
        {meta?.title}
      </span>

      {active && (
        <span className="absolute top-1.5 right-1.5 flex items-end gap-[2px] h-2.5" aria-hidden="true">
          <span className="w-[2px] bg-orange-300 rounded-full animate-[eqbar_0.7s_ease-in-out_infinite] h-1.5 origin-bottom" />
          <span className="w-[2px] bg-orange-300 rounded-full animate-[eqbar_0.7s_ease-in-out_infinite] [animation-delay:0.15s] h-2.5 origin-bottom" />
          <span className="w-[2px] bg-orange-300 rounded-full animate-[eqbar_0.7s_ease-in-out_infinite] [animation-delay:0.3s] h-1 origin-bottom" />
        </span>
      )}
    </button>
  );
}

// Выезжающая снизу панель со звуками выбранного сектора колеса.
// Чистая сетка карточек — без наложений поверх колеса, читаемо на любом числе.
export default function WheelSoundSheet({ category, pads, onClose }) {
  if (!category) return null;
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      className="mt-4 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2 text-white/90">
          <Icon size={16} strokeWidth={1.8} />
          <span className="text-[12px] font-mono tracking-wider">{category.label}</span>
          <span className="text-[10px] font-mono text-white/40">{pads.length}</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 max-h-[42vh] overflow-y-auto">
        {pads.map((p) => (
          <SoundCard key={p.id} sound={p} />
        ))}
      </div>
    </motion.div>
  );
}