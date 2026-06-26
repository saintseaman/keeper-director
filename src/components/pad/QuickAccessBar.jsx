import React, { useMemo, useEffect } from 'react';
import { Star, Clock } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { useIsSoundActive, useAudioActions } from '@/lib/useAudio';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { audioEngine } from '@/lib/audioEngine';
import { usePadLibrary, recordRecentPad } from '@/lib/usePadLibrary';

// Компактная плитка быстрого запуска (избранное / недавнее).
function QuickChip({ pad, starred }) {
  const isActive = useIsSoundActive(pad.id);
  const { stop } = useAudioActions();
  const { getOverride } = useSoundOverrides();
  const ov = getOverride(pad.id);
  const title = ov.title ?? pad.title;
  const Icon = getIcon(ov.icon ?? pad.icon);
  const volume = typeof ov.volume === 'number' ? ov.volume : 0.6;
  const isLoopable = typeof ov.isLoopable === 'boolean' ? ov.isLoopable : !!pad.isLoopable;

  const fire = () => {
    if (audioEngine.isPlaying(pad.id)) { stop(pad.id, 0); return; }
    if (!pad.url) return;
    recordRecentPad(pad.id);
    if (isLoopable) audioEngine.playFile(pad.id, pad.url, title, volume, true);
    else audioEngine.triggerFile(pad.id, pad.url, title, volume);
  };

  return (
    <button
      onClick={fire}
      title={title}
      className={`group relative shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 max-w-[150px] transition-all active:scale-95
        ${isActive
          ? 'bg-orange-500/20 border-orange-400/60 text-orange-100'
          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/25'}`}
    >
      <Icon size={14} strokeWidth={1.8} className={isActive ? 'text-orange-200 shrink-0' : 'text-white/50 shrink-0'} />
      <span className="text-[11px] leading-none truncate">{title}</span>
      {starred && <Star size={10} className="fill-orange-400 text-orange-400 shrink-0" />}
    </button>
  );
}

// Полоса быстрого доступа над декой: сначала избранные, затем недавние.
export default function QuickAccessBar({ pads }) {
  const { recent, favorites } = usePadLibrary();
  const byId = useMemo(() => new Map(pads.map((p) => [p.id, p])), [pads]);

  const favPads = favorites.map((id) => byId.get(id)).filter(Boolean);
  const favSet = new Set(favorites);
  const recentPads = recent.map((id) => byId.get(id)).filter((p) => p && !favSet.has(p.id));

  // Предзагружаем ходовые звуки → первый запуск без сетевой задержки.
  useEffect(() => {
    for (const p of favPads) audioEngine.preloadFile(p.url);
    for (const p of recentPads.slice(0, 8)) audioEngine.preloadFile(p.url);
  }, [favPads, recentPads]);

  if (favPads.length === 0 && recentPads.length === 0) return null;

  return (
    <div className="px-4 pt-3 space-y-2">
      {favPads.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          <Star size={12} className="shrink-0 text-orange-400/70" />
          {favPads.map((p) => <QuickChip key={p.id} pad={p} starred />)}
        </div>
      )}
      {recentPads.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          <Clock size={12} className="shrink-0 text-white/35" />
          {recentPads.map((p) => <QuickChip key={p.id} pad={p} />)}
        </div>
      )}
    </div>
  );
}