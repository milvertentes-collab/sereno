'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import SectionHeroCard from './SectionHeroCard';

interface HopeMessage {
  id: string;
  text: string;
  date: number;
  createdAt?: string;
  color?: string;
  icon: string;
}

type HopeHistoryEntry = HopeMessage & { source: 'sent' | 'received'; favorite?: boolean };
type UserAccountRef = { email?: string; nickname?: string; name?: string } | null;

const presetMessages: HopeMessage[] = [
  { id: '1', text: 'Você vai passar por essa tempestade, confie.', date: Date.now() - 86400000, color: 'bg-indigo-100 text-indigo-800', icon: '💌' },
  { id: '2', text: 'Não desista. Até as noites mais longas têm fim e o sol sempre volta a brilhar.', date: Date.now() - 172800000, color: 'bg-amber-100 text-amber-800', icon: '☀️' },
  { id: '3', text: 'Seja gentil com você mesmo(a) hoje. Você está fazendo o seu melhor.', date: Date.now() - 259200000, color: 'bg-emerald-100 text-emerald-800', icon: '🌱' },
  { id: '4', text: 'Sua dor importa, mas ela não te define. Tem muita força aí dentro.', date: Date.now() - 345600000, color: 'bg-rose-100 text-rose-800', icon: '💖' },
  { id: '5', text: 'Respira fundo. Um passo de cada vez.', date: Date.now() - 432000000, color: 'bg-blue-100 text-blue-800', icon: '🌬️' }
];

const forbiddenWords = [
  'odeio', 'morte', 'morrer', 'matar', 'lixo', 'idiota', 'burro', 'inútil', 'desgraça',
  'sexo', 'porno', 'puta', 'caralho', 'buceta', 'pinto', 'foda',
  'bolsonaro', 'lula', 'esquerdista', 'direitista', 'comunista', 'fascista', 'deus te castigue', 'pecador', 'inferno'
];

const messageStyles = [
  { bg: 'bg-sky-400', tx: 'text-white', border: 'border-sky-600', icon: '☁️' },
  { bg: 'bg-indigo-500', tx: 'text-white', border: 'border-indigo-700', icon: '💌' },
  { bg: 'bg-emerald-400', tx: 'text-white', border: 'border-emerald-600', icon: '🕊️' },
  { bg: 'bg-rose-400', tx: 'text-white', border: 'border-rose-600', icon: '❤️' },
  { bg: 'bg-amber-400', tx: 'text-white', border: 'border-amber-600', icon: '🌻' },
  { bg: 'bg-purple-400', tx: 'text-white', border: 'border-purple-600', icon: '✨' },
  { bg: 'bg-cyan-400', tx: 'text-white', border: 'border-cyan-600', icon: '🌊' },
  { bg: 'bg-fuchsia-400', tx: 'text-white', border: 'border-fuchsia-600', icon: '🌟' }
];

const clientForbiddenWords = [
  'pornografia', 'porno', 'nude', 'nudes', 'pedof', 'criança sexy', 'infantil sexy',
  'racista', 'racismo', 'homofobia', 'transfobia', 'machista', 'nazista', 'xenofobia', 'capacitista', 'elitista',
  'traveco', 'macaco', 'favelado', 'mulher inferior', 'homem inferior', 'gente inferior',
  'suicidio', 'suicídio', 'automutilacao', 'automutilação',
  'cassino', 'aposta', 'bet', 'blaze', 'tigrinho',
  'pix', 'cupom', 'desconto', 'marketing', 'consultoria', 'mentoria',
];

const clientForbiddenPatterns = [
  /\b(vote|votem|votem em|faça campanha|faca campanha)\b/i,
  /\b(converta-se|se converta|aceite jesus|ore agora|reza obrigatoria|reze obrigatoriamente)\b/i,
  /\b(voce tem que|você tem que|deve obedecer|obedeça|obedeca)\b/i,
  /\b(morra|deveria morrer|merece morrer|acabe com sua vida)\b/i,
  /\b(odeio (crente|evangelico|evangélico|catolico|católico|ateu|judeu|muçulmano|mulcumano))\b/i,
  /\b(odeio (pobre|rico|ricos|negro|negra|branco|branca|gay|lésbica|lesbica|trans|travesti|mulher|homem))\b/i,
  /\b(http:\/\/|https:\/\/|www\.|bit\.ly|tinyurl|t\.me\/|wa\.me\/)\b/i,
  /\b(linktr\.ee)\b/i,
  /\b(chama no|me chama no|fala comigo no|entra em contato|me procura no|me chama no whatsapp|me chama no zap|me chama no telegram|me chama no insta|direct|dm|pv)\b/i,
  /(^|\s)@[a-z0-9._-]{2,}/i,
  /\b(instagram|insta|facebook|face|twitter|x\.com|twitter\.com)\b/i,
  /\b(ameaca|ameaça|vou te pegar|vou acabar com|merece apanhar)\b/i,
  /\b(pare de tomar|larga esse rem[eé]dio|abandona seu tratamento)\b/i,
  /\b(aposte|entra na bet|ganha dinheiro facil|ganhe dinheiro facil|ganhe dinheiro fácil)\b/i,
  /\b(se corta|me corto|me cortar|corta seu corpo)\b/i,
  /\b(me passa seu|manda seu|envia seu|qual seu numero|qual seu número|me passa teu|me manda teu)\b/i,
  /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-.\s]?\d{4})/i,
  /\b(rua|avenida|av\.|travessa|trav\.|alameda|bairro|cep|numero|número|casa|apto|apartamento|condominio|condomínio)\b.{0,30}\d+/i,
  /\b(zero|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove)\b(?:[\s,.-]+\b(zero|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove)\b){5,}/i,
  /\b(meu nome e|meu nome é|me chamo|sou o|sou a|eu sou o|eu sou a|assinado por)\b/i,
];

const clientCareKeywords = [
  'amor', 'carinho', 'cuidado', 'apoio', 'acolhimento', 'gentil', 'gentileza', 'força', 'forca', 'esperança', 'esperanca',
  'calma', 'respire', 'respiro', 'leveza', 'bem-estar', 'bem estar', 'saúde mental', 'saude mental', 'presença', 'presenca',
  'motivação', 'motivacao', 'aprendizado', 'educativo', 'afeto', 'descanso', 'abraço', 'abraco', 'paz',
];

const blockedNames = [
  'ana', 'maria', 'joao', 'joão', 'jose', 'josé', 'paulo', 'carlos', 'pedro', 'lucas', 'gabriel', 'rafael',
  'fernanda', 'camila', 'julia', 'júlia', 'bruna', 'amanda', 'beatriz', 'mariana', 'leticia', 'letícia', 'bianca',
  'rodrigo', 'felipe', 'thiago', 'tiago', 'diego', 'gustavo', 'ricardo', 'eduardo', 'daniel', 'matheus', 'mateus',
  'renata', 'patricia', 'patrícia', 'vanessa', 'aline', 'karina', 'carolina', 'gabriela', 'larissa', 'talita',
  'luana', 'isabela', 'isabella', 'helena', 'valentina', 'miguel', 'arthur', 'enzo', 'davi', 'henrique', 'vinicius', 'vinícius',
  'luiz', 'luis', 'otavio', 'otávio', 'vitor', 'victor', 'caio', 'andre', 'andré', 'marcelo', 'marcio', 'márcio', 'leonardo',
  'samuel', 'ian', 'kaua', 'kauã', 'yuri', 'bruno', 'alexandre', 'alex', 'cesar', 'césar', 'wilson', 'wesley', 'renan',
  'yasmin', 'yasmim', 'sofia', 'sophia', 'alice', 'clara', 'manuela', 'laura', 'lorena', 'ester', 'rafaela', 'raquel',
  'elaine', 'simone', 'monica', 'mônica', 'claudia', 'cláudia', 'juliana', 'priscila', 'priscilla', 'tatiane', 'taina', 'tainá',
  'debora', 'débora', 'elisangela', 'elisângela', 'regina', 'adriana', 'silvia', 'sílvia', 'fabiana', 'fabio', 'fábio', 'jaqueline',
];

const hopeEmojiOptions = ['💌', '🌷', '🌻', '🌈', '🕊️', '✨', '💛', '🤍', '🌿', '☀️', '🌊', '🤗', '💫', '🫶', '🌸', '🍃', '🌼', '💞'];

const resolveDeviceId = () => {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem('sereno_device_id');
  if (existing) return existing;
  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sereno-${Date.now()}`;
  window.localStorage.setItem('sereno_device_id', next);
  return next;
};

const styleForMessage = (id: string) => {
  const seed = String(id || '0').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return messageStyles[seed % messageStyles.length];
};

export default function MuralEsperancaSection({
  darkMode: dm,
  onCheckAccess,
  onIncrementUsage,
  initialDraft,
  initialDraftKey,
  onNavigate,
  account,
}: {
  darkMode?: boolean,
  onCheckAccess: (action: 'send' | 'receive') => boolean,
  onIncrementUsage: (action: 'send' | 'receive') => void,
  initialDraft?: string,
  initialDraftKey?: string | number,
  onNavigate?: (tab: any, params?: Record<string, any>) => void,
  account?: UserAccountRef,
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<HopeMessage[]>(presetMessages);
  const [history, setHistory] = useState<HopeHistoryEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [receivedMessage, setReceivedMessage] = useState<HopeMessage | null>(null);
  const [viewMode, setViewMode] = useState<'mural' | 'historico'>('mural');
  const [historyFilter, setHistoryFilter] = useState<'sent' | 'received' | 'favorites'>('sent');
  const [deviceId, setDeviceId] = useState('');
  const [loadingWall, setLoadingWall] = useState(true);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [cloudRotationIndex, setCloudRotationIndex] = useState(0);
  const accountId = String(account?.email || '').trim().toLowerCase();

  const clouds = useMemo(() => {
    const maxVisibleClouds = 10;
    const orderedMessages =
      messages.length <= maxVisibleClouds
        ? messages
        : [
            ...messages.slice(cloudRotationIndex),
            ...messages.slice(0, cloudRotationIndex),
          ];

    return orderedMessages.slice(0, maxVisibleClouds).map((msg, i) => ({
      ...msg,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      x: (i % 2 === 0 ? -10 : 10) + (Math.random() * 20 - 10),
      y: Math.random() * 20 - 10,
      scale: 0.8 + Math.random() * 0.4
    }));
  }, [cloudRotationIndex, messages]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'favorites') return history.filter((item) => item.favorite);
    return history.filter((item) => item.source === historyFilter);
  }, [history, historyFilter]);

  const draftModeration = useMemo(() => {
    const trimmed = newMessage.trim();
    if (!trimmed) return { blocked: false, reason: '' };
    if (trimmed.length < 10) return { blocked: true, reason: 'Escreva um pouco mais para apoiar alguém.' };
    const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const normalizedLeet = normalized
      .replace(/[@4]/g, 'a')
      .replace(/[3]/g, 'e')
      .replace(/[1!|]/g, 'i')
      .replace(/[0]/g, 'o')
      .replace(/[$5]/g, 's')
      .replace(/[7]/g, 't')
      .replace(/[^a-z0-9\\s:/._-]/g, '');
    const blockedByName = blockedNames.some((name) => new RegExp(`\\b${name.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')}\\b`, 'i').test(normalizedLeet));
    if (clientForbiddenWords.some((word) => normalizedLeet.includes(word)) || clientForbiddenPatterns.some((pattern) => pattern.test(trimmed) || pattern.test(normalizedLeet)) || blockedByName) {
      return { blocked: true, reason: 'Esse texto não se encaixa nas regras de cuidado do mural.' };
    }
    if (/(http:\/\/|https:\/\/|www\.|bit\.ly|tinyurl|t\.me\/|wa\.me\/|linktr\.ee)/i.test(trimmed)) {
      return { blocked: true, reason: 'Links não são permitidos no mural.' };
    }
    const hasCareSignal = clientCareKeywords.some((word) => normalized.includes(word));
    if (!hasCareSignal && trimmed.split(/\s+/).length < 6) {
      return { blocked: true, reason: 'Deixe a mensagem mais acolhedora e completa.' };
    }
    return { blocked: false, reason: '' };
  }, [newMessage]);

  useEffect(() => {
    setDeviceId(resolveDeviceId());
  }, []);

  useEffect(() => {
    if (!initialDraft) return;
    setIsWriting(true);
    setViewMode('mural');
    setNewMessage(initialDraft);
  }, [initialDraft, initialDraftKey]);

  const checkModeration = (text: string) => {
    const lowerText = text.toLowerCase();
    return !forbiddenWords.some((word) => lowerText.includes(word));
  };

  const pushHistory = (entry: HopeHistoryEntry) => {
    setHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, 50));
  };

  const mapApiMessage = (item: any, source?: 'sent' | 'received'): HopeMessage | HopeHistoryEntry => {
    const style = styleForMessage(item.id);
    const base = {
      id: String(item.id),
      text: String(item.text || ''),
      date: new Date(item.createdAt || item.date || Date.now()).getTime(),
      createdAt: String(item.createdAt || new Date().toISOString()),
      color: `${style.bg} ${style.tx} ${style.border}`,
      icon: item.icon || style.icon,
    };
    if (!source) return base;
    return {
      ...base,
      source,
      favorite: Boolean(item.favorite),
    };
  };

  const loadWall = async () => {
    try {
      const res = await fetch('/api/hope/messages?limit=24', { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.items)) {
        setMessages(data.items.map((item: any) => mapApiMessage(item) as HopeMessage));
      }
    } catch {}
  };

  const loadHistory = async () => {
    if (!deviceId) return;
    try {
      const params = new URLSearchParams({ deviceId });
      if (accountId) params.set('accountId', accountId);
      const res = await fetch(`/api/hope/history?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.items)) {
        setHistory(data.items.map((item: any) => mapApiMessage(item, item.source) as HopeHistoryEntry));
      }
    } catch {}
  };

  useEffect(() => {
    if (!deviceId) return;
    let mounted = true;
    (async () => {
      setLoadingWall(true);
      await Promise.all([loadWall(), loadHistory()]);
      if (mounted) setLoadingWall(false);
    })();
    return () => {
      mounted = false;
    };
  }, [deviceId, accountId]);

  useEffect(() => {
    setCloudRotationIndex(0);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length <= 10) return;

    const intervalId = window.setInterval(() => {
      setCloudRotationIndex((prev) => {
        if (messages.length <= 10) return 0;
        return (prev + 10) % messages.length;
      });
    }, 120000);

    return () => window.clearInterval(intervalId);
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();

    if (trimmed.length < 10) {
      toast({ title: "Mensagem curta", description: "Escreva algo um pouco maior para apoiar alguém.", variant: "destructive" });
      return;
    }

    if (!checkModeration(trimmed)) {
      toast({
        title: "Conteúdo bloqueado",
        description: "Mantenha o foco em apoio, acolhimento e bem-estar.",
        variant: "destructive"
      });
      return;
    }

    if (!onCheckAccess('send')) return;

    (async () => {
      try {
        const res = await fetch('/api/hope/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: trimmed,
            deviceId,
            accountId,
            anonymousAlias: account?.nickname || account?.name || undefined,
          }),
        });
        const data = await res.json();
        if (!data?.ok) {
          const moderationMessage =
            data?.moderationReason === 'links_not_allowed'
              ? 'Links, contatos e formas de identificação não entram no mural.'
              : data?.moderationReason === 'personal_identity_not_allowed'
                ? 'O mural não aceita nomes, identificação pessoal ou dados que revelem quem enviou.'
                : data?.moderationReason === 'outside_wall_purpose'
                  ? 'Tente deixar a mensagem mais acolhedora, gentil e voltada a cuidado.'
                  : 'Esse texto saiu da proposta segura e acolhedora do mural.';
          toast({
            title:
              data?.error === 'rate_limited'
                ? 'Espere um pouco antes de enviar outra'
                : data?.error === 'rate_limited_window'
                  ? 'Muitas mensagens em pouco tempo'
                  : data?.error === 'daily_limit'
                    ? 'Limite de envios de hoje alcançado'
                    : data?.error === 'blocked_by_moderation'
                      ? 'Mensagem fora da proposta do mural'
                      : 'Não foi possível enviar',
            description:
              data?.error === 'rate_limited'
                ? 'Para manter o mural leve e sem flood, aguarde cerca de 1 minuto.'
                : data?.error === 'rate_limited_window'
                  ? 'Faça uma pequena pausa antes de enviar novas cartas.'
                  : data?.error === 'daily_limit'
                    ? 'Hoje você já enviou o máximo previsto para este espaço.'
                    : data?.error === 'blocked_by_moderation'
                      ? moderationMessage
                      : 'Tente novamente em instantes.',
            variant: 'destructive',
          });
          return;
        }

        const newMsg = mapApiMessage(data.item) as HopeMessage;
        setMessages((prev) => [newMsg, ...prev.filter((item) => item.id !== newMsg.id)].slice(0, 50));
        pushHistory({ ...(newMsg as HopeMessage), source: 'sent', favorite: false });
        onIncrementUsage('send');
        setNewMessage('');
        setIsWriting(false);

        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem entrou no mural e ficou salva nas enviadas.",
          className: dm ? 'bg-indigo-900 text-indigo-100 border-indigo-700' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
        });
      } catch {
        toast({ title: 'Erro ao enviar', description: 'Tente novamente em instantes.', variant: 'destructive' });
      }
    })();
  };

  const handleReceiveRandom = () => {
    if (!onCheckAccess('receive') || !deviceId) return;
    (async () => {
      try {
        const res = await fetch('/api/hope/random', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, accountId }),
        });
        const data = await res.json();
        if (!data?.ok) {
          toast({
            title: 'Sem novas cartas agora',
            description: 'Ainda não há uma nova mensagem disponível para você neste momento.',
            className: dm ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-800 border-slate-200',
          });
          return;
        }
        const picked = mapApiMessage({ ...data.item, favorite: false }, 'received') as HopeHistoryEntry;
        setReceivedMessage(picked);
        pushHistory(picked);
        onIncrementUsage('receive');
      } catch {
        toast({ title: 'Erro ao receber', description: 'Tente novamente em instantes.', variant: 'destructive' });
      }
    })();
  };

  const toggleFavorite = (id: string) => {
    const target = history.find((item) => item.id === id);
    const willFavorite = !target?.favorite;
    setHistory((prev) => prev.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item));
    if (receivedMessage?.id === id) {
      setReceivedMessage((prev) => (prev ? { ...prev } : prev));
    }
    (async () => {
      try {
        await fetch('/api/hope/favorite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: id, deviceId, accountId, favorite: willFavorite }),
        });
      } catch {}
    })();
    toast({
      title: willFavorite ? 'Mensagem favoritada' : 'Mensagem removida dos favoritos',
      description: willFavorite ? 'Ela ficou guardada na aba Favoritas.' : 'Ela saiu da sua coleção de favoritas.',
      className: dm ? 'bg-amber-900 text-amber-100 border-amber-700' : 'bg-amber-50 text-amber-900 border-amber-200'
    });
  };

  const forwardToDiary = (text: string) => {
    onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: `Mensagem do Mural de Esperança:\n\n${text}`, diaryDraftKey: Date.now() });
  };

  const forwardToHealthy = (text: string) => {
    onNavigate?.('healthymessages', { healthyMessageDraft: text, healthyMessageDraftKey: Date.now() });
  };

  const reportMessage = async (id: string) => {
    if (reportedIds.includes(id)) return;
    try {
      const res = await fetch('/api/hope/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, deviceId, accountId, reason: 'reported_from_app' }),
      });
      const data = await res.json();
      if (data?.ok) {
        setReportedIds((prev) => [...prev, id]);
        toast({
          title: data.alreadyReported ? 'Já recebemos esse alerta' : 'Mensagem denunciada',
          description: 'Obrigado por ajudar a manter o mural mais seguro.',
          className: dm ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-800 border-slate-200',
        });
      }
    } catch {
      toast({ title: 'Não foi possível denunciar', description: 'Tente novamente em instantes.', variant: 'destructive' });
    }
  };

  const renderHistoryCard = (msg: HopeHistoryEntry) => (
    <div key={`${msg.source}-${msg.id}`} className={`rounded-[1.75rem] border p-5 shadow-sm ${dm ? 'bg-[linear-gradient(180deg,#162033_0%,#121a2c_100%)] border-slate-700 text-slate-100' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] border-gray-200 text-gray-800'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl border ${dm ? 'border-white/10 bg-white/6' : 'border-slate-200 bg-slate-50'}`}>{msg.icon}</div>
          <p className={`mt-2 text-xs font-black uppercase tracking-[0.18em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
            {msg.source === 'sent' ? 'Enviada' : 'Recebida'}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(msg.id)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${msg.favorite ? 'bg-amber-400 text-slate-950 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]' : dm ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          {msg.favorite ? '★ Favorita' : '☆ Favoritar'}
        </button>
      </div>
      <p className="mt-4 text-sm font-semibold leading-relaxed">"{msg.text}"</p>
      <p className={`mt-3 text-xs ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{new Date(msg.date).toLocaleString('pt-BR')}</p>
      {msg.source === 'received' && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={() => navigator.clipboard.writeText(msg.text)} className="rounded-xl py-3 font-bold text-sm bg-emerald-600 text-white">Copiar</button>
          <button onClick={() => forwardToDiary(msg.text)} className="rounded-xl py-3 font-bold text-sm bg-indigo-600 text-white">Levar p/ Diário</button>
          <button onClick={() => forwardToHealthy(msg.text)} className="col-span-2 rounded-xl py-3 font-bold text-sm bg-fuchsia-600 text-white">Levar p/ Eu Saudável</button>
          <button onClick={() => reportMessage(msg.id)} disabled={reportedIds.includes(msg.id)} className={`col-span-2 rounded-xl py-3 font-bold text-sm ${reportedIds.includes(msg.id) ? (dm ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-400 border border-slate-200') : 'bg-rose-600 text-white'}`}>{reportedIds.includes(msg.id) ? 'Denúncia enviada' : 'Denunciar mensagem'}</button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in ${dm ? 'bg-slate-900 text-slate-100' : 'bg-[#fafafa] text-gray-800'}`}>
      <div className="mb-8 pt-2">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Espaço de cuidado anônimo"
          title="Mural de Esperança"
          description="Receba um cuidado simbólico, ofereça uma palavra gentil e guarde o que tocar você."
          icon="💌"
        />
      </div>

      <div className="max-w-xl mx-auto space-y-6 relative">
        {receivedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setReceivedMessage(null)}>
            <div
              className={`w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl animate-slide-up relative transform transition-transform hover:scale-[1.02] ${dm ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%),linear-gradient(180deg,#132238_0%,#1a2541_100%)] text-white border border-white/10' : 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_40%),linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] text-slate-900 border border-white/90'} ${receivedMessage.color}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border text-4xl ${dm ? 'border-white/10 bg-white/8' : 'border-slate-200 bg-white/80 shadow-sm'}`}>{receivedMessage.icon}</div>
              <p className={`text-[11px] font-black uppercase tracking-[0.22em] mb-3 ${dm ? 'text-cyan-200/80' : 'text-cyan-700/80'}`}>Cuidado que chegou até você</p>
              <p className="text-lg font-bold leading-relaxed mb-6 font-serif">"{receivedMessage.text}"</p>
              <div className={`text-xs font-bold uppercase tracking-wider mb-6 ${dm ? 'text-white/55' : 'text-slate-500'}`}>De: alguém anônimo</div>
              <div className="grid gap-3">
                <button onClick={() => toggleFavorite(receivedMessage.id)} className="w-full py-4 rounded-2xl font-bold bg-amber-400 text-slate-950 transition-all active:scale-95 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]">
                  {history.find((item) => item.id === receivedMessage.id)?.favorite ? '★ Favorita' : '☆ Favoritar'}
                </button>
                <button onClick={() => navigator.clipboard.writeText(receivedMessage.text)} className="w-full py-4 rounded-2xl font-bold bg-black/10 hover:bg-black/20 transition-colors active:scale-95">Copiar mensagem</button>
                <button onClick={() => forwardToDiary(receivedMessage.text)} className="w-full py-4 rounded-2xl font-bold bg-indigo-600 text-white">Levar para o Diário</button>
                <button onClick={() => forwardToHealthy(receivedMessage.text)} className="w-full py-4 rounded-2xl font-bold bg-fuchsia-600 text-white">Levar p/ Eu Saudável</button>
                <button onClick={() => reportMessage(receivedMessage.id)} disabled={reportedIds.includes(receivedMessage.id)} className={`w-full py-4 rounded-2xl font-bold transition-colors active:scale-95 ${reportedIds.includes(receivedMessage.id) ? 'bg-black/10 text-slate-500' : 'bg-rose-600 text-white'}`}>{reportedIds.includes(receivedMessage.id) ? 'Denúncia enviada' : 'Denunciar mensagem'}</button>
                <button onClick={() => setReceivedMessage(null)} className="w-full py-4 rounded-2xl font-bold bg-black/10 hover:bg-black/20 transition-colors active:scale-95">Fechar</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setViewMode('mural')} className={`rounded-2xl py-3 text-sm font-bold ${viewMode === 'mural' ? 'bg-indigo-600 text-white' : dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'}`}>Mural vivo</button>
          <button onClick={() => setViewMode('historico')} className={`rounded-2xl py-3 text-sm font-bold ${viewMode === 'historico' ? 'bg-indigo-600 text-white' : dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'}`}>Meu histórico</button>
        </div>

        {viewMode === 'mural' ? (
          <>
            <div className={`rounded-[2rem] border p-5 ${dm ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <p className={`text-sm font-semibold leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-700'}`}>
                Escolha entre receber um gesto de cuidado ou deixar uma mensagem que possa clarear o dia de alguém.
              </p>
            </div>

            {!isWriting ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleReceiveRandom}
                  className={`p-8 rounded-[2rem] border shadow-sm transition-all hover:scale-[1.02] text-left group relative overflow-hidden ${dm ? 'bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_28%),linear-gradient(180deg,rgba(30,41,59,0.95)_0%,rgba(30,64,175,0.2)_100%)] border-indigo-700/70' : 'bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.7),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] border-indigo-100 shadow-[0_18px_34px_rgba(99,102,241,0.10)]'}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/30 transition-colors duration-500"></div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] border text-3xl ${dm ? 'border-white/10 bg-white/8' : 'border-white/80 bg-white/80 shadow-sm'}`}>📬</div>
                  <p className={`mt-5 text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-200/80' : 'text-indigo-700/70'}`}>Receber cuidado</p>
                  <h3 className={`mt-2 font-extrabold text-xl tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>Receber uma carta</h3>
                  <p className={`mt-2 text-sm font-medium leading-relaxed ${dm ? 'text-indigo-100/80' : 'text-indigo-900/70'}`}>Abra uma mensagem simbólica e guarde o que fizer sentido para hoje.</p>
                </button>

                <button
                  onClick={() => setIsWriting(true)}
                  className={`p-8 rounded-[2rem] border shadow-sm transition-all hover:scale-[1.02] text-left group relative overflow-hidden ${dm ? 'bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,rgba(51,31,18,0.95)_0%,rgba(190,24,93,0.18)_100%)] border-amber-700/60' : 'bg-[radial-gradient(circle_at_top_left,rgba(253,230,138,0.7),transparent_28%),linear-gradient(180deg,#fffaf1_0%,#fff3f7_100%)] border-amber-100 shadow-[0_18px_34px_rgba(251,191,36,0.10)]'}`}
                >
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-white/30 transition-colors duration-500"></div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] border text-3xl ${dm ? 'border-white/10 bg-white/8' : 'border-white/80 bg-white/80 shadow-sm'}`}>✍️</div>
                  <p className={`mt-5 text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-amber-200/80' : 'text-amber-700/70'}`}>Oferecer cuidado</p>
                  <h3 className={`mt-2 font-extrabold text-xl tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>Enviar uma carta</h3>
                  <p className={`mt-2 text-sm font-medium leading-relaxed ${dm ? 'text-amber-100/80' : 'text-amber-900/70'}`}>Escreva algo gentil que alguém precisaria encontrar em um dia difícil.</p>
                </button>
              </div>
            ) : (
              <div className={`p-6 sm:p-8 rounded-[2rem] border shadow-lg animate-slide-up ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`font-extrabold text-xl flex items-center gap-2 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>
                    <span>🕊️</span> Nova mensagem
                  </h3>
                  <button onClick={() => setIsWriting(false)} className={`px-3 py-2 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-wide active:scale-95 ${dm ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                </div>

                <div className={`p-4 rounded-xl text-xs font-semibold mb-6 flex items-start gap-3 ${dm ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                  <span className="text-lg">💡</span>
                  <p>Escreva algo que ofereça cuidado, carinho, apoio e esperança. Para manter este espaço seguro, o mural bloqueia conteúdos inadequados ou fora dessa proposta.</p>
                </div>

                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <p className={`mb-2 text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                      Emojis para sua mensagem
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hopeEmojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewMessage((prev) => `${prev}${prev.endsWith(' ') || prev.length === 0 ? '' : ' '}${emoji} `)}
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl transition-all active:scale-95 ${dm ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50'}`}
                          title={`Adicionar ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Você não precisa resolver tudo hoje..."
                    rows={5}
                    className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed ${dm ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                  />
                  {draftModeration.blocked && (
                    <p className={`text-xs font-bold leading-relaxed ${dm ? 'text-amber-300' : 'text-amber-700'}`}>
                      {draftModeration.reason}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button type="submit" disabled={draftModeration.blocked || newMessage.trim().length === 0} className="px-8 py-4 rounded-full font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                      Amarrar no balão e soltar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!isWriting && (
              <div className="pt-8 overflow-hidden min-h-[500px] relative">
                <h3 className={`font-bold mb-12 text-center text-sm uppercase tracking-widest relative z-10 ${dm ? 'text-slate-500' : 'text-gray-400'}`}>
                  {loadingWall ? 'Conectando o mural...' : 'Nuvens de esperança circulando agora'}
                </h3>
                <div className="relative h-full grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16 max-w-2xl mx-auto px-4">
                  {clouds.map((msg, i) => {
                    const style = messageStyles[i % messageStyles.length];
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ y: 0 }}
                        animate={{ y: [0, -15, 0], x: [0, msg.x / 2, 0] }}
                        transition={{ duration: msg.duration, repeat: Infinity, ease: "easeInOut", delay: msg.delay }}
                        className={`p-6 sm:p-8 shadow-xl cursor-default backdrop-blur-sm transform transition-all hover:scale-105 hover:z-20 border-[3px] relative ${style.bg} ${style.tx} ${style.border}`}
                        style={{ borderRadius: '2.5rem', scale: msg.scale * (dm ? 0.85 : 1), opacity: 0.98 }}
                      >
                        <div className={`absolute -top-6 left-6 w-14 h-14 rounded-full border-t-[3px] ${style.bg} ${style.border} -z-10`}></div>
                        <div className={`absolute -top-4 right-10 w-16 h-16 rounded-full border-t-[3px] ${style.bg} ${style.border} -z-10`}></div>
                        <div className={`absolute top-4 -left-5 w-12 h-12 rounded-full border-l-[3px] ${style.bg} ${style.border} -z-10`}></div>
                        <div className={`absolute top-6 -right-4 w-14 h-14 rounded-full border-r-[3px] ${style.bg} ${style.border} -z-10`}></div>
                        <div className="absolute -bottom-6 left-[20%] space-y-1">
                          <div className={`w-4 h-4 rounded-full border-[2px] ${style.bg} ${style.border} shadow-sm`}></div>
                          <div className={`w-2.5 h-2.5 rounded-full border-[2px] -ml-2 ${style.bg} ${style.border} shadow-sm`}></div>
                        </div>
                        <span className="text-2xl block mb-2">{msg.icon}</span>
                        <p className="font-bold text-sm sm:text-base leading-snug tracking-tight drop-shadow-sm">"{msg.text}"</p>
                      </motion.div>
                    );
                  })}
                </div>
                <div className={`mt-16 text-center text-xs font-black uppercase tracking-[0.18em] relative z-10 ${dm ? 'text-slate-500' : 'text-gray-400'}`}>
                  ...e outras mensagens estão circulando pelo mural.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-[2rem] border p-5 ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <p className={`text-sm font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>
                Aqui você navega pelas mensagens que enviou, recebeu e marcou como favoritas.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setHistoryFilter('sent')} className={`rounded-2xl py-3 text-sm font-bold ${historyFilter === 'sent' ? 'bg-indigo-600 text-white' : dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'}`}>Enviadas</button>
              <button onClick={() => setHistoryFilter('received')} className={`rounded-2xl py-3 text-sm font-bold ${historyFilter === 'received' ? 'bg-indigo-600 text-white' : dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'}`}>Recebidas</button>
              <button onClick={() => setHistoryFilter('favorites')} className={`rounded-2xl py-3 text-sm font-bold ${historyFilter === 'favorites' ? 'bg-indigo-600 text-white' : dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'}`}>Favoritas</button>
            </div>
            <div className="grid gap-4">
              {filteredHistory.map(renderHistoryCard)}
              {filteredHistory.length === 0 && (
                <div className={`rounded-[2rem] border p-6 text-sm ${dm ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                  Ainda não há mensagens nessa aba.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
