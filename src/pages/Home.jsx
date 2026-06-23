import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Volume2, StopCircle } from 'lucide-react';
import { useAudio } from '@/lib/useAudio';
import { PRESET_SCENES } from '@/lib/soundData';
import ActiveMixer from '@/components/keeper/ActiveMixer';
import QuickTrigger from '@/components/keeper/QuickTrigger';
import PanicButton from '@/components/keeper/PanicButton';
import SceneCard from '@/components/keeper/SceneCard';
import BottomNav from '@/components/keeper/BottomNav';
import LangSelector from '@/components/keeper/LangSelector';
import { useLang } from '@/lib/LangContext';

export default function Home() {
  const { activeSounds, stopAll } = useAudio();
  const { t } = useLang();
  const activeCount = Object.keys(activeSounds).length;
  const [selectedScene, setSelectedScene] = useState(null);

  const quickScenes = PRESET_SCENES.slice(0, 4);

  return (
    <div className="min-h-screen bg-obsidian parchment-texture pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg tracking-widest text-brass-glow uppercase">{t('appName')}</h1>
            <p className="text-xs font-display italic text-parchment-dim mt-0.5">{t('appSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LangSelector />
            {activeCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 bg-brass/10 border border-brass/20 rounded-full px-3 py-1.5"
              >
                <div className="w-2 h-2 rounded-full bg-brass-glow sound-active" />
                <span className="text-[10px] font-heading tracking-wide text-brass">{activeCount} {t('activeLabel')}</span>
              </motion.div>
            )}
            {activeCount > 0 && (
              <button
                onClick={() => stopAll(0.8)}
                className="w-9 h-9 rounded-full bg-red-950/50 border border-red-900/30 flex items-center justify-center"
              >
                <StopCircle size={16} className="text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Panic Button */}
        <PanicButton />

        {/* Quick Triggers */}
        <div>
          <h2 className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">{t('quickTriggers')}</h2>
          <QuickTrigger />
        </div>

        {/* Active Mixer */}
        <ActiveMixer />

        {/* Quick Scenes */}
        <div>
          <h2 className="text-[10px] font-heading tracking-[0.2em] text-parchment-dim uppercase mb-2">{t('scenes')}</h2>
          <div className="space-y-2">
            {quickScenes.map(scene => (
              <SceneCard key={scene.id} scene={scene} onSelect={setSelectedScene} />
            ))}
          </div>
        </div>

        {/* Occult divider */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brass-dim/30 to-transparent" />
          <Eye size={12} className="text-brass-dim/40" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brass-dim/30 to-transparent" />
        </div>

        <p className="text-center text-[10px] font-display italic text-muted-foreground">
          {t('quote')}
        </p>
      </div>

      <BottomNav />
    </div>
  );
}