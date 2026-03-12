'use client';

import React, { useState } from 'react';

type LoveLanguage = 'words' | 'service' | 'gifts' | 'time' | 'touch';

const receivingQuestions = [
    {
        id: 'r1', text: 'Eu me sinto mais amado(a) quando...', options: [
            { label: 'Alguém me elogia ou diz que me admira.', value: 'words' },
            { label: 'Alguém me ajuda com uma tarefa difícil.', value: 'service' },
            { label: 'Recebo um presente inesperado.', value: 'gifts' },
            { label: 'Passamos um tempo de qualidade juntos, sem distrações.', value: 'time' },
            { label: 'Recebo um abraço apertado ou carinho físico.', value: 'touch' }
        ]
    },
    {
        id: 'r2', text: 'Meu dia fica melhor se...', options: [
            { label: 'Alguém me manda uma mensagem de apoio.', value: 'words' },
            { label: 'Alguém faz um favor para mim sem eu pedir.', value: 'service' },
            { label: 'Alguém me traz minha comida favorita ou um mimo.', value: 'gifts' },
            { label: 'Alguém tira um momento apenas para conversar comigo.', value: 'time' },
            { label: 'Alguém faz cafuné ou me dá as mãos.', value: 'touch' }
        ]
    },
    {
        id: 'r3', text: 'Nas amizades, valorizo mais quando...', options: [
            { label: 'Reconhecem minhas qualidades verbalmente.', value: 'words' },
            { label: 'Estão lá para me ajudar a mudar ou arrumar algo.', value: 'service' },
            { label: 'Lembram de mim e me trazem uma lembrancinha.', value: 'gifts' },
            { label: 'Saímos para fazer algo juntos, só nós.', value: 'time' },
            { label: 'Me abraçam forte quando nos encontramos.', value: 'touch' }
        ]
    },
    {
        id: 'r4', text: 'A melhor forma de me pedir desculpas é...', options: [
            { label: 'Reconhecendo o erro com palavras sinceras.', value: 'words' },
            { label: 'Tentando consertar o problema de forma prática.', value: 'service' },
            { label: 'Me surpreendendo com um pedido de desculpas e um pequeno presente.', value: 'gifts' },
            { label: 'Sentando comigo para conversar abertamente.', value: 'time' },
            { label: 'Me abraçando e pedindo perdão.', value: 'touch' }
        ]
    },
    {
        id: 'r5', text: 'Em um dia ruim, o que mais me conforta é...', options: [
            { label: 'Ouvir que tudo vai ficar bem e que sou forte.', value: 'words' },
            { label: 'Alguém assumir minhas responsabilidades.', value: 'service' },
            { label: 'Alguém me dar algo que eu gosto muito.', value: 'gifts' },
            { label: 'Ter apenas a companhia de alguém ao meu lado.', value: 'time' },
            { label: 'Ficar envolvido no abraço de alguém.', value: 'touch' }
        ]
    }
];

const offeringQuestions = [
    {
        id: 'o1', text: 'Quando quero demonstrar que gosto de alguém, eu costumo...', options: [
            { label: 'Dizer o quanto a pessoa é importante para mim.', value: 'words' },
            { label: 'Fazer algo para facilitar o dia dela.', value: 'service' },
            { label: 'Comprar ou fazer algo de presente para ela.', value: 'gifts' },
            { label: 'Convidar a pessoa para sair ou fazer algo juntos.', value: 'time' },
            { label: 'Abraçá-la ou demonstrar afeto físico constante.', value: 'touch' }
        ]
    },
    {
        id: 'o2', text: 'Meu maior gesto de cuidado com um amigo é...', options: [
            { label: 'Elogiar e apoiar em suas decisões.', value: 'words' },
            { label: 'Ajudar em alguma dificuldade prática (ex: mudança, conserto).', value: 'service' },
            { label: 'Presentear em datas não comemorativas só para agradar.', value: 'gifts' },
            { label: 'Ouvir e dar toda a minha atenção por horas.', value: 'time' },
            { label: 'Sempre cumprimentar com carinho e calor.', value: 'touch' }
        ]
    },
    {
        id: 'o3', text: 'Se meu parceiro(a) estiver exausto(a), a primeira coisa que faço é...', options: [
            { label: 'Incentivar com palavras amorosas e de valorização.', value: 'words' },
            { label: 'Lavar a louça ou fazer a comida para ele(a).', value: 'service' },
            { label: 'Comprar a sobremesa ou bebida favorita.', value: 'gifts' },
            { label: 'Sentar ao lado para fazer companhia.', value: 'time' },
            { label: 'Fazer uma massagem nos ombros.', value: 'touch' }
        ]
    },
    {
        id: 'o4', text: 'Nas relações com a família, eu costumo me destacar por...', options: [
            { label: 'Sempre expressar gratidão e orgulho.', value: 'words' },
            { label: 'Sempre ser quem organiza ou resolve os problemas burocráticos.', value: 'service' },
            { label: 'Sempre aparecer com lembrancinhas para todos.', value: 'gifts' },
            { label: 'Sempre planejar encontros, viagens ou jantares.', value: 'time' },
            { label: 'Ser a pessoa mais carinhosa e beijoqueira.', value: 'touch' }
        ]
    },
    {
        id: 'o5', text: 'Para me reconciliar com alguém que amo, eu geralmente...', options: [
            { label: 'Escrevo uma mensagem longa ou me expresso verbalmente.', value: 'words' },
            { label: 'Faço um favor que sei que a pessoa precisa.', value: 'service' },
            { label: 'Dou um pequeno mimo para quebrar o gelo.', value: 'gifts' },
            { label: 'Chamo a pessoa para sair e conversar calmamente.', value: 'time' },
            { label: 'Dou um abraço forte como pedido de paz.', value: 'touch' }
        ]
    }
];

const languageDescriptions: Record<LoveLanguage, { name: string, rxDesc: string, txDesc: string, emoji: string }> = {
    words: { name: 'Palavras de Afirmação', rxDesc: 'Você valoriza elogios, incentivos verbais e palavras de carinho e apoio.', txDesc: 'Você expressa seu afeto com frequência através de elogios, incentivos e palavras de apreciação sinceras.', emoji: '🗣️' },
    service: { name: 'Atos de Serviço', rxDesc: 'Para você, pequenos gestos práticos de ajuda são a maior prova de carinho.', txDesc: 'Você gosta de demonstrar que se importa facilitando a vida do outro — fazendo favores sem que precisem pedir.', emoji: '🛠️' },
    gifts: { name: 'Presentes', rxDesc: 'Você se sente incrivelmente amado quando percebe que alguém lembrou de você (independente do valor do item).', txDesc: 'Você ama demonstrar afeto trazendo presentes, lembrancinhas ou pequenos mimos para alegrar o dia de alguém.', emoji: '🎁' },
    time: { name: 'Tempo de Qualidade', rxDesc: 'Ter a atenção total de alguém, sem distrações do celular, é o que faz você se sentir mais conectado e amado.', txDesc: 'Você oferece o seu tempo livre com dedicação total para ouvir ou fazer algo especial junto de quem você ama.', emoji: '⏳' },
    touch: { name: 'Toque Físico', rxDesc: 'Você se sente seguro, calmo e profundamente amado através de contatos físicos como abraços e beijos.', txDesc: 'Você é muito expressivo fisicamente e demonstra afeto através de muita proximidade corporal, carinhos e abraços.', emoji: '🫂' }
};

export default function LoveLanguagesSection({ darkMode: dm }: { darkMode?: boolean }) {
    const [currentStep, setCurrentStep] = useState<'intro' | 'receiving' | 'offering' | 'results'>('intro');
    const [receivingAnswers, setReceivingAnswers] = useState<Record<string, LoveLanguage>>({});
    const [offeringAnswers, setOfferingAnswers] = useState<Record<string, LoveLanguage>>({});

    const handleAnswer = (type: 'receiving' | 'offering', qId: string, value: LoveLanguage) => {
        if (type === 'receiving') {
            setReceivingAnswers(prev => ({ ...prev, [qId]: value }));
        } else {
            setOfferingAnswers(prev => ({ ...prev, [qId]: value }));
        }
    };

    const getDominantLanguage = (answers: Record<string, LoveLanguage>): keyof typeof languageDescriptions | null => {
        const counts = Object.values(answers).reduce((acc, lang) => {
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        if (Object.keys(counts).length === 0) return null;

        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as LoveLanguage;
    };

    const startQuiz = () => setCurrentStep('receiving');

    const nextSection = () => {
        if (Object.keys(receivingAnswers).length < receivingQuestions.length) {
            alert('Responda todas as perguntas antes de avançar.');
            return;
        }
        setCurrentStep('offering');
    };

    const showResults = () => {
        if (Object.keys(offeringAnswers).length < offeringQuestions.length) {
            alert('Responda todas as perguntas para ver o resultado.');
            return;
        }
        setCurrentStep('results');
    };

    if (currentStep === 'intro') {
        return (
            <div className={`p-6 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-rose-50 to-white text-gray-800'}`}>
                <div className="text-center pt-8 mb-8">
                    <span className="text-6xl mb-4 block filter drop-shadow-md">💖</span>
                    <h2 className={`text-4xl font-extrabold tracking-tight ${dm ? 'text-rose-400' : 'text-rose-600'}`}>Linguagens do Amor</h2>
                    <p className={`mt-4 font-medium leading-relaxed max-w-md mx-auto ${dm ? 'text-slate-400' : 'text-gray-600'}`}>
                        Cada pessoa percebe carinho de um jeito. Entender como você gosta de receber e oferecer afeto pode melhorar seus relacionamentos e aumentar sua consciência emocional.
                    </p>
                </div>

                <button
                    onClick={startQuiz}
                    className={`w-full max-w-sm mx-auto block py-5 rounded-3xl font-extrabold shadow-lg hover:shadow-xl transition-all active:scale-95 text-white ${dm ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`}
                >
                    Descobrir Minhas Linguagens
                </button>
            </div>
        );
    }

    if (currentStep === 'results') {
        const rxLang = getDominantLanguage(receivingAnswers);
        const txLang = getDominantLanguage(offeringAnswers);

        if (!rxLang || !txLang) return null;

        return (
            <div className={`p-6 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-rose-50 to-white text-gray-800'}`}>
                <div className="text-center pt-4 mb-8">
                    <h2 className={`text-4xl font-extrabold tracking-tight mb-2 ${dm ? 'text-slate-100' : 'text-gray-800'}`}>Sua Forma de Amar</h2>
                    <p className={`font-medium ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Resultado da sua avaliação emocional</p>
                </div>

                <div className="space-y-6 max-w-xl mx-auto">
                    {/* Receber */}
                    <div className={`rounded-3xl p-6 border shadow-sm relative overflow-hidden ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-md' : 'bg-white border-rose-100'}`}>
                        <h3 className={`font-bold mb-4 uppercase tracking-widest text-xs ${dm ? 'text-rose-400' : 'text-rose-500'}`}>Como você gosta de RECEBER amor</h3>
                        <div className="flex items-center gap-4 mb-3">
                            <span className="text-5xl">{languageDescriptions[rxLang].emoji}</span>
                            <div>
                                <h4 className={`text-2xl font-extrabold ${dm ? 'text-slate-200' : 'text-gray-900'}`}>{languageDescriptions[rxLang].name}</h4>
                            </div>
                        </div>
                        <p className={`font-medium leading-relaxed ${dm ? 'text-slate-300' : 'text-gray-600'}`}>
                            {languageDescriptions[rxLang].rxDesc}
                        </p>
                    </div>

                    {/* Oferecer */}
                    <div className={`rounded-3xl p-6 border shadow-sm relative overflow-hidden ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-md' : 'bg-white border-rose-100'}`}>
                        <h3 className={`font-bold mb-4 uppercase tracking-widest text-xs ${dm ? 'text-rose-400' : 'text-rose-500'}`}>Como você costuma OFERECER amor</h3>
                        <div className="flex items-center gap-4 mb-3">
                            <span className="text-5xl">{languageDescriptions[txLang].emoji}</span>
                            <div>
                                <h4 className={`text-2xl font-extrabold ${dm ? 'text-slate-200' : 'text-gray-900'}`}>{languageDescriptions[txLang].name}</h4>
                            </div>
                        </div>
                        <p className={`font-medium leading-relaxed ${dm ? 'text-slate-300' : 'text-gray-600'}`}>
                            {languageDescriptions[txLang].txDesc}
                        </p>
                    </div>

                    {/* Reflexão Prática */}
                    <div className={`rounded-3xl p-6 shadow-sm border ${dm ? 'bg-indigo-900/40 border-indigo-800/50' : 'bg-blue-50 border-blue-100'}`}>
                        <h3 className={`font-bold mb-2 flex items-center gap-2 ${dm ? 'text-indigo-300' : 'text-indigo-800'}`}>💡 Ação Prática</h3>
                        <p className={`text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
                            {rxLang === txLang ? (
                                <>
                                    <strong>Sua linguagem de receber e oferecer é a mesma: {languageDescriptions[rxLang].name}.</strong> Isso significa que você costuma demonstrar carinho exatamente da forma como gostaria de ser tratado. Lembre-se, porém, que as outras pessoas podem ter linguagens diferentes. Tente se adaptar para também demonstrar afeto no &quot;idioma&quot; que elas compreendem melhor!
                                </>
                            ) : (
                                <>
                                    <strong>Você prefere receber amor com {languageDescriptions[rxLang].name}, mas oferece através de {languageDescriptions[txLang].name}.</strong> Isso é muito comum! Comunique claramente suas necessidades para quem convive com você. Assim, saberão como te agradar de fato, e você pode ajudá-los a entender as suas formas habituais de expressar afeto.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setCurrentStep('intro');
                        setReceivingAnswers({});
                        setOfferingAnswers({});
                    }}
                    className={`mt-10 mx-auto block px-6 py-3 rounded-xl font-bold transition-all active:scale-95 ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-white text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50'}`}
                >
                    Refazer Teste
                </button>
            </div>
        );
    }

    const questions = currentStep === 'receiving' ? receivingQuestions : offeringQuestions;
    const answers = currentStep === 'receiving' ? receivingAnswers : offeringAnswers;

    return (
        <div className={`p-4 animate-fade-in pb-32 max-w-xl mx-auto min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-gray-800'}`}>
            <div className="mb-6">
                <h2 className={`text-2xl font-extrabold tracking-tight ${dm ? 'text-slate-100' : 'text-gray-900'}`}>
                    {currentStep === 'receiving' ? 'Parte 1: Recebendo Afeto' : 'Parte 2: Oferecendo Afeto'}
                </h2>
                <p className={`font-medium mt-1 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
                    Responda com o que mais soa verdadeiro para você.
                </p>
            </div>

            <div className="space-y-8">
                {questions.map((q, idx) => (
                    <div key={q.id} className={`rounded-3xl p-6 border shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <h3 className={`font-bold mb-4 text-lg ${dm ? 'text-slate-200' : 'text-gray-800'}`}>
                            {idx + 1}. {q.text}
                        </h3>
                        <div className="space-y-3">
                            {q.options.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleAnswer(currentStep, q.id, opt.value as LoveLanguage)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border ${answers[q.id] === opt.value
                                        ? (dm ? 'bg-rose-900/30 border-rose-500 text-rose-200' : 'bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-400')
                                        : (dm ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-rose-50/50 hover:border-rose-200')
                                        }`}
                                >
                                    <span className="font-medium text-sm leading-relaxed">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={currentStep === 'receiving' ? nextSection : showResults}
                className={`w-full mt-8 py-5 rounded-3xl font-extrabold shadow-lg hover:shadow-xl transition-all active:scale-95 text-white ${dm ? 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-[0_0_20px_rgba(225,29,72,0.3)]' : 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_10px_20px_rgba(225,29,72,0.3)]'}`}
            >
                {currentStep === 'receiving' ? 'Próxima Parte 👉' : 'Ver Resultado ✨'}
            </button>
        </div>
    );
}
