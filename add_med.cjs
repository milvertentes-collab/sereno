const fs = require('fs');
const file = 'c:/Users/Romulo/Downloads/programa psicologia/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const extra = `,
  {
    id: 5,
    title: 'Amor Bondoso',
    emoji: '💞',
    description: '10 min • Compaixão por si e pelos outros',
    text: \`Acomode-se confortavelmente.
Feche os olhos ou repouse o olhar.
Respire profundamente duas vezes.
Inspire... e expire.
Traga a sua atenção para a área do coração.
Sinta a sua respiração fluindo através do coração.
Diga mentalmente para si mesmo:
"Que eu esteja seguro."
"Que eu seja feliz."
"Que eu tenha saúde."
Agora traga à mente pessoas que você conhece apenas de vista.
Deseje a mesma paz a elas:
"Que vocês estejam seguros."
Agora expanda para todas as pessoas, todos os seres.
"Que todos estejam seguros."
Abra os olhos.
Que essa tranquilidade acompanhe o seu dia.\`
  },
  {
    id: 6,
    title: 'Sono Profundo',
    emoji: '😴',
    description: '15 min • Desacelere para dormir bem',
    text: \`Deite-se de forma bem confortável na cama.
Apague as luzes, feche os olhos.
Deixe o corpo pesar contra o colchão.
O dia acabou. Tudo o que precisava ser feito, já foi feito.
Agora é o seu momento de descansar.
Faça uma respiração profunda.
Inspire contando até 4...
Segure por 2 segundos...
E expire relaxando contando até 6.
A luz sobe pelo pescoço, relaxa a mandíbula, os olhos, a testa.
Todo seu corpo agora está coberto por essa energia azul e serena.
Sua mente acompanha esse peso agradável e tranquilo.
Pensamentos vão sumindo aos poucos, como neblina.
Você se entrega a esse aconchego.
Boa noite.\`
  },
  { id: 7, title: 'Respiração consciente', emoji: '🌬️', description: '5 min', text: \`Sente-se confortavelmente.\\nFeche os olhos.\\nInspire lentamente pelo nariz... e expire pela boca.\\nSinta o ar preencher seus pulmões e sair devagar.\\nConcentre-se apenas neste fluir.\\nSua respiração é a sua âncora.\\nPermaneça focado nesse ritmo tranquilo e constante.\\nQuando finalizar, abra os olhos suavemente.\` },
  { id: 8, title: 'Meditação para ansiedade', emoji: '🌊', description: '10 min', text: \`Encontre um lugar silencioso.\\nRespire fundo.\\nSinta os pés tocando o solo, você está seguro.\\nA ansiedade é apenas uma resposta do corpo, ela não te define.\\nVisualize uma luz azul relaxante no peito.\\nA cada expiração, solte o excesso de energia.\\nTudo está bem agora.\\nVocê tem o controle sobre a sua paz.\` },
  { id: 9, title: 'Meditação para dormir', emoji: '🌙', description: '15 min', text: \`Deite-se e apague as luzes.\\nFeche os olhos.\\nO seu dia terminou, e não há mais nada a ser feito agora.\\nSinta o peso do seu corpo sobre a cama.\\nRelaxe os pés... as pernas... os braços... e a mente.\\nDeixe os pensamentos irem embora como folhas em um rio.\\nPermita-se afundar no descanso profundo.\\nBoa noite.\` },
  { id: 10, title: 'Meditação para aliviar estresse', emoji: '🍃', description: '10 min', text: \`Feche os olhos.\\nInspire fundo e segure.\\nSolte todo o ar num longo suspiro.\\nO estresse se acumula nos ombros e no pescoço.\\nDeixe conscientemente que seus ombros caiam.\\nSolte o maxilar.\\nA cada ciclo de respiração, uma camada de peso se dissolve.\\nSinta a leveza tomar espaço no seu corpo.\` },
  { id: 11, title: 'Meditação para autocompaixão', emoji: '🫂', description: '8 min', text: \`Coloque as mãos sobre o coração.\\nSinta o calor e o ritmo dos batimentos.\\nMuitas vezes somos duros demais conosco.\\nNeste momento, perdoe-se por não ser perfeito.\\nVocê está fazendo o seu melhor.\\nDiga a si mesmo: Eu me aceito, eu me respeito, eu me cuido.\\nQue eu tenha paciência com o meu processo.\` },
  { id: 12, title: 'Meditação de amor-bondade (metta)', emoji: '💞', description: '10 min', text: \`Respire com calma.\\nImagine uma flor de luz abrindo no seu peito.\\nEnvie mentalmente a seguinte mensagem:\\nQue eu esteja seguro.\\nQue eu tenha saúde.\\nQue eu viva em paz.\\nAgora, irradie esse desejo para alguém que você ama.\\nE expanda para o mundo inteiro.\\nQue todos os seres vivam em paz.\` },
  { id: 13, title: 'Meditação para perdão', emoji: '🕊️', description: '10 min', text: \`Sentir mágoa é como segurar carvão em brasa.\\nInspire fundo.\\nO perdão não é apagar o passado, mas libertar o seu próprio coração no presente.\\nVisualize o fio que te prende à dor se desfazendo.\\nVocê escolhe a liberdade.\\nVocê escolhe soltar o que já passou.\\nTraga alívio e leveza para a sua alma.\` },
  { id: 14, title: 'Meditação para soltar pensamentos negativos', emoji: '☁️', description: '8 min', text: \`Observe os pensamentos escuros.\\nNão brigue com eles.\\nEles são impermanentes, vêm e vão.\\nImagine que o seu peito é um céu azul, e os pensamentos são apenas nuvens escuras passando.\\nEles não são você.\\nDeixe-os prosseguir em seu rumo.\\nVolte sua atenção para o ar que entra e sai suavemente.\` },
  { id: 15, title: 'Meditação para foco e concentração', emoji: '🎯', description: '7 min', text: \`Sente-se com as costas eretas.\\nFoque toda a sua atenção num ponto fixo ou na ponta do nariz.\\nA mente vai tentar divagar, é natural.\\nAssim que perceber, traga ela de volta com firmeza e gentileza.\\nEste treinamento fortalece a sua atenção.\\nVocê está no controle da sua mente.\\nInspire presença, expire a distração.\` },
  { id: 16, title: 'Meditação para começar o dia', emoji: '🌅', description: '5 min', text: \`Bom dia.\\nAgradeça pela oportunidade de viver este novo dia.\\nEspreguice-se suavemente.\\nDefina uma intenção positiva para as próximas horas:\\nHoje escolho a paciência, escolho a coragem, escolho o equilíbrio.\\nLeve essa energia renovada e desperte para a luz maravilhosa da manhã.\\nLevante-se com alegria.\` },
  { id: 17, title: 'Meditação para encerrar o dia', emoji: '🌆', description: '10 min', text: \`O dia chegou ao fim.\\nQualquer desafio que você enfrentou hoje já ficou no passado.\\nFeche os olhos e respire lentamente.\\nAgradeça por três coisas simples que aconteceram hoje.\\nPode ser a sua saúde, uma refeição, um sorriso.\\nDeixe que a gratidão traga paz ao seu coração e prepare a sua mente para um excelente descanso.\` },
  { id: 18, title: 'Meditação para equilíbrio emocional', emoji: '⚖️', description: '10 min', text: \`Sinta suas emoções.\\nVocê não precisa ser dominado por elas.\\nImagine um pêndulo parando lentamente no centro.\\nEsse centro é o seu porto seguro.\\nRespire no seu centro.\\nAqui não há julgamentos, apenas a capacidade de observar em silêncio.\\nVocê é mais forte do que qualquer emoção passageira.\` },
  { id: 19, title: 'Meditação para confiança e autoestima', emoji: '👑', description: '8 min', text: \`Mantenha a postura alerta e altiva.\\nInspire autoconfiança.\\nVocê tem todas as ferramentas dentro de si para vencer seus obstáculos.\\nOs duelos na mente limitam o seu potencial.\\nDescarte a voz da dúvida.\\nAbrace o seu valor.\\nDiga: Eu sou capaz, eu sou forte, eu mereço ocupar o meu espaço.\\nCresça na sua própria luz.\` },
  { id: 20, title: 'Meditação para cura interior', emoji: '🩹', description: '12 min', text: \`Leve a atenção para onde dói, seja física ou emocionalmente.\\nRespire sobre essa dor com muita gentileza.\\nImagine uma luz verde e curativa envolvendo essa região.\\nA luz nutre, acalma e regenera as suas células e as suas emoções.\\nO processo de cura leva tempo, seja amoroso consigo mesmo.\\nVocê está seguro aqui neste casulo de luz.\` },
  { id: 21, title: 'Meditação para silêncio mental', emoji: '🤫', description: '10 min', text: \`Há muito barulho na sua mente.\\nAgora é a hora do vazio.\\nConcentre-se no espaço entre os seus pensamentos.\\nSempre que um pensamento surgir, imagine ele se dissolvendo numa imensidão branca e infinita.\\nMergulhe na paz do nada.\\nDescanse nesse silêncio absoluto que existe no fundo da sua mente.\` },
  { id: 22, title: 'Meditação para aceitação', emoji: '🤲', description: '8 min', text: \`Não podemos controlar tudo.\\nAceitar não é desistir, é poupar energia.\\nAcolha o momento exato em que você se encontra agora.\\nInspire aceitação.\\nDiga a si mesmo: Está tudo bem que as coisas sejam como são neste momento.\\nDeixe a resistência ir embora na expiração.\\nEncontre paz na realidade presente.\` },
  { id: 23, title: 'Meditação para paciência', emoji: '⏳', description: '7 min', text: \`Tudo tem o seu tempo.\\nA natureza não tem pressa, e mesmo assim tudo se cumpre.\\nObserve a sua impaciência.\\nAcolha-a e permita que ela passe.\\nRespiração longa.\\nConfie no processo invisível que está desenrolando as coisas.\\nDesacelerar é uma virtude que te preserva e te prepara para o momento certo.\` },
  { id: 24, title: 'Meditação para raiva e irritação', emoji: '🔥', description: '10 min', text: \`A raiva é uma chama alta.\\nSinta onde ela queima no seu corpo.\\nNão tente apagá-la com força; deixe a água da sua respiração refrescá-la aos poucos.\\nObserve essa emoção sem tomar atitudes impulsivas.\\nInspire ar frio... expire ar quente.\\nVocê consegue observar a raiva sem se transformar nela.\\nA calma vai voltar.\` },
  { id: 25, title: 'Meditação para tristeza', emoji: '🌧️', description: '10 min', text: \`A tristeza é um momento de recolhimento da alma.\\nNão a rejeite.\\nSente-se com ela como sentaria ao lado de um amigo machucado.\\nDê colo à sua dor.\\nO choro, quando vem, limpa a vista.\\nChore, se sentir.\\nDeixe a emoção fluir pelo seu corpo e se transformar e sair através da sua doce respiração leve.\` },
  { id: 26, title: 'Meditação para luto', emoji: '🥀', description: '12 min', text: \`O amor não morre, ele se transforma em saudade.\\nO luto é doloroso porque o amor era grande.\\nSinta o vazio com reverência.\\nPermita que as memórias doces aqueçam levemente seu peito, em meio ao gelo da perda.\\nAbrace a complexidade das emoções sem pressa.\\nVocê tem todo o direito de sentir e de cicatrizar, um dia de cada vez.\` },
  { id: 27, title: 'Meditação para energia e disposição', emoji: '⚡', description: '6 min', text: \`Faça respirações vigorosas e enérgicas.\\nSinta o ar ativando todo o seu corpo.\\nA cada inspiração, absorva vitalidade pura do ambiente.\\nLevante um pouco o queixo.\\nDesperte todas as células do seu organismo com poder.\\nHoje e agora, você está pronto para transformar intenção em pura ação focada e presente.\` },
  { id: 28, title: 'Meditação para conexão espiritual', emoji: '✨', description: '12 min', text: \`Foque a atenção acima da cabeça.\\nSinta a conexão com algo muito maior do que você, independentemente de religião.\\nA força que move o universo também pulsa no seu pulso.\\nFeche os olhos, em silêncio de oração ou comunhão contemplativa.\\nVocê é amado, protegido e guiado pelas estrelas.\\nPermaneça unificado e presente.\` },
  { id: 29, title: 'Meditação com visualização positiva', emoji: '🎬', description: '10 min', text: \`Imagine um cenário pacífico e feliz.\\nOnde você está? Como se sente?\\nTraga para a sua tela mental cores vibrantes, sorrisos sutis e sensações esplêndidas.\\nEnsaiar coisas maravilhosas treina o seu cérebro para buscar a paz.\\nSinta-se vivendo a sua versão mais plena agora mesmo.\\nAbsorva firmemente todo este bem-estar interno.\` },
  { id: 30, title: 'Meditação para manifestar objetivos', emoji: '🚀', description: '10 min', text: \`Pense em uma grande meta que te move.\\nAgora, imagine-se alcançando este salto e sinta as emoções do cumprimento deste sonho.\\nAlegria, alívio, euforia.\\nAja interiormente com fé no passo consecutivo.\\nA vibração da vitória cria a estrada que o universo vai pavimentar para você alcançar os objetivos grandiosos da vida.\\nConfie.\` },
  { id: 31, title: 'Meditação dos chakras', emoji: '🌈', description: '15 min', text: \`Visualize um canal de luz descendo pela coluna.\\nTraga atenção à base da coluna (segurança), depois abaixo do umbigo (criatividade).\\nSuba ao abdômen (poder pessoal) e, em seguida, ao coração (amor, compaixão e união).\\nLogo, na garganta (expressão autêntica).\\nNo centro da testa (intuição).\\nPor fim, no topo cabeça (conexão divina).\` },
  { id: 32, title: 'Meditação com mantras', emoji: '📿', description: '10 min', text: \`O som carrega forte poder vibracional.\\nEntoe mentalmente ou em voz baixa: OM, ou Paz, ou Shalom.\\nReduza a frequência da agitação com a cadência constante.\\nSincronize as palavras sagradas ou construtivas ao fluxo natural de entrar e sair do oxigênio.\\nEsse ritmo é sublime, e aos poucos todo o ruído some.\` },
  { id: 33, title: 'Meditação caminhando', emoji: '🚶', description: '10 min', text: \`Meditar também se faz agindo.\\nPreste total atenção em cada pé tocando o assoalho ou terreno.\\nA sola esmagando sutilmente a terra, ou roçando a grama.\\nO ar tocando no rosto jovial e fresco.\\nSe o pensamento vaguear, reoriente velozmente a mente às pernas se flexionando no mundo real de passo em passo contínuo e equilibrado.\` },
  { id: 34, title: 'Meditação observando sons', emoji: '🎧', description: '5 min', text: \`Ancore sua base de percepção unicamente nos seus ouvidos.\\nO mundo lá fora emite sinfonias escondidas.\\nRuídos de carros, vento, pássaros, o ronco suave de um motor ou máquina.\\nTrate os barulhos não como incômodos, mas sim como melodias do sagrado momento atual fluindo veloz.\\nAcolha cada nota, deixe entrar, sair, sem rótulos.\` },
  { id: 35, title: 'Meditação observando emoções', emoji: '🎭', description: '8 min', text: \`Desconecte de reações automáticas.\\nVisualize si mesmo de frente à um espelho da essência.\\nNesta sala da consciência, encare qual é a cor do seu afeto atual e contemple-o com olhos macios.\\nDar um nome verdadeiro (alegria, nostalgia, ansiedade) diminui em proporções vastas o seu impacto.\\nSer puro não evitar, mas observar integralmente.\` },
  { id: 36, title: 'Meditação de relaxamento profundo', emoji: '🛋️', description: '15 min', text: \`Inspire longo. Expire infinito.\\nVocê acaba de desligar todas as turbinas lógicas do intelecto.\\nA percepção recua para o tronco cerebral primordial unívoco, restando tão somente o ritmo cadenciado do coração valente batendo.\\nA gravidade cuida perfeitamente de te segurar no mundo, pode render-se totalmente relaxado em plenitude curativa magistral.\` }
];`;

content = content.replace(/];[\r\n]+([^a-zA-Z]*)\/\/\s*Breathing exercises/, extra + '\n\n$1// Breathing exercises');

fs.writeFileSync(file, content);
console.log('Meditation list updated successfully.');
