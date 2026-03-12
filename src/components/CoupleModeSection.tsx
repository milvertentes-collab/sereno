'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props { darkMode?: boolean }

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
}

interface CoupleRoom {
  id: string;
  code: string;
  name: string;
  members: CoupleMember[];
  posts: CouplePost[];
  createdAt: string;
}

const moods = [
  '🛟 Modo apoiador', '🆘 Modo preciso de ajuda',
  '😊 Bem', '😐 Neutro', '😔 Triste', '😰 Ansioso', '😤 Irritado', '💪 Disposto',
  '🥰 Amado', '😵 Sobrecarregado', '😴 Cansado', '🫶 Acolhido', '😶 Sensível', '😌 Em paz', '🧠 Pensativo'
];
const emojis = ['😊', '🥰', '🤍', '💙', '💜', '🫶', '🌷', '🌻', '😌', '😔', '😰', '😤', '😴', '💪'];
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function CoupleModeSection({ darkMode: dm }: Props) {
  const [rooms, setRooms] = useLocalStorage<CoupleRoom[]>('psico_couple_rooms', []);
  const [activeRoomId, setActiveRoomId] = useLocalStorage<string | null>('psico_couple_active_room', null);
  const [deviceMemberByRoom, setDeviceMemberByRoom] = useLocalStorage<Record<string, string>>('psico_couple_device_member', {});

  const [roomName, setRoomName] = useState('');
  const [myName, setMyName] = useState('');
  const [myEmoji, setMyEmoji] = useState('😊');

  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinEmoji, setJoinEmoji] = useState('🥰');

  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');

  const c = (l: string, d: string) => (dm ? d : l);

  const activeRoom = useMemo(() => rooms.find((r) => r.id === activeRoomId) || null, [rooms, activeRoomId]);
  const myMemberId = activeRoomId ? deviceMemberByRoom[activeRoomId] : undefined;
  const myMember = activeRoom?.members.find((m) => m.id === myMemberId) || null;

  const createRoom = () => {
    const name = myName.trim();
    if (!name) return;
    const me: CoupleMember = { id: crypto.randomUUID(), name, emoji: myEmoji };
    const room: CoupleRoom = {
      id: crypto.randomUUID(),
      code: genCode(),
      name: roomName.trim() || 'Nosso Espaço',
      members: [me],
      posts: [],
      createdAt: new Date().toISOString(),
    };
    setRooms([room, ...rooms]);
    setActiveRoomId(room.id);
    setDeviceMemberByRoom({ ...deviceMemberByRoom, [room.id]: me.id });
    setRoomName(''); setMyName('');
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    const name = joinName.trim();
    if (!code || !name) return;

    const idx = rooms.findIndex((r) => r.code === code);
    if (idx < 0) return alert('Código não encontrado.');

    const target = rooms[idx];
    if (target.members.length >= 2 && !target.members.find((m) => m.name.toLowerCase() === name.toLowerCase())) {
      return alert('Este espaço já está com 2 pessoas.');
    }

    const existing = target.members.find((m) => m.name.toLowerCase() === name.toLowerCase());
    const member = existing || { id: crypto.randomUUID(), name, emoji: joinEmoji };
    const updated = existing ? target : { ...target, members: [...target.members, member] };
    const clone = [...rooms];
    clone[idx] = updated;
    setRooms(clone);
    setActiveRoomId(updated.id);
    setDeviceMemberByRoom({ ...deviceMemberByRoom, [updated.id]: member.id });
    setJoinName('');
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
      alert('Convite copiado!');
    } catch {
      alert('Não foi possível copiar automaticamente.');
    }
  };

  const addPost = () => {
    if (!activeRoom || !myMember || !mood) return;
    const post: CouplePost = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mood,
      note: note.trim(),
      authorId: myMember.id,
      authorName: myMember.name,
      authorEmoji: myMember.emoji,
    };
    setRooms(rooms.map((r) => r.id === activeRoom.id ? { ...r, posts: [post, ...r.posts] } : r));
    setMood(''); setNote('');
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>💑 Modo Casal</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Um espaço privado para o casal compartilhar emoções, pedidos e acolhimento diário.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-pink-50 border-pink-100', 'bg-pink-900/20 border-pink-800')}`}>
        <h3 className="font-bold mb-2">ℹ️ Como funciona</h3>
        <ul className="text-sm space-y-1">
          <li>• 1) Uma pessoa cria o espaço do casal.</li>
          <li>• 2) Ela envia UM único código/link para o parceiro.</li>
          <li>• 3) O parceiro cola o código e entra.</li>
          <li>• 4) Os dois registram sentimentos e mensagens no mural privado.</li>
        </ul>
      </div>

      {!activeRoom && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Criar espaço do casal</h3>
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Nome do espaço (opcional)" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">{emojis.map((e) => <button key={e} onClick={() => setMyEmoji(e)} className={`w-9 h-9 rounded-lg ${myEmoji === e ? 'bg-pink-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{e}</button>)}</div>
            <button onClick={createRoom} className="w-full py-3 rounded-xl bg-pink-600 text-white font-bold">Criar espaço</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Entrar no espaço do parceiro</h3>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Código do convite" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <input value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Seu nome" className={`w-full p-3 rounded-xl text-sm mb-2 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`} />
            <div className="flex gap-1 mb-3 flex-wrap">{emojis.map((e) => <button key={e} onClick={() => setJoinEmoji(e)} className={`w-9 h-9 rounded-lg ${joinEmoji === e ? 'bg-rose-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{e}</button>)}</div>
            <button onClick={joinRoom} className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold">Entrar</button>
          </div>
        </>
      )}

      {activeRoom && (
        <>
          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">💞 {activeRoom.name}</h3>
              <button onClick={() => setActiveRoomId(null)} className="text-xs text-slate-500">Trocar</button>
            </div>
            <p className={`text-xs mb-2 ${c('text-slate-500', 'text-slate-400')}`}>Código: <strong>{activeRoom.code}</strong> • {activeRoom.members.length}/2 participantes</p>
            <button onClick={copyInvite} className="w-full py-2 rounded-xl bg-pink-600 text-white font-bold text-sm">Copiar convite</button>
          </div>

          <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <h3 className="font-bold mb-3">Seu check-in</h3>
            <p className={`text-xs mb-2 ${c('text-slate-500', 'text-slate-400')}`}>
              Dica: use “Modo apoiador” ou “Modo preciso de ajuda” para seu parceiro já entender seu estado antes de se verem.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {['🛟 Modo apoiador', '🆘 Modo preciso de ajuda'].map((m) => (
                <button key={m} onClick={() => setMood(m)} className={`py-2 rounded-xl text-xs font-black ${mood === m ? 'bg-pink-500 text-white' : c('bg-pink-50 text-pink-700', 'bg-slate-700 text-slate-200')}`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">{moods.filter(m => !m.includes('Modo')).map((m) => <button key={m} onClick={() => setMood(m)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${mood === m ? 'bg-pink-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{m}</button>)}</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mensagem para seu parceiro(a)..." className={`w-full min-h-[80px] p-3 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
            <button onClick={addPost} className="w-full mt-3 py-3 rounded-xl bg-pink-600 text-white font-bold">Publicar</button>
          </div>

          <div className="space-y-2">
            {activeRoom.posts.slice(0, 20).map((e) => (
              <div key={e.id} className={`p-3 rounded-xl text-sm ${c('bg-slate-50', 'bg-slate-700/60')}`}>
                <div className="flex justify-between">
                  <span className="font-bold">{e.authorEmoji} {e.authorName}</span>
                  <span className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{new Date(e.date).toLocaleString('pt-BR')}</span>
                </div>
                <p className="mt-1">{e.mood}</p>
                {e.note && <p className={`mt-1 text-xs ${c('text-slate-500', 'text-slate-400')}`}>{e.note}</p>}
              </div>
            ))}
            {activeRoom.posts.length === 0 && <p className={`text-sm ${c('text-slate-500', 'text-slate-400')}`}>Sem check-ins ainda.</p>}
          </div>
        </>
      )}
    </div>
  );
}
