import React, { useMemo } from 'react';
import { Music, Square, AlertTriangle, MapPin, Volume2, Plus } from 'lucide-react';
import { SCENE_AXES, resolveAxisIcon } from '@/lib/sceneAxes';
import { BG_STAGES, locationBackgrounds } from '@/lib/backgroundSounds';
import { Slider } from '@/components/ui/slider';

// Нижняя панель фона на странице «Сцены».
// Структура: выбор локации → переключатель Calm/Tension/Horror → громкость фона.
// Фон — отдельный управляемый слой, не конфликтует с кнопками-эффектами.
export default function BackgroundControlPanel({
  pads, overrides, layer, onStopAll, onAssign,
}) {
  const { location, stage, volume, activePad, selectLocation, selectStage, changeVolume, stopBackground } = layer;

  const locationAxis = SCENE_AXES.find((a) => a.id === 'location');

  // Какие локации вообще имеют хоть один фоновый звук — показываем их первыми.
  const locationsWithBg = useMemo(() => {
    const set = new Set();
    for (const p of pads) {
      const ov = overrides[p.id];
      const loops = typeof ov?.isLoopable === 'boolean' ? ov.isLoopable : p.is_loopable;
      if (!loops) continue;
      const locs = ov?.axes?.location || p.axes?.location || [];
      for (const l of locs) set.add(l);
    }
    return set;
  }, [pads, overrides]);

  // Сводка стадий текущей локации (есть ли фон для calm/tense/horror).
  const stagesMap = useMemo(
    () => (location ? locationBackgrounds(pads, overrides, location) : {}),
    [pads, overrides, location]
  );

  const currentStageHasBg = location ? !!stagesMap[stage] : false;

  return (
    <div className="border-t border-white/10 bg-obsidian/95 backdrop-blur-md">
      <div className="px-4 py-3 space-y-3">
        {/* Заголовок панели */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music size={15} className="text-violet-400" />
            <span className="text-[11px] font-mono tracking-[0.2em] text-white/70 uppercase">Фон / Атмосфера</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={stopBackground}
              disabled={!activePad}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-mono tracking-wider transition-colors ${
                activePad ? 'bg-violet-500/20 border border-violet-400/50 text-violet-200' : 'bg-white/5 border border-white/10 text-white/25'
              }`}
            >
              <Square size={11} className={activePad ? 'fill-violet-300' : ''} /> ФОН
            </button>
            <button
              onClick={onStopAll}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-mono tracking-wider bg-rose-600/20 border border-rose-500/50 text-rose-300"
            >
              <Square size={11} /> ВСЁ
            </button>
          </div>
        </div>

        {/* Выбор локации */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {locationAxis.values
            .slice()
            .sort((a, b) => (locationsWithBg.has(b.id) ? 1 : 0) - (locationsWithBg.has(a.id) ? 1 : 0))
            .map((v) => {
              const Icon = resolveAxisIcon(v.icon);
              const has = locationsWithBg.has(v.id);
              const active = location === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => selectLocation(v.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] transition-colors ${
                    active
                      ? 'bg-sky-500/25 border-sky-400/70 text-sky-100'
                      : has
                        ? 'border-white/15 text-white/70 hover:border-sky-400/40'
                        : 'border-white/8 text-white/30'
                  }`}
                >
                  <Icon size={13} />
                  {v.label}
                  {has && !active && <span className="w-1.5 h-1.5 rounded-full bg-sky-400/70" />}
                </button>
              );
            })}
        </div>

        {/* Переключатель стадий — крупные кнопки Calm / Tension / Horror */}
        {location ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {BG_STAGES.map((s) => {
                const has = !!stagesMap[s.id];
                const active = stage === s.id;
                const tone =
                  s.id === 'calm' ? 'emerald' : s.id === 'tense' ? 'amber' : 'rose';
                const toneCls = active
                  ? tone === 'emerald'
                    ? 'bg-emerald-500/25 border-emerald-400/70 text-emerald-100'
                    : tone === 'amber'
                      ? 'bg-amber-500/25 border-amber-400/70 text-amber-100'
                      : 'bg-rose-500/25 border-rose-400/70 text-rose-100'
                  : 'border-white/12 text-white/60 hover:border-white/30';
                return (
                  <button
                    key={s.id}
                    onClick={() => selectStage(s.id)}
                    className={`relative flex flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-colors ${toneCls}`}
                  >
                    <span className="text-[13px] font-medium">{s.label}</span>
                    <span className="text-[9px] font-mono tracking-wider opacity-50">{s.en}</span>
                    {!has && <span className="absolute top-1 right-1.5 text-amber-400/70"><AlertTriangle size={10} /></span>}
                  </button>
                );
              })}
            </div>

            {/* Предупреждение, если для выбранной стадии нет фона */}
            {!currentStageHasBg && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-[11px] text-amber-200/90">
                  <AlertTriangle size={12} />
                  Нет «{BG_STAGES.find((s) => s.id === stage)?.label}» фона для этой локации
                </span>
                <button
                  onClick={onAssign}
                  className="shrink-0 flex items-center gap-1 text-[10px] font-mono tracking-wider text-amber-200 hover:text-amber-100"
                >
                  <Plus size={11} /> Назначить
                </button>
              </div>
            )}

            {/* Громкость фона */}
            <div className="flex items-center gap-3">
              <Volume2 size={14} className="text-white/40 shrink-0" />
              <Slider
                value={[Math.round(volume * 100)]}
                onValueChange={([v]) => changeVolume(v / 100)}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-[10px] font-mono text-white/40 w-8 text-right">{Math.round(volume * 100)}</span>
            </div>

            {activePad && (
              <div className="flex items-center gap-1.5 text-[11px] text-violet-200/70">
                <MapPin size={12} />
                Играет: <span className="text-violet-200">{activePad.title}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <p className="text-[12px] text-white/40">Выберите локацию — сразу включится спокойный фон</p>
            <button
              onClick={onAssign}
              className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-violet-300 hover:text-violet-200"
            >
              <Plus size={12} /> Назначить фоновые звуки
            </button>
          </div>
        )}
      </div>
    </div>
  );
}