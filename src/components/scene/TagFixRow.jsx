import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Check, Play, Pause, Trash2, Pencil, X, Repeat, Zap } from 'lucide-react';
import { getIcon } from '@/lib/iconMap';
import { SCENE_AXES } from '@/lib/sceneAxes';
import { useIsSoundActive } from '@/lib/useAudio';
import { audioEngine } from '@/lib/audioEngine';
import PadAxesEditor from './PadAxesEditor';
import SoundProbe from './SoundProbe';
import Waveform from './Waveform';

// Строка звука в панели «Теги»: показывает, по каким осям нет тегов,
// и по тапу разворачивает редактор для проставки прямо здесь.
// В режиме выделения (selectable) слева — чекбокс, а тап по строке переключает выбор.
function TagFixRow({ pad, override, missing, onChangeAxes, selectable, selected, onToggleSelect, onRemove, onRename, onToggleLoop, broken }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pad.title);
  const [playErr, setPlayErr] = useState('');
  const Icon = getIcon(pad.icon);
  // Текущий режим: override.isLoopable важнее значения с пэда. По умолчанию — луп.
  const isLoop = typeof override?.isLoopable === 'boolean' ? override.isLoopable : (pad.is_loopable ?? true);
  const missingLabels = missing.map((id) => SCENE_AXES.find((a) => a.id === id)?.label).filter(Boolean);
  const done = missing.length === 0;

  // Превью-прослушивание: тап — play, тап ещё раз (или на играющем) — pause.
  const isActive = useIsSoundActive(pad.id);
  const togglePreview = (e) => {
    e.stopPropagation();
    if (audioEngine.isPlaying(pad.id)) {
      audioEngine.stop(pad.id, 0);
    } else if (pad.url) {
      setPlayErr('');
      const onErr = (msg) => setPlayErr(msg || '');
      if (isLoop) audioEngine.playFile(pad.id, pad.url, pad.title, 0.6, true, onErr);
      else audioEngine.triggerFile(pad.id, pad.url, pad.title, 0.6, onErr);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (!window.confirm(`Удалить звук «${pad.title}»?`)) return;
    if (audioEngine.isPlaying(pad.id)) audioEngine.stop(pad.id, 0);
    onRemove?.(pad.id);
  };

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(pad.title);
    setEditing(true);
  };

  const saveEdit = () => {
    const title = draft.trim();
    if (title && title !== pad.title) onRename?.(pad.id, title);
    setEditing(false);
  };

  return (
    <div className={`rounded-xl border bg-white/[0.03] overflow-hidden transition-colors ${
      broken ? 'border-rose-500/60 bg-rose-500/[0.04]' : selectable && selected ? 'border-orange-400/60' : 'border-white/10'
    }`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => (selectable ? onToggleSelect(pad.id) : setOpen((v) => !v))}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
      >
        {selectable && (
          <span className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selected ? 'bg-orange-500/80 border-orange-400' : 'border-white/20'}`}>
            {selected && <Check size={13} className="text-white" />}
          </span>
        )}
        {pad.url && (
          <span
            role="button"
            tabIndex={0}
            onClick={togglePreview}
            onPointerDown={(e) => e.stopPropagation()}
            className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-orange-500/25 border-orange-400/60 text-orange-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-orange-200 hover:border-orange-400/40'
            }`}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
          </span>
        )}
        {onToggleLoop && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onToggleLoop(pad.id, !isLoop); }}
            onPointerDown={(e) => e.stopPropagation()}
            title={isLoop ? 'Зацикленный — нажмите, чтобы сделать разовым' : 'Разовый — нажмите, чтобы зациклить'}
            className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
              isLoop
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-white/5 border-white/10 text-white/45 hover:text-rose-200 hover:border-rose-400/40'
            }`}
          >
            {isLoop ? <Repeat size={15} /> : <Zap size={15} />}
          </span>
        )}
        <span className="shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon size={17} className={done ? 'text-emerald-300' : 'text-orange-300'} />
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="min-w-0 flex-1 bg-white/5 border border-orange-400/40 rounded-md px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-orange-400/70"
              />
              <span
                role="button"
                tabIndex={0}
                onClick={saveEdit}
                title="Сохранить"
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-emerald-300 hover:bg-emerald-500/10"
              >
                <Check size={14} />
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={() => setEditing(false)}
                title="Отмена"
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:bg-white/10"
              >
                <X size={14} />
              </span>
            </div>
          ) : (
            <div className="text-sm text-white/85 truncate">{pad.title}</div>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            {done ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-300/80">
                <CheckCircle2 size={11} /> размечено
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-orange-300/80">
                <AlertCircle size={11} /> нет: {missingLabels.join(', ')}
              </span>
            )}
          </div>
          {pad.url && !editing && <SoundProbe url={pad.url} playing={isActive} broken={broken} />}
          {playErr && (
            <p className="mt-1 text-[10px] text-rose-300/80 break-all leading-tight">▶ {playErr}</p>
          )}
          {pad.url && !editing && <Waveform url={pad.url} />}
        </div>
        {!selectable && !editing && (
          <span className="shrink-0 flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              onClick={startEdit}
              onPointerDown={(e) => e.stopPropagation()}
              title="Переименовать"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-orange-300 hover:bg-orange-500/10 transition-colors"
            >
              <Pencil size={14} />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={handleRemove}
              onPointerDown={(e) => e.stopPropagation()}
              title="Удалить звук"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={15} />
            </span>
            {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
          </span>
        )}
      </div>

      {!selectable && open && (
        <div className="px-3 pb-3 pt-1 border-t border-white/10">
          <PadAxesEditor
            pad={pad}
            override={override}
            onChange={(axes) => onChangeAxes(pad.id, axes)}
          />
        </div>
      )}
    </div>
  );
}

// Мемоизация: при правке одной строки или превью остальные 158 не
// перерендериваются. Сравниваем только поля, влияющие на вид строки.
export default React.memo(TagFixRow, (prev, next) =>
  prev.pad === next.pad &&
  prev.override === next.override &&
  prev.missing.length === next.missing.length &&
  prev.missing.join(',') === next.missing.join(',') &&
  prev.selectable === next.selectable &&
  prev.selected === next.selected &&
  prev.broken === next.broken &&
  prev.onChangeAxes === next.onChangeAxes &&
  prev.onToggleSelect === next.onToggleSelect &&
  prev.onRemove === next.onRemove &&
  prev.onRename === next.onRename &&
  prev.onToggleLoop === next.onToggleLoop
);