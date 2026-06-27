import React, { useRef, useState } from 'react';
import { Upload, Trash2, Music, Loader2, Play, HardDrive, RotateCcw, Repeat, Zap, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import { usePadFiles } from '@/lib/usePadFiles';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { usePadLibrary } from '@/lib/usePadLibrary';
import { audioEngine } from '@/lib/audioEngine';
import DriveImportDialog from './DriveImportDialog';
import IconPicker from './IconPicker';
import PadAxesEditor from '@/components/scene/PadAxesEditor';

export default function PadEditDialog({ sound, open, onClose, onRemove }) {
  const { getFile, setFile, removeFile } = usePadFiles();
  const { getOverride, setOverride, resetOverride } = useSoundOverrides();
  const { isFavorite, toggleFavorite } = usePadLibrary();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [driveOpen, setDriveOpen] = useState(false);

  if (!sound) return null;
  const current = getFile(sound.id);
  const ov = getOverride(sound.id);

  // Эффективные значения: правка пользователя → значение из каталога.
  const title = ov.title ?? sound.title;
  const volume = typeof ov.volume === 'number' ? ov.volume : 0.6;
  const isLoop = typeof ov.isLoopable === 'boolean' ? ov.isLoopable : !!sound.isLoopable;
  const icon = ov.icon ?? sound.icon;
  const hasOverride = Object.keys(ov).length > 0;

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.includes('audio') && !file.name.toLowerCase().endsWith('.mp3')) {
      setError('Выберите аудиофайл MP3');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFile(sound.id, { url: file_url, name: file.name });
    } catch (err) {
      setError('Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = () => {
    const url = current?.url || sound.url;
    if (url) audioEngine.triggerFile(`preview_${sound.id}`, url);
    else audioEngine.trigger(sound.id, title);
  };

  const Section = ({ label, children }) => (
    <div className="space-y-2">
      <p className="text-[10px] font-mono tracking-widest text-white/35 uppercase">{label}</p>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-[#141414] border-white/10 text-white grid-cols-[minmax(0,1fr)] w-[calc(100vw-1.5rem)] max-w-sm max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <DialogHeader className="min-w-0">
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase flex items-center justify-between gap-2 pr-6 min-w-0">
            <span className="truncate min-w-0">Пэд · {title}</span>
            <span className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => toggleFavorite(sound.id)}
                className={`transition-colors ${isFavorite(sound.id) ? 'text-orange-400' : 'text-white/40 hover:text-orange-400'}`}
                title="В избранное"
              >
                <Star size={16} className={isFavorite(sound.id) ? 'fill-orange-400' : ''} />
              </button>
              <button onClick={handlePreview} className="text-white/50 hover:text-orange-400 transition-colors" title="Прослушать">
                <Play size={16} />
              </button>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1 min-w-0">
          {/* Название */}
          <Section label="Название">
            <Input
              value={title}
              onChange={(e) => setOverride(sound.id, { title: e.target.value })}
              placeholder={sound.title}
              className="bg-white/5 border-white/10 text-white text-sm h-9"
            />
          </Section>

          {/* Громкость */}
          <Section label={`Громкость · ${Math.round(volume * 100)}%`}>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={([v]) => {
                setOverride(sound.id, { volume: v });
                if (audioEngine.isPlaying(sound.id)) audioEngine.setVolume(sound.id, v);
              }}
            />
          </Section>

          {/* Режим воспроизведения */}
          <Section label="Режим">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOverride(sound.id, { isLoopable: true })}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-colors
                  ${isLoop ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'}`}
              >
                <Repeat size={14} /> Зацикленный
              </button>
              <button
                onClick={() => setOverride(sound.id, { isLoopable: false })}
                className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-colors
                  ${!isLoop ? 'bg-rose-500/20 border-rose-400/60 text-rose-200' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25'}`}
              >
                <Zap size={14} /> Разовый
              </button>
            </div>
          </Section>

          {/* Иконка */}
          <Section label="Иконка">
            <IconPicker value={icon} onChange={(name) => setOverride(sound.id, { icon: name })} />
          </Section>

          {/* Теги сцены (оси) */}
          <Section label="Теги сцены">
            <PadAxesEditor
              pad={sound}
              override={ov}
              onChange={(axes) => setOverride(sound.id, { axes })}
            />
          </Section>

          {/* Свой звук (MP3 / Drive) */}
          <Section label="Свой звук">
            {current ? (
              <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
                <Music size={18} className="text-orange-400 shrink-0" />
                <span className="flex-1 text-xs text-white/80 truncate">{current.name}</span>
                <button onClick={() => audioEngine.triggerFile(`preview_${sound.id}`, current.url)} className="text-white/60 hover:text-orange-400">
                  <Play size={16} />
                </button>
                <button onClick={() => removeFile(sound.id)} className="text-white/60 hover:text-rose-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 p-3 text-center text-xs text-white/30">
                Играет встроенный звук
              </div>
            )}

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <input ref={inputRef} type="file" accept="audio/*,.mp3" className="hidden" onChange={handleFile} />
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handlePick}
                disabled={uploading}
                className="bg-orange-600/20 border border-orange-500/40 text-orange-200 hover:bg-orange-600/30"
              >
                {uploading
                  ? <><Loader2 size={15} className="animate-spin mr-1.5" /> …</>
                  : <><Upload size={15} className="mr-1.5" /> {current ? 'Заменить' : 'Загрузить'}</>}
              </Button>
              <Button
                onClick={() => setDriveOpen(true)}
                disabled={uploading}
                variant="outline"
                className="bg-white/5 border-white/15 text-white/80 hover:bg-white/10"
              >
                <HardDrive size={15} className="mr-1.5" /> Drive
              </Button>
            </div>
          </Section>

          {/* Сброс */}
          {hasOverride && (
            <button
              onClick={() => resetOverride(sound.id)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors pt-1"
            >
              <RotateCcw size={13} /> Сбросить настройки
            </button>
          )}

          {/* Удаление кастомного пэда (из Drive) */}
          {onRemove && (
            <button
              onClick={() => { if (window.confirm(`Удалить пэд «${title}»?`)) onRemove(); }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-600/10 py-2 text-xs text-rose-300 hover:bg-rose-600/20 transition-colors"
            >
              <Trash2 size={13} /> Удалить пэд
            </button>
          )}
        </div>

        <DriveImportDialog
          open={driveOpen}
          onClose={() => setDriveOpen(false)}
          onImport={({ url, name }) => setFile(sound.id, { url, name })}
        />
      </DialogContent>
    </Dialog>
  );
}