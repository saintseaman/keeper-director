import React, { useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X, Zap } from 'lucide-react';
import { useEffectSlots } from '@/lib/useEffectSlots';
import EffectSlot from './EffectSlot';
import EffectSlotDialog from './EffectSlotDialog';

// Глобальная шторка звуковых эффектов (one-shot триггеры) Хранителя.
// Выезжает сверху вниз поверх любого экрана. Закрывается свайпом вверх
// или тапом на крестик. 12 слотов в сетке 4×3.
export default function EffectsSheet({ open, onOpenChange }) {
  const { slots, updateSlot, clearSlot } = useEffectSlots();
  const [editing, setEditing] = useState(null); // редактируемый слот

  return (
    <>
      <DrawerPrimitive.Root direction="top" open={open} onOpenChange={onOpenChange}>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <DrawerPrimitive.Content className="fixed inset-0 z-50 flex flex-col border-white/10 bg-[#141414] outline-none" style={{ height: '100dvh' }}>
            <div className="flex-1 overflow-y-auto px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-4">
              {/* Шапка */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-orange-400" />
                  <span className="text-[13px] font-mono tracking-[0.25em] text-white/80 uppercase">Эффекты</span>
                </div>
                <DrawerPrimitive.Close className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors">
                  <X size={20} />
                </DrawerPrimitive.Close>
              </div>

              {/* Сетка слотов 4×3 */}
              <div className="grid grid-cols-4 gap-2.5">
                {slots.map((slot) => (
                  <EffectSlot key={slot.id} slot={slot} onEdit={setEditing} />
                ))}
              </div>

              {/* Ручка для свайпа вверх */}
              <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/15" />
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>

      <EffectSlotDialog
        slot={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={updateSlot}
        onClear={clearSlot}
      />
    </>
  );
}