'use client';

import { useMemo, useState, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SectionHeroCard from './SectionHeroCard';

interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: any, params?: any) => void;
}

type Cat = 'autocritica' | 'comparacao' | 'perfeccionismo' | 'culpa' | 'catastrofizacao' | 'relacionamentos' | 'trabalho';
type ContextGroup = 'relacionamento' | 'familia' | 'trabalho' | 'infancia' | 'autocritica';

interface Pattern {
  id: string;
  toxic: string;
  reframed: string;
  emoji: string;
  category: Cat;
  situations: string[];
}

interface PersonalHistoryItem {
  id: string;
  patternId: string;
  toxic: string;
  createdAt: string;
}

interface TrainCompletedRound {
  round: number;
  patternId: string;
  toxic: string;
  category: Cat;
  reframed: string;
  relief: number;
  correct: boolean;
}

const toxicPatterns: Pattern[] = [
  { id: 'catastrofizar', toxic: 'Se algo der errado, será um desastre total.', reframed: 'Posso lidar com imprevistos. Nem tudo precisa ser perfeito.', emoji: '🌋', category: 'catastrofizacao', situations: ['quando erro', 'ansiedade'] },
  { id: 'mente-leitura', toxic: 'Eles estão pensando que sou fraco.', reframed: 'Não posso saber o que os outros pensam. Projeto minha autocrítica neles.', emoji: '🔮', category: 'comparacao', situations: ['social', 'rejeição'] },
  { id: 'tudo-ou-nada', toxic: 'Se não for perfeito, é um fracasso.', reframed: 'Progresso é melhor que perfeição.', emoji: '⚖️', category: 'perfeccionismo', situations: ['trabalho', 'estudo'] },
  { id: 'generalizar', toxic: 'Sempre faço tudo errado.', reframed: 'Cometi um erro específico. Isso não define quem sou.', emoji: '🔄', category: 'autocritica', situations: ['quando erro'] },
  { id: 'filtrar', toxic: 'Só vejo o que deu errado hoje.', reframed: 'Também houve coisas que funcionaram. Posso reconhecer microvitórias.', emoji: '🔍', category: 'autocritica', situations: ['fim do dia'] },
  { id: 'rotular', toxic: 'Sou um perdedor.', reframed: 'Sou alguém em processo de aprendizado.', emoji: '🏷️', category: 'autocritica', situations: ['baixa autoestima'] },
  { id: 'culpacao', toxic: 'É tudo culpa minha.', reframed: 'Sou responsável pelo que depende de mim, não por tudo.', emoji: '🎯', category: 'culpa', situations: ['conflitos'] },
  { id: 'deveria', toxic: 'Eu deveria ser mais forte.', reframed: 'Estou fazendo o melhor possível com os recursos que tenho hoje.', emoji: '📋', category: 'autocritica', situations: ['cansaço'] },
  { id: 'emocional', toxic: 'Sinto que sou incapaz, então sou.', reframed: 'Sentimentos são dados, não sentença final.', emoji: '💔', category: 'catastrofizacao', situations: ['ansiedade'] },
  { id: 'comparar', toxic: 'Todo mundo é mais feliz que eu.', reframed: 'Comparação distorce a realidade. Meu ritmo é único.', emoji: '👥', category: 'comparacao', situations: ['redes sociais'] },
  { id: 'rejeicao', toxic: 'Se demorou pra responder, é porque não gosta de mim.', reframed: 'Há várias explicações possíveis além de rejeição.', emoji: '📵', category: 'relacionamentos', situations: ['mensagens'] },
  { id: 'impostor', toxic: 'Só consegui porque tive sorte.', reframed: 'Meu esforço e competência também contribuíram.', emoji: '🎭', category: 'trabalho', situations: ['trabalho', 'estudo'] },
  { id: 'desqualificar', toxic: 'Esse elogio não vale nada.', reframed: 'Posso receber reconhecimento sem me diminuir.', emoji: '🧯', category: 'autocritica', situations: ['elogios'] },
  { id: 'futuro-negativo', toxic: 'Nada vai melhorar.', reframed: 'Ainda não está como eu quero, mas posso construir mudança em etapas.', emoji: '🌧️', category: 'catastrofizacao', situations: ['desânimo'] },
  { id: 'controle', toxic: 'Se eu não controlar tudo, vai dar ruim.', reframed: 'Posso focar no que está ao meu alcance e soltar o resto.', emoji: '🕹️', category: 'perfeccionismo', situations: ['trabalho'] },
  { id: 'desvalorizar-needs', toxic: 'Eu não devia precisar de ajuda.', reframed: 'Pedir ajuda é maturidade emocional, não fraqueza.', emoji: '🆘', category: 'autocritica', situations: ['sobrecarga'] },
  { id: 'ciume', toxic: 'Se sente bem sem mim, então não me ama.', reframed: 'Amor saudável inclui autonomia e confiança.', emoji: '💞', category: 'relacionamentos', situations: ['ciúme'] },
  { id: 'atraso', toxic: 'Estou atrasado, sou incompetente.', reframed: 'Atraso pontual não define minha capacidade. Vou reorganizar prioridades.', emoji: '⏱️', category: 'trabalho', situations: ['prazos'] },
  { id: 'corpo', toxic: 'Meu corpo é horrível.', reframed: 'Meu corpo merece respeito e cuidado, não ataque.', emoji: '🪞', category: 'comparacao', situations: ['imagem corporal'] },
  { id: 'conflito', toxic: 'Se discordamos, o relacionamento acabou.', reframed: 'Conflito pode ser ponte de ajuste, não sentença de fim.', emoji: '🧩', category: 'relacionamentos', situations: ['discussão'] },
  { id: 'culpa-filial', toxic: 'Se eu colocar limite, vou decepcionar minha família.', reframed: 'Limite não é abandono. Posso cuidar da relação sem me abandonar.', emoji: '🏠', category: 'culpa', situations: ['família', 'culpa'] },
  { id: 'agradar-todos', toxic: 'Se alguém ficou chateado, eu fiz algo errado.', reframed: 'Nem todo desconforto do outro significa erro meu.', emoji: '🫥', category: 'culpa', situations: ['família', 'conflitos'] },
  { id: 'nao-incomodar', toxic: 'Eu não posso incomodar ninguém com o que sinto.', reframed: 'Expressar necessidade com respeito não é peso, é vínculo saudável.', emoji: '🤐', category: 'culpa', situations: ['infância', 'sobrecarga'] },
  { id: 'controle-casal', toxic: 'Se eu não vigiar tudo, vou ser enganado.', reframed: 'Controle não cria segurança. Clareza e limite criam.', emoji: '🧷', category: 'relacionamentos', situations: ['ciúme', 'relacionamento'] },
  { id: 'sumico', toxic: 'Se sumiu por algumas horas, já perdeu o interesse.', reframed: 'Ausência pontual não confirma abandono. Vou buscar fatos antes de concluir.', emoji: '📭', category: 'relacionamentos', situations: ['mensagens', 'ansiedade'] },
  { id: 'feedback', toxic: 'Recebi crítica, então não sou bom no que faço.', reframed: 'Feedback aponta ajuste, não apaga competência.', emoji: '🛠️', category: 'trabalho', situations: ['trabalho', 'feedback'] },
  { id: 'produtividade', toxic: 'Se eu descansar, vou ficar para trás.', reframed: 'Descanso faz parte da consistência. Exaustão não melhora desempenho.', emoji: '🧱', category: 'trabalho', situations: ['cansaço', 'produtividade'] },
  { id: 'erro-exposto', toxic: 'Se eu errar em público, ninguém mais vai me respeitar.', reframed: 'Erro visível pode gerar ajuste e aprendizado, não destruição da minha imagem.', emoji: '🎙️', category: 'trabalho', situations: ['trabalho', 'exposição'] },
  { id: 'preciso-ser-perfeito', toxic: 'Só mereço carinho se eu for impecável.', reframed: 'Afeto saudável não exige perfeição para existir.', emoji: '🧸', category: 'perfeccionismo', situations: ['infância', 'relacionamento'] },
  { id: 'nao-bastar', toxic: 'Do jeito que eu sou, nunca vai ser suficiente.', reframed: 'Posso crescer sem transformar minha existência em dívida permanente.', emoji: '🫀', category: 'autocritica', situations: ['baixa autoestima', 'autocrítica'] },
  { id: 'comparacao-irmaos', toxic: 'Os outros da minha idade já deveriam estar muito à frente.', reframed: 'Comparar trajetórias diferentes não me orienta, só me esgota.', emoji: '🛤️', category: 'comparacao', situations: ['comparação', 'família'] },
  { id: 'fracasso-infantil', toxic: 'Se eu falho, deixo de ser digno de amor.', reframed: 'Falha não altera meu valor. Eu continuo digno mesmo quando erro.', emoji: '🪁', category: 'catastrofizacao', situations: ['infância', 'erro'] },
];

const catLabel: Record<Cat, string> = {
  autocritica: 'Autocrítica', comparacao: 'Comparação', perfeccionismo: 'Perfeccionismo', culpa: 'Culpa/Vergonha', catastrofizacao: 'Catastrofização', relacionamentos: 'Relacionamentos', trabalho: 'Trabalho/Estudo'
};

const catThemes: Record<Cat, { bg: string, text: string, shadow: string, border: string }> = {
  autocritica: { bg: 'bg-violet-600', text: 'text-white', shadow: 'shadow-violet-500/30', border: 'border-violet-400/30' },
  comparacao: { bg: 'bg-indigo-600', text: 'text-white', shadow: 'shadow-indigo-500/30', border: 'border-indigo-400/30' },
  perfeccionismo: { bg: 'bg-cyan-600', text: 'text-white', shadow: 'shadow-cyan-500/30', border: 'border-cyan-400/30' },
  culpa: { bg: 'bg-slate-700', text: 'text-white', shadow: 'shadow-slate-500/30', border: 'border-slate-400/30' },
  catastrofizacao: { bg: 'bg-rose-600', text: 'text-white', shadow: 'shadow-rose-500/30', border: 'border-rose-400/30' },
  relacionamentos: { bg: 'bg-pink-600', text: 'text-white', shadow: 'shadow-pink-500/30', border: 'border-pink-400/30' },
  trabalho: { bg: 'bg-amber-600', text: 'text-white', shadow: 'shadow-amber-500/30', border: 'border-amber-400/30' },
};

const sitColors = [
  'bg-emerald-600 shadow-emerald-500/30',
  'bg-teal-600 shadow-teal-500/30',
  'bg-sky-600 shadow-sky-500/30',
  'bg-blue-600 shadow-blue-500/30',
  'bg-violet-600 shadow-violet-500/30',
  'bg-fuchsia-600 shadow-fuchsia-500/30',
];

const emergencyReframes = [
  'Isso é difícil, mas passageiro. Eu posso atravessar este momento.',
  'Nem todo pensamento merece ser acreditado agora.',
  'Respira: meu valor não depende deste erro.',
  'Posso pausar antes de reagir. Segurança primeiro.',
  'Eu não preciso resolver tudo hoje.',
  'Estou em sobrecarga, não em fracasso.',
  'Uma micro-ação já é progresso real.',
  'Eu posso pedir apoio sem culpa.',
  'Meu corpo está em alerta, não em perigo real agora.',
  'Passo a passo: água, respiração, pausa, próxima ação simples.'
];

const contextLabel: Record<ContextGroup, string> = {
  relacionamento: 'Relacionamento',
  familia: 'Família',
  trabalho: 'Trabalho',
  infancia: 'Infância',
  autocritica: 'Autocrítica',
};

const contextTone: Record<ContextGroup, string> = {
  relacionamento: 'bg-pink-600 shadow-pink-500/30',
  familia: 'bg-fuchsia-600 shadow-fuchsia-500/30',
  trabalho: 'bg-amber-600 shadow-amber-500/30',
  infancia: 'bg-cyan-600 shadow-cyan-500/30',
  autocritica: 'bg-violet-600 shadow-violet-500/30',
};

const categoryContextMap: Record<Cat, ContextGroup> = {
  relacionamentos: 'relacionamento',
  trabalho: 'trabalho',
  autocritica: 'autocritica',
  comparacao: 'autocritica',
  perfeccionismo: 'autocritica',
  culpa: 'familia',
  catastrofizacao: 'infancia',
};

const whyByCategory: Record<Cat, string> = {
  autocritica: 'Porque transforma dificuldade em ataque pessoal e reduz sua margem de recuperação.',
  comparacao: 'Porque compara uma parte sua com uma versão editada do outro e distorce a realidade.',
  perfeccionismo: 'Porque cria uma regra impossível e faz qualquer esforço parecer insuficiente.',
  culpa: 'Porque amplia sua responsabilidade além do que realmente depende de você.',
  catastrofizacao: 'Porque trata risco, desconforto ou medo como certeza de desastre.',
  relacionamentos: 'Porque conclui rejeição, abandono ou desamor sem evidência suficiente.',
  trabalho: 'Porque confunde erro, prazo ou pressão com incapacidade pessoal.',
};

const assertiveByCategory: Record<Cat, string> = {
  autocritica: 'Vou me corrigir sem me humilhar.',
  comparacao: 'Não preciso me medir assim para continuar cuidando do meu caminho.',
  perfeccionismo: 'Bom o suficiente já permite começar e ajustar depois.',
  culpa: 'Eu respondo pelo que é meu, não por tudo.',
  catastrofizacao: 'Vou checar fatos antes de acreditar no pior cenário.',
  relacionamentos: 'Preciso de fatos e conversa clara antes de concluir rejeição.',
  trabalho: 'Posso reorganizar, pedir clareza e corrigir em partes.',
};

const boundaryByCategory: Record<Cat, string> = {
  autocritica: 'Interromper a repetição mental quando ela vira ataque.',
  comparacao: 'Reduzir exposição a gatilhos de comparação quando necessário.',
  perfeccionismo: 'Definir um critério realista de entrega.',
  culpa: 'Separar o que é cuidado do que é excesso de responsabilidade.',
  catastrofizacao: 'Adiar decisões até o corpo sair do pico de alerta.',
  relacionamentos: 'Pedir clareza ou espaço em vez de preencher o vazio com suposições.',
  trabalho: 'Quebrar a demanda em etapas e não resolver tudo no impulso.',
};

const selfTalkByCategory: Record<Cat, string> = {
  autocritica: 'Eu posso me tratar com firmeza e respeito ao mesmo tempo.',
  comparacao: 'Meu processo não precisa copiar o ritmo de ninguém.',
  perfeccionismo: 'Imperfeito não significa inválido.',
  culpa: 'Eu posso reparar sem me condenar inteiro.',
  catastrofizacao: 'Medo alto não é previsão confiável.',
  relacionamentos: 'Sentir insegurança não me obriga a concluir abandono.',
  trabalho: 'Pressão não define meu valor.',
};

export default function ToxicThoughtsSection({ darkMode: dm, onNavigate }: Props) {
  const [custom, setCustom] = useLocalStorage<Pattern[]>('psico_toxic_custom', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('psico_toxic_favorites', []);
  const [history, setHistory] = useLocalStorage<PersonalHistoryItem[]>('psico_toxic_history', []);
  const [step, setStep] = useState<'list' | 'add' | 'trainer' | 'emergency'>('list');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Cat | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [context, setContext] = useState<ContextGroup | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [edit, setEdit] = useState<{ toxic: string; reframed: string; category: Cat }>({ toxic: '', reframed: '', category: 'autocritica' });

  const [trainRelief, setTrainRelief] = useState(4);
  const [trainChoice, setTrainChoice] = useState<string>('');
  const [trainRoundIndex, setTrainRoundIndex] = useLocalStorage<number>('psico_toxic_train_round_index', 0);
  const [trainSeed, setTrainSeed] = useLocalStorage<number>('psico_toxic_train_seed', 0);
  const [trainScore, setTrainScore] = useLocalStorage<{ hits: number; attempts: number; streak: number }>('psico_toxic_train_score', { hits: 0, attempts: 0, streak: 0 });
  const [bestTrain, setBestTrain] = useLocalStorage<{ hits: number; attempts: number; streak: number }>('psico_toxic_train_best', { hits: 0, attempts: 0, streak: 0 });
  const [trainCompleted, setTrainCompleted] = useLocalStorage<TrainCompletedRound[]>('psico_toxic_train_completed', []);

  const catScrollRef = useRef<HTMLDivElement>(null);
  const sitScrollRef = useRef<HTMLDivElement>(null);
  const contextScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 240;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const c = (l: string, d: string) => (dm ? d : l);

  const all = useMemo(() => [...toxicPatterns, ...custom], [custom]);

  const allSituations = useMemo(() => Array.from(new Set(all.flatMap((p) => p.situations))).slice(0, 20), [all]);

  const filtered = useMemo(() => {
    return all.filter((p) => {
      const byQ = !q || p.toxic.toLowerCase().includes(q.toLowerCase()) || p.reframed.toLowerCase().includes(q.toLowerCase());
      const byCat = !cat || p.category === cat;
      const byFav = !showFavoritesOnly || favorites.includes(p.id);
      const byContext = !context || categoryContextMap[p.category] === context;
      const bySit = !situation || p.situations.includes(situation);
      return byQ && byCat && byFav && byContext && bySit;
    });
  }, [all, q, cat, showFavoritesOnly, favorites, context, situation]);

  const groupedByContext = useMemo(() => {
    return (Object.keys(contextLabel) as ContextGroup[]).map((group) => ({
      group,
      items: filtered.filter((item) => categoryContextMap[item.category] === group),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  const add = () => {
    if (!edit.toxic.trim() || !edit.reframed.trim()) return;
    setCustom([...custom, {
      id: crypto.randomUUID(),
      toxic: edit.toxic.trim(),
      reframed: edit.reframed.trim(),
      emoji: '💭',
      category: edit.category,
      situations: ['personalizado']
    }]);
    setEdit({ toxic: '', reframed: '', category: 'autocritica' });
    setStep('list');
  };

  const toggleFav = (id: string) => setFavorites(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]);
  const remove = (id: string) => setCustom(custom.filter((cst) => cst.id !== id));

  const copyReframed = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const saveToHistory = (pattern: Pattern) => {
    setHistory((prev) => [
      { id: crypto.randomUUID(), patternId: pattern.id, toxic: pattern.toxic, createdAt: new Date().toISOString() },
      ...prev,
    ].slice(0, 20));
  };

  const recentHistory = useMemo(() => history.slice(0, 5), [history]);
  const favoritePatterns = useMemo(() => all.filter((item) => favorites.includes(item.id)), [all, favorites]);
  const trainRounds = useMemo(() => {
    const pool = [...all];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(((i + 1) * 97 + trainSeed * 31) % (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const expanded: Pattern[] = [];
    let cycle = 0;
    while (expanded.length < 50) {
      const cycled = [...pool].sort((a, b) => `${a.id}-${cycle}`.localeCompare(`${b.id}-${cycle}`));
      expanded.push(...cycled);
      cycle += 1;
    }
    return expanded.slice(0, 50);
  }, [all, trainSeed]);
  const trainerPattern = trainRounds[trainRoundIndex] || null;
  const trainerSuggestion = trainerPattern?.reframed || 'Uma reformulação possível vai aparecer aqui.';
  const currentCompletedRound = useMemo(() => trainCompleted.find((item) => item.round === trainRoundIndex), [trainCompleted, trainRoundIndex]);
  const trainerOptions = useMemo(() => {
    if (!trainerPattern) return [];
    const categories = (Object.keys(catLabel) as Cat[]).filter((item) => item !== trainerPattern.category);
    const extra = categories.sort((a, b) => `${a}-${trainerPattern.id}`.localeCompare(`${b}-${trainerPattern.id}`)).slice(0, 2);
    return [trainerPattern.category, ...extra].sort((a, b) => `${a}-${trainRoundIndex}`.localeCompare(`${b}-${trainRoundIndex}`));
  }, [trainerPattern, trainRoundIndex]);

  const copyFavoriteResponses = async () => {
    if (favoritePatterns.length === 0) return;
    const payload = [
      'Respostas favoritas',
      '',
      ...favoritePatterns.map((item, index) => (
        `${index + 1}. ${item.toxic}\nResposta: ${item.reframed}\nLimite possível: ${boundaryByCategory[item.category]}`
      )),
    ].join('\n\n');
    try {
      await navigator.clipboard.writeText(payload);
    } catch {}
  };

  const updateBestTrain = (next: { hits: number; attempts: number; streak: number }) => {
    const nextRate = next.attempts > 0 ? next.hits / next.attempts : 0;
    const bestRate = bestTrain.attempts > 0 ? bestTrain.hits / bestTrain.attempts : 0;
    if (next.hits > bestTrain.hits || nextRate > bestRate || next.streak > bestTrain.streak) {
      setBestTrain(next);
    }
  };

  const registerTrainRound = (type: 'toxico' | 'resposta') => {
    if (!trainerPattern) return;
    setTrainChoice(type);
  };

  const answerTrainCategory = (selected: Cat) => {
    if (!trainerPattern) return;
    setTrainChoice('toxico');
    if (currentCompletedRound) return;
    const correct = selected === trainerPattern.category;
    setTrainScore((prev) => {
      const next = {
        hits: prev.hits + (correct ? 1 : 0),
        attempts: prev.attempts + 1,
        streak: correct ? prev.streak + 1 : 0,
      };
      updateBestTrain(next);
      return next;
    });
    setTrainCompleted((prev) => [
      ...prev,
      {
        round: trainRoundIndex,
        patternId: trainerPattern.id,
        toxic: trainerPattern.toxic,
        category: trainerPattern.category,
        reframed: trainerPattern.reframed,
        relief: trainRelief,
        correct,
      },
    ]);
  };

  const nextTrainRound = () => {
    setTrainChoice('');
    setTrainRelief(4);
    if (trainRoundIndex + 1 < trainRounds.length) {
      setTrainRoundIndex(trainRoundIndex + 1);
    } else {
      setTrainRoundIndex(0);
      setTrainSeed((prev) => prev + 1);
    }
  };

  const resetTrainScore = () => {
    setTrainScore({ hits: 0, attempts: 0, streak: 0 });
    setTrainChoice('');
    setTrainRoundIndex(0);
    setTrainCompleted([]);
    setTrainSeed((prev) => prev + 1);
  };

  return (
    <div className={`p-4 pb-28 min-h-screen ${dm ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-lg mx-auto">
        <div className="pt-6 mb-8">
          <SectionHeroCard
            darkMode={dm}
            eyebrow="Reconhecer, diferenciar, responder"
            title="Falas Tóxicas"
            description="Reconheça padrões que machucam, entenda por que eles distorcem a leitura e treine respostas mais firmes e saudáveis."
            icon="⚠️"
          />
        </div>

        <section className={`rounded-[2rem] border p-4 mb-8 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: 'Reconhecer', desc: 'Perceber a fala sem normalizar.' },
              { title: 'Diferenciar', desc: 'Entender por que ela machuca ou distorce.' },
              { title: 'Responder melhor', desc: 'Criar limite, resposta e autocuidado.' },
            ].map((item, idx) => (
              <div key={item.title} className={`rounded-[1.4rem] p-3 border ${idx === 0 ? c('bg-violet-50 border-violet-200', 'bg-violet-500/10 border-violet-500/20') : idx === 1 ? c('bg-sky-50 border-sky-200', 'bg-sky-500/10 border-sky-500/20') : c('bg-emerald-50 border-emerald-200', 'bg-emerald-500/10 border-emerald-500/20')}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em]">{item.title}</p>
                <p className={`mt-2 text-[13px] font-medium leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <nav className={`flex p-1.5 rounded-2xl mb-8 border ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/50 border-slate-700/50')}`}>
          {[
            { id: 'list', label: 'Biblioteca', icon: '📚' },
            { id: 'trainer', label: 'Treino', icon: '🧠' },
            { id: 'emergency', label: 'Emergência', icon: '🚨', danger: true },
            { id: 'add', label: 'Novo', icon: '✨' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 relative ${
                step === tab.id
                  ? tab.danger 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                    : 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : c('text-slate-500 hover:bg-slate-50', 'text-slate-400 hover:bg-slate-800')
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

      {step === 'list' && (
        <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-150">
          <div className={`rounded-3xl p-4 mb-6 shadow-sm border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Buscar pensamento ou solução..." 
                className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm transition-all outline-none focus:ring-2 focus:ring-violet-500/20 ${c('bg-slate-50 border border-slate-100 focus:bg-white', 'bg-slate-900 border border-slate-800 focus:bg-slate-950')}`} 
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Categorias</p>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer(catScrollRef, 'left')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => scrollContainer(catScrollRef, 'right')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            
            <div ref={catScrollRef} className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              <button 
                onClick={() => {
                  setCat(null);
                  setShowFavoritesOnly(false);
                }} 
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${!cat ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 border-violet-400/30' : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}
              >
                Todas
              </button>
              <button
                onClick={() => {
                  setCat(null);
                  setShowFavoritesOnly((prev) => !prev);
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${showFavoritesOnly ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-amber-400/30' : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}
              >
                Favoritos
              </button>
              {(Object.keys(catLabel) as Cat[]).map((k) => (
                <button 
                  key={k} 
                  onClick={() => {
                    setCat(k);
                    setShowFavoritesOnly(false);
                  }} 
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${
                    cat === k 
                      ? `${catThemes[k].bg} ${catThemes[k].text} shadow-lg ${catThemes[k].shadow} ${catThemes[k].border}` 
                      : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')
                  }`}
                >
                  {catLabel[k]}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3 px-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Por Situação</p>
              <div className="flex gap-1">
                <button onClick={() => scrollContainer(sitScrollRef, 'left')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => scrollContainer(sitScrollRef, 'right')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            
            <div ref={sitScrollRef} className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              <button 
                onClick={() => setSituation(null)} 
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${!situation ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-emerald-400/30' : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}
              >
                Qualquer
              </button>
              {allSituations.map((s, idx) => (
                <button 
                  key={s} 
                  onClick={() => setSituation(s)} 
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${
                    situation === s 
                      ? `${sitColors[idx % sitColors.length]} text-white shadow-lg border-white/20` 
                      : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Por Contexto</p>
                <div className="flex gap-1">
                  <button onClick={() => scrollContainer(contextScrollRef, 'left')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => scrollContainer(contextScrollRef, 'right')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
              <div ref={contextScrollRef} className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                  onClick={() => setContext(null)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${!context ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20 border-fuchsia-400/30' : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}
                >
                  Todos
                </button>
                {(Object.keys(contextLabel) as ContextGroup[]).map((group) => (
                  <button
                    key={group}
                    onClick={() => setContext(group)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${context === group ? `${contextTone[group]} text-white shadow-lg border-white/20` : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}
                  >
                    {contextLabel[group]}
                  </button>
                ))}
              </div>
            </div>

          {recentHistory.length > 0 && (
            <div className={`rounded-[2rem] border p-4 mb-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Seu histórico recente</p>
                  <p className="text-sm font-black mt-1">Falas que você marcou ou copiou recentemente</p>
                </div>
              </div>
              <div className="space-y-2">
                {recentHistory.map((item) => (
                  <div key={item.id} className={`rounded-[1.25rem] px-3 py-2.5 border ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                    <p className="text-sm font-bold leading-relaxed">{item.toxic}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {groupedByContext.map(({ group, items }) => (
              <section key={group}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg ${contextTone[group]}`}>
                    {contextLabel[group]}
                  </span>
                  <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${c('text-slate-500', 'text-slate-400')}`}>{items.length} falas</p>
                </div>
                <div className="space-y-4">
                  {items.map((p) => {
                    const expanded = expandedId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`group rounded-[2rem] border transition-all duration-300 overflow-hidden ${c('bg-white border-slate-100 shadow-sm hover:shadow-md', 'bg-slate-800/60 border-slate-700 hover:bg-slate-800/80')}`}
                      >
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 text-xl shadow-inner border border-white/10">{p.emoji || '💭'}</span>
                            <div className="flex-1">
                              <p className={`text-[10px] font-black uppercase tracking-wider ${c('text-indigo-600', 'text-indigo-400')}`}>{catLabel[p.category]}</p>
                              <div className="flex gap-1.5 mt-1 flex-wrap">
                                {p.situations.slice(0, 3).map((s) => (
                                  <span key={s} className="text-[9px] font-bold uppercase opacity-50">#{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className={`p-4 rounded-2xl border ${c('bg-rose-50/50 border-rose-100/50', 'bg-rose-500/5 border-rose-900/30')}`}>
                              <p className={`text-sm font-bold leading-relaxed ${c('text-rose-700', 'text-rose-300')}`}>
                                <span className="inline-block mr-1 opacity-40">❌</span> {p.toxic}
                              </p>
                            </div>
                            <div className={`p-4 rounded-2xl border ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-500/10 border-emerald-900/30')}`}>
                              <p className={`text-sm font-black leading-relaxed ${c('text-emerald-800', 'text-emerald-100')}`}>
                                <span className="inline-block mr-1">✅</span> {p.reframed}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 mt-5">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => toggleFav(p.id)}
                                className={`p-2.5 rounded-xl transition-all ${favorites.includes(p.id) ? 'bg-amber-500 text-white' : c('bg-slate-50 text-slate-400', 'bg-slate-900 text-slate-500')}`}
                              >
                                {favorites.includes(p.id) ? '★' : '☆'}
                              </button>
                              <button
                                onClick={() => {
                                  copyReframed(p.reframed);
                                  saveToHistory(p);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${c('bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95', 'bg-emerald-500 text-slate-900 active:scale-95')}`}
                              >
                                Copiar resposta
                              </button>
                              <button
                                onClick={() => {
                                  setExpandedId(expanded ? null : p.id);
                                  saveToHistory(p);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${c('bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95', 'bg-indigo-500 text-slate-900 active:scale-95')}`}
                              >
                                {expanded ? 'Ocultar análise' : 'Ver resposta prática'}
                              </button>
                            </div>
                            {custom.find((cst) => cst.id === p.id) && (
                              <button
                                onClick={() => remove(p.id)}
                                className={`inline-flex items-center gap-1 p-2.5 rounded-xl transition-all active:scale-95 ${c('bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100', 'bg-rose-950/30 text-rose-300 border border-rose-900/40 hover:bg-rose-900/40')}`}
                                title="Remover fala personalizada"
                              >
                                <span>🗑️</span>
                                <span className="text-[11px] font-black uppercase tracking-[0.14em]">Remover</span>
                              </button>
                            )}
                          </div>

                          {expanded && (
                            <div className={`mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                              <div className={`rounded-[1.4rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Isso é tóxico por quê?</p>
                                <p className="text-sm font-bold mt-2 leading-relaxed">{whyByCategory[p.category]}</p>
                              </div>
                              <div className={`rounded-[1.4rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Resposta assertiva</p>
                                <p className="text-sm font-bold mt-2 leading-relaxed">{assertiveByCategory[p.category]}</p>
                              </div>
                              <div className={`rounded-[1.4rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Limite possível</p>
                                <p className="text-sm font-bold mt-2 leading-relaxed">{boundaryByCategory[p.category]}</p>
                              </div>
                              <div className={`rounded-[1.4rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">O que eu diria a mim mesmo</p>
                                <p className="text-sm font-bold mt-2 leading-relaxed">{selfTalkByCategory[p.category]}</p>
                              </div>
                            </div>
                          )}

                          {expanded && (
                            <div className={`mt-3 rounded-[1.4rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                              <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${c('text-slate-500', 'text-slate-400')}`}>Levar para outra prática</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <button
                                  onClick={() => onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: `${p.toxic}\n\nResposta mais justa: ${p.reframed}`, diaryDraftKey: Date.now() })}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-indigo-50 text-indigo-700 border border-indigo-100', 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20')}`}
                                >
                                  Levar ao diário
                                </button>
                                <button
                                  onClick={() => onNavigate?.('solta', { soltaDraft: `${p.toxic}\n\nResposta mais justa: ${p.reframed}\n\nO que isso desperta em mim: `, soltaDraftKey: Date.now() })}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100', 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20')}`}
                                >
                                  Soltar daqui
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {groupedByContext.length === 0 && (
              <div className="py-12 text-center opacity-60">
                <p className="text-4xl mb-3">🎐</p>
                <p className="text-sm font-medium">Nenhum pensamento encontrado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'trainer' && (
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className={`rounded-[2.5rem] p-7 border shadow-sm ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🧠</span>
              <h3 className="text-xl font-black">Treino de reconhecimento e resposta</h3>
            </div>
            
            <div className="space-y-6">
              <div className={`rounded-[1.6rem] border p-4 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Como funciona</p>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { title: '1. Escreva', desc: 'Coloque a frase do jeito que veio.' },
                    { title: '2. Identifique', desc: 'Veja se existe um padrão tóxico.' },
                    { title: '3. Reescreva', desc: 'Treine uma resposta mais justa.' },
                  ].map((item, idx) => (
                    <div key={item.title} className={`rounded-[1.2rem] border p-3 ${idx === 0 ? c('bg-violet-50 border-violet-200', 'bg-violet-500/10 border-violet-500/20') : idx === 1 ? c('bg-sky-50 border-sky-200', 'bg-sky-500/10 border-sky-500/20') : c('bg-emerald-50 border-emerald-200', 'bg-emerald-500/10 border-emerald-500/20')}`}>
                      <p className="text-[11px] font-black">{item.title}</p>
                      <p className={`mt-1 text-[12px] leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-[1.4rem] border p-3 ${c('bg-violet-50 border-violet-200', 'bg-violet-500/10 border-violet-500/20')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Pontuação</p>
                  <p className="mt-2 text-lg font-black">{trainScore.hits}/{trainScore.attempts || 0}</p>
                </div>
                <div className={`rounded-[1.4rem] border p-3 ${c('bg-emerald-50 border-emerald-200', 'bg-emerald-500/10 border-emerald-500/20')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Aproveitamento</p>
                  <p className="mt-2 text-lg font-black">
                    {trainScore.attempts > 0 ? `${Math.round((trainScore.hits / trainScore.attempts) * 100)}%` : '0%'}
                  </p>
                </div>
                <div className={`rounded-[1.4rem] border p-3 ${c('bg-amber-50 border-amber-200', 'bg-amber-500/10 border-amber-500/20')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Sequência</p>
                  <p className="mt-2 text-lg font-black">{trainScore.streak}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-[1.4rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Melhor resultado</p>
                  <p className="mt-2 text-lg font-black">{bestTrain.hits}/{bestTrain.attempts || 0}</p>
                </div>
                <div className={`rounded-[1.4rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Melhor sequência</p>
                  <p className="mt-2 text-lg font-black">{bestTrain.streak}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-[1.4rem] border p-3 ${c('bg-sky-50 border-sky-200', 'bg-sky-500/10 border-sky-500/20')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Sessão atual</p>
                  <p className="mt-2 text-lg font-black">{trainCompleted.length}/50 concluídas</p>
                </div>
                <div className={`rounded-[1.4rem] border p-3 ${c('bg-amber-50 border-amber-200', 'bg-amber-500/10 border-amber-500/20')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Favoritas</p>
                  <p className="mt-2 text-lg font-black">{favoritePatterns.length} salvas</p>
                  <p className={`mt-1 text-[11px] leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>Elas ficam no bloco “Respostas favoritas” da biblioteca.</p>
                </div>
              </div>

              <div className={`rounded-[1.8rem] border p-5 ${c('bg-rose-50/50 border-rose-100', 'bg-rose-500/5 border-rose-900/30')}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Rodada {Math.min(trainRoundIndex + 1, trainRounds.length)}/{trainRounds.length}</p>
                <p className="mt-3 text-base font-black leading-relaxed">
                  {trainerPattern?.toxic || 'Carregando fala...'}
                </p>
              </div>

              <div>
                <p className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1 opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>1. Qual padrão aparece aqui?</p>
                <div className="grid grid-cols-1 gap-3">
                  {trainerOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => answerTrainCategory(option)}
                      className={`rounded-2xl border p-4 text-left transition-all ${trainerPattern?.category === option && trainChoice === 'toxico' ? 'bg-rose-600 text-white border-rose-500' : c('bg-slate-50 border-slate-100 hover:bg-slate-100', 'bg-slate-900 border-slate-700 hover:bg-slate-800')}`}
                    >
                      <p className="text-sm font-black">{catLabel[option]}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-5 rounded-[1.8rem] border animate-in zoom-in duration-500 ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-500/10 border-emerald-900/30')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">💡</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Sugestão de Solução</p>
                </div>
                <p className={`text-sm font-bold leading-relaxed ${c('text-emerald-900', 'text-emerald-100')}`}>
                  {trainerSuggestion || 'Escreva seu pensamento para gerar uma sugestão clínica.'}
                </p>
              </div>

              {trainerPattern && (
                <div className={`rounded-[1.5rem] border p-4 ${c('bg-indigo-50 border-indigo-200', 'bg-indigo-500/10 border-indigo-500/20')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">Padrão reconhecido</p>
                  <p className="mt-2 text-sm font-bold">
                    Isso se aproxima de <span className="text-indigo-600 dark:text-indigo-300">{catLabel[trainerPattern.category].toLowerCase()}</span>.
                  </p>
                </div>
              )}

              {trainerPattern && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => registerTrainRound('toxico')}
                    className={`rounded-2xl border p-4 text-left transition-all ${trainChoice === 'toxico' ? 'bg-rose-600 text-white border-rose-500' : c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em]">Identificar</p>
                    <p className="mt-2 text-sm font-bold">Confirmar o padrão tóxico</p>
                    <p className="mt-1 text-[12px] leading-relaxed opacity-80">Veja o nome do padrão e por que ele distorce a situação.</p>
                  </button>
                  <button
                    onClick={() => registerTrainRound('resposta')}
                    className={`rounded-2xl border p-4 text-left transition-all ${trainChoice === 'resposta' ? 'bg-emerald-600 text-white border-emerald-500' : c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em]">Responder</p>
                    <p className="mt-2 text-sm font-bold">Treinar uma resposta mais justa</p>
                    <p className="mt-1 text-[12px] leading-relaxed opacity-80">Receba uma reformulação mais firme e utilizável.</p>
                  </button>
                </div>
              )}

              {trainChoice && trainerPattern && (
                <div className={`rounded-[1.8rem] border p-4 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">{trainChoice === 'toxico' ? 'Leitura do treino' : 'Resposta do treino'}</p>
                  <p className="mt-2 text-sm font-bold leading-relaxed">
                    {trainChoice === 'toxico'
                      ? `Sim. O padrão aqui é ${catLabel[trainerPattern.category].toLowerCase()} e ele distorce a leitura da situação.`
                      : trainerPattern.reframed}
                  </p>
                </div>
              )}

              {trainChoice === 'resposta' && trainerPattern && (
                <>
                  <div className={`p-4 rounded-3xl ${c('bg-slate-50', 'bg-slate-900')}`}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2 opacity-60">2. Quanto essa reformulação ajuda agora?</p>
                    <input type="range" min={0} max={10} value={trainRelief} onChange={(e) => setTrainRelief(Number(e.target.value))} className="w-full accent-emerald-500" />
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <p className={`text-[12px] font-medium ${c('text-slate-500', 'text-slate-400')}`}>0 = ainda pesa muito</p>
                      <p className="text-lg font-black">{trainRelief}/10</p>
                      <p className={`text-[12px] font-medium text-right ${c('text-slate-500', 'text-slate-400')}`}>10 = já abriu espaço</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => toggleFav(trainerPattern.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${favorites.includes(trainerPattern.id) ? 'bg-amber-500 text-white border-amber-400' : c('bg-amber-50 border-amber-200 text-amber-900', 'bg-amber-500/10 border-amber-500/20 text-amber-100')}`}
                    >
                      <p className="text-sm font-black">{favorites.includes(trainerPattern.id) ? 'Resposta salva nas favoritas' : 'Salvar esta resposta nas favoritas'}</p>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: `${trainerPattern.toxic}\n\nResposta mais justa: ${trainerPattern.reframed}`, diaryDraftKey: Date.now() })}
                        className={`rounded-2xl border p-4 text-left transition-all ${c('bg-violet-50 border-violet-200 text-violet-900', 'bg-violet-500/10 border-violet-500/20 text-violet-100')}`}
                      >
                        <p className="text-sm font-black">Levar para Diário</p>
                      </button>
                      <button
                        onClick={() => onNavigate?.('solta', { soltaDraft: `${trainerPattern.toxic}\n\nO que isso tocou em mim: `, soltaDraftKey: Date.now() })}
                        className={`rounded-2xl border p-4 text-left transition-all ${c('bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900', 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-100')}`}
                      >
                        <p className="text-sm font-black">Levar para Solta aqui</p>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {trainCompleted.length > 0 && (
                <div className={`rounded-[1.8rem] border p-4 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">Rodadas concluídas</p>
                      <p className="text-sm font-bold mt-1">Toque para voltar exatamente onde já concluiu.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {trainCompleted.map((item) => (
                      <button
                        key={`${item.round}-${item.patternId}`}
                        onClick={() => {
                          setTrainRoundIndex(item.round);
                          setTrainChoice('resposta');
                          setTrainRelief(item.relief);
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border ${item.correct ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'}`}
                      >
                        Rodada {item.round + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <button
                  onClick={resetTrainScore}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-100')}`}
                >
                  Reiniciar pontuação
                </button>
                <button
                  onClick={nextTrainRound}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${c('bg-emerald-600 text-white shadow-lg shadow-emerald-500/20', 'bg-emerald-500 text-slate-950')}`}
                >
                  Próxima rodada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'emergency' && (
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className={`rounded-[2.5rem] p-7 border shadow-lg ${c('bg-rose-50 border-rose-100', 'bg-rose-950/40 border-rose-900/50')}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl shake-animation">🚨</span>
              <h3 className="text-xl font-black text-rose-800 dark:text-rose-100">Modo Emergência</h3>
            </div>
            <p className="text-xs font-medium mb-6 opacity-80 text-rose-700 dark:text-rose-200">Frases rápidas para acalmar a mente em situações de crise.</p>
            
            <div className="space-y-3">
              {emergencyReframes.map((frase, idx) => (
                <button
                  key={idx}
                  onClick={() => copyReframed(frase)}
                  className={`w-full text-left p-5 rounded-3xl text-sm font-black transition-all active:scale-[0.98] border shadow-sm ${c('bg-white border-rose-100 text-rose-900 hover:bg-rose-100', 'bg-slate-950/40 border-rose-800/40 text-rose-100 hover:bg-rose-900/30')}`}
                >
                  <span className="mr-2 opacity-40">⚡</span> {frase}
                </button>
              ))}
            </div>

            <div className={`mt-6 p-4 rounded-2xl text-[10px] font-bold leading-relaxed border ${c('bg-white/60 border-rose-200 text-rose-800 shadow-inner', 'bg-black/20 border-rose-800/40 text-rose-200')}`}>
              <p className="uppercase tracking-[0.1em] mb-1.5 opacity-60">Protocolo sugerido:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>1. Copie uma frase</span>
                <span>2. Respire 4x</span>
                <span>3. Beba água</span>
                <span>4. Uma micro-ação</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'add' && (
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className={`rounded-[2.5rem] p-7 border shadow-sm ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">✨</span>
              <h3 className="text-xl font-black">Adicionar Personalizado</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1 opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Pensamento Automático</label>
                <textarea 
                  value={edit.toxic} 
                  onChange={(e) => setEdit({ ...edit, toxic: e.target.value })} 
                  placeholder="O que sua mente está dizendo?" 
                  className={`w-full min-h-[90px] p-4 rounded-2xl border text-sm transition-all outline-none focus:ring-2 focus:ring-violet-500/20 ${c('bg-slate-50 border-slate-100 focus:bg-white', 'bg-slate-900 border border-slate-700 focus:bg-slate-950')}`} 
                />
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1 opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Reformulação Saudável</label>
                <textarea 
                  value={edit.reframed} 
                  onChange={(e) => setEdit({ ...edit, reframed: e.target.value })} 
                  placeholder="Como um mentor diria isso?" 
                  className={`w-full min-h-[90px] p-4 rounded-2xl border text-sm transition-all outline-none focus:ring-2 focus:ring-violet-500/20 ${c('bg-slate-50 border-slate-100 focus:bg-white', 'bg-slate-900 border border-slate-700 focus:bg-slate-950')}`} 
                />
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-1 opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Categoria</label>
                <select 
                  value={edit.category} 
                  onChange={(e) => setEdit({ ...edit, category: e.target.value as Cat })} 
                  className={`w-full p-4 rounded-2xl text-sm outline-none appearance-none transition-all ${c('bg-slate-50 border border-slate-100 focus:bg-white', 'bg-slate-900 border border-slate-700 focus:bg-slate-950')}`}
                >
                  {(Object.keys(catLabel) as Cat[]).map((k) => <option key={k} value={k}>{catLabel[k]}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button 
                  onClick={() => setStep('list')} 
                  className={`py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200 hover:bg-slate-600')}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={add} 
                  className="py-4 rounded-2xl bg-emerald-600 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 hover:bg-emerald-500 transition-all font-bold"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
