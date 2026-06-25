import React from 'react';
import { getIcon } from '@/lib/iconMap';

// Курований набір иконок для выбора в настройках пэда.
const ICON_CHOICES = [
  'Volume2', 'Music', 'CloudRain', 'CloudDrizzle', 'Wind', 'CloudLightning',
  'Waves', 'Flame', 'Clock', 'Droplets', 'TreePine', 'Footprints',
  'BookOpen', 'Bell', 'Snowflake', 'Sun', 'Mountain', 'DoorOpen',
  'Bomb', 'Crosshair', 'Zap', 'Search', 'KeyRound', 'Users',
  'Fish', 'Bird', 'Eye', 'Skull', 'Bug', 'Ear',
  'Heart', 'HeartPulse', 'Megaphone', 'Orbit', 'AlertTriangle', 'Brain',
];

export default function IconPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-9 gap-1.5 max-h-40 overflow-y-auto pr-1">
      {ICON_CHOICES.map((name) => {
        const Icon = getIcon(name);
        const active = value === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`aspect-square rounded-md flex items-center justify-center border transition-colors
              ${active
                ? 'bg-orange-500/25 border-orange-400/70 text-orange-200'
                : 'bg-white/5 border-white/10 text-white/55 hover:border-white/30 hover:text-white/90'}`}
          >
            <Icon size={16} strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
}