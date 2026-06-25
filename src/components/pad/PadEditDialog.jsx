import React, { useRef, useState } from 'react';
import { Upload, Trash2, Music, Loader2, Play, HardDrive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { usePadFiles } from '@/lib/usePadFiles';
import { audioEngine } from '@/lib/audioEngine';
import DriveImportDialog from './DriveImportDialog';

export default function PadEditDialog({ sound, open, onClose }) {
  const { getFile, setFile, removeFile } = usePadFiles();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [driveOpen, setDriveOpen] = useState(false);

  if (!sound) return null;
  const current = getFile(sound.id);

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
    if (current) audioEngine.triggerFile(`preview_${sound.id}`, current.url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
            Пэд · {sound.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-white/50 leading-relaxed">
            Загрузите свой MP3, чтобы пэд воспроизводил его вместо встроенного звука.
          </p>

          {current ? (
            <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
              <Music size={18} className="text-orange-400 shrink-0" />
              <span className="flex-1 text-xs text-white/80 truncate">{current.name}</span>
              <button onClick={handlePreview} className="text-white/60 hover:text-orange-400">
                <Play size={16} />
              </button>
              <button onClick={() => removeFile(sound.id)} className="text-white/60 hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-white/30">
              Файл не загружен — играет встроенный звук
            </div>
          )}

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <input ref={inputRef} type="file" accept="audio/*,.mp3" className="hidden" onChange={handleFile} />
          <Button
            onClick={handlePick}
            disabled={uploading}
            className="w-full bg-orange-600/20 border border-orange-500/40 text-orange-200 hover:bg-orange-600/30"
          >
            {uploading
              ? <><Loader2 size={15} className="animate-spin mr-2" /> Загрузка…</>
              : <><Upload size={15} className="mr-2" /> {current ? 'Заменить MP3' : 'Загрузить MP3'}</>}
          </Button>

          <Button
            onClick={() => setDriveOpen(true)}
            disabled={uploading}
            variant="outline"
            className="w-full bg-white/5 border-white/15 text-white/80 hover:bg-white/10"
          >
            <HardDrive size={15} className="mr-2" /> Импорт с Google Диска
          </Button>
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