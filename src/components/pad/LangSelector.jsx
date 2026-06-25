import React from 'react';
import { LANGUAGES } from '@/lib/i18n';
import { useLang } from '@/lib/LangContext';

export default function LangSelector() {
  const { lang, changeLang } = useLang();

  return (
    <div className="flex items-center gap-1.5">
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          className={`text-[11px] font-mono tracking-wider px-3 py-1.5 rounded-lg transition-all
            ${lang === l.code
              ? 'bg-orange-500/20 text-orange-200 border border-orange-400/50'
              : 'bg-white/5 text-white/45 border border-white/10 hover:text-white/70'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}