'use client';

import { useMemo, useState } from 'react';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import SectionHeroCard from './SectionHeroCard';

interface Props {
  darkMode?: boolean;
  onNavigate?: (tab: 'diary' | 'missions' | 'habits' | 'vocacional', params?: Record<string, any>) => void;
}

type AreaId =
  | 'emocional'
  | 'energia'
  | 'autoestima'
  | 'relacionamentos'
  | 'familia'
  | 'social'
  | 'proposito'
  | 'financeiro'
  | 'criatividade'
  | 'espiritualidade'
  | 'trabalho'
  | 'lazer';

type WheelRecord = {
  id: string;
  createdAt: string;
  title: string;
  color: string;
  scores: Record<AreaId, number>;
  notes: Record<AreaId, string>;
  areaColors?: Record<AreaId, string>;
};

const areas: Array<{ id: AreaId; label: string; shortLabel: string; icon: string; suggestion: string; nextTab: 'diary' | 'missions' | 'habits' | 'vocacional' }> = [
  { id: 'emocional', label: 'Saúde emocional', shortLabel: 'Emocional', icon: '🫶', suggestion: 'Nomeie o que está pesando e reduza um gatilho hoje.', nextTab: 'diary' },
  { id: 'energia', label: 'Saúde e disposição', shortLabel: 'Energia', icon: '⚡', suggestion: 'Escolha uma ação básica de recuperação: água, comida ou descanso.', nextTab: 'habits' },
  { id: 'autoestima', label: 'Autoestima', shortLabel: 'Autoestima', icon: '🪞', suggestion: 'Troque uma fala dura por uma frase mais justa e praticável.', nextTab: 'diary' },
  { id: 'relacionamentos', label: 'Relacionamentos', shortLabel: 'Relações', icon: '💬', suggestion: 'Procure uma conversa clara ou um limite simples.', nextTab: 'missions' },
  { id: 'familia', label: 'Família', shortLabel: 'Família', icon: '🏠', suggestion: 'Observe o que está no seu controle e o que precisa de limite emocional.', nextTab: 'diary' },
  { id: 'social', label: 'Vida social', shortLabel: 'Social', icon: '👥', suggestion: 'Aproxime-se de uma interação leve ou retome um vínculo que te faça bem.', nextTab: 'missions' },
  { id: 'proposito', label: 'Realização e propósito', shortLabel: 'Propósito', icon: '🧭', suggestion: 'Escolha uma ação pequena que te reconecte com o que faz sentido para você.', nextTab: 'vocacional' },
  { id: 'financeiro', label: 'Recursos financeiros', shortLabel: 'Finanças', icon: '💰', suggestion: 'Olhe para o próximo passo possível com menos pressão e mais clareza prática.', nextTab: 'habits' },
  { id: 'criatividade', label: 'Criatividade e hobbies', shortLabel: 'Criatividade', icon: '🎨', suggestion: 'Proteja um espaço curto para expressão, curiosidade ou prazer criativo.', nextTab: 'habits' },
  { id: 'espiritualidade', label: 'Espiritualidade', shortLabel: 'Espiritualidade', icon: '✨', suggestion: 'Reserve alguns minutos para silêncio, oração, contemplação ou algo que te recentre.', nextTab: 'diary' },
  { id: 'trabalho', label: 'Trabalho / estudos', shortLabel: 'Trabalho', icon: '📚', suggestion: 'Defina só a próxima prioridade, não o dia inteiro.', nextTab: 'habits' },
  { id: 'lazer', label: 'Lazer / descanso', shortLabel: 'Lazer', icon: '🌿', suggestion: 'Proteja um momento curto de prazer ou pausa real ainda hoje.', nextTab: 'habits' },
];

const palette = ['#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#84cc16', '#e11d48', '#6366f1'];
const WHEEL_LEVELS = 10;
const WHEEL_VIEWBOX = 660;
const WHEEL_CENTER = 330;
const WHEEL_RADIUS = 304;
const WHEEL_LABEL_RADIUS = 307;
const DEFAULT_COLOR = '#f97316';
const colorProfiles: Array<{ hex: string; label: string; association: string; care: string }> = [
  { hex: '#f97316', label: 'laranja', association: 'energia, movimento e retomada', care: 'transformar impulso em passo concreto' },
  { hex: '#06b6d4', label: 'ciano', association: 'clareza, respiro e redução de carga mental', care: 'abrir espaço antes de decidir' },
  { hex: '#8b5cf6', label: 'violeta', association: 'introspecção, elaboração e complexidade interna', care: 'dar linguagem ao que ainda está difuso' },
  { hex: '#10b981', label: 'verde', association: 'equilíbrio, recuperação e sensação de ajuste', care: 'preservar o que ajuda a regular' },
  { hex: '#ec4899', label: 'rosa', association: 'afeto, vínculo e sensibilidade relacional', care: 'acolher sem perder contorno' },
  { hex: '#f59e0b', label: 'âmbar', association: 'otimismo, calor e abertura', care: 'sustentar o que está voltando a acender' },
  { hex: '#ef4444', label: 'vermelho', association: 'alta ativação, urgência e intensidade', care: 'canalizar energia com limite e direção' },
  { hex: '#3b82f6', label: 'azul', association: 'organização, calma relativa e busca de controle', care: 'reduzir a pressão e estabilizar o ritmo' },
  { hex: '#14b8a6', label: 'turquesa', association: 'regulação, frescor e flexibilidade', care: 'retomar o centro com suavidade' },
  { hex: '#84cc16', label: 'lima', association: 'vitalidade, renovação e impulso de mudança', care: 'converter vontade em rotina simples' },
  { hex: '#e11d48', label: 'magenta', association: 'expressão emocional intensa e necessidade de contato', care: 'nomear a intensidade antes de agir' },
  { hex: '#6366f1', label: 'anil', association: 'reflexão, profundidade e estrutura mental', care: 'organizar pensamentos em partes menores' },
];

const initialScores: Record<AreaId, number> = {
  emocional: 0,
  energia: 0,
  autoestima: 0,
  relacionamentos: 0,
  familia: 0,
  social: 0,
  proposito: 0,
  financeiro: 0,
  criatividade: 0,
  espiritualidade: 0,
  trabalho: 0,
  lazer: 0,
};

const initialNotes: Record<AreaId, string> = {
  emocional: '',
  energia: '',
  autoestima: '',
  relacionamentos: '',
  familia: '',
  social: '',
  proposito: '',
  financeiro: '',
  criatividade: '',
  espiritualidade: '',
  trabalho: '',
  lazer: '',
};

const initialAreaColors: Record<AreaId, string> = {
  emocional: DEFAULT_COLOR,
  energia: DEFAULT_COLOR,
  autoestima: DEFAULT_COLOR,
  relacionamentos: DEFAULT_COLOR,
  familia: DEFAULT_COLOR,
  social: DEFAULT_COLOR,
  proposito: DEFAULT_COLOR,
  financeiro: DEFAULT_COLOR,
  criatividade: DEFAULT_COLOR,
  espiritualidade: DEFAULT_COLOR,
  trabalho: DEFAULT_COLOR,
  lazer: DEFAULT_COLOR,
};

const toRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const getClosestColorProfile = (hex: string) => {
  const target = hexToRgb(hex);
  return colorProfiles.reduce((best, current) => {
    const currentRgb = hexToRgb(current.hex);
    const bestRgb = hexToRgb(best.hex);
    const currentDistance = Math.sqrt((target.r - currentRgb.r) ** 2 + (target.g - currentRgb.g) ** 2 + (target.b - currentRgb.b) ** 2);
    const bestDistance = Math.sqrt((target.r - bestRgb.r) ** 2 + (target.g - bestRgb.g) ** 2 + (target.b - bestRgb.b) ** 2);
    return currentDistance < bestDistance ? current : best;
  }, colorProfiles[0]);
};

const polarPoint = (cx: number, cy: number, radius: number, angle: number) => ({
  x: cx + Math.cos(angle) * radius,
  y: cy + Math.sin(angle) * radius,
});

export default function LifeWheelSection({ darkMode: dm, onNavigate }: Props) {
  const [scores, setScores] = useState<Record<AreaId, number>>(initialScores);
  const [notes, setNotes] = useState<Record<AreaId, string>>(initialNotes);
  const [areaColors, setAreaColors] = useState<Record<AreaId, string>>(initialAreaColors);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [mapTitle, setMapTitle] = useState('');
  const [history, setHistory] = useAppPersistence<WheelRecord[]>('life_wheel_history_v2', []);
  const [openedRecordId, setOpenedRecordId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<AreaId | null>(null);
  const [isPainting, setIsPainting] = useState(false);

  const c = (l: string, d: string) => (dm ? d : l);
  const currentRecord = history.find((item) => item.id === openedRecordId) || null;

  const orderedAreas = useMemo(() => [...areas].sort((a, b) => scores[a.id] - scores[b.id]), [scores]);
  const weakest = orderedAreas[0];
  const strongest = orderedAreas[orderedAreas.length - 1];
  const avg = Math.round(Object.values(scores).reduce((acc, value) => acc + value, 0) / areas.length);
  const lowAreas = orderedAreas.filter((area) => scores[area.id] <= 4).map((area) => area.label);
  const highAreas = [...orderedAreas].reverse().filter((area) => scores[area.id] >= 7).map((area) => area.label);
  const filledAreas = areas.filter((area) => scores[area.id] > 0);
  const dominantColorProfile = useMemo(() => {
    if (filledAreas.length === 0) return null;
    const counts = filledAreas.reduce<Record<string, number>>((acc, area) => {
      const key = areaColors[area.id];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const [topColor] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      profile: getClosestColorProfile(topColor),
      count: counts[topColor],
      distinctCount: Object.keys(counts).length,
    };
  }, [areaColors, filledAreas]);

  const wheelAnalysis = useMemo(() => {
    const spread =
      lowAreas.length >= 3
        ? 'Seu mapa mostra várias áreas pedindo atenção ao mesmo tempo, o que sugere foco em reduzir sobrecarga e escolher prioridades.'
        : lowAreas.length === 0
          ? 'Seu mapa aparece mais equilibrado neste momento, com poucas áreas em sinal de alerta.'
          : `Seu mapa concentra mais atenção em ${lowAreas.join(', ')}.`;

    const strength =
      highAreas.length > 0
        ? `As áreas mais fortalecidas agora são ${highAreas.join(', ')}, o que pode servir como base de apoio para o restante.`
        : `Ainda não há áreas muito altas, o que pode indicar um momento mais de sustentação do que de expansão.`;

    const averageLine =
      avg <= 4
        ? 'A média geral sugere um momento mais exigente, em que passos pequenos tendem a funcionar melhor do que mudanças grandes.'
        : avg >= 7
          ? 'A média geral sugere um momento com mais recursos disponíveis, mesmo que ainda existam pontos a cuidar.'
          : 'A média geral sugere um momento intermediário, com áreas de recurso e áreas que ainda precisam de ajuste.';

    const contrast = scores[strongest.id] - scores[weakest.id];
    const contrastLine =
      contrast >= 4
        ? `Existe um contraste importante entre ${strongest.label} (${scores[strongest.id]}/10) e ${weakest.label} (${scores[weakest.id]}/10).`
        : `As diferenças entre a área mais alta e a mais baixa estão mais moderadas neste momento.`;

    const colorLine =
      dominantColorProfile === null
        ? 'As cores ainda não entram na leitura porque não há áreas preenchidas o suficiente.'
        : dominantColorProfile.distinctCount >= 5
          ? `Você distribuiu várias cores pelo mapa. Isso sugere diferenciação entre áreas, mais do que um único clima geral.`
          : `A cor que mais se repete é ${dominantColorProfile.profile.label} em ${dominantColorProfile.count} área(s). Na literatura, ela costuma se associar a ${dominantColorProfile.profile.association}; aqui ela entra só como pista contextual, não como conclusão isolada.`;

    const colorCareLine =
      dominantColorProfile === null
        ? 'Quando você começar a preencher o mapa, as escolhas de cor passam a complementar a leitura.'
        : `Como pista complementar de cuidado, essa cor costuma convidar a ${dominantColorProfile.profile.care}.`;

    return {
      title: 'Leitura objetiva da sua roda atual.',
      spread,
      strength,
      averageLine,
      contrastLine,
      colorLine,
      colorCareLine,
    };
  }, [avg, dominantColorProfile, highAreas, lowAreas, scores, strongest.id, strongest.label, weakest.id, weakest.label]);

  const resetMap = () => {
    setScores(initialScores);
    setNotes(initialNotes);
    setAreaColors(initialAreaColors);
    setSelectedColor(DEFAULT_COLOR);
    setMapTitle('');
    setEditingRecordId(null);
    setOpenedRecordId(null);
    setActiveArea(null);
  };

  const saveMap = () => {
    const normalizedTitle = mapTitle.trim();
    const nextRecord: WheelRecord = {
      id: editingRecordId || crypto.randomUUID(),
      createdAt: editingRecordId ? history.find((item) => item.id === editingRecordId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      title: normalizedTitle,
      color: selectedColor,
      scores,
      notes,
      areaColors,
    };

    const nextHistory = editingRecordId
      ? history.map((item) => (item.id === editingRecordId ? nextRecord : item))
      : [nextRecord, ...history].slice(0, 12);

    setHistory(nextHistory);
    setEditingRecordId(nextRecord.id);
  };

  const openRecord = (record: WheelRecord) => {
    setOpenedRecordId(record.id);
  };

  const deleteRecord = (id: string) => {
    setHistory(history.filter((item) => item.id !== id));
    if (openedRecordId === id) setOpenedRecordId(null);
    if (editingRecordId === id) setEditingRecordId(null);
  };

  const loadRecordIntoEditor = (record: WheelRecord) => {
    setScores(record.scores);
    setNotes(record.notes);
    setAreaColors(record.areaColors || Object.fromEntries(areas.map((area) => [area.id, record.color])) as Record<AreaId, string>);
    setSelectedColor(record.color);
    setMapTitle(record.title || '');
    setEditingRecordId(record.id);
    setOpenedRecordId(null);
  };

  const buildShareCanvas = (record: WheelRecord) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const bg = dm ? '#020617' : '#f8fafc';
    const panel = dm ? '#0f172a' : '#ffffff';
    const line = dm ? 'rgba(148,163,184,0.28)' : 'rgba(100,116,139,0.28)';
    const colorsMap = record.areaColors || Object.fromEntries(areas.map((area) => [area.id, record.color])) as Record<AreaId, string>;
    const cx = 700;
    const cy = 650;
    const radius = 430;
    const angleStep = (Math.PI * 2) / areas.length;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = panel;
    ctx.beginPath();
    ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 40);
    ctx.fill();

    ctx.fillStyle = dm ? '#f8fafc' : '#0f172a';
    ctx.font = '900 54px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(record.title?.trim() || 'Mapa da Minha Vida', 90, 130);

    ctx.fillStyle = dm ? 'rgba(226,232,240,0.8)' : 'rgba(71,85,105,0.9)';
    ctx.font = '600 28px Arial';
    ctx.fillText(new Date(record.createdAt).toLocaleString('pt-BR'), 90, 175);

    areas.forEach((area, areaIndex) => {
      const startAngle = -Math.PI / 2 + areaIndex * angleStep - angleStep / 2;
      const endAngle = startAngle + angleStep;

      Array.from({ length: WHEEL_LEVELS }).forEach((_, levelIndex) => {
        const level = levelIndex + 1;
        const innerRadius = (radius * levelIndex) / WHEEL_LEVELS;
        const outerRadius = (radius * level) / WHEEL_LEVELS;
        const p1 = polarPoint(cx, cy, innerRadius, startAngle);
        const p2 = polarPoint(cx, cy, outerRadius, startAngle);
        const p3 = polarPoint(cx, cy, outerRadius, endAngle);
        const p4 = polarPoint(cx, cy, innerRadius, endAngle);
        const filled = level <= record.scores[area.id];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fillStyle = filled ? toRgba(colorsMap[area.id] || record.color, 0.82) : dm ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.96)';
        ctx.strokeStyle = filled ? colorsMap[area.id] || record.color : line;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });

      const iconPoint = polarPoint(cx, cy, radius + 28, -Math.PI / 2 + areaIndex * angleStep);
      ctx.font = '700 32px Arial';
      ctx.textAlign = iconPoint.x < cx - 8 ? 'right' : iconPoint.x > cx + 8 ? 'left' : 'center';
      ctx.fillStyle = dm ? '#e5e7eb' : '#0f172a';
      ctx.fillText(area.icon, iconPoint.x, iconPoint.y);
    });

    const strongestArea = [...areas].sort((a, b) => record.scores[b.id] - record.scores[a.id])[0];
    const weakestArea = [...areas].sort((a, b) => record.scores[a.id] - record.scores[b.id])[0];

    ctx.textAlign = 'left';
    ctx.fillStyle = dm ? '#e5e7eb' : '#0f172a';
    ctx.font = '900 34px Arial';
    ctx.fillText('Resumo do mapa', 90, 1170);
    ctx.font = '600 28px Arial';
    ctx.fillStyle = dm ? 'rgba(226,232,240,0.82)' : 'rgba(71,85,105,0.92)';
    ctx.fillText(`Área mais forte: ${strongestArea.label} (${record.scores[strongestArea.id]}/10)`, 90, 1220);
    ctx.fillText(`Área que pede cuidado: ${weakestArea.label} (${record.scores[weakestArea.id]}/10)`, 90, 1265);

    return canvas;
  };

  const shareRecord = async (record: WheelRecord) => {
    const ranked = [...areas].sort((a, b) => record.scores[a.id] - record.scores[b.id]);
    const weakestArea = ranked[0];
    const strongestArea = ranked[ranked.length - 1];
    const title = record.title?.trim() || 'Mapa da Minha Vida';
    const text = `${title}\nData: ${new Date(record.createdAt).toLocaleString('pt-BR')}\nÁrea que mais pede cuidado: ${weakestArea.label} (${record.scores[weakestArea.id]}/10)\nÁrea mais fortalecida: ${strongestArea.label} (${record.scores[strongestArea.id]}/10)`;
    const canvas = typeof document !== 'undefined' ? buildShareCanvas(record) : null;
    const blob = canvas ? await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), 'image/png')) : null;

    if (typeof navigator !== 'undefined' && navigator.share && blob) {
      try {
        const file = new File([blob], 'mapa-da-minha-vida.png', { type: 'image/png' });
        await navigator.share({ title, text, files: [file] });
        return;
      } catch {
        // fallback below
      }
    }

    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mapa-da-minha-vida.png';
      link.click();
      URL.revokeObjectURL(url);
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  const setAreaScore = (areaId: AreaId, value: number) => {
    setScores((prev) => ({ ...prev, [areaId]: value }));
    setAreaColors((prev) => ({ ...prev, [areaId]: selectedColor }));
  };

  const wheelLegend = (scoresMap: Record<AreaId, number>, highlightedArea?: AreaId | null) => {
    const ranked = [...areas].sort((a, b) => scoresMap[a.id] - scoresMap[b.id]);
    const localWeakest = ranked[0];
    const localStrongest = ranked[ranked.length - 1];

    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
      {areas.map((area) => {
        const isActive = highlightedArea === area.id;
        const isWeakest = localWeakest.id === area.id;
        const isStrongest = localStrongest.id === area.id;
        return (
          <div
            key={area.id}
            className={`rounded-[1rem] px-3 py-2.5 transition-all ${
              isActive
                ? c('bg-amber-50 ring-2 ring-amber-200', 'bg-amber-500/10 ring-2 ring-amber-500/20')
                : isWeakest
                  ? c('bg-rose-50 ring-1 ring-rose-100', 'bg-rose-500/10 ring-1 ring-rose-500/20')
                  : isStrongest
                    ? c('bg-emerald-50 ring-1 ring-emerald-100', 'bg-emerald-500/10 ring-1 ring-emerald-500/20')
                    : c('bg-slate-100', 'bg-slate-800')
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-black leading-tight">
                {area.icon} {area.label}
              </p>
              <span className={`text-xs sm:text-sm font-black ${isActive ? c('text-amber-800', 'text-amber-300') : ''}`}>{scoresMap[area.id]}/10</span>
            </div>
            {(isWeakest || isStrongest) && (
              <p className={`text-[10px] mt-1 font-black uppercase tracking-[0.16em] ${isWeakest ? c('text-rose-700', 'text-rose-300') : c('text-emerald-700', 'text-emerald-300')}`}>
                {isWeakest ? 'Pede atenção' : 'Mais forte'}
              </p>
            )}
          </div>
        );
      })}
    </div>
    );
  };

  const wheelScaleLabels = (cx: number, cy: number, radius: number) => {
    // We'll place the numbers in the center of the first area's slice to be "inside"
    const firstAreaAngle = -Math.PI / 2;

    return Array.from({ length: WHEEL_LEVELS }).map((_, levelIndex) => {
      const value = levelIndex + 1;
      // Position at the middle of the level segment
      const labelRadius = (radius * (levelIndex + 0.5)) / WHEEL_LEVELS;
      const point = polarPoint(cx, cy, labelRadius, firstAreaAngle);

      return (
        <text
          key={`scale-${value}`}
          x={point.x}
          y={point.y + 4}
          textAnchor="middle"
          fill={dm ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)'}
          fontSize="11"
          fontWeight="900"
          pointerEvents="none"
          className="drop-shadow-sm"
        >
          {value}
        </text>
      );
    });
  };

  const paintArea = (areaId: AreaId, value: number) => {
    setActiveArea(areaId);
    setAreaScore(areaId, value);
  };

  const interactiveWheelSvg = () => {
    const cx = WHEEL_CENTER;
    const cy = WHEEL_CENTER;
    const radius = WHEEL_RADIUS;
    const angleStep = (Math.PI * 2) / areas.length;

    return (
      <svg viewBox={`0 0 ${WHEEL_VIEWBOX} ${WHEEL_VIEWBOX}`} className="w-full max-w-[720px] mx-auto" onPointerUp={() => setIsPainting(false)} onPointerLeave={() => setIsPainting(false)}>
        {areas.map((area, areaIndex) => {
          const startAngle = -Math.PI / 2 + areaIndex * angleStep - angleStep / 2;
          const endAngle = startAngle + angleStep;

          return Array.from({ length: WHEEL_LEVELS }).map((_, levelIndex) => {
            const level = levelIndex + 1;
            const innerRadius = (radius * levelIndex) / WHEEL_LEVELS;
            const outerRadius = (radius * level) / WHEEL_LEVELS;

            const p1 = polarPoint(cx, cy, innerRadius, startAngle);
            const p2 = polarPoint(cx, cy, outerRadius, startAngle);
            const p3 = polarPoint(cx, cy, outerRadius, endAngle);
            const p4 = polarPoint(cx, cy, innerRadius, endAngle);

            const filled = level <= scores[area.id];
            const path = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;

            return (
              <path
                key={`${area.id}-${level}`}
                d={path}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setIsPainting(true);
                  paintArea(area.id, level);
                }}
                onMouseEnter={() => setActiveArea(area.id)}
                onPointerEnter={() => {
                  setActiveArea(area.id);
                  if (isPainting) paintArea(area.id, level);
                }}
                onFocus={() => setActiveArea(area.id)}
                fill={filled ? toRgba(areaColors[area.id], 0.78) : dm ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.9)'}
                stroke={activeArea === area.id ? selectedColor : filled ? areaColors[area.id] : dm ? 'rgba(148,163,184,0.22)' : 'rgba(148,163,184,0.28)'}
                strokeWidth={activeArea === area.id ? 2.8 : 1.2}
                className="cursor-pointer transition-all"
              />
            );
          });
        })}

        {areas.map((area, areaIndex) => {
          const angle = -Math.PI / 2 + areaIndex * angleStep;
          const label = polarPoint(cx, cy, WHEEL_LABEL_RADIUS, angle);
          return (
            <text
              key={area.id}
              x={label.x}
              y={label.y}
              textAnchor={label.x < cx - 8 ? 'end' : label.x > cx + 8 ? 'start' : 'middle'}
              dominantBaseline="middle"
              fill={activeArea === area.id ? selectedColor : dm ? '#e5e7eb' : '#0f172a'}
              fontSize={activeArea === area.id ? '28' : '20'}
              fontWeight="700"
              className="transition-all duration-200"
            >
              {area.icon}
            </text>
          );
        })}

        {wheelScaleLabels(cx, cy, radius)}
      </svg>
    );
  };

  const staticWheelSvg = (scoresMap: Record<AreaId, number>, colorsMap: Record<AreaId, string>, fallbackColor: string) => {
    const cx = WHEEL_CENTER;
    const cy = WHEEL_CENTER;
    const radius = WHEEL_RADIUS;
    const angleStep = (Math.PI * 2) / areas.length;

    return (
      <svg viewBox={`0 0 ${WHEEL_VIEWBOX} ${WHEEL_VIEWBOX}`} className="w-full max-w-[720px] mx-auto">
        {areas.map((area, areaIndex) => {
          const startAngle = -Math.PI / 2 + areaIndex * angleStep - angleStep / 2;
          const endAngle = startAngle + angleStep;

          return Array.from({ length: WHEEL_LEVELS }).map((_, levelIndex) => {
            const level = levelIndex + 1;
            const innerRadius = (radius * levelIndex) / WHEEL_LEVELS;
            const outerRadius = (radius * level) / WHEEL_LEVELS;
            const p1 = polarPoint(cx, cy, innerRadius, startAngle);
            const p2 = polarPoint(cx, cy, outerRadius, startAngle);
            const p3 = polarPoint(cx, cy, outerRadius, endAngle);
            const p4 = polarPoint(cx, cy, innerRadius, endAngle);
            const filled = level <= scoresMap[area.id];

            return (
              <path
                key={`${area.id}-${level}`}
                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`}
                fill={filled ? toRgba(colorsMap[area.id] || fallbackColor, 0.78) : dm ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.9)'}
                stroke={filled ? colorsMap[area.id] || fallbackColor : dm ? 'rgba(148,163,184,0.22)' : 'rgba(148,163,184,0.28)'}
                strokeWidth="1"
              />
            );
          });
        })}

        {areas.map((area, areaIndex) => {
          const angle = -Math.PI / 2 + areaIndex * angleStep;
          const label = polarPoint(cx, cy, WHEEL_LABEL_RADIUS, angle);
          return (
            <text
              key={area.id}
              x={label.x}
              y={label.y}
              textAnchor={label.x < cx - 8 ? 'end' : label.x > cx + 8 ? 'start' : 'middle'}
              dominantBaseline="middle"
              fill={dm ? '#e5e7eb' : '#0f172a'}
              fontSize="20"
              fontWeight="700"
            >
              {area.icon}
            </text>
          );
        })}

        {wheelScaleLabels(cx, cy, radius)}
      </svg>
    );
  };

  return (
    <div className={`p-0 pb-24 w-full max-w-none transition-colors duration-700 ${dm ? 'text-white' : ''}`} style={{ backgroundColor: activeArea ? toRgba(selectedColor, dm ? 0.05 : 0.03) : 'transparent' }}>
      <div className="px-4 py-6 sm:px-0 sm:py-0">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Visão ampla do momento"
          title="Mapa da Minha Vida"
          description="Preencha cada área de 1 a 10 e veja com mais clareza o que está forte e o que pede cuidado agora."
          icon="🗺️"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-2xl p-3 ${c('bg-white/80 border border-white text-slate-700', 'bg-slate-900/50 border border-slate-700 text-slate-200')}`}>
              <p className="text-sm font-black">Média atual</p>
              <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{avg}/10 no conjunto da roda.</p>
            </div>
            <div className={`rounded-2xl p-3 ${c('bg-white/80 border border-white text-slate-700', 'bg-slate-900/50 border border-slate-700 text-slate-200')}`}>
              <p className="text-sm font-black">Área que mais pede cuidado</p>
              <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{weakest.label}</p>
            </div>
          </div>
        </SectionHeroCard>
      </div>

      <div className="grid gap-0 sm:gap-6 xl:grid-cols-[1.1fr_0.9fr] mt-0 sm:mt-6" onMouseLeave={() => setActiveArea(null)} onPointerUp={() => setIsPainting(false)}>
        <div className="space-y-0 sm:space-y-6">
          <div className={`rounded-none sm:rounded-[2rem] border-x-0 sm:border px-4 py-6 sm:p-6 ${c('bg-white/60 backdrop-blur-sm border-slate-100', 'bg-slate-900/60 backdrop-blur-sm border-slate-800')}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Cor da roda</p>
                <h3 className="text-xl font-black mt-1">Personalize seu mapa</h3>
              </div>
              <span className="w-10 h-10 rounded-2xl border-2 border-white/20 shadow-inner transition-all transform hover:scale-110" style={{ backgroundColor: selectedColor }} />
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {palette.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all duration-300 ${selectedColor === color ? 'scale-110 border-slate-900 dark:border-white shadow-xl rotate-3' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
              placeholder="Título opcional, ex.: como estou hoje"
              className={`w-full mt-5 p-3 rounded-2xl border text-sm ${c('bg-white border-slate-200', 'bg-slate-950 border-slate-700')}`}
            />
          </div>

          <div className={`rounded-none sm:rounded-[1.8rem] border-x-0 sm:border px-2 py-5 sm:p-5 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Avaliação das áreas</p>
            <div className={`relative rounded-3xl p-0 overflow-visible touch-none ${c('bg-slate-50/30', 'bg-slate-950/20')}`}>
              {interactiveWheelSvg()}
            </div>
            {wheelLegend(scores, activeArea)}
            <p className={`text-sm mt-4 ${c('text-slate-600', 'text-slate-300')}`}>
              Toque ou arraste em cada faixa da roda para definir o valor de 1 a 10 em cada área. O preenchimento aparece na hora com a cor escolhida.
            </p>
            {activeArea && (
              <div className={`rounded-[1.2rem] p-3 mt-3 ${c('bg-amber-50 text-amber-900', 'bg-amber-500/10 text-amber-200')}`}>
                <p className="text-sm font-black">{areas.find((area) => area.id === activeArea)?.label}</p>
                <p className="text-xs mt-1">Toque na faixa desejada para marcar o valor dessa área.</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {areas.map((area) => (
                <div key={area.id} className={`rounded-2xl p-5 transition-all duration-300 ${activeArea === area.id ? c('bg-white shadow-xl ring-2 ring-amber-100 -translate-y-1', 'bg-slate-900 shadow-xl ring-2 ring-amber-500/20 -translate-y-1') : c('bg-white/40', 'bg-slate-900/30')}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-black">{area.icon} {area.label}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-300')}`}>{scores[area.id]}/10</span>
                  </div>
                  <input
                    value={notes[area.id]}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [area.id]: e.target.value }))}
                    placeholder="Sua observação..."
                    className={`w-full mt-4 p-3 rounded-xl border-none text-sm transition-all ${c('bg-slate-50 focus:bg-white focus:shadow-inner', 'bg-slate-950/40 focus:bg-slate-950 focus:shadow-inner')}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-0 sm:space-y-6">
          <div className={`rounded-none sm:rounded-[2rem] border-x-0 sm:border p-6 sm:p-8 ${c('bg-white/70 backdrop-blur-lg border-slate-100', 'bg-slate-900/70 backdrop-blur-lg border-slate-800')}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Resultado</p>
                <h3 className="text-xl font-black mt-1">Sua roda preenchida</h3>
              </div>
              <div className={`px-4 py-2 rounded-2xl shadow-sm ${c('bg-amber-50 text-amber-800 border border-amber-100', 'bg-amber-500/10 text-amber-300 border border-amber-500/20')}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">Média</p>
                <p className="text-xl font-black mt-0.5">{avg}/10</p>
              </div>
            </div>

            <div className={`mt-8 rounded-3xl p-0 sm:p-4 touch-none ${c('bg-slate-50/40', 'bg-slate-950/20')}`}>
              {staticWheelSvg(scores, areaColors, selectedColor)}
            </div>
            <div className="mt-6 opacity-80">
              {wheelLegend(scores)}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className={`rounded-[1.2rem] p-3 ${c('bg-rose-50', 'bg-rose-500/10')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-rose-700', 'text-rose-300')}`}>Pede atenção</p>
                <p className="text-sm font-black mt-1">{weakest.label}</p>
              </div>
              <div className={`rounded-[1.2rem] p-3 ${c('bg-emerald-50', 'bg-emerald-500/10')}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-emerald-700', 'text-emerald-300')}`}>Mais forte</p>
                <p className="text-sm font-black mt-1">{strongest.label}</p>
              </div>
            </div>

            <div className={`rounded-[1.3rem] p-4 mt-4 ${c('bg-slate-50', 'bg-slate-800')}`}>
              <p className="text-sm">
                Seu mapa mostra mais recurso em <span className="font-black">{strongest.label}</span> e mais necessidade de cuidado em <span className="font-black">{weakest.label}</span>.
              </p>
              <p className={`text-sm mt-3 ${c('text-slate-600', 'text-slate-300')}`}>{weakest.suggestion}</p>
            </div>

            <div className={`rounded-[1.3rem] p-4 mt-4 border ${c('bg-violet-50 border-violet-100', 'bg-violet-500/10 border-violet-500/20')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-violet-800', 'text-violet-300')}`}>Leitura da roda</p>
              <div className="space-y-3 mt-3 text-sm">
                <p>{wheelAnalysis.title}</p>
                <p>{wheelAnalysis.spread}</p>
                <p>{wheelAnalysis.strength}</p>
                <p>{wheelAnalysis.averageLine}</p>
                <p className={`${c('text-slate-600', 'text-slate-300')}`}>{wheelAnalysis.contrastLine}</p>
                <p>{wheelAnalysis.colorLine}</p>
                <p className={`${c('text-slate-600', 'text-slate-300')}`}>{wheelAnalysis.colorCareLine}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <button onClick={saveMap} className="py-3 rounded-[1.2rem] text-sm font-black bg-sky-600 text-white">{editingRecordId ? 'Atualizar mapa' : 'Salvar mapa'}</button>
              <button onClick={resetMap} className={`py-3 rounded-[1.2rem] text-sm font-black ${c('bg-slate-100 text-slate-800', 'bg-slate-800 text-slate-200')}`}>Limpar mapa</button>
              <button onClick={() => onNavigate?.(weakest.nextTab)} className={`py-3 rounded-[1.2rem] text-sm font-black ${c('bg-amber-50 text-amber-800', 'bg-amber-500/10 text-amber-300')}`}>
                Abrir apoio para {weakest.label}
              </button>
            </div>

            <div className={`rounded-[1.3rem] p-4 mt-4 border ${c('bg-slate-50 border-slate-100', 'bg-slate-950 border-slate-700')}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Seguir por aqui</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {[
                  { label: 'Diário', hint: 'nomear e escrever a área mais sensível', tab: 'diary' as const },
                  { label: 'Hábitos', hint: 'transformar cuidado em rotina simples', tab: 'habits' as const },
                  { label: 'Missões', hint: 'definir um próximo passo da semana', tab: 'missions' as const },
                  { label: 'Exploração Vocacional', hint: 'aprofundar propósito e caminho', tab: 'vocacional' as const },
                ].map((item) => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => onNavigate?.(item.tab)}
                    className={`rounded-[1.2rem] border p-4 min-h-[88px] text-left ${c('bg-white border-white text-slate-700', 'bg-slate-900 border-slate-700 text-slate-200')}`}
                  >
                    <p className="text-sm font-black">{item.label}</p>
                    <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{item.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`rounded-[1.8rem] border p-5 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Histórico</p>
                <h3 className="text-lg font-black mt-1">Abrir, excluir ou compartilhar</h3>
              </div>
              <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>{history.length} salvo(s)</span>
            </div>

            <div className="space-y-3 mt-4">
              {history.length === 0 && (
                <div className={`rounded-[1.3rem] p-4 text-sm ${c('bg-slate-50 text-slate-500', 'bg-slate-800 text-slate-400')}`}>
                  Seus mapas salvos aparecem aqui para revisão futura.
                </div>
              )}
              {history.map((item) => {
                const sorted = [...areas].sort((a, b) => item.scores[a.id] - item.scores[b.id]);
                return (
                  <div key={item.id} className={`rounded-[1.3rem] p-4 ${c('bg-slate-50', 'bg-slate-800')}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{item.title?.trim() || sorted[0].label}</p>
                        <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{new Date(item.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                      <span className="w-5 h-5 rounded-full border border-white/40" style={{ backgroundColor: item.color }} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button onClick={() => openRecord(item)} className={`py-2 rounded-2xl text-xs font-black ${c('bg-slate-200 text-slate-800 hover:bg-slate-300', 'bg-slate-950 text-slate-200 hover:bg-slate-700')}`}>Abrir</button>
                      <button onClick={() => loadRecordIntoEditor(item)} className={`py-2 rounded-2xl text-xs font-black ${c('bg-amber-100 text-amber-900', 'bg-amber-500/10 text-amber-300')}`}>Editar</button>
                      <button onClick={() => void shareRecord(item)} className="py-2 rounded-2xl text-xs font-black bg-sky-600 text-white">Compartilhar</button>
                      <button onClick={() => deleteRecord(item.id)} className="py-2 rounded-2xl text-xs font-black bg-rose-600 text-white">Excluir</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentRecord && (
            <div className={`rounded-[1.8rem] border p-5 ${c('bg-white border-slate-100', 'bg-slate-900 border-slate-700')}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>Visualização salva</p>
                  <h3 className="text-lg font-black mt-1">{currentRecord.title?.trim() || new Date(currentRecord.createdAt).toLocaleString('pt-BR')}</h3>
                </div>
                <button onClick={() => setOpenedRecordId(null)} className={`px-4 py-2 rounded-2xl text-xs font-black ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200')}`}>Fechar</button>
              </div>

              <div className={`mt-4 rounded-3xl p-0 sm:p-4 touch-none ${c('bg-slate-50/40', 'bg-slate-950/20')}`}>
                {staticWheelSvg(currentRecord.scores, currentRecord.areaColors || Object.fromEntries(areas.map((area) => [area.id, currentRecord.color])) as Record<AreaId, string>, currentRecord.color)}
              </div>
              {wheelLegend(currentRecord.scores)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
