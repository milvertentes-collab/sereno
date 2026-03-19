'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppNoticeModal from './AppNoticeModal';
import SectionHeroCard from './SectionHeroCard';

type SessionStatus = 'upcoming' | 'completed';

interface TherapySession {
    id: string;
    date: string;
    time: string;
    notes: string;
    reason?: string;
    bringToSession?: string;
    sessionTakeaway?: string;
    nextAction?: string;
    completed?: boolean;
    reviewedAt?: string;
}

const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const formatDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return date;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const formatShortDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return date;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
};

const getSessionTimestamp = (date: string, time: string) => new Date(`${date}T${time}`).getTime();

const sortSessions = (sessions: TherapySession[]) =>
    [...sessions].sort((a, b) => getSessionTimestamp(a.date, a.time) - getSessionTimestamp(b.date, b.time));

const getStatus = (session: TherapySession): SessionStatus => {
    if (session.completed) return 'completed';
    return getSessionTimestamp(session.date, session.time) < Date.now() ? 'completed' : 'upcoming';
};

const getLocalDate = (date = new Date()) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

const parseMonthKey = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    return { year, month };
};

const buildCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const leading = firstDay.getDay();
    const total = lastDay.getDate();
    const days: Array<{ date: string; dayNumber: number; currentMonth: boolean }> = [];

    for (let i = 0; i < leading; i += 1) {
        const date = new Date(year, month - 1, 1 - (leading - i));
        days.push({ date: getLocalDate(date), dayNumber: date.getDate(), currentMonth: false });
    }

    for (let day = 1; day <= total; day += 1) {
        days.push({
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            dayNumber: day,
            currentMonth: true,
        });
    }

    while (days.length % 7 !== 0) {
        const nextIndex = days.length - (leading + total) + 1;
        const date = new Date(year, month, nextIndex);
        days.push({ date: getLocalDate(date), dayNumber: date.getDate(), currentMonth: false });
    }

    return days;
};

const toCalendarStamp = (date: string, time: string, addMinutes = 0) => {
    const dt = new Date(`${date}T${time}:00`);
    dt.setMinutes(dt.getMinutes() + addMinutes);
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hour = String(dt.getHours()).padStart(2, '0');
    const minute = String(dt.getMinutes()).padStart(2, '0');
    const second = String(dt.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hour}${minute}${second}`;
};

const buildGoogleCalendarUrl = (session: TherapySession) => {
    const start = toCalendarStamp(session.date, session.time);
    const end = toCalendarStamp(session.date, session.time, 50);
    const details = [
        session.reason ? `Motivo principal: ${session.reason}` : '',
        session.bringToSession ? `Levar para a sessão: ${session.bringToSession}` : '',
        session.notes ? `Observações: ${session.notes}` : '',
    ].filter(Boolean).join('\n\n');

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: 'Sessão de terapia',
        dates: `${start}/${end}`,
        details,
        trp: 'false',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildIcsContent = (session: TherapySession) => {
    const uid = `therapy-${session.id}@sereno`;
    const start = toCalendarStamp(session.date, session.time);
    const end = toCalendarStamp(session.date, session.time, 50);
    const description = [
        session.reason ? `Motivo principal: ${session.reason}` : '',
        session.bringToSession ? `Levar para a sessão: ${session.bringToSession}` : '',
        session.notes ? `Observações: ${session.notes}` : '',
    ].filter(Boolean).join('\\n\\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sereno//Therapy Calendar//PT-BR',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${toCalendarStamp(getLocalDate(), '00:00')}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        'SUMMARY:Sessão de terapia',
        `DESCRIPTION:${description}`,
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Lembrete: sessão de terapia amanhã',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Lembrete: sessão de terapia em 1 hora',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
};

function TopCard({ darkMode, title, value, hint, tone }: { darkMode: boolean; title: string; value: string; hint: string; tone: 'blue' | 'emerald' | 'violet' }) {
    const tones = {
        blue: darkMode ? 'bg-blue-950/30 border-blue-800/40 text-blue-100' : 'bg-blue-50 border-blue-200 text-blue-900',
        emerald: darkMode ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100' : 'bg-emerald-50 border-emerald-200 text-emerald-900',
        violet: darkMode ? 'bg-violet-950/30 border-violet-800/40 text-violet-100' : 'bg-violet-50 border-violet-200 text-violet-900',
    };
    const glyph = tone === 'blue' ? '📅' : tone === 'emerald' ? '🌿' : '🕊️';
    return (
        <div data-card-glyph={glyph} className={`sereno-ornament-card rounded-3xl border p-4 ${tones[tone]}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{title}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
            <p className="mt-1 text-xs opacity-80">{hint}</p>
        </div>
    );
}

function TherapyBlock({ darkMode, title, value }: { darkMode: boolean; title: string; value: string }) {
    return (
        <div data-card-glyph="📝" className={`sereno-ornament-card rounded-2xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{title}</p>
            <p className={`mt-1 text-sm leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{value}</p>
        </div>
    );
}

function SectionTitle({ darkMode, title, subtitle }: { darkMode: boolean; title: string; subtitle: string }) {
    return (
        <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{title}</p>
            <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
        </div>
    );
}

function Field({ darkMode, label, children }: { darkMode: boolean; label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{label}</label>
            {children}
        </div>
    );
}

const inputCls = (dm?: boolean) =>
    `w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${dm ? 'bg-slate-950 border-slate-700 text-white color-scheme-dark' : 'bg-slate-50 border-slate-200 text-slate-900'}`;

const textareaCls = (dm?: boolean) =>
    `w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none ${dm ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

export default function TherapyCalendarSection({
    darkMode: dm,
    reminderSettings,
    setReminderSettings: _setReminderSettings,
}: {
    darkMode?: boolean;
    reminderSettings?: {
        therapyReminder?: boolean;
        therapyReminderDayBefore?: boolean;
        therapyReminderHourBefore?: boolean;
        doNotDisturb?: boolean;
    };
    setReminderSettings?: (value: any) => void;
}) {
    const [sessions, setSessions] = useLocalStorage<TherapySession[]>('therapy_sessions', []);
    const [noticeMessage, setNoticeMessage] = useState('');
    const [challenges] = useLocalStorage<Array<{ title: string; days: 7 | 21 | 30; progress: number; why?: string }>>('psico_challenges', []);
    const [trackProgress] = useLocalStorage<Record<string, number>>('psico_tracks_progress', {});
    const [view, setView] = useState<'calendar' | 'new' | 'history'>('calendar');
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [monthKey, setMonthKey] = useState(() => getLocalDate().slice(0, 7));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [date, setDate] = useState(getLocalDate());
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [bringToSession, setBringToSession] = useState('');
    const [notes, setNotes] = useState('');
    const [sessionTakeaway, setSessionTakeaway] = useState('');
    const [nextAction, setNextAction] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const c = (l: string, d: string) => (dm ? d : l);
    const orderedSessions = useMemo(() => sortSessions(sessions), [sessions]);

    useEffect(() => {
        if (!reminderSettings?.therapyReminder || reminderSettings?.doNotDisturb) return;
        const checkReminders = () => {
            const now = new Date();
            orderedSessions.forEach((session) => {
                if (session.completed) return;
                const [year, month, day] = session.date.split('-').map(Number);
                const [hour, min] = session.time.split(':').map(Number);
                if (!year || Number.isNaN(hour) || Number.isNaN(min)) return;
                const sessionDate = new Date(year, month - 1, day, hour, min);
                const diffMins = Math.round((sessionDate.getTime() - now.getTime()) / 60000);
                const reminderKeyBase = `therapy-${session.id}`;
                const shouldDayBefore = reminderSettings?.therapyReminderDayBefore && diffMins > 1380 && diffMins <= 1440;
                const shouldHourBefore = reminderSettings?.therapyReminderHourBefore && diffMins > 0 && diffMins <= 60;

                const notify = (suffix: 'day' | 'hour', title: string, body: string) => {
                    const storageKey = `${reminderKeyBase}-${suffix}-${getLocalDate()}`;
                    if (typeof window !== 'undefined' && window.localStorage.getItem(storageKey)) return;
                    if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, '1');
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification(title, { body });
                    } else {
                        console.log(`${title}: ${body}`);
                    }
                };

                if (shouldDayBefore) {
                    notify('day', 'Terapia amanhã', `Sua sessão é amanhã às ${session.time}. Revise o que quer levar.`);
                }

                if (shouldHourBefore) {
                    notify('hour', 'Terapia em 1 hora', `Sessão às ${session.time}. Veja sua preparação antes de entrar.`);
                }
            });
        };

        checkReminders();
        const interval = setInterval(checkReminders, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [orderedSessions, reminderSettings]);

    const upcomingSessions = useMemo(() => orderedSessions.filter((session) => getStatus(session) === 'upcoming'), [orderedSessions]);
    const completedSessions = useMemo(() => orderedSessions.filter((session) => getStatus(session) === 'completed'), [orderedSessions]);
    const selectedDaySessions = useMemo(() => orderedSessions.filter((session) => session.date === selectedDate), [orderedSessions, selectedDate]);

    const nextSession = upcomingSessions[0] || null;
    const nearSession = useMemo(
        () =>
            upcomingSessions.find((session) => {
                const diff = getSessionTimestamp(session.date, session.time) - Date.now();
                return diff > 0 && diff <= 48 * 60 * 60 * 1000;
            }) || null,
        [upcomingSessions]
    );

    const frequencyLast90 = useMemo(() => {
        const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        return completedSessions.filter((session) => getSessionTimestamp(session.date, session.time) >= cutoff).length;
    }, [completedSessions]);

    const intervals = useMemo(() => {
        if (completedSessions.length < 2) return [];
        const sorted = [...completedSessions].sort((a, b) => getSessionTimestamp(a.date, a.time) - getSessionTimestamp(b.date, b.time));
        const days: number[] = [];
        for (let i = 1; i < sorted.length; i += 1) {
            const diffDays = Math.round((getSessionTimestamp(sorted[i].date, sorted[i].time) - getSessionTimestamp(sorted[i - 1].date, sorted[i - 1].time)) / (24 * 60 * 60 * 1000));
            if (!Number.isNaN(diffDays)) days.push(diffDays);
        }
        return days;
    }, [completedSessions]);

    const avgInterval = intervals.length ? (intervals.reduce((sum, current) => sum + current, 0) / intervals.length).toFixed(1) : null;

    const recurringThemes = useMemo(() => {
        const text = completedSessions
            .flatMap((session) => [session.reason || '', session.notes || '', session.sessionTakeaway || ''])
            .join(' ')
            .toLowerCase();
        const dictionary = ['ansiedade', 'trabalho', 'relacionamento', 'familia', 'culpa', 'sono', 'limite', 'autocobrança', 'autocobranca', 'rotina', 'medo'];
        return dictionary
            .map((term) => ({ term, count: (text.match(new RegExp(term.replace('ç', '[çc]'), 'g')) || []).length }))
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }, [completedSessions]);

    const latestPerceptions = useMemo(
        () => completedSessions.filter((session) => session.sessionTakeaway || session.nextAction).slice(-3).reverse(),
        [completedSessions]
    );
    const activeChallenge = useMemo(
        () => [...(challenges || [])].filter((item) => item.progress < item.days).sort((a, b) => (b.progress / b.days) - (a.progress / a.days))[0] || null,
        [challenges]
    );
    const activeTrack = useMemo(() => {
        const trackTotals: Record<string, number> = {
            ansiedade: 4,
            burnout: 4,
            autoestima: 4,
            luto: 5,
            separacao: 4,
            panico: 4,
            insonia: 4,
            procrastinacao: 4,
            dependencia: 4,
            'ansiedade-social': 4,
        };
        const trackNames: Record<string, string> = {
            ansiedade: 'Ansiedade',
            burnout: 'Burnout',
            autoestima: 'Baixa Autoestima',
            luto: 'Luto e Perdas',
            separacao: 'Separação Afetiva',
            panico: 'Crise de Pânico',
            insonia: 'Insônia e Mente Acelerada',
            procrastinacao: 'Procrastinação Ansiosa',
            dependencia: 'Dependência Emocional',
            'ansiedade-social': 'Ansiedade Social',
        };
        return Object.entries(trackProgress || {})
            .map(([id, done]) => ({ id, done: typeof done === 'number' ? done : 0, total: trackTotals[id] || 0, title: trackNames[id] || id }))
            .filter((item) => item.done > 0 && item.total > 0 && item.done < item.total)
            .sort((a, b) => (b.done / b.total) - (a.done / a.total))[0] || null;
    }, [trackProgress]);

    const sessionCountsByDate = useMemo(() => {
        return orderedSessions.reduce<Record<string, number>>((acc, session) => {
            acc[session.date] = (acc[session.date] || 0) + 1;
            return acc;
        }, {});
    }, [orderedSessions]);

    const monthLabel = useMemo(() => {
        const { year, month } = parseMonthKey(monthKey);
        if (!year || !month) return '';
        return `${monthNames[month - 1]} ${year}`;
    }, [monthKey]);

    const calendarDays = useMemo(() => {
        const { year, month } = parseMonthKey(monthKey);
        if (!year || !month) return [];
        return buildCalendarDays(year, month);
    }, [monthKey]);

    const resetForm = () => {
        setEditingId(null);
        setDate(selectedDate || getLocalDate());
        setTime('');
        setReason('');
        setBringToSession('');
        setNotes('');
        setSessionTakeaway('');
        setNextAction('');
    };

    const openNewForm = (presetDate?: string) => {
        resetForm();
        if (presetDate) setDate(presetDate);
        setView('new');
    };

    const openEdit = (session: TherapySession) => {
        setEditingId(session.id);
        setDate(session.date);
        setTime(session.time);
        setReason(session.reason || '');
        setBringToSession(session.bringToSession || '');
        setNotes(session.notes || '');
        setSessionTakeaway(session.sessionTakeaway || '');
        setNextAction(session.nextAction || '');
        setView('new');
    };

    const saveSession = () => {
        if (!date || !time) {
            setNoticeMessage('Preencha data e horário antes de salvar a sessão.');
            return;
        }

        const previous = editingId ? sessions.find((session) => session.id === editingId) : undefined;
        const base: TherapySession = {
            id: editingId || Date.now().toString(),
            date,
            time,
            notes: notes.trim(),
            reason: reason.trim(),
            bringToSession: bringToSession.trim(),
            sessionTakeaway: sessionTakeaway.trim(),
            nextAction: nextAction.trim(),
            completed: previous?.completed || false,
            reviewedAt: previous?.reviewedAt,
        };

        const nextList = editingId ? sessions.map((session) => (session.id === editingId ? base : session)) : [...sessions, base];
        setSessions(sortSessions(nextList));
        setSelectedDate(date);
        setMonthKey(date.slice(0, 7));
        resetForm();
        setView('calendar');
    };

    const deleteSession = (id: string) => {
        setSessions(sessions.filter((session) => session.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const markAsCompleted = (session: TherapySession) => {
        setSessions(
            sessions.map((item) =>
                item.id === session.id ? { ...item, completed: true, reviewedAt: new Date().toISOString() } : item
            )
        );
    };

    useEffect(() => {
        if (!reminderSettings?.therapyReminder || reminderSettings?.doNotDisturb) return;
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => undefined);
        }
    }, [reminderSettings?.therapyReminder, reminderSettings?.doNotDisturb]);

    const openGoogleCalendar = (session: TherapySession) => {
        if (typeof window === 'undefined') return;
        window.open(buildGoogleCalendarUrl(session), '_blank', 'noopener,noreferrer');
    };

    const downloadIcs = (session: TherapySession) => {
        if (typeof window === 'undefined') return;
        const blob = new Blob([buildIcsContent(session)], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `terapia-${session.date}-${session.time.replace(':', '-')}.ics`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const { year, month } = parseMonthKey(monthKey);

    return (
        <div className={`p-4 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-gray-800'}`}>
            <AppNoticeModal
                open={Boolean(noticeMessage)}
                title="Falta completar essa sessão"
                message={noticeMessage}
                onClose={() => setNoticeMessage('')}
                darkMode={dm}
                icon="🗓️"
                eyebrow="Calendário de Terapia"
            />
            <div className="max-w-lg mx-auto">
                <div className="pt-4 mb-6">
                    <SectionHeroCard
                        darkMode={dm}
                        eyebrow="Calendário de Terapia"
                        title="Calendário de Terapia"
                        description="Organize sessões, prepare o que quer levar e registre o que ficou depois."
                        icon="🗓️"
                    />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <TopCard darkMode={!!dm} title="Agendadas" value={String(upcomingSessions.length)} hint="sessões futuras" tone="blue" />
                    <TopCard darkMode={!!dm} title="Realizadas" value={String(completedSessions.length)} hint="histórico salvo" tone="emerald" />
                    <TopCard darkMode={!!dm} title="Mais perto" value={nextSession ? formatShortDate(nextSession.date) : '--'} hint={nextSession ? nextSession.time : 'sem agenda'} tone="violet" />
                </div>

                <div className={`grid grid-cols-3 gap-2 mb-6 rounded-3xl border p-2 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                    {[
                        { id: 'calendar', label: 'Calendário' },
                        { id: 'new', label: editingId ? 'Editar' : 'Nova sessão' },
                        { id: 'history', label: 'Histórico' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === 'new' && view !== 'new') openNewForm(selectedDate);
                                else setView(tab.id as 'calendar' | 'new' | 'history');
                            }}
                            className={`py-3 rounded-2xl text-sm font-black transition-all ${view === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : c('bg-slate-50 text-slate-600', 'bg-slate-800 text-slate-300')}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {view === 'calendar' && (
                    <div className="space-y-5">
                        <section data-card-glyph="🗓️" className={`sereno-ornament-card rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Próxima sessão</p>
                                    <h3 className={`mt-2 text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>{nextSession ? `${formatDate(nextSession.date)} às ${nextSession.time}` : 'Nada agendado'}</h3>
                                    <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{nextSession ? nextSession.reason || 'Use a preparação para registrar o foco principal da conversa.' : 'Quando você agendar uma sessão, ela aparece aqui com foco e preparação.'}</p>
                                </div>
                                <button onClick={() => openNewForm(selectedDate)} className={`shrink-0 px-4 py-3 rounded-2xl font-bold ${dm ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>Nova</button>
                            </div>
                            {nearSession && (
                                <div className={`mt-4 rounded-2xl border p-4 ${c('bg-blue-50 border-blue-200', 'bg-blue-950/30 border-blue-800/40')}`}>
                                    <p className="text-sm font-bold">Sessão próxima</p>
                                    <p className={`mt-1 text-sm ${c('text-slate-600', 'text-slate-300')}`}>Faltam menos de 48h para {formatDate(nearSession.date)} às {nearSession.time}. Revise o que quer levar e deixe uma próxima ação pensada.</p>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <button onClick={() => openGoogleCalendar(nearSession)} className={`py-2.5 rounded-xl text-xs font-bold ${dm ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-700 border border-slate-200'}`}>Google Agenda</button>
                                        <button onClick={() => downloadIcs(nearSession)} className={`py-2.5 rounded-xl text-xs font-bold ${dm ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>Baixar .ics</button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section data-card-glyph="📆" className={`sereno-ornament-card rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={() => { const prev = new Date(year, month - 2, 1); setMonthKey(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`); }} className={`h-10 w-10 rounded-2xl border ${c('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}>←</button>
                                <div className="text-center">
                                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Navegação mensal</p>
                                    <h3 className={`text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>{monthLabel}</h3>
                                </div>
                                <button onClick={() => { const next = new Date(year, month, 1); setMonthKey(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`); }} className={`h-10 w-10 rounded-2xl border ${c('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}>→</button>
                            </div>

                            <div className="grid grid-cols-7 gap-2 text-center mb-3">
                                {weekDays.map((day) => <span key={day} className={`text-[11px] font-black uppercase ${c('text-slate-500', 'text-slate-400')}`}>{day}</span>)}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day) => {
                                    const count = sessionCountsByDate[day.date] || 0;
                                    const isSelected = selectedDate === day.date;
                                    const isToday = day.date === getLocalDate();
                                    return (
                                        <button
                                            key={day.date}
                                            onClick={() => { setSelectedDate(day.date); setMonthKey(day.date.slice(0, 7)); }}
                                            className={`min-h-[4.6rem] rounded-2xl border p-2 text-left transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20' : !day.currentMonth ? c('bg-slate-50 border-slate-100 text-slate-400', 'bg-slate-900 border-slate-800 text-slate-500') : c('bg-white border-slate-200 text-slate-700', 'bg-slate-800 border-slate-700 text-slate-200')}`}
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <span className="text-sm font-black">{day.dayNumber}</span>
                                                {isToday && <span className={`text-[10px] font-black ${isSelected ? 'text-white/80' : c('text-blue-600', 'text-blue-300')}`}>hoje</span>}
                                            </div>
                                            {count > 0 && <div className={`mt-3 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black ${isSelected ? 'bg-white/15 text-white' : c('bg-blue-50 text-blue-700', 'bg-blue-950/40 text-blue-300')}`}>{count} sessão{count === 1 ? '' : 'ões'}</div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section data-card-glyph="💬" className={`sereno-ornament-card rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Dia selecionado</p>
                                    <h3 className={`text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>{formatDate(selectedDate)}</h3>
                                </div>
                                <button onClick={() => openNewForm(selectedDate)} className={`px-4 py-3 rounded-2xl text-sm font-bold ${dm ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'}`}>Agendar neste dia</button>
                            </div>

                            {selectedDaySessions.length === 0 ? (
                                <div className={`rounded-2xl border p-4 ${c('bg-slate-50 border-slate-200 text-slate-600', 'bg-slate-800 border-slate-700 text-slate-300')}`}>
                                    <p className="font-semibold">Nenhuma sessão neste dia.</p>
                                    <p className="mt-1 text-sm">Toque em “Agendar neste dia” para registrar sessão, preparação ou revisão.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDaySessions.map((session) => {
                                        const status = getStatus(session);
                                        const expanded = expandedId === session.id;
                                        return (
                                            <article key={session.id} data-card-glyph="🛋️" className={`sereno-ornament-card rounded-3xl border ${c('bg-slate-50 border-slate-200', 'bg-slate-800/70 border-slate-700')}`}>
                                                <button onClick={() => setExpandedId(expanded ? null : session.id)} className="w-full text-left p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className={`text-sm font-black ${c('text-slate-900', 'text-slate-100')}`}>{session.time}</p>
                                                            <p className={`mt-1 text-sm ${c('text-slate-600', 'text-slate-300')}`}>{session.reason || 'Sessão sem foco principal registrado'}</p>
                                                        </div>
                                                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${status === 'completed' ? (dm ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (dm ? 'bg-blue-950/40 text-blue-300' : 'bg-blue-100 text-blue-700')}`}>{status === 'completed' ? 'Realizada' : 'Agendada'}</span>
                                                    </div>
                                                </button>

                                                {expanded && (
                                                    <div className="px-4 pb-4 space-y-3">
                                                        <TherapyBlock darkMode={!!dm} title="Motivo principal da sessão" value={session.reason || 'Ainda não registrado.'} />
                                                        <TherapyBlock darkMode={!!dm} title="O que quero levar" value={session.bringToSession || 'Ainda não registrado.'} />
                                                        <TherapyBlock darkMode={!!dm} title="Observações gerais" value={session.notes || 'Ainda não registrado.'} />
                                                        <TherapyBlock darkMode={!!dm} title="O que ficou da sessão" value={session.sessionTakeaway || 'Ainda não registrado.'} />
                                                        <TherapyBlock darkMode={!!dm} title="Próxima ação pequena" value={session.nextAction || 'Ainda não registrado.'} />

                                                        <div className="grid grid-cols-3 gap-2 pt-1">
                                                            <button onClick={() => openEdit(session)} className={`py-3 rounded-2xl text-xs font-bold ${c('bg-slate-200 text-slate-700', 'bg-slate-700 text-slate-200')}`}>Editar</button>
                                                            {status !== 'completed' ? (
                                                                <button onClick={() => markAsCompleted(session)} className="py-3 rounded-2xl text-xs font-bold bg-emerald-600 text-white">Marcar realizada</button>
                                                            ) : (
                                                                <button onClick={() => openEdit(session)} className="py-3 rounded-2xl text-xs font-bold bg-blue-600 text-white">Revisar</button>
                                                            )}
                                                            <button onClick={() => deleteSession(session.id)} className="py-3 rounded-2xl text-xs font-bold bg-rose-600 text-white">Excluir</button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button onClick={() => openGoogleCalendar(session)} className={`py-3 rounded-2xl text-xs font-bold ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-900 text-slate-200 border border-slate-700')}`}>Google Agenda</button>
                                                            <button onClick={() => downloadIcs(session)} className="py-3 rounded-2xl text-xs font-bold bg-blue-600 text-white">Baixar .ics</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-4 space-y-3">
                                {activeChallenge && (
                                    <div className={`rounded-2xl border p-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
                                        <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Acompanhamento leve</p>
                                        <p className="mt-2 text-sm font-semibold">{activeChallenge.title}</p>
                                        <p className={`mt-1 text-sm ${c('text-slate-600', 'text-slate-300')}`}>{activeChallenge.progress}/{activeChallenge.days} dias concluídos.</p>
                                        <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>{activeChallenge.why || 'Seu desafio atual pode ser um bom ponto de revisão na próxima sessão.'}</p>
                                    </div>
                                )}
                                {activeTrack && (
                                    <div className={`rounded-2xl border p-4 ${c('bg-sky-50 border-sky-200', 'bg-sky-950/20 border-sky-800/40')}`}>
                                        <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-sky-700', 'text-sky-300')}`}>Acompanhamento leve da trilha</p>
                                        <p className="mt-2 text-sm font-semibold">{activeTrack.title}</p>
                                        <p className={`mt-1 text-sm ${c('text-slate-600', 'text-slate-300')}`}>{activeTrack.done}/{activeTrack.total} etapas concluídas.</p>
                                        <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>Se fizer sentido, leve para a sessão o que travou na próxima etapa dessa trilha.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {activeChallenge && (
                            <section data-card-glyph="🎯" className={`sereno-ornament-card rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>Acompanhamento leve</p>
                                <h3 className={`mt-2 text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>Desafio em andamento</h3>
                                <p className="mt-2 text-sm font-semibold">{activeChallenge.title}</p>
                                <p className={`mt-1 text-sm ${c('text-slate-600', 'text-slate-300')}`}>{activeChallenge.progress}/{activeChallenge.days} dias concluídos.</p>
                                <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>{activeChallenge.why || 'Seu desafio atual pode ser um bom ponto de revisão na próxima sessão.'}</p>
                            </section>
                        )}
                    </div>
                )}

                {view === 'new' && (
                    <div data-card-glyph="📝" className={`sereno-ornament-card rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                        <div className="mb-5">
                            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>{editingId ? 'Editar sessão' : 'Nova sessão'}</p>
                            <h3 className={`mt-2 text-2xl font-black ${c('text-slate-900', 'text-slate-100')}`}>{editingId ? 'Atualize preparação e revisão' : 'Agendar com preparação completa'}</h3>
                            <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>Separe o que é agenda, o que você quer levar e o que ficou depois da sessão.</p>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Data" darkMode={!!dm}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls(dm)} /></Field>
                                <Field label="Horário" darkMode={!!dm}><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls(dm)} /></Field>
                            </div>

                            <SectionTitle darkMode={!!dm} title="Preparação antes da sessão" subtitle="O que você quer levar para a conversa." />
                            <Field label="Motivo principal da sessão" darkMode={!!dm}><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: ansiedade no trabalho, conflitos em casa, limite..." className={inputCls(dm)} /></Field>
                            <Field label="O que quero levar" darkMode={!!dm}><textarea value={bringToSession} onChange={(e) => setBringToSession(e.target.value)} rows={3} placeholder="Ex: o que aconteceu, onde travou, o que eu não quero esquecer de mencionar." className={textareaCls(dm)} /></Field>
                            <Field label="Observações gerais" darkMode={!!dm}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Informações práticas ou contexto geral da sessão." className={textareaCls(dm)} /></Field>

                            <SectionTitle darkMode={!!dm} title="Revisão depois da sessão" subtitle="Pode deixar vazio agora e preencher depois." />
                            <Field label="O que ficou da sessão" darkMode={!!dm}><textarea value={sessionTakeaway} onChange={(e) => setSessionTakeaway(e.target.value)} rows={3} placeholder="Ex: percepção importante, ponto que mexeu, nova leitura." className={textareaCls(dm)} /></Field>
                            <Field label="Próxima ação pequena" darkMode={!!dm}><textarea value={nextAction} onChange={(e) => setNextAction(e.target.value)} rows={2} placeholder="Ex: observar tal situação, testar um limite, anotar gatilhos." className={textareaCls(dm)} /></Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={() => { resetForm(); setView('calendar'); }} className={`py-4 rounded-2xl font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-300')}`}>Cancelar</button>
                            <button onClick={saveSession} className="py-4 rounded-2xl font-bold text-white bg-blue-600">Salvar sessão</button>
                        </div>
                    </div>
                )}

                {view === 'history' && (
                    <div className="space-y-5">
                        <section data-card-glyph="📊" className={`sereno-ornament-card rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                            <h3 className={`text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>Histórico terapêutico</h3>
                            <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>Frequência, temas que se repetem, intervalo entre sessões e últimas percepções.</p>

                            <div className="grid grid-cols-2 gap-3 mt-5">
                                <TopCard darkMode={!!dm} title="Últimos 90 dias" value={String(frequencyLast90)} hint="sessões realizadas" tone="blue" />
                                <TopCard darkMode={!!dm} title="Intervalo médio" value={avgInterval ? `${avgInterval}d` : '--'} hint="entre sessões" tone="emerald" />
                            </div>

                            <div className={`rounded-2xl border p-4 mt-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Temas recorrentes</p>
                                {recurringThemes.length ? (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {recurringThemes.map((item) => <span key={item.term} className={`px-3 py-2 rounded-full text-xs font-black ${c('bg-blue-100 text-blue-700', 'bg-blue-950/40 text-blue-300')}`}>{item.term} • {item.count}x</span>)}
                                    </div>
                                ) : (
                                    <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-300')}`}>Os temas aparecem quando você preenche motivo, observações ou revisão em mais sessões.</p>
                                )}
                            </div>
                        </section>

                        <section data-card-glyph="🪞" className={`sereno-ornament-card rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                            <h3 className={`text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>Últimas percepções</h3>
                            {latestPerceptions.length === 0 ? (
                                <div className={`mt-3 rounded-2xl border p-4 ${c('bg-slate-50 border-slate-200 text-slate-600', 'bg-slate-800 border-slate-700 text-slate-300')}`}>
                                    <p className="font-semibold">Ainda não há revisão registrada.</p>
                                    <p className="mt-1 text-sm">Depois da sessão, volte e preencha “o que ficou” e “próxima ação pequena”.</p>
                                </div>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {latestPerceptions.map((session) => (
                                        <article key={session.id} data-card-glyph="🧠" className={`sereno-ornament-card rounded-2xl border p-4 ${c('bg-slate-50 border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-black">{formatDate(session.date)} • {session.time}</p>
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-950/40 text-emerald-300')}`}>Revisada</span>
                                            </div>
                                            {session.sessionTakeaway && <p className={`mt-3 text-sm leading-relaxed ${c('text-slate-700', 'text-slate-200')}`}><strong>O que ficou:</strong> {session.sessionTakeaway}</p>}
                                            {session.nextAction && <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}><strong>Próxima ação:</strong> {session.nextAction}</p>}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
