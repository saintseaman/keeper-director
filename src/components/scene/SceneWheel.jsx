import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { segmentBg } from '@/lib/segmentBackgrounds';

const LONG_PRESS_MS = 450;

// «Колесо атмосферы» с фокусом на одной оси за раз.
// Сверху — табы осей (Локация / Действие / Погода). Активная ось
// рисуется ОДНИМ большим кольцом крупных сегментов вокруг кнопки запуска,
// поэтому сегменты читаемы и удобны для тапа. Выбранные значения других
// осей видны как чипы под колесом. selection = { location, action, weather, ... }.

const SIZE = 360;
const C = SIZE / 2;
const R_OUTER = 172;
const R_INNER = 78; // внутренний радиус кольца (граница с хабом)
const R_HUB = 66;

const AXIS_META = {
  location: { label: 'Локация', accent: '#60a5fa', glow: 'rgba(96,165,250,0.5)' },
  action: { label: 'Действие', accent: '#34d399', glow: 'rgba(52,211,153,0.5)' },
  weather: { label: 'Погода', accent: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
};
const AXIS_ORDER = ['location', 'action', 'weather'];

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(r1, r2, startDeg, endDeg) {
  const p1 = polar(C, C, r2, startDeg);
  const p2 = polar(C, C, r2, endDeg);
  const p3 = polar(C, C, r1, endDeg);
  const p4 = polar(C, C, r1, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${r2} ${r2} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${r1} ${r1} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

function textArcPath(r, startDeg, endDeg) {
  const mid = (startDeg + endDeg) / 2;
  const flip = mid > 90 && mid < 270;
  const a = flip ? endDeg : startDeg;
  const b = flip ? startDeg : endDeg;
  const p1 = polar(C, C, r, a);
  const p2 = polar(C, C, r, b);
  const sweep = flip ? 0 : 1;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`;
}

const spring = { type: 'spring', stiffness: 220, damping: 26 };

// Один крупный сегмент активного кольца.
function Segment({ axisId, value, start, end, rText, glow, active, onClick, onLongPress }) {
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const arcId = `arc-${axisId}-${value.id}`;
  const clipId = `clip-${axisId}-${value.id}`;
  const bg = segmentBg(value.id);
  const path = sectorPath(R_INNER, R_OUTER, start, end);

  const startPress = () => {
    longFiredRef.current = false;
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress?.(axisId, value.id);
    }, LONG_PRESS_MS);
  };
  const endPress = () => timerRef.current && clearTimeout(timerRef.current);
  const handleClick = () => {
    if (longFiredRef.current) { longFiredRef.current = false; return; }
    onClick(active ? null : value.id);
  };

  return (
    <g
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(axisId, value.id); }}
      className="cursor-pointer select-none"
    >
      <clipPath id={clipId}>
        <motion.path animate={{ d: path }} transition={spring} d={path} />
      </clipPath>

      <motion.path animate={{ d: path }} transition={spring} d={path} fill="rgba(255,255,255,0.03)" />

      {bg && (
        <image
          href={bg}
          x={C - R_OUTER}
          y={C - R_OUTER}
          width={R_OUTER * 2}
          height={R_OUTER * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          opacity={active ? 1 : 0.42}
          className="transition-opacity duration-300 pointer-events-none"
        />
      )}

      <motion.path
        animate={{ d: path, fill: active ? glow : 'rgba(0,0,0,0.42)' }}
        transition={spring}
        d={path}
        stroke={active ? '#ffffff' : 'rgba(255,255,255,0.08)'}
        strokeWidth={active ? 1.8 : 1}
        style={{ filter: active ? `drop-shadow(0 0 10px ${glow})` : 'none' }}
        className="pointer-events-none"
      />

      <path id={arcId} d={textArcPath(rText, start, end)} fill="none" />
      <text
        fontSize={13}
        fill={active ? '#fff' : 'rgba(255,255,255,0.92)'}
        className="pointer-events-none select-none"
        style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.8)', strokeWidth: 3.5, fontWeight: 600, letterSpacing: '0.02em' }}
      >
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
          {value.label}
        </textPath>
      </text>
    </g>
  );
}

// Сегмент «+» в конце кольца — добавить новый сегмент.
function AddSegment({ axisId, start, end, accent, onAdd }) {
  const path = sectorPath(R_INNER, R_OUTER, start, end);
  const pos = polar(C, C, (R_INNER + R_OUTER) / 2, (start + end) / 2);
  return (
    <g onClick={() => onAdd(axisId)} className="cursor-pointer select-none">
      <motion.path
        animate={{ d: path }}
        transition={spring}
        d={path}
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <g transform={`translate(${pos.x}, ${pos.y})`} className="pointer-events-none">
        <line x1={-8} y1={0} x2={8} y2={0} stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={0} y1={-8} x2={0} y2={8} stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    </g>
  );
}

export default function SceneWheel({ axes, selection, onSelect, onPlay, matchCount, onSegmentLongPress, onAddSegment }) {
  const [activeAxis, setActiveAxis] = useState('location');
  const axis = axes.find((a) => a.id === activeAxis);
  const values = axis?.values || [];
  const meta = AXIS_META[activeAxis];

  const slots = values.length + 1; // +1 под «добавить»
  const step = 360 / slots;
  const rText = (R_INNER + R_OUTER) / 2;

  // Чипы выбранных значений по неактивным осям.
  const otherChips = AXIS_ORDER.filter((id) => id !== activeAxis).map((id) => {
    const ax = axes.find((a) => a.id === id);
    const v = ax?.values.find((x) => x.id === selection[id]);
    return { id, label: AXIS_META[id].label, value: v?.label || null, accent: AXIS_META[id].accent };
  });

  return (
    <div className="flex flex-col items-center">
      {/* Табы осей */}
      <div className="flex items-center gap-1.5 mb-3 w-full">
        {AXIS_ORDER.map((id) => {
          const m = AXIS_META[id];
          const on = activeAxis === id;
          const chosen = !!selection[id];
          return (
            <button
              key={id}
              onClick={() => setActiveAxis(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-mono tracking-wider uppercase border transition-all ${
                on ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/45 border-white/10'
              }`}
              style={on ? { borderColor: m.accent, color: m.accent } : undefined}
            >
              {chosen && <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.accent }} />}
              {m.label}
            </button>
          );
        })}
      </div>

      <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-w-[400px]">
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(167,139,250,0.22)" />
            <stop offset="70%" stopColor="rgba(96,165,250,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="hubGrad" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#1f1f26" />
            <stop offset="100%" stopColor="#0c0c10" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={R_OUTER + 6} fill="url(#wheelGlow)" />
        <circle cx={C} cy={C} r={R_OUTER + 2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

        {values.map((v, i) => {
          const start = i * step;
          return (
            <Segment
              key={v.id}
              axisId={activeAxis}
              value={v}
              start={start}
              end={start + step}
              rText={rText}
              glow={meta.glow}
              active={selection[activeAxis] === v.id}
              onClick={(id) => onSelect(activeAxis, id)}
              onLongPress={onSegmentLongPress}
            />
          );
        })}
        <AddSegment
          axisId={activeAxis}
          start={values.length * step}
          end={slots * step}
          accent={meta.accent}
          onAdd={onAddSegment}
        />

        {/* Центральная кнопка запуска */}
        <g onClick={onPlay} className="cursor-pointer">
          <circle
            cx={C}
            cy={C}
            r={R_HUB}
            fill="url(#hubGrad)"
            stroke={matchCount > 0 ? 'rgba(249,115,22,0.85)' : 'rgba(255,255,255,0.18)'}
            strokeWidth={2}
            style={{ filter: matchCount > 0 ? 'drop-shadow(0 0 12px rgba(249,115,22,0.45))' : 'none' }}
            className="transition-all"
          />
          <path
            d={`M ${C - 13} ${C - 18} L ${C + 20} ${C} L ${C - 13} ${C + 18} Z`}
            fill={matchCount > 0 ? '#fb923c' : 'rgba(255,255,255,0.35)'}
            className="transition-all"
          />
          {matchCount > 0 && (
            <text x={C} y={C + 40} fontSize={11} fill="#fb923c" textAnchor="middle" className="font-mono pointer-events-none">
              {matchCount}
            </text>
          )}
        </g>
      </svg>

      {/* Чипы выбора по неактивным осям */}
      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
        {otherChips.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveAxis(c.id)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/55"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.value ? c.accent : 'rgba(255,255,255,0.2)' }} />
            <span className="text-white/40">{c.label}:</span>
            <span className={c.value ? 'text-white/80' : 'text-white/30'}>{c.value || '—'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}