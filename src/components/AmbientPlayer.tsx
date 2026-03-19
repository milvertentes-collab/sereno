'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { natureMixerTracks } from '@/components/NatureMixerSection';

export interface Sound {
    id: string;
    name: string;
    emoji: string;
    category: string;
    file?: string;
    mix?: Record<string, number>;
}

interface AmbientPlayerProps {
    isVisible: boolean;
    onClose: () => void;
}

// ---- Sound catalog (all real MP3 files) ----
export const ambientSounds: Sound[] = [
    // 🌧️ Chuva
    { id: 'chuva', name: 'Chuva Suave', emoji: '🌧️', category: 'Chuva', file: '/musicas/chuva.mp3' },
    { id: 'chuva-janela', name: 'Chuva na Janela', emoji: '🪟', category: 'Chuva', file: '/musicas/chuva na janela.mp3' },
    { id: 'chuva-janela-longa', name: 'Tempestade na Janela', emoji: '⛈️', category: 'Chuva', file: '/musicas/chuva na janela 1.mp3' },

    // 🌊 Mar & Praia
    { id: 'mar', name: 'Ondas do Mar', emoji: '🌊', category: 'Mar', file: '/musicas/mar.mp3' },
    { id: 'agua-mar', name: 'Água do Mar', emoji: '💧', category: 'Mar', file: '/musicas/agua do mar.mp3' },
    { id: 'praia', name: 'Brisa da Praia', emoji: '🏖️', category: 'Mar', file: '/musicas/praia.mp3' },

    // 🌲 Floresta & Pássaros
    { id: 'floresta', name: 'Sons da Floresta', emoji: '🌲', category: 'Floresta', file: '/musicas/florestas.mp3' },
    { id: 'floresta-profunda', name: 'Floresta Profunda', emoji: '🌳', category: 'Floresta', file: '/musicas/florestas 1.mp3' },
    { id: 'passaros-1', name: 'Canto dos Pássaros', emoji: '🐦', category: 'Floresta', file: '/musicas/passaros 1.mp3' },
    { id: 'passaros-2', name: 'Pássaros ao Amanhecer', emoji: '🌅', category: 'Floresta', file: '/musicas/passaros 2.mp3' },
    { id: 'passaros-3', name: 'Pássaros Tropicais', emoji: '🦜', category: 'Floresta', file: '/musicas/passaros 3.mp3' },

    // 💧 Água & Riacho
    { id: 'riacho', name: 'Riacho Tranquilo', emoji: '💧', category: 'Água', file: '/musicas/riacho.mp3' },
    { id: 'riacho-1', name: 'Córrego Suave', emoji: '🏞️', category: 'Água', file: '/musicas/riacho 1.mp3' },
    { id: 'riacho-2', name: 'Rio Calmo', emoji: '🌿', category: 'Água', file: '/musicas/riacho 2.mp3' },
    { id: 'riacho-3', name: 'Cascata Serenidade', emoji: '🌊', category: 'Água', file: '/musicas/riacho 3.mp3' },

    // 🌬️ Vento
    { id: 'vento', name: 'Brisa Suave', emoji: '🌬️', category: 'Vento', file: '/musicas/vento.mp3' },
    { id: 'vento-1', name: 'Vento nos Campos', emoji: '🍃', category: 'Vento', file: '/musicas/vento 1.mp3' },

    // 🔥 Fogo & Lareira
    { id: 'fogueira', name: 'Fogueira Crepitante', emoji: '🔥', category: 'Fogo', file: '/musicas/fogueira.mp3' },
    { id: 'lareira', name: 'Lareira Aconchegante', emoji: '🏠', category: 'Fogo', file: '/musicas/lareira.mp3' },
    { id: 'lareira-1', name: 'Lareira Relaxante', emoji: '🪵', category: 'Fogo', file: '/musicas/lareira 1.mp3' },
    { id: 'lareira-2', name: 'Lareira Noturna', emoji: '🌙', category: 'Fogo', file: '/musicas/lareira 2.mp3' },

    // 🌙 Noite
    { id: 'noite', name: 'Noite Tranquila', emoji: '🌙', category: 'Noite', file: '/musicas/noite.mp3' },
    { id: 'noite-1', name: 'Noite Estrelada', emoji: '✨', category: 'Noite', file: '/musicas/noite 1.mp3' },
    { id: 'noite-2', name: 'Noite no Campo', emoji: '🦗', category: 'Noite', file: '/musicas/noite 2.mp3' },
    { id: 'grilo', name: 'Grilos na Noite', emoji: '🦗', category: 'Noite', file: '/musicas/grilo.mp3' },
    { id: 'grilo-1', name: 'Grilos e Cigarras', emoji: '🌿', category: 'Noite', file: '/musicas/grilo 1.mp3' },

    // 🧘 Meditação & Relaxamento
    { id: 'meditacao', name: 'Melodia de Meditação', emoji: '🧘', category: 'Meditação', file: '/musicas/meditação.mp3' },
    { id: 'om', name: 'Om Meditativo', emoji: '🕉️', category: 'Meditação', file: '/musicas/Om Meditativo.mp3' },
    { id: 'om-1', name: 'Om Curto', emoji: '☯️', category: 'Meditação', file: '/musicas/Om Meditativo 1.mp3' },
    { id: 'respiracao', name: 'Respiração Guiada', emoji: '🫁', category: 'Meditação', file: '/musicas/respiração.mp3' },
    { id: 'dormir', name: 'Ninar para Dormir', emoji: '😴', category: 'Meditação', file: '/musicas/dormir.mp3' },
    { id: 'dia', name: 'Luz do Dia', emoji: '☀️', category: 'Meditação', file: '/musicas/dia.mp3' },
];

const categories = ['Todos', 'Meus Mixes', 'Chuva', 'Mar', 'Floresta', 'Água', 'Vento', 'Fogo', 'Noite', 'Meditação'];

export default function AmbientPlayer({ isVisible, onClose }: AmbientPlayerProps) {
    const [playingItem, setPlayingItem] = useState<Sound | null>(null);
    const [volume, setVolume] = useState(50);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [customMixes, setCustomMixes] = useState<Sound[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    const audioRefs = useRef<{ audio: HTMLAudioElement; originalVolume: number }[]>([]);

    useEffect(() => {
        try {
            const savedFavs = localStorage.getItem('ambientFavorites');
            if (savedFavs) setFavorites(JSON.parse(savedFavs));

            const savedMixesStr = localStorage.getItem('psico_nature_presets');
            if (savedMixesStr) {
                const savedMixes = JSON.parse(savedMixesStr);
                const mappedMixes: Sound[] = savedMixes.map((p: any, idx: number) => ({
                    id: `custom-mix-${idx}`,
                    name: p.label,
                    emoji: '⭐',
                    category: 'Meus Mixes',
                    mix: p.mix
                }));
                setCustomMixes(mappedMixes);
            }
        } catch { /* ignore */ }
    }, [isVisible]);

    const saveFavorites = (newFavs: string[]) => {
        setFavorites(newFavs);
        localStorage.setItem('ambientFavorites', JSON.stringify(newFavs));
    };

    const toggleFavorite = (id: string) => {
        const newFavs = favorites.includes(id)
            ? favorites.filter(f => f !== id)
            : [...favorites, id];
        saveFavorites(newFavs);
    };

    const stopAll = useCallback(() => {
        audioRefs.current.forEach(item => {
            item.audio.pause();
            item.audio.currentTime = 0;
        });
        audioRefs.current = [];
        setPlayingItem(null);
    }, []);

    const playSound = useCallback((sound: Sound) => {
        if (playingItem?.id === sound.id) {
            stopAll();
            return;
        }
        stopAll();

        const newAudios: { audio: HTMLAudioElement; originalVolume: number }[] = [];

        if (sound.mix) {
            // It's a custom mix with multiple tracks
            Object.entries(sound.mix).forEach(([trackId, trackVol]) => {
                const track = natureMixerTracks.find(t => t.id === trackId);
                if (track && trackVol > 0) {
                    const audio = new Audio(encodeURI(track.src));
                    audio.loop = true;
                    // Adjust by global volume
                    audio.volume = (trackVol / 100) * (volume / 100);
                    audio.play().catch(e => console.error('Audio play error:', e));
                    newAudios.push({ audio, originalVolume: trackVol / 100 });
                }
            });
        } else if (sound.file) {
            // It's a single sound
            const audio = new Audio(encodeURI(sound.file));
            audio.loop = true;
            audio.volume = volume / 100;
            audio.play().catch(e => console.error('Audio play error:', e));
            newAudios.push({ audio, originalVolume: 1.0 });
        }

        audioRefs.current = newAudios;
        setPlayingItem(sound);
    }, [playingItem, volume, stopAll]);

    // Update volume dynamically
    useEffect(() => {
        audioRefs.current.forEach(item => {
            // Recalculate based on track's original internal volume multiplied by master
            item.audio.volume = item.originalVolume * (volume / 100);
        });
    }, [volume]);

    // Cleanup
    useEffect(() => {
        return () => {
            audioRefs.current.forEach(item => {
                item.audio.pause();
            });
            audioRefs.current = [];
        };
    }, []);

    const allSounds = [...customMixes, ...ambientSounds];

    const filteredSounds = allSounds.filter(s => {
        if (showFavoritesOnly && !favorites.includes(s.id)) return false;
        if (selectedCategory !== 'Todos' && s.category !== selectedCategory) return false;
        return true;
    });

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800">🎵 Sons Ambientes</h3>
                        <div className="flex items-center gap-2">
                            {playingItem && (
                                <button onClick={stopAll} className="px-3 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold active:scale-95">
                                    ⏹ Parar
                                </button>
                            )}
                            <button onClick={onClose} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold active:scale-95">
                                Fechar
                            </button>
                        </div>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-sm">🔉</span>
                        <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="flex-1 accent-indigo-500 h-2" />
                        <span className="text-sm">🔊</span>
                        <span className="text-xs text-gray-500 w-8 text-right">{volume}%</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-4 py-3 border-b border-gray-50">
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${showFavoritesOnly ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-600'}`}
                        >
                            ⭐ Favoritos
                        </button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-gray-100 text-gray-600'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sound List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredSounds.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-3xl mb-2">🎵</p>
                            <p className="text-sm">{showFavoritesOnly ? 'Nenhum favorito ainda' : 'Nenhum som nesta categoria'}</p>
                        </div>
                    ) : (
                        filteredSounds.map(sound => (
                            <div key={sound.id}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${playingItem?.id === sound.id ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}
                            >
                                <button onClick={() => playSound(sound)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingItem?.id === sound.id ? 'bg-indigo-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                                >
                                    {playingItem?.id === sound.id ? '⏸' : '▶'}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{sound.emoji}</span>
                                        <span className="text-sm font-extrabold text-gray-800">{sound.name}</span>
                                    </div>
                                    <span className="text-xs text-indigo-400 font-bold">
                                        {sound.category}
                                    </span>
                                </div>

                                <button onClick={() => toggleFavorite(sound.id)} className="p-2 rounded-lg bg-white/60 active:scale-95 transition-colors" title={favorites.includes(sound.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                                    <span className={`text-lg ${favorites.includes(sound.id) ? '' : 'opacity-40'}`}>
                                        {favorites.includes(sound.id) ? '⭐' : '☆'}
                                    </span>
                                </button>

                                {playingItem?.id === sound.id && (
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
