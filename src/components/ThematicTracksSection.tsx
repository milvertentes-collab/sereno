'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: any, params?: Record<string, any>) => void;
}

type Step = {
  title: string;
  task: string;
  example: string;
  time: string;
  goTo?: { tab: string; label: string; params?: Record<string, any> };
};

type Track = {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  steps: Step[];
};

const tracks: Track[] = [
  {
    id: 'ansiedade',
    title: 'Ansiedade',
    emoji: '🌀',
    desc: 'Técnicas práticas para reduzir ansiedade no dia a dia.',
    steps: [
      { title: 'Mapear gatilhos', task: 'Anote 2 gatilhos que te ativaram hoje.', example: 'Pressão no trabalho + cobrança interna.', time: '3 min', goTo: { tab: 'diary', label: 'Abrir Diário', params: { diaryMode: 'registro' } } },
      { title: 'Desacelerar o corpo', task: 'Faça uma técnica respiratória guiada agora.', example: 'Respiração 3-3-3 por 2 minutos.', time: '5 min', goTo: { tab: 'breathing', label: 'Abrir Respiração', params: { exerciseId: 'respiracao-3-3-3' } } },
      { title: 'Reduzir pensamento catastrófico', task: 'Troque 1 pensamento extremo por frase realista.', example: '“Pode ser difícil, mas eu consigo em partes.”', time: '4 min', goTo: { tab: 'toxicthoughts', label: 'Abrir Falas Tóxicas' } },
      { title: 'Plano de proteção', task: 'Defina 2 ações para amanhã.', example: 'Pausa de tela + caminhada curta.', time: '3 min', goTo: { tab: 'microtasks', label: 'Abrir Modo Dia Difícil' } },
    ],
  },
  {
    id: 'burnout',
    title: 'Burnout',
    emoji: '🔥',
    desc: 'Recuperação do esgotamento e retomada sustentável.',
    steps: [
      { title: 'Check de energia', task: 'Dê nota de 0 a 10 para energia mental.', example: 'Se ≤4, reduzir carga hoje.', time: '2 min', goTo: { tab: 'mood', label: 'Abrir Humor' } },
      { title: 'Pausa fisiológica', task: 'Faça pausa ativa e respiração curta.', example: 'Água + alongar ombros + 1 min de respiração.', time: '5 min', goTo: { tab: 'breathing', label: 'Fazer Respiração' } },
      { title: 'Limites claros', task: 'Escolha 1 limite real para hoje.', example: 'Sem mensagens de trabalho após 20h.', time: '3 min', goTo: { tab: 'assertiveness', label: 'Abrir Assertividade' } },
      { title: 'Prevenção de recaída', task: 'Crie 3 regras de proteção semanal.', example: 'Pausas, foco em prioridade, sono.', time: '7 min', goTo: { tab: 'missions', label: 'Criar desafio semanal' } },
    ],
  },
  {
    id: 'autoestima',
    title: 'Baixa Autoestima',
    emoji: '🪞',
    desc: 'Reconstrução da autoimagem com ações simples.',
    steps: [
      { title: 'Detectar autocrítica', task: 'Escreva 1 frase dura que você repete.', example: '“Não sou bom o suficiente.”', time: '3 min', goTo: { tab: 'diary', label: 'Registrar no Diário' } },
      { title: 'Reformular com evidência', task: 'Substitua por frase mais justa.', example: '“Estou em evolução e tenho avanços.”', time: '3 min', goTo: { tab: 'psychoedu', label: 'Abrir Psicoeducação' } },
      { title: 'Autocompaixão ativa', task: 'Faça 1 fala de acolhimento em voz baixa.', example: '“Faz sentido eu estar cansado agora.”', time: '2 min', goTo: { tab: 'healthymessages', label: 'Abrir Mensagens do Eu Saudável' } },
      { title: 'Conquistas reais', task: 'Anote 2 vitórias pequenas do dia.', example: 'Cumpri tarefa + cuidei de mim.', time: '3 min', goTo: { tab: 'share', label: 'Compartilhar conquista' } },
    ],
  },
  {
    id: 'luto',
    title: 'Luto e Perdas',
    emoji: '🕊️',
    desc: 'Fases do luto (Kübler-Ross) com acolhimento e prática segura.',
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
    steps: [
      { title: 'Mapear gatilhos de recaída', task: 'Liste 3 gatilhos fortes.', example: 'Stalk em rede social, fotos, músicas.', time: '4 min', goTo: { tab: 'diary', label: 'Registrar gatilhos' } },
      { title: 'Regular o pico emocional', task: 'Use grounding quando disparar.', example: '5-4-3-2-1 por 1 minuto.', time: '5 min', goTo: { tab: 'psychoedu', label: 'Abrir Psicoeducação' } },
      { title: 'Reconstruir identidade', task: 'Planeje 1 atividade sua.', example: 'Treino, leitura, hobby.', time: '3 min', goTo: { tab: 'missions', label: 'Criar desafio de 7 dias' } },
      { title: 'Limites saudáveis', task: 'Defina regra de contato.', example: 'Sem mensagens impulsivas à noite.', time: '3 min', goTo: { tab: 'assertiveness', label: 'Treinar limites' } },
    ],
  },
  {
    id: 'panico',
    title: 'Crise de Pânico',
    emoji: '🚨',
    desc: 'Protocolo rápido para reduzir intensidade da crise.',
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
    steps: [
      { title: 'Quebrar tarefa', task: 'Divida em pedaço de 5 minutos.', example: 'Abrir arquivo e criar título.', time: '2 min', goTo: { tab: 'microtasks', label: 'Abrir Microtarefas' } },
      { title: 'Início imediato', task: 'Use cronômetro curto.', example: 'Timer 5 minutos sem perfeccionismo.', time: '5 min', goTo: { tab: 'timer', label: 'Abrir Timer' } },
      { title: 'Reforço positivo', task: 'Registre mini-vitória após agir.', example: '“Comecei, mesmo com medo.”', time: '2 min', goTo: { tab: 'badges', label: 'Ver conquistas' } },
      { title: 'Plano de continuidade', task: 'Agende próximo bloco de foco.', example: 'Mais 10 min após pausa.', time: '2 min', goTo: { tab: 'missions', label: 'Criar missão de consistência' } },
    ],
  },
  {
    id: 'dependencia',
    title: 'Dependência Emocional',
    emoji: '🧷',
    desc: 'Fortalecer autonomia emocional e limites.',
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
    steps: [
      { title: 'Mapear situações difíceis', task: 'Liste 2 cenários sociais que evitou.', example: 'Reunião e mensagem em grupo.', time: '3 min', goTo: { tab: 'diary', label: 'Registrar no Diário' } },
      { title: 'Regular antes da exposição', task: 'Faça respiração antes de interagir.', example: '3 ciclos de respiração consciente.', time: '3 min', goTo: { tab: 'breathing', label: 'Fazer respiração pré-social' } },
      { title: 'Exposição gradual', task: 'Escolha 1 ação social mínima hoje.', example: 'Enviar 1 áudio curto.', time: '4 min', goTo: { tab: 'missions', label: 'Criar desafio social' } },
      { title: 'Avaliar sem autocrítica', task: 'Revise o que funcionou e ajuste.', example: '“Consegui começar, isso já conta.”', time: '3 min', goTo: { tab: 'psychoedu', label: 'Reforçar aprendizado' } },
    ],
  },
];

export default function ThematicTracksSection({ darkMode: dm, onNavigate }: Props) {
  const [progress, setProgress] = useLocalStorage<Record<string, number>>('psico_tracks_progress', {});
  const [active, setActive] = useState<string | null>(null);
  const [completedRewards, setCompletedRewards] = useLocalStorage<string[]>('psico_tracks_rewards', []);
  const [rewardPopup, setRewardPopup] = useState<{ open: boolean; title: string; text: string }>({ open: false, title: '', text: '' });
  const c = (l: string, d: string) => (dm ? d : l);

  const continueTrack = useMemo(() => {
    const withProgress = tracks
      .map((t) => ({ ...t, done: progress[t.id] || 0 }))
      .filter((t) => t.done > 0 && t.done < t.steps.length)
      .sort((a, b) => b.done / b.steps.length - a.done / a.steps.length);
    return withProgress[0] || null;
  }, [progress]);

  const nextSuggested = useMemo(() => {
    const notStarted = tracks.find((t) => (progress[t.id] || 0) === 0);
    return notStarted || tracks[0];
  }, [progress]);

  const totalCompleted = tracks.filter((t) => (progress[t.id] || 0) >= t.steps.length).length;

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

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-4">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🛤️ Trilhas Temáticas</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Agora com etapas guiadas + botão de prática real do app.</p>
      </div>

      <div className={`rounded-2xl p-3 mb-4 border ${c('bg-amber-50 border-amber-100', 'bg-amber-900/20 border-amber-800')}`}>
        <p className="text-xs font-bold">📌 Como usar</p>
        <p className="text-xs mt-1">1) Leia a etapa atual 2) toque em “Abrir prática” 3) volte e conclua etapa.</p>
      </div>

      <div className={`rounded-2xl p-3 mb-4 border ${c('bg-blue-50 border-blue-100', 'bg-blue-900/20 border-blue-800')}`}>
        {continueTrack ? (
          <>
            <p className="text-xs font-bold">▶ Continuar de onde parou</p>
            <p className="text-sm font-bold mt-1">{continueTrack.emoji} {continueTrack.title}</p>
            <p className="text-xs opacity-80">Etapa atual: {continueTrack.done + 1}/{continueTrack.steps.length}</p>
            <button onClick={continueNow} className="w-full mt-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold">Continuar agora</button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold">✨ Sugestão para começar</p>
            <p className="text-sm font-bold mt-1">{nextSuggested.emoji} {nextSuggested.title}</p>
            <button onClick={() => setActive(nextSuggested.id)} className="w-full mt-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold">Começar trilha</button>
          </>
        )}
      </div>

      <div className={`rounded-2xl p-3 mb-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <p className="text-xs font-bold">🏁 Resumo geral</p>
        <p className="text-sm mt-1">Trilhas concluídas: <strong>{totalCompleted}/{tracks.length}</strong></p>
        <p className="text-xs opacity-80">Recompensas desbloqueadas: {completedRewards.length}</p>
      </div>

      <div className="space-y-3">
        {tracks.map((t) => {
          const done = progress[t.id] || 0;
          const total = t.steps.length;
          const pct = Math.round((done / total) * 100);
          const eta = Math.max(0, total - done) * 4;
          const completed = done >= total;
          const currentStep = t.steps[Math.min(done, total - 1)];

          return (
            <div key={t.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
              <button onClick={() => setActive(active === t.id ? null : t.id)} className="w-full text-left">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{t.title}</h3>
                    <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{t.desc}</p>
                    <p className={`text-[11px] mt-1 ${c('text-slate-500', 'text-slate-400')}`}>Faltam ~{eta} min • {done}/{total} etapas</p>
                  </div>
                  <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-500' : 'text-slate-400'}`}>{pct}%</span>
                </div>
                <div className={`h-1.5 rounded-full mt-2 ${c('bg-slate-100', 'bg-slate-700')}`}>
                  <div className={`h-1.5 rounded-full ${completed ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </button>

              {active === t.id && (
                <div className="mt-3 space-y-2">
                  {t.steps.map((s, i) => (
                    <div key={i} className={`p-3 rounded-lg text-xs ${i < done ? c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300') : c('bg-slate-50 text-slate-600', 'bg-slate-700 text-slate-300')}`}>
                      <div className="flex items-center gap-2">
                        <span>{i < done ? '✅' : i === done ? '👉' : '⬜'}</span>
                        <span className="font-bold">{s.title}</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${c('bg-white text-slate-500', 'bg-slate-800 text-slate-300')}`}>{s.time}</span>
                      </div>
                      <p className="mt-1"><strong>O que fazer:</strong> {s.task}</p>
                      <p className="mt-1 opacity-90"><strong>Exemplo:</strong> {s.example}</p>
                    </div>
                  ))}

                  {!completed ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button onClick={() => goPractice(currentStep)} className={`py-2 rounded-lg text-xs font-bold ${c('bg-indigo-600 text-white', 'bg-indigo-500 text-white')}`}>
                        {currentStep.goTo?.label || 'Abrir prática'}
                      </button>
                      <button onClick={() => advance(t.id, total, t.title)} className="py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white">Concluir etapa</button>
                    </div>
                  ) : (
                    <div className={`rounded-xl p-3 ${c('bg-emerald-50', 'bg-emerald-900/20')}`}>
                      <p className="text-sm font-bold">🏆 Trilha concluída!</p>
                      <button onClick={() => restartTrack(t.id)} className={`w-full mt-2 py-2 rounded-lg text-xs font-bold ${c('bg-white border border-slate-200 text-slate-700', 'bg-slate-800 border border-slate-600 text-slate-200')}`}>Recomeçar trilha</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rewardPopup.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setRewardPopup({ open: false, title: '', text: '' })}>
          <div className={`rounded-3xl p-6 max-w-xs w-full border ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`} onClick={(e) => e.stopPropagation()}>
            <p className="text-4xl mb-2">🎖️</p>
            <h3 className="font-extrabold text-lg">{rewardPopup.title}</h3>
            <p className="text-sm mt-2">{rewardPopup.text}</p>
            <button onClick={() => setRewardPopup({ open: false, title: '', text: '' })} className="w-full mt-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
}
