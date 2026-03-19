'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import SectionHeroCard from './SectionHeroCard';

// --- Types ---
type HabitCategory = 'Corpo e saúde' | 'Mente e presença' | 'Emoções e vínculos' | 'Personalizado';

interface HabitRequirement {
    id: string;
    title: string;
    category: HabitCategory;
    icon: string;
    addedAt: number;
    reminderTime?: string; // HH:MM
}

interface HabitRecord {
    date: string; // YYYY-MM-DD
    completedHabitIds: string[];
}

// --- Data ---
const suggestedHabits: { category: HabitCategory; icon: string; items: string[] }[] = [
    {
        category: 'Corpo e saúde',
        icon: '🌿',
        items: [
            'Tomar sol',
            'Cuidar da medicação',
            'Cuidado pessoal',
            'Sono em dia',
            'Alongar o corpo',
            'Beber água',
            'Fazer exercício',
            'Alimentação saudável'
        ]
    },
    {
        category: 'Mente e presença',
        icon: '🧘',
        items: [
            'Meditar',
            'Pausa consciente',
            'Desconectar das telas',
            'Fazer uma pausa de silêncio',
            'Diário de gratidão',
            'Focar no presente',
            'Ler algo edificante'
        ]
    },
    {
        category: 'Emoções e vínculos',
        icon: '❤️',
        items: [
            'Conectar-se com alguém',
            'Tempo de lazer',
            'Perdoar a si ou a outros',
            'Praticar autocompaixão',
            'Fazer uma oração (ou reflexão)',
            'Escrever sentimentos'
        ]
    }
];

const customIcons = ['🌿', '🧘', '❤️', '💧', '📚', '💪', '🌙', '☀️', '✍️', '🎯', '🌱', '🕊️', '🎧', '🎨'];

const motivationalQuotes = [
    "Muito bem. Você está cuidando de si.",
    "Mais um passo concluído.",
    "A constância vale mais que a pressa.",
    "Seu progresso está florescendo.",
    "Cada pequeno passo fortalece sua jornada.",
    "Você merece esse cuidado."
];

const reminderQuotes = [
    "Seu momento de pausa está esperando por você.",
    "Que tal concluir um hábito agora?",
    "Um pequeno passo também conta.",
    "Respire. Recomece. Continue.",
    "Reserve alguns minutos para cuidar do seu interior.",
    "Sua paz também precisa de atenção.",
    "Volte para si por alguns instantes."
];

const categoryCareCopy: Record<HabitCategory, { why: string; care: string }> = {
    'Corpo e saúde': {
        why: 'Sustenta energia, recuperação e base física.',
        care: 'Cuidado físico',
    },
    'Mente e presença': {
        why: 'Ajuda a desacelerar a mente e recuperar foco.',
        care: 'Presença mental',
    },
    'Emoções e vínculos': {
        why: 'Fortalece conexão, expressão e regulação emocional.',
        care: 'Vínculo emocional',
    },
    'Personalizado': {
        why: 'Adapta a rotina ao que faz sentido para você.',
        care: 'Cuidado personalizado',
    },
};

const getMedals = (currentStreak: number, totalCompleted: number) => {
    const medals: { id: string, title: string, desc: string, icon: string }[] = [];
    if (totalCompleted >= 1) medals.push({ id: 'm1', title: 'Primeiro Passo', desc: 'Completou 1 hábito', icon: '🌱' });
    if (currentStreak >= 3) medals.push({ id: 'm2', title: 'Constância Inicial', desc: '3 dias seguidos', icon: '🌿' });
    if (currentStreak >= 7) medals.push({ id: 'm3', title: 'Raiz Firme', desc: '7 dias seguidos', icon: '🌳' });
    if (currentStreak >= 14) medals.push({ id: 'm4', title: 'Crescimento Real', desc: '14 dias seguidos', icon: '🌟' });
    if (currentStreak >= 21) medals.push({ id: 'm5', title: 'Força Interior', desc: '21 dias seguidos', icon: '💪' });
    if (currentStreak >= 30) medals.push({ id: 'm6', title: 'Transformação', desc: '30 dias seguidos', icon: '🦋' });
    if (currentStreak >= 60) medals.push({ id: 'm7', title: 'Disciplina Serena', desc: '60 dias seguidos', icon: '💎' });
    if (currentStreak >= 90) medals.push({ id: 'm8', title: 'Luz Constante', desc: '90 dias seguidos', icon: '🌞' });

    if (totalCompleted >= 5) medals.push({ id: 't1', title: 'Semeador', desc: '5 hábitos no total', icon: '🌻' });
    if (totalCompleted >= 25) medals.push({ id: 't2', title: 'Jardineiro Fiel', desc: '25 hábitos no total', icon: '🌷' });
    if (totalCompleted >= 100) medals.push({ id: 't3', title: 'Florescer Pleno', desc: '100 hábitos no total', icon: '🌸' });

    return medals;
};

// --- Helpers ---
const getTodayDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

const getPastDates = (days: number) => {
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

const getDayOfWeek = (dateString: string) => {
    const parts = dateString.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return days[d.getDay()];
};

export default function DailyHabitsSection({
    darkMode: dm,
    habitsReqs: myHabits,
    setHabitsReqs: setMyHabits,
    habitsHistory: history,
    setHabitsHistory: setHistory,
    onHabitComplete,
    onNavigate,
}: {
    darkMode?: boolean;
    habitsReqs: HabitRequirement[];
    setHabitsReqs: (value: HabitRequirement[] | ((prev: HabitRequirement[]) => HabitRequirement[])) => void;
    habitsHistory: Record<string, string[]>;
    setHabitsHistory: (value: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
    onHabitComplete?: () => void;
    onNavigate?: (tab: 'stats' | 'missions' | 'tracks', params?: Record<string, any>) => void;
}) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'hoje' | 'cadastrar' | 'historico' | 'conquistas'>('hoje');

    // State
    const [streak, setStreak] = useState(0);
    const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);

    // Custom Form State
    const [customTitle, setCustomTitle] = useState('');
    const [customIcon, setCustomIcon] = useState(customIcons[0]);
    const [customCategory, setCustomCategory] = useState<HabitCategory>('Personalizado');
    const [customTime, setCustomTime] = useState('');

    const [confirmRemove, setConfirmRemove] = useState<{ id: string; title: string } | null>(null);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const remindedSet = useRef<Set<string>>(new Set()); // track what was reminded today in memory

    // Initialization
    useEffect(() => {
        const storedHabits = localStorage.getItem('psico_habits_reqs');
        const storedHistory = localStorage.getItem('psico_habits_history');
        if (storedHabits) setMyHabits(JSON.parse(storedHabits));
        if (storedHistory) setHistory(JSON.parse(storedHistory));
    }, []);

    // Save & Calculate Streak (debounced save to avoid excessive writes)
    useEffect(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            if (myHabits.length > 0) localStorage.setItem('psico_habits_reqs', JSON.stringify(myHabits));
            // Limit history to last 90 days before saving
            if (Object.keys(history).length > 0) {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 90);
                const cutoffStr = cutoff.toISOString().split('T')[0];
                const trimmed = Object.fromEntries(
                    Object.entries(history).filter(([date]) => date >= cutoffStr)
                );
                localStorage.setItem('psico_habits_history', JSON.stringify(trimmed));
            }
        }, 500);

        // Calculate Streak (simplistic approach: count continuous days ending today or yesterday)
        let currentStreak = 0;
        let checkDate = new Date();
        const todayStr = getTodayDateString();

        while (true) {
            checkDate.setMinutes(checkDate.getMinutes() - checkDate.getTimezoneOffset());
            const dateStr = checkDate.toISOString().split('T')[0];

            const completedThatDay = history[dateStr]?.length || 0;
            if (completedThatDay > 0) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1); // go back one day
            } else {
                if (dateStr === todayStr) {
                    // It's today, we might just not have done anything yet. Check yesterday.
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break; // Streak broken
                }
            }
        }
        setStreak(currentStreak);
    }, [myHabits, history]);

    // Intelligent Reminders
    const todayStr = getTodayDateString();
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const completedToday = history[todayStr] || [];

            myHabits.forEach(habit => {
                if (habit.reminderTime === currentHHMM && !completedToday.includes(habit.id)) {
                    // It's time!
                    const reminderKey = `${todayStr}-${habit.id}`;
                    if (!remindedSet.current.has(reminderKey)) {
                        remindedSet.current.add(reminderKey);
                        const quote = reminderQuotes[Math.floor(Math.random() * reminderQuotes.length)];
                        toast({
                            title: `Lembrete: ${habit.title}`,
                            description: quote,
                            className: dm ? 'bg-indigo-900 border-indigo-700 text-indigo-100' : 'bg-indigo-100 border-indigo-200 text-indigo-900'
                        });
                    }
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [myHabits, history, todayStr, dm, toast]);

    const completedToday = history[todayStr] || [];
    const doneHabits = myHabits.filter(habit => completedToday.includes(habit.id));
    const pendingHabits = myHabits.filter(habit => !completedToday.includes(habit.id));
    const nextEasyHabit = pendingHabits
        .slice()
        .sort((a, b) => Number(!!a.reminderTime) - Number(!!b.reminderTime) || a.title.length - b.title.length)[0];

    const habitFrequency = myHabits
        .map((habit) => ({
            ...habit,
            count: Object.values(history).filter((day) => day.includes(habit.id)).length,
        }))
        .sort((a, b) => b.count - a.count);

    const repeatedHabits = habitFrequency.filter((habit) => habit.count > 1).slice(0, 5);
    const bestReminderHabit = myHabits
        .filter((habit) => habit.reminderTime)
        .sort((a, b) => Object.values(history).filter((day) => day.includes(b.id)).length - Object.values(history).filter((day) => day.includes(a.id)).length)[0];
    const dailySuggestion = React.useMemo(() => {
        const availableSuggestions = suggestedHabits.flatMap((group) =>
            group.items
                .filter((item) => !myHabits.some((habit) => habit.title.toLowerCase() === item.toLowerCase()))
                .map((item) => ({
                    title: item,
                    category: group.category,
                    icon: group.icon,
                    why: categoryCareCopy[group.category].why,
                    care: categoryCareCopy[group.category].care,
                }))
        );

        if (availableSuggestions.length === 0) return null;

        const seed = getTodayDateString()
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);

        return availableSuggestions[seed % availableSuggestions.length];
    }, [myHabits]);

    // Actions
    const handleAddHabit = (title: string, category: HabitCategory, icon: string, time?: string) => {
        if (!title.trim()) return;
        if (myHabits.some(h => h.title.toLowerCase() === title.toLowerCase())) {
            toast({ title: "Ops", description: "Você já adicionou esse hábito.", variant: "destructive" });
            return;
        }
        setMyHabits([...myHabits, { id: Date.now().toString(), title, category, icon, addedAt: Date.now(), reminderTime: time }]);
        toast({ title: "Hábito Adicionado", description: `${title} agora faz parte da sua jornada.` });
    };

    const handleCreateCustomHabit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAddHabit(customTitle, customCategory, customIcon, customTime);
        setIsCustomFormOpen(false);
        setCustomTitle('');
        setCustomTime('');
    };

    const handleRemoveHabit = (id: string, title: string) => {
        setConfirmRemove({ id, title });
    };

    const confirmRemoveHabit = () => {
        if (!confirmRemove) return;
        setMyHabits(myHabits.filter(h => h.id !== confirmRemove.id));
        toast({ title: "Hábito removido" });
        setConfirmRemove(null);
    };

    const toggleHabitToday = (id: string) => {
        setHistory(prev => {
            const newHistory = { ...prev };
            const todayCompleted = newHistory[todayStr] || [];
            if (todayCompleted.includes(id)) {
                newHistory[todayStr] = todayCompleted.filter(hid => hid !== id);
            } else {
                newHistory[todayStr] = [...todayCompleted, id];
                onHabitComplete?.();
                // Motivational Quote when completing!
                const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
                toast({
                    title: "✨ Feito!",
                    description: quote,
                    className: dm ? 'bg-emerald-900 text-emerald-100 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                });
            }
            return newHistory;
        });
    };

    const totalCompletedCount = Object.values(history).reduce((acc, curr) => acc + curr.length, 0);
    const earnedMedals = getMedals(streak, totalCompletedCount);
    const lastEarnedMedal = earnedMedals.length > 0 ? earnedMedals[earnedMedals.length - 1] : null;

    const last7Days = getPastDates(7);

    return (
        <div className={`p-4 sm:p-6 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-[#fafafa] text-gray-800'}`}>

            {/* Modal de confirmação de remoção */}
            {confirmRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${dm ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100'}`}>
                        <p className={`font-bold text-lg mb-2 ${dm ? 'text-slate-100' : 'text-gray-800'}`}>Remover hábito?</p>
                        <p className={`text-sm mb-6 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
                            O hábito <strong>"{confirmRemove.title}"</strong> será removido da sua rotina. O histórico passado será mantido.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmRemove(null)}
                                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-colors ${dm ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRemoveHabit}
                                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="pt-8 mb-8">
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="Jornada diária"
                    title="Hábitos"
                    description="Transforme pequenas práticas em uma rotina de bem-estar."
                    icon="🌻"
                />
            </div>

            <div data-card-glyph="🧭" className={`sereno-ornament-card rounded-[2rem] p-5 border mb-8 ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>Rotina e consistência</p>
                        <h3 className="mt-2 text-lg font-black">Sua rotina conversa com hoje, sequência, marcos e progresso</h3>
                        <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
                            Use o hoje para agir, a sequência para sustentar, os marcos para reconhecer e o progresso para ajustar a rota.
                        </p>
                    </div>
                    <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${dm ? 'bg-slate-900 text-slate-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>
                        <p className="text-lg font-black">{streak}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]">dias em ritmo</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <button onClick={() => onNavigate?.('missions')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>Ver missões</button>
                    <button onClick={() => onNavigate?.('stats')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>Abrir progresso</button>
                    <button onClick={() => onNavigate?.('tracks')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}>Ver trilhas</button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center mb-8">
                <div className={`inline-flex rounded-full p-1.5 shadow-sm ${dm ? 'bg-slate-800' : 'bg-white border text-sm font-semibold'}`}>
                    {[
                        { id: 'hoje', label: 'Hoje' },
                        { id: 'cadastrar', label: 'Criar' },
                        { id: 'historico', label: 'Histórico' },
                        { id: 'conquistas', label: 'Marcos' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-2.5 rounded-full transition-all duration-300 ${activeTab === tab.id
                                ? (dm ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-100 text-emerald-800 shadow-sm')
                                : (dm ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800')
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB: HOJE */}
            {activeTab === 'hoje' && (
                <div className="max-w-xl mx-auto space-y-6 animate-slide-up">

                    {/* Status Card */}
                    <div className={`rounded-3xl p-6 shadow-sm border flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden ${dm ? 'bg-gradient-to-br from-emerald-900/40 to-slate-800 border-emerald-800/50' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="flex-1 text-center sm:text-left z-10">
                            <h3 className={`text-lg font-extrabold mb-1 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Hoje e sequência</h3>
                            <p className={`text-sm font-bold ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {completedToday.length} de {myHabits.length} hábitos hoje
                            </p>

                            {/* Constancy Calendar line */}
                            <div className="flex items-center gap-1.5 mt-4 justify-center sm:justify-start">
                                {last7Days.map((dateStr) => {
                                    const isDone = (history[dateStr]?.length || 0) > 0;
                                    const isToday = dateStr === todayStr;
                                    return (
                                        <div key={dateStr} className="flex flex-col items-center gap-1">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${isDone
                                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                                                : (dm ? 'bg-slate-700/50 text-slate-500' : 'bg-gray-200 text-gray-500')
                                                } ${isToday ? 'ring-2 ring-emerald-300 ring-offset-1' : ''}`}>
                                                {isDone ? '✓' : ''}
                                            </div>
                                            <span className={`text-[11px] uppercase font-bold ${isToday ? (dm ? 'text-emerald-400' : 'text-emerald-600') : (dm ? 'text-slate-500' : 'text-gray-400')}`}>
                                                {getDayOfWeek(dateStr)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="text-center sm:text-right z-10">
                            <div className="flex items-center justify-center sm:justify-end gap-2 mb-1">
                                <span className="text-3xl filter drop-shadow">🔥</span>
                                <span className={`text-4xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>{streak}</span>
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Sequência</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div data-card-glyph="✅" className={`sereno-ornament-card rounded-3xl p-4 border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-[11px] uppercase font-bold tracking-[0.14em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Feitos hoje</p>
                            <p className={`text-3xl font-black mt-2 ${dm ? 'text-emerald-400' : 'text-emerald-700'}`}>{doneHabits.length}</p>
                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>já concluídos</p>
                        </div>
                        <div data-card-glyph="🌿" className={`sereno-ornament-card rounded-3xl p-4 border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-[11px] uppercase font-bold tracking-[0.14em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Falta hoje</p>
                            <p className={`text-3xl font-black mt-2 ${dm ? 'text-amber-400' : 'text-amber-700'}`}>{pendingHabits.length}</p>
                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>ainda pendentes</p>
                        </div>
                        <div data-card-glyph="🎯" className={`sereno-ornament-card rounded-3xl p-4 border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-[11px] uppercase font-bold tracking-[0.14em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Próximo passo</p>
                            <p className={`text-sm font-black mt-2 ${dm ? 'text-slate-100' : 'text-gray-800'}`}>{nextEasyHabit ? nextEasyHabit.title : 'Tudo concluído'}</p>
                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{nextEasyHabit ? categoryCareCopy[nextEasyHabit.category].care : 'dia encerrado'}</p>
                        </div>
                    </div>

                    {dailySuggestion && (
                        <div data-card-glyph="💡" className={`sereno-ornament-card rounded-3xl p-5 border shadow-sm ${dm ? 'bg-cyan-900/20 border-cyan-800/40' : 'bg-cyan-50 border-cyan-100'}`}>
                            <p className={`text-[11px] uppercase tracking-[0.14em] font-bold ${dm ? 'text-cyan-300' : 'text-cyan-700'}`}>Sugestão do dia</p>
                            <div className="flex items-start gap-3 mt-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${dm ? 'bg-slate-800' : 'bg-white'}`}>
                                    {dailySuggestion.icon}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-black ${dm ? 'text-slate-100' : 'text-gray-800'}`}>{dailySuggestion.title}</p>
                                    <p className={`text-sm font-semibold mt-1 ${dm ? 'text-slate-300' : 'text-gray-600'}`}>{dailySuggestion.why}</p>
                                    <div className="flex items-center justify-between gap-3 mt-3">
                                        <span className={`text-[11px] px-2 py-1 rounded-full font-bold uppercase tracking-[0.12em] ${dm ? 'bg-cyan-950/50 text-cyan-300' : 'bg-white text-cyan-700'}`}>
                                            {dailySuggestion.category}
                                        </span>
                                        <button
                                            onClick={() => handleAddHabit(dailySuggestion.title, dailySuggestion.category, dailySuggestion.icon)}
                                            className={`px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${dm ? 'bg-cyan-500 text-slate-900' : 'bg-cyan-600 text-white'}`}
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {nextEasyHabit && (
                        <div data-card-glyph="🪜" className={`sereno-ornament-card rounded-3xl p-5 border shadow-sm ${dm ? 'bg-indigo-900/20 border-indigo-800/40' : 'bg-indigo-50 border-indigo-100'}`}>
                            <p className={`text-[11px] uppercase tracking-[0.14em] font-bold ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>Próximo passo sugerido</p>
                            <div className="flex items-start gap-3 mt-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${dm ? 'bg-slate-800' : 'bg-white'}`}>{nextEasyHabit.icon}</div>
                                <div className="flex-1">
                                    <p className={`font-black ${dm ? 'text-slate-100' : 'text-gray-800'}`}>{nextEasyHabit.title}</p>
                                    <p className={`text-sm font-semibold mt-1 ${dm ? 'text-slate-300' : 'text-gray-600'}`}>{categoryCareCopy[nextEasyHabit.category].why}</p>
                                    <p className={`text-xs font-bold uppercase tracking-[0.14em] mt-2 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{nextEasyHabit.category} • {categoryCareCopy[nextEasyHabit.category].care}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {lastEarnedMedal && (
                        <div className={`rounded-xl p-3 flex items-center gap-3 border shadow-sm ${dm ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="text-2xl">{lastEarnedMedal.icon}</div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide ${dm ? 'text-amber-500' : 'text-amber-700'}`}>Conquista Recente</p>
                                <p className={`text-sm font-semibold ${dm ? 'text-slate-300' : 'text-gray-800'}`}>{lastEarnedMedal.title}</p>
                            </div>
                        </div>
                    )}

                    {myHabits.length === 0 ? (
                        <div className={`text-center p-10 rounded-3xl border border-dashed ${dm ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-white/50'}`}>
                            <span className="text-5xl block mb-4 opacity-50">🌱</span>
                            <p className={`font-medium mb-4 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Seu jardim ainda está vazio.</p>
                            <button
                                onClick={() => setActiveTab('cadastrar')}
                                className={`px-6 py-2.5 rounded-full font-bold shadow-sm transition-transform active:scale-95 ${dm ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                            >
                                Escolher Hábitos
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            <h3 className={`font-bold px-2 ${dm ? 'text-slate-300' : 'text-gray-700'}`}>Pendentes de hoje</h3>
                            {pendingHabits.length > 0 ? pendingHabits.map(habit => {
                                const careCopy = categoryCareCopy[habit.category];
                                return (
                                    <button
                                        key={habit.id}
                                        onClick={() => toggleHabitToday(habit.id)}
                                        data-card-glyph={habit.icon}
                                        className={`sereno-ornament-card w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 active:scale-[0.98] border shadow-sm ${dm ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-100 hover:border-emerald-100'}`}
                                    >
                                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-2xl ${dm ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                            {habit.icon}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h4 className={`${dm ? 'text-slate-200' : 'text-gray-800'} font-bold`}>{habit.title}</h4>
                                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{careCopy.why}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <p className={`text-[11px] font-semibold uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-gray-400'}`}>{habit.category}</p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${dm ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {careCopy.care}
                                                </span>
                                                {habit.reminderTime && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${dm ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        🔔 {habit.reminderTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            }) : (
                                <div className={`text-center p-6 rounded-3xl border ${dm ? 'bg-emerald-900/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <p className="font-bold">Tudo certo por hoje.</p>
                                    <p className="text-sm font-medium mt-1">Você concluiu os hábitos ativos do dia.</p>
                                </div>
                            )}

                            {doneHabits.length > 0 && (
                                <>
                                    <h3 className={`font-bold px-2 pt-3 ${dm ? 'text-slate-300' : 'text-gray-700'}`}>Já feitos hoje</h3>
                                    {doneHabits.map(habit => {
                                const isDone = completedToday.includes(habit.id);
                                return (
                                    <button
                                        key={habit.id}
                                        onClick={() => toggleHabitToday(habit.id)}
                                        data-card-glyph={habit.icon}
                                        className={`sereno-ornament-card w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 active:scale-[0.98] border shadow-sm ${isDone
                                            ? (dm ? 'bg-emerald-900/20 border-emerald-800/50 opacity-80' : 'bg-emerald-50 border-emerald-100 opacity-90')
                                            : (dm ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-100 hover:border-emerald-100')
                                            }`}
                                    >
                                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${isDone
                                            ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30 rotate-[360deg]'
                                            : (dm ? 'bg-slate-700' : 'bg-gray-50')
                                            }`}>
                                            {isDone ? '✓' : habit.icon}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h4 className={`font-bold ${isDone ? (dm ? 'text-emerald-400 line-through decoration-emerald-900/50' : 'text-emerald-700 decoration-emerald-200 line-through') : (dm ? 'text-slate-200' : 'text-gray-800')}`}>{habit.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDone ? (dm ? 'text-emerald-600/50' : 'text-emerald-600/60') : (dm ? 'text-slate-500' : 'text-gray-400')}`}>{habit.category}</p>
                                                {habit.reminderTime && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isDone ? 'opacity-50' : ''} ${dm ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        🔔 {habit.reminderTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                                    })}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: CADASTRAR / EXPLORAR */}
            {activeTab === 'cadastrar' && (
                <div className="max-w-xl mx-auto space-y-8 animate-fade-in relative pb-10">
                    <div data-card-glyph="✨" className={`sereno-ornament-card rounded-[2rem] p-5 border ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>Montar rotina</p>
                        <h3 className="mt-2 text-lg font-black">Crie hábitos novos, ajuste o que já existe e aproveite modelos prontos</h3>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <button onClick={() => onNavigate?.('missions')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-violet-50 text-violet-800 border border-violet-100'}`}>Missões</button>
                            <button onClick={() => onNavigate?.('stats')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>Progresso</button>
                            <button onClick={() => onNavigate?.('tracks')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'}`}>Trilhas</button>
                        </div>
                    </div>

                    {/* Add Custom Habit Form */}
                    <div className={`p-6 rounded-3xl border ${dm ? 'border-emerald-800/30 bg-emerald-900/10' : 'border-emerald-100 bg-emerald-50/50'}`}>
                        {!isCustomFormOpen ? (
                            <div className="text-center">
                                <h3 className={`font-bold mb-2 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Quer algo mais com a sua cara?</h3>
                                <button
                                    onClick={() => setIsCustomFormOpen(true)}
                                    className={`text-sm font-bold px-4 py-2 rounded-full ${dm ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white shadow-sm'} hover:opacity-90 transition-opacity`}
                                >
                                    + Criar Hábito Personalizado
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateCustomHabit} className="space-y-4 animate-slide-up">
                                <h3 className={`font-extrabold text-lg border-b pb-2 ${dm ? 'text-emerald-400 border-slate-700' : 'text-emerald-700 border-emerald-100'}`}>Criar Novo Hábito</h3>

                                <div>
                                    <label className={`block text-xs font-bold mb-1 uppercase ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Nome da Prática</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Ler 10 páginas, Beber chá..."
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 focus:outline-none ${dm ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-bold mb-1 uppercase ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Categoria</label>
                                        <select
                                            value={customCategory}
                                            onChange={(e) => setCustomCategory(e.target.value as HabitCategory)}
                                            className={`w-full p-3 rounded-xl border focus:outline-none ${dm ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                        >
                                            <option value="Corpo e saúde">Corpo e saúde</option>
                                            <option value="Mente e presença">Mente e presença</option>
                                            <option value="Emoções e vínculos">Emoções e vínculos</option>
                                            <option value="Personalizado">Personalizado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-1 uppercase ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Lembrete (Opcional)</label>
                                        <input
                                            type="time"
                                            value={customTime}
                                            onChange={(e) => setCustomTime(e.target.value)}
                                            className={`w-full p-3 rounded-xl border focus:outline-none ${dm ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold mb-2 uppercase ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Ícone</label>
                                    <div className="flex flex-wrap gap-2">
                                        {customIcons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setCustomIcon(icon)}
                                                className={`text-2xl p-2 rounded-xl transition-all ${customIcon === icon ? (dm ? 'bg-emerald-600 ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : 'bg-emerald-100 ring-2 ring-emerald-500 ring-offset-2') : (dm ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white border hover:bg-gray-50')}`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button
                                        type="submit"
                                        className={`flex-1 py-3 rounded-xl font-bold transition-transform active:scale-95 ${dm ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                        disabled={!customTitle.trim()}
                                    >
                                        Adicionar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomFormOpen(false)}
                                        className={`px-4 py-3 rounded-xl font-bold transition-colors ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Manage Currently Added Habits */}
                    {myHabits.length > 0 && (
                        <div className="space-y-3 pt-4">
                            <h3 className={`font-extrabold text-lg flex items-center justify-between ${dm ? 'text-slate-200' : 'text-gray-800'}`}>
                                Meus Hábitos Ativos
                                <span className="text-xs font-normal opacity-70">Remova ou ajuste sua rotina aqui.</span>
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {myHabits.map(habit => (
                                    <div key={habit.id} data-card-glyph={habit.icon} className={`sereno-ornament-card p-3 rounded-2xl flex items-center justify-between border ${dm ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-white border-gray-100 text-gray-700'}`}>
                                        <div className="flex flex-col">
                                            <span className="font-bold flex items-center gap-2">
                                                <span>{habit.icon}</span>
                                                <span>{habit.title}</span>
                                                {habit.reminderTime && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${dm ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>🔔 {habit.reminderTime}</span>}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold opacity-50 ml-7">{habit.category}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveHabit(habit.id, habit.title)}
                                            className={`px-3 py-2 flex items-center justify-center rounded-xl text-xs font-black uppercase tracking-wide transition-colors active:scale-95 ${dm ? 'bg-red-950/30 text-red-300 hover:bg-red-900/50 hover:text-red-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                            title="Remover hábito da sua rotina"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggested Habits Options */}
                    <div className="pt-6 border-t border-dashed border-gray-200 dark:border-slate-700">
                        <h3 className={`font-extrabold text-lg mb-6 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Modelos Prontos</h3>
                        {suggestedHabits.map(category => (
                            <div key={category.category} className="space-y-4 mb-8">
                                <h4 className={`font-bold text-base flex items-center gap-2 ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
                                    <span>{category.icon}</span> {category.category}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {category.items.map(item => {
                                        const isAdded = myHabits.some((h: HabitRequirement) => h.title.toLowerCase() === item.toLowerCase());
                                        return (
                                            <button
                                                key={item}
                                                disabled={isAdded}
                                                onClick={() => handleAddHabit(item, category.category, category.icon)}
                                                data-card-glyph={category.icon}
                                                className={`sereno-ornament-card p-4 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-95 ${isAdded
                                                    ? (dm ? 'bg-slate-800/40 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-400')
                                                    : (dm ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800/80' : 'bg-white border-gray-200 text-gray-800 hover:border-emerald-300 hover:bg-emerald-50/20 shadow-sm')
                                                    }`}
                                            >
                                                <span className="font-semibold text-sm">{item}</span>
                                                {isAdded ? (
                                                    <span className="text-emerald-500 font-bold">✓</span>
                                                ) : (
                                                    <span className={`text-2xl font-light ${dm ? 'text-slate-400 hover:text-emerald-400' : 'text-gray-300 hover:text-emerald-500'}`}>+</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'historico' && (
                <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                    <div data-card-glyph="📈" className={`sereno-ornament-card rounded-[2rem] p-5 border ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-cyan-300' : 'text-cyan-700'}`}>Leitura do ritmo</p>
                                <h3 className="mt-2 text-lg font-black">Seu histórico mostra onde a rotina está ficando mais firme</h3>
                                <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Use esta leitura para ajustar hábitos, criar um ciclo em missões ou acompanhar tudo de forma mais ampla em progresso.
                                </p>
                            </div>
                            <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${dm ? 'bg-slate-900 text-slate-200 border border-slate-700' : 'bg-cyan-50 text-cyan-800 border border-cyan-100'}`}>
                                <p className="text-lg font-black">{totalCompletedCount}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em]">marcações</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => onNavigate?.('stats')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>Abrir progresso</button>
                            <button onClick={() => onNavigate?.('missions')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-violet-50 text-violet-800 border border-violet-100'}`}>Criar ciclo</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div data-card-glyph="🔥" className={`sereno-ornament-card p-5 rounded-3xl border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Sequência atual</p>
                            <p className={`text-4xl font-black mt-2 ${dm ? 'text-emerald-400' : 'text-emerald-700'}`}>{streak}</p>
                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>dias seguidos</p>
                        </div>
                        <div data-card-glyph="📈" className={`sereno-ornament-card p-5 rounded-3xl border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Total concluído</p>
                            <p className={`text-4xl font-black mt-2 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>{totalCompletedCount}</p>
                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>marcações feitas</p>
                        </div>
                    </div>

                    <div data-card-glyph="📊" className={`sereno-ornament-card rounded-3xl p-5 border shadow-sm ${dm ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-100'}`}>
                        <h3 className={`font-extrabold text-lg mb-4 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Consistência da semana</h3>
                        <div className="flex items-end justify-between gap-2">
                            {last7Days.map((dateStr) => {
                                const count = history[dateStr]?.length || 0;
                                const total = Math.max(myHabits.length, 1);
                                const percent = Math.max((count / total) * 100, count > 0 ? 12 : 8);
                                return (
                                    <div key={dateStr} className="flex-1 flex flex-col items-center gap-2">
                                        <div className={`w-full rounded-t-2xl ${dm ? 'bg-slate-700' : 'bg-slate-200'}`} style={{ height: '92px', position: 'relative' }}>
                                            <div className="absolute bottom-0 inset-x-0 bg-emerald-500 rounded-t-2xl" style={{ height: `${percent}%` }} />
                                        </div>
                                        <p className={`text-[10px] font-black ${dm ? 'text-slate-300' : 'text-gray-700'}`}>{count}</p>
                                        <p className={`text-[10px] font-bold ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{getDayOfWeek(dateStr)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div data-card-glyph="🌿" className={`sereno-ornament-card rounded-3xl p-5 border shadow-sm ${dm ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-100'}`}>
                        <h3 className={`font-extrabold text-lg mb-4 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Hábitos que mais se repetem</h3>
                        {repeatedHabits.length === 0 ? (
                            <p className={`text-sm font-medium ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Quando alguns hábitos começarem a se repetir, eles aparecem aqui.</p>
                        ) : (
                            <div className="space-y-3">
                                {repeatedHabits.map((habit) => (
                                    <div key={habit.id} data-card-glyph={habit.icon} className={`sereno-ornament-card p-4 rounded-2xl border ${dm ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-2xl">{habit.icon}</span>
                                                <div className="min-w-0">
                                                    <p className={`font-bold truncate ${dm ? 'text-slate-200' : 'text-gray-800'}`}>{habit.title}</p>
                                                    <p className={`text-xs font-semibold ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{habit.category}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-black px-2 py-1 rounded-full ${dm ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>{habit.count}x</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-5 rounded-3xl border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Melhor horário salvo</p>
                            <p className={`text-lg font-black mt-2 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>{bestReminderHabit?.reminderTime || 'Ainda não definido'}</p>
                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{bestReminderHabit ? bestReminderHabit.title : 'adicione lembretes aos hábitos'}</p>
                        </div>
                        <div className={`p-5 rounded-3xl border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Hábito mais firme</p>
                            <p className={`text-lg font-black mt-2 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>{habitFrequency[0]?.title || 'Ainda não há destaque'}</p>
                            <p className={`text-xs font-semibold mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{habitFrequency[0] ? `${habitFrequency[0].count} marcações no histórico` : 'comece a repetir para ver padrões'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: CONQUISTAS */}
            {activeTab === 'conquistas' && (
                <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
                    <div data-card-glyph="🏆" className={`sereno-ornament-card rounded-[2rem] p-5 border ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-amber-300' : 'text-amber-700'}`}>Marcos da rotina</p>
                                <h3 className="mt-2 text-lg font-black">Os marcos daqui mostram constância no cotidiano</h3>
                                <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Aqui ficam os marcos da rotina. Para ver o panorama geral do app, siga para Progresso.
                                </p>
                            </div>
                            <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${dm ? 'bg-slate-900 text-slate-200 border border-slate-700' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
                                <p className="text-lg font-black">{earnedMedals.length}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em]">marcos</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button onClick={() => onNavigate?.('stats')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>Ver progresso geral</button>
                            <button onClick={() => onNavigate?.('missions')} className={`rounded-2xl px-3 py-3 text-xs font-black ${dm ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'bg-violet-50 text-violet-800 border border-violet-100'}`}>Abrir missões</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-6 rounded-3xl text-center border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <span className="text-4xl block mb-2 filter drop-shadow">🔥</span>
                            <span className={`text-4xl font-black block mb-1 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>{streak}</span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Dias Seguidos</span>
                        </div>
                        <div className={`p-6 rounded-3xl text-center border shadow-sm ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                            <span className="text-4xl block mb-2 filter drop-shadow">⭐</span>
                            <span className={`text-4xl font-black block mb-1 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>{totalCompletedCount}</span>
                            <span className={`text-xs font-bold uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Total Concluídos</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className={`font-extrabold text-xl mb-4 text-center ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Marcos da rotina</h3>

                        {earnedMedals.length === 0 ? (
                            <div className={`text-center p-8 rounded-3xl border border-dashed ${dm ? 'border-slate-700 bg-slate-800/20' : 'border-gray-200 bg-white/50'}`}>
                                <span className="text-5xl block mb-4 opacity-50">🏆</span>
                                <p className={`font-medium ${dm ? 'text-slate-500' : 'text-gray-400'}`}>Suas conquistas aparecerão aqui enquanto você floresce.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {earnedMedals.map((medal, i) => (
                                    <div
                                        key={medal.id}
                                        className={`p-5 flex items-center gap-4 rounded-3xl border shadow-sm animate-slide-up ${dm ? 'bg-slate-800 border-emerald-900/50' : 'bg-white border-emerald-100'}`}
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    >
                                        <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-3xl shadow-inner border border-white/20 ${dm ? 'bg-slate-700/80 shadow-black/50' : 'bg-gradient-to-br from-amber-50 to-amber-200'}`}>
                                            {medal.icon}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-sm mb-0.5 ${dm ? 'text-emerald-400' : 'text-gray-800'}`}>{medal.title}</h4>
                                            <p className={`text-[11px] font-semibold uppercase ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{medal.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
