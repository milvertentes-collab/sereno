'use client';

import { useState, useEffect } from 'react';

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
    initialMode?: 'list' | 'quick' | 'full';
    onModeChange?: (mode: 'list' | 'quick' | 'full') => void;
}

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

function getEmoji(emotionName: string) {
    return emotionOptions.find(e => e.label === emotionName)?.emoji || '💭';
}

function getLevelColor(l: number) {
    if (l <= 3) return 'text-green-600';
    if (l <= 6) return 'text-yellow-600';
    return 'text-red-600';
}

function getLevelLabel(l: number) {
    if (l === 0) return 'Nenhuma';
    if (l <= 2) return 'Leve';
    if (l <= 4) return 'Moderada';
    if (l <= 6) return 'Considerável';
    if (l <= 8) return 'Intensa';
    return 'Extrema';
}

function formatDate(d: string) {
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}

export default function UnifiedDiarySection({ diaryEntries, setDiaryEntries, thoughtRecords, setThoughtRecords, darkMode: dm, initialMode, onModeChange }: UnifiedDiarySectionProps) {
    const [mode, setMode] = useState<'list' | 'quick' | 'full'>(initialMode || 'list');

    useEffect(() => {
        if (initialMode && initialMode !== mode) {
            setMode(initialMode);
        }
    }, [initialMode]);

    const changeMode = (newMode: 'list' | 'quick' | 'full') => {
        setMode(newMode);
        if (onModeChange) onModeChange(newMode);
    }
    const [activeTab, setActiveTab] = useState<'quick' | 'full'>('quick');
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
    const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});

    const requestAiSuggestion = async (entry: any) => {
        if (aiSuggestions[entry.id] || loadingSuggestions[entry.id]) return;

        setLoadingSuggestions(prev => ({ ...prev, [entry.id]: true }));
        try {
            const isFull = entry.type === 'full';
            const message = isFull
                ? `Diário completo. Situação: ${entry.situation}. Pensamento automático: ${entry.automaticThought}. Emoção: ${entry.emotion} (nível ${entry.emotionLevel}/10). Novo nível após repensar: ${entry.newEmotionLevel}/10.`
                : `Diário rápido. Situação: ${entry.situation}. Emoção: ${entry.emotion} (nível ${entry.level}/10). ${entry.feelings ? 'Observações: ' + entry.feelings : ''}`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    mode: 'suggestion',
                    userContext: {}
                })
            });
            const data = await response.json();
            if (data.response) {
                setAiSuggestions(prev => ({ ...prev, [entry.id]: data.response }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSuggestions(prev => ({ ...prev, [entry.id]: false }));
        }
    };

    // Quick form state
    const [qSituation, setQSituation] = useState('');
    const [qDate, setQDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [qTime, setQTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });
    const [qEmotion, setQEmotion] = useState('');
    const [qCustomEmotion, setQCustomEmotion] = useState('');
    const [qLevel, setQLevel] = useState(5);
    const [qFeelings, setQFeelings] = useState('');

    // Full form state
    const [fSituation, setFSituation] = useState('');
    const [fDate, setFDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [fTime, setFTime] = useState(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });
    const [fEmotion, setFEmotion] = useState('');
    const [fEmotionLevel, setFEmotionLevel] = useState(5);
    const [fAutoThought, setFAutoThought] = useState('');
    const [fEvidenceFor, setFEvidenceFor] = useState('');
    const [fEvidenceAgainst, setFEvidenceAgainst] = useState('');
    const [fAltThought, setFAltThought] = useState('');
    const [fNewLevel, setFNewLevel] = useState(3);

    const saveQuick = () => {
        if (!qSituation.trim() || (!qEmotion && !qCustomEmotion.trim())) return;
        const entry: EmotionEntry = {
            id: Date.now().toString(),
            situation: qSituation.trim(),
            date: qDate, time: qTime,
            emotion: qEmotion === 'Outra' ? qCustomEmotion.trim() : qEmotion,
            level: qLevel,
            feelings: qFeelings.trim(),
            createdAt: new Date().toISOString(),
        };
        setDiaryEntries([entry, ...diaryEntries]);
        setQSituation(''); setQEmotion(''); setQCustomEmotion(''); setQLevel(5); setQFeelings('');
        changeMode('list');
    };

    const saveFull = () => {
        if (!fSituation.trim() || !fAutoThought.trim()) return;
        const record: ThoughtRecord = {
            id: Date.now().toString(), date: fDate, time: fTime,
            situation: fSituation.trim(), automaticThought: fAutoThought.trim(),
            emotion: fEmotion.trim(), emotionLevel: fEmotionLevel,
            evidenceFor: fEvidenceFor.trim(), evidenceAgainst: fEvidenceAgainst.trim(),
            alternativeThought: fAltThought.trim(), newEmotionLevel: fNewLevel,
            createdAt: new Date().toISOString(),
        };
        setThoughtRecords([record, ...thoughtRecords]);
        setFSituation(''); setFAutoThought(''); setFEmotion(''); setFEmotionLevel(5);
        setFEvidenceFor(''); setFEvidenceAgainst(''); setFAltThought(''); setFNewLevel(3);
        changeMode('list');
    };

    const c = (base: string, dark: string) => dm ? dark : base;

    // ==================== QUICK FORM ====================
    if (mode === 'quick') {
        return (
            <div className={`p-4 animate-fade-in overflow-y-auto pb-24 ${dm ? 'text-white' : ''}`}>
                <div className="flex items-center gap-3 mb-6 pt-4">
                    <button onClick={() => changeMode('list')} className={`p-2 rounded-xl ${c('hover:bg-gray-100', 'hover:bg-gray-800')}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
                    </button>
                    <h2 className={`text-xl font-bold ${c('text-gray-800', 'text-white')}`}>⚡ Registro Rápido</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <label className={`text-sm font-bold block mb-2 ${c('text-gray-700', 'text-slate-300')}`}>📅 Data</label>
                            <input type="date" value={qDate} onChange={(e) => setQDate(e.target.value)}
                                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`} />
                        </div>
                        <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <label className={`text-sm font-bold block mb-2 ${c('text-gray-700', 'text-slate-300')}`}>🕐 Hora</label>
                            <input type="time" value={qTime} onChange={(e) => setQTime(e.target.value)}
                                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`} />
                        </div>
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-3 ${c('text-gray-700', 'text-slate-300')}`}>📍 O que aconteceu?</label>
                        <textarea value={qSituation} onChange={(e) => setQSituation(e.target.value)} rows={3} placeholder="Descreva brevemente a situação..."
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-4 ${c('text-gray-700', 'text-slate-300')}`}>💭 Como você se sentiu?</label>
                        <div className="grid grid-cols-4 gap-2 sm:gap-3">
                            {emotionOptions.map(opt => (
                                <button key={opt.label} onClick={() => setQEmotion(opt.label)}
                                    className={`flex flex-col items-center p-3 rounded-2xl transition-all shadow-sm active:scale-95 border ${qEmotion === opt.label ? `bg-amber-100 border-amber-300 shadow-md ${dm ? 'opacity-90' : ''}` : c('bg-gray-50 border-transparent hover:bg-white', 'bg-slate-700/50 border-transparent hover:bg-slate-700')}`}
                                >
                                    <span className="text-3xl mb-1 filter drop-shadow-sm">{opt.emoji}</span>
                                    <span className={`text-[11px] sm:text-xs font-bold ${qEmotion === opt.label ? c('text-amber-800', 'text-amber-800') : c('text-gray-600', 'text-slate-300')}`}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {qEmotion === 'Outra' && (
                            <input type="text" value={qCustomEmotion} onChange={(e) => setQCustomEmotion(e.target.value)} placeholder="Qual emoção?"
                                className={`w-full mt-4 px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`} />
                        )}
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-4 ${c('text-gray-700', 'text-slate-300')}`}>
                            📊 Intensidade: <span className={getLevelColor(qLevel)}>{qLevel}/10 — {getLevelLabel(qLevel)}</span>
                        </label>
                        <div className="relative pt-2 pb-2">
                            <input type="range" min="0" max="10" value={qLevel} onChange={(e) => setQLevel(Number(e.target.value))} className="w-full accent-amber-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700" />
                        </div>
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-3 ${c('text-gray-700', 'text-slate-300')}`}>📝 Algo mais? (opcional)</label>
                        <textarea value={qFeelings} onChange={(e) => setQFeelings(e.target.value)} rows={3} placeholder="Pensamentos, sensações no corpo..."
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-amber-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <button onClick={saveQuick}
                        className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg transition-all ${qSituation.trim() && (qEmotion || qCustomEmotion.trim())
                            ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30 active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                            }`}
                    >
                        💾 Salvar Registro Rápido
                    </button>
                </div>
            </div>
        );
    }

    // ==================== FULL FORM (RPD) ====================
    if (mode === 'full') {
        return (
            <div className={`p-4 animate-fade-in overflow-y-auto pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
                <div className="flex items-center gap-3 mb-6 pt-4">
                    <button onClick={() => changeMode('list')} className={`p-2.5 rounded-2xl transition-all active:scale-95 ${c('bg-white shadow-sm hover:bg-gray-50 text-gray-700', 'bg-slate-800 shadow-sm border border-slate-700 hover:bg-slate-700 text-slate-200')}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
                    </button>
                    <h2 className={`text-2xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>🧠 Registro Completo</h2>
                </div>

                <div className={`rounded-3xl p-5 mb-6 shadow-sm backdrop-blur-sm border ${c('bg-blue-50/80 border-blue-100', 'bg-slate-800/80 border-slate-700')}`}>
                    <p className={`text-sm font-medium leading-relaxed ${c('text-blue-800', 'text-slate-300')}`}>
                        💡 <strong>Reestruturação Cognitiva:</strong> Esta técnica ajuda a identificar pensamentos automáticos negativos,
                        questionar suas evidências e encontrar formas mais equilibradas de pensar.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <label className={`text-sm font-bold block mb-2 ${c('text-gray-700', 'text-slate-300')}`}>📅 Data</label>
                            <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)}
                                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`} />
                        </div>
                        <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <label className={`text-sm font-bold block mb-2 ${c('text-gray-700', 'text-slate-300')}`}>🕐 Hora</label>
                            <input type="time" value={fTime} onChange={(e) => setFTime(e.target.value)}
                                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`} />
                        </div>
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-1 ${c('text-gray-700', 'text-slate-300')}`}>📍 1. Situação</label>
                        <p className={`text-xs font-medium mb-3 ${c('text-gray-500', 'text-slate-400')}`}>O que aconteceu? Onde? Com quem?</p>
                        <textarea value={fSituation} onChange={(e) => setFSituation(e.target.value)} rows={3}
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-1 ${c('text-gray-700', 'text-slate-300')}`}>💭 2. Pensamento Automático</label>
                        <p className={`text-xs font-medium mb-3 ${c('text-gray-500', 'text-slate-400')}`}>O que passou pela sua cabeça naquele momento?</p>
                        <textarea value={fAutoThought} onChange={(e) => setFAutoThought(e.target.value)} rows={3}
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-3 ${c('text-gray-700', 'text-slate-300')}`}>😔 3. Emoção e Intensidade</label>
                        <input type="text" value={fEmotion} onChange={(e) => setFEmotion(e.target.value)} placeholder="Ex: Ansiedade, Tristeza, Raiva..."
                            className={`w-full mb-4 px-4 py-3 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                        <label className={`text-sm font-bold block mb-2 ${c('text-gray-700', 'text-slate-300')}`}>
                            Intensidade: <span className={getLevelColor(fEmotionLevel)}>{fEmotionLevel}/10</span>
                        </label>
                        <div className="relative pt-2 pb-2">
                            <input type="range" min="0" max="10" value={fEmotionLevel} onChange={(e) => setFEmotionLevel(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500 dark:bg-slate-700" />
                        </div>
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-1 ${c('text-gray-700', 'text-slate-300')}`}>✅ 4. Evidências a Favor</label>
                        <p className={`text-xs font-medium mb-3 ${c('text-gray-500', 'text-slate-400')}`}>O que sustenta esse pensamento?</p>
                        <textarea value={fEvidenceFor} onChange={(e) => setFEvidenceFor(e.target.value)} rows={3}
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-1 ${c('text-gray-700', 'text-slate-300')}`}>❌ 5. Evidências Contra</label>
                        <p className={`text-xs font-medium mb-3 ${c('text-gray-500', 'text-slate-400')}`}>O que contradiz esse pensamento?</p>
                        <textarea value={fEvidenceAgainst} onChange={(e) => setFEvidenceAgainst(e.target.value)} rows={3}
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-1 ${c('text-gray-700', 'text-slate-300')}`}>💡 6. Pensamento Alternativo</label>
                        <p className={`text-xs font-medium mb-3 ${c('text-gray-500', 'text-slate-400')}`}>Uma forma mais equilibrada de ver a situação</p>
                        <textarea value={fAltThought} onChange={(e) => setFAltThought(e.target.value)} rows={3}
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500')}`} />
                    </div>

                    <div className={`rounded-3xl p-5 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <label className={`text-sm font-bold block mb-1 ${c('text-gray-700', 'text-slate-300')}`}>
                            📉 7. Novo Nível da Emoção: <span className={getLevelColor(fNewLevel)}>{fNewLevel}/10</span>
                        </label>
                        <p className={`text-xs font-medium mb-3 ${c('text-gray-500', 'text-slate-400')}`}>Como se sente agora, após repensar?</p>
                        <div className="relative pt-2 pb-2">
                            <input type="range" min="0" max="10" value={fNewLevel} onChange={(e) => setFNewLevel(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500 dark:bg-slate-700" />
                        </div>
                    </div>

                    <button onClick={saveFull}
                        className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg transition-all ${fSituation.trim() && fAutoThought.trim()
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                            }`}
                    >
                        💾 Salvar Registro Completo
                    </button>
                </div>
            </div>
        );
    }

    // ==================== LIST VIEW ====================
    const allEntries = [
        ...diaryEntries.map(e => ({ ...e, type: 'quick' as const })),
        ...thoughtRecords.map(r => ({ ...r, type: 'full' as const, level: r.emotionLevel })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filteredEntries = activeTab === 'quick'
        ? allEntries.filter(e => e.type === 'quick')
        : allEntries.filter(e => e.type === 'full');

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <div className="text-center mb-8 pt-4">
                <span className="text-6xl block mb-4 filter drop-shadow-md">📓</span>
                <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Diário</h2>
                <p className={`mt-2 font-medium ${c('text-gray-600', 'text-slate-400')}`}>Registre seus pensamentos e emoções</p>
            </div>

            {/* New Entry Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <button onClick={() => changeMode('quick')}
                    className={`rounded-3xl p-5 text-left transition-all active:scale-95 shadow-sm hover:shadow-md ${c('bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100', 'bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80')}`}
                >
                    <span className="text-3xl block mb-3 filter drop-shadow-sm">⚡</span>
                    <h4 className={`font-bold text-sm ${c('text-amber-800', 'text-slate-200')}`}>Registro Rápido</h4>
                    <p className={`text-xs mt-1 font-medium ${c('text-amber-700/80', 'text-slate-400')}`}>Anote como se sentiu</p>
                </button>
                <button onClick={() => changeMode('full')}
                    className={`rounded-3xl p-5 text-left transition-all active:scale-95 shadow-sm hover:shadow-md ${c('bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100', 'bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80')}`}
                >
                    <span className="text-3xl block mb-3 filter drop-shadow-sm">🧠</span>
                    <h4 className={`font-bold text-sm ${c('text-blue-800', 'text-slate-200')}`}>Registro Completo</h4>
                    <p className={`text-xs mt-1 font-medium ${c('text-blue-700/80', 'text-slate-400')}`}>Reestruturação cognitiva</p>
                </button>
            </div>

            {/* Tab Filter */}
            <div className={`flex gap-2 mb-6 p-1.5 rounded-2xl shadow-inner ${c('bg-gray-100', 'bg-slate-800/80')}`}>
                <button onClick={() => setActiveTab('quick')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'quick' ? c('bg-white shadow-sm text-gray-800', 'bg-slate-700 text-white shadow-sm') : c('text-gray-500 hover:text-gray-700', 'text-slate-400 hover:text-slate-200')}`}
                >
                    ⚡ Rápidos ({diaryEntries.length})
                </button>
                <button onClick={() => setActiveTab('full')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'full' ? c('bg-white shadow-sm text-gray-800', 'bg-slate-700 text-white shadow-sm') : c('text-gray-500 hover:text-gray-700', 'text-slate-400 hover:text-slate-200')}`}
                >
                    🧠 Completos ({thoughtRecords.length})
                </button>
            </div>

            {/* Entries */}
            {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                    <span className="text-5xl block mb-4 filter grayscale opacity-50">📝</span>
                    <p className={`font-medium ${c('text-gray-500', 'text-slate-400')}`}>
                        Nenhum registro {activeTab === 'quick' ? 'rápido' : 'completo'} ainda
                    </p>
                    <button onClick={() => setMode(activeTab)}
                        className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                    >
                        Criar primeiro registro
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEntries.map(entry => (
                        <div key={entry.id}
                            className={`rounded-3xl p-5 border shadow-sm transition-all ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl filter drop-shadow-sm">{getEmoji(entry.emotion)}</span>
                                    <div>
                                        <p className={`font-bold text-sm ${c('text-gray-900', 'text-slate-100')}`}>{entry.emotion}</p>
                                        <p className={`text-xs font-medium ${c('text-gray-500', 'text-slate-400')}`}>{formatDate(entry.date)} às {entry.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-extrabold ${getLevelColor(entry.level)}`}>{entry.level}/10</span>
                                    <button onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                                        className={`p-1.5 rounded-xl transition-all active:scale-95 ${c('hover:bg-gray-100 text-gray-400 hover:text-gray-800', 'hover:bg-slate-700 text-slate-400 hover:text-slate-200')}`}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                            className={`transition-transform duration-300 ${expandedEntry === entry.id ? 'rotate-180' : ''}`}
                                        ><polyline points="6,9 12,15 18,9" /></svg>
                                    </button>
                                </div>
                            </div>

                            {expandedEntry === entry.id && (
                                <div className={`mt-4 pt-4 border-t text-sm font-medium space-y-3 ${c('border-gray-100 text-gray-700', 'border-slate-700 text-slate-300')}`}>
                                    <p><strong className={c('text-gray-900', 'text-slate-100')}>Situação:</strong> {entry.situation}</p>
                                    {'feelings' in entry && entry.feelings && <p><strong className={c('text-gray-900', 'text-slate-100')}>Observações:</strong> {entry.feelings}</p>}
                                    {'automaticThought' in entry && (
                                        <>
                                            <p><strong className={c('text-gray-900', 'text-slate-100')}>Pensamento Automático:</strong> {(entry as ThoughtRecord & { type: string }).automaticThought}</p>
                                            <p><strong className={c('text-gray-900', 'text-slate-100')}>Evidências a Favor:</strong> {(entry as ThoughtRecord & { type: string }).evidenceFor || '—'}</p>
                                            <p><strong className={c('text-gray-900', 'text-slate-100')}>Evidências Contra:</strong> {(entry as ThoughtRecord & { type: string }).evidenceAgainst || '—'}</p>
                                            <p><strong className={c('text-gray-900', 'text-slate-100')}>Pensamento Alternativo:</strong> {(entry as ThoughtRecord & { type: string }).alternativeThought || '—'}</p>
                                            <p><strong className={c('text-gray-900', 'text-slate-100')}>Novo Nível:</strong> <span className={`font-bold ${getLevelColor((entry as ThoughtRecord & { type: string }).newEmotionLevel)}`}>{(entry as ThoughtRecord & { type: string }).newEmotionLevel}/10</span></p>
                                        </>
                                    )}
                                    <div className="flex justify-between items-center mt-5">
                                        <button
                                            onClick={() => requestAiSuggestion(entry)}
                                            disabled={loadingSuggestions[entry.id]}
                                            className={`text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all shadow-sm active:scale-95 ${loadingSuggestions[entry.id] ? 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-800/60'}`}
                                        >
                                            <span className="text-lg">✨</span>
                                            {loadingSuggestions[entry.id] ? 'Pensando...' : aiSuggestions[entry.id] ? 'Pedir nova sugestão' : 'Pedir sugestão à Sereno'}
                                        </button>
                                        <button onClick={() => {
                                            if (window.confirm('Deseja excluir este registro permanentemente?')) { if (entry.type === 'quick') setDiaryEntries(diaryEntries.filter(e => e.id !== entry.id));
                                            else setThoughtRecords(thoughtRecords.filter(r => r.id !== entry.id));
                                            setExpandedEntry(null); }
                                        }} className="text-red-500 font-bold text-sm hover:text-red-600 flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                                            Excluir
                                        </button>
                                    </div>

                                    {aiSuggestions[entry.id] && (
                                        <div className={`mt-4 p-4 rounded-2xl shadow-inner border ${c('bg-purple-50 border-purple-100 text-purple-900', 'bg-slate-800/50 border-purple-900/50 text-purple-100')}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">✨</span>
                                                <h4 className="text-sm font-extrabold">Sereno diz:</h4>
                                            </div>
                                            <p className="text-sm leading-relaxed font-medium">{aiSuggestions[entry.id]}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
