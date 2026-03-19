'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import { useToast } from '@/hooks/use-toast';
import SectionHeroCard from './SectionHeroCard';

interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: any, params?: Record<string, any>) => void;
  isPro?: boolean;
  onShowUpgrade?: () => void;
}

interface CoupleMember {
  id: string;
  name: string;
  emoji: string;
}

interface CouplePost {
  id: string;
  date: string;
  mood: string;
  note: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  need?: string;
  offer?: string;
  sensitiveTopic?: boolean;
  talkTiming?: 'agora' | 'depois';
}

interface CoupleMessage {
  id: string;
  date: string;
  text: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
}

interface CoupleRoom {
  id: string;
  code: string;
  name: string;
  members: CoupleMember[];
  posts: CouplePost[];
  messages?: CoupleMessage[];
  createdAt: string;
}

const moods = [
  '🛟 Modo apoiador',
  '🆘 Preciso de apoio',
  '😊 Bem',
  '😐 Neutro',
  '😔 Triste',
  '😰 Ansioso',
  '😤 Irritado',
  '💪 Disposto',
  '🥰 Amado',
  '😵 Sobrecarregado',
  '😴 Cansado',
  '🫶 Acolhido',
  '😶 Sensível',
  '😌 Em paz',
  '🧠 Pensativo',
];

const emojis = ['😊', '🥰', '🤍', '💙', '💜', '🫶', '🌷', '🌻', '😌', '😔', '😰', '😤', '😴', '💪'];
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function CoupleModeSection({ darkMode: dm, onNavigate, isPro = false, onShowUpgrade }: Props) {
  const { toast } = useToast();
  const [rooms, setRooms] = useAppPersistence<CoupleRoom[]>('psico_couple_rooms', []);
  const [activeRoomId, setActiveRoomId] = useAppPersistence<string | null>('psico_couple_active_room', null);
  const [deviceMemberByRoom, setDeviceMemberByRoom] = useAppPersistence<Record<string, string>>('psico_couple_device_member', {});
  const [coupleNoticeState, setCoupleNoticeState] = useAppPersistence<Record<string, { checkInId?: string; messageId?: string }>>('psico_couple_notice_state', {});

  const [roomName, setRoomName] = useState('');
  const [myName, setMyName] = useState('');
  const [myEmoji, setMyEmoji] = useState('😊');

  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinEmoji, setJoinEmoji] = useState('🥰');

  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [need, setNeed] = useState('');
  const [offer, setOffer] = useState('');
  const [sensitiveTopic, setSensitiveTopic] = useState(false);
  const [talkTiming, setTalkTiming] = useState<'agora' | 'depois'>('agora');
  const [messageText, setMessageText] = useState('');

  const c = (l: string, d: string) => (dm ? d : l);

  const normalizedRooms = useMemo(
    () =>
      rooms.map((room) => ({
        ...room,
        posts: room.posts.map((post) => ({
          ...post,
          need: post.need || '',
          offer: post.offer || '',
          sensitiveTopic: Boolean(post.sensitiveTopic),
          talkTiming: post.talkTiming || 'agora',
        })),
        messages: room.messages || [],
      })),
    [rooms]
  );

  const activeRoom = useMemo(() => normalizedRooms.find((r) => r.id === activeRoomId) || null, [normalizedRooms, activeRoomId]);
  const myMemberId = activeRoomId ? deviceMemberByRoom[activeRoomId] : undefined;
  const myMember = activeRoom?.members.find((m) => m.id === myMemberId) || null;

  const latestPost = activeRoom?.posts[0] || null;
  const latestFromPartner = activeRoom?.posts.find((post) => post.authorId !== myMemberId) || null;
  const latestPartnerMessage = activeRoom?.messages?.find((message) => message.authorId !== myMemberId) || null;

  const supportGuide = useMemo(() => {
    if (!latestFromPartner) return 'Quando o outro ainda não registrou um check-in, combine um horário simples para se escutarem.';
    if (latestFromPartner.mood.includes('Preciso de apoio') || latestFromPartner.mood.includes('Ansioso') || latestFromPartner.sensitiveTopic) {
      return 'Valide primeiro, reduza interpretação e combine se a conversa precisa acontecer agora ou com mais calma.';
    }
    if (latestFromPartner.mood.includes('Irritado') || latestFromPartner.mood.includes('Sobrecarregado')) {
      return 'Evite corrigir no impulso. Nomeie o que ouviu e ofereça pausa antes de discutir solução.';
    }
    return 'Pergunte do que a pessoa precisa hoje e confirme o combinado antes de presumir ajuda.';
  }, [latestFromPartner]);

  const nextStep = useMemo(() => {
    if (!latestPost && !latestFromPartner) return 'Comecem com um check-in simples para alinhar como cada um chega hoje.';
    if (latestFromPartner?.talkTiming === 'depois') return 'O próximo passo do casal pode ser combinar um horário seguro para retomar esse assunto.';
    if (latestFromPartner?.need) return `O próximo passo pode ser responder a este pedido: ${latestFromPartner.need}`;
    return 'Se ambos já fizeram check-in, retomem o ponto sensível usando tom breve e claro.';
  }, [latestPost, latestFromPartner]);

  const createRoom = () => {
    const name = myName.trim();
    if (!name) {
      toast({ title: 'Nome vazio', description: 'Digite seu nome para criar o espaço do casal.' });
      return;
    }
    const me: CoupleMember = { id: crypto.randomUUID(), name, emoji: myEmoji };
    const room: CoupleRoom = {
      id: crypto.randomUUID(),
      code: genCode(),
      name: roomName.trim() || 'Nosso Espaço',
      members: [me],
      posts: [],
      createdAt: new Date().toISOString(),
    };
    setRooms([room, ...normalizedRooms]);
    setActiveRoomId(room.id);
    setDeviceMemberByRoom({ ...deviceMemberByRoom, [room.id]: me.id });
    setRoomName('');
    setMyName('');
    toast({ title: 'Espaço criado', description: 'Agora você pode copiar o convite e enviar para o parceiro.' });
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    const name = joinName.trim();
    if (!code || !name) {
      toast({ title: 'Dados incompletos', description: 'Preencha código e nome para entrar.' });
      return;
    }

    const idx = normalizedRooms.findIndex((r) => r.code === code);
    if (idx < 0) {
      toast({ title: 'Código não encontrado', description: 'Revise o convite e tente novamente.', variant: 'destructive' });
      return;
    }

    const target = normalizedRooms[idx];
    if (target.members.length >= 2 && !target.members.find((m) => m.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Espaço completo', description: 'Esse espaço já está com duas pessoas.', variant: 'destructive' });
      return;
    }

    const existing = target.members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    const member = existing || { id: crypto.randomUUID(), name, emoji: joinEmoji };
    const updated = existing ? target : { ...target, members: [...target.members, member] };
    const clone = [...normalizedRooms];
    clone[idx] = updated;
    setRooms(clone);
    setActiveRoomId(updated.id);
    setDeviceMemberByRoom({ ...deviceMemberByRoom, [updated.id]: member.id });
    setJoinName('');
    toast({ title: 'Entrada confirmada', description: `Você entrou em ${updated.name}.` });
  };

  const inviteLink = useMemo(() => {
    if (!activeRoom) return '';
    if (typeof window === 'undefined') return `?coupleInvite=${activeRoom.code}`;
    return `${window.location.origin}${window.location.pathname}?coupleInvite=${activeRoom.code}`;
  }, [activeRoom]);

  const copyInvite = async () => {
    if (!activeRoom) return;
    const text = `Convite Modo Casal (Sereno)\nCódigo: ${activeRoom.code}\nLink: ${inviteLink}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Convite copiado', description: 'O código e o link estão prontos para enviar.' });
    } catch {
      toast({ title: 'Falha ao copiar', description: 'Copie o código manualmente.', variant: 'destructive' });
    }
  };

  const addPost = () => {
    if (!activeRoom || !myMember || !mood) {
      toast({ title: 'Check-in incompleto', description: 'Escolha pelo menos o estado emocional antes de publicar.' });
      return;
    }

    const post: CouplePost = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mood,
      note: note.trim(),
      authorId: myMember.id,
      authorName: myMember.name,
      authorEmoji: myMember.emoji,
      need: need.trim(),
      offer: offer.trim(),
      sensitiveTopic,
      talkTiming,
    };

    setRooms(normalizedRooms.map((room) => (room.id === activeRoom.id ? { ...room, posts: [post, ...room.posts] } : room)));
    setMood('');
    setNote('');
    setNeed('');
    setOffer('');
    setSensitiveTopic(false);
    setTalkTiming('agora');
    toast({ title: 'Check-in publicado', description: 'O mural do casal foi atualizado.' });
  };

  const addMessage = () => {
    if (!activeRoom || !myMember || !messageText.trim()) {
      toast({ title: 'Mensagem vazia', description: 'Escreva algo antes de enviar.' });
      return;
    }

    const message: CoupleMessage = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      text: messageText.trim(),
      authorId: myMember.id,
      authorName: myMember.name,
      authorEmoji: myMember.emoji,
    };

    setRooms(
      normalizedRooms.map((room) =>
        room.id === activeRoom.id
          ? { ...room, messages: [message, ...(room.messages || [])] }
          : room
      )
    );
    setMessageText('');
    toast({ title: 'Mensagem enviada', description: 'A conversa do casal foi atualizada.' });
  };

  useEffect(() => {
    if (!activeRoomId || typeof window === 'undefined' || !('Notification' in window)) return;
    const noticeState = coupleNoticeState[activeRoomId] || {};
    const nextState = { ...noticeState };

    if (latestFromPartner?.id && noticeState.checkInId !== latestFromPartner.id) {
      nextState.checkInId = latestFromPartner.id;
      if (Notification.permission === 'granted') {
        new Notification('Modo Casal', {
          body: `${latestFromPartner.authorName} publicou um novo check-in: ${latestFromPartner.mood}`,
        });
      }
    }

    if (latestPartnerMessage?.id && noticeState.messageId !== latestPartnerMessage.id) {
      nextState.messageId = latestPartnerMessage.id;
      if (Notification.permission === 'granted') {
        new Notification('Modo Casal', {
          body: `${latestPartnerMessage.authorName}: ${latestPartnerMessage.text}`,
        });
      }
    }

    if (nextState.checkInId !== noticeState.checkInId || nextState.messageId !== noticeState.messageId) {
      setCoupleNoticeState({ ...coupleNoticeState, [activeRoomId]: nextState });
    }
  }, [activeRoomId, latestFromPartner, latestPartnerMessage]);

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Conexão a dois"
          title="Modo Casal"
          description="Um espaço para compartilhar estado emocional, pedir apoio, nomear tensão e reparar a conexão sem escalar."
          icon="💑"
        />
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-rose-50 border-rose-100', 'bg-rose-950/20 border-rose-900/40')}`}>
        <p className="text-sm font-semibold leading-relaxed">
          Aqui vocês alinham estado, pedido, oferta e jeito de conversar com menos ruído.
        </p>
      </div>

      {!activeRoom && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Se quiser apoio extra</p>
            <div className="grid gap-3 mt-4">
              <ActionCard darkMode={!!dm} title="Linguagens do Amor" text="Para entender como cada um lê cuidado, afeto e reconhecimento dentro do vínculo." onClick={() => onNavigate?.('lovelanguages')} />
              <ActionCard darkMode={!!dm} title="Método dos 5 Dedos" text="Para organizar uma conversa difícil antes de falar, sem cair em ataque ou defesa." onClick={() => onNavigate?.('fivefingers')} />
              <ActionCard darkMode={!!dm} title="O Poder do NÃO" text="Para sustentar limites sem agressividade quando o pedido do casal pesa demais." onClick={() => onNavigate?.('assertiveness')} />
            </div>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Nosso espaço</h3>
            <p className={`text-sm mb-4 ${c('text-slate-600', 'text-slate-400')}`}>
              Uma pessoa cria o espaço e envia um único código para o parceiro entrar.
            </p>
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Nome do espaço (opcional)" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">
              {emojis.map((emoji) => (
                <button key={emoji} onClick={() => setMyEmoji(emoji)} className={`w-9 h-9 rounded-lg ${myEmoji === emoji ? 'bg-pink-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <button onClick={createRoom} className="w-full py-3 rounded-xl bg-pink-600 text-white font-bold">Criar espaço</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Entrar no espaço</h3>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Código do convite" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">
              {emojis.map((emoji) => (
                <button key={emoji} onClick={() => setJoinEmoji(emoji)} className={`w-9 h-9 rounded-lg ${joinEmoji === emoji ? 'bg-rose-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <button onClick={joinRoom} className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold">Entrar</button>
          </div>
        </>
      )}

      {activeRoom && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold">💞 {activeRoom.name}</h3>
                <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Código: <strong>{activeRoom.code}</strong> • {activeRoom.members.length}/2 participantes</p>
              </div>
              <button onClick={() => setActiveRoomId(null)} className="text-xs text-slate-500">Trocar</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {activeRoom.members.map((member) => (
                <div key={member.id} className={`rounded-2xl p-3 border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
                  <p className="font-bold">{member.emoji} {member.name}</p>
                  <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{member.id === myMemberId ? 'Você neste aparelho' : 'Parceiro(a)'}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={copyInvite} className="w-full py-2 rounded-xl bg-pink-600 text-white font-bold text-sm">Copiar convite</button>
              <button
                onClick={async () => {
                  if (typeof window !== 'undefined' && 'Notification' in window) {
                    const permission = await Notification.requestPermission();
                    toast({ title: 'Notificações do casal', description: permission === 'granted' ? 'Permissão liberada.' : 'Permissão não concedida.' });
                  }
                }}
                className={`w-full py-2 rounded-xl font-bold text-sm ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200')}`}
              >
                Ativar notificações
              </button>
            </div>
          </div>

          <div className="grid gap-4 mb-5">
            <InsightCard darkMode={!!dm} title="Apoio de hoje" text={supportGuide} />
            {isPro ? (
              <>
                <InsightCard darkMode={!!dm} title="Falar sem escalar" text="Descreva o que percebeu, nomeie o que sentiu e só então faça um pedido. Evite juntar assunto antigo com o ponto de agora." />
                <InsightCard darkMode={!!dm} title="Próximo passo do casal" text={nextStep} />
              </>
            ) : (
              <div className={`rounded-3xl border p-4 ${dm ? 'bg-fuchsia-950/20 border-fuchsia-900/30 text-slate-100' : 'bg-fuchsia-50/80 border-fuchsia-200 text-slate-800'}`}>
                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Modo Casal avançado no Pro</p>
                <p className="mt-2 text-sm leading-relaxed">No grátis, o casal já tem check-in básico. No Pro, entram mensagens privadas, leitura guiada do momento, próximo passo do casal e apoio mais rico para conversas delicadas.</p>
                <button onClick={() => onShowUpgrade?.()} className="mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white transition-all active:scale-95">Ver plano Pro</button>
              </div>
            )}
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Check-in</h3>
            <p className={`text-xs mb-3 ${c('text-slate-500', 'text-slate-400')}`}>
              Registre como você chega hoje, o que precisa e o que consegue oferecer.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {['🛟 Modo apoiador', '🆘 Preciso de apoio'].map((m) => (
                <button key={m} onClick={() => setMood(m)} className={`py-2 rounded-xl text-xs font-black ${mood === m ? 'bg-pink-500 text-white' : c('bg-pink-50 text-pink-700', 'bg-slate-700 text-slate-200')}`}>
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {moods.filter((m) => !m.includes('Modo') && !m.includes('Preciso')).map((m) => (
                <button key={m} onClick={() => setMood(m)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${mood === m ? 'bg-pink-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>
                  {m}
                </button>
              ))}
            </div>

            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="O que está acontecendo em você hoje?" className={`w-full min-h-[90px] p-3 rounded-xl border text-sm mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
            <input value={need} onChange={(e) => setNeed(e.target.value)} placeholder="O que eu preciso de você hoje" className={`w-full p-3 rounded-xl text-sm mb-3 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="O que eu consigo oferecer hoje" className={`w-full p-3 rounded-xl text-sm mb-3 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => setSensitiveTopic((prev) => !prev)}
                className={`rounded-xl py-3 text-sm font-bold ${sensitiveTopic ? 'bg-amber-500 text-slate-950' : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300')}`}
              >
                {sensitiveTopic ? 'Assunto sensível' : 'Marcar assunto sensível'}
              </button>
              <div className={`grid grid-cols-2 gap-2 rounded-xl p-2 ${c('bg-slate-50', 'bg-slate-900')}`}>
                <button onClick={() => setTalkTiming('agora')} className={`rounded-lg py-2 text-xs font-bold ${talkTiming === 'agora' ? 'bg-indigo-600 text-white' : c('bg-white text-slate-700', 'bg-slate-800 text-slate-300')}`}>Conversar agora</button>
                <button onClick={() => setTalkTiming('depois')} className={`rounded-lg py-2 text-xs font-bold ${talkTiming === 'depois' ? 'bg-indigo-600 text-white' : c('bg-white text-slate-700', 'bg-slate-800 text-slate-300')}`}>Conversar depois</button>
              </div>
            </div>

            <button onClick={addPost} className="w-full mt-1 py-3 rounded-xl bg-pink-600 text-white font-bold">Publicar check-in</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Conversas e pedidos</h3>
            {isPro ? (
              <div className={`rounded-2xl border p-4 mb-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
                <p className="text-sm font-bold">Conversa do casal</p>
                <p className={`mt-1 text-xs ${c('text-slate-500', 'text-slate-400')}`}>Mensagens curtas para alinhar o momento antes ou depois do check-in.</p>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escreva uma mensagem breve para o parceiro(a)..."
                  className={`w-full min-h-[84px] p-3 rounded-xl border text-sm mt-3 ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}
                />
                <button onClick={addMessage} className="w-full mt-3 py-3 rounded-xl bg-indigo-600 text-white font-bold">Enviar mensagem</button>
              </div>
            ) : null}
            <div className="grid gap-3">
              <ActionCard darkMode={!!dm} title="Linguagens do Amor" text="Ajuda a pedir afeto e cuidado com mais clareza." onClick={() => onNavigate?.('lovelanguages')} />
              <ActionCard darkMode={!!dm} title="Método dos 5 Dedos" text="Útil para organizar uma conversa difícil antes de falar." onClick={() => onNavigate?.('fivefingers')} />
              <ActionCard darkMode={!!dm} title="O Poder do NÃO" text="Ajuda a colocar limite sem agressividade dentro do vínculo." onClick={() => onNavigate?.('assertiveness')} />
              <ActionCard darkMode={!!dm} title="Carta Terapêutica" text="Para elaborar o que está pesado antes de levar para o casal." onClick={() => onNavigate?.('carta', { cartaType: 'personalizada' })} />
              <ActionCard darkMode={!!dm} title="Calendário de Terapia" text="Se este assunto for importante, podem levar para a próxima sessão." onClick={() => onNavigate?.('therapycalendar')} />
            </div>
          </div>

          <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Histórico</h3>
            <div className="space-y-3">
              {isPro && (activeRoom.messages || []).slice(0, 12).map((message) => (
                <div key={message.id} className={`p-4 rounded-2xl border ${c('bg-indigo-50 border-indigo-100', 'bg-indigo-950/20 border-indigo-900/40')}`}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold">{message.authorEmoji} {message.authorName}</p>
                      <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{new Date(message.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className={`text-xs font-bold ${c('text-indigo-700', 'text-indigo-300')}`}>Conversa</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{message.text}</p>
                </div>
              ))}
              {activeRoom.posts.slice(0, 20).map((entry) => (
                <div key={entry.id} className={`p-4 rounded-2xl border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold">{entry.authorEmoji} {entry.authorName}</p>
                      <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{new Date(entry.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{entry.mood}</p>
                      <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{entry.talkTiming === 'agora' ? 'Conversar agora' : 'Conversar depois'}</p>
                    </div>
                  </div>
                  {entry.note && <p className="mt-3 text-sm leading-relaxed">{entry.note}</p>}
                  {(entry.need || entry.offer || entry.sensitiveTopic) && (
                    <div className="grid gap-2 mt-3">
                      {entry.need && <MiniInfo darkMode={!!dm} label="Preciso de você" text={entry.need} />}
                      {entry.offer && <MiniInfo darkMode={!!dm} label="Consigo oferecer" text={entry.offer} />}
                      {entry.sensitiveTopic && <MiniInfo darkMode={!!dm} label="Sinalização" text="Esse check-in marca um assunto sensível." />}
                    </div>
                  )}
                </div>
              ))}
              {activeRoom.posts.length === 0 && <p className={`text-sm ${c('text-slate-500', 'text-slate-400')}`}>Ainda não há check-ins neste espaço.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({ darkMode, title, text }: { darkMode: boolean; title: string; text: string }) {
  return (
    <div className={`rounded-3xl border p-4 ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
      <p className="text-base font-bold">{title}</p>
      <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>
    </div>
  );
}

function ActionCard({
  darkMode,
  title,
  text,
  onClick,
}: {
  darkMode: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`w-full min-h-[96px] rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
      <p className="font-bold leading-tight">{title}</p>
      <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{text}</p>
    </button>
  );
}

function MiniInfo({ darkMode, label, text }: { darkMode: boolean; label: string; text: string }) {
  return (
    <div className={`rounded-xl p-3 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}
