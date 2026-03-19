import { NextRequest, NextResponse } from 'next/server';
import { TECHNIQUES_CONTEXT } from '@/lib/techniques_context';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const PRIMARY_MODEL = 'stepfun/step-3.5-flash:free';
const FALLBACK_MODEL = 'arcee-ai/trinity-large-preview:free';
const DYNAMIC_FREE_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';
const ALLOWED_ACTIVITY_TABS = [
  'breathing',
  'meditation',
  'mood',
  'calm',
  'acalmese',
  'diary',
  'yoga',
  'solta',
  'gratitude',
  'timer',
  'mixer',
  'assertiveness',
  'sleep',
  'hooponopono',
  'habits',
  'microtasks',
  'missions',
  'artemotion',
  'regulation',
  'healthymessages',
  'emocional',
  'psychoedu',
  'fivefingers',
  'timecapsule',
  'vocacional',
] as const;
const OFFICIAL_APP_RESOURCE_MAP = new Map(
  TECHNIQUES_CONTEXT.appResources.map((item) => [item.tab, item] as const)
);
const SYSTEM_PROMPT = `Você é a Sereno, uma assistente de apoio emocional empática e acolhedora, especializada EXCLUSIVAMENTE em saúde mental e bem-estar psicológico. Você faz parte de um aplicativo de saúde mental chamado Sereno.

CONTEXTO TÉCNICO E TERAPÊUTICO DO APP (USE ISTO PARA NÃO ALUCINAR):
1. RESPIRAÇÃO:
${TECHNIQUES_CONTEXT.breathing.map(b => `- ${b.name}: ${b.description} ${b.pattern ? `Padrão: ${b.pattern}` : ''}`).join('\n')}

2. TÉCNICAS SOS:
- ${TECHNIQUES_CONTEXT.sos.acalmese.name}: ${TECHNIQUES_CONTEXT.sos.acalmese.steps.map(s => `${s.letter}-${s.title}`).join(', ')}.
- ${TECHNIQUES_CONTEXT.sos.grounding.name}: ${TECHNIQUES_CONTEXT.sos.grounding.steps.map(s => `${s.count} ${s.sense}`).join(', ')}.

3. MEDITAÇÕES E YOGA NIDRA:
${TECHNIQUES_CONTEXT.meditation.categories.map(c => `- ${c.name}: ${c.meditations.join(', ')}`).join('\n')}
- ${TECHNIQUES_CONTEXT.meditation.yogaNidra.name}: ${TECHNIQUES_CONTEXT.meditation.yogaNidra.description} Estágios: ${TECHNIQUES_CONTEXT.meditation.yogaNidra.stages.join(', ')}.

4. HO'OPONOPONO:
${TECHNIQUES_CONTEXT.hooponopono.description}
Variedades: ${TECHNIQUES_CONTEXT.hooponopono.varieties.map(v => `${v.name} (Foco: ${v.focus})`).join(', ')}.

5. MÉTODO DOS 5 DEDOS:
- ${TECHNIQUES_CONTEXT.fiveFingers.name}: ${TECHNIQUES_CONTEXT.fiveFingers.description}
- Etapas: ${TECHNIQUES_CONTEXT.fiveFingers.steps.map(step => `${step.finger} = ${step.role} (${step.focus})`).join('; ')}.
- Usos comuns: ${TECHNIQUES_CONTEXT.fiveFingers.uses.join(', ')}.

6. PSICOEDUCAÇÃO, REGULAÇÃO E PERFIS:
- ${TECHNIQUES_CONTEXT.psychoeducation.name}: ${TECHNIQUES_CONTEXT.psychoeducation.description}
- Temas: ${TECHNIQUES_CONTEXT.psychoeducation.themes.join(', ')}. Modos: ${TECHNIQUES_CONTEXT.psychoeducation.modes.join(', ')}. Exemplos: ${TECHNIQUES_CONTEXT.psychoeducation.examples.join(', ')}.
- ${TECHNIQUES_CONTEXT.regulationProfile.name}: ${TECHNIQUES_CONTEXT.regulationProfile.description}
- Eixos: ${TECHNIQUES_CONTEXT.regulationProfile.axes.join(', ')}.
- Visual: ${TECHNIQUES_CONTEXT.regulationProfile.outcomes.visual}
- Auditivo: ${TECHNIQUES_CONTEXT.regulationProfile.outcomes.auditivo}
- Cinestésico: ${TECHNIQUES_CONTEXT.regulationProfile.outcomes.cinestesico}
- ${TECHNIQUES_CONTEXT.emotionalIntelligence.name}: ${TECHNIQUES_CONTEXT.emotionalIntelligence.description}
- Modos: ${TECHNIQUES_CONTEXT.emotionalIntelligence.modes.join(', ')}.
- Pilares de Goleman: ${TECHNIQUES_CONTEXT.emotionalIntelligence.golemanPillars.join(', ')}.
- Foco Gardner: ${TECHNIQUES_CONTEXT.emotionalIntelligence.gardnerFocus.join(', ')}.
- Múltiplas inteligências: ${TECHNIQUES_CONTEXT.emotionalIntelligence.multipleAxes.join(', ')}.
- ${TECHNIQUES_CONTEXT.healthySelfMessages.name}: ${TECHNIQUES_CONTEXT.healthySelfMessages.description}
- Tipos: ${TECHNIQUES_CONTEXT.healthySelfMessages.kinds.join(', ')}. Ações: ${TECHNIQUES_CONTEXT.healthySelfMessages.actions.join(', ')}.
- ${TECHNIQUES_CONTEXT.preventiveIntervention.name}: ${TECHNIQUES_CONTEXT.preventiveIntervention.description}
- Gatilho: ${TECHNIQUES_CONTEXT.preventiveIntervention.trigger}. Sugestões: ${TECHNIQUES_CONTEXT.preventiveIntervention.suggestions.join(', ')}.

7. MÓDULOS RELACIONAIS, MAPAS E LEITURAS AVANÇADAS:
- ${TECHNIQUES_CONTEXT.thematicTracks.name}: ${TECHNIQUES_CONTEXT.thematicTracks.description}
- Temas: ${TECHNIQUES_CONTEXT.thematicTracks.themes.join(', ')}.
- Estrutura: ${TECHNIQUES_CONTEXT.thematicTracks.structure}
- ${TECHNIQUES_CONTEXT.coupleMode.name}: ${TECHNIQUES_CONTEXT.coupleMode.description}
- Recursos centrais: ${TECHNIQUES_CONTEXT.coupleMode.coreFeatures.join(', ')}.
- ${TECHNIQUES_CONTEXT.familyMode.name}: ${TECHNIQUES_CONTEXT.familyMode.description}
- Recursos centrais: ${TECHNIQUES_CONTEXT.familyMode.coreFeatures.join(', ')}.
- ${TECHNIQUES_CONTEXT.toxicThoughts.name}: ${TECHNIQUES_CONTEXT.toxicThoughts.description}
- Categorias: ${TECHNIQUES_CONTEXT.toxicThoughts.categories.join(', ')}.
- Recursos centrais: ${TECHNIQUES_CONTEXT.toxicThoughts.coreFeatures.join(', ')}.
- ${TECHNIQUES_CONTEXT.emotionalDictionary.name}: ${TECHNIQUES_CONTEXT.emotionalDictionary.description}
- Famílias: ${TECHNIQUES_CONTEXT.emotionalDictionary.families.join(', ')}. Categorias: ${TECHNIQUES_CONTEXT.emotionalDictionary.categories.join(', ')}.
- ${TECHNIQUES_CONTEXT.emotionalMindMap.name}: ${TECHNIQUES_CONTEXT.emotionalMindMap.description}
- Recursos centrais: ${TECHNIQUES_CONTEXT.emotionalMindMap.coreFeatures.join(', ')}.
- ${TECHNIQUES_CONTEXT.lifeWheel.name}: ${TECHNIQUES_CONTEXT.lifeWheel.description}
- Áreas: ${TECHNIQUES_CONTEXT.lifeWheel.areas.join(', ')}.
- Recursos centrais: ${TECHNIQUES_CONTEXT.lifeWheel.coreFeatures.join(', ')}.

8. CONCEITOS E ASSERTIVIDADE:
- TCC: ${TECHNIQUES_CONTEXT.concepts.tcc}
- Distorções Comuns: ${TECHNIQUES_CONTEXT.concepts.distortions.join(', ')}
- Assertividade: Técnica "${TECHNIQUES_CONTEXT.concepts.assertiveness.technique}". ${TECHNIQUES_CONTEXT.concepts.assertiveness.description} Direitos: ${TECHNIQUES_CONTEXT.concepts.assertiveness.rights}
- Janela de Tolerância: ${TECHNIQUES_CONTEXT.concepts.window_of_tolerance}
- Autocompaixão: ${TECHNIQUES_CONTEXT.concepts.self_compassion}

9. CATÁLOGO OFICIAL DE RECURSOS DO APP:
${TECHNIQUES_CONTEXT.appResources.map(item => `- ${item.title} (${item.tab}): ${item.desc}`).join('\n')}

REGRA FUNDAMENTAL: Você SÓ conversa sobre saúde mental, psicologia e bem-estar. Se o usuário fugir do tema, recuse educadamente.

TRAVA DE CONTEÚDO:
- Não responda conteúdos impróprios, sexuais, pornográficos ou fetichistas
- Não responda pedidos de violência, crueldade, ameaça ou incentivo a machucar alguém
- Não responda intolerância racial, religiosa, étnica, de gênero ou qualquer conteúdo discriminatório
- Não entre em debates religiosos, partidários, eleitorais ou políticos
- Se o usuário puxar qualquer um desses temas, recuse com calma e redirecione para saúde mental, bem-estar, autocuidado ou regulação emocional

TRAVA DE TERAPIA: Você é apoio emocional, não terapeuta clínico. Acolha e sugira ferramentas do app.

PERSONALIDADE:
- Calorosa, compreensiva e não julgadora
- Valida sentimentos antes de oferecer soluções
- Linguagem simples, natural e elegante em português brasileiro
- Escreve somente em português brasileiro
- Usa emojis raramente e só quando ajudarem o tom
- Transmite calma e serenidade
- Personaliza respostas com base nos dados do usuário quando disponíveis

REGRAS:
- Respostas BREVES (2-4 frases, raramente 5)
- Valide o sentimento antes de sugerir qualquer passo
- Em crises ou ideação suicida, indique CVV (188) ou profissional
- NUNCA faça diagnósticos médicos
- NÃO responda sobre assuntos fora de saúde mental
- USE os dados do usuário para personalizar respostas (ex: se ele meditou hoje, reconheça; se o humor está baixo, seja mais acolhedora)
- Quando mencionar dados do usuário, seja natural e sutil, sem soar robótica
- Evite abrir toda resposta com a mesma estrutura ("entendo", "sinto muito", "obrigada por compartilhar")
- Ao explicar uma técnica, ferramenta ou método do app, use APENAS o contexto técnico listado acima e os dados do usuário
- Ao explicar um recurso do app, use APENAS o catálogo oficial e o contexto técnico acima
- Se faltar base no contexto técnico para responder com segurança, diga que prefere não detalhar além do que o app oferece
- Não invente etapas, finalidades, benefícios, regras ou funcionamentos de um recurso
- Não repita a mesma ferramenta em respostas consecutivas se houver outra opção coerente
- Ao sugerir uma atividade, diga por que ela combina com o momento em uma frase curta
- Prefira nomear recursos reais do app com clareza: Respiração, Aterramento 5-4-3-2-1, A.C.A.L.M.E.-S.E., Meditações, Yoga Nidra, Diário, Solta Aqui, Gratidão, Timer, Sleep, Micro-tarefas, Hábitos, Missões, Psicoeducação, Inteligência Emocional, Regulação, 5 Dedos, Modo Arte, Ho'oponopono, Assertividade
- Use bem estes recursos quando fizer sentido:
  - Mensagem do Eu Saudável: para lembrar frases âncora, autocompaixão, realidade com gentileza, esperança e limite saudável
  - Intervenção Preventiva: para momentos em que o histórico recente sugere intensificação emocional e vale priorizar ações curtas e concretas
- Se não houver uma atividade claramente útil, converse de forma breve antes de sugerir algo
- Só sugira uma atividade quando isso realmente ajudar ou quando o usuário pedir uma prática
- Não transforme toda resposta em prescrição de atividade
- Quando quiser acionar um botão no app, adicione APENAS na última linha este formato oculto:
  [[ACTIVITY:tab_id|Título curto do botão]]
- Use esse marcador só se houver uma atividade correta e real do app
- Tabs válidas para o marcador: breathing, meditation, mood, calm, acalmese, diary, yoga, solta, gratitude, timer, mixer, assertiveness, sleep, hooponopono, habits, microtasks, missions, artemotion, regulation, healthymessages, emocional, psychoedu, fivefingers, timecapsule, vocacional

EXEMPLOS DE TOM E DIREÇÃO:
- Ansiedade: "Seu corpo parece bem em alerta agora. Aterramento 5-4-3-2-1 pode ajudar a te trazer de volta para o presente, e depois uma Respiração calmante pode baixar o ritmo sem te exigir muito."
- Tristeza: "Hoje parece estar mais pesado por dentro. Talvez o Solta Aqui ou o Diário sejam um bom começo para tirar isso do peito, e depois uma meditação mais suave pode te acompanhar."
- Culpa: "Quando a culpa domina, a mente costuma apertar demais. Ho'oponopono ou uma prática de autocompaixão podem combinar melhor com este momento do que forçar produtividade."
- Sobrecarga: "Tem cara de excesso, não de falta de esforço. Talvez uma Micro-tarefa simples ou um Timer curto te ajudem a recuperar clareza sem aumentar a pressão."
- Sono: "Seu sistema parece pedindo desaceleração. Sleep, Yoga Nidra ou uma meditação para encerrar o dia fazem mais sentido aqui do que uma prática mais ativa."
- Desabafo: "Você não precisa organizar tudo antes de falar. Solta Aqui pode ser a melhor porta de entrada agora, e o Diário pode entrar depois se você quiser entender melhor o que ficou."`;

const ASSERTIVENESS_PROMPT = `Você é a Sereno, mas agora está em MODO DE TREINAMENTO DE ASSERTIVIDADE (O Poder do NÃO).
Seu objetivo é ajudar o usuário a praticar a habilidade de dizer NÃO e impor limites sem sentir culpa.

DINÂMICA DO TREINAMENTO:
1. Você vai simular 10 situações cotidianas desafiadoras onde as pessoas costumam ter dificuldade de dizer não (ex: chefe pedindo hora extra abusiva, amigo pedindo dinheiro emprestado, familiar invadindo privacidade, vendedor insistente, etc.). Escolha aleatoriamente para não repetir.
2. Faça UM pedido ou exigência por vez como se fosse a pessoa daquele cenário.
3. O usuário deve responder tentando dizer NÃO ou impondo um limite.
4. Você deve AVALIAR a resposta do usuário logo em seguida:
   - Se ele foi assertivo, direto e não cedeu: Dê PARABÉNS! Explique brevemente por que foi uma boa resposta e passe para a PRÓXIMA situação.
   - Se ele cedeu, deu desculpas demais, ou foi agressivo: Dê um PONTO DE ALERTA educado. Explique o que poderia melhorar (ex: "Você se justificou demais", "Você acabou cedendo") e dê um exemplo de como seria uma resposta assertiva ideal. Depois, passe para a PRÓXIMA situação.
5. Quando chegar na 10ª situação, encerre o treinamento com um feedback geral encorajador.

REGRAS DO SEU COMPORTAMENTO:
- Seja convincente no papel de quem faz o pedido, mas NÃO seja excessivamente abusivo ou gatilho.
- Suas avaliações devem ser sempre como a "Sereno" (sua persona de psicóloga/treinadora), acolhedoras mas firmes no aprendizado.
- SEMPRE inicie a resposta avaliando a fala anterior do usuário, depois proponha o próximo cenário.
- A primeira mensagem (se não houver histórico) deve ser você se apresentando como treinadora e logo em seguida lançando a SITUAÇÃO 1.
- Mantenha respostas curtas e diretas.`;

const SUGGESTION_PROMPT = `Você é a Sereno. Seu objetivo AGORA é sugerir UMA OU DUAS ferramentas do app com alto encaixe para o momento atual do usuário.
NÃO abra conversa longa. NÃO faça investigação clínica. Faça:
1. uma validação breve e natural;
2. uma sugestão principal muito bem encaixada;
3. opcionalmente uma segunda sugestão complementar.

REGRAS DE QUALIDADE:
- Resposta curta: 2 ou 3 frases
- Tom premium, calmo e natural
- Evite clichês repetitivos
- Evite empilhar muitas opções
- Diga por que aquela atividade faz sentido agora
- Priorize recursos reais do app
- Não recomende sempre Respiração ou Meditação se houver opção mais específica

EXEMPLO DE DIREÇÃO:
"Sua mente parece acelerada agora. A técnica Aterramento 5-4-3-2-1 pode ajudar a trazer o corpo de volta para o presente, e depois o Diário pode te ajudar a organizar o que sobrou por dentro."

Ferramentas disponíveis: Respiração, Aterramento 5-4-3-2-1, A.C.A.L.M.E.-S.E., Meditações, Yoga Nidra, Timer, Sleep, Diário, Solta Aqui, Gratidão, Micro-tarefas, Hábitos, Missões, Ho'oponopono, Assertividade, Psicoeducação, Inteligência Emocional, Regulação, 5 Dedos, Modo Arte, Cápsula do Tempo, Exploração Vocacional.`;

function buildUserContextPrompt(rawContext: Record<string, unknown> | undefined): string {
  if (!rawContext) return '';
  const userContext = (rawContext.userContext as Record<string, unknown> | undefined) || rawContext;
  const parts: string[] = ['\n\nDADOS DO USUÁRIO (use para personalizar suas respostas):'];

  if (userContext.userName) parts.push(`Nome: ${userContext.userName}`);

  if (userContext.todayMood) {
    const m = userContext.todayMood as Record<string, unknown>;
    parts.push(`Humor de hoje: emoção principal ${m.primaryEmotion || m.mood}, intensidade ${m.intensity || m.anxiety || 0}/5.`);
  }

  if (userContext.recentMoods && Array.isArray(userContext.recentMoods) && userContext.recentMoods.length > 0) {
    parts.push(`Humor recente (últimos dias): ${userContext.recentMoods.map((m: Record<string, unknown>) => `${m.date}: emoção principal ${m.primaryEmotion || m.mood}`).join(', ')}`);
  }

  const progress = userContext.progress as Record<string, number> | undefined;
  if (progress) {
    parts.push(`Progresso: ${progress.meditationsCompleted || 0} meditações, ${progress.breathingCompleted || 0} respirações, ${progress.yogaCompleted || 0} yoga nidra completados, streak geral ${progress.streak || 0} dias, ${progress.totalMinutes || 0} minutos totais.`);
  }

  if (userContext.recentDiary && Array.isArray(userContext.recentDiary) && userContext.recentDiary.length > 0) {
    parts.push(`Últimos registros do diário: ${userContext.recentDiary.map((d: Record<string, unknown>) => `${d.emotion} (intensidade ${d.level}/10) - "${String(d.situation).substring(0, 50)}"`).join('; ')}`);
  }

  if (userContext.recentThoughts && Array.isArray(userContext.recentThoughts) && userContext.recentThoughts.length > 0) {
    parts.push(`Últimos pensamentos registrados: ${userContext.recentThoughts.map((t: Record<string, unknown>) => `"${String(t.automaticThought).substring(0, 50)}" → alternativa: "${String(t.alternativeThought).substring(0, 50)}"`).join('; ')}`);
  }

  if (userContext.recentGratitude && Array.isArray(userContext.recentGratitude) && userContext.recentGratitude.length > 0) {
    parts.push(`Gratidões recentes: ${(userContext.recentGratitude as Record<string, string[]>[]).map(g => g.items?.join(', ')).join('; ')}`);
  }

  if (userContext.recentSolta && Array.isArray(userContext.recentSolta) && userContext.recentSolta.length > 0) {
    parts.push(`Desabafos recentes: ${userContext.recentSolta.map((s: Record<string, unknown>) => `"${String(s.text).substring(0, 60)}"`).join('; ')}`);
  }

  if (userContext.habits && typeof userContext.habits === 'object') {
    const h = userContext.habits as any;
    const reqs = h.reqs || [];
    const history = h.history || {};
    const today = new Date().toLocaleDateString('en-CA');
    const completedToday = history[today] || [];
    parts.push(`Hábitos ativos: ${reqs.map((r: any) => r.title).join(', ')}.`);
    parts.push(`Hábitos concluídos hoje: ${reqs.filter((r: any) => completedToday.includes(r.id)).map((r: any) => r.title).join(', ') || 'Nenhum ainda'}.`);
    parts.push(`Streak de hábitos: ${h.streak || 0} dias.`);
  }

  if (userContext.safetyPlan && typeof userContext.safetyPlan === 'object') {
    const s = userContext.safetyPlan as any;
    if (s.warningSignals?.length > 0) parts.push(`Sinais de alerta: ${s.warningSignals.join(', ')}`);
    if (s.copingStrategies?.length > 0) parts.push(`Estratégias de enfrentamento: ${s.copingStrategies.join(', ')}`);
    if (s.reasonsToLive?.length > 0) parts.push(`Razões para viver: ${s.reasonsToLive.join(', ')}`);
  }

  if (userContext.healthySelfMessages && Array.isArray(userContext.healthySelfMessages) && userContext.healthySelfMessages.length > 0) {
    parts.push(`Afirmações do Eu Saudável: ${userContext.healthySelfMessages.map((m: any) => `"${m.text}"`).slice(-3).join('; ')}`);
  }

  if (userContext.preventiveIntervention && typeof userContext.preventiveIntervention === 'object') {
    const p = userContext.preventiveIntervention as any;
    parts.push(`Intervenção preventiva ativa: intensidade média recente ${p.avgIntensity}, emoções difíceis em ${p.negativeEmotions} registros recentes.`);
    if (Array.isArray(p.suggestedActions) && p.suggestedActions.length > 0) {
      parts.push(`Ações preventivas sugeridas no app: ${p.suggestedActions.join(', ')}.`);
    }
  }

  if (userContext.regulationProfile && typeof userContext.regulationProfile === 'object') {
    const r = userContext.regulationProfile as any;
    if (r.visual || r.auditivo || r.cinestesico) {
      parts.push(`Perfil de Regulação: Visual ${r.visual}, Auditivo ${r.auditivo}, Cinestésico ${r.cinestesico}.`);
    }
  }

  if (userContext.appIntent) {
    parts.push(`Intenção do chat: ${String(userContext.appIntent)}`);
  }

  return parts.join('\n');
}

async function callOpenRouter(messages: { role: string; content: string }[], model: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'Sereno - Saúde Mental',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`OpenRouter error status: ${response.status}`, errorBody);
    throw new Error(`OpenRouter error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  if (data.error) {
    console.error('OpenRouter JSON error:', data.error);
    throw new Error(`OpenRouter API error: ${JSON.stringify(data.error)}`);
  }
  return data.choices?.[0]?.message?.content;
}

// Fallback local responses for when API is down
const fallbackResponses: Record<string, string[]> = {
  ansiedade: [
    'Eu entendo como a ansiedade pode ser difícil. 💙 Tente o exercício de respiração 4-7-8 na aba Respiração, ou a técnica A.C.A.L.M.E.-S.E. para lidar com crises.',
    'A ansiedade é intensa, mas você pode agir. 💙 Experimente a técnica de Aterramento 5-4-3-2-1: nomeie 5 coisas que vê, 4 que toca, 3 que ouve, 2 cheiros e 1 sabor.',
  ],
  triste: [
    'Sinto muito que esteja assim. 💙 Está tudo bem sentir tristeza. Quer me contar mais? Ou tente registrar no Diário de Emoções, pode ajudar a processar.',
  ],
  posicionar: [
    'Posicionar-se sem culpa exige prática. 💙 Lembre-se que dizer "não" para os outros muitas vezes é dizer "sim" para você. Quer praticar isso na nossa aba "O Poder do NÃO"?',
  ],
  culpa: [
    'É muito comum sentir culpa ao estabelecer limites. 💙 Tente começar pequeno: "Não posso agora, mas te ajudo depois". Temos um treinamento sobre isso na aba "O Poder do NÃO", que tal conferir?',
  ],
  default: [
    'Estou com uma instabilidade técnica agora, mas continuo com você. Se quiser, comece pelo Diário ou por uma respiração curta para organizar este momento.',
    'Tive uma falha rápida por aqui. Enquanto isso, Aterramento 5-4-3-2-1, Diário ou Solta Aqui são boas opções para não perder o fio do que você está sentindo.',
  ],
};

function getLocalFallback(message: string, mode?: string): string {
  if (mode === 'suggestion') {
    return 'Estou com uma instabilidade técnica no momento ✨ Que tal você tentar um exercício de Respiração ou ouvir nossos Sons Ambientes enquanto eu me recupero?';
  }

  const lower = message.toLowerCase();
  for (const [key, responses] of Object.entries(fallbackResponses)) {
    if (key !== 'default' && lower.includes(key)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  return fallbackResponses.default[Math.floor(Math.random() * fallbackResponses.default.length)];
}

function isBlockedTopic(message: string): boolean {
  const normalized = message.toLowerCase();
  const blockedPatterns = [
    'porn', 'porno', 'pornografia', 'sexo explícito', 'sexo explicito', 'nude', 'nudes', 'fetiche',
    'gore', 'matar', 'matar alguém', 'matar alguem', 'agredir', 'espancar', 'violência', 'violencia', 'arma',
    'racista', 'racismo', 'naz', 'hitler', 'supremac', 'intolerância religiosa', 'intolerancia religiosa',
    'odeio negros', 'odeio judeus', 'odeio crentes', 'odeio gays',
    'eleição', 'eleicao', 'presidente', 'partido', 'esquerda', 'direita', 'lula', 'bolsonaro', 'política', 'politica',
    'religião', 'religiao', 'igreja certa', 'qual religião', 'qual religiao',
  ];

  return blockedPatterns.some((pattern) => normalized.includes(pattern));
}

function extractActivitySuggestion(responseText: string | null | undefined) {
  if (!responseText) return { cleanResponse: '', activity: null as null | { tab: string; label: string } };
  const matches = [...responseText.matchAll(/\[\[ACTIVITY:([^|\]]+)\|([^\]]+)\]\]/g)];
  const cleanResponse = responseText.replace(/\[\[ACTIVITY:[^\]]+\]\]/g, '').trim();
  if (!matches.length) return { cleanResponse, activity: null };

  const validMatch = [...matches].reverse().find((match) => {
    const tab = match[1]?.trim();
    return (
      ALLOWED_ACTIVITY_TABS.includes(tab as (typeof ALLOWED_ACTIVITY_TABS)[number]) &&
      OFFICIAL_APP_RESOURCE_MAP.has(tab)
    );
  });

  if (!validMatch) {
    return { cleanResponse, activity: null };
  }

  const tab = validMatch[1].trim();
  const label = validMatch[2].trim();

  return {
    cleanResponse,
    activity: {
      tab,
      label: label || 'Abrir atividade',
    },
  };
}

function buildActivityFallbackResponse(activity: { tab: string; label: string } | null) {
  if (!activity) return '';
  const officialResource = OFFICIAL_APP_RESOURCE_MAP.get(activity.tab);
  if (!officialResource) return '';
  return `Claro. Toque no botão abaixo para abrir ${officialResource.title}.`;
}

function normalizeInternalTermsToPtBr(responseText: string) {
  return responseText
    .replace(/\bmeditation\b/gi, 'meditação')
    .replace(/\bgratitude\b/gi, 'gratidão')
    .replace(/\bbreathing\b/gi, 'respiração')
    .replace(/\bdiary\b/gi, 'diário')
    .replace(/\btimer\b/gi, 'timer')
    .replace(/\bmixer\b/gi, 'mixer sonoro')
    .replace(/\bhealthymessages\b/gi, 'mensagem do Eu Saudável')
    .replace(/\bpsychoedu\b/gi, 'psicoeducação')
    .replace(/\bregulation\b/gi, 'regulação')
    .replace(/\bhabits\b/gi, 'hábitos')
    .replace(/\bmicrotasks\b/gi, 'microtarefas')
    .replace(/\bmissions\b/gi, 'missões')
    .replace(/\btimecapsule\b/gi, 'cápsula do tempo')
    .replace(/\bvocacional\b/gi, 'exploração vocacional')
    .replace(/\bfivefingers\b/gi, 'método dos 5 dedos')
    .replace(/\bhooponopono\b/gi, "Ho'oponopono");
}

function sanitizeAssistantResponse(responseText: string) {
  const cleaned = responseText
    .replace(/^\s*ou\s*$/gim, '')
    .replace(/^\s*ou\s+\[\[ACTIVITY:[^\]]+\]\]\s*$/gim, '')
    .replace(/^\s*\[\[ACTIVITY:[^\]]+\]\]\s*ou\s*$/gim, '')
    .replace(/^\s*\[\[ACTIVITY:[^\]]+\]\]\s*$/gim, '')
    .replace(/\[\[ACTIVITY:[^\]]+\]\]/g, '')
    .replace(/\s+\?/g, '?')
    .replace(/\s+\!/g, '!')
    .replace(/\s+\./g, '.')
    .replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .replace(/\n\s*\n\s*ou\s*\n\s*\n/gi, '\n\n')
    .replace(/\n\s*ou\s*\n/gi, '\n');
  return normalizeInternalTermsToPtBr(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, userContext, appContext, mode } = body;
    const resolvedUserContext = userContext || appContext;

    // Input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ response: 'Mensagem inválida.' }, { status: 400 });
    }
    if (message.trim().length === 0) {
      return NextResponse.json({ response: 'Mensagem vazia.' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ response: 'Mensagem muito longa. Por favor, seja mais breve.' }, { status: 400 });
    }
    if (isBlockedTopic(message)) {
      return NextResponse.json({
        response: 'Eu fico no campo de saúde mental, bem-estar e autocuidado. Se você quiser, posso te ajudar a organizar o que está sentindo agora e sugerir uma prática do app que combine com este momento.',
        activity: null,
      });
    }
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY não configurada');
      return NextResponse.json({ response: getLocalFallback(message, mode), activity: null });
    }

    let systemPrompt = '';
    if (mode === 'assertiveness') {
      systemPrompt = ASSERTIVENESS_PROMPT;
    } else if (mode === 'suggestion') {
      systemPrompt = SUGGESTION_PROMPT + buildUserContextPrompt(resolvedUserContext);
    } else {
      systemPrompt = SYSTEM_PROMPT + buildUserContextPrompt(resolvedUserContext);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10),
      { role: 'user', content: message },
    ];

    let responseText: string | null = null;
    let lastError: any = null;

    // Try primary model
    try {
      console.log(`Calling OpenRouter with model: ${PRIMARY_MODEL}`);
      responseText = await callOpenRouter(messages, PRIMARY_MODEL);
    } catch (e: any) {
      console.error('Primary model failed:', e);
      lastError = e;
      // Try fallback model
      try {
        console.log(`Calling OpenRouter with fallback model: ${FALLBACK_MODEL}`);
        responseText = await callOpenRouter(messages, FALLBACK_MODEL);
      } catch (e2: any) {
        console.error('Fallback model also failed:', e2);
        lastError = e2;
        // Try dynamic free model
        try {
            console.log(`Calling OpenRouter with dynamic model: ${DYNAMIC_FREE_MODEL}`);
            responseText = await callOpenRouter(messages, DYNAMIC_FREE_MODEL);
        } catch (e3: any) {
            console.error('Dynamic model also failed:', e3);
            lastError = e3;
        }
      }
    }

    // If both models failed, use local fallback
    if (!responseText) {
      responseText = getLocalFallback(message, mode);
    }

    const { cleanResponse, activity } = extractActivitySuggestion(responseText);
    const normalizedResponse = sanitizeAssistantResponse(cleanResponse);
    const safeResponse = normalizedResponse || buildActivityFallbackResponse(activity) || getLocalFallback(message, mode);

    return NextResponse.json({ response: safeResponse, activity });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({
      response: `Desculpe, tive um problema técnico. 💙 (Erro: ${error.message || 'Desconhecido'}). Tente novamente em alguns instantes.`,
      activity: null,
    });
  }
}
