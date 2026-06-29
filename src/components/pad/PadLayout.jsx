import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PadBottomNav from './PadBottomNav';
import SaveIndicator from '@/components/SaveIndicator';
import EffectsSheet from '@/components/effects/EffectsSheet';

// Общий каркас для экранов драм-пада: контент + нижняя навигация.
// Шторка эффектов открывается кнопкой-молнией в нижней навигации.
export default function PadLayout() {
  const [effectsOpen, setEffectsOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-black session-mode">
      <SaveIndicator />

      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
      <PadBottomNav onOpenEffects={() => setEffectsOpen(true)} />

      <EffectsSheet open={effectsOpen} onOpenChange={setEffectsOpen} />
    </div>
  );
}