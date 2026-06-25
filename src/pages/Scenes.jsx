import React from 'react';
import { Layers } from 'lucide-react';

export default function Scenes() {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <Layers size={18} className="text-orange-400" />
        <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Сцены</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <Layers size={40} className="text-white/15" strokeWidth={1.2} />
        <p className="text-sm text-white/45">Здесь появятся сохранённые сцены — наборы звуков с громкостями.</p>
        <p className="text-xs text-white/25">Скоро добавим возможность создавать и запускать их.</p>
      </div>
    </div>
  );
}