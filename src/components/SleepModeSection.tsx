'use client';

import React, { useState, useEffect, useRef } from 'react';
import { natureMixerTracks } from './NatureMixerSection';

interface SleepModeSectionProps {
    darkMode: boolean;
}

export default function SleepModeSection({ darkMode: dm }: SleepModeSectionProps) {
    const [activeMix, setActiveMix] = useState<Record<string, boolean>>({});
    const [isPaused, setIsPaused] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [volume, setVolume] = useState(50);

    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Filter sounds for sleep (Rain, Night, Fire, etc.)
    const sleepSounds = natureMixerTracks.filter(t =>
        t.name.toLowerCase().includes('chuva') ||
        t.name.toLowerCase().includes('noite') ||
        t.name.toLowerCase().includes('dormir') ||
        t.name.toLowerCase().includes('lareira') ||
        t.name.toLowerCase().includes('mar') ||
        t.name.toLowerCase().includes('vento') ||
        t.name.toLowerCase().includes('grilo')
    ).slice(0, 12);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (timeLeft === 0) {
            stopAll();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [timeLeft]);

    const stopAll = () => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.pause();
            }
        });
        audioRefs.current = {};
        setActiveMix({});
        setIsPaused(false);
        setTimerMinutes(null);
        setTimeLeft(null);
    };

    const togglePauseAll = () => {
        const nextPaused = !isPaused;
        setIsPaused(nextPaused);
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                if (nextPaused) audio.pause();
                else audio.play().catch(e => console.log('Play mix failed:', e));
            }
        });
    };

    const toggleSound = (soundId: string) => {
        const isSelected = activeMix[soundId];

        if (isSelected) {
            // Stop it
            if (audioRefs.current[soundId]) {
                audioRefs.current[soundId]?.pause();
                audioRefs.current[soundId] = null;
            }
            const newMix = { ...activeMix };
            delete newMix[soundId];
            setActiveMix(newMix);
        } else {
            // Play it
            const track = natureMixerTracks.find(t => t.id === soundId);
            if (track) {
                const audio = new Audio(encodeURI(track.src));
                audio.loop = true;
                audio.volume = volume / 100;

                if (!isPaused) {
                    audio.play().catch(e => console.log('Sleep audio failed:', e));
                }

                audioRefs.current[soundId] = audio;
                setActiveMix(prev => ({ ...prev, [soundId]: true }));
            }
        }
    };

    // Synchronize volume across all playing sounds
    useEffect(() => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.volume = volume / 100;
            }
        });
    }, [volume]);

    const startTimer = (mins: number) => {
        setTimerMinutes(mins);
        setTimeLeft(mins * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const activeCount = Object.keys(activeMix).length;

    return (
        <div className={`min-h-screen p-6 pb-32 animate-fade-in ${dm ? 'bg-[#02020a]' : 'bg-[#050510]'} text-white overflow-y-auto font-sans`}>
            {/* Star background effect */}
            <div className="fixed inset-0 pointer-events-none opacity-30">
                <div className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-40 right-1/3 w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse delay-700"></div>
                <div className="absolute bottom-60 left-10 w-1 h-1 bg-purple-200 rounded-full animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-md mx-auto relative z-10 pt-12 text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                    <span className="text-5xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🌙</span>
                </div>
                <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">Modo Sono Profundo</h2>
                <p className="text-slate-400 font-medium mb-8">Misture seus sons favoritos para uma noite perfeita.</p>

                {/* Master Volume Control */}
                <div className="mb-10 bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl text-left">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Volume Geral</span>
                        <span className="text-sm font-bold text-indigo-300">{volume}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                {timeLeft !== null && (
                    <div className="mb-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl animate-scale-in">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Desligamento Automático em</p>
                        <p className="text-6xl font-black font-mono tracking-tighter text-white">{formatTime(timeLeft)}</p>
                        <button
                            onClick={stopAll}
                            className="mt-6 px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold hover:bg-red-500/30 transition-all font-sans"
                        >
                            Parar tudo agora
                        </button>
                    </div>
                )}

                {/* Sound Mixer Selector */}
                <div className="mb-10 text-left">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="text-blue-400">🔊</span> Mixer de Sons
                        </h3>

                        {/* Master Controls */}
                        <div className="flex gap-2">
                            {activeCount > 0 && (
                                <>
                                    <button
                                        onClick={togglePauseAll}
                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                                        title={isPaused ? "Retomar" : "Pausar tudo"}
                                    >
                                        {isPaused ? '▶️' : '⏸️'}
                                    </button>
                                    <button
                                        onClick={stopAll}
                                        className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-all"
                                        title="Parar tudo"
                                    >
                                        ⏹️
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {sleepSounds.map(sound => {
                            const isSelected = activeMix[sound.id];
                            return (
                                <button
                                    key={sound.id}
                                    onClick={() => toggleSound(sound.id)}
                                    className={`aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all border relative ${isSelected
                                        ? 'bg-indigo-600 border-indigo-400 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70'}`}
                                >
                                    <span className={`text-2xl transition-transform ${isSelected && !isPaused ? 'animate-pulse' : ''}`}>
                                        {sound.icon}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-300 truncate w-full px-1">{sound.name}</span>
                                    {isSelected && (
                                        <div className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)] border border-white/20 transition-all ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Timer Selector */}
                <div className="mb-10 text-left">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="text-purple-400">⏲️</span> Temporizador de Sono
                    </h3>
                    <div className="flex gap-3">
                        {[15, 30, 45, 60].map(mins => (
                            <button
                                key={mins}
                                onClick={() => startTimer(mins)}
                                className={`flex-1 py-4 rounded-2xl border font-black text-sm transition-all ${timerMinutes === mins
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                            >
                                {mins} min
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 rounded-[2.5rem] bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-white/5 mb-12">
                    <p className="text-sm font-medium text-blue-200 leading-relaxed italic">
                        "O sono é a ponte dourada entre o desespero e a esperança."
                    </p>
                </div>
            </div>
        </div>
    );
}
