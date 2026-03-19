'use client';

import { useMemo, useState } from 'react';
import AppNoticeModal from '@/components/AppNoticeModal';
import SharePlatformModal from '@/components/SharePlatformModal';
import SectionHeroCard from './SectionHeroCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { buildTrackShareText, shareText, type SharePlatform } from '@/lib/share-utils';

interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: any, params?: Record<string, any>) => void;
  isPro?: boolean;
  onShowUpgrade?: () => void;
}

type Step = {
  title: string;
  objective?: string;
  task: string;
  explain?: string;
  example: string;
  time: string;
  closing?: string;
  goTo?: { tab: string; label: string; params?: Record<string, any> };
};

type Track = {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  reward: string;
  steps: Step[];
};

const tracks: Track[] = [
  {
    id: 'ansiedade',
    title: 'Ansiedade',
    emoji: '🌀',
    desc: 'Técnicas práticas para reduzir ansiedade no dia a dia.',
    reward: 'Você fecha essa trilha com um protocolo básico de regulação para momentos de aceleração.',
    steps: [
      { title: 'Mapear gatilhos', objective: 'Entender o que aciona sua ansiedade.', task: 'Anote 2 gatilhos que te ativaram hoje.', explain: 'Antes de tentar controlar a ansiedade, vale reconhecer o que costuma acender esse estado.', example: 'Pressão no trabalho + cobrança interna.', time: '3 min', closing: 'Feche a etapa quando conseguir nomear pelo menos dois gatilhos.', goTo: { tab: 'diary', label: 'Abrir Diário', params: { diaryMode: 'registro' } } },
      { title: 'Desacelerar o corpo', objective: 'Reduzir ativação física.', task: 'Faça uma técnica respiratória guiada agora.', explain: 'O corpo costuma precisar de um primeiro sinal de segurança antes que a mente acompanhe.', example: 'Respiração 3-3-3 por 2 minutos.', time: '5 min', closing: 'Conclua depois de terminar a prática respiratória.', goTo: { tab: 'breathing', label: 'Abrir Respiração', params: { exerciseId: 'respiracao-3-3-3' } } },
      { title: 'Reduzir pensamento catastrófico', objective: 'Enfraquecer previsão extrema.', task: 'Troque 1 pensamento extremo por frase realista.', explain: 'Aqui a ideia não é positividade forçada, e sim sair do tudo-ou-nada.', example: '“Pode ser difícil, mas eu consigo em partes.”', time: '4 min', closing: 'Feche quando tiver ao menos uma frase mais justa para se apoiar.', goTo: { tab: 'toxicthoughts', label: 'Abrir Falas Tóxicas' } },
      { title: 'Plano de proteção', objective: 'Levar a regulação para o dia seguinte.', task: 'Defina 2 ações para amanhã.', explain: 'A trilha fecha melhor quando termina em prevenção, não só em alívio momentâneo.', example: 'Pausa de tela + caminhada curta.', time: '3 min', closing: 'Conclua quando essas duas ações estiverem claras.', goTo: { tab: 'microtasks', label: 'Abrir Modo Dia Difícil' } },
    ],
  },
  {
    id: 'burnout',
    title: 'Burnout',
    emoji: '🔥',
    desc: 'Recuperação do esgotamento e retomada sustentável.',
    reward: 'Ao concluir, você sai com um mini plano de proteção contra recaída no esgotamento.',
    steps: [
      { title: 'Check de energia', objective: 'Reconhecer limite atual.', task: 'Dê nota de 0 a 10 para energia mental.', explain: 'Burnout piora quando a pessoa tenta se medir pela exigência, não pela energia real.', example: 'Se ≤4, reduzir carga hoje.', time: '2 min', closing: 'Conclua quando sua energia estiver nomeada de forma honesta.', goTo: { tab: 'mood', label: 'Abrir Humor' } },
      { title: 'Pausa fisiológica', objective: 'Interromper escalada do esgotamento.', task: 'Faça pausa ativa e respiração curta.', explain: 'Pequenas pausas físicas costumam ter mais efeito do que insistir em produtividade sem recurso interno.', example: 'Água + alongar ombros + 1 min de respiração.', time: '5 min', closing: 'Feche a etapa depois da pausa real, não só da intenção.', goTo: { tab: 'breathing', label: 'Fazer Respiração' } },
      { title: 'Limites claros', objective: 'Proteger energia restante.', task: 'Escolha 1 limite real para hoje.', explain: 'Sem limite concreto, o burnout volta a drenar o que você ganhou na pausa.', example: 'Sem mensagens de trabalho após 20h.', time: '3 min', closing: 'Conclua quando esse limite puder ser aplicado hoje.', goTo: { tab: 'assertiveness', label: 'Abrir Assertividade' } },
      { title: 'Prevenção de recaída', objective: 'Sair da trilha com estrutura.', task: 'Crie 3 regras de proteção semanal.', explain: 'A trilha fecha quando você transforma cuidado em regra prática, e não só em insight.', example: 'Pausas, foco em prioridade, sono.', time: '7 min', closing: 'Finalize com três regras simples e executáveis.', goTo: { tab: 'missions', label: 'Criar missão semanal' } },
    ],
  },
  {
    id: 'autoestima',
    title: 'Baixa Autoestima',
    emoji: '🪞',
    desc: 'Reconstrução da autoimagem com ações simples.',
    reward: 'Ao terminar, você monta uma base curta de fala interna mais justa e evidências reais sobre si.',
    steps: [
      { title: 'Detectar autocrítica', objective: 'Nomear a fala que sustenta a baixa autoestima.', task: 'Escreva 1 frase dura que você repete.', explain: 'A mudança começa quando a crítica deixa de parecer verdade automática.', example: '“Não sou bom o suficiente.”', time: '3 min', closing: 'Conclua quando essa frase estiver identificada com clareza.', goTo: { tab: 'diary', label: 'Registrar no Diário' } },
      { title: 'Reformular com evidência', objective: 'Criar um contraponto realista.', task: 'Substitua por frase mais justa.', explain: 'A ideia aqui é construir linguagem interna sustentada por fatos, não elogios vazios.', example: '“Estou em evolução e tenho avanços.”', time: '3 min', closing: 'Feche quando tiver uma reformulação que você consegue acreditar.', goTo: { tab: 'psychoedu', label: 'Abrir Psicoeducação' } },
      { title: 'Autocompaixão ativa', objective: 'Praticar um tom interno mais seguro.', task: 'Faça 1 fala de acolhimento em voz baixa.', explain: 'Autocompaixão vira recurso quando sai da teoria e entra no corpo e na voz.', example: '“Faz sentido eu estar cansado agora.”', time: '2 min', closing: 'Conclua depois de falar isso para si de verdade.', goTo: { tab: 'healthymessages', label: 'Abrir Mensagens do Eu Saudável' } },
      { title: 'Conquistas reais', objective: 'Fechar com evidência concreta sobre si.', task: 'Anote 2 vitórias pequenas do dia.', explain: 'Baixa autoestima costuma apagar o que foi feito; essa etapa corrige essa distorção.', example: 'Cumpri tarefa + cuidei de mim.', time: '3 min', closing: 'Feche quando essas duas vitórias estiverem registradas.', goTo: { tab: 'stats', label: 'Abrir Progresso' } },
    ],
  },
  {
    id: 'luto',
    title: 'Luto e Perdas',
    emoji: '🕊️',
    desc: 'Fases do luto (Kübler-Ross) com acolhimento e prática segura.',
    reward: 'Ao concluir, você fecha com um percurso de acolhimento que respeita a perda sem apressar o processo.',
    steps: [
      { title: '🚫 Negação', task: 'Reconheça que a negação é um amortecedor emocional inicial. Escreva: “Ainda dói aceitar, e tudo bem.”', example: '“Parece irreal, mas vou me dar tempo para processar.”', time: '4 min', goTo: { tab: 'carta', label: 'Abrir Carta Terapêutica' } },
      { title: '😡 Raiva', task: 'Canalize a raiva sem se punir: respire e nomeie para onde ela está indo (eu/outro/situação).', example: '“Estou com raiva porque perdi algo importante.”', time: '4 min', goTo: { tab: 'breathing', label: 'Abrir Respiração' } },
      { title: '🤝 Barganha', task: 'Observe os “e se...” e “se ao menos...”. Troque por uma ação concreta de cuidado no presente.', example: '“Não posso mudar o passado, mas posso me cuidar hoje.”', time: '4 min', goTo: { tab: 'diary', label: 'Abrir Diário' } },
      { title: '😔 Depressão', task: 'Acolha a tristeza profunda com rotina mínima: água, banho e descanso. Peça apoio se necessário.', example: '“Hoje vou fazer o básico com gentileza.”', time: '5 min', goTo: { tab: 'microtasks', label: 'Abrir Microtarefas' } },
      { title: '🌱 Aceitação', task: 'Integre a perda sem apagar a história: escolha um ritual simbólico de significado.', example: 'Carta de gratidão, oração ou memória afetiva.', time: '5 min', goTo: { tab: 'gratitude', label: 'Abrir Gratidão' } },
    ],
  },
  {
    id: 'separacao',
    title: 'Separação Afetiva',
    emoji: '💔',
    desc: 'Recuperar autonomia emocional após término.',
    reward: 'Essa trilha fecha com mais clareza sobre gatilhos, limites e retomada da própria rotina.',
    steps: [
      { title: 'Mapear gatilhos de recaída', task: 'Liste 3 gatilhos fortes.', example: 'Stalk em rede social, fotos, músicas.', time: '4 min', goTo: { tab: 'diary', label: 'Registrar gatilhos' } },
      { title: 'Regular o pico emocional', task: 'Use grounding quando disparar.', example: '5-4-3-2-1 por 1 minuto.', time: '5 min', goTo: { tab: 'psychoedu', label: 'Abrir Psicoeducação' } },
      { title: 'Reconstruir identidade', task: 'Planeje 1 atividade sua.', example: 'Treino, leitura, hobby.', time: '3 min', goTo: { tab: 'missions', label: 'Criar missão de 7 dias' } },
      { title: 'Limites saudáveis', task: 'Defina regra de contato.', example: 'Sem mensagens impulsivas à noite.', time: '3 min', goTo: { tab: 'assertiveness', label: 'Treinar limites' } },
    ],
  },
  {
    id: 'panico',
    title: 'Crise de Pânico',
    emoji: '🚨',
    desc: 'Protocolo rápido para reduzir intensidade da crise.',
    reward: 'Ao terminar, você monta uma sequência básica de estabilização para repetir em futuras crises.',
    steps: [
      { title: 'Ancorar no presente', task: 'Use técnica de aterramento.', example: 'Nomear 5 coisas que vê.', time: '2 min', goTo: { tab: 'sos', label: 'Abrir SOS' } },
      { title: 'Controlar respiração', task: 'Respiração curta e ritmada.', example: 'Inspirar 3 / expirar 6.', time: '3 min', goTo: { tab: 'breathing', label: 'Abrir Respiração SOS' } },
      { title: 'Reduzir medo do sintoma', task: 'Repita frase de segurança.', example: '“É desconfortável, mas passa.”', time: '2 min', goTo: { tab: 'healthymessages', label: 'Abrir Mensagens de Segurança' } },
      { title: 'Plano pós-crise', task: 'Registre o que ajudou para repetir.', example: 'Respiração + grounding funcionou.', time: '3 min', goTo: { tab: 'safety', label: 'Atualizar Plano de Segurança' } },
    ],
  },
  {
    id: 'insonia',
    title: 'Insônia e Mente Acelerada',
    emoji: '🌙',
    desc: 'Desligamento noturno e preparo de sono.',
    reward: 'Você conclui com um ritual noturno simples e replicável para reduzir aceleração antes de dormir.',
    steps: [
      { title: 'Desligar estímulo', task: 'Reduza luz e tela antes de deitar.', example: '20 min sem celular.', time: '2 min', goTo: { tab: 'sleep', label: 'Abrir Modo Sono' } },
      { title: 'Relaxar corpo', task: 'Faça respiração relaxante.', example: '4-7-8 por alguns ciclos.', time: '5 min', goTo: { tab: 'breathing', label: 'Abrir Respiração' } },
      { title: 'Esvaziar mente', task: 'Escreva preocupações em lista.', example: '“Resolver amanhã às 10h.”', time: '4 min', goTo: { tab: 'diary', label: 'Abrir Diário Noturno' } },
      { title: 'Ritual fixo', task: 'Defina mini-rotina repetível.', example: 'Banho morno + respiração + cama.', time: '3 min', goTo: { tab: 'reminders', label: 'Configurar lembrete noturno' } },
    ],
  },
  {
    id: 'procrastinacao',
    title: 'Procrastinação Ansiosa',
    emoji: '⏳',
    desc: 'Sair da paralisia com micro-ações.',
    reward: 'Essa trilha fecha com um mini protocolo para começar tarefas sem esperar coragem perfeita.',
    steps: [
      { title: 'Quebrar tarefa', task: 'Divida em pedaço de 5 minutos.', example: 'Abrir arquivo e criar título.', time: '2 min', goTo: { tab: 'microtasks', label: 'Abrir Microtarefas' } },
      { title: 'Início imediato', task: 'Use cronômetro curto.', example: 'Timer 5 minutos sem perfeccionismo.', time: '5 min', goTo: { tab: 'timer', label: 'Abrir Timer' } },
      { title: 'Reforço positivo', task: 'Registre mini-vitória após agir.', example: '“Comecei, mesmo com medo.”', time: '2 min', goTo: { tab: 'stats', label: 'Ver progresso' } },
      { title: 'Plano de continuidade', task: 'Agende próximo bloco de foco.', example: 'Mais 10 min após pausa.', time: '2 min', goTo: { tab: 'missions', label: 'Criar missão de consistência' } },
    ],
  },
  {
    id: 'dependencia',
    title: 'Dependência Emocional',
    emoji: '🧷',
    desc: 'Fortalecer autonomia emocional e limites.',
    reward: 'Ao concluir, você sai com uma base inicial de autorregulação e respeito próprio no vínculo.',
    steps: [
      { title: 'Perceber padrão', task: 'Identifique 1 comportamento de dependência.', example: 'Precisar de resposta imediata.', time: '3 min', goTo: { tab: 'mindmap', label: 'Abrir Mapa Emocional' } },
      { title: 'Regular sem o outro', task: 'Aplique técnica de autorregulação.', example: 'Respiração + frase de suporte.', time: '4 min', goTo: { tab: 'regulation', label: 'Abrir Perfil de Regulação' } },
      { title: 'Criar limite relacional', task: 'Escreva 1 limite de respeito próprio.', example: 'Não insistir em conversa no calor.', time: '3 min', goTo: { tab: 'assertiveness', label: 'Treinar limite assertivo' } },
      { title: 'Reforçar identidade', task: 'Planeje atividade solo com prazer.', example: 'Caminhada, leitura, projeto pessoal.', time: '5 min', goTo: { tab: 'missions', label: 'Criar missão pessoal' } },
    ],
  },
  {
    id: 'ansiedade-social',
    title: 'Ansiedade Social',
    emoji: '🗣️',
    desc: 'Ganhar segurança em interações sociais.',
    reward: 'Você fecha a trilha com um caminho gradual de exposição e revisão sem autocrítica.',
    steps: [
      { title: 'Mapear situações difíceis', task: 'Liste 2 cenários sociais que evitou.', example: 'Reunião e mensagem em grupo.', time: '3 min', goTo: { tab: 'diary', label: 'Registrar no Diário' } },
      { title: 'Regular antes da exposição', task: 'Faça respiração antes de interagir.', example: '3 ciclos de respiração consciente.', time: '3 min', goTo: { tab: 'breathing', label: 'Fazer respiração pré-social' } },
      { title: 'Exposição gradual', task: 'Escolha 1 ação social mínima hoje.', example: 'Enviar 1 áudio curto.', time: '4 min', goTo: { tab: 'missions', label: 'Criar missão social' } },
      { title: 'Avaliar sem autocrítica', task: 'Revise o que funcionou e ajuste.', example: '“Consegui começar, isso já conta.”', time: '3 min', goTo: { tab: 'psychoedu', label: 'Reforçar aprendizado' } },
    ],
  },
];

export default function ThematicTracksSection({ darkMode: dm, onNavigate, isPro = false, onShowUpgrade }: Props) {
  const [progress, setProgress] = useLocalStorage<Record<string, number>>('psico_tracks_progress', {});
  const [active, setActive] = useState<string | null>(null);
  const [completedRewards, setCompletedRewards] = useLocalStorage<string[]>('psico_tracks_rewards', []);
  const [rewardPopup, setRewardPopup] = useState<{ open: boolean; title: string; text: string }>({ open: false, title: '', text: '' });
  const [shareTrackTarget, setShareTrackTarget] = useState<{ title: string; reward: string } | null>(null);
  const c = (l: string, d: string) => (dm ? d : l);

  const availableTracks = useMemo(() => (isPro ? tracks : tracks.slice(0, 4)), [isPro]);
  const lockedTracks = useMemo(() => (isPro ? [] : tracks.slice(4)), [isPro]);

  const continueTrack = useMemo(() => {
    const withProgress = availableTracks
      .map((t) => ({ ...t, done: progress[t.id] || 0 }))
      .filter((t) => t.done > 0 && t.done < t.steps.length)
      .sort((a, b) => b.done / b.steps.length - a.done / a.steps.length);
    return withProgress[0] || null;
  }, [availableTracks, progress]);

  const nextSuggested = useMemo(() => {
    const notStarted = availableTracks.find((t) => (progress[t.id] || 0) === 0);
    return notStarted || availableTracks[0];
  }, [availableTracks, progress]);

  const totalCompleted = availableTracks.filter((t) => (progress[t.id] || 0) >= t.steps.length).length;
  const trackState = useMemo(() => {
    const enriched = availableTracks.map((track) => {
      const done = progress[track.id] || 0;
      const total = track.steps.length;
      const completed = done >= total;
      const pct = Math.round((done / total) * 100);
      return {
        ...track,
        done,
        total,
        completed,
        pct,
        nextStep: track.steps[Math.min(done, total - 1)],
      };
    });

    return {
      started: enriched.filter((track) => track.done > 0 && !track.completed).sort((a, b) => b.pct - a.pct),
      completed: enriched.filter((track) => track.completed),
      suggested: enriched.filter((track) => track.done === 0),
      all: enriched,
    };
  }, [availableTracks, progress]);

  const advance = (id: string, total: number, title: string) => {
    const current = progress[id] || 0;
    const next = Math.min(current + 1, total);
    setProgress({ ...progress, [id]: next });

    if (next === total && !completedRewards.includes(id)) {
      setCompletedRewards([...completedRewards, id]);
      setRewardPopup({ open: true, title: 'Trilha concluída! 🎉', text: `Você concluiu “${title}”.` });
    }
  };

  const restartTrack = (id: string) => setProgress({ ...progress, [id]: 0 });
  const shareTrack = async (title: string, reward: string, platform: SharePlatform) => {
    await shareText(buildTrackShareText(title, reward), platform);
  };

  const goPractice = (step?: Step) => {
    if (!step?.goTo) return;
    if (onNavigate) onNavigate(step.goTo.tab, step.goTo.params || {});
  };

  const continueNow = () => {
    if (!continueTrack) return;
    setActive(continueTrack.id);
    const nextStep = continueTrack.steps[Math.min(continueTrack.done, continueTrack.steps.length - 1)];
    if (nextStep?.goTo && onNavigate) onNavigate(nextStep.goTo.tab, nextStep.goTo.params || {});
  };
  const trackDirection = useMemo(() => {
    if (continueTrack) {
      return {
        eyebrow: 'Continuar com clareza',
        title: `${continueTrack.emoji} ${continueTrack.title}`,
        body: `Você já começou essa trilha. O próximo melhor passo é fechar a etapa ${continueTrack.done + 1} de ${continueTrack.steps.length}.`,
        primaryLabel: 'Continuar agora',
        onPrimary: continueNow,
        secondaryLabel: 'Abrir missões',
        onSecondary: () => onNavigate?.('missions'),
      };
    }
    return {
      eyebrow: 'Melhor ponto de entrada',
      title: `${nextSuggested.emoji} ${nextSuggested.title}`,
      body: 'Se quiser começar com uma direção clara, essa é a trilha mais natural para abrir agora.',
      primaryLabel: 'Começar trilha',
      onPrimary: () => setActive(nextSuggested.id),
      secondaryLabel: 'Ver hábitos',
      onSecondary: () => onNavigate?.('habits'),
    };
  }, [continueNow, continueTrack, nextSuggested, onNavigate]);

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Jornadas guiadas"
          title="Trilhas Temáticas"
          description="Percursos com começo, continuidade e fechamento para temas emocionais específicos."
          icon="🛤️"
        />
      </div>

      <div data-card-glyph="🧭" className={`sereno-ornament-card rounded-[2rem] p-5 border mb-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-indigo-700', 'text-indigo-300')}`}>Jornada com direção</p>
            <h3 className="mt-2 text-lg font-black">Uma trilha organiza o tema, não substitui sua rotina</h3>
            <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>
              Use trilhas para aprofundar um tema específico, hábitos para sustentar o dia a dia e missões para criar ciclos de consistência.
            </p>
          </div>
          <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${c('bg-indigo-50 border border-indigo-100 text-indigo-800', 'bg-slate-900 text-slate-200 border border-slate-700')}`}>
            <p className="text-lg font-black">{trackState.started.length}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">em curso</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button onClick={() => onNavigate?.('missions')} className={`rounded-2xl px-3 py-3 text-xs font-black ${c('bg-violet-50 text-violet-800 border border-violet-100', 'bg-violet-500/10 text-violet-300 border border-violet-500/20')}`}>Missões</button>
          <button onClick={() => onNavigate?.('habits')} className={`rounded-2xl px-3 py-3 text-xs font-black ${c('bg-emerald-50 text-emerald-800 border border-emerald-100', 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20')}`}>Hábitos</button>
          <button onClick={() => onNavigate?.('stats')} className={`rounded-2xl px-3 py-3 text-xs font-black ${c('bg-slate-50 text-slate-700 border border-slate-200', 'bg-slate-900 text-slate-100 border border-slate-700')}`}>Progresso</button>
        </div>
      </div>

      <div data-card-glyph="🪜" className={`sereno-ornament-card rounded-[2rem] p-5 mb-4 border ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-sky-700', 'text-sky-300')}`}>{trackDirection.eyebrow}</p>
        <h3 className="mt-2 text-lg font-black">{trackDirection.title}</h3>
        <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{trackDirection.body}</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={trackDirection.onPrimary} className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-black text-white">
            {trackDirection.primaryLabel}
          </button>
          <button onClick={trackDirection.onSecondary} className={`rounded-2xl px-4 py-3 text-sm font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200 border border-slate-700')}`}>
            {trackDirection.secondaryLabel}
          </button>
        </div>
      </div>

      <div className={`rounded-2xl p-4 mb-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <p className="text-xs font-bold">🏁 Resumo geral</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className={`rounded-xl p-3 ${c('bg-slate-50', 'bg-slate-900')}`}>
            <p className="text-2xl font-extrabold">{trackState.started.length}</p>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">Iniciadas</p>
          </div>
          <div className={`rounded-xl p-3 ${c('bg-emerald-50', 'bg-emerald-950/20')}`}>
            <p className="text-2xl font-extrabold">{totalCompleted}</p>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">Concluídas</p>
          </div>
          <div className={`rounded-xl p-3 ${c('bg-indigo-50', 'bg-indigo-950/20')}`}>
            <p className="text-2xl font-extrabold">{completedRewards.length}</p>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">Recompensas</p>
          </div>
        </div>
      </div>

      {!isPro && lockedTracks.length > 0 && (
        <div className={`rounded-2xl p-4 mb-4 border ${c('bg-fuchsia-50 border-fuchsia-200', 'bg-fuchsia-950/20 border-fuchsia-900/30')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-fuchsia-700', 'text-fuchsia-300')}`}>Trilhas completas no Pro</p>
          <p className="mt-2 text-sm leading-relaxed">
            No grátis, você acessa as trilhas essenciais. No Pro, entram também {lockedTracks.map((track) => track.title).join(', ')}.
          </p>
          <button onClick={() => onShowUpgrade?.()} className="mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white transition-all active:scale-95">
            Ver plano Pro
          </button>
        </div>
      )}

      <div className="space-y-5">
        <section className={`rounded-[2rem] border p-4 ${c('bg-white border-slate-200', 'bg-slate-800/60 border-slate-700')}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Para retomar</h3>
            <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{trackState.started.length} em andamento</span>
          </div>
          <div className="space-y-3">
            {trackState.started.length === 0 && (
              <div className={`rounded-2xl p-4 border text-sm ${c('bg-white border-slate-100 text-slate-600', 'bg-slate-800/70 border-slate-700 text-slate-300')}`}>
                Nenhuma trilha iniciada no momento. Você pode começar por uma sugestão abaixo.
              </div>
            )}
            {trackState.started.map((t) => {
              const eta = Math.max(0, t.total - t.done) * 4;
              return (
                <div key={t.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
                  <button onClick={() => setActive(active === t.id ? null : t.id)} className="w-full text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{t.title}</h3>
                        <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{t.desc}</p>
                        <p className={`text-[11px] mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Etapa atual {t.done + 1}/{t.total} • faltam ~{eta} min</p>
                      </div>
                      <span className="text-xs font-bold text-sky-500">{t.pct}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full mt-2 ${c('bg-slate-100', 'bg-slate-700')}`}>
                      <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${t.pct}%` }} />
                    </div>
                  </button>
                  {active === t.id && (
                    <TrackDetail
                      darkMode={dm}
                      track={t}
                      onAdvance={() => advance(t.id, t.total, t.title)}
                      onGoPractice={() => goPractice(t.nextStep)}
                      onRestart={() => restartTrack(t.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 ${c('bg-white border-slate-200', 'bg-slate-800/60 border-slate-700')}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Para começar</h3>
            <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{trackState.suggested.length} disponíveis</span>
          </div>
          <div className="space-y-3">
            {trackState.suggested.map((t) => (
              <div key={t.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
                <button onClick={() => setActive(active === t.id ? null : t.id)} className="w-full text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{t.title}</h3>
                      <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{t.desc}</p>
                      <p className={`text-[11px] mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{t.total} etapas • {t.reward}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-500">Novo</span>
                  </div>
                </button>
                {active === t.id && (
                  <TrackDetail
                    darkMode={dm}
                    track={t}
                    onAdvance={() => advance(t.id, t.total, t.title)}
                    onGoPractice={() => goPractice(t.nextStep)}
                    onRestart={() => restartTrack(t.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={`rounded-[2rem] border p-4 ${c('bg-white border-slate-200', 'bg-slate-800/60 border-slate-700')}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Concluídas</h3>
            <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{trackState.completed.length} finalizadas</span>
          </div>
          <div className="space-y-3">
            {trackState.completed.length === 0 && (
              <div className={`rounded-2xl p-4 border text-sm ${c('bg-white border-slate-100 text-slate-600', 'bg-slate-800/70 border-slate-700 text-slate-300')}`}>
                Quando uma trilha for concluída, ela aparece aqui para recomeço ou revisão.
              </div>
            )}
            {trackState.completed.map((t) => (
              <div key={t.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{t.title}</h3>
                    <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{t.reward}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-950/40 text-emerald-300')}`}>100%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => setShareTrackTarget({ title: t.title, reward: t.reward })} className="py-2 rounded-lg text-xs font-bold bg-violet-600 text-white">Compartilhar</button>
                  <button onClick={() => restartTrack(t.id)} className={`py-2 rounded-lg text-xs font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-200')}`}>Recomeçar trilha</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AppNoticeModal
        open={rewardPopup.open}
        title={rewardPopup.title}
        message={rewardPopup.text}
        onClose={() => setRewardPopup({ open: false, title: '', text: '' })}
        darkMode={dm}
        icon="🎖️"
        eyebrow="Trilha concluída"
      />
      <SharePlatformModal
        open={!!shareTrackTarget}
        darkMode={dm}
        title={shareTrackTarget ? shareTrackTarget.title : 'Compartilhar trilha'}
        onSelect={(platform) => {
          if (shareTrackTarget) shareTrack(shareTrackTarget.title, shareTrackTarget.reward, platform);
          setShareTrackTarget(null);
        }}
        onClose={() => setShareTrackTarget(null)}
      />
    </div>
  );
}

function TrackDetail({
  darkMode: dm,
  track,
  onAdvance,
  onGoPractice,
  onRestart,
}: {
  darkMode?: boolean;
  track: Track & { done: number; total: number; completed: boolean; nextStep: Step };
  onAdvance: () => void;
  onGoPractice: () => void;
  onRestart: () => void;
}) {
  const c = (l: string, d: string) => (dm ? d : l);

  return (
    <div className="mt-3 space-y-3">
      <div className={`rounded-2xl p-4 border ${c('bg-slate-50 border-slate-200', 'bg-slate-900/50 border-slate-700')}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Percurso</p>
        <p className="text-sm font-bold mt-1">{track.total} etapas • você está na etapa {Math.min(track.done + 1, track.total)}</p>
        <p className={`text-xs mt-1 leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{track.reward}</p>
        {!track.completed && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className={`rounded-xl px-3 py-2 ${c('bg-white border border-slate-200', 'bg-slate-950 border border-slate-700')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${c('text-slate-500', 'text-slate-400')}`}>Próxima etapa</p>
              <p className="mt-1 text-xs font-bold">{track.nextStep.title}</p>
            </div>
            <div className={`rounded-xl px-3 py-2 ${c('bg-white border border-slate-200', 'bg-slate-950 border border-slate-700')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${c('text-slate-500', 'text-slate-400')}`}>Tempo estimado</p>
              <p className="mt-1 text-xs font-bold">{track.nextStep.time}</p>
            </div>
          </div>
        )}
      </div>

      {track.steps.map((s, i) => (
        <div key={i} className={`p-3 rounded-2xl text-xs border ${i < track.done
          ? c('bg-emerald-50 text-emerald-800 border-emerald-100', 'bg-emerald-900/20 text-emerald-200 border-emerald-800/40')
          : i === track.done
            ? c('bg-indigo-50 text-slate-800 border-indigo-100', 'bg-indigo-900/20 text-slate-100 border-indigo-800/40')
            : c('bg-slate-50 text-slate-600 border-slate-200', 'bg-slate-800 text-slate-300 border-slate-700')}`}>
          <div className="flex items-center gap-2">
            <span>{i < track.done ? '✅' : i === track.done ? '👉' : '⬜'}</span>
            <span className="font-bold">{s.title}</span>
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${c('bg-white text-slate-500', 'bg-slate-950 text-slate-300')}`}>{s.time}</span>
          </div>
          {s.objective && <p className="mt-2"><strong>Objetivo:</strong> {s.objective}</p>}
          {s.explain && <p className="mt-1"><strong>Por que essa etapa existe:</strong> {s.explain}</p>}
          <p className="mt-1"><strong>Ação:</strong> {s.task}</p>
          <p className="mt-1 opacity-90"><strong>Exemplo:</strong> {s.example}</p>
          {s.closing && <p className="mt-1"><strong>Fechamento:</strong> {s.closing}</p>}
        </div>
      ))}

      {!track.completed ? (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onGoPractice} className={`py-3 rounded-2xl text-xs font-black ${c('bg-indigo-600 text-white', 'bg-indigo-500 text-white')}`}>
            {track.nextStep.goTo?.label || 'Abrir prática'}
          </button>
          <button onClick={onAdvance} className="py-3 rounded-2xl text-xs font-black bg-emerald-600 text-white">Concluir etapa</button>
        </div>
      ) : (
        <div className={`rounded-2xl p-4 ${c('bg-emerald-50', 'bg-emerald-900/20')}`}>
          <p className="text-sm font-bold">🏆 Trilha concluída</p>
          <p className="text-xs mt-1 opacity-90">{track.reward}</p>
          <button onClick={onRestart} className={`w-full mt-3 py-3 rounded-2xl text-xs font-black ${c('bg-white border border-slate-200 text-slate-700', 'bg-slate-800 border border-slate-600 text-slate-200')}`}>Recomeçar trilha</button>
        </div>
      )}
    </div>
  );
}
