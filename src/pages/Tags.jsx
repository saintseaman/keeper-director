import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Tags as TagsIcon, AlertCircle, CheckCircle2, CheckSquare, X, Sparkles, Square, HeartPulse } from 'lucide-react';
import { useCustomPads } from '@/lib/useCustomPads';
import { useAudio } from '@/lib/useAudio';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { audioEngine } from '@/lib/audioEngine';
import { padAxes, missingAxes, autoAxes } from '@/lib/sceneAxes';
import { useSmartTag } from '@/lib/useSmartTag';
import { useHealthCheck } from '@/lib/useHealthCheck';
import TagFixRow from '@/components/scene/TagFixRow';
import BulkTagDialog from '@/components/scene/BulkTagDialog';

// Панель «Теги» — аналитика разметки звуков.
// Показывает звуки, у которых не проставлены теги по осям («нужно починить»),
// и даёт доразметить прямо здесь — поштучно или массово (режим выделения).
export default function Tags() {
  const { pads, removePad, updatePad } = useCustomPads();
  const { activeSounds, stopAll } = useAudio();
  const activeCount = Object.values(activeSounds).filter((v) => v.isPlaying !== false).length;
  const { overrides, setOverride, mergeOverrides } = useSoundOverrides();
  const smart = useSmartTag(mergeOverrides, overrides);
  const health = useHealthCheck();
  const [showDone, setShowDone] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  // Стабильный порядок строк: вычисляем «сколько дыр было» один раз по списку
  // звуков (pads). НЕ пересортировываем при правке тегов — иначе строка, которую
  // редактируешь, перескакивает вверх и «убегает», мешая проставить несколько тегов.
  const order = useMemo(() => {
    const rank = new Map();
    pads.forEach((p) => {
      rank.set(p.id, missingAxes(padAxes(p, overrides[p.id])).length);
    });
    return [...pads]
      .sort((a, b) => (rank.get(b.id) || 0) - (rank.get(a.id) || 0))
      .map((p) => p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pads]);

  // Недостающие оси пересчитываем реактивно, но позиции берём из замороженного order.
  const rows = useMemo(() => {
    const byId = new Map(pads.map((p) => [p.id, p]));
    return order
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => {
        const axes = padAxes(p, overrides[p.id]);
        return { pad: p, missing: missingAxes(axes) };
      });
  }, [order, pads, overrides]);

  const needFix = rows.filter((r) => r.missing.length > 0);
  const done = rows.filter((r) => r.missing.length === 0);
  const visible = showDone ? rows : needFix;

  // Прогреваем preload-кэш первых видимых звуков → превью по тапу запускается
  // мгновенно, без сетевой буферизации. Ограничиваем числом, чтобы не плодить
  // <audio> на все 159 файлов.
  useEffect(() => {
    for (const r of visible.slice(0, 16)) {
      if (r.pad.url) audioEngine.preloadFile(r.pad.url);
    }
  }, [visible]);

  // useCallback — чтобы memo на TagFixRow реально работала (стабильные ссылки).
  // Пишем теги СРАЗУ в саму запись пэда (Pad.axes) — это ground truth, который
  // переживает любые рассинхронизации и сохраняется навсегда. override.axes
  // оставляем для мгновенной реактивности UI (мемоизированные строки).
  const onChangeAxes = useCallback((padId, axes, isEffect) => {
    setOverride(padId, { axes });
    updatePad(padId, { axes, isEffect: !!isEffect });
  }, [setOverride, updatePad]);

  const toggleSelect = useCallback((padId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(padId) ? next.delete(padId) : next.add(padId);
      return next;
    });
  }, []);

  const exitSelect = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  const selectAllVisible = () => setSelected(new Set(visible.map((r) => r.pad.id)));

  // Стабильный onRename для memo строк.
  const handleRename = useCallback((id, title) => updatePad(id, { title }), [updatePad]);

  // Переключение режима «луп / разовый» для звука. Храним в override.isLoopable.
  // Если снимаем луп с играющего зацикленного звука — останавливаем его.
  const handleToggleLoop = useCallback((id, isLoop) => {
    setOverride(id, { isLoopable: isLoop });
    if (!isLoop && audioEngine.isPlaying(id)) audioEngine.stop(id, 0);
  }, [setOverride]);

  // Массовое применение: добавляем выбранные значения к каждому звуку,
  // не затирая его текущие теги (ручные или авто фиксируем как ручные).
  const applyBulk = (pickedAxes) => {
    for (const padId of selected) {
      const pad = pads.find((p) => p.id === padId);
      if (!pad) continue;
      const manual = overrides[padId]?.axes || {};
      const auto = autoAxes(pad);
      const merged = {};
      for (const [axisId, addIds] of Object.entries(pickedAxes)) {
        const base = manual[axisId] || auto[axisId] || [];
        merged[axisId] = Array.from(new Set([...base, ...addIds]));
      }
      const nextAxes = { ...manual, ...merged };
      setOverride(padId, { axes: nextAxes });
      // Сохраняем навсегда прямо в запись пэда (Pad.axes).
      updatePad(padId, { axes: nextAxes });
    }
    exitSelect();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TagsIcon size={18} className="text-orange-400" />
          <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Теги</span>
        </div>
        {selectMode ? (
          <button
            type="button"
            onClick={exitSelect}
            className="flex items-center gap-1 -mr-2 px-2 py-2 text-[11px] font-mono text-white/50 hover:text-white/80 transition-colors"
          >
            <X size={13} /> Отмена
          </button>
        ) : (
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <button
              onClick={() => stopAll(0.4)}
              disabled={activeCount === 0}
              title="Остановить все звуки"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 tracking-wider transition-all
                ${activeCount > 0 ? 'bg-rose-600/20 border border-rose-500/50 text-rose-300' : 'bg-white/5 border border-white/10 text-white/25'}`}
            >
              <Square size={13} className={activeCount > 0 ? 'fill-rose-400' : ''} />
              {activeCount > 0 && activeCount}
            </button>
            <span className="flex items-center gap-1 text-orange-300/80" title="Без тегов">
              <AlertCircle size={12} /> {needFix.length}
            </span>
            <span className="flex items-center gap-1 text-emerald-300/80" title="Размечено">
              <CheckCircle2 size={12} /> {done.length}
            </span>
            <button
              onClick={() => smart.run(pads)}
              disabled={smart.running || pads.length === 0}
              title="Умная разметка всех звуков через ИИ"
              className="flex items-center gap-1 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2 py-1.5 text-violet-200 hover:bg-violet-500/20 hover:border-violet-400/50 disabled:opacity-50 transition-colors"
            >
              <Sparkles size={13} className={smart.running ? 'animate-pulse' : ''} />
              {smart.running && smart.progress && `${smart.progress.done}/${smart.progress.total}`}
            </button>
            <button
              onClick={() => health.run(pads)}
              disabled={health.running || pads.length === 0}
              title="Проверить, какие звуки не загружаются"
              className="flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-1.5 text-sky-200 hover:bg-sky-500/20 hover:border-sky-400/50 disabled:opacity-50 transition-colors"
            >
              <HeartPulse size={13} className={health.running ? 'animate-pulse' : ''} />
              {health.running && health.progress && `${health.progress.done}/${health.progress.total}`}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {!selectMode && smart.running && (
          <div className="rounded-lg border border-violet-400/40 bg-violet-500/10 px-3 py-2 text-[12px] text-violet-200 flex items-center gap-2">
            <Sparkles size={13} className="animate-pulse" />
            ИИ размечает звуки…{smart.progress ? ` ${smart.progress.done} / ${smart.progress.total}` : ''}
          </div>
        )}

        {!selectMode && !smart.running && smart.result && (
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
            ИИ-разметка завершена. Размечено звуков: {smart.result.tagged}
          </div>
        )}

        {!selectMode && health.running && (
          <div className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-[12px] text-sky-200 flex items-center gap-2">
            <HeartPulse size={13} className="animate-pulse" />
            Проверяю звуки…{health.progress ? ` ${health.progress.done} / ${health.progress.total}` : ''}
          </div>
        )}

        {!selectMode && health.checked && !health.running && (
          <div
            className={`rounded-lg border px-3 py-2 text-[12px] ${
              health.broken.size > 0
                ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {health.broken.size > 0
              ? <>Не загружаются: <span className="font-medium">{health.broken.size}</span> — отмечены красным ниже.</>
              : <>Все звуки загружаются. Битых нет.</>}
          </div>
        )}

        {pads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <TagsIcon size={40} className="text-white/15" strokeWidth={1.2} />
            <p className="text-sm text-white/45">Сначала импортируйте звуки на главной.</p>
          </div>
        ) : (
          <>
            {/* Панель управления */}
            <div className="flex items-center justify-between gap-2">
              {selectMode ? (
                <>
                  <p className="text-[12px] text-white/45">
                    Выбрано: <span className="text-orange-300 font-medium">{selected.size}</span>
                  </p>
                  <button
                    onClick={selectAllVisible}
                    className="shrink-0 text-[11px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    Выбрать все
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-white/45">
                    {needFix.length > 0
                      ? <>Без тегов: <span className="text-orange-300 font-medium">{needFix.length}</span></>
                      : <>Все звуки размечены. <span className="text-emerald-300">Отлично!</span></>}
                  </p>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setSelectMode(true)}
                      className="flex items-center gap-1 text-[11px] text-white/40 hover:text-orange-300 transition-colors"
                    >
                      <CheckSquare size={13} /> Выделить
                    </button>
                    <button
                      onClick={() => setShowDone((v) => !v)}
                      className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showDone ? 'Только без тегов' : 'Показать все'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <CheckCircle2 size={34} className="text-emerald-400/60" strokeWidth={1.4} />
                <p className="text-sm text-white/45">Нечего чинить — всё размечено.</p>
              </div>
            ) : (
              visible.map(({ pad, missing }) => (
                <TagFixRow
                  key={pad.id}
                  pad={pad}
                  override={overrides[pad.id]}
                  missing={missing}
                  onChangeAxes={onChangeAxes}
                  selectable={selectMode}
                  selected={selected.has(pad.id)}
                  onToggleSelect={toggleSelect}
                  onRemove={removePad}
                  onRename={handleRename}
                  onToggleLoop={handleToggleLoop}
                  broken={health.broken.has(pad.id)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Нижняя плашка действия в режиме выделения */}
      {selectMode && selected.size > 0 && (
        <div className="px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 border-t border-white/10 bg-[#0c0c0c]">
          <button
            onClick={() => setBulkOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500/20 border border-orange-400/50 px-3 py-3 text-[12px] font-mono tracking-wider text-orange-200 hover:bg-orange-500/30 transition-colors"
          >
            <TagsIcon size={15} />
            ПРИСВОИТЬ ТЕГИ · {selected.size}
          </button>
        </div>
      )}

      <BulkTagDialog
        open={bulkOpen}
        count={selected.size}
        onClose={() => setBulkOpen(false)}
        onApply={applyBulk}
      />
    </div>
  );
}