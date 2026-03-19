'use client';

import { useState } from 'react';
import { shareText, buildBadgeShareText } from '@/lib/share-utils';
import SharePlatformModal from './SharePlatformModal';
import SectionHeroCard from './SectionHeroCard';

export default function ShareAchievementSection({ darkMode }: { darkMode?: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  
  const c = (l: string, d: string) => (darkMode ? d : l);

  const achievements = [
    { id: '1', title: 'Persistência', emoji: '🔥', desc: 'Completei 7 dias seguidos de práticas de bem-estar.' },
    { id: '2', title: 'Mente Clara', emoji: '💎', desc: 'Concluí meu primeiro ciclo de meditação consciente.' },
    { id: '3', title: 'Equilíbrio', emoji: '⚖️', desc: 'Encontrei meu centro através das técnicas de respiração.' },
    { id: '4', title: 'Gratidão', emoji: '✨', desc: 'Cultivando o hábito de agradecer todos os dias.' },
  ];

  const handleShareClick = (title: string, desc: string) => {
    setSelectedTitle(title);
    setSelectedText(buildBadgeShareText(title, desc));
    setModalOpen(true);
  };

  return (
    <div className="p-4 pb-32 max-w-lg mx-auto animate-fade-in">
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={darkMode}
          eyebrow="Compartilhar progresso"
          title="Suas Conquistas"
          description="Compartilhe marcos do seu cuidado de um jeito bonito, simples e pessoal."
          icon="🏅"
        />
      </div>

      <div className={`rounded-3xl p-6 border mb-6 ${c('bg-white border-slate-200 text-slate-800', 'bg-slate-900 border-slate-700 text-slate-100')}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] mb-4 ${c('text-slate-500', 'text-slate-400')}`}>Escolha um marco para compartilhar</p>
        <div className="grid grid-cols-1 gap-3">
          {achievements.map((ach) => (
            <button
              key={ach.id}
              onClick={() => handleShareClick(ach.title, ach.desc)}
              className={`flex items-center gap-4 p-4 rounded-2xl border min-h-[96px] transition-all active:scale-95 text-left group ${c('bg-slate-50 border-slate-100 hover:border-indigo-200', 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50')}`}
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-600/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {ach.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{ach.title}</h3>
                <p className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{ach.desc}</p>
              </div>
              <span className="text-xl opacity-30 group-hover:opacity-100 transition-opacity">↗</span>
            </button>
          ))}
        </div>
      </div>

      <SharePlatformModal
        open={modalOpen}
        darkMode={darkMode}
        title={selectedTitle}
        onSelect={(platform) => {
          shareText(selectedText, platform);
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
