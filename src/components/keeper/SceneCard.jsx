import React from 'react';
import { motion } from 'framer-motion';
import { getIcon } from '@/lib/iconMap';
import { useAudio } from '@/lib/useAudio';
import { Play, Square, Heart } from 'lucide-react';

export default function SceneCard({ scene, onToggleFavorite, isFavorite, onSelect }) {
  const { activeSounds, play, stopAll } = useAudio();

  const isActive = scene.layers?.some(l => {
    const soundId = getSoundIdFromName(l.sound_name);
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
          const soundId = getSoundIdFromName(layer.sound_name);
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

function getSoundIdFromName(name) {
  const map = {
    'Heavy Rain': 'rain_heavy', 'Light Rain': 'rain_light', 'Howling Wind': 'wind_howling',
    'Gentle Breeze': 'wind_gentle', 'Thunder': 'thunder', 'Ocean Waves': 'ocean_waves',
    'Crackling Fire': 'fire_crackling', 'Clock Ticking': 'clock_ticking', 'Dripping Water': 'dripping_water',
    'Creaking Wood': 'creaking_wood', 'Slow Footsteps': 'footsteps_slow', 'Rattling Chains': 'chains_rattling',
    'Fog Ambience': 'fog_ambience', 'Quiet Library': 'library_quiet', 'Moving Train': 'train_moving',
    'Church Bells': 'church_bells', 'Arctic Wind': 'arctic_wind', 'Jungle Night': 'jungle_ambient',
    'Desert Wind': 'desert_wind', 'Deep Underground': 'underground',
    'Door Creak': 'door_open_creak', 'Door Slam': 'door_slam', 'Breaking Glass': 'glass_break',
    'Explosion': 'explosion', 'Gunshot': 'gunshot', 'Cave Collapse': 'collapse',
    'Chase': 'chase_music', 'Combat Drums': 'combat_drums', 'Investigation': 'investigation',
    'Discovery': 'discovery', 'Lock Picking': 'lock_pick', 'Falling': 'falling',
    'Cultist Chant': 'cultist_chant', 'Deep One': 'deep_one_gurgle', 'Shoggoth': 'shoggoth_mass',
    'Byakhee Screech': 'byakhee_screech', 'Elder Presence': 'elder_thing', 'Ghoul Snarl': 'ghoul_snarl',
    'Mi-Go Buzzing': 'mi_go_buzz', 'Nightgaunt': 'nightgaunt',
    'Whispers': 'whisper_voices', 'Heavy Breathing': 'heavy_breathing', 'Slow Heartbeat': 'heartbeat_slow',
    'Racing Heart': 'heartbeat_fast', 'Scratching': 'scratching', 'Distant Scream': 'distant_scream',
    'Music Box': 'eerie_music_box', 'Reversed Speech': 'reverse_speech', 'Metal Scraping': 'metal_scraping',
    'Moaning': 'moaning',
    'Sanity Loss': 'sanity_loss', 'Reality Warp': 'distortion', 'Tinnitus': 'tinnitus',
    'Mad Laughter': 'laughter_mad', 'Cosmic Drone': 'cosmic_drone', 'Overlapping Voices': 'multiple_voices',
  };
  return map[name] || null;
}

export { getSoundIdFromName };