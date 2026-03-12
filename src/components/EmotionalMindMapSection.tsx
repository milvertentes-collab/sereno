'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MoodEntry } from '@/components/MoodSection';

interface Props { darkMode?: boolean }

export default function EmotionalMindMapSection({ darkMode: dm }: Props) {
  const [moodHistory] = useLocalStorage<MoodEntry[]>('moodHistory', []);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const c = (l: string, d: string) => (dm ? d : l);

  const connections = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const sorted = [...moodHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let prev: string | null = null;
    sorted.forEach((m) => {
      const cur = m.primaryEmotion;
      if (prev && cur) {
        if (!map[prev]) map[prev] = {};
        map[prev][cur] = (map[prev][cur] || 0) + 1;
      }
      prev = cur;
    });
    return map;
  }, [moodHistory]);

  const emotions = useMemo(() => {
    const counts: Record<string, number> = {};
    moodHistory.forEach((m) => {
      if (m.primaryEmotion) counts[m.primaryEmotion] = (counts[m.primaryEmotion] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [moodHistory]);

  const emotionColor: Record<string, string> = {
    feliz: '#FFF176', calmo: '#81D4FA', animado: '#FFB74D', grato: '#AED581',
    esperancoso: '#80CBC4', motivado: '#FF8A65', cansado: '#B0BEC5', pensativo: '#CE93D8',
    sensivel: '#F48FB1', confuso: '#B39DDB', ansioso: '#FFE082', triste: '#90CAF9',
    irritado: '#FFAB91', estressado: '#EF9A9A', sobrecarregado: '#B39DDB', desmotivado: '#E0E0E0'
  };

  const positions = emotions.map((_, i) => {
    const angle = (i / emotions.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 100;
    return { x: 140 + radius * Math.cos(angle), y: 140 + radius * Math.sin(angle) };
  });

  const svgLines = useMemo(() => {
    const lines: { from: string; to: string; x1: number; y1: number; x2: number; y2: number; w: number; count: number }[] = [];
    emotions.forEach(([e1], i) => {
      const conns = connections[e1] || {};
      Object.entries(conns).forEach(([e2, count]) => {
        const j = emotions.findIndex(([e]) => e === e2);
        if (j >= 0 && i !== j) {
          lines.push({ from: e1, to: e2, x1: positions[i].x, y1: positions[i].y, x2: positions[j].x, y2: positions[j].y, w: Math.min(4 + count, 10), count });
        }
      });
    });
    return lines;
  }, [emotions, connections, positions]);

  const topTransitions = useMemo(() => {
    return [...svgLines].sort((a, b) => b.count - a.count).slice(0, 3);
  }, [svgLines]);

  const selectedDetails = useMemo(() => {
    if (!selectedEmotion) return null;
    const outgoing = Object.entries(connections[selectedEmotion] || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const incoming = Object.entries(connections)
      .filter(([from]) => from !== selectedEmotion)
      .map(([from, map]) => ({ from, count: map[selectedEmotion] || 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
    const count = moodHistory.filter((m) => m.primaryEmotion === selectedEmotion).length;
    return { outgoing, incoming, count };
  }, [selectedEmotion, connections, moodHistory]);

  const comparisonInsight = useMemo(() => {
    if (!moodHistory.length) return 'Sem dados suficientes para comparar 7 dias x 30 dias.';

    const now = Date.now();
    const d7 = moodHistory.filter((m) => new Date(m.date).getTime() >= now - 7 * 24 * 60 * 60 * 1000);
    const d30 = moodHistory.filter((m) => new Date(m.date).getTime() >= now - 30 * 24 * 60 * 60 * 1000);

    const avg = (arr: MoodEntry[]) => arr.length ? arr.reduce((s, m) => s + (m.intensity || 3), 0) / arr.length : 0;
    const avg7 = avg(d7);
    const avg30 = avg(d30);

    const negSet = new Set(['ansioso', 'triste', 'irritado', 'estressado', 'sobrecarregado', 'desmotivado', 'solitario', 'envergonhado']);
    const negRatio = (arr: MoodEntry[]) => arr.length ? arr.filter((m) => negSet.has((m.primaryEmotion || '').toLowerCase())).length / arr.length : 0;
    const n7 = negRatio(d7);
    const n30 = negRatio(d30);

    const topEmotion = (arr: MoodEntry[]) => {
      const c: Record<string, number> = {};
      arr.forEach((m) => { if (m.primaryEmotion) c[m.primaryEmotion] = (c[m.primaryEmotion] || 0) + 1; });
      return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0];
    };

    const e7 = topEmotion(d7);
    const e30 = topEmotion(d30);

    if (!d7.length || !d30.length) return 'Continue registrando: em breve teremos comparação completa entre últimos 7 e 30 dias.';

    const intensityDiff = (avg7 - avg30);
    const negDiff = (n7 - n30) * 100;

    return `Nos últimos 7 dias, sua intensidade média foi ${avg7.toFixed(1)} (30 dias: ${avg30.toFixed(1)}). Emoção dominante recente: ${e7 || '—'} (30 dias: ${e30 || '—'}). Emoções difíceis: ${Math.round(n7 * 100)}% nos 7 dias vs ${Math.round(n30 * 100)}% nos 30 dias (${negDiff >= 0 ? '+' : ''}${negDiff.toFixed(0)} p.p.). ${intensityDiff <= -0.2 ? 'Sinal de melhora recente 🌱' : intensityDiff >= 0.2 ? 'Sinal de maior carga emocional recente ⚠️' : 'Ritmo emocional estável recentemente ⚖️'}`;
  }, [moodHistory]);

  const personalizedInsight = useMemo(() => {
    if (!moodHistory.length) return 'Ainda não há dados suficientes para uma leitura personalizada.';

    const latest = moodHistory[moodHistory.length - 1]?.primaryEmotion;
    const top = topTransitions[0];

    const actionMap: Record<string, string> = {
      ansioso: 'tente 2 minutos de respiração 4-4-6 e reduza estímulos por 10 minutos.',
      estressado: 'faça uma pausa corporal curta (ombros/pescoço) e beba água.',
      triste: 'escreva 3 frases de acolhimento e fale com alguém de confiança.',
      irritado: 'faça 1 minuto de silêncio antes de responder qualquer mensagem.',
      sobrecarregado: 'quebre sua próxima tarefa em uma micro-etapa de até 5 minutos.',
      cansado: 'priorize descanso breve + hidratação e evite autocobrança agora.',
      confuso: 'nomeie a emoção em 1 frase simples antes de decidir o próximo passo.',
      solitario: 'envie uma mensagem curta para alguém seguro hoje.',
      envergonhado: 'substitua autocrítica por uma frase de autocompaixão objetiva.',
      feliz: 'registre o que ajudou você a chegar aqui para repetir depois.',
      calmo: 'mantenha esse ritmo com uma pausa consciente nas próximas horas.',
      motivado: 'aproveite a energia para avançar 1 tarefa importante agora.'
    };

    if (top) {
      const action = actionMap[top.from] || 'faça um check-in rápido e escolha uma ação pequena de autocuidado.';
      const latestTxt = latest ? `Seu estado mais recente foi "${latest}".` : 'Nos registros recentes,';
      return `${latestTxt} O padrão mais forte tem sido "${top.from} → ${top.to}" (${top.count}x). Quando "${top.from}" aparecer, ${action}`;
    }

    if (latest) {
      const action = actionMap[latest] || 'faça um check-in rápido e escolha uma ação pequena de autocuidado.';
      return `Seu estado mais recente foi "${latest}". Sugestão personalizada: ${action}`;
    }

    return 'Continue registrando seu humor para liberar insights cada vez mais personalizados.';
  }, [moodHistory, topTransitions]);

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🗺️ Mapa Mental Emocional</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Visualize como suas emoções se conectam ao longo do tempo.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <svg viewBox="0 0 280 280" className="w-full max-w-xs mx-auto">
          <rect width="280" height="280" fill="transparent" />
          {svgLines.map((l, idx) => (
            <line
              key={idx}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={dm ? '#475569' : '#cbd5e1'}
              strokeWidth={l.w}
              opacity={!selectedEmotion || selectedEmotion === l.from || selectedEmotion === l.to ? '0.5' : '0.15'}
            />
          ))}
          {emotions.map(([emotion, count], i) => {
            const size = 28 + count * 3;
            return (
              <g key={emotion} transform={`translate(${positions[i].x}, ${positions[i].y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedEmotion(emotion)}>
                <circle r={size / 2} fill={emotionColor[emotion] || '#e2e8f0'} stroke={selectedEmotion === emotion ? '#0ea5e9' : (dm ? '#334155' : '#94a3b8')} strokeWidth={selectedEmotion === emotion ? '4' : '2'} opacity={!selectedEmotion || selectedEmotion === emotion ? '1' : '0.65'} />
                <text textAnchor="middle" dy="4" fontSize="10" fontWeight="bold" fill={dm ? '#f1f5f9' : '#1e293b'}>{emotion}</text>
                <text textAnchor="middle" dy="16" fontSize="8" fill={dm ? '#94a3b8' : '#64748b'}>{count}x</text>
              </g>
            );
          })}
          <circle cx="140" cy="140" r="18" fill={dm ? '#3b82f6' : '#3b82f6'} />
          <text textAnchor="middle" x="140" y="144" fontSize="10" fontWeight="bold" fill="white">VOCÊ</text>
        </svg>
      </div>

      <div className={`rounded-3xl p-5 border mb-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Como ler o mapa</h3>
        <ul className="text-sm space-y-2">
          <li>• <strong>Tamanho do círculo</strong>: frequência da emoção</li>
          <li>• <strong>Linhas</strong>: transições entre emoções (grossura = frequência)</li>
          <li>• <strong>Toque em uma emoção</strong>: ver para onde ela costuma evoluir</li>
          <li>• <strong>Centro</strong>: você, conectando todas as emoções</li>
        </ul>
      </div>

      <div className={`rounded-3xl p-5 border mb-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Insights automáticos</h3>
        {topTransitions.length > 0 ? (
          <div className="space-y-2 text-sm">
            {topTransitions.map((t, idx) => (
              <p key={idx}>• <strong>{t.from}</strong> → <strong>{t.to}</strong> ({t.count}x)</p>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-70">Registre mais emoções para gerar insights.</p>
        )}
      </div>

      <div className={`rounded-3xl p-5 border mb-4 ${c('bg-indigo-50 border-indigo-100', 'bg-indigo-900/20 border-indigo-800')}`}>
        <h3 className="font-bold mb-2">🪄 Leitura personalizada para você</h3>
        <p className="text-sm leading-relaxed">{personalizedInsight}</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-4 ${c('bg-sky-50 border-sky-100', 'bg-sky-900/20 border-sky-800')}`}>
        <h3 className="font-bold mb-2">📊 Comparativo: 7 dias vs 30 dias</h3>
        <p className="text-sm leading-relaxed">{comparisonInsight}</p>
      </div>

      {selectedEmotion && selectedDetails && (
        <div className={`rounded-3xl p-5 border mb-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Foco: {selectedEmotion} ({selectedDetails.count}x)</h3>
            <button onClick={() => setSelectedEmotion(null)} className="text-xs text-sky-500">Limpar foco</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-bold mb-1">Costuma ir para:</p>
              {selectedDetails.outgoing.length ? selectedDetails.outgoing.map(([to, n]) => <p key={to}>• {to} ({n}x)</p>) : <p className="opacity-70">Sem padrão ainda.</p>}
            </div>
            <div>
              <p className="font-bold mb-1">Costuma vir de:</p>
              {selectedDetails.incoming.length ? selectedDetails.incoming.map((i) => <p key={i.from}>• {i.from} ({i.count}x)</p>) : <p className="opacity-70">Sem padrão ainda.</p>}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-3xl p-4 border mb-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <p className="font-bold text-sm mb-2">Legenda rápida</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {emotions.slice(0, 8).map(([emotion]) => (
            <span key={emotion} className="px-2 py-1 rounded-full border" style={{ backgroundColor: emotionColor[emotion] || '#e2e8f0', borderColor: '#cbd5e1' }}>
              {emotion}
            </span>
          ))}
        </div>
      </div>

      {emotions.length === 0 && (
        <div className={`rounded-3xl p-6 text-center border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
          <p className={`text-sm ${c('text-slate-600', 'text-slate-400')}`}>Registre mais emoções no Diário de Humor para visualizar seu mapa mental.</p>
        </div>
      )}
    </div>
  );
}