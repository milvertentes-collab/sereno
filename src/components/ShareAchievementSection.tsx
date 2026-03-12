'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props { darkMode?: boolean }

const APP_NAME = 'Sereno';
const PLAY_STORE_URL_PLACEHOLDER = 'https://play.google.com/store/apps/details?id=com.sereno.app';

const achievements = [
  { id: 'first', title: 'Primeiro registro', emoji: '🌟', desc: 'Você fez seu primeiro registro de humor!' },
  { id: 'streak7', title: '7 dias seguidos', emoji: '🔥', desc: 'Você manteve a sequência por uma semana!' },
  { id: 'streak21', title: '21 dias de foco', emoji: '🚀', desc: 'Constância emocional por 21 dias.' },
  { id: 'streak30', title: '30 dias de jornada', emoji: '🏆', desc: 'Um mês inteiro cuidando de você.' },
  { id: 'mood30', title: '30 registros', emoji: '📊', desc: 'Você registrou humor 30 vezes!' },
  { id: 'mood100', title: '100 registros', emoji: '💯', desc: 'Você chegou em 100 registros emocionais.' },
  { id: 'calm', title: 'Mestre da calma', emoji: '🧘', desc: 'Você completou 10 sessões de respiração!' },
  { id: 'zen50', title: 'Zen 50', emoji: '🌬️', desc: '50 práticas de respiração completadas.' },
  { id: 'grateful', title: 'Gratidão diária', emoji: '🙏', desc: 'Você registrou gratidão por 7 dias!' },
  { id: 'gratitude30', title: 'Coração grato', emoji: '💛', desc: '30 registros de gratidão concluídos.' },
  { id: 'artist', title: 'Artista Emocional', emoji: '🎨', desc: 'Criou 10 expressões no Modo Arte.' },
  { id: 'missions', title: 'Missão cumprida', emoji: '🎯', desc: 'Completou sua primeira missão semanal.' },
  { id: 'challenge7', title: 'Desafio 7 dias', emoji: '🗓️', desc: 'Concluiu um desafio de 7 dias.' },
  { id: 'challenge21', title: 'Desafio 21 dias', emoji: '💪', desc: 'Concluiu um desafio de 21 dias.' },
  { id: 'challenge30', title: 'Desafio 30 dias', emoji: '👑', desc: 'Concluiu um desafio de 30 dias.' },
  { id: 'capsule', title: 'Cápsula criada', emoji: '🕰️', desc: 'Você criou sua primeira cápsula do tempo.' },
  { id: 'futureletter', title: 'Carta ao eu futuro', emoji: '💌', desc: 'Escreveu uma carta para abrir depois.' },
  { id: 'mindmap', title: 'Mente mapeada', emoji: '🧭', desc: 'Explorou seu mapa mental emocional.' },
  { id: 'resilience', title: 'Resiliência ativa', emoji: '🛡️', desc: 'Manteve cuidado próprio em dia difícil.' },
  { id: 'selfcare', title: 'Autocuidado em ação', emoji: '🌿', desc: 'Completou 20 microtarefas de autocuidado.' },
];

export default function ShareAchievementSection({ darkMode: dm }: Props) {
  const [unlocked, setUnlocked] = useLocalStorage<string[]>('psico_achievements_unlocked', ['first']);
  const [selected, setSelected] = useState<string | null>(null);
  const c = (l: string, d: string) => (dm ? d : l);

  const share = async (id: string, platform: 'whatsapp' | 'instagram' | 'twitter') => {
    const a = achievements.find((x) => x.id === id);
    if (!a) return;

    const text = `${a.emoji} Conquista desbloqueada no ${APP_NAME}: ${a.title}!\n\n${a.desc}\n\n⬇️ Baixe o app: ${PLAY_STORE_URL_PLACEHOLDER}\n\n#${APP_NAME}App #SaudeMental`;

    if (platform === 'instagram') {
      try { await navigator.clipboard.writeText(text); } catch {}
      window.open('https://www.instagram.com/', '_blank');
      setSelected(null);
      return;
    }

    const url = platform === 'whatsapp'
      ? `https://wa.me/?text=${encodeURIComponent(text)}`
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
    setSelected(null);
  };

  const unlock = (id: string) => {
    if (!unlocked.includes(id)) setUnlocked([...unlocked, id]);
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🏆 Compartilhar Conquista</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Mostre seu progresso nas redes sociais e convide pessoas para baixar o app.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a) => {
          const has = unlocked.includes(a.id);
          return (
            <div key={a.id} className={`p-4 rounded-2xl text-left border transition-all ${has ? c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700') : c('bg-slate-100 border-slate-200 opacity-50', 'bg-slate-900 border-slate-800 opacity-50')}`}>
              <button onClick={() => has && setSelected(a.id)} disabled={!has} className="w-full text-left">
                <span className="text-2xl">{has ? a.emoji : '🔒'}</span>
                <p className="font-bold text-sm mt-2">{a.title}</p>
                <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{has ? a.desc : 'Bloqueado'}</p>
              </button>
              {!has && <button onClick={() => unlock(a.id)} className="text-[10px] text-blue-500 mt-1">Desbloquear</button>}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className={`rounded-3xl p-6 max-w-xs w-full ${c('bg-white', 'bg-slate-800')}`} onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl text-center">{achievements.find((a) => a.id === selected)?.emoji}</p>
            <h3 className="font-bold text-lg text-center mt-3">{achievements.find((a) => a.id === selected)?.title}</h3>
            <p className={`text-sm text-center mt-2 ${c('text-slate-600', 'text-slate-300')}`}>{achievements.find((a) => a.id === selected)?.desc}</p>
            <p className={`text-[11px] text-center mt-2 ${c('text-slate-500', 'text-slate-400')}`}>
              Compartilhamento inclui nome do app e link de download (Play Store pronto para substituir depois).
            </p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button onClick={() => share(selected, 'whatsapp')} className="py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">WhatsApp</button>
              <button onClick={() => share(selected, 'instagram')} className="py-2 rounded-lg bg-pink-600 text-white text-xs font-bold">Instagram</button>
              <button onClick={() => share(selected, 'twitter')} className="py-2 rounded-lg bg-sky-600 text-white text-xs font-bold">Twitter</button>
            </div>
            <button onClick={() => setSelected(null)} className={`w-full mt-3 py-2 rounded-lg text-sm font-bold ${c('bg-slate-100', 'bg-slate-700')}`}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}