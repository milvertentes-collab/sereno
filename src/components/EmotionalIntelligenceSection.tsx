'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import { useToast } from "@/hooks/use-toast";
import SectionHeroCard from './SectionHeroCard';

interface Props { darkMode?: boolean; desktopMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void; onComplete?: (eventId: string, minutes?: number) => void; isPro?: boolean; onShowUpgrade?: () => void }

type Pillar = 'autoconhecimento' | 'autocontrole' | 'automotivacao' | 'empatia' | 'habilidades';
type MAxis = 'linguistica' | 'logica' | 'espacial' | 'corporal' | 'musical' | 'interpessoal' | 'intrapessoal' | 'naturalista';
type TestMode = 'goleman' | 'gardner' | 'multiplas';
type Q = { id: string; text: string; pillar: Pillar };
type GQ = { id: string; text: string; axis: 'intra' | 'inter' };
type PlanMood = 'leve' | 'ok' | 'desafiador';
type PlanDay = { day: number; pillar: Pillar; action: string; done: boolean; mood: PlanMood | null; why: string };

const QUESTION_PAGE_SIZE = 5;
const scale = [1, 2, 3, 4, 5];

const pillarLabels: Record<Pillar, string> = {
  autoconhecimento: 'Autoconhecimento',
  autocontrole: 'Autocontrole',
  automotivacao: 'Automotivação',
  empatia: 'Empatia',
  habilidades: 'Habilidades Sociais',
};

const pillarDesc: Record<Pillar, string> = {
  autoconhecimento: 'Reconhecer suas próprias emoções e como elas afetam você.',
  autocontrole: 'Lidar com suas emoções de forma saudável, sem se deixar dominar.',
  automotivacao: 'Usar suas emoções para te mover em direção aos seus objetivos.',
  empatia: 'Perceber e entender as emoções das outras pessoas.',
  habilidades: 'Construir e manter relacionamentos saudáveis.',
};

const planMoodLabels: Record<PlanMood, string> = {
  leve: 'Fluiu bem',
  ok: 'Foi possível',
  desafiador: 'Foi puxado',
};

const planWhyByPillar: Record<Pillar, string> = {
  autoconhecimento: 'Isso ajuda a perceber padrões antes que eles virem reação automática.',
  autocontrole: 'Isso ajuda a criar uma pausa entre sentir e agir.',
  automotivacao: 'Isso ajuda a transformar intenção em movimento concreto.',
  empatia: 'Isso ajuda a sair da leitura apressada e enxergar melhor o outro.',
  habilidades: 'Isso ajuda a levar clareza emocional para relações reais.',
};

const pillarActions: Record<Pillar, string[]> = {
  autoconhecimento: [
    'Escreva 3 emoções que você sentiu hoje e o que as causou.',
    'Observe por 5 minutos como seu corpo reage ao estresse.',
    'Liste 5 gatilhos emocionais seus e onde eles aparecem no corpo.',
    'Descreva em 1 frase como você se sente agora e por quê.',
    'Identifique 1 padrão emocional que se repete na sua semana.',
  ],
  autocontrole: [
    'Quando sentir raiva, conte até 10 antes de responder.',
    'Pratique 3 respirações profundas antes de reagir a algo difícil.',
    'Atrase uma decisão impulsiva por 1 hora e veja como se sente depois.',
    'Observe um gatilho sem reagir, só respire e observe.',
    'Faça uma pausa de 5 minutos consciente quando estiver sob pressão.',
  ],
  automotivacao: [
    'Defina 1 meta pequena para hoje e complete-a.',
    'Escreva 3 razões pelas quais seus objetivos importam para você.',
    'Faça uma tarefa que você está adiando há dias.',
    'Liste 5 pequenas vitórias da semana passada.',
    'Divida uma meta grande em 3 micro-passos e faça o primeiro hoje.',
  ],
  empatia: [
    'Observe alguém ao seu redor e tente adivinhar como essa pessoa se sente.',
    'Pergunte para alguém como foi o dia dela e escute sem interromper.',
    'Pratique validar o sentimento de alguém: "faz sentido você se sentir assim".',
    'Tente ver uma situação difícil da perspectiva de outra pessoa.',
    'Pergunte para alguém: o que você precisa de mim hoje?',
  ],
  habilidades: [
    'Diga "não" para algo que você não quer fazer, sem culpa excessiva.',
    'Inicie uma conversa difícil com respeito e clareza.',
    'Peça ajuda para algo específico hoje.',
    'Identifique 1 limite seu que precisa ser comunicado a alguém.',
    'Pratique escutar alguém por 5 minutos sem dar conselho.',
  ],
};

const axisLabels: Record<MAxis, string> = {
  musical: 'Musical',
  corporal: 'Corporal-cinestésica',
  linguistica: 'Linguística',
  logica: 'Lógico-matemática',
  espacial: 'Espacial',
  interpessoal: 'Interpessoal',
  intrapessoal: 'Intrapessoal',
  naturalista: 'Naturalista',
};

const axisDesc: Record<MAxis, string> = {
  musical: 'Sensibilidade para ritmo, melodia e som.',
  corporal: 'Habilidade com o corpo, movimento e prática.',
  linguistica: 'Facilidade com palavras, leitura e escrita.',
  logica: 'Raciocínio lógico, números e resolução de problemas.',
  espacial: 'Visualização de espaços, formas e caminhos.',
  interpessoal: 'Entender e se relacionar bem com os outros.',
  intrapessoal: 'Conhecer a si mesmo, suas emoções e limites.',
  naturalista: 'Conexão com a natureza e ambientes naturais.',
};

const golemanQuestions: Q[] = [
  { id: 'g1', pillar: 'autoconhecimento', text: 'Consigo identificar no corpo quando estou estressado(a).' },
  { id: 'g2', pillar: 'autoconhecimento', text: 'Percebo com clareza o que estou sentindo no momento.' },
  { id: 'g3', pillar: 'autoconhecimento', text: 'Entendo o que costuma disparar minhas emoções fortes.' },
  { id: 'g4', pillar: 'autoconhecimento', text: 'Consigo diferenciar tristeza, frustração e cansaço.' },
  { id: 'g5', pillar: 'autocontrole', text: 'Quando recebo crítica, ouço antes de me defender.' },
  { id: 'g6', pillar: 'autocontrole', text: 'Consigo pausar antes de reagir no impulso.' },
  { id: 'g7', pillar: 'autocontrole', text: 'Em discussões, mantenho tom respeitoso mesmo sob pressão.' },
  { id: 'g8', pillar: 'autocontrole', text: 'Consigo voltar ao equilíbrio após um gatilho emocional.' },
  { id: 'g9', pillar: 'automotivacao', text: 'Mesmo sem vontade, inicio tarefas importantes.' },
  { id: 'g10', pillar: 'automotivacao', text: 'Mantenho foco em metas mesmo com obstáculos.' },
  { id: 'g11', pillar: 'automotivacao', text: 'Consigo transformar frustração em ação.' },
  { id: 'g12', pillar: 'automotivacao', text: 'Tenho disciplina para manter rotinas de autocuidado.' },
  { id: 'g13', pillar: 'empatia', text: 'Percebo o clima emocional de um ambiente ao entrar.' },
  { id: 'g14', pillar: 'empatia', text: 'Consigo validar o sentimento do outro sem julgar.' },
  { id: 'g15', pillar: 'empatia', text: 'Presto atenção ao que a pessoa sente, além do que ela diz.' },
  { id: 'g16', pillar: 'empatia', text: 'Tenho facilidade de me colocar no lugar do outro.' },
  { id: 'g17', pillar: 'habilidades', text: 'Sinto facilidade para dizer "não" sem culpa excessiva.' },
  { id: 'g18', pillar: 'habilidades', text: 'Consigo resolver conflitos com diálogo.' },
  { id: 'g19', pillar: 'habilidades', text: 'Tenho clareza para pedir ajuda quando preciso.' },
  { id: 'g20', pillar: 'habilidades', text: 'Consigo construir relações estáveis e respeitosas.' },
];

const gardnerQuestions: GQ[] = [
  { id: 'gd1', axis: 'intra', text: 'Tenho clareza sobre meus valores e limites.' },
  { id: 'gd2', axis: 'intra', text: 'Consigo observar meus pensamentos sem me confundir com eles.' },
  { id: 'gd3', axis: 'intra', text: 'Reconheço meus pontos fortes com realismo.' },
  { id: 'gd4', axis: 'intra', text: 'Percebo cedo quando estou me sobrecarregando.' },
  { id: 'gd5', axis: 'intra', text: 'Costumo agir alinhado(a) ao que considero importante.' },
  { id: 'gd6', axis: 'inter', text: 'Leio sinais sociais com facilidade.' },
  { id: 'gd7', axis: 'inter', text: 'Consigo adaptar minha comunicação ao outro sem perder autenticidade.' },
  { id: 'gd8', axis: 'inter', text: 'Facilito conversas difíceis com respeito.' },
  { id: 'gd9', axis: 'inter', text: 'Costumo criar pontes em vez de ampliar conflitos.' },
  { id: 'gd10', axis: 'inter', text: 'As pessoas me veem como alguém acessível para conversar.' },
];

const multipleQuestions: Array<{ id: string; axis: MAxis; text: string }> = [
  { id: 'm1', axis: 'musical', text: 'Percebo padrões de ritmo e melodia com facilidade.' },
  { id: 'm2', axis: 'musical', text: 'Musica influencia fortemente meu foco e humor.' },
  { id: 'm3', axis: 'corporal', text: 'Aprendo melhor quando coloco o corpo em ação.' },
  { id: 'm4', axis: 'corporal', text: 'Tenho boa coordenação em atividades físicas/práticas.' },
  { id: 'm5', axis: 'linguistica', text: 'Tenho facilidade para me expressar por palavras.' },
  { id: 'm6', axis: 'linguistica', text: 'Gosto de ler, escrever e organizar ideias em texto.' },
  { id: 'm7', axis: 'logica', text: 'Gosto de resolver problemas por raciocínio e estratégia.' },
  { id: 'm8', axis: 'logica', text: 'Consigo identificar relações de causa e efeito com clareza.' },
  { id: 'm9', axis: 'espacial', text: 'Tenho facilidade para visualizar mapas, formas e caminhos.' },
  { id: 'm10', axis: 'espacial', text: 'Aprendo bem com imagens, diagramas e layout visual.' },
  { id: 'm11', axis: 'interpessoal', text: 'Entendo bem o que outras pessoas sentem em grupo.' },
  { id: 'm12', axis: 'interpessoal', text: 'Costumo mediar conflitos com boa comunicação.' },
  { id: 'm13', axis: 'intrapessoal', text: 'Tenho consciência dos meus limites e necessidades internas.' },
  { id: 'm14', axis: 'intrapessoal', text: 'Costumo refletir sobre minhas escolhas e emoções.' },
  { id: 'm15', axis: 'naturalista', text: 'Me conecto e me regulo melhor em ambientes naturais.' },
  { id: 'm16', axis: 'naturalista', text: 'Percebo detalhes da natureza com facilidade.' },
];

function RadarChart({ values, labels, size = 200 }: { values: number[]; labels: string[]; size?: number }) {
  const n = values.length;
  const angleStep = (2 * Math.PI) / n;
  const center = size / 2;
  const radius = size / 2 - 30;
  const points = values.map((v, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (v / 100) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');
  const gridRings = [25, 50, 75, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridRings.map((pct) => {
        const r = (pct / 100) * radius;
        const gridPoints = Array.from({ length: n }, (_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={pct} points={gridPoints} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      <polygon points={points} fill="rgba(99, 102, 241, 0.3)" stroke="rgb(99, 102, 241)" strokeWidth="2" />
      {labels.map((label, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + (radius + 18) * Math.cos(angle);
        const y = center + (radius + 18) * Math.sin(angle);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-slate-600 font-medium">{label}</text>;
      })}
    </svg>
  );
}

export default function EmotionalIntelligenceSection({ darkMode: dm, desktopMode = false, onNavigate, onComplete, isPro = false, onShowUpgrade }: Props) {
  const { toast } = useToast();
  const c = (l: string, d: string) => (dm ? d : l);
  const [mode, setMode] = useState<TestMode>('goleman');
  const [answersG, setAnswersG] = useState<Record<string, number>>({});
  const [answersD, setAnswersD] = useState<Record<string, number>>({});
  const [answersM, setAnswersM] = useState<Record<string, number>>({});
  const [history, setHistory] = useAppPersistence<any[]>('psico_ie_history', []);
  const [plan, setPlan] = useAppPersistence<any | null>('psico_ie_plan', null);
  const [showIntro, setShowIntro] = useState(true);
  const [showPlan, setShowPlan] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [pageByMode, setPageByMode] = useState<Record<TestMode, number>>({ goleman: 0, gardner: 0, multiplas: 0 });
  const [lastSavedSignature, setLastSavedSignature] = useState<string | null>(null);

  const testInfo = {
    goleman: { title: 'Goleman', badge: 'Regulação emocional', desc: 'Mostra sua força e vulnerabilidade em 5 pilares da inteligência emocional.', time: '3-5 min', questions: 20 },
    gardner: { title: 'Gardner', badge: 'Intra/interpessoal', desc: 'Separa leitura de si e leitura do outro.', time: '2-3 min', questions: 10 },
    multiplas: { title: 'Múltiplas', badge: 'Estilo de aprender/funcionar', desc: 'Mostra o canal que mais favorece seu funcionamento.', time: '3-5 min', questions: 16 },
  };
  const availableModes = (isPro ? (Object.keys(testInfo) as TestMode[]) : ['goleman']) as TestMode[];

  const gProgress = Object.keys(answersG).length;
  const dProgress = Object.keys(answersD).length;
  const mProgress = Object.keys(answersM).length;

  const gScore = useMemo(() => {
    const out: Record<Pillar, number> = { autoconhecimento: 0, autocontrole: 0, automotivacao: 0, empatia: 0, habilidades: 0 };
    golemanQuestions.forEach((q) => (out[q.pillar] += answersG[q.id] || 0));
    return out;
  }, [answersG]);

  const dScore = useMemo(() => {
    let intra = 0;
    let inter = 0;
    gardnerQuestions.forEach((q) => {
      const v = answersD[q.id] || 0;
      q.axis === 'intra' ? intra += v : inter += v;
    });
    return { intra, inter };
  }, [answersD]);

  const mScore = useMemo(() => {
    const out: Record<MAxis, number> = { linguistica: 0, logica: 0, espacial: 0, corporal: 0, musical: 0, interpessoal: 0, intrapessoal: 0, naturalista: 0 };
    multipleQuestions.forEach((q) => (out[q.axis] += answersM[q.id] || 0));
    return out;
  }, [answersM]);

  const gPct = (p: Pillar) => Math.round((gScore[p] / 20) * 100);
  const bestG = (Object.entries(gScore).sort((a, b) => b[1] - a[1])[0]?.[0] || 'autoconhecimento') as Pillar;
  const focusG = (Object.entries(gScore).sort((a, b) => a[1] - b[1])[0]?.[0] || 'autocontrole') as Pillar;
  const strongestAxis = (Object.entries(mScore).sort((a, b) => b[1] - a[1])[0]?.[0] || 'intrapessoal') as MAxis;
  const intraPct = Math.round((dScore.intra / 25) * 100);
  const interPct = Math.round((dScore.inter / 25) * 100);
  const gardnerFocus = intraPct >= interPct ? 'Intrapessoal' : 'Interpessoal';
  const combinedReady = gProgress === 20 && dProgress === 10 && mProgress === 16;
  const combinedText = combinedReady ? `Seu retrato atual sugere força principal em ${pillarLabels[bestG]}, funcionamento puxado para ${axisLabels[strongestAxis]} e leitura Gardner mais voltada para ${gardnerFocus}.` : '';

  const saveHistoryEntry = (entry: any, signature: string) => {
    if (lastSavedSignature === signature) return;
    const latest = history[0];
    const latestSignature = latest ? JSON.stringify({ type: latest.type, payload: latest.payload }) : null;
    if (latestSignature === signature) return;
    setHistory([entry, ...history].slice(0, 20));
    setLastSavedSignature(signature);
    const rewardMinutes = entry.type === 'integrado' ? 6 : 4;
    onComplete?.(`ie:${entry.type}:${entry.id}`, rewardMinutes);
    toast({ title: 'Resultado salvo', description: 'A leitura atual entrou no histórico.' });
  };

  const startPlan = () => {
    const weakPillars = (Object.entries(gScore) as [Pillar, number][]).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([p]) => p);
    const days: PlanDay[] = [];
    const actionIdx: Record<Pillar, number> = { autoconhecimento: 0, autocontrole: 0, automotivacao: 0, empatia: 0, habilidades: 0 };
    for (let d = 1; d <= 14; d++) {
      const pillar = weakPillars[(d - 1) % 2];
      const idx = actionIdx[pillar] % pillarActions[pillar].length;
      days.push({ day: d, pillar, action: pillarActions[pillar][idx], done: false, mood: null, why: planWhyByPillar[pillar] });
      actionIdx[pillar]++;
    }
    setPlan({ id: crypto.randomUUID(), startedAt: new Date().toISOString(), weakPillars, days, currentDay: 1, lastCompletedDate: null });
    setShowPlan(true);
  };

  const toggleDay = (dayIdx: number) => {
    if (!plan) return;
    const days = [...plan.days];
    const wasDone = days[dayIdx].done;
    const done = !wasDone;
    days[dayIdx] = { ...days[dayIdx], done, mood: done ? days[dayIdx].mood : null };
    setPlan({ ...plan, days, lastCompletedDate: done ? new Date().toDateString() : plan.lastCompletedDate });
    if (!wasDone && done) onComplete?.(`ie-plan:${plan.id}:${dayIdx}`, 3);
  };

  const setDayMood = (dayIdx: number, mood: PlanMood) => {
    if (!plan) return;
    const days = [...plan.days];
    days[dayIdx] = { ...days[dayIdx], mood };
    setPlan({ ...plan, days });
  };

  const nextDay = () => {
    if (!plan || plan.currentDay >= 14) return;
    setPlan({ ...plan, currentDay: plan.currentDay + 1 });
  };

  const streak = plan ? plan.days.slice(0, plan.currentDay - 1).filter((d: PlanDay) => d.done).length : 0;

  const evolution = useMemo(() => {
    if (history.length < 2) return null;
    const current = history[0];
    const previous = history[1];
    const diff: Record<Pillar, number> = {
      autoconhecimento: current.goleman.autoconhecimento - previous.goleman.autoconhecimento,
      autocontrole: current.goleman.autocontrole - previous.goleman.autocontrole,
      automotivacao: current.goleman.automotivacao - previous.goleman.automotivacao,
      empatia: current.goleman.empatia - previous.goleman.empatia,
      habilidades: current.goleman.habilidades - previous.goleman.habilidades,
    };
    return { current, previous, diff };
  }, [history]);

  useEffect(() => {
    if (!availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
  }, [availableModes, mode]);

  useEffect(() => {
    if (gProgress === 20) {
      const payload = { goleman: gScore, best: bestG, focus: focusG };
      saveHistoryEntry({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        type: 'goleman',
        payload,
      }, JSON.stringify({ type: 'goleman', payload }));
    }
  }, [gProgress, gScore, bestG, focusG]);

  useEffect(() => {
    if (dProgress === 10) {
      const payload = { gardner: dScore, gardnerFocus };
      saveHistoryEntry({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        type: 'gardner',
        payload,
      }, JSON.stringify({ type: 'gardner', payload }));
    }
  }, [dProgress, dScore, gardnerFocus]);

  useEffect(() => {
    if (mProgress === 16) {
      const payload = { multiples: mScore, strongestAxis };
      saveHistoryEntry({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        type: 'multiplas',
        payload,
      }, JSON.stringify({ type: 'multiplas', payload }));
    }
  }, [mProgress, mScore, strongestAxis]);

  useEffect(() => {
    if (!combinedReady) return;
    const payload = {
      goleman: gScore,
      gardner: dScore,
      multiples: mScore,
      best: bestG,
      focus: focusG,
      summary: combinedText,
    };
    saveHistoryEntry({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type: 'integrado',
      payload,
    }, JSON.stringify({ type: 'integrado', payload }));
  }, [combinedReady, gScore, dScore, mScore, bestG, focusG, combinedText]);

  const resetCurrentMode = () => {
    if (mode === 'goleman') setAnswersG({});
    if (mode === 'gardner') setAnswersD({});
    if (mode === 'multiplas') setAnswersM({});
    setPageByMode((prev) => ({ ...prev, [mode]: 0 }));
    toast({ title: 'Teste reiniciado', description: `As respostas de ${testInfo[mode].title} foram limpas.` });
  };

  const goByPillar = (pillar: Pillar) => {
    if (!onNavigate) return;
    if (pillar === 'autoconhecimento') return onNavigate('mood');
    if (pillar === 'autocontrole') return onNavigate('breathing');
    if (pillar === 'automotivacao') return onNavigate('missions');
    if (pillar === 'empatia') return onNavigate('healthymessages');
    return onNavigate('assertiveness');
  };

  const planRouteByPillar: Record<Pillar, { label: string; tab: any }> = {
    autoconhecimento: { label: 'Abrir Diário de Humor', tab: 'mood' },
    autocontrole: { label: 'Abrir Respiração', tab: 'breathing' },
    automotivacao: { label: 'Abrir Missões', tab: 'missions' },
    empatia: { label: 'Abrir Eu Saudável', tab: 'healthymessages' },
    habilidades: { label: 'Abrir Assertividade', tab: 'assertiveness' },
  };

  const qList = mode === 'goleman' ? golemanQuestions : mode === 'gardner' ? gardnerQuestions : multipleQuestions;
  const progress = mode === 'goleman' ? gProgress : mode === 'gardner' ? dProgress : mProgress;
  const currentPage = pageByMode[mode];
  const pageCount = Math.ceil(qList.length / QUESTION_PAGE_SIZE);
  const currentQuestions = qList.slice(currentPage * QUESTION_PAGE_SIZE, (currentPage + 1) * QUESTION_PAGE_SIZE);
  const pageStart = currentPage * QUESTION_PAGE_SIZE;
  const radarValues = (['autoconhecimento', 'autocontrole', 'automotivacao', 'empatia', 'habilidades'] as Pillar[]).map(gPct);
  const radarLabels = ['Auto', 'Controle', 'Motiva', 'Empatia', 'Social'];
  const bestMove = evolution ? (Object.entries(evolution.diff).sort((a, b) => b[1] - a[1])[0]?.[0] || focusG) as Pillar : null;
  const worstMove = evolution ? (Object.entries(evolution.diff).sort((a, b) => a[1] - b[1])[0]?.[0] || focusG) as Pillar : null;

  return (
    <div className={`p-4 pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
      <div className="mb-4 pt-4">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Leitura emocional"
          title="Inteligência Emocional"
          description="Entenda como você sente, reage, aprende e se relaciona."
          icon="🧠"
        >
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(testInfo) as TestMode[]).map((item) => (
              <div key={item} className={`rounded-2xl p-3 ${c('bg-white/80 border border-white', 'bg-slate-900/50 border border-slate-700')}`}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1">
                  <p className="min-w-0 text-sm font-black leading-snug">{testInfo[item].title}</p>
                  <p className={`shrink-0 text-right text-[10px] font-black uppercase tracking-[0.16em] ${c('text-indigo-600', 'text-indigo-300')}`}>{testInfo[item].badge}</p>
                  <p className={`col-span-2 text-xs leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>{testInfo[item].desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionHeroCard>
      </div>

      <div className={`rounded-2xl p-4 border mb-4 ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Se quiser ampliar a leitura</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            { label: 'Diário de Humor', hint: 'cruzar emoção e padrão recente', tab: 'mood' },
            { label: 'Mapa da Minha Vida', hint: 'ver isso dentro do quadro maior do momento', tab: 'mapavida' },
            { label: 'Exploração Vocacional', hint: 'ligar jeito de funcionar e caminho', tab: 'vocacional' },
            { label: 'Missões', hint: 'transformar foco em passo concreto', tab: 'missions' },
          ].map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onNavigate?.(item.tab)}
              className={`rounded-[1.3rem] border p-4 min-h-[88px] text-left ${c('bg-slate-50 border-slate-100 text-slate-700', 'bg-slate-900 border-slate-700 text-slate-200')}`}
            >
              <p className="text-sm font-black">{item.label}</p>
              <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{item.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {isPro && plan && showPlan && (
        <div className={`rounded-2xl p-4 border mb-4 ${c('bg-emerald-50 border-emerald-200', 'bg-emerald-900/20 border-emerald-700')}`}>
          <div onClick={() => setShowPlan(false)} className="flex justify-between items-center mb-2 cursor-pointer">
            <div className="flex-1">
              <p className="font-black">Plano de 14 dias</p>
              <p className="text-[10px] leading-tight mt-0.5 opacity-70">Montado a partir do seu resultado Goleman, com foco em {pillarLabels[plan.weakPillars[0] as Pillar]} e {pillarLabels[plan.weakPillars[1] as Pillar]}</p>
            </div>
            <span className="text-xs font-bold opacity-60">Ocultar</span>
          </div>
          <p className={`text-sm ${c('text-emerald-700', 'text-emerald-300')}`}>Dia {plan.currentDay} de 14 • sequência atual: {streak} dias</p>
          <div className={`h-2 rounded-full overflow-hidden mt-3 ${c('bg-emerald-100', 'bg-emerald-950/50')}`}>
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(streak / 14) * 100}%` }} />
          </div>
          <div className={`mt-3 p-3 rounded-xl ${c('bg-white/70', 'bg-slate-900/30')}`}>
            <p className="text-xs font-bold">{pillarLabels[plan.days[plan.currentDay - 1].pillar]}</p>
            <p className="text-sm mt-1">{plan.days[plan.currentDay - 1].action}</p>
            <p className={`text-xs mt-2 ${c('text-emerald-800', 'text-emerald-200')}`}>{plan.days[plan.currentDay - 1].why}</p>
            <div className="mt-3">
              <p className="text-[11px] font-black uppercase tracking-wide opacity-70">Como foi esse dia?</p>
              <div className="flex gap-2 mt-2">
                {(['leve', 'ok', 'desafiador'] as PlanMood[]).map((mood) => (
                  <button key={mood} onClick={() => setDayMood(plan.currentDay - 1, mood)} className={`px-3 py-2 rounded-lg text-xs font-bold ${plan.days[plan.currentDay - 1].mood === mood ? 'bg-emerald-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>{planMoodLabels[mood]}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => toggleDay(plan.currentDay - 1)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold ${plan.days[plan.currentDay - 1].done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{plan.days[plan.currentDay - 1].done ? 'Concluído' : 'Marcar como feito'}</button>
              {plan.days[plan.currentDay - 1].done && plan.currentDay < 14 && (plan.lastCompletedDate === new Date().toDateString() ? <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold text-center border border-slate-200 cursor-not-allowed">Volte amanhã</div> : <button onClick={nextDay} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Próximo dia</button>)}
              {plan.days[plan.currentDay - 1].done && plan.currentDay === 14 && <button onClick={startPlan} className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold">Recomeçar</button>}
            </div>
            <button onClick={() => onNavigate?.(planRouteByPillar[plan.days[plan.currentDay - 1].pillar].tab)} className={`mt-2 w-full px-3 py-2 rounded-lg text-xs font-bold ${c('bg-slate-900 text-white', 'bg-slate-700 text-slate-100')}`}>{planRouteByPillar[plan.days[plan.currentDay - 1].pillar].label}</button>
          </div>
        </div>
      )}

      {isPro && plan && !showPlan && <button onClick={() => setShowPlan(true)} className={`w-full mb-3 p-3 rounded-xl text-sm font-bold ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>Ver meu plano de 14 dias</button>}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {availableModes.map((item) => (
          <button key={item} onClick={() => setMode(item)} className={`py-2 rounded-xl text-xs font-bold ${mode === item ? 'bg-indigo-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>{testInfo[item].title}</button>
        ))}
      </div>

      {!isPro && (
        <div className={`rounded-2xl p-4 mb-4 border ${c('bg-fuchsia-50 border-fuchsia-200', 'bg-fuchsia-950/20 border-fuchsia-900/30')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-fuchsia-700', 'text-fuchsia-300')}`}>Completo no Pro</p>
          <p className="mt-2 text-sm">No grátis, fica a leitura essencial de Goleman. No Pro, entram Gardner, Múltiplas Inteligências, histórico e plano de 14 dias.</p>
          <button onClick={() => onShowUpgrade?.()} className="mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white transition-all active:scale-95">Ver plano Pro</button>
        </div>
      )}

      <div className={`rounded-2xl p-4 border mb-4 ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-sm">{testInfo[mode].title}</p>
            <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-300')}`}>{testInfo[mode].badge}</p>
          </div>
          <div className={`px-3 py-2 rounded-xl text-[11px] font-black ${c('bg-indigo-50 text-indigo-700', 'bg-indigo-500/10 text-indigo-300')}`}>{testInfo[mode].questions} perguntas</div>
        </div>
        <p className={`text-xs mt-2 ${c('text-slate-500', 'text-slate-400')}`}>Tempo estimado: {testInfo[mode].time}</p>
        <p className={`text-xs mt-2 ${c('text-slate-500', 'text-slate-400')}`}>Cada leitura salva no histórico. O retrato integrado aparece quando os 3 testes estiverem completos.</p>
        {showIntro && <button onClick={() => setShowIntro(false)} className="mt-3 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Começar teste</button>}
      </div>

      <div className={`rounded-2xl p-4 border mb-4 ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-black text-sm">Histórico</p>
            <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>
              {history.length > 0
                ? `${history.length} leitura${history.length > 1 ? 's' : ''} salva${history.length > 1 ? 's' : ''}.`
                : 'Complete um teste para começar seu histórico.'}
            </p>
          </div>
          {isPro && history.length > 0 && (
            <button
              onClick={() => setExpandedHistory(expandedHistory === 'panel' ? null : 'panel')}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-indigo-50 text-indigo-700', 'bg-indigo-500/10 text-indigo-300')}`}
            >
              {expandedHistory === 'panel' ? 'Ocultar' : 'Abrir'}
            </button>
          )}
        </div>
        {isPro && history.length > 0 && expandedHistory === 'panel' && (
          <div className="space-y-2 max-h-60 overflow-auto mt-3">
            {history.slice(0, 3).map((h) => (
              <div key={h.id} className={`p-2 rounded-xl text-xs ${c('bg-slate-50', 'bg-slate-700')}`}>
                <div className="flex justify-between items-start">
                  <div onClick={() => setExpandedHistory(expandedHistory === h.id ? 'panel' : h.id)} className="cursor-pointer flex-1">
                    <p>
                      <strong>{new Date(h.createdAt).toLocaleDateString('pt-BR')}</strong>
                      {' '}•{' '}
                      {h.type === 'goleman' && <>Goleman • Força: {pillarLabels[h.payload.best]} • Foco: {pillarLabels[h.payload.focus]}</>}
                      {h.type === 'gardner' && <>Gardner • Leitura: {h.payload.gardnerFocus}</>}
                      {h.type === 'multiplas' && <>Múltiplas • Destaque: {axisLabels[h.payload.strongestAxis as MAxis]}</>}
                      {h.type === 'integrado' && <>Integrado • Força: {pillarLabels[h.payload.best]} • Foco: {pillarLabels[h.payload.focus]}</>}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setHistory(history.filter((item) => item.id !== h.id)); }} className="ml-2 px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-bold">Excluir</button>
                </div>
                {expandedHistory === h.id && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="font-bold mb-1">Resumo</p>
                    {h.type === 'goleman' && <p>Goleman: Autocon. {Math.round((h.payload.goleman.autoconhecimento / 20) * 100)}%, Autocont. {Math.round((h.payload.goleman.autocontrole / 20) * 100)}%, Automot. {Math.round((h.payload.goleman.automotivacao / 20) * 100)}%, Empatia {Math.round((h.payload.goleman.empatia / 20) * 100)}%, Habil. {Math.round((h.payload.goleman.habilidades / 20) * 100)}%</p>}
                    {h.type === 'gardner' && <p>Gardner: Intra {Math.round((h.payload.gardner.intra / 25) * 100)}%, Inter {Math.round((h.payload.gardner.inter / 25) * 100)}%</p>}
                    {h.type === 'multiplas' && <p>Múltiplas: destaque em {axisLabels[h.payload.strongestAxis as MAxis]}</p>}
                    {h.type === 'integrado' && (
                      <>
                        <p>Goleman: Autocon. {Math.round((h.payload.goleman.autoconhecimento / 20) * 100)}%, Autocont. {Math.round((h.payload.goleman.autocontrole / 20) * 100)}%, Automot. {Math.round((h.payload.goleman.automotivacao / 20) * 100)}%, Empatia {Math.round((h.payload.goleman.empatia / 20) * 100)}%, Habil. {Math.round((h.payload.goleman.habilidades / 20) * 100)}%</p>
                        <p className="mt-1">Gardner: Intra {Math.round((h.payload.gardner.intra / 25) * 100)}%, Inter {Math.round((h.payload.gardner.inter / 25) * 100)}%</p>
                        <p className="mt-1">Múltiplas: destaque em {axisLabels[(((Object.entries(h.payload.multiples) as [MAxis, number][]).sort((a, b) => b[1] - a[1])[0]?.[0]) || 'intrapessoal') as MAxis]}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!showIntro && (
        <>
          <div className={`rounded-2xl p-4 border mb-3 ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Progresso</p>
                <p className="text-sm font-bold mt-1">Bloco {currentPage + 1} de {pageCount} • {progress}/{qList.length} respostas</p>
              </div>
              <div className={`px-3 py-2 rounded-xl text-xs font-black ${c('bg-indigo-50 text-indigo-700', 'bg-indigo-500/10 text-indigo-300')}`}>{Math.round((progress / qList.length) * 100)}%</div>
            </div>
            <div className={`mt-3 h-2.5 rounded-full overflow-hidden ${c('bg-slate-100', 'bg-slate-900')}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 transition-all" style={{ width: `${(progress / qList.length) * 100}%` }} />
            </div>
          </div>

          <div className="space-y-3">
            {currentQuestions.map((q: any, i) => (
              <div key={q.id} className={`p-3 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                <p className="text-sm font-bold mb-2">{pageStart + i + 1}. {q.text}</p>
                <div className="grid grid-cols-5 gap-1">
                  {scale.map((n) => {
                    const selected = mode === 'goleman' ? answersG[q.id] === n : mode === 'gardner' ? answersD[q.id] === n : answersM[q.id] === n;
                    return <button key={n} onClick={() => mode === 'goleman' ? setAnswersG((p) => ({ ...p, [q.id]: n })) : mode === 'gardner' ? setAnswersD((p) => ({ ...p, [q.id]: n })) : setAnswersM((p) => ({ ...p, [q.id]: n }))} className={`py-2 rounded-lg text-xs font-bold ${selected ? 'bg-indigo-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>{n}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={() => setPageByMode((prev) => ({ ...prev, [mode]: Math.max(0, prev[mode] - 1) }))} disabled={currentPage === 0} className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold ${currentPage === 0 ? c('bg-slate-100 text-slate-400', 'bg-slate-800 text-slate-500') : 'bg-slate-900 text-white'}`}>Voltar bloco</button>
            <button onClick={() => setPageByMode((prev) => ({ ...prev, [mode]: Math.min(pageCount - 1, prev[mode] + 1) }))} disabled={currentPage >= pageCount - 1} className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold ${currentPage >= pageCount - 1 ? c('bg-slate-100 text-slate-400', 'bg-slate-800 text-slate-500') : 'bg-indigo-600 text-white'}`}>Próximo bloco</button>
          </div>
          <button onClick={resetCurrentMode} className={`w-full mt-2 px-3 py-2 rounded-xl text-sm font-bold ${c('bg-rose-50 text-rose-700 border border-rose-100', 'bg-rose-900/20 text-rose-300 border border-rose-800')}`}>Reiniciar {testInfo[mode].title}</button>
        </>
      )}

      {gProgress === 20 && (
        <div className={`mt-4 p-4 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="font-black mb-2">Leitura Goleman</p>
          <div className="flex justify-center mb-3"><RadarChart values={radarValues} labels={radarLabels} size={220} /></div>
          <div className="space-y-2 text-sm">
            {(Object.keys(gScore) as Pillar[]).map((p) => (
              <div key={p}>
                <p className="font-bold">{pillarLabels[p]}: {gPct(p)}%</p>
                <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{pillarDesc[p]}</p>
              </div>
            ))}
          </div>
          <p className="text-sm mt-3">Força: <strong>{pillarLabels[bestG]}</strong> • Foco: <strong>{pillarLabels[focusG]}</strong></p>
          <button onClick={() => goByPillar(focusG)} className="mt-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Prática recomendada</button>
        </div>
      )}

      {dProgress === 10 && (
        <div className={`mt-3 p-4 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="font-black mb-2">Leitura Gardner</p>
          <p className="text-sm"><strong>Intrapessoal:</strong> {intraPct}%</p>
          <p className={`text-xs mb-2 ${c('text-slate-500', 'text-slate-400')}`}>Capacidade de se conhecer, se regular e entender suas próprias emoções.</p>
          <p className="text-sm"><strong>Interpessoal:</strong> {interPct}%</p>
          <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>Capacidade de entender os outros e se relacionar bem.</p>
        </div>
      )}

      {mProgress === 16 && (
        <div className={`mt-3 p-4 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="font-black mb-2">Múltiplas Inteligências</p>
          <div className="space-y-2 text-sm">
            {(Object.entries(mScore) as [MAxis, number][]).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k}>
                <p className="font-bold">{axisLabels[k]}: {Math.round((v / 10) * 100)}%</p>
                <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{axisDesc[k]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {combinedReady && (
        <>
          <div className={`mt-4 p-4 rounded-2xl border ${c('bg-gradient-to-br from-indigo-50 to-cyan-50 border-indigo-200', 'bg-gradient-to-br from-indigo-900/20 to-cyan-900/20 border-indigo-700')}`}>
            <p className="font-black mb-3">Leitura prática de hoje</p>
            <div className="grid grid-cols-1 gap-3">
              <div className={`rounded-2xl p-3 ${c('bg-white/90', 'bg-slate-900/40')}`}>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Seu ponto forte hoje</p>
                <p className="text-sm font-bold mt-1">{pillarLabels[bestG]}</p>
              </div>
              <div className={`rounded-2xl p-3 ${c('bg-white/90', 'bg-slate-900/40')}`}>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Seu ponto mais vulnerável</p>
                <p className="text-sm font-bold mt-1">{pillarLabels[focusG]}</p>
              </div>
              <div className={`rounded-2xl p-3 ${c('bg-white/90', 'bg-slate-900/40')}`}>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">O que praticar esta semana</p>
                <p className="text-sm font-bold mt-1">{pillarActions[focusG][0]}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => goByPillar(focusG)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Ir para prática</button>
                  {isPro ? <button onClick={startPlan} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Montar plano</button> : null}
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-4 p-4 rounded-2xl border ${c('bg-indigo-50 border-indigo-200', 'bg-indigo-900/20 border-indigo-700')}`}>
            <p className="font-black mb-1">Retrato integrado</p>
            <p className="text-sm">{combinedText}</p>
            <div className="flex gap-2 flex-wrap mt-2">
              {isPro ? <button onClick={startPlan} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Iniciar plano 14 dias</button> : null}
            </div>
          </div>
        </>
      )}

      {evolution && (
        <div className={`mt-4 p-4 rounded-2xl border ${c('bg-amber-50 border-amber-200', 'bg-amber-900/20 border-amber-700')}`}>
          <p className="font-black mb-2">Comparação com resultado anterior</p>
          <p className={`text-xs mb-2 ${c('text-amber-700', 'text-amber-300')}`}>{new Date(evolution.current.createdAt).toLocaleDateString('pt-BR')} vs {new Date(evolution.previous.createdAt).toLocaleDateString('pt-BR')}</p>
          <div className={`rounded-xl p-3 mb-3 ${c('bg-white/70', 'bg-slate-900/30')}`}>
            <p className="text-sm font-bold">Mais subiu: {bestMove ? pillarLabels[bestMove] : 'Sem dados'}</p>
            <p className="text-sm font-bold mt-1">Mais caiu: {worstMove ? pillarLabels[worstMove] : 'Sem dados'}</p>
          </div>
          <div className="space-y-1 text-sm">
            {(Object.keys(evolution.diff) as Pillar[]).map((p) => {
              const d = evolution.diff[p];
              const icon = d > 0 ? 'subiu' : d < 0 ? 'caiu' : 'manteve';
              const color = d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-500' : 'text-slate-500';
              return <p key={p} className={color}>{pillarLabels[p]}: {icon} {d > 0 ? '+' : ''}{Math.round((d / 20) * 100)}%</p>;
            })}
          </div>
        </div>
      )}

    </div>
  );
}
