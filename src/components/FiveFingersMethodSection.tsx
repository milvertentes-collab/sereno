'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import SectionHeroCard from './SectionHeroCard';

type Step = 'intro' | 'thumb' | 'index' | 'middle' | 'ring' | 'little' | 'final';
type FiveFingersMode = 'geral' | 'casal' | 'familia';

interface FiveFingersMethodSectionProps {
  darkMode?: boolean;
  initialStep?: string;
  onStepChange?: (step: string) => void;
  onNavigate?: (tab: any, params?: Record<string, any>) => void;
  onComplete?: (entryId: string) => void;
}

type FingerKey = 'thumbSelf' | 'thumbOther' | 'indexFact' | 'middleFeeling' | 'ringNeed' | 'littleRequest';
type HistoryEntry = {
  id: number;
  createdAt: string;
  mode: FiveFingersMode;
  selectedContext: string;
  answers: Record<FingerKey, string>;
  finalMessage: string;
};

const fingerOrder: Step[] = ['thumb', 'index', 'middle', 'ring', 'little'];
const fullFlow: Step[] = ['intro', ...fingerOrder, 'final'];

const modeOptions: { id: FiveFingersMode; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'casal', label: 'Casal' },
  { id: 'familia', label: 'Família' },
];

const usageContexts: Record<FiveFingersMode, readonly string[]> = {
  geral: [
    'Conflito em andamento',
    'Conversa difícil',
    'Mal-entendido',
    'Preparo antes de falar com alguém',
  ] as const,
  casal: [
    'Conversa sobre mágoa no vínculo',
    'Discussão recorrente',
    'Pedido de mais presença',
    'Reparo depois de um conflito',
  ] as const,
  familia: [
    'Convivência tensa',
    'Pedido que pesou',
    'Limite com familiar',
    'Conversa de reparo em casa',
  ] as const,
};

const stepContentByMode: Record<
  FiveFingersMode,
  Record<
    Exclude<Step, 'intro' | 'final'>,
    {
      title: string;
      role: string;
      questions: string[];
      placeholders: string[];
      fields: FingerKey[];
      examples: string[];
      chips?: string[];
    }
  >
> = {
  geral: {
    thumb: {
      title: '👍 Polegar',
      role: 'Reconhecimento sem ironia',
      questions: [
        'O que eu consigo reconhecer em mim neste momento?',
        'O que ainda consigo reconhecer no outro, mesmo com a dificuldade?',
      ],
      placeholders: ['Em mim eu reconheço...', 'No outro eu reconheço...'],
      fields: ['thumbSelf', 'thumbOther'],
      examples: [
        'Exemplo: eu estou tentando falar disso com mais cuidado.',
        'Exemplo: o outro talvez esteja cansado ou defensivo, não necessariamente contra mim.',
      ],
      chips: ['Coragem', 'Esforço', 'Cansaço', 'Boa intenção', 'Tentativa de diálogo', 'Limite'],
    },
    index: {
      title: '👉 Indicador',
      role: 'Fato sem acusação',
      questions: [
        'O que aconteceu de forma objetiva?',
        'Como eu descreveria isso sem exagero nem ataque?',
      ],
      placeholders: ['Quando aconteceu, o fato foi...'],
      fields: ['indexFact'],
      examples: [
        'Exemplo: você saiu da conversa enquanto eu ainda estava falando.',
        'Exemplo: combinamos uma coisa e ela não aconteceu.',
      ],
      chips: ['Interrompeu', 'Não respondeu', 'Mudou o combinado', 'Elevou o tom', 'Se afastou', 'Cobrou em excesso'],
    },
    middle: {
      title: '🖕 Médio',
      role: 'Sentimento sem ataque',
      questions: ['O que eu senti com isso?', 'Qual impacto emocional isso teve em mim?'],
      placeholders: ['Eu me senti...'],
      fields: ['middleFeeling'],
      examples: [
        'Exemplo: eu me senti desvalorizado(a), confuso(a) e tenso(a).',
        'Exemplo: isso me deixou frustrado(a), não com vontade de atacar.',
      ],
      chips: ['Tristeza', 'Raiva', 'Frustração', 'Medo', 'Ansiedade', 'Culpa', 'Vergonha', 'Confusão', 'Decepção', 'Alívio'],
    },
    ring: {
      title: '💍 Anelar',
      role: 'Necessidade ou valor',
      questions: ['O que isso tocou em mim?', 'Do que eu preciso ou o que eu valorizo aqui?'],
      placeholders: ['Eu preciso de...', 'Aqui é importante para mim...'],
      fields: ['ringNeed'],
      examples: [
        'Exemplo: eu preciso de previsibilidade e respeito no jeito de falar comigo.',
        'Exemplo: para mim, clareza e consideração importam mais do que ganhar a discussão.',
      ],
      chips: ['Respeito', 'Clareza', 'Previsibilidade', 'Escuta', 'Cuidado', 'Tempo', 'Espaço', 'Segurança'],
    },
    little: {
      title: '🤏 Mindinho',
      role: 'Pedido concreto',
      questions: ['O que eu quero pedir com clareza?', 'Qual é o próximo passo mais simples e realista?'],
      placeholders: ['Da próxima vez, eu peço que...', 'Meu pedido concreto é...'],
      fields: ['littleRequest'],
      examples: [
        'Exemplo: se precisar se afastar, me avise em vez de sumir da conversa.',
        'Exemplo: vamos retomar isso amanhã, com os dois mais calmos.',
      ],
      chips: ['Me avise antes', 'Fale sem elevar o tom', 'Retomamos depois', 'Preciso de pausa', 'Vamos combinar melhor', 'Quero ser ouvido(a)'],
    },
  },
  casal: {
    thumb: {
      title: '👍 Polegar',
      role: 'Reconhecimento no vínculo',
      questions: ['O que eu reconheço em mim nessa relação?', 'O que ainda consigo reconhecer no parceiro(a)?'],
      placeholders: ['Em mim eu reconheço...', 'No meu parceiro(a) eu reconheço...'],
      fields: ['thumbSelf', 'thumbOther'],
      examples: [
        'Exemplo: eu estou tentando trazer isso antes de virar ressentimento.',
        'Exemplo: eu ainda consigo ver esforço ou carinho no outro, mesmo com o conflito.',
      ],
      chips: ['Carinho', 'Esforço', 'Tentativa', 'Vínculo', 'Presença', 'Boa intenção'],
    },
    index: {
      title: '👉 Indicador',
      role: 'Fato sem acusação',
      questions: ['O que aconteceu entre nós de forma objetiva?', 'Qual comportamento eu quero nomear sem virar ataque?'],
      placeholders: ['O que aconteceu foi...'],
      fields: ['indexFact'],
      examples: [
        'Exemplo: quando eu falei disso, você mudou de assunto e saiu da conversa.',
        'Exemplo: combinamos um tempo juntos e isso foi deixado de lado sem aviso.',
      ],
      chips: ['Mudou de assunto', 'Se afastou', 'Não avisou', 'Elevou o tom', 'Ironizou', 'Invalidou'],
    },
    middle: {
      title: '🖕 Médio',
      role: 'Sentimento sem ataque',
      questions: ['Como isso me fez sentir no vínculo?', 'O que ficou em mim depois dessa situação?'],
      placeholders: ['Eu me senti...'],
      fields: ['middleFeeling'],
      examples: [
        'Exemplo: eu me senti sozinho(a), inseguro(a) e pouco importante.',
        'Exemplo: isso me deixou magoado(a), não com vontade de ferir de volta.',
      ],
      chips: ['Magoado(a)', 'Sozinho(a)', 'Inseguro(a)', 'Frustrado(a)', 'Triste', 'Confuso(a)'],
    },
    ring: {
      title: '💍 Anelar',
      role: 'Necessidade afetiva',
      questions: ['O que eu preciso nessa relação?', 'Que valor do vínculo está sendo tocado aqui?'],
      placeholders: ['Eu preciso de...', 'Para mim é importante...'],
      fields: ['ringNeed'],
      examples: [
        'Exemplo: eu preciso de mais constância e previsibilidade entre nós.',
        'Exemplo: para mim, cuidado e escuta contam mais do que estar certo(a).',
      ],
      chips: ['Presença', 'Escuta', 'Previsibilidade', 'Afeto', 'Reparo', 'Respeito'],
    },
    little: {
      title: '🤏 Mindinho',
      role: 'Pedido concreto',
      questions: ['O que eu quero pedir ao meu parceiro(a)?', 'Qual combinado pequeno e realista faz sentido agora?'],
      placeholders: ['Meu pedido para nós é...', 'O combinado que eu proponho é...'],
      fields: ['littleRequest'],
      examples: [
        'Exemplo: quando isso acontecer, quero que você me avise em vez de se fechar.',
        'Exemplo: vamos retomar essa conversa em outro momento, mas sem fugir dela.',
      ],
      chips: ['Me avise', 'Retomamos depois', 'Quero escuta', 'Sem ironia', 'Vamos combinar melhor', 'Preciso de presença'],
    },
  },
  familia: {
    thumb: {
      title: '👍 Polegar',
      role: 'Reconhecimento na convivência',
      questions: ['O que eu reconheço em mim nessa convivência?', 'O que ainda consigo reconhecer no familiar?'],
      placeholders: ['Em mim eu reconheço...', 'No familiar eu reconheço...'],
      fields: ['thumbSelf', 'thumbOther'],
      examples: [
        'Exemplo: eu estou tentando conversar sem repetir velhos ataques.',
        'Exemplo: talvez o outro também esteja trazendo a própria história para isso.',
      ],
      chips: ['Esforço', 'Cuidado', 'História', 'Tentativa', 'Presença', 'Limite'],
    },
    index: {
      title: '👉 Indicador',
      role: 'Fato sem acusação',
      questions: ['O que aconteceu em casa ou na família?', 'Como eu nomeio o fato sem generalizar?'],
      placeholders: ['O fato foi...'],
      fields: ['indexFact'],
      examples: [
        'Exemplo: quando eu disse que não podia, isso foi tratado como descaso.',
        'Exemplo: meu limite foi ignorado e a cobrança continuou.',
      ],
      chips: ['Cobrou', 'Ignorou meu limite', 'Interrompeu', 'Fez pressão', 'Comparou', 'Desqualificou'],
    },
    middle: {
      title: '🖕 Médio',
      role: 'Sentimento sem ataque',
      questions: ['Como eu me senti nessa convivência?', 'Qual foi o impacto emocional disso em mim?'],
      placeholders: ['Eu me senti...'],
      fields: ['middleFeeling'],
      examples: [
        'Exemplo: eu me senti pequeno(a), pressionado(a) e cansado(a).',
        'Exemplo: isso me deixou ferido(a), não com vontade de humilhar ninguém.',
      ],
      chips: ['Pressionado(a)', 'Cansado(a)', 'Ferido(a)', 'Com raiva', 'Triste', 'Sobrecarregado(a)'],
    },
    ring: {
      title: '💍 Anelar',
      role: 'Necessidade ou valor',
      questions: ['Do que eu preciso nessa convivência?', 'Que valor familiar está sendo tocado aqui?'],
      placeholders: ['Eu preciso de...', 'Para mim é importante...'],
      fields: ['ringNeed'],
      examples: [
        'Exemplo: eu preciso que meu limite seja levado a sério.',
        'Exemplo: para mim, respeito importa mais do que concordar com tudo.',
      ],
      chips: ['Respeito', 'Espaço', 'Escuta', 'Limite', 'Consideração', 'Tranquilidade'],
    },
    little: {
      title: '🤏 Mindinho',
      role: 'Pedido concreto',
      questions: ['O que eu quero pedir ao familiar?', 'Qual combinado pequeno faz sentido aqui?'],
      placeholders: ['Meu pedido é...', 'O combinado possível é...'],
      fields: ['littleRequest'],
      examples: [
        'Exemplo: quando eu disser que não posso, quero que isso não vire insistência.',
        'Exemplo: se esse assunto subir de tom, prefiro retomar depois.',
      ],
      chips: ['Respeite meu não', 'Retomamos depois', 'Sem insistência', 'Preciso de pausa', 'Fale com calma', 'Me escute até o fim'],
    },
  },
};

export default function FiveFingersMethodSection({
  darkMode,
  initialStep,
  onStepChange,
  onNavigate,
  onComplete,
}: FiveFingersMethodSectionProps) {
  const [step, setStep] = useState<Step>((initialStep as Step) || 'intro');
  const [mode, setMode] = useState<FiveFingersMode>('geral');
  const [selectedContext, setSelectedContext] = useState<string>(usageContexts.geral[1]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<FingerKey, string>>({
    thumbSelf: '',
    thumbOther: '',
    indexFact: '',
    middleFeeling: '',
    ringNeed: '',
    littleRequest: '',
  });

  useEffect(() => {
    if (initialStep && initialStep !== step) {
      setStep(initialStep as Step);
    }
  }, [initialStep, step]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('psico_five_fingers_history');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('psico_five_fingers_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!usageContexts[mode].includes(selectedContext as any)) {
      setSelectedContext(usageContexts[mode][0]);
    }
  }, [mode, selectedContext]);

  const changeStep = (newStep: Step) => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  const activeIndex = fingerOrder.indexOf(step as Exclude<Step, 'intro' | 'final'>);
  const current = step !== 'intro' && step !== 'final' ? stepContentByMode[mode][step] : null;

  const finalMessage = useMemo(() => {
    const introPart = answers.thumbSelf || answers.thumbOther
      ? `Eu reconheço ${answers.thumbSelf || 'meu esforço'} e também ${answers.thumbOther || 'algum contexto do outro'}.`
      : '';
    const factPart = answers.indexFact ? ` O fato foi: ${answers.indexFact}.` : '';
    const feelingPart = answers.middleFeeling ? ` Isso me fez sentir ${answers.middleFeeling}.` : '';
    const needPart = answers.ringNeed ? ` O que eu preciso aqui é ${answers.ringNeed}.` : '';
    const requestPart = answers.littleRequest ? ` Meu pedido concreto é: ${answers.littleRequest}.` : '';
    return `${introPart}${factPart}${feelingPart}${needPart}${requestPart}`.trim() || 'Sua síntese vai aparecer aqui quando os dedos forem preenchidos.';
  }, [answers]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('pt-BR');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('Resumo: Método dos 5 Dedos', 20, 24);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Data da prática: ${dateStr}`, 20, 33);
    doc.text(`Contexto: ${selectedContext}`, 20, 39);

    let yPos = 52;
    const sections = [
      { label: 'Polegar', text: `${answers.thumbSelf || 'Não preenchido'} | ${answers.thumbOther || 'Não preenchido'}` },
      { label: 'Indicador', text: answers.indexFact || 'Não preenchido' },
      { label: 'Médio', text: answers.middleFeeling || 'Não preenchido' },
      { label: 'Anelar', text: answers.ringNeed || 'Não preenchido' },
      { label: 'Mindinho', text: answers.littleRequest || 'Não preenchido' },
      { label: 'Síntese final', text: finalMessage },
    ];

    sections.forEach((section) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(section.label, 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      const split = doc.splitTextToSize(section.text, 165);
      doc.text(split, 20, yPos);
      yPos += split.length * 7 + 10;

      if (yPos > 270) {
        doc.addPage();
        yPos = 24;
      }
    });

    doc.save(`metodo_5_dedos_${dateStr.replace(/\//g, '-')}.pdf`);
  };

  const applyChip = (field: FingerKey, chip: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}, ${chip.toLowerCase()}` : chip,
    }));
  };

  const goNext = () => {
    const currentIndex = fullFlow.indexOf(step);
    if (currentIndex < fullFlow.length - 1) changeStep(fullFlow[currentIndex + 1]);
  };

  const goBack = () => {
    const currentIndex = fullFlow.indexOf(step);
    if (currentIndex > 0) changeStep(fullFlow[currentIndex - 1]);
  };

  const saveCurrentPractice = () => {
    if (!finalMessage || finalMessage === 'Sua síntese vai aparecer aqui quando os dedos forem preenchidos.') return;
    const isNewEntry = editingHistoryId === null;
    const entry: HistoryEntry = {
      id: editingHistoryId ?? Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      selectedContext,
      answers,
      finalMessage,
    };
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== entry.id);
      return [entry, ...next].slice(0, 10);
    });
    setEditingHistoryId(entry.id);
    if (isNewEntry) onComplete?.(String(entry.id));
  };

  useEffect(() => {
    if (step === 'final' && finalMessage !== 'Sua síntese vai aparecer aqui quando os dedos forem preenchidos.') {
      saveCurrentPractice();
    }
  }, [step, finalMessage]);

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setMode(entry.mode);
    setSelectedContext(entry.selectedContext);
    setAnswers(entry.answers);
    setEditingHistoryId(entry.id);
    changeStep('final');
  };

  const deleteHistoryEntry = (id: number) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (editingHistoryId === id) {
      clearCurrent();
    }
  };

  const clearCurrent = () => {
    setEditingHistoryId(null);
    setAnswers({
      thumbSelf: '',
      thumbOther: '',
      indexFact: '',
      middleFeeling: '',
      ringNeed: '',
      littleRequest: '',
    });
    setMode('geral');
    setSelectedContext(usageContexts.geral[1]);
    changeStep('intro');
  };

  const renderHand = (activeFinger: Exclude<Step, 'intro' | 'final'>) => {
    const fingerMeta = [
      { id: 'thumb', label: 'Polegar', height: 'h-16', left: 'left-2', angle: '-rotate-12' },
      { id: 'index', label: 'Indicador', height: 'h-28', left: 'left-14', angle: '' },
      { id: 'middle', label: 'Médio', height: 'h-32', left: 'left-24', angle: '' },
      { id: 'ring', label: 'Anelar', height: 'h-28', left: 'left-36', angle: '' },
      { id: 'little', label: 'Mindinho', height: 'h-18', left: 'left-48', angle: 'rotate-6' },
    ] as const;

    return (
      <div className="flex justify-center mb-6">
        <div className="relative w-72 h-48">
          <div className={`absolute bottom-0 left-10 w-40 h-24 rounded-t-[3.5rem] rounded-b-[1.5rem] border-2 ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-orange-100 border-orange-200'}`} />
          {fingerMeta.map((finger) => {
            const isActive = activeFinger === finger.id;
            return (
              <div
                key={finger.id}
                className={`absolute bottom-20 ${finger.left} w-9 ${finger.height} ${finger.angle} rounded-full border-2 transition-all duration-300 ${
                  isActive
                    ? darkMode
                      ? 'bg-indigo-500 border-indigo-300 -translate-y-3 scale-110 shadow-[0_0_18px_rgba(99,102,241,0.45)]'
                      : 'bg-indigo-400 border-indigo-300 -translate-y-3 scale-110 shadow-lg'
                    : darkMode
                      ? 'bg-slate-700 border-slate-600 opacity-50'
                      : 'bg-orange-100 border-orange-200 opacity-60'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white whitespace-nowrap">
                    {finger.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (step === 'intro') {
    return (
      <div className="p-6 pb-28 max-w-lg mx-auto space-y-6 animate-fade-in">
        <div className="pt-4">
          <SectionHeroCard
            darkMode={darkMode}
            eyebrow="Comunicação com clareza"
            title="Método dos 5 Dedos"
            description="Estruture uma conversa difícil com mais clareza emocional, menos ataque e um pedido concreto no final."
            icon="✋"
          />
        </div>

        {history.length > 0 && (
          <button
            onClick={() => loadHistoryEntry(history[0])}
            className={`w-full rounded-3xl border p-4 text-left ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Abrir histórico</p>
            <p className="mt-2 text-sm font-bold">Retomar última prática salva</p>
            <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {history[0].mode === 'geral' ? 'Geral' : history[0].mode === 'casal' ? 'Casal' : 'Família'} • {history[0].selectedContext}
            </p>
          </button>
        )}

        <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Modo da prática</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {modeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setMode(option.id)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                  mode === option.id
                    ? 'bg-fuchsia-600 text-white'
                    : darkMode
                      ? 'bg-slate-900 text-slate-300'
                      : 'bg-slate-50 text-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Escolha o contexto da prática</p>
          <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Selecione abaixo a situação que mais parece com o que você quer organizar agora.
          </p>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${darkMode ? 'bg-indigo-950/40 text-indigo-200' : 'bg-indigo-50 text-indigo-700'}`}>
            Contexto atual: {selectedContext}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {usageContexts[mode].map((context) => (
              <button
                key={context}
                onClick={() => setSelectedContext(context)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold text-left ${
                  selectedContext === context
                    ? 'bg-indigo-600 text-white'
                    : darkMode
                      ? 'bg-slate-900 text-slate-300'
                      : 'bg-slate-50 text-slate-700'
                }`}
              >
                {context}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-indigo-950/25 border-indigo-800/40' : 'bg-indigo-50 border-indigo-100'}`}>
          <p className={`text-sm font-semibold leading-relaxed ${darkMode ? 'text-indigo-100' : 'text-indigo-900'}`}>
            Cinco passos: reconhecer, nomear o fato, sentir, entender a necessidade e pedir com clareza.
          </p>
        </div>

        <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Se quiser seguir daqui</p>
          <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Abra outro recurso quando a conversa pedir mais limite, leitura afetiva ou um espaço próprio do vínculo.
          </p>
        </div>

        <div className="grid gap-3">
          <QuickLink darkMode={!!darkMode} title="Falas Tóxicas" text="Para perceber pressão e manipulação antes de conversar." onClick={() => onNavigate?.('toxicthoughts')} />
          <QuickLink darkMode={!!darkMode} title="O Poder do NÃO" text="Para treinar limite quando o pedido concreto precisar ser um não." onClick={() => onNavigate?.('assertiveness')} />
          <QuickLink darkMode={!!darkMode} title="Linguagens do Amor" text="Ajuda quando a conversa difícil passa por afeto, reconhecimento ou desencontro de cuidado." onClick={() => onNavigate?.('lovelanguages')} />
          <QuickLink darkMode={!!darkMode} title={mode === 'casal' ? 'Modo Casal' : 'Modo Família'} text={mode === 'casal' ? 'Útil quando a conversa envolve intimidade, reparo ou rotina a dois.' : 'Útil quando a conversa envolve convivência, tensão familiar ou combinados.'} onClick={() => onNavigate?.(mode === 'casal' ? 'couple' : 'family')} />
        </div>

        {history.length > 0 && (
          <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Histórico recente</p>
            <div className="grid gap-3 mt-4">
              {history.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                >
                  <button onClick={() => loadHistoryEntry(entry)} className="w-full text-left">
                    <p className="text-sm font-bold">{entry.mode === 'geral' ? 'Geral' : entry.mode === 'casal' ? 'Casal' : 'Família'} • {entry.selectedContext}</p>
                    <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(entry.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p className={`mt-2 text-sm line-clamp-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{entry.finalMessage}</p>
                  </button>
                  <button
                    onClick={() => deleteHistoryEntry(entry.id)}
                    className={`mt-3 w-full rounded-xl py-2 text-sm font-bold ${darkMode ? 'bg-rose-950/40 text-rose-200 border border-rose-900/50' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={goNext}
          className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-xl active:scale-95 transition-all"
        >
          Começar prática guiada
        </button>
      </div>
    );
  }

  if (step === 'final') {
    return (
      <div className="p-6 pb-28 max-w-lg mx-auto space-y-5 animate-fade-in">
        <div className="text-center space-y-2 pt-4">
          <div className="text-5xl">✨</div>
          <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Síntese pronta</h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Use isso para revisar, conversar ou levar para outro recurso.</p>
        </div>

        <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-indigo-950/25 border-indigo-800/40' : 'bg-indigo-50 border-indigo-100'}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>Comunicação montada</p>
          <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-indigo-50' : 'text-slate-800'}`}>{finalMessage}</p>
        </div>

        {fingerOrder.map((finger) => {
          const content = stepContentByMode[mode][finger];
          const text = content.fields.map((field) => answers[field]).filter(Boolean).join(' | ');
          return (
            <div key={finger} className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{content.title}</p>
              <p className="mt-2 text-sm font-bold">{content.role}</p>
              <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{text || 'Não preenchido'}</p>
            </div>
          );
        })}

        <div className="grid gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(finalMessage)}
            className="w-full py-4 rounded-2xl font-bold bg-emerald-600 text-white"
          >
            Copiar comunicação
          </button>
          <button
            onClick={() => onNavigate?.('diary', {
              diaryMode: 'quick',
              diaryDraft: `Método dos 5 Dedos\n\nContexto: ${selectedContext}\n\nSíntese:\n${finalMessage}`,
              diaryDraftKey: Date.now(),
            })}
            className="w-full py-4 rounded-2xl font-bold bg-indigo-600 text-white"
          >
            Levar para o Diário
          </button>
          <button
            onClick={() => onNavigate?.('carta', {
              cartaType: 'personalizada',
              cartaDraft: `Quero elaborar melhor esta conversa:\n\nContexto: ${selectedContext}\n\nO que eu consegui nomear:\n${finalMessage}`,
            })}
            className="w-full py-4 rounded-2xl font-bold bg-fuchsia-600 text-white"
          >
            Levar para Carta
          </button>
          <button
            onClick={downloadPDF}
            className="w-full py-4 rounded-2xl font-bold bg-slate-700 text-white"
          >
            Baixar em PDF
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={goBack}
            className={`w-full py-4 rounded-2xl font-bold ${darkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}
          >
            Voltar
          </button>
          <button
            onClick={clearCurrent}
            className={`w-full py-4 rounded-2xl font-bold ${darkMode ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-900'}`}
          >
            Reiniciar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-28 max-w-lg mx-auto space-y-5 animate-fade-in">
      {renderHand(step)}

      <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Etapa {activeIndex + 1}/5</p>
            <h2 className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{current?.title}</h2>
            <p className={`mt-1 text-sm font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{current?.role}</p>
          </div>
          <div className={`rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {selectedContext}
          </div>
        </div>
        <div className={`mt-4 h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((activeIndex + 1) / 5) * 100}%` }} />
        </div>
      </div>

      <div className={`rounded-3xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="space-y-2">
          {current?.questions.map((q) => (
            <p key={q} className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{q}</p>
          ))}
        </div>
        <div className={`mt-4 rounded-2xl p-4 ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
          {current?.examples.map((example) => (
            <p key={example} className="text-sm leading-relaxed">{example}</p>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {current?.fields.map((field, index) => (
          <div key={field} className={`rounded-3xl border p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className={`text-xs font-black uppercase tracking-[0.14em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Exemplo de resposta</p>
            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{current.examples[index] || current.examples[0]}</p>
            <textarea
              value={answers[field]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [field]: e.target.value }))}
              placeholder={current.placeholders[index] || current.placeholders[0]}
              className={`mt-4 w-full min-h-[110px] resize-none rounded-[1.75rem] border-2 p-5 text-sm leading-relaxed transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'}`}
            />
          </div>
        ))}
      </div>

      {current?.chips && (
        <div className={`rounded-3xl border p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs font-black uppercase tracking-[0.14em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Apoios rápidos</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {current.chips.map((chip) => (
              <button
                key={chip}
                onClick={() => applyChip(current.fields[0], chip)}
                className={`px-4 py-2 rounded-full text-xs font-bold ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-indigo-50 text-indigo-700'}`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={goBack}
          className={`w-full py-4 rounded-2xl font-bold ${darkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}
        >
          Voltar um dedo
        </button>
        <button
          onClick={goNext}
          className="w-full py-4 rounded-2xl font-bold bg-indigo-600 text-white"
        >
          {step === 'little' ? 'Ver síntese' : 'Próximo dedo'}
        </button>
      </div>
    </div>
  );
}

function QuickLink({
  darkMode,
  title,
  text,
  onClick,
}: {
  darkMode: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[96px] rounded-3xl border p-4 text-left transition-all active:scale-[0.99] ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
    >
      <p className="text-base font-bold leading-tight">{title}</p>
      <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{text}</p>
    </button>
  );
}
