import React from 'react';

// Один блок-преимущество на лендинге.
export default function FeatureBlock({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-brass/15 bg-graphite/40 backdrop-blur-sm p-5 hover:border-brass/30 transition-colors">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brass/10 border border-brass/25 text-brass-glow shrink-0">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <h3 className="text-sm font-heading tracking-wide text-parchment">{title}</h3>
      </div>
      <p className="text-[13px] leading-relaxed text-parchment-dim font-body">{children}</p>
    </div>
  );
}