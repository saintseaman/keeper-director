import React from 'react';
import { Loader2, FolderSearch, Download, X } from 'lucide-react';

// Ненавязчивая плашка: нашли новые файлы в папке «scary sounds» на Google Диске.
// Импорт добавит их в список «без тегов» этой вкладки.
export default function ScaryScanBanner({ count, importing, onImport, onDismiss }) {
  if (count === 0) return null;

  return (
    <div className="rounded-xl border border-orange-400/40 bg-orange-500/10 p-3 flex items-start gap-3">
      <FolderSearch size={18} className="text-orange-300 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-orange-100 font-medium">
          В папке «scary sounds» {count} нов{count % 10 === 1 && count % 100 !== 11 ? 'ый файл' : 'ых файлов'}
        </p>
        <p className="text-[11px] text-orange-200/60 mt-0.5">
          Добавить их в список «без тегов»?
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={onImport}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500/25 border border-orange-400/50 px-3 py-1.5 text-[11px] font-mono tracking-wider text-orange-100 hover:bg-orange-500/35 disabled:opacity-50 transition-colors"
          >
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {importing ? 'ДОБАВЛЯЮ…' : 'ДОБАВИТЬ ВСЕ'}
          </button>
          <button
            onClick={onDismiss}
            disabled={importing}
            className="flex items-center gap-1 text-[11px] text-orange-200/50 hover:text-orange-200/80 disabled:opacity-40 transition-colors"
          >
            <X size={13} /> Позже
          </button>
        </div>
      </div>
    </div>
  );
}