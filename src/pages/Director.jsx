import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Timer, StopCircle, Play } from 'lucide-react';
import { useAudio } from '@/lib/useAudio';
import { SOUNDS, PRESET_SCENES, getSoundIdByName } from '@/lib/soundData';
import { getIcon } from '@/lib/iconMap';
import SoundButton from '@/components/keeper/SoundButton';
import ActiveMixer from '@/components/keeper/ActiveMixer';
import PanicButton from '@/components/keeper/PanicButton';
import QuickTrigger from '@/components/keeper/QuickTrigger';
import BottomNav from '@/components/keeper/BottomNav';
import { useLang } from '@/lib/LangContext';

export default function Director() {
  const { activeSounds, play, stopAll, trigger } = useAudio();
  const { t } = useLang();
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeScene, setActiveScene] = useState(null);
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => setSessionTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    if (!activeScene || !sessionActive) return;
    const events = activeScene.timeline_events || [];
    const upcoming = events.find(e => e.time_seconds > sessionTime);
    setNextEvent(upcoming || null);

    const current = events.find(e => e.time_seconds === sessionTime);
    if (current) {
      const soundId = getSoundIdByName(current.sound_name);
      if (soundId) trigger(soundId, current.sound_name);
    }
  }, [sessionTime, activeScene, sessionActive]);

  const launchScene = (scene) => {
    stopAll(0.3);
    setActiveScene(scene);
    setSessionTime(0);
    setSessionActive(true);
    setTimeout(() => {
      scene.layers?.forEach(layer => {
        const soundId = getSoundIdByName(layer.sound_name);
        if (soundId) play(soundId, layer.sound_name, (layer.volume || 50) / 100, true);
      });
    }, 400);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const atmosphereSounds = SOUNDS.filter(s => s.category === 'atmosphere').slice(0, 9);
  const eventSounds = SOUNDS.filter(s => s.category === 'events').slice(0, 6);

  return (
    <div className="min-h-screen bg-obsidian parchment-texture pb-24 session-mode">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-brass-glow" />
            <h1 className="font-heading text-base tracking-widest text-brass-glow uppercase">{t('director')}</h1>
          </div>
          <div className="flex items-center gap-3">
            {sessionActive && (
              <div className="flex items-center gap-1.5 bg-brass/10 border border-brass/20 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 sound-active" />
                <Timer size={12} className="text-brass" />
                <span className="text-xs font-heading tracking-wider text-brass">{formatTime(sessionTime)}</span>
              </div>
            )}
            <button
              onClick={() => {
                setSessionActive(!sessionActive);
                if (sessionActive) { stopAll(1); setActiveScene(null); setSessionTime(0); }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-heading tracking-wider border transition-all
                ${sessionActive
                  ? 'bg-red-950/50 border-red-900/30 text-red-400'
                  : 'bg-brass/10 border-brass/20 text-brass'
                }
              `}
            >
              {sessionActive ? t('endSession') : t('startSession')}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Active Scene Banner */}
        {activeScene && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-brass/30 bg-brass/5 p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-heading tracking-[0.2em] text-brass uppercase">{t('activeScene')}</p>
                <p className="text-sm font-heading text-brass-glow mt-0.5">{activeScene.title}</p>
              </div>
              {nextEvent && (
                <div className="text-right">
                  <p className="text-[10px] text-parchment-dim">{t('nextEvent')} {formatTime(nextEvent.time_seconds)}</p>
                  <p className="text-[10px] font-display italic text-brass">{nextEvent.description}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PANIC */}
        <PanicButton />

        {/* Quick Triggers */}
        <QuickTrigger />

        {/* Active Mixer */}
        <ActiveMixer />

        {/* Scene Launcher */}
        <div>
          <h2 className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">{t('launchScene')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_SCENES.slice(0, 6).map(scene => {
              const Icon = getIcon(scene.icon);
              const isThis = activeScene?.id === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => launchScene(scene)}
                  className={`
                    rounded-lg border p-3 text-left transition-all
                    ${isThis
                      ? 'bg-brass/15 border-brass/30'
                      : 'bg-graphite/80 border-border hover:border-brass-dim/30'
                    }
                  `}
                >
                  <Icon size={16} className={isThis ? 'text-brass-glow' : 'text-parchment-dim'} />
                  <p className={`text-xs font-heading tracking-wide mt-1 ${isThis ? 'text-brass-glow' : 'text-parchment'}`}>
                    {scene.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Atmosphere */}
        <div>
          <h2 className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">{t('atmosphere')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {atmosphereSounds.map(sound => (
              <SoundButton key={sound.id} sound={sound} />
            ))}
          </div>
        </div>

        {/* Events */}
        <div>
          <h2 className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">{t('events')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {eventSounds.map(sound => (
              <SoundButton key={sound.id} sound={sound} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}