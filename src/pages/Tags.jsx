import React, { useState, useMemo } from 'react';
import { Tags as TagsIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { padAxes, missingAxes } from '@/lib/sceneAxes';
import TagFixRow from '@/components/scene/TagFixRow';

// Панель «Теги» — аналитика разметки звуков.
// Показывает звуки, у которых не проставлены теги по осям («нужно починить»),
// и даёт доразметить прямо здесь. Когда всё размечено — показывает «готово».
export default function Tags() {
  const { pads } = useCustomPads();
  const { overrides, setOverride } = useSoundOverrides();
  const [showDone, setShowDone] = useState(false);

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

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TagsIcon size={18} className="text-orange-400" />
          <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Теги</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-orange-300/80">
            <AlertCircle size={12} /> {needFix.length}
          </span>
          <span className="flex items-center gap-1 text-emerald-300/80">
            <CheckCircle2 size={12} /> {done.length}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {pads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <TagsIcon size={40} className="text-white/15" strokeWidth={1.2} />
            <p className="text-sm text-white/45">Сначала импортируйте звуки с Google Диска на главной.</p>
          </div>
        ) : (
          <>
            {/* Переключатель: только «нужно починить» / все */}
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-white/45">
                {needFix.length > 0
                  ? <>Без тегов: <span className="text-orange-300 font-medium">{needFix.length}</span> — раскройте звук и проставьте оси.</>
                  : <>Все звуки размечены. <span className="text-emerald-300">Отлично!</span></>}
              </p>
              <button
                onClick={() => setShowDone((v) => !v)}
                className="shrink-0 text-[11px] text-white/40 hover:text-white/70 transition-colors"
              >
                {showDone ? 'Только без тегов' : 'Показать все'}
              </button>
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
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}