path = r'c:\Users\Romulo\Downloads\programa psicologia\src\components\CartaTerapeuticaSection.tsx'

content = """'use client';

import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

type LetterType = 'futuro' | 'perdao' | 'despedida' | null;

interface SavedLetter {
    id: string;
    type: LetterType;
    content: string;
    date: number;
}

const letterModels = [
    {
        id: 'futuro',
        icon: '✉️',
        title: 'Para mim no futuro',
        desc: 'Escreva para a versão de você mesmo(a) que já superou isso.',
        color: 'from-blue-100 to-indigo-100 border-indigo-200',
        text: 'text-indigo-800'
    },
    {
        id: 'perdao',
        icon: '🕊️',
        title: 'Carta de Perdão',
        desc: 'Para alguém que te machucou, ou para se perdoar.',
        color: 'from-emerald-100 to-teal-100 border-emerald-200',
        text: 'text-emerald-800'
    },
    {
        id: 'despedida',
        icon: '🍂',
        title: 'Carta de Despedida',
        desc: 'Para encerrar um ciclo, um hábito ou uma dor.',
        color: 'from-amber-100 to-orange-100 border-orange-200',
        text: 'text-orange-800'
    }
];

export default function CartaTerapeuticaSection({ darkMode: dm }: { darkMode?: boolean }) {
    const { toast } = useToast();
    const [selectedType, setSelectedType] = useState<LetterType>(null);
    const [letterContent, setLetterContent] = useState('');
    const [isBurning, setIsBurning] = useState(false);

    const handleBurn = () => {
        if (!letterContent.trim()) return;
        
        setIsBurning(true);
        setTimeout(() => {
            setLetterContent('');
            setSelectedType(null);
            setIsBurning(false);
            
            toast({ 
                title: "Carta Queimada 🔥", 
                description: "O que estava pesando virou cinzas. Sinta a leveza de deixar ir.",
                className: dm ? 'bg-orange-900 border-orange-700 text-orange-100' : 'bg-orange-50 border-orange-200 text-orange-900'
            });
        }, 1500); // Wait for animation
    };

    const handleSave = () => {
        if (!letterContent.trim()) return;

        const newLetter: SavedLetter = {
            id: Date.now().toString(),
            type: selectedType,
            content: letterContent,
            date: Date.now()
        };

        const existing = JSON.parse(localStorage.getItem('psico_therapeutic_letters') || '[]');
        localStorage.setItem('psico_therapeutic_letters', JSON.stringify([newLetter, ...existing]));

        setLetterContent('');
        setSelectedType(null);

        toast({ 
            title: "Carta Guardada 📔", 
            description: "Ela foi salva em segurança para você revisitar no futuro.",
            className: dm ? 'bg-indigo-900 border-indigo-700 text-indigo-100' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
        });
    };

    const activeModel = letterModels.find(m => m.id === selectedType);

    return (
        <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in ${dm ? 'bg-slate-900 text-slate-100' : 'bg-[#fafafa] text-gray-800'}`}>
            
            {/* Header */}
            <div className="text-center pt-8 mb-10">
                <span className="text-6xl mb-4 block filter drop-shadow-md">🤎</span>
                <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${dm ? 'text-amber-400' : 'text-amber-800'}`}>Carta Terapêutica</h2>
                <p className={`mt-2 font-medium max-w-lg mx-auto ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
                    Escrever é organizar a alma. Escolha o propósito da sua carta de hoje.
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                {!selectedType ? (
                    <div className="grid grid-cols-1 gap-4 animate-slide-up">
                        {letterModels.map(model => (
                            <button 
                                key={model.id}
                                onClick={() => setSelectedType(model.id as LetterType)}
                                className={`p-6 rounded-3xl border text-left transition-all active:scale-95 hover:shadow-md group flex items-center gap-5 ${dm ? 'bg-slate-800 border-slate-700 hover:border-amber-500/50' : `bg-gradient-to-r ${model.color} bg-opacity-50`}`}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm ${dm ? 'bg-slate-700/80' : 'bg-white/60'}`}>
                                    {model.icon}
                                </div>
                                <div>
                                    <h3 className={`font-extrabold text-lg mb-1 ${dm ? 'text-slate-200 group-hover:text-amber-400' : model.text}`}>{model.title}</h3>
                                    <p className={`text-sm font-medium ${dm ? 'text-slate-400' : 'text-gray-600 opacity-90'}`}>{model.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className={`relative ${isBurning ? 'animate-burn-paper' : 'animate-slide-up'}`}>
                        <div className={`p-6 sm:p-8 rounded-[2rem] border shadow-xl ${dm ? 'bg-[#1a1c29] border-slate-700' : 'bg-[#fffdf8] border-amber-100'}`}>
                            
                            <div className="flex justify-between items-center mb-6">
                                <button 
                                    onClick={() => setSelectedType(null)} 
                                    disabled={isBurning}
                                    className={`flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity ${dm ? 'text-slate-300' : 'text-amber-900'}`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                                    Voltar
                                </button>
                                <span className="text-2xl">{activeModel?.icon}</span>
                            </div>

                            <h3 className={`font-extrabold text-2xl mb-8 text-center font-serif ${dm ? 'text-amber-300' : 'text-amber-900'}`}>{activeModel?.title}</h3>

                            <textarea
                                value={letterContent}
                                onChange={(e) => setLetterContent(e.target.value)}
                                disabled={isBurning}
                                placeholder="Querido(a)..."
                                className={`w-full min-h-[300px] p-4 text-lg font-serif leading-relaxed bg-transparent resize-none focus:outline-none placeholder-opacity-40 transition-opacity ${isBurning ? 'opacity-0' : 'opacity-100'} ${dm ? 'text-slate-200 placeholder-slate-500' : 'text-slate-800 placeholder-amber-800'}`}
                                style={{
                                    backgroundImage: dm ? 'none' : 'repeating-linear-gradient(transparent, transparent 31px, rgba(217, 119, 6, 0.1) 31px, rgba(217, 119, 6, 0.1) 32px)',
                                    lineHeight: '32px',
                                    paddingTop: '6px'
                                }}
                            />

                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <button
                                    onClick={handleBurn}
                                    disabled={!letterContent.trim() || isBurning}
                                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${dm ? 'bg-orange-900/50 text-orange-400 hover:bg-orange-900/80' : 'bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200'}`}
                                >
                                    🔥 Queimar Carta
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!letterContent.trim() || isBurning}
                                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
                                >
                                    📔 Guardar no Diário
                                </button>
                            </div>
                        </div>

                        {/* Fire Overlay Effect during Burn */}
                        {isBurning && (
                            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                                <span className="text-9xl filter drop-shadow-[0_0_50px_rgba(255,100,0,0.8)] animate-pulse">🔥</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Add global style block for the burn animation if not present globally */}
            <style jsx global>{`
                @keyframes burn-paper {
                    0% {
                        opacity: 1;
                        filter: sepia(0) hue-rotate(0deg) saturate(1) brightness(1);
                        transform: scale(1);
                    }
                    50% {
                        filter: sepia(1) hue-rotate(-50deg) saturate(3) brightness(0.8) contrast(2);
                        transform: scale(0.98);
                    }
                    100% {
                        opacity: 0;
                        filter: sepia(1) hue-rotate(-50deg) saturate(5) brightness(0) blur(10px);
                        transform: scale(0.9) translateY(20px);
                    }
                }
                .animate-burn-paper {
                    animation: burn-paper 1.5s forwards ease-in-out;
                }
            `}</style>
        </div>
    );
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
