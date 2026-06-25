import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { localizedSoundTitle } from '@/lib/contentI18n';
import { useLang } from '@/lib/LangContext';

// Редактор метаданих звуку (режим Edit, M4).
// Правки зберігаються окремим шаром overrides — каталог SOUNDS незмінний.
export default function SoundEditDialog({ sound, open, onClose }) {
  const { t, lang } = useLang();
  const { getOverride, setOverride, resetOverride } = useSoundOverrides();

  const [baseVolume, setBaseVolume] = useState(0.5);
  const [notes, setNotes] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!sound) return;
    const o = getOverride(sound.id);
    setBaseVolume(typeof o.baseVolume === 'number' ? o.baseVolume : 0.5);
    setNotes(o.notes || '');
    setVerified(!!o.verified);
  }, [sound, open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sound) return null;

  const handleSave = () => {
    setOverride(sound.id, { baseVolume, notes: notes.trim(), verified });
    onClose();
  };

  const handleReset = () => {
    resetOverride(sound.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-graphite border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-brass-glow tracking-wide text-base">
            {t('editSound')}
          </DialogTitle>
          <p className="text-xs font-display italic text-parchment-dim">
            {localizedSoundTitle(sound.id, lang, sound.title)}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Base volume */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-heading tracking-wide text-parchment uppercase">{t('baseVolume')}</label>
              <span className="text-[11px] font-mono text-brass">{Math.round(baseVolume * 100)}%</span>
            </div>
            <Slider
              value={[Math.round(baseVolume * 100)]}
              onValueChange={([v]) => setBaseVolume(v / 100)}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-brass [&_[role=slider]]:border-brass-dim [&_.range]:bg-brass-dim"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-heading tracking-wide text-parchment uppercase block mb-2">{t('notes')}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="bg-obsidian border-border text-sm min-h-[70px] resize-none"
            />
          </div>

          {/* Verified */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-heading tracking-wide text-parchment uppercase">
              <CheckCircle2 size={14} className={verified ? 'text-brass-glow' : 'text-parchment-dim'} />
              {t('verified')}
            </span>
            <Switch checked={verified} onCheckedChange={setVerified} />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-parchment-dim hover:text-red-400 gap-1.5 px-2"
          >
            <RotateCcw size={13} />
            <span className="text-[11px]">{t('resetToDefault')}</span>
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-parchment-dim">
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} className="bg-brass-dim hover:bg-brass text-obsidian font-heading tracking-wide">
              {t('save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}