import React from 'react';

// Слайдеры Intensity / Mood в стиле TableTone (3-позиционные).
// Каждый управляет одной осью сцены через дискретные значения.

function StepSlider({ label, value, steps, gradient, onChange }) {
  const idx = Math.max(0, steps.findIndex((s) => s.id === value));
  const safeIdx = idx === -1 ? 1 : idx;

  return (
    <div>
      <div className="text-sm font-medium text-white/85 mb-2">{label}</div>
      <div className="relative h-6 flex items-center">
        {/* Дорожка */}
        <div className={`absolute inset-x-0 h-1.5 rounded-full ${gradient}`} />
        {/* Точки-позиции */}
        <div className="relative w-full flex justify-between">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className="relative flex items-center justify-center"
              style={{ width: 20, height: 20 }}
            >
              <span
                className={`rounded-full border-2 transition-all ${
                  i === safeIdx
                    ? 'w-5 h-5 bg-violet-400 border-white shadow-[0_0_12px_rgba(168,85,247,0.7)]'
                    : 'w-3 h-3 bg-white/20 border-white/30'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-1">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={`text-xs ${i === safeIdx ? 'text-white font-semibold' : 'text-white/40'}`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const INTENSITY_STEPS = [
  { id: 'calm', label: 'Спокойно' },
  { id: 'tense', label: 'Напряжённо' },
  { id: 'horror', label: 'Ужас' },
];

const MOOD_STEPS = [
  { id: 'night', label: 'Тёмное' },
  { id: null, label: 'Нейтрально' },
  { id: 'sunny', label: 'Светлое' },
];

export default function SceneSliders({ selection, onSelect }) {
  return (
    <div className="space-y-5 px-1">
      <StepSlider
        label="Интенсивность"
        value={selection.mood}
        steps={INTENSITY_STEPS}
        gradient="bg-gradient-to-r from-sky-500/40 via-violet-500/50 to-rose-500/60"
        onChange={(id) => onSelect('mood', selection.mood === id ? null : id)}
      />
      <StepSlider
        label="Настроение"
        value={selection.weather}
        steps={MOOD_STEPS}
        gradient="bg-gradient-to-r from-indigo-900/60 via-white/10 to-amber-300/40"
        onChange={(id) => onSelect('weather', selection.weather === id ? null : id)}
      />
    </div>
  );
}