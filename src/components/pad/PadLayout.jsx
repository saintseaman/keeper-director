import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';
import PadBottomNav from './PadBottomNav';
import SaveIndicator from '@/components/SaveIndicator';
import EffectsSheet from '@/components/effects/EffectsSheet';

// Общий каркас для экранов драм-пада: контент + нижняя навигация.
// Глобальная шторка эффектов открывается кнопкой-молнией и доступна на всех /app/*.
export default function PadLayout() {
  const [effectsOpen, setEffectsOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-black session-mode">
      <SaveIndicator />

      {/* Плавающая кнопка открытия шторки эффектов — поверх любого экрана */}
      <button
        onClick={() => setEffectsOpen(true)}
        title="Звуковые эффекты"
        className="fixed top-[max(env(safe-area-inset-top),0.5rem)] right-3 z-40 w-10 h-10 rounded-full flex items-center justify-center bg-[#141414]/90 backdrop-blur-sm border border-orange-400/40 text-orange-300 shadow-[0_0_20px_-4px_rgba(249,115,22,0.5)] active:scale-95 transition-transform"
      >
        <Zap size={18} strokeWidth={2} />
      </button>

      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
      <PadBottomNav />

      <EffectsSheet open={effectsOpen} onOpenChange={setEffectsOpen} />
    </div>
  );
}