'use client';

import { useRef, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ArtEntry {
  id: string;
  createdAt: string;
  emotion: string;
  color: string;
  shape: ShapeType;
  imageData?: string;
}

type ShapeType = 'círculo' | 'ondas' | 'linhas' | 'espiral' | 'triângulos' | 'estrelas' | 'pontos' | 'ziguezague';

interface Props { darkMode?: boolean }

const palettes = ['#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b', '#111827'];
const emotionPresets = ['Ansioso', 'Sobrecarregado', 'Confuso', 'Triste', 'Aliviado', 'Calmo', 'Com raiva', 'Esperançoso'];

export default function ArtEmotionSection({ darkMode: dm }: Props) {
  const [history, setHistory] = useLocalStorage<ArtEntry[]>('psico_art_emotion', []);
  const [emotion, setEmotion] = useState('Não sei o que estou sentindo');
  const [color, setColor] = useState('#8b5cf6');
  const [shape, setShape] = useState<ShapeType>('círculo');
  const [reflection, setReflection] = useState('');
  const [beforeShot, setBeforeShot] = useState<string | null>(null);
  const [afterShot, setAfterShot] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<'auto' | 'livre'>('auto');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const c = (l: string, d: string) => (dm ? d : l);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = dm ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawMode !== 'livre') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPoint(e);
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawMode !== 'livre' || !isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (drawMode !== 'livre') return;
    setIsDrawing(false);
  };

  const paint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = dm ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    if (shape === 'círculo') {
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.arc(40 + i * 35, 90 + (i % 3) * 20, 10 + i * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (shape === 'linhas') {
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(10, 20 + i * 20);
        ctx.lineTo(350, 20 + i * 20 + ((i % 2) * 8));
        ctx.stroke();
      }
    }

    if (shape === 'ondas') {
      for (let y = 40; y <= 190; y += 22) {
        ctx.beginPath();
        for (let x = 8; x <= 352; x += 8) {
          const waveY = y + Math.sin(x * 0.06) * 10;
          if (x === 8) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
    }

    if (shape === 'espiral') {
      ctx.beginPath();
      let angle = 0;
      let radius = 2;
      while (radius < 120) {
        const x = 180 + Math.cos(angle) * radius;
        const y = 110 + Math.sin(angle) * radius;
        ctx.lineTo(x, y);
        angle += 0.22;
        radius += 0.23;
      }
      ctx.stroke();
    }

    if (shape === 'triângulos') {
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * 36;
        const y = 60 + (i % 2) * 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 18, y + 30);
        ctx.lineTo(x - 18, y + 30);
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (shape === 'estrelas') {
      for (let i = 0; i < 8; i++) {
        const cx = 35 + i * 42;
        const cy = 100 + (i % 2) * 20;
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = (Math.PI * 2 * p) / 5 - Math.PI / 2;
          const ox = cx + Math.cos(a) * 14;
          const oy = cy + Math.sin(a) * 14;
          const ia = a + Math.PI / 5;
          const ix = cx + Math.cos(ia) * 6;
          const iy = cy + Math.sin(ia) * 6;
          if (p === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    if (shape === 'pontos') {
      for (let i = 0; i < 130; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 1 + Math.random() * 4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (shape === 'ziguezague') {
      for (let y = 30; y < 200; y += 28) {
        ctx.beginPath();
        let up = true;
        for (let x = 0; x <= 360; x += 18) {
          ctx.lineTo(x, y + (up ? -8 : 8));
          up = !up;
        }
        ctx.stroke();
      }
    }

    setReflection('O que essa arte diz sobre você agora? Qual parte chama mais atenção? O que mudou no seu corpo após criar?');
  };

  const save = () => {
    const imageData = canvasRef.current?.toDataURL('image/png');
    setHistory([
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), emotion, color, shape, imageData },
      ...history,
    ]);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `arte-emocional-${Date.now()}.png`;
    a.click();
  };

  const snapshotBefore = () => {
    const data = canvasRef.current?.toDataURL('image/png');
    if (data) setBeforeShot(data);
  };

  const snapshotAfter = () => {
    const data = canvasRef.current?.toDataURL('image/png');
    if (data) setAfterShot(data);
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🎨 Modo Arte</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Expresse emoções com cores e formas, sem precisar escrever.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <input value={emotion} onChange={(e) => setEmotion(e.target.value)} className={`w-full mb-3 p-3 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />

        <div className="flex flex-wrap gap-2 mb-3">
          {emotionPresets.map((e) => (
            <button key={e} onClick={() => setEmotion(e)} className={`px-3 py-1 rounded-full text-xs font-bold ${c('bg-slate-100 text-slate-700','bg-slate-700 text-slate-200')}`}>{e}</button>
          ))}
        </div>

        <div className={`rounded-2xl p-3 border mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
          <p className="text-xs font-bold mb-2">Painel de Cores</p>
          <div className="flex items-center gap-3 mb-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded-xl" />
            <div className="text-xs font-mono">{color}</div>
          </div>
          <div className="grid grid-cols-9 gap-2">
            {palettes.map((p) => (
              <button key={p} onClick={() => setColor(p)} className={`w-7 h-7 rounded-full border-2 ${color === p ? 'scale-110 border-white shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: p }} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setDrawMode('auto')} className={`py-2 rounded-xl text-sm font-bold ${drawMode === 'auto' ? 'bg-fuchsia-600 text-white' : c('bg-slate-100 text-slate-700','bg-slate-700 text-slate-200')}`}>Auto</button>
          <button onClick={() => setDrawMode('livre')} className={`py-2 rounded-xl text-sm font-bold ${drawMode === 'livre' ? 'bg-fuchsia-600 text-white' : c('bg-slate-100 text-slate-700','bg-slate-700 text-slate-200')}`}>Pincel livre ✍️</button>
        </div>

        {drawMode === 'auto' ? (
          <select value={shape} onChange={(e) => setShape(e.target.value as ShapeType)} className={`w-full p-3 rounded-xl border text-sm mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <option value="círculo">Círculos</option>
            <option value="ondas">Ondas</option>
            <option value="linhas">Linhas</option>
            <option value="espiral">Espiral</option>
            <option value="triângulos">Triângulos</option>
            <option value="estrelas">Estrelas</option>
            <option value="pontos">Pontos</option>
            <option value="ziguezague">Zigue-zague</option>
          </select>
        ) : (
          <div className={`rounded-xl p-3 border mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <div className="flex justify-between text-xs font-bold mb-1"><span>Espessura do pincel</span><span>{brushSize}px</span></div>
            <input type="range" min="1" max="16" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full" />
          </div>
        )}

        <canvas ref={canvasRef} width={360} height={220} onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerLeave={endDraw} className={`w-full rounded-2xl border touch-none ${c('border-slate-200', 'border-slate-700')}`} />

        <div className="grid grid-cols-4 gap-2 mt-3">
          <button onClick={paint} disabled={drawMode !== 'auto'} className={`py-3 rounded-xl text-white font-bold text-sm ${drawMode === 'auto' ? 'bg-fuchsia-600' : 'bg-slate-400 cursor-not-allowed'}`}>Gerar</button>
          <button onClick={clearCanvas} className="py-3 rounded-xl bg-slate-600 text-white font-bold text-sm">Limpar</button>
          <button onClick={save} className="py-3 rounded-xl bg-sky-600 text-white font-bold text-sm">Salvar</button>
          <button onClick={exportImage} className="py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">Exportar</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={snapshotBefore} className={`py-2 rounded-xl text-xs font-bold ${c('bg-indigo-50 text-indigo-700','bg-indigo-900/30 text-indigo-300')}`}>Capturar antes</button>
          <button onClick={snapshotAfter} className={`py-2 rounded-xl text-xs font-bold ${c('bg-amber-50 text-amber-700','bg-amber-900/30 text-amber-300')}`}>Capturar depois</button>
        </div>

        {reflection && (
          <div className={`mt-3 p-3 rounded-xl text-xs ${c('bg-violet-50 text-violet-800','bg-violet-900/20 text-violet-200')}`}>
            <p className="font-bold mb-1">Reflexão guiada</p>
            <p>{reflection}</p>
          </div>
        )}
      </div>

      {(beforeShot || afterShot) && (
        <div className={`rounded-3xl p-4 border mb-4 ${c('bg-white border-slate-100','bg-slate-800/70 border-slate-700')}`}>
          <p className="font-bold text-sm mb-2">Comparação antes/depois</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] mb-1 opacity-70">Antes</p>
              {beforeShot ? <img src={beforeShot} alt="antes" className="rounded-xl border" /> : <div className={`h-24 rounded-xl ${c('bg-slate-100','bg-slate-700')}`} />}
            </div>
            <div>
              <p className="text-[10px] mb-1 opacity-70">Depois</p>
              {afterShot ? <img src={afterShot} alt="depois" className="rounded-xl border" /> : <div className={`h-24 rounded-xl ${c('bg-slate-100','bg-slate-700')}`} />}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {history.slice(0, 8).map((h) => (
          <div key={h.id} className={`p-3 rounded-xl text-sm border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs">{h.emotion} • {h.shape} • <span style={{ color: h.color }}>{h.color}</span></p>
              <span className="text-[10px] opacity-70">{new Date(h.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {h.imageData && <img src={h.imageData} alt="arte" className="mt-2 rounded-xl border" />}
          </div>
        ))}
      </div>
    </div>
  );
}
