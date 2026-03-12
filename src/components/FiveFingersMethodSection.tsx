
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';

type Step = 'intro' | 'thumb' | 'index' | 'middle' | 'ring' | 'little' | 'final';

interface FiveFingersMethodSectionProps {
    darkMode?: boolean;
    initialStep?: string;
    onStepChange?: (step: string) => void;
}

export default function FiveFingersMethodSection({ darkMode, initialStep, onStepChange }: FiveFingersMethodSectionProps) {
    const [step, setStep] = useState<Step>((initialStep as Step) || 'intro');
    const [answers, setAnswers] = useState({
        thumbSelf: '',
        thumbOther: '',
        indexFact: '',
        middleFeeling: '',
        ringNeed: '',
        littleRequest: ''
    });

    const changeStep = (newStep: Step) => {
        setStep(newStep);
        if (onStepChange) onStepChange(newStep);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('pt-BR');

        // Estilos e Configurações
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text("Resumo: Método dos 5 Dedos", 20, 30);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`Data da prática: ${dateStr}`, 20, 40);

        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.line(20, 45, 190, 45);

        let yPos = 60;

        const sections = [
            { label: '1. POLEGAR (Reconhecimento)', text: `${answers.thumbSelf} | ${answers.thumbOther}`, icon: 'Reconheca' },
            { label: '2. INDICADOR (O Fato)', text: answers.indexFact, icon: 'Aponte' },
            { label: '3. MÉDIO (O Sentimento)', text: answers.middleFeeling, icon: 'Sinta' },
            { label: '4. ANELAR (Necessidade)', text: answers.ringNeed, icon: 'Valorize' },
            { label: '5. MINDINHO (Pedido/Combinado)', text: answers.littleRequest, icon: 'Peca' },
        ];

        sections.forEach((section) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59); // Slate-800
            doc.text(section.label, 20, yPos);

            yPos += 8;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(71, 85, 105); // Slate-600

            const splitContent = doc.splitTextToSize(section.text || "Não preenchido", 160);
            doc.text(splitContent, 20, yPos);

            yPos += (splitContent.length * 7) + 12;

            if (yPos > 270) {
                doc.addPage();
                yPos = 30;
            }
        });

        doc.save(`metodo_5_dedos_${dateStr.replace(/\//g, '-')}.pdf`);
    };

    useEffect(() => {
        if (initialStep && initialStep !== step) {
            setStep(initialStep as Step);
        }
    }, [initialStep]);

    const renderHandAnimate = (activeFinger: string) => {
        // Simple hand visualization with CSS
        return (
            <div className="flex justify-center items-end h-40 mb-8 relative">
                <div className="flex items-end gap-2 px-6">
                    {/* Hand Palm Area */}
                    <div className={`absolute bottom-0 w-32 h-20 rounded-t-[3rem] ${darkMode ? 'bg-slate-700' : 'bg-orange-100'} border-x-2 border-t-2 ${darkMode ? 'border-slate-600' : 'border-orange-200'}`}></div>

                    {/* Fingers */}
                    {['little', 'ring', 'middle', 'index', 'thumb'].reverse().map((f) => {
                        const isActive = activeFinger === f;
                        const heights: Record<string, string> = {
                            thumb: 'h-16',
                            index: 'h-24',
                            middle: 'h-28',
                            ring: 'h-24',
                            little: 'h-16'
                        };
                        const leftPos: Record<string, string> = {
                            thumb: '-left-4',
                            index: 'left-6',
                            middle: 'left-14',
                            ring: 'left-22',
                            little: 'left-30'
                        };

                        return (
                            <div
                                key={f}
                                className={`absolute bottom-16 rounded-full transition-all duration-500 border-2 ${leftPos[f]} ${heights[f]} w-6 ${isActive
                                    ? (darkMode ? 'bg-indigo-500 border-indigo-400 -translate-y-4 scale-110 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-indigo-400 border-indigo-300 -translate-y-4 scale-110 shadow-lg')
                                    : (darkMode ? 'bg-slate-700 border-slate-600 h-8 opacity-40' : 'bg-orange-100 border-orange-200 h-8 opacity-40')
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap animate-bounce">
                                        Este dedo!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const handleNext = () => {
        const sequence: Step[] = ['intro', 'thumb', 'index', 'middle', 'ring', 'little', 'final'];
        const currentIndex = sequence.indexOf(step);
        if (currentIndex < sequence.length - 1) {
            changeStep(sequence[currentIndex + 1]);
        }
    };

    if (step === 'intro') {
        return (
            <div className="p-6 space-y-8 animate-fade-in text-center flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-6xl mb-4 animate-bounce">✋</div>
                <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Método dos 5 Dedos</h2>
                <p className={`text-lg leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Use sua mão como guia para se entender melhor e se comunicar com mais clareza, respeito e consciência.
                </p>
                <button
                    onClick={handleNext}
                    className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-xl shadow-xl active:scale-95 transition-all mt-8"
                >
                    Começar Prática
                </button>
            </div>
        );
    }

    const stepContent: Record<string, {
        title: string;
        questions: string[];
        placeholders: string[];
        fields: string[];
        chips?: string[];
    }> = {
        thumb: {
            title: '👍 Reconheça uma qualidade',
            questions: ['O que eu posso reconhecer de bom em mim neste momento?', 'O que eu posso reconhecer no outro, mesmo com a dificuldade?'],
            placeholders: ['Em mim...', 'No outro...'],
            fields: ['thumbSelf', 'thumbOther']
        },
        index: {
            title: '👉 Aponte o fato',
            questions: ['O que aconteceu de forma objetiva?', 'Qual é o fato, sem exagero e sem acusação?'],
            placeholders: ['Quando isso aconteceu...'],
            fields: ['indexFact']
        },
        middle: {
            title: '🖕 Expresse o sentimento',
            questions: ['O que eu senti?', 'Qual foi o impacto emocional disso em mim?'],
            placeholders: ['Eu me senti...'],
            fields: ['middleFeeling'],
            chips: ['Tristeza', 'Raiva', 'Frustração', 'Medo', 'Ansiedade', 'Culpa', 'Vergonha', 'Confusão', 'Decepção', 'Alívio']
        },
        ring: {
            title: '💍 Necessidade ou valor',
            questions: ['O que isso tocou em mim?', 'O que eu preciso?', 'O que é importante para mim aqui?'],
            placeholders: ['Eu preciso...', 'Eu valorizo...'],
            fields: ['ringNeed']
        },
        little: {
            title: '🤏 Pequeno Combinado',
            questions: ['O que eu quero pedir?', 'Qual é o próximo passo mais simples e claro?'],
            placeholders: ['Da próxima vez, eu peço que...', 'O que eu gostaria agora é...'],
            fields: ['littleRequest']
        }
    };

    if (step === 'final') {
        return (
            <div className="p-6 space-y-8 animate-fade-in max-w-lg mx-auto pb-32">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-2">✨</div>
                    <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Síntese da Consciência</h2>
                    <p className="text-sm opacity-60">Sua estrutura de comunicação está pronta</p>
                </div>

                <div className="space-y-4">
                    {[
                        { label: 'Reconhecimento', text: `${answers.thumbSelf} | ${answers.thumbOther}`, icon: '👍' },
                        { label: 'O Fato', text: answers.indexFact, icon: '👉' },
                        { label: 'O Sentimento', text: answers.middleFeeling, icon: '🖕' },
                        { label: 'Necessidade', text: answers.ringNeed, icon: '💍' },
                        { label: 'Pedido/Combinado', text: answers.littleRequest, icon: '🤏' },
                    ].map((item, i) => (
                        <div key={i} className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-500">{item.label}</span>
                            </div>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.text || 'Não preenchido'}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-3 mt-8">
                    <button
                        onClick={downloadPDF}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Baixar em PDF
                    </button>

                    <button
                        onClick={() => changeStep('intro')}
                        className={`w-full py-5 rounded-[2rem] font-bold text-lg active:scale-95 transition-all ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            }`}
                    >
                        Finalizar e Voltar
                    </button>
                </div>
            </div>
        );
    }

    const current = stepContent[step as keyof typeof stepContent];

    return (
        <div className="p-6 space-y-6 animate-fade-in max-w-lg mx-auto pb-32">
            {renderHandAnimate(step)}

            <div className="text-center space-y-2">
                <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{current.title}</h2>
                <div className="space-y-1">
                    {current.questions.map((q, i) => (
                        <p key={i} className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{q}</p>
                    ))}
                </div>
            </div>

            <div className="space-y-4 pt-4">
                {current.fields.map((field, i) => (
                    <textarea
                        key={field}
                        value={(answers as any)[field]}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [field]: e.target.value }))}
                        placeholder={current.placeholders[i] || current.placeholders[0]}
                        className={`w-full p-6 rounded-[2rem] border-2 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[120px] resize-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-100 text-slate-800 placeholder-slate-400 shadow-inner'
                            }`}
                    />
                ))}

                {current.chips && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {current.chips.map(chip => (
                            <button
                                key={chip}
                                onClick={() => setAnswers(prev => ({ ...prev, middleFeeling: prev.middleFeeling ? `${prev.middleFeeling}, ${chip.toLowerCase()}` : chip }))}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                    }`}
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-8">
                <button
                    onClick={handleNext}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-xl shadow-xl active:scale-95 transition-all"
                >
                    {step === 'little' ? 'Ver Síntese' : 'Próximo Dedo'}
                </button>
            </div>
        </div>
    );
}
