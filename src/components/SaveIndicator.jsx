import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { storage } from '@/lib/storage';

// Маленький индикатор синхронизации с облаком. Появляется только когда
// идёт сохранение или произошла ошибка — в покое не мешает.
export default function SaveIndicator() {
  const [status, setStatus] = useState(storage.getSaveStatus());

  useEffect(() => storage.subscribeSaveStatus(setStatus), []);

  if (status === 'idle') return null;

  const map = {
    saving: { Icon: Loader2, text: 'Сохранение…', cls: 'text-white/50', spin: true },
    saved: { Icon: Cloud, text: 'Сохранено', cls: 'text-emerald-300/80', spin: false },
    error: { Icon: CloudOff, text: 'Нет связи — повтор…', cls: 'text-rose-300/90', spin: false },
  };
  const { Icon, text, cls, spin } = map[status] || map.saving;

  return (
    <div className="pointer-events-none fixed top-[max(env(safe-area-inset-top),0.5rem)] left-1/2 -translate-x-1/2 z-50">
      <div className={`flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-mono tracking-wider ${cls}`}>
        <Icon size={11} className={spin ? 'animate-spin' : ''} />
        {text}
      </div>
    </div>
  );
}