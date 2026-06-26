// ─────────────────────────────────────────────────────────────
// useScaryFolderScan — синхронізація з папкою «Scary_sounds» на Google Диску.
// При запуску застосунку (раз за сесію) автоматично сканує папку, порівнює
// файли з уже імпортованими пэдами (id = custom_<driveFileId>) і віддає
// список НОВИХ файлів + дію імпорту. Також дає ручну ресинхронізацію (resync),
// яка пересканує Диск і одразу додає всі нові звуки.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCustomPads } from './useCustomPads';

const SCAN_FLAG = 'keeper:scaryScanned';

export function useScaryFolderScan() {
  const { pads, addPads } = useCustomPads();
  const padsRef = useRef(pads);
  padsRef.current = pads;

  const [folderId, setFolderId] = useState(null);
  const [newFiles, setNewFiles] = useState([]); // [{ id, name }] — яких ще немає
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total } під час імпорту
  const [lastSync, setLastSync] = useState(null); // { added, message } після ресинку

  // Один скан: повертає folderId і список нових файлів (без імпорту).
  const scan = useCallback(async () => {
    const res = await base44.functions.invoke('scanScaryFolder', {});
    const { folderId: fid, files } = res.data || {};
    const existing = new Set(padsRef.current.map((p) => p.id));
    const fresh = (files || []).filter((f) => !existing.has(`custom_${f.id}`));
    return { fid: fid || null, fresh };
  }, []);

  // Авто-скан при запуску (раз за сесію).
  useEffect(() => {
    if (sessionStorage.getItem(SCAN_FLAG)) return;
    let cancelled = false;
    (async () => {
      try {
        const { fid, fresh } = await scan();
        if (cancelled) return;
        sessionStorage.setItem(SCAN_FLAG, '1');
        if (fid && fresh.length) {
          setFolderId(fid);
          setNewFiles(fresh);
        }
      } catch {
        sessionStorage.setItem(SCAN_FLAG, '1');
      }
    })();
    return () => { cancelled = true; };
  }, [scan]);

  // Імпорт списку нових файлів ПОРЦІЯМИ по 5 — імпорт усієї папки одним
  // викликом упирається в таймаут (>180с на ~50 файлів). Кожна порція
  // додає свої звуки одразу, тож прогрес не губиться. Повертає к-сть доданих.
  const importFiles = useCallback(async (files) => {
    const BATCH = 5;
    let added = 0;
    setProgress({ done: 0, total: files.length });
    for (let i = 0; i < files.length; i += BATCH) {
      const chunk = files.slice(i, i + BATCH);
      const res = await base44.functions.invoke('importDriveBatch', { files: chunk });
      const sounds = res.data?.sounds || [];
      const existing = new Set(padsRef.current.map((p) => p.id));
      const toAdd = sounds.filter((s) => !existing.has(s.id));
      if (toAdd.length) {
        addPads(toAdd);
        added += toAdd.length;
      }
      setProgress({ done: Math.min(i + BATCH, files.length), total: files.length });
    }
    return added;
  }, [addPads]);

  // Кнопка плашки: імпортувати знайдені нові файли.
  const importNew = useCallback(async () => {
    if (importing || newFiles.length === 0) return;
    setImporting(true);
    try {
      await importFiles(newFiles);
      setNewFiles([]);
    } finally {
      setImporting(false);
    }
  }, [importing, newFiles, importFiles]);

  // Ручна синхронізація: пересканувати Диск і одразу додати всі нові звуки.
  const resync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setLastSync(null);
    try {
      const { fid, fresh } = await scan();
      if (!fid) {
        setLastSync({ added: 0, message: 'Папка «Scary_sounds» не найдена на Google Диске' });
        return;
      }
      setFolderId(fid);
      if (fresh.length === 0) {
        setNewFiles([]);
        setLastSync({ added: 0, message: 'Новых звуков нет — всё уже добавлено' });
        return;
      }
      const added = await importFiles(fresh);
      setNewFiles([]);
      setLastSync({ added, message: added ? `Добавлено новых звуков: ${added}` : 'Новых звуков нет' });
    } catch {
      setLastSync({ added: 0, message: 'Не удалось синхронизироваться с Google Диском' });
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  }, [syncing, scan, importFiles]);

  const dismiss = useCallback(() => setNewFiles([]), []);

  return { newFiles, importing, importNew, dismiss, resync, syncing, progress, lastSync };
}