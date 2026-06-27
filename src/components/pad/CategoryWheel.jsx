import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Square } from 'lucide-react';
import { PAD_CATEGORIES } from '@/lib/padCategories';
import WheelSoundSheet from './WheelSoundSheet';

// Палитра секторов по категориям (заливка / обводка / акцент активного).
const SECTOR_FILL = {
  sky:     { base: '#0c4a6e', active: '#0ea5e9' },
  cyan:    { base: '#155e63', active: '#06b6d4' },
  green:   { base: '#14532d', active: '#22c55e' },
  slate:   { base: '#334155', active: '#94a3b8' },
  violet:  { base: '#4c1d95', active: '#8b5cf6' },
  rose:    { base: '#881337', active: '#f43f5e' },
  amber:   { base: '#78350f', active: '#f59e0b' },
  emerald: { base: '#064e3b', active: '#10b981' },
  orange:  { base: '#7c2d12', active: '#f97316' },
};

const SIZE = 300;
const C = SIZE / 2;
const R_OUT = 144;
const R_IN = 62;

// Точка на окружности (deg: 0° сверху, по часовой).
function pt(cx, cy, r, deg) {
  const rad = (deg - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// SVG-path кольцевого сектора между углами a0..a1.
function sectorPath(a0, a1) {
  const [x0o, y0o] = pt(C, C, R_OUT, a0);
  const [x1o, y1o] = pt(C, C, R_OUT, a1);
  const [x0i, y0i] = pt(C, C, R_IN, a0);
  const [x1i, y1i] = pt(C, C, R_IN, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0o} ${y0o} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${R_IN} ${R_IN} 0 ${large} 0 ${x0i} ${y0i} Z`;
}

// Радиальное колесо категорий в стиле кругового меню Dota 2.
// catCounts: { [catId]: number } — категории без звуков скрыты.
// padsByCat: { [catId]: pad[] } — звуки для выезжающей панели.
// activeCount, onStop — для центра колеса.
export default function CategoryWheel({ catCounts, padsByCat, activeCount, onStop }) {
  const [openCat, setOpenCat] = useState(null);

  const cats = PAD_CATEGORIES.filter((c) => (catCounts[c.id] || 0) > 0);
  const seg = cats.length > 0 ? 360 / cats.length : 360;
  const openCatObj = cats.find((c) => c.id === openCat) || null;

  return (
    <div className="h-full flex flex-col items-center justify-start pt-2 overflow-y-auto">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 overflow-visible">
          {cats.map((cat, i) => {
            const a0 = i * seg + 1;
            const a1 = (i + 1) * seg - 1;
            const mid = (a0 + a1) / 2;
            const pal = SECTOR_FILL[cat.color] || SECTOR_FILL.orange;
            const isOpen = openCat === cat.id;
            // Иконку чуть ближе к внешнему краю, счётчик — у центра.
            const [ix, iy] = pt(C, C, (R_OUT + R_IN) / 2 + 8, mid);
            const [cx, cy] = pt(C, C, (R_OUT + R_IN) / 2 - 18, mid);
            const Icon = cat.icon;
            return (
              <g key={cat.id} className="cursor-pointer group" onClick={() => setOpenCat(isOpen ? null : cat.id)}>
                <path
                  d={sectorPath(a0, a1)}
                  fill={pal.base}
                  fillOpacity={isOpen ? 1 : 0.5}
                  stroke={isOpen ? pal.active : 'rgba(255,255,255,0.10)'}
                  strokeWidth={isOpen ? 3 : 1}
                  className="transition-all duration-150"
                  style={isOpen ? { filter: `drop-shadow(0 0 8px ${pal.active}66)` } : undefined}
                />
                {/* Иконка категории */}
                <foreignObject x={ix - 14} y={iy - 14} width={28} height={28} className="pointer-events-none">
                  <div className="flex items-center justify-center w-7 h-7 text-white">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>
                </foreignObject>
                {/* Название категории */}
                <text
                  x={cx} y={cy + 1}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize="10"
                  fill="rgba(255,255,255,0.95)"
                  style={{ fontWeight: 600 }}
                >
                  {cat.label}
                </text>
                {/* Счётчик */}
                <text
                  x={cx} y={cy + 12}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize="8.5"
                  fill={pal.active}
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                >
                  {catCounts[cat.id]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Центр колеса: счётчик активных + STOP */}
        <button
          onClick={(e) => { e.stopPropagation(); if (activeCount > 0) onStop(); }}
          disabled={activeCount === 0}
          style={{ width: R_IN * 2 - 14, height: R_IN * 2 - 14 }}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 rounded-full flex flex-col items-center justify-center gap-0.5 border transition-colors
            ${activeCount > 0
              ? 'bg-rose-600/25 border-rose-500/60 text-rose-200 hover:bg-rose-600/35'
              : 'bg-black/70 border-white/15 text-white/40'}`}
        >
          {activeCount > 0 ? (
            <>
              <span className="text-2xl font-bold leading-none">{activeCount}</span>
              <span className="flex items-center gap-1 text-[9px] font-mono tracking-widest uppercase">
                <Square size={9} className="fill-rose-300" /> Стоп
              </span>
            </>
          ) : (
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase text-center px-2 leading-tight">Выбери<br />сектор</span>
          )}
        </button>
      </div>

      {/* Выезжающая панель со звуками выбранного сектора */}
      <div className="w-full max-w-md px-1">
        <AnimatePresence mode="wait">
          {openCatObj && (
            <WheelSoundSheet
              key={openCatObj.id}
              category={openCatObj}
              pads={padsByCat[openCatObj.id] || []}
              onClose={() => setOpenCat(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}