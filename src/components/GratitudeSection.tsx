'use client';

import { useState, useRef } from 'react';

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
}

export default function GratitudeSection({ entries, setEntries, photos = [], setPhotos, darkMode: dm }: GratitudeSectionProps) {
    const [view, setView] = useState<'text' | 'visual'>('text');
    const [items, setItems] = useState(['', '', '']);
    const [saved, setSaved] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === today);

    const handleSave = () => {
        const filled = items.filter(i => i.trim());
        if (filled.length === 0) return;

        const entry: GratitudeEntry = {
            id: Date.now().toString(),
            date: today,
            items: filled,
            createdAt: new Date().toISOString(),
        };

        const filtered = entries.filter(e => e.date !== today);
        setEntries([entry, ...filtered]);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setItems(['', '', '']);
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
        };
        reader.readAsDataURL(file);
    };

    const togglePhotoSelection = (id: string) => {
        if (!isSelecting) return;
        setSelectedPhotos(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const deleteSelectedPhotos = () => {
        setPhotos(photos.filter(p => !selectedPhotos.includes(p.id)));
        setSelectedPhotos([]);
        setIsSelecting(false);
    };

    const deleteSinglePhoto = (id: string) => {
        setPhotos(photos.filter(p => p.id !== id));
    };

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            {/* Tab Selector */}
            <div className={`flex p-1 rounded-2xl mb-8 ${dm ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <button
                    onClick={() => setView('text')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'text'
                        ? (dm ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-600 shadow-sm')
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    📝 Diário de Texto
                </button>
                <button
                    onClick={() => setView('visual')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'visual'
                        ? (dm ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-600 shadow-sm')
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🖼️ Mural Visual
                </button>
            </div>

            {view === 'text' ? (
                <>
                    <div className="text-center mb-8">
                        <span className="text-6xl block mb-4 filter drop-shadow-md">🙏</span>
                        <h2 className={`text-3xl font-extrabold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>Diário de Gratidão</h2>
                        <p className={`mt-2 font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                            3 coisas pelas quais você é grato(a) hoje
                        </p>
                    </div>

                    {saved && (
                        <div className="mb-6 bg-yellow-100 text-yellow-700 rounded-3xl p-5 text-center shadow-sm animate-fade-in border border-yellow-200">
                            <span className="text-3xl block mb-2 filter drop-shadow-sm">✨</span>
                            <p className="font-bold text-lg text-yellow-800">Gratidão registrada!</p>
                            <p className="text-sm font-medium mt-1">Que a positividade acompanhe seu dia.</p>
                        </div>
                    )}

                    {todayEntry ? (
                        <div className={`rounded-3xl p-6 mb-6 shadow-sm border ${dm ? 'bg-yellow-900/40 border-yellow-800/50' : 'bg-gradient-to-br from-yellow-50/80 to-amber-50/80 border-yellow-100'}`}>
                            <h3 className={`font-bold text-lg mb-5 flex items-center gap-2 ${dm ? 'text-yellow-300' : 'text-amber-800'}`}>
                                <span className="text-xl">✅</span> Hoje você agradeceu por:
                            </h3>
                            <div className="space-y-4">
                                {todayEntry.items.map((item, i) => (
                                    <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl ${dm ? 'bg-black/20 text-yellow-100' : 'bg-white/60 text-amber-900 shadow-sm'}`}>
                                        <span className="text-2xl filter drop-shadow-sm">{['🌟', '💛', '🌈'][i]}</span>
                                        <p className="text-sm font-medium leading-relaxed mt-0.5">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`rounded-3xl p-6 mb-6 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                            {items.map((item, index) => (
                                <div key={index} className="mb-4">
                                    <label className={`text-sm font-medium mb-1 block ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {['🌟', '💛', '🌈'][index]} Gratidão {index + 1}
                                    </label>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[index] = e.target.value;
                                            setItems(newItems);
                                        }}
                                        placeholder={['Ex: Minha família', 'Ex: O sol de hoje', 'Ex: Ter um teto'][index]}
                                        className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-yellow-400/50 shadow-inner ${dm ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-yellow-400'}`}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={handleSave}
                                disabled={!items.some(i => i.trim())}
                                className={`w-full py-4 mt-2 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${items.some(i => i.trim())
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                                    }`}
                            >
                                <span className="text-xl">✨</span> Salvar Gratidão
                            </button>
                        </div>
                    )}

                    {/* Benefits */}
                    <div className={`rounded-3xl p-5 mb-8 border shadow-sm ${dm ? 'bg-orange-900/30 border-orange-800/50' : 'bg-orange-50/80 border-orange-100'}`}>
                        <p className={`text-sm leading-relaxed font-medium ${dm ? 'text-orange-200' : 'text-orange-800'}`}>
                            💡 <strong>Sabia?</strong> Praticar gratidão diariamente pode reduzir sintomas de depressão em até 35%
                            e melhorar significativamente a qualidade do sono.
                        </p>
                    </div>

                    {/* Past entries */}
                    {entries.length > 0 && (
                        <div>
                            <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>
                                <span>📅</span> Histórico de Gratidão
                            </h3>
                            <div className="space-y-4">
                                {entries.slice(0, 10).map(entry => (
                                    <div key={entry.id} className={`rounded-3xl p-5 border shadow-sm transition-all hover:shadow-md ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                                        <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                        </div>
                                        <div className="space-y-2">
                                            {entry.items.map((item, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <span className="text-gray-300 dark:text-gray-600 mt-0.5">•</span>
                                                    <p className={`text-sm font-medium leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`text-xl font-bold ${dm ? 'text-white' : 'text-gray-800'}`}>Mural de Memórias</h3>
                        <div className="flex gap-2">
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
                                        onClick={() => { setIsSelecting(false); setSelectedPhotos([]); }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${dm ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}
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
                                        📸 Adicionar Foto
                                    </button>
                                    {photos.length > 0 && (
                                        <button
                                            onClick={() => setIsSelecting(true)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border ${dm ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-500'}`}
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
                        <div className={`rounded-[2.5rem] p-12 text-center border-2 border-dashed ${dm ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="text-6xl block mb-4 opacity-50">🖼️</span>
                            <p className={`font-bold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Seu mural está vazio</p>
                            <p className="text-xs text-gray-400 mt-2">Guarde momentos felizes para revisitar quando precisar de um sorriso.</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-6 px-6 py-3 bg-white text-amber-600 rounded-2xl font-bold shadow-md text-sm border border-orange-100"
                            >
                                Escolher primeira foto
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {photos.map(photo => (
                                <div
                                    key={photo.id}
                                    onClick={() => togglePhotoSelection(photo.id)}
                                    className={`relative aspect-square rounded-3xl overflow-hidden group cursor-pointer border-2 transition-all ${selectedPhotos.includes(photo.id) ? 'border-amber-500 scale-[0.98]' : 'border-transparent'}`}
                                >
                                    <img src={photo.url} alt="Memória" className="w-full h-full object-cover" />

                                    {isSelecting && (
                                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPhotos.includes(photo.id) ? 'bg-amber-500 border-amber-500' : 'bg-black/20 border-white'}`}>
                                            {selectedPhotos.includes(photo.id) && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        {!isSelecting && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteSinglePhoto(photo.id); }}
                                                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={`mt-8 p-4 rounded-3xl border ${dm ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-100'}`}>
                        <p className={`text-xs leading-relaxed ${dm ? 'text-indigo-300' : 'text-indigo-800'}`}>
                            🖼️ <strong>Dica:</strong> Em momentos de tristeza, olhar para o seu Mural Visual ajuda a lembrar que o sofrimento é passageiro e que existem motivos reais para sorrir.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
