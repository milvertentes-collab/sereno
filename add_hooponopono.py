import re

path = r'c:\Users\Romulo\Downloads\programa psicologia\src\components\HooponoponoSection.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_practices = """    },
    {
        id: 'autoperdao',
        title: 'AutoPerdão',
        subtitle: 'Prática inspirada no Ho\\'oponopono — culpa, perdão e acolhimento',
        icon: '🤍',
        color: 'bg-stone-100',
        darkColor: 'bg-stone-800',
        text: `Encontre uma posição confortável.
Sente-se ou deite-se como preferir.
Permita que este seja um momento de acolhimento.
Sem cobrança.
Sem pressa.
Sem julgamento.

Feche os olhos suavemente.
Respire fundo pelo nariz…
e solte devagar pela boca.

Mais uma vez…
inspire com calma…
e expire soltando a tensão.

Agora deixe sua respiração seguir no ritmo natural.
Não tente controlar demais.
Apenas observe o ar entrando…
e o ar saindo…

Neste instante, você não precisa se defender.
Não precisa provar nada.
Não precisa ser perfeito.
Você só precisa estar aqui.

Leve sua atenção para o seu coração.
Perceba essa região do peito.
Talvez exista peso.
Talvez exista cansaço.
Talvez exista culpa.
Talvez exista tristeza.
Seja o que for… acolha.

Hoje, esta prática é um convite para olhar para si com mais gentileza.

Talvez você esteja carregando arrependimentos.
Talvez existam escolhas que ainda doem.
Talvez você se cobre por palavras que disse…
por atitudes que teve…
ou por não ter conseguido agir de outra forma.

Respire fundo…

E reconheça com sinceridade:
você é humano.
Você estava tentando viver com a consciência que tinha naquele momento.
Você estava fazendo o que conseguia, com os recursos emocionais que tinha.

Isso não apaga o passado.
Mas abre espaço para cura.

Agora, em silêncio, traga à mente alguma parte sua que precisa de perdão.
Pode ser uma atitude.
Pode ser uma fase da sua vida.
Pode ser uma versão sua que ainda carrega dor.

Apenas observe.
Sem fugir.
Sem se atacar.

Agora repita mentalmente, com calma:

Sinto muito.
Por todas as vezes em que me feri com dureza.

Me perdoe.
Por ter carregado tanta culpa dentro de mim.

Eu te amo.
Mesmo com falhas, medos e imperfeições.

Sou grato.
Pela chance de aprender, crescer e recomeçar.

Respire…

Mais uma vez:

Sinto muito.
Pelas vezes em que fui severo demais comigo.

Me perdoe.
Por não ter sabido acolher minha própria dor.

Eu te amo.
Mesmo nas partes que ainda estou tentando curar.

Sou grato.
Porque ainda posso escolher a compaixão.

Agora imagine que uma luz suave envolve você.
Uma luz branca, silenciosa, acolhedora.
Essa luz toca sua mente…
seu coração…
suas memórias…
e começa a suavizar tudo aquilo que estava rígido dentro de você.

Ela não apaga sua história.
Ela não nega seus erros.
Mas ela traz ternura para aquilo que precisa ser curado.

Repita mentalmente:

Eu me permito aprender sem me destruir.
Eu me permito crescer sem me punir para sempre.
Eu escolho me tratar com mais compaixão.
Eu escolho me perdoar.

Fique por alguns instantes apenas respirando e recebendo essa sensação.

…
…

Agora, lentamente, traga sua atenção de volta ao corpo.
Perceba o ambiente ao redor.
Mexa devagar as mãos…
os pés…

Respire fundo mais uma vez.

E quando quiser, abra os olhos.

Leve com você esta lembrança:
você não precisa continuar sendo seu maior peso.
Você também pode ser abrigo para si mesmo.`
    },
    {
        id: 'soltar',
        title: 'Soltar e Liberar',
        subtitle: 'Prática inspirada no Ho\\'oponopono — desapego emocional e alívio interior',
        icon: '🌿',
        color: 'bg-emerald-100',
        darkColor: 'bg-emerald-800',
        text: `Encontre uma posição confortável.
Permita que seu corpo se acomode.
Hoje, este é um momento para soltar.
Para esvaziar.
Para liberar o que já está pesado demais.

Feche os olhos suavemente.
Respire fundo pelo nariz…
e solte pela boca.

Mais uma vez…
inspire calma…
e expire tensão.

Agora deixe a respiração seguir naturalmente.
Sem esforço.
Sem pressa.
Apenas sinta.

Perceba seu corpo sendo sustentado.
Perceba o chão, a cadeira ou a cama apoiando você.
Você não precisa carregar tudo sozinho agora.

Leve sua atenção para dentro.
Observe se existe algo pesando em você neste momento.
Uma preocupação.
Uma mágoa.
Um medo.
Uma lembrança.
Uma expectativa.
Algo que você vem segurando por tempo demais.

Não tente resolver agora.
Apenas reconheça.

Talvez você tenha se acostumado a apertar por dentro.
A prender emoções.
A reviver pensamentos.
A resistir ao fluxo natural da vida.

Mas hoje, por alguns minutos, você pode soltar.

Respire fundo…

E imagine que, a cada expiração, você libera um pouco desse peso.

Ao inspirar… receba calma.
Ao expirar… solte o excesso.

Inspire leveza…
expire tensão.

Inspire paz…
expire controle.

Inspire presença…
expire apego.

Agora imagine que tudo aquilo que pesa dentro de você está sendo colocado diante de uma luz suave.
Essa luz não julga.
Essa luz apenas purifica.
Ela recebe o que você já não precisa carregar do mesmo jeito.

Se quiser, repita mentalmente:

Sinto muito.
Pelo peso que venho carregando dentro de mim.

Me perdoe.
Por ter me prendido ao que já precisava ser solto.

Eu te amo.
Mesmo enquanto ainda estou aprendendo a liberar.

Sou grato.
Porque posso deixar ir o que já não me faz bem.

Respire…

Agora visualize folhas secas sendo levadas pelo vento.
Cada folha representa uma tensão, uma preocupação, uma dor antiga, uma expectativa sufocante.
Você observa essas folhas se afastando.
Sem medo.
Sem resistência.
Apenas deixando ir.

Você não perde a sua essência quando solta o peso.
Você apenas abre espaço para respirar melhor.

Repita mentalmente:

Eu libero o que não preciso controlar.
Eu solto o que já cumpriu seu papel.
Eu permito que a vida siga seu fluxo.
Eu escolho a leveza.

Agora leve a atenção ao peito.
Perceba se existe um pouco mais de espaço aí dentro.
Talvez uma pequena suavidade.
Talvez um pouco mais de ar.
Talvez um alívio discreto.

Não precisa ser perfeito.
Não precisa acontecer tudo de uma vez.
Soltar também é um processo.

Repita mais uma vez:

Sinto muito.
Me perdoe.
Eu te amo.
Sou grato.

Fique por alguns instantes apenas respirando e deixando a vida circular dentro de você.

…
…

Agora, aos poucos, volte sua atenção ao corpo.
Perceba seus braços.
Suas pernas.
Seu rosto.
O ambiente ao redor.

Mexa devagar as mãos…
os pés…

Respire fundo mais uma vez.
E quando quiser, abra os olhos.

Leve com você esta intenção:
soltar não é perder.
Soltar é criar espaço para a paz entrar.`
    },
    {
        id: 'relacionamentos',
        title: 'Relacionamentos',
        subtitle: 'Prática inspirada no Ho\\'oponopono — cura de vínculos e reconciliação emocional',
        icon: '🕊️',
        color: 'bg-sky-100',
        darkColor: 'bg-sky-800',
        text: `Encontre uma posição confortável.
Sente-se ou deite-se.
Permita que este momento seja de sinceridade e suavidade.
Hoje, vamos olhar para os vínculos com mais consciência.

Feche os olhos suavemente.
Respire fundo pelo nariz…
e solte devagar pela boca.

Mais uma vez…
inspire…
e expire…

Agora deixe a respiração seguir naturalmente.
Apenas observe o ar entrando…
e o ar saindo…

Leve sua atenção para o coração.
Perceba essa região do peito.
É aqui que muitos encontros deixam marcas.
É aqui que também podem começar os processos de cura.

Agora traga à mente uma pessoa, ou uma relação, que esteja ocupando espaço dentro de você.
Pode ser alguém com quem houve conflito.
Pode ser alguém por quem você sente saudade.
Pode ser alguém com quem existe mágoa, peso, silêncio ou dor.

Apenas traga essa pessoa à mente.
Sem tentar resolver tudo agora.
Apenas reconheça o vínculo.

Perceba o que surge em você.
Talvez tristeza.
Talvez raiva.
Talvez frustração.
Talvez amor.
Talvez confusão.

Não rejeite o que sente.
Apenas observe.

Esta prática não exige que você concorde com tudo.
Não exige que você apague o que aconteceu.
Não exige que você volte para situações que ferem você.
Ela apenas abre um espaço interior para cura emocional.

Agora imagine essa pessoa diante de você, em segurança, à distância necessária.
Você observa essa presença com calma.
E começa a repetir mentalmente:

Sinto muito.
Pela dor que existe entre nós.

Me perdoe.
Pelas marcas, conscientes ou inconscientes, que ficaram nesse vínculo.

Eu te amo.
Reconhecendo a alma, a humanidade e a história que nos atravessa.

Sou grato.
Pelos aprendizados, pela consciência e pela chance de cura.

Respire…

Mais uma vez:

Sinto muito.
Por tudo o que ainda pesa em meu coração.

Me perdoe.
Por tudo o que precisa de reconciliação dentro de mim.

Eu te amo.
Mesmo que eu ainda esteja em processo de cura.

Sou grato.
Porque posso escolher paz em vez de carregar guerra por dentro.

Agora imagine uma luz suave envolvendo esse vínculo.
Não para forçar uma reconciliação externa.
Mas para limpar a dor emocional que ficou presa em você.

Essa luz toca as palavras não ditas.
As feridas mal compreendidas.
Os silêncios.
Os excessos.
As faltas.
E começa a trazer mais clareza e suavidade.

Repita mentalmente:

Eu libero o peso que este vínculo deixou em mim.
Eu escolho não alimentar mais a dor.
Eu permito que a cura aconteça dentro do meu coração.
Eu escolho a paz.

Se houver emoção, acolha.
Se houver resistência, acolha também.
Cada coração tem seu tempo.

Agora perceba que você pode honrar o que viveu…
sem permanecer preso ao sofrimento.
Você pode aprender…
sem continuar se ferindo por dentro.
Você pode lembrar…
sem carregar o mesmo peso para sempre.

Repita mais uma vez, com presença:

Sinto muito.
Me perdoe.
Eu te amo.
Sou grato.

Fique por alguns instantes apenas respirando e sentindo.

…
…

Agora deixe essa imagem se afastar suavemente.
Traga sua atenção de volta para você.
Para o seu corpo.
Para a sua respiração.
Para o seu coração.

Mexa devagar as mãos…
os pés…

Respire fundo mais uma vez.
E quando quiser, abra os olhos.

Leve com você esta verdade:
nem toda reconciliação precisa acontecer do lado de fora primeiro.
Às vezes, ela começa em silêncio, dentro de você.`
    }
];"""

new_content = content.replace("    }\n];", new_practices)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
