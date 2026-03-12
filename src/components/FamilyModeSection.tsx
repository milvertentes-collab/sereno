'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props { darkMode?: boolean }

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
}

interface FamilyGroup {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  members: FamilyMember[];
  posts: FamilyPost[];
}

const moods = ['😊 Bem', '😐 Neutro', '😔 Triste', '😰 Ansioso', '😤 Irritado', '🤗 Apoiado'];
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

export default function FamilyModeSection({ darkMode: dm }: Props) {
  const [groups, setGroups] = useLocalStorage<FamilyGroup[]>('psico_family_groups', []);
  const [activeGroupId, setActiveGroupId] = useLocalStorage<string | null>('psico_family_active_group', null);
  const [deviceMemberByGroup, setDeviceMemberByGroup] = useLocalStorage<Record<string, string>>('psico_family_device_member', {});

  const [groupName, setGroupName] = useState('');
  const [myName, setMyName] = useState('');
  const [myEmoji, setMyEmoji] = useState('😊');

  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinEmoji, setJoinEmoji] = useState('😊');

  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [postType, setPostType] = useState<FamilyPost['type']>('emocao');
  const [replyDraftByPost, setReplyDraftByPost] = useState<Record<string, string>>({});
  const [onlySupport, setOnlySupport] = useState(false);

  const c = (l: string, d: string) => (dm ? d : l);

  const activeGroup = useMemo(() => groups.find((g) => g.id === activeGroupId) || null, [groups, activeGroupId]);
  const myMemberId = activeGroupId ? deviceMemberByGroup[activeGroupId] : undefined;
  const myMember = activeGroup?.members.find((m) => m.id === myMemberId) || null;

  const filteredPosts = useMemo(() => {
    if (!activeGroup) return [] as FamilyPost[];
    return onlySupport ? activeGroup.posts.filter((p) => p.type === 'pedido') : activeGroup.posts;
  }, [activeGroup, onlySupport]);

  const unreadReplyAlerts = useMemo(() => {
    if (!activeGroup || !myMember) return 0;
    const myPosts = activeGroup.posts.filter((p) => p.memberId === myMember.id);
    return myPosts.reduce((sum, p) => sum + (p.replies?.filter((r) => r.memberId !== myMember.id).length || 0), 0);
  }, [activeGroup, myMember]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('familyInvite');
    if (code) {
      setJoinCode(code.toUpperCase());
    }
  }, []);

  const createGroup = () => {
    const gName = groupName.trim();
    const uName = myName.trim();
    if (!gName || !uName) return;

    const member: FamilyMember = { id: crypto.randomUUID(), name: uName, emoji: myEmoji };
    const newGroup: FamilyGroup = {
      id: crypto.randomUUID(),
      name: gName,
      code: generateCode(),
      createdAt: new Date().toISOString(),
      members: [member],
      posts: [],
    };

    setGroups([newGroup, ...groups]);
    setActiveGroupId(newGroup.id);
    setDeviceMemberByGroup({ ...deviceMemberByGroup, [newGroup.id]: member.id });

    setGroupName('');
    setMyName('');
    setMyEmoji('😊');
  };

  const joinGroup = () => {
    const code = joinCode.trim().toUpperCase();
    const name = joinName.trim();
    if (!code || !name) return;

    const idx = groups.findIndex((g) => g.code === code);
    if (idx < 0) {
      alert('Grupo não encontrado. Verifique o código/link.');
      return;
    }

    const target = groups[idx];
    const existing = target.members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    const member: FamilyMember = existing || { id: crypto.randomUUID(), name, emoji: joinEmoji };

    const updated: FamilyGroup = existing ? target : { ...target, members: [...target.members, member] };
    const clone = [...groups];
    clone[idx] = updated;

    setGroups(clone);
    setActiveGroupId(updated.id);
    setDeviceMemberByGroup({ ...deviceMemberByGroup, [updated.id]: member.id });

    setJoinName('');
    setJoinEmoji('😊');
  };

  const inviteLink = useMemo(() => {
    if (!activeGroup) return '';
    if (typeof window === 'undefined') return `?familyInvite=${activeGroup.code}`;
    return `${window.location.origin}${window.location.pathname}?familyInvite=${activeGroup.code}`;
  }, [activeGroup]);

  const copyInvite = async () => {
    if (!activeGroup) return;
    const text = `Entre no meu grupo familiar no app Sereno:\n${inviteLink}\n\nCódigo do grupo: ${activeGroup.code}`;
    try {
      await navigator.clipboard.writeText(text);
      alert('Convite copiado!');
    } catch {
      alert('Não foi possível copiar automaticamente.');
    }
  };

  const postCheckin = () => {
    if (!activeGroup || !myMember || !mood) return;

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
    };

    const updated = groups.map((g) => g.id === activeGroup.id ? { ...g, posts: [post, ...g.posts] } : g);
    setGroups(updated);
    setMood('');
    setNote('');
    setPostType('emocao');
  };

  const reactToPost = (postId: string, emoji: string) => {
    if (!activeGroup) return;
    const updated = groups.map((g) => {
      if (g.id !== activeGroup.id) return g;
      return {
        ...g,
        posts: g.posts.map((p) => p.id === postId ? {
          ...p,
          reactions: { ...p.reactions, [emoji]: (p.reactions?.[emoji] || 0) + 1 }
        } : p)
      };
    });
    setGroups(updated);
  };

  const addReply = (postId: string) => {
    if (!activeGroup || !myMember) return;
    const post = activeGroup.posts.find((p) => p.id === postId);
    const raw = (replyDraftByPost[postId] || '').trim();
    if (!raw) return;
    const text = raw.includes('@') ? raw : `@${post?.memberName || 'membro'} ${raw}`;

    const reply: FamilyReply = {
      id: crypto.randomUUID(),
      memberId: myMember.id,
      memberName: myMember.name,
      memberEmoji: myMember.emoji,
      text,
      date: new Date().toISOString(),
    };

    const updated = groups.map((g) => {
      if (g.id !== activeGroup.id) return g;
      return {
        ...g,
        posts: g.posts.map((p) => p.id === postId ? { ...p, replies: [...(p.replies || []), reply] } : p)
      };
    });
    setGroups(updated);
    setReplyDraftByPost((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>👨‍👩‍👧 Modo Família (Grupo Privado)</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Crie um grupo, envie o link e cada membro registra o próprio check-in emocional.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-blue-50 border-blue-100', 'bg-blue-900/20 border-blue-800')}`}>
        <h3 className="font-bold mb-2">ℹ️ Como funciona</h3>
        <ul className="text-sm space-y-1">
          <li>• 1) Você cria um grupo familiar.</li>
          <li>• 2) Compartilha o link/código do grupo.</li>
          <li>• 3) Só quem entra com esse convite participa e vê os registros.</li>
          <li>• 4) Cada pessoa publica no mural do grupo: emoções, frustrações, elogios, pensamentos e pedidos de apoio.</li>
          <li>• 5) Funciona como um mini chat de saúde mental da família, privado ao grupo.</li>
        </ul>
      </div>

      {!activeGroup && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Criar novo grupo</h3>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nome do grupo (ex: Família Silva)" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">
              {emojis.map((e) => (
                <button key={e} onClick={() => setMyEmoji(e)} className={`w-9 h-9 rounded-lg ${myEmoji === e ? 'bg-blue-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{e}</button>
              ))}
            </div>
            <button onClick={createGroup} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold">Criar grupo</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Entrar em grupo existente</h3>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Código do grupo" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">
              {emojis.map((e) => (
                <button key={e} onClick={() => setJoinEmoji(e)} className={`w-9 h-9 rounded-lg ${joinEmoji === e ? 'bg-emerald-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{e}</button>
              ))}
            </div>
            <button onClick={joinGroup} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">Entrar no grupo</button>
          </div>
        </>
      )}

      {activeGroup && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">👪 {activeGroup.name}</h3>
              <button onClick={() => setActiveGroupId(null)} className="text-xs text-slate-500">Trocar grupo</button>
            </div>
            <p className={`text-xs mb-2 ${c('text-slate-500', 'text-slate-400')}`}>Código: <strong>{activeGroup.code}</strong> • {activeGroup.members.length} membros</p>
            <button onClick={copyInvite} className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">Copiar link de convite</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Seu check-in no grupo</h3>
            {myMember ? (
              <p className={`text-xs mb-2 ${c('text-slate-500', 'text-slate-400')}`}>Você está como: {myMember.emoji} <strong>{myMember.name}</strong></p>
            ) : (
              <p className="text-xs mb-2 text-rose-500">Seu perfil de membro não foi encontrado neste grupo.</p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {postTypes.map((t) => (
                <button key={t.id} onClick={() => setPostType(t.id)} className={`px-2 py-1 rounded-full text-xs font-bold ${postType === t.id ? 'bg-indigo-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {moods.map((mOpt) => (
                <button key={mOpt} onClick={() => setMood(mOpt)} className={`px-2 py-1 rounded-full text-xs ${mood === mOpt ? 'bg-blue-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{mOpt}</button>
              ))}
            </div>

            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escreva sua mensagem para o grupo (emoção, frustração, elogio, pedido de apoio...)" className={`w-full p-3 rounded-xl text-sm ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <button onClick={postCheckin} className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white font-bold">Publicar no grupo</button>
          </div>

          <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="font-bold">📋 Mural do grupo</h3>
              <button onClick={() => setOnlySupport((v) => !v)} className={`px-2 py-1 rounded-lg text-xs font-bold ${onlySupport ? 'bg-rose-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>
                {onlySupport ? 'Mostrando: pedidos' : 'Filtrar: pedidos'}
              </button>
            </div>

            {unreadReplyAlerts > 0 && (
              <div className={`mb-3 p-2 rounded-xl text-xs font-bold ${c('bg-amber-50 text-amber-700 border border-amber-200', 'bg-amber-900/20 text-amber-300 border border-amber-700')}`}>
                🔔 Você tem {unreadReplyAlerts} resposta(s) em posts seus.
              </div>
            )}

            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {filteredPosts.map((p) => (
                <div key={p.id} className={`p-3 rounded-xl text-sm ${c('bg-slate-50', 'bg-slate-700/60')}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{p.memberEmoji} {p.memberName}</p>
                    <span className={`text-[10px] ${c('text-slate-500', 'text-slate-400')}`}>{new Date(p.date).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-900/40 text-indigo-300')}`}>
                      {postTypes.find((t) => t.id === p.type)?.emoji} {postTypes.find((t) => t.id === p.type)?.label}
                    </span>
                    <span>{p.mood}</span>
                  </div>
                  {p.note && <p className={`mt-1 text-xs ${c('text-slate-600', 'text-slate-300')}`}>{p.note}</p>}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {reactionEmojis.map((re) => (
                      <button key={re} onClick={() => reactToPost(p.id, re)} className={`px-2 py-0.5 rounded-full text-xs ${c('bg-white border border-slate-200', 'bg-slate-800 border border-slate-600')}`}>
                        {re} {p.reactions?.[re] ? p.reactions[re] : ''}
                      </button>
                    ))}
                  </div>

                  {p.replies?.length > 0 && (
                    <div className={`mt-2 pl-2 border-l ${c('border-slate-200', 'border-slate-600')}`}>
                      {p.replies.slice(-4).map((r) => (
                        <p key={r.id} className="text-xs mt-1">
                          <strong>{r.memberEmoji} {r.memberName}:</strong> {r.text}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2 items-center">
                    <button
                      onClick={() => setReplyDraftByPost((prev) => ({ ...prev, [p.id]: `${(prev[p.id] || '').trim()} @${p.memberName} `.trimStart() }))}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}
                    >
                      @menção
                    </button>
                    <input
                      value={replyDraftByPost[p.id] || ''}
                      onChange={(e) => setReplyDraftByPost((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Responder..."
                      className={`flex-1 p-2 rounded-lg text-xs ${c('bg-white border border-slate-200', 'bg-slate-900 border border-slate-700')}`}
                    />
                    <button onClick={() => addReply(p.id)} className="px-3 rounded-lg text-xs font-bold bg-indigo-600 text-white">Enviar</button>
                  </div>
                </div>
              ))}
              {filteredPosts.length === 0 && <p className={`text-sm ${c('text-slate-500', 'text-slate-400')}`}>{onlySupport ? 'Sem pedidos de apoio no momento.' : 'Sem check-ins ainda neste grupo.'}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
