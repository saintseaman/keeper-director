# TASKS.md — поточні задачі

> Оновлюється на кожному Milestone.

---

## ✅ Milestone 1 — Фундамент
- [x] Створити `getSoundIdByName` у `lib/soundData.js` (похідна від `SOUNDS`)
- [x] Прибрати дубльовану мапу зі `SceneCard.jsx`
- [x] Прибрати дубльовану мапу з `Director.jsx`
- [x] Прибрати дубльовану мапу з `AIKeeper.jsx` (+ `AVAILABLE_SOUNDS` тепер похідна від `SOUNDS`)
- [x] Документи: ARCHITECTURE.md, DECISIONS.md, ROADMAP.md, TASKS.md

## ✅ Milestone 2 — Локалізація контенту
- [x] Словник перекладів контенту `lib/contentI18n.js` (RU/UA; EN = з самого об'єкта)
- [x] Хелпери `localizedSoundTitle`, `localizedSoundTitleByName`, `localizedSceneTitle`, `localizedSceneDescription`
- [x] Підключено: SceneCard, SoundButton, MixerSlider, Director, AIKeeper (Home/Soundboard — через ці компоненти)
- [x] Англ. `title` лишився стабільним ключем (SoT і мапа не зачеплені)

## ✅ Milestone 3 — Розділення домену + шар сховища
- [x] Ізольований шар сховища `lib/storage.js` (єдина точка доступу до localStorage)
- [x] Хук `useFavorites` (синхронізація улюбленого між сторінками)
- [x] Доменна модель `lib/domain.js`: `SoundFile` / `SoundButton` (розділені відповідальності)
- [x] `Scenes` і `LangContext` переведені на шар storage (прямих localStorage більше немає)
- [x] Персист гучності майстра через шар storage (бонус із M5)

## ✅ Milestone 4 — Режими Gameplay / Edit
- [x] Глобальний стан режиму `ModeContext` (Play / Edit)
- [x] Перемикач `ModeToggle` + підказка режиму Edit
- [x] Редактор метаданих звуку (гучність, нотатки, verified) через діалог
- [x] Шар overrides у `storage` + хук `useSoundOverrides` (каталог незмінний)
- [x] Застосування базової гучності з overrides при відтворенні

## ✅ Milestone 5 — Продуктивність і надійність
- [x] Селекторна підписка `useIsSoundActive` (без перемалювання всієї дошки)
- [x] Стабільні екшени `useAudioActions`
- [x] Відновлення AudioContext із фону (`useAudioResume`)

## Беклог
- [ ] Жести: довгий тап / drag-перевпорядкування
- [ ] Редактор кнопок на базі SoundButton (M4+)
- [ ] Офлайн-кеш (service worker), редактор сцен