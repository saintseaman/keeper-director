import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Search, Layers, Tags, Settings, Zap } from 'lucide-react';

const ITEMS = [
  { to: '/app', label: 'Главная', icon: LayoutGrid, end: true },
  { to: '/app/search', label: 'Поиск', icon: Search },
  { type: 'effects', label: 'Эффекты', icon: Zap },
  { to: '/app/scenes', label: 'Сцены', icon: Layers },
  { to: '/app/tags', label: 'Теги', icon: Tags },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
];

export default function PadBottomNav({ onOpenEffects }) {
  return (
    <nav className="shrink-0 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="flex items-stretch justify-around px-2 pt-1.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;

          // Кнопка открытия шторки эффектов (не маршрут).
          if (item.type === 'effects') {
            return (
              <button
                key="effects"
                onClick={onOpenEffects}
                className="flex flex-col items-center gap-1 flex-1 py-1.5 rounded-lg select-none"
              >
                <Icon size={21} strokeWidth={1.6} className="text-orange-400" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-orange-300">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}