'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props { darkMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void }
type Theme = 'ansiedade' | 'relacionamentos' | 'autocuidado' | 'crise' | 'cognitivo';
type Mode = 'cards' | 'quiz' | 'game' | 'memory' | 'link' | 'drag' | 'sequence' | 'reflex';

type Pill = {
  id: string;
  title: string;
  emoji: string;
  content: string;
  theme: Theme;
  action: string;
  quiz: {
    question: string;
    options: string[];
    answer: string;
  };
};

const pills: Pill[] = [
  { id: 'ansiedade', title: 'O que é Ansiedade?', emoji: '🌀', theme: 'ansiedade', content: 'Ansiedade é uma resposta natural do corpo a ameaças percebidas. O problema surge quando ela aparece sem perigo real e trava sua rotina.', action: 'Faça 1 minuto de respiração 4-4-6.', quiz: { question: 'Ansiedade sempre é ruim?', options: ['Sim, sempre', 'Não, pode ser adaptativa', 'Só em adultos'], answer: 'Não, pode ser adaptativa' } },
  { id: 'luto-fases', title: 'As Fases do Luto', emoji: '🕊️', theme: 'relacionamentos', content: 'Modelo de Elisabeth Kübler-Ross (1969), originalmente descrito para pacientes terminais e hoje aplicado a perdas significativas (morte, separação, demissão).\n\n1) 🚫 Negação: “Isso não pode estar acontecendo comigo.”\nMecanismo de defesa que amortece o choque e dá tempo para adaptação emocional.\n\n2) 😡 Raiva: “Por que comigo? Não é justo!”\nSurgem frustração e ressentimento, que podem ser direcionados a si, aos outros, a Deus ou à situação.\n\n3) 🤝 Barganha: “Se eu fizer isso, talvez mude...”\nTentativa de recuperar controle com pensamentos “e se...” e “se ao menos...”.\n\n4) 😔 Depressão: “Não consigo seguir em frente.”\nTristeza profunda ao reconhecer a irreversibilidade da perda; pede cuidado e apoio.\n\n5) 🌱 Aceitação: “Vai doer, mas posso continuar.”\nNão é esquecer: é integrar a perda e reconstruir significado com o tempo.\n\nImportante: as fases não são lineares e podem alternar.', action: 'Perceba em qual fase você está hoje e escolha uma ação gentil de cuidado para este momento.', quiz: { question: 'As fases do luto acontecem em ordem fixa para todas as pessoas?', options: ['Sim, sempre na mesma ordem', 'Não, podem variar e se alternar', 'Só valem para luto por morte'], answer: 'Não, podem variar e se alternar' } },
  { id: 'tcc', title: 'O que é TCC?', emoji: '🧠', theme: 'cognitivo', content: 'A TCC ajuda a identificar pensamentos automáticos e substituí-los por interpretações mais realistas.', action: 'Anote um pensamento automático e uma reformulação.', quiz: { question: 'Na TCC, foco principal é:', options: ['Mudar pensamentos e comportamentos', 'Ignorar emoções', 'Somente medicamentos'], answer: 'Mudar pensamentos e comportamentos' } },
  { id: 'apego', title: 'Estilos de Apego', emoji: '🤝', theme: 'relacionamentos', content: 'Apego seguro, ansioso ou evitativo influencia como nos conectamos e reagimos no amor.', action: 'Observe seu padrão em 1 conflito recente.', quiz: { question: 'Apego influencia relações?', options: ['Não', 'Sim, bastante', 'Só na infância'], answer: 'Sim, bastante' } },
  { id: 'mindfulness', title: 'Mindfulness', emoji: '🧘', theme: 'autocuidado', content: 'Mindfulness é atenção ao presente sem julgamento. Reduz estresse e melhora regulação emocional.', action: 'Faça 60 segundos de atenção na respiração.', quiz: { question: 'Mindfulness é:', options: ['Fugir dos pensamentos', 'Presença sem julgamento', 'Pensar no futuro'], answer: 'Presença sem julgamento' } },
  { id: 'grounding', title: 'Grounding 5-4-3-2-1', emoji: '🌍', theme: 'crise', content: 'Técnica para trazer o foco ao presente durante crise: 5 vê, 4 ouve, 3 toca, 2 cheira, 1 aprecia.', action: 'Faça grounding agora por 1 minuto.', quiz: { question: 'Grounding ajuda a:', options: ['Aumentar pânico', 'Voltar ao presente', 'Dormir imediatamente'], answer: 'Voltar ao presente' } },
  { id: 'respiracao', title: 'Respiração Diafragmática', emoji: '🌬️', theme: 'ansiedade', content: 'Respirar pelo diafragma ativa o sistema parassimpático e reduz resposta de alerta.', action: 'Faça 5 ciclos lentos com a barriga.', quiz: { question: 'Respiração diafragmática tende a:', options: ['Acalmar o corpo', 'Acelerar coração', 'Não ter efeito'], answer: 'Acalmar o corpo' } },
  { id: 'autocompaixao', title: 'Auto compaixão', emoji: '💜', theme: 'autocuidado', content: 'É tratar-se com gentileza nos momentos difíceis, sem autopunição.', action: 'Escreva uma frase gentil para você.', quiz: { question: 'Auto compaixão é:', options: ['Fraqueza', 'Autocuidado emocional', 'Autopiedade total'], answer: 'Autocuidado emocional' } },
  { id: 'limites', title: 'Limites Saudáveis', emoji: '🚧', theme: 'relacionamentos', content: 'Limites definem o que é aceitável para você. Dizer não protege energia e vínculos.', action: 'Defina 1 limite claro para hoje.', quiz: { question: 'Limite saudável significa:', options: ['Agradar todos', 'Proteger seu bem-estar', 'Evitar pessoas'], answer: 'Proteger seu bem-estar' } },
  { id: 'gatilhos', title: 'Gatilhos Emocionais', emoji: '⚡', theme: 'crise', content: 'Gatilhos disparam reações intensas. Reconhecer padrões reduz impulsividade.', action: 'Identifique um gatilho da semana.', quiz: { question: 'Primeiro passo com gatilho:', options: ['Reagir rápido', 'Reconhecer o gatilho', 'Se culpar'], answer: 'Reconhecer o gatilho' } },
  { id: 'janela', title: 'Janela de Tolerância', emoji: '🪟', theme: 'cognitivo', content: 'É a faixa em que você consegue sentir emoções sem se desregular totalmente.', action: 'Perceba se você está dentro/fora da janela hoje.', quiz: { question: 'Fora da janela de tolerância você tende a:', options: ['Regular fácil', 'Hiper ou hipo ativar', 'Nada muda'], answer: 'Hiper ou hipo ativar' } },
  { id: 'ruminacao', title: 'Ruminação', emoji: '🔁', theme: 'cognitivo', content: 'Ruminar é girar no mesmo pensamento sem resolver. Aumenta ansiedade e cansaço.', action: 'Troque 1 ruminação por ação de 5 minutos.', quiz: { question: 'Ruminação geralmente:', options: ['Resolve rápido', 'Aumenta desgaste', 'Melhora foco'], answer: 'Aumenta desgaste' } },
  { id: 'burnout', title: 'Sinais de Burnout', emoji: '🔥', theme: 'autocuidado', content: 'Exaustão, cinismo e baixa eficácia são sinais clássicos. Pausas estratégicas são essenciais.', action: 'Faça um check de energia (0-10).', quiz: { question: 'Burnout inclui:', options: ['Só preguiça', 'Exaustão emocional crônica', 'Falta de talento'], answer: 'Exaustão emocional crônica' } },
  { id: 'validacao', title: 'Validação Emocional', emoji: '🫶', theme: 'relacionamentos', content: 'Validar não é concordar com tudo. É reconhecer o sentimento do outro como legítimo.', action: 'Valide alguém em 1 frase hoje.', quiz: { question: 'Validar é:', options: ['Concordar com tudo', 'Reconhecer sentimento', 'Ignorar conflito'], answer: 'Reconhecer sentimento' } },
  { id: 'distorcao', title: 'Distorções Cognitivas', emoji: '🧩', theme: 'cognitivo', content: 'São atalhos mentais que distorcem a realidade (catastrofização, tudo-ou-nada, leitura mental).', action: 'Nomeie 1 distorção presente hoje.', quiz: { question: 'Distorção cognitiva é:', options: ['Fato absoluto', 'Interpretação enviesada', 'Doença física'], answer: 'Interpretação enviesada' } },
  { id: 'autoeficacia', title: 'Autoeficácia', emoji: '💪', theme: 'autocuidado', content: 'Crença de que você consegue agir para produzir resultado. Cresce com microvitórias.', action: 'Escolha 1 microvitória para agora.', quiz: { question: 'Autoeficácia cresce com:', options: ['Paralisia', 'Ações pequenas consistentes', 'Comparação'], answer: 'Ações pequenas consistentes' } },
  { id: 'co-regulacao', title: 'Co-regulação emocional', emoji: '🤍', theme: 'relacionamentos', content: 'Quando alguém seguro te ajuda a regular emoções por presença, voz e acolhimento.', action: 'Envie uma mensagem pedindo presença para alguém seguro.', quiz: { question: 'Co-regulação acontece quando:', options: ['Você se isola totalmente', 'Uma conexão segura ajuda a regular', 'Só com remédio'], answer: 'Uma conexão segura ajuda a regular' } },
  { id: 'higiene-digital', title: 'Higiene Digital Emocional', emoji: '📵', theme: 'autocuidado', content: 'Excesso de telas aumenta comparação e cansaço mental. Pausas digitais reduzem ansiedade.', action: 'Faça 20 minutos sem redes antes de dormir.', quiz: { question: 'Higiene digital ajuda a:', options: ['Aumentar sobrecarga', 'Melhorar foco e descanso', 'Piorar sono'], answer: 'Melhorar foco e descanso' } },
  { id: 'aceitacao', title: 'Aceitação Radical', emoji: '🪨', theme: 'cognitivo', content: 'Aceitar não é concordar. É parar de lutar contra o fato para agir com clareza.', action: 'Nomeie um fato difícil e uma ação possível agora.', quiz: { question: 'Aceitação radical é:', options: ['Desistir', 'Reconhecer o fato e agir', 'Negar dor'], answer: 'Reconhecer o fato e agir' } },
  { id: 'sono-humor', title: 'Sono e Humor', emoji: '🌙', theme: 'ansiedade', content: 'Privação de sono aumenta irritabilidade e ansiedade no dia seguinte.', action: 'Defina horário de deitar para hoje.', quiz: { question: 'Dormir pouco tende a:', options: ['Melhorar regulação', 'Aumentar reatividade', 'Não mudar nada'], answer: 'Aumentar reatividade' } },
  { id: 'autovalidacao', title: 'Autovalidação', emoji: '🪞', theme: 'autocuidado', content: 'É reconhecer o que você sente sem se julgar, criando segurança interna.', action: 'Diga: “faz sentido eu me sentir assim agora”.', quiz: { question: 'Autovalidação significa:', options: ['Se julgar menos', 'Ignorar emoção', 'Se culpar'], answer: 'Se julgar menos' } },
  { id: 'distancia-cognitiva', title: 'Distância Cognitiva', emoji: '🔭', theme: 'cognitivo', content: 'Em vez de “eu sou isso”, usar “estou tendo o pensamento de que...”.', action: 'Reescreva um pensamento com distância cognitiva.', quiz: { question: 'Distância cognitiva ajuda a:', options: ['Fundir com pensamento', 'Criar espaço para escolha', 'Aumentar impulso'], answer: 'Criar espaço para escolha' } },
];

const themeLabel: Record<Theme, string> = {
  ansiedade: 'Ansiedade', relacionamentos: 'Relacionamentos', autocuidado: 'Autocuidado', crise: 'Crise', cognitivo: 'Cognitivo'
};

const miniChallenges = [
  { id: 'mc1', prompt: 'Você está com coração acelerado e mente corrida. Melhor ação inicial?', options: ['Discutir problema por 2h', 'Respiração diafragmática por 1 min', 'Rolar redes sociais'], answer: 'Respiração diafragmática por 1 min' },
  { id: 'mc2', prompt: 'Pensamento: “sou um fracasso”. Melhor resposta?', options: ['Confirmar pensamento', 'Reformular com evidências reais', 'Evitar tudo'], answer: 'Reformular com evidências reais' },
  { id: 'mc3', prompt: 'Após conflito, você sente gatilho. Próximo passo?', options: ['Responder no impulso', 'Grounding 5-4-3-2-1', 'Se isolar por dias'], answer: 'Grounding 5-4-3-2-1' },
  { id: 'mc4', prompt: 'Você está sobrecarregado no trabalho. Melhor micro-ação?', options: ['Parar tudo e se culpar', 'Quebrar em tarefa de 5 minutos', 'Tomar mais café e ignorar corpo'], answer: 'Quebrar em tarefa de 5 minutos' },
  { id: 'mc5', prompt: 'Antes de dormir, ansiedade subiu. O que ajuda mais?', options: ['Luz baixa + respiração lenta', 'Abrir redes por 1 hora', 'Revisar problemas antigos'], answer: 'Luz baixa + respiração lenta' },
  { id: 'mc6', prompt: 'Após uma crítica, qual resposta é mais regulada?', options: ['Reagir no impulso', 'Pedir exemplo concreto com calma', 'Se atacar internamente'], answer: 'Pedir exemplo concreto com calma' },
  { id: 'mc7', prompt: 'Em crise emocional, primeiro passo seguro?', options: ['Discutir tudo de uma vez', 'Nomear emoção + respirar', 'Negar o que sente'], answer: 'Nomear emoção + respirar' },
  { id: 'mc8', prompt: 'Pensamento: “ninguém me respondeu, me odeiam”. Reenquadramento saudável?', options: ['É rejeição total', 'Talvez estejam ocupados; preciso de evidência', 'Vou me isolar'], answer: 'Talvez estejam ocupados; preciso de evidência' },
  { id: 'mc9', prompt: 'Você recebeu uma mensagem seca de alguém importante. Melhor atitude?', options: ['Interpretar como rejeição na hora', 'Perguntar com clareza e sem ataque', 'Responder com ironia'], answer: 'Perguntar com clareza e sem ataque' },
  { id: 'mc10', prompt: 'Dia difícil, energia baixa. Melhor estratégia?', options: ['Cobrar perfeição', 'Micro-meta de 5 minutos', 'Desistir do dia inteiro'], answer: 'Micro-meta de 5 minutos' },
  { id: 'mc11', prompt: 'Após erro, qual pensamento ajuda na recuperação?', options: ['Sou incapaz', 'Posso corrigir em partes e aprender', 'Nunca vou melhorar'], answer: 'Posso corrigir em partes e aprender' },
  { id: 'mc12', prompt: 'Em pico de ansiedade, qual é a sequência inicial mais útil?', options: ['Catastrofizar e agir no impulso', 'Respirar + nomear emoção + ação pequena', 'Ignorar o corpo e continuar'], answer: 'Respirar + nomear emoção + ação pequena' },
];

const memoryPairs = [
  ['Grounding', 'Voltar ao presente'],
  ['TCC', 'Reestruturar pensamentos'],
  ['Mindfulness', 'Presença sem julgamento'],
  ['Janela de tolerância', 'Faixa de regulação'],
  ['Respiração diafragmática', 'Acalmar sistema nervoso'],
  ['Autocompaixão', 'Gentileza consigo'],
];

const linkChallenges = [
  { left: 'Ruminação', right: 'Pensar repetidamente sem resolver' },
  { left: 'Catastrofização', right: 'Imaginar pior cenário como certeza' },
  { left: 'Validação emocional', right: 'Reconhecer sentimento como legítimo' },
  { left: 'Co-regulação', right: 'Regular emoções em conexão segura' },
];

const dragRounds = [
  { toxic: 'Se eu errei, sou um fracasso.', options: ['Erros me ajudam a aprender; meu valor não depende de perfeição.', 'Preciso desistir agora.', 'Só os outros conseguem.'], answer: 'Erros me ajudam a aprender; meu valor não depende de perfeição.' },
  { toxic: 'Ninguém me respondeu, então me odeiam.', options: ['Talvez estejam ocupados; não posso concluir sem evidência.', 'É sempre rejeição.', 'Vou me isolar de todos.'], answer: 'Talvez estejam ocupados; não posso concluir sem evidência.' },
  { toxic: 'Se estou ansioso, é porque algo terrível vai acontecer.', options: ['Ansiedade é alerta, não prova de perigo real.', 'Tenho certeza de que vai dar errado.', 'Melhor cancelar tudo.'], answer: 'Ansiedade é alerta, não prova de perigo real.' },
  { toxic: 'Meu parceiro ficou quieto, então ele não liga para mim.', options: ['Silêncio pode ser cansaço, não desamor.', 'É abandono emocional.', 'Vou atacar antes de ser rejeitado.'], answer: 'Silêncio pode ser cansaço, não desamor.' },
  { toxic: 'Tenho que dar conta de tudo sozinho.', options: ['Pedir ajuda é estratégia inteligente, não fraqueza.', 'Se pedir ajuda, sou incapaz.', 'É melhor sofrer calado.'], answer: 'Pedir ajuda é estratégia inteligente, não fraqueza.' },
  { toxic: 'Não rendi hoje, então não sirvo para nada.', options: ['Meu valor não se resume à produtividade de um dia.', 'Sou inútil mesmo.', 'Nunca vou melhorar.'], answer: 'Meu valor não se resume à produtividade de um dia.' },
  { toxic: 'Se eu disser não, vão me odiar.', options: ['Limites saudáveis protegem relações reais.', 'Preciso agradar sempre.', 'Negar pedido é egoísmo total.'], answer: 'Limites saudáveis protegem relações reais.' },
  { toxic: 'Todo mundo está melhor que eu.', options: ['Comparação em excesso distorce a realidade.', 'Sou atrasado em tudo.', 'Nunca alcançarei ninguém.'], answer: 'Comparação em excesso distorce a realidade.' },
];

const sequenceSteps = ['Respirar 4 ciclos', 'Nomear a emoção', 'Checar o corpo', 'Escolher micro-ação de 5 min'];

const reflexRounds = [
  { prompt: 'Recebeu crítica dura no trabalho.', options: ['Responder no impulso', 'Pausar 30s e pedir contexto', 'Sumir do chat'], best: 'Pausar 30s e pedir contexto' },
  { prompt: 'Discutiu com alguém próximo.', options: ['Mandar textão agora', 'Fazer grounding e retomar com calma', 'Bloquear a pessoa'], best: 'Fazer grounding e retomar com calma' },
  { prompt: 'Sentiu gatilho por mensagem seca.', options: ['Concluir rejeição imediata', 'Respirar e perguntar com clareza', 'Cobrar agressivamente'], best: 'Respirar e perguntar com clareza' },
  { prompt: 'Errou em uma tarefa importante.', options: ['Se atacar por horas', 'Registrar aprendizado e corrigir o próximo passo', 'Desistir do projeto'], best: 'Registrar aprendizado e corrigir o próximo passo' },
  { prompt: 'Bateu ansiedade antes de dormir.', options: ['Rolar redes até apagar', 'Respiração + luz baixa + pausa de tela', 'Cafeína para manter controle'], best: 'Respiração + luz baixa + pausa de tela' },
  { prompt: 'Parceiro pediu espaço após conflito.', options: ['Pressionar resposta imediata', 'Respeitar espaço e combinar horário de retorno', 'Punir com silêncio'], best: 'Respeitar espaço e combinar horário de retorno' },
  { prompt: 'Você está sobrecarregado no meio do dia.', options: ['Forçar sem pausa', 'Quebrar em micro-tarefa de 5 min', 'Abandonar tudo'], best: 'Quebrar em micro-tarefa de 5 min' },
  { prompt: 'Pensamento: “não vou conseguir”.', options: ['Aceitar como fato', 'Trocar por “ainda não consegui, mas posso tentar em partes”', 'Evitar começar'], best: 'Trocar por “ainda não consegui, mas posso tentar em partes”' },
];

const shuffleStable = (items: string[], key: string) => {
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  return [...items].sort((a, b) => hash(`${a}-${key}`) - hash(`${b}-${key}`));
};

const missionPool = [
  { id: 'read2', label: 'Ler 2 cards', target: 2, progress: (s: any) => s.readToday, check: (s: any) => s.readToday >= 2 },
  { id: 'quiz1', label: 'Acertar 1 quiz', target: 1, progress: (s: any) => s.quizToday, check: (s: any) => s.quizToday >= 1 },
  { id: 'action1', label: 'Fazer 1 prática sugerida', target: 1, progress: (s: any) => s.actionToday, check: (s: any) => s.actionToday >= 1 },
  { id: 'game1', label: 'Completar 1 mini-game', target: 1, progress: (s: any) => s.gameToday, check: (s: any) => s.gameToday >= 1 },
  { id: 'fav1', label: 'Favoritar 1 card', target: 1, progress: (s: any) => s.favToday, check: (s: any) => s.favToday >= 1 },
  { id: 'readTheme', label: 'Ler 1 card hoje', target: 1, progress: (s: any) => s.readToday, check: (s: any) => s.readToday >= 1 },
];

const getLocalDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const unlockXpByTheme: Record<Theme, number> = {
  ansiedade: 0,
  cognitivo: 0,
  autocuidado: 250,
  relacionamentos: 450,
  crise: 700,
};

export default function PsychoeducationSection({ darkMode: dm, onNavigate }: Props) {
  const [read, setRead] = useLocalStorage<string[]>('psico_pills_read', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('psico_pills_fav', []);
  const [xp, setXp] = useLocalStorage<number>('psico_xp', 0);
  const [quizStreak, setQuizStreak] = useLocalStorage<number>('psico_quiz_streak', 0);
  const [dailyDate, setDailyDate] = useLocalStorage<string>('psico_daily_date', '');
  const [dailyDone, setDailyDone] = useLocalStorage<number>('psico_daily_done', 0);
  const [readToday, setReadToday] = useLocalStorage<number>('psico_read_today', 0);
  const [weeklyXp, setWeeklyXp] = useLocalStorage<number[]>('psico_weekly_xp', [0, 0, 0, 0, 0, 0, 0]);
  const [weekAnchor, setWeekAnchor] = useLocalStorage<string>('psico_week_anchor', '');
  const [dailyChestDate, setDailyChestDate] = useLocalStorage<string>('psico_daily_chest_date', '');
  const [phaseUnlocked, setPhaseUnlocked] = useLocalStorage<Record<string, boolean>>('psico_phase_unlocked', { ansiedade: true, cognitivo: true, autocuidado: false, relacionamentos: false, crise: false });
  const [quizToday, setQuizToday] = useLocalStorage<number>('psico_quiz_today', 0);
  const [chestResult, setChestResult] = useState('');
  const [chestOpen, setChestOpen] = useState(false);
  const [chestKind, setChestKind] = useState<'xp' | 'msg'>('msg');
  const [chestRarity, setChestRarity] = useState<'Comum' | 'Raro' | 'Épico'>('Comum');
  const [xpPopup, setXpPopup] = useState<{ open: boolean; title: string; text: string }>({ open: false, title: '', text: '' });
  const [gameToday, setGameToday] = useLocalStorage<number>('psico_game_today', 0);
  const [actionToday, setActionToday] = useLocalStorage<number>('psico_action_today', 0);
  const [favToday, setFavToday] = useLocalStorage<number>('psico_fav_today', 0);
  const [dailyReadIds, setDailyReadIds] = useLocalStorage<string[]>('psico_daily_read_ids', []);

  const [selected, setSelected] = useState<string | null>(null);
  const [lockNotice, setLockNotice] = useState<string>('');
  const [mode, setMode] = useState<Mode>('cards');
  const [q, setQ] = useState('');
  const [theme, setTheme] = useState<Theme | null>(null);

  const [quizPillId, setQuizPillId] = useState<string>(pills[0].id);
  const [quizResult, setQuizResult] = useState<string>('');

  const [gameIndex, setGameIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameFeedback, setGameFeedback] = useState('');

  const [memoryOpen, setMemoryOpen] = useState<number[]>([]);
  const [memoryMatched, setMemoryMatched] = useState<number[]>([]);
  const [memoryMode, setMemoryMode] = useState<'texto' | 'imagens'>('texto');
  const [memoryBusy, setMemoryBusy] = useState(false);

  const [linkIndex, setLinkIndex] = useState(0);
  const [linkScore, setLinkScore] = useState(0);
  const [linkFeedback, setLinkFeedback] = useState('');

  const [todayMissionIds, setTodayMissionIds] = useLocalStorage<string[]>('psico_today_missions', ['read2', 'quiz1', 'action1']);

  const [dragIndex, setDragIndex] = useState(0);
  const [dragFeedback, setDragFeedback] = useState('');
  const [dragScore, setDragScore] = useState(0);
  const [draggedOption, setDraggedOption] = useState<string | null>(null);

  const [sequenceOrder, setSequenceOrder] = useState<string[]>([...sequenceSteps].sort());
  const [sequenceFeedback, setSequenceFeedback] = useState('');

  const [reflexIndex, setReflexIndex] = useState(0);
  const [reflexFeedback, setReflexFeedback] = useState('');
  const [reflexScore, setReflexScore] = useState(0);
  const [reflexTimeLeft, setReflexTimeLeft] = useState(8);

  const c = (l: string, d: string) => (dm ? d : l);

  const today = getLocalDateKey();
  useEffect(() => {
    if (dailyDate !== today) {
      setDailyDate(today);
      setDailyDone(0);
      setReadToday(0);
      setQuizToday(0);
      setGameToday(0);
      setActionToday(0);
      setFavToday(0);
      setDailyReadIds([]);

      const seed = today.split('-').join('').split('').reduce((s, n) => s + Number(n), 0);
      const dynamicId = missionPool[(seed + 3) % missionPool.length].id;
      const picks = ['read2', 'action1', dynamicId];
      setTodayMissionIds(Array.from(new Set(picks)));
    }
  }, [dailyDate, today, setDailyDate, setDailyDone, setReadToday, setQuizToday, setGameToday, setActionToday, setFavToday, setDailyReadIds, setTodayMissionIds]);

  useEffect(() => {
    const d = new Date();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = getLocalDateKey(monday);
    if (weekAnchor !== key) {
      setWeekAnchor(key);
      setWeeklyXp([0, 0, 0, 0, 0, 0, 0]);
    }
  }, [weekAnchor, setWeekAnchor, setWeeklyXp]);

  useEffect(() => {
    setPhaseUnlocked((prev) => ({
      ...prev,
      ansiedade: true,
      cognitivo: true,
      autocuidado: xp >= unlockXpByTheme.autocuidado,
      relacionamentos: xp >= unlockXpByTheme.relacionamentos,
      crise: xp >= unlockXpByTheme.crise,
    }));
  }, [xp, setPhaseUnlocked]);

  const level = useMemo(() => {
    if (xp >= 1200) return { n: 4, title: 'Mentor Interno' };
    if (xp >= 700) return { n: 3, title: 'Regulador Emocional' };
    if (xp >= 300) return { n: 2, title: 'Explorador Mental' };
    return { n: 1, title: 'Iniciante Emocional' };
  }, [xp]);

  const levelBase = level.n === 1 ? 0 : level.n === 2 ? 300 : level.n === 3 ? 700 : 1200;
  const levelTop = level.n === 1 ? 300 : level.n === 2 ? 700 : level.n === 3 ? 1200 : 1700;
  const levelPct = Math.min(100, Math.round(((xp - levelBase) / (levelTop - levelBase)) * 100));

  const filtered = pills.filter((p) => {
    const matchQ = !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.content.toLowerCase().includes(q.toLowerCase());
    const matchTheme = !theme || p.theme === theme;
    return matchQ && matchTheme;
  });

  const missionState = { readToday, quizToday, actionToday, gameToday, favToday };
  const todayMissions = todayMissionIds
    .map((id) => missionPool.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const gainXp = (amount: number) => {
    setXp((v) => v + amount);
    const day = new Date().getDay();
    setWeeklyXp((prev) => {
      const base = prev?.length === 7 ? [...prev] : [0, 0, 0, 0, 0, 0, 0];
      base[day] = (base[day] || 0) + amount;
      return base;
    });
  };

  const markRead = (id: string) => {
    if (!dailyReadIds.includes(id)) {
      setDailyReadIds((prev) => [...prev, id]);
      setReadToday((v) => v + 1);
    }

    if (!read.includes(id)) {
      setRead([...read, id]);
      gainXp(10);
    } else {
      gainXp(3);
    }
    setSelected(null);
  };

  const toggleFav = (id: string) => {
    const willAdd = !favorites.includes(id);
    setFavorites(willAdd ? [...favorites, id] : favorites.filter((f) => f !== id));
    if (willAdd) setFavToday((v) => v + 1);
  };

  const runAction = () => {
    gainXp(25);
    setDailyDone((d) => d + 1);
    setActionToday((v) => v + 1);
    setXpPopup({ open: true, title: 'Prática concluída', text: '+25 XP • você está evoluindo!' });
  };

  const submitQuiz = (option: string) => {
    const pill = pills.find((p) => p.id === quizPillId);
    if (!pill) return;
    if (option === pill.quiz.answer) {
      setQuizResult('✅ Acertou! +20 XP');
      gainXp(20);
      setQuizStreak((s) => s + 1);
      setQuizToday((v) => v + 1);
    } else {
      setQuizResult(`❌ Quase! Resposta certa: ${pill.quiz.answer}`);
      setQuizStreak(0);
    }
  };

  const submitMiniGame = (option: string) => {
    const challenge = miniChallenges[gameIndex];
    if (option === challenge.answer) {
      setGameScore((s) => s + 1);
      gainXp(30);
      setGameFeedback('✅ Boa escolha! +30 XP');
      setGameToday((v) => v + 1);
    } else {
      setGameFeedback(`❌ Melhor seria: ${challenge.answer}`);
    }

    setTimeout(() => {
      if (gameIndex < miniChallenges.length - 1) {
        setGameIndex((i) => i + 1);
        setGameFeedback('');
      }
    }, 800);
  };

  const activeQuizPill = pills.find((p) => p.id === quizPillId) || pills[0];
  const randomizedQuizOptions = useMemo(
    () => shuffleStable(activeQuizPill.quiz.options, `quiz-${quizPillId}-${dailyDate}`),
    [activeQuizPill.quiz.options, quizPillId, dailyDate]
  );
  const randomizedMiniOptions = useMemo(
    () => shuffleStable(miniChallenges[gameIndex].options, `mini-${gameIndex}-${dailyDate}`),
    [gameIndex, dailyDate]
  );
  const randomizedDragOptions = useMemo(
    () => shuffleStable(dragRounds[dragIndex].options, `drag-${dragIndex}-${dailyDate}`),
    [dragIndex, dailyDate]
  );
  const randomizedReflexOptions = useMemo(
    () => shuffleStable(reflexRounds[reflexIndex].options, `reflex-${reflexIndex}-${dailyDate}`),
    [reflexIndex, dailyDate]
  );
  const randomizedLinkOptions = useMemo(
    () => shuffleStable(linkChallenges.map((l) => l.right), `link-${linkIndex}-${dailyDate}`),
    [linkIndex, dailyDate]
  );

  const gameEnded = gameIndex >= miniChallenges.length - 1 && gameFeedback !== '';

  const memoryDeck = useMemo(() => {
    if (memoryMode === 'texto') {
      const flat = memoryPairs.flatMap(([a, b]) => [{ key: `${a}-q`, pair: a, text: a }, { key: `${a}-a`, pair: a, text: b }]);
      return [...flat].sort((x, y) => x.key.localeCompare(y.key));
    }

    const imagePairs = pills.slice(0, 6).map((p) => ({ id: p.id, emoji: p.emoji }));
    const flat = imagePairs.flatMap((p) => [
      { key: `${p.id}-a`, pair: p.id, text: p.emoji },
      { key: `${p.id}-b`, pair: p.id, text: p.emoji },
    ]);
    return [...flat].sort((x, y) => x.key.localeCompare(y.key));
  }, [memoryMode]);

  const flipMemory = (idx: number) => {
    if (memoryBusy) return;
    if (memoryMatched.includes(idx) || memoryOpen.includes(idx)) return;

    const next = [...memoryOpen, idx];
    setMemoryOpen(next);

    if (next.length === 2) {
      setMemoryBusy(true);
      const [a, b] = next;
      const isMatch = memoryDeck[a].pair === memoryDeck[b].pair;

      setTimeout(() => {
        if (isMatch) {
          setMemoryMatched((m) => Array.from(new Set([...m, a, b])));
          gainXp(15);
        }
        setMemoryOpen([]);
        setMemoryBusy(false);
      }, 550);
    }
  };

  const answerLink = (option: string) => {
    const current = linkChallenges[linkIndex];
    if (option === current.right) {
      setLinkScore((s) => s + 1);
      gainXp(20);
      setLinkFeedback('✅ Conexão correta! +20 XP');
    } else {
      setLinkFeedback(`❌ Correto: ${current.right}`);
    }
    setTimeout(() => {
      if (linkIndex < linkChallenges.length - 1) {
        setLinkIndex((i) => i + 1);
        setLinkFeedback('');
      }
    }, 800);
  };

  const answerDrag = (option: string) => {
    if (dragFeedback) return;
    const current = dragRounds[dragIndex];
    if (option === current.answer) {
      setDragScore((s) => s + 1);
      gainXp(20);
      setDragFeedback('✅ Boa reformulação! +20 XP');
    } else {
      setDragFeedback(`❌ Melhor: ${current.answer}`);
    }
    setDraggedOption(null);
    setTimeout(() => {
      if (dragIndex < dragRounds.length - 1) {
        setDragIndex((i) => i + 1);
        setDragFeedback('');
      }
    }, 900);
  };

  const onDropDrag = (e: any) => {
    e.preventDefault();
    const option = e.dataTransfer.getData('text/plain') || draggedOption;
    if (option) answerDrag(option);
  };

  const moveSequence = (idx: number, dir: -1 | 1) => {
    const next = [...sequenceOrder];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSequenceOrder(next);
  };

  const checkSequence = () => {
    const ok = sequenceOrder.every((s, i) => s === sequenceSteps[i]);
    if (ok) {
      gainXp(30);
      setSequenceFeedback('✅ Sequência perfeita! +30 XP');
    } else {
      setSequenceFeedback('❌ Quase! Tente: Respirar → Nomear emoção → Corpo → Micro-ação.');
    }
  };

  useEffect(() => {
    setMemoryOpen([]);
    setMemoryMatched([]);
    setMemoryBusy(false);
  }, [memoryMode]);

  const answerReflex = (option: string) => {
    if (reflexFeedback) return;
    const current = reflexRounds[reflexIndex];
    if (option === current.best) {
      setReflexScore((s) => s + 1);
      gainXp(20);
      setReflexFeedback('✅ Resposta regulada! +20 XP');
    } else {
      setReflexFeedback(`❌ Melhor resposta: ${current.best}`);
    }
    setTimeout(() => {
      if (reflexIndex < reflexRounds.length - 1) {
        setReflexIndex((i) => i + 1);
        setReflexFeedback('');
        setReflexTimeLeft(8);
      }
    }, 900);
  };

  useEffect(() => {
    if (mode !== 'reflex') return;
    if (reflexFeedback) return;
    if (reflexIndex >= reflexRounds.length) return;

    if (reflexTimeLeft <= 0) {
      const current = reflexRounds[reflexIndex];
      setReflexFeedback(`⏰ Tempo esgotado! Melhor resposta: ${current.best}`);
      setTimeout(() => {
        if (reflexIndex < reflexRounds.length - 1) {
          setReflexIndex((i) => i + 1);
          setReflexFeedback('');
          setReflexTimeLeft(8);
        }
      }, 900);
      return;
    }

    const timer = setTimeout(() => setReflexTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [mode, reflexTimeLeft, reflexFeedback, reflexIndex]);

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-4">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>📚 Psicoeducação Gamer</h2>
        <p className={`text-sm mt-1 ${c('text-slate-600', 'text-slate-400')}`}>Aprenda jogando: cards, quiz, minigame e fases.</p>
        <p className={`text-xs mt-2 font-black ${c('text-indigo-700', 'text-indigo-300')}`}>VERSÃO NOVA • popup moderno + bloqueios com XP + memória corrigida</p>
      </div>

      <div className={`rounded-3xl p-4 border mb-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold">Nível {level.n} • {level.title}</p>
          <p className="text-xs font-bold">XP {xp}</p>
        </div>
        <div className={`h-2 rounded-full ${c('bg-slate-100', 'bg-slate-700')}`}>
          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${levelPct}%` }} />
        </div>
      </div>

      <div className={`rounded-3xl p-4 border mb-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <p className="font-bold mb-2">🎯 Missões de hoje</p>
        {todayMissions.map((m) => {
          const raw = typeof m.progress === 'function' ? m.progress(missionState) : 0;
          const current = Math.max(0, Math.min(m.target, raw));
          const done = m.check(missionState);
          return (
            <div key={m.id} className={`text-sm mb-2 p-2 rounded-xl ${done ? c('bg-emerald-50', 'bg-emerald-900/20') : c('bg-slate-50', 'bg-slate-800')}`}>
              <p>{done ? '✅' : '⬜'} {m.label}</p>
              <p className={`text-[11px] ${c('text-slate-600', 'text-slate-300')}`}>Progresso: {current}/{m.target}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`rounded-2xl p-3 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold text-sm mb-2">🏅 Ranking semanal pessoal</p>
          <p className="text-xs">Seu total da semana: <strong>{weeklyXp.reduce((s, n) => s + n, 0)} XP</strong></p>
          <p className="text-xs mt-1">Melhor dia: <strong>{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][weeklyXp.indexOf(Math.max(...weeklyXp))] || '—'}</strong></p>
        </div>
        <div className={`rounded-2xl p-3 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold text-sm mb-2">🎁 Baú diário</p>
          <button
            onClick={() => {
              if (dailyChestDate === today) return alert('Baú já aberto hoje. Volte amanhã!');
              setDailyChestDate(today);

              const motivational = [
                '🌱 Pequenos passos também contam. Você está evoluindo.',
                '🫶 Seu esforço de hoje já é autocuidado real.',
                '✨ Você não precisa estar 100% para continuar avançando.',
                '🌤️ Respira. Você já superou dias difíceis antes.',
                '💙 Consistência vence perfeição. Continue no seu ritmo.'
              ];

              const roll = Math.random();
              const rarityRoll = Math.random();
              const rarity: 'Comum' | 'Raro' | 'Épico' = rarityRoll < 0.7 ? 'Comum' : rarityRoll < 0.95 ? 'Raro' : 'Épico';
              setChestRarity(rarity);

              if (roll < 0.6) {
                const rewardsByRarity = {
                  Comum: [20, 25, 30],
                  Raro: [45, 55, 70],
                  Épico: [90, 120, 150],
                } as const;
                const pool = rewardsByRarity[rarity];
                const reward = pool[Math.floor(Math.random() * pool.length)];
                gainXp(reward);
                setChestKind('xp');
                setChestResult(`+${reward} XP`);
              } else {
                const msg = motivational[Math.floor(Math.random() * motivational.length)];
                setChestKind('msg');
                setChestResult(msg);
              }
              setChestOpen(true);
            }}
            className={`w-full py-2 rounded-xl text-xs font-bold ${dailyChestDate === today ? c('bg-slate-100 text-slate-400', 'bg-slate-700 text-slate-400') : 'bg-amber-500 text-white'}`}
          >
            {dailyChestDate === today ? 'Baú aberto hoje' : 'Abrir baú'}
          </button>
          {chestResult && <p className="text-xs mt-2 font-medium opacity-70">Último prêmio: {chestResult}</p>}
        </div>
      </div>

      <div className={`rounded-3xl p-4 border mb-4 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <p className="font-bold mb-1">🗺️ Fases por tema</p>
        <p className={`text-[11px] mb-2 ${c('text-slate-600', 'text-slate-300')}`}>🔒 Itens travados mostram o XP necessário para liberar</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(Object.keys(themeLabel) as Theme[]).map((t) => (
            <button key={t} onClick={() => phaseUnlocked[t] && setTheme(t)} className={`px-2 py-2 rounded-xl font-bold text-left ${phaseUnlocked[t] ? c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/20 text-emerald-300') : c('bg-slate-100 text-slate-400', 'bg-slate-700 text-slate-500')}`}>
              <p>{phaseUnlocked[t] ? '🔓' : '🔒'} {themeLabel[t]}</p>
              {!phaseUnlocked[t] && <p className="text-[10px] mt-1 opacity-80">Desbloqueia com {unlockXpByTheme[t]} XP</p>}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl p-3 mb-3 ${c('bg-blue-50 border border-blue-100', 'bg-blue-900/20 border border-blue-800')}`}>
        <p className="text-sm font-bold">🎮 Área de Jogos Psicoeducativos</p>
        <p className="text-xs opacity-80">Escolha abaixo um modo de jogo para aprender de forma leve e divertida.</p>
      </div>

      <div className={`mb-2 text-[11px] font-bold ${c('text-indigo-700', 'text-indigo-300')}`}>Mini-game total de perguntas: {miniChallenges.length}</div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button onClick={() => setMode('cards')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'cards' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Cards</button>
        <button onClick={() => setMode('quiz')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'quiz' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Quiz</button>
        <button onClick={() => setMode('game')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'game' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Mini</button>
        <button onClick={() => setMode('memory')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'memory' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Memória</button>
        <button onClick={() => setMode('link')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'link' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Ligar</button>
        <button onClick={() => setMode('drag')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'drag' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Arrastar</button>
        <button onClick={() => setMode('sequence')} className={`py-2 rounded-xl text-xs font-bold ${mode === 'sequence' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Sequência</button>
        <button onClick={() => { setMode('reflex'); setReflexTimeLeft(8); }} className={`py-2 rounded-xl text-xs font-bold ${mode === 'reflex' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Reflexo</button>
      </div>

      {mode === 'cards' && (
        <>
          <div className={`rounded-2xl p-3 mb-3 ${c('bg-white border border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar card..." className={`w-full p-3 rounded-xl text-sm ${c('bg-slate-50', 'bg-slate-900')}`} />
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setTheme(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${!theme ? 'bg-emerald-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Todos</button>
            {(Object.keys(themeLabel) as Theme[]).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${theme === t ? 'bg-emerald-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{themeLabel[t]}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => {
              const unlocked = !!phaseUnlocked[p.theme];
              return (
                <button key={p.id} onClick={() => unlocked ? setSelected(p.id) : setLockNotice(`🔒 ${themeLabel[p.theme]} bloqueado. Libera com ${unlockXpByTheme[p.theme]} XP (você tem ${xp} XP).`)} className={`p-4 rounded-2xl text-left border transition-all relative ${read.includes(p.id) ? c('bg-emerald-50 border-emerald-200', 'bg-emerald-900/20 border-emerald-800') : c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')} ${!unlocked ? 'opacity-70' : ''}`}>
                  {!unlocked && (
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-black ${c('bg-rose-100 text-rose-700', 'bg-rose-900/40 text-rose-300')}`}>
                      🔒 Bloqueado
                    </span>
                  )}
                  <span className="text-2xl">{p.emoji}</span>
                  <p className="font-bold text-sm mt-2">{p.title}</p>
                  <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-300')}`}>
                    {unlocked ? `🔓 ${themeLabel[p.theme]}` : `🔒 ${themeLabel[p.theme]} • libera com ${unlockXpByTheme[p.theme]} XP`}
                  </p>
                  {!unlocked && (
                    <p className={`text-[10px] mt-1 font-semibold ${c('text-rose-600', 'text-rose-300')}`}>
                      Ganhe mais XP para desbloquear este card.
                    </p>
                  )}
                  {read.includes(p.id) && <span className="text-xs text-emerald-500">✓ Lido</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === 'quiz' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold mb-2">🧠 Quiz relâmpago</p>
          <select value={quizPillId} onChange={(e) => { setQuizPillId(e.target.value); setQuizResult(''); }} className={`w-full p-2 rounded-xl text-sm mb-3 ${c('bg-slate-50', 'bg-slate-900')}`}>
            {pills.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.title}</option>)}
          </select>
          <p className="text-sm font-bold mb-2">{activeQuizPill.quiz.question}</p>
          <div className="space-y-2">
            {randomizedQuizOptions.map((op) => (
              <button key={op} onClick={() => submitQuiz(op)} className={`w-full p-2 rounded-xl text-sm text-left ${c('bg-slate-100', 'bg-slate-700')}`}>{op}</button>
            ))}
          </div>
          {quizResult && <p className="text-sm mt-3 font-bold">{quizResult}</p>}
        </div>
      )}

      {mode === 'game' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold mb-2">🎮 Mini-game emocional ({gameIndex + 1}/{miniChallenges.length})</p>
          <p className="text-sm mb-3">{miniChallenges[gameIndex].prompt}</p>
          <div className="space-y-2">
            {randomizedMiniOptions.map((op) => (
              <button key={op} onClick={() => submitMiniGame(op)} className={`w-full p-2 rounded-xl text-sm text-left ${c('bg-slate-100', 'bg-slate-700')}`}>{op}</button>
            ))}
          </div>
          {gameFeedback && <p className="text-sm mt-3 font-bold">{gameFeedback}</p>}
          {gameEnded && (
            <div className={`mt-3 p-3 rounded-xl ${c('bg-emerald-50', 'bg-emerald-900/20')}`}>
              <p className="text-sm font-bold">Pontuação final: {gameScore}/{miniChallenges.length}</p>
              <button onClick={() => { setGameIndex(0); setGameScore(0); setGameFeedback(''); }} className="mt-2 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white">Jogar de novo</button>
            </div>
          )}
        </div>
      )}

      {mode === 'memory' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold mb-2">🧠 Jogo da Memória Emocional</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => setMemoryMode('texto')} className={`py-2 rounded-xl text-xs font-bold ${memoryMode === 'texto' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Modo Texto</button>
            <button onClick={() => setMemoryMode('imagens')} className={`py-2 rounded-xl text-xs font-bold ${memoryMode === 'imagens' ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Modo Imagens</button>
          </div>
          <p className="text-xs mb-3 opacity-80">{memoryMode === 'texto' ? 'Encontre os pares conceito ↔ definição.' : 'Encontre os pares visuais (somente emojis, sem texto).'}</p>
          <div className="grid grid-cols-2 gap-2">
            {memoryDeck.map((card, idx) => {
              const open = memoryOpen.includes(idx) || memoryMatched.includes(idx);
              return (
                <button key={card.key + idx} onClick={() => flipMemory(idx)} className={`p-2 rounded-xl min-h-[54px] ${memoryMode === 'imagens' ? 'text-2xl' : 'text-xs'} ${open ? c('bg-emerald-50 border border-emerald-200', 'bg-emerald-900/20 border border-emerald-700') : c('bg-slate-100', 'bg-slate-700')}`}>
                  {open ? card.text : '❓'}
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-3">Pares encontrados: {memoryMatched.length / 2}/{memoryMode === 'texto' ? memoryPairs.length : 6}</p>
        </div>
      )}

      {mode === 'link' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold mb-2">🔗 Jogo de Ligar Conceitos ({linkIndex + 1}/{linkChallenges.length})</p>
          <p className="text-sm mb-3">Conecte: <strong>{linkChallenges[linkIndex].left}</strong></p>
          <div className="space-y-2">
            {randomizedLinkOptions.map((option) => (
              <button key={option} onClick={() => answerLink(option)} className={`w-full p-2 rounded-xl text-sm text-left ${c('bg-slate-100', 'bg-slate-700')}`}>{option}</button>
            ))}
          </div>
          {linkFeedback && <p className="text-sm mt-3 font-bold">{linkFeedback}</p>}
          {linkIndex >= linkChallenges.length - 1 && linkFeedback && <p className="text-sm mt-2">Pontuação: {linkScore}/{linkChallenges.length}</p>}
        </div>
      )}

      {lockNotice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setLockNotice('')}>
          <div className={`rounded-3xl p-5 max-w-xs w-full border ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`} onClick={(e) => e.stopPropagation()}>
            <p className="font-extrabold text-base mb-2">Por que está travado?</p>
            <p className="text-sm">{lockNotice}</p>
            <button onClick={() => setLockNotice('')} className="w-full mt-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">Entendi</button>
          </div>
        </div>
      )}

      {xpPopup.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setXpPopup({ open: false, title: '', text: '' })}>
          <div className={`relative overflow-hidden rounded-[28px] p-0 max-w-sm w-full border shadow-2xl ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`} onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-14 -right-10 w-36 h-36 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-emerald-500/20 blur-2xl" />

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center text-2xl shadow-lg">✨</div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-black opacity-70">Conquista</p>
                    <h3 className="font-extrabold text-lg leading-tight">{xpPopup.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setXpPopup({ open: false, title: '', text: '' })}
                  className={`w-8 h-8 rounded-xl text-sm font-black ${c('bg-slate-100 text-slate-600', 'bg-slate-800 text-slate-300')}`}
                >
                  ✕
                </button>
              </div>

              <div className={`mt-4 rounded-2xl p-4 border ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-900/20 border-emerald-800')}`}>
                <p className="text-sm font-black text-emerald-500">{xpPopup.text}</p>
                <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-300')}`}>Seu progresso foi atualizado agora.</p>
              </div>

              <button onClick={() => setXpPopup({ open: false, title: '', text: '' })} className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-extrabold shadow-lg">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {chestOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setChestOpen(false)}>
          <div className={`rounded-3xl p-6 max-w-xs w-full text-center ${c('bg-white', 'bg-slate-800')}`} onClick={(e) => e.stopPropagation()}>
            <p className="text-5xl mb-2">{chestKind === 'xp' ? '🎁' : '💌'}</p>
            <div className="mb-2">
              <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider ${chestRarity === 'Épico' ? 'bg-violet-500 text-white' : chestRarity === 'Raro' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {chestRarity}
              </span>
            </div>
            <h3 className="font-extrabold text-lg mb-2">{chestKind === 'xp' ? 'Baú aberto!' : 'Mensagem do dia'}</h3>
            <p className={`text-sm ${chestKind === 'xp' ? 'font-black text-emerald-500' : ''}`}>{chestResult}</p>
            <button onClick={() => setChestOpen(false)} className="w-full mt-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">Fechar</button>
          </div>
        </div>
      )}

      {mode === 'drag' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold mb-2">🧲 Arraste e solte: tóxico → saudável ({dragIndex + 1}/{dragRounds.length})</p>
          <p className="text-sm mb-3">❌ {dragRounds[dragIndex].toxic}</p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropDrag}
            className={`mb-3 p-3 rounded-xl border-2 border-dashed ${c('border-emerald-300 bg-emerald-50', 'border-emerald-700 bg-emerald-900/20')}`}
          >
            <p className="text-xs font-bold">Solte aqui a reformulação correta</p>
          </div>

          <div className="space-y-2">
            {randomizedDragOptions.map((op) => (
              <div
                key={op}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', op); setDraggedOption(op); }}
                onClick={() => answerDrag(op)}
                className={`w-full p-2 rounded-xl text-sm text-left cursor-grab active:cursor-grabbing ${c('bg-slate-100', 'bg-slate-700')}`}
              >
                {op}
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-2 opacity-70">Dica: também pode tocar na opção se preferir, sem arrastar.</p>
          {dragFeedback && <p className="text-sm mt-3 font-bold">{dragFeedback}</p>}
          {(dragIndex >= dragRounds.length - 1 && dragFeedback) && <p className="text-sm mt-2">Pontuação: {dragScore}/{dragRounds.length}</p>}
        </div>
      )}

      {mode === 'sequence' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold mb-2">🧭 Ordene a sequência de regulação</p>
          <div className="space-y-2">
            {sequenceOrder.map((step, idx) => (
              <div key={step} className={`p-2 rounded-xl text-sm flex items-center justify-between ${c('bg-slate-100', 'bg-slate-700')}`}>
                <span>{idx + 1}. {step}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveSequence(idx, -1)} className="px-2 py-1 rounded bg-slate-500 text-white text-xs">↑</button>
                  <button onClick={() => moveSequence(idx, 1)} className="px-2 py-1 rounded bg-slate-500 text-white text-xs">↓</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={checkSequence} className="w-full mt-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold">Validar sequência</button>
          {sequenceFeedback && <p className="text-sm mt-2 font-bold">{sequenceFeedback}</p>}
        </div>
      )}

      {mode === 'reflex' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold">⚡ Reflexo emocional ({reflexIndex + 1}/{reflexRounds.length})</p>
            <span className={`text-xs font-black px-2 py-1 rounded-full ${reflexTimeLeft <= 3 ? 'bg-rose-500 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>
              ⏱️ {Math.max(0, reflexTimeLeft)}s
            </span>
          </div>
          <p className="text-sm mb-3">{reflexRounds[reflexIndex].prompt}</p>
          <div className="space-y-2">
            {randomizedReflexOptions.map((op) => (
              <button key={op} onClick={() => answerReflex(op)} className={`w-full p-2 rounded-xl text-sm text-left ${c('bg-slate-100', 'bg-slate-700')}`}>{op}</button>
            ))}
          </div>
          {reflexFeedback && <p className="text-sm mt-3 font-bold">{reflexFeedback}</p>}
          {(reflexIndex >= reflexRounds.length - 1 && reflexFeedback) && <p className="text-sm mt-2">Pontuação: {reflexScore}/{reflexRounds.length}</p>}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className={`rounded-3xl p-6 max-w-sm w-full ${c('bg-white', 'bg-slate-800')}`} onClick={(e) => e.stopPropagation()}>
            <span className="text-4xl">{pills.find((p) => p.id === selected)?.emoji}</span>
            <h3 className="font-bold text-lg mt-3">{pills.find((p) => p.id === selected)?.title}</h3>
            {(() => {
                const pill = pills.find((p) => p.id === selected);
                if (!pill) return null;
                return (
                  <div>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.speechSynthesis.speaking) {
                            window.speechSynthesis.cancel();
                            return;
                          }
                          const msg = new SpeechSynthesisUtterance(pill.content + '. ' + pill.action);
                          msg.lang = 'pt-BR';
                          window.speechSynthesis.speak(msg);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${c('bg-slate-100 text-slate-700 hover:bg-slate-200', 'bg-slate-700 text-slate-200 hover:bg-slate-600')}`}
                      >
                        🔊 Ouvir (Voz do Celular)
                      </button>
                    </div>
                    <p className={`text-sm mt-3 ${c('text-slate-600', 'text-slate-300')}`}>{pill.content}</p>
                  </div>
                );
              })()}
            <div className={`mt-3 p-3 rounded-xl ${c('bg-indigo-50', 'bg-indigo-900/20')}`}>
              <p className="text-xs font-bold mb-1">Pratique agora</p>
              <p className="text-sm">{pills.find((p) => p.id === selected)?.action}</p>
            </div>

            {selected === 'luto-fases' && (
              <button
                onClick={() => onNavigate?.('tracks' as any, { highlightTrack: 'luto' })}
                className="w-full mt-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold"
              >
                Ir para Trilha de Luto
              </button>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4">
              <button onClick={() => markRead(selected)} className="py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Entendi ✓</button>
              <button onClick={() => toggleFav(selected)} className={`py-2 rounded-xl text-xs font-bold ${favorites.includes(selected) ? 'bg-amber-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{favorites.includes(selected) ? '★ Favorito' : '☆ Favoritar'}</button>
              <button onClick={runAction} className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Praticar +25XP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
