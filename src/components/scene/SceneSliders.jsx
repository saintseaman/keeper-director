import React from 'react';

// Ползунок Интенсивности — непрерывный 0..1, цвето-реактивный.
// Цвет трека и ручки: синий → фиолетовый → красный.
// Подпись текущего состояния: <0.33 Спокойно, <0.66 Напряжённо, иначе Ужас.

// Линейная интерполяция между двумя hex-цветами по t∈[0,1].
function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

// Цвет ручки по позиции: 0→синий, 0.5→фиолетовый, 1→красный.
function thumbColorAt(t) {
  if (t < 0.5) return lerpColor('#3b82f6', '#a855f7', t / 0.5);
  return lerpColor('#a855f7', '#ef4444', (t - 0.5) / 0.5);
}

function intensityLabel(i) {
  if (i < 0.33) return 'Спокойно';
  if (i < 0.66) return 'Напряжённо';
  return 'Ужас';
}

export default function SceneSliders({ value = 0.5, onChange }) {
  const t = Math.min(1, Math.max(0, value));
  const thumbColor = thumbColorAt(t);

  // Тап/перетаскивание по дорожке: позиция клика → значение 0..1.
  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onChange?.(ratio);
  };
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pick(e);
  };
  const onPointerMove = (e) => {
    if (e.buttons === 1) pick(e);
  };

  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-[11px] font-mono tracking-wider uppercase text-white/55">Интенсив.</span>
        <div className="flex-1">
          <div
            role="slider"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={t}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            className="relative h-5 flex items-center cursor-pointer touch-none"
          >
            {/* Трек-градиент */}
            <div
              className="absolute inset-x-0 h-1.5 rounded-full"
              style={{ background: 'linear-gradient(to right, #3b82f6, #a855f7, #ef4444)' }}
            />
            {/* Ручка */}
            <span
              className="absolute w-4 h-4 rounded-full border-2 border-white/80 -translate-x-1/2 transition-[box-shadow]"
              style={{
                left: `${t * 100}%`,
                background: thumbColor,
                boxShadow: `0 0 10px ${thumbColor}`,
              }}
            />
          </div>
          <div className="text-center mt-0.5" style={{ fontSize: 10, minHeight: 12 }}>
            <span style={{ color: thumbColor, fontWeight: 600 }}>{intensityLabel(t)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}