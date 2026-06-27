import React, { useRef, useState } from 'react';
import { Infinity as InfinityIcon, Zap } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { getCategoryImage } from '@/lib/categoryImages';
import { useIsSoundActive, useAudioActions } from '@/lib/useAudio';
import { usePadFiles } from '@/lib/usePadFiles';
import { useSoundOverrides } from '@/lib/useSoundOverrides';
import { audioEngine } from '@/lib/audioEngine';
import { useLang } from '@/lib/LangContext';
import { localizedSoundTitle } from '@/lib/contentI18n';
import { recordRecentPad } from '@/lib/usePadLibrary';
import PadEditDialog from './PadEditDialog';

const LONG_PRESS_MS = 500;

// Один пэд драм-пада в стиле Pioneer DDJ.
// Короткий тап — воспроизведение; зажатие (long-press) — редактирование (загрузка MP3).
export default function Pad({ sound, index, onRemoveCustom }) {
  const isActive = useIsSoundActive(sound?.id);
  const { toggle, trigger, stop } = useAudioActions();
  const { getFile } = usePadFiles();
  const { getOverride } = useSoundOverrides();
  const { lang } = useLang();
  const [editOpen, setEditOpen] = useState(false);
  const timerRef = useRef(null);
  const longFiredRef = useRef(false);
  const startPtRef = useRef(null);
  const movedRef = useRef(false);

  const MOVE_TOLERANCE = 12; // px — больше этого считаем жестом-свайпом, а не тапом

  const isCustom = !!sound?.url; // імпортований з Google Диска

  if (!sound) {
    return <div className="aspect-square rounded-xl bg-[#0c0c0c] border border-white/5" />;
  }

  // Накладываем пользовательские настройки пэда поверх каталога.
  const ov = getOverride(sound.id);
  // Пользовательский override → его, иначе локализованная (рус) подпись из каталога,
  // а для Drive-пэдов (своего перевода нет) — их собственный title.
  const title = ov.title ?? (isCustom ? sound.title : localizedSoundTitle(sound.id, lang, sound.title));
  const volume = typeof ov.volume === 'number' ? ov.volume : 0.6;
  const Icon = getIcon(ov.icon ?? sound.icon);
  // Фоновая картинка по категории звука (встроенные и импортированные с Диска).
  const bgImage = getCategoryImage(sound.category);
  const isLoopable = typeof ov.isLoopable === 'boolean' ? ov.isLoopable : !!sound.isLoopable;
  // Власний пэд з Google Диска несе свій url прямо в sound; інакше — MP3,
  // прив'язаний до вбудованого пэда через usePadFiles.
  const fileUrl = sound.url || getFile(sound.id)?.url || null;
  const isOneShot = !isLoopable;

  const fire = () => {
    // Тап по уже играющему пэду — всегда стоп (для любого типа).
    if (audioEngine.isPlaying(sound.id)) {
      stop(sound.id, 0);
      return;
    }
    recordRecentPad(sound.id); // запоминаем запуск для «Недавних»
    if (fileUrl) {
      // У пэда свой MP3 (загруженный или импортированный из Drive).
      if (isOneShot) {
        audioEngine.triggerFile(sound.id, fileUrl, title, volume);
      } else {
        audioEngine.playFile(sound.id, fileUrl, title, volume, true);
      }
      return;
    }
    if (isOneShot) trigger(sound.id, title);
    else toggle(sound.id, title, volume, true);
  };

  const startPress = (e) => {
    longFiredRef.current = false;
    movedRef.current = false;
    startPtRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      longFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      // Long-press открывает полный редактор пэда (для встроенных и Drive).
      setEditOpen(true);
    }, LONG_PRESS_MS);
  };

  // Движение пальца сверх порога — это свайп страницы, а не тап/long-press.
  const onMove = (e) => {
    if (!startPtRef.current || movedRef.current) return;
    const dx = e.clientX - startPtRef.current.x;
    const dy = e.clientY - startPtRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) {
      movedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!longFiredRef.current && !movedRef.current) fire(); // короткий тап без свайпа
    startPtRef.current = null;
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    startPtRef.current = null;
  };

  return (
    <>
      <button
        onPointerDown={startPress}
        onPointerMove={onMove}
        onPointerUp={endPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className={`group relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-1.5 select-none touch-none overflow-hidden transition-all duration-100 active:scale-[0.96]
          ${isActive
            ? 'border-orange-400/70 shadow-[0_0_24px_-2px_rgba(249,115,22,0.55)]'
            : 'border-white/10 hover:border-white/25'}
        `}
      >
        <span className={`absolute top-2 left-2.5 z-20 text-[9px] font-mono tracking-widest ${isActive ? 'text-orange-200/80' : 'text-white/25'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Бейдж типа: ∞ — зацикленный (атмосфера), ⚡ — разовый (one-shot) */}
        <span
          className={`absolute top-1.5 right-1.5 z-20 flex items-center justify-center w-5 h-5 rounded-md backdrop-blur-sm ring-1
            ${isActive
              ? 'bg-orange-400/30 ring-orange-300/50 text-orange-100'
              : isOneShot
                ? 'bg-rose-500/15 ring-rose-400/30 text-rose-300/80'
                : 'bg-cyan-500/15 ring-cyan-400/30 text-cyan-300/80'}`}
          title={isOneShot ? 'Разовый' : 'Зацикленный'}
        >
          {isOneShot ? <Zap size={11} strokeWidth={2.2} /> : <InfinityIcon size={12} strokeWidth={2.2} />}
        </span>

        {/* Метка пользовательского MP3 */}
        {fileUrl && (
          <span className="absolute bottom-2 left-2.5 text-[8px] font-mono tracking-widest text-orange-300/70 z-10">MP3</span>
        )}

        {/* ИИ-арт фон на весь пэд */}
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        {/* Затемнение для читаемости текста */}
        <span className={`absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/45 to-black/30 ${isActive ? 'mix-blend-normal' : ''}`} />
        {isActive && (
          <>
            <span className="absolute inset-0 pointer-events-none bg-orange-500/25" />
            {/* Пульсирующая рамка — сразу видно, что пэд звучит */}
            <span className="absolute inset-0 pointer-events-none rounded-xl ring-2 ring-orange-400/70 animate-pulse" />
            {/* «Эквалайзер» в углу — живой индикатор воспроизведения */}
            <span className="absolute bottom-2 right-2.5 z-20 flex items-end gap-[2px] h-3" aria-hidden="true">
              <span className="w-[3px] bg-orange-300 rounded-full animate-[eqbar_0.7s_ease-in-out_infinite] [animation-delay:0s] h-2 origin-bottom" />
              <span className="w-[3px] bg-orange-300 rounded-full animate-[eqbar_0.7s_ease-in-out_infinite] [animation-delay:0.15s] h-3 origin-bottom" />
              <span className="w-[3px] bg-orange-300 rounded-full animate-[eqbar_0.7s_ease-in-out_infinite] [animation-delay:0.3s] h-1.5 origin-bottom" />
            </span>
          </>
        )}

        {/* Название звука — на тёмной плашке для читаемости на любом фоне */}
        <span className={`relative z-10 mx-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm ring-1 ring-white/10 text-[13px] sm:text-sm font-semibold leading-tight text-center tracking-wide line-clamp-2 max-w-[calc(100%-0.75rem)] [text-shadow:0_1px_3px_rgba(0,0,0,0.95)] ${isActive ? 'text-orange-50' : 'text-white'}`}>
          {title}
        </span>
      </button>

      <PadEditDialog
        sound={sound}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onRemove={isCustom ? () => {
          if (audioEngine.isPlaying(sound.id)) stop(sound.id);
          onRemoveCustom?.(sound.id);
          setEditOpen(false);
        } : undefined}
      />
    </>
  );
}