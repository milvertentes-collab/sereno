'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ProfileScore { visual: number; auditivo: number; cinestesico: number }
interface Props { darkMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void }

type Axis = keyof ProfileScore;
type Q = { id: string; text: string; axis: Axis; reverse?: boolean };

const questions: Q[] = [
  { id: 'q1', text: 'Ver algo organizado (lista, mapa, cores) já me acalma um pouco.', axis: 'visual' },
  { id: 'q2', text: 'Uma voz calma me ajuda mais do que qualquer outra técnica.', axis: 'auditivo' },
  { id: 'q3', text: 'Mover o corpo ou alongar reduz minha tensão rapidamente.', axis: 'cinestesico' },
  { id: 'q4', text: 'Quando fecho os olhos e visualizo uma cena segura, eu melhoro.', axis: 'visual' },
  { id: 'q5', text: 'Sons ambientes (chuva, mar, ruído branco) regulam meu estado interno.', axis: 'auditivo' },
  { id: 'q6', text: 'Perceber respiração, postura e músculos me ajuda a sair da crise.', axis: 'cinestesico' },
  { id: 'q7', text: 'Imagens mentais são pouco úteis para mim.', axis: 'visual', reverse: true },
  { id: 'q8', text: 'Áudios guiados geralmente não mudam meu estado.', axis: 'auditivo', reverse: true },
  { id: 'q9', text: 'Técnicas corporais não fazem diferença em mim.', axis: 'cinestesico', reverse: true },
  { id: 'q10', text: 'Aprendo melhor quando vejo esquemas e exemplos visuais.', axis: 'visual' },
  { id: 'q11', text: 'Aprendo melhor quando escuto explicações.', axis: 'auditivo' },
  { id: 'q12', text: 'Aprendo melhor quando pratico com o corpo e ação.', axis: 'cinestesico' },
];

const scale = [
  { v: 1, l: 'Discordo totalmente', emoji: '😣' },
  { v: 2, l: 'Discordo', emoji: '😕' },
  { v: 3, l: 'Neutro', emoji: '😐' },
  { v: 4, l: 'Concordo', emoji: '🙂' },
  { v: 5, l: 'Concordo totalmente', emoji: '🤩' },
];

export default function RegulationProfileSection({ darkMode: dm, onNavigate }: Props) {
  const [lastScore, setLastScore] = useLocalStorage<ProfileScore>('psico_regulation_profile', { visual: 0, auditivo: 0, cinestesico: 0 });
  const [history, setHistory] = useLocalStorage<Array<{ date: string; score: ProfileScore; winner: Axis; confidence: string }>>('psico_regulation_history', []);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const c = (l: string, d: string) => (dm ? d : l);

  const progress = Object.keys(answers).length;

  const computed = useMemo(() => {
    const s: ProfileScore = { visual: 0, auditivo: 0, cinestesico: 0 };
    questions.forEach((q) => {
      const raw = answers[q.id];
      if (!raw) return;
      const val = q.reverse ? 6 - raw : raw;
      s[q.axis] += val;
    });
    return s;
  }, [answers]);

  const winner = useMemo(() => {
    const arr = Object.entries(computed).sort((a, b) => b[1] - a[1]);
    return arr[0]?.[0] as Axis;
  }, [computed]);

  const confidence = useMemo(() => {
    const arr = Object.values(computed).sort((a, b) => b - a);
    const top = arr[0] || 0;
    const second = arr[1] || 0;
    const diff = top - second;
    if (diff >= 8) return 'Alta';
    if (diff >= 4) return 'Média';
    return 'Mista';
  }, [computed]);

  const pct = (axis: Axis) => {
    const total = computed.visual + computed.auditivo + computed.cinestesico;
    if (!total) return 0;
    return Math.round((computed[axis] / total) * 100);
  };

  const answer = (qid: string, val: number) => setAnswers((p) => ({ ...p, [qid]: val }));

  const finalize = () => {
    if (progress < questions.length) return;
    setLastScore(computed);
    setDone(true);

    const item = {
      date: new Date().toISOString(),
      score: computed,
      winner,
      confidence,
    };
    setHistory([item, ...history].slice(0, 20));
  };

  const reset = () => {
    setAnswers({});
    setDone(false);
    setLastScore({ visual: 0, auditivo: 0, cinestesico: 0 });
  };

  const humanSummary =
    confidence === 'Mista'
      ? 'Seu perfil ficou misto — isso é ótimo. Você é flexível e pode combinar recursos visuais, sonoros e corporais conforme o momento.'
      : winner === 'visual'
        ? 'Seu sistema responde melhor a estímulos visuais. Ver organização, imagens e guias visuais tende a te regular mais rápido.'
        : winner === 'auditivo'
          ? 'Seu sistema responde melhor ao canal auditivo. Voz guiada, sons e música tendem a te trazer regulação com mais facilidade.'
          : 'Seu sistema responde melhor ao corpo (cinestésico). Respiração, grounding e movimento costumam te estabilizar mais rápido.';

  const quickActions: Record<Axis, Array<{ label: string; tab: string; params?: Record<string, any> }>> = {
    visual: [
      { label: 'Abrir Mapa Mental', tab: 'mindmap' },
      { label: 'Abrir Modo Arte', tab: 'artemotion' },
      { label: 'Psicoeducação', tab: 'psychoedu' },
    ],
    auditivo: [
      { label: 'Respiração Guiada', tab: 'breathing' },
      { label: 'Meditação', tab: 'meditation' },
      { label: 'Mixer Sonoro', tab: 'mixer' },
    ],
    cinestesico: [
      { label: 'SOS Grounding', tab: 'sos' },
      { label: 'Respiração Prática', tab: 'breathing' },
      { label: 'Microtarefas', tab: 'microtasks' },
    ],
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-4">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🧑‍⚕️ Perfil de Regulação</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Teste 2.0 (12 itens) para identificar seu canal dominante de autorregulação.</p>
        <div className="flex justify-center gap-2 mt-3 text-xs font-bold">
          <span className={`px-2 py-1 rounded-full ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-900/30 text-indigo-300')}`}>👁️ Visual</span>
          <span className={`px-2 py-1 rounded-full ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>🎧 Auditivo</span>
          <span className={`px-2 py-1 rounded-full ${c('bg-amber-100 text-amber-700', 'bg-amber-900/30 text-amber-300')}`}>🧘 Cinestésico</span>
        </div>
      </div>

      <div className={`rounded-2xl p-3 mb-4 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <p className="text-sm font-bold">Progresso: {progress}/{questions.length}</p>
        <div className={`h-2 rounded-full mt-2 ${c('bg-slate-100', 'bg-slate-700')}`}>
          <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.round((progress / questions.length) * 100)}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={q.id} className={`rounded-2xl p-3 border shadow-sm ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold">{idx + 1}. {q.text}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${q.axis === 'visual' ? c('bg-indigo-100 text-indigo-700','bg-indigo-900/30 text-indigo-300') : q.axis === 'auditivo' ? c('bg-emerald-100 text-emerald-700','bg-emerald-900/30 text-emerald-300') : c('bg-amber-100 text-amber-700','bg-amber-900/30 text-amber-300')}`}>
                {q.axis === 'visual' ? '👁️' : q.axis === 'auditivo' ? '🎧' : '🧘'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {scale.map((s) => (
                <button
                  key={s.v}
                  onClick={() => answer(q.id, s.v)}
                  className={`py-2 rounded-lg text-[10px] font-bold border ${answers[q.id] === s.v ? 'bg-sky-600 text-white border-sky-500 scale-[1.02]' : c('bg-slate-50 text-slate-700 border-slate-200', 'bg-slate-700 text-slate-200 border-slate-600')}`}
                  title={s.l}
                >
                  <span className="block text-sm">{s.emoji}</span>
                  {s.v}
                </button>
              ))}
            </div>
            <p className={`text-[10px] mt-1 ${c('text-slate-500', 'text-slate-400')}`}>😣 1 discordo total • 🤩 5 concordo total</p>
          </div>
        ))}
      </div>

      <button onClick={finalize} className="w-full mt-4 py-3 rounded-xl bg-sky-600 text-white font-bold" disabled={progress < questions.length}>
        Finalizar teste
      </button>

      {(done || (lastScore.visual + lastScore.auditivo + lastScore.cinestesico > 0)) && (
        <div className={`rounded-3xl p-5 border mt-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <h3 className="font-bold mb-2">Resultado</h3>
          <p className="text-sm">Visual: <strong>{pct('visual')}%</strong> • Auditivo: <strong>{pct('auditivo')}%</strong> • Cinestésico: <strong>{pct('cinestesico')}%</strong></p>
          <p className="text-sm mt-2">Predominante: <strong>{winner}</strong> • Confiabilidade: <strong>{confidence}</strong></p>
          <p className={`text-sm mt-2 ${c('text-slate-700','text-slate-200')}`}>{humanSummary}</p>

          <div className="mt-3">
            <p className="text-xs font-bold mb-2">Recomendação automática (abra agora):</p>
            <div className="grid grid-cols-1 gap-2">
              {(quickActions[winner] || []).map((a) => (
                <button
                  key={a.label}
                  onClick={() => onNavigate?.(a.tab as any, a.params || {})}
                  className={`py-2 rounded-xl text-sm font-bold ${c('bg-indigo-50 text-indigo-700','bg-indigo-900/30 text-indigo-300')}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={reset} className="w-full mt-3 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold">Refazer teste</button>
        </div>
      )}

      {history.length > 0 && (
        <div className={`rounded-3xl p-5 border mt-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <h3 className="font-bold mb-2">Histórico de resultados</h3>
          <div className="space-y-2 max-h-56 overflow-auto">
            {history.map((h, i) => (
              <div key={h.date + i} className={`p-2 rounded-xl text-xs ${c('bg-slate-50','bg-slate-700/60')}`}>
                <p><strong>{new Date(h.date).toLocaleDateString('pt-BR')}</strong> • {new Date(h.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p>Perfil: <strong>{h.winner}</strong> • Confiabilidade: <strong>{h.confidence}</strong></p>
                <p>V {h.score.visual} | A {h.score.auditivo} | C {h.score.cinestesico}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
