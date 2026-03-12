'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { parseSRT, Subtitle } from '@/lib/srtParser';
import { ambientSounds, Sound } from '@/components/AmbientPlayer';
import { natureMixerTracks } from '@/components/NatureMixerSection';

interface ModernAudioPlayerProps {
    title: string;
    emoji: string;
    category?: string;
    audio: {
        feminino: string;
        masculino?: string;
    };
    srt?: {
        feminino: string;
        masculino?: string;
    };
    rawSubtitles?: {
        feminino: { start: number; end: number; text: string }[];
        masculino?: { start: number; end: number; text: string }[];
    };
    text?: string;
    onClose: () => void;
    onComplete?: () => void;
    darkMode?: boolean;
    initialVoice?: 'feminino' | 'masculino' | 'nenhuma';
    onVoiceChange?: (voice: 'feminino' | 'masculino' | 'nenhuma') => void;
    initialAmbientSoundId?: string;
}

export default function ModernAudioPlayer({
    title,
    emoji,
    category,
    audio,
    srt,
    rawSubtitles,
    text,
    onClose,
    onComplete,
    darkMode: dm,
    initialVoice,
    onVoiceChange,
    initialAmbientSoundId
}: ModernAudioPlayerProps) {
    // --- State ---
    const [selectedVoice, setSelectedVoice] = useState<'feminino' | 'masculino' | 'nenhuma'>(initialVoice || 'feminino');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [pauseType, setPauseType] = useState<'normal' | 'longo' | 'agil'>('normal');

    // Settings Panel State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'voz' | 'sons' | 'ritmo'>('voz');

    // Ambient Mixer State
    const [activeAmbientSounds, setActiveAmbientSounds] = useState<Record<string, number>>(() => {
        if (initialAmbientSoundId) {
            return { [initialAmbientSoundId]: 30 };
        }
        return {};
    });
    const ambientAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

    // Ambient sound logic
    const getAmbientAudio = (id: string) => {
        if (!ambientAudioRefs.current[id]) {
            const track = natureMixerTracks.find(t => t.id === id);
            if (track) {
                const audio = new Audio(encodeURI(track.src));
                audio.loop = true;
                audio.volume = 0;
                ambientAudioRefs.current[id] = audio;
            }
        }
        return ambientAudioRefs.current[id];
    };

    useEffect(() => {
        // Sync activeAmbientSounds with actual audio elements
        natureMixerTracks.forEach(track => {
            const vol = activeAmbientSounds[track.id] || 0;
            const audio = getAmbientAudio(track.id);
            if (audio) {
                audio.volume = vol / 100;
                if (vol > 0) {
                    if (audio.paused) audio.play().catch(e => console.log('Ambient play failed', e));
                } else if (!audio.paused) {
                    audio.pause();
                }
            }
        });
    }, [activeAmbientSounds]);

    useEffect(() => {
        // Cleanup ambient sounds
        return () => {
            Object.values(ambientAudioRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        };
    }, []);

    // --- Refs ---
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ambientRefs = useRef<Record<string, HTMLAudioElement>>({});
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const textContainerRef = useRef<HTMLDivElement | null>(null);
    const activeLineRef = useRef<HTMLParagraphElement | null>(null);

    // --- Subtitle Logic ---
    const [srtSubtitles, setSrtSubtitles] = useState<Subtitle[]>([]);

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        async function loadSRT() {
            if (rawSubtitles) {
                setSrtSubtitles([]);
                return;
            }
            const srtPath = selectedVoice === 'feminino' ? srt?.feminino : selectedVoice === 'masculino' ? srt?.masculino : undefined;
            if (srtPath) {
                try {
                    const response = await fetch(srtPath);
                    const srtText = await response.text();
                    const parsed = parseSRT(srtText);
                    setSrtSubtitles(parsed);
                } catch (error) {
                    console.error('Erro ao carregar legenda SRT:', error);
                    setSrtSubtitles([]);
                }
            } else {
                setSrtSubtitles([]);
            }
        }
        loadSRT();
    }, [srt, selectedVoice, rawSubtitles]);

    const subtitleChunks = useMemo(() => {
        const activeRaw = selectedVoice === 'feminino' ? rawSubtitles?.feminino : selectedVoice === 'masculino' ? rawSubtitles?.masculino : undefined;
        if (activeRaw && activeRaw.length > 0) {
            return activeRaw.map((s, i) => ({ id: i, text: s.text, start: s.start, end: s.end }));
        }
        if (srtSubtitles.length > 0) {
            return srtSubtitles.map(s => ({ id: s.id, text: s.text, start: s.startTime, end: s.endTime }));
        }
        if (!duration || duration <= 1 || !text) return [];
        const paragraphs = text.split('\n').filter(p => p.trim() !== '');
        const totalLength = paragraphs.reduce((sum, p) => sum + p.length, 0);
        let currTime = 0;
        return paragraphs.map((t, index) => {
            const proportion = t.length / totalLength;
            const d = proportion * duration;
            const start = index === 0 ? 2 : currTime;
            const end = currTime + d;
            currTime = end;
            return { id: index, text: t, start, end };
        });
    }, [text, duration, srtSubtitles, rawSubtitles, selectedVoice]);

    // --- Audio Control Logic ---
    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.error);
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) audioRef.current.currentTime = time;
    };

    const stopAll = useCallback(() => {
        if (onComplete) onComplete();
        onClose();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        Object.values(ambientRefs.current).forEach(a => {
            a.pause();
            a.currentTime = 0;
        });
    }, [onClose, onComplete]);

    // Handle Ambient Sounds
    useEffect(() => {
        Object.entries(activeAmbientSounds).forEach(([id, vol]) => {
            if (!ambientRefs.current[id]) {
                const sound = natureMixerTracks.find(s => s.id === id) || ambientSounds.find(s => s.id === id);
                if (sound && (sound as any).src) {
                    const audio = new Audio(encodeURI((sound as any).src));
                    audio.loop = true;
                    audio.volume = vol / 100;
                    ambientRefs.current[id] = audio;
                    if (isPlaying) audio.play().catch(() => { });
                } else if (sound && (sound as any).file) {
                    const audio = new Audio(encodeURI((sound as any).file));
                    audio.loop = true;
                    audio.volume = vol / 100;
                    ambientRefs.current[id] = audio;
                    if (isPlaying) audio.play().catch(() => { });
                }
            } else {
                ambientRefs.current[id].volume = vol / 100;
                if (isPlaying && ambientRefs.current[id].paused) {
                    ambientRefs.current[id].play().catch(() => { });
                }
            }
        });

        // Cleanup sounds that are no longer active
        Object.keys(ambientRefs.current).forEach(id => {
            if (!activeAmbientSounds[id]) {
                ambientRefs.current[id].pause();
                delete ambientRefs.current[id];
            }
        });
    }, [activeAmbientSounds, isPlaying]);

    // Update Speed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // Voice Preview Logic
    const playPreview = (voice: 'feminino' | 'masculino') => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current.src = voice === 'feminino' ? audio.feminino : (audio.masculino || '');
            previewAudioRef.current.currentTime = 10; // Play from middle
            previewAudioRef.current.play().catch(() => { });
            setTimeout(() => {
                if (previewAudioRef.current) previewAudioRef.current.pause();
            }, 3000);
        }
    };

    const audioSrc = selectedVoice === 'feminino' ? audio.feminino : selectedVoice === 'masculino' ? audio.masculino : null;

    return (
        <div className={`fixed inset-0 z-[60] flex flex-col items-center animate-fade-in ${dm ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-slate-50 to-indigo-50 text-slate-900'}`}>
            <audio ref={previewAudioRef} />
            
            {/* Background Visual Element */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b ${dm ? 'from-teal-950/40' : 'from-teal-100/40'} to-transparent opacity-60`}></div>
            </div>

            {/* Header */}
            <div className="w-full max-w-2xl flex justify-between items-center p-6">
                <button onClick={stopAll} className={`p-3 rounded-full transition-all active:scale-95 ${dm ? 'bg-slate-900/50 text-slate-400' : 'bg-white/50 text-slate-500 shadow-sm'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold tracking-tight text-center">{title}</h2>
                    <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>{category || 'Sessão'}</p>
                </div>

                <button onClick={() => setIsSettingsOpen(true)} className={`p-3 rounded-full transition-all active:scale-95 ${dm ? 'bg-slate-900/50 text-slate-400' : 'bg-white/50 text-slate-500 shadow-sm'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                </button>
            </div>

            {/* Main Environment Feature */}
            <div className="flex-1 w-full flex flex-col items-center justify-center px-8 relative">
                <div className={`w-40 h-40 rounded-full flex items-center justify-center text-7xl shadow-2xl relative z-10 transition-all duration-700 ${isPlaying ? 'scale-110 shadow-teal-500/20' : 'scale-100 shadow-slate-500/10'} ${dm ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-white'}`}>
                    {emoji}
                    {isPlaying && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-teal-400/20 -z-10"></div>
                    )}
                </div>

                {/* Subtitles Overlay */}
                <div className="w-full mt-12 min-h-[120px] flex items-center justify-center text-center">
                    {subtitleChunks.length > 0 ? (
                        subtitleChunks.filter(c => currentTime >= c.start && currentTime < c.end).map(chunk => (
                            <p key={chunk.id} className={`text-xl font-medium leading-relaxed px-4 transition-all duration-500 animate-fade-in ${dm ? 'text-teal-300' : 'text-slate-800'}`}>
                                {chunk.text}
                            </p>
                        ))
                    ) : (
                        <p className={`text-sm opacity-40 italic ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                            {isPlaying ? 'Sintonizando sua calma...' : 'Toque no play para começar'}
                        </p>
                    )}
                </div>
            </div>

            {/* Floating Main Controls */}
            <div className={`w-full max-w-2xl p-8 pb-12 flex flex-col items-center gap-8`}>
                <audio
                    ref={audioRef}
                    src={audioSrc || undefined}
                    onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                    onEnded={() => setIsPlaying(false)}
                />

                {/* Progress Bar */}
                <div className="w-full flex items-center gap-4 group">
                    <span className="text-[10px] font-bold w-10 opacity-40 font-mono text-right">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-teal-500 ${dm ? 'bg-slate-800' : 'bg-slate-200'}`}
                    />
                    <span className="text-[10px] font-bold w-10 opacity-40 font-mono">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center gap-8">
                    <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }} className={`p-4 rounded-full transition-all active:scale-90 ${dm ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6" /><path d="M2.5 8a10 10 0 1 1 2.36 5.14" /></svg>
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-teal-500/30 active:scale-90 transition-all"
                    >
                        {isPlaying ? (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                        ) : (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z" /></svg>
                        )}
                    </button>

                    <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }} className={`p-4 rounded-full transition-all active:scale-90 ${dm ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6" /><path d="M21.5 8a10 10 0 1 0-2.36 5.14" /></svg>
                    </button>
                </div>
            </div>

            {/* --- SETTINGS BOTTOM SHEET --- */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
                    <div className={`relative w-full max-w-xl rounded-t-[3rem] p-6 pb-12 shadow-2xl border-t border-white/10 flex flex-col max-h-[90vh] animate-slide-up ${dm ? 'bg-slate-900/95 text-white' : 'bg-white/95 text-slate-900'}`}>
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 opacity-30"></div>

                        {/* Tabs */}
                        <div className={`flex p-1 rounded-2xl mb-8 ${dm ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                            {['voz', 'sons', 'ritmo'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all capitalize ${activeTab === tab ? (dm ? 'bg-slate-700 text-teal-400 shadow-lg' : 'bg-white text-teal-600 shadow-md') : 'opacity-50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'voz' && (
                                <div className="space-y-4 px-2">
                                    <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest pl-1 mb-4">Escolha a Narração</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { id: 'feminino', label: 'Voz Feminina', desc: 'Suave e acolhedora', emoji: '🎙️' },
                                            { id: 'masculino', label: 'Voz Masculina', desc: 'Profunda e calma', emoji: '🎙️' },
                                            { id: 'nenhuma', label: 'Somente Fundo', desc: 'Apenas ambiente', emoji: '🔇' }
                                        ].map((v) => (
                                            <div
                                                key={v.id}
                                                onClick={() => {
                                                    setSelectedVoice(v.id as any);
                                                    if (onVoiceChange) onVoiceChange(v.id as any);
                                                }}
                                                className={`p-5 rounded-3xl border-2 transition-all flex items-center gap-4 cursor-pointer active:scale-98 ${selectedVoice === v.id ? 'border-teal-500 bg-teal-500/10' : dm ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-500 flex items-center justify-center text-xl">
                                                    {v.emoji}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold">{v.label}</p>
                                                    <p className="text-xs opacity-60 font-medium">{v.desc}</p>
                                                </div>
                                                {v.id !== 'nenhuma' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); playPreview(v.id as any); }}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${dm ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-500 shadow-sm'}`}
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                    </button>
                                                )}
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedVoice === v.id ? 'border-teal-500' : 'border-slate-300'}`}>
                                                    {selectedVoice === v.id && <div className="w-3 h-3 rounded-full bg-teal-500 animate-in zoom-in-50 duration-300"></div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sons' && (
                                <div className="px-2">
                                    <div className="flex justify-between items-center mb-6 sticky top-0 bg-inherit z-10 py-2">
                                        <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest pl-1">Mixer de Ambiente</h3>
                                        <button onClick={() => setActiveAmbientSounds({})} className="text-[10px] font-bold text-red-500 px-3 py-1 rounded-full bg-red-500/10 active:scale-95">LIMPAR TUDO</button>
                                    </div>
                                    
                                    {/* Grid of sounds */}
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 pb-20">
                                        {natureMixerTracks.map(sound => {
                                            const isActive = !!activeAmbientSounds[sound.id];
                                            const vol = activeAmbientSounds[sound.id] || 0;
                                            
                                            return (
                                                <div key={sound.id} className="flex flex-col items-center gap-2 group relative">
                                                    <div 
                                                        onClick={() => {
                                                            if (isActive) {
                                                                const newActive = { ...activeAmbientSounds };
                                                                delete newActive[sound.id];
                                                                setActiveAmbientSounds(newActive);
                                                            } else {
                                                                setActiveAmbientSounds({ ...activeAmbientSounds, [sound.id]: 30 });
                                                            }
                                                        }}
                                                        className={`relative w-16 h-16 rounded-3xl flex items-center justify-center text-2xl transition-all cursor-pointer select-none active:scale-90 ${isActive ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/20' : dm ? 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-800/80 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 shadow-sm'}`}
                                                    >
                                                        {sound.icon}
                                                        {isActive && (
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-400 rounded-full border-2 border-white dark:border-slate-900 animate-in zoom-in-50"></div>
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] font-bold uppercase tracking-tight text-center max-w-[64px] leading-tight ${isActive ? 'text-teal-500' : 'opacity-40'}`}>{sound.name}</span>
                                                    
                                                    {isActive && (
                                                        <div className="mt-1 flex items-center gap-1 group/vol">
                                                            <div className="h-1 w-12 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                                                                <div className="absolute inset-y-0 left-0 bg-teal-500 transition-all" style={{ width: `${vol}%` }}></div>
                                                                <input 
                                                                    type="range" min="0" max="100" value={vol} 
                                                                    onChange={(e) => setActiveAmbientSounds({...activeAmbientSounds, [sound.id]: Number(e.target.value)})}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className={`fixed bottom-28 left-0 right-0 p-6 flex justify-center backdrop-blur-xl border-t ${dm ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
                                        <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest text-center">Toque para ativar • Arraste para volume individual</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ritmo' && (
                                <div className="space-y-8 px-2">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest pl-1">Velocidade da Voz</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { val: 0.8, label: 'Lento e Profundo', icon: '🛖' },
                                                { val: 1.0, label: 'Ritmo Normal', icon: '🚶' },
                                                { val: 1.2, label: 'Mais Ágil', icon: '🏃' },
                                                { val: 1.5, label: 'Intenso', icon: '⚡' }
                                            ].map(s => (
                                                <button
                                                    key={s.val}
                                                    onClick={() => setPlaybackSpeed(s.val)}
                                                    className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-1 ${playbackSpeed === s.val ? 'border-teal-500 bg-teal-500/10' : dm ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}
                                                >
                                                    <span className="text-xl">{s.icon}</span>
                                                    <span className="text-[11px] font-bold">{s.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest pl-1">Pausas de Respiração</h3>
                                        <div className="flex gap-3">
                                            {[
                                                { id: 'longo', label: 'Longas', desc: 'Mais espaço' },
                                                { id: 'normal', label: 'Médias', desc: 'Padrão' },
                                                { id: 'agil', label: 'Curtas', desc: 'Fluido' }
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setPauseType(p.id as any)}
                                                    className={`flex-1 py-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center ${pauseType === p.id ? 'border-teal-500 bg-teal-500/10' : dm ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}
                                                >
                                                    <span className="text-xs font-extrabold">{p.label}</span>
                                                    <span className="text-[9px] opacity-50 font-medium">{p.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Close Toolbar */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className={`px-12 py-4 rounded-full font-bold text-sm shadow-xl transition-all active:scale-95 ${dm ? 'bg-teal-500 text-white shadow-teal-500/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
                            >
                                Aplicar e Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
