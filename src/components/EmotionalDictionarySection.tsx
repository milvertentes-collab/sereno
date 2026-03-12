'use client';

import { useState } from 'react';

interface Props { darkMode?: boolean }

const emotions = [
  { word: 'Ansiedade', definition: 'Estado de inquietação, apreensão e expectativa quanto a algo que pode acontecer. Pode ser adaptativa ou patológica.', synonyms: ['inquietação', 'nervosismo', 'angústia'], antonyms: ['calma', 'tranquilidade', 'serenidade'], category: 'Desconfortável' },
  { word: 'Angústia', definition: 'Sentimento intenso de sofrimento psíquico, muitas vezes sentido no peito. Diferente da ansiedade por ser mais profunda e menos agitada.', synonyms: ['aflição', 'sofrimento', 'dor emocional'], antonyms: ['alívio', 'paz', 'conforto'], category: 'Desconfortável' },
  { word: 'Melancolia', definition: 'Tristeza profunda e duradoura, mas sem a intensidade da depressão. Pode ser reflexiva e até poética.', synonyms: ['tristeza suave', 'nostalgia', 'saudade profunda'], antonyms: ['alegria', 'entusiasmo', 'vitalidade'], category: 'Desconfortável' },
  { word: 'Frustração', definition: 'Sentimento que surge quando uma expectativa não é atendida ou um objetivo é bloqueado.', synonyms: ['decepção', 'insatisfação', 'desânimo'], antonyms: ['satisfação', 'realização', 'contentamento'], category: 'Desconfortável' },
  { word: 'Entusiasmo', definition: 'Estado de excitação positiva e energia direcionada a algo. Envolve motivação e expectativa boa.', synonyms: ['ânimo', 'empolgação', 'vigor'], antonyms: ['apatia', 'desânimo', 'indiferença'], category: 'Agradável' },
  { word: 'Sereno', definition: 'Estado de paz interior, sem agitação. Diferente da calma por implicar uma tranquilidade mais profunda.', synonyms: ['tranquilo', 'pacífico', 'plácido'], antonyms: ['agitado', 'perturbado', 'ansioso'], category: 'Agradável' },
  { word: 'Nostalgia', definition: 'Sentimento misto de alegria e tristeza ao lembrar de momentos passados. Não é puramente negativa.', synonyms: ['saudade', 'lembrança afetiva', 'reminiscência'], antonyms: ['indiferença ao passado', 'desapego'], category: 'Misto' },
  { word: 'Vergonha', definition: 'Sentimento de inadequação diante dos outros. Diferente da culpa (que é sobre o que fez), a vergonha é sobre quem você é.', synonyms: ['constrangimento', 'humilhação', 'envergonhamento'], antonyms: ['orgulho', 'dignidade', 'autoconfiança'], category: 'Desconfortável' },
  { word: 'Culpa', definition: 'Sentimento negativo por ter feito algo errado. Pode ser saudável (leva à reparação) ou tóxica (autocobrança excessiva).', synonyms: ['remorso', 'arrependimento', 'responsabilidade dolorosa'], antonyms: ['inocência', 'isenção', 'autocompaixão'], category: 'Desconfortável' },
  { word: 'Gratidão', definition: 'Sentimento de apreciação por algo ou alguém. Está associada a maior bem-estar e conexão social.', synonyms: ['reconhecimento', 'agradecimento', 'apreciação'], antonyms: ['ingratidão', 'desconsideração'], category: 'Agradável' },
  { word: 'Esperança', definition: 'Estado de expectativa positiva quanto ao futuro, mesmo em cenários difíceis. Diferente de otimismo (que é mais irracional).', synonyms: ['expectativa positiva', 'fé', 'confiança'], antonyms: ['desesperança', 'descrença', 'ceticismo'], category: 'Agradável' },
  { word: 'Saudade', definition: 'Sentimento tipicamente brasileiro de falta de algo ou alguém que se ama, com desejo de reencontro.', synonyms: ['nostalgia afetiva', 'falta', 'lembrança emotiva'], antonyms: ['indiferença', 'desapego'], category: 'Misto' },
  { word: 'Indignação', definition: 'Raiva justa diante de uma injustiça. Diferente da raiva comum por ter motivação ética.', synonyms: ['revolta justa', 'insatisfação moral', 'protesto interno'], antonyms: ['conformismo', 'passividade'], category: 'Desconfortável' },
  { word: 'Acolhimento', definition: 'Sentimento de receber a si ou ao outro com aceitação. Prática central em terapia e relações saudáveis.', synonyms: ['aceitação', 'recepção calorosa', 'acolhida'], antonyms: ['rejeição', 'exclusão', 'julgamento'], category: 'Agradável' },
  { word: 'Autocompaixão', definition: 'Tratar a si mesmo com gentileza diante de dificuldades, como trataria um amigo. Diferente de autopiedade.', synonyms: ['cuidado próprio', 'gentileza interior', 'bondade consigo'], antonyms: ['autocrítica', 'severidade', 'perfeccionismo'], category: 'Agradável' },
  { word: 'Alívio', definition: 'Sensação de redução de tensão ou sofrimento após um período de incômodo.', synonyms: ['descompressão', 'descanso emocional', 'trégua'], antonyms: ['pressão', 'tensão', 'sobrecarga'], category: 'Agradável' },
  { word: 'Orgulho', definition: 'Satisfação consigo mesmo por conquistas, valores ou esforço realizado.', synonyms: ['autoestima', 'dignidade', 'satisfação pessoal'], antonyms: ['vergonha', 'desvalorização', 'culpa'], category: 'Agradável' },
  { word: 'Euforia', definition: 'Estado de alegria intensa e energia elevada, geralmente de curta duração.', synonyms: ['exaltação', 'empolgação extrema', 'excitação'], antonyms: ['apatia', 'tristeza', 'desânimo'], category: 'Agradável' },
  { word: 'Ternura', definition: 'Sentimento de carinho delicado e afeto protetor em relação a alguém.', synonyms: ['doçura', 'afeto', 'carinho'], antonyms: ['frieza', 'hostilidade', 'indiferença'], category: 'Agradável' },
  { word: 'Admiração', definition: 'Reconhecimento positivo e respeito por qualidades de si, de alguém ou de algo.', synonyms: ['apreço', 'respeito', 'encantamento'], antonyms: ['desprezo', 'desdém', 'desvalorização'], category: 'Agradável' },
  { word: 'Confiança', definition: 'Sensação de segurança em si, no outro ou em um processo.', synonyms: ['segurança', 'fé', 'credibilidade'], antonyms: ['desconfiança', 'medo', 'insegurança'], category: 'Agradável' },
  { word: 'Insegurança', definition: 'Sensação de dúvida sobre o próprio valor, capacidade ou aceitação.', synonyms: ['autodúvida', 'incerteza', 'vulnerabilidade'], antonyms: ['confiança', 'segurança', 'firmeza'], category: 'Desconfortável' },
  { word: 'Ciúme', definition: 'Medo de perder afeto, atenção ou vínculo importante para outra pessoa.', synonyms: ['zelo excessivo', 'posse emocional', 'ameaça afetiva'], antonyms: ['confiança', 'tranquilidade', 'segurança relacional'], category: 'Misto' },
  { word: 'Inveja', definition: 'Desejo de possuir algo que o outro tem, podendo gerar dor comparativa.', synonyms: ['comparação dolorosa', 'cobiça', 'ressentimento'], antonyms: ['admiração', 'gratidão', 'contentamento'], category: 'Desconfortável' },
  { word: 'Ressentimento', definition: 'Mágoa persistente por algo percebido como injusto ou ofensivo.', synonyms: ['amargura', 'mágoa', 'ranço emocional'], antonyms: ['perdão', 'reconciliação', 'aceitação'], category: 'Desconfortável' },
  { word: 'Arrependimento', definition: 'Dor emocional por uma ação passada que hoje é vista de outra forma.', synonyms: ['remorso', 'pesar', 'culpa retrospectiva'], antonyms: ['convicção', 'paz com o passado', 'aceitação'], category: 'Misto' },
  { word: 'Solidão', definition: 'Sensação de desconexão emocional, mesmo podendo estar cercado de pessoas.', synonyms: ['isolamento', 'desconexão', 'vazio social'], antonyms: ['pertencimento', 'companhia', 'vínculo'], category: 'Desconfortável' },
  { word: 'Pertencimento', definition: 'Sentir-se aceito e incluído em um grupo, relação ou contexto.', synonyms: ['inclusão', 'conexão', 'aceitação'], antonyms: ['rejeição', 'exclusão', 'solidão'], category: 'Agradável' },
  { word: 'Sobrecarga', definition: 'Sensação de ter demandas demais para os recursos emocionais do momento.', synonyms: ['esgotamento', 'pressão excessiva', 'exaustão'], antonyms: ['equilíbrio', 'leveza', 'organização'], category: 'Desconfortável' },
  { word: 'Apatia', definition: 'Falta de interesse, motivação ou resposta emocional diante de estímulos.', synonyms: ['indiferença', 'desânimo', 'desligamento'], antonyms: ['entusiasmo', 'interesse', 'vitalidade'], category: 'Desconfortável' },
  { word: 'Vulnerabilidade', definition: 'Estado de abertura emocional com risco de dor, mas também de conexão.', synonyms: ['exposição emocional', 'sensibilidade', 'abertura'], antonyms: ['fechamento', 'defensividade', 'rigidez'], category: 'Misto' },
  { word: 'Coragem', definition: 'Ação apesar do medo, com compromisso com valores e propósito.', synonyms: ['bravura', 'ousadia consciente', 'firmeza'], antonyms: ['covardia', 'evitação', 'paralisia'], category: 'Agradável' },
  { word: 'Desespero', definition: 'Estado de sofrimento intenso com sensação de falta de saída.', synonyms: ['aflição extrema', 'desamparo', 'agonia'], antonyms: ['esperança', 'amparo', 'confiança'], category: 'Desconfortável' },
  { word: 'Contentamento', definition: 'Satisfação tranquila com o que se tem no presente.', synonyms: ['plenitude', 'satisfação serena', 'bem-estar'], antonyms: ['insatisfação', 'ganância', 'frustração'], category: 'Agradável' },
  { word: 'Compaixão', definition: 'Sensibilidade ao sofrimento do outro acompanhada de vontade de ajudar.', synonyms: ['empatia ativa', 'solidariedade', 'humanidade'], antonyms: ['indiferença', 'crueldade', 'frieza'], category: 'Agradável' },
  { word: 'Ambivalência', definition: 'Presença simultânea de sentimentos opostos sobre algo ou alguém.', synonyms: ['dualidade emocional', 'conflito interno', 'misto afetivo'], antonyms: ['clareza emocional', 'decisão firme', 'coerência'], category: 'Misto' },
  { word: 'Paz', definition: 'Estado de quietude mental e equilíbrio interno, com pouca agitação.', synonyms: ['harmonia', 'serenidade', 'tranquilidade'], antonyms: ['caos', 'agitação', 'conflito interno'], category: 'Agradável' },
  { word: 'Irritabilidade', definition: 'Tendência aumentada a reagir com impaciência ou incômodo.', synonyms: ['impaciência', 'nervosismo', 'reatividade'], antonyms: ['tolerância', 'calma', 'paciência'], category: 'Desconfortável' },
];

export default function EmotionalDictionarySection({ darkMode: dm }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const c = (l: string, d: string) => (dm ? d : l);

  const filtered = emotions.filter((e) => {
    const matchQ = e.word.toLowerCase().includes(q.toLowerCase()) || e.definition.toLowerCase().includes(q.toLowerCase());
    const matchCat = !cat || e.category === cat;
    return matchQ && matchCat;
  });

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>📖 Dicionário Emocional</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Aprenda a nomear emoções com precisão.</p>
      </div>

      <div className={`rounded-2xl p-3 mb-4 ${c('bg-white border border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar emoção..." className={`w-full p-3 rounded-xl text-sm ${c('bg-slate-50', 'bg-slate-900')}`} />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['Todas', 'Agradável', 'Desconfortável', 'Misto'].map((cName) => (
          <button key={cName} onClick={() => setCat(cName === 'Todas' ? null : cName)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${cat === cName || (!cat && cName === 'Todas') ? 'bg-blue-600 text-white' : dm ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
            {cName}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((e) => (
          <div key={e.word} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold">{e.word}</h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${e.category === 'Agradável' ? 'bg-emerald-100 text-emerald-700' : e.category === 'Desconfortável' ? 'bg-rose-100 text-rose-700' : 'bg-violet-100 text-violet-700'}`}>{e.category}</span>
            </div>
            <p className={`text-sm ${c('text-slate-600', 'text-slate-300')}`}>{e.definition}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {e.synonyms.map((s) => (<span key={s} className={`text-[10px] px-2 py-0.5 rounded-full ${dm ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>{s}</span>))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={`rounded-2xl p-6 text-center ${c('bg-slate-50', 'bg-slate-900')}`}>
          <p className={`text-sm ${c('text-slate-500', 'text-slate-400')}`}>Nenhuma emoção encontrada.</p>
        </div>
      )}
    </div>
  );
}