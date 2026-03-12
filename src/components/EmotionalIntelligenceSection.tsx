'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props { darkMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void }

type Pillar = 'autoconhecimento' | 'autocontrole' | 'automotivacao' | 'empatia' | 'habilidades';
type MAxis = 'linguistica' | 'logica' | 'espacial' | 'corporal' | 'musical' | 'interpessoal' | 'intrapessoal' | 'naturalista';

type Q = { id: string; text: string; pillar: Pillar };
type GQ = { id: string; text: string; axis: 'intra' | 'inter' };

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

const pillarActions: Record<Pillar, string[]> = {
  autoconhecimento: [
    'Escreva 3 emoções que você sentiu hoje e o que as causou.',
    'Observe por 5 minutos como seu corpo reage ao estresse.',
    'Liste 5 gatilhos emocionais seus e onde eles aparecem no corpo.',
    'Descreva em 1 frase como você se sente agora e por quê.',
    'Identifique 1 padrão emocional que se repete na sua semana.',
    'Anote 3 situações que te deixaram feliz hoje.',
    'Reflita: qual emoção você mais evita sentir? Por quê?',
    'Escreva sobre um momento em que não entendeu sua própria reação.',
    'Liste seus 3 maiores medos e o que eles têm em comum.',
    'Desenhe um mapa de como uma emoção forte se espalha pelo seu corpo.',
    'Identifique 1 crença limitante que aparece quando você está estressado.',
    'Escreva uma carta para você mesmo sobre um desafio atual.',
    'Liste 5 coisas que te fazem sentir vivo.',
    'Observe: quando você está cansado, como isso muda suas emoções?',
  ],
  autocontrole: [
    'Quando sentir raiva, conte até 10 antes de responder.',
    'Pratique 3 respirações profundas antes de reagir a algo difícil.',
    'Atrasse uma decisão impulsiva por 1 hora e veja como se sente depois.',
    'Observe um gatilho sem reagir — só respire e observe.',
    'Escreva sobre uma vez que reagiu mal e como poderia ter feito diferente.',
    'Antes de criticar alguém, pause e pergunte: isso é necessário?',
    'Quando sentir vontade de descontar algo em alguém, dê um tempo.',
    'Pratique dizer "preciso pensar" antes de prometer algo por impulso.',
    'Identifique 1 situação que te tira do sério e planeje como responder.',
    'Tente ficar 30 minutos sem reclamar de nada.',
    'Quando sentir frustração, escreva o que está por trás dela.',
    'Pratique aceitar um "não" sem argumentar imediatamente.',
    'Faça uma pausa de 5 minutos consciente quando estiver sob pressão.',
    'Refleta: como você se sente depois de se controlar em uma situação difícil?',
  ],
  automotivacao: [
    'Defina 1 meta pequena para hoje e complete-a.',
    'Escreva 3 razões pelas quais seus objetivos importam para você.',
    'Faça uma tarefa que você está adiando há dias.',
    'Liste 5 pequenas vitórias da semana passada.',
    'Crie uma recompensa simbólica para quando completar uma tarefa difícil.',
    'Escreva sobre um obstáculo e como você vai superá-lo.',
    'Pratique começar algo novo sem esperar ter "vontade".',
    'Identifique 1 distração frequente e reduza seu tempo hoje.',
    'Escreva uma carta para você do futuro: como você se sente após persistir?',
    'Divida uma meta grande em 3 micro-passos e faça o primeiro hoje.',
    'Celebre 1 progresso, mesmo que pareça pequeno.',
    'Pergunte: o que te motiva de verdade? Escreva 3 coisas.',
    'Crie um lema pessoal que te inspira quando você está desanimado.',
    'Refleta: como seria sua vida se você seguisse seus objetivos consistentemente?',
  ],
  empatia: [
    'Observe alguém ao seu redor e tente adivinhar como essa pessoa se sente.',
    'Pergunte para alguém como foi o dia dela e escute sem interromper.',
    'Identifique 1 momento em que você poderia ter sido mais empático.',
    'Pratique validar o sentimento de alguém: "faz sentido você se sentir assim".',
    'Escreva sobre como alguém próximo pode estar se sentindo hoje.',
    'Tente ver uma situação difícil da perspectiva de outra pessoa.',
    'Pergunte a 2 pessoas o que elas mais valorizam em você.',
    'Quando alguém reclamar, tente entender o que está por trás da reclamação.',
    'Identifique 1 opinião diferente da sua e reflita sobre ela.',
    'Observe o tom de voz de alguém e veja se combina com as palavras.',
    'Pratique não julgar alguém que você costuma julgar.',
    'Escreva sobre um momento em que alguém te entendeu profundamente.',
    'Pergunte para alguém: o que você precisa de mim hoje?',
    'Refleta: como você se sente quando alguém realmente te ouve?',
  ],
  habilidades: [
    'Diga "não" para algo que você não quer fazer, sem culpa excessiva.',
    'Inicie uma conversa difícil com respeito e clareza.',
    'Peça ajuda para algo específico hoje.',
    'Pratique dar feedback construtivo para alguém.',
    'Escreva sobre um conflito e como você poderia resolvê-lo com diálogo.',
    'Identifique 1 limite seu que precisa ser comunicado a alguém.',
    'Envie uma mensagem de gratidão para alguém importante.',
    'Pratique escutar alguém por 5 minutos sem dar conselho.',
    'Identifique 1 relacionamento que precisa de mais atenção.',
    'Escreva sobre como você pode fortalecer uma amizade esta semana.',
    'Quando discordar de alguém, pratique dizer "eu vejo diferente" com respeito.',
    'Pergunte para alguém: como posso te apoiar melhor?',
    'Reflita: que tipo de pessoa você quer ser nas suas relações?',
    'Celebre 1 conexão que você construiu recentemente.',
  ],
};

const axisLabels: Record<MAxis, string> = {
  musical: '🎵 Musical',
  corporal: '🏃 Corporal-cinestésica',
  linguistica: '🗣️ Linguística',
  logica: '🔢 Lógico-matemática',
  espacial: '🧭 Espacial',
  interpessoal: '🤝 Interpessoal',
  intrapessoal: '🪞 Intrapessoal',
  naturalista: '🌱 Naturalista',
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
  { id: 'gd6', axis: 'inter', text: 'Leio sinais sociais (tom, expressão, contexto) com facilidade.' },
  { id: 'gd7', axis: 'inter', text: 'Consigo adaptar minha comunicação ao outro sem perder autenticidade.' },
  { id: 'gd8', axis: 'inter', text: 'Facilito conversas difíceis com respeito.' },
  { id: 'gd9', axis: 'inter', text: 'Costumo criar pontes em vez de ampliar conflitos.' },
  { id: 'gd10', axis: 'inter', text: 'As pessoas me veem como alguém acessível para conversar.' },
];

const multipleQuestions: Array<{ id: string; axis: MAxis; text: string }> = [
  { id: 'm1', axis: 'musical', text: 'Percebo padrões de ritmo e melodia com facilidade.' },
  { id: 'm2', axis: 'musical', text: 'Música influencia fortemente meu foco e humor.' },
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

const scale = [1, 2, 3, 4, 5];

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
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-slate-600 font-medium">
            {label.length > 8 ? label.slice(0, 8) + '...' : label}
          </text>
        );
      })}
    </svg>
  );
}

export default function EmotionalIntelligenceSection({ darkMode: dm, onNavigate }: Props) {
  const c = (l: string, d: string) => (dm ? d : l);
  const [mode, setMode] = useState<'goleman' | 'gardner' | 'multiplas'>('goleman');
  const [answersG, setAnswersG] = useState<Record<string, number>>({});
  const [answersD, setAnswersD] = useState<Record<string, number>>({});
  const [answersM, setAnswersM] = useState<Record<string, number>>({});
  const [history, setHistory] = useLocalStorage<any[]>('psico_ie_history', []);
  const [plan, setPlan] = useLocalStorage<any | null>('psico_ie_plan', null);
  const [showIntro, setShowIntro] = useState(true);
  const [showPlan, setShowPlan] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const gProgress = Object.keys(answersG).length;
  const dProgress = Object.keys(answersD).length;
  const mProgress = Object.keys(answersM).length;

  const gScore = useMemo(() => {
    const out: Record<Pillar, number> = { autoconhecimento: 0, autocontrole: 0, automotivacao: 0, empatia: 0, habilidades: 0 };
    golemanQuestions.forEach((q) => (out[q.pillar] += answersG[q.id] || 0));
    return out;
  }, [answersG]);

  const dScore = useMemo(() => {
    let intra = 0; let inter = 0;
    gardnerQuestions.forEach((q) => { const v = answersD[q.id] || 0; q.axis === 'intra' ? intra += v : inter += v; });
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

  const combinedReady = gProgress === 20 && dProgress === 10 && mProgress === 16;
  const combinedText = useMemo(() => {
    if (!combinedReady) return '';
    const topM = Object.entries(mScore).sort((a, b) => b[1] - a[1])[0]?.[0] || 'intrapessoal';
    const interp = Math.round((dScore.inter / 25) * 100);
    const intra = Math.round((dScore.intra / 25) * 100);
    return `Perfil combinado: força principal em ${pillarLabels[bestG]}; estilo dominante ${axisLabels[topM]}; Gardner mostra Intrapessoal ${intra}% e Interpessoal ${interp}%.`;
  }, [combinedReady, mScore, dScore, bestG]);

  const startPlan = () => {
    const weakPillars = (Object.entries(gScore) as [Pillar, number][])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([p]) => p);

    const days: Array<{ day: number; pillar: Pillar; action: string; done: boolean }> = [];
    let actionIdx: Record<Pillar, number> = { autoconhecimento: 0, autocontrole: 0, automotivacao: 0, empatia: 0, habilidades: 0 };

    for (let d = 1; d <= 14; d++) {
      const pillar = weakPillars[(d - 1) % 2];
      const actions = pillarActions[pillar];
      const idx = actionIdx[pillar] % actions.length;
      days.push({ day: d, pillar, action: actions[idx], done: false });
      actionIdx[pillar]++;
    }

    const newPlan = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      weakPillars,
      days,
      currentDay: 1,
      lastCompletedDate: null,
    };
    setPlan(newPlan);
    setShowPlan(true);
  };

  const toggleDay = (dayIdx: number) => {
    if (!plan) return;
    const newDays = [...plan.days];
    const isDone = !newDays[dayIdx].done;
    newDays[dayIdx].done = isDone;
    setPlan({ ...plan, days: newDays, lastCompletedDate: isDone ? new Date().toDateString() : plan.lastCompletedDate });
  };

  const nextDay = () => {
    if (!plan || plan.currentDay >= 14) return;
    setPlan({ ...plan, currentDay: plan.currentDay + 1 });
  };

  const streak = plan ? plan.days.slice(0, plan.currentDay - 1).filter((d: any) => d.done).length : 0;

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

  const saveCombined = () => {
    const item = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      goleman: gScore,
      gardner: dScore,
      multiples: mScore,
      best: bestG,
      focus: focusG,
      summary: combinedText,
    };
    setHistory([item, ...history].slice(0, 20));
  };

  const goByPillar = (pillar: Pillar) => {
    if (!onNavigate) return;
    if (pillar === 'autoconhecimento') return onNavigate('diary');
    if (pillar === 'autocontrole') return onNavigate('breathing');
    if (pillar === 'automotivacao') return onNavigate('missions');
    if (pillar === 'empatia') return onNavigate('fivefingers');
    return onNavigate('assertiveness');
  };

  const testInfo = {
    goleman: { title: 'Teste de Inteligência Emocional (Goleman)', desc: 'Avalia 5 pilares fundamentais: autoconhecimento, autocontrole, automotivação, empatia e habilidades sociais.', time: '3-5 min', questions: 20 },
    gardner: { title: 'Teste Intra/Interpessoal (Gardner)', desc: 'Mede Intrapessoal (conhecer a si mesmo) e Interpessoal (relacionar com os outros).', time: '2-3 min', questions: 10 },
    multiplas: { title: 'Teste de Inteligências Múltiplas', desc: 'Mapeia seus estilos predominantes entre 8 inteligências.', time: '3-5 min', questions: 16 },
  };

  const qList = mode === 'goleman' ? golemanQuestions : mode === 'gardner' ? gardnerQuestions : multipleQuestions;
  const progress = mode === 'goleman' ? gProgress : mode === 'gardner' ? dProgress : mProgress;

  const radarValues = (['autoconhecimento', 'autocontrole', 'automotivacao', 'empatia', 'habilidades'] as Pillar[]).map(gPct);
  const radarLabels = ['Autocon.', 'Autocont.', 'Automot.', 'Empatia', 'Habil.'];

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-4">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🧪 Inteligência Emocional</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Descubra como você pensa, sente e se relaciona.</p>
      </div>

      {plan && showPlan && (
        <div className={`rounded-2xl p-4 border mb-4 ${c('bg-emerald-50 border-emerald-200', 'bg-emerald-900/20 border-emerald-700')}`}>
          <div onClick={() => setShowPlan(false)} className="flex justify-between items-center mb-2 cursor-pointer">
            <div className="flex-1">
            <p className="font-black">📅 Plano de 14 dias</p>
            <p className="text-[10px] leading-tight mt-0.5 opacity-70">
              Focado em {pillarLabels[plan.weakPillars[0] as Pillar]} e {pillarLabels[plan.weakPillars[1] as Pillar]}
            </p>
          </div>
            <span className="text-xs font-bold opacity-60">Toque para ocultar</span>
          </div>
          <p className={`text-sm ${c('text-emerald-700', 'text-emerald-300')}`}>Dia {plan.currentDay} de 14 • Streak: {streak} dias</p>
          <div className="mt-2 p-3 rounded-xl bg-white/50">
            <p className="text-xs font-bold">{pillarLabels[plan.days[plan.currentDay - 1].pillar]}</p>
            <p className="text-sm mt-1">{plan.days[plan.currentDay - 1].action}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => toggleDay(plan.currentDay - 1)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold ${plan.days[plan.currentDay - 1].done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {plan.days[plan.currentDay - 1].done ? '✓ Concluído' : 'Marcar como feito'}
              </button>
              {plan.days[plan.currentDay - 1].done && plan.currentDay < 14 && (
                plan.lastCompletedDate === new Date().toDateString() ? (
                  <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold text-center border border-slate-200 cursor-not-allowed">
                    ⏳ Volte amanhã
                  </div>
                ) : (
                  <button onClick={nextDay} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                    Ir para Dia {plan.currentDay + 1} ➔
                  </button>
                )
              )}
              {plan.days[plan.currentDay - 1].done && plan.currentDay === 14 && (
                <button onClick={startPlan} className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold">
                  🔄 Recomeçar Plano
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {plan && !showPlan && (
        <button onClick={() => setShowPlan(true)} className={`w-full mb-3 p-3 rounded-xl text-sm font-bold ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>
          📅 Ver meu plano de 14 dias
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <button onClick={() => setMode('goleman')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'goleman' ? 'bg-indigo-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Goleman</button>
        <button onClick={() => setMode('gardner')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'gardner' ? 'bg-indigo-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Gardner</button>
        <button onClick={() => setMode('multiplas')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'multiplas' ? 'bg-indigo-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Múltiplas</button>
      </div>

      <div className={`rounded-2xl p-4 border mb-4 ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
        <p className="font-bold text-sm">{testInfo[mode].title}</p>
        <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-300')}`}>{testInfo[mode].desc}</p>
        <p className={`text-xs mt-2 ${c('text-slate-500', 'text-slate-400')}`}>⏱ {testInfo[mode].time} • {testInfo[mode].questions} perguntas</p>
        {showIntro && <button onClick={() => setShowIntro(false)} className="mt-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Começar teste</button>}
      </div>

      {!showIntro && (
        <>
          <p className="text-xs font-bold mb-2">Progresso: {progress}/{qList.length}</p>
          <div className="space-y-3">
            {qList.map((q: any, i) => (
              <div key={q.id} className={`p-3 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                <p className="text-sm font-bold mb-2">{i + 1}. {q.text}</p>
                <div className="grid grid-cols-5 gap-1">
                  {scale.map((n) => {
                    const selected = mode === 'goleman' ? answersG[q.id] === n : mode === 'gardner' ? answersD[q.id] === n : answersM[q.id] === n;
                    return (
                      <button key={n} onClick={() => mode === 'goleman' ? setAnswersG((p) => ({ ...p, [q.id]: n })) : mode === 'gardner' ? setAnswersD((p) => ({ ...p, [q.id]: n })) : setAnswersM((p) => ({ ...p, [q.id]: n }))} className={`py-2 rounded-lg text-xs font-bold ${selected ? 'bg-indigo-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>{n}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {gProgress === 20 && (
        <div className={`mt-4 p-4 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="font-black mb-2">Resultado Goleman</p>
          <div className="flex justify-center mb-3">
            <RadarChart values={radarValues} labels={radarLabels} size={220} />
          </div>
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
          <p className="font-black mb-2">Leitura Gardner (Intra/Interpessoal)</p>
          <p className="text-sm"><strong>🪞 Intrapessoal:</strong> {Math.round((dScore.intra / 25) * 100)}%</p>
          <p className={`text-xs mb-2 ${c('text-slate-500', 'text-slate-400')}`}>Capacidade de se conhecer, se regular e entender suas próprias emoções.</p>
          <p className="text-sm"><strong>🤝 Interpessoal:</strong> {Math.round((dScore.inter / 25) * 100)}%</p>
          <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>Capacidade de entender os outros e se relacionar bem.</p>
        </div>
      )}

      {mProgress === 16 && (
        <div className={`mt-3 p-4 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="font-black mb-2">Perfil de Inteligências Múltiplas</p>
          <div className="space-y-2 text-sm">
            {(Object.entries(mScore) as [MAxis, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k}>
                  <p className="font-bold">{axisLabels[k]}: {Math.round((v / 10) * 100)}%</p>
                  <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{axisDesc[k]}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {combinedReady && (
        <div className={`mt-4 p-4 rounded-2xl border ${c('bg-indigo-50 border-indigo-200', 'bg-indigo-900/20 border-indigo-700')}`}>
          <p className="font-black mb-1">Resultado Integrado (Completo)</p>
          <p className="text-sm">{combinedText}</p>
          <div className="flex gap-2 flex-wrap mt-2">
            <button onClick={saveCombined} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Salvar resultado</button>
            <button onClick={startPlan} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Iniciar plano 14 dias</button>
          </div>
        </div>
      )}

      {evolution && (
        <div className={`mt-4 p-4 rounded-2xl border ${c('bg-amber-50 border-amber-200', 'bg-amber-900/20 border-amber-700')}`}>
          <p className="font-black mb-2">📈 Comparação com resultado anterior</p>
          <p className={`text-xs mb-2 ${c('text-amber-700', 'text-amber-300')}`}>
            {new Date(evolution.current.createdAt).toLocaleDateString('pt-BR')} vs {new Date(evolution.previous.createdAt).toLocaleDateString('pt-BR')}
          </p>
          <div className="space-y-1 text-sm">
            {(Object.keys(evolution.diff) as Pillar[]).map((p) => {
              const d = evolution.diff[p];
              const icon = d > 0 ? '↑' : d < 0 ? '↓' : '→';
              const color = d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-500' : 'text-slate-500';
              return (
                <p key={p} className={color}>
                  {pillarLabels[p]}: {icon} {d > 0 ? '+' : ''}{Math.round((d / 20) * 100)}%
                </p>
              );
            })}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className={`mt-4 p-4 rounded-2xl border ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
          <p className="font-black mb-2">Histórico</p>
          <div className="space-y-2 max-h-60 overflow-auto">
            {history.map((h) => (
              <div 
                key={h.id}
                className={`p-2 rounded-xl text-xs ${c('bg-slate-50', 'bg-slate-700')}`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                    className="cursor-pointer flex-1"
                  >
                    <p><strong>{new Date(h.createdAt).toLocaleDateString('pt-BR')}</strong> • Força: {pillarLabels[h.best]} • Foco: {pillarLabels[h.focus]}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setHistory(history.filter(item => item.id !== h.id));
                    }}
                    className="ml-2 px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold"
                  >
                    Excluir
                  </button>
                </div>
                {expandedHistory === h.id && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="font-bold mb-1">Detalhes:</p>
                    <p>Goleman: Autocon. {Math.round((h.goleman.autoconhecimento / 20) * 100)}%, Autocont. {Math.round((h.goleman.autocontrole / 20) * 100)}%, Automot. {Math.round((h.goleman.automotivacao / 20) * 100)}%, Empatia {Math.round((h.goleman.empatia / 20) * 100)}%, Habil. {Math.round((h.goleman.habilidades / 20) * 100)}%</p>
                    <p className="mt-1">Gardner: Intra {Math.round((h.gardner.intra / 25) * 100)}%, Inter {Math.round((h.gardner.inter / 25) * 100)}%</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}