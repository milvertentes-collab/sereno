'use client';

import React, { useMemo, useState } from 'react';
import ModernAudioPlayer from './ModernAudioPlayer';
import SectionHeroCard from './SectionHeroCard';
import { yogaNidraDocRoutines, type YogaNidraDocRoutine } from '@/data/yogaNidraDocRoutines';
import { buildRoutineStaticAudioAssets } from '@/lib/guidedNarrationAssets';

const parseDurationToSeconds = (label: string) => {
  const match = label.match(/(\d+)/);
  return (Number(match?.[1] || 20) || 20) * 60;
};

const cleanNarrationText = (value: string) => value.replace(/\(\d+s\)/gi, '').replace(/\s+/g, ' ').trim();

const buildPracticeCues = (lines: string[]) => {
  const cues: Array<{ type: 'speech' | 'pause'; text?: string; pauseMs?: number }> = [];
  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;
    if (/^◈\s*ETAPA\b/i.test(trimmedLine)) continue;
    const exactPause = trimmedLine.match(/^\((\d+)s\)$/i);
    if (exactPause) {
      cues.push({ type: 'pause', pauseMs: Number(exactPause[1]) * 1000 });
      continue;
    }
    const parts = trimmedLine.split(/(\(\d+s\))/gi).filter(Boolean);
    for (const part of parts) {
      const pauseMatch = part.match(/^\((\d+)s\)$/i);
      if (pauseMatch) {
        cues.push({ type: 'pause', pauseMs: Number(pauseMatch[1]) * 1000 });
      } else {
        const text = cleanNarrationText(part);
        if (text) cues.push({ type: 'speech', text });
      }
    }
  }
  return cues;
};

const buildRawSubtitles = (routine: YogaNidraDocRoutine) => {
  const cues = buildPracticeCues(routine.practice);
  const targetSeconds = parseDurationToSeconds(routine.durationLabel);
  const pauseSeconds = cues.reduce((sum, cue) => sum + (cue.type === 'pause' ? (cue.pauseMs || 0) / 1000 : 0), 0);
  const speechCues = cues.filter((cue) => cue.type === 'speech' && cue.text);
  const totalChars = speechCues.reduce((sum, cue) => sum + (cue.text?.length || 0), 0) || 1;
  const speechBudgetSeconds = Math.max(targetSeconds - pauseSeconds, speechCues.length * 2.4);
  let cursor = 0;

  return cues.flatMap((cue) => {
    if (cue.type === 'pause') {
      cursor += (cue.pauseMs || 0) / 1000;
      return [];
    }
    const speechSeconds = Math.max(2.2, speechBudgetSeconds * ((cue.text?.length || 0) / totalChars));
    const chunk = {
      start: cursor,
      end: cursor + speechSeconds,
      text: cue.text || '',
    };
    cursor += speechSeconds;
    return [chunk];
  });
};

const buildDisplayText = (routine: YogaNidraDocRoutine) =>
  buildPracticeCues(routine.practice)
    .filter((cue) => cue.type === 'speech' && cue.text)
    .map((cue) => cue.text as string)
    .join('\n\n');

const practiceMeta: Record<string, { icon: string }> = {
  yoga_nidra_descanso_profundo: { icon: '🌙' },
  yoga_nidra_classico_de_satyananda: { icon: '🕉️' },
  irest_integrative_restoration: { icon: '🛟' },
  nsdr_non_sleep_deep_rest: { icon: '💤' },
  yoga_nidra_dos_61_pontos_shava_yatra: { icon: '✨' },
  yoga_nidra_para_o_sono: { icon: '🌌' },
  yoga_nidra_sensivel_ao_trauma: { icon: '🤍' },
};

const styleMap: Record<string, { bg: string; darkBg: string }> = {
  yoga_nidra_descanso_profundo: { bg: 'bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-100 border-indigo-100/50', darkBg: 'bg-gradient-to-br from-indigo-900/40 via-blue-900/30 to-violet-900/35 border-indigo-700/50' },
  yoga_nidra_classico_de_satyananda: { bg: 'bg-gradient-to-br from-violet-50 via-fuchsia-50 to-indigo-100 border-violet-100/50', darkBg: 'bg-gradient-to-br from-violet-900/35 via-fuchsia-900/20 to-indigo-900/35 border-violet-700/50' },
  irest_integrative_restoration: { bg: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 border-cyan-100/50', darkBg: 'bg-gradient-to-br from-teal-900/35 via-cyan-900/25 to-sky-900/35 border-cyan-700/50' },
  nsdr_non_sleep_deep_rest: { bg: 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 border-sky-100/50', darkBg: 'bg-gradient-to-br from-sky-900/35 via-blue-900/25 to-indigo-900/35 border-sky-700/50' },
  yoga_nidra_dos_61_pontos_shava_yatra: { bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 border-amber-100/50', darkBg: 'bg-gradient-to-br from-amber-900/35 via-yellow-900/20 to-orange-900/30 border-amber-700/50' },
  yoga_nidra_para_o_sono: { bg: 'bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-100 border-slate-200/60', darkBg: 'bg-gradient-to-br from-slate-900/45 via-indigo-900/25 to-blue-900/30 border-slate-700/60' },
  yoga_nidra_sensivel_ao_trauma: { bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-stone-100 border-rose-100/50', darkBg: 'bg-gradient-to-br from-rose-900/30 via-pink-900/20 to-stone-900/35 border-rose-700/50' },
};

export default function YogaNidraDocSection({
  darkMode: dm,
  onCheckAccess,
  defaultVoice,
  setDefaultVoice,
  onComplete,
  audioSettings,
}: {
  darkMode?: boolean;
  onCheckAccess: (feature: string, action?: string) => boolean;
  defaultVoice: 'masculino' | 'feminino' | 'nenhuma';
  setDefaultVoice: (v: 'masculino' | 'feminino' | 'nenhuma') => void;
  onComplete?: (minutes: number) => void;
  audioSettings?: { musicVolume: number; voiceVolume: number; backgroundMusicEnabled: boolean };
}) {
  const [selectedPractice, setSelectedPractice] = useState<YogaNidraDocRoutine | null>(null);
  const selectedVoice = defaultVoice;

  const routines = useMemo(
    () =>
      yogaNidraDocRoutines.map((routine) => {
        const meta = practiceMeta[routine.id] || { icon: '🌙' };
        const staticAssets = buildRoutineStaticAudioAssets('yoga-nidra-doc', routine.id);
        const speechText = buildPracticeCues(routine.practice)
          .filter((cue) => cue.type === 'speech' && cue.text)
          .map((cue) => cue.text as string)
          .join(' ');

        return {
          ...routine,
          icon: meta.icon,
          audio: staticAssets.audio,
          guidedAudio: staticAssets.guidedAudio,
          rawSubtitles: {
            feminino: buildRawSubtitles(routine),
            masculino: buildRawSubtitles(routine),
          },
          text: buildDisplayText(routine),
          preStartGuidance: {
            greeting: routine.greeting[0] || routine.title,
            intro: [...routine.greeting.slice(1), ...routine.intro].join(' '),
            items: routine.posture,
          },
          guidedNarration: {
            preparationText: [...routine.greeting, ...routine.intro, ...routine.posture].join(' '),
            closingText: routine.closing.map(cleanNarrationText).join(' '),
          },
          ttsNarration: {
            feminino: speechText,
            masculino: speechText,
          },
        };
      }),
    [],
  );

  if (selectedPractice) {
    const selected = routines.find((routine) => routine.id === selectedPractice.id) || routines[0];
    return (
      <ModernAudioPlayer
        title={selected.title}
        emoji={selected.icon}
        category={selected.subtitle}
        idealDurationLabel={selected.durationLabel}
        audio={selected.audio}
        rawSubtitles={selected.rawSubtitles}
        ttsNarration={selected.ttsNarration}
        text={selected.text}
        onClose={() => setSelectedPractice(null)}
        onComplete={() => onComplete?.(parseDurationToSeconds(selected.durationLabel) / 60)}
        darkMode={dm}
        initialVoice={!onCheckAccess('yoga', 'voice_selection') ? 'feminino' : selectedVoice}
        onVoiceChange={setDefaultVoice}
        voiceVolume={audioSettings?.voiceVolume ?? 80}
        musicVolume={audioSettings?.musicVolume ?? 50}
        backgroundMusicEnabled={audioSettings?.backgroundMusicEnabled ?? true}
        preStartGuidance={selected.preStartGuidance}
        guidedNarration={selected.guidedNarration}
        guidedAudio={selected.guidedAudio}
      />
    );
  }

  return (
    <div className={`p-4 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-indigo-50 to-white text-gray-800'}`}>
      <div className="mb-6 pt-4">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Relaxamento profundo"
          title="Yoga Nidra"
          description="Escolha a prática e entre em um descanso guiado com mais presença."
          icon="🌙"
        />
      </div>

      <div className={`rounded-[2.3rem] p-5 border mb-8 animate-slide-up shadow-sm max-w-lg mx-auto ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/90 border-white shadow-lg'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-300/75' : 'text-indigo-700/70'}`}>Sessões guiadas</p>
            <p className={`mt-1 text-sm font-extrabold ${dm ? 'text-slate-100' : 'text-slate-800'}`}>Escolha a experiência do momento e entre na sessão com mais suavidade.</p>
          </div>
          <div className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap ${dm ? 'bg-white/5 text-slate-200' : 'bg-indigo-50 text-indigo-700'}`}>
            {routines.length} práticas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
        {routines.map((practice, index) => {
          const style = styleMap[practice.id] || styleMap.yoga_nidra_descanso_profundo;
          return (
            <button
              key={practice.id}
              onClick={() => setSelectedPractice(practice)}
              data-card-glyph={practice.icon}
              className={`sereno-ornament-card group relative overflow-hidden rounded-[1.6rem] border p-4 text-left transition-all active:scale-[0.98] ${dm ? style.darkBg : style.bg} animate-slide-up`}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${dm ? 'bg-slate-800/60 border border-white/5 text-slate-100' : 'bg-white/70 border border-white text-slate-800'}`}>
                  {practice.icon}
                </div>
                <div className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-indigo-500/15 text-indigo-200' : 'bg-indigo-50 text-indigo-700'}`}>
                  {practice.durationLabel.replace(' minutos', ' min')}
                </div>
              </div>
              <p className={`mt-2 text-[0.98rem] font-black leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{practice.title}</p>
              <p className={`mt-2 text-xs leading-relaxed ${dm ? 'text-slate-300/80' : 'text-slate-600/85'}`}>{practice.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
