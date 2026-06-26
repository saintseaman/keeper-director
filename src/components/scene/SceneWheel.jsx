import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { segmentBg } from '@/lib/segmentBackgrounds';

const LONG_PRESS_MS = 450;

// Радиальное «колесо атмосферы».
// Три кольца: локации (внешнее) → действия (среднее) → погода (внутреннее),
// центр — кнопка запуска. Сегменты органично перестраиваются (framer-motion)
// при добавлении/удалении. selection = { location, action, weather, ... }.

const SIZE = 340;
const C = SIZE / 2;
const R_OUTER = 166;
const R_R2 = 118; // граница локация / действие
const R_R3 = 76; // граница действие / погода
const R_INNER = 40; // внутренний радиус кольца погоды
const R_HUB = 34;

const RING_DEFS = {
  location: { r1: R_R2, r2: R_OUTER, fontSize: 11, accent: '#60a5fa', glow: 'rgba(96,165,250,0.55)' },
  action: { r1: R_R3, r2: R_R2, fontSize: 10, accent: '#34d399', glow: 'rgba(52,211,153,0.55)' },
  weather: { r1: R_INNER, r2: R_R3, fontSize: 9, accent: '#a78bfa', glow: 'rgba(167,139,250,0.55)' },
};

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

// Один сегмент кольца. Анимирует свой путь при перестроении набора.
function Segment({ axisId, value, start, end, r1, r2, rText, fontSize, accent, glow, active, onClick, onLongPress }) {
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const arcId = `arc-${axisId}-${value.id}`;
  const clipId = `clip-${axisId}-${value.id}`;
  const bg = segmentBg(value.id);
  const path = sectorPath(r1, r2, start, end);
  const showLabel = end - start > 16; // прячем подпись на совсем узких

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

      {/* Базовая заливка */}
      <motion.path
        animate={{ d: path }}
        transition={spring}
        d={path}
        fill="rgba(255,255,255,0.03)"
      />
      {/* Фон сегмента */}
      {bg && (
        <image
          href={bg}
          x={C - r2}
          y={C - r2}
          width={r2 * 2}
          height={r2 * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          opacity={active ? 1 : 0.42}
          className="transition-opacity duration-300 pointer-events-none"
        />
      )}
      {/* Тонировка / подсветка активного */}
      <motion.path
        animate={{ d: path, fill: active ? glow : 'rgba(0,0,0,0.42)' }}
        transition={spring}
        d={path}
        stroke={active ? '#ffffff' : 'rgba(255,255,255,0.07)'}
        strokeWidth={active ? 1.6 : 1}
        style={{ filter: active ? `drop-shadow(0 0 8px ${glow})` : 'none' }}
        className="pointer-events-none"
      />

      {/* Подпись по дуге */}
      {showLabel && (
        <>
          <path id={arcId} d={textArcPath(rText, start, end)} fill="none" />
          <text
            fontSize={fontSize}
            fill={active ? '#fff' : 'rgba(255,255,255,0.9)'}
            className="pointer-events-none select-none"
            style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.75)', strokeWidth: 3, fontWeight: 600, letterSpacing: '0.02em' }}
          >
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
              {value.label}
            </textPath>
          </text>
        </>
      )}
    </g>
  );
}

// Кнопка-сегмент «+» в конце кольца — добавить новый сегмент.
function AddSegment({ axisId, start, end, r1, r2, accent, onAdd }) {
  const path = sectorPath(r1, r2, start, end);
  const pos = polar(C, C, (r1 + r2) / 2, (start + end) / 2);
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
        <line x1={-6} y1={0} x2={6} y2={0} stroke={accent} strokeWidth={2} strokeLinecap="round" />
        <line x1={0} y1={-6} x2={0} y2={6} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      </g>
    </g>
  );
}

function Ring({ axisId, values, selectedId, onSelect, onLongPress, onAdd }) {
  const def = RING_DEFS[axisId];
  const slots = values.length + 1; // +1 под кнопку «добавить»
  const step = 360 / slots;
  const rText = (def.r1 + def.r2) / 2;

  return (
    <g>
      {values.map((v, i) => {
        const start = i * step;
        return (
          <Segment
            key={v.id}
            axisId={axisId}
            value={v}
            start={start}
            end={start + step}
            r1={def.r1}
            r2={def.r2}
            rText={rText}
            fontSize={def.fontSize}
            accent={def.accent}
            glow={def.glow}
            active={selectedId === v.id}
            onClick={(id) => onSelect(axisId, id)}
            onLongPress={onLongPress}
          />
        );
      })}
      <AddSegment
        axisId={axisId}
        start={values.length * step}
        end={slots * step}
        r1={def.r1}
        r2={def.r2}
        accent={def.accent}
        onAdd={onAdd}
      />
    </g>
  );
}

export default function SceneWheel({ axes, selection, onSelect, onPlay, matchCount, onSegmentLongPress, onAddSegment }) {
  const ringOrder = ['location', 'action', 'weather'];

  return (
    <div className="flex justify-center">
      <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-w-[380px]">
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(167,139,250,0.28)" />
            <stop offset="70%" stopColor="rgba(96,165,250,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="hubGrad" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#1f1f26" />
            <stop offset="100%" stopColor="#0c0c10" />
          </radialGradient>
        </defs>

        {/* Подсветка под колесом */}
        <circle cx={C} cy={C} r={R_OUTER + 6} fill="url(#wheelGlow)" />
        {/* Декоративные обручи */}
        <circle cx={C} cy={C} r={R_OUTER + 2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <circle cx={C} cy={C} r={R_INNER - 2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

        {ringOrder.map((axisId) => {
          const axis = axes.find((a) => a.id === axisId);
          if (!axis) return null;
          return (
            <Ring
              key={axisId}
              axisId={axisId}
              values={axis.values}
              selectedId={selection[axisId]}
              onSelect={onSelect}
              onLongPress={onSegmentLongPress}
              onAdd={onAddSegment}
            />
          );
        })}

        {/* Центральная кнопка запуска */}
        <g onClick={onPlay} className="cursor-pointer">
          <circle
            cx={C}
            cy={C}
            r={R_HUB}
            fill="url(#hubGrad)"
            stroke={matchCount > 0 ? 'rgba(249,115,22,0.85)' : 'rgba(255,255,255,0.18)'}
            strokeWidth={2}
            style={{ filter: matchCount > 0 ? 'drop-shadow(0 0 10px rgba(249,115,22,0.45))' : 'none' }}
            className="transition-all"
          />
          <path
            d={`M ${C - 8} ${C - 12} L ${C + 13} ${C} L ${C - 8} ${C + 12} Z`}
            fill={matchCount > 0 ? '#fb923c' : 'rgba(255,255,255,0.35)'}
            className="transition-all"
          />
          {matchCount > 0 && (
            <text
              x={C}
              y={C + 26}
              fontSize={9}
              fill="#fb923c"
              textAnchor="middle"
              className="font-mono pointer-events-none"
            >
              {matchCount}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}