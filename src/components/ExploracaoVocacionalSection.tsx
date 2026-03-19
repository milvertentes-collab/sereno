
import React, { useState, useEffect, useMemo } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import { useToast } from "@/hooks/use-toast";
import SectionHeroCard from './SectionHeroCard';

type RIASEC = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type TestVersion = 'rapid' | 'medium' | 'complete';

interface Question {
    id: number;
    text: string;
    category: RIASEC;
}

interface SavedResult {
    id: string;
    date: string;
    version: TestVersion;
    scores: Record<RIASEC, number>;
    topCode: string;
}

type CareerFilter = 'all' | 'human' | 'technical' | 'creative' | 'structured';

const areaNames: Record<RIASEC, string> = { R: 'Realista', I: 'Investigativo', A: 'Artístico', S: 'Social', E: 'Empreendedor', C: 'Convencional' };
const areaColors: Record<RIASEC, string> = { R: 'bg-red-500', I: 'bg-blue-500', A: 'bg-purple-500', S: 'bg-emerald-500', E: 'bg-orange-500', C: 'bg-slate-500' };
const profileInsights: Record<RIASEC, { learn: string; thrive: string; drains: string; next: string[] }> = {
    R: { learn: 'Aprende melhor fazendo, testando e vendo aplicação prática.', thrive: 'Rende melhor em ambientes concretos, ativos e com resultado visível.', drains: 'Pode se desgastar com excesso de abstração e pouca ação direta.', next: ['Buscar vivências práticas, visitas técnicas ou projetos mão na massa.', 'Comparar áreas em que execução e resultado concreto importam.'] },
    I: { learn: 'Aprende melhor pesquisando, analisando e conectando padrões.', thrive: 'Rende melhor em ambientes com investigação, estudo e autonomia intelectual.', drains: 'Pode se desgastar com rotinas superficiais e sem profundidade.', next: ['Explorar cursos, leitura e projetos de pesquisa.', 'Observar carreiras orientadas a análise e resolução de problemas.'] },
    A: { learn: 'Aprende melhor criando, experimentando linguagem e expressão própria.', thrive: 'Rende melhor em ambientes flexíveis, criativos e com espaço de autoria.', drains: 'Pode se desgastar com excesso de rigidez e pouca liberdade criativa.', next: ['Testar produção autoral, portfólio e projetos criativos.', 'Comparar contextos em que criatividade vira trabalho concreto.'] },
    S: { learn: 'Aprende melhor trocando com pessoas, ensinando e acolhendo.', thrive: 'Rende melhor em ambientes colaborativos e orientados a cuidado ou desenvolvimento humano.', drains: 'Pode se desgastar com isolamento e tarefas sem sentido relacional.', next: ['Explorar atividades de apoio, ensino, saúde ou mediação.', 'Observar profissões com impacto humano direto.'] },
    E: { learn: 'Aprende melhor quando precisa mobilizar, liderar e transformar ideia em movimento.', thrive: 'Rende melhor em ambientes dinâmicos, com meta, influência e decisão.', drains: 'Pode se desgastar com lentidão excessiva e pouca autonomia.', next: ['Testar papéis de liderança, negócio ou comunicação.', 'Comparar ambientes com negociação, influência e iniciativa.'] },
    C: { learn: 'Aprende melhor com estrutura clara, sequência e critério definido.', thrive: 'Rende melhor em ambientes organizados, previsíveis e orientados a processo.', drains: 'Pode se desgastar com desorganização constante e ambiguidades.', next: ['Explorar áreas administrativas, financeiras ou de controle.', 'Testar contextos com método, rotina e precisão.'] },
};

const allQuestions: Record<TestVersion, Question[]> = {
    rapid: [
        { id: 1, text: "Gosto de cuidar de pessoas e ajudá-las em suas necessidades.", category: 'S' },
        { id: 2, text: "Gosto de ouvir os outros com atenção e acolhimento.", category: 'S' },
        { id: 3, text: "Gosto de criar ideias, textos, imagens ou projetos originais.", category: 'A' },
        { id: 4, text: "Gosto de expressar o que sinto através da arte ou da escrita.", category: 'A' },
        { id: 5, text: "Gosto de consertar objetos, trabalhar com ferramentas ou máquinas.", category: 'R' },
        { id: 6, text: "Gosto de atividades práticas ao ar livre ou esportes.", category: 'R' },
        { id: 7, text: "Gosto de vender, convencer ou negociar com pessoas.", category: 'E' },
        { id: 8, text: "Gosto de liderar grupos e assumir responsabilidades.", category: 'E' },
        { id: 9, text: "Gosto de organizar arquivos e seguir regras estabelecidas.", category: 'C' },
        { id: 10, text: "Gosto de rotina bem definida e tarefas metódicas.", category: 'C' },
        { id: 11, text: "Gosto de entender como as coisas funcionam e pesquisar.", category: 'I' },
        { id: 12, text: "Gosto de resolver problemas lógicos e observar fenômenos.", category: 'I' },
        { id: 13, text: "Gosto de ensinar ou explicar coisas para os outros.", category: 'S' },
        { id: 14, text: "Gosto de desenhar, pintar ou produzir algo visualmente belo.", category: 'A' },
        { id: 15, text: "Gosto de operar máquinas pesadas ou dirigir veículos.", category: 'R' },
        { id: 16, text: "Gosto de gerenciar projetos e coordenar equipes.", category: 'E' },
        { id: 17, text: "Gosto de trabalhar com cálculos e tabelas de dados.", category: 'C' },
        { id: 18, text: "Gosto de ler sobre ciência e novas tecnologias.", category: 'I' },
    ],
    medium: [
        { id: 1, text: "Gosto de cuidar de pessoas e ajudá-las em suas necessidades.", category: 'S' },
        { id: 2, text: "Gosto de ouvir os outros com atenção e acolhimento.", category: 'S' },
        { id: 3, text: "Gosto de criar ideias, textos, imagens ou projetos originais.", category: 'A' },
        { id: 4, text: "Gosto de expressar o que sinto através da arte ou da escrita.", category: 'A' },
        { id: 5, text: "Gosto de consertar objetos, trabalhar com ferramentas ou máquinas.", category: 'R' },
        { id: 6, text: "Gosto de atividades práticas ao ar livre ou esportes.", category: 'R' },
        { id: 7, text: "Gosto de vender, convencer ou negociar com pessoas.", category: 'E' },
        { id: 8, text: "Gosto de liderar grupos e assumir responsabilidades.", category: 'E' },
        { id: 9, text: "Gosto de organizar arquivos e seguir regras estabelecidas.", category: 'C' },
        { id: 10, text: "Gosto de rotina bem definida e tarefas metódicas.", category: 'C' },
        { id: 11, text: "Gosto de entender como as coisas funcionam e pesquisar.", category: 'I' },
        { id: 12, text: "Gosto de resolver problemas lógicos e observar fenômenos.", category: 'I' },
        { id: 13, text: "Gosto de ensinar ou explicar coisas para os outros.", category: 'S' },
        { id: 14, text: "Gosto de dar suporte emocional a quem precisa.", category: 'S' },
        { id: 15, text: "Gosto de atuar em público, dançar ou me apresentar.", category: 'A' },
        { id: 16, text: "Gosto de propor soluções inovadoras e originais.", category: 'A' },
        { id: 17, text: "Gosto de construir coisas usando madeira, metal ou eletrônica.", category: 'R' },
        { id: 18, text: "Gosto de cuidar do meio ambiente ou de animais.", category: 'R' },
        { id: 19, text: "Gosto de iniciar novos negócios e assumir riscos.", category: 'E' },
        { id: 20, text: "Gosto de convencer as pessoas a apoiarem uma ideia.", category: 'E' },
        { id: 21, text: "Gosto de verificar detalhes e garantir que tudo está correto.", category: 'C' },
        { id: 22, text: "Gosto de organizar agendas e fluxos de trabalho.", category: 'C' },
        { id: 23, text: "Gosto de realizar experimentos científicos.", category: 'I' },
        { id: 24, text: "Gosto de ler livros técnicos ou informativos.", category: 'I' },
        { id: 25, text: "Gosto de trabalhar em projetos de impacto comunitário.", category: 'S' },
        { id: 26, text: "Gosto de harmonizar ambientes e usar o bom gosto.", category: 'A' },
        { id: 27, text: "Gosto de fazer manutenção em equipamentos e aparelhos.", category: 'R' },
        { id: 28, text: "Gosto de persuadir e influenciar o comportamento dos outros.", category: 'E' },
        { id: 29, text: "Gosto de manter sistemas de arquivos impecáveis.", category: 'C' },
        { id: 30, text: "Gosto de analisar estatísticas e tendências futuras.", category: 'I' },
        { id: 31, text: "Gosto de mediar conflitos entre pessoas.", category: 'S' },
        { id: 32, text: "Gosto de improvisar soluções criativas.", category: 'A' },
        { id: 33, text: "Gosto de trabalhos manuais que exijam precisão.", category: 'R' },
        { id: 34, text: "Gosto de coordenar atividades de lazer para grupos.", category: 'E' },
        { id: 35, text: "Gosto de revisar textos para encontrar erros.", category: 'C' },
        { id: 36, text: "Gosto de investigar falhas em sistemas complexos.", category: 'I' },
    ],
    complete: [
        { id: 1, text: "Gosto de cuidar de pessoas e ajudá-las em suas necessidades.", category: 'S' },
        { id: 2, text: "Gosto de entender como as coisas funcionam e pesquisar sobre elas.", category: 'I' },
        { id: 3, text: "Gosto de atividades que envolvem arte, música ou design original.", category: 'A' },
        { id: 4, text: "Gosto de consertar objetos, trabalhar com ferramentas ou máquinas.", category: 'R' },
        { id: 5, text: "Gosto de liderar grupos, persuadir pessoas e gerenciar projetos.", category: 'E' },
        { id: 6, text: "Gosto de organizar arquivos, seguir regras e manter a rotina.", category: 'C' },
        { id: 7, text: "Gosto de ensinar ou explicar coisas para os outros.", category: 'S' },
        { id: 8, text: "Gosto de resolver problemas complexos usando a lógica.", category: 'I' },
        { id: 9, text: "Gosto de escrever contos, poesias ou expressar sentimentos na arte.", category: 'A' },
        { id: 10, text: "Gosto de atividades práticas ao ar livre ou esportes.", category: 'R' },
        { id: 11, text: "Gosto de assumir riscos para alcançar metas financeiras.", category: 'E' },
        { id: 12, text: "Gosto de trabalhar com cálculos, planilhas e detalhes precisos.", category: 'C' },
        { id: 13, text: "Gosto de ouvir os problemas das pessoas e oferecer suporte emocional.", category: 'S' },
        { id: 14, text: "Gosto de ler sobre teorias científicas e novas descobertas.", category: 'I' },
        { id: 15, text: "Gosto de decorar ambientes ou criar layouts visuais.", category: 'A' },
        { id: 16, text: "Gosto de construir coisas usando madeira, metal ou eletrônica.", category: 'R' },
        { id: 17, text: "Gosto de iniciar meus próprios negócios ou vender ideias.", category: 'E' },
        { id: 18, text: "Gosto de seguir um cronograma rigoroso e métodos estabelecidos.", category: 'C' },
        { id: 19, text: "Gosto de mediar conflitos entre pessoas e buscar a harmonia.", category: 'S' },
        { id: 20, text: "Gosto de realizar experimentos ou testar hipóteses.", category: 'I' },
        { id: 21, text: "Gosto de atuar, dançar ou me apresentar em público.", category: 'A' },
        { id: 22, text: "Gosto de dirigir veículos pesados ou operar maquinário industrial.", category: 'R' },
        { id: 23, text: "Gosto de ser o porta-voz de um grupo ou organização.", category: 'E' },
        { id: 24, text: "Gosto de organizar eventos cuidando da logística e burocracia.", category: 'C' },
        { id: 25, text: "Gosto de orientar pessoas sobre escolhas de vida ou carreira.", category: 'S' },
        { id: 26, text: "Gosto de analisar dados estatísticos para encontrar padrões.", category: 'I' },
        { id: 27, text: "Gosto de criar moda, acessórios ou peças de artesanato único.", category: 'A' },
        { id: 28, text: "Gosto de cuidar de plantas, animais ou do meio ambiente.", category: 'R' },
        { id: 29, text: "Gosto de negociar termos, preços e condições de contratos.", category: 'E' },
        { id: 30, text: "Gosto de verificar erros em documentos e garantir a precisão.", category: 'C' },
        { id: 31, text: "Gosto de trabalhar em projetos de impacto social ou voluntariado.", category: 'S' },
        { id: 32, text: "Gosto de estudar a mente humana ou comportamentos sociais.", category: 'I' },
        { id: 33, text: "Gosto de improvisar soluções usando a criatividade.", category: 'A' },
        { id: 34, text: "Gosto de fazer manutenção preventiva em equipamentos.", category: 'R' },
        { id: 35, text: "Gosto de motivar pessoas a darem o melhor de si.", category: 'E' },
        { id: 36, text: "Gosto de catalogar livros, coleções ou informações.", category: 'C' },
        { id: 37, text: "Gosto de cuidar do bem-estar físico das pessoas (saúde).", category: 'S' },
        { id: 38, text: "Gosto de ler manuais técnicos para entender o funcionamento.", category: 'I' },
        { id: 39, text: "Gosto de questionar o status quo e propor o novo.", category: 'A' },
        { id: 40, text: "Gosto de trabalhos manuais que exigem força ou habilidade.", category: 'R' },
        { id: 41, text: "Gosto de coordenar equipes para atingir resultados rápidos.", category: 'E' },
        { id: 42, text: "Gosto de gerenciar orçamentos e contas com rigor.", category: 'C' },
        { id: 43, text: "Gosto de promover a integração social em comunidades.", category: 'S' },
        { id: 44, text: "Gosto de investigar causas de problemas complexos.", category: 'I' },
        { id: 45, text: "Gosto de usar ferramentas digitais para criação artística.", category: 'A' },
        { id: 46, text: "Gosto de montar e desmontar aparelhos eletrônicos.", category: 'R' },
        { id: 47, text: "Gosto de falar em público para convencer uma audiência.", category: 'E' },
        { id: 48, text: "Gosto de preencher formulários e organizar processos.", category: 'C' },
        { id: 49, text: "Gosto de dar conselhos e suporte a pessoas em crise.", category: 'S' },
        { id: 50, text: "Gosto de aprender novas linguagens (computação ou línguas).", category: 'I' },
        { id: 51, text: "Gosto de desenhar plantas baixas ou projetos arquitetônicos.", category: 'A' },
        { id: 52, text: "Gosto de cozinhar ou produzir alimentos de forma artesanal.", category: 'R' },
        { id: 53, text: "Gosto de ser reconhecido por minha influência e liderança.", category: 'E' },
        { id: 54, text: "Gosto de revisar textos para garantir que seguem as normas.", category: 'C' },
        { id: 55, text: "Gosto de atuar em defesa de causas humanitárias.", category: 'S' },
        { id: 56, text: "Gosto de observar fenômenos naturais e tirar conclusões.", category: 'I' },
        { id: 57, text: "Gosto de estilizar fotos, vídeos ou outros tipos de mídia.", category: 'A' },
        { id: 58, text: "Gosto de praticar marcenaria, alvenaria ou mecânica.", category: 'R' },
        { id: 59, text: "Gosto de competir em ambientes de negócios.", category: 'E' },
        { id: 60, text: "Gosto de manter um sistema de arquivos impecável.", category: 'C' },
    ]
};

const professions = [
    { name: "Médico(a)", code: "SIR", desc: "Cuidado direto com pessoas, investigação diagnóstica e aplicação técnica.", areas: ['Social', 'Investigativo', 'Realista'] },
    { name: "Psicólogo(a)", code: "SIA", desc: "Apoio emocional, compreensão da mente e escuta ativa.", areas: ['Social', 'Investigativo', 'Artístico'] },
    { name: "Engenheiro(a) Civil", code: "RIC", desc: "Construção prática, cálculos precisos e organização de projetos.", areas: ['Realista', 'Investigativo', 'Convencional'] },
    { name: "Arquiteto(a)", code: "AIR", desc: "Design criativo, visão espacial e execução técnica.", areas: ['Artístico', 'Investigativo', 'Realista'] },
    { name: "Designer Gráfico", code: "AEC", desc: "Criação visual, comunicação de marcas e organização de ativos.", areas: ['Artístico', 'Empreendedor', 'Convencional'] },
    { name: "Administrador(a)", code: "ECR", desc: "Liderança de equipes, gestão de recursos e processos organizados.", areas: ['Empreendedor', 'Convencional', 'Realista'] },
    { name: "Advogado(a)", code: "EIA", desc: "Argumentação, análise de leis e expressão estratégica.", areas: ['Empreendedor', 'Investigativo', 'Artístico'] },
    { name: "Cientista de Dados", code: "ICR", desc: "Investigação de padrões, tratamento de grandes volumes de dados.", areas: ['Investigativo', 'Convencional', 'Realista'] },
    { name: "Professor(a)", code: "SAE", desc: "Educação, criatividade pedagógica e liderança em sala.", areas: ['Social', 'Artístico', 'Empreendedor'] },
    { name: "Vendedor(a) / Comercial", code: "ESC", desc: "Negociação, foco em metas e organização de carteira.", areas: ['Empreendedor', 'Social', 'Convencional'] },
    { name: "Programador / Desenvolvedor", code: "IRC", desc: "Resolução de problemas lógicos, criação de sistemas e organização de código.", areas: ['Investigativo', 'Realista', 'Convencional'] },
    { name: "Enfermeiro(a)", code: "SIR", desc: "Cuidado clínico, suporte a pacientes e execução de protocolos médicos.", areas: ['Social', 'Investigativo', 'Realista'] },
    { name: "Contador(a)", code: "CEI", desc: "Gestão financeira, conformidade com regras e análise de viabilidade.", areas: ['Convencional', 'Empreendedor', 'Investigativo'] },
    { name: "Publicitário(a)", code: "AES", desc: "Criação de campanhas, expressão artística e entendimento social.", areas: ['Artístico', 'Empreendedor', 'Social'] },
    { name: "Fisioterapeuta", code: "SRI", desc: "Reabilitação física, cuidado direto e conhecimento biológico técnico.", areas: ['Social', 'Realista', 'Investigativo'] },
    { name: "Gerente de Projetos", code: "ECS", desc: "Coordenação de cronogramas, liderança de pessoas e foco em entrega.", areas: ['Empreendedor', 'Convencional', 'Social'] },
    { name: "Biólogo(a) / Pesquisador", code: "IRS", desc: "Estudo da natureza, coleta de dados e impacto na saúde ou ambiente.", areas: ['Investigativo', 'Realista', 'Social'] },
    { name: "Chef de Cozinha", code: "ARE", desc: "Criação gastronômica, execução técnica e gestão de equipe/restaurante.", areas: ['Artístico', 'Realista', 'Empreendedor'] },
    { name: "Analista de Marketing Digital", code: "EAC", desc: "Gestão de tráfego, criatividade em anúncios e análise de métricas.", areas: ['Empreendedor', 'Artístico', 'Convencional'] },
    { name: "Recursos Humanos (RH)", code: "SEC", desc: "Mediação de pessoas, treinamento e organização de processos internos.", areas: ['Social', 'Empreendedor', 'Convencional'] },
    { name: "Veterinário(a)", code: "RIS", desc: "Cuidado animal, diagnóstico técnico e intervenção prática.", areas: ['Realista', 'Investigativo', 'Social'] },
    { name: "Jornalista", code: "ASE", desc: "Busca por informações, escrita criativa e impacto na opinião pública.", areas: ['Artístico', 'Social', 'Empreendedor'] },
    { name: "Farmacêutico(a)", code: "ISR", desc: "Pesquisa de fármacos, análise química e suporte técnico em saúde.", areas: ['Investigativo', 'Social', 'Realista'] },
    { name: "Analista Financeiro", code: "CIE", desc: "Organização de dados, análise de tendências e suporte a decisões de negócio.", areas: ['Convencional', 'Investigativo', 'Empreendedor'] },
    { name: "Técnico em Eletrônica", code: "RIC", desc: "Manutenção de aparelhos, montagem prática e seguimento de manuais.", areas: ['Realista', 'Investigativo', 'Convencional'] },
    { name: "Tradutor(a) / Intérprete", code: "ASI", desc: "Expressão artística em línguas, mediação social e pesquisa cultural.", areas: ['Artístico', 'Social', 'Investigativo'] },
    { name: "Roteirista", code: "ASE", desc: "Criação de narrativas, diálogo constante com público e liderança criativa.", areas: ['Artístico', 'Social', 'Empreendedor'] },
    { name: "Designer de Interiores", code: "ARE", desc: "Visão artística de ambientes, execução técnica e gerência de reformas.", areas: ['Artístico', 'Realista', 'Empreendedor'] },
    { name: "Paisagista", code: "ARI", desc: "Design de áreas verdes, contato com a natureza e planejamento técnico.", areas: ['Artístico', 'Realista', 'Investigativo'] },
    { name: "Gestor Ambiental", code: "RIE", desc: "Intervenção prática na natureza, análise de riscos e liderança de projetos.", areas: ['Realista', 'Investigativo', 'Empreendedor'] },
    { name: "Corretor(a) de Imóveis", code: "ESC", desc: "Negociação de vendas, suporte social e organização de documentos.", areas: ['Empreendedor', 'Social', 'Convencional'] },
    { name: "Relações Públicas", code: "ESA", desc: "Comunicação corporativa, influência social e criação de identidade.", areas: ['Empreendedor', 'Social', 'Artístico'] },
    { name: "Sociólogo(a)", code: "IAS", desc: "Investigação social, análise de tendências e impacto comunitário.", areas: ['Investigativo', 'Artístico', 'Social'] },
    { name: "Museólogo(a)", code: "AIC", desc: "Curadoria de arte, pesquisa histórica e organização de acervos.", areas: ['Artístico', 'Investigativo', 'Convencional'] },
    { name: "Bibliotecário(a)", code: "CIS", desc: "Organização de acervos digitais e físicos, classificação e suporte à pesquisa.", areas: ['Convencional', 'Investigativo', 'Social'] },
    { name: "Arqueólogo(a)", code: "IRA", desc: "Pesquisa de civilizações antigas, trabalho de campo prático e análise histórica.", areas: ['Investigativo', 'Realista', 'Artístico'] },
    { name: "Cineasta / Realizador", code: "ASE", desc: "Direção de cinema, criação de narrativas visuais e liderança criativa.", areas: ['Artístico', 'Social', 'Empreendedor'] },
    { name: "Atleta Profissional", code: "RES", desc: "Performance física de alto nível, disciplina técnica e espírito competitivo.", areas: ['Realista', 'Empreendedor', 'Social'] },
    { name: "Piloto de Aeronaves", code: "RIC", desc: "Operação de sistemas complexos, responsabilidade técnica e foco em protocolos.", areas: ['Realista', 'Investigativo', 'Convencional'] },
    { name: "Bombeiro(a)", code: "RSE", desc: "Ação prática em emergências, salvamento de vidas e coragem operacional.", areas: ['Realista', 'Social', 'Empreendedor'] },
    { name: "Diplomata / Político", code: "EAS", desc: "Negociação internacional, representação de interesses e liderança social.", areas: ['Empreendedor', 'Artístico', 'Social'] },
    { name: "Sommelier / Mestre Cervejeiro", code: "AR", desc: "Desenvolvimento de sabores, análise técnica sensorial e criação artesanal.", areas: ['Artístico', 'Realista'] },
    { name: "Investigador Particular", code: "IER", desc: "Busca por evidências, análise de fatos ocultos e discrição técnica.", areas: ['Investigativo', 'Empreendedor', 'Realista'] },
    { name: "Designer de Games", code: "AIR", desc: "Criação de mundos virtuais, lógica de entretenimento e design de sistemas.", areas: ['Artístico', 'Investigativo', 'Realista'] },
    { name: "Nutricionista", code: "SIR", desc: "Educação alimentar, cuidado com a saúde e prescrição técnica.", areas: ['Social', 'Investigativo', 'Realista'] },
    { name: "Fonoaudiólogo(a)", code: "SIA", desc: "Terapia de comunicação, suporte a pacientes e conhecimento clínico.", areas: ['Social', 'Investigativo', 'Artístico'] },
    { name: "Estatístico(a)", code: "ICR", desc: "Cálculo de probabilidades, análise de incertezas e suporte matemático.", areas: ['Investigativo', 'Convencional', 'Realista'] },
    { name: "Corretor de Seguros", code: "ECS", desc: "Análise de riscos, negociação comercial e suporte a clientes.", areas: ['Empreendedor', 'Convencional', 'Social'] },
];

export default function ExploracaoVocacionalSection({ darkMode, initialStep, onStepChange, onComplete, onNavigate }: { darkMode?: boolean, initialStep?: string, onStepChange?: (step: string) => void, onComplete?: (resultId: string) => void, onNavigate?: (tab: any, params?: Record<string, any>) => void }) {
    const { toast } = useToast();
    const [step, setStep] = useState<'intro' | 'test' | 'results' | 'history'>((initialStep as any) || 'intro');
    const [version, setVersion] = useState<TestVersion>('medium');
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scores, setScores] = useState<Record<RIASEC, number>>({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    const [savedResults, setSavedResults] = useAppPersistence<SavedResult[]>('vocational_results', []);
    const [favoriteCareers, setFavoriteCareers] = useAppPersistence<string[]>('vocational_favorite_careers', []);
    const [isMounted, setIsMounted] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [comparisonIds, setComparisonIds] = useState<string[]>([]);
    const [careerFilter, setCareerFilter] = useState<CareerFilter>('all');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (initialStep && (initialStep as any) !== step) {
            setStep(initialStep as any);
        }
    }, [initialStep]);

    const changeStep = (newStep: 'intro' | 'test' | 'results' | 'history') => {
        setStep(newStep);
        if (onStepChange) onStepChange(newStep);
    };

    const startTest = (v: TestVersion) => {
        const questions = [...allQuestions[v]];
        // Fisher-Yates shuffle
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        setShuffledQuestions(questions);
        setVersion(v);
        changeStep('test');
        setCurrentQuestionIndex(0);
        setScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    };

    const handleAnswer = (value: number) => {
        const question = shuffledQuestions[currentQuestionIndex];
        setScores(prev => ({
            ...prev,
            [question.category]: prev[question.category] + value
        }));

        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            changeStep('results');
        }
    };

    const handleSave = () => {
        const topAreas = getTopAreas();
        const topCode = topAreas.map(([code]) => code).join('');
        const newResult: SavedResult = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            version,
            scores: { ...scores },
            topCode
        };
        setSavedResults(prev => [newResult, ...prev]);
        setSelectedHistoryId(newResult.id);
        onComplete?.(newResult.id);
        toast({ title: 'Resultado salvo', description: 'Seu perfil vocacional foi guardado no histórico.' });
    };

    const handleDeleteResult = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirmDeleteId === id) {
            setSavedResults(prev => (prev || []).filter(r => r.id !== id));
            setConfirmDeleteId(null);
            if (selectedHistoryId === id) {
                setSelectedHistoryId(null);
            }
            toast({ title: 'Resultado excluído', description: 'O teste foi removido do histórico.' });
        } else {
            setConfirmDeleteId(id);
            // Reset confirmation after 3 seconds if not clicked again
            setTimeout(() => setConfirmDeleteId(null), 3000);
        }
    };


    const getTopAreas = (customScores?: Record<RIASEC, number>) => {
        return Object.entries(customScores || scores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
    };

    // Compatibility Calculation Logic
    const calculateMatch = (profCode: string, currentScores: Record<RIASEC, number>, currentVersion: TestVersion) => {
        const areas = profCode.split('') as RIASEC[];
        const questionsPerCategory = allQuestions[currentVersion].length / 6;
        const maxScorePerCategory = questionsPerCategory * 5;
        const maxScoreForMatch = areas.length * maxScorePerCategory;

        const userScoreForAreas = areas.reduce((acc, area) => acc + (currentScores[area] || 0), 0);
        return Math.min(100, Math.round((userScoreForAreas / maxScoreForMatch) * 100));
    };

    const currentProgress = ((currentQuestionIndex + 1) / (shuffledQuestions.length || 1)) * 100;
    const latestResult = savedResults?.[0];
    const selectedHistoryResult = savedResults?.find((result) => result.id === selectedHistoryId) || latestResult;
    const comparisonResults = comparisonIds
        .map((id) => savedResults?.find((result) => result.id === id))
        .filter(Boolean) as SavedResult[];

    const matchesCareerFilter = (areas: string[]) => {
        if (careerFilter === 'all') return true;
        if (careerFilter === 'human') return areas.includes('Social');
        if (careerFilter === 'technical') return areas.includes('Investigativo') || areas.includes('Realista');
        if (careerFilter === 'creative') return areas.includes('Artístico');
        if (careerFilter === 'structured') return areas.includes('Convencional');
        return true;
    };

    const toggleFavoriteCareer = (careerName: string) => {
        const isFavorite = favoriteCareers.includes(careerName);
        const next = isFavorite
            ? favoriteCareers.filter((item) => item !== careerName)
            : [...favoriteCareers, careerName];
        setFavoriteCareers(next);
        toast({
            title: isFavorite ? 'Carreira removida' : 'Carreira favoritada',
            description: isFavorite ? 'A carreira saiu da sua shortlist.' : 'A carreira entrou na sua shortlist.'
        });
    };

    const toggleComparisonId = (id: string) => {
        setComparisonIds((prev) => {
            if (prev.includes(id)) return prev.filter((item) => item !== id);
            if (prev.length >= 2) return [prev[1], id];
            return [...prev, id];
        });
    };

    const exportResult = async () => {
        const summary = [
            `Exploração Vocacional - Perfil ${topCode}`,
            `Versão: ${version === 'rapid' ? 'Rápida' : version === 'medium' ? 'Média' : 'Completa'}`,
            '',
            'Top áreas:',
            ...topAreas.map(([code, score]) => `- ${areaNames[code as RIASEC]} (${score} pontos)`),
            '',
            primaryInsight ? `Como costuma aprender: ${primaryInsight.learn}` : '',
            primaryInsight ? `Onde tende a render melhor: ${primaryInsight.thrive}` : '',
            primaryInsight ? `O que pode desgastar: ${primaryInsight.drains}` : '',
        ].filter(Boolean).join('\n');

        try {
            await navigator.clipboard.writeText(summary);
            toast({ title: 'Resultado exportado', description: 'O resumo foi copiado para a área de transferência.' });
        } catch {
            toast({ title: 'Falha ao exportar', description: 'Não foi possível copiar o resultado agora.', variant: 'destructive' });
        }
    };

    if (step === 'intro') {
        return (
            <div className="p-6 space-y-6 animate-fade-in pb-32">
                <div className="pt-2">
                    <SectionHeroCard
                        darkMode={darkMode}
                        eyebrow="Clareza de caminho"
                        title="Exploração Vocacional"
                        description="Reconheça interesses predominantes, compare perfis e explore caminhos sem se fechar em uma única resposta."
                        icon="🧭"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {[
                        'Reconhecer interesses predominantes',
                        'Comparar combinações de perfil',
                        'Explorar caminhos profissionais com mais critério'
                    ].map((item) => (
                        <div key={item} className={`rounded-3xl px-5 py-4 text-sm font-semibold ${darkMode ? 'bg-slate-800 border border-slate-700 text-slate-200' : 'bg-white border border-slate-100 text-slate-700 shadow-sm'}`}>
                            {item}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {[
                        { id: 'rapid' as TestVersion, title: 'Versão Rápida', desc: '18 perguntas • 3 min', color: 'border-blue-200 bg-blue-50/30' },
                        { id: 'medium' as TestVersion, title: 'Versão Média', desc: '36 perguntas • 7 min', color: 'border-indigo-200 bg-indigo-50/30' },
                        { id: 'complete' as TestVersion, title: 'Versão Completa', desc: '60 perguntas • 12 min', color: 'border-purple-200 bg-purple-50/30' },
                    ].map((v) => (
                        <button
                            key={v.id}
                            onClick={() => startTest(v.id)}
                            className={`p-6 rounded-[2rem] border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${darkMode ? 'bg-slate-800 border-slate-700' : v.color}`}
                        >
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{v.title}</h3>
                            <p className="text-sm opacity-60 font-medium">{v.desc}</p>
                        </button>
                    ))}
                </div>

                {isMounted && savedResults && savedResults.length > 0 && (
                    <button
                        onClick={() => changeStep('history')}
                        className={`w-full py-5 rounded-3xl border-2 border-dashed flex items-center justify-center gap-3 font-bold transition-all active:scale-95 animate-pulse-soft ${darkMode ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}
                    >
                        <span>📂</span> Ver Resultados Salvos ({savedResults.length})
                    </button>
                )}

                <div className={`p-6 rounded-[2rem] ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
                    <h3 className="font-bold mb-3 flex items-center gap-2"><span>💡</span> Dica</h3>
                    <p className="text-sm opacity-70 leading-relaxed">
                        A ordem muda a cada teste. Se você quiser mais nuance para comparar áreas parecidas, a versão completa entrega uma leitura mais estável.
                    </p>
                </div>

                <div className={`rounded-[2rem] p-5 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Se quiser ampliar a leitura</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {[
                            { label: 'Mapa da Minha Vida', hint: 'ver propósito e outras áreas em conjunto', tab: 'mapavida' },
                            { label: 'Diário', hint: 'escrever o que chamou mais atenção no teste', tab: 'diary' },
                            { label: 'Missões', hint: 'transformar insight em próximos passos', tab: 'missions' },
                            { label: 'Inteligência Emocional', hint: 'olhar funcionamento emocional junto com carreira', tab: 'emocional' },
                        ].map((item) => (
                            <button
                                key={item.tab}
                                type="button"
                                onClick={() => onNavigate?.(item.tab)}
                                className={`rounded-[1.3rem] border p-4 min-h-[88px] text-left ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                            >
                                <p className="text-sm font-black">{item.label}</p>
                                <p className="text-xs mt-1 opacity-70">{item.hint}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'history') {
        return (
            <div className="p-6 space-y-6 animate-fade-in pb-32">
                <header className="text-center space-y-2 mb-6">
                    <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Meus Testes</h2>
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} text-sm`}>Veja o resultado mais recente, compare perfis salvos e abra o que fizer mais sentido retomar.</p>
                </header>

                {selectedHistoryResult && (
                    <div className={`rounded-[2rem] p-6 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-50 border border-indigo-100'}`}>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Resultado mais recente</p>
                                <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Perfil {selectedHistoryResult.topCode}</h3>
                                <p className="text-sm opacity-70">{selectedHistoryResult.date}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setScores(selectedHistoryResult.scores);
                                    setVersion(selectedHistoryResult.version);
                                    changeStep('results');
                                }}
                                className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white"
                            >
                                Abrir
                            </button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {Object.entries(selectedHistoryResult.scores)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3)
                                .map(([code]) => (
                                    <div key={code} className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-white/70'}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-50">Área forte</p>
                                        <p className="mt-1 text-sm font-bold">{areaNames[code as RIASEC]}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                <div className={`rounded-[2rem] p-6 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Comparar dois resultados</p>
                            <p className="mt-1 text-sm opacity-70">Marque até 2 testes para ver o que mudou entre eles.</p>
                        </div>
                        <div className="text-xs font-bold opacity-60">{comparisonIds.length}/2</div>
                    </div>
                    {comparisonResults.length === 2 && (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {comparisonResults.map((result) => (
                                <div key={result.id} className={`rounded-2xl px-4 py-4 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-50">{result.date}</p>
                                    <p className="mt-1 text-sm font-black">Perfil {result.topCode}</p>
                                    <div className="mt-3 space-y-1">
                                        {Object.entries(result.scores)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 3)
                                            .map(([code]) => (
                                                <p key={code} className="text-sm opacity-80">• {areaNames[code as RIASEC]}</p>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {savedResults.map((res) => (
                        <div
                            key={res.id}
                            onClick={() => {
                                setSelectedHistoryId(res.id);
                                setScores(res.scores);
                                setVersion(res.version);
                                changeStep('results');
                            }}
                            className={`p-6 rounded-[2rem] relative group cursor-pointer transition-all active:scale-[0.98] ${selectedHistoryId === res.id ? 'ring-2 ring-indigo-500' : ''} ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white shadow-xl border border-slate-50'}`}
                        >
                            <button
                                type="button"
                                onClick={(e) => handleDeleteResult(e, res.id)}
                                title={confirmDeleteId === res.id ? "Clique novamente para confirmar" : "Excluir resultado"}
                                className={`absolute top-4 right-4 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg border z-[100] px-3 gap-2 overflow-hidden ${confirmDeleteId === res.id
                                    ? 'bg-red-600 border-red-500 text-white w-auto animate-bounce-subtle'
                                    : darkMode
                                        ? 'bg-slate-700/80 border-slate-600 text-red-400 hover:bg-red-500 hover:text-white w-11'
                                        : 'bg-red-50 border-red-100 text-red-500 hover:bg-red-600 hover:text-white w-11'
                                    }`}
                            >
                                {confirmDeleteId === res.id ? (
                                    <span className="text-[10px] font-black uppercase whitespace-nowrap">Confirmar?</span>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                )}
                            </button>
                            <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">{res.version === 'rapid' ? 'Rápido' : res.version === 'medium' ? 'Médio' : 'Completo'}</div>
                            <h3 className={`text-xl font-black mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Perfil {res.topCode}</h3>
                            <div className="flex flex-wrap gap-1">
                                {res.topCode.split('').map(code => (
                                    <span key={code} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 dark:bg-slate-700 dark:text-slate-300">{areaNames[code]}</span>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between items-center text-[10px] font-bold opacity-40">
                                <span>{res.date}</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleComparisonId(res.id);
                                        }}
                                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${comparisonIds.includes(res.id) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        {comparisonIds.includes(res.id) ? 'Comparando' : 'Comparar'}
                                    </button>
                                    <span>Clique para ver →</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 'test') {
        const question = shuffledQuestions[currentQuestionIndex];
        if (!question) return null;
        return (
            <div className="p-6 space-y-8 animate-fade-in">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-indigo-500">
                        <span>{version === 'rapid' ? 'Rápido' : version === 'medium' ? 'Médio' : 'Completo'}</span>
                        <span>{currentQuestionIndex + 1} / {shuffledQuestions.length}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                            style={{ width: `${currentProgress}%` }}
                        />
                    </div>
                </div>

                <div className="min-h-[200px] flex items-center justify-center text-center px-4">
                    <h3 className={`text-2xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        "{question.text}"
                    </h3>
                </div>

                <div className={`rounded-3xl p-4 text-sm ${darkMode ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-slate-50 border border-slate-100 text-slate-600'}`}>
                    Responda pensando no que tende a te energizar no longo prazo, não só no que você consegue fazer por obrigação.
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {[
                        { label: 'Nada a ver comigo', value: 1, color: 'hover:bg-red-50 hover:text-red-600 border-red-100' },
                        { label: 'Um pouco', value: 2, color: 'hover:bg-orange-50 hover:text-orange-600 border-orange-100' },
                        { label: 'Neutro', value: 3, color: 'hover:bg-slate-50 hover:text-slate-600 border-slate-100' },
                        { label: 'Bastante', value: 4, color: 'hover:bg-blue-50 hover:text-blue-600 border-blue-100' },
                        { label: 'Muito a ver comigo', value: 5, color: 'hover:bg-emerald-50 hover:text-emerald-600 border-emerald-100' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleAnswer(opt.value)}
                            className={`w-full py-4 px-6 rounded-2xl border-2 text-left font-bold transition-all active:scale-[0.98] ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white text-slate-700'} ${opt.color}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const topAreas = getTopAreas();
    const topCode = topAreas.map(([code]) => code).join('');
    const primaryArea = topAreas[0]?.[0] as RIASEC | undefined;
    const secondaryArea = topAreas[1]?.[0] as RIASEC | undefined;
    const primaryInsight = primaryArea ? profileInsights[primaryArea] : null;

    return (
        <div className="p-6 space-y-8 animate-fade-in pb-32">
            <header className="flex flex-col items-center">
                <div className="flex-1 text-center">
                    <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Seu Resultado</h2>
                    <p className="text-indigo-500 font-bold uppercase tracking-widest text-[10px]">Perfil RIASEC</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {topAreas.map(([code, score], idx) => {
                    const questionsCount = allQuestions[version].length;
                    const percentage = Math.min(100, Math.round((score / (questionsCount / 6 * 5)) * 100));

                    return (
                        <div key={code} className={`p-5 rounded-3xl flex items-center justify-between shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${areaColors[code as RIASEC]} text-white flex items-center justify-center font-black text-xl shadow-lg`}>
                                    {code}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{areaNames[code as RIASEC]}</h4>
                                    <p className="text-xs opacity-60">{idx === 0 ? 'Área Predominante' : 'Forte Afinidade'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-indigo-500">{percentage}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-200">
                <h3 className="font-bold flex items-center gap-2 mb-2"><span>🎯</span> Síntese do Perfil</h3>
                <p className="text-sm leading-relaxed opacity-90">
                    Sua combinação favorece carreiras que unem {topAreas.map(([code], i) => {
                        const names: Record<string, string> = { R: 'prática', I: 'análise', A: 'criatividade', S: 'relação humana', E: 'liderança', C: 'organização' };
                        return names[code] + (i === 1 ? ' e ' : i === 0 ? ', ' : '');
                    }).join('')}.
                </p>
            </div>

            {primaryInsight && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={`rounded-[2rem] p-5 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-50 shadow-sm'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Como costuma aprender</p>
                        <p className="mt-2 text-sm leading-relaxed">{primaryInsight.learn}</p>
                    </div>
                    <div className={`rounded-[2rem] p-5 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-50 shadow-sm'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Onde tende a render melhor</p>
                        <p className="mt-2 text-sm leading-relaxed">{primaryInsight.thrive}</p>
                    </div>
                    <div className={`rounded-[2rem] p-5 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-50 shadow-sm'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">O que pode desgastar</p>
                        <p className="mt-2 text-sm leading-relaxed">{primaryInsight.drains}</p>
                    </div>
                    <div className={`rounded-[2rem] p-5 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-50 shadow-sm'}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Próximos passos de exploração</p>
                        <div className="mt-2 space-y-2 text-sm leading-relaxed">
                            {primaryInsight.next.map((item) => (
                                <p key={item}>• {item}</p>
                            ))}
                            {secondaryArea && <p>• Compare isso com contextos ligados a {areaNames[secondaryArea]}.</p>}
                        </div>
                    </div>
                </div>
            )}

            <div className={`rounded-[2rem] p-5 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-50 border border-indigo-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Próximo passo no app</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {[
                        { label: 'Levar para o Diário', hint: 'registrar dúvidas, interesses e resistências', tab: 'diary' },
                        { label: 'Abrir Mapa da Minha Vida', hint: 'comparar carreira com propósito e energia', tab: 'mapavida' },
                        { label: 'Transformar em Missão', hint: 'testar um passo concreto nesta semana', tab: 'missions' },
                        { label: 'Cruzar com Inteligência Emocional', hint: 'entender como você funciona ao aprender e decidir', tab: 'emocional' },
                    ].map((item) => (
                        <button
                            key={item.tab}
                            type="button"
                            onClick={() => onNavigate?.(item.tab)}
                            className={`rounded-[1.3rem] border p-4 min-h-[88px] text-left ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-white text-slate-700'}`}
                        >
                            <p className="text-sm font-black">{item.label}</p>
                            <p className="text-xs mt-1 opacity-70">{item.hint}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-3">
                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Carreiras Compatíveis</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'all' as CareerFilter, label: 'Todas' },
                            { id: 'human' as CareerFilter, label: 'Mais humano' },
                            { id: 'technical' as CareerFilter, label: 'Mais técnico' },
                            { id: 'creative' as CareerFilter, label: 'Mais criativo' },
                            { id: 'structured' as CareerFilter, label: 'Mais estruturado' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setCareerFilter(filter.id)}
                                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${careerFilter === filter.id ? 'bg-indigo-600 text-white' : darkMode ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-white border border-slate-100 text-slate-600'}`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    {favoriteCareers.length > 0 && (
                        <div className={`rounded-3xl p-4 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-amber-50 border border-amber-100'}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">Sua shortlist</p>
                            <p className="mt-2 text-sm leading-relaxed">{favoriteCareers.join(' • ')}</p>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {professions
                        .map(prof => ({
                            ...prof,
                            match: calculateMatch(prof.code, scores, version)
                        }))
                        .filter(prof => matchesCareerFilter(prof.areas))
                        .filter(prof => prof.match > 40) // Threshold for relevance
                        .sort((a, b) => b.match - a.match) // Sort by compatibility
                        .map((prof) => (
                            <div key={prof.name} className={`p-6 rounded-[2rem] border-l-8 transition-all overflow-hidden ${prof.match > 85 ? 'border-emerald-500' : prof.match > 70 ? 'border-indigo-500' : 'border-slate-400'} ${darkMode ? 'bg-slate-800 border-y border-r border-slate-700' : 'bg-white shadow-xl border border-slate-50'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-black text-lg">{prof.name}</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {prof.areas.map(a => (
                                                <span key={a} className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full uppercase tracking-tighter">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xl font-black ${prof.match > 85 ? 'text-emerald-500' : prof.match > 70 ? 'text-indigo-500' : 'text-slate-500'}`}>
                                            {prof.match}%
                                        </div>
                                        <div className="text-[8px] font-bold uppercase opacity-40">Compatível</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleFavoriteCareer(prof.name)}
                                    className={`mt-3 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${favoriteCareers.includes(prof.name) ? 'bg-amber-500 text-white' : darkMode ? 'bg-slate-900 border border-slate-700 text-slate-200' : 'bg-amber-50 border border-amber-100 text-amber-700'}`}
                                >
                                    {favoriteCareers.includes(prof.name) ? 'Na shortlist' : 'Favoritar carreira'}
                                </button>
                                <p className="text-sm opacity-70 mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">{prof.desc}</p>
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-500">Por que combina</p>
                                        <p className="mt-1 text-sm opacity-80">
                                            Essa combinação se aproxima de quem mistura {prof.areas.slice(0, 2).join(' e ').toLowerCase()} no dia a dia.
                                        </p>
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-500">Estilo de rotina</p>
                                        <p className="mt-1 text-sm opacity-80">
                                            {prof.areas.includes('Convencional') ? 'Rotina mais estruturada, com processo e previsibilidade.' : prof.areas.includes('Empreendedor') ? 'Rotina dinâmica, com decisão, ritmo e interação frequente.' : 'Rotina mista, equilibrando aprofundamento e execução.'}
                                        </p>
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-500">Tipo de contato</p>
                                        <p className="mt-1 text-sm opacity-80">
                                            {prof.areas.includes('Social') ? 'Contato humano relevante e leitura constante de pessoas.' : prof.areas.includes('Investigativo') ? 'Contato mais técnico, com análise e profundidade.' : 'Contato equilibrado entre execução, coordenação e entrega.'}
                                        </p>
                                    </div>
                                    <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-100'}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-500">Estrutura x autonomia</p>
                                        <p className="mt-1 text-sm opacity-80">
                                            {prof.areas.includes('Artístico') ? 'Tende a pedir mais autonomia e espaço de autoria.' : prof.areas.includes('Convencional') ? 'Tende a pedir mais processo, regra e consistência.' : 'Equilíbrio entre orientação clara e margem de decisão.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={() => setStep('intro')}
                    className="w-full py-4 rounded-3xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                    Novo Teste
                </button>
                <button
                    onClick={exportResult}
                    className={`w-full py-4 rounded-3xl font-bold transition-all active:scale-95 ${darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-slate-100 text-slate-700'}`}
                >
                    Exportar Resultado
                </button>
                <button
                    onClick={handleSave}
                    className={`w-full py-4 rounded-3xl font-bold transition-all active:scale-95 ${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                    Salvar Resultado no Histórico
                </button>
            </div>
        </div>
    );
}
