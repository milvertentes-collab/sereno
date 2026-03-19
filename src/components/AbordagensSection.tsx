'use client';

import React, { useState } from 'react';
import SectionHeroCard from './SectionHeroCard';

const categories = [
    {
        title: 'Profundidade e Inconsciente',
        icon: '🌊',
        color: 'from-indigo-500/10 to-purple-500/10',
        borderColor: 'border-indigo-200/50',
        darkBorderColor: 'border-indigo-700/30',
        approaches: [
            {
                id: 'psicanalise',
                title: 'Psicanálise',
                icon: '🕰️',
                description: 'Busca compreender conteúdos inconscientes, conflitos internos, experiências da infância e desejos reprimidos. Tenta entender a raiz profunda do sofrimento e o sentido subjetivo do vivido.',
                when: 'Quando se quer autoconhecimento profundo, entender padrões repetitivos e conflitos emocionais antigos.'
            },
            {
                id: 'analitica',
                title: 'Psicologia Analítica (Junguiana)',
                icon: '🎨',
                description: 'Inspirada em Carl Jung, trabalha símbolos, sonhos, arquétipos e o processo de individuação. Foca no sentido da vida, identidade e integração da personalidade.',
                when: 'Para interessados em sonhos, simbolismos, crises existenciais e busca de propósito.'
            }
        ]
    },
    {
        title: 'Pensamentos, Comportamentos e Padrões',
        icon: '⚙️',
        color: 'from-blue-500/10 to-cyan-500/10',
        borderColor: 'border-blue-200/50',
        darkBorderColor: 'border-blue-700/30',
        approaches: [
            {
                id: 'tcc',
                title: 'Terapia Cognitivo-Comportamental (TCC)',
                icon: '💡',
                description: 'Foca na relação entre pensamentos, emoções e comportamentos. Estruturada e prática, é ideal para lidar com ansiedade, depressão e mudança de hábitos.',
                when: 'Para quem busca estratégias claras e aplicáveis no dia a dia para lidar com sintomas.'
            },
            {
                id: 'contextuais',
                title: 'Terapias Contextuais',
                icon: '🧩',
                description: 'Inclui ACT e DBT. Foca em aceitação, consciência plena e flexibilidade psicológica, ajudando a viver melhor mesmo com emoções difíceis.',
                when: 'Para lidar com autocrítica, impulsividade ou sofrimento emocional intenso.'
            },
            {
                id: 'behaviorismo',
                title: 'Behaviorismo',
                icon: '🔬',
                description: 'Analisa o comportamento humano através da aprendizagem e do ambiente. Foca em reforços, manutenção de hábitos e construção de novos repertórios.',
                when: 'Útil para mudanças concretas de hábitos, rotina e desenvolvimento de habilidades.'
            },
            {
                id: 'esquema',
                title: 'Terapia do Esquema',
                icon: '🗝️',
                description: 'Trabalha padrões emocionais profundos formados na infância (esquemas) que influenciam a autoestima e os relacionamentos.',
                when: 'Para padrões repetitivos fortes, medo de abandono e feridas emocionais antigas.'
            }
        ]
    },
    {
        title: 'Presença, Emoções e Autoconhecimento',
        icon: '✨',
        color: 'from-emerald-500/10 to-teal-500/10',
        borderColor: 'border-emerald-200/50',
        darkBorderColor: 'border-emerald-700/30',
        approaches: [
            {
                id: 'humanista',
                title: 'Humanista',
                icon: '🌱',
                description: 'Valoriza a autenticidade, liberdade e potencial humano. Vê a pessoa como capaz de se desenvolver em um ambiente de respeito e presença.',
                when: 'Para quem busca amadurecimento pessoal, autoestima e um espaço acolhedor.'
            },
            {
                id: 'acp',
                title: 'Abordagem Centrada na Pessoa (ACP)',
                icon: '🤝',
                description: 'Foca na empatia, escuta genuína e aceitação. Acredita que a pessoa tem recursos internos para crescer se estiver em um ambiente seguro.',
                when: 'Para quem deseja escuta profunda e acolhimento sem uma condução diretiva.'
            },
            {
                id: 'gestalt',
                title: 'Gestalt-terapia',
                icon: '👁️',
                description: 'Trabalha o "aqui e agora", a consciência física e emocional. Busca o contato real com as emoções e a responsabilidade pessoal.',
                when: 'Para desenvolver consciência emocional, presença e espontaneidade.'
            },
            {
                id: 'fenomenologia',
                title: 'Fenomenológico-Existencial',
                icon: '🛤️',
                description: 'Interessa-se pela experiência vivida, liberdade e angústia existencial. Compreende como a pessoa atribui significado à sua vida.',
                when: 'Para crises de sentido, mudanças profundas ou angústias existenciais.'
            },
            {
                id: 'logoterapia',
                title: 'Logoterapia',
                icon: '🧭',
                description: 'Focada na busca de sentido da vida (Viktor Frankl). Ajuda a encontrar direção e propósito mesmo em meio ao sofrimento.',
                when: 'Para vazio existencial, desmotivação ou busca de propósito de vida.'
            }
        ]
    },
    {
        title: 'Relações e Vínculos',
        icon: '🕊️',
        color: 'from-sky-500/10 to-blue-500/10',
        borderColor: 'border-sky-200/50',
        darkBorderColor: 'border-sky-700/30',
        approaches: [
            {
                id: 'sistemica',
                title: 'Sistêmica / Familiar',
                icon: '🕸️',
                description: 'Entende a pessoa dentro de seus sistemas (família, casal, contextos). Foca nas dinâmicas relacionais e de comunicação.',
                when: 'Para conflitos familiares, conjugais e padrões repetidos entre gerações.'
            },
            {
                id: 'interpessoal',
                title: 'Terapia Interpessoal (TIP)',
                icon: '💬',
                description: 'Foca em relações, mudanças de papel social, luto e dificuldades de vínculo. Melhora a qualidade das conexões afetivas.',
                when: 'Para luto, separação, conflitos de relacionamento ou isolamento social.'
            },
            {
                id: 'psicodrama',
                title: 'Psicodrama',
                icon: '🎭',
                description: 'Usa dramatização e recursos vivenciais para externar conflitos e emoções presas. Facilita a expressão através da ação.',
                when: 'Para dificuldades de expressão emocional ou preferência por vivências ativas.'
            }
        ]
    }
];

interface Props {
    darkMode?: boolean;
    onNavigate?: (tab: any, params?: Record<string, any>) => void;
}

export default function AbordagensSection({ darkMode: dm, onNavigate }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const c = (l: string, d: string) => (dm ? d : l);

    return (
        <div className="p-4 sm:p-6 animate-fade-in pb-32 max-w-lg mx-auto overflow-x-hidden">
            <div className="pt-4 mb-8">
                <SectionHeroCard
                    darkMode={dm}
                    eyebrow="Clareza de cuidado"
                    title="Abordagens Psicológicas"
                    description="Entenda estilos de terapia e reconheça por onde vale começar no seu momento."
                    icon="🎓"
                >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className={`rounded-2xl p-3 ${c('bg-white/80 border border-white text-slate-700', 'bg-slate-900/50 border border-slate-700 text-slate-200')}`}>
                            <p className="text-sm font-black">4 famílias principais</p>
                            <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Profundidade, padrões, presença e vínculos.</p>
                        </div>
                        <div className={`rounded-2xl p-3 ${c('bg-white/80 border border-white text-slate-700', 'bg-slate-900/50 border border-slate-700 text-slate-200')}`}>
                            <p className="text-sm font-black">Toque para abrir</p>
                            <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Cada abordagem mostra resumo e quando costuma fazer mais sentido.</p>
                        </div>
                    </div>
                </SectionHeroCard>
            </div>

            {/* Categorias e Abordagens */}
            <div className="space-y-12">
                {categories.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-6">
                        {/* Título da Categoria - Mais limpo para não "embolar" */}
                        <div className="flex items-center gap-3 px-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${dm ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100'}`}>
                                {cat.icon}
                            </div>
                            <h3 className={`text-sm font-black uppercase tracking-widest ${dm ? 'text-slate-300' : 'text-gray-800'}`}>
                                {cat.title}
                            </h3>
                        </div>

                        {/* Grade de Abordagens - 1 Coluna em Mobile para visibilidade máxima */}
                        <div className="grid grid-cols-1 gap-4">
                            {cat.approaches.map((approach) => (
                                <div
                                    key={approach.id}
                                    onClick={() => setSelectedId(selectedId === approach.id ? null : approach.id)}
                                    className={`relative overflow-hidden group p-5 rounded-3xl border transition-all duration-300 cursor-pointer ${selectedId === approach.id
                                        ? (dm ? 'bg-slate-800 border-indigo-500 shadow-lg' : 'bg-white border-indigo-400 shadow-lg')
                                        : (dm ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-100 hover:border-gray-200')
                                        }`}
                                >
                                    {/* Linha Superior: Ícone e Nome principal */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0 ${dm ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                            {approach.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-lg leading-tight ${dm ? 'text-slate-100' : 'text-gray-900'}`}>
                                                {approach.title}
                                            </h4>
                                            {selectedId !== approach.id && (
                                                <p className="text-xs font-medium opacity-50 mt-1">
                                                    Toque para ver mais
                                                </p>
                                            )}
                                        </div>
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform ${selectedId === approach.id ? 'rotate-180 bg-indigo-500/10 text-indigo-500' : 'text-gray-400'}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                                        </div>
                                    </div>

                                    {/* Conteúdo Expandido - Bem separado e legível */}
                                    <div className={`transition-all duration-500 ease-in-out ${selectedId === approach.id ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                        <div className="space-y-6 pt-2 border-t border-gray-100 dark:border-slate-700">
                                            <div>
                                                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${dm ? 'text-indigo-400' : 'text-indigo-600'}`}>🧐 Resumo</h5>
                                                <p className={`text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
                                                    {approach.description}
                                                </p>
                                            </div>

                                            <div>
                                                <h5 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${dm ? 'text-emerald-500' : 'text-emerald-600'}`}>🎯 Quando ajuda?</h5>
                                                <p className={`text-sm leading-relaxed font-bold italic ${dm ? 'text-slate-300' : 'text-gray-800'}`}>
                                                    {approach.when}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={`mt-10 p-5 rounded-[2rem] border ${c('bg-amber-50 border-amber-100', 'bg-amber-500/10 border-amber-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Se quiser seguir daqui</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {[
                        { label: 'Psicoeducação', hint: 'aprofundar temas com mais contexto', tab: 'psychoedu' },
                        { label: 'Dicionário Emocional', hint: 'nomear melhor o que você sente', tab: 'dictionary' },
                        { label: 'Exploração Vocacional', hint: 'seguir por identidade e caminho', tab: 'vocacional' },
                        { label: 'Mapa da Minha Vida', hint: 'olhar seu momento de forma mais ampla', tab: 'mapavida' },
                    ].map((item) => (
                        <button
                            key={item.tab}
                            type="button"
                            onClick={() => onNavigate?.(item.tab)}
                            className={`rounded-[1.4rem] border p-4 min-h-[88px] text-left transition-all ${c('bg-white border-white hover:border-amber-200', 'bg-slate-900/70 border-slate-700 hover:border-amber-500/30')}`}
                        >
                            <p className="text-sm font-black">{item.label}</p>
                            <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{item.hint}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className={`mt-16 p-8 rounded-3xl border text-center shadow-sm relative overflow-hidden backdrop-blur-md ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl shadow-sm ${dm ? 'bg-slate-700' : 'bg-gray-50 text-indigo-600'}`}>
                    ✨
                </div>

                <h4 className={`text-lg font-black mb-3 ${dm ? 'text-white' : 'text-indigo-950'}`}>
                    Lembrete Importante
                </h4>
                <p className={`text-sm leading-relaxed font-medium ${dm ? 'text-slate-400' : 'text-gray-600'}`}>
                    Mais importante do que o rótulo da abordagem é o vínculo, a segurança e a confiança no processo.
                </p>
            </div>
        </div>
    );
}
