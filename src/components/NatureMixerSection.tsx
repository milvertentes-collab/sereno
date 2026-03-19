'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import SectionHeroCard from './SectionHeroCard';
interface SoundTrack {
    id: string;
    name: string;
    icon: string;
    src: string;
    color: string;
    category: 'todos' | 'chuva' | 'fogo' | 'frequencias' | 'vento' | 'mar' | 'floresta' | 'noite' | 'amanhecer' | 'agua';
}

interface BuiltinNaturePreset {
    label: string;
    mix: Record<string, number>;
    mood: string;
    blurb: string;
    accent: string;
}

export interface NatureMixPreset {
    label: string;
    mix: Record<string, number>;
    source?: 'custom' | 'builtin';
    builtinId?: string;
}

export interface AmbientFavoriteMixOption {
    id: string;
    name: string;
    emoji: string;
    mix: Record<string, number>;
    subtitle: string;
}

export const natureMixerTracks: SoundTrack[] = [
    { id: 'chuva1', name: 'Chuva', icon: '🌧️', src: '/musicas/chuva.mp3', color: 'from-blue-600 to-indigo-800', category: 'chuva' },
    { id: 'chuva2', name: 'Chuva na Janela', icon: '🪟', src: '/musicas/chuva na janela.mp3', color: 'from-blue-500 to-sky-700', category: 'chuva' },
    { id: 'chuva3', name: 'Chuva Forte', icon: '⛈️', src: '/musicas/chuva na janela 1.mp3', color: 'from-slate-600 to-blue-900', category: 'chuva' },
    { id: 'fogueira', name: 'Fogueira', icon: '🔥', src: '/musicas/fogueira.mp3', color: 'from-orange-500 to-red-800', category: 'fogo' },
    { id: 'lareira1', name: 'Lareira', icon: '🪵', src: '/musicas/lareira.mp3', color: 'from-amber-600 to-orange-900', category: 'fogo' },
    { id: 'lareira2', name: 'Lareira Alta', icon: '🧨', src: '/musicas/lareira 1.mp3', color: 'from-orange-600 to-red-700', category: 'fogo' },
    { id: 'lareira3', name: 'Lareira Suave', icon: '🕯️', src: '/musicas/lareira 2.mp3', color: 'from-yellow-600 to-amber-800', category: 'fogo' },
    { id: 'freq1', name: 'Frequência Relaxante', icon: '✨', src: '/musicas/Om Meditativo.mp3', color: 'from-purple-500 to-indigo-900', category: 'frequencias' },
    { id: 'freq2', name: 'Om Meditativo', icon: '🧘', src: '/musicas/Om Meditativo 1.mp3', color: 'from-fuchsia-500 to-purple-800', category: 'frequencias' },
    { id: 'meditacao', name: 'Meditação Profunda', icon: '🌌', src: '/musicas/meditação.mp3', color: 'from-indigo-400 to-violet-800', category: 'frequencias' },
    { id: 'dor', name: 'Para Dormir', icon: '💤', src: '/musicas/dormir.mp3', color: 'from-indigo-600 to-slate-900', category: 'noite' },
    { id: 'resp', name: 'Respiração', icon: '🌬️', src: '/musicas/respiração.mp3', color: 'from-sky-400 to-blue-600', category: 'vento' },
    { id: 'vento1', name: 'Vento', icon: '🍃', src: '/musicas/vento.mp3', color: 'from-emerald-500 to-teal-800', category: 'vento' },
    { id: 'vento2', name: 'Vento Forte', icon: '🎐', src: '/musicas/vento 1.mp3', color: 'from-teal-500 to-cyan-800', category: 'vento' },
    { id: 'mar1', name: 'Ondas do Mar', icon: '🌊', src: '/musicas/mar.mp3', color: 'from-cyan-500 to-blue-800', category: 'mar' },
    { id: 'mar2', name: 'Água do Mar', icon: '🧊', src: '/musicas/agua do mar.mp3', color: 'from-blue-400 to-cyan-700', category: 'mar' },
    { id: 'praia', name: 'Praia', icon: '🏖️', src: '/musicas/praia.mp3', color: 'from-yellow-200 to-blue-400', category: 'mar' },
    { id: 'floresta1', name: 'Floresta', icon: '🌲', src: '/musicas/florestas.mp3', color: 'from-green-600 to-emerald-900', category: 'floresta' },
    { id: 'floresta2', name: 'Floresta Densa', icon: '🌳', src: '/musicas/florestas 1.mp3', color: 'from-emerald-700 to-green-900', category: 'floresta' },
    { id: 'grilo1', name: 'Grilos Noturnos', icon: '🦗', src: '/musicas/grilo.mp3', color: 'from-lime-600 to-green-800', category: 'noite' },
    { id: 'grilo2', name: 'Canto de Grilos', icon: '🌌', src: '/musicas/grilo 1.mp3', color: 'from-green-800 to-gray-900', category: 'noite' },
    { id: 'noite1', name: 'Noite', icon: '🌙', src: '/musicas/noite.mp3', color: 'from-slate-700 to-black', category: 'noite' },
    { id: 'noite2', name: 'Noite Estrelada', icon: '⭐', src: '/musicas/noite 1.mp3', color: 'from-indigo-900 to-black', category: 'noite' },
    { id: 'noite3', name: 'Madrugada', icon: '🌃', src: '/musicas/noite 2.mp3', color: 'from-blue-900 to-slate-900', category: 'noite' },
    { id: 'dia', name: 'Amanhecer', icon: '🌅', src: '/musicas/dia.mp3', color: 'from-orange-300 to-yellow-500', category: 'amanhecer' },
    { id: 'passaro1', name: 'Pássaros', icon: '🐦', src: '/musicas/passaros 1.mp3', color: 'from-yellow-400 to-orange-500', category: 'amanhecer' },
    { id: 'passaro2', name: 'Canto dos Pássaros', icon: '🕊️', src: '/musicas/passaros 2.mp3', color: 'from-orange-400 to-red-500', category: 'amanhecer' },
    { id: 'passaro3', name: 'Revoada', icon: '🦅', src: '/musicas/passaros 3.mp3', color: 'from-red-400 to-rose-600', category: 'amanhecer' },
    { id: 'riacho1', name: 'Riacho', icon: '🏞️', src: '/musicas/riacho.mp3', color: 'from-cyan-400 to-blue-500', category: 'agua' },
    { id: 'riacho2', name: 'Água Corrente', icon: '💧', src: '/musicas/riacho 1.mp3', color: 'from-blue-400 to-indigo-500', category: 'agua' },
    { id: 'riacho3', name: 'Cachoeira Suave', icon: '🫧', src: '/musicas/riacho 2.mp3', color: 'from-sky-300 to-cyan-600', category: 'agua' },
    { id: 'riacho4', name: 'Rio Calmo', icon: '🛶', src: '/musicas/riacho 3.mp3', color: 'from-teal-400 to-emerald-600', category: 'agua' },
];

const trackCategories = [
    { id: 'todos', label: 'Todas', icon: '🎛️', accent: 'from-slate-500 to-slate-700' },
    { id: 'chuva', label: 'Chuva', icon: '🌧️', accent: 'from-blue-500 to-sky-700' },
    { id: 'fogo', label: 'Fogo', icon: '🔥', accent: 'from-orange-500 to-red-700' },
    { id: 'frequencias', label: 'Frequências', icon: '✨', accent: 'from-purple-500 to-indigo-700' },
    { id: 'vento', label: 'Vento', icon: '🍃', accent: 'from-emerald-500 to-teal-700' },
    { id: 'mar', label: 'Mar', icon: '🌊', accent: 'from-cyan-500 to-blue-700' },
    { id: 'floresta', label: 'Floresta', icon: '🌲', accent: 'from-green-600 to-emerald-800' },
    { id: 'noite', label: 'Noite', icon: '🌙', accent: 'from-indigo-700 to-slate-900' },
    { id: 'amanhecer', label: 'Amanhecer', icon: '🌅', accent: 'from-orange-300 to-yellow-500' },
    { id: 'agua', label: 'Água', icon: '💧', accent: 'from-sky-400 to-cyan-600' },
] as const;

const builtinPresets: BuiltinNaturePreset[] = [
    {
        label: '🧘 Foco Absoluto',
        mix: { chuva2: 60, lareira1: 20, freq1: 80 },
        mood: 'clareza',
        blurb: 'Frequência macia com chuva controlada para estudar ou entrar em fluxo.',
        accent: 'from-sky-500/25 via-indigo-500/20 to-violet-500/25',
    },
    {
        label: '🌊 Sono Profundo',
        mix: { dor: 70, mar1: 40, vento1: 20 },
        mood: 'sono',
        blurb: 'Camadas estáveis e noturnas para desacelerar o corpo e apagar com mais suavidade.',
        accent: 'from-indigo-500/30 via-sky-500/15 to-slate-900/40',
    },
    {
        label: '🏕️ Acampamento',
        mix: { floresta1: 60, fogueira: 50, grilo1: 30 },
        mood: 'abrigo',
        blurb: 'Floresta, fogo e noite para criar clima de refúgio quente e silencioso.',
        accent: 'from-emerald-500/25 via-orange-500/15 to-amber-500/25',
    },
    {
        label: '⛈️ Chuva Forte',
        mix: { chuva3: 80, vento2: 50 },
        mood: 'imersão',
        blurb: 'Uma parede sonora mais intensa para isolar ruído externo e mergulhar.',
        accent: 'from-blue-500/30 via-slate-500/20 to-cyan-500/20',
    },
    {
        label: '🌌 Meditação Zen',
        mix: { meditacao: 80, riacho1: 40, passaro1: 20 },
        mood: 'presença',
        blurb: 'Base contemplativa com água e amanhecer para prática silenciosa.',
        accent: 'from-violet-500/25 via-cyan-500/20 to-emerald-500/20',
    },
    {
        label: '🌅 Despertar Calmo',
        mix: { dia: 70, passaro2: 50, resp: 30 },
        mood: 'manhã',
        blurb: 'Um despertar leve, com ar, luz e pássaros para começo de rotina.',
        accent: 'from-orange-400/25 via-yellow-300/20 to-sky-400/20',
    },
    {
        label: '🌙 Noite Tranquila',
        mix: { noite1: 60, grilo2: 40, lareira3: 30 },
        mood: 'acolhimento',
        blurb: 'Noite suave com lareira baixa para desacelerar sem perder aconchego.',
        accent: 'from-slate-700/30 via-indigo-500/15 to-amber-400/15',
    },
    {
        label: '🏖️ Dia na Praia',
        mix: { praia: 60, mar2: 50, vento1: 30 },
        mood: 'leveza',
        blurb: 'Mar amplo e vento para limpar a mente e abrir espaço interno.',
        accent: 'from-cyan-400/25 via-blue-400/20 to-yellow-300/20',
    },
    {
        label: '🪷 Mantra 432Hz',
        mix: { freq2: 90, riacho3: 40 },
        mood: 'ritual',
        blurb: 'Frequência contínua com água macia para aprofundar presença e escuta.',
        accent: 'from-fuchsia-500/25 via-purple-500/20 to-cyan-400/15',
    },
];

export function loadNatureMixPresets(): NatureMixPreset[] {
    if (typeof window === 'undefined') return [];
    try {
        const saved = JSON.parse(localStorage.getItem('psico_nature_presets') || '[]');
        if (!Array.isArray(saved)) return [];
        return saved.filter((item): item is NatureMixPreset => {
            return Boolean(
                item &&
                typeof item.label === 'string' &&
                item.mix &&
                typeof item.mix === 'object'
            );
        });
    } catch {
        return [];
    }
}

export function loadAmbientFavoriteMixOptions(): AmbientFavoriteMixOption[] {
    return loadNatureMixPresets().map((preset, index) => {
        const orderedTracks = Object.entries(preset.mix)
            .filter(([, volume]) => volume > 0)
            .sort((a, b) => b[1] - a[1]);
        const leadTrack = orderedTracks[0] ? natureMixerTracks.find((item) => item.id === orderedTracks[0][0]) : null;
        const soundCount = Object.keys(preset.mix).filter((key) => preset.mix[key] > 0).length;
        return {
            id: `favorite-mix-${index}`,
            name: preset.label,
            emoji: leadTrack?.icon || '⭐',
            mix: preset.mix,
            subtitle: `${soundCount} sons combinados`,
        };
    });
}

const emitNatureMixUpdate = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('nature-mix-presets-updated'));
};

export default function NatureMixerSection({ darkMode: dm, desktopMode = false }: { darkMode?: boolean; desktopMode?: boolean }) {
    // State for volumes (0 to 100)
    const [volumes, setVolumes] = useState<Record<string, number>>(
        natureMixerTracks.reduce((acc, track) => ({ ...acc, [track.id]: 0 }), {})
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
    const [isMixPreviewPlaying, setIsMixPreviewPlaying] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<(typeof trackCategories)[number]['id']>('todos');
    const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
    const [editingPresetName, setEditingPresetName] = useState('');
    const [savePromptOpen, setSavePromptOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const categoryRailRef = useRef<HTMLDivElement | null>(null);

    // Refs for audio elements
    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
    const trackPreviewRefs = useRef<Record<string, HTMLAudioElement | null>>({});
    const mixPreviewRefs = useRef<Record<string, HTMLAudioElement | null>>({});

    const { toast } = useToast();

    // Custom presets from localStorage
    const [customPresets, setCustomPresets] = useState<NatureMixPreset[]>([]);

    useEffect(() => {
        setCustomPresets(loadNatureMixPresets());

        // Initialize audio elements lazily, otherwise browser might block 32 audios
        return () => {
            // Cleanup on unmount
            Object.values(audioRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
            Object.values(trackPreviewRefs.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
            Object.values(mixPreviewRefs.current).forEach(audio => {
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

    const getTrackPreviewAudio = (id: string) => {
        if (!trackPreviewRefs.current[id]) {
            const track = natureMixerTracks.find(t => t.id === id);
            if (track) {
                const audio = new Audio(encodeURI(track.src));
                audio.loop = true;
                audio.volume = 0.7;
                audio.preload = 'auto';
                trackPreviewRefs.current[id] = audio;
            }
        }
        return trackPreviewRefs.current[id];
    };

    const getMixPreviewAudio = (id: string) => {
        if (!mixPreviewRefs.current[id]) {
            const track = natureMixerTracks.find(t => t.id === id);
            if (track) {
                const audio = new Audio(encodeURI(track.src));
                audio.loop = true;
                audio.volume = 0;
                audio.preload = 'auto';
                mixPreviewRefs.current[id] = audio;
            }
        }
        return mixPreviewRefs.current[id];
    };

    const stopTrackPreview = () => {
        Object.values(trackPreviewRefs.current).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        setPreviewTrackId(null);
    };

    const stopMixPreview = () => {
        Object.values(mixPreviewRefs.current).forEach(audio => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        setIsMixPreviewPlaying(false);
    };

    const pauseMainMixer = () => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.pause();
            }
        });
        setIsPlaying(false);
    };

    const syncMixPreview = (nextVolumes: Record<string, number>) => {
        Object.entries(nextVolumes).forEach(([id, vol]) => {
            const audio = getMixPreviewAudio(id);
            if (!audio) return;
            audio.volume = vol / 100;
            if (vol > 0) {
                if (audio.paused) {
                    audio.currentTime = 0;
                    audio.play().catch(e => console.log('Mix preview failed:', e));
                }
            } else if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    };

    const handleVolumeChange = (id: string, value: number) => {
        const nextVolumes = { ...volumes, [id]: value };
        setVolumes(nextVolumes);
        const audio = getAudioElement(id);
        if (audio) {
            audio.volume = value / 100;
            if (value > 0 && isPlaying && audio.paused) {
                audio.play().catch(e => console.log('Audio play failed:', e));
            } else if (value === 0 && !audio.paused) {
                audio.pause();
            }
        }
        if (isMixPreviewPlaying) {
            if (Object.values(nextVolumes).every(vol => vol === 0)) {
                stopMixPreview();
            } else {
                syncMixPreview(nextVolumes);
            }
        }
    };

    const togglePlayPause = () => {
        const newIsPlaying = !isPlaying;
        if (newIsPlaying) {
            stopTrackPreview();
            stopMixPreview();
        }
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

        if (isMixPreviewPlaying) {
            if (Object.values(newVolumes).every(vol => vol === 0)) {
                stopMixPreview();
            } else {
                syncMixPreview(newVolumes);
            }
        }
    };

    const toggleTrackPreview = (id: string) => {
        if (previewTrackId === id) {
            stopTrackPreview();
            return;
        }
        stopMixPreview();
        pauseMainMixer();
        stopTrackPreview();
        const audio = getTrackPreviewAudio(id);
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Track preview failed:', e));
        setPreviewTrackId(id);
    };

    const toggleMixPreview = () => {
        if (isMixPreviewPlaying) {
            stopMixPreview();
            return;
        }
        if (activeCount === 0) {
            toast({ title: 'Mix vazio', description: 'Ative pelo menos um som para ouvir a prévia do mix.' });
            return;
        }
        stopTrackPreview();
        pauseMainMixer();
        setIsMixPreviewPlaying(true);
        syncMixPreview(volumes);
    };

    const scrollCategoryRail = (direction: 'left' | 'right') => {
        categoryRailRef.current?.scrollBy({
            left: direction === 'right' ? 260 : -260,
            behavior: 'smooth',
        });
    };

    // Active count
    const activeCount = Object.values(volumes).filter(v => v > 0).length;
    const activeTracks = natureMixerTracks.filter(track => (volumes[track.id] || 0) > 0);
    const dominantLayers = [...activeTracks]
        .sort((a, b) => (volumes[b.id] || 0) - (volumes[a.id] || 0))
        .slice(0, 3)
        .map((track, index) => ({
            ...track,
            volume: volumes[track.id] || 0,
            role: index === 0 ? 'base' : index === 1 ? 'textura' : 'detalhe',
        }));
    const filteredTracks = selectedCategory === 'todos'
        ? natureMixerTracks
        : natureMixerTracks.filter(track => track.category === selectedCategory);

    const mixGuidance = activeCount === 0
        ? 'Comece por um preset pronto ou ative manualmente uma primeira camada.'
        : activeCount === 1
            ? 'Seu mix já tem uma base. Adicione água, vento ou textura para ganhar profundidade.'
            : activeCount <= 3
                ? 'Boa combinação. Se quiser mais atmosfera, acrescente uma camada sutil de fundo.'
                : activeCount <= 5
                    ? 'O mix está equilibrado. Ajuste os volumes principais para destacar o clima que você quer.'
                    : 'Seu mix está mais denso. Se quiser mais clareza, reduza uma das camadas secundárias.';

    const featuredPresets = builtinPresets.slice(0, 4);
    const extraPresets = builtinPresets.slice(4);

    const openSaveCustomPresetPrompt = () => {
        const activeMix = Object.fromEntries(Object.entries(volumes).filter(([_, v]) => v > 0));
        if (Object.keys(activeMix).length === 0) {
            toast({ title: "Mix Vazio", description: "Adicione sons antes de salvar." });
            return;
        }
        setNewPresetName(`Meu Mix ${customPresets.length + 1}`);
        setSavePromptOpen(true);
    };

    const saveCustomPreset = () => {
        const trimmedName = newPresetName.trim();
        if (!trimmedName) {
            toast({ title: 'Nome vazio', description: 'Escolha um nome para salvar o seu mix.' });
            return;
        }
        const activeMix = Object.fromEntries(Object.entries(volumes).filter(([_, v]) => v > 0));
        if (Object.keys(activeMix).length === 0) {
            toast({ title: "Mix Vazio", description: "Adicione sons antes de salvar." });
            setSavePromptOpen(false);
            return;
        }
        const newPreset = {
            label: trimmedName,
            mix: activeMix
        };
        const updated = [...customPresets, newPreset];
        setCustomPresets(updated);
        localStorage.setItem('psico_nature_presets', JSON.stringify(updated));
        emitNatureMixUpdate();
        setSavePromptOpen(false);
        setNewPresetName('');
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
        emitNatureMixUpdate();
    };

    const startRenamePreset = (idx: number) => {
        setEditingPresetIndex(idx);
        setEditingPresetName(customPresets[idx]?.label ?? '');
    };

    const saveRenamedPreset = (idx: number) => {
        const trimmedName = editingPresetName.trim();
        if (!trimmedName) {
            toast({ title: 'Nome vazio', description: 'Escolha um nome para salvar o seu mix.' });
            return;
        }
        const updated = customPresets.map((preset, presetIndex) => (
            presetIndex === idx
                ? { ...preset, label: trimmedName }
                : preset
        ));
        setCustomPresets(updated);
        localStorage.setItem('psico_nature_presets', JSON.stringify(updated));
        emitNatureMixUpdate();
        setEditingPresetIndex(null);
        setEditingPresetName('');
    };

    const toggleBuiltInPresetFavorite = (presetId: string, label: string, mix: Record<string, number>) => {
        const cleanLabel = label.replace(/^[^\s]+\s*/, '').trim();
        const existingIndex = customPresets.findIndex((preset) =>
            preset.builtinId === presetId ||
            (
                preset.label.replace(/^⭐\s*/, '').trim().toLowerCase() === cleanLabel.toLowerCase() &&
                JSON.stringify(preset.mix) === JSON.stringify(mix)
            )
        );

        if (existingIndex >= 0) {
            const updated = customPresets.filter((_, index) => index !== existingIndex);
            setCustomPresets(updated);
            localStorage.setItem('psico_nature_presets', JSON.stringify(updated));
            emitNatureMixUpdate();
            toast({
                title: 'Removido dos favoritos',
                description: `${cleanLabel} saiu dos seus mixes salvos.`,
                className: dm ? 'bg-indigo-900 border-indigo-700 text-white' : 'bg-indigo-50 border-indigo-200'
            });
            return;
        }

        const updated: NatureMixPreset[] = [...customPresets, { label: cleanLabel, mix, source: 'builtin' as const, builtinId: presetId }];
        setCustomPresets(updated);
        localStorage.setItem('psico_nature_presets', JSON.stringify(updated));
        emitNatureMixUpdate();
        toast({
            title: 'Preset favoritado',
            description: `${cleanLabel} foi adicionado aos seus mixes.`,
            className: dm ? 'bg-indigo-900 border-indigo-700 text-white' : 'bg-indigo-50 border-indigo-200'
        });
    };

    return (
        <div className={`min-h-[calc(100vh-5rem)] p-4 sm:p-6 pb-32 animate-fade-in transition-colors duration-1000 ${dm ? 'bg-[#050510] text-slate-100' : 'bg-slate-900 text-slate-100'}`}>

            {/* Header */}
            <div className="pt-8 mb-10">
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="Ambiente sonoro"
                    title="Mixer Sonoro"
                    description="Misture chuva, vento, mar, floresta e frequências para criar um ambiente só seu."
                    icon="🎧"
                >
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-200">
                            {natureMixerTracks.length} sons
                        </div>
                        <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100">
                            {builtinPresets.length} presets
                        </div>
                        <div className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-indigo-100">
                            {customPresets.length} mixes salvos
                        </div>
                    </div>
                </SectionHeroCard>
            </div>

            <div className={`${desktopMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto mb-8`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Comece por um clima pronto</p>
                    </div>
                    <div className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                        4 destaques
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {featuredPresets.map((preset, idx) => {
                        const presetId = `featured-${idx}`;
                        const isFavorite = customPresets.some((item) => item.builtinId === presetId);
                        return (
                        <div
                            key={presetId}
                            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 text-left shadow-[0_20px_50px_-30px_rgba(15,23,42,0.85)]"
                        >
                            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${preset.accent}`} />
                            <button
                                type="button"
                                onClick={() => toggleBuiltInPresetFavorite(presetId, preset.label, preset.mix)}
                                className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:bg-black/35 ${isFavorite ? 'border-amber-300/40 bg-amber-500/20 text-amber-100' : 'border-white/10 bg-black/20 text-amber-200'}`}
                                title={isFavorite ? 'Retirar dos favoritos' : 'Adicionar aos favoritos'}
                            >
                                ★
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset(preset.mix)}
                                className="w-full text-left transition-all active:scale-[0.98]"
                            >
                            <div className="relative z-10">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">{preset.label.split(' ')[0]}</div>
                                    <div className="flex flex-wrap gap-2 pr-12">
                                        <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                                            {preset.mood}
                                        </div>
                                        <div className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                                            {Object.keys(preset.mix).length} sons
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-sm font-extrabold text-white">{preset.label.replace(/^[^\s]+\s/, '')}</div>
                                <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-300">{preset.blurb}</div>
                            </div>
                            </button>
                        </div>
                    )})}
                </div>
            </div>

            {/* Mixes prontos */}
            <div className={`${desktopMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto mb-10 space-y-8`}>
                <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Mixes prontos</p>
                        </div>
                        <div className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                            {builtinPresets.length} presets
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {extraPresets.map((preset, idx) => {
                            const presetId = `extra-${idx}`;
                            const isFavorite = customPresets.some((item) => item.builtinId === presetId);
                            return (
                                <div key={presetId} className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.85)]">
                                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${preset.accent}`} />
                                    <button
                                        type="button"
                                        onClick={() => toggleBuiltInPresetFavorite(presetId, preset.label, preset.mix)}
                                        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all hover:bg-black/35 ${isFavorite ? 'border-amber-300/40 bg-amber-500/20 text-amber-100' : 'border-white/10 bg-black/20 text-amber-200'}`}
                                        title={isFavorite ? 'Retirar dos favoritos' : 'Adicionar aos favoritos'}
                                    >
                                        ★
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPreset(preset.mix)}
                                        className="w-full pr-10 text-left transition-all active:scale-[0.98]"
                                    >
                                        <div className="relative z-10">
                                            <div className="flex items-start gap-2">
                                                <div className="text-lg">{preset.label.split(' ')[0]}</div>
                                                <div className="flex flex-wrap gap-2 pr-10">
                                                    <div className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                                                        {preset.mood}
                                                    </div>
                                                    <div className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                                                        {Object.keys(preset.mix).length} sons
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm font-extrabold text-white">{preset.label.replace(/^[^\s]+\s/, '')}</div>
                                            <div className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-300">{preset.blurb}</div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {customPresets.length > 0 && (
                    <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Seus mixes salvos</p>
                        </div>
                        <div className="rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-indigo-200">
                            {customPresets.length} salvos
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {customPresets.map((preset, idx) => (
                                <div key={`custom-${idx}`} className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-2 text-indigo-100 shadow-sm">
                                    {editingPresetIndex === idx ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editingPresetName}
                                                onChange={(e) => setEditingPresetName(e.target.value)}
                                                className="min-w-[8rem] bg-transparent px-2 text-sm font-bold text-white outline-none placeholder:text-indigo-200/60"
                                                placeholder="Nome do mix"
                                                maxLength={32}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => saveRenamedPreset(idx)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-100 transition-all hover:bg-emerald-500/30"
                                                title="Salvar nome"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingPresetIndex(null);
                                                    setEditingPresetName('');
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-indigo-100 transition-all hover:bg-white/20"
                                                title="Cancelar"
                                            >
                                                ×
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => applyPreset(preset.mix)}
                                                className="px-3 py-1.5 text-sm font-bold text-indigo-100 transition-all active:scale-95"
                                            >
                                                {preset.label}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => startRenamePreset(idx)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-indigo-100 transition-all hover:bg-white/20"
                                                title="Renomear mix"
                                            >
                                                ✎
                                            </button>
                                            {preset.source === 'builtin' && preset.builtinId ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleBuiltInPresetFavorite(preset.builtinId!, preset.label, preset.mix)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-100 transition-all hover:bg-amber-500/25"
                                                    title="Retirar dos favoritos"
                                                >
                                                    ★
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => deleteCustomPreset(idx)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-100 transition-all hover:bg-red-500/25"
                                                    title="Deletar mix"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Mixer Area */}
            <div className={`${desktopMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto overflow-hidden bg-white/5 border border-white/10 p-5 sm:p-6 rounded-[2.5rem] backdrop-blur-xl relative shadow-2xl`}>
                {/* Master Control */}
                <div className="sticky top-0 z-20 -mt-5 mb-8 rounded-t-[2.5rem] border-b border-white/10 bg-slate-900/80 px-4 pb-5 pt-4 backdrop-blur-xl sm:-mt-6 sm:px-6 sm:pb-6 sm:pt-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Seu mix atual</p>
                                <h3 className="mt-1 font-bold text-xl text-white">Monte o ambiente do seu momento</h3>
                                <p className="text-sm font-semibold text-slate-300">{activeCount} sons ativos</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Ativos</div>
                                <div className="mt-1 text-lg font-black text-white">{activeCount}</div>
                            </div>
                            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Categoria</div>
                                <div className="mt-1 text-sm font-black text-white">
                                    {trackCategories.find((category) => category.id === selectedCategory)?.label ?? 'Todas'}
                                </div>
                            </div>
                            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Salvos</div>
                                <div className="mt-1 text-lg font-black text-white">{customPresets.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Categorias</p>
                        </div>
                        <div className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                            {filteredTracks.length} sons
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => scrollCategoryRail('left')}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition-all hover:bg-white/[0.08]"
                            aria-label="Ver categorias anteriores"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <div
                            ref={categoryRailRef}
                            className="nature-category-rail flex min-w-0 flex-1 gap-3 overflow-x-auto hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
                        >
                            {trackCategories.map((category) => {
                                const isSelected = selectedCategory === category.id;
                                const count = category.id === 'todos'
                                    ? natureMixerTracks.length
                                    : natureMixerTracks.filter(track => track.category === category.id).length;

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`relative shrink-0 overflow-hidden rounded-[1.5rem] border px-4 py-3 text-left transition-all ${
                                            isSelected
                                                ? 'border-white/20 bg-white/[0.08] shadow-[0_20px_40px_-30px_rgba(15,23,42,0.95)]'
                                                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${category.accent} ${isSelected ? 'opacity-20' : 'opacity-10'}`} />
                                        <div className="relative flex items-center gap-3">
                                            <span className="text-xl">{category.icon}</span>
                                            <div>
                                                <div className="text-sm font-extrabold text-white">{category.label}</div>
                                                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">{count} sons</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() => scrollCategoryRail('right')}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition-all hover:bg-white/[0.08]"
                            aria-label="Ver mais categorias"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="mb-6 rounded-[2rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            {activeCount > 0 && (
                                <div className="w-fit rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                    {activeCount} ativos
                                </div>
                            )}
                            <button
                                onClick={toggleMixPreview}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${isMixPreviewPlaying ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
                            >
                                <span className="text-sm">{isMixPreviewPlaying ? '■' : '▶'}</span>
                                {isMixPreviewPlaying ? 'Parar prévia' : 'Ouvir prévia do mix'}
                            </button>
                            <button
                                onClick={() => applyPreset({})}
                                className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-red-100 transition-all hover:bg-red-500/25"
                            >
                                <span className="text-sm">✕</span>
                                Limpar todos
                            </button>
                            <button
                                onClick={openSaveCustomPresetPrompt}
                                className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-blue-100 transition-all hover:bg-blue-500/25"
                            >
                                <span className="text-sm">⭐</span>
                                Salvar mix
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="min-w-0 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Leitura do mix</p>
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">
                                    {isPlaying ? 'tocando' : 'pronto'}
                                </div>
                            </div>

                            {activeTracks.length > 0 ? (
                                <>
                                    <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(30,41,59,0.86)_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Camadas principais</div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">intensidade</div>
                                        </div>
                                        <div className="flex h-28 items-end gap-2">
                                        {dominantLayers.map((track) => (
                                            <div key={`viz-${track.id}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                                                <div className="flex h-full w-full items-end justify-center rounded-[1rem] border border-white/5 bg-white/[0.04] px-2 pb-2">
                                                    <div
                                                        className={`w-full rounded-[0.9rem] bg-gradient-to-t ${track.color} shadow-[0_0_18px_rgba(59,130,246,0.18)] transition-all duration-300`}
                                                        style={{ height: `${Math.max(track.volume, 18)}%` }}
                                                    />
                                                </div>
                                                <div className="space-y-1 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
                                                        {track.role}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-500">{track.volume}%</div>
                                                </div>
                                            </div>
                                        ))}
                                        {Array.from({ length: Math.max(0, 3 - dominantLayers.length) }).map((_, index) => (
                                            <div key={`empty-viz-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2 opacity-40">
                                                <div className="flex h-full w-full items-end justify-center rounded-[1rem] border border-white/5 bg-white/[0.04] px-2 pb-2">
                                                    <div className="h-[18%] w-full rounded-[0.9rem] bg-white/10" />
                                                </div>
                                                <div className="space-y-1 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                                                        vazio
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-600">--</div>
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {dominantLayers.map((track) => (
                                            <div key={`layer-${track.id}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-200">
                                                <span>{track.icon}</span>
                                                <span>{track.name}</span>
                                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
                                                    {track.role}
                                                </span>
                                                <span className="text-slate-400">{track.volume}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="mt-4 rounded-[1.25rem] border border-dashed border-white/10 bg-slate-950/35 px-4 py-5 text-center">
                                    <div className="text-3xl">🎛️</div>
                                    <p className="mt-3 text-sm font-bold text-white">Seu mix ainda está vazio.</p>
                                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-300">{mixGuidance}</p>
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Direção rápida</p>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-200">{mixGuidance}</p>

                            {activeTracks.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {dominantLayers.map((track) => (
                                        <div key={`guide-${track.id}`} className="min-w-0 rounded-[1.15rem] border border-white/10 bg-slate-950/35 px-3 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                                    <span className="text-lg">{track.icon}</span>
                                                    <div className="min-w-0">
                                                        <div className="break-words text-sm font-extrabold leading-tight text-white">{track.name}</div>
                                                        <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{track.role}</div>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-sm font-black text-slate-200">{track.volume}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 gap-y-5 max-h-[500px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                    {filteredTracks.map(track => {
                        const vol = volumes[track.id] || 0;
                        const isActive = vol > 0;

                        return (
                            <div
                                key={track.id}
                                className={`relative min-w-0 overflow-hidden rounded-[1.6rem] border p-3 transition-all duration-300 ${
                                    isActive
                                        ? 'opacity-100 border-white/15 bg-white/[0.06] shadow-[0_24px_44px_-32px_rgba(15,23,42,0.95)]'
                                        : 'border-white/5 bg-white/[0.025] opacity-85'
                                }`}
                            >
                                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${track.color} ${isActive ? 'opacity-18' : 'opacity-7'}`} />
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-white/5" />
                                <div className="relative">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex flex-1 items-center gap-3 pr-2">
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${isActive ? 'border-white/15 bg-white/10' : 'border-white/8 bg-black/15'}`}>
                                            <span className="text-2xl">{track.icon}</span>
                                        </div>
                                        <span className="block min-w-0 flex-1 whitespace-normal break-words text-sm font-bold leading-tight text-slate-200">{track.name}</span>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-end gap-2">
                                        {isActive && <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-300">Ativo</span>}
                                        <button
                                            type="button"
                                            onClick={() => toggleTrackPreview(track.id)}
                                            className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full border transition-all ${previewTrackId === track.id ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
                                            title={previewTrackId === track.id ? 'Parar prévia' : 'Ouvir prévia'}
                                        >
                                            {previewTrackId === track.id ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M8 5v14l11-7z"></path></svg>
                                            )}
                                        </button>
                                        <span className="w-9 shrink-0 text-right text-xs font-bold text-slate-400">{vol}%</span>
                                    </div>
                                </div>
                                <div className="relative h-14 flex items-center">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                                        <div className="h-8 rounded-full border border-white/5 bg-black/40 px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                            <div className="relative h-full overflow-hidden rounded-full">
                                                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_50%,rgba(255,255,255,0.04)_100%)]" />
                                                <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${track.color} transition-all duration-100 shadow-[0_0_18px_rgba(59,130,246,0.18)]`}
                                                    style={{ width: `${vol}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pointer-events-none absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
                                        {[0, 25, 50, 75, 100].map((tick) => (
                                            <span key={`${track.id}-tick-${tick}`} className="h-3 w-px bg-white/10" />
                                        ))}
                                    </div>
                                    <div className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2">
                                        <div
                                            className="h-9 w-9 rounded-full border border-white/20 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.28)] transition-all duration-100"
                                            style={{ marginLeft: `calc(${vol}% - 18px)` }}
                                        />
                                    </div>
                                    <div className="pointer-events-none absolute left-0 top-full mt-1 flex w-full justify-between px-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                                        <span>0</span>
                                        <span>25</span>
                                        <span>50</span>
                                        <span>75</span>
                                        <span>100</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={vol}
                                        onChange={(e) => handleVolumeChange(track.id, parseInt(e.target.value))}
                                        className="w-full relative z-10 appearance-none bg-transparent h-14 cursor-pointer [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent"
                                    />
                                </div>
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
                .nature-category-rail::-webkit-scrollbar { display: none; height: 0; }
            `}</style>

            {savePromptOpen && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
                    <div className={`w-full ${desktopMode ? 'max-w-xl' : 'max-w-md'} rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(10,15,24,0.98)_100%)] p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.95)]`}>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Salvar mix</p>
                        <h3 className="mt-2 text-xl font-black text-white">Qual nome você quer dar para este mixer?</h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">Escolha um nome curto para encontrar esse ambiente depois com mais facilidade.</p>

                        <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            autoFocus
                            maxLength={32}
                            placeholder="Ex.: Noite de chuva"
                            className="mt-4 w-full rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-slate-500 focus:border-indigo-400/40 focus:bg-white/[0.07]"
                        />

                        <div className="mt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSavePromptOpen(false);
                                    setNewPresetName('');
                                }}
                                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-200 transition-all hover:bg-white/10"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={saveCustomPreset}
                                className="flex-1 rounded-full bg-indigo-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(99,102,241,0.3)] transition-all hover:bg-indigo-400"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
