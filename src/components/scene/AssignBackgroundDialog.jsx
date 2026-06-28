import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Music, Search, Check, MapPin, Play, Pause } from 'lucide-react';
import { SCENE_AXES, resolveAxisIcon, padAxes } from '@/lib/sceneAxes';
import { BG_STAGES, isBackgroundPad, backgroundStages, backgroundLocations } from '@/lib/backgroundSounds';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';

const locationAxis = SCENE_AXES.find((a) => a.id === 'location');

// Строка звука с превью + текущим статусом фона.
function SoundRow({ pad, override, selected, onSelect }) {
  const isActive = useIsSoundActive(pad.id);
  const stages = backgroundStages(pad, override);
  const locs = backgroundLocations(pad, override);
  const isBg = isBackgroundPad(pad, override);

  const togglePreview = (e) => {
    e.stopPropagation();
    if (audioEngine.isPlaying(pad.id)) audioEngine.stop(pad.id, 0);
    else if (pad.url) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true);
  };

  return (
    <button
      onClick={() => onSelect(pad.id)}
      className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        selected ? 'border-violet-400/60 bg-violet-500/10' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={togglePreview}
        className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${
          isActive ? 'bg-violet-500/25 border-violet-400/60 text-violet-200' : 'bg-white/5 border-white/10 text-white/50'
        }`}
      >
        {isActive ? <Pause size={14} /> : <Play size={14} className="translate-x-px" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white/85 truncate">{pad.title}</div>
        {isBg ? (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-violet-300/80">
            <MapPin size={10} />
            {locs.map((l) => locationAxis.values.find((v) => v.id === l)?.label).filter(Boolean).join(', ')}
            {' · '}
            {stages.map((s) => BG_STAGES.find((b) => b.id === s)?.en).filter(Boolean).join('/')}
          </div>
        ) : (
          <div className="text-[10px] text-white/30 mt-0.5">Не назначен как фон</div>
        )}
      </div>
      {selected && <Check size={16} className="shrink-0 text-violet-300" />}
    </button>
  );
}

// Диалог назначения фоновых звуков: выбрать звук → локация + стадия.
export default function AssignBackgroundDialog({ open, onClose, pads, overrides, updatePad, setOverride }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [stageId, setStageId] = useState('calm');

  // Только зацикленные звуки — фон обязан быть loop.
  const loopPads = useMemo(() => {
    return pads.filter((p) => {
      const ov = overrides[p.id];
      return typeof ov?.isLoopable === 'boolean' ? ov.isLoopable : p.is_loopable;
    });
  }, [pads, overrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return loopPads;
    return loopPads.filter((p) => p.title.toLowerCase().includes(q));
  }, [loopPads, query]);

  const selectedPad = pads.find((p) => p.id === selectedId);

  const handleSelect = (id) => {
    setSelectedId(id);
    const pad = pads.find((p) => p.id === id);
    const ov = overrides[id];
    // Подставляем уже назначенные локацию/стадию, если есть.
    const locs = backgroundLocations(pad, ov);
    const stages = backgroundStages(pad, ov);
    if (locs.length) setLocationId(locs[0]);
    if (stages.length) setStageId(stages[0]);
  };

  const canAssign = selectedId && locationId && stageId;

  const assign = () => {
    if (!canAssign) return;
    const ov = overrides[selectedId];
    const current = padAxes(selectedPad, ov);
    // Добавляем локацию и стадию к существующим тегам осей (не затираем).
    const nextLocation = Array.from(new Set([...(current.location || []), locationId]));
    const nextMood = Array.from(new Set([...(current.mood || []), stageId]));
    const nextAxes = { ...current, location: nextLocation, mood: nextMood };
    // Override — для мгновенной реактивности UI; запись Pad — навсегда + is_loopable.
    setOverride(selectedId, { axes: nextAxes, isLoopable: true });
    updatePad(selectedId, { axes: nextAxes, isLoopable: true });
    // Сброс выбора звука, локацию/стадию оставляем для серии назначений.
    setSelectedId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-obsidian border-white/10 max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/85">
            <Music size={16} className="text-violet-400" />
            Назначить фоновые звуки
          </DialogTitle>
        </DialogHeader>

        {/* Локация + стадия — общий выбор для назначаемого звука */}
        <div className="space-y-2.5">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-white/40 uppercase">Локация</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {locationAxis.values.map((v) => {
                const Icon = resolveAxisIcon(v.icon);
                const active = locationId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setLocationId(v.id)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${
                      active ? 'bg-sky-500/25 border-sky-400/70 text-sky-100' : 'border-white/10 text-white/50 hover:border-sky-400/40'
                    }`}
                  >
                    <Icon size={11} /> {v.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider text-white/40 uppercase">Стадия</span>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {BG_STAGES.map((s) => {
                const active = stageId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStageId(s.id)}
                    className={`rounded-lg border py-2 text-[12px] transition-colors ${
                      active ? 'bg-violet-500/25 border-violet-400/70 text-violet-100' : 'border-white/12 text-white/55 hover:border-white/30'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Поиск звука */}
        <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
          <Search size={14} className="text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти зацикленный звук…"
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 focus:outline-none"
          />
        </div>

        {/* Список звуков */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[12px] text-white/35 py-8">Нет зацикленных звуков. Сделайте звук loop в панели «Теги».</p>
          ) : (
            filtered.map((p) => (
              <SoundRow key={p.id} pad={p} override={overrides[p.id]} selected={selectedId === p.id} onSelect={handleSelect} />
            ))
          )}
        </div>

        {/* Кнопка назначения */}
        <button
          onClick={assign}
          disabled={!canAssign}
          className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-mono tracking-wider transition-colors ${
            canAssign
              ? 'bg-violet-500/25 border border-violet-400/60 text-violet-100 hover:bg-violet-500/35'
              : 'bg-white/5 border border-white/10 text-white/30'
          }`}
        >
          <Check size={14} />
          {selectedPad
            ? `Назначить «${selectedPad.title}» → ${locationAxis.values.find((v) => v.id === locationId)?.label || '—'} / ${BG_STAGES.find((s) => s.id === stageId)?.label}`
            : 'Выберите звук'}
        </button>
      </DialogContent>
    </Dialog>
  );
}