'use client';

import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MoodEntry } from '@/components/MoodSection';

interface Props { darkMode?: boolean }

const interventions = [
  { title: 'Respiração 4-7-8', desc: 'Técnica calmante: inspire 4s, segure 7s, expire 8s.', action: 'breathing' },
  { title: 'Grounding 5-4-3-2-1', desc: 'Nomeie 5 coisas que vê, 4 que ouve, 3 que toca, 2 que cheira, 1 que gosta.', action: 'grounding' },
  { title: 'Contato com alguém de confiança', desc: 'Ligue ou mande mensagem para alguém que te apoia.', action: 'contact' },
  { title: 'Música calmante', desc: 'Coloque uma música que te acalma e respire junto.', action: 'music' },
];

export default function PreventiveIntervention({ darkMode: dm }: Props) {
  const [moodHistory] = useLocalStorage<MoodEntry[]>('moodHistory', []);
  const [dismissed, setDismissed] = useLocalStorage<string[]>('psico_preventive_dismissed', []);
  const c = (l: string, d: string) => (dm ? d : l);

  const alert = useMemo(() => {
    const recent = moodHistory.slice(0, 5);
    if (recent.length < 3) return null;
    const avgIntensity = recent.reduce((s, m) => s + (m.intensity || 3), 0) / recent.length;
    const negativeEmotions = recent.filter((m) => ['triste', 'ansioso', 'estressado', 'irritado', 'sobrecarregado'].includes((m.primaryEmotion || '').toLowerCase())).length;
    const today = new Date().toISOString().split('T')[0];
    if (avgIntensity >= 3.5 && negativeEmotions >= 2 && !dismissed.includes(today)) {
      return { avgIntensity, negativeEmotions, today };
    }
    return null;
  }, [moodHistory, dismissed]);

  const dismiss = () => {
    if (alert) setDismissed([...dismissed, alert.today]);
  };

  if (!alert) return null;

  return (
    <div className={`rounded-3xl p-5 border-2 border-amber-400 mb-4 ${c('bg-amber-50', 'bg-amber-900/20')}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className={`font-bold ${c('text-amber-800', 'text-amber-300')}`}>Intervenção Preventiva</h3>
          <p className={`text-sm mt-1 ${c('text-amber-700', 'text-amber-200')}`}>
            Detectamos que você está passando por um momento difícil. Vamos tentar algo agora?
          </p>
        </div>
        <button onClick={dismiss} className={`text-xs ${c('text-amber-600', 'text-amber-400')}`}>Ignorar</button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {interventions.map((i) => (
          <button key={i.action} className={`p-3 rounded-xl text-left ${c('bg-white', 'bg-slate-800')}`}>
            <p className="font-bold text-sm">{i.title}</p>
            <p className={`text-xs mt-1 ${c('text-slate-500', 'text-slate-400')}`}>{i.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}