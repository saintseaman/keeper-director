import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Search, X, Sparkles, Music } from 'lucide-react';
import { useTileSounds } from '@/lib/useTileSounds';
import { useCustomPads } from '@/lib/useCustomPads';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { padAxes } from '@/lib/sceneAxes';
import { searchPads } from '@/lib/padSearch';

// Диалог назначения звуков на одну плитку оси (axisId:valueId).
// Сверху — рекомендованные (у которых в тегах есть valueId по этой оси),
// ниже — все остальные. Мультивыбор с мгновенным сохранением через useTileSounds.
export default function TileSoundsDialog({ open, onClose, axisId, valueId, valueLabel }) {
  const { tileSounds, getSounds, addSound, removeSound } = useTileSounds();
  const { pads } = useCustomPads();
  const { overrides } = useSoundOverrides();
  const [query, setQuery] = useState('');

  const assigned = useMemo(
    () => new Set(axisId && valueId ? getSounds(axisId, valueId) : []),
    [axisId, valueId, getSounds, tileSounds]
  );

  // Поиск по библиотеке (название + теги), затем деление на 2 группы.
  const { recommended, others } = useMemo(() => {
    if (!axisId || !valueId) return { recommended: [], others: [] };
    const list = searchPads(pads, overrides, query);
    const rec = [];
    const rest = [];
    for (const p of list) {
      const axes = padAxes(p, overrides[p.id]);
      if ((axes[axisId] || []).includes(valueId)) rec.push(p);
      else rest.push(p);
    }
    return { recommended: rec, others: rest };
  }, [pads, overrides, query, axisId, valueId]);

  const toggle = (id) => {
    if (assigned.has(id)) removeSound(axisId, valueId, id);
    else addSound(axisId, valueId, id);
  };

  const Row = ({ pad, recommended }) => {
    const on = assigned.has(pad.id);
    return (
      <button
        onClick={() => toggle(pad.id)}
        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left border transition-colors ${
          on ? 'bg-orange-500/15 border-orange-400/50' : 'bg-white/[0.03] border-white/10 hover:border-white/20'
        }`}
      >
        <span
          className={`shrink-0 w-5 h-5 rounded flex items-center justify-center border ${
            on ? 'bg-orange-500 border-orange-400' : 'border-white/25'
          }`}
        >
          {on && <Check size={13} className="text-black" />}
        </span>
        <span className="flex-1 min-w-0 truncate text-sm text-white/85">{pad.title}</span>
        {recommended && <Sparkles size={13} className="shrink-0 text-orange-300/80" />}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setQuery(''); onClose(); } }}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-white/10">
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase flex items-center gap-2">
            <Music size={15} className="text-orange-400" />
            Звуки плитки · {valueLabel}
          </DialogTitle>
        </DialogHeader>

        {/* Поиск */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию…"
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-8 py-2 text-sm text-white/80 placeholder:text-white/25 focus:border-orange-400/50 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Списки */}
        <div className="px-4 py-3 max-h-[50vh] overflow-y-auto space-y-4">
          {recommended.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-orange-300/80">
                <Sparkles size={12} /> Рекомендованные
              </div>
              {recommended.map((p) => <Row key={p.id} pad={p} recommended />)}
            </div>
          )}

          {others.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono tracking-wider uppercase text-white/40">Все остальные</div>
              {others.map((p) => <Row key={p.id} pad={p} />)}
            </div>
          )}

          {recommended.length === 0 && others.length === 0 && (
            <p className="py-8 text-center text-sm text-white/40">Ничего не найдено</p>
          )}
        </div>

        {/* Готово */}
        <div className="px-4 py-3 border-t border-white/10">
          <button
            onClick={() => { setQuery(''); onClose(); }}
            className="w-full rounded-lg py-2.5 text-[12px] font-mono tracking-wider uppercase bg-orange-500/20 border border-orange-400/50 text-orange-200 hover:bg-orange-500/30 transition-colors"
          >
            Готово{assigned.size > 0 ? ` · ${assigned.size}` : ''}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}