'use client';

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TherapySession {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    notes: string;
}

export default function TherapyCalendarSection({ darkMode: dm }: { darkMode?: boolean }) {
    const [sessions, setSessions] = useLocalStorage<TherapySession[]>('therapy_sessions', []);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    // Check for near sessions (within 1 hour)
    useEffect(() => {
        // In a real mobile app, this would use Push Notifications APIs.
        // Here we use browser alerts or just internal checks as a placeholder.
        const checkReminders = () => {
            const now = new Date();
            sessions.forEach(session => {
                const [year, month, day] = session.date.split('-');
                const [hour, min] = session.time.split('-');
                if (!year || !hour) return;

                const sessionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
                const diffMs = sessionDate.getTime() - now.getTime();
                const diffMins = Math.round(diffMs / 60000);

                // Notify if exactly 60 mins away or slightly less, once
                // This is a naive logic for client-side web apps.
                if (diffMins > 0 && diffMins <= 60) {
                    console.log(`Lembrete: Terapia em ${diffMins} minutos!`);
                }
            });
        };

        checkReminders();
        const interval = setInterval(checkReminders, 60000 * 5); // Check every 5 mins
        return () => clearInterval(interval);
    }, [sessions]);

    const saveSession = () => {
        if (!date || !time) {
            alert('Preencha a data e o horário.');
            return;
        }
        const newSession: TherapySession = {
            id: Date.now().toString(),
            date,
            time,
            notes
        };
        const newSessions = [...sessions, newSession].sort((a, b) => {
            return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
        });
        setSessions(newSessions);
        setShowForm(false);
        setDate('');
        setTime('');
        setNotes('');
    };

    const deleteSession = (id: string) => {
        setSessions(sessions.filter(s => s.id !== id));
    };

    const getStatus = (sDate: string, sTime: string) => {
        const sessionTime = new Date(`${sDate}T${sTime}`).getTime();
        const now = new Date().getTime();
        if (sessionTime < now) return 'completed';
        return 'upcoming';
    };

    return (
        <div className={`p-4 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-gray-800'}`}>
            <div className="text-center pt-8 mb-8">
                <span className="text-6xl mb-4 block filter drop-shadow-md">📅</span>
                <h2 className={`text-4xl font-extrabold tracking-tight ${dm ? 'text-blue-400' : 'text-blue-600'}`}>Calendário de Terapia</h2>
                <p className={`mt-2 font-medium ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Agende suas sessões e receba lembretes.</p>
            </div>

            {!showForm ? (
                <div className="max-w-md mx-auto">
                    <button
                        onClick={() => setShowForm(true)}
                        className={`w-full mb-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm border ${dm ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700' : 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Agendar Nova Sessão
                    </button>

                    {sessions.length === 0 ? (
                        <div className={`text-center p-8 rounded-3xl border ${dm ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white border-gray-100 text-gray-500'}`}>
                            <p>Nenhuma sessão agendada no momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map(s => {
                                const status = getStatus(s.date, s.time);
                                return (
                                    <div key={s.id} className={`p-5 rounded-3xl border shadow-sm flex flex-col gap-3 relative overflow-hidden ${dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                                        {status === 'completed' && <div className="absolute top-0 right-0 w-16 h-16 bg-gray-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>}

                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className={`text-xl font-extrabold ${dm ? 'text-slate-200' : 'text-gray-900'} ${status === 'completed' ? 'opacity-50' : ''}`}>
                                                    {s.date.split('-').reverse().join('/')}
                                                </h4>
                                                <p className={`font-medium ${dm ? 'text-blue-400' : 'text-blue-600'} ${status === 'completed' ? 'opacity-50' : ''}`}>
                                                    ⏰ {s.time}
                                                </p>
                                            </div>
                                            <button onClick={() => deleteSession(s.id)} className={`p-2 rounded-full transition-colors ${dm ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>

                                        {s.notes && (
                                            <div className={`p-3 rounded-2xl text-sm italic ${dm ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-gray-600'}`}>
                                                "{s.notes}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className={`max-w-md mx-auto p-6 rounded-3xl border shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-md' : 'bg-white border-gray-100'}`}>
                    <h3 className={`font-extrabold text-xl mb-6 ${dm ? 'text-slate-100' : 'text-gray-800'}`}>Nova Sessão</h3>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className={`block text-sm font-bold mb-1.5 ${dm ? 'text-slate-300' : 'text-gray-700'}`}>Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${dm ? 'bg-slate-900 border-slate-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-bold mb-1.5 ${dm ? 'text-slate-300' : 'text-gray-700'}`}>Horário</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${dm ? 'bg-slate-900 border-slate-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-bold mb-1.5 ${dm ? 'text-slate-300' : 'text-gray-700'}`}>Observações (Opcional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ex: Falar sobre ansiedade pela manhã"
                                rows={3}
                                className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none ${dm ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowForm(false)}
                            className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95 ${dm ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={saveSession}
                            className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 ${dm ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'bg-blue-500 hover:bg-blue-600 shadow-lg'}`}
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
