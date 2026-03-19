'use client';

import { useMemo, useState } from 'react';

interface GuidedNamingProps {
    onComplete: (emotion: string, note: string) => void;
    onCancel: () => void;
    darkMode?: boolean;
}

const bodySuggestions = [
    'Aperto no peito',
    'Nó na garganta',
    'Tensão nos ombros',
    'Barriga embrulhada',
    'Peso no corpo',
    'Coração acelerado',
];

const thoughtSuggestions = [
    'Não vou dar conta.',
    'Preciso resolver tudo agora.',
    'Estou me cobrando demais.',
    'Queria sumir um pouco.',
    'Não sei bem o que estou sentindo.',
    'Parece que ficou pesado demais.',
];

const emotionSuggestions = [
    'Ansiedade',
    'Sobrecarga',
    'Insegurança',
    'Tristeza',
    'Irritação',
    'Confusão',
    'Cansaço',
    'Frustração',
    'Medo',
    'Receio',
    'Pressão',
    'Autocobrança',
    'Solidão',
    'Sensibilidade',
    'Desânimo',
    'Culpa',
    'Vergonha',
    'Alívio',
    'Esperança',
    'Gratidão',
    'Alegria',
    'Calma',
    'Serenidade',
    'Confiança',
    'Orgulho',
    'Motivação',
    'Entusiasmo',
    'Carinho',
    'Pertencimento',
    'Leveza',
];

const stepMeta = [
    { title: 'Corpo', subtitle: 'Vamos começar pelo corpo, porque ele costuma mostrar sinais antes das palavras.' },
    { title: 'Mente', subtitle: 'Agora aproxime o pensamento que mais está ocupando espaço aí dentro.' },
    { title: 'Nome', subtitle: 'Chegue perto de um nome possível, sem precisar acertar perfeitamente.' },
];

export default function GuidedNaming({ onComplete, onCancel, darkMode: dm }: GuidedNamingProps) {
    const [step, setStep] = useState(1);
    const [sensation, setSensation] = useState('');
    const [thought, setThought] = useState('');
    const [possibleEmotion, setPossibleEmotion] = useState('');

    const c = (base: string, dark: string) => dm ? dark : base;
    const currentMeta = stepMeta[step - 1];

    const next = () => setStep((current) => Math.min(3, current + 1));
    const prev = () => setStep((current) => Math.max(1, current - 1));

    const canContinue =
        (step === 1 && sensation.trim().length > 0) ||
        (step === 2 && thought.trim().length > 0) ||
        step === 3;

    const emotionalSummary = useMemo(() => {
        const pieces: string[] = [];
        if (sensation.trim()) pieces.push(`No corpo: ${sensation.trim()}.`);
        if (thought.trim()) pieces.push(`Na mente: ${thought.trim()}.`);
        if (possibleEmotion.trim()) pieces.push(`Nome mais próximo: ${possibleEmotion.trim()}.`);
        return pieces.join(' ');
    }, [possibleEmotion, sensation, thought]);

    const finish = () => {
        const emotionName = possibleEmotion.trim() || 'Confuso';
        const fullNote = `Sensação corporal: ${sensation || 'não nomeada'}. Pensamento presente: ${thought || 'não nomeado'}.`;
        onComplete(emotionName, fullNote);
    };

    const addSuggestion = (value: string, setter: (text: string) => void, current: string) => {
        if (!current.trim()) {
            setter(value);
            return;
        }
        if (current.includes(value)) return;
        setter(`${current.trim()} ${value}`.trim());
    };

    return (
        <div className={`p-6 rounded-[2.5rem] border shadow-xl animate-fade-in ${c('bg-white border-gray-100', 'bg-slate-800 border-slate-700')}`}>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Passo {step} de 3</span>
                        <p className={`text-sm font-semibold mt-1 ${c('text-gray-700', 'text-slate-300')}`}>{currentMeta.title}</p>
                        <h2 className={`mt-3 text-[1.6rem] font-black tracking-[-0.03em] ${c('text-slate-900', 'text-slate-100')}`}>
                            Vamos aproximar um nome do que está vivo em você agora.
                        </h2>
                    </div>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                <div className={`h-2 rounded-full overflow-hidden mb-6 ${c('bg-slate-100', 'bg-slate-700')}`}>
                    <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
                </div>

                <div className={`rounded-[2rem] p-5 mb-6 ${c('bg-sky-50 border border-sky-100', 'bg-slate-900/60 border border-slate-700')}`}>
                    <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${c('text-sky-700', 'text-sky-300')}`}>Nomeação guiada</p>
                    <p className={`text-sm font-semibold mt-2 leading-relaxed ${c('text-sky-900', 'text-slate-200')}`}>{currentMeta.subtitle}</p>
                </div>

                {step === 1 && (
                    <div className="animate-slide-up">
                        <h3 className={`text-xl font-bold mb-2 ${c('text-gray-800', 'text-white')}`}>Onde isso aparece no seu corpo?</h3>
                        <p className={`text-sm mb-6 ${c('text-gray-500', 'text-slate-400')}`}>Vale escrever do seu jeito. Se travar, toque numa sugestão e use como ponto de partida.</p>
                        <textarea
                            value={sensation}
                            onChange={(e) => setSensation(e.target.value)}
                            placeholder="Ex.: sinto um peso nos ombros e um nó na garganta..."
                            className={`w-full p-4 rounded-[1.5rem] border min-h-[120px] resize-none focus:outline-none transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`}
                        />
                        <div className="flex flex-wrap gap-2 mt-4">
                            {bodySuggestions.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => addSuggestion(item, setSensation, sensation)}
                                    className={`px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${c('bg-sky-50 text-sky-700 border border-sky-100', 'bg-slate-900 text-sky-300 border border-slate-700')}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up">
                        <h3 className={`text-xl font-bold mb-2 ${c('text-gray-800', 'text-white')}`}>O que sua mente está repetindo agora?</h3>
                        <p className={`text-sm mb-6 ${c('text-gray-500', 'text-slate-400')}`}>Não precisa soar bonito nem organizado. O importante é chegar perto do que está mais presente.</p>
                        <textarea
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                            placeholder="Ex.: estou pensando que não vou dar conta de tudo hoje..."
                            className={`w-full p-4 rounded-[1.5rem] border min-h-[120px] resize-none focus:outline-none transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`}
                        />
                        <div className="flex flex-wrap gap-2 mt-4">
                            {thoughtSuggestions.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => addSuggestion(item, setThought, thought)}
                                    className={`px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${c('bg-violet-50 text-violet-700 border border-violet-100', 'bg-slate-900 text-violet-300 border border-slate-700')}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-slide-up">
                        <h3 className={`text-xl font-bold mb-2 ${c('text-gray-800', 'text-white')}`}>Que nome chega mais perto do que você está sentindo?</h3>
                        <p className={`text-sm mb-6 ${c('text-gray-500', 'text-slate-400')}`}>Você pode usar sua própria palavra ou tocar numa sugestão. Isso não precisa ser perfeito, só verdadeiro o bastante para agora.</p>
                        <input
                            type="text"
                            value={possibleEmotion}
                            onChange={(e) => setPossibleEmotion(e.target.value)}
                            placeholder="Ex.: ansiedade, sobrecarga, insegurança..."
                            className={`w-full p-4 rounded-[1.5rem] border focus:outline-none transition-all ${c('bg-gray-50 border-gray-200 focus:bg-white', 'bg-slate-900/50 border-slate-600 text-white')}`}
                        />
                        <div className="flex flex-wrap gap-2 mt-4">
                            {emotionSuggestions.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setPossibleEmotion(item)}
                                    className={`px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${c('bg-emerald-50 text-emerald-700 border border-emerald-100', 'bg-slate-900 text-emerald-300 border border-slate-700')}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>

                        <div className={`rounded-[2rem] p-5 mt-6 ${c('bg-slate-50 border border-slate-100', 'bg-slate-900/70 border border-slate-700')}`}>
                            <p className={`text-xs font-black uppercase tracking-wider mb-2 ${c('text-slate-500', 'text-slate-400')}`}>Espelho do momento</p>
                            <p className={`text-sm font-medium leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                                {emotionalSummary || 'Seu resumo vai aparecer aqui conforme você avança.'}
                            </p>
                            {possibleEmotion.trim() && (
                                <div className={`mt-4 rounded-[1.4rem] px-4 py-3 ${c('bg-white border border-slate-200', 'bg-slate-800 border border-slate-700')}`}>
                                    <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${c('text-emerald-600', 'text-emerald-300')}`}>Nome mais próximo</p>
                                    <p className={`mt-1 text-base font-black ${c('text-slate-900', 'text-slate-100')}`}>{possibleEmotion.trim()}</p>
                                    <p className={`mt-1 text-xs font-semibold leading-relaxed ${c('text-slate-500', 'text-slate-400')}`}>
                                        Isso pode ser só um ponto de partida. Você pode ajustar depois, se quiser.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                {step > 1 && (
                    <button onClick={prev} className={`flex-1 py-3 rounded-xl font-bold border ${c('border-gray-200 text-gray-600', 'border-slate-600 text-slate-300')}`}>
                        Voltar
                    </button>
                )}
                {step < 3 && (
                    <button
                        onClick={next}
                        disabled={!canContinue}
                        className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próximo
                    </button>
                )}
                {step === 3 && (
                    <button
                        onClick={finish}
                        className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        Usar esse nome
                    </button>
                )}
            </div>
        </div>
    );
}
