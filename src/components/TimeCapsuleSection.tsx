'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type CapsuleType = 'futuro' | 'passado';
type OpenWhen = 'sempre' | 'triste' | 'ansioso' | 'sobrecarregado';

interface CapsuleEntry {
  id: string;
  type: CapsuleType;
  title: string;
  text: string;
  createdAt: string;
  openAt: string;
  openWhen?: OpenWhen;
  imageData?: string;
  audioData?: string;
}

interface Props {
  darkMode?: boolean;
}

const prompts = [
  'O que eu preciso lembrar quando estiver mal?',
  'Do que eu preciso me perdoar hoje?',
  'Qual conselho eu daria para mim com carinho?',
  'Qual pequena vitória eu não quero esquecer?',
];

export default function TimeCapsuleSection({ darkMode: dm }: Props) {
  const [entries, setEntries] = useLocalStorage<CapsuleEntry[]>('psico_time_capsule', []);
  const [type, setType] = useState<CapsuleType>('futuro');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [delayDays, setDelayDays] = useState<number>(30);
  const [datePreset, setDatePreset] = useState<'dias' | 'natal' | 'reveillon' | 'aniversario'>('dias');
  const [openWhen, setOpenWhen] = useState<OpenWhen>('sempre');
  const [imageData, setImageData] = useState<string>('');
  const [audioData, setAudioData] = useState<string>('');
  const [showSeal, setShowSeal] = useState(false);

  const c = (l: string, d: string) => (dm ? d : l);

  const [userAccount] = useLocalStorage<any>('userAccount', null);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [entries]
  );

  const getNextDate = (month: number, day: number) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), month, day, 9, 0, 0, 0);
    if (d.getTime() <= now.getTime()) d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const openPreview = useMemo(() => {
    const now = new Date();
    const d = new Date(now);
    if (type !== 'futuro') return d;

    if (datePreset === 'natal') return getNextDate(11, 25);
    if (datePreset === 'reveillon') return getNextDate(11, 31);
    if (datePreset === 'aniversario' && userAccount?.birthdate) {
      const [y, m, day] = String(userAccount.birthdate).split('-').map(Number);
      if (y && m && day) return getNextDate(m - 1, day);
    }

    d.setDate(d.getDate() + delayDays);
    return d;
  }, [type, delayDays, datePreset, userAccount?.birthdate]);

  const addEntry = () => {
    if (!text.trim()) return;
    const now = new Date();
    const openAtDate = new Date(type === 'futuro' ? openPreview : now);

    const newEntry: CapsuleEntry = {
      id: crypto.randomUUID(),
      type,
      title: title.trim() || (type === 'futuro' ? 'Carta para meu eu futuro' : 'Carta para meu eu do passado'),
      text: text.trim(),
      createdAt: now.toISOString(),
      openAt: openAtDate.toISOString(),
      openWhen,
      imageData: imageData || undefined,
      audioData: audioData || undefined,
    };

    setEntries([newEntry, ...entries]);
    setTitle('');
    setText('');
    setImageData('');
    setAudioData('');
    setShowSeal(true);
    setTimeout(() => setShowSeal(false), 2200);
  };

  const removeEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));

  const exportAsPdf = async (entry: CapsuleEntry) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const titleText = entry.title || 'Carta';
    doc.setFontSize(16);
    doc.text(titleText, 14, 20);
    doc.setFontSize(11);
    const meta = `Tipo: ${entry.type} | Criada em: ${new Date(entry.createdAt).toLocaleDateString('pt-BR')}`;
    doc.text(meta, 14, 28);
    const lines = doc.splitTextToSize(entry.text, 180);
    doc.text(lines, 14, 40);
    doc.save(`${titleText.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const onPickImage = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setImageData(String(r.result || ''));
    r.readAsDataURL(file);
  };

  const onPickAudio = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setAudioData(String(r.result || ''));
    r.readAsDataURL(file);
  };

  const replyToMyself = (entry: CapsuleEntry) => {
    setType('futuro');
    setDelayDays(30);
    setTitle(`Resposta para: ${entry.title}`);
    setText(`Lendo sua cápsula de ${new Date(entry.createdAt).toLocaleDateString('pt-BR')}, quero te responder:\n\n`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Local notification when capsule unlocks (if browser permission granted)
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      entries.forEach((e) => {
        if (e.type !== 'futuro') return;
        if (new Date(e.openAt).getTime() > now) return;
        const key = `capsule_notified_${e.id}`;
        if (localStorage.getItem(key)) return;

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🕰️ Cápsula pronta para abrir', {
            body: `Sua cápsula "${e.title}" já pode ser aberta.`,
            icon: '🧠',
          });
        }
        localStorage.setItem(key, '1');
      });
    };

    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [entries]);

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      {showSeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className={`rounded-3xl p-6 text-center border ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <p className="text-4xl">📮</p>
            <p className="font-black mt-2">Mensagem selada com sucesso</p>
            <p className="text-xs mt-1 opacity-80">Sua cápsula foi guardada no tempo.</p>
          </div>
        </div>
      )}

      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>🕰️ Cápsula do Tempo</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Carta para o eu futuro/passado com abertura programada e aviso quando liberar.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setType('futuro')} className={`py-2 rounded-xl text-sm font-bold ${type === 'futuro' ? 'bg-indigo-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Eu futuro</button>
          <button onClick={() => setType('passado')} className={`py-2 rounded-xl text-sm font-bold ${type === 'passado' ? 'bg-indigo-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Eu do passado</button>
        </div>

        {type === 'futuro' && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[30, 90, 180, 365].map((d) => (
                <button key={d} onClick={() => { setDelayDays(d); setDatePreset('dias'); }} className={`py-2 rounded-lg text-xs font-bold ${datePreset === 'dias' && delayDays === d ? 'bg-violet-500 text-white' : c('bg-violet-50 text-violet-700', 'bg-violet-900/30 text-violet-300')}`}>
                  {d} dias
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => setDatePreset('natal')} className={`py-2 rounded-lg text-xs font-bold ${datePreset === 'natal' ? 'bg-emerald-600 text-white' : c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>🎄 Natal</button>
              <button onClick={() => setDatePreset('reveillon')} className={`py-2 rounded-lg text-xs font-bold ${datePreset === 'reveillon' ? 'bg-emerald-600 text-white' : c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>🎆 Réveillon</button>
              <button
                onClick={() => userAccount?.birthdate && setDatePreset('aniversario')}
                className={`py-2 rounded-lg text-xs font-bold ${datePreset === 'aniversario' ? 'bg-emerald-600 text-white' : c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')} ${!userAccount?.birthdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!userAccount?.birthdate}
              >
                🎂 Meu aniversário
              </button>
            </div>
          </>
        )}

        <p className={`text-xs mb-3 ${c('text-slate-600','text-slate-300')}`}>
          Prévia de abertura: <strong>{openPreview.toLocaleDateString('pt-BR')} às {openPreview.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
          {type === 'futuro' && datePreset !== 'dias' ? ` • sincronizado por ${datePreset === 'natal' ? 'Natal' : datePreset === 'reveillon' ? 'Réveillon' : 'Aniversário'}` : ''}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {prompts.map((p, i) => (
            <button key={p} onClick={() => setText((old) => old ? `${old}\n\n${p}\n` : `${p}\n`)} className={`px-3 py-1 rounded-full text-xs font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>
              {i + 1}. {p.slice(0, 22)}...
            </button>
          ))}
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (opcional)" className={`w-full mb-3 p-3 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={type === 'futuro' ? 'Escreva uma mensagem para você receber no futuro...' : 'Escreva para ressignificar uma memória difícil...'} className={`w-full min-h-[120px] p-3 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />

        <div className="grid grid-cols-2 gap-2 mt-3">
          <label className={`text-xs p-2 rounded-xl border cursor-pointer ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            🖼️ Anexar imagem
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0])} />
          </label>
          <label className={`text-xs p-2 rounded-xl border cursor-pointer ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            🎙️ Anexar áudio
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => onPickAudio(e.target.files?.[0])} />
          </label>
        </div>

        <div className="mt-3">
          <p className="text-xs mb-1">Abrir quando eu estiver:</p>
          <select value={openWhen} onChange={(e) => setOpenWhen(e.target.value as OpenWhen)} className={`w-full p-2 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <option value="sempre">Sempre</option>
            <option value="triste">Triste</option>
            <option value="ansioso">Ansioso</option>
            <option value="sobrecarregado">Sobrecarregado</option>
          </select>
        </div>

        <button onClick={addEntry} className="w-full mt-3 py-3 rounded-xl bg-indigo-600 text-white font-bold">Salvar na cápsula</button>
      </div>

      <div className="space-y-3">
        {sorted.map((e) => {
          const unlocked = new Date(e.openAt).getTime() <= Date.now() || e.type === 'passado';
          return (
            <div key={e.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">{e.title}</h4>
                <button onClick={() => removeEntry(e.id)} className="text-xs text-rose-500">Excluir</button>
              </div>
              <p className={`text-xs mb-2 ${c('text-slate-500', 'text-slate-400')}`}>
                {e.type === 'futuro'
                  ? `Abre em ${new Date(e.openAt).toLocaleDateString('pt-BR')} às ${new Date(e.openAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Carta terapêutica para o passado'}
                {e.openWhen ? ` • quando estiver: ${e.openWhen}` : ''}
              </p>
              <p className="text-sm whitespace-pre-wrap">{unlocked ? e.text : '🔒 Mensagem bloqueada até a data de abertura.'}</p>

              {unlocked && e.imageData && <img src={e.imageData} alt="anexo" className="mt-2 rounded-xl border" />}
              {unlocked && e.audioData && <audio controls src={e.audioData} className="mt-2 w-full" />}

              {unlocked && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => exportAsPdf(e)} className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white">Exportar PDF</button>
                  <button onClick={() => replyToMyself(e)} className={`text-xs px-3 py-1 rounded-lg ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>Responder ao meu eu</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
