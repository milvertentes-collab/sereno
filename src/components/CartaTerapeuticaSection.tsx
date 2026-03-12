'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

type LetterType = 'nao_enviada' | 'despedida' | 'perdao' | 'passado' | 'dor' | 'gratidao' | 'ciclo' | 'resposta' | 'personalizada' | null;

interface SavedLetter {
    id: string;
    type: LetterType;
    title: string;
    content: string;
    date: number;
    expiresAt?: number;
    status: 'saved' | 'ripped';
}

const letterModels = [
    { id: 'nao_enviada', icon: '✉️', title: 'Não enviada para alguém', desc: 'Para quem você queria dizer algo, mas não pôde.', bg: 'from-blue-100 to-indigo-100', text: 'text-indigo-800' },
    { id: 'despedida', icon: '🍂', title: 'Carta de despedida', desc: 'Para dizer adeus a alguém ou a uma fase.', bg: 'from-amber-100 to-orange-100', text: 'text-orange-800' },
    { id: 'perdao', icon: '🕊️', title: 'Carta de perdão', desc: 'Para liberar o peso da mágoa, perdoando a si ou ao outro.', bg: 'from-emerald-100 to-teal-100', text: 'text-emerald-800' },
    { id: 'passado', icon: '🕰️', title: 'Para meu eu do passado', desc: 'Para a versão de você que precisava de um abraço.', bg: 'from-purple-100 to-fuchsia-100', text: 'text-purple-800' },
    { id: 'dor', icon: '🌧️', title: 'Para minha dor', desc: 'Dê um contorno ou um nome ao que está machucando.', bg: 'from-slate-200 to-gray-200', text: 'text-gray-800' },
    { id: 'gratidao', icon: '🙏', title: 'Gratidão não dita', desc: 'Para quem te fez bem, mas você nunca agradeceu.', bg: 'from-yellow-100 to-amber-100', text: 'text-amber-800' },
    { id: 'ciclo', icon: '🔄', title: 'Encerrar um ciclo', desc: 'Para um emprego, relacionamento ou hábito que acabou.', bg: 'from-rose-100 to-pink-100', text: 'text-rose-800' },
    { id: 'resposta', icon: '💬', title: 'Resposta Imaginada', desc: 'Imagine a resposta de alguém e traga paz ao coração.', bg: 'from-cyan-100 to-sky-100', text: 'text-cyan-800' },
    { id: 'personalizada', icon: '✍️', title: 'Carta Personalizada', desc: 'Escreva livremente com o seu próprio propósito.', bg: 'from-indigo-50 to-white', text: 'text-indigo-900' }
];

export default function CartaTerapeuticaSection({ darkMode: dm }: { darkMode?: boolean }) {
    const { toast } = useToast();

    // View States
    const [viewingSaved, setViewingSaved] = useState(false);
    const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);

    // Editor States
    const [selectedType, setSelectedType] = useState<LetterType>(null);
    const [letterContent, setLetterContent] = useState('');
    const [responseContent, setResponseContent] = useState('');

    // Toggling between original/response
    const [activeTab, setActiveTab] = useState<'original' | 'resposta'>('original');

    // Animation States
    const [isBurning, setIsBurning] = useState(false);
    const [isRipping, setIsRipping] = useState(false);
    const [isStoring, setIsStoring] = useState(false);
    const [isPraying, setIsPraying] = useState(false);
    const [isWritingResponse, setIsWritingResponse] = useState(false);

    useEffect(() => {
        // cleanup expired ripped letters and load saved letters
        const existing = JSON.parse(localStorage.getItem('psico_therapeutic_letters') || '[]');
        const now = Date.now();
        const valid = existing.filter((l: SavedLetter) => !l.expiresAt || l.expiresAt > now);
        if (valid.length !== existing.length) {
            localStorage.setItem('psico_therapeutic_letters', JSON.stringify(valid));
        }
        setSavedLetters(valid);
    }, [viewingSaved]);

    const saveToLocalStorage = (newLetter: SavedLetter) => {
        const existing = JSON.parse(localStorage.getItem('psico_therapeutic_letters') || '[]');
        const updated = [newLetter, ...existing];
        localStorage.setItem('psico_therapeutic_letters', JSON.stringify(updated));
        setSavedLetters(updated);
    };

    const handleBurn = () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsBurning(true);
        setTimeout(() => {
            resetState();
            toast({
                title: "Carta Queimada 🔥",
                description: "Transcendeu em cinzas. Sinta a liberação.",
                className: dm ? 'bg-orange-900 text-orange-100 border-orange-700' : 'bg-orange-50 text-orange-900 border-orange-200'
            });
        }, 3000);
    };

    const handleRip = () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsRipping(true);

        const finalContent = isWritingResponse ? `Carta:\n${letterContent}\n\nResposta:\n${responseContent}` : letterContent;
        const activeModel = letterModels.find(m => m.id === selectedType);

        saveToLocalStorage({
            id: Date.now().toString(),
            type: selectedType,
            title: activeModel?.title || 'Carta',
            content: finalContent,
            date: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            status: 'ripped'
        });

        setTimeout(() => {
            resetState();
            toast({
                title: "Carta Rasgada 🗡️",
                description: "A carta foi feita em pedaços e desaparecerá por completo em 7 dias.",
                className: dm ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
            });
        }, 1500);
    };

    const handleStore = () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsStoring(true);

        const finalContent = isWritingResponse ? `Carta:\n${letterContent}\n\nResposta:\n${responseContent}` : letterContent;
        const activeModel = letterModels.find(m => m.id === selectedType);

        saveToLocalStorage({
            id: Date.now().toString(),
            type: selectedType,
            title: activeModel?.title || 'Carta Guardada',
            content: finalContent,
            date: Date.now(),
            status: 'saved'
        });

        setTimeout(() => {
            resetState();
            toast({
                title: "Carta Guardada 📔",
                description: "Ela foi salva em segurança na sua gaveta para revisitar quando quiser.",
                className: dm ? 'bg-indigo-900 text-indigo-100 border-indigo-700' : 'bg-indigo-50 text-indigo-900 border-indigo-200'
            });
        }, 2000);
    };

    const handlePray = async () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsPraying(true);

        const textToTransform = activeTab === 'resposta' ? responseContent : letterContent;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: "Transforme o seguinte desabafo/carta em uma oração ou prece acolhedora e espiritual (sem mencionar nenhuma religião específica, apenas focando em pedir por luz, aceitação, paz, força, cura e alívio para o coração): " + textToTransform,
                    history: [],
                    userContext: {}
                })
            });
            const data = await res.json();

            if (activeTab === 'resposta') setResponseContent(data.response);
            else setLetterContent(data.response);

            toast({
                title: "Transformada em Oração ✨",
                description: "A inteligência artificial entregou suas palavras em forma de prece.",
                className: dm ? 'bg-purple-900 text-purple-100 border-purple-700' : 'bg-purple-50 text-purple-900 border-purple-200'
            });
        } catch (e) {
            toast({ title: "Erro", description: "Falha ao transformar em oração no momento." });
        } finally {
            setIsPraying(false);
        }
    };

    const handleWriteResponse = () => {
        if (!letterContent.trim()) {
            toast({ title: "Atenção", description: "Escreva algo primeiro antes de imaginar uma resposta." });
            return;
        }
        setIsWritingResponse(true);
        setActiveTab('resposta');
    };

    const resetState = () => {
        setLetterContent('');
        setResponseContent('');
        setSelectedType(null);
        setIsBurning(false);
        setIsRipping(false);
        setIsStoring(false);
        setIsWritingResponse(false);
        setActiveTab('original');
        setIsPraying(false);
    };

    const activeModel = letterModels.find(m => m.id === selectedType);

    // ============================================
    // viewSaved screen
    // ============================================
    if (viewingSaved) {
        return (
            <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in ${dm ? 'bg-slate-900 text-slate-100' : 'bg-amber-50/30 text-gray-800'}`}>
                <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
                    <button
                        onClick={() => setViewingSaved(false)}
                        className={`font-bold flex items-center gap-2 ${dm ? 'text-slate-300 hover:text-white' : 'text-amber-800 hover:text-amber-900'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                        Voltar para Escrever
                    </button>
                    <span className="text-3xl">🗃️</span>
                </div>

                <h2 className={`text-3xl font-extrabold tracking-tight mb-2 text-center ${dm ? 'text-amber-400' : 'text-amber-800'}`}>Sua Gaveta de Cartas</h2>
                <p className="text-center font-medium opacity-70 mb-10 max-w-md mx-auto">Suas lembranças, guardadas em segurança. Cartas rasgadas irão sumir após 7 dias.</p>

                <div className="max-w-3xl mx-auto space-y-8">
                    {savedLetters.length === 0 ? (
                        <div className="text-center p-10 opacity-50">Sua gaveta está vazia no momento.</div>
                    ) : (
                        savedLetters.map(letter => {
                            const daysLeft = letter.expiresAt ? Math.ceil((letter.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                            return (
                                <div key={letter.id} className={`p-8 rounded-[2rem] border shadow-lg relative overflow-hidden ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-amber-100'}`}>
                                    {letter.status === 'ripped' && (
                                        <div className="absolute inset-0 top-0 left-0 border-t-2 border-dashed border-slate-300 pointer-events-none transform -rotate-3 scale-110 opacity-30"></div>
                                    )}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl">{letter.status === 'ripped' ? '🗡️' : '📔'}</span>
                                            <div>
                                                <h4 className="font-extrabold text-xl">{letter.title}</h4>
                                                <p className="text-sm opacity-60 font-semibold mt-1">{new Date(letter.date).toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        {daysLeft !== null && (
                                            <span className="px-4 py-1.5 bg-red-100 text-red-800 text-xs font-extrabold rounded-full border border-red-200 shadow-sm">
                                                Some em {daysLeft} dias
                                            </span>
                                        )}
                                    </div>
                                    <div className={`p-5 rounded-2xl text-base leading-relaxed whitespace-pre-wrap font-serif italic ${dm ? 'bg-slate-900/50 text-slate-300' : 'bg-amber-50/50 text-slate-700'}`}>
                                        {letter.content}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in ${dm ? 'bg-slate-900 text-slate-100' : 'bg-[#fafafa] text-gray-800'} overflow-x-hidden`}>

            {/* Header */}
            {!selectedType && (
                <div className="text-center pt-8 mb-6">
                    <span className="text-6xl mb-4 block filter drop-shadow-md">🤎</span>
                    <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${dm ? 'text-amber-400' : 'text-amber-800'}`}>Carta Terapêutica</h2>
                    <p className={`mt-2 font-medium max-w-lg mx-auto ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
                        Escrever é organizar a alma. Escolha o propósito da sua carta de hoje.
                    </p>
                </div>
            )}

            <div className={`mx-auto transition-all ${!selectedType ? 'max-w-5xl' : 'max-w-3xl'}`}>
                {!selectedType ? (
                    <>
                        <div className="flex justify-center mb-10">
                            <button
                                onClick={() => setViewingSaved(true)}
                                className={`px-8 py-4 rounded-full font-extrabold shadow-lg transition-all active:scale-95 flex items-center gap-3 text-lg ${dm ? 'bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700' : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'}`}
                            >
                                <span className="text-2xl">🗃️</span> Ver Minha Gaveta de Cartas
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto animate-slide-up">
                            {letterModels.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedType(model.id as LetterType)}
                                    className={`p-5 rounded-[1.5rem] border text-left transition-all active:scale-95 hover:shadow-xl group flex flex-row items-center gap-5 ${dm ? 'bg-slate-800 border-slate-700 hover:border-amber-500/50' : `bg-gradient-to-r ${model.bg} bg-opacity-30 border-transparent hover:border-white/50 shadow-sm`}`}
                                >
                                    <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-4xl shadow-sm ${dm ? 'bg-slate-700/80' : 'bg-white/60'}`}>
                                        {model.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-extrabold text-lg mb-1 ${dm ? 'text-slate-200 group-hover:text-amber-400' : model.text}`}>{model.title}</h3>
                                        <p className={`text-sm font-medium leading-relaxed ${dm ? 'text-slate-400' : 'text-gray-600 opacity-80'}`}>{model.desc}</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${dm ? 'text-slate-400' : 'text-amber-800'}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={`relative transition-all duration-1000
                        ${isBurning ? 'animate-burn-paper' : ''} 
                        ${isStoring ? 'animate-store-drawer' : ''} 
                        ${isRipping ? 'animate-shatter' : ''} 
                        ${!isBurning && !isStoring && !isRipping ? 'animate-slide-up' : ''}
                    `}>

                        <div className={`p-6 sm:p-8 rounded-[2rem] border shadow-2xl transition-all duration-500 relative ${dm ? 'bg-[#1a1c29] border-slate-700' : 'bg-[#fffdf8] border-amber-100'}`}>

                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <button
                                    onClick={() => setSelectedType(null)}
                                    disabled={isBurning || isPraying}
                                    className={`flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity ${dm ? 'text-slate-300' : 'text-amber-900'}`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                                    Voltar
                                </button>
                                <span className="text-3xl drop-shadow-sm">{activeModel?.icon}</span>
                            </div>

                            {/* Letter Tabs for Toggling */}
                            {isWritingResponse && (
                                <div className="flex justify-center gap-4 mb-8">
                                    <button
                                        onClick={() => setActiveTab('original')}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'original' ? (dm ? 'bg-amber-900/50 text-amber-200 border border-amber-700' : 'bg-amber-100 text-amber-900 border border-amber-300') : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        🤎 Sua Carta Original
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('resposta')}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'resposta' ? (dm ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-700' : 'bg-indigo-100 text-indigo-900 border border-indigo-300') : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        📝 A Resposta Imaginada
                                    </button>
                                </div>
                            )}

                            <h3 className={`font-extrabold text-2xl mb-2 text-center font-serif ${dm ? 'text-amber-300' : 'text-amber-900'}`}>
                                {activeTab === 'resposta' ? 'A Resposta Imaginada' : activeModel?.title}
                            </h3>

                            {selectedType === 'resposta' && activeTab === 'original' && !isWritingResponse && (
                                <p className="text-center text-xs opacity-70 italic max-w-sm mx-auto mb-4 font-medium">
                                    Comece escrevendo seu desabafo. Depois usaremos o botão "Responder" para que você possa se colocar na pele da outra pessoa de forma empática.
                                </p>
                            )}

                            {isPraying && <p className="text-center text-xs text-purple-500 font-bold mb-4 animate-pulse">A IA está transformando em oração...</p>}

                            <div className={`relative transition-opacity duration-300 ${isPraying ? 'opacity-50' : 'opacity-100'}`}>

                                {/* ORIGINAL LETTER TXT */}
                                <textarea
                                    value={letterContent}
                                    onChange={(e) => setLetterContent(e.target.value)}
                                    disabled={isBurning || isStoring || isRipping || isPraying}
                                    placeholder={selectedType === 'resposta' ? "Escreva o seu lado da história..." : "Querido(a)..."}
                                    className={`w-full min-h-[350px] p-4 text-lg font-serif leading-relaxed bg-transparent resize-none focus:outline-none placeholder-opacity-40 transition-all ${activeTab !== 'original' ? 'hidden' : ''} ${dm ? 'text-slate-200 placeholder-slate-500' : 'text-slate-800 placeholder-amber-800'}`}
                                    style={{
                                        backgroundImage: dm ? 'none' : 'repeating-linear-gradient(transparent, transparent 31px, rgba(217, 119, 6, 0.1) 31px, rgba(217, 119, 6, 0.1) 32px)',
                                        lineHeight: '32px',
                                        paddingTop: '6px'
                                    }}
                                />

                                {/* RESPONSE LETTER TXT */}
                                <textarea
                                    value={responseContent}
                                    onChange={(e) => setResponseContent(e.target.value)}
                                    disabled={isBurning || isStoring || isRipping || isPraying}
                                    placeholder="Escreva como se fosse o outro: 'Eu sei que te machuquei...'"
                                    className={`w-full min-h-[350px] p-4 text-lg font-serif italic leading-relaxed bg-transparent resize-none focus:outline-none placeholder-opacity-40 cursor-[url('/pencil.png'),_text] transition-all ${activeTab !== 'resposta' ? 'hidden' : ''} ${dm ? 'text-slate-300 placeholder-slate-500' : 'text-slate-700 placeholder-indigo-800/40'}`}
                                    style={{
                                        backgroundImage: dm ? 'none' : 'repeating-linear-gradient(transparent, transparent 31px, rgba(99, 102, 241, 0.1) 31px, rgba(99, 102, 241, 0.1) 32px)',
                                        lineHeight: '32px',
                                        paddingTop: '6px'
                                    }}
                                />

                            </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto items-stretch">
                            <button
                                onClick={handleStore}
                                disabled={!letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full ${dm ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/80 border border-indigo-700/50' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'}`}
                            >
                                <span className="text-xl">🗃️</span> Guardar na Gaveta
                            </button>

                            <button
                                onClick={handleRip}
                                disabled={!letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`}
                            >
                                <span className="text-xl">🗡️</span> Rasgar e Descartar
                            </button>

                            <button
                                onClick={handleBurn}
                                disabled={!letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full ${dm ? 'bg-orange-900/50 text-orange-400 hover:bg-orange-900/80 border border-orange-700/50' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'}`}
                            >
                                <span className="text-xl">🔥</span> Queimar (Imediato)
                            </button>

                            <button
                                onClick={handlePray}
                                disabled={(!letterContent.trim() && !responseContent.trim()) || isBurning || isStoring || isRipping || isPraying}
                                className={`relative overflow-hidden py-3 px-2 rounded-2xl text-[10px] leading-tight text-center font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full ${dm ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-700/50' : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'}`}
                            >
                                <span className="absolute top-1 right-2 text-yellow-500 text-[10px]">👑</span>
                                <span className="text-xl">✨</span> Transformar em Oração
                            </button>

                            <button
                                onClick={handleWriteResponse}
                                disabled={isWritingResponse || !letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-[10px] leading-tight text-center font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-full ${dm ? 'bg-cyan-900/50 text-cyan-300 hover:bg-cyan-900/80 border border-cyan-700/50' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'}`}
                            >
                                <span className="text-xl">📝</span> Adicionar Resposta Imaginada
                            </button>
                        </div>

                        {/* Effects Overlays */}
                        {isBurning && (
                            <div className="absolute inset-0 z-50 pointer-events-none flex items-end justify-center overflow-hidden rounded-[2rem]">
                                <div className="animate-bottom-up-fire w-full h-[150%] absolute bottom-0 bg-gradient-to-t from-orange-500/80 via-red-500/50 to-transparent mix-blend-color-burn"></div>
                                <span className="text-[15rem] absolute bottom-10 filter drop-shadow-[0_0_80px_rgba(255,100,0,1)] animate-pulse" style={{ animationDuration: '0.2s' }}>🔥</span>
                            </div>
                        )}

                        {isRipping && (
                            <div className="absolute inset-0 z-50 pointer-events-none">
                                {/* Shatter effect pieces */}
                                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/20 backdrop-blur-md transform-gpu animate-shatter-piece-1 border border-white/50 border-dashed"></div>
                                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-white/20 backdrop-blur-md transform-gpu animate-shatter-piece-2 border border-white/50 border-dashed"></div>
                                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/20 backdrop-blur-md transform-gpu animate-shatter-piece-3 border border-white/50 border-dashed"></div>
                                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white/20 backdrop-blur-md transform-gpu animate-shatter-piece-4 border border-white/50 border-dashed"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                /* Advanced Fire Effect */
                @keyframes burn-paper {
                    0% {
                        opacity: 1;
                        filter: sepia(0.2) hue-rotate(-10deg) saturate(1) brightness(1);
                    }
                    30% {
                        filter: sepia(1) hue-rotate(-40deg) saturate(3) brightness(0.6) contrast(1.5);
                    }
                    80% {
                        opacity: 0.5;
                        filter: sepia(1) hue-rotate(-50deg) saturate(5) brightness(0) blur(10px);
                        transform: scale(0.95) translateY(-20px);
                    }
                    100% {
                        opacity: 0;
                        filter: sepia(1) hue-rotate(-50deg) saturate(5) brightness(0) blur(20px);
                        transform: scale(0.9) translateY(-50px);
                    }
                }
                .animate-burn-paper {
                    animation: burn-paper 3s forwards cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes bottom-up-fire {
                    0% { transform: translateY(100%); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(-50%); opacity: 0; }
                }
                .animate-bottom-up-fire {
                    animation: bottom-up-fire 3s forwards cubic-bezier(0.1, 0.8, 0.4, 1);
                }

                /* Shatter Rip Effect */
                @keyframes shatter {
                    0% { opacity: 1; transform: scale(1); filter: contrast(1); }
                    15% { transform: scale(1.05); filter: contrast(1.5); }
                    100% { opacity: 0; }
                }
                .animate-shatter {
                    animation: shatter 1.5s forwards ease-in;
                }

                @keyframes shatter-piece-1 {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
                    15% { opacity: 1; }
                    100% { transform: translate(150px, -150px) rotate(45deg); opacity: 0; }
                }
                @keyframes shatter-piece-2 {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
                    15% { opacity: 1; }
                    100% { transform: translate(-150px, 150px) rotate(-60deg); opacity: 0; }
                }
                @keyframes shatter-piece-3 {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
                    15% { opacity: 1; }
                    100% { transform: translate(-150px, -100px) rotate(-30deg); opacity: 0; }
                }
                @keyframes shatter-piece-4 {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
                    15% { opacity: 1; }
                    100% { transform: translate(100px, 200px) rotate(70deg); opacity: 0; }
                }

                .animate-shatter-piece-1 { animation: shatter-piece-1 1.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .animate-shatter-piece-2 { animation: shatter-piece-2 1.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .animate-shatter-piece-3 { animation: shatter-piece-3 1.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .animate-shatter-piece-4 { animation: shatter-piece-4 1.5s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }

                /* Drawer Store Effect */
                @keyframes store-drawer {
                    0% { opacity: 1; transform: scale(1) translateY(0) perspective(1000px) rotateX(0); }
                    50% { transform: scale(0.6) translateY(50px) perspective(1000px) rotateX(40deg); opacity: 0.9; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
                    100% { opacity: 0; transform: scale(0.1) translateY(300px) perspective(1000px) rotateX(80deg); filter: blur(10px); }
                }
                .animate-store-drawer {
                    animation: store-drawer 2s forwards cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
            `}</style>
        </div>
    );
}
