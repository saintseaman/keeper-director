import React, { createContext, useContext, useState } from 'react';
import { t as translate } from './i18n';
import { storage } from './storage';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => storage.getLang());

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