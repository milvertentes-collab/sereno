'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseSRT, Subtitle } from '@/lib/srtParser';
import { loadAmbientFavoriteMixOptions, loadNatureMixPresets, natureMixerTracks, type NatureMixPreset } from '@/components/NatureMixerSection';
import { cancelBrowserSpeech, speakBrowserText } from '@/lib/browserSpeech';
import { fetchAzureTtsObjectUrl } from '@/lib/ttsClient';

interface ModernAudioPlayerProps {
  title: string;
  emoji: string;
  category?: string;
  idealDurationLabel?: string;
  audio?: {
    feminino: string;
    masculino?: string;
  };
  srt?: {
    feminino: string;
    masculino?: string;
  };
  rawSubtitles?: {
    feminino: { start: number; end: number; text: string }[];
    masculino?: { start: number; end: number; text: string }[];
  };
  text?: string;
  onClose: () => void;
  onComplete?: () => void;
  darkMode?: boolean;
  initialVoice?: 'feminino' | 'masculino' | 'nenhuma';
  onVoiceChange?: (voice: 'feminino' | 'masculino' | 'nenhuma') => void;
  initialAmbientSoundId?: string;
  voiceVolume?: number;
  musicVolume?: number;
  backgroundMusicEnabled?: boolean;
  preStartGuidance?: {
    greeting: string;
    intro: string;
    items: string[];
    footnote?: string;
  };
  guidedNarration?: {
    preparationText?: string;
    closingText?: string;
  };
  guidedAudio?: {
    preparation?: {
      feminino: string;
      masculino?: string;
    };
    closing?: {
      feminino: string;
      masculino?: string;
    };
  };
  ttsNarration?: {
    feminino: string;
    masculino?: string;
  };
  preferGeneratedNarration?: boolean;
}

type VoiceOption = 'feminino' | 'masculino' | 'nenhuma';

function parseIdealDurationSeconds(label?: string) {
  if (!label) return null;
  if (label.includes(':')) {
    const [minutes, seconds] = label.split(':').map((part) => Number(part) || 0);
    return (minutes * 60) + seconds;
  }
  const match = label.match(/(\d+)/);
  if (!match) return null;
  return Number(match[1]) * 60;
}

export default function ModernAudioPlayer({
  title,
  emoji,
  category,
  idealDurationLabel,
  audio,
  srt,
  rawSubtitles,
  text,
  onClose,
  onComplete,
  darkMode: dm,
  initialVoice,
  onVoiceChange,
  initialAmbientSoundId,
  voiceVolume = 80,
  musicVolume = 50,
  backgroundMusicEnabled = true,
  preStartGuidance,
  guidedNarration,
  guidedAudio,
  ttsNarration,
  preferGeneratedNarration = false,
}: ModernAudioPlayerProps) {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(initialVoice || 'feminino');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullText, setShowFullText] = useState(false);
  const [showAmbientControls, setShowAmbientControls] = useState(false);
  const [showPreparationIntro, setShowPreparationIntro] = useState(false);
  const [showPreparationPosture, setShowPreparationPosture] = useState(false);
  const [ambientMode, setAmbientMode] = useState<'single' | 'mixer'>('single');
  const [guidancePreparing, setGuidancePreparing] = useState(false);
  const [guidancePaused, setGuidancePaused] = useState(false);
  const [guidanceSpeaking, setGuidanceSpeaking] = useState(false);
  const [srtSubtitles, setSrtSubtitles] = useState<Subtitle[]>([]);
  const [previewingVoice, setPreviewingVoice] = useState<Exclude<VoiceOption, 'nenhuma'> | null>(null);
  const [previewingAmbientId, setPreviewingAmbientId] = useState<string | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [accumulatedPauseTime, setAccumulatedPauseTime] = useState(0);
  const [livePauseElapsed, setLivePauseElapsed] = useState(0);
  const [autoPauseActive, setAutoPauseActive] = useState(false);
  const [activeAmbientSounds, setActiveAmbientSounds] = useState<Record<string, number>>(() => {
    if (initialAmbientSoundId) {
      return { [initialAmbientSoundId]: 30 };
    }
    return {};
  });
  const [savedNatureMixes, setSavedNatureMixes] = useState<NatureMixPreset[]>([]);
  const [generatedSessionAudio, setGeneratedSessionAudio] = useState<Record<'feminino' | 'masculino', string | null>>({
    feminino: null,
    masculino: null,
  });
  const [failedStaticSessionAudio, setFailedStaticSessionAudio] = useState<Record<'feminino' | 'masculino', boolean>>({
    feminino: false,
    masculino: false,
  });
  const [failedStaticGuidanceAudio, setFailedStaticGuidanceAudio] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const guidanceAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudibleVoiceRef = useRef<Exclude<VoiceOption, 'nenhuma'>>(initialVoice === 'masculino' ? 'masculino' : 'feminino');
  const guidanceRunIdRef = useRef(0);
  const guidancePauseTimeoutRef = useRef<number | null>(null);
  const guidancePauseResolveRef = useRef<(() => void) | null>(null);
  const guidanceSegmentResolveRef = useRef<(() => void) | null>(null);
  const guidancePauseRemainingMsRef = useRef(0);
  const guidancePauseStartedAtRef = useRef<number | null>(null);
  const guidanceManualPauseRef = useRef(false);
  const sessionSpeechRunIdRef = useRef(0);
  const sessionSpeechTickerRef = useRef<number | null>(null);
  const sessionSpeechStartedAtRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewMixerRefs = useRef<Record<string, HTMLAudioElement>>({});
  const ambientRefs = useRef<Record<string, HTMLAudioElement>>({});
  const pauseTimeoutRef = useRef<number | null>(null);
  const pauseRafRef = useRef<number | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);
  const appliedPauseIndicesRef = useRef<Set<number>>(new Set());

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playbackVoice: Exclude<VoiceOption, 'nenhuma'> = selectedVoice === 'nenhuma' ? lastAudibleVoiceRef.current : selectedVoice;
  const mainVoiceKey = playbackVoice === 'masculino' ? 'masculino' : 'feminino';
  const directAudioSrc = playbackVoice === 'feminino'
    ? ((preferGeneratedNarration || failedStaticSessionAudio.feminino) ? null : audio?.feminino)
    : playbackVoice === 'masculino'
      ? ((preferGeneratedNarration || failedStaticSessionAudio.masculino) ? null : audio?.masculino)
      : null;
  const audioSrc = playbackVoice === 'feminino'
    ? (directAudioSrc || generatedSessionAudio.feminino)
    : playbackVoice === 'masculino'
      ? (directAudioSrc || generatedSessionAudio.masculino)
      : null;
  const idealDurationSeconds = useMemo(() => parseIdealDurationSeconds(idealDurationLabel), [idealDurationLabel]);
  const transcriptParagraphs = useMemo(
    () => (text || '').split('\n').map((line) => line.trim()).filter(Boolean),
    [text]
  );
  const quickAmbientTracks = useMemo(
    () => [
      { id: 'med-calma-azul', name: 'Calma Azul', emoji: '🌊', mix: { mar1: 58, vento1: 26, riacho4: 18 } as Record<string, number> },
      { id: 'med-floresta-suave', name: 'Floresta Suave', emoji: '🌿', mix: { floresta1: 46, passaro1: 18, riacho2: 20 } as Record<string, number> },
      { id: 'med-noite-serena', name: 'Noite Serena', emoji: '🌙', mix: { noite1: 40, grilo1: 18, vento2: 16 } as Record<string, number> },
      { id: 'med-templo-leve', name: 'Templo Leve', emoji: '🕯️', mix: { sino1: 16, riacho1: 32, vento1: 14 } as Record<string, number> },
    ],
    [],
  );
  const favoriteAmbientMixes = useMemo(() => loadAmbientFavoriteMixOptions(), [savedNatureMixes]);
  const hasActiveMix = useMemo(
    () => Object.values(activeAmbientSounds).some((volume) => volume > 0),
    [activeAmbientSounds]
  );
  const extraPauseTime = useMemo(() => {
    if (!idealDurationSeconds || !duration || selectedVoice === 'nenhuma') return 0;
    return Math.max(0, idealDurationSeconds - duration);
  }, [duration, idealDurationSeconds, selectedVoice]);
  const sessionDuration = idealDurationSeconds || duration;
  const sessionCurrentTime = currentTime + accumulatedPauseTime + livePauseElapsed;
  const remainingTime = Math.max(0, sessionDuration - sessionCurrentTime);
  const preparationActive = guidancePreparing || guidancePaused || guidanceSpeaking;
  const speaking = isPlaying || autoPauseActive;
  const practiceActive = !preparationActive && (speaking || userPaused || currentTime > 0.01);
  const hasStartedSession = preparationActive || currentTime > 0.01 || userPaused || speaking;
  const sessionInProgress = preparationActive || speaking;
  const mainButtonLabel = preparationActive
    ? 'Parar preparação'
    : practiceActive
      ? 'Parar prática'
      : (userPaused || currentTime > 0.01)
        ? 'Continuar prática'
        : 'Iniciar com preparação';
  const mainButtonTone = preparationActive
    ? 'bg-rose-500 text-white shadow-rose-500/20'
    : practiceActive
      ? 'bg-rose-500 text-white shadow-rose-500/20'
      : 'bg-indigo-600 text-white shadow-indigo-500/30';
  const sessionStageLabel = preparationActive ? 'Iniciando' : (speaking || currentTime > 0 ? 'Prática' : 'Iniciando');
  const sessionStageDescription = preparationActive
    ? 'Preparando a prática.'
    : (speaking || currentTime > 0
      ? 'Tempo correndo na prática.'
      : 'Aguardando o início da prática.');

  useEffect(() => {
    const nextVoice = initialVoice || 'feminino';
    setSelectedVoice((current) => (current === nextVoice ? current : nextVoice));
  }, [initialVoice]);

  useEffect(() => {
    if (selectedVoice !== 'nenhuma') {
      lastAudibleVoiceRef.current = selectedVoice;
    }
  }, [selectedVoice]);

  useEffect(() => {
    async function loadSrt() {
      if (rawSubtitles) {
        setSrtSubtitles([]);
        return;
      }

      const srtPath =
        playbackVoice === 'feminino'
          ? srt?.feminino
          : playbackVoice === 'masculino'
            ? srt?.masculino
            : undefined;

      if (!srtPath) {
        setSrtSubtitles([]);
        return;
      }

      try {
        const response = await fetch(srtPath);
        const srtText = await response.text();
        setSrtSubtitles(parseSRT(srtText));
      } catch (error) {
        console.error('Erro ao carregar legenda SRT:', error);
        setSrtSubtitles([]);
      }
    }

    loadSrt();
  }, [playbackVoice, rawSubtitles, srt]);

  useEffect(() => {
    const targetVoice = playbackVoice === 'feminino' ? 'feminino' : 'masculino';
    const sourceText = targetVoice === 'feminino' ? ttsNarration?.feminino : (ttsNarration?.masculino || ttsNarration?.feminino);
    const directSource = targetVoice === 'feminino'
      ? (failedStaticSessionAudio.feminino ? null : audio?.feminino)
      : (failedStaticSessionAudio.masculino ? null : audio?.masculino);
    if (directSource || !sourceText?.trim()) return;
    if (generatedSessionAudio[targetVoice]) return;

    let cancelled = false;
    const voice = targetVoice === 'feminino' ? 'pt-BR-FranciscaNeural' : 'pt-BR-AntonioNeural';
    const gender = targetVoice === 'feminino' ? 'feminino' : 'masculino';

    (async () => {
      try {
        const url = await fetchAzureTtsObjectUrl({ text: sourceText, gender, voice });
        if (cancelled) return;
        setGeneratedSessionAudio((prev) => {
          if (prev[targetVoice]) {
            URL.revokeObjectURL(prev[targetVoice] as string);
          }
          return { ...prev, [targetVoice]: url };
        });
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [
    audio?.feminino,
    audio?.masculino,
    failedStaticSessionAudio.feminino,
    failedStaticSessionAudio.masculino,
    generatedSessionAudio,
    playbackVoice,
    ttsNarration?.feminino,
    ttsNarration?.masculino,
  ]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = 1;
  }, [audioSrc]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = selectedVoice === 'nenhuma' ? 0 : Math.max(0, Math.min(1, voiceVolume / 100));
  }, [selectedVoice, voiceVolume]);

  useEffect(() => {
    if (!guidanceAudioRef.current) return;
    guidanceAudioRef.current.volume = selectedVoice === 'nenhuma' ? 0 : Math.max(0, Math.min(1, voiceVolume / 100));
  }, [selectedVoice, voiceVolume]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.pause();
    audioEl.load();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setUserPaused(false);
    setAccumulatedPauseTime(0);
    setLivePauseElapsed(0);
    setAutoPauseActive(false);
    appliedPauseIndicesRef.current = new Set();
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (pauseRafRef.current) {
      window.cancelAnimationFrame(pauseRafRef.current);
      pauseRafRef.current = null;
    }
  }, [audioSrc]);

  useEffect(() => {
    setSavedNatureMixes(loadNatureMixPresets());
    const syncPresets = () => setSavedNatureMixes(loadNatureMixPresets());
    window.addEventListener('nature-mix-presets-updated', syncPresets);
    return () => window.removeEventListener('nature-mix-presets-updated', syncPresets);
  }, []);
  
  useEffect(() => {
    Object.entries(activeAmbientSounds).forEach(([id, volume]) => {
      if (!ambientRefs.current[id]) {
        const track = natureMixerTracks.find((item) => item.id === id);
        if (!track) return;
        const ambientAudio = new Audio(encodeURI(track.src));
        ambientAudio.loop = true;
        ambientAudio.volume = backgroundMusicEnabled ? (volume / 100) * (musicVolume / 100) : 0;
        ambientRefs.current[id] = ambientAudio;
      }

      const ambientAudio = ambientRefs.current[id];
      ambientAudio.volume = backgroundMusicEnabled ? (volume / 100) * (musicVolume / 100) : 0;
      if (backgroundMusicEnabled && ambientAudio.paused) {
        ambientAudio.play().catch(() => {});
      }
      if (!backgroundMusicEnabled && !ambientAudio.paused) {
        ambientAudio.pause();
      }
    });

    Object.keys(ambientRefs.current).forEach((id) => {
      if (activeAmbientSounds[id]) return;
      ambientRefs.current[id].pause();
      ambientRefs.current[id].currentTime = 0;
      delete ambientRefs.current[id];
    });
  }, [activeAmbientSounds, backgroundMusicEnabled, musicVolume]);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
      if (pauseRafRef.current) {
        window.cancelAnimationFrame(pauseRafRef.current);
      }
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      Object.values(generatedSessionAudio).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      }
      if (guidanceAudioRef.current) {
        guidanceAudioRef.current.pause();
        guidanceAudioRef.current.src = '';
      }
      Object.values(previewMixerRefs.current).forEach((previewAudio) => {
        previewAudio.pause();
        previewAudio.src = '';
      });
      previewMixerRefs.current = {};

      Object.values(ambientRefs.current).forEach((ambientAudio) => {
        ambientAudio.pause();
        ambientAudio.src = '';
      });
      ambientRefs.current = {};
    };
  }, [generatedSessionAudio]);

  const subtitleChunks = useMemo(() => {
    const activeRaw =
      selectedVoice === 'feminino'
        ? rawSubtitles?.feminino
        : selectedVoice === 'masculino'
          ? rawSubtitles?.masculino
          : undefined;

    if (activeRaw && activeRaw.length > 0) {
      if (duration && duration > 1) {
        const totalRawSpeechDuration = activeRaw.reduce((sum, item) => sum + Math.max(0.1, item.end - item.start), 0) || 1;
        let cursor = 0;
        return activeRaw.map((item, index) => {
          const scaledDuration = duration * (Math.max(0.1, item.end - item.start) / totalRawSpeechDuration);
          const chunk = {
            id: index,
            text: item.text,
            start: cursor,
            end: cursor + scaledDuration,
          };
          cursor += scaledDuration;
          return chunk;
        });
      }

      return activeRaw.map((item, index) => ({
        id: index,
        text: item.text,
        start: item.start,
        end: item.end,
      }));
    }

    if (srtSubtitles.length > 0) {
      return srtSubtitles.map((item) => ({
        id: item.id,
        text: item.text,
        start: item.startTime,
        end: item.endTime,
      }));
    }

    if (!duration || duration <= 1 || !text) return [];

    const totalLength = transcriptParagraphs.reduce((sum, paragraph) => sum + paragraph.length, 0);
    let accumulatedTime = 0;

    return transcriptParagraphs.map((paragraph, index) => {
      const proportionalDuration = totalLength > 0 ? (paragraph.length / totalLength) * duration : 0;
      const start = index === 0 ? 2 : accumulatedTime;
      const end = accumulatedTime + proportionalDuration;
      accumulatedTime = end;
      return {
        id: index,
        text: paragraph,
        start,
        end,
      };
    });
  }, [duration, rawSubtitles, selectedVoice, srtSubtitles, text, transcriptParagraphs]);

  const pauseDurations = useMemo(() => {
    if (extraPauseTime <= 0 || subtitleChunks.length === 0) return subtitleChunks.map(() => 0);
    const weights = subtitleChunks.map((chunk, index) => {
      const textValue = chunk.text || '';
      let weight = 1;
      if (/[.!?…]$/.test(textValue)) weight += 0.8;
      if (/[,:;]$/.test(textValue)) weight += 0.35;
      if (index === subtitleChunks.length - 1) weight += 0.4;
      return weight;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    return weights.map((weight) => (extraPauseTime * weight) / totalWeight);
  }, [extraPauseTime, subtitleChunks]);

  const sessionSubtitleChunks = useMemo(() => {
    let accumulated = 0;
    return subtitleChunks.map((chunk, index) => {
      const mapped = {
        ...chunk,
        start: chunk.start + accumulated,
        end: chunk.end + accumulated,
        pauseAfter: pauseDurations[index] || 0,
      };
      accumulated += pauseDurations[index] || 0;
      return mapped;
    });
  }, [pauseDurations, subtitleChunks]);

  const activeSubtitleIndex = useMemo(
    () => sessionSubtitleChunks.findIndex((chunk) => sessionCurrentTime >= chunk.start && sessionCurrentTime < chunk.end),
    [sessionCurrentTime, sessionSubtitleChunks]
  );
  const activeSubtitle = activeSubtitleIndex >= 0 ? subtitleChunks[activeSubtitleIndex] : null;
  const nextSubtitle = activeSubtitleIndex >= 0 ? subtitleChunks[activeSubtitleIndex + 1] : null;

  useEffect(() => {
    if (!autoPauseActive) {
      setLivePauseElapsed(0);
      return;
    }

    const tick = () => {
      if (pauseStartedAtRef.current) {
        setLivePauseElapsed((performance.now() - pauseStartedAtRef.current) / 1000);
      }
      pauseRafRef.current = window.requestAnimationFrame(tick);
    };

    pauseRafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (pauseRafRef.current) {
        window.cancelAnimationFrame(pauseRafRef.current);
        pauseRafRef.current = null;
      }
    };
  }, [autoPauseActive]);

  useEffect(() => {
    if (!isPlaying || autoPauseActive || selectedVoice === 'nenhuma') return;
    if (!audioRef.current) return;

    const nextPauseIndex = subtitleChunks.findIndex((chunk, index) => {
      const pauseAfter = pauseDurations[index] || 0;
      return pauseAfter > 0 && currentTime >= chunk.end && !appliedPauseIndicesRef.current.has(index);
    });

    if (nextPauseIndex === -1) return;

    const pauseSeconds = pauseDurations[nextPauseIndex] || 0;
    if (pauseSeconds <= 0) return;

    appliedPauseIndicesRef.current.add(nextPauseIndex);
    pauseStartedAtRef.current = performance.now();
    setAutoPauseActive(true);
    audioRef.current.pause();

    pauseTimeoutRef.current = window.setTimeout(() => {
      setAccumulatedPauseTime((prev) => prev + pauseSeconds);
      setLivePauseElapsed(0);
      setAutoPauseActive(false);
      pauseStartedAtRef.current = null;
      if (audioRef.current && !userPaused) {
        audioRef.current.play().catch(() => {});
      }
    }, pauseSeconds * 1000);
  }, [autoPauseActive, currentTime, isPlaying, pauseDurations, selectedVoice, subtitleChunks, userPaused]);

  const stopSessionSpeech = useCallback((preserveProgress = false) => {
    sessionSpeechRunIdRef.current += 1;
    cancelBrowserSpeech();
    if (sessionSpeechTickerRef.current) {
      window.clearInterval(sessionSpeechTickerRef.current);
      sessionSpeechTickerRef.current = null;
    }
    sessionSpeechStartedAtRef.current = null;
    setIsPlaying(false);
    if (!preserveProgress) {
      setCurrentTime(0);
      setUserPaused(false);
    }
  }, []);

  const resetSession = useCallback(() => {
    stopSessionSpeech();
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (pauseRafRef.current) {
      window.cancelAnimationFrame(pauseRafRef.current);
      pauseRafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (guidanceAudioRef.current) {
      guidanceAudioRef.current.pause();
      guidanceAudioRef.current.currentTime = 0;
      guidanceAudioRef.current.src = '';
      guidanceAudioRef.current = null;
    }

    Object.values(ambientRefs.current).forEach((ambientAudio) => {
      ambientAudio.pause();
      ambientAudio.currentTime = 0;
    });

    setCurrentTime(0);
    setIsPlaying(false);
    setUserPaused(false);
    setAccumulatedPauseTime(0);
    setLivePauseElapsed(0);
    setAutoPauseActive(false);
    setShowFullText(false);
  }, [stopSessionSpeech]);

  const stopAll = useCallback(() => {
    resetSession();
    onClose();
  }, [onClose, resetSession]);

  const stopGuidanceAudio = useCallback((options?: { preservePreparationState?: boolean }) => {
    cancelBrowserSpeech();
    guidanceRunIdRef.current += 1;
    setGuidanceSpeaking(false);
    if (guidancePauseTimeoutRef.current) {
      window.clearTimeout(guidancePauseTimeoutRef.current);
      guidancePauseTimeoutRef.current = null;
    }
    if (guidancePauseResolveRef.current) {
      guidancePauseResolveRef.current();
      guidancePauseResolveRef.current = null;
    }
    if (guidanceAudioRef.current) {
      guidanceAudioRef.current.pause();
      guidanceAudioRef.current.currentTime = 0;
      guidanceAudioRef.current.src = '';
      guidanceAudioRef.current = null;
    }
    if (guidanceSegmentResolveRef.current) {
      guidanceSegmentResolveRef.current();
      guidanceSegmentResolveRef.current = null;
    }
    guidancePauseRemainingMsRef.current = 0;
    guidancePauseStartedAtRef.current = null;
    guidanceManualPauseRef.current = false;
    if (options?.preservePreparationState) {
      setGuidancePaused(false);
      return;
    }
    setGuidancePreparing(false);
    setGuidancePaused(false);
  }, []);

  const playGuidanceClip = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text?.trim() || selectedVoice === 'nenhuma') {
      onEnd?.();
      return;
    }

    try {
      stopGuidanceAudio({ preservePreparationState: true });
      const currentRunId = guidanceRunIdRef.current;
      const voice = selectedVoice === 'feminino' ? 'pt-BR-FranciscaNeural' : 'pt-BR-AntonioNeural';
      const gender = selectedVoice === 'feminino' ? 'feminino' : 'masculino';
      const volume = Math.max(0, Math.min(1, voiceVolume / 100));
      const sentences = (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
        .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

      for (let index = 0; index < sentences.length; index += 1) {
        const sentence = sentences[index];
        if (guidanceRunIdRef.current !== currentRunId) return;

        let usedBrowserFallback = false;
        try {
          const url = await fetchAzureTtsObjectUrl({ text: sentence, gender, voice });
          if (guidanceRunIdRef.current !== currentRunId) {
            URL.revokeObjectURL(url);
            usedBrowserFallback = true;
          } else {
            await new Promise<void>((resolve) => {
              guidanceSegmentResolveRef.current = resolve;
              const audio = new Audio(url);
              guidanceAudioRef.current = audio;
              setGuidanceSpeaking(true);
              audio.volume = volume;
              let settled = false;
              const finalize = () => {
                if (settled) return;
                settled = true;
                setGuidanceSpeaking(false);
                URL.revokeObjectURL(url);
                if (guidanceAudioRef.current === audio) guidanceAudioRef.current = null;
                if (guidanceSegmentResolveRef.current === resolve) guidanceSegmentResolveRef.current = null;
                resolve();
              };
              audio.onended = finalize;
              audio.onerror = finalize;
              audio.onpause = () => {
                if (guidanceManualPauseRef.current) return;
                finalize();
              };
              audio.play().catch(finalize);
            });
          }
        } catch {
          usedBrowserFallback = true;
        }

        if (usedBrowserFallback) {
          setGuidanceSpeaking(true);
          await speakBrowserText(sentence, {
            voice: selectedVoice === 'masculino' ? 'masculino' : 'feminino',
            volume,
          });
          setGuidanceSpeaking(false);
        }

        if (guidanceRunIdRef.current !== currentRunId) return;
        if (index < sentences.length - 1) {
          let pauseMs = /[!?]$/.test(sentence) ? 1400 : 1200;
          if (/respire|sinta|perceba|observe|solte|deixe|acolha|permaneça|escute|ouça/i.test(sentence)) pauseMs = 2600;
          if (/corpo|ombros|rosto|mandíbula|peito|apoio|chão|cadeira|coração/i.test(sentence)) pauseMs = Math.max(pauseMs, 3000);
          guidancePauseRemainingMsRef.current = pauseMs;
          guidancePauseStartedAtRef.current = performance.now();
          await new Promise<void>((resolve) => {
            guidancePauseResolveRef.current = resolve;
            guidancePauseTimeoutRef.current = window.setTimeout(() => {
              guidancePauseTimeoutRef.current = null;
              guidancePauseResolveRef.current = null;
              guidancePauseRemainingMsRef.current = 0;
              guidancePauseStartedAtRef.current = null;
              resolve();
            }, pauseMs);
          });
        }
      }

      if (guidanceRunIdRef.current === currentRunId) {
        onEnd?.();
      }
    } catch {
      onEnd?.();
    }
  }, [selectedVoice, stopGuidanceAudio, voiceVolume]);

  const playSessionSpeech = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text?.trim() || selectedVoice === 'nenhuma') {
      onEnd?.();
      return;
    }

    stopSessionSpeech(true);
    const currentRunId = sessionSpeechRunIdRef.current;
    const volume = Math.max(0, Math.min(1, voiceVolume / 100));
    const sentences = (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
      .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const estimatedDurationSeconds = idealDurationSeconds || Math.max(30, sentences.join(' ').split(/\s+/).filter(Boolean).length * 0.45);

    setDuration(estimatedDurationSeconds);
    setCurrentTime(0);
    setUserPaused(false);
    setIsPlaying(true);
    sessionSpeechStartedAtRef.current = performance.now();
    sessionSpeechTickerRef.current = window.setInterval(() => {
      if (sessionSpeechStartedAtRef.current === null) return;
      const elapsedSeconds = (performance.now() - sessionSpeechStartedAtRef.current) / 1000;
      setCurrentTime(Math.min(estimatedDurationSeconds, elapsedSeconds));
    }, 200);

    for (let index = 0; index < sentences.length; index += 1) {
      if (sessionSpeechRunIdRef.current !== currentRunId) return;
      const sentence = sentences[index];
      let usedBrowserFallback = false;
      try {
        const url = await fetchAzureTtsObjectUrl({
          text: sentence,
          gender: selectedVoice === 'masculino' ? 'masculino' : 'feminino',
          voice: selectedVoice === 'masculino' ? 'pt-BR-AntonioNeural' : 'pt-BR-FranciscaNeural',
        });

        await new Promise<void>((resolve) => {
          const audio = new Audio(url);
          guidanceAudioRef.current = audio;
          audio.volume = volume;
          let settled = false;

          const finalize = () => {
            if (settled) return;
            settled = true;
            URL.revokeObjectURL(url);
            if (guidanceAudioRef.current === audio) guidanceAudioRef.current = null;
            resolve();
          };

          audio.onended = finalize;
          audio.onerror = finalize;
          audio.onpause = () => {
            if (guidanceManualPauseRef.current) return;
            finalize();
          };
          audio.play().catch(() => {
            usedBrowserFallback = true;
            finalize();
          });
        });
      } catch {
        usedBrowserFallback = true;
      }

      if (usedBrowserFallback) {
        await speakBrowserText(sentence, {
          voice: selectedVoice === 'masculino' ? 'masculino' : 'feminino',
          volume,
        });
      }

      if (sessionSpeechRunIdRef.current !== currentRunId) return;
      if (index < sentences.length - 1) {
        const pauseMs = /respire|sinta|perceba|observe|solte|deixe|acolha|permaneça|escute|ouça/i.test(sentence) ? 2200 : 1100;
        await new Promise<void>((resolve) => {
          const timeout = window.setTimeout(() => {
            window.clearTimeout(timeout);
            resolve();
          }, pauseMs);
        });
      }
    }

    if (sessionSpeechRunIdRef.current === currentRunId) {
      if (sessionSpeechTickerRef.current) {
        window.clearInterval(sessionSpeechTickerRef.current);
        sessionSpeechTickerRef.current = null;
      }
      setCurrentTime(estimatedDurationSeconds);
      setIsPlaying(false);
      onEnd?.();
    }
  }, [idealDurationSeconds, selectedVoice, stopSessionSpeech, voiceVolume]);

  const playGuidanceClipWithFallback = useCallback(async (
    text: string,
    onEnd?: () => void,
    clipType?: 'preparation' | 'closing',
  ) => {
    if (!text?.trim() || selectedVoice === 'nenhuma') {
      onEnd?.();
      return;
    }

    const voiceKey = selectedVoice === 'masculino' ? 'masculino' : 'feminino';
    const clipSource = clipType
      ? (
          preferGeneratedNarration
            ? undefined
            :
          voiceKey === 'feminino'
            ? guidedAudio?.[clipType]?.feminino
            : (guidedAudio?.[clipType]?.masculino || guidedAudio?.[clipType]?.feminino)
        )
      : undefined;
    const clipFailureKey = clipType ? `${clipType}:${voiceKey}` : '';

    if (clipSource && clipFailureKey && !failedStaticGuidanceAudio[clipFailureKey]) {
      try {
        stopGuidanceAudio({ preservePreparationState: true });
        const currentRunId = guidanceRunIdRef.current;
        const volume = Math.max(0, Math.min(1, voiceVolume / 100));

        const played = await new Promise<boolean>((resolve) => {
          guidanceSegmentResolveRef.current = () => resolve(false);
          const audio = new Audio(clipSource);
          guidanceAudioRef.current = audio;
          setGuidanceSpeaking(true);
          audio.volume = volume;
          let settled = false;

          const finalize = (success: boolean) => {
            if (settled) return;
            settled = true;
            setGuidanceSpeaking(false);
            if (guidanceAudioRef.current === audio) guidanceAudioRef.current = null;
            if (guidanceSegmentResolveRef.current) guidanceSegmentResolveRef.current = null;
            resolve(success);
          };

          audio.onended = () => finalize(true);
          audio.onerror = () => finalize(false);
          audio.onpause = () => {
            if (guidanceManualPauseRef.current) return;
            finalize(true);
          };
          audio.play().catch(() => finalize(false));
        });

        if (played && guidanceRunIdRef.current === currentRunId) {
          onEnd?.();
          return;
        }

        if (!played) {
          setFailedStaticGuidanceAudio((prev) => ({ ...prev, [clipFailureKey]: true }));
        }
      } catch {
        setFailedStaticGuidanceAudio((prev) => ({ ...prev, [clipFailureKey]: true }));
      }
    }

    playGuidanceClip(text, onEnd);
  }, [
    failedStaticGuidanceAudio,
    guidedAudio,
    playGuidanceClip,
    preferGeneratedNarration,
    selectedVoice,
    stopGuidanceAudio,
    voiceVolume,
  ]);

  const startMainAudio = useCallback(() => {
    if (!audioSrc) {
      const sessionText = mainVoiceKey === 'feminino' ? ttsNarration?.feminino : (ttsNarration?.masculino || ttsNarration?.feminino);
      if (sessionText?.trim()) {
        void playSessionSpeech(sessionText, onComplete);
      }
      return;
    }
    if (!audioRef.current) return;
    setUserPaused(false);
    audioRef.current.play().catch(console.error);
  }, [audioSrc, mainVoiceKey, onComplete, playSessionSpeech, ttsNarration?.feminino, ttsNarration?.masculino]);

  const startSessionPlayback = useCallback((skipPreparation = false) => {
    if (!audioSrc) {
      if (skipPreparation || !guidedNarration?.preparationText || selectedVoice === 'nenhuma') {
        setGuidancePreparing(false);
        setGuidancePaused(false);
        startMainAudio();
        return;
      }
      setGuidancePreparing(true);
      setGuidancePaused(false);
      setGuidanceSpeaking(false);
      playGuidanceClipWithFallback(guidedNarration.preparationText, () => {
        setGuidancePreparing(false);
        setGuidancePaused(false);
        setGuidanceSpeaking(false);
        startMainAudio();
      }, 'preparation');
      return;
    }
    if (!audioRef.current) return;
    if (skipPreparation || !guidedNarration?.preparationText || selectedVoice === 'nenhuma') {
      setGuidancePreparing(false);
      setGuidancePaused(false);
      startMainAudio();
      return;
    }
    setGuidancePreparing(true);
    setGuidancePaused(false);
    setGuidanceSpeaking(false);
    playGuidanceClipWithFallback(guidedNarration.preparationText, () => {
      setGuidancePreparing(false);
      setGuidancePaused(false);
      setGuidanceSpeaking(false);
      startMainAudio();
    }, 'preparation');
  }, [audioSrc, guidedNarration?.preparationText, playGuidanceClipWithFallback, selectedVoice, startMainAudio]);

  const cancelPreparation = useCallback(() => {
    stopGuidanceAudio();
  }, [stopGuidanceAudio]);

  const skipPreparation = useCallback(() => {
    stopGuidanceAudio();
    setGuidancePreparing(false);
    setGuidancePaused(false);
    startMainAudio();
  }, [startMainAudio, stopGuidanceAudio]);

  const toggleGuidancePause = useCallback(async () => {
    if (!guidancePreparing) return;

    if (guidanceAudioRef.current) {
      if (guidancePaused) {
        try {
          guidanceManualPauseRef.current = false;
          await guidanceAudioRef.current.play();
          setGuidancePaused(false);
        } catch {}
        return;
      }
      guidanceManualPauseRef.current = true;
      guidanceAudioRef.current.pause();
      setGuidancePaused(true);
      return;
    }

    if (guidancePauseTimeoutRef.current) {
      window.clearTimeout(guidancePauseTimeoutRef.current);
      guidancePauseTimeoutRef.current = null;
      if (guidancePauseStartedAtRef.current) {
        const elapsed = performance.now() - guidancePauseStartedAtRef.current;
        guidancePauseRemainingMsRef.current = Math.max(200, guidancePauseRemainingMsRef.current - elapsed);
      }
      guidancePauseStartedAtRef.current = null;
      setGuidancePaused(true);
      return;
    }

    if (guidancePaused && guidancePauseResolveRef.current && guidancePauseRemainingMsRef.current > 0) {
      guidancePauseStartedAtRef.current = performance.now();
      guidancePauseTimeoutRef.current = window.setTimeout(() => {
        guidancePauseTimeoutRef.current = null;
        guidancePauseStartedAtRef.current = null;
        guidancePauseRemainingMsRef.current = 0;
        const resolve = guidancePauseResolveRef.current;
        guidancePauseResolveRef.current = null;
        resolve?.();
      }, guidancePauseRemainingMsRef.current);
      setGuidancePaused(false);
    }
  }, [guidancePaused, guidancePreparing]);

  const clearScheduledPause = useCallback((commitElapsed: boolean) => {
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (pauseRafRef.current) {
      window.cancelAnimationFrame(pauseRafRef.current);
      pauseRafRef.current = null;
    }

    if (commitElapsed && livePauseElapsed > 0) {
      setAccumulatedPauseTime((prev) => prev + livePauseElapsed);
    }

    pauseStartedAtRef.current = null;
    setLivePauseElapsed(0);
    setAutoPauseActive(false);
  }, [livePauseElapsed]);

  const togglePlay = () => {
    if (guidanceAudioRef.current) {
      stopGuidanceAudio();
      return;
    }
    if (!audioSrc) {
      if (isPlaying) {
        stopSessionSpeech(true);
        setUserPaused(true);
        return;
      }
      startSessionPlayback(currentTime > 0.01 || userPaused);
      return;
    }
    if (!audioRef.current) return;
    if (!isPlaying && currentTime <= 0.01 && !userPaused) {
      startSessionPlayback(false);
      return;
    }
    if (isPlaying) {
      setUserPaused(true);
      audioRef.current.pause();
      return;
    }
    if (autoPauseActive) {
      clearScheduledPause(true);
    }
    startMainAudio();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    if (pauseTimeoutRef.current) {
      window.clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (pauseRafRef.current) {
      window.cancelAnimationFrame(pauseRafRef.current);
      pauseRafRef.current = null;
    }

    let mappedAudioTime = nextTime;
    let mappedAccumulatedPause = 0;

    for (let index = 0; index < subtitleChunks.length; index += 1) {
      const audioChunk = subtitleChunks[index];
      const sessionChunk = sessionSubtitleChunks[index];
      const pauseAfter = pauseDurations[index] || 0;
      const pauseStart = sessionChunk.end;
      const pauseEnd = pauseStart + pauseAfter;

      if (nextTime >= sessionChunk.start && nextTime <= sessionChunk.end) {
        mappedAudioTime = audioChunk.start + (nextTime - sessionChunk.start);
        mappedAccumulatedPause = sessionChunk.start - audioChunk.start;
        break;
      }

      if (pauseAfter > 0 && nextTime > pauseStart && nextTime <= pauseEnd) {
        mappedAudioTime = audioChunk.end;
        mappedAccumulatedPause = nextTime - mappedAudioTime;
        break;
      }

      if (index === subtitleChunks.length - 1 && nextTime > sessionChunk.end) {
        mappedAudioTime = Math.min(duration, Math.max(0, nextTime - extraPauseTime));
        mappedAccumulatedPause = nextTime - mappedAudioTime;
      }
    }

    appliedPauseIndicesRef.current = new Set(
      subtitleChunks
        .map((chunk, index) => ({ chunk, index }))
        .filter(({ chunk }) => mappedAudioTime >= chunk.end)
        .map(({ index }) => index)
    );

    setAccumulatedPauseTime(Math.max(0, mappedAccumulatedPause));
    setLivePauseElapsed(0);
    setAutoPauseActive(false);
    setUserPaused(false);
    pauseStartedAtRef.current = null;
    setCurrentTime(mappedAudioTime);
    if (audioRef.current) {
      audioRef.current.currentTime = mappedAudioTime;
    }
  };

  const playPreview = (voice: Exclude<VoiceOption, 'nenhuma'>) => {
    if (!previewAudioRef.current) return;
    Object.values(previewMixerRefs.current).forEach((previewAudio) => previewAudio.pause());
    if (previewingVoice === voice) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setPreviewingVoice(null);
      return;
    }
    const previewSrc =
      voice === 'feminino'
        ? (audio?.feminino || generatedSessionAudio.feminino)
        : (audio?.masculino || generatedSessionAudio.masculino || generatedSessionAudio.feminino);
    if (!previewSrc) return;

    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    previewAudioRef.current.pause();
    previewAudioRef.current.src = previewSrc;
    previewAudioRef.current.currentTime = 0;
    previewAudioRef.current.load();
    previewAudioRef.current.volume = Math.max(0, Math.min(1, voiceVolume / 100));
    setPreviewingAmbientId(null);
    setPreviewingVoice(voice);
    previewAudioRef.current.play().catch(() => {});
    previewTimeoutRef.current = window.setTimeout(() => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingVoice(null);
    }, 6000);
  };

  const playAmbientPreview = (soundId: string) => {
    if (!previewAudioRef.current) return;
    if (!backgroundMusicEnabled) return;
    Object.values(previewMixerRefs.current).forEach((previewAudio) => previewAudio.pause());
    if (previewingAmbientId === soundId) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setPreviewingAmbientId(null);
      return;
    }
    const sound = natureMixerTracks.find((item) => item.id === soundId);
    if (!sound) return;

    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    previewAudioRef.current.pause();
    previewAudioRef.current.src = encodeURI(sound.src);
    previewAudioRef.current.currentTime = 0;
    previewAudioRef.current.load();
    previewAudioRef.current.volume = Math.max(0, Math.min(1, musicVolume / 100));
    setPreviewingVoice(null);
    setPreviewingAmbientId(soundId);
    previewAudioRef.current.play().catch(() => {});
    previewTimeoutRef.current = window.setTimeout(() => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingAmbientId(null);
    }, 6000);
  };

  const playMixerPreview = () => {
    if (!backgroundMusicEnabled) return;
    if (previewingAmbientId === '__mixer__') {
      Object.values(previewMixerRefs.current).forEach((previewAudio) => {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      });
      previewMixerRefs.current = {};
      setPreviewingAmbientId(null);
      return;
    }

    playNamedMixPreview(activeAmbientSounds, '__mixer__');
  };

  const playNamedMixPreview = (mix: Record<string, number>, previewId: string) => {
    if (!backgroundMusicEnabled) return;
    if (previewingAmbientId === previewId) {
      Object.values(previewMixerRefs.current).forEach((previewAudio) => {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      });
      previewMixerRefs.current = {};
      setPreviewingAmbientId(null);
      return;
    }

    const selectedTracks = Object.entries(mix)
      .filter(([, volume]) => volume > 0)
      .map(([id, volume]) => {
        const track = natureMixerTracks.find((item) => item.id === id);
        return track ? { track, volume } : null;
      })
      .filter((item): item is { track: (typeof natureMixerTracks)[number]; volume: number } => item !== null);

    if (selectedTracks.length === 0) return;

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setPreviewingVoice(null);
    setPreviewingAmbientId(previewId);

    selectedTracks.forEach(({ track, volume }) => {
      const previewAudio = new Audio(encodeURI(track.src));
      previewAudio.loop = true;
      previewAudio.volume = (volume / 100) * Math.max(0, Math.min(1, musicVolume / 100));
      previewAudio.currentTime = 0;
      previewMixerRefs.current[track.id] = previewAudio;
      previewAudio.play().catch(() => {});
    });
  };

  useEffect(() => {
    if (previewingAmbientId !== '__mixer__') return;

    const selectedTracks = Object.entries(activeAmbientSounds)
      .filter(([, volume]) => volume > 0)
      .map(([id, volume]) => {
        const track = natureMixerTracks.find((item) => item.id === id);
        return track ? { track, volume } : null;
      })
      .filter((item): item is { track: (typeof natureMixerTracks)[number]; volume: number } => item !== null);

    Object.keys(previewMixerRefs.current).forEach((trackId) => {
      const stillSelected = selectedTracks.some(({ track }) => track.id === trackId);
      if (stillSelected) return;
      previewMixerRefs.current[trackId].pause();
      previewMixerRefs.current[trackId].currentTime = 0;
      delete previewMixerRefs.current[trackId];
    });

    selectedTracks.forEach(({ track, volume }) => {
      if (!previewMixerRefs.current[track.id]) {
        const previewAudio = new Audio(encodeURI(track.src));
        previewAudio.loop = true;
        previewAudio.volume = (volume / 100) * Math.max(0, Math.min(1, musicVolume / 100));
        previewMixerRefs.current[track.id] = previewAudio;
        previewAudio.play().catch(() => {});
        return;
      }

      previewMixerRefs.current[track.id].volume = (volume / 100) * Math.max(0, Math.min(1, musicVolume / 100));
      if (previewMixerRefs.current[track.id].paused) {
        previewMixerRefs.current[track.id].play().catch(() => {});
      }
    });

    if (selectedTracks.length === 0) {
      setPreviewingAmbientId(null);
    }
  }, [activeAmbientSounds, musicVolume, previewingAmbientId]);

  const voiceCards = [
    { id: 'feminino' as const, label: 'SERENA', desc: 'Mais acolhedora', emoji: '👩🏻' },
    { id: 'masculino' as const, label: 'SERENO', desc: 'Mais estável', emoji: '👨🏻' },
    { id: 'nenhuma' as const, label: 'SÓ TEXTO', desc: 'Sem narração', emoji: '🔇' },
  ];

  return (
    <div className={`min-h-screen animate-fade-in ${dm ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-slate-50 to-indigo-50 text-slate-900'}`}>
      <audio ref={previewAudioRef} />
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        preload="auto"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onError={() => {
          if (selectedVoice === 'nenhuma') return;
          setFailedStaticSessionAudio((prev) => ({ ...prev, [mainVoiceKey]: true }));
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (guidedNarration?.closingText && selectedVoice !== 'nenhuma') {
            playGuidanceClipWithFallback(guidedNarration.closingText, () => onComplete?.(), 'closing');
            return;
          }
          onComplete?.();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-1/2 w-full bg-gradient-to-b ${dm ? 'from-teal-950/40' : 'from-teal-100/50'} to-transparent opacity-70`} />
        <div className={`absolute -top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl ${dm ? 'bg-teal-500/10' : 'bg-teal-300/30'}`} />
      </div>

      <div className={`relative mx-auto min-h-screen w-full max-w-md border-x ${dm ? 'border-white/5 bg-slate-950/90' : 'border-slate-200/70 bg-white/90'} backdrop-blur-xl`}>
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-72 ${dm ? 'bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.14),transparent_62%)]' : 'bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_60%)]'}`} />
        <div className="p-5 pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={stopAll}
              aria-label="Voltar"
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95 ${dm ? 'border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'border border-slate-200 bg-white/80 text-gray-700 hover:bg-white'}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {idealDurationLabel ? (
              <div className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                {idealDurationLabel} · Guiada
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-start gap-3">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] text-2xl ${dm ? 'bg-white/6' : 'bg-indigo-50'}`}>
              {emoji}
            </div>
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Prática selecionada</p>
              <h2 className="mt-2 text-2xl font-[1000] tracking-tight">{title}</h2>
            </div>
          </div>
        </div>

        <div className="px-5 pb-52">
          <div className="flex flex-col items-center pt-2">
            <div className="mt-4 text-center">
              <p className={`text-sm font-semibold ${dm ? 'text-slate-300/80' : 'text-slate-600'}`}>
                {selectedVoice === 'nenhuma'
                  ? 'Leitura contemplativa, sem narração.'
                  : isPlaying
                    ? 'Deixe a prática seguir no seu ritmo.'
                    : 'Entre na prática com mais calma e presença.'}
              </p>
            </div>

            {preStartGuidance && (
              <div className="mt-8 w-full space-y-3">
                <button
                  onClick={() => setShowPreparationIntro((prev) => !prev)}
                  className={`w-full rounded-[1.7rem] border px-4 py-4 text-left transition-all active:scale-[0.99] ${dm ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/90 shadow-sm'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-teal-300/70' : 'text-teal-700/60'}`}>Antes de começar</p>
                      <p className={`mt-1 text-sm font-extrabold ${dm ? 'text-slate-100' : 'text-slate-800'}`}>{preStartGuidance.greeting}</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform ${showPreparationIntro ? 'rotate-180' : ''} ${dm ? 'bg-white/[0.05] text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                  {showPreparationIntro && (
                    <div className="mt-4">
                      <p className={`text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{preStartGuidance.intro}</p>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setShowPreparationPosture((prev) => !prev)}
                  className={`w-full rounded-[1.7rem] border px-4 py-4 text-left transition-all active:scale-[0.99] ${dm ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/90 shadow-sm'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-teal-300/70' : 'text-teal-700/60'}`}>Como se preparar</p>
                      <p className={`mt-1 text-sm font-extrabold ${dm ? 'text-slate-100' : 'text-slate-800'}`}>Postura, presença e ajuste inicial</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform ${showPreparationPosture ? 'rotate-180' : ''} ${dm ? 'bg-white/[0.05] text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                  {showPreparationPosture && (
                    <div className="mt-4 space-y-2.5">
                      {preStartGuidance.items.map((item) => (
                        <div key={item} className={`flex items-start gap-3 rounded-[1.2rem] px-3.5 py-3 text-sm font-semibold leading-relaxed ${dm ? 'bg-white/[0.03] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                          <span className={`mt-0.5 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-teal-300' : 'text-teal-700'}`}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                      {preStartGuidance.footnote && (
                        <p className={`pt-1 text-xs font-semibold leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{preStartGuidance.footnote}</p>
                      )}
                    </div>
                  )}
                </button>
              </div>
            )}

            <div className={`mt-8 rounded-[1.8rem] border px-4 py-4 ${dm ? 'border-indigo-900/25 bg-indigo-950/20' : 'border-indigo-100 bg-indigo-50/70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-indigo-200/80' : 'text-indigo-700/70'}`}>Leitura da prática</p>
                  <p className={`mt-1 text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Acompanhe a narração em partes ou abra o texto completo quando quiser.</p>
                </div>
              </div>
              <div className={`mt-4 overflow-hidden rounded-[1.5rem] border ${dm ? 'border-indigo-400/15 bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(15,23,42,0.18))]' : 'border-indigo-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(224,231,255,0.8))]'}`}>
                <div className={`h-1.5 w-full ${dm ? 'bg-white/5' : 'bg-indigo-100'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${dm ? 'bg-[linear-gradient(90deg,#60a5fa_0%,#818cf8_55%,#c084fc_100%)]' : 'bg-[linear-gradient(90deg,#38bdf8_0%,#6366f1_55%,#a855f7_100%)]'}`}
                    style={{
                      width: `${Math.max(8, Math.min(100, sessionSubtitleChunks.length > 0 && activeSubtitleIndex >= 0 ? ((activeSubtitleIndex + 1) / sessionSubtitleChunks.length) * 100 : 8))}%`,
                    }}
                  />
                </div>
              <div className="flex min-h-[116px] flex-col justify-center px-4 py-4 text-center">
                {activeSubtitle ? (
                  <>
                    <div className={`min-h-[56px] rounded-[1rem] px-3 py-2 text-lg leading-relaxed transition-all ${dm ? 'bg-indigo-500/14 text-white border border-indigo-400/18' : 'bg-white text-indigo-900 border border-indigo-200 shadow-sm'}`}>
                      <p className="font-semibold tracking-tight animate-fade-in">{activeSubtitle.text}</p>
                    </div>
                    {nextSubtitle && (
                      <div className={`mt-3 min-h-[42px] rounded-[1rem] px-3 py-2 text-sm leading-relaxed transition-all ${dm ? 'text-slate-400/70' : 'text-slate-400'}`}>
                        {nextSubtitle.text}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`min-h-[56px] rounded-[1rem] px-3 py-2 text-sm leading-relaxed transition-all ${dm ? 'bg-white/[0.03] text-slate-400/70' : 'bg-white/80 text-slate-400 border border-white/70'}`}>
                    {selectedVoice === 'nenhuma'
                      ? 'Modo leitura ativado.'
                      : 'A prática guiada aparecerá aqui.'}
                  </div>
                )}
              </div>
              </div>
              <button
                onClick={() => setShowFullText((prev) => !prev)}
                className={`mt-3 flex w-full items-center justify-between rounded-[1.2rem] px-3.5 py-3 text-left text-sm font-semibold transition-all ${dm ? 'bg-white/[0.04] text-slate-200 border border-white/8' : 'bg-white/85 text-slate-700 border border-white shadow-sm'}`}
              >
                <span>Texto completo da prática</span>
                <span className={`text-base transition-transform ${showFullText ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {showFullText && (
                <div className="mt-3 space-y-2.5">
                  {transcriptParagraphs.map((paragraph, index) => {
                    const isActiveSentence = activeSubtitle?.text === paragraph;
                    return (
                      <div
                        key={`${index}-${paragraph.slice(0, 12)}`}
                        className={`rounded-[1.2rem] px-3.5 py-3 text-sm leading-relaxed transition-all ${
                          isActiveSentence
                            ? dm
                              ? 'bg-indigo-500/18 text-white border border-indigo-400/25 shadow-[0_0_0_1px_rgba(129,140,248,0.12)]'
                              : 'bg-white text-indigo-900 border border-indigo-200 shadow-sm'
                            : dm
                              ? 'bg-white/[0.03] text-slate-300'
                              : 'bg-white/80 text-slate-700 border border-white/70'
                        }`}
                      >
                        <span className={isActiveSentence ? 'font-semibold' : ''}>{paragraph}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`mt-6 w-full rounded-[2rem] border px-4 py-4 ${dm ? 'border-indigo-900/25 bg-indigo-950/18' : 'border-indigo-100 bg-indigo-50/70'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className={`text-[10px] uppercase font-black tracking-[0.16em] block ${dm ? 'text-indigo-200' : 'text-indigo-700'}`}>Ambiente Sonoro</span>
                    <p className={`mt-1 text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                      Escolha um ambiente antes de começar e o mix já toca aqui mesmo.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (hasActiveMix) {
                        setActiveAmbientSounds({});
                      } else {
                        setShowAmbientControls((prev) => !prev);
                      }
                    }}
                    className={`rounded-2xl px-4 py-2 text-xs font-black transition-all ${
                      hasActiveMix
                        ? 'bg-rose-500 text-white'
                        : showAmbientControls
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : dm
                            ? 'bg-[linear-gradient(135deg,rgba(34,197,94,0.98),rgba(5,150,105,0.94))] text-white border border-emerald-300/25 shadow-[0_0_28px_rgba(34,197,94,0.38)] animate-[pulse-soft_2.2s_ease-in-out_infinite]'
                            : 'bg-[linear-gradient(135deg,#22c55e_0%,#059669_100%)] text-white shadow-[0_0_24px_rgba(34,197,94,0.28)] animate-[pulse-soft_2.2s_ease-in-out_infinite]'
                    }`}
                  >
                    {hasActiveMix ? 'Parar ambiente' : showAmbientControls ? 'Fechar' : 'Escolher'}
                  </button>
                </div>

                {showAmbientControls && (
                <div className={`mt-4 rounded-[1.8rem] border p-4 ${dm ? 'border-indigo-400/15 bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(15,23,42,0.12))]' : 'border-indigo-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(224,231,255,0.8))]'}`}>
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-indigo-200/80' : 'text-indigo-700/70'}`}>Ambiente Sonoro</p>
                    <p className={`mt-1 text-xs ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Escolha um clima para acompanhar a prática.</p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {quickAmbientTracks.map((sound) => {
                        const active =
                          Object.keys(sound.mix).every((id) => activeAmbientSounds[id] === sound.mix[id]) &&
                          Object.keys(activeAmbientSounds).length === Object.keys(sound.mix).length;
                        return (
                          <button
                            key={sound.id}
                            onClick={() => {
                              if (active) {
                                setActiveAmbientSounds({});
                                return;
                              }
                              setActiveAmbientSounds(sound.mix);
                            }}
                            className={`rounded-[1.4rem] border px-3 py-3 text-left transition-all active:scale-[0.98] ${active
                              ? (dm ? 'border-indigo-400 bg-indigo-500/14 text-indigo-100 shadow-[0_0_0_1px_rgba(129,140,248,0.18)]' : 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm')
                              : (dm ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-white text-slate-700')
                            }`}
                          >
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                playNamedMixPreview(sound.mix, sound.id);
                              }}
                              aria-label={`Ouvir previa do ambiente ${sound.name}`}
                              className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-95 ${dm ? 'bg-slate-900/70 text-slate-200 border border-white/10' : 'bg-white/90 text-slate-600 border border-slate-200 shadow-sm'}`}
                            >
                              {previewingAmbientId === sound.id ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <rect x="7" y="7" width="10" height="10" rx="1.5" />
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>
                            <div className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${active ? (dm ? 'bg-white/10 text-indigo-100' : 'bg-white/80 text-indigo-700') : 'hidden'}`}>
                              Ativo
                            </div>
                            <div className="text-2xl">{sound.emoji}</div>
                            <div className="mt-3 text-[11px] font-black uppercase tracking-[0.12em]">{sound.name}</div>
                            <div className={`mt-1 text-[11px] ${active ? (dm ? 'text-indigo-100/80' : 'text-indigo-700/75') : (dm ? 'text-slate-300/80' : 'text-slate-500')}`}>
                              {active ? 'Tocando junto da sessão.' : `${Object.keys(sound.mix).filter((key) => sound.mix[key] > 0).length} sons combinados`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {favoriteAmbientMixes.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {favoriteAmbientMixes.map((mix) => {
                          const active = Object.keys(mix.mix).every((id) => activeAmbientSounds[id] === mix.mix[id]) && Object.keys(activeAmbientSounds).length === Object.keys(mix.mix).length;
                          return (
                            <button
                              key={mix.id}
                              onClick={() => setActiveAmbientSounds(mix.mix)}
                              className={`rounded-[1.4rem] border px-3 py-3 text-left transition-all active:scale-[0.98] ${active
                                ? (dm ? 'border-indigo-400 bg-indigo-500/14 text-indigo-100 shadow-[0_0_0_1px_rgba(129,140,248,0.18)]' : 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm')
                                : (dm ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-white text-slate-700')
                              }`}
                            >
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  playNamedMixPreview(mix.mix, mix.id);
                                }}
                                aria-label={`Ouvir previa do mix ${mix.name}`}
                                className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-95 ${dm ? 'bg-slate-900/70 text-slate-200 border border-white/10' : 'bg-white/90 text-slate-600 border border-slate-200 shadow-sm'}`}
                              >
                                {previewingAmbientId === mix.id ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="7" y="7" width="10" height="10" rx="1.5" />
                                  </svg>
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                              </button>
                              <div className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${active ? (dm ? 'bg-white/10 text-indigo-100' : 'bg-white/80 text-indigo-700') : 'hidden'}`}>
                                Ativo
                              </div>
                              <div className="text-2xl">{mix.emoji}</div>
                              <div className="mt-3 text-[11px] font-black uppercase tracking-[0.12em]">{mix.name}</div>
                              <div className={`mt-1 text-[11px] ${active ? (dm ? 'text-indigo-100/80' : 'text-indigo-700/75') : (dm ? 'text-slate-300/80' : 'text-slate-500')}`}>
                                {mix.subtitle}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>

            <div className="mt-6 mb-20 w-full space-y-4">
              <div className={`rounded-[1.5rem] border px-4 py-3 ${dm ? 'border-white/8 bg-white/[0.03]' : 'border-slate-100 bg-slate-50/80'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>
                      {sessionStageLabel}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                      {sessionStageDescription}
                    </p>
                  </div>
                  <div className={`rounded-2xl px-4 py-2 text-lg font-[1000] tabular-nums ${dm ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/15' : 'bg-white text-indigo-700 border border-indigo-100 shadow-sm'}`}>
                    {formatTime(remainingTime)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={preparationActive ? cancelPreparation : (practiceActive ? resetSession : togglePlay)}
                  aria-label={
                    preparationActive
                      ? 'Parar preparação'
                      : practiceActive
                        ? 'Parar prática'
                        : hasStartedSession
                          ? 'Continuar'
                          : 'Reproduzir'
                  }
                  className={`w-full py-5 rounded-[2.5rem] text-lg font-black shadow-xl transition-all active:scale-95 ${mainButtonTone}`}
                >
                  {mainButtonLabel}
                </button>

                {preparationActive ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={toggleGuidancePause}
                      className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                        dm ? 'bg-slate-900/80 text-slate-300 border border-slate-700/80 hover:bg-slate-800' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 shadow-sm'
                      }`}
                    >
                      {guidancePaused ? 'Retomar preparação' : 'Pausar preparação'}
                    </button>
                    <button
                      onClick={skipPreparation}
                      className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                        dm ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 shadow-sm'
                      }`}
                    >
                      Pular preparação
                    </button>
                  </div>
                ) : (
                  practiceActive ? (
                    <button
                      onClick={togglePlay}
                      className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                        dm ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20 hover:bg-cyan-500/20' : 'bg-cyan-50 text-cyan-900 border border-cyan-100 hover:bg-cyan-100 shadow-sm'
                      }`}
                    >
                      {userPaused ? 'Retomar prática' : 'Pausar prática'}
                    </button>
                  ) : (
                    <button
                      onClick={() => startSessionPlayback(true)}
                      className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                        dm ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 shadow-sm'
                      }`}
                    >
                      Pular preparação
                    </button>
                  )
                )}
              </div>

              <div className={`p-4 rounded-[2rem] ${dm ? 'bg-slate-900/50' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border border-slate-200/80'}`}>
                <div className="space-y-2 text-center">
                  <span className="text-[10px] uppercase font-black tracking-[0.16em] opacity-50 block">Áudio Guia</span>
                  <button
                    onClick={() => {
                      const nextVoice = selectedVoice === 'nenhuma' ? lastAudibleVoiceRef.current : 'nenhuma';
                      setSelectedVoice(nextVoice);
                      onVoiceChange?.(nextVoice);
                    }}
                    className={`w-full py-3 rounded-2xl font-bold text-xs transition-all ${selectedVoice !== 'nenhuma' ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-400 border border-slate-200')}`}
                  >
                    {selectedVoice !== 'nenhuma' ? '🔊 Ativado' : '🔇 Desativado'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
