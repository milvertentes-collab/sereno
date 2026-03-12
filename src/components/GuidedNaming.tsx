'use client';

import { useState } from 'react';

interface GuidedNamingProps {
    onComplete: (emotion: string, note: string) => void;
    onCancel: () => void;
    darkMode?: boolean;
}

export default function GuidedNaming({ onComplete, onCancel, darkMode: dm }: GuidedNamingProps) {
    const [step, setStep] = useState(1);
    const [sensation, setSensation] = useState('');
    const [thought, setThought] = useState('');
    const [possibleEmotion, setPossibleEmotion] = useState('');

    const c = (base: string, dark: string) => dm ? dark : base;

    const next = () => setStep(s1 => s1 + 1);
    const prev = () => setStep(s1 => s1 - 1);

    const finish = () => {
        const fullNote = `Sensação corporal: ${sensation}. Pensamento: ${thought}.`;
        onComplete(possibleEmotion || 'Confuso', fullNote);
    };

    return (
        <div className={`p-6 rounded-[2.5rem] border shadow-xl animate-fade-in ${c('bg-white border-gray-100', 'bg-slate-800 border-slate-700')}`}>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Passo {step} de 3</span>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {step === 1 && (
                    <div className="animate-slide-up">
                        <h3 className={`text-xl font-bold mb-2 ${c('text-gray-800', 'text-white')}`}>Onde você sente no corpo?</h3>
                        <p className={`text-sm mb-6 ${c('text-gray-500', 'text-slate-400')}`}>Feche os olhos por um momento. Há algum aperto no peito, frio na barriga, tensão nos ombros?</p>
                        <textarea
                            value={sensation}
                            onChange={(e) => setSensation(e.target.value)}
                            placeholder="Ex: Sinto um peso nos ombros e um nó na garganta..."
                            className={`w-full p-4 rounded-2xl border min-h-[120px] resize-none focus:outline-none transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`}
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up">
                        <h3 className={`text-xl font-bold mb-2 ${c('text-gray-800', 'text-white')}`}>O que sua mente está dizendo?</h3>
                        <p className={`text-sm mb-6 ${c('text-gray-500', 'text-slate-400')}`}>Qual é o pensamento que não sai da sua cabeça agora?</p>
                        <textarea
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                            placeholder="Ex: Estou pensando que não vou dar conta de tudo hoje..."
                            className={`w-full p-4 rounded-2xl border min-h-[120px] resize-none focus:outline-none transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`}
                        />
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-slide-up">
                        <h3 className={`text-xl font-bold mb-2 ${c('text-gray-800', 'text-white')}`}>Dando um nome</h3>
                        <p className={`text-sm mb-6 ${c('text-gray-500', 'text-slate-400')}`}>Com base no que você sente e pensa, qual palavra chega mais perto?</p>
                        <input
                            type="text"
                            value={possibleEmotion}
                            onChange={(e) => setPossibleEmotion(e.target.value)}
                            placeholder="Ex: Ansiedade, Sobrecarga, Insegurança..."
                            className={`w-full p-4 rounded-2xl border focus:outline-none transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`}
                        />
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                {step > 1 && (
                    <button onClick={prev} className={`flex-1 py-3 rounded-xl font-bold border ${c('border-gray-200 text-gray-600', 'border-slate-600 text-slate-300')}`}>
                        Voltar
                    </button>
                )}
                <button
                    onClick={step < 3 ? next : finish}
                    className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    {step < 3 ? 'Próximo' : 'Finalizar'}
                </button>
            </div>
        </div>
    );
}
