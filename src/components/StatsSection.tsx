'use client';

import { useState } from 'react';
import { MoodEntry } from '@/components/MoodSection';

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
    darkMode?: boolean;
}

export default function StatsSection({ moodHistory, diaryEntries, userProgress, darkMode: dm }: StatsSectionProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [insightText, setInsightText] = useState<string | null>(null);
    const [habitStats, setHabitStats] = useState({ completed: 0, total: 0 });

    const c = (l: string, d: string) => dm ? d : l;

    // Load Habits from localStorage
    useState(() => {
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            const storedHabits = localStorage.getItem('psico_habits_reqs');
            const storedHistory = localStorage.getItem('psico_habits_history');

            const habits = storedHabits ? JSON.parse(storedHabits) : [];
            const history = storedHistory ? JSON.parse(storedHistory) : {};
            const completedToday = history[today] || [];

            setHabitStats({
                completed: completedToday.length,
                total: habits.length
            });
        }
    });

    const last7DaysMood = moodHistory.slice(0, 7).reverse();
    const last30Diary = diaryEntries.slice(0, 30);

    // Diary Emotion Counts
    const diaryCounts: Record<string, number> = {};
    last30Diary.forEach(e => { diaryCounts[e.emotion] = (diaryCounts[e.emotion] || 0) + 1; });
    const sortedDiaryEmotions = Object.entries(diaryCounts).sort((a, b) => b[1] - a[1]);
    const maxDiaryCount = sortedDiaryEmotions.length > 0 ? sortedDiaryEmotions[0][1] : 0;

    // Mood Emotion Counts (New MoodEntry)
    const moodCounts: Record<string, number> = {};
    const triggerCounts: Record<string, number> = {};
    const last30Moods = moodHistory.slice(0, 30).reverse();

    moodHistory.slice(0, 30).forEach(m => {
        if (m.primaryEmotion) {
            moodCounts[m.primaryEmotion] = (moodCounts[m.primaryEmotion] || 0) + 1;
        }
        if (m.trigger) {
            triggerCounts[m.trigger] = (triggerCounts[m.trigger] || 0) + 1;
        }
    });

    const sortedMoodEmotions = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const maxMoodCount = sortedMoodEmotions.length > 0 ? sortedMoodEmotions[0][1] : 0;

    const past30 = moodHistory.filter((m) => {
        const d = new Date(m.date).getTime();
        return d >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    });
    const prev30 = moodHistory.filter((m) => {
        const d = new Date(m.date).getTime();
        return d < Date.now() - 30 * 24 * 60 * 60 * 1000 && d >= Date.now() - 60 * 24 * 60 * 60 * 1000;
    });
    const avgNow = past30.length ? past30.reduce((s, m) => s + (m.intensity || 0), 0) / past30.length : 0;
    const avgPrev = prev30.length ? prev30.reduce((s, m) => s + (m.intensity || 0), 0) / prev30.length : 0;

    const weekdayAnxiety: Record<string, { total: number; anxious: number }> = {
        Dom: { total: 0, anxious: 0 }, Seg: { total: 0, anxious: 0 }, Ter: { total: 0, anxious: 0 }, Qua: { total: 0, anxious: 0 }, Qui: { total: 0, anxious: 0 }, Sex: { total: 0, anxious: 0 }, Sáb: { total: 0, anxious: 0 }
    };
    moodHistory.forEach((m) => {
        const day = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(m.date).getDay()];
        weekdayAnxiety[day].total += 1;
        if ((m.primaryEmotion || '').toLowerCase().includes('ansi')) weekdayAnxiety[day].anxious += 1;
    });
    const weekdayPattern = Object.entries(weekdayAnxiety)
        .map(([day, v]) => ({ day, ratio: v.total ? v.anxious / v.total : 0 }))
        .sort((a, b) => b.ratio - a.ratio)[0];

    const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
    const maxTriggerCount = sortedTriggers.length > 0 ? sortedTriggers[0][1] : 0;

    const anxietyByHour: Record<number, number> = {};
    moodHistory.forEach((m) => {
        if ((m.primaryEmotion || '').toLowerCase().includes('ansi')) {
            const hour = Number((m.time || '00:00').split(':')[0]);
            if (!isNaN(hour)) anxietyByHour[hour] = (anxietyByHour[hour] || 0) + 1;
        }
    });
    const peakAnxietyHour = Object.entries(anxietyByHour).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Intensity averages
    const validIntensityMoods = last7DaysMood.filter(m => m.intensity);
    const avgIntensity = validIntensityMoods.length > 0
        ? (validIntensityMoods.reduce((s, m) => s + m.intensity, 0) / validIntensityMoods.length).toFixed(1)
        : '-';

    // Health metrics averages
    const validSleepMoods = last7DaysMood.filter(m => m.sleepQuality !== undefined);
    const avgSleep = validSleepMoods.length > 0
        ? (validSleepMoods.reduce((s, m) => s + (m.sleepQuality || 0), 0) / validSleepMoods.length).toFixed(1)
        : '-';

    const validEnergyMoods = last7DaysMood.filter(m => m.energyLevel !== undefined);
    const avgEnergy = validEnergyMoods.length > 0
        ? (validEnergyMoods.reduce((s, m) => s + (m.energyLevel || 0), 0) / validEnergyMoods.length).toFixed(1)
        : '-';

    const validSociabilityMoods = last7DaysMood.filter(m => m.sociability !== undefined);
    const avgSociability = validSociabilityMoods.length > 0
        ? (validSociabilityMoods.reduce((s, m) => s + (m.sociability || 0), 0) / validSociabilityMoods.length).toFixed(1)
        : '-';

    const setSmartCheckin = () => {
        if (typeof window === 'undefined' || !peakAnxietyHour) return;
        const hh = String(Math.max(0, Number(peakAnxietyHour) - 1)).padStart(2, '0');
        const raw = localStorage.getItem('sereno_reminder_settings');
        const current = raw ? JSON.parse(raw) : {};
        const next = { ...current, moodReminder: true, moodTime: `${hh}:00` };
        localStorage.setItem('sereno_reminder_settings', JSON.stringify(next));
        alert(`Check-in contextual configurado para ${hh}:00.`);
    };

    const generateInsights = () => {
        setIsGenerating(true);
        setTimeout(() => {
            let text = "Com base nos seus dados recentes, identifiquei alguns padrões interessantes:\n\n";

            if (sortedMoodEmotions.length > 0) {
                const topMood = sortedMoodEmotions[0][0].toLowerCase();
                text += `✨ **Padrão de Humor:** Sua emoção mais frequente tem sido **${topMood}**. `;
                if (topMood.includes('ansi') || topMood.includes('estress')) {
                    text += "Isso pode indicar uma sobrecarga mental. Tente incluir mais pausas de respiração durante o dia.\n\n";
                } else if (topMood.includes('feliz') || topMood.includes('bem')) {
                    text += "Essa energia positiva é incrível! Continue cultivando os hábitos que estão te fazendo brilhar.\n\n";
                } else {
                    text += "Observe o que acontece antes desse sentimento surgir para ganhar mais clareza.\n\n";
                }
            }

            if (avgSleep !== '-' && Number(avgSleep) < 3) {
                text += "😴 **Qualidade do Sono:** Notei que seu sono tem sido avaliado abaixo da média. O cansaço físico pode estar amplificando sua sensibilidade emocional. Tente o modo Yoga Nidra hoje à noite.\n\n";
            }

            if (avgEnergy !== '-' && avgSleep !== '-' && Number(avgEnergy) > Number(avgSleep) + 1) {
                text += "🔋 **Energia vs Sono:** Você está reportando alta energia apesar do sono abaixo do ideal. Cuidado com o cansaço acumulado; tente não se sobrecarregar hoje.\n\n";
            }

            if (moodHistory.length >= 5) {
                const intensidades = moodHistory.slice(0, 5).map(m => m.intensity);
                const tendendoAMelhorar = intensidades[0] < intensidades[4];
                if (tendendoAMelhorar) {
                    text += "📈 **Tendência:** Notei uma melhora gradual no seu bem-estar nos últimos registros. Suas ferramentas de enfrentamento estão funcionando!\n\n";
                }
            }

            if (diaryEntries.length > 0) {
                text += "📝 **Reflexão:** Você tem sido consistente com seu diário. Registrar situações ajuda a tirar o peso da mente e processar melhor os desafios.";
            } else {
                text += "💡 **Dica:** Tente usar o Diário de Emoções para descrever situações específicas. Isso me ajudará a te dar insights ainda mais precisos.";
            }

            setInsightText(text);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className={`p-4 animate-fade-in overflow-y-auto pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <div className="text-center mb-8 pt-4">
                <span className="text-5xl block mb-4 filter drop-shadow-md">📊</span>
                <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Estatísticas</h2>
                <p className={`mt-2 font-medium ${c('text-gray-600', 'text-slate-400')}`}>Seus padrões emocionais</p>
            </div>

            {/* AI Insights Button/Card */}
            <div className={`rounded-3xl p-6 mb-8 border shadow-lg transition-all ${dm ? 'bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">🧠</div>
                    <div>
                        <h3 className={`font-extrabold ${c('text-indigo-900', 'text-indigo-200')}`}>Insights da Sereno</h3>
                        <p className={`text-xs font-semibold ${c('text-indigo-700', 'text-indigo-300')}`}>Análise Personalizada por IA</p>
                    </div>
                </div>

                {insightText ? (
                    <div className="animate-fade-in">
                        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${c('text-gray-800', 'text-slate-200')}`}>
                            {insightText}
                        </div>
                        <button
                            onClick={() => setInsightText(null)}
                            className="mt-4 text-xs font-bold text-indigo-500 hover:text-indigo-600"
                        >
                            🔄 Gerar nova análise
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={generateInsights}
                        disabled={isGenerating}
                        className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${isGenerating
                            ? 'bg-gray-200 text-gray-400 animate-pulse'
                            : 'bg-white text-indigo-600 shadow-md hover:shadow-lg active:scale-95'
                            }`}
                    >
                        {isGenerating ? 'Analisando seus registros...' : '✨ Descobrir meus padrões'}
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 animate-slide-up">
                <div className={`rounded-3xl p-4 text-center border shadow-sm backdrop-blur-sm ${c('bg-purple-50/80 border-purple-100', 'bg-purple-900/30 border-purple-800/50')}`}>
                    <p className={`text-3xl font-extrabold mb-1 drop-shadow-sm ${c('text-purple-700', 'text-purple-300')}`}>{avgIntensity}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c('text-gray-700', 'text-slate-300')}`}>Humor</p>
                </div>
                <div className={`rounded-3xl p-4 text-center border shadow-sm backdrop-blur-sm ${c('bg-blue-50/80 border-blue-100', 'bg-blue-900/30 border-blue-800/50')}`}>
                    <p className={`text-3xl font-extrabold mb-1 drop-shadow-sm ${c('text-blue-700', 'text-blue-300')}`}>{avgSleep}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c('text-gray-700', 'text-slate-300')}`}>Sono</p>
                </div>
                <div className={`rounded-3xl p-4 text-center border shadow-sm backdrop-blur-sm ${c('bg-orange-50/80 border-orange-100', 'bg-orange-900/30 border-orange-800/50')}`}>
                    <p className={`text-3xl font-extrabold mb-1 drop-shadow-sm ${c('text-orange-700', 'text-orange-300')}`}>{avgEnergy}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c('text-gray-700', 'text-slate-300')}`}>Energia</p>
                </div>
                {/* New Cards: Minutos and Hábitos */}
                <div className={`rounded-3xl p-4 text-center border shadow-sm backdrop-blur-sm ${c('bg-emerald-50/80 border-emerald-100', 'bg-emerald-900/30 border-emerald-800/50')}`}>
                    <p className={`text-3xl font-extrabold mb-1 drop-shadow-sm ${c('text-emerald-700', 'text-emerald-300')}`} suppressHydrationWarning>{userProgress.totalMinutes}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c('text-emerald-900/60', 'text-emerald-300/60')}`}>Minutos</p>
                </div>
                <div className={`rounded-3xl p-4 text-center border shadow-sm backdrop-blur-sm ${c('bg-rose-50/80 border-rose-100', 'bg-rose-900/30 border-rose-800/50')}`}>
                    <p className={`text-3xl font-extrabold mb-1 drop-shadow-sm ${c('text-rose-700', 'text-rose-300')}`} suppressHydrationWarning>{habitStats.completed}/{habitStats.total}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c('text-rose-900/60', 'text-rose-300/60')}`}>Hábitos</p>
                </div>
                <div className={`rounded-3xl p-4 text-center border shadow-sm backdrop-blur-sm ${c('bg-green-50/80 border-green-100', 'bg-green-900/30 border-green-800/50')}`}>
                    <p className={`text-3xl font-extrabold mb-1 drop-shadow-sm ${c('text-green-700', 'text-green-300')}`}>{avgSociability}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c('text-gray-700', 'text-slate-300')}`}>Social</p>
                </div>
                <div className={`rounded-3xl p-4 text-center border shadow-sm backdrop-blur-sm ${c('bg-slate-50/80 border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <p className={`text-3xl font-extrabold mb-1 drop-shadow-sm ${c('text-slate-700', 'text-slate-300')}`}>{moodHistory.length}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c('text-gray-700', 'text-slate-300')}`}>Total</p>
                </div>
            </div>

            <div className={`rounded-3xl p-6 border shadow-sm mb-6 ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                    <span className="text-xl">🗓️</span> Relatório mensal visual
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-2xl p-4 ${c('bg-indigo-50', 'bg-indigo-900/30')}`}>
                        <p className="text-[10px] uppercase font-bold opacity-70">Você hoje (30d)</p>
                        <p className="text-2xl font-extrabold">{avgNow ? avgNow.toFixed(1) : '-'}</p>
                    </div>
                    <div className={`rounded-2xl p-4 ${c('bg-slate-50', 'bg-slate-900/40')}`}>
                        <p className="text-[10px] uppercase font-bold opacity-70">Você há 30 dias</p>
                        <p className="text-2xl font-extrabold">{avgPrev ? avgPrev.toFixed(1) : '-'}</p>
                    </div>
                </div>
                <p className={`text-xs mt-3 font-medium ${c('text-gray-600', 'text-slate-400')}`}>
                    {avgPrev ? `Evolução: ${(avgNow - avgPrev).toFixed(1)} ponto(s) no humor médio.` : 'Ainda sem dados suficientes para comparação de 60 dias.'}
                </p>
            </div>

            <div className={`rounded-3xl p-6 border shadow-sm mb-6 ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                    <span className="text-xl">🧠</span> Padrão sazonal semanal
                </h3>
                <p className={`text-sm ${c('text-gray-700', 'text-slate-300')}`}>
                    {weekdayPattern && weekdayPattern.ratio > 0
                        ? `Você tende a ficar mais ansioso(a) em ${weekdayPattern.day}s (${Math.round(weekdayPattern.ratio * 100)}% dos registros desse dia).`
                        : 'Ainda não há padrão forte de ansiedade por dia da semana.'}
                </p>
            </div>

            <div className={`rounded-3xl p-6 border shadow-sm mb-6 ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <h3 className={`font-bold mb-3 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                    <span className="text-xl">🔔</span> Notificação inteligente
                </h3>
                <p className={`text-sm ${c('text-gray-700', 'text-slate-300')}`}>
                    {peakAnxietyHour
                        ? `Pico de ansiedade detectado por volta de ${String(peakAnxietyHour).padStart(2, '0')}:00. Posso sugerir check-in 1h antes.`
                        : 'Ainda sem dados suficientes para calcular horário de check-in contextual.'}
                </p>
                {peakAnxietyHour && (
                    <button onClick={setSmartCheckin} className="mt-3 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white">
                        Ativar check-in contextual
                    </button>
                )}
            </div>

            {/* Well-being Correlations */}
            <div className={`rounded-3xl p-6 border shadow-sm mb-6 animate-slide-up ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`} style={{ animationDelay: '0.08s' }}>
                <h3 className={`font-bold mb-6 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                    <span className="text-xl">🧬</span> Correlações de Bem-estar
                </h3>
                <div className="space-y-6">
                    {/* Sleep vs Mood */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold opacity-70 uppercase tracking-widest">Sono vs Humor</span>
                            <span className={`text-[10px] font-black uppercase ${avgSleep === '-' ? 'text-gray-400' : 'text-indigo-500'}`}>
                                Impacto: {avgSleep === '-' ? 'N/A' : (Number(avgSleep) > 3.8 ? 'Alto' : Number(avgSleep) > 2.5 ? 'Moderado' : 'Leve')}
                            </span>
                        </div>
                        <div className="flex items-end gap-1 h-14 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl p-2 px-3">
                            {last30Moods.length === 0 ? (
                                <div className="flex-1 flex gap-1 h-full items-end opacity-40">
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 h-full">
                                            <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${20 + i * 10}%` }} />
                                            <div className="w-full bg-indigo-500 rounded-t-sm" style={{ height: `${40 + i * 5}%` }} />
                                        </div>
                                    ))}
                                </div>
                            ) : last30Moods.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 group relative min-w-[6px]">
                                    <div
                                        className={`w-full rounded-t-sm transition-all ${c('bg-blue-200', 'bg-blue-400/20')}`}
                                        style={{ height: `${Math.max(((m.sleepQuality || 3) / 5) * 100, 5)}%` }}
                                    />
                                    <div
                                        className={`w-full rounded-t-sm transition-all ${c('bg-indigo-500', 'bg-indigo-400')}`}
                                        style={{ height: `${Math.max(((m.intensity || 1) / 5) * 100, 5)}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Energy vs Mood */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold opacity-70 uppercase tracking-widest">Energia vs Humor</span>
                            <span className={`text-[10px] font-black uppercase ${avgEnergy === '-' ? 'text-gray-400' : 'text-orange-500'}`}>
                                Impacto: {avgEnergy === '-' ? 'N/A' : (Number(avgEnergy) > 3.8 ? 'Forte' : Number(avgEnergy) > 2.5 ? 'Moderado' : 'Leve')}
                            </span>
                        </div>
                        <div className="flex items-end gap-1 h-14 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl p-2 px-3">
                            {last30Moods.length === 0 ? (
                                <div className="flex-1 flex gap-1 h-full items-end opacity-40">
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 h-full">
                                            <div className="w-full bg-orange-500 rounded-t-sm" style={{ height: `${30 + i * 8}%` }} />
                                            <div className="w-full bg-indigo-500 rounded-t-sm" style={{ height: `${40 + i * 5}%` }} />
                                        </div>
                                    ))}
                                </div>
                            ) : last30Moods.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 group relative min-w-[6px]">
                                    <div
                                        className={`w-full rounded-t-sm transition-all ${c('bg-orange-200', 'bg-orange-400/20')}`}
                                        style={{ height: `${Math.max(((m.energyLevel || 3) / 5) * 100, 5)}%` }}
                                    />
                                    <div
                                        className={`w-full rounded-t-sm transition-all ${c('bg-indigo-500', 'bg-indigo-400')}`}
                                        style={{ height: `${Math.max(((m.intensity || 1) / 5) * 100, 5)}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {last30Moods.length === 0 && (
                    <p className={`text-xs mt-3 text-center font-medium ${c('text-gray-500', 'text-slate-400')}`}>
                        Sem dados ainda. Faça 2-3 registros no Diário de Humor para preencher essa correlação.
                    </p>
                )}
                <div className="mt-4 flex gap-4 justify-center">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                        <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Humor</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${c('bg-blue-200', 'bg-blue-400/40')}`}></div>
                        <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Métrica de Saúde</span>
                    </div>
                </div>
            </div>

            {/* Mood Chart - Intensity over last 30 days */}
            <div className={`rounded-3xl p-6 border shadow-sm mb-6 animate-slide-up ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`} style={{ animationDelay: '0.05s' }}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                    <span className="text-xl">📈</span> Evolução do Humor (30 dias)
                </h3>
                {last30Moods.length === 0 ? (
                    <div className={`py-6 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl px-3`}>
                        <div className="flex items-end gap-1.5 h-24">
                            {[2, 3, 4, 2, 5, 3, 4, 3, 2, 4].map((v, i) => (
                                <div key={i} className="flex-1 min-w-[8px]">
                                    <div className="w-full rounded-full bg-indigo-400/60" style={{ height: `${(v / 5) * 100}%` }} />
                                </div>
                            ))}
                        </div>
                        <p className={`text-xs text-center mt-3 font-medium ${c('text-gray-500', 'text-slate-400')}`}>
                            Gráfico de exemplo — ele será preenchido automaticamente com seus próximos registros.
                        </p>
                    </div>
                ) : (
                    <div className="flex items-end gap-1.5 h-32 mt-8 px-2 overflow-x-auto custom-scrollbar bg-gray-50/30 dark:bg-slate-900/10 rounded-xl p-3">
                        {last30Moods.map((entry, i) => (
                            <div key={i} className="flex-1 min-w-[10px] flex flex-col items-center gap-2 group cursor-pointer relative">
                                <div
                                    className={`w-full rounded-full transition-all duration-500 hover:scale-x-125 shadow-sm ${entry.intensity <= 2 ? 'bg-green-400 dark:bg-green-600' : entry.intensity === 3 ? 'bg-yellow-400 dark:bg-yellow-600' : 'bg-rose-400 dark:bg-rose-600'
                                        }`}
                                    style={{ height: `${Math.max((entry.intensity / 5) * 100, 10)}%` }}
                                />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-black text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none z-10 whitespace-nowrap">
                                    {entry.intensity}/5 • {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-between mt-4 px-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${c('text-gray-400', 'text-slate-500')}`}>Há 30 registros</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${c('text-gray-400', 'text-slate-500')}`}>Hoje</span>
                </div>
            </div>

            {/* Trigger Analysis */}
            {sortedTriggers.length > 0 && (
                <div className={`rounded-3xl p-6 border shadow-sm mb-6 animate-slide-up ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`} style={{ animationDelay: '0.08s' }}>
                    <h3 className={`font-bold mb-5 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                        <span className="text-xl">🎯</span> Principais Gatilhos
                    </h3>
                    <div className="space-y-5">
                        {sortedTriggers.slice(0, 5).map(([tag, count], i) => (
                            <div key={tag} className="animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold capitalize ${c('text-gray-700', 'text-slate-200')}`}>
                                        {tag === 'work' ? '💼 Trabalho' :
                                            tag === 'family' ? '🏠 Família' :
                                                tag === 'relationships' ? '❤️ Relacionamentos' :
                                                    tag === 'health' ? '🏥 Saúde' :
                                                        tag === 'sleep' ? '🌙 Sono/Descanso' :
                                                            tag === 'social' ? '🤝 Social' :
                                                                tag === 'finance' ? '💰 Finanças' :
                                                                    tag === 'hobbies' ? '🎨 Lazer' :
                                                                        tag === 'self' ? '✨ Cuidado' : '❓ Outro'}
                                    </span>
                                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${c('bg-gray-100 text-gray-600', 'bg-slate-700 text-slate-300')}`}>{count}x</span>
                                </div>
                                <div className={`rounded-full h-2 shadow-inner ${c('bg-gray-100', 'bg-slate-700')}`}>
                                    <div className="bg-gradient-to-r from-teal-400 to-emerald-500 h-2 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(count / maxTriggerCount) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Emotion Frequency - Mood Tracker */}
            <div className={`rounded-3xl p-6 border shadow-sm mb-6 animate-slide-up ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`} style={{ animationDelay: '0.1s' }}>
                <h3 className={`font-bold mb-5 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                    <span className="text-xl">🧭</span> Emoções Frequentes no Humor
                </h3>
                {sortedMoodEmotions.length === 0 ? (
                    <p className={`text-sm text-center py-4 font-medium ${c('text-gray-500', 'text-slate-400')}`}>Registre seu humor diário para ver os padrões.</p>
                ) : (
                    <div className="space-y-5">
                        {sortedMoodEmotions.slice(0, 6).map(([emotion, count], i) => (
                            <div key={emotion} className="animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold capitalize ${c('text-gray-700', 'text-slate-200')}`}>{emotion}</span>
                                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${c('bg-gray-100 text-gray-600', 'bg-slate-700 text-slate-300')}`}>{count}x</span>
                                </div>
                                <div className={`rounded-full h-3.5 shadow-inner ${c('bg-gray-100', 'bg-slate-700')}`}>
                                    <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-3.5 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(count / maxMoodCount) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Emotion Frequency - Diary */}
            <div className={`rounded-3xl p-6 border shadow-sm mb-6 animate-slide-up ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`} style={{ animationDelay: '0.15s' }}>
                <h3 className={`font-bold mb-5 flex items-center gap-2 ${c('text-gray-800', 'text-slate-200')}`}>
                    <span className="text-xl">📓</span> Emoções do Diário
                </h3>
                {sortedDiaryEmotions.length === 0 ? (
                    <p className={`text-sm text-center py-4 font-medium ${c('text-gray-500', 'text-slate-400')}`}>Nenhum registro no diário ainda.</p>
                ) : (
                    <div className="space-y-5">
                        {sortedDiaryEmotions.slice(0, 6).map(([emotion, count], i) => (
                            <div key={emotion} className="animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold capitalize ${c('text-gray-700', 'text-slate-200')}`}>{emotion}</span>
                                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${c('bg-gray-100 text-gray-600', 'bg-slate-700 text-slate-300')}`}>{count}x</span>
                                </div>
                                <div className={`rounded-full h-3.5 shadow-inner ${c('bg-gray-100', 'bg-slate-700')}`}>
                                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-3.5 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(count / maxDiaryCount) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={`rounded-3xl p-5 border shadow-sm mt-8 ${c('bg-cyan-50/80 border-cyan-100', 'bg-cyan-900/20 border-cyan-800/50')}`}>
                <p className={`text-sm leading-relaxed font-medium ${c('text-cyan-800', 'text-cyan-300')}`}>
                    💡 <strong>Dica da Sereno:</strong> Quanto mais dados você registrar, mais ricos serão os padrões identificados. Continue registrando seu humor e suas emoções diariamente para ganhar inteligência emocional!
                </p>
            </div>
        </div>
    );
}
