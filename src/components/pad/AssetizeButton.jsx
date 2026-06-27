import React, { useState } from 'react';
import { Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

// Перекачивает звуки из Google Drive в постоянное хранилище приложения, чтобы
// они играли мгновенно без стрима. Гоняет бэкенд-функцию пакетами, пока всё не
// будет переведено, показывая прогресс.
export default function AssetizeButton() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setFinished(false);
    let total = 0;
    try {
      // Гоняем пакетами, пока remaining не дойдёт до 0.
      for (let i = 0; i < 200; i++) {
        const { data } = await base44.functions.invoke('assetizeSounds', { limit: 6 });
        if (data.error) throw new Error(data.error);
        total += data.converted || 0;
        setDone(total);
        setRemaining(data.remaining);
        if (!data.remaining || data.remaining <= 0 || data.processed === 0) break;
      }
      setFinished(true);
    } catch (e) {
      setError(e.message || 'Ошибка конвертации');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/60">
        <Zap size={15} />
        <span className="text-[11px] font-mono tracking-widest uppercase">Ускорить звуки</span>
      </div>
      <p className="text-xs text-white/40 leading-relaxed">
        Перенесёт звуки из Google Диска в хранилище приложения — играют мгновенно, без ожидания и тишины.
      </p>

      <Button
        onClick={run}
        disabled={running}
        className="w-full bg-orange-600/20 border border-orange-500/40 text-orange-200 hover:bg-orange-600/30"
      >
        {running ? (
          <><Loader2 size={15} className="animate-spin mr-2" /> Перенос… {done}</>
        ) : finished ? (
          <><CheckCircle2 size={15} className="mr-2" /> Готово · {done}</>
        ) : (
          <><Zap size={15} className="mr-2" /> Ускорить звуки</>
        )}
      </Button>

      {running && remaining != null && (
        <p className="text-[11px] font-mono text-white/40 text-center">
          Осталось: {remaining}
        </p>
      )}
      {finished && !running && (
        <p className="text-[11px] font-mono text-emerald-400/80 text-center">
          Переведено {done} звуков в быстрое хранилище.
        </p>
      )}
      {error && (
        <p className="text-[11px] font-mono text-rose-400 text-center">{error}</p>
      )}
    </div>
  );
}