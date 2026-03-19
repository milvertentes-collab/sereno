'use client';

import React, { useMemo, useState } from 'react';
import ModernAudioPlayer from './ModernAudioPlayer';
import SectionHeroCard from './SectionHeroCard';
import { hooponoponoDocRoutines, type HooponoponoDocRoutine } from '@/data/hooponoponoDocRoutines';
import { buildRoutineStaticAudioAssets } from '@/lib/guidedNarrationAssets';

const parseDurationToSeconds = (label: string) => {
  const match = label.match(/(\d+)/);
  return (Number(match?.[1] || 8) || 8) * 60;
};

const cleanNarrationText = (value: string) => value.replace(/\(\d+s\)/gi, '').replace(/\s+/g, ' ').trim();

const buildPracticeCues = (lines: string[]) => {
  const cues: Array<{ type: 'speech' | 'pause'; text?: string; pauseMs?: number }> = [];
  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;
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

const buildRawSubtitles = (routine: HooponoponoDocRoutine) => {
  const cues = buildPracticeCues(routine.practice);
  const targetSeconds = parseDurationToSeconds(routine.durationLabel);
  const pauseSeconds = cues.reduce((sum, cue) => sum + (cue.type === 'pause' ? (cue.pauseMs || 0) / 1000 : 0), 0);
  const speechCues = cues.filter((cue) => cue.type === 'speech' && cue.text);
  const totalChars = speechCues.reduce((sum, cue) => sum + (cue.text?.length || 0), 0) || 1;
  const speechBudgetSeconds = Math.max(targetSeconds - pauseSeconds, speechCues.length * 2.2);
  let cursor = 0;

  return cues.flatMap((cue) => {
    if (cue.type === 'pause') {
      cursor += (cue.pauseMs || 0) / 1000;
      return [];
    }
    const speechSeconds = Math.max(2, speechBudgetSeconds * ((cue.text?.length || 0) / totalChars));
    const chunk = {
      start: cursor,
      end: cursor + speechSeconds,
      text: cue.text || '',
    };
    cursor += speechSeconds;
    return [chunk];
  });
};

const buildDisplayText = (routine: HooponoponoDocRoutine) =>
  buildPracticeCues(routine.practice)
    .filter((cue) => cue.type === 'speech' && cue.text)
    .map((cue) => cue.text as string)
    .join('\n\n');

const practiceMeta: Record<string, { icon: string; tier: 'curta' | 'média' | 'longa' }> = {
  serenamente: { icon: '🧘', tier: 'média' },
  gentilmente: { icon: '💖', tier: 'média' },
  plenamente: { icon: '✨', tier: 'curta' },
  autoperdao: { icon: '🤍', tier: 'longa' },
  soltar_e_liberar: { icon: '🌿', tier: 'longa' },
  relacionamentos: { icon: '🕊️', tier: 'longa' },
  crian_a_interior: { icon: '🧒', tier: 'média' },
  gratid_o_matinal: { icon: '🌅', tier: 'média' },
  sono_e_encerramento_do_dia: { icon: '🌙', tier: 'média' },
  cura_f_sica_e_corpo: { icon: '🫶', tier: 'média' },
  ansiedade_e_medo: { icon: '🌬️', tier: 'média' },
  luto_e_perda: { icon: '🕯️', tier: 'média' },
};

const styleMap: Record<string, { bg: string; darkBg: string; tone: string; darkTone: string }> = {
  serenamente: { bg: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100 border-teal-100/50', darkBg: 'bg-gradient-to-br from-teal-900/40 via-emerald-900/30 to-teal-800/40 border-teal-700/50', tone: 'text-teal-700', darkTone: 'text-teal-300' },
  gentilmente: { bg: 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 border-pink-100/50', darkBg: 'bg-gradient-to-br from-pink-900/40 via-rose-900/30 to-pink-800/40 border-pink-700/50', tone: 'text-pink-700', darkTone: 'text-pink-300' },
  plenamente: { bg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-blue-100/50', darkBg: 'bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-blue-800/40 border-blue-700/50', tone: 'text-blue-700', darkTone: 'text-blue-300' },
  autoperdao: { bg: 'bg-gradient-to-br from-stone-50 via-neutral-50 to-stone-100 border-stone-100/50', darkBg: 'bg-gradient-to-br from-stone-900/40 via-neutral-900/30 to-stone-800/40 border-stone-700/50', tone: 'text-stone-700', darkTone: 'text-stone-300' },
  soltar_e_liberar: { bg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-emerald-100/50', darkBg: 'bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-emerald-800/40 border-emerald-700/50', tone: 'text-emerald-700', darkTone: 'text-emerald-300' },
  relacionamentos: { bg: 'bg-gradient-to-br from-sky-50 via-cyan-50 to-sky-100 border-sky-100/50', darkBg: 'bg-gradient-to-br from-sky-900/40 via-cyan-900/30 to-sky-800/40 border-sky-700/50', tone: 'text-sky-700', darkTone: 'text-sky-300' },
  crian_a_interior: { bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 border-amber-100/50', darkBg: 'bg-gradient-to-br from-amber-900/35 via-orange-900/25 to-yellow-800/35 border-amber-700/50', tone: 'text-amber-700', darkTone: 'text-amber-300' },
  gratid_o_matinal: { bg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 border-yellow-100/50', darkBg: 'bg-gradient-to-br from-yellow-900/35 via-amber-900/25 to-orange-800/35 border-yellow-700/50', tone: 'text-yellow-700', darkTone: 'text-yellow-300' },
  sono_e_encerramento_do_dia: { bg: 'bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-100 border-indigo-100/50', darkBg: 'bg-gradient-to-br from-indigo-900/40 via-violet-900/30 to-blue-900/35 border-indigo-700/50', tone: 'text-indigo-700', darkTone: 'text-indigo-300' },
  cura_f_sica_e_corpo: { bg: 'bg-gradient-to-br from-rose-50 via-fuchsia-50 to-pink-100 border-rose-100/50', darkBg: 'bg-gradient-to-br from-rose-900/35 via-fuchsia-900/25 to-pink-800/35 border-rose-700/50', tone: 'text-rose-700', darkTone: 'text-rose-300' },
  ansiedade_e_medo: { bg: 'bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100 border-cyan-100/50', darkBg: 'bg-gradient-to-br from-cyan-900/35 via-sky-900/25 to-blue-800/35 border-cyan-700/50', tone: 'text-cyan-700', darkTone: 'text-cyan-300' },
  luto_e_perda: { bg: 'bg-gradient-to-br from-slate-50 via-violet-50 to-slate-100 border-slate-200/60', darkBg: 'bg-gradient-to-br from-slate-900/45 via-violet-900/20 to-slate-800/45 border-slate-700/60', tone: 'text-slate-700', darkTone: 'text-slate-300' },
};

export default function HooponoponoSection({
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
  const [selectedPractice, setSelectedPractice] = useState<HooponoponoDocRoutine | null>(null);
  const selectedVoice = defaultVoice;

  const routines = useMemo(
    () =>
      hooponoponoDocRoutines.map((routine) => {
        const meta = practiceMeta[routine.id] || { icon: '🙏', tier: 'média' as const };
        const staticAssets = buildRoutineStaticAudioAssets('hooponopono', routine.id);
        return {
          ...routine,
          icon: meta.icon,
          tier: meta.tier,
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
            feminino: buildPracticeCues(routine.practice)
              .filter((cue) => cue.type === 'speech' && cue.text)
              .map((cue) => cue.text as string)
              .join(' '),
            masculino: buildPracticeCues(routine.practice)
              .filter((cue) => cue.type === 'speech' && cue.text)
              .map((cue) => cue.text as string)
              .join(' '),
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
        initialVoice={!onCheckAccess('hooponopono', 'voice_selection') ? 'feminino' : selectedVoice}
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
    <div className={`p-4 animate-fade-in pb-32 min-h-screen ${dm ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-b from-teal-50 to-white text-gray-800'}`}>
      <div className="mb-6 pt-4">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Reconciliação interior"
          title="Ho'oponopono"
          description="Escolha uma prática para este momento."
          icon="🙏"
        />
      </div>

      <div className={`rounded-[2.3rem] p-5 border mb-8 animate-slide-up shadow-sm max-w-lg mx-auto ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/90 border-white shadow-lg'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${dm ? 'text-teal-300/75' : 'text-teal-700/70'}`}>Práticas guiadas</p>
            <p className={`mt-1 text-sm font-extrabold ${dm ? 'text-slate-100' : 'text-slate-800'}`}>Escolha a intenção do momento e entre na sessão com mais presença.</p>
          </div>
          <div className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap ${dm ? 'bg-white/5 text-slate-200' : 'bg-teal-50 text-teal-700'}`}>
            {routines.length} práticas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
        {routines.map((practice, index) => {
          const style = styleMap[practice.id] || styleMap.serenamente;
          const tierTone = practice.tier === 'longa'
            ? (dm ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700')
            : practice.tier === 'média'
              ? (dm ? 'bg-sky-500/15 text-sky-200' : 'bg-sky-50 text-sky-700')
              : (dm ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-50 text-emerald-700');

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
                <div className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tierTone}`}>
                  {practice.durationLabel.replace(' minutos', ' min')}
                </div>
              </div>
              <p className={`mt-1 text-lg font-black leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{practice.title}</p>
              <p className={`mt-2 text-xs leading-relaxed ${dm ? 'text-slate-300/80' : 'text-slate-600/85'}`}>{practice.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
