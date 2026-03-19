'use client';

import { useEffect, useMemo, useState } from 'react';
import SectionHeroCard from './SectionHeroCard';

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

interface ThoughtRecord {
    id: string;
    date: string;
    time: string;
    situation: string;
    automaticThought: string;
    emotion: string;
    emotionLevel: number;
    evidenceFor: string;
    evidenceAgainst: string;
    alternativeThought: string;
    newEmotionLevel: number;
    createdAt: string;
}

interface UnifiedDiarySectionProps {
    diaryEntries: EmotionEntry[];
    setDiaryEntries: (value: EmotionEntry[]) => void;
    thoughtRecords: ThoughtRecord[];
    setThoughtRecords: (value: ThoughtRecord[]) => void;
    darkMode?: boolean;
    desktopMode?: boolean;
    initialMode?: 'list' | 'quick' | 'full';
    initialDraft?: string;
    initialDraftKey?: string | number;
    onModeChange?: (mode: 'list' | 'quick' | 'full') => void;
    onNavigate?: (tab: 'solta' | 'gratitude' | 'breathing', params?: Record<string, any>) => void;
}

type EntryType = 'quick' | 'full';
type FullStep = 0 | 1 | 2 | 3 | 4 | 5;

const emotionOptions = [
    { label: 'Ansiedade', emoji: '😰' },
    { label: 'Tristeza', emoji: '😢' },
    { label: 'Raiva', emoji: '😠' },
    { label: 'Medo', emoji: '😨' },
    { label: 'Alegria', emoji: '😊' },
    { label: 'Frustração', emoji: '😤' },
    { label: 'Vergonha', emoji: '😳' },
    { label: 'Culpa', emoji: '😔' },
    { label: 'Solidão', emoji: '🥺' },
    { label: 'Esperança', emoji: '🌟' },
    { label: 'Gratidão', emoji: '🙏' },
    { label: 'Amor', emoji: '❤️' },
    { label: 'Outra', emoji: '💭' },
];

const fullFlowSteps: Array<{ title: string; hint: string }> = [
    { title: 'Situação', hint: 'O que aconteceu nesse momento?' },
    { title: 'Pensamento', hint: 'O que passou pela sua mente?' },
    { title: 'Emoção', hint: 'Nomeie a emoção e a intensidade.' },
    { title: 'Evidências', hint: 'Olhe para os fatos dos dois lados.' },
    { title: 'Leitura alternativa', hint: 'Encontre uma leitura mais justa.' },
    { title: 'Reavaliação', hint: 'Perceba como você fica depois.' },
];

const evidenceForExamples = ['Ela não respondeu.', 'Cometi um erro.', 'Fiquei sem reação.'];
const evidenceAgainstExamples = ['Isso já aconteceu antes e passou.', 'Não tenho todas as informações.', 'Um erro não define tudo.'];
const alternativeThoughtExamples = ['Pode ser desconfortável, mas isso não prova que sou incapaz.', 'Posso olhar para isso com mais calma.', 'Talvez eu esteja vendo só uma parte da situação.'];

function getEmoji(emotionName: string) {
    return emotionOptions.find((emotion) => emotion.label === emotionName)?.emoji || '💭';
}

function getLevelColor(level: number) {
    if (level <= 3) return 'text-green-600';
    if (level <= 6) return 'text-yellow-600';
    return 'text-red-600';
}

function getLevelLabel(level: number) {
    if (level === 0) return 'Nenhuma';
    if (level <= 2) return 'Leve';
    if (level <= 4) return 'Presente';
    if (level <= 6) return 'Considerável';
    if (level <= 8) return 'Forte';
    return 'Muito intensa';
}

function getLevelReading(level: number) {
    if (level <= 2) return 'Está mais ao fundo e ainda parece bem regulável.';
    if (level <= 4) return 'Está presente, mas você ainda consegue observar com alguma distância.';
    if (level <= 6) return 'Tem peso real agora, mas já dá para começar a organizar.';
    if (level <= 8) return 'Está forte, mas ainda regulável com pausa e cuidado.';
    return 'Está muito intensa agora. Vale ir devagar e com gentileza.';
}

function formatDate(date: string) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
}

function summarizeText(text: string, max = 96) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

export default function UnifiedDiarySection({
    diaryEntries,
    setDiaryEntries,
    thoughtRecords,
    setThoughtRecords,
    darkMode: dm,
    desktopMode = false,
    initialMode,
    initialDraft,
    initialDraftKey,
    onModeChange,
    onNavigate,
}: UnifiedDiarySectionProps) {
    const [mode, setMode] = useState<'list' | 'quick' | 'full'>(initialMode || 'list');
    const [activeTab, setActiveTab] = useState<EntryType>('quick');
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [emotionFilter, setEmotionFilter] = useState('all');

    const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
    const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});

    const [qSituation, setQSituation] = useState('');
    const [qEmotion, setQEmotion] = useState('');
    const [qCustomEmotion, setQCustomEmotion] = useState('');
    const [qLevel, setQLevel] = useState(5);
    const [qFeelings, setQFeelings] = useState('');

    const [fullStep, setFullStep] = useState<FullStep>(0);
    const [fSituation, setFSituation] = useState('');
    const [fEmotion, setFEmotion] = useState('');
    const [fCustomEmotion, setFCustomEmotion] = useState('');
    const [fEmotionLevel, setFEmotionLevel] = useState(5);
    const [fAutoThought, setFAutoThought] = useState('');
    const [fEvidenceFor, setFEvidenceFor] = useState('');
    const [fEvidenceAgainst, setFEvidenceAgainst] = useState('');
    const [fAltThought, setFAltThought] = useState('');
    const [fNewLevel, setFNewLevel] = useState(3);

    useEffect(() => {
        if (initialMode && initialMode !== mode) setMode(initialMode);
    }, [initialMode, mode]);

    useEffect(() => {
        if (!initialDraft) return;
        setMode('quick');
        setQSituation(initialDraft);
    }, [initialDraft, initialDraftKey]);

    const c = (base: string, dark: string) => (dm ? dark : base);

    const changeMode = (newMode: 'list' | 'quick' | 'full') => {
        setMode(newMode);
        if (onModeChange) onModeChange(newMode);
    };

    const resetQuickForm = () => {
        setQSituation('');
        setQEmotion('');
        setQCustomEmotion('');
        setQLevel(5);
        setQFeelings('');
    };

    const resetFullForm = () => {
        setFullStep(0);
        setFSituation('');
        setFEmotion('');
        setFCustomEmotion('');
        setFEmotionLevel(5);
        setFAutoThought('');
        setFEvidenceFor('');
        setFEvidenceAgainst('');
        setFAltThought('');
        setFNewLevel(3);
    };

    const goToPreviousFullStep = () => {
        setFullStep((prev) => {
            if (prev <= 0) return 0;
            return (prev - 1) as FullStep;
        });
    };

    const goToNextFullStep = () => {
        setFullStep((prev) => {
            if (prev >= 5) return 5;
            return (prev + 1) as FullStep;
        });
    };

    const appendExample = (value: string, current: string, setter: (next: string) => void) => {
        if (!current.trim()) {
            setter(value);
            return;
        }
        if (current.includes(value)) return;
        setter(`${current.trim()} ${value}`.trim());
    };

    const requestAiSuggestion = async (entry: any) => {
        if (aiSuggestions[entry.id] || loadingSuggestions[entry.id]) return;

        setLoadingSuggestions((prev) => ({ ...prev, [entry.id]: true }));
        try {
            const isFull = entry.type === 'full';
            const message = isFull
                ? `Registro completo. Situação: ${entry.situation}. Pensamento automático: ${entry.automaticThought}. Emoção: ${entry.emotion} (nível ${entry.emotionLevel}/10). Novo nível após repensar: ${entry.newEmotionLevel}/10.`
                : `Registro rápido. Situação: ${entry.situation}. Emoção: ${entry.emotion} (nível ${entry.level}/10). ${entry.feelings ? 'Observação: ' + entry.feelings : ''}`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, mode: 'suggestion', userContext: {} }),
            });
            const data = await response.json();
            if (data.response) setAiSuggestions((prev) => ({ ...prev, [entry.id]: data.response }));
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSuggestions((prev) => ({ ...prev, [entry.id]: false }));
        }
    };

    const saveQuick = () => {
        if (!qSituation.trim() || (!qEmotion && !qCustomEmotion.trim())) return;

        const now = new Date();
        const entry: EmotionEntry = {
            id: Date.now().toString(),
            situation: qSituation.trim(),
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            emotion: qEmotion === 'Outra' ? qCustomEmotion.trim() : qEmotion,
            level: qLevel,
            feelings: qFeelings.trim(),
            createdAt: now.toISOString(),
        };

        setDiaryEntries([entry, ...diaryEntries]);
        resetQuickForm();
        changeMode('list');
    };

    const saveFull = () => {
        const resolvedEmotion = fEmotion === 'Outra' ? fCustomEmotion.trim() : fEmotion.trim();
        if (!fSituation.trim() || !fAutoThought.trim() || !resolvedEmotion) return;

        const now = new Date();
        const record: ThoughtRecord = {
            id: Date.now().toString(),
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            situation: fSituation.trim(),
            automaticThought: fAutoThought.trim(),
            emotion: resolvedEmotion,
            emotionLevel: fEmotionLevel,
            evidenceFor: fEvidenceFor.trim(),
            evidenceAgainst: fEvidenceAgainst.trim(),
            alternativeThought: fAltThought.trim(),
            newEmotionLevel: fNewLevel,
            createdAt: now.toISOString(),
        };

        setThoughtRecords([record, ...thoughtRecords]);
        resetFullForm();
        changeMode('list');
    };

    const fullStepCanContinue = useMemo(() => {
        const resolvedEmotion = fEmotion === 'Outra' ? fCustomEmotion.trim() : fEmotion.trim();
        switch (fullStep) {
            case 0: return fSituation.trim().length > 0;
            case 1: return fAutoThought.trim().length > 0;
            case 2: return resolvedEmotion.length > 0;
            case 3: return true;
            case 4: return fAltThought.trim().length > 0;
            case 5: return true;
            default: return false;
        }
    }, [fAltThought, fAutoThought, fCustomEmotion, fEmotion, fSituation, fullStep]);

    const allEntries = [
        ...diaryEntries.map((entry) => ({ ...entry, type: 'quick' as const })),
        ...thoughtRecords.map((record) => ({ ...record, type: 'full' as const, level: record.emotionLevel })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const availableEmotions = useMemo(() => {
        const values = new Set<string>();
        allEntries.forEach((entry) => values.add(entry.emotion));
        return ['all', ...Array.from(values)];
    }, [allEntries]);

    const filteredEntries = allEntries.filter((entry) => {
        if (entry.type !== activeTab) return false;
        if (emotionFilter !== 'all' && entry.emotion !== emotionFilter) return false;
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        const fields = [
            entry.emotion,
            entry.situation,
            'feelings' in entry ? entry.feelings : '',
            'automaticThought' in entry ? entry.automaticThought : '',
            'alternativeThought' in entry ? entry.alternativeThought : '',
        ].join(' ').toLowerCase();
        return fields.includes(query);
    });

    const quickEntriesCount = diaryEntries.length;
    const fullEntriesCount = thoughtRecords.length;

    if (mode === 'quick') {
        return (
            <div className={`p-4 animate-fade-in overflow-y-auto pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
                <div className="mb-6 pt-4">
                    <div>
                        <h2 className={`text-2xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>⚡ Registro rápido</h2>
                        <p className={`text-sm mt-1 font-medium ${c('text-gray-600', 'text-slate-400')}`}>Um check-in simples para não perder o momento.</p>
                    </div>
                </div>

                <div className={`rounded-3xl p-5 mb-6 border ${c('bg-amber-50 border-amber-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <p className={`text-sm font-semibold leading-relaxed ${c('text-amber-900', 'text-slate-300')}`}>
                        Situação, emoção, intensidade e uma observação opcional. Só o necessário para registrar agora.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-3 ${c('text-gray-700', 'text-slate-300')}`}>📍 O que aconteceu?</label>
                        <textarea value={qSituation} onChange={(e) => setQSituation(e.target.value)} rows={3} placeholder="Ex.: recebi uma mensagem que me ativou, fiquei travado(a) em uma tarefa..." className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-4 ${c('text-gray-700', 'text-slate-300')}`}>💭 Como você se sentiu?</label>
                        <div className="grid grid-cols-4 gap-2 sm:gap-3">
                            {emotionOptions.map((option) => (
                                <button key={option.label} onClick={() => setQEmotion(option.label)} className={`flex flex-col items-center p-3 rounded-2xl transition-all shadow-sm active:scale-95 border ${qEmotion === option.label ? `bg-amber-100 border-amber-300 shadow-md ${dm ? 'opacity-90' : ''}` : c('bg-gray-50 border-transparent hover:bg-white', 'bg-slate-700/50 border-transparent hover:bg-slate-700')}`}>
                                    <span className="text-3xl mb-1 filter drop-shadow-sm">{option.emoji}</span>
                                    <span className={`text-[11px] sm:text-xs font-bold ${qEmotion === option.label ? c('text-amber-800', 'text-amber-800') : c('text-gray-600', 'text-slate-300')}`}>{option.label}</span>
                                </button>
                            ))}
                        </div>
                        {qEmotion === 'Outra' && <input type="text" value={qCustomEmotion} onChange={(e) => setQCustomEmotion(e.target.value)} placeholder="Qual emoção chegou mais perto?" className={`w-full mt-4 px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`} />}
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-2 ${c('text-gray-700', 'text-slate-300')}`}>📊 Intensidade: <span className={getLevelColor(qLevel)}>{qLevel}/10 — {getLevelLabel(qLevel)}</span></label>
                        <p className={`text-xs font-medium mb-4 ${c('text-gray-500', 'text-slate-400')}`}>{getLevelReading(qLevel)}</p>
                        <input type="range" min="0" max="10" value={qLevel} onChange={(e) => setQLevel(Number(e.target.value))} className="w-full accent-amber-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700" />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-3 ${c('text-gray-700', 'text-slate-300')}`}>📝 Observação opcional</label>
                        <textarea value={qFeelings} onChange={(e) => setQFeelings(e.target.value)} rows={3} placeholder="Se quiser, anote um pensamento, sensação no corpo ou o que mais chamou atenção." className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <button onClick={saveQuick} className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg transition-all ${qSituation.trim() && (qEmotion || qCustomEmotion.trim()) ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'}`}>
                        💾 Salvar check-in rápido
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'full') {
        const fullProgress = ((fullStep + 1) / fullFlowSteps.length) * 100;
        const currentStepMeta = fullFlowSteps[fullStep];
        const resolvedEmotion = fEmotion === 'Outra' ? fCustomEmotion.trim() : fEmotion.trim();

        return (
            <div className={`p-4 animate-fade-in overflow-y-auto pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
                <div className="mb-6 pt-4">
                    <div>
                        <h2 className={`text-2xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>🧠 Registro completo</h2>
                        <p className={`text-sm mt-1 font-medium ${c('text-gray-600', 'text-slate-400')}`}>Um RPD guiado, em passos, para organizar melhor o que aconteceu.</p>
                    </div>
                </div>

                <div className={`rounded-3xl p-5 mb-6 border ${c('bg-blue-50 border-blue-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <p className={`text-xs font-black uppercase tracking-wider ${c('text-blue-700', 'text-blue-300')}`}>Etapa {fullStep + 1} de {fullFlowSteps.length}</p>
                            <p className="text-lg font-black mt-1">{currentStepMeta.title}</p>
                        </div>
                        <span className={`px-3 py-2 rounded-2xl text-[11px] font-black ${c('bg-white text-blue-700', 'bg-slate-900 text-blue-300 border border-slate-700')}`}>{Math.round(fullProgress)}%</span>
                    </div>
                    <div className={`h-2.5 rounded-full overflow-hidden ${c('bg-blue-100', 'bg-slate-700')}`}>
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${fullProgress}%` }} />
                    </div>
                    <p className={`text-sm font-medium leading-relaxed mt-3 ${c('text-blue-900', 'text-slate-300')}`}>{currentStepMeta.hint}</p>
                </div>

                <div className={`rounded-3xl p-5 mb-6 border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                    {fullStep === 0 && <textarea value={fSituation} onChange={(e) => setFSituation(e.target.value)} rows={5} placeholder="Ex.: enviei uma mensagem importante, não recebi resposta e comecei a imaginar que tinha feito algo errado." className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />}
                    {fullStep === 1 && <textarea value={fAutoThought} onChange={(e) => setFAutoThought(e.target.value)} rows={5} placeholder="Ex.: ela não respondeu porque devo ter sido inconveniente." className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />}
                    {fullStep === 2 && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                {emotionOptions.map((option) => (
                                    <button key={option.label} type="button" onClick={() => setFEmotion(option.label)} className={`flex flex-col items-center p-3 rounded-2xl transition-all shadow-sm active:scale-95 border ${fEmotion === option.label ? `bg-blue-100 border-blue-300 shadow-md ${dm ? 'opacity-90' : ''}` : c('bg-gray-50 border-transparent hover:bg-white', 'bg-slate-700/50 border-transparent hover:bg-slate-700')}`}>
                                        <span className="text-3xl mb-1 filter drop-shadow-sm">{option.emoji}</span>
                                        <span className={`text-[11px] sm:text-xs font-bold ${fEmotion === option.label ? c('text-blue-800', 'text-blue-800') : c('text-gray-600', 'text-slate-300')}`}>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                            {fEmotion === 'Outra' && <input type="text" value={fCustomEmotion} onChange={(e) => setFCustomEmotion(e.target.value)} placeholder="Qual nome emocional descreve melhor isso?" className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`} />}
                            <label className={`text-sm font-bold block ${c('text-gray-700', 'text-slate-300')}`}>📊 Intensidade: <span className={getLevelColor(fEmotionLevel)}>{fEmotionLevel}/10 — {getLevelLabel(fEmotionLevel)}</span></label>
                            <p className={`text-xs font-medium ${c('text-gray-500', 'text-slate-400')}`}>{getLevelReading(fEmotionLevel)}</p>
                            <input type="range" min="0" max="10" value={fEmotionLevel} onChange={(e) => setFEmotionLevel(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500 dark:bg-slate-700" />
                            {resolvedEmotion && <div className={`rounded-2xl p-3 ${c('bg-slate-50', 'bg-slate-900/70')}`}><p className={`text-sm font-semibold ${c('text-slate-700', 'text-slate-300')}`}>Você está nomeando isso como <strong>{resolvedEmotion}</strong>, em um nível <strong>{fEmotionLevel}/10</strong>.</p></div>}
                        </div>
                    )}
                    {fullStep === 3 && (
                        <div className="space-y-5">
                            <textarea value={fEvidenceFor} onChange={(e) => setFEvidenceFor(e.target.value)} rows={4} placeholder="Ex.: ela visualizou e não respondeu, fiquei em dúvida se fui inconveniente..." className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                            <div className="flex flex-wrap gap-2">{evidenceForExamples.map((item) => <button key={item} type="button" onClick={() => appendExample(item, fEvidenceFor, setFEvidenceFor)} className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-green-50 text-green-700 border border-green-100', 'bg-slate-900 text-green-300 border border-slate-700')}`}>{item}</button>)}</div>
                            <textarea value={fEvidenceAgainst} onChange={(e) => setFEvidenceAgainst(e.target.value)} rows={4} placeholder="Ex.: não tenho certeza do motivo do silêncio, isso já aconteceu antes e depois ficou tudo bem..." className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                            <div className="flex flex-wrap gap-2">{evidenceAgainstExamples.map((item) => <button key={item} type="button" onClick={() => appendExample(item, fEvidenceAgainst, setFEvidenceAgainst)} className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-rose-50 text-rose-700 border border-rose-100', 'bg-slate-900 text-rose-300 border border-slate-700')}`}>{item}</button>)}</div>
                        </div>
                    )}
                    {fullStep === 4 && (
                        <div>
                            <textarea value={fAltThought} onChange={(e) => setFAltThought(e.target.value)} rows={5} placeholder="Ex.: pode ser desconfortável, mas o silêncio dela não prova que fiz algo errado." className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                            <div className="flex flex-wrap gap-2 mt-3">{alternativeThoughtExamples.map((item) => <button key={item} type="button" onClick={() => appendExample(item, fAltThought, setFAltThought)} className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-blue-50 text-blue-700 border border-blue-100', 'bg-slate-900 text-blue-300 border border-slate-700')}`}>{item}</button>)}</div>
                        </div>
                    )}
                    {fullStep === 5 && (
                        <div className="space-y-5">
                            <label className={`text-sm font-bold block ${c('text-gray-700', 'text-slate-300')}`}>📉 Como essa emoção fica agora? <span className={getLevelColor(fNewLevel)}>{fNewLevel}/10 — {getLevelLabel(fNewLevel)}</span></label>
                            <p className={`text-xs font-medium ${c('text-gray-500', 'text-slate-400')}`}>Depois de repensar, ela baixou, ficou igual ou ainda está forte?</p>
                            <input type="range" min="0" max="10" value={fNewLevel} onChange={(e) => setFNewLevel(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500 dark:bg-slate-700" />
                            <div className={`rounded-2xl p-4 ${c('bg-emerald-50 border border-emerald-100', 'bg-slate-900/70 border border-slate-700')}`}>
                                <p className={`text-sm font-semibold ${c('text-emerald-900', 'text-slate-300')}`}>Antes: <strong>{fEmotionLevel}/10</strong> • Agora: <strong>{fNewLevel}/10</strong></p>
                                <p className={`text-xs mt-2 font-medium ${c('text-emerald-800', 'text-slate-400')}`}>Mesmo que a emoção ainda esteja alta, organizar o pensamento já é um passo real de cuidado.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => fullStep === 0 ? changeMode('list') : goToPreviousFullStep()} className={`w-1/3 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${c('bg-white border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')}`}>{fullStep === 0 ? 'Sair' : 'Voltar'}</button>
                    {fullStep < 5 ? (
                        <button onClick={goToNextFullStep} disabled={!fullStepCanContinue} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${fullStepCanContinue ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'}`}>Continuar</button>
                    ) : (
                        <button onClick={saveFull} disabled={!fSituation.trim() || !fAutoThought.trim() || !resolvedEmotion} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${fSituation.trim() && fAutoThought.trim() && resolvedEmotion ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'}`}>💾 Salvar registro completo</button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 animate-fade-in overflow-y-auto pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
            <div className="pt-4 mb-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-300 border border-slate-700')}`}>
                        No seu ritmo
                    </span>
                    {allEntries.length > 0 && (
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-black ${c('bg-emerald-50 text-emerald-700', 'bg-slate-800 text-emerald-300 border border-slate-700')}`}>
                            {allEntries.length} registro{allEntries.length > 1 ? 's' : ''} salvo{allEntries.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="No seu ritmo"
                    title="Diário"
                    description="Escolha entre um check-in rápido ou um registro completo para organizar melhor o que aconteceu."
                    icon="📔"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
                <button
                    onClick={() => changeMode('quick')}
                    className={`text-left rounded-3xl p-5 border shadow-sm transition-all active:scale-[0.99] ${c('bg-white border-amber-100 hover:border-amber-200 hover:bg-amber-50/60', 'bg-slate-800/80 border-slate-700 hover:bg-slate-800')}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className={`text-xs font-black uppercase tracking-[0.24em] ${c('text-amber-700', 'text-amber-300')}`}>Registro rápido</p>
                            <h3 className={`text-xl font-black mt-2 ${c('text-gray-900', 'text-slate-100')}`}>Um check-in simples para agora</h3>
                            <p className={`text-sm mt-2 font-medium leading-relaxed ${c('text-gray-600', 'text-slate-400')}`}>
                                Situação, emoção, intensidade e uma observação opcional. Só o essencial.
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-2 items-end">
                            <div className={`px-3 py-2 rounded-2xl text-xs font-black ${c('bg-amber-100 text-amber-800', 'bg-slate-900 text-amber-300 border border-slate-700')}`}>
                                1 minuto
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[11px] font-black ${c('bg-white text-amber-700 border border-amber-100', 'bg-slate-900 text-slate-300 border border-slate-700')}`}>
                                {quickEntriesCount} salvo{quickEntriesCount === 1 ? '' : 's'}
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => changeMode('full')}
                    className={`text-left rounded-3xl p-5 border shadow-sm transition-all active:scale-[0.99] ${c('bg-white border-blue-100 hover:border-blue-200 hover:bg-blue-50/60', 'bg-slate-800/80 border-slate-700 hover:bg-slate-800')}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className={`text-xs font-black uppercase tracking-[0.24em] ${c('text-blue-700', 'text-blue-300')}`}>Registro completo</p>
                            <h3 className={`text-xl font-black mt-2 ${c('text-gray-900', 'text-slate-100')}`}>Um RPD guiado em etapas</h3>
                            <p className={`text-sm mt-2 font-medium leading-relaxed ${c('text-gray-600', 'text-slate-400')}`}>
                                Situação, pensamento, emoção, evidências, leitura alternativa e reavaliação.
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-2 items-end">
                            <div className={`px-3 py-2 rounded-2xl text-xs font-black ${c('bg-blue-100 text-blue-800', 'bg-slate-900 text-blue-300 border border-slate-700')}`}>
                                3 a 5 min
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[11px] font-black ${c('bg-white text-blue-700 border border-blue-100', 'bg-slate-900 text-slate-300 border border-slate-700')}`}>
                                {fullEntriesCount} salvo{fullEntriesCount === 1 ? '' : 's'}
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            <div className={`h-px w-full mb-6 ${c('bg-gradient-to-r from-transparent via-slate-200 to-transparent', 'bg-gradient-to-r from-transparent via-slate-700 to-transparent')}`} />

            <div className="mb-5 px-1">
                <p className={`text-xs font-black uppercase tracking-[0.24em] ${c('text-gray-500', 'text-slate-500')}`}>Histórico</p>
                <h3 className={`text-xl font-black mt-2 ${c('text-gray-900', 'text-slate-100')}`}>Seus registros salvos</h3>
                <p className={`text-sm mt-2 font-medium leading-relaxed ${c('text-gray-600', 'text-slate-400')}`}>
                    Revise seus check-ins ou volte aos registros completos quando quiser retomar uma leitura.
                </p>
            </div>

            {allEntries.length > 0 && (
                <div className={`rounded-3xl p-5 mb-6 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => setActiveTab('quick')}
                            className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'quick' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : c('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800')}`}
                        >
                            Rápidos
                        </button>
                        <button
                            onClick={() => setActiveTab('full')}
                            className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'full' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : c('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800')}`}
                        >
                            Completos
                        </button>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por emoção, situação ou palavras do registro..."
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/40 transition-all ${c('bg-gray-50 border-gray-200 text-gray-800', 'bg-slate-900/60 border-slate-700 text-white placeholder-slate-500')}`}
                        />
                        <select
                            value={emotionFilter}
                            onChange={(e) => setEmotionFilter(e.target.value)}
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/40 transition-all ${c('bg-gray-50 border-gray-200 text-gray-800', 'bg-slate-900/60 border-slate-700 text-white')}`}
                        >
                            {availableEmotions.map((emotion) => (
                                <option key={emotion} value={emotion}>
                                    {emotion === 'all' ? 'Todas as emoções' : emotion}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {filteredEntries.length === 0 ? (
                <div className={`rounded-3xl p-6 text-center border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <div className="text-4xl mb-3">{activeTab === 'quick' ? '🫧' : '📚'}</div>
                    <p className={`text-lg font-black ${c('text-gray-900', 'text-slate-100')}`}>
                        {activeTab === 'quick' ? 'Nenhum check-in rápido por aqui ainda.' : 'Nenhum registro completo por aqui ainda.'}
                    </p>
                    <p className={`text-sm mt-2 font-medium leading-relaxed ${c('text-gray-600', 'text-slate-400')}`}>
                        {searchQuery || emotionFilter !== 'all'
                            ? 'Tente limpar a busca ou o filtro para ver outros registros.'
                            : activeTab === 'quick'
                                ? 'Quando você quiser registrar algo de forma mais leve, ele vai aparecer aqui.'
                                : 'Quando você concluir um RPD, ele vai aparecer aqui com um resumo fácil de revisitar.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEntries.map((entry) => {
                        const isExpanded = expandedEntry === entry.id;
                        const isQuickEntry = entry.type === 'quick';
                        const toneClasses = isQuickEntry
                            ? c('bg-white border-amber-100', 'bg-slate-800/80 border-slate-700')
                            : c('bg-white border-blue-100', 'bg-slate-800/80 border-slate-700');
                        const badgeClasses = isQuickEntry
                            ? c('bg-amber-100 text-amber-800', 'bg-slate-900 text-amber-300 border border-slate-700')
                            : c('bg-blue-100 text-blue-800', 'bg-slate-900 text-blue-300 border border-slate-700');
                        const suggestion = aiSuggestions[entry.id];

                        return (
                            <div key={entry.id} className={`rounded-3xl border shadow-sm overflow-hidden ${toneClasses}`}>
                                <button
                                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                                    className="w-full text-left p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${badgeClasses}`}>
                                                    {isQuickEntry ? 'Rápido' : 'Completo'}
                                                </span>
                                                <span className={`text-xs font-bold ${c('text-gray-500', 'text-slate-400')}`}>
                                                    {formatDate(entry.date)} • {entry.time}
                                                </span>
                                            </div>
                                            <h3 className={`text-lg font-black mt-3 flex items-center gap-2 ${c('text-gray-900', 'text-slate-100')}`}>
                                                <span>{getEmoji(entry.emotion)}</span>
                                                <span className="truncate">{entry.emotion}</span>
                                                <span className={`text-sm font-bold ${getLevelColor(entry.level)}`}>{entry.level}/10</span>
                                            </h3>
                                            <p className={`text-sm mt-2 font-medium leading-relaxed ${c('text-gray-700', 'text-slate-300')}`}>
                                                {summarizeText(entry.situation, 110)}
                                            </p>
                                            {!isQuickEntry && 'automaticThought' in entry && (
                                                <p className={`text-xs mt-3 font-semibold leading-relaxed ${c('text-blue-800', 'text-blue-300')}`}>
                                                    Resumo: {summarizeText(`${entry.automaticThought} ${entry.alternativeThought ? `→ ${entry.alternativeThought}` : ''}`, 120)}
                                                </p>
                                            )}
                                        </div>
                                        <div className={`shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''} ${c('text-gray-400', 'text-slate-500')}`}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="6,9 12,15 18,9" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className={`px-5 pb-5 border-t ${c('border-gray-100', 'border-slate-700')}`}>
                                        <div className="pt-4 space-y-4">
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${c('text-gray-500', 'text-slate-500')}`}>Situação</p>
                                                <p className={`text-sm font-medium leading-relaxed ${c('text-gray-800', 'text-slate-300')}`}>{entry.situation}</p>
                                            </div>

                                            {isQuickEntry ? (
                                                'feelings' in entry && entry.feelings ? (
                                                    <div>
                                                        <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${c('text-gray-500', 'text-slate-500')}`}>Observação</p>
                                                        <p className={`text-sm font-medium leading-relaxed ${c('text-gray-800', 'text-slate-300')}`}>{entry.feelings}</p>
                                                    </div>
                                                ) : null
                                            ) : (
                                                <>
                                                    {'automaticThought' in entry && (
                                                        <div>
                                                            <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${c('text-gray-500', 'text-slate-500')}`}>Pensamento automático</p>
                                                            <p className={`text-sm font-medium leading-relaxed ${c('text-gray-800', 'text-slate-300')}`}>{entry.automaticThought}</p>
                                                        </div>
                                                    )}
                                                    {'evidenceFor' in entry && entry.evidenceFor && (
                                                        <div>
                                                            <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${c('text-gray-500', 'text-slate-500')}`}>Evidências a favor</p>
                                                            <p className={`text-sm font-medium leading-relaxed ${c('text-gray-800', 'text-slate-300')}`}>{entry.evidenceFor}</p>
                                                        </div>
                                                    )}
                                                    {'evidenceAgainst' in entry && entry.evidenceAgainst && (
                                                        <div>
                                                            <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${c('text-gray-500', 'text-slate-500')}`}>Evidências contra</p>
                                                            <p className={`text-sm font-medium leading-relaxed ${c('text-gray-800', 'text-slate-300')}`}>{entry.evidenceAgainst}</p>
                                                        </div>
                                                    )}
                                                    {'alternativeThought' in entry && entry.alternativeThought && (
                                                        <div>
                                                            <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${c('text-gray-500', 'text-slate-500')}`}>Leitura alternativa</p>
                                                            <p className={`text-sm font-medium leading-relaxed ${c('text-gray-800', 'text-slate-300')}`}>{entry.alternativeThought}</p>
                                                        </div>
                                                    )}
                                                    {'newEmotionLevel' in entry && (
                                                        <div className={`rounded-2xl p-4 ${c('bg-slate-50', 'bg-slate-900/60')}`}>
                                                            <p className={`text-sm font-semibold ${c('text-slate-800', 'text-slate-300')}`}>
                                                                Intensidade inicial <strong>{entry.emotionLevel}/10</strong> • Agora <strong>{entry.newEmotionLevel}/10</strong>
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <button
                                                    onClick={() => requestAiSuggestion(entry)}
                                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${isQuickEntry ? c('bg-amber-50 text-amber-800 border border-amber-100 hover:bg-amber-100', 'bg-slate-900 text-amber-300 border border-slate-700 hover:bg-slate-800') : c('bg-blue-50 text-blue-800 border border-blue-100 hover:bg-blue-100', 'bg-slate-900 text-blue-300 border border-slate-700 hover:bg-slate-800')}`}
                                                >
                                                    {loadingSuggestions[entry.id] ? 'Pensando...' : 'Ver leitura de apoio'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (isQuickEntry) {
                                                            setDiaryEntries(diaryEntries.filter((item) => item.id !== entry.id));
                                                        } else {
                                                            setThoughtRecords(thoughtRecords.filter((item) => item.id !== entry.id));
                                                        }
                                                        if (expandedEntry === entry.id) setExpandedEntry(null);
                                                    }}
                                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-red-50 text-red-700 border border-red-100 hover:bg-red-100', 'bg-slate-900 text-red-300 border border-slate-700 hover:bg-slate-800')}`}
                                                >
                                                    Excluir
                                                </button>
                                            </div>

                                            {suggestion && (
                                                <div className={`rounded-2xl p-4 ${c('bg-indigo-50 border border-indigo-100', 'bg-slate-900/70 border border-slate-700')}`}>
                                                    <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${c('text-indigo-700', 'text-indigo-300')}`}>Leitura de apoio</p>
                                                    <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${c('text-indigo-950', 'text-slate-300')}`}>{suggestion}</p>
                                                </div>
                                            )}

                                            <div className={`rounded-2xl p-4 ${c('bg-slate-50 border border-slate-100', 'bg-slate-900/60 border border-slate-700')}`}>
                                                <p className={`text-xs font-black uppercase tracking-[0.2em] mb-3 ${c('text-slate-500', 'text-slate-400')}`}>Continuar com isso</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => onNavigate?.('solta', { soltaDraft: entry.situation, soltaDraftKey: Date.now() })}
                                                        className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100', 'bg-slate-800 text-fuchsia-300 border border-slate-700')}`}
                                                    >
                                                        Soltar daqui
                                                    </button>
                                                    <button
                                                        onClick={() => onNavigate?.('gratitude')}
                                                        className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-amber-50 text-amber-700 border border-amber-100', 'bg-slate-800 text-amber-300 border border-slate-700')}`}
                                                    >
                                                        Ir para gratidão
                                                    </button>
                                                    <button
                                                        onClick={() => onNavigate?.('breathing', { from: 'diary' })}
                                                        className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-sky-50 text-sky-700 border border-sky-100', 'bg-slate-800 text-sky-300 border border-slate-700')}`}
                                                    >
                                                        Respirar agora
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
