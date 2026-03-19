'use client';

import type { ReactNode } from 'react';

interface SectionHeroCardProps {
  darkMode?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  children?: ReactNode;
}

export default function SectionHeroCard({
  darkMode,
  eyebrow,
  title,
  description,
  icon,
  children,
}: SectionHeroCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2.35rem] border px-6 py-6 shadow-sm ${
        darkMode
          ? 'bg-[radial-gradient(circle_at_top,rgba(45,87,162,0.2)_0%,transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(10,15,24,0.98)_100%)] border-white/8 text-slate-100'
          : 'bg-[radial-gradient(circle_at_top,#dbeafe_0%,transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-900'
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute right-0 top-3 text-[5.8rem] leading-none ${
          darkMode ? 'opacity-[0.08]' : 'opacity-[0.1]'
        }`}
      >
        {icon}
      </div>
      <div className="relative z-10 max-w-[80%]">
        <p
          className={`text-[11px] font-black uppercase tracking-[0.22em] ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {eyebrow}
        </p>
        <h2 className="mt-3 text-[2rem] font-[1000] leading-none tracking-tight">{title}</h2>
        <p
          className={`mt-3 text-sm font-medium leading-relaxed ${
            darkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  );
}
