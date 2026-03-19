'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import AppNoticeModal from './AppNoticeModal';
import SectionHeroCard from './SectionHeroCard';

type LoveLanguage = 'words' | 'service' | 'gifts' | 'time' | 'touch';
type ContextType = 'romantico' | 'amizade' | 'familia' | 'autocuidado';
type AssessmentMode = 'geral' | 'casal' | 'familia';

type Question = {
  id: string;
  text: string;
  context: ContextType;
  options: { label: string; value: LoveLanguage }[];
};

const questionBank: Record<AssessmentMode, { receiving: Question[]; offering: Question[] }> = {
geral: {
receiving: [
  {
    id: 'gr1',
    context: 'romantico',
    text: 'Em relação amorosa, eu me sinto mais visto(a) quando...',
    options: [
      { label: 'Recebo palavras claras de afeto e admiração.', value: 'words' },
      { label: 'A pessoa toma atitudes concretas para me aliviar.', value: 'service' },
      { label: 'A pessoa lembra de mim com um gesto simbólico.', value: 'gifts' },
      { label: 'Temos tempo real juntos, sem distração.', value: 'time' },
      { label: 'Recebo carinho físico e proximidade.', value: 'touch' },
    ],
  },
  {
    id: 'gr2',
    context: 'amizade',
    text: 'Numa amizade, o que mais me faz sentir cuidado é...',
    options: [
      { label: 'Ouvir que sou importante e valorizado(a).', value: 'words' },
      { label: 'Perceber ajuda prática quando estou sobrecarregado(a).', value: 'service' },
      { label: 'Receber uma lembrança ou mimo pensado para mim.', value: 'gifts' },
      { label: 'Ter presença e tempo de verdade.', value: 'time' },
      { label: 'Receber abraço, toque ou calor físico.', value: 'touch' },
    ],
  },
  {
    id: 'gr3',
    context: 'familia',
    text: 'Na família, eu costumo sentir amor principalmente quando...',
    options: [
      { label: 'Expressam carinho e reconhecimento em palavras.', value: 'words' },
      { label: 'Se disponibilizam para ajudar sem eu precisar insistir.', value: 'service' },
      { label: 'Lembram de mim com gestos concretos e simbólicos.', value: 'gifts' },
      { label: 'Param para conviver comigo com atenção real.', value: 'time' },
      { label: 'Demonstram afeto com abraço e proximidade.', value: 'touch' },
    ],
  },
  {
    id: 'gr4',
    context: 'autocuidado',
    text: 'Quando estou fragilizado(a), o que mais me regula é...',
    options: [
      { label: 'Ouvir palavras seguras e acolhedoras.', value: 'words' },
      { label: 'Ter menos peso prático nas costas.', value: 'service' },
      { label: 'Receber algo simbólico que me lembre de cuidado.', value: 'gifts' },
      { label: 'Ter companhia calma e sem pressa.', value: 'time' },
      { label: 'Ter toque reconfortante e presença corporal.', value: 'touch' },
    ],
  },
  {
    id: 'gr5',
    context: 'romantico',
    text: 'Quando alguém quer reparar uma falha comigo, o que mais me alcança é...',
    options: [
      { label: 'Escutar reconhecimento sincero do erro.', value: 'words' },
      { label: 'Ver uma mudança prática no comportamento.', value: 'service' },
      { label: 'Receber um gesto simbólico de reparação.', value: 'gifts' },
      { label: 'Ter uma conversa com tempo e presença.', value: 'time' },
      { label: 'Receber acolhimento físico respeitoso.', value: 'touch' },
    ],
  },
],
offering: [
  {
    id: 'go1',
    context: 'romantico',
    text: 'Quando quero demonstrar amor, eu tendo a...',
    options: [
      { label: 'Falar o quanto a pessoa é importante para mim.', value: 'words' },
      { label: 'Resolver algo que vai facilitar o dia dela.', value: 'service' },
      { label: 'Dar algo simbólico para demonstrar lembrança.', value: 'gifts' },
      { label: 'Separar tempo e presença só para nós.', value: 'time' },
      { label: 'Demonstrar afeto por toque e proximidade.', value: 'touch' },
    ],
  },
  {
    id: 'go2',
    context: 'amizade',
    text: 'Com amigos, meu jeito mais natural de cuidado costuma ser...',
    options: [
      { label: 'Elogiar, incentivar e reafirmar qualidades.', value: 'words' },
      { label: 'Ajudar concretamente no que estiver pesando.', value: 'service' },
      { label: 'Levar uma lembrança ou mimo.', value: 'gifts' },
      { label: 'Oferecer tempo e escuta dedicados.', value: 'time' },
      { label: 'Ser caloroso(a) no contato físico.', value: 'touch' },
    ],
  },
  {
    id: 'go3',
    context: 'familia',
    text: 'Na família, geralmente eu demonstro cuidado por...',
    options: [
      { label: 'Palavras de orgulho, gratidão e carinho.', value: 'words' },
      { label: 'Ações úteis e resolução de problemas.', value: 'service' },
      { label: 'Gestos e lembranças simbólicas.', value: 'gifts' },
      { label: 'Tempo junto com atenção de verdade.', value: 'time' },
      { label: 'Afeto físico e proximidade constante.', value: 'touch' },
    ],
  },
  {
    id: 'go4',
    context: 'autocuidado',
    text: 'Quando tento me cuidar melhor, eu tendo a...',
    options: [
      { label: 'Me lembrar verbalmente do que mereço.', value: 'words' },
      { label: 'Organizar minha vida para ficar menos pesado.', value: 'service' },
      { label: 'Me dar pequenos mimos ou símbolos de carinho.', value: 'gifts' },
      { label: 'Reservar tempo protegido para mim.', value: 'time' },
      { label: 'Cuidar do corpo com presença e suavidade.', value: 'touch' },
    ],
  },
  {
    id: 'go5',
    context: 'romantico',
    text: 'Quando quero me reconciliar com alguém, minha tendência é...',
    options: [
      { label: 'Falar bastante e explicar o que sinto.', value: 'words' },
      { label: 'Compensar com ações concretas.', value: 'service' },
      { label: 'Levar um gesto simbólico de aproximação.', value: 'gifts' },
      { label: 'Chamar para conversar com calma e presença.', value: 'time' },
      { label: 'Buscar proximidade e afeto físico.', value: 'touch' },
    ],
  },
],
},
casal: {
receiving: [
  {
    id: 'cr1',
    context: 'romantico',
    text: 'No casal, eu me sinto mais amado(a) quando...',
    options: [
      { label: 'A pessoa verbaliza o que sente e reconhece meu valor.', value: 'words' },
      { label: 'A pessoa age para me aliviar ou me apoiar na prática.', value: 'service' },
      { label: 'Recebo gestos simbólicos de lembrança e intenção.', value: 'gifts' },
      { label: 'Temos tempo exclusivo e presença sem distração.', value: 'time' },
      { label: 'Recebo carinho físico e proximidade afetiva.', value: 'touch' },
    ],
  },
  {
    id: 'cr2',
    context: 'romantico',
    text: 'Depois de um dia difícil no relacionamento, o que mais me regula é...',
    options: [
      { label: 'Ouvir palavras claras de acolhimento e segurança.', value: 'words' },
      { label: 'Perceber atitudes concretas de reparo.', value: 'service' },
      { label: 'Receber um gesto simbólico de reconexão.', value: 'gifts' },
      { label: 'Ter uma conversa com calma e presença.', value: 'time' },
      { label: 'Receber abraço, toque ou proximidade física.', value: 'touch' },
    ],
  },
  {
    id: 'cr3',
    context: 'romantico',
    text: 'Quando penso em intimidade, o que mais me faz sentir conexão é...',
    options: [
      { label: 'Escutar verbalizações de afeto e desejo.', value: 'words' },
      { label: 'Ver cuidado prático e atenção ao meu bem-estar.', value: 'service' },
      { label: 'Receber símbolos de carinho e lembrança.', value: 'gifts' },
      { label: 'Ter tempo juntos com foco real um no outro.', value: 'time' },
      { label: 'Perceber calor corporal, toque e proximidade.', value: 'touch' },
    ],
  },
  {
    id: 'cr4',
    context: 'romantico',
    text: 'Quando existe conflito, eu me sinto mais reparado(a) se...',
    options: [
      { label: 'A pessoa coloca em palavras o que reconheceu.', value: 'words' },
      { label: 'A pessoa muda algo concreto no comportamento.', value: 'service' },
      { label: 'A pessoa traz um gesto simbólico de reparação.', value: 'gifts' },
      { label: 'Sentamos e damos tempo real para a conversa.', value: 'time' },
      { label: 'Existe acolhimento físico respeitoso.', value: 'touch' },
    ],
  },
  {
    id: 'cr5',
    context: 'romantico',
    text: 'No dia a dia do casal, eu costumo ler amor principalmente quando...',
    options: [
      { label: 'Existe admiração verbal e carinho expresso.', value: 'words' },
      { label: 'Existe ajuda prática espontânea.', value: 'service' },
      { label: 'Existem detalhes simbólicos de lembrança.', value: 'gifts' },
      { label: 'Existe convivência com qualidade.', value: 'time' },
      { label: 'Existe toque e proximidade frequentes.', value: 'touch' },
    ],
  },
],
offering: [
  {
    id: 'co1',
    context: 'romantico',
    text: 'No casal, quando quero amar melhor, eu tendo a...',
    options: [
      { label: 'Falar, elogiar e reafirmar sentimentos.', value: 'words' },
      { label: 'Fazer algo que alivie a rotina do outro.', value: 'service' },
      { label: 'Levar um gesto simbólico ou presente.', value: 'gifts' },
      { label: 'Reservar tempo exclusivo para nós.', value: 'time' },
      { label: 'Buscar proximidade física e carinho.', value: 'touch' },
    ],
  },
  {
    id: 'co2',
    context: 'romantico',
    text: 'Quando quero reparar uma falha no vínculo, eu normalmente...',
    options: [
      { label: 'Explico o que sinto e valido a dor do outro.', value: 'words' },
      { label: 'Tento compensar com mudança concreta.', value: 'service' },
      { label: 'Levo algo simbólico para reaproximar.', value: 'gifts' },
      { label: 'Crio espaço e tempo para reconexão.', value: 'time' },
      { label: 'Busco acolher pelo toque e presença física.', value: 'touch' },
    ],
  },
  {
    id: 'co3',
    context: 'romantico',
    text: 'Quando a outra pessoa está sobrecarregada, meu gesto mais natural é...',
    options: [
      { label: 'Falar com carinho, incentivo e segurança.', value: 'words' },
      { label: 'Assumir algo prático para ajudar.', value: 'service' },
      { label: 'Trazer algo que simbolize cuidado.', value: 'gifts' },
      { label: 'Ficar junto com presença e escuta.', value: 'time' },
      { label: 'Dar colo, abraço ou toque regulador.', value: 'touch' },
    ],
  },
  {
    id: 'co4',
    context: 'romantico',
    text: 'Quando quero reforçar intimidade no casal, eu costumo...',
    options: [
      { label: 'Usar palavras de afeto e desejo.', value: 'words' },
      { label: 'Criar condições práticas de cuidado.', value: 'service' },
      { label: 'Planejar um gesto simbólico especial.', value: 'gifts' },
      { label: 'Criar tempo de qualidade e conexão.', value: 'time' },
      { label: 'Me aproximar fisicamente com carinho.', value: 'touch' },
    ],
  },
  {
    id: 'co5',
    context: 'romantico',
    text: 'Quando quero demonstrar constância no amor, eu tendo a...',
    options: [
      { label: 'Repetir verbalmente que a pessoa é importante.', value: 'words' },
      { label: 'Ser útil e presente nas pequenas demandas.', value: 'service' },
      { label: 'Marcar datas e símbolos com intenção.', value: 'gifts' },
      { label: 'Manter tempo de presença com regularidade.', value: 'time' },
      { label: 'Manter carinho físico no cotidiano.', value: 'touch' },
    ],
  },
],
},
familia: {
receiving: [
  {
    id: 'fr1',
    context: 'familia',
    text: 'Na família, eu me sinto mais amado(a) quando...',
    options: [
      { label: 'Escuto reconhecimento, orgulho e carinho em palavras.', value: 'words' },
      { label: 'Percebo ajuda prática sem precisar implorar.', value: 'service' },
      { label: 'Recebo gestos simbólicos que mostram lembrança.', value: 'gifts' },
      { label: 'Existe convivência com atenção real.', value: 'time' },
      { label: 'Existe afeto físico acolhedor e respeitoso.', value: 'touch' },
    ],
  },
  {
    id: 'fr2',
    context: 'familia',
    text: 'Quando estou fragilizado(a) em casa, o que mais me alcança é...',
    options: [
      { label: 'Ouvir palavras de apoio e validação.', value: 'words' },
      { label: 'Ter ajuda concreta no que está pesado.', value: 'service' },
      { label: 'Receber um gesto simbólico de cuidado.', value: 'gifts' },
      { label: 'Ter companhia calma e tempo junto.', value: 'time' },
      { label: 'Receber abraço ou proximidade acolhedora.', value: 'touch' },
    ],
  },
  {
    id: 'fr3',
    context: 'familia',
    text: 'Quando penso em família funcional, o cuidado que mais me marca é...',
    options: [
      { label: 'Comunicação afetuosa e clara.', value: 'words' },
      { label: 'Cooperação prática no dia a dia.', value: 'service' },
      { label: 'Pequenos gestos e símbolos de lembrança.', value: 'gifts' },
      { label: 'Presença de verdade nos momentos importantes.', value: 'time' },
      { label: 'Calor físico, abraço e contato respeitoso.', value: 'touch' },
    ],
  },
  {
    id: 'fr4',
    context: 'familia',
    text: 'Quando há conflito familiar, o que mais me faz sentir reparo é...',
    options: [
      { label: 'Ouvir reconhecimento sincero do erro.', value: 'words' },
      { label: 'Ver mudança prática no comportamento.', value: 'service' },
      { label: 'Receber um gesto simbólico de reconciliação.', value: 'gifts' },
      { label: 'Ter uma conversa com tempo e escuta.', value: 'time' },
      { label: 'Perceber reaproximação física segura.', value: 'touch' },
    ],
  },
  {
    id: 'fr5',
    context: 'familia',
    text: 'Na rotina da família, eu costumo ler amor principalmente quando...',
    options: [
      { label: 'Existe reconhecimento verbal no cotidiano.', value: 'words' },
      { label: 'Existe ajuda concreta e participação real.', value: 'service' },
      { label: 'Existem detalhes simbólicos de lembrança.', value: 'gifts' },
      { label: 'Existe tempo junto com qualidade.', value: 'time' },
      { label: 'Existe proximidade física e carinho.', value: 'touch' },
    ],
  },
],
offering: [
  {
    id: 'fo1',
    context: 'familia',
    text: 'Na família, meu jeito mais natural de demonstrar amor é...',
    options: [
      { label: 'Falar com carinho, reconhecimento e gratidão.', value: 'words' },
      { label: 'Resolver, organizar e ajudar na prática.', value: 'service' },
      { label: 'Levar lembranças ou gestos simbólicos.', value: 'gifts' },
      { label: 'Estar presente de verdade nos momentos juntos.', value: 'time' },
      { label: 'Demonstrar afeto com toque e proximidade.', value: 'touch' },
    ],
  },
  {
    id: 'fo2',
    context: 'familia',
    text: 'Quando um familiar está mal, minha primeira tendência é...',
    options: [
      { label: 'Tentar acolher em palavras e encorajar.', value: 'words' },
      { label: 'Fazer algo concreto para aliviar a situação.', value: 'service' },
      { label: 'Oferecer um gesto simbólico de cuidado.', value: 'gifts' },
      { label: 'Parar e ficar junto com atenção.', value: 'time' },
      { label: 'Dar abraço, colo ou proximidade física.', value: 'touch' },
    ],
  },
  {
    id: 'fo3',
    context: 'familia',
    text: 'Quando quero reforçar vínculo familiar, eu costumo...',
    options: [
      { label: 'Expressar verbalmente apreço e afeto.', value: 'words' },
      { label: 'Demonstrar cuidado com ações úteis.', value: 'service' },
      { label: 'Criar gestos simbólicos e datas especiais.', value: 'gifts' },
      { label: 'Promover convivência com presença.', value: 'time' },
      { label: 'Ser caloroso(a) no contato físico.', value: 'touch' },
    ],
  },
  {
    id: 'fo4',
    context: 'familia',
    text: 'Quando existe tensão em casa, eu geralmente tento reparar por...',
    options: [
      { label: 'Conversa e verbalização do que foi importante.', value: 'words' },
      { label: 'Mudança concreta de atitude.', value: 'service' },
      { label: 'Um gesto simbólico de reconciliação.', value: 'gifts' },
      { label: 'Criar espaço de convivência e escuta.', value: 'time' },
      { label: 'Reaproximação física respeitosa.', value: 'touch' },
    ],
  },
  {
    id: 'fo5',
    context: 'familia',
    text: 'No cotidiano familiar, eu mais demonstro constância por...',
    options: [
      { label: 'Palavras frequentes de presença e afeto.', value: 'words' },
      { label: 'Ajuda prática e participação nas tarefas.', value: 'service' },
      { label: 'Pequenos gestos e símbolos recorrentes.', value: 'gifts' },
      { label: 'Tempo dedicado para estar junto.', value: 'time' },
      { label: 'Afeto físico presente no dia a dia.', value: 'touch' },
    ],
  },
],
},
};

const contextLabels: Record<ContextType, string> = {
  romantico: 'Relação amorosa',
  amizade: 'Amizade',
  familia: 'Família',
  autocuidado: 'Autocuidado',
};

const languageDescriptions: Record<LoveLanguage, {
  name: string;
  emoji: string;
  receive: string;
  offer: string;
  ask: string;
  give: string;
  mismatch: string;
  selfCare: string;
}> = {
  words: {
    name: 'Palavras de Afirmação',
    emoji: '🗣️',
    receive: 'Você tende a se sentir amado(a) quando recebe reconhecimento verbal claro, segurança emocional em palavras e mensagens de presença.',
    offer: 'Você costuma demonstrar afeto falando, elogiando, incentivando e verbalizando o valor do outro.',
    ask: 'Peça de forma direta: "Quando puder, me diga com clareza o que você sente ou valoriza em mim."',
    give: 'Ofereça palavras específicas, não genéricas. Nomear qualidades e esforços costuma ter mais efeito do que frases prontas.',
    mismatch: 'O desencontro aparece quando você entrega palavras e o outro espera gestos, ou quando precisa ouvir algo claro e recebe só ação silenciosa.',
    selfCare: 'Em autocuidado, isso pode virar frases-âncora, oração, escrita compassiva ou mensagens do eu saudável.',
  },
  service: {
    name: 'Atos de Serviço',
    emoji: '🛠️',
    receive: 'Você tende a sentir amor quando percebe que alguém torna sua vida mais leve de forma concreta.',
    offer: 'Seu afeto aparece muito em resolver, organizar, facilitar e ajudar de modo prático.',
    ask: 'Peça com clareza: "O que mais me ajuda agora é uma ação concreta, como..."',
    give: 'Ofereça ajuda específica e realista. Pequenas ações consistentes costumam valer mais do que grandes promessas.',
    mismatch: 'O desencontro aparece quando você faz muito pelo outro, mas a pessoa queria escuta, tempo ou fala afetiva.',
    selfCare: 'Em autocuidado, isso pode virar simplificar rotinas, aliviar carga, preparar refeições ou deixar o ambiente mais seguro.',
  },
  gifts: {
    name: 'Presentes',
    emoji: '🎁',
    receive: 'Você lê amor em gestos simbólicos que mostram lembrança, intenção e significado.',
    offer: 'Você costuma demonstrar afeto por objetos, cartas, lembranças e detalhes concretos que carregam mensagem.',
    ask: 'Peça sem culpa: "Para mim, gestos simbólicos importam porque me fazem sentir lembrado(a)."',
    give: 'O valor está menos no preço e mais no significado. Um detalhe bem pensado comunica mais do que algo grande e genérico.',
    mismatch: 'O desencontro aparece quando o gesto simbólico é interpretado como superficial, ou quando você não se sente lembrado(a) em datas e momentos importantes.',
    selfCare: 'Em autocuidado, isso pode virar um objeto-âncora, carta para si, mimo intencional ou ritual simbólico.',
  },
  time: {
    name: 'Tempo de Qualidade',
    emoji: '⏳',
    receive: 'Você costuma se sentir amado(a) quando alguém está realmente presente, com atenção sem dispersão.',
    offer: 'Seu afeto aparece em presença, escuta, convivência e disponibilidade emocional com foco real.',
    ask: 'Peça com nitidez: "Eu preciso de tempo com presença, sem celular ou pressa."',
    give: 'Ofereça presença inteira. Para quem valoriza essa linguagem, distração constante costuma soar como distância.',
    mismatch: 'O desencontro aparece quando existe contato, mas sem atenção real. Estar perto não substitui presença.',
    selfCare: 'Em autocuidado, isso pode virar tempo protegido para si, pausa sem tela, diário ou prática guiada com continuidade.',
  },
  touch: {
    name: 'Toque Físico',
    emoji: '🫂',
    receive: 'Você se regula e se sente amado(a) por proximidade corporal, abraço, toque acolhedor e sensação de presença física.',
    offer: 'Você costuma demonstrar afeto com calor, proximidade, carinho físico e linguagem corporal.',
    ask: 'Peça respeitando contexto e consentimento: "Quando fizer sentido, o toque me ajuda a me sentir mais seguro(a)."',
    give: 'Ofereça toque de forma respeitosa e combinada. Aqui a qualidade do consentimento importa tanto quanto o gesto.',
    mismatch: 'O desencontro aparece quando você busca proximidade física e o outro recua, ou quando o vínculo oferece fala, mas não calor corporal.',
    selfCare: 'Em autocuidado, isso pode virar banho quente, massagem, coberta, abraço em si, grounding corporal e presença física suave.',
  },
};

const getCounts = (answers: Record<string, LoveLanguage>) =>
  Object.values(answers).reduce((acc, lang) => {
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<LoveLanguage, number>);

const rankLanguages = (answers: Record<string, LoveLanguage>) =>
  Object.entries(getCounts(answers))
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({ lang: lang as LoveLanguage, count }));

export default function LoveLanguagesSection({
  darkMode: dm,
  onNavigate,
  registerBackHandler,
}: {
  darkMode?: boolean;
  onNavigate?: (tab: any, params?: Record<string, any>) => void;
  registerBackHandler?: ((handler: (() => boolean) | null) => void);
}) {
  const [history, setHistory] = useAppPersistence<Array<{
    id: number;
    mode: AssessmentMode;
    primaryReceive: LoveLanguage;
    secondaryReceive?: LoveLanguage;
    primaryOffer: LoveLanguage;
    secondaryOffer?: LoveLanguage;
    receivingAnswers: Record<string, LoveLanguage>;
    offeringAnswers: Record<string, LoveLanguage>;
    selectedContext: ContextType;
    createdAt: string;
  }>>('psico_love_languages_history', []);
  const [currentStep, setCurrentStep] = useState<'intro' | 'receiving' | 'offering' | 'results'>('intro');
  const [receivingAnswers, setReceivingAnswers] = useState<Record<string, LoveLanguage>>({});
  const [offeringAnswers, setOfferingAnswers] = useState<Record<string, LoveLanguage>>({});
  const [selectedContext, setSelectedContext] = useState<ContextType>('romantico');
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('geral');
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [noticeMessage, setNoticeMessage] = useState('');
  const activeQuestions = questionBank[assessmentMode];
  const safeHistory = useMemo(() => {
    return (history || []).map((item) => ({
      id: typeof item?.id === 'number' ? item.id : Date.now(),
      mode: (item?.mode === 'casal' || item?.mode === 'familia' || item?.mode === 'geral') ? item.mode : 'geral',
      primaryReceive: item?.primaryReceive || 'words',
      secondaryReceive: item?.secondaryReceive,
      primaryOffer: item?.primaryOffer || 'words',
      secondaryOffer: item?.secondaryOffer,
      receivingAnswers: item?.receivingAnswers && typeof item.receivingAnswers === 'object' ? item.receivingAnswers : {},
      offeringAnswers: item?.offeringAnswers && typeof item.offeringAnswers === 'object' ? item.offeringAnswers : {},
      selectedContext: (item?.selectedContext && contextLabels[item.selectedContext as ContextType]) ? item.selectedContext as ContextType : 'romantico',
      createdAt: item?.createdAt || new Date().toISOString(),
    }));
  }, [history]);

  const c = (l: string, d: string) => (dm ? d : l);

  useEffect(() => {
    if (!registerBackHandler) return;
    const handler = () => {
      if (currentStep === 'results') {
        setSelectedHistoryId(null);
        setCurrentStep('intro');
        return true;
      }
      if (currentStep === 'offering') {
        setCurrentStep('receiving');
        return true;
      }
      if (currentStep === 'receiving') {
        setCurrentStep('intro');
        return true;
      }
      return false;
    };
    registerBackHandler(handler);
    return () => registerBackHandler(null);
  }, [registerBackHandler, currentStep]);

  const handleAnswer = (type: 'receiving' | 'offering', qId: string, value: LoveLanguage) => {
    if (type === 'receiving') setReceivingAnswers((prev) => ({ ...prev, [qId]: value }));
    else setOfferingAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const receivingRank = useMemo(() => rankLanguages(receivingAnswers), [receivingAnswers]);
  const offeringRank = useMemo(() => rankLanguages(offeringAnswers), [offeringAnswers]);
  const selectedHistory = useMemo(
    () => (selectedHistoryId ? safeHistory.find((item) => item.id === selectedHistoryId) || null : null),
    [safeHistory, selectedHistoryId]
  );
  const primaryReceive = selectedHistory?.primaryReceive || receivingRank[0]?.lang || null;
  const secondaryReceive = selectedHistory?.secondaryReceive || receivingRank[1]?.lang || null;
  const primaryOffer = selectedHistory?.primaryOffer || offeringRank[0]?.lang || null;
  const secondaryOffer = selectedHistory?.secondaryOffer || offeringRank[1]?.lang || null;

  const contextReading = useMemo<LoveLanguage | null>(() => {
    if (selectedHistory) {
      return selectedHistory.primaryReceive || selectedHistory.primaryOffer || null;
    }
    const source = currentStep === 'results' ? { ...receivingAnswers, ...offeringAnswers } : receivingAnswers;
    const items = [...activeQuestions.receiving, ...activeQuestions.offering]
      .filter((q) => q.context === selectedContext)
      .map((q) => source[q.id])
      .filter(Boolean) as LoveLanguage[];
    const ranked = rankLanguages(Object.fromEntries(items.map((value, index) => [String(index), value])));
    return ranked[0]?.lang || primaryReceive || primaryOffer || null;
  }, [selectedContext, receivingAnswers, offeringAnswers, currentStep, primaryReceive, primaryOffer, activeQuestions, selectedHistory]);

  const nextSection = () => {
    if (Object.keys(receivingAnswers).length < activeQuestions.receiving.length) {
      setNoticeMessage('Responda todas as perguntas da primeira parte antes de avançar.');
      return;
    }
    setCurrentStep('offering');
  };

  const showResults = () => {
    if (Object.keys(offeringAnswers).length < activeQuestions.offering.length) {
      setNoticeMessage('Responda todas as perguntas da segunda parte antes de ver o resultado.');
      return;
    }
    if (primaryReceive && primaryOffer) {
      const snapshot = {
        id: Date.now(),
        mode: assessmentMode,
        primaryReceive,
        secondaryReceive: secondaryReceive || undefined,
        primaryOffer,
        secondaryOffer: secondaryOffer || undefined,
        receivingAnswers,
        offeringAnswers,
        selectedContext,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [snapshot, ...prev.filter((item) => item.id !== snapshot.id)].slice(0, 12));
      setSelectedHistoryId(snapshot.id);
    }
    setCurrentStep('results');
  };

  if (currentStep === 'intro') {
    return (
      <>
        <AppNoticeModal
          open={Boolean(noticeMessage)}
          title="Ainda falta um passo"
          message={noticeMessage}
          onClose={() => setNoticeMessage('')}
          darkMode={dm}
          icon="💖"
          eyebrow="Linguagens do Amor"
        />
        <div className={`p-4 sm:p-6 pb-32 min-h-screen overflow-x-hidden ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-rose-50 via-white to-white text-slate-900'}`}>
        <div className="pt-4 max-w-lg mx-auto">
          <SectionHeroCard
            darkMode={dm}
            eyebrow="Afeto e reconhecimento"
            title="Linguagens do Amor"
            description="Entenda combinação, contexto e como isso muda sua leitura dos vínculos."
            icon="💖"
          />
        </div>

        <div className={`max-w-lg mx-auto mt-6 rounded-3xl border p-4 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Foco da leitura</p>
          <div className={`grid grid-cols-3 gap-2 mt-3 rounded-3xl p-2 ${c('bg-slate-100', 'bg-slate-900')}`}>
            {([
              ['geral', 'Geral'],
              ['casal', 'Casal'],
              ['familia', 'Família'],
            ] as Array<[AssessmentMode, string]>).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setAssessmentMode(mode)}
                className={`px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.14em] ${assessmentMode === mode ? 'bg-rose-500 text-white' : c('text-slate-600', 'text-slate-400')}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={`mt-3 text-sm ${c('text-slate-600', 'text-slate-400')}`}>
            {assessmentMode === 'geral' && 'Leitura ampla para perceber sua dinâmica afetiva de forma geral.'}
            {assessmentMode === 'casal' && 'Foco maior em relação amorosa, desencontros e pedidos dentro do vínculo.'}
            {assessmentMode === 'familia' && 'Foco maior em família, convivência, cuidado e forma de reconhecimento.'}
          </p>
        </div>

        <div className={`max-w-lg mx-auto mt-6 rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Se quiser seguir daqui</p>
          <div className="grid gap-3 mt-4">
            <IntroCard darkMode={!!dm} title="Modo Casal" text="Quando a leitura afetiva precisa virar check-in, pedido de apoio ou reparo no vínculo." />
            <IntroCard darkMode={!!dm} title="Modo Família" text="Quando o desencontro aparece em convivência, expectativa e forma de cuidado em casa." />
            <IntroCard darkMode={!!dm} title="Método dos 5 Dedos" text="Quando você já entendeu o que precisa e agora quer estruturar uma conversa difícil." />
            <IntroCard darkMode={!!dm} title="O Poder do NÃO" text="Quando a necessidade afetiva pede um limite claro, sem culpa e sem agressividade." />
          </div>
        </div>

        <div className={`max-w-lg mx-auto mt-6 rounded-3xl border p-5 ${c('bg-white border-rose-100', 'bg-slate-800/80 border-slate-700')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-rose-500', 'text-rose-300')}`}>O que entra na leitura</p>
          <div className="grid gap-3 mt-4">
            <IntroCard darkMode={!!dm} title="Predominante e secundária" text="Você vai ver a linguagem mais forte e a segunda mais provável, em vez de um resultado rígido demais." />
            <IntroCard darkMode={!!dm} title="Receber e oferecer" text="O teste separa como você gosta de receber afeto e como costuma demonstrar cuidado." />
            <IntroCard darkMode={!!dm} title="Contexto relacional" text="A leitura também considera amor, amizade, família e autocuidado." />
            <IntroCard darkMode={!!dm} title="Aplicação prática" text="No final, a guia mostra como pedir isso com clareza, como oferecer ao outro e como ler desencontros sem culpa." />
          </div>
        </div>

        <button
          onClick={() => setCurrentStep('receiving')}
          onClickCapture={() => setSelectedHistoryId(null)}
          className={`w-full max-w-lg mx-auto mt-6 block py-5 rounded-3xl font-extrabold text-white ${dm ? 'bg-gradient-to-r from-rose-600 to-pink-600' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`}
        >
          Começar leitura
        </button>

        {safeHistory.length > 0 && (
          <div className={`max-w-lg mx-auto mt-6 rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Histórico recente</p>
            <div className="space-y-3 mt-4">
              {safeHistory.slice(0, 3).map((item) => (
                <div key={item.id} className={`rounded-2xl p-4 ${c('bg-slate-50', 'bg-slate-900')}`}>
                  <button
                    onClick={() => {
                      setAssessmentMode(item.mode);
                      setReceivingAnswers(item.receivingAnswers || {});
                      setOfferingAnswers(item.offeringAnswers || {});
                      setSelectedContext(item.selectedContext);
                      setSelectedHistoryId(item.id);
                      setCurrentStep('results');
                    }}
                    className="w-full text-left"
                  >
                    <p className="text-sm font-black">{new Date(item.createdAt).toLocaleDateString('pt-BR')} • {item.mode === 'geral' ? 'Geral' : item.mode === 'casal' ? 'Casal' : 'Família'}</p>
                    <p className={`mt-1 text-sm ${c('text-slate-600', 'text-slate-400')}`}>Receber: {languageDescriptions[item.primaryReceive].name} • Oferecer: {languageDescriptions[item.primaryOffer].name}</p>
                    <p className={`mt-2 text-[11px] font-black uppercase tracking-[0.14em] ${c('text-rose-500', 'text-rose-300')}`}>Abrir análise completa</p>
                  </button>
                  <button
                    onClick={() => {
                      setHistory((prev) => prev.filter((entry) => entry.id !== item.id));
                      if (selectedHistoryId === item.id) {
                        setSelectedHistoryId(null);
                        setCurrentStep('intro');
                      }
                    }}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-rose-600 text-white"
                  >
                    Excluir do histórico
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </>
    );
  }

  if (currentStep === 'results' && primaryReceive && primaryOffer) {
    const rx = languageDescriptions[primaryReceive];
    const tx = languageDescriptions[primaryOffer];
    const rx2 = secondaryReceive ? languageDescriptions[secondaryReceive] : null;
    const tx2 = secondaryOffer ? languageDescriptions[secondaryOffer] : null;
    const contextLang = contextReading ? languageDescriptions[contextReading] : null;
    const compareSeries = [
      { lang: 'words' as LoveLanguage, receive: receivingRank.find((item) => item.lang === 'words')?.count || 0, offer: offeringRank.find((item) => item.lang === 'words')?.count || 0 },
      { lang: 'service' as LoveLanguage, receive: receivingRank.find((item) => item.lang === 'service')?.count || 0, offer: offeringRank.find((item) => item.lang === 'service')?.count || 0 },
      { lang: 'gifts' as LoveLanguage, receive: receivingRank.find((item) => item.lang === 'gifts')?.count || 0, offer: offeringRank.find((item) => item.lang === 'gifts')?.count || 0 },
      { lang: 'time' as LoveLanguage, receive: receivingRank.find((item) => item.lang === 'time')?.count || 0, offer: offeringRank.find((item) => item.lang === 'time')?.count || 0 },
      { lang: 'touch' as LoveLanguage, receive: receivingRank.find((item) => item.lang === 'touch')?.count || 0, offer: offeringRank.find((item) => item.lang === 'touch')?.count || 0 },
    ];
    const resultDraft = [
      `Leitura de Linguagens do Amor (${assessmentMode === 'geral' ? 'Geral' : assessmentMode === 'casal' ? 'Casal' : 'Família'})`,
      `Receber: ${rx.name}${rx2 ? ` | Secundária: ${rx2.name}` : ''}`,
      `Oferecer: ${tx.name}${tx2 ? ` | Secundária: ${tx2.name}` : ''}`,
      primaryReceive === primaryOffer
        ? 'Receber e oferecer apareceram na mesma linguagem principal.'
        : `Existe diferença entre como recebo (${rx.name}) e como ofereço (${tx.name}).`,
      contextLang ? `No contexto de ${contextLabels[selectedContext].toLowerCase()}, a linguagem que mais apareceu foi ${contextLang.name}.` : '',
    ].filter(Boolean).join('\n');

    return (
      <>
        <AppNoticeModal
          open={Boolean(noticeMessage)}
          title="Ainda falta um passo"
          message={noticeMessage}
          onClose={() => setNoticeMessage('')}
          darkMode={dm}
          icon="💖"
          eyebrow="Linguagens do Amor"
        />
        <div className={`p-6 pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-rose-50 via-white to-white text-slate-900'}`}>
        <div className="max-w-xl mx-auto">
          <div className="text-center pt-4 mb-6">
            <h2 className="text-4xl font-black tracking-tight">Sua leitura relacional</h2>
            <p className={`mt-2 text-sm font-medium ${c('text-slate-600', 'text-slate-400')}`}>Predominante, secundária, contexto e aplicações práticas.</p>
          </div>

          <div className="grid gap-4">
            <ResultCard
              darkMode={!!dm}
              title="Como você gosta de receber"
              emoji={rx.emoji}
              name={rx.name}
              body={rx.receive}
              secondary={rx2 ? `Secundária provável: ${rx2.name}.` : 'Ainda não apareceu uma segunda linguagem forte.'}
              tone="rose"
            />
            <ResultCard
              darkMode={!!dm}
              title="Como você tende a oferecer"
              emoji={tx.emoji}
              name={tx.name}
              body={tx.offer}
              secondary={tx2 ? `Secundária provável: ${tx2.name}.` : 'Ainda não apareceu uma segunda linguagem forte.'}
              tone="violet"
            />

            <div className={`rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Contexto do vínculo</p>
                  <h3 className="mt-2 text-lg font-black">Onde isso aparece mais</h3>
                </div>
                <div className={`grid grid-cols-2 gap-2 sm:flex sm:flex-wrap rounded-3xl p-2 w-full sm:w-auto ${c('bg-slate-100', 'bg-slate-900')}`}>
                  {(Object.keys(contextLabels) as ContextType[]).map((ctx) => (
                    <button
                      key={ctx}
                      onClick={() => setSelectedContext(ctx)}
                      className={`min-w-0 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.14em] text-center break-words leading-tight ${selectedContext === ctx ? 'bg-rose-500 text-white' : c('text-slate-600', 'text-slate-400')}`}
                    >
                      {contextLabels[ctx]}
                    </button>
                  ))}
                </div>
              </div>
              <p className={`mt-4 text-sm leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                {contextLang
                  ? `No contexto de ${contextLabels[selectedContext].toLowerCase()}, a linguagem que mais apareceu foi ${contextLang.name}. Isso não significa exclusividade, mas mostra onde você tende a perceber ou expressar cuidado com mais força.`
                  : 'Ainda não há leitura suficiente para esse contexto.'}
              </p>
            </div>

            <div className={`rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Comparação visual</p>
              <h3 className="mt-2 text-lg font-black">Como recebo x como ofereço</h3>
              <div className="space-y-4 mt-4">
                {compareSeries.map((item) => (
                  <div key={item.lang}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-bold">{languageDescriptions[item.lang].name}</p>
                      <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${c('text-slate-500', 'text-slate-400')}`}>
                        {item.receive} x {item.offer}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-1 ${c('text-rose-500', 'text-rose-300')}`}>Receber</p>
                        <div className={`h-2 rounded-full ${c('bg-slate-100', 'bg-slate-900')}`}>
                          <div className="h-2 rounded-full bg-rose-500" style={{ width: `${(item.receive / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-1 ${c('text-violet-500', 'text-violet-300')}`}>Oferecer</p>
                        <div className={`h-2 rounded-full ${c('bg-slate-100', 'bg-slate-900')}`}>
                          <div className="h-2 rounded-full bg-violet-500" style={{ width: `${(item.offer / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <PracticalCard
              darkMode={!!dm}
              title="Como isso aparece em você"
              items={[
                `Receber: ${rx.receive}`,
                `Oferecer: ${tx.offer}`,
                primaryReceive === primaryOffer
                  ? 'Você tende a oferecer afeto de uma forma muito parecida com a que gostaria de receber.'
                  : `Existe diferença entre receber (${rx.name}) e oferecer (${tx.name}), o que pode gerar desencontro se isso não for nomeado.`,
              ]}
            />

            <PracticalCard
              darkMode={!!dm}
              title="Como pedir isso com clareza"
              items={[
                rx.ask,
                tx.ask,
              ]}
            />

            <PracticalCard
              darkMode={!!dm}
              title="Como oferecer isso ao outro"
              items={[
                rx.give,
                tx.give,
              ]}
            />

            <PracticalCard
              darkMode={!!dm}
              title="Como perceber desencontro sem culpa"
              items={[
                rx.mismatch,
                tx.mismatch,
                'Diferença de linguagem não significa falta de amor. Muitas vezes significa apenas que o vínculo está falando em códigos diferentes.',
              ]}
            />

            <PracticalCard
              darkMode={!!dm}
              title="Como levar isso adiante"
              items={[
                'Casal: use essa leitura para nomear necessidades e desencontros de forma menos defensiva.',
                'Família: observe como você lê cuidado dentro da casa, sem supor que todo mundo demonstra amor do mesmo jeito.',
                'Assertividade: transforme necessidade afetiva em pedido claro, sem cobrança implícita.',
                'Carta Terapêutica: escreva o que faltou receber e o que você ainda gostaria de pedir ou reparar.',
                'Diário: registre situações em que você se sentiu visto(a) ou não, e por qual linguagem isso passou.',
                `Autocuidado: ${rx.selfCare}`,
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
              onClick={() => {
                setSelectedHistoryId(null);
                if (typeof window !== 'undefined') window.localStorage.setItem('psico_love_languages_last', resultDraft);
              }}
                className={`py-4 rounded-2xl font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}
              >
                Salvar no histórico
              </button>
              <button
              onClick={() => {
                setSelectedHistoryId(null);
                if (typeof window !== 'undefined' && navigator.clipboard?.writeText) navigator.clipboard.writeText(resultDraft);
              }}
                className="py-4 rounded-2xl font-bold bg-rose-500 text-white"
              >
                Copiar leitura
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => {
                setSelectedHistoryId(null);
                if (typeof window !== 'undefined') window.localStorage.setItem('psico_love_languages_last', resultDraft);
                onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: resultDraft, diaryDraftKey: Date.now() });
              }}
              className="py-4 rounded-2xl font-bold bg-indigo-600 text-white"
            >
              Levar para o Diário
            </button>
            <button
              onClick={() => {
                setSelectedHistoryId(null);
                if (typeof window !== 'undefined') window.localStorage.setItem('psico_love_languages_last', resultDraft);
                onNavigate?.('carta', { cartaDraft: resultDraft, cartaDraftKey: Date.now(), cartaType: 'personalizada' });
              }}
              className="py-4 rounded-2xl font-bold bg-fuchsia-600 text-white"
            >
              Levar para Carta
            </button>
          </div>

          <div className={`mt-6 rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Próximo passo</p>
            <div className="grid gap-3 mt-4">
              <button onClick={() => onNavigate?.('couple')} className="w-full rounded-2xl bg-rose-600 px-4 py-4 text-left text-white">
                <p className="text-sm font-black">Modo Casal</p>
                <p className="mt-1 text-sm text-rose-50/90">Para transformar essa leitura em conversa, pedido e reparo a dois.</p>
              </button>
              <button onClick={() => onNavigate?.('family')} className="w-full rounded-2xl bg-amber-500 px-4 py-4 text-left text-slate-950">
                <p className="text-sm font-black">Modo Família</p>
                <p className="mt-1 text-sm text-slate-900/80">Para ler como cuidado e reconhecimento aparecem dentro da convivência.</p>
              </button>
              <button onClick={() => onNavigate?.('fivefingers')} className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-left text-white">
                <p className="text-sm font-black">Método dos 5 Dedos</p>
                <p className="mt-1 text-sm text-indigo-50/90">Para organizar a conversa quando você já sabe o que quer pedir.</p>
              </button>
              <button onClick={() => onNavigate?.('assertiveness')} className="w-full rounded-2xl bg-rose-700 px-4 py-4 text-left text-white">
                <p className="text-sm font-black">O Poder do NÃO</p>
                <p className="mt-1 text-sm text-rose-50/90">Para transformar necessidade afetiva em limite claro, sem cobrança implícita.</p>
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentStep('intro');
              setSelectedHistoryId(null);
              setReceivingAnswers({});
              setOfferingAnswers({});
              setSelectedContext('romantico');
            }}
            className={`w-full mt-6 py-4 rounded-2xl font-bold ${c('bg-white border border-slate-200 text-slate-700', 'bg-slate-800 border border-slate-700 text-slate-200')}`}
          >
            Refazer leitura
          </button>
        </div>
        </div>
      </>
    );
  }

  const isReceivingStep = currentStep === 'receiving';
  const questions = isReceivingStep ? activeQuestions.receiving : activeQuestions.offering;
  const answers = isReceivingStep ? receivingAnswers : offeringAnswers;
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <>
      <AppNoticeModal
        open={Boolean(noticeMessage)}
        title="Ainda falta um passo"
        message={noticeMessage}
        onClose={() => setNoticeMessage('')}
        darkMode={dm}
        icon="💖"
        eyebrow="Linguagens do Amor"
      />
      <div className={`p-4 pb-32 max-w-xl mx-auto min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`rounded-3xl border p-5 mb-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>
              {currentStep === 'receiving' ? 'Parte 1' : 'Parte 2'}
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {currentStep === 'receiving' ? 'Como você recebe afeto' : 'Como você oferece afeto'}
            </h2>
            <p className={`mt-2 text-sm ${c('text-slate-600', 'text-slate-400')}`}>
              {currentStep === 'receiving'
                ? `Aqui o foco é o que faz você se sentir amado(a), reconhecido(a) ou cuidado(a) no modo ${assessmentMode === 'geral' ? 'geral' : assessmentMode === 'casal' ? 'casal' : 'família'}.`
                : `Agora o foco é o seu jeito mais natural de demonstrar amor, cuidado e reparação no modo ${assessmentMode === 'geral' ? 'geral' : assessmentMode === 'casal' ? 'casal' : 'família'}.`}
            </p>
          </div>
          <div className={`shrink-0 rounded-2xl px-4 py-3 text-right ${c('bg-slate-100', 'bg-slate-900')}`}>
            <p className="text-xl font-black">{answeredCount}/{questions.length}</p>
            <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${c('text-slate-500', 'text-slate-400')}`}>respondidas</p>
          </div>
        </div>
        <div className={`mt-4 h-2 rounded-full ${c('bg-slate-100', 'bg-slate-900')}`}>
          <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className={`rounded-3xl border p-5 ${c('bg-white border-slate-200', 'bg-slate-800/80 border-slate-700')}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Pergunta {idx + 1}</p>
                <h3 className="mt-2 text-lg font-black leading-snug">{q.text}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black ${c('bg-rose-100 text-rose-700', 'bg-rose-950/40 text-rose-300')}`}>{contextLabels[q.context]}</span>
            </div>

            <div className="space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleAnswer(isReceivingStep ? 'receiving' : 'offering', q.id, opt.value)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    answers[q.id] === opt.value
                      ? (dm ? 'bg-rose-950/30 border-rose-500 text-rose-100' : 'bg-rose-50 border-rose-400 text-rose-900')
                      : (dm ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')
                  }`}
                >
                  <span className="text-sm font-medium leading-relaxed">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={currentStep === 'receiving' ? nextSection : showResults}
        className={`w-full mt-6 py-5 rounded-3xl font-extrabold text-white ${dm ? 'bg-gradient-to-r from-rose-600 to-pink-600' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`}
      >
        {currentStep === 'receiving' ? 'Ir para como você oferece' : 'Ver leitura completa'}
      </button>
      </div>
    </>
  );
}

function IntroCard({ darkMode, title, text }: { darkMode: boolean; title: string; text: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
      <p className="text-sm font-black leading-tight">{title}</p>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function ResultCard({
  darkMode,
  title,
  emoji,
  name,
  body,
  secondary,
  tone,
}: {
  darkMode: boolean;
  title: string;
  emoji: string;
  name: string;
  body: string;
  secondary: string;
  tone: 'rose' | 'violet';
}) {
  const toneCls = tone === 'rose'
    ? (darkMode ? 'bg-rose-950/20 border-rose-800/40 text-rose-100' : 'bg-rose-50 border-rose-200 text-rose-900')
    : (darkMode ? 'bg-violet-950/20 border-violet-800/40 text-violet-100' : 'bg-violet-50 border-violet-200 text-violet-900');

  return (
    <div className={`rounded-3xl border p-5 overflow-hidden ${toneCls}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-75">{title}</p>
      <div className="flex items-center gap-3 mt-3 min-w-0">
        <span className="text-4xl shrink-0">{emoji}</span>
        <h3 className="text-2xl font-black break-words leading-tight min-w-0">{name}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed break-words">{body}</p>
      <p className="mt-3 text-sm font-semibold opacity-90 break-words">{secondary}</p>
    </div>
  );
}

function PracticalCard({ darkMode, title, items }: { darkMode: boolean; title: string; items: string[] }) {
  return (
    <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-500">Aplicação</p>
      <h3 className="mt-2 text-lg font-black">{title}</h3>
      <div className="space-y-3 mt-4">
        {items.map((item) => (
          <div key={item} className={`rounded-2xl p-4 text-sm leading-relaxed ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
