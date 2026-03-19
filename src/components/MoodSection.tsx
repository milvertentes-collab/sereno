'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import PlutchikWheel from './PlutchikWheel';
import GuidedNaming from './GuidedNaming';
import SectionHeroCard from './SectionHeroCard';

type EntryMode = 'quick' | 'complete';

export interface MoodEntry {
    id: string;
    date: string;
    time: string;
    primaryEmotion: string;
    secondaryEmotions: string[];
    intensity: number; // 1-5
    note?: string;
    trigger?: string;
    triggerNote?: string;
    // New Health Metrics
    sleepQuality?: number; // 1-5
    energyLevel?: number; // 1-5
    sociability?: number; // 1-5
    bodyArea?: string;
    foodNote?: string;
    menstrualMode?: 'off' | 'folicular' | 'ovulatorio' | 'lutea' | 'menstrual';
    // Legacy fields
    mood?: string;
    anxiety?: number;
    stress?: number;
    energy?: number;
}

interface MoodSectionProps {
    moodHistory: MoodEntry[];
    setMoodHistory: (value: MoodEntry[]) => void;
    darkMode?: boolean;
    desktopMode?: boolean;
    initialStep?: number;
    onStepChange?: (step: number) => void;
    userSex?: string;
    onNavigate?: (tab: any, params?: Record<string, any>) => void;
}

const EMOTION_CATEGORIES = {
    pleasant: {
        title: 'Agradáveis',
        items: [
            { id: 'feliz', label: 'Feliz', color: 'bg-[#FFF9C4]', icon: '😊', desc: 'Sensação de alegria e bem-estar', textColor: 'text-yellow-800' },
            { id: 'calmo', label: 'Calmo', color: 'bg-[#E1F5FE]', icon: '😌', desc: 'Tranquilidade e estabilidade', textColor: 'text-sky-800' },
            { id: 'animado', label: 'Animado', color: 'bg-[#FFE0B2]', icon: '✨', desc: 'Energia positiva e disposição', textColor: 'text-orange-800' },
            { id: 'grato', label: 'Grato', color: 'bg-[#FFECB3]', icon: '💛', desc: 'Apreciação e reconhecimento', textColor: 'text-amber-800' },
            { id: 'esperancoso', label: 'Esperançoso', color: 'bg-[#E8F5E9]', icon: '🌱', desc: 'Confiança no futuro', textColor: 'text-green-800' },
            { id: 'motivado', label: 'Motivado', color: 'bg-[#FFCCBC]', icon: '🚀', desc: 'Vontade de agir e realizar', textColor: 'text-red-800' },
            { id: 'orgulhoso', label: 'Orgulhoso', color: 'bg-[#D7CCC8]', icon: '🦁', desc: 'Satisfação com seus avanços', textColor: 'text-amber-900' },
            { id: 'aliviado', label: 'Aliviado', color: 'bg-[#B2DFDB]', icon: '🌿', desc: 'Peso emocional reduzido', textColor: 'text-teal-900' },
        ]
    },
    mixed: {
        title: 'Mistas',
        items: [
            { id: 'cansado', label: 'Cansado', color: 'bg-[#CFD8DC]', icon: '🔋', desc: 'Baixa energia física ou mental', textColor: 'text-slate-800' },
            { id: 'pensativo', label: 'Pensativo', color: 'bg-[#E1BEE7]', icon: '💭', desc: 'Mente reflexiva/introspectiva', textColor: 'text-fuchsia-800' },
            { id: 'sensivel', label: 'Sensível', color: 'bg-[#F8BBD0]', icon: '🌸', desc: 'Emoções à flor da pele', textColor: 'text-pink-800' },
            { id: 'confuso', label: 'Confuso', color: 'bg-[#D1C4E9]', icon: '🌀', desc: 'Dificuldade de entender o que sente', textColor: 'text-purple-800' },
            { id: 'nostalgico', label: 'Nostálgico', color: 'bg-[#B39DDB]', icon: '🕰️', desc: 'Saudade de algo ou alguém', textColor: 'text-violet-900' },
            { id: 'culpado', label: 'Culpado', color: 'bg-[#B0BEC5]', icon: '⚖️', desc: 'Peso por algo dito/feito', textColor: 'text-slate-900' },
        ]
    },
    difficult: {
        title: 'Difíceis',
        items: [
            { id: 'ansioso', label: 'Ansioso', color: 'bg-[#FFECB3]', icon: '〰️', desc: 'Inquietação, aceleração interna', textColor: 'text-amber-900' },
            { id: 'triste', label: 'Triste', color: 'bg-[#B3E5FC]', icon: '💧', desc: 'Abatimento, dor emocional', textColor: 'text-blue-900' },
            { id: 'irritado', label: 'Irritado', color: 'bg-[#FFCCBC]', icon: '🔥', desc: 'Incômodo, impaciência, raiva', textColor: 'text-orange-900' },
            { id: 'estressado', label: 'Estressado', color: 'bg-[#FFAB91]', icon: '💢', desc: 'Pressão mental, tensão', textColor: 'text-red-900' },
            { id: 'sobrecarregado', label: 'Sobrecarregado', color: 'bg-[#E1BEE7]', icon: '🎒', desc: 'Sensação de excesso', textColor: 'text-purple-900' },
            { id: 'desmotivado', label: 'Desmotivado', color: 'bg-[#E0E0E0]', icon: '📉', desc: 'Pouca energia para continuar', textColor: 'text-gray-800' },
            { id: 'solitario', label: 'Solitário', color: 'bg-[#C5CAE9]', icon: '🫥', desc: 'Sensação de desconexão', textColor: 'text-indigo-900' },
            { id: 'envergonhado', label: 'Envergonhado', color: 'bg-[#FFCDD2]', icon: '🙈', desc: 'Autojulgamento e retração', textColor: 'text-rose-900' },
        ]
    }
};

export const TRIGGER_CATEGORIES = [
    { id: 'work', label: 'Trabalho', icon: '💼' },
    { id: 'routine', label: 'Rotina', icon: '🗓️' },
    { id: 'family', label: 'Família', icon: '🏠' },
    { id: 'relationships', label: 'Relacionamentos', icon: '❤️' },
    { id: 'health', label: 'Saúde', icon: '🏥' },
    { id: 'sleep', label: 'Sono/Descanso', icon: '🌙' },
    { id: 'social', label: 'Social/Amigos', icon: '🤝' },
    { id: 'finance', label: 'Finanças', icon: '💰' },
    { id: 'self_pressure', label: 'Autocobrança', icon: '🎯' },
    { id: 'inner_conflict', label: 'Conflito interno', icon: '🧠' },
    { id: 'memories', label: 'Memórias', icon: '🕰️' },
    { id: 'hobbies', label: 'Lazer/Hobbies', icon: '🎨' },
    { id: 'self', label: 'Cuidado Pessoal', icon: '✨' },
    { id: 'unclear', label: 'Sem motivo claro', icon: '🌫️' },
    { id: 'other', label: 'Outro', icon: '❓' },
];

const INTENSITY_LABELS = {
    1: 'Quase de fundo',
    2: 'Leve',
    3: 'Presente',
    4: 'Forte',
    5: 'Muito intensa',
} as const;

const getAllEmotions = () => {
    return [
        ...EMOTION_CATEGORIES.pleasant.items,
        ...EMOTION_CATEGORIES.mixed.items,
        ...EMOTION_CATEGORIES.difficult.items
    ];
};

const formatDay = (dateString: string) => {
    const d = new Date(`${dateString}T12:00:00`);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
};

const normalizeEmotionText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const EMOTION_ALIAS_MAP: Record<string, string> = {
    feliz: 'feliz',
    alegria: 'feliz',
    extase: 'animado',
    euforia: 'animado',
    animado: 'animado',
    entusiasmo: 'animado',
    motivacao: 'motivado',
    motivado: 'motivado',
    confianca: 'esperancoso',
    esperanca: 'esperancoso',
    esperancoso: 'esperancoso',
    aceitacao: 'calmo',
    calma: 'calmo',
    sereno: 'calmo',
    serenidade: 'calmo',
    calmo: 'calmo',
    gratidao: 'grato',
    grato: 'grato',
    carinho: 'grato',
    alivio: 'aliviado',
    aliviado: 'aliviado',
    orgulho: 'orgulhoso',
    orgulhoso: 'orgulhoso',
    pertencimento: 'grato',

    cansaco: 'cansado',
    cansado: 'cansado',
    tedio: 'cansado',
    pensativo: 'pensativo',
    curiosidade: 'pensativo',
    antecipacao: 'pensativo',
    surpresa: 'pensativo',
    sensibilidade: 'sensivel',
    sensivel: 'sensivel',
    nostalgia: 'nostalgico',
    nostalgico: 'nostalgico',
    culpa: 'culpado',
    culpado: 'culpado',
    confusao: 'confuso',
    confuso: 'confuso',

    ansiedade: 'ansioso',
    ansioso: 'ansioso',
    medo: 'ansioso',
    receio: 'ansioso',
    terror: 'ansioso',
    tristeza: 'triste',
    triste: 'triste',
    pesar: 'triste',
    irritacao: 'irritado',
    irritado: 'irritado',
    raiva: 'irritado',
    furia: 'irritado',
    odio: 'irritado',
    nojo: 'irritado',
    aversao: 'irritado',
    pressao: 'estressado',
    estresse: 'estressado',
    estressado: 'estressado',
    sobrecarga: 'sobrecarregado',
    sobrecarregado: 'sobrecarregado',
    vigilancia: 'sobrecarregado',
    desanimo: 'desmotivado',
    desmotivado: 'desmotivado',
    sem_energia: 'desmotivado',
    solidao: 'solitario',
    solitario: 'solitario',
    vergonha: 'envergonhado',
    envergonhado: 'envergonhado',
    inseguranca: 'envergonhado',
    autocobranca: 'estressado',
};

const resolveEmotionToMoodId = (value: string) => {
    const normalized = normalizeEmotionText(value);
    if (!normalized) return '';
    const allIds = new Set(getAllEmotions().map((emotion) => normalizeEmotionText(emotion.id)));
    if (allIds.has(normalized)) return normalized;
    return EMOTION_ALIAS_MAP[normalized] || 'confuso';
};

export default function MoodSection({ moodHistory, setMoodHistory, darkMode: dm, desktopMode = false, initialStep, onStepChange, userSex, onNavigate }: MoodSectionProps) {
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>((initialStep as any) || 0); // 5: Plutchik, 6: GuidedNaming, 7: Health Metrics
    const [entryMode, setEntryMode] = useState<EntryMode>('complete');

    useEffect(() => {
        if (initialStep !== undefined && (initialStep as any) !== step) {
            setStep(initialStep as any);
        }
    }, [initialStep]);

    const changeStep = (newStep: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
        setStep(newStep);
        if (onStepChange) onStepChange(newStep as any);
    };
    const [primary, setPrimary] = useState<string>('');
    const [secondaries, setSecondaries] = useState<string[]>([]);
    const [intensity, setIntensity] = useState<number>(3);
    const [note, setNote] = useState('');
    const [trigger, setTrigger] = useState<string>('');
    const [triggerNote, setTriggerNote] = useState('');
    const [sleepQuality, setSleepQuality] = useState<number>(3);
    const [energyLevel, setEnergyLevel] = useState<number>(3);
    const [sociability, setSociability] = useState<number>(3);
    const [bodyArea, setBodyArea] = useState('');
    const [foodNote, setFoodNote] = useState('');
    const [menstrualMode, setMenstrualMode] = useState<'off' | 'folicular' | 'ovulatorio' | 'lutea' | 'menstrual'>('off');

    const c = (base: string, dark: string) => dm ? dark : base;
    const shouldShowCycleField = ['mulher', 'mulher_trans', 'pessoa_com_ciclo'].includes(userSex || '');

    useEffect(() => {
        if (!shouldShowCycleField && menstrualMode !== 'off') {
            setMenstrualMode('off');
        }
    }, [shouldShowCycleField, menstrualMode]);

    const today = new Date().toISOString().split('T')[0];
    const todayEntry = moodHistory.find(m => m.date === today);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const yesterdayEntry = moodHistory.find(m => m.date === yesterdayKey);

    const [aiSuggestion, setAiSuggestion] = useState<string>('');
    const [isFetchingAi, setIsFetchingAi] = useState(false);
    const fetchedSuggestionRef = useRef(false);

    useEffect(() => {
        if (todayEntry && !fetchedSuggestionRef.current) {
            fetchedSuggestionRef.current = true;
            setIsFetchingAi(true);

            const emDetails = getEmotionDetails(todayEntry.primaryEmotion);
            if (!emDetails) {
                setIsFetchingAi(false);
                return; // legacy
            }

            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Estou me sentindo ${emDetails.label} (intensidade ${todayEntry.intensity}/5). ${todayEntry.note ? 'Nota extra: ' + todayEntry.note : ''}`,
                    mode: 'suggestion',
                    userContext: { todayMood: todayEntry }
                })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.response) setAiSuggestion(data.response);
                    setIsFetchingAi(false);
                })
                .catch(e => {
                    console.error(e);
                    setIsFetchingAi(false);
                });
        }
    }, [todayEntry]);

    const resetForm = (mode: EntryMode = 'complete') => {
        setEntryMode(mode);
        setPrimary('');
        setSecondaries([]);
        setIntensity(3);
        setNote('');
        setTrigger('');
        setTriggerNote('');
        setSleepQuality(3);
        setEnergyLevel(3);
        setSociability(3);
        setBodyArea('');
        setFoodNote('');
        setMenstrualMode('off');
    };

    const saveMood = () => {
        const newEntry: MoodEntry = {
            id: crypto.randomUUID(),
            date: today,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            primaryEmotion: primary,
            secondaryEmotions: secondaries,
            intensity,
            note,
            trigger,
            triggerNote,
            sleepQuality,
            energyLevel,
            sociability,
            bodyArea,
            foodNote,
            menstrualMode,
        };

        const newHistory = moodHistory.filter(m => m.date !== today);
        setMoodHistory([newEntry, ...newHistory].slice(0, 30));
        changeStep(0);
    };

    const toggleSecondary = (id: string) => {
        if (secondaries.includes(id)) {
            setSecondaries(secondaries.filter(s => s !== id));
        } else if (secondaries.length < 2) {
            setSecondaries([...secondaries, id]);
        }
    };

    const getEmotionDetails = (id: string) => {
        return getAllEmotions().find(e => e.id === id);
    };

    const startNewCheckIn = (mode: EntryMode) => {
        resetForm(mode);
        changeStep(1);
    };

    const startEditingExisting = (mode: EntryMode = entryMode) => {
        if (!todayEntry) return;
        setEntryMode(mode);
        setPrimary(todayEntry.primaryEmotion);
        setSecondaries(todayEntry.secondaryEmotions || []);
        setIntensity(todayEntry.intensity || 3);
        setNote(todayEntry.note || '');
        setTrigger(todayEntry.trigger || '');
        setTriggerNote(todayEntry.triggerNote || '');
        setSleepQuality(todayEntry.sleepQuality || 3);
        setEnergyLevel(todayEntry.energyLevel || 3);
        setSociability(todayEntry.sociability || 3);
        setBodyArea(todayEntry.bodyArea || '');
        setFoodNote(todayEntry.foodNote || '');
        setMenstrualMode(todayEntry.menstrualMode || 'off');
        changeStep(1);
    };

    const now = new Date();
    const last7Entries = moodHistory.filter((entry) => {
        const entryDate = new Date(`${entry.date}T12:00:00`).getTime();
        return entryDate >= now.getTime() - 6 * 24 * 60 * 60 * 1000;
    });

    const emotionCounts = last7Entries.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.primaryEmotion] = (acc[entry.primaryEmotion] || 0) + 1;
        return acc;
    }, {});
    const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    const weeklyTopEmotion = sortedEmotions[0]?.[0];
    const weeklySecondEmotion = sortedEmotions[1]?.[0];
    const weeklyTopEmotionLabel = weeklyTopEmotion ? getEmotionDetails(weeklyTopEmotion)?.label || weeklyTopEmotion : null;
    const weeklySecondEmotionLabel = weeklySecondEmotion ? getEmotionDetails(weeklySecondEmotion)?.label || weeklySecondEmotion : null;
    const avgIntensity = last7Entries.length
        ? (last7Entries.reduce((sum, entry) => sum + entry.intensity, 0) / last7Entries.length).toFixed(1)
        : null;
    const triggerCounts = last7Entries.reduce<Record<string, number>>((acc, entry) => {
        if (!entry.trigger) return acc;
        acc[entry.trigger] = (acc[entry.trigger] || 0) + 1;
        return acc;
    }, {});
    const topTriggerId = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topTriggerLabel = topTriggerId ? TRIGGER_CATEGORIES.find((item) => item.id === topTriggerId)?.label : null;

    const todayPrimaryDetails = todayEntry ? getEmotionDetails(todayEntry.primaryEmotion) : null;
    const yesterdayPrimaryDetails = yesterdayEntry ? getEmotionDetails(yesterdayEntry.primaryEmotion) : null;
    const comparisonSummary = (() => {
        if (!todayEntry || !yesterdayEntry) return null;
        if (todayEntry.intensity > yesterdayEntry.intensity) return 'Hoje você está mais intenso(a) do que ontem.';
        if (todayEntry.intensity < yesterdayEntry.intensity) return 'Hoje seu estado parece um pouco mais leve do que ontem.';
        if (todayEntry.primaryEmotion !== yesterdayEntry.primaryEmotion) {
            return `Hoje você saiu de ${yesterdayPrimaryDetails?.label || 'ontem'} para ${todayPrimaryDetails?.label || 'agora'}.`;
        }
        return 'Hoje seu registro está parecido com o de ontem.';
    })();

    const recentAverageIntensity = useMemo(() => {
        if (!last7Entries.length) return null;
        const value = last7Entries.reduce((sum, entry) => sum + entry.intensity, 0) / last7Entries.length;
        return Math.round(value * 10) / 10;
    }, [last7Entries]);

    const moodDirection = useMemo(() => {
        if (!todayEntry || !todayPrimaryDetails) return null;
        const primaryId = todayEntry.primaryEmotion;

        if (['ansioso', 'estressado', 'sobrecarregado', 'irritado'].includes(primaryId)) {
            return {
                eyebrow: 'Direção do momento',
                title: 'Primeiro regule o corpo',
                text: 'Hoje o melhor tende a ser baixar a ativação antes de tentar resolver tudo.',
                actions: [
                    { label: 'Respiração', tab: 'breathing' as const, params: { source: 'mood', preset: 'calm' } },
                    { label: 'SOS', tab: 'sos' as const, params: { source: 'mood', suggestion: 'grounding' } },
                    { label: 'Microtarefas', tab: 'microtasks' as const, params: { source: 'mood', focus: 'single-step' } },
                ],
            };
        }

        if (['triste', 'solitario', 'desmotivado', 'sem_energia'].includes(primaryId)) {
            return {
                eyebrow: 'Direção do momento',
                title: 'Hoje vale reduzir exigência',
                text: 'Seu registro sugere mais acolhimento, estrutura leve e um passo possível.',
                actions: [
                    { label: 'Microtarefas', tab: 'microtasks' as const, params: { source: 'mood', focus: 'difficult-day' } },
                    { label: 'Diário', tab: 'diary' as const, params: { source: 'mood', prompt: 'O que preciso acolher hoje?' } },
                    { label: 'Gratidão', tab: 'gratitude' as const, params: { source: 'mood', mode: 'quick' } },
                ],
            };
        }

        if (['confuso', 'pensativo', 'culpado', 'inseguro', 'envergonhado'].includes(primaryId)) {
            return {
                eyebrow: 'Direção do momento',
                title: 'Clareza antes de pressão',
                text: 'Antes de decidir muito, pode ajudar nomear melhor o que está pesando e escolher só um próximo passo.',
                actions: [
                    { label: 'Diário', tab: 'diary' as const, params: { source: 'mood', prompt: 'O que está pesando mais agora?' } },
                    { label: 'Microtarefas', tab: 'microtasks' as const, params: { source: 'mood', focus: 'single-step' } },
                    { label: 'Meditação', tab: 'meditation' as const, params: { source: 'mood' } },
                ],
            };
        }

        return {
            eyebrow: 'Direção do momento',
            title: 'Sustente o que te fez bem',
            text: 'Seu registro aponta um estado mais estável. Talvez o melhor agora seja consolidar essa presença com leveza.',
            actions: [
                { label: 'Meditação', tab: 'meditation' as const, params: { source: 'mood' } },
                { label: 'Gratidão', tab: 'gratitude' as const, params: { source: 'mood', mode: 'quick' } },
                { label: 'Mixer', tab: 'mixer' as const, params: { source: 'mood' } },
            ],
        };
    }, [todayEntry, todayPrimaryDetails]);

    const weeklyInsight = useMemo(() => {
        if (!last7Entries.length) return null;
        if (weeklyTopEmotionLabel && topTriggerLabel) {
            return `Nos últimos 7 dias, ${weeklyTopEmotionLabel.toLowerCase()} apareceu mais e ${topTriggerLabel.toLowerCase()} foi um gatilho recorrente.`;
        }
        if (weeklyTopEmotionLabel) {
            return `Nos últimos 7 dias, ${weeklyTopEmotionLabel.toLowerCase()} foi o estado mais frequente.`;
        }
        if (recentAverageIntensity) {
            return `Sua intensidade média recente ficou em ${recentAverageIntensity}/5.`;
        }
        return null;
    }, [last7Entries, weeklyTopEmotionLabel, topTriggerLabel, recentAverageIntensity]);

    const modeConfig = entryMode === 'quick'
        ? {
            title: 'Registro rápido',
            description: 'Escolha a emoção principal e a intensidade. Depois, você já pode salvar.',
            badgeTone: c('bg-blue-50 text-blue-700 border-blue-100', 'bg-blue-950/30 text-blue-300 border-blue-900/40'),
        }
        : {
            title: 'Registro completo',
            description: 'Inclui emoções secundárias, gatilhos, nota e sinais do corpo para uma leitura mais rica.',
            badgeTone: c('bg-indigo-50 text-indigo-700 border-indigo-100', 'bg-indigo-950/30 text-indigo-300 border-indigo-900/40'),
        };
    const selectedPrimary = primary ? getEmotionDetails(primary) : null;
    const metricButtonClass = (selected: boolean, activeClass: string) =>
        selected
            ? `${activeClass} text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]`
            : c('bg-gray-100 text-gray-500 hover:bg-gray-200', 'bg-slate-700 text-slate-400 hover:bg-slate-600');

    if (todayEntry && step === 0) {
        const primaryDetails = todayPrimaryDetails;

        // Safety check for legacy entries
        if (!primaryDetails && todayEntry.mood) {
            return (
                <div className="p-4 flex flex-col items-center justify-center animate-fade-in pt-12">
                    <h2 className={`text-2xl font-bold mb-4 ${c('text-gray-800', 'text-white')}`}>Atualização do Diário</h2>
                    <p className={`text-center mb-6 ${c('text-gray-600', 'text-gray-400')}`}>
                        O formato do Diário de Humor foi atualizado para ser muito mais completo!
                        Reescreva seu humor de hoje para acessar as novas categorias.
                    </p>
                    <button onClick={() => changeStep(1)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">
                        Refazer Registro
                    </button>
                </div>
            )
        }

        return (
            <div className={`p-4 animate-fade-in pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
                <div className="mb-8 pt-4">
                    <SectionHeroCard
                        darkMode={dm}
                        eyebrow="Check-in emocional"
                        title="Humor"
                        description="Seu retrato emocional de hoje já está salvo."
                        icon="🧠"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className={`rounded-[1.7rem] border p-4 shadow-sm ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Hoje</p>
                        <p className={`mt-2 text-sm font-black ${c('text-slate-900', 'text-slate-100')}`}>
                            {todayPrimaryDetails ? `${todayPrimaryDetails.icon} ${todayPrimaryDetails.label}` : 'Sem registro'}
                        </p>
                        <p className={`mt-1 text-xs font-semibold ${c('text-slate-500', 'text-slate-400')}`}>Intensidade {todayEntry.intensity}/5</p>
                    </div>
                    <div className={`rounded-[1.7rem] border p-4 shadow-sm ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Padrão recente</p>
                        <p className={`mt-2 text-sm font-black ${c('text-slate-900', 'text-slate-100')}`}>
                            {weeklyTopEmotionLabel || 'Ainda começando'}
                        </p>
                        <p className={`mt-1 text-xs font-semibold ${c('text-slate-500', 'text-slate-400')}`}>
                            {recentAverageIntensity ? `Média ${recentAverageIntensity}/5` : 'Sem média suficiente'}
                        </p>
                    </div>
                    <div className={`rounded-[1.7rem] border p-4 shadow-sm ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Gatilho</p>
                        <p className={`mt-2 text-sm font-black ${c('text-slate-900', 'text-slate-100')}`}>
                            {topTriggerLabel || 'Sem padrão claro'}
                        </p>
                        <p className={`mt-1 text-xs font-semibold ${c('text-slate-500', 'text-slate-400')}`}>Leitura dos últimos 7 dias</p>
                    </div>
                </div>

                {primaryDetails && (
                    <div className={`rounded-3xl p-6 mb-6 shadow-sm border border-black/5 ${primaryDetails.color} ${dm ? 'opacity-90' : ''}`}>
                        <div className="text-center mb-4">
                            <span className="text-6xl block mb-2 filter drop-shadow-sm">{primaryDetails.icon}</span>
                            <p className={`text-2xl font-bold ${primaryDetails.textColor}`}>{primaryDetails.label}</p>
                            <p className={`text-sm font-medium opacity-80 ${primaryDetails.textColor}`}>Intensidade: {todayEntry.intensity}/5</p>
                        </div>

                        {comparisonSummary && (
                            <div className="mb-4 rounded-2xl bg-white/55 px-4 py-3 text-center shadow-sm">
                                <p className={`text-sm font-bold ${primaryDetails.textColor}`}>{comparisonSummary}</p>
                                {yesterdayPrimaryDetails && (
                                    <p className={`text-xs mt-1 opacity-80 ${primaryDetails.textColor}`}>
                                        Ontem: {yesterdayPrimaryDetails.icon} {yesterdayPrimaryDetails.label} • intensidade {yesterdayEntry?.intensity}/5
                                    </p>
                                )}
                            </div>
                        )}

                        {todayEntry.secondaryEmotions && todayEntry.secondaryEmotions.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-black/10">
                                <p className={`text-xs font-bold uppercase mb-3 ${primaryDetails.textColor} opacity-70`}>Também sentindo:</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {todayEntry.secondaryEmotions.map(secId => {
                                        const sec = getEmotionDetails(secId);
                                        return sec ? (
                                            <span key={secId} className={`px-4 py-1.5 rounded-full text-sm font-bold bg-white/60 shadow-sm ${primaryDetails.textColor}`}>
                                                {sec.icon} {sec.label}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {todayEntry.note && (
                            <div className="mt-4 pt-4 border-t border-black/10">
                                <p className={`italic text-sm font-medium leading-relaxed ${primaryDetails.textColor}`}>"{todayEntry.note}"</p>
                            </div>
                        )}

                        {todayEntry.trigger && (
                            <div className="mt-4 pt-4 border-t border-black/10">
                                <p className={`text-xs font-bold uppercase mb-2 ${primaryDetails.textColor} opacity-70`}>Gatilho identificado:</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{TRIGGER_CATEGORIES.find(t => t.id === todayEntry.trigger)?.icon || '❓'}</span>
                                    <span className={`text-sm font-bold ${primaryDetails.textColor}`}>
                                        {TRIGGER_CATEGORIES.find(t => t.id === todayEntry.trigger)?.label || 'Outro'}
                                    </span>
                                </div>
                                {todayEntry.triggerNote && (
                                    <p className={`mt-2 text-xs font-medium opacity-80 ${primaryDetails.textColor}`}>{todayEntry.triggerNote}</p>
                                )}
                            </div>
                        )}

                        {(todayEntry.bodyArea || todayEntry.foodNote || (todayEntry.menstrualMode && todayEntry.menstrualMode !== 'off')) && (
                            <div className="mt-4 pt-4 border-t border-black/10 space-y-2">
                                {todayEntry.bodyArea && <p className={`text-xs font-medium ${primaryDetails.textColor}`}>🧍 Corpo: {todayEntry.bodyArea}</p>}
                                {todayEntry.foodNote && <p className={`text-xs font-medium ${primaryDetails.textColor}`}>🍽️ Alimentação: {todayEntry.foodNote}</p>}
                                {todayEntry.menstrualMode && todayEntry.menstrualMode !== 'off' && <p className={`text-xs font-medium ${primaryDetails.textColor}`}>🌙 Ciclo: {todayEntry.menstrualMode}</p>}
                            </div>
                        )}

                        {/* AI Suggestion Card */}
                        {(isFetchingAi || aiSuggestion) && (
                            <div className={`mt-6 p-5 rounded-3xl relative overflow-hidden transition-all shadow-sm ${dm ? 'bg-slate-800/80 border border-slate-700' : 'bg-white/80 border border-white backdrop-blur-sm'}`}>
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-400 to-blue-500"></div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">✨</span>
                                    <h4 className={`text-sm font-extrabold ${c('text-gray-800', 'text-slate-200')}`}>Sugestão da Sereno</h4>
                                </div>
                                {isFetchingAi ? (
                                    <div className="flex gap-1.5 py-2">
                                        <span className="w-2.5 h-2.5 bg-blue-400/80 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <span className="w-2.5 h-2.5 bg-blue-400/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <span className="w-2.5 h-2.5 bg-blue-400/80 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                ) : (
                                    <p className={`text-sm leading-relaxed font-medium ${c('text-gray-600', 'text-slate-300')}`}>
                                        {aiSuggestion}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                            <button
                                onClick={() => startEditingExisting('complete')}
                                className={`py-3.5 rounded-2xl text-sm font-bold bg-white/40 hover:bg-white/60 transition-all active:scale-95 shadow-sm ${primaryDetails.textColor}`}
                            >
                                ✏️ Editar registro
                            </button>
                            <button
                                onClick={() => startNewCheckIn('quick')}
                                className={`py-3.5 rounded-2xl text-sm font-bold border border-white/60 bg-white/15 hover:bg-white/30 transition-all active:scale-95 shadow-sm ${primaryDetails.textColor}`}
                            >
                                ➕ Registrar novo check-in
                            </button>
                        </div>
                    </div>
                )}

                {moodDirection && (
                    <div className={`rounded-[2rem] border p-5 mb-6 shadow-sm ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-indigo-600', 'text-indigo-300')}`}>{moodDirection.eyebrow}</p>
                        <h3 className={`mt-2 text-[1.15rem] font-black tracking-[-0.02em] ${c('text-slate-900', 'text-slate-100')}`}>{moodDirection.title}</h3>
                        <p className={`mt-2 text-sm leading-relaxed font-semibold ${c('text-slate-600', 'text-slate-300')}`}>{moodDirection.text}</p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {moodDirection.actions.map((action) => (
                                <button
                                    key={`${action.tab}-${action.label}`}
                                    onClick={() => onNavigate?.(action.tab, action.params)}
                                    className={`rounded-2xl px-4 py-3 text-sm font-black transition-all active:scale-95 ${c('bg-indigo-600 text-white hover:bg-indigo-500', 'bg-indigo-500 text-white hover:bg-indigo-400')}`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {last7Entries.length > 0 && (
                    <div className={`rounded-3xl p-6 mb-6 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h3 className={`font-bold ${c('text-gray-800', 'text-slate-200')}`}>Leituras dos últimos 7 dias</h3>
                                {weeklyInsight && (
                                    <p className={`mt-1 text-sm font-semibold leading-relaxed ${c('text-slate-500', 'text-slate-400')}`}>{weeklyInsight}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {weeklyTopEmotionLabel && (
                                <div className={`rounded-2xl p-4 ${c('bg-slate-50', 'bg-slate-900/70')}`}>
                                    <p className={`text-[11px] uppercase font-black tracking-wider ${c('text-slate-500', 'text-slate-400')}`}>Emoção mais frequente</p>
                                    <p className="text-sm font-bold mt-1">{weeklyTopEmotionLabel}</p>
                                </div>
                            )}
                            {avgIntensity && (
                                <div className={`rounded-2xl p-4 ${c('bg-slate-50', 'bg-slate-900/70')}`}>
                                    <p className={`text-[11px] uppercase font-black tracking-wider ${c('text-slate-500', 'text-slate-400')}`}>Intensidade média</p>
                                    <p className="text-sm font-bold mt-1">{avgIntensity}/5</p>
                                </div>
                            )}
                            {topTriggerLabel && (
                                <div className={`rounded-2xl p-4 ${c('bg-slate-50', 'bg-slate-900/70')}`}>
                                    <p className={`text-[11px] uppercase font-black tracking-wider ${c('text-slate-500', 'text-slate-400')}`}>Gatilho mais repetido</p>
                                    <p className="text-sm font-bold mt-1">{topTriggerLabel}</p>
                                </div>
                            )}
                            {weeklyTopEmotionLabel && weeklySecondEmotionLabel && (
                                <div className={`rounded-2xl p-4 ${c('bg-slate-50', 'bg-slate-900/70')}`}>
                                    <p className={`text-[11px] uppercase font-black tracking-wider ${c('text-slate-500', 'text-slate-400')}`}>Leitura breve</p>
                                    <p className="text-sm font-bold mt-1">Nos últimos 7 dias, você esteve mais {weeklyTopEmotionLabel.toLowerCase()} do que {weeklySecondEmotionLabel.toLowerCase()}.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {moodHistory.length > 1 && (
                    <div className={`rounded-3xl p-6 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h3 className={`font-bold ${c('text-gray-800', 'text-slate-200')}`}>Últimos registros</h3>
                                <p className={`mt-1 text-sm font-semibold ${c('text-slate-500', 'text-slate-400')}`}>Veja como seu humor foi variando nos registros mais recentes.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {moodHistory.slice(0, 5).map((entry, index) => {
                                const e = getEmotionDetails(entry.primaryEmotion);
                                if (!e) return null; // Skip legacy formatting

                                const d = new Date(entry.date);
                                const isToday = entry.date === today;

                                return (
                                    <div key={entry.id || index} className={`flex items-center gap-4 p-4 rounded-2xl ${e.color} ${dm ? 'opacity-90' : 'bg-opacity-40'} shadow-sm`}>
                                        <div className="text-3xl filter drop-shadow-sm">{e.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm ${c('text-gray-900', 'text-slate-800')}`}>{e.label}</div>
                                            <div className={`text-xs font-medium ${c('text-gray-600', 'text-slate-600')}`}>
                                                {isToday ? 'Hoje' : formatDay(entry.date)} • Intensidade {entry.intensity}/5
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- WIZARD STEPS ---

    return (
        <div className={`p-4 animate-fade-in pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>

            {/* STEP 1 & 2: SELECT EMOTIONS */}
            {(step === 1 || step === 0) && (
                <div className="space-y-6">
                    <div className="pt-4 mb-2">
                        {!primary ? (
                            <SectionHeroCard
                                darkMode={dm}
                                eyebrow="Check-in emocional"
                                title="Humor"
                                description="Escolha sua emoção principal para começar."
                                icon="🧠"
                            />
                        ) : (
                            <>
                                <h2 className={`text-3xl font-extrabold tracking-tight text-center ${c('text-gray-900', 'text-slate-100')}`}>
                                    Mais alguma emoção?
                                </h2>
                                <p className={`text-sm mt-2 font-medium text-center ${c('text-gray-600', 'text-slate-400')}`}>
                                    {entryMode === 'quick'
                                        ? 'No modo rápido, você pode seguir direto se quiser.'
                                        : 'Opcional: escolha até 2 emoções secundárias.'}
                                </p>
                            </>
                        )}
                        {!primary && (
                            <div className={`mt-5 rounded-[2rem] border p-2.5 inline-flex gap-2 shadow-sm ${c('bg-white/90 border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.08)]', 'bg-slate-900/85 border-slate-700')}`}>
                                <button
                                    type="button"
                                    onClick={() => setEntryMode('quick')}
                                    className={`px-4 py-2.5 rounded-[1.15rem] text-xs font-black transition-all ${entryMode === 'quick' ? 'bg-blue-600 text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)]' : c('text-slate-600 hover:bg-slate-50', 'text-slate-300 hover:bg-slate-800')}`}
                                >
                                    Registro rápido
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEntryMode('complete')}
                                    className={`px-4 py-2.5 rounded-[1.15rem] text-xs font-black transition-all ${entryMode === 'complete' ? 'bg-indigo-600 text-white shadow-[0_12px_26px_rgba(79,70,229,0.24)]' : c('text-slate-600 hover:bg-slate-50', 'text-slate-300 hover:bg-slate-800')}`}
                                >
                                    Registro completo
                                </button>
                            </div>
                        )}
                        {!primary && (
                            <div className={`mt-4 rounded-3xl border p-4 text-left ${modeConfig.badgeTone}`}>
                                <p className="text-xs font-black uppercase tracking-wider">{modeConfig.title}</p>
                                <p className="text-sm font-semibold mt-1">{modeConfig.description}</p>
                            </div>
                        )}
                        {!primary && (
                            <div className="flex gap-2 justify-center mt-4">
                                <button
                                    onClick={() => changeStep(5)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${c('bg-white border-blue-200 text-blue-600', 'bg-slate-800 border-blue-900 text-blue-400')}`}
                                >
                                    🧭 Roda das Emoções
                                </button>
                                <button
                                    onClick={() => changeStep(6)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${c('bg-white border-purple-200 text-purple-600', 'bg-slate-800 border-purple-900 text-purple-400')}`}
                                >
                                    ❓ Me ajude a nomear
                                </button>
                            </div>
                        )}
                    </div>

                    {!primary && Object.entries(EMOTION_CATEGORIES).map(([key, cat]) => (
                        <div key={key} className="mb-8 animate-slide-up">
                            <div className="flex items-center justify-between gap-3 mb-4 px-1">
                                <h3 className={`font-bold text-lg ${c('text-gray-800', 'text-slate-300')}`}>{cat.title}</h3>
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-white border border-slate-200 text-slate-500', 'bg-slate-900 border border-slate-700 text-slate-400')}`}>
                                    {cat.items.length} opções
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {cat.items.map(e => (
                                    <button
                                        key={e.id}
                                        onClick={() => {
                                            setPrimary(e.id);
                                            setSecondaries([]);
                                        }}
                                        className={`group relative overflow-hidden flex flex-col items-start gap-3 p-4 rounded-[1.9rem] text-left transition-all active:scale-95 border shadow-sm hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${e.color} ${dm ? 'opacity-90 hover:opacity-100 border-white/10' : 'border-white/70'}`}
                                    >
                                        <div className="absolute right-3 top-3 opacity-10 text-[42px] leading-none pointer-events-none">
                                            {e.icon}
                                        </div>
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white/55 text-3xl shadow-sm">{e.icon}</span>
                                        <div className="pr-8">
                                            <div className={`font-black text-[15px] leading-tight ${e.textColor}`}>{e.label}</div>
                                            <div className={`text-xs font-semibold opacity-80 ${e.textColor} line-clamp-2 mt-1`}>{e.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {primary && (
                        <div className="animate-slide-up">
                            <div className={`p-5 rounded-[2rem] mb-6 flex items-center justify-between shadow-sm border border-black/5 ${selectedPrimary?.color} ${dm ? 'opacity-90' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-white/55 text-4xl filter drop-shadow-sm">{selectedPrimary?.icon}</span>
                                    <div>
                                        <p className={`text-xs uppercase font-extrabold opacity-70 mb-0.5 ${selectedPrimary?.textColor}`}>Principal</p>
                                        <p className={`font-bold text-lg ${selectedPrimary?.textColor}`}>{selectedPrimary?.label}</p>
                                    </div>
                                </div>
                                <button onClick={() => setPrimary('')} className={`rounded-full px-3 py-1.5 text-xs font-black border bg-white/50 ${selectedPrimary?.textColor}`}>
                                    Trocar
                                </button>
                            </div>

                            <div className={`rounded-2xl p-4 mb-5 border ${modeConfig.badgeTone}`}>
                                <p className="text-xs font-black uppercase tracking-wider">{modeConfig.title}</p>
                                <p className="text-sm font-semibold mt-1">
                                    {entryMode === 'quick'
                                        ? 'Neste modo, você pode pular emoções secundárias e seguir direto para salvar.'
                                        : 'Neste modo, você pode detalhar melhor o que sentiu antes de salvar.'}
                                </p>
                            </div>

                            {entryMode === 'complete' && (
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                                {getAllEmotions().filter(e => e.id !== primary).map(e => {
                                    const isSelected = secondaries.includes(e.id);
                                    const isDisabled = !isSelected && secondaries.length >= 2;
                                    return (
                                        <button
                                            key={e.id}
                                            onClick={() => toggleSecondary(e.id)}
                                            disabled={isDisabled}
                                            className={`p-3 rounded-[1.35rem] text-center flex flex-col items-center gap-1.5 transition-all shadow-sm active:scale-95 border
                              ${isSelected ? `${e.color} border-transparent shadow-[0_14px_28px_rgba(15,23,42,0.10)] ${dm ? 'opacity-90' : ''}` : c('bg-white border-gray-100 hover:bg-gray-50', 'bg-slate-800/80 border-slate-700 hover:bg-slate-700')}
                              ${isDisabled ? 'opacity-30 grayscale' : ''}
                           `}
                                        >
                                            <span className="text-2xl filter drop-shadow-sm">{e.icon}</span>
                                            <span className={`text-[11px] sm:text-xs font-bold ${isSelected ? e.textColor : c('text-gray-600', 'text-slate-300')}`}>{e.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            )}

                            <button
                                onClick={() => changeStep(2)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-lg"
                            >
                                {entryMode === 'quick' ? 'Continuar no modo rápido' : 'Continuar no modo completo'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: INTENSITY */}
            {step === 2 && (
                    <div className="space-y-6 pt-4 animate-slide-up">
                        <div className="text-center mb-10 pt-4">
                            <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Quão intenso está isso agora?</h2>
                            <p className={`text-sm mt-3 font-medium ${c('text-gray-500', 'text-slate-400')}`}>Escolha o quanto essa emoção está presente neste momento.</p>
                        <div className={`mt-4 inline-flex items-center rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider ${modeConfig.badgeTone}`}>
                            {entryMode === 'quick' ? 'Modo rápido: salva depois desta etapa' : 'Modo completo: ainda há mais detalhes opcionais'}
                        </div>
                        <div className="flex justify-center mt-10 mb-4">
                            <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border shadow-[0_18px_40px_rgba(15,23,42,0.10)] ${selectedPrimary?.color} ${dm ? 'opacity-90 border-white/10' : 'border-white/70'}`}>
                                <span className="text-7xl animate-pulse filter drop-shadow-lg">{selectedPrimary?.icon}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 sm:p-8 rounded-[2.5rem] border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <div className="flex justify-between w-full mb-6 relative">
                            <div className={`absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 rounded-full z-0 ${c('bg-slate-100', 'bg-slate-700')}`}></div>
                            {[1, 2, 3, 4, 5].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setIntensity(val)}
                                    className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full font-extrabold text-lg sm:text-xl flex items-center justify-center transition-all active:scale-95 ${intensity === val
                                        ? `scale-110 shadow-[0_18px_34px_rgba(15,23,42,0.18)] ${selectedPrimary?.color} ${selectedPrimary?.textColor} border-4 border-white dark:border-slate-800`
                                        : c('bg-gray-100 text-gray-400 hover:bg-gray-200 border-4 border-white', 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-4 border-slate-800')
                                        }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                        <div className={`mt-8 rounded-[1.8rem] border p-5 text-center font-bold ${c('bg-slate-50 border-slate-200', 'bg-slate-900/70 border-slate-700')}`}>
                            <span className="opacity-60 text-sm block mb-1">Intensidade {intensity}</span>
                            <p className={`text-xl ${intensity >= 4 ? selectedPrimary?.textColor : c('text-gray-700', 'text-slate-200')}`}>
                                {INTENSITY_LABELS[intensity as keyof typeof INTENSITY_LABELS]}
                            </p>
                            <p className={`mt-2 text-sm font-semibold ${c('text-slate-500', 'text-slate-400')}`}>
                                {intensity <= 2 && 'Está mais de fundo. Vale observar sem exigir muito de si.'}
                                {intensity === 3 && 'Está presente de forma clara. Nomear já ajuda bastante.'}
                                {intensity >= 4 && 'Está forte agora. Talvez o melhor seja se regular primeiro.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                        <button onClick={() => changeStep(1)} className={`w-1/3 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${c('bg-white border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')}`}>
                            Voltar
                        </button>
                        <button onClick={() => entryMode === 'quick' ? saveMood() : changeStep(3)} className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                            {entryMode === 'quick' ? 'Salvar check-in rápido' : 'Continuar'}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: NOTE */}
            {step === 3 && (
                <div className="space-y-6 pt-4 animate-slide-up">
                    <div className="text-center mb-8 pt-4">
                        <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Quer escrever um pouco?</h2>
                        <p className={`text-sm font-medium mt-3 ${c('text-gray-500', 'text-slate-400')}`}>Opcional: registre em poucas palavras o que aconteceu ou o que está passando pela sua mente.</p>
                    </div>

                    <div className={`rounded-[2rem] border p-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-900/70 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Frase guia</p>
                        <p className={`mt-2 text-sm font-semibold leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>
                            Você não precisa explicar tudo. Uma frase honesta já ajuda a enxergar melhor este momento.
                        </p>
                    </div>

                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Hoje eu senti isso porque..."
                        className={`w-full p-5 rounded-[2rem] border min-h-[180px] resize-none focus:outline-none focus:ring-2 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-blue-500/50', 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50')}`}
                    />

                    <div className="flex gap-3 mt-6">
                        <button onClick={() => changeStep(2)} className={`w-1/3 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${c('bg-white border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')}`}>
                            Voltar
                        </button>
                        <button onClick={() => changeStep(4)} className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-lg">
                            Continuar <span className="text-xl">➡️</span>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: TRIGGERS */}
            {step === 4 && (
                <div className="space-y-6 pt-4 animate-slide-up">
                    <div className="text-center mb-6 pt-4">
                        <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>O que pode ter contribuído para isso?</h2>
                        <p className={`text-sm font-medium mt-3 ${c('text-gray-500', 'text-slate-400')}`}>Nomear o gatilho ajuda a perceber padrões com mais clareza.</p>
                    </div>

                    <div className={`rounded-[2rem] border p-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-900/70 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Leitura de padrão</p>
                        <p className={`mt-2 text-sm font-semibold leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>
                            Às vezes o gatilho está fora. Às vezes está no ritmo, no corpo ou na autocobrança. Escolha o que mais se aproxima.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {TRIGGER_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setTrigger(cat.id)}
                                className={`relative overflow-hidden p-4 rounded-[1.6rem] text-center flex flex-col items-center gap-2 transition-all shadow-sm active:scale-95 border
                                    ${trigger === cat.id
                                        ? `bg-blue-100 border-blue-400 shadow-[0_16px_30px_rgba(37,99,235,0.14)] ${dm ? 'bg-blue-900/40 border-blue-700' : ''}`
                                        : c('bg-white border-gray-100 hover:bg-gray-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')
                                    }
                                `}
                            >
                                <span className="text-2xl">{cat.icon}</span>
                                <span className={`text-xs font-bold ${trigger === cat.id ? 'text-blue-700 dark:text-blue-300' : c('text-gray-600', 'text-slate-300')}`}>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={triggerNote}
                        onChange={(e) => setTriggerNote(e.target.value)}
                        placeholder="Se quiser, descreva um pouco melhor o contexto..."
                        className={`w-full p-5 rounded-[2rem] border min-h-[120px] resize-none focus:outline-none focus:ring-2 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-blue-500/50', 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50')}`}
                    />

                    <div className="flex gap-3 mt-6">
                        <button onClick={() => changeStep(3)} className={`w-1/3 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${c('bg-white border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')}`}>
                            Voltar
                        </button>
                        <button onClick={() => changeStep(7)} className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-lg">
                            Quase lá <span className="text-xl">✨</span>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 5: PLUTCHIK WHEEL */}
            {step === 5 && (
                <div className="space-y-6 pt-4 animate-slide-up">
                    <div className="text-center mb-2 pt-4">
                        <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Roda das Emoções</h2>
                        <p className={`text-sm font-medium mt-3 ${c('text-gray-500', 'text-slate-400')}`}>Navegue pelas intensidades e categorias de Plutchik.</p>
                    </div>

                    <PlutchikWheel
                        darkMode={dm}
                        onSelect={(em) => {
                            setPrimary(resolveEmotionToMoodId(em));
                            changeStep(2);
                        }}
                    />

                    <button onClick={() => changeStep(1)} className={`w-full py-4 rounded-2xl border font-bold transition-all active:scale-95 ${c('bg-white border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')}`}>
                        Voltar para lista
                    </button>
                </div>
            )}

            {/* STEP 6: GUIDED NAMING */}
            {step === 6 && (
                <div className="space-y-6 pt-4 animate-slide-up">
                    <GuidedNaming
                        darkMode={dm}
                        onCancel={() => changeStep(1)}
                        onComplete={(em, notes) => {
                            setPrimary(resolveEmotionToMoodId(em));
                            setNote(notes);
                            changeStep(2);
                        }}
                    />
                </div>
            )}

            {/* STEP 7: HEALTH METRICS */}
            {step === 7 && (
                <div className="space-y-8 pt-4 animate-slide-up">
                    <div className="text-center mb-6 pt-4">
                        <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Como foi seu dia?</h2>
                        <p className={`text-sm font-medium mt-3 ${c('text-gray-500', 'text-slate-400')}`}>Esses sinais ajudam a entender melhor seu corpo, sua energia e seu contexto.</p>
                    </div>

                    <div className={`rounded-[2rem] border p-5 ${c('bg-slate-50 border-slate-200', 'bg-slate-900/70 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Leitura corporal</p>
                        <p className={`mt-2 text-sm font-semibold leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>
                            Esses sinais não servem para julgar seu dia. Servem para entender melhor o contexto do que você sentiu.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Sleep Metric */}
                        <div className={`p-6 rounded-[2rem] border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">🌙</span>
                                <h3 className="font-bold">Qualidade do Sono</h3>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                                {[1, 2, 3, 4, 5].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setSleepQuality(val)}
                                        className={`w-10 h-10 rounded-full font-bold transition-all active:scale-90 ${metricButtonClass(sleepQuality === val, 'bg-indigo-500')}`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <p className={`mt-4 text-sm font-semibold ${c('text-slate-500', 'text-slate-400')}`}>
                                {sleepQuality <= 2 && 'Seu descanso parece ter sido baixo.'}
                                {sleepQuality === 3 && 'Seu sono ficou em um ponto intermediário.'}
                                {sleepQuality >= 4 && 'Seu descanso parece ter sustentado melhor o dia.'}
                            </p>
                        </div>

                        {/* Energy Metric */}
                        <div className={`p-6 rounded-[2rem] border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">🔋</span>
                                <h3 className="font-bold">Nível de Energia</h3>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                                {[1, 2, 3, 4, 5].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setEnergyLevel(val)}
                                        className={`w-10 h-10 rounded-full font-bold transition-all active:scale-90 ${metricButtonClass(energyLevel === val, 'bg-orange-500')}`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <p className={`mt-4 text-sm font-semibold ${c('text-slate-500', 'text-slate-400')}`}>
                                {energyLevel <= 2 && 'Hoje a energia parece ter ficado baixa.'}
                                {energyLevel === 3 && 'Sua energia pareceu estável, mas sem excesso.'}
                                {energyLevel >= 4 && 'Você teve mais força disponível ao longo do dia.'}
                            </p>
                        </div>

                        {/* Social Metric */}
                        <div className={`p-6 rounded-[2rem] border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">🤝</span>
                                <h3 className="font-bold">Sociabilidade</h3>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                                {[1, 2, 3, 4, 5].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setSociability(val)}
                                        className={`w-10 h-10 rounded-full font-bold transition-all active:scale-90 ${metricButtonClass(sociability === val, 'bg-green-500')}`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <p className={`mt-4 text-sm font-semibold ${c('text-slate-500', 'text-slate-400')}`}>
                                {sociability <= 2 && 'Talvez hoje você tenha precisado mais se recolher.'}
                                {sociability === 3 && 'Seu contato com os outros ficou em um meio-termo.'}
                                {sociability >= 4 && 'Hoje parece ter sido mais fácil se aproximar ou se comunicar.'}
                            </p>
                        </div>

                        <div className={`p-6 rounded-[2rem] border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <h3 className="font-bold mb-3">🧍 Onde essa emoção aparece no corpo?</h3>
                            <p className={`text-sm font-semibold mb-4 ${c('text-slate-500', 'text-slate-400')}`}>Uma pista física também ajuda a entender o estado emocional.</p>
                            <input
                                value={bodyArea}
                                onChange={(e) => setBodyArea(e.target.value)}
                                placeholder="Ex: peito apertado, nó na garganta, tensão no ombro..."
                                className={`w-full p-3 rounded-[1.1rem] border text-sm ${c('bg-gray-50 border-gray-200', 'bg-slate-900 border-slate-700')}`}
                            />
                        </div>

                        <div className={`p-6 rounded-[2rem] border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <h3 className="font-bold mb-3">🍽️ Alimentação x Humor</h3>
                            <p className={`text-sm font-semibold mb-4 ${c('text-slate-500', 'text-slate-400')}`}>Algo que você comeu, bebeu ou deixou de comer influenciou seu humor?</p>
                            <input
                                value={foodNote}
                                onChange={(e) => setFoodNote(e.target.value)}
                                placeholder="O que você comeu/bebeu e como ficou seu humor?"
                                className={`w-full p-3 rounded-[1.1rem] border text-sm ${c('bg-gray-50 border-gray-200', 'bg-slate-900 border-slate-700')}`}
                            />
                        </div>

                        {shouldShowCycleField && (
                            <div className={`p-6 rounded-[2rem] border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                                <h3 className="font-bold mb-3">🌙 Fase do ciclo (opcional)</h3>
                                <p className={`text-sm font-semibold mb-4 ${c('text-slate-500', 'text-slate-400')}`}>Se fizer sentido para você, isso pode ajudar a enxergar padrões ao longo do mês.</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'off', label: 'Off' },
                                        { id: 'folicular', label: 'Folicular' },
                                        { id: 'ovulatorio', label: 'Ovulação' },
                                        { id: 'lutea', label: 'Lútea' },
                                        { id: 'menstrual', label: 'Menstrual' },
                                    ].map((phase) => (
                                        <button
                                            key={phase.id}
                                            onClick={() => setMenstrualMode(phase.id as any)}
                                            className={`px-2 py-2 rounded-[0.9rem] text-xs font-bold border ${menstrualMode === phase.id ? 'bg-purple-500 text-white border-purple-500 shadow-[0_12px_24px_rgba(168,85,247,0.22)]' : c('bg-gray-50 border-gray-200 text-gray-700', 'bg-slate-900 border-slate-700 text-slate-300')}`}
                                        >
                                            {phase.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button onClick={() => changeStep(4)} className={`w-1/3 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${c('bg-white border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')}`}>
                            Voltar
                        </button>
                        <button onClick={saveMood} className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-lg">
                            Salvar Tudo <span className="text-2xl">🚀</span>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
