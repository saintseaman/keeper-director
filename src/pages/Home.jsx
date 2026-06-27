import React, { useState, useMemo } from 'react';
import { Square, Dices, FolderDown, SlidersHorizontal } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/lib/useAudio';
import { useCustomPads } from '@/lib/useCustomPads';
import { useAxes } from '@/lib/useAxes';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { padAxes } from '@/lib/sceneAxes';
import { padCategory } from '@/lib/padCategories';
import PadDeck from '@/components/pad/PadDeck';
import LocationTabs from '@/components/pad/LocationTabs';
import CategoryTabs from '@/components/pad/CategoryTabs';
import DriveFolderDialog from '@/components/pad/DriveFolderDialog';
import MixerDialog from '@/components/pad/MixerDialog';
import QuickAccessBar from '@/components/pad/QuickAccessBar';

// Розбити масив звуків на сторінки по 9 пэдів.
function paginate(list, size = 9) {
  const pages = [];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages;
}

export default function Home() {
  const { activeSounds, masterVolume, setMasterVolume, stopAll } = useAudio();
  const { pads: customPads, addPads, removePad } = useCustomPads();
  const { axes } = useAxes();
  const { getOverride } = useSoundOverrides();
  const [folderOpen, setFolderOpen] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);
  const [activeLoc, setActiveLoc] = useState(null); // null = «Все»
  const [activeCat, setActiveCat] = useState(null); // null = «Все» (категория внутри локации)

  const activeCount = Object.values(activeSounds).filter(v => v.isPlaying !== false).length;

  // Кастомные значения оси «Локация» (для подписей/иконок вкладок).
  const locationCustomValues = useMemo(
    () => axes.find((a) => a.id === 'location')?.values.filter((v) => v.custom) || [],
    [axes]
  );

  // Карта: padId → массив id локаций пэда (с учётом ручных правок и авто).
  const padLocations = useMemo(() => {
    const map = {};
    for (const p of customPads) {
      map[p.id] = padAxes(p, getOverride(p.id)).location || [];
    }
    return map;
  }, [customPads, getOverride]);

  // Счётчики пэдов по локациям (звук может попасть в несколько → +1 каждой).
  const counts = useMemo(() => {
    const acc = {};
    for (const p of customPads) {
      for (const locId of padLocations[p.id] || []) acc[locId] = (acc[locId] || 0) + 1;
    }
    return acc;
  }, [customPads, padLocations]);

  // Пэды выбранной локации (или все).
  const inLocation = useMemo(
    () => (activeLoc ? customPads.filter((p) => (padLocations[p.id] || []).includes(activeLoc)) : customPads),
    [customPads, activeLoc, padLocations]
  );

  // Счётчики категорий внутри выбранной локации (для второго ряда вкладок).
  const catCounts = useMemo(() => {
    const acc = {};
    for (const p of inLocation) { const c = padCategory(p); acc[c] = (acc[c] || 0) + 1; }
    return acc;
  }, [inLocation]);

  // Внутри локации фильтруем по категории (или все). Затем режем по 9.
  const filtered = useMemo(
    () => (activeCat ? inLocation.filter((p) => padCategory(p) === activeCat) : inLocation),
    [inLocation, activeCat]
  );
  const decks = paginate(filtered, 9);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Top bar — минимальная "рейка" как у Pioneer */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Dices size={20} className={`text-orange-400 ${activeCount > 0 ? 'animate-pulse' : ''}`} />
        </div>

        <div className="flex items-center gap-3">
          {/* Импорт папки с Google Диска */}
          <button
            onClick={() => setFolderOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-white/10 text-white/60 hover:border-orange-400/40 hover:text-orange-300 transition-colors"
            title="Импорт папки с Google Диска"
          >
            <FolderDown size={13} />
            <span className="hidden sm:inline">DRIVE</span>
          </button>

          {/* Настройки всех кнопок (микшер) */}
          <button
            onClick={() => setMixerOpen(true)}
            disabled={customPads.length === 0}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider border transition-colors
              ${customPads.length === 0
                ? 'bg-white/5 border-white/10 text-white/25'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-orange-400/40 hover:text-orange-300'}`}
            title="Настройки всех кнопок"
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">МИКС</span>
          </button>

          {/* Master */}
          <div className="flex items-center gap-2 w-28">
            <span className="text-[9px] font-mono text-white/40 tracking-widest">MST</span>
            <Slider
              value={[Math.round(masterVolume * 100)]}
              onValueChange={([v]) => setMasterVolume(v / 100)}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-orange-400 [&_[role=slider]]:border-orange-300 [&_[role=slider]]:w-3.5 [&_[role=slider]]:h-3.5 [&_.range]:bg-orange-500/70"
            />
          </div>
          {/* Stop all */}
          <button
            onClick={() => stopAll(0.4)}
            disabled={activeCount === 0}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-mono tracking-wider transition-all
              ${activeCount > 0 ? 'bg-rose-600/20 border border-rose-500/50 text-rose-300' : 'bg-white/5 border border-white/10 text-white/25'}`}
          >
            <Square size={12} className={activeCount > 0 ? 'fill-rose-400' : ''} />
            {activeCount > 0 ? activeCount : 'STOP'}
          </button>
        </div>
      </div>

      {/* Полоса быстрого доступа: избранное + недавние */}
      {customPads.length > 0 && <QuickAccessBar pads={customPads} />}

      {/* Вкладки локаций */}
      {customPads.length > 0 && (
        <div className="px-4 pt-3 space-y-2">
          <LocationTabs
            active={activeLoc}
            onChange={(loc) => { setActiveLoc(loc); setActiveCat(null); }}
            counts={counts}
            total={customPads.length}
            customValues={locationCustomValues}
          />
          {/* Категории внутри выбранной локации */}
          <CategoryTabs
            active={activeCat}
            onChange={setActiveCat}
            counts={catCounts}
            total={inLocation.length}
          />
        </div>
      )}

      {/* Дека */}
      <div className="flex-1 min-h-0 px-4 pt-4 pb-3">
        {decks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <FolderDown size={32} className="text-white/20" />
            <p className="text-sm text-white/50 font-mono tracking-wide">Нет пэдов</p>
            <button
              onClick={() => setFolderOpen(true)}
              className="rounded-lg px-4 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-orange-400/40 text-orange-300 hover:bg-orange-400/10 transition-colors"
            >
              Импортировать папку с Google Диска
            </button>
          </div>
        ) : (
          <PadDeck pages={decks} onRemoveCustom={removePad} />
        )}
      </div>

      <DriveFolderDialog
        open={folderOpen}
        onClose={() => setFolderOpen(false)}
        onImported={(sounds) => addPads(sounds)}
      />

      <MixerDialog
        open={mixerOpen}
        onClose={() => setMixerOpen(false)}
        pads={customPads}
      />
    </div>
  );
}