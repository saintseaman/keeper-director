import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { PAD_CATEGORIES, CAT_TAB_CLASS } from '@/lib/padCategories';

// Лента вкладок категорий над декой. Горизонтальный скролл на узких экранах.
// counts: { [categoryId]: number } — сколько пэдов в каждой группе.
// Пустые категории скрываются. active === null → «Все».
export default function CategoryTabs({ active, onChange, counts, total }) {
  const visible = PAD_CATEGORIES.filter((c) => (counts[c.id] || 0) > 0);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
      {/* Все */}
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono tracking-wider border transition-colors
          ${active === null
            ? 'bg-white/15 border-white/40 text-white'
            : 'bg-white/5 border-white/10 text-white/45 hover:text-white/70'}`}
      >
        <LayoutGrid size={13} />
        Все
        <span className="text-[9px] opacity-60">{total}</span>
      </button>

      {visible.map((cat) => {
        const Icon = cat.icon;
        const isActive = active === cat.id;
        const cls = CAT_TAB_CLASS[cat.color];
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono tracking-wider border transition-colors
              ${isActive ? cls.on : `bg-white/5 border-white/10 ${cls.off} hover:text-white/70`}`}
          >
            <Icon size={13} />
            {cat.label}
            <span className="text-[9px] opacity-60">{counts[cat.id]}</span>
          </button>
        );
      })}
    </div>
  );
}