import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Folder, Search, RefreshCw, FolderDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Діалог вибору папки Google Диска. Після вибору імпортує всі аудіофайли,
// аналізує їх назви та повертає готові пэди через onImported(sounds).
export default function DriveFolderDialog({ open, onClose, onImported }) {
  const [folders, setFolders] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const load = async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('listDriveFolders', { q });
      setFolders(res.data?.folders || []);
    } catch {
      setError('Не удалось загрузить список папок с Google Диска');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) { setStatus(null); load(''); }
  }, [open]);

  const handleImport = async (folder) => {
    setImportingId(folder.id);
    setError(null);
    setStatus(`Импорт «${folder.name}»… анализирую звуки`);
    try {
      const res = await base44.functions.invoke('importDriveFolder', { folderId: folder.id });
      const sounds = res.data?.sounds || [];
      if (sounds.length === 0) {
        setError('В этой папке нет аудиофайлов');
        setStatus(null);
      } else {
        onImported(sounds);
        onClose();
      }
    } catch {
      setError('Не удалось импортировать папку');
      setStatus(null);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
            Импорт папки · Google Диск
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <p className="text-[11px] text-white/40 leading-relaxed">
            Выберите папку — я загружу все звуки, разберу их по названиям и
            автоматически создам кнопки-пэды.
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load(query)}
                placeholder="Поиск папки…"
                className="pl-8 bg-white/5 border-white/10 text-xs text-white placeholder:text-white/30"
              />
            </div>
            <button
              onClick={() => load(query)}
              disabled={loading || !!importingId}
              className="text-white/60 hover:text-orange-400 p-2"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {status && (
            <div className="flex items-center gap-2 text-xs text-orange-300">
              <Loader2 size={14} className="animate-spin" /> {status}
            </div>
          )}
          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {loading && folders.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-white/40">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : folders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-white/30">
                Папки не найдены
              </div>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleImport(f)}
                  disabled={!!importingId}
                  className="w-full flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-2.5 hover:border-orange-400/40 disabled:opacity-40 transition-colors text-left"
                >
                  <Folder size={16} className="text-orange-400 shrink-0" />
                  <span className="flex-1 text-xs text-white/80 truncate">{f.name}</span>
                  {importingId === f.id
                    ? <Loader2 size={16} className="animate-spin text-orange-400" />
                    : <FolderDown size={16} className="text-white/40" />}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}