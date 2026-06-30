import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useTileSounds } from '@/lib/useTileSounds';

const LONG_PRESS_MS = 450;

// «Колесо атмосферы» в виде сетки плиток с фокусом на одной оси за раз.
// Сверху — табы осей (Локация / Действие / Погода). Активная ось рисуется
// сеткой крупных квадратных плиток. Выбранные значения других осей видны
// как чипы под сеткой. selection = { location, action, weather, ... }.
// Контракт компонента не изменился — те же пропсы, что и у SVG-версии.

const AXIS_META = {
  location: { label: 'Локация', accent: '#60a5fa' },
  action: { label: 'Действие', accent: '#34d399' },
  weather: { label: 'Погода', accent: '#a78bfa' },
};
const AXIS_ORDER = ['location', 'action', 'weather'];

// Одна плитка значения оси.
function Tile({ axisId, value, active, onClick, onLongPress, soundCount = 0 }) {
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const Icon = getIcon(value.icon);
  const grad = value.grad || ['#1a1a1a', '#0d0d0d'];

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
    <button
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(axisId, value.id); }}
      className="relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 overflow-hidden select-none transition-all"
      style={{
        background: `linear-gradient(160deg, ${grad[0]}, ${grad[1]})`,
        borderColor: active ? '#f97316' : 'rgba(255,255,255,0.08)',
        borderWidth: active ? 2 : 1,
        boxShadow: active ? '0 0 12px rgba(249,115,22,0.55)' : 'none',
      }}
    >
      {soundCount > 0 && (
        <span
          className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
          style={{ background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.7)' }}
        >
          {soundCount}
        </span>
      )}
      <Icon size={20} color="#ffffff" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.9))' }} />
      <span
        className="px-1 text-center leading-tight"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#ffffff',
          textShadow: '0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,1)',
        }}
      >
        {value.label}
      </span>
    </button>
  );
}

export default function SceneWheel({ axes, selection, onSelect, onSegmentLongPress, onAddSegment }) {
  const { getSounds, getAllStagesSounds } = useTileSounds();
  const [activeAxis, setActiveAxis] = useState('location');
  const axis = axes.find((a) => a.id === activeAxis);
  const values = axis?.values || [];

  // Свайп влево/вправо по сетке плиток переключает активную ось.
  const touchStartRef = useRef({ x: 0, y: 0 });
  const onGridTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onGridTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    // Горизонтальный свайп: порог 50px и доминирование по горизонтали.
    if (Math.abs(dx) <= 50 || Math.abs(dy) > Math.abs(dx)) return;
    const idx = AXIS_ORDER.indexOf(activeAxis);
    if (dx < 0) setActiveAxis(AXIS_ORDER[Math.min(idx + 1, AXIS_ORDER.length - 1)]);
    else setActiveAxis(AXIS_ORDER[Math.max(idx - 1, 0)]);
  };

  // Чипы выбранных значений по неактивным осям.
  const otherChips = AXIS_ORDER.filter((id) => id !== activeAxis).map((id) => {
    const ax = axes.find((a) => a.id === id);
    const v = ax?.values.find((x) => x.id === selection[id]);
    return { id, label: AXIS_META[id].label, value: v?.label || null, accent: AXIS_META[id].accent };
  });

  return (
    <div className="flex flex-col">
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

      {/* Сетка плиток значений активной оси */}
      <div
        key={activeAxis}
        onTouchStart={onGridTouchStart}
        onTouchEnd={onGridTouchEnd}
        className="grid grid-cols-3 gap-2 animate-in fade-in duration-200"
      >
        {values.map((v) => {
          let soundCount;
          if (activeAxis === 'location') {
            const all = getAllStagesSounds(v.id);
            soundCount = all.calm.length + all.tense.length + all.horror.length;
          } else {
            soundCount = getSounds(activeAxis, v.id).length;
          }
          return (
            <Tile
              key={v.id}
              axisId={activeAxis}
              value={v}
              active={selection[activeAxis] === v.id}
              onClick={(id) => onSelect(activeAxis, id)}
              onLongPress={onSegmentLongPress}
              soundCount={soundCount}
            />
          );
        })}

        {/* Плитка «+ добавить сегмент» */}
        <button
          onClick={() => onAddSegment(activeAxis)}
          className="aspect-square rounded-xl border border-dashed border-white/20 bg-white/[0.03] flex items-center justify-center text-white/45 hover:border-orange-400/50 hover:text-orange-300 transition-colors"
        >
          <Plus size={22} />
        </button>
      </div>

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