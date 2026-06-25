import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Music, Search, Download, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Діалог вибору аудіофайлу з Google Диску. onImport({ url, name }) викликається
// після успішного перекладання файлу у сховище застосунку.
export default function DriveImportDialog({ open, onClose, onImport }) {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('listDriveAudio', { q });
      setFiles(res.data?.files || []);
    } catch {
      setError('Не удалось загрузить список с Google Диска');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load('');
  }, [open]);

  const handleImport = async (f) => {
    setImportingId(f.id);
    setError(null);
    try {
      const res = await base44.functions.invoke('importDriveAudio', { fileId: f.id, name: f.name });
      onImport({ url: res.data.file_url, name: res.data.name });
      onClose();
    } catch {
      setError('Не удалось импортировать файл');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
            Google Диск · аудио
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load(query)}
                placeholder="Поиск по названию…"
                className="pl-8 bg-white/5 border-white/10 text-xs text-white placeholder:text-white/30"
              />
            </div>
            <button
              onClick={() => load(query)}
              disabled={loading}
              className="text-white/60 hover:text-orange-400 p-2"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-white/40">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-white/30">
                Аудиофайлы не найдены
              </div>
            ) : (
              files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-2.5"
                >
                  <Music size={16} className="text-orange-400 shrink-0" />
                  <span className="flex-1 text-xs text-white/80 truncate">{f.name}</span>
                  <button
                    onClick={() => handleImport(f)}
                    disabled={!!importingId}
                    className="text-white/60 hover:text-orange-400 disabled:opacity-40"
                  >
                    {importingId === f.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Download size={16} />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}