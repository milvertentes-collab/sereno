'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ambientSounds } from '@/components/AmbientPlayer';
import SectionHeroCard from './SectionHeroCard';

interface FreeTimerSectionProps {
    darkMode: boolean;
    onComplete?: (minutes: number) => void;
    embedded?: boolean;
    title?: string;
    description?: string;
}

export default function FreeTimerSection({
    darkMode: dm,
    onComplete,
    embedded = false,
    title = 'Time Livre',
    description = 'Sem narração, apenas você, o silêncio e, se quiser, um ambiente sonoro.',
}: FreeTimerSectionProps) {
    const intentionPresets = [
        { id: 'silenciar', label: 'Silenciar a mente', duration: 5, soundId: 'chuva1' },
        { id: 'presenca', label: 'Ficar presente', duration: 10, soundId: 'riacho1' },
        { id: 'descanso', label: 'Descansar', duration: 15, soundId: 'noite1' },
        { id: 'respirar', label: 'Só respirar', duration: 3, soundId: 'silencio' },
    ] as const;
    const featuredSoundIds = new Set(['silencio', 'chuva1', 'riacho1', 'noite1', 'vento1', 'mar1']);
    const silentSound = { id: 'silencio', name: 'Silêncio', emoji: '🤍', category: 'sem som', file: '' };
    const freeTimerSounds = [silentSound, ...ambientSounds];
    const featuredSounds = freeTimerSounds.filter((sound) => featuredSoundIds.has(sound.id)).slice(0, 6);
    const [duration, setDuration] = useState(10); // minutes
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [selectedSound, setSelectedSound] = useState(freeTimerSounds[0]);
    const [volume, setVolume] = useState(40);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = () => {
        setTimeLeft(duration * 60);
        setIsActive(true);
        if (selectedSound.file) {
            const audio = new Audio(selectedSound.file);
            audio.loop = true;
            audio.volume = volume / 100;
            audio.play().catch(console.error);
            audioRef.current = audio;
        }
    };

    const stopTimer = useCallback(() => {
        setIsActive(false);
        setTimeLeft(0);
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { onComplete?.(duration); stopTimer(); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
        }
    }, [isActive, timeLeft, stopTimer]);

    useEffect(() => {
        return () => { if (audioRef.current) { audioRef.current.pause(); } };
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const progress = duration * 60 > 0 ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : 0;

    if (isActive) {
        return (
            <div className="h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 animate-fade-in relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Circular Timer */}
                <div className="relative w-64 h-64 mb-10 z-10 transition-transform hover:scale-105 duration-700">
                    <div className="absolute inset-0 rounded-full border border-white/10" />
                    <svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="4" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                            className="transition-all duration-1000 ease-linear"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#818cf8" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm rounded-full bg-white/5">
                        <span className="text-5xl font-mono text-white tracking-widest font-light drop-shadow-md">{formatTime(timeLeft)}</span>
                        <span className="text-white/70 text-sm mt-3 font-medium tracking-wide flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">{selectedSound.emoji} {selectedSound.name}</span>
                    </div>
                </div>

                <p className="text-white/90 text-xl font-medium mb-10 tracking-wide z-10 drop-shadow-sm">Silencie por dentro. Fique aqui.</p>

                {/* Volume & Control */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 z-10 w-full max-w-xs flex flex-col items-center gap-6">
                    {selectedSound.file ? (
                        <div className="flex items-center gap-4 w-full px-2">
                            <span className="text-white/60 text-lg">🔉</span>
                            <input type="range" min="0" max="100" value={volume} onChange={(e) => {
                                const v = Number(e.target.value);
                                setVolume(v);
                                if (audioRef.current) audioRef.current.volume = v / 100;
                            }} className="flex-1 accent-white h-2 bg-white/20 rounded-full appearance-none outline-none overflow-hidden" />
                            <span className="text-white/60 text-lg">🔊</span>
                        </div>
                    ) : (
                        <div className="w-full rounded-2xl bg-white/8 px-4 py-3 text-center text-sm font-semibold text-white/75">
                            Sessão em silêncio
                        </div>
                    )}

                    <button onClick={stopTimer} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm uppercase tracking-wider">
                        Encerrar Sessão
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in max-w-lg mx-auto ${embedded ? 'p-0 pb-4' : 'p-4 pb-24'} ${dm ? 'text-white' : ''}`}>
            {!embedded && (
                <div className="mb-8 pt-4">
                    <SectionHeroCard
                        darkMode={dm}
                        eyebrow="No seu tempo"
                        title={title}
                        description="Sem narração. Só você, o tempo e a presença que quiser cultivar agora."
                        icon="⏱️"
                    />
                </div>
            )}

            <div className={`rounded-3xl p-6 mb-6 shadow-sm border ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>
                    <span>✨</span> Entrar no clima
                </h3>
                <p className={`text-sm mb-4 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                    Escolha uma intenção rápida e o tempo já se ajusta para você começar sem pensar demais.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                    {intentionPresets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => {
                                setDuration(preset.duration);
                                const matchedSound = freeTimerSounds.find((sound) => sound.id === preset.soundId);
                                if (matchedSound) setSelectedSound(matchedSound);
                            }}
                            className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.98] ${
                                preset.id === 'silenciar'
                                    ? dm
                                        ? 'bg-sky-950/40 text-sky-100 border border-sky-900/60 hover:bg-sky-900/45'
                                        : 'bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100'
                                    : preset.id === 'presenca'
                                        ? dm
                                            ? 'bg-emerald-950/38 text-emerald-100 border border-emerald-900/60 hover:bg-emerald-900/42'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100'
                                        : preset.id === 'descanso'
                                            ? dm
                                                ? 'bg-indigo-950/40 text-indigo-100 border border-indigo-900/60 hover:bg-indigo-900/44'
                                                : 'bg-indigo-50 text-indigo-800 border border-indigo-100 hover:bg-indigo-100'
                                            : dm
                                                ? 'bg-violet-950/38 text-violet-100 border border-violet-900/60 hover:bg-violet-900/42'
                                                : 'bg-violet-50 text-violet-800 border border-violet-100 hover:bg-violet-100'
                            }`}
                        >
                            <span className="block font-black">{preset.label}</span>
                            <span className={`mt-1 block text-xs ${dm ? 'text-gray-400' : 'text-slate-500'}`}>{preset.duration} min</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration */}
            <div className={`rounded-3xl p-6 mb-6 shadow-sm border ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>
                    <span>⏱️</span> Duração
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[3, 5, 10, 15, 20, 30].map(d => (
                        <button key={d} onClick={() => setDuration(d)}
                            className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${duration === d ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-300 ring-offset-1 dark:ring-offset-gray-900' : dm ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'}`}
                        >
                            {d}m
                        </button>
                    ))}
                </div>
            </div>

            <div className={`rounded-3xl p-6 mb-6 shadow-sm border ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>
                    <span>🤍</span> Modo de prática
                </h3>
                <p className={`text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                    Você pode fazer essa sessão em silêncio total ou com um ambiente discreto ao fundo.
                </p>
            </div>

            {/* Sound Selection */}
            <div className={`rounded-3xl p-6 mb-8 shadow-sm border ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>
                    <span>🎵</span> Ambiente sonoro
                </h3>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {featuredSounds.map(sound => (
                        <button
                            key={sound.id}
                            onClick={() => setSelectedSound(sound)}
                            className={`rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98] ${
                                selectedSound.id === sound.id
                                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                                    : dm
                                        ? 'bg-gray-900/40 border border-gray-700/50 text-gray-300 hover:bg-gray-700'
                                        : 'bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xl">{sound.emoji}</span>
                                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${selectedSound.id === sound.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : dm ? 'bg-gray-800 text-gray-400' : 'bg-white text-slate-500'}`}>
                                    {sound.category}
                                </span>
                            </div>
                            <p className="mt-3 text-sm font-black">{sound.name}</p>
                        </button>
                    ))}
                </div>
                <div className="sereno-blue-scrollbar h-40 sm:h-44 overflow-y-auto space-y-2 pr-2">
                    {freeTimerSounds.map(sound => (
                        <button key={sound.id} onClick={() => setSelectedSound(sound)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-sm font-medium transition-all active:scale-[0.98] ${selectedSound.id === sound.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm border dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                                : dm ? 'bg-gray-900/40 border border-gray-700/50 hover:bg-gray-700 text-gray-400' : 'bg-gray-50 border border-gray-100/50 hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            <span className="text-xl filter drop-shadow-sm">{sound.emoji}</span>
                            <span className="flex-1">{sound.name}</span>
                            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${selectedSound.id === sound.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : dm ? 'bg-gray-800' : 'bg-gray-200/50'}`}>{sound.category}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={startTimer}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <span className="text-xl">🧘</span> Iniciar prática livre
            </button>
        </div>
    );
}
