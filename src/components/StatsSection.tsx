'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import AppNoticeModal from './AppNoticeModal';
import { MoodEntry } from '@/components/MoodSection';
import SectionHeroCard from './SectionHeroCard';
import BadgesSection from './BadgesSection';

interface EmotionEntry {
    id: string;
    situation: string;
    date: string;
    time: string;
    emotion: string;
    level: number;
    feelings: string;
    createdAt: string;
}

interface StatsSectionProps {
    moodHistory: MoodEntry[];
    diaryEntries: EmotionEntry[];
    userProgress: {
        totalMinutes: number;
        [key: string]: any;
    };
    setUserProgress?: Dispatch<SetStateAction<any>>;
    darkMode?: boolean;
    onNavigate?: (tab: 'habits' | 'missions' | 'tracks', params?: Record<string, any>) => void;
}

type SectionKey = 'overview' | 'patterns' | 'body' | 'insights';

const SECTION_TITLES: Record<SectionKey, { title: string; subtitle: string; icon: string }> = {
    overview: { title: 'Visão geral', subtitle: 'Resumo rápido do momento.', icon: '📌' },
    patterns: { title: 'Padrões emocionais', subtitle: 'Emoções e gatilhos que mais se repetem.', icon: '🧭' },
    body: { title: 'Corpo e rotina', subtitle: 'Sono, energia e hábitos.', icon: '🌿' },
    insights: { title: 'Insights e recomendações', subtitle: 'Leituras curtas para agir.', icon: '🧠' },
};

const TRIGGER_LABELS: Record<string, string> = {
    work: '💼 Trabalho',
    routine: '🗓️ Rotina',
    family: '🏠 Família',
    relationships: '❤️ Relacionamentos',
    health: '🏥 Saúde',
    sleep: '🌙 Sono/Descanso',
    social: '🤝 Social',
    finance: '💰 Finanças',
    self_pressure: '🎯 Autocobrança',
    inner_conflict: '🧠 Conflito interno',
    memories: '🕰️ Memórias',
    hobbies: '🎨 Lazer',
    self: '✨ Cuidado pessoal',
    unclear: '🌫️ Sem motivo claro',
    other: '❓ Outro',
};

const NEGATIVE_EMOTIONS = ['ansioso', 'triste', 'irritado', 'estressado', 'sobrecarregado', 'desmotivado', 'solitario', 'envergonhado', 'culpado', 'confuso', 'cansado'];
const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const parseMoodDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatNumber = (value: number | null | undefined, digits = 1) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return value.toFixed(digits);
};

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
const buildTopEntries = (counts: Record<string, number>) => Object.entries(counts).sort((a, b) => b[1] - a[1]);

export default function StatsSection({ moodHistory, diaryEntries, userProgress, setUserProgress, darkMode: dm, onNavigate }: StatsSectionProps) {
    const [chartRange, setChartRange] = useState<7 | 30>(7);
    const [noticeMessage, setNoticeMessage] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
        overview: true,
        patterns: true,
        body: false,
        insights: true,
    });
    const [habitStats, setHabitStats] = useState({ completedToday: 0, total: 0, history: {} as Record<string, string[]> });
    const [challengeStats, setChallengeStats] = useState({ active: 0, completed: 0, near: null as null | { title: string; progress: number; days: number } });
    const [trackStats, setTrackStats] = useState({ started: 0, completed: 0, steps: 0, near: null as null | { title: string; done: number; total: number } });

    const c = (l: string, d: string) => (dm ? d : l);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const storedHabits = localStorage.getItem('psico_habits_reqs');
        const storedHistory = localStorage.getItem('psico_habits_history');

        const habits = storedHabits ? JSON.parse(storedHabits) : [];
        const history = storedHistory ? JSON.parse(storedHistory) : {};
        const completedToday = Array.isArray(history[today]) ? history[today].length : 0;

        setHabitStats({
            completedToday,
            total: Array.isArray(habits) ? habits.length : 0,
            history: history && typeof history === 'object' ? history : {},
        });

        const storedChallenges = localStorage.getItem('psico_challenges');
        const challenges = storedChallenges ? JSON.parse(storedChallenges) : [];
        const activeChallenges = Array.isArray(challenges) ? challenges : [];
        const completedChallenges = activeChallenges.filter((item: any) => item.progress >= item.days).length;
        const nearChallenge = [...activeChallenges]
            .filter((item: any) => item.progress < item.days)
            .sort((a: any, b: any) => (b.progress / b.days) - (a.progress / a.days))[0] || null;
        setChallengeStats({
            active: activeChallenges.length,
            completed: completedChallenges,
            near: nearChallenge ? { title: nearChallenge.title, progress: nearChallenge.progress, days: nearChallenge.days } : null,
        });

        const storedTrackProgress = localStorage.getItem('psico_tracks_progress');
        const storedTrackRewards = localStorage.getItem('psico_tracks_rewards');
        const trackProgress = storedTrackProgress ? JSON.parse(storedTrackProgress) : {};
        const trackRewards = storedTrackRewards ? JSON.parse(storedTrackRewards) : [];
        const trackTotals: Record<string, number> = {
            ansiedade: 4,
            burnout: 4,
            autoestima: 4,
            luto: 5,
            separacao: 4,
            panico: 4,
            insonia: 4,
            procrastinacao: 4,
            dependencia: 4,
            'ansiedade-social': 4,
        };
        const trackNames: Record<string, string> = {
            ansiedade: 'Ansiedade',
            burnout: 'Burnout',
            autoestima: 'Baixa Autoestima',
            luto: 'Luto e Perdas',
            separacao: 'Separação Afetiva',
            panico: 'Crise de Pânico',
            insonia: 'Insônia e Mente Acelerada',
            procrastinacao: 'Procrastinação Ansiosa',
            dependencia: 'Dependência Emocional',
            'ansiedade-social': 'Ansiedade Social',
        };
        const startedTracks = Object.values(trackProgress).filter((value: any) => typeof value === 'number' && value > 0).length;
        const trackSteps = Object.values(trackProgress).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
        const nearTrack = Object.entries(trackProgress)
            .map(([id, done]) => ({ id, done: typeof done === 'number' ? done : 0, total: trackTotals[id] || 0 }))
            .filter((item) => item.done > 0 && item.total > 0 && item.done < item.total)
            .sort((a, b) => (b.done / b.total) - (a.done / a.total))[0] || null;
        setTrackStats({
            started: startedTracks,
            completed: Array.isArray(trackRewards) ? trackRewards.length : 0,
            steps: trackSteps,
            near: nearTrack ? { title: trackNames[nearTrack.id] || nearTrack.id, done: nearTrack.done, total: nearTrack.total } : null,
        });
    }, []);

    const normalizedMoodHistory = useMemo(() => {
        return moodHistory
            .map((entry) => {
                const parsedDate = parseMoodDate(entry.date);
                return parsedDate ? { ...entry, parsedDate, timestamp: parsedDate.getTime() } : null;
            })
            .filter((entry): entry is MoodEntry & { parsedDate: Date; timestamp: number } => entry !== null)
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [moodHistory]);

    const recent30Moods = normalizedMoodHistory.slice(-30);
    const recent7Moods = normalizedMoodHistory.slice(-7);
    const recent30Diary = diaryEntries.slice(-30);
    const now = Date.now();

    const last30Window = normalizedMoodHistory.filter((entry) => entry.timestamp >= now - 30 * 24 * 60 * 60 * 1000);
    const prev30Window = normalizedMoodHistory.filter((entry) => entry.timestamp < now - 30 * 24 * 60 * 60 * 1000 && entry.timestamp >= now - 60 * 24 * 60 * 60 * 1000);

    const avgIntensityRecent = average(recent7Moods.map((entry) => entry.intensity).filter(Boolean as any));
    const avgSleep = average(recent7Moods.map((entry) => entry.sleepQuality).filter((value): value is number => typeof value === 'number'));
    const avgEnergy = average(recent7Moods.map((entry) => entry.energyLevel).filter((value): value is number => typeof value === 'number'));
    const avgSociability = average(recent7Moods.map((entry) => entry.sociability).filter((value): value is number => typeof value === 'number'));
    const avgLast30 = average(last30Window.map((entry) => entry.intensity).filter(Boolean as any));
    const avgPrev30 = average(prev30Window.map((entry) => entry.intensity).filter(Boolean as any));

    const moodCounts = recent30Moods.reduce<Record<string, number>>((acc, entry) => {
        if (entry.primaryEmotion) acc[entry.primaryEmotion] = (acc[entry.primaryEmotion] || 0) + 1;
        return acc;
    }, {});
    const diaryCounts = recent30Diary.reduce<Record<string, number>>((acc, entry) => {
        if (entry.emotion) acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
        return acc;
    }, {});
    const triggerCounts = recent30Moods.reduce<Record<string, number>>((acc, entry) => {
        if (entry.trigger) acc[entry.trigger] = (acc[entry.trigger] || 0) + 1;
        return acc;
    }, {});

    const topMoodEmotions = buildTopEntries(moodCounts);
    const topDiaryEmotions = buildTopEntries(diaryCounts);
    const topTriggers = buildTopEntries(triggerCounts);
    const maxMoodCount = topMoodEmotions[0]?.[1] || 1;
    const maxDiaryCount = topDiaryEmotions[0]?.[1] || 1;
    const maxTriggerCount = topTriggers[0]?.[1] || 1;

    const weekdayAnxiety = normalizedMoodHistory.reduce<Record<string, { total: number; anxious: number }>>((acc, entry) => {
        const day = weekdayNames[entry.parsedDate.getDay()];
        acc[day] = acc[day] || { total: 0, anxious: 0 };
        acc[day].total += 1;
        if ((entry.primaryEmotion || '').toLowerCase().includes('ansi')) acc[day].anxious += 1;
        return acc;
    }, {});

    const weekdayPattern = Object.entries(weekdayAnxiety)
        .map(([day, values]) => ({ day, ratio: values.total ? values.anxious / values.total : 0 }))
        .sort((a, b) => b.ratio - a.ratio)[0];

    const anxietyByHour = recent30Moods.reduce<Record<number, number>>((acc, entry) => {
        if ((entry.primaryEmotion || '').toLowerCase().includes('ansi')) {
            const hour = Number((entry.time || '00:00').split(':')[0]);
            if (!Number.isNaN(hour)) acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
    }, {});
    const peakAnxietyHour = Object.entries(anxietyByHour).sort((a, b) => b[1] - a[1])[0]?.[0];

    const chartSeries = recent30Moods
        .filter((entry) => typeof entry.intensity === 'number' && entry.intensity > 0)
        .map((entry) => ({ date: entry.date, intensity: entry.intensity, emotion: entry.primaryEmotion }));
    const visibleChartSeries = chartSeries.slice(-chartRange);

    const habitEntries = useMemo(() => {
        return recent30Moods.map((entry) => {
            const completed = Array.isArray(habitStats.history[entry.date]) ? habitStats.history[entry.date].length : 0;
            return { ...entry, completedHabits: completed };
        });
    }, [recent30Moods, habitStats.history]);

    const avgIntensityWithHabits = average(habitEntries.filter((entry) => entry.completedHabits > 0).map((entry) => entry.intensity));
    const avgIntensityWithoutHabits = average(habitEntries.filter((entry) => entry.completedHabits === 0).map((entry) => entry.intensity));
    const recentCycleEntries = recent30Moods.filter((entry) => entry.menstrualMode && entry.menstrualMode !== 'off');
    const cycleCounts = recentCycleEntries.reduce<Record<string, number>>((acc, entry) => {
        const key = entry.menstrualMode as string;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    const topCyclePhase = buildTopEntries(cycleCounts)[0]?.[0] || null;
    const cycleIntensity = average(recentCycleEntries.map((entry) => entry.intensity));

    const comparisonText = useMemo(() => {
        if (avgLast30 === null || avgPrev30 === null) return 'Ainda faltam dois blocos completos de 30 dias para comparar seu ritmo.';
        const delta = avgLast30 - avgPrev30;
        if (delta >= 0.35) return `Nos últimos 30 dias, sua intensidade média ficou ${delta.toFixed(1)} ponto acima do bloco anterior.`;
        if (delta <= -0.35) return `Nos últimos 30 dias, sua intensidade média caiu ${Math.abs(delta).toFixed(1)} ponto em relação ao bloco anterior.`;
        return 'Sua intensidade média ficou estável em relação ao bloco anterior.';
    }, [avgLast30, avgPrev30]);

    const bodyComparisonText = useMemo(() => {
        if (avgSleep === null && avgEnergy === null) return 'Ainda faltam registros do corpo para uma leitura mais clara.';
        const lines: string[] = [];
        if (avgSleep !== null && avgIntensityRecent !== null) {
            if (avgSleep < 3 && avgIntensityRecent >= 3.5) lines.push('Sono mais baixo e intensidade mais alta apareceram juntos.');
            else if (avgSleep >= 3.5 && avgIntensityRecent <= 3) lines.push('Sono melhor e intensidade mais regulada apareceram juntos.');
        }
        if (avgEnergy !== null) {
            if (avgEnergy < 3) lines.push('Sua energia recente está baixa. Vale reduzir exigência e priorizar recuperação.');
            else if (avgEnergy >= 3.5) lines.push('Sua energia recente está mais alta, o que favorece práticas curtas com mais constância.');
        }
        if (avgIntensityWithHabits !== null && avgIntensityWithoutHabits !== null) {
            if (avgIntensityWithHabits < avgIntensityWithoutHabits) lines.push('Nos dias com hábitos concluídos, sua intensidade tende a cair.');
            else if (avgIntensityWithHabits > avgIntensityWithoutHabits) lines.push('Os hábitos ainda não estão reduzindo a intensidade por si só.');
        }
        return lines[0] || 'Seu corpo e sua rotina ainda não mostram um padrão forte o bastante.';
    }, [avgSleep, avgEnergy, avgIntensityRecent, avgIntensityWithHabits, avgIntensityWithoutHabits]);

    const generatedInsightCards = useMemo(() => {
        const topEmotion = topMoodEmotions[0]?.[0];
        const topTrigger = topTriggers[0]?.[0];
        const topTriggerLabel = topTrigger ? TRIGGER_LABELS[topTrigger] || topTrigger : null;
        const negativeRecentCount = recent7Moods.filter((entry) => NEGATIVE_EMOTIONS.includes(entry.primaryEmotion)).length;
        const mostAppeared = topEmotion
            ? `"${topEmotion}" foi a emoção que mais apareceu.${topTriggerLabel ? ` O gatilho mais frequente foi ${topTriggerLabel}.` : ''}`
            : 'Ainda faltam registros para mostrar o que mais apareceu.';

        let attention = 'Siga registrando humor e sinais do corpo para essa leitura ganhar mais clareza.';
        if (negativeRecentCount >= 4) attention = 'Sinais de sobrecarga apareceram várias vezes. Vale reduzir estímulos e encurtar as próximas demandas.';
        else if (avgSleep !== null && avgSleep < 3) attention = 'Seu sono recente pede atenção. Ele pode estar ampliando a intensidade do que você sente.';
        else if (weekdayPattern && weekdayPattern.ratio >= 0.5) attention = `Há um pico de ansiedade em ${weekdayPattern.day}s. Vale antecipar uma prática curta nesse período.`;

        let nextCare = 'Faça um check-in curto amanhã no mesmo horário para comparar o ritmo.';
        if (peakAnxietyHour) nextCare = `Se puder, faça uma pausa rápida por volta de ${String(Math.max(0, Number(peakAnxietyHour) - 1)).padStart(2, '0')}:00 para chegar mais leve ao horário sensível.`;
        else if (avgIntensityWithHabits !== null && avgIntensityWithoutHabits !== null && avgIntensityWithHabits < avgIntensityWithoutHabits) nextCare = 'Retome um hábito simples hoje. Seus registros sugerem que isso ajuda.';

        return [
            { title: 'O que mais apareceu', text: mostAppeared, tone: c('bg-indigo-50 border-indigo-100 text-indigo-900', 'bg-indigo-950/40 border-indigo-800/40 text-indigo-200') },
            { title: 'O que merece atenção', text: attention, tone: c('bg-amber-50 border-amber-100 text-amber-900', 'bg-amber-950/30 border-amber-800/40 text-amber-200') },
            { title: 'Um próximo cuidado', text: nextCare, tone: c('bg-emerald-50 border-emerald-100 text-emerald-900', 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200') },
        ];
    }, [topMoodEmotions, topTriggers, recent7Moods, avgSleep, weekdayPattern, peakAnxietyHour, avgIntensityWithHabits, avgIntensityWithoutHabits]);

    const topSummarySentence = useMemo(() => {
        const parts: string[] = [];
        if (avgLast30 !== null && avgPrev30 !== null) {
            const delta = avgLast30 - avgPrev30;
            if (delta >= 0.35) parts.push('Seu mês recente teve intensidade mais alta');
            else if (delta <= -0.35) parts.push('Seu mês recente ficou emocionalmente mais leve');
        }
        if (avgSleep !== null) {
            if (avgSleep < 3) parts.push('com sono mais baixo');
            else if (avgSleep >= 3.5) parts.push('com sono mais estável');
        }
        if (weekdayPattern && weekdayPattern.ratio >= 0.5) {
            parts.push(`e ansiedade concentrada em ${weekdayPattern.day}`);
        }
        if (parts.length === 0) {
            return 'Seus registros já começam a desenhar um retrato do momento.';
        }
        return `${parts.join(', ')}.`;
    }, [avgLast30, avgPrev30, avgSleep, weekdayPattern]);

    const quickReadChips = useMemo(() => {
        const chips: string[] = [];
        if (avgSleep !== null && avgSleep < 3) chips.push('Sono em queda');
        if (avgEnergy !== null && avgEnergy < 3) chips.push('Energia baixa');
        if (avgIntensityWithHabits !== null && avgIntensityWithoutHabits !== null && avgIntensityWithHabits < avgIntensityWithoutHabits) {
            chips.push('Hábitos ajudam');
        }
        if (weekdayPattern && weekdayPattern.ratio >= 0.5) chips.push(`Ansiedade em ${weekdayPattern.day}`);
        if (topMoodEmotions[0]?.[0]) chips.push(`Emoção dominante: ${topMoodEmotions[0][0]}`);
        if (challengeStats.active > 0) chips.push(`${challengeStats.active} missão${challengeStats.active === 1 ? '' : 'ões'} ativa${challengeStats.active === 1 ? '' : 's'}`);
        if (trackStats.started > 0) chips.push(`${trackStats.started} trilha${trackStats.started === 1 ? '' : 's'} iniciada${trackStats.started === 1 ? '' : 's'}`);
        return chips.slice(0, 5);
    }, [avgSleep, avgEnergy, avgIntensityWithHabits, avgIntensityWithoutHabits, weekdayPattern, topMoodEmotions, challengeStats.active, trackStats.started]);

    const nextCareAction = useMemo(() => {
        if (habitStats.total === 0) {
            return {
                eyebrow: 'Próximo cuidado',
                title: 'Monte uma base de rotina',
                text: 'Comece por um hábito simples para transformar leitura em ação.',
                primaryLabel: 'Abrir Hábitos',
                primaryTab: 'habits' as const,
                secondaryLabel: 'Ver Missões',
                secondaryTab: 'missions' as const,
            };
        }
        if (challengeStats.active > 0) {
            return {
                eyebrow: 'Próximo cuidado',
                title: 'Feche o ciclo que já está em andamento',
                text: 'Você já começou um movimento. Fechar esse ciclo ajuda a manter consistência.',
                primaryLabel: 'Abrir Missões',
                primaryTab: 'missions' as const,
                secondaryLabel: 'Ver Hábitos',
                secondaryTab: 'habits' as const,
            };
        }
        if (trackStats.started > 0) {
            return {
                eyebrow: 'Próximo cuidado',
                title: 'Retome uma trilha antes de abrir outra',
                text: 'Voltar para uma trilha em andamento tende a render mais do que abrir outra.',
                primaryLabel: 'Abrir Trilhas',
                primaryTab: 'tracks' as const,
                secondaryLabel: 'Ver Hábitos',
                secondaryTab: 'habits' as const,
            };
        }
        return {
            eyebrow: 'Próximo cuidado',
            title: 'Use esta leitura para escolher um próximo passo pequeno',
            text: 'Transforme esta leitura em um hábito, missão curta ou trilha.',
            primaryLabel: 'Abrir Hábitos',
            primaryTab: 'habits' as const,
            secondaryLabel: 'Ver Trilhas',
            secondaryTab: 'tracks' as const,
        };
    }, [challengeStats.active, habitStats.total, trackStats.started]);

    const changesCard = useMemo(() => {
        const items: string[] = [];
        if (avgLast30 !== null && avgPrev30 !== null) {
            const delta = avgLast30 - avgPrev30;
            if (Math.abs(delta) >= 0.1) items.push(`${delta > 0 ? '+' : ''}${delta.toFixed(1)} na intensidade`);
        }
        if (avgSleep !== null) {
            items.push(`${avgSleep >= 3.5 ? '+' : avgSleep < 3 ? '-' : ''}${avgSleep.toFixed(1)} no sono recente`);
        }
        if (habitStats.total > 0) items.push(`+${habitStats.completedToday} hábitos hoje`);
        return items;
    }, [avgLast30, avgPrev30, avgSleep, habitStats.completedToday, habitStats.total]);

    const guidedEmptyText = 'Registre humor por alguns dias e preencha sono, energia e hábitos para esta leitura ficar mais rica.';

    const setSmartCheckin = () => {
        if (typeof window === 'undefined' || !peakAnxietyHour) return;
        const hh = String(Math.max(0, Number(peakAnxietyHour) - 1)).padStart(2, '0');
        const raw = localStorage.getItem('sereno_reminder_settings');
        const current = raw ? JSON.parse(raw) : {};
        const next = { ...current, moodReminder: true, moodTime: `${hh}:00` };
        localStorage.setItem('sereno_reminder_settings', JSON.stringify(next));
        setNoticeMessage(`Check-in contextual configurado para ${hh}:00.`);
    };

    const toggleSection = (key: SectionKey) => {
        setExpandedSections((current) => ({ ...current, [key]: !current[key] }));
    };

    return (
        <div className={`p-4 animate-fade-in overflow-y-auto pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <AppNoticeModal
                open={Boolean(noticeMessage)}
                title="Check-in contextual ativado"
                message={noticeMessage}
                onClose={() => setNoticeMessage('')}
                darkMode={dm}
                icon="📊"
                eyebrow="Estatísticas"
            />
            <div className="pt-4 mb-6">
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="Leitura do seu ritmo"
                    title="Estatísticas"
                    description="Um retrato do seu ritmo para transformar dado em direção."
                    icon="📊"
                />
            </div>

            <div data-card-glyph="🧭" className={`sereno-ornament-card rounded-[2rem] border p-5 mb-6 ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-indigo-700', 'text-indigo-300')}`}>Progresso em ação</p>
                        <h3 className="mt-2 text-lg font-black">Use os números para decidir seu próximo passo</h3>
                        <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
                            Hábitos sustentam o dia, missões criam ciclos e trilhas aprofundam temas.
                        </p>
                    </div>
                    <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${dm ? 'bg-slate-900 text-slate-200 border border-slate-700' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}>
                        <p className="text-lg font-black">{habitStats.completedToday}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]">hábitos hoje</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <button onClick={() => onNavigate?.('habits')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>Hábitos</button>
                    <button onClick={() => onNavigate?.('missions')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-violet-50 text-violet-800 border border-violet-100'}`}>Missões</button>
                    <button onClick={() => onNavigate?.('tracks')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>Trilhas</button>
                </div>
            </div>

            <div data-card-glyph="✨" className={`sereno-ornament-card rounded-[2rem] p-5 border mb-6 ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-emerald-700', 'text-emerald-300')}`}>{nextCareAction.eyebrow}</p>
                        <h3 className="mt-2 text-lg font-black">{nextCareAction.title}</h3>
                        <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>{nextCareAction.text}</p>
                    </div>
                    <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${dm ? 'bg-slate-900 text-slate-200 border border-slate-700' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>
                        <p className="text-lg font-black">{moodHistory.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]">registros</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                        onClick={() => onNavigate?.(nextCareAction.primaryTab)}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
                    >
                        {nextCareAction.primaryLabel}
                    </button>
                    <button
                        onClick={() => onNavigate?.(nextCareAction.secondaryTab)}
                        className={`rounded-2xl px-4 py-3 text-sm font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200 border border-slate-700')}`}
                    >
                        {nextCareAction.secondaryLabel}
                    </button>
                </div>
            </div>

            <div className={`rounded-3xl p-5 border mb-6 shadow-sm ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
                <p className={`text-[10px] uppercase tracking-[0.18em] font-black ${c('text-slate-500', 'text-slate-400')}`}>Resumo do momento</p>
                <p className={`mt-3 text-sm font-semibold leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>{topSummarySentence}</p>
                {quickReadChips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {quickReadChips.map((chip) => (
                            <span
                                key={chip}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-slate-100 text-slate-700', 'bg-slate-900/60 text-slate-300 border border-slate-700')}`}
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <SummaryCard darkMode={dm} title="Intensidade média" value={formatNumber(avgIntensityRecent)} tone="indigo" />
                    <SummaryCard darkMode={dm} title="Sono recente" value={formatNumber(avgSleep)} tone="sky" />
                    <SummaryCard darkMode={dm} title="Energia recente" value={formatNumber(avgEnergy)} tone="amber" />
                    <SummaryCard darkMode={dm} title="Hábitos hoje" value={`${habitStats.completedToday}/${habitStats.total}`} tone="rose" />
                    <SummaryCard darkMode={dm} title="Minutos de prática" value={String(userProgress.totalMinutes || 0)} tone="emerald" />
                    <SummaryCard darkMode={dm} title="Registros de humor" value={String(moodHistory.length)} tone="slate" />
                    <SummaryCard darkMode={dm} title="Missões ativas" value={String(challengeStats.active)} tone="violet" />
                    <SummaryCard darkMode={dm} title="Missões concluídas" value={String(challengeStats.completed)} tone="emerald" />
                    <SummaryCard darkMode={dm} title="Trilhas iniciadas" value={String(trackStats.started)} tone="indigo" />
                    <SummaryCard darkMode={dm} title="Trilhas concluídas" value={String(trackStats.completed)} tone="sky" />
                </div>
                {challengeStats.near && (
                    <div className={`mt-4 rounded-2xl p-4 border ${c('bg-violet-50 border-violet-100 text-violet-900', 'bg-violet-950/30 border-violet-800/40 text-violet-200')}`}>
                        <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-70">Desafio mais perto de fechar</p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed">{challengeStats.near.title}</p>
                        <p className="mt-1 text-sm">{challengeStats.near.progress}/{challengeStats.near.days} dias.</p>
                    </div>
                )}
                {trackStats.near && (
                    <div className={`mt-4 rounded-2xl p-4 border ${c('bg-sky-50 border-sky-100 text-sky-900', 'bg-sky-950/30 border-sky-800/40 text-sky-200')}`}>
                        <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-70">Trilha mais perto de fechar</p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed">{trackStats.near.title}</p>
                        <p className="mt-1 text-sm">{trackStats.near.done}/{trackStats.near.total} etapas.</p>
                    </div>
                )}
                <div className={`mt-4 rounded-2xl p-4 border ${c('bg-indigo-50 border-indigo-100 text-indigo-900', 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200')}`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-70">Comparação</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed">{comparisonText}</p>
                </div>
                <div className={`mt-4 rounded-2xl p-4 border ${c('bg-amber-50 border-amber-100 text-amber-900', 'bg-amber-950/30 border-amber-800/40 text-amber-200')}`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-70">Mudanças</p>
                    {changesCard.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {changesCard.map((item) => (
                                <span key={item} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-white/80 text-amber-900', 'bg-black/20 text-amber-100')}`}>
                                    {item}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-sm font-semibold leading-relaxed">Ainda faltam dados para mostrar mudanças com clareza.</p>
                    )}
                </div>
                <div className={`mt-4 rounded-2xl p-4 border ${c('bg-slate-50 border-slate-100 text-slate-700', 'bg-slate-900/40 border-slate-700 text-slate-300')}`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-70">De onde vêm essas métricas</p>
                    <div className="mt-2 space-y-1 text-sm font-medium leading-relaxed">
                        <p><strong>Diário de Humor:</strong> sono, energia, social e intensidade.</p>
                        <p><strong>Hábitos:</strong> o que foi concluído no dia.</p>
                        <p><strong>Práticas:</strong> minutos acumulados no app.</p>
                        <p><strong>Missões e Trilhas:</strong> progresso salvo ao longo do uso.</p>
                    </div>
                </div>
            </div>

            <section className={`rounded-3xl border mb-5 shadow-sm overflow-hidden ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="p-5 pb-0">
                    <p className={`text-[10px] uppercase tracking-[0.18em] font-black ${c('text-slate-500', 'text-slate-400')}`}>🏆 Conquistas</p>
                    <p className={`mt-2 text-sm font-semibold leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                        Marcos que nasceram da sua consistência no app.
                    </p>
                </div>
                {setUserProgress && (
                    <BadgesSection
                        userProgress={userProgress as any}
                        setUserProgress={setUserProgress}
                        darkMode={!!dm}
                        embedded
                        inlineInStats
                    />
                )}
            </section>

            {(Object.keys(SECTION_TITLES) as SectionKey[]).map((sectionKey) => (
                <section key={sectionKey} className={`rounded-3xl border mb-5 shadow-sm overflow-hidden ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <button
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left"
                    >
                        <div>
                            <p className={`text-[10px] uppercase tracking-[0.18em] font-black ${c('text-slate-500', 'text-slate-400')}`}>
                                {SECTION_TITLES[sectionKey].icon} {SECTION_TITLES[sectionKey].title}
                            </p>
                            <p className={`mt-2 text-sm font-semibold leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                                {SECTION_TITLES[sectionKey].subtitle}
                            </p>
                        </div>
                        <span className={`shrink-0 transition-transform ${expandedSections[sectionKey] ? 'rotate-180' : ''} ${c('text-slate-500', 'text-slate-400')}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                        </span>
                    </button>

                    {expandedSections[sectionKey] && (
                        <div className="px-5 pb-5">
                            {sectionKey === 'overview' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <MetricCompareCard darkMode={dm} title="Últimos 30 dias" value={formatNumber(avgLast30)} subtitle="intensidade média" tone="indigo" />
                                        <MetricCompareCard darkMode={dm} title="30 dias anteriores" value={formatNumber(avgPrev30)} subtitle="intensidade média" tone="slate" />
                                    </div>
                                    <div className={`rounded-2xl p-4 border ${c('bg-slate-50 border-slate-100', 'bg-slate-900/40 border-slate-700')}`}>
                                        <p className={`text-[10px] uppercase tracking-[0.16em] font-black ${c('text-slate-500', 'text-slate-400')}`}>Leitura</p>
                                        <p className={`mt-2 text-sm font-semibold leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>{bodyComparisonText}</p>
                                    </div>
                                    <div className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-900/40 border-slate-700')}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className={`font-black ${c('text-slate-800', 'text-slate-200')}`}>Linha de intensidade</h3>
                                            <div className={`flex items-center gap-1 rounded-full p-1 ${c('bg-slate-100', 'bg-slate-800')}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => setChartRange(7)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] transition-all ${chartRange === 7 ? 'bg-indigo-500 text-white' : c('text-slate-600', 'text-slate-400')}`}
                                                >
                                                    7
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setChartRange(30)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] transition-all ${chartRange === 30 ? 'bg-indigo-500 text-white' : c('text-slate-600', 'text-slate-400')}`}
                                                >
                                                    30
                                                </button>
                                            </div>
                                        </div>
                                        {chartSeries.length === 0 ? (
                                            <p className={`text-sm font-medium ${c('text-slate-500', 'text-slate-400')}`}>
                                                O gráfico aparece assim que existir intensidade registrada no Diário de Humor. {guidedEmptyText}
                                            </p>
                                        ) : (
                                            <>
                                                <div className="rounded-2xl px-3 py-4 overflow-x-auto custom-scrollbar bg-slate-50/60 dark:bg-slate-900/30">
                                                    <div className="flex items-end gap-2 h-40" style={{ minWidth: chartRange === 7 ? 280 : 520 }}>
                                                        {visibleChartSeries.map((entry, index) => (
                                                            <div key={`${entry.date}-${index}`} className="flex-1 min-w-[28px] h-full flex flex-col justify-end items-center gap-2 group relative">
                                                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-black text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-10">
                                                                    {new Date(`${entry.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {entry.intensity}/5
                                                                </div>
                                                                <div
                                                                    className={`w-full rounded-t-2xl shadow-sm transition-all duration-300 ${entry.intensity <= 2 ? 'bg-emerald-400 dark:bg-emerald-500' : entry.intensity === 3 ? 'bg-amber-400 dark:bg-amber-500' : 'bg-rose-400 dark:bg-rose-500'}`}
                                                                    style={{ height: `${Math.max((entry.intensity / 5) * 100, 12)}%` }}
                                                                />
                                                                <div className="text-center space-y-0.5">
                                                                    <p className={`text-[10px] font-black ${c('text-slate-500', 'text-slate-400')}`}>{entry.intensity}/5</p>
                                                                    <p className={`text-[10px] font-bold ${c('text-slate-600', 'text-slate-400')}`}>
                                                                        {new Date(`${entry.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between mt-3 px-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-slate-400', 'text-slate-500')}`}>Mais antigo</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-slate-400', 'text-slate-500')}`}>Mais recente</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-3 px-1">
                                                    <LegendDot darkMode={dm} label="Verde = intensidade mais leve" colorClass="bg-emerald-400 dark:bg-emerald-500" />
                                                    <LegendDot darkMode={dm} label="Âmbar = intensidade moderada" colorClass="bg-amber-400 dark:bg-amber-500" />
                                                    <LegendDot darkMode={dm} label="Rosa = intensidade alta" colorClass="bg-rose-400 dark:bg-rose-500" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {sectionKey === 'patterns' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <StatListCard
                                            darkMode={dm}
                                            title="Emoções mais frequentes"
                                            emptyText={guidedEmptyText}
                                            items={topMoodEmotions.slice(0, 6).map(([emotion, count]) => ({
                                                label: emotion,
                                                count,
                                                width: `${(count / maxMoodCount) * 100}%`,
                                                gradient: 'from-indigo-400 to-violet-500',
                                            }))}
                                        />
                                        <StatListCard
                                            darkMode={dm}
                                            title="Gatilhos mais frequentes"
                                            emptyText={guidedEmptyText}
                                            items={topTriggers.slice(0, 5).map(([trigger, count]) => ({
                                                label: TRIGGER_LABELS[trigger] || trigger,
                                                count,
                                                width: `${(count / maxTriggerCount) * 100}%`,
                                                gradient: 'from-emerald-400 to-teal-500',
                                            }))}
                                        />
                                        <StatListCard
                                            darkMode={dm}
                                            title="Emoções mais citadas no diário"
                                            emptyText="Os registros do Diário completo entram aqui quando começarem a acumular. Use o Diário ou o Diário de Humor para alimentar essa leitura."
                                            items={topDiaryEmotions.slice(0, 6).map(([emotion, count]) => ({
                                                label: emotion,
                                                count,
                                                width: `${(count / maxDiaryCount) * 100}%`,
                                                gradient: 'from-amber-400 to-orange-500',
                                            }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <InfoCard
                                            darkMode={dm}
                                            title="Dia mais sensível"
                                            text={
                                                weekdayPattern && weekdayPattern.ratio > 0
                                                    ? `${weekdayPattern.day} concentra ${Math.round(weekdayPattern.ratio * 100)}% dos registros ansiosos desse dia.`
                                                    : 'Ainda não há um padrão forte por dia da semana.'
                                            }
                                            tone="amber"
                                        />
                                        <InfoCard
                                            darkMode={dm}
                                            title="Horário mais sensível"
                                            text={
                                                peakAnxietyHour
                                                    ? `Seu pico recente aparece por volta de ${String(peakAnxietyHour).padStart(2, '0')}:00.`
                                                    : 'Ainda não há registros suficientes para sugerir um horário.'
                                            }
                                            tone="sky"
                                        />
                                    </div>
                                </div>
                            )}
                            {sectionKey === 'body' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <MetricCompareCard darkMode={dm} title="Sono" value={formatNumber(avgSleep)} subtitle="média recente" tone="sky" />
                                        <MetricCompareCard darkMode={dm} title="Energia" value={formatNumber(avgEnergy)} subtitle="média recente" tone="amber" />
                                        <MetricCompareCard darkMode={dm} title="Social" value={formatNumber(avgSociability)} subtitle="média recente" tone="emerald" />
                                        <MetricCompareCard darkMode={dm} title="Hábitos hoje" value={`${habitStats.completedToday}/${habitStats.total}`} subtitle="concluídos" tone="rose" />
                                    </div>

                                    {topCyclePhase && (
                                        <div className={`rounded-2xl p-4 border ${c('bg-fuchsia-50 border-fuchsia-100 text-fuchsia-900', 'bg-fuchsia-950/20 border-fuchsia-800/40 text-fuchsia-200')}`}>
                                            <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-75">Ciclo</p>
                                            <p className="mt-2 text-sm font-semibold leading-relaxed">
                                                A fase que mais apareceu nos registros recentes foi <strong>{topCyclePhase}</strong>.
                                                {cycleIntensity !== null ? ` Nesses registros, a intensidade média ficou em ${cycleIntensity.toFixed(1)}.` : ''}
                                            </p>
                                        </div>
                                    )}

                                    <div className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-900/40 border-slate-700')}`}>
                                        <h3 className={`font-black mb-4 ${c('text-slate-800', 'text-slate-200')}`}>Corpo e intensidade</h3>
                                        <div className="space-y-4">
                                            <MiniComparisonBar
                                                darkMode={dm}
                                                labelA="Sono"
                                                labelB="Intensidade"
                                                valueA={avgSleep}
                                                valueB={avgIntensityRecent}
                                                colorA="bg-sky-300 dark:bg-sky-500/40"
                                                colorB="bg-indigo-500 dark:bg-indigo-400"
                                            />
                                            <MiniComparisonBar
                                                darkMode={dm}
                                                labelA="Energia"
                                                labelB="Intensidade"
                                                valueA={avgEnergy}
                                                valueB={avgIntensityRecent}
                                                colorA="bg-amber-300 dark:bg-amber-500/40"
                                                colorB="bg-indigo-500 dark:bg-indigo-400"
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-4">
                                            <LegendDot darkMode={dm} label="Primeira coluna = corpo" colorClass="bg-sky-300 dark:bg-sky-500/40" />
                                            <LegendDot darkMode={dm} label="Segunda coluna = intensidade" colorClass="bg-indigo-500 dark:bg-indigo-400" />
                                        </div>
                                    </div>

                                    <div className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-900/40 border-slate-700')}`}>
                                        <h3 className={`font-black mb-3 ${c('text-slate-800', 'text-slate-200')}`}>Hábitos e intensidade</h3>
                                        {avgIntensityWithHabits === null || avgIntensityWithoutHabits === null ? (
                                            <p className={`text-sm font-medium ${c('text-slate-500', 'text-slate-400')}`}>
                                                Ainda faltam dias suficientes para essa comparação.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <MetricCompareCard darkMode={dm} title="Dias com hábitos" value={formatNumber(avgIntensityWithHabits)} subtitle="intensidade média" tone="emerald" />
                                                <MetricCompareCard darkMode={dm} title="Dias sem hábitos" value={formatNumber(avgIntensityWithoutHabits)} subtitle="intensidade média" tone="slate" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {sectionKey === 'insights' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        {generatedInsightCards.map((card) => (
                                            <div key={card.title} className={`rounded-2xl border p-4 ${card.tone}`}>
                                                <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-75">{card.title}</p>
                                                <p className="mt-2 text-sm font-semibold leading-relaxed">{card.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-900/40 border-slate-700')}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className={`text-[10px] uppercase tracking-[0.16em] font-black ${c('text-slate-500', 'text-slate-400')}`}>Ação</p>
                                                <p className={`mt-2 text-sm font-semibold leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                                                    {peakAnxietyHour
                                                        ? 'O app pode antecipar um lembrete antes do seu horário mais sensível.'
                                                        : 'Quando aparecer um horário mais claro, essa sugestão entra aqui.'}
                                                </p>
                                            </div>
                                            {peakAnxietyHour && (
                                                <button onClick={setSmartCheckin} className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white">
                                                    Ativar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}

function SummaryCard({
    darkMode: dm,
    title,
    value,
    tone,
}: {
    darkMode?: boolean;
    title: string;
    value: string;
    tone: 'indigo' | 'sky' | 'amber' | 'rose' | 'emerald' | 'slate' | 'violet';
}) {
    const tones = {
        indigo: dm ? 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-900',
        sky: dm ? 'bg-sky-950/30 border-sky-800/40 text-sky-200' : 'bg-sky-50 border-sky-100 text-sky-900',
        amber: dm ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-900',
        rose: dm ? 'bg-rose-950/30 border-rose-800/40 text-rose-200' : 'bg-rose-50 border-rose-100 text-rose-900',
        emerald: dm ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-100 text-emerald-900',
        slate: dm ? 'bg-slate-900/40 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-900',
        violet: dm ? 'bg-violet-950/30 border-violet-800/40 text-violet-200' : 'bg-violet-50 border-violet-100 text-violet-900',
    };

    return (
        <div className={`rounded-2xl border p-4 text-center ${tones[tone]}`}>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-75 mt-1">{title}</p>
        </div>
    );
}

function MetricCompareCard({
    darkMode: dm,
    title,
    value,
    subtitle,
    tone,
}: {
    darkMode?: boolean;
    title: string;
    value: string;
    subtitle: string;
    tone: 'indigo' | 'sky' | 'amber' | 'slate' | 'emerald' | 'rose';
}) {
    return (
        <div className={`rounded-2xl p-4 border ${
            tone === 'indigo' ? (dm ? 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-900')
            : tone === 'sky' ? (dm ? 'bg-sky-950/30 border-sky-800/40 text-sky-200' : 'bg-sky-50 border-sky-100 text-sky-900')
            : tone === 'amber' ? (dm ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-900')
            : tone === 'emerald' ? (dm ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-100 text-emerald-900')
            : tone === 'rose' ? (dm ? 'bg-rose-950/30 border-rose-800/40 text-rose-200' : 'bg-rose-50 border-rose-100 text-rose-900')
            : (dm ? 'bg-slate-900/40 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-900')
        }`}>
            <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-70">{title}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
            <p className="text-xs font-semibold opacity-75 mt-1">{subtitle}</p>
        </div>
    );
}

function StatListCard({
    darkMode: dm,
    title,
    items,
    emptyText,
}: {
    darkMode?: boolean;
    title: string;
    emptyText: string;
    items: Array<{ label: string; count: number; width: string; gradient: string }>;
}) {
    return (
        <div className={`rounded-2xl p-4 border ${dm ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-100'}`}>
            <h3 className={`font-black mb-4 ${dm ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h3>
            {items.length === 0 ? (
                <p className={`text-sm font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{emptyText}</p>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.label}>
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <span className={`text-sm font-bold capitalize ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${dm ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{item.count}x</span>
                            </div>
                            <div className={`rounded-full h-3 ${dm ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <div className={`bg-gradient-to-r ${item.gradient} h-3 rounded-full`} style={{ width: item.width }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function InfoCard({
    darkMode: dm,
    title,
    text,
    tone,
}: {
    darkMode?: boolean;
    title: string;
    text: string;
    tone: 'amber' | 'sky';
}) {
    return (
        <div className={`rounded-2xl p-4 border ${
            tone === 'amber'
                ? (dm ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-900')
                : (dm ? 'bg-sky-950/30 border-sky-800/40 text-sky-200' : 'bg-sky-50 border-sky-100 text-sky-900')
        }`}>
            <p className="text-[10px] uppercase tracking-[0.16em] font-black opacity-75">{title}</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed">{text}</p>
        </div>
    );
}

function MiniComparisonBar({
    darkMode: dm,
    labelA,
    labelB,
    valueA,
    valueB,
    colorA,
    colorB,
}: {
    darkMode?: boolean;
    labelA: string;
    labelB: string;
    valueA: number | null;
    valueB: number | null;
    colorA: string;
    colorB: string;
}) {
    if (valueA === null && valueB === null) {
        return <p className={`text-sm font-medium ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Ainda faltam dados para essa comparação.</p>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{labelA} x {labelB}</span>
                <span className={`text-[10px] font-black ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatNumber(valueA)} / {formatNumber(valueB)}
                </span>
            </div>
            <div className={`rounded-2xl p-3 ${dm ? 'bg-slate-800/80' : 'bg-slate-50'}`}>
                <div className="flex items-end gap-3 h-32">
                    <div className="flex-1 h-full flex flex-col justify-end items-center gap-2">
                        <div className={`w-full rounded-t-2xl ${colorA}`} style={{ height: `${Math.max(((valueA || 0) / 5) * 100, 10)}%` }} />
                        <div className="text-center space-y-0.5">
                            <p className={`text-[10px] font-black ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{formatNumber(valueA)}/5</p>
                            <p className={`text-[10px] font-bold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{labelA}</p>
                        </div>
                    </div>
                    <div className="flex-1 h-full flex flex-col justify-end items-center gap-2">
                        <div className={`w-full rounded-t-2xl ${colorB}`} style={{ height: `${Math.max(((valueB || 0) / 5) * 100, 10)}%` }} />
                        <div className="text-center space-y-0.5">
                            <p className={`text-[10px] font-black ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{formatNumber(valueB)}/5</p>
                            <p className={`text-[10px] font-bold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{labelB}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LegendDot({
    darkMode: dm,
    label,
    colorClass,
}: {
    darkMode?: boolean;
    label: string;
    colorClass: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
        </div>
    );
}
