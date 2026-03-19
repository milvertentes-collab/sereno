'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SectionHeroCard from './SectionHeroCard';

interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: 'diary' | 'breathing' | 'missions' | 'toxicthoughts', params?: Record<string, any>) => void;
}

type PatternId =
  | 'perfeccionismo'
  | 'medo_de_errar'
  | 'medo_de_se_expor'
  | 'baixa_autoestima'
  | 'aprovacao'
  | 'procrastinacao'
  | 'autocritica'
  | 'controle'
  | 'evitacao_emocional'
  | 'ruminacao'
  | 'culpa'
  | 'medo_de_decepcionar';

type MomentOption = {
  id: string;
  label: string;
  pattern: PatternId;
  prompt: string;
};

type UnlockRecord = {
  id: string;
  createdAt: string;
  pattern: PatternId;
  moment: string;
  trigger: string;
  note: string;
  microStep: string;
};

const patterns: Array<{
  id: PatternId;
  title: string;
  icon: string;
  clue: string;
  thought: string;
  behavior: string;
  consequence: string;
  unlock: string;
  reframe: string;
  microStep: string;
  nextTab?: 'diary' | 'breathing' | 'missions' | 'toxicthoughts';
  params?: Record<string, any>;
}> = [
  {
    id: 'perfeccionismo',
    title: 'Perfeccionismo',
    icon: '🎯',
    clue: 'Você sente que precisa fazer perfeito ou nem vale começar.',
    thought: 'Se eu não fizer muito bem, vai dar errado.',
    behavior: 'Adia, revisa demais ou trava no início.',
    consequence: 'Cansaço, culpa e sensação de que nunca sai do lugar.',
    unlock: 'Faça a versão possível, não a versão ideal.',
    reframe: 'Terminar o possível hoje vale mais do que imaginar o perfeito.',
    microStep: 'Escolha a versão 60% pronta e entregue só esse pedaço.',
    nextTab: 'missions',
  },
  {
    id: 'medo_de_errar',
    title: 'Medo de errar',
    icon: '⚠️',
    clue: 'Você evita agir para não lidar com a chance de falha.',
    thought: 'Se eu errar, isso vai provar algo ruim sobre mim.',
    behavior: 'Evita testar, começa tarde ou pede garantias demais.',
    consequence: 'Menos experiência, mais insegurança e mais medo depois.',
    unlock: 'Troque acertar por testar com segurança.',
    reframe: 'Errar numa tentativa não define seu valor.',
    microStep: 'Faça um teste pequeno que você consiga revisar depois.',
    nextTab: 'toxicthoughts',
  },
  {
    id: 'medo_de_se_expor',
    title: 'Medo de se expor',
    icon: '🫥',
    clue: 'Você evita aparecer, opinar ou mostrar o que fez.',
    thought: 'Se eu me mostrar, vão me julgar.',
    behavior: 'Esconde, adia envio ou se diminui antes de tentar.',
    consequence: 'Menos espaço para você e mais reforço do medo.',
    unlock: 'Se mostre em uma versão pequena, não máxima.',
    reframe: 'Você não precisa se expor do maior jeito possível para existir.',
    microStep: 'Compartilhe uma versão curta, privada ou com alguém seguro.',
    nextTab: 'diary',
    params: { diaryMode: 'quick' },
  },
  {
    id: 'baixa_autoestima',
    title: 'Baixa autoestima',
    icon: '🪞',
    clue: 'Você sente que não é capaz o bastante para tentar.',
    thought: 'Talvez eu nem consiga, então é melhor nem começar.',
    behavior: 'Desiste cedo, se critica demais ou entrega menos do que pode.',
    consequence: 'Menos confiança e mais provas internas contra si.',
    unlock: 'Você não precisa se sentir pronta para agir.',
    reframe: 'Competência cresce mais pela prática do que pela certeza.',
    microStep: 'Dê um passo que caiba no seu nível de energia de agora.',
    nextTab: 'diary',
    params: { diaryMode: 'quick' },
  },
  {
    id: 'aprovacao',
    title: 'Necessidade de aprovação',
    icon: '🤝',
    clue: 'Você só consegue avançar quando imagina aceitação do outro.',
    thought: 'Se não gostarem, talvez eu esteja errada.',
    behavior: 'Pede validação demais, muda sua vontade ou se cala.',
    consequence: 'Perde clareza sobre o que quer e se abandona mais.',
    unlock: 'Pergunte o que você quer antes de pensar na reação do outro.',
    reframe: 'A reação do outro não é o único critério para a sua escolha.',
    microStep: 'Escreva sua decisão em uma frase antes de pedir opinião.',
    nextTab: 'diary',
    params: { diaryMode: 'quick' },
  },
  {
    id: 'procrastinacao',
    title: 'Procrastinação',
    icon: '⏳',
    clue: 'Você adia até a tarefa virar peso ou urgência.',
    thought: 'Depois eu faço melhor, com mais energia.',
    behavior: 'Empurra, distrai ou espera o momento perfeito.',
    consequence: 'Acúmulo, tensão e mais resistência para começar.',
    unlock: 'Faça 5 minutos agora e deixe o resto para depois.',
    reframe: 'Começar pequeno reduz o peso da tarefa inteira.',
    microStep: 'Abra a tarefa e faça só a primeira ação de dois minutos.',
    nextTab: 'missions',
  },
  {
    id: 'autocritica',
    title: 'Autocrítica excessiva',
    icon: '🗣️',
    clue: 'Sua voz interna ficou mais dura do que útil.',
    thought: 'Nada do que eu faço está bom o suficiente.',
    behavior: 'Se corrige o tempo todo, diminui o que fez ou perde energia se atacando.',
    consequence: 'Mais vergonha, menos ação e sensação de incapacidade.',
    unlock: 'Troque ataque por avaliação justa e específica.',
    reframe: 'Você melhora mais quando se orienta do que quando se agride.',
    microStep: 'Escreva uma frase mais objetiva e menos cruel sobre o que precisa ajustar.',
    nextTab: 'toxicthoughts',
  },
  {
    id: 'controle',
    title: 'Necessidade de controle',
    icon: '🧷',
    clue: 'Você só relaxa quando tudo parece previsível.',
    thought: 'Se eu não controlar, algo vai sair do eixo.',
    behavior: 'Tenta prever tudo, revisa demais ou demora a agir esperando certeza.',
    consequence: 'Mais tensão, menos flexibilidade e exaustão constante.',
    unlock: 'Escolha controlar só o próximo passo, não o cenário inteiro.',
    reframe: 'Segurança suficiente costuma funcionar melhor do que controle total.',
    microStep: 'Defina o que está sob seu controle hoje e solte o resto por agora.',
    nextTab: 'breathing',
  },
  {
    id: 'evitacao_emocional',
    title: 'Evitação emocional',
    icon: '🫣',
    clue: 'Você foge do que sente para não entrar em contato com desconforto.',
    thought: 'Se eu encostar nisso, vai piorar.',
    behavior: 'Distração excessiva, adiamento ou afastamento do que toca a emoção.',
    consequence: 'O alívio é curto e o peso volta depois, às vezes maior.',
    unlock: 'Aproxime-se em dose pequena, sem se forçar além do que dá.',
    reframe: 'Sentir em pequenas doses pode organizar mais do que fugir sempre.',
    microStep: 'Dê nome à emoção em uma frase e observe o corpo por 30 segundos.',
    nextTab: 'diary',
    params: { diaryMode: 'quick' },
  },
  {
    id: 'ruminacao',
    title: 'Ruminação',
    icon: '🔁',
    clue: 'Sua mente fica presa no mesmo assunto sem sair do lugar.',
    thought: 'Se eu pensar mais um pouco, talvez eu resolva tudo agora.',
    behavior: 'Repete cenários, revisita erros e gira em círculos mentalmente.',
    consequence: 'Cansaço mental, paralisia e sensação de sufoco interno.',
    unlock: 'Interrompa o ciclo e volte para uma ação concreta e curta.',
    reframe: 'Pensar sem pausa nem direção não é o mesmo que elaborar.',
    microStep: 'Anote o tema em uma linha e faça uma ação física simples logo depois.',
    nextTab: 'breathing',
  },
  {
    id: 'culpa',
    title: 'Culpa',
    icon: '🪨',
    clue: 'Você se prende ao que fez, deixou de fazer ou acredita que causou.',
    thought: 'Eu devia ter feito melhor e agora não mereço aliviar.',
    behavior: 'Se pune, se retrai ou adia cuidado por achar que precisa pagar antes.',
    consequence: 'Mais peso interno, menos reparação real e menos autocuidado.',
    unlock: 'Troque punição por responsabilidade praticável.',
    reframe: 'Reconhecer um erro não exige abandonar você mesma.',
    microStep: 'Pergunte qual reparo real é possível hoje, em vez de só se culpar.',
    nextTab: 'diary',
    params: { diaryMode: 'quick' },
  },
  {
    id: 'medo_de_decepcionar',
    title: 'Medo de decepcionar',
    icon: '💔',
    clue: 'Você se guia mais pelo impacto no outro do que pelo que consegue sustentar.',
    thought: 'Se eu não corresponder, vou machucar ou perder esse vínculo.',
    behavior: 'Diz sim quando queria dizer não, se sobrecarrega ou evita conversas difíceis.',
    consequence: 'Excesso de peso, ressentimento e menos verdade na relação.',
    unlock: 'Ser honesta com limite não é o mesmo que abandonar alguém.',
    reframe: 'Cuidar do vínculo não precisa significar se apagar.',
    microStep: 'Formule um limite curto e respeitoso antes de conversar.',
    nextTab: 'diary',
    params: { diaryMode: 'quick' },
  },
];

const momentOptions: MomentOption[] = [
  { id: 'nao-comeco', label: 'Não começo', pattern: 'procrastinacao', prompt: 'O que você está adiando neste momento?' },
  { id: 'quero-perfeito', label: 'Quero fazer perfeito', pattern: 'perfeccionismo', prompt: 'O que está ficando grande demais na sua cabeça?' },
  { id: 'medo-julgamento', label: 'Tenho medo do julgamento', pattern: 'medo_de_se_expor', prompt: 'Em que situação você está evitando se mostrar?' },
  { id: 'medo-errar', label: 'Tenho medo de errar', pattern: 'medo_de_errar', prompt: 'O que parece arriscado demais agora?' },
  { id: 'nao-me-sinto-capaz', label: 'Não me sinto capaz', pattern: 'baixa_autoestima', prompt: 'Qual tarefa ficou maior que sua confiança de hoje?' },
  { id: 'preciso-agradar', label: 'Preciso agradar', pattern: 'aprovacao', prompt: 'Onde você está se guiando mais pela reação do outro?' },
  { id: 'estou-me-atacando', label: 'Estou me atacando por dentro', pattern: 'autocritica', prompt: 'Que frase dura sua mente está repetindo agora?' },
  { id: 'quero-controlar-tudo', label: 'Quero controlar tudo', pattern: 'controle', prompt: 'O que está parecendo imprevisível demais neste momento?' },
  { id: 'estou-fugindo-do-que-sinto', label: 'Estou fugindo do que sinto', pattern: 'evitacao_emocional', prompt: 'De qual emoção ou assunto você está se afastando agora?' },
  { id: 'nao-paro-de-pensar', label: 'Não paro de pensar nisso', pattern: 'ruminacao', prompt: 'Qual tema está rodando na sua cabeça sem te levar adiante?' },
  { id: 'estou-presa-na-culpa', label: 'Estou presa na culpa', pattern: 'culpa', prompt: 'O que você sente que devia ter feito diferente?' },
  { id: 'nao-quero-decepcionar', label: 'Não quero decepcionar alguém', pattern: 'medo_de_decepcionar', prompt: 'Quem você teme decepcionar e o que isso está te custando?' },
];

const emptyRecord = {
  moment: momentOptions[0].id,
  trigger: '',
  note: '',
};

export default function SelfSabotageSection({ darkMode: dm, onNavigate }: Props) {
  const [history, setHistory] = useLocalStorage<UnlockRecord[]>('self_sabotage_history_v2', []);
  const [selected, setSelected] = useState<PatternId>('perfeccionismo');
  const [currentMoment, setCurrentMoment] = useState<string>(momentOptions[0].id);
  const [trigger, setTrigger] = useState('');
  const [note, setNote] = useState('');
  const [openedId, setOpenedId] = useState<string | null>(null);

  const c = (l: string, d: string) => (dm ? d : l);
  const active = useMemo(() => patterns.find((item) => item.id === selected) || patterns[0], [selected]);
  const activeMoment = useMemo(() => momentOptions.find((item) => item.id === currentMoment) || momentOptions[0], [currentMoment]);
  const openedRecord = history.find((item) => item.id === openedId) || null;

  useEffect(() => {
    setSelected(activeMoment.pattern);
  }, [activeMoment.pattern]);

  const cycleCards = [
    { label: 'Gatilho', value: trigger.trim() || 'Descreva rapidamente o que está acontecendo agora.' },
    { label: 'Pensamento', value: active.thought },
    { label: 'Comportamento', value: active.behavior },
    { label: 'Consequência', value: active.consequence },
  ];

  const saveReflection = () => {
    const record: UnlockRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      pattern: active.id,
      moment: activeMoment.label,
      trigger: trigger.trim() || activeMoment.prompt,
      note: note.trim() || active.reframe,
      microStep: active.microStep,
    };
    setHistory([record, ...history].slice(0, 20));
    setOpenedId(record.id);
  };

  const loadRecord = (record: UnlockRecord) => {
    setSelected(record.pattern);
    setTrigger(record.trigger);
    setNote(record.note);
    setOpenedId(record.id);
  };

  const clearCurrent = () => {
    setCurrentMoment(emptyRecord.moment);
    setTrigger(emptyRecord.trigger);
    setNote(emptyRecord.note);
    setOpenedId(null);
  };

  const deleteRecord = (id: string) => {
    setHistory(history.filter((item) => item.id !== id));
    if (openedId === id) setOpenedId(null);
  };

  return (
    <div className={`p-4 pb-24 max-w-7xl mx-auto ${dm ? 'text-white' : ''}`}>
      <SectionHeroCard
        darkMode={dm}
        eyebrow="Destravar"
        title="Interromper autossabotagem sem se atacar"
        description="Reconheça o padrão do momento, entenda o ciclo e escolha uma ação pequena que reduza a trava sem virar mais cobrança."
        icon="🪜"
      />

      <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)] mt-6">
        <div className="space-y-6">
          <div className={`rounded-[1.9rem] border p-5 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>O que está acontecendo agora?</p>
            <div className="space-y-3 mt-4">
              {momentOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentMoment(item.id)}
                  className={`w-full text-left rounded-[1.3rem] p-4 border transition-all ${currentMoment === item.id ? 'bg-indigo-600 text-white border-indigo-500' : c('bg-slate-50 border-slate-200 hover:border-indigo-200', 'bg-slate-800 border-slate-700 hover:border-indigo-500/40')}`}
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className={`text-xs mt-1 ${currentMoment === item.id ? 'text-white/75' : c('text-slate-500', 'text-slate-400')}`}>{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-[1.9rem] border p-5 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Padrão principal</p>
            <div className="space-y-3 mt-4">
              {patterns.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                  className={`w-full text-left rounded-[1.3rem] p-4 border transition-all ${selected === item.id ? 'bg-indigo-600 text-white border-indigo-500' : c('bg-slate-50 border-slate-200 hover:border-indigo-200', 'bg-slate-800 border-slate-700 hover:border-indigo-500/40')}`}
                >
                  <p className="text-sm font-black">{item.icon} {item.title}</p>
                  <p className={`text-xs mt-1 ${selected === item.id ? 'text-white/75' : c('text-slate-500', 'text-slate-400')}`}>{item.clue}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-[1.9rem] border p-6 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{active.icon}</span>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Leitura do padrão</p>
                  <h3 className="text-2xl font-black mt-1">{active.title}</h3>
                </div>
              </div>
              <button onClick={clearCurrent} className={`px-4 py-2 rounded-2xl text-xs font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Limpar</button>
            </div>

            <div className={`rounded-[1.4rem] p-5 mt-6 ${c('bg-indigo-50', 'bg-indigo-500/10')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-indigo-700', 'text-indigo-300')}`}>Destravar agora</p>
              <p className="text-sm mt-2 font-bold">{active.unlock}</p>
              <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-300')}`}>{active.reframe}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-5 mt-6">
              {cycleCards.map((item) => (
                <div key={item.label} className={`rounded-[1.4rem] p-5 ${c('bg-slate-50', 'bg-slate-800')}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-400', 'text-slate-500')}`}>{item.label}</p>
                  <p className="text-sm mt-2">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[1.9rem] border p-6 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Personalizar o ciclo</p>

            <div className="grid lg:grid-cols-2 gap-5 mt-5">
              <div>
                <p className={`text-xs font-black ${c('text-slate-500', 'text-slate-400')}`}>{activeMoment.prompt}</p>
                <textarea
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  rows={5}
                  placeholder="Ex.: preciso responder uma mensagem, mas estou enrolando porque quero dizer tudo perfeitamente."
                  className={`w-full mt-3 min-h-[152px] p-5 rounded-[1.4rem] border text-sm leading-7 resize-y ${c('bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400', 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500')}`}
                />
              </div>
              <div>
                <p className={`text-xs font-black ${c('text-slate-500', 'text-slate-400')}`}>Sua nota do momento</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  placeholder="Ex.: eu sei o que preciso fazer, mas estou presa na ideia de que ainda não está bom o bastante."
                  className={`w-full mt-3 min-h-[152px] p-5 rounded-[1.4rem] border text-sm leading-7 resize-y ${c('bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400', 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500')}`}
                />
              </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-4 mt-5">
              <div className={`rounded-[1.3rem] p-5 ${c('bg-sky-50', 'bg-sky-500/10')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-sky-700', 'text-sky-300')}`}>Frase útil</p>
                <p className="text-sm mt-2">{active.reframe}</p>
              </div>
              <div className={`rounded-[1.3rem] p-5 ${c('bg-emerald-50', 'bg-emerald-500/10')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Passo mínimo</p>
                <p className="text-sm mt-2">{active.microStep}</p>
              </div>
              <div className={`rounded-[1.3rem] p-5 ${c('bg-amber-50', 'bg-amber-500/10')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Próximo apoio</p>
                <p className="text-sm mt-2">{active.nextTab === 'diary' ? 'Diário' : active.nextTab === 'missions' ? 'Missões' : active.nextTab === 'toxicthoughts' ? 'Falas tóxicas' : 'Respiração'}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-5">
              <button onClick={saveReflection} className="py-3 rounded-[1.2rem] text-sm font-black bg-sky-600 text-white">Salvar destrave</button>
              <button
                onClick={() => active.nextTab && onNavigate?.(active.nextTab, active.params)}
                className={`py-3 rounded-[1.2rem] text-sm font-black ${c('bg-indigo-50 text-indigo-700', 'bg-indigo-500/10 text-indigo-300')}`}
              >
                Abrir apoio relacionado
              </button>
            </div>
          </div>

          <div className={`rounded-[1.9rem] border p-6 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Últimos registros</p>
              <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{history.length} salvo(s)</span>
            </div>
            <div className="space-y-4 mt-5">
              {history.length === 0 && (
                <div className={`rounded-[1.3rem] p-4 text-sm ${c('bg-slate-50 text-slate-500', 'bg-slate-800 text-slate-400')}`}>
                  Seus registros de autossabotagem aparecem aqui para você perceber repetição, microvitórias e padrões mais frequentes.
                </div>
              )}
              {history.map((item) => (
                <div key={item.id} className={`rounded-[1.4rem] p-5 ${openedId === item.id ? c('bg-indigo-50 ring-2 ring-indigo-100', 'bg-indigo-500/10 ring-2 ring-indigo-500/20') : c('bg-slate-50', 'bg-slate-800')}`}>
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black">{patterns.find((pattern) => pattern.id === item.pattern)?.title}</p>
                      <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{new Date(item.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                      <button onClick={() => loadRecord(item)} className={`px-3 py-2 rounded-2xl text-xs font-black ${c('bg-slate-200 text-slate-800', 'bg-slate-950 text-slate-200')}`}>Abrir</button>
                      <button onClick={() => deleteRecord(item.id)} className="px-3 py-2 rounded-2xl text-xs font-black bg-rose-600 text-white">Excluir</button>
                    </div>
                  </div>
                  <p className={`text-xs mt-3 font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>{item.moment}</p>
                  <p className="text-sm mt-2">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          {openedRecord && (
            <div className={`rounded-[1.9rem] border p-6 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Registro aberto</p>
              <h3 className="text-xl font-black mt-2">{patterns.find((item) => item.id === openedRecord.pattern)?.title}</h3>
              <div className="grid xl:grid-cols-3 gap-4 mt-5">
                <div className={`rounded-[1.3rem] p-5 ${c('bg-slate-50', 'bg-slate-800')}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-400', 'text-slate-500')}`}>Momento</p>
                  <p className="text-sm mt-2">{openedRecord.moment}</p>
                </div>
                <div className={`rounded-[1.3rem] p-5 ${c('bg-slate-50', 'bg-slate-800')}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-400', 'text-slate-500')}`}>Gatilho</p>
                  <p className="text-sm mt-2">{openedRecord.trigger}</p>
                </div>
                <div className={`rounded-[1.3rem] p-5 ${c('bg-emerald-50', 'bg-emerald-500/10')}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Passo salvo</p>
                  <p className="text-sm mt-2">{openedRecord.microStep}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
