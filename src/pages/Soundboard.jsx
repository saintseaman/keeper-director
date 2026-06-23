import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SOUNDS, SOUND_CATEGORIES, getSoundsByCategory, searchSounds } from '@/lib/soundData';
import SoundButton from '@/components/keeper/SoundButton';
import BottomNav from '@/components/keeper/BottomNav';
import { getIcon } from '@/lib/iconMap';

export default function Soundboard() {
  const [activeCategory, setActiveCategory] = useState('atmosphere');
  const [searchQuery, setSearchQuery] = useState('');

  const displaySounds = searchQuery
    ? searchSounds(searchQuery)
    : getSoundsByCategory(activeCategory);

  return (
    <div className="min-h-screen bg-obsidian parchment-texture pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="font-heading text-base tracking-widest text-brass-glow uppercase">Soundboard</h1>
        <p className="text-xs font-display italic text-parchment-dim mt-0.5">{SOUNDS.length} sounds ready</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim" />
          <Input
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-graphite border-border text-parchment placeholder:text-muted-foreground font-display text-sm h-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="px-4 mb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {SOUND_CATEGORIES.map(cat => {
              const Icon = getIcon(cat.icon);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-heading tracking-wider transition-all whitespace-nowrap
                    ${isActive
                      ? cat.id === 'jumpscare'
                        ? 'bg-red-950/60 border border-red-900/50 text-red-300'
                        : 'bg-brass/15 border border-brass/30 text-brass-glow'
                      : 'bg-graphite-light border border-border text-parchment-dim'
                    }
                  `}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sound Grid */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2">
          {displaySounds.map(sound => (
            <SoundButton key={sound.id} sound={sound} />
          ))}
        </div>
        {displaySounds.length === 0 && (
          <p className="text-center text-sm text-muted-foreground font-display italic py-8">
            No sounds found
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}