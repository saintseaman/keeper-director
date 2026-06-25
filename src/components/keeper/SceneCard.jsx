import React from 'react';
import { motion } from 'framer-motion';
import { getIcon } from '@/lib/iconMap';
import { useAudio } from '@/lib/useAudio';
import { getSoundIdByName } from '@/lib/soundData';
import { Play, Square, Heart } from 'lucide-react';

export default function SceneCard({ scene, onToggleFavorite, isFavorite, onSelect }) {
  const { activeSounds, play, stopAll } = useAudio();

  const isActive = scene.layers?.some(l => {
    const soundId = getSoundIdByName(l.sound_name);
    return !!activeSounds[soundId];
  });

  const IconComponent = getIcon(scene.icon);

  const handleLaunch = (e) => {
    e.stopPropagation();
    if (isActive) {
      stopAll(0.8);
    } else {
      stopAll(0.3);
      setTimeout(() => {
        scene.layers?.forEach(layer => {
          const soundId = getSoundIdByName(layer.sound_name);
          if (soundId) {
            play(soundId, layer.sound_name, (layer.volume || 50) / 100, true);
          }
        });
      }, 400);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect?.(scene)}
      className={`
        relative rounded-lg border p-4 cursor-pointer transition-all duration-300
        ${isActive
          ? 'bg-brass-dim/15 border-brass/30 brass-glow'
          : 'bg-graphite/80 border-border hover:border-brass-dim/30'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center shrink-0
          ${isActive ? 'bg-brass/20' : 'bg-graphite-light'}
        `}>
          <IconComponent size={20} className={isActive ? 'text-brass-glow' : 'text-parchment-dim'} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-heading text-sm tracking-wide ${isActive ? 'text-brass-glow' : 'text-parchment'}`}>
            {scene.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 font-display italic">
            {scene.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {scene.layers?.slice(0, 3).map((layer, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-graphite-light text-parchment-dim">
                {layer.sound_name}
              </span>
            ))}
            {(scene.layers?.length || 0) > 3 && (
              <span className="text-[10px] text-muted-foreground">+{scene.layers.length - 3}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleLaunch}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-all
              ${isActive
                ? 'bg-brass/30 text-brass-glow'
                : 'bg-graphite-light text-parchment-dim hover:text-brass'
              }
            `}
          >
            {isActive ? <Square size={18} /> : <Play size={18} />}
          </button>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(scene); }}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-graphite-light transition-all"
            >
              <Heart
                size={16}
                className={isFavorite ? 'text-burgundy-glow fill-burgundy-glow' : 'text-parchment-dim'}
              />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}