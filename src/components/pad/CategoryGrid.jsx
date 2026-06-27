import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { PAD_CATEGORIES, CAT_TAB_CLASS } from '@/lib/padCategories';

// Второй экран панели звуков: плитки КАТЕГОРИЙ внутри выбранной локации.
// Тап по плитке открывает деку звуков. counts: { [categoryId]: number }.
function CategoryTile({ label, Icon, count, cls, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative aspect-[4/3] rounded-xl overflow-hidden border flex flex-col items-center justify-center gap-2 transition-colors active:scale-[0.97] ${cls.on}`}
    >
      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm">
        <Icon size={24} strokeWidth={1.6} />
      </span>
      <span className="text-[13px] font-semibold leading-tight text-center px-2">{label}</span>
      <span className="absolute top-3 right-3 text-[10px] font-mono tracking-widest opacity-60">{count}</span>
    </button>
  );
}

const ALL_CLS = { on: 'bg-white/[0.06] border-white/15 text-white' };

export default function CategoryGrid({ counts, total, onSelect }) {
  const visible = PAD_CATEGORIES.filter((c) => (counts[c.id] || 0) > 0);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Все категории локации */}
        <CategoryTile label="Все" Icon={LayoutGrid} count={total} cls={ALL_CLS} onClick={() => onSelect(null)} />
        {visible.map((cat) => (
          <CategoryTile
            key={cat.id}
            label={cat.label}
            Icon={cat.icon}
            count={counts[cat.id]}
            cls={CAT_TAB_CLASS[cat.color]}
            onClick={() => onSelect(cat.id)}
          />
        ))}
      </div>
    </div>
  );
}