import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Clock, ShieldCheck, ShieldAlert, Loader2, Volume2 } from 'lucide-react';

// Диагностическая проба звука для панели «Теги» — РАБОТАЕТ ПО ЗАПРОСУ.
//
// Важное отличие от прошлой версии: проба больше НЕ грузит файл автоматически
// при рендере. Раньше каждая из 159 строк сразу создавала скрытый <audio> и
// тянула метаданные WAV — 159 параллельных загрузок забивали сеть и UI лагал.
//
// Теперь по тапу на «Проверить» открывается лёгкий <audio>, который сообщает:
//  • длительность в секундах,
//  • реально ли файл доступен (✓) или битый/недоступен (✗).
// Так пользователь точечно видит, какие звуки не работают, без тормозов.
//
// playing — внешний флаг (строка сейчас проигрывается через TagFixRow);
//           показываем индикатор сигнала, когда звук идёт.
// broken  — результат массовой проверки: true/false если уже проверяли всё,
//           undefined если массовая проверка не запускалась.
function SoundProbe({ url, playing, broken }) {
  const audioRef = useRef(null);
  // Если массовая проверка уже дала вердикт — сразу отражаем его.
  const initial = broken === true ? 'error' : broken === false ? 'ok' : 'idle';
  const [state, setState] = useState(initial); // idle | checking | ok | error
  const [duration, setDuration] = useState(null);

  // Синхронизируем стейт с результатом массовой проверки, когда он приходит.
  useEffect(() => {
    if (broken === true) setState('error');
    else if (broken === false) setState((s) => (s === 'idle' ? 'ok' : s));
  }, [broken]);

  const check = useCallback(
    (e) => {
      e?.stopPropagation();
      if (!url || state === 'checking') return;
      setState('checking');
      setDuration(null);

      const el = new Audio();
      el.preload = 'metadata';
      el.src = url;
      audioRef.current = el;

      const onMeta = () => {
        if (isFinite(el.duration) && el.duration > 0) setDuration(el.duration);
        setState('ok');
      };
      const onErr = () => setState('error');
      el.addEventListener('loadedmetadata', onMeta, { once: true });
      el.addEventListener('error', onErr, { once: true });
      // Таймаут: если за 8 с ни метаданных, ни ошибки — считаем недоступным.
      const timer = setTimeout(() => { if (audioRef.current === el) setState('error'); }, 8000);
      el.addEventListener('loadedmetadata', () => clearTimeout(timer), { once: true });
      el.addEventListener('error', () => clearTimeout(timer), { once: true });
      el.load();
    },
    [url, state]
  );

  // Чистим скрытый <audio> при размонтировании.
  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) { try { el.pause(); el.src = ''; } catch (err) {} }
    };
  }, []);

  return (
    <div className="flex items-center gap-2 mt-1.5" onClick={(e) => e.stopPropagation()}>
      {state === 'idle' && (
        <button
          onClick={check}
          className="flex items-center gap-1 text-[11px] text-white/45 hover:text-orange-300 rounded-md px-1.5 py-0.5 border border-white/10 hover:border-orange-400/40 transition-colors"
          title="Проверить, что файл доступен и играет"
        >
          <ShieldCheck size={11} /> Проверить
        </button>
      )}

      {state === 'checking' && (
        <span className="flex items-center gap-1 text-[11px] text-white/50">
          <Loader2 size={11} className="animate-spin" /> проверка…
        </span>
      )}

      {state === 'ok' && (
        <span className="flex items-center gap-1 text-[11px] text-emerald-300/90" title="Файл доступен">
          <ShieldCheck size={11} /> работает
          {duration != null && (
            <span className="flex items-center gap-1 text-white/45 tabular-nums">
              <Clock size={10} /> {duration.toFixed(1)} с
            </span>
          )}
        </span>
      )}

      {state === 'error' && (
        <button
          onClick={check}
          className="flex items-center gap-1 text-[11px] text-rose-300/90 hover:text-rose-200 transition-colors"
          title="Файл недоступен — нажмите, чтобы проверить ещё раз"
        >
          <ShieldAlert size={11} /> не загружается
        </button>
      )}

      {/* Индикатор реального сигнала во время превью-воспроизведения */}
      {playing && (
        <span className="flex items-center gap-0.5 text-orange-300" title="Сигнал идёт">
          <Volume2 size={12} />
          <span className="flex items-end gap-[2px] h-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-[3px] bg-orange-400 rounded-sm"
                style={{ animation: `eqbar 0.7s ease-in-out ${i * 0.15}s infinite`, height: '100%', transformOrigin: 'bottom' }}
              />
            ))}
          </span>
        </span>
      )}
    </div>
  );
}

export default React.memo(SoundProbe);