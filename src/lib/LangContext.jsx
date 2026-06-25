import React, { createContext, useContext, useState, useEffect } from 'react';
import { t as translate } from './i18n';
import { storage } from './storage';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => storage.getLang());

  useEffect(() => {
    // Застосувати мову після завантаження хмарних налаштувань.
    const unsub = storage.subscribe(() => setLang(storage.getLang()));
    return unsub;
  }, []);

  const changeLang = (code) => {
    setLang(code);
    storage.setLang(code);
  };

  const t = (key) => translate(key, lang);

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}