import React from 'react';
import { Outlet } from 'react-router-dom';
import PadBottomNav from './PadBottomNav';
import SaveIndicator from '@/components/SaveIndicator';

// Общий каркас для экранов драм-пада: контент + нижняя навигация.
export default function PadLayout() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black session-mode">
      <SaveIndicator />

      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
      <PadBottomNav />
    </div>
  );
}