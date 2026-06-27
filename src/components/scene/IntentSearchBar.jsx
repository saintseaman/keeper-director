import React, { useMemo, useState } from 'react';
import { Sparkles, X, Wand2, Layers, Zap } from 'lucide-react';
import { intentCandidates, intentChips } from '@/lib/intentParse';
import { AXIS_CHIP_CLASS, resolveAxisIcon } from '@/lib/sceneAxes';
import CandidateRow from '@/components/scene/CandidateRow';

// Командная строка намерений — главная точка входа в библиотеку.
// Хранитель пишет контекст («дождливый лес ночью»), а движок ПРЕДЛАГАЕТ
// отранжированных кандидатов, разложенных по ролям (Фон / Акценты).
// Никакого слепого авто-микса: сцену Хранитель собирает вручную, добавляя
// нужные слои по одному кнопкой «+».
export default function IntentSearchBar({ pads, overrides, sceneIds, onAdd, onRemove }) {
  const [query, setQuery] = useState('');

  const { parsed, background, accents, total } = useMemo(
    () => intentCandidates(pads, overrides, query),
    [pads, overrides, query]
  );

  const chips = useMemo(() => intentChips(parsed), [parsed]);
  const hasQuery = query.trim().length > 0;
  const recognized = background.length > 0 || accents.length > 0;
  const inScene = (id) => sceneIds?.has(id);

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
      {hasQuery && chips.length > 0 && (
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
      )}

      {/* Кандидаты для ручной сборки */}
      {hasQuery && (
        recognized ? (
          <div className="mt-3.5 space-y-4">
            <p className="text-[11px] text-white/35 leading-snug">
              Подобрал <span className="text-orange-300">{total}</span> звуков. Прослушай тапом и
              добавляй нужные в сцену кнопкой «+».
            </p>

            {background.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-sky-300/80" />
                  <h3 className="text-[11px] font-mono tracking-wider text-white/55 uppercase">Фон · основа</h3>
                </div>
                {background.map((p) => (
                  <CandidateRow key={p.id} pad={p} inScene={inScene(p.id)} onAdd={onAdd} onRemove={onRemove} />
                ))}
              </div>
            )}

            {accents.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-300/80" />
                  <h3 className="text-[11px] font-mono tracking-wider text-white/55 uppercase">Акценты · события</h3>
                </div>
                {accents.map((p) => (
                  <CandidateRow key={p.id} pad={p} inScene={inScene(p.id)} onAdd={onAdd} onRemove={onRemove} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-white/35">
            Не распознал контекст. Попробуйте: «таверна», «гроза ночью», «ритуал в храме».
          </p>
        )
      )}
    </section>
  );
}