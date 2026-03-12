'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

interface HopeMessage {
    id: string;
    text: string;
    date: number;
    color: string;
    icon: string;
}

// Preset positive anonymous messages
const presetMessages: HopeMessage[] = [
    { id: '1', text: 'Você vai passar por essa tempestade, confie.', date: Date.now() - 86400000, color: 'bg-indigo-100 text-indigo-800', icon: '💌' },
    { id: '2', text: 'Não desista. Até as noites mais longas têm fim e o sol sempre volta a brilhar.', date: Date.now() - 172800000, color: 'bg-amber-100 text-amber-800', icon: '☀️' },
    { id: '3', text: 'Seja gentil com você mesmo(a) hoje. Você está fazendo o seu melhor.', date: Date.now() - 259200000, color: 'bg-emerald-100 text-emerald-800', icon: '🌱' },
    { id: '4', text: 'Sua dor importa, mas ela não te define. Tem muita força aí dentro.', date: Date.now() - 345600000, color: 'bg-rose-100 text-rose-800', icon: '💖' },
    { id: '5', text: 'Respira fundo. Um passo de cada vez.', date: Date.now() - 432000000, color: 'bg-blue-100 text-blue-800', icon: '🌬️' }
];

// Moderation rules (Simple word filter for a Client-Side Mock)
const forbiddenWords = [
    // Hate/Offense
    'odeio', 'morte', 'morrer', 'matar', 'lixo', 'idiota', 'burro', 'inútil', 'desgraça',
    // NSFW/Pornography
    'sexo', 'porno', 'puta', 'caralho', 'buceta', 'pinto', 'foda',
    // Political/Religious extremes
    'bolsonaro', 'lula', 'esquerdista', 'direitista', 'comunista', 'fascista', 'deus te castigue', 'pecador', 'inferno'
];

const messageStyles = [
    { bg: 'bg-sky-400', tx: 'text-white', border: 'border-sky-600', icon: '☁️' },
    { bg: 'bg-indigo-500', tx: 'text-white', border: 'border-indigo-700', icon: '💌' },
    { bg: 'bg-emerald-400', tx: 'text-white', border: 'border-emerald-600', icon: '🕊️' },
    { bg: 'bg-rose-400', tx: 'text-white', border: 'border-rose-600', icon: '❤️' },
    { bg: 'bg-amber-400', tx: 'text-white', border: 'border-amber-600', icon: '🌻' },
    { bg: 'bg-purple-400', tx: 'text-white', border: 'border-purple-600', icon: '✨' },
    { bg: 'bg-cyan-400', tx: 'text-white', border: 'border-cyan-600', icon: '🌊' },
    { bg: 'bg-fuchsia-400', tx: 'text-white', border: 'border-fuchsia-600', icon: '🌟' }
];

export default function MuralEsperancaSection({ darkMode: dm, onCheckAccess, onIncrementUsage }: { darkMode?: boolean, onCheckAccess: () => boolean, onIncrementUsage: () => void }) {
    const { toast } = useToast();
    const [messages, setMessages] = useState<HopeMessage[]>(presetMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isWriting, setIsWriting] = useState(false);
    const [receivedMessage, setReceivedMessage] = useState<HopeMessage | null>(null);

    // Randomize initial positions for clouds
    const clouds = useMemo(() => {
        return messages.slice(0, 12).map((msg, i) => ({
            ...msg,
            delay: Math.random() * 5,
            duration: 4 + Math.random() * 4,
            x: (i % 2 === 0 ? -10 : 10) + (Math.random() * 20 - 10),
            y: Math.random() * 20 - 10,
            scale: 0.8 + Math.random() * 0.4
        }));
    }, [messages]);

    useEffect(() => {
        const stored = localStorage.getItem('psico_hope_wall');
        if (stored) {
            setMessages(JSON.parse(stored));
        }
    }, []);

    const checkModeration = (text: string) => {
        const lowerText = text.toLowerCase();
        for (const word of forbiddenWords) {
            if (lowerText.includes(word)) {
                return false;
            }
        }
        return true;
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newMessage.trim();

        if (trimmed.length < 10) {
            toast({ title: "Mensagem curta", description: "Escreva algo um pouco maior para apoiar alguém.", variant: "destructive" });
            return;
        }

        if (!checkModeration(trimmed)) {
            toast({
                title: "Conteúdo Bloqueado",
                description: "Sua mensagem fere as diretrizes da comunidade (conteúdo impróprio, ódio ou polêmico). Mantenha o foco em apoio e bem-estar.",
                variant: "destructive"
            });
            return;
        }

        if (!onCheckAccess()) return;

        const style = messageStyles[Math.floor(Math.random() * messageStyles.length)];
        const newMsg: HopeMessage = {
            id: Date.now().toString(),
            text: trimmed,
            date: Date.now(),
            color: `${style.bg} ${style.tx} ${style.border}`,
            icon: style.icon
        };

        const updatedMessages = [newMsg, ...messages].slice(0, 50); // keep last 50
        setMessages(updatedMessages);
        localStorage.setItem('psico_hope_wall', JSON.stringify(updatedMessages));
        onIncrementUsage();

        setNewMessage('');
        setIsWriting(false);

        toast({
            title: "Mensagem Enviada! 🎈",
            description: "Ela chegará anonimamente para alguém que precisa ler isso hoje.",
            className: dm ? 'bg-indigo-900 text-indigo-100 border-indigo-700' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
        });
    };

    const handleReceiveRandom = () => {
        if (!onCheckAccess()) return;
        // Pick a random message that is not yours (simulated by picking one of the presets or older ones)
        // If there are user messages, we can just pick any random one to simulate the network
        const randomIndex = Math.floor(Math.random() * messages.length);
        setReceivedMessage(messages[randomIndex]);
        onIncrementUsage();
    };

    return (
        <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in ${dm ? 'bg-slate-900 text-slate-100' : 'bg-[#fafafa] text-gray-800'}`}>

            {/* Header */}
            <div className="text-center pt-8 mb-10">
                <span className="text-6xl mb-4 block filter drop-shadow-md">💌</span>
                <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${dm ? 'text-indigo-400' : 'text-indigo-700'}`}>Mural de Esperança</h2>
                <p className={`mt-2 font-medium max-w-lg mx-auto ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
                    Uma comunidade gentil e anônima. Escreva uma mensagem de apoio e receba luz de volta.
                </p>
            </div>

            <div className="max-w-xl mx-auto space-y-8 relative">

                {/* Received Message Modal/Card */}
                {receivedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setReceivedMessage(null)}>
                        <div
                            className={`w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl animate-slide-up relative bg-white transform transition-transform hover:scale-105 ${receivedMessage.color}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="text-5xl block mb-6 drop-shadow-sm">{receivedMessage.icon}</span>
                            <p className="text-lg font-bold leading-relaxed mb-6 font-serif">"{receivedMessage.text}"</p>
                            <div className="opacity-60 text-xs font-bold uppercase tracking-wider mb-6">De: Um amigo anônimo</div>
                            <button
                                onClick={() => setReceivedMessage(null)}
                                className="w-full py-4 rounded-2xl font-bold bg-black/10 hover:bg-black/20 transition-colors"
                            >
                                🙏 Guardar no coração
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Interaction Area */}
                {!isWriting ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleReceiveRandom}
                            className={`p-8 rounded-[2rem] border shadow-sm transition-all hover:scale-[1.02] text-center group relative overflow-hidden ${dm ? 'bg-indigo-900/40 border-indigo-800' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100'}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/30 transition-colors duration-500"></div>
                            <span className="text-5xl block mb-4 filter drop-shadow">📬</span>
                            <h3 className={`font-extrabold text-lg mb-2 ${dm ? 'text-indigo-200' : 'text-indigo-900'}`}>Receber uma Carta</h3>
                            <p className={`text-sm font-medium opacity-80 ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>Veja o que o destino guardou para você hoje.</p>
                        </button>

                        <button
                            onClick={() => setIsWriting(true)}
                            className={`p-8 rounded-[2rem] border shadow-sm transition-all hover:scale-[1.02] text-center group relative overflow-hidden ${dm ? 'bg-amber-900/30 border-amber-800' : 'bg-gradient-to-br from-amber-50 to-rose-50 border-amber-100'}`}
                        >
                            <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-white/30 transition-colors duration-500"></div>
                            <span className="text-5xl block mb-4 filter drop-shadow">✍️</span>
                            <h3 className={`font-extrabold text-lg mb-2 ${dm ? 'text-amber-200' : 'text-amber-900'}`}>Enviar uma Carta</h3>
                            <p className={`text-sm font-medium opacity-80 ${dm ? 'text-amber-300' : 'text-amber-700'}`}>Escreva palavras de força para alguém especial.</p>
                        </button>
                    </div>
                ) : (
                    <div className={`p-6 sm:p-8 rounded-[2rem] border shadow-lg animate-slide-up ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`font-extrabold text-xl flex items-center gap-2 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>
                                <span>🕊️</span> Nova Mensagem
                            </h3>
                            <button onClick={() => setIsWriting(false)} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${dm ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>✕</button>
                        </div>

                        <div className={`p-4 rounded-xl text-xs font-semibold mb-6 flex items-start gap-3 ${dm ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                            <span className="text-lg">💡</span>
                            <p>As mensagens são anônimas. Escreva algo que você gostaria de ouvir em um dia difícil. Mensagens ofensivas serão bloqueadas pela moderação do bem.</p>
                        </div>

                        <form onSubmit={handleSend} className="space-y-4">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Você é incrível porque..."
                                rows={5}
                                className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed ${dm ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                            />

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={newMessage.trim().length === 0}
                                    className="px-8 py-4 rounded-full font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Amarrar no Balão e Soltar 🎈
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Floating Wall - Cloud Sky Style */}
                {!isWriting && (
                    <div className="pt-10 overflow-hidden min-h-[500px] relative">
                        <h3 className={`font-bold mb-12 text-center text-sm uppercase tracking-widest relative z-10 ${dm ? 'text-slate-500' : 'text-gray-400'}`}>
                            Nuvens de esperança circulando agora
                        </h3>
                        <div className="relative h-full grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 sm:gap-y-16 max-w-2xl mx-auto px-4">
                            {clouds.map((msg, i) => {
                                const style = messageStyles[i % messageStyles.length];
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ y: 0 }}
                                        animate={{
                                            y: [0, -15, 0],
                                            x: [0, msg.x / 2, 0]
                                        }}
                                        transition={{
                                            duration: msg.duration,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: msg.delay
                                        }}
                                        className={`p-6 sm:p-8 shadow-xl cursor-default backdrop-blur-sm transform transition-all hover:scale-105 hover:z-20 border-[3px] relative ${style.bg} ${style.tx} ${style.border}`}
                                        style={{
                                            borderRadius: '2.5rem',
                                            scale: msg.scale * (dm ? 0.85 : 1),
                                            opacity: 0.98
                                        }}
                                    >
                                        {/* Cloud Puffs - Overlapping bubbles to create a fluffy look */}
                                        <div className={`absolute -top-6 left-6 w-14 h-14 rounded-full border-t-[3px] ${style.bg} ${style.border} -z-10`}></div>
                                        <div className={`absolute -top-4 right-10 w-16 h-16 rounded-full border-t-[3px] ${style.bg} ${style.border} -z-10`}></div>
                                        <div className={`absolute top-4 -left-5 w-12 h-12 rounded-full border-l-[3px] ${style.bg} ${style.border} -z-10`}></div>
                                        <div className={`absolute top-6 -right-4 w-14 h-14 rounded-full border-r-[3px] ${style.bg} ${style.border} -z-10`}></div>

                                        {/* Thought Bubble Tail - Small circles leading down */}
                                        <div className="absolute -bottom-6 left-[20%] space-y-1">
                                            <div className={`w-4 h-4 rounded-full border-[2px] ${style.bg} ${style.border} shadow-sm`}></div>
                                            <div className={`w-2.5 h-2.5 rounded-full border-[2px] -ml-2 ${style.bg} ${style.border} shadow-sm`}></div>
                                        </div>

                                        <span className="text-2xl block mb-2">{msg.icon}</span>
                                        <p className="font-bold text-sm sm:text-base leading-snug tracking-tight drop-shadow-sm">"{msg.text}"</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className={`mt-16 text-center text-[10px] font-bold uppercase tracking-widest relative z-10 ${dm ? 'text-slate-700' : 'text-gray-300'}`}>
                            ...e centenas de outras vozes gentis.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
