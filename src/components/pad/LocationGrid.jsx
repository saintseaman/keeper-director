import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { SCENE_AXES, resolveAxisIcon } from '@/lib/sceneAxes';
import { segmentBg } from '@/lib/segmentBackgrounds';

// Первый экран панели звуков: крупные плитки ЛОКАЦИЙ.
// Тап по плитке проваливает в категории этой локации. Звуков тут не видно.
// counts: { [locationId]: number }. Пустые локации скрыты.
const LOCATION_AXIS = SCENE_AXES.find((a) => a.id === 'location');

function LocationTile({ label, Icon, count, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 hover:border-orange-400/50 transition-colors active:scale-[0.97]"
    >
      {bg ? (
        <img src={bg} alt="" aria-hidden="true" loading="lazy" decoding="async"
          className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 bg-white/[0.04]" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />

      <span className="absolute top-2.5 left-2.5 flex items-center justify-center w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm ring-1 ring-white/15 text-white/90">
        <Icon size={18} strokeWidth={1.7} />
      </span>
      <span className="absolute top-3 right-3 text-[10px] font-mono tracking-widest text-white/60">{count}</span>

      <span className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-6 text-left">
        <span className="block text-[13px] font-semibold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
          {label}
        </span>
      </span>
    </button>
  );
}

export default function LocationGrid({ counts, total, customValues = [], onSelect }) {
  const allValues = [...LOCATION_AXIS.values, ...customValues];
  const visible = allValues.filter((v) => (counts[v.id] || 0) > 0);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Все звуки */}
        <LocationTile
          label="Все звуки"
          Icon={LayoutGrid}
          count={total}
          bg={null}
          onClick={() => onSelect(null)}
        />
        {visible.map((loc) => (
          <LocationTile
            key={loc.id}
            label={loc.label}
            Icon={resolveAxisIcon(loc.icon)}
            count={counts[loc.id]}
            bg={segmentBg(loc.id)}
            onClick={() => onSelect(loc.id)}
          />
        ))}
      </div>
    </div>
  );
}