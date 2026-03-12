'use client';

import { useState } from 'react';

interface PlutchikWheelProps {
    onSelect: (emotion: string) => void;
    darkMode?: boolean;
}

const emotions = [
    { id: 'extase', label: 'Êxtase', color: '#FFEB3B', category: 'Joy' },
    { id: 'alegria', label: 'Alegria', color: '#FFF176', category: 'Joy' },
    { id: 'serenidade', label: 'Serenidade', color: '#FFF9C4', category: 'Joy' },

    { id: 'admiracao', label: 'Admiração', color: '#4CAF50', category: 'Trust' },
    { id: 'confianca', label: 'Confiança', color: '#81C784', category: 'Trust' },
    { id: 'aceitacao', label: 'Aceitação', color: '#C8E6C9', category: 'Trust' },

    { id: 'terror', label: 'Terror', color: '#2E7D32', category: 'Fear' },
    { id: 'medo', label: 'Medo', color: '#43A047', category: 'Fear' },
    { id: 'receio', label: 'Receio', color: '#A5D6A7', category: 'Fear' },

    { id: 'espanto', label: 'Espanto', color: '#0288D1', category: 'Surprise' },
    { id: 'surpresa', label: 'Surpresa', color: '#29B6F6', category: 'Surprise' },
    { id: 'distracao', label: 'Distração', color: '#B3E5FC', category: 'Surprise' },

    { id: 'moer', label: 'Pesar', color: '#1976D2', category: 'Sadness' },
    { id: 'tristeza', label: 'Tristeza', color: '#42A5F5', category: 'Sadness' },
    { id: 'tedio', label: 'Tédio', color: '#BBDEFB', category: 'Sadness' },

    { id: 'odio', label: 'Ódio', color: '#7E57C2', category: 'Disgust' },
    { id: 'nojo', label: 'Nojo', color: '#9575CD', category: 'Disgust' },
    { id: 'tedio_disgust', label: 'Aversão', color: '#D1C4E9', category: 'Disgust' },

    { id: 'furia', label: 'Fúria', color: '#E53935', category: 'Anger' },
    { id: 'raiva', label: 'Raiva', color: '#EF5350', category: 'Anger' },
    { id: 'aborrecimento', label: 'Aborrecimento', color: '#FFCDD2', category: 'Anger' },

    { id: 'vigilancia', label: 'Vigilância', color: '#FB8C00', category: 'Anticipation' },
    { id: 'antecipacao', label: 'Antecipação', color: '#FFA726', category: 'Anticipation' },
    { id: 'interesse', label: 'Interesse', color: '#FFE0B2', category: 'Anticipation' },
];

export default function PlutchikWheel({ onSelect, darkMode: dm }: PlutchikWheelProps) {
    const [hovered, setHovered] = useState<string | null>(null);

    const c = (base: string, dark: string) => dm ? dark : base;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {/* Simplified representation of the wheel using petals/slices */}
                    {emotions.map((em, i) => {
                        const angle = (i % 8) * 45;
                        const level = Math.floor(i / 8); // 0: outer (intense), 1: middle, 2: inner (mild)
                        const radius = 50 - (level * 12);
                        const innerRadius = radius - 10;

                        // Path for a slice
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

                        return (
                            <path
                                key={em.id}
                                d={`M ${ix1} ${iy1} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 0 0 ${ix1} ${iy1} Z`}
                                fill={em.color}
                                stroke={hovered === em.id ? (dm ? '#fff' : '#000') : 'none'}
                                strokeWidth="0.5"
                                className="cursor-pointer transition-all hover:opacity-80"
                                onMouseEnter={() => setHovered(em.id)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => onSelect(em.label)}
                            />
                        );
                    })}
                    <circle cx="50" cy="50" r="14" fill={c('#fff', '#1e293b')} />
                </svg>

                {hovered && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${c('bg-white text-gray-800', 'bg-slate-800 text-white')}`}>
                            {emotions.find(e => e.id === hovered)?.label}
                        </div>
                    </div>
                )}
            </div>

            <p className={`mt-4 text-xs font-medium text-center max-w-xs ${c('text-gray-500', 'text-slate-400')}`}>
                Toque em uma cor para selecionar a emoção que melhor descreve seu estado agora.
            </p>
        </div>
    );
}
