import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Volume2, Square, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { audioEngine } from '@/lib/audioEngine';
import { useAudio } from '@/lib/useAudio';
import { HAUNTED_MANSION } from '@/lib/demoScene';
import DemoPad from '@/components/demo/DemoPad';

// Публичная демо-сцена "Haunted Mansion" — работает БЕЗ аккаунта.
// Цель: пользователь сразу жмёт кнопки и слышит магию продукта.
export default function Demo() {
  const { activeSounds, masterVolume, setMasterVolume, stopAll } = useAudio();
  const [started, setStarted] = useState(false);

  const activeCount = Object.values(activeSounds).filter((v) => v.isPlaying !== false).length;

  // Останавливаем всё при уходе со страницы (нет фонового зависшего звука).
  useEffect(() => () => audioEngine.stopAll(0.2), []);

  return (
    <div className="fixed inset-0 flex flex-col bg-obsidian parchment-texture session-mode">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b border-brass/15">
        <Link to="/" className="flex items-center gap-1.5 text-brass-dim hover:text-brass transition-colors">
          <ArrowLeft size={18} />
          <span className="text-[11px] font-heading tracking-widest uppercase hidden sm:inline">Назад</span>
        </Link>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-[0.3em] text-brass-dim uppercase flex items-center gap-1.5">
            <Sparkles size={11} className="text-brass" /> Demo Scene
          </span>
          <span className="text-sm font-display text-parchment leading-none mt-0.5">Haunted Mansion</span>
        </div>

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

      {/* Master volume */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-brass/10">
        <Volume2 size={15} className="text-brass-dim shrink-0" />
        <Slider
          value={[Math.round(masterVolume * 100)]}
          onValueChange={([v]) => setMasterVolume(v / 100)}
          max={100}
          step={1}
          className="[&_[role=slider]]:bg-brass [&_[role=slider]]:border-brass-glow [&_.range]:bg-brass/60"
        />
        <span className="text-[10px] font-mono text-brass-dim tabular-nums w-8 text-right">
          {Math.round(masterVolume * 100)}
        </span>
      </div>

      {/* Hint */}
      <div className="px-5 pt-3">
        <p className="text-[11px] text-parchment-dim text-center font-body italic">
          {HAUNTED_MANSION.subtitle}
        </p>
        {!started && activeCount === 0 && (
          <p className="text-[10px] text-brass-dim/70 text-center mt-1 font-mono tracking-wide">
            Нажмите «Rain Loop», потом «Thunder» — слои складываются вживую
          </p>
        )}
      </div>

      {/* Pad grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div
          className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
          onClickCapture={() => setStarted(true)}
        >
          {HAUNTED_MANSION.sounds.map((s) => (
            <DemoPad key={s.id} sound={s} onCut={() => stopAll(0.25)} />
          ))}
        </div>
      </div>

      {/* CTA footer */}
      <div className="shrink-0 border-t border-brass/15 bg-black/60 backdrop-blur-xl px-5 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-brass/15 border border-brass/40 py-3 text-sm font-heading tracking-wide text-brass-glow hover:bg-brass/25 transition-colors"
        >
          Создать свою сцену — войти
        </Link>
      </div>
    </div>
  );
}