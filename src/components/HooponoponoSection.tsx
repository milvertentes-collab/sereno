'use client';

import React, { useState } from 'react';
import ModernAudioPlayer from './ModernAudioPlayer';

const practices = [
    {
        id: 'serenamente',
        title: 'SerenaMente',
        subtitle: 'Ho\'oponopono — reconexão espiritual',
        icon: '🧘',
        color: 'bg-teal-100',
        darkColor: 'bg-teal-900',
        text: `Encontre uma posição confortável.
Feche os olhos, se isso fizer sentido neste momento.
Respire profundamente pelo nariz... e solte devagar pela boca.
Mais uma vez. Inspire com calma... e solte.
Permita-se chegar neste momento.
Agora, leve a atenção para dentro.
Perceba o corpo, a respiração, o coração.
Se houver dor, medo, culpa, angústia ou cansaço, apenas reconheça.
Não é preciso lutar contra isso agora.
Apenas permita que esteja presente.
Imagine uma luz suave envolvendo todo o seu ser.
Uma luz de amor, paz e acolhimento.
Essa luz toca memórias, feridas, pensamentos e emoções com delicadeza.
Em silêncio, ou repetindo mentalmente, diga:
Sinto muito.
Pelas dores que carrego.
Pelas memórias que ainda pesam em mim.
Pelo que em mim precisa de cura.
Me perdoe.
Pelas vezes em que me afastei de mim.
Pelas vezes em que alimentei sofrimento sem perceber.
Pelo que preciso soltar com amor.
Eu te amo.
Amo a vida em mim.
Amo a parte de mim que continua tentando.
Amo quem sou, mesmo em processo, mesmo sem perfeição.
Sou grato. Sou grata.
Por este instante de consciência.
Pela oportunidade de recomeçar.
Pela cura que já começa a acontecer dentro de mim.
Continue respirando suavemente.
Deixe essas palavras ecoarem dentro do coração.
Sem pressa.
Sem cobrança.
Só presença.
Quando sentir que é o momento, inspire mais profundamente.
Mexa devagar as mãos, os pés.
E retorne a este instante levando consigo mais paz, mais amor e mais reconciliação interior.`
    },
    {
        id: 'gentilmente',
        title: 'GentilMente',
        subtitle: 'Prática inspirada no ho\'oponopono — acolhimento emocional',
        icon: '💖',
        color: 'bg-pink-100',
        darkColor: 'bg-pink-900',
        text: `Pausa por um instante.
Acomode o corpo de um jeito confortável.
Se desejar, feche os olhos ou apenas suavize o olhar.
Respire fundo... e solte o ar lentamente.
De novo. Inspire... e solte.
Agora observe como você está neste momento.
Sem tentar mudar nada.
Sem julgar.
Apenas note:
o que sente no corpo,
o que está passando pela mente,
e qual emoção parece mais presente agora.
Talvez exista ansiedade.
Talvez cansaço.
Talvez culpa, tristeza, frustração ou medo.
Não é necessário entender tudo agora.
Só reconhecer já é um começo.
Leve a atenção para si com mais gentileza.
Como se estivesse falando com uma parte sua que precisa de cuidado.
Repita mentalmente, no seu ritmo:
Sinto muito.
Reconheço que isso tem sido difícil.
Reconheço a dor, a sobrecarga e o que estou sentindo agora.
Me perdoe.
Pelas vezes em que me cobrei além do possível.
Pelas vezes em que não consegui me acolher.
Pelas durezas que carreguei contra mim.
Eu te amo.
Escolho me tratar com mais compaixão.
Mesmo sem ter tudo resolvido.
Mesmo sem estar bem o tempo todo.
Sou grato. Sou grata.
Por estar aqui agora.
Por poder respirar e recomeçar deste ponto.
Por cada pequeno passo de cuidado comigo.
Se alguma emoção surgir, deixe vir com suavidade.
Não é preciso expulsar o que se sente.
É possível apenas respirar com isso, acolher e continuar.
Faça mais uma respiração profunda.
Perceba o apoio do corpo onde você está.
E lembre-se: cuidar de si não exige perfeição.
Exige presença.
Quando quiser, abra os olhos devagar e siga o dia com um pouco mais de gentileza consigo.`
    },
    {
        id: 'plenamente',
        title: 'PlenaMente',
        subtitle: 'Prática breve de reconciliação interior',
        icon: '✨',
        color: 'bg-blue-100',
        darkColor: 'bg-blue-900',
        text: `Reserve este momento para pausar.
Adote uma posição confortável.
Se preferir, feche os olhos.
Leve sua atenção para a respiração.
Inspire lentamente... e expire devagar.
Repita esse movimento mais duas vezes.
Agora observe seu estado interno neste momento.
Note pensamentos, sensações físicas e emoções presentes.
Não é necessário mudar nada.
A proposta aqui é apenas reconhecer a própria experiência com abertura e gentileza.
Se houver tensão, preocupação, autocrítica ou desconforto emocional, apenas identifique isso internamente.
Diga a si, em silêncio:
“Isso está presente agora.”
“Eu posso observar isso com cuidado.”
Em seguida, repita mentalmente, no seu próprio ritmo:
Sinto muito.
Reconheço o impacto do que estou vivendo.
Me perdoe.
Escolho reduzir a rigidez e a autocrítica neste momento.
Eu te amo.
Ofereço a mim presença, respeito e cuidado.
Sou grato. Sou grata.
Agradeço por esta pausa e pela possibilidade de recomeçar.
Continue respirando de forma tranquila.
Se a mente se distrair, tudo bem.
Apenas retorne à respiração e às frases.
Mais uma vez:
Sinto muito.
Me perdoe.
Eu te amo.
Sou grato. Sou grata.
Permaneça por alguns instantes apenas respirando.
Observe qualquer pequena mudança no corpo ou no estado emocional.
Talvez haja mais calma.
Talvez apenas um pouco mais de espaço interno.
Ambos já são suficientes.
Para finalizar, faça uma última respiração profunda.
Retome sua atenção ao ambiente.
E siga adiante levando consigo esse gesto de cuidado e reconexão.`
    },
    {
        id: 'autoperdao',
        title: 'AutoPerdão',
        subtitle: 'Prática inspirada no Ho\'oponopono — culpa, perdão e acolhimento',
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
        subtitle: 'Prática inspirada no Ho\'oponopono — desapego emocional e alívio interior',
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
        subtitle: 'Prática inspirada no Ho\'oponopono — cura de vínculos e reconciliação emocional',
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
];

export default function HooponoponoSection({ darkMode: dm, onCheckAccess, defaultVoice, setDefaultVoice }: { darkMode?: boolean, onCheckAccess: (feature: string, action?: string) => boolean, defaultVoice: 'masculino' | 'feminino' | 'nenhuma', setDefaultVoice: (v: 'masculino' | 'feminino' | 'nenhuma') => void }) {
    const [selectedPractice, setSelectedPractice] = useState<typeof practices[0] | null>(null);
    const selectedVoice = defaultVoice;
    const setSelectedVoice = (v: 'masculino' | 'feminino' | 'nenhuma') => setDefaultVoice(v);

    if (selectedPractice) {
        return (
            <ModernAudioPlayer
                title={selectedPractice.title}
                emoji={selectedPractice.icon}
                category={selectedPractice.subtitle}
                audio={{
                    feminino: `/meditations/hooponopono/${selectedPractice.id}-feminino.mp3`,
                    masculino: `/meditations/hooponopono/${selectedPractice.id}-masculino.mp3`
                }}
                srt={{
                    feminino: `/meditations/hooponopono/${selectedPractice.id}-feminino.srt`,
                    masculino: `/meditations/hooponopono/${selectedPractice.id}-masculino.srt`
                }}
                text={selectedPractice.text}
                onClose={() => setSelectedPractice(null)}
                darkMode={dm}
                initialVoice={!onCheckAccess('hooponopono', 'voice_selection') ? 'feminino' : selectedVoice}
                onVoiceChange={setDefaultVoice}
            />
        );
    }

    return (
        <div className={`p-4 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-teal-50 to-white text-gray-800'}`}>
            <div className="text-center pt-8 mb-8">
                <h2 className={`text-3xl font-extrabold tracking-tight ${dm ? 'text-teal-400' : 'text-teal-700'}`}>Ho'oponopono</h2>
                <p className={`mt-3 font-medium ${dm ? 'text-slate-400' : 'text-gray-600'}`}>
                    Uma prática havaiana antiga de reconciliação e perdão. Através da repetição de frases curtas, limpamos memórias, sentimentos e pensamentos dolorosos que limitam a nossa paz.
                </p>
            </div>

            {/* Voice Selection */}
            <div className={`rounded-3xl p-5 border mb-8 animate-slide-up shadow-sm max-w-lg mx-auto ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 text-sm ${dm ? 'text-slate-200' : 'text-gray-800'}`}>🎧 Escolha a Voz da Narração</h3>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setSelectedVoice('masculino')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border ${selectedVoice === 'masculino'
                            ? (dm ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm')
                            : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')
                            }`}
                    >
                        👨 Voz Masculina
                    </button>
                    <button
                        onClick={() => setSelectedVoice('feminino')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border ${selectedVoice === 'feminino'
                            ? (dm ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm')
                            : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')
                            }`}
                    >
                        👩 Voz Feminina
                    </button>
                    <button
                        onClick={() => setSelectedVoice('nenhuma')}
                        className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border ${selectedVoice === 'nenhuma'
                            ? (dm ? 'bg-slate-700/70 border-slate-500 text-slate-200 shadow-sm' : 'bg-slate-200 border-slate-400 text-slate-700 shadow-sm')
                            : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')
                            }`}
                    >
                        🔇 Sem Narração
                    </button>
                </div>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
                {practices.map((practice, index) => {
                    const styleMap: Record<string, { bgGradient: string, darkBgGradient: string, iconColor: string, darkIconColor: string }> = {
                        'serenamente': { bgGradient: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100 border-teal-100/50', darkBgGradient: 'bg-gradient-to-br from-teal-900/40 via-emerald-900/30 to-teal-800/40 border-teal-700/50', iconColor: 'text-teal-600', darkIconColor: 'text-teal-400' },
                        'gentilmente': { bgGradient: 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 border-pink-100/50', darkBgGradient: 'bg-gradient-to-br from-pink-900/40 via-rose-900/30 to-pink-800/40 border-pink-700/50', iconColor: 'text-pink-600', darkIconColor: 'text-pink-400' },
                        'plenamente': { bgGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-blue-100/50', darkBgGradient: 'bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-blue-800/40 border-blue-700/50', iconColor: 'text-blue-600', darkIconColor: 'text-blue-400' },
                        'autoperdao': { bgGradient: 'bg-gradient-to-br from-stone-50 via-neutral-50 to-stone-100 border-stone-100/50', darkBgGradient: 'bg-gradient-to-br from-stone-900/40 via-neutral-900/30 to-stone-800/40 border-stone-700/50', iconColor: 'text-stone-600', darkIconColor: 'text-stone-400' },
                        'soltar': { bgGradient: 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-emerald-100/50', darkBgGradient: 'bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-emerald-800/40 border-emerald-700/50', iconColor: 'text-emerald-600', darkIconColor: 'text-emerald-400' },
                        'relacionamentos': { bgGradient: 'bg-gradient-to-br from-sky-50 via-cyan-50 to-sky-100 border-sky-100/50', darkBgGradient: 'bg-gradient-to-br from-sky-900/40 via-cyan-900/30 to-sky-800/40 border-sky-700/50', iconColor: 'text-sky-600', darkIconColor: 'text-sky-400' },
                    };
                    const style = styleMap[practice.id] || styleMap['serenamente'];

                    return (
                        <button
                            key={practice.id}
                            onClick={() => setSelectedPractice(practice)}
                            className={`w-full text-left p-4 sm:p-5 rounded-3xl flex justify-between items-center transition-all duration-300 active:scale-[0.98] shadow-sm hover:shadow-md border ${dm ? style.darkBgGradient : style.bgGradient} animate-slide-up group relative overflow-hidden`}
                            style={{ animationDelay: index * 0.1 + 's' }}
                        >
                            <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full">
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0 ${dm ? 'bg-slate-800/60' : 'bg-white/60'} backdrop-blur-sm transition-transform duration-300 hover:scale-105`}>
                                    <span className="filter drop-shadow-sm">{practice.icon}</span>
                                </div>
                                <div className="flex-1 pr-2">
                                    <h3 className={`font-extrabold text-lg sm:text-xl mb-0.5 tracking-tight ${dm ? style.darkIconColor : style.iconColor}`}>{practice.title}</h3>
                                    <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${dm ? 'text-slate-400' : 'text-gray-600/80'}`}>{practice.subtitle}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 ease-out shadow-sm group-hover:translate-x-1 ${dm ? 'bg-slate-800/60 text-slate-300 border border-slate-700/50' : 'bg-white/80 text-gray-500 border border-white'}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6" /></svg>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
