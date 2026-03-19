'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import SectionHeroCard from './SectionHeroCard';

type ShapeType =
  | 'circulo'
  | 'ondas'
  | 'linhas'
  | 'espiral'
  | 'triangulos'
  | 'estrelas'
  | 'pontos'
  | 'ziguezague'
  | 'aurora'
  | 'pulso'
  | 'fragmentos'
  | 'orbita';

type DrawMode = 'auto' | 'livre';
type ToolMode = 'brush' | 'eraser';

interface ArtEntry {
  id: string;
  createdAt: string;
  emotion: string;
  color: string;
  shape: ShapeType;
  imageData?: string;
  reflection?: string;
  checkInBefore?: number;
  checkInAfter?: number;
  drawMode?: DrawMode;
}

interface EmotionProfile {
  emotion: string;
  color: string;
  shape: ShapeType;
  energyLabel: string;
  reflectionTitle: string;
  prompts: string[];
  breathingExerciseId: string;
}

interface CanvasAnalysis {
  coveragePct: number;
  centerX: number;
  centerY: number;
  widthPct: number;
  heightPct: number;
  dominantQuadrant: 'superior esquerdo' | 'superior direito' | 'inferior esquerdo' | 'inferior direito' | 'distribuido';
  edgePct: number;
}

interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: 'diary' | 'breathing' | 'mapavida' | 'mood', params?: Record<string, any>) => void;
  onComplete?: (entryId: string) => void;
}

const palettes = ['#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#84cc16', '#e11d48', '#6366f1'];
const emotionPresets = ['Ansioso', 'Sobrecarregado', 'Confuso', 'Triste', 'Aliviado', 'Calmo', 'Com raiva', 'Esperançoso'];

const shapeOptions: Array<{ value: ShapeType; label: string; hint: string }> = [
  { value: 'circulo', label: 'Círculos', hint: 'repetição e abrigo' },
  { value: 'ondas', label: 'Ondas', hint: 'fluxo e oscilação' },
  { value: 'linhas', label: 'Linhas', hint: 'direção e foco' },
  { value: 'espiral', label: 'Espiral', hint: 'expansão e giro interno' },
  { value: 'triangulos', label: 'Triângulos', hint: 'tensão e decisão' },
  { value: 'estrelas', label: 'Estrelas', hint: 'brilho e abertura' },
  { value: 'pontos', label: 'Pontos', hint: 'pulso e dispersão' },
  { value: 'ziguezague', label: 'Zigue-zague', hint: 'descarga e intensidade' },
  { value: 'aurora', label: 'Aurora', hint: 'camadas suaves' },
  { value: 'pulso', label: 'Pulso', hint: 'batida e aceleração' },
  { value: 'fragmentos', label: 'Fragmentos', hint: 'partes soltas' },
  { value: 'orbita', label: 'Órbita', hint: 'centro e gravidade' },
];

const emotionProfiles: EmotionProfile[] = [
  {
    emotion: 'Ansioso',
    color: '#3b82f6',
    shape: 'ondas',
    energyLabel: 'Energia alta',
    reflectionTitle: 'Desacelerar o ritmo interno',
    breathingExerciseId: 'respiracao-3-3-3',
    prompts: [
      'Onde essa ansiedade aparece primeiro no corpo?',
      'Sua arte ficou mais agitada ou mais organizada do que você esperava?',
      'O que ajudaria essa energia a baixar meio ponto agora?',
    ],
  },
  {
    emotion: 'Sobrecarregado',
    color: '#f97316',
    shape: 'fragmentos',
    energyLabel: 'Carga acumulada',
    reflectionTitle: 'Separar o excesso em partes',
    breathingExerciseId: 'relaxamento',
    prompts: [
      'Qual parte da imagem parece estar carregando peso demais?',
      'Se você pudesse retirar um elemento dessa arte, qual seria?',
      'O que pode ser simplificado hoje para sobrar mais espaço interno?',
    ],
  },
  {
    emotion: 'Confuso',
    color: '#8b5cf6',
    shape: 'orbita',
    energyLabel: 'Busca de clareza',
    reflectionTitle: 'Encontrar um eixo',
    breathingExerciseId: 'respiracao-3-3-3',
    prompts: [
      'Que parte da arte parece mais sem direção?',
      'Existe um ponto de ordem no meio do caos visual?',
      'Qual seria o próximo passo pequeno para clarear sua mente?',
    ],
  },
  {
    emotion: 'Triste',
    color: '#64748b',
    shape: 'aurora',
    energyLabel: 'Energia baixa',
    reflectionTitle: 'Acolher sem apertar mais',
    breathingExerciseId: 'relaxamento',
    prompts: [
      'A imagem pede recolhimento, silêncio ou companhia?',
      'O que nela parece mais sensível ou delicado?',
      'Que gesto gentil faria sentido depois de criar isso?',
    ],
  },
  {
    emotion: 'Aliviado',
    color: '#10b981',
    shape: 'circulo',
    energyLabel: 'Soltando peso',
    reflectionTitle: 'Registrar o que abriu espaço',
    breathingExerciseId: 'respiracao-3-3-3',
    prompts: [
      'O que mudou em você para esse alívio aparecer?',
      'Que parte da arte transmite mais leveza?',
      'Como conservar um pouco dessa sensação no restante do dia?',
    ],
  },
  {
    emotion: 'Calmo',
    color: '#14b8a6',
    shape: 'aurora',
    energyLabel: 'Regulação presente',
    reflectionTitle: 'Fortalecer o estado de segurança',
    breathingExerciseId: 'relaxamento',
    prompts: [
      'O que nessa arte parece estável?',
      'Quais elementos você gostaria de repetir em dias difíceis?',
      'Que sinal mostra que seu corpo está mais seguro agora?',
    ],
  },
  {
    emotion: 'Com raiva',
    color: '#ef4444',
    shape: 'ziguezague',
    energyLabel: 'Energia intensa',
    reflectionTitle: 'Canalizar sem explodir',
    breathingExerciseId: 'respiracao-3-3-3',
    prompts: [
      'A raiva ficou mais concentrada ou espalhada na imagem?',
      'Que limite essa arte parece pedir?',
      'O que precisa ser protegido para essa energia não virar dano?',
    ],
  },
  {
    emotion: 'Esperançoso',
    color: '#f59e0b',
    shape: 'estrelas',
    energyLabel: 'Movimento de abertura',
    reflectionTitle: 'Sustentar o que está nascendo',
    breathingExerciseId: 'relaxamento',
    prompts: [
      'Que parte da arte aponta para frente?',
      'O que parece vivo ou aceso aqui?',
      'Qual próximo passo pode alimentar essa esperança hoje?',
    ],
  },
];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const emptyAnalysis: CanvasAnalysis = {
  coveragePct: 0,
  centerX: 0.5,
  centerY: 0.5,
  widthPct: 0,
  heightPct: 0,
  dominantQuadrant: 'distribuido',
  edgePct: 0,
};

const colorMeanings: Array<{ hex: string; label: string; focus: string; care: string }> = [
  { hex: '#f97316', label: 'laranja', focus: 'energia, movimento e tentativa de retomada', care: 'transformar impulso em gesto organizado' },
  { hex: '#06b6d4', label: 'ciano', focus: 'clareza, respiro e redução de excesso mental', care: 'abrir espaço antes de decidir ou reagir' },
  { hex: '#8b5cf6', label: 'violeta', focus: 'introspecção, elaboração e complexidade interna', care: 'dar linguagem ao que ainda está difuso' },
  { hex: '#10b981', label: 'verde', focus: 'equilíbrio, recuperação e ajuste', care: 'preservar o que ajuda a regular' },
  { hex: '#ec4899', label: 'rosa', focus: 'afeto, sensibilidade e expressão relacional', care: 'acolher sem perder contorno' },
  { hex: '#f59e0b', label: 'âmbar', focus: 'calor, abertura e esperança em movimento', care: 'sustentar o que está voltando a acender' },
  { hex: '#ef4444', label: 'vermelho', focus: 'alta ativação, urgência e intensidade', care: 'canalizar a energia com limite e direção' },
  { hex: '#3b82f6', label: 'azul', focus: 'organização, calma relativa e busca de controle', care: 'reduzir a pressão e estabilizar o ritmo' },
  { hex: '#14b8a6', label: 'turquesa', focus: 'regulação, frescor e flexibilidade', care: 'retomar o centro com suavidade' },
  { hex: '#84cc16', label: 'lima', focus: 'vitalidade, renovação e impulso de mudança', care: 'converter vontade em ação simples' },
  { hex: '#e11d48', label: 'magenta', focus: 'expressão emocional intensa e necessidade de contato', care: 'nomear a intensidade antes de agir' },
  { hex: '#6366f1', label: 'anil', focus: 'reflexão, profundidade e estrutura mental', care: 'organizar pensamentos em partes menores' },
];

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const getClosestColorMeaning = (hex: string) => {
  const target = hexToRgb(hex);
  return colorMeanings.reduce((best, current) => {
    const currentRgb = hexToRgb(current.hex);
    const bestRgb = hexToRgb(best.hex);
    const currentDistance = Math.sqrt((target.r - currentRgb.r) ** 2 + (target.g - currentRgb.g) ** 2 + (target.b - currentRgb.b) ** 2);
    const bestDistance = Math.sqrt((target.r - bestRgb.r) ** 2 + (target.g - bestRgb.g) ** 2 + (target.b - bestRgb.b) ** 2);
    return currentDistance < bestDistance ? current : best;
  }, colorMeanings[0]);
};

const safeText = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 220);

export default function ArtEmotionSection({ darkMode: dm, onNavigate, onComplete }: Props) {
  const [history, setHistory] = useAppPersistence<ArtEntry[]>('psico_art_emotion', []);
  const [emotion, setEmotion] = useState('Não sei o que estou sentindo');
  const [color, setColor] = useState('#8b5cf6');
  const [shape, setShape] = useState<ShapeType>('circulo');
  const [drawMode, setDrawMode] = useState<DrawMode>('auto');
  const [toolMode, setToolMode] = useState<ToolMode>('brush');
  const [brushSize, setBrushSize] = useState(12);
  const [beforeShot, setBeforeShot] = useState<string | null>(null);
  const [afterShot, setAfterShot] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflectionNote, setReflectionNote] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [checkInBefore, setCheckInBefore] = useState<number | null>(null);
  const [checkInAfter, setCheckInAfter] = useState(5);
  const [showCheckInPanel, setShowCheckInPanel] = useState(true);
  const [pointerPreview, setPointerPreview] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [canvasAnalysis, setCanvasAnalysis] = useState<CanvasAnalysis>(emptyAnalysis);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const undoStackRef = useRef<string[]>([]);

  const c = (l: string, d: string) => (dm ? d : l);
  const canvasBg = '#ffffff';

  const emotionProfile = useMemo(() => {
    const normalized = emotion.trim().toLowerCase();
    return emotionProfiles.find((item) => item.emotion.toLowerCase() === normalized) || null;
  }, [emotion]);

  const reflectionPrompts = emotionProfile?.prompts || [
    'O que essa arte revela sobre seu estado interno agora?',
    'Qual parte da imagem chama mais atenção e por quê?',
    'Depois de criar, o que mudou um pouco no corpo ou na respiração?',
  ];

  const activeShapeLabel = shapeOptions.find((item) => item.value === shape)?.label || shape;
  const checkInDifference = checkInBefore === null ? 0 : checkInAfter - checkInBefore;
  const activeShapeHint = shapeOptions.find((item) => item.value === shape)?.hint || 'expressão visual';
  const colorInsight = getClosestColorMeaning(color);
  const sanitizedNote = safeText(reflectionNote);

  const checkInSummary =
    checkInBefore === null
      ? 'Faça um check-in inicial para registrar como você chega na criação.'
      : checkInDifference < 0
        ? `Sua intensidade caiu de ${checkInBefore} para ${checkInAfter}. Observe o que ajudou.`
        : checkInDifference > 0
          ? `Sua intensidade subiu de ${checkInBefore} para ${checkInAfter}. Talvez valha complementar com respiração ou diário.`
          : `Sua intensidade ficou em ${checkInAfter}. Às vezes a arte não reduz, mas organiza o que estava difuso.`;

  const quickRecommendation =
    checkInBefore === null
      ? 'Comece pelo check-in e depois escolha uma emoção ou forma.'
      : checkInDifference > 0
        ? 'Sua ativação aumentou. A respiração pode ajudar a baixar o corpo antes de seguir.'
        : reflectionNote.trim()
          ? 'Seu registro já tem matéria-prima para virar entrada no Diário.'
          : 'Se quiser aprofundar, descreva o que mudou e leve isso para o Diário.';

  const analyzeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setCanvasAnalysis(emptyAnalysis);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCanvasAnalysis(emptyAnalysis);
      return;
    }

    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const bgR = parseInt(canvasBg.slice(1, 3), 16);
    const bgG = parseInt(canvasBg.slice(3, 5), 16);
    const bgB = parseInt(canvasBg.slice(5, 7), 16);

    let total = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let edgeCount = 0;
    const quadrants = [0, 0, 0, 0];

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
        const delta = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        if (alpha > 0 && delta > 24) {
          total++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (x < width * 0.08 || x > width * 0.92 || y < height * 0.08 || y > height * 0.92) edgeCount++;

          const isLeft = x < width / 2;
          const isTop = y < height / 2;
          const quadrantIndex = isTop ? (isLeft ? 0 : 1) : isLeft ? 2 : 3;
          quadrants[quadrantIndex]++;
        }
      }
    }

    if (total === 0) {
      setCanvasAnalysis(emptyAnalysis);
      return;
    }

    const dominantIndex = quadrants.indexOf(Math.max(...quadrants));
    const dominantQuadrant =
      quadrants[dominantIndex] / total < 0.38
        ? 'distribuido'
        : (['superior esquerdo', 'superior direito', 'inferior esquerdo', 'inferior direito'] as const)[dominantIndex];

    setCanvasAnalysis({
      coveragePct: total / ((width / 2) * (height / 2)),
      centerX: sumX / total / width,
      centerY: sumY / total / height,
      widthPct: (maxX - minX) / width,
      heightPct: (maxY - minY) / height,
      dominantQuadrant,
      edgePct: edgeCount / total,
    });
  };

  const symbolicAnalysis = useMemo(() => {
    const hasDrawing = canvasAnalysis.coveragePct > 0.002;
    const focusBase = !hasDrawing
      ? 'Ainda não há elementos suficientes no canvas para uma leitura mais precisa.'
      : canvasAnalysis.coveragePct < 0.04
        ? 'O desenho está mais contido e ocupa uma área pequena do quadro.'
        : canvasAnalysis.coveragePct > 0.2
          ? 'O desenho ocupa boa parte do quadro e mostra uma expressão mais expansiva.'
          : 'O desenho usa o quadro de forma intermediária, sem ficar nem muito contido nem muito espalhado.';

    const spreadLine =
      canvasAnalysis.widthPct > 0.72
        ? 'Há bastante espalhamento horizontal, com o gesto atravessando boa parte do quadro.'
        : canvasAnalysis.heightPct > 0.72
          ? 'Há bastante espalhamento vertical, com sensação de subida, queda ou camadas mais longas.'
          : 'O desenho fica mais concentrado em uma faixa específica do quadro.';

    const quadrantLine =
      canvasAnalysis.dominantQuadrant === 'distribuido'
        ? 'A marca ficou relativamente distribuída entre os quadrantes.'
        : `A maior concentração visual está no ${canvasAnalysis.dominantQuadrant} do quadro.`;

    const edgeLine =
      canvasAnalysis.edgePct > 0.22
        ? 'Parte relevante do desenho toca ou se aproxima das bordas, o que sugere expansão ou descarga mais aberta.'
        : 'O desenho se mantém mais dentro do campo central, com menos toque nas bordas.';

    const shapeLine = `A forma ${activeShapeLabel.toLowerCase()} adiciona uma leitura de ${activeShapeHint}.`;
    const colorLine = `Na literatura de psicologia das cores, o tom mais próximo de ${colorInsight.label} costuma se associar a ${colorInsight.focus}. Aqui isso entra como pista contextual, não como verdade isolada.`;
    const careLine = `Como cuidado complementar ligado a essa escolha de cor, pode fazer sentido ${colorInsight.care}.`;

    let noteLine = 'Sua observação ainda pode ser ampliada com uma frase simples sobre o que mudou no corpo, no ritmo ou no pensamento.';
    if (sanitizedNote.length > 0) {
      noteLine = `Na sua observação aparece esta pista: "${sanitizedNote}". Isso pode ajudar a transformar sensação em linguagem mais clara.`;
    }

    const nextStep =
      !hasDrawing
        ? 'Faça alguns traços ou gere uma composição para ativar uma leitura baseada no que realmente apareceu no quadro.'
        : checkInBefore !== null && checkInDifference > 0
        ? 'Como a ativação subiu, vale considerar uma respiração curta antes de seguir em outra tarefa.'
        : sanitizedNote.length > 0
          ? 'Como você já registrou uma pista importante, levar isso para o Diário pode aprofundar a leitura.'
          : 'Se quiser aprofundar, complete a observação com uma frase curta e depois leve para o Diário.';

    return {
      title: 'Leitura simbólica da criação',
      intro: 'Esta leitura usa sinais visuais do canvas e associações de cor tratadas como contexto. Ela continua sendo apenas sugestiva: não é diagnóstico e não define você.',
      bullets: [focusBase, spreadLine, quadrantLine, edgeLine, shapeLine, colorLine, careLine],
      noteLine,
      nextStep,
    };
  }, [activeShapeHint, activeShapeLabel, canvasAnalysis, checkInBefore, checkInDifference, colorInsight, sanitizedNote]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const captureCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    const stack = undoStackRef.current;
    if (!stack.length || stack[stack.length - 1] !== data) {
      stack.push(data);
    }
  };

  const restoreCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setTimeout(() => analyzeCanvas(), 0);
    };
    img.src = dataUrl;
  };

  const resetCanvas = () => {
    clearCanvas();
    undoStackRef.current = [];
    captureCanvasState();
    setCanvasAnalysis(emptyAnalysis);
  };

  useEffect(() => {
    resetCanvas();
  }, [dm]);

  useEffect(() => {
    if (!emotionProfile) return;
    setColor(emotionProfile.color);
    setShape(emotionProfile.shape);
    setReflection(`${emotionProfile.reflectionTitle}. ${emotionProfile.prompts[0]}`);
  }, [emotionProfile]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const applyToolStyle = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = toolMode === 'eraser' ? canvasBg : color;
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawMode !== 'livre') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    captureCanvasState();
    const { x, y } = getPoint(e);
    setIsDrawing(true);
    canvas.setPointerCapture(e.pointerId);
    applyToolStyle(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setPointerPreview({ x, y, visible: toolMode === 'eraser' });
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getPoint(e);
    setPointerPreview({ x, y, visible: drawMode === 'livre' && toolMode === 'eraser' });
    if (drawMode !== 'livre' || !isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    applyToolStyle(ctx);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawMode !== 'livre' || !isDrawing) {
      setPointerPreview((prev) => ({ ...prev, visible: false }));
      return;
    }
    const canvas = canvasRef.current;
    if (canvas && e) canvas.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    captureCanvasState();
    setPointerPreview((prev) => ({ ...prev, visible: false }));
    analyzeCanvas();
  };

  const undoLast = () => {
    if (undoStackRef.current.length <= 1) return;
    undoStackRef.current.pop();
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    if (previous) restoreCanvas(previous);
  };

  const paint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const intensity = checkInBefore ?? 5;
    const density = 6 + Math.round(intensity * 0.8);
    const amplitude = 8 + intensity * 1.8;
    const seed = emotion.length + intensity * 11;
    const lineWeight = 1.5 + intensity * 0.35;

    captureCanvasState();
    clearCanvas();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWeight;

    if (shape === 'circulo') {
      for (let i = 0; i < density; i++) {
        ctx.beginPath();
        ctx.arc(70 + i * 55, 120 + ((i + seed) % 4) * 55, 18 + ((i + seed) % 6) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (shape === 'ondas') {
      for (let row = 0; row < Math.max(4, density - 2); row++) {
        ctx.beginPath();
        for (let x = 0; x <= 900; x += 10) {
          const y = 70 + row * 70 + Math.sin((x + seed * 20 + row * 30) * 0.02) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    if (shape === 'linhas') {
      for (let i = 0; i < density + 2; i++) {
        ctx.beginPath();
        const y = 40 + i * 42;
        ctx.moveTo(30, y);
        ctx.lineTo(870, y + (((i + seed) % 5) - 2) * 10);
        ctx.stroke();
      }
    }

    if (shape === 'espiral') {
      ctx.beginPath();
      let angle = 0;
      let radius = 4;
      while (radius < 260) {
        const x = 450 + Math.cos(angle) * radius;
        const y = 280 + Math.sin(angle) * radius;
        if (radius === 4) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        angle += 0.15 + intensity * 0.006;
        radius += 0.55;
      }
      ctx.stroke();
    }

    if (shape === 'triangulos') {
      for (let i = 0; i < density; i++) {
        const x = 90 + (i % 6) * 130;
        const y = 70 + Math.floor(i / 6) * 120;
        const size = 28 + ((i + seed) % 5) * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y + size * 1.5);
        ctx.lineTo(x - size, y + size * 1.5);
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (shape === 'estrelas') {
      for (let i = 0; i < density; i++) {
        const cx = 90 + (i % 5) * 170;
        const cy = 90 + Math.floor(i / 5) * 140;
        const outer = 18 + ((i + seed) % 4) * 7;
        const inner = outer * 0.45;
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const outerAngle = (Math.PI * 2 * p) / 5 - Math.PI / 2;
          const innerAngle = outerAngle + Math.PI / 5;
          const ox = cx + Math.cos(outerAngle) * outer;
          const oy = cy + Math.sin(outerAngle) * outer;
          const ix = cx + Math.cos(innerAngle) * inner;
          const iy = cy + Math.sin(innerAngle) * inner;
          if (p === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (shape === 'pontos') {
      for (let i = 0; i < density * 30; i++) {
        const x = ((i * 47 + seed * 17) % 860) + 20;
        const y = ((i * 61 + seed * 13) % 520) + 20;
        const radius = 1 + ((i + seed) % 5) + intensity * 0.18;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (shape === 'ziguezague') {
      for (let row = 0; row < Math.max(4, density - 1); row++) {
        ctx.beginPath();
        let up = row % 2 === 0;
        for (let x = 0; x <= 900; x += 30) {
          const y = 80 + row * 70 + (up ? -amplitude * 0.6 : amplitude * 0.6);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          up = !up;
        }
        ctx.stroke();
      }
    }

    if (shape === 'aurora') {
      for (let i = 0; i < Math.max(4, density - 2); i++) {
        ctx.beginPath();
        ctx.lineWidth = Math.max(1.5, lineWeight + 4 - i * 0.5);
        for (let x = 0; x <= 900; x += 12) {
          const y = 70 + i * 62 + Math.sin((x + i * 70 + seed * 8) * 0.014) * (amplitude + 8 - i);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.lineWidth = lineWeight;
    }

    if (shape === 'pulso') {
      for (let i = 0; i < Math.max(3, density - 3); i++) {
        const baseY = 85 + i * 90;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 24; x <= 900; x += 24) {
          const pulse = x % 144 === 0 ? -amplitude * 1.2 : x % 72 === 0 ? amplitude * 0.7 : 0;
          ctx.lineTo(x, baseY + pulse);
        }
        ctx.stroke();
      }
    }

    if (shape === 'fragmentos') {
      for (let i = 0; i < density * 2; i++) {
        const x = ((i * 79 + seed * 31) % 820) + 40;
        const y = ((i * 59 + seed * 19) % 460) + 40;
        const spread = 14 + ((i + seed) % 4) * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + spread, y + 8);
        ctx.lineTo(x + 6, y + spread * 1.4);
        ctx.lineTo(x - spread, y + 12);
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (shape === 'orbita') {
      for (let i = 0; i < Math.max(4, density - 2); i++) {
        ctx.beginPath();
        ctx.ellipse(450, 280, 80 + i * 70, 26 + i * 18, (Math.PI / 18) * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < density + 2; i++) {
        const angle = (Math.PI * 2 * i) / (density + 2) + seed * 0.08;
        const x = 450 + Math.cos(angle) * (160 + (i % 3) * 70);
        const y = 280 + Math.sin(angle) * (80 + (i % 2) * 50);
        ctx.beginPath();
        ctx.arc(x, y, 4 + (i % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    captureCanvasState();
    if (checkInBefore !== null) setCheckInAfter(checkInBefore);
    setReflection(`${emotionProfile?.reflectionTitle || 'Exploração visual'}. ${reflectionPrompts[0]} Forma escolhida: ${activeShapeLabel}.`);
    analyzeCanvas();
  };

  const save = () => {
    const imageData = canvasRef.current?.toDataURL('image/png');
    analyzeCanvas();
    const entry: ArtEntry = {
      id: !selectedHistoryId ? crypto.randomUUID() : selectedHistoryId,
      createdAt: new Date().toISOString(),
      emotion,
      color,
      shape,
      imageData,
      reflection: reflectionNote.trim() || reflection,
      checkInBefore: checkInBefore ?? undefined,
      checkInAfter,
      drawMode,
    };
    setHistory([entry, ...history.filter((item) => item.id !== entry.id)].slice(0, 20));
    setSelectedHistoryId(entry.id);
    onComplete?.(entry.id);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `arte-emocional-${Date.now()}.png`;
    link.click();
  };

  const snapshotBefore = () => {
    const data = canvasRef.current?.toDataURL('image/png');
    if (data) setBeforeShot(data);
  };

  const snapshotAfter = () => {
    const data = canvasRef.current?.toDataURL('image/png');
    if (data) setAfterShot(data);
  };

  const loadHistoryEntry = (entry: ArtEntry) => {
    setSelectedHistoryId(entry.id);
    setEmotion(entry.emotion);
    setColor(entry.color);
    setShape(entry.shape);
    setDrawMode(entry.drawMode || 'auto');
    setReflection(entry.reflection || '');
    setReflectionNote(entry.reflection || '');
    setCheckInBefore(entry.checkInBefore ?? null);
    setCheckInAfter(entry.checkInAfter ?? entry.checkInBefore ?? 5);
    setShowCheckInPanel(false);
    if (entry.imageData) {
      restoreCanvas(entry.imageData);
      undoStackRef.current = [entry.imageData];
    } else {
      resetCanvas();
    }
  };

  const deleteHistoryEntry = (id: string) => {
    setHistory(history.filter((item) => item.id !== id));
    if (selectedHistoryId === id) setSelectedHistoryId(null);
  };

  const startFresh = () => {
    setSelectedHistoryId(null);
    setEmotion('Não sei o que estou sentindo');
    setColor('#8b5cf6');
    setShape('circulo');
    setDrawMode('auto');
    setToolMode('brush');
    setBrushSize(12);
    setReflection('');
    setReflectionNote('');
    setBeforeShot(null);
    setAfterShot(null);
    setCheckInBefore(null);
    setCheckInAfter(5);
    setShowCheckInPanel(true);
    resetCanvas();
  };

  const openDiaryWithReflection = () => {
    const draft = [
      `Emoção: ${emotion}`,
      `Check-in antes: ${checkInBefore ?? '-'}/10`,
      `Check-in depois: ${checkInAfter}/10`,
      `Forma: ${activeShapeLabel}`,
      '',
      'Reflexão guiada:',
      reflection || reflectionPrompts[0],
      '',
      'Minha observação:',
      reflectionNote.trim() || 'Quero desenvolver essa reflexão no Diário.',
    ].join('\n');
    onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: draft, diaryDraftKey: Date.now() });
  };

  const openBreathingSupport = () => {
    const exerciseId = emotionProfile?.breathingExerciseId || 'relaxamento';
    onNavigate?.('breathing', { exerciseId, from: 'artemotion', trigger: 'checkin-worsened' });
  };

  return (
    <div className={`px-3 sm:px-4 pt-4 pb-24 max-w-7xl mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Expressão e leitura"
          title="Modo Arte"
          description="Use cor, gesto e forma para traduzir o que está intenso, confuso ou difícil de dizer."
          icon="🎨"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`px-4 py-3 rounded-3xl border ${c('bg-white/80 border-white text-slate-700', 'bg-white/5 border-white/10 text-slate-200')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-400', 'text-slate-500')}`}>Estado</p>
              <p className="text-sm font-black mt-1">{checkInBefore === null ? 'Sem check-in' : `${checkInBefore}/10 agora`}</p>
            </div>
            <div className={`px-4 py-3 rounded-3xl border ${c('bg-white/80 border-white text-slate-700', 'bg-white/5 border-white/10 text-slate-200')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-400', 'text-slate-500')}`}>Direção</p>
              <p className="text-sm font-black mt-1">{emotionProfile?.reflectionTitle || 'Exploração livre'}</p>
            </div>
          </div>
        </SectionHeroCard>
      </div>

      {showCheckInPanel && (
        <div className={`rounded-[1.8rem] sm:rounded-[2rem] border p-4 sm:p-5 md:p-6 mb-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/90 border-slate-700 shadow-xl shadow-black/20')}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Entrada</p>
              <h3 className="text-xl font-black mt-1">Check-in inicial</h3>
              <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-300')}`}>Marque como você chega agora. Depois disso, a criação e a leitura ficam mais úteis.</p>
            </div>
            <button
              onClick={() => setShowCheckInPanel(false)}
              disabled={checkInBefore === null}
              className={`px-4 py-2 rounded-2xl text-xs font-black ${checkInBefore !== null ? 'bg-fuchsia-600 text-white' : c('bg-slate-100 text-slate-400', 'bg-slate-800 text-slate-500')}`}
            >
              Começar a criar
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span>Como você está agora?</span>
              <span>{checkInBefore ?? '--'}/10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={checkInBefore ?? 5}
              onChange={(e) => {
                setCheckInBefore(Number(e.target.value));
                setCheckInAfter(Number(e.target.value));
              }}
              className="w-full accent-fuchsia-600"
            />
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className={`rounded-[1.8rem] sm:rounded-[2rem] border p-4 sm:p-5 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/85 border-slate-700 shadow-xl shadow-black/20')}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Estado emocional</p>
                <h3 className="text-lg font-black mt-1">{emotion}</h3>
              </div>
              <button onClick={startFresh} className={`px-4 py-2 rounded-2xl text-xs font-black ${c('bg-slate-100 text-slate-700 hover:bg-slate-200', 'bg-slate-800 text-slate-200 hover:bg-slate-700')}`}>Nova arte</button>
            </div>

            <input
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              placeholder="Ex.: ansioso, exausto, em paz"
              className={`w-full mt-4 p-3 rounded-2xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-950 border-slate-700')}`}
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {emotionPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setEmotion(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${emotion === preset ? 'bg-fuchsia-600 text-white' : c('bg-slate-100 text-slate-700 hover:bg-slate-200', 'bg-slate-800 text-slate-200 hover:bg-slate-700')}`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {emotionProfile && (
              <div className={`mt-4 rounded-[1.7rem] p-4 border ${c('bg-fuchsia-50 border-fuchsia-100', 'bg-fuchsia-500/10 border-fuchsia-500/20')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-fuchsia-700', 'text-fuchsia-300')}`}>{emotionProfile.energyLabel}</p>
                <p className="text-sm font-bold mt-2">{emotionProfile.reflectionTitle}</p>
                <p className={`text-xs leading-relaxed mt-2 ${c('text-slate-600', 'text-slate-300')}`}>{quickRecommendation}</p>
              </div>
            )}
          </div>

          <div className={`rounded-[1.8rem] sm:rounded-[2rem] border p-4 sm:p-5 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/85 border-slate-700 shadow-xl shadow-black/20')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Ferramentas</p>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => setDrawMode('auto')} className={`py-3 rounded-2xl text-sm font-black ${drawMode === 'auto' ? 'bg-fuchsia-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Composição automática</button>
              <button onClick={() => setDrawMode('livre')} className={`py-3 rounded-2xl text-sm font-black ${drawMode === 'livre' ? 'bg-fuchsia-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Pincel livre</button>
            </div>

            <div className={`mt-4 rounded-[1.7rem] p-4 border ${c('bg-slate-50 border-slate-200', 'bg-slate-950 border-slate-700')}`}>
              <p className="text-xs font-bold mb-2">Cor principal</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-16 rounded-2xl bg-transparent" />
                <div className="text-xs font-mono">{color}</div>
              </div>
              <div className="grid grid-cols-9 gap-2">
                {palettes.map((palette) => (
                  <button key={palette} onClick={() => setColor(palette)} className={`w-7 h-7 rounded-full border-2 transition-all ${color === palette ? 'scale-110 border-white shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: palette }} />
                ))}
              </div>
            </div>

            {drawMode === 'auto' ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold mb-3">
                  <span>Forma guiada</span>
                  <span>{activeShapeLabel}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shapeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setShape(option.value)}
                      className={`rounded-[1.3rem] border p-3 text-left transition-all ${
                        shape === option.value
                          ? 'border-fuchsia-500 bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                          : c('border-slate-200 bg-white hover:border-fuchsia-200', 'border-slate-700 bg-slate-900 hover:border-fuchsia-500/40')
                      }`}
                    >
                      <p className="text-sm font-black">{option.label}</p>
                      <p className={`text-[11px] mt-1 ${shape === option.value ? 'text-white/75' : c('text-slate-500', 'text-slate-400')}`}>{option.hint}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setToolMode('brush')} className={`py-3 rounded-2xl text-sm font-black ${toolMode === 'brush' ? 'bg-emerald-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Pincel</button>
                  <button onClick={() => setToolMode('eraser')} className={`py-3 rounded-2xl text-sm font-black ${toolMode === 'eraser' ? 'bg-rose-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Borracha</button>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Tamanho</span>
                    <span>{brushSize}px</span>
                  </div>
                  <input type="range" min="8" max="42" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-fuchsia-600" />
                </div>
                <p className={`text-xs leading-relaxed ${c('text-slate-500', 'text-slate-400')}`}>A borracha mostra um contorno proporcional ao tamanho do gesto para ficar mais fácil apagar com precisão.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className={`rounded-[1.9rem] sm:rounded-[2.2rem] border p-4 sm:p-5 md:p-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/85 border-slate-700 shadow-xl shadow-black/20')}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Ateliê</p>
                <h3 className="text-2xl font-black mt-1">{selectedHistoryId ? 'Editando arte salva' : 'Criação atual'}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={paint} disabled={drawMode !== 'auto'} className={`px-4 py-2 rounded-2xl text-xs font-black ${drawMode === 'auto' ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : c('bg-slate-100 text-slate-400', 'bg-slate-800 text-slate-500')}`}>Gerar</button>
                <button onClick={undoLast} className={`px-4 py-2 rounded-2xl text-xs font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Desfazer</button>
                <button onClick={save} className="px-4 py-2 rounded-2xl text-xs font-black bg-sky-600 text-white">Salvar</button>
                <button onClick={exportImage} className="px-4 py-2 rounded-2xl text-xs font-black bg-emerald-600 text-white">Exportar</button>
              </div>
            </div>

            <div className={`rounded-[2rem] border p-3 ${c('bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.1),_transparent_35%),linear-gradient(135deg,#ffffff_0%,#fdf2f8_100%)] border-slate-100', 'bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.12),_transparent_35%),linear-gradient(135deg,#020617_0%,#111827_100%)] border-slate-700')}`}>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={560}
                  onPointerDown={startDraw}
                  onPointerMove={draw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                  className={`w-full aspect-[16/10] rounded-[1.5rem] border touch-none ${c('border-slate-200 bg-white', 'border-slate-700 bg-slate-950')}`}
                />
                {drawMode === 'livre' && toolMode === 'eraser' && pointerPreview.visible && (
                  <div
                    className="absolute pointer-events-none rounded-full border border-rose-500/90 bg-rose-500/10 shadow-[0_0_0_3px_rgba(244,63,94,0.16)] transition-transform duration-75"
                    style={{
                      width: brushSize,
                      height: brushSize,
                      left: `calc(${(pointerPreview.x / 900) * 100}% - ${brushSize / 2}px)`,
                      top: `calc(${(pointerPreview.y / 560) * 100}% - ${brushSize / 2}px)`,
                    }}
                  />
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              <div className={`rounded-[1.7rem] p-4 border ${c('bg-indigo-50 border-indigo-100', 'bg-indigo-500/10 border-indigo-500/20')}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-indigo-700', 'text-indigo-300')}`}>Antes</p>
                    <p className={`text-xs mt-2 ${c('text-slate-600', 'text-slate-300')}`}>Capture o quadro inicial se quiser comparar o processo.</p>
                  </div>
                  <button onClick={snapshotBefore} className="px-4 py-2 rounded-2xl text-xs font-black bg-indigo-600 text-white">Capturar</button>
                </div>
                <div className="mt-3">
                  {beforeShot ? <img src={beforeShot} alt="antes" className="rounded-2xl border border-slate-200 dark:border-slate-700 w-full h-36 object-cover" /> : <div className={`h-36 rounded-2xl ${c('bg-white', 'bg-slate-950')}`} />}
                </div>
              </div>

              <div className={`rounded-[1.7rem] p-4 border ${c('bg-emerald-50 border-emerald-100', 'bg-emerald-500/10 border-emerald-500/20')}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Depois</p>
                    <p className={`text-xs mt-2 ${c('text-slate-600', 'text-slate-300')}`}>Registre a versão que mais traduz o estado que apareceu.</p>
                  </div>
                  <button onClick={snapshotAfter} className="px-4 py-2 rounded-2xl text-xs font-black bg-emerald-600 text-white">Capturar</button>
                </div>
                <div className="mt-3">
                  {afterShot ? <img src={afterShot} alt="depois" className="rounded-2xl border border-slate-200 dark:border-slate-700 w-full h-36 object-cover" /> : <div className={`h-36 rounded-2xl ${c('bg-white', 'bg-slate-950')}`} />}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-[1.9rem] sm:rounded-[2.2rem] border p-4 sm:p-5 md:p-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/85 border-slate-700 shadow-xl shadow-black/20')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Se quiser ampliar isso</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                { label: 'Levar para o Diário', hint: 'dar palavras ao que a arte abriu', tab: 'diary' as const },
                { label: 'Abrir Respiração', hint: 'regular se a ativação subiu', tab: 'breathing' as const },
                { label: 'Abrir Diário de Humor', hint: 'registrar a emoção principal com mais contexto', tab: 'mood' as const },
                { label: 'Abrir Mapa da Minha Vida', hint: 'ver esse momento dentro de um quadro mais amplo', tab: 'mapavida' as const },
              ].map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onNavigate?.(item.tab)}
                  className={`rounded-[1.3rem] border p-4 min-h-[88px] text-left ${c('bg-slate-50 border-slate-100 text-slate-700', 'bg-slate-950 border-slate-700 text-slate-200')}`}
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{item.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-[1.9rem] sm:rounded-[2.2rem] border p-4 sm:p-5 md:p-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/85 border-slate-700 shadow-xl shadow-black/20')}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Leitura terapêutica</p>
                <h3 className="text-xl font-black mt-1">Reflexão guiada</h3>
              </div>
              <div className={`px-4 py-2 rounded-2xl text-xs font-black ${checkInDifference > 0 ? c('bg-amber-100 text-amber-800', 'bg-amber-500/10 text-amber-300') : c('bg-fuchsia-50 text-fuchsia-700', 'bg-fuchsia-500/10 text-fuchsia-300')}`}>
                {checkInDifference > 0 ? 'Sugerimos regulação' : 'Leitura disponível'}
              </div>
            </div>

            <div className={`mt-4 rounded-[1.7rem] p-4 border ${c('bg-slate-50 border-slate-200', 'bg-slate-950 border-slate-700')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Perguntas guiadas</p>
              <div className="grid md:grid-cols-3 gap-3 mt-4">
                {reflectionPrompts.map((prompt) => (
                  <div key={prompt} className={`rounded-2xl p-3 ${c('bg-white', 'bg-slate-900')}`}>
                    <p className="text-sm leading-relaxed">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className={`text-xs font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Observação sua</label>
              <textarea
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                rows={4}
                placeholder="Ex.: a arte ficou mais intensa do que eu imaginava, mas organizar as formas me ajudou a respirar melhor."
                className={`w-full mt-2 p-4 rounded-[1.5rem] border text-sm resize-none ${c('bg-slate-50 border-slate-200', 'bg-slate-950 border-slate-700')}`}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <button onClick={openDiaryWithReflection} className="py-3 rounded-[1.2rem] text-sm font-black bg-sky-600 text-white shadow-lg shadow-sky-600/20">Levar para o Diário</button>
              <button
                onClick={openBreathingSupport}
                disabled={checkInBefore === null || checkInDifference <= 0}
                className={`py-3 rounded-[1.2rem] text-sm font-black ${checkInBefore !== null && checkInDifference > 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : c('bg-slate-100 text-slate-400', 'bg-slate-800 text-slate-500')}`}
              >
                Abrir respiração se piorou
              </button>
            </div>

            <div className={`mt-4 rounded-[1.7rem] p-4 border ${c('bg-violet-50 border-violet-100', 'bg-violet-500/10 border-violet-500/20')}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-violet-800', 'text-violet-300')}`}>{symbolicAnalysis.title}</p>
                  <p className={`text-xs mt-2 ${c('text-slate-600', 'text-slate-300')}`}>{symbolicAnalysis.intro}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black ${c('bg-white text-violet-700', 'bg-white/10 text-violet-200')}`}>
                  Leitura segura
                </div>
              </div>

              <div className="grid gap-2 mt-4">
                {symbolicAnalysis.bullets.map((item) => (
                  <div key={item} className={`rounded-2xl px-3 py-3 text-sm ${c('bg-white text-slate-700', 'bg-slate-900/70 text-slate-200')}`}>
                    {item}
                  </div>
                ))}
              </div>

              <div className={`mt-4 rounded-2xl p-3 ${c('bg-white text-slate-700', 'bg-slate-900/70 text-slate-200')}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Sua pista</p>
                <p className="text-sm mt-2 leading-relaxed">{symbolicAnalysis.noteLine}</p>
              </div>

              <div className={`mt-3 rounded-2xl p-3 ${c('bg-violet-100 text-violet-900', 'bg-violet-500/10 text-violet-200')}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Próximo cuidado</p>
                <p className="text-sm mt-2 leading-relaxed">{symbolicAnalysis.nextStep}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-[1.9rem] sm:rounded-[2.2rem] border p-4 sm:p-5 md:p-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/85 border-slate-700 shadow-xl shadow-black/20')}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Check-in</p>
                <h3 className="text-lg font-black mt-1">Antes e depois</h3>
              </div>
              <button onClick={() => setShowCheckInPanel((prev) => !prev)} className={`px-4 py-2 rounded-2xl text-xs font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>
                {showCheckInPanel ? 'Ocultar entrada' : 'Reabrir entrada'}
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span>Como você estava ao começar?</span>
                  <span>{checkInBefore ?? '--'}/10</span>
                </div>
                <input type="range" min="0" max="10" value={checkInBefore ?? 5} onChange={(e) => { setCheckInBefore(Number(e.target.value)); }} className="w-full accent-fuchsia-600" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span>Como você ficou após criar?</span>
                  <span>{checkInAfter}/10</span>
                </div>
                <input type="range" min="0" max="10" value={checkInAfter} onChange={(e) => setCheckInAfter(Number(e.target.value))} className="w-full accent-emerald-600" />
              </div>
            </div>
          </div>

          <div className={`rounded-[1.9rem] sm:rounded-[2.2rem] border p-4 sm:p-5 md:p-6 ${c('bg-white border-slate-100 shadow-sm', 'bg-slate-900/85 border-slate-700 shadow-xl shadow-black/20')}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${c('text-slate-400', 'text-slate-500')}`}>Histórico</p>
                <h3 className="text-lg font-black mt-1">Revisitar e continuar</h3>
              </div>
              <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{history.length} registro(s)</span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {history.length === 0 && (
                <div className={`rounded-3xl p-4 text-sm ${c('bg-slate-50 text-slate-500', 'bg-slate-950 text-slate-400')}`}>
                  Suas criações salvas vão aparecer aqui com miniatura, data e reflexão curta.
                </div>
              )}

              {history.map((entry) => (
                <div key={entry.id} className={`rounded-[1.7rem] border p-3 ${selectedHistoryId === entry.id ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20' : c('border-slate-200 bg-slate-50', 'border-slate-700 bg-slate-950')}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{entry.emotion}</p>
                      <p className={`text-[11px] mt-1 ${c('text-slate-500', 'text-slate-400')}`}>
                        {shapeOptions.find((item) => item.value === entry.shape)?.label || entry.shape} • {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <span className="w-5 h-5 rounded-full border border-white/40 shrink-0" style={{ backgroundColor: entry.color }} />
                  </div>

                  {entry.imageData && <img src={entry.imageData} alt="arte salva" className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 w-full h-32 object-cover" />}

                  {entry.reflection && (
                    <p className={`text-xs leading-relaxed mt-3 ${c('text-slate-600', 'text-slate-300')}`}>
                      {entry.reflection}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => loadHistoryEntry(entry)} className={`py-2 rounded-2xl text-xs font-black ${c('bg-slate-200 text-slate-800 hover:bg-slate-300', 'bg-slate-800 text-slate-200 hover:bg-slate-700')}`}>Continuar</button>
                    <button onClick={() => deleteHistoryEntry(entry.id)} className="py-2 rounded-2xl text-xs font-black bg-rose-600 text-white">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
