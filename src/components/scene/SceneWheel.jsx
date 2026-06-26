import React from 'react';
import { SCENE_AXES } from '@/lib/sceneAxes';

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

// Подпись по центру сектора (на среднем радиусе).
function labelPos(r, startDeg, endDeg) {
  return polar(C, C, r, (startDeg + endDeg) / 2);
}

function Ring({ values, selectedId, onSelect, axisId, r1, r2, fontSize, accent }) {
  const n = values.length;
  const step = 360 / n;
  return (
    <g>
      {values.map((v, i) => {
        const start = i * step;
        const end = start + step;
        const active = selectedId === v.id;
        const lp = labelPos((r1 + r2) / 2, start, end);
        return (
          <g key={v.id} onClick={() => onSelect(axisId, active ? null : v.id)} className="cursor-pointer">
            <path
              d={sectorPath(r1, r2, start + 1.2, end - 1.2)}
              fill={active ? accent : 'rgba(255,255,255,0.04)'}
              stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={1}
              className="transition-all duration-200"
            />
            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fill={active ? '#fff' : 'rgba(255,255,255,0.6)'}
              className="pointer-events-none select-none font-medium"
            >
              {v.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function SceneWheel({ selection, onSelect, onPlay, matchCount }) {
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