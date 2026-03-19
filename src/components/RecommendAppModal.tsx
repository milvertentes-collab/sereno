'use client';

import { useMemo, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';

const contextOptions = [
  {
    id: 'apoio',
    label: 'Apoio emocional',
    base: 'Pensei em você e quis te indicar o Sereno. Ele pode ajudar a organizar emoções e criar pequenos espaços de cuidado.',
    accent: 'from-rose-400/20 via-fuchsia-400/15 to-violet-400/20',
    active: 'bg-[linear-gradient(135deg,#ec4899_0%,#8b5cf6_100%)] border-fuchsia-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#fff1f7_0%,#f7f0ff_100%)] border-fuchsia-100 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(236,72,153,0.12)_0%,rgba(139,92,246,0.12)_100%)] border-fuchsia-500/20 text-slate-200',
  },
  {
    id: 'autocuidado',
    label: 'Autocuidado',
    base: 'Estou usando o Sereno para cuidar melhor de mim e achei que ele também pode ser útil para sua rotina de autocuidado.',
    accent: 'from-emerald-400/20 via-teal-400/15 to-cyan-400/20',
    active: 'bg-[linear-gradient(135deg,#10b981_0%,#06b6d4_100%)] border-emerald-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#effef7_0%,#effcff_100%)] border-emerald-100 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(16,185,129,0.12)_0%,rgba(6,182,212,0.12)_100%)] border-emerald-500/20 text-slate-200',
  },
  {
    id: 'momento_dificil',
    label: 'Momento difícil',
    base: 'Sei que você está passando por um momento difícil. O Sereno tem ferramentas que podem dar algum apoio sem pesar.',
    accent: 'from-amber-400/20 via-orange-400/15 to-rose-400/20',
    active: 'bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)] border-amber-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#fff8eb_0%,#fff1ed_100%)] border-amber-100 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(245,158,11,0.12)_0%,rgba(249,115,22,0.12)_100%)] border-amber-500/20 text-slate-200',
  },
  {
    id: 'familia',
    label: 'Família',
    base: 'Quis te indicar o Sereno porque ele reúne recursos que podem ajudar a família a conversar, se organizar e cuidar das emoções.',
    accent: 'from-sky-400/20 via-indigo-400/15 to-violet-400/20',
    active: 'bg-[linear-gradient(135deg,#0ea5e9_0%,#6366f1_100%)] border-sky-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#eef8ff_0%,#f2f3ff_100%)] border-sky-100 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(14,165,233,0.12)_0%,rgba(99,102,241,0.12)_100%)] border-sky-500/20 text-slate-200',
  },
  {
    id: 'terapia',
    label: 'Terapia',
    base: 'Se você estiver em terapia ou pensando em começar, o Sereno pode complementar esse processo com registros e práticas simples.',
    accent: 'from-violet-400/20 via-indigo-400/15 to-slate-400/20',
    active: 'bg-[linear-gradient(135deg,#8b5cf6_0%,#4f46e5_100%)] border-violet-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#f5f1ff_0%,#eef2ff_100%)] border-violet-100 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(139,92,246,0.12)_0%,rgba(79,70,229,0.12)_100%)] border-violet-500/20 text-slate-200',
  },
  {
    id: 'geral',
    label: 'Uso geral',
    base: 'Quis te indicar o Sereno. É um app com recursos de bem-estar, organização emocional e práticas guiadas.',
    accent: 'from-slate-400/20 via-slate-300/15 to-blue-400/20',
    active: 'bg-[linear-gradient(135deg,#475569_0%,#2563eb_100%)] border-slate-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] border-slate-200 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(71,85,105,0.18)_0%,rgba(37,99,235,0.12)_100%)] border-slate-500/20 text-slate-200',
  },
];

const toneOptions = [
  {
    id: 'curto',
    label: 'Mais curto',
    transform: (text: string) => text,
    active: 'bg-[linear-gradient(135deg,#0f172a_0%,#475569_100%)] border-slate-500 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#f8fafc_0%,#f1f5f9_100%)] border-slate-200 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(71,85,105,0.18)_0%,rgba(15,23,42,0.2)_100%)] border-slate-500/20 text-slate-200',
  },
  {
    id: 'acolhedor',
    label: 'Mais acolhedor',
    transform: (text: string) => `${text} Se fizer sentido para você, pode experimentar no seu tempo.`,
    active: 'bg-[linear-gradient(135deg,#ec4899_0%,#8b5cf6_100%)] border-fuchsia-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#fff1f7_0%,#f7f0ff_100%)] border-fuchsia-100 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(236,72,153,0.12)_0%,rgba(139,92,246,0.12)_100%)] border-fuchsia-500/20 text-slate-200',
  },
  {
    id: 'direto',
    label: 'Mais direto',
    transform: (text: string) => `${text} Acho que vale testar.`,
    active: 'bg-[linear-gradient(135deg,#0ea5e9_0%,#14b8a6_100%)] border-cyan-400 text-white',
    idleLight: 'bg-[linear-gradient(135deg,#effbff_0%,#effdfa_100%)] border-cyan-100 text-slate-700',
    idleDark: 'bg-[linear-gradient(135deg,rgba(14,165,233,0.12)_0%,rgba(20,184,166,0.12)_100%)] border-cyan-500/20 text-slate-200',
  },
];

export default function RecommendAppModal({
  open,
  darkMode,
  onClose,
}: {
  open: boolean;
  darkMode?: boolean;
  onClose: () => void;
}) {
  const [contextId, setContextId] = useAppPersistence('psico_recommend_context', 'apoio');
  const [toneId, setToneId] = useState('acolhedor');
  const [personName, setPersonName] = useState('');
  const [extraLine, setExtraLine] = useState('');
  const [copied, setCopied] = useState(false);
  const [recommendCount, setRecommendCount] = useAppPersistence('psico_recommend_count', 0);
  const c = (l: string, d: string) => (darkMode ? d : l);
  const selectedContext = contextOptions.find((item) => item.id === contextId) || contextOptions[0];
  const selectedTone = toneOptions.find((item) => item.id === toneId) || toneOptions[1];

  const message = useMemo(() => {
    const greeting = personName.trim() ? `${personName.trim()}, ` : '';
    const pieces = [
      `${greeting}${selectedTone.transform(selectedContext.base)}`,
      extraLine.trim(),
      'Tem check-in emocional, diário, práticas guiadas, trilhas e ferramentas rápidas para crise, sono e autocuidado.',
      'Baixe em: https://sereno.app',
    ].filter(Boolean);
    return pieces.join('\n\n');
  }, [personName, selectedTone, selectedContext, extraLine]);

  if (!open) return null;

  const openChannel = (channel: 'whatsapp' | 'telegram' | 'email' | 'x') => {
    const text = encodeURIComponent(message);
    const urls = {
      whatsapp: `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?text=${text}`,
      email: `mailto:?subject=Quero te indicar o Sereno&body=${text}`,
      x: `https://x.com/intent/post?text=${text}`,
    };
    setRecommendCount((prev) => prev + 1);
    window.open(urls[channel], '_blank', 'noopener,noreferrer');
  };

  const openInstagram = async () => {
    await navigator.clipboard.writeText(message);
    setRecommendCount((prev) => prev + 1);
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText('https://sereno.app');
    setRecommendCount((prev) => prev + 1);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 p-4 flex items-center justify-center" onClick={onClose}>
      <div
        className={`w-full max-w-md max-h-[88vh] overflow-y-auto rounded-[2rem] border p-5 ${c('bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] border-slate-200', 'bg-[linear-gradient(180deg,#0f172a_0%,#101827_100%)] border-slate-700 text-slate-100')}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${c('text-violet-700', 'text-violet-300')}`}>Indicar o app</p>
            <h3 className="mt-2 text-[1.65rem] font-black leading-tight">
              Compartilhe o <span className={c('text-violet-700', 'text-violet-300')}>Sereno</span>
            </h3>
            <p className={`mt-2 text-[15px] leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>Crie uma mensagem bonita e envie em segundos.</p>
            <p className={`mt-2 text-[13px] font-bold ${c('text-slate-500', 'text-slate-400')}`}>Indicações feitas: {recommendCount}</p>
          </div>
          <button onClick={onClose} className={`h-10 w-10 shrink-0 rounded-2xl text-[15px] ${c('bg-slate-100 text-slate-600', 'bg-slate-800 text-slate-300')}`}>✕</button>
        </div>

        <div className={`mt-5 rounded-[1.6rem] border p-4 ${c('border-violet-100 bg-violet-50/60', 'border-violet-500/20 bg-violet-500/10')}`}>
          <p className={`text-[13px] font-black uppercase tracking-[0.18em] ${c('text-violet-700', 'text-violet-300')}`}>Como fica melhor</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              'Escolha o contexto que combina com a pessoa',
              'Ajuste o tom para parecer natural',
              'Envie pelo canal mais fácil para ela',
            ].map((item) => (
              <div key={item} className={`rounded-2xl border px-3 py-3 text-[13px] font-bold leading-relaxed ${c('border-white bg-white/80 text-slate-600', 'border-white/10 bg-white/5 text-slate-300')}`}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-[13px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Contexto</p>
            <span className={`text-[12px] font-semibold ${c('text-slate-500', 'text-slate-400')}`}>Escolha o motivo da indicação</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {contextOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setContextId(option.id)}
                className={`rounded-2xl border px-3 py-3 text-left text-[14px] font-bold transition-all ${contextId === option.id ? option.active : c(option.idleLight, option.idleDark)}`}
              >
                <div className={`mb-2 h-1.5 rounded-full bg-gradient-to-r ${option.accent}`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-[13px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Tom</p>
            <span className={`text-[12px] font-semibold ${c('text-slate-500', 'text-slate-400')}`}>Deixe a mensagem mais com a sua cara</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {toneOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setToneId(option.id)}
                className={`rounded-2xl border px-3 py-3 text-[14px] font-bold transition-all ${toneId === option.id ? option.active : c(option.idleLight, option.idleDark)}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Nome da pessoa (opcional)"
            className={`w-full rounded-2xl border px-4 py-3 text-sm ${c('bg-white border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-100')}`}
          />
          <textarea
            value={extraLine}
            onChange={(e) => setExtraLine(e.target.value)}
            rows={3}
            placeholder="Frase adicional (opcional)"
            className={`w-full rounded-2xl border px-4 py-3 text-sm resize-none ${c('bg-white border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-100')}`}
          />
        </div>

        <div className={`mt-5 overflow-hidden rounded-[1.7rem] border ${c('bg-white border-slate-200', 'bg-slate-800/70 border-slate-700')}`}>
          <div className={`px-4 py-3 ${c('bg-[linear-gradient(135deg,#ede9fe_0%,#eff6ff_100%)]', 'bg-[linear-gradient(135deg,rgba(124,58,237,0.18)_0%,rgba(37,99,235,0.12)_100%)]')}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-300')}`}>Prévia</p>
                <p className={`mt-1 text-[13px] font-semibold ${c('text-slate-600', 'text-slate-300')}`}>Mensagem pronta para enviar</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-violet-100 text-violet-700', 'bg-violet-500/15 text-violet-200')}`}>Cartão</span>
            </div>
          </div>
          <div className="p-4">
            <div className={`rounded-[1.4rem] border p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${c('border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]', 'border-white/10 bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]')}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black ${c('bg-violet-100 text-violet-700', 'bg-violet-500/15 text-violet-200')}`}>
                  S
                </div>
                <div>
                  <p className={`text-sm font-black ${c('text-slate-900', 'text-white')}`}>Sereno</p>
                  <p className={`text-[12px] ${c('text-slate-500', 'text-slate-400')}`}>Indicação pensada por você</p>
                </div>
              </div>
              <p className={`mt-4 whitespace-pre-line text-sm leading-relaxed ${c('text-slate-700', 'text-slate-200')}`}>{message}</p>
            </div>
          </div>
        </div>

        <div className={`mt-5 rounded-[1.5rem] border p-4 ${c('bg-white border-slate-200', 'bg-slate-800/70 border-slate-700')}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>QR code</p>
              <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>Use o QR para abrir o app direto no celular.</p>
              <p className={`mt-1 text-[11px] font-bold ${c('text-slate-500', 'text-slate-400')}`}>https://sereno.app</p>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('https://sereno.app')}`}
              alt="QR code do Sereno"
              className="h-24 w-24 rounded-2xl bg-white p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button onClick={() => openChannel('whatsapp')} className="rounded-2xl bg-[#25D366] py-3 text-sm font-bold text-white">WhatsApp</button>
          <button onClick={() => void openInstagram()} className="rounded-2xl bg-[linear-gradient(135deg,#f58529_0%,#dd2a7b_45%,#8134af_75%,#515bd4_100%)] py-3 text-sm font-bold text-white">Instagram</button>
          <button onClick={() => openChannel('telegram')} className="rounded-2xl bg-[#229ED9] py-3 text-sm font-bold text-white">Telegram</button>
          <button onClick={() => openChannel('x')} className="rounded-2xl bg-[#111111] py-3 text-sm font-bold text-white">X</button>
          <button onClick={() => openChannel('email')} className="rounded-2xl bg-[#EA4335] py-3 text-sm font-bold text-white">E-mail</button>
          <button onClick={copyLink} className={`rounded-2xl py-3 text-sm font-bold ${copied ? 'bg-emerald-600 text-white' : c('bg-slate-100 text-slate-800 border border-slate-300', 'bg-slate-800 text-slate-100 border border-slate-700')}`}>
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  );
}
