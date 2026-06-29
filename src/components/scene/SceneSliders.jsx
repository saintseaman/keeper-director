import React from 'react';

// Слайдеры Intensity / Mood — минималистичные, цвето-реактивные.
// Внешне это непрерывные 0..1 ползунки, но логика остаётся дискретной:
// позиция маппится на 3 значения оси (calm/tense/horror и night/null/sunny),
// чтобы не менять контракт selection/onSelect.

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

// Универсальный цвето-реактивный ползунок поверх 3 дискретных шагов.
function ColorSlider({ value, steps, trackGradient, fromColor, toColor }) {
  // Индекс активного шага → позиция t∈[0,1] (0, 0.5, 1).
  const activeIdx = steps.findIndex((s) => s.id === value);
  const idx = activeIdx === -1 ? -1 : activeIdx;
  const t = idx === -1 ? 0 : idx / (steps.length - 1);
  const thumbColor = lerpColor(fromColor, toColor, t);
  const current = idx === -1 ? null : steps[idx];

  // Тап по дорожке: переводим позицию клика в ближайший шаг.
  const handleTrack = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const nearest = Math.round(ratio * (steps.length - 1));
    steps[nearest].onPick();
  };

  return (
    <div>
      <div
        role="slider"
        onClick={handleTrack}
        className="relative h-5 flex items-center cursor-pointer"
      >
        {/* Трек-градиент */}
        <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: trackGradient }} />
        {/* Ручка */}
        {idx !== -1 && (
          <span
            className="absolute w-4 h-4 rounded-full border-2 border-white/80 -translate-x-1/2 transition-all"
            style={{
              left: `${t * 100}%`,
              background: thumbColor,
              boxShadow: `0 0 10px ${thumbColor}`,
            }}
          />
        )}
      </div>
      <div className="text-center mt-0.5" style={{ fontSize: 10, minHeight: 12 }}>
        {current && <span style={{ color: thumbColor, fontWeight: 600 }}>{current.label}</span>}
      </div>
    </div>
  );
}

export default function SceneSliders({ selection, onSelect }) {
  // Интенсивность управляет осью mood, Настроение — осью weather (как было).
  const intensitySteps = [
    { id: 'calm', label: 'Спокойно', onPick: () => onSelect('mood', selection.mood === 'calm' ? null : 'calm') },
    { id: 'tense', label: 'Напряжённо', onPick: () => onSelect('mood', selection.mood === 'tense' ? null : 'tense') },
    { id: 'horror', label: 'Ужас', onPick: () => onSelect('mood', selection.mood === 'horror' ? null : 'horror') },
  ];

  const moodSteps = [
    { id: 'night', label: 'Тёмное', onPick: () => onSelect('weather', selection.weather === 'night' ? null : 'night') },
    { id: null, label: 'Нейтрально', onPick: () => onSelect('weather', selection.weather === null ? null : null) },
    { id: 'sunny', label: 'Светлое', onPick: () => onSelect('weather', selection.weather === 'sunny' ? null : 'sunny') },
  ];

  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-[11px] font-mono tracking-wider uppercase text-white/55">Интенсив.</span>
        <div className="flex-1">
          <ColorSlider
            value={selection.mood}
            steps={intensitySteps}
            trackGradient="linear-gradient(to right, #3b82f6, #a855f7, #ef4444)"
            fromColor="#3b82f6"
            toColor="#ef4444"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-[11px] font-mono tracking-wider uppercase text-white/55">Настроение</span>
        <div className="flex-1">
          <ColorSlider
            value={selection.weather}
            steps={moodSteps}
            trackGradient="linear-gradient(to right, #1e293b, #64748b, #fbbf24)"
            fromColor="#1e293b"
            toColor="#fbbf24"
          />
        </div>
      </div>
    </div>
  );
}