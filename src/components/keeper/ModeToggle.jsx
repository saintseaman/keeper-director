import React from 'react';
import { Play, Pencil } from 'lucide-react';
import { useMode } from '@/lib/ModeContext';
import { useLang } from '@/lib/LangContext';

// Перемикач Gameplay / Edit (M4). Сегментований контрол у шапці.
export default function ModeToggle() {
  const { mode, setMode } = useMode();
  const { t } = useLang();

  const Item = ({ value, icon: Icon, label }) => {
    const active = mode === value;
    return (
      <button
        onClick={() => setMode(value)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all
          ${active ? 'bg-brass-dim/30 text-brass-glow' : 'text-parchment-dim hover:text-parchment'}`}
      >
        <Icon size={12} strokeWidth={active ? 2.2 : 1.6} />
        <span className="text-[10px] font-heading tracking-wider uppercase">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-graphite/60 p-0.5">
      <Item value="play" icon={Play} label={t('modePlay')} />
      <Item value="edit" icon={Pencil} label={t('modeEdit')} />
    </div>
  );
}