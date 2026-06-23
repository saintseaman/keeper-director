import React, { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PRESET_SCENES } from '@/lib/soundData';
import SceneCard from '@/components/keeper/SceneCard';
import BottomNav from '@/components/keeper/BottomNav';

const SCENE_FILTERS = ['all', 'location', 'event', 'encounter', 'ritual'];

export default function Scenes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('keeper_favorites') || '[]'); } catch { return []; }
  });

  const toggleFavorite = (scene) => {
    const id = scene.id;
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('keeper_favorites', JSON.stringify(next));
  };

  let scenes = PRESET_SCENES;
  if (activeFilter !== 'all') {
    scenes = scenes.filter(s => s.category === activeFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    scenes = scenes.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.tags?.some(t => t.includes(q))
    );
  }

  const favoriteScenes = PRESET_SCENES.filter(s => favorites.includes(s.id));

  return (
    <div className="min-h-screen bg-obsidian parchment-texture pb-24">
      <div className="px-4 pt-6 pb-3">
        <h1 className="font-heading text-base tracking-widest text-brass-glow uppercase">Scene Library</h1>
        <p className="text-xs font-display italic text-parchment-dim mt-0.5">{PRESET_SCENES.length} pre-built scenes</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim" />
          <Input
            placeholder="Search scenes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-graphite border-border text-parchment placeholder:text-muted-foreground font-display text-sm h-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {SCENE_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`
                px-3 py-2 rounded-lg text-xs font-heading tracking-wider capitalize transition-all
                ${activeFilter === filter
                  ? 'bg-brass/15 border border-brass/30 text-brass-glow'
                  : 'bg-graphite-light border border-border text-parchment-dim'
                }
              `}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Favorites */}
        {favoriteScenes.length > 0 && !searchQuery && activeFilter === 'all' && (
          <div>
            <h2 className="text-[10px] font-heading tracking-[0.2em] text-brass uppercase mb-2 flex items-center gap-1.5">
              <BookOpen size={12} /> Favorites
            </h2>
            <div className="space-y-2">
              {favoriteScenes.map(scene => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  isFavorite={true}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Scenes */}
        <div>
          <h2 className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">
            {activeFilter === 'all' ? 'All Scenes' : activeFilter}
          </h2>
          <div className="space-y-2">
            {scenes.map(scene => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isFavorite={favorites.includes(scene.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}