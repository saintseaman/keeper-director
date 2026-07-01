import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Layers, Sparkles, Square } from 'lucide-react';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { useAudio } from '@/lib/useAudio';
import { axisValue } from '@/lib/sceneAxes';
// padAxes/padMatchesSelection больше не нужны — сцена кормится звуками плиток.
import { useAxes } from '@/lib/useAxes';
import { useTileSounds } from '@/lib/useTileSounds';
import { audioEngine } from '@/lib/audioEngine';
import { syncSceneMix, resolveStageWeights, layerVolume, loopableScenePads } from '@/lib/sceneMix';
import { useSceneSelection } from '@/lib/sceneSelection';
import SceneWheel from '@/components/scene/SceneWheel';
import SceneSliders from '@/components/scene/SceneSliders';
import SceneMixer from '@/components/scene/SceneMixer';
import SceneSegmentDialog from '@/components/scene/SceneSegmentDialog';
import TileSoundsDialog from '@/components/scene/TileSoundsDialog';
import AddSegmentDialog from '@/components/scene/AddSegmentDialog';
import FolderUploadDialog from '@/components/pad/FolderUploadDialog';

const STAGE_ORDER = ['calm', 'tense', 'horror'];

export default function Scenes() {
  const { pads, addPads, updatePad, removePad } = useCustomPads();
  const { overrides, setOverride } = useSoundOverrides();
  const { activeSounds, stopAll, setVolume, stop } = useAudio();
  const { axes, addValue, removeValue } = useAxes();
  const { tileSounds: tileSoundsMap, getSounds, getStageSounds, getAllStagesSounds } = useTileSounds();

  // selection и intensity живут в долгоживущем сторе (вне страницы), чтобы
  // переживать навигацию в Настройки и обратно, пока звук продолжает играть.
  const sel = useSceneSelection();
  const selection = sel.get();
  const intensity = sel.getIntensity();
  const setIntensity = sel.setIntensity;
  const [mutedGroups, setMutedGroups] = useState({}); // { [groupKey]: true } — приглушённые группы
  const mutedVolsRef = useRef({}); // запомненные громкости приглушённых групп: { [key]: { id: vol } }
  const [soloKey, setSoloKey] = useState(null); // 'axis:value' группы в соло, либо null
  const soloSnapshotRef = useRef(null); // { soundId: volume } — громкости всех звуков до входа в соло
  const restoringRef = useRef(false); // идёт восстановление из соло — доглушитель не вмешивается
  const [segment, setSegment] = useState(null); // { axisId, valueId } — открытый редактор сегмента
  const [tileSounds, setTileSounds] = useState(null); // { axisId, valueId, label } — диалог назначения звуков на плитку
  const [addAxis, setAddAxis] = useState(null); // ось, в которую добавляем сегмент
  const [driveOpen, setDriveOpen] = useState(false); // импорт с Диска внутри сцены
  const sceneIdsRef = useRef(new Set()); // текущий набор id играющих слоёв сцены (action/weather)
  const locIdsRef = useRef(new Set());   // текущий набор id играющих локационных слоёв (кроссфейд)

  const activeCount = Object.values(activeSounds).filter((v) => v.isPlaying !== false).length;
  const hasFilter = Object.values(selection).some(Boolean);
  const hasScene = hasFilter;

  // Не-локационные плитки (action/weather) идут в общий микс как обычно.
  // Локация обрабатывается отдельно (кроссфейд стадий по интенсивности).
  const tileMatchIds = useMemo(() => {
    const ids = new Set();
    for (const axisId of Object.keys(selection)) {
      const valueId = selection[axisId];
      // location идёт отдельным кроссфейдом, action — one-shot (не фон).
      if (!valueId || axisId === 'location' || axisId === 'action') continue;
      for (const sid of getSounds(axisId, valueId)) ids.add(sid);
    }
    return ids;
    // tileSoundsMap — чтобы пересчёт шёл при изменении назначений плиток.
  }, [selection, getSounds, tileSoundsMap]);

  // Итоговый список звуков сцены (без локации) = звуки активных плиток.
  const matches = useMemo(() => {
    const byId = new Map(pads.map((p) => [p.id, p]));
    return Array.from(tileMatchIds).map((id) => byId.get(id)).filter(Boolean);
  }, [pads, tileMatchIds]);

  // Число «долей» нормализации: каждая активная ось со звуком = 1 доля.
  // Локация считается ОДНОЙ долей целиком (две стадии делят её по весам),
  // чтобы громкость не прыгала при входе в переходную зону.
  const layerCount = useMemo(() => {
    let n = 0;
    for (const axisId of Object.keys(selection)) {
      const valueId = selection[axisId];
      if (!valueId || axisId === 'action') continue; // action не фон — не считаем в нормализацию
      if (axisId === 'location') {
        const all = getAllStagesSounds(valueId);
        if (all.calm.length + all.tense.length + all.horror.length > 0) n += 1;
      } else if (getSounds(axisId, valueId).length > 0) {
        n += 1;
      }
    }
    return n;
  }, [selection, getSounds, getAllStagesSounds, tileSoundsMap]);

  const onSelect = (axisId, valueId) => sel.patch(axisId, valueId);

  // Звуки одной плитки: для локации — звуки всех стадий с весом > 0
  // (играющие в кроссфейде), иначе звуки плитки как есть.
  const tileSoundIds = useCallback((axisId, valueId) => {
    if (axisId === 'location') {
      const stages = getAllStagesSounds(valueId);
      const w = resolveStageWeights(intensity, stages);
      const ids = [];
      for (const s of STAGE_ORDER) {
        if (w[s] > 0) ids.push(...stages[s]);
      }
      return ids;
    }
    return getSounds(axisId, valueId);
  }, [intensity, getSounds, getAllStagesSounds]);

  // Группы микшера: по одной на активную плитку, только с играющими звуками.
  const mixerGroups = useMemo(() => {
    const groups = [];
    for (const axisId of Object.keys(selection)) {
      const valueId = selection[axisId];
      if (!valueId || axisId === 'action') continue; // action — one-shot, не в микшере
      const ids = tileSoundIds(axisId, valueId).filter((id) => activeSounds[id]);
      if (ids.length === 0) continue;
      const v = axisValue(axisId, valueId);
      groups.push({ key: `${axisId}:${valueId}`, label: v?.label || valueId, ids });
    }
    return groups;
  }, [selection, tileSoundIds, activeSounds]);

  // Приглушение группы: запоминаем текущие громкости и гасим в 0; повтор — возврат.
  const toggleMute = (key, ids) => {
    const isMuted = !!mutedGroups[key];
    if (isMuted) {
      const saved = mutedVolsRef.current[key] || {};
      ids.forEach((id) => setVolume(id, saved[id] ?? activeSounds[id]?.volume ?? 0.5));
      delete mutedVolsRef.current[key];
      setMutedGroups((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } else {
      const saved = {};
      ids.forEach((id) => { saved[id] = activeSounds[id]?.volume ?? 0; setVolume(id, 0); });
      mutedVolsRef.current[key] = saved;
      setMutedGroups((prev) => ({ ...prev, [key]: true }));
    }
  };

  // Снимок свежих громкостей напрямую из движка (синхронно, без задержки стейта).
  const snapshotVolumes = () => {
    const st = audioEngine.getState().activeSounds;
    const snap = {};
    Object.keys(st).forEach((id) => { snap[id] = st[id].volume; });
    return snap;
  };

  // Восстановление громкостей из соло-снимка и сброс соло-состояния.
  const restoreSolo = () => {
    const snap = soloSnapshotRef.current;
    restoringRef.current = true; // блокируем доглушитель
    setSoloKey(null);            // соло выключено до setVolume
    if (snap) Object.keys(snap).forEach((id) => setVolume(id, snap[id]));
    soloSnapshotRef.current = null;
    setTimeout(() => { restoringRef.current = false; }, 0);
  };

  // Соло группы: снимок громкостей всех активных звуков, обнуление чужих.
  const toggleSolo = (key, ids) => {
    if (soloKey === key) { restoreSolo(); return; }
    // Переключение на другую группу: сначала восстановить, затем засоло заново.
    if (soloKey) restoreSolo();
    const snap = snapshotVolumes(); // ← из движка, уже актуально после restoreSolo
    soloSnapshotRef.current = snap;
    const keep = new Set(ids);
    Object.keys(snap).forEach((id) => { if (!keep.has(id)) setVolume(id, 0); });
    setSoloKey(key);
  };

  // Пока активно соло: новые/чужие звуки держим в нуле; если соло-группа
  // полностью остановлена — автоматически выходим из соло.
  useEffect(() => {
    if (restoringRef.current) return; // не глушим во время restore
    if (!soloKey) return;
    const st = audioEngine.getState().activeSounds;
    const [axisId, valueId] = soloKey.split(':');
    const soloIds = tileSoundIds(axisId, valueId).filter((id) => st[id]);
    if (soloIds.length === 0) { restoreSolo(); return; }
    const keep = new Set(soloIds);
    Object.keys(st).forEach((id) => { if (!keep.has(id)) setVolume(id, 0); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSounds, soloKey]);

  // Реактивное воспроизведение action/weather: тап по плитке меняет matches —
  // микс синхронизируется сам. Громкость нормализуется по числу долей сцены.
  useEffect(() => {
    const vol = layerVolume(layerCount);
    sceneIdsRef.current = syncSceneMix(audioEngine, matches, sceneIdsRef.current, vol);
  }, [matches, layerCount]);

  // Кроссфейд локации: при движении интенсивности НЕ перезапускаем слои,
  // только плавно меняем громкость. Две соседние стадии играют одновременно,
  // деля долю локации (layerVolume) по весам. Стадии с весом 0 — останавливаем.
  useEffect(() => {
    const valueId = selection.location;
    if (!valueId) {
      // локация снята — гасим все её слои
      for (const id of locIdsRef.current) audioEngine.stop(id, 0.4);
      locIdsRef.current = new Set();
      return;
    }
    const stages = getAllStagesSounds(valueId);
    const w = resolveStageWeights(intensity, stages);
    const locVol = layerVolume(layerCount); // доля локации в общей нормализации
    const byId = new Map(pads.map((p) => [p.id, p]));
    const nextIds = new Set();

    for (const stage of STAGE_ORDER) {
      const weight = w[stage];
      if (weight <= 0) continue;
      // только лупы с url участвуют в кроссфейде
      const stagePads = loopableScenePads((stages[stage] || []).map((id) => byId.get(id)).filter(Boolean));
      for (const pad of stagePads) {
        nextIds.add(pad.id);
        audioEngine.playFile(pad.id, pad.url, pad.title, locVol * weight, true);
      }
    }
    // остановить слои стадий, которые больше не звучат (вес 0 / смена локации)
    for (const id of locIdsRef.current) {
      if (!nextIds.has(id)) audioEngine.stop(id, 0.4);
    }
    locIdsRef.current = nextIds;
  }, [intensity, selection.location, layerCount, pads, getAllStagesSounds, tileSoundsMap]);

  // STOP в шапке: глушим всё, сбрасываем выбор всех плиток и набор слоёв.
  const stopScene = () => {
    stopAll(0.4);
    sel.reset();
    sceneIdsRef.current = new Set();
    locIdsRef.current = new Set();
    soloSnapshotRef.current = null;
    setSoloKey(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-orange-400" />
          <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Сцены</span>
        </div>
        <button
          onClick={stopScene}
          disabled={activeCount === 0}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider transition-all ${
            activeCount > 0
              ? 'bg-rose-600/20 border border-rose-500/50 text-rose-300'
              : 'bg-white/5 border border-white/10 text-white/25'
          }`}
        >
          <Square size={12} className={activeCount > 0 ? 'fill-rose-400' : ''} />
          {activeCount > 0 ? activeCount : 'STOP'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
        {pads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Layers size={40} className="text-white/15" strokeWidth={1.2} />
            <p className="text-sm text-white/45">Сначала импортируйте звуки на главной.</p>
          </div>
        ) : (
          <>
            {/* Колесо атмосферы */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-orange-400" />
                <h2 className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase">Собрать атмосферу</h2>
              </div>

              <div className="mb-3">
                <SceneSliders value={intensity} onChange={setIntensity} />
              </div>

              <SceneWheel
                axes={axes}
                selection={selection}
                onSelect={onSelect}
                onSegmentLongPress={(axisId, valueId) => {
                  const v = axisValue(axisId, valueId);
                  setTileSounds({ axisId, valueId, label: v?.label || valueId });
                }}
                onAddSegment={(axisId) => setAddAxis(axisId)}
              />

              {hasScene && (
                <div className="mt-5">
                  <button
                    onClick={stopScene}
                    className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    Сбросить выбор
                  </button>
                </div>
              )}
            </section>

            {/* Групповой микшер активных плиток */}
            <section>
              <SceneMixer
                groups={mixerGroups}
                activeSounds={activeSounds}
                setVolume={setVolume}
                stop={stop}
                mutedGroups={mutedGroups}
                onToggleMute={toggleMute}
                soloKey={soloKey}
                onToggleSolo={toggleSolo}
              />
            </section>
          </>
        )}
      </div>

      <TileSoundsDialog
        open={!!tileSounds}
        onClose={() => setTileSounds(null)}
        axisId={tileSounds?.axisId}
        valueId={tileSounds?.valueId}
        valueLabel={tileSounds?.label}
      />

      <SceneSegmentDialog
        axisId={segment?.axisId}
        valueId={segment?.valueId}
        open={!!segment}
        onClose={() => setSegment(null)}
        pads={pads}
        overrides={overrides}
        addPads={addPads}
        updatePad={updatePad}
        removePad={removePad}
        setOverride={setOverride}
        onRemoveSegment={(axisId, valueId) => {
          removeValue(axisId, valueId);
          if (selection[axisId] === valueId) sel.patch(axisId, null);
        }}
      />

      <AddSegmentDialog
        axisId={addAxis}
        open={!!addAxis}
        onClose={() => setAddAxis(null)}
        onAdd={addValue}
      />

      <FolderUploadDialog
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        onImported={(sounds) => {
          addPads(sounds);
          setDriveOpen(false);
        }}
      />
    </div>
  );
}