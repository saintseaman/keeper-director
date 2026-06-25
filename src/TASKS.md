# TASKS.md — поточні задачі

> Оновлюється на кожному Milestone.

---

## ✅ Milestone 1 — Фундамент
- [x] Створити `getSoundIdByName` у `lib/soundData.js` (похідна від `SOUNDS`)
- [x] Прибрати дубльовану мапу зі `SceneCard.jsx`
- [x] Прибрати дубльовану мапу з `Director.jsx`
- [x] Прибрати дубльовану мапу з `AIKeeper.jsx` (+ `AVAILABLE_SOUNDS` тепер похідна від `SOUNDS`)
- [x] Документи: ARCHITECTURE.md, DECISIONS.md, ROADMAP.md, TASKS.md

## ▶️ Milestone 2 — Локалізація контенту (наступний)
- [ ] Додати локалізовані поля назв/описів у `SOUNDS` та `PRESET_SCENES`
- [ ] Хелпер `localized(item, field, lang)`
- [ ] Підключити в SceneCard / Soundboard / Director / AIKeeper

## Беклог
- [ ] Розділення `SoundFile` / `SoundButton` (M3)
- [ ] Шар сховища / репозиторії (M3)
- [ ] Режими Gameplay / Edit (M4)
- [ ] Селекторна підписка SoundButton (M5)
- [ ] Персист гучності та обраного (M5)