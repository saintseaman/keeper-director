import React, { useState, useMemo } from 'react';
import { Tags as TagsIcon, AlertCircle, CheckCircle2, CheckSquare, X } from 'lucide-react';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { padAxes, missingAxes, autoAxes } from '@/lib/sceneAxes';
import TagFixRow from '@/components/scene/TagFixRow';
import BulkTagDialog from '@/components/scene/BulkTagDialog';

// Панель «Теги» — аналитика разметки звуков.
// Показывает звуки, у которых не проставлены теги по осям («нужно починить»),
// и даёт доразметить прямо здесь — поштучно или массово (режим выделения).
export default function Tags() {
  const { pads } = useCustomPads();
  const { overrides, setOverride } = useSoundOverrides();
  const [showDone, setShowDone] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  // Для каждого пэда считаем недостающие оси.
  const rows = useMemo(() => {
    return pads
      .map((p) => {
        const axes = padAxes(p, overrides[p.id]);
        return { pad: p, missing: missingAxes(axes) };
      })
      .sort((a, b) => b.missing.length - a.missing.length);
  }, [pads, overrides]);

  const needFix = rows.filter((r) => r.missing.length > 0);
  const done = rows.filter((r) => r.missing.length === 0);
  const visible = showDone ? rows : needFix;

  const onChangeAxes = (padId, axes) => setOverride(padId, { axes });

  const toggleSelect = (padId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(padId) ? next.delete(padId) : next.add(padId);
      return next;
    });
  };

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const selectAllVisible = () => setSelected(new Set(visible.map((r) => r.pad.id)));

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
      setOverride(padId, { axes: { ...manual, ...merged } });
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
            onClick={exitSelect}
            className="flex items-center gap-1 text-[11px] font-mono text-white/50 hover:text-white/80 transition-colors"
          >
            <X size={13} /> Отмена
          </button>
        ) : (
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-orange-300/80">
              <AlertCircle size={12} /> {needFix.length}
            </span>
            <span className="flex items-center gap-1 text-emerald-300/80">
              <CheckCircle2 size={12} /> {done.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {pads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <TagsIcon size={40} className="text-white/15" strokeWidth={1.2} />
            <p className="text-sm text-white/45">Сначала импортируйте звуки с Google Диска на главной.</p>
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