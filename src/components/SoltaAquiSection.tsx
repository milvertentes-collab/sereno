'use client';

import { useEffect, useMemo, useState } from 'react';
import SectionHeroCard from './SectionHeroCard';

interface SoltaEntry {
    id: string;
    text: string;
    createdAt: string;
}

interface SoltaAquiSectionProps {
    entries: SoltaEntry[];
    setEntries: (entries: SoltaEntry[]) => void;
    darkMode: boolean;
    desktopMode?: boolean;
    onNavigate?: (tab: 'diary' | 'breathing' | 'carta', params?: Record<string, any>) => void;
    initialDraft?: string;
    initialDraftKey?: string | number;
}

type WritingMode = 'free' | 'mind' | 'release';
type ReleaseKind = 'saved' | 'wind' | 'deleted' | null;

const modeConfig: Record<WritingMode, { title: string; hint: string; placeholder: string; emoji: string }> = {
    free: {
        title: 'Desabafo livre',
        hint: 'Escreva sem organizar. Aqui vale deixar sair do jeito que vier.',
        placeholder: 'Pode escrever do seu jeito, sem filtro, sem precisar explicar tudo...',
        emoji: '💭',
    },
    mind: {
        title: 'Tirar da cabeça',
        hint: 'Coloque no papel o que está girando por dentro para diminuir a pressão mental.',
        placeholder: 'O que está rodando sem parar na sua cabeça agora?',
        emoji: '🧠',
    },
    release: {
        title: 'Escrever e soltar',
        hint: 'Nomeie o peso e escolha se quer guardar no baú ou soltar ao vento.',
        placeholder: 'O que você gostaria de conseguir soltar hoje?',
        emoji: '🍃',
    },
};

const starterPrompts = [
    'O que está pesando mais agora?',
    'O que você gostaria de conseguir soltar hoje?',
    'O que aconteceu e ficou preso em você?',
];

function summarize(text: string, max = 110) {
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

export default function SoltaAquiSection({ entries, setEntries, darkMode: dm, desktopMode = false, onNavigate, initialDraft, initialDraftKey }: SoltaAquiSectionProps) {
    const [text, setText] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [releasedKind, setReleasedKind] = useState<ReleaseKind>(null);
    const [releasedText, setReleasedText] = useState('');
    const [releasedEntryId, setReleasedEntryId] = useState<string | null>(null);
    const [mode, setMode] = useState<WritingMode>('free');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | '7' | '30'>('all');
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

    const c = (base: string, dark: string) => (dm ? dark : base);

    useEffect(() => {
        if (!initialDraft) return;
        setMode('free');
        setReleasedKind(null);
        setReleasedText('');
        setReleasedEntryId(null);
        setText(initialDraft);
    }, [initialDraft, initialDraftKey]);

    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            const query = searchQuery.trim().toLowerCase();
            const matchesQuery = !query || entry.text.toLowerCase().includes(query);
            if (!matchesQuery) return false;
            if (dateFilter === 'all') return true;
            const days = Number(dateFilter);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - (days - 1));
            return new Date(entry.createdAt) >= cutoff;
        });
    }, [dateFilter, entries, searchQuery]);

    const handleRelease = (kind: 'saved' | 'wind') => {
        if (!text.trim()) return;

        const currentText = text.trim();
        if (kind === 'saved') {
            const entry: SoltaEntry = {
                id: Date.now().toString(),
                text: currentText,
                createdAt: new Date().toISOString(),
            };
            setEntries([entry, ...entries]);
            setReleasedEntryId(entry.id);
        } else {
            setReleasedEntryId(null);
        }

        setReleasedText(currentText);
        setReleasedKind(kind);
        setText('');
    };

    const handleDelete = (id: string) => {
        setEntries(entries.filter((entry) => entry.id !== id));
        if (expandedEntryId === id) setExpandedEntryId(null);
    };

    const handleDeleteAll = () => {
        setEntries([]);
        setExpandedEntryId(null);
    };

    const dismissReleasePanel = () => {
        setReleasedKind(null);
        setReleasedText('');
        setReleasedEntryId(null);
    };

    const removeReleasedEntry = () => {
        if (releasedEntryId) {
            setEntries(entries.filter((entry) => entry.id !== releasedEntryId));
        }
        setReleasedKind('deleted');
        setReleasedEntryId(null);
    };

    const usePrompt = (prompt: string) => {
        setText((prev) => {
            if (!prev.trim()) return `${prompt}\n`;
            if (prev.includes(prompt)) return prev;
            return `${prev.trim()}\n\n${prompt}\n`;
        });
    };

    return (
        <div className={`p-4 animate-fade-in pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
            <div className="mb-6 pt-4">
                <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                    {entries.length > 0 && (
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-black ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-800 text-slate-300 border border-slate-700')}`}>
                            {entries.length} registro{entries.length === 1 ? '' : 's'} no baú
                        </span>
                    )}
                </div>
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="Espaço de descarga"
                    title="Solta Aqui"
                    description="Escreva o que está pesando hoje. Você não precisa organizar tudo antes de começar."
                    icon="💭"
                />
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6">
                {(Object.entries(modeConfig) as Array<[WritingMode, typeof modeConfig[WritingMode]]>).map(([modeId, config]) => (
                    <button
                        key={modeId}
                        onClick={() => setMode(modeId)}
                        className={`text-left rounded-[2rem] p-4 border shadow-sm transition-all active:scale-[0.99] ${mode === modeId
                            ? modeId === 'release'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/25'
                                : modeId === 'mind'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-lg shadow-blue-500/25'
                                    : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-transparent shadow-lg shadow-fuchsia-500/25'
                            : c('bg-gradient-to-br from-white to-slate-50 border-gray-100 hover:border-gray-200 hover:shadow-md', 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700 hover:bg-slate-800')}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${mode === modeId ? 'bg-white/20' : c('bg-white text-slate-700', 'bg-slate-900 text-slate-200 border border-slate-700')}`}>
                                {config.emoji}
                            </div>
                            <div>
                                <p className="font-black">{config.title}</p>
                                <p className={`text-sm mt-1 font-medium leading-relaxed ${mode === modeId ? 'text-white/90' : c('text-gray-600', 'text-gray-400')}`}>{config.hint}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className={`rounded-[2rem] p-5 mb-6 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/85 border-slate-700')}`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-gray-500', 'text-slate-500')}`}>Para destravar</p>
                        <h3 className={`text-lg font-black mt-2 ${c('text-gray-900', 'text-white')}`}>Se estiver difícil começar</h3>
                    </div>
                    <span className={`px-3 py-2 rounded-2xl text-[11px] font-black ${c('bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100', 'bg-slate-900 text-fuchsia-300 border border-slate-700')}`}>
                        Sem julgamento
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {starterPrompts.map((prompt) => (
                        <button
                            key={prompt}
                            onClick={() => usePrompt(prompt)}
                            className={`px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${c('bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-100 hover:bg-fuchsia-100', 'bg-slate-900 text-fuchsia-300 border border-slate-700 hover:bg-slate-800')}`}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            {releasedKind && (
                <div className={`mb-6 rounded-[2rem] p-5 border shadow-sm animate-fade-in overflow-hidden relative ${releasedKind === 'wind'
                    ? c('bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-100', 'bg-gradient-to-br from-emerald-900/25 via-teal-900/20 to-slate-900 border-emerald-800/50')
                    : releasedKind === 'deleted'
                        ? c('bg-amber-50 border-amber-100', 'bg-amber-900/25 border-amber-800/50')
                        : c('bg-green-100 border-green-200', 'bg-green-900/25 border-green-800/50')}`}
                >
                    {releasedKind === 'wind' && (
                        <>
                            <div className="absolute -top-3 left-6 text-xl opacity-60 animate-bounce">🍃</div>
                            <div className="absolute top-5 right-8 text-lg opacity-50 animate-pulse">~</div>
                            <div className="absolute bottom-4 right-5 text-xl opacity-60 animate-bounce [animation-delay:180ms]">🫧</div>
                            <div className="absolute bottom-8 left-10 text-sm opacity-50 animate-pulse [animation-delay:220ms]">~</div>
                        </>
                    )}
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">{releasedKind === 'wind' ? '🍃' : releasedKind === 'deleted' ? '🫧' : '🪶'}</span>
                        <div className="flex-1">
                            <p className={`font-bold text-lg ${releasedKind === 'wind'
                                ? c('text-emerald-900', 'text-emerald-200')
                                : releasedKind === 'deleted'
                                    ? c('text-amber-900', 'text-amber-200')
                                    : c('text-green-800', 'text-green-200')}`}
                            >
                                {releasedKind === 'wind'
                                    ? 'Você soltou ao vento.'
                                    : releasedKind === 'deleted'
                                        ? 'O texto foi apagado depois de escrever.'
                                        : 'Seu desabafo foi guardado no baú.'}
                            </p>
                            <p className={`text-sm font-medium mt-1 leading-relaxed ${releasedKind === 'wind'
                                ? c('text-emerald-800', 'text-emerald-300')
                                : releasedKind === 'deleted'
                                    ? c('text-amber-800', 'text-amber-300')
                                    : c('text-green-700', 'text-green-300')}`}
                            >
                                {releasedKind === 'wind'
                                    ? 'Nem tudo precisa ficar com você. Algumas coisas podem só passar.'
                                    : releasedKind === 'deleted'
                                        ? 'Você colocou para fora e escolheu não carregar isso adiante.'
                                        : 'O peso ficou aqui para você não precisar sustentar tudo sozinho(a).'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={dismissReleasePanel}
                            className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-white text-slate-700 border border-slate-200 hover:bg-slate-50', 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800')}`}
                        >
                            Encerrar por aqui
                        </button>
                        <button
                            onClick={() => onNavigate?.('breathing', { exerciseId: 'relaxamento', from: 'solta' })}
                            className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100', 'bg-slate-900 text-sky-300 border border-slate-700 hover:bg-slate-800')}`}
                        >
                            Respirar agora
                        </button>
                        <button
                            onClick={() => onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: releasedText, diaryDraftKey: Date.now() })}
                            className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-indigo-50 text-indigo-800 border border-indigo-100 hover:bg-indigo-100', 'bg-slate-900 text-indigo-300 border border-slate-700 hover:bg-slate-800')}`}
                        >
                            Transformar em diário
                        </button>
                        <button
                            onClick={() => onNavigate?.('carta', { cartaDraft: releasedText, cartaDraftKey: Date.now(), cartaType: 'personalizada' })}
                            className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-amber-50 text-amber-800 border border-amber-100 hover:bg-amber-100', 'bg-slate-900 text-amber-300 border border-slate-700 hover:bg-slate-800')}`}
                        >
                            Virar carta
                        </button>
                        {releasedKind === 'saved' && releasedEntryId && (
                            <button
                                onClick={removeReleasedEntry}
                                className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-amber-50 text-amber-800 border border-amber-100 hover:bg-amber-100', 'bg-slate-900 text-amber-300 border border-slate-700 hover:bg-slate-800')}`}
                            >
                                Apagar depois de escrever
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className={`rounded-[2rem] p-6 mb-6 shadow-sm border backdrop-blur-sm transition-all focus-within:shadow-md ${c('bg-gradient-to-br from-white/95 to-fuchsia-50/40 border-gray-100 focus-within:border-fuchsia-300', 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700 focus-within:border-fuchsia-500')}`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-gray-500', 'text-slate-500')}`}>{modeConfig[mode].title}</p>
                        <p className={`text-sm font-medium mt-2 ${c('text-gray-600', 'text-gray-400')}`}>{modeConfig[mode].hint}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${c('bg-white text-fuchsia-700 border border-fuchsia-100', 'bg-slate-900 text-fuchsia-300 border border-slate-700')}`}>
                        {modeConfig[mode].emoji}
                    </div>
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={modeConfig[mode].placeholder}
                    rows={7}
                    className={`w-full resize-none outline-none text-base leading-relaxed placeholder-gray-400 ${dm ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'}`}
                />

                <div className={`flex items-center justify-between mt-3 pt-3 border-t ${c('border-gray-100', 'border-slate-700')}`}>
                    <span className={`text-xs font-medium ${c('text-gray-400', 'text-gray-500')}`}>{text.length} caracteres</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleRelease('wind')}
                            disabled={!text.trim()}
                            className={`px-4 py-3 rounded-2xl font-bold text-sm transition-all ${text.trim()
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-500'}`}
                        >
                            🍃 Soltar ao vento
                        </button>
                        <button
                            onClick={() => handleRelease('saved')}
                            disabled={!text.trim()}
                            className={`px-4 py-3 rounded-2xl font-bold text-sm transition-all ${text.trim()
                                ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25 active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-500'}`}
                        >
                            🧰 Guardar no baú
                        </button>
                    </div>
                </div>
            </div>

            <div className={`rounded-[2rem] p-5 mb-8 border shadow-sm ${c('bg-purple-50/90 border-purple-100', 'bg-purple-900/20 border-purple-800/50')}`}>
                <p className={`text-sm leading-relaxed font-medium ${c('text-purple-800', 'text-purple-200')}`}>
                    💡 <strong>Dica da Sereno:</strong> Colocar em palavras o que está difícil ajuda o cérebro a organizar o que parece grande demais por dentro. Aqui não precisa ficar bonito, coerente ou certo.
                </p>
            </div>

            <button
                onClick={() => setShowHistory(!showHistory)}
                className={`w-full py-4 rounded-2xl text-sm font-bold mb-4 transition-all active:scale-95 shadow-sm border ${c('bg-white text-gray-700 border-gray-200 hover:bg-gray-50', 'bg-slate-800/80 text-gray-300 border-slate-700 hover:bg-slate-800')}`}
            >
                {showHistory ? '🔒 Esconder baú com o histórico' : '📝 Ver baú com o histórico'} ({entries.length})
            </button>

            {showHistory && (
                <div className="animate-fade-in">
                    {entries.length > 0 && (
                        <div className={`rounded-[2rem] p-5 mb-4 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/85 border-slate-700')}`}>
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por palavra dentro do baú..."
                                    className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none ${c('bg-gray-50 border-gray-200 text-gray-800', 'bg-slate-900 border-slate-700 text-white placeholder-slate-500')}`}
                                />
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { id: 'all', label: 'Tudo' },
                                        { id: '7', label: 'Últimos 7 dias' },
                                        { id: '30', label: 'Últimos 30 dias' },
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setDateFilter(option.id as 'all' | '7' | '30')}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${dateFilter === option.id
                                                ? 'bg-fuchsia-500 text-white shadow-md'
                                                : c('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800')}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {entries.length === 0 ? (
                        <div className={`rounded-[2rem] p-6 text-center border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <p className={`font-black text-lg ${c('text-gray-900', 'text-white')}`}>Seu baú ainda está vazio.</p>
                            <p className={`text-sm mt-2 font-medium ${c('text-gray-600', 'text-gray-400')}`}>
                                Quando você quiser guardar um desabafo, ele vai aparecer aqui.
                            </p>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className={`rounded-[2rem] p-6 text-center border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                            <p className={`font-black text-lg ${c('text-gray-900', 'text-white')}`}>Nenhum registro encontrado.</p>
                            <p className={`text-sm mt-2 font-medium ${c('text-gray-600', 'text-gray-400')}`}>
                                Tente ajustar a busca ou o filtro para revisitar outros desabafos.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={handleDeleteAll}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${c('text-red-500 bg-red-50 border border-red-100 hover:bg-red-100', 'text-red-300 bg-red-900/20 border border-red-900/30 hover:bg-red-900/30')}`}
                                >
                                    🗑️ Limpar baú
                                </button>
                            </div>
                            {filteredEntries.map((entry) => {
                                const isExpanded = expandedEntryId === entry.id;
                                return (
                                    <div key={entry.id} className={`rounded-[2rem] border shadow-sm overflow-hidden transition-all ${c('bg-gradient-to-br from-white to-slate-50 border-gray-100 hover:shadow-md', 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:shadow-lg hover:shadow-black/20')}`}>
                                        <button
                                            onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                                            className="w-full text-left p-5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-gray-400', 'text-slate-500')}`}>
                                                        {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className={`text-sm mt-3 font-medium leading-relaxed ${c('text-gray-700', 'text-gray-300')}`}>
                                                        {isExpanded ? entry.text : summarize(entry.text)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(entry.id);
                                                        }}
                                                        className={`p-2 rounded-full transition-colors ${c('text-gray-400 hover:text-red-500 hover:bg-gray-100', 'text-slate-500 hover:text-red-300 hover:bg-slate-900')}`}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                    <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${c('text-gray-400', 'text-slate-500')}`}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
