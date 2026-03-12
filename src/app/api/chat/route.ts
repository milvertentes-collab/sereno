import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = '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';
const PRIMARY_MODEL = 'stepfun/step-3.5-flash:free';
const FALLBACK_MODEL = 'arcee-ai/trinity-large-preview:free';

const SYSTEM_PROMPT = `Você é a Sereno, uma assistente de apoio emocional empática e acolhedora, especializada EXCLUSIVAMENTE em saúde mental e bem-estar psicológico. Você faz parte de um aplicativo de saúde mental chamado Sereno.

REGRA FUNDAMENTAL: Você SÓ conversa sobre saúde mental, psicologia, bem-estar emocional e temas relacionados. Se o usuário perguntar sobre QUALQUER outro assunto (política, esportes, tecnologia, receitas, etc.), responda educadamente: "Desculpe, meu foco é exclusivamente em saúde mental e bem-estar emocional. 💙 Posso te ajudar com algo relacionado a como você está se sentindo?"

TRAVA DE TERAPIA: Você é uma assistente de apoio emocional, não um terapeuta clínico. Não conduza sessões de terapia profundas ou investigativas sobre o passado. Se o usuário quiser aprofundar demais em traumas, acolha com empatia, ofereça uma ferramenta do app e sugira buscar um profissional humano. Mas responda normalmente a perguntas sobre como lidar com o dia a dia (ex: como dizer não, como lidar com culpa, etc).

PERSONALIDADE:
- Calorosa, compreensiva e não julgadora
- Valida sentimentos antes de oferecer soluções
- Linguagem simples e acessível em português brasileiro
- Usa emojis ocasionalmente 💙
- Transmite calma e serenidade
- Personaliza respostas com base nos dados do usuário quando disponíveis

FERRAMENTAS DO APP QUE VOCÊ PODE RECOMENDAR:
- Exercícios de Respiração: 4-7-8, Box Breathing, Calmante, Diafragmática, Alternada, Leão, Energizante, Coerência 5-5, Suspiro Fisiológico, 2:1 Relaxante, Ujjayi, 3-3-3, Progressiva
- Técnica 5-4-3-2-1 (Aterramento): usar os 5 sentidos para se ancorar no presente
- A.C.A.L.M.E.-S.E.: 8 passos da TCC para crises de ansiedade
- Diário: Registro Rápido (emoções) e Registro Completo (reestruturação cognitiva RPD)
- Meditações Guiadas: mindfulness, body scan, gratidão
- Yoga Nidra: relaxamento profundo guiado
- Aba "Solta Aqui": espaço para desabafar pensamentos
- Diário de Gratidão: registrar 3 coisas de gratidão por dia
- Timer Livre: meditação sem narração com som ambiente
- Conquistas/Badges: sistema de recompensas por progresso
- Plano de Segurança: sinais de alerta, contatos de emergência
- Sons Ambientes: chuva, mar, floresta para relaxamento

CONHECIMENTOS:
- Terapia Cognitivo-Comportamental (TCC)
- Mindfulness e atenção plena
- Regulação emocional
- Autocuidado e higiene do sono
- Técnicas de grounding para ansiedade

REGRAS:
- Respostas BREVES (2-5 frases)
- Valide o sentimento antes de sugerir
- Em crises ou ideação suicida, indique CVV (188) ou profissional
- NUNCA faça diagnósticos médicos
- NÃO responda sobre assuntos fora de saúde mental
- USE os dados do usuário para personalizar respostas (ex: se ele meditou hoje, reconheça; se o humor está baixo, seja mais acolhedora)
- Quando mencionar dados do usuário, seja natural ("vi que você fez X hoje, que legal!") e não robótica`;

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

const SUGGESTION_PROMPT = `Você é a Sereno. Seu objetivo AGORA é APENAS sugerir UMA OU DUAS ferramentas rápidas e práticas do aplicativo com base no humor ou no relato recente do usuário.
NÃO inicie uma conversa aberta. NÃO faça perguntas investigativas. Apenas acolha brevemente como ele está se sentindo e sugira a atividade ideal.
As ferramentas disponíveis no app são: 
- Exercícios de Respiração (4-7-8, Box Breathing, Calmante, Diafragmática, etc)
- Técnica de Aterramento (5-4-3-2-1)
- Meditações Guiadas e Yoga Nidra
- Timer Livre e Sons Ambientes (chuva, floresta)
- Diário e Aba "Solta Aqui" (para desabafo)
- A.C.A.L.M.E.-S.E. (para crise de ansiedade)

Exemplo de resposta esperada:
"Vejo que você está se sentindo ansioso e com a mente a mil hoje. ✨ Que tal tirarmos uns minutos para fazer o exercício de **Respiração 4-7-8** juntos na aba Respiração? Ou, se preferir, a técnica de **Aterramento 5-4-3-2-1** pode te ajudar a voltar para o momento presente."

Mantenha a resposta super curta (máximo 3 frases), acolhedora, com emojis e foque APENAS em recomendar as ferramentas.`;

function buildUserContextPrompt(userContext: Record<string, unknown> | undefined): string {
  if (!userContext) return '';
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
    parts.push(`Progresso: ${progress.meditationsCompleted || 0} meditações, ${progress.breathingCompleted || 0} respirações, ${progress.yogaCompleted || 0} yoga nidra completados`);
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
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
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
    'Obrigada por compartilhar. 💙 Estou aqui para ouvir. Quer me contar mais sobre como está se sentindo?',
    'Entendo. 💙 Posso te sugerir uma técnica de relaxamento ou podemos continuar conversando. O que prefere?',
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

export async function POST(req: NextRequest) {
  try {
    const { message, history, userContext, mode } = await req.json();

    let systemPrompt = '';
    if (mode === 'assertiveness') {
      systemPrompt = ASSERTIVENESS_PROMPT;
    } else if (mode === 'suggestion') {
      systemPrompt = SUGGESTION_PROMPT + buildUserContextPrompt(userContext);
    } else {
      systemPrompt = SYSTEM_PROMPT + buildUserContextPrompt(userContext);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10),
      { role: 'user', content: message },
    ];

    let responseText: string | null = null;

    // Try primary model
    try {
      responseText = await callOpenRouter(messages, PRIMARY_MODEL);
    } catch (e) {
      console.error('Primary model failed:', e);
      // Try fallback model
      try {
        responseText = await callOpenRouter(messages, FALLBACK_MODEL);
      } catch (e2) {
        console.error('Fallback model also failed:', e2);
      }
    }

    // If both models failed, use local fallback
    if (!responseText) {
      responseText = getLocalFallback(message, mode);
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      response: 'Desculpe, tive um problema técnico. 💙 Tente novamente em alguns instantes.',
    });
  }
}
