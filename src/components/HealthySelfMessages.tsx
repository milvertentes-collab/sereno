'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import SectionHeroCard from './SectionHeroCard';

type MessageKind = 'acolhimento' | 'forca' | 'realidade' | 'esperanca' | 'limite';

interface HealthyMessage {
  id: string;
  text: string;
  createdAt: string;
  kind: MessageKind;
  favorite: boolean;
  pinned: boolean;
}

interface Props {
  darkMode?: boolean;
  desktopMode?: boolean;
  onNavigate?: (tab: 'esperanca' | 'diary' | 'solta', params?: Record<string, any>) => void;
}

const starterPrompts = [
  'O que você gostaria de lembrar em um dia difícil?',
  'Que frase seu eu mais saudável diria agora?',
  'O que você já superou e não quer esquecer?',
];

const kindOptions: Array<{ id: MessageKind; label: string; emoji: string; desc: string; tone: string }> = [
  { id: 'acolhimento', label: 'Acolhimento', emoji: '🫶', desc: 'para dias sensíveis e de mais cuidado', tone: 'from-rose-400 to-pink-500' },
  { id: 'forca', label: 'Força', emoji: '🔥', desc: 'para lembrar potência e firmeza', tone: 'from-amber-400 to-orange-500' },
  { id: 'realidade', label: 'Realidade', emoji: '🪞', desc: 'para trazer perspectiva sem dureza', tone: 'from-slate-500 to-slate-700' },
  { id: 'esperanca', label: 'Esperança', emoji: '🌤️', desc: 'para revisitar luz e continuidade', tone: 'from-sky-400 to-cyan-500' },
  { id: 'limite', label: 'Limite saudável', emoji: '🛡️', desc: 'para lembrar que proteger-se também conta', tone: 'from-emerald-400 to-teal-500' },
];

function normalizeMessage(message: Partial<HealthyMessage> & { id: string; text: string; createdAt: string }): HealthyMessage {
  return {
    id: message.id,
    text: message.text,
    createdAt: message.createdAt,
    kind: message.kind || 'acolhimento',
    favorite: message.favorite ?? false,
    pinned: message.pinned ?? false,
  };
}

export default function HealthySelfMessages({ darkMode: dm, desktopMode = false, onNavigate }: Props) {
  const maxMessageLength = 250;
  const [storedMessages, setStoredMessages] = useAppPersistence<Array<Partial<HealthyMessage> & { id: string; text: string; createdAt: string }>>('psico_healthy_self', []);
  const [text, setText] = useState('');
  const [kind, setKind] = useState<MessageKind>('acolhimento');
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<MessageKind | 'all'>('all');
  const c = (l: string, d: string) => (dm ? d : l);

  const messages = useMemo(() => storedMessages.map(normalizeMessage), [storedMessages]);
  const pinnedMessage = useMemo(() => messages.find((message) => message.pinned) || null, [messages]);
  const favoriteCount = messages.filter((message) => message.favorite).length;
  const filteredMessages = useMemo(
    () => (listFilter === 'all' ? messages : messages.filter((message) => message.kind === listFilter)),
    [listFilter, messages],
  );

  const featuredMessage = useMemo(() => {
    if (!messages.length) return null;
    if (featuredId) return messages.find((message) => message.id === featuredId) || messages[0];
    return messages[0];
  }, [featuredId, messages]);

  useEffect(() => {
    if (!messages.length) {
      setFeaturedId(null);
      return;
    }
    if (featuredId && messages.some((message) => message.id === featuredId)) return;
    const seed = new Date().toISOString().slice(0, 10).split('-').join('');
    const index = Number(seed) % messages.length;
    setFeaturedId(messages[index].id);
  }, [featuredId, messages]);

  const add = () => {
    if (!text.trim()) return;
    const next: HealthyMessage = {
      id: crypto.randomUUID(),
      text: text.trim().slice(0, maxMessageLength),
      createdAt: new Date().toISOString(),
      kind,
      favorite: false,
      pinned: messages.length === 0,
    };
    setStoredMessages([next, ...messages]);
    setText('');
    setKind('acolhimento');
    setFeaturedId(next.id);
  };

  const updateMessages = (updater: (current: HealthyMessage[]) => HealthyMessage[]) => {
    setStoredMessages(updater(messages));
  };

  const remove = (id: string) => updateMessages((current) => current.filter((message) => message.id !== id));

  const toggleFavorite = (id: string) =>
    updateMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, favorite: !message.favorite } : message)),
    );

  const pinMessage = (id: string) =>
    updateMessages((current) =>
      current.map((message) => ({ ...message, pinned: message.id === id })),
    );

  const showAnother = () => {
    if (messages.length <= 1) return;
    const pool = messages.filter((message) => message.id !== featuredId);
    const next = pool[Math.floor(Math.random() * pool.length)];
    setFeaturedId(next.id);
  };

  const copyMessage = async (message: HealthyMessage) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(message.text);
    } catch {}
  };

  const sendToWall = async (message: HealthyMessage) => {
    await copyMessage(message);
    onNavigate?.('esperanca', { muralDraft: message.text, muralDraftKey: Date.now() });
  };

  const sendToDiary = (message: HealthyMessage) => {
    onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: message.text, diaryDraftKey: Date.now() });
  };

  const sendToSolta = (message: HealthyMessage) => {
    onNavigate?.('solta', { soltaDraft: `${message.text}\n\nO que isso toca em mim hoje: `, soltaDraftKey: Date.now() });
  };

  const kindMeta = (messageKind: MessageKind) => kindOptions.find((option) => option.id === messageKind) || kindOptions[0];

  return (
    <div className={`p-4 pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Frases para revisitar"
          title="Mensagem do Eu Saudável"
          description="Guarde frases para reencontrar mais chão, cuidado, limite ou perspectiva quando o dia apertar."
          icon="💬"
        />
      </div>

      {featuredMessage && (
        <div
          key={featuredMessage.id}
          data-card-glyph={kindMeta(featuredMessage.kind).emoji}
          className={`sereno-ornament-card rounded-[2rem] p-5 border mb-5 shadow-[0_22px_55px_-32px_rgba(16,185,129,0.38)] animate-[textReveal_0.45s_ease-out_forwards] overflow-hidden relative ${c('bg-gradient-to-br from-emerald-50 via-white to-cyan-50 border-emerald-100', 'bg-gradient-to-br from-emerald-900/20 via-slate-900 to-cyan-950/30 border-emerald-800/40')}`}
        >
          <div className={`absolute inset-0 pointer-events-none ${c('bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_28%)]', 'bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.12),transparent_28%)]')}`} />
          <div className="absolute -right-6 -top-6 text-7xl opacity-10 pointer-events-none">✦</div>
          <div className="absolute -left-4 bottom-0 text-6xl opacity-10 pointer-events-none">❞</div>
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-emerald-700', 'text-emerald-300')}`}>Mensagem para hoje</p>
              <p className="text-xl font-black mt-3 leading-relaxed max-w-[18rem]">{featuredMessage.text}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-800 text-slate-200 border border-slate-700')}`}>
                  {kindMeta(featuredMessage.kind).emoji} {kindMeta(featuredMessage.kind).label}
                </span>
                {featuredMessage.favorite && (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-amber-500/10 text-amber-300 border border-amber-500/20')}`}>
                    Favorita
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={showAnother}
              className={`px-3 py-2 rounded-2xl text-[11px] font-black transition-all active:scale-95 ${c('bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50', 'bg-slate-800 text-emerald-300 border border-slate-700 hover:bg-slate-800')}`}
            >
              Mostrar outra
            </button>
          </div>
        </div>
      )}

      {pinnedMessage && (
        <div data-card-glyph="⚓" className={`sereno-ornament-card rounded-[1.8rem] p-4 border mb-5 ${c('bg-sky-50 border-sky-100', 'bg-sky-900/15 border-sky-800/40')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-sky-700', 'text-sky-300')}`}>Mensagem âncora</p>
          <p className="text-sm mt-2 leading-relaxed font-medium">{pinnedMessage.text}</p>
        </div>
      )}

      <div data-card-glyph="✍️" className={`sereno-ornament-card rounded-[2rem] p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Para destravar</p>
            <h3 className="text-lg font-black mt-2">Se estiver difícil começar</h3>
          </div>
          <div className={`px-3 py-2 rounded-2xl text-[11px] font-black ${c('bg-emerald-50 text-emerald-700 border border-emerald-100', 'bg-slate-900 text-emerald-300 border border-slate-700')}`}>
            {messages.length} salva{messages.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {starterPrompts.map((prompt) => (
            <div
              key={prompt}
              className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-emerald-50 text-emerald-800 border border-emerald-100', 'bg-slate-900 text-emerald-300 border border-slate-700')}`}
            >
              {prompt}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {kindOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setKind(option.id)}
              className={`text-left rounded-2xl p-3 border transition-all ${kind === option.id
                ? `bg-gradient-to-r ${option.tone} text-white border-transparent shadow-lg`
                : c('bg-slate-50 border-slate-200 hover:bg-white', 'bg-slate-900 border-slate-700 hover:bg-slate-800')}`}
            >
              <p className="font-black text-sm">{option.emoji} {option.label}</p>
              <p className={`text-xs mt-1 leading-relaxed ${kind === option.id ? 'text-white/85' : c('text-slate-600', 'text-slate-400')}`}>{option.desc}</p>
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxMessageLength))}
          maxLength={maxMessageLength}
          placeholder="Ex.: Você já atravessou dias difíceis antes. Não precisa resolver tudo hoje para continuar digno(a) de cuidado."
          className={`w-full min-h-[120px] p-4 rounded-2xl border text-sm leading-relaxed ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className={`text-[11px] font-semibold ${c('text-slate-500', 'text-slate-400')}`}>
            Máximo de {maxMessageLength} caracteres.
          </p>
          <p className={`text-[11px] font-black ${text.length >= maxMessageLength ? c('text-rose-600', 'text-rose-300') : c('text-slate-500', 'text-slate-400')}`}>
            {text.length}/{maxMessageLength}
          </p>
        </div>
        <button onClick={add} className="w-full mt-3 py-3 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20">
          Salvar mensagem
        </button>
      </div>

      <div data-card-glyph="⭐" className={`sereno-ornament-card rounded-[1.8rem] p-4 border mb-5 ${c('bg-slate-50 border-slate-200', 'bg-slate-900/70 border-slate-700')}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Visão rápida</p>
            <p className="text-sm mt-2 font-medium">
              {favoriteCount} favorita{favoriteCount === 1 ? '' : 's'} guardada{favoriteCount === 1 ? '' : 's'} para revisitar com mais facilidade.
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${c('bg-white border border-slate-200', 'bg-slate-800 border border-slate-700')}`}>
            ⭐
          </div>
        </div>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-1">
            <button
              onClick={() => setListFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${listFilter === 'all'
                ? c('bg-slate-900 text-white shadow-sm', 'bg-white text-slate-900 shadow-sm')
                : c('bg-white text-slate-600 border border-slate-200', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
            >
              Todas
            </button>
            {kindOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setListFilter(option.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${listFilter === option.id
                  ? `bg-gradient-to-r ${option.tone} text-white shadow-sm`
                  : c('bg-white text-slate-600 border border-slate-200', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>

          {filteredMessages.map((message) => {
            const meta = kindMeta(message.kind);
            return (
              <div
                key={message.id}
                data-card-glyph={meta.emoji}
                className={`sereno-ornament-card rounded-[1.8rem] p-4 border shadow-sm ${c('bg-gradient-to-br from-white to-slate-50 border-slate-100', 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700')}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-900 text-slate-200 border border-slate-700')}`}>
                        {meta.emoji} {meta.label}
                      </span>
                      {message.favorite && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-amber-500/10 text-amber-300 border border-amber-500/20')}`}>
                          Favorita
                        </span>
                      )}
                      {message.pinned && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-sky-50 text-sky-800 border border-sky-100', 'bg-sky-500/10 text-sky-300 border border-sky-500/20')}`}>
                          Âncora
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-gradient-to-br ${meta.tone} text-white shadow-sm`}>
                    {meta.emoji}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 gap-3 flex-wrap">
                  <span className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{new Date(message.createdAt).toLocaleDateString('pt-BR')}</span>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button onClick={() => toggleFavorite(message.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-slate-900 text-amber-300 border border-slate-700')}`}>
                      {message.favorite ? 'Desfavoritar' : 'Favoritar'}
                    </button>
                    <button onClick={() => pinMessage(message.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-sky-50 text-sky-800 border border-sky-100', 'bg-slate-900 text-sky-300 border border-slate-700')}`}>
                      {message.pinned ? 'Mensagem âncora' : 'Fixar como âncora'}
                    </button>
                    <button onClick={() => copyMessage(message)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-900 text-slate-300 border border-slate-700')}`}>
                      Copiar
                    </button>
                    <button onClick={() => sendToDiary(message)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-emerald-50 text-emerald-800 border border-emerald-100', 'bg-slate-900 text-emerald-300 border border-slate-700')}`}>
                      Levar ao diário
                    </button>
                    <button onClick={() => sendToSolta(message)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-100', 'bg-slate-900 text-fuchsia-300 border border-slate-700')}`}>
                      Soltar daqui
                    </button>
                    <button onClick={() => sendToWall(message)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${c('bg-indigo-50 text-indigo-800 border border-indigo-100', 'bg-slate-900 text-indigo-300 border border-slate-700')}`}>
                      Usar no mural
                    </button>
                    <button onClick={() => remove(message.id)} className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-500 border border-rose-200 bg-rose-50">
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-3xl p-6 text-center border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
          <p className={`text-sm ${c('text-slate-600', 'text-slate-400')}`}>Nenhuma mensagem salva ainda. Quando você escrever a primeira, ela pode virar sua mensagem na guia início.</p>
        </div>
      )}

      {messages.length > 0 && filteredMessages.length === 0 && (
        <div className={`rounded-3xl p-6 mt-3 text-center border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
          <p className={`text-sm ${c('text-slate-600', 'text-slate-400')}`}>Ainda não há mensagens desse tipo por aqui.</p>
        </div>
      )}

      <style jsx>{`
        @keyframes textReveal {
          0% { opacity: 0; transform: translateY(10px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}
