// ─────────────────────────────────────────────────────────────
// useBackgroundLayer — отдельный фоновый аудио-слой сцены.
//
// Фон играет на собственном id-неймспейсе ("bg::loc::stage"), поэтому НЕ
// конфликтует с обычными кнопками-эффектами (у них id самого пэда).
// В каждый момент звучит максимум один фон. При смене локации/стадии:
//   старый фон → плавный fade out, новый → плавный fade in (кроссфейд).
//
// Громкость фона — отдельный контрол, хранится только в рантайме слоя.
// ─────────────────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from 'react';
import { audioEngine } from './audioEngine';
import { findBackground } from './backgroundSounds';

const FADE = 1.2; // секунды кроссфейда

export function useBackgroundLayer(pads, overrides) {
  const [location, setLocation] = useState(null);
  const [stage, setStage] = useState('calm');
  const [volume, setVolume] = useState(0.6);
  const [activeId, setActiveId] = useState(null); // id текущего звучащего фона
  const [activePad, setActivePad] = useState(null); // сам пэд (для подписи)
  const currentRef = useRef(null); // id играющего фона в движке

  // Стоп фон с фейдом.
  const stopBackground = useCallback(() => {
    if (currentRef.current) {
      audioEngine.stop(currentRef.current, FADE);
      currentRef.current = null;
    }
    setActiveId(null);
    setActivePad(null);
  }, []);

  // Включить фон для (location, stage) с кроссфейдом. Возвращает найденный пэд или null.
  const playBackground = useCallback((locId, stageId) => {
    const pad = findBackground(pads, overrides, locId, stageId);
    const newId = pad ? `bg::${locId}::${stageId}` : null;

    // Гасим прежний фон (если другой).
    if (currentRef.current && currentRef.current !== newId) {
      audioEngine.stop(currentRef.current, FADE);
      currentRef.current = null;
    }

    if (!pad) {
      setActiveId(null);
      setActivePad(null);
      return null;
    }

    // Запускаем новый фон лупом с фейдом-ин (playFile стартует с заданным volume,
    // движок сам делает плавный заход через setTargetAtTime по громкости элемента).
    if (currentRef.current !== newId) {
      audioEngine.playFile(newId, pad.url, pad.title, volume, true);
      currentRef.current = newId;
    } else {
      audioEngine.setVolume(newId, volume);
    }
    setActiveId(newId);
    setActivePad(pad);
    return pad;
  }, [pads, overrides, volume]);

  // Выбор локации → авто-старт Calm.
  const selectLocation = useCallback((locId) => {
    setLocation(locId);
    setStage('calm');
    playBackground(locId, 'calm');
  }, [playBackground]);

  // Переключение стадии при текущей локации (кроссфейд).
  const selectStage = useCallback((stageId) => {
    setStage(stageId);
    if (location) playBackground(location, stageId);
  }, [location, playBackground]);

  // Громкость фона — применяем к активному звуку сразу.
  const changeVolume = useCallback((v) => {
    setVolume(v);
    if (currentRef.current) audioEngine.setVolume(currentRef.current, v);
  }, []);

  // Остановить фон при размонтировании страницы.
  useEffect(() => () => {
    if (currentRef.current) audioEngine.stop(currentRef.current, 0.3);
  }, []);

  return {
    location, stage, volume, activeId, activePad,
    selectLocation, selectStage, changeVolume,
    stopBackground, playBackground,
  };
}