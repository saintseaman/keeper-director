import React from 'react';
import { motion } from 'framer-motion';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive } from '@/lib/useAudio';
import { usePlaySound } from '@/lib/usePlaySound';

const MAX_PADS = 8; // веер показывает только топ-8 звуков сектора

// Один мини-пэд, выезжающий из сектора. Подсвечивается, когда звук играет.
function ArcPad({ sound, angle, radius, delay }) {
  const active = useIsSoundActive(sound.id);
  const { resolve, toggle } = usePlaySound();
  const meta = resolve(sound);
  const Icon = getIcon(meta?.icon);

  // Позиция по дуге: angle в градусах, 0° — вверх, по часовой.
  const rad = (angle - 90) * (Math.PI / 180);
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <motion.button
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
      animate={{ x, y, opacity: 1, scale: 1 }}
      exit={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26, delay }}
      onClick={() => toggle(sound)}
      style={{ left: '50%', top: '50%' }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
    >
      <span
        className={`flex flex-col items-center justify-center gap-0.5 w-[64px] h-[64px] rounded-2xl border backdrop-blur-sm transition-colors
          ${active
            ? 'bg-orange-500/30 border-orange-400/70 text-orange-100 shadow-[0_0_20px_-2px_rgba(249,115,22,0.6)]'
            : 'bg-black/60 border-white/15 text-white/85 hover:border-white/35'}`}
      >
        <Icon size={20} strokeWidth={1.7} />
        <span className="px-1 text-[8px] font-semibold leading-tight text-center w-full truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
          {meta?.title}
        </span>
        {active && (
          <span className="absolute inset-0 rounded-2xl ring-2 ring-orange-400/70 animate-pulse pointer-events-none" />
        )}
      </span>
    </motion.button>
  );
}

// Раскрытый веер: только первые 8 звуков сектора, равномерно по верхней дуге.
// Фиксированный максимум держит пэды в пределах колеса — без наложений и
// обрезки краями экрана. Если звуков больше — снизу бейдж «+N».
export default function WheelSoundArc({ pads }) {
  const shown = pads.slice(0, MAX_PADS);
  const n = shown.length;
  const rest = pads.length - n;

  const radius = 128;
  const spread = n <= 1 ? 0 : Math.min(200, (n - 1) * 30); // общий угол дуги
  const start = -spread / 2;
  const stepAngle = n > 1 ? spread / (n - 1) : 0;

  return (
    <>
      {shown.map((p, i) => (
        <ArcPad
          key={p.id}
          sound={p}
          angle={n === 1 ? 0 : start + stepAngle * i}
          radius={radius}
          delay={i * 0.03}
        />
      ))}

      {rest > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: n * 0.03 + 0.05 }}
          className="absolute left-1/2 bottom-[-6px] -translate-x-1/2 z-20 rounded-full px-2.5 py-1 text-[9px] font-mono tracking-wider bg-black/70 border border-white/15 text-white/55 pointer-events-none"
        >
          +{rest} ещё
        </motion.div>
      )}
    </>
  );
}