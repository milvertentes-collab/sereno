'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SectionHeroCard from './SectionHeroCard';

type SuggestionType = 'sugestao' | 'melhoria' | 'bug' | 'elogio' | 'recurso';

type SentSuggestion = {
  id: string;
  type: SuggestionType;
  title: string;
  message: string;
  where?: string;
  expected?: string;
  createdAt: string;
};

type SuggestionMeta = {
  source?: string;
  platform?: string;
  userAgent?: string;
  language?: string;
  viewport?: string;
  currentUrl?: string;
  sentAt?: string;
};

const typeMeta: Record<SuggestionType, { label: string; emoji: string; accent: string; helper: string }> = {
  sugestao: {
    label: 'Sugestão',
    emoji: '💡',
    accent: 'bg-amber-500',
    helper: 'Para um ajuste geral no app.',
  },
  melhoria: {
    label: 'Melhoria',
    emoji: '✨',
    accent: 'bg-violet-500',
    helper: 'Explique o que falta e por que ajudaria.',
  },
  bug: {
    label: 'Bug',
    emoji: '🐛',
    accent: 'bg-rose-500',
    helper: 'Descreva onde foi, o que você fez e o que falhou.',
  },
  elogio: {
    label: 'Elogio',
    emoji: '❤️',
    accent: 'bg-emerald-500',
    helper: 'Para destacar o que está funcionando bem.',
  },
  recurso: {
    label: 'Pedido de recurso',
    emoji: '🧩',
    accent: 'bg-sky-500',
    helper: 'Explique qual recurso faria diferença e quando ajudaria.',
  },
};

const buildDraftBody = ({
  type,
  title,
  message,
  where,
  expected,
}: {
  type: SuggestionType;
  title: string;
  message: string;
  where: string;
  expected: string;
}) => {
  const sections = [
    `Tipo: ${typeMeta[type].label}`,
    `Título: ${title.trim()}`,
    '',
    'Mensagem:',
    message.trim(),
  ];

  if (where.trim()) {
    sections.push('', 'Onde isso aconteceu:', where.trim());
  }

  if (expected.trim()) {
    sections.push('', type === 'bug' ? 'O que você esperava / o que deu errado:' : 'O que você esperava:');
    sections.push(expected.trim());
  }

  return sections.join('\n');
};

export default function SuggestionsSection({ darkMode: dm, onNavigate, initialSource }: { darkMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void; initialSource?: string }) {
  const [draft, setDraft] = useLocalStorage<{
    type: SuggestionType;
    title: string;
    message: string;
    where: string;
    expected: string;
  }>('psico_suggestions_draft', {
    type: 'sugestao',
    title: '',
    message: '',
    where: '',
    expected: '',
  });
  const [sentHistory, setSentHistory] = useLocalStorage<SentSuggestion[]>('psico_suggestions_history', []);
  const [feedbackState, setFeedbackState] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const c = (l: string, d: string) => (dm ? d : l);
  const currentMeta = typeMeta[draft.type];

  const preview = useMemo(() => buildDraftBody(draft), [draft]);
  const fallbackSuggestionsEmail = process.env.NEXT_PUBLIC_SUGGESTIONS_TO_EMAIL || '';

  useEffect(() => {
    if (!initialSource) return;
    setDraft((prev) => {
      if (prev.where?.trim()) return prev;
      return { ...prev, where: initialSource };
    });
  }, [initialSource, setDraft]);

  const setField = (field: keyof typeof draft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!draft.title.trim()) {
      setFeedbackState({ kind: 'error', text: 'Adicione um título curto antes de enviar.' });
      return false;
    }
    if (!draft.message.trim()) {
      setFeedbackState({ kind: 'error', text: 'Escreva a mensagem antes de enviar.' });
      return false;
    }
    return true;
  };

  const openMailtoFallback = () => {
    if (typeof window === 'undefined' || !fallbackSuggestionsEmail) return false;
    const subject = `[${typeMeta[draft.type].label}] ${draft.title.trim() || 'Sugestão - Sereno'}`;
    const body = buildDraftBody(draft);
    window.location.href = `mailto:${encodeURIComponent(fallbackSuggestionsEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return true;
  };

  const sendEmail = async () => {
    if (!validate()) return;
    setSending(true);
    try {
      const meta: SuggestionMeta = {
        source: initialSource || undefined,
        platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        language: typeof navigator !== 'undefined' ? navigator.language : undefined,
        viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
        currentUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        sentAt: new Date().toISOString(),
      };

      const response = await fetch('/api/suggestions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...draft, meta }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        if (data?.code === 'email_config_missing' && openMailtoFallback()) {
          setFeedbackState({ kind: 'success', text: 'Seu app de e-mail foi aberto para concluir o envio.' });
          return;
        }
        throw new Error(data?.error || 'Falha ao enviar.');
      }

      setSentHistory((prev) => [
        {
          id: crypto.randomUUID(),
          type: draft.type,
          title: draft.title.trim(),
          message: draft.message.trim(),
          where: draft.where.trim(),
          expected: draft.expected.trim(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 10));

      setDraft({
        type: 'sugestao',
        title: '',
        message: '',
        where: '',
        expected: '',
      });
      setFeedbackState({ kind: 'success', text: 'Mensagem enviada.' });
    } catch (error) {
      setFeedbackState({ kind: 'error', text: `${error instanceof Error ? error.message : 'Não foi possível enviar agora.'} Tente de novo.` });
    } finally {
      setSending(false);
    }
  };

  const reopenHistoryItem = (item: SentSuggestion) => {
    setDraft({
      type: item.type,
      title: item.title,
      message: item.message,
      where: item.where || '',
      expected: item.expected || '',
    });
    setFeedbackState(null);
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Escuta ativa"
          title="Sugestões"
          description="Envie sugestão, melhoria, bug, elogio ou pedido de recurso com mais clareza e contexto."
          icon="💡"
        />
      </div>

      {initialSource && (
        <div className={`rounded-2xl border p-4 mb-5 ${c('bg-indigo-50 border-indigo-100', 'bg-indigo-950/20 border-indigo-900/30')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-indigo-700', 'text-indigo-300')}`}>Origem detectada</p>
          <p className="mt-2 text-sm">Esta mensagem está sendo montada a partir de: <span className="font-black">{initialSource}</span>.</p>
        </div>
      )}

      <div data-card-glyph={currentMeta.emoji} className={`sereno-ornament-card rounded-3xl border p-5 mb-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Tipo de mensagem</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {(Object.keys(typeMeta) as SuggestionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setDraft((prev) => ({ ...prev, type }))}
              className={`rounded-2xl border px-3 py-3 text-left text-sm font-bold ${
                draft.type === type
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : c('bg-slate-50 border-slate-200 text-slate-700', 'bg-slate-800 border-slate-700 text-slate-200')
              }`}
            >
              <span className="mr-2">{typeMeta[type].emoji}</span>
              {typeMeta[type].label}
            </button>
          ))}
        </div>
        <div className={`mt-4 rounded-2xl border p-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="text-sm font-bold">{currentMeta.emoji} {currentMeta.label}</p>
          <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>{currentMeta.helper}</p>
        </div>
      </div>

      <div data-card-glyph="📝" className={`sereno-ornament-card rounded-3xl border p-5 mb-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Estrutura do envio</p>
        <div className={`mt-4 rounded-2xl border p-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="text-sm font-bold">Ordem sugerida</p>
          <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>
            Título curto, mensagem principal e, se fizer sentido, contexto e resultado esperado.
          </p>
        </div>
        <div className="space-y-4 mt-4">
          <div>
            <label className={`block text-sm font-bold mb-2 ${c('text-slate-700', 'text-slate-200')}`}>Título curto</label>
            <input
              value={draft.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Ex: atalho do quiz não funcionou"
              className={`w-full rounded-2xl border px-4 py-3 text-sm ${c('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-100')}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${c('text-slate-700', 'text-slate-200')}`}>Mensagem</label>
            <textarea
              value={draft.message}
              onChange={(e) => setField('message', e.target.value)}
              rows={6}
              placeholder={
                draft.type === 'bug'
                  ? 'Conte o que você fez e o que aconteceu.'
                  : draft.type === 'melhoria'
                    ? 'Explique o que falta hoje e o que melhoraria.'
                    : 'Escreva sua mensagem de forma clara e direta.'
              }
              className={`w-full rounded-2xl border px-4 py-3 text-sm resize-none ${c('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-100')}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${c('text-slate-700', 'text-slate-200')}`}>
              Onde isso aconteceu? <span className={`font-medium ${c('text-slate-500', 'text-slate-400')}`}>(opcional)</span>
            </label>
            <input
              value={draft.where}
              onChange={(e) => setField('where', e.target.value)}
              placeholder={draft.type === 'bug' ? 'Ex: Linguagens do Amor, botão de histórico' : 'Ex: home, perfil, trilhas, quiz'}
              className={`w-full rounded-2xl border px-4 py-3 text-sm ${c('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-100')}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${c('text-slate-700', 'text-slate-200')}`}>
              {draft.type === 'bug' ? 'O que você esperava / o que deu errado?' : 'O que você esperava?'}{' '}
              <span className={`font-medium ${c('text-slate-500', 'text-slate-400')}`}>(opcional)</span>
            </label>
            <textarea
              value={draft.expected}
              onChange={(e) => setField('expected', e.target.value)}
              rows={3}
              placeholder={
                draft.type === 'bug'
                  ? 'Ex: eu esperava abrir o histórico, mas a tela travou.'
                  : draft.type === 'melhoria'
                    ? 'Ex: um atalho mais claro deixaria o fluxo mais rápido.'
                    : 'Ex: utilidade, resultado esperado ou impacto.'
              }
              className={`w-full rounded-2xl border px-4 py-3 text-sm resize-none ${c('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-100')}`}
            />
          </div>
        </div>
      </div>

      {(draft.type === 'bug' || draft.type === 'melhoria') && (
        <div data-card-glyph="🧭" className={`sereno-ornament-card rounded-3xl border p-5 mb-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Guia rápido</p>
          <div className="grid gap-2 mt-4 text-sm">
            {draft.type === 'bug' ? (
              <>
                <div className={`rounded-2xl border p-3 ${c('bg-rose-50 border-rose-200 text-rose-900', 'bg-rose-950/20 border-rose-800/40 text-rose-100')}`}>1. Onde aconteceu</div>
                <div className={`rounded-2xl border p-3 ${c('bg-rose-50 border-rose-200 text-rose-900', 'bg-rose-950/20 border-rose-800/40 text-rose-100')}`}>2. O que você fez</div>
                <div className={`rounded-2xl border p-3 ${c('bg-rose-50 border-rose-200 text-rose-900', 'bg-rose-950/20 border-rose-800/40 text-rose-100')}`}>3. O que deu errado</div>
              </>
            ) : (
              <>
                <div className={`rounded-2xl border p-3 ${c('bg-violet-50 border-violet-200 text-violet-900', 'bg-violet-950/20 border-violet-800/40 text-violet-100')}`}>1. O que falta hoje</div>
                <div className={`rounded-2xl border p-3 ${c('bg-violet-50 border-violet-200 text-violet-900', 'bg-violet-950/20 border-violet-800/40 text-violet-100')}`}>2. Por que seria útil</div>
              </>
            )}
          </div>
        </div>
      )}

      {feedbackState && (
        <div className={`rounded-2xl border p-4 mb-5 text-sm font-bold ${feedbackState.kind === 'success'
          ? c('bg-emerald-50 border-emerald-200 text-emerald-800', 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200')
          : c('bg-rose-50 border-rose-200 text-rose-800', 'bg-rose-950/20 border-rose-800/40 text-rose-200')}`}>
          {feedbackState.text}
        </div>
      )}

      <div data-card-glyph="👀" className={`sereno-ornament-card rounded-3xl border p-5 mb-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
        <div className="flex items-center justify-between gap-3">
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Prévia</p>
          <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{preview.length} caracteres</span>
        </div>
        <pre className={`mt-4 whitespace-pre-wrap text-sm leading-relaxed font-sans ${c('text-slate-700', 'text-slate-200')}`}>{preview}</pre>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button onClick={sendEmail} disabled={sending} className="rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white disabled:opacity-60">
          {sending ? 'Enviando...' : 'Enviar por e-mail'}
        </button>
      </div>

      {sentHistory.length > 0 && (
        <div data-card-glyph="📚" className={`sereno-ornament-card rounded-3xl border p-5 mt-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
          <div className="flex items-center justify-between gap-3">
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Últimas enviadas</p>
            <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{sentHistory.length} salvas</span>
          </div>
          <div className="space-y-3 mt-4">
            {sentHistory.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => reopenHistoryItem(item)}
                data-card-glyph={typeMeta[item.type].emoji}
                className={`sereno-ornament-card w-full rounded-2xl border p-4 text-left ${c('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}
              >
                <p className="text-sm font-black">{typeMeta[item.type].emoji} {item.title}</p>
                <p className={`mt-1 text-xs ${c('text-slate-600', 'text-slate-400')}`}>{new Date(item.createdAt).toLocaleString('pt-BR')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
