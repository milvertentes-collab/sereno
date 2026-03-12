'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AssertivenessSectionProps {
    darkMode?: boolean;
}

export default function AssertivenessSection({ darkMode: dm }: AssertivenessSectionProps) {
    const [activeTab, setActiveTab] = useState<'intro' | 'why' | 'benefits' | 'how' | 'practice'>('intro');

    // Chat state
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Sou sua treinadora de assertividade. Vou apresentar 10 situações difíceis para você treinar o seu "NÃO". Pronta para começar a Situação 1?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeTab]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
                    mode: 'assertiveness'
                }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Desculpe, deu um erro. Pode repetir?' }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, problemas técnicos. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const c = (base: string, dark: string) => dm ? dark : base;

    const tabs = [
        { id: 'intro', label: 'Início', emoji: '🛑' },
        { id: 'why', label: 'Por que é difícil?', emoji: '🤔' },
        { id: 'benefits', label: 'O que muda?', emoji: '✨' },
        { id: 'how', label: 'Como dizer', emoji: '🗣️' },
        { id: 'practice', label: 'Treino Prático', emoji: '💬' },
    ] as const;

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <div className="text-center mb-8 pt-4">
                <span className="text-6xl block mb-4 filter drop-shadow-md">🛑</span>
                <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${c('text-gray-900', 'text-white')}`}>O Poder do NÃO</h2>
                <p className={`text-sm font-medium ${c('text-gray-600', 'text-gray-400')}`}>Como se Posicionar sem Culpa</p>
            </div>

            {/* Tabs Navigation */}
            <div className="relative mb-6">
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent dark:from-gray-900 z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent dark:from-gray-900 z-10 pointer-events-none" />
                <div className={`flex overflow-x-auto gap-2 pb-2 pl-2 pr-2 scrollbar-hide`}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : c('bg-gray-50 text-gray-600 border border-gray-200/50 hover:bg-gray-100', 'bg-gray-800 text-gray-300 border border-gray-700/50 hover:bg-gray-700')
                                }`}
                        >
                            <span className="text-base">{tab.emoji}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4">

                {/* Intro */}
                {activeTab === 'intro' && (
                    <div className={`rounded-3xl p-6 shadow-sm border animate-slide-up backdrop-blur-sm ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                        <h3 className={`text-xl font-bold mb-4 ${c('text-gray-900', 'text-white')}`}>Minutos de Paz</h3>
                        <p className={`mb-4 leading-relaxed font-medium ${c('text-gray-600', 'text-gray-300')}`}>
                            Você já disse "sim" quando, no fundo, queria gritar um "NÃO" bem alto?
                        </p>
                        <p className={`mb-4 leading-relaxed font-medium ${c('text-gray-600', 'text-gray-300')}`}>
                            Seja para evitar conflitos, por medo de decepcionar ou até por costume, acabamos assumindo
                            compromissos que nos sobrecarregam.
                        </p>
                        <div className={`p-5 mt-6 rounded-2xl border-l-4 border-l-blue-500 shadow-sm ${c('bg-blue-50', 'bg-blue-900/20 text-blue-100')}`}>
                            <p className={`font-bold text-sm leading-relaxed ${c('text-blue-800', 'text-blue-200')}`}>
                                💡 Aqui vai uma verdade importante: dizer "não" é essencial para sua saúde emocional!
                            </p>
                        </div>
                    </div>
                )}

                {/* Why is it hard */}
                {activeTab === 'why' && (
                    <div className={`rounded-3xl p-6 shadow-sm border animate-slide-up backdrop-blur-sm ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                        <h3 className={`text-xl font-bold mb-4 ${c('text-gray-900', 'text-white')}`}>Por que é tão difícil dizer "não"?</h3>

                        <p className={`mb-6 leading-relaxed font-medium ${c('text-gray-600', 'text-gray-300')}`}>
                            A gente tende a confundir <strong>recusar um pedido</strong> com <strong>rejeitar uma pessoa</strong>.
                            Queremos ser aceitos, pertencer, evitar julgamentos.
                        </p>

                        <div className={`p-6 rounded-2xl border relative overflow-hidden ${c('bg-stone-50 border-stone-200', 'bg-gray-900/50 border-gray-800')}`}>
                            <div className="absolute -right-4 -top-8 text-8xl text-stone-200 dark:text-gray-800 pointer-events-none opacity-50 font-serif">"</div>
                            <p className={`text-lg italic font-medium leading-relaxed mb-4 relative z-10 ${c('text-gray-700', 'text-gray-300')}`}>
                                "Você tem o direito de dizer não sem se sentir culpado."
                            </p>
                            <p className={`text-sm font-bold text-right relative z-10 ${c('text-stone-500', 'text-stone-400')}`}>
                                — Dr. Manuel J. Smith
                            </p>
                        </div>

                        <p className={`mt-6 leading-relaxed font-bold text-sm ${c('text-blue-600', 'text-blue-400')}`}>
                            ✨ Aprender a impor limites fortalece sua autoestima e melhora suas relações!
                        </p>
                    </div>
                )}

                {/* Benefits */}
                {activeTab === 'benefits' && (
                    <div className="space-y-4 animate-slide-up">
                        <h3 className={`text-xl font-bold mb-4 ml-1 pl-2 ${c('text-gray-900', 'text-white')}`}>O que muda ao dizer "não"?</h3>

                        <div className={`flex gap-4 p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.02] ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-2xl filter drop-shadow-sm">
                                🧘
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className={`font-bold mb-1 ${c('text-gray-900', 'text-gray-100')}`}>Menos estresse, mais paz</h4>
                                <p className={`text-xs font-medium leading-relaxed mt-1 ${c('text-gray-600', 'text-gray-400')}`}>Você cuida da sua saúde mental ao não se sobrecarregar.</p>
                            </div>
                        </div>

                        <div className={`flex gap-4 p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.02] ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl filter drop-shadow-sm">
                                ⏳
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className={`font-bold mb-1 ${c('text-gray-900', 'text-gray-100')}`}>Tempo para o que importa</h4>
                                <p className={`text-xs font-medium leading-relaxed mt-1 ${c('text-gray-600', 'text-gray-400')}`}>Suas próprias prioridades passam a ser respeitadas.</p>
                            </div>
                        </div>

                        <div className={`flex gap-4 p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.02] ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-2xl filter drop-shadow-sm">
                                🤝
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className={`font-bold mb-1 ${c('text-gray-900', 'text-gray-100')}`}>Relações mais autênticas</h4>
                                <p className={`text-xs font-medium leading-relaxed mt-1 ${c('text-gray-600', 'text-gray-400')}`}>Quem gosta de você de verdade entende e aceita seus limites.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* How to do it */}
                {activeTab === 'how' && (
                    <div className="space-y-4 animate-slide-up">
                        <div className={`p-4 rounded-2xl mb-2 border shadow-sm ${c('bg-indigo-50 border-indigo-100 text-indigo-800', 'bg-indigo-900/40 border-indigo-800/50 text-indigo-200')}`}>
                            <p className="font-bold text-sm leading-relaxed text-center">Ainda sente dificuldade? Experimente estas estratégias para dizer "não" sem culpa:</p>
                        </div>

                        <div className={`rounded-3xl p-6 border shadow-sm ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                            <h4 className={`text-lg font-bold mb-3 flex items-center gap-2 ${c('text-gray-900', 'text-white')}`}>
                                <span className="text-2xl filter drop-shadow-sm">🎯</span> 1. Seja direto(a)
                            </h4>
                            <p className={`text-sm font-medium mb-4 leading-relaxed ${c('text-gray-600', 'text-gray-400')}`}>
                                Nada de justificativas longas! Se explicar demais, a pessoa pode tentar "resolver" sua desculpa.
                            </p>
                            <div className={`p-4 rounded-xl text-sm font-bold shadow-inner ${c('bg-gray-100 text-gray-800', 'bg-gray-900/50 text-gray-200')}`}>
                                "Infelizmente, não posso assumir isso agora."
                            </div>
                        </div>

                        <div className={`rounded-3xl p-6 border shadow-sm ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                            <h4 className={`text-lg font-bold mb-3 flex items-center gap-2 ${c('text-gray-900', 'text-white')}`}>
                                <span className="text-2xl filter drop-shadow-sm">🔄</span> 2. Ofereça alternativa
                            </h4>
                            <p className={`text-sm font-medium mb-4 leading-relaxed ${c('text-gray-600', 'text-gray-400')}`}>
                                Mostre boa vontade sem assumir a tarefa imediatamente.
                            </p>
                            <div className={`p-4 rounded-xl text-sm font-bold shadow-inner ${c('bg-gray-100 text-gray-800', 'bg-gray-900/50 text-gray-200')}`}>
                                "Hoje não consigo, mas amanhã posso ajudar com outra parte."
                            </div>
                        </div>

                        <div className={`rounded-3xl p-6 border shadow-sm ${c('bg-white/90 border-gray-100', 'bg-gray-800/90 border-gray-700')}`}>
                            <h4 className={`text-lg font-bold mb-3 flex items-center gap-2 ${c('text-gray-900', 'text-white')}`}>
                                <span className="text-2xl filter drop-shadow-sm">💿</span> 3. O "Disco Arranhado"
                            </h4>
                            <p className={`text-sm font-medium mb-5 leading-relaxed ${c('text-gray-600', 'text-gray-400')}`}>
                                Técnica clássica: repita sua resposta de forma calma e firme, sem mudar sua posição.
                            </p>

                            <div className="space-y-4 bg-gray-50/50 dark:bg-gray-900/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="flex flex-col gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${c('text-gray-400', 'text-gray-500')}`}>Colega</span>
                                    <div className={`py-3 px-4 rounded-2xl rounded-tl-sm max-w-[90%] self-start shadow-sm border ${c('bg-white border-gray-200 text-gray-800', 'bg-gray-800 border-gray-700 text-white')}`}>
                                        <p className="text-sm font-medium">"Você faz meu plantão hoje?"</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider text-right ${c('text-blue-500', 'text-blue-400')}`}>Você</span>
                                    <div className={`py-3 px-4 rounded-2xl rounded-tr-sm max-w-[90%] self-end shadow-sm ${c('bg-gradient-to-r from-blue-600 to-blue-500 text-white', 'bg-gradient-to-r from-blue-700 to-blue-600 text-white')}`}>
                                        <p className="text-sm font-bold">"Hoje não posso."</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${c('text-gray-400', 'text-gray-500')}`}>Colega</span>
                                    <div className={`py-3 px-4 rounded-2xl rounded-tl-sm max-w-[90%] self-start shadow-sm border ${c('bg-white border-gray-200 text-gray-800', 'bg-gray-800 border-gray-700 text-white')}`}>
                                        <p className="text-sm font-medium">"Ah, mas é rapidinho! Quebra essa."</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider text-right ${c('text-blue-500', 'text-blue-400')}`}>Você</span>
                                    <div className={`py-3 px-4 rounded-2xl rounded-tr-sm max-w-[90%] self-end shadow-sm ${c('bg-gradient-to-r from-blue-600 to-blue-500 text-white', 'bg-gradient-to-r from-blue-700 to-blue-600 text-white')}`}>
                                        <p className="text-sm font-bold">"Entendo, mas hoje não posso."</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center px-4 pb-2 animate-fade-in">
                            <h3 className={`font-extrabold text-lg mb-2 flex items-center justify-center gap-2 ${c('text-rose-600', 'text-rose-400')}`}>
                                <span className="text-2xl filter drop-shadow-sm">❤️</span> Dizer "não" é amor-próprio!
                            </h3>
                            <p className={`text-sm font-medium leading-relaxed ${c('text-gray-600', 'text-gray-400')}`}>
                                Na aba "Treino Prático", você pode começar a treinar agora mesmo com a Inteligência Artificial.
                            </p>
                            <button onClick={() => setActiveTab('practice')} className="hidden mt-4 mx-auto py-2.5 px-6 rounded-xl bg-blue-100 text-blue-700 font-bold active:scale-95 transition-all text-sm">
                                Treinar Agora
                            </button>
                        </div>
                    </div>
                )}

                {/* Practice Chat */}
                {activeTab === 'practice' && (
                    <div className={`rounded-3xl border shadow-lg flex flex-col h-[650px] max-h-[75vh] animate-slide-up overflow-hidden ${c('bg-white border-gray-100', 'bg-gray-800 border-gray-700')}`}>
                        {/* Chat Header */}
                        <div className={`p-5 flex items-center gap-4 ${c('bg-gradient-to-r from-slate-50 to-white border-b border-gray-100', 'bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700')}`}>
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl filter drop-shadow-sm">
                                🛡️
                            </div>
                            <div>
                                <h3 className={`font-extrabold text-base tracking-tight ${c('text-gray-900', 'text-white')}`}>Simulador Prático</h3>
                                <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${c('text-blue-600', 'text-blue-400')}`}>IA Treinadora</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-5 ${dm ? 'bg-gray-900/20' : 'bg-gray-50/50'}`}>
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-3xl p-4 text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? `rounded-br-sm ${c('bg-gradient-to-r from-blue-600 to-blue-500 text-white', 'bg-gradient-to-r from-blue-700 to-blue-600 text-white')}`
                                        : `rounded-bl-sm border ${c('bg-white border-gray-200 text-gray-800', 'bg-gray-800 border-gray-700 text-gray-200')}`
                                        }`}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className={`max-w-[85%] rounded-3xl rounded-bl-sm p-5 border shadow-sm ${c('bg-white border-gray-200', 'bg-gray-800 border-gray-700')}`}>
                                        <div className="flex gap-1.5 items-center h-4">
                                            <span className="w-2.5 h-2.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                            <span className="w-2.5 h-2.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                            <span className="w-2.5 h-2.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Input Area */}
                        <div className={`p-4 border-t ${c('border-gray-100 bg-white', 'border-gray-700 bg-gray-800')}`}>
                            <div className="flex gap-2 relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Comece dizendo NÃO..."
                                    className={`flex-1 pl-5 pr-12 py-4 rounded-2xl border text-sm font-medium outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50 ${c('bg-gray-50 border-gray-200 text-gray-900 focus:bg-white', 'bg-gray-900/50 border-gray-600 text-white')}`}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isLoading || !input.trim()}
                                    className={`absolute right-2 top-2 bottom-2 aspect-square rounded-xl flex items-center justify-center text-white transition-all ${(!input.trim() || isLoading) ? 'bg-gray-200 text-gray-400 dark:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700 active:scale-90 shadow-md'}`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
