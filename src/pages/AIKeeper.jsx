import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Play, Loader2, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAudio } from '@/lib/useAudio';
import BottomNav from '@/components/keeper/BottomNav';
import { getIcon } from '@/lib/iconMap';

const EXAMPLES = [
  "The investigators descend into the basement of an old church",
  "A fog-shrouded cemetery at midnight, something digs from below",
  "The cultists begin their ritual in the abandoned warehouse",
  "A derelict ship drifts in Arctic waters, the crew is missing",
  "The library of Miskatonic University, after hours",
];

const SOUND_ID_MAP = {
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

const AVAILABLE_SOUNDS = Object.keys(SOUND_ID_MAP);

export default function AIKeeper() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { play, stopAll } = useAudio();

  const generateScene = async (text) => {
    const input = text || prompt;
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the AI Keeper Director for Call of Cthulhu RPG. A Game Master describes a scene, and you create an atmospheric soundscape.

Available sounds (use ONLY these exact names): ${AVAILABLE_SOUNDS.join(', ')}

The Game Master's scene: "${input}"

Create an atmospheric mix. Return JSON with:
- scene_title: a dramatic title for this scene
- description: 2 sentences of atmospheric text a Keeper could read aloud
- layers: array of {sound_name, volume (0-100)} — 3 to 5 ambient layers that should play continuously
- timeline_events: array of {time_seconds, sound_name, description} — 3 to 5 timed events that trigger at specific times
- tension_level: "low", "medium", "high", or "extreme"
- keeper_tip: one sentence advice for the Keeper running this scene`,
      response_json_schema: {
        type: "object",
        properties: {
          scene_title: { type: "string" },
          description: { type: "string" },
          layers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sound_name: { type: "string" },
                volume: { type: "number" }
              }
            }
          },
          timeline_events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time_seconds: { type: "number" },
                sound_name: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          tension_level: { type: "string" },
          keeper_tip: { type: "string" }
        }
      }
    });
    setResult(res);
    setLoading(false);
  };

  const launchScene = () => {
    if (!result) return;
    stopAll(0.3);
    setTimeout(() => {
      result.layers?.forEach(layer => {
        const soundId = SOUND_ID_MAP[layer.sound_name];
        if (soundId) play(soundId, layer.sound_name, (layer.volume || 50) / 100, true);
      });
    }, 400);
  };

  const tensionColors = {
    low: 'text-green-400 bg-green-950/40 border-green-900/30',
    medium: 'text-yellow-400 bg-yellow-950/40 border-yellow-900/30',
    high: 'text-orange-400 bg-orange-950/40 border-orange-900/30',
    extreme: 'text-red-400 bg-red-950/40 border-red-900/30',
  };

  return (
    <div className="min-h-screen bg-obsidian parchment-texture pb-24">
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brass-glow" />
          <h1 className="font-heading text-base tracking-widest text-brass-glow uppercase">AI Keeper</h1>
        </div>
        <p className="text-xs font-display italic text-parchment-dim mt-0.5">Describe your scene. The AI directs the atmosphere.</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what's happening in your game..."
            className="w-full h-24 bg-graphite border border-border rounded-lg p-3 pr-12 text-sm font-display text-parchment placeholder:text-muted-foreground resize-none focus:border-brass/40 focus:outline-none transition-colors"
          />
          <button
            onClick={() => generateScene()}
            disabled={loading || !prompt.trim()}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-lg bg-brass/20 flex items-center justify-center disabled:opacity-30 transition-all hover:bg-brass/30"
          >
            {loading ? <Loader2 size={16} className="text-brass animate-spin" /> : <Send size={16} className="text-brass" />}
          </button>
        </div>

        {/* Example prompts */}
        {!result && !loading && (
          <div>
            <p className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">Try these</p>
            <div className="space-y-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(ex); generateScene(ex); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-graphite-light/60 border border-border text-xs font-display italic text-parchment-dim hover:border-brass-dim/30 transition-all"
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 gap-3"
          >
            <div className="w-12 h-12 rounded-full border-2 border-brass/20 border-t-brass animate-spin" />
            <p className="text-xs font-display italic text-parchment-dim">The Keeper Director is analyzing your scene...</p>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Scene header */}
              <div className="rounded-lg border border-brass/30 bg-brass/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-sm tracking-wide text-brass-glow">{result.scene_title}</h2>
                    <p className="text-xs font-display italic text-parchment mt-1">{result.description}</p>
                  </div>
                  {result.tension_level && (
                    <span className={`text-[10px] font-heading tracking-wider px-2 py-1 rounded border uppercase shrink-0 ${tensionColors[result.tension_level] || ''}`}>
                      {result.tension_level}
                    </span>
                  )}
                </div>
              </div>

              {/* Layers */}
              <div className="rounded-lg border border-border bg-graphite/60 p-3">
                <p className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">Ambient Layers</p>
                <div className="space-y-1.5">
                  {result.layers?.map((layer, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-xs font-display text-parchment">{layer.sound_name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-graphite-light overflow-hidden">
                          <div className="h-full rounded-full bg-brass" style={{ width: `${layer.volume}%` }} />
                        </div>
                        <span className="text-[10px] text-parchment-dim w-8 text-right">{layer.volume}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-lg border border-border bg-graphite/60 p-3">
                <p className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">Timeline Events</p>
                <div className="space-y-2">
                  {result.timeline_events?.map((event, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] font-heading text-brass bg-brass/10 px-1.5 py-0.5 rounded shrink-0">
                        {Math.floor(event.time_seconds / 60)}:{(event.time_seconds % 60).toString().padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-xs font-display text-parchment">{event.sound_name}</p>
                        <p className="text-[10px] text-muted-foreground italic">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keeper Tip */}
              {result.keeper_tip && (
                <div className="rounded-lg border border-brass-dim/20 bg-brass/5 p-3 flex items-start gap-2">
                  <Eye size={14} className="text-brass shrink-0 mt-0.5" />
                  <p className="text-xs font-display italic text-parchment">{result.keeper_tip}</p>
                </div>
              )}

              {/* Launch Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={launchScene}
                className="w-full py-4 rounded-lg bg-brass/20 border border-brass/40 flex items-center justify-center gap-2 transition-all hover:bg-brass/30 brass-glow"
              >
                <Play size={18} className="text-brass-glow" />
                <span className="font-heading text-sm tracking-widest text-brass-glow uppercase">Launch Scene</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}