'use client';

import React, { useState } from 'react';

export default function SuggestionsSection({ darkMode: dm }: { darkMode?: boolean }) {
    const [suggestion, setSuggestion] = useState('');
    const [messageType, setMessageType] = useState('Sugestões');

    const sendEmail = () => {
        if (!suggestion.trim()) {
            alert('Escreva uma mensagem antes de enviar.');
            return;
        }
        const subject = encodeURIComponent(`[${messageType}] Feedback app Sereno`);
        const body = encodeURIComponent(suggestion);
        window.location.href = `mailto:milvertentes@gmail.com?subject=${subject}&body=${body}`;
        setSuggestion('');
    };

    return (
        <div className={`p-6 animate-fade-in pb-32 min-h-screen flex flex-col items-center justify-center ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-gray-800'}`}>

            <div className="w-full max-w-lg mb-10 mt-8">
                <div className={`w-28 h-28 mx-auto mb-8 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-lg border-4 ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-yellow-100'} rotate-3 hover:rotate-6 transition-transform duration-300`}>
                    💡
                </div>

                <h2 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-center leading-tight ${dm ? 'text-yellow-400' : 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-500'}`}>
                    Ajude a Construir
                </h2>

                <div className={`p-6 rounded-3xl border shadow-sm ${dm ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 backdrop-blur-md border-white/50'}`}>
                    <p className={`text-lg font-medium leading-relaxed text-center ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
                        O app Sereno é um espaço nosso.
                        Queremos ouvir suas ideias, críticas e pedidos de novas ferramentas para tornar o app cada vez mais útil para o seu dia a dia.
                    </p>
                </div>
            </div>

            <div className={`w-full max-w-lg p-8 rounded-[2.5rem] shadow-xl border relative overflow-hidden ${dm ? 'bg-slate-800/90 border-slate-700 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl border-white'}`}>

                {/* Decorative subtle blurred shapes */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-50 ${dm ? 'bg-yellow-900/30' : 'bg-yellow-200/50'}`}></div>
                <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-50 ${dm ? 'bg-orange-900/30' : 'bg-orange-200/50'}`}></div>

                <div className="relative z-10">
                    <label className={`block text-sm font-bold uppercase tracking-widest mb-3 ${dm ? 'text-yellow-500' : 'text-yellow-600'}`}>
                        Tipo de Mensagem
                    </label>
                    <select
                        value={messageType}
                        onChange={(e) => setMessageType(e.target.value)}
                        className={`w-full p-4 text-base font-semibold rounded-2xl border focus:outline-none focus:ring-4 focus:ring-yellow-500/30 transition-all mb-6 appearance-none ${dm ? 'bg-slate-900/80 border-slate-600 text-white' : 'bg-white border-yellow-200 text-gray-800'}`}
                    >
                        <option value="Sugestões">💡 Sugestão</option>
                        <option value="Melhorias">✨ Melhoria</option>
                        <option value="Bugs">🐛 Relatar um Bug</option>
                        <option value="Críticas">💬 Crítica</option>
                        <option value="Elogios">❤️ Elogio</option>
                    </select>

                    <label className={`block text-sm font-bold uppercase tracking-widest mb-3 ${dm ? 'text-yellow-500' : 'text-yellow-600'}`}>
                        Sua Mensagem
                    </label>
                    <textarea
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        placeholder="Digite aqui o seu comentário sobre o aplicativo..."
                        rows={7}
                        className={`w-full p-5 text-lg rounded-3xl border focus:outline-none focus:ring-4 focus:ring-yellow-500/30 transition-all resize-none mb-8 ${dm ? 'bg-slate-900/80 border-slate-600 text-white placeholder-slate-500' : 'bg-gray-50/80 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'}`}
                    />

                    <button
                        onClick={sendEmail}
                        className={`w-full py-5 rounded-3xl font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 text-white flex items-center justify-center gap-3 ${dm ? 'bg-gradient-to-r from-yellow-600 to-orange-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_10px_20px_rgba(245,158,11,0.2)]'}`}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        Enviar Mensagem via E-mail
                    </button>
                </div>
            </div>
        </div>
    );
}
