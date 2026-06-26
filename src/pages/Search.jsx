import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { searchPads } from '@/lib/padSearch';
import { padCategory, PAD_CATEGORIES } from '@/lib/padCategories';
import PadSearchRow from '@/components/pad/PadSearchRow';

// Поиск по СВОЕЙ библиотеке (импортированные пэды), а не по синтез-каталогу.
// Это главный быстрый вход к нужному звуку для мастера с большой коллекцией.
export default function Search() {
  const { pads } = useCustomPads();
  const { overrides } = useSoundOverrides();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Категории, которые реально присутствуют в библиотеке (пустые не показываем).
  const presentCats = useMemo(() => {
    const set = new Set(pads.map((p) => padCategory(p)));
    return PAD_CATEGORIES.filter((c) => set.has(c.id));
  }, [pads]);

  const results = useMemo(() => {
    let list = pads;
    if (category) list = list.filter((p) => padCategory(p) === category);
    return searchPads(list, overrides, query);
  }, [pads, overrides, query, category]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Поисковая строка */}
      <div className="px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 rounded-xl bg-[#161616] border border-white/10 px-3 py-2.5 focus-within:border-orange-400/50">
          <SearchIcon size={17} className="text-white/40 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск звука по названию или тегу…"
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-white/40 hover:text-white/70 shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Чипы категорий — только те, что есть в библиотеке */}
        {presentCats.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pt-3 -mx-1 px-1 no-scrollbar">
            <CategoryChip active={!category} onClick={() => setCategory(null)} label="Все" />
            {presentCats.map((c) => {
              const Icon = c.icon;
              return (
                <CategoryChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(category === c.id ? null : c.id)}
                  label={c.label}
                  Icon={Icon}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Результаты */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {pads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 pt-16 text-center">
            <SearchIcon size={32} className="text-white/15" strokeWidth={1.2} />
            <p className="text-sm text-white/40">Библиотека пуста</p>
            <p className="text-xs text-white/25">Импортируйте звуки с Google Диска на главной.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 pt-16 text-center">
            <SearchIcon size={32} className="text-white/15" strokeWidth={1.2} />
            <p className="text-sm text-white/40">Ничего не найдено</p>
            <p className="text-xs text-white/25">Попробуйте другое слово или тег.</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-mono tracking-widest text-white/30 uppercase pb-1">
              {results.length} {results.length === 1 ? 'звук' : 'звуков'}
            </p>
            {results.map((p) => <PadSearchRow key={p.id} pad={p} />)}
          </>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ active, onClick, label, Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-mono tracking-wide transition-all
        ${active ? 'bg-orange-500/20 border border-orange-400/50 text-orange-200' : 'bg-white/5 border border-white/10 text-white/45 hover:text-white/70'}`}
    >
      {Icon && <Icon size={13} strokeWidth={1.8} />}
      {label}
    </button>
  );
}