import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, FolderUp, FileAudio, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const AUDIO_RE = /\.(mp3|wav|ogg|oga|m4a|aac|flac|webm)$/i;

// Імʼя файлу без розширення → заголовок пэда.
function titleFromName(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || name;
}

// Діалог прямого завантаження папки з аудіофайлами на сервер додатку.
// Користувач обирає папку (або кілька файлів) з пристрою — кожен файл
// заливається в сховище додатку через UploadFile і стає пэдом.
export default function FolderUploadDialog({ open, onClose, onImported }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [finished, setFinished] = useState(false);

  const reset = () => {
    setUploading(false);
    setDone(0);
    setTotal(0);
    setError(null);
    setFinished(false);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => AUDIO_RE.test(f.name));
    if (files.length === 0) {
      setError('В выбранной папке нет аудиофайлов');
      return;
    }
    setError(null);
    setFinished(false);
    setUploading(true);
    setTotal(files.length);
    setDone(0);

    const sounds = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        sounds.push({
          id: `upload_${Date.now()}_${i}`,
          title: titleFromName(file.name),
          url: file_url,
          category: '',
          icon: 'Music',
        });
        setDone(i + 1);
      } catch {
        // Пропускаємо файл, що не залився, і йдемо далі.
      }
    }

    setUploading(false);
    if (sounds.length === 0) {
      setError('Не удалось загрузить файлы');
      return;
    }
    onImported(sounds);
    setFinished(true);
  };

  const pick = () => inputRef.current?.click();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
            Импорт папки
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* Скрытый input для выбора папки целиком */}
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm,*/*"
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          />

          <p className="text-xs text-white/45 leading-relaxed">
            Выберите папку со звуками на устройстве — все аудиофайлы загрузятся на сервер и станут пэдами.
          </p>

          {!uploading && !finished && (
            <button
              onClick={pick}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-orange-400/40 bg-orange-500/5 py-8 text-orange-200 hover:bg-orange-500/10 transition-colors"
            >
              <FolderUp size={28} />
              <span className="text-xs font-mono tracking-wider">Выбрать папку</span>
            </button>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-orange-300">
                <Loader2 size={16} className="animate-spin" />
                Загрузка {done} / {total}…
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: total ? `${Math.round((done / total) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          )}

          {finished && !uploading && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm text-white/80">Загружено {done} звуков</p>
              <button
                onClick={() => { reset(); onClose(); }}
                className="rounded-lg px-4 py-2 text-[11px] font-mono tracking-wider bg-white/5 border border-white/10 text-white/70 hover:border-orange-400/40 hover:text-orange-300 transition-colors"
              >
                ГОТОВО
              </button>
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <FileAudio size={13} /> {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}