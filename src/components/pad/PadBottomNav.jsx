import React from 'react';
import { NavLink } from 'react-router-dom';
import { Grid3x3, Layers, Settings } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Звуки', icon: Grid3x3, end: true },
  { to: '/scenes', label: 'Сцены', icon: Layers },
  { to: '/settings', label: 'Настройки', icon: Settings },
];

export default function PadBottomNav() {
  return (
    <nav className="shrink-0 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="flex items-stretch justify-around px-2 pt-1.5">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex flex-col items-center gap-1 flex-1 py-1.5 rounded-lg select-none"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  className={isActive ? 'text-orange-400' : 'text-white/45'}
                />
                <span className={`text-[10px] font-mono tracking-widest uppercase ${isActive ? 'text-orange-300' : 'text-white/40'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}