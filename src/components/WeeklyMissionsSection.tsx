'use client';

import { useEffect, useMemo, useState } from 'react';
import SharePlatformModal from '@/components/SharePlatformModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { buildChallengeShareText, shareText, type SharePlatform } from '@/lib/share-utils';
import SectionHeroCard from './SectionHeroCard';

interface Challenge {
  id: string;
  title: string;
  days: 7 | 21 | 30;
  progress: number;
  createdAt: string;
  linkedTab?: string;
  why?: string;
  paused?: boolean;
  completedAt?: string;
}

interface Props { darkMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void; onProgressIncrement?: () => void }

const challengeTemplates: Record<7 | 21 | 30, Array<{ title: string; linkedTab: string; why: string }>> = {
  7: [
    { title: '7 dias de respiração consciente', linkedTab: 'breathing', why: 'Curto o bastante para começar sem travar e suficiente para criar ritmo.' },
    { title: '7 dias de check-in emocional', linkedTab: 'mood', why: 'Ajuda a perceber padrão antes de tentar mudar qualquer coisa.' },
    { title: '7 dias de pausa antes de reagir', linkedTab: 'microtasks', why: 'Treina interrupção de impulso em situações do dia a dia.' },
    { title: '7 dias reduzindo tela à noite', linkedTab: 'sleep', why: 'Uma semana já mostra impacto no descanso e no ritmo mental.' },
  ],
  21: [
    { title: '21 dias de autocuidado gentil', linkedTab: 'habits', why: 'Três semanas costumam consolidar um cuidado recorrente.' },
    { title: '21 dias sem autocrítica', linkedTab: 'healthymessages', why: 'Tempo suficiente para praticar outra linguagem interna.' },
    { title: '21 dias de gratidão possível', linkedTab: 'gratitude', why: 'Ajuda a ampliar percepção de apoio sem forçar positividade.' },
    { title: '21 dias de limites saudáveis', linkedTab: 'assertiveness', why: 'Limite precisa de repetição para sair da teoria.' },
  ],
  30: [
    { title: '30 dias de diário emocional', linkedTab: 'diary', why: 'Um mês dá material para observar mudanças com mais clareza.' },
    { title: '30 dias de sono e regulação', linkedTab: 'sleep', why: 'Sono costuma precisar de janela maior para mostrar efeito real.' },
    { title: '30 dias de prática + reflexão', linkedTab: 'practices', why: 'Junta ação e elaboração num ciclo mais completo.' },
    { title: '30 dias de reconstrução de rotina', linkedTab: 'habits', why: 'É o tipo de missão que mexe na base do dia a dia.' },
  ],
};

const dayMeta: Record<7 | 21 | 30, { title: string; desc: string; accent: string; chipLight: string; chipDark: string }> = {
  7: {
    title: '7 dias',
    desc: 'Começo leve e direto.',
    accent: 'from-sky-500 to-cyan-600',
    chipLight: 'bg-sky-100 text-sky-700',
    chipDark: 'bg-sky-950/40 text-sky-300',
  },
  21: {
    title: '21 dias',
    desc: 'Consolidar um ritmo.',
    accent: 'from-emerald-500 to-teal-600',
    chipLight: 'bg-emerald-100 text-emerald-700',
    chipDark: 'bg-emerald-950/40 text-emerald-300',
  },
  30: {
    title: '30 dias',
    desc: 'Jornada mais completa.',
    accent: 'from-violet-500 to-fuchsia-600',
    chipLight: 'bg-violet-100 text-violet-700',
    chipDark: 'bg-violet-950/40 text-violet-300',
  },
};

const donePct = (challenge: Challenge) => Math.max(0, Math.min(100, Math.round((challenge.progress / challenge.days) * 100)));

export default function WeeklyMissionsSection({ darkMode: dm, onNavigate, onProgressIncrement }: Props) {
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('psico_challenges', []);
  const [activeLength, setActiveLength] = useState<7 | 21 | 30>(7);
  const [title, setTitle] = useState('');
  const [linkedTab, setLinkedTab] = useState<string>('habits');
  const [why, setWhy] = useState('');
  const [usageSuggestion, setUsageSuggestion] = useState<null | { title: string; linkedTab: string; why: string; days: 7 | 21 | 30 }>(null);
  const [shareChallengeTarget, setShareChallengeTarget] = useState<Challenge | null>(null);

  const c = (l: string, d: string) => (dm ? d : l);
  const activeMeta = dayMeta[activeLength];

  const filtered = useMemo(
    () => [...challenges].filter((challenge) => challenge.days === activeLength).sort((a, b) => {
      const aDone = a.progress >= a.days ? 1 : 0;
      const bDone = b.progress >= b.days ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      if ((a.paused ? 1 : 0) !== (b.paused ? 1 : 0)) return (a.paused ? 1 : 0) - (b.paused ? 1 : 0);
      return donePct(b) - donePct(a);
    }),
    [challenges, activeLength]
  );

  const activeChallenges = useMemo(
    () => filtered.filter((challenge) => challenge.progress < challenge.days),
    [filtered]
  );

  const completedChallenges = useMemo(
    () => filtered.filter((challenge) => challenge.progress >= challenge.days),
    [filtered]
  );

  const nearCompletion = useMemo(() => {
    return [...activeChallenges].filter((challenge) => !challenge.paused).sort((a, b) => donePct(b) - donePct(a))[0] || null;
  }, [activeChallenges]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const completed = completedChallenges.length;
    const avg = total ? Math.round(filtered.reduce((sum, challenge) => sum + donePct(challenge), 0) / total) : 0;
    const paused = activeChallenges.filter((challenge) => challenge.paused).length;
    return { total, completed, avg, paused, active: activeChallenges.length };
  }, [filtered, completedChallenges.length, activeChallenges]);

  const missionDirection = useMemo(() => {
    if (nearCompletion) {
      return {
        title: 'Fechar o ciclo mais avançado',
        body: 'Você já tem uma missão perto do fim. Vale concluir esse ciclo antes de abrir outro.',
        primaryLabel: 'Abrir progresso',
        primaryTab: 'stats',
        secondaryLabel: 'Ver hábitos',
        secondaryTab: 'habits',
      };
    }
    if (summary.active > 0) {
      return {
        title: 'Sustentar o que já começou',
        body: 'Suas missões ativas pedem constância pequena e repetida. Hábitos ajudam a não depender só de motivação.',
        primaryLabel: 'Abrir hábitos',
        primaryTab: 'habits',
        secondaryLabel: 'Ver trilhas',
        secondaryTab: 'tracks',
      };
    }
    return {
      title: 'Começar simples costuma funcionar melhor',
      body: 'Se não há missão em andamento, um hábito diário ou uma trilha curta pode preparar um ciclo melhor.',
      primaryLabel: 'Abrir hábitos',
      primaryTab: 'habits',
      secondaryLabel: 'Ver trilhas',
      secondaryTab: 'tracks',
    };
  }, [nearCompletion, summary.active]);

  useEffect(() => {
    const normalized = challenges.map((challenge) => (
      challenge.progress >= challenge.days && !challenge.completedAt
        ? { ...challenge, completedAt: new Date().toISOString(), paused: false }
        : challenge.progress < challenge.days && challenge.completedAt
          ? { ...challenge, completedAt: undefined }
          : challenge
    ));
    const changed = normalized.some((item, index) => item !== challenges[index]);
    if (changed) setChallenges(normalized);
  }, [challenges, setChallenges]);

  useEffect(() => {
    const safeRead = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const habitsHistory = safeRead('psico_habits_history');
    const moodHistory = safeRead('moodHistory');
    const gratitudeEntries = safeRead('gratitudeEntries');
    const diaryEntries = safeRead('emotionEntries');
    const healthyMessages = safeRead('psico_healthy_self');

    const candidates = [
      {
        score: habitsHistory && typeof habitsHistory === 'object' ? Object.keys(habitsHistory).length : 0,
        linkedTab: 'habits',
        title: '21 dias de consistência com hábitos',
        why: 'Você já vem usando hábitos. Um ciclo maior aproveita esse ritmo e ajuda a consolidar constância.',
        days: 21 as const,
      },
      {
        score: Array.isArray(moodHistory) ? moodHistory.length : 0,
        linkedTab: 'mood',
        title: '7 dias de check-in emocional',
        why: 'Seu uso recente do Diário de Humor indica que um ciclo curto de observação pode render leitura mais clara.',
        days: 7 as const,
      },
      {
        score: Array.isArray(gratitudeEntries) ? gratitudeEntries.length : 0,
        linkedTab: 'gratitude',
        title: '21 dias de gratidão possível',
        why: 'Você já tem contato com gratidão. Uma missão guiada pode transformar isso em prática recorrente.',
        days: 21 as const,
      },
      {
        score: Array.isArray(diaryEntries) ? diaryEntries.length : 0,
        linkedTab: 'diary',
        title: '30 dias de diário emocional',
        why: 'Como você já escreve no diário, um ciclo de 30 dias faz mais sentido do que começar de forma aleatória.',
        days: 30 as const,
      },
      {
        score: Array.isArray(healthyMessages) ? healthyMessages.length : 0,
        linkedTab: 'healthymessages',
        title: '21 dias sem autocrítica',
        why: 'Suas mensagens de cuidado indicam uma boa base para sustentar uma prática de linguagem interna mais justa.',
        days: 21 as const,
      },
    ].sort((a, b) => b.score - a.score);

    const best = candidates[0];
    setUsageSuggestion(best && best.score > 0 ? best : {
      linkedTab: 'habits',
      title: '7 dias de autocuidado leve',
      why: 'Se ainda não há muito histórico, começar pequeno costuma funcionar melhor do que um ciclo longo demais.',
      days: 7,
      score: 0,
    });
  }, []);

  const updateChallenge = (challengeId: string, updater: (challenge: Challenge) => Challenge) => {
    setChallenges(challenges.map((item) => {
      if (item.id !== challengeId) return item;
      const previousProgress = item.progress;
      const next = updater(item);
      if (next.progress > previousProgress) onProgressIncrement?.();
      if (next.progress >= next.days) {
        return { ...next, progress: next.days, completedAt: next.completedAt || new Date().toISOString(), paused: false };
      }
      return { ...next, completedAt: undefined };
    }));
  };

  const createChallenge = (payload?: { title: string; linkedTab: string; why: string }) => {
    const nextTitle = (payload?.title || title).trim();
    if (!nextTitle) return;
    const item: Challenge = {
      id: crypto.randomUUID(),
      title: nextTitle,
      days: activeLength,
      progress: 0,
      createdAt: new Date().toISOString(),
      linkedTab: payload?.linkedTab || linkedTab,
      why: payload?.why || why.trim(),
      paused: false,
    };
    setChallenges([item, ...challenges]);
    setTitle('');
    setWhy('');
    setLinkedTab('habits');
  };

  const shareChallenge = async (challenge: Challenge, platform: SharePlatform) => {
    await shareText(buildChallengeShareText(challenge.title, challenge.why), platform);
  };

  const exportChallenge = async (challenge: Challenge) => {
    const text = buildChallengeShareText(challenge.title, challenge.why);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Ciclos guiados"
          title="Missões"
          description="Ciclos de 7, 21 e 30 dias para sustentar uma prática com começo, meio e fim."
          icon="🎯"
        />
      </div>

      <div data-card-glyph="🧭" className={`sereno-ornament-card rounded-[2rem] p-5 border mb-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-violet-700', 'text-violet-300')}`}>Rotina com direção</p>
            <h3 className="mt-2 text-lg font-black">Missões transformam intenção em ciclo real</h3>
            <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>
              Use hábitos para o cuidado diário, missões para criar continuidade e estatísticas para enxergar o avanço com mais clareza.
            </p>
          </div>
          <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${c('bg-violet-50 border border-violet-100 text-violet-800', 'bg-slate-900 text-slate-200 border border-slate-700')}`}>
            <p className="text-lg font-black">{summary.active}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">em andamento</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button onClick={() => onNavigate?.('habits')} className={`rounded-2xl px-3 py-3 text-xs font-black ${c('bg-emerald-50 text-emerald-800 border border-emerald-100', 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20')}`}>Hábitos</button>
          <button onClick={() => onNavigate?.('stats')} className={`rounded-2xl px-3 py-3 text-xs font-black ${c('bg-slate-50 text-slate-700 border border-slate-200', 'bg-slate-900 text-slate-100 border border-slate-700')}`}>Progresso</button>
          <button onClick={() => onNavigate?.('tracks')} className={`rounded-2xl px-3 py-3 text-xs font-black ${c('bg-indigo-50 text-indigo-800 border border-indigo-100', 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20')}`}>Trilhas</button>
        </div>
      </div>

      <div className={`grid grid-cols-3 gap-2 mb-5 rounded-3xl border p-2 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
        {[7, 21, 30].map((days) => (
          <button
            key={days}
            onClick={() => setActiveLength(days as 7 | 21 | 30)}
            className={`py-3 rounded-2xl text-sm font-black transition-all ${
              activeLength === days
                ? `bg-gradient-to-r ${dayMeta[days as 7 | 21 | 30].accent} text-white shadow-lg`
                : c('bg-slate-50 text-slate-600', 'bg-slate-900 text-slate-300')
            }`}
          >
            {days} dias
          </button>
        ))}
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${dm ? activeMeta.chipDark : activeMeta.chipLight}`}>{activeMeta.title}</span>
            <h3 className="font-bold text-lg mt-3">{activeMeta.desc}</h3>
            <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-300')}`}>
              {activeLength === 7 && 'Use para ganhar tração sem sobrecarga.'}
              {activeLength === 21 && 'Use para consolidar um cuidado recorrente.'}
              {activeLength === 30 && 'Use para percursos mais profundos e com mais material de observação.'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold">{summary.completed}/{summary.total}</p>
            <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>concluídos</p>
            <p className="text-lg font-black mt-2">{summary.avg}%</p>
            <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>média</p>
            {summary.paused > 0 && (
              <>
                <p className="text-lg font-black mt-2">{summary.paused}</p>
                <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>em pausa</p>
              </>
            )}
          </div>
        </div>
      </div>

      {usageSuggestion && (
        <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Sugestão do momento</p>
          <h3 className="font-bold text-lg mt-2">{usageSuggestion.title}</h3>
          <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-300')}`}>{usageSuggestion.why}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => {
                setActiveLength(usageSuggestion.days);
                createChallenge({ title: usageSuggestion.title, linkedTab: usageSuggestion.linkedTab, why: usageSuggestion.why });
              }}
              className="py-3 rounded-2xl text-sm font-bold bg-violet-600 text-white"
            >
              Começar agora
            </button>
            <button
              onClick={() => onNavigate?.(usageSuggestion.linkedTab as any)}
              className={`py-3 rounded-2xl text-sm font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200')}`}
            >
              Ver recurso
            </button>
          </div>
        </div>
      )}

      {nearCompletion && (
        <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Mais perto de fechar</p>
          <h3 className="font-bold text-lg mt-2">{nearCompletion.title}</h3>
          <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-300')}`}>{nearCompletion.why || 'Essa missão já está avançada. Vale fechar o ciclo antes de começar outra.'}</p>
          <div className={`h-2 rounded-full mt-4 ${c('bg-slate-100', 'bg-slate-700')}`}>
            <div className={`h-2 rounded-full bg-gradient-to-r ${activeMeta.accent}`} style={{ width: `${donePct(nearCompletion)}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => updateChallenge(nearCompletion.id, (item) => ({ ...item, progress: Math.min(item.days, item.progress + 1) }))}
              className="py-3 rounded-2xl text-sm font-bold bg-emerald-600 text-white"
            >
              Avançar 1 dia
            </button>
            {nearCompletion.linkedTab && (
              <button
                onClick={() => onNavigate?.(nearCompletion.linkedTab as any)}
                className={`py-3 rounded-2xl text-sm font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200')}`}
              >
                Abrir recurso
              </button>
            )}
          </div>
        </div>
      )}

      <div data-card-glyph="🪜" className={`sereno-ornament-card rounded-[2rem] p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Próximo movimento</p>
        <h3 className="mt-2 text-lg font-black">{missionDirection.title}</h3>
        <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{missionDirection.body}</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => onNavigate?.(missionDirection.primaryTab as any)}
            className="py-3 rounded-2xl text-sm font-bold bg-emerald-600 text-white"
          >
            {missionDirection.primaryLabel}
          </button>
          <button
            onClick={() => onNavigate?.(missionDirection.secondaryTab as any)}
            className={`py-3 rounded-2xl text-sm font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200')}`}
          >
            {missionDirection.secondaryLabel}
          </button>
        </div>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Sugestões para {activeLength} dias</h3>
        <div className="space-y-3">
          {challengeTemplates[activeLength].map((template) => (
            <button
              key={template.title}
              onClick={() => createChallenge(template)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${c('bg-slate-50 border-slate-200 hover:bg-slate-100', 'bg-slate-900 border-slate-700 hover:bg-slate-800')}`}
            >
              <p className="font-bold text-sm">{template.title}</p>
              <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{template.why}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Criar missão própria</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Ex: ${activeLength} dias de ...`}
          className={`w-full p-3 rounded-xl border text-sm mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}
        />
        <textarea
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          rows={3}
          placeholder="Por que essa missão importa para você?"
          className={`w-full p-3 rounded-xl border text-sm mb-3 resize-none ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}
        />
        <select
          value={linkedTab}
          onChange={(e) => setLinkedTab(e.target.value)}
          className={`w-full p-3 rounded-xl border text-sm mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}
        >
          <option value="habits">Hábitos</option>
          <option value="breathing">Respiração</option>
          <option value="mood">Diário de Humor</option>
          <option value="diary">Diário</option>
          <option value="gratitude">Gratidão</option>
          <option value="sleep">Sono</option>
          <option value="microtasks">Microtarefas</option>
          <option value="assertiveness">Assertividade</option>
          <option value="tracks">Trilhas</option>
          <option value="psychoedu">Psicoeducação Gamer</option>
        </select>
        <button onClick={() => createChallenge()} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">Criar missão</button>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Ativos</h3>
            <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{summary.active} em andamento</span>
          </div>
          {activeChallenges.length === 0 && (
            <div className={`rounded-3xl p-6 border text-center ${c('bg-white border-slate-100 text-slate-600', 'bg-slate-800/70 border-slate-700 text-slate-300')}`}>
              <p className="font-semibold">Nenhuma missão ativa de {activeLength} dias.</p>
              <p className="text-sm mt-2">Escolha uma sugestão acima ou crie o seu próprio ciclo.</p>
            </div>
          )}

          <div className="space-y-3">
            {activeChallenges.map((challenge) => (
              <div key={challenge.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{challenge.title}</h4>
                      {challenge.paused && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${c('bg-amber-100 text-amber-700', 'bg-amber-950/40 text-amber-300')}`}>Em pausa</span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{challenge.why || 'Desafio pessoal em andamento.'}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0">{challenge.progress}/{challenge.days}</span>
                </div>
                <div className={`h-2 rounded-full ${c('bg-slate-100', 'bg-slate-700')}`}>
                  <div className={`h-2 rounded-full bg-gradient-to-r ${activeMeta.accent}`} style={{ width: `${donePct(challenge)}%` }} />
                </div>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  <button onClick={() => updateChallenge(challenge.id, (item) => ({ ...item, progress: Math.max(0, item.progress - 1) }))} className={`py-2 rounded text-xs font-bold ${c('bg-slate-100', 'bg-slate-700')}`}>-1</button>
                  <button onClick={() => updateChallenge(challenge.id, (item) => ({ ...item, progress: Math.min(item.days, item.progress + 1) }))} className="py-2 rounded text-xs font-bold bg-emerald-500 text-white">+1 dia</button>
                  <button onClick={() => updateChallenge(challenge.id, (item) => ({ ...item, paused: !item.paused }))} className={`py-2 rounded text-xs font-bold ${challenge.paused ? 'bg-sky-600 text-white' : c('bg-amber-100 text-amber-700', 'bg-amber-950/30 text-amber-300')}`}>{challenge.paused ? 'Retomar' : 'Pausar'}</button>
                  <button onClick={() => challenge.linkedTab && onNavigate?.(challenge.linkedTab as any)} className={`py-2 rounded text-xs font-bold ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-900/30 text-indigo-300')}`}>Abrir</button>
                  <button onClick={() => setChallenges(challenges.filter((item) => item.id !== challenge.id))} className="py-2 rounded text-xs font-bold bg-rose-500 text-white">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Concluídos</h3>
            <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{summary.completed} fechados</span>
          </div>
          {completedChallenges.length === 0 && (
            <div className={`rounded-3xl p-6 border text-center ${c('bg-white border-slate-100 text-slate-600', 'bg-slate-800/70 border-slate-700 text-slate-300')}`}>
              <p className="font-semibold">Nenhum ciclo concluído em {activeLength} dias ainda.</p>
              <p className="text-sm mt-2">Quando você fechar uma missão, ela passa a ficar registrada aqui.</p>
            </div>
          )}

          <div className="space-y-3">
            {completedChallenges.map((challenge) => (
              <div key={challenge.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold text-sm">{challenge.title}</h4>
                    <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{challenge.why || 'Ciclo concluído.'}</p>
                    {challenge.completedAt && (
                      <p className={`text-[11px] mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Concluído em {new Date(challenge.completedAt).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-950/40 text-emerald-300')}`}>100%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button onClick={() => setShareChallengeTarget(challenge)} className="py-2 rounded text-xs font-bold bg-violet-600 text-white">Compartilhar</button>
                  <button onClick={() => exportChallenge(challenge)} className={`py-2 rounded text-xs font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-100')}`}>Exportar</button>
                  <button onClick={() => setChallenges(challenges.filter((item) => item.id !== challenge.id))} className="py-2 rounded text-xs font-bold bg-rose-500 text-white">Remover</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className={`rounded-3xl p-6 border text-center ${c('bg-white border-slate-100 text-slate-600', 'bg-slate-800/70 border-slate-700 text-slate-300')}`}>
            <p className="font-semibold">Nenhuma missão ativa de {activeLength} dias.</p>
            <p className="text-sm mt-2">Escolha uma sugestão acima ou crie o seu próprio ciclo.</p>
          </div>
        )}
      </div>
      <SharePlatformModal
        open={!!shareChallengeTarget}
        darkMode={dm}
        title={shareChallengeTarget ? shareChallengeTarget.title : 'Compartilhar missão'}
        onSelect={(platform) => {
          if (shareChallengeTarget) shareChallenge(shareChallengeTarget, platform);
          setShareChallengeTarget(null);
        }}
        onClose={() => setShareChallengeTarget(null)}
      />
    </div>
  );
}
