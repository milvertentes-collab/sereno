'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cancelBrowserSpeech, speakBrowserText } from '@/lib/browserSpeech';
import AppNoticeModal from './AppNoticeModal';
import SectionHeroCard from './SectionHeroCard';

interface Props { darkMode?: boolean; desktopMode?: boolean; onNavigate?: (tab: any, params?: Record<string, any>) => void; onComplete?: (eventId: string, minutes?: number) => void; isPro?: boolean; onShowUpgrade?: () => void }
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

type QuizQuestion = {
  id: string;
  theme: Theme;
  question: string;
  options: string[];
  answer: string;
  sourceTitle: string;
};

type QuizConcept = {
  key: string;
  theme: Theme;
  title: string;
  prompts: [string, string, string, string];
  correct: string;
  wrong: [string, string, string];
};

type QuizRecord = {
  id: string;
  createdAt: string;
  length: 10 | 20 | 40;
  source: 'mixed' | 'theme' | 'recommended';
  themes: Theme[];
  correct: number;
  total: number;
  accuracy: number;
};

type LinkRecord = {
  id: string;
  createdAt: string;
  length: 16 | 33 | 65;
  correct: number;
  total: number;
  accuracy: number;
};

type DragRecord = {
  id: string;
  createdAt: string;
  length: 12 | 25 | 50;
  correct: number;
  total: number;
  accuracy: number;
};

type SequenceRecord = {
  id: string;
  createdAt: string;
  length: 12 | 25 | 50;
  correct: number;
  total: number;
  accuracy: number;
};

type ReflexRecord = {
  id: string;
  createdAt: string;
  length: 12 | 25 | 50;
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Ultra';
  correct: number;
  total: number;
  accuracy: number;
  avgTime: number;
  bestTime: number;
};

const pills: Pill[] = [
  { id: 'ansiedade', title: 'O que é Ansiedade?', emoji: '🌀', theme: 'ansiedade', content: 'Ansiedade é uma resposta natural do corpo a ameaças percebidas. O problema surge quando ela aparece sem perigo real e trava sua rotina.', action: 'Faça 1 minuto de respiração 4-4-6.', quiz: { question: 'Ansiedade sempre é ruim?', options: ['Sim, sempre', 'Não, pode ser adaptativa', 'Só em adultos', 'Só existe quando há pânico'], answer: 'Não, pode ser adaptativa' } },
  { id: 'luto-fases', title: 'As Fases do Luto', emoji: '🕊️', theme: 'relacionamentos', content: 'Modelo de Elisabeth Kübler-Ross (1969), originalmente descrito para pacientes terminais e hoje aplicado a perdas significativas (morte, separação, demissão).\n\n1) 🚫 Negação: “Isso não pode estar acontecendo comigo.”\nMecanismo de defesa que amortece o choque e dá tempo para adaptação emocional.\n\n2) 😡 Raiva: “Por que comigo? Não é justo!”\nSurgem frustração e ressentimento, que podem ser direcionados a si, aos outros, a Deus ou à situação.\n\n3) 🤝 Barganha: “Se eu fizer isso, talvez mude...”\nTentativa de recuperar controle com pensamentos “e se...” e “se ao menos...”.\n\n4) 😔 Depressão: “Não consigo seguir em frente.”\nTristeza profunda ao reconhecer a irreversibilidade da perda; pede cuidado e apoio.\n\n5) 🌱 Aceitação: “Vai doer, mas posso continuar.”\nNão é esquecer: é integrar a perda e reconstruir significado com o tempo.\n\nImportante: as fases não são lineares e podem alternar.', action: 'Perceba em qual fase você está hoje e escolha uma ação gentil de cuidado para este momento.', quiz: { question: 'As fases do luto acontecem em ordem fixa para todas as pessoas?', options: ['Sim, sempre na mesma ordem', 'Não, podem variar e se alternar', 'Só valem para luto por morte', 'Desaparecem em poucos dias'], answer: 'Não, podem variar e se alternar' } },
  { id: 'tcc', title: 'O que é TCC?', emoji: '🧠', theme: 'cognitivo', content: 'A TCC ajuda a identificar pensamentos automáticos e substituí-los por interpretações mais realistas.', action: 'Anote um pensamento automático e uma reformulação.', quiz: { question: 'Na TCC, foco principal é:', options: ['Mudar pensamentos e comportamentos', 'Ignorar emoções', 'Somente medicamentos', 'Apenas reviver o passado'], answer: 'Mudar pensamentos e comportamentos' } },
  { id: 'apego', title: 'Estilos de Apego', emoji: '🤝', theme: 'relacionamentos', content: 'Apego seguro, ansioso ou evitativo influencia como nos conectamos e reagimos no amor.', action: 'Observe seu padrão em 1 conflito recente.', quiz: { question: 'Apego influencia relações?', options: ['Não', 'Sim, bastante', 'Só na infância', 'Só em relações familiares'], answer: 'Sim, bastante' } },
  { id: 'mindfulness', title: 'Mindfulness', emoji: '🧘', theme: 'autocuidado', content: 'Mindfulness é atenção ao presente sem julgamento. Reduz estresse e melhora regulação emocional.', action: 'Faça 60 segundos de atenção na respiração.', quiz: { question: 'Mindfulness é:', options: ['Fugir dos pensamentos', 'Presença sem julgamento', 'Pensar no futuro', 'Desligar todas as emoções'], answer: 'Presença sem julgamento' } },
  { id: 'grounding', title: 'Grounding 5-4-3-2-1', emoji: '🌍', theme: 'crise', content: 'Técnica para trazer o foco ao presente durante crise: 5 vê, 4 ouve, 3 toca, 2 cheira, 1 aprecia.', action: 'Faça grounding agora por 1 minuto.', quiz: { question: 'Grounding ajuda a:', options: ['Aumentar pânico', 'Voltar ao presente', 'Dormir imediatamente', 'Apagar memórias difíceis'], answer: 'Voltar ao presente' } },
  { id: 'respiracao', title: 'Respiração Diafragmática', emoji: '🌬️', theme: 'ansiedade', content: 'Respirar pelo diafragma ativa o sistema parassimpático e reduz resposta de alerta.', action: 'Faça 5 ciclos lentos com a barriga.', quiz: { question: 'Respiração diafragmática tende a:', options: ['Acalmar o corpo', 'Acelerar coração', 'Não ter efeito', 'Aumentar tensão muscular'], answer: 'Acalmar o corpo' } },
  { id: 'autocompaixao', title: 'Autocompaixão', emoji: '💜', theme: 'autocuidado', content: 'É tratar-se com gentileza nos momentos difíceis, sem autopunição.', action: 'Escreva uma frase gentil para você.', quiz: { question: 'Autocompaixão é:', options: ['Fraqueza', 'Autocuidado emocional', 'Autopiedade total', 'Passar pano para tudo'], answer: 'Autocuidado emocional' } },
  { id: 'limites', title: 'Limites Saudáveis', emoji: '🚧', theme: 'relacionamentos', content: 'Limites definem o que é aceitável para você. Dizer não protege energia e vínculos.', action: 'Defina 1 limite claro para hoje.', quiz: { question: 'Limite saudável significa:', options: ['Agradar todos', 'Proteger seu bem-estar', 'Evitar pessoas', 'Nunca discordar'], answer: 'Proteger seu bem-estar' } },
  { id: 'gatilhos', title: 'Gatilhos Emocionais', emoji: '⚡', theme: 'crise', content: 'Gatilhos disparam reações intensas. Reconhecer padrões reduz impulsividade.', action: 'Identifique um gatilho da semana.', quiz: { question: 'Primeiro passo com gatilho:', options: ['Reagir rápido', 'Reconhecer o gatilho', 'Se culpar', 'Aumentar a discussão'], answer: 'Reconhecer o gatilho' } },
  { id: 'janela', title: 'Janela de Tolerância', emoji: '🪟', theme: 'cognitivo', content: 'É a faixa em que você consegue sentir emoções sem se desregular totalmente.', action: 'Perceba se você está dentro/fora da janela hoje.', quiz: { question: 'Fora da janela de tolerância você tende a:', options: ['Regular fácil', 'Hiper ou hipo ativar', 'Nada muda', 'Dormir melhor'], answer: 'Hiper ou hipo ativar' } },
  { id: 'ruminacao', title: 'Ruminação', emoji: '🔁', theme: 'cognitivo', content: 'Ruminar é girar no mesmo pensamento sem resolver. Aumenta ansiedade e cansaço.', action: 'Troque 1 ruminação por ação de 5 minutos.', quiz: { question: 'Ruminação geralmente:', options: ['Resolve rápido', 'Aumenta desgaste', 'Melhora foco', 'Traz descanso imediato'], answer: 'Aumenta desgaste' } },
  { id: 'burnout', title: 'Sinais de Burnout', emoji: '🔥', theme: 'autocuidado', content: 'Exaustão, cinismo e baixa eficácia são sinais clássicos. Pausas estratégicas são essenciais.', action: 'Faça um check de energia (0-10).', quiz: { question: 'Burnout inclui:', options: ['Só preguiça', 'Exaustão emocional crônica', 'Falta de talento', 'Ausência completa de sentimentos'], answer: 'Exaustão emocional crônica' } },
  { id: 'validacao', title: 'Validação Emocional', emoji: '🫶', theme: 'relacionamentos', content: 'Validar não é concordar com tudo. É reconhecer o sentimento do outro como legítimo.', action: 'Valide alguém em 1 frase hoje.', quiz: { question: 'Validar é:', options: ['Concordar com tudo', 'Reconhecer sentimento', 'Ignorar conflito', 'Resolver pelo outro'], answer: 'Reconhecer sentimento' } },
  { id: 'distorcao', title: 'Distorções Cognitivas', emoji: '🧩', theme: 'cognitivo', content: 'São atalhos mentais que distorcem a realidade (catastrofização, tudo-ou-nada, leitura mental).', action: 'Nomeie 1 distorção presente hoje.', quiz: { question: 'Distorção cognitiva é:', options: ['Fato absoluto', 'Interpretação enviesada', 'Doença física', 'Memória perfeita'], answer: 'Interpretação enviesada' } },
  { id: 'autoeficacia', title: 'Autoeficácia', emoji: '💪', theme: 'autocuidado', content: 'Crença de que você consegue agir para produzir resultado. Cresce com microvitórias.', action: 'Escolha 1 microvitória para agora.', quiz: { question: 'Autoeficácia cresce com:', options: ['Paralisia', 'Ações pequenas consistentes', 'Comparação', 'Esperar motivação perfeita'], answer: 'Ações pequenas consistentes' } },
  { id: 'co-regulacao', title: 'Co-regulação emocional', emoji: '🤍', theme: 'relacionamentos', content: 'Quando alguém seguro te ajuda a regular emoções por presença, voz e acolhimento.', action: 'Envie uma mensagem pedindo presença para alguém seguro.', quiz: { question: 'Co-regulação acontece quando:', options: ['Você se isola totalmente', 'Uma conexão segura ajuda a regular', 'Só com remédio', 'Apenas em terapia'], answer: 'Uma conexão segura ajuda a regular' } },
  { id: 'higiene-digital', title: 'Higiene Digital Emocional', emoji: '📵', theme: 'autocuidado', content: 'Excesso de telas aumenta comparação e cansaço mental. Pausas digitais reduzem ansiedade.', action: 'Faça 20 minutos sem redes antes de dormir.', quiz: { question: 'Higiene digital ajuda a:', options: ['Aumentar sobrecarga', 'Melhorar foco e descanso', 'Piorar sono', 'Evitar qualquer contato humano'], answer: 'Melhorar foco e descanso' } },
  { id: 'aceitacao', title: 'Aceitação Radical', emoji: '🪨', theme: 'cognitivo', content: 'Aceitar não é concordar. É parar de lutar contra o fato para agir com clareza.', action: 'Nomeie um fato difícil e uma ação possível agora.', quiz: { question: 'Aceitação radical é:', options: ['Desistir', 'Reconhecer o fato e agir', 'Negar dor', 'Fingir que está tudo bem'], answer: 'Reconhecer o fato e agir' } },
  { id: 'sono-humor', title: 'Sono e Humor', emoji: '🌙', theme: 'ansiedade', content: 'Privação de sono aumenta irritabilidade e ansiedade no dia seguinte.', action: 'Defina horário de deitar para hoje.', quiz: { question: 'Dormir pouco tende a:', options: ['Melhorar regulação', 'Aumentar reatividade', 'Não mudar nada', 'Reduzir todos os gatilhos'], answer: 'Aumentar reatividade' } },
  { id: 'autovalidacao', title: 'Autovalidação', emoji: '🪞', theme: 'autocuidado', content: 'É reconhecer o que você sente sem se julgar, criando segurança interna.', action: 'Diga: “faz sentido eu me sentir assim agora”.', quiz: { question: 'Autovalidação significa:', options: ['Se julgar menos', 'Ignorar emoção', 'Se culpar', 'Tentar sentir outra coisa à força'], answer: 'Se julgar menos' } },
  { id: 'distancia-cognitiva', title: 'Distância Cognitiva', emoji: '🔭', theme: 'cognitivo', content: 'Em vez de “eu sou isso”, usar “estou tendo o pensamento de que...”.', action: 'Reescreva um pensamento com distância cognitiva.', quiz: { question: 'Distância cognitiva ajuda a:', options: ['Fundir com pensamento', 'Criar espaço para escolha', 'Aumentar impulso', 'Eliminar emoções na hora'], answer: 'Criar espaço para escolha' } },
];

const quizConcepts: QuizConcept[] = [
  { key: 'ansiedade-adaptativa', theme: 'ansiedade', title: 'Ansiedade adaptativa', prompts: ['Ansiedade pode ser entendida como:', 'Qual frase descreve melhor a ansiedade saudável?', 'No começo da ansiedade, a leitura mais equilibrada é:', 'Em psicoeducação, ansiedade nem sempre significa:'], correct: 'Um sistema de alerta que nem sempre indica perigo real', wrong: ['Uma prova de que tudo vai dar errado', 'Algo sempre patológico', 'Um sinal de fraqueza pessoal'] },
  { key: 'respiracao-diafragmatica', theme: 'ansiedade', title: 'Respiração diafragmática', prompts: ['Respiração diafragmática tende a:', 'Quando a ansiedade sobe, respirar com o diafragma ajuda a:', 'O objetivo da respiração mais lenta é:', 'Na crise de ansiedade, respirar com a barriga costuma:'], correct: 'Reduzir o estado de alerta do corpo', wrong: ['Acelerar ainda mais o coração', 'Eliminar pensamentos na hora', 'Resolver o problema externo imediatamente'] },
  { key: 'sono-humor', theme: 'ansiedade', title: 'Sono e humor', prompts: ['Dormir pouco tende a:', 'Privação de sono costuma aumentar:', 'Quando o sono piora, no dia seguinte pode haver mais:', 'A relação entre sono e ansiedade mostra que o corpo pode ficar mais:'], correct: 'Reativo e irritável', wrong: ['Estável e descansado automaticamente', 'Imune a gatilhos emocionais', 'Sem variação de humor'] },
  { key: 'preocupacao-produtiva', theme: 'ansiedade', title: 'Preocupação produtiva', prompts: ['Uma preocupação mais útil costuma levar a:', 'Quando a preocupação ajuda, ela costuma virar:', 'A diferença entre preocupação e ruminação é que a preocupação saudável:', 'Pensar no problema de forma regulada tende a gerar:'], correct: 'Um próximo passo concreto', wrong: ['Paralisia total', 'Catastrofização sem fim', 'Mais impulso e pressa'] },
  { key: 'evitacao', theme: 'ansiedade', title: 'Evitação', prompts: ['Evitar tudo quando a ansiedade sobe costuma:', 'A evitação emocional geralmente faz a ansiedade:', 'Fugir sempre do desconforto tende a:', 'Quando a pessoa evita tudo, o padrão mais comum é:'], correct: 'Dar alívio curto e manter o medo depois', wrong: ['Resolver a insegurança de forma duradoura', 'Eliminar gatilhos para sempre', 'Aumentar confiança de forma estável'] },
  { key: 'tolerancia-incerteza', theme: 'ansiedade', title: 'Tolerância à incerteza', prompts: ['Aprender a tolerar incerteza significa:', 'Em ansiedade, suportar o “não sei ainda” ajuda a:', 'Uma leitura mais madura da incerteza seria:', 'Tolerar incerteza não é:'], correct: 'Suportar dúvida sem agir no impulso', wrong: ['Controlar tudo antes de viver', 'Ter certeza absoluta de tudo', 'Desistir de pensar'] },
  { key: 'sintomas-fisicos', theme: 'ansiedade', title: 'Sintomas físicos', prompts: ['Coração acelerado na ansiedade costuma indicar:', 'Sintomas físicos de ansiedade podem ser:', 'Quando o corpo entra em alerta, é comum notar:', 'Na ansiedade, o corpo pode reagir com:'], correct: 'Ativação do sistema de alerta', wrong: ['Confirmação de catástrofe', 'Falta de caráter', 'Ausência total de regulação possível'] },
  { key: 'ciclo-ansiedade', theme: 'ansiedade', title: 'Ciclo da ansiedade', prompts: ['No ciclo da ansiedade, pensamento ameaçador costuma gerar:', 'O caminho mais comum da ansiedade é:', 'Um pensamento catastrófico costuma puxar:', 'Quando a ansiedade cresce, costuma haver uma mistura de:'], correct: 'Mais alerta no corpo e vontade de evitar', wrong: ['Clareza total e calma imediata', 'Sono profundo automático', 'Desapego instantâneo do problema'] },
  { key: 'cafeina-ansiedade', theme: 'ansiedade', title: 'Cafeína e ansiedade', prompts: ['Em pessoas mais sensíveis, excesso de cafeína pode:', 'Cafeína em excesso tende a deixar o corpo mais:', 'Quando a ansiedade já está alta, muita cafeína pode:', 'Um cuidado útil com cafeína em dias tensos é:'], correct: 'Aumentar agitação e alerta corporal', wrong: ['Regular emoções profundamente', 'Substituir sono reparador', 'Eliminar preocupação na raiz'] },
  { key: 'exposicao-gradual', theme: 'ansiedade', title: 'Exposição gradual', prompts: ['Exposição gradual significa:', 'Uma forma regulada de enfrentar medo é:', 'Na ansiedade, exposição gradual ajuda a:', 'Exposição gradual funciona melhor quando:'], correct: 'Se aproximar aos poucos do que assusta', wrong: ['Se jogar no pico sem preparo', 'Evitar para sempre', 'Esperar sumir totalmente antes de agir'] },

  { key: 'luto-fases', theme: 'relacionamentos', title: 'Fases do luto', prompts: ['As fases do luto costumam:', 'No luto, a sequência emocional pode:', 'Uma leitura cuidadosa do luto é:', 'Em perdas importantes, as fases do luto podem:'], correct: 'Variar e se alternar', wrong: ['Seguir ordem fixa para todos', 'Durar poucos dias em qualquer caso', 'Aparecer só em luto por morte'] },
  { key: 'apego', theme: 'relacionamentos', title: 'Apego', prompts: ['Estilos de apego influenciam:', 'Quando falamos de apego, estamos olhando para:', 'Apego costuma aparecer em:', 'O padrão de apego pode afetar:'], correct: 'Como a pessoa se vincula e reage em relações', wrong: ['Apenas a infância sem efeitos no presente', 'Só relações familiares', 'Somente a vida profissional'] },
  { key: 'limites', theme: 'relacionamentos', title: 'Limites saudáveis', prompts: ['Limite saudável significa:', 'Quando você diz não de forma clara, está:', 'Em vínculos maduros, limite saudável serve para:', 'Um limite bem colocado tende a:'], correct: 'Proteger bem-estar e clareza na relação', wrong: ['Agradar todos o tempo todo', 'Romper todo vínculo automaticamente', 'Evitar qualquer desconforto'] },
  { key: 'validacao', theme: 'relacionamentos', title: 'Validação emocional', prompts: ['Validar alguém é:', 'Validação emocional significa:', 'Quando você valida o outro, você:', 'Uma resposta validante costuma:'], correct: 'Reconhecer o sentimento sem precisar concordar com tudo', wrong: ['Concordar com qualquer comportamento', 'Resolver a vida da pessoa', 'Ignorar o que ela sente'] },
  { key: 'co-regulacao', theme: 'relacionamentos', title: 'Co-regulação', prompts: ['Co-regulação emocional acontece quando:', 'Uma relação segura pode ajudar a:', 'Na co-regulação, a presença do outro pode:', 'Co-regulação tem relação com:'], correct: 'Uma conexão segura ajuda a baixar o estado de alerta', wrong: ['Dependência total como única saída', 'Controle do outro sobre você', 'Ausência completa de autonomia'] },
  { key: 'comunicacao-assertiva', theme: 'relacionamentos', title: 'Comunicação assertiva', prompts: ['Comunicação assertiva costuma unir:', 'Ser assertivo em relação significa:', 'Uma fala assertiva tende a ser:', 'Na prática, assertividade ajuda a:'], correct: 'Clareza e respeito ao mesmo tempo', wrong: ['Agressividade para ser ouvido', 'Silêncio para evitar conflito', 'Controle emocional do outro'] },
  { key: 'ciumes', theme: 'relacionamentos', title: 'Ciúme', prompts: ['Ciúme costuma pedir primeiro:', 'Quando o ciúme aparece, o melhor começo é:', 'Uma resposta mais regulada ao ciúme seria:', 'Em vez de agir no ciúme, ajuda mais:'], correct: 'Nomear insegurança antes de agir no impulso', wrong: ['Investigar escondido imediatamente', 'Acusar sem evidência', 'Fingir que não sente nada'] },
  { key: 'reparo-conflito', theme: 'relacionamentos', title: 'Reparo pós-conflito', prompts: ['Depois de um conflito, reparar é:', 'Um bom movimento após discussão costuma ser:', 'Reparo na relação envolve:', 'Quando a conversa sai do eixo, reparar significa:'], correct: 'Retomar com responsabilidade e abertura', wrong: ['Vencer a discussão a qualquer custo', 'Sumir sem falar mais nada', 'Cobrar perfeição do outro'] },
  { key: 'pedir-necessidade', theme: 'relacionamentos', title: 'Pedir o que precisa', prompts: ['Pedir o que você precisa em um vínculo é:', 'Uma necessidade bem expressa tende a ser:', 'Em relação saudável, pedir algo pode:', 'Falar da própria necessidade ajuda a:'], correct: 'Um jeito claro de construir vínculo', wrong: ['Prova de fraqueza', 'Manipulação sempre', 'Algo a evitar em qualquer relação'] },
  { key: 'confianca', theme: 'relacionamentos', title: 'Confiança', prompts: ['Confiança costuma crescer com:', 'Relações mais seguras se constroem com:', 'Confiança real tende a nascer de:', 'Um vínculo confiável costuma incluir:'], correct: 'Consistência, clareza e previsibilidade', wrong: ['Promessas intensas sem ação', 'Controle e vigilância', 'Leitura mental do outro'] },

  { key: 'mindfulness', theme: 'autocuidado', title: 'Mindfulness', prompts: ['Mindfulness é:', 'Praticar mindfulness significa:', 'A proposta principal do mindfulness é:', 'Em mindfulness, o foco está em:'], correct: 'Trazer atenção ao presente sem julgamento', wrong: ['Apagar pensamentos à força', 'Pensar só no futuro', 'Controlar todas as emoções na hora'] },
  { key: 'autocompaixao', theme: 'autocuidado', title: 'Autocompaixão', prompts: ['Autocompaixão é:', 'Quando você erra, autocompaixão significa:', 'Uma resposta autocompassiva tende a:', 'Autocompaixão combina mais com:'], correct: 'Gentileza consigo em momentos difíceis', wrong: ['Se punir para aprender', 'Passar pano para tudo', 'Ignorar responsabilidade'] },
  { key: 'burnout', theme: 'autocuidado', title: 'Burnout', prompts: ['Burnout costuma envolver:', 'Sinais de burnout incluem:', 'Quando há burnout, é comum notar:', 'Burnout não é o mesmo que:'], correct: 'Exaustão emocional e queda de eficácia', wrong: ['Preguiça simples', 'Falta de talento', 'Ausência total de esforço'] },
  { key: 'autoeficacia', theme: 'autocuidado', title: 'Autoeficácia', prompts: ['Autoeficácia cresce com:', 'A crença de “eu consigo” costuma aumentar quando há:', 'Uma forma de fortalecer autoeficácia é:', 'Autoeficácia se alimenta de:'], correct: 'Pequenas ações consistentes', wrong: ['Comparação excessiva', 'Esperar confiança perfeita', 'Paralisia prolongada'] },
  { key: 'higiene-digital', theme: 'autocuidado', title: 'Higiene digital', prompts: ['Higiene digital emocional ajuda a:', 'Pausas de tela podem reduzir:', 'Uma rotina digital mais saudável tende a melhorar:', 'Cuidar do uso de telas pode favorecer:'], correct: 'Foco, descanso e menor sobrecarga', wrong: ['Mais comparação e exaustão', 'Sono pior obrigatoriamente', 'Isolamento como única solução'] },
  { key: 'autovalidacao', theme: 'autocuidado', title: 'Autovalidação', prompts: ['Autovalidação significa:', 'Quando você se autovalida, você:', 'Uma frase autovalidante seria:', 'Autovalidação ajuda a:'], correct: 'Reconhecer o que sente sem se atacar', wrong: ['Negar a emoção', 'Se culpar mais', 'Trocar o que sente à força'] },
  { key: 'descanso', theme: 'autocuidado', title: 'Descanso', prompts: ['Descanso regulador é:', 'Descansar de forma útil significa:', 'Um descanso que ajuda costuma:', 'No autocuidado, descanso não é:'], correct: 'Recuperar energia sem cobrança excessiva', wrong: ['Fracasso por parar', 'Desistência da vida', 'Algo permitido só depois da exaustão total'] },
  { key: 'rotina-minima', theme: 'autocuidado', title: 'Rotina mínima', prompts: ['Em dias difíceis, uma rotina mínima ajuda a:', 'Quando a energia está baixa, o melhor começo pode ser:', 'Rotina mínima costuma priorizar:', 'Uma base simples de autocuidado tende a:'], correct: 'Dar estrutura sem exigir perfeição', wrong: ['Cobrar desempenho ideal', 'Eliminar toda dificuldade', 'Substituir apoio emocional'] },
  { key: 'agua-corpo', theme: 'autocuidado', title: 'Cuidados básicos do corpo', prompts: ['Água, alimento e pausa ajudam porque:', 'Cuidar do corpo em primeiro nível pode:', 'Microcuidados físicos costumam:', 'Em autorregulação, o corpo precisa de:'], correct: 'Apoiam o sistema nervoso de forma básica', wrong: ['Resolver conflitos profundos sozinhos', 'Eliminar toda emoção desconfortável', 'Substituir vínculo e contexto'] },
  { key: 'prazer-saudavel', theme: 'autocuidado', title: 'Prazer saudável', prompts: ['Prazer saudável no dia a dia pode:', 'Uma atividade agradável ajuda a:', 'Autocuidado também inclui:', 'Pequenos momentos agradáveis podem:'], correct: 'Reabastecer energia emocional', wrong: ['Anular toda dor automaticamente', 'Ser perda de tempo sempre', 'Trocar qualquer responsabilidade'] },

  { key: 'grounding', theme: 'crise', title: 'Grounding', prompts: ['Grounding 5-4-3-2-1 ajuda a:', 'Em crise, grounding serve para:', 'A técnica 5-4-3-2-1 costuma trazer a pessoa para:', 'Grounding é uma prática para:'], correct: 'Voltar ao presente com os sentidos', wrong: ['Apagar memórias difíceis', 'Resolver toda a crise imediatamente', 'Dormir na hora'] },
  { key: 'gatilhos', theme: 'crise', title: 'Gatilhos emocionais', prompts: ['O primeiro passo diante de um gatilho é:', 'Quando um gatilho aparece, ajuda mais:', 'Reconhecer gatilho costuma reduzir:', 'Ao notar um gatilho, o mais regulado é:'], correct: 'Nomear o que disparou a reação', wrong: ['Agir no impulso', 'Se culpar por sentir', 'Aumentar a discussão'] },
  { key: 'plano-seguranca', theme: 'crise', title: 'Plano de segurança', prompts: ['Em crise intensa, um plano de segurança ajuda a:', 'Ter um plano de crise serve para:', 'Um bom plano de segurança costuma incluir:', 'Planejar antes da crise tende a:'], correct: 'Reduzir improviso em momentos críticos', wrong: ['Garantir que nunca mais haverá crise', 'Substituir ajuda profissional quando precisa', 'Aumentar rigidez emocional'] },
  { key: 'pausa-sensorial', theme: 'crise', title: 'Pausa sensorial', prompts: ['Quando há sobrecarga, reduzir estímulos pode:', 'Em crise, baixar barulho e luz pode ajudar a:', 'Uma pausa sensorial serve para:', 'Corpo muito ativado pode se beneficiar de:'], correct: 'Diminuir a escalada do alerta', wrong: ['Eliminar todos os problemas externos', 'Forçar produtividade imediata', 'Aumentar tensão corporal'] },
  { key: 'orientacao-temporal', theme: 'crise', title: 'Orientação temporal', prompts: ['Em desorganização intensa, lembrar data, hora e lugar ajuda a:', 'Orientação temporal costuma trazer mais:', 'Quando a mente dispersa muito, nomear onde você está pode:', 'Uma âncora temporal serve para:'], correct: 'Reforçar contato com o presente', wrong: ['Apagar emoções', 'Resolver trauma sozinho', 'Substituir apoio humano'] },
  { key: 'pedido-ajuda', theme: 'crise', title: 'Pedir ajuda', prompts: ['Em crise, pedir ajuda é:', 'Acionar alguém seguro em crise pode:', 'Uma mensagem simples pedindo presença pode:', 'Pedir suporte em crise geralmente é:'], correct: 'Uma estratégia de proteção', wrong: ['Sinal de incapacidade moral', 'Algo a evitar sempre', 'Exagero por definição'] },
  { key: 'ancoragem-corporal', theme: 'crise', title: 'Ancoragem corporal', prompts: ['Sentir os pés no chão em crise ajuda a:', 'Ancoragem corporal serve para:', 'Quando o corpo está disparado, voltar à base corporal pode:', 'Uma prática de ancoragem busca:'], correct: 'Dar referência física de segurança', wrong: ['Aumentar dissociação', 'Eliminar toda emoção de uma vez', 'Substituir tratamento quando necessário'] },
  { key: 'onda-emocional', theme: 'crise', title: 'Onda emocional', prompts: ['Uma crise emocional intensa tende a:', 'Em pico emocional, lembrar que a onda passa ajuda a:', 'Uma leitura mais regulada da crise é:', 'Crises costumam ser:'], correct: 'Subir e depois baixar com suporte e tempo', wrong: ['Eternas e sem mudança possível', 'Prova de fracasso pessoal', 'Algo que exige decisão imediata sempre'] },
  { key: 'impulso-pausa', theme: 'crise', title: 'Pausa antes do impulso', prompts: ['Na crise, pausar antes de agir ajuda a:', 'Um microintervalo de 30 segundos pode:', 'Entre emoção intensa e ação, uma pausa serve para:', 'Pausar em crise favorece:'], correct: 'Criar espaço para escolha mais segura', wrong: ['Piorar tudo necessariamente', 'Anular emoções definitivamente', 'Eliminar qualquer desconforto'] },
  { key: 'proximos-passos', theme: 'crise', title: 'Próximo passo seguro', prompts: ['Em crise, o foco mais útil costuma ser:', 'Quando tudo parece demais, ajuda perguntar:', 'Na desregulação, vale priorizar:', 'O melhor começo em crise costuma ser:'], correct: 'Qual é o próximo passo seguro e pequeno', wrong: ['Como resolver a vida inteira agora', 'Como convencer todo mundo de algo', 'Como não sentir mais nada'] },

  { key: 'tcc', theme: 'cognitivo', title: 'TCC', prompts: ['Na TCC, um foco importante é:', 'TCC ajuda principalmente a:', 'O trabalho cognitivo-comportamental costuma olhar para:', 'Na prática, TCC busca:'], correct: 'Pensamentos, emoções e comportamentos em conjunto', wrong: ['Ignorar emoções', 'Reviver só o passado sem ação', 'Depender apenas de remédio'] },
  { key: 'janela', theme: 'cognitivo', title: 'Janela de tolerância', prompts: ['Fora da janela de tolerância, a pessoa pode:', 'Quando alguém sai da janela, tende a:', 'A janela de tolerância fala sobre:', 'Estar dentro da janela costuma permitir:'], correct: 'Ficar hiperativada ou hipoativada', wrong: ['Regular tudo com facilidade automática', 'Não sentir nada nunca', 'Resolver conflitos sem esforço'] },
  { key: 'ruminacao', theme: 'cognitivo', title: 'Ruminação', prompts: ['Ruminação costuma:', 'Pensar repetidamente sem resolver tende a:', 'Quando a mente gira no mesmo tema, isso geralmente:', 'Ruminar é diferente de resolver porque:'], correct: 'Aumentar desgaste emocional', wrong: ['Trazer solução rápida', 'Dar descanso mental', 'Melhorar foco por si só'] },
  { key: 'distorcoes', theme: 'cognitivo', title: 'Distorções cognitivas', prompts: ['Distorção cognitiva é:', 'Quando a mente exagera ou simplifica demais, isso pode ser:', 'Uma distorção cognitiva costuma ser:', 'Na TCC, distorções são vistas como:'], correct: 'Uma interpretação enviesada da realidade', wrong: ['Um fato absoluto', 'Memória perfeita', 'Prova concreta de perigo'] },
  { key: 'aceitacao-radical', theme: 'cognitivo', title: 'Aceitação radical', prompts: ['Aceitação radical significa:', 'Aceitar um fato difícil é:', 'Na aceitação radical, o passo principal é:', 'Aceitação radical ajuda a:'], correct: 'Reconhecer a realidade para agir com mais clareza', wrong: ['Concordar com tudo o que houve', 'Desistir de si', 'Negar a dor'] },
  { key: 'distancia-cognitiva', theme: 'cognitivo', title: 'Distância cognitiva', prompts: ['Distância cognitiva ajuda a:', 'Trocar “eu sou isso” por “estou tendo o pensamento de que...” costuma:', 'Uma função da distância cognitiva é:', 'Olhar o pensamento com distância pode:'], correct: 'Criar espaço entre pensamento e identidade', wrong: ['Fundir ainda mais com a ideia', 'Eliminar emoção imediatamente', 'Provar que o pensamento é verdade'] },
  { key: 'pensamento-automatico', theme: 'cognitivo', title: 'Pensamento automático', prompts: ['Pensamento automático é:', 'Na TCC, um pensamento automático costuma ser:', 'Quando a reação vem muito rápido, pode haver:', 'Um pensamento automático geralmente aparece:'], correct: 'Uma interpretação rápida que influencia emoção', wrong: ['Uma verdade absoluta', 'Uma decisão sempre consciente', 'Algo sem impacto emocional'] },
  { key: 'evidencias', theme: 'cognitivo', title: 'Buscar evidências', prompts: ['Perguntar por evidências ajuda a:', 'Quando você checa evidências, está tentando:', 'Um bom uso de evidências é:', 'Checar fatos antes de concluir serve para:'], correct: 'Diminuir conclusões precipitadas', wrong: ['Ignorar sentimentos completamente', 'Vencer discussão interna à força', 'Se culpar com mais precisão'] },
  { key: 'reestruturacao', theme: 'cognitivo', title: 'Reestruturação cognitiva', prompts: ['Reestruturar um pensamento é:', 'Na prática, reestruturação cognitiva busca:', 'Uma reformulação saudável tende a ser:', 'Reestruturar não significa:'], correct: 'Trocar uma leitura distorcida por outra mais justa', wrong: ['Pensar positivo à força', 'Negar a realidade', 'Fingir que está tudo bem'] },
  { key: 'perspectiva', theme: 'cognitivo', title: 'Perspectiva alternativa', prompts: ['Uma perspectiva alternativa útil costuma ser:', 'Quando você amplia a perspectiva, consegue:', 'Olhar a situação por outro ângulo ajuda a:', 'Perspectiva alternativa tende a trazer:'], correct: 'Mais nuance e menos extremismo', wrong: ['Mais catastrofização', 'Certezas rígidas imediatas', 'Perda total de contato com o problema'] },
];

const quizQuestions: QuizQuestion[] = quizConcepts.flatMap((concept) =>
  concept.prompts.map((prompt, index) => ({
    id: `${concept.theme}-${concept.key}-${index + 1}`,
    theme: concept.theme,
    question: prompt,
    options: [concept.correct, ...concept.wrong],
    answer: concept.correct,
    sourceTitle: concept.title,
  })),
);

const themeLabel: Record<Theme, string> = {
  ansiedade: 'Ansiedade', relacionamentos: 'Relacionamentos', autocuidado: 'Autocuidado', crise: 'Crise', cognitivo: 'Cognitivo'
};

const themeEmoji: Record<Theme, string> = {
  ansiedade: '🌀',
  relacionamentos: '🤝',
  autocuidado: '🌿',
  crise: '🆘',
  cognitivo: '🧠',
};

const themeTone: Record<Theme, { active: string; inactiveLight: string; inactiveDark: string }> = {
  ansiedade: {
    active: 'bg-amber-500 text-white',
    inactiveLight: 'bg-amber-50 text-amber-800 border border-amber-200',
    inactiveDark: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
  relacionamentos: {
    active: 'bg-rose-500 text-white',
    inactiveLight: 'bg-rose-50 text-rose-800 border border-rose-200',
    inactiveDark: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
  },
  autocuidado: {
    active: 'bg-emerald-500 text-white',
    inactiveLight: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    inactiveDark: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  crise: {
    active: 'bg-red-500 text-white',
    inactiveLight: 'bg-red-50 text-red-800 border border-red-200',
    inactiveDark: 'bg-red-500/10 text-red-300 border border-red-500/20',
  },
  cognitivo: {
    active: 'bg-indigo-500 text-white',
    inactiveLight: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    inactiveDark: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
  },
};

const quizSourceTone: Record<'mixed' | 'theme' | 'recommended', { active: string; inactiveLight: string; inactiveDark: string }> = {
  mixed: {
    active: 'bg-violet-600 text-white shadow-lg shadow-violet-600/20',
    inactiveLight: 'bg-violet-50 text-violet-800 border border-violet-200',
    inactiveDark: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  },
  theme: {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
    inactiveLight: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    inactiveDark: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  recommended: {
    active: 'bg-sky-600 text-white shadow-lg shadow-sky-600/20',
    inactiveLight: 'bg-sky-50 text-sky-800 border border-sky-200',
    inactiveDark: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  },
};

const quizLengthTone: Record<10 | 20 | 40, { active: string; inactiveLight: string; inactiveDark: string }> = {
  10: {
    active: 'bg-violet-600 text-white shadow-lg shadow-violet-600/20',
    inactiveLight: 'bg-violet-50 text-violet-800 border border-violet-200',
    inactiveDark: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  },
  20: {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
    inactiveLight: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    inactiveDark: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  40: {
    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    inactiveLight: 'bg-amber-50 text-amber-800 border border-amber-200',
    inactiveDark: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
};

const linkLengthTone: Record<16 | 33 | 65, { active: string; inactiveLight: string; inactiveDark: string }> = {
  16: {
    active: 'bg-violet-600 text-white shadow-lg shadow-violet-600/20',
    inactiveLight: 'bg-violet-50 text-violet-800 border border-violet-200',
    inactiveDark: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  },
  33: {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
    inactiveLight: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    inactiveDark: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  65: {
    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    inactiveLight: 'bg-amber-50 text-amber-800 border border-amber-200',
    inactiveDark: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
};

const dragLengthTone: Record<12 | 25 | 50, { active: string; inactiveLight: string; inactiveDark: string }> = {
  12: {
    active: 'bg-violet-600 text-white shadow-lg shadow-violet-600/20',
    inactiveLight: 'bg-violet-50 text-violet-800 border border-violet-200',
    inactiveDark: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  },
  25: {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20',
    inactiveLight: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    inactiveDark: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  },
  50: {
    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    inactiveLight: 'bg-amber-50 text-amber-800 border border-amber-200',
    inactiveDark: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  },
};

const miniChallenges = [
  { id: 'mc1', prompt: 'Você está com coração acelerado e mente corrida. Melhor ação inicial?', options: ['Discutir problema por 2h', 'Respiração diafragmática por 1 min', 'Rolar redes sociais', 'Tomar mais café para reagir'], answer: 'Respiração diafragmática por 1 min' },
  { id: 'mc2', prompt: 'Pensamento: “sou um fracasso”. Melhor resposta?', options: ['Confirmar pensamento', 'Reformular com evidências reais', 'Evitar tudo', 'Comparar com outras pessoas'], answer: 'Reformular com evidências reais' },
  { id: 'mc3', prompt: 'Após conflito, você sente gatilho. Próximo passo?', options: ['Responder no impulso', 'Grounding 5-4-3-2-1', 'Se isolar por dias', 'Mandar vários áudios na hora'], answer: 'Grounding 5-4-3-2-1' },
  { id: 'mc4', prompt: 'Você está sobrecarregado no trabalho. Melhor micro-ação?', options: ['Parar tudo e se culpar', 'Quebrar em tarefa de 5 minutos', 'Tomar mais café e ignorar corpo', 'Abrir várias tarefas ao mesmo tempo'], answer: 'Quebrar em tarefa de 5 minutos' },
  { id: 'mc5', prompt: 'Antes de dormir, ansiedade subiu. O que ajuda mais?', options: ['Luz baixa + respiração lenta', 'Abrir redes por 1 hora', 'Revisar problemas antigos', 'Responder mensagens tensas agora'], answer: 'Luz baixa + respiração lenta' },
  { id: 'mc6', prompt: 'Após uma crítica, qual resposta é mais regulada?', options: ['Reagir no impulso', 'Pedir exemplo concreto com calma', 'Se atacar internamente', 'Repassar a crítica o dia inteiro'], answer: 'Pedir exemplo concreto com calma' },
  { id: 'mc7', prompt: 'Em crise emocional, primeiro passo seguro?', options: ['Discutir tudo de uma vez', 'Nomear emoção + respirar', 'Negar o que sente', 'Sair decidindo tudo rápido'], answer: 'Nomear emoção + respirar' },
  { id: 'mc8', prompt: 'Pensamento: “ninguém me respondeu, me odeiam”. Reenquadramento saudável?', options: ['É rejeição total', 'Talvez estejam ocupados; preciso de evidência', 'Vou me isolar', 'Vou apagar a conversa inteira'], answer: 'Talvez estejam ocupados; preciso de evidência' },
  { id: 'mc9', prompt: 'Você recebeu uma mensagem seca de alguém importante. Melhor atitude?', options: ['Interpretar como rejeição na hora', 'Perguntar com clareza e sem ataque', 'Responder com ironia', 'Sumir para punir a pessoa'], answer: 'Perguntar com clareza e sem ataque' },
  { id: 'mc10', prompt: 'Dia difícil, energia baixa. Melhor estratégia?', options: ['Cobrar perfeição', 'Micro-meta de 5 minutos', 'Desistir do dia inteiro', 'Esperar motivação ideal para começar'], answer: 'Micro-meta de 5 minutos' },
  { id: 'mc11', prompt: 'Após erro, qual pensamento ajuda na recuperação?', options: ['Sou incapaz', 'Posso corrigir em partes e aprender', 'Nunca vou melhorar', 'Preciso esconder o erro de qualquer forma'], answer: 'Posso corrigir em partes e aprender' },
  { id: 'mc12', prompt: 'Em pico de ansiedade, qual é a sequência inicial mais útil?', options: ['Catastrofizar e agir no impulso', 'Respirar + nomear emoção + ação pequena', 'Ignorar o corpo e continuar', 'Pesquisar sintomas por horas'], answer: 'Respirar + nomear emoção + ação pequena' },
  { id: 'mc13', prompt: 'Você acordou sem energia e a casa está bagunçada. Melhor começo?', options: ['Fazer tudo de uma vez', 'Escolher uma microtarefa de 5 minutos', 'Voltar a se culpar na cama', 'Abrir redes para fugir'], answer: 'Escolher uma microtarefa de 5 minutos' },
  { id: 'mc14', prompt: 'Uma conversa importante mexeu com você no trabalho. Melhor próximo passo?', options: ['Responder no calor da emoção', 'Pausar, anotar e retomar com clareza', 'Mandar indireta no grupo', 'Ignorar o corpo e continuar'], answer: 'Pausar, anotar e retomar com clareza' },
  { id: 'mc15', prompt: 'Você percebeu que está ruminando a mesma situação há horas. O que ajuda mais?', options: ['Continuar pensando até cansar', 'Trocar por uma ação concreta pequena', 'Pesquisar o assunto sem parar', 'Se criticar por isso'], answer: 'Trocar por uma ação concreta pequena' },
  { id: 'mc16', prompt: 'Seu corpo ficou tenso antes de uma ligação difícil. Melhor cuidado inicial?', options: ['Prender a respiração', 'Relaxar ombros e soltar o ar lentamente', 'Cancelar tudo automaticamente', 'Tomar mais estímulo'], answer: 'Relaxar ombros e soltar o ar lentamente' },
  { id: 'mc17', prompt: 'Você recebeu uma cobrança e sentiu vergonha. Melhor resposta interna?', options: ['Sou incapaz mesmo', 'Posso separar erro de valor pessoal', 'Preciso sumir agora', 'Todo mundo faz melhor que eu'], answer: 'Posso separar erro de valor pessoal' },
  { id: 'mc18', prompt: 'Depois de uma discussão, você quer mandar um texto enorme. Melhor movimento?', options: ['Mandar tudo no impulso', 'Fazer uma pausa e voltar depois', 'Bloquear a pessoa', 'Pedir opinião de cinco pessoas antes'], answer: 'Fazer uma pausa e voltar depois' },
  { id: 'mc19', prompt: 'Você notou que está saindo da janela de tolerância. O que ajuda?', options: ['Forçar raciocínio complexo', 'Nomear o estado e reduzir estímulos', 'Seguir como se nada fosse', 'Buscar mais conflito'], answer: 'Nomear o estado e reduzir estímulos' },
  { id: 'mc20', prompt: 'Em um dia de exaustão, qual decisão tende a ser mais saudável?', options: ['Cobrar produtividade máxima', 'Ajustar a expectativa e fazer o essencial', 'Desistir de tudo para sempre', 'Se comparar com quem está rendendo'], answer: 'Ajustar a expectativa e fazer o essencial' },
  { id: 'mc21', prompt: 'Você sentiu ciúme após ver algo nas redes. Melhor atitude?', options: ['Concluir rejeição imediata', 'Checar os fatos antes de interpretar', 'Cobrar explicação agressivamente', 'Ficar monitorando tudo'], answer: 'Checar os fatos antes de interpretar' },
  { id: 'mc22', prompt: 'Uma lembrança difícil apareceu de repente. Melhor resposta inicial?', options: ['Mergulhar nela sozinho sem preparo', 'Usar grounding para voltar ao presente', 'Fingir que não aconteceu', 'Buscar mais gatilhos'], answer: 'Usar grounding para voltar ao presente' },
  { id: 'mc23', prompt: 'Você percebeu excesso de tela e mente acelerada à noite. O que ajuda mais?', options: ['Continuar rolando até dormir', 'Fazer uma pausa digital e baixar estímulo', 'Abrir discussões online', 'Tomar cafeína para compensar'], answer: 'Fazer uma pausa digital e baixar estímulo' },
  { id: 'mc24', prompt: 'Após um não recebido, qual resposta é mais regulada?', options: ['Tomar como prova de desvalor', 'Reconhecer frustração e seguir com limites', 'Atacar quem negou', 'Guardar rancor em silêncio'], answer: 'Reconhecer frustração e seguir com limites' },
  { id: 'mc25', prompt: 'Você quer pedir ajuda, mas sente culpa. Melhor enquadramento?', options: ['Pedir ajuda é fracasso', 'Pedir ajuda pode ser estratégia saudável', 'Ninguém deve saber do que sinto', 'Só posso pedir quando estiver no limite'], answer: 'Pedir ajuda pode ser estratégia saudável' },
  { id: 'mc26', prompt: 'Seu pensamento está em tudo-ou-nada. Melhor intervenção?', options: ['Acreditar totalmente nele', 'Buscar uma leitura mais nuanceada', 'Decidir tudo hoje', 'Aumentar a autocrítica'], answer: 'Buscar uma leitura mais nuanceada' },
  { id: 'mc27', prompt: 'Você sentiu vontade de agradar todo mundo e se abandonou. O que fazer?', options: ['Continuar dizendo sim para tudo', 'Nomear um limite claro para hoje', 'Sumir de todas as relações', 'Esperar a outra pessoa adivinhar'], answer: 'Nomear um limite claro para hoje' },
  { id: 'mc28', prompt: 'Você está preso numa tarefa grande demais. Melhor saída?', options: ['Esperar motivação perfeita', 'Quebrar em partes menores agora', 'Se chamar de preguiçoso', 'Trocar por mais cinco tarefas'], answer: 'Quebrar em partes menores agora' },
  { id: 'mc29', prompt: 'Ao notar culpa excessiva, qual movimento costuma ajudar?', options: ['Punir-se mais um pouco', 'Diferenciar responsabilidade de autoataque', 'Repetir o erro na cabeça', 'Isolar-se sem falar com ninguém'], answer: 'Diferenciar responsabilidade de autoataque' },
  { id: 'mc30', prompt: 'Você teve um gatilho em público e ficou perdido. Melhor foco?', options: ['Resolver a vida inteira ali', 'Encontrar uma âncora simples no presente', 'Acelerar o pensamento', 'Se esconder e se julgar'], answer: 'Encontrar uma âncora simples no presente' },
  { id: 'mc31', prompt: 'Uma pessoa importante demorou a responder. Melhor leitura inicial?', options: ['É rejeição com certeza', 'Ainda não tenho informação suficiente', 'Preciso cobrar agora', 'Vou imaginar o pior cenário'], answer: 'Ainda não tenho informação suficiente' },
  { id: 'mc32', prompt: 'Você percebeu sinais de burnout no corpo e no humor. Melhor atitude?', options: ['Empurrar até quebrar', 'Reconhecer sinais e ajustar a carga', 'Negar completamente', 'Dobrar a cobrança'], answer: 'Reconhecer sinais e ajustar a carga' },
  { id: 'mc33', prompt: 'Seu parceiro pediu espaço depois de um conflito. Melhor resposta?', options: ['Pressionar retorno imediato', 'Respeitar o espaço e combinar retomada', 'Punir com silêncio', 'Tomar como abandono certo'], answer: 'Respeitar o espaço e combinar retomada' },
  { id: 'mc34', prompt: 'Você está muito sensível e irritado ao mesmo tempo. Melhor microcuidado?', options: ['Continuar se expondo a mais estímulo', 'Dar uma pausa curta ao corpo e ao ambiente', 'Resolver tudo na discussão', 'Ignorar fome e sede'], answer: 'Dar uma pausa curta ao corpo e ao ambiente' },
  { id: 'mc35', prompt: 'Após falhar em algo, qual pensamento tende a proteger mais sua recuperação?', options: ['Isso prova que sou ruim', 'Um erro não define meu valor inteiro', 'Nunca mais devo tentar', 'É melhor me esconder'], answer: 'Um erro não define meu valor inteiro' },
  { id: 'mc36', prompt: 'Você quer começar um hábito de autocuidado, mas sempre quer fazer perfeito. Melhor começo?', options: ['Esperar o plano ideal', 'Começar pequeno e consistente', 'Desistir porque não será perfeito', 'Comparar seu início com o auge dos outros'], answer: 'Começar pequeno e consistente' },
  { id: 'mc37', prompt: 'Em um momento de travamento, o que costuma destravar primeiro?', options: ['Pensar mais e mais', 'Escolher uma ação corporal simples', 'Se acusar de preguiça', 'Ficar olhando a tarefa'], answer: 'Escolher uma ação corporal simples' },
  { id: 'mc38', prompt: 'Você se sentiu invalidado numa conversa. Melhor forma de responder depois?', options: ['Engolir tudo para sempre', 'Voltar ao tema com clareza e necessidade', 'Explodir de imediato', 'Cortar o vínculo no impulso'], answer: 'Voltar ao tema com clareza e necessidade' },
  { id: 'mc39', prompt: 'Seu humor caiu muito depois de uma noite ruim. Melhor estratégia para o dia?', options: ['Cobrar o mesmo rendimento de sempre', 'Reduzir a meta e cuidar do básico', 'Tomar decisões grandes agora', 'Ignorar totalmente o impacto do sono'], answer: 'Reduzir a meta e cuidar do básico' },
  { id: 'mc40', prompt: 'Você está em dúvida entre agir no impulso ou pausar. O que tende a ser mais seguro?', options: ['Agir logo para se livrar da sensação', 'Criar um pequeno intervalo antes da resposta', 'Mandar tudo por mensagem', 'Tomar a primeira conclusão como fato'], answer: 'Criar um pequeno intervalo antes da resposta' },
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
  { left: 'Mindfulness', right: 'Presença no momento com menos julgamento' },
  { left: 'Grounding', right: 'Retornar ao presente usando os sentidos' },
  { left: 'Autocompaixão', right: 'Responder a si com gentileza em vez de punição' },
  { left: 'Janela de tolerância', right: 'Faixa em que o sistema consegue se regular melhor' },
  { left: 'Respiração diafragmática', right: 'Respiração que ajuda a baixar o estado de alerta' },
  { left: 'Autoeficácia', right: 'Crença de que pequenas ações podem gerar resultado' },
  { left: 'Aceitação radical', right: 'Reconhecer a realidade para agir com mais clareza' },
  { left: 'Distorções cognitivas', right: 'Interpretações enviesadas que distorcem a leitura dos fatos' },
  { left: 'Limites saudáveis', right: 'Clareza sobre o que é aceitável para proteger bem-estar' },
  { left: 'Autovalidação', right: 'Reconhecer o que sente sem se atacar internamente' },
  { left: 'Higiene digital emocional', right: 'Cuidado com excesso de telas e sobrecarga mental' },
  { left: 'Distância cognitiva', right: 'Criar espaço entre você e o pensamento automático' },
  { left: 'Apego seguro', right: 'Forma de vínculo com mais confiança, clareza e estabilidade' },
  { left: 'Apego ansioso', right: 'Padrão de vínculo com medo maior de rejeição e abandono' },
  { left: 'Apego evitativo', right: 'Padrão de vínculo com tendência a se afastar do desconforto relacional' },
  { left: 'Pensamento automático', right: 'Interpretação rápida que influencia emoção e comportamento' },
  { left: 'Reestruturação cognitiva', right: 'Troca de uma leitura distorcida por outra mais justa' },
  { left: 'Leitura mental', right: 'Supor saber o que o outro pensa sem evidência clara' },
  { left: 'Tudo-ou-nada', right: 'Ver a situação em extremos, sem nuances intermediárias' },
  { left: 'Filtro negativo', right: 'Focar só na parte ruim e ignorar o restante' },
  { left: 'Personalização', right: 'Assumir culpa ou responsabilidade excessiva por algo' },
  { left: 'Comparação excessiva', right: 'Medir seu valor a partir da régua dos outros' },
  { left: 'Regulação emocional', right: 'Capacidade de atravessar emoções com mais escolha e menos impulso' },
  { left: 'Desregulação', right: 'Estado em que emoção e corpo saem da faixa manejável' },
  { left: 'Hipoativação', right: 'Queda de energia, entorpecimento ou desligamento do sistema' },
  { left: 'Hiperativação', right: 'Aumento de alerta, tensão e reatividade do sistema' },
  { left: 'Pausa estratégica', right: 'Interrupção curta que ajuda a retomar com mais clareza' },
  { left: 'Microtarefa', right: 'Ação pequena o suficiente para reduzir travamento e começar' },
  { left: 'Gatilho relacional', right: 'Situação interpessoal que dispara reação emocional intensa' },
  { left: 'Pedido de ajuda', right: 'Ato de buscar suporte como estratégia de proteção e cuidado' },
  { left: 'Reparo de vínculo', right: 'Movimento de retomar uma relação com responsabilidade e abertura' },
  { left: 'Comunicação assertiva', right: 'Falar com clareza e respeito sem agressão nem apagamento' },
  { left: 'Necessidade emocional', right: 'Aquilo que a pessoa precisa reconhecer ou pedir para se cuidar melhor' },
  { left: 'Autocobrança', right: 'Pressão interna rígida por desempenho, perfeição ou controle' },
  { left: 'Burnout', right: 'Exaustão crônica com queda de energia, eficácia e envolvimento' },
  { left: 'Prazer saudável', right: 'Atividade que reabastece sem depender de excesso ou fuga' },
  { left: 'Rotina mínima', right: 'Estrutura simples para sustentar o básico em dias difíceis' },
  { left: 'Pausa sensorial', right: 'Redução de estímulos para ajudar o sistema a baixar o alerta' },
  { left: 'Âncora corporal', right: 'Referência física que ajuda a voltar ao presente' },
  { left: 'Plano de segurança', right: 'Combinação prévia de passos de proteção para momentos críticos' },
  { left: 'Tolerância à incerteza', right: 'Capacidade de suportar dúvida sem agir no impulso' },
  { left: 'Evitação', right: 'Fuga do desconforto que alivia no curto prazo e mantém o padrão depois' },
  { left: 'Exposição gradual', right: 'Aproximação aos poucos do que assusta para ganhar tolerância' },
  { left: 'Sintoma físico de ansiedade', right: 'Reação corporal de alerta que não é prova automática de perigo' },
  { left: 'Sono reparador', right: 'Descanso que favorece regulação, atenção e recuperação do corpo' },
  { left: 'Privação de sono', right: 'Falta de descanso que aumenta irritabilidade e reatividade' },
  { left: 'Auto-observação', right: 'Capacidade de notar o que sente, pensa e faz sem agir no automático' },
  { left: 'Aceitação', right: 'Reconhecer o que existe antes de escolher o próximo passo' },
  { left: 'Presença', right: 'Contato com o agora, em vez de se perder só em passado ou futuro' },
  { left: 'Reenquadramento', right: 'Mudar a forma de olhar para a situação sem negar a realidade' },
  { left: 'Consistência', right: 'Repetição de pequenas ações que sustentam mudança ao longo do tempo' },
  { left: 'Autoproteção', right: 'Capacidade de agir em favor do próprio bem-estar e segurança' },
  { left: 'Vulnerabilidade segura', right: 'Abertura emocional feita com mais critério e contexto' },
  { left: 'Luto', right: 'Processo de adaptação diante de uma perda significativa' },
  { left: 'Barganha', right: 'Fase do luto marcada por pensamentos de “e se” e tentativa de controle' },
  { left: 'Aceitação no luto', right: 'Integração gradual da perda sem precisar apagar a dor' },
  { left: 'Autoabandono', right: 'Padrão de se deixar em segundo plano para manter aprovação ou evitar conflito' },
  { left: 'Critério de realidade', right: 'Checagem de fatos antes de concluir que algo é verdade' },
  { left: 'Microvitória', right: 'Pequeno avanço que fortalece senso de capacidade e continuidade' },
  { left: 'Limite interno', right: 'Percepção de até onde você consegue ir sem se desorganizar' },
  { left: 'Recuperação', right: 'Volta gradual ao eixo depois de um pico emocional ou fase difícil' },
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
  { toxic: 'Se eu senti isso, então é verdade absoluta.', options: ['Sentir algo não prova sozinho que a interpretação está certa.', 'Emoção sempre é fato.', 'Não devo questionar nada do que sinto.'], answer: 'Sentir algo não prova sozinho que a interpretação está certa.' },
  { toxic: 'Preciso resolver tudo agora ou vou explodir.', options: ['Posso reduzir para o próximo passo seguro.', 'Só existe solução total agora.', 'Se eu pausar, tudo piora.'], answer: 'Posso reduzir para o próximo passo seguro.' },
  { toxic: 'Se eu pedir ajuda, vou decepcionar as pessoas.', options: ['Pedir ajuda também é um jeito maduro de se cuidar.', 'Precisar de apoio é fraqueza.', 'Melhor esconder tudo.'], answer: 'Pedir ajuda também é um jeito maduro de se cuidar.' },
  { toxic: 'Uma crítica prova que não sou bom o suficiente.', options: ['Uma crítica pode trazer dado, não definir meu valor inteiro.', 'Se fui criticado, sou incapaz.', 'Criticado uma vez, fracassei sempre.'], answer: 'Uma crítica pode trazer dado, não definir meu valor inteiro.' },
  { toxic: 'Se não for perfeito, não vale a pena começar.', options: ['Começar imperfeito também constrói caminho.', 'Sem perfeição, é melhor desistir.', 'Só devo agir quando estiver 100% pronto.'], answer: 'Começar imperfeito também constrói caminho.' },
  { toxic: 'Estou cansado, então sou preguiçoso.', options: ['Cansaço pode ser sinal de limite, não defeito de caráter.', 'Se cansei, falhei.', 'Descansar é falta de compromisso.'], answer: 'Cansaço pode ser sinal de limite, não defeito de caráter.' },
  { toxic: 'Se a pessoa mudou o tom, ela me rejeita.', options: ['Posso checar fatos antes de concluir rejeição.', 'Mudança de tom é rejeição certa.', 'É melhor atacar primeiro.'], answer: 'Posso checar fatos antes de concluir rejeição.' },
  { toxic: 'Meu corpo acelerou, então estou em perigo real.', options: ['Alerta corporal pode ser ansiedade e ainda assim eu posso me regular.', 'Se o coração acelerou, algo terrível vai acontecer.', 'Meu corpo acelerado prova catástrofe.'], answer: 'Alerta corporal pode ser ansiedade e ainda assim eu posso me regular.' },
  { toxic: 'Se eu não der conta de tudo, decepciono todo mundo.', options: ['Posso ajustar o que cabe hoje sem perder meu valor.', 'Só sou valioso se der conta de tudo.', 'Falhar em algo decepciona todos para sempre.'], answer: 'Posso ajustar o que cabe hoje sem perder meu valor.' },
  { toxic: 'Eu devia já ter superado isso.', options: ['Processos emocionais têm tempo próprio e pedem cuidado.', 'Se ainda dói, estou fazendo tudo errado.', 'Sentir ainda significa atraso pessoal.'], answer: 'Processos emocionais têm tempo próprio e pedem cuidado.' },
  { toxic: 'Se eu colocar um limite, vou perder essa relação.', options: ['Limites claros podem proteger vínculos mais saudáveis.', 'Qualquer limite destrói a relação.', 'Amar é suportar tudo em silêncio.'], answer: 'Limites claros podem proteger vínculos mais saudáveis.' },
  { toxic: 'Eu só posso descansar quando terminar tudo.', options: ['Pausas fazem parte da sustentação, não são prêmio final.', 'Descansar antes do fim é errado.', 'Só merece pausa quem nunca atrasa.'], answer: 'Pausas fazem parte da sustentação, não são prêmio final.' },
  { toxic: 'Se eu falhei hoje, amanhã vai ser igual ou pior.', options: ['Um dia difícil não prevê sozinho o resto da minha semana.', 'Hoje ruim prova futuro ruim.', 'Se hoje falhou, amanhã também já está perdido.'], answer: 'Um dia difícil não prevê sozinho o resto da minha semana.' },
  { toxic: 'Tenho que ser forte o tempo todo.', options: ['Força também pode incluir pedir apoio e ajustar o ritmo.', 'Ser forte é nunca demonstrar nada.', 'Mostrar limite é sinal de fraqueza.'], answer: 'Força também pode incluir pedir apoio e ajustar o ritmo.' },
  { toxic: 'Se eu não responder agora, vou estragar tudo.', options: ['Posso pausar e responder melhor em vez de responder rápido.', 'Responder rápido sempre evita problema.', 'A pior coisa é esperar um pouco.'], answer: 'Posso pausar e responder melhor em vez de responder rápido.' },
  { toxic: 'Se eu estou sensível, não posso confiar em mim.', options: ['Posso me acolher primeiro e decidir depois com mais clareza.', 'Sensibilidade me invalida totalmente.', 'Sentir demais significa perder toda noção.'], answer: 'Posso me acolher primeiro e decidir depois com mais clareza.' },
  { toxic: 'Se alguém não me entendeu, a culpa é toda minha.', options: ['Comunicação é relacional e posso ajustar sem me culpar inteiro.', 'Se houve ruído, é culpa total minha.', 'Toda conversa difícil prova meu erro.'], answer: 'Comunicação é relacional e posso ajustar sem me culpar inteiro.' },
  { toxic: 'Se eu pensar mais, vou finalmente controlar tudo.', options: ['Pensar demais nem sempre regula; às vezes preciso de ação pequena.', 'Ruminar mais sempre resolve.', 'Controle vem de pensar sem parar.'], answer: 'Pensar demais nem sempre regula; às vezes preciso de ação pequena.' },
  { toxic: 'Estou travado porque sou incapaz.', options: ['Travamento pode pedir simplificação, não ataque pessoal.', 'Se travei, sou incapaz mesmo.', 'Travamento prova incompetência.'], answer: 'Travamento pode pedir simplificação, não ataque pessoal.' },
  { toxic: 'Se eu descansar hoje, vou perder o ritmo para sempre.', options: ['Uma pausa pontual pode ajudar a retomar com mais sustentação.', 'Descansar quebra tudo definitivamente.', 'Ritmo só existe sem pausas.'], answer: 'Uma pausa pontual pode ajudar a retomar com mais sustentação.' },
  { toxic: 'Se eu errei nisso, erro em tudo.', options: ['Um erro específico não precisa contaminar minha visão inteira.', 'Um erro prova fracasso global.', 'Errar uma vez mostra que tudo em mim falha.'], answer: 'Um erro específico não precisa contaminar minha visão inteira.' },
  { toxic: 'Se a ansiedade voltou, regredi tudo.', options: ['Oscilações fazem parte do processo e não anulam progresso.', 'Se voltou, perdi tudo mesmo.', 'Ansiedade retornando apaga qualquer avanço.'], answer: 'Oscilações fazem parte do processo e não anulam progresso.' },
  { toxic: 'Eu preciso agradar para ser querido.', options: ['Posso ser respeitoso sem me abandonar o tempo todo.', 'Ser querido depende de agradar sempre.', 'Se eu discordar, ninguém fica.'], answer: 'Posso ser respeitoso sem me abandonar o tempo todo.' },
  { toxic: 'Se eu não sentir vontade, não adianta fazer.', options: ['Posso agir pequeno mesmo sem vontade perfeita.', 'Sem vontade, qualquer ação é inútil.', 'Motivação tem que vir antes de tudo.'], answer: 'Posso agir pequeno mesmo sem vontade perfeita.' },
  { toxic: 'Ninguém entende o que eu sinto, então é melhor calar.', options: ['Posso buscar uma forma mais segura e gradual de me expressar.', 'Se não entenderam antes, nunca entenderão.', 'Calar sempre protege melhor.'], answer: 'Posso buscar uma forma mais segura e gradual de me expressar.' },
  { toxic: 'Se minha mente foi para o pior cenário, deve ser porque é o mais provável.', options: ['Catastrofizar não torna o cenário mais verdadeiro.', 'Pensar o pior revela a verdade.', 'Se imaginei, é porque vai acontecer.'], answer: 'Catastrofizar não torna o cenário mais verdadeiro.' },
  { toxic: 'Eu só posso ficar bem quando tudo ao redor se resolver.', options: ['Posso criar algum cuidado interno mesmo antes da solução completa.', 'Só há regulação com resolução total.', 'Enquanto houver problema, qualquer cuidado é inútil.'], answer: 'Posso criar algum cuidado interno mesmo antes da solução completa.' },
  { toxic: 'Se a conversa foi desconfortável, então foi ruim.', options: ['Desconforto às vezes faz parte de conversas honestas e necessárias.', 'Toda conversa desconfortável é errada.', 'Se doeu, então não serviu.'], answer: 'Desconforto às vezes faz parte de conversas honestas e necessárias.' },
  { toxic: 'Se eu preciso repetir limites, estou sendo chato.', options: ['Repetir limite pode ser necessário quando ainda não foi respeitado.', 'Limite só pode ser dito uma vez.', 'Repetir limite me torna insuportável.'], answer: 'Repetir limite pode ser necessário quando ainda não foi respeitado.' },
  { toxic: 'Meu humor caiu, então perdi o dia.', options: ['Ainda posso reduzir a meta e salvar uma parte do dia.', 'Humor baixo destrói o dia inteiro.', 'Com o humor ruim, nada conta mais.'], answer: 'Ainda posso reduzir a meta e salvar uma parte do dia.' },
  { toxic: 'Se eu me emocionei, perdi o controle por completo.', options: ['Sentir forte não significa perder toda capacidade de escolha.', 'Emoção forte é falta total de controle.', 'Se chorei, não posso confiar em mim.'], answer: 'Sentir forte não significa perder toda capacidade de escolha.' },
  { toxic: 'Se a pessoa não respondeu como eu queria, então ela não se importa.', options: ['A resposta do outro pode ter vários fatores além de desinteresse.', 'Resposta diferente prova desamor.', 'Se não veio do meu jeito, não há cuidado.'], answer: 'A resposta do outro pode ter vários fatores além de desinteresse.' },
  { toxic: 'Se eu falhar de novo, não vale a pena tentar.', options: ['Tentar em partes ainda pode gerar aprendizado e avanço.', 'Falhar de novo prova que não devo tentar.', 'Só vale agir com garantia de acerto.'], answer: 'Tentar em partes ainda pode gerar aprendizado e avanço.' },
  { toxic: 'Eu só posso me valorizar quando os outros validarem.', options: ['Posso praticar alguma autovalidação mesmo sem confirmação externa.', 'Sem validação externa, não tenho valor.', 'Meu valor depende totalmente da reação dos outros.'], answer: 'Posso praticar alguma autovalidação mesmo sem confirmação externa.' },
  { toxic: 'Se eu estiver confuso, devo decidir rápido para acabar com isso.', options: ['Quando estou confuso, pode ajudar desacelerar antes de decidir.', 'Confusão se resolve decidindo no impulso.', 'A pressa sempre traz clareza.'], answer: 'Quando estou confuso, pode ajudar desacelerar antes de decidir.' },
  { toxic: 'Se eu mudar de plano, estou fracassando.', options: ['Ajustar o plano pode ser sinal de flexibilidade, não fracasso.', 'Mudar plano prova incompetência.', 'Plano só vale se nunca mudar.'], answer: 'Ajustar o plano pode ser sinal de flexibilidade, não fracasso.' },
  { toxic: 'Todo desconforto precisa sumir antes que eu continue.', options: ['Posso seguir com pequenos passos mesmo com algum desconforto presente.', 'Só devo agir quando o desconforto zerar.', 'Qualquer desconforto precisa ser evitado.'], answer: 'Posso seguir com pequenos passos mesmo com algum desconforto presente.' },
  { toxic: 'Se eu estiver em dúvida, é melhor imaginar o pior para me preparar.', options: ['Preparação melhor vem de dados e passos concretos, não só do pior cenário.', 'Imaginar o pior sempre prepara melhor.', 'Catastrofizar me protege.'], answer: 'Preparação melhor vem de dados e passos concretos, não só do pior cenário.' },
  { toxic: 'Se eu me protejo, sou egoísta.', options: ['Autoproteção saudável não é o mesmo que egoísmo.', 'Se me protejo, abandono os outros.', 'Cuidar de mim sempre prejudica alguém.'], answer: 'Autoproteção saudável não é o mesmo que egoísmo.' },
  { toxic: 'Se eu ainda penso nisso, é porque não evoluí nada.', options: ['Pensar de novo não apaga o que já aprendi ou pratiquei.', 'Voltar ao tema prova estagnação total.', 'Evolução real não repete assunto.'], answer: 'Pensar de novo não apaga o que já aprendi ou pratiquei.' },
  { toxic: 'Se eu colocar minhas necessidades na conversa, vou ser demais.', options: ['Expressar necessidade com clareza pode fortalecer o vínculo.', 'Levar minha necessidade é exagero.', 'Melhor guardar tudo para não pesar.'], answer: 'Expressar necessidade com clareza pode fortalecer o vínculo.' },
  { toxic: 'Se hoje foi difícil, eu falhei no autocuidado.', options: ['Autocuidado também existe em dias difíceis e imperfeitos.', 'Dia difícil prova fracasso total no cuidado.', 'Se sofri hoje, não me cuidei de verdade.'], answer: 'Autocuidado também existe em dias difíceis e imperfeitos.' },
  { toxic: 'Se eu não consigo agora, nunca vou conseguir.', options: ['Não conseguir agora não define para sempre minha capacidade.', 'Agora ruim significa nunca.', 'Se travou hoje, acabou.'], answer: 'Não conseguir agora não define para sempre minha capacidade.' },
  { toxic: 'Se eu não agradar nessa conversa, serei rejeitado.', options: ['Posso buscar honestidade e respeito sem me apagar completamente.', 'Sem agradar, serei descartado.', 'Ser eu mesmo sempre afasta.'], answer: 'Posso buscar honestidade e respeito sem me apagar completamente.' },
  { toxic: 'Se estou com medo, é melhor não olhar para isso nunca.', options: ['Olhar aos poucos pode ser mais regulado do que evitar para sempre.', 'Medo significa proibição total.', 'Se assusta, deve ser evitado eternamente.'], answer: 'Olhar aos poucos pode ser mais regulado do que evitar para sempre.' },
  { toxic: 'Se eu precisar recomeçar, todo meu esforço anterior foi perdido.', options: ['Recomeçar pode aproveitar o que já aprendi no caminho.', 'Recomeçar zera qualquer valor do esforço.', 'Só vale se der certo de primeira.'], answer: 'Recomeçar pode aproveitar o que já aprendi no caminho.' },
];

const getDragThoughtMeta = (toxic: string) => {
  const text = toxic.toLowerCase();
  if (/(ansios|perigo|catastro|pior cenário|coração acelerou|explodir)/.test(text)) {
    return {
      label: 'Catastrofização',
      light: 'bg-amber-50 border border-amber-200 text-amber-900',
      dark: 'bg-amber-500/10 border border-amber-500/20 text-amber-200',
      badgeLight: 'bg-amber-100 text-amber-800 border border-amber-200',
      badgeDark: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    };
  }
  if (/(ninguém|rejei|parceiro|pessoa|respondeu|liga para mim|queria|entendeu)/.test(text)) {
    return {
      label: 'Vínculo e rejeição',
      light: 'bg-rose-50 border border-rose-200 text-rose-900',
      dark: 'bg-rose-500/10 border border-rose-500/20 text-rose-200',
      badgeLight: 'bg-rose-100 text-rose-800 border border-rose-200',
      badgeDark: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    };
  }
  if (/(tenho que|preciso|devo|perfeito|dar conta|forte o tempo todo|resolver tudo agora)/.test(text)) {
    return {
      label: 'Autocobrança',
      light: 'bg-violet-50 border border-violet-200 text-violet-900',
      dark: 'bg-violet-500/10 border border-violet-500/20 text-violet-200',
      badgeLight: 'bg-violet-100 text-violet-800 border border-violet-200',
      badgeDark: 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
    };
  }
  if (/(limite|agradar|necessidades|egoísta|não agradar)/.test(text)) {
    return {
      label: 'Limites e validação',
      light: 'bg-emerald-50 border border-emerald-200 text-emerald-900',
      dark: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200',
      badgeLight: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      badgeDark: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    };
  }
  return {
    label: 'Autocrítica',
    light: 'bg-sky-50 border border-sky-200 text-sky-900',
    dark: 'bg-sky-500/10 border border-sky-500/20 text-sky-200',
    badgeLight: 'bg-sky-100 text-sky-800 border border-sky-200',
    badgeDark: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  };
};

const getSequenceTone = (title: string, situation: string) => {
  const text = `${title} ${situation}`.toLowerCase();
  if (/(crise|pânico|seguro|grounding|controle)/.test(text)) {
    return {
      light: 'bg-rose-50/80 border-rose-200',
      dark: 'bg-rose-500/10 border-rose-500/20',
      labelLight: 'bg-rose-100 text-rose-800 border-rose-200',
      labelDark: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      label: 'Crise',
    };
  }
  if (/(conflito|discussão|relacion|julgando|evento)/.test(text)) {
    return {
      light: 'bg-violet-50/80 border-violet-200',
      dark: 'bg-violet-500/10 border-violet-500/20',
      labelLight: 'bg-violet-100 text-violet-800 border-violet-200',
      labelDark: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
      label: 'Relações',
    };
  }
  if (/(trabalho|entregar|tarefa|foco|comparação|resultado)/.test(text)) {
    return {
      light: 'bg-amber-50/80 border-amber-200',
      dark: 'bg-amber-500/10 border-amber-500/20',
      labelLight: 'bg-amber-100 text-amber-800 border-amber-200',
      labelDark: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      label: 'Pressão',
    };
  }
  return {
    light: 'bg-indigo-50/80 border-indigo-200',
    dark: 'bg-indigo-500/10 border-indigo-500/20',
    labelLight: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    labelDark: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    label: 'Regulação',
  };
};

const sequenceRounds = [
  { id: 'reg-basica', title: 'Regulação Básica', situation: 'Você percebe que seu humor mudou de repente e sente um leve aperto no peito.', steps: ['Respirar 4 ciclos', 'Nomear a emoção', 'Checar o corpo', 'Escolher micro-ação de 5 min'], explanation: '💡 Começar pelo corpo e pela nomeação ajuda a acalmar o sistema antes de tentar agir. Isso evita que o impulso tome conta.' },
  { id: 'crise-panico', title: 'Foco em Crise', situation: 'Seus pensamentos estão acelerados, a respiração está curta e você sente que pode perder o controle.', steps: ['Grounding 5-4-3-2-1', 'Afirmar: "estou seguro"', 'Água gelada no rosto', 'Ligar para alguém seguro'], explanation: '💡 Em crise, o foco é o presente sensorial. Grounding e resfriamento físico cortam o pico da adrenalina mais rápido.' },
  { id: 'conflito-rel', title: 'Pós-Conflito', situation: 'Após uma discussão tensa, você sente o corpo rígido e a mente remoendo o que foi dito.', steps: ['Pausa silêncio 5 min', 'Anotar sentimentos', 'Validar própria dor', 'Retomar com clareza'], explanation: '💡 Após um conflito, o sistema está reativo. O intervalo e a validação evitam que você responda por defesa ou ataque.' },
  { id: 'autocobranca-foco', title: 'Foco e Autocobrança', situation: 'A pressão por entregar resultados está gerando paralisia e você não sabe por onde começar.', steps: ['Soltar ombros e ar', 'Pausar comparação', 'Dividir tarefa em 3', 'Focar no primeiro passo'], explanation: '💡 Autocobrança trava. Simplificar a tarefa e soltar o corpo reduz a pressão interna para que você possa começar.' },
  { id: 'ansiedade-social', title: 'Ansiedade Social', situation: 'Você está em um evento e sente que todos estão te julgando ou observando seus erros.', steps: ['Identificar o medo', 'Olhar ao redor (fatos)', 'Focar em uma conversa', 'Elogiar-se por estar lá'], explanation: '💡 Focar nos fatos externos reduz a hipervigilância interna. A auto-validação ajuda a manter a segurança.' },
  { id: 'raiva-trabalho', title: 'Gestão de Raiva', situation: 'Um colega levou o crédito pelo seu trabalho e você sente o sangue ferver.', steps: ['Afastar-se do local', 'Respirar pelo diafragma', 'Escrever rascunho (off)', 'Conversar com calma'], explanation: '💡 A raiva precisa de espaço físico para baixar. O rascunho ajuda a processar o sentimento sem gerar conflito desnecessário.' },
  { id: 'tristeza-inesperada', title: 'Onda de Tristeza', situation: 'Uma música ou lembrança trouxe uma tristeza profunda e vontade de chorar no meio do dia.', steps: ['Acolher o choro', 'Validar o motivo', 'Beber um copo d\'água', 'Ouvir algo relaxante'], explanation: '💡 Reprimir a tristeza gasta mais energia. Acolher e depois reidratar o corpo ajuda a concluir o ciclo da emoção.' },
  { id: 'frustracao-falha', title: 'Frustração por Falha', situation: 'Você cometeu um erro bobo em algo importante e não para de se xingar mentalmente.', steps: ['Interromper o insulto', 'Tratar-se como amigo', 'Identificar a lição', 'Tentar de novo (ou reparar)'], explanation: '💡 A autocrítica excessiva impede o aprendizado. A autocompaixão foca na solução e não no erro.' },
  { id: 'limites-familia', title: 'Estabelecendo Limites', situation: 'Um familiar pede um favor que você realmente não pode fazer, mas sente culpa em dizer não.', steps: ['Reconhecer a intenção', 'Dizer não de forma clara', 'Não justificar demais', 'Lidar com o desconforto'], explanation: '💡 Dizer não é um ato de autocuidado. Justificar demais dá margem para negociação e aumenta a sua culpa.' },
  { id: 'sono-insonia', title: 'Combate à Insônia', situation: 'Já é tarde, mas sua mente não para de planejar o dia de amanhã e você está alerta.', steps: ['Sair da cama (se 20m)', 'Fazer lista de tarefas', 'Luz baixa / sem telas', 'Relaxamento muscular progressive'], explanation: '💡 A cama deve ser associada ao sono. Tirar as preocupações da cabeça para o papel sinaliza ao cérebro que ele pode descansar.' },
  { id: 'comparacao-rede', title: 'Fadiga de Redes Sociais', situation: 'Você passou 1h no Instagram e agora sente que sua vida é péssima comparada aos outros.', steps: ['Fechar o aplicativo', 'Sentir o momento presente', 'Listar 3 gratidões reais', 'Fazer algo manual'], explanation: '💡 Telas geram comparação irreal. Atividades manuais ou sensoriais trazem você de volta para a sua realidade única.' },
  { id: 'vergonha-gafe', title: 'Lidando com a Vergonha', situation: 'Você disse algo errado em uma reunião e sente que nunca mais vão te respeitar.', steps: ['Respirar e sentir a pele', 'Reconhecer a humanidade', 'Rir do erro (se possível)', 'Seguir para o próximo tema'], explanation: '💡 A vergonha vive no segredo. Normalizar o erro como algo humano quebra o poder desse sentimento sobre você.' },
  { id: 'medo-futuro', title: 'Incerteza do Futuro', situation: 'A notícia de uma mudança na empresa te deixou paralisado de medo do que pode acontecer.', steps: ['Focar no que você controla', 'Listar seus recursos', 'Planejar o plano B', 'Viver apenas hoje'], explanation: '💡 O medo do futuro é ansiedade. Focar nos seus recursos atuais e no que está sob seu controle direto reduz a sensação de desamparo.' },
  { id: 'perfeccionismo-trava', title: 'Perfeccionismo', situation: 'Você não consegue começar um texto porque a primeira frase não está perfeita.', steps: ['Permitir-se ser medíocre', 'Escrever qualquer coisa', 'Prometer revisar depois', 'Concluir sem perfeição'], explanation: '💡 Feito é melhor que perfeito. O perfeccionismo é uma forma de procrastinação disfarçada de excelência.' },
  { id: 'exaustao-menta', title: 'Cansaço Mental', situation: 'Depois de muitas horas de estudo, nada mais entra na cabeça e você começa a errar tudo.', steps: ['Parar tudo agora', 'Lanche ou água gelada', 'Caminhada curta/Alongar', 'Descanso sem culpa'], explanation: '💡 O cérebro tem limite de processamento. Descansar é parte fundamental da produtividade, e não uma falha.' },
  { id: 'dependencia-aprov', title: 'Necessidade de Aprovação', situation: 'Você postou algo e está checando os likes a cada 2 minutos.', steps: ['Deixar o celular longe', 'Perguntar: por que isso importa?', 'Validar-se internamente', 'Focar em outro interesse'], explanation: '💡 A aprovação externa é volátil. Construir sua própria validação cria uma autoestima mais sólida e independente.' },
  { id: 'luto-saudade', title: 'Luto e Saudade', situation: 'Um objeto te lembrou de alguém que partiu e a falta dessa pessoa dói fisicamente.', steps: ['Sentir o aperto', 'Lembrar de um momento bom', 'Anotar uma mensagem grata', 'Permitir o tempo passar'], explanation: '💡 O luto não some, ele se transforma. Honrar a memória e permitir-se sentir a falta é o caminho da cura.' },
  { id: 'impulsividade-compra', title: 'Impulso de Compra', situation: 'Você está chateado e acha que comprar aquele item caro vai resolver seu problema.', steps: ['Esperar 24 horas', 'Beber água/Comer', 'Ver o saldo bancário', 'Identificar a carência real'], explanation: '💡 Compras por impulso buscam dopamina rápida para abafar desconforto emocional. O tempo de espera quebra o padrão automático.' },
  { id: 'irritabilidade-ato', title: 'Fadiga de Decisão', situation: 'No final do dia, até escolher a janta parece um fardo impossível e você quer gritar.', steps: ['Reconhecer o esgotamento', 'Escolher o mais simples', 'Silenciar barulhos', 'Dormir o quanto antes'], explanation: '💡 Decisões gastam glicose cerebral. Quando o estoque acaba, a irritabilidade sobe. Simplifique tudo ao máximo.' },
  { id: 'clima-pesado', title: 'Energia do Ambiente', situation: 'Você entrou em uma sala onde as pessoas estavam brigando e o clima te contagiou.', steps: ['Sair do ambiente', 'Sacudir o corpo', 'Lavar as mãos', 'Focar no seu próprio centro'], explanation: '💡 Somos seres empáticos e absorvemos o clima. Atos físicos como lavar as mãos ajudam o cérebro a sinalizar uma quebra de conexão.' },
  { id: 'medo-critica', title: 'Receio de Julgamento', situation: 'Você quer usar uma roupa diferente, mas teme o que seus colegas vão pensar.', steps: ['Questionar: e se pensarem?', 'Lembrar do seu estilo', 'Focar no seu conforto', 'Sair de casa assim mesmo'], explanation: '💡 A opinião alheia diz mais sobre eles do que sobre você. Expor-se gradualmente reduz o impacto do medo do julgamento.' },
  { id: 'ansiedade-saude', title: 'Ansiedade com a Saúde', situation: 'Uma dorzinha leve te fez pesquisar no Google e agora você acha que tem uma doença rara.', steps: ['Fechar o navegador', 'Medir os fatos reais', 'Marcar um médico (se durar)', 'Focar no bem-estar agora'], explanation: '💡 Dr. Google aumenta o alerta sem base clínica. Se há dúvida real, procure um humano especialista; se não, cuide do momento.' },
  { id: 'culpa-ociosidade', title: 'Culpa por folga', situation: 'Domingo à tarde e você se sente mal por não estar produzindo nada.', steps: ['Relembrar: sou um ser humano', 'Valorizar o repouso', 'Fazer algo puramente lúdico', 'Desligar o relógio'], explanation: '💡 O descanso não é recompensa pelo trabalho, é uma necessidade vital. A ociosidade criativa é o berço de novas ideias.' },
  { id: 'sobrecarga-inf', title: 'Excesso de notícias', situation: 'Lendo sobre tragédias no mundo, você sente que a humanidade não tem jeito e fica sem esperança.', steps: ['Desligar o portal', 'Buscar uma notícia boa', 'Agir no seu bairro', 'Reconhecer sua bolha'], explanation: '💡 O cérebro evoluiu para alertar sobre o perigo, por isso notícias ruins prendem tanto. Buscar o micro-bem equilibra a visão.' },
  { id: 'medo-conduzir', title: 'Fobia Específica', situation: 'Você precisa fazer algo que te dá medo (ex: dirigir, voar) e o estômago está embrulhado.', steps: ['Aceitar o frio na barriga', 'Respirar 4-2-6', 'Preparar-se tecnicamente', 'Ir com medo mesmo'], explanation: '💡 A coragem não é ausência de medo, mas agir apesar dele. O foco na técnica e na respiração ancora sua atenção.' },
  { id: 'rejeicao-amorosa', title: 'Lidando com Rejeição', situation: 'A pessoa que você gosta não respondeu e você sente que não tem valor.', steps: ['Sentir a dor sem julgá-la', 'Separar fato de valor', 'Falar com um amigo', 'Cuidar de si mesmo'], explanation: '💡 O não de alguém não diminui quem você é. A dor da rejeição é real, mas ela não deve definir sua identidade.' },
  { id: 'conflito-interno', title: 'Dúvida Cruel', situation: 'Você tem duas opções e está perdendo o sono porque não quer errar a escolha.', steps: ['Listar prós e contras', 'Ouvir a intuição (corpo)', 'Dar um prazo final', 'Aceitar que não há perfeição'], explanation: '💡 A paralisia por análise gasta mais energia que a escolha errada. Decidir é também abrir mão de uma possibilidade.' },
  { id: 'desamparo-aprendiz', title: 'Aprendendo algo novo', situation: 'Você começou um curso e se sente o mais burro da sala, querendo desistir.', steps: ['Reconhecer o início', 'Valorizar o esforço', 'Pedir ajuda/Dúvidas', 'Celebrar o pingo de progresso'], explanation: '💡 A curva de aprendizado exige humildade. Ninguém nasce sabendo; o desconforto é o cérebro criando novas conexões.' },
  { id: 'injustica-vida', title: 'Sentimento de Injustiça', situation: 'Algo ruim aconteceu com você e parece que o mundo é injusto e cruel.', steps: ['Validar a indignação', 'Expressar a raiva (papel)', 'Buscar o que ainda é bom', 'Focar na resiliência'], explanation: '💡 Sentir injustiça é legítimo. Processar o sentimento permite que você saia do papel de vítima e retome seu poder sobre sua vida.' },
  { id: 'desconexao-social', title: 'Sentir-se invisível', situation: 'Em uma roda de amigos, ninguém parece ouvir o que você diz.', steps: ['Observar a dinâmica', 'Falar um pouco mais alto', 'Mudar de interlocutor', 'Avaliar a qualidade do grupo'], explanation: '💡 Às vezes a falha é da dinâmica do grupo, não sua. Tentar micro-conexões 1:1 é mais fácil que conquistar o grupo todo.' },
  { id: 'procrastinacao-dor', title: 'Procrastinação', situation: 'Você sabe que precisa fazer algo, mas o corpo se recusa a sair do sofá.', steps: ['Apenas levantar (sem pensar)', 'Prometer só 2 minutos', 'Reduzir a distração', 'Comemorar o começo'], explanation: '💡 O segredo é vencer a inércia. A regra dos 2 minutos engana o cérebro: ele acha que é fácil e para de lutar contra.' },
  { id: 'obsessao-erro', title: 'Pensamento em Loop', situation: 'Sua mente fica repetindo o que você "deveria ter dito" em uma briga ontem.', steps: ['Dizer "STOP" mentalmente', 'Anotar o loop no papel', 'Fazer algo cognitivo (ex: sudoku)', 'Aceitar o que já passou'], explanation: '💡 Ruminação é o cérebro tentando resolver um passado que não existe mais. Atividades cognitivas fortes quebram o padrão repetitivo.' },
  { id: 'pressao-temporal', title: 'Correria e Pressão', situation: 'Você está atrasado e o trânsito está parado. Você sente o coração pulando.', steps: ['Aceitar o atraso (é fato)', 'Avisar quem te espera', 'Ouvir um podcast calmo', 'Respirar e soltar o volante'], explanation: '💡 Lutar contra o trânsito só gera estresse interno. Aceitar o fato e gerenciar a expectativa alheia é a única solução real.' },
  { id: 'desmotivacao-total', title: 'Falta de Propósito', situation: 'Acordou e não vê sentido em nada do que está fazendo, sente um vazio.', steps: ['Apenas cumprir a higiene', 'Tomar um banho quente', 'Fazer uma pequena gentileza', 'Esperar o humor virar'], explanation: '💡 Motivação não é constante. Em dias sem brilho, focar na rotina básica e em pequenas conexões ajuda a manter os trilhos.' },
  { id: 'fome-emocional', title: 'Fome Emocional', situation: 'Você teve um dia ruim e parece que só um pote de sorvete pode te consolar.', steps: ['Escutar a emoção', 'Beber chá ou água', 'Esperar 15 minutos', 'Identificar o cansaço real'], explanation: '💡 Comemos emoções para não senti-las. Identificar se é cansaço, tédio ou tristeza ajuda a escolher um consolo mais saudável.' },
  { id: 'autopiedade-loop', title: 'Espiral de Coitadismo', situation: 'Você sente que sua vida é muito mais difícil que a de todo mundo ao redor.', steps: ['Ouvir a reclamação interna', 'Buscar alguém para ajudar', 'Listar privilégios ocultos', 'Mudar o foco para ação'], explanation: '💡 A autopiedade paralisa. Virar o foco para fora (ajudar alguém) ou para a gratidão ativa áreas cerebrais de bem-estar.' },
  { id: 'inveja-amigo', title: 'Lidando com a Inveja', situation: 'Um amigo conquistou algo que você queria muito e você sente um amargor.', steps: ['Aceitar o sentimento (é humano)', 'Celebrar com ele (mesmo sem querer)', 'Usar como bússola de desejo', 'Focar no seu caminho'], explanation: '💡 Inveja é sinal do que valorizamos. Em vez de se culpar, use esse sinal para entender o que você quer construir para si.' },
  { id: 'excesso-de-zelo', title: 'Controle Excessivo', situation: 'Você está tentando controlar o que seu parceiro(a) faz para que ele não sofra.', steps: ['Reconhecer seu medo', 'Devolver a autonomia dele', 'Cuidar da própria ansiedade', 'Dar suporte, não comando'], explanation: '💡 Controlar o outro é projeção da nossa própria insegurança. Permitir que o outro erre é respeitar a jornada dele.' },
  { id: 'distracao-foco', title: 'Dificuldade de Foco', situation: 'Você sentou para ler, mas sua mente voa para 1000 lugares diferentes.', steps: ['Trazer a mente de volta', 'Pausar e alongar', 'Reduzir estímulos visuais', 'Focar numa unidade pequena'], explanation: '💡 O foco é um músculo. Cada vez que você traz a mente de volta sem se julgar, você está treinando sua atenção.' },
  { id: 'desconforto-corpo', title: 'Autoimagem', situation: 'Você se olhou no espelho e não gostou nada do que viu hoje.', steps: ['Ser neutro com o corpo', 'Focar na função (ele te leva)', "Vestir algo confortável", 'Sair do espelho'], explanation: '💡 Nem todo dia é dia de auto-amor, mas podemos buscar a auto-neutralidade. Seu valor não está na estética de hoje.' },
  { id: 'medo-conflito', title: 'Medo de Confrontar', situation: 'Alguém furou a fila e você está tremendo, mas quer reclamar.', steps: ['Respirar fundo 2 vezes', 'Falar com tom calmo/firme', 'Manter contato visual breve', 'Aceitar a sua defesa'], explanation: '💡 Reclamar do que é justo nos fortalece. O treino da assertividade começa em situações pequenas e cotidianas.' },
  { id: 'excesso-empatia', title: 'Ressaca Emocional', situation: 'Você ouviu o desabafo pesado de um amigo e agora está exausto.', steps: ['Imaginar uma redoma', 'Tomar um banho de sal/erva', 'Ficar em silêncio', 'Separar o que é seu'], explanation: '💡 Empatia sem limites vira contágio emocional. Praticar o desligamento após o suporte é vital para quem ajuda.' },
  { id: 'vazio-pos-projeto', title: 'Vazio Pós-Meta', situation: 'Você terminou algo grande e, em vez de feliz, sente um vazio e falta de rumo.', steps: ['Apenas descansar o feito', 'Sentir o silêncio', 'Não planejar nada agora', 'Celebrar o caminho percorrido'], explanation: '💡 A queda da adrenalina após um grande esforço gera essa sensação de vazio. Dê tempo ao sistema para se recalibrar.' },
  { id: 'irritacao-ruido', title: 'Hipersensibilidade', situation: 'O barulho da obra vizinha ou de alguém mastigando está te deixando louco.', steps: ['Usar protetor/fone', 'Sair do local se possível', 'Focar no seu próprio ritmo', 'Acalmar o sistema nervoso'], explanation: '💡 Às vezes o sistema sensorial está sobrecarregado. Reduzir os estímulos de entrada é a melhor forma de auto-regulação.' },
  { id: 'medo-abandon', title: 'Medo de Abandono', situation: 'Um amigo não te chamou para sair e você acha que ele cansou de você.', steps: ['Checar as evidências', 'Lembrar de outras vezes', 'Chamar ele para outro dia', 'Gostar da própria companhia'], explanation: '💡 Nossa mente cria dramas onde há apenas coincidências. Manter a proatividade social ajuda a combater o medo de ficar de fora.' },
  { id: 'desespero-financeiro', title: 'Pressão de Grana', situation: 'A fatura do cartão veio alta e você sente um desespero no peito.', steps: ['Abrir a planilha/contas', 'Encarar o número real', 'Cortar o supérfluo hoje', 'Planejar a recuperação'], explanation: '💡 O medo cresce no escuro. Encarar os números reais, por piores que sejam, permite que a mente comece a buscar soluções.' },
  { id: 'impaciencia-outros', title: 'Falta de Paciência', situation: 'Alguém está te explicando algo de forma lenta e você quer completar a frase dela.', steps: ['Relaxar a mandíbula', 'Praticar o ouvir ativo', 'Validar o tempo do outro', 'Dar espaço para a pessoa'], explanation: '💡 Nossa pressa é uma forma de ansiedade. Dar tempo ao outro melhora imensamente a qualidade das suas relações.' },
  { id: 'culpa-mae-pai', title: 'Culpa Familiar', situation: 'Você não visitou seus pais e eles te ligaram cobrando presença.', steps: ['Reconhecer sua vida atual', 'Dizer que os ama (se for)', 'Agendar uma data real', 'Soltar a culpa excessiva'], explanation: '💡 Criar autonomia familiar exige que você lide com a culpa de não atender a todas as expectativas deles.' },
  { id: 'medo-escuro-sozinho', title: 'Medo de Estar Só', situation: 'A noite chegou e a casa vazia te traz uma sensação de insegurança ou solidão pesada.', steps: ['Acender luzes suaves', 'Colocar um som ambiente', 'Falar consigo mesmo', 'Aproveitar o seu espaço'], explanation: '💡 Transformar solidão em solitude exige que criemos um ambiente acolhedor para nós mesmos no nosso próprio lar.' },
  { id: 'conclusao-desafio', title: 'Resumo da Jornada', situation: 'Você completou muitos passos e agora reflete sobre sua evolução emocional.', steps: ['Olhar para trás com orgulho', 'Identificar sua força', 'Prometer seguir treinando', 'Sentir a paz de se conhecer'], explanation: '💡 O autoconhecimento é um caminho sem fim. Cada vez que você regula uma emoção, você ganha mais maestria sobre sua vida.' }
];

const sequenceSteps = sequenceRounds[0].steps;

const reflexRounds = [
  { "id": "ref-1", "prompt": "Alguém te fecha no trânsito e faz um gesto obsceno.", "options": ["Xingar de volta", "Respirar e ignorar", "Perseguir o carro"], "best": "Respirar e ignorar" },
  { "id": "ref-2", "prompt": "Seu chefe te dá um feedback negativo na frente de todos.", "options": ["Gritar com ele", "Sair chorando", "Pedir reunião privada"], "best": "Pedir reunião privada" },
  { "id": "ref-3", "prompt": "Você descobre que um amigo falou mal de você.", "options": ["Bloquear em tudo", "Conversar com calma", "Falar mal dele também"], "best": "Conversar com calma" },
  { "id": "ref-4", "prompt": "O computador trava minutos antes de uma entrega.", "options": ["Quebrar o teclado", "Respirar e reiniciar", "Desistir da entrega"], "best": "Respirar e reiniciar" },
  { "id": "ref-5", "prompt": "Você sente um aperto no peito e falta de ar do nada.", "options": ["Achar que vai morrer", "Focar na respiração", "Correr para o hospital"], "best": "Focar na respiração" },
  { "id": "ref-6", "prompt": "Um familiar critica sua aparência no jantar.", "options": ["Dar um fora", "Mudar de assunto", "Ignorar e comer"], "best": "Mudar de assunto" },
  { "id": "ref-7", "prompt": "A fatura do cartão veio 3x maior que o esperado.", "options": ["Chorar sem parar", "Analisar os gastos", "Fingir que não viu"], "best": "Analisar os gastos" },
  { "id": "ref-8", "prompt": "Você comete um erro bobo em um e-mail importante.", "options": ["Se culpar o dia todo", "Enviar correção", "Pedir demissão"], "best": "Enviar correção" },
  { "id": "ref-9", "prompt": "Alguém fura a fila na sua frente.", "options": ["Empurrar a pessoa", "Reclamar educadamente", "Ficar com raiva mudo"], "best": "Reclamar educadamente" },
  { "id": "ref-10", "prompt": "Seu filho derruba suco no seu sofá novo.", "options": ["Gritar com ele", "Limpar e explicar", "Chorar pelo sofá"], "best": "Limpar e explicar" },
  { "id": "ref-11", "prompt": "Você recebe uma notícia de mudança inesperada.", "options": ["Entrar em pânico", "Ver o que pode fazer", "Negar o fato"], "best": "Ver o que pode fazer" },
  { "id": "ref-12", "prompt": "Um amigo demora 3 dias para responder um Zap.", "options": ["Achar que te odeia", "Esperar o tempo dele", "Cobrar resposta"], "best": "Esperar o tempo dele" },
  { "id": "ref-13", "prompt": "Você se sente sozinho em uma noite de sábado.", "options": ["Comer compulsivamente", "Ver um filme bom", "Ligar para um ex"], "best": "Ver um filme bom" },
  { "id": "ref-14", "prompt": "O vizinho está com som alto às 2 da manhã.", "options": ["Chamar a polícia", "Falar no interfone", "Bater na porta dele"], "best": "Falar no interfone" },
  { "id": "ref-15", "prompt": "Você é criticado por algo que não fez.", "options": ["Aceitar a culpa", "Defender-se com fatos", "Ficar agressivo"], "best": "Defender-se com fatos" },
  { "id": "ref-16", "prompt": "Sua internet cai durante uma chamada importante.", "options": ["Jogar o roteador", "Usar o 4G do celular", "Desistir da reunião"], "best": "Usar o 4G do celular" },
  { "id": "ref-17", "prompt": "Você sente inveja do sucesso de um colega.", "options": ["Torcer contra ele", "Usar como inspiração", "Evitar o colega"], "best": "Usar como inspiração" },
  { "id": "ref-18", "prompt": "O café acabou e você está super cansado.", "options": ["Ficar de mau humor", "Beber água gelada", "Dormir no trabalho"], "best": "Beber água gelada" },
  { "id": "ref-19", "prompt": "Alguém te corrige de forma arrogante.", "options": ["Responder ironicamente", "Agradecer o dado", "Discutir quem sabe mais"], "best": "Agradecer o dado" },
  { "id": "ref-20", "prompt": "Você esquece o aniversário de uma pessoa próxima.", "options": ["Fingir que não sabia", "Pedir desculpas sinceras", "Comprar presente caro"], "best": "Pedir desculpas sinceras" },
  { "id": "ref-21", "prompt": "A roupa que você queria usar está suja.", "options": ["Ficar com raiva", "Escolher outra", "Lavar no desespero"], "best": "Escolher outra" },
  { "id": "ref-22", "prompt": "Você ouve um barulho estranho em casa à noite.", "options": ["Paralisar de medo", "Checar com cautela", "Ligar para o 190"], "best": "Checar com cautela" },
  { "id": "ref-23", "prompt": "Um projeto que você amava foi cancelado.", "options": ["Sentir o luto e seguir", "Reclamar da empresa", "Parar de trabalhar"], "best": "Sentir o luto e seguir" },
  { "id": "ref-24", "prompt": "Você recebe um elogio inesperado.", "options": ["Ficar desconfiado", "Apenas dizer obrigado", "Diminuir seu feito"], "best": "Apenas dizer obrigado" },
  { "id": "ref-25", "prompt": "O garçom traz o pedido errado.", "options": ["Comer mesmo assim", "Pedir a troca educada", "Gritar com o garçom"], "best": "Pedir a troca educada" },
  { "id": "ref-26", "prompt": "Você está com muita fome e a comida demora.", "options": ["Ser rude com quem serve", "Beber água e esperar", "Ir embora bufando"], "best": "Beber água e esperar" },
  { "id": "ref-27", "prompt": "Seu celular cai e a tela quebra.", "options": ["Chorar e se xingar", "Ver o custo do conserto", "Comprar um novo agora"], "best": "Ver o custo do conserto" },
  { "id": "ref-28", "prompt": "Alguém dá um spoiler do seu filme favorito.", "options": ["Xingar a pessoa", "Ignorar e ver o filme", "Dar spoiler também"], "best": "Ignorar e ver o filme" },
  { "id": "ref-29", "prompt": "Você está atrasado e o farol fecha.", "options": ["Bater no volante", "Aceitar o atraso", "Acelerar no amarelo"], "best": "Aceitar o atraso" },
  { "id": "ref-30", "prompt": "Um elogio no post que você fez flopa.", "options": ["Apagar o post", "Validar-se sozinho", "Comprar likes"], "best": "Validar-se sozinho" },
  { "id": "ref-31", "prompt": "Você sente vontade de fumar/comer doce no foco.", "options": ["Ceder ao impulso", "Distrair-se por 5 min", "Se punir mentalmente"], "best": "Distrair-se por 5 min" },
  { "id": "ref-32", "prompt": "Alguém diz que você mudou muito (negativo).", "options": ["Ficar na defensiva", "Refletir sobre isso", "Cortar a pessoa"], "best": "Refletir sobre isso" },
  { "id": "ref-33", "prompt": "Você perdeu o ônibus por 30 segundos.", "options": ["Gritar com o motorista", "Esperar o próximo", "Ir a pé com raiva"], "best": "Esperar o próximo" },
  { "id": "ref-34", "prompt": "O banco cobrou uma taxa indevida.", "options": ["Ligar e contestar", "Ficar puto e ignorar", "Mudar de banco hoje"], "best": "Ligar e contestar" },
  { "id": "ref-35", "prompt": "Sua série favorita acabou.", "options": ["Ficar em depressão", "Buscar uma nova", "Ver tudo de novo"], "best": "Buscar uma nova" },
  { "id": "ref-36", "prompt": "Alguém te olha de cima a baixo na rua.", "options": ["Encarar de volta", "Continuar seu caminho", "Perguntar 'perdeu algo?'"], "best": "Continuar seu caminho" },
  { "id": "ref-37", "prompt": "Você recebe um convite que não quer ir.", "options": ["Inventar uma mentira", "Dizer não educadamente", "Ir e ficar de cara feia"], "best": "Dizer não educadamente" },
  { "id": "ref-38", "prompt": "Sua planta morreu.", "options": ["Sentir pena e jogar fora", "Ver o que errou", "Desistir de plantas"], "best": "Ver o que errou" },
  { "id": "ref-39", "prompt": "Seu time perdeu um jogo importante.", "options": ["Ficar mal o dia todo", "Reconhecer que é jogo", "Xingar os jogadores"], "best": "Reconhecer que é jogo" },
  { "id": "ref-40", "prompt": "O ar condicionado parou no calor de 40º.", "options": ["Reclamar sem parar", "Usar ventilador / banho", "Ficar imóvel"], "best": "Usar ventilador / banho" },
  { "id": "ref-41", "prompt": "Você encontrou um ex no mercado.", "options": ["Sair correndo", "Acenar e seguir", "Fingir que não viu"], "best": "Acenar e seguir" },
  { "id": "ref-42", "prompt": "Seu fone de ouvido parou de um lado.", "options": ["Jogar fora", "Ver se tem conserto", "Usar assim mesmo"], "best": "Ver se tem conserto" },
  { "id": "ref-43", "prompt": "Você está num lugar muito barulhento.", "options": ["Ficar irritado", "Usar fone / Sair", "Gritar com as pessoas"], "best": "Usar fone / Sair" },
  { "id": "ref-44", "prompt": "Uma criança chora alto no avião.", "options": ["Reclamar com os pais", "Usar fones de ouvido", "Olhar com cara feia"], "best": "Usar fones de ouvido" },
  { "id": "ref-45", "prompt": "Você postou algo errado no Instagram.", "options": ["Entrar em desespero", "Apagar ou corrigir", "Deixar lá e sofrer"], "best": "Apagar ou corrigir" },
  { "id": "ref-46", "prompt": "O Uber cancelou a viagem na sua frente.", "options": ["Chingar o app", "Pedir outro logo", "Desistir de sair"], "best": "Pedir outro logo" },
  { "id": "ref-47", "prompt": "Você se sente feio hoje.", "options": ["Ficar em casa", "Focar na sua higiene", "Se xingar no espelho"], "best": "Focar na sua higiene" },
  { "id": "ref-48", "prompt": "Sua comida queimou um pouco.", "options": ["Jogar tudo fora", "Comer a parte boa", "Chorar de frustração"], "best": "Comer a parte boa" },
  { "id": "ref-49", "prompt": "Alguém te interrompe várias vezes.", "options": ["Gritar 'me deixa falar'", "Pedir espaço para falar", "Parar de falar de vez"], "best": "Pedir espaço para falar" },
  { "id": "ref-50", "prompt": "Você termina este desafio!", "options": ["Ficar orgulhoso", "Achar que foi sorte", "Ir para o próximo logo"], "best": "Ficar orgulhoso" }
];

const shuffleStable = (items: string[], key: string) => {
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  return [...items].sort((a, b) => hash(`${a}-${key}`) - hash(`${b}-${key}`));
};

const shuffleBySeed = <T,>(items: T[], seedKey: string) => {
  let seed = 0;
  for (let i = 0; i < seedKey.length; i++) {
    seed = (seed * 31 + seedKey.charCodeAt(i)) >>> 0;
  }
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
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

const modeGroups = [
  {
    id: 'learn',
    title: 'Aprender',
    desc: 'Leia conceitos e organize a base.',
    theme: 'sky',
    modes: [{ id: 'cards' as Mode, label: 'Cards', emoji: '📚' }],
  },
  {
    id: 'train',
    title: 'Treinar',
    desc: 'Fixe o conteúdo e pratique respostas melhores.',
    theme: 'emerald',
    modes: [
      { id: 'quiz' as Mode, label: 'Quiz', emoji: '🧠' },
      { id: 'game' as Mode, label: 'Mini', emoji: '🎮' },
    ],
  },
  {
    id: 'play',
    title: 'Jogar',
    desc: 'Aprenda de forma leve com desafios rápidos.',
    theme: 'amber',
    modes: [
      { id: 'memory' as Mode, label: 'Memória', emoji: '🃏' },
      { id: 'link' as Mode, label: 'Ligar', emoji: '🔗' },
      { id: 'drag' as Mode, label: 'Arrastar', emoji: '🧲' },
      { id: 'sequence' as Mode, label: 'Sequência', emoji: '🧭' },
      { id: 'reflex' as Mode, label: 'Reflexo', emoji: '⚡' },
    ],
  },
];

const themeVoice: Record<Theme, { gender: 'masculino' | 'feminino'; label: 'SERENO' | 'SERENA'; voice: string }> = {
  ansiedade: { gender: 'feminino', label: 'SERENA', voice: 'pt-BR-FranciscaNeural' },
  relacionamentos: { gender: 'feminino', label: 'SERENA', voice: 'pt-BR-FranciscaNeural' },
  autocuidado: { gender: 'feminino', label: 'SERENA', voice: 'pt-BR-FranciscaNeural' },
  crise: { gender: 'masculino', label: 'SERENO', voice: 'pt-BR-AntonioNeural' },
  cognitivo: { gender: 'masculino', label: 'SERENO', voice: 'pt-BR-AntonioNeural' },
};

const stripEmojiFromNarration = (text: string) => text.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s{2,}/g, ' ').trim();
const summarizeCard = (text: string, max = 72) => {
  const cleaned = stripEmojiFromNarration(text).replace(/\n+/g, ' ');
  return cleaned.length > max ? `${cleaned.slice(0, max).trim()}...` : cleaned;
};

const getPracticeContent = (pill: Pill) => {
  const common = {
    title: pill.title,
    actionLabel: 'Concluir prática',
  };

  const byId: Record<string, { intro: string; steps: string[]; tip: string }> = {
    ansiedade: {
      intro: 'Vamos reduzir a intensidade primeiro, antes de tentar resolver tudo.',
      steps: ['Solte os ombros.', 'Inspire por 4 segundos.', 'Expire por 6 segundos, 4 vezes seguidas.'],
      tip: 'Ansiedade é alerta, não prova de perigo imediato.',
    },
    grounding: {
      intro: 'Esta prática ajuda a trazer sua atenção de volta para o presente.',
      steps: ['Nomeie 5 coisas que você vê.', 'Depois 4 sons que consegue ouvir.', 'Toque 3 coisas ao seu redor e descreva a textura.'],
      tip: 'Você não precisa sentir melhora total para a prática estar funcionando.',
    },
    respiracao: {
      intro: 'Use a barriga para conduzir a respiração e baixar o estado de alerta.',
      steps: ['Coloque uma mão no peito e outra na barriga.', 'Puxe o ar tentando mover mais a mão da barriga.', 'Repita 5 ciclos lentos.'],
      tip: 'Mais lento costuma ajudar mais do que mais fundo.',
    },
    mindfulness: {
      intro: 'Aqui o foco não é esvaziar a mente, e sim voltar ao momento presente.',
      steps: ['Perceba sua respiração por 30 segundos.', 'Note 1 sensação no corpo sem julgar.', 'Quando a mente fugir, apenas volte.'],
      tip: 'Presença sem cobrança já é prática.',
    },
    autocompaixao: {
      intro: 'Vamos trocar dureza por uma resposta interna mais gentil.',
      steps: ['Nomeie o momento difícil em 1 frase.', 'Diga: “isso está difícil agora”.', 'Complete com: “mesmo assim, eu mereço cuidado”.'],
      tip: 'Gentileza consigo não cancela responsabilidade.',
    },
    autovalidacao: {
      intro: 'Validar não é exagerar a emoção. É parar de brigar com ela.',
      steps: ['Nomeie o que você sente.', 'Diga: “faz sentido eu me sentir assim agora”.', 'Escolha uma ação pequena para se apoiar.'],
      tip: 'Reconhecer o que sente costuma regular mais do que negar.',
    },
    limites: {
      intro: 'Limite saudável é clareza com respeito.',
      steps: ['Pense em algo que você não consegue sustentar hoje.', 'Transforme isso em uma frase simples.', 'Exemplo: “Hoje não consigo, mas posso retomar amanhã”.'],
      tip: 'Um limite claro protege energia e relação ao mesmo tempo.',
    },
    tcc: {
      intro: 'Vamos sair do automático e olhar o pensamento com mais realidade.',
      steps: ['Escreva mentalmente o pensamento automático.', 'Pergunte: “qual é a evidência real disso?”.', 'Crie uma versão mais justa em 1 frase.'],
      tip: 'Pensamento não é fato.',
    },
    distorcao: {
      intro: 'O objetivo é reconhecer o viés, não se culpar por ele.',
      steps: ['Observe o pensamento que mais pesa agora.', 'Pergunte se ele está em tudo-ou-nada, catastrofização ou leitura mental.', 'Reescreva a ideia de forma mais equilibrada.'],
      tip: 'Nomear a distorção já diminui o poder dela.',
    },
    'distancia-cognitiva': {
      intro: 'Criar distância ajuda você a escolher melhor a próxima ação.',
      steps: ['Pegue um pensamento difícil.', 'Troque “isso é verdade” por “estou tendo o pensamento de que...”.', 'Respire uma vez e releia essa frase por dentro.'],
      tip: 'Separar-se um pouco do pensamento abre espaço interno.',
    },
    ruminacao: {
      intro: 'Vamos interromper o giro mental com uma ação pequena.',
      steps: ['Perceba qual pensamento está repetindo.', 'Pergunte: “isso está resolvendo algo agora?”.', 'Escolha uma micro-ação de 5 minutos.'],
      tip: 'Ação pequena costuma regular melhor do que pensar mais.',
    },
    burnout: {
      intro: 'Primeiro, cheque seu nível de energia sem se julgar.',
      steps: ['Dê uma nota de 0 a 10 para sua energia.', 'Escolha uma pausa real de 3 minutos.', 'Reduza a próxima tarefa para uma versão menor.'],
      tip: 'Pausa estratégica também é produtividade saudável.',
    },
    default: {
      intro: 'Use esta prática curta para transformar o conteúdo em algo vivido.',
      steps: ['Leia a sugestão com calma.', 'Escolha uma forma bem pequena de colocá-la em ação.', 'Perceba como você fica depois desse movimento.'],
      tip: 'Prática curta ainda conta como aprendizado real.',
    },
  };

  const config = byId[pill.id] || byId.default;
  return { ...common, ...config };
};

export default function PsychoeducationSection({ darkMode: dm, desktopMode = false, onNavigate, onComplete, isPro = false, onShowUpgrade }: Props) {
  const themeScrollRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const [lastOpenedCardId, setLastOpenedCardId] = useLocalStorage<string>('psico_last_opened_card', '');
  const [noticeMessage, setNoticeMessage] = useState('');

  const [selected, setSelected] = useState<string | null>(null);
  const [practicePillId, setPracticePillId] = useState<string | null>(null);
  const [lockNotice, setLockNotice] = useState<string>('');
  const [mode, setMode] = useState<Mode>('cards');
  const [q, setQ] = useState('');
  const [theme, setTheme] = useState<Theme | null>(null);
  const [sortMode, setSortMode] = useState<'recommended' | 'mostRead' | 'favorites' | 'unread'>('recommended');

  const [quizLength, setQuizLength] = useState<10 | 20 | 40>(10);
  const [quizThemes, setQuizThemes] = useState<Theme[]>([]);
  const [quizSource, setQuizSource] = useState<'mixed' | 'theme' | 'recommended'>('mixed');
  const [quizResult, setQuizResult] = useState<string>('');
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizRound, setQuizRound] = useState(1);
  const [quizHits, setQuizHits] = useState(0);
  const [quizSeed, setQuizSeed] = useState(() => Date.now());
  const [quizRecords, setQuizRecords] = useLocalStorage<QuizRecord[]>('psico_quiz_records', []);

  const [gameIndex, setGameIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameFeedback, setGameFeedback] = useState('');
  const [gameSelectedOption, setGameSelectedOption] = useState<string | null>(null);
  const [gameLength, setGameLength] = useState<10 | 20 | 40>(10);
  const [gameSeed, setGameSeed] = useState(() => Date.now());

  const [memoryOpen, setMemoryOpen] = useState<number[]>([]);
  const [memoryMatched, setMemoryMatched] = useState<number[]>([]);
  const [memoryMode, setMemoryMode] = useState<'texto' | 'imagens'>('texto');
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [memorySeed, setMemorySeed] = useState(() => Date.now());
  const [memoryProgress, setMemoryProgress] = useState<{ texto: number; imagens: number }>({ texto: 0, imagens: 0 });
  const [memoryAttempts, setMemoryAttempts] = useState<{ texto: number; imagens: number }>({ texto: 0, imagens: 0 });

  const [linkIndex, setLinkIndex] = useState(0);
  const [linkScore, setLinkScore] = useState(0);
  const [linkFeedback, setLinkFeedback] = useState('');
  const [linkSelectedOption, setLinkSelectedOption] = useState<string | null>(null);
  const [linkLength, setLinkLength] = useState<16 | 33 | 65>(16);
  const [linkSeed, setLinkSeed] = useState(() => Date.now());
  const [linkRecords, setLinkRecords] = useLocalStorage<LinkRecord[]>('psico_link_records', []);

  const [todayMissionIds, setTodayMissionIds] = useLocalStorage<string[]>('psico_today_missions', ['read2', 'quiz1', 'action1']);

  const [dragIndex, setDragIndex] = useState(0);
  const [dragFeedback, setDragFeedback] = useState('');
  const [dragScore, setDragScore] = useState(0);
  const [draggedOption, setDraggedOption] = useState<string | null>(null);
  const [dragSelectedOption, setDragSelectedOption] = useState<string | null>(null);
  const [dragLength, setDragLength] = useState<12 | 25 | 50>(12);
  const [dragSeed, setDragSeed] = useState(() => Date.now());
  const [dragRecords, setDragRecords] = useLocalStorage<DragRecord[]>('psico_drag_records', []);

  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [sequenceOrder, setSequenceOrder] = useState<string[]>([...sequenceRounds[0].steps].sort());
  const [sequenceFeedback, setSequenceFeedback] = useState('');
  const [sequenceHits, setSequenceHits] = useState(0);
  const [sequenceLength, setSequenceLength] = useState<12 | 25 | 50>(12);
  const [sequenceSeed, setSequenceSeed] = useState(() => Date.now());
  const [sequenceRecords, setSequenceRecords] = useLocalStorage<SequenceRecord[]>('psico_sequence_records', []);

  const sequenceLengthTone = {
    12: { active: 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-200 shadow-lg', inactiveLight: 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200', inactiveDark: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-indigo-500/50' },
    25: { active: 'bg-violet-600 text-white border-violet-500 shadow-violet-200 shadow-lg', inactiveLight: 'bg-white text-slate-400 border-slate-100 hover:border-violet-200', inactiveDark: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-violet-500/50' },
    50: { active: 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-fuchsia-200 shadow-lg', inactiveLight: 'bg-white text-slate-400 border-slate-100 hover:border-fuchsia-200', inactiveDark: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-fuchsia-500/50' },
  };

  const [reflexIndex, setReflexIndex] = useState(0);
  const [reflexFeedback, setReflexFeedback] = useState('');
  const [reflexScore, setReflexScore] = useState(0);
  const [reflexTimeLeft, setReflexTimeLeft] = useState(30);
  const [reflexLength, setReflexLength] = useState<12 | 25 | 50>(12);
  const [reflexDifficulty, setReflexDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil' | 'Ultra'>('Fácil');
  const [reflexSeed, setReflexSeed] = useState(() => Date.now());
  const [reflexRecords, setReflexRecords] = useLocalStorage<ReflexRecord[]>('psico_reflex_records', []);
  const [reflexTimes, setReflexTimes] = useState<number[]>([]);
  const [reflexInProgress, setReflexInProgress] = useState(false);
  const [reflexSelectedOption, setReflexSelectedOption] = useState<string | null>(null);
  const [reflexSuccess, setReflexSuccess] = useState(false);
  const [reflexLastResponseTime, setReflexLastResponseTime] = useState<number | null>(null);

  const getPillActionRoute = (pill: Pill) => {
    if (pill.id === 'grounding') return { label: 'Abrir SOS', tab: 'sos' as const };
    if (pill.id === 'mindfulness') return { label: 'Abrir Meditação', tab: 'meditation' as const };
    if (pill.id === 'higiene-digital') return { label: 'Abrir Modo Sono', tab: 'sleep' as const };
    if (pill.theme === 'ansiedade') return { label: 'Abrir Respiração', tab: 'breathing' as const };
    if (pill.theme === 'crise') return { label: 'Abrir SOS', tab: 'sos' as const };
    if (pill.theme === 'autocuidado') return { label: 'Abrir Microtarefas', tab: 'microtasks' as const };
    if (pill.theme === 'relacionamentos') return { label: 'Abrir Diário', tab: 'diary' as const, params: { diaryMode: 'quick' } };
    return { label: 'Abrir Diário', tab: 'diary' as const, params: { diaryMode: 'quick' } };
  };

  const c = (l: string, d: string) => (dm ? d : l);
  const availableModes = useMemo<Mode[]>(() => (isPro ? ['cards', 'quiz', 'game', 'memory', 'link', 'drag', 'sequence', 'reflex'] : ['cards']), [isPro]);

  useEffect(() => {
    if (!availableModes.includes(mode)) {
      setMode('cards');
    }
  }, [availableModes, mode]);

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

  const recommendedCard = useMemo(() => {
    if (!pills.length) return null;
    const themedPool = theme ? pills.filter((pill) => pill.theme === theme) : pills;
    const basePool = themedPool.length ? themedPool : pills;
    const seed = Number(today.replaceAll('-', ''));
    return basePool[seed % basePool.length] || basePool[0];
  }, [theme, today]);

  const lastOpenedCard = useMemo(
    () => pills.find((pill) => pill.id === lastOpenedCardId) || null,
    [lastOpenedCardId],
  );

  const recommendedQuizTheme = useMemo(() => {
    const seed = Number(today.replaceAll('-', ''));
    const scores = (Object.keys(themeLabel) as Theme[]).map((item, index) => {
      const themePills = pills.filter((pill) => pill.theme === item);
      const unread = themePills.filter((pill) => !read.includes(pill.id)).length;
      const favoriteBoost = themePills.filter((pill) => favorites.includes(pill.id)).length * 2;
      const recentBoost = dailyReadIds.filter((id) => themePills.some((pill) => pill.id === id)).length * 3;
      const lastOpenedBoost = lastOpenedCard?.theme === item ? 4 : 0;
      const activeFilterBoost = theme === item ? 2 : 0;
      const rotationBoost = ((seed + index) % 5) * 0.1;
      return {
        theme: item,
        score: unread * 3 + favoriteBoost + recentBoost + lastOpenedBoost + activeFilterBoost + rotationBoost,
      };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.theme || 'ansiedade';
  }, [dailyReadIds, favorites, lastOpenedCard?.theme, read, theme, today]);

  const recommendedQuizReason = useMemo(() => {
    const unreadInTheme = pills.filter((pill) => pill.theme === recommendedQuizTheme && !read.includes(pill.id)).length;
    if (unreadInTheme > 0) {
      return `Priorizando ${themeLabel[recommendedQuizTheme].toLowerCase()} com conteúdos que você ainda não viu.`;
    }
    if (lastOpenedCard?.theme === recommendedQuizTheme) {
      return `Seguindo o tema que mais conversa com o que você abriu por último.`;
    }
    return `Mistura equilibrada com base no seu uso recente e na rotação do dia.`;
  }, [lastOpenedCard?.theme, read, recommendedQuizTheme]);

  const quizQuestionCounts = useMemo(
    () =>
      (Object.keys(themeLabel) as Theme[]).map((item) => ({
        theme: item,
        total: quizQuestions.filter((question) => question.theme === item).length,
      })),
    [],
  );

  const quizSelectedThemes = useMemo(() => {
    if (quizSource === 'theme') {
      return quizThemes.length ? quizThemes : [theme || recommendedQuizTheme];
    }
    if (quizSource === 'recommended') {
      return [recommendedQuizTheme];
    }
    return [] as Theme[];
  }, [quizSource, quizThemes, theme, recommendedQuizTheme]);

  const toggleQuizTheme = (item: Theme) => {
    setQuizThemes((prev) => {
      if (prev.includes(item)) {
        return prev.length === 1 ? prev : prev.filter((themeItem) => themeItem !== item);
      }
      return [...prev, item];
    });
  };

  const resetQuizSession = (nextSeed = Date.now()) => {
    setQuizRound(1);
    setQuizResult('');
    setQuizSelectedOption(null);
    setQuizHits(0);
    setQuizSeed(nextSeed);
  };

  const resetMiniSession = (nextSeed = Date.now()) => {
    setGameIndex(0);
    setGameScore(0);
    setGameFeedback('');
    setGameSelectedOption(null);
    setGameSeed(nextSeed);
  };

  const resetMemorySession = (nextSeed = Date.now()) => {
    setMemoryOpen([]);
    setMemoryMatched([]);
    setMemoryBusy(false);
    setMemorySeed(nextSeed);
    setMemoryAttempts((prev) => ({ ...prev, [memoryMode]: 0 }));
  };

  const resetLinkSession = (nextSeed = Date.now()) => {
    setLinkIndex(0);
    setLinkScore(0);
    setLinkFeedback('');
    setLinkSelectedOption(null);
    setLinkSeed(nextSeed);
  };

  const resetDragSession = (nextSeed = Date.now()) => {
    setDragIndex(0);
    setDragFeedback('');
    setDragScore(0);
    setDraggedOption(null);
    setDragSelectedOption(null);
    setDragSeed(nextSeed);
  };

  const themeProgress = useMemo(
    () =>
      (Object.keys(themeLabel) as Theme[]).map((item) => {
        const total = pills.filter((pill) => pill.theme === item).length;
        const completed = pills.filter((pill) => pill.theme === item && read.includes(pill.id)).length;
        return { theme: item, total, completed };
      }),
    [read],
  );

  const bestQuizHighlights = useMemo(() => {
    const bestByTheme = (Object.keys(themeLabel) as Theme[])
      .map((item) => {
        const matches = quizRecords.filter((record) => record.themes.includes(item));
        if (!matches.length) return null;
        const best = [...matches].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
        return { theme: item, record: best };
      })
      .filter((item): item is { theme: Theme; record: QuizRecord } => Boolean(item))
      .sort((a, b) => b.record.accuracy - a.record.accuracy)[0] || null;

    const bestByLength = ([10, 20, 40] as const)
      .map((length) => {
        const matches = quizRecords.filter((record) => record.length === length);
        if (!matches.length) return null;
        const best = [...matches].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
        return { length, record: best };
      })
      .filter((item): item is { length: 10 | 20 | 40; record: QuizRecord } => Boolean(item))
      .sort((a, b) => b.record.accuracy - a.record.accuracy)[0] || null;

    const overall = quizRecords.length
      ? [...quizRecords].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0]
      : null;

    return { bestByTheme, bestByLength, overall };
  }, [quizRecords]);

  const bestLinkHighlights = useMemo(() => {
    const bestOverall = linkRecords.length
      ? [...linkRecords].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0]
      : null;
    const bestByLength = ([16, 33, 65] as const)
      .map((length) => {
        const matches = linkRecords.filter((record) => record.length === length);
        if (!matches.length) return null;
        const best = [...matches].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
        return { length, record: best };
      })
      .filter((item): item is { length: 16 | 33 | 65; record: LinkRecord } => Boolean(item))
      .sort((a, b) => b.record.accuracy - a.record.accuracy)[0] || null;
    return { bestOverall, bestByLength };
  }, [linkRecords]);

  const bestDragHighlights = useMemo(() => {
    const bestOverall = dragRecords.length
      ? [...dragRecords].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0]
      : null;
    const bestByLength = ([12, 25, 50] as const)
      .map((length) => {
        const matches = dragRecords.filter((record) => record.length === length);
        if (!matches.length) return null;
        const best = [...matches].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
        return { length, record: best };
      })
      .filter((item): item is { length: 12 | 25 | 50; record: DragRecord } => Boolean(item))
      .sort((a, b) => b.record.accuracy - a.record.accuracy)[0] || null;
    return { bestOverall, bestByLength };
  }, [dragRecords]);

  const orderedCards = useMemo(() => {
    const counts = dailyReadIds.reduce<Record<string, number>>((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    const ranked = [...filtered];
    if (sortMode === 'mostRead') {
      ranked.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    } else if (sortMode === 'favorites') {
      ranked.sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
    } else if (sortMode === 'unread') {
      ranked.sort((a, b) => Number(read.includes(a.id)) - Number(read.includes(b.id)));
    } else {
      ranked.sort((a, b) => {
        const aScore = Number(a.id === recommendedCard?.id) * 4 + Number(!read.includes(a.id)) * 2 + Number(favorites.includes(a.id));
        const bScore = Number(b.id === recommendedCard?.id) * 4 + Number(!read.includes(b.id)) * 2 + Number(favorites.includes(b.id));
        return bScore - aScore;
      });
    }
    return ranked;
  }, [dailyReadIds, favorites, filtered, read, recommendedCard, sortMode]);

  const nextUnlock = useMemo(() => {
    const locked = (Object.keys(themeLabel) as Theme[])
      .filter((item) => !phaseUnlocked[item])
      .sort((a, b) => unlockXpByTheme[a] - unlockXpByTheme[b])[0];
    if (!locked) return null;
    return {
      theme: locked,
      need: Math.max(0, unlockXpByTheme[locked] - xp),
      total: unlockXpByTheme[locked],
    };
  }, [phaseUnlocked, xp]);

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
    const isFirstRead = !read.includes(id);
    if (!dailyReadIds.includes(id)) {
      setDailyReadIds((prev) => [...prev, id]);
      setReadToday((v) => v + 1);
    }

    if (!read.includes(id)) {
      setRead([...read, id]);
      gainXp(10);
      onComplete?.(`psychoedu-read:${id}`, 2);
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

  const completePractice = () => {
    setPracticePillId(null);
    runAction();
    onComplete?.(`psychoedu-practice:${practicePillId}`, 4);
  };

  const submitQuiz = (option: string) => {
    setQuizSelectedOption(option);
    if (option === activeQuizQuestion.answer) {
      setQuizResult('✅ Acertou! +20 XP');
      gainXp(20);
      setQuizStreak((s) => s + 1);
      setQuizToday((v) => v + 1);
      setQuizHits((value) => value + 1);
    } else {
      setQuizResult(`❌ Quase! Resposta certa: ${activeQuizQuestion.answer}`);
      setQuizStreak(0);
    }
  };

  const nextQuizRound = () => {
    if (quizRound >= quizLength) {
      const accuracy = Math.round((quizHits / quizLength) * 100);
      setQuizRecords((prev) => [
        {
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          length: quizLength,
          source: quizSource,
          themes: quizSelectedThemes,
          correct: quizHits,
          total: quizLength,
          accuracy,
        },
        ...prev,
      ].slice(0, 60));
      resetQuizSession();
    } else {
      setQuizRound((value) => value + 1);
      setQuizResult('');
      setQuizSelectedOption(null);
    }
  };

  const submitMiniGame = (option: string) => {
    if (gameSelectedOption) return;
    const challenge = activeMiniChallenge;
    setGameSelectedOption(option);
    if (option === challenge.answer) {
      setGameScore((s) => s + 1);
      gainXp(30);
      setGameFeedback('✅ Boa escolha! +30 XP');
      setGameToday((v) => v + 1);
    } else {
      setGameFeedback(`❌ A melhor resposta era: ${challenge.answer}`);
    }
  };

  const nextMiniRound = () => {
    if (gameIndex < gameLength - 1) {
      setGameIndex((i) => i + 1);
      setGameFeedback('');
      setGameSelectedOption(null);
      return;
    }

    resetMiniSession();
  };

  const quizBasePool = useMemo(() => {
    if (quizSource === 'theme') {
      const lockedThemes = quizSelectedThemes.length ? quizSelectedThemes : [theme || recommendedQuizTheme];
      return quizQuestions.filter((question) => lockedThemes.includes(question.theme));
    }

    if (quizSource === 'recommended') {
      return quizQuestions.filter((question) => question.theme === recommendedQuizTheme);
    }

    return quizQuestions;
  }, [quizSelectedThemes, quizSource, recommendedQuizTheme, theme]);
  const quizSessionQuestions = useMemo(() => {
    const base = quizBasePool.length ? quizBasePool : quizQuestions;
    const shuffled = shuffleStable(
      base.map((question) => question.id),
      `quiz-session-${quizSource}-${quizLength}-${quizSelectedThemes.join(',') || 'all'}-${recommendedQuizTheme}-${quizSeed}`
    );
    const ordered = shuffled
      .map((id) => quizQuestions.find((question) => question.id === id))
      .filter((question): question is QuizQuestion => Boolean(question));
    return ordered.slice(0, quizLength);
  }, [quizBasePool, quizLength, quizSelectedThemes, quizSource, recommendedQuizTheme, quizSeed]);
  const activeQuizQuestion = quizSessionQuestions[Math.min(quizRound - 1, quizSessionQuestions.length - 1)] || quizQuestions[0];
  const randomizedQuizOptions = useMemo(
    () => shuffleBySeed(activeQuizQuestion.options, `quiz-options-${activeQuizQuestion.id}-${quizRound}-${quizSeed}`),
    [activeQuizQuestion.id, activeQuizQuestion.options, quizRound, quizSeed]
  );
  const gameSessionChallenges = useMemo(() => {
    const shuffled = shuffleStable(miniChallenges.map((challenge) => challenge.id), `mini-session-${gameLength}-${gameSeed}`);
    return shuffled
      .map((id) => miniChallenges.find((challenge) => challenge.id === id))
      .filter((challenge): challenge is (typeof miniChallenges)[number] => Boolean(challenge))
      .slice(0, gameLength);
  }, [gameLength, gameSeed]);
  const activeMiniChallenge = gameSessionChallenges[Math.min(gameIndex, gameSessionChallenges.length - 1)] || miniChallenges[0];
  const randomizedMiniOptions = useMemo(
    () => shuffleBySeed(activeMiniChallenge.options, `mini-options-${activeMiniChallenge.id}-${gameIndex}-${gameSeed}`),
    [activeMiniChallenge.id, activeMiniChallenge.options, gameIndex, gameSeed]
  );
  const dragSessionRounds = useMemo(() => {
    const shuffled = shuffleBySeed(dragRounds, `drag-session-${dragLength}-${dragSeed}`);
    return shuffled.slice(0, dragLength);
  }, [dragLength, dragSeed]);
  const activeDragRound = dragSessionRounds[Math.min(dragIndex, dragSessionRounds.length - 1)] || dragRounds[0];
  const activeDragThought = useMemo(() => getDragThoughtMeta(activeDragRound.toxic), [activeDragRound.toxic]);
  const dragExtraOption = useMemo(() => {
    const pool = Array.from(
      new Set(
        dragRounds
          .flatMap((round) => round.options)
          .filter((option) => !activeDragRound.options.includes(option))
      )
    );
    return shuffleBySeed(pool, `drag-extra-${activeDragRound.toxic}-${dragSeed}`)[0] || 'Posso pausar, respirar e checar os fatos antes de concluir.';
  }, [activeDragRound.options, activeDragRound.toxic, dragSeed]);
  const dragOptionsPool = useMemo(
    () => Array.from(new Set([...activeDragRound.options, dragExtraOption])).slice(0, 4),
    [activeDragRound.options, dragExtraOption]
  );
  const randomizedDragOptions = useMemo(
    () => shuffleBySeed(dragOptionsPool, `drag-options-${activeDragRound.toxic}-${dragIndex}-${dragSeed}`),
    [dragOptionsPool, activeDragRound.toxic, dragIndex, dragSeed]
  );
  /* randomizedReflexOptions moved to be near other reflex logic */
  const linkSessionChallenges = useMemo(() => {
    const shuffled = shuffleBySeed(linkChallenges, `link-session-${linkLength}-${linkSeed}`);
    return shuffled.slice(0, linkLength);
  }, [linkLength, linkSeed]);
  const activeLinkChallenge = linkSessionChallenges[Math.min(linkIndex, linkSessionChallenges.length - 1)] || linkChallenges[0];
  const randomizedLinkOptions = useMemo(
    () => {
      const current = activeLinkChallenge;
      const distractors = shuffleBySeed(
        linkChallenges.filter((item) => item.right !== current.right).map((item) => item.right),
        `link-distractors-${linkIndex}-${linkSeed}`
      ).slice(0, 4);
      return shuffleBySeed([current.right, ...distractors], `link-options-${linkIndex}-${linkSeed}`);
    },
    [activeLinkChallenge, linkIndex, linkSeed]
  );

  const gameEnded = gameIndex >= gameLength - 1 && gameFeedback !== '';
  const dragEnded = dragIndex >= dragLength - 1 && dragFeedback !== '';

  const memoryDeck = useMemo(() => {
    if (memoryMode === 'texto') {
      const flat = memoryPairs.flatMap(([a, b]) => [{ key: `${a}-q`, pair: a, text: a }, { key: `${a}-a`, pair: a, text: b }]);
      return shuffleBySeed(flat, `memory-${memoryMode}-${memorySeed}`);
    }

    const imagePairs = pills.slice(0, 6).map((p) => ({ id: p.id, emoji: p.emoji }));
    const flat = imagePairs.flatMap((p) => [
      { key: `${p.id}-a`, pair: p.id, text: p.emoji },
      { key: `${p.id}-b`, pair: p.id, text: p.emoji },
    ]);
    return shuffleBySeed(flat, `memory-${memoryMode}-${memorySeed}`);
  }, [memoryMode, memorySeed]);

  const flipMemory = (idx: number) => {
    if (memoryBusy) return;
    if (memoryMatched.includes(idx) || memoryOpen.includes(idx)) return;

    const next = [...memoryOpen, idx];
    setMemoryOpen(next);

    if (next.length === 2) {
      setMemoryBusy(true);
      const [a, b] = next;
      setMemoryAttempts((prev) => ({ ...prev, [memoryMode]: prev[memoryMode] + 1 }));
      const isMatch = memoryDeck[a].pair === memoryDeck[b].pair;

      setTimeout(() => {
        if (isMatch) {
          setMemoryMatched((m) => Array.from(new Set([...m, a, b])));
          setMemoryProgress((prev) => ({
            ...prev,
            [memoryMode]: Math.max(prev[memoryMode], (memoryMatched.length / 2) + 1),
          }));
          gainXp(15);
        }
        setMemoryOpen([]);
        setMemoryBusy(false);
      }, 550);
    }
  };

  const memoryTarget = memoryMode === 'texto' ? memoryPairs.length : 6;
  const memoryCompleted = memoryMatched.length / 2 === memoryTarget;

  const answerLink = (option: string) => {
    if (linkSelectedOption) return;
    const current = activeLinkChallenge;
    setLinkSelectedOption(option);
    if (option === current.right) {
      setLinkScore((s) => s + 1);
      gainXp(20);
      setLinkFeedback('✅ Conexão correta! +20 XP');
    } else {
      setLinkFeedback(`❌ Correto: ${current.right}`);
    }
  };

  const nextLinkRound = () => {
    if (linkIndex < linkLength - 1) {
      setLinkIndex((i) => i + 1);
      setLinkFeedback('');
      setLinkSelectedOption(null);
      return;
    }
    const accuracy = Math.round((linkScore / linkLength) * 100);
    setLinkRecords((prev) => [
      {
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        length: linkLength,
        correct: linkScore,
        total: linkLength,
        accuracy,
      },
      ...prev,
    ].slice(0, 60));
    resetLinkSession();
  };

  const answerDrag = (option: string) => {
    if (dragFeedback) return;
    const current = activeDragRound;
    setDragSelectedOption(option);
    if (option === current.answer) {
      setDragScore((s) => s + 1);
      gainXp(20);
      setDragFeedback('✅ Boa reformulação! +20 XP');
    } else {
      setDragFeedback(`❌ Melhor: ${current.answer}`);
    }
    setDraggedOption(null);
  };

  const onDropDrag = (e: any) => {
    e.preventDefault();
    const option = e.dataTransfer.getData('text/plain') || draggedOption;
    if (option) answerDrag(option);
  };

  const nextDragRound = () => {
    if (dragIndex < dragLength - 1) {
      setDragIndex((i) => i + 1);
      setDragFeedback('');
      setDragSelectedOption(null);
      setDraggedOption(null);
      return;
    }

    const accuracy = Math.round((dragScore / dragLength) * 100);
    setDragRecords((prev) => [
      {
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        length: dragLength,
        correct: dragScore,
        total: dragLength,
        accuracy,
      },
      ...prev,
    ].slice(0, 60));
    resetDragSession();
  };

  const scrollThemes = (direction: 'left' | 'right') => {
    themeScrollRef.current?.scrollBy({
      left: direction === 'left' ? -180 : 180,
      behavior: 'smooth',
    });
  };

  const moveSequence = (idx: number, dir: -1 | 1) => {
    if (sequenceFeedback) return;
    const next = [...sequenceOrder];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSequenceOrder(next);
  };

  const resetSequenceSession = (nextSeed = Date.now()) => {
    setSequenceIndex(0);
    setSequenceFeedback('');
    setSequenceHits(0);
    setSequenceSeed(nextSeed);
  };

  const sequenceSessionRounds = useMemo(() => {
    return shuffleBySeed(sequenceRounds, `seq-${sequenceSeed}`).slice(0, sequenceLength);
  }, [sequenceLength, sequenceSeed]);

  const activeSequenceRound = sequenceSessionRounds[sequenceIndex] || sequenceSessionRounds[0] || sequenceRounds[0];
  const sequenceEnded = sequenceIndex >= sequenceLength - 1 && sequenceFeedback.startsWith('✅');
  const activeSequenceTone = useMemo(
    () => getSequenceTone(activeSequenceRound.title, activeSequenceRound.situation),
    [activeSequenceRound.title, activeSequenceRound.situation]
  );
  const randomizedSequenceOrder = useMemo(
    () => shuffleBySeed(activeSequenceRound.steps, `sequence-order-${activeSequenceRound.id}-${sequenceIndex}-${sequenceSeed}`),
    [activeSequenceRound.id, activeSequenceRound.steps, sequenceIndex, sequenceSeed]
  );

  useEffect(() => {
    if (activeSequenceRound) {
      setSequenceOrder(randomizedSequenceOrder);
    }
  }, [activeSequenceRound, randomizedSequenceOrder]);

  const checkSequence = () => {
    const current = activeSequenceRound;
    const ok = sequenceOrder.every((s, i) => s === current.steps[i]);
    if (ok) {
      if (!sequenceFeedback) {
        gainXp(30);
        setSequenceHits((s) => s + 1);
      }
      setSequenceFeedback(`✅ Perfeito! ${current.explanation}`);
    } else {
      setSequenceFeedback(`❌ Quase! A ordem ideal é: ${current.steps.join(' → ')}. ${current.explanation}`);
    }
  };

  const nextSequenceRound = () => {
    if (sequenceIndex < sequenceLength - 1) {
      setSequenceIndex((i) => i + 1);
      setSequenceFeedback('');
    } else {
      const accuracy = Math.round((sequenceHits / sequenceLength) * 100);
      setSequenceRecords((prev) => [
        { id: `${Date.now()}`, createdAt: new Date().toISOString(), length: sequenceLength, correct: sequenceHits, total: sequenceLength, accuracy },
        ...prev
      ].slice(0, 60));
      resetSequenceSession();
    }
  };

  const bestSequenceHighlights = useMemo(() => {
    const bestOverall = sequenceRecords.length
      ? [...sequenceRecords].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0]
      : null;
    const bestByLength = ([12, 25, 50] as const)
      .map((length) => {
        const matches = sequenceRecords.filter((record) => record.length === length);
        if (!matches.length) return null;
        const best = [...matches].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
        return { length, record: best };
      })
      .filter((item): item is { length: 12 | 25 | 50; record: SequenceRecord } => Boolean(item))
      .sort((a, b) => b.record.accuracy - a.record.accuracy)[0] || null;
    return { bestOverall, bestByLength };
  }, [sequenceRecords]);

  useEffect(() => {
    resetMemorySession(Date.now());
  }, [memoryMode]);

  useEffect(() => {
    if (mode !== 'memory') return;
    resetMemorySession(Date.now());
  }, [mode]);

  const resetReflexSession = (nextSeed = Date.now()) => {
    setReflexIndex(0);
    setReflexScore(0);
    setReflexFeedback('');
    setReflexSeed(nextSeed);
    setReflexTimes([]);
    setReflexSelectedOption(null);
    setReflexSuccess(false);
    setReflexLastResponseTime(null);
    const max = reflexDifficulty === 'Fácil' ? 30 : reflexDifficulty === 'Médio' ? 20 : reflexDifficulty === 'Difícil' ? 10 : 8;
    setReflexTimeLeft(max);
  };

  const reflexSessionRounds = useMemo(() => {
    return shuffleBySeed(reflexRounds, `reflex-${reflexSeed}`).slice(0, reflexLength);
  }, [reflexLength, reflexSeed]);

  const activeReflexRound = reflexSessionRounds[reflexIndex] || reflexSessionRounds[0] || reflexRounds[0];

  const reflexMaxTime = useMemo(() => {
    return reflexDifficulty === 'Fácil' ? 30 : reflexDifficulty === 'Médio' ? 20 : reflexDifficulty === 'Difícil' ? 10 : 8;
  }, [reflexDifficulty]);
  const reflexTimePct = Math.max(0, Math.min(100, (reflexTimeLeft / reflexMaxTime) * 100));
  const reflexAvgTimeLive = reflexTimes.length
    ? Number((reflexTimes.reduce((a, b) => a + b, 0) / reflexTimes.length).toFixed(2))
    : null;
  const reflexBestTimeLive = reflexTimes.length ? Number(Math.min(...reflexTimes).toFixed(2)) : null;
  const reflexPaceLabel = reflexTimeLeft <= reflexMaxTime * 0.2
    ? 'Zona crítica'
    : reflexTimeLeft <= reflexMaxTime * 0.5
      ? 'Pressão alta'
      : 'Janela segura';

  useEffect(() => {
    if (mode !== 'reflex' || reflexFeedback) return;
    const timer = setInterval(() => {
      setReflexTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          answerReflex('TIMEOUT_EXPIRED');
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [mode, reflexIndex, reflexFeedback, reflexMaxTime]);

  const answerReflex = (option: string) => {
    if (reflexFeedback) return;
    const current = activeReflexRound;
    const responseTime = Number((reflexMaxTime - reflexTimeLeft).toFixed(2));
    const nextTimes = [...reflexTimes, responseTime];
    const isCorrect = option === current.best;
    const nextCorrect = reflexScore + (isCorrect ? 1 : 0);
    setReflexTimes(nextTimes);
    setReflexLastResponseTime(responseTime);
    setReflexSelectedOption(option);

    if (isCorrect) {
      setReflexScore((s) => s + 1);
      setReflexSuccess(true);
      const speedBonus = reflexTimeLeft > reflexMaxTime * 0.5 ? 10 : 0;
      gainXp(20 + speedBonus);
      setReflexFeedback(`✅ Resposta regulada em ${responseTime.toFixed(1)}s. +${20 + speedBonus} XP ${speedBonus ? '(Bônus de velocidade)' : ''}`);
    } else if (option === 'TIMEOUT_EXPIRED') {
      setReflexFeedback(`⏰ Tempo esgotado em ${reflexMaxTime.toFixed(0)}s. Melhor resposta: ${current.best}`);
    } else {
      setReflexFeedback(`❌ Resposta mais regulada: ${current.best}. Seu tempo foi ${responseTime.toFixed(1)}s.`);
    }

    setTimeout(() => {
      if (reflexIndex < reflexLength - 1) {
        setReflexIndex((i) => i + 1);
        setReflexFeedback('');
        setReflexTimeLeft(reflexMaxTime);
        setReflexSelectedOption(null);
        setReflexSuccess(false);
      } else {
        const accuracy = Math.round((nextCorrect / reflexLength) * 100);
        const avgTime = Number((nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length).toFixed(2));
        const bestTime = Number(Math.min(...nextTimes).toFixed(2));
        setReflexRecords((prev) => [
          {
            id: `${Date.now()}`,
            createdAt: new Date().toISOString(),
            length: reflexLength,
            difficulty: reflexDifficulty,
            correct: nextCorrect,
            total: reflexLength,
            accuracy,
            avgTime,
            bestTime,
          },
          ...prev
        ].slice(0, 60));
        setReflexInProgress(false);
        setReflexSuccess(false);
        resetReflexSession();
      }
    }, 2000);
  };

  const randomizedReflexOptions = useMemo(() => {
    return shuffleBySeed(activeReflexRound.options, `reflex-opts-${reflexSeed}-${reflexIndex}`);
  }, [activeReflexRound, reflexSeed, reflexIndex]);

  const normalizedReflexRecords = useMemo(
    () =>
      reflexRecords.map((record) => ({
        ...record,
        avgTime: typeof record.avgTime === 'number' && Number.isFinite(record.avgTime) ? record.avgTime : 0,
        bestTime:
          typeof record.bestTime === 'number' && Number.isFinite(record.bestTime)
            ? record.bestTime
            : typeof record.avgTime === 'number' && Number.isFinite(record.avgTime)
              ? record.avgTime
              : 0,
      })),
    [reflexRecords]
  );

  const bestReflexHighlights = useMemo(() => {
    const bestOverall = normalizedReflexRecords.length
      ? [...normalizedReflexRecords].sort((a, b) => b.accuracy - a.accuracy || (a.avgTime - b.avgTime))[0]
      : null;
    const bestByDiff = (['Fácil', 'Médio', 'Difícil', 'Ultra'] as const)
      .map((diff) => {
        const matches = normalizedReflexRecords.filter((r) => r.difficulty === diff);
        if (!matches.length) return null;
        const best = [...matches].sort((a, b) => b.accuracy - a.accuracy || (a.avgTime - b.avgTime))[0];
        return { diff, record: best };
      })
      .filter((item): item is { diff: 'Fácil' | 'Médio' | 'Difícil' | 'Ultra'; record: ReflexRecord } => item !== null)
      .sort((a, b) => {
        const order = { 'Ultra': 3, 'Difícil': 2, 'Médio': 1, 'Fácil': 0 };
        return order[b.diff] - order[a.diff];
      })[0] || null;
    return { bestOverall, bestByDiff };
  }, [normalizedReflexRecords]);

  const speakPillWithThemeVoice = async (pill: Pill) => {
    const voiceConfig = themeVoice[pill.theme];
    const spokenText = stripEmojiFromNarration(`${pill.title}. ${pill.content}. Prática sugerida: ${pill.action}`);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      cancelBrowserSpeech();
      return;
    }

    try {
      const res = await fetch('/api/piper-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenText,
          gender: voiceConfig.gender,
          voice: voiceConfig.voice,
        }),
      });

      if (!res.ok) {
        await speakBrowserText(spokenText, { voice: voiceConfig.gender });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      await audio.play();
    } catch {
      await speakBrowserText(spokenText, { voice: voiceConfig.gender });
      audioRef.current = null;
    }
  };

  const stopPillAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = '';
    audioRef.current = null;
    cancelBrowserSpeech();
  };

  useEffect(() => {
    if (selected) return;
    stopPillAudio();
  }, [selected]);

  useEffect(() => {
    resetQuizSession();
  }, [quizLength, quizSource, recommendedQuizTheme]);

  useEffect(() => {
    if (quizSource !== 'theme') return;
    if (quizThemes.length) return;
    setQuizThemes([theme || recommendedQuizTheme]);
  }, [quizSource, quizThemes.length, theme, recommendedQuizTheme]);

  useEffect(() => {
    if (quizSource !== 'theme') return;
    if (!quizThemes.length) return;
    resetQuizSession();
  }, [quizSource, quizThemes.join('|')]);

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
    <div className={`p-4 pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
      <AppNoticeModal
        open={Boolean(noticeMessage)}
        title="Baú de hoje já foi aberto"
        message={noticeMessage}
        onClose={() => setNoticeMessage('')}
        darkMode={dm}
        icon="🎁"
        eyebrow="Psicoeducação"
      />
      <div className="pt-4 mb-5">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Aprender, treinar e jogar"
          title="Psicoeducação"
          description="Aprenda, treine e jogue para evoluir sua mente."
          icon="📚"
        />
      </div>

      <div className={`rounded-[2rem] p-6 border mb-6 shadow-sm relative overflow-hidden ${c('bg-gradient-to-br from-white via-indigo-50/40 to-cyan-50/30 border-slate-100', 'bg-gradient-to-br from-slate-800/85 to-slate-900 border-slate-700')}`}>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] mb-1.5 ${c('text-indigo-700', 'text-indigo-400')}`}>Seu progresso</p>
              <h3 className="text-2xl font-black tracking-tight leading-tight">Nível {level.n} • <span className={c('text-indigo-600', 'text-indigo-300')}>{level.title}</span></h3>
            </div>
            <div className={`shrink-0 px-4 py-2 rounded-2xl text-[11px] font-black shadow-sm ${c('bg-white text-indigo-700 border border-indigo-100', 'bg-slate-900 text-indigo-300 border border-slate-700')}`}>
              {xp} XP
            </div>
          </div>

          <div className={`h-4 rounded-full overflow-hidden mb-4 ${c('bg-slate-100/80', 'bg-slate-950/40')}`}>
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.3)]" 
              style={{ width: `${levelPct}%` }} 
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-0.5">
            <p className={`text-[11px] font-black uppercase tracking-wider ${c('text-slate-500', 'text-slate-400')}`}>
              {levelPct}% concluído
            </p>
            <p className={`text-[11px] font-black uppercase tracking-wider ${c('text-indigo-600/80', 'text-indigo-400/80')}`}>
               faltam {Math.max(0, levelTop - xp)} XP
            </p>
          </div>

          {nextUnlock && (
            <div className={`mt-6 rounded-[1.5rem] p-4 border animate-in fade-in slide-in-from-bottom duration-700 delay-300 ${c('bg-white/60 border-indigo-100/50 backdrop-blur-sm', 'bg-slate-900/40 border-slate-700/50 backdrop-blur-sm')}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.14em] mb-2 ${c('text-indigo-600', 'text-indigo-400')}`}>🎯 Próxima Conquista</p>
              <p className="text-[13px] font-bold">
                {themeLabel[nextUnlock.theme]} <span className="opacity-60 font-medium">libera com {nextUnlock.total} XP</span>
              </p>
              <div className={`h-1 w-full rounded-full mt-2.5 ${c('bg-slate-100', 'bg-slate-800')}`}>
                <div 
                  className="h-full rounded-full bg-indigo-400/50" 
                  style={{ width: `${Math.min(100, (xp / nextUnlock.total) * 100)}%` }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-[2rem] p-5 border mb-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
        <div className="mb-4">
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-indigo-700', 'text-indigo-300')}`}>Meta Diária</p>
          <h3 className="text-xl font-black mt-1">🎯 Missões de hoje</h3>
        </div>

        {todayMissions.map((m) => {
          const raw = typeof m.progress === 'function' ? m.progress(missionState) : 0;
          const current = Math.max(0, Math.min(m.target, raw));
          const done = m.check(missionState);
          const percent = (current / m.target) * 100;

          return (
            <div 
              key={m.id} 
              className={`p-4 rounded-2xl mb-3 border transition-all duration-300 ${
                done 
                  ? c('bg-emerald-50 border-emerald-100', 'bg-emerald-900/10 border-emerald-800/40') 
                  : c('bg-slate-50 border-slate-100', 'bg-slate-950/40 border-slate-800')
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-black leading-tight ${done ? c('text-emerald-900', 'text-emerald-100') : c('text-slate-700', 'text-slate-300')}`}>
                    {done ? '✅' : '⬜'} {m.label}
                  </p>
                  <p className={`text-[11px] uppercase tracking-[0.12em] font-bold mt-1 ${done ? 'text-emerald-600/70' : 'opacity-60'}`}>
                    Progresso: {current} de {m.target}
                  </p>
                </div>
                {done && (
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-500/20 text-emerald-400')}`}>
                    Concluído
                  </span>
                )}
              </div>
              
              <div className={`h-1.5 rounded-full overflow-hidden mt-3 ${done ? c('bg-emerald-200/50', 'bg-emerald-950/60') : c('bg-slate-200', 'bg-slate-800')}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    done 
                      ? 'bg-emerald-500' 
                      : c('bg-indigo-500', 'bg-indigo-400')
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`rounded-2xl p-4 border flex flex-col justify-between ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/80 border-slate-700')}`}>
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] mb-3 ${c('text-amber-600', 'text-amber-400')}`}>🏅 Ranking</p>
            <p className="text-2xl font-black">{weeklyXp.reduce((s, n) => s + n, 0)}</p>
            <p className={`text-[11px] font-bold uppercase tracking-[0.12em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>XP na semana</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-50 mb-1">Melhor dia</p>
            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${c('bg-amber-50 text-amber-700', 'bg-amber-500/10 text-amber-300')}`}>
              {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][weeklyXp.indexOf(Math.max(...weeklyXp))] || '—'}
            </span>
          </div>
        </div>
        <div className={`rounded-2xl p-4 border flex flex-col justify-between ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/80 border-slate-700')}`}>
          <div className="mb-3">
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] mb-2 ${c('text-sky-600', 'text-sky-400')}`}>🎁 Recompensa</p>
            <p className="text-sm font-bold leading-tight">Baú diário de motivação</p>
          </div>
          <button
            onClick={() => {
              if (dailyChestDate === today) {
                setNoticeMessage('Baú já aberto hoje. Volte amanhã para receber uma nova recompensa.');
                return;
              }
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
            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              dailyChestDate === today 
                ? c('bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default', 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default') 
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 active:scale-95'
            }`}
          >
            {dailyChestDate === today ? '✅ Baú coletado' : '✨ Abrir baú'}
          </button>
          {chestResult && (
            <div className={`mt-3 p-2 rounded-xl text-[11px] font-bold text-center animate-in fade-in zoom-in duration-500 ${c('bg-slate-50 text-slate-500', 'bg-slate-900/50 text-slate-400')}`}>
              Recebido: <span className={c('text-amber-600', 'text-amber-400')}>{chestResult}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-[2rem] p-5 border mb-6 ${c('bg-gradient-to-br from-white to-slate-50 border-slate-100 shadow-sm', 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700')}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-emerald-700', 'text-emerald-300')}`}>Progresso</p>
            <h3 className="text-xl font-black mt-1">🗺️ Fases por tema</h3>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black ${c('bg-emerald-50 text-emerald-700 border border-emerald-100', 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20')}`}>
            {xp} XP Total
          </div>
        </div>
        
        <p className={`text-[13px] font-medium mb-5 leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>
          Desbloqueie novos temas conforme evolui sua jornada emocional.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(themeLabel) as Theme[]).map((t) => {
            const isUnlocked = phaseUnlocked[t];
            return (
              <button 
                key={t} 
                onClick={() => isUnlocked && setTheme(t)} 
                className={`relative px-4 py-4 rounded-[1.8rem] font-bold text-left transition-all border ${
                  isUnlocked 
                    ? c('bg-white border-emerald-200 text-emerald-900 hover:border-emerald-400 hover:-translate-y-0.5 shadow-sm', 'bg-slate-800/50 border-emerald-700/50 text-emerald-100 hover:border-emerald-500 hover:-translate-y-0.5')
                    : c('bg-slate-100 border-slate-200 text-slate-400 grayscale opacity-80', 'bg-slate-900/40 border-slate-800 text-slate-600 grayscale opacity-60')
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{isUnlocked ? '🔓' : '🔒'}</span>
                  {!isUnlocked && (
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${c('bg-slate-200 text-slate-500', 'bg-slate-800 text-slate-500')}`}>
                      Bloqueado
                    </div>
                  )}
                </div>
                <p className="text-sm font-black leading-tight">{themeLabel[t]}</p>
                {!isUnlocked && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <p className="text-[10px] uppercase tracking-wider font-black text-rose-500/70">{unlockXpByTheme[t]} XP necessário</p>
                  </div>
                )}
                {isUnlocked && theme === t && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {modeGroups
          .map((group) => ({ ...group, modes: group.modes.filter((item) => availableModes.includes(item.id)) }))
          .filter((group) => group.modes.length > 0)
          .map((group) => {
          const themeColors = {
            sky: { light: 'text-sky-700', dark: 'text-sky-400' },
            emerald: { light: 'text-emerald-700', dark: 'text-emerald-400' },
            amber: { light: 'text-amber-600', dark: 'text-amber-400' }
          }[group.theme as 'sky' | 'emerald' | 'amber'];

          return (
            <div key={group.id} data-card-glyph="📚" className={`sereno-ornament-card rounded-[1.8rem] p-5 border ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
              <div className="mb-4">
                <p className={`text-sm font-black uppercase tracking-[0.2em] ${c(themeColors.light, themeColors.dark)}`}>{group.title}</p>
                <p className={`text-[13px] font-medium mt-1.5 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>{group.desc}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.modes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMode(item.id);
                      if (item.id === 'reflex') setReflexTimeLeft(8);
                    }}
                    className={`min-h-[58px] px-3 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                      mode === item.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : c('bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white', 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800')
                    }`}
                  >
                    <span className="block text-base mb-1">{item.emoji}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!isPro && (
        <div className={`rounded-[1.8rem] p-5 mb-6 border ${c('bg-fuchsia-50 border-fuchsia-200', 'bg-fuchsia-950/20 border-fuchsia-900/30')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-fuchsia-700', 'text-fuchsia-300')}`}>Psicoeducação completa no Pro</p>
          <p className="mt-2 text-sm leading-relaxed">
            No gratuito, você já acessa os cards essenciais. No Pro, entram quiz, jogos, memória, associação, sequência e reflexo.
          </p>
          <button onClick={() => onShowUpgrade?.()} className="mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white transition-all active:scale-95">
            Ver plano Pro
          </button>
        </div>
      )}

      {mode === 'cards' && (
        <>
          {recommendedCard && (
            <button
              onClick={() => {
                setSelected(recommendedCard.id);
                setLastOpenedCardId(recommendedCard.id);
              }}
              data-card-glyph={recommendedCard.emoji}
              className={`sereno-ornament-card w-full rounded-[2rem] p-5 border mb-3 text-left shadow-sm ${c('bg-gradient-to-br from-indigo-50 via-white to-cyan-50 border-indigo-100', 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700')}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-indigo-700', 'text-indigo-300')}`}>Card do dia</p>
                  <h3 className="text-lg font-black mt-2">{recommendedCard.emoji} {recommendedCard.title}</h3>
                  <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>{summarizeCard(recommendedCard.content, 96)}</p>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-[11px] font-black ${dm ? themeTone[recommendedCard.theme].inactiveDark : themeTone[recommendedCard.theme].inactiveLight}`}>
                  {themeLabel[recommendedCard.theme]}
                </div>
              </div>
            </button>
          )}

          {lastOpenedCard && (
            <button
              onClick={() => setSelected(lastOpenedCard.id)}
              data-card-glyph={lastOpenedCard.emoji}
              className={`sereno-ornament-card w-full rounded-[1.8rem] p-4 border mb-3 text-left ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}
            >
              <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-sky-700', 'text-sky-300')}`}>Continuar lendo</p>
              <p className="text-sm font-bold mt-2">{lastOpenedCard.emoji} {lastOpenedCard.title}</p>
              <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{summarizeCard(lastOpenedCard.content, 78)}</p>
            </button>
          )}

          <div data-card-glyph="📈" className={`sereno-ornament-card rounded-[1.8rem] p-4 border mb-3 ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <p className="font-bold mb-3">📍 Progresso por tema</p>
            <div className="grid grid-cols-1 gap-2">
              {themeProgress.map((item) => (
                <div key={item.theme} className={`rounded-2xl p-3 ${c('bg-slate-50', 'bg-slate-900/60')}`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${dm ? themeTone[item.theme].inactiveDark : themeTone[item.theme].inactiveLight}`}>
                      {themeLabel[item.theme]}
                    </span>
                    <span className="text-xs font-bold">{item.completed}/{item.total} lidos</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${c('bg-slate-200', 'bg-slate-700')}`}>
                    <div
                      className={`h-full rounded-full ${themeTone[item.theme].active.split(' ')[0]}`}
                      style={{ width: `${item.total ? (item.completed / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-[1.8rem] p-4 mb-3 ${c('bg-white border border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar card..." className={`w-full p-3 rounded-xl text-sm ${c('bg-slate-50', 'bg-slate-900')}`} />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => scrollThemes('left')}
              className={`shrink-0 w-10 h-10 rounded-2xl text-sm font-black transition-all ${c('bg-white border border-slate-200 text-slate-700 hover:bg-slate-50', 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800')}`}
              aria-label="Ver temas anteriores"
            >
              ←
            </button>
            <div
              ref={themeScrollRef}
              className="flex-1 flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button onClick={() => setTheme(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${!theme ? 'bg-emerald-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Todos</button>
              {(Object.keys(themeLabel) as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                    theme === t
                      ? themeTone[t].active
                      : dm
                        ? themeTone[t].inactiveDark
                        : themeTone[t].inactiveLight
                  }`}
                >
                  {themeLabel[t]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollThemes('right')}
              className={`shrink-0 w-10 h-10 rounded-2xl text-sm font-black transition-all ${c('bg-white border border-slate-200 text-slate-700 hover:bg-slate-50', 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800')}`}
              aria-label="Ver próximos temas"
            >
              →
            </button>
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { id: 'recommended', label: 'Recomendados' },
              { id: 'mostRead', label: 'Mais lidos' },
              { id: 'favorites', label: 'Favoritos' },
              { id: 'unread', label: 'Não lidos' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSortMode(option.id as 'recommended' | 'mostRead' | 'favorites' | 'unread')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${sortMode === option.id ? 'bg-indigo-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {orderedCards.map((p) => {
              const unlocked = !!phaseUnlocked[p.theme];
              const isRead = read.includes(p.id);
              const isFavorite = favorites.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!unlocked) {
                      setLockNotice(`${themeLabel[p.theme]} ainda está bloqueado. Ele libera com ${unlockXpByTheme[p.theme]} XP, e você está com ${xp} XP agora.`);
                      return;
                    }
                    setSelected(p.id);
                    setLastOpenedCardId(p.id);
                  }}
                  data-card-glyph={p.emoji}
                  className={`sereno-ornament-card p-4 rounded-[1.7rem] text-left border transition-all relative overflow-hidden shadow-sm ${isRead ? c('bg-gradient-to-br from-emerald-50 to-white border-emerald-200', 'bg-emerald-900/20 border-emerald-800') : c('bg-gradient-to-br from-white to-slate-50 border-slate-100', 'bg-slate-800/70 border-slate-700')} ${!unlocked ? 'opacity-75' : 'active:scale-[0.98]'}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 ${unlocked ? 'bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400' : 'bg-gradient-to-r from-slate-300 to-slate-200'}`} />
                  {!unlocked && (
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-black ${c('bg-rose-100 text-rose-700', 'bg-rose-900/40 text-rose-300')}`}>
                      🔒 Bloqueado
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2 pr-14">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                        dm ? themeTone[p.theme].inactiveDark : themeTone[p.theme].inactiveLight
                      }`}>
                        {themeLabel[p.theme]}
                      </span>
                      {isFavorite && (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black ${c('bg-amber-50 text-amber-700', 'bg-amber-500/10 text-amber-300')}`}>
                          ★
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-bold text-sm mt-3 leading-snug">{p.title}</p>
                  <p className={`text-xs mt-2 leading-relaxed font-medium ${c('text-slate-600', 'text-slate-400')}`}>
                    {summarizeCard(p.content)}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <p className={`text-[11px] ${c('text-slate-600', 'text-slate-300')}`}>
                      Toque para abrir e ler completo.
                    </p>
                    <span className={`text-sm font-black ${c('text-slate-400', 'text-slate-500')}`}>→</span>
                  </div>
                  {!unlocked && (
                    <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-300')}`}>
                      {`Libera com ${unlockXpByTheme[p.theme]} XP.`}
                    </p>
                  )}
                  {!unlocked && (
                    <p className={`text-[10px] mt-1 font-semibold ${c('text-rose-600', 'text-rose-300')}`}>
                      Ganhe mais XP para desbloquear este card.
                    </p>
                  )}
                  {isRead && <span className="inline-flex mt-2 text-xs text-emerald-500 font-bold">✓ Lido</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === 'quiz' && (
        <div className={`rounded-[2rem] p-5 border shadow-sm ${c('bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/40 border-slate-100', 'bg-gradient-to-br from-slate-800/85 to-slate-900 border-slate-700')}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-indigo-700', 'text-indigo-300')}`}>Modo desafio</p>
              <p className="text-xl font-black mt-2">🧠 Quiz relâmpago</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={() => setMode('cards')} 
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${c('bg-white border-slate-200 text-slate-500 hover:bg-slate-50', 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800')}`}
              >
                Sair
              </button>
              <div className={`px-4 py-2 rounded-2xl text-sm font-black ${c('bg-white text-indigo-700 border border-indigo-100', 'bg-slate-900 text-indigo-300 border border-slate-700')}`}>
                {quizRound} / {quizLength}
              </div>
            </div>
          </div>

          <div className={`h-3 rounded-full overflow-hidden mb-6 ${c('bg-slate-100', 'bg-slate-700')}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 transition-all duration-500" style={{ width: `${(quizRound / quizLength) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-2xl p-3 ${c('bg-white/90 border border-indigo-100', 'bg-slate-900/60 border border-slate-700')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-indigo-700', 'text-indigo-300')}`}>Formato</p>
              <p className="text-sm font-bold mt-2">{quizLength === 10 ? 'Rápido' : quizLength === 20 ? 'Médio' : 'Longo'}</p>
            </div>
            <div className={`rounded-2xl p-3 ${c('bg-white/90 border border-emerald-100', 'bg-slate-900/60 border border-slate-700')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Sequência</p>
              <p className="text-sm font-bold mt-2">{quizStreak} acerto{quizStreak === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { value: 10 as const, label: 'Rápido', desc: 'Fluxo mais direto' },
              { value: 20 as const, label: 'Médio', desc: 'Ritmo equilibrado' },
              { value: 40 as const, label: 'Longo', desc: 'Imersão maior' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setQuizLength(option.value)}
                className={`rounded-2xl p-3 text-left transition-all ${quizLength === option.value
                  ? quizLengthTone[option.value].active
                  : dm ? quizLengthTone[option.value].inactiveDark : quizLengthTone[option.value].inactiveLight}`}
              >
                <p className="text-xs font-black uppercase tracking-[0.16em]">{option.label}</p>
                <p className={`text-[11px] mt-1 ${quizLength === option.value ? 'text-white/80' : c('text-slate-600', 'text-slate-400')}`}>{option.desc}</p>
              </button>
            ))}
          </div>

          <div className={`rounded-[1.8rem] p-4 mb-4 ${c('bg-white/90 border border-slate-100', 'bg-slate-900/60 border border-slate-700')}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Origem das perguntas</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
            {[ 
              { value: 'mixed' as const, label: 'Mistas', desc: 'Variedade equilibrada' },
              { value: 'theme' as const, label: 'Categoria', desc: 'Foco em um assunto' },
              { value: 'recommended' as const, label: 'Para você', desc: 'Mais úteis agora' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  if (option.value === 'theme' && !quizThemes.length) {
                    setQuizThemes([theme || recommendedQuizTheme]);
                  }
                  setQuizSource(option.value);
                }}
                className={`rounded-3xl p-4 text-left transition-all ${quizSource === option.value
                  ? quizSourceTone[option.value].active
                  : dm ? quizSourceTone[option.value].inactiveDark : quizSourceTone[option.value].inactiveLight} min-w-0`}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.08em] leading-tight whitespace-nowrap">
                  {option.label}
                </p>
                <p className={`text-[11px] mt-1 leading-snug whitespace-normal break-words ${quizSource === option.value ? 'text-white/80' : c('text-slate-500', 'text-slate-400')}`}>{option.desc}</p>
              </button>
            ))}
            </div>

            {quizSource === 'theme' && (
              <div className="mt-4">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] mb-2 ${c('text-slate-500', 'text-slate-400')}`}>Categorias</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(themeLabel) as Theme[]).map((item) => {
                    const active = quizThemes.includes(item);
                    const tone = themeTone[item];
                    return (
                      <button
                        key={item}
                        onClick={() => toggleQuizTheme(item)}
                        className={`px-3 py-2 rounded-full text-xs font-black transition-all ${active ? tone.active : (dm ? tone.inactiveDark : tone.inactiveLight)}`}
                      >
                        {themeEmoji[item]} {themeLabel[item]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {quizSource === 'recommended' && (
              <div className={`mt-4 rounded-2xl p-3 overflow-hidden ${c('bg-sky-50 border border-sky-100', 'bg-sky-900/20 border border-sky-800')}`}>
                <p className="text-sm font-bold leading-snug break-words">✨ Recomendado agora: {themeLabel[recommendedQuizTheme]}</p>
                <p className={`text-xs mt-1 leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{recommendedQuizReason}</p>
                <p className={`text-[11px] mt-2 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
                  Nesse modo, o quiz fica travado só no que parece mais útil para você agora.
                </p>
              </div>
            )}
          </div>

          <div className={`rounded-[1.8rem] p-4 mb-4 border ${dm ? themeTone[activeQuizQuestion.theme].inactiveDark : themeTone[activeQuizQuestion.theme].inactiveLight}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-300')}`}>Pergunta</p>
            <p className="text-lg font-black mt-2 leading-relaxed">{activeQuizQuestion.question}</p>
            <p className={`text-xs mt-2 ${dm ? themeTone[activeQuizQuestion.theme].inactiveDark : themeTone[activeQuizQuestion.theme].inactiveLight} inline-flex px-2 py-1 rounded-full`}>
              {themeLabel[activeQuizQuestion.theme]} • {activeQuizQuestion.sourceTitle}
            </p>
          </div>

          <div className="space-y-3">
            {randomizedQuizOptions.map((op) => (
              <button
                key={op}
                onClick={() => submitQuiz(op)}
                disabled={!!quizSelectedOption}
                className={`w-full p-5 rounded-3xl text-base text-left font-black transition-all ${
                  quizSelectedOption === op
                    ? op === activeQuizQuestion.answer
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]'
                    : quizSelectedOption && op === activeQuizQuestion.answer
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : c('bg-white hover:bg-slate-50 hover:-translate-y-0.5 border border-slate-100', 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600')
                } ${quizSelectedOption ? 'cursor-default' : 'active:scale-95'}`}
              >
                {op}
              </button>
            ))}
          </div>

          <div className={`rounded-[1.8rem] p-4 mt-4 ${c('bg-white/90 border border-slate-100', 'bg-slate-900/60 border border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Melhores resultados</p>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${c('bg-indigo-50 text-indigo-700', 'bg-indigo-500/10 text-indigo-300')}`}>
                {quizRecords.length} rodada{quizRecords.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className={`rounded-2xl p-3 ${c('bg-violet-50 border border-violet-200', 'bg-violet-500/10 border border-violet-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-violet-700', 'text-violet-300')}`}>Melhor geral</p>
                <p className="text-sm font-bold mt-2">
                  {bestQuizHighlights.overall ? `${bestQuizHighlights.overall.correct}/${bestQuizHighlights.overall.total}` : 'Ainda não'}
                </p>
                <p className={`text-[11px] mt-1 leading-snug ${c('text-violet-700/80', 'text-violet-200/80')}`}>
                  {bestQuizHighlights.overall ? `${bestQuizHighlights.overall.accuracy}% de acerto` : 'fez uma rodada'}
                </p>
              </div>
              <div className={`rounded-2xl p-3 ${c('bg-emerald-50 border border-emerald-200', 'bg-emerald-500/10 border border-emerald-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-emerald-700', 'text-emerald-300')}`}>Melhor categoria</p>
                <p className="text-sm font-bold mt-2">
                  {bestQuizHighlights.bestByTheme ? themeLabel[bestQuizHighlights.bestByTheme.theme] : 'Ainda não'}
                </p>
                <p className={`text-[11px] mt-1 leading-snug ${c('text-emerald-700/80', 'text-emerald-200/80')}`}>
                  {bestQuizHighlights.bestByTheme ? `${bestQuizHighlights.bestByTheme.record.correct}/${bestQuizHighlights.bestByTheme.record.total} no melhor resultado` : 'há histórico'}
                </p>
              </div>
              <div className={`rounded-2xl p-3 ${c('bg-amber-50 border border-amber-200', 'bg-amber-500/10 border border-amber-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-amber-700', 'text-amber-300')}`}>Melhor período</p>
                <p className="text-sm font-bold mt-2">
                  {bestQuizHighlights.bestByLength ? (bestQuizHighlights.bestByLength.length === 10 ? 'Rápido' : bestQuizHighlights.bestByLength.length === 20 ? 'Médio' : 'Longo') : 'Ainda não'}
                </p>
                <p className={`text-[11px] mt-1 leading-snug ${c('text-amber-700/80', 'text-amber-200/80')}`}>
                  {bestQuizHighlights.bestByLength ? `${bestQuizHighlights.bestByLength.record.correct}/${bestQuizHighlights.bestByLength.record.total} no melhor resultado` : 'há histórico'}
                </p>
              </div>
            </div>
          </div>

          {quizResult && (
            <div className={`mt-4 rounded-[1.8rem] p-4 border ${quizResult.startsWith('✅')
              ? c('bg-emerald-50 border-emerald-100', 'bg-emerald-900/20 border-emerald-800')
              : c('bg-rose-50 border-rose-100', 'bg-rose-900/20 border-rose-800')}`}>
              <p className="text-sm font-black">{quizResult}</p>
              <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                💡 Por quê? A resposta correta aqui é <strong>{activeQuizQuestion.answer}</strong>, porque ela traduz melhor o conceito central de <strong>{activeQuizQuestion.sourceTitle}</strong>.
              </p>
              <button
                onClick={nextQuizRound}
                className="w-full mt-4 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20"
              >
                {quizRound >= quizLength ? 'Recomeçar quiz' : 'Próxima pergunta'}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'game' && (
        <div className={`rounded-[2rem] p-5 border shadow-sm ${c('bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/40 border-slate-100', 'bg-gradient-to-br from-slate-800/85 to-slate-900 border-slate-700')}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-emerald-700', 'text-emerald-300')}`}>Modo prática</p>
              <p className="text-xl font-black mt-2">🎮 Mini-game emocional</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={() => setMode('cards')} 
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${c('bg-white border-slate-200 text-slate-500 hover:bg-slate-50', 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800')}`}
              >
                Sair
              </button>
              <div className={`px-4 py-2 rounded-2xl text-sm font-black ${c('bg-white text-emerald-700 border border-emerald-100', 'bg-slate-900 text-emerald-300 border border-slate-700')}`}>
                Rodada {gameIndex + 1} / {gameLength}
              </div>
            </div>
          </div>

          <div className={`h-3 rounded-full overflow-hidden mb-6 ${c('bg-slate-100', 'bg-slate-700')}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-600 transition-all duration-500" style={{ width: `${((gameIndex + 1) / gameLength) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-2xl p-3 ${c('bg-emerald-50 border border-emerald-200', 'bg-emerald-500/10 border border-emerald-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Objetivo</p>
              <p className="text-sm font-bold mt-2">Escolha a resposta mais regulada</p>
            </div>
            <div className={`rounded-2xl p-3 ${c('bg-cyan-50 border border-cyan-200', 'bg-cyan-500/10 border border-cyan-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-cyan-700', 'text-cyan-300')}`}>Pontuação</p>
              <p className="text-sm font-bold mt-2">{gameScore} acerto{gameScore === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { value: 10 as const, label: 'Rápido', desc: 'Fluxo mais direto' },
              { value: 20 as const, label: 'Médio', desc: 'Ritmo equilibrado' },
              { value: 40 as const, label: 'Longo', desc: 'Imersão maior' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setGameLength(option.value);
                  resetMiniSession();
                }}
                className={`rounded-3xl p-4 text-left transition-all ${gameLength === option.value
                  ? quizLengthTone[option.value].active
                  : dm ? quizLengthTone[option.value].inactiveDark : quizLengthTone[option.value].inactiveLight}`}
              >
                <p className="text-sm font-black uppercase tracking-[0.16em]">{option.label}</p>
                <p className={`text-[11px] mt-1 ${gameLength === option.value ? 'text-white/80' : c('text-slate-600', 'text-slate-400')}`}>{option.desc}</p>
              </button>
            ))}
          </div>

          <div className={`rounded-[1.8rem] p-4 mb-4 ${c('bg-indigo-50 border border-indigo-200', 'bg-indigo-500/10 border border-indigo-500/20')}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-indigo-700', 'text-indigo-300')}`}>Situação</p>
            <p className="text-base font-black mt-2 leading-relaxed">{activeMiniChallenge.prompt}</p>
          </div>

          <div className="space-y-3">
            {randomizedMiniOptions.map((op) => (
              <button
                key={op}
                onClick={() => submitMiniGame(op)}
                disabled={!!gameSelectedOption}
                className={`w-full p-5 rounded-3xl text-base text-left font-black transition-all ${
                  gameSelectedOption === op
                    ? op === activeMiniChallenge.answer
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]'
                    : gameSelectedOption && op === activeMiniChallenge.answer
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : c('bg-white hover:bg-slate-50 hover:-translate-y-0.5 border border-slate-100', 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600')
                } ${gameSelectedOption ? 'cursor-default' : 'active:scale-95'}`}
              >
                {op}
              </button>
            ))}
          </div>

          {gameFeedback && (
            <div className={`mt-4 rounded-[1.8rem] p-4 border ${gameFeedback.startsWith('✅')
              ? c('bg-emerald-50 border-emerald-100', 'bg-emerald-900/20 border-emerald-800')
              : c('bg-rose-50 border-rose-100', 'bg-rose-900/20 border-rose-800')}`}>
              <p className="text-sm font-black">{gameFeedback}</p>
              <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                💡 Aqui a ideia é treinar a resposta mais regulada antes do impulso. Isso ajuda a transformar conteúdo em escolha prática.
              </p>
              <button
                onClick={nextMiniRound}
                className="w-full mt-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20"
              >
                {gameEnded ? 'Jogar de novo' : 'Próxima rodada'}
              </button>
            </div>
          )}

          <div className={`mt-4 rounded-[1.8rem] p-4 ${c('bg-amber-50 border border-amber-200', 'bg-amber-500/10 border border-amber-500/20')}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Seu ritmo aqui</p>
            <p className="text-sm font-bold mt-2">
              {gameEnded
                ? `Você fechou ${gameScore}/${gameLength} rodadas.`
                : `Até agora, você acertou ${gameScore} de ${Math.max(1, gameIndex + (gameSelectedOption ? 1 : 0))}.`}
            </p>
            <p className={`text-[11px] mt-1 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
              O mini-game serve para praticar escolha rápida com mais regulação, não para perfeição.
            </p>
          </div>
        </div>
      )}

      {mode === 'memory' && (
        <div className={`rounded-[2rem] p-5 border shadow-sm ${c('bg-gradient-to-br from-white via-blue-50/40 to-cyan-50/40 border-slate-100', 'bg-gradient-to-br from-slate-800/85 to-slate-900 border-slate-700')}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-blue-700', 'text-blue-300')}`}>Modo memória</p>
              <p className="text-xl font-black mt-2">🧠 Jogo da Memória</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={() => setMode('cards')} 
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${c('bg-white border-slate-200 text-slate-500 hover:bg-slate-50', 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800')}`}
              >
                Sair
              </button>
              <div className={`px-4 py-2 rounded-2xl text-sm font-black ${c('bg-white text-blue-700 border border-blue-100', 'bg-slate-900 text-blue-300 border border-slate-700')}`}>
                {memoryMatched.length / 2}/{memoryMode === 'texto' ? memoryPairs.length : 6} pares
              </div>
            </div>
          </div>

          <div className={`h-3 rounded-full overflow-hidden mb-6 ${c('bg-slate-100', 'bg-slate-700')}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 transition-all duration-500" style={{ width: `${((memoryMatched.length / 2) / (memoryMode === 'texto' ? memoryPairs.length : 6)) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-2xl p-4 ${c('bg-blue-50 border border-blue-200', 'bg-blue-500/10 border border-blue-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-blue-700', 'text-blue-300')}`}>Modo selecionado</p>
              <p className="text-base font-bold mt-1">{memoryMode === 'texto' ? 'Conceitos' : 'Visual'}</p>
            </div>
            <div className={`rounded-2xl p-4 ${c('bg-cyan-50 border border-cyan-200', 'bg-cyan-500/10 border border-cyan-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-cyan-700', 'text-cyan-300')}`}>Objetivo</p>
              <p className="text-base font-bold mt-1">Concluir o deck</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-2xl p-4 ${c('bg-violet-50 border border-violet-200', 'bg-violet-500/10 border border-violet-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-violet-700', 'text-violet-300')}`}>Tentativas</p>
              <p className="text-base font-bold mt-1">{memoryAttempts[memoryMode]}</p>
            </div>
            <button
              onClick={() => resetMemorySession(Date.now())}
              className={`rounded-2xl p-4 text-left transition-all ${c('bg-amber-50 border border-amber-200 hover:bg-amber-100', 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20')}`}
            >
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Embaralhar</p>
              <p className="text-base font-bold mt-1">Recomeçar deck</p>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setMemoryMode('texto')} className={`py-4 rounded-3xl text-sm font-black transition-all ${memoryMode === 'texto' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : c('bg-slate-100 text-slate-500', 'bg-slate-700 text-slate-400')}`}>Modo Texto</button>
            <button onClick={() => setMemoryMode('imagens')} className={`py-4 rounded-3xl text-sm font-black transition-all ${memoryMode === 'imagens' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : c('bg-slate-100 text-slate-500', 'bg-slate-700 text-slate-400')}`}>Modo Imagens</button>
          </div>

          <div className={`rounded-[1.8rem] p-4 mb-6 ${c('bg-white/90 border border-slate-100', 'bg-slate-900/60 border border-slate-700')}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Como jogar</p>
            <p className="text-sm font-bold mt-2 leading-relaxed">{memoryMode === 'texto' ? 'Encontre os pares conceito ↔ definição para reforçar o aprendizado.' : 'Encontre os pares visuais usando os emojis dos cards.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {memoryDeck.map((card, idx) => {
              const open = memoryOpen.includes(idx) || memoryMatched.includes(idx);
              const isMatched = memoryMatched.includes(idx);
              return (
                <div key={card.key + idx} className="h-[100px] [perspective:1000px]">
                  <button
                    onClick={() => flipMemory(idx)}
                    disabled={open || memoryBusy}
                    className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${open ? '[transform:rotateY(180deg)]' : ''} ${isMatched ? 'scale-[0.98]' : 'active:scale-95'}`}
                  >
                    {/* Verso da carta (visível quando fechada) */}
                    <div className={`absolute inset-0 [backface-visibility:hidden] flex items-center justify-center rounded-2xl border-2 transition-all ${c('bg-slate-100 border-slate-200 text-slate-300', 'bg-slate-800 border-slate-700 text-slate-600 hover:border-blue-500/50')} shadow-sm`}>
                      <span className="text-3xl">❓</span>
                    </div>
                    {/* Frente da carta (visível quando aberta) */}
                    <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center rounded-2xl border-2 p-3 text-center ${
                      isMatched 
                        ? c('bg-emerald-50 border-emerald-300 text-emerald-700 ring-4 ring-emerald-400/20', 'bg-emerald-900/30 border-emerald-700 text-emerald-300 ring-4 ring-emerald-400/10')
                        : c('bg-white border-blue-200 text-slate-800', 'bg-slate-800 border-blue-500/30 text-slate-100')
                    } ${memoryMode === 'imagens' ? 'text-4xl' : 'text-[11px] font-black leading-tight'}`}>
                      {card.text}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {memoryCompleted && (
            <div className={`mt-4 rounded-[1.8rem] p-4 border ${c('bg-emerald-50 border-emerald-200', 'bg-emerald-900/20 border-emerald-800')}`}>
              <p className="text-sm font-black">🎉 Você completou o modo {memoryMode === 'texto' ? 'Texto' : 'Imagens'}.</p>
              <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                Foram {memoryAttempts[memoryMode]} tentativa{memoryAttempts[memoryMode] === 1 ? '' : 's'} para fechar {memoryTarget} pares.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => resetMemorySession(Date.now())}
                  className={`py-3 rounded-2xl text-sm font-bold ${c('bg-emerald-600 text-white', 'bg-emerald-600 text-white')}`}
                >
                  Jogar de novo
                </button>
                <button
                  onClick={() => setMemoryMode(memoryMode === 'texto' ? 'imagens' : 'texto')}
                  className={`py-3 rounded-2xl text-sm font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200 border border-slate-700')}`}
                >
                  Trocar modo
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 mt-4">
            <div className={`rounded-2xl p-3 ${c('bg-blue-50 border border-blue-200', 'bg-blue-500/10 border border-blue-500/20')}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-blue-700', 'text-blue-300')}`}>Progresso Texto</p>
                <p className="text-sm font-bold">{memoryProgress.texto}/{memoryPairs.length}</p>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden mt-3 ${c('bg-blue-100', 'bg-slate-700')}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${(memoryProgress.texto / memoryPairs.length) * 100}%` }}
                />
              </div>
            </div>
            <div className={`rounded-2xl p-3 ${c('bg-cyan-50 border border-cyan-200', 'bg-cyan-500/10 border border-cyan-500/20')}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-cyan-700', 'text-cyan-300')}`}>Progresso Imagens</p>
                <p className="text-sm font-bold">{memoryProgress.imagens}/6</p>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden mt-3 ${c('bg-cyan-100', 'bg-slate-700')}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-500"
                  style={{ width: `${(memoryProgress.imagens / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'link' && (
        <div className={`rounded-[2rem] p-5 border shadow-sm ${c('bg-gradient-to-br from-white via-rose-50/40 to-orange-50/40 border-slate-100', 'bg-gradient-to-br from-slate-800/85 to-slate-900 border-slate-700')}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-rose-700', 'text-rose-300')}`}>Modo conexão</p>
              <p className="text-xl font-black mt-2">🔗 Jogo de Ligar Conceitos</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={() => setMode('cards')} 
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${c('bg-white border-slate-200 text-slate-500 hover:bg-slate-50', 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800')}`}
              >
                Sair
              </button>
              <div className={`px-4 py-2 rounded-2xl text-sm font-black ${c('bg-white text-rose-700 border border-rose-100', 'bg-slate-900 text-rose-300 border border-slate-700')}`}>
                Rodada {linkIndex + 1} / {linkLength}
              </div>
            </div>
          </div>

          <div className={`h-3 rounded-full overflow-hidden mb-6 ${c('bg-slate-100', 'bg-slate-700')}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600 transition-all duration-500" style={{ width: `${((linkIndex + 1) / linkLength) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-2xl p-3 ${c('bg-rose-50 border border-rose-200', 'bg-rose-500/10 border border-rose-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-rose-700', 'text-rose-300')}`}>Objetivo</p>
              <p className="text-sm font-bold mt-2">Encontrar a definição correta</p>
            </div>
            <div className={`rounded-2xl p-3 ${c('bg-orange-50 border border-orange-200', 'bg-orange-500/10 border border-orange-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-orange-700', 'text-orange-300')}`}>Pontuação</p>
              <p className="text-sm font-bold mt-2">{linkScore} acerto{linkScore === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { value: 16 as const, label: 'Rápido', desc: 'Recorte enxuto' },
              { value: 33 as const, label: 'Médio', desc: 'Metade da trilha' },
              { value: 65 as const, label: 'Longo', desc: 'Todos os conceitos' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setLinkLength(option.value);
                  resetLinkSession();
                }}
                className={`rounded-3xl p-4 text-left transition-all ${linkLength === option.value
                  ? linkLengthTone[option.value].active
                  : dm ? linkLengthTone[option.value].inactiveDark : linkLengthTone[option.value].inactiveLight}`}
              >
                <p className="text-sm font-black uppercase tracking-[0.16em]">{option.label}</p>
                <p className={`text-[11px] mt-1 ${linkLength === option.value ? 'text-white/80' : c('text-slate-600', 'text-slate-400')}`}>{option.desc}</p>
              </button>
            ))}
          </div>

          <div className={`rounded-[1.8rem] p-4 mb-4 ${c('bg-amber-50 border border-amber-200', 'bg-amber-500/10 border border-amber-500/20')}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Conceito da vez</p>
            <p className="text-lg font-black mt-2 leading-relaxed transition-all duration-300">{activeLinkChallenge.left}</p>
          </div>

          <div className="space-y-3">
            {randomizedLinkOptions.map((option) => (
              <button
                key={option}
                onClick={() => answerLink(option)}
                disabled={!!linkSelectedOption}
                className={`w-full p-5 rounded-3xl text-base text-left font-black transition-all ${
                  linkSelectedOption === option
                    ? option === activeLinkChallenge.right
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]'
                    : linkSelectedOption && option === activeLinkChallenge.right
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : c('bg-white hover:bg-slate-50 hover:-translate-y-0.5 border border-slate-100', 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600')
                } ${linkSelectedOption ? 'cursor-default' : 'active:scale-95'}`}
              >
                {option}
              </button>
            ))}
          </div>

          {linkFeedback && linkIndex < linkLength - 1 && (
            <div className={`mt-4 rounded-[1.8rem] p-4 border ${linkFeedback.startsWith('✅')
              ? c('bg-emerald-50 border-emerald-100', 'bg-emerald-900/20 border-emerald-800')
              : c('bg-rose-50 border-rose-100', 'bg-rose-900/20 border-rose-800')}`}>
              <p className="text-sm font-black">{linkFeedback}</p>
              <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                💡 A ideia aqui é fortalecer a associação entre o conceito e sua definição, para ficar mais fácil reconhecer isso na vida real.
              </p>
              <button
                onClick={nextLinkRound}
                className="w-full mt-4 py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-600/20"
              >
                Próxima rodada
              </button>
            </div>
          )}

          {linkFeedback && linkIndex >= linkLength - 1 && (
            <div className={`mt-4 rounded-[1.8rem] p-5 border overflow-hidden relative ${c('bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 border-amber-200', 'bg-gradient-to-br from-rose-900/30 via-amber-900/20 to-orange-900/20 border-amber-700')}`}>
              <div className="absolute -top-10 right-0 w-24 h-24 rounded-full bg-amber-400/20 blur-2xl" />
              <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-rose-400/20 blur-2xl" />
              <div className="relative">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Fim da rodada</p>
                <p className="text-lg font-black mt-2">
                  {linkScore >= Math.ceil(linkLength * 0.8) ? '🌟 Excelente conexão de conceitos.' : linkScore >= Math.ceil(linkLength * 0.6) ? '✨ Boa rodada de associações.' : '🧠 Rodada concluída com aprendizado.'}
                </p>
                <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                  Você fechou {linkScore}/{linkLength} conexões nesta rodada. O importante aqui é ir consolidando essas associações aos poucos.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={nextLinkRound}
                    className="py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-600/20"
                  >
                    Jogar de novo
                  </button>
                  <button
                    onClick={() => resetLinkSession(Date.now())}
                    className={`py-3 rounded-2xl text-sm font-bold ${c('bg-white text-slate-700 border border-slate-200', 'bg-slate-800 text-slate-200 border border-slate-700')}`}
                  >
                    Embaralhar rodada
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={`mt-4 rounded-[1.8rem] p-4 ${c('bg-amber-50 border border-amber-200', 'bg-amber-500/10 border border-amber-500/20')}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Seu ritmo aqui</p>
            <p className="text-sm font-bold mt-2">
              {linkIndex >= linkLength - 1 && linkFeedback
                ? `Você fechou ${linkScore}/${linkLength} conexões.`
                : `Até agora, você acertou ${linkScore} de ${Math.max(1, linkIndex + (linkSelectedOption ? 1 : 0))}.`}
            </p>
            <p className={`text-[11px] mt-1 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
              O objetivo aqui é treinar reconhecimento rápido de conceitos, não decorar sob pressão.
            </p>
          </div>

          <div className={`mt-4 rounded-[1.8rem] p-4 ${c('bg-white/90 border border-slate-100', 'bg-slate-900/60 border border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Melhores resultados</p>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${c('bg-rose-50 text-rose-700', 'bg-rose-500/10 text-rose-300')}`}>
                {linkRecords.length} rodada{linkRecords.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className={`rounded-2xl p-3 ${c('bg-rose-50 border border-rose-200', 'bg-rose-500/10 border border-rose-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-rose-700', 'text-rose-300')}`}>Melhor geral</p>
                <p className="text-sm font-bold mt-2">
                  {bestLinkHighlights.bestOverall ? `${bestLinkHighlights.bestOverall.correct}/${bestLinkHighlights.bestOverall.total}` : 'Ainda não'}
                </p>
                <p className={`text-[11px] mt-1 leading-snug ${c('text-rose-700/80', 'text-rose-200/80')}`}>
                  {bestLinkHighlights.bestOverall ? `${bestLinkHighlights.bestOverall.accuracy}% de acerto` : 'fez uma rodada'}
                </p>
              </div>
              <div className={`rounded-2xl p-3 ${c('bg-orange-50 border border-orange-200', 'bg-orange-500/10 border border-orange-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-orange-700', 'text-orange-300')}`}>Melhor período</p>
                <p className="text-sm font-bold mt-2">
                  {bestLinkHighlights.bestByLength ? (bestLinkHighlights.bestByLength.length === 16 ? 'Rápido' : bestLinkHighlights.bestByLength.length === 33 ? 'Médio' : 'Longo') : 'Ainda não'}
                </p>
                <p className={`text-[11px] mt-1 leading-snug ${c('text-orange-700/80', 'text-orange-200/80')}`}>
                  {bestLinkHighlights.bestByLength ? `${bestLinkHighlights.bestByLength.record.correct}/${bestLinkHighlights.bestByLength.record.total}` : 'há histórico'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {lockNotice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setLockNotice('')}>
          <div className={`rounded-[2rem] p-6 max-w-xs w-full border shadow-2xl ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`} onClick={(e) => e.stopPropagation()}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${c('text-indigo-700', 'text-indigo-300')}`}>Desbloqueio de fase</p>
            <p className="font-extrabold text-base mb-2">Ainda falta um pouco</p>
            <p className="text-sm">{lockNotice}</p>
            <button onClick={() => setLockNotice('')} className="w-full mt-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold">Entendi</button>
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
        <div className={`rounded-[2rem] p-5 border shadow-sm ${c('bg-gradient-to-br from-white via-fuchsia-50/35 to-emerald-50/35 border-slate-100', 'bg-gradient-to-br from-slate-800/85 to-slate-900 border-slate-700')}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-fuchsia-700', 'text-fuchsia-300')}`}>Modo reformulação</p>
              <p className="text-xl font-black mt-2">🧲 Arraste e solte</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={() => setMode('cards')} 
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${c('bg-white border-slate-200 text-slate-500 hover:bg-slate-50', 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800')}`}
              >
                Sair
              </button>
              <div className={`px-4 py-2 rounded-2xl text-sm font-black ${c('bg-white text-fuchsia-700 border border-fuchsia-100', 'bg-slate-900 text-fuchsia-300 border border-slate-700')}`}>
                Rodada {dragIndex + 1} / {dragLength}
              </div>
            </div>
          </div>

          <div className={`h-3 rounded-full overflow-hidden mb-6 ${c('bg-slate-100', 'bg-slate-700')}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-emerald-500 to-fuchsia-600 transition-all duration-500" style={{ width: `${((dragIndex + 1) / dragLength) * 100}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {([
              { value: 12 as const, label: 'Rápido', desc: 'Passagem curta' },
              { value: 25 as const, label: 'Médio', desc: 'Ritmo equilibrado' },
              { value: 50 as const, label: 'Longo', desc: 'Sessão completa' },
            ]).map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setDragLength(option.value);
                  resetDragSession(Date.now());
                }}
                className={`rounded-3xl p-4 text-left transition-all ${dragLength === option.value
                  ? dragLengthTone[option.value].active
                  : dm ? dragLengthTone[option.value].inactiveDark : dragLengthTone[option.value].inactiveLight}`}
              >
                <p className="text-sm font-black uppercase tracking-[0.18em]">{option.label}</p>
              <p className="text-[11px] mt-1 opacity-80">{option.desc}</p>
              </button>
            ))}
          </div>



          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-2xl p-4 ${c('bg-fuchsia-50 border border-fuchsia-200', 'bg-fuchsia-500/10 border border-fuchsia-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-fuchsia-700', 'text-fuchsia-300')}`}>Objetivo</p>
              <p className="text-base font-bold mt-1">Transformar leitura tóxica</p>
            </div>
            <div className={`rounded-2xl p-4 ${c('bg-emerald-50 border border-emerald-200', 'bg-emerald-500/10 border border-emerald-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Pontuação</p>
              <p className="text-base font-bold mt-1">{dragScore} acerto{dragScore === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className={`rounded-[1.8rem] p-4 mb-4 ${dm ? activeDragThought.dark : activeDragThought.light}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-700', 'text-slate-200')}`}>Leitura tóxica</p>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${dm ? activeDragThought.badgeDark : activeDragThought.badgeLight}`}>
                {activeDragThought.label}
              </span>
            </div>
            <p className="text-base font-black mt-2 leading-relaxed">❌ {activeDragRound.toxic}</p>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropDrag}
            className={`mb-4 p-4 rounded-[1.8rem] border-2 border-dashed transition-all ${
              dragSelectedOption
                ? dragFeedback.startsWith('✅')
                  ? c('border-emerald-300 bg-emerald-50', 'border-emerald-700 bg-emerald-900/20')
                  : c('border-rose-300 bg-rose-50', 'border-rose-700 bg-rose-900/20')
                : draggedOption
                  ? c('border-fuchsia-300 bg-fuchsia-50 scale-[1.01] shadow-[0_0_0_5px_rgba(217,70,239,0.10)]', 'border-fuchsia-500 bg-fuchsia-500/10 scale-[1.01] shadow-[0_0_0_4px_rgba(217,70,239,0.18)]')
                  : c('border-emerald-300 bg-emerald-50', 'border-emerald-700 bg-emerald-900/20')
            }`}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">Área de resposta</p>
            <p className="text-sm font-bold mt-2">
              {dragSelectedOption ? 'Resposta escolhida' : draggedOption ? 'Solte aqui para testar a melhor reformulação' : 'Arraste ou toque na alternativa que melhor reformula essa leitura'}
            </p>
          </div>

          <div className="space-y-3">
            {randomizedDragOptions.map((op) => (
              <div
                key={op}
                draggable={!dragSelectedOption}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', op); setDraggedOption(op); }}
                onDragEnd={() => setDraggedOption(null)}
                onClick={() => answerDrag(op)}
                className={`w-full p-5 rounded-3xl text-base text-left font-black transition-all ${
                  dragSelectedOption === op
                    ? op === activeDragRound.answer
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]'
                    : dragSelectedOption && op === activeDragRound.answer
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : c('bg-white hover:bg-slate-50 hover:-translate-y-0.5 border border-slate-100', 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600')
                } ${dragSelectedOption ? 'cursor-default' : 'cursor-grab active:scale-95'}`}
              >
                {op}
              </div>
            ))}
          </div>
          <p className={`text-[11px] mt-3 ${c('text-slate-600', 'text-slate-400')}`}>Você também pode só tocar na alternativa em vez de arrastar.</p>
          {dragFeedback && (
            <div className={`mt-4 rounded-[1.8rem] p-4 border ${dragFeedback.startsWith('✅')
              ? c('bg-emerald-50 border-emerald-100', 'bg-emerald-900/20 border-emerald-800')
              : c('bg-rose-50 border-rose-100', 'bg-rose-900/20 border-rose-800')}`}>
              <p className="text-sm font-black">{dragFeedback}</p>
              <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                💡 A ideia aqui é treinar reformulações mais justas e menos automáticas, até isso ficar mais fácil fora do jogo também.
              </p>
              {!dragEnded && (
                <button
                  onClick={nextDragRound}
                  className="w-full mt-4 py-3 rounded-2xl bg-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-fuchsia-600/20"
                >
                  Próxima rodada
                </button>
              )}
            </div>
          )}

          {dragEnded && (
            <div className={`mt-4 rounded-[2rem] p-5 border ${c('bg-gradient-to-br from-fuchsia-50 via-white to-emerald-50 border-fuchsia-200', 'bg-gradient-to-br from-fuchsia-500/10 via-slate-900 to-emerald-500/10 border-fuchsia-500/20')}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-fuchsia-700', 'text-fuchsia-300')}`}>Fechamento da rodada</p>
              <p className="text-lg font-black mt-2">Você concluiu {dragLength} reformulações.</p>
              <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                Resultado final: {dragScore}/{dragLength}. Quanto mais você pratica essa troca, mais fácil fica interromper o pensamento automático fora do jogo também.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => resetDragSession(Date.now())}
                  className="py-3 rounded-2xl bg-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-fuchsia-600/20"
                >
                  Jogar de novo
                </button>
                <button
                  onClick={() => {
                    setDragLength(dragLength);
                    resetDragSession(Date.now());
                  }}
                  className={`py-3 rounded-2xl border text-sm font-bold ${c('bg-white border-slate-200 text-slate-700', 'bg-slate-900 border-slate-700 text-slate-100')}`}
                >
                  Embaralhar rodada
                </button>
              </div>
            </div>
          )}

          <div className={`mt-4 rounded-[1.8rem] p-3 border ${c('bg-white/90 border-slate-100', 'bg-slate-900/60 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3 px-1 mb-2">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Melhores resultados</p>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${c('bg-fuchsia-50 text-fuchsia-700', 'bg-fuchsia-500/10 text-fuchsia-300')}`}>
                Histórico
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-2xl p-3 ${c('bg-violet-50 border border-violet-200', 'bg-violet-500/10 border border-violet-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-violet-700', 'text-violet-300')}`}>Melhor geral</p>
                <p className="text-sm font-bold mt-2">{bestDragHighlights.bestOverall ? `${bestDragHighlights.bestOverall.correct}/${bestDragHighlights.bestOverall.total}` : 'Ainda não'}</p>
                <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{bestDragHighlights.bestOverall ? `${bestDragHighlights.bestOverall.accuracy}% de acerto` : 'fez uma rodada'}</p>
              </div>
              <div className={`rounded-2xl p-3 ${c('bg-amber-50 border border-amber-200', 'bg-amber-500/10 border border-amber-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${c('text-amber-700', 'text-amber-300')}`}>Melhor modo</p>
                <p className="text-sm font-bold mt-2">{bestDragHighlights.bestByLength ? (bestDragHighlights.bestByLength.length === 12 ? 'Rápido' : bestDragHighlights.bestByLength.length === 25 ? 'Médio' : 'Longo') : 'Ainda não'}</p>
                <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{bestDragHighlights.bestByLength ? `${bestDragHighlights.bestByLength.record.correct}/${bestDragHighlights.bestByLength.record.total}` : 'há histórico'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'sequence' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-[2.5rem] shadow-xl ${c('bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100', 'bg-gradient-to-br from-indigo-500/10 via-slate-900 to-violet-500/10 border border-indigo-500/20')}`}>
            {!sequenceFeedback && sequenceIndex === 0 && (
              <div className="mb-8 p-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center ${c('text-indigo-600', 'text-indigo-400')}`}>
                  Escolha a duração da jornada
                </p>
                <div className="flex gap-2">
                  {([12, 25, 50] as const).map((len) => (
                    <button
                      key={len}
                      onClick={() => {
                        setSequenceLength(len);
                        resetSequenceSession(Date.now());
                      }}
                      className={`flex-1 py-4 px-2 rounded-2xl border-2 font-black transition-all ${
                        sequenceLength === len
                          ? sequenceLengthTone[len].active
                          : c(sequenceLengthTone[len].inactiveLight, sequenceLengthTone[len].inactiveDark)
                      }`}
                    >
                      <div className="text-sm">{len === 12 ? 'Rápido' : len === 25 ? 'Médio' : 'Longo'}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-500/20 text-indigo-300')}`}>
                  Modo Sequência
                </span>
                <h3 className="text-xl font-black mt-3">🧭 {activeSequenceRound.title}</h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => setMode('cards')} 
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${c('bg-white border-slate-200 text-slate-500 hover:bg-slate-50', 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800')}`}
                >
                  Sair
                </button>
                <div className="text-right">
                  <p className={`text-xs font-black uppercase tracking-[0.15em] ${c('text-slate-400', 'text-slate-500')}`}>Progresso</p>
                  <p className="text-base font-bold">{sequenceIndex + 1} / {sequenceLength}</p>
                </div>
              </div>
            </div>

            <div className={`h-3 rounded-full overflow-hidden mb-6 ${c('bg-slate-100', 'bg-slate-800')}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${((sequenceIndex + 1) / sequenceLength) * 100}%` }} />
            </div>

            <div className={`p-4 rounded-3xl mb-6 border ${dm ? activeSequenceTone.dark : activeSequenceTone.light}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-600', 'text-slate-300')}`}>A Situação</p>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${dm ? activeSequenceTone.labelDark : activeSequenceTone.labelLight}`}>
                  {activeSequenceTone.label}
                </span>
              </div>
              <p className="text-lg font-black leading-relaxed italic">
                "{activeSequenceRound.situation}"
              </p>
            </div>

            <p className={`text-xs mb-4 font-black uppercase tracking-[0.15em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>
              Ordene os passos para o fluxo ideal:
            </p>

            <div className="space-y-3 mb-8">
              {sequenceOrder.map((step, idx) => (
                <div
                  key={step}
                  className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 ease-out flex items-center justify-between ${
                    sequenceFeedback.startsWith('✅')
                      ? c('bg-emerald-50 border-emerald-200', 'bg-emerald-500/10 border-emerald-500/30')
                      : c('bg-white border-slate-100 hover:border-indigo-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md', 'bg-slate-800 border-slate-700 hover:border-indigo-500/50 hover:-translate-y-0.5')
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black shadow-sm ${
                      sequenceFeedback.startsWith('✅')
                        ? 'bg-emerald-500 text-white'
                        : idx === 0 ? 'bg-blue-500 text-white' : idx === 1 ? 'bg-indigo-500 text-white' : idx === 2 ? 'bg-violet-500 text-white' : 'bg-fuchsia-500 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm">{step}</span>
                  </div>

                  {!sequenceFeedback.startsWith('✅') && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => moveSequence(idx, -1)}
                        disabled={idx === 0}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-black uppercase tracking-wide transition-all duration-200 ${idx === 0 ? 'opacity-20 cursor-not-allowed border-transparent' : c('bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100 hover:border-blue-200 shadow-sm hover:-translate-y-0.5', 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40 hover:-translate-y-0.5')}`}
                        title="Mover para cima"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        <span>Subir</span>
                      </button>
                      <button
                        onClick={() => moveSequence(idx, 1)}
                        disabled={idx === sequenceOrder.length - 1}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-black uppercase tracking-wide transition-all duration-200 ${idx === sequenceOrder.length - 1 ? 'opacity-20 cursor-not-allowed border-transparent' : c('bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100 hover:border-orange-200 shadow-sm hover:translate-y-0.5', 'bg-orange-500/10 border-orange-500/20 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/40 hover:translate-y-0.5')}`}
                        title="Mover para baixo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        <span>Descer</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

          {!sequenceFeedback.startsWith('✅') ? (
            <button
              onClick={checkSequence}
              className="w-full py-4 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              Validar minha sequência
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className={`p-4 rounded-3xl border-2 mb-4 ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-500/10 border-emerald-500/20')}`}>
                <p className="text-sm font-medium leading-relaxed italic">{sequenceFeedback}</p>
              </div>
                {!sequenceEnded && (
                  <button
                    onClick={nextSequenceRound}
                    className="w-full py-4 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
                  >
                    {sequenceIndex < sequenceLength - 1 ? 'Próxima Sequência' : 'Concluir Desafio'}
                  </button>
                )}
              </div>
            )}

            {sequenceFeedback && !sequenceFeedback.startsWith('✅') && (
              <p className="text-center text-xs font-bold text-rose-500 mt-4 animate-bounce">
                {sequenceFeedback}
              </p>
            )}

            {sequenceEnded && (
              <div className={`mt-6 p-5 rounded-[2rem] border ${c('bg-gradient-to-br from-emerald-50 via-white to-indigo-50 border-emerald-200', 'bg-gradient-to-br from-emerald-500/10 via-slate-900 to-indigo-500/10 border-emerald-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${c('text-emerald-700', 'text-emerald-300')}`}>Fechamento da sessão</p>
                <p className="text-xl font-black mt-2">Você concluiu {sequenceLength} sequências.</p>
                <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-700', 'text-slate-300')}`}>
                  Resultado final: {sequenceHits}/{sequenceLength}. A lógica aqui é treinar ordem interna: pausar, organizar e agir com mais critério.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => resetSequenceSession(Date.now())}
                    className="py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20"
                  >
                    Jogar de novo
                  </button>
                  <button
                    onClick={() => {
                      setSequenceLength(sequenceLength);
                      resetSequenceSession(Date.now());
                    }}
                    className={`py-3 rounded-2xl border text-sm font-bold ${c('bg-white border-slate-200 text-slate-700', 'bg-slate-900 border-slate-700 text-slate-100')}`}
                  >
                    Embaralhar sessão
                  </button>
                </div>
              </div>
            )}

            <div className={`mt-8 pt-6 border-t ${c('border-slate-100', 'border-slate-800')}`}>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl ${c('bg-indigo-50/50', 'bg-indigo-500/5')}`}>
                  <p className={`text-sm font-black uppercase tracking-widest ${c('text-indigo-400', 'text-indigo-600')}`}>Acertos</p>
                  <p className="text-3xl font-black mt-2">{sequenceHits}</p>
                </div>
                <div className={`p-4 rounded-2xl ${c('bg-slate-50', 'bg-slate-800/50')}`}>
                  <p className={`text-sm font-black uppercase tracking-widest ${c('text-slate-400', 'text-slate-500')}`}>XP Total</p>
                  <p className="text-3xl font-black text-emerald-500 mt-2">{sequenceHits * 30}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-[2.2rem] border ${c('bg-white/90 border-slate-100 shadow-sm', 'bg-slate-900/60 border-slate-700 shadow-xl')}`}>
            <div className="flex items-center justify-between gap-3 px-1 mb-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Melhores resultados</p>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${c('bg-indigo-50 text-indigo-700', 'bg-indigo-500/10 text-indigo-300')}`}>
                Histórico
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className={`rounded-2xl p-3 ${c('bg-indigo-50 border border-indigo-200', 'bg-indigo-500/10 border border-indigo-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-indigo-700', 'text-indigo-300')}`}>Melhor geral</p>
                <p className="text-sm font-bold mt-2">{bestSequenceHighlights.bestOverall ? `${bestSequenceHighlights.bestOverall.correct}/${bestSequenceHighlights.bestOverall.total}` : 'Ainda não'}</p>
                <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{bestSequenceHighlights.bestOverall ? `${bestSequenceHighlights.bestOverall.accuracy}% de acerto` : 'fez uma rodada'}</p>
              </div>
              <div className={`rounded-2xl p-3 ${c('bg-violet-50 border border-violet-200', 'bg-violet-500/10 border border-violet-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-violet-700', 'text-violet-300')}`}>Melhor modo</p>
                <p className="text-sm font-bold mt-2">{bestSequenceHighlights.bestByLength ? (bestSequenceHighlights.bestByLength.length === 12 ? 'Rápido' : bestSequenceHighlights.bestByLength.length === 25 ? 'Médio' : 'Longo') : 'Ainda não'}</p>
                <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{bestSequenceHighlights.bestByLength ? `${bestSequenceHighlights.bestByLength.record.correct}/${bestSequenceHighlights.bestByLength.record.total}` : 'há histórico'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { length: 12 as const, label: 'Rápido' },
                { length: 25 as const, label: 'Médio' },
                { length: 50 as const, label: 'Longo' },
              ]).map(({ length, label }) => {
                const record = sequenceRecords
                  .filter((item) => item.length === length)
                  .sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
                return (
                  <div key={length} className={`rounded-2xl p-3 border ${length === 12 ? c('bg-blue-50 border-blue-200', 'bg-blue-500/10 border-blue-500/20') : length === 25 ? c('bg-violet-50 border-violet-200', 'bg-violet-500/10 border-violet-500/20') : c('bg-fuchsia-50 border-fuchsia-200', 'bg-fuchsia-500/10 border-fuchsia-500/20')}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${length === 12 ? c('text-blue-700', 'text-blue-300') : length === 25 ? c('text-violet-700', 'text-violet-300') : c('text-fuchsia-700', 'text-fuchsia-300')}`}>{label}</p>
                    <p className="text-sm font-bold mt-2">{record ? `${record.correct}/${record.total}` : '—'}</p>
                    <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-400')}`}>{record ? `${record.accuracy}%` : 'Sem rodada'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mode === 'reflex' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {!reflexInProgress ? (
            <div className={`p-8 rounded-[3rem] border-2 ${c('bg-white border-slate-100 shadow-xl shadow-slate-200/50', 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/20')}`}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-amber-500 text-white shadow-lg shadow-amber-500/30 mb-5 animate-pulse">
                  <span className="text-4xl">⚡</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight">Reflexo Emocional</h2>
                <p className={`mt-4 text-lg font-medium leading-relaxed ${c('text-slate-500', 'text-slate-400')}`}>
                  Responda sob pressão de tempo. O foco aqui é reagir rápido sem cair no impulso.
                </p>
              </div>

              <div className="space-y-8">
                <div>
                  <p className={`text-base font-black uppercase tracking-[0.2em] mb-5 text-center ${c('text-slate-400', 'text-slate-500')}`}>Quantidade de Situações</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([12, 25, 50] as const).map((len) => (
                      <button
                        key={len}
                        onClick={() => setReflexLength(len)}
                        className={`py-5 rounded-3xl border-2 text-xl font-black transition-all ${
                          reflexLength === len
                            ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
                            : len === 50 ? 'col-span-2 ' + c('bg-slate-50 border-slate-100 text-slate-400 hover:border-amber-200', 'bg-slate-800 border-slate-700 text-slate-500 hover:border-amber-500/50') : c('bg-slate-50 border-slate-100 text-slate-400 hover:border-amber-200', 'bg-slate-800 border-slate-700 text-slate-500 hover:border-amber-500/50')
                        }`}
                      >
                        {len === 12 ? 'Rápido' : len === 25 ? 'Médio' : 'Longo'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={`text-base font-black uppercase tracking-[0.2em] mb-5 text-center ${c('text-slate-400', 'text-slate-500')}`}>Dificuldade (Timer)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Fácil', 'Médio', 'Difícil', 'Ultra'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setReflexDifficulty(diff)}
                        className={`py-4 rounded-3xl border-2 text-xl font-black transition-all ${
                          reflexDifficulty === diff
                            ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30 scale-[1.02]'
                            : c('bg-slate-50 border-slate-100 text-slate-400 hover:border-rose-200', 'bg-slate-800 border-slate-700 text-slate-500 hover:border-rose-500/50')
                        }`}
                      >
                        {diff}
                        <span className="block text-sm opacity-70 mt-1 uppercase tracking-tighter">
                          {diff === 'Fácil' ? '30s' : diff === 'Médio' ? '20s' : diff === 'Difícil' ? '10s' : '08s'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`grid grid-cols-3 gap-3 p-4 rounded-[2rem] border ${c('bg-amber-50/60 border-amber-100', 'bg-amber-500/10 border-amber-500/20')}`}>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Formato</p>
                    <p className="text-sm font-bold mt-1">{reflexLength === 12 ? 'Sessão curta' : reflexLength === 25 ? 'Sessão média' : 'Sessão longa'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Pressão</p>
                    <p className="text-sm font-bold mt-1">{reflexDifficulty === 'Fácil' ? 'Folga maior' : reflexDifficulty === 'Médio' ? 'Equilibrada' : reflexDifficulty === 'Difícil' ? 'Alta' : 'Muito alta'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-amber-700', 'text-amber-300')}`}>Objetivo</p>
                    <p className="text-sm font-bold mt-1">Velocidade com regulação</p>
                  </div>
                </div>

                <button
                  onClick={() => { setReflexInProgress(true); resetReflexSession(); }}
                  className="w-full py-7 rounded-[2.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-3xl shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                  Iniciar Treinamento
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-start px-2">
                <button
                  onClick={() => {
                    setReflexInProgress(false);
                    resetReflexSession();
                  }}
                  className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${c('bg-slate-100 text-slate-500 hover:bg-slate-200', 'bg-slate-800 text-slate-400 hover:bg-slate-700')}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  Abandonar Treino
                </button>
              </div>

              <div className={`p-8 rounded-[3rem] border-2 ${c('bg-white border-slate-100 shadow-xl shadow-slate-200/50', 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/20')}`}>
                <div className="flex items-center justify-between mb-8">
                  <div className={`px-4 py-2 rounded-2xl ${c('bg-slate-100', 'bg-slate-800')}`}>
                    <p className={`text-xs font-black uppercase tracking-widest ${c('text-slate-400', 'text-slate-500')}`}>Progresso</p>
                    <p className="text-lg font-black mt-0.5">{reflexIndex + 1} / {reflexLength}</p>
                  </div>
                  <div className={`px-4 py-3 rounded-2xl min-w-[180px] ${reflexTimeLeft <= reflexMaxTime * 0.2 ? 'bg-rose-500 text-white animate-pulse' : reflexTimeLeft <= reflexMaxTime * 0.5 ? c('bg-amber-100 text-amber-900', 'bg-amber-500/20 text-amber-200') : c('bg-slate-100', 'bg-slate-800')}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-left">
                        <p className={`text-xs font-black uppercase tracking-widest ${reflexTimeLeft <= reflexMaxTime * 0.2 ? 'text-white/70' : c('text-slate-400', 'text-slate-500')}`}>Tempo</p>
                        <p className="text-lg font-black mt-0.5">{reflexTimeLeft.toFixed(1)}s</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${reflexTimeLeft <= reflexMaxTime * 0.2 ? 'text-white/70' : c('text-slate-400', 'text-slate-500')}`}>Estado</p>
                        <p className="text-xs font-black mt-0.5">{reflexPaceLabel}</p>
                      </div>
                    </div>
                    <div className={`mt-3 h-2.5 rounded-full overflow-hidden ${reflexTimeLeft <= reflexMaxTime * 0.2 ? 'bg-white/20' : c('bg-white/60', 'bg-slate-700')}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-100 ${reflexTimeLeft <= reflexMaxTime * 0.2 ? 'bg-white' : reflexTimeLeft <= reflexMaxTime * 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${reflexTimePct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className={`rounded-2xl p-3 ${c('bg-emerald-50 border border-emerald-200', 'bg-emerald-500/10 border border-emerald-500/20')}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Acertos</p>
                    <p className="text-base font-bold mt-1">{reflexScore}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${c('bg-sky-50 border border-sky-200', 'bg-sky-500/10 border border-sky-500/20')}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-sky-700', 'text-sky-300')}`}>Média</p>
                    <p className="text-base font-bold mt-1">{reflexAvgTimeLive !== null ? `${reflexAvgTimeLive.toFixed(1)}s` : '--'}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${c('bg-violet-50 border border-violet-200', 'bg-violet-500/10 border border-violet-500/20')}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-violet-700', 'text-violet-300')}`}>Melhor tempo</p>
                    <p className="text-base font-bold mt-1">{reflexBestTimeLive !== null ? `${reflexBestTimeLive.toFixed(1)}s` : '--'}</p>
                  </div>
                </div>

                <div className={`mb-10 min-h-[120px] flex flex-col items-center justify-center text-center transition-all duration-700 ${reflexSuccess ? 'scale-110' : ''}`}>
                  <div className={`w-12 h-1 rounded-full mb-6 ${c('bg-amber-100', 'bg-amber-900/30')} ${reflexSuccess ? 'w-24 bg-emerald-500 transition-all' : ''}`} />
                  <h3 className={`text-xl font-black leading-tight max-w-xs transition-all ${reflexSuccess ? 'text-emerald-500 scale-105' : ''}`}>
                    {activeReflexRound.prompt}
                  </h3>
                  <div className={`w-12 h-1 rounded-full mt-6 ${c('bg-amber-100', 'bg-amber-900/30')} ${reflexSuccess ? 'w-24 bg-emerald-500 transition-all' : ''}`} />
                  {reflexSuccess && (
                     <div className="absolute top-0 animate-bounce">
                        <span className="text-4xl text-emerald-500">🎉</span>
                     </div>
                  )}
                </div>

                <div className="space-y-3">
                  {randomizedReflexOptions.map((op, idx) => {
                    const isCorrect = op === activeReflexRound.best;
                    const isSelected = op === reflexSelectedOption;
                    const showSuccess = reflexFeedback && isCorrect;
                    const showWrong = reflexFeedback && isSelected && !isCorrect;

                    return (
                      <button
                        key={op}
                        onClick={() => answerReflex(op)}
                        className={`w-full p-5 rounded-[1.8rem] text-left transition-all relative overflow-hidden flex items-center gap-4 border-2 ${
                          showSuccess
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                            : showWrong
                            ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30'
                            : reflexFeedback
                            ? 'opacity-40 border-transparent bg-slate-50 dark:bg-slate-800'
                            : c('bg-white border-slate-100 hover:border-amber-400 hover:bg-amber-50 shadow-sm', 'bg-slate-800 border-slate-700 hover:border-amber-500/50 hover:bg-slate-700/50 shadow-lg')
                        }`}
                      >
                        <span className={`flex items-center justify-center w-9 h-9 rounded-xl font-black text-sm ${
                          showSuccess || showWrong ? 'bg-white/20' : c('bg-slate-100 text-slate-500', 'bg-slate-900 text-slate-400')
                        }`}>
                          {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                        </span>
                        <span className="font-black text-xl flex-1">{op}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-3xl ${c('bg-emerald-50 text-emerald-700', 'bg-emerald-500/10 text-emerald-400')}`}>
                      <p className="text-sm font-black uppercase tracking-widest opacity-60">Acertos</p>
                      <p className="text-3xl font-black mt-1">{reflexScore}</p>
                    </div>
                    <div className={`p-4 rounded-3xl ${c('bg-amber-50 text-amber-700', 'bg-amber-500/10 text-amber-400')}`}>
                      <p className="text-sm font-black uppercase tracking-widest opacity-60">XP Total</p>
                      <p className="text-3xl font-black mt-1 text-emerald-500">{reflexScore * 20}</p>
                    </div>
                    <div className={`p-4 rounded-3xl ${c('bg-sky-50 text-sky-700', 'bg-sky-500/10 text-sky-400')}`}>
                      <p className="text-sm font-black uppercase tracking-widest opacity-60">Último tempo</p>
                      <p className="text-3xl font-black mt-1">{reflexLastResponseTime !== null ? `${reflexLastResponseTime.toFixed(1)}s` : '--'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {reflexFeedback && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className={`p-5 rounded-[2rem] border-2 shadow-lg mb-4 text-center ${
                    reflexFeedback.startsWith('✅')
                      ? c('bg-emerald-50 border-emerald-200 text-emerald-800', 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300')
                      : c('bg-rose-50 border-rose-200 text-rose-800', 'bg-rose-500/10 border-rose-500/30 text-rose-300')
                  }`}>
                    <p className="text-sm font-black italic">{reflexFeedback}</p>
                    <p className="text-xs font-bold mt-2 opacity-80">
                      {reflexSelectedOption === 'TIMEOUT_EXPIRED'
                        ? 'A pressão do tempo faz parte do treino. Ajuste a dificuldade se quiser calibrar melhor.'
                        : reflexSuccess
                          ? `Tempo desta resposta: ${reflexLastResponseTime?.toFixed(1)}s`
                          : `Tempo desta resposta: ${reflexLastResponseTime?.toFixed(1)}s`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`p-6 rounded-[2.5rem] border ${c('bg-white/90 border-slate-100 shadow-sm', 'bg-slate-900/60 border-slate-700 shadow-xl')}`}>
            <div className="flex items-center justify-between gap-3 px-1 mb-6">
              <p className={`text-base font-black uppercase tracking-[0.2em] whitespace-nowrap ${c('text-slate-500', 'text-slate-400')}`}>Destaques de Performance</p>
              <div className="flex h-1.5 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <div className="bg-amber-500 w-1/3" />
                <div className="bg-rose-500 w-1/2" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-3xl p-5 border ${c('bg-gradient-to-br from-amber-50 to-white border-amber-100', 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20')}`}>
                <p className={`text-base font-black uppercase tracking-widest ${c('text-amber-700', 'text-amber-400/80')}`}>Melhor Geral</p>
                <div className="mt-3">
                  <p className="text-4xl font-black">{bestReflexHighlights.bestOverall ? `${bestReflexHighlights.bestOverall.accuracy}%` : '--'}</p>
                  <p className={`text-sm font-bold mt-1 ${c('text-slate-500', 'text-slate-400')}`}>
                    {bestReflexHighlights.bestOverall ? `${bestReflexHighlights.bestOverall.difficulty} • ${bestReflexHighlights.bestOverall.avgTime}s` : 'Sem histórico'}
                  </p>
                  <p className={`text-[11px] mt-2 ${c('text-slate-600', 'text-slate-400')}`}>
                    {bestReflexHighlights.bestOverall ? `Melhor tempo: ${bestReflexHighlights.bestOverall.bestTime.toFixed(2)}s` : 'Complete uma sessão para medir seu ritmo'}
                  </p>
                </div>
              </div>
              <div className={`rounded-3xl p-5 border ${c('bg-gradient-to-br from-rose-50 to-white border-rose-100', 'bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20')}`}>
                <p className={`text-base font-black uppercase tracking-widest ${c('text-rose-700', 'text-rose-400/80')}`}>Nível Máximo</p>
                <div className="mt-3">
                  <p className="text-4xl font-black">{bestReflexHighlights.bestByDiff ? bestReflexHighlights.bestByDiff.diff : '--'}</p>
                  <p className={`text-sm font-bold mt-1 ${c('text-slate-500', 'text-slate-400')}`}>
                    {bestReflexHighlights.bestByDiff ? `${bestReflexHighlights.bestByDiff.record.accuracy}% de acerto` : 'Ainda não chegou'}
                  </p>
                  <p className={`text-[11px] mt-2 ${c('text-slate-600', 'text-slate-400')}`}>
                    {bestReflexHighlights.bestByDiff ? `Média ${bestReflexHighlights.bestByDiff.record.avgTime.toFixed(2)}s • melhor ${bestReflexHighlights.bestByDiff.record.bestTime.toFixed(2)}s` : 'Suba a pressão para registrar níveis mais altos'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { stopPillAudio(); setSelected(null); }}>
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
                          void speakPillWithThemeVoice(pill);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${c('bg-slate-100 text-slate-700 hover:bg-slate-200', 'bg-slate-700 text-slate-200 hover:bg-slate-600')}`}
                      >
                        🔊 Ouvir com {themeVoice[pill.theme].label}
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

            {(() => {
              const pill = pills.find((p) => p.id === selected);
              if (!pill) return null;
              const route = getPillActionRoute(pill);
              return (
                <button
                  onClick={() => {
                    stopPillAudio();
                    setSelected(null);
                    onNavigate?.(route.tab as any, route.params || {});
                  }}
                  className={`w-full mt-3 py-2.5 rounded-xl text-xs font-bold ${c('bg-emerald-50 text-emerald-800 border border-emerald-100', 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20')}`}
                >
                  {route.label}
                </button>
              );
            })()}

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
              <button onClick={() => setPracticePillId(selected)} className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Praticar +25XP</button>
            </div>
          </div>
        </div>
      )}

      {practicePillId && (() => {
        const pill = pills.find((item) => item.id === practicePillId);
        if (!pill) return null;
        const practice = getPracticeContent(pill);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setPracticePillId(null)}>
            <div className={`rounded-[2rem] p-6 max-w-sm w-full border shadow-2xl ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-emerald-700', 'text-emerald-300')}`}>Prática sugerida</p>
                  <h3 className="font-extrabold text-lg mt-2">{practice.title}</h3>
                </div>
                <button
                  onClick={() => setPracticePillId(null)}
                  className={`w-9 h-9 rounded-2xl text-sm font-black ${c('bg-slate-100 text-slate-600', 'bg-slate-800 text-slate-300')}`}
                >
                  ✕
                </button>
              </div>

              <div className={`mt-4 rounded-2xl p-4 ${c('bg-emerald-50 border border-emerald-100', 'bg-emerald-900/20 border border-emerald-800')}`}>
                <p className="text-sm font-medium leading-relaxed">{practice.intro}</p>
              </div>

              <div className="mt-4 space-y-3">
                {practice.steps.map((step, index) => (
                  <div key={step} className={`rounded-2xl p-3 ${c('bg-slate-50', 'bg-slate-800/80')}`}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] opacity-60 mb-1">Passo {index + 1}</p>
                    <p className="text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              <div className={`mt-4 rounded-2xl p-4 ${c('bg-indigo-50 border border-indigo-100', 'bg-indigo-900/20 border border-indigo-800')}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] mb-1">Dica</p>
                <p className="text-sm leading-relaxed">{practice.tip}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => setPracticePillId(null)}
                  className={`py-3 rounded-2xl text-sm font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200 border border-slate-700')}`}
                >
                  Fechar
                </button>
                <button
                  onClick={completePractice}
                  className="py-3 rounded-2xl text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                >
                  {practice.actionLabel} +25 XP
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
