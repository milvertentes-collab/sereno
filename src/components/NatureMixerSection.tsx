'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
interface SoundTrack {
    id: string;
    name: string;
    icon: string;
    src: string;
    color: string;
}

export const natureMixerTracks: SoundTrack[] = [
    { id: 'chuva1', name: 'Chuva', icon: '🌧️', src: '/musicas/chuva.mp3', color: 'from-blue-600 to-indigo-800' },
    { id: 'chuva2', name: 'Chuva na Janela', icon: '🪟', src: '/musicas/chuva na janela.mp3', color: 'from-blue-500 to-sky-700' },
    { id: 'chuva3', name: 'Chuva Forte', icon: '⛈️', src: '/musicas/chuva na janela 1.mp3', color: 'from-slate-600 to-blue-900' },
    { id: 'fogueira', name: 'Fogueira', icon: '🔥', src: '/musicas/fogueira.mp3', color: 'from-orange-500 to-red-800' },
    { id: 'lareira1', name: 'Lareira', icon: '🪵', src: '/musicas/lareira.mp3', color: 'from-amber-600 to-orange-900' },
    { id: 'lareira2', name: 'Lareira Alta', icon: '🧨', src: '/musicas/lareira 1.mp3', color: 'from-orange-600 to-red-700' },
    { id: 'lareira3', name: 'Lareira Suave', icon: '🕯️', src: '/musicas/lareira 2.mp3', color: 'from-yellow-600 to-amber-800' },
    { id: 'freq1', name: 'Frequência Relaxante', icon: '✨', src: '/musicas/Om Meditativo.mp3', color: 'from-purple-500 to-indigo-900' },
    { id: 'freq2', name: 'Om Meditativo', icon: '🧘', src: '/musicas/Om Meditativo 1.mp3', color: 'from-fuchsia-500 to-purple-800' },
    { id: 'meditacao', name: 'Meditação Profunda', icon: '🌌', src: '/musicas/meditação.mp3', color: 'from-indigo-400 to-violet-800' },
    { id: 'dor', name: 'Para Dormir', icon: '💤', src: '/musicas/dormir.mp3', color: 'from-indigo-600 to-slate-900' },
    { id: 'resp', name: 'Respiração', icon: '🌬️', src: '/musicas/respiração.mp3', color: 'from-sky-400 to-blue-600' },
    { id: 'vento1', name: 'Vento', icon: '🍃', src: '/musicas/vento.mp3', color: 'from-emerald-500 to-teal-800' },
    { id: 'vento2', name: 'Vento Forte', icon: '🎐', src: '/musicas/vento 1.mp3', color: 'from-teal-500 to-cyan-800' },
    { id: 'mar1', name: 'Ondas do Mar', icon: '🌊', src: '/musicas/mar.mp3', color: 'from-cyan-500 to-blue-800' },
    { id: 'mar2', name: 'Água do Mar', icon: '🧊', src: '/musicas/agua do mar.mp3', color: 'from-blue-400 to-cyan-700' },
    { id: 'praia', name: 'Praia', icon: '🏖️', src: '/musicas/praia.mp3', color: 'from-yellow-200 to-blue-400' },
    { id: 'floresta1', name: 'Floresta', icon: '🌲', src: '/musicas/florestas.mp3', color: 'from-green-600 to-emerald-900' },
    { id: 'floresta2', name: 'Floresta Densa', icon: '🌳', src: '/musicas/florestas 1.mp3', color: 'from-emerald-700 to-green-900' },
    { id: 'grilo1', name: 'Grilos Noturnos', icon: '🦗', src: '/musicas/grilo.mp3', color: 'from-lime-600 to-green-800' },
    { id: 'grilo2', name: 'Canto de Grilos', icon: '🌌', src: '/musicas/grilo 1.mp3', color: 'from-green-800 to-gray-900' },
    { id: 'noite1', name: 'Noite', icon: '🌙', src: '/musicas/noite.mp3', color: 'from-slate-700 to-black' },
    { id: 'noite2', name: 'Noite Estrelada', icon: '⭐', src: '/musicas/noite 1.mp3', color: 'from-indigo-900 to-black' },
    { id: 'noite3', name: 'Madrugada', icon: '🌃', src: '/musicas/noite 2.mp3', color: 'from-blue-900 to-slate-900' },
    { id: 'dia', name: 'Amanhecer', icon: '🌅', src: '/musicas/dia.mp3', color: 'from-orange-300 to-yellow-500' },
    { id: 'passaro1', name: 'Pássaros', icon: '🐦', src: '/musicas/passaros 1.mp3', color: 'from-yellow-400 to-orange-500' },
    { id: 'passaro2', name: 'Canto dos Pássaros', icon: '🕊️', src: '/musicas/passaros 2.mp3', color: 'from-orange-400 to-red-500' },
    { id: 'passaro3', name: 'Revoada', icon: '🦅', src: '/musicas/passaros 3.mp3', color: 'from-red-400 to-rose-600' },
    { id: 'riacho1', name: 'Riacho', icon: '🏞️', src: '/musicas/riacho.mp3', color: 'from-cyan-400 to-blue-500' },
    { id: 'riacho2', name: 'Água Corrente', icon: '💧', src: '/musicas/riacho 1.mp3', color: 'from-blue-400 to-indigo-500' },
    { id: 'riacho3', name: 'Cachoeira Suave', icon: '🫧', src: '/musicas/riacho 2.mp3', color: 'from-sky-300 to-cyan-600' },
    { id: 'riacho4', name: 'Rio Calmo', icon: '🛶', src: '/musicas/riacho 3.mp3', color: 'from-teal-400 to-emerald-600' },
];

export default function NatureMixerSection({ darkMode: dm }: { darkMode?: boolean }) {
    // State for volumes (0 to 100)
    const [volumes, setVolumes] = useState<Record<string, number>>(
        natureMixerTracks.reduce((acc, track) => ({ ...acc, [track.id]: 0 }), {})
    );
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs for audio elements
    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

    const { toast } = useToast();

    // Custom presets from localStorage
    const [customPresets, setCustomPresets] = useState<{ label: string; mix: Record<string, number> }[]>([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('psico_nature_presets') || '[]');
        setCustomPresets(saved);

        // Initialize audio elements lazily, otherwise browser might block 32 audios
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

    const getAudioElement = (id: string) => {
        if (!audioRefs.current[id]) {
            const track = natureMixerTracks.find(t => t.id === id);
            if (track) {
                // Encode URL to handle spaces in file names like 'chuva na janela 1.mp3'
                const audio = new Audio(encodeURI(track.src));
                audio.loop = true;
                audio.volume = 0;
                audioRefs.current[id] = audio;
            }
        }
        return audioRefs.current[id];
    };

    const handleVolumeChange = (id: string, value: number) => {
        setVolumes(prev => ({ ...prev, [id]: value }));
        const audio = getAudioElement(id);
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
            const audio = getAudioElement(id);
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
        natureMixerTracks.forEach(t => newVolumes[t.id] = 0); // reset all
        Object.entries(preset).forEach(([k, v]) => newVolumes[k] = v);

        setVolumes(newVolumes);

        Object.entries(newVolumes).forEach(([id, vol]) => {
            const audio = getAudioElement(id);
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

    // Filter categories to make it easier to navigate 32 sounds
    const presets: { label: string; mix: Record<string, number> }[] = [
        { label: '🧘 Foco Absoluto', mix: { chuva2: 60, lareira1: 20, freq1: 80 } },
        { label: '🌊 Sono Profundo', mix: { dor: 70, mar1: 40, vento1: 20 } },
        { label: '🏕️ Acampamento', mix: { floresta1: 60, fogueira: 50, grilo1: 30 } },
        { label: '⛈️ Chuva Forte', mix: { chuva3: 80, vento2: 50 } },
        { label: '🌌 Meditação Zen', mix: { meditacao: 80, riacho1: 40, passaro1: 20 } },
        { label: '🌅 Despertar Calmo', mix: { dia: 70, passaro2: 50, resp: 30 } },
        { label: '🌙 Noite Tranquila', mix: { noite1: 60, grilo2: 40, lareira3: 30 } },
        { label: '🏖️ Dia na Praia', mix: { praia: 60, mar2: 50, vento1: 30 } },
        { label: '🪷 Mantra 432Hz', mix: { freq2: 90, riacho3: 40 } },
    ];

    const saveCustomPreset = () => {
        const activeMix = Object.fromEntries(Object.entries(volumes).filter(([_, v]) => v > 0));
        if (Object.keys(activeMix).length === 0) {
            toast({ title: "Mix Vazio", description: "Adicione sons antes de salvar." });
            return;
        }

        const newPreset = {
            label: `⭐ Meu Mix ${customPresets.length + 1}`,
            mix: activeMix
        };
        const updated = [...customPresets, newPreset];
        setCustomPresets(updated);
        localStorage.setItem('psico_nature_presets', JSON.stringify(updated));
        toast({
            title: "Mix Salvo! ⭐",
            description: "A sua criação foi adicionada aos favoritos.",
            className: dm ? 'bg-indigo-900 border-indigo-700 text-white' : 'bg-indigo-50 border-indigo-200'
        });
    };

    const deleteCustomPreset = (idx: number) => {
        const updated = customPresets.filter((_, i) => i !== idx);
        setCustomPresets(updated);
        localStorage.setItem('psico_nature_presets', JSON.stringify(updated));
    };

    return (
        <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in transition-colors duration-1000 ${dm ? 'bg-[#050510] text-slate-100' : 'bg-slate-900 text-slate-100'}`}>

            {/* Header */}
            <div className="text-center pt-8 mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 backdrop-blur-md mb-4 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10">
                    <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🎧</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">Mixer da Natureza</h2>
                <p className="font-medium text-slate-400 max-w-sm mx-auto">
                    Crie seu próprio ambiente sonoro perfeito. Escolha entre dezenas de sons relaxantes.
                </p>
            </div>

            {/* Presets */}
            <div className="max-w-xl mx-auto mb-10 overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex flex-wrap justify-center gap-3 px-2">
                    {/* Custom Presets */}
                    {customPresets.map((preset, idx) => (
                        <div key={`custom-${idx}`} className="relative group inline-flex">
                            <button
                                onClick={() => applyPreset(preset.mix)}
                                className="px-5 py-2.5 rounded-full bg-indigo-500/20 shadow-sm border border-indigo-500/30 text-sm font-bold text-indigo-100 hover:bg-indigo-500/40 transition-all active:scale-95 pr-10"
                            >
                                {preset.label}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteCustomPreset(idx); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 text-indigo-200 hover:text-white hover:bg-red-500/60 transition-all opacity-0 group-hover:opacity-100"
                                title="Deletar Mix"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {/* Built-in Presets */}
                    {presets.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => applyPreset(preset.mix)}
                            className="px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                        >
                            {preset.label}
                        </button>
                    ))}

                    {/* Controls */}
                    <button
                        onClick={saveCustomPreset}
                        className="px-5 py-2.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-sm font-bold text-blue-100 hover:bg-blue-500/40 transition-all active:scale-95 flex items-center gap-2"
                    >
                        ⭐ Salvar Favorito
                    </button>
                    <button
                        onClick={() => applyPreset({})}
                        className="px-5 py-2.5 rounded-full bg-red-500/20 border border-red-500/30 text-sm font-bold text-red-100 hover:bg-red-500/40 transition-all active:scale-95"
                    >
                        🔇 Limpar Todos
                    </button>
                </div>
            </div>

            {/* Main Mixer Area */}
            <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-xl relative shadow-2xl">
                {/* Master Control */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10 sticky top-0 bg-slate-900/50 backdrop-blur-xl z-20 -mx-6 px-6 -mt-6 pt-6 rounded-t-[2.5rem]">
                    <div>
                        <h3 className="font-bold text-xl text-white">Seu Mix Atual</h3>
                        <p className="text-sm font-semibold text-slate-300">{activeCount} sons ativos combinados</p>
                    </div>
                    <button
                        onClick={togglePlayPause}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isPlaying ? (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"></path></svg>
                        )}
                    </button>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {natureMixerTracks.map(track => {
                        const vol = volumes[track.id] || 0;
                        const isActive = vol > 0;

                        return (
                            <div key={track.id} className={`transition-all duration-300 ${isActive ? 'opacity-100 bg-white/5 p-3 rounded-2xl border border-white/10' : 'opacity-60 grayscale-[50%] p-3'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{track.icon}</span>
                                        <span className="font-bold text-sm text-slate-200">{track.name}</span>
                                    </div>
                                    <span className="text-xs font-bold w-10 text-right text-slate-400">{vol}%</span>
                                </div>
                                <div className="relative h-10 flex items-center">
                                    {/* Custom Range Slider Container */}
                                    <div className="absolute w-full h-6 bg-black/40 rounded-full overflow-hidden border border-white/5 pointer-events-none">
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
                                        className="w-full relative z-10 appearance-none bg-transparent h-10 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}
