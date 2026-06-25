// ─────────────────────────────────────────────────────────────
// РЕЖИМИ ДОДАТКУ (Milestone 4)
//
//   'play' — Gameplay: лише гра, жодних кнопок редагування. Стан за замовч.
//   'edit' — Підготовка: можна редагувати метадані звуку (опис, гучність, verified).
//
// Глобальний стан, як LangContext — щоб будь-який екран реагував на режим.
// Режим НЕ персиститься: при кожному запуску стартуємо в Gameplay (безпечно
// для живої сесії — нічого не відкривається випадково).
// ─────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState } from 'react';

const ModeContext = createContext();

export function ModeProvider({ children }) {
  const [mode, setMode] = useState('play');

  const isEdit = mode === 'edit';
  const toggleMode = () => setMode(m => (m === 'play' ? 'edit' : 'play'));

  return (
    <ModeContext.Provider value={{ mode, isEdit, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}