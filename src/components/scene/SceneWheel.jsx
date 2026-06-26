import React, { useRef } from 'react';
import { SCENE_AXES } from '@/lib/sceneAxes';
import { segmentBg } from '@/lib/segmentBackgrounds';

const LONG_PRESS_MS = 450;

// Радиальное «колесо атмосферы» в стиле TableTone.
// Внешнее кольцо — локации, внутреннее — действия, центр — кнопка запуска.
// selection = { location, action, ... }; onSelect(axisId, valueId|null).

const SIZE = 320;
const C = SIZE / 2; // центр
const R_OUTER = 156; // внешний радиус кольца локаций
const R_MID = 96; // граница локации / действия
const R_INNER = 54; // внутренний радиус кольца действий (начало центра)
const R_HUB = 30; // радиус центральной кнопки

// Полярные → декартовы координаты (0° сверху, по часовой).
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Path сектора-«кольца» между r1 и r2 от startDeg до endDeg.
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

// Дуга для текста вдоль сектора (на среднем радиусе).
// Для нижней половины колеса разворачиваем дугу, чтобы текст не шёл вверх ногами.
function textArcPath(r, startDeg, endDeg, id) {
  const mid = (startDeg + endDeg) / 2;
  const flip = mid > 90 && mid < 270;
  const a = flip ? endDeg : startDeg;
  const b = flip ? startDeg : endDeg;
  const p1 = polar(C, C, r, a);
  const p2 = polar(C, C, r, b);
  const sweep = flip ? 0 : 1;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`;
}

function Ring({ values, selectedId, onSelect, onLongPress, axisId, r1, r2, fontSize, accent }) {
  const n = values.length;
  const step = 360 / n;
  const rText = (r1 + r2) / 2;
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);

  const startPress = (valueId) => {
    longFiredRef.current = false;
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress?.(axisId, valueId);
    }, LONG_PRESS_MS);
  };
  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  const handleClick = (valueId, active) => {
    if (longFiredRef.current) { longFiredRef.current = false; return; }
    onSelect(axisId, active ? null : valueId);
  };

  return (
    <g>
      {values.map((v, i) => {
        const start = i * step;
        const end = start + step;
        const active = selectedId === v.id;
        const arcId = `arc-${axisId}-${v.id}`;
        const clipId = `clip-${axisId}-${v.id}`;
        const bg = segmentBg(v.id);
        return (
          <g
            key={v.id}
            onClick={() => handleClick(v.id, active)}
            onPointerDown={() => startPress(v.id)}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            onPointerCancel={endPress}
            onContextMenu={(e) => { e.preventDefault(); onLongPress?.(axisId, v.id); }}
            className="cursor-pointer select-none"
          >
            <clipPath id={clipId}>
              <path d={sectorPath(r1, r2, start + 1.2, end - 1.2)} />
            </clipPath>
            <path
              d={sectorPath(r1, r2, start + 1.2, end - 1.2)}
              fill="rgba(255,255,255,0.04)"
              stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={1}
            />
            {bg && (
              <image
                href={bg}
                x={C - r2}
                y={C - r2}
                width={r2 * 2}
                height={r2 * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clipId})`}
                opacity={active ? 0.95 : 0.5}
                className="transition-opacity duration-200 pointer-events-none"
              />
            )}
            <path
              d={sectorPath(r1, r2, start + 1.2, end - 1.2)}
              fill={active ? accent : 'rgba(0,0,0,0.35)'}
              stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={1}
              className="transition-all duration-200 pointer-events-none"
            />
            <path id={arcId} d={textArcPath(rText, start, end, arcId)} fill="none" />
            <text
              fontSize={fontSize}
              fill="#fff"
              className="pointer-events-none select-none font-medium"
              style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: 2.5 }}
            >
              <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                {v.label}
              </textPath>
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function SceneWheel({ selection, onSelect, onPlay, matchCount, onSegmentLongPress }) {
  const locationAxis = SCENE_AXES.find((a) => a.id === 'location');
  const actionAxis = SCENE_AXES.find((a) => a.id === 'action');

  return (
    <div className="flex justify-center">
      <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-w-[360px]">
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.25)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </radialGradient>
        </defs>

        {/* Подсветка под колесом */}
        <circle cx={C} cy={C} r={R_OUTER} fill="url(#wheelGlow)" />

        {/* Внешнее кольцо — локации */}
        <Ring
          values={locationAxis.values}
          selectedId={selection.location}
          onSelect={onSelect}
          onLongPress={onSegmentLongPress}
          axisId="location"
          r1={R_MID}
          r2={R_OUTER}
          fontSize={11}
          accent="rgba(96,165,250,0.45)"
        />

        {/* Внутреннее кольцо — действия */}
        <Ring
          values={actionAxis.values}
          selectedId={selection.action}
          onSelect={onSelect}
          onLongPress={onSegmentLongPress}
          axisId="action"
          r1={R_INNER}
          r2={R_MID}
          fontSize={10}
          accent="rgba(52,211,153,0.45)"
        />

        {/* Центральная кнопка запуска */}
        <g onClick={onPlay} className="cursor-pointer">
          <circle
            cx={C}
            cy={C}
            r={R_HUB}
            fill="rgba(20,20,24,0.95)"
            stroke={matchCount > 0 ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={2}
            className="transition-all"
          />
          <path
            d={`M ${C - 7} ${C - 11} L ${C + 12} ${C} L ${C - 7} ${C + 11} Z`}
            fill={matchCount > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)'}
            className="transition-all"
          />
        </g>
      </svg>
    </div>
  );
}