'use client';

import { useMemo, useRef, useState } from 'react';
import SectionHeroCard from './SectionHeroCard';

interface GratitudeEntry {
    id: string;
    date: string;
    items: string[];
    createdAt: string;
}

interface GratitudePhoto {
    id: string;
    url: string;
    caption: string;
    createdAt: string;
}

interface GratitudeSectionProps {
    entries: GratitudeEntry[];
    setEntries: (entries: GratitudeEntry[]) => void;
    photos: GratitudePhoto[];
    setPhotos: (photos: GratitudePhoto[]) => void;
    darkMode: boolean;
    desktopMode?: boolean;
    onNavigate?: (tab: 'diary' | 'healthymessages', params?: Record<string, any>) => void;
}

const gratitudePrompts = [
    'Algo pequeno que te sustentou hoje',
    'Uma pessoa que te fez bem',
    'Um detalhe do ambiente',
    'Algo do seu corpo que te ajudou',
    'Algo que você conseguiu fazer',
    'Um momento de alivio',
];

const dailyPromptPool = [
    'Hoje, o que te sustentou, mesmo que de forma pequena?',
    'Que detalhe do seu dia merece ser lembrado com carinho?',
    'O que fez seu dia ficar um pouco mais respirável?',
    'Quem ou o que trouxe algum conforto hoje?',
    'O que vale a pena guardar deste dia?',
];

const stopWords = new Set([
    'a', 'as', 'o', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'um', 'uma', 'para', 'por',
    'com', 'no', 'na', 'nos', 'nas', 'meu', 'minha', 'meus', 'minhas', 'seu', 'sua', 'seus', 'suas',
    'que', 'eu', 'foi', 'era', 'ser', 'ter', 'mais', 'muito', 'muita', 'hoje', 'ontem', 'isso',
    'isto', 'aquele', 'aquela', 'ao', 'aos', 'me', 'te', 'se', 'ou', 'mas', 'ja',
]);

function toDateKey(date: Date) {
    return date.toISOString().split('T')[0];
}

function formatDay(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
    });
}

function formatPhotoDate(createdAt: string) {
    return new Date(createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function calculateStreak(entries: GratitudeEntry[]) {
    const dates = new Set(entries.map((entry) => entry.date));
    let streak = 0;
    const cursor = new Date();

    while (dates.has(toDateKey(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

function findRecurringWord(entries: GratitudeEntry[]) {
    const counts = new Map<string, number>();

    entries.forEach((entry) => {
        entry.items.forEach((item) => {
            item
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                .split(/\s+/)
                .filter((word) => word.length >= 4 && !stopWords.has(word))
                .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
        });
    });

    let topWord = '';
    let topCount = 0;
    counts.forEach((count, word) => {
        if (count > topCount) {
            topWord = word;
            topCount = count;
        }
    });

    return topCount >= 2 ? { word: topWord, count: topCount } : null;
}

function getDailyPrompt(dateKey: string) {
    const numericSeed = Number(dateKey.replaceAll('-', '')) || 0;
    return dailyPromptPool[numericSeed % dailyPromptPool.length];
}

export default function GratitudeSection({ entries, setEntries, photos = [], setPhotos, darkMode: dm, desktopMode = false, onNavigate }: GratitudeSectionProps) {
    const [view, setView] = useState<'text' | 'visual'>('text');
    const [items, setItems] = useState(['', '', '']);
    const [saved, setSaved] = useState(false);
    const [isEditingToday, setIsEditingToday] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
    const [captionDraft, setCaptionDraft] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const today = toDateKey(new Date());
    const todayEntry = entries.find((entry) => entry.date === today);

    const streak = useMemo(() => calculateStreak(entries), [entries]);
    const totalEntries = entries.length;
    const totalItems = useMemo(() => entries.reduce((sum, entry) => sum + entry.items.length, 0), [entries]);
    const last7DaysCount = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        return entries.filter((entry) => new Date(`${entry.date}T00:00:00`) >= sevenDaysAgo).length;
    }, [entries]);
    const recurringWord = useMemo(() => findRecurringWord(entries), [entries]);
    const dailyPrompt = useMemo(() => getDailyPrompt(today), [today]);

    const c = (base: string, dark: string) => (dm ? dark : base);

    const startEditing = (entry?: GratitudeEntry) => {
        if (entry) {
            setItems([...entry.items, '']);
            setIsEditingToday(true);
            return;
        }

        setItems(['', '', '']);
        setIsEditingToday(true);
    };

    const handleSave = () => {
        const filled = items.map((item) => item.trim()).filter(Boolean);
        if (filled.length === 0) return;

        const entry: GratitudeEntry = {
            id: todayEntry?.id || Date.now().toString(),
            date: today,
            items: filled,
            createdAt: todayEntry?.createdAt || new Date().toISOString(),
        };

        const filtered = entries.filter((existingEntry) => existingEntry.date !== today);
        setEntries([entry, ...filtered]);
        setSaved(true);
        setIsEditingToday(false);
        setTimeout(() => setSaved(false), 3000);
        setItems(['', '', '']);
    };

    const updateItem = (index: number, value: string) => {
        setItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? value : item));
    };

    const addItemField = () => {
        setItems((prev) => [...prev, '']);
    };

    const removeItemField = (index: number) => {
        setItems((prev) => {
            if (prev.length === 1) return [''];
            return prev.filter((_, itemIndex) => itemIndex !== index);
        });
    };

    const applyPrompt = (prompt: string) => {
        const firstEmptyIndex = items.findIndex((item) => !item.trim());
        if (firstEmptyIndex >= 0) {
            updateItem(firstEmptyIndex, prompt);
            return;
        }
        setItems((prev) => [...prev, prompt]);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const newPhoto: GratitudePhoto = {
                id: Date.now().toString(),
                url: event.target?.result as string,
                caption: '',
                createdAt: new Date().toISOString(),
            };
            setPhotos([newPhoto, ...photos]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
    };

    const togglePhotoSelection = (id: string) => {
        if (!isSelecting) return;
        setSelectedPhotos((prev) => prev.includes(id) ? prev.filter((photoId) => photoId !== id) : [...prev, id]);
    };

    const deleteSelectedPhotos = () => {
        setPhotos(photos.filter((photo) => !selectedPhotos.includes(photo.id)));
        setSelectedPhotos([]);
        setIsSelecting(false);
    };

    const deleteSinglePhoto = (id: string) => {
        setPhotos(photos.filter((photo) => photo.id !== id));
    };

    const saveCaption = (id: string) => {
        setPhotos(photos.map((photo) => photo.id === id ? { ...photo, caption: captionDraft.trim() } : photo));
        setEditingCaptionId(null);
        setCaptionDraft('');
    };

    return (
        <div className={`p-4 animate-fade-in pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
            <div className={`flex p-1 rounded-2xl mb-6 ${c('bg-gray-100', 'bg-slate-800')}`}>
                <button
                    onClick={() => setView('text')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'text'
                        ? (dm ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-600 shadow-sm')
                        : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📝 Gratidão em texto
                </button>
                <button
                    onClick={() => setView('visual')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'visual'
                        ? (dm ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-600 shadow-sm')
                        : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🖼️ Mural visual
                </button>
            </div>

            {view === 'text' ? (
                <>
                    <div className="mb-6 pt-2">
                        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                            <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-slate-800 text-yellow-300 border border-slate-700')}`}>
                                Presença gentil
                            </span>
                            {totalEntries > 0 && (
                                <span className={`px-3 py-1.5 rounded-full text-[11px] font-black ${c('bg-white text-amber-700 border border-amber-100', 'bg-slate-800 text-slate-300 border border-slate-700')}`}>
                                    {totalEntries} registro{totalEntries === 1 ? '' : 's'} salvo{totalEntries === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                        <SectionHeroCard
                            darkMode={dm}
                            eyebrow="Presença gentil"
                            title="Gratidão"
                            description="Não precisa ser algo grandioso. Uma gratidão já conta e, se quiser, você pode registrar três ou mais."
                            icon="🙏"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div data-card-glyph="🙏" className={`sereno-ornament-card rounded-[2rem] p-4 border shadow-sm ${c('bg-gradient-to-br from-white to-yellow-50/70 border-yellow-100', 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700')}`}>
                            <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-yellow-700', 'text-yellow-300')}`}>Sequência</p>
                            <p className={`text-2xl font-black mt-2 ${c('text-gray-900', 'text-white')}`}>{streak} dia{streak === 1 ? '' : 's'}</p>
                            <p className={`text-xs mt-2 font-medium ${c('text-gray-600', 'text-gray-400')}`}>de prática contínua</p>
                        </div>
                        <div data-card-glyph="✨" className={`sereno-ornament-card rounded-[2rem] p-4 border shadow-sm ${c('bg-gradient-to-br from-white to-amber-50/70 border-yellow-100', 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700')}`}>
                            <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-yellow-700', 'text-yellow-300')}`}>Últimos 7 dias</p>
                            <p className={`text-2xl font-black mt-2 ${c('text-gray-900', 'text-white')}`}>{last7DaysCount}</p>
                            <p className={`text-xs mt-2 font-medium ${c('text-gray-600', 'text-gray-400')}`}>registro{last7DaysCount === 1 ? '' : 's'} recentes</p>
                        </div>
                    </div>

                    <div data-card-glyph="✨" className={`sereno-ornament-card rounded-[2rem] p-5 mb-6 border shadow-sm ${c('bg-gradient-to-br from-rose-50 via-amber-50 to-yellow-50 border-amber-100', 'bg-gradient-to-br from-slate-800/95 to-slate-900 border-slate-700')}`}>
                        <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${c('bg-white/80 text-amber-700 shadow-sm', 'bg-slate-900 text-yellow-300 border border-slate-700')}`}>
                                ✨
                            </div>
                            <div>
                                <p className={`text-base font-bold leading-relaxed ${c('text-gray-900', 'text-white')}`}>{dailyPrompt}</p>
                                <p className={`text-sm mt-2 font-medium ${c('text-gray-600', 'text-gray-400')}`}>
                                    Se quiser, use essa pergunta como ponto de partida para sua gratidão de hoje.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-[2rem] p-5 mb-6 border shadow-sm ${c('bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100', 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700')}`}>
                        <p className={`text-sm font-semibold leading-relaxed ${c('text-amber-900', 'text-slate-300')}`}>
                            {totalEntries === 0
                                ? 'Quando faltar clareza, comece pequeno: uma pessoa, um detalhe do ambiente ou algo que sustentou você hoje.'
                                : `Você já registrou ${totalEntries} dia${totalEntries === 1 ? '' : 's'} de gratidão, com ${totalItems} lembrança${totalItems === 1 ? '' : 's'} guardada${totalItems === 1 ? '' : 's'}.`}
                        </p>
                        {recurringWord && (
                            <p className={`text-xs mt-3 font-bold ${c('text-amber-800', 'text-yellow-300')}`}>
                                A palavra que mais se repete nos seus registros é <span className="uppercase">"{recurringWord.word}"</span>.
                            </p>
                        )}
                    </div>

                    {saved && (
                        <div className={`mb-6 rounded-3xl p-5 text-center shadow-sm animate-fade-in border ${c('bg-yellow-100 border-yellow-200 text-yellow-800', 'bg-yellow-900/40 border-yellow-800/50 text-yellow-100')}`}>
                            <span className="text-3xl block mb-2 filter drop-shadow-sm">✨</span>
                            <p className="font-bold text-lg">Gratidão registrada.</p>
                            <p className="text-sm font-medium mt-1">Mesmo pequena, ela já ajuda a iluminar o dia.</p>
                        </div>
                    )}

                    <div data-card-glyph="💛" className={`sereno-ornament-card rounded-[2rem] p-5 mb-6 border shadow-sm ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-gray-500', 'text-slate-500')}`}>Sugestões suaves</p>
                                <h3 className={`text-lg font-black mt-2 ${c('text-gray-900', 'text-white')}`}>Se estiver difícil começar</h3>
                            </div>
                            <div className={`px-3 py-2 rounded-2xl text-[11px] font-black ${c('bg-yellow-100 text-yellow-800', 'bg-slate-900 text-yellow-300 border border-slate-700')}`}>
                                1 já conta
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {gratitudePrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => applyPrompt(prompt)}
                                    className={`px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${c('bg-yellow-50 text-yellow-800 border border-yellow-100 hover:bg-yellow-100', 'bg-slate-900 text-yellow-300 border border-slate-700 hover:bg-slate-800')}`}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {todayEntry && !isEditingToday ? (
                        <div className={`rounded-[2rem] p-6 mb-6 shadow-sm border ${c('bg-gradient-to-br from-yellow-50/90 to-amber-50/90 border-yellow-100', 'bg-gradient-to-br from-yellow-900/30 to-slate-900 border-yellow-800/50')}`}>
                            <div className="flex items-start justify-between gap-3 mb-5">
                                <div>
                                    <h3 className={`font-black text-xl flex items-center gap-2 ${c('text-amber-800', 'text-yellow-300')}`}>
                                        <span>✅</span>
                                        <span>Hoje você já registrou gratidão</span>
                                    </h3>
                                    <p className={`text-sm mt-2 font-medium ${c('text-amber-700', 'text-yellow-100')}`}>
                                        O que fez sentido hoje pode continuar guardado aqui. Se quiser, você pode ajustar ou acrescentar mais.
                                    </p>
                                </div>
                                <span className={`px-3 py-2 rounded-2xl text-[11px] font-black ${c('bg-white text-amber-700', 'bg-slate-900 text-yellow-300 border border-slate-700')}`}>
                                    {todayEntry.items.length} item{todayEntry.items.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-5">
                                {todayEntry.items.map((item, i) => (
                                    <div key={i} className={`flex items-start gap-3 p-4 rounded-[1.5rem] ${c('bg-white/80 text-amber-900 shadow-sm', 'bg-black/20 text-yellow-100')}`}>
                                        <span className="text-2xl">{['🌟', '💛', '🌈', '☀️', '🫶', '🍃'][i % 6]}</span>
                                        <p className="text-sm font-medium leading-relaxed mt-0.5">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => startEditing(todayEntry)}
                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-amber-500 text-white shadow-lg shadow-amber-500/25 hover:bg-amber-400', 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-400')}`}
                                >
                                    Editar gratidões de hoje
                                </button>
                                <button
                                    onClick={() => startEditing(todayEntry)}
                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-white text-amber-700 border border-amber-100 hover:bg-amber-50', 'bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800')}`}
                                >
                                    Acrescentar mais uma
                                </button>
                                <button
                                    onClick={() => onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: todayEntry.items.join('\n• '), diaryDraftKey: Date.now() })}
                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-white text-indigo-700 border border-indigo-100 hover:bg-indigo-50', 'bg-slate-900 text-indigo-300 border border-slate-700 hover:bg-slate-800')}`}
                                >
                                    Levar ao diário
                                </button>
                                <button
                                    onClick={() => onNavigate?.('healthymessages')}
                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50', 'bg-slate-900 text-emerald-300 border border-slate-700 hover:bg-slate-800')}`}
                                >
                                    Virar frase de cuidado
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`rounded-[2rem] p-6 mb-6 border shadow-sm backdrop-blur-sm ${c('bg-white/95 border-gray-100', 'bg-slate-800/90 border-slate-700')}`}>
                            <div className="flex items-start justify-between gap-3 mb-5">
                                <div>
                                    <h3 className={`text-xl font-black ${c('text-gray-900', 'text-white')}`}>
                                        {todayEntry ? 'Ajustar gratidões de hoje' : 'Registrar gratidão de hoje'}
                                    </h3>
                                    <p className={`text-sm mt-2 font-medium leading-relaxed ${c('text-gray-600', 'text-gray-400')}`}>
                                        Você pode escrever uma, três ou quantas fizerem sentido agora.
                                    </p>
                                </div>
                                <span className={`px-3 py-2 rounded-2xl text-[11px] font-black ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-slate-900 text-yellow-300 border border-slate-700')}`}>
                                    Livre
                                </span>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={`${index}-${items.length}`} className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <label className={`text-sm font-medium mb-1 block ${c('text-gray-500', 'text-gray-400')}`}>
                                                {['🌟', '💛', '🌈', '☀️', '🫶', '🍃'][index % 6]} Gratidão {index + 1}
                                            </label>
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => updateItem(index, e.target.value)}
                                                placeholder={gratitudePrompts[index] || 'Algo que fez sentido agradecer hoje'}
                                                className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-yellow-400/50 shadow-inner ${c('bg-gray-50 border-gray-200 focus:bg-white focus:border-yellow-400', 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500')}`}
                                            />
                                        </div>
                                        {items.length > 1 && (
                                            <button
                                                onClick={() => removeItemField(index)}
                                                className={`mt-7 shrink-0 w-11 h-11 rounded-2xl text-lg font-bold transition-all active:scale-95 ${c('bg-red-50 text-red-600 border border-red-100 hover:bg-red-100', 'bg-slate-900 text-red-300 border border-slate-700 hover:bg-slate-800')}`}
                                                aria-label={`Remover gratidão ${index + 1}`}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-5">
                                <button
                                    onClick={addItemField}
                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-yellow-50 text-yellow-800 border border-yellow-100 hover:bg-yellow-100', 'bg-slate-900 text-yellow-300 border border-slate-700 hover:bg-slate-800')}`}
                                >
                                    + Adicionar mais uma
                                </button>
                                {todayEntry && (
                                    <button
                                        onClick={() => {
                                            setIsEditingToday(false);
                                            setItems(['', '', '']);
                                        }}
                                        className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${c('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800')}`}
                                    >
                                        Cancelar edição
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!items.some((item) => item.trim())}
                                className={`w-full py-4 mt-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${items.some((item) => item.trim())
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'}`}
                            >
                                <span className="text-xl">✨</span>
                                {todayEntry ? 'Atualizar gratidão de hoje' : 'Salvar gratidão'}
                            </button>
                        </div>
                    )}

                    <div className={`rounded-[2rem] p-5 mb-8 border shadow-sm ${c('bg-gradient-to-br from-orange-50/90 to-amber-50/90 border-orange-100', 'bg-gradient-to-br from-orange-900/20 to-slate-900 border-orange-800/50')}`}>
                        <p className={`text-sm leading-relaxed font-medium ${c('text-orange-800', 'text-orange-200')}`}>
                            💡 <strong>Sabia?</strong> Praticar gratidão com constância pode ampliar a percepção do que ainda sustenta você, mesmo em dias difíceis.
                        </p>
                    </div>

                    <div>
                        <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${c('text-gray-800', 'text-gray-200')}`}>
                            <span>📅</span>
                            <span>Histórico de gratidão</span>
                        </h3>

                        {entries.length === 0 ? (
                            <div className={`rounded-3xl p-6 text-center border ${c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                                <p className={`font-black text-lg ${c('text-gray-900', 'text-white')}`}>Ainda não há registros por aqui.</p>
                                <p className={`text-sm mt-2 font-medium ${c('text-gray-600', 'text-gray-400')}`}>
                                    Quando você começar, seus dias de gratidão vão ficar guardados aqui.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {entries.slice(0, 10).map((entry) => (
                                    <div key={entry.id} data-card-glyph="🙏" className={`sereno-ornament-card rounded-[2rem] p-5 border shadow-sm ${c('bg-white/95 border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <div className={`text-xs font-bold uppercase tracking-wider ${c('text-gray-400', 'text-gray-500')}`}>
                                                {entry.date === today ? 'Hoje' : formatDay(entry.date)}
                                            </div>
                                            <span className={`px-3 py-1.5 rounded-full text-[11px] font-black ${c('bg-yellow-50 text-yellow-800 border border-yellow-100', 'bg-slate-900 text-yellow-300 border border-slate-700')}`}>
                                                {entry.items.length} item{entry.items.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {entry.items.map((item, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <span className={`mt-0.5 ${c('text-yellow-500', 'text-yellow-300')}`}>•</span>
                                                    <p className={`text-sm font-medium leading-relaxed ${c('text-gray-700', 'text-gray-300')}`}>{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="animate-fade-in">
                    <div className="mb-6 text-center">
                        <div className="flex justify-center mb-3">
                            <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-slate-800 text-yellow-300 border border-slate-700')}`}>
                                Memórias que acolhem
                            </span>
                        </div>
                        <h3 className={`text-2xl font-black ${c('text-gray-900', 'text-white')}`}>Mural de Memórias</h3>
                        <p className={`text-sm mt-2 font-medium ${c('text-gray-600', 'text-gray-400')}`}>
                            Guarde imagens que ajudam você a lembrar do que ainda é valioso, bonito ou reconfortante.
                        </p>
                    </div>

                    <div className="flex justify-between items-center mb-6 gap-2 flex-wrap">
                        <div className={`px-4 py-3 rounded-2xl text-sm font-bold ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-slate-800 text-yellow-300 border border-slate-700')}`}>
                            {photos.length} memór{photos.length === 1 ? 'ia' : 'ias'} salva{photos.length === 1 ? '' : 's'}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                            {isSelecting ? (
                                <>
                                    <button
                                        onClick={deleteSelectedPhotos}
                                        disabled={selectedPhotos.length === 0}
                                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                                    >
                                        🗑️ Excluir ({selectedPhotos.length})
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsSelecting(false);
                                            setSelectedPhotos([]);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${c('border-gray-200 text-gray-500', 'border-gray-600 text-gray-300')}`}
                                    >
                                        Cancelar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl text-xs font-bold shadow-md"
                                    >
                                        📸 Adicionar foto
                                    </button>
                                    {photos.length > 0 && (
                                        <button
                                            onClick={() => setIsSelecting(true)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border ${c('border-gray-200 text-gray-500', 'border-gray-600 text-gray-300')}`}
                                        >
                                            Selecionar
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                        />
                    </div>

                    {photos.length === 0 ? (
                        <div className={`rounded-[2.5rem] p-12 text-center border-2 border-dashed ${c('bg-gradient-to-br from-gray-50 to-amber-50/60 border-gray-200', 'bg-slate-800/30 border-slate-700')}`}>
                            <span className="text-6xl block mb-4 opacity-50">🖼️</span>
                            <p className={`font-bold ${c('text-gray-500', 'text-gray-400')}`}>Seu mural ainda está vazio.</p>
                            <p className={`text-xs mt-2 ${c('text-gray-400', 'text-gray-500')}`}>
                                Guarde momentos felizes ou pequenos lembretes visuais para revisitar quando precisar respirar melhor.
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`mt-6 px-6 py-3 rounded-2xl font-bold shadow-md text-sm border ${c('bg-white text-amber-600 border-orange-100', 'bg-slate-900 text-yellow-300 border-slate-700')}`}
                            >
                                Escolher primeira foto
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {photos.map((photo) => {
                                const isTodayPhoto = photo.createdAt.split('T')[0] === today;
                                const isEditingCaption = editingCaptionId === photo.id;

                                return (
                                    <div
                                        key={photo.id}
                                        onClick={() => togglePhotoSelection(photo.id)}
                                        data-card-glyph="🖼️"
                                        className={`sereno-ornament-card relative rounded-[2rem] overflow-hidden border transition-all shadow-sm ${selectedPhotos.includes(photo.id) ? 'border-amber-500 scale-[0.98]' : c('border-gray-100 bg-white', 'border-slate-700 bg-slate-800/80')}`}
                                    >
                                        <div className="relative aspect-square">
                                            <img src={photo.url} alt="Memória de gratidão" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                                            {isSelecting && (
                                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPhotos.includes(photo.id) ? 'bg-amber-500 border-amber-500' : 'bg-black/20 border-white'}`}>
                                                    {selectedPhotos.includes(photo.id) && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}

                                            <div className="absolute inset-x-0 top-0 p-3 flex justify-between items-start gap-2">
                                                {isTodayPhoto ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-white/90 text-amber-700">
                                                        Memória de hoje
                                                    </span>
                                                ) : <span />}
                                                {!isSelecting && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteSinglePhoto(photo.id);
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`p-3 ${c('bg-white', 'bg-slate-800')}`}>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-gray-500', 'text-slate-500')}`}>
                                                    {formatPhotoDate(photo.createdAt)}
                                                </p>
                                                {!isSelecting && !isEditingCaption && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingCaptionId(photo.id);
                                                            setCaptionDraft(photo.caption || '');
                                                        }}
                                                        className={`text-[11px] font-black ${c('text-amber-700', 'text-yellow-300')}`}
                                                    >
                                                        {photo.caption ? 'Editar legenda' : 'Adicionar legenda'}
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingCaption ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value={captionDraft}
                                                        onChange={(e) => setCaptionDraft(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder="Ex.: Um momento de calma, uma pessoa querida..."
                                                        className={`w-full px-3 py-2 rounded-2xl border text-xs font-medium outline-none ${c('bg-gray-50 border-gray-200 text-gray-800', 'bg-slate-900 border-slate-700 text-white placeholder-slate-500')}`}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                saveCaption(photo.id);
                                                            }}
                                                            className="flex-1 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold"
                                                        >
                                                            Salvar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingCaptionId(null);
                                                                setCaptionDraft('');
                                                            }}
                                                            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold ${c('bg-gray-100 text-gray-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className={`text-sm font-medium leading-relaxed min-h-[40px] ${photo.caption ? c('text-gray-700', 'text-gray-300') : c('text-gray-400', 'text-slate-500')}`}>
                                                    {photo.caption || 'Sem legenda ainda.'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className={`mt-8 p-4 rounded-3xl border ${c('bg-indigo-50 border-indigo-100', 'bg-indigo-900/20 border-indigo-800')}`}>
                        <p className={`text-xs leading-relaxed font-medium ${c('text-indigo-800', 'text-indigo-300')}`}>
                            🖼️ <strong>Dica:</strong> Em momentos difíceis, olhar para esse mural pode ajudar você a lembrar do que ainda é vivo, querido e verdadeiro na sua história.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
