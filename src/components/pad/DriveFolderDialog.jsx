import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Folder, Search, RefreshCw, FolderDown, ChevronRight, Home, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ROOT = { id: 'root', name: 'Мой диск' };

// Діалог навігації по папках Google Диска. Можна заходити всередину папок
// (хлібні крихти), шукати по всьому диску та імпортувати обрану папку.
export default function DriveFolderDialog({ open, onClose, onImported }) {
  const [folders, setFolders] = useState([]);
  const [path, setPath] = useState([ROOT]); // стек хлібних крихт
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false); // режим пошуку по диску
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const current = path[path.length - 1];

  // Список папок усередині поточної папки.
  const loadFolder = async (parentId) => {
    setLoading(true);
    setError(null);
    setSearching(false);
    try {
      const res = await base44.functions.invoke('listDriveFolders', { parentId });
      setFolders(res.data?.folders || []);
    } catch {
      setError('Не удалось загрузить список папок с Google Диска');
    } finally {
      setLoading(false);
    }
  };

  // Пошук по всьому диску.
  const search = async (q) => {
    if (!q.trim()) { loadFolder(current.id); return; }
    setLoading(true);
    setError(null);
    setSearching(true);
    try {
      const res = await base44.functions.invoke('listDriveFolders', { q });
      setFolders(res.data?.folders || []);
    } catch {
      setError('Не удалось выполнить поиск');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setStatus(null);
      setQuery('');
      setPath([ROOT]);
      loadFolder('root');
    }
  }, [open]);

  // Зайти всередину папки.
  const enter = (folder) => {
    setQuery('');
    setPath((p) => [...p, folder]);
    loadFolder(folder.id);
  };

  // Перейти за хлібною крихтою.
  const goTo = (index) => {
    const next = path.slice(0, index + 1);
    setQuery('');
    setPath(next);
    loadFolder(next[next.length - 1].id);
  };

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
      <DialogContent className="bg-[#141414] border-white/10 text-white max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono tracking-wider text-sm text-white/80 uppercase">
            Импорт папки · Google Диск
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col min-h-0 gap-3 pt-2">
          {/* Поиск по всему диску */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search(query)}
                placeholder="Поиск по всему диску…"
                className="pl-8 pr-7 bg-white/5 border-white/10 text-xs text-white placeholder:text-white/30"
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); loadFolder(current.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => (searching ? search(query) : loadFolder(current.id))}
              disabled={loading || !!importingId}
              className="text-white/60 hover:text-orange-400 p-2"
              title="Обновить"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Хлебные крошки (только в режиме навигации) */}
          {!searching && (
            <div className="flex items-center gap-1 text-[11px] text-white/40 flex-wrap">
              {path.map((p, i) => (
                <React.Fragment key={p.id}>
                  {i > 0 && <ChevronRight size={12} className="text-white/25 shrink-0" />}
                  <button
                    onClick={() => goTo(i)}
                    disabled={i === path.length - 1}
                    className={`flex items-center gap-1 hover:text-orange-300 transition-colors ${i === path.length - 1 ? 'text-orange-300 font-medium' : ''}`}
                  >
                    {i === 0 && <Home size={11} />}
                    <span className="truncate max-w-[110px]">{p.name}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
          {searching && (
            <p className="text-[11px] text-white/40">Результаты поиска по диску</p>
          )}

          {status && (
            <div className="flex items-center gap-2 text-xs text-orange-300">
              <Loader2 size={14} className="animate-spin" /> {status}
            </div>
          )}
          {error && <p className="text-xs text-rose-400">{error}</p>}

          {/* Импортировать текущую папку (в режиме навигации, не в корне) */}
          {!searching && path.length > 1 && (
            <button
              onClick={() => handleImport(current)}
              disabled={!!importingId}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600/20 border border-orange-500/40 p-2.5 text-xs text-orange-200 hover:bg-orange-600/30 disabled:opacity-40 transition-colors"
            >
              {importingId === current.id
                ? <Loader2 size={15} className="animate-spin" />
                : <FolderDown size={15} />}
              Импортировать эту папку
            </button>
          )}

          {/* Список вложенных папок */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 -mr-1 pr-1">
            {loading && folders.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-white/40">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : folders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-white/30">
                {searching ? 'Папки не найдены' : 'Здесь нет вложенных папок'}
              </div>
            ) : (
              folders.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <button
                    onClick={() => enter(f)}
                    disabled={!!importingId}
                    className="flex-1 flex items-center gap-3 p-2.5 disabled:opacity-40 text-left min-w-0"
                    title="Открыть папку"
                  >
                    <Folder size={16} className="text-orange-400 shrink-0" />
                    <span className="flex-1 text-xs text-white/80 truncate">{f.name}</span>
                  </button>
                  <button
                    onClick={() => handleImport(f)}
                    disabled={!!importingId}
                    className="p-2.5 text-white/40 hover:text-orange-300 disabled:opacity-40 shrink-0"
                    title="Импортировать эту папку"
                  >
                    {importingId === f.id
                      ? <Loader2 size={16} className="animate-spin text-orange-400" />
                      : <FolderDown size={16} />}
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