'use client';

import { useMemo, useState } from 'react';
import { MoodEntry } from '@/components/MoodSection';
import SectionHeroCard from './SectionHeroCard';

interface Props {
  darkMode?: boolean;
  moodHistory: MoodEntry[];
  onNavigate?: (tab: 'diary' | 'solta' | 'carta', params?: Record<string, any>) => void;
}

type RangeFilter = '7' | '30' | 'all';

const emotionAdvice: Record<string, string> = {
  ansioso: 'Quando a ansiedade surgir, tente diminuir estímulos e começar por uma respiração curta e simples.',
  triste: 'Quando a tristeza aparecer, vale escolher acolhimento e um contato seguro antes de exigir produtividade.',
  irritado: 'Quando a irritação vier, tente pausar antes de responder e solte tensão no corpo primeiro.',
  estressado: 'Quando o estresse subir, água, pausa breve e um passo por vez costumam ajudar.',
  sobrecarregado: 'Quando o excesso aparecer, quebre o próximo movimento em algo realmente pequeno.',
  cansado: 'Quando o cansaço dominar, priorize descanso e reduza a autocobrança.',
  confuso: 'Quando a confusão vier, nomear em uma frase simples já ajuda a organizar.',
  solitario: 'Quando a solidão aparecer, um gesto curto de conexão pode fazer diferença.',
  feliz: 'Quando o bem-estar aparecer, vale notar o que ajudou para repetir depois.',
  calmo: 'Quando a calma surgir, tente protegê-la com menos pressa e mais constância.',
  motivado: 'Quando a motivação vier, use essa energia em uma ação concreta agora.',
};

const MAX_TRANSITION_GAP_MS = 1000 * 60 * 60 * 24 * 3;

const emotionLabels: Record<string, string> = {
  feliz: 'feliz',
  calmo: 'calmo',
  animado: 'animado',
  grato: 'grato',
  esperancoso: 'esperançoso',
  motivado: 'motivado',
  cansado: 'cansado',
  pensativo: 'pensativo',
  sensivel: 'sensível',
  confuso: 'confuso',
  ansioso: 'ansioso',
  triste: 'triste',
  irritado: 'irritado',
  estressado: 'estressado',
  sobrecarregado: 'sobrecarregado',
  desmotivado: 'desmotivado',
  solitario: 'solitário',
  envergonhado: 'envergonhado',
};

function displayEmotion(emotion: string) {
  return emotionLabels[emotion] || emotion;
}

function getMoodTimestamp(entry: MoodEntry) {
  const datePart = entry.date || '';
  const timePart = entry.time || '12:00';
  const parsed = new Date(`${datePart}T${timePart}`);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function EmotionalMindMapSection({ darkMode: dm, moodHistory, onNavigate }: Props) {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('30');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const c = (l: string, d: string) => (dm ? d : l);

  const filteredMoodHistory = useMemo(() => {
    if (rangeFilter === 'all') return moodHistory;
    const now = Date.now();
    const days = Number(rangeFilter);
    return moodHistory.filter((entry) => getMoodTimestamp(entry) >= now - days * 24 * 60 * 60 * 1000);
  }, [moodHistory, rangeFilter]);

  const connections = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const sorted = [...filteredMoodHistory].sort((a, b) => getMoodTimestamp(a) - getMoodTimestamp(b));
    let prev: MoodEntry | null = null;
    sorted.forEach((entry) => {
      const cur = entry.primaryEmotion;
      if (prev && cur && prev.primaryEmotion) {
        const gap = getMoodTimestamp(entry) - getMoodTimestamp(prev);
        if (gap > 0 && gap <= MAX_TRANSITION_GAP_MS) {
          if (!map[prev.primaryEmotion]) map[prev.primaryEmotion] = {};
          map[prev.primaryEmotion][cur] = (map[prev.primaryEmotion][cur] || 0) + 1;
        }
      }
      prev = entry;
    });
    return map;
  }, [filteredMoodHistory]);

  const emotions = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMoodHistory.forEach((m) => {
      if (m.primaryEmotion) counts[m.primaryEmotion] = (counts[m.primaryEmotion] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [filteredMoodHistory]);

  const emotionColor: Record<string, string> = {
    feliz: '#FFF176', calmo: '#81D4FA', animado: '#FFB74D', grato: '#AED581',
    esperancoso: '#80CBC4', motivado: '#FF8A65', cansado: '#B0BEC5', pensativo: '#CE93D8',
    sensivel: '#F48FB1', confuso: '#B39DDB', ansioso: '#FFE082', triste: '#90CAF9',
    irritado: '#FFAB91', estressado: '#EF9A9A', sobrecarregado: '#B39DDB', desmotivado: '#E0E0E0',
    solitario: '#BCAAA4', envergonhado: '#D7CCC8'
  };

  const positions = emotions.map((_, i) => {
    const angle = (i / Math.max(1, emotions.length)) * 2 * Math.PI - Math.PI / 2;
    const radius = 118;
    return { x: 170 + radius * Math.cos(angle), y: 170 + radius * Math.sin(angle) };
  });

  const nodeSizes = useMemo(() => {
    const counts = emotions.map(([, count]) => count);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    return emotions.reduce<Record<string, number>>((acc, [emotion, count]) => {
      if (min === max) {
        acc[emotion] = 62;
        return acc;
      }
      const normalized = (count - min) / (max - min);
      acc[emotion] = 54 + normalized * 28;
      return acc;
    }, {});
  }, [emotions]);

  const svgLines = useMemo(() => {
    const lines: { from: string; to: string; x1: number; y1: number; x2: number; y2: number; w: number; count: number }[] = [];
    emotions.forEach(([e1], i) => {
      const conns = connections[e1] || {};
      Object.entries(conns).forEach(([e2, count]) => {
        const j = emotions.findIndex(([e]) => e === e2);
        if (j >= 0 && i !== j) {
          lines.push({ from: e1, to: e2, x1: positions[i].x, y1: positions[i].y, x2: positions[j].x, y2: positions[j].y, w: Math.min(5 + count, 12), count });
        }
      });
    });
    return lines;
  }, [emotions, connections, positions]);

  const topTransitions = useMemo(() => [...svgLines].sort((a, b) => b.count - a.count).slice(0, 3), [svgLines]);

  const selectedDetails = useMemo(() => {
    if (!selectedEmotion) return null;
    const outgoing = Object.entries(connections[selectedEmotion] || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const incoming = Object.entries(connections)
      .filter(([from]) => from !== selectedEmotion)
      .map(([from, map]) => ({ from, count: map[selectedEmotion] || 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
    const count = filteredMoodHistory.filter((m) => m.primaryEmotion === selectedEmotion).length;
    return { outgoing, incoming, count };
  }, [selectedEmotion, connections, filteredMoodHistory]);

  const comparisonInsight = useMemo(() => {
    if (!filteredMoodHistory.length) return 'Quando você tiver mais registros, esta comparação vai mostrar como seus padrões recentes se relacionam com o último mês.';

    const now = Date.now();
    const d7 = filteredMoodHistory.filter((m) => new Date(m.date).getTime() >= now - 7 * 24 * 60 * 60 * 1000);
    const d30 = filteredMoodHistory.filter((m) => new Date(m.date).getTime() >= now - 30 * 24 * 60 * 60 * 1000);

    const avg = (arr: MoodEntry[]) => arr.length ? arr.reduce((s, m) => s + (m.intensity || 3), 0) / arr.length : 0;
    const avg7 = avg(d7);
    const avg30 = avg(d30);

    const topEmotion = (arr: MoodEntry[]) => {
      const counts: Record<string, number> = {};
      arr.forEach((m) => { if (m.primaryEmotion) counts[m.primaryEmotion] = (counts[m.primaryEmotion] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    };

    if (!d7.length || !d30.length) return 'Continue registrando: em breve vai dar para comparar seu ritmo emocional recente com um período maior.';

      return `Nos últimos 7 dias, a sua intensidade média ficou em ${avg7.toFixed(1)}, enquanto nos 30 dias ficou em ${avg30.toFixed(1)}. Seu estado mais recorrente recentemente foi "${displayEmotion(topEmotion(d7) || '—')}", e no período maior foi "${displayEmotion(topEmotion(d30) || '—')}".`;
  }, [filteredMoodHistory]);

  const comparisonStats = useMemo(() => {
    if (!filteredMoodHistory.length) return null;

    const now = Date.now();
    const d7 = filteredMoodHistory.filter((m) => getMoodTimestamp(m) >= now - 7 * 24 * 60 * 60 * 1000);
    const d30 = filteredMoodHistory.filter((m) => getMoodTimestamp(m) >= now - 30 * 24 * 60 * 60 * 1000);

    const avg = (arr: MoodEntry[]) => arr.length ? arr.reduce((sum, item) => sum + (item.intensity || 3), 0) / arr.length : 0;
    const topEmotion = (arr: MoodEntry[]) => {
      const counts: Record<string, number> = {};
      arr.forEach((m) => {
        if (m.primaryEmotion) counts[m.primaryEmotion] = (counts[m.primaryEmotion] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    };

    return {
      avg7: avg(d7),
      avg30: avg(d30),
      top7: topEmotion(d7),
      top30: topEmotion(d30),
      delta: avg(d7) - avg(d30),
      count7: d7.length,
      count30: d30.length,
    };
  }, [filteredMoodHistory]);

  const personalizedInsight = useMemo(() => {
    if (!filteredMoodHistory.length) return 'Quando você tiver mais registros, este mapa vai começar a mostrar caminhos emocionais que se repetem com você.';

    const latest = filteredMoodHistory[filteredMoodHistory.length - 1]?.primaryEmotion;
    const top = topTransitions[0];

    if (top) {
      return `Seu padrão mais comum recentemente foi "${displayEmotion(top.from)} → ${displayEmotion(top.to)}". Quando ${displayEmotion(top.from)} aparece, ele costuma caminhar para ${displayEmotion(top.to)}.`;
    }

    if (latest) {
      return `Seu estado mais recente foi "${displayEmotion(latest)}". Com mais registros, vamos conseguir ver melhor para onde ele costuma caminhar.`;
    }

    return 'Continue registrando para liberar leituras mais personalizadas.';
  }, [filteredMoodHistory, topTransitions]);

  const exportSummary = useMemo(() => {
    const periodLabel = rangeFilter === '7' ? 'últimos 7 dias' : rangeFilter === '30' ? 'últimos 30 dias' : 'todo o histórico';
    const top = topTransitions[0];
    const summaryParts = [
      `Mapa Mental Emocional (${periodLabel})`,
      top
        ? `Padrão principal: ${displayEmotion(top.from)} → ${displayEmotion(top.to)}.`
        : 'Ainda não há um caminho emocional dominante.',
      comparisonStats
        ? `Intensidade média: ${comparisonStats.avg7.toFixed(1)} nos últimos 7 dias e ${comparisonStats.avg30.toFixed(1)} nos últimos 30 dias.`
        : null,
      comparisonStats?.top7
        ? `Emoção mais recorrente recentemente: ${displayEmotion(comparisonStats.top7)}.`
        : null,
    ].filter(Boolean);

    return summaryParts.join(' ');
  }, [comparisonStats, rangeFilter, topTransitions]);

  const handleCopySummary = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportSummary);
        setCopiedSummary(true);
        window.setTimeout(() => setCopiedSummary(false), 1800);
      }
    } catch {
      setCopiedSummary(false);
    }
  };

  const handleExportAction = async (destination: 'copy' | 'diary' | 'solta' | 'carta' | 'close') => {
    if (destination === 'copy') {
      await handleCopySummary();
      setShowExportModal(false);
      return;
    }

    if (destination === 'close') {
      setShowExportModal(false);
      return;
    }

    const draftKey = Date.now();
    if (destination === 'diary') {
      onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: exportSummary, diaryDraftKey: draftKey, from: 'mindmap' });
    }
    if (destination === 'solta') {
      onNavigate?.('solta', { soltaDraft: exportSummary, soltaDraftKey: draftKey, from: 'mindmap' });
    }
    if (destination === 'carta') {
      onNavigate?.('carta', { cartaDraft: exportSummary, cartaDraftKey: draftKey, cartaType: 'personalizada', from: 'mindmap' });
    }
    setShowExportModal(false);
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Padrões, não rótulos"
          title="Mapa Mental Emocional"
          description="Veja como seus estados aparecem, se repetem e costumam se encadear. É um retrato do momento, não uma definição de quem você é."
          icon="🗺️"
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[
            { value: '7' as RangeFilter, label: 'Últimos 7 dias' },
            { value: '30' as RangeFilter, label: '30 dias' },
            { value: 'all' as RangeFilter, label: 'Todos' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setRangeFilter(option.value);
                setSelectedEmotion(null);
              }}
              className={`px-3.5 py-2 rounded-full text-[11px] font-black transition-all duration-300 ${
                rangeFilter === option.value
                  ? c('bg-sky-600 text-white shadow-[0_10px_24px_rgba(14,165,233,0.22)]', 'bg-sky-500 text-slate-950 shadow-[0_10px_24px_rgba(56,189,248,0.2)]')
                  : c('bg-white text-slate-600 border border-slate-200 hover:border-sky-200 hover:text-sky-700', 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-sky-700 hover:text-sky-300')
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {emotions.length > 0 ? (
        <>
          <div className={`rounded-[2.2rem] p-5 border mb-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] ${c('bg-gradient-to-br from-white via-sky-50/65 to-indigo-50/40 border-slate-100', 'bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-sky-950/40 border-slate-700')}`}>
            <svg viewBox="0 0 340 340" className="w-full max-w-[22rem] mx-auto">
              {svgLines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={selectedEmotion && selectedEmotion !== line.from && selectedEmotion !== line.to ? (dm ? '#334155' : '#e2e8f0') : (dm ? '#64748b' : '#cbd5e1')}
                  strokeWidth={line.w}
                  opacity={!selectedEmotion || selectedEmotion === line.from || selectedEmotion === line.to ? 0.6 : 0.14}
                  className="transition-all duration-500 ease-out"
                  strokeDasharray={selectedEmotion && (selectedEmotion === line.from || selectedEmotion === line.to) ? '10 8' : '7 7'}
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="34"
                    to="0"
                    dur={selectedEmotion && (selectedEmotion === line.from || selectedEmotion === line.to) ? '1.1s' : '1.9s'}
                    repeatCount="indefinite"
                  />
                </line>
              ))}
              {emotions.map(([emotion, count], i) => {
                const size = nodeSizes[emotion] || 62;
                const labelSize = emotion.length > 12 ? 8 : emotion.length > 9 ? 9 : 10;
                return (
                  <g
                    key={emotion}
                    transform={`translate(${positions[i].x}, ${positions[i].y})`}
                    style={{ cursor: 'pointer' }}
                    className="transition-all duration-300 ease-out"
                    onClick={() => setSelectedEmotion(emotion)}
                  >
                    <circle r={size / 2} fill={emotionColor[emotion] || '#e2e8f0'} stroke={selectedEmotion === emotion ? '#0ea5e9' : (dm ? '#1e293b' : '#cbd5e1')} strokeWidth={selectedEmotion === emotion ? '5' : '2.5'} opacity={!selectedEmotion || selectedEmotion === emotion ? '1' : '0.72'} />
                    <text textAnchor="middle" dy="-2" fontSize={labelSize} fontWeight="bold" fill={dm ? '#0f172a' : '#1e293b'}>{displayEmotion(emotion)}</text>
                    <text textAnchor="middle" dy="14" fontSize="9" fill={dm ? '#334155' : '#475569'}>{count}x</text>
                  </g>
                );
              })}
              <circle cx="170" cy="170" r="24" fill="#0ea5e9" />
              <text textAnchor="middle" x="170" y="167" fontSize="10" fontWeight="bold" fill="white">VOCÊ</text>
              <text textAnchor="middle" x="170" y="180" fontSize="8" fill="white">agora</text>
            </svg>
          </div>

          <div className={`rounded-[2rem] p-5 border mb-4 ${c('bg-gradient-to-br from-white to-slate-50 border-slate-100 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.25)]', 'bg-gradient-to-br from-slate-800/80 to-slate-900/70 border-slate-700 shadow-[0_14px_35px_-30px_rgba(2,6,23,0.5)]')}`}>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-900 text-slate-300 border border-slate-700')}`}>Círculos maiores = mais frequentes</span>
              <span className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-900 text-slate-300 border border-slate-700')}`}>Linhas = caminhos que mais se repetem</span>
            </div>
          </div>

          {selectedEmotion && selectedDetails && (
            <div className={`rounded-[2rem] p-5 border mb-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] ${c('bg-gradient-to-br from-white via-sky-50/35 to-indigo-50/30 border-slate-100', 'bg-gradient-to-br from-slate-800/85 to-slate-900/80 border-slate-700')}`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-black text-lg">Foco em {displayEmotion(selectedEmotion)}</h3>
                  <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Essa emoção apareceu {selectedDetails.count} vez{selectedDetails.count === 1 ? '' : 'es'}.</p>
                </div>
                <button onClick={() => setSelectedEmotion(null)} className="text-xs text-sky-500 font-bold">Limpar foco</button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div className={`rounded-2xl p-4 ${c('bg-sky-50 border border-sky-100', 'bg-slate-900/60 border border-slate-700')}`}>
                  <p className="font-black mb-3">➡️ Costuma caminhar para</p>
                  {selectedDetails.outgoing.length
                    ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDetails.outgoing.map(([to, n]) => (
                          <span key={to} className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-white text-sky-800 border border-sky-100', 'bg-slate-800 text-sky-300 border border-slate-700')}`}>
                            {displayEmotion(to)} • {n}x
                          </span>
                        ))}
                      </div>
                    )
                    : <p className="opacity-70">Ainda não há um caminho forte registrado.</p>}
                </div>
                <div className={`rounded-2xl p-4 ${c('bg-indigo-50 border border-indigo-100', 'bg-slate-900/60 border border-slate-700')}`}>
                  <p className="font-black mb-3">⬅️ Costuma vir de</p>
                  {selectedDetails.incoming.length
                    ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDetails.incoming.map((item) => (
                          <span key={item.from} className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-white text-indigo-800 border border-indigo-100', 'bg-slate-800 text-indigo-300 border border-slate-700')}`}>
                            {displayEmotion(item.from)} • {item.count}x
                          </span>
                        ))}
                      </div>
                    )
                    : <p className="opacity-70">Ainda não há um padrão de origem claro.</p>}
                </div>
              </div>

              <div className={`rounded-2xl p-4 mt-4 ${c('bg-amber-50 border border-amber-100', 'bg-slate-900/70 border border-slate-700')}`}>
                <p className="font-black text-sm mb-2">Próximo cuidado prático</p>
                <p className="text-sm leading-relaxed">{emotionAdvice[selectedEmotion] || 'Quando essa emoção aparecer, tente nomeá-la e escolher uma ação pequena antes de seguir no automático.'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: `Hoje o estado mais em foco parece ser ${displayEmotion(selectedEmotion)}.`, diaryDraftKey: Date.now(), from: 'mindmap' })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-white text-amber-800 border border-amber-100', 'bg-slate-800 text-amber-300 border border-slate-700')}`}
                  >
                    Levar ao diário
                  </button>
                  <button
                    onClick={() => onNavigate?.('solta', { soltaDraft: `Quando ${displayEmotion(selectedEmotion)} aparece, o que isso pede de mim agora?\n\n`, soltaDraftKey: Date.now(), from: 'mindmap' })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-white text-amber-800 border border-amber-100', 'bg-slate-800 text-amber-300 border border-slate-700')}`}
                  >
                    Soltar daqui
                  </button>
                  <button
                    onClick={() => onNavigate?.('carta', { cartaDraft: `Quero escrever para a parte de mim que está em ${displayEmotion(selectedEmotion)}.\n\n`, cartaDraftKey: Date.now(), cartaType: 'personalizada', from: 'mindmap' })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-white text-amber-800 border border-amber-100', 'bg-slate-800 text-amber-300 border border-slate-700')}`}
                  >
                    Virar carta
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={`rounded-[2rem] p-5 border mb-4 shadow-[0_18px_40px_-30px_rgba(99,102,241,0.3)] ${c('bg-gradient-to-br from-indigo-50 via-violet-50 to-white border-indigo-100', 'bg-gradient-to-br from-indigo-900/25 to-slate-900/80 border-indigo-800')}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-black">🪄 Leitura personalizada</h3>
              <button
                onClick={() => setShowExportModal(true)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${
                  copiedSummary
                    ? c('bg-emerald-100 text-emerald-700 border border-emerald-200', 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                    : c('bg-white text-indigo-700 border border-indigo-100 hover:border-indigo-200', 'bg-slate-800/80 text-indigo-200 border border-slate-700 hover:border-indigo-700')
                }`}
              >
                {copiedSummary ? 'Resumo copiado' : 'Exportar resumo'}
              </button>
            </div>
            <p className="text-sm leading-relaxed">{personalizedInsight}</p>
          </div>

          <div className={`rounded-[2rem] p-5 border mb-4 shadow-[0_18px_40px_-30px_rgba(14,165,233,0.25)] ${c('bg-gradient-to-br from-sky-50 via-cyan-50 to-white border-sky-100', 'bg-gradient-to-br from-sky-900/25 to-slate-900/80 border-sky-800')}`}>
            <h3 className="font-black mb-2">📊 7 dias x 30 dias</h3>
            {comparisonStats && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`rounded-2xl p-3 border ${c('bg-white/90 border-sky-100', 'bg-slate-900/55 border-slate-700')}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-sky-700', 'text-sky-300')}`}>7 dias</p>
                  <p className="text-2xl font-black mt-2">{comparisonStats.avg7.toFixed(1)}</p>
                  <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>
                    {comparisonStats.top7 ? displayEmotion(comparisonStats.top7) : 'sem padrão'}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 border ${c('bg-white/90 border-indigo-100', 'bg-slate-900/55 border-slate-700')}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-indigo-700', 'text-indigo-300')}`}>30 dias</p>
                  <p className="text-2xl font-black mt-2">{comparisonStats.avg30.toFixed(1)}</p>
                  <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>
                    {comparisonStats.top30 ? displayEmotion(comparisonStats.top30) : 'sem padrão'}
                  </p>
                </div>
              </div>
            )}
            {comparisonStats && (
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-black mb-3 ${
                comparisonStats.delta > 0.15
                  ? c('bg-amber-100 text-amber-800 border border-amber-200', 'bg-amber-500/15 text-amber-300 border border-amber-500/20')
                  : comparisonStats.delta < -0.15
                    ? c('bg-emerald-100 text-emerald-800 border border-emerald-200', 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20')
                    : c('bg-white/90 text-slate-700 border border-slate-200', 'bg-slate-900/55 text-slate-200 border border-slate-700')
              }`}>
                {comparisonStats.delta > 0.15
                  ? 'Ritmo recente mais intenso'
                  : comparisonStats.delta < -0.15
                    ? 'Ritmo recente mais estável'
                    : 'Ritmo recente parecido'}
              </div>
            )}
            <p className="text-sm leading-relaxed">{comparisonInsight}</p>
          </div>

          <div className={`rounded-[2rem] p-4 border mb-4 ${c('bg-gradient-to-br from-white to-slate-50 border-slate-100 shadow-[0_14px_35px_-30px_rgba(15,23,42,0.25)]', 'bg-gradient-to-br from-slate-800/80 to-slate-900/70 border-slate-700 shadow-[0_14px_35px_-30px_rgba(2,6,23,0.5)]')}`}>
            <p className="font-black text-sm mb-3">Emoções do mapa</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {emotions.map(([emotion]) => (
                <button
                  key={emotion}
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`px-3 py-1.5 rounded-full border font-bold transition-all duration-300 ${selectedEmotion === emotion ? 'ring-2 ring-sky-400 scale-[1.04] shadow-[0_10px_22px_rgba(14,165,233,0.25)]' : 'hover:scale-[1.02]'}`}
                  style={{ backgroundColor: emotionColor[emotion] || '#e2e8f0', borderColor: '#cbd5e1' }}
                >
                  {displayEmotion(emotion)}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={`rounded-[2rem] p-7 text-center border shadow-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
          <div className="text-5xl mb-3">🗺️</div>
          <p className="font-black text-lg">Seu mapa ainda está em branco.</p>
          <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
            Quando você registrar mais emoções no Diário de Humor, este espaço vai começar a mostrar os caminhos emocionais que mais se repetem com você.
          </p>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-[170] flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Fechar opções de exportação"
            onClick={() => setShowExportModal(false)}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          />
          <div className={`relative z-10 w-full max-w-md rounded-[2rem] border p-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.55)] ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <div className="mb-4">
              <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-indigo-700', 'text-indigo-300')}`}>Exportar resumo</p>
              <h3 className="text-xl font-black mt-2">Para onde você quer levar isso?</h3>
              <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
                Você pode copiar o resumo ou continuar a partir dele em outra parte do app.
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'copy',
                  title: 'Copiar resumo',
                  desc: 'Copia o texto para você colar onde quiser.',
                  emoji: '📋',
                  cardClass: c('bg-slate-50 border-slate-200 hover:bg-white', 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'),
                  iconClass: c('bg-white border-slate-200 text-slate-700', 'bg-slate-900 border-slate-700 text-slate-200'),
                },
                {
                  id: 'diary',
                  title: 'Levar para o Diário',
                  desc: 'Abre o Diário com esse resumo já preenchido.',
                  emoji: '📔',
                  cardClass: c('bg-amber-50 border-amber-200 hover:bg-amber-100/80', 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'),
                  iconClass: c('bg-white border-amber-200 text-amber-700', 'bg-slate-900 border-amber-500/20 text-amber-300'),
                },
                {
                  id: 'solta',
                  title: 'Levar para Solta aqui',
                  desc: 'Abre o espaço de desabafo com o texto pronto.',
                  emoji: '💭',
                  cardClass: c('bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100/80', 'bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/15'),
                  iconClass: c('bg-white border-fuchsia-200 text-fuchsia-700', 'bg-slate-900 border-fuchsia-500/20 text-fuchsia-300'),
                },
                {
                  id: 'carta',
                  title: 'Levar para Carta Terapêutica',
                  desc: 'Transforma esse padrão em uma carta para elaborar melhor.',
                  emoji: '✉️',
                  cardClass: c('bg-indigo-50 border-indigo-200 hover:bg-indigo-100/80', 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15'),
                  iconClass: c('bg-white border-indigo-200 text-indigo-700', 'bg-slate-900 border-indigo-500/20 text-indigo-300'),
                },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExportAction(option.id as 'copy' | 'diary' | 'solta' | 'carta')}
                  className={`w-full text-left rounded-[1.4rem] border p-4 transition-all active:scale-[0.99] ${option.cardClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl border ${option.iconClass}`}>
                      {option.emoji}
                    </div>
                    <div>
                      <p className="font-black">{option.title}</p>
                      <p className={`text-sm mt-1 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>{option.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleExportAction('close')}
                className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${c('bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100', 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/15')}`}
              >
                Revisar depois
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${c('bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100', 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/15')}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
