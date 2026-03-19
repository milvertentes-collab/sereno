'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SectionHeroCard from './SectionHeroCard';

export interface ProfileScore { visual: number; auditivo: number; cinestesico: number }
interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: any, params?: Record<string, any>) => void;
  lastScore: ProfileScore;
  setLastScore: (value: ProfileScore | ((prev: ProfileScore) => ProfileScore)) => void;
  onComplete?: (eventId: string) => void;
}

type Axis = keyof ProfileScore;
type Q = { id: string; text: string; axis: Axis; reverse?: boolean };

const questions: Q[] = [
  { id: 'q1', text: 'Ver algo organizado, com lista, mapa ou cor, já costuma me acalmar um pouco.', axis: 'visual' },
  { id: 'q2', text: 'Uma voz calma me ajuda mais do que quase qualquer outra técnica.', axis: 'auditivo' },
  { id: 'q3', text: 'Mover o corpo, alongar ou mudar de postura reduz minha tensão rapidamente.', axis: 'cinestesico' },
  { id: 'q4', text: 'Quando fecho os olhos e imagino uma cena segura, costumo melhorar.', axis: 'visual' },
  { id: 'q5', text: 'Sons ambientes, chuva, mar ou ruído branco regulam meu estado interno.', axis: 'auditivo' },
  { id: 'q6', text: 'Perceber respiração, postura e músculos me ajuda a sair da crise.', axis: 'cinestesico' },
  { id: 'q7', text: 'Imagens mentais quase nunca ajudam em mim.', axis: 'visual', reverse: true },
  { id: 'q8', text: 'Áudios guiados geralmente não mudam meu estado.', axis: 'auditivo', reverse: true },
  { id: 'q9', text: 'Técnicas corporais costumam fazer pouca diferença para mim.', axis: 'cinestesico', reverse: true },
  { id: 'q10', text: 'Aprendo melhor quando vejo esquemas, exemplos visuais e organização.', axis: 'visual' },
  { id: 'q11', text: 'Aprendo melhor quando escuto explicações e acompanho pela audição.', axis: 'auditivo' },
  { id: 'q12', text: 'Aprendo melhor quando pratico com o corpo, a experiência e a ação.', axis: 'cinestesico' },
];

const scale = [
  { v: 1, l: 'Nada a ver comigo', emoji: '🙅' },
  { v: 2, l: 'Um pouco', emoji: '🤏' },
  { v: 3, l: 'Mais ou menos', emoji: '😐' },
  { v: 4, l: 'Combina comigo', emoji: '🙂' },
  { v: 5, l: 'Combina muito comigo', emoji: '✨' },
];

const axisMeta: Record<Axis, { label: string; emoji: string; badge: string; light: string; dark: string }> = {
  visual: { label: 'Visual', emoji: '👁️', badge: '👁️ Visual', light: 'bg-indigo-100 text-indigo-700', dark: 'bg-indigo-900/30 text-indigo-300' },
  auditivo: { label: 'Auditivo', emoji: '🎧', badge: '🎧 Auditivo', light: 'bg-emerald-100 text-emerald-700', dark: 'bg-emerald-900/30 text-emerald-300' },
  cinestesico: { label: 'Cinestésico', emoji: '🧘', badge: '🧘 Cinestésico', light: 'bg-amber-100 text-amber-700', dark: 'bg-amber-900/30 text-amber-300' },
};

export default function RegulationProfileSection({ darkMode: dm, onNavigate, lastScore, setLastScore, onComplete }: Props) {
  const [history, setHistory] = useLocalStorage<Array<{ date: string; score: ProfileScore; winner: Axis; confidence: string }>>('psico_regulation_history', []);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const c = (l: string, d: string) => (dm ? d : l);
  const progress = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];

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
    return (arr[0]?.[0] || 'visual') as Axis;
  }, [computed]);

  const secondAxis = useMemo(() => {
    const arr = Object.entries(computed).sort((a, b) => b[1] - a[1]);
    return (arr[1]?.[0] || winner) as Axis;
  }, [computed, winner]);

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

  const answer = (qid: string, val: number) => {
    setAnswers((p) => ({ ...p, [qid]: val }));
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1)), 120);
    }
  };

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
    onComplete?.(`regulation:${item.date}`);
  };

  const reset = () => {
    setAnswers({});
    setDone(false);
    setCurrentIndex(0);
    setLastScore({ visual: 0, auditivo: 0, cinestesico: 0 });
  };

  const removeHistoryItem = (date: string) => {
    setHistory((prev) => prev.filter((item) => item.date !== date));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const humanSummary =
    confidence === 'Mista'
      ? 'Seu perfil ficou misto. Isso costuma indicar uma boa flexibilidade: em alguns momentos, você se regula melhor vendo; em outros, ouvindo ou usando o corpo.'
      : winner === 'visual'
        ? 'Seu sistema tende a responder melhor a recursos visuais. Ver organização, imagens e guias claras costuma te regular com mais rapidez.'
        : winner === 'auditivo'
          ? 'Seu sistema tende a responder melhor ao canal auditivo. Voz guiada, sons e música parecem ter mais acesso ao seu estado interno.'
          : 'Seu sistema tende a responder melhor ao corpo. Respiração, grounding, movimento e percepção física costumam te estabilizar com mais rapidez.';

  const secondarySummary =
    confidence === 'Mista'
      ? `Seu perfil não está preso a um único canal. Você também pode combinar ${axisMeta.visual.label.toLowerCase()}, ${axisMeta.auditivo.label.toLowerCase()} e ${axisMeta.cinestesico.label.toLowerCase()} conforme o momento.`
      : `Você também mostra boa flexibilidade no canal ${axisMeta[secondAxis].label.toLowerCase()}, então vale combinar esses recursos quando precisar.`;

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

  const previous = history[1];
  const previousText = previous
    ? previous.winner === winner
      ? `Em relação ao último teste, seu canal predominante se manteve em ${axisMeta[winner].label.toLowerCase()}.`
      : `No último teste, o predominante foi ${axisMeta[previous.winner].label.toLowerCase()}. Agora, aparece mais ${axisMeta[winner].label.toLowerCase()}.`
    : 'Este é um bom retrato do seu momento atual e pode mudar com o tempo.';

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-5">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Descoberta guiada"
          title="Perfil de Regulação"
          description="Descubra por qual canal você costuma se regular melhor e por onde vale começar quando o corpo e a mente saem do eixo."
          icon="🧭"
        />
        <div className="flex justify-center gap-2 mt-4 text-xs font-bold flex-wrap">
          {(Object.keys(axisMeta) as Axis[]).map((axis) => (
            <span key={axis} className={`px-2.5 py-1 rounded-full ${dm ? axisMeta[axis].dark : axisMeta[axis].light}`}>
              {axisMeta[axis].badge}
            </span>
          ))}
        </div>
      </div>

      <div className={`rounded-[2rem] p-4 mb-4 border shadow-sm ${c('bg-white border-slate-100', 'bg-slate-800/85 border-slate-700')}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black">Pergunta {Math.min(currentIndex + 1, questions.length)} de {questions.length}</p>
            <p className={`text-xs mt-1 font-medium ${c('text-slate-500', 'text-slate-400')}`}>
              Um passo por vez. Você não precisa responder tudo de uma vez na cabeça.
            </p>
          </div>
          <div className={`px-3 py-2 rounded-2xl text-xs font-black ${c('bg-sky-50 text-sky-700 border border-sky-100', 'bg-slate-900 text-sky-300 border border-slate-700')}`}>
            {progress}/{questions.length}
          </div>
        </div>
        <div className={`h-2 rounded-full mt-3 ${c('bg-slate-100', 'bg-slate-700')}`}>
          <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300" style={{ width: `${Math.round((progress / questions.length) * 100)}%` }} />
        </div>
      </div>

      {!done && (
        <div className={`rounded-[2rem] p-5 border shadow-sm animate-fade-in ${c('bg-gradient-to-br from-white to-sky-50/40 border-slate-100', 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700')}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-base font-bold leading-relaxed">{currentQuestion.text}</p>
            <span className={`text-[10px] px-2 py-1 rounded-full font-black whitespace-nowrap shadow-sm ${dm ? axisMeta[currentQuestion.axis].dark : axisMeta[currentQuestion.axis].light}`}>
              {axisMeta[currentQuestion.axis].emoji}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {scale.map((item) => (
              <button
                key={item.v}
                onClick={() => answer(currentQuestion.id, item.v)}
                className={`w-full p-3 rounded-2xl border text-left transition-all active:scale-[0.99] ${answers[currentQuestion.id] === item.v
                  ? 'bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-500/20'
                  : c('bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300', 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-600')}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl transition-transform ${answers[currentQuestion.id] === item.v ? 'scale-110' : ''}`}>{item.emoji}</span>
                  <div>
                    <p className="text-sm font-black">{item.l}</p>
                    <p className={`text-[11px] mt-1 ${answers[currentQuestion.id] === item.v ? 'text-white/80' : c('text-slate-500', 'text-slate-400')}`}>Nível {item.v}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all ${currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''} ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
            >
              Voltar
            </button>
            <button
              onClick={finalize}
              className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all ${progress < questions.length ? 'opacity-40 cursor-not-allowed' : 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'}`}
              disabled={progress < questions.length}
            >
              Finalizar leitura
            </button>
          </div>
        </div>
      )}

      {(done || (lastScore.visual + lastScore.auditivo + lastScore.cinestesico > 0)) && (
        <div className={`rounded-[2rem] p-5 border mt-4 shadow-sm animate-fade-in ${c('bg-gradient-to-br from-white to-sky-50/30 border-slate-100', 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700')}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-500')}`}>Resultado</p>
              <h3 className="font-black text-xl mt-2">
                {confidence === 'Mista'
                  ? 'Seu perfil ficou misto'
                  : `Seu sistema responde melhor ao ${axisMeta[winner].label.toLowerCase()}`}
              </h3>
            </div>
            <span className={`px-3 py-2 rounded-2xl text-xs font-black ${dm ? axisMeta[winner].dark : axisMeta[winner].light}`}>
              {axisMeta[winner].badge}
            </span>
          </div>

          <p className={`text-sm mt-3 leading-relaxed ${c('text-slate-700', 'text-slate-200')}`}>{humanSummary}</p>
          <div className={`rounded-2xl p-4 mt-3 ${c('bg-slate-50 border border-slate-100', 'bg-slate-900/60 border border-slate-700')}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Canal complementar</p>
            <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>{secondarySummary}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {(Object.keys(axisMeta) as Axis[]).map((axis) => (
              <div key={axis} className={`rounded-2xl p-3 text-center transition-all hover:-translate-y-0.5 ${c('bg-slate-50', 'bg-slate-900/70 border border-slate-700')}`}>
                <p className={`text-lg ${winner === axis ? 'animate-pulse' : ''}`}>{axisMeta[axis].emoji}</p>
                <p className="text-xs font-black mt-1">{axisMeta[axis].label}</p>
                <p className="text-sm font-black mt-2">{pct(axis)}%</p>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl p-4 mt-4 ${c('bg-sky-50 border border-sky-100', 'bg-slate-900/70 border border-slate-700')}`}>
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-sky-700', 'text-sky-300')}`}>Em crise, comece por aqui</p>
            <div className="grid grid-cols-1 gap-2 mt-3">
              {(quickActions[winner] || []).map((action) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate?.(action.tab as any, action.params || {})}
                  className={`py-3 rounded-2xl text-sm font-bold ${c('bg-white text-sky-800 border border-sky-100', 'bg-slate-800 text-sky-300 border border-slate-700')}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {secondAxis !== winner && (
            <div className={`rounded-2xl p-4 mt-4 ${c('bg-violet-50 border border-violet-100', 'bg-slate-900/70 border border-slate-700')}`}>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-violet-700', 'text-violet-300')}`}>Se o primeiro não funcionar</p>
              <div className="grid grid-cols-1 gap-2 mt-3">
                {(quickActions[secondAxis] || []).slice(0, 2).map((action) => (
                  <button
                    key={`${secondAxis}-${action.label}`}
                    onClick={() => onNavigate?.(action.tab as any, action.params || {})}
                    className={`py-3 rounded-2xl text-sm font-bold ${c('bg-white text-violet-800 border border-violet-100', 'bg-slate-800 text-violet-300 border border-slate-700')}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`rounded-2xl p-4 mt-4 ${c('bg-slate-50', 'bg-slate-900/60')}`}>
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-500')}`}>Comparação</p>
            <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>{previousText}</p>
          </div>

          <button onClick={reset} className="w-full mt-4 py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20">
            Refazer leitura
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className={`rounded-[2rem] p-5 border mt-4 shadow-sm ${c('bg-gradient-to-br from-white to-slate-50 border-slate-100', 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700')}`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-black">Histórico de leituras</h3>
            <button
              onClick={clearHistory}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${c('bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100', 'bg-rose-900/20 text-rose-300 border border-rose-900/30 hover:bg-rose-900/30')}`}
            >
              Limpar histórico
            </button>
          </div>
          <div className="space-y-3 max-h-72 overflow-auto">
            {history.map((item, i) => (
              <div key={item.date + i} className={`rounded-2xl p-4 border transition-all hover:-translate-y-0.5 ${c('bg-slate-50 border-slate-100', 'bg-slate-900/60 border-slate-700')}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black">{new Date(item.date).toLocaleDateString('pt-BR')} • {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Confiabilidade {item.confidence}</p>
                  </div>
                  <span className={`px-3 py-2 rounded-2xl text-[11px] font-black ${dm ? axisMeta[item.winner].dark : axisMeta[item.winner].light}`}>
                    {axisMeta[item.winner].badge}
                  </span>
                </div>
                <p className={`text-sm mt-3 ${c('text-slate-700', 'text-slate-300')}`}>
                  V {item.score.visual} • A {item.score.auditivo} • C {item.score.cinestesico}
                </p>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => removeHistoryItem(item.date)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${c('bg-white text-rose-700 border border-rose-100 hover:bg-rose-50', 'bg-slate-800 text-rose-300 border border-slate-700 hover:bg-slate-700')}`}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
