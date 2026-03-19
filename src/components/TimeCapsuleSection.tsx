'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppNoticeModal from './AppNoticeModal';
import SectionHeroCard from './SectionHeroCard';

type CapsuleType = 'futuro' | 'passado';
type OpenWhen = 'sempre' | 'triste' | 'ansioso' | 'sobrecarregado';
type CapsuleFilter = 'all' | 'locked' | 'ready' | 'past';

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
  onComplete?: (entryId: string) => void;
  onNavigate?: (tab: 'diary' | 'carta' | 'solta' | 'login', params?: Record<string, any>) => void;
}

const guidedPrompts: Record<CapsuleType, string[]> = {
  futuro: [
    'O que quero que meu eu futuro não esqueça',
    'O que espero ter atravessado até lá',
    'Que conselho eu gostaria de receber de mim mesmo(a)',
    'Qual pequena vitória eu não quero apagar da memória',
  ],
  passado: [
    'O que meu eu do passado precisava ouvir',
    'Do que eu gostaria de me perdoar hoje',
    'O que eu queria que aquela versão soubesse',
    'Que cuidado faltou naquele momento',
  ],
};

const emotionalLabels: Record<OpenWhen, string> = {
  sempre: 'Sempre',
  triste: 'Triste',
  ansioso: 'Ansioso(a)',
  sobrecarregado: 'Sobrecarregado(a)',
};

function formatCountdown(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return 'Pronta para abrir';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `Abre em ${days} dia${days === 1 ? '' : 's'}${hours ? ` e ${hours}h` : ''}`;
  return `Abre em ${Math.max(1, hours)} hora${hours === 1 ? '' : 's'}`;
}

function formatOpenDate(targetIso: string) {
  const date = new Date(targetIso);
  return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function TimeCapsuleSection({ darkMode: dm, onComplete, onNavigate }: Props) {
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
  const [filter, setFilter] = useState<CapsuleFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioMessage, setAudioMessage] = useState('');
  const [showBirthdayNotice, setShowBirthdayNotice] = useState(false);
  const [recordingNotice, setRecordingNotice] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });

  const c = (l: string, d: string) => (dm ? d : l);
  const [userAccount] = useLocalStorage<any>('userAccount', null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const filteredEntries = useMemo(() => {
    return sorted.filter((entry) => {
      if (filter === 'all') return true;
      const unlocked = entry.type === 'passado' || new Date(entry.openAt).getTime() <= Date.now();
      if (filter === 'past') return entry.type === 'passado';
      if (filter === 'ready') return entry.type === 'futuro' && unlocked;
      if (filter === 'locked') return entry.type === 'futuro' && !unlocked;
      return true;
    });
  }, [filter, sorted]);

  const addGuidedPrompt = (prompt: string) => {
    setText((old) => old ? `${old.trim()}\n\n${prompt}\n` : `${prompt}\n`);
  };

  const selectBirthdayPreset = () => {
    if (!userAccount?.birthdate) {
      setShowBirthdayNotice(true);
      setDatePreset('dias');
      return;
    }
    setDatePreset('aniversario');
  };

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
    onComplete?.(newEntry.id);
    setTitle('');
    setText('');
    setImageData('');
    setAudioData('');
    setShowSeal(true);
    setTimeout(() => setShowSeal(false), 2400);
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
    r.onload = () => {
      setAudioData(String(r.result || ''));
      setAudioMessage('Áudio anexado com sucesso.');
    };
    r.readAsDataURL(file);
  };

  const stopActiveRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
  };

  const startRecordingAudio = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingNotice({
        open: true,
        title: 'Gravação não disponível aqui',
        message: 'Seu navegador não suporta gravação de áudio por microfone nesta experiência.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioData(String(reader.result || ''));
          setAudioMessage('Gravação salva na cápsula.');
          setIsRecordingAudio(false);
          setShowAudioOptions(false);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
      };

      recorder.start();
      setAudioMessage('Gravando agora. Toque em finalizar quando terminar.');
      setIsRecordingAudio(true);
    } catch {
      setRecordingNotice({
        open: true,
        title: 'Não consegui abrir o microfone',
        message: 'Verifique a permissão do navegador para microfone e tente de novo.',
      });
    }
  };

  const finalizeRecordingAudio = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  };

  const replyToMyself = (entry: CapsuleEntry) => {
    setType('futuro');
    setDelayDays(30);
    setDatePreset('dias');
    setTitle(`Resposta para: ${entry.title}`);
    setText(`Lendo sua cápsula de ${new Date(entry.createdAt).toLocaleDateString('pt-BR')}, quero te responder:\n\n`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCapsule = (entry: CapsuleEntry) => {
    setOpeningId(entry.id);
    setExpandedId(entry.id);
    setOpenedId(null);
    setTimeout(() => {
      setOpeningId(null);
      setOpenedId(entry.id);
    }, 1400);
  };

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
    return () => {
      clearInterval(t);
      stopActiveRecording();
    };
  }, [entries]);

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <AppNoticeModal
        open={recordingNotice.open}
        title={recordingNotice.title}
        message={recordingNotice.message}
        onClose={() => setRecordingNotice({ open: false, title: '', message: '' })}
        darkMode={dm}
        icon="🎙️"
        eyebrow="Áudio"
      />
      {showBirthdayNotice && (
        <div className="fixed inset-0 z-[125] flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Fechar aviso"
            onClick={() => setShowBirthdayNotice(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className={`relative z-10 w-full max-w-md rounded-[2rem] p-5 border shadow-2xl ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${c('bg-amber-50 text-amber-700 border border-amber-100', 'bg-amber-500/10 text-amber-300 border border-amber-500/20')}`}>
                🎂
              </div>
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-indigo-700', 'text-indigo-300')}`}>Meu aniversário</p>
                <h3 className="text-xl font-black mt-2">Falta completar essa data no Perfil</h3>
                <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
                  Para usar esse preset, complete sua data de nascimento no Perfil. Aí a cápsula consegue calcular a próxima abertura no seu aniversário.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-5">
              <button
                onClick={() => {
                  setShowBirthdayNotice(false);
                  onNavigate?.('login');
                }}
                className={`py-3 rounded-2xl text-sm font-bold ${c('bg-emerald-50 text-emerald-800 border border-emerald-100', 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20')}`}
              >
                Ir para o Perfil
              </button>
              <button
                onClick={() => setShowBirthdayNotice(false)}
                className="py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {showAudioOptions && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Fechar opções de áudio"
            onClick={() => {
              if (!isRecordingAudio) setShowAudioOptions(false);
            }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className={`relative z-10 w-full max-w-md rounded-[2rem] p-5 border shadow-2xl ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${c('text-indigo-700', 'text-indigo-300')}`}>Áudio da cápsula</p>
            <h3 className="text-xl font-black mt-2">Como você quer anexar esse áudio?</h3>
            <p className={`text-sm mt-2 leading-relaxed ${c('text-slate-600', 'text-slate-400')}`}>
              Você pode enviar um áudio que já existe ou gravar agora com o microfone.
            </p>

            <div className="grid grid-cols-1 gap-3 mt-5">
              <button
                onClick={() => {
                  setShowAudioOptions(false);
                  audioInputRef.current?.click();
                }}
                className={`px-4 py-4 rounded-[1.4rem] text-left border ${c('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-200')}`}
              >
                <p className="text-sm font-black">📁 Enviar áudio existente</p>
                <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>Escolha um arquivo salvo no aparelho.</p>
              </button>

              {!isRecordingAudio ? (
                <button
                  onClick={startRecordingAudio}
                  className={`px-4 py-4 rounded-[1.4rem] text-left border ${c('bg-rose-50 border-rose-200 text-rose-800', 'bg-rose-500/10 border-rose-500/20 text-rose-200')}`}
                >
                  <p className="text-sm font-black">🎙️ Gravar agora</p>
                  <p className={`text-xs mt-1 ${c('text-slate-600', 'text-slate-400')}`}>Abrir o microfone e falar na hora.</p>
                </button>
              ) : (
                <button
                  onClick={finalizeRecordingAudio}
                  className="px-4 py-4 rounded-[1.4rem] text-left border bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                >
                  <p className="text-sm font-black">⏹️ Finalizar gravação</p>
                  <p className="text-xs mt-1 text-white/80">Toque quando terminar de falar.</p>
                </button>
              )}
            </div>

            {!!audioMessage && (
              <div className={`mt-4 rounded-[1.3rem] p-3 ${c('bg-slate-50 border border-slate-100 text-slate-700', 'bg-slate-800 border border-slate-700 text-slate-300')}`}>
                <p className="text-sm font-medium">{audioMessage}</p>
              </div>
            )}

            {!isRecordingAudio && (
              <button
                onClick={() => setShowAudioOptions(false)}
                className={`w-full mt-4 py-3 rounded-2xl text-sm font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-800 text-slate-200 border border-slate-700')}`}
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      )}

      {showSeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className={`relative w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-[2rem] p-6 text-center border shadow-2xl ${c('bg-white border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-400/10 via-transparent to-violet-500/10" />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <span className="absolute top-4 left-8 text-lg opacity-60 animate-pulse">✨</span>
              <span className="absolute top-10 right-10 text-xl opacity-50 animate-[floatCapsule_2.2s_ease-in-out_infinite]">⋆</span>
              <span className="absolute bottom-6 left-12 text-base opacity-50 animate-[floatCapsule_2.8s_ease-in-out_infinite]">✦</span>
            </div>
            <p className="text-5xl animate-bounce">📮</p>
            <p className="font-black mt-3 text-lg">Sua cápsula foi selada.</p>
            <p className="text-sm mt-2 opacity-80">Que essa mensagem atravesse o tempo e encontre você exatamente quando mais precisar dela.</p>
          </div>
        </div>
      )}

      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Ritual de lembrança"
          title="Cápsula do Tempo"
          description="Guarde uma mensagem para se reencontrar no futuro ou escreva o que o seu eu do passado precisava ouvir com mais cuidado."
          icon="🕰️"
        />
      </div>

      <div className={`rounded-[2rem] p-5 border mb-5 shadow-sm ${c('bg-white border-slate-100', 'bg-slate-800/85 border-slate-700')}`}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setType('futuro')} className={`py-3 rounded-2xl text-sm font-bold ${type === 'futuro' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>Eu futuro</button>
          <button onClick={() => setType('passado')} className={`py-3 rounded-2xl text-sm font-bold ${type === 'passado' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>Eu do passado</button>
        </div>

        <div className={`rounded-[1.5rem] p-4 mb-4 border ${c('bg-violet-50/70 border-violet-100', 'bg-slate-900/70 border-slate-700')}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${c('text-violet-700', 'text-violet-300')}`}>Para destravar</p>
          <p className={`text-sm mt-2 font-medium ${c('text-slate-700', 'text-slate-300')}`}>
            {type === 'futuro'
              ? 'Escreva como se estivesse deixando um lembrete carinhoso para a sua versão de amanhã.'
              : 'Escreva como quem volta no tempo para oferecer cuidado, contexto e acolhimento.'}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {guidedPrompts[type].map((prompt) => (
              <button key={prompt} onClick={() => addGuidedPrompt(prompt)} className={`px-3 py-2 rounded-full text-xs font-bold ${c('bg-white text-violet-800 border border-violet-100', 'bg-slate-800 text-violet-300 border border-slate-700')}`}>
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {type === 'futuro' && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[30, 90, 180, 365].map((d) => (
                <button key={d} onClick={() => { setDelayDays(d); setDatePreset('dias'); }} className={`py-2 rounded-xl text-xs font-bold ${datePreset === 'dias' && delayDays === d ? 'bg-violet-500 text-white' : c('bg-violet-50 text-violet-700', 'bg-violet-900/30 text-violet-300')}`}>
                  {d} dias
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => setDatePreset('natal')} className={`py-2 rounded-xl text-xs font-bold ${datePreset === 'natal' ? 'bg-emerald-600 text-white' : c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>🎄 Natal</button>
              <button onClick={() => setDatePreset('reveillon')} className={`py-2 rounded-xl text-xs font-bold ${datePreset === 'reveillon' ? 'bg-emerald-600 text-white' : c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>🎆 Réveillon</button>
              <button
                onClick={selectBirthdayPreset}
                className={`py-2 rounded-xl text-xs font-bold ${datePreset === 'aniversario' ? 'bg-emerald-600 text-white' : c('bg-emerald-50 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}
              >
                🎂 Meu aniversário
              </button>
            </div>
          </>
        )}

        <div className={`rounded-2xl p-3 mb-3 ${c('bg-slate-50', 'bg-slate-900/60')}`}>
          <p className={`text-xs font-bold ${c('text-slate-700', 'text-slate-300')}`}>
            Prévia de abertura: <strong>{formatOpenDate(openPreview.toISOString())}</strong>
          </p>
          <p className={`text-xs mt-2 ${c('text-slate-500', 'text-slate-400')}`}>
            “Abrir quando eu estiver...” funciona como um lembrete emocional. A cápsula ainda respeita a data programada, se houver.
          </p>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dê um nome para essa cápsula (opcional)" className={`w-full mb-3 p-3 rounded-2xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={type === 'futuro' ? 'Escreva uma mensagem para você reencontrar no futuro...' : 'Escreva o que o seu eu do passado merecia ouvir...'} className={`w-full min-h-[180px] p-4 rounded-[1.5rem] border text-sm leading-relaxed ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />

        <div className="grid grid-cols-2 gap-2 mt-3">
          <label className={`text-xs p-3 rounded-2xl border cursor-pointer font-bold ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            🖼️ Anexar imagem
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0])} />
          </label>
          <button
            type="button"
            onClick={() => {
              setAudioMessage('');
              setShowAudioOptions(true);
            }}
            className={`text-xs p-3 rounded-2xl border cursor-pointer font-bold text-left ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}
          >
            🎙️ Anexar áudio
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => onPickAudio(e.target.files?.[0])}
          />
        </div>

        {audioData && (
          <div className={`mt-3 rounded-2xl p-3 border ${c('bg-slate-50 border-slate-200', 'bg-slate-900/60 border-slate-700')}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-black uppercase tracking-[0.16em]">Áudio anexado</p>
              <button
                type="button"
                onClick={() => {
                  setAudioData('');
                  setAudioMessage('');
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${c('bg-rose-50 text-rose-700 border border-rose-100', 'bg-rose-500/10 text-rose-300 border border-rose-500/20')}`}
              >
                Remover
              </button>
            </div>
            <audio controls src={audioData} className="w-full" />
          </div>
        )}

        <div className="mt-3">
          <p className="text-xs mb-2 font-bold">Abrir quando eu estiver:</p>
          <select value={openWhen} onChange={(e) => setOpenWhen(e.target.value as OpenWhen)} className={`w-full p-3 rounded-2xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
            <option value="sempre">Sempre</option>
            <option value="triste">Triste</option>
            <option value="ansioso">Ansioso(a)</option>
            <option value="sobrecarregado">Sobrecarregado(a)</option>
          </select>
        </div>

        <button onClick={addEntry} className="w-full mt-4 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/25">
          Selar esta cápsula
        </button>
      </div>

      <div className={`rounded-[2rem] p-4 mb-4 border ${c('bg-white border-slate-100', 'bg-slate-800/85 border-slate-700')}`}>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'locked', label: 'Bloqueadas' },
            { id: 'ready', label: 'Prontas' },
            { id: 'past', label: 'Passado' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as CapsuleFilter)}
              className={`px-4 py-2 rounded-full text-xs font-bold ${filter === item.id ? 'bg-violet-500 text-white shadow-md' : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300 border border-slate-700')}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          const unlocked = new Date(entry.openAt).getTime() <= Date.now() || entry.type === 'passado';
          const isExpanded = expandedId === entry.id;
          const isOpening = openingId === entry.id;
          const isOpened = openedId === entry.id || unlocked;

          return (
            <div key={entry.id} className={`rounded-[2rem] border overflow-hidden shadow-sm ${entry.type === 'passado'
              ? c('bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-100', 'bg-gradient-to-br from-amber-900/20 to-slate-900 border-amber-800/40')
              : unlocked
                ? c('bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border-emerald-100', 'bg-gradient-to-br from-emerald-900/20 to-slate-900 border-emerald-800/40')
                : c('bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/40 border-violet-100', 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700')}`}
            >
              <button onClick={() => setExpandedId(isExpanded ? null : entry.id)} className="w-full text-left p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black ${entry.type === 'passado'
                        ? 'bg-amber-100 text-amber-800'
                        : unlocked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-violet-100 text-violet-800'}`}>
                        {entry.type === 'passado' ? 'Passado' : unlocked ? 'Pronta' : 'Bloqueada'}
                      </span>
                      <span className={`text-xs font-bold ${c('text-slate-500', 'text-slate-400')}`}>
                        {entry.type === 'futuro' ? formatCountdown(entry.openAt) : 'Carta terapêutica para o passado'}
                      </span>
                    </div>
                    <h4 className="font-black text-sm mt-3">{entry.title}</h4>
                    <p className={`text-xs mt-2 ${c('text-slate-500', 'text-slate-400')}`}>
                      {entry.type === 'futuro' ? `Abertura prevista em ${formatOpenDate(entry.openAt)}` : `Criada em ${new Date(entry.createdAt).toLocaleDateString('pt-BR')}`}
                      {entry.openWhen ? ` • lembrar quando estiver ${emotionalLabels[entry.openWhen].toLowerCase()}` : ''}
                    </p>
                  </div>
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9" /></svg>
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className={`px-4 pb-4 border-t ${c('border-slate-100', 'border-slate-700')}`}>
                  {!isOpened && entry.type === 'futuro' ? (
                    <div className="pt-4">
                      <div className={`relative rounded-[1.5rem] p-5 text-center overflow-hidden ${isOpening
                        ? c('bg-amber-50 border border-amber-100', 'bg-slate-900 border border-slate-700')
                        : c('bg-violet-50 border border-violet-100', 'bg-slate-900 border border-slate-700')}`}>
                        {isOpening ? (
                          <div className="relative h-40 flex items-center justify-center">
                            <div className="absolute w-44 h-28 rounded-[1.2rem] border-2 border-amber-300 bg-gradient-to-b from-amber-100 to-amber-200 shadow-lg animate-[capsuleOpen_1.3s_ease-in-out_forwards]" />
                            <div className="absolute w-36 h-20 rounded-[1rem] border border-white/60 bg-white/70 shadow-md animate-[letterRise_1.1s_ease-in-out_forwards]" />
                            <span className="absolute text-4xl animate-pulse">💌</span>
                            <span className="absolute top-6 right-20 text-lg opacity-70 animate-[floatCapsule_1.8s_ease-in-out_infinite]">✦</span>
                            <span className="absolute bottom-6 left-20 text-sm opacity-60 animate-[floatCapsule_2.4s_ease-in-out_infinite]">⋆</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-4xl">🔒</p>
                            <p className="font-black mt-3">Esta cápsula ainda está fechada.</p>
                            <p className="text-sm mt-2 opacity-80">Quando chegar a hora, essa mensagem vai se abrir como quem atravessou o tempo para te reencontrar.</p>
                            {unlocked && (
                              <button onClick={() => handleOpenCapsule(entry)} className="mt-4 px-4 py-3 rounded-2xl bg-violet-600 text-white font-bold">
                                Abrir cápsula agora
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4">
                      <div className={`rounded-[1.5rem] p-4 ${c('bg-white/80', 'bg-slate-900/60')}`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                      </div>

                      {entry.imageData && <img src={entry.imageData} alt="anexo" className="mt-3 rounded-2xl border" />}
                      {entry.audioData && <audio controls src={entry.audioData} className="mt-3 w-full" />}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => exportAsPdf(entry)} className="text-xs px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold">Exportar PDF</button>
                        <button onClick={() => replyToMyself(entry)} className={`text-xs px-3 py-2 rounded-xl font-bold ${c('bg-emerald-100 text-emerald-700', 'bg-emerald-900/30 text-emerald-300')}`}>Responder ao meu eu</button>
                        <button onClick={() => removeEntry(entry.id)} className={`text-xs px-3 py-2 rounded-xl font-bold ${c('bg-rose-50 text-rose-700', 'bg-rose-900/30 text-rose-300')}`}>Excluir</button>
                      </div>

                      <div className={`mt-3 rounded-[1.3rem] p-3 border ${c('bg-slate-50 border-slate-100', 'bg-slate-900/70 border-slate-700')}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-slate-500', 'text-slate-400')}`}>Continuar com isso</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                          <button
                            onClick={() => onNavigate?.('diary', { diaryMode: 'quick', diaryDraft: entry.text, diaryDraftKey: Date.now() })}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold ${c('bg-indigo-50 text-indigo-700 border border-indigo-100', 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20')}`}
                          >
                            Levar ao diário
                          </button>
                          <button
                            onClick={() => onNavigate?.('carta', { cartaDraft: entry.text, cartaDraftKey: Date.now(), cartaType: 'personalizada' })}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold ${c('bg-amber-50 text-amber-700 border border-amber-100', 'bg-amber-500/10 text-amber-300 border border-amber-500/20')}`}
                          >
                            Virar carta
                          </button>
                          <button
                            onClick={() => onNavigate?.('solta', { soltaDraft: entry.text, soltaDraftKey: Date.now() })}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold ${c('bg-emerald-50 text-emerald-700 border border-emerald-100', 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20')}`}
                          >
                            Soltar daqui
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes capsuleOpen {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          35% { transform: scale(1.03) rotate(-2deg); opacity: 1; }
          100% { transform: scale(1.12) rotate(8deg) translateY(-18px); opacity: 0.2; }
        }
        @keyframes letterRise {
          0% { transform: translateY(18px) scale(0.9); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(-34px) scale(1.04); opacity: 1; }
        }
        @keyframes floatCapsule {
          0% { transform: translateY(0px); opacity: 0.45; }
          50% { transform: translateY(-8px); opacity: 0.9; }
          100% { transform: translateY(0px); opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
