import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, FileAudio } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Простой диалог загрузки одного аудиофайла с устройства на сервер.
// Заменяет прежний импорт одиночного файла с Google Диска.
export default function SingleFileUploadDialog({ open, onClose, onImport }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.includes('audio') && !/\.(mp3|wav|ogg|oga|m4a|aac|flac|webm)$/i.test(file.name)) {
      setError('Выберите аудиофайл');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onImport({ url: file_url, name: file.name.replace(/\.[^.]+$/, '') });
      onClose();
    } catch {
      setError('Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setError(null); onClose(); } }}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
            Загрузить звук
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm,*/*" className="hidden" onChange={handleFile} />
          <button
            onClick={pick}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-orange-400/40 bg-orange-500/5 py-8 text-orange-200 hover:bg-orange-500/10 disabled:opacity-50 transition-colors"
          >
            {uploading
              ? <><Loader2 size={26} className="animate-spin" /><span className="text-xs font-mono">Загрузка…</span></>
              : <><FileAudio size={26} /><span className="text-xs font-mono tracking-wider">Выбрать файл</span></>}
          </button>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}