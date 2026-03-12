'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props { darkMode?: boolean }

type Cat = 'autocritica' | 'comparacao' | 'perfeccionismo' | 'culpa' | 'catastrofizacao' | 'relacionamentos' | 'trabalho';

interface Pattern {
  id: string;
  toxic: string;
  reframed: string;
  emoji: string;
  category: Cat;
  situations: string[];
}

const toxicPatterns: Pattern[] = [
  { id: 'catastrofizar', toxic: 'Se algo der errado, será um desastre total.', reframed: 'Posso lidar com imprevistos. Nem tudo precisa ser perfeito.', emoji: '🌋', category: 'catastrofizacao', situations: ['quando erro', 'ansiedade'] },
  { id: 'mente-leitura', toxic: 'Eles estão pensando que sou fraco.', reframed: 'Não posso saber o que os outros pensam. Projeto minha autocrítica neles.', emoji: '🔮', category: 'comparacao', situations: ['social', 'rejeição'] },
  { id: 'tudo-ou-nada', toxic: 'Se não for perfeito, é um fracasso.', reframed: 'Progresso é melhor que perfeição.', emoji: '⚖️', category: 'perfeccionismo', situations: ['trabalho', 'estudo'] },
  { id: 'generalizar', toxic: 'Sempre faço tudo errado.', reframed: 'Cometi um erro específico. Isso não define quem sou.', emoji: '🔄', category: 'autocritica', situations: ['quando erro'] },
  { id: 'filtrar', toxic: 'Só vejo o que deu errado hoje.', reframed: 'Também houve coisas que funcionaram. Posso reconhecer microvitórias.', emoji: '🔍', category: 'autocritica', situations: ['fim do dia'] },
  { id: 'rotular', toxic: 'Sou um perdedor.', reframed: 'Sou alguém em processo de aprendizado.', emoji: '🏷️', category: 'autocritica', situations: ['baixa autoestima'] },
  { id: 'culpacao', toxic: 'É tudo culpa minha.', reframed: 'Sou responsável pelo que depende de mim, não por tudo.', emoji: '🎯', category: 'culpa', situations: ['conflitos'] },
  { id: 'deveria', toxic: 'Eu deveria ser mais forte.', reframed: 'Estou fazendo o melhor possível com os recursos que tenho hoje.', emoji: '📋', category: 'autocritica', situations: ['cansaço'] },
  { id: 'emocional', toxic: 'Sinto que sou incapaz, então sou.', reframed: 'Sentimentos são dados, não sentença final.', emoji: '💔', category: 'catastrofizacao', situations: ['ansiedade'] },
  { id: 'comparar', toxic: 'Todo mundo é mais feliz que eu.', reframed: 'Comparação distorce a realidade. Meu ritmo é único.', emoji: '👥', category: 'comparacao', situations: ['redes sociais'] },
  { id: 'rejeicao', toxic: 'Se demorou pra responder, é porque não gosta de mim.', reframed: 'Há várias explicações possíveis além de rejeição.', emoji: '📵', category: 'relacionamentos', situations: ['mensagens'] },
  { id: 'impostor', toxic: 'Só consegui porque tive sorte.', reframed: 'Meu esforço e competência também contribuíram.', emoji: '🎭', category: 'trabalho', situations: ['trabalho', 'estudo'] },
  { id: 'desqualificar', toxic: 'Esse elogio não vale nada.', reframed: 'Posso receber reconhecimento sem me diminuir.', emoji: '🧯', category: 'autocritica', situations: ['elogios'] },
  { id: 'futuro-negativo', toxic: 'Nada vai melhorar.', reframed: 'Ainda não está como eu quero, mas posso construir mudança em etapas.', emoji: '🌧️', category: 'catastrofizacao', situations: ['desânimo'] },
  { id: 'controle', toxic: 'Se eu não controlar tudo, vai dar ruim.', reframed: 'Posso focar no que está ao meu alcance e soltar o resto.', emoji: '🕹️', category: 'perfeccionismo', situations: ['trabalho'] },
  { id: 'desvalorizar-needs', toxic: 'Eu não devia precisar de ajuda.', reframed: 'Pedir ajuda é maturidade emocional, não fraqueza.', emoji: '🆘', category: 'autocritica', situations: ['sobrecarga'] },
  { id: 'ciume', toxic: 'Se sente bem sem mim, então não me ama.', reframed: 'Amor saudável inclui autonomia e confiança.', emoji: '💞', category: 'relacionamentos', situations: ['ciúme'] },
  { id: 'atraso', toxic: 'Estou atrasado, sou incompetente.', reframed: 'Atraso pontual não define minha capacidade. Vou reorganizar prioridades.', emoji: '⏱️', category: 'trabalho', situations: ['prazos'] },
  { id: 'corpo', toxic: 'Meu corpo é horrível.', reframed: 'Meu corpo merece respeito e cuidado, não ataque.', emoji: '🪞', category: 'comparacao', situations: ['imagem corporal'] },
  { id: 'conflito', toxic: 'Se discordamos, o relacionamento acabou.', reframed: 'Conflito pode ser ponte de ajuste, não sentença de fim.', emoji: '🧩', category: 'relacionamentos', situations: ['discussão'] },
];

const catLabel: Record<Cat, string> = {
  autocritica: 'Autocrítica', comparacao: 'Comparação', perfeccionismo: 'Perfeccionismo', culpa: 'Culpa/Vergonha', catastrofizacao: 'Catastrofização', relacionamentos: 'Relacionamentos', trabalho: 'Trabalho/Estudo'
};

const emergencyReframes = [
  'Isso é difícil, mas passageiro. Eu posso atravessar este momento.',
  'Nem todo pensamento merece ser acreditado agora.',
  'Respira: meu valor não depende deste erro.',
  'Posso pausar antes de reagir. Segurança primeiro.',
  'Eu não preciso resolver tudo hoje.',
  'Estou em sobrecarga, não em fracasso.',
  'Uma micro-ação já é progresso real.',
  'Eu posso pedir apoio sem culpa.',
  'Meu corpo está em alerta, não em perigo real agora.',
  'Passo a passo: água, respiração, pausa, próxima ação simples.'
];

export default function ToxicThoughtsSection({ darkMode: dm }: Props) {
  const [custom, setCustom] = useLocalStorage<Pattern[]>('psico_toxic_custom', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('psico_toxic_favorites', []);
  const [step, setStep] = useState<'list' | 'add' | 'trainer' | 'emergency'>('list');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Cat | null>(null);
  const [situation, setSituation] = useState<string | null>(null);

  const [edit, setEdit] = useState<{ toxic: string; reframed: string; category: Cat }>({ toxic: '', reframed: '', category: 'autocritica' });

  const [trainThought, setTrainThought] = useState('');
  const [trainEvidence, setTrainEvidence] = useState('');
  const [trainBefore, setTrainBefore] = useState(8);
  const [trainAfter, setTrainAfter] = useState(4);

  const c = (l: string, d: string) => (dm ? d : l);

  const all = useMemo(() => [...toxicPatterns, ...custom], [custom]);

  const allSituations = useMemo(() => Array.from(new Set(all.flatMap((p) => p.situations))).slice(0, 20), [all]);

  const filtered = useMemo(() => {
    return all.filter((p) => {
      const byQ = !q || p.toxic.toLowerCase().includes(q.toLowerCase()) || p.reframed.toLowerCase().includes(q.toLowerCase());
      const byCat = !cat || p.category === cat;
      const bySit = !situation || p.situations.includes(situation);
      return byQ && byCat && bySit;
    });
  }, [all, q, cat, situation]);

  const add = () => {
    if (!edit.toxic.trim() || !edit.reframed.trim()) return;
    setCustom([...custom, {
      id: crypto.randomUUID(),
      toxic: edit.toxic.trim(),
      reframed: edit.reframed.trim(),
      emoji: '💭',
      category: edit.category,
      situations: ['personalizado']
    }]);
    setEdit({ toxic: '', reframed: '', category: 'autocritica' });
    setStep('list');
  };

  const toggleFav = (id: string) => setFavorites(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]);
  const remove = (id: string) => setCustom(custom.filter((cst) => cst.id !== id));

  const copyReframed = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const trainerSuggestion = useMemo(() => {
    if (!trainThought.trim()) return '';
    const byKeyword = all.find((p) => trainThought.toLowerCase().includes(p.toxic.split(' ')[0].toLowerCase()));
    return byKeyword?.reframed || 'Uma reformulação possível: “Mesmo com desconforto, posso agir com gentileza e passo a passo.”';
  }, [trainThought, all]);

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>⚠️ Biblioteca de Falas Tóxicas</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Identifique pensamentos automáticos e troque por frases mais saudáveis.</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <button onClick={() => setStep('list')} className={`py-2 rounded-xl text-xs font-bold ${step === 'list' ? 'bg-violet-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Biblioteca</button>
        <button onClick={() => setStep('trainer')} className={`py-2 rounded-xl text-xs font-bold ${step === 'trainer' ? 'bg-violet-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Treino</button>
        <button onClick={() => setStep('emergency')} className={`py-2 rounded-xl text-xs font-bold ${step === 'emergency' ? 'bg-rose-600 text-white' : c('bg-rose-100 text-rose-700', 'bg-rose-900/30 text-rose-300')}`}>Emergência</button>
        <button onClick={() => setStep('add')} className={`py-2 rounded-xl text-xs font-bold ${step === 'add' ? 'bg-violet-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>+ Novo</button>
      </div>

      {step === 'list' && (
        <>
          <div className={`rounded-2xl p-3 mb-3 ${c('bg-white border border-slate-100', 'bg-slate-800/70 border border-slate-700')}`}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar frase tóxica ou reformulação..." className={`w-full p-3 rounded-xl text-sm ${c('bg-slate-50', 'bg-slate-900')}`} />
          </div>

          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            <button onClick={() => setCat(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${!cat ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Todas</button>
            {(Object.keys(catLabel) as Cat[]).map((k) => (
              <button key={k} onClick={() => setCat(k)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${cat === k ? 'bg-blue-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{catLabel[k]}</button>
            ))}
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button onClick={() => setSituation(null)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${!situation ? 'bg-emerald-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>Situações</button>
            {allSituations.map((s) => (
              <button key={s} onClick={() => setSituation(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${situation === s ? 'bg-emerald-600 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{s}</button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{p.emoji || '💭'}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${c('text-rose-600', 'text-rose-400')}`}>❌ {p.toxic}</p>
                    <p className={`text-sm mt-2 ${c('text-emerald-600', 'text-emerald-400')}`}>✅ {p.reframed}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${c('bg-slate-100 text-slate-600', 'bg-slate-700 text-slate-200')}`}>{catLabel[p.category]}</span>
                      {p.situations.slice(0, 2).map((s) => <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full ${c('bg-indigo-50 text-indigo-700', 'bg-indigo-900/40 text-indigo-300')}`}>{s}</span>)}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => copyReframed(p.reframed)} className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white">Copiar reformulação</button>
                      <button onClick={() => toggleFav(p.id)} className={`text-xs px-2 py-1 rounded-lg ${favorites.includes(p.id) ? 'bg-amber-500 text-white' : c('bg-slate-100', 'bg-slate-700')}`}>{favorites.includes(p.id) ? '★ Favorito' : '☆ Favoritar'}</button>
                    </div>
                  </div>
                  {custom.find((cst) => cst.id === p.id) && <button onClick={() => remove(p.id)} className="text-xs text-rose-500">Excluir</button>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className={`text-sm ${c('text-slate-500', 'text-slate-400')}`}>Nenhum resultado com os filtros atuais.</p>}
          </div>
        </>
      )}

      {step === 'trainer' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
          <h3 className="font-bold mb-3">Treino guiado (30 segundos)</h3>
          <textarea value={trainThought} onChange={(e) => setTrainThought(e.target.value)} placeholder="1) Qual pensamento veio?" className={`w-full min-h-[70px] p-3 rounded-xl border text-sm mb-2 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
          <textarea value={trainEvidence} onChange={(e) => setTrainEvidence(e.target.value)} placeholder="2) Qual evidência real você tem disso?" className={`w-full min-h-[70px] p-3 rounded-xl border text-sm mb-2 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className={`p-2 rounded-xl ${c('bg-slate-50', 'bg-slate-900')}`}>
              <p className="text-xs mb-1">3) Intensidade antes</p>
              <input type="range" min={0} max={10} value={trainBefore} onChange={(e) => setTrainBefore(Number(e.target.value))} className="w-full" />
              <p className="text-xs font-bold">{trainBefore}/10</p>
            </div>
            <div className={`p-2 rounded-xl ${c('bg-slate-50', 'bg-slate-900')}`}>
              <p className="text-xs mb-1">4) Intensidade depois</p>
              <input type="range" min={0} max={10} value={trainAfter} onChange={(e) => setTrainAfter(Number(e.target.value))} className="w-full" />
              <p className="text-xs font-bold">{trainAfter}/10</p>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${c('bg-emerald-50', 'bg-emerald-900/20')}`}>
            <p className="text-xs font-bold mb-1">Sugestão personalizada</p>
            <p className="text-sm">{trainerSuggestion || 'Escreva seu pensamento para gerar uma reformulação.'}</p>
          </div>
        </div>
      )}

      {step === 'emergency' && (
        <div className={`rounded-3xl p-5 border ${c('bg-rose-50 border-rose-100', 'bg-rose-900/20 border-rose-800')}`}>
          <h3 className="font-bold mb-2">🚨 Modo Emergência</h3>
          <p className="text-sm mb-3">Frases curtas para usar em crise. Toque para copiar rapidamente.</p>
          <div className="space-y-2">
            {emergencyReframes.map((frase, idx) => (
              <button
                key={idx}
                onClick={() => copyReframed(frase)}
                className={`w-full text-left p-3 rounded-xl text-sm font-medium ${c('bg-white border border-rose-100', 'bg-slate-800 border border-rose-900/40')}`}
              >
                {frase}
              </button>
            ))}
          </div>
          <div className={`mt-3 p-3 rounded-xl text-xs ${c('bg-white/80', 'bg-slate-800/80')}`}>
            Sequência sugerida: 1) Copie uma frase  2) Respire 4x  3) Beba água  4) Faça uma micro-ação.
          </div>
        </div>
      )}

      {step === 'add' && (
        <div className={`rounded-3xl p-5 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
          <h3 className="font-bold mb-3">Novo pensamento</h3>
          <textarea value={edit.toxic} onChange={(e) => setEdit({ ...edit, toxic: e.target.value })} placeholder="Pensamento automático negativo..." className={`w-full min-h-[80px] p-3 rounded-xl border text-sm mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
          <textarea value={edit.reframed} onChange={(e) => setEdit({ ...edit, reframed: e.target.value })} placeholder="Versão reformulada, mais saudável..." className={`w-full min-h-[80px] p-3 rounded-xl border text-sm mb-3 ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
          <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value as Cat })} className={`w-full p-3 rounded-xl text-sm mb-3 ${c('bg-slate-50 border border-slate-200', 'bg-slate-900 border border-slate-700')}`}>
            {(Object.keys(catLabel) as Cat[]).map((k) => <option key={k} value={k}>{catLabel[k]}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setStep('list')} className={`py-3 rounded-xl font-bold ${c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>Voltar</button>
            <button onClick={add} className="py-3 rounded-xl bg-emerald-600 text-white font-bold">Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}
