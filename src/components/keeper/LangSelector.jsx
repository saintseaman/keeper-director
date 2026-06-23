import React from 'react';
import { LANGUAGES } from '@/lib/i18n';
import { useLang } from '@/lib/LangContext';

export default function LangSelector() {
  const { lang, changeLang } = useLang();

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map(l => (
        <button
          key={l.code}
          onClick={() => changeLang(l.code)}
          className={`text-[10px] font-heading tracking-wider px-2 py-1 rounded transition-all
            ${lang === l.code
              ? 'bg-brass/20 text-brass-glow border border-brass/30'
              : 'text-parchment-dim hover:text-parchment'
            }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}