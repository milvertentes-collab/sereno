path = r'c:\Users\Romulo\Downloads\programa psicologia\src\components\NatureMixerSection.tsx'

content = """'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SoundTrack {
    id: string;
    name: string;
    icon: string;
    src: string;
    color: string;
}

const tracks: SoundTrack[] = [
    { id: 'rain', name: 'Chuva Forte', icon: '🌧️', src: '/ambient/chuva.mp3', color: 'from-blue-600 to-indigo-800' },
    { id: 'fire', name: 'Fogueira', icon: '🔥', src: '/ambient/fogueira.mp3', color: 'from-orange-500 to-red-800' },
    { id: 'freq432', name: 'Frequência 432Hz', icon: '✨', src: '/ambient/432hz.mp3', color: 'from-purple-500 to-indigo-900' },
    { id: 'wind', name: 'Vento Suave', icon: '🍃', src: '/ambient/vento.mp3', color: 'from-emerald-500 to-teal-800' },
    { id: 'waves', name: 'Ondas do Mar', icon: '🌊', src: '/ambient/ondas.mp3', color: 'from-cyan-500 to-blue-800' },
    { id: 'forest', name: 'Floresta Noturna', icon: '🦉', src: '/ambient/floresta.mp3', color: 'from-green-700 to-emerald-900' }
];

export default function NatureMixerSection({ darkMode: dm }: { darkMode?: boolean }) {
    // State for volumes (0 to 100)
    const [volumes, setVolumes] = useState<Record<string, number>>(
        tracks.reduce((acc, track) => ({ ...acc, [track.id]: 0 }), {})
    );
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Refs for audio elements
    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

    useEffect(() => {
        // Initialize audio elements
        tracks.forEach(track => {
            if (!audioRefs.current[track.id]) {
                const audio = new Audio(track.src);
                audio.loop = true;
                audio.volume = 0;
                audioRefs.current[track.id] = audio;
            }
        });

        return () => {
            // Cleanup on unmount
            Object.values(audioRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        };
    }, []);

    const handleVolumeChange = (id: string, value: number) => {
        setVolumes(prev => ({ ...prev, [id]: value }));
        const audio = audioRefs.current[id];
        if (audio) {
            audio.volume = value / 100;
            if (value > 0 && isPlaying && audio.paused) {
                audio.play().catch(e => console.log('Audio play failed:', e));
            } else if (value === 0 && !audio.paused) {
                audio.pause();
            }
        }
    };

    const togglePlayPause = () => {
        const newIsPlaying = !isPlaying;
        setIsPlaying(newIsPlaying);
        
        Object.keys(volumes).forEach(id => {
            const audio = audioRefs.current[id];
            if (audio) {
                if (newIsPlaying && volumes[id] > 0) {
                    audio.play().catch(e => console.log('Audio play failed:', e));
                } else if (!newIsPlaying) {
                    audio.pause();
                }
            }
        });
    };

    const applyPreset = (preset: Record<string, number>) => {
        const newVolumes = { ...volumes };
        tracks.forEach(t => newVolumes[t.id] = 0); // reset all
        Object.entries(preset).forEach(([k, v]) => newVolumes[k] = v);
        
        setVolumes(newVolumes);
        
        Object.entries(newVolumes).forEach(([id, vol]) => {
            const audio = audioRefs.current[id];
            if (audio) {
                audio.volume = vol / 100;
                if (isPlaying && vol > 0 && audio.paused) {
                    audio.play().catch(e => console.log('Audio play failed:', e));
                } else if ((!isPlaying || vol === 0) && !audio.paused) {
                    audio.pause();
                }
            }
        });
    };

    // Active count
    const activeCount = Object.values(volumes).filter(v => v > 0).length;

    return (
        <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in transition-colors duration-1000 ${dm ? 'bg-[#050510] text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
            
            {/* Header */}
            <div className="text-center pt-8 mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 backdrop-blur-md mb-4 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10">
                    <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🎧</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">Mixer da Natureza</h2>
                <p className="font-medium text-slate-400 max-w-sm mx-auto">
                    Crie seu próprio ambiente sonoro perfeito para focar, relaxar ou dormir profundamente.
                </p>
            </div>

            {/* Presets */}
            <div className="max-w-md mx-auto mb-10 overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex gap-3 px-2">
                    <button 
                        onClick={() => applyPreset({ rain: 60, fire: 20, freq432: 80 })}
                        className="shrink-0 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        🧘 Foco Absoluto
                    </button>
                    <button 
                        onClick={() => applyPreset({ waves: 70, wind: 30, freq432: 50 })}
                        className="shrink-0 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        🌊 Sono Profundo
                    </button>
                    <button 
                        onClick={() => applyPreset({ forest: 60, fire: 40, wind: 20 })}
                        className="shrink-0 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        🏕️ Noite no Campo
                    </button>
                    <button 
                        onClick={() => applyPreset({ rain: 80, wind: 50 })}
                        className="shrink-0 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        ⛈️ Tempestade
                    </button>
                </div>
            </div>

            {/* Main Mixer Area */}
            <div className="max-w-md mx-auto bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden shadow-2xl">
                {/* Master Control */}
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h3 className="font-bold text-lg text-white">Seu Mix Atual</h3>
                        <p className="text-xs font-semibold text-slate-400">{activeCount} sons ativos combinados</p>
                    </div>
                    <button 
                        onClick={togglePlayPause}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isPlaying ? (
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        ) : (
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"></path></svg>
                        )}
                    </button>
                </div>

                {/* Sliders */}
                <div className="space-y-6">
                    {tracks.map(track => {
                        const vol = volumes[track.id];
                        const isActive = vol > 0;
                        
                        return (
                            <div key={track.id} className={`transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60 grayscale-[50%]'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{track.icon}</span>
                                        <span className="font-bold text-sm text-slate-200">{track.name}</span>
                                    </div>
                                    <span className="text-xs font-bold w-8 text-right text-slate-400">{vol}%</span>
                                </div>
                                <div className="relative h-12 flex items-center">
                                    {/* Custom Range Slider Container */}
                                    <div className="absolute w-full h-8 bg-black/40 rounded-full overflow-hidden border border-white/5 pointer-events-none">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${track.color} transition-all duration-75`}
                                            style={{ width: `${vol}%` }}
                                        />
                                    </div>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={vol}
                                        onChange={(e) => handleVolumeChange(track.id, parseInt(e.target.value))}
                                        className="w-full relative z-10 appearance-none bg-transparent h-12 cursor-pointer
                                            [&::-webkit-slider-thumb]:appearance-none 
                                            [&::-webkit-slider-thumb]:w-6 
                                            [&::-webkit-slider-thumb]:h-6 
                                            [&::-webkit-slider-thumb]:bg-white 
                                            [&::-webkit-slider-thumb]:rounded-full 
                                            [&::-webkit-slider-thumb]:shadow-lg"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <p className="text-center mt-12 text-xs font-medium text-slate-500 max-w-xs mx-auto">
                Nota: Requer arquivos de áudio válidos na pasta /public/ambient/ para tocar sons reais.
            </p>
        </div>
    );
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
