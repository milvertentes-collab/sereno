'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import { buildBadgeShareText, shareText, type SharePlatform } from '@/lib/share-utils';
import SharePlatformModal from '@/components/SharePlatformModal';
import SectionHeroCard from '@/components/SectionHeroCard';

interface UserProgress {
    meditationsCompleted: number;
    breathingCompleted: number;
    yogaCompleted: number;
    totalMinutes: number;
    streak: number;
    lastActiveDate: string;
    badgesEarned: string[];
}

interface BadgesSectionProps {
    userProgress: UserProgress;
    setUserProgress: Dispatch<SetStateAction<UserProgress>>;
    darkMode: boolean;
    embedded?: boolean;
    inlineInStats?: boolean;
}

type BadgeCategory = 'constancia' | 'praticas' | 'diario_humor' | 'autocuidado' | 'desafios_jogos';
type BadgeMetric =
    | 'streak'
    | 'habit_days'
    | 'active_habits'
    | 'practice_total'
    | 'minutes_total'
    | 'practice_types'
    | 'mood_entries'
    | 'diary_entries'
    | 'gratitude_entries'
    | 'healthy_messages'
    | 'solta_entries'
    | 'letters_total'
    | 'letters_stored'
    | 'capsules_total'
    | 'capsules_opened'
    | 'dictionary_favorites'
    | 'dictionary_history'
    | 'toxic_favorites'
    | 'toxic_train_hits'
    | 'regulation_tests'
    | 'track_rewards'
    | 'track_started'
    | 'track_steps'
    | 'challenge_completed'
    | 'challenge_active'
    | 'shared_achievements'
    | 'game_rounds'
    | 'missions_done'
    | 'xp';

type BadgeDefinition = {
    id: string;
    name: string;
    emoji: string;
    category: BadgeCategory;
    desc: string;
    metric: BadgeMetric;
    target: number;
    sourceTab: string;
    unlockText: string;
    why: string;
};

const categoryMeta: Record<BadgeCategory, { title: string; emoji: string; accent: string; light: string; dark: string; chipLight: string; chipDark: string }> = {
    constancia: {
        title: 'Constância',
        emoji: '🔥',
        accent: 'from-amber-500 to-orange-600',
        light: 'bg-amber-50 border-amber-200 text-amber-900',
        dark: 'bg-amber-950/30 border-amber-800/50 text-amber-100',
        chipLight: 'bg-amber-100 text-amber-700',
        chipDark: 'bg-amber-900/50 text-amber-300',
    },
    praticas: {
        title: 'Práticas',
        emoji: '🧘',
        accent: 'from-violet-500 to-fuchsia-600',
        light: 'bg-violet-50 border-violet-200 text-violet-900',
        dark: 'bg-violet-950/30 border-violet-800/50 text-violet-100',
        chipLight: 'bg-violet-100 text-violet-700',
        chipDark: 'bg-violet-900/50 text-violet-300',
    },
    diario_humor: {
        title: 'Diário e humor',
        emoji: '📔',
        accent: 'from-sky-500 to-cyan-600',
        light: 'bg-sky-50 border-sky-200 text-sky-900',
        dark: 'bg-sky-950/30 border-sky-800/50 text-sky-100',
        chipLight: 'bg-sky-100 text-sky-700',
        chipDark: 'bg-sky-900/50 text-sky-300',
    },
    autocuidado: {
        title: 'Autocuidado',
        emoji: '🌿',
        accent: 'from-emerald-500 to-teal-600',
        light: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        dark: 'bg-emerald-950/30 border-emerald-800/50 text-emerald-100',
        chipLight: 'bg-emerald-100 text-emerald-700',
        chipDark: 'bg-emerald-900/50 text-emerald-300',
    },
    desafios_jogos: {
        title: 'Desafios e jogos',
        emoji: '🎮',
        accent: 'from-rose-500 to-pink-600',
        light: 'bg-rose-50 border-rose-200 text-rose-900',
        dark: 'bg-rose-950/30 border-rose-800/50 text-rose-100',
        chipLight: 'bg-rose-100 text-rose-700',
        chipDark: 'bg-rose-900/50 text-rose-300',
    },
};

const allBadges: BadgeDefinition[] = [
    {
        id: 'streak_3',
        name: 'Ritmo inicial',
        emoji: '🔥',
        category: 'constancia',
        desc: 'Manteve 3 dias seguidos de cuidado.',
        metric: 'streak',
        target: 3,
        sourceTab: 'Hábitos',
        unlockText: 'Concluir hábitos por 3 dias seguidos.',
        why: 'Constância curta é o primeiro sinal de rotina sustentável.',
    },
    {
        id: 'streak_7',
        name: 'Semana firme',
        emoji: '📆',
        category: 'constancia',
        desc: 'Fechou uma semana de constância.',
        metric: 'streak',
        target: 7,
        sourceTab: 'Hábitos',
        unlockText: 'Concluir hábitos por 7 dias seguidos.',
        why: 'Mostra continuidade real, não só esforço pontual.',
    },
    {
        id: 'habit_days_15',
        name: 'Base construída',
        emoji: '🪴',
        category: 'constancia',
        desc: 'Registrou hábitos em 15 dias diferentes.',
        metric: 'habit_days',
        target: 15,
        sourceTab: 'Hábitos',
        unlockText: 'Registrar hábitos em 15 dias.',
        why: 'Sinaliza repetição suficiente para virar padrão.',
    },
    {
        id: 'streak_21',
        name: 'Ritmo consolidado',
        emoji: '🌟',
        category: 'constancia',
        desc: 'Sustentou 21 dias de sequência.',
        metric: 'streak',
        target: 21,
        sourceTab: 'Hábitos',
        unlockText: 'Concluir hábitos por 21 dias seguidos.',
        why: 'Três semanas costumam marcar uma rotina mais estável.',
    },
    {
        id: 'habit_days_45',
        name: 'Presença recorrente',
        emoji: '🗓️',
        category: 'constancia',
        desc: 'Cuidou de si em 45 dias diferentes.',
        metric: 'habit_days',
        target: 45,
        sourceTab: 'Hábitos',
        unlockText: 'Registrar hábitos em 45 dias.',
        why: 'Mostra constância distribuída no tempo, não só uma fase curta.',
    },
    {
        id: 'practice_first',
        name: 'Primeiro cuidado guiado',
        emoji: '✨',
        category: 'praticas',
        desc: 'Concluiu a primeira prática guiada.',
        metric: 'practice_total',
        target: 1,
        sourceTab: 'Práticas',
        unlockText: 'Concluir 1 prática entre respiração, meditação ou Yoga Nidra.',
        why: 'Marca a entrada real no uso terapêutico do app.',
    },
    {
        id: 'practice_all_types',
        name: 'Explorador de práticas',
        emoji: '🗺️',
        category: 'praticas',
        desc: 'Experimentou todos os tipos principais de prática.',
        metric: 'practice_types',
        target: 3,
        sourceTab: 'Práticas',
        unlockText: 'Fazer 1 respiração, 1 meditação e 1 Yoga Nidra.',
        why: 'Ajuda a descobrir qual formato regula melhor você.',
    },
    {
        id: 'minutes_120',
        name: 'Tempo investido',
        emoji: '⏱️',
        category: 'praticas',
        desc: 'Acumulou 120 minutos de prática.',
        metric: 'minutes_total',
        target: 120,
        sourceTab: 'Práticas',
        unlockText: 'Somar 120 minutos de prática no app.',
        why: 'Tempo de exposição importa para consolidar recurso interno.',
    },
    {
        id: 'practice_total_25',
        name: 'Ritual de cuidado',
        emoji: '🫶',
        category: 'praticas',
        desc: 'Completou 25 práticas guiadas.',
        metric: 'practice_total',
        target: 25,
        sourceTab: 'Práticas',
        unlockText: 'Concluir 25 práticas no total.',
        why: 'Volume de repetição aumenta familiaridade e acesso aos recursos.',
    },
    {
        id: 'minutes_300',
        name: 'Imersão serena',
        emoji: '🌙',
        category: 'praticas',
        desc: 'Acumulou 300 minutos de prática.',
        metric: 'minutes_total',
        target: 300,
        sourceTab: 'Práticas',
        unlockText: 'Somar 300 minutos de prática no app.',
        why: 'Minutagem alta costuma refletir uso consistente e aprofundado.',
    },
    {
        id: 'mood_7',
        name: 'Check-in real',
        emoji: '💙',
        category: 'diario_humor',
        desc: 'Fez 7 registros de humor.',
        metric: 'mood_entries',
        target: 7,
        sourceTab: 'Diário de Humor',
        unlockText: 'Registrar humor 7 vezes.',
        why: 'Sem repetição não há padrão emocional confiável.',
    },
    {
        id: 'diary_5',
        name: 'Memória organizada',
        emoji: '📝',
        category: 'diario_humor',
        desc: 'Escreveu 5 registros no diário.',
        metric: 'diary_entries',
        target: 5,
        sourceTab: 'Diário',
        unlockText: 'Salvar 5 registros no diário.',
        why: 'Escrever ajuda a transformar experiência em compreensão.',
    },
    {
        id: 'mood_30',
        name: 'Mapa pessoal',
        emoji: '🧠',
        category: 'diario_humor',
        desc: 'Acumulou base suficiente para padrões mais estáveis.',
        metric: 'mood_entries',
        target: 30,
        sourceTab: 'Diário de Humor',
        unlockText: 'Registrar humor 30 vezes.',
        why: 'Com mais dados, estatísticas e mapa emocional ficam mais confiáveis.',
    },
    {
        id: 'gratitude_3',
        name: 'Olhar que sustenta',
        emoji: '🌤️',
        category: 'autocuidado',
        desc: 'Registrou gratidão em 3 momentos.',
        metric: 'gratitude_entries',
        target: 3,
        sourceTab: 'Gratidão',
        unlockText: 'Salvar 3 registros de gratidão.',
        why: 'Treina percepção de apoio mesmo em dias difíceis.',
    },
    {
        id: 'solta_3',
        name: 'Peso nomeado',
        emoji: '🫧',
        category: 'autocuidado',
        desc: 'Soltou 3 registros no espaço de desabafo.',
        metric: 'solta_entries',
        target: 3,
        sourceTab: 'Solta aqui',
        unlockText: 'Salvar 3 desabafos no Solta aqui.',
        why: 'Dar nome ao que pesa já reduz carga interna.',
    },
    {
        id: 'letter_first',
        name: 'Carta iniciada',
        emoji: '💌',
        category: 'autocuidado',
        desc: 'Escreveu a primeira carta terapêutica.',
        metric: 'letters_total',
        target: 1,
        sourceTab: 'Carta Terapêutica',
        unlockText: 'Escrever 1 carta terapêutica.',
        why: 'A carta cria distância segura para elaborar o que ficou preso.',
    },
    {
        id: 'letter_stored_3',
        name: 'Gaveta emocional',
        emoji: '🗃️',
        category: 'autocuidado',
        desc: 'Guardou 3 cartas para revisitar depois.',
        metric: 'letters_stored',
        target: 3,
        sourceTab: 'Carta Terapêutica',
        unlockText: 'Guardar 3 cartas na gaveta.',
        why: 'Nem toda elaboração precisa ser descartada; algumas merecem arquivo.',
    },
    {
        id: 'capsule_first',
        name: 'Mensagem no tempo',
        emoji: '📮',
        category: 'autocuidado',
        desc: 'Selou a primeira cápsula do tempo.',
        metric: 'capsules_total',
        target: 1,
        sourceTab: 'Cápsula do Tempo',
        unlockText: 'Selar 1 cápsula do tempo.',
        why: 'Escrever para outro momento ajuda a organizar esperança e memória.',
    },
    {
        id: 'capsule_opened',
        name: 'Reencontro',
        emoji: '🕰️',
        category: 'autocuidado',
        desc: 'Abriu uma cápsula que estava aguardando você.',
        metric: 'capsules_opened',
        target: 1,
        sourceTab: 'Cápsula do Tempo',
        unlockText: 'Abrir 1 cápsula pronta.',
        why: 'Reencontrar uma mensagem sua fecha um ciclo importante.',
    },
    {
        id: 'healthy_messages_3',
        name: 'Voz interna disponível',
        emoji: '💌',
        category: 'autocuidado',
        desc: 'Criou 3 mensagens do eu saudável.',
        metric: 'healthy_messages',
        target: 3,
        sourceTab: 'Mensagem do Eu Saudável',
        unlockText: 'Escrever 3 mensagens para si.',
        why: 'Cria repertório de apoio para revisitar depois.',
    },
    {
        id: 'active_habits_5',
        name: 'Rotina própria',
        emoji: '🌱',
        category: 'autocuidado',
        desc: 'Montou uma base com 5 hábitos ativos.',
        metric: 'active_habits',
        target: 5,
        sourceTab: 'Hábitos',
        unlockText: 'Manter 5 hábitos ativos.',
        why: 'Estrutura de cuidado precisa virar rotina visível.',
    },
    {
        id: 'dictionary_fav_3',
        name: 'Vocabulário emocional',
        emoji: '📚',
        category: 'diario_humor',
        desc: 'Favoritou 3 emoções no dicionário.',
        metric: 'dictionary_favorites',
        target: 3,
        sourceTab: 'Dicionário Emocional',
        unlockText: 'Favoritar 3 emoções no dicionário.',
        why: 'Ter palavras à mão ajuda a nomear melhor o que acontece.',
    },
    {
        id: 'dictionary_history_10',
        name: 'Consulta consciente',
        emoji: '🔎',
        category: 'diario_humor',
        desc: 'Consultou 10 emoções no dicionário.',
        metric: 'dictionary_history',
        target: 10,
        sourceTab: 'Dicionário Emocional',
        unlockText: 'Abrir 10 emoções no dicionário.',
        why: 'Revisitar nuances amplia precisão emocional.',
    },
    {
        id: 'regulation_3',
        name: 'Perfil observado',
        emoji: '🧭',
        category: 'diario_humor',
        desc: 'Completou 3 leituras no Perfil de Regulação.',
        metric: 'regulation_tests',
        target: 3,
        sourceTab: 'Perfil de Regulação',
        unlockText: 'Concluir 3 testes de regulação.',
        why: 'Comparar leituras em momentos diferentes gera autoconhecimento mais útil.',
    },
    {
        id: 'games_5',
        name: 'Treino mental',
        emoji: '🎯',
        category: 'desafios_jogos',
        desc: 'Completou 5 rodadas de treino psicoeducativo.',
        metric: 'game_rounds',
        target: 5,
        sourceTab: 'Psicoeducação Gamer',
        unlockText: 'Concluir 5 rodadas entre quiz e minigames.',
        why: 'Repetição prática acelera aprendizagem aplicada.',
    },
    {
        id: 'games_20',
        name: 'Sala de treino',
        emoji: '🕹️',
        category: 'desafios_jogos',
        desc: 'Fez 20 rodadas de treino.',
        metric: 'game_rounds',
        target: 20,
        sourceTab: 'Psicoeducação Gamer',
        unlockText: 'Concluir 20 rodadas de treino.',
        why: 'Treino frequente melhora reconhecimento e resposta.',
    },
    {
        id: 'missions_7',
        name: 'Semana com direção',
        emoji: '🎯',
        category: 'desafios_jogos',
        desc: 'Concluiu 7 check-ins em missões semanais.',
        metric: 'missions_done',
        target: 7,
        sourceTab: 'Missões',
        unlockText: 'Somar 7 conclusões em missões semanais.',
        why: 'Missão funciona como estrutura externa para ganhar ritmo.',
    },
    {
        id: 'xp_500',
        name: 'Biblioteca ativa',
        emoji: '📚',
        category: 'desafios_jogos',
        desc: 'Acumulou 500 XP na psicoeducação.',
        metric: 'xp',
        target: 500,
        sourceTab: 'Psicoeducação Gamer',
        unlockText: 'Juntar 500 XP.',
        why: 'XP representa leitura, treino e repetição aplicada.',
    },
    {
        id: 'toxic_train_10',
        name: 'Leitura crítica',
        emoji: '🛡️',
        category: 'desafios_jogos',
        desc: 'Acertou 10 rodadas no treino de falas tóxicas.',
        metric: 'toxic_train_hits',
        target: 10,
        sourceTab: 'Falas Tóxicas',
        unlockText: 'Acertar 10 rodadas no treino.',
        why: 'Treinar identificação fortalece proteção emocional no dia a dia.',
    },
    {
        id: 'toxic_favorites_3',
        name: 'Resposta pronta',
        emoji: '🗣️',
        category: 'desafios_jogos',
        desc: 'Salvou 3 respostas favoritas em falas tóxicas.',
        metric: 'toxic_favorites',
        target: 3,
        sourceTab: 'Falas Tóxicas',
        unlockText: 'Marcar 3 respostas favoritas.',
        why: 'Ter resposta pronta reduz travamento na hora do limite.',
    },
    {
        id: 'track_started',
        name: 'Trilha iniciada',
        emoji: '🛤️',
        category: 'desafios_jogos',
        desc: 'Começou uma trilha temática.',
        metric: 'track_started',
        target: 1,
        sourceTab: 'Trilhas',
        unlockText: 'Avançar ao menos 1 etapa em uma trilha.',
        why: 'Trilha dá direção quando a pessoa não sabe por onde começar.',
    },
    {
        id: 'track_steps_5',
        name: 'Percurso em andamento',
        emoji: '🧭',
        category: 'desafios_jogos',
        desc: 'Avançou 5 etapas somando suas trilhas.',
        metric: 'track_steps',
        target: 5,
        sourceTab: 'Trilhas',
        unlockText: 'Concluir 5 etapas de trilhas temáticas.',
        why: 'Premia a continuidade dentro da jornada, não só o começo ou o final.',
    },
    {
        id: 'track_rewards_1',
        name: 'Trilha concluída',
        emoji: '🏁',
        category: 'desafios_jogos',
        desc: 'Concluiu a primeira trilha temática.',
        metric: 'track_rewards',
        target: 1,
        sourceTab: 'Trilhas',
        unlockText: 'Concluir 1 trilha temática.',
        why: 'Completar um percurso mostra permanência, não só início.',
    },
    {
        id: 'challenge_active_1',
        name: 'Ciclo iniciado',
        emoji: '🎯',
        category: 'desafios_jogos',
        desc: 'Iniciou o primeiro desafio de 7, 21 ou 30 dias.',
        metric: 'challenge_active',
        target: 1,
        sourceTab: 'Desafios',
        unlockText: 'Criar ou iniciar 1 desafio.',
        why: 'Um ciclo fechado dá direção e começo claro para a prática.',
    },
    {
        id: 'challenge_completed_1',
        name: 'Ciclo fechado',
        emoji: '🏁',
        category: 'desafios_jogos',
        desc: 'Concluiu o primeiro desafio completo.',
        metric: 'challenge_completed',
        target: 1,
        sourceTab: 'Desafios',
        unlockText: 'Completar 1 desafio até o final.',
        why: 'Fechar o ciclo importa tanto quanto começar.',
    },
    {
        id: 'share_1',
        name: 'Vitória compartilhada',
        emoji: '🎉',
        category: 'desafios_jogos',
        desc: 'Registrou a primeira conquista na área de compartilhar.',
        metric: 'shared_achievements',
        target: 1,
        sourceTab: 'Conquistas',
        unlockText: 'Compartilhar 1 conquista desbloqueada.',
        why: 'Nomear vitória e mostrar progresso reforça memória de competência.',
    },
];

const formatRemaining = (metric: BadgeMetric, remaining: number) => {
    if (remaining <= 0) return 'Concluída';
    switch (metric) {
        case 'minutes_total':
            return `Faltam ${remaining} min`;
        case 'streak':
            return `Faltam ${remaining} dia${remaining === 1 ? '' : 's'} seguidos`;
        case 'practice_types':
            return `Falta${remaining === 1 ? '' : 'm'} ${remaining} tipo${remaining === 1 ? '' : 's'}`;
        default:
            return `Faltam ${remaining}`;
    }
};

export default function BadgesSection({ userProgress, setUserProgress, darkMode: dm, embedded = false, inlineInStats = false }: BadgesSectionProps) {
    const [moodHistory] = useAppPersistence<any[]>('moodHistory', []);
    const [diaryEntries] = useAppPersistence<any[]>('diaryEntries', []);
    const [gratitudeEntries] = useAppPersistence<any[]>('gratitudeEntries', []);
    const [healthyMessages] = useAppPersistence<any[]>('psico_healthy_self', []);
    const [soltaEntries] = useAppPersistence<any[]>('soltaEntries', []);
    const [therapeuticLetters] = useAppPersistence<any[]>('psico_therapeutic_letters', []);
    const [timeCapsules] = useAppPersistence<any[]>('psico_time_capsule', []);
    const [dictionaryFavorites] = useAppPersistence<string[]>('psico_dictionary_favorites', []);
    const [dictionaryHistory] = useAppPersistence<string[]>('psico_dictionary_history', []);
    const [toxicFavorites] = useAppPersistence<string[]>('psico_toxic_favorites', []);
    const [bestToxicTrain] = useAppPersistence<{ hits: number; attempts: number; streak: number }>('psico_toxic_train_best', { hits: 0, attempts: 0, streak: 0 });
    const [regulationHistory] = useAppPersistence<any[]>('psico_regulation_history', []);
    const [trackProgress] = useAppPersistence<Record<string, number>>('psico_tracks_progress', {});
    const [trackRewards] = useAppPersistence<string[]>('psico_tracks_rewards', []);
    const [challenges] = useAppPersistence<Array<{ progress: number; days: number }>>('psico_challenges', []);
    const [sharedAchievements, setSharedAchievements] = useAppPersistence<string[]>('psico_shared_achievements', []);
    const [habitsReqs] = useAppPersistence<any[]>('psico_habits_reqs', []);
    const [habitsHistory] = useAppPersistence<Record<string, string[]>>('psico_habits_history', {});
    const [quizRecords] = useAppPersistence<any[]>('psico_quiz_records', []);
    const [linkRecords] = useAppPersistence<any[]>('psico_link_records', []);
    const [dragRecords] = useAppPersistence<any[]>('psico_drag_records', []);
    const [sequenceRecords] = useAppPersistence<any[]>('psico_sequence_records', []);
    const [reflexRecords] = useAppPersistence<any[]>('psico_reflex_records', []);
    const [xp] = useAppPersistence<number>('psico_xp', 0);
    const [missions] = useAppPersistence<Array<{ completions?: string[] }>>('psico_weekly_missions_v2', []);

    const c = (l: string, d: string) => (dm ? d : l);
    const [expandedCategory, setExpandedCategory] = useState<BadgeCategory | null>('constancia');
    const [shareBadgeTarget, setShareBadgeTarget] = useState<(typeof badgesWithProgress)[number] | null>(null);

    const metrics = useMemo(() => {
        const practiceTotal = (userProgress.meditationsCompleted || 0) + (userProgress.breathingCompleted || 0) + (userProgress.yogaCompleted || 0);
        const practiceTypes = [
            userProgress.meditationsCompleted > 0,
            userProgress.breathingCompleted > 0,
            userProgress.yogaCompleted > 0,
        ].filter(Boolean).length;
        const habitDays = Object.values(habitsHistory).filter((ids) => Array.isArray(ids) && ids.length > 0).length;
        const gameRounds = quizRecords.length + linkRecords.length + dragRecords.length + sequenceRecords.length + reflexRecords.length;
        const missionsDone = missions.reduce((sum, mission) => sum + (mission.completions?.length || 0), 0);
        const lettersStored = therapeuticLetters.filter((entry) => entry?.status === 'guardada' || entry?.savedAction === 'guardar').length;
        const capsulesOpened = timeCapsules.filter((entry) => entry?.openedAt || entry?.opened === true).length;
        const trackStarted = Object.values(trackProgress).filter((value) => typeof value === 'number' && value > 0).length;
        const trackSteps = Object.values(trackProgress).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
        const challengeCompleted = challenges.filter((item) => typeof item?.days === 'number' && item.progress >= item.days).length;

        return {
            streak: userProgress.streak || 0,
            habit_days: habitDays,
            active_habits: habitsReqs.length,
            practice_total: practiceTotal,
            minutes_total: userProgress.totalMinutes || 0,
            practice_types: practiceTypes,
            mood_entries: moodHistory.length,
            diary_entries: diaryEntries.length,
            gratitude_entries: gratitudeEntries.length,
            healthy_messages: healthyMessages.length,
            solta_entries: soltaEntries.length,
            letters_total: therapeuticLetters.length,
            letters_stored: lettersStored,
            capsules_total: timeCapsules.length,
            capsules_opened: capsulesOpened,
            dictionary_favorites: dictionaryFavorites.length,
            dictionary_history: dictionaryHistory.length,
            toxic_favorites: toxicFavorites.length,
            toxic_train_hits: bestToxicTrain.hits || 0,
            regulation_tests: regulationHistory.length,
            track_rewards: trackRewards.length,
            track_started: trackStarted,
            track_steps: trackSteps,
            challenge_completed: challengeCompleted,
            challenge_active: challenges.length,
            shared_achievements: sharedAchievements.length,
            game_rounds: gameRounds,
            missions_done: missionsDone,
            xp: xp || 0,
        } satisfies Record<BadgeMetric, number>;
    }, [userProgress, habitsHistory, habitsReqs.length, moodHistory.length, diaryEntries.length, gratitudeEntries.length, healthyMessages.length, soltaEntries.length, therapeuticLetters, timeCapsules, dictionaryFavorites.length, dictionaryHistory.length, toxicFavorites.length, bestToxicTrain.hits, regulationHistory.length, trackRewards.length, trackProgress, challenges, sharedAchievements.length, quizRecords.length, linkRecords.length, dragRecords.length, sequenceRecords.length, reflexRecords.length, missions, xp]);

    const badgesWithProgress = useMemo(() => {
        return allBadges.map((badge) => {
            const current = metrics[badge.metric];
            const unlocked = current >= badge.target;
            const ratio = Math.max(0, Math.min(100, (current / badge.target) * 100));
            const remaining = Math.max(0, badge.target - current);
            return {
                ...badge,
                current,
                unlocked,
                ratio,
                remaining,
            };
        });
    }, [metrics]);

    const earned = badgesWithProgress.filter((badge) => badge.unlocked);
    const locked = badgesWithProgress.filter((badge) => !badge.unlocked);
    const earnedIds = useMemo(() => earned.map((badge) => badge.id).sort(), [earned]);
    const nextBadge = useMemo(() => {
        return [...locked].sort((a, b) => b.ratio - a.ratio || a.remaining - b.remaining)[0] || null;
    }, [locked]);
    const grouped = useMemo(() => {
        return (Object.keys(categoryMeta) as BadgeCategory[]).map((category) => ({
            category,
            items: badgesWithProgress.filter((badge) => badge.category === category),
        }));
    }, [badgesWithProgress]);

    useEffect(() => {
        const prevIds = [...(userProgress.badgesEarned || [])].sort();
        if (JSON.stringify(prevIds) === JSON.stringify(earnedIds)) return;
        setUserProgress((prev) => ({ ...prev, badgesEarned: earnedIds }));
    }, [earnedIds, setUserProgress, userProgress.badgesEarned]);

    const totalEarned = earned.length;
    const totalLocked = locked.length;
    const shareBadge = async (badge: (typeof badgesWithProgress)[number], platform: SharePlatform) => {
        if (!badge.unlocked) return;
        await shareText(buildBadgeShareText(badge.name, badge.desc), platform);
        if (!sharedAchievements.includes(badge.id)) {
            setSharedAchievements([...sharedAchievements, badge.id]);
        }
    };

    return (
        <div className={`${embedded ? (inlineInStats ? 'mt-0' : 'mt-3') : 'p-4 animate-fade-in pb-24'} max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            {embedded && !inlineInStats ? (
                <div className={`mb-4 px-1`}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-600', 'text-amber-300')}`}>Marcos do seu cuidado</p>
                            <h3 className={`mt-1 text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>Conquistas</h3>
                        </div>
                        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-2xl ${c('bg-amber-50 border border-amber-100', 'bg-amber-500/10 border border-amber-500/20')}`}>
                            🏆
                        </span>
                    </div>
                </div>
            ) : (
                <div className="pt-4 mb-6">
                    <SectionHeroCard
                        darkMode={dm}
                        eyebrow="Seu progresso"
                        title="Conquistas"
                        description="O que já foi desbloqueado, o que está perto e por que cada conquista existe."
                        icon="🏆"
                    />

                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <SummaryCard darkMode={dm} title="Ganhas" value={String(totalEarned)} hint={`${allBadges.length} no total`} tone="emerald" />
                        <SummaryCard darkMode={dm} title="Faltam" value={String(totalLocked)} hint="a desbloquear" tone="slate" />
                        <SummaryCard
                            darkMode={dm}
                            title="Mais perto"
                            value={nextBadge ? `${Math.round(nextBadge.ratio)}%` : '100%'}
                            hint={nextBadge ? nextBadge.name : 'tudo concluído'}
                            tone="violet"
                        />
                    </div>
                </div>
            )}

            {embedded && (
                <>
                    <div className={`grid ${inlineInStats ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-4`}>
                        <SummaryCard darkMode={dm} title="Ganhas" value={String(totalEarned)} hint={`${allBadges.length} no total`} tone="emerald" />
                        <SummaryCard darkMode={dm} title="Faltam" value={String(totalLocked)} hint="a desbloquear" tone="slate" />
                        {!inlineInStats && (
                            <SummaryCard
                                darkMode={dm}
                                title="Mais perto"
                                value={nextBadge ? `${Math.round(nextBadge.ratio)}%` : '100%'}
                                hint={nextBadge ? nextBadge.name : 'tudo concluído'}
                                tone="violet"
                            />
                        )}
                    </div>
                    {!inlineInStats && <div className={`rounded-2xl border p-4 mb-5 ${c('bg-slate-50 border-slate-100 text-slate-700', 'bg-slate-900/40 border-slate-800 text-slate-300')}`}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>De onde elas vêm</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40')}`}>Hábitos</span>
                            <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-violet-100 text-violet-700', 'bg-violet-950/40 text-violet-300 border border-violet-800/40')}`}>Missões</span>
                            <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/40')}`}>Práticas</span>
                            <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-sky-100 text-sky-700', 'bg-sky-950/40 text-sky-300 border border-sky-800/40')}`}>Humor</span>
                            <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${c('bg-amber-100 text-amber-700', 'bg-amber-950/40 text-amber-300 border border-amber-800/40')}`}>Trilhas</span>
                        </div>
                    </div>}
                </>
            )}

            <div className={`rounded-3xl border p-5 mb-5 ${c('bg-white border-slate-200', 'bg-slate-900/70 border-slate-800')}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-500', 'text-slate-400')}`}>{embedded ? 'Mais perto agora' : 'Próxima conquista'}</p>
                        <h3 className={`mt-2 text-xl font-black ${c('text-slate-900', 'text-slate-100')}`}>
                            {nextBadge ? `${nextBadge.emoji} ${nextBadge.name}` : 'Coleção concluída'}
                        </h3>
                        <p className={`mt-2 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>
                            {nextBadge ? nextBadge.why : 'Todas as conquistas atuais já foram liberadas.'}
                        </p>
                    </div>
                    <div className={`shrink-0 rounded-2xl px-3 py-2 text-right ${c('bg-slate-100', 'bg-slate-800')}`}>
                        <p className="text-lg font-black">{nextBadge ? `${nextBadge.current}/${nextBadge.target}` : `${totalEarned}/${allBadges.length}`}</p>
                        <p className={`text-[10px] font-bold uppercase ${c('text-slate-500', 'text-slate-400')}`}>
                            {nextBadge ? formatRemaining(nextBadge.metric, nextBadge.remaining) : 'completo'}
                        </p>
                    </div>
                </div>
                {nextBadge && (
                    <>
                        <div className={`mt-4 h-2.5 rounded-full overflow-hidden ${c('bg-slate-100', 'bg-slate-800')}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${nextBadge.ratio}%` }} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <InfoPill darkMode={dm} label="Como libera" value={nextBadge.unlockText} />
                            <InfoPill darkMode={dm} label="Onde encontrar" value={nextBadge.sourceTab} />
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-4">
                {grouped.map(({ category, items }) => {
                    const meta = categoryMeta[category];
                    const unlockedCount = items.filter((item) => item.unlocked).length;
                    const isExpanded = expandedCategory === category;
                    return (
                        <section key={category} className={`rounded-3xl border overflow-hidden ${c('bg-white border-slate-200', 'bg-slate-900/60 border-slate-800')}`}>
                            <button
                                type="button"
                                onClick={() => setExpandedCategory((prev) => (prev === category ? null : category))}
                                className="w-full text-left p-5"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${meta.accent} flex items-center justify-center text-2xl shadow-lg shadow-black/10`}>
                                            {meta.emoji}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={`text-lg font-black ${c('text-slate-900', 'text-slate-100')}`}>{meta.title}</h3>
                                            <p className={`text-sm ${c('text-slate-600', 'text-slate-400')}`}>
                                                {unlockedCount}/{items.length} desbloqueadas
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${dm ? meta.chipDark : meta.chipLight}`}>
                                            {Math.round((unlockedCount / items.length) * 100)}%
                                        </span>
                                        <p className={`mt-2 text-sm ${c('text-slate-500', 'text-slate-400')}`}>{isExpanded ? '▲' : '▼'}</p>
                                    </div>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-5 pb-5">
                                    <div className="grid gap-3">
                                        {items.map((badge) => (
                                            <article
                                                key={badge.id}
                                                className={`rounded-3xl border p-4 transition-all ${
                                                    badge.unlocked
                                                        ? `${dm ? meta.dark : meta.light} shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)]`
                                                        : c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-800')
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                                                            badge.unlocked
                                                                ? `bg-gradient-to-br ${meta.accent} text-white ring-4 ${dm ? 'ring-white/5' : 'ring-white/80'}`
                                                                : c('bg-slate-200 text-slate-500', 'bg-slate-800 text-slate-400')
                                                        }`}>
                                                            {badge.unlocked ? badge.emoji : '🔒'}
                                                            {badge.unlocked && (
                                                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] shadow-sm text-amber-500">
                                                                    ✦
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className={`font-black ${c('text-slate-900', 'text-slate-100')}`}>{badge.name}</h4>
                                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${dm ? meta.chipDark : meta.chipLight}`}>
                                                                    {badge.unlocked ? 'Marco conquistado' : 'Em progresso'}
                                                                </span>
                                                            </div>
                                                            <p className={`mt-1 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{badge.desc}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-base font-black">{badge.current}/{badge.target}</p>
                                                        <p className={`text-[10px] font-bold uppercase ${c('text-slate-500', 'text-slate-400')}`}>
                                                            {formatRemaining(badge.metric, badge.remaining)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className={`mt-4 h-2.5 rounded-full overflow-hidden ${c('bg-slate-200', 'bg-slate-800')}`}>
                                                    <div className={`h-full rounded-full ${badge.unlocked ? `bg-gradient-to-r ${meta.accent}` : 'bg-slate-400'}`} style={{ width: `${badge.ratio}%` }} />
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 mt-4 text-xs">
                                                    {badge.unlocked ? (
                                                        <>
                                                            <DetailRow darkMode={dm} label="O que isso marca" value={badge.why} />
                                                            <DetailRow darkMode={dm} label="De onde veio" value={badge.sourceTab} />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DetailRow darkMode={dm} label="Como liberar" value={badge.unlockText} />
                                                            <DetailRow darkMode={dm} label="Por que importa" value={badge.why} />
                                                            <DetailRow darkMode={dm} label="Onde avançar" value={badge.sourceTab} />
                                                        </>
                                                    )}
                                                    {badge.unlocked && (
                                                        <button
                                                            onClick={() => setShareBadgeTarget(badge)}
                                                            className="w-full py-2.5 rounded-2xl text-sm font-bold bg-violet-600 text-white shadow-[0_14px_30px_-18px_rgba(124,58,237,0.8)]"
                                                        >
                                                            Compartilhar
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
            <SharePlatformModal
                open={!!shareBadgeTarget}
                darkMode={dm}
                title={shareBadgeTarget ? shareBadgeTarget.name : 'Compartilhar conquista'}
                onSelect={(platform) => {
                    if (shareBadgeTarget) shareBadge(shareBadgeTarget, platform);
                    setShareBadgeTarget(null);
                }}
                onClose={() => setShareBadgeTarget(null)}
            />
        </div>
    );
}

function SummaryCard({ darkMode, title, value, hint, tone }: { darkMode: boolean; title: string; value: string; hint: string; tone: 'emerald' | 'slate' | 'violet' }) {
    const tones = {
        emerald: darkMode ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100' : 'bg-emerald-50 border-emerald-200 text-emerald-900',
        slate: darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900',
        violet: darkMode ? 'bg-violet-950/30 border-violet-800/40 text-violet-100' : 'bg-violet-50 border-violet-200 text-violet-900',
    };

    return (
        <div className={`rounded-3xl border p-4 ${tones[tone]}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{title}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
            <p className="mt-1 text-xs opacity-75">{hint}</p>
        </div>
    );
}

function InfoPill({ darkMode, label, value }: { darkMode: boolean; label: string; value: string }) {
    return (
        <div className={`rounded-2xl border p-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
            <p className={`mt-1 text-sm font-semibold leading-relaxed ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{value}</p>
        </div>
    );
}

function DetailRow({ darkMode, label, value }: { darkMode: boolean; label: string; value: string }) {
    return (
        <div className={`rounded-2xl border px-3 py-2.5 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{label}</p>
            <p className={`mt-1 text-sm leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{value}</p>
        </div>
    );
}
