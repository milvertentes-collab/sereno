'use client';

import { useState } from 'react';

interface SoltaEntry {
    id: string;
    text: string;
    createdAt: string;
}

interface SoltaAquiSectionProps {
    entries: SoltaEntry[];
    setEntries: (entries: SoltaEntry[]) => void;
    darkMode: boolean;
}

export default function SoltaAquiSection({ entries, setEntries, darkMode: dm }: SoltaAquiSectionProps) {
    const [text, setText] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [released, setReleased] = useState(false);

    const handleRelease = () => {
        if (!text.trim()) return;
        const entry: SoltaEntry = {
            id: Date.now().toString(),
            text: text.trim(),
            createdAt: new Date().toISOString(),
        };
        setEntries([entry, ...entries]);
        setText('');
        setReleased(true);
        setTimeout(() => setReleased(false), 3000);
    };

    const handleDelete = (id: string) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    const handleDeleteAll = () => {
        setEntries([]);
    };

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <div className="text-center mb-8 pt-4">
                <span className="text-6xl block mb-4 filter drop-shadow-md">💭</span>
                <h2 className={`text-3xl font-extrabold tracking-tight ${dm ? 'text-white' : 'text-gray-900'}`}>Solta Aqui</h2>
                <p className={`mt-2 font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                    Escreva o que está pesando hoje.<br />Você não precisa guardar tudo.
                </p>
            </div>

            {released && (
                <div className="mb-6 bg-green-100 text-green-700 rounded-3xl p-5 text-center shadow-sm animate-fade-in border border-green-200">
                    <span className="text-3xl block mb-2 filter drop-shadow-sm">🍃</span>
                    <p className="font-bold text-lg text-green-800">Pronto, você soltou.</p>
                    <p className="text-sm font-medium mt-1">Respire fundo, o peso ficou aqui.</p>
                </div>
            )}

            {/* Writing Area */}
            <div className={`rounded-3xl p-6 mb-6 shadow-sm border backdrop-blur-sm transition-all focus-within:shadow-md focus-within:border-purple-300 ${dm ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Pode desabafar aqui... Ninguém vai julgar. Escreva tudo que está sentindo: medos, angústias, frustrações, tristezas..."
                    rows={6}
                    className={`w-full resize-none outline-none text-base leading-relaxed placeholder-gray-400 ${dm ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'}`}
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                        {text.length} caracteres
                    </span>
                    <button
                        onClick={handleRelease}
                        disabled={!text.trim()}
                        className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${text.trim()
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-500'
                            }`}
                    >
                        🍃 Soltar o peso
                    </button>
                </div>
            </div>

            {/* Tips */}
            <div className={`rounded-3xl p-5 mb-8 border shadow-sm ${dm ? 'bg-purple-900/30 border-purple-800/50' : 'bg-purple-50/80 border-purple-100'}`}>
                <p className={`text-sm leading-relaxed font-medium ${dm ? 'text-purple-200' : 'text-purple-800'}`}>
                    💡 <strong>Dica da Sereno:</strong> Colocar em palavras o que sentimos ajuda o cérebro a processar emoções difíceis.
                    Não se preocupe com gramática ou fazer sentido — apenas escreva.
                </p>
            </div>

            {/* History Toggle */}
            <button
                onClick={() => setShowHistory(!showHistory)}
                className={`w-full py-4 rounded-2xl text-sm font-bold mb-6 transition-all active:scale-95 shadow-sm border ${dm ? 'bg-gray-800/80 text-gray-300 border-gray-700 hover:bg-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
                {showHistory ? '🔒 Esconder baú com o histórico' : '📝 Ver baú com o histórico'} ({entries.length})
            </button>

            {showHistory && entries.length > 0 && (
                <div className="space-y-4 animate-fade-in relative">
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
                    <div className="flex justify-end mb-2 relative z-10">
                        <button onClick={handleDeleteAll} className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 active:scale-95 transition-all">
                            🗑️ Limpar baú
                        </button>
                    </div>
                    {entries.map(entry => (
                        <div key={entry.id} className={`rounded-3xl p-5 border shadow-sm relative z-10 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-xs font-bold uppercase tracking-wider ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button onClick={() => handleDelete(entry.id)} className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{entry.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
