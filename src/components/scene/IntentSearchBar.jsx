import React, { useMemo, useState } from 'react';
import { Sparkles, Play, X, Wand2 } from 'lucide-react';
import { searchByIntent, intentChips } from '@/lib/intentParse';
import { AXIS_CHIP_CLASS, resolveAxisIcon } from '@/lib/sceneAxes';
import { sceneMixCount } from '@/lib/sceneMix';
import SceneMatchList from '@/components/scene/SceneMatchList';

// Командная строка намерений — главная точка входа в библиотеку.
// Хранитель пишет контекст («дождливый лес ночью»), а не ищет по папкам:
// фраза парсится в фасеты осей, звуки ранжируются, и одним тапом собирается
// нормализованный фоновый микс. Закрывает KPI «найти и запустить за 2 секунды».
export default function IntentSearchBar({ pads, overrides, onPlayMix, onApplyToScene }) {
  const [query, setQuery] = useState('');

  const { parsed, results } = useMemo(
    () => searchByIntent(pads, overrides, query),
    [pads, overrides, query]
  );

  const chips = useMemo(() => intentChips(parsed), [parsed]);
  const mixCount = sceneMixCount(results);
  const hasQuery = query.trim().length > 0;
  const recognized = chips.length > 0;

  return (
    <section className="rounded-2xl border border-orange-400/20 bg-gradient-to-b from-orange-500/[0.06] to-transparent p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <Wand2 size={15} className="text-orange-400" />
        <h2 className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase">Опиши сцену</h2>
      </div>

      {/* Поле ввода намерения */}
      <div className="relative">
        <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300/70" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="дождливый лес ночью…"
          className="w-full rounded-xl bg-black/30 border border-white/10 pl-9 pr-9 py-3 text-sm text-white/90 placeholder:text-white/30 focus:border-orange-400/50 focus:outline-none"
        />
        {hasQuery && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Распознанные фасеты */}
      {hasQuery && (
        recognized ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-white/35 mr-0.5">Понял:</span>
            {chips.map((c) => {
              const Icon = resolveAxisIcon(c.icon);
              const cls = AXIS_CHIP_CLASS[c.color]?.on || 'bg-white/10 border-white/20 text-white/80';
              return (
                <span
                  key={`${c.axisId}:${c.id}`}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${cls}`}
                >
                  <Icon size={11} />
                  {c.label}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-white/35">
            Не распознал контекст. Попробуйте: «таверна», «гроза ночью», «ритуал в храме».
          </p>
        )
      )}

      {/* Результаты + запуск микса */}
      {recognized && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">
              Найдено: <span className="text-orange-300 font-medium">{results.length}</span>
              {mixCount > 0 && <span className="text-white/30"> · в фон пойдёт {mixCount}</span>}
            </span>
            <div className="flex items-center gap-2">
              {onApplyToScene && results.length > 0 && (
                <button
                  onClick={() => onApplyToScene(parsed, results)}
                  className="text-[11px] font-mono tracking-wider text-white/45 hover:text-orange-300 transition-colors"
                >
                  В КОНСТРУКТОР
                </button>
              )}
              <button
                onClick={() => onPlayMix(results)}
                disabled={mixCount === 0}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider border transition-colors ${
                  mixCount === 0
                    ? 'bg-white/5 border-white/10 text-white/25'
                    : 'bg-orange-500/25 border-orange-400/60 text-orange-100 hover:bg-orange-500/35'
                }`}
              >
                <Play size={12} className="fill-orange-200" />
                СОБРАТЬ СЦЕНУ
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <SceneMatchList pads={results.slice(0, 30)} onRemoveCustom={undefined} />
          )}
        </div>
      )}
    </section>
  );
}