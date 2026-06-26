// ─────────────────────────────────────────────────────────────
// useScaryFolderScan — авто-сканування папки «scary sounds» на Google Диску
// при запуску застосунку. Порівнює файли папки з уже імпортованими пэдами
// (id = custom_<driveFileId>) і віддає список НОВИХ файлів + дію імпорту.
//
// Сканування виконується один раз за сесію (sessionStorage-прапор), щоб
// не смикати Диск на кожній навігації між вкладками.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCustomPads } from './useCustomPads';

const SCAN_FLAG = 'keeper:scaryScanned';

export function useScaryFolderScan() {
  const { pads, addPads } = useCustomPads();
  const [folderId, setFolderId] = useState(null);
  const [newFiles, setNewFiles] = useState([]); // [{ id, name }] — яких ще немає
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SCAN_FLAG)) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await base44.functions.invoke('scanScaryFolder', {});
        if (cancelled) return;
        sessionStorage.setItem(SCAN_FLAG, '1');
        const { folderId: fid, files } = res.data || {};
        if (!fid || !files?.length) return;
        const existing = new Set(pads.map((p) => p.id));
        const fresh = files.filter((f) => !existing.has(`custom_${f.id}`));
        setFolderId(fid);
        setNewFiles(fresh);
      } catch {
        sessionStorage.setItem(SCAN_FLAG, '1'); // не повторюємо при помилці підключення
      }
    })();

    return () => { cancelled = true; };
    // намеренно один раз за монтаж — pads на момент скану беремо з замикання
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Імпортувати знайдені нові файли. Переиспользуем importDriveFolder:
  // он скачивает + классифицирует папку и возвращает пэды с id=custom_<fileId>,
  // а addPads дедуплицирует — поэтому добавятся только новые.
  const importNew = useCallback(async () => {
    if (!folderId || importing) return;
    setImporting(true);
    try {
      const res = await base44.functions.invoke('importDriveFolder', { folderId });
      const sounds = res.data?.sounds || [];
      const existing = new Set(pads.map((p) => p.id));
      const toAdd = sounds.filter((s) => !existing.has(s.id));
      if (toAdd.length) addPads(toAdd);
      setNewFiles([]);
    } finally {
      setImporting(false);
    }
  }, [folderId, importing, pads, addPads]);

  const dismiss = useCallback(() => setNewFiles([]), []);

  return { newFiles, importing, importNew, dismiss };
}