'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cancelBrowserSpeech, speakBrowserText } from '@/lib/browserSpeech';
import { natureMixerTracks } from './NatureMixerSection';
import SectionHeroCard from './SectionHeroCard';

interface SleepModeSectionProps {
    darkMode: boolean;
    defaultVoice: 'masculino' | 'feminino' | 'nenhuma';
    setDefaultVoice: (v: 'masculino' | 'feminino' | 'nenhuma') => void;
    onComplete?: (minutes: number) => void;
    audioSettings?: {
        musicVolume: number;
        voiceVolume: number;
        backgroundMusicEnabled: boolean;
    };
}

export default function SleepModeSection({ darkMode: dm, defaultVoice, setDefaultVoice, onComplete, audioSettings }: SleepModeSectionProps) {
    const [activeMix, setActiveMix] = useState<Record<string, boolean>>({});
    const [isPaused, setIsPaused] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [volume, setVolume] = useState(audioSettings?.musicVolume ?? 50);
    const [isBlackout, setIsBlackout] = useState(false);
    const [showBreathing, setShowBreathing] = useState(false);
    const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'off'>('off');
    const [breathingTimer, setBreathingTimer] = useState(0);
    const [breathingCycle, setBreathingCycle] = useState(0);

    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    const ttsAbortController = useRef<AbortController | null>(null);
    const breathingTimeouts = useRef<NodeJS.Timeout[]>([]);
    
    // Refs to avoid stale closures in timeouts
    const volumeRef = useRef(volume);
    const voiceRef = useRef(defaultVoice);
    const showBreathingRef = useRef(showBreathing);
    const voiceVolumeRef = useRef(audioSettings?.voiceVolume ?? 80);
    const backgroundEnabled = audioSettings?.backgroundMusicEnabled ?? true;

    useEffect(() => { volumeRef.current = volume; }, [volume]);
    useEffect(() => { voiceRef.current = defaultVoice; }, [defaultVoice]);
    useEffect(() => { showBreathingRef.current = showBreathing; }, [showBreathing]);
    useEffect(() => { voiceVolumeRef.current = audioSettings?.voiceVolume ?? 80; }, [audioSettings?.voiceVolume]);
    useEffect(() => {
        if (typeof audioSettings?.musicVolume === 'number') {
            setVolume(audioSettings.musicVolume);
        }
    }, [audioSettings?.musicVolume]);

    const sleepSounds = natureMixerTracks.filter(t =>
        t.name.toLowerCase().includes('chuva') ||
        t.name.toLowerCase().includes('noite') ||
        t.name.toLowerCase().includes('dormir') ||
        t.name.toLowerCase().includes('lareira') ||
        t.name.toLowerCase().includes('mar') ||
        t.name.toLowerCase().includes('vento') ||
        t.name.toLowerCase().includes('grilo')
    ).slice(0, 12);

    const presets = [
        { id: 'sono-profundo', name: 'Sono Profundo', emoji: '💤', sounds: ['dor', 'mar1', 'vento1'] },
        { id: 'janela-na-chuva', name: 'Janela na Chuva', emoji: '🌧️', sounds: ['chuva2', 'lareira3', 'riacho4'] },
        { id: 'noite-tranquila', name: 'Noite Tranquila', emoji: '🌙', sounds: ['noite1', 'grilo2', 'lareira3'] },
        { id: 'cabana-segura', name: 'Cabana Segura', emoji: '🏕️', sounds: ['chuva1', 'lareira1', 'grilo1'] },
        { id: 'mar-calmo', name: 'Mar Calmo', emoji: '🌊', sounds: ['mar2', 'mar1', 'vento1'] },
        { id: 'floresta-noturna', name: 'Floresta Noturna', emoji: '🌲', sounds: ['floresta1', 'grilo1', 'riacho4'] }
    ];

    const speakWithPiper = async (text: string) => {
        if (voiceRef.current === 'nenhuma' || !showBreathingRef.current) return;
        
        // Cancel previous request and stop audio
        if (ttsAbortController.current) ttsAbortController.current.abort();
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.currentTime = 0;
        }

        ttsAbortController.current = new AbortController();
        
        try {
            const res = await fetch('/api/piper-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: ttsAbortController.current.signal,
                body: JSON.stringify({
                    text,
                    gender: voiceRef.current,
                    voice: voiceRef.current === 'masculino' ? 'pt-BR-AntonioNeural' : 'pt-BR-FranciscaNeural'
                })
            });
            if (!res.ok) {
                await speakBrowserText(text, {
                    voice: voiceRef.current,
                    volume: voiceVolumeRef.current,
                });
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            ttsAudioRef.current = audio;
            audio.volume = Math.max(0, Math.min(1, voiceVolumeRef.current / 100));
            audio.onended = () => { URL.revokeObjectURL(url); };
            audio.onerror = () => { URL.revokeObjectURL(url); };
            await audio.play();
        } catch (e) { 
            if ((e as any).name !== 'AbortError') {
                console.error('Sleep TTS failed:', e);
                await speakBrowserText(text, {
                    voice: voiceRef.current,
                    volume: voiceVolumeRef.current,
                });
            }
        }
    };

    // Immediate stop or switch logic
    useEffect(() => {
        if (defaultVoice === 'nenhuma' || !showBreathing) {
            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                ttsAudioRef.current.currentTime = 0;
            }
            if (ttsAbortController.current) ttsAbortController.current.abort();
            cancelBrowserSpeech();
        }
    }, [defaultVoice, showBreathing]);

    // Reliable Volume sync
    useEffect(() => {
        const v = backgroundEnabled ? volume / 100 : 0;
        // Update mixer sounds
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) audio.volume = v;
        });
        // Update current speaking voice
        if (ttsAudioRef.current) {
            ttsAudioRef.current.volume = Math.max(0, Math.min(1, (audioSettings?.voiceVolume ?? 80) / 100));
        }
    }, [audioSettings?.voiceVolume, backgroundEnabled, volume]);

    useEffect(() => {
        if (backgroundEnabled) return;
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) audio.pause();
        });
    }, [backgroundEnabled]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                const nextTime = timeLeft - 1;
                setTimeLeft(nextTime);
                if (nextTime <= 60 && nextTime > 0) {
                    const factor = nextTime / 60;
                    const fadedVol = backgroundEnabled ? (volumeRef.current / 100) * factor : 0;
                    Object.values(audioRefs.current).forEach(audio => {
                        if (audio) audio.volume = Math.max(0, fadedVol);
                    });
                }
            }, 1000);
        } else if (timeLeft === 0) { onComplete?.(timerMinutes || 10); stopAll(); }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [timeLeft]);

    const clearBreathing = () => {
        breathingTimeouts.current.forEach(t => clearTimeout(t));
        breathingTimeouts.current = [];
        if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current.currentTime = 0; }
        if (ttsAbortController.current) ttsAbortController.current.abort();
        cancelBrowserSpeech();
    };

    // Robust Breathing 4-7-8 logic
    useEffect(() => {
        if (!showBreathing) {
            clearBreathing();
            setBreathingPhase('off');
            setBreathingCycle(0);
            return;
        }

        let mainLoopId: NodeJS.Timeout;
        let secondInterval: NodeJS.Timeout;

        const startCycle = () => {
            setBreathingCycle(c => {
                if (c >= 8) {
                    setShowBreathing(false);
                    speakWithPiper('Exercício concluído por agora. Durma bem.');
                    return 0;
                }
                
                setBreathingPhase('inhale');
                setBreathingTimer(4);
                speakWithPiper('Inspire profundamente');
                
                const t1 = setTimeout(() => {
                    if (!showBreathingRef.current) return;
                    setBreathingPhase('hold');
                    setBreathingTimer(7);
                    speakWithPiper('Segure o ar');
                    
                    const t2 = setTimeout(() => {
                        if (!showBreathingRef.current) return;
                        setBreathingPhase('exhale');
                        setBreathingTimer(8);
                        speakWithPiper('Solte o ar lentamente');
                    }, 7000);
                    breathingTimeouts.current.push(t2);
                }, 4000);
                breathingTimeouts.current.push(t1);

                return c + 1;
            });
        };

        startCycle();
        const cycleDuration = (4 + 7 + 8) * 1000;
        mainLoopId = setInterval(startCycle, cycleDuration);
        secondInterval = setInterval(() => { setBreathingTimer(t => Math.max(0, t - 1)); }, 1000);

        return () => {
            clearInterval(mainLoopId);
            clearInterval(secondInterval);
            clearBreathing();
        };
    }, [showBreathing]);

    const stopAll = () => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) { audio.pause(); audio.currentTime = 0; }
        });
        audioRefs.current = {};
        if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current.currentTime = 0; }
        if (ttsAbortController.current) ttsAbortController.current.abort();
        setActiveMix({});
        setIsPaused(false);
        setTimerMinutes(null);
        setTimeLeft(null);
        setIsBlackout(false);
        setShowBreathing(false);
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
            if (audioRefs.current[soundId]) {
                audioRefs.current[soundId]?.pause();
                audioRefs.current[soundId] = null;
            }
            const newMix = { ...activeMix };
            delete newMix[soundId];
            setActiveMix(newMix);
        } else {
            const track = natureMixerTracks.find(t => t.id === soundId);
            if (track) {
                const audio = new Audio(encodeURI(track.src));
                audio.loop = true;
                audio.volume = backgroundEnabled ? volume / 100 : 0;
                if (!isPaused && backgroundEnabled) { audio.play().catch(e => console.log('Sleep audio failed:', e)); }
                audioRefs.current[soundId] = audio;
                setActiveMix(prev => ({ ...prev, [soundId]: true }));
            }
        }
    };

    const applyPreset = (presetSounds: string[]) => {
        Object.values(audioRefs.current).forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
        audioRefs.current = {};
        const newMix: Record<string, boolean> = {};
        presetSounds.forEach(id => {
            const track = natureMixerTracks.find(t => t.id === id);
            if (track) {
                const audio = new Audio(encodeURI(track.src));
                audio.loop = true;
                audio.volume = backgroundEnabled ? volume / 100 : 0;
                if (backgroundEnabled) {
                    audio.play().catch(e => console.log('Preset play failed:', e));
                }
                audioRefs.current[id] = audio;
                newMix[id] = true;
            }
        });
        setActiveMix(newMix);
        setIsPaused(false);
    };

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
        <div className={`min-h-screen p-6 pb-40 animate-fade-in transition-all duration-1000 ${isBlackout ? 'bg-black' : (dm ? 'bg-[#02020a]' : 'bg-[#050510]')} text-white overflow-y-auto font-sans relative no-scrollbar`}>
            
            {isBlackout && (
                <div onClick={() => setIsBlackout(false)} className="fixed inset-0 z-[100] cursor-pointer flex items-center justify-center bg-black">
                    <div className="text-center opacity-20 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white animate-pulse">Toque para acordar</p>
                    </div>
                </div>
            )}

            {!isBlackout && (
                <div className="fixed inset-0 pointer-events-none opacity-30">
                    <div className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute top-40 right-1/3 w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse delay-700"></div>
                    <div className="absolute bottom-60 left-10 w-1 h-1 bg-purple-200 rounded-full animate-pulse delay-1000"></div>
                </div>
            )}

            <div className={`max-w-md mx-auto relative z-10 pt-12 transition-all duration-700 ${isBlackout ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="Noite e descanso"
                    title="Modo Sono"
                    description="Misture seus sons favoritos para uma noite mais estável, escura e silenciosa por dentro."
                    icon="🌙"
                />

                {/* Presets List - Vertical for better visibility */}
                <div className="mb-8 text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 mb-4 pl-4">Ambientes Recomendados</p>
                    <div className="flex flex-col gap-3 px-1">
                        {presets.map(p => (
                            <button
                                key={p.id}
                                onClick={() => applyPreset(p.sounds)}
                                className="w-full px-6 py-5 rounded-[2.2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left flex items-center justify-between group active:scale-95 shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl group-hover:scale-110 transition-transform">{p.emoji}</span>
                                    <div className="min-w-0">
                                        <span className="block text-[14px] font-black uppercase tracking-wider text-white truncate">{p.name}</span>
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em]">Mix Relaxante</span>
                                    </div>
                                </div>
                                <span className="text-indigo-400 text-xl opacity-40 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Master Volume Control */}
                <div className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] text-left shadow-xl">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🔊</span>
                            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Volume</span>
                        </div>
                        <span className="text-sm font-black text-indigo-300">{volume}%</span>
                    </div>
                    <div className="relative pt-1">
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume} 
                            onChange={(e) => setVolume(parseInt(e.target.value))} 
                            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 transition-all hover:h-3" 
                        />
                    </div>
                </div>

                {/* Breathing 4-7-8 Guide */}
                <div className={`mb-8 overflow-hidden transition-all duration-700 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 rounded-[3rem] shadow-2xl ${showBreathing ? 'p-8' : 'p-0 h-16 hover:bg-white/10'}`}>
                    {!showBreathing ? (
                        <button onClick={() => setShowBreathing(true)} className="w-full h-full flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-indigo-300 transition-all active:scale-95">
                            🌬️ Respiração 4-7-8
                        </button>
                    ) : (
                        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">Ciclo {breathingCycle}/8</span>
                                <button onClick={() => setShowBreathing(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all text-xl hover:bg-red-500/20">✕</button>
                            </div>
                            
                            <div className="relative h-44 flex items-center justify-center">
                                <div
                                    className={`absolute w-36 h-36 rounded-full border-4 border-indigo-500/30 ease-in-out ${breathingPhase === 'inhale' ? 'scale-150 bg-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.3)]' : breathingPhase === 'exhale' ? 'scale-100 bg-purple-500/10' : 'scale-150 backdrop-blur-md'}`}
                                    style={{ transition: `all ${breathingPhase === 'hold' ? 7000 : breathingPhase === 'exhale' ? 8000 : 4000}ms ease-in-out` }}
                                />
                                <div className="z-10 text-center">
                                    <p className="text-3xl font-black uppercase tracking-tighter mb-2 text-white drop-shadow-2xl">
                                        {breathingPhase === 'inhale' ? 'Inspire' : breathingPhase === 'hold' ? 'Segure' : 'Expire'}
                                    </p>
                                    <div className="w-14 h-14 rounded-full bg-white/20 mx-auto flex items-center justify-center border border-white/20 backdrop-blur-xl">
                                        <p className="text-3xl font-black font-mono text-indigo-200">{breathingTimer}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-6">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.14em] opacity-80">Voz do Guia</p>
                                <div className="grid grid-cols-3 gap-2 w-full">
                                    <button 
                                        onClick={() => setDefaultVoice('nenhuma')} 
                                        className={`py-3 rounded-2xl text-[11px] font-black transition-all border-2 active:scale-95 ${
                                            defaultVoice === 'nenhuma' 
                                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30' 
                                            : 'bg-transparent border-red-500/40 text-red-500 hover:bg-red-500/5'
                                        }`}
                                    >
                                        OFF
                                    </button>
                                    <button 
                                        onClick={() => setDefaultVoice('masculino')} 
                                        className={`py-3 rounded-2xl text-[11px] font-black transition-all border-2 active:scale-95 ${
                                            defaultVoice === 'masculino' 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                            : 'bg-transparent border-blue-500/40 text-blue-500 hover:bg-blue-500/5'
                                        }`}
                                    >
                                        SERENO
                                    </button>
                                    <button 
                                        onClick={() => setDefaultVoice('feminino')} 
                                        className={`py-3 rounded-2xl text-[11px] font-black transition-all border-2 active:scale-95 ${
                                            defaultVoice === 'feminino' 
                                            ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/30' 
                                            : 'bg-transparent border-pink-500/40 text-pink-500 hover:bg-pink-500/5'
                                        }`}
                                    >
                                        SERENA
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {timeLeft !== null && (
                    <div className="mb-8 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl animate-scale-in">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-400 mb-4 px-3 py-1 rounded-full bg-indigo-500/5 inline-block">Tempo Restante</p>
                        <p className="text-7xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{formatTime(timeLeft)}</p>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button onClick={() => setIsBlackout(true)} className="py-4 rounded-[1.5rem] bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 shadow-lg">Meia-Luz</button>
                            <button onClick={stopAll} className="py-4 rounded-[1.5rem] bg-red-600/30 text-red-400 border border-red-500/40 text-[11px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 shadow-lg">Parar Tudo</button>
                        </div>
                    </div>
                )}

                {/* Sound Mixer Selector - More compact to prevent cutting */}
                <div className="mb-10 text-left">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 flex items-center gap-2">Mixer Noturno</h3>
                        <div className="flex gap-2">
                            {activeCount > 0 && (
                                <>
                                    <button onClick={togglePauseAll} className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-2xl shadow-xl active:scale-90">{isPaused ? '▶️' : '⏸️'}</button>
                                    <button onClick={stopAll} className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 text-red-400 transition-all text-2xl shadow-xl active:scale-90">⏹️</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 px-1">
                        {sleepSounds.map(sound => {
                            const isSelected = activeMix[sound.id];
                            return (
                                <button
                                    key={sound.id}
                                    onClick={() => toggleSound(sound.id)}
                                    className={`aspect-square rounded-[1.8rem] flex flex-col items-center justify-center gap-2 transition-all border relative overflow-hidden active:scale-90 shadow-lg ${isSelected ? 'bg-indigo-600 border-indigo-300 scale-105 shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'}`}
                                >
                                    <span className={`text-4xl transition-transform duration-500 ${isSelected && !isPaused ? 'animate-pulse scale-110' : ''}`}>{sound.icon}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-tight text-center px-1 leading-tight ${isSelected ? 'text-white' : 'text-slate-400 opacity-60'}`}>{sound.name}</span>
                                    {isSelected && <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white/40 transition-all ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`}></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-12 text-left">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 px-4">Temporizador</h3>
                    <div className="grid grid-cols-5 gap-2 px-1">
                        {[15, 30, 45, 60, 90].map(mins => (
                            <button key={mins} onClick={() => startTimer(mins)} className={`py-4 rounded-[1.2rem] border font-black text-[11px] transition-all active:scale-95 shadow-lg ${timerMinutes === mins ? 'bg-purple-600 border-purple-400 text-white shadow-purple-500/30 scale-105' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>{mins}</button>
                        ))}
                    </div>
                </div>

                <div className="p-8 rounded-[3.5rem] bg-gradient-to-br from-indigo-900/40 to-purple-900/50 border border-white/10 mb-16 shadow-2xl relative overflow-hidden group">
                    <p className="text-[11px] font-black text-blue-200/40 leading-relaxed italic uppercase tracking-[0.25em] text-center">"O sono é a ponte dourada entre o desespero e a esperança."</p>
                </div>
            </div>
            
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
