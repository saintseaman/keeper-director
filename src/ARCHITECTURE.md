# ARCHITECTURE.md — AI Keeper Director

> Найкращий мобільний директор атмосфери для ведучих настільних ігор (Game Masters).
> Платформа: веб-застосунок (React + Vite + Tailwind) на Base44, публікація на iOS/Android через веб-оболонку (Варіант А).

---

## 1. Принципи

- **UI ніколи не містить бізнес-логіки.** Бізнес-логіка не залежить від UI.
- **Аудіо-рушій ізольований.** Сховище ізольоване. Доменні моделі незалежні.
- **Усе замінне.** Кожен шар можна переписати без переписування решти.
- **Сцена важливіша за звук.** Думаємо «директор», а не «плейлист».

## 2. Шари

```
┌─────────────────────────────────────────────┐
│ UI (pages/, components/)                      │  React-компоненти, лише відображення + колбеки
├─────────────────────────────────────────────┤
│ Hooks (lib/useAudio, useLang, useFavorites)   │  Міст між UI та сервісами
├─────────────────────────────────────────────┤
│ Services (audioEngine, SceneService*)         │  Бізнес-логіка, ізольована від React
├─────────────────────────────────────────────┤
│ Domain (lib/soundData — моделі + SoT)         │  Чисті дані та функції
├─────────────────────────────────────────────┤
│ Storage (lib/storage.js — єдина точка)        │  хмара Base44 (UserPrefs); міграція з localStorage
└─────────────────────────────────────────────┘
```

> Процес розробки: **Scrum, спринт = 1 робочий день** — див. `SCRUM.md` (Product/Sprint Backlog, Review+Retro, DoD).

## 3. Єдине джерело правди (Single Source of Truth)

- **`lib/soundData.js`** — єдиний реєстр звуків (`SOUNDS`) і сцен (`PRESET_SCENES`).
- **`getSoundIdByName(name)`** — побудована автоматично з `SOUNDS`. Мапа «назва → id» більше **не дублюється** (раніше була в 3 файлах: SceneCard, Director, AIKeeper).
  Новий звук додається **лише** в `SOUNDS`.

## 4. Аудіо-рушій

- `lib/audioEngine.js` — singleton, побудований на Web Audio API.
- Процедурні звуки генеруються «з нуля» (фільтрований шум, осцилятори, LFO) — offline-first.
- Аудіо-файли (MP3): `playFile` (луп) і `triggerFile` (one-shot) через `<audio>` → masterGain. One-shot глушиться жорстко.
- React не звертається до рушія напряму — лише через хуки `useAudio` / `useAudioActions` / `useIsSoundActive`.

## 4.1 Дошка (drum-pad) та імпорт із Google Диска

- UI: `PadDeck` (сторінки-свайп) → `PadPage` (сітка 3×3) → `Pad` (один пэд). Редактор — `PadEditDialog`.
- Кастомні пэди й MP3 імпортуються з Google Диска через backend-функції (`importDriveAudio`, `importDriveFolder`, `listDriveAudio`, `listDriveFolders`) і зберігаються в `UserPrefs`.

## 5. Локалізація (i18n)

- `lib/i18n.js` — словники EN / RU / UA (інтерфейс).
- `lib/LangContext.jsx` — контекст + хук `useLang()`.
- **Заплановано:** локалізація *контенту* (назви/описи сцен і звуків) — Milestone 2.

## 6. Доменна модель (цільова — впроваджується поетапно)

| Сутність | Відповідальність |
|----------|------------------|
| `SoundFile` | Сам звук: id, назви (локалізовані), опис, категорія, теги, loop, baseVolume, fadeIn, fadeOut, verified |
| `SoundButton` | Кнопка на дошці: id, soundFileId (посилання), позиція, розмір |
| `Scene` | Сцена: id, назви, опис, layers[], timeline[] |
| `SceneLayer` | Шар сцени: soundFileId, volume, fade |
| `SceneEvent` | Подія таймлайну: timeSeconds, soundFileId, опис |
| `Category` / `Tag` | Класифікація |

**Правило:** `SoundButton` ≠ `SoundFile`. Відповідальності не змішуються.