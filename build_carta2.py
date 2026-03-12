path = r'c:\Users\Romulo\Downloads\programa psicologia\src\components\CartaTerapeuticaSection.tsx'

content = """'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

type LetterType = 'nao_enviada' | 'despedida' | 'perdao' | 'passado' | 'dor' | 'gratidao' | 'ciclo' | 'resposta' | 'personalizada' | null;

interface SavedLetter {
    id: string;
    type: LetterType;
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
    const [selectedType, setSelectedType] = useState<LetterType>(null);
    const [letterContent, setLetterContent] = useState('');
    const [responseContent, setResponseContent] = useState('');
    
    // Animation States
    const [isBurning, setIsBurning] = useState(false);
    const [isRipping, setIsRipping] = useState(false);
    const [isStoring, setIsStoring] = useState(false);
    const [isPraying, setIsPraying] = useState(false);
    const [isWritingResponse, setIsWritingResponse] = useState(false);

    useEffect(() => {
        // cleanup expired ripped letters
        const existing = JSON.parse(localStorage.getItem('psico_therapeutic_letters') || '[]');
        const now = Date.now();
        const valid = existing.filter((l: SavedLetter) => !l.expiresAt || l.expiresAt > now);
        if (valid.length !== existing.length) {
            localStorage.setItem('psico_therapeutic_letters', JSON.stringify(valid));
        }
    }, []);

    const saveToLocalStorage = (newLetter: SavedLetter) => {
        const existing = JSON.parse(localStorage.getItem('psico_therapeutic_letters') || '[]');
        localStorage.setItem('psico_therapeutic_letters', JSON.stringify([newLetter, ...existing]));
    };

    const handleBurn = () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsBurning(true);
        setTimeout(() => {
            resetState();
            toast({ 
                title: "Carta Queimada 🔥", 
                description: "Excluída para sempre. Sinta a leveza de deixar ir.",
                className: dm ? 'bg-orange-900 text-orange-100 border-orange-700' : 'bg-orange-50 text-orange-900 border-orange-200'
            });
        }, 1500); 
    };

    const handleRip = () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsRipping(true);
        
        const finalContent = isWritingResponse ? `Carta:\\n${letterContent}\\n\\nResposta:\\n${responseContent}` : letterContent;
        
        saveToLocalStorage({
            id: Date.now().toString(),
            type: selectedType,
            content: finalContent,
            date: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            status: 'ripped'
        });

        setTimeout(() => {
            resetState();
            toast({ 
                title: "Carta Rasgada 🗡️", 
                description: "A carta foi rasgada e desaparecerá do seu diário em 7 dias.",
                className: dm ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
            });
        }, 1000); 
    };

    const handleStore = () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsStoring(true);
        
        const finalContent = isWritingResponse ? `Carta:\\n${letterContent}\\n\\nResposta:\\n${responseContent}` : letterContent;

        saveToLocalStorage({
            id: Date.now().toString(),
            type: selectedType,
            content: finalContent,
            date: Date.now(),
            status: 'saved'
        });

        setTimeout(() => {
            resetState();
            toast({ 
                title: "Carta Guardada 📔", 
                description: "Ela foi salva em segurança para revisitar quando quiser.",
                className: dm ? 'bg-indigo-900 text-indigo-100 border-indigo-700' : 'bg-indigo-50 text-indigo-900 border-indigo-200'
            });
        }, 1200);
    };

    const handlePray = async () => {
        if (!letterContent.trim() && !responseContent.trim()) return;
        setIsPraying(true);
        
        const textToTransform = isWritingResponse ? responseContent : letterContent;

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
            
            if (isWritingResponse) setResponseContent(data.response);
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
    };

    const resetState = () => {
        setLetterContent('');
        setResponseContent('');
        setSelectedType(null);
        setIsBurning(false);
        setIsRipping(false);
        setIsStoring(false);
        setIsWritingResponse(false);
        setIsPraying(false);
    };

    const activeModel = letterModels.find(m => m.id === selectedType);

    return (
        <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in ${dm ? 'bg-slate-900 text-slate-100' : 'bg-[#fafafa] text-gray-800'} overflow-x-hidden`}>
            
            {/* Header */}
            {!selectedType && (
                <div className="text-center pt-8 mb-10">
                    <span className="text-6xl mb-4 block filter drop-shadow-md">🤎</span>
                    <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${dm ? 'text-amber-400' : 'text-amber-800'}`}>Carta Terapêutica</h2>
                    <p className={`mt-2 font-medium max-w-lg mx-auto ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
                        Escrever é organizar a alma. Escolha o propósito da sua carta de hoje.
                    </p>
                </div>
            )}

            <div className="max-w-2xl mx-auto">
                {!selectedType ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                        {letterModels.map(model => (
                            <button 
                                key={model.id}
                                onClick={() => setSelectedType(model.id as LetterType)}
                                className={`p-5 rounded-3xl border text-left transition-all active:scale-95 hover:shadow-md group flex items-start gap-4 ${dm ? 'bg-slate-800 border-slate-700 hover:border-amber-500/50' : `bg-gradient-to-br ${model.bg} bg-opacity-30 border-transparent hover:border-white/50 shadow-sm`}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${dm ? 'bg-slate-700/80' : 'bg-white/60'}`}>
                                    {model.icon}
                                </div>
                                <div className="pt-1">
                                    <h3 className={`font-extrabold text-md mb-1 ${dm ? 'text-slate-200 group-hover:text-amber-400' : model.text}`}>{model.title}</h3>
                                    <p className={`text-xs font-medium leading-relaxed ${dm ? 'text-slate-400' : 'text-gray-600 opacity-80'}`}>{model.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className={`relative transition-all duration-1000
                        ${isBurning ? 'animate-burn-paper' : ''} 
                        ${isStoring ? 'animate-store-paper' : ''} 
                        ${isRipping ? 'animate-rip-paper' : ''} 
                        ${!isBurning && !isStoring && !isRipping ? 'animate-slide-up' : ''}
                    `}>
                        
                        {selectedType === 'resposta' && !isWritingResponse && (
                            <div className={`mb-6 p-5 rounded-2xl text-xs font-medium leading-relaxed border ${dm ? 'bg-cyan-900/30 text-cyan-200 border-cyan-800/50' : 'bg-cyan-50 text-cyan-800 border-cyan-100'}`}>
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><span>💬</span> Prática: Carta de Resposta Imaginada</h4>
                                <p className="mb-2">Uma prática de escrita para imaginar a resposta de alguém com quem ficou algo em aberto. Não é sobre adivinhar a verdade, e sim criar um espaço interno de escuta, reflexão e elaboração do que nunca foi dito.</p>
                                <p className="font-semibold italic">Escreva sua carta, ou apenas comece com: "Se eu pudesse te responder, talvez eu dissesse..."</p>
                            </div>
                        )}

                        <div className={`p-6 sm:p-8 rounded-[2rem] border shadow-xl transition-all duration-500 ${isWritingResponse ? 'translate-y-4 opacity-50 scale-95 pointer-events-none' : ''} ${dm ? 'bg-[#1a1c29] border-slate-700' : 'bg-[#fffdf8] border-amber-100'}`}>
                            
                            <div className="flex justify-between items-center mb-6">
                                <button 
                                    onClick={() => setSelectedType(null)} 
                                    disabled={isBurning || isPraying}
                                    className={`flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity ${dm ? 'text-slate-300' : 'text-amber-900'}`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                                    Voltar
                                </button>
                                <span className="text-2xl">{activeModel?.icon}</span>
                            </div>

                            <h3 className={`font-extrabold text-2xl mb-2 text-center font-serif ${dm ? 'text-amber-300' : 'text-amber-900'}`}>{activeModel?.title}</h3>
                            {isPraying && !isWritingResponse && <p className="text-center text-xs text-purple-500 font-bold mb-4 animate-pulse">Transformando em oração...</p>}

                            <div className={`relative transition-opacity duration-300 ${isPraying && !isWritingResponse ? 'opacity-50' : 'opacity-100'}`}>
                                <textarea
                                    value={letterContent}
                                    onChange={(e) => setLetterContent(e.target.value)}
                                    disabled={isBurning || isStoring || isRipping || isPraying || isWritingResponse}
                                    placeholder="Querido(a)..."
                                    className={`w-full min-h-[300px] p-4 text-lg font-serif leading-relaxed bg-transparent resize-none focus:outline-none placeholder-opacity-40 ${dm ? 'text-slate-200 placeholder-slate-500' : 'text-slate-800 placeholder-amber-800'}`}
                                    style={{
                                        backgroundImage: dm ? 'none' : 'repeating-linear-gradient(transparent, transparent 31px, rgba(217, 119, 6, 0.1) 31px, rgba(217, 119, 6, 0.1) 32px)',
                                        lineHeight: '32px',
                                        paddingTop: '6px'
                                    }}
                                />
                                {isRipping && (
                                    <div className="absolute inset-0 top-0 left-0 right-0 h-full border-t border-b-0 border-dashed border-red-500/50 pointer-events-none transform -rotate-12 scale-110 opacity-50 z-20"></div>
                                )}
                            </div>
                        </div>

                        {/* Second Letter: The Imagined Response */}
                        {isWritingResponse && (
                            <div className={`mt-[-50px] p-6 sm:p-8 rounded-[2rem] border shadow-2xl relative z-10 animate-slide-up ${dm ? 'bg-slate-800 border-indigo-700' : 'bg-slate-50 border-indigo-200'}`}>
                                <h3 className={`font-extrabold text-xl mb-1 text-center font-serif ${dm ? 'text-indigo-300' : 'text-indigo-800'}`}>A Resposta...</h3>
                                <p className={`text-center text-xs font-semibold mb-6 ${dm ? 'text-indigo-400/70' : 'text-indigo-500/70'}`}>Escrevendo como se fosse o outro.</p>
                                
                                {isPraying && <p className="text-center text-xs text-purple-500 font-bold mb-4 animate-pulse">Transformando em oração...</p>}

                                <div className={`relative transition-opacity duration-300 ${isPraying ? 'opacity-50' : 'opacity-100'}`}>
                                    <textarea
                                        value={responseContent}
                                        onChange={(e) => setResponseContent(e.target.value)}
                                        disabled={isBurning || isStoring || isRipping || isPraying}
                                        placeholder="Pense no que essa pessoa diria. 'Eu sei que te machuquei...'"
                                        className={`w-full min-h-[250px] p-4 text-lg font-serif italic leading-relaxed bg-transparent resize-none focus:outline-none placeholder-opacity-40 cursor-[url('/pencil.png'),_text] ${dm ? 'text-slate-300 placeholder-slate-500' : 'text-slate-700 placeholder-indigo-800/40'}`}
                                        style={{
                                            backgroundImage: dm ? 'none' : 'repeating-linear-gradient(transparent, transparent 31px, rgba(99, 102, 241, 0.1) 31px, rgba(99, 102, 241, 0.1) 32px)',
                                            lineHeight: '32px',
                                            paddingTop: '6px'
                                        }}
                                    />
                                    {isRipping && (
                                        <div className="absolute h-full w-full border-t border-dashed border-red-500/50 pointer-events-none transform rotate-12 scale-110 opacity-50 z-20"></div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions Toolbar */}
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
                            <button
                                onClick={handleStore}
                                disabled={!letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${dm ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/80 border border-indigo-700/50' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'}`}
                            >
                                <span className="text-xl">📔</span> Guardar
                            </button>
                            
                            <button
                                onClick={handleRip}
                                disabled={!letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}`}
                            >
                                <span className="text-xl">🗡️</span> Rasgar
                            </button>

                            <button
                                onClick={handleBurn}
                                disabled={!letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${dm ? 'bg-orange-900/50 text-orange-400 hover:bg-orange-900/80 border border-orange-700/50' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'}`}
                            >
                                <span className="text-xl">🔥</span> Queimar
                            </button>

                            <button
                                onClick={handlePray}
                                disabled={(!letterContent.trim() && !responseContent.trim()) || isBurning || isStoring || isRipping || isPraying}
                                className={`relative overflow-hidden py-3 px-2 rounded-2xl text-[10px] leading-tight text-center font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${dm ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 border border-purple-700/50' : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'}`}
                            >
                                <span className="absolute top-1 right-2 text-yellow-500 text-[10px]">👑</span>
                                <span className="text-xl">✨</span> Orar
                            </button>

                            <button
                                onClick={handleWriteResponse}
                                disabled={isWritingResponse || !letterContent.trim() || isBurning || isStoring || isRipping || isPraying}
                                className={`py-3 px-2 rounded-2xl text-[10px] leading-tight text-center font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${dm ? 'bg-cyan-900/50 text-cyan-300 hover:bg-cyan-900/80 border border-cyan-700/50' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'}`}
                            >
                                <span className="text-xl">📝</span> Responder
                            </button>
                        </div>

                        {/* Fire Overlay Effect during Burn */}
                        {isBurning && (
                            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                                <span className="text-[12rem] filter drop-shadow-[0_0_80px_rgba(255,100,0,0.8)] animate-pulse" style={{ animationDuration: '0.3s' }}>🔥</span>
                            </div>
                        )}
                        
                        {/* Rip overlay effect */}
                        {isRipping && (
                            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                                <div className="w-full h-1 bg-white shadow-[0_0_20px_white] transform -rotate-12 animate-rip-flash"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                @keyframes burn-paper {
                    0% {
                        opacity: 1;
                        filter: sepia(0) hue-rotate(0deg) saturate(1) brightness(1);
                        transform: scale(1);
                    }
                    50% {
                        filter: sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.7) contrast(2);
                        transform: scale(0.95);
                    }
                    100% {
                        opacity: 0;
                        filter: sepia(1) hue-rotate(-50deg) saturate(5) brightness(0) blur(20px);
                        transform: scale(0.8) translateY(50px);
                    }
                }
                .animate-burn-paper {
                    animation: burn-paper 1.5s forwards ease-in-out;
                }

                @keyframes rip-paper {
                    0% { opacity: 1; transform: scale(1); filter: contrast(1); }
                    30% { transform: scale(1.02) rotate(-2deg); filter: contrast(1.5) grayscale(0.2); }
                    100% { opacity: 0; transform: scale(0.9) skewY(10deg) translateY(100px); filter: contrast(2) grayscale(1); }
                }
                .animate-rip-paper {
                    animation: rip-paper 1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes rip-flash {
                    0% { opacity: 0; transform: rotate(-12deg) scaleX(0); }
                    50% { opacity: 1; transform: rotate(-12deg) scaleX(1.5); }
                    100% { opacity: 0; transform: rotate(-12deg) scaleX(2); }
                }
                .animate-rip-flash {
                    animation: rip-flash 0.5s ease-out;
                }

                @keyframes store-paper {
                    0% { opacity: 1; transform: scale(1) translateY(0) rotate(0); }
                    40% { transform: scale(0.8) translateY(-20px) rotate(5deg); opacity: 0.8; }
                    100% { opacity: 0; transform: scale(0.2) translateY(200px) rotate(-10deg); filter: blur(4px); }
                }
                .animate-store-paper {
                    animation: store-paper 1.1s forwards cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
            `}</style>
        </div>
    );
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
