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

interface FamilyMember {
  id: string;
  name: string;
  emoji: string;
}

interface FamilyReply {
  id: string;
  memberId: string;
  memberName: string;
  memberEmoji: string;
  text: string;
  date: string;
}

interface FamilyMessage {
  id: string;
  memberId: string;
  memberName: string;
  memberEmoji: string;
  text: string;
  date: string;
}

interface FamilyPost {
  id: string;
  memberId: string;
  memberName: string;
  memberEmoji: string;
  mood: string;
  note: string;
  date: string;
  type: 'emocao' | 'frustracao' | 'elogio' | 'pedido' | 'pensamento';
  reactions: Record<string, number>;
  replies: FamilyReply[];
  whatHappened: string;
  needFromFamily: string;
  whatICanOffer: string;
  sensitiveTopic: boolean;
  talkTiming: 'agora' | 'depois';
}

interface FamilyAgreement {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  members: FamilyMember[];
  posts: FamilyPost[];
  messages: FamilyMessage[];
  agreements: FamilyAgreement[];
}

const moods = ['😊 Bem', '😐 Neutro', '😔 Triste', '😰 Ansioso', '😤 Irritado', '🤗 Apoiado', '😵 Sobrecarregado', '😶 Sensível'];
const emojis = ['😊', '😔', '😰', '😤', '😴', '🤗', '🧠', '🌟', '😎', '🥹', '🙂', '🙃', '😶‍🌫️', '😌', '😇', '🥰', '🤍', '💙', '💜', '🫶', '🙏', '💪', '🌈', '🌻', '🍀', '🕊️'];
const postTypes: Array<{ id: FamilyPost['type']; label: string; emoji: string }> = [
  { id: 'emocao', label: 'Emoção', emoji: '💭' },
  { id: 'frustracao', label: 'Frustração', emoji: '😮‍💨' },
  { id: 'elogio', label: 'Elogio', emoji: '👏' },
  { id: 'pedido', label: 'Pedido de apoio', emoji: '🆘' },
  { id: 'pensamento', label: 'Pensamento', emoji: '🧠' },
];
const reactionEmojis = ['❤️', '👏', '🤝', '💪', '🙏', '🫶'];
const generateCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function FamilyModeSection({ darkMode: dm, onNavigate, isPro = false, onShowUpgrade }: Props) {
  const { toast } = useToast();
  const [groups, setGroups] = useAppPersistence<FamilyGroup[]>('psico_family_groups', []);
  const [activeGroupId, setActiveGroupId] = useAppPersistence<string | null>('psico_family_active_group', null);
  const [deviceMemberByGroup, setDeviceMemberByGroup] = useAppPersistence<Record<string, string>>('psico_family_device_member', {});
  const [familyNoticeState, setFamilyNoticeState] = useAppPersistence<Record<string, { postId?: string; messageId?: string }>>('psico_family_notice_state', {});

  const [groupName, setGroupName] = useState('');
  const [myName, setMyName] = useState('');
  const [myEmoji, setMyEmoji] = useState('😊');

  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinEmoji, setJoinEmoji] = useState('😊');

  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [postType, setPostType] = useState<FamilyPost['type']>('emocao');
  const [whatHappened, setWhatHappened] = useState('');
  const [needFromFamily, setNeedFromFamily] = useState('');
  const [whatICanOffer, setWhatICanOffer] = useState('');
  const [sensitiveTopic, setSensitiveTopic] = useState(false);
  const [talkTiming, setTalkTiming] = useState<'agora' | 'depois'>('agora');
  const [familyMessage, setFamilyMessage] = useState('');
  const [agreementDraft, setAgreementDraft] = useState('');
  const [replyDraftByPost, setReplyDraftByPost] = useState<Record<string, string>>({});
  const [onlySupport, setOnlySupport] = useState(false);

  const c = (l: string, d: string) => (dm ? d : l);

  const normalizedGroups = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        posts: group.posts.map((post) => ({
          ...post,
          reactions: post.reactions || {},
          replies: post.replies || [],
          whatHappened: post.whatHappened || '',
          needFromFamily: post.needFromFamily || '',
          whatICanOffer: post.whatICanOffer || '',
          sensitiveTopic: Boolean(post.sensitiveTopic),
          talkTiming: post.talkTiming || 'agora',
        })),
        messages: group.messages || [],
        agreements: group.agreements || [],
      })),
    [groups]
  );

  const activeGroup = useMemo(() => normalizedGroups.find((g) => g.id === activeGroupId) || null, [normalizedGroups, activeGroupId]);
  const myMemberId = activeGroupId ? deviceMemberByGroup[activeGroupId] : undefined;
  const myMember = activeGroup?.members.find((m) => m.id === myMemberId) || null;
  const latestOtherPost = activeGroup?.posts.find((post) => post.memberId !== myMemberId) || null;
  const latestOtherMessage = activeGroup?.messages.find((message) => message.memberId !== myMemberId) || null;

  const filteredPosts = useMemo(() => {
    if (!activeGroup) return [] as FamilyPost[];
    return onlySupport ? activeGroup.posts.filter((p) => p.type === 'pedido') : activeGroup.posts;
  }, [activeGroup, onlySupport]);

  const latestSupportPost = activeGroup?.posts.find((post) => post.type === 'pedido' || post.needFromFamily) || null;
  const latestSensitivePost = activeGroup?.posts.find((post) => post.sensitiveTopic) || null;

  const careGuide = useMemo(() => {
    if (!latestSupportPost) return 'Quando ninguém pediu apoio explicitamente, vale começar perguntando como cada pessoa está chegando hoje.';
    return `${latestSupportPost.memberName} está pedindo algo à família. Comecem validando o estado emocional antes de responder ou corrigir.`;
  }, [latestSupportPost]);

  const needsCare = useMemo(() => {
    if (!latestSensitivePost) return 'Hoje o grupo não marcou nenhum tema sensível. Ainda assim, manter clareza e turnos de fala ajuda a reduzir ruído.';
    return `Há um tema sensível no grupo. Evitem juntar assuntos antigos com o ponto atual e combinem se a conversa precisa acontecer agora ou depois.`;
  }, [latestSensitivePost]);

  const nextAgreement = useMemo(() => {
    if (activeGroup?.agreements?.length) return `Último combinado registrado: ${activeGroup.agreements[0].text}`;
    if (latestSupportPost?.needFromFamily) return `Próximo combinado possível: responder ao pedido "${latestSupportPost.needFromFamily}".`;
    return 'Depois do check-in, registrem um combinado simples para a convivência desta semana.';
  }, [activeGroup, latestSupportPost]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('familyInvite');
    if (code) setJoinCode(code.toUpperCase());
  }, []);

  useEffect(() => {
    if (!activeGroupId || typeof window === 'undefined' || !('Notification' in window)) return;
    const noticeState = familyNoticeState[activeGroupId] || {};
    const nextState = { ...noticeState };

    if (latestOtherPost?.id && noticeState.postId !== latestOtherPost.id) {
      nextState.postId = latestOtherPost.id;
      if (Notification.permission === 'granted') {
        new Notification('Modo Família', {
          body: `${latestOtherPost.memberName} publicou um novo check-in: ${latestOtherPost.mood}`,
        });
      }
    }

    if (latestOtherMessage?.id && noticeState.messageId !== latestOtherMessage.id) {
      nextState.messageId = latestOtherMessage.id;
      if (Notification.permission === 'granted') {
        new Notification('Modo Família', {
          body: `${latestOtherMessage.memberName}: ${latestOtherMessage.text}`,
        });
      }
    }

    if (nextState.postId !== noticeState.postId || nextState.messageId !== noticeState.messageId) {
      setFamilyNoticeState({ ...familyNoticeState, [activeGroupId]: nextState });
    }
  }, [activeGroupId, latestOtherPost, latestOtherMessage]);

  const createGroup = () => {
    const gName = groupName.trim();
    const uName = myName.trim();
    if (!gName || !uName) {
      toast({ title: 'Dados incompletos', description: 'Preencha o nome do grupo e o seu nome.' });
      return;
    }

    const member: FamilyMember = { id: crypto.randomUUID(), name: uName, emoji: myEmoji };
    const newGroup: FamilyGroup = {
      id: crypto.randomUUID(),
      name: gName,
      code: generateCode(),
      createdAt: new Date().toISOString(),
      members: [member],
      posts: [],
      messages: [],
      agreements: [],
    };

    setGroups([newGroup, ...normalizedGroups]);
    setActiveGroupId(newGroup.id);
    setDeviceMemberByGroup({ ...deviceMemberByGroup, [newGroup.id]: member.id });
    setGroupName('');
    setMyName('');
    toast({ title: 'Grupo criado', description: 'Agora você pode copiar o convite e enviar para a família.' });
  };

  const joinGroup = () => {
    const code = joinCode.trim().toUpperCase();
    const name = joinName.trim();
    if (!code || !name) {
      toast({ title: 'Dados incompletos', description: 'Preencha código e nome para entrar.' });
      return;
    }

    const idx = normalizedGroups.findIndex((g) => g.code === code);
    if (idx < 0) {
      toast({ title: 'Grupo não encontrado', description: 'Verifique o convite e tente novamente.', variant: 'destructive' });
      return;
    }

    const target = normalizedGroups[idx];
    const existing = target.members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    const member: FamilyMember = existing || { id: crypto.randomUUID(), name, emoji: joinEmoji };
    const updated: FamilyGroup = existing ? target : { ...target, members: [...target.members, member] };
    const clone = [...normalizedGroups];
    clone[idx] = updated;

    setGroups(clone);
    setActiveGroupId(updated.id);
    setDeviceMemberByGroup({ ...deviceMemberByGroup, [updated.id]: member.id });
    setJoinName('');
    toast({ title: 'Entrada confirmada', description: `Você entrou em ${updated.name}.` });
  };

  const inviteLink = useMemo(() => {
    if (!activeGroup) return '';
    if (typeof window === 'undefined') return `?familyInvite=${activeGroup.code}`;
    return `${window.location.origin}${window.location.pathname}?familyInvite=${activeGroup.code}`;
  }, [activeGroup]);

  const copyInvite = async () => {
    if (!activeGroup) return;
    const text = `Entre no meu grupo familiar no Sereno:\n${inviteLink}\n\nCódigo do grupo: ${activeGroup.code}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Convite copiado', description: 'O link e o código estão prontos para compartilhar.' });
    } catch {
      toast({ title: 'Falha ao copiar', description: 'Copie o código manualmente.', variant: 'destructive' });
    }
  };

  const postCheckin = () => {
    if (!activeGroup || !myMember || !mood) {
      toast({ title: 'Check-in incompleto', description: 'Escolha pelo menos o estado emocional antes de publicar.' });
      return;
    }

    const post: FamilyPost = {
      id: crypto.randomUUID(),
      memberId: myMember.id,
      memberName: myMember.name,
      memberEmoji: myMember.emoji,
      mood,
      note: note.trim(),
      date: new Date().toISOString(),
      type: postType,
      reactions: {},
      replies: [],
      whatHappened: whatHappened.trim(),
      needFromFamily: needFromFamily.trim(),
      whatICanOffer: whatICanOffer.trim(),
      sensitiveTopic,
      talkTiming,
    };

    setGroups(normalizedGroups.map((group) => (group.id === activeGroup.id ? { ...group, posts: [post, ...group.posts] } : group)));
    setMood('');
    setNote('');
    setPostType('emocao');
    setWhatHappened('');
    setNeedFromFamily('');
    setWhatICanOffer('');
    setSensitiveTopic(false);
    setTalkTiming('agora');
    toast({ title: 'Check-in publicado', description: 'O mural da família foi atualizado.' });
  };

  const reactToPost = (postId: string, emoji: string) => {
    if (!activeGroup) return;
    setGroups(
      normalizedGroups.map((group) => {
        if (group.id !== activeGroup.id) return group;
        return {
          ...group,
          posts: group.posts.map((post) =>
            post.id === postId ? { ...post, reactions: { ...post.reactions, [emoji]: (post.reactions?.[emoji] || 0) + 1 } } : post
          ),
        };
      })
    );
  };

  const addReply = (postId: string) => {
    if (!activeGroup || !myMember) return;
    const raw = (replyDraftByPost[postId] || '').trim();
    if (!raw) return;

    const reply: FamilyReply = {
      id: crypto.randomUUID(),
      memberId: myMember.id,
      memberName: myMember.name,
      memberEmoji: myMember.emoji,
      text: raw,
      date: new Date().toISOString(),
    };

    setGroups(
      normalizedGroups.map((group) => {
        if (group.id !== activeGroup.id) return group;
        return {
          ...group,
          posts: group.posts.map((post) => (post.id === postId ? { ...post, replies: [...post.replies, reply] } : post)),
        };
      })
    );
    setReplyDraftByPost((prev) => ({ ...prev, [postId]: '' }));
  };

  const sendFamilyMessage = () => {
    if (!activeGroup || !myMember || !familyMessage.trim()) {
      toast({ title: 'Mensagem vazia', description: 'Escreva algo antes de enviar.' });
      return;
    }

    const message: FamilyMessage = {
      id: crypto.randomUUID(),
      memberId: myMember.id,
      memberName: myMember.name,
      memberEmoji: myMember.emoji,
      text: familyMessage.trim(),
      date: new Date().toISOString(),
    };

    setGroups(
      normalizedGroups.map((group) =>
        group.id === activeGroup.id ? { ...group, messages: [message, ...(group.messages || [])] } : group
      )
    );
    setFamilyMessage('');
    toast({ title: 'Mensagem enviada', description: 'A conversa da família foi atualizada.' });
  };

  const saveAgreement = () => {
    if (!activeGroup || !myMember || !agreementDraft.trim()) {
      toast({ title: 'Combinado vazio', description: 'Escreva o combinado antes de salvar.' });
      return;
    }

    const agreement: FamilyAgreement = {
      id: crypto.randomUUID(),
      text: agreementDraft.trim(),
      createdAt: new Date().toISOString(),
      authorName: myMember.name,
    };

    setGroups(
      normalizedGroups.map((group) =>
        group.id === activeGroup.id ? { ...group, agreements: [agreement, ...(group.agreements || [])] } : group
      )
    );
    setAgreementDraft('');
    toast({ title: 'Combinado salvo', description: 'O grupo agora tem um próximo passo registrado.' });
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Convivência e cuidado"
          title="Modo Família"
          description="Um espaço para acompanhar o clima da família, pedir apoio, reduzir ruído na convivência e construir combinados."
          icon="👨‍👩‍👧"
        />
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-amber-50 border-amber-100', 'bg-amber-950/20 border-amber-900/40')}`}>
        <p className="text-sm font-semibold leading-relaxed">
          Aqui o foco é nomear tensão, organizar pedidos e criar combinados mais úteis para a convivência.
        </p>
      </div>

      {!activeGroup && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Se quiser apoio extra</p>
            <div className="grid gap-3 mt-4">
              <ActionCard darkMode={!!dm} title="O Poder do NÃO" text="Para colocar limite com mais clareza quando a família mistura cuidado com cobrança." onClick={() => onNavigate?.('assertiveness')} />
              <ActionCard darkMode={!!dm} title="Método dos 5 Dedos" text="Para preparar uma conversa delicada sem generalizar, acusar ou reabrir tudo de uma vez." onClick={() => onNavigate?.('fivefingers')} />
              <ActionCard darkMode={!!dm} title="Linguagens do Amor" text="Para perceber como cada pessoa lê cuidado, ajuda e reconhecimento dentro da casa." onClick={() => onNavigate?.('lovelanguages')} />
            </div>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Nosso grupo</h3>
            <p className={`text-sm mb-4 ${c('text-slate-600', 'text-slate-400')}`}>
              Uma pessoa cria o grupo e compartilha o código com os demais membros da família.
            </p>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nome do grupo (ex: Família Silva)" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">
              {emojis.map((emoji) => (
                <button key={emoji} onClick={() => setMyEmoji(emoji)} className={`w-9 h-9 rounded-lg ${myEmoji === emoji ? 'bg-blue-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{emoji}</button>
              ))}
            </div>
            <button onClick={createGroup} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold">Criar grupo</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Entrar em grupo existente</h3>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Código do grupo" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">
              {emojis.map((emoji) => (
                <button key={emoji} onClick={() => setJoinEmoji(emoji)} className={`w-9 h-9 rounded-lg ${joinEmoji === emoji ? 'bg-emerald-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{emoji}</button>
              ))}
            </div>
            <button onClick={joinGroup} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">Entrar no grupo</button>
          </div>
        </>
      )}

      {activeGroup && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold">👪 {activeGroup.name}</h3>
                <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Código: <strong>{activeGroup.code}</strong> • {activeGroup.members.length} membros</p>
              </div>
              <button onClick={() => setActiveGroupId(null)} className="text-xs text-slate-500">Trocar grupo</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {activeGroup.members.map((member) => (
                <div key={member.id} className={`rounded-2xl p-3 border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
                  <p className="font-bold">{member.emoji} {member.name}</p>
                  <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{member.id === myMemberId ? 'Você neste aparelho' : 'Membro do grupo'}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={copyInvite} className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">Copiar link de convite</button>
              <button
                onClick={async () => {
                  if (typeof window !== 'undefined' && 'Notification' in window) {
                    const permission = await Notification.requestPermission();
                    toast({ title: 'Notificações da família', description: permission === 'granted' ? 'Permissão liberada.' : 'Permissão não concedida.' });
                  }
                }}
                className={`w-full py-2 rounded-xl font-bold text-sm ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200')}`}
              >
                Ativar notificações
              </button>
            </div>
          </div>

          <div className="grid gap-4 mb-5">
            <InsightCard darkMode={!!dm} title="Acolhimento de hoje" text={careGuide} />
            {isPro ? (
              <>
                <InsightCard darkMode={!!dm} title="Ponto de cuidado" text={needsCare} />
                <InsightCard darkMode={!!dm} title="Próximo combinado da família" text={nextAgreement} />
              </>
            ) : (
              <div className={`rounded-3xl border p-4 ${dm ? 'bg-fuchsia-950/20 border-fuchsia-900/30 text-slate-100' : 'bg-fuchsia-50/80 border-fuchsia-200 text-slate-800'}`}>
                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Modo Família avançado no Pro</p>
                <p className="mt-2 text-sm leading-relaxed">No grátis, a família já tem check-in básico. No Pro, entram leitura de temas sensíveis, combinados, mensagens da família e organização mais clara da convivência.</p>
                <button onClick={() => onShowUpgrade?.()} className="mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white transition-all active:scale-95">Ver plano Pro</button>
              </div>
            )}
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Check-in</h3>
            <p className={`text-xs mb-3 ${c('text-slate-500', 'text-slate-400')}`}>
              Registre o estado emocional, o que aconteceu, o que você precisa da família e o que consegue oferecer hoje.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {postTypes.map((type) => (
                <button key={type.id} onClick={() => setPostType(type.id)} className={`px-2 py-1 rounded-full text-xs font-bold ${postType === type.id ? 'bg-indigo-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>
                  {type.emoji} {type.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {moods.map((moodOption) => (
                <button key={moodOption} onClick={() => setMood(moodOption)} className={`px-2 py-1 rounded-full text-xs ${mood === moodOption ? 'bg-blue-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{moodOption}</button>
              ))}
            </div>

            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Como eu estou chegando hoje" className={`w-full p-3 rounded-xl text-sm mb-3 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)} placeholder="O que aconteceu" className={`w-full p-3 rounded-xl text-sm mb-3 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={needFromFamily} onChange={(e) => setNeedFromFamily(e.target.value)} placeholder="O que eu preciso da família" className={`w-full p-3 rounded-xl text-sm mb-3 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={whatICanOffer} onChange={(e) => setWhatICanOffer(e.target.value)} placeholder="O que eu consigo oferecer hoje" className={`w-full p-3 rounded-xl text-sm mb-3 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />

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

            <button onClick={postCheckin} className="w-full mt-1 py-3 rounded-xl bg-blue-600 text-white font-bold">Publicar no grupo</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Pedidos e combinados</h3>
            {isPro ? (
              <>
                <button onClick={() => setOnlySupport((prev) => !prev)} className={`w-full mb-3 py-2 rounded-xl text-sm font-bold ${onlySupport ? 'bg-rose-500 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300')}`}>
                  {onlySupport ? 'Mostrando só pedidos de apoio' : 'Filtrar pedidos de apoio'}
                </button>
                <textarea value={agreementDraft} onChange={(e) => setAgreementDraft(e.target.value)} placeholder="Registrar um combinado simples da família" className={`w-full min-h-[84px] p-3 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
                <button onClick={saveAgreement} className="w-full mt-3 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold">Salvar combinado</button>
              </>
            ) : (
              <div className={`rounded-2xl border p-4 ${dm ? 'bg-fuchsia-950/20 border-fuchsia-900/30' : 'bg-fuchsia-50/70 border-fuchsia-200'}`}>
                <p className="text-sm font-bold">Combinados e filtro de apoio</p>
                <p className={`mt-2 text-xs leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>No Pro, essa área libera pedidos de apoio, combinados da família e uma leitura mais organizada da convivência.</p>
                <button onClick={() => onShowUpgrade?.()} className="mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white transition-all active:scale-95">Desbloquear no Pro</button>
              </div>
            )}
            {isPro && activeGroup.agreements && activeGroup.agreements.length > 0 && (
              <div className="grid gap-3 mt-4">
                {activeGroup.agreements.slice(0, 3).map((agreement) => (
                  <div key={agreement.id} className={`rounded-2xl p-4 border ${c('bg-amber-50 border-amber-100', 'bg-amber-950/20 border-amber-900/40')}`}>
                    <p className="text-sm font-bold">{agreement.text}</p>
                    <p className={`mt-1 text-xs ${c('text-slate-500', 'text-slate-400')}`}>por {agreement.authorName} • {new Date(agreement.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Conversa da família</h3>
            {isPro ? (
              <>
                <textarea value={familyMessage} onChange={(e) => setFamilyMessage(e.target.value)} placeholder="Mensagem curta para organizar a convivência agora" className={`w-full min-h-[84px] p-3 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
                <button onClick={sendFamilyMessage} className="w-full mt-3 py-3 rounded-xl bg-indigo-600 text-white font-bold">Enviar mensagem</button>
              </>
            ) : (
              <div className={`rounded-2xl border p-4 ${dm ? 'bg-fuchsia-950/20 border-fuchsia-900/30' : 'bg-fuchsia-50/70 border-fuchsia-200'}`}>
                <p className="text-sm font-bold">Conversa da família</p>
                <p className={`mt-2 text-xs leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>No Pro, essa área libera mensagens da família e uma organização mais clara da convivência.</p>
                <button onClick={() => onShowUpgrade?.()} className="mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white transition-all active:scale-95">Desbloquear no Pro</button>
              </div>
            )}

            <div className="grid gap-3 mt-4">
              <ActionCard darkMode={!!dm} title="O Poder do NÃO" text="Ajuda a colocar limites sem escalar a convivência." onClick={() => onNavigate?.('assertiveness')} />
              <ActionCard darkMode={!!dm} title="Falas Tóxicas" text="Ajuda a reconhecer padrões que machucam dentro da família." onClick={() => onNavigate?.('toxicthoughts')} />
              <ActionCard darkMode={!!dm} title="Método dos 5 Dedos" text="Útil para preparar uma conversa delicada com mais clareza." onClick={() => onNavigate?.('fivefingers')} />
              <ActionCard darkMode={!!dm} title="Carta Terapêutica" text="Serve para elaborar o que ficou engasgado antes de levar ao grupo." onClick={() => onNavigate?.('carta', { cartaType: 'personalizada' })} />
              <ActionCard darkMode={!!dm} title="Calendário de Terapia" text="Se a questão for importante, vale virar tema para terapia." onClick={() => onNavigate?.('therapycalendar')} />
            </div>
          </div>

          <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Histórico</h3>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {isPro && (activeGroup.messages || []).slice(0, 12).map((message) => (
                <div key={message.id} className={`p-4 rounded-2xl border ${c('bg-indigo-50 border-indigo-100', 'bg-indigo-950/20 border-indigo-900/40')}`}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold">{message.memberEmoji} {message.memberName}</p>
                      <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{new Date(message.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className={`text-xs font-bold ${c('text-indigo-700', 'text-indigo-300')}`}>Conversa</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{message.text}</p>
                </div>
              ))}

              {filteredPosts.map((post) => (
                <div key={post.id} className={`p-4 rounded-2xl border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{post.memberEmoji} {post.memberName}</p>
                      <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{new Date(post.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-900/40 text-indigo-300')}`}>
                        {postTypes.find((type) => type.id === post.type)?.emoji} {postTypes.find((type) => type.id === post.type)?.label}
                      </span>
                      <p className="mt-1 text-sm">{post.mood}</p>
                    </div>
                  </div>

                  {post.note && <p className="mt-3 text-sm leading-relaxed">{post.note}</p>}
                  {(post.whatHappened || post.needFromFamily || post.whatICanOffer || post.sensitiveTopic) && (
                    <div className="grid gap-2 mt-3">
                      {post.whatHappened && <MiniInfo darkMode={!!dm} label="O que aconteceu" text={post.whatHappened} />}
                      {post.needFromFamily && <MiniInfo darkMode={!!dm} label="Preciso da família" text={post.needFromFamily} />}
                      {post.whatICanOffer && <MiniInfo darkMode={!!dm} label="Consigo oferecer" text={post.whatICanOffer} />}
                      {post.sensitiveTopic && <MiniInfo darkMode={!!dm} label="Sinalização" text={`Assunto sensível • ${post.talkTiming === 'agora' ? 'quer conversar agora' : 'prefere conversar depois'}`} />}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mt-3">
                    {reactionEmojis.map((reaction) => (
                      <button key={reaction} onClick={() => reactToPost(post.id, reaction)} className={`px-2 py-0.5 rounded-full text-xs ${c('bg-white border border-slate-200', 'bg-slate-800 border border-slate-600')}`}>
                        {reaction} {post.reactions?.[reaction] ? post.reactions[reaction] : ''}
                      </button>
                    ))}
                  </div>

                  {post.replies.length > 0 && (
                    <div className={`mt-3 pl-3 border-l ${c('border-slate-200', 'border-slate-700')}`}>
                      {post.replies.slice(-4).map((reply) => (
                        <p key={reply.id} className="text-xs mt-1">
                          <strong>{reply.memberEmoji} {reply.memberName}:</strong> {reply.text}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 items-center">
                    <input
                      value={replyDraftByPost[post.id] || ''}
                      onChange={(e) => setReplyDraftByPost((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Responder..."
                      className={`flex-1 p-2 rounded-lg text-xs ${c('bg-white border border-slate-200', 'bg-slate-800 border border-slate-700')}`}
                    />
                    <button onClick={() => addReply(post.id)} className="px-3 rounded-lg text-xs font-bold bg-indigo-600 text-white">Enviar</button>
                  </div>
                </div>
              ))}

              {filteredPosts.length === 0 && (!activeGroup.messages || activeGroup.messages.length === 0) && (
                <p className={`text-sm ${c('text-slate-500', 'text-slate-400')}`}>{onlySupport ? 'Sem pedidos de apoio no momento.' : 'Ainda não há registros neste grupo.'}</p>
              )}
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
