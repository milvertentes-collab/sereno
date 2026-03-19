'use client';

import { SharePlatform } from '@/lib/share-utils';

export default function SharePlatformModal({
  open,
  darkMode,
  title,
  onSelect,
  onClose,
}: {
  open: boolean;
  darkMode?: boolean;
  title: string;
  onSelect: (platform: SharePlatform) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const c = (l: string, d: string) => (darkMode ? d : l);
  const options: { id: SharePlatform; label: string; tone: string }[] = [
    { id: 'whatsapp', label: 'WhatsApp', tone: 'bg-[#25D366] text-white' },
    { id: 'instagram', label: 'Instagram', tone: 'bg-[linear-gradient(135deg,#F58529_0%,#DD2A7B_45%,#8134AF_72%,#515BD4_100%)] text-white' },
    { id: 'telegram', label: 'Telegram', tone: 'bg-[#229ED9] text-white' },
    { id: 'x', label: 'X', tone: 'bg-[#111111] text-white' },
    { id: 'email', label: 'E-mail', tone: 'bg-[#EA4335] text-white' },
    { id: 'copy', label: 'Copiar link', tone: darkMode ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-300' },
  ];

  return (
    <div className="fixed inset-0 z-[140] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-xs rounded-3xl p-5 border ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700 text-slate-100')}`} onClick={(e) => e.stopPropagation()}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Compartilhar</p>
        <h3 className="mt-2 text-lg font-black">{title}</h3>
        <div className="grid gap-2 mt-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`w-full py-3 rounded-2xl text-sm font-bold ${option.tone}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className={`w-full mt-3 py-3 rounded-2xl text-sm font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>
          Fechar
        </button>
      </div>
    </div>
  );
}
