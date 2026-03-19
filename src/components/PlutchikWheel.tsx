'use client';

import { useMemo, useState } from 'react';

interface PlutchikWheelProps {
    onSelect: (emotion: string) => void;
    darkMode?: boolean;
}

type EmotionFamily =
    | 'joy'
    | 'trust'
    | 'fear'
    | 'surprise'
    | 'sadness'
    | 'disgust'
    | 'anger'
    | 'anticipation';

interface WheelEmotion {
    id: string;
    label: string;
    color: string;
    family: EmotionFamily;
    intensityLabel: string;
    linkedMood: string;
}

const familyMeta: Record<EmotionFamily, { label: string; hint: string }> = {
    joy: { label: 'Alegria', hint: 'Estados de prazer, bem-estar e expansão.' },
    trust: { label: 'Confiança', hint: 'Sensação de segurança, vínculo e abertura.' },
    fear: { label: 'Medo', hint: 'Estados de alerta, receio e proteção.' },
    surprise: { label: 'Surpresa', hint: 'Mudança repentina, espanto ou confusão.' },
    sadness: { label: 'Tristeza', hint: 'Perda, abatimento e recolhimento.' },
    disgust: { label: 'Aversão', hint: 'Repulsa, rejeição e incômodo.' },
    anger: { label: 'Raiva', hint: 'Fricção, irritação e impulso de defesa.' },
    anticipation: { label: 'Antecipação', hint: 'Expectativa, curiosidade e preparação.' },
};

const emotions: WheelEmotion[] = [
    { id: 'extase', label: 'Êxtase', color: '#FFEB3B', family: 'joy', intensityLabel: 'Muito intensa', linkedMood: 'animado' },
    { id: 'alegria', label: 'Alegria', color: '#FFF176', family: 'joy', intensityLabel: 'Presente', linkedMood: 'feliz' },
    { id: 'serenidade', label: 'Serenidade', color: '#FFF9C4', family: 'joy', intensityLabel: 'Mais suave', linkedMood: 'calmo' },

    { id: 'admiracao', label: 'Admiração', color: '#4CAF50', family: 'trust', intensityLabel: 'Muito intensa', linkedMood: 'grato' },
    { id: 'confianca', label: 'Confiança', color: '#81C784', family: 'trust', intensityLabel: 'Presente', linkedMood: 'esperancoso' },
    { id: 'aceitacao', label: 'Aceitação', color: '#C8E6C9', family: 'trust', intensityLabel: 'Mais suave', linkedMood: 'calmo' },

    { id: 'terror', label: 'Terror', color: '#2E7D32', family: 'fear', intensityLabel: 'Muito intensa', linkedMood: 'ansioso' },
    { id: 'medo', label: 'Medo', color: '#43A047', family: 'fear', intensityLabel: 'Presente', linkedMood: 'ansioso' },
    { id: 'receio', label: 'Receio', color: '#A5D6A7', family: 'fear', intensityLabel: 'Mais suave', linkedMood: 'pensativo' },

    { id: 'espanto', label: 'Espanto', color: '#0288D1', family: 'surprise', intensityLabel: 'Muito intensa', linkedMood: 'confuso' },
    { id: 'surpresa', label: 'Surpresa', color: '#29B6F6', family: 'surprise', intensityLabel: 'Presente', linkedMood: 'pensativo' },
    { id: 'distracao', label: 'Distração', color: '#B3E5FC', family: 'surprise', intensityLabel: 'Mais suave', linkedMood: 'confuso' },

    { id: 'pesar', label: 'Pesar', color: '#1976D2', family: 'sadness', intensityLabel: 'Muito intensa', linkedMood: 'triste' },
    { id: 'tristeza', label: 'Tristeza', color: '#42A5F5', family: 'sadness', intensityLabel: 'Presente', linkedMood: 'triste' },
    { id: 'tedio', label: 'Tédio', color: '#BBDEFB', family: 'sadness', intensityLabel: 'Mais suave', linkedMood: 'cansado' },

    { id: 'odio', label: 'Ódio', color: '#7E57C2', family: 'disgust', intensityLabel: 'Muito intensa', linkedMood: 'irritado' },
    { id: 'nojo', label: 'Nojo', color: '#9575CD', family: 'disgust', intensityLabel: 'Presente', linkedMood: 'irritado' },
    { id: 'aversao', label: 'Aversão', color: '#D1C4E9', family: 'disgust', intensityLabel: 'Mais suave', linkedMood: 'envergonhado' },

    { id: 'furia', label: 'Fúria', color: '#E53935', family: 'anger', intensityLabel: 'Muito intensa', linkedMood: 'irritado' },
    { id: 'raiva', label: 'Raiva', color: '#EF5350', family: 'anger', intensityLabel: 'Presente', linkedMood: 'irritado' },
    { id: 'aborrecimento', label: 'Aborrecimento', color: '#FFCDD2', family: 'anger', intensityLabel: 'Mais suave', linkedMood: 'estressado' },

    { id: 'vigilancia', label: 'Vigilância', color: '#FB8C00', family: 'anticipation', intensityLabel: 'Muito intensa', linkedMood: 'sobrecarregado' },
    { id: 'antecipacao', label: 'Antecipação', color: '#FFA726', family: 'anticipation', intensityLabel: 'Presente', linkedMood: 'pensativo' },
    { id: 'interesse', label: 'Interesse', color: '#FFE0B2', family: 'anticipation', intensityLabel: 'Mais suave', linkedMood: 'motivado' },
];

export default function PlutchikWheel({ onSelect, darkMode: dm }: PlutchikWheelProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);

    const c = (base: string, dark: string) => (dm ? dark : base);
    const activeEmotion = useMemo(() => {
        const currentId = hovered || selected;
        return emotions.find((emotion) => emotion.id === currentId) || null;
    }, [hovered, selected]);

    const selectEmotion = (emotion: WheelEmotion) => {
        setSelected(emotion.id);
        onSelect(emotion.linkedMood);
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`rounded-[2rem] p-5 mb-4 border w-full max-w-md shadow-sm ${c('bg-white border-slate-100', 'bg-slate-900/70 border-slate-700')}`}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className={`text-xs font-black uppercase tracking-wider ${c('text-slate-500', 'text-slate-400')}`}>Como ler a roda</p>
                        <p className={`text-sm font-semibold mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                            As pétalas externas mostram emoções mais intensas. As internas revelam versões mais suaves da mesma família emocional.
                        </p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-slate-50 border border-slate-200 text-slate-500', 'bg-slate-800 border border-slate-700 text-slate-400')}`}>
                        24 emoções
                    </span>
                </div>
            </div>

            <div className={`relative w-80 h-80 sm:w-96 sm:h-96 rounded-[2.6rem] border p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] ${c('bg-[radial-gradient(circle_at_center,#ffffff_0%,#f8fbff_55%,#eef2ff_100%)] border-slate-200', 'bg-[radial-gradient(circle_at_center,#101827_0%,#0b1320_55%,#09111b_100%)] border-slate-700')}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {emotions.map((emotion, index) => {
                        const angle = (index % 8) * 45;
                        const level = Math.floor(index / 8);
                        const radius = 50 - (level * 12);
                        const innerRadius = radius - 10;
                        const startAngle = angle - 22;
                        const endAngle = angle + 22;
                        const x1 = 50 + radius * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 50 + radius * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 50 + radius * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 50 + radius * Math.sin((endAngle * Math.PI) / 180);
                        const ix1 = 50 + innerRadius * Math.cos((startAngle * Math.PI) / 180);
                        const iy1 = 50 + innerRadius * Math.sin((startAngle * Math.PI) / 180);
                        const ix2 = 50 + innerRadius * Math.cos((endAngle * Math.PI) / 180);
                        const iy2 = 50 + innerRadius * Math.sin((endAngle * Math.PI) / 180);
                        const isActive = hovered === emotion.id || selected === emotion.id;

                        return (
                            <path
                                key={emotion.id}
                                d={`M ${ix1} ${iy1} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 0 0 ${ix1} ${iy1} Z`}
                                fill={emotion.color}
                                stroke={isActive ? (dm ? '#ffffff' : '#0f172a') : 'rgba(255,255,255,0.35)'}
                                strokeWidth={isActive ? '1.2' : '0.35'}
                                className={`cursor-pointer transition-all ${isActive ? 'opacity-100' : 'hover:opacity-85'}`}
                                onMouseEnter={() => setHovered(emotion.id)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => selectEmotion(emotion)}
                            />
                        );
                    })}
                    <circle cx="50" cy="50" r="14" fill={c('#ffffff', '#0f172a')} />
                    <text x="50" y="47" textAnchor="middle" className={`fill-current text-[4px] font-bold ${dm ? 'text-slate-200' : 'text-slate-700'}`}>
                        Roda
                    </text>
                    <text x="50" y="53" textAnchor="middle" className={`fill-current text-[4px] font-bold ${dm ? 'text-slate-200' : 'text-slate-700'}`}>
                        das
                    </text>
                    <text x="50" y="59" textAnchor="middle" className={`fill-current text-[4px] font-bold ${dm ? 'text-slate-200' : 'text-slate-700'}`}>
                        emoções
                    </text>
                </svg>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-36 text-center rounded-[1.8rem] px-4 py-3 shadow-[0_18px_35px_rgba(15,23,42,0.18)] ${c('bg-white/96 text-slate-800 border border-white', 'bg-slate-800/95 text-white border border-slate-700')}`}>
                        <p className="text-sm font-black">{activeEmotion?.label || 'Toque em uma pétala'}</p>
                        <p className={`text-[11px] mt-1 font-semibold leading-relaxed ${c('text-slate-500', 'text-slate-400')}`}>
                            {activeEmotion
                                ? `${familyMeta[activeEmotion.family].label} • ${activeEmotion.intensityLabel}`
                                : 'Veja a família emocional e a intensidade'}
                        </p>
                    </div>
                </div>
            </div>

            {activeEmotion && (
                <div className={`mt-4 w-full max-w-md rounded-[2rem] p-5 border shadow-sm ${c('bg-white border-slate-100', 'bg-slate-900/70 border-slate-700')}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-black">{activeEmotion.label}</p>
                            <p className={`text-xs mt-1 font-semibold leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
                                {familyMeta[activeEmotion.family].hint}
                            </p>
                        </div>
                        <span className={`px-3 py-2 rounded-2xl text-[11px] font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>
                            {activeEmotion.intensityLabel}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 w-full max-w-md">
                {Object.entries(familyMeta).map(([family, meta]) => {
                    const familyColor = emotions.find((emotion) => emotion.family === family)?.color || '#CBD5E1';
                    return (
                        <div
                            key={family}
                            className={`rounded-[1.3rem] p-3 border ${c('bg-white border-slate-100', 'bg-slate-900/70 border-slate-700')}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: familyColor }} />
                                <p className="text-xs font-black">{meta.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={`mt-5 w-full max-w-md rounded-[2rem] p-4 border sm:hidden ${c('bg-white border-slate-100', 'bg-slate-900/70 border-slate-700')}`}>
                <p className={`text-xs font-black uppercase tracking-wider mb-3 ${c('text-slate-500', 'text-slate-400')}`}>Toque facilitado no celular</p>
                <p className={`text-xs font-medium mb-4 ${c('text-slate-600', 'text-slate-400')}`}>
                    Se preferir, escolha por aqui. É a mesma roda em formato de botões maiores.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {emotions.map((emotion) => {
                        const isActive = selected === emotion.id;
                        return (
                            <button
                                key={`mobile-${emotion.id}`}
                                type="button"
                                onClick={() => selectEmotion(emotion)}
                                className={`rounded-2xl px-3 py-3 text-left border transition-all ${isActive ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500' : ''} ${c('bg-slate-50 border-slate-200', 'bg-slate-950 border-slate-700')}`}
                            >
                                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: emotion.color }} />
                                <span className="text-sm font-bold">{emotion.label}</span>
                                <p className={`text-[11px] mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{familyMeta[emotion.family].label} • {emotion.intensityLabel}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className={`mt-4 text-xs font-medium text-center max-w-sm ${c('text-gray-500', 'text-slate-400')}`}>
                Toque em uma pétala para usar essa leitura como ponto de partida no seu diário.
            </p>
        </div>
    );
}
