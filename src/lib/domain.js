// ─────────────────────────────────────────────────────────────
// ДОМЕННА МОДЕЛЬ (Milestone 3)
// Формалізує розділення відповідальностей згідно з Конституцією:
//
//   SoundFile   — сам звук (аудіо-актив + метадані). Незмінний каталог.
//   SoundButton — кнопка на дошці (UI-сутність), що ПОСИЛАЄТЬСЯ на SoundFile.
//
// Зараз SOUNDS виконує роль каталогу SoundFile. Ці фабрики дають єдиний,
// типізований спосіб створювати доменні об'єкти, не змінюючи дані в soundData.
// SoundButton ≠ SoundFile — відповідальності не змішуються.
// ─────────────────────────────────────────────────────────────
import { SOUNDS } from './soundData';

// Створити доменний SoundFile із запису каталогу.
export function makeSoundFile(raw) {
  return {
    id: raw.id,
    title: raw.title,            // англ. назва = стабільний ключ (ADR-004)
    category: raw.category,
    tags: raw.tags || [],
    icon: raw.icon,
    isLoopable: !!raw.isLoopable,
    color: raw.color,
    baseVolume: raw.baseVolume ?? 0.5,
  };
}

// Каталог усіх SoundFile (похідний від SOUNDS — єдине джерело правди).
export const SOUND_FILES = SOUNDS.map(makeSoundFile);

export function getSoundFile(id) {
  return SOUND_FILES.find(s => s.id === id) || null;
}

// Створити SoundButton — UI-кнопку, що посилається на SoundFile за id.
// Не містить аудіо-даних: лише посилання + параметри відображення.
let buttonSeq = 0;
export function makeSoundButton(soundFileId, { position = null, size = 'normal' } = {}) {
  return {
    id: `btn_${++buttonSeq}`,
    soundFileId,                 // ПОСИЛАННЯ на SoundFile, не копія
    position,
    size,
  };
}

// Розв'язати SoundButton → його SoundFile.
export function resolveButtonSound(button) {
  return getSoundFile(button.soundFileId);
}