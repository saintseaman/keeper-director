import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Grid3x3, BookOpen, Sparkles, Film } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/soundboard', label: 'Sounds', icon: Grid3x3 },
  { path: '/scenes', label: 'Scenes', icon: BookOpen },
  { path: '/director', label: 'Director', icon: Film },
  { path: '/ai-keeper', label: 'AI', icon: Sparkles },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-obsidian/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all min-w-[56px]
                ${isActive ? 'text-brass-glow' : 'text-parchment-dim'}
              `}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[9px] font-heading tracking-wider">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-brass-glow mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}