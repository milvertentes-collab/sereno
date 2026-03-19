'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { natureMixerTracks } from './NatureMixerSection';
import SectionHeroCard from './SectionHeroCard';

type EmotionalState =
    | 'travado'
    | 'ansioso'
    | 'sem_energia'
    | 'sobrecarregado'
    | 'sensivel'
    | 'triste'
    | 'irritado'
    | 'confuso'
    | 'inseguro';
type TaskCategory = 'corpo' | 'ambiente' | 'mente' | 'vinculo' | 'autocuidado';
type TaskViewFilter = 'recomendadas' | 'todas' | 'essenciais' | 'concluidas' | TaskCategory;

interface MicroTask {
    id: string;
    text: string;
    icon: string;
    completed: boolean;
    category: TaskCategory;
    emotionalStates: EmotionalState[];
    linkedTab?: string;
    ctaLabel?: string;
    navigationParams?: Record<string, any>;
    isSpotlight?: boolean;
}

interface MicroTasksSectionProps {
    darkMode?: boolean;
    onNavigate?: (tab: any, params?: Record<string, any>) => void;
    onTaskComplete?: () => void;
}

interface TaskTemplate {
    id: string;
    text: string;
    icon: string;
    category: TaskCategory;
    emotionalStates: EmotionalState[];
    linkedTab?: string;
    ctaLabel?: string;
    navigationParams?: Record<string, any>;
    isSpotlight?: boolean;
}

type InlineActionTab = 'breathing' | 'sos' | 'mood' | 'diary' | 'gratitude' | 'mixer';

const STORAGE_KEYS = {
    tasks: 'sereno_micro_tasks_v3',
    date: 'sereno_micro_tasks_date_v3',
    difficultDay: 'sereno_difficult_day_v2',
    emotionalState: 'sereno_micro_tasks_state_v1',
    customFeeling: 'sereno_micro_tasks_custom_feeling_v1',
    history: 'sereno_micro_tasks_history_v1',
} as const;

const EMOTIONAL_PROFILES: Array<{
    id: EmotionalState;
    label: string;
    emoji: string;
    intro: string;
    support: string;
    priorityTaskIds: string[];
    ultraMinimal: string[];
}> = [
    {
        id: 'travado',
        label: 'Travado(a)',
        emoji: '🧩',
        intro: 'Vamos reduzir a fricção e escolher o próximo passo mais simples.',
        support: 'Se você estiver travado(a), beber água, lavar o rosto e respirar já contam como movimento.',
        priorityTaskIds: ['water-reset', 'face-reset', 'breathing-box', 'window-pause'],
        ultraMinimal: ['Beba água.', 'Sente-se e respire 3 vezes.', 'Vá até a janela.'],
    },
    {
        id: 'ansioso',
        label: 'Ansioso(a)',
        emoji: '🌬️',
        intro: 'A ideia aqui não é render. É ajudar seu corpo a desacelerar.',
        support: 'Se você estiver ansioso(a), grounding, respiração e olhar para fora ajudam a baixar a ativação.',
        priorityTaskIds: ['grounding-sos', 'breathing-box', 'window-pause', 'music-soft'],
        ultraMinimal: ['Solte os ombros.', 'Respire 3 vezes bem devagar.', 'Olhe um ponto fixo por 20 segundos.'],
    },
    {
        id: 'sem_energia',
        label: 'Sem energia',
        emoji: '🔋',
        intro: 'Vamos focar no mínimo viável para te recolocar no dia com gentileza.',
        support: 'Se você estiver sem energia, cama arrumada, água e luz natural já são um reinício.',
        priorityTaskIds: ['bed-reset', 'water-reset', 'sun-touch', 'stretch-soft'],
        ultraMinimal: ['Beba alguns goles de água.', 'Arrume um pequeno canto.', 'Deixe a luz natural tocar você por 1 minuto.'],
    },
    {
        id: 'sobrecarregado',
        label: 'Sobrecarregado(a)',
        emoji: '🫶',
        intro: 'Vamos diminuir o peso do dia e separar só uma microação de cada vez.',
        support: 'Se você estiver sobrecarregado(a), uma pausa curta, uma frase no diário e um passo simples ajudam a destravar.',
        priorityTaskIds: ['brain-dump', 'diary-line', 'phone-break', 'water-reset'],
        ultraMinimal: ['Pare por 30 segundos.', 'Escreva uma frase sobre o que pesa agora.', 'Escolha só uma ação pequena.'],
    },
    {
        id: 'sensivel',
        label: 'Mais sensivel',
        emoji: '💜',
        intro: 'Hoje vale mais se acolher do que se cobrar.',
        support: 'Se você estiver mais sensível, autocuidado, gratidão e contato gentil com o ambiente podem ajudar.',
        priorityTaskIds: ['self-kindness', 'gratitude-three', 'window-pause', 'message-care'],
        ultraMinimal: ['Coloque a mão no peito.', 'Diga uma frase gentil para si.', 'Fique perto de um lugar calmo por 1 minuto.'],
    },
    {
        id: 'triste',
        label: 'Triste',
        emoji: '🌧️',
        intro: 'Hoje talvez você precise mais de acolhimento do que de cobrança.',
        support: 'Se você estiver triste, luz natural, uma frase no diário e contato com alguém seguro podem ajudar a sustentar o momento.',
        priorityTaskIds: ['sun-touch', 'diary-line', 'message-care', 'self-kindness'],
        ultraMinimal: ['Abra a janela ou procure luz natural.', 'Escreva uma frase sobre como está se sentindo.', 'Mande um "oi" para alguém seguro.'],
    },
    {
        id: 'irritado',
        label: 'Irritado(a)',
        emoji: '🔥',
        intro: 'Vamos baixar a temperatura do corpo e criar um pequeno espaço antes de agir.',
        support: 'Se você estiver irritado(a), pausar, respirar e se afastar um pouco do excesso de estímulo podem ajudar.',
        priorityTaskIds: ['breathing-box', 'phone-break', 'water-reset', 'window-pause'],
        ultraMinimal: ['Afaste-se por 1 minuto.', 'Beba água devagar.', 'Respire antes de responder qualquer coisa.'],
    },
    {
        id: 'confuso',
        label: 'Confuso(a)',
        emoji: '🌀',
        intro: 'Vamos organizar o excesso e escolher só um próximo passo.',
        support: 'Se você estiver confuso(a), nomear a principal preocupação e fazer um check-in breve já ajuda a clarear.',
        priorityTaskIds: ['brain-dump', 'mood-check', 'diary-line', 'micro-action'],
        ultraMinimal: ['Anote o que mais pesa agora.', 'Escolha só uma microação.', 'Ignore o resto por enquanto.'],
    },
    {
        id: 'inseguro',
        label: 'Inseguro(a)',
        emoji: '🫧',
        intro: 'Vamos diminuir a autocrítica e fortalecer um pouco de chão interno.',
        support: 'Se você estiver inseguro(a), uma frase gentil, uma pequena vitória reconhecida e uma ação simples podem devolver firmeza.',
        priorityTaskIds: ['kind-word', 'self-thank', 'diary-line', 'micro-action'],
        ultraMinimal: ['Diga algo gentil para si.', 'Reconheça uma pequena vitória sua.', 'Faça só o primeiro passo.'],
    },
];

const TASK_GROUPS: Record<TaskCategory, TaskTemplate[]> = {
    corpo: [
        { id: 'water-reset', text: 'Beba um copo de água', icon: '💧', category: 'corpo', emotionalStates: ['travado', 'sem_energia', 'sobrecarregado', 'irritado'] },
        { id: 'breathing-box', text: 'Faça 3 respirações profundas', icon: '🌬️', category: 'corpo', emotionalStates: ['ansioso', 'travado', 'irritado'], linkedTab: 'breathing', ctaLabel: 'Respirar agora', navigationParams: { source: 'microtasks', preset: 'calm' } },
        { id: 'face-reset', text: 'Lave o rosto com água fresca', icon: '🚿', category: 'corpo', emotionalStates: ['travado', 'sobrecarregado', 'triste'] },
        { id: 'stretch-soft', text: 'Faça um pequeno alongamento', icon: '🙆', category: 'corpo', emotionalStates: ['sem_energia', 'ansioso', 'triste'] },
    ],
    ambiente: [
        { id: 'bed-reset', text: 'Arrume sua cama', icon: '🛏️', category: 'ambiente', emotionalStates: ['sem_energia', 'travado', 'inseguro'] },
        { id: 'window-pause', text: 'Olhe pela janela por um minuto', icon: '🪟', category: 'ambiente', emotionalStates: ['ansioso', 'travado', 'sensivel', 'irritado'] },
        { id: 'sun-touch', text: 'Sinta a luz natural por um momento', icon: '☀️', category: 'ambiente', emotionalStates: ['sem_energia', 'sensivel', 'triste'] },
        { id: 'phone-break', text: 'Desconecte do celular por 5 min', icon: '📱', category: 'ambiente', emotionalStates: ['sobrecarregado', 'ansioso', 'irritado'] },
    ],
    mente: [
        { id: 'grounding-sos', text: 'Faça 1 técnica de grounding', icon: '🆘', category: 'mente', emotionalStates: ['ansioso', 'travado', 'confuso'], linkedTab: 'sos', ctaLabel: 'Fazer grounding', navigationParams: { source: 'microtasks', suggestion: 'grounding' } },
        { id: 'mood-check', text: 'Registre seu humor agora', icon: '📊', category: 'mente', emotionalStates: ['sobrecarregado', 'sensivel', 'confuso'], linkedTab: 'mood', ctaLabel: 'Registrar humor', navigationParams: { source: 'microtasks', focus: 'quick-checkin' } },
        { id: 'diary-line', text: 'Escreva 1 frase no diário', icon: '📓', category: 'mente', emotionalStates: ['sobrecarregado', 'sensivel', 'triste', 'confuso', 'inseguro'], linkedTab: 'diary', ctaLabel: 'Ir ao diário', navigationParams: { source: 'microtasks', prompt: 'Uma frase sobre como estou agora' } },
        { id: 'brain-dump', text: 'Anote a principal preocupação do momento', icon: '📝', category: 'mente', emotionalStates: ['sobrecarregado', 'travado', 'confuso'] },
    ],
    vinculo: [
        { id: 'message-care', text: 'Envie um "oi" para alguém seguro', icon: '💬', category: 'vinculo', emotionalStates: ['sensivel', 'sem_energia', 'triste'] },
        { id: 'self-thank', text: 'Reconheça uma pequena vitória sua', icon: '🌟', category: 'vinculo', emotionalStates: ['travado', 'sensivel', 'inseguro'] },
        { id: 'gratitude-three', text: 'Liste 3 coisas pelas quais é grato(a)', icon: '🙏', category: 'vinculo', emotionalStates: ['sensivel', 'sobrecarregado', 'triste'], linkedTab: 'gratitude', ctaLabel: 'Praticar gratidão', navigationParams: { source: 'microtasks', mode: 'quick' } },
        { id: 'kind-word', text: 'Repita uma frase gentil para você', icon: '🫂', category: 'vinculo', emotionalStates: ['ansioso', 'sensivel', 'inseguro'] },
    ],
    autocuidado: [
        { id: 'music-soft', text: 'Ouça uma música relaxante', icon: '🎵', category: 'autocuidado', emotionalStates: ['ansioso', 'sensivel', 'triste'], linkedTab: 'mixer', ctaLabel: 'Ouvir agora', navigationParams: { source: 'microtasks', mode: 'relax' } },
        { id: 'self-kindness', text: 'Faça 1 gesto de autocuidado gentil', icon: '💜', category: 'autocuidado', emotionalStates: ['sensivel', 'sem_energia', 'triste'] },
        { id: 'silence-minute', text: 'Respire por 1 minuto em silêncio', icon: '🫁', category: 'autocuidado', emotionalStates: ['ansioso', 'sobrecarregado', 'irritado'], linkedTab: 'breathing', ctaLabel: 'Silenciar e respirar', navigationParams: { source: 'microtasks', preset: 'silent-minute' } },
        { id: 'micro-action', text: 'Faça uma microação de 5 min', icon: '🌿', category: 'autocuidado', emotionalStates: ['travado', 'sobrecarregado', 'confuso', 'inseguro'], linkedTab: 'microtasks', ctaLabel: 'Voltar ao foco', navigationParams: { source: 'microtasks', focus: 'single-step' } },
    ],
};

const SPOTLIGHT_POOL: TaskTemplate[] = [
    { id: 'spotlight-breathe', text: 'Convite do dia: desacelere por 1 minuto', icon: '✨', category: 'autocuidado', emotionalStates: ['ansioso', 'sobrecarregado', 'irritado'], linkedTab: 'breathing', ctaLabel: 'Respirar agora', navigationParams: { source: 'microtasks', preset: 'one-minute-reset' }, isSpotlight: true },
    { id: 'spotlight-journal', text: 'Convite do dia: escreva uma frase honesta', icon: '🌙', category: 'mente', emotionalStates: ['sensivel', 'sobrecarregado', 'triste', 'confuso'], linkedTab: 'diary', ctaLabel: 'Escrever agora', navigationParams: { source: 'microtasks', prompt: 'O que preciso acolher hoje?' }, isSpotlight: true },
    { id: 'spotlight-body', text: 'Convite do dia: cuide do corpo antes de pensar em tudo', icon: '🍃', category: 'corpo', emotionalStates: ['travado', 'sem_energia', 'inseguro'], isSpotlight: true },
    { id: 'spotlight-window', text: 'Convite do dia: olhe o mundo lá fora por um minuto', icon: '🌤️', category: 'ambiente', emotionalStates: ['ansioso', 'sensivel', 'triste'], isSpotlight: true },
];

const CATEGORY_ORDER: TaskCategory[] = ['corpo', 'ambiente', 'mente', 'vinculo', 'autocuidado'];

const calmCelebrations = [
    'Boa. Uma pequena ação já muda o estado.',
    'Você não precisou fazer tudo. Só o próximo passo.',
    'Isso também conta como cuidado.',
    'Pequenos movimentos constroem segurança.',
];

const categoryLabels: Record<TaskCategory, string> = {
    corpo: 'corpo',
    ambiente: 'ambiente',
    mente: 'mente',
    vinculo: 'vínculo',
    autocuidado: 'autocuidado',
};

const categoryMeta: Record<
    TaskCategory,
    { label: string; icon: string; hint: string; chip: string; card: string; darkChip: string; darkCard: string }
> = {
    corpo: {
        label: 'Corpo',
        icon: '🫁',
        hint: 'água, respiração e movimento simples',
        chip: 'bg-sky-100 text-sky-700 border border-sky-200',
        darkChip: 'bg-sky-950/40 text-sky-300 border border-sky-900/60',
        card: 'bg-sky-50 border-sky-100',
        darkCard: 'bg-sky-950/20 border-sky-900/40',
    },
    ambiente: {
        label: 'Ambiente',
        icon: '🌤️',
        hint: 'organizar o redor para baixar o peso',
        chip: 'bg-amber-100 text-amber-700 border border-amber-200',
        darkChip: 'bg-amber-950/40 text-amber-300 border border-amber-900/60',
        card: 'bg-amber-50 border-amber-100',
        darkCard: 'bg-amber-950/20 border-amber-900/40',
    },
    mente: {
        label: 'Mente',
        icon: '🧠',
        hint: 'clareza e descarrego rápido',
        chip: 'bg-violet-100 text-violet-700 border border-violet-200',
        darkChip: 'bg-violet-950/40 text-violet-300 border border-violet-900/60',
        card: 'bg-violet-50 border-violet-100',
        darkCard: 'bg-violet-950/20 border-violet-900/40',
    },
    vinculo: {
        label: 'Vínculo',
        icon: '💛',
        hint: 'contato seguro e acolhimento',
        chip: 'bg-rose-100 text-rose-700 border border-rose-200',
        darkChip: 'bg-rose-950/40 text-rose-300 border border-rose-900/60',
        card: 'bg-rose-50 border-rose-100',
        darkCard: 'bg-rose-950/20 border-rose-900/40',
    },
    autocuidado: {
        label: 'Autocuidado',
        icon: '🌿',
        hint: 'gentileza e proteção do seu ritmo',
        chip: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        darkChip: 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/60',
        card: 'bg-emerald-50 border-emerald-100',
        darkCard: 'bg-emerald-950/20 border-emerald-900/40',
    },
};

const progressStages = [
    { emoji: '🌱', label: 'Começando', tone: 'from-slate-400 to-slate-500' },
    { emoji: '🙂', label: 'Entrando no ritmo', tone: 'from-emerald-400 to-emerald-500' },
    { emoji: '😊', label: 'Indo bem', tone: 'from-lime-400 to-emerald-500' },
    { emoji: '😄', label: 'Avançando', tone: 'from-amber-400 to-orange-500' },
    { emoji: '🥳', label: 'Dia completo', tone: 'from-pink-500 to-rose-500' },
];

const localDateKey = (date = new Date()) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getDaySeed = (today: string) => {
    return today.split('-').join('').split('').reduce((sum, digit) => sum + Number(digit), 0);
};

const pickFromList = <T,>(items: T[], seed: number) => {
    return items[seed % items.length];
};

const buildDailyTasks = (today: string) => {
    const seed = getDaySeed(today);
    const dailyTasks = CATEGORY_ORDER.map((category, categoryIndex) => {
        const tasks = TASK_GROUPS[category];
        const chosen = pickFromList(tasks, seed + categoryIndex * 7);
        return { ...chosen, completed: false };
    });

    const spotlight = pickFromList(SPOTLIGHT_POOL, seed * 3);
    return [{ ...spotlight, completed: false }, ...dailyTasks];
};

const getHistory = () => {
    if (typeof window === 'undefined') return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '{}') as Record<string, boolean>;
    } catch {
        return {};
    }
};

const getStreak = (history: Record<string, boolean>) => {
    let streak = 0;
    const cursor = new Date();
    while (true) {
        const key = localDateKey(cursor);
        if (!history[key]) break;
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
};

const CUSTOM_FEELING_KEYWORDS: Record<EmotionalState, string[]> = {
    travado: ['travado', 'paralis', 'bloque', 'empacado', 'sem sair do lugar'],
    ansioso: ['ansios', 'agonia', 'acelerad', 'aperto', 'pânico', 'panico', 'medo'],
    sem_energia: ['sem energia', 'cansad', 'exaust', 'esgotad', 'sono', 'desanimad'],
    sobrecarregado: ['sobrecarreg', 'muita coisa', 'pesado', 'pressão', 'pressao', 'sufocado'],
    sensivel: ['sensível', 'sensivel', 'fragil', 'vulner', 'emocionad'],
    triste: ['triste', 'desanimad', 'abatid', 'pra baixo', 'vazio'],
    irritado: ['irritad', 'com raiva', 'raiva', 'nervos', 'estressad'],
    confuso: ['confus', 'perdid', 'sem entender', 'embaralh', 'bagunç'],
    inseguro: ['insegur', 'incert', 'duvida', 'dúvida', 'insuficiente'],
};

const QUICK_AMBIENT_PRESETS = [
    { id: 'micro-calm', name: 'Calma Azul', icon: '🌊', mix: { mar1: 46, vento1: 22, riacho4: 18 } },
    { id: 'micro-night', name: 'Noite Serena', icon: '🌙', mix: { noite1: 34, grilo1: 20, vento2: 14 } },
    { id: 'micro-forest', name: 'Floresta Suave', icon: '🌿', mix: { floresta1: 40, riacho2: 22, passaro1: 16 } },
] as const;

const inferStatesFromCustomFeeling = (value: string): EmotionalState[] => {
    const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const scored = Object.entries(CUSTOM_FEELING_KEYWORDS)
        .map(([state, keywords]) => ({
            state: state as EmotionalState,
            score: keywords.reduce((sum, keyword) => sum + (normalized.includes(keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ? 1 : 0), 0),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return [];
    return scored.slice(0, 2).map((entry) => entry.state);
};

export default function MicroTasksSection({ darkMode: dm, onNavigate, onTaskComplete }: MicroTasksSectionProps) {
    const [tasks, setTasks] = useState<MicroTask[]>([]);
    const [isDifficultDay, setIsDifficultDay] = useState(false);
    const [selectedStates, setSelectedStates] = useState<EmotionalState[]>(['travado']);
    const [showCustomFeeling, setShowCustomFeeling] = useState(false);
    const [customFeelingText, setCustomFeelingText] = useState('');
    const [showCelebration, setShowCelebration] = useState(false);
    const [lastCompleted, setLastCompleted] = useState<string | null>(null);
    const [celebrationMessage, setCelebrationMessage] = useState(calmCelebrations[0]);
    const [history, setHistory] = useState<Record<string, boolean>>({});
    const [customTaskText, setCustomTaskText] = useState('');
    const [viewFilter, setViewFilter] = useState<TaskViewFilter>('recomendadas');
    const [activeInlineTaskId, setActiveInlineTaskId] = useState<string | null>(null);
    const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(60);
    const [breathingPhase, setBreathingPhase] = useState<'inspirar' | 'expirar'>('inspirar');
    const [quickMoodEmotion, setQuickMoodEmotion] = useState('');
    const [quickMoodIntensity, setQuickMoodIntensity] = useState(3);
    const [quickDiaryText, setQuickDiaryText] = useState('');
    const [quickGratitude, setQuickGratitude] = useState(['', '', '']);
    const [activeAmbientPresetId, setActiveAmbientPresetId] = useState<string | null>(null);
    const quickAmbientRefs = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.tasks);
        const savedMode = localStorage.getItem(STORAGE_KEYS.difficultDay);
        const savedDate = localStorage.getItem(STORAGE_KEYS.date);
        const savedStateRaw = localStorage.getItem(STORAGE_KEYS.emotionalState);
        const savedCustomFeeling = localStorage.getItem(STORAGE_KEYS.customFeeling);
        const today = localDateKey();
        const dailyTasks = buildDailyTasks(today);

        if (saved && savedDate === today) {
            setTasks(JSON.parse(saved));
        } else {
            setTasks(dailyTasks);
            localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(dailyTasks));
            localStorage.setItem(STORAGE_KEYS.date, today);
        }

        if (savedMode) setIsDifficultDay(JSON.parse(savedMode));
        if (savedStateRaw) {
            try {
                const parsed = JSON.parse(savedStateRaw);
                if (Array.isArray(parsed)) {
                    const validStates = parsed.filter((item): item is EmotionalState =>
                        EMOTIONAL_PROFILES.some((profile) => profile.id === item)
                    );
                    if (validStates.length) {
                        setSelectedStates(validStates);
                    }
                } else if (typeof parsed === 'string' && EMOTIONAL_PROFILES.some((profile) => profile.id === parsed)) {
                    setSelectedStates([parsed as EmotionalState]);
                }
            } catch {
                if (EMOTIONAL_PROFILES.some((profile) => profile.id === savedStateRaw)) {
                    setSelectedStates([savedStateRaw as EmotionalState]);
                }
            }
        }
        if (savedCustomFeeling) {
            setCustomFeelingText(savedCustomFeeling);
            setShowCustomFeeling(true);
        }
        setHistory(getHistory());
    }, []);

    useEffect(() => {
        if (tasks.length > 0) {
            localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
            localStorage.setItem(STORAGE_KEYS.date, localDateKey());

            const today = localDateKey();
            const hasDoneAny = tasks.some((task) => task.completed);
            const nextHistory = { ...history };
            if (hasDoneAny) {
                nextHistory[today] = true;
            } else if (nextHistory[today]) {
                delete nextHistory[today];
            }
            setHistory(nextHistory);
            localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(nextHistory));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.difficultDay, JSON.stringify(isDifficultDay));
    }, [isDifficultDay]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.emotionalState, JSON.stringify(selectedStates));
    }, [selectedStates]);

    useEffect(() => {
        if (customFeelingText.trim()) {
            localStorage.setItem(STORAGE_KEYS.customFeeling, customFeelingText.trim());
        } else {
            localStorage.removeItem(STORAGE_KEYS.customFeeling);
        }
    }, [customFeelingText]);

    useEffect(() => {
        if (!activeInlineTaskId || !activeInlineTaskId.startsWith('breathing')) return;
        if (breathingSecondsLeft <= 0) return;
        const timer = window.setTimeout(() => {
            setBreathingSecondsLeft((prev) => Math.max(0, prev - 1));
            setBreathingPhase((prev) => (prev === 'inspirar' ? 'expirar' : 'inspirar'));
        }, 1000);
        return () => window.clearTimeout(timer);
    }, [activeInlineTaskId, breathingSecondsLeft]);

    useEffect(() => {
        return () => {
            Object.values(quickAmbientRefs.current).forEach((audio) => {
                audio.pause();
                audio.currentTime = 0;
            });
        };
    }, []);

    const inferredCustomStates = useMemo(() => inferStatesFromCustomFeeling(customFeelingText), [customFeelingText]);
    const activeStateIds = useMemo(
        () => (selectedStates.length > 0 ? selectedStates : inferredCustomStates),
        [selectedStates, inferredCustomStates]
    );
    const activeProfiles = useMemo(
        () => activeStateIds.map((id) => EMOTIONAL_PROFILES.find((item) => item.id === id)).filter(Boolean) as typeof EMOTIONAL_PROFILES,
        [activeStateIds]
    );
    const profile = useMemo(
        () => activeProfiles[0] || EMOTIONAL_PROFILES[0],
        [activeProfiles]
    );
    const directionSummary = useMemo(() => {
        if (selectedStates.length > 1) {
            return `Você marcou ${activeProfiles.map((item) => item.label).join(', ')}. Vamos priorizar pequenas ações que reduzam carga e devolvam mais chão agora.`;
        }
        if (selectedStates.length === 1) {
            return activeProfiles[0]?.support || EMOTIONAL_PROFILES[0].support;
        }
        if (showCustomFeeling && customFeelingText.trim()) {
            if (activeProfiles.length > 0) {
                return `Pelo que você descreveu, isso se aproxima de ${activeProfiles.map((item) => item.label).join(' e ')}. Vamos usar a sugestão mais próxima para este momento.`;
            }
            return 'Vamos usar uma direção mais gentil e simples: reduzir carga, escolher uma ação pequena e voltar ao corpo primeiro.';
        }
        return EMOTIONAL_PROFILES[0].support;
    }, [activeProfiles, customFeelingText, selectedStates, showCustomFeeling]);

    const c = (base: string, dark: string) => (dm ? dark : base);
    const doneCount = tasks.filter((task) => task.completed).length;
    const totalCount = tasks.length;
    const dayPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
    const streak = useMemo(() => getStreak(history), [history]);
    const progressIndex = totalCount > 0 ? Math.min(progressStages.length - 1, Math.floor((doneCount / Math.max(totalCount, 1)) * progressStages.length)) : 0;
    const progressStage = doneCount >= totalCount && totalCount > 0 ? progressStages[progressStages.length - 1] : progressStages[progressIndex];
    const todaySeed = useMemo(() => getDaySeed(localDateKey()), []);

    const priorityTaskIds = useMemo(
        () => Array.from(new Set(activeProfiles.flatMap((item) => item.priorityTaskIds))),
        [activeProfiles]
    );
    const recommendedTasks = useMemo(() => {
        const matched = tasks.filter((task) => task.emotionalStates.some((state) => activeStateIds.includes(state)));
        return (matched.length ? matched : tasks).slice(0, 3);
    }, [activeStateIds, tasks]);

    const essentialTasks = useMemo(() => {
        const prioritized = priorityTaskIds
            .map((id) => tasks.find((task) => task.id === id))
            .filter((task): task is MicroTask => Boolean(task));
        const source = prioritized.length ? prioritized : recommendedTasks.length ? recommendedTasks : tasks;
        if (source.length <= 3) return source;
        const startIndex = todaySeed % source.length;
        const rotated = [...source.slice(startIndex), ...source.slice(0, startIndex)];
        return rotated.slice(0, 3);
    }, [priorityTaskIds, recommendedTasks, tasks, todaySeed]);

    const difficultDone = useMemo(() => essentialTasks.filter((task) => task.completed).length, [essentialTasks]);
    const visibleTasks = isDifficultDay ? essentialTasks : tasks;
    const completedTasks = visibleTasks.filter((task) => task.completed);
    const filteredVisibleTasks = useMemo(() => {
        if (isDifficultDay) return essentialTasks;
        if (viewFilter === 'recomendadas') return recommendedTasks;
        if (viewFilter === 'todas') return visibleTasks;
        if (viewFilter === 'essenciais') return essentialTasks;
        if (viewFilter === 'concluidas') return completedTasks;
        return visibleTasks.filter((task) => task.category === viewFilter);
    }, [completedTasks, essentialTasks, isDifficultDay, recommendedTasks, viewFilter, visibleTasks]);
    const pendingTasks = filteredVisibleTasks.filter((task) => !task.completed);
    const availableCategories = useMemo(
        () =>
            CATEGORY_ORDER.filter((category) =>
                visibleTasks.some((task) => task.category === category)
            ),
        [visibleTasks]
    );
    const groupedPendingTasks = useMemo(
        () =>
            CATEGORY_ORDER.map((category) => ({
                category,
                tasks: pendingTasks.filter((task) => task.category === category),
            })).filter((group) => group.tasks.length > 0),
        [pendingTasks]
    );

    const triggerCalmCelebration = (taskText: string, durationMs = 2200) => {
        const nextMessage = calmCelebrations[(taskText.length + doneCount) % calmCelebrations.length];
        setLastCompleted(taskText);
        setCelebrationMessage(nextMessage);
        setShowCelebration(true);
        window.setTimeout(() => setShowCelebration(false), durationMs);
    };

    const updateTaskCompletion = (taskId: string, completed: boolean) => {
        setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? { ...task, completed } : task))
        );
    };

    const toggleTask = (id: string) => {
        const task = tasks.find((item) => item.id === id);
        if (!task) return;
        if (!task.completed) {
            triggerCalmCelebration(task.text);
            onTaskComplete?.();
        }
        updateTaskCompletion(id, !task.completed);
    };

    const toggleDifficultDay = () => setIsDifficultDay((prev) => !prev);

    const resetTasks = () => {
        setTasks((prev) => prev.map((task) => ({ ...task, completed: false })));
    };

    const markMinimumDone = () => {
        setTasks((prev) =>
            prev.map((task) =>
                priorityTaskIds.includes(task.id) ? { ...task, completed: true } : task
            )
        );
        triggerCalmCelebration('Você fez o mínimo de hoje', 7000);
    };

    const chooseOneForMe = () => {
        const nextTask = essentialTasks.find((task) => !task.completed) || visibleTasks.find((task) => !task.completed);
        if (!nextTask) return;
        updateTaskCompletion(nextTask.id, true);
        triggerCalmCelebration(`Só por agora: ${nextTask.text}`, 8000);
    };

    const addCustomTask = () => {
        const trimmed = customTaskText.trim();
        if (!trimmed) return;

        const newTask: MicroTask = {
            id: `custom-${Date.now()}`,
            text: trimmed,
            icon: '✍️',
            completed: false,
            category: 'autocuidado',
            emotionalStates: activeStateIds.length ? activeStateIds : [profile.id],
        };

        setTasks((prev) => {
            const spotlightCount = prev.filter((task) => task.isSpotlight).length;
            const insertAt = spotlightCount > 0 ? spotlightCount : 0;
            return [...prev.slice(0, insertAt), newTask, ...prev.slice(insertAt)];
        });
        setCustomTaskText('');
        triggerCalmCelebration('Você criou uma microtarefa sua');
    };

    const streakMessage =
        streak > 1
            ? `${streak} dias cuidando de si. Isso também conta.`
            : streak === 1
              ? 'Hoje você já marcou presença por você.'
              : 'Uma microação hoje já pode iniciar sua sequência.';

    const activeFilterLabel =
        viewFilter === 'recomendadas'
            ? 'Recomendadas para agora'
            : viewFilter === 'todas'
              ? 'Todas as tarefas do dia'
              : viewFilter === 'essenciais'
                ? 'Essenciais do momento'
                : viewFilter === 'concluidas'
                  ? 'Concluídas'
              : categoryMeta[viewFilter].label;

    const renderTaskCard = (task: MicroTask, compact = false) => {
        const meta = categoryMeta[task.category];
        return (
            <div
                key={task.id}
                className={`w-full rounded-[1.8rem] border transition-all ${
                    task.completed
                        ? c('bg-emerald-50 border-emerald-200 opacity-80', 'bg-emerald-900/10 border-emerald-800/30 opacity-80')
                        : compact
                          ? c(`${meta.card} shadow-sm`, `${meta.darkCard} shadow-sm`)
                          : c('bg-white border-gray-100 shadow-sm', 'bg-slate-800/80 border-slate-700 shadow-sm')
                }`}
            >
                <div className="flex items-stretch gap-3 p-4">
                    <button onClick={() => toggleTask(task.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${task.completed ? c('bg-emerald-100', 'bg-emerald-900/30') : c('bg-white/70', 'bg-slate-900/60')}`}>
                            <span className={`text-2xl ${task.completed ? 'grayscale' : ''}`}>{task.completed ? '✅' : task.icon}</span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`font-bold block ${task.completed ? 'line-through opacity-70' : ''}`}>{task.text}</span>
                                {task.isSpotlight && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-900/40 text-indigo-300')}`}>
                                        foco do dia
                                    </span>
                                )}
                            </div>
                            <p className={`text-[11px] mt-1 block ${c('text-slate-500', 'text-slate-400')}`}>{meta.label} • {meta.hint}</p>
                        </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                        <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-black ${
                                task.completed
                                    ? c('bg-emerald-100 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')
                                    : c('bg-white text-emerald-700 border border-emerald-200', 'bg-slate-950 text-emerald-300 border border-emerald-900/50')
                            }`}
                        >
                            {task.completed ? 'Feita' : 'Concluir'}
                        </button>
                        {task.linkedTab && (
                            <>
                                {canOpenInline(task.linkedTab) && (
                                    <button
                                        type="button"
                                        onClick={() => toggleInlineTask(task.id, task.linkedTab)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeInlineTaskId === task.id ? 'bg-violet-600 text-white' : c('bg-violet-100 text-violet-700', 'bg-violet-900/30 text-violet-300')}`}
                                    >
                                        {activeInlineTaskId === task.id ? 'Fechar aqui' : 'Abrir aqui'}
                                    </button>
                                )}
                                <button
                                    onClick={() => onNavigate?.(task.linkedTab as any, task.navigationParams || { source: 'microtasks', taskId: task.id })}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-900/30 text-indigo-300')}`}
                                >
                                    {task.ctaLabel || 'Abrir'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {renderInlineTaskPanel(task)}
            </div>
        );
    };

    const handleSelectProfile = (state: EmotionalState) => {
        setSelectedStates((prev) =>
            prev.includes(state)
                ? prev.filter((item) => item !== state)
                : [...prev, state]
        );
    };

    const toggleCustomFeeling = () => {
        setShowCustomFeeling((prev) => {
            const next = !prev;
            if (!next) {
                setCustomFeelingText('');
            }
            return next;
        });
    };

    const canOpenInline = (linkedTab?: string): linkedTab is InlineActionTab =>
        Boolean(linkedTab && ['breathing', 'sos', 'mood', 'diary', 'gratitude', 'mixer'].includes(linkedTab));

    const stopQuickAmbient = () => {
        Object.values(quickAmbientRefs.current).forEach((audio) => {
            audio.pause();
            audio.currentTime = 0;
        });
        setActiveAmbientPresetId(null);
    };

    const playQuickAmbientPreset = (presetId: string, mix: Record<string, number>) => {
        if (activeAmbientPresetId === presetId) {
            stopQuickAmbient();
            return;
        }
        stopQuickAmbient();
        Object.entries(mix).forEach(([id, volume]) => {
            const track = natureMixerTracks.find((item) => item.id === id);
            if (!track || volume <= 0) return;
            const audio = new Audio(encodeURI(track.src));
            audio.loop = true;
            audio.volume = volume / 100;
            quickAmbientRefs.current[`${presetId}-${id}`] = audio;
            audio.play().catch(() => {});
        });
        setActiveAmbientPresetId(presetId);
    };

    const toggleInlineTask = (taskId: string, linkedTab?: string) => {
        if (!canOpenInline(linkedTab)) return;
        setActiveInlineTaskId((prev) => {
            const next = prev === taskId ? null : taskId;
            if (linkedTab === 'breathing') {
                setBreathingSecondsLeft(60);
                setBreathingPhase('inspirar');
            }
            if (prev === taskId) {
                stopQuickAmbient();
            }
            return next;
        });
    };

    const renderInlineTaskPanel = (task: MicroTask) => {
        if (activeInlineTaskId !== task.id || !canOpenInline(task.linkedTab)) return null;

        if (task.linkedTab === 'breathing') {
            return (
                <div className={`mx-4 mb-4 rounded-[1.5rem] border p-4 ${c('bg-sky-50 border-sky-100', 'bg-sky-950/20 border-sky-900/40')}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-500">Respiração agora</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-lg font-black">{breathingPhase === 'inspirar' ? 'Inspire' : 'Expire'}</p>
                            <p className={`text-sm font-medium ${c('text-slate-600', 'text-slate-300')}`}>Siga o ritmo por 1 minuto sem sair da tela.</p>
                        </div>
                        <div className="rounded-2xl bg-sky-500 px-4 py-3 text-center text-white">
                            <p className="text-2xl font-black leading-none">{breathingSecondsLeft}s</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (task.linkedTab === 'sos') {
            return (
                <div className={`mx-4 mb-4 rounded-[1.5rem] border p-4 ${c('bg-rose-50 border-rose-100', 'bg-rose-950/20 border-rose-900/40')}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rose-500">Grounding 5-4-3-2-1</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm font-semibold">
                        {['5 coisas que você vê', '4 coisas que você toca', '3 sons que você escuta', '2 cheiros que percebe', '1 coisa que precisa agora'].map((item) => (
                            <div key={item} className={`rounded-xl px-3 py-3 ${c('bg-white text-slate-700', 'bg-slate-900/60 text-slate-200')}`}>{item}</div>
                        ))}
                    </div>
                </div>
            );
        }

        if (task.linkedTab === 'mood') {
            return (
                <div className={`mx-4 mb-4 rounded-[1.5rem] border p-4 ${c('bg-indigo-50 border-indigo-100', 'bg-indigo-950/20 border-indigo-900/40')}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-500">Check-in rápido</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {['Ansiedade', 'Tristeza', 'Raiva', 'Cansaço', 'Alívio', 'Confusão'].map((emotion) => (
                            <button
                                key={emotion}
                                type="button"
                                onClick={() => setQuickMoodEmotion(emotion)}
                                className={`rounded-full px-3 py-2 text-xs font-black ${quickMoodEmotion === emotion ? 'bg-indigo-600 text-white' : c('bg-white text-slate-700 border border-indigo-100', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
                            >
                                {emotion}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4">
                        <p className={`text-xs font-black uppercase tracking-[0.14em] ${c('text-slate-500', 'text-slate-400')}`}>Intensidade</p>
                        <input type="range" min="1" max="5" value={quickMoodIntensity} onChange={(e) => setQuickMoodIntensity(Number(e.target.value))} className="mt-2 w-full" />
                    </div>
                </div>
            );
        }

        if (task.linkedTab === 'diary') {
            return (
                <div className={`mx-4 mb-4 rounded-[1.5rem] border p-4 ${c('bg-violet-50 border-violet-100', 'bg-violet-950/20 border-violet-900/40')}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">Escreva agora</p>
                    <textarea
                        value={quickDiaryText}
                        onChange={(e) => setQuickDiaryText(e.target.value)}
                        rows={3}
                        placeholder={(task.navigationParams?.prompt as string) || 'Escreva uma frase honesta sobre o que está sentindo.'}
                        className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${c('bg-white border-violet-100 text-slate-900 placeholder:text-slate-400', 'bg-slate-900 border-violet-900/40 text-slate-100 placeholder:text-slate-500')}`}
                    />
                </div>
            );
        }

        if (task.linkedTab === 'gratitude') {
            return (
                <div className={`mx-4 mb-4 rounded-[1.5rem] border p-4 ${c('bg-amber-50 border-amber-100', 'bg-amber-950/20 border-amber-900/40')}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-500">Gratidão rápida</p>
                    <div className="mt-3 space-y-2">
                        {quickGratitude.map((value, index) => (
                            <input
                                key={`gratitude-${index}`}
                                type="text"
                                value={value}
                                onChange={(e) => setQuickGratitude((prev) => prev.map((item, itemIndex) => itemIndex === index ? e.target.value : item))}
                                placeholder={`Gratidão ${index + 1}`}
                                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${c('bg-white border-amber-100 text-slate-900 placeholder:text-slate-400', 'bg-slate-900 border-amber-900/40 text-slate-100 placeholder:text-slate-500')}`}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        if (task.linkedTab === 'mixer') {
            return (
                <div className={`mx-4 mb-4 rounded-[1.5rem] border p-4 ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-950/20 border-emerald-900/40')}`}>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-500">Ambiente sonoro</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {QUICK_AMBIENT_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => playQuickAmbientPreset(preset.id, preset.mix)}
                                className={`rounded-2xl border px-3 py-3 text-left text-sm font-black ${activeAmbientPresetId === preset.id ? 'bg-emerald-600 text-white border-emerald-400' : c('bg-white text-slate-700 border-emerald-100', 'bg-slate-900 text-slate-200 border-slate-700')}`}
                            >
                                <span className="text-lg">{preset.icon}</span>
                                <div className="mt-2">{preset.name}</div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <div className="pt-4 mb-6">
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="Vitórias pequenas"
                    title="Microtarefas"
                    description={profile.intro}
                    icon="🌿"
                >
                    <div className="flex flex-wrap gap-2">
                        <div className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${c('bg-emerald-50 text-emerald-700 border border-emerald-100', 'bg-emerald-950/35 text-emerald-300 border border-emerald-900/50')}`}>
                            {doneCount}/{totalCount} hoje
                        </div>
                        <div className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${c('bg-indigo-50 text-indigo-700 border border-indigo-100', 'bg-indigo-950/35 text-indigo-300 border border-indigo-900/50')}`}>
                            sequência {streak}
                        </div>
                        <div className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${c('bg-white/80 text-slate-700 border border-slate-200', 'bg-white/5 text-slate-200 border border-white/10')}`}>
                            {showCustomFeeling && customFeelingText.trim()
                                ? '✍️ Outros'
                                : `${profile.emoji} ${activeProfiles[0]?.label || profile.label}`}
                        </div>
                    </div>
                </SectionHeroCard>
            </div>

            <div className={`rounded-3xl p-5 mb-6 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Progresso de hoje</p>
                        <p className={`mt-2 text-base font-black tracking-tight ${c('text-slate-900', 'text-slate-100')}`}>{progressStage.label}</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <div className={`min-w-[92px] rounded-2xl px-3 py-2 text-white bg-gradient-to-r ${progressStage.tone} shadow-lg`}>
                                <p className="text-lg font-black leading-none tracking-tight">{doneCount}/{totalCount}</p>
                                <p className="text-[10px] font-black uppercase tracking-wider opacity-90 mt-1">{progressStage.label}</p>
                            </div>
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${progressStage.tone} shadow-lg ${doneCount > 0 ? 'scale-105' : ''}`}>
                                <span className={doneCount >= totalCount && totalCount > 0 ? 'animate-pulse' : ''}>{progressStage.emoji}</span>
                            </div>
                        </div>
                        <p className={`text-xs font-semibold mt-2 ${c('text-emerald-700', 'text-emerald-300')}`}>Sequência: {streak} dia{streak === 1 ? '' : 's'}</p>
                    </div>
                </div>
                <div className={`h-2.5 rounded-full mt-4 ${c('bg-slate-100', 'bg-slate-700')}`}>
                    <div className="h-2.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${dayPct}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className={`rounded-2xl px-3 py-3 ${c('bg-slate-50', 'bg-slate-900/70 border border-slate-700')}`}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Conclusão</p>
                        <p className="mt-1 text-lg font-black">{dayPct}%</p>
                    </div>
                    <div className={`rounded-2xl px-3 py-3 ${c('bg-slate-50', 'bg-slate-900/70 border border-slate-700')}`}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Feitas</p>
                        <p className="mt-1 text-lg font-black">{doneCount}</p>
                    </div>
                    <div className={`rounded-2xl px-3 py-3 ${c('bg-slate-50', 'bg-slate-900/70 border border-slate-700')}`}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Ritmo</p>
                        <p className="mt-1 text-lg font-black">{streak}</p>
                    </div>
                </div>
                <p className={`text-sm mt-3 font-medium leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{streakMessage}</p>
            </div>

            <div className={`rounded-3xl p-5 mb-6 border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">{profile.emoji}</span>
                    <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Check-in rápido</p>
                        <h3 className="font-bold mt-1">Como você está agora?</h3>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3">
                    {EMOTIONAL_PROFILES.map((item) => {
                        const isActive = selectedStates.includes(item.id);
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectProfile(item.id)}
                                className={`min-h-[52px] px-3 py-2 rounded-2xl text-xs font-black leading-tight transition-all ${
                                    isActive
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                        : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')
                                }`}
                            >
                                {item.emoji} {item.label}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={toggleCustomFeeling}
                        className={`px-3 py-2 rounded-2xl text-xs font-black transition-all ${
                            showCustomFeeling
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')
                        }`}
                    >
                        ✍️ Outros
                    </button>
                </div>
                {showCustomFeeling && (
                    <div className={`mb-4 rounded-2xl border p-3 ${c('bg-violet-50 border-violet-100', 'bg-violet-950/20 border-violet-900/40')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-violet-700', 'text-violet-300')}`}>Escreva do seu jeito</p>
                        <input
                            type="text"
                            value={customFeelingText}
                            onChange={(e) => setCustomFeelingText(e.target.value)}
                            placeholder="Ex.: frustrado, esgotada, com medo, culpado..."
                            className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${c('bg-white border-violet-100 text-slate-900 placeholder:text-slate-400', 'bg-slate-900 border-violet-900/40 text-slate-100 placeholder:text-slate-500')}`}
                        />
                    </div>
                )}
                <div className={`rounded-2xl p-4 ${c('bg-emerald-50 text-emerald-900', 'bg-emerald-900/20 text-emerald-100 border border-emerald-800/40')}`}>
                    <p className="text-xs font-black uppercase tracking-wider mb-1">Direção do momento</p>
                    <p className="text-sm font-semibold">{directionSummary}</p>
                    {showCustomFeeling && customFeelingText.trim() && (
                        <p className={`mt-2 text-xs font-semibold ${c('text-violet-700', 'text-violet-200')}`}>
                            Você descreveu este momento como: "{customFeelingText.trim()}".
                        </p>
                    )}
                </div>
            </div>

            <div className={`rounded-3xl p-6 mb-6 border transition-all ${isDifficultDay ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="flex items-center justify-between gap-3" role="group" aria-label="Alternar modo dia difícil">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{isDifficultDay ? '⛈️' : '🌤️'}</span>
                        <div>
                            <h3 className="font-bold">Modo "Dia Difícil"</h3>
                            <p className="text-xs opacity-70">Hoje o objetivo não é render, e sim se manter.</p>
                        </div>
                    </div>
                    <button type="button" onClick={toggleDifficultDay} className={`w-20 h-9 rounded-full relative transition-all duration-300 font-black text-[10px] tracking-wider uppercase ${isDifficultDay ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200'}`} aria-pressed={isDifficultDay}>
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">{isDifficultDay ? 'ON' : 'OFF'}</span>
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${isDifficultDay ? 'left-12' : 'left-1'}`} />
                    </button>
                </div>
                {isDifficultDay && (
                    <div className="mt-4 space-y-3">
                        <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <p className="text-xs font-extrabold text-red-700 dark:text-red-300 uppercase tracking-wider">Modo Dia Difícil ativo</p>
                            <p className="text-sm font-semibold mt-2 opacity-90">Você fez {difficultDone}/{essentialTasks.length} do essencial. E o mínimo também conta.</p>
                            <button onClick={markMinimumDone} className="mt-3 w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-black">Fiz o mínimo de hoje</button>
                            <button onClick={chooseOneForMe} className="mt-2 w-full py-2.5 rounded-xl bg-white/80 text-red-700 text-xs font-black border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800">Não consigo escolher</button>
                        </div>
                        <div className={`rounded-2xl p-4 ${c('bg-white border border-red-100', 'bg-slate-900/70 border border-red-900/40')}`}>
                            <p className="text-xs font-black uppercase tracking-wider mb-2 text-red-500">Versão ultra mínima</p>
                            <div className="space-y-2">
                                {profile.ultraMinimal.map((item) => (
                                    <div key={item} className={`rounded-xl px-3 py-2 text-sm font-semibold ${c('bg-red-50 text-red-900', 'bg-red-950/30 text-red-100')}`}>{item}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`rounded-3xl p-5 mb-6 border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Recomendadas</p>
                        <h3 className="font-bold mt-1">Microtarefas para este momento</h3>
                    </div>
                </div>
                <div className={`rounded-2xl p-3 mb-4 ${c('bg-indigo-50 border border-indigo-100 text-indigo-900', 'bg-indigo-950/30 border border-indigo-900/40 text-indigo-100')}`}>
                    <p className="text-xs font-black uppercase tracking-wider mb-1">Ligado ao seu estado atual</p>
                    <p className="text-sm font-semibold">
                        {activeProfiles.length > 0
                            ? <>Como você marcou <span className="underline decoration-dotted underline-offset-2">{activeProfiles.map((item) => item.label).join(', ')}</span>, estas são as microtarefas mais coerentes para agora.</>
                            : <>Estas são as microtarefas mais coerentes para este momento.</>}
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {recommendedTasks.map((task) => (
                        renderTaskCard(task, true)
                    ))}
                </div>
            </div>

            {!isDifficultDay && (
                <div className={`rounded-3xl p-5 mb-6 border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Filtro</p>
                            <h3 className="font-bold mt-1">Ver do jeito que te ajuda mais</h3>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${c('bg-slate-100 text-slate-600', 'bg-slate-900 text-slate-300 border border-slate-700')}`}>
                            {activeFilterLabel}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setViewFilter('recomendadas')}
                            className={`px-3 py-2 rounded-2xl text-xs font-black ${viewFilter === 'recomendadas' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
                        >
                            ✨ Recomendadas
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewFilter('todas')}
                            className={`px-3 py-2 rounded-2xl text-xs font-black ${viewFilter === 'todas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
                        >
                            Todas
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewFilter('essenciais')}
                            className={`px-3 py-2 rounded-2xl text-xs font-black ${viewFilter === 'essenciais' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
                        >
                            Essenciais
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewFilter('concluidas')}
                            className={`px-3 py-2 rounded-2xl text-xs font-black ${viewFilter === 'concluidas' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
                        >
                            Concluídas
                        </button>
                        {availableCategories.map((category) => {
                            const meta = categoryMeta[category];
                            const active = viewFilter === category;
                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setViewFilter(category)}
                                    className={`px-3 py-2 rounded-2xl text-xs font-black ${active ? c(meta.chip, meta.darkChip) : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
                                >
                                    {meta.icon} {meta.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className={`rounded-3xl p-5 mb-6 border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">✍️</span>
                    <div>
                        <h3 className="font-bold">Criar minha microtarefa</h3>
                        <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>Se hoje você precisa de algo mais específico, transforme isso em um passo pequeno e concreto.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customTaskText}
                        onChange={(e) => setCustomTaskText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') addCustomTask();
                        }}
                        placeholder="Ex.: guardar 3 roupas, tomar banho, abrir um arquivo"
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm border outline-none ${c('bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400', 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500')}`}
                    />
                    <button
                        type="button"
                        onClick={addCustomTask}
                        className="px-4 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-500/20"
                    >
                        Adicionar
                    </button>
                </div>
            </div>

            <div className={`space-y-5 mb-8 ${isDifficultDay ? 'ring-2 ring-red-400/60 rounded-3xl p-2' : ''}`}>
                {groupedPendingTasks.map((group) => {
                    const meta = categoryMeta[group.category];
                    return (
                        <div key={group.category} className={`rounded-3xl border p-4 ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                    <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${c(meta.chip, meta.darkChip)}`}>
                                        {meta.icon} {meta.label}
                                    </p>
                                    <p className={`text-sm font-semibold mt-3 ${c('text-slate-600', 'text-slate-300')}`}>{meta.hint}</p>
                                </div>
                                <div className={`rounded-2xl px-3 py-2 text-center ${c('bg-slate-50', 'bg-slate-900/70 border border-slate-700')}`}>
                                    <p className="text-sm font-black">{group.tasks.length}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>tarefas</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {group.tasks.map((task) => renderTaskCard(task))}
                            </div>
                        </div>
                    );
                })}
                {pendingTasks.length === 0 && (
                    <div className={`rounded-3xl border p-5 text-center ${c('bg-emerald-50 border-emerald-100 text-emerald-900', 'bg-emerald-950/20 border-emerald-900/40 text-emerald-100')}`}>
                        <p className="text-sm font-black">Nada pendente nesta visualização.</p>
                        <p className="text-xs mt-2 opacity-80">Você pode trocar o filtro acima ou seguir para as concluídas.</p>
                    </div>
                )}
            </div>

            {completedTasks.length > 0 && (
                <div className={`rounded-3xl p-5 mb-8 border ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-950/20 border-emerald-900/40')}`}>
                    <div className="mb-4">
                        <h3 className={`font-bold ${c('text-emerald-900', 'text-emerald-200')}`}>Já feitas hoje</h3>
                        <p className={`text-xs mt-1 ${c('text-emerald-700', 'text-emerald-300')}`}>Estas tarefas já foram concluídas.</p>
                    </div>
                    <div className="space-y-3">
                        {completedTasks.map((task) => (
                            renderTaskCard(task, true)
                        ))}
                    </div>
                </div>
            )}

            {showCelebration && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center p-6 bg-white/95 dark:bg-slate-800/95 rounded-[2.2rem] shadow-2xl border border-emerald-200 dark:border-emerald-900 max-w-[320px]">
                    <span className="text-4xl mb-3 block">🌿</span>
                    <h4 className="text-lg font-black text-emerald-700 dark:text-emerald-300 mb-1">Boa.</h4>
                    <p className="font-semibold opacity-90">{celebrationMessage}</p>
                    {lastCompleted && <p className="text-xs mt-2 opacity-70">Último passo: {lastCompleted}</p>}
                </div>
            )}

            <div className="text-center">
                <button onClick={resetTasks} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">Reiniciar tarefas do dia</button>
            </div>
        </div>
    );
}
