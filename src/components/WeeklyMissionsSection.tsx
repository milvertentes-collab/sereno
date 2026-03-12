'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Challenge {
  id: string;
  title: string;
  days: 7 | 21 | 30;
  progress: number;
  createdAt: string;
}

interface WeeklyMission {
  id: string;
  title: string;
  linkedTab?: string;
  completions: string[]; // YYYY-MM-DD
}

interface Props { darkMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void }

const suggestions = [
  '21 dias sem autocrítica',
  '7 dias de respiração consciente',
  '30 dias de diário emocional',
  '7 dias de pausa antes de reagir',
  '21 dias de autocuidado gentil',
  '7 dias de grounding antes de dormir',
  '21 dias sem comparar minha jornada',
  '30 dias registrando 1 gratidão',
  '7 dias reduzindo tela à noite',
  '21 dias falando comigo com gentileza',
  '7 dias de microtarefas de 5 minutos',
  '30 dias sem pular check-in emocional',
  '7 dias de pausa consciente no almoço',
  '21 dias priorizando sono',
  '30 dias de respiração + diário',
];

const weeklyMissionPool: Array<{ title: string; linkedTab: string }> = [
  { title: 'Fazer 1 respiração guiada por dia', linkedTab: 'breathing' },
  { title: 'Registrar humor diariamente', linkedTab: 'mood' },
  { title: 'Escrever 3 linhas no diário em 4 dias', linkedTab: 'diary' },
  { title: 'Dormir antes das 23h em 3 noites', linkedTab: 'sleep' },
  { title: 'Fazer 1 microtarefa em 5 dias', linkedTab: 'microtasks' },
  { title: 'Praticar gratidão em 4 dias', linkedTab: 'gratitude' },
  { title: 'Concluir 1 etapa da trilha temática', linkedTab: 'tracks' },
  { title: 'Fazer 1 prática de psicoeducação em 4 dias', linkedTab: 'psychoedu' },
  { title: 'Usar SOS/grounding quando disparar gatilho', linkedTab: 'sos' },
  { title: 'Treinar 1 limite assertivo na semana', linkedTab: 'assertiveness' },
];

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const weekKey = () => {
  const d = new Date();
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDays = Math.floor((d.getTime() - firstDayOfYear.getTime()) / 86400000);
  const week = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export default function WeeklyMissionsSection({ darkMode: dm, onNavigate }: Props) {
  const [missions, setMissions] = useLocalStorage<WeeklyMission[]>('psico_weekly_missions_v2', []);
  const [missionsWeek, setMissionsWeek] = useLocalStorage<string>('psico_weekly_missions_week', '');
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('psico_challenges', []);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<7 | 21 | 30>(21);

  const c = (l: string, d: string) => (dm ? d : l);

  useEffect(() => {
    const wk = weekKey();
    if (missionsWeek === wk && missions.length > 0) return;

    const seed = wk.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const a = weeklyMissionPool[seed % weeklyMissionPool.length];
    const b = weeklyMissionPool[(seed + 3) % weeklyMissionPool.length];
    const cPick = weeklyMissionPool[(seed + 6) % weeklyMissionPool.length];

    const picks = [a, b, cPick].filter((v, i, arr) => arr.findIndex(x => x.title === v.title) === i);
    setMissions(picks.map((p, i) => ({ id: `wk-${wk}-${i}`, title: p.title, linkedTab: p.linkedTab, completions: [] })));
    setMissionsWeek(wk);
  }, [missionsWeek, missions.length, setMissions, setMissionsWeek]);

  const addChallenge = () => {
    const t = title.trim();
    if (!t) return;
    setChallenges([{ id: crypto.randomUUID(), title: t, days, progress: 0, createdAt: new Date().toISOString() }, ...challenges]);
    setTitle('');
  };

  const donePct = (ch: Challenge) => Math.min(100, Math.round((ch.progress / ch.days) * 100));
  const ordered = useMemo(() => [...challenges].sort((a, b) => donePct(b) - donePct(a)), [challenges]);

  const avgCompletion = (list: Challenge[]) => list.length ? Math.round(list.reduce((s, ch) => s + donePct(ch), 0) / list.length) : 0;
  const nowTs = Date.now();
  const last30 = challenges.filter(ch => new Date(ch.createdAt).getTime() >= nowTs - 30 * 24 * 60 * 60 * 1000);
  const prev30 = challenges.filter(ch => {
    const t = new Date(ch.createdAt).getTime();
    return t < nowTs - 30 * 24 * 60 * 60 * 1000 && t >= nowTs - 60 * 24 * 60 * 60 * 1000;
  });
  const avgNow = avgCompletion(last30);
  const avgPrev = avgCompletion(prev30);
  const avatarLevel = ordered.length ? Math.round(ordered.reduce((s, ch) => s + donePct(ch), 0) / ordered.length) : 0;
  const avatar = avatarLevel >= 80 ? '🦁' : avatarLevel >= 50 ? '🐺' : avatarLevel >= 25 ? '🦊' : '🐣';

  const checkToday = (missionId: string) => {
    const t = todayKey();
    setMissions(missions.map((m) => {
      if (m.id !== missionId) return m;
      if (m.completions.includes(t)) return m;
      return { ...m, completions: [...m.completions, t] };
    }));
  };

  const uncheckToday = (missionId: string) => {
    const t = todayKey();
    setMissions(missions.map((m) => m.id === missionId ? { ...m, completions: m.completions.filter((d) => d !== t) } : m));
  };

  const streakOf = (completions: string[]) => {
    const set = new Set(completions);
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (set.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const isDoneToday = (m: WeeklyMission) => m.completions.includes(todayKey());

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🎯 Missões & Desafios</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Missões semanais com check-in diário, streak e prática em 1 toque.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-1">Missões da semana</h3>
        <p className={`text-[11px] mb-3 ${c('text-slate-600','text-slate-300')}`}>Atualização automática semanal • {missionsWeek || weekKey()} • V2 dinâmica</p>
        <div className="space-y-2">
          {missions.map((m) => (
            <div key={m.id} className={`p-3 rounded-xl text-sm border ${c('bg-slate-50 border-slate-200', 'bg-slate-700/60 border-slate-600')}`}>
              <p className="font-bold">{m.title}</p>
              <p className="text-xs mt-1 opacity-80">🔥 Streak: {streakOf(m.completions)} dia(s) • Total: {m.completions.length}</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {!isDoneToday(m) ? (
                  <button onClick={() => checkToday(m.id)} className="py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Concluir hoje</button>
                ) : (
                  <button onClick={() => uncheckToday(m.id)} className="py-2 rounded-lg bg-slate-500 text-white text-xs font-bold">Desfazer hoje</button>
                )}
                <button onClick={() => m.linkedTab && onNavigate?.(m.linkedTab as any)} className={`py-2 rounded-lg text-xs font-bold ${c('bg-indigo-100 text-indigo-700','bg-indigo-900/30 text-indigo-300')}`}>Abrir prática</button>
                <button onClick={() => setMissions(missions.filter((x) => x.id !== m.id))} className="py-2 rounded-lg bg-rose-500 text-white text-xs font-bold">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Avatar emocional</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl">{avatar}</p>
            <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>Evolui com seu progresso nos desafios.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold">{avatarLevel}%</p>
            <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>Nível atual</p>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-2">Comparativo de evolução</h3>
        <p className="text-sm">Você hoje (30 dias): <strong>{avgNow}%</strong></p>
        <p className="text-sm">Você há 30 dias: <strong>{avgPrev}%</strong></p>
        <p className={`text-xs mt-2 ${c('text-slate-600', 'text-slate-400')}`}>
          {avgPrev ? `Variação: ${avgNow - avgPrev >= 0 ? '+' : ''}${avgNow - avgPrev} ponto(s).` : 'Ainda sem dados suficientes para comparar 60 dias.'}
        </p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Novo desafio</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: 21 dias sem autocrítica" className={`w-full p-3 rounded-xl border text-sm mb-2 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[7, 21, 30].map((d) => (
            <button key={d} onClick={() => setDays(d as 7 | 21 | 30)} className={`py-2 rounded-lg text-sm font-bold ${days === d ? 'bg-emerald-500 text-white' : c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>{d} dias</button>
          ))}
        </div>
        <button onClick={addChallenge} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">Criar desafio</button>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Sugestões rápidas</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setTitle(s)} className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {ordered.map((ch) => (
          <div key={ch.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm">{ch.title}</h4>
              <span className="text-xs font-bold">{ch.progress}/{ch.days}</span>
            </div>
            <div className={`h-2 rounded-full ${c('bg-slate-100', 'bg-slate-700')}`}>
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${donePct(ch)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button onClick={() => setChallenges(challenges.map(c => c.id === ch.id ? { ...c, progress: Math.max(0, c.progress - 1) } : c))} className={`py-1 rounded text-xs ${c('bg-slate-100', 'bg-slate-700')}`}>-1</button>
              <button onClick={() => setChallenges(challenges.map(c => c.id === ch.id ? { ...c, progress: Math.min(c.days, c.progress + 1) } : c))} className="py-1 rounded text-xs bg-emerald-500 text-white">+1 dia</button>
              <button onClick={() => setChallenges(challenges.filter(c => c.id !== ch.id))} className="py-1 rounded text-xs bg-rose-500 text-white">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
