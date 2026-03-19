export const TECHNIQUES_CONTEXT = {
  breathing: [
    { id: '1', name: 'Respiração de Relaxamento', pattern: '4-2-4', description: 'Inspirar por 4 segundos, segurar por 2 e expirar por 4. Ideal para baixar o batimento cardíaco.' },
    { id: '2', name: 'Respiração de Fole (Bhastrika)', description: 'Respiração vigorosa para aumentar energia e foco.' },
    { id: '3', name: 'Respiração Quadrada', pattern: '4-4-4-4', description: 'Inspirar, segurar, expirar e segurar vazio, tudo em 4 segundos cada. Ótima para equilíbrio imediato.' },
    { id: '4', name: 'Respiração 4-7-8', description: 'Inspirar por 4, segurar por 7 e expirar por 8. Técnica potente para insônia e relaxamento profundo.' },
    { id: '5', name: 'Respiração Calmante', pattern: '4-0-6', description: 'Inspirar por 4 e expirar por 6. Foca no prolongamento da expiração para ativar o sistema nervoso parassimpático.' },
    { id: '6', name: 'Respiração Consciente', description: 'Simples observação do fluxo natural do ar sem tentar mudá-lo.' },
    { id: '7', name: 'Respiração da Natureza (Ujjayi)', description: 'Respiração vitoriosa ou sussurrada, com leve contração na glote.' },
    { id: '8', name: 'Respiração 3-3-3 Anti-Ansiedade', description: 'Inspirar por 3, segurar por 3 e expirar por 3. Usada em casos de SOS ansiedade.' },
    { id: '9', name: 'Respiração Progressiva', description: 'Aumentar gradualmente a profundidade da respiração a cada ciclo.' }
  ],
  sos: {
    'acalmese': {
      name: 'A.C.A.L.M.E.-S.E.',
      steps: [
        { letter: 'A', title: 'ACEITE sua ansiedade', description: 'Não lute contra ela. Substitua medo por aceitação.' },
        { letter: 'C', title: 'CONTEMPLE as coisas ao redor', description: 'Observe o mundo externo em vez de focar apenas no interno.' },
        { letter: 'A', title: 'AJA com sua ansiedade', description: 'Continue suas atividades, mesmo em ritmo lento, sem fugir.' },
        { letter: 'L', title: 'LIBERE o ar dos pulmões', description: 'Respire devagar: inspire em 3 e expire em 6.' },
        { letter: 'M', title: 'MANTENHA os passos anteriores', description: 'Repita os passos até que a ansiedade diminua.' },
        { letter: 'E', title: 'EXAMINE seus pensamentos', description: 'Questione se seus medos têm base em fatos reais.' },
        { letter: 'S', title: 'SORRIA, você conseguiu', description: 'Reconheça sua vitória por enfrentar e gerenciar sua crise.' },
        { letter: 'E', title: 'ESPERE o futuro com aceitação', description: 'Aceite que a ansiedade é natural e agora você sabe o caminho.' }
      ]
    },
    'grounding': {
      name: 'Aterramento 5-4-3-2-1',
      description: 'Técnica sensorial para trazer a mente de volta ao presente.',
      steps: [
        { count: 5, sense: 'Visão', instruction: 'Note 5 coisas que você pode ver agora.' },
        { count: 4, sense: 'Tato', instruction: 'Note 4 coisas que você pode tocar/sentir (texturas).' },
        { count: 3, sense: 'Audição', instruction: 'Note 3 sons que você pode ouvir ao fundo.' },
        { count: 2, sense: 'Olfato', instruction: 'Note 2 cheiros no ambiente.' },
        { count: 1, sense: 'Paladar', instruction: 'Note 1 sabor que você possa sentir agora.' }
      ]
    }
  },
  meditation: {
    categories: [
      { name: 'Presença e Atenção', meditations: ['Mindfulness', 'Respiração Consciente', 'Silêncio Mental', 'Caminhando', 'Observando Sons'] },
      { name: 'Relaxamento e Sono', meditations: ['Para Dormir', 'Para Encerrar o Dia', 'Relaxamento Profundo', 'Yoga Nidra'] },
      { name: 'Emocionais e Cura', meditations: ['Autocompaixão', 'Amor-Bondade (Metta)', 'Perdão', 'Soltar Pensamentos Negativos', 'Aceitação', 'Tristeza', 'Luto'] },
      { name: 'Autoestima', meditations: ['Confiança e Autoestima', 'Cura Interior', 'Manifestar Objetivos'] }
    ],
    yogaNidra: {
      name: 'Yoga Nidra',
      description: 'Sono psíquico que proporciona relaxamento profundo mantendo a consciência desperta.',
      stages: ['Preparação', 'Resolução (Sankalpa)', 'Rotação da Consciência', 'Consciência da Respiração', 'Sensações Opostas', 'Visualizações', 'Finalização']
    }
  },
  hooponopono: {
    description: 'Prática havaiana de reconciliação e perdão usando as frases: Sinto muito, Me perdoe, Eu te amo, Sou grato.',
    varieties: [
      { name: 'SerenaMente', focus: 'Reconexão espiritual' },
      { name: 'GentilMente', focus: 'Acolhimento emocional' },
      { name: 'PlenaMente', focus: 'Reconciliação interior' },
      { name: 'AutoPerdão', focus: 'Culpa e perdão a si mesmo' },
      { name: 'Soltar e Liberar', focus: 'Desapego emocional' },
      { name: 'Relacionamentos', focus: 'Cura de vínculos' }
    ]
  },
  fiveFingers: {
    name: 'Método dos 5 Dedos',
    description: 'Estrutura para preparar conversas difíceis com mais clareza, consciência emocional e pedido concreto.',
    steps: [
      { finger: 'Polegar', role: 'Reconhecimento sem ironia', focus: 'Reconhecer algo em si e algo no outro antes de acusar.' },
      { finger: 'Indicador', role: 'Fato sem acusação', focus: 'Descrever o que aconteceu de forma objetiva, sem exagero nem ataque.' },
      { finger: 'Médio', role: 'Sentimento sem ataque', focus: 'Nomear como aquilo impactou emocionalmente.' },
      { finger: 'Anelar', role: 'Necessidade ou valor', focus: 'Identificar o que foi tocado em si: respeito, clareza, segurança, escuta, limite.' },
      { finger: 'Mindinho', role: 'Pedido concreto', focus: 'Transformar a experiência em um pedido pequeno, claro e realista.' }
    ],
    uses: [
      'Conflito em andamento',
      'Conversa difícil',
      'Mal-entendido',
      'Preparo antes de falar com alguém',
      'Discussão de casal',
      'Conflito familiar'
    ]
  },
  psychoeducation: {
    name: 'Psicoeducação',
    description: 'Área de aprendizado rápido sobre saúde mental com cards, quizzes e exercícios curtos.',
    themes: ['Ansiedade', 'Relacionamentos', 'Autocuidado', 'Crise', 'Cognitivo'],
    modes: ['cards', 'quiz', 'game', 'memory', 'link', 'drag', 'sequence', 'reflex'],
    examples: ['O que é ansiedade?', 'Mindfulness', 'Grounding 5-4-3-2-1', 'Distorções cognitivas', 'Burnout', 'Autocompaixão'],
  },
  regulationProfile: {
    name: 'Perfil de Regulação',
    description: 'Teste para descobrir por qual canal a pessoa tende a se regular melhor.',
    axes: ['Visual', 'Auditivo', 'Cinestésico'],
    outcomes: {
      visual: 'Tende a responder melhor a mapas mentais, organização visual, imagens e estrutura.',
      auditivo: 'Tende a responder melhor a áudios guiados, sons ambientes, voz calma e música.',
      cinestesico: 'Tende a responder melhor a respiração, grounding, movimento e percepção corporal.',
    },
    suggestedResources: {
      visual: ['mindmap', 'artemotion', 'psychoedu'],
      auditivo: ['breathing', 'meditation', 'mixer'],
      cinestesico: ['sos', 'breathing', 'microtasks'],
    },
  },
  emotionalIntelligence: {
    name: 'Inteligência Emocional',
    description: 'Área com testes inspirados em Goleman e Gardner, histórico e plano prático de desenvolvimento.',
    modes: ['Goleman', 'Gardner', 'Múltiplas'],
    golemanPillars: ['Autoconhecimento', 'Autocontrole', 'Automotivação', 'Empatia', 'Habilidades Sociais'],
    gardnerFocus: ['Intrapessoal', 'Interpessoal'],
    multipleAxes: ['Musical', 'Corporal-cinestésica', 'Linguística', 'Lógico-matemática', 'Espacial', 'Interpessoal', 'Intrapessoal', 'Naturalista'],
    planPurpose: 'Transformar resultado em ações pequenas e práticas ao longo dos dias.',
  },
  healthySelfMessages: {
    name: 'Mensagem do Eu Saudável',
    description: 'Espaço para escrever, guardar e revisitar frases-âncora pessoais.',
    kinds: ['Acolhimento', 'Força', 'Realidade', 'Esperança', 'Limite saudável'],
    actions: ['Salvar mensagem', 'Favoritar', 'Fixar como âncora', 'Mostrar outra', 'Copiar', 'Enviar para o Mural de Esperança'],
    purpose: 'Oferecer frases de regulação e perspectiva para dias difíceis.',
  },
  preventiveIntervention: {
    name: 'Intervenção Preventiva',
    description: 'Aviso baseado no histórico recente de humor quando há sinais de intensificação emocional.',
    trigger: 'Média alta de intensidade recente com repetição de emoções difíceis.',
    suggestions: ['Respiração 4-7-8', 'Grounding 5-4-3-2-1', 'Contato com alguém de confiança', 'Música calmante'],
  },
  thematicTracks: {
    name: 'Trilhas Temáticas',
    description: 'Percursos guiados por tema, com passos curtos, objetivo, explicação, exemplo e próximo recurso para abrir.',
    themes: ['Ansiedade', 'Burnout', 'Baixa Autoestima', 'Luto e Perdas', 'Separação Afetiva', 'Crise de Pânico', 'Insônia e Mente Acelerada', 'Procrastinação Ansiosa', 'Dependência Emocional', 'Ansiedade Social'],
    structure: 'Cada trilha organiza etapas práticas com tarefa, tempo estimado, fechamento e CTA para outro recurso do app.',
    purpose: 'Transformar um tema emocional complexo em sequência de passos pequenos e executáveis.',
  },
  coupleMode: {
    name: 'Modo Casal',
    description: 'Espaço compartilhado para check-ins emocionais, pedidos de apoio, mensagens e combinados no vínculo.',
    coreFeatures: ['Sala com código de convite', 'Check-in com humor e nota', 'Pedido do que precisa', 'Oferta do que pode oferecer', 'Marcação de tema sensível', 'Escolha de falar agora ou depois', 'Mensagens entre o casal', 'Guia de apoio e próximo passo sugerido'],
    purpose: 'Reduzir leitura mental e aumentar clareza, validação e combinados concretos no relacionamento.',
  },
  familyMode: {
    name: 'Modo Família',
    description: 'Espaço de convivência familiar com check-ins, pedidos de apoio, mensagens, respostas e acordos de cuidado.',
    coreFeatures: ['Grupo com código de convite', 'Postagens de emoção, frustração, elogio, pedido e pensamento', 'Reações e respostas', 'Mensagens do grupo', 'Acordos da casa', 'Filtro de postagens de apoio', 'Leitura de cuidado e necessidade de conversa sensível'],
    purpose: 'Ajudar a família a nomear estados emocionais e transformar tensão em comunicação mais regulada.',
  },
  toxicThoughts: {
    name: 'Falas Tóxicas',
    description: 'Biblioteca e treino de reformulação de pensamentos tóxicos e distorções cognitivas.',
    categories: ['Autocrítica', 'Comparação', 'Perfeccionismo', 'Culpa/Vergonha', 'Catastrofização', 'Relacionamentos', 'Trabalho/Estudo'],
    coreFeatures: ['Padrões prontos com reformulação', 'Histórico pessoal', 'Favoritos', 'Treino por rodadas', 'Modo emergência', 'Contextos como família, relacionamento e trabalho', 'Frases assertivas, limites e fala interna por categoria'],
    purpose: 'Trocar leitura automática dura por linguagem mais justa, regulada e praticável.',
  },
  emotionalDictionary: {
    name: 'Dicionário Emocional',
    description: 'Consulta guiada de emoções com definição, sinônimos, emoções parecidas, quando surgem e o que costumam pedir.',
    families: ['Medo', 'Tristeza', 'Raiva', 'Alegria', 'Vergonha', 'Culpa', 'Afeto'],
    categories: ['Agradável', 'Desconfortável', 'Misto'],
    coreFeatures: ['Busca por emoção e sinônimo', 'Favoritos', 'Histórico recente', 'Comparação entre emoções parecidas', 'Resposta saudável sugerida para cada emoção'],
    purpose: 'Aumentar vocabulário emocional e diferenciar estados parecidos para melhorar a autorregulação.',
  },
  emotionalMindMap: {
    name: 'Mapa Mental Emocional',
    description: 'Mapa visual de transições emocionais a partir do histórico de humor.',
    coreFeatures: ['Conexões entre emoções ao longo do tempo', 'Top transições', 'Leitura por período', 'Insight comparativo 7 vs 30 dias', 'Sugestões contextualizadas por emoção', 'Possibilidade de abrir Diário, Solta Aqui ou Carta Terapêutica a partir da leitura'],
    purpose: 'Mostrar padrões emocionais recorrentes e como um estado costuma caminhar para outro.',
  },
  lifeWheel: {
    name: 'Mapa da Minha Vida',
    description: 'Roda da vida adaptada para bem-estar, com notas, cores, histórico e análise do momento atual.',
    areas: ['Saúde emocional', 'Energia', 'Autoestima', 'Relacionamentos', 'Família', 'Vida social', 'Propósito', 'Financeiro', 'Criatividade', 'Espiritualidade', 'Trabalho', 'Lazer'],
    coreFeatures: ['Pontuação por área', 'Notas por área', 'Cores por área', 'Histórico de mapas', 'Leitura de áreas mais frágeis e mais fortes', 'Sugestão de próximo recurso a abrir conforme a área'],
    purpose: 'Dar visão ampla do momento de vida e ajudar a decidir onde concentrar energia primeiro.',
  },
  appResources: [
    { tab: 'mood', title: 'Diário de Humor', desc: 'Acompanhamento emocional completo' },
    { tab: 'stats', title: 'Estatísticas', desc: 'Gráficos e padrões de humor' },
    { tab: 'sos', title: 'SOS Ansiedade', desc: 'Ferramentas de crise' },
    { tab: 'breathing', title: 'Respiração', desc: 'Técnicas relaxantes' },
    { tab: 'meditation', title: 'Meditação', desc: 'Momentos de paz' },
    { tab: 'timer', title: 'Time Livre', desc: 'Meditação sem narração' },
    { tab: 'yoga', title: 'Yoga Nidra', desc: 'Relaxamento profundo' },
    { tab: 'hooponopono', title: "Ho'oponopono", desc: 'Práticas de liberação' },
    { tab: 'lovelanguages', title: 'Linguagens do Amor', desc: 'Descubra sua forma de amar' },
    { tab: 'diary', title: 'Diário (RPD)', desc: 'Registre pensamentos e situações' },
    { tab: 'gratitude', title: 'Gratidão', desc: 'Anote suas gratidões' },
    { tab: 'solta', title: 'Solta Aqui', desc: 'Desabafos e pensamentos' },
    { tab: 'carta', title: 'Carta Terapêutica', desc: 'Escreva e liberte-se' },
    { tab: 'assertiveness', title: 'O Poder do NÃO', desc: 'Aprenda a se posicionar' },
    { tab: 'fivefingers', title: 'Método dos 5 Dedos', desc: 'Comunicação e consciência' },
    { tab: 'habits', title: 'Meus Hábitos', desc: 'Sua jornada diária' },
    { tab: 'vocacional', title: 'Exploração Vocacional', desc: 'Descubra sua carreira ideal' },
    { tab: 'emocional', title: 'Inteligência Emocional', desc: 'Teste Goleman + Gardner' },
    { tab: 'esperanca', title: 'Mural de Esperança', desc: 'Comunidade anônima gentil' },
    { tab: 'chat', title: 'Chat de Apoio', desc: 'Converse com a Sereno' },
    { tab: 'safety', title: 'Plano de Segurança', desc: 'Contatos e estratégias' },
    { tab: 'mixer', title: 'Mixer Sonoro', desc: 'Crie seu ambiente sonoro' },
    { tab: 'badges', title: 'Conquistas (Badges)', desc: 'Veja seu progresso' },
    { tab: 'therapycalendar', title: 'Calendário de Terapia', desc: 'Agende e lembre-se' },
    { tab: 'abordagens', title: 'Abordagens psicológicas', desc: 'Conheça ferramentas de cura' },
    { tab: 'microtasks', title: 'Micro-tarefas', desc: 'Pequenas vitórias diárias' },
    { tab: 'timecapsule', title: 'Cápsula do Tempo', desc: 'Carta ao eu futuro/passado' },
    { tab: 'missions', title: 'Missões & Desafios', desc: 'Desafios de 7/21/30 dias' },
    { tab: 'artemotion', title: 'Modo Arte', desc: 'Expresse emoções sem texto' },
    { tab: 'destravar', title: 'Destravar', desc: 'Quebre ciclos de autossabotagem' },
    { tab: 'regulation', title: 'Perfil de Regulação', desc: 'Visual, auditivo ou cinestésico' },
    { tab: 'mapavida', title: 'Mapa da Minha Vida', desc: 'Roda visual das áreas da vida' },
    { tab: 'mindmap', title: 'Mapa Mental Emocional', desc: 'Conexão entre emoções' },
    { tab: 'healthymessages', title: 'Eu Mais Saudável', desc: 'Mensagens para você mesmo' },
    { tab: 'tracks', title: 'Trilhas Temáticas', desc: 'Luto, burnout, autoestima...' },
    { tab: 'psychoedu', title: 'Psicoeducação', desc: 'Cards rápidos de 1 minuto' },
    { tab: 'toxicthoughts', title: 'Falas Tóxicas', desc: 'Reconhecer e reformular' },
    { tab: 'dictionary', title: 'Dicionário Emocional', desc: 'Vocabulário de emoções' },
    { tab: 'couple', title: 'Modo Casal', desc: 'Check-in compartilhado' },
    { tab: 'family', title: 'Modo Família', desc: 'Acompanhar filhos/adolescentes' },
    { tab: 'share', title: 'Compartilhar Conquista', desc: 'Stories e redes sociais' },
    { tab: 'invite', title: 'Indicar para Amigo', desc: 'Mensagem de apoio pronta' },
    { tab: 'suggestions', title: 'Sugestões', desc: 'Envie suas ideias' }
  ],
  concepts: {
    tcc: 'Terapia Cognitivo-Comportamental: foca na relação entre pensamentos, emoções e comportamentos.',
    distortions: ['Catastrofização', 'Tudo ou Nada', 'Leitura Mental', 'Generalização excessiva'],
    assertiveness: {
      technique: 'Disco Arranhado',
      description: 'Repetir sua posição de forma calma e firme sem se desviar para desculpas ou defesas exageradas.',
      rights: 'Você tem o direito de dizer não sem se sentir culpado.'
    },
    window_of_tolerance: 'A faixa ideal de ativação onde conseguimos processar emoções sem transbordar (hiper-ativação) ou paralisar (hipo-ativação).',
    self_compassion: 'Tratar-se com a mesma gentileza que trataria um amigo querido em sofrimento.'
  }
};
