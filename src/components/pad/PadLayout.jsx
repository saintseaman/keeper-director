import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import PadBottomNav from './PadBottomNav';
import SaveIndicator from '@/components/SaveIndicator';
import EffectsSheet from '@/components/effects/EffectsSheet';

// Общий каркас для экранов драм-пада: контент + нижняя навигация.
// Шторка эффектов открывается плавающей кнопкой (FAB) над навигацией.
export default function PadLayout() {
  const [effectsOpen, setEffectsOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-black session-mode">
      <SaveIndicator />

      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
      <PadBottomNav />

      {/* Плавающая кнопка эффектов поверх контента, над навигацией */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={() => setEffectsOpen(true)}
        title="Звуковые эффекты"
        className="fixed z-50 flex items-center justify-center rounded-full bg-orange-500"
        style={{
          bottom: 80,
          right: 16,
          width: 52,
          height: 52,
          boxShadow: '0 4px 20px rgba(249,115,22,0.5)',
        }}
      >
        <Zap size={22} className="text-white" strokeWidth={2} />
      </motion.button>

      <EffectsSheet open={effectsOpen} onOpenChange={setEffectsOpen} />
    </div>
  );
}