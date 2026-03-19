'use client';

import { useMemo, useRef, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import SectionHeroCard from './SectionHeroCard';

interface Props { darkMode?: boolean; onNavigate?: (tab: 'diary' | 'solta', params?: Record<string, any>) => void }

type EmotionalFamily = 'medo' | 'tristeza' | 'raiva' | 'alegria' | 'vergonha' | 'culpa' | 'afeto';
type EmotionalCategory = 'Agradável' | 'Desconfortável' | 'Misto';

interface EmotionEntry {
  word: string;
  family: EmotionalFamily;
  category: EmotionalCategory;
  definition: string;
  synonyms: string[];
  similar: string[];
  appearsWhen: string;
  asksFor: string;
  healthyResponse: string;
}

interface DifferenceEntry {
  id: string;
  left: string;
  right: string;
  summary: string;
}

const emotions: EmotionEntry[] = [
  { word: 'Ansiedade', family: 'medo', category: 'Desconfortável', definition: 'Estado de alerta, inquietação e antecipação. Costuma olhar para o que pode acontecer.', synonyms: ['inquietação', 'nervosismo', 'apreensão'], similar: ['medo', 'angústia', 'insegurança'], appearsWhen: 'Quando existe incerteza, excesso de antecipação ou sensação de falta de controle.', asksFor: 'Aterramento, redução de previsões e foco no próximo passo concreto.', healthyResponse: 'Nomeie o alerta, respire, cheque fatos e reduza a tarefa ao próximo movimento seguro.' },
  { word: 'Medo', family: 'medo', category: 'Desconfortável', definition: 'Resposta emocional diante de ameaça percebida no presente ou muito próxima.', synonyms: ['temor', 'receio', 'susto interno'], similar: ['ansiedade', 'pavor', 'insegurança'], appearsWhen: 'Quando o corpo e a mente detectam risco, perigo ou vulnerabilidade imediata.', asksFor: 'Segurança, avaliação concreta do risco e proteção proporcional.', healthyResponse: 'Diferencie perigo real de projeção e escolha a resposta mais segura para agora.' },
  { word: 'Insegurança', family: 'medo', category: 'Desconfortável', definition: 'Sensação de dúvida sobre o próprio valor, aceitação ou capacidade.', synonyms: ['autodúvida', 'incerteza', 'vacilo interno'], similar: ['ansiedade', 'vergonha', 'medo'], appearsWhen: 'Quando você se compara, espera julgamento ou sente que não vai dar conta.', asksFor: 'Mais base interna, menos comparação e leitura mais realista do próprio valor.', healthyResponse: 'Troque a autocobrança por dados concretos sobre o que você sabe, consegue e precisa ajustar.' },
  { word: 'Desamparo', family: 'medo', category: 'Desconfortável', definition: 'Sensação de não ter apoio, saída ou recurso suficiente diante do que está acontecendo.', synonyms: ['desproteção', 'impotência', 'abandono interno'], similar: ['medo', 'desespero', 'solidão'], appearsWhen: 'Quando a situação parece grande demais e você se percebe sem base ou sem ajuda.', asksFor: 'Amparo, orientação e redução imediata da sobrecarga.', healthyResponse: 'Pare de tentar resolver tudo sozinho e procure um ponto concreto de apoio agora.' },
  { word: 'Desespero', family: 'medo', category: 'Desconfortável', definition: 'Sofrimento intenso com sensação de urgência e falta de saída.', synonyms: ['agonia', 'aflição extrema', 'colapso interno'], similar: ['pânico', 'desamparo', 'medo'], appearsWhen: 'Quando a dor interna parece maior do que os recursos percebidos para lidar com ela.', asksFor: 'Contenção, presença e proteção imediata.', healthyResponse: 'Reduza o horizonte para os próximos minutos e priorize segurança, respiração e apoio humano.' },
  { word: 'Tristeza', family: 'tristeza', category: 'Desconfortável', definition: 'Emoção de perda, frustração ou queda de energia ligada ao que faltou, acabou ou doeu.', synonyms: ['abatimento', 'dor emocional', 'desânimo'], similar: ['melancolia', 'vazio', 'saudade'], appearsWhen: 'Quando algo importante dói, se perde, decepciona ou não acontece como precisava.', asksFor: 'Pausa, acolhimento e um ritmo menos exigente.', healthyResponse: 'Permita sentir sem se abandonar. Reduza a meta do dia e procure apoio ou presença segura.' },
  { word: 'Melancolia', family: 'tristeza', category: 'Misto', definition: 'Tristeza mais contemplativa, lenta e reflexiva, muitas vezes misturada com memória ou saudade.', synonyms: ['saudade profunda', 'tristeza suave', 'nostalgia triste'], similar: ['tristeza', 'nostalgia', 'saudade'], appearsWhen: 'Quando o passado toca o presente e deixa uma tonalidade mais silenciosa e funda.', asksFor: 'Acolhimento, expressão simbólica e menos dureza com o próprio ritmo.', healthyResponse: 'Dê linguagem ao que ficou tocado: escreva, respire e deixe a emoção existir sem dramatizar.' },
  { word: 'Vazio', family: 'tristeza', category: 'Desconfortável', definition: 'Sensação de desconexão, falta de sentido ou ausência interna de contato emocional.', synonyms: ['desligamento', 'oco interno', 'desconexão'], similar: ['apatia', 'tristeza', 'solidão'], appearsWhen: 'Quando há esgotamento, perda de sentido, excesso de adaptação ou desconexão de necessidades.', asksFor: 'Reconexão gradual com corpo, rotina e vínculo.', healthyResponse: 'Comece pelo básico: água, comida, luz, movimento leve e uma ação que reative presença.' },
  { word: 'Saudade', family: 'tristeza', category: 'Misto', definition: 'Falta afetiva de alguém, de um tempo ou de uma experiência que teve valor.', synonyms: ['falta', 'lembrança afetiva', 'nostalgia'], similar: ['melancolia', 'tristeza', 'nostalgia'], appearsWhen: 'Quando algo importante do passado continua emocionalmente vivo no presente.', asksFor: 'Memória com ternura, não só dor.', healthyResponse: 'Honre o vínculo com delicadeza, sem transformar a lembrança em condenação do presente.' },
  { word: 'Solidão', family: 'tristeza', category: 'Desconfortável', definition: 'Sensação de desconexão emocional, mesmo podendo haver pessoas por perto.', synonyms: ['isolamento', 'desconexão', 'falta de vínculo'], similar: ['vazio', 'saudade', 'desamparo'], appearsWhen: 'Quando falta reciprocidade, presença emocional ou sensação de pertencimento.', asksFor: 'Contato seguro e reconhecimento de necessidades relacionais.', healthyResponse: 'Em vez de se calar totalmente, busque um gesto simples de conexão com alguém confiável.' },
  { word: 'Raiva', family: 'raiva', category: 'Desconfortável', definition: 'Energia emocional que surge quando algo parece injusto, invasivo, frustrante ou desrespeitoso.', synonyms: ['zanga', 'fúria', 'irritação intensa'], similar: ['frustração', 'indignação', 'irritabilidade'], appearsWhen: 'Quando um limite é atravessado ou uma necessidade importante é ignorada.', asksFor: 'Direção, limite e canalização sem impulso destrutivo.', healthyResponse: 'Atrase a reação automática e transforme a energia em posicionamento claro.' },
  { word: 'Frustração', family: 'raiva', category: 'Desconfortável', definition: 'Sentimento que surge quando uma expectativa não é atendida ou um objetivo é bloqueado.', synonyms: ['decepção', 'insatisfação', 'travamento'], similar: ['raiva', 'tristeza', 'desânimo'], appearsWhen: 'Quando algo não sai como o esperado, principalmente em metas, planos ou vínculos.', asksFor: 'Revisão de expectativa e reorganização prática.', healthyResponse: 'Em vez de atacar a si ou ao outro, ajuste a expectativa e escolha a menor correção possível.' },
  { word: 'Indignação', family: 'raiva', category: 'Desconfortável', definition: 'Raiva justa diante de uma injustiça ou violação ética.', synonyms: ['revolta justa', 'protesto interno', 'insatisfação moral'], similar: ['raiva', 'ressentimento', 'frustração'], appearsWhen: 'Quando um valor importante é ferido ou algo parece abusivo.', asksFor: 'Posicionamento, denúncia ou limite coerente.', healthyResponse: 'Use a energia para se posicionar com clareza, não para explodir sem direção.' },
  { word: 'Ressentimento', family: 'raiva', category: 'Desconfortável', definition: 'Mágoa persistente por algo percebido como injusto ou ofensivo.', synonyms: ['amargura', 'mágoa acumulada', 'ranço emocional'], similar: ['raiva', 'indignação', 'tristeza'], appearsWhen: 'Quando algo ficou aberto, mal resolvido ou sem reparo.', asksFor: 'Elaboração, reparo ou distanciamento.', healthyResponse: 'Pergunte o que ainda está em aberto e se isso pede conversa, luto ou afastamento.' },
  { word: 'Irritabilidade', family: 'raiva', category: 'Desconfortável', definition: 'Tendência aumentada a reagir com impaciência ou incômodo.', synonyms: ['impaciência', 'reatividade', 'nervosismo'], similar: ['raiva', 'sobrecarga', 'cansaço'], appearsWhen: 'Com sono ruim, fome, tensão acumulada ou estímulo demais.', asksFor: 'Redução de estímulo e cuidado físico básico.', healthyResponse: 'Cheque corpo e ambiente antes de concluir que o problema é só relacional.' },
  { word: 'Sobrecarga', family: 'raiva', category: 'Desconfortável', definition: 'Sensação de ter demandas demais para os recursos emocionais do momento.', synonyms: ['esgotamento', 'pressão excessiva', 'peso'], similar: ['irritabilidade', 'exaustão', 'vazio'], appearsWhen: 'Quando há volume de exigências maior do que a capacidade de sustentar agora.', asksFor: 'Redução, priorização e interrupção de excessos.', healthyResponse: 'Retire o que não cabe hoje e preserve o mínimo necessário.' },
  { word: 'Entusiasmo', family: 'alegria', category: 'Agradável', definition: 'Estado de excitação positiva e energia direcionada a algo.', synonyms: ['ânimo', 'empolgação', 'vigor'], similar: ['alegria', 'euforia', 'esperança'], appearsWhen: 'Quando algo desperta interesse, sentido ou vontade de agir.', asksFor: 'Direção e constância.', healthyResponse: 'Use o impulso para dar forma prática ao que te anima.' },
  { word: 'Sereno', family: 'alegria', category: 'Agradável', definition: 'Estado de paz interior, sem agitação. Mais profundo do que uma calma passageira.', synonyms: ['tranquilo', 'pacífico', 'plácido'], similar: ['paz', 'alívio', 'contentamento'], appearsWhen: 'Quando o corpo e a mente conseguem descansar sem pressão imediata.', asksFor: 'Continuidade e proteção do ritmo.', healthyResponse: 'Reconheça esse estado e evite preenchê-lo imediatamente com nova cobrança.' },
  { word: 'Gratidão', family: 'alegria', category: 'Agradável', definition: 'Sentimento de apreciação por algo ou alguém.', synonyms: ['reconhecimento', 'agradecimento', 'apreciação'], similar: ['contentamento', 'alegria', 'ternura'], appearsWhen: 'Quando você percebe apoio, presença, cuidado ou valor no que recebeu.', asksFor: 'Presença e reconhecimento.', healthyResponse: 'Nomeie explicitamente o que sustentou você ou fez diferença.' },
  { word: 'Esperança', family: 'alegria', category: 'Agradável', definition: 'Expectativa positiva quanto ao futuro, mesmo em cenários difíceis.', synonyms: ['perspectiva', 'fé', 'confiança'], similar: ['otimismo', 'coragem', 'alívio'], appearsWhen: 'Quando ainda existe algum espaço interno para imaginar saída ou construção.', asksFor: 'Sustentação e pequenos passos coerentes.', healthyResponse: 'Proteja o que ainda faz sentido e construa o próximo passo viável.' },
  { word: 'Alívio', family: 'alegria', category: 'Agradável', definition: 'Sensação de redução de tensão ou sofrimento após um período de incômodo.', synonyms: ['descompressão', 'trégua', 'descanso emocional'], similar: ['paz', 'sereno', 'contentamento'], appearsWhen: 'Depois de uma tensão, resolução parcial ou cuidado que realmente funcionou.', asksFor: 'Reconhecimento do que ajudou.', healthyResponse: 'Observe qual condição reduziu a pressão e tente repeti-la.' },
  { word: 'Orgulho', family: 'alegria', category: 'Agradável', definition: 'Satisfação consigo mesmo por conquistas, valores ou esforço realizado.', synonyms: ['dignidade', 'autoestima', 'satisfação pessoal'], similar: ['contentamento', 'admiração', 'confiança'], appearsWhen: 'Quando você reconhece algo que fez, sustentou ou construiu.', asksFor: 'Reconhecimento sem precisar se diminuir logo depois.', healthyResponse: 'Permita-se validar o esforço sem neutralizar a conquista.' },
  { word: 'Euforia', family: 'alegria', category: 'Agradável', definition: 'Estado de alegria intensa e energia elevada, geralmente de curta duração.', synonyms: ['exaltação', 'empolgação extrema', 'excitação'], similar: ['entusiasmo', 'alegria', 'impulso'], appearsWhen: 'Em momentos de ganho, entusiasmo alto ou ativação positiva intensa.', asksFor: 'Ritmo e aterramento para não virar impulsividade.', healthyResponse: 'Aproveite a energia, mas desacelere antes de decidir ou prometer demais.' },
  { word: 'Contentamento', family: 'alegria', category: 'Agradável', definition: 'Satisfação tranquila com o que se tem no presente.', synonyms: ['plenitude', 'satisfação serena', 'bem-estar'], similar: ['alegria', 'sereno', 'alívio'], appearsWhen: 'Quando algo está suficientemente bom e você consegue usufruir disso.', asksFor: 'Presença, não aceleração.', healthyResponse: 'Perceba o que já está bom antes de correr para a próxima exigência.' },
  { word: 'Vergonha', family: 'vergonha', category: 'Desconfortável', definition: 'Sentimento de inadequação diante dos outros. Diferente da culpa, costuma atacar quem você acredita ser.', synonyms: ['constrangimento profundo', 'humilhação', 'envergonhamento'], similar: ['culpa', 'insegurança', 'autocrítica'], appearsWhen: 'Em exposição, comparação, erro visível ou sensação de inadequação.', asksFor: 'Dignidade, proteção e acolhimento.', healthyResponse: 'Diferencie identidade de comportamento: uma situação não define quem você é.' },
  { word: 'Constrangimento', family: 'vergonha', category: 'Misto', definition: 'Desconforto social mais pontual, geralmente menor que a vergonha profunda.', synonyms: ['embaraço', 'incômodo social', 'desconforto'], similar: ['vergonha', 'timidez', 'insegurança'], appearsWhen: 'Em gafes, exposição ou situações socialmente desconfortáveis.', asksFor: 'Perspectiva e menos dramatização.', healthyResponse: 'Lembre que a maioria das cenas sociais pesa menos do que parece no momento.' },
  { word: 'Culpa', family: 'culpa', category: 'Desconfortável', definition: 'Sentimento negativo por ter feito algo errado. Pode levar à reparação ou virar autocobrança excessiva.', synonyms: ['remorso', 'arrependimento', 'peso moral'], similar: ['vergonha', 'arrependimento', 'responsabilidade'], appearsWhen: 'Quando uma ação ou omissão entra em conflito com seus valores.', asksFor: 'Responsabilidade proporcional e reparo possível.', healthyResponse: 'Pergunte o que cabe reparar e o que já virou punição interna em excesso.' },
  { word: 'Arrependimento', family: 'culpa', category: 'Misto', definition: 'Dor emocional por uma ação passada que hoje é vista de outra forma.', synonyms: ['pesar', 'lamento', 'remorso retrospectivo'], similar: ['culpa', 'tristeza', 'saudade'], appearsWhen: 'Ao revisitar decisões passadas com outra maturidade ou informação.', asksFor: 'Aprendizado e integração.', healthyResponse: 'Transforme a dor em aprendizado, não em arma contra si.' },
  { word: 'Ternura', family: 'afeto', category: 'Agradável', definition: 'Sentimento de carinho delicado e afeto protetor em relação a alguém.', synonyms: ['doçura', 'afeto', 'carinho'], similar: ['acolhimento', 'carinho', 'compaixão'], appearsWhen: 'Em contato sensível, cuidado genuíno ou lembranças afetivas seguras.', asksFor: 'Presença e continuidade do cuidado.', healthyResponse: 'Reconheça esse afeto como recurso interno ou relacional, não como fraqueza.' },
  { word: 'Admiração', family: 'afeto', category: 'Agradável', definition: 'Reconhecimento positivo e respeito por qualidades de si, de alguém ou de algo.', synonyms: ['apreço', 'respeito', 'encantamento'], similar: ['orgulho', 'gratidão', 'inspiração'], appearsWhen: 'Quando algo desperta respeito, encanto ou reconhecimento verdadeiro.', asksFor: 'Aproximação com valor e inspiração.', healthyResponse: 'Use a admiração para se orientar, não para se diminuir.' },
  { word: 'Confiança', family: 'afeto', category: 'Agradável', definition: 'Sensação de segurança em si, no outro ou em um processo.', synonyms: ['segurança', 'fé', 'credibilidade'], similar: ['esperança', 'pertencimento', 'sereno'], appearsWhen: 'Quando existe consistência, previsibilidade e base interna ou relacional.', asksFor: 'Continuidade e coerência.', healthyResponse: 'Observe quais sinais reais sustentam essa segurança.' },
  { word: 'Ciúme', family: 'afeto', category: 'Misto', definition: 'Medo de perder afeto, atenção ou vínculo importante para outra pessoa.', synonyms: ['zelo excessivo', 'ameaça afetiva', 'posse emocional'], similar: ['insegurança', 'medo', 'afeto'], appearsWhen: 'Quando há ameaça percebida ao vínculo ou sensação de substituição.', asksFor: 'Clareza, segurança e conversa.', healthyResponse: 'Nomeie a insegurança antes de agir no impulso.' },
  { word: 'Inveja', family: 'afeto', category: 'Desconfortável', definition: 'Desejo doloroso de possuir algo que o outro tem.', synonyms: ['comparação dolorosa', 'cobiça', 'ressentimento comparativo'], similar: ['comparação', 'admiração', 'insegurança'], appearsWhen: 'Quando a vida do outro vira medida para julgar a sua.', asksFor: 'Reconhecimento de carência e reorientação para o próprio caminho.', healthyResponse: 'Pergunte o que a inveja está apontando como necessidade sua.' },
  { word: 'Pertencimento', family: 'afeto', category: 'Agradável', definition: 'Sentir-se aceito e incluído em um grupo, relação ou contexto.', synonyms: ['inclusão', 'conexão', 'aceitação'], similar: ['acolhimento', 'segurança', 'afeto'], appearsWhen: 'Quando você pode existir sem precisar performar para merecer lugar.', asksFor: 'Vínculo recíproco e ambiente seguro.', healthyResponse: 'Observe onde seu corpo relaxa mais sendo quem você é.' },
  { word: 'Acolhimento', family: 'afeto', category: 'Agradável', definition: 'Sentimento de receber a si ou ao outro com aceitação.', synonyms: ['aceitação', 'acolhida', 'cuidado'], similar: ['ternura', 'pertencimento', 'compaixão'], appearsWhen: 'Quando há escuta, espaço e menos exigência de perfeição.', asksFor: 'Continuidade, linguagem gentil e menos ataque interno.', healthyResponse: 'Pergunte como você trataria alguém querido nessa mesma situação.' },
  { word: 'Autocompaixão', family: 'afeto', category: 'Agradável', definition: 'Tratar a si mesmo com gentileza diante de dificuldades, como trataria um amigo.', synonyms: ['cuidado próprio', 'gentileza interior', 'bondade consigo'], similar: ['acolhimento', 'carinho', 'ternura'], appearsWhen: 'Quando você reconhece dor, falha ou limite sem usar isso como arma contra si.', asksFor: 'Gentileza, humanidade comum e menos ataque pessoal.', healthyResponse: 'Substitua a dureza por uma frase que traga firmeza com respeito.' },
  { word: 'Compaixão', family: 'afeto', category: 'Agradável', definition: 'Sensibilidade ao sofrimento do outro acompanhada de vontade de ajudar.', synonyms: ['empatia ativa', 'solidariedade', 'humanidade'], similar: ['ternura', 'acolhimento', 'carinho'], appearsWhen: 'Quando você consegue perceber dor sem virar pedra nem afundar junto.', asksFor: 'Presença e ação cuidadosa.', healthyResponse: 'Acolha a dor sem precisar assumir tudo para si.' },
  { word: 'Vulnerabilidade', family: 'afeto', category: 'Misto', definition: 'Estado de abertura emocional com risco de dor, mas também de conexão.', synonyms: ['exposição emocional', 'sensibilidade', 'abertura'], similar: ['insegurança', 'afeto', 'medo'], appearsWhen: 'Quando você se mostra de forma mais verdadeira diante do outro ou de si.', asksFor: 'Segurança, escolha de contexto e cuidado.', healthyResponse: 'Vulnerabilidade pede critério, não fechamento total.' },
];

const differences: DifferenceEntry[] = [
  { id: 'ansiedade-medo', left: 'Ansiedade', right: 'Medo', summary: 'Ansiedade costuma antecipar o futuro; medo costuma reagir a uma ameaça percebida como presente.' },
  { id: 'tristeza-vazio', left: 'Tristeza', right: 'Vazio', summary: 'Tristeza ainda tem contato com a dor; vazio costuma vir com desligamento e falta de sentido.' },
  { id: 'culpa-vergonha', left: 'Culpa', right: 'Vergonha', summary: 'Culpa olha para algo que você fez; vergonha costuma atacar quem você acredita ser.' },
  { id: 'frustracao-raiva', left: 'Frustração', right: 'Raiva', summary: 'Frustração aparece quando algo não sai como esperado; raiva tende a surgir quando algo parece invasivo, injusto ou atravessado.' },
];

const familyLabel: Record<EmotionalFamily, string> = { medo: 'Medo', tristeza: 'Tristeza', raiva: 'Raiva', alegria: 'Alegria', vergonha: 'Vergonha', culpa: 'Culpa', afeto: 'Afeto' };

const familyTheme: Record<EmotionalFamily, { active: string; badge: string; badgeDark: string }> = {
  medo: { active: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-indigo-400/30', badge: 'bg-indigo-100 text-indigo-700', badgeDark: 'bg-indigo-900/40 text-indigo-300' },
  tristeza: { active: 'bg-sky-600 text-white shadow-lg shadow-sky-500/20 border-sky-400/30', badge: 'bg-sky-100 text-sky-700', badgeDark: 'bg-sky-900/40 text-sky-300' },
  raiva: { active: 'bg-rose-600 text-white shadow-lg shadow-rose-500/20 border-rose-400/30', badge: 'bg-rose-100 text-rose-700', badgeDark: 'bg-rose-900/40 text-rose-300' },
  alegria: { active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-emerald-400/30', badge: 'bg-emerald-100 text-emerald-700', badgeDark: 'bg-emerald-900/40 text-emerald-300' },
  vergonha: { active: 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20 border-fuchsia-400/30', badge: 'bg-fuchsia-100 text-fuchsia-700', badgeDark: 'bg-fuchsia-900/40 text-fuchsia-300' },
  culpa: { active: 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 border-amber-400/30', badge: 'bg-amber-100 text-amber-700', badgeDark: 'bg-amber-900/40 text-amber-300' },
  afeto: { active: 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 border-violet-400/30', badge: 'bg-violet-100 text-violet-700', badgeDark: 'bg-violet-900/40 text-violet-300' },
};

const categoryTheme: Record<EmotionalCategory, { active: string; badge: string; badgeDark: string }> = {
  Agradável: { active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-emerald-400/30', badge: 'bg-emerald-100 text-emerald-700', badgeDark: 'bg-emerald-900/40 text-emerald-300' },
  Desconfortável: { active: 'bg-rose-600 text-white shadow-lg shadow-rose-500/20 border-rose-400/30', badge: 'bg-rose-100 text-rose-700', badgeDark: 'bg-rose-900/40 text-rose-300' },
  Misto: { active: 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 border-violet-400/30', badge: 'bg-violet-100 text-violet-700', badgeDark: 'bg-violet-900/40 text-violet-300' },
};

export default function EmotionalDictionarySection({ darkMode: dm, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<EmotionalFamily | null>(null);
  const [category, setCategory] = useState<EmotionalCategory | null>(null);
  const [expandedEmotion, setExpandedEmotion] = useState<string | null>(null);
  const [favorites, setFavorites] = useAppPersistence<string[]>('psico_dictionary_favorites', []);
  const [history, setHistory] = useAppPersistence<string[]>('psico_dictionary_history', []);
  const familyScrollRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const c = (l: string, d: string) => (dm ? d : l);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    ref.current?.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emotions.filter((emotion) => {
      const matchesText = !q || [emotion.word, emotion.definition, emotion.family, emotion.category, ...emotion.synonyms, ...emotion.similar].some((item) => item.toLowerCase().includes(q));
      const matchesFamily = !family || emotion.family === family;
      const matchesCategory = !category || emotion.category === category;
      return matchesText && matchesFamily && matchesCategory;
    });
  }, [query, family, category]);

  const groupedByFamily = useMemo(() => {
    return (Object.keys(familyLabel) as EmotionalFamily[]).map((key) => ({
      family: key,
      items: filtered.filter((emotion) => emotion.family === key),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  const favoriteEmotions = useMemo(() => emotions.filter((emotion) => favorites.includes(emotion.word)), [favorites]);
  const recentHistory = useMemo(() => history.slice(0, 3), [history]);

  const toggleFavorite = (word: string) => {
    setFavorites((prev) => prev.includes(word) ? prev.filter((item) => item !== word) : [...prev, word]);
  };

  const registerHistory = (word: string) => {
    setHistory((prev) => [word, ...prev.filter((item) => item !== word)].slice(0, 12));
  };

  return (
    <div className={`p-4 pb-28 min-h-screen ${dm ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-lg mx-auto">
        <div className="pt-6 mb-8">
          <SectionHeroCard
            darkMode={dm}
            eyebrow="Nomear, diferenciar, responder"
            title="Dicionário Emocional"
            description="Consulte emoções, compare nuances parecidas e veja o que cada estado costuma pedir de forma mais saudável."
            icon="📖"
          />
        </div>

        <section className={`rounded-[2rem] border p-4 mb-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: 'Nomear', desc: 'Dar linguagem mais precisa ao que você sente.' },
              { title: 'Diferenciar', desc: 'Separar emoções parecidas para ler melhor o momento.' },
              { title: 'Responder', desc: 'Ver o que cada emoção pede de forma mais saudável.' },
            ].map((item, index) => (
              <div key={item.title} className={`rounded-[1.4rem] border p-3 ${index === 0 ? c('bg-blue-50 border-blue-200', 'bg-blue-500/10 border-blue-500/20') : index === 1 ? c('bg-violet-50 border-violet-200', 'bg-violet-500/10 border-violet-500/20') : c('bg-emerald-50 border-emerald-200', 'bg-emerald-500/10 border-emerald-500/20')}`}>
                <p className="text-xs font-black uppercase tracking-[0.12em]">{item.title}</p>
                <p className={`mt-2 text-[12px] font-medium leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className={`rounded-3xl p-4 mb-6 shadow-sm border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por emoção, sinônimo, sensação parecida ou família emocional..." className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 ${c('bg-slate-50 border border-slate-100 focus:bg-white', 'bg-slate-900 border border-slate-800 focus:bg-slate-950')}`} />
          </div>
        </div>

        {favoriteEmotions.length > 0 && (
          <section className={`rounded-[2rem] border p-4 mb-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.14em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Favoritos</p>
                <p className="text-sm font-black mt-1">Emoções que você consulta mais</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black ${c('bg-amber-100 text-amber-700', 'bg-amber-900/30 text-amber-300')}`}>{favoriteEmotions.length}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {favoriteEmotions.map((emotion) => (
                <button key={emotion.word} onClick={() => { setFamily(emotion.family); setCategory(null); registerHistory(emotion.word); }} className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border ${c('bg-amber-50 border-amber-200 text-amber-800', 'bg-amber-500/10 border-amber-500/20 text-amber-200')}`}>{emotion.word}</button>
              ))}
            </div>
          </section>
        )}

        {recentHistory.length > 0 && (
          <section className={`rounded-[2rem] border p-4 mb-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Histórico recente</p>
            <div className="flex gap-2 overflow-x-auto pb-1 mt-3 no-scrollbar">
              {recentHistory.map((word) => (
                <button key={word} onClick={() => setQuery(word)} className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap border ${c('bg-slate-50 border-slate-200 text-slate-700', 'bg-slate-900 border-slate-700 text-slate-200')}`}>{word}</button>
              ))}
            </div>
          </section>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Famílias emocionais</p>
            <div className="flex gap-1">
              <button onClick={() => scrollContainer(familyScrollRef, 'left')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={() => scrollContainer(familyScrollRef, 'right')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          <div ref={familyScrollRef} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            <button onClick={() => setFamily(null)} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${!family ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border-blue-400/30' : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}>Todas</button>
            {(Object.keys(familyLabel) as EmotionalFamily[]).map((item) => (
              <button key={item} onClick={() => setFamily(item)} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${family === item ? familyTheme[item].active : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}>{familyLabel[item]}</button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Categoria emocional</p>
            <div className="flex gap-1">
              <button onClick={() => scrollContainer(categoryScrollRef, 'left')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={() => scrollContainer(categoryScrollRef, 'right')} className={`p-2 rounded-lg border transition-all ${c('bg-white border-slate-100 hover:bg-slate-50', 'bg-slate-800 border-slate-700 hover:bg-slate-700')}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          <div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            <button onClick={() => setCategory(null)} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${!category ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 border-cyan-400/30' : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}>Todas</button>
            {(['Agradável', 'Desconfortável', 'Misto'] as EmotionalCategory[]).map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${category === item ? categoryTheme[item].active : c('bg-white border-slate-100 text-slate-600', 'bg-slate-800 text-slate-300 border-slate-700')}`}>{item}</button>
            ))}
          </div>
        </div>

        <section className={`rounded-[2rem] border p-4 mb-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/70 border-slate-700')}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.14em] opacity-60 ${c('text-slate-500', 'text-slate-400')}`}>Emoções parecidas</p>
          <div className="space-y-3 mt-3">
            {differences.map((item) => (
              <div key={item.id} className={`rounded-[1.4rem] border p-4 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                <p className="text-sm font-black">{item.left} x {item.right}</p>
                <p className={`mt-2 text-[13px] leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{item.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
          {groupedByFamily.map((group) => (
            <section key={group.family}>
              <div className="flex items-center gap-3 mb-3 px-1">
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-lg ${familyTheme[group.family].active.split(' border-')[0]}`}>{familyLabel[group.family]}</span>
                <p className={`text-xs font-black uppercase tracking-[0.1em] ${c('text-slate-500', 'text-slate-400')}`}>{group.items.length} emoções</p>
              </div>
              <div className="space-y-4">
                {group.items.map((emotion) => {
                  const isFavorite = favorites.includes(emotion.word);
                  const isExpanded = expandedEmotion === emotion.word;
                  return (
                    <div key={emotion.word} className={`rounded-[1.8rem] border ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-800/60 border-slate-700')}`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-lg font-black tracking-tight ${c('text-slate-900', 'text-white')}`}>{emotion.word}</h3>
                              <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full ${dm ? categoryTheme[emotion.category].badgeDark : categoryTheme[emotion.category].badge}`}>{emotion.category}</span>
                            </div>
                            <p className={`mt-3 text-sm leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{emotion.definition}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { toggleFavorite(emotion.word); registerHistory(emotion.word); }} className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-lg transition-all ${isFavorite ? 'bg-amber-500 text-white border-amber-400' : c('bg-slate-50 border-slate-200 text-slate-400', 'bg-slate-900 border-slate-700 text-slate-400')}`}>{isFavorite ? '★' : '☆'}</button>
                            <button onClick={() => { setExpandedEmotion(isExpanded ? null : emotion.word); registerHistory(emotion.word); }} className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all ${c('bg-slate-50 border-slate-200 text-slate-500', 'bg-slate-900 border-slate-700 text-slate-300')}`} title={isExpanded ? 'Recolher' : 'Expandir'}>
                              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="grid grid-cols-1 gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className={`rounded-[1.3rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-60">Sinônimos</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {emotion.synonyms.map((item) => (
                                  <button key={`${emotion.word}-syn-${item}`} onClick={() => { setQuery(item); registerHistory(emotion.word); }} className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${c('bg-slate-100 text-slate-600', 'bg-slate-700 text-slate-300')}`}>{item}</button>
                                ))}
                              </div>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-60 mt-4">Emoções próximas ou o que costuma se confundir</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {emotion.similar.map((item) => (
                                  <button key={`${emotion.word}-sim-${item}`} onClick={() => { setQuery(item); registerHistory(emotion.word); }} className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${c('bg-slate-100 text-slate-600', 'bg-slate-700 text-slate-300')}`}>{item}</button>
                                ))}
                              </div>
                            </div>
                            <div className={`rounded-[1.3rem] border p-3 ${c('bg-blue-50 border-blue-100', 'bg-blue-500/10 border-blue-500/20')}`}>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">Quando costuma aparecer</p>
                              <p className="mt-2 text-sm font-medium leading-relaxed">{emotion.appearsWhen}</p>
                            </div>
                            <div className={`rounded-[1.3rem] border p-3 ${c('bg-amber-50 border-amber-100', 'bg-amber-500/10 border-amber-500/20')}`}>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">O que essa emoção pede</p>
                              <p className="mt-2 text-sm font-medium leading-relaxed">{emotion.asksFor}</p>
                            </div>
                            <div className={`rounded-[1.3rem] border p-3 ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-500/10 border-emerald-500/20')}`}>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">Resposta saudável</p>
                              <p className="mt-2 text-sm font-medium leading-relaxed">{emotion.healthyResponse}</p>
                            </div>
                            <div className={`rounded-[1.3rem] border p-3 ${c('bg-slate-50 border-slate-100', 'bg-slate-900 border-slate-700')}`}>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] opacity-70">Continuar com isso</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <button
                                  onClick={() => onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: `Hoje o nome mais próximo para o que sinto é: ${emotion.word}.`, diaryDraftKey: Date.now() })}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-blue-50 text-blue-700 border border-blue-100', 'bg-blue-500/10 text-blue-300 border border-blue-500/20')}`}
                                >
                                  Levar ao diário
                                </button>
                                <button
                                  onClick={() => onNavigate?.('solta', { soltaDraft: `Talvez o que eu esteja sentindo seja ${emotion.word}.\n\nO que isso quer me mostrar: `, soltaDraftKey: Date.now() })}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-violet-50 text-violet-700 border border-violet-100', 'bg-violet-500/10 text-violet-300 border border-violet-500/20')}`}
                                >
                                  Soltar daqui
                                </button>
                              </div>
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

          {groupedByFamily.length === 0 && (
            <div className="py-12 text-center opacity-60">
              <p className="text-4xl mb-3">🎐</p>
              <p className="text-sm font-medium">Nenhuma emoção encontrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
