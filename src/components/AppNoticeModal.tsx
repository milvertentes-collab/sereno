'use client';

import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  message: ReactNode;
  onClose: () => void;
  darkMode?: boolean;
  icon?: string;
  eyebrow?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function AppNoticeModal({
  open,
  title,
  message,
  onClose,
  darkMode = false,
  icon = '✨',
  eyebrow = 'Aviso',
  primaryLabel = 'Entendi',
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  if (!open) return null;

  const panelClass = darkMode
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const iconClass = darkMode
    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
    : 'bg-indigo-50 text-indigo-700 border border-indigo-100';
  const eyebrowClass = darkMode ? 'text-indigo-300' : 'text-indigo-700';
  const bodyClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const secondaryClass = darkMode
    ? 'bg-slate-800 text-slate-200 border border-slate-700'
    : 'bg-slate-50 text-slate-700 border border-slate-200';

  const handlePrimary = () => {
    if (onPrimary) {
      onPrimary();
      return;
    }
    onClose();
  };

  const handleSecondary = () => {
    if (onSecondary) {
      onSecondary();
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Fechar aviso"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className={`relative z-10 w-full max-w-md rounded-[2rem] border p-5 shadow-2xl ${panelClass}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${iconClass}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${eyebrowClass}`}>{eyebrow}</p>
            <h3 className="mt-2 text-xl font-black leading-tight">{title}</h3>
            <div className={`mt-2 text-sm leading-relaxed ${bodyClass}`}>{message}</div>
          </div>
        </div>

        <div className={`mt-5 grid gap-2 ${secondaryLabel ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {secondaryLabel ? (
            <button
              onClick={handleSecondary}
              className={`rounded-2xl py-3 text-sm font-bold ${secondaryClass}`}
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            onClick={handlePrimary}
            className="rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
