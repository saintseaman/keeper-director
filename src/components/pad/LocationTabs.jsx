import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { SCENE_AXES, resolveAxisIcon } from '@/lib/sceneAxes';

// Лента вкладок ЛОКАЦИЙ над декой (заменяет табы категорий).
// Звук может принадлежать нескольким локациям, поэтому фильтр идёт по
// оси `location` пэда. counts: { [locationId]: number }. Пустые локации
// скрываются. active === null → «Все».
const LOCATION_AXIS = SCENE_AXES.find((a) => a.id === 'location');

export default function LocationTabs({ active, onChange, counts, total, customValues = [] }) {
  const allValues = [...LOCATION_AXIS.values, ...customValues];
  const visible = allValues.filter((v) => (counts[v.id] || 0) > 0);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
      {/* Все */}
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono tracking-wider border transition-colors
          ${active === null
            ? 'bg-white/15 border-white/40 text-white'
            : 'bg-white/5 border-white/10 text-white/45 hover:text-white/70'}`}
      >
        <LayoutGrid size={13} />
        Все
        <span className="text-[9px] opacity-60">{total}</span>
      </button>

      {visible.map((loc) => {
        const Icon = resolveAxisIcon(loc.icon);
        const isActive = active === loc.id;
        return (
          <button
            key={loc.id}
            onClick={() => onChange(loc.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono tracking-wider border transition-colors
              ${isActive
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-100'
                : 'bg-white/5 border-white/10 text-sky-300/50 hover:text-white/70'}`}
          >
            <Icon size={13} />
            {loc.label}
            <span className="text-[9px] opacity-60">{counts[loc.id]}</span>
          </button>
        );
      })}
    </div>
  );
}