'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppPersistence } from '@/hooks/useAppPersistence';
import dynamic from 'next/dynamic';
import { cancelBrowserSpeech, speakBrowserText } from '@/lib/browserSpeech';
import ExploracaoVocacionalSection from '@/components/ExploracaoVocacionalSection';
import FiveFingersMethodSection from '@/components/FiveFingersMethodSection';
import EmotionalMindMapSection from '@/components/EmotionalMindMapSection';
import HealthySelfMessages from '@/components/HealthySelfMessages';
import ThematicTracksSection from '@/components/ThematicTracksSection';
import EmotionalIntelligenceSection from '@/components/EmotionalIntelligenceSection';
import PsychoeducationSection from '@/components/PsychoeducationSection';
import ToxicThoughtsSection from '@/components/ToxicThoughtsSection';
import EmotionalDictionarySection from '@/components/EmotionalDictionarySection';
import AppNoticeModal from '@/components/AppNoticeModal';
import CoupleModeSection from '@/components/CoupleModeSection';
import FamilyModeSection from '@/components/FamilyModeSection';
import InviteFriendSection from '@/components/InviteFriendSection';
import PreventiveIntervention from '@/components/PreventiveIntervention';
import { ambientSounds } from '@/components/AmbientPlayer';
import type { Sound } from '@/components/AmbientPlayer';
import { parseSRT, Subtitle } from '@/lib/srtParser';
import RecommendAppModal from '@/components/RecommendAppModal';
import type { ProfileScore } from '@/components/RegulationProfileSection';
import { getPlanDefinition } from '@/lib/subscriptionPlans';
import type { BillingPlanKey } from '@/lib/subscriptionPlans';
import { buildAdminPreparedAccount, getConfiguredAdminEmails, hasAdminAccess } from '@/lib/adminAccess';
import { formatRemainingTime } from '@/lib/lifetimeOffer';
import { loadAmbientFavoriteMixOptions, loadNatureMixPresets, natureMixerTracks, type NatureMixPreset } from '@/components/NatureMixerSection';
import { meditationDocRoutines, meditationDocRoutineById } from '@/data/meditationDocRoutines';
import { buildRoutineStaticAudioAssets } from '@/lib/guidedNarrationAssets';
import { meditationComplementaryDocRoutines, meditationComplementaryDocRoutineById } from '@/data/meditationComplementaryDocRoutines';
import { breathingDocRoutineById } from '@/data/breathingDocRoutines';
import SectionHeroCard from '@/components/SectionHeroCard';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getPublicVapidKey } from '@/lib/vapidConfig';
import {
  hydrateAccountBuckets,
  syncAccountBucketByKey,
} from '@/lib/accountBucketSync';
import {
  loadStructuredContent,
  saveDiaryEntries,
  saveGratitudeEntries,
  saveGratitudePhotos,
  saveMoodHistory,
  saveSoltaEntries,
  saveThoughtRecords,
} from '@/lib/accountStructuredSync';
import {
  applyCloudPreferences,
  getLocalPreferenceSnapshot,
  installStorageSyncBridge,
  loadCloudPreferences,
  removeCloudPreference,
  shouldSyncPreferenceKey,
  STORAGE_SYNC_EVENT,
  upsertCloudPreference,
} from '@/lib/cloudPreferenceSync';

const AmbientPlayer = dynamic(() => import('@/components/AmbientPlayer'), { ssr: false });
const AudioSettingsTabs = dynamic(() => import('@/components/AudioSettingsTabs'), { ssr: false });
const LoginScreen = dynamic(() => import('@/components/LoginScreen'), { ssr: false });
const SoltaAquiSection = dynamic(() => import('@/components/SoltaAquiSection'), { ssr: false });
const GratitudeSection = dynamic(() => import('@/components/GratitudeSection'), { ssr: false });
const FreeTimerSection = dynamic(() => import('@/components/FreeTimerSection'), { ssr: false });
const ProfileSection = dynamic(() => import('@/components/ProfileSection'), { ssr: false });
const UnifiedDiarySection = dynamic(() => import('@/components/UnifiedDiarySection'), { ssr: false });
const AssertivenessSection = dynamic(() => import('@/components/AssertivenessSection'), { ssr: false });
const MoodSection = dynamic(() => import('@/components/MoodSection'), { ssr: false });
const StatsSection = dynamic(() => import('@/components/StatsSection'), { ssr: false });
const YogaNidraDocSection = dynamic(() => import('@/components/YogaNidraDocSection'), { ssr: false });
const HooponoponoSection = dynamic(() => import('@/components/HooponoponoSection'), { ssr: false });
const LoveLanguagesSection = dynamic(() => import('@/components/LoveLanguagesSection'), { ssr: false });
const TherapyCalendarSection = dynamic(() => import('@/components/TherapyCalendarSection'), { ssr: false });
const AbordagensSection = dynamic(() => import('@/components/AbordagensSection'), { ssr: false });
const SuggestionsSection = dynamic(() => import('@/components/SuggestionsSection'), { ssr: false });
const DailyHabitsSection = dynamic(() => import('@/components/DailyHabitsSection'), { ssr: false });
const NatureMixerSection = dynamic(() => import('@/components/NatureMixerSection'), { ssr: false });
const MuralEsperancaSection = dynamic(() => import('@/components/MuralEsperancaSection'), { ssr: false });
const CartaTerapeuticaSection = dynamic(() => import('@/components/CartaTerapeuticaSection'), { ssr: false });
const SleepModeSection = dynamic(() => import('@/components/SleepModeSection'), { ssr: false });
const ModernAudioPlayer = dynamic(() => import('@/components/ModernAudioPlayer'), { ssr: false });
const MicroTasksSection = dynamic(() => import('@/components/MicroTasksSection'), { ssr: false });
const TimeCapsuleSection = dynamic(() => import('@/components/TimeCapsuleSection'), { ssr: false });
const WeeklyMissionsSection = dynamic(() => import('@/components/WeeklyMissionsSection'), { ssr: false });
const ArtEmotionSection = dynamic(() => import('@/components/ArtEmotionSection'), { ssr: false });
const RegulationProfileSection = dynamic(() => import('@/components/RegulationProfileSection'), { ssr: false });
const SelfSabotageSection = dynamic(() => import('@/components/SelfSabotageSection'), { ssr: false });
const LifeWheelSection = dynamic(() => import('@/components/LifeWheelSection'), { ssr: false });

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const getBrazilDateKey = (value: number | Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(typeof value === 'number' ? new Date(value) : value);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';
  return `${year}-${month}-${day}`;
};
const getBrazilHour = (value: number | Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(typeof value === 'number' ? new Date(value) : value);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  return Number(hour);
};

const MICROTASKS_STORAGE_KEYS = {
  tasks: 'sereno_micro_tasks_v3',
  date: 'sereno_micro_tasks_date_v3',
  difficultDay: 'sereno_difficult_day_v2',
  emotionalState: 'sereno_micro_tasks_state_v1',
  customFeeling: 'sereno_micro_tasks_custom_feeling_v1',
} as const;

const MICROTASKS_STATE_LABELS: Record<string, string> = {
  travado: 'travamento',
  ansioso: 'ansiedade',
  sem_energia: 'pouca energia',
  sobrecarregado: 'sobrecarga',
  sensivel: 'sensibilidade',
  triste: 'tristeza',
  irritado: 'irritação',
  confuso: 'confusão',
  inseguro: 'insegurança',
};

function getMicrotasksReminderContext() {
  if (typeof window === 'undefined') {
    return {
      title: 'Microação de hoje',
      body: 'Abra as microtarefas e escolha um passo simples para destravar o momento.',
      actionParams: { source: 'microtasks-reminder' },
    };
  }

  try {
    const rawTasks = window.localStorage.getItem(MICROTASKS_STORAGE_KEYS.tasks);
    const rawDate = window.localStorage.getItem(MICROTASKS_STORAGE_KEYS.date);
    const rawDifficultDay = window.localStorage.getItem(MICROTASKS_STORAGE_KEYS.difficultDay);
    const rawSelectedStates = window.localStorage.getItem(MICROTASKS_STORAGE_KEYS.emotionalState);
    const rawCustomFeeling = window.localStorage.getItem(MICROTASKS_STORAGE_KEYS.customFeeling);

    const tasks = rawTasks ? JSON.parse(rawTasks) : [];
    const savedDate = rawDate || '';
    const isToday = savedDate === getBrazilDateKey(new Date());
    const isDifficultDay = rawDifficultDay ? JSON.parse(rawDifficultDay) === true : false;
    const parsedStates = rawSelectedStates ? JSON.parse(rawSelectedStates) : [];
    const selectedStates = Array.isArray(parsedStates)
      ? parsedStates.filter((value) => typeof value === 'string')
      : typeof parsedStates === 'string'
        ? [parsedStates]
        : [];
    const customFeeling = typeof rawCustomFeeling === 'string' ? rawCustomFeeling.trim() : '';
    const pendingTasks = Array.isArray(tasks)
      ? tasks.filter((task) => task && typeof task === 'object' && task.completed !== true)
      : [];
    const nextTask = isToday ? pendingTasks[0] : null;
    const stateLabels = selectedStates
      .map((state) => MICROTASKS_STATE_LABELS[state] || state)
      .filter(Boolean);
    const stateSummary = stateLabels.slice(0, 2).join(' e ');

    if (isDifficultDay) {
      return {
        title: 'Modo Dia Difícil',
        body: nextTask?.text
          ? `Hoje vale o essencial: ${nextTask.text}. Faça só esse passo primeiro.`
          : 'Hoje vale o mínimo viável. Abra o Modo Dia Difícil e escolha só uma microação.',
        actionParams: { source: 'microtasks-reminder', difficultDay: true, focus: 'difficult-day' },
      };
    }

    if (nextTask?.text) {
      if (customFeeling) {
        return {
          title: 'Microação para este momento',
          body: `Para o que você descreveu como "${customFeeling}", comece por: ${nextTask.text}.`,
          actionParams: { source: 'microtasks-reminder', focus: 'resume-task', taskText: nextTask.text },
        };
      }

      if (stateSummary) {
        return {
          title: `Microação para ${stateSummary}`,
          body: `Seu próximo passo pode ser simples: ${nextTask.text}.`,
          actionParams: { source: 'microtasks-reminder', focus: 'resume-task', taskText: nextTask.text },
        };
      }

      return {
        title: 'Retome sua microação',
        body: `Você pode continuar por aqui: ${nextTask.text}.`,
        actionParams: { source: 'microtasks-reminder', focus: 'resume-task', taskText: nextTask.text },
      };
    }

    return {
      title: 'Microação de hoje',
      body: 'Abra as microtarefas e escolha um passo simples para destravar o momento.',
      actionParams: { source: 'microtasks-reminder' },
    };
  } catch {
    return {
      title: 'Microação de hoje',
      body: 'Abra as microtarefas e escolha um passo simples para destravar o momento.',
      actionParams: { source: 'microtasks-reminder' },
    };
  }
}

const ChatSection = ({
  darkMode: dm,
  moodHistory = [],
  diaryEntries = [],
  thoughtRecords = [],
  gratitudeEntries = [],
  soltaEntries = [],
  userProgress,
  userName = '',
  onNavigate,
  defaultVoice = 'masculino',
  audioSettings,
  onCheckAccess,
  onIncrementUsage,
  hasUnlimitedAccess = false,
  dailyChatUsage = 0,
  chatWindowCount = 0,
  chatCooldownUntil = null,
  onShowPlans,
}: any) => {
  const readJsonStorage = (key: string, fallback: any) => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const [input, setInput] = useState('');
  const [messages, setMessages] = useAppPersistence<any[]>('sereno-chat-history', []);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useAppPersistence<boolean>('sereno-chat-voice-enabled', false);
  const [loading, setLoading] = useState(false);
  const [promptSeed, setPromptSeed] = useState(() => Date.now());
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [confirmClearChat, setConfirmClearChat] = useState(false);
  const [chatResetCountdownMs, setChatResetCountdownMs] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current.src = '';
        chatAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (hasUnlimitedAccess) {
      setChatResetCountdownMs(0);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const resetAt = Number(chatCooldownUntil || 0);
      if (!resetAt || resetAt <= now.getTime()) {
        setChatResetCountdownMs(0);
        return;
      }
      setChatResetCountdownMs(Math.max(0, resetAt - now.getTime()));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [chatCooldownUntil, hasUnlimitedAccess]);

  const todayKey = new Date().toISOString().split('T')[0];
  const localDailyChatUsage = useMemo(
    () =>
      messages.filter((message) => {
        if (message?.role !== 'user') return false;
        if (!message?.createdAt) return false;
        return String(message.createdAt).startsWith(todayKey);
      }).length,
    [messages, todayKey],
  );
  const rawDailyChatUsage = Math.max(Number(dailyChatUsage || 0), localDailyChatUsage);
  const freeChatLocked = !hasUnlimitedAccess && chatResetCountdownMs > 0;
  const effectiveDailyChatUsage = hasUnlimitedAccess
    ? rawDailyChatUsage
    : Math.min(5, freeChatLocked ? Number(chatWindowCount || 5) : Number(chatWindowCount || 0));
  const chatResetLabel = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor(chatResetCountdownMs / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, [chatResetCountdownMs]);

  const latestMood = Array.isArray(moodHistory) ? moodHistory[0] : null;
  const latestDiary = Array.isArray(diaryEntries) ? diaryEntries[0] : null;
  const latestThought = Array.isArray(thoughtRecords) ? thoughtRecords[0] : null;
  const latestGratitude = Array.isArray(gratitudeEntries) ? gratitudeEntries[0] : null;
  const latestSolta = Array.isArray(soltaEntries) ? soltaEntries[0] : null;
  const healthySelfMessages = readJsonStorage('psico_healthy_self', readJsonStorage('healthy-self-messages-v1', []));
  const recentMoodSample = Array.isArray(moodHistory) ? moodHistory.slice(0, 5) : [];
  const preventiveAlert = useMemo(() => {
    if (recentMoodSample.length < 3) return null;
    const avgIntensity = recentMoodSample.reduce((sum: number, entry: any) => sum + Number(entry?.intensity || 3), 0) / recentMoodSample.length;
    const negativeEmotions = recentMoodSample.filter((entry: any) =>
      ['triste', 'ansioso', 'estressado', 'irritado', 'sobrecarregado'].includes(String(entry?.primaryEmotion || '').toLowerCase()),
    ).length;
    if (avgIntensity >= 3.5 && negativeEmotions >= 2) {
      return {
        avgIntensity: Number(avgIntensity.toFixed(1)),
        negativeEmotions,
        suggestedActions: ['Respiração 4-7-8', 'Grounding 5-4-3-2-1', 'Contato com alguém de confiança', 'Música calmante'],
      };
    }
    return null;
  }, [recentMoodSample]);
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 20 || currentHour < 6;
  const isMorning = currentHour >= 5 && currentHour < 12;

  const resourcePromptPool = useMemo(() => {
    const mood = String(latestMood?.primaryEmotion || latestMood?.mood || '').toLowerCase();
    const intensity = Number(latestMood?.intensity || latestMood?.anxiety || 0);
    const prompts = [
      { text: 'Quero fazer uma respiração guiada para desacelerar agora', score: 4 + (mood.includes('ans') ? 4 : 0) + (intensity >= 4 ? 2 : 0) },
      { text: 'Me sugira uma meditação curta para este momento', score: 4 + (isNight ? 2 : 0) },
      { text: 'Quero usar a técnica de aterramento 5-4-3-2-1', score: 3 + (mood.includes('ans') ? 3 : 0) },
      { text: 'Me guia na A.C.A.L.M.E.-S.E. para baixar a ansiedade', score: 3 + (mood.includes('ans') ? 4 : 0) },
      { text: 'Quero desabafar e depois receber uma atividade do app', score: 4 + (soltaEntries.length === 0 ? 2 : 0) },
      { text: 'Me ajuda a organizar o que estou sentindo no Diário', score: 4 + (diaryEntries.length === 0 ? 2 : 0) },
      { text: 'Quero registrar meu humor e entender o que fazer depois', score: 3 + (!latestMood ? 4 : 0) },
      { text: 'Me sugira uma prática de sono ou relaxamento para agora', score: 3 + (isNight ? 5 : 0) },
      { text: 'Quero uma prática curta de gratidão para mudar o clima do dia', score: 2 + (mood.includes('trist') ? 3 : 0) },
      { text: 'Me indique um exercício do app para clarear meus pensamentos', score: 3 + (thoughtRecords.length > 0 ? 2 : 0) },
      { text: 'Quero uma micro-tarefa para voltar ao eixo hoje', score: 2 + ((userProgress?.streak || 0) < 3 ? 3 : 0) },
      { text: 'Me sugira um hábito simples para eu retomar meu ritmo', score: 2 + ((userProgress?.streak || 0) < 3 ? 3 : 0) },
      { text: 'Quero uma missão curta do app para cuidar de mim hoje', score: 2 + ((userProgress?.streak || 0) < 3 ? 2 : 0) },
      { text: 'Me indique uma prática de Ho’oponopono para aliviar o coração', score: 2 + (mood.includes('culp') ? 3 : 0) },
      { text: 'Quero uma prática de assertividade para me posicionar melhor', score: 2 },
      { text: 'Me sugira algo de psicoeducação para entender o que estou vivendo', score: 2 },
      { text: 'Quero uma atividade de inteligência emocional para hoje', score: 2 },
      { text: 'Me mostre uma prática de regulação para o meu estado atual', score: 2 },
      { text: 'Quero usar o modo arte para expressar o que estou sentindo', score: 2 + (mood.includes('trist') ? 2 : 0) },
      { text: 'Me sugira uma cápsula do tempo ou outro recurso reflexivo', score: 1 },
      { text: 'Quero uma prática de 5 dedos para me recentrar', score: 1 + (mood.includes('ans') ? 2 : 0) },
      { text: 'Me indique um timer ou som ambiente para focar melhor', score: 1 + (isMorning ? 2 : 0) },
      { text: 'Quero uma sugestão personalizada com base no que já usei no app', score: 5 },
    ];

    return prompts.sort((a, b) => b.score - a.score);
  }, [diaryEntries.length, isMorning, isNight, latestMood, moodHistory.length, soltaEntries.length, thoughtRecords.length, userProgress?.streak]);

  const quickPrompts = useMemo(() => {
    const offset = promptSeed % Math.max(resourcePromptPool.length, 1);
    const ordered = [...resourcePromptPool.slice(offset), ...resourcePromptPool.slice(0, offset)];
    return ordered
      .filter((item, index, array) => array.findIndex((entry) => entry.text === item.text) === index)
      .slice(0, 3)
      .map((item) => item.text);
  }, [promptSeed, resourcePromptPool]);

  useEffect(() => {
    setActivePromptIndex(0);
  }, [quickPrompts]);

  const userContext = useMemo(() => ({
    userName: userName || null,
    todayMood: latestMood
      ? {
          primaryEmotion: latestMood.primaryEmotion || latestMood.mood || null,
          mood: latestMood.mood || latestMood.primaryEmotion || null,
          intensity: latestMood.intensity || latestMood.anxiety || 0,
          date: latestMood.date || null,
        }
      : null,
    recentMoods: Array.isArray(moodHistory)
      ? moodHistory.slice(0, 5).map((item: any) => ({
          date: item.date || null,
          primaryEmotion: item.primaryEmotion || item.mood || null,
          mood: item.mood || item.primaryEmotion || null,
        }))
      : [],
    progress: {
      streak: userProgress?.streak || 0,
      totalMinutes: userProgress?.totalMinutes || 0,
      meditationsCompleted: userProgress?.meditationsCompleted || 0,
      breathingCompleted: userProgress?.breathingCompleted || 0,
      yogaCompleted: userProgress?.yogaCompleted || 0,
    },
    recentDiary: Array.isArray(diaryEntries)
      ? diaryEntries.slice(0, 3).map((item: any) => ({
          emotion: item.emotion || item.primaryEmotion || 'Sem emoção definida',
          level: item.level || item.intensity || 0,
          situation: item.situation || item.text || item.content || '',
        }))
      : [],
    recentThoughts: Array.isArray(thoughtRecords)
      ? thoughtRecords.slice(0, 3).map((item: any) => ({
          automaticThought: item.automaticThought || item.thought || '',
          alternativeThought: item.alternativeThought || item.reframedThought || '',
        }))
      : [],
    recentGratitude: Array.isArray(gratitudeEntries)
      ? gratitudeEntries.slice(0, 2).map((item: any) => ({
          items: Array.isArray(item.items) ? item.items : [],
        }))
      : [],
    recentSolta: Array.isArray(soltaEntries)
      ? soltaEntries.slice(0, 3).map((item: any) => ({
          text: item.text || item.content || '',
        }))
      : [],
    habits: {
      reqs: readJsonStorage('sereno-daily-habits-reqs', []),
      history: readJsonStorage('sereno-daily-habits-history', {}),
      streak: Number(typeof window !== 'undefined' ? window.localStorage.getItem('sereno-daily-habits-streak') || '0' : '0'),
    },
    regulationProfile: readJsonStorage('regulation-profile-v1', null),
    healthySelfMessages,
    safetyPlan: readJsonStorage('safety-plan-v1', null),
    preventiveIntervention: preventiveAlert,
    appIntent: 'apoio conversacional breve, organização emocional e sugestão personalizada de recursos do app sem conduzir terapia',
  }), [diaryEntries, gratitudeEntries, healthySelfMessages, latestMood, moodHistory, preventiveAlert, soltaEntries, thoughtRecords, userName, userProgress]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (freeChatLocked || (!hasUnlimitedAccess && effectiveDailyChatUsage >= 5)) {
      const blockedMessage =
        'Seu limite de 5 mensagens no plano gratuito foi alcançado. O chat será liberado novamente em 24 horas, ou você pode desbloquear o Pro para conversar sem limites.';
      const blockedAssistantMsg = {
        role: 'assistant',
        content: blockedMessage,
        createdAt: new Date().toISOString(),
        upgradePrompt: true,
      };
      setMessages((prev) => [...prev, blockedAssistantMsg]);
      setInput('');
      setPromptSeed(Date.now());
      if (voiceRepliesEnabled) {
        window.setTimeout(() => {
          playAssistantMessage(blockedMessage, messages.length);
        }, 120);
      }
      return;
    }
    if (!onCheckAccess?.('ai_chat')) return;

    const userMsg = { role: 'user', content: input, createdAt: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    onIncrementUsage?.('aiChat');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10),
          userContext,
          mode: 'sereno_support',
        }),
      });

      const data = await res.json();
      if (data.response) {
        const assistantIndex = newMessages.length;
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.response,
            activity: data.activity || null,
            createdAt: new Date().toISOString(),
          },
        ]);
        setPromptSeed(Date.now());
        if (voiceRepliesEnabled) {
          window.setTimeout(() => {
            playAssistantMessage(data.response, assistantIndex);
          }, 120);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendQuickPrompt = (prompt: string) => {
    if (loading) return;
    setInput(prompt);
    setPromptSeed(Date.now());
  };

  const clearConversation = () => {
    setMessages([]);
    setPromptSeed(Date.now());
    setConfirmClearChat(false);
  };

  const stopAssistantMessage = () => {
    if (chatAudioRef.current) {
      chatAudioRef.current.pause();
      chatAudioRef.current.currentTime = 0;
      chatAudioRef.current = null;
    }
    setSpeakingMessageIndex(null);
  };

  const playAssistantMessage = async (content: string, index: number) => {
    if (!content?.trim()) return;
    if (speakingMessageIndex === index) {
      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current.currentTime = 0;
      }
      setSpeakingMessageIndex(null);
      return;
    }

    try {
      const spokenContent = content
        .replace(/\[\[ACTIVITY:[^\]]+\]\]/g, '')
        .replace(/[*_`#>-]+/g, ' ')
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!spokenContent) return;

      if (chatAudioRef.current) {
        chatAudioRef.current.pause();
        chatAudioRef.current.currentTime = 0;
      }

      const gender = defaultVoice === 'feminino' ? 'feminino' : 'masculino';
      const response = await fetch('/api/piper-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenContent, gender }),
      });
      if (!response.ok) {
        setSpeakingMessageIndex(index);
        const spoken = await speakBrowserText(spokenContent, {
          voice: gender,
          volume: Number(audioSettings?.voiceVolume ?? 80),
        });
        setSpeakingMessageIndex(null);
        if (!spoken) return;
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100));
      chatAudioRef.current = audio;
      setSpeakingMessageIndex(index);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (chatAudioRef.current === audio) chatAudioRef.current = null;
        setSpeakingMessageIndex(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (chatAudioRef.current === audio) chatAudioRef.current = null;
        setSpeakingMessageIndex(null);
      };
      await audio.play();
    } catch {
      const gender = defaultVoice === 'feminino' ? 'feminino' : 'masculino';
      const spokenContent = content
        .replace(/\[\[ACTIVITY:[^\]]+\]\]/g, '')
        .replace(/[*_`#>-]+/g, ' ')
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (spokenContent) {
        setSpeakingMessageIndex(index);
        await speakBrowserText(spokenContent, {
          voice: gender,
          volume: Number(audioSettings?.voiceVolume ?? 80),
        });
      }
      setSpeakingMessageIndex(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-2xl mx-auto p-4 animate-fade-in">
      <div className={`mb-4 rounded-[2rem] border p-4 ${dm ? 'bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_34%),linear-gradient(180deg,#0e1728_0%,#101b2f_100%)] border-cyan-900/30 text-slate-100' : 'bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-900 shadow-sm'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-cyan-300/80' : 'text-cyan-700/80'}`}>Chat de apoio</p>
            <h2 className="mt-1 whitespace-nowrap text-[clamp(1.15rem,4.8vw,1.45rem)] font-black tracking-[-0.03em]">
              Converse com <span className={dm ? 'text-violet-300' : 'text-violet-700'}>SERENO</span>
            </h2>
            <p className={`mt-2 max-w-[29rem] text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Converse, organize o momento e receba sugestões pensadas para você.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextValue = !voiceRepliesEnabled;
                  setVoiceRepliesEnabled(nextValue);
                  if (!nextValue) stopAssistantMessage();
                }}
                className={`rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 ${
                  voiceRepliesEnabled
                    ? (dm ? 'bg-blue-500/15 text-blue-200 border border-blue-400/30' : 'bg-blue-50 text-blue-700 border border-blue-200')
                    : (dm ? 'bg-rose-500/15 text-rose-200 border border-rose-400/30' : 'bg-rose-50 text-rose-700 border border-rose-200')
                }`}
              >
                {voiceRepliesEnabled ? 'Voz on' : 'Voz off'}
              </button>
              {messages.length > 0 && (
                <button
                  onClick={() => setConfirmClearChat((prev) => !prev)}
                  className={`rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] active:scale-95 transition-all ${dm ? 'bg-rose-950/40 text-rose-200 border border-rose-900/40' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
                >
                  Excluir conversa
                </button>
              )}
            </div>
            {messages.length > 0 && confirmClearChat && (
              <div className={`mt-3 rounded-2xl border p-3 ${dm ? 'bg-slate-900/90 border-rose-900/40' : 'bg-white border-rose-100 shadow-sm'}`}>
                <p className={`text-xs font-bold ${dm ? 'text-slate-200' : 'text-slate-700'}`}>Deseja mesmo excluir toda a conversa?</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={clearConversation}
                    className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-rose-600 text-white' : 'bg-rose-600 text-white'}`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearChat(false)}
                    className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-blue-500/15 text-blue-200 border border-blue-400/30' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}
                  >
                    Nao
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={`rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-slate-900/80 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {hasUnlimitedAccess ? 'Ilimitado' : `${effectiveDailyChatUsage}/5 hoje`}
            </div>
            {!hasUnlimitedAccess && freeChatLocked && (
              <div className={`rounded-2xl px-3 py-2 text-right ${dm ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-400/20' : 'bg-cyan-50 text-cyan-800 border border-cyan-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-75">Libera em</p>
                <p className="mt-1 text-sm font-[1000] tabular-nums tracking-[0.08em]">{chatResetLabel}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className={`min-h-0 flex-1 overflow-y-auto space-y-4 mb-3 pr-1 rounded-[2rem] border p-3 custom-scrollbar ${dm ? 'bg-[linear-gradient(180deg,rgba(2,6,23,0.72)_0%,rgba(15,23,42,0.46)_100%)] border-slate-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]' : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.94)_100%)] border-slate-200/80 shadow-sm'}`}
      >
        {messages.length === 0 && (
          <div className={`p-6 rounded-[1.8rem] border text-center ${dm ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(17,24,39,0.82)_100%)] border-slate-800/90 text-slate-300' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-100 text-slate-600'}`}>
            <span className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.4rem] text-3xl ${dm ? 'bg-violet-500/12 text-violet-200 border border-violet-400/20' : 'bg-violet-50 text-violet-700 border border-violet-100'}`}>✦</span>
            <p className="text-base font-bold">Como posso te apoiar agora?</p>
            <p className={`mt-2 text-sm ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Você pode começar com uma frase simples. O app te acompanha a partir dela.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.role === 'user' ? 'w-fit max-w-[78%]' : 'max-w-[84%]'} p-4 rounded-[1.55rem] ${
              m.role === 'user' 
                ? (dm ? 'bg-[linear-gradient(135deg,#0f766e_0%,#0f766e_20%,#155e75_100%)] text-white rounded-tr-md shadow-[0_14px_28px_rgba(13,148,136,0.22)] border border-white/10' : 'bg-[linear-gradient(135deg,#ecfeff_0%,#ccfbf1_45%,#dbeafe_100%)] text-slate-800 rounded-tr-md shadow-[0_12px_24px_rgba(20,184,166,0.14)] border border-teal-100/90')
                : (dm ? 'bg-[linear-gradient(135deg,#6d28d9_0%,#5b21b6_48%,#4338ca_100%)] text-white border border-violet-300/15 rounded-tl-md shadow-[0_16px_32px_rgba(91,33,182,0.26)]' : 'bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_46%,#4f46e5_100%)] text-white border border-violet-200/20 shadow-[0_14px_28px_rgba(109,40,217,0.18)] rounded-tl-md')
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => playAssistantMessage(m.content, i)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold active:scale-95 transition-all ${dm ? 'bg-white/12 text-white border border-white/15 hover:bg-white/15' : 'bg-white/18 text-white border border-white/20 hover:bg-white/25'}`}
                  >
                    {speakingMessageIndex === i ? 'Parar audio' : 'Ouvir de novo'}
                    <span aria-hidden="true">{speakingMessageIndex === i ? '■' : '▶'}</span>
                  </button>
                  {m.activity && (
                    <button
                      onClick={() => onNavigate?.(m.activity.tab)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold active:scale-95 transition-all ${dm ? 'bg-white/12 text-white border border-white/15 hover:bg-white/15' : 'bg-white/18 text-white border border-white/20 hover:bg-white/25'}`}
                    >
                      {m.activity.label}
                      <span aria-hidden="true">➜</span>
                    </button>
                  )}
                  {m.upgradePrompt && (
                    <button
                      onClick={() => onShowPlans?.({
                        title: 'Chat com SERENO ilimitado',
                        desc: 'No plano gratuito você tem 5 mensagens por dia. No Pro, a conversa fica liberada sem limite.',
                        focus: 'comparison',
                      })}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold active:scale-95 transition-all ${dm ? 'bg-fuchsia-500 text-white border border-fuchsia-400/20 hover:bg-fuchsia-400' : 'bg-fuchsia-600 text-white border border-fuchsia-500/20 hover:bg-fuchsia-500'}`}
                    >
                      Ver plano Pro
                      <span aria-hidden="true">➜</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className={`p-4 rounded-[1.5rem] rounded-tl-md ${dm ? 'bg-[linear-gradient(180deg,rgba(30,41,59,0.94)_0%,rgba(15,23,42,0.94)_100%)] border border-slate-700/80 text-slate-200' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border border-slate-200 shadow-sm text-slate-700'}`}>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`relative mt-1 rounded-[1.9rem] border p-2 ${dm ? 'bg-[linear-gradient(180deg,#0c1626_0%,#0f1b2f_100%)] border-violet-900/20 shadow-[0_16px_34px_rgba(2,6,23,0.24)]' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 shadow-[0_16px_34px_rgba(148,163,184,0.12)]'}`}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Digite sua mensagem..."
          rows={1}
          className={`w-full min-h-[58px] max-h-36 resize-none p-4 pr-16 rounded-[1.35rem] border outline-none transition-all ${
            dm 
              ? 'bg-[linear-gradient(180deg,#0c1626_0%,#111c2f_100%)] border-slate-800/70 text-white placeholder:text-slate-500 focus:border-violet-500 overflow-hidden' 
              : 'bg-slate-50/90 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-violet-400 overflow-hidden'
          }`}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-[1rem] border border-white/10 bg-[linear-gradient(135deg,#6d28d9_0%,#4f46e5_54%,#2563eb_100%)] text-white disabled:opacity-50 active:scale-95 transition-all shadow-[0_14px_26px_rgba(79,70,229,0.26)]"
        >
          <span className="text-lg">➜</span>
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setActivePromptIndex((prev) => (prev - 1 + quickPrompts.length) % quickPrompts.length)}
          disabled={quickPrompts.length <= 1}
          className={`h-11 w-11 shrink-0 rounded-2xl border active:scale-95 transition-all ${dm ? 'bg-violet-500/12 text-violet-200 border-violet-400/20 disabled:opacity-40' : 'bg-violet-50 text-violet-700 border-violet-100 disabled:opacity-40'}`}
          aria-label="Sugestão anterior"
        >
          ←
        </button>
        {quickPrompts.length > 0 && (
          <button
            onClick={() => sendQuickPrompt(quickPrompts[activePromptIndex])}
            className={`flex-1 rounded-[1.35rem] px-4 py-3 text-sm font-semibold text-left transition-all active:scale-[0.99] ${dm ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.84)_0%,rgba(30,41,59,0.72)_100%)] text-slate-200 border border-slate-800/90 hover:bg-slate-800' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
          >
            {quickPrompts[activePromptIndex]}
          </button>
        )}
        <button
          onClick={() => setActivePromptIndex((prev) => (prev + 1) % quickPrompts.length)}
          disabled={quickPrompts.length <= 1}
          className={`h-11 w-11 shrink-0 rounded-2xl border active:scale-95 transition-all ${dm ? 'bg-violet-500/12 text-violet-200 border-violet-400/20 disabled:opacity-40' : 'bg-violet-50 text-violet-700 border-violet-100 disabled:opacity-40'}`}
          aria-label="Próxima sugestão"
        >
          →
        </button>
      </div>
    </div>
  );
};

const BreathingSection = ({ darkMode: dm, initialExerciseId, onComplete, onNavigateBack, hasUnlimitedAccess = false, onShowUpgrade, defaultVoice = 'feminino', audioSettings, onExerciseChange }: any) => {
  type BreathingStep = { key: string; label: string; speech: string; duration: number };
  type BreathingProtocol = {
    id: string;
    name: string;
    emoji: string;
    desc: string;
    rounds: number;
    in?: number;
    hold?: number;
    out?: number;
    hold2?: number;
    customSteps?: BreathingStep[];
    sessionTargetMs?: number;
  };

  const protocols: BreathingProtocol[] = [
    { id: '333', name: 'Anti-Ansiedade', in: 3, hold: 3, out: 3, rounds: 8, emoji: '⚡', desc: 'Rápido para SOS Ansiedade' },
    { id: '424', name: 'Relaxamento', in: 4, hold: 2, out: 4, rounds: 10, emoji: '🍃', desc: 'Equilibrar batimentos' },
    { id: '4444', name: 'Quadrada (Box)', in: 4, hold: 4, out: 4, hold2: 4, rounds: 5, emoji: '🔲', desc: 'Foco e clareza mental' },
    { id: '478', name: 'Potente 4-7-8', in: 4, hold: 7, out: 8, rounds: 4, emoji: '😴', desc: 'Relaxamento profundo e sono' },
    { id: '406', name: 'Calmante', in: 4, hold: 0, out: 6, rounds: 10, emoji: '🌊', desc: 'Ativar o parassimpático' },
    { id: 'fole', name: 'Fole (Bhastrika)', in: 1, hold: 0, out: 1, rounds: 30, emoji: '🔥', desc: 'Energia e vitalidade' },
    { id: '55', name: 'Coerência', in: 5, hold: 0, out: 5, rounds: 60, emoji: '⚖️', desc: 'Equilíbrio emocional' },
    { id: 'progressiva', name: 'Progressiva', in: 4, hold: 2, out: 6, rounds: 8, emoji: '📈', desc: 'Aumentar capacidade' },
    { id: 'limpeza', name: 'Limpeza', in: 4, hold: 4, out: 8, rounds: 6, emoji: '✨', desc: 'Desintoxicar a mente' },
    { id: 'foco', name: 'Foco Laser', in: 6, hold: 2, out: 4, rounds: 8, emoji: '🎯', desc: 'Concentração máxima' },
    { id: 'noite', name: 'Boa Noite', in: 4, hold: 0, out: 6, rounds: 8, emoji: '🌙', desc: 'Preparar para o sono' },
    { id: 'manhā', name: 'Bom Dia', in: 1, hold: 0, out: 1, rounds: 30, emoji: '☀️', desc: 'Despertar consciente' },
    { id: 'pausa', name: 'Pausa Ativa', in: 3, hold: 0, out: 3, rounds: 3, emoji: '⏸️', desc: 'Mini reset diário' },
    { id: 'ground557', name: 'Aterramento', in: 5, hold: 5, out: 7, rounds: 8, emoji: '🪨', desc: 'Aterramento profundo guiado' },
    { id: 'quick24', name: 'Alívio Rápido', in: 2, hold: 0, out: 4, rounds: 8, emoji: '💨', desc: 'Expiração prolongada para aliviar' },
    { id: 'presence44', name: 'Presença', in: 4, hold: 0, out: 4, rounds: 60, emoji: '🫧', desc: 'Ritmo igual para presença' },
    { id: 'energy212', name: 'Energia Clara', in: 2, hold: 1, out: 2, rounds: 15, emoji: '⚡️', desc: 'Ativação leve e desperta' },
    { id: 'slow468', name: 'Desacelerar Pensamentos', in: 4, hold: 6, out: 8, rounds: 6, emoji: '🧠', desc: 'Segurar e soltar para desacelerar' },
    { id: 'release448', name: 'Soltar Tensão', in: 4, hold: 4, out: 8, rounds: 6, emoji: '🪶', desc: 'Soltar tensão com expiração longa' },
    { id: 'center527', name: 'Centro Emocional', in: 5, hold: 2, out: 7, rounds: 7, emoji: '💠', desc: 'Mais centro e regulação' },
    { id: 'focus426', name: 'Foco Estável', in: 4, hold: 2, out: 6, rounds: 10, emoji: '📍', desc: 'Atenção estável sem rigidez' },
    { id: 'sleep479', name: 'Sono Profundo', in: 4, hold: 7, out: 8, rounds: 4, emoji: '🌌', desc: 'Protocolo noturno mais profundo' },
    {
      id: 'sigh',
      name: 'Suspiro Cíclico',
      emoji: '😮‍💨',
      desc: 'Dupla inspiração e expiração longa',
      rounds: 18,
      sessionTargetMs: 5 * 60 * 1000,
      customSteps: [
        { key: 'inhale1', label: '1ª inspiração', speech: 'Primeira inspiração', duration: 3 },
        { key: 'inhale2', label: '2ª inspiração', speech: 'Segunda inspiração', duration: 1.5 },
        { key: 'exhale', label: 'Expiração longa', speech: 'Expire longo', duration: 6 },
      ],
    },
    {
      id: 'nadi',
      name: 'Respiração Alternada',
      emoji: '🌀',
      desc: 'Alternância entre as narinas',
      rounds: 8,
      customSteps: [
        { key: 'inLeft', label: 'Inspire esquerda', speech: 'Inspire esquerda', duration: 5 },
        { key: 'outRight', label: 'Expire direita', speech: 'Expire direita', duration: 5 },
        { key: 'inRight', label: 'Inspire direita', speech: 'Inspire direita', duration: 5 },
        { key: 'outLeft', label: 'Expire esquerda', speech: 'Expire esquerda', duration: 5 },
      ],
    },
    {
      id: 'diafragma',
      name: 'Respiração Diafragmática',
      emoji: '🫁',
      desc: 'Base de tudo para respirar melhor',
      rounds: 40,
      sessionTargetMs: 5 * 60 * 1000,
      customSteps: [
        { key: 'inhale', label: 'Barriga expande', speech: 'Inspire', duration: 4 },
        { key: 'exhale', label: 'Barriga contrai', speech: 'Expire', duration: 6 },
      ],
    },
  ];

  const freeProtocolIds = new Set(['333', '424', '4444', '406', '55']);
  const visibleProtocols = protocols.filter((protocol) => hasUnlimitedAccess || freeProtocolIds.has(protocol.id));
  const lockedProtocols = protocols.filter((protocol) => !freeProtocolIds.has(protocol.id));
  const breathingToneById: Record<string, 'sky' | 'emerald' | 'amber' | 'indigo' | 'teal' | 'orange' | 'violet' | 'rose'> = {
    '333': 'sky',
    '424': 'emerald',
    '4444': 'amber',
    '478': 'indigo',
    '406': 'teal',
    fole: 'orange',
    '55': 'teal',
    progressiva: 'violet',
    limpeza: 'violet',
    foco: 'amber',
    noite: 'indigo',
    'manhā': 'orange',
    pausa: 'emerald',
    ground557: 'emerald',
    quick24: 'sky',
    presence44: 'teal',
    energy212: 'orange',
    slow468: 'violet',
    release448: 'rose',
    center527: 'teal',
    focus426: 'amber',
    sleep479: 'indigo',
    sigh: 'sky',
    nadi: 'violet',
    diafragma: 'teal',
  };
  const breathingToneClasses = (id: string, selected: boolean) => {
    const tone = breathingToneById[id] || 'sky';
    const palette = {
      sky: {
        selected: 'bg-[#0d2035] border-sky-900/60 text-white shadow-md shadow-sky-950/8',
        dark: 'bg-sky-950/30 border-sky-900/50 text-sky-100',
        light: 'bg-gradient-to-br from-white via-sky-50 to-blue-50 border-sky-100 text-sky-900 shadow-sm',
        iconDark: 'bg-sky-500/12 text-sky-300',
        iconLight: 'bg-sky-100 text-sky-700',
        chipDark: 'bg-sky-500/12 text-sky-200',
        chipLight: 'bg-sky-100 text-sky-700',
        descDark: 'text-sky-200/72',
        descLight: 'text-sky-800/72',
      },
      emerald: {
        selected: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 border-emerald-800/55 text-white shadow-md shadow-emerald-950/5',
        dark: 'bg-emerald-950/30 border-emerald-900/50 text-emerald-100',
        light: 'bg-gradient-to-br from-white via-emerald-50 to-teal-50 border-emerald-100 text-emerald-900 shadow-sm',
        iconDark: 'bg-emerald-500/12 text-emerald-300',
        iconLight: 'bg-emerald-100 text-emerald-700',
        chipDark: 'bg-emerald-500/12 text-emerald-200',
        chipLight: 'bg-emerald-100 text-emerald-700',
        descDark: 'text-emerald-200/72',
        descLight: 'text-emerald-800/72',
      },
      amber: {
        selected: 'bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950 border-amber-800/55 text-white shadow-md shadow-amber-950/5',
        dark: 'bg-amber-950/30 border-amber-900/50 text-amber-100',
        light: 'bg-gradient-to-br from-white via-amber-50 to-orange-50 border-amber-100 text-amber-900 shadow-sm',
        iconDark: 'bg-amber-500/12 text-amber-300',
        iconLight: 'bg-amber-100 text-amber-700',
        chipDark: 'bg-amber-500/12 text-amber-200',
        chipLight: 'bg-amber-100 text-amber-700',
        descDark: 'text-amber-200/72',
        descLight: 'text-amber-800/72',
      },
      indigo: {
        selected: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-indigo-800/55 text-white shadow-md shadow-indigo-950/5',
        dark: 'bg-indigo-950/30 border-indigo-900/50 text-indigo-100',
        light: 'bg-gradient-to-br from-white via-indigo-50 to-violet-50 border-indigo-100 text-indigo-900 shadow-sm',
        iconDark: 'bg-indigo-500/12 text-indigo-300',
        iconLight: 'bg-indigo-100 text-indigo-700',
        chipDark: 'bg-indigo-500/12 text-indigo-200',
        chipLight: 'bg-indigo-100 text-indigo-700',
        descDark: 'text-indigo-200/72',
        descLight: 'text-indigo-800/72',
      },
      teal: {
        selected: 'bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 border-teal-800/55 text-white shadow-md shadow-teal-950/5',
        dark: 'bg-teal-950/30 border-teal-900/50 text-teal-100',
        light: 'bg-gradient-to-br from-white via-teal-50 to-cyan-50 border-teal-100 text-teal-900 shadow-sm',
        iconDark: 'bg-teal-500/12 text-teal-300',
        iconLight: 'bg-teal-100 text-teal-700',
        chipDark: 'bg-teal-500/12 text-teal-200',
        chipLight: 'bg-teal-100 text-teal-700',
        descDark: 'text-teal-200/72',
        descLight: 'text-teal-800/72',
      },
      orange: {
        selected: 'bg-gradient-to-br from-slate-900 via-orange-950 to-slate-950 border-orange-800/55 text-white shadow-md shadow-orange-950/5',
        dark: 'bg-orange-950/30 border-orange-900/50 text-orange-100',
        light: 'bg-gradient-to-br from-white via-orange-50 to-amber-50 border-orange-100 text-orange-900 shadow-sm',
        iconDark: 'bg-orange-500/12 text-orange-300',
        iconLight: 'bg-orange-100 text-orange-700',
        chipDark: 'bg-orange-500/12 text-orange-200',
        chipLight: 'bg-orange-100 text-orange-700',
        descDark: 'text-orange-200/72',
        descLight: 'text-orange-800/72',
      },
      violet: {
        selected: 'bg-gradient-to-br from-slate-900 via-violet-950 to-slate-950 border-violet-800/55 text-white shadow-md shadow-violet-950/5',
        dark: 'bg-violet-950/30 border-violet-900/50 text-violet-100',
        light: 'bg-gradient-to-br from-white via-violet-50 to-fuchsia-50 border-violet-100 text-violet-900 shadow-sm',
        iconDark: 'bg-violet-500/12 text-violet-300',
        iconLight: 'bg-violet-100 text-violet-700',
        chipDark: 'bg-violet-500/12 text-violet-200',
        chipLight: 'bg-violet-100 text-violet-700',
        descDark: 'text-violet-200/72',
        descLight: 'text-violet-800/72',
      },
      rose: {
        selected: 'bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 border-rose-800/55 text-white shadow-md shadow-rose-950/5',
        dark: 'bg-rose-950/30 border-rose-900/50 text-rose-100',
        light: 'bg-gradient-to-br from-white via-rose-50 to-pink-50 border-rose-100 text-rose-900 shadow-sm',
        iconDark: 'bg-rose-500/12 text-rose-300',
        iconLight: 'bg-rose-100 text-rose-700',
        chipDark: 'bg-rose-500/12 text-rose-200',
        chipLight: 'bg-rose-100 text-rose-700',
        descDark: 'text-rose-200/72',
        descLight: 'text-rose-800/72',
      },
    }[tone];
    return {
      card: selected ? palette.selected : (dm ? palette.dark : palette.light),
      icon: selected ? 'bg-sky-400/10 text-white/92' : (dm ? palette.iconDark : palette.iconLight),
      chip: selected ? 'bg-sky-400/10 text-white/80' : (dm ? palette.chipDark : palette.chipLight),
      desc: selected ? 'text-white/72' : (dm ? palette.descDark : palette.descLight),
    };
  };
  const summarizeBreathingCycles = (value?: string, fallbackRounds?: number) => {
    if (!value) return `${fallbackRounds || 0} ciclos`;
    const minutesRange = value.match(/(\d+)\s*-\s*(\d+)\s*minutos/i);
    if (minutesRange) return `${minutesRange[1]}-${minutesRange[2]} min`;
    const singleMinutes = value.match(/(\d+)\s*minutos/i);
    if (singleMinutes) return `${singleMinutes[1]} min`;
    const rodadas = value.match(/(\d+)\s*rodadas?/i);
    if (rodadas) return `${rodadas[1]} rodadas`;
    const cyclesSingle = value.match(/(\d+)\s*ciclos/i);
    if (cyclesSingle) return `${cyclesSingle[1]} ciclos`;
    const cyclesRange = value.match(/(\d+)\s*-\s*(\d+)\s*ciclos/i);
    if (cyclesRange) return `${cyclesRange[2]} ciclos`;
    const breaths = value.match(/(\d+)\s*respirações/i);
    if (breaths) return `${breaths[1]} reps`;
    return `${fallbackRounds || 0} ciclos`;
  };
  const lockedProtocolTeasers = [
    { id: 'sleep-deep', title: 'Sono profundo', detail: 'Desligar o ritmo e entrar em descanso' },
    { id: 'focus-clarity', title: 'Foco e clareza', detail: 'Respirar para centrar a mente' },
    { id: 'energy-activation', title: 'Energia e ativação', detail: 'Despertar com mais presença' },
    { id: 'grounding', title: 'Aterramento', detail: 'Voltar ao corpo e ao agora' },
    { id: 'emotional-regulation', title: 'Regulação emocional', detail: 'Soltar excesso e ganhar eixo' },
  ];
  const [selectedId, setSelectedId] = useState<string>(
    initialExerciseId && (hasUnlimitedAccess || freeProtocolIds.has(initialExerciseId)) ? initialExerciseId : '333',
  );
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [cycleBadgeRound, setCycleBadgeRound] = useState(1);
  const [phase, setPhase] = useState<string>('in');
  const [remaining, setRemaining] = useState(3);
  const [audioEnabled, setAudioEnabled] = useAppPersistence('breathing-audio-enabled', true);
  const [activeTab, setActiveTab] = useState<'info' | 'pratica'>('info');
  const [preparationPaused, setPreparationPaused] = useState(false);
  const breathingNarrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const breathingAudioEnabledRef = useRef(audioEnabled);
  const previousBreathingAudioEnabledRef = useRef(audioEnabled);
  const breathingPreparationRemainingMsRef = useRef(2200);
  const breathingPreparationStartedAtRef = useRef<number | null>(null);
  const stopBreathingNarration = useCallback(() => {
    if (breathingNarrationAudioRef.current) {
      breathingNarrationAudioRef.current.pause();
      breathingNarrationAudioRef.current.currentTime = 0;
      breathingNarrationAudioRef.current = null;
    }
  }, []);

  const selected = visibleProtocols.find((p) => p.id === selectedId) || visibleProtocols[0];
  const breathingGuidanceById: Record<string, { greeting: string; intro: string; items: string[]; closing: string }> = {
    '333': {
      greeting: 'Chegue primeiro ao corpo, depois ao ritmo.',
      intro: 'Esta técnica curta é boa para crise, então vale priorizar estabilidade física e respiração simples, sem exagerar a profundidade.',
      items: [
        'Se puder, sente-se com os pés apoiados ou encoste bem as costas antes de começar.',
        'Deixe o ar entrar e sair pelo nariz quando isso estiver confortável, sem puxar com força.',
        'Se sentir tontura, volte ao seu ritmo natural e reinicie apenas quando o corpo estabilizar.',
      ],
      closing: 'Sessão concluída. Você terminou o 3-3-3 Anti-Ansiedade. Leve esse ritmo mais estável com você pelos próximos minutos.',
    },
    '424': {
      greeting: 'Prepare o corpo para desacelerar.',
      intro: 'Nesta sequência, o foco é equalizar batimentos e reduzir agitação com um ritmo estável e confortável.',
      items: [
        'Solte ombros, mãos e mandíbula antes de apertar play.',
        'Inspire sem elevar demais o peito e deixe a expiração sair macia, sem pressa.',
        'Use um ritmo contínuo, como se estivesse embalando o corpo para mais calma.',
      ],
      closing: 'Sessão concluída. Você terminou o Relaxamento 4-2-4. Que seu corpo siga mais regulado e mais tranquilo daqui para frente.',
    },
    '4444': {
      greeting: 'Entre com postura firme e respiração limpa.',
      intro: 'A respiração quadrada costuma funcionar melhor com coluna organizada e pouco esforço no rosto e nos ombros.',
      items: [
        'Sente-se com a coluna alongada sem rigidez, ou mantenha o tronco bem apoiado se preferir.',
        'Faça cada fase pelo mesmo tempo, sem correr para a próxima.',
        'Se o segundo bloqueio ficar desconfortável, reduza a intensidade e preserve suavidade.',
      ],
      closing: 'Sessão concluída. Você terminou a Respiração Quadrada. Que essa sensação de organização continue guiando sua atenção.',
    },
    '478': {
      greeting: 'Prepare o corpo para relaxar sem forçar.',
      intro: 'Como esta prática tem retenção mais longa e expiração prolongada, o melhor é entrar nela já com o corpo mais quieto.',
      items: [
        'Sente-se ou deite-se de um jeito em que barriga e peito consigam se mover sem aperto.',
        'Inspire com delicadeza e solte o ar devagar, sem tentar “encher demais” os pulmões.',
        'Se a retenção ficar intensa, reduza o esforço e mantenha o conforto acima do desempenho.',
      ],
      closing: 'Sessão concluída. Você terminou a 4-7-8. Que o corpo continue entendendo que já pode relaxar mais profundamente.',
    },
    '406': {
      greeting: 'Vamos baixar o ritmo com mais suavidade.',
      intro: 'Aqui a expiração mais longa ajuda a ativar o relaxamento, então vale deixar o corpo bem apoiado antes de começar.',
      items: [
        'Afrouxe o abdômen e os ombros para não prender a saída do ar.',
        'Use o nariz se isso estiver confortável, deixando a expiração sair lenta e contínua.',
        'Pense em soltar, não em controlar demais.',
      ],
      closing: 'Sessão concluída. Você terminou a Calmante 4-6. Permaneça mais alguns instantes nesse ritmo desacelerado.',
    },
    fole: {
      greeting: 'Antes de energizar, estabilize a postura.',
      intro: 'Bhastrika é mais ativa. Ela pede posição sentada, tronco livre e atenção ao corpo para não virar esforço excessivo.',
      items: [
        'Faça esta prática sentado, com coluna organizada e rosto relaxado.',
        'Use respiração nasal ritmada, sem apertar garganta, pescoço ou maxilar.',
        'Se sentir desconforto, pressão ou tontura, pare e volte à respiração natural.',
      ],
      closing: 'Sessão concluída. Você terminou o Fole. Que essa energia entre com clareza, sem atropelar o corpo.',
    },
    '55': {
      greeting: 'Prepare-se para um ritmo equilibrado.',
      intro: 'A coerência 5-5 costuma funcionar melhor quando corpo e respiração entram num compasso regular e sem tensão.',
      items: [
        'Apoie bem os pés ou deite-se de forma estável para não gastar energia sustentando postura.',
        'Faça inspiração e expiração com a mesma duração, sem prender o ar.',
        'Procure um fluxo silencioso e confortável, como uma maré constante.',
      ],
      closing: 'Sessão concluída. Você terminou a Coerência 5-5. Que esse compasso equilibrado continue ajudando seu sistema a se regular.',
    },
    progressiva: {
      greeting: 'Comece leve e deixe o corpo acompanhar.',
      intro: 'Nesta prática, a ideia é aumentar a capacidade aos poucos, então a suavidade no início importa mais do que a intensidade.',
      items: [
        'Posicione-se de forma confortável e estável antes de buscar respirações mais longas.',
        'Inspire sem rigidez no peito e alongue a expiração gradualmente.',
        'Se sentir esforço excessivo, fique no ciclo que estiver mais natural para você.',
      ],
      closing: 'Sessão concluída. Você terminou a Respiração Progressiva. Que seu corpo guarde essa expansão com leveza.',
    },
    limpeza: {
      greeting: 'Abra espaço antes de alongar a expiração.',
      intro: 'Esta técnica pede mais tempo para soltar o ar, então vale relaxar o rosto, a garganta e o abdômen antes de iniciar.',
      items: [
        'Solte testa, língua e mandíbula para não prender a saída do ar.',
        'Use a expiração longa como gesto de esvaziar tensão, sem expulsar o ar com força.',
        'Mantenha conforto e clareza durante todo o ciclo.',
      ],
      closing: 'Sessão concluída. Você terminou a Respiração de Limpeza. Que esse espaço interno permaneça mais leve e arejado.',
    },
    foco: {
      greeting: 'Organize o corpo para sustentar atenção.',
      intro: 'Esta sequência é melhor quando a postura ajuda a manter presença, sem tensão desnecessária.',
      items: [
        'Sente-se com apoio firme e cabeça alinhada para reduzir dispersão física.',
        'Faça a inspiração estável e a expiração limpa, mantendo o ritmo atento.',
        'Sempre que a mente correr, volte ao contato do corpo com a cadeira ou com o chão.',
      ],
      closing: 'Sessão concluída. Você terminou o Foco Laser. Que sua atenção siga mais estável e menos fragmentada.',
    },
    noite: {
      greeting: 'Deixe o corpo entender que já pode desacelerar.',
      intro: 'Para esta prática de sono, a preparação ideal é mais solta, silenciosa e com mínimo esforço no corpo.',
      items: [
        'Se puder, faça deitado ou semissentado, com pescoço e joelhos apoiados.',
        'Mantenha a respiração nasal suave e deixe a expiração sair longa, sem empurrar.',
        'O objetivo não é render, e sim convidar o corpo para descanso.',
      ],
      closing: 'Sessão concluída. Você terminou a Boa Noite. Que o corpo continue entendendo que já pode dormir com mais calma.',
    },
    'manhā': {
      greeting: 'Prepare o corpo para acordar com mais clareza.',
      intro: 'Esta prática funciona melhor com postura desperta e respiração leve, sem virar aceleração ansiosa.',
      items: [
        'Sente-se com a coluna mais ativa e o peito aberto, mas sem endurecer.',
        'Respire pelo nariz com ritmo curto e consciente, mantendo o rosto solto.',
        'Use esta sequência como despertar, não como corrida.',
      ],
      closing: 'Sessão concluída. Você terminou o Bom Dia. Que esse despertar siga com clareza, energia e mais presença.',
    },
    pausa: {
      greeting: 'Faça deste momento um reset simples.',
      intro: 'Nesta pausa ativa, o ideal é reduzir a tensão acumulada e voltar ao ritmo do corpo sem complexidade.',
      items: [
        'Pare por alguns instantes e note o apoio dos pés ou do corpo no assento.',
        'Respire de forma curta, confortável e regular, sem buscar profundidade artificial.',
        'Use a prática para retomar presença, não para se exigir.',
      ],
      closing: 'Sessão concluída. Você terminou a Pausa Ativa. Siga o dia com esse reset ainda presente no corpo.',
    },
    ground557: {
      greeting: 'Primeiro, firme o corpo para aterrar melhor.',
      intro: 'Este protocolo do app usa retenção moderada e expiração mais longa para trazer mais sensação de base e presença.',
      items: [
        'Sente-se com os pés bem apoiados ou note o peso do corpo no chão, se estiver deitado.',
        'Use o nariz quando isso estiver confortável e evite puxar o ar com força.',
        'A retenção deve continuar confortável. Se tensionar, reduza o esforço e preserve estabilidade.',
      ],
      closing: 'Sessão concluída. Você terminou Aterramento 5-5-7. Que essa sensação de base siga com você nos próximos minutos.',
    },
    quick24: {
      greeting: 'Vamos aliviar sem complicar.',
      intro: 'Este protocolo é inspirado na lógica de expiração prolongada: entrar curto e soltar mais longo para ajudar a baixar o ritmo.',
      items: [
        'Relaxe ombros e pescoço antes de começar.',
        'Inspire leve e deixe a saída do ar acontecer por mais tempo, sem forçar.',
        'O objetivo é aliviar, não encher demais os pulmões.',
      ],
      closing: 'Sessão concluída. Você terminou Alívio Rápido 2-4. Permaneça por um instante nessa expiração mais macia.',
    },
    presence44: {
      greeting: 'Encontre um ritmo simples e igual.',
      intro: 'Este protocolo segue a lógica de respiração ritmada em tempos iguais, útil para presença e regularidade.',
      items: [
        'Sente-se com apoio ou deite-se de forma estável.',
        'Mantenha inspiração e expiração do mesmo tamanho, sem prender o ar.',
        'Use a contagem como âncora para reduzir dispersão.',
      ],
      closing: 'Sessão concluída. Você terminou Presença 4-4. Que esse compasso siga ajudando você a permanecer no agora.',
    },
    energy212: {
      greeting: 'Prepare o corpo para acordar com leveza.',
      intro: 'Este protocolo do app é mais desperto e curto, pensado para ativação leve sem virar aceleração tensa.',
      items: [
        'Mantenha a coluna mais ativa e o peito aberto, sem rigidez.',
        'Respire curto, limpo e consciente, com rosto e ombros soltos.',
        'Se perceber pressa demais, desacelere antes de continuar.',
      ],
      closing: 'Sessão concluída. Você terminou Energia Clara 2-1-2. Que essa disposição siga com mais clareza e menos agitação.',
    },
    slow468: {
      greeting: 'Desacelere primeiro por dentro.',
      intro: 'Este protocolo do app usa retenção e expiração alongada para ajudar a reduzir o ritmo dos pensamentos.',
      items: [
        'Apoie bem o corpo antes de iniciar.',
        'Mantenha a retenção confortável e use a expiração longa para soltar a pressa mental.',
        'Se a retenção apertar, reduza a intensidade e preserve suavidade.',
      ],
      closing: 'Sessão concluída. Você terminou Desacelerar Pensamentos 4-6-8. Que sua mente continue descendo alguns graus de velocidade.',
    },
    release448: {
      greeting: 'Abra espaço para soltar a tensão acumulada.',
      intro: 'Este protocolo do app combina pausa breve com expiração longa para favorecer descarga corporal sem agressividade.',
      items: [
        'Solte mandíbula, língua e ombros antes de começar.',
        'Use a retenção como pausa curta, não como esforço.',
        'Na saída do ar, pense em liberar peso, não em empurrar o corpo.',
      ],
      closing: 'Sessão concluída. Você terminou Soltar Tensão 4-4-8. Que o corpo permaneça um pouco mais leve daqui em diante.',
    },
    center527: {
      greeting: 'Vamos buscar mais centro com um ritmo estável.',
      intro: 'Este protocolo do app usa inspiração mais cheia e expiração mais longa para favorecer equilíbrio emocional e aterramento suave.',
      items: [
        'Apoie o corpo antes de começar e solte o rosto.',
        'Respire com fluidez, sem transformar a contagem em rigidez.',
        'A expiração é o momento de soltar excesso e voltar ao eixo.',
      ],
      closing: 'Sessão concluída. Você terminou Centro Emocional 5-2-7. Que esse eixo interno continue presente no restante do dia.',
    },
    focus426: {
      greeting: 'Organize o corpo para focar com menos esforço.',
      intro: 'Este protocolo do app mantém uma retenção curta e expiração mais longa, favorecendo atenção estável sem excesso de ativação.',
      items: [
        'Sente-se com apoio firme e cabeça alinhada.',
        'Use a breve retenção como pausa de organização, não de tensão.',
        'Cada expiração ajuda a limpar ruído interno antes do próximo foco.',
      ],
      closing: 'Sessão concluída. Você terminou Foco Estável 4-2-6. Que sua atenção siga firme, clara e menos fragmentada.',
    },
    sleep479: {
      greeting: 'Convide o corpo para um estado ainda mais noturno.',
      intro: 'Este protocolo do app aprofunda a lógica do 4-7-8 com saída ainda mais longa, pensado para relaxamento noturno.',
      items: [
        'Faça deitado ou semissentado, com apoio confortável para cabeça e pernas.',
        'Nunca force a retenção. Se pesar demais, siga com suavidade.',
        'Use a expiração longa como convite para o corpo entregar peso e entrar em descanso.',
      ],
      closing: 'Sessão concluída. Você terminou Sono Profundo 4-7-9. Que seu corpo continue afundando em um descanso mais estável e seguro.',
    },
  };
  const selectedDocRoutine = breathingDocRoutineById[selected.id];
  const breathingStepSignature = selected.customSteps?.length
    ? selected.customSteps.map((step) => `${step.key}:${step.label}:${step.speech}:${step.duration}`).join('|')
    : `${selected.in || 0}-${selected.hold || 0}-${selected.out || 0}-${selected.hold2 || 0}`;
  const breathingSteps = useMemo<BreathingStep[]>(() => {
    if (selected.customSteps?.length) return selected.customSteps;
    const base: BreathingStep[] = [{ key: 'in', label: 'Inspire', speech: 'Inspire', duration: selected.in || 0 }];
    if ((selected.hold || 0) > 0) base.push({ key: 'hold', label: 'Segure', speech: 'Segure', duration: selected.hold || 0 });
    base.push({ key: 'out', label: 'Expire', speech: 'Expire', duration: selected.out || 0 });
    if ((selected.hold2 || 0) > 0) base.push({ key: 'hold2', label: 'Segure', speech: 'Segure', duration: selected.hold2 || 0 });
    return base;
  }, [breathingStepSignature]);
  const selectedGuidance = selectedDocRoutine
    ? {
        greeting: selectedDocRoutine.greeting,
        intro: selectedDocRoutine.intro,
        items: selectedDocRoutine.items,
        closing: selectedDocRoutine.closing,
      }
    : breathingGuidanceById[selected.id];
  const [preparing, setPreparing] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showBreathingIntro, setShowBreathingIntro] = useState(false);
  const [showBreathingPosture, setShowBreathingPosture] = useState(false);
  const [showBreathingCycleInfo, setShowBreathingCycleInfo] = useState(false);
  const finishingRef = useRef(false);
  const breathingPreparationTimeoutRef = useRef<number | null>(null);
  const roundRef = useRef(1);
  const [stepIndex, setStepIndex] = useState(0);
  const stepIndexRef = useRef(0);
  const phaseRef = useRef<string>('in');
  const cycleStartedRoundRef = useRef(1);
  const remainingRef = useRef(3);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);
  const sessionElapsedRef = useRef(0);

  useEffect(() => {
    if (initialExerciseId) {
      setSelectedId(initialExerciseId);
      setActiveTab('pratica');
    }
  }, [initialExerciseId]);

  useEffect(() => {
    onExerciseChange?.(selectedId);
  }, [onExerciseChange, selectedId]);

  useEffect(() => {
    setRound(1);
    setCycleBadgeRound(1);
    roundRef.current = 1;
    setStepIndex(0);
    stepIndexRef.current = 0;
    cycleStartedRoundRef.current = 1;
    setPhase(breathingSteps[0]?.key || 'in');
    phaseRef.current = breathingSteps[0]?.key || 'in';
    setRemaining(breathingSteps[0]?.duration ?? selected.in ?? 0);
    remainingRef.current = breathingSteps[0]?.duration ?? selected.in ?? 0;
    setSessionElapsedMs(0);
    sessionElapsedRef.current = 0;
    setRunning(false);
    setPreparing(false);
    setPreparationPaused(false);
    breathingPreparationRemainingMsRef.current = 2200;
    breathingPreparationStartedAtRef.current = null;
    setSessionCompleted(false);
    setShowBreathingIntro(false);
    setShowBreathingPosture(false);
    setShowBreathingCycleInfo(false);
    finishingRef.current = false;
  }, [breathingStepSignature, selected.in, selectedId]);

  useEffect(() => {
    return () => {
      if (breathingPreparationTimeoutRef.current) {
        window.clearTimeout(breathingPreparationTimeoutRef.current);
        breathingPreparationTimeoutRef.current = null;
      }
      stopBreathingNarration();
    };
  }, [stopBreathingNarration]);

  useEffect(() => {
    if (activeTab !== 'info') return;
    if (breathingPreparationTimeoutRef.current) {
      window.clearTimeout(breathingPreparationTimeoutRef.current);
      breathingPreparationTimeoutRef.current = null;
    }
    setPreparing(false);
    setPreparationPaused(false);
    breathingPreparationRemainingMsRef.current = 2200;
    breathingPreparationStartedAtRef.current = null;
  }, [activeTab]);

  useEffect(() => {
    if (!running) stopBreathingNarration();
  }, [running, stopBreathingNarration]);

  useEffect(() => {
    breathingAudioEnabledRef.current = audioEnabled;
    if (!breathingNarrationAudioRef.current) return;
    breathingNarrationAudioRef.current.volume =
      audioEnabled && defaultVoice !== 'nenhuma'
        ? Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100))
        : 0;
  }, [audioEnabled, audioSettings?.voiceVolume, defaultVoice]);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    if (!running) return;
    if (stepIndex === 0 && remaining < (breathingSteps[0]?.duration ?? selected.in ?? 0) && cycleBadgeRound !== round) {
      setCycleBadgeRound(round);
    }
  }, [breathingSteps, cycleBadgeRound, remaining, round, running, selected.in, stepIndex]);

  const playBreathingText = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text?.trim() || defaultVoice === 'nenhuma') {
      onEnd?.();
      return;
    }
    try {
      stopBreathingNarration();
      const response = await fetch('/api/piper-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          gender: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
          voice: defaultVoice === 'feminino' ? 'pt-BR-FranciscaNeural' : 'pt-BR-AntonioNeural',
        }),
      });
      if (!response.ok) {
        await speakBrowserText(text, {
          voice: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
          volume: Number(audioSettings?.voiceVolume ?? 80),
        });
        onEnd?.();
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      breathingNarrationAudioRef.current = audio;
      audio.volume = breathingAudioEnabledRef.current
        ? Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100))
        : 0;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (breathingNarrationAudioRef.current === audio) breathingNarrationAudioRef.current = null;
        onEnd?.();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (breathingNarrationAudioRef.current === audio) breathingNarrationAudioRef.current = null;
        onEnd?.();
      };
      await audio.play();
    } catch {
      await speakBrowserText(text, {
        voice: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
        volume: Number(audioSettings?.voiceVolume ?? 80),
      });
      onEnd?.();
    }
  }, [audioSettings?.voiceVolume, defaultVoice, stopBreathingNarration]);

  useEffect(() => {
    const wasEnabled = previousBreathingAudioEnabledRef.current;
    if (wasEnabled === audioEnabled) return;
    previousBreathingAudioEnabledRef.current = audioEnabled;

    if (!audioEnabled) {
      stopBreathingNarration();
      return;
    }

    if (running && !preparing && !sessionCompleted && defaultVoice !== 'nenhuma') {
      void playBreathingText(breathingSteps[stepIndexRef.current]?.speech || 'Respire');
    }
  }, [audioEnabled, breathingSteps, defaultVoice, playBreathingText, preparing, running, sessionCompleted, stopBreathingNarration]);

  const completeSilentPreparation = useCallback(() => {
    breathingPreparationTimeoutRef.current = null;
    breathingPreparationStartedAtRef.current = null;
    breathingPreparationRemainingMsRef.current = 2200;
    setPreparationPaused(false);
    setPreparing(false);
    setSessionCompleted(false);
    setRunning(true);
  }, []);

  const cancelBreathingPreparation = useCallback(() => {
    if (breathingPreparationTimeoutRef.current) {
      window.clearTimeout(breathingPreparationTimeoutRef.current);
      breathingPreparationTimeoutRef.current = null;
    }
    stopBreathingNarration();
    breathingPreparationStartedAtRef.current = null;
    breathingPreparationRemainingMsRef.current = 2200;
    setPreparationPaused(false);
    setPreparing(false);
  }, [stopBreathingNarration]);

  const resetBreathingSession = useCallback(() => {
    if (breathingPreparationTimeoutRef.current) {
      window.clearTimeout(breathingPreparationTimeoutRef.current);
      breathingPreparationTimeoutRef.current = null;
    }
    stopBreathingNarration();
    breathingPreparationStartedAtRef.current = null;
    breathingPreparationRemainingMsRef.current = 2200;
    roundRef.current = 1;
    phaseRef.current = 'in';
    cycleStartedRoundRef.current = 1;
    stepIndexRef.current = 0;
    remainingRef.current = breathingSteps[0]?.duration ?? selected.in ?? 0;
    setPreparing(false);
    setPreparationPaused(false);
    setRunning(false);
    setSessionCompleted(false);
    setRound(1);
    setCycleBadgeRound(1);
    setStepIndex(0);
    setPhase(breathingSteps[0]?.key || 'in');
    setRemaining(breathingSteps[0]?.duration ?? selected.in ?? 0);
    setSessionElapsedMs(0);
    sessionElapsedRef.current = 0;
  }, [breathingSteps, selected.in, stopBreathingNarration]);

  const skipBreathingPreparation = useCallback(() => {
    if (breathingPreparationTimeoutRef.current) {
      window.clearTimeout(breathingPreparationTimeoutRef.current);
      breathingPreparationTimeoutRef.current = null;
    }
    stopBreathingNarration();
    breathingPreparationStartedAtRef.current = null;
    breathingPreparationRemainingMsRef.current = 2200;
    setPreparationPaused(false);
    setPreparing(false);
    setSessionCompleted(false);
    setRunning(true);
  }, [stopBreathingNarration]);

  const toggleBreathingPreparationPause = useCallback(async () => {
    if (!preparing) return;

    if (defaultVoice !== 'nenhuma' && audioEnabled && breathingNarrationAudioRef.current) {
      if (preparationPaused) {
        try {
          await breathingNarrationAudioRef.current.play();
          setPreparationPaused(false);
        } catch {}
        return;
      }
      breathingNarrationAudioRef.current.pause();
      setPreparationPaused(true);
      return;
    }

    if (preparationPaused) {
      breathingPreparationStartedAtRef.current = Date.now();
      breathingPreparationTimeoutRef.current = window.setTimeout(
        completeSilentPreparation,
        breathingPreparationRemainingMsRef.current,
      );
      setPreparationPaused(false);
      return;
    }

    if (breathingPreparationTimeoutRef.current) {
      window.clearTimeout(breathingPreparationTimeoutRef.current);
      breathingPreparationTimeoutRef.current = null;
    }
    if (breathingPreparationStartedAtRef.current) {
      const elapsed = Date.now() - breathingPreparationStartedAtRef.current;
      breathingPreparationRemainingMsRef.current = Math.max(300, breathingPreparationRemainingMsRef.current - elapsed);
    }
    breathingPreparationStartedAtRef.current = null;
    setPreparationPaused(true);
  }, [audioEnabled, completeSilentPreparation, defaultVoice, preparationPaused, preparing]);

  const startBreathingSession = useCallback((skipPreparation = false) => {
    if (running || preparing) return;
    if (breathingPreparationTimeoutRef.current) {
      window.clearTimeout(breathingPreparationTimeoutRef.current);
      breathingPreparationTimeoutRef.current = null;
    }
    if (sessionCompleted) {
      roundRef.current = 1;
      phaseRef.current = 'in';
      cycleStartedRoundRef.current = 1;
      setRound(1);
      setCycleBadgeRound(1);
      setStepIndex(0);
      stepIndexRef.current = 0;
      setPhase(breathingSteps[0]?.key || 'in');
      setRemaining(breathingSteps[0]?.duration ?? selected.in ?? 0);
      remainingRef.current = breathingSteps[0]?.duration ?? selected.in ?? 0;
      setSessionElapsedMs(0);
      sessionElapsedRef.current = 0;
      setSessionCompleted(false);
      setRunning(true);
      return;
    }
    if (round > 1 || remaining !== (breathingSteps[0]?.duration ?? selected.in ?? 0)) {
      setRunning(true);
      return;
    }
    if (skipPreparation) {
      setSessionCompleted(false);
      setRunning(true);
      return;
    }
    setPreparing(true);
    setPreparationPaused(false);
    breathingPreparationRemainingMsRef.current = 2200;
    breathingPreparationStartedAtRef.current = Date.now();
    breathingPreparationTimeoutRef.current = window.setTimeout(() => {
      completeSilentPreparation();
    }, 2200);
    if (defaultVoice === 'nenhuma' || !audioEnabled) {
      return;
    }
    const prepNarration = [selectedGuidance.greeting, selectedGuidance.intro, ...selectedGuidance.items, 'Agora vamos iniciar.'].join(' ');
    playBreathingText(prepNarration, () => {
      completeSilentPreparation();
    });
  }, [audioEnabled, breathingSteps, completeSilentPreparation, defaultVoice, playBreathingText, preparing, remaining, round, running, selected.in, selectedGuidance, sessionCompleted]);

  const finishBreathingSession = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setRunning(false);
    setPreparing(false);
    setSessionCompleted(true);
    if (defaultVoice === 'nenhuma' || !audioEnabled) {
      finishingRef.current = false;
      onComplete?.();
      return;
    }
    playBreathingText(selectedGuidance.closing, () => {
      finishingRef.current = false;
      onComplete?.();
    });
  }, [audioEnabled, defaultVoice, onComplete, playBreathingText, selectedGuidance.closing]);

  const breathingPracticeActive =
    !preparing &&
    !sessionCompleted &&
    (running || sessionElapsedMs > 0 || round > 1 || remaining !== (breathingSteps[0]?.duration ?? selected.in ?? 0));

  useEffect(() => {
    if (!running || finishingRef.current) return;
    const t = setInterval(() => {
      sessionElapsedRef.current += 100;
      setSessionElapsedMs(sessionElapsedRef.current);
      const currentRemaining = remainingRef.current;
      if (currentRemaining > 0) {
        const nextRemaining = Math.max(0, Math.round((currentRemaining - 0.1) * 10) / 10);
        remainingRef.current = nextRemaining;
        setRemaining(nextRemaining);
        if (nextRemaining > 0) return;
      }

      const currentStepIndex = stepIndexRef.current;
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < breathingSteps.length) {
        const nextStep = breathingSteps[nextStepIndex];
        if (currentStepIndex === 0) {
          cycleStartedRoundRef.current = roundRef.current;
        }
        stepIndexRef.current = nextStepIndex;
        phaseRef.current = nextStep.key;
        remainingRef.current = nextStep.duration;
        setStepIndex(nextStepIndex);
        setPhase(nextStep.key);
        setRemaining(nextStep.duration);
        return;
      }

      const reachedTarget = !!selected.sessionTargetMs && sessionElapsedRef.current >= selected.sessionTargetMs;
      if (reachedTarget) {
        finishBreathingSession();
        return;
      }
      if (roundRef.current < selected.rounds) {
        const nextRound = roundRef.current + 1;
        const firstStep = breathingSteps[0];
        roundRef.current = nextRound;
        stepIndexRef.current = 0;
        phaseRef.current = firstStep.key;
        remainingRef.current = firstStep.duration;
        setRound(nextRound);
        setStepIndex(0);
        setPhase(firstStep.key);
        setRemaining(firstStep.duration);
        return;
      }
      finishBreathingSession();
    }, 100);
    return () => clearInterval(t);
  }, [breathingSteps, finishBreathingSession, running, selected.rounds, selected.sessionTargetMs]);

  useEffect(() => {
    if (!audioEnabled || !running) return;
    if (defaultVoice === 'nenhuma') return;
    const controller = new AbortController();
    const phrase = breathingSteps[stepIndex]?.speech || 'Respire';

    (async () => {
      try {
        if (breathingNarrationAudioRef.current) {
          breathingNarrationAudioRef.current.pause();
          breathingNarrationAudioRef.current.currentTime = 0;
        }
        const response = await fetch('/api/piper-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            text: phrase,
            gender: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
            voice: defaultVoice === 'feminino' ? 'pt-BR-FranciscaNeural' : 'pt-BR-AntonioNeural',
          }),
        });
        if (!response.ok) {
          await speakBrowserText(phrase, {
            voice: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
            volume: breathingAudioEnabledRef.current
              ? Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100))
              : 0,
          });
          return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        breathingNarrationAudioRef.current = audio;
        audio.volume = breathingAudioEnabledRef.current
          ? Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100))
          : 0;
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => URL.revokeObjectURL(url);
        await audio.play().catch(async () => {
          URL.revokeObjectURL(url);
          await speakBrowserText(phrase, {
            voice: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
            volume: breathingAudioEnabledRef.current
              ? Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100))
              : 0,
          });
        });
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          await speakBrowserText(phrase, {
            voice: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
            volume: breathingAudioEnabledRef.current
              ? Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100))
              : 0,
          });
        }
      }
    })();

    return () => {
      controller.abort();
      cancelBrowserSpeech();
    };
  }, [audioEnabled, running, stepIndex, breathingSteps, defaultVoice, audioSettings?.voiceVolume]);

  const phaseLabel = breathingSteps[stepIndex]?.label || 'Respire';
  const cycleBadgeLabel =
    !running && !sessionCompleted && round === 1 && remaining === (breathingSteps[0]?.duration ?? selected.in ?? 0)
      ? 'Preparação'
      : `Ciclo ${cycleBadgeRound} de ${selected.rounds}`;

  return (
    <div className="max-w-2xl mx-auto p-4 animate-fade-in pb-32">
      {activeTab === 'info' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => { setRunning(false); stopBreathingNarration(); onNavigateBack?.(); }} className={`p-3 rounded-2xl ${dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}`}>❮</button>
          </div>
          <SectionHeroCard
            darkMode={dm}
            eyebrow="Escolha sua prática"
            title="Respiração"
            description="Escolha o ritmo que combina com este momento e entre na prática com mais presença."
            icon="🌬️"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleProtocols.map((p) => (
              (() => {
                const tone = breathingToneClasses(p.id, selectedId === p.id);
                const docMeta = breathingDocRoutineById[p.id];
                return (
              <button
                key={p.id}
                onClick={() => { stopBreathingNarration(); setSelectedId(p.id); setActiveTab('pratica'); }}
                className={`p-5 rounded-[2rem] border text-left transition-all active:scale-95 group relative overflow-hidden ${tone.card}`}
              >
                <div className={`absolute -right-4 -bottom-4 text-7xl opacity-5 transition-transform group-hover:scale-125 ${selectedId === p.id ? 'opacity-10' : ''}`}>{p.emoji}</div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-2xl ${tone.icon}`}>{p.emoji}</span>
                  <span className="font-bold">{p.name}</span>
                </div>
                <p className={`text-xs ${tone.desc}`}>{docMeta?.cardDetail || p.desc}</p>
                <div className="flex gap-2 mt-3">
                  <span className={`text-[11px] px-2.5 py-1.5 rounded-full font-bold ${tone.chip}`}>
                    {p.customSteps?.length
                      ? p.customSteps.map((step) => step.duration).join('-')
                      : `${p.in}-${p.hold || 0}-${p.out}${'hold2' in p && (p as any).hold2 ? `-${(p as any).hold2}` : ''}`}
                  </span>
                  <span className={`text-[11px] px-2.5 py-1.5 rounded-full font-bold ${tone.chip}`}>
                    {summarizeBreathingCycles(docMeta?.cyclesLabel, p.rounds)}
                  </span>
                </div>
              </button>
                );
              })()
            ))}
          </div>
          {!hasUnlimitedAccess && lockedProtocols.length > 0 && (
            <div className={`rounded-[2rem] border p-5 ${dm ? 'border-fuchsia-900/35 bg-fuchsia-950/20 text-slate-100' : 'border-fuchsia-200 bg-fuchsia-50/80 text-slate-800'}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Biblioteca completa no Pro</p>
              <p className="mt-2 text-[14px] font-semibold leading-relaxed">
                No Pro, sua respiração ganha mais foco, sono, energia e regulação.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2.5">
                {lockedProtocolTeasers.map((item) => (
                  <div
                    key={item.id}
                    data-card-glyph="✨"
                    className={`sereno-ornament-card rounded-[1.5rem] border px-4 py-3.5 opacity-90 overflow-hidden ${
                      dm
                        ? 'border-fuchsia-900/25 bg-slate-950/35 text-slate-300'
                        : 'border-fuchsia-100 bg-white/75 text-slate-600'
                    }`}
                  >
                    <p className={`text-[14px] font-black ${dm ? 'text-slate-100' : 'text-slate-800'}`}>{item.title}</p>
                    <p className={`mt-1 text-[13px] font-semibold leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{item.detail}</p>
                  </div>
                ))}
              </div>
              <p className={`animate-shimmer mt-3 inline-flex rounded-2xl px-3 py-2 text-[12px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-fuchsia-900/25 text-fuchsia-200/90' : 'bg-fuchsia-100/90 text-fuchsia-700/90'}`}>
                +{lockedProtocols.length} práticas no Pro
              </p>
              <button onClick={() => onShowUpgrade?.()} className="animate-shimmer mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(217,70,239,0.28)] transition-all active:scale-95">
                Ver plano Pro
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12">
          <div className="flex w-full items-center justify-between mb-8">
            <button onClick={() => { setRunning(false); stopBreathingNarration(); setActiveTab('info'); }} className={`p-4 rounded-2xl ${dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500 shadow-sm'}`}>❮ Voltar</button>
            <div className={`px-5 py-2 rounded-full font-black text-xs tracking-widest uppercase ${dm ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              {cycleBadgeLabel}
            </div>
          </div>

          <div className="mb-5 text-center">
            <h2 className={`text-[1.85rem] leading-none font-[1000] tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>
              {selected.name}
            </h2>
          </div>

          <div className={`w-full rounded-[2.4rem] border px-5 py-5 ${dm ? 'border-white/10 bg-white/[0.04] text-slate-100' : 'border-slate-200 bg-white/90 text-slate-800 shadow-sm'}`}>
            <button
              type="button"
              onClick={() => setShowBreathingIntro((prev) => !prev)}
              className={`w-full flex items-center justify-between text-left rounded-[1.4rem] px-3 py-2.5 transition-colors ${dm ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
            >
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Antes de começar</p>
                <p className={`mt-1 text-sm font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Saudação e contexto da prática</p>
              </div>
              <span className={`text-base transition-transform ${showBreathingIntro ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {showBreathingIntro && (
              <div className={`mt-2 rounded-[1.4rem] px-3.5 py-3.5 ${dm ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                <h3 className="text-lg font-[1000] tracking-tight">{selectedGuidance.greeting}</h3>
                <p className={`text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{selectedGuidance.intro}</p>
                {selectedDocRoutine && (
                  <div className={`mt-3 rounded-[1.2rem] px-3.5 py-3 text-sm font-semibold leading-relaxed ${dm ? 'bg-white/[0.03] text-slate-200' : 'bg-white text-slate-700 border border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-1 ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>Nome oficial</p>
                    <p>{selectedDocRoutine.officialName}</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowBreathingPosture((prev) => !prev)}
              className={`mt-3 w-full flex items-center justify-between text-left rounded-[1.4rem] px-3 py-2.5 transition-colors ${dm ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
            >
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Como fazer</p>
                <p className={`mt-1 text-sm font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Postura, sequência e instruções da prática</p>
              </div>
              <span className={`text-base transition-transform ${showBreathingPosture ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {showBreathingPosture && (
              <div className="mt-2 space-y-2.5">
                {selectedDocRoutine && (
                  <div className={`rounded-[1.2rem] px-3.5 py-3 text-sm font-semibold leading-relaxed ${dm ? 'bg-white/[0.03] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-1 ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>Ciclos e sequência</p>
                    <p>{selectedDocRoutine.cyclesLabel}</p>
                    <p className={`mt-1 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{selectedDocRoutine.sequenceLabel}</p>
                  </div>
                )}
                {selectedGuidance.items.map((item) => (
                  <div key={item} className={`flex items-start gap-3 rounded-[1.2rem] px-3.5 py-3 text-sm font-semibold leading-relaxed ${dm ? 'bg-white/[0.03] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                    <span className={`mt-0.5 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedDocRoutine && (
              <>
                <button
                  type="button"
                  onClick={() => setShowBreathingCycleInfo((prev) => !prev)}
                  className={`mt-3 w-full flex items-center justify-between text-left rounded-[1.4rem] px-3 py-2.5 transition-colors ${dm ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
                >
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Início e fim do ciclo</p>
                    <p className={`mt-1 text-sm font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Como cada ciclo começa e termina</p>
                  </div>
                  <span className={`text-base transition-transform ${showBreathingCycleInfo ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                {showBreathingCycleInfo && (
                  <div className={`mt-2 rounded-[1.2rem] px-3.5 py-3 text-sm font-semibold leading-relaxed ${dm ? 'bg-white/[0.03] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                    <p>{selectedDocRoutine.startOfCycle}</p>
                    <p className={`mt-1 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{selectedDocRoutine.endOfCycle}</p>
                  </div>
                )}
              </>
            )}
            <p className={`mt-4 text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>A prática só começa quando você apertar o play. Se sentir tontura ou desconforto, pause e volte à respiração natural.</p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className={`absolute w-64 h-64 rounded-full border-2 border-indigo-500/20 transition-all duration-1000 ${running && phase === 'in' ? 'scale-[1.8] opacity-100' : 'scale-75 opacity-20'}`}></div>
            <div className={`absolute w-64 h-64 rounded-full border-4 border-indigo-500/10 transition-all duration-1000 ${running && phase === 'in' ? 'scale-[1.4] opacity-80' : 'scale-90 opacity-40'}`}></div>
            
            <div className={`w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-1000 z-10 ${
              !running ? 'bg-slate-200 scale-100 shadow-none' :
              phase === 'in' ? 'bg-indigo-600 scale-[1.3] shadow-indigo-500/40' :
              phase === 'hold' ? 'bg-emerald-500 scale-[1.3] shadow-emerald-500/30' :
              phase === 'out' ? 'bg-purple-600 scale-75 shadow-purple-500/40' :
              'bg-blue-500 scale-75 shadow-blue-500/30'
            }`}>
              <span className="text-white text-xs font-black tracking-widest uppercase mb-1 drop-shadow-md">{phaseLabel}</span>
              <span className="text-white text-5xl font-black tabular-nums drop-shadow-lg">{Math.ceil(remaining)}</span>
            </div>
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={() => (preparing ? cancelBreathingPreparation() : breathingPracticeActive ? resetBreathingSession() : startBreathingSession(false))}
              className={`w-full py-6 rounded-[2.5rem] text-xl font-black shadow-xl transition-all active:scale-95 ${
                preparing || breathingPracticeActive ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/30'
              }`}
            >
              {preparing ? 'Parar preparação' : breathingPracticeActive ? 'Parar prática' : 'Iniciar com preparação'}
            </button>
            {preparing ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleBreathingPreparationPause()}
                  className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${dm ? 'bg-slate-900/80 text-slate-300 border border-slate-700/80 hover:bg-slate-800' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 shadow-sm'}`}
                >
                  {preparationPaused ? 'Retomar preparação' : 'Pausar preparação'}
                </button>
                <button
                  onClick={() => skipBreathingPreparation()}
                  className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${dm ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 shadow-sm'}`}
                >
                  Pular preparação
                </button>
              </div>
            ) : (
              breathingPracticeActive ? (
                <button
                  onClick={() => setRunning((value) => !value)}
                  className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${dm ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20 hover:bg-cyan-500/20' : 'bg-cyan-50 text-cyan-900 border border-cyan-100 hover:bg-cyan-100 shadow-sm'}`}
                >
                  {running ? 'Pausar prática' : 'Retomar prática'}
                </button>
              ) : (
                <button onClick={() => startBreathingSession(true)} className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${dm ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 shadow-sm'}`}>
                  Pular preparação
                </button>
              )
            )}
          </div>

          <div className={`p-6 rounded-[2.5rem] w-full ${dm ? 'bg-slate-900/50' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border border-slate-200/80'}`}>
            <div className="space-y-2 text-center">
              <span className="text-[10px] uppercase font-black tracking-[0.18em] opacity-50 block">Áudio Guia</span>
              <button 
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all ${audioEnabled ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-400 border border-slate-200')}`}
              >
                {audioEnabled ? '🔊 Ativado' : '🔇 Desativado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MeditationSection = ({ darkMode: dm, onComplete, hasUnlimitedAccess = false, onShowUpgrade, defaultVoice = 'feminino', audioSettings, initialMode = 'guided', initialScriptId, onScriptChange }: any) => {
  const stripMeditationPauseTags = (raw: string) => raw.replace(/\(\d+\s*s\)/gi, ' ').replace(/\s+/g, ' ').trim();
  const splitMeditationSentences = (raw: string) =>
    (stripMeditationPauseTags(raw).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
      .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  const formatMeditationDurationLabel = (value: string) => value.replace(/\s*minutos?$/i, ' min');
  const buildMeditationDisplayText = (lines: string[]) => lines.map(stripMeditationPauseTags).filter(Boolean).join(' ');
  const buildMeditationNarrativePlan = (lines: string[]) => {
    const cues: Array<{ type: 'speech' | 'pause'; text?: string; pauseMs?: number; speechIndex?: number }> = [];
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      if (/^(primeira|segunda|terceira|quarta|quinta)\s+parte\b/i.test(trimmedLine)) continue;
      const exactPause = trimmedLine.match(/^\((\d+)s\)$/i);
      if (exactPause) {
        cues.push({ type: 'pause', pauseMs: Number(exactPause[1]) * 1000 });
        continue;
      }
      const parts = trimmedLine.split(/(\(\d+\s*s\))/gi).filter(Boolean);
      for (const part of parts) {
        const pauseMatch = part.match(/^\((\d+)s\)$/i);
        if (pauseMatch) {
          cues.push({ type: 'pause', pauseMs: Number(pauseMatch[1]) * 1000 });
        } else {
          const text = part.replace(/\s+/g, ' ').trim();
          if (text) cues.push({ type: 'speech', text });
        }
      }
    }
    return cues;
  };
  const combinedMeditationRoutines = [...meditationDocRoutines, ...meditationComplementaryDocRoutines];
  const combinedMeditationRoutineById = {
    ...meditationDocRoutineById,
    ...meditationComplementaryDocRoutineById,
  };
  const scripts = combinedMeditationRoutines.map((routine) => ({
    id: routine.id,
    title: routine.title,
    text: buildMeditationDisplayText(routine.meditation),
  }));
  const visibleScripts = hasUnlimitedAccess ? scripts : scripts.slice(0, 4);
  const lockedMeditationTeasers = [
    { id: 'focus-clarity', title: 'Foco e clareza', detail: 'Da meditação da respiração a sessões completas de mindfulness' },
    { id: 'self-kindness', title: 'Autocompaixão', detail: 'Pausas curtas e práticas profundas para se acolher melhor' },
    { id: 'grounding-presence', title: 'Corpo e presença', detail: 'Body scan, sons, respiração e consciência corporal com mais profundidade' },
    { id: 'deepening-use', title: 'Sono e emoções difíceis', detail: 'Práticas específicas para descanso, dor e desconfortos emocionais' },
  ];
  const meditationToneById: Record<string, 'sky' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'violet' | 'teal'> = {
    body_scan_short: 'emerald',
    breathing_meditation: 'sky',
    body_sound: 'teal',
    breathing_space_3m: 'sky',
    loving_kindness: 'rose',
    working_with_difficulties: 'violet',
    breath_sound_body: 'teal',
    sleep_body_scan: 'indigo',
    complete_meditation: 'teal',
    body_sound_breath_awareness: 'emerald',
    body_scan_deep: 'emerald',
    loving_kindness_deep: 'rose',
    difficulties_space: 'violet',
    singing_bowls: 'amber',
    mindfulness_10: 'sky',
    body_scan_15: 'emerald',
    self_compassion_break: 'rose',
    self_compassion_soft: 'rose',
    pain_warmth_space: 'violet',
    goodwill_breathing: 'teal',
    meditation_anxiety: 'sky',
    crisis_478: 'indigo',
    work_mindfulness: 'amber',
    gratitude: 'rose',
    focus_clarity_mental: 'amber',
    mindful_walking: 'emerald',
    forgiveness_meditation: 'violet',
    deep_relax_visualization: 'indigo',
  };
  const meditationToneClasses = (id: string) => {
    const tone = meditationToneById[id] || 'sky';
    return {
      sky: {
        card: dm ? 'bg-sky-950/28 border-sky-900/45 text-sky-100' : 'bg-gradient-to-br from-white via-sky-50 to-blue-50 border-sky-100 text-sky-900 shadow-sm',
        icon: dm ? 'bg-sky-500/12 text-sky-300' : 'bg-sky-100 text-sky-700',
        chip: dm ? 'bg-sky-500/12 text-sky-200' : 'bg-sky-100 text-sky-700',
        eyebrow: dm ? 'text-sky-300/85' : 'text-sky-700/80',
        detail: dm ? 'text-sky-200/72' : 'text-sky-800/72',
      },
      emerald: {
        card: dm ? 'bg-emerald-950/28 border-emerald-900/45 text-emerald-100' : 'bg-gradient-to-br from-white via-emerald-50 to-teal-50 border-emerald-100 text-emerald-900 shadow-sm',
        icon: dm ? 'bg-emerald-500/12 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
        chip: dm ? 'bg-emerald-500/12 text-emerald-200' : 'bg-emerald-100 text-emerald-700',
        eyebrow: dm ? 'text-emerald-300/85' : 'text-emerald-700/80',
        detail: dm ? 'text-emerald-200/72' : 'text-emerald-800/72',
      },
      amber: {
        card: dm ? 'bg-amber-950/28 border-amber-900/45 text-amber-100' : 'bg-gradient-to-br from-white via-amber-50 to-orange-50 border-amber-100 text-amber-900 shadow-sm',
        icon: dm ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-100 text-amber-700',
        chip: dm ? 'bg-amber-500/12 text-amber-200' : 'bg-amber-100 text-amber-700',
        eyebrow: dm ? 'text-amber-300/85' : 'text-amber-700/80',
        detail: dm ? 'text-amber-200/72' : 'text-amber-800/72',
      },
      indigo: {
        card: dm ? 'bg-indigo-950/28 border-indigo-900/45 text-indigo-100' : 'bg-gradient-to-br from-white via-indigo-50 to-violet-50 border-indigo-100 text-indigo-900 shadow-sm',
        icon: dm ? 'bg-indigo-500/12 text-indigo-300' : 'bg-indigo-100 text-indigo-700',
        chip: dm ? 'bg-indigo-500/12 text-indigo-200' : 'bg-indigo-100 text-indigo-700',
        eyebrow: dm ? 'text-indigo-300/85' : 'text-indigo-700/80',
        detail: dm ? 'text-indigo-200/72' : 'text-indigo-800/72',
      },
      rose: {
        card: dm ? 'bg-rose-950/28 border-rose-900/45 text-rose-100' : 'bg-gradient-to-br from-white via-rose-50 to-pink-50 border-rose-100 text-rose-900 shadow-sm',
        icon: dm ? 'bg-rose-500/12 text-rose-300' : 'bg-rose-100 text-rose-700',
        chip: dm ? 'bg-rose-500/12 text-rose-200' : 'bg-rose-100 text-rose-700',
        eyebrow: dm ? 'text-rose-300/85' : 'text-rose-700/80',
        detail: dm ? 'text-rose-200/72' : 'text-rose-800/72',
      },
      violet: {
        card: dm ? 'bg-violet-950/28 border-violet-900/45 text-violet-100' : 'bg-gradient-to-br from-white via-violet-50 to-fuchsia-50 border-violet-100 text-violet-900 shadow-sm',
        icon: dm ? 'bg-violet-500/12 text-violet-300' : 'bg-violet-100 text-violet-700',
        chip: dm ? 'bg-violet-500/12 text-violet-200' : 'bg-violet-100 text-violet-700',
        eyebrow: dm ? 'text-violet-300/85' : 'text-violet-700/80',
        detail: dm ? 'text-violet-200/72' : 'text-violet-800/72',
      },
      teal: {
        card: dm ? 'bg-teal-950/28 border-teal-900/45 text-teal-100' : 'bg-gradient-to-br from-white via-teal-50 to-cyan-50 border-teal-100 text-teal-900 shadow-sm',
        icon: dm ? 'bg-teal-500/12 text-teal-300' : 'bg-teal-100 text-teal-700',
        chip: dm ? 'bg-teal-500/12 text-teal-200' : 'bg-teal-100 text-teal-700',
        eyebrow: dm ? 'text-teal-300/85' : 'text-teal-700/80',
        detail: dm ? 'text-teal-200/72' : 'text-teal-800/72',
      },
    }[tone];
  };
  const meditationMetaById: Record<string, { icon: string; eyebrow: string; detail: string; duration: string }> = {
    body_scan_short: { icon: '🪶', eyebrow: 'Corpo', detail: 'Um body scan breve para voltar ao corpo com leveza.', duration: formatMeditationDurationLabel(meditationDocRoutineById.body_scan_short.durationLabel) },
    breathing_meditation: { icon: '🫁', eyebrow: 'Respiração', detail: 'Treinar presença simples com o ar entrando e saindo.', duration: formatMeditationDurationLabel(meditationDocRoutineById.breathing_meditation.durationLabel) },
    body_sound_short: { icon: '🔔', eyebrow: 'Sons', detail: 'Abrir a atenção para corpo e ambiente sem se perder.', duration: formatMeditationDurationLabel(meditationDocRoutineById.body_sound_short.durationLabel) },
    breathing_exercise_3: { icon: '🌬️', eyebrow: 'Pausa', detail: 'Uma pausa curta para reduzir sobrecarga e retomar centro.', duration: formatMeditationDurationLabel(meditationDocRoutineById.breathing_exercise_3.durationLabel) },
    loving_kindness: { icon: '💗', eyebrow: 'Afeto', detail: 'Cultivar cuidado, conexão e desejo de bem.', duration: formatMeditationDurationLabel(meditationDocRoutineById.loving_kindness.durationLabel) },
    working_difficulties: { icon: '🪨', eyebrow: 'Emoções', detail: 'Estar com desconfortos de forma mais estável.', duration: formatMeditationDurationLabel(meditationDocRoutineById.working_difficulties.durationLabel) },
    breath_sound_body: { icon: '🌊', eyebrow: 'Presença ampla', detail: 'Respiração, sons e corpo em atenção aberta.', duration: formatMeditationDurationLabel(meditationDocRoutineById.breath_sound_body.durationLabel) },
    body_scan_sleep: { icon: '🌙', eyebrow: 'Sono', detail: 'Preparar o corpo para descansar sem esforço.', duration: formatMeditationDurationLabel(meditationDocRoutineById.body_scan_sleep.durationLabel) },
    complete_meditation: { icon: '🧘', eyebrow: 'Completa', detail: 'Uma sessão mais longa para aprofundar a prática.', duration: formatMeditationDurationLabel(meditationDocRoutineById.complete_meditation.durationLabel) },
    body_awareness_sound_breath: { icon: '✨', eyebrow: 'Consciência', detail: 'Circular entre corpo, som e respiração com clareza.', duration: formatMeditationDurationLabel(meditationDocRoutineById.body_awareness_sound_breath.durationLabel) },
    body_scan_deep: { icon: '🧍', eyebrow: 'Body scan', detail: 'Percorrer o corpo com mais tempo e detalhe.', duration: formatMeditationDurationLabel(meditationDocRoutineById.body_scan_deep.durationLabel) },
    loving_kindness_deep: { icon: '💞', eyebrow: 'Bondade', detail: 'Expandir compaixão por você e pelos outros.', duration: formatMeditationDurationLabel(meditationDocRoutineById.loving_kindness_deep.durationLabel) },
    working_difficulties_deep: { icon: '🌫️', eyebrow: 'Espaço interno', detail: 'Ficar com emoções difíceis com mais margem.', duration: formatMeditationDurationLabel(meditationDocRoutineById.working_difficulties_deep.durationLabel) },
    tibetan_bowls: { icon: '🔔', eyebrow: 'Som', detail: 'Usar a ressonância como eixo contemplativo.', duration: formatMeditationDurationLabel(meditationDocRoutineById.tibetan_bowls.durationLabel) },
    mindfulness_10: { icon: '🎯', eyebrow: 'Mindfulness', detail: 'Uma prática clássica e objetiva de presença.', duration: formatMeditationDurationLabel(meditationDocRoutineById.mindfulness_10.durationLabel) },
    body_scan_15: { icon: '🛏️', eyebrow: 'Relaxamento', detail: 'Escuta mais demorada do corpo e das tensões.', duration: formatMeditationDurationLabel(meditationDocRoutineById.body_scan_15.durationLabel) },
    self_compassion_break: { icon: '🤍', eyebrow: 'Autocompaixão', detail: 'Uma pausa curta para se tratar com mais gentileza.', duration: formatMeditationDurationLabel(meditationDocRoutineById.self_compassion_break.durationLabel) },
    tender_self_compassion: { icon: '🫶', eyebrow: 'Acolhimento', detail: 'Conforto e suavidade para momentos sensíveis.', duration: formatMeditationDurationLabel(meditationDocRoutineById.tender_self_compassion.durationLabel) },
    space_warmth_pain: { icon: '🕯️', eyebrow: 'Dor', detail: 'Mais espaço e calor interno para atravessar dor.', duration: formatMeditationDurationLabel(meditationDocRoutineById.space_warmth_pain.durationLabel) },
    breathing_goodwill: { icon: '🌤️', eyebrow: 'Boa vontade', detail: 'Respirar apreciação, compaixão e abertura.', duration: formatMeditationDurationLabel(meditationDocRoutineById.breathing_goodwill.durationLabel) },
    anxiety_meditation: { icon: '🫂', eyebrow: 'Ansiedade', detail: 'Grounding e respiração reguladora para momentos de ansiedade.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.anxiety_meditation.durationLabel) },
    crisis_breathing_478: { icon: '🚨', eyebrow: 'Crise', detail: 'Protocolo 4-7-8 guiado para desacelerar em crise.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.crisis_breathing_478.durationLabel) },
    mindfulness_work: { icon: '💼', eyebrow: 'Trabalho', detail: 'Uma micro-pausa consciente para foco e regulação no trabalho.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.mindfulness_work.durationLabel) },
    gratitude_meditation: { icon: '🌟', eyebrow: 'Gratidão', detail: 'Ampliar a percepção do que já está vivo e bom no seu dia.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.gratitude_meditation.durationLabel) },
    focus_clarity_mental: { icon: '🧠', eyebrow: 'Clareza', detail: 'Respiração e visualização para clarear a mente antes de agir.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.focus_clarity_mental.durationLabel) },
    mindful_walking: { icon: '🚶', eyebrow: 'Movimento', detail: 'Transformar a caminhada em meditação com presença no corpo.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.mindful_walking.durationLabel) },
    forgiveness_meditation: { icon: '🕊️', eyebrow: 'Perdão', detail: 'Uma prática profunda para aliviar culpa, mágoa e peso interno.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.forgiveness_meditation.durationLabel) },
    deep_relaxation_visualization: { icon: '🏞️', eyebrow: 'Visualização', detail: 'Criar um refúgio interno de paz com relaxamento profundo.', duration: formatMeditationDurationLabel(meditationComplementaryDocRoutineById.deep_relaxation_visualization.durationLabel) },
  };

  const [selected, setSelected] = useState(
    visibleScripts.find((script) => script.id === initialScriptId) || visibleScripts[0],
  );
  const [speaking, setSpeaking] = useState(false);
  const [meditationSessionPaused, setMeditationSessionPaused] = useState(false);
  const [view, setView] = useState<'library' | 'session' | 'free'>(initialMode === 'free' ? 'free' : 'library');
  const [meditationStage, setMeditationStage] = useState<'idle' | 'preparing' | 'active' | 'closing'>('idle');
  const [meditationPreparationPaused, setMeditationPreparationPaused] = useState(false);
  const [countdownMs, setCountdownMs] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeNarrationSentence, setActiveNarrationSentence] = useState<string | null>(null);
  const [activeNarrationIndex, setActiveNarrationIndex] = useState<number | null>(null);
  const [activeNarrationProgress, setActiveNarrationProgress] = useState(0);
  const [showFullMeditationText, setShowFullMeditationText] = useState(false);
  const [showMeditationIntro, setShowMeditationIntro] = useState(false);
  const [showMeditationPosture, setShowMeditationPosture] = useState(false);
  const [showMeditationAmbient, setShowMeditationAmbient] = useState(false);
  const [activeMeditationAmbient, setActiveMeditationAmbient] = useState<string | null>(null);
  const [savedMeditationMixes, setSavedMeditationMixes] = useState<NatureMixPreset[]>([]);
  const meditationAudioRef = useRef<HTMLAudioElement | null>(null);
  const meditationAudioEnabledRef = useRef(audioEnabled && defaultVoice !== 'nenhuma');
  const meditationProgressRafRef = useRef<number | null>(null);
  const meditationRunIdRef = useRef(0);
  const meditationPreloadedUrlsRef = useRef<string[]>([]);
  const meditationPauseTimeoutRef = useRef<number | null>(null);
  const meditationPauseResolveRef = useRef<(() => void) | null>(null);
  const meditationPauseRemainingMsRef = useRef(0);
  const meditationPauseStartedAtRef = useRef<number | null>(null);
  const meditationSegmentResolveRef = useRef<(() => void) | null>(null);
  const meditationCountdownIntervalRef = useRef<number | null>(null);
  const meditationSilentTimeoutRef = useRef<number | null>(null);
  const meditationPreparationSilentTimeoutRef = useRef<number | null>(null);
  const meditationPreparationRemainingMsRef = useRef(2200);
  const meditationPreparationStartedAtRef = useRef<number | null>(null);
  const meditationAmbientAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const meditationIntentById: Record<string, string> = {
    body_scan_short: 'Corpo',
    breathing_meditation: 'Respiração',
    body_sound_short: 'Sons',
    breathing_exercise_3: 'Pausa',
    loving_kindness: 'Afeto',
    working_difficulties: 'Emoções',
    breath_sound_body: 'Presença',
    body_scan_sleep: 'Sono',
    complete_meditation: 'Completa',
    body_awareness_sound_breath: 'Consciência',
    body_scan_deep: 'Body scan',
    loving_kindness_deep: 'Bondade',
    working_difficulties_deep: 'Espaço interno',
    tibetan_bowls: 'Som',
    mindfulness_10: 'Mindfulness',
    body_scan_15: 'Relaxamento',
    self_compassion_break: 'Autocompaixão',
    tender_self_compassion: 'Acolhimento',
    space_warmth_pain: 'Dor',
    breathing_goodwill: 'Boa vontade',
    anxiety_meditation: 'Ansiedade',
    crisis_breathing_478: 'Crise',
    mindfulness_work: 'Trabalho',
    gratitude_meditation: 'Gratidão',
    focus_clarity_mental: 'Clareza',
    mindful_walking: 'Movimento',
    forgiveness_meditation: 'Perdão',
    deep_relaxation_visualization: 'Visualização',
  };
  const selectedRoutine = combinedMeditationRoutineById[selected.id];
  const meditationNarrationLines = useMemo(
    () =>
      buildMeditationNarrativePlan(selectedRoutine?.meditation || [])
        .filter((cue) => cue.type === 'speech' && cue.text)
        .map((cue) => cue.text as string),
    [selectedRoutine],
  );
  const previousMeditationLine = activeNarrationIndex !== null ? meditationNarrationLines[activeNarrationIndex - 1] || null : null;
  const currentMeditationLine = activeNarrationIndex !== null ? meditationNarrationLines[activeNarrationIndex] : null;
  const nextMeditationLine = activeNarrationIndex !== null ? meditationNarrationLines[activeNarrationIndex + 1] || null : meditationNarrationLines[0] || null;
  const selectedIntent = meditationIntentById[selected.id] || 'Presença';
  const selectedMeta = meditationMetaById[selected.id] || meditationMetaById.body_scan_short;
  const meditationAmbientPresets = useMemo(
    () => [
      { id: 'med-calma-azul', name: 'Calma Azul', emoji: '🌊', mix: { mar1: 58, vento1: 26, riacho4: 18 } as Record<string, number> },
      { id: 'med-floresta-suave', name: 'Floresta Suave', emoji: '🌿', mix: { floresta1: 46, passaro1: 18, riacho2: 20 } as Record<string, number> },
      { id: 'med-noite-serena', name: 'Noite Serena', emoji: '🌙', mix: { noite1: 40, grilo1: 18, vento2: 16 } as Record<string, number> },
      { id: 'med-templo-leve', name: 'Templo Leve', emoji: '🕯️', mix: { sino1: 16, riacho1: 32, vento1: 14 } as Record<string, number> },
    ],
    [],
  );
  const meditationFavoriteMixes = useMemo(() => loadAmbientFavoriteMixOptions(), [savedMeditationMixes]);
  const parseMeditationDurationToMs = (value: string) => {
    if (!value) return 5 * 60 * 1000;
    if (value.includes(':')) {
      const [minutes, seconds] = value.split(':').map((part) => Number(part) || 0);
      return ((minutes * 60) + seconds) * 1000;
    }
    return (Number(value.replace(/[^\d]/g, '')) || 5) * 60 * 1000;
  };
  const formatMeditationClock = (ms: number) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };
  const stopMeditationCountdown = useCallback((preserveRemaining = false) => {
    if (meditationCountdownIntervalRef.current) {
      window.clearInterval(meditationCountdownIntervalRef.current);
      meditationCountdownIntervalRef.current = null;
    }
    if (meditationSilentTimeoutRef.current) {
      window.clearTimeout(meditationSilentTimeoutRef.current);
      meditationSilentTimeoutRef.current = null;
    }
    if (!preserveRemaining) {
      setCountdownMs(0);
    }
  }, []);
  const startMeditationCountdown = useCallback((durationMs: number) => {
    stopMeditationCountdown();
    setCountdownMs(durationMs);
    const target = Date.now() + durationMs;
    meditationCountdownIntervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, target - Date.now());
      setCountdownMs(remaining);
      if (remaining <= 0 && meditationCountdownIntervalRef.current) {
        window.clearInterval(meditationCountdownIntervalRef.current);
        meditationCountdownIntervalRef.current = null;
      }
    }, 250);
  }, [stopMeditationCountdown]);
  const stopMeditationAmbient = useCallback(() => {
    Object.values(meditationAmbientAudioRefs.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    meditationAmbientAudioRefs.current = {};
    setActiveMeditationAmbient(null);
  }, []);
  const playMeditationAmbient = useCallback((presetId: string, mix: Record<string, number>) => {
    if (activeMeditationAmbient === presetId) {
      stopMeditationAmbient();
      return;
    }
    stopMeditationAmbient();
    const baseVolume = (audioSettings?.musicVolume ?? 50) / 100;
    Object.entries(mix)
      .filter(([, volume]) => volume > 0)
      .forEach(([soundId, soundVolume]) => {
        const track = natureMixerTracks.find((item) => item.id === soundId);
        if (!track) return;
        const audio = new Audio(encodeURI(track.src));
        audio.loop = true;
        audio.volume = Math.max(0.04, Math.min(1, baseVolume * (soundVolume / 100)));
        audio.play().catch(() => {});
        meditationAmbientAudioRefs.current[soundId] = audio;
      });
    setActiveMeditationAmbient(presetId);
  }, [activeMeditationAmbient, audioSettings?.musicVolume, stopMeditationAmbient]);
  const stopMeditationAudio = useCallback((options?: { stopAmbient?: boolean }) => {
    meditationRunIdRef.current += 1;
    if (meditationProgressRafRef.current) {
      window.cancelAnimationFrame(meditationProgressRafRef.current);
      meditationProgressRafRef.current = null;
    }
    if (meditationPreloadedUrlsRef.current.length) {
      meditationPreloadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      meditationPreloadedUrlsRef.current = [];
    }
    if (meditationPauseTimeoutRef.current) {
      window.clearTimeout(meditationPauseTimeoutRef.current);
      meditationPauseTimeoutRef.current = null;
    }
    if (meditationPauseResolveRef.current) {
      meditationPauseResolveRef.current();
      meditationPauseResolveRef.current = null;
    }
    if (meditationAudioRef.current) {
      meditationAudioRef.current.pause();
      meditationAudioRef.current.currentTime = 0;
      meditationAudioRef.current = null;
    }
    if (meditationSegmentResolveRef.current) {
      meditationSegmentResolveRef.current();
      meditationSegmentResolveRef.current = null;
    }
    if (meditationPreparationSilentTimeoutRef.current) {
      window.clearTimeout(meditationPreparationSilentTimeoutRef.current);
      meditationPreparationSilentTimeoutRef.current = null;
    }
    meditationPreparationRemainingMsRef.current = 2200;
    meditationPreparationStartedAtRef.current = null;
    stopMeditationCountdown();
    if (options?.stopAmbient !== false) {
      stopMeditationAmbient();
    }
    setMeditationStage('idle');
    setMeditationPreparationPaused(false);
    setMeditationSessionPaused(false);
    setActiveNarrationSentence(null);
    setActiveNarrationIndex(null);
    setActiveNarrationProgress(0);
    setSpeaking(false);
  }, [stopMeditationAmbient, stopMeditationCountdown]);

  useEffect(() => {
    meditationAudioEnabledRef.current = audioEnabled && defaultVoice !== 'nenhuma';
    if (!meditationAudioRef.current) return;
    meditationAudioRef.current.volume = meditationAudioEnabledRef.current
      ? Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100))
      : 0;
  }, [audioEnabled, audioSettings?.voiceVolume, defaultVoice]);

  const meditationGuidanceById: Record<string, { greeting: string; intro: string; items: string[]; closing: string }> = Object.fromEntries(
    combinedMeditationRoutines.map((routine) => [
      routine.id,
      {
        greeting: routine.greeting[0] || routine.title,
        intro: [...routine.greeting.slice(1), ...routine.intro].join(' '),
        items: routine.posture,
        closing: routine.closing.join(' '),
      },
    ]),
  );
  const meditationStaticAudioById: Record<string, ReturnType<typeof buildRoutineStaticAudioAssets>> = Object.fromEntries(
    combinedMeditationRoutines.map((routine) => [routine.id, buildRoutineStaticAudioAssets('meditation-doc', routine.id)]),
  );

  useEffect(() => {
    if (!visibleScripts.some((script) => script.id === selected.id)) {
      setSelected(visibleScripts[0]);
      setView('library');
    }
  }, [selected.id, visibleScripts]);

  useEffect(() => {
    if (!initialScriptId) return;
    const nextSelected = visibleScripts.find((script) => script.id === initialScriptId);
    if (nextSelected && nextSelected.id !== selected.id) {
      setSelected(nextSelected);
    }
  }, [initialScriptId, selected.id, visibleScripts]);

  useEffect(() => {
    onScriptChange?.(selected.id);
  }, [onScriptChange, selected.id]);

  useEffect(() => {
    setView(initialMode === 'free' ? 'free' : 'library');
  }, [initialMode]);

  useEffect(() => {
    setShowFullMeditationText(false);
    setShowMeditationIntro(false);
    setShowMeditationPosture(false);
    setActiveNarrationIndex(null);
    setActiveNarrationProgress(0);
  }, [selected.id]);

  useEffect(() => {
    setSavedMeditationMixes(loadNatureMixPresets());
    const syncPresets = () => setSavedMeditationMixes(loadNatureMixPresets());
    window.addEventListener('nature-mix-presets-updated', syncPresets);
    return () => window.removeEventListener('nature-mix-presets-updated', syncPresets);
  }, []);

  useEffect(() => {
    return () => {
      stopMeditationAudio();
    };
  }, [stopMeditationAudio]);

  useEffect(() => {
    if (view !== 'session') {
      stopMeditationAudio();
      setShowMeditationAmbient(false);
    }
  }, [view, stopMeditationAudio]);

  const play = async (skipPreparation = false, allowWhileBusy = false) => {
    if (!selected.text?.trim()) return;
    if (speaking && !allowWhileBusy) {
      stopMeditationAudio();
      return;
    }
    setMeditationSessionPaused(false);
    const guidance = meditationGuidanceById[selected.id];
    const routine = combinedMeditationRoutineById[selected.id];
    const preparationSentences = skipPreparation
      ? []
      : [guidance.greeting, guidance.intro, ...guidance.items, 'Agora vamos iniciar.']
          .flatMap((block) => splitMeditationSentences(block));
    const meditationSentences = buildMeditationNarrativePlan(routine?.meditation || [])
      .filter((cue) => cue.type === 'speech' && cue.text)
      .map((cue) => cue.text as string);
    const closingSentences = splitMeditationSentences(guidance.closing);
    if (!meditationSentences.length) return;
    const targetMs = parseMeditationDurationToMs(selectedMeta.duration);
    if (!audioEnabled || defaultVoice === 'nenhuma') {
      stopMeditationAudio({ stopAmbient: false });
      if (preparationSentences.length) {
        setMeditationStage('preparing');
        setMeditationPreparationPaused(false);
        setActiveNarrationSentence(null);
        setActiveNarrationIndex(null);
        setActiveNarrationProgress(0);
        meditationPreparationRemainingMsRef.current = 2200;
        meditationPreparationStartedAtRef.current = Date.now();
        meditationPreparationSilentTimeoutRef.current = window.setTimeout(() => {
          meditationPreparationSilentTimeoutRef.current = null;
          meditationPreparationStartedAtRef.current = null;
          setMeditationStage('active');
          setActiveNarrationSentence(null);
          setActiveNarrationProgress(0);
          startMeditationCountdown(targetMs);
          setSpeaking(true);
          meditationSilentTimeoutRef.current = window.setTimeout(() => {
            meditationSilentTimeoutRef.current = null;
            setSpeaking(false);
            setMeditationStage('idle');
            setActiveNarrationSentence(null);
            setActiveNarrationIndex(null);
            stopMeditationCountdown();
            onComplete?.();
          }, targetMs);
        }, meditationPreparationRemainingMsRef.current);
        return;
      }
      setSpeaking(true);
      setMeditationStage('active');
      setMeditationPreparationPaused(false);
      setActiveNarrationSentence(null);
      setActiveNarrationProgress(0);
      startMeditationCountdown(targetMs);
      meditationSilentTimeoutRef.current = window.setTimeout(() => {
        meditationSilentTimeoutRef.current = null;
        setSpeaking(false);
        setMeditationStage('idle');
        setActiveNarrationSentence(null);
        setActiveNarrationIndex(null);
        stopMeditationCountdown();
        onComplete?.();
      }, targetMs);
      return;
    }
    const staticAssets = meditationStaticAudioById[selected.id];
    const selectedVoiceKey = defaultVoice === 'masculino' ? 'masculino' : 'feminino';

    const tryPlayStaticMeditation = async () => {
      const currentRunId = meditationRunIdRef.current;
      const volume = Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100));
      const mainAudioSrc = selectedVoiceKey === 'feminino'
        ? staticAssets?.audio?.feminino
        : (staticAssets?.audio?.masculino || staticAssets?.audio?.feminino);
      const introAudioSrc = selectedVoiceKey === 'feminino'
        ? staticAssets?.guidedAudio?.preparation?.feminino
        : (staticAssets?.guidedAudio?.preparation?.masculino || staticAssets?.guidedAudio?.preparation?.feminino);
      const closingAudioSrc = selectedVoiceKey === 'feminino'
        ? staticAssets?.guidedAudio?.closing?.feminino
        : (staticAssets?.guidedAudio?.closing?.masculino || staticAssets?.guidedAudio?.closing?.feminino);

      if (!mainAudioSrc) return false;

      const playAudioUrl = async (url: string, options?: { stage?: 'preparing' | 'active' | 'closing' }) => {
        if (meditationRunIdRef.current !== currentRunId) return false;
        return await new Promise<boolean>((resolve) => {
          const audio = new Audio(url);
          meditationAudioRef.current = audio;
          audio.volume = meditationAudioEnabledRef.current ? volume : 0;
          if (options?.stage) {
            setMeditationStage(options.stage);
          }
          let settled = false;
          const finalize = (success: boolean) => {
            if (settled) return;
            settled = true;
            if (meditationProgressRafRef.current) {
              window.cancelAnimationFrame(meditationProgressRafRef.current);
              meditationProgressRafRef.current = null;
            }
            if (meditationAudioRef.current === audio) meditationAudioRef.current = null;
            resolve(success);
          };
          const tickProgress = () => {
            if (meditationAudioRef.current !== audio) return;
            const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            const progress = duration > 0 ? Math.max(0, Math.min(1, audio.currentTime / duration)) : 0;
            setActiveNarrationProgress(progress);
            if (!audio.paused && !audio.ended) {
              meditationProgressRafRef.current = window.requestAnimationFrame(tickProgress);
            }
          };

          audio.onloadedmetadata = () => {
            if (options?.stage === 'active') {
              startMeditationCountdown(Math.max(targetMs, Math.round((audio.duration || 0) * 1000)));
            }
          };
          audio.onplay = () => {
            if (options?.stage === 'active') {
              meditationProgressRafRef.current = window.requestAnimationFrame(tickProgress);
            }
          };
          audio.onended = () => finalize(true);
          audio.onerror = () => finalize(false);
          audio.play().catch(() => finalize(false));
        });
      };

      stopMeditationAudio({ stopAmbient: false });
      setSpeaking(true);
      setMeditationSessionPaused(false);
      setMeditationPreparationPaused(false);
      setActiveNarrationSentence(null);
      setActiveNarrationIndex(null);
      setActiveNarrationProgress(0);

      if (!skipPreparation && introAudioSrc) {
        const introOk = await playAudioUrl(introAudioSrc, { stage: 'preparing' });
        if (!introOk) return false;
      }

      const mainOk = await playAudioUrl(mainAudioSrc, { stage: 'active' });
      if (!mainOk) return false;

      if (closingAudioSrc) {
        const closingOk = await playAudioUrl(closingAudioSrc, { stage: 'closing' });
        if (!closingOk) return false;
      }

      if (meditationRunIdRef.current === currentRunId) {
        stopMeditationCountdown();
        setSpeaking(false);
        setMeditationStage('idle');
        setActiveNarrationSentence(null);
        setActiveNarrationIndex(null);
        setActiveNarrationProgress(0);
        onComplete?.();
      }
      return true;
    };

    // On web deploy, the static meditation assets are less reliable than the live/browser narration path.
    // Skip them here so the session always follows the same runtime narration flow.

    let speechIndex = 0;
    const narrativePlan: Array<{ type: 'speech' | 'pause'; text?: string; pauseMs?: number; speechIndex?: number }> = buildMeditationNarrativePlan(routine?.meditation || []).map((cue) =>
      cue.type === 'speech'
        ? { ...cue, speechIndex: speechIndex++ }
        : cue,
    );
    try {
      stopMeditationAudio({ stopAmbient: false });
      const currentRunId = meditationRunIdRef.current;
      const voice = defaultVoice === 'feminino' ? 'pt-BR-FranciscaNeural' : 'pt-BR-AntonioNeural';
      const gender = defaultVoice === 'feminino' ? 'feminino' : 'masculino';
      const volume = Math.max(0, Math.min(1, Number(audioSettings?.voiceVolume ?? 80) / 100));
      setSpeaking(true);
      setMeditationStage(preparationSentences.length ? 'preparing' : 'active');

      const preloadNarrativePromise = Promise.all(
        narrativePlan.map(async (cue) => {
          if (cue.type !== 'speech' || !cue.text) return cue;
          try {
            const response = await fetch('/api/piper-tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: cue.text, gender, voice }),
            });
            if (!response.ok) {
              return { ...cue, durationMs: Math.max(1000, cue.text!.split(/\s+/).filter(Boolean).length * 340) };
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            meditationPreloadedUrlsRef.current.push(url);
            const durationMs = await new Promise<number>((resolve) => {
              const probe = new Audio(url);
              const finalize = () => {
                const duration = Number.isFinite(probe.duration) && probe.duration > 0 ? probe.duration * 1000 : Math.max(1000, cue.text!.split(/\s+/).filter(Boolean).length * 340);
                probe.src = '';
                resolve(duration);
              };
              probe.onloadedmetadata = finalize;
              probe.onerror = finalize;
            });
            return { ...cue, audioUrl: url, durationMs };
          } catch {
            return { ...cue, durationMs: Math.max(1000, cue.text!.split(/\s+/).filter(Boolean).length * 340) };
          }
        }),
      );

      const playCue = async (text: string, narrationIndex: number | null = null, preloaded?: { audioUrl?: string }) => {
        if (meditationRunIdRef.current !== currentRunId) return false;
        setActiveNarrationSentence(text);
        setActiveNarrationIndex(narrationIndex);
        setActiveNarrationProgress(0);
        let url = preloaded?.audioUrl;
        let shouldRevokeUrl = false;
        if (!url) {
          try {
            const response = await fetch('/api/piper-tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, gender, voice }),
            });
            if (!response.ok || meditationRunIdRef.current !== currentRunId) {
              const spoken = await speakBrowserText(text, {
                voice: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
                volume,
              });
              return spoken;
            }
            const blob = await response.blob();
            url = URL.createObjectURL(blob);
            shouldRevokeUrl = true;
          } catch {
            const spoken = await speakBrowserText(text, {
              voice: defaultVoice === 'feminino' ? 'feminino' : 'masculino',
              volume,
            });
            return spoken;
          }
        }

        await new Promise<void>((resolve) => {
          meditationSegmentResolveRef.current = resolve;
          const audio = new Audio(url);
          meditationAudioRef.current = audio;
          audio.volume = meditationAudioEnabledRef.current ? volume : 0;
          const tickProgress = () => {
            if (meditationAudioRef.current !== audio) return;
            const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            const progress = duration > 0 ? Math.max(0, Math.min(1, audio.currentTime / duration)) : 0;
            setActiveNarrationProgress(progress);
            if (!audio.paused && !audio.ended) {
              meditationProgressRafRef.current = window.requestAnimationFrame(tickProgress);
            }
          };
          let settled = false;
          const finalize = () => {
            if (settled) return;
            settled = true;
            if (meditationProgressRafRef.current) {
              window.cancelAnimationFrame(meditationProgressRafRef.current);
              meditationProgressRafRef.current = null;
            }
            setActiveNarrationProgress(1);
            if (shouldRevokeUrl && url) {
              URL.revokeObjectURL(url);
            }
            if (meditationAudioRef.current === audio) meditationAudioRef.current = null;
            if (meditationSegmentResolveRef.current === resolve) {
              meditationSegmentResolveRef.current = null;
            }
            resolve();
          };
          audio.onended = finalize;
          audio.onerror = finalize;
          audio.onloadedmetadata = () => {
            if (!audio.paused) {
              meditationProgressRafRef.current = window.requestAnimationFrame(tickProgress);
            }
          };
          audio.play().then(() => {
            meditationProgressRafRef.current = window.requestAnimationFrame(tickProgress);
          }).catch(finalize);
        });

        return meditationRunIdRef.current === currentRunId;
      };

      for (let index = 0; index < preparationSentences.length; index += 1) {
        const ok = await playCue(preparationSentences[index]);
        if (!ok) return;
      }

      if (meditationRunIdRef.current !== currentRunId) return;
      const preparedNarrativePlan = await preloadNarrativePromise;
      if (meditationRunIdRef.current !== currentRunId) return;
      const speechTotalMs = preparedNarrativePlan.reduce((sum, cue) => {
        if (cue.type === 'pause') return sum;
        return sum + ((cue as typeof cue & { durationMs?: number }).durationMs || 0);
      }, 0);
      const rawPauseTotalMs = preparedNarrativePlan.reduce((sum, cue) => {
        if (cue.type !== 'pause') return sum;
        return sum + (cue.pauseMs || 0);
      }, 0);
      const adjustedPauseTotalMs = Math.max(0, targetMs - speechTotalMs);
      const pauseScale = rawPauseTotalMs > 0 ? adjustedPauseTotalMs / rawPauseTotalMs : 1;
      let remainingPauseBudgetMs = adjustedPauseTotalMs;
      const calibratedNarrativePlan = preparedNarrativePlan.map((cue, index) => {
        if (cue.type !== 'pause') return cue;
        const originalPauseMs = cue.pauseMs || 0;
        const isLastPause = preparedNarrativePlan.slice(index + 1).every((nextCue) => nextCue.type !== 'pause');
        const scaledPauseMs = isLastPause
          ? remainingPauseBudgetMs
          : Math.max(0, Math.round(originalPauseMs * pauseScale));
        remainingPauseBudgetMs = Math.max(0, remainingPauseBudgetMs - scaledPauseMs);
        return {
          ...cue,
          pauseMs: scaledPauseMs,
        };
      });
      setMeditationStage('active');
      setActiveNarrationSentence(null);
      setActiveNarrationIndex(null);
      setActiveNarrationProgress(0);
      startMeditationCountdown(targetMs);

      for (const cue of calibratedNarrativePlan) {
        if (cue.type === 'speech' && cue.text) {
          const ok = await playCue(
            cue.text,
            typeof cue.speechIndex === 'number' ? cue.speechIndex : null,
            { audioUrl: (cue as typeof cue & { audioUrl?: string }).audioUrl },
          );
          if (!ok) return;
        }
        if (meditationRunIdRef.current !== currentRunId) return;
        if (cue.type === 'pause' && (cue.pauseMs || 0) > 0) {
          meditationPauseRemainingMsRef.current = cue.pauseMs || 0;
          meditationPauseStartedAtRef.current = Date.now();
          await new Promise<void>((resolve) => {
            meditationPauseResolveRef.current = resolve;
            meditationPauseTimeoutRef.current = window.setTimeout(() => {
              meditationPauseTimeoutRef.current = null;
              meditationPauseResolveRef.current = null;
              meditationPauseRemainingMsRef.current = 0;
              meditationPauseStartedAtRef.current = null;
              resolve();
            }, cue.pauseMs);
          });
        }
      }

      if (meditationRunIdRef.current === currentRunId) {
        stopMeditationCountdown();
        setMeditationStage('closing');
        setActiveNarrationSentence(null);
        setActiveNarrationIndex(null);
        setActiveNarrationProgress(0);
      }

      for (let index = 0; index < closingSentences.length; index += 1) {
        const ok = await playCue(closingSentences[index]);
        if (!ok) return;
      }

      if (meditationRunIdRef.current === currentRunId) {
        setSpeaking(false);
        setMeditationStage('idle');
        setActiveNarrationSentence(null);
        setActiveNarrationIndex(null);
        setActiveNarrationProgress(0);
        onComplete?.();
      }
    } catch {
      stopMeditationCountdown();
      setMeditationStage('idle');
      setActiveNarrationSentence(null);
      setActiveNarrationIndex(null);
      setActiveNarrationProgress(0);
      setSpeaking(false);
    }
  };

  const cancelMeditationPreparation = useCallback(() => {
    stopMeditationAudio({ stopAmbient: false });
  }, [stopMeditationAudio]);

  const skipMeditationPreparation = useCallback(() => {
    void play(true, true);
  }, [play]);

  const toggleMeditationPreparationPause = useCallback(async () => {
    if (meditationStage !== 'preparing') return;

    if (!audioEnabled || defaultVoice === 'nenhuma') {
      if (meditationPreparationPaused) {
        meditationPreparationStartedAtRef.current = Date.now();
        meditationPreparationSilentTimeoutRef.current = window.setTimeout(() => {
          meditationPreparationSilentTimeoutRef.current = null;
          meditationPreparationStartedAtRef.current = null;
          setMeditationPreparationPaused(false);
          setMeditationStage('active');
          setActiveNarrationSentence(null);
          setActiveNarrationProgress(0);
          const targetMs = parseMeditationDurationToMs(selectedMeta.duration);
          startMeditationCountdown(targetMs);
          setSpeaking(true);
          meditationSilentTimeoutRef.current = window.setTimeout(() => {
            meditationSilentTimeoutRef.current = null;
            setSpeaking(false);
            setMeditationStage('idle');
            setActiveNarrationSentence(null);
            setActiveNarrationIndex(null);
            stopMeditationCountdown();
            onComplete?.();
          }, targetMs);
        }, meditationPreparationRemainingMsRef.current);
        return;
      }
      if (meditationPreparationSilentTimeoutRef.current) {
        window.clearTimeout(meditationPreparationSilentTimeoutRef.current);
        meditationPreparationSilentTimeoutRef.current = null;
      }
      if (meditationPreparationStartedAtRef.current) {
        const elapsed = Date.now() - meditationPreparationStartedAtRef.current;
        meditationPreparationRemainingMsRef.current = Math.max(300, meditationPreparationRemainingMsRef.current - elapsed);
      }
      meditationPreparationStartedAtRef.current = null;
      setMeditationPreparationPaused(true);
      return;
    }

    if (!meditationAudioRef.current) return;
    if (meditationPreparationPaused) {
      try {
        await meditationAudioRef.current.play();
        setMeditationPreparationPaused(false);
      } catch {}
      return;
    }
    meditationAudioRef.current.pause();
    if (meditationProgressRafRef.current) {
      window.cancelAnimationFrame(meditationProgressRafRef.current);
      meditationProgressRafRef.current = null;
    }
    setMeditationPreparationPaused(true);
  }, [audioEnabled, defaultVoice, meditationPreparationPaused, meditationStage, onComplete, selectedMeta.duration, startMeditationCountdown, stopMeditationCountdown]);

  const toggleMeditationPracticePause = useCallback(async () => {
    if (meditationStage !== 'active' && meditationStage !== 'closing') return;

    if (meditationSessionPaused) {
      if (meditationAudioRef.current) {
        try {
          await meditationAudioRef.current.play();
          setMeditationSessionPaused(false);
          setSpeaking(true);
          if (meditationProgressRafRef.current) {
            window.cancelAnimationFrame(meditationProgressRafRef.current);
            meditationProgressRafRef.current = null;
          }
          stopMeditationCountdown(true);
          if (countdownMs > 0) {
            startMeditationCountdown(countdownMs);
          }
        } catch {}
        return;
      }

      if (meditationPauseResolveRef.current && meditationPauseRemainingMsRef.current > 0) {
        meditationPauseStartedAtRef.current = Date.now();
        meditationPauseTimeoutRef.current = window.setTimeout(() => {
          meditationPauseTimeoutRef.current = null;
          meditationPauseStartedAtRef.current = null;
          meditationPauseRemainingMsRef.current = 0;
          const resolve = meditationPauseResolveRef.current;
          meditationPauseResolveRef.current = null;
          resolve?.();
        }, meditationPauseRemainingMsRef.current);
        setMeditationSessionPaused(false);
        setSpeaking(true);
        stopMeditationCountdown(true);
        if (countdownMs > 0) {
          startMeditationCountdown(countdownMs);
        }
      }
      return;
    }

    if (meditationAudioRef.current) {
      meditationAudioRef.current.pause();
      if (meditationProgressRafRef.current) {
        window.cancelAnimationFrame(meditationProgressRafRef.current);
        meditationProgressRafRef.current = null;
      }
      stopMeditationCountdown(true);
      setMeditationSessionPaused(true);
      setSpeaking(false);
      return;
    }

    if (meditationPauseTimeoutRef.current) {
      window.clearTimeout(meditationPauseTimeoutRef.current);
      meditationPauseTimeoutRef.current = null;
      if (meditationPauseStartedAtRef.current) {
        const elapsed = Date.now() - meditationPauseStartedAtRef.current;
        meditationPauseRemainingMsRef.current = Math.max(250, meditationPauseRemainingMsRef.current - elapsed);
      }
      meditationPauseStartedAtRef.current = null;
      stopMeditationCountdown(true);
      setMeditationSessionPaused(true);
      setSpeaking(false);
    }
  }, [countdownMs, meditationSessionPaused, meditationStage, startMeditationCountdown, stopMeditationCountdown]);

  return (
    <div className="p-4 pb-32 max-w-lg mx-auto animate-fade-in space-y-4">
      {view === 'library' ? (
        <>
          <div className={`rounded-[2.3rem] p-5 border relative overflow-hidden ${dm ? 'bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_38%),linear-gradient(180deg,#0f1828_0%,#111d31_100%)] border-cyan-900/30 text-slate-200' : 'bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.14),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f7f9ff_100%)] border-slate-200 text-slate-700 shadow-sm'}`}>
            <div className={`absolute -right-6 top-1 text-8xl opacity-10 ${dm ? 'text-indigo-300' : 'text-indigo-500'}`}>🧘</div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Escolha sua prática</p>
            <h2 className="mt-3 text-3xl font-[1000] tracking-tight">Meditação</h2>
          </div>

          <button
            onClick={() => {
              stopMeditationAudio();
              setView('free');
            }}
            data-card-glyph="⏱️"
            className={`sereno-ornament-card group relative overflow-hidden rounded-[1.8rem] border p-4 text-left transition-all active:scale-[0.98] ${
              dm
                ? 'bg-gradient-to-br from-sky-950/28 via-cyan-950/22 to-teal-950/26 border-sky-900/40 text-slate-100'
                : 'bg-gradient-to-br from-white via-sky-50 to-cyan-50 border-sky-100 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${dm ? 'bg-sky-500/12 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                ⏱️
              </div>
              <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-sky-500/12 text-sky-100' : 'bg-sky-100 text-sky-700'}`}>
                Livre
              </div>
            </div>
            <p className="mt-1 text-xl font-[1000] tracking-tight">Time Livre</p>
            <p className={`mt-2 text-sm font-semibold leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>
              Sem narração. Só você, o tempo e o ambiente sonoro que fizer sentido agora.
            </p>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {visibleScripts.map((s) => (
              (() => {
                const tone = meditationToneClasses(s.id);
                return (
              <button
                key={s.id}
                onClick={() => {
                  stopMeditationAudio();
                  setSelected(s);
                  setView('session');
                }}
                data-card-glyph={meditationMetaById[s.id]?.icon || '🧘'}
                className={`sereno-ornament-card group relative overflow-hidden p-4 rounded-[1.6rem] border text-left transition-all active:scale-[0.98] ${tone.card}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${tone.icon}`}>
                    {meditationMetaById[s.id]?.icon || '🧘'}
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.chip}`}>
                    {meditationMetaById[s.id]?.duration || '2 min'}
                  </div>
                </div>
                <p className={`mt-3 text-[10px] font-black uppercase tracking-[0.14em] ${tone.eyebrow}`}>
                  {meditationMetaById[s.id]?.eyebrow || meditationIntentById[s.id] || 'Prática'}
                </p>
                <p className="mt-1 font-black leading-tight">{s.title}</p>
                <p className={`mt-2 text-xs leading-relaxed ${tone.detail}`}>
                  {meditationMetaById[s.id]?.detail || 'Uma prática guiada para este momento.'}
                </p>
              </button>
                );
              })()
            ))}
          </div>
          {!hasUnlimitedAccess && (
            <div className={`rounded-3xl border p-5 ${dm ? 'border-fuchsia-900/35 bg-fuchsia-950/20 text-slate-100' : 'border-fuchsia-200 bg-fuchsia-50/80 text-slate-800'}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Biblioteca completa no Pro</p>
              <p className="mt-2 text-[14px] font-semibold leading-relaxed">
                No Pro, sua meditação se expande para foco, autocompaixão, presença e profundidade.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2.5">
                {lockedMeditationTeasers.map((item) => (
                  <div
                    key={item.id}
                    data-card-glyph="✨"
                    className={`sereno-ornament-card rounded-[1.5rem] border px-4 py-3.5 opacity-90 overflow-hidden ${
                      dm
                        ? 'border-fuchsia-900/25 bg-slate-950/35 text-slate-300'
                        : 'border-fuchsia-100 bg-white/75 text-slate-600'
                    }`}
                  >
                    <p className={`text-[14px] font-black ${dm ? 'text-slate-100' : 'text-slate-800'}`}>{item.title}</p>
                    <p className={`mt-1 text-[13px] font-semibold leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{item.detail}</p>
                  </div>
                ))}
              </div>
              <p className={`animate-shimmer mt-3 inline-flex rounded-2xl px-3 py-2 text-[12px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-fuchsia-900/25 text-fuchsia-200/90' : 'bg-fuchsia-100/90 text-fuchsia-700/90'}`}>
                +{scripts.length - visibleScripts.length} práticas no Pro
              </p>
              <button onClick={() => onShowUpgrade?.()} className="animate-shimmer mt-4 rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(217,70,239,0.28)] transition-all active:scale-95">
                Ver plano Pro
              </button>
            </div>
          )}
        </>
      ) : view === 'free' ? (
      <div className={`rounded-[2.2rem] p-5 border ${dm ? 'bg-[#111d31] border-indigo-900/25 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setView('library')}
            className={`p-4 rounded-2xl ${dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500 shadow-sm'}`}
          >
            ❮ Voltar
          </button>
          <div />
        </div>
        <div className="flex items-start gap-3">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] text-2xl ${dm ? 'bg-white/6' : 'bg-sky-50'}`}>⏱️</div>
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-sky-300/80' : 'text-sky-700/70'}`}>Meditação no seu ritmo</p>
            <h3 className="mt-2 text-2xl font-[1000] tracking-tight">Time Livre</h3>
          </div>
        </div>
        <div className="mt-5">
          <FreeTimerSection
            darkMode={dm}
            onComplete={onComplete}
            embedded
            title="Time Livre"
            description="Sem narração, apenas você, o silêncio e, se quiser, um ambiente sonoro."
          />
        </div>
      </div>
      ) : (
      <div className={`rounded-[2.2rem] p-5 border ${dm ? 'bg-[#111d31] border-indigo-900/25 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              stopMeditationAudio();
              setView('library');
            }}
            className={`p-4 rounded-2xl ${dm ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500 shadow-sm'}`}
          >
            ❮ Voltar
          </button>
          <div className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${dm ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
            {selectedMeta.duration} · Guiada
          </div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] text-2xl ${dm ? 'bg-white/6' : 'bg-indigo-50'}`}>
              {selectedMeta.icon}
            </div>
            <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Prática selecionada</p>
            <h3 className="mt-2 text-2xl font-[1000] tracking-tight">{selected.title}</h3>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowMeditationIntro((prev) => !prev)}
          className={`mt-4 flex w-full items-center justify-between rounded-[1.5rem] border px-4 py-4 text-left transition-all ${dm ? 'border-white/8 bg-white/[0.03] text-slate-100' : 'border-slate-100 bg-slate-50/80 text-slate-800 shadow-sm'}`}
        >
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Antes de começar</p>
            <p className={`mt-2 text-sm font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{meditationGuidanceById[selected.id].greeting}</p>
          </div>
          <span className={`text-base transition-transform ${showMeditationIntro ? 'rotate-180' : ''}`}>⌄</span>
        </button>
        {showMeditationIntro && (
          <div className={`rounded-[1.5rem] border px-4 py-4 ${dm ? 'border-white/8 bg-white/[0.03]' : 'border-slate-100 bg-slate-50/80'}`}>
            <p className={`text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{meditationGuidanceById[selected.id].intro}</p>
          </div>
        )}

        <button
          onClick={() => setShowMeditationPosture((prev) => !prev)}
          className={`mt-4 flex w-full items-center justify-between rounded-[1.5rem] border px-4 py-4 text-left transition-all ${dm ? 'border-white/8 bg-white/[0.03] text-slate-100' : 'border-slate-100 bg-slate-50/80 text-slate-800 shadow-sm'}`}
        >
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Como se preparar</p>
            <p className={`mt-2 text-sm font-semibold ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Postura, conforto e orientações antes do play.</p>
          </div>
          <span className={`text-base transition-transform ${showMeditationPosture ? 'rotate-180' : ''}`}>⌄</span>
        </button>
        {showMeditationPosture && (
          <div className="space-y-2.5">
            {meditationGuidanceById[selected.id].items.map((item) => (
              <div key={item} className={`flex items-start gap-3 rounded-[1.2rem] px-3.5 py-3 text-sm font-semibold leading-relaxed ${dm ? 'bg-white/[0.03] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                <span className={`mt-0.5 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
        <p className={`mt-4 text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>A prática só começa quando você apertar o play.</p>
        <div className={`mt-4 p-4 rounded-[2rem] ${dm ? 'bg-slate-900/50' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border border-slate-200/80'}`}>
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
                  if (activeMeditationAmbient) {
                    stopMeditationAmbient();
                  } else {
                    setShowMeditationAmbient((prev) => !prev);
                  }
                }}
                className={`rounded-2xl px-4 py-2 text-xs font-black transition-all ${
                  activeMeditationAmbient
                    ? 'bg-rose-500 text-white'
                    : showMeditationAmbient
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : dm
                      ? 'bg-[linear-gradient(135deg,rgba(34,197,94,0.98),rgba(5,150,105,0.94))] text-white border border-emerald-300/25 shadow-[0_0_28px_rgba(34,197,94,0.38)] animate-[pulse-soft_2.2s_ease-in-out_infinite]'
                      : 'bg-[linear-gradient(135deg,#22c55e_0%,#059669_100%)] text-white shadow-[0_0_24px_rgba(34,197,94,0.28)] animate-[pulse-soft_2.2s_ease-in-out_infinite]'
                }`}
              >
                {activeMeditationAmbient ? 'Parar ambiente' : showMeditationAmbient ? 'Fechar' : 'Escolher'}
              </button>
            </div>
            {showMeditationAmbient && (
              <div className="grid grid-cols-2 gap-2">
                {[...meditationAmbientPresets, ...meditationFavoriteMixes].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => playMeditationAmbient(preset.id, preset.mix)}
                    className={`rounded-[1.4rem] border px-3 py-3 text-left transition-all active:scale-[0.98] ${
                      activeMeditationAmbient === preset.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                        : dm
                          ? 'bg-white/[0.04] border-white/10 text-slate-200'
                          : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl">{preset.emoji}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                        activeMeditationAmbient === preset.id ? 'bg-white/15 text-indigo-100' : dm ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {activeMeditationAmbient === preset.id ? 'Tocando' : 'Mix'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black leading-tight">{preset.name}</p>
                    <p className={`mt-1 text-[11px] font-semibold ${activeMeditationAmbient === preset.id ? 'text-indigo-100/85' : dm ? 'text-slate-400' : 'text-slate-500'}`}>
                      {Object.keys(preset.mix).filter((key) => preset.mix[key] > 0).length} sons combinados
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={`mt-4 rounded-[1.8rem] border px-4 py-4 ${dm ? 'border-indigo-900/25 bg-indigo-950/20' : 'border-indigo-100 bg-indigo-50/70'}`}>
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
                  width: meditationNarrationLines.length
                    ? `${((Math.max(activeNarrationIndex ?? 0, meditationStage === 'active' ? 0 : 0) + (meditationStage === 'active' && currentMeditationLine ? activeNarrationProgress : 0)) / meditationNarrationLines.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
            <div className="p-4">
              <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-200/70' : 'text-indigo-700/70'}`}>
                {meditationStage === 'active' ? 'Trecho atual' : meditationStage === 'closing' ? 'Fechamento' : 'Prévia da prática'}
              </p>
              <div className={`mt-3 rounded-[1.35rem] px-4 py-4 ${dm ? 'bg-white/[0.04] text-white shadow-[0_12px_40px_rgba(99,102,241,0.12)]' : 'bg-white text-indigo-950 shadow-sm'}`}>
                <div className="space-y-2.5">
                  <div className={`min-h-[42px] rounded-[1rem] px-3 py-2 text-sm leading-relaxed transition-all ${dm ? 'text-slate-400/70' : 'text-slate-400'}`}>
                    {meditationStage === 'active'
                      ? previousMeditationLine || ''
                      : ''}
                  </div>
                  <div className={`rounded-[1.15rem] border px-4 py-4 transition-all ${
                    dm
                      ? 'border-indigo-400/20 bg-indigo-500/14 shadow-[0_0_0_1px_rgba(129,140,248,0.10),0_18px_45px_rgba(79,70,229,0.12)]'
                      : 'border-indigo-200 bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_100%)] shadow-[0_12px_28px_rgba(99,102,241,0.12)]'
                  }`}>
                    <p className={`text-[15px] leading-relaxed ${currentMeditationLine && meditationStage === 'active' ? 'font-semibold' : 'font-medium'} ${
                      currentMeditationLine && meditationStage === 'active'
                        ? dm
                          ? 'text-white drop-shadow-[0_0_18px_rgba(196,181,253,0.18)]'
                          : 'text-indigo-950'
                        : ''
                    }`}>
                      {meditationStage === 'active'
                        ? currentMeditationLine || 'A narração aparece aqui quando a prática começar.'
                        : meditationStage === 'closing'
                          ? 'Encerramento em andamento.'
                          : meditationNarrationLines[0] || 'A prática guiada aparecerá aqui.'}
                    </p>
                  </div>
                  <div className={`min-h-[42px] rounded-[1rem] px-3 py-2 text-sm leading-relaxed transition-all ${dm ? 'text-slate-400/70' : 'text-slate-400'}`}>
                    {meditationStage === 'active'
                      ? nextMeditationLine || ''
                      : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowFullMeditationText((prev) => !prev)}
            className={`mt-3 flex w-full items-center justify-between rounded-[1.2rem] px-3.5 py-3 text-left text-sm font-semibold transition-all ${dm ? 'bg-white/[0.04] text-slate-200 border border-white/8' : 'bg-white/85 text-slate-700 border border-white shadow-sm'}`}
          >
            <span>Texto completo da prática</span>
            <span className={`text-base transition-transform ${showFullMeditationText ? 'rotate-180' : ''}`}>⌄</span>
          </button>
          {showFullMeditationText && (
            <div className="mt-3 space-y-2.5">
              {meditationNarrationLines.map((sentence, index) => {
                const isActiveSentence = meditationStage === 'active' && activeNarrationIndex === index;
                return (
                  <div
                    key={`${selected.id}-sentence-${index}`}
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
                    <span className={isActiveSentence ? 'font-semibold' : ''}>{sentence}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-5 space-y-4">
          <div className={`rounded-[1.5rem] border px-4 py-3 ${dm ? 'border-white/8 bg-white/[0.03]' : 'border-slate-100 bg-slate-50/80'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>
                  {meditationStage === 'active' ? 'Meditação' : meditationStage === 'closing' ? 'Encerramento' : 'Iniciando'}
                </p>
                <p className={`mt-1 text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                  {meditationStage === 'active' ? 'Tempo correndo na prática.' : meditationStage === 'closing' ? 'Fechamento da sessão.' : 'Preparando a prática.'}
                </p>
              </div>
              <div className={`rounded-2xl px-4 py-2 text-lg font-[1000] tabular-nums ${dm ? 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/15' : 'bg-white text-indigo-700 border border-indigo-100 shadow-sm'}`}>
                {meditationStage === 'active' ? formatMeditationClock(countdownMs) : selectedMeta.duration}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (meditationStage === 'preparing') {
                cancelMeditationPreparation();
                return;
              }
              if (meditationStage === 'active' || meditationStage === 'closing' || meditationSessionPaused) {
                stopMeditationAudio({ stopAmbient: false });
                return;
              }
              play(false);
            }}
            className={`w-full py-5 rounded-[2.5rem] text-lg font-black shadow-xl transition-all active:scale-95 ${
              speaking || meditationStage === 'preparing' || meditationSessionPaused ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/30'
            }`}
          >
            {meditationStage === 'preparing' ? 'Parar preparação' : (meditationStage === 'active' || meditationStage === 'closing' || meditationSessionPaused) ? 'Parar prática' : 'Iniciar com preparação'}
          </button>
          {meditationStage === 'preparing' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleMeditationPreparationPause()}
                className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                  dm ? 'bg-slate-900/80 text-slate-300 border border-slate-700/80 hover:bg-slate-800' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 shadow-sm'
                }`}
              >
                {meditationPreparationPaused ? 'Retomar preparação' : 'Pausar preparação'}
              </button>
              <button
                onClick={() => skipMeditationPreparation()}
                className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                  dm ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 shadow-sm'
                }`}
              >
                Pular preparação
              </button>
            </div>
          ) : (
            (meditationStage === 'active' || meditationStage === 'closing' || meditationSessionPaused) ? (
              <button
                onClick={() => toggleMeditationPracticePause()}
                className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                  dm ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/20 hover:bg-cyan-500/20' : 'bg-cyan-50 text-cyan-900 border border-cyan-100 hover:bg-cyan-100 shadow-sm'
                }`}
              >
                {meditationSessionPaused ? 'Retomar prática' : 'Pausar prática'}
              </button>
            ) : (
              <button
                onClick={() => play(true)}
                className={`w-full py-4 rounded-[2rem] text-sm font-black transition-all active:scale-95 ${
                  dm ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 shadow-sm'
                }`}
              >
                Pular preparação
              </button>
            )
          )}
          <div className={`p-4 rounded-[2rem] ${dm ? 'bg-slate-900/50' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border border-slate-200/80'}`}>
            <div className="space-y-2 text-center">
              <span className="text-[10px] uppercase font-black tracking-[0.16em] opacity-50 block">Áudio Guia</span>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all ${audioEnabled ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-400 border border-slate-200')}`}
              >
                {audioEnabled ? '🔊 Ativado' : '🔇 Desativado'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

const SleepIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

// Types
type Tab = 'home' | 'chat' | 'library' | 'breathing' | 'meditation' | 'mood' | 'calm' | 'acalmese' | 'diary' | 'safety' | 'stats' | 'reminders' | 'yoga' | 'solta' | 'gratitude' | 'timer' | 'badges' | 'assertiveness' | 'login' | 'sos' | 'hooponopono' | 'lovelanguages' | 'therapycalendar' | 'abordagens' | 'suggestions' | 'habits' | 'mixer' | 'esperanca' | 'carta' | 'sleep' | 'vocacional' | 'fivefingers' | 'microtasks' | 'timecapsule' | 'missions' | 'artemotion' | 'regulation' | 'mindmap' | 'healthymessages' | 'tracks' | 'emocional' | 'psychoedu' | 'toxicthoughts' | 'dictionary' | 'couple' | 'family' | 'invite' | 'destravar' | 'mapavida';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

import { MoodEntry } from '@/components/MoodSection';

interface EmotionEntry {
  id: string;
  situation: string;
  date: string;
  time: string;
  emotion: string;
  level: number;
  feelings: string;
  createdAt: string;
}

interface ThoughtRecord {
  id: string;
  date: string;
  time: string;
  situation: string;
  automaticThought: string;
  emotion: string;
  emotionLevel: number;
  evidenceFor: string;
  evidenceAgainst: string;
  alternativeThought: string;
  newEmotionLevel: number;
  createdAt: string;
}

interface SafetyPlan {
  warningSignals: string[];
  copingStrategies: string[];
  reasonsToLive: string[];
  emergencyContacts: { name: string; phone: string }[];
  safePlace: string;
  professionalContact: string;
  professionalName?: string;
  professionalPhone?: string;
  crisisLine: string;
}

interface UserProgress {
  meditationsCompleted: number;
  breathingCompleted: number;
  yogaCompleted: number;
  totalMinutes: number;
  streak: number;
  lastActiveDate: string;
  badgesEarned: string[];
}

interface GratitudeEntry {
  id: string;
  date: string;
  items: string[];
  createdAt: string;
}

interface GratitudePhoto {
  id: string;
  url: string;
  caption: string;
  createdAt: string;
}

interface SoltaEntry {
  id: string;
  text: string;
  createdAt: string;
}

interface UserAccount {
  name: string;
  nickname?: string;
  email: string;
  avatar: string;
  birthdate?: string; // YYYY-MM-DD
  sex?: string;
  role?: 'user' | 'admin';
  adminAccess?: boolean;
}

const buildAccountFromAuthUser = (user: any): UserAccount => {
  const metadata = user?.user_metadata || {};
  const appMetadata = user?.app_metadata || {};
  return buildAdminPreparedAccount({
    name: String(metadata.full_name || metadata.name || metadata.user_name || user?.email?.split('@')[0] || 'Usuário'),
    nickname: metadata.nickname ? String(metadata.nickname) : undefined,
    email: String(user?.email || ''),
    avatar: String(metadata.avatar_url || metadata.picture || '👤'),
    birthdate: metadata.birthdate ? String(metadata.birthdate) : undefined,
    sex: metadata.sex ? String(metadata.sex) : undefined,
    role: (appMetadata.role || metadata.role || 'user') as 'user' | 'admin',
    adminAccess: Boolean(appMetadata.admin_access || metadata.admin_access),
  });
};

const buildAuthUserMetadataFromAccount = (account: UserAccount | null) => {
  if (!account) return null;
  return {
    name: account.name || '',
    full_name: account.name || '',
    nickname: account.nickname || '',
    birthdate: account.birthdate || '',
    sex: account.sex || '',
    avatar_url: account.avatar || '',
  };
};

interface PrivacySettings {
  appLockEnabled: boolean;
  appLockPin: string;
  discreetMode: boolean;
}

interface VisualSettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'sans' | 'serif' | 'dyslexic';
  accentColor?: string;
}

interface AudioSettings {
  musicVolume: number;
  voiceVolume: number;
  backgroundMusicEnabled: boolean;
  hapticsEnabled: boolean;
}

interface WellbeingSettings {
  hideStreaks: boolean;
}

interface ReminderSettings {
  moodReminder: boolean;
  moodTime: string;
  breathingReminder: boolean;
  breathingTime: string;
  yogaReminder: boolean;
  yogaTime: string;
  diaryReminder: boolean;
  diaryTime: string;
  healthySelfReminder: boolean;
  healthySelfTime: string;
  meditationReminder: boolean;
  meditationTime: string;
  badgesReminder: boolean;
  badgesTime: string;
  gratitudeReminder: boolean;
  gratitudeTime: string;
  sleepReminder: boolean;
  sleepTime: string;
  missionsReminder: boolean;
  missionsTime: string;
  microtasksReminder: boolean;
  microtasksTime: string;
  mindmapReminder: boolean;
  mindmapTime: string;
  psychoeduReminder: boolean;
  psychoeduTime: string;
  adaptiveSuggestionReminder: boolean;
  adaptiveSuggestionTime: string;
  therapyReminder: boolean;
  therapyReminderDayBefore: boolean;
  therapyReminderHourBefore: boolean;
  therapyExternalCalendar: boolean;
  doNotDisturb: boolean;
}

interface SubscriptionData {
  plan: 'free' | 'pro';
  planKey?: BillingPlanKey;
  trialStartDate: string; // ISO string
  status?: string;
  billingCycle?: string | null;
  isLifetime?: boolean;
  activatedAt?: string;
  expiresAt?: string | null;
  usageCounts: {
    aiChat: { [date: string]: number };
    aiChatWindowCount?: number;
    aiChatCooldownUntil?: number | null;
    muralSend: { [date: string]: number };
    muralReceive: { [date: string]: number };
    sharing: number;
    exportData?: { [month: string]: number };
  };
}

// Icons as components
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const BreathIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const MeditateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="3" />
    <path d="M12 8v4" />
    <path d="M8 12c0 2.5-2 4-2 6h12c0-2-2-3.5-2-6" />
    <path d="M12 20v2" />
  </svg>
);

const MoodIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const CalmIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const YogaIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="4" r="2" />
    <path d="M12 6v4" />
    <path d="M12 10l-4 8h8l-4-8z" />
    <path d="M8 18l-2 2" />
    <path d="M16 18l2 2" />
  </svg>
);

const DiaryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51 15.42 17.49" />
    <path d="M15.41 6.51 8.59 10.49" />
  </svg>
);

const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
    <path d="M10 17a2 2 0 0 0 4 0" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1v.17a2 2 0 1 1-4 0V21a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H2.83a2 2 0 1 1 0-4H3a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V2.83a2 2 0 1 1 4 0V3a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.31.31.65.33 1v.17a2 2 0 1 1 0 4H20a1.65 1.65 0 0 0-1 .33c-.31.2-.53.55-.6 1Z" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21a8 8 0 1 0-16 0" />
    <circle cx="12" cy="8" r="4" />
  </svg>
);

const SparklePremiumIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5 13.7 8.3 18.5 10 13.7 11.7 12 16.5 10.3 11.7 5.5 10 10.3 8.3 12 3.5Z" />
    <path d="M18.5 4.5 19.1 6.1 20.7 6.7 19.1 7.3 18.5 8.9 17.9 7.3 16.3 6.7 17.9 6.1 18.5 4.5Z" />
    <path d="M6 15.8 6.6 17.4 8.2 18 6.6 18.6 6 20.2 5.4 18.6 3.8 18 5.4 17.4 6 15.8Z" />
  </svg>
);

const DynamicNavIcon = ({ tab }: { tab: Tab }) => {
  if (tab === 'breathing') return <BreathIcon />;
  if (tab === 'sos') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    );
  }
  if (tab === 'missions') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    );
  }
  if (tab === 'tracks') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6l7-2 4 2 7-2v14l-7 2-4-2-7 2V6z" />
        <path d="M10 4v14" />
        <path d="M14 6v14" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v12" />
      <path d="M10 3v6" />
      <path d="M14 9v12" />
      <path d="M18 3v8" />
    </svg>
  );
};

// Motivational quotes
const quotes = [
  { text: "Cada dia é uma nova oportunidade para recomeçar." },
  { text: "Você é mais forte do que imagina." },
  { text: "O primeiro passo para a mudança é a aceitação." },
  { text: "Respire fundo, isso também vai passar." },
  { text: "Seja gentil consigo mesmo hoje." },
  { text: "Pequenos passos levam a grandes conquistas." },
  { text: "Sua saúde mental é prioridade." },
  { text: "Está tudo bem não estar bem às vezes." },
  { text: "O autocuidado não é egoísmo, é uma necessidade." },
  { text: "Sua paz interior é o seu maior tesouro." },
  { text: "A cura não é linear, e tudo bem dar um passo de cada vez." },
  { text: "Você não precisa ter tudo resolvido hoje." },
  { text: "Cada pequena vitória merece ser celebrada." },
  { text: "Lembre-se de tratar a si mesmo com a mesma bondade que trata os outros." },
  { text: "Dias ruins não definem quem você é." },
  { text: "A jornada de mil milhas começa com um único passo." },
  { text: "Focar no agora é o maior presente que você pode se dar." },
  { text: "Você já sobreviveu a 100% dos seus dias difíceis." },
  { text: "Permita-se descansar; você não precisa ser produtivo o tempo todo." },
  { text: "Suas emoções são válidas e merecem espaço." },
  { text: "O amanhã começa de novo, sem erros anteriores." },
  { text: "Confie no processo. O tempo tem seu próprio ritmo." },
  { text: "Você não é o que pensa de si mesmo em seus piores dias." },
  { text: "Dizer 'não' aos outros é uma forma de dizer 'sim' para si mesmo." },
  { text: "Não há pressa. Plante suas sementes e confie no tempo de colheita." },
  { text: "Tudo bem mudar de ideia e de caminho; você está sempre evoluindo." },
  { text: "Onde há calma, há força." },
  { text: "Sua vulnerabilidade é uma ponte para a sua cura." },
  { text: "Você é suficiente exatamente como é." },
  { text: "Ame-se primeiro, e o resto se alinhará." },
  { text: "Seja a sua própria âncora nos dias de tempestade." },
  { text: "A paciência consigo mesmo é o maior ato de amor." },
  { text: "O progresso lento ainda é progresso." },
  { text: "Não se compare com a jornada de ninguém." },
  { text: "Hoje é um bom dia para começar a acreditar em si mesmo." },
  { text: "Sua luz brilhará no tempo certo." },
  { text: "Respeite os seus limites e o seu corpo agradecerá." },
  { text: "As flores nascem depois das chuvas mais fortes." },
  { text: "A vida acontece no presente. Respire o agora." },
  { text: "Não tenha medo de pedir ajuda." }
];

const features = [
  { icon: '📊', title: 'Como você está?', desc: 'Registre seu humor diário', tab: 'mood' as Tab, color: 'bg-blue-100' },
];

// Mood emojis
const moodEmojis: Record<string, string> = {
  amazing: '😄',
  good: '🙂',
  okay: '😐',
  low: '😕',
  bad: '😢',
};

// Meditation content
const meditations = [
  {
    id: 1,
    title: 'Paz Interior',
    category: 'Para acalmar a mente',
    emoji: '🧘',
    description: '5 min • Prática guiada',
    audio: {
      feminino: '/meditations/paz_interior/feminino.mp3',
      srtFeminino: '/meditations/paz_interior/feminino.srt',
      masculino: '/meditations/paz_interior/masculino.mp3',
      srtMasculino: '/meditations/paz_interior/masculino.srt'
    },
    text: `Encontre uma posição confortável. Você pode se sentar ou se deitar. Agora, permita-se parar por
alguns instantes. Este momento é seu.
Feche os olhos suavemente. Respire fundo pelo nariz e solte devagar pela boca. Mais uma vez, puxe
o ar com calma e solte lentamente, deixando o corpo começar a relaxar.
Agora, deixe sua respiração seguir no ritmo natural. Sem forçar. Sem controlar demais. Apenas
observe.
Perceba que, neste instante, você não precisa resolver nada. Não precisa correr. Não precisa
responder ninguém. Você só precisa estar aqui.
Sinta o contato do seu corpo com a cadeira, com a cama ou com o chão. Sinta o peso do corpo
sendo sustentado. Você está seguro. Você está amparado.
Agora leve sua atenção para a respiração. O ar entrando e o ar saindo. A cada inspiração, imagine
que você recebe calma. A cada expiração, imagine que libera tensão.
Inspire paz e expire preocupação. Inspire tranquilidade e expire cansaço. Inspire serenidade e expire
tudo aquilo que está pesado dentro de você.
Se pensamentos surgirem, tudo bem. Não lute contra eles. Não brigue com sua mente. Apenas
observe e deixe passar, como nuvens atravessando o céu.
Você não é obrigado a seguir cada pensamento. Você pode apenas notar e voltar para a respiração.
Agora imagine uma luz suave ao redor do seu peito. Uma luz calma, acolhedora, silenciosa. Essa luz
cresce devagar e começa a preencher todo o seu coração.
Ela leva paz para dentro de você. Ela acalma sua mente. Ela relaxa seu corpo. Essa luz sobe para a
cabeça, soltando a testa, relaxando os olhos, relaxando a mandíbula.
Ela desce pelo pescoço, pelos ombros, e leva embora o peso que você vinha carregando. Essa luz
segue pelos braços, pelas mãos, pelo tronco, pela barriga, pelas pernas, até os pés.
Agora todo o seu corpo está envolvido nessa sensação de paz. Repita mentalmente, com calma: eu
permito que a paz entre em mim. Eu solto o que não posso controlar. Eu escolho a calma. Eu
escolho a leveza. Eu estou em paz neste momento.
Fique por alguns instantes apenas respirando e sentindo essa tranquilidade. Depois, lentamente,
traga sua atenção de volta. Perceba novamente seu corpo. Perceba o ambiente ao redor. Mexa
devagar os dedos das mãos e os dedos dos pés.
Respire fundo mais uma vez. E, quando quiser, abra os olhos. Leve essa paz com você.`
  },
  {
    id: 2,
    title: 'Mindfulness',
    category: 'Presença e atenção',
    emoji: '🌸',
    description: '5 min • Prática guiada',
    audio: {
      feminino: '/meditations/mindfulness-feminino.mp3',
      masculino: '/meditations/mindfulness-masculino.mp3'
    },
    text: `Sente-se de forma confortável. Se preferir, deite-se. Mantenha o corpo em uma posição em que você
possa ficar por alguns minutos sem esforço. Feche os olhos suavemente, ou deixe o olhar pousado
em um ponto fixo.
Respire fundo pelo nariz e solte lentamente pela boca. Mais uma vez, inspire e expire. Agora deixe a
respiração voltar ao seu ritmo natural. Não tente mudar nada. Apenas observe.
Este é um momento para estar presente. Não no passado. Não no futuro. Aqui. Agora.
Leve sua atenção para a sensação do ar entrando pelas narinas. Observe o ar entrando um pouco
mais fresco e saindo um pouco mais quente. Apenas note.
Agora observe o movimento do peito ou da barriga. Subindo e descendo. Não é preciso pensar sobre
a respiração. Apenas sentir.
Se um pensamento surgir, perceba: há um pensamento. Se uma lembrança surgir, perceba: há uma
lembrança. Se uma preocupação surgir, perceba: há uma preocupação.
Não precisa seguir nenhum deles. Não precisa expulsar nenhum deles. Apenas observe e volte com
gentileza para a respiração.
Agora leve atenção aos sons ao redor. Sem tentar identificar ou julgar. Apenas escute. Sons
próximos, sons distantes, silêncios entre os sons. Tudo está acontecendo no agora.
Perceba as sensações do corpo. O contato da roupa com a pele. A temperatura do ambiente. O peso
do corpo sendo apoiado. Talvez algum ponto de tensão. Talvez algum ponto de conforto. Apenas
observe.
Mindfulness não é esvaziar a mente. É perceber o que está acontecendo, exatamente como está,
com presença e sem luta.
Pergunte a si mesmo, em silêncio: como estou neste momento? Não procure uma resposta bonita.
Só perceba. Talvez você esteja calmo. Talvez cansado. Talvez ansioso. Talvez disperso. Seja como
for, acolha.
Diga mentalmente: está tudo bem perceber o que eu sinto. Eu posso estar presente sem me julgar.
Eu volto para o agora. Eu volto para a minha respiração.
Respire por alguns instantes com total atenção. Quando a mente sair, volte. Quando a mente sair de
novo, volte de novo. É assim que se pratica.
Não existe fracasso aqui. Cada retorno ao presente já é a prática acontecendo. Agora faça uma
respiração um pouco mais profunda. Sinta o corpo inteiro. Perceba o ambiente ao seu redor e
reconheça que você está aqui, vivo, presente, respirando.
Mexa devagar os dedos das mãos, os ombros, o pescoço, se quiser. E, quando se sentir pronto, abra
os olhos. Leve essa presença para o restante do seu dia.`
  },
  {
    id: 3,
    title: 'Respiração Consciente',
    category: 'Presença e atenção',
    emoji: '🌬️',
    description: '5 min • Prática guiada',
    text: `Encontre uma posição confortável e permita que a sua coluna fique ereta, mas sem rigidez. Relaxe
os ombros. Solte o rosto. Deixe as mãos repousarem onde parecer mais natural.
Feche os olhos, se isso for confortável para você. Caso prefira, mantenha o olhar baixo e suave.
Respire fundo pelo nariz e solte o ar lentamente. Mais uma vez, inspire com calma e expire sem
pressa.
Agora, não tente respirar de um jeito perfeito. Apenas perceba que a respiração já está acontecendo.
O ar entra. O ar sai. O corpo sabe o que fazer.
Leve toda a sua atenção para esse movimento simples. Observe o ar tocando as narinas. Observe o
peito ou a barriga se movendo. Sinta o ritmo da vida acontecendo dentro de você.
Se quiser, conte mentalmente: entrando, saindo. Ou simplesmente acompanhe em silêncio. O
importante não é controlar a respiração, e sim se aproximar dela com presença.
Talvez sua mente se distraia. Talvez você se lembre de algo, pense em um compromisso, ou se
pergunte se está fazendo certo. Tudo bem. Sempre que perceber isso, volte para o ar entrando e
saindo.
Agora imagine que a cada inspiração você abre espaço por dentro. E que a cada expiração você
solta um pouco da pressa, um pouco da tensão, um pouco do excesso.
Continue respirando com essa atitude de gentileza. Nada precisa ser forçado. Nada precisa ser
apressado. Apenas um ciclo de cada vez. Uma respiração de cada vez.
Se for confortável, repita mentalmente: eu inspiro presença. Eu expiro tensão. Eu inspiro calma. Eu
expiro o excesso.
Fique por mais alguns instantes somente observando a respiração. Depois, aos poucos, amplie sua
atenção para o corpo inteiro. Perceba onde você está. Perceba o apoio abaixo de você. Respire
fundo mais uma vez e, quando quiser, abra os olhos, levando essa consciência para o restante do
dia.`
  },
  {
    id: 4,
    title: 'Silêncio Mental',
    category: 'Para acalmar a mente',
    emoji: '🌫️',
    description: '10 min • Prática guiada',
    audio: {
      feminino: '/meditations/silencio_mental/feminino.mp3',
      srtFeminino: '/meditations/silencio_mental/feminino.srt',
      masculino: '/meditations/silencio_mental/masculino.mp3',
      srtMasculino: '/meditations/silencio_mental/masculino.srt'
    },
    text: `Sente-se de forma confortável e permita que a postura seja estável. Feche os olhos. Respire fundo e
solte o ar lentamente. Deixe o ritmo interno diminuir um pouco.
Hoje o foco não é lutar contra a mente, mas diminuir a identificação com o excesso de ruído. O
silêncio mental não surge da força bruta. Ele se aproxima quando deixamos de alimentar tanto
barulho.
Observe os pensamentos passando. Não se envolva com todos. Não tente terminar todas as frases
internas. Apenas repare que a mente está se movendo.
Agora volte para algo simples: a respiração, o corpo, o espaço entre um pensamento e outro. Talvez
esses espaços sejam curtos. Tudo bem. Basta percebê-los.
Imagine o lago da mente ficando menos agitado. As ondas ainda existem, mas pouco a pouco a
superfície começa a refletir melhor.
Repita mentalmente: eu não preciso seguir tudo o que penso. Eu posso repousar em um lugar mais
silencioso dentro de mim.
Permaneça por alguns instantes nesse repouso simples. Se pensamentos surgirem, deixe que
venham e vão. Você retorna ao silêncio possível agora.
Depois, aos poucos, perceba o corpo, o ambiente e a sua respiração. Abra os olhos devagar e leve
consigo um pouco dessa quietude.`
  },
  {
    id: 5,
    title: 'Caminhando',
    category: 'Presença e atenção',
    emoji: '🚶',
    description: '10 min • Prática guiada',
    text: `Fique em pé por alguns instantes e perceba a postura do corpo. Sinta os pés tocando o chão.
Respire fundo e reconheça que até um simples caminhar pode se tornar prática de presença.
Comece a andar lentamente, sem pressa. Perceba cada passo. O pé que levanta. O pé que avança.
O pé que toca o chão. O peso que muda de lado.
Não é uma caminhada para chegar rápido a algum lugar. É uma caminhada para habitar o corpo
enquanto ele se move.
Observe também o ambiente. As cores. Os sons. O ar na pele. A luz. Tudo isso pode ser visto com
mais calma quando você não está correndo por dentro.
Se a mente se distrair, volte para os pés. Passo após passo. Direito. Esquerdo. Presença em
movimento.
Repita mentalmente, se quiser: eu caminho aqui. Eu caminho agora. Eu volto ao meu corpo a cada
passo.
Permaneça nessa prática por alguns minutos. Depois, diminua o ritmo e pare devagar. Sinta
novamente os pés no chão e o corpo inteiro presente. Reconheça que a atenção também pode
acompanhar você em movimento.`
  },
  {
    id: 6,
    title: 'Observando Sons',
    category: 'Presença e atenção',
    emoji: '🎧',
    description: '5 min • Prática guiada',
    text: `Sente-se confortavelmente e feche os olhos, se quiser. Respire fundo e deixe o corpo se acomodar.
Agora, em vez de focar na respiração, leve sua atenção para a escuta.
Perceba os sons ao redor sem precisar nomear tudo imediatamente. Apenas receba os sons. Os
mais próximos. Os mais distantes. Os contínuos. Os breves. Os suaves. Os inesperados.
Note que a escuta pode acontecer sem esforço. O som chega até você. Você não precisa caçá-lo.
Se a mente começar a julgar os sons como bons ou ruins, agradáveis ou incômodos, apenas
perceba isso também. E volte a escutar com mais neutralidade.
Agora experimente ouvir até mesmo o silêncio entre os sons. Os pequenos intervalos. As pausas. Os
espaços.
Repita em silêncio: eu escuto sem agarrar. Eu percebo sem me prender. Eu estou presente ao que
chega.
Permaneça mais um pouco nessa escuta aberta. Depois, traga a atenção de volta para o corpo e
abra os olhos, levando consigo uma percepção mais fina do instante presente.`
  },
  {
    id: 7,
    title: 'Body Scan',
    category: 'Para relaxamento e sono',
    emoji: '✨',
    description: '7 min • Prática guiada',
    audio: {
      feminino: '/meditations/body-scan-feminino.mp3',
      masculino: '/meditations/body-scan-masculino.mp3'
    },
    text: `Encontre uma posição confortável, de preferência deitado ou sentado com apoio. Feche os olhos
suavemente. Respire fundo pelo nariz e solte pela boca. Mais uma vez, inspire profundamente e
expire devagar.
Agora permita que sua respiração encontre um ritmo natural. Você não precisa fazer esforço. Apenas
estar presente.
Vamos fazer um relaxamento pelo corpo, parte por parte. Não há nada para forçar. Apenas perceber
e soltar.
Leve sua atenção para os pés. Sinta os dedos, a sola e o peito dos pés. Observe qualquer sensação:
calor, frio, formigamento, peso ou até ausência de sensação. Apenas perceba.
Agora, ao expirar, imagine que os pés relaxam completamente. Solte os pés. Leve a atenção para os
tornozelos e para as panturrilhas. Perceba essas regiões e, se houver tensão, apenas note. Na
próxima expiração, solte.
Vá para os joelhos. Perceba a frente, as laterais e a parte de trás dos joelhos. Observe e solte. Leve
a atenção para as coxas. Sinta o peso delas. Sinta o contato com a superfície onde você está.
Permita que fiquem mais pesadas, mais soltas, mais relaxadas.
Agora observe o quadril e a região da bacia. Essa área costuma guardar muitas tensões. Apenas
perceba. Respire fundo e, ao soltar o ar, relaxe essa região.
Leve a atenção para a barriga. Observe o movimento suave da respiração. A barriga sobe e desce.
Se houver tensão no abdômen, permita que ele amoleça. Solte. Não precisa segurar nada agora.
Agora observe o peito. Sinta o coração, a respiração e o movimento interno da vida acontecendo.
Respire com suavidade. E relaxe o peito.
Leve a atenção para a parte baixa das costas, depois para a parte média e para a parte alta das
costas. Perceba se existe algum ponto apertado, cansado ou pesado. Ao expirar, imagine que as
costas se espalham e relaxam.
Agora vá para os ombros. Muitas vezes carregamos o dia inteiro neles. Perceba o peso que existe aí
e solte. Deixe os ombros caírem. Sem esforço. Apenas relaxe.
Leve a atenção para os braços. Braço direito, cotovelo, antebraço, punho, mão direita, dedos da mão
direita. Tudo relaxando. Depois faça o mesmo com o braço esquerdo, percebendo cada parte e
deixando tudo relaxar.
Observe o pescoço e permita que a nuca relaxe. Leve a atenção para a mandíbula. Se ela estiver
apertada, solte. Afrouxe a boca. Relaxe a língua dentro da boca. Relaxe as bochechas, o nariz, os
olhos, as pálpebras e a testa.
Deixe o espaço entre as sobrancelhas ficar suave e tranquilo. Agora observe o topo da cabeça e
sinta o corpo inteiro ao mesmo tempo. Dos pés à cabeça, todo o seu corpo aqui, presente,
respirando, descansando.
Se houver alguma região ainda tensa, leve o ar até ela com a imaginação. E, ao expirar, solte.
Respire naturalmente por alguns instantes, sentindo o corpo inteiro mais calmo, mais solto e mais
presente.
Repita mentalmente: meu corpo pode relaxar. Eu permito o descanso. Eu solto a tensão. Eu acolho a
calma. Depois, aos poucos, volte sua atenção ao ambiente. Mexa devagar os dedos das mãos, os
pés, faça pequenos movimentos com calma e, quando quiser, abra os olhos. Leve essa sensação de
relaxamento com você.`
  },
  {
    id: 8,
    title: 'Para Dormir',
    category: 'Para relaxamento e sono',
    emoji: '🌙',
    description: '15 min • Prática guiada',
    text: `Deite-se de forma confortável e permita que o seu corpo encontre a posição mais tranquila possível.
Ajuste travesseiro, coberta e temperatura. Agora não há mais nada a fazer. Apenas descansar.
Feche os olhos. Respire fundo pelo nariz e solte lentamente pela boca. Mais uma vez. Com cada
expiração, imagine o corpo afundando um pouco mais na cama.
Deixe o dia começar a se afastar. Não é hora de decidir nada, resolver nada ou revisar tudo o que
aconteceu. O dia pode ficar do lado de fora por alguns minutos. Este momento é apenas para
repousar.
Leve atenção para os pés e permita que eles relaxem. Depois para as pernas, os joelhos, as coxas.
Solte o quadril. Solte a barriga. Solte o peito. Solte os ombros. Solte os braços, as mãos, o pescoço,
o rosto, os olhos, a testa.
Perceba a cama sustentando o seu corpo. Você não precisa se segurar. Você pode se entregar ao
apoio que já está aí.
Agora imagine uma noite silenciosa e segura ao seu redor. O quarto, o escuro, a quietude, tudo
colaborando para que o seu corpo entenda que já pode descansar.
Se pensamentos surgirem, não tente vencê-los. Imagine que eles são como folhas passando por um
rio. Você vê, mas não precisa ir junto. Você pode permanecer deitado, observando de longe,
deixando cada pensamento seguir adiante.
Leve a atenção para a respiração. O ar entra. O ar sai. O corpo desce um pouco mais. O rosto
amolece um pouco mais. O peito se acalma um pouco mais.
Repita em silêncio: eu não preciso terminar o dia perfeito para merecer descansar. Eu não preciso ter
controle de tudo para poder dormir. Meu corpo conhece o caminho do repouso.
Imagine agora que uma sensação de sonolência começa nos pés e sobe lentamente. Ela passa
pelas pernas, pelo ventre, pelo peito, pelos ombros, pelos braços, pelo pescoço e chega à cabeça.
Tudo fica mais calmo, mais pesado, mais quieto.
Se quiser, visualize uma luz suave e morna envolvendo você como um cobertor tranquilo. Essa luz
protege, acolhe e silencia o excesso.
Continue por alguns instantes apenas respirando e se deixando levar por esse estado de descanso.
Não há necessidade de ficar atento até o fim. Você pode simplesmente adormecer quando o sono
chegar.
Se ainda estiver acordado, apenas permaneça com a respiração macia e com o corpo solto. A noite
continua trabalhando a seu favor. O descanso está se aproximando. Você pode confiar nisso.`
  },
  {
    id: 9,
    title: 'Para Encerrar o Dia',
    category: 'Para relaxamento e sono',
    emoji: '🌆',
    description: '10 min • Prática guiada',
    text: `Encontre uma posição confortável e perceba que o dia está chegando ao fim. Não há necessidade de
reviver tudo outra vez. Por alguns minutos, apenas permita-se pousar.
Respire fundo e solte o ar devagar. Imagine que a correria começa a baixar de volume. A luz do dia
vai ficando mais distante e o corpo pode entrar em outro ritmo.
Volte mentalmente apenas para reconhecer o que foi vivido. Talvez o dia tenha sido leve. Talvez
pesado. Talvez misturado. Não precisa julgar. Apenas reconhecer: foi o dia possível.
Agora diga a si mesmo: eu não preciso carregar o dia inteiro para dentro da noite. Eu posso
descansar do que vivi.
Se algo ficou inacabado, reconheça sem desespero. O que for importante poderá ser retomado no
tempo certo. O que não está em suas mãos pode ser solto por agora.
Leve a atenção para o corpo. Solte a testa, os olhos, a boca, o pescoço, os ombros. Desça pelo
peito, pela barriga, pelas pernas, até os pés. Deixe o dia sair pelo corpo.
Escolha uma coisa pela qual agradecer hoje, por menor que seja. Depois escolha algo que deseja
deixar ir. Agradeça por uma coisa. Solte uma coisa.
Repita mentalmente: o dia termina. Eu posso descansar. Nem tudo precisa ser concluído agora. Eu
mereço repouso.
Permaneça em silêncio por alguns instantes, deixando a noite acolher você. Depois, quando quiser,
abra os olhos ou siga naturalmente para o descanso.`
  },
  {
    id: 10,
    title: 'Relaxamento Profundo',
    category: 'Para relaxamento e sono',
    emoji: '🛌',
    description: '15 min • Prática guiada',
    text: `Deite-se confortavelmente e permita que o corpo seja totalmente sustentado. Faça um último ajuste
na postura e, depois disso, dê a si mesmo permissão para não fazer mais nada.
Respire fundo e solte o ar lentamente. Sinta o corpo pesado. Como se a gravidade estivesse
convidando cada músculo a desistir de se manter em alerta.
Relaxe os pés. Relaxe as pernas. Relaxe o quadril. Relaxe a barriga. Relaxe o peito. Relaxe os
ombros. Relaxe os braços, as mãos, o pescoço, a face, os olhos, a testa.
Agora imagine que cada expiração afunda você um pouco mais em um estado de repouso. Sem
medo. Sem esforço. Apenas relaxamento seguro.
Se algum pensamento aparecer, deixe-o passar sem segui-lo. Se alguma tensão insistir, apenas
respire até ela. Não force o desaparecimento. Convide o abrandamento.
Imagine uma onda de descanso passando lentamente pelo corpo inteiro. Dos pés à cabeça. Da
cabeça aos pés. Como se tudo em você recebesse permissão para soltar.
Repita mentalmente: eu descanso. Eu solto. Eu permito que meu corpo se recupere. Eu permito que
minha mente desacelere.
Permaneça por alguns instantes nesse estado profundo de relaxamento. Não há necessidade de se
apressar para voltar. Quando quiser, comece a mover o corpo bem devagar e abra os olhos,
trazendo consigo essa quietude.`
  },
  {
    id: 11,
    title: 'Gratidão',
    category: 'Emocionais e cura interior',
    emoji: '🙏',
    description: '5 min • Prática guiada',
    audio: {
      feminino: '/meditations/gratidao-feminino.mp3',
      masculino: '/meditations/gratidao-masculino.mp3'
    },
    text: `Sente-se ou deite-se confortavelmente. Feche os olhos. Respire fundo pelo nariz e solte devagar
pela boca. Mais uma vez, inspire calma e expire qualquer tensão.
Agora deixe a respiração fluir de forma natural. Permita-se desacelerar. Neste momento, não vamos
focar no que falta. Não vamos focar no que deu errado. Por alguns minutos, vamos lembrar do que
existe de bom, do que sustenta sua vida, do que ainda floresce dentro e fora de você.
Leve sua atenção ao coração. Imagine que você respira pelo coração. Inspirando com suavidade,
expirando com ternura.
Agora pense em algo simples pelo qual você pode ser grato hoje. Talvez a sua respiração. Talvez
sua casa. Talvez uma refeição. Talvez o fato de estar vivo. Talvez a chance de recomeçar.
Não precisa ser algo grandioso. A gratidão começa nas pequenas coisas. Sinta essa gratidão no
peito, como um calor suave, como uma luz delicada se acendendo dentro de você.
Lembre-se de uma pessoa que, de alguma forma, fez bem à sua vida. Pode ser alguém próximo.
Pode ser alguém do passado. Pode ser alguém que ajudou você com uma palavra, um gesto ou uma
presença. Apenas traga essa pessoa à mente e agradeça em silêncio.
Repita em seu coração: obrigado. Obrigado pela presença. Obrigado pelo que recebi. Perceba como
seu coração responde a isso.
Agora lembre-se de algo em você que merece reconhecimento. Talvez sua força. Talvez sua
persistência. Talvez sua fé. Talvez sua coragem de continuar, mesmo nos dias difíceis. Agradeça
também a si mesmo.
Repita mentalmente: eu agradeço por não ter desistido. Eu agradeço pela minha força. Eu agradeço
por tudo que estou aprendendo.
Imagine que a gratidão cresce dentro do seu peito e se espalha pelo corpo inteiro. Ela toca sua
mente, seus ombros, seus braços, sua barriga, suas pernas, seus pés. Essa energia suave preenche
você.
Repita mentalmente: sou grato pela vida que existe em mim. Sou grato pelas pequenas bênçãos de
cada dia. Sou grato pelo que tenho, pelo que sou e pelo que ainda posso construir. A gratidão traz
luz ao meu coração.
Fique por alguns instantes apenas sentindo. Se vier alguma emoção, acolha. Se vier paz, acolha. Se
vier silêncio, acolha também. A gratidão não apaga os problemas, mas fortalece o coração para
atravessá-los.
Respire fundo mais uma vez. Perceba seu corpo. Perceba o ambiente. Mexa devagar as mãos, os
pés, e, quando quiser, abra os olhos. Que você siga com mais leveza, mais consciência e mais
gratidão.`
  },
  {
    id: 12,
    title: 'Para Ansiedade',
    category: 'Outras Meditações',
    emoji: '🌿',
    description: '10 min • Prática guiada',
    text: `Encontre uma posição confortável e permita que o seu corpo seja sustentado. Se quiser, coloque
uma das mãos sobre o peito e a outra sobre a barriga. Sinta o contato das mãos com o corpo. Sinta
que você está aqui.
Respire fundo pelo nariz e solte pela boca, como se estivesse esvaziando um peso. Mais uma vez.
Agora deixe a respiração seguir no seu ritmo, sem cobrança.
Se a ansiedade estiver presente, não precisa expulsá-la à força. Não precisa fingir que ela não
existe. Neste momento, você só vai reconhecer: há tensão aqui. Há agitação aqui. E eu posso me
aproximar disso com mais calma.
Observe o corpo. Perceba se a mandíbula está apertada. Se os ombros estão altos. Se o peito está
fechado. Se a barriga está rígida. Apenas note, com honestidade e sem julgamento.
Agora imagine que a sua respiração está criando um pouco mais de espaço dentro de você. A cada
inspiração, um pouco mais de ar. A cada expiração, um pequeno afrouxamento.
Talvez a mente queira correr para o futuro. Talvez queira antecipar problemas, buscar respostas,
inventar cenários. Perceba isso e, com delicadeza, diga a si mesmo: neste instante, eu estou aqui.
Neste instante, eu posso respirar. Neste instante, eu não preciso resolver tudo ao mesmo tempo.
Volte para sensações concretas. O contato do corpo com a cadeira ou com a cama. A temperatura
do ar. O peso dos pés. O som do ambiente. Use o presente como uma âncora.
Agora faça uma respiração um pouco mais profunda e solte o ar mais lentamente. Sem exagero.
Apenas um pouco mais devagar. Como se o corpo recebesse uma mensagem de segurança.
Repita mentalmente: eu não preciso acompanhar todos os pensamentos. Eu posso desacelerar por
dentro. Eu posso atravessar este momento um passo de cada vez.
Se alguma emoção surgir, permita que ela exista por alguns instantes sem que você precise se
tornar ela. Você pode sentir sem afundar. Você pode observar sem ser arrastado.
Continue respirando. A ansiedade talvez não desapareça de uma vez, mas o seu modo de se
relacionar com ela pode mudar agora. Você pode oferecer ao seu próprio corpo um pouco mais de
presença, um pouco mais de acolhimento, um pouco mais de espaço.
Quando estiver pronto, sinta novamente as mãos, os pés, o rosto, o ambiente ao seu redor. Respire
fundo mais uma vez e abra os olhos devagar. Leve com você a lembrança de que a calma pode
começar em algo muito simples: voltar para o agora.`
  },
  {
    id: 13,
    title: 'Para Aliviar o Estresse',
    category: 'Para acalmar a mente',
    emoji: '💆',
    description: '10 min • Prática guiada',
    audio: {
      feminino: '/meditations/aliviar_estresse/feminino.mp3',
      srtFeminino: '/meditations/aliviar_estresse/feminino.srt',
      masculino: '/meditations/aliviar_estresse/masculino.mp3',
      srtMasculino: '/meditations/aliviar_estresse/masculino.srt'
    },
    text: `Sente-se ou deite-se confortavelmente. Respire fundo e solte o ar como se estivesse abrindo uma
válvula de pressão. Faça isso mais uma vez e sinta o corpo percebendo que pode desacelerar.
Agora observe onde o estresse aparece em você. Talvez nos ombros. Talvez no peito. Talvez na
mandíbula, na testa, na respiração curta, no corpo agitado. Apenas perceba.
Em vez de brigar com essa tensão, aproxime-se dela com mais curiosidade. O que o seu corpo está
tentando dizer? O que está apertado aí dentro? O que está carregado demais?
A cada inspiração, imagine que você leva oxigênio para as áreas mais tensas. A cada expiração,
imagine que o corpo pode soltar um pouco do peso, mesmo que só um pouco.
Permita que os ombros desçam. Afrouxe a mandíbula. Relaxe a testa. Solte as mãos. Dê ao corpo
sinais concretos de que ele já não precisa permanecer em alerta o tempo todo.
Agora pense em tudo aquilo que você vem carregando. Compromissos, preocupações, cobranças,
exigências, pressa. Por alguns instantes, imagine que você pode colocar tudo isso ao lado, como
quem deixa uma mochila pesada no chão.
Você não está abandonando suas responsabilidades. Está apenas interrompendo o excesso. Está
criando um pequeno espaço para respirar melhor, pensar melhor e existir melhor.
Repita mentalmente: eu posso parar por um momento. Eu posso aliviar a pressão. Eu não preciso
carregar tudo de uma só vez.
Imagine o estresse se dissolvendo lentamente do alto da cabeça até os pés, como se a água levasse
embora o que estava acumulado por dentro.
Fique por alguns instantes sentindo o corpo um pouco mais leve. Depois, volte devagar ao ambiente.
Perceba os sons, o apoio abaixo de você e a sua respiração mais espaçosa. Abra os olhos quando
quiser, levando consigo um pouco mais de leveza.`
  },
  {
    id: 14,
    title: 'Autocompaixão',
    category: 'Emocionais e cura interior',
    emoji: '🤍',
    description: '8 min • Prática guiada',
    text: `Encontre uma posição confortável e respire com suavidade. Traga a atenção para o coração. Talvez
você esteja carregando cansaço, frustração, culpa ou dureza consigo mesmo. Apenas reconheça
isso.
Agora imagine que você está diante de alguém que ama muito e que está sofrendo. Pense em como
você falaria com essa pessoa. Qual seria o tom da sua voz? Que palavras de acolhimento você
ofereceria?
Perceba então que você também merece essa mesma qualidade de cuidado. Você não precisa se
tratar como inimigo. Você pode ser abrigo para si.
Respire fundo e diga mentalmente: isto está sendo difícil para mim. E eu reconheço isso. Eu não
preciso me diminuir para continuar. Eu posso me acolher enquanto atravesso este momento.
Se houver dor, permita que ela exista por alguns instantes sem acrescentar crueldade. Se houver
falhas, lembre-se de que ser humano inclui imperfeição. Se houver cansaço, lembre-se de que você
não é máquina.
Imagine uma presença bondosa ao seu lado, ou dentro de você, oferecendo calor, compreensão e
apoio. Deixe essa sensação tocar seu peito, seus ombros, seu rosto.
Repita mentalmente: que eu seja gentil comigo. Que eu me trate com mais ternura. Que eu encontre
força sem violência. Que eu me permita recomeçar.
Permaneça mais um pouco sentindo esse cuidado. Depois, lentamente, traga a atenção de volta para
a respiração e para o ambiente. Abra os olhos quando quiser, levando consigo uma postura mais
humana e amorosa consigo mesmo.`
  },
  {
    id: 15,
    title: 'Amor-Bondade (Metta)',
    category: 'Espirituais e expansivas',
    emoji: '💗',
    description: '10 min • Prática guiada',
    text: `Sente-se de forma confortável e respire com calma. Traga a atenção para o centro do peito. Imagine
que existe aí uma fonte silenciosa de bondade, pronta para se expandir.
Comece dirigindo essa bondade para você mesmo. Não como vaidade, mas como cuidado. Diga em
silêncio: que eu esteja em paz. Que eu esteja seguro. Que eu tenha saúde. Que eu viva com leveza.
Repita essas frases lentamente, permitindo que elas encontrem algum espaço dentro de você.
Mesmo que ainda não pareçam totalmente verdadeiras, apenas plante as sementes.
Agora pense em alguém que você ama ou por quem sente carinho com facilidade. Traga essa
pessoa à mente e ofereça as mesmas intenções: que você esteja em paz. Que você esteja seguro.
Que você tenha saúde. Que você viva com leveza.
Observe o coração se abrindo um pouco mais. Agora expanda para alguém neutro, alguém que
cruza seu caminho, mas sobre quem você raramente pensa. Ofereça a essa pessoa o mesmo desejo
de bem.
Se desejar, também inclua alguém com quem exista dificuldade. Não é para concordar com tudo,
nem para ignorar limites. É apenas reconhecer que todo ser humano também sofre, busca paz e
tenta viver como pode.
Repita: que você encontre paz. Que você encontre clareza. Que você se liberte do sofrimento
desnecessário.
Agora imagine essa bondade se expandindo além das pessoas específicas. Para sua casa. Para sua
rua. Para sua cidade. Para todos os seres. Como ondas suaves que se espalham sem esforço.
Permaneça por alguns instantes nesse estado de benevolência. Perceba como o coração se sente
quando deixa de se contrair tanto e se permite irradiar cuidado.
Quando quiser encerrar, respire fundo e traga a atenção de volta para o corpo. Abra os olhos
devagar. Leve consigo essa intenção de caminhar no mundo com mais gentileza.`
  },
  {
    id: 16,
    title: 'Perdão',
    category: 'Emocionais e cura interior',
    emoji: '🕊️',
    description: '10 min • Prática guiada',
    text: `Encontre uma posição confortável e respire fundo. O perdão não é pressa. O perdão não é apagar a
dor com uma borracha. É um processo de liberar o que continua ferindo por dentro.
Comece reconhecendo o que pesa no seu coração. Talvez uma mágoa antiga. Talvez uma ferida
recente. Talvez algo que você fez. Talvez algo que fizeram com você. Apenas reconheça.
Perceba como essa história vive no seu corpo. Onde ela aperta? Onde ela endurece? Onde ela
cansa? Apenas observe, sem se obrigar a resolver tudo agora.
Respire com suavidade. A cada expiração, imagine que você abre um pequeno espaço entre você e
essa dor. Não para negar o que aconteceu, mas para que ela não ocupe todo o seu interior.
Se for possível hoje, diga em silêncio: eu escolho não alimentar ainda mais essa ferida. Eu escolho
dar um passo em direção à liberdade interior, mesmo que pequeno.
Se o perdão for dirigido a outra pessoa, lembre-se de que perdoar não significa permitir novos
abusos, nem perder discernimento. Significa interromper o veneno que continua circulando dentro de
você.
Se o perdão for para si mesmo, reconheça que arrependimento pode ensinar, mas culpa eterna não
cura. Você pode aprender, reparar o que for possível e seguir adiante com mais consciência.
Repita mentalmente: eu libero, aos poucos, o peso que já não quero carregar. Eu me abro para a
cura no meu tempo. Eu permito que meu coração respire melhor.
Fique por alguns instantes com essa intenção. Não exija uma solução total. Honre apenas a
sinceridade de ter se aproximado desse tema com coragem.
Quando quiser, volte a perceber o corpo, a respiração e o ambiente. Abra os olhos levando consigo a
compreensão de que o perdão verdadeiro amadurece em passos, e cada passo já importa.`
  },
  {
    id: 17,
    title: 'Soltar Pensamentos Negativos',
    category: 'Para acalmar a mente',
    emoji: '🍃',
    description: '8 min • Prática guiada',
    text: `Sente-se confortavelmente e observe a respiração. Talvez a mente esteja presa em repetições,
previsões ruins, autocrítica ou lembranças dolorosas. Não se culpe por isso. Apenas reconheça o
movimento mental que está acontecendo.
Agora imagine que cada pensamento é apenas um evento passando pela mente, e não uma ordem
absoluta nem uma verdade final. Pensamentos aparecem. Pensamentos desaparecem. Eles não são
o todo de quem você é.
Perceba um pensamento negativo surgindo. Em vez de entrar nele, apenas nomeie: preocupação,
crítica, medo, comparação, culpa. Nomear já cria um pouco de distância.
Respire fundo e veja esse pensamento como uma nuvem, uma folha ou uma frase escrita na água.
Você percebe, mas não precisa agarrar.
Talvez ele volte. Tudo bem. O treino não é impedir o retorno, mas reduzir o apego. Sempre que
perceber que foi arrastado, volte com gentileza para a respiração.
Repita mentalmente: nem todo pensamento merece minha crença. Nem toda ideia precisa de espaço
dentro de mim. Eu posso deixar passar.
Agora imagine um céu mais amplo dentro de você. Os pensamentos são nuvens. Você é o céu. As
nuvens passam. O céu permanece.
Fique por mais alguns instantes sentindo essa amplitude. Depois, volte ao ambiente e abra os olhos
devagar. Leve consigo a lembrança de que você pode observar a mente sem obedecer a tudo o que
ela diz.`
  },
  {
    id: 18,
    title: 'Equilíbrio Emocional',
    category: 'Emocionais e cura interior',
    emoji: '⚖️',
    description: '10 min • Prática guiada',
    text: `Sente-se confortavelmente e observe a respiração. Em vez de tentar ser uma pessoa sem emoções,
o convite agora é aprender a não ser arrastado por tudo o que sente.
Perceba o que está mais vivo dentro de você hoje. Talvez ansiedade, irritação, tristeza, cansaço,
esperança, confusão. Apenas reconheça.
Agora imagine essas emoções como ondas. Algumas maiores. Algumas menores. Algumas suaves.
Algumas intensas. Todas passam por um mesmo mar.
Você não precisa negar a onda, mas também não precisa esquecer que é maior do que ela. A
emoção existe. E você continua aqui, observando.
Respire profundamente e sinta um eixo interno, como se houvesse um centro em você que
permanece mesmo quando a superfície se agita.
Repita mentalmente: eu sinto, mas não sou apenas o que sinto. Eu acolho, mas não me afundo. Eu
me regulo com presença.
Volte para o corpo. O corpo ajuda a mente a se equilibrar. Sinta os pés, a postura, o peso do corpo, o
ar entrando e saindo.
Permaneça alguns instantes nesse centro interno. Depois, volte ao ambiente e abra os olhos,
levando consigo a lembrança de que equilíbrio não é ausência de emoção; é presença suficiente
para atravessá-la.`
  },
  {
    id: 19,
    title: 'Confiança e Autoestima',
    category: 'Autoestima e fortalecimento pessoal',
    emoji: '💎',
    description: '8 min • Prática guiada',
    text: `Encontre uma posição confortável e respire fundo. Talvez você esteja precisando se lembrar do seu
valor sem depender o tempo todo da aprovação de fora.
Leve a atenção ao peito e pergunte a si mesmo: o que em mim merece ser reconhecido hoje? Talvez
sua coragem. Sua persistência. Sua capacidade de continuar. Sua sensibilidade. Sua inteligência
prática. Sua fé.
Permita-se enxergar em si algo verdadeiro, sem exagero e sem humilhação. Autoestima saudável
não é se colocar acima de ninguém. É parar de se diminuir.
Agora imagine uma postura interna mais firme. Ombros mais soltos, peito mais aberto, respiração
mais ampla. O corpo também participa da confiança.
Repita em silêncio: eu reconheço meu valor. Eu não preciso me apagar. Eu posso ocupar meu lugar
com dignidade. Eu posso aprender sem me desmerecer.
Se comparações surgirem, deixe-as passar. Cada vida tem seu tempo, seu caminho e suas provas.
Você não precisa virar outra pessoa para ter valor.
Permaneça por alguns instantes sentindo essa firmeza tranquila dentro de você. Depois, volte ao
ambiente e abra os olhos levando consigo uma presença mais segura e mais íntegra.`
  },
  {
    id: 20,
    title: 'Cura Interior',
    category: 'Emocionais e cura interior',
    emoji: '🌱',
    description: '12 min • Prática guiada',
    text: `Sente-se ou deite-se confortavelmente. Respire fundo. Hoje, o convite é oferecer espaço para partes
suas que ainda doem, ainda cansam ou ainda pedem cuidado.
Não é preciso entender tudo agora. Não é preciso abrir todas as feridas de uma vez. Basta trazer
uma atitude de escuta amorosa para dentro.
Imagine uma parte sua que precisa de acolhimento. Pode ser uma lembrança, uma fase da vida, uma
versão mais jovem de você, uma emoção que ficou reprimida, um cansaço acumulado. Traga isso à
presença com delicadeza.
Agora aproxime-se dessa parte com gentileza. Sem violência. Sem cobrança. Como quem se senta
ao lado de alguém ferido e diz: eu estou aqui.
Respire e imagine uma luz morna e suave envolvendo essa parte de você. Não para apagar a
história, mas para envolver a dor com presença e cuidado.
Se vier vontade de chorar, acolha. Se vier silêncio, acolha. Se vier resistência, acolha também. Nem
toda cura acontece com respostas imediatas. Às vezes ela começa apenas quando paramos de fugir
do que sente.
Repita mentalmente: eu me permito cuidar do que ainda dói. Eu não preciso me abandonar. Eu
posso me encontrar com ternura.
Permaneça alguns instantes nesse encontro interior. Permita que algo em você respire melhor.
Agora traga a consciência de volta ao corpo inteiro. Sinta o apoio, a respiração e o ambiente. Abra os
olhos quando quiser, levando consigo a compreensão de que cura também é a arte de permanecer
presente com aquilo que ainda está amadurecendo dentro de você.`
  },
  {
    id: 21,
    title: 'Aceitação',
    category: 'Emocionais e cura interior',
    emoji: '🍂',
    description: '8 min • Prática guiada',
    text: `Sente-se confortavelmente e respire com suavidade. Há situações que se transformam com ação.
Outras começam a se transformar quando paramos de lutar contra o fato de que elas existem.
Aceitar não é gostar. Não é desistir. Não é se acomodar. Aceitar é reconhecer a realidade presente
para então responder a ela com mais lucidez.
Observe o que em sua vida ou em seu mundo interno você tem resistido demais. Uma emoção, uma
limitação, uma perda, uma fase, uma verdade difícil. Apenas reconheça.
Agora diga a si mesmo: isto está aqui. Eu talvez não tenha escolhido isso. Mas neste momento, é
isso que existe.
Perceba como a resistência às vezes aperta ainda mais o sofrimento. E como um pequeno gesto de
aceitação pode abrir espaço para respirar.
Repita mentalmente: eu reconheço o que é. Eu não preciso acrescentar guerra interna a tudo o que
já dói. Eu posso responder com mais sabedoria.
Fique mais um pouco com essa atitude. Aceitação não é passividade; é clareza. Depois, volte ao
ambiente e abra os olhos com um pouco mais de espaço por dentro.`
  },
  {
    id: 22,
    title: 'Paciência',
    category: 'Emocionais e cura interior',
    emoji: '🐢',
    description: '7 min • Prática guiada',
    text: `Sente-se confortavelmente e observe a respiração. A paciência não é fraqueza. É força que não
precisa se provar o tempo todo correndo.
Talvez exista algo que você queira resolver logo, receber logo, entender logo. Perceba a urgência
que isso cria por dentro. Apenas perceba.
Agora imagine que a vida também amadurece em ritmos que não obedecem totalmente à sua
pressa. Algumas coisas crescem no tempo delas. Algumas respostas chegam quando o terreno
interno está pronto.
Respire profundamente e permita que cada expiração desacelere um pouco a inquietação. Você não
precisa arrancar o fruto verde do galho.
Repita em silêncio: eu posso esperar sem me quebrar por dentro. Eu posso continuar sem me
violentar. Eu respeito o tempo das coisas e o meu próprio tempo.
Fique por alguns instantes sentindo o corpo mais calmo e a mente menos precipitada. Depois, abra
os olhos levando consigo uma paciência mais madura e mais estável.`
  },
  {
    id: 23,
    title: 'Raiva e Irritação',
    category: 'Emocionais e cura interior',
    emoji: '🔥',
    description: '10 min • Prática guiada',
    text: `Encontre uma posição confortável e respire fundo. Se há raiva em você agora, reconheça sem
vergonha. A raiva é uma energia. O problema não é senti-la, e sim ser consumido por ela ou
descarregá-la sem consciência.
Observe onde a raiva aparece no corpo. No calor do rosto, na mandíbula, no peito, nos punhos, na
respiração curta. Apenas note o fogo.
Agora, em vez de jogar mais combustível, faça o oposto: crie espaço. Inspire. Expire mais longo.
Solte os ombros. Afrouxe o rosto. Abra as mãos.
A raiva costuma dizer que tudo precisa ser resolvido imediatamente. Mas nem toda urgência
emocional merece ação imediata. Muitas vezes, o primeiro passo mais sábio é não agir no auge da
onda.
Repita em silêncio: eu posso sentir raiva sem me tornar violência. Eu posso conter o impulso. Eu
posso escolher a forma da minha resposta.
Imagine essa energia sendo canalizada para baixo, descendo pelo corpo até os pés, encontrando
chão. O fogo não precisa explodir. Ele pode ser transformado em clareza, limite e firmeza.
Permaneça por alguns instantes respirando com essa intenção. Depois, perceba o ambiente, o corpo
e o apoio abaixo de você. Abra os olhos quando quiser, levando consigo mais domínio e menos
impulsividade.`
  },
  {
    id: 24,
    title: 'Tristeza',
    category: 'Emocionais e cura interior',
    emoji: '🌧️',
    description: '10 min • Prática guiada',
    text: `Sente-se ou deite-se confortavelmente. Respire com calma. Se há tristeza em você, não tente
expulsá-la imediatamente. Às vezes o coração precisa ser ouvido antes de ser animado.
Perceba onde essa tristeza mora no corpo. Talvez no peito pesado, nos olhos cansados, na falta de
energia, na vontade de se recolher. Apenas reconheça.
Agora imagine que você está oferecendo presença para essa tristeza, não abandono. Você não está
afundando; está acompanhando a dor com mais ternura.
Respire e diga a si mesmo: está difícil, e eu reconheço isso. Eu posso me tratar com mais delicadeza
enquanto atravesso este momento.
Se vier choro, permita. Se vier silêncio, permita. Nem toda dor precisa de explicação imediata.
Algumas só precisam de espaço para existir sem serem humilhadas.
Repita mentalmente: que eu seja gentil comigo. Que esta dor possa se mover aos poucos. Que eu
encontre consolo e força.
Fique por mais alguns instantes sentindo o cuidado em vez da pressa. Depois, volte lentamente ao
corpo, ao ambiente e à respiração. Abra os olhos quando quiser, levando consigo um pouco mais de
acolhimento.`
  },
  {
    id: 25,
    title: 'Luto',
    category: 'Emocionais e cura interior',
    emoji: '🕯️',
    description: '12 min • Prática guiada',
    text: `Encontre uma posição confortável e permita que este momento seja de respeito. O luto tem o seu
próprio tempo. Não é uma linha reta. Não é uma tarefa que se conclui. É um caminho que se
atravessa.
Respire fundo. Se houver ausência dentro de você, reconheça essa ausência. Se houver saudade,
amor, confusão, raiva, gratidão ou vazio, reconheça também. Tudo isso pode existir junto.
Hoje não é preciso explicar a dor. Apenas estar com ela de forma humana. O que foi importante
deixa marcas. E as marcas também falam de amor.
Se desejar, traga à mente a pessoa, a fase, o vínculo ou a realidade que se foi. Não para se ferir
mais, mas para honrar. Para reconhecer a importância do que existiu.
Agora imagine uma luz suave envolvendo sua memória e também o seu coração. Não para apagar a
saudade, mas para dar abrigo a ela.
Repita mentalmente: eu honro o que foi vivido. Eu honro o amor que existiu. Eu me permito sentir. Eu
me permito continuar.
Permaneça por alguns instantes nessa presença silenciosa. Talvez com lágrimas. Talvez com paz.
Talvez com uma mistura das duas.
Quando quiser, traga a atenção de volta ao corpo, à respiração e ao ambiente. Abra os olhos
devagar. Leve consigo a compreensão de que luto não é esquecer; é aprender a seguir carregando
amor de outra forma.`
  },
  {
    id: 26,
    title: 'Observando Emoções',
    category: 'Emocionais e cura interior',
    emoji: '🌊',
    description: '8 min • Prática guiada',
    text: `Sente-se de forma confortável e respire com calma. Hoje, a prática é se aproximar das emoções sem
ser engolido por elas.
Perceba qual emoção está mais viva agora. Talvez inquietação. Talvez tristeza. Talvez irritação.
Talvez alegria. Talvez um misto difícil de nomear.
Em vez de dizer eu sou isso, experimente dizer: há isso em mim neste momento. Essa pequena
mudança cria espaço.
Observe como a emoção aparece no corpo. Onde ela toca? Onde aperta? Onde aquece? Onde
esvazia? O corpo ajuda a perceber a emoção com mais clareza do que a cabeça sozinha.
Agora permita que essa emoção exista por alguns instantes sem precisar corrigi-la. Você está
treinando presença, não repressão.
Repita mentalmente: eu posso observar o que sinto. Eu posso acolher sem me perder. As emoções
se movem. Eu permaneço.
Fique por mais alguns instantes nesse olhar estável. Depois, volte à respiração e ao ambiente. Abra
os olhos quando quiser, levando consigo mais maturidade emocional.`
  },
  {
    id: 27,
    title: 'Foco e Concentração',
    category: 'Presença e atenção',
    emoji: '🎯',
    description: '7 min • Prática guiada',
    text: `Sente-se de forma estável, com o corpo desperto e relaxado ao mesmo tempo. Respire fundo e solte
o ar devagar. Perceba a sua presença se reunindo no agora.
Hoje, o convite é treinar a mente para permanecer um pouco mais inteira em uma coisa de cada vez.
Não com rigidez, mas com direção.
Escolha a respiração como ponto de foco. Observe o ar tocando as narinas, o peito se movendo ou a
barriga subindo e descendo. Fique com esse ponto de atenção.
Sempre que a mente sair, perceba com simplicidade: ela saiu. E volte. Sem irritação. Sem drama.
Apenas volte.
Esse retorno é o músculo da concentração sendo treinado. Não é a distração que define a prática. É
a volta.
Agora imagine que a sua atenção é como um feixe de luz que se torna mais estável. Menos
espalhado. Menos fragmentado. Mais inteiro.
Repita mentalmente: eu volto. Eu me reúno. Eu foco no que importa agora.
Permaneça por alguns instantes nesse exercício. Depois, amplie a atenção para o corpo inteiro.
Respire fundo e abra os olhos com a intenção de levar essa qualidade de presença para a próxima
tarefa do seu dia.`
  },
  {
    id: 28,
    title: 'Para Começar o Dia',
    category: 'Autoestima e fortalecimento pessoal',
    emoji: '🌅',
    description: '5 min • Prática guiada',
    text: `Sente-se confortavelmente e permita que este início de dia seja mais consciente. Antes de correr
para as tarefas, faça uma pausa curta para se encontrar.
Respire fundo pelo nariz e solte o ar devagar. Sinta o corpo acordando. Sinta o ambiente. Reconheça
que um novo dia está começando agora.
Não importa como foi ontem. Este momento abre um novo espaço. Um novo ritmo. Uma nova
oportunidade de escolher com mais presença.
Pergunte a si mesmo: como eu quero atravessar este dia? Com mais calma? Com mais clareza?
Com mais firmeza? Com mais gentileza?
Escolha uma palavra ou intenção simples. Talvez paz. Talvez foco. Talvez coragem. Talvez leveza.
Deixe essa palavra pousar no coração.
Agora imagine essa intenção acompanhando você nas próximas horas, influenciando sua forma de
falar, agir, responder e respirar.
Repita mentalmente: eu começo este dia presente. Eu começo este dia inteiro. Eu começo este dia
com intenção.
Respire mais uma vez, mova o corpo devagar e abra os olhos. Que o seu dia comece por dentro
antes de começar por fora.`
  },
  {
    id: 29,
    title: 'Energia e Disposição',
    category: 'Autoestima e fortalecimento pessoal',
    emoji: '☀️',
    description: '6 min • Prática guiada',
    text: `Sente-se com a coluna um pouco mais desperta. Respire fundo pelo nariz e solte o ar pela boca.
Mais uma vez. Sinta o corpo acordando por dentro.
Se houver cansaço, reconheça sem julgamento. Mas agora convide a vitalidade possível deste
momento a se fazer presente.
Imagine que a cada inspiração entra energia limpa, clara, renovadora. E que a cada expiração sai o
peso da lentidão, da apatia e do excesso que derruba.
Alongue um pouco o pescoço, solte os ombros e deixe a postura mais viva. O corpo e a mente se
influenciam. Às vezes, uma postura mais aberta já muda o estado interno.
Repita mentalmente: eu desperto. Eu me coloco em movimento. A energia retorna ao meu corpo e à
minha mente.
Permaneça por alguns instantes respirando com mais vigor, mas sem tensão. Depois, abra os olhos
e leve consigo uma disposição mais presente e consciente.`
  },
  {
    id: 30,
    title: 'Conexão Espiritual',
    category: 'Espirituais e expansivas',
    emoji: '✨',
    description: '12 min • Prática guiada',
    text: `Encontre uma posição confortável e permita que este seja um momento de interiorização. Respire
fundo e solte o ar lentamente. Sinta a sua presença se tornando mais serena.
Agora, leve a atenção para o centro do peito e imagine que existe dentro de você um espaço
sagrado, silencioso e vivo. Um lugar interno onde você pode se reencontrar com algo maior.
Talvez você chame isso de Deus, de presença, de luz, de espírito, de fonte, de essência. Não
importa o nome. O que importa é a experiência de abertura e reverência.
Permita que a mente desacelere e que o coração se torne mais receptivo. Você não precisa forçar
uma sensação extraordinária. Basta se disponibilizar para escutar por dentro.
Imagine uma luz suave descendo sobre você e envolvendo todo o seu corpo. Essa luz traz amparo,
clareza, proteção e presença.
Repita mentalmente: eu me abro para a sabedoria, para a paz e para a orientação que vêm de uma
fonte maior. Que eu seja receptivo ao bem. Que eu seja guiado com amor.
Permaneça alguns instantes nesse silêncio, como quem escuta sem pressa. Talvez venha paz.
Talvez venha nada aparente. Tudo bem. A conexão espiritual também amadurece na simplicidade.
Quando quiser, respire mais profundamente, perceba o corpo e o ambiente, e abra os olhos com
reverência. Leve consigo a sensação de que você não está sozinho no caminho.`
  },
  {
    id: 31,
    title: 'Visualização Positiva',
    category: 'Visualização e intenção',
    emoji: '🌈',
    description: '10 min • Prática guiada',
    text: `Sente-se confortavelmente e respire com calma. Permita que a mente se torne um pouco mais aberta
e receptiva a imagens internas.
Agora imagine um cenário que represente bem-estar, segurança e possibilidade. Pode ser uma
paisagem, um lugar de luz, um jardim, uma praia tranquila, uma montanha silenciosa. Escolha o que
mais faz sentido para você.
Observe esse lugar com detalhes. As cores. A temperatura. Os sons. A sensação do ar. Deixe sua
imaginação construir um ambiente onde o seu sistema inteiro possa respirar melhor.
Agora imagine a melhor versão possível de você mesmo atravessando os próximos dias com mais
presença, mais clareza e mais confiança. Não uma fantasia vazia, mas uma imagem orientadora.
Veja-se falando com mais calma, agindo com mais consciência, tomando decisões mais sábias e
cuidando de si com mais fidelidade.
Repita em silêncio: eu posso cultivar um futuro mais saudável a partir do que faço agora. Eu posso
me orientar por imagens de paz, força e verdade.
Permaneça por alguns instantes nessa visualização, deixando que o corpo sinta um pouco do que a
mente está imaginando.
Depois, volte lentamente para a respiração, para o corpo e para o ambiente. Abra os olhos levando
consigo essa direção positiva.`
  },
  {
    id: 32,
    title: 'Manifestar Objetivos',
    category: 'Visualização e intenção',
    emoji: '🪄',
    description: '10 min • Prática guiada',
    text: `Sente-se de forma confortável e respire profundamente. Antes de manifestar algo, conecte-se com o
que você realmente quer e com o tipo de pessoa que deseja ser enquanto caminha até isso.
Traga à mente um objetivo importante. Algo que faça sentido de verdade para você. Não apenas
desejo vazio, mas direção com propósito.
Agora pergunte a si mesmo: por que isso importa? O que esse objetivo representa? Crescimento?
Liberdade? Segurança? Serviço? Realização? Clareie o coração por trás da meta.
Imagine esse objetivo já em movimento, não necessariamente concluído de forma mágica, mas vivo,
possível, sendo alimentado por ações consistentes.
Veja-se dando passos reais, com disciplina, paciência, foco e confiança. A manifestação madura une
visão interna e compromisso prático.
Repita mentalmente: eu me alinho com o que desejo construir. Eu abro caminho com clareza. Eu ajo
com constância. Eu sustento o que é importante para mim.
Permaneça alguns instantes fortalecendo essa imagem por dentro. Depois, volte ao corpo e ao
ambiente. Abra os olhos com a intenção de transformar visão em prática.`
  },
  {
    id: 33,
    title: 'Chakras',
    category: 'Espirituais e expansivas',
    emoji: '🌀',
    description: '15 min • Prática guiada',
    text: `Encontre uma posição confortável e respire com calma. Hoje, vamos percorrer o corpo como um eixo
de energia e consciência, do ponto mais baixo ao mais alto.
Comece levando a atenção para a base da coluna. Imagine uma luz vermelha estável e firme. Sinta
segurança, enraizamento e presença no corpo. Diga em silêncio: eu pertenço à vida. Eu estou
seguro.
Suba a atenção para a região abaixo do umbigo. Imagine uma luz laranja, viva e fluida. Permita que a
criatividade, o sentir e o movimento se despertem. Diga: eu permito que a vida flua em mim.
Agora leve a atenção para a região do plexo solar, acima do umbigo. Imagine uma luz amarela,
brilhante e forte. Sinta poder pessoal, direção e coragem. Diga: eu confio na minha força interior.
Suba para o coração. Imagine uma luz verde ou rosada, acolhedora e ampla. Sinta amor, compaixão,
conexão. Diga: eu me abro para amar e ser amado.
Leve a atenção para a garganta. Imagine uma luz azul clara. Sinta a expressão, a verdade e a
clareza. Diga: eu expresso a minha verdade com equilíbrio.
Agora vá para o centro da testa. Imagine uma luz azul-índigo profunda. Sinta intuição, visão e
discernimento. Diga: eu enxergo com mais clareza.
Por fim, leve a atenção para o topo da cabeça. Imagine uma luz violeta ou branca, aberta para o alto.
Sinta conexão, expansão e consciência. Diga: eu me abro para algo maior.
Agora imagine todas essas luzes alinhadas, criando um eixo de energia equilibrado dentro de você.
Respire e sinta o corpo inteiro como um campo vivo, integrado e presente.
Permaneça alguns instantes nessa integração. Depois, volte lentamente ao ambiente e abra os olhos
com suavidade.`
  },
  {
    id: 34,
    title: 'Mantras',
    category: 'Espirituais e expansivas',
    emoji: '🔔',
    description: '10 min • Prática guiada',
    text: `Sente-se confortavelmente e permita que o corpo fique estável. Respire fundo e solte o ar devagar.
Hoje, a âncora será um som, uma palavra ou uma frase repetida com presença.
Escolha um mantra simples que faça sentido para você. Pode ser paz, eu estou aqui, om, eu confio,
eu acolho, ou qualquer expressão que represente o estado que você deseja cultivar.
Agora comece a repetir esse mantra de forma silenciosa ou suave, acompanhando a respiração.
Inspire e deixe o mantra ressoar por dentro. Expire e repita novamente.
Perceba como a repetição cria um ritmo interno, como se a mente fosse sendo conduzida para uma
trilha mais simples e mais estável.
Se pensamentos surgirem, volte para o mantra. Se emoções surgirem, volte para o mantra. Se
distrações aparecerem, volte para o mantra.
Não se trata apenas de repetir mecanicamente, mas de deixar que a palavra penetre e organize um
pouco o espaço interior.
Permaneça por alguns instantes com essa repetição atenta. Depois, vá deixando o mantra mais
silencioso até permanecer apenas a sensação que ele desperta.
Respire fundo, sinta o corpo e abra os olhos levando consigo a vibração da palavra que escolheu
cultivar.`
  }
];

// Breathing exercises
const breathingExercises = [
  {
    id: '478',
    name: '4-7-8 Relaxamento',
    emoji: '😮‍💨',
    description: 'Técnica poderosa para reduzir ansiedade e induzir o sono',
    pattern: { inhale: 4, hold: 7, exhale: 8 },
    recommendedCycles: 4,
    fullDescription: 'Desenvolvida pelo Dr. Andrew Weil, baseada na prática antiga de pranayama (controle da respiração) do yoga. A proporção 4:7:8 ativa o sistema nervoso parassimpático, responsável pelo relaxamento profundo do corpo.',
    benefits: [
      'Reduz ansiedade e estresse rapidamente',
      'Ajuda a adormecer mais rápido',
      'Diminui a pressão arterial e frequência cardíaca',
      'Melhora a regulação emocional',
      'Auxilia no controle de ataques de pânico',
    ],
    howTo: [
      '1. Sente-se com as costas retas ou deite-se confortavelmente.',
      '2. Coloque a ponta da língua no céu da boca, atrás dos dentes superiores, e mantenha assim durante todo o exercício.',
      '3. Expire completamente pela boca, fazendo um som de "whoosh".',
      '4. Feche a boca e inspire silenciosamente pelo nariz contando até 4.',
      '5. Segure a respiração contando até 7.',
      '6. Expire completamente pela boca (som de "whoosh") contando até 8.',
      '7. Repita o ciclo de 3 a 4 vezes.',
    ],
    tip: '💡 O tempo exato importa menos que manter a proporção 4:7:8. Se sentir tontura, reduza a velocidade.',
  },
  {
    id: '333',
    name: '3-3-3 Anti-Ansiedade',
    emoji: '🆘',
    description: 'Rápido e direto para cortar pânico e ansiedade aguda',
    pattern: { inhale: 3, hold: 3, exhale: 3 },
    recommendedCycles: 5,
    fullDescription: 'Uma técnica de ancoragem extremamente simples e rápida, desenhada especificamente para quebrar espirais de pânico. A contagem curta de 3 segundos impede que a mente vagueie, forçando o foco imediato no momento presente e estabilizando os batimentos cardíacos.',
    benefits: [
      'Interrompe ataques de pânico em tempo real',
      'Fácil de lembrar sob forte estresse',
      'Desacelera batimentos cardíacos instantaneamente',
      'Traz a mente de volta ao momento presente',
    ],
    howTo: [
      '1. Pare o que estiver fazendo e foque em um ponto fixo.',
      '2. Inspire lentamente pelo nariz contando até 3.',
      '3. Segure a respiração contando até 3.',
      '4. Expire soltando o ar pela boca contando até 3.',
      '5. Continue o ciclo até sentir o desespero diminuir.',
    ],
    tip: '💡 Se o coração estiver batendo muito forte, concentre-se apenas em manter o ritmo constante dos 3 tempos.',
  },
  {
    id: 'box',
    name: 'Respiração Quadrada',
    emoji: '🔲',
    description: 'Usada por Navy SEALs para foco e controle sob pressão',
    pattern: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
    recommendedCycles: 5,
    fullDescription: 'Também conhecida como Box Breathing ou respiração 4x4, é uma técnica usada por Navy SEALs e profissionais de alto desempenho para manter a calma em situações de extremo estresse. Os quatro tempos iguais representam os quatro lados de um quadrado.',
    benefits: [
      'Melhora o foco e a concentração mental',
      'Reduz o cortisol (hormônio do estresse)',
      'Restaura o controle durante situações de pânico',
      'Diminui a frequência cardíaca e pressão arterial',
      'Ajuda na tomada de decisões sob pressão',
      'Melhora a qualidade do sono',
    ],
    howTo: [
      '1. Sente-se com as costas apoiadas e os pés no chão.',
      '2. Expire todo o ar dos pulmões suavemente.',
      '3. Inspire lentamente pelo nariz contando até 4, sentindo o abdômen expandir.',
      '4. Segure a respiração contando até 4 (sem fechar a boca ou nariz com força).',
      '5. Expire lentamente pela boca contando até 4, soltando todo o ar.',
      '6. Segure com os pulmões vazios contando até 4.',
      '7. Repita o ciclo de 4 a 6 vezes (3 a 5 minutos).',
    ],
    tip: '💡 Se 4 segundos for difícil no início, comece com 2 ou 3 segundos e vá aumentando gradualmente.',
  },
  {
    id: 'calm',
    name: 'Respiração Calmante',
    emoji: '🌊',
    description: 'Simples e eficaz — expiração longa ativa o relaxamento',
    pattern: { inhale: 4, exhale: 6 },
    recommendedCycles: 6,
    fullDescription: 'A técnica mais simples e acessível para o dia a dia. O segredo está na expiração mais longa que a inspiração: quando expiramos por mais tempo, ativamos diretamente o nervo vago e o sistema nervoso parassimpático, sinalizando ao corpo que é seguro relaxar.',
    benefits: [
      'Fácil de fazer em qualquer lugar e situação',
      'Ativa rapidamente o sistema de relaxamento do corpo',
      'Reduz ansiedade em poucos minutos',
      'Ideal para iniciantes em técnicas de respiração',
      'Pode ser praticada discretamente no trabalho ou transporte',
    ],
    howTo: [
      '1. Encontre uma posição confortável (sentado, em pé ou deitado).',
      '2. Relaxe os ombros e solte a mandíbula.',
      '3. Inspire suave e profundamente pelo nariz contando até 4.',
      '4. Expire lentamente pela boca contando até 6, como se soprasse uma vela sem apagar.',
      '5. Repita por 5 a 8 ciclos ou até sentir-se calmo.',
    ],
    tip: '💡 Foque em tornar a expiração suave e contínua. É a expiração longa que traz a calma.',
  },
  {
    id: 'diaphragm',
    name: 'Respiração Diafragmática',
    emoji: '🫁',
    description: 'A base de tudo — aprenda a respirar com a barriga',
    pattern: { inhale: 4, exhale: 6 },
    recommendedCycles: 8,
    fullDescription: 'A respiração diafragmática (ou abdominal) é a forma mais natural de respirar. Bebês respiram assim naturalmente, mas ao longo da vida passamos a respirar "pelo peito". Reaprender a usar o diafragma melhora a oxigenação, reduz estresse e é a base para todas as outras técnicas.',
    benefits: [
      'Melhora a oxigenação de todo o corpo',
      'Reduz tensão muscular no pescoço e ombros',
      'Diminui a frequência cardíaca',
      'Melhora a digestão (massageia os órgãos internos)',
      'Base para todas as outras técnicas respiratórias',
    ],
    howTo: [
      '1. Deite-se ou sente-se confortavelmente.',
      '2. Coloque uma mão no peito e outra na barriga.',
      '3. Inspire pelo nariz por 4 segundos — a barriga deve subir (não o peito).',
      '4. Expire pela boca por 6 segundos — a barriga desce suavemente.',
      '5. A mão no peito deve se mover o mínimo possível.',
      '6. Repita por 5-10 minutos.',
    ],
    tip: '💡 Se a barriga não sobe, tente deitado com um livro na barriga — ele deve subir ao inspirar.',
  },
  {
    id: 'nadi',
    name: 'Respiração Alternada',
    emoji: '👃',
    description: 'Nadi Shodhana — equilibra os hemisférios cerebrais',
    pattern: { inhale: 4, hold: 4, exhale: 4 },
    recommendedCycles: 6,
    fullDescription: 'Nadi Shodhana é uma técnica milenar do yoga que alterna a respiração entre as narinas. Na tradição yógica, acredita-se que purifica os canais de energia (nadis). Cientificamente, estimula alternadamente os hemisférios cerebrais, promovendo equilíbrio mental e emocional.',
    benefits: [
      'Equilibra os hemisférios cerebrais',
      'Melhora foco e clareza mental',
      'Reduz ansiedade e agitação',
      'Harmoniza o sistema nervoso',
      'Prepara a mente para meditação',
      'Melhora a qualidade do sono',
    ],
    howTo: [
      '1. Sente-se com a coluna ereta.',
      '2. Use o polegar direito para fechar a narina direita.',
      '3. Inspire pela narina esquerda contando até 4.',
      '4. Feche ambas as narinas e segure contando até 4.',
      '5. Solte a narina direita e expire por ela contando até 4.',
      '6. Inspire pela narina direita contando até 4.',
      '7. Feche e segure 4, depois expire pela esquerda.',
      '8. Isso completa 1 ciclo. Repita 6 vezes.',
    ],
    tip: '💡 Use o app para acompanhar o tempo, mas alterne as narinas manualmente com os dedos.',
  },
  {
    id: 'lion',
    name: 'Respiração do Leão',
    emoji: '🦁',
    description: 'Libere raiva, frustração e tensão do rosto',
    pattern: { inhale: 4, exhale: 2 },
    recommendedCycles: 5,
    fullDescription: 'Simhasana (postura do leão) do yoga. Envolve uma expiração forte e explosiva com a boca aberta, língua para fora e olhos arregalados. Pode parecer bobo, mas é extremamente eficaz para liberar tensão no rosto, mandíbula e garganta — áreas que acumulam muito estresse.',
    benefits: [
      'Libera raiva e frustração do corpo',
      'Relaxa os músculos do rosto e mandíbula',
      'Alivia tensão na garganta e pescoço',
      'Melhora a circulação sanguínea no rosto',
      'Efeito "reset" emocional instantâneo',
    ],
    howTo: [
      '1. Sente-se sobre os calcanhares ou em uma cadeira.',
      '2. Inspire profundamente pelo nariz por 4 segundos.',
      '3. Abra a boca bem grande, coloque a língua para fora (em direção ao queixo).',
      '4. Arregale os olhos e expire com força pela boca fazendo "HAAAA!".',
      '5. Sinta toda a tensão saindo junto com o som.',
      '6. Repita 5 vezes. É normal rir — faz parte!',
    ],
    tip: '💡 Faça em um lugar privado se preferir. Quanto mais "exagerado", mais eficaz!',
  },
  {
    id: 'kapalabhati',
    name: 'Respiração Energizante',
    emoji: '⚡',
    description: 'Kapalabhati — acorda, limpa a mente, dá energia',
    pattern: { inhale: 1, exhale: 1 },
    recommendedCycles: 20,
    fullDescription: 'Kapalabhati ("crânio brilhante" em sânscrito) é uma técnica de respiração energizante do yoga. Consiste em expirações curtas e fortes pelo nariz com inspirações passivas. Funciona como um "café natural", acelerando o metabolismo e limpando a mente. Ideal para começar o dia.',
    benefits: [
      'Aumenta energia e disposição rapidamente',
      'Melhora atenção e concentração',
      'Limpa as vias respiratórias',
      'Acelera o metabolismo',
      'Tonifica os músculos abdominais',
      'Combate sonolência e letargia',
    ],
    howTo: [
      '1. Sente-se com a coluna ereta.',
      '2. Faça uma inspiração profunda para começar.',
      '3. Expire forte e rápido pelo nariz (como se espirrasse), contraindo o abdômen.',
      '4. A inspiração acontece naturalmente quando o abdômen relaxa.',
      '5. Repita 20 expirações rápidas (1 por segundo).',
      '6. No final, inspire fundo, segure 5 segundos e expire lentamente.',
    ],
    tip: '💡 NÃO faça à noite (pode atrapalhar o sono). Ideal pela manhã ou antes de estudar/trabalhar.',
  },
  {
    id: 'coherence',
    name: 'Coerência Cardíaca 5-5',
    emoji: '❤️',
    description: 'Sincroniza coração e respiração — comprovada cientificamente',
    pattern: { inhale: 5, exhale: 5 },
    recommendedCycles: 6,
    fullDescription: 'A técnica de coerência cardíaca foi mapeada pelo HeartMath Institute. Respirar a 6 ciclos por minuto (5 seg inspira + 5 seg expira) cria "coerência" entre coração, cérebro e sistema nervoso. Comprovada em mais de 300 estudos científicos.',
    benefits: [
      'Sincroniza o ritmo cardíaco com a respiração',
      'Reduz cortisol (hormônio do estresse) em até 23%',
      'Aumenta DHEA (hormônio da juventude)',
      'Melhora clareza mental e tomada de decisão',
      'Equilibra o sistema nervoso autônomo',
      'Efeitos duram de 4 a 6 horas após a prática',
    ],
    howTo: [
      '1. Sente-se confortavelmente com os pés no chão.',
      '2. Foque sua atenção na região do coração.',
      '3. Inspire pelo nariz contando até 5, de forma suave.',
      '4. Expire pela boca contando até 5, de forma suave.',
      '5. Mantenha o ritmo constante por 5 minutos (6 ciclos por minuto).',
      '6. Pratique 3 vezes ao dia para efeitos máximos.',
    ],
    tip: '💡 A frequência ideal é 6 respirações por minuto. Use o timer do app para manter o ritmo exato.',
  },
  {
    id: 'sigh',
    name: 'Suspiro Fisiológico',
    emoji: '😮‍💨',
    description: 'Estudo de Stanford — a forma mais rápida de se acalmar',
    pattern: { inhale: 2, hold: 1, exhale: 6 },
    recommendedCycles: 3,
    fullDescription: 'Pesquisadores da Stanford University descobriram que o "suspiro fisiológico" é a forma mais rápida de reduzir o estresse em tempo real. Duas inspirações curtas pelo nariz seguidas de uma expiração longa pela boca. O corpo faz isso naturalmente quando chora ou antes de dormir. Funciona em apenas 1-3 ciclos.',
    benefits: [
      'Funciona em segundos (1-3 ciclos bastam)',
      'Comprovado pelo estudo de Stanford (2023)',
      'Mais eficaz que meditação para redução imediata de estresse',
      'O corpo já faz isso naturalmente',
      'Pode ser feito a qualquer momento discretamente',
    ],
    howTo: [
      '1. Inspire rapidamente pelo nariz (puxada curta).',
      '2. Sem soltar o ar, inspire novamente pelo nariz (segunda puxada curta).',
      '3. Agora expire lentamente pela boca por 6 segundos.',
      '4. Apenas 1 a 3 ciclos já são suficientes.',
      '5. Use quando sentir ansiedade, raiva ou estresse agudo.',
    ],
    tip: '💡 É o "SOS da respiração". Use em reuniões tensas, antes de provas, ou quando sentir pânico.',
  },
  {
    id: 'twoone',
    name: 'Respiração 2:1 Relaxante',
    emoji: '🛌',
    description: 'Expiração é o dobro — máximo relaxamento',
    pattern: { inhale: 4, exhale: 8 },
    recommendedCycles: 6,
    fullDescription: 'A proporção 2:1 (expiração com o dobro da duração da inspiração) é usada em terapia e yoga para ativar ao máximo o sistema nervoso parassimpático. Cada expiração longa sinaliza ao cérebro que é seguro relaxar. Ideal para antes de dormir ou em momentos de grande ansiedade.',
    benefits: [
      'Máxima ativação do sistema de relaxamento',
      'Excelente para insônia — ajuda a dormir',
      'Reduz significativamente os batimentos cardíacos',
      'Diminui pensamentos acelerados',
      'Relaxamento profundo e progressivo a cada ciclo',
    ],
    howTo: [
      '1. Deite-se confortavelmente (ideal para antes de dormir).',
      '2. Inspire pelo nariz contando até 4.',
      '3. Expire pela boca contando até 8 — bem devagar.',
      '4. Mantenha a expiração suave e controlada.',
      '5. Se 4/8 for difícil, comece com 3/6.',
      '6. Repita 6 ciclos ou até adormecer.',
    ],
    tip: '💡 Se sentir falta de ar, reduza para 3/6 no início. O importante é a proporção 2:1.',
  },
  {
    id: 'ujjayi',
    name: 'Respiração Ujjayi (Oceano)',
    emoji: '🌊',
    description: 'Som de oceano na garganta — meditativo e calmante',
    pattern: { inhale: 4, exhale: 6 },
    recommendedCycles: 8,
    fullDescription: 'Ujjayi ("respiração vitoriosa") do yoga produz um som suave na garganta, parecido com ondas do mar. É feita contraindo levemente a glote (como se fosse embaçar um espelho). O som funciona como âncora para a mente, tornando-a altamente meditativa.',
    benefits: [
      'O som funciona como mantra natural para foco',
      'Aquece o ar antes de chegar aos pulmões',
      'Reduz dispersão mental',
      'Promove estado meditativo profundo',
      'Acalma o sistema nervoso',
      'Melhora a capacidade pulmonar',
    ],
    howTo: [
      '1. Sente-se com a coluna ereta.',
      '2. Inspire pelo nariz, contraindo levemente a garganta.',
      '3. Você deve ouvir um som suave de "brisa" ou "oceano".',
      '4. Expire pelo nariz (ou boca) mantendo a contração na garganta.',
      '5. O som deve ser audível apenas para você.',
      '6. Mantenha o ritmo: 4 segundos inspira, 6 segundos expira.',
    ],
    tip: '💡 Imagine que está embaçando um espelho com a boca aberta. Depois feche a boca e mantenha o mesmo som.',
  },
  {
    id: 'anxiety333',
    name: 'Respiração 3-3-3 Anti-Ansiedade',
    emoji: '🆘',
    description: 'Rápida e simples para momentos de crise',
    pattern: { inhale: 3, hold: 3, exhale: 3 },
    recommendedCycles: 6,
    fullDescription: 'A técnica 3-3-3 é projetada especificamente para momentos de crise de ansiedade ou pânico. O padrão curto e igual permite que até pessoas em pânico consigam executar. Não exige expiração longa nem retenção prolongada — é a técnica "de emergência".',
    benefits: [
      'Extremamente simples — funciona até em pânico',
      'Tempos curtos são fáceis de seguir sob estresse',
      'Interrompe o ciclo de hiperventilação',
      'Pode ser combinada com a técnica de aterramento 5-4-3-2-1',
      'Acessível para qualquer pessoa, sem experiência prévia',
    ],
    howTo: [
      '1. Pare o que está fazendo.',
      '2. Inspire contando 1... 2... 3...',
      '3. Segure contando 1... 2... 3...',
      '4. Expire contando 1... 2... 3...',
      '5. Repita pelo menos 6 vezes.',
      '6. Combine com: nomear 3 coisas que vê, 3 que ouve, 3 que sente.',
    ],
    tip: '💡 Cole essa técnica no espelho do banheiro ou salve no celular. Em momentos de pânico, é difícil lembrar.',
  },
  {
    id: 'progressive',
    name: 'Respiração Progressiva',
    emoji: '📈',
    description: 'Aumenta gradualmente — ideal para quem tem dificuldade',
    pattern: { inhale: 3, exhale: 3 },
    recommendedCycles: 5,
    fullDescription: 'A respiração progressiva é ideal para quem tem dificuldade em respirar devagar ou sente falta de ar em técnicas com tempos longos. Começa com tempos curtos (2/2) e aumenta gradualmente, permitindo que o corpo se adapte ao ritmo mais lento naturalmente.',
    benefits: [
      'Ideal para iniciantes e pessoas com dificuldade respiratória',
      'Não causa sensação de falta de ar',
      'Ensina o corpo a desacelerar gradualmente',
      'Reduz ansiedade sem pressão',
      'Adaptável ao ritmo de cada pessoa',
    ],
    howTo: [
      '1. Sente-se confortavelmente.',
      '2. Rodada 1: Inspire 2 seg / Expire 2 seg (3 ciclos).',
      '3. Rodada 2: Inspire 3 seg / Expire 3 seg (3 ciclos).',
      '4. Rodada 3: Inspire 4 seg / Expire 4 seg (3 ciclos).',
      '5. Rodada 4: Inspire 5 seg / Expire 5 seg (3 ciclos).',
      '6. Continue até o tempo que for confortável.',
    ],
    tip: '💡 Se em alguma rodada sentir desconforto, volte ao tempo anterior e fique nele. Sem pressa.',
  },
];

// Yoga Nidra steps
const yogaNidraSteps = [
  '🧘 Prepare-se: Deite-se de costas em um local tranquilo. Feche os olhos.',
  '🫁 Respire: Faça 3 respirações profundas. Solte qualquer tensão.',
  '💫 Sankalpa: Repita mentalmente uma intenção positiva para sua vida.',
  '🦶 Pés Direito: Sinta seu pé direito... dedos... sola... tornozelo... relaxe.',
  '🦶 Pés Esquerdo: Agora o pé esquerdo... dedos... sola... tornozelo... solte.',
  '🦵 Perna Direita: Sinta a perna direita... panturrilha... joelho... coxa...',
  '🦵 Perna Esquerda: A perna esquerda... panturrilha... joelho... coxa... relaxe.',
  '🤚 Mão Direita: Sinta sua mão direita... dedos... palma... pulso... antebraço...',
  '🤚 Mão Esquerda: A mão esquerda... dedos... palma... pulso... antebraço...',
  '💪 Braços: Sinta ambos os braços... cotovelos... ombros... solte a tensão.',
  '🫀 Peito e Barriga: Sinta seu peito subir e descer... barriga relaxada...',
  '🔄 Costas: Sinta suas costas... da base ao topo da coluna... relaxe.',
  '😊 Rosto: Relaxe a testa... olhos... maxilar... língua... todo o rosto.',
  '🧠 Cabeça: Sinta o topo da cabeça... todo seu corpo está relaxado agora.',
  '🌙 Visualização: Imagine uma lua cheia brilhando suavemente sobre você...',
  '✨ Luz Calma: Uma luz azulada e calmante envolve todo seu corpo...',
  '🌟 Paz Profunda: Você está em paz... completamente relaxado... seguro...',
  '💫 Retorno: Lentamente, comece a voltar... mova os dedos...',
  '🙏 Finalize: Quando pronto, abra os olhos. Namastê.',
];

const BREATHING_CONTINUE_TITLES: Record<string, string> = {
  '333': 'Anti-Ansiedade',
  '424': 'Relaxamento',
  '4444': 'Quadrada (Box)',
  '478': 'Potente 4-7-8',
  '406': 'Calmante',
  fole: 'Fole (Bhastrika)',
  '55': 'Coerência',
  progressiva: 'Progressiva',
  limpeza: 'Limpeza',
  foco: 'Foco Laser',
  noite: 'Boa Noite',
  'manhā': 'Bom Dia',
  pausa: 'Pausa Ativa',
  ground557: 'Aterramento',
  quick24: 'Alívio Rápido',
  presence44: 'Presença',
  energy212: 'Energia Clara',
  slow468: 'Desacelerar Pensamentos',
  release448: 'Soltar Tensão',
  center527: 'Centro Emocional',
  focus426: 'Foco Estável',
  sleep479: 'Sono Profundo',
  sigh: 'Suspiro Cíclico',
  nadi: 'Respiração Alternada',
  diafragma: 'Respiração Diafragmática',
};

// Main App Component
export default function MentalHealthApp({ desktopMode = false }: { desktopMode?: boolean }) {
  const [activeTab, setActiveTab] = useAppPersistence<Tab>('activeTab', 'home');
  const [tabParams, setTabParams] = useAppPersistence<Record<string, any>>('activeTabParams', {});
  const [tabHistory, setTabHistory] = useAppPersistence<{ tab: Tab, params?: any }[]>('tabHistory', [{ tab: 'home' as Tab, params: {} }]);
  const [tabUsage, setTabUsage] = useAppPersistence<Record<string, number>>('tab_usage_v1', {});
  const [tabUsageSeconds, setTabUsageSeconds] = useAppPersistence<Record<string, number>>('tab_usage_seconds_v1', {});
  const safeTabUsage = tabUsage && typeof tabUsage === 'object' && !Array.isArray(tabUsage) ? tabUsage : {};
  const safeTabUsageSeconds = tabUsageSeconds && typeof tabUsageSeconds === 'object' && !Array.isArray(tabUsageSeconds) ? tabUsageSeconds : {};

  const writeHomeContinueState = useCallback((tab: Tab, params?: Record<string, any>) => {
    if (typeof window === 'undefined' || tab === 'home' || tab === 'login') return;
    const safeParams = params && typeof params === 'object' ? params : {};
    try {
      const raw = window.localStorage.getItem('home_continue_state_v1');
      const parsed = raw ? JSON.parse(raw) : null;
      const pinnedTab = parsed && typeof parsed === 'object' && typeof parsed.pinnedTab === 'string' ? parsed.pinnedTab : null;
      const mostUsedTab = parsed && typeof parsed === 'object' && typeof parsed.mostUsedTab === 'string' ? parsed.mostUsedTab : null;
      window.localStorage.setItem('home_continue_state_v1', JSON.stringify({
        lastTab: String(tab),
        lastParams: safeParams,
        mostUsedTab,
        pinnedTab,
      }));
    } catch {
      window.localStorage.setItem('home_continue_state_v1', JSON.stringify({
        lastTab: String(tab),
        lastParams: safeParams,
        mostUsedTab: null,
        pinnedTab: null,
      }));
    }
  }, []);

  const updateContinueContext = useCallback((tab: Tab, params?: Record<string, any>) => {
    writeHomeContinueState(tab, params);
    if (activeTab === tab) {
      setTabParams((prev) => ({ ...(prev || {}), ...(params || {}) }));
    }
  }, [activeTab, setTabParams, writeHomeContinueState]);

  const navigateTo = (tab: Tab, params?: any) => {
    if (tab === 'timer') {
      navigateTo('meditation', { ...(params || {}), meditationMode: 'free' });
      return;
    }

    if (['yoga', 'hooponopono', 'lovelanguages', 'vocacional', 'fivefingers'].includes(tab)) {
      if (!checkAccess(tab)) return;
    }

    const nextParams = params || {};
    if (tab === activeTab && JSON.stringify(nextParams) === JSON.stringify(tabParams || {})) return;

    setTabHistory(prev => {
      const base = prev && prev.length ? prev : [{ tab: 'home' as Tab, params: {} }];
      const last = base[base.length - 1];
      if (last?.tab === tab && JSON.stringify(last?.params || {}) === JSON.stringify(nextParams)) return base;
      return [...base, { tab, params: nextParams }];
    });

    setActiveTab(tab);
    setTabParams(nextParams);
    if (tab !== 'home') {
      const nextUsage = { ...safeTabUsage, [tab]: Number(safeTabUsage[tab] || 0) + 1 };
      setTabUsage(nextUsage);
      writeHomeContinueState(tab, nextParams);
    }
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setActiveTab('home');
    setTabParams({});
    setTabHistory([{ tab: 'home' as Tab, params: {} }]);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    const base = tabHistory && tabHistory.length ? tabHistory : [{ tab: 'home' as Tab, params: {} }];

    if (base.length > 1) {
      const newHistory = base.slice(0, -1);
      const prev = newHistory[newHistory.length - 1] || { tab: 'home' as Tab, params: {} };
      setTabHistory(newHistory);
      setActiveTab(prev.tab);
      setTabParams(prev.params || {});
    } else {
      setActiveTab('home');
      setTabParams({});
      setTabHistory([{ tab: 'home' as Tab, params: {} }]);
    }
  };

  useEffect(() => {
    const current = { tab: activeTab, params: tabParams || {} };
    setTabHistory(prev => {
      const base = prev && prev.length ? prev : [{ tab: 'home' as Tab, params: {} }];
      const last = base[base.length - 1];
      if (last?.tab === current.tab && JSON.stringify(last?.params || {}) === JSON.stringify(current.params)) {
        return base;
      }
      return [...base, current];
    });
  }, [activeTab, JSON.stringify(tabParams)]);

  const [darkMode, setDarkMode] = useAppPersistence('darkMode', false);
  const [isLoggedIn, setIsLoggedIn] = useAppPersistence('isLoggedIn', false);
  const [userAccount, setUserAccount] = useAppPersistence<UserAccount | null>('userAccount', null);
  const [authResolved, setAuthResolved] = useState(() => !isSupabaseConfigured);
  const lastSyncedSupabaseProfileRef = useRef('');
  const cloudSyncHydratingRef = useRef(false);
  const cloudSyncTimeoutsRef = useRef<Record<string, number>>({});
  const [cloudSyncReady, setCloudSyncReady] = useState(true);
  const structuredSyncHydratingRef = useRef(false);
  const [structuredSyncReady, setStructuredSyncReady] = useState(true);
  const accountBucketHydratingRef = useRef(false);
  const [accountBucketReady, setAccountBucketReady] = useState(true);
  const accountBucketTimeoutsRef = useRef<Record<string, number>>({});
  const [moodHistory, setMoodHistory] = useAppPersistence<MoodEntry[]>('moodHistory', []);
  const [diaryEntries, setDiaryEntries] = useAppPersistence<EmotionEntry[]>('diaryEntries', []);
  const [habitsReqs, setHabitsReqs] = useAppPersistence<any[]>('psico_habits_reqs', []);
  const [habitsHistory, setHabitsHistory] = useAppPersistence<Record<string, string[]>>('psico_habits_history', {});
  const [lastScore, setLastScore] = useAppPersistence<ProfileScore>('psico_regulation_last_score', { visual: 0, auditivo: 0, cinestesico: 0 });
  const [thoughtRecords, setThoughtRecords] = useAppPersistence<ThoughtRecord[]>('thoughtRecords', []);
  const [gratitudeEntries, setGratitudeEntries] = useAppPersistence<GratitudeEntry[]>('gratitudeEntries', []);
  const [gratitudePhotos, setGratitudePhotos] = useAppPersistence<GratitudePhoto[]>('gratitudePhotos', []);
  const [soltaEntries, setSoltaEntries] = useAppPersistence<SoltaEntry[]>('soltaEntries', []);
  const [dailyPracticeMinutes] = useAppPersistence<Record<string, number>>('daily_practice_minutes_v1', {});
  const [dailyPracticeSeconds, setDailyPracticeSeconds] = useAppPersistence<Record<string, number>>('daily_practice_seconds_v2', {});
  const [dailyPracticeInitializedDay, setDailyPracticeInitializedDay] = useAppPersistence<string>('daily_practice_initialized_day_v1', '');
  const [healthyMessages] = useAppPersistence<{ id: string; text: string; createdAt: string }[]>('psico_healthy_self', []);
  const [timeCapsules] = useAppPersistence<any[]>('psico_time_capsule', []);
  const [userProgress, setUserProgress] = useAppPersistence<UserProgress>('userProgress', {
    meditationsCompleted: 0,
    breathingCompleted: 0,
    yogaCompleted: 0,
    totalMinutes: 0,
    streak: 0,
    lastActiveDate: '',
    badgesEarned: [],
  });
  const [safetyPlan, setSafetyPlan] = useAppPersistence<SafetyPlan>('safetyPlan', {
    warningSignals: [], copingStrategies: [], reasonsToLive: [],
    emergencyContacts: [], safePlace: '', professionalContact: '', crisisLine: '188',
  });
  const [reminderSettings, setReminderSettings] = useAppPersistence<ReminderSettings>('reminderSettings', {
    moodReminder: true, moodTime: '12:00',
    breathingReminder: true, breathingTime: '12:00',
    yogaReminder: true, yogaTime: '12:00',
    diaryReminder: true, diaryTime: '12:00',
    healthySelfReminder: false, healthySelfTime: '12:00',
    meditationReminder: true, meditationTime: '12:00',
    badgesReminder: true, badgesTime: '12:00',
    gratitudeReminder: true, gratitudeTime: '12:00',
    sleepReminder: true, sleepTime: '12:00',
    missionsReminder: true, missionsTime: '12:00',
    microtasksReminder: true, microtasksTime: '12:00',
    mindmapReminder: true, mindmapTime: '12:00',
    psychoeduReminder: true, psychoeduTime: '12:00',
    adaptiveSuggestionReminder: true, adaptiveSuggestionTime: '12:00',
    therapyReminder: true,
    therapyReminderDayBefore: true,
    therapyReminderHourBefore: true,
    therapyExternalCalendar: false,
    doNotDisturb: false
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const migrationKey = 'sereno_reminders_midday_v4';
    if (window.localStorage.getItem(migrationKey) === 'done') return;

    setReminderSettings((prev) => ({
      ...prev,
      moodReminder: true,
      moodTime: '12:00',
      breathingReminder: true,
      breathingTime: '12:00',
      yogaReminder: true,
      yogaTime: '12:00',
      diaryReminder: true,
      diaryTime: '12:00',
      healthySelfReminder: healthyMessages.length > 0 ? true : prev.healthySelfReminder,
      healthySelfTime: '12:00',
      meditationReminder: true,
      meditationTime: '12:00',
      badgesReminder: true,
      badgesTime: '12:00',
      gratitudeReminder: true,
      gratitudeTime: '12:00',
      sleepReminder: true,
      sleepTime: '12:00',
      missionsReminder: true,
      missionsTime: '12:00',
      microtasksReminder: true,
      microtasksTime: '12:00',
      mindmapReminder: true,
      mindmapTime: '12:00',
      psychoeduReminder: true,
      psychoeduTime: '12:00',
      adaptiveSuggestionReminder: true,
      adaptiveSuggestionTime: '12:00',
      therapyReminder: true,
      therapyReminderDayBefore: true,
      therapyReminderHourBefore: true,
    }));
    window.localStorage.setItem(migrationKey, 'done');
  }, [healthyMessages.length, setReminderSettings]);
  useEffect(() => {
    if (healthyMessages.length === 0) return;
    setReminderSettings((prev) => (
      prev.healthySelfReminder
        ? prev
        : { ...prev, healthySelfReminder: true, healthySelfTime: prev.healthySelfTime || '12:00' }
    ));
  }, [healthyMessages.length, setReminderSettings]);
  const [privacySettings, setPrivacySettings] = useAppPersistence<PrivacySettings>('privacySettings', {
    appLockEnabled: false, appLockPin: '', discreetMode: false
  });
  const [appLocked, setAppLocked] = useState(false);
  const [appLockInput, setAppLockInput] = useState('');
  const [appLockError, setAppLockError] = useState('');
  const [visualSettings, setVisualSettings] = useAppPersistence<VisualSettings>('visualSettings', {
    fontSize: 'medium',
    fontFamily: 'sans'
  });
  const [audioSettings, setAudioSettings] = useAppPersistence<AudioSettings>('audioSettings', {
    musicVolume: 50, voiceVolume: 80, backgroundMusicEnabled: true, hapticsEnabled: true
  });
  useEffect(() => {
    if (typeof audioSettings.backgroundMusicEnabled === 'boolean') return;
    setAudioSettings((prev) => ({ ...prev, backgroundMusicEnabled: true }));
  }, [audioSettings.backgroundMusicEnabled, setAudioSettings]);
  const [wellbeingSettings, setWellbeingSettings] = useAppPersistence<WellbeingSettings>('wellbeing_settings', { hideStreaks: false });
  const [dailyGoal, setDailyGoal] = useAppPersistence<number>('dailyGoal', 10);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const migrationKey = 'sereno_daily_goal_default_v1';
    if (window.localStorage.getItem(migrationKey) === 'done') return;
    setDailyGoal((prev) => (prev === 20 ? 10 : prev));
    window.localStorage.setItem(migrationKey, 'done');
  }, [setDailyGoal]);
  const [defaultVoice, setDefaultVoice] = useAppPersistence<'masculino' | 'feminino' | 'nenhuma'>('default_voice', 'masculino');
  const narrationVoice: 'masculino' | 'feminino' = defaultVoice === 'nenhuma' ? 'feminino' : defaultVoice;

  useEffect(() => {
    if (typeof document === 'undefined' || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    let lastHapticAt = 0;
    const handleInteractiveHaptic = (event: Event) => {
      if (!audioSettings.hapticsEnabled || document.visibilityState !== 'visible') return;

      const target = event.target as HTMLElement | null;
      const interactiveElement = target?.closest('button, a[href], [role="button"], input[type="checkbox"], input[type="range"], summary');
      if (!interactiveElement) return;

      const now = Date.now();
      if (now - lastHapticAt < 80) return;
      lastHapticAt = now;
      navigator.vibrate(8);
    };

    document.addEventListener('click', handleInteractiveHaptic, true);
    return () => document.removeEventListener('click', handleInteractiveHaptic, true);
  }, [audioSettings.hapticsEnabled]);
  const [showNightSounds, setShowNightSounds] = useState(false);
  const [activeNightPreset, setActiveNightPreset] = useState<string | null>(null);
  const nightPresetAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const nightPresets = useMemo(
    () => [
      { id: 'sono-profundo', name: 'Sono Profundo', emoji: '💤', sounds: ['dor', 'mar1', 'vento1'] },
      { id: 'janela-na-chuva', name: 'Janela na Chuva', emoji: '🌧️', sounds: ['chuva2', 'lareira3', 'riacho4'] },
      { id: 'noite-tranquila', name: 'Noite Tranquila', emoji: '🌙', sounds: ['noite1', 'grilo2', 'lareira3'] },
      { id: 'cabana-segura', name: 'Cabana Segura', emoji: '🏕️', sounds: ['chuva1', 'lareira1', 'grilo1'] },
    ],
    [],
  );
  const stopNightPreset = useCallback(() => {
    Object.values(nightPresetAudioRefs.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    nightPresetAudioRefs.current = {};
    setActiveNightPreset(null);
  }, []);
  const playNightPreset = useCallback((presetId: string, soundIds: string[]) => {
    if (activeNightPreset === presetId) {
      stopNightPreset();
      return;
    }

    stopNightPreset();
    const baseVolume = ((audioSettings?.musicVolume ?? 50) / 100);

    soundIds.forEach((soundId, index) => {
      const track = natureMixerTracks.find((item) => item.id === soundId);
      if (!track) return;
      const audio = new Audio(encodeURI(track.src));
      audio.loop = true;
      audio.volume = Math.max(0.08, baseVolume * (index === 0 ? 0.7 : index === 1 ? 0.38 : 0.22));
      audio.play().catch(() => {});
      nightPresetAudioRefs.current[soundId] = audio;
    });

    setActiveNightPreset(presetId);
  }, [activeNightPreset, audioSettings?.musicVolume, stopNightPreset]);
  const isLateNight = new Date().getHours() >= 2 && new Date().getHours() < 5;
  const showSosNight = (isLateNight || tabParams?.forceInsomnia) && activeTab === 'home' && !tabParams?.dismissInsomnia;
  useEffect(() => {
    if (showSosNight) return;
    stopNightPreset();
    setShowNightSounds(false);
  }, [showSosNight, stopNightPreset]);
  useEffect(() => () => stopNightPreset(), [stopNightPreset]);
  const [currentDateMs, setCurrentDateMs] = useState(() => Date.now());
  useEffect(() => {
    const updateDateTick = () => setCurrentDateMs(Date.now());
    updateDateTick();
    const intervalId = window.setInterval(updateDateTick, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const todayKey = useMemo(() => getBrazilDateKey(currentDateMs), [currentDateMs]);
  const yesterdayKey = useMemo(() => getBrazilDateKey(currentDateMs - 24 * 60 * 60 * 1000), [currentDateMs]);

  useEffect(() => {
    if (!todayKey) return;
    if (dailyPracticeInitializedDay === todayKey) return;
    setDailyPracticeSeconds((prev) => {
      const base = prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {};
      return {
        ...base,
        [todayKey]: 0,
      };
    });
    setDailyPracticeInitializedDay(todayKey);
  }, [dailyPracticeInitializedDay, setDailyPracticeInitializedDay, setDailyPracticeSeconds, todayKey]);

  const safeDailyPracticeMinutes = dailyPracticeMinutes && typeof dailyPracticeMinutes === 'object' && !Array.isArray(dailyPracticeMinutes) ? dailyPracticeMinutes : {};
  const safeDailyPracticeSeconds = dailyPracticeSeconds && typeof dailyPracticeSeconds === 'object' && !Array.isArray(dailyPracticeSeconds) ? dailyPracticeSeconds : {};
  const todaySeconds = Number(safeDailyPracticeSeconds[todayKey] || 0);
  const todayMinutes = todaySeconds / 60;
  const todayGoalMinutes = Math.max(0, Number(dailyGoal || 0));
  const todayProgressRatio = todayGoalMinutes > 0 ? todayMinutes / todayGoalMinutes : 0;
  const todayProgressWidth = Math.max(0, Math.min(100, todayGoalMinutes > 0 ? todayProgressRatio * 100 : 0));
  const todayProgressPercent = Math.max(0, Math.min(100, todayGoalMinutes > 0 ? Math.round(todayProgressRatio * 100) : 0));
  const practiceStreak = useMemo(() => {
    let streak = 0;
    let cursorMs = currentDateMs;
    for (let i = 0; i < 365; i += 1) {
      const key = getBrazilDateKey(cursorMs);
      const seconds = Number(safeDailyPracticeSeconds[key] ?? (Number(safeDailyPracticeMinutes[key] || 0) * 60));
      if (seconds >= 60) {
        streak += 1;
        cursorMs -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }
    return streak;
  }, [currentDateMs, safeDailyPracticeMinutes, safeDailyPracticeSeconds]);
  const practiceSequenceCycleDays = useMemo(() => {
    const usedDays = Array.from(new Set([...Object.keys(safeDailyPracticeSeconds), ...Object.keys(safeDailyPracticeMinutes)]))
      .filter((key) => Number(safeDailyPracticeSeconds[key] ?? (Number(safeDailyPracticeMinutes[key] || 0) * 60)) >= 60)
      .sort();

    const totalUsedDays = usedDays.length;
    if (totalUsedDays <= 0) return 0;
    return ((totalUsedDays - 1) % 365) + 1;
  }, [safeDailyPracticeMinutes, safeDailyPracticeSeconds]);
  const [subscriptionData, setSubscriptionData] = useAppPersistence<SubscriptionData>('subscription_data', {
    plan: 'free',
    planKey: 'free',
    trialStartDate: new Date().toISOString(),
    usageCounts: {
      aiChat: {},
      aiChatWindowCount: 0,
      aiChatCooldownUntil: null,
      muralSend: {},
      muralReceive: {},
      sharing: 0,
      exportData: {},
    }
  });

  useEffect(() => {
    setSubscriptionData((prev) => {
      if (!prev) return prev;
      const legacyMuralUsage = (prev.usageCounts as any)?.mural || {};
      const hasLegacyMural = Object.keys(legacyMuralUsage).length > 0;
      const hasSplitUsage =
        prev.usageCounts?.muralSend !== undefined ||
        prev.usageCounts?.muralReceive !== undefined;

      if (hasSplitUsage && !hasLegacyMural) return prev;

      return {
        ...prev,
        usageCounts: {
          ...prev.usageCounts,
          aiChat: prev.usageCounts?.aiChat || {},
          aiChatWindowCount: prev.usageCounts?.aiChatWindowCount || 0,
          aiChatCooldownUntil: prev.usageCounts?.aiChatCooldownUntil || null,
          muralSend: prev.usageCounts?.muralSend || {},
          muralReceive: prev.usageCounts?.muralReceive || {},
          sharing: prev.usageCounts?.sharing || 0,
          exportData: prev.usageCounts?.exportData || {},
        },
      };
    });
  }, [setSubscriptionData]);

  useEffect(() => {
    setSubscriptionData((prev) => {
      if (!prev) return prev;
      const cooldownUntil = Number(prev.usageCounts?.aiChatCooldownUntil || 0);
      if (!cooldownUntil || cooldownUntil > Date.now()) return prev;
      return {
        ...prev,
        usageCounts: {
          ...prev.usageCounts,
          aiChatWindowCount: 0,
          aiChatCooldownUntil: null,
        },
      };
    });
  }, [setSubscriptionData]);

  const adminEmails = useMemo(() => getConfiguredAdminEmails(), []);
  const [promoAccessState, setPromoAccessState] = useState<{
    active: boolean;
    title?: string;
    endsAt?: string;
    durationDays?: number;
  } | null>(null);
  const isPro = useMemo(() => {
    return subscriptionData?.plan === 'pro' || Boolean(promoAccessState?.active);
  }, [promoAccessState?.active, subscriptionData]);
  const isAdmin = useMemo(() => {
    return hasAdminAccess(userAccount, adminEmails);
  }, [adminEmails, userAccount]);
  const hasUnlimitedAccess = useMemo(() => isPro || isAdmin, [isAdmin, isPro]);

  useEffect(() => {
    if (!userAccount) return;
    const prepared = buildAdminPreparedAccount(userAccount, adminEmails);
    if (prepared.role === userAccount.role && prepared.adminAccess === userAccount.adminAccess) return;
    setUserAccount((prev) => (prev ? buildAdminPreparedAccount(prev, adminEmails) : prev));
  }, [adminEmails, setUserAccount, userAccount]);

  useEffect(() => {
    const currentEmail = String(userAccount?.email || '').trim().toLowerCase();
    if (!currentEmail) return;

    let cancelled = false;
    fetch(`/api/admin/access?email=${encodeURIComponent(currentEmail)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.allowed) return;
        setUserAccount((prev) => {
          if (!prev) return prev;
          if (prev.adminAccess && prev.role === 'admin') return prev;
          return { ...prev, role: 'admin', adminAccess: true };
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [setUserAccount, userAccount?.email]);
  useEffect(() => {
    const currentEmail = String(userAccount?.email || '').trim().toLowerCase();
    if (!currentEmail) {
      setPromoAccessState(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/promo-access/status?email=${encodeURIComponent(currentEmail)}&sex=${encodeURIComponent(String(userAccount?.sex || '').trim().toLowerCase())}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPromoAccessState(
          data?.active && data?.campaign
            ? {
                active: true,
                title: data.campaign.title,
                endsAt: data.campaign.endsAt,
                durationDays: data.campaign.durationDays,
              }
            : null,
        );
      })
      .catch(() => {
        if (!cancelled) setPromoAccessState(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userAccount?.email, userAccount?.sex]);
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const currentPlanLabel = useMemo(() => {
    if (isAdmin) return 'Administrador';
    if (promoAccessState?.active) return 'Pro Promocional';
    const planKey = subscriptionData?.planKey;
    if (planKey && getPlanDefinition(planKey)) return getPlanDefinition(planKey).label;
    return isPro ? 'Sereno Pro' : 'Sereno Gratuito';
  }, [isAdmin, isPro, promoAccessState?.active, subscriptionData?.planKey]);
  const currentPlanTone = useMemo(() => {
    if (isAdmin) return 'company';
    if (promoAccessState?.active) return 'pro';
    const planKey = subscriptionData?.planKey;
    if (!isPro || planKey === 'free') return 'free';
    if (planKey === 'vitalicio') return 'lifetime';
    if (planKey?.includes('empresa')) return 'company';
    return 'pro';
  }, [isAdmin, isPro, promoAccessState?.active, subscriptionData?.planKey]);

  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<{ title: string; desc: string } | null>(null);
  const [expandedPaywallCard, setExpandedPaywallCard] = useState<string | null>('individual');
  const [showLifetimeRules, setShowLifetimeRules] = useState(false);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<BillingPlanKey | null>(null);
  const [noticeModal, setNoticeModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const hasPreventiveAlert = useMemo(() => {
    const recent = Array.isArray(moodHistory) ? moodHistory.slice(0, 5) : [];
    if (recent.length < 3) return false;
    const avgIntensity = recent.reduce((sum, entry) => sum + Number(entry?.intensity || 3), 0) / recent.length;
    const negativeEmotions = recent.filter((entry) =>
      ['triste', 'ansioso', 'estressado', 'irritado', 'sobrecarregado'].includes(String(entry?.primaryEmotion || '').toLowerCase()),
    ).length;
    return avgIntensity >= 3.5 && negativeEmotions >= 2;
  }, [moodHistory]);
  const computedMostUsedTab = useMemo(() => {
    const candidates = Array.from(
      new Set([
        ...Object.keys(safeTabUsageSeconds || {}),
        ...Object.keys(safeTabUsage || {}),
      ]),
    ).filter((key) => key !== 'home' && key !== 'login');

    const ranked = candidates
      .map((key) => ({
        key,
        seconds: Number(safeTabUsageSeconds[key] || 0),
        opens: Number(safeTabUsage[key] || 0),
      }))
      .filter((item) => item.seconds > 0 || item.opens > 0)
      .sort((a, b) => {
        if (b.seconds !== a.seconds) return b.seconds - a.seconds;
        if (b.opens !== a.opens) return b.opens - a.opens;
        return a.key.localeCompare(b.key);
      });

    return ranked[0]?.key || null;
  }, [safeTabUsage, safeTabUsageSeconds]);
  const trackedDailyTabs = useMemo<Tab[]>(
    () => [
      'breathing',
      'meditation',
      'mood',
      'calm',
      'acalmese',
      'diary',
      'yoga',
      'solta',
      'assertiveness',
      'sleep',
      'gratitude',
      'timer',
      'hooponopono',
      'habits',
      'vocacional',
      'fivefingers',
      'microtasks',
      'timecapsule',
      'missions',
      'artemotion',
      'regulation',
      'emocional',
      'psychoedu',
      'healthymessages',
      ...(hasPreventiveAlert ? (['stats'] as Tab[]) : []),
    ],
    [hasPreventiveAlert]
  );
  const isTrackedDailyTab = trackedDailyTabs.includes(activeTab);
  const isTrackedUsageTab = activeTab !== 'home' && activeTab !== 'login';
  const [lastPracticeInteractionAt, setLastPracticeInteractionAt] = useState<number>(() => Date.now());
  const [lifetimeOfferState, setLifetimeOfferState] = useState<{
    enabled: boolean;
    startsAt: string | null;
    endsAt: string | null;
    isActive: boolean;
    hasStarted: boolean;
    hasEnded: boolean;
    msRemaining: number;
  } | null>(null);

  useEffect(() => {
    if (!isTrackedDailyTab && !isTrackedUsageTab) return;

    const incrementSeconds = 1;
    const interactionWindowMs = 15000;
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (Date.now() - lastPracticeInteractionAt > interactionWindowMs) return;
      if (isTrackedDailyTab) {
        setDailyPracticeSeconds((prev) => {
          const base = prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {};
          return {
            ...base,
            [todayKey]: Number(base[todayKey] || 0) + incrementSeconds,
          };
        });
      }
      if (isTrackedUsageTab) {
        setTabUsageSeconds((prev) => {
          const base = prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : {};
          return {
            ...base,
            [activeTab]: Number(base[activeTab] || 0) + incrementSeconds,
          };
        });
      }
    };

    const intervalId = window.setInterval(tick, incrementSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [activeTab, isTrackedDailyTab, isTrackedUsageTab, lastPracticeInteractionAt, setDailyPracticeSeconds, setTabUsageSeconds, todayKey]);

  useEffect(() => {
    if (todaySeconds < 60) return;
    if (userProgress?.lastActiveDate === todayKey) return;

    setUserProgress((prev) => {
      const previousDate = prev?.lastActiveDate || '';
      const nextStreak =
        previousDate === yesterdayKey
          ? (prev?.streak || 0) + 1
          : previousDate === todayKey
            ? (prev?.streak || 0)
            : 1;

      return {
        ...prev,
        streak: Math.max(nextStreak, practiceStreak),
        lastActiveDate: todayKey,
      };
    });
  }, [practiceStreak, setUserProgress, todayKey, todaySeconds, userProgress?.lastActiveDate, yesterdayKey]);

  useEffect(() => {
    if (!isTrackedDailyTab && !isTrackedUsageTab) return;
    setLastPracticeInteractionAt(Date.now());
  }, [activeTab, isTrackedDailyTab, isTrackedUsageTab]);

  useEffect(() => {
    installStorageSyncBridge();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthResolved(true);
      return;
    }

    let mounted = true;
    supabase.auth.getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        if (!mounted) return;
        console.info('[sereno-auth] app:getSession', {
          hasUser: Boolean(user),
          userId: user?.id ?? null,
        });
        if (user) {
          setUserAccount(buildAccountFromAuthUser(user));
          setIsLoggedIn(true);
        } else if (!(isLoggedIn && hasAdminAccess(userAccount, adminEmails))) {
          setIsLoggedIn(false);
          setUserAccount(null);
        }
        setAuthResolved(true);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthResolved(true);
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      console.info('[sereno-auth] app:onAuthStateChange', {
        event,
        hasUser: Boolean(user),
        userId: user?.id ?? null,
      });
      if (user) {
        lastSyncedSupabaseProfileRef.current = '';
        setUserAccount(buildAccountFromAuthUser(user));
        setIsLoggedIn(true);
        setAuthResolved(true);
        return;
      }
      if (isLoggedIn && hasAdminAccess(userAccount, adminEmails)) {
        setAuthResolved(true);
        return;
      }
      lastSyncedSupabaseProfileRef.current = '';
      setIsLoggedIn(false);
      setUserAccount(null);
      setAuthResolved(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [adminEmails, isLoggedIn, setIsLoggedIn, setUserAccount, userAccount]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured) {
      setCloudSyncReady(true);
      return;
    }

    let cancelled = false;
    cloudSyncHydratingRef.current = true;
    setCloudSyncReady(false);

    const hydrateCloudPreferences = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) {
        if (!cancelled) {
          cloudSyncHydratingRef.current = false;
          setCloudSyncReady(true);
        }
        return;
      }

      const remoteRows = await loadCloudPreferences(userId);
      const remoteKeys = new Set(remoteRows.map((row) => row.key));

      if (!cancelled) {
        applyCloudPreferences(remoteRows);
      }

      const localOnlyEntries = getLocalPreferenceSnapshot().filter((entry) => !remoteKeys.has(entry.key));
      await Promise.all(localOnlyEntries.map((entry) => upsertCloudPreference(userId, entry.key, entry.value)));

      if (!cancelled) {
        cloudSyncHydratingRef.current = false;
        setCloudSyncReady(true);
      }
    };

    hydrateCloudPreferences().catch(() => {
      if (!cancelled) {
        cloudSyncHydratingRef.current = false;
        setCloudSyncReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userAccount?.email]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured) {
      setStructuredSyncReady(true);
      return;
    }

    let cancelled = false;
    structuredSyncHydratingRef.current = true;
    setStructuredSyncReady(false);

    const hydrateStructuredContent = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) {
        if (!cancelled) {
          structuredSyncHydratingRef.current = false;
          setStructuredSyncReady(true);
        }
        return;
      }

      const remote = await loadStructuredContent(userId);
      if (!cancelled && remote.hasRemoteData) {
        setMoodHistory(remote.snapshot.moodHistory as MoodEntry[]);
        setDiaryEntries(remote.snapshot.diaryEntries as EmotionEntry[]);
        setThoughtRecords(remote.snapshot.thoughtRecords as ThoughtRecord[]);
        setGratitudeEntries(remote.snapshot.gratitudeEntries as GratitudeEntry[]);
        setGratitudePhotos(remote.snapshot.gratitudePhotos as GratitudePhoto[]);
        setSoltaEntries(remote.snapshot.soltaEntries as SoltaEntry[]);
      }

      if (!remote.hasRemoteData) {
        await Promise.all([
          saveMoodHistory(userId, moodHistory as any[]),
          saveDiaryEntries(userId, diaryEntries as any[]),
          saveThoughtRecords(userId, thoughtRecords as any[]),
          saveGratitudeEntries(userId, gratitudeEntries as any[]),
          saveGratitudePhotos(userId, gratitudePhotos as any[]),
          saveSoltaEntries(userId, soltaEntries as any[]),
        ]);
      }

      if (!cancelled) {
        structuredSyncHydratingRef.current = false;
        setStructuredSyncReady(true);
      }
    };

    hydrateStructuredContent().catch(() => {
      if (!cancelled) {
        structuredSyncHydratingRef.current = false;
        setStructuredSyncReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userAccount?.email]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured) {
      setAccountBucketReady(true);
      return;
    }

    let cancelled = false;
    accountBucketHydratingRef.current = true;
    setAccountBucketReady(false);

    const hydrateBuckets = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) {
        if (!cancelled) {
          accountBucketHydratingRef.current = false;
          setAccountBucketReady(true);
        }
        return;
      }

      await hydrateAccountBuckets(userId);

      if (!cancelled) {
        accountBucketHydratingRef.current = false;
        setAccountBucketReady(true);
      }
    };

    hydrateBuckets().catch(() => {
      if (!cancelled) {
        accountBucketHydratingRef.current = false;
        setAccountBucketReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userAccount?.email]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !cloudSyncReady) return;

    let cancelled = false;

    const syncPreferenceChange = async (key: string, rawValue: string | null) => {
      if (!shouldSyncPreferenceKey(key) || cloudSyncHydratingRef.current) return;

      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;

      if (rawValue === null) {
        await removeCloudPreference(userId, key);
        return;
      }

      let parsedValue: any = rawValue;
      try {
        parsedValue = JSON.parse(rawValue);
      } catch {}

      await upsertCloudPreference(userId, key, parsedValue);
    };

    const queuePreferenceSync = (key: string, rawValue: string | null) => {
      if (!shouldSyncPreferenceKey(key)) return;
      const currentTimeout = cloudSyncTimeoutsRef.current[key];
      if (currentTimeout) {
        window.clearTimeout(currentTimeout);
      }
      cloudSyncTimeoutsRef.current[key] = window.setTimeout(() => {
        syncPreferenceChange(key, rawValue).catch(() => undefined);
      }, 500);
    };

    const handleCustomStorage = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string; rawValue?: string | null }>;
      const key = customEvent.detail?.key;
      if (!key || cancelled) return;
      queuePreferenceSync(key, customEvent.detail?.rawValue ?? null);
    };

    window.addEventListener(STORAGE_SYNC_EVENT, handleCustomStorage as EventListener);
    return () => {
      cancelled = true;
      Object.values(cloudSyncTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      cloudSyncTimeoutsRef.current = {};
      window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomStorage as EventListener);
    };
  }, [cloudSyncReady, isLoggedIn, userAccount?.email]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !accountBucketReady) return;

    let cancelled = false;

    const syncBucketChange = async (key: string) => {
      if (accountBucketHydratingRef.current) return;
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await syncAccountBucketByKey(userId, key);
    };

    const queueBucketSync = (key: string) => {
      const currentTimeout = accountBucketTimeoutsRef.current[key];
      if (currentTimeout) {
        window.clearTimeout(currentTimeout);
      }
      accountBucketTimeoutsRef.current[key] = window.setTimeout(() => {
        syncBucketChange(key).catch(() => undefined);
      }, 500);
    };

    const handleCustomStorage = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      const key = customEvent.detail?.key;
      if (!key || cancelled) return;
      queueBucketSync(key);
    };

    window.addEventListener(STORAGE_SYNC_EVENT, handleCustomStorage as EventListener);
    return () => {
      cancelled = true;
      Object.values(accountBucketTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      accountBucketTimeoutsRef.current = {};
      window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomStorage as EventListener);
    };
  }, [accountBucketReady, isLoggedIn, userAccount?.email]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !structuredSyncReady || structuredSyncHydratingRef.current) return;
    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await saveMoodHistory(userId, moodHistory as any[]);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [isLoggedIn, moodHistory, structuredSyncReady]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !structuredSyncReady || structuredSyncHydratingRef.current) return;
    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await saveDiaryEntries(userId, diaryEntries as any[]);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [diaryEntries, isLoggedIn, structuredSyncReady]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !structuredSyncReady || structuredSyncHydratingRef.current) return;
    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await saveThoughtRecords(userId, thoughtRecords as any[]);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [isLoggedIn, structuredSyncReady, thoughtRecords]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !structuredSyncReady || structuredSyncHydratingRef.current) return;
    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await saveGratitudeEntries(userId, gratitudeEntries as any[]);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [gratitudeEntries, isLoggedIn, structuredSyncReady]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !structuredSyncReady || structuredSyncHydratingRef.current) return;
    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await saveGratitudePhotos(userId, gratitudePhotos as any[]);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [gratitudePhotos, isLoggedIn, structuredSyncReady]);

  useEffect(() => {
    if (!isLoggedIn || !isSupabaseConfigured || !structuredSyncReady || structuredSyncHydratingRef.current) return;
    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await saveSoltaEntries(userId, soltaEntries as any[]);
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [isLoggedIn, soltaEntries, structuredSyncReady]);

  useEffect(() => {
    if (!isSupabaseConfigured || !isLoggedIn || !userAccount?.email) return;

    const nextMetadata = buildAuthUserMetadataFromAccount(userAccount);
    if (!nextMetadata) return;
    const nextSignature = JSON.stringify(nextMetadata);
    if (lastSyncedSupabaseProfileRef.current === nextSignature) return;

    let cancelled = false;
    const syncProfileToSupabase = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      const sessionEmail = String(sessionUser?.email || '').trim().toLowerCase();
      const accountEmail = String(userAccount.email || '').trim().toLowerCase();

      if (!sessionUser || !sessionEmail || sessionEmail !== accountEmail) return;

      const currentMetadata = sessionUser.user_metadata || {};
      const currentSignature = JSON.stringify({
        name: String(currentMetadata.name || ''),
        full_name: String(currentMetadata.full_name || ''),
        nickname: String(currentMetadata.nickname || ''),
        birthdate: String(currentMetadata.birthdate || ''),
        sex: String(currentMetadata.sex || ''),
        avatar_url: String(currentMetadata.avatar_url || ''),
      });

      if (currentSignature === nextSignature) {
        lastSyncedSupabaseProfileRef.current = nextSignature;
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: nextMetadata,
      });

      if (!cancelled && !error) {
        lastSyncedSupabaseProfileRef.current = nextSignature;
      }
    };

    syncProfileToSupabase().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, userAccount]);

  const markPracticeInteraction = useCallback(() => {
    if (!isTrackedDailyTab && !isTrackedUsageTab) return;
    setLastPracticeInteractionAt(Date.now());
  }, [isTrackedDailyTab, isTrackedUsageTab]);

  const refreshLifetimeOfferState = useCallback(async () => {
    try {
      const res = await fetch('/api/lifetime-offer', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return;
      setLifetimeOfferState(data);
    } catch {}
  }, []);

  const refreshSubscriptionData = useCallback(async () => {
    if (!userAccount?.email) return;
    try {
      const res = await fetch(`/api/subscription/status?email=${encodeURIComponent(userAccount.email)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return;
      setSubscriptionData((prev) => ({
        ...prev,
        plan: data.plan === 'pro' ? 'pro' : 'free',
        planKey: data.planKey || (data.plan === 'pro' ? prev.planKey : 'free'),
        status: data.status,
        billingCycle: data.billingCycle ?? null,
        isLifetime: Boolean(data.isLifetime),
        activatedAt: data.activatedAt,
        expiresAt: data.expiresAt ?? null,
      }));
    } catch {}
  }, [setSubscriptionData, userAccount?.email]);

  useEffect(() => {
    refreshSubscriptionData();
  }, [refreshSubscriptionData]);

  useEffect(() => {
    const handler = () => {
      refreshSubscriptionData();
    };
    window.addEventListener('sereno:refresh-subscription', handler);
    return () => {
      window.removeEventListener('sereno:refresh-subscription', handler);
    };
  }, [refreshSubscriptionData]);

  useEffect(() => {
    if (!showPaywall) return;
    refreshLifetimeOfferState();
    const interval = setInterval(refreshLifetimeOfferState, 30000);
    return () => clearInterval(interval);
  }, [showPaywall, refreshLifetimeOfferState]);

  const startPlanCheckout = useCallback(async (planKey: BillingPlanKey) => {
    if (!userAccount?.email) {
      setNoticeModal({
        open: true,
        title: 'Entre na sua conta primeiro',
        message: 'Faça login para continuar com a assinatura e abrir o checkout.',
      });
      navigateTo('login');
      return;
    }

    setCheckoutLoadingPlan(planKey);
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userAccount.email,
          customerName: userAccount.nickname || userAccount.name,
          planKey,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.checkoutUrl) {
        setNoticeModal({
          open: true,
          title: 'Não consegui abrir o checkout',
          message: data?.error || 'Tente novamente em instantes.',
        });
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setNoticeModal({
        open: true,
        title: 'Não consegui abrir o checkout',
        message: 'Tente novamente em instantes.',
      });
    } finally {
      setCheckoutLoadingPlan(null);
    }
  }, [navigateTo, userAccount]);

  const checkAccess = (feature: string, action?: string) => {
    if (hasUnlimitedAccess) return true;

    const today = new Date().toISOString().split('T')[0];

    if (feature === 'ai_chat') {
      const cooldownUntil = Number(subscriptionData?.usageCounts?.aiChatCooldownUntil || 0);
      const windowCount = Number(subscriptionData?.usageCounts?.aiChatWindowCount || 0);
      if (cooldownUntil && cooldownUntil > Date.now()) {
        setPaywallReason({ title: "Limite de Reflexões atingido", desc: "No plano gratuito você tem 5 mensagens por ciclo de 24 horas. O Sereno Pro oferece conversas ilimitadas!" });
        setShowPaywall(true);
        return false;
      }
      if (windowCount >= 5) {
        setSubscriptionData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            usageCounts: {
              ...prev.usageCounts,
              aiChatCooldownUntil: Date.now() + 24 * 60 * 60 * 1000,
            },
          };
        });
        setPaywallReason({ title: "Limite de Reflexões atingido", desc: "No plano gratuito você tem 5 mensagens por ciclo de 24 horas. O Sereno Pro oferece conversas ilimitadas!" });
        setShowPaywall(true);
        return false;
      }
    }

    if (feature === 'mural') {
      const usageKey = action === 'send' ? 'muralSend' : 'muralReceive';
      const dailyCount = subscriptionData?.usageCounts?.[usageKey]?.[today] || 0;
      if (dailyCount >= 1) {
        setPaywallReason({
          title: action === 'send' ? "Limite de envio do Mural atingido" : "Limite de leitura do Mural atingido",
          desc: action === 'send'
            ? "No plano gratuito você pode escrever 1 mensagem por dia no mural. No Pro, os envios ficam ilimitados."
            : "No plano gratuito você pode receber 1 mensagem por dia no mural. No Pro, as leituras ficam ilimitadas."
        });
        setShowPaywall(true);
        return false;
      }
    }

    if (feature === 'export_data') {
      const monthlyCount = subscriptionData?.usageCounts?.exportData?.[currentMonthKey] || 0;
      if (monthlyCount >= 2) {
        setPaywallReason({ title: "Limite de exportação atingido", desc: "No plano gratuito você pode exportar seus dados 2 vezes por mês. No Pro, a exportação fica ilimitada." });
        setShowPaywall(true);
        return false;
      }
    }

    // Features completely locked in Free mode (after trial)
    const lockedFeatures = ['yoga', 'hooponopono', 'lovelanguages', 'vocacional', 'fivefingers'];
    if (lockedFeatures.includes(feature)) {
      const premiumReasonMap: Record<string, { title: string; desc: string }> = {
        yoga: {
          title: "Yoga Nidra no Pro",
          desc: "No Pro, você libera o relaxamento profundo do Yoga Nidra para desacelerar, descansar e recuperar o corpo com mais profundidade.",
        },
        hooponopono: {
          title: "Ho'oponopono no Pro",
          desc: "No Pro, você libera essa prática guiada de liberação emocional, perdão e alívio interno.",
        },
        lovelanguages: {
          title: "Linguagens do Amor no Pro",
          desc: "No Pro, você desbloqueia esse recurso para entender melhor afeto, vínculo e necessidade emocional nas relações.",
        },
        vocacional: {
          title: "Exploração Vocacional no Pro",
          desc: "No Pro, você libera essa jornada para clarear direção, talentos e escolhas de carreira com mais profundidade.",
        },
        fivefingers: {
          title: "Método dos 5 Dedos no Pro",
          desc: "No Pro, você libera esse recurso para organizar conversas difíceis com mais clareza, consciência e presença.",
        },
      };
      setPaywallReason(premiumReasonMap[feature] || { title: "Recurso Premium 💎", desc: "Este conteúdo faz parte do Sereno Pro. Faça o upgrade para desbloquear." });
      setShowPaywall(true);
      return false;
    }

    return true;
  };

  const incrementUsage = (feature: 'aiChat' | 'muralSend' | 'muralReceive' | 'sharing' | 'exportData') => {
    if (hasUnlimitedAccess) return;
    const today = new Date().toISOString().split('T')[0];
    setSubscriptionData(prev => {
      if (!prev) return prev;
      const next = {
        ...prev,
        usageCounts: {
          ...prev.usageCounts,
          aiChat: { ...(prev.usageCounts.aiChat || {}) },
          aiChatWindowCount: prev.usageCounts.aiChatWindowCount || 0,
          aiChatCooldownUntil: prev.usageCounts.aiChatCooldownUntil || null,
          muralSend: { ...(prev.usageCounts.muralSend || {}) },
          muralReceive: { ...(prev.usageCounts.muralReceive || {}) },
          exportData: { ...(prev.usageCounts.exportData || {}) },
        }
      };
      if (feature === 'sharing') {
        next.usageCounts.sharing = (next.usageCounts.sharing || 0) + 1;
      } else if (feature === 'exportData') {
        next.usageCounts.exportData[currentMonthKey] = (next.usageCounts.exportData[currentMonthKey] || 0) + 1;
      } else if (next.usageCounts[feature]) {
        next.usageCounts[feature][today] = (next.usageCounts[feature][today] || 0) + 1;
        if (feature === 'aiChat') {
          const nextWindowCount = Number(next.usageCounts.aiChatWindowCount || 0) + 1;
          next.usageCounts.aiChatWindowCount = Math.min(5, nextWindowCount);
          if (nextWindowCount >= 5) {
            next.usageCounts.aiChatCooldownUntil = Date.now() + 24 * 60 * 60 * 1000;
          }
        }
      }
      return next;
    });
  };

  const openPaywallForFeature = (title: string, desc: string) => {
    setPaywallReason({ title, desc });
    setShowPaywall(true);
  };

  const [showHomeCustomization, setShowHomeCustomization] = useState(false);
  const [showRecommendApp, setShowRecommendApp] = useState(false);
  const [globalInboxCount, setGlobalInboxCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showBirthdayCelebrationGlobal, setShowBirthdayCelebrationGlobal] = useState(false);
  const [birthdayCelebrationKey, setBirthdayCelebrationKey] = useState<string>('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleInboxCount = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      setGlobalInboxCount(typeof detail === 'number' ? detail : 0);
    };
    window.addEventListener('sereno-inbox-count', handleInboxCount);
    return () => window.removeEventListener('sereno-inbox-count', handleInboxCount);
  }, []);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  };

  // Birthday celebration vignette (global, independent from active tab)
  useEffect(() => {
    if (!userAccount?.birthdate) return;
    const [y, m, d] = userAccount.birthdate.split('-').map(Number);
    if (!y || !m || !d) return;

    const now = new Date();
    const isBirthday = now.getDate() === d && now.getMonth() === (m - 1);
    if (!isBirthday) return;

    const todayKey = now.toISOString().slice(0, 10);
    const celebrationKey = `birthday_celebration_seen_v4_${todayKey}`;
    if (localStorage.getItem(celebrationKey)) return;

    setBirthdayCelebrationKey(celebrationKey);
    setShowBirthdayCelebrationGlobal(true);

    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const melody: Array<{ freq: number; duration: number }> = [
          { freq: 392.0, duration: 0.34 },
          { freq: 392.0, duration: 0.34 },
          { freq: 440.0, duration: 0.52 },
          { freq: 392.0, duration: 0.52 },
          { freq: 523.25, duration: 0.52 },
          { freq: 493.88, duration: 0.9 },

          { freq: 392.0, duration: 0.34 },
          { freq: 392.0, duration: 0.34 },
          { freq: 440.0, duration: 0.52 },
          { freq: 392.0, duration: 0.52 },
          { freq: 587.33, duration: 0.52 },
          { freq: 523.25, duration: 0.9 },

          { freq: 392.0, duration: 0.34 },
          { freq: 392.0, duration: 0.34 },
          { freq: 783.99, duration: 0.52 },
          { freq: 659.25, duration: 0.52 },
          { freq: 523.25, duration: 0.52 },
          { freq: 493.88, duration: 0.52 },
          { freq: 440.0, duration: 0.95 },

          { freq: 698.46, duration: 0.34 },
          { freq: 698.46, duration: 0.34 },
          { freq: 659.25, duration: 0.52 },
          { freq: 523.25, duration: 0.52 },
          { freq: 587.33, duration: 0.52 },
          { freq: 523.25, duration: 1.05 },
        ];

        let cursor = ctx.currentTime + 0.05;
        melody.forEach(({ freq, duration }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, cursor);
          gain.gain.exponentialRampToValueAtTime(0.16, cursor + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.11, cursor + Math.max(0.08, duration - 0.08));
          gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(cursor);
          osc.stop(cursor + duration + 0.02);
          cursor += duration + 0.03;
        });

        window.setTimeout(() => {
          try { ctx.close(); } catch {}
        }, Math.ceil((cursor - ctx.currentTime + 0.3) * 1000));
      }
    } catch {}

    const t = setTimeout(() => {
      setShowBirthdayCelebrationGlobal(false);
      if (celebrationKey) localStorage.setItem(celebrationKey, '1');
    }, 6500);
    return () => clearTimeout(t);
  }, [userAccount?.birthdate]);

  // Register push subscription to enable notifications even with app fechado
  useEffect(() => {
    const hasAnyReminderEnabled = !!(
      reminderSettings?.moodReminder || reminderSettings?.breathingReminder || reminderSettings?.diaryReminder ||
      reminderSettings?.healthySelfReminder || reminderSettings?.meditationReminder || reminderSettings?.gratitudeReminder ||
      reminderSettings?.sleepReminder || reminderSettings?.missionsReminder || reminderSettings?.microtasksReminder ||
      reminderSettings?.yogaReminder || reminderSettings?.badgesReminder || reminderSettings?.mindmapReminder || reminderSettings?.psychoeduReminder ||
      reminderSettings?.adaptiveSuggestionReminder || reminderSettings?.therapyReminder ||
      userAccount?.birthdate
    );

    if (!hasAnyReminderEnabled) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setupPush = async () => {
      try {
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const publicKey = getPublicVapidKey();
        if (!publicKey) return;
        let sub = await registration.pushManager.getSubscription();
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        await fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub,
            birthdate: userAccount?.birthdate,
            reminders: reminderSettings,
            capsules: (timeCapsules || []).map((c: any) => ({ id: c.id, title: c.title, type: c.type, openAt: c.openAt })),
          }),
        });
      } catch {}
    };

    setupPush();
  }, [userAccount?.birthdate, JSON.stringify(reminderSettings), JSON.stringify(timeCapsules)]);

  // Dev safety: avoid stale SW cache breaking client bundles on localhost
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {}
    })();
  }, []);

  // Font size & Family effect - adds class to html element for global styling
  useEffect(() => {
    if (!visualSettings) return;
    const html = document.documentElement;
    // Remove old classes
    html.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    html.classList.remove('family-sans', 'family-serif', 'family-dyslexic');

    // Add new classes
    html.classList.add(`font-${visualSettings.fontSize || 'medium'}`);
    html.classList.add(`family-${visualSettings.fontFamily || 'sans'}`);
  }, [visualSettings?.fontSize, visualSettings?.fontFamily]);

  useEffect(() => {
    const hasValidPin = /^\d{4}$/.test(privacySettings?.appLockPin || '');
    const shouldLock = Boolean(isLoggedIn && privacySettings?.appLockEnabled && hasValidPin);
    if (!shouldLock) {
      setAppLocked(false);
      setAppLockInput('');
      setAppLockError('');
      return;
    }

    setAppLocked(true);
    setAppLockInput('');
    setAppLockError('');

    const lockOnHidden = () => {
      if (document.visibilityState === 'hidden') {
        setAppLocked(true);
        setAppLockInput('');
        setAppLockError('');
      }
    };
    const lockOnBlur = () => {
      setAppLocked(true);
      setAppLockInput('');
      setAppLockError('');
    };

    document.addEventListener('visibilitychange', lockOnHidden);
    window.addEventListener('blur', lockOnBlur);
    return () => {
      document.removeEventListener('visibilitychange', lockOnHidden);
      window.removeEventListener('blur', lockOnBlur);
    };
  }, [isLoggedIn, privacySettings?.appLockEnabled, privacySettings?.appLockPin]);

  // ==================== PLANS COMPARISON ====================
  const PlansComparison = ({ darkMode: dm }: { darkMode?: boolean }) => {
    const comparisonFeatures = [
      { name: 'Diário, humor, SOS e hábitos', free: 'Incluído', pro: 'Incluído' },
      { name: 'Respiração', free: '5 práticas', pro: 'Biblioteca completa' },
      { name: 'Meditação', free: '3 práticas', pro: 'Biblioteca completa' },
      { name: 'Time Livre, Gratidão e Solta Aqui', free: 'Incluído', pro: 'Incluído' },
      { name: 'Chat com SERENO', free: '5 por dia', pro: 'Ilimitado' },
      { name: 'Mural de Esperança', free: '1 receber + 1 enviar por dia', pro: 'Ilimitado' },
      { name: 'Compartilhar conquista', free: 'Incluído', pro: 'Incluído' },
      { name: 'Exportar dados', free: '2 por mês', pro: 'Ilimitado' },
      { name: 'Psicoeducação', free: 'Essencial', pro: 'Completa' },
      { name: 'Trilhas Temáticas', free: 'Essencial', pro: 'Completa' },
      { name: 'Inteligência Emocional', free: 'Essencial', pro: 'Completa' },
      { name: 'Modo Casal', free: 'Básico', pro: 'Avançado' },
      { name: 'Modo Família', free: 'Básico', pro: 'Avançado' },
      { name: 'Yoga Nidra', free: 'Bloqueado', pro: 'Liberado' },
      { name: "Ho'oponopono", free: 'Bloqueado', pro: 'Liberado' },
      { name: 'Linguagens do Amor', free: 'Bloqueado', pro: 'Liberado' },
      { name: 'Método dos 5 Dedos', free: 'Bloqueado', pro: 'Liberado' },
      { name: 'Exploração Vocacional', free: 'Bloqueado', pro: 'Liberado' },
    ];

    return (
      <div className={`mt-6 mb-6 overflow-hidden rounded-[2rem] border shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${dm ? 'border-slate-700/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.86)_0%,rgba(15,23,42,0.68)_100%)]' : 'border-indigo-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,247,255,0.92)_100%)]'}`}>
        <div className={`border-b px-5 py-5 ${dm ? 'border-slate-700/70 bg-slate-900/30' : 'border-indigo-100 bg-white/60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Comparar planos</p>
              <h3 className={`mt-2 text-xl font-black tracking-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>O que muda no grátis e no Pro</h3>
            </div>
            <div className={`shrink-0 rounded-2xl border px-3 py-2 text-right ${
              currentPlanTone === 'free'
                ? (dm ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : 'border-cyan-200 bg-cyan-50 text-cyan-700')
                : currentPlanTone === 'company'
                  ? (dm ? 'border-rose-500/35 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700')
                  : currentPlanTone === 'lifetime'
                    ? (dm ? 'border-amber-400/35 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700')
                    : (dm ? 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200' : 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700')
            }`}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em]">Plano atual</p>
              <p className="mt-1 text-sm font-black">{currentPlanLabel}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {comparisonFeatures.map((feature, index) => (
            <div
              key={index}
              className={`rounded-[1.6rem] border p-4 ${dm ? 'border-slate-700/80 bg-slate-900/35' : 'border-indigo-100 bg-white/90'}`}
            >
              <p className={`text-[15px] font-black leading-snug ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{feature.name}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className={`rounded-2xl border px-3 py-3 ${dm ? 'border-slate-700 bg-slate-950/55 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${dm ? 'text-slate-500' : 'text-slate-500'}`}>Grátis</p>
                  <p className="mt-2 text-[14px] font-bold leading-snug">{feature.free}</p>
                </div>
                <div className={`rounded-2xl border px-3 py-3 shadow-sm ${dm ? 'border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-100' : 'border-fuchsia-200 bg-fuchsia-50/90 text-fuchsia-800'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Pro</p>
                  <p className="mt-2 text-[14px] font-black leading-snug">{feature.pro}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block px-2 pb-5 pt-5">
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className={`rounded-l-[1.35rem] border-y border-l pl-3 pr-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] ${dm ? 'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-200' : 'border-cyan-200 bg-cyan-50 text-cyan-700'}`}>Recursos</th>
                <th className={`border-y px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] ${dm ? 'border-slate-700 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>Grátis</th>
                <th className={`rounded-r-[1.35rem] border pl-3 pr-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] ${dm ? 'border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-300' : 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700'}`}>Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature, index) => (
                <tr key={index}>
                  <td className={`border-b border-l pl-3 pr-4 py-4 text-[14px] font-black leading-snug ${index === comparisonFeatures.length - 1 ? 'rounded-bl-[1.35rem]' : ''} ${dm ? 'border-cyan-500/20 bg-cyan-500/[0.06] text-slate-200' : 'border-cyan-200 bg-cyan-50/70 text-slate-800'}`}>{feature.name}</td>
                  <td className={`border-b px-5 py-4 text-center text-[14px] font-semibold leading-snug ${dm ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>{feature.free}</td>
                  <td className={`border-b border-r pl-3 pr-5 py-4 text-center text-[14px] font-black leading-snug ${index === comparisonFeatures.length - 1 ? 'rounded-br-[1.35rem]' : ''} ${dm ? 'border-fuchsia-500/25 bg-fuchsia-500/[0.07] text-fuchsia-200' : 'border-fuchsia-200 bg-fuchsia-50/75 text-fuchsia-800'}`}>{feature.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const PLAN_PRICE_COPY: Partial<Record<BillingPlanKey, { primary: string; secondary?: string }>> = {
    pro_individual_monthly: { primary: 'R$ 22,90/mês' },
    pro_individual_annual: { primary: 'R$ 13,90 / mês', secondary: 'Total anual: R$ 166,80 à vista' },
    pro_casal_monthly: { primary: 'R$ 34,90/mês' },
    pro_casal_annual: { primary: 'R$ 19,90 / mês', secondary: 'Total anual: R$ 238,80 à vista' },
    pro_amigos_monthly: { primary: 'R$ 39,90/mês' },
    pro_amigos_annual: { primary: 'R$ 23,90 / mês', secondary: 'Total anual: R$ 286,80 à vista' },
    pro_familia_monthly: { primary: 'R$ 54,90/mês' },
    pro_familia_annual: { primary: 'R$ 31,90 / mês', secondary: 'Total anual: R$ 382,80 à vista' },
    pro_empresa_pequena_mensal: { primary: 'R$ 99/mês' },
    pro_empresa_pequena_anual: { primary: 'R$ 69 / mês', secondary: 'Total anual: R$ 828 à vista' },
    pro_empresa_media_mensal: { primary: 'R$ 197/mês' },
    pro_empresa_media_anual: { primary: 'R$ 129 / mês', secondary: 'Total anual: R$ 1.548 à vista' },
    pro_empresa_grande_mensal: { primary: 'R$ 347/mês' },
    pro_empresa_grande_anual: { primary: 'R$ 247 / mês', secondary: 'Total anual: R$ 2.964 à vista' },
    vitalicio: { primary: 'R$ 499 à vista' },
  };

  // Handle premium icon for Pro in NavButton
  const ProBadge = () => (
    <div className="absolute -top-1 -right-1 z-20">
      <SparklePremiumIcon className="w-3 h-3 text-indigo-400" />
    </div>
  );

  // Wait for client mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl animate-pulse">
            <span className="text-3xl">🧠</span>
          </div>
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!authResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl animate-pulse">
            <span className="text-3xl">☁</span>
          </div>
          <p className="text-gray-400 text-sm">Conferindo sua sessão...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen desktopMode={desktopMode} onLogin={(account) => { setUserAccount(account); setIsLoggedIn(true); }} />;
  }

  if (isSupabaseConfigured && (!cloudSyncReady || !structuredSyncReady || !accountBucketReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#38bdf8_0%,#4f46e5_55%,#14b8a6_100%)] text-3xl text-white shadow-[0_18px_36px_rgba(79,70,229,0.22)] animate-pulse">
            ☁
          </div>
          <h2 className="text-xl font-black text-slate-900">Sincronizando sua conta</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Estamos carregando seus registros, preferências e progresso para continuar do seu jeito.
          </p>
        </div>
      </div>
    );
  }

  const dm = darkMode;

  // Insomnia SOS check (if between 2 AM and 5 AM)

  if (showSosNight) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center text-center animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,50,100,0.2),transparent_70%)]"></div>
        <span className="text-6xl mb-6 block drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10">🌙</span>
        <h2 className="text-3xl font-extrabold mb-4 relative z-10">Não consegue dormir?</h2>
        <p className="text-lg text-slate-400 max-w-sm mb-10 relative z-10">
          Está tudo bem. A madrugada pode ser solitária, mas nós estamos aqui com você.
          Descanse os olhos e tente relaxar sem telas brilhantes.
        </p>

        <div className="space-y-4 w-full max-w-sm relative z-10">
          <button
            onClick={() => setShowNightSounds((prev) => !prev)}
            className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all font-bold tracking-wide border border-white/5"
          >
            {showNightSounds ? '✕ Fechar Sons da Natureza' : '🎧 Ouvir Sons da Natureza'}
          </button>
          {showNightSounds && (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 text-left backdrop-blur-xl animate-fade-in">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-300">Escolha um ambiente</p>
              <div className="mt-3 space-y-3">
                {nightPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => playNightPreset(preset.id, preset.sounds)}
                    className={`w-full rounded-[1.5rem] border px-4 py-3 text-left transition-all active:scale-[0.99] ${
                      activeNightPreset === preset.id
                        ? 'border-indigo-400/50 bg-indigo-500/20 shadow-[0_0_24px_rgba(99,102,241,0.25)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl">{preset.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white truncate">{preset.name}</p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            {activeNightPreset === preset.id ? 'Tocando agora' : 'Tocar ambiente'}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg ${
                        activeNightPreset === preset.id ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-200'
                      }`}>
                        {activeNightPreset === preset.id ? '⏸️' : '▶️'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigateTo('sleep')}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-black tracking-wide text-slate-200 hover:bg-white/10 transition-all"
              >
                Abrir Modo Sono Completo
              </button>
            </div>
          )}
          <button
            onClick={() => navigateTo('breathing', { exerciseId: 'relaxamento' })}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-bold tracking-wide border border-white/5"
          >
            🌬️ Respiração para Dormir
          </button>
          <button
            onClick={() => { setTabParams({ ...tabParams, dismissInsomnia: true }); }}
            className="w-full py-4 rounded-2xl bg-transparent transition-all font-bold tracking-wide text-white/50 hover:text-white"
          >
            Apenas ir para o Início
          </button>
        </div>
      </div>
    );
  }

  const unlockApp = () => {
    if (appLockInput === privacySettings?.appLockPin) {
      setAppLocked(false);
      setAppLockInput('');
      setAppLockError('');
      return;
    }
    setAppLockError('PIN incorreto.');
  };

  const libraryNavIsActive = ['library', 'meditation', 'breathing', 'yoga', 'sleep', 'hooponopono', 'habits', 'mixer', 'microtasks', 'missions', 'fivefingers', 'tracks', 'timer', 'psychoedu', 'emocional', 'couple', 'family', 'vocacional', 'lovelanguages'].includes(activeTab);

  return (
    <div className={`min-h-screen flex flex-col relative transition-all duration-300 ${desktopMode ? 'sereno-desktop-shell h-screen overflow-hidden w-full max-w-none' : 'max-w-md mx-auto'} ${dm ? 'bg-[radial-gradient(circle_at_top,#11304a_0%,transparent_30%),radial-gradient(circle_at_bottom,#10281e_0%,transparent_24%),linear-gradient(180deg,#08111d_0%,#0d1726_45%,#0a1320_100%)] text-white' : 'bg-gradient-calm'}`}>
      {desktopMode && (
      <div className="hidden lg:block">
        <aside className={`fixed inset-y-0 left-0 z-40 w-[290px] overflow-y-auto border-r px-5 py-6 custom-scrollbar ${dm ? 'border-white/10 bg-[#08121f]/92 backdrop-blur-2xl' : 'border-slate-200/80 bg-white/88 backdrop-blur-2xl'}`}>
          <div className="flex h-full flex-col">
            <div className="mb-6">
              <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${dm ? 'text-cyan-300' : 'text-cyan-700'}`}>Sereno</p>
              <h2 className={`mt-3 text-3xl font-serif leading-tight ${dm ? 'text-white' : 'text-slate-900'}`}>Seu app completo agora também no desktop.</h2>
              <p className={`mt-3 text-sm leading-6 ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Use a lateral para navegar sem perder a estrutura do app móvel.</p>
            </div>

            <div className="grid gap-2">
              <DesktopNavButton icon={<HomeIcon />} label="Início" active={activeTab === 'home'} onClick={goHome} dm={dm} />
              <DesktopNavButton icon={<DynamicNavIcon tab="sos" />} label="SOS" active={activeTab === 'sos'} onClick={() => navigateTo('sos')} dm={dm} />
              <DesktopNavButton icon={<MeditateIcon />} label="Biblioteca" active={libraryNavIsActive} onClick={() => navigateTo('library')} dm={dm} />
              <DesktopNavButton icon={<DiaryIcon />} label="Diário" active={activeTab === 'diary'} onClick={() => navigateTo('diary')} dm={dm} />
              <DesktopNavButton icon={<ProfileIcon />} label="Perfil" active={activeTab === 'login'} onClick={() => navigateTo('login')} dm={dm} />
              <DesktopNavButton icon={<ChatIcon />} label="Chat" active={activeTab === 'chat'} onClick={() => navigateTo('chat')} dm={dm} />
            </div>

            <div className={`mt-6 rounded-[1.8rem] border p-4 ${dm ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/90'}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Ações rápidas</p>
              <div className="mt-4 grid grid-cols-1 gap-2.5">
                <button onClick={() => navigateTo('mood')} className={`min-h-[52px] rounded-2xl px-4 py-3 text-left text-sm leading-none font-black transition-all whitespace-nowrap ${dm ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-800' : 'bg-white text-slate-800 hover:bg-slate-100'}`}>Humor</button>
                <button onClick={() => navigateTo('gratitude')} className={`min-h-[52px] rounded-2xl px-4 py-3 text-left text-sm leading-none font-black transition-all whitespace-nowrap ${dm ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-800' : 'bg-white text-slate-800 hover:bg-slate-100'}`}>Gratidão</button>
                <button onClick={() => navigateTo('breathing')} className={`min-h-[52px] rounded-2xl px-4 py-3 text-left text-sm leading-none font-black transition-all whitespace-nowrap ${dm ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-800' : 'bg-white text-slate-800 hover:bg-slate-100'}`}>Respiração</button>
                <button onClick={() => navigateTo('meditation')} className={`min-h-[52px] rounded-2xl px-4 py-3 text-left text-sm leading-none font-black transition-all whitespace-nowrap ${dm ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-800' : 'bg-white text-slate-800 hover:bg-slate-100'}`}>Meditação</button>
              </div>
            </div>

            <div className={`mt-auto rounded-[1.8rem] border p-4 ${dm ? 'border-cyan-900/30 bg-[linear-gradient(180deg,#0d1828_0%,#12233a_100%)]' : 'border-slate-200 bg-white'}`}>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-cyan-300' : 'text-cyan-700'}`}>Desktop</p>
              <p className={`mt-3 text-sm leading-6 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>O app continua igual no celular. Aqui no navegador ele só ganhou mais espaço e navegação lateral.</p>
            </div>
          </div>
        </aside>
      </div>
      )}

      {appLocked && (
        <div className="fixed inset-0 z-[160] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-[2rem] border p-6 shadow-2xl ${dm ? 'border-white/10 bg-slate-950/95 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}>
            <div className="text-center">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] ${dm ? 'bg-white/10' : 'bg-slate-100'}`}>
                <span className="text-3xl">🔒</span>
              </div>
              <p className={`mt-4 text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Bloqueio do app</p>
              <h3 className={`mt-2 text-2xl font-black tracking-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Digite seu PIN</h3>
              <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Seu espaço está protegido. Digite os 4 dígitos para continuar.</p>
            </div>
            <div className="mt-5">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={appLockInput}
                onChange={(e) => {
                  setAppLockInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (appLockError) setAppLockError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') unlockApp();
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-center text-lg font-black tracking-[0.35em] outline-none transition-all ${dm ? 'border-white/10 bg-slate-900 text-slate-100 focus:border-indigo-400' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-400'}`}
                placeholder="••••"
              />
              {appLockError && (
                <p className={`mt-3 text-center text-sm ${dm ? 'text-rose-300' : 'text-rose-600'}`}>{appLockError}</p>
              )}
              <button
                onClick={unlockApp}
                className={`mt-4 w-full rounded-2xl py-3 text-sm font-black transition-all active:scale-95 ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {showBirthdayCelebrationGlobal && (
        <div className="fixed inset-0 z-[140] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowBirthdayCelebrationGlobal(false); if (birthdayCelebrationKey) localStorage.setItem(birthdayCelebrationKey, '1'); }}>
          <div className={`relative w-full max-w-xl overflow-hidden rounded-[2.3rem] border p-8 text-center shadow-[0_30px_70px_rgba(15,23,42,0.28)] ${dm ? 'bg-[radial-gradient(circle_at_top,#182846_0%,transparent_42%),linear-gradient(180deg,#0d1626_0%,#101a2c_100%)] border-cyan-900/30 text-slate-100' : 'bg-[radial-gradient(circle_at_top,#e0f2fe_0%,transparent_38%),linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] border-slate-200 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`pointer-events-none absolute inset-x-10 top-0 h-24 rounded-b-[999px] blur-3xl ${dm ? 'bg-indigo-500/16' : 'bg-sky-200/70'}`} />
            <div className={`pointer-events-none absolute -left-10 bottom-8 h-36 w-36 rounded-full blur-3xl ${dm ? 'bg-cyan-400/12' : 'bg-cyan-200/60'}`} />
            <div className={`pointer-events-none absolute -right-10 top-12 h-40 w-40 rounded-full blur-3xl ${dm ? 'bg-fuchsia-400/14' : 'bg-violet-200/55'}`} />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} className="absolute text-xl animate-[fallConfetti_3.4s_linear_infinite]" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.18}s` }}>
                  {['🎉', '✨', '🎊', '💛', '🩵'][i % 5]}
                </span>
              ))}
            </div>
            <div className="relative z-10">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[1.9rem] border ${dm ? 'bg-white/8 border-white/10' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
                <span className="text-5xl">🎂</span>
              </div>
              <p className={`mt-5 text-[11px] font-black uppercase tracking-[0.22em] ${dm ? 'text-cyan-300' : 'text-cyan-700'}`}>Dia especial</p>
              <h3 className={`mt-2 text-[2rem] font-black tracking-[-0.04em] ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>Feliz aniversário</h3>
              <p className={`mt-3 text-[15px] font-semibold leading-relaxed ${dm ? 'text-slate-200' : 'text-slate-700'}`}>Hoje é seu dia. Que ele venha com leveza, carinho e espaço para celebrar você.</p>
              <div className={`mx-auto mt-5 max-w-sm rounded-[1.6rem] border px-4 py-4 ${dm ? 'bg-white/6 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <p className={`text-sm font-bold ${dm ? 'text-slate-100' : 'text-slate-800'}`}>O Sereno deseja um novo ciclo com mais presença, mais cuidado e bons encontros com você mesmo.</p>
              </div>
              <div className="mt-5 flex justify-center gap-2 text-3xl">
                <span>🎉</span>
                <span>🎈</span>
                <span>✨</span>
                <span>🥳</span>
              </div>
              <button onClick={() => { setShowBirthdayCelebrationGlobal(false); if (birthdayCelebrationKey) localStorage.setItem(birthdayCelebrationKey, '1'); }} className={`mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(79,70,229,0.28)] ${dm ? 'bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_100%)]' : 'bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)]'}`}>Continuar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fallConfetti {
          0% { transform: translateY(-18px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(460px) rotate(360deg); opacity: 0; }
        }
        @keyframes serenoShimmer {
          0% { transform: translateX(0); opacity: 0; }
          18% { opacity: 0.55; }
          50% { transform: translateX(240%); opacity: 0.9; }
          82% { opacity: 0.45; }
          100% { transform: translateX(420%); opacity: 0; }
        }
      `}</style>

      {/* Top bar with Back Button or Sleep Button */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className={`relative h-16 mx-auto w-full ${desktopMode ? 'max-w-7xl lg:pl-[310px]' : 'max-w-md'}`}>
          <div className="absolute top-2 left-4 pointer-events-auto flex items-center gap-3">
            {activeTab !== 'home' && activeTab !== 'login' ? (
              <button
                onClick={goBack}
                className={`sereno-floating-action w-12 h-12 rounded-2xl flex items-center justify-center text-lg active:scale-95 transition-all duration-300 ${dm ? 'bg-[#102033]/88 border border-cyan-900/30 text-slate-100 hover:bg-[#14263b]' : 'text-gray-700 hover:bg-white'}`}
                title="Voltar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Top actions */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className={`relative h-16 mx-auto w-full ${desktopMode ? 'max-w-7xl lg:pl-[310px]' : 'max-w-md'}`}>
          {activeTab === 'home' && (
            <div className="absolute top-2 right-4 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => navigateTo('chat')}
                className={`sereno-floating-action w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${dm ? 'bg-[#102033]/92 border border-cyan-900/30 text-slate-100' : 'text-slate-700'}`}
                title="Chat"
              >
                <ChatIcon />
              </button>
              <button
                onClick={() => {
                  setShowRecommendApp(true);
                }}
                className={`sereno-floating-action w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${dm ? 'bg-[#102033]/92 border border-cyan-900/30 text-slate-100' : 'text-slate-700'}`}
                title="Compartilhar"
              >
                <ShareIcon />
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('sereno-open-inbox'))}
                className={`sereno-floating-action relative w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${dm ? 'bg-[#102033]/92 border border-cyan-900/30 text-slate-100' : 'text-slate-700'}`}
                title="Avisos"
              >
                <BellIcon />
                {globalInboxCount > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${dm ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'}`}>
                    {globalInboxCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`sereno-floating-action w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${dm ? 'bg-[#102033]/92 border border-cyan-900/30 text-slate-100' : 'text-slate-700'}`}
                title={dm ? 'Modo claro' : 'Modo escuro'}
              >
                <span className="text-lg leading-none">{dm ? '☀️' : '🌙'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 pb-20 pt-14 ${desktopMode ? 'overflow-y-scroll custom-scrollbar lg:pb-10 lg:pl-[310px]' : 'overflow-y-auto'}`}
        onPointerDown={markPracticeInteraction}
        onPointerMove={markPracticeInteraction}
        onWheel={markPracticeInteraction}
        onTouchStart={markPracticeInteraction}
        onKeyDown={markPracticeInteraction}
        onScroll={markPracticeInteraction}
      >
        {activeTab === 'home' && (
          <HomeSection
            desktopMode={desktopMode}
            onNavigate={navigateTo}
            onShowPlans={(options) => {
              setPaywallReason({
                title: options?.title || "Grátis para começar. Pro para aprofundar.",
                desc: options?.desc || "Compare o que já está liberado no grátis com a profundidade extra do Pro e escolha a modalidade que fizer sentido para você."
              });
              setShowPaywall(true);
            }}
            moodHistory={moodHistory}
            userProgress={userProgress}
            practiceStreak={practiceStreak}
            practiceSequenceCycleDays={practiceSequenceCycleDays}
            mostUsedTab={computedMostUsedTab}
            todayMinutes={todayMinutes}
            darkMode={dm}
            userName={userAccount?.nickname || userAccount?.name || ''}
            hideStreaks={wellbeingSettings.hideStreaks}
            diaryEntries={diaryEntries}
            soltaEntries={soltaEntries}
            dailyGoal={dailyGoal}
            userAccount={userAccount}
            healthyMessages={healthyMessages}
            hasUnlimitedAccess={hasUnlimitedAccess}
          />
        )}
        {activeTab === 'chat' && (
          <ChatSection
            moodHistory={moodHistory}
            diaryEntries={diaryEntries}
            thoughtRecords={thoughtRecords}
            gratitudeEntries={gratitudeEntries}
            soltaEntries={soltaEntries}
            userProgress={userProgress}
            userName={userAccount?.nickname || userAccount?.name || ''}
            darkMode={dm}
            onNavigate={navigateTo}
            defaultVoice={defaultVoice}
            audioSettings={audioSettings}
            onCheckAccess={checkAccess}
            onIncrementUsage={incrementUsage}
            hasUnlimitedAccess={hasUnlimitedAccess}
            dailyChatUsage={subscriptionData?.usageCounts?.aiChat?.[new Date().toISOString().split('T')[0]] || 0}
            chatWindowCount={subscriptionData?.usageCounts?.aiChatWindowCount || 0}
            chatCooldownUntil={subscriptionData?.usageCounts?.aiChatCooldownUntil || null}
            onShowPlans={(options?: { title?: string; desc?: string; focus?: string }) => {
              setPaywallReason({
                title: options?.title || 'Chat com SERENO ilimitado',
                desc: options?.desc || 'No plano gratuito você tem 5 mensagens por dia. No Pro, a conversa fica liberada sem limite.',
              });
              setShowPaywall(true);
            }}
          />
        )}
        {activeTab === 'library' && (
          <HomeSection
            desktopMode={desktopMode}
            onNavigate={navigateTo}
            onShowPlans={(options) => {
              setPaywallReason({
                title: options?.title || "Grátis para começar. Pro para aprofundar.",
                desc: options?.desc || "Compare o que já está liberado no grátis com a profundidade extra do Pro e escolha a modalidade que fizer sentido para você."
              });
              setShowPaywall(true);
            }}
            moodHistory={moodHistory}
            userProgress={userProgress}
            practiceStreak={practiceStreak}
            practiceSequenceCycleDays={practiceSequenceCycleDays}
            mostUsedTab={computedMostUsedTab}
            todayMinutes={todayMinutes}
            darkMode={dm}
            userName={userAccount?.nickname || userAccount?.name || ''}
            hideStreaks={wellbeingSettings.hideStreaks}
            diaryEntries={diaryEntries}
            soltaEntries={soltaEntries}
            dailyGoal={dailyGoal}
            userAccount={userAccount}
            healthyMessages={healthyMessages}
            hasUnlimitedAccess={hasUnlimitedAccess}
            libraryOnly
          />
        )}
        {activeTab === 'breathing' && <BreathingSection onComplete={() => {
          setUserProgress(prev => ({ ...prev, breathingCompleted: prev.breathingCompleted + 1 }));
        }} initialExerciseId={tabParams?.exerciseId} onExerciseChange={(exerciseId: string) => updateContinueContext('breathing', { ...(tabParams || {}), exerciseId })} onNavigateBack={goBack} darkMode={dm} defaultVoice={defaultVoice} setDefaultVoice={setDefaultVoice} hasUnlimitedAccess={hasUnlimitedAccess} onShowUpgrade={() => openPaywallForFeature('Biblioteca completa de respiração', 'No plano gratuito você acessa as práticas essenciais. No Pro, a biblioteca completa de respiração fica liberada.')} />}
        {activeTab === 'meditation' && (
          <MeditationSection
            onComplete={() => {
              setUserProgress(prev => ({ ...prev, meditationsCompleted: prev.meditationsCompleted + 1 }));
            }}
            darkMode={dm}
            onCheckAccess={checkAccess}
            defaultVoice={defaultVoice}
            setDefaultVoice={setDefaultVoice}
            audioSettings={audioSettings}
            hasUnlimitedAccess={hasUnlimitedAccess}
            initialMode={tabParams?.meditationMode === 'free' ? 'free' : 'guided'}
            initialScriptId={tabParams?.scriptId}
            onScriptChange={(scriptId: string) => updateContinueContext('meditation', { ...(tabParams || {}), scriptId })}
            onShowUpgrade={() => openPaywallForFeature('Biblioteca completa de meditação', 'No gratuito você já tem meditações essenciais. No Pro, entram novas práticas e mais profundidade.')}
          />
        )}
        {activeTab === 'mood' && (
          <MoodSection
            moodHistory={moodHistory}
            setMoodHistory={(value) => {
              const next = typeof value === 'function' ? (value as any)(moodHistory) : value;
              setMoodHistory(next);
            }}
            darkMode={dm}
            desktopMode={desktopMode}
            initialStep={tabParams?.moodStep}
            onStepChange={(step) => {
              setTabParams((prev: Record<string, any>) => ({ ...(prev || {}), moodStep: step }));
            }}
            userSex={userAccount?.sex}
            onNavigate={navigateTo}
          />
        )}
        {activeTab === 'sos' && <SosAnxietySection onNavigate={navigateTo} darkMode={dm} />}
        {activeTab === 'calm' && (
          <CalmSection
            onNavigateBack={goBack}
            darkMode={dm}
            initialStep={tabParams?.calmStep}
            onStepChange={(step) => navigateTo('calm', { ...tabParams, calmStep: step })}
          />
        )}
        {activeTab === 'acalmese' && (
          <AcalmeseSection
            onNavigateBack={goBack}
            darkMode={dm}
            initialStep={tabParams?.acalmeseStep}
            onStepChange={(step) => navigateTo('acalmese', { ...tabParams, acalmeseStep: step })}
          />
        )}
        {activeTab === 'diary' && (
          <UnifiedDiarySection
            diaryEntries={diaryEntries}
            setDiaryEntries={(value) => {
              const next = typeof value === 'function' ? (value as any)(diaryEntries) : value;
              setDiaryEntries(next);
            }}
            thoughtRecords={thoughtRecords}
            setThoughtRecords={(value) => {
              const next = typeof value === 'function' ? (value as any)(thoughtRecords) : value;
              setThoughtRecords(next);
            }}
            darkMode={dm}
            desktopMode={desktopMode}
            initialMode={tabParams?.diaryMode}
            onModeChange={(mode) => {
              setTabParams((prev: Record<string, any>) => ({ ...(prev || {}), diaryMode: mode }));
            }}
            onNavigate={navigateTo}
          />
        )}
        {activeTab === 'safety' && <SafetyPlanSection safetyPlan={safetyPlan} setSafetyPlan={setSafetyPlan} darkMode={dm} />}
        {activeTab === 'reminders' && <RemindersSection settings={reminderSettings} setSettings={setReminderSettings} darkMode={dm} />}
        {activeTab === 'yoga' && <YogaNidraSection onComplete={() => {
          setUserProgress(prev => ({ ...prev, yogaCompleted: prev.yogaCompleted + 1 }));
        }} darkMode={dm} onCheckAccess={checkAccess} defaultVoice={defaultVoice} setDefaultVoice={setDefaultVoice} />}
        {activeTab === 'solta' && <SoltaAquiSection entries={soltaEntries} setEntries={(value) => {
          const next = typeof value === 'function' ? (value as any)(soltaEntries) : value;
          setSoltaEntries(next);
        }} darkMode={dm} desktopMode={desktopMode} onNavigate={navigateTo} />}
        {activeTab === 'assertiveness' && <AssertivenessSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'sleep' && <SleepModeSection darkMode={dm} defaultVoice={defaultVoice} setDefaultVoice={setDefaultVoice} audioSettings={audioSettings} />}
        {activeTab === 'gratitude' && (
          <GratitudeSection
            entries={gratitudeEntries}
            setEntries={(value) => {
              const next = typeof value === 'function' ? (value as any)(gratitudeEntries) : value;
              setGratitudeEntries(next);
            }}
            photos={gratitudePhotos}
            setPhotos={setGratitudePhotos}
            darkMode={dm}
            desktopMode={desktopMode}
            onNavigate={navigateTo}
          />
        )}
        {activeTab === 'timer' && (
          <MeditationSection
            onComplete={() => {
              setUserProgress(prev => ({ ...prev, meditationsCompleted: prev.meditationsCompleted + 1 }));
            }}
            darkMode={dm}
            onCheckAccess={checkAccess}
            defaultVoice={defaultVoice}
            setDefaultVoice={setDefaultVoice}
            audioSettings={audioSettings}
            hasUnlimitedAccess={hasUnlimitedAccess}
            initialMode="free"
            onShowUpgrade={() => openPaywallForFeature('Biblioteca completa de meditação', 'No gratuito você já tem meditações essenciais. No Pro, entram novas práticas e mais profundidade.')}
          />
        )}
        {(activeTab === 'stats' || activeTab === 'badges') && (
          <>
            <PreventiveIntervention darkMode={dm} />
            <StatsSection moodHistory={moodHistory} diaryEntries={diaryEntries} userProgress={userProgress} setUserProgress={setUserProgress} darkMode={dm} onNavigate={navigateTo} />
          </>
        )}
        {activeTab === 'login' && (
          <ProfileSection
            desktopMode={desktopMode}
            account={userAccount}
            onLogout={() => {
              if (isSupabaseConfigured) {
                supabase.auth.signOut().catch(() => {});
              }
              setIsLoggedIn(false);
              setUserAccount(null);
            }}
            onSwitchAccount={() => {
              if (isSupabaseConfigured) {
                supabase.auth.signOut().catch(() => {});
              }
              setIsLoggedIn(false);
              setUserAccount(null);
            }}
            updateAccount={(updates) => setUserAccount(prev => prev ? { ...prev, ...updates } : null)}
            userProgress={userProgress}
            practiceStreak={practiceStreak}
            todayMinutes={todayMinutes}
            moodHistory={moodHistory}
            diaryEntries={diaryEntries}
            thoughtRecords={thoughtRecords}
            gratitudeEntries={gratitudeEntries}
            soltaEntries={soltaEntries}
            onNavigate={navigateTo}
            darkMode={dm}
            dailyGoal={dailyGoal}
            setDailyGoal={setDailyGoal}
            reminderSettings={reminderSettings}
            setReminderSettings={setReminderSettings}
            privacySettings={privacySettings}
            setPrivacySettings={setPrivacySettings}
            audioSettings={audioSettings}
            setAudioSettings={setAudioSettings}
            wellbeingSettings={wellbeingSettings}
            setWellbeingSettings={setWellbeingSettings}
            defaultVoice={defaultVoice as any}
            setDefaultVoice={(v) => setDefaultVoice(v as any)}
            subscriptionData={subscriptionData}
            onShowPlans={() => { setPaywallReason({ title: "Seu plano no Sereno 💎", desc: "Veja o que muda no grátis, no Pro e nos formatos de acesso." }); setShowPaywall(true); }}
            onOpenRecommendApp={() => setShowRecommendApp(true)}
            onCheckAccess={checkAccess}
            onIncrementUsage={incrementUsage}
          />
        )}
        {activeTab === 'hooponopono' && <HooponoponoSection darkMode={dm} onCheckAccess={checkAccess} defaultVoice={defaultVoice} setDefaultVoice={setDefaultVoice} audioSettings={audioSettings} />}
        {activeTab === 'lovelanguages' && <LoveLanguagesSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'therapycalendar' && (
          <TherapyCalendarSection
            darkMode={dm}
            reminderSettings={reminderSettings}
            setReminderSettings={setReminderSettings}
          />
        )}
        {activeTab === 'abordagens' && <AbordagensSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'suggestions' && <SuggestionsSection darkMode={dm} onNavigate={navigateTo} initialSource={tabParams?.suggestionSource} />}
        {activeTab === 'habits' && (
          <DailyHabitsSection
            darkMode={dm}
            habitsReqs={habitsReqs}
            setHabitsReqs={setHabitsReqs}
            habitsHistory={habitsHistory}
            setHabitsHistory={setHabitsHistory}
            onNavigate={navigateTo}
          />
        )}
        {activeTab === 'vocacional' && (
          <ExploracaoVocacionalSection
            darkMode={dm}
            initialStep={tabParams?.vocationalStep}
            onStepChange={(step) => navigateTo('vocacional', { ...tabParams, vocationalStep: step })}
            onNavigate={navigateTo}
          />
        )}
        {activeTab === 'fivefingers' && (
          <FiveFingersMethodSection
            darkMode={dm}
            initialStep={tabParams?.fiveFingersStep}
            onStepChange={(step) => navigateTo('fivefingers', { ...tabParams, fiveFingersStep: step })}
            onNavigate={navigateTo}
          />
        )}
        {activeTab === 'mixer' && <NatureMixerSection darkMode={dm} desktopMode={desktopMode} />}
        {activeTab === 'microtasks' && <MicroTasksSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'timecapsule' && <TimeCapsuleSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'missions' && <WeeklyMissionsSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'artemotion' && <ArtEmotionSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'destravar' && <SelfSabotageSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'mapavida' && <LifeWheelSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'regulation' && (
          <RegulationProfileSection 
            darkMode={dm} 
            onNavigate={navigateTo} 
            lastScore={lastScore}
            setLastScore={setLastScore}
          />
        )}
        {activeTab === 'mindmap' && <EmotionalMindMapSection darkMode={dm} moodHistory={moodHistory} onNavigate={navigateTo} />}
        {activeTab === 'healthymessages' && <HealthySelfMessages darkMode={dm} desktopMode={desktopMode} onNavigate={navigateTo} />}
        {activeTab === 'tracks' && <ThematicTracksSection darkMode={dm} onNavigate={navigateTo} isPro={hasUnlimitedAccess} onShowUpgrade={() => openPaywallForFeature('Trilhas temáticas completas', 'No gratuito você acessa as trilhas essenciais. No Pro, a biblioteca completa de trilhas fica liberada.')} />}
        {activeTab === 'emocional' && <EmotionalIntelligenceSection darkMode={dm} desktopMode={desktopMode} onNavigate={navigateTo} isPro={hasUnlimitedAccess} onShowUpgrade={() => openPaywallForFeature('Inteligência emocional completa', 'No gratuito você acessa a leitura essencial. No Pro, entram mais testes, histórico salvo e plano de 14 dias.')} />}
        {activeTab === 'psychoedu' && <PsychoeducationSection darkMode={dm} desktopMode={desktopMode} onNavigate={navigateTo} isPro={hasUnlimitedAccess} onShowUpgrade={() => openPaywallForFeature('Psicoeducação completa', 'No gratuito você acessa a base essencial. No Pro, a psicoeducação fica completa com mais temas e modos de prática.')} />}
        {activeTab === 'toxicthoughts' && <ToxicThoughtsSection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'dictionary' && <EmotionalDictionarySection darkMode={dm} onNavigate={navigateTo} />}
        {activeTab === 'couple' && <CoupleModeSection darkMode={dm} onNavigate={navigateTo} isPro={hasUnlimitedAccess} onShowUpgrade={() => openPaywallForFeature('Modo Casal avançado', 'No gratuito o Modo Casal fica no básico. No Pro, entram as camadas avançadas de conversa, apoio e histórico.')} />}
        {activeTab === 'family' && <FamilyModeSection darkMode={dm} onNavigate={navigateTo} isPro={hasUnlimitedAccess} onShowUpgrade={() => openPaywallForFeature('Modo Família avançado', 'No gratuito o Modo Família fica no básico. No Pro, entram os combinados, conversas e recursos avançados da convivência.')} />}
        {activeTab === 'invite' && <InviteFriendSection darkMode={dm} />}
        {activeTab === 'esperanca' && (
          <MuralEsperancaSection
            darkMode={dm}
            onCheckAccess={(action) => checkAccess('mural', action)}
            onIncrementUsage={(action) => incrementUsage(action === 'send' ? 'muralSend' : 'muralReceive')}
            account={userAccount}
            onNavigate={navigateTo}
          />
        )}
        {activeTab === 'carta' && <CartaTerapeuticaSection darkMode={dm} onNavigate={navigateTo} />}
      </main>

      <AppNoticeModal
        open={noticeModal.open}
        title={noticeModal.title}
        message={noticeModal.message}
        onClose={() => setNoticeModal({ open: false, title: '', message: '' })}
        darkMode={dm}
        icon="✨"
        eyebrow="Sereno"
      />

      {/* Paywall Overlay */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowPaywall(false)}></div>
          <div className={`relative w-full ${desktopMode ? 'max-w-5xl' : 'max-w-[24rem]'} max-h-[90vh] overflow-y-auto rounded-[2.2rem] shadow-2xl animate-scale-in border no-scrollbar ${dm ? 'bg-gradient-to-b from-[#111b2f] via-[#17233b] to-[#0d1626] border-cyan-900/35' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 backdrop-blur-xl'}`}>
            <div className="sticky top-0 z-20 flex justify-end px-4 pt-4">
              <button
                onClick={() => setShowPaywall(false)}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg transition-all hover:scale-[1.03] active:scale-95 ${dm ? 'border-white/10 bg-slate-950/70 text-white backdrop-blur-md' : 'border-slate-200 bg-white/95 text-slate-700 backdrop-blur-md'}`}
                title="Fechar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className={`relative flex-shrink-0 overflow-hidden px-6 pb-6 pt-5 ${dm ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_35%),linear-gradient(135deg,#5b4cf0_0%,#7c3aed_46%,#16a0b5_100%)]' : 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_36%),linear-gradient(135deg,#4f7cff_0%,#6b4df5_42%,#26b4b4_100%)]'}`}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-16 w-32 rounded-full bg-black/10 blur-2xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/75">Seu plano no Sereno</p>
                    <h2 className="mt-3 max-w-[14rem] text-[2rem] font-black leading-none tracking-tight text-white">
                      Grátis para começar.
                      <span className="block text-white/90">Pro para aprofundar.</span>
                    </h2>
                  </div>
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.6rem] bg-white/18 text-3xl backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    ✦
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-2">
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">Plano atual</p>
                    <p className="mt-1 text-sm font-black text-white">{currentPlanLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 text-center pt-6">
              <h3 className={`text-xl font-black mb-2 tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>{paywallReason?.title || 'Veja onde o Pro abre mais espaço para você.'}</h3>
              <p className={`text-sm mb-4 leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-500'}`}>
                {paywallReason?.desc || 'Os recursos essenciais continuam no grátis. O Pro entra quando você quiser mais profundidade, menos limites e mais cuidado guiado.'}
              </p>

              <div className={`relative overflow-hidden rounded-3xl border p-4 mb-5 text-left ${dm ? 'bg-white/5 border-white/10' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200'}`}>
                <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.14)_45%,transparent_100%)] blur-2xl animate-[serenoShimmer_4.8s_ease-in-out_infinite]" />
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${dm ? 'text-cyan-300' : 'text-cyan-700'}`}>4 destaques do Pro</p>
                <div className="relative mt-3 grid grid-cols-2 gap-2">
                  {[
                    'Chat ilimitado',
                    'Trilhas e psicoeducação completas',
                    'Práticas premium exclusivas',
                    'Personalização e inteligência adaptativa',
                  ].map((item) => (
                    <div key={item} className={`rounded-2xl px-3 py-3 text-sm font-black text-center border ${dm ? 'bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-fuchsia-500/15 border-indigo-400/25 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
                      {item}
                    </div>
                  ))}
                </div>
                <p className={`relative mt-3 text-xs leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>E muito mais...</p>
              </div>

              <div className="mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-3xl border p-4 text-left ${dm ? 'bg-white/5 border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
                    <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-cyan-300' : 'text-cyan-700'}`}>Grátis para começar</p>
                    <p className="mt-2 text-[15px] font-black leading-snug">O essencial para começar seu cuidado.</p>
                    <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Humor, diário, SOS, respiração básica, meditação básica e os recursos centrais do app.</p>
                  </div>
                  <div className={`rounded-3xl border p-4 text-left ${dm ? 'bg-fuchsia-500/10 border-fuchsia-400/20 text-slate-100' : 'bg-fuchsia-50/80 border-fuchsia-200 text-slate-800 shadow-sm'}`}>
                    <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Pro para aprofundar</p>
                    <p className="mt-2 text-[15px] font-black leading-snug">Mais profundidade para ir além do básico.</p>
                    <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Sem limites, bibliotecas completas, modos avançados e práticas premium liberadas.</p>
                  </div>
                </div>
              </div>

              <div className={`mb-5 rounded-3xl border p-5 text-left shadow-sm ${dm ? 'border-indigo-400/25 bg-[linear-gradient(180deg,rgba(99,102,241,0.12)_0%,rgba(15,23,42,0.26)_100%)] text-slate-100' : 'border-indigo-200 bg-[linear-gradient(180deg,#eef2ff_0%,#ffffff_100%)] text-slate-800'}`}>
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-200' : 'text-indigo-700'}`}>Para começar no seu ritmo</p>
                <h4 className={`mt-2 text-lg font-black tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>Escolha entre anual e mensal.</h4>
                <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>E ajuste depois se quiser.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => startPlanCheckout('pro_individual_annual')}
                    disabled={checkoutLoadingPlan === 'pro_individual_annual'}
                    className={`rounded-[1.35rem] border px-4 py-4 text-left transition-all active:scale-[0.98] ${dm ? 'border-indigo-400/30 bg-indigo-500/20 text-white shadow-lg shadow-indigo-950/30' : 'border-indigo-200 bg-white text-slate-900 shadow-sm'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-black">Individual anual</span>
                      <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-950">Mais popular</span>
                    </div>
                    <p className={`mt-2 text-lg font-black tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>{PLAN_PRICE_COPY.pro_individual_annual?.primary}</p>
                    <p className={`mt-1 text-[11px] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{PLAN_PRICE_COPY.pro_individual_annual?.secondary}</p>
                    <p className={`mt-2 text-xs leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{checkoutLoadingPlan === 'pro_individual_annual' ? 'Abrindo checkout...' : 'Melhor valor para continuar com constância.'}</p>
                  </button>
                  <button
                    onClick={() => startPlanCheckout('pro_individual_monthly')}
                    disabled={checkoutLoadingPlan === 'pro_individual_monthly'}
                    className={`rounded-[1.35rem] border px-4 py-4 text-left transition-all active:scale-[0.98] ${dm ? 'border-slate-700 bg-slate-900/70 text-slate-100' : 'border-slate-200 bg-white text-slate-800 shadow-sm'}`}
                  >
                    <span className="text-[15px] font-black">Individual mensal</span>
                    <p className={`mt-2 text-lg font-black tracking-tight ${dm ? 'text-white' : 'text-slate-900'}`}>{PLAN_PRICE_COPY.pro_individual_monthly?.primary}</p>
                    <p className={`mt-2 text-xs leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{checkoutLoadingPlan === 'pro_individual_monthly' ? 'Abrindo checkout...' : 'Mais flexível para entrar agora.'}</p>
                  </button>
                </div>
              </div>

              <PlansComparison darkMode={dm} />

              <div className={`rounded-3xl border p-5 text-left ${dm ? 'bg-white/5 border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>Escolha seu formato de acesso</p>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      id: 'individual',
                      label: 'Pro Individual',
                      people: '1 pessoa',
                      desc: 'Para viver o app por completo no seu ritmo.',
                      options: [
                        { key: 'pro_individual_annual' as BillingPlanKey, label: 'Anual', badge: 'Mais popular', helper: 'Melhor valor para seguir com constância.' },
                        { key: 'pro_individual_monthly' as BillingPlanKey, label: 'Mensal', helper: 'Mais leve para começar agora.' },
                      ],
                    },
                    {
                      id: 'casal',
                      label: 'Pro Casal',
                      people: '2 pessoas',
                      desc: 'Para duas pessoas cuidarem melhor da relação e de si.',
                      options: [
                        { key: 'pro_casal_annual' as BillingPlanKey, label: 'Anual', helper: 'Melhor custo por pessoa para seguir em dupla.' },
                        { key: 'pro_casal_monthly' as BillingPlanKey, label: 'Mensal', helper: 'Mais simples para começar juntos.' },
                      ],
                    },
                    {
                      id: 'familia',
                      label: 'Pro Família',
                      people: 'até 6 pessoas',
                      desc: 'Para a casa inteira ter mais apoio, organização e cuidado.',
                      options: [
                        { key: 'pro_familia_annual' as BillingPlanKey, label: 'Anual', helper: 'Melhor valor para famílias que vão usar com frequência.' },
                        { key: 'pro_familia_monthly' as BillingPlanKey, label: 'Mensal', helper: 'Mais flexível para testar primeiro.' },
                      ],
                    },
                    {
                      id: 'amigos',
                      label: 'Pro Amigos',
                      people: 'até 5 pessoas',
                      desc: 'Para compartilhar o Pro com sua turma querida.',
                      options: [
                        { key: 'pro_amigos_annual' as BillingPlanKey, label: 'Anual', helper: 'Melhor custo para manter o grupo junto.' },
                        { key: 'pro_amigos_monthly' as BillingPlanKey, label: 'Mensal', helper: 'Mais fácil para experimentar antes.' },
                      ],
                    },
                  ].map((plan) => {
                    const expanded = expandedPaywallCard === plan.id;
                    return (
                      <div key={plan.id} className={`rounded-3xl border overflow-hidden transition-all ${expanded ? (dm ? 'border-indigo-400/40 bg-indigo-500/10' : 'border-indigo-300 bg-indigo-50/70 shadow-sm') : (dm ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]')}`}>
                        <button
                          onClick={() => setExpandedPaywallCard((prev) => prev === plan.id ? null : plan.id)}
                          className="w-full p-5 text-left flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-black tracking-tight">{plan.label}</p>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${dm ? 'bg-cyan-400/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>{plan.people}</span>
                            </div>
                            <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{plan.desc}</p>
                          </div>
                          <span className={`mt-1 text-xs font-black transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {expanded && (
                          <div className={`px-4 pb-4 border-t ${dm ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="pt-3 grid grid-cols-2 gap-2">
                              {plan.options.map((option) => (
                                <button
                                  key={option.key}
                                  onClick={() => startPlanCheckout(option.key)}
                                  disabled={checkoutLoadingPlan === option.key}
                                  className={`rounded-[1.35rem] p-4 text-left border transition-all active:scale-[0.98] ${option.label === 'Anual'
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                                    : (dm ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-700')}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[15px] font-black">{option.label}</span>
                                    {option.badge && (
                                      <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-950">
                                        {option.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`mt-2 text-lg font-black tracking-tight ${option.label === 'Anual' ? 'text-white' : (dm ? 'text-slate-100' : 'text-slate-900')}`}>
                                    {PLAN_PRICE_COPY[option.key]?.primary}
                                  </p>
                                  {PLAN_PRICE_COPY[option.key]?.secondary && (
                                    <p className={`mt-1 text-[11px] ${option.label === 'Anual' ? 'text-white/75' : (dm ? 'text-slate-400' : 'text-slate-500')}`}>
                                      {PLAN_PRICE_COPY[option.key]?.secondary}
                                    </p>
                                  )}
                                  <p className={`mt-2 text-xs leading-relaxed ${option.label === 'Anual' ? 'text-white/80' : (dm ? 'text-slate-400' : 'text-slate-500')}`}>
                                    {checkoutLoadingPlan === option.key ? 'Abrindo checkout...' : option.helper}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`mt-5 rounded-3xl border p-5 text-left ${dm ? 'bg-white/5 border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Pro Empresa</p>
                <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Para levar o mesmo cuidado premium a seus colaboradores.</p>
                <div className="mt-4 space-y-3">
                  {[
                    { id: 'empresa-pequena', label: 'Pro Empresa Pequena', people: 'até 10 pessoas', monthly: 'pro_empresa_pequena_mensal' as BillingPlanKey, annual: 'pro_empresa_pequena_anual' as BillingPlanKey },
                    { id: 'empresa-media', label: 'Pro Empresa Média', people: 'até 25 pessoas', monthly: 'pro_empresa_media_mensal' as BillingPlanKey, annual: 'pro_empresa_media_anual' as BillingPlanKey },
                    { id: 'empresa-grande', label: 'Pro Empresa Grande', people: 'até 50 pessoas', monthly: 'pro_empresa_grande_mensal' as BillingPlanKey, annual: 'pro_empresa_grande_anual' as BillingPlanKey, annualBadge: 'Mais escolhido' },
                  ].map((plan) => {
                    const expanded = expandedPaywallCard === plan.id;
                    return (
                      <div key={plan.id} className={`rounded-3xl border overflow-hidden ${expanded ? (dm ? 'border-fuchsia-400/40 bg-fuchsia-500/10' : 'border-fuchsia-300 bg-fuchsia-50/70') : (dm ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]')}`}>
                        <button onClick={() => setExpandedPaywallCard((prev) => prev === plan.id ? null : plan.id)} className="w-full p-5 text-left flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-black tracking-tight">{plan.label}</p>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${dm ? 'bg-fuchsia-400/10 text-fuchsia-300' : 'bg-fuchsia-50 text-fuchsia-700'}`}>{plan.people}</span>
                            </div>
                            <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{plan.id === 'empresa-pequena' ? 'Para times pequenos que querem apoiar melhor a rotina e o bem-estar.' : plan.id === 'empresa-media' ? 'Para equipes em crescimento que precisam de cuidado consistente no dia a dia.' : 'Para estruturas maiores que querem ampliar cuidado, presença e constância.'}</p>
                          </div>
                          <span className={`text-xs font-black transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        {expanded && (
                          <div className={`px-4 pb-4 border-t ${dm ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="pt-3 grid grid-cols-2 gap-2">
                              <button
                                onClick={() => startPlanCheckout(plan.annual)}
                                disabled={checkoutLoadingPlan === plan.annual}
                                className="rounded-[1.35rem] p-4 text-left border bg-fuchsia-600 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/25 transition-all active:scale-[0.98]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[15px] font-black">Anual</p>
                                  {plan.annualBadge && (
                                    <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-950">
                                      {plan.annualBadge}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-lg font-black tracking-tight">{PLAN_PRICE_COPY[plan.annual]?.primary}</p>
                                {PLAN_PRICE_COPY[plan.annual]?.secondary && (
                                  <p className="mt-1 text-[11px] text-white/75">{PLAN_PRICE_COPY[plan.annual]?.secondary}</p>
                                )}
                                <p className="mt-2 text-xs text-white/80">{checkoutLoadingPlan === plan.annual ? 'Abrindo checkout...' : 'Melhor valor para equipes com uso contínuo.'}</p>
                              </button>
                              <button
                                onClick={() => startPlanCheckout(plan.monthly)}
                                disabled={checkoutLoadingPlan === plan.monthly}
                                className={`rounded-[1.35rem] p-4 text-left border transition-all active:scale-[0.98] ${dm ? 'bg-slate-900/70 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-700'}`}
                              >
                                <p className="text-[15px] font-black">Mensal</p>
                                <p className={`mt-2 text-lg font-black tracking-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{PLAN_PRICE_COPY[plan.monthly]?.primary}</p>
                                <p className={`mt-2 text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{checkoutLoadingPlan === plan.monthly ? 'Abrindo checkout...' : 'Mais flexível para começar em equipe.'}</p>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {lifetimeOfferState?.isActive && (
                <div className={`mt-5 rounded-3xl border p-5 text-left ${dm ? 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent border-amber-400/20 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em]">Acesso Vitalício Individual</p>
                  <p className="mt-2 text-lg font-black tracking-tight">Um único pagamento para manter seu cuidado premium para sempre.</p>
                  <p className="mt-3 text-3xl font-black tracking-tight">R$ 499</p>
                  <p className={`mt-3 text-sm leading-relaxed ${dm ? 'text-amber-200/85' : 'text-amber-800/85'}`}>Válido apenas para acesso individual. Planos em grupo e empresa continuam como modalidades do Pro.</p>
                  {lifetimeOfferState.endsAt && (
                    <p className={`mt-3 text-[12px] font-black uppercase tracking-[0.14em] ${dm ? 'text-amber-200' : 'text-amber-800'}`}>
                      Encerra em {formatRemainingTime(lifetimeOfferState.msRemaining)}
                    </p>
                  )}
                  {lifetimeOfferState.startsAt && lifetimeOfferState.endsAt && (
                    <p className={`mt-1 text-[12px] ${dm ? 'text-amber-100/80' : 'text-amber-800/80'}`}>
                      Janela ativa de {new Date(lifetimeOfferState.startsAt).toLocaleDateString('pt-BR')} até {new Date(lifetimeOfferState.endsAt).toLocaleDateString('pt-BR')}.
                    </p>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => setShowLifetimeRules((prev) => !prev)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm font-black transition-all ${dm ? 'border-amber-300/20 bg-white/5 text-amber-100' : 'border-amber-200 bg-white text-amber-900'}`}
                    >
                      {showLifetimeRules ? 'Ocultar regras da oferta' : 'Ver regras da oferta'}
                    </button>
                    {showLifetimeRules && (
                      <div className={`rounded-2xl border p-4 text-[13px] leading-relaxed ${dm ? 'border-amber-300/15 bg-black/10 text-amber-100/90' : 'border-amber-200 bg-white/80 text-amber-950'}`}>
                        <p><strong>Inclui:</strong> acesso permanente aos recursos premium atuais do app.</p>
                        <p className="mt-2"><strong>Regra:</strong> recursos futuros podem entrar parcialmente ou seguir condições próprias.</p>
                        <p className="mt-2">Depois que a campanha encerra, esta oferta deixa de ficar disponível.</p>
                      </div>
                    )}
                    <button
                      onClick={() => startPlanCheckout('vitalicio')}
                      disabled={checkoutLoadingPlan === 'vitalicio'}
                      className="w-full rounded-2xl px-4 py-3 text-sm font-black transition-all shadow-[0_0_28px_rgba(250,204,21,0.35)] bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-amber-950 border border-amber-200"
                    >
                      {checkoutLoadingPlan === 'vitalicio' ? 'Abrindo checkout...' : 'Comprar agora'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 border-t pt-4 border-dashed border-slate-700/20">
                <p className={`text-[9px] uppercase font-black tracking-[0.15em] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>
                  Os recursos essenciais continuam no grátis • Termos • Privacidade
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {(() => {
        const dynamicCandidates: Array<{ tab: Tab; label: string; score: number }> = [
          { tab: 'breathing', label: 'Respiração', score: tabUsage?.breathing || 0 },
          { tab: 'yoga', label: 'Yoga Nidra', score: tabUsage?.yoga || 0 },
          { tab: 'meditation', label: 'Meditação', score: tabUsage?.meditation || 0 },
          { tab: 'mood', label: 'Humor', score: tabUsage?.mood || 0 },
          { tab: 'sos', label: 'SOS', score: tabUsage?.sos || 0 },
          { tab: 'tracks', label: 'Trilhas', score: tabUsage?.tracks || 0 },
          { tab: 'microtasks', label: 'Vitórias', score: tabUsage?.microtasks || 0 },
          { tab: 'missions', label: 'Missões', score: tabUsage?.missions || 0 },
        ];
        return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none ${desktopMode ? 'lg:hidden' : ''}`}>
        <div className="max-w-md mx-auto px-4 pb-5 pt-2 safe-bottom">
          <nav className={`pointer-events-auto flex justify-around items-center p-2 rounded-[1.9rem] shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-2xl transition-all duration-500 ${dm ? 'bg-[#0d1828]/88 border border-cyan-900/20' : 'bg-white/88 border border-slate-200/80'}`}>
            <NavButton icon={<HomeIcon />} label="Início" active={activeTab === 'home'} onClick={goHome} dm={dm} />
            <NavButton icon={<DynamicNavIcon tab="sos" />} label="SOS" active={activeTab === 'sos'} onClick={() => navigateTo('sos')} dm={dm} />
            <NavButton
              icon={<MeditateIcon />}
              label="Biblioteca"
              active={libraryNavIsActive}
              onClick={() => navigateTo('library')}
              dm={dm}
            />
            <NavButton icon={<DiaryIcon />} label="Diário" active={activeTab === 'diary'} onClick={() => navigateTo('diary')} dm={dm} />
            <NavButton icon={<ProfileIcon />} label="Perfil" active={activeTab === 'login'} onClick={() => navigateTo('login')} dm={dm} />
          </nav>
        </div>
      </div>
        );
      })()}
      <RecommendAppModal
        open={showRecommendApp}
        darkMode={dm}
        onClose={() => setShowRecommendApp(false)}
      />

      {showHomeCustomization && (
        <div className="fixed inset-0 z-[150] bg-black/60 p-4 flex items-center justify-center animate-fade-in" onClick={() => setShowHomeCustomization(false)}>
           <div className={`w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl ${dm ? 'bg-[radial-gradient(circle_at_top,#1a3147_0%,transparent_42%),linear-gradient(180deg,#0f1828_0%,#132136_100%)] border border-cyan-900/30 text-slate-100' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-black ${dm ? 'text-white' : 'text-slate-900'}`}>Personalizar Home</h3>
                <button onClick={() => setShowHomeCustomization(false)} className="text-xl">×</button>
              </div>
              <p className={`text-sm mb-6 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Edite os atalhos e o visual do painel da home conforme sua preferência.</p>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                 <p className="text-xs opacity-70">Use os controles da própria Home para destacar, fixar ou reorganizar o que você mais usa.</p>
              </div>
              <button onClick={() => setShowHomeCustomization(false)} className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold active:scale-95 transition-all">Concluir</button>
           </div>
        </div>
      )}

      {desktopMode && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (min-width: 1024px) {
                .sereno-desktop-shell aside::-webkit-scrollbar,
                .sereno-desktop-shell main::-webkit-scrollbar {
                  width: 12px;
                }
                .sereno-desktop-shell aside::-webkit-scrollbar-track,
                .sereno-desktop-shell main::-webkit-scrollbar-track {
                  background: transparent;
                }
                .sereno-desktop-shell aside::-webkit-scrollbar-thumb,
                .sereno-desktop-shell main::-webkit-scrollbar-thumb {
                  background: ${dm ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)'};
                  border-radius: 999px;
                  border: 3px solid transparent;
                  background-clip: content-box;
                }
                .sereno-desktop-shell aside,
                .sereno-desktop-shell main {
                  scrollbar-width: thin;
                  scrollbar-color: ${dm ? 'rgba(148, 163, 184, 0.35) transparent' : 'rgba(100, 116, 139, 0.35) transparent'};
                }
                .sereno-desktop-shell main .max-w-sm { max-width: 32rem !important; }
                .sereno-desktop-shell main .max-w-md { max-width: 42rem !important; }
                .sereno-desktop-shell main .max-w-lg { max-width: 56rem !important; }
                .sereno-desktop-shell main .max-w-xl { max-width: 68rem !important; }
                .sereno-desktop-shell main .max-w-2xl { max-width: 76rem !important; }
                .sereno-desktop-shell main .max-w-3xl { max-width: 84rem !important; }
                .sereno-desktop-shell main .max-w-4xl { max-width: 92rem !important; }
                .sereno-desktop-shell main .p-4.pb-24.max-w-lg.mx-auto,
                .sereno-desktop-shell main .p-4.pb-32.max-w-lg.mx-auto,
                .sereno-desktop-shell main .p-4.animate-fade-in.pb-24.max-w-lg.mx-auto,
                .sereno-desktop-shell main .p-4.animate-fade-in.pb-32.max-w-lg.mx-auto {
                  padding-left: 1.75rem !important;
                  padding-right: 1.75rem !important;
                }
              }
            `,
          }}
        />
      )}
    </div>
  );
}

// Quick Action Button for prominent features
function QuickActionButton({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all hover:brightness-110`}
      title={label}
    >
      {icon}
    </button>
  );
}

// Navigation Button Component
function NavButton({ icon, label, active, onClick, dm, hasUnlimitedAccess }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; dm?: boolean; hasUnlimitedAccess?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center min-w-[66px] min-h-[60px] px-2.5 rounded-[1.15rem] transition-all duration-300 active:scale-95 overflow-hidden ${active
        ? (dm ? 'text-cyan-200' : 'text-slate-900')
        : (dm ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700')
        }`}
    >
      <div
        className={`absolute inset-0 transition-all duration-300 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${dm ? 'bg-gradient-to-b from-cyan-400/16 to-indigo-400/10 border border-cyan-300/10' : 'bg-slate-100 border border-slate-200/80'}`}
      />
      {hasUnlimitedAccess && (
        <div className="absolute top-1 right-1 z-20">
          <SparklePremiumIcon className="w-2.5 h-2.5 text-indigo-400" />
        </div>
      )}
      <div className={`relative z-10 scale-110 transition-transform duration-300 ${active ? '-translate-y-0.5 scale-[1.16]' : ''}`}>
        {icon}
      </div>
      <span className={`relative z-10 mt-1.5 text-[11px] font-bold leading-none transition-all duration-300 ${active ? 'opacity-100' : 'opacity-90'}`}>{label}</span>
      {active && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full ${dm ? 'bg-cyan-300/90' : 'bg-slate-900/90'}`} />}
    </button>
  );
}

function DesktopNavButton({ icon, label, active, onClick, dm }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; dm?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[1.35rem] px-4 py-3 text-left transition-all duration-300 active:scale-[0.99] ${
        active
          ? (dm ? 'bg-cyan-400/12 text-cyan-200 border border-cyan-300/12' : 'bg-slate-100 text-slate-900 border border-slate-200')
          : (dm ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100/90')
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? (dm ? 'bg-cyan-300/10' : 'bg-white') : (dm ? 'bg-white/5' : 'bg-white/80')}`}>
        {icon}
      </span>
      <span className="text-sm font-black">{label}</span>
    </button>
  );
}

function LibraryHubSection({
  darkMode,
  hasUnlimitedAccess,
  librarySearch,
  setLibrarySearch,
  autoCompleteSuggestions,
  features,
  searchResults,
  categoryGroups,
  forceAllCategoriesOpen,
  setForceAllCategoriesOpen,
  openCategories,
  setOpenCategories,
  safeFavoriteTabs,
  favoriteLimitCardId,
  setFavoriteLimitCardId,
  toggleFavorite,
  openLibraryFeature,
  lockedLibraryPreview,
  setLockedLibraryPreview,
  toneClass,
  onShowPlans,
  desktopMode,
}: any) {
  const allCategoriesExpanded =
    categoryGroups.length > 0 && categoryGroups.every((group: any) => !!openCategories[group.name]);
  const smartIntentChips = [
    'Estou travado',
    'Quero me acalmar',
    'Quero dormir melhor',
    'Preciso escrever',
    'Quero me organizar',
  ];
  const normalizedLibrarySearch = String(librarySearch || '').toLowerCase().trim();
  const smartSuggestionRules = [
    { keywords: ['travado', 'travada', 'paralisado', 'paralisada', 'sem sair do lugar'], tab: 'microtasks', title: 'Micro-tarefas', reason: 'Para destravar com um passo curto e possível.' },
    { keywords: ['acalmar', 'ansioso', 'ansiosa', 'ansiedade', 'panic', 'sobrecarrega', 'sobrecarga'], tab: 'breathing', title: 'Respiração', reason: 'Para baixar a ativação mais rápido.' },
    { keywords: ['sos', 'crise', 'desespero', 'desesperado', 'desesperada'], tab: 'sos', title: 'SOS Ansiedade', reason: 'Para apoio imediato no momento de pico.' },
    { keywords: ['dormir', 'sono', 'insônia', 'insonia', 'noite'], tab: 'sleep', title: 'Modo Sono', reason: 'Para desacelerar e entrar em clima de descanso.' },
    { keywords: ['escrever', 'desabafar', 'botar pra fora', 'organizar pensamentos'], tab: 'solta', title: 'Solta Aqui', reason: 'Para descarregar e clarear o que está pesando.' },
    { keywords: ['diário', 'diario', 'rpd', 'refletir'], tab: 'diary', title: 'Diário (RPD)', reason: 'Para entender melhor o que aconteceu e o que fazer com isso.' },
    { keywords: ['meditar', 'meditação', 'meditacao', 'presença', 'presenca'], tab: 'meditation', title: 'Meditação', reason: 'Para presença guiada e mais espaço interno.' },
    { keywords: ['som', 'sons', 'ambiente', 'concentrar', 'focar'], tab: 'mixer', title: 'Mixer Sonoro', reason: 'Para montar um ambiente que combine com o momento.' },
    { keywords: ['humor', 'emoção', 'emocao', 'sentindo'], tab: 'mood', title: 'Diário de Humor', reason: 'Para registrar o estado atual e receber direção.' },
    { keywords: ['organizar', 'rotina', 'constância', 'consistencia'], tab: 'habits', title: 'Meus Hábitos', reason: 'Para retomar consistência sem complicar.' },
  ];
  const smartSuggestion = useMemo(() => {
    if (!normalizedLibrarySearch) return null;
    const matchedRule = smartSuggestionRules.find((rule) => rule.keywords.some((keyword) => normalizedLibrarySearch.includes(keyword)));
    if (matchedRule) {
      const matchedFeature = features.find((feature: any) => String(feature.tab) === matchedRule.tab || feature.title === matchedRule.title);
      if (matchedFeature) {
        return { ...matchedFeature, reason: matchedRule.reason };
      }
    }
    if (searchResults.length === 1) {
      return {
        ...searchResults[0],
        reason: 'Esse recurso parece ser o mais próximo do que você descreveu.',
      };
    }
    return null;
  }, [features, normalizedLibrarySearch, searchResults]);

  const setAllCategoriesOpen = (nextOpen: boolean) => {
    setForceAllCategoriesOpen(nextOpen);
    setOpenCategories(
      Object.fromEntries(categoryGroups.map((group: any) => [group.name, nextOpen])) as Record<string, boolean>,
    );
  };


  const toggleSingleCategory = (key: string) => {
    setForceAllCategoriesOpen(null);
    setOpenCategories((prev: Record<string, boolean>) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderCard = (f: any, keyPrefix = '') => {
    return (
      <div
        key={`${keyPrefix}${f.title}`}
        onClick={(e) => openLibraryFeature(f, e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLibraryFeature(f, e.currentTarget as HTMLElement);
          }
        }}
        role="button"
        tabIndex={0}
        data-card-glyph={f.icon}
        data-allow-overflow="true"
        className={`sereno-ornament-card group relative rounded-[1.6rem] text-left border overflow-visible shadow-sm transition-all duration-300 ${
          darkMode
            ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(10,15,24,0.94)_100%)] border-white/6'
            : 'bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] border-slate-200 hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
        }`}
      >
        <div className="w-full p-4 min-h-[132px] flex flex-col justify-between text-left">
          <div className="relative flex items-start gap-2">
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[24px] leading-none transition-all ${darkMode ? 'bg-white/6 border border-white/6' : 'bg-slate-50 border border-slate-200/80 group-hover:bg-white'}`}>{f.icon}</span>
          </div>
          <div className="text-left mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-[14px] font-black leading-tight tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{f.title}</p>
              {f.hasUnlimitedAccess ? (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-400/20' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'}`}>
                  {f.previewMode === 'inline' ? 'Expande no Pro' : 'Exclusivo Pro'}
                </span>
              ) : null}
            </div>
            <p className={`text-[12px] mt-1.5 leading-relaxed ${darkMode ? 'text-slate-300/80' : 'text-slate-500'}`}>{f.desc}</p>
          </div>
          {lockedLibraryPreview?.key === String(f.tab) && (
            <div
              className={`absolute z-30 w-[17.25rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border p-5 shadow-[0_22px_55px_rgba(15,23,42,0.28)] top-full mt-2 ${
                lockedLibraryPreview.alignX === 'right' ? 'right-0' : 'left-0'
              } ${
                darkMode
                  ? 'bg-[linear-gradient(180deg,rgba(22,14,40,0.98)_0%,rgba(12,11,28,0.99)_100%)] border-fuchsia-500/20 text-slate-100'
                  : 'bg-[linear-gradient(180deg,#fff7fe_0%,#ffffff_100%)] border-fuchsia-200 text-slate-800'
              }`}
            >
              <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.14),transparent_32%)]' : 'bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.12),transparent_34%)]'}`} />
              <div className="relative flex items-start gap-4 pr-12">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border text-[28px] ${darkMode ? 'bg-white/8 border-white/10' : 'bg-white border-fuchsia-100 shadow-sm'}`}>
                    {lockedLibraryPreview.icon || '💎'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-[0.76rem] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-fuchsia-300' : 'text-fuchsia-600'}`}>Exclusivo no Pro</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/20' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'}`}>
                        Veja antes de desbloquear
                      </span>
                    </div>
                    <h3 className={`mt-2 text-[1.3rem] font-black leading-tight tracking-[-0.03em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {lockedLibraryPreview.title}
                    </h3>
                    <p className={`mt-2 text-[14px] font-semibold leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      {lockedLibraryPreview.desc || 'Esse recurso faz parte da camada Pro do Sereno.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLockedLibraryPreview(null);
                  }}
                  aria-label="Fechar prévia premium"
                  className={`absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-[18px] font-black ${darkMode ? 'bg-white/6 text-slate-200 border-white/10' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}
                >
                  ×
                </button>
              </div>
              {lockedLibraryPreview.highlights?.length ? (
                <div className="relative mt-4 grid gap-2.5">
                  {lockedLibraryPreview.highlights.map((item: string) => (
                    <div
                      key={item}
                      className={`flex items-start gap-2 rounded-2xl border px-3.5 py-3 text-[12px] font-semibold leading-relaxed ${
                        darkMode
                          ? 'bg-white/5 border-white/8 text-slate-200'
                          : 'bg-white/80 border-fuchsia-100 text-slate-700'
                      }`}
                    >
                      <span className={`${darkMode ? 'text-fuchsia-300' : 'text-fuchsia-600'}`}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="relative mt-4 flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowPlans({
                      title: lockedLibraryPreview.title,
                      desc: `Desbloqueie ${lockedLibraryPreview.title} e os outros recursos completos do Sereno Pro.`,
                      focus: 'comparison',
                    });
                    setLockedLibraryPreview(null);
                  }}
                  className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 text-[14px] font-black ${darkMode ? 'bg-fuchsia-500 text-white shadow-[0_12px_24px_rgba(217,70,239,0.28)]' : 'bg-fuchsia-600 text-white shadow-[0_12px_24px_rgba(192,38,211,0.22)]'}`}
                >
                  Desbloquear no Pro
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLockedLibraryPreview(null);
                  }}
                  className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 text-[14px] font-black ${darkMode ? 'bg-white/6 text-slate-200 border border-white/10' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                >
                  Depois eu vejo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const favoriteFeatures = safeFavoriteTabs
    .map((id: string) => features.find((item: any) => String(item.tab) === id))
    .filter(Boolean)
    .slice(0, 4);
  const favoriteTitleSet = new Set(favoriteFeatures.map((item: any) => item.title));
  const entryBaseTitles = ['Respiração', 'Meditação', 'Diário (RPD)', 'Gratidão'];
  const entryFallbackTitles = ['SOS Ansiedade', 'Time Livre', 'Diário de Humor', 'Solta Aqui', 'Meus Hábitos'];
  const entryFeatures = [
    ...entryBaseTitles.filter((title) => !favoriteTitleSet.has(title)),
    ...entryFallbackTitles.filter((title) => !favoriteTitleSet.has(title)),
  ]
    .map((title) => features.find((item: any) => item.title === title))
    .filter(Boolean)
    .slice(0, 4);
  const premiumBaseTitles = ['Yoga Nidra', "Ho'oponopono", 'Método dos 5 Dedos', 'Exploração Vocacional'];
  const premiumFallbackTitles = ['Linguagens do Amor', 'Trilhas Temáticas', 'Psicoeducação', 'Inteligência Emocional', 'Modo Casal', 'Modo Família'];
  const premiumPreviewFeatures = [
    ...premiumBaseTitles.filter((title) => !favoriteTitleSet.has(title)),
    ...premiumFallbackTitles.filter((title) => !favoriteTitleSet.has(title)),
  ]
    .map((title) => features.find((item: any) => item.title === title))
    .filter(Boolean)
    .slice(0, 4);
  const relationshipBaseTitles = ['Modo Casal', 'Modo Família', 'Método dos 5 Dedos', 'O Poder do NÃO'];
  const relationshipFallbackTitles = ['Linguagens do Amor', 'Carta Terapêutica', 'Inteligência Emocional', 'Solta Aqui', 'Diário (RPD)'];
  const relationshipFeatures = [
    ...relationshipBaseTitles.filter((title) => !favoriteTitleSet.has(title)),
    ...relationshipFallbackTitles.filter((title) => !favoriteTitleSet.has(title)),
  ]
    .map((title) => features.find((item: any) => item.title === title))
    .filter(Boolean)
    .slice(0, 4);
  const dynamicSections = [
    {
      id: 'favorites',
      eyebrow: 'Seus favoritos',
      title: favoriteFeatures.length ? 'O que você já escolheu deixar por perto' : 'Monte sua estante pessoal',
      desc: favoriteFeatures.length ? '' : 'Favorite até 4 recursos para deixar seu cuidado mais fluido.',
      features: favoriteFeatures.length ? favoriteFeatures : entryFeatures,
      tone: darkMode ? 'bg-[linear-gradient(180deg,#17172b_0%,#101626_100%)] border-fuchsia-500/15' : 'bg-[linear-gradient(180deg,#fff8ff_0%,#ffffff_100%)] border-fuchsia-200',
    },
    {
      id: 'entry',
      eyebrow: 'Para começar agora',
      title: 'Portas de entrada leves e completas',
      desc: 'Essas são ótimas para regular, registrar ou se acolher sem complicar.',
      features: entryFeatures,
      tone: darkMode ? 'bg-[linear-gradient(180deg,#132034_0%,#101726_100%)] border-cyan-500/15' : 'bg-[linear-gradient(180deg,#f4fbff_0%,#ffffff_100%)] border-cyan-200',
    },
    {
      id: 'premium',
      eyebrow: hasUnlimitedAccess ? 'Camada premium ativa' : 'Para aprofundar',
      title: hasUnlimitedAccess ? 'Recursos premium para ir mais fundo' : 'Prévia do que expande no Pro',
      desc: hasUnlimitedAccess ? 'Aqui ficam algumas das experiências mais especiais que já estão liberadas para você.' : 'Veja o tipo de experiência que fica liberada quando você decide ir além do básico.',
      features: premiumPreviewFeatures,
      tone: darkMode ? 'bg-[linear-gradient(180deg,#261537_0%,#121220_100%)] border-fuchsia-500/15' : 'bg-[linear-gradient(180deg,#fff5ff_0%,#ffffff_100%)] border-fuchsia-200',
    },
    {
      id: 'relations',
      eyebrow: 'Vínculos e comunicação',
      title: 'Cuidado com você e com suas relações',
      desc: '',
      features: relationshipFeatures,
      tone: darkMode ? 'bg-[linear-gradient(180deg,#241824_0%,#12131a_100%)] border-pink-500/15' : 'bg-[linear-gradient(180deg,#fff7fb_0%,#ffffff_100%)] border-pink-200',
    },
  ].filter((section) => section.features.length > 0);

  return (
    <div className={`space-y-5 px-4 pt-5 pb-28 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : ''}`}>
      <section className={`overflow-hidden rounded-[2.2rem] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
        darkMode
          ? 'bg-[radial-gradient(circle_at_top_right,#16253a_0%,transparent_42%),linear-gradient(180deg,#0f1828_0%,#121b2c_100%)] border-cyan-900/20 text-slate-100'
          : 'bg-[radial-gradient(circle_at_top_right,#dbeafe_0%,transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-900'
      }`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>Biblioteca</p>
        <h1 className={`mt-2 text-[2rem] font-black leading-none tracking-[-0.05em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Seu hub de cuidado</h1>
        <p className={`mt-3 max-w-[28rem] text-[14px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Explore práticas, escrita terapêutica, autoconhecimento, relacionamento e recursos guiados em um só lugar.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex-1">
          <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Busca inteligente</p>
          <div className={`mt-3 flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 ${darkMode ? 'bg-white/6 border-white/8' : 'bg-white/85 border-slate-200 shadow-sm'}`}>
            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>⌕</span>
            <input
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="O que você precisa agora?"
              className={`w-full bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {smartIntentChips.map((chip) => (
              <button
                key={chip}
                onClick={() => setLibrarySearch(chip)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${darkMode ? 'bg-white/6 text-slate-200 border border-white/8' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
              >
                {chip}
              </button>
            ))}
          </div>
          {autoCompleteSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {autoCompleteSuggestions.map((suggestion: string) => (
                <button
                  key={suggestion}
                  onClick={() => setLibrarySearch(suggestion)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${darkMode ? 'bg-white/6 text-slate-200 border border-white/8' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            )}
        </div>

        {smartSuggestion ? (
          <button
            type="button"
            onClick={(e) => openLibraryFeature(smartSuggestion, e.currentTarget)}
            className={`w-full rounded-[1.65rem] border p-4 text-left transition-all active:scale-[0.99] ${darkMode ? 'bg-[linear-gradient(180deg,#172033_0%,#111827_100%)] border-cyan-500/18 text-slate-100' : 'bg-[linear-gradient(180deg,#f5fbff_0%,#ffffff_100%)] border-cyan-200 text-slate-800 shadow-sm'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[24px] ${darkMode ? 'bg-white/6 border border-white/8' : 'bg-white border border-slate-200'}`}>
                  {smartSuggestion.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-cyan-200/80' : 'text-cyan-700/80'}`}>Sugestão inteligente</p>
                  <p className={`mt-1 text-[1rem] font-black leading-tight tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{smartSuggestion.title}</p>
                  <p className={`mt-2 text-[12px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{smartSuggestion.reason}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-cyan-500/12 text-cyan-200 border border-cyan-400/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                Abrir
              </span>
            </div>
          </button>
        ) : null}

        {librarySearch ? (
          <div className="grid grid-cols-2 gap-3">
            {searchResults.length > 0 ? (
              searchResults.map((f: any) => renderCard(f, 'search-'))
            ) : (
              <div className={`col-span-2 rounded-[1.6rem] border p-5 text-sm ${darkMode ? 'bg-white/6 border-white/8 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                Nenhum recurso próximo foi encontrado para essa busca.
              </div>
            )}
          </div>
        ) : (
          <>
            {dynamicSections.map((section) => (
              <section
                key={section.id}
                className={`overflow-visible rounded-[2.05rem] border p-5 shadow-[0_14px_30px_rgba(15,23,42,0.09)] ${section.tone}`}
              >
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{section.eyebrow}</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <h2 className={`text-[1.45rem] font-black leading-tight tracking-[-0.04em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{section.title}</h2>
                    <p className={`mt-2 text-[13px] leading-relaxed ${darkMode ? 'text-slate-300/85' : 'text-slate-600'}`}>{section.desc}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {section.features.map((f: any) => renderCard(f, `${section.id}-`))}
                </div>
              </section>
            ))}

          </>
        )}
      </section>
    </div>
  );
}

// ==================== HOME SECTION ====================
interface HomeSectionProps {
  onNavigate: (tab: Tab, params?: Record<string, any>) => void;
  onShowPlans: (options?: { title?: string; desc?: string; focus?: string }) => void;
  moodHistory: MoodEntry[];
  userProgress: UserProgress;
  practiceStreak: number;
  practiceSequenceCycleDays: number;
  mostUsedTab: string | null;
  todayMinutes: number;
  darkMode?: boolean;
  userName?: string;
  hideStreaks?: boolean;
  diaryEntries: EmotionEntry[];
  soltaEntries: SoltaEntry[];
  dailyGoal: number;
  userAccount: UserAccount | null;
  healthyMessages: { id: string; text: string; createdAt: string }[];
  hasUnlimitedAccess: boolean;
  libraryOnly?: boolean;
  desktopMode?: boolean;
}

type ContinueState = {
  lastTab: string | null;
  lastParams: Record<string, any> | null;
  mostUsedTab: string | null;
  pinnedTab: string | null;
};

type HomeInboxItem = {
  id: string;
  kind: 'aviso' | 'lembrete' | 'mensagem';
  title: string;
  body: string;
  createdAt: string;
  seen: boolean;
  actionTab?: Tab | 'plans';
  actionParams?: Record<string, any>;
  linkUrl?: string;
  source?: 'app' | 'broadcast' | 'lifetime';
};

function HomeSection({
  onNavigate,
  onShowPlans,
  moodHistory,
  userProgress,
  practiceStreak,
  practiceSequenceCycleDays,
  mostUsedTab,
  todayMinutes,
  darkMode,
  userName,
  hideStreaks,
  diaryEntries,
  soltaEntries,
  dailyGoal,
  userAccount,
  healthyMessages,
  hasUnlimitedAccess,
  libraryOnly = false,
  desktopMode = false,
}: HomeSectionProps) {
  const normalizeSearchText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const levenshteinDistance = (a: string, b: string) => {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
    for (let j = 0; j < cols; j += 1) matrix[0][j] = j;
    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const fuzzyMatch = (query: string, ...candidates: string[]) => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;
    return candidates.some((candidate) => {
      const normalizedCandidate = normalizeSearchText(candidate);
      if (!normalizedCandidate) return false;
      if (normalizedCandidate.includes(normalizedQuery)) return true;
      const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
      const candidateTokens = normalizedCandidate.split(/\s+/).filter(Boolean);
      if (queryTokens.every((token) => candidateTokens.some((candidateToken) => candidateToken.includes(token)))) return true;
      return candidateTokens.some((token) => levenshteinDistance(normalizedQuery, token) <= 2);
    });
  };

  const formatPracticeMinutes = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '0';
    return value < 10 ? value.toFixed(1).replace(/\.0$/, '') : String(Math.round(value));
  };
  const todayGoalMinutes = Math.max(0, Number(dailyGoal || 0));
  const todayProgressRatio = todayGoalMinutes > 0 ? todayMinutes / todayGoalMinutes : 0;
  const todayProgressWidth = Math.max(0, Math.min(100, todayGoalMinutes > 0 ? todayProgressRatio * 100 : 0));
  const todayProgressPercent = Math.max(0, Math.min(100, todayGoalMinutes > 0 ? Math.round(todayProgressRatio * 100) : 0));
  const [quote, setQuote] = useState(quotes[0]);
  const [greetingText, setGreetingText] = useState('Olá 👋');
  const [mounted, setMounted] = useState(false);
  const [showBirthdayCelebration, setShowBirthdayCelebration] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>(null);
  const [favoriteLimitCardId, setFavoriteLimitCardId] = useState<string | null>(null);
  const [inboxItems, setInboxItems] = useAppPersistence<HomeInboxItem[]>('sereno_inbox_items', []);
  const [dismissedInboxIds, setDismissedInboxIds] = useAppPersistence<string[]>('sereno_inbox_dismissed', []);
  const [acknowledgedInboxIds, setAcknowledgedInboxIds] = useAppPersistence<string[]>('sereno_inbox_acknowledged', []);
  const [homeReminderSettings] = useAppPersistence<ReminderSettings>('reminderSettings', {
    moodReminder: true, moodTime: '12:00',
    breathingReminder: true, breathingTime: '12:00',
    yogaReminder: true, yogaTime: '12:00',
    diaryReminder: true, diaryTime: '12:00',
    healthySelfReminder: false, healthySelfTime: '12:00',
    meditationReminder: true, meditationTime: '12:00',
    badgesReminder: true, badgesTime: '12:00',
    gratitudeReminder: true, gratitudeTime: '12:00',
    sleepReminder: true, sleepTime: '12:00',
    missionsReminder: true, missionsTime: '12:00',
    microtasksReminder: true, microtasksTime: '12:00',
    mindmapReminder: true, mindmapTime: '12:00',
    psychoeduReminder: true, psychoeduTime: '12:00',
    adaptiveSuggestionReminder: true, adaptiveSuggestionTime: '12:00',
    therapyReminder: true,
    therapyReminderDayBefore: true,
    therapyReminderHourBefore: true,
    therapyExternalCalendar: false,
    doNotDisturb: false,
  });
  const [homeTherapySessions] = useAppPersistence<any[]>('therapy_sessions', []);
  const [homeTimeCapsules] = useAppPersistence<any[]>('psico_time_capsule', []);
  const [homeChallenges] = useAppPersistence<any[]>('psico_challenges', []);
  const [homeTrackProgress] = useAppPersistence<Record<string, number>>('psico_tracks_progress', {});
  const [homeHabitsReqs] = useAppPersistence<any[]>('psico_habits_reqs', []);
  const [homeHabitsHistory] = useAppPersistence<Record<string, string[]>>('psico_habits_history', {});
  const [homeCoupleRooms] = useAppPersistence<any[]>('psico_couple_rooms', []);
  const [homeActiveCoupleRoomId] = useAppPersistence<string | null>('psico_couple_active_room', null);
  const [homeCoupleDeviceMember] = useAppPersistence<Record<string, string>>('psico_couple_device_member', {});
  const [homeFamilyGroups] = useAppPersistence<any[]>('psico_family_groups', []);
  const [homeActiveFamilyGroupId] = useAppPersistence<string | null>('psico_family_active_group', null);
  const [homeFamilyDeviceMember] = useAppPersistence<Record<string, string>>('psico_family_device_member', {});
  const [lifetimeOffer, setLifetimeOffer] = useState<{
    enabled: boolean;
    startsAt: string | null;
    endsAt: string | null;
    isActive: boolean;
    hasStarted: boolean;
    hasEnded: boolean;
    msRemaining: number;
  } | null>(null);
  const [iePlan] = useAppPersistence<any>('psico_ie_plan', null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Crise e Regulação Imediata': false,
    'Autoconhecimento e Terapia Pessoal': false,
    'Rotina, Progresso e Consistência': false,
    'Relacionamentos e Comunicação': false,
    'Comunidade e Expansão': false,
    'Exploração e Desenvolvimento Pessoal': false,
  });
  const [forceAllCategoriesOpen, setForceAllCategoriesOpen] = useState<boolean | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');
  const [lockedLibraryPreview, setLockedLibraryPreview] = useState<{
    key: string;
    title: string;
    desc?: string;
    icon?: string;
    highlights?: string[];
    alignX: 'left' | 'right';
    alignY: 'above' | 'below';
  } | null>(null);
  const [favoriteTabs, setFavoriteTabs] = useAppPersistence<string[]>('home_favorite_tabs', ['sos', 'breathing', 'mood']);
  const [homeContinueState, setHomeContinueState] = useAppPersistence<ContinueState>('home_continue_state_v1', {
    lastTab: null,
    lastParams: null,
    mostUsedTab: null,
    pinnedTab: null,
  });
  const [conquestsBg, setConquestsBg] = useAppPersistence<{ mode: 'preset' | 'color' | 'image'; preset: 'default' | 'aurora' | 'calm' | 'sunset' | 'forest' | 'lavender' | 'ocean' | 'rosegold' | 'midnight'; color1: string; color2: string; image: string; overlay: number }>('home_conquests_bg_v1', {
    mode: 'preset',
    preset: 'default',
    color1: '#6366f1',
    color2: '#a855f7',
    image: '',
    overlay: 55,
  });
  const todayMood = moodHistory.find(m => m.date === new Date().toLocaleDateString('en-CA'));
  const libraryProHighlights = useMemo(
    () =>
      ({
        yoga: ['Relaxamento profundo guiado', 'Rotinas para desacelerar corpo e mente', 'Experiência completa de descanso restaurador'],
        hooponopono: ['Práticas de liberação emocional', 'Roteiros para aliviar peso interno', 'Mais profundidade para reconciliação e calma'],
        lovelanguages: ['Descoberta guiada da sua linguagem principal', 'Leituras para vínculo e afeto', 'Experiência completa para casal ou autoconhecimento'],
        fivefingers: ['Método completo passo a passo', 'Treino de consciência e comunicação', 'Uso guiado para conversas delicadas'],
        vocacional: ['Exploração vocacional aprofundada', 'Percursos para clareza de direção', 'Mais apoio para escolhas de carreira'],
      }) satisfies Partial<Record<Tab, string[]>>,
    [],
  );
  const libraryProDescriptions = useMemo(
    () =>
      ({
        yoga: 'Áudios e práticas para descanso profundo, desaceleração e recuperação.',
        hooponopono: 'Práticas guiadas para perdão, reconciliação interna e alívio emocional.',
        lovelanguages: 'Leituras e descobertas para entender como você dá e recebe afeto.',
        fivefingers: 'Método guiado para consciência, comunicação e reconexão emocional.',
        vocacional: 'Percurso guiado para clareza de direção, interesses e escolhas de carreira.',
      }) satisfies Partial<Record<Tab, string>>,
    [],
  );
  const openLibraryFeature = useCallback(
    (
      feature: { tab: Tab; title: string; desc?: string; icon?: string; hasUnlimitedAccess?: boolean; previewMode?: 'popup' | 'inline' },
      anchorElement?: HTMLElement | null,
    ) => {
      if (feature.hasUnlimitedAccess && feature.previewMode !== 'inline' && !hasUnlimitedAccess) {
        const rect = anchorElement?.getBoundingClientRect();
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 844;
        const appFrameRect =
          anchorElement?.closest('main')?.getBoundingClientRect() ||
          anchorElement?.closest('[data-sereno-shell="app"]')?.getBoundingClientRect() || {
            left: 0,
            right: viewportWidth,
            top: 0,
            bottom: viewportHeight,
            width: viewportWidth,
            height: viewportHeight,
          };
        const estimatedPopupHeight = 404;
        const cardMidpoint = rect ? rect.left + rect.width / 2 : appFrameRect.left;
        const frameMidpoint = appFrameRect.left + appFrameRect.width / 2;
        const alignX: 'left' | 'right' = cardMidpoint >= frameMidpoint ? 'right' : 'left';
        const spaceBelow = rect ? appFrameRect.bottom - rect.bottom : viewportHeight;
        const alignY: 'above' | 'below' = spaceBelow >= estimatedPopupHeight ? 'below' : 'above';
        setLockedLibraryPreview({
          key: String(feature.tab),
          title: feature.title,
          desc: libraryProDescriptions[feature.tab] || feature.desc,
          icon: feature.icon,
          highlights:
            libraryProHighlights[feature.tab] || [
              'Conteúdo completo e sem limitações',
              'Mais profundidade para usar no seu ritmo',
              'Experiência premium liberada no Sereno Pro',
            ],
          alignX,
          alignY,
        });
        return;
      }
      onNavigate(feature.tab);
    },
    [hasUnlimitedAccess, libraryProDescriptions, libraryProHighlights, onNavigate],
  );
  const reminderInboxDefinitions = useMemo(() => ([
    { enabled: homeReminderSettings.moodReminder, time: homeReminderSettings.moodTime, tab: 'mood' as Tab, title: 'Hora do check-in emocional', body: `Seu lembrete de humor está marcado para ${homeReminderSettings.moodTime}.` },
    { enabled: homeReminderSettings.breathingReminder, time: homeReminderSettings.breathingTime, tab: 'breathing' as Tab, title: 'Pausa para respirar', body: `Seu lembrete de respiração está marcado para ${homeReminderSettings.breathingTime}.` },
    { enabled: homeReminderSettings.yogaReminder, time: homeReminderSettings.yogaTime, tab: 'yoga' as Tab, title: 'Hora do Yoga Nidra', body: `Seu lembrete de Yoga Nidra está marcado para ${homeReminderSettings.yogaTime}.` },
    { enabled: homeReminderSettings.diaryReminder, time: homeReminderSettings.diaryTime, tab: 'diary' as Tab, title: 'Espaço para escrever', body: `Seu lembrete do diário está marcado para ${homeReminderSettings.diaryTime}.` },
    { enabled: homeReminderSettings.meditationReminder, time: homeReminderSettings.meditationTime, tab: 'meditation' as Tab, title: 'Momento de meditação', body: `Sua pausa de meditação está marcada para ${homeReminderSettings.meditationTime}.` },
    { enabled: homeReminderSettings.badgesReminder, time: homeReminderSettings.badgesTime, tab: 'stats' as Tab, title: 'Hora de revisar seu progresso', body: `Seu lembrete de progresso está marcado para ${homeReminderSettings.badgesTime}.` },
    { enabled: homeReminderSettings.gratitudeReminder, time: homeReminderSettings.gratitudeTime, tab: 'gratitude' as Tab, title: 'Gratidão do dia', body: `Seu lembrete de gratidão está marcado para ${homeReminderSettings.gratitudeTime}.` },
    { enabled: homeReminderSettings.sleepReminder, time: homeReminderSettings.sleepTime, tab: 'sleep' as Tab, title: 'Hora de desacelerar', body: `Seu lembrete de sono está marcado para ${homeReminderSettings.sleepTime}.` },
    { enabled: homeReminderSettings.missionsReminder, time: homeReminderSettings.missionsTime, tab: 'missions' as Tab, title: 'Missão do dia', body: `Seu lembrete de missões está marcado para ${homeReminderSettings.missionsTime}.` },
    (() => {
      const microtasksReminder = getMicrotasksReminderContext();
      return {
        enabled: homeReminderSettings.microtasksReminder,
        time: homeReminderSettings.microtasksTime,
        tab: 'microtasks' as Tab,
        title: microtasksReminder.title,
        body: microtasksReminder.body,
        actionParams: microtasksReminder.actionParams,
      };
    })(),
    { enabled: homeReminderSettings.mindmapReminder, time: homeReminderSettings.mindmapTime, tab: 'mindmap' as Tab, title: 'Revisar seu mapa emocional', body: `Seu lembrete do Mapa Mental Emocional está marcado para ${homeReminderSettings.mindmapTime}.` },
    { enabled: homeReminderSettings.psychoeduReminder, time: homeReminderSettings.psychoeduTime, tab: 'psychoedu' as Tab, title: 'Pausa de psicoeducação', body: `Seu lembrete de Psicoeducação está marcado para ${homeReminderSettings.psychoeduTime}.` },
  ]), [homeReminderSettings]);
  const safeHomeContinueState =
    homeContinueState && typeof homeContinueState === 'object' && !Array.isArray(homeContinueState)
      ? {
          lastTab: typeof homeContinueState.lastTab === 'string' ? homeContinueState.lastTab : null,
          lastParams: homeContinueState.lastParams && typeof homeContinueState.lastParams === 'object' && !Array.isArray(homeContinueState.lastParams)
            ? homeContinueState.lastParams
            : null,
          mostUsedTab: typeof homeContinueState.mostUsedTab === 'string' ? homeContinueState.mostUsedTab : null,
          pinnedTab: typeof homeContinueState.pinnedTab === 'string' ? homeContinueState.pinnedTab : null,
        }
      : {
          lastTab: null,
          lastParams: null,
          mostUsedTab: null,
          pinnedTab: null,
        };
  const dismissedInboxSet = useMemo(() => new Set(dismissedInboxIds), [dismissedInboxIds]);
  const acknowledgedInboxSet = useMemo(() => new Set(acknowledgedInboxIds), [acknowledgedInboxIds]);

  const upsertInboxCandidates = useCallback((candidates: HomeInboxItem[]) => {
    if (!candidates.length) return;
    setInboxItems((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      candidates.forEach((candidate) => {
        if (dismissedInboxSet.has(candidate.id)) return;
        const previous = map.get(candidate.id);
        map.set(candidate.id, {
          ...candidate,
          seen: previous?.seen || acknowledgedInboxSet.has(candidate.id) || candidate.seen,
          actionTab: previous?.actionTab || candidate.actionTab,
          actionParams: previous?.actionParams || candidate.actionParams,
          linkUrl: previous?.linkUrl || candidate.linkUrl,
          source: previous?.source || candidate.source,
        });
      });
      return Array.from(map.values()).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    });
  }, [acknowledgedInboxSet, dismissedInboxSet, setInboxItems]);

  const markInboxSeen = useCallback((id: string) => {
    setAcknowledgedInboxIds((prev) => prev.includes(id) ? prev : [...prev, id]);
    setInboxItems((prev) => prev.map((item) => item.id === id ? { ...item, seen: true } : item));
  }, [setAcknowledgedInboxIds, setInboxItems]);

  const dismissInboxItem = useCallback((id: string) => {
    setDismissedInboxIds((prev) => prev.includes(id) ? prev : [...prev, id]);
    setInboxItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedInboxId === id) setSelectedInboxId(null);
  }, [selectedInboxId, setDismissedInboxIds, setInboxItems]);

  const dismissAllInboxItems = useCallback(() => {
    setDismissedInboxIds((prev) => Array.from(new Set([...prev, ...inboxItems.map((item) => item.id)])));
    setInboxItems([]);
    setSelectedInboxId(null);
  }, [inboxItems, setDismissedInboxIds, setInboxItems]);

  const isBirthdayToday = useMemo(() => {
    if (!userAccount?.birthdate) return false;
    const parts = userAccount.birthdate.split('-').map(Number);
    if (parts.length !== 3) return false;
    const [, m, d] = parts;
    const now = new Date();
    return now.getMonth() + 1 === m && now.getDate() === d;
  }, [userAccount?.birthdate]);

  const playBirthdayPartyFx = () => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();

      const playNote = (freq: number, start: number, dur: number, vol = 0.11, type: OscillatorType = 'triangle') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.02);
      };

      // Parabéns completo (4 frases)
      const seq: Array<[number, number, number]> = [
        [523.25, 0.00, 0.28], [523.25, 0.30, 0.22], [587.33, 0.56, 0.36], [523.25, 0.95, 0.36], [698.46, 1.36, 0.36], [659.25, 1.76, 0.62],
        [523.25, 2.48, 0.28], [523.25, 2.78, 0.22], [587.33, 3.04, 0.36], [523.25, 3.43, 0.36], [783.99, 3.84, 0.36], [698.46, 4.24, 0.62],
        [523.25, 4.96, 0.28], [523.25, 5.26, 0.22], [1046.5, 5.52, 0.36], [880.0, 5.91, 0.36], [698.46, 6.32, 0.36], [659.25, 6.72, 0.36], [587.33, 7.12, 0.72],
        [932.33, 7.95, 0.28], [932.33, 8.25, 0.22], [880.0, 8.51, 0.36], [698.46, 8.90, 0.36], [783.99, 9.31, 0.36], [698.46, 9.70, 0.82],
      ];

      seq.forEach(([f, s, d]) => {
        playNote(f, s, d, 0.115, 'triangle');
        playNote(f / 2, s, d * 0.95, 0.045, 'sine'); // harmonia leve
      });

      // Percussão leve de fundo
      for (let t = 0.6; t < 10.4; t += 0.55) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 140;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.09);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.1);
      }

      // Palmas em rajadas
      const clap = (start: number, vol = 0.2) => {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length / 7));
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        src.buffer = buffer;
        gain.gain.value = vol;
        src.connect(gain); gain.connect(ctx.destination);
        src.start(ctx.currentTime + start);
      };
      [5.2, 5.37, 5.54, 5.71, 8.9, 9.08, 9.26, 9.44, 10.0, 10.18].forEach((s, i) => clap(s, i > 7 ? 0.24 : 0.18));

      // Língua de sogra / party horn sintético
      const horn = (start: number, from = 420, to = 860) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(from, ctx.currentTime + start);
        osc.frequency.linearRampToValueAtTime(to, ctx.currentTime + start + 0.35);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.38);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + 0.4);
      };
      horn(5.25);
      horn(9.55, 500, 980);

      // Finalzinho de celebração
      playNote(1046.5, 10.4, 0.25, 0.12, 'square');
      playNote(1318.5, 10.65, 0.35, 0.1, 'square');
      playNote(1568.0, 10.95, 0.45, 0.1, 'square');
    } catch {}
  };
  const unseenInboxCount = inboxItems.filter((i) => !i.seen).length;
  const orderedInboxItems = useMemo(
    () =>
      inboxItems
        .map((item, index) => ({
          item,
          index,
          ts: Number.isFinite(new Date(item.createdAt).getTime()) ? new Date(item.createdAt).getTime() : 0,
        }))
        .sort((a, b) => {
          if (b.ts !== a.ts) return b.ts - a.ts;
          return b.index - a.index;
        })
        .map(({ item }) => item),
    [inboxItems],
  );

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sereno-inbox-count', { detail: unseenInboxCount }));
  }, [unseenInboxCount]);

  useEffect(() => {
    const handleOpenInbox = () => setInboxOpen(true);
    window.addEventListener('sereno-open-inbox', handleOpenInbox);
    return () => window.removeEventListener('sereno-open-inbox', handleOpenInbox);
  }, []);

  useEffect(() => {
    if (!favoriteLimitCardId) return;
    const t = setTimeout(() => setFavoriteLimitCardId(null), 2600);
    return () => clearTimeout(t);
  }, [favoriteLimitCardId]);

  useEffect(() => {
    const customQuotes = (healthyMessages || []).map((m) => ({ text: m.text }));
    const quotePool = [...quotes, ...customQuotes];

    const pickRandom = () => {
      setQuote(quotePool[Math.floor(Math.random() * quotePool.length)] || quotes[0]);
    };

    pickRandom();

    // Obter hora exata em Brasília formatada em string en-US (h24) e extrair apenas a hora
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hourCycle: 'h23'
    });
    const hourStr = formatter.format(new Date());
    const h = parseInt(hourStr, 10);

    if (h >= 5 && h < 12) setGreetingText('Bom dia ☀️');
    else if (h >= 12 && h < 18) setGreetingText('Boa tarde 🌤️');
    else setGreetingText('Boa noite 🌙');

    const rotation = setInterval(pickRandom, 30000);
    setMounted(true);
    return () => clearInterval(rotation);
  }, [healthyMessages]);

  useEffect(() => {
    const key = new Date().toLocaleDateString('en-CA');
    const additions: HomeInboxItem[] = [];

    const goalId = `goal-${key}`;
    if ((todayMinutes || 0) < (dailyGoal || 0)) {
      additions.push({
        id: goalId,
        kind: 'lembrete',
        title: 'Meta diária pendente',
        body: `Você está com ${formatPracticeMinutes(todayMinutes || 0)}/${dailyGoal || 0} min hoje.`,
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'timer',
        source: 'app',
      });
    }

    if (iePlan && iePlan.currentDay <= 14) {
      const isDoneToday = iePlan.days[iePlan.currentDay - 1]?.done && iePlan.lastCompletedDate === new Date().toDateString();
      if (!isDoneToday) {
        const iePlanId = `iePlan-${key}`;
        additions.push({
          id: iePlanId,
          kind: 'lembrete',
          title: '🧠 Plano de Inteligência Emocional',
          body: `Sua tarefa do Dia ${iePlan.currentDay} está pendente. Tire 5 minutinhos para focar em você hoje.`,
          createdAt: new Date().toISOString(),
          seen: false,
          actionTab: 'emocional',
          source: 'app',
        });
      }
    }

    if (isBirthdayToday) {
      const birthdayId = `birthday-${key}`;
      additions.push({
        id: birthdayId,
        kind: 'mensagem',
        title: '🎂 Seu dia chegou',
        body: 'Feliz aniversário. Que seu dia seja leve, especial e com espaço para cuidado.',
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'home',
        source: 'app',
      });
    }

    if (!homeReminderSettings.doNotDisturb) {
      reminderInboxDefinitions.forEach((reminder) => {
        if (!reminder.enabled) return;
        additions.push({
          id: `reminder-${String(reminder.tab)}-${key}`,
          kind: 'lembrete',
          title: reminder.title,
          body: reminder.body,
          createdAt: new Date().toISOString(),
          seen: false,
          actionTab: reminder.tab,
          actionParams: 'actionParams' in reminder ? reminder.actionParams : undefined,
          source: 'app',
        });
      });

      if (homeReminderSettings.healthySelfReminder && healthyMessages.length > 0) {
        const picked = healthyMessages[healthyMessages.length - 1];
        additions.push({
          id: `reminder-healthymessages-${key}`,
          kind: 'mensagem',
          title: '💬 Mensagem do seu Eu Saudável',
          body: picked?.text || 'Abra suas mensagens de apoio e escolha uma âncora para hoje.',
          createdAt: new Date().toISOString(),
          seen: false,
          actionTab: 'healthymessages',
          source: 'app',
        });
      }

      if (homeReminderSettings.adaptiveSuggestionReminder) {
        additions.push({
          id: `reminder-adaptive-${key}`,
          kind: 'lembrete',
          title: '✨ Sugestão adaptativa',
          body: `Sua sugestão personalizada do dia está prevista para ${homeReminderSettings.adaptiveSuggestionTime}.`,
          createdAt: new Date().toISOString(),
          seen: false,
          actionTab: 'chat',
          source: 'app',
        });
      }
    }

    const upcomingTherapy = [...(homeTherapySessions || [])]
      .filter((session) => !session?.completed && session?.date && session?.time)
      .sort((a, b) => +new Date(`${a.date}T${a.time}`) - +new Date(`${b.date}T${b.time}`))[0];

    if (!homeReminderSettings.doNotDisturb && homeReminderSettings.therapyReminder && upcomingTherapy) {
      const therapyDate = new Date(`${upcomingTherapy.date}T${upcomingTherapy.time}`);
      const therapyDiffMs = therapyDate.getTime() - Date.now();
      const therapyDiffMins = therapyDiffMs / (1000 * 60);
      const shouldDayBefore = homeReminderSettings.therapyReminderDayBefore && therapyDiffMins > 1380 && therapyDiffMins <= 1440;
      const shouldHourBefore = homeReminderSettings.therapyReminderHourBefore && therapyDiffMins > 0 && therapyDiffMins <= 60;

      if (shouldDayBefore || shouldHourBefore) {
        additions.push({
          id: `therapy-${upcomingTherapy.id}-${shouldHourBefore ? 'hour' : 'day'}-${key}`,
          kind: 'lembrete',
          title: shouldHourBefore ? 'Terapia em 1 hora' : 'Terapia amanhã',
          body: `${therapyDate.toLocaleDateString('pt-BR')} às ${upcomingTherapy.time}${upcomingTherapy.reason ? ` • ${upcomingTherapy.reason}` : ''}`,
          createdAt: new Date().toISOString(),
          seen: false,
          actionTab: 'therapycalendar',
          source: 'app',
        });
      }
    }

    const readyCapsule = [...(homeTimeCapsules || [])]
      .filter((entry) => entry?.type === 'futuro' && entry?.openAt && new Date(entry.openAt).getTime() <= Date.now())
      .sort((a, b) => +new Date(b.openAt) - +new Date(a.openAt))[0];

    if (readyCapsule) {
      additions.push({
        id: `capsule-${readyCapsule.id}`,
        kind: 'aviso',
        title: '🕰️ Cápsula pronta para abrir',
        body: readyCapsule.title || 'Sua cápsula do tempo já pode ser aberta.',
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'timecapsule',
        source: 'app',
      });
    }

    const activeChallenge = [...(homeChallenges || [])]
      .filter((challenge) => challenge && challenge.progress < challenge.days && !challenge.paused)
      .sort((a, b) => (b.progress / b.days) - (a.progress / a.days))[0];

    if (activeChallenge) {
      additions.push({
        id: `challenge-${activeChallenge.id}`,
        kind: 'lembrete',
        title: '🎯 Desafio em andamento',
        body: `${activeChallenge.title} • ${activeChallenge.progress}/${activeChallenge.days}`,
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: (activeChallenge.linkedTab as Tab) || 'missions',
        source: 'app',
      });
    }

    const todayHabitCompletions = homeHabitsHistory?.[key] || [];
    if ((homeHabitsReqs || []).length > 0 && todayHabitCompletions.length === 0) {
      additions.push({
        id: `habits-${key}`,
        kind: 'lembrete',
        title: '🌿 Seus hábitos ainda estão em aberto',
        body: 'Hoje você ainda não marcou nenhum hábito. Um pequeno começo já vale.',
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'habits',
        source: 'app',
      });
    }

    const trackTotals: Record<string, number> = {
      ansiedade: 4,
      burnout: 4,
      autoestima: 4,
      luto: 5,
      separacao: 4,
      panico: 4,
      insonia: 4,
      procrastinacao: 4,
      dependencia: 4,
      'ansiedade-social': 4,
    };
    const trackNames: Record<string, string> = {
      ansiedade: 'Ansiedade',
      burnout: 'Burnout',
      autoestima: 'Baixa Autoestima',
      luto: 'Luto e Perdas',
      separacao: 'Separação Afetiva',
      panico: 'Crise de Pânico',
      insonia: 'Insônia e Mente Acelerada',
      procrastinacao: 'Procrastinação Ansiosa',
      dependencia: 'Dependência Emocional',
      'ansiedade-social': 'Ansiedade Social',
    };
    const activeTrack = Object.entries(homeTrackProgress || {})
      .map(([id, done]) => ({ id, done: typeof done === 'number' ? done : 0, total: trackTotals[id] || 0 }))
      .filter((item) => item.done > 0 && item.total > 0 && item.done < item.total)
      .sort((a, b) => (b.done / b.total) - (a.done / a.total))[0];

    if (activeTrack) {
      additions.push({
        id: `track-${activeTrack.id}`,
        kind: 'lembrete',
        title: '🧭 Trilha em andamento',
        body: `${trackNames[activeTrack.id] || activeTrack.id} • etapa ${activeTrack.done + 1} de ${activeTrack.total}`,
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'tracks',
        actionParams: { trackId: activeTrack.id },
        source: 'app',
      });
    }

    if ((userProgress.badgesEarned?.length || 0) > 0) {
      additions.push({
        id: `badges-${userProgress.badgesEarned.length}`,
        kind: 'aviso',
        title: '🏆 Suas conquistas merecem atenção',
        body: `Você já desbloqueou ${userProgress.badgesEarned.length} conquista${userProgress.badgesEarned.length === 1 ? '' : 's'} no Sereno.`,
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'stats',
        source: 'app',
      });
    }

    if ((moodHistory || []).length >= 5) {
      additions.push({
        id: `mindmap-${moodHistory.length}`,
        kind: 'aviso',
        title: '🗺️ Seu mapa emocional já pode mostrar padrões',
        body: 'Você já tem histórico suficiente para revisar transições emocionais e perceber recorrências.',
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'mindmap',
        source: 'app',
      });
    }

    if ((moodHistory || []).length > 0 || (diaryEntries || []).length > 0) {
      additions.push({
        id: `psychoedu-${moodHistory.length}-${diaryEntries.length}`,
        kind: 'lembrete',
        title: '📚 Psicoeducação para este momento',
        body: 'Com base no que você já registrou, vale abrir uma leitura curta ou prática rápida de psicoeducação.',
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'psychoedu',
        source: 'app',
      });
    }

    const activeCoupleRoom = (homeCoupleRooms || []).find((room) => room?.id === homeActiveCoupleRoomId) || null;
    const myCoupleMemberId = homeActiveCoupleRoomId ? homeCoupleDeviceMember?.[homeActiveCoupleRoomId] : undefined;
    const latestCouplePost = activeCoupleRoom?.posts?.find((post: any) => post.authorId !== myCoupleMemberId) || null;
    const latestCoupleMessage = activeCoupleRoom?.messages?.find((message: any) => message.authorId !== myCoupleMemberId) || null;

    if (latestCouplePost?.id) {
      additions.push({
        id: `couple-post-${latestCouplePost.id}`,
        kind: 'mensagem',
        title: '💞 Novo check-in no Modo Casal',
        body: `${latestCouplePost.authorName}: ${latestCouplePost.mood || 'novo registro'}`,
        createdAt: latestCouplePost.date || new Date().toISOString(),
        seen: false,
        actionTab: 'couple',
        source: 'app',
      });
    }

    if (latestCoupleMessage?.id) {
      additions.push({
        id: `couple-message-${latestCoupleMessage.id}`,
        kind: 'mensagem',
        title: '💬 Nova mensagem no Modo Casal',
        body: `${latestCoupleMessage.authorName}: ${latestCoupleMessage.text}`,
        createdAt: latestCoupleMessage.date || new Date().toISOString(),
        seen: false,
        actionTab: 'couple',
        source: 'app',
      });
    }

    const activeFamilyGroup = (homeFamilyGroups || []).find((group) => group?.id === homeActiveFamilyGroupId) || null;
    const myFamilyMemberId = homeActiveFamilyGroupId ? homeFamilyDeviceMember?.[homeActiveFamilyGroupId] : undefined;
    const latestFamilyPost = activeFamilyGroup?.posts?.find((post: any) => post.memberId !== myFamilyMemberId) || null;
    const latestFamilyMessage = activeFamilyGroup?.messages?.find((message: any) => message.memberId !== myFamilyMemberId) || null;

    if (latestFamilyPost?.id) {
      additions.push({
        id: `family-post-${latestFamilyPost.id}`,
        kind: 'mensagem',
        title: '👪 Novo registro no Modo Família',
        body: `${latestFamilyPost.memberName}: ${latestFamilyPost.mood || latestFamilyPost.type || 'novo registro'}`,
        createdAt: latestFamilyPost.date || new Date().toISOString(),
        seen: false,
        actionTab: 'family',
        source: 'app',
      });
    }

    if (latestFamilyMessage?.id) {
      additions.push({
        id: `family-message-${latestFamilyMessage.id}`,
        kind: 'mensagem',
        title: '💬 Nova mensagem no Modo Família',
        body: `${latestFamilyMessage.memberName}: ${latestFamilyMessage.text}`,
        createdAt: latestFamilyMessage.date || new Date().toISOString(),
        seen: false,
        actionTab: 'family',
        source: 'app',
      });
    }

    upsertInboxCandidates(additions);
  }, [
    dailyGoal,
    healthyMessages,
    homeActiveCoupleRoomId,
    homeActiveFamilyGroupId,
    homeChallenges,
    homeCoupleDeviceMember,
    homeCoupleRooms,
    homeFamilyDeviceMember,
    homeFamilyGroups,
    homeHabitsHistory,
    homeHabitsReqs,
    homeReminderSettings,
    homeTherapySessions,
    homeTimeCapsules,
    homeTrackProgress,
    iePlan,
    isBirthdayToday,
    reminderInboxDefinitions,
    todayMinutes,
    upsertInboxCandidates
  ]);

  useEffect(() => {
    const matchesAudience = (item: any) => {
      if (!item?.audience || item.audience === 'all') return true;
      const currentEmail = String(userAccount?.email || '').trim().toLowerCase();
      if (item.audience === 'email') return Boolean(item.targetEmail) && String(item.targetEmail).trim().toLowerCase() === currentEmail;

      const identity = String(userAccount?.sex || '').toLowerCase();
      const femaleIdentities = new Set(['mulher', 'mulher_trans', 'lesbica', 'feminino']);
      const maleIdentities = new Set(['homem', 'homem_trans', 'gay', 'masculino']);
      if (item.audience === 'women') return femaleIdentities.has(identity);
      if (item.audience === 'men') return maleIdentities.has(identity);
      return false;
    };

    const pullBroadcasts = async () => {
      try {
        const res = await fetch('/api/broadcast/list');
        const data = await res.json();
        if (!data?.ok || !Array.isArray(data.items)) return;

        const incoming: HomeInboxItem[] = data.items
          .filter(matchesAudience)
          .map((b: any) => ({
            id: `broadcast-${b.id}`,
            kind: 'mensagem' as const,
            title: b.title,
            body: b.body,
            createdAt: b.createdAt,
            seen: false,
            actionTab: (b.actionParams?.openPaywall || b.actionTab === 'profile' || b.actionTab === 'login') ? 'plans' : b.actionTab,
            actionParams: b.actionParams,
            linkUrl: b.linkUrl,
            source: b.source === 'lifetime_offer' ? 'lifetime' : 'broadcast',
          }))
          .filter((item) => !dismissedInboxSet.has(item.id));

        upsertInboxCandidates(incoming);
      } catch {}
    };

    pullBroadcasts();
    const interval = setInterval(pullBroadcasts, 15000);
    const onFocus = () => pullBroadcasts();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [dismissedInboxSet, upsertInboxCandidates, userAccount?.email, userAccount?.sex]);

  useEffect(() => {
    const pullLifetimeOffer = async () => {
      try {
        const res = await fetch('/api/lifetime-offer', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) return;
        setLifetimeOffer(data);
      } catch {}
    };

    pullLifetimeOffer();
    const interval = setInterval(pullLifetimeOffer, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentCycleKey = lifetimeOffer?.startsAt || lifetimeOffer?.endsAt
      ? `${lifetimeOffer?.startsAt || 'start'}-${lifetimeOffer?.endsAt || 'end'}`
      : null;

    setInboxItems((prev) => prev.filter((item) => {
      if (!item.id.startsWith('system-lifetime-')) return true;
      if (!lifetimeOffer?.isActive || !currentCycleKey) return false;
      return item.id.includes(currentCycleKey);
    }));

    if (!lifetimeOffer?.isActive || !currentCycleKey) return;

    const openingId = `system-lifetime-open-${currentCycleKey}`;
    const lastDayId = `system-lifetime-lastday-${currentCycleKey}`;
    const candidates: HomeInboxItem[] = [
      {
        id: openingId,
        kind: 'aviso',
        title: '💎 Acesso Vitalício aberto',
        body: 'Uma chance limitada de garantir acesso premium em condições especiais antes do encerramento da campanha.',
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'plans',
        actionParams: { focus: 'lifetime' },
        source: 'lifetime',
      },
    ];

    if (lifetimeOffer.msRemaining > 0 && lifetimeOffer.msRemaining <= 24 * 60 * 60 * 1000) {
      candidates.push({
        id: lastDayId,
        kind: 'aviso',
        title: '⏳ Último dia do Vitalício',
        body: 'A condição especial do acesso vitalício está na reta final. Se fizer sentido para você, este é o momento de aproveitar.',
        createdAt: new Date().toISOString(),
        seen: false,
        actionTab: 'plans',
        actionParams: { focus: 'lifetime' },
        source: 'lifetime',
      });
    }

    upsertInboxCandidates(candidates);
  }, [lifetimeOffer, setInboxItems, upsertInboxCandidates]);

  useEffect(() => {
    if (!userAccount?.birthdate) return;
    const [y, m, d] = userAccount.birthdate.split('-').map(Number);
    if (!y || !m || !d) return;

    const now = new Date();
    const isBirthday = now.getDate() === d && now.getMonth() === (m - 1);
    if (!isBirthday) return;

    const todayKey = now.toISOString().slice(0, 10);
    const notifyKey = `birthday_notified_${todayKey}`;
    if (!localStorage.getItem(notifyKey)) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 Feliz Aniversário!', { body: 'Hoje o dia é seu. Que seja leve, feliz e especial! ✨', icon: '🧠' });
      }
      localStorage.setItem(notifyKey, '1');
    }

    const celebrationKey = `birthday_celebration_seen_v2_${todayKey}`;
    if (!localStorage.getItem(celebrationKey)) {
      setShowBirthdayCelebration(true);
      localStorage.setItem(celebrationKey, '1');

      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          const notes = [523.25, 523.25, 587.33, 523.25, 698.46, 659.25];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.25);
            gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.25 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.25);
            osc.stop(ctx.currentTime + i * 0.25 + 0.24);
          });
        }
      } catch {}

      const t = setTimeout(() => setShowBirthdayCelebration(false), 6500);
      return () => clearTimeout(t);
    }
  }, [userAccount?.birthdate]);

  const plansButtonLabel = hasUnlimitedAccess ? 'Sereno Pro' : 'Planos';

  const features = [
    { icon: '📊', title: 'Diário de Humor', desc: 'Acompanhamento emocional completo', tab: 'mood' as Tab, color: 'bg-orange-100' },
    { icon: '📈', title: 'Estatísticas', desc: 'Gráficos e padrões de humor', tab: 'stats' as Tab, color: 'bg-cyan-100' },
    { icon: '🆘', title: 'SOS Ansiedade', desc: 'Ferramentas de crise', tab: 'sos' as Tab, color: 'bg-red-400 text-white shadow-lg animate-pulse' },
    { icon: '🌬️', title: 'Respiração', desc: 'Técnicas relaxantes', tab: 'breathing' as Tab, color: 'bg-blue-100', hasUnlimitedAccess: true, previewMode: 'inline' as const },
    { icon: '🧘', title: 'Meditação', desc: 'Momentos de paz', tab: 'meditation' as Tab, color: 'bg-green-100', hasUnlimitedAccess: true, previewMode: 'inline' as const },
    { icon: '⏱️', title: 'Time Livre', desc: 'Meditação sem narração', tab: 'timer' as Tab, color: 'bg-sky-100' },
    { icon: '🌙', title: 'Yoga Nidra', desc: 'Relaxamento profundo', tab: 'yoga' as Tab, color: 'bg-indigo-100', hasUnlimitedAccess: true, previewMode: 'popup' as const },
    { icon: '✨', title: 'Ho\'oponopono', desc: 'Práticas de liberação', tab: 'hooponopono' as Tab, color: 'bg-teal-100', hasUnlimitedAccess: true, previewMode: 'popup' as const },
    { icon: '💖', title: 'Linguagens do Amor', desc: 'Descubra sua forma de amar', tab: 'lovelanguages' as Tab, color: 'bg-rose-100', hasUnlimitedAccess: true, previewMode: 'popup' as const },
    { icon: '📓', title: 'Diário (RPD)', desc: 'Registre pensamentos e situações', tab: 'diary' as Tab, color: 'bg-amber-100' },
    { icon: '🙏', title: 'Gratidão', desc: 'Anote suas gratidões', tab: 'gratitude' as Tab, color: 'bg-yellow-100' },
    { icon: '💭', title: 'Solta Aqui', desc: 'Desabafos e pensamentos', tab: 'solta' as Tab, color: 'bg-purple-100' },
    { icon: '🤎', title: 'Carta Terapêutica', desc: 'Escreva e liberte-se', tab: 'carta' as Tab, color: 'bg-amber-100' },
    { icon: '🛑', title: 'O Poder do NÃO', desc: 'Aprenda a se posicionar', tab: 'assertiveness' as Tab, color: 'bg-red-100' },
    { icon: '✋', title: 'Método dos 5 Dedos', desc: 'Comunicação e consciência', tab: 'fivefingers' as Tab, color: 'bg-indigo-50', hasUnlimitedAccess: true, previewMode: 'popup' as const },
    { icon: '🌻', title: 'Meus Hábitos', desc: 'Sua jornada diária', tab: 'habits' as Tab, color: 'bg-emerald-100' },
    { icon: '🧭', title: 'Exploração Vocacional', desc: 'Descubra sua carreira ideal', tab: 'vocacional' as Tab, color: 'bg-indigo-100', hasUnlimitedAccess: true, previewMode: 'popup' as const },
    { icon: '🧪', title: 'Inteligência Emocional', desc: 'Teste Goleman + Gardner', tab: 'emocional' as Tab, color: 'bg-violet-100', hasUnlimitedAccess: true, previewMode: 'inline' as const },
    { icon: '💌', title: 'Mural de Esperança', desc: 'Comunidade anônima gentil', tab: 'esperanca' as Tab, color: 'bg-pink-100' },
    { icon: '💬', title: 'Chat de Apoio', desc: 'Converse com a SerenAI', tab: 'chat' as Tab, color: 'bg-purple-100' },
    { icon: '🎧', title: 'Mixer Sonoro', desc: 'Crie seu ambiente sonoro', tab: 'mixer' as Tab, color: 'bg-indigo-200' },
    { icon: '🌙', title: 'Modo Sono', desc: 'Ritual de desaceleração noturna', tab: 'sleep' as Tab, color: 'bg-slate-100' },
    { icon: '📅', title: 'Calendário de Terapia', desc: 'Agende e lembre-se', tab: 'therapycalendar' as Tab, color: 'bg-blue-100' },
    { icon: '🧠', title: 'Abordagens psicológicas', desc: 'Conheça ferramentas de cura', tab: 'abordagens' as Tab, color: 'bg-indigo-100' },
    { icon: '🌿', title: 'Micro-tarefas', desc: 'Pequenas vitórias diárias', tab: 'microtasks' as Tab, color: 'bg-emerald-50' },
    { icon: '🕰️', title: 'Cápsula do Tempo', desc: 'Carta ao eu futuro/passado', tab: 'timecapsule' as Tab, color: 'bg-violet-100' },
    { icon: '🎯', title: 'Missões', desc: 'Ciclos de 7, 21 e 30 dias', tab: 'missions' as Tab, color: 'bg-lime-100' },
    { icon: '🎨', title: 'Modo Arte', desc: 'Expresse emoções sem texto', tab: 'artemotion' as Tab, color: 'bg-fuchsia-100' },
    { icon: '🧩', title: 'Destravar', desc: 'Quebre ciclos de autossabotagem', tab: 'destravar' as Tab, color: 'bg-indigo-50' },
    { icon: '🧑‍⚕️', title: 'Perfil de Regulação', desc: 'Visual, auditivo ou cinestésico', tab: 'regulation' as Tab, color: 'bg-sky-100' },
    { icon: '🎡', title: 'Mapa da Minha Vida', desc: 'Roda visual das áreas da vida', tab: 'mapavida' as Tab, color: 'bg-cyan-100' },
    { icon: '🗺️', title: 'Mapa Mental Emocional', desc: 'Conexão entre emoções', tab: 'mindmap' as Tab, color: 'bg-cyan-50' },
    { icon: '💬', title: 'Eu Mais Saudável', desc: 'Mensagens para você mesmo', tab: 'healthymessages' as Tab, color: 'bg-emerald-50' },
    { icon: '🛤️', title: 'Trilhas Temáticas', desc: 'Luto, burnout, autoestima...', tab: 'tracks' as Tab, color: 'bg-indigo-50', hasUnlimitedAccess: true, previewMode: 'inline' as const },
    { icon: '📚', title: 'Psicoeducação', desc: 'Cards rápidos de 1 minuto', tab: 'psychoedu' as Tab, color: 'bg-blue-50', hasUnlimitedAccess: true, previewMode: 'inline' as const },
    { icon: '⚠️', title: 'Falas Tóxicas', desc: 'Reconhecer e reformular', tab: 'toxicthoughts' as Tab, color: 'bg-rose-50' },
    { icon: '📖', title: 'Dicionário Emocional', desc: 'Vocabulário de emoções', tab: 'dictionary' as Tab, color: 'bg-violet-50' },
    { icon: '💑', title: 'Modo Casal', desc: 'Check-in compartilhado', tab: 'couple' as Tab, color: 'bg-pink-50', hasUnlimitedAccess: true, previewMode: 'inline' as const },
    { icon: '👨‍👩‍👧', title: 'Modo Família', desc: 'Acompanhar filhos/adolescentes', tab: 'family' as Tab, color: 'bg-amber-50', hasUnlimitedAccess: true, previewMode: 'inline' as const },
    { icon: '💌', title: 'Indicar para Amigo', desc: 'Mensagem de apoio pronta', tab: 'invite' as Tab, color: 'bg-teal-50' },
    { icon: '💡', title: 'Sugestões', desc: 'Envie suas ideias', tab: 'suggestions' as Tab, color: 'bg-yellow-100' },
  ];

  const metricByTab: Partial<Record<Tab, number>> = {
    meditation: userProgress.meditationsCompleted,
    breathing: userProgress.breathingCompleted,
    yoga: userProgress.yogaCompleted,
    stats: userProgress.totalMinutes || 0,
    diary: diaryEntries.length + soltaEntries.length,
    badges: userProgress.badgesEarned?.length || 0,
    mood: moodHistory.length,
    habits: practiceStreak || 0,
  };
  const searchResults = useMemo(
    () =>
      librarySearch
        ? features.filter((f) => fuzzyMatch(librarySearch, f.title, f.desc || ''))
        : [],
    [features, librarySearch],
  );
  const autoCompleteSuggestions = useMemo(
    () =>
      librarySearch
        ? features
            .filter((f) => fuzzyMatch(librarySearch, f.title, f.desc || ''))
            .slice(0, 5)
            .map((f) => f.title)
        : [],
    [features, librarySearch],
  );

  const panelOptions: Array<{ id: string; title: string; tab: Tab; icon: string; value: string | number; sub?: string }> = [
    ...features.map((f) => ({
      id: String(f.tab),
      title: f.title,
      tab: f.tab,
      icon: f.icon,
      value: metricByTab[f.tab as Tab] ?? '•',
      sub: f.tab === 'stats' ? 'total acumulado' : undefined,
    })),
    { id: 'streak', title: 'Sequência (dias)', tab: 'habits' as Tab, icon: '🔥', value: practiceStreak || 0, sub: undefined },
  ].filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);

  const categoryGroups = [
    {
      name: 'Crise e Regulação Imediata',
      icon: '🆘',
      subtitle: 'Acalmar e retomar controle',
      tone: 'crise',
      items: ['SOS Ansiedade','Respiração','Meditação','Mixer Sonoro','Yoga Nidra','Ho\'oponopono','Micro-tarefas'],
    },
    {
      name: 'Autoconhecimento',
      icon: '🧠',
      subtitle: 'Entender emoções e padrões',
      tone: 'terapia',
      items: ['Diário (RPD)','Diário de Humor','Solta Aqui','Carta Terapêutica','Gratidão','Psicoeducação','Falas Tóxicas','Dicionário Emocional','Destravar','Perfil de Regulação','Mapa Mental Emocional','Eu Mais Saudável','Cápsula do Tempo'],
    },
    {
      name: 'Rotina, Progresso e Consistência',
      icon: '📈',
      subtitle: 'Constância diária e evolução real',
      tone: 'progresso',
      items: ['Trilhas Temáticas','Missões','Meus Hábitos','Estatísticas','Calendário de Terapia'],
    },
    {
      name: 'Relacionamentos e Comunicação',
      icon: '💬',
      subtitle: 'Limites, diálogo e vínculos saudáveis',
      tone: 'relacoes',
      items: ['O Poder do NÃO','Método dos 5 Dedos','Linguagens do Amor','Modo Casal','Modo Família'],
    },
    {
      name: 'Comunidade e Expansão',
      icon: '🌍',
      subtitle: 'Conectar, compartilhar e crescer',
      tone: 'comunidade',
      items: [],
    },
    {
      name: 'Exploração e Desenvolvimento Pessoal',
      icon: '🧭',
      subtitle: 'Descobertas e desenvolvimento interno',
      tone: 'explorar',
      items: ['Abordagens psicológicas','Exploração Vocacional','Inteligência Emocional','Modo Arte','Mapa da Minha Vida'],
    },
  ];

  const bgPreview = conquestsBg;

  const presetGradient = () => {
    if (bgPreview.preset === 'aurora') return 'linear-gradient(135deg, #22d3ee, #6366f1, #a855f7)';
    if (bgPreview.preset === 'calm') return 'linear-gradient(135deg, #38bdf8, #3b82f6, #4f46e5)';
    if (bgPreview.preset === 'sunset') return 'linear-gradient(135deg, #fbbf24, #f97316, #f43f5e)';
    if (bgPreview.preset === 'forest') return 'linear-gradient(135deg, #10b981, #0d9488, #0891b2)';
    if (bgPreview.preset === 'lavender') return 'linear-gradient(135deg, #a78bfa, #c084fc, #f0abfc)';
    if (bgPreview.preset === 'ocean') return 'linear-gradient(135deg, #0ea5e9, #2563eb, #4338ca)';
    if (bgPreview.preset === 'rosegold') return 'linear-gradient(135deg, #fb7185, #f59e0b, #fcd34d)';
    if (bgPreview.preset === 'midnight') return 'linear-gradient(135deg, #0f172a, #1a152e, #251b3a)';
    return darkMode ? 'linear-gradient(135deg, #10101c, #1a152e, #251b3a)' : 'linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)';
  };

  const overlayAlpha = Math.max(0, Math.min(100, bgPreview.overlay || 55)) / 100;

  const lightOverlay = 0.12;
  const conquestsStyle: any =
    bgPreview.mode === 'color'
      ? {
          backgroundImage: darkMode
            ? `linear-gradient(rgba(10,10,20,${overlayAlpha}), rgba(10,10,20,${overlayAlpha})), linear-gradient(135deg, ${bgPreview.color1}, ${bgPreview.color2})`
            : `linear-gradient(rgba(255,255,255,${lightOverlay}), rgba(255,255,255,${lightOverlay})), linear-gradient(135deg, ${bgPreview.color1}, ${bgPreview.color2})`
        }
      : bgPreview.mode === 'image' && bgPreview.image
        ? {
            backgroundImage: darkMode
              ? `linear-gradient(rgba(10,10,20,${overlayAlpha}), rgba(10,10,20,${overlayAlpha})), url(${bgPreview.image})`
              : `linear-gradient(rgba(255,255,255,0.28), rgba(255,255,255,0.28)), url(${bgPreview.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { backgroundImage: darkMode ? `linear-gradient(rgba(10,10,20,${overlayAlpha}), rgba(10,10,20,${overlayAlpha})), ${presetGradient()}` : 'linear-gradient(135deg, #eef4ff 0%, #e9ecff 48%, #f8f7ff 100%)' };

  const toneClass = (tone: string) => {
    if (darkMode) {
      if (tone === 'crise') return 'from-[#2b1620] via-[#22131b] to-[#15131c] border-rose-900/45';
      if (tone === 'terapia') return 'from-[#172039] via-[#171d34] to-[#15141f] border-indigo-900/40';
      if (tone === 'progresso') return 'from-[#14261f] via-[#13221d] to-[#12171b] border-emerald-900/40';
      if (tone === 'relacoes') return 'from-[#2b1825] via-[#231722] to-[#17141b] border-pink-900/40';
      if (tone === 'comunidade') return 'from-[#132532] via-[#152130] to-[#121720] border-cyan-900/40';
      return 'from-[#2a1e16] via-[#241b16] to-[#171411] border-amber-900/40';
    }
    if (tone === 'crise') return 'from-[#fff8fa] via-[#fff4f7] to-[#fff8fb] border-rose-100';
    if (tone === 'terapia') return 'from-[#f7f8ff] via-[#f6f5ff] to-[#fbfaff] border-indigo-100';
    if (tone === 'progresso') return 'from-[#f6fcf8] via-[#f3fbf7] to-[#f8fcfb] border-emerald-100';
    if (tone === 'relacoes') return 'from-[#fff8fb] via-[#fff5f8] to-[#fff9fb] border-pink-100';
    if (tone === 'comunidade') return 'from-[#f5fcff] via-[#f2fbff] to-[#f7fcff] border-cyan-100';
    return 'from-[#fffaf4] via-[#fff7ef] to-[#fffbf6] border-amber-100';
  };

  const allCategoriesExpanded =
    categoryGroups.length > 0 && categoryGroups.every((group) => !!openCategories[group.name]);

  const setAllCategoriesOpen = (nextOpen: boolean) => {
    setForceAllCategoriesOpen(nextOpen);
    setOpenCategories(
      Object.fromEntries(categoryGroups.map((group) => [group.name, nextOpen])) as Record<string, boolean>,
    );
  };

  const toggleSingleCategory = (key: string) => {
    setForceAllCategoriesOpen(null);
    setOpenCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const safeFavoriteTabs = Array.isArray(favoriteTabs) ? favoriteTabs : [];
  const toggleFavorite = (tab: Tab) => {
    const id = String(tab);
    const nextFavorites = safeFavoriteTabs.includes(id)
      ? safeFavoriteTabs.filter((x) => x !== id)
      : [id, ...safeFavoriteTabs].slice(0, 4);
    setFavoriteTabs(nextFavorites);
    setHomeContinueState({
      lastTab: safeHomeContinueState.lastTab,
      lastParams: safeHomeContinueState.lastParams,
      mostUsedTab: safeHomeContinueState.mostUsedTab,
      pinnedTab: nextFavorites[0] || null,
    });
  };
  if (libraryOnly) {
      return (
        <LibraryHubSection
          darkMode={darkMode}
        hasUnlimitedAccess={hasUnlimitedAccess}
        librarySearch={librarySearch}
        setLibrarySearch={setLibrarySearch}
        autoCompleteSuggestions={autoCompleteSuggestions}
        features={features}
        searchResults={searchResults}
        categoryGroups={categoryGroups}
        forceAllCategoriesOpen={forceAllCategoriesOpen}
        setForceAllCategoriesOpen={setForceAllCategoriesOpen}
        openCategories={openCategories}
        setOpenCategories={setOpenCategories}
        safeFavoriteTabs={safeFavoriteTabs}
        favoriteLimitCardId={favoriteLimitCardId}
        setFavoriteLimitCardId={setFavoriteLimitCardId}
        toggleFavorite={toggleFavorite}
        openLibraryFeature={openLibraryFeature}
        lockedLibraryPreview={lockedLibraryPreview}
          setLockedLibraryPreview={setLockedLibraryPreview}
          toneClass={toneClass}
          onShowPlans={onShowPlans}
          desktopMode={desktopMode}
        />
      );
  }
  const quickAccessFallbackIds = ['meditation', 'breathing', 'mood', 'diary'];
  const quickAccessIds = [
    ...safeFavoriteTabs.slice(0, 4),
    ...quickAccessFallbackIds,
  ]
    .filter((id, index, arr) => arr.indexOf(id) === index)
    .slice(0, 4);
  const spotlightFeatures: Array<{ id: string; title: string; tab: Tab; icon: string; value: string | number; sub?: string; desc?: string }> =
    quickAccessIds
      .map((id) => panelOptions.find((item) => item.id === id))
      .filter((item): item is (typeof panelOptions)[number] => Boolean(item))
      .map((item) => ({
        ...item,
        desc: item.sub,
      }));
  const continueCandidates = panelOptions.filter((item) => !['home', 'login'].includes(String(item.tab)));
  const continueMap = new Map(continueCandidates.map((item) => [String(item.tab), item]));
  const nowHour = getBrazilHour(new Date());
  const latestDiaryEntry = diaryEntries[0];
  const latestSoltaEntry = soltaEntries[0];
  const latestWritingAt = [latestDiaryEntry?.createdAt, latestSoltaEntry?.createdAt]
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const hasRecentWriting = latestWritingAt ? Date.now() - new Date(latestWritingAt).getTime() < 1000 * 60 * 60 * 36 : false;
  const moodKey = String(todayMood?.primaryEmotion || '').toLowerCase();
  const moodIntensity = Number(todayMood?.intensity || 0);
  const noCheckInToday = !todayMood?.primaryEmotion;
  const belowDailyGoal = (todayMinutes || 0) < Math.max(8, Math.floor((dailyGoal || 0) * 0.5));
  const lowConsistency = (practiceStreak || 0) < 3;
  const suggestionRules: Array<{ when: boolean; tabs: Tab[] }> = [
    { when: noCheckInToday, tabs: ['mood', 'diary', 'solta'] },
    { when: moodIntensity >= 4 && /ansied|medo|p[nâ]nic|sobrecarreg|ang[úu]st/i.test(moodKey), tabs: ['sos', 'breathing', 'calm', 'meditation'] },
    { when: moodIntensity >= 4 && /raiva|irrita|estress|estresse|nervos/i.test(moodKey), tabs: ['breathing', 'meditation', 'assertiveness', 'solta'] },
    { when: moodIntensity >= 4 && /triste|vazio|sozinh|desanim|culpa|luto/i.test(moodKey), tabs: ['meditation', 'gratitude', 'chat', 'tracks'] },
    { when: hasRecentWriting, tabs: ['gratitude', 'chat', 'mindmap', 'healthymessages'] },
    { when: belowDailyGoal && nowHour >= 18, tabs: ['meditation', 'timer', 'yoga', 'sleep'] },
    { when: belowDailyGoal && nowHour < 18, tabs: ['microtasks', 'breathing', 'habits', 'missions'] },
    { when: lowConsistency, tabs: ['microtasks', 'habits', 'missions', 'stats'] },
    { when: nowHour >= 22 || nowHour < 5, tabs: ['sleep', 'yoga', 'timer', 'meditation'] },
    { when: nowHour >= 5 && nowHour < 11, tabs: ['mood', 'habits', 'breathing', 'meditation'] },
  ];
  const personalizedReason =
    noCheckInToday ? 'Pensado para o seu momento de hoje' :
    moodIntensity >= 4 && /ansied|medo|p[nâ]nic|sobrecarreg|ang[úu]st/i.test(moodKey) ? 'Escolhido pelo seu estado emocional atual' :
    moodIntensity >= 4 && /raiva|irrita|estress|estresse|nervos/i.test(moodKey) ? 'Sugerido pelo que você registrou hoje' :
    moodIntensity >= 4 && /triste|vazio|sozinh|desanim|culpa|luto/i.test(moodKey) ? 'Com base no que você está sentindo' :
    hasRecentWriting ? 'Com base no que você escreveu recentemente' :
    belowDailyGoal && nowHour >= 18 ? 'Pensado pelo seu ritmo e horário de hoje' :
    belowDailyGoal && nowHour < 18 ? 'Ajustado ao seu ritmo de cuidado' :
    lowConsistency ? 'Escolhido pelo seu momento de constância' :
    nowHour >= 22 || nowHour < 5 ? 'Sugestão alinhada ao seu horário atual' :
    nowHour >= 5 && nowHour < 11 ? 'Sugestão alinhada ao começo do seu dia' :
    'Personalizado com base no seu uso recente';
  const suggestionPool = [
    ...suggestionRules.filter((rule) => rule.when).flatMap((rule) => rule.tabs),
    'meditation',
    'breathing',
    'mood',
    'diary',
    'microtasks',
  ];
  const summarySuggestedTab =
    suggestionPool.find((tab) => continueMap.has(String(tab)) && tab !== 'stats') ||
    quickAccessIds.find((tab) => continueMap.has(String(tab))) ||
    'meditation';
  const continueBaseIds = [
    safeHomeContinueState.lastTab,
    mostUsedTab,
  ].filter((tab): tab is string => Boolean(tab) && continueMap.has(String(tab)));
  const suggestedTab =
    suggestionPool.find((tab) => continueMap.has(String(tab)) && !continueBaseIds.includes(String(tab)) && String(tab) !== String(summarySuggestedTab)) ||
    quickAccessIds.find((tab) => continueMap.has(String(tab)) && !continueBaseIds.includes(String(tab)) && String(tab) !== String(summarySuggestedTab)) ||
    null;
  const summaryAction =
    todayProgressPercent >= 100
      ? { tab: 'stats' as Tab, label: 'Dia concluído' }
      : todayProgressPercent > 0
        ? { tab: summarySuggestedTab as Tab, label: 'Continuar' }
        : !todayMood?.primaryEmotion
          ? { tab: 'mood' as Tab, label: 'Fazer check-in' }
          : { tab: summarySuggestedTab as Tab, label: 'Começar' };
  const meditationTitleById = useMemo(
    () =>
      Object.fromEntries(
        [...meditationDocRoutines, ...meditationComplementaryDocRoutines].map((routine) => [routine.id, routine.title]),
      ) as Record<string, string>,
    [],
  );
  const resolveContinuePresentation = useCallback((tab: string, params?: Record<string, any> | null) => {
    const baseItem = continueMap.get(String(tab));
    if (!baseItem) return null;

    if (String(tab) === 'breathing') {
      const exerciseId = typeof params?.exerciseId === 'string' ? params.exerciseId : null;
      if (exerciseId && BREATHING_CONTINUE_TITLES[exerciseId]) {
        return {
          title: BREATHING_CONTINUE_TITLES[exerciseId],
          sub: 'Respiração',
        };
      }
    }

    if (String(tab) === 'meditation') {
      if (params?.meditationMode === 'free') {
        return {
          title: 'Time Livre',
          sub: 'Meditação',
        };
      }
      const scriptId = typeof params?.scriptId === 'string' ? params.scriptId : null;
      if (scriptId && meditationTitleById[scriptId]) {
        return {
          title: meditationTitleById[scriptId],
          sub: 'Meditação',
        };
      }
    }

    if (String(tab) === 'diary') {
      if (params?.diaryMode === 'quick') return { title: 'Check-in rápido', sub: 'Diário (RPD)' };
      if (params?.diaryMode === 'full') return { title: 'Registro completo', sub: 'Diário (RPD)' };
    }

    if (String(tab) === 'mood') {
      const moodStepTitles: Record<number, string> = {
        0: 'Início do check-in',
        1: 'Nomear o humor',
        2: 'Roda das emoções',
        3: 'Intensidade e contexto',
        4: 'Leitura do momento',
        5: 'Roda de Plutchik',
        6: 'Me ajude a nomear',
        7: 'Métricas do ciclo',
      };
      if (typeof params?.moodStep === 'number' && moodStepTitles[params.moodStep]) {
        return {
          title: moodStepTitles[params.moodStep],
          sub: 'Diário de Humor',
        };
      }
    }

    if (String(tab) === 'vocacional') {
      const step = typeof params?.vocationalStep === 'string' ? params.vocationalStep : null;
      const stepTitles: Record<string, string> = {
        intro: 'Introdução',
        test: 'Teste vocacional',
        results: 'Resultados',
        history: 'Histórico',
      };
      if (step && stepTitles[step]) {
        return {
          title: stepTitles[step],
          sub: 'Exploração Vocacional',
        };
      }
    }

    if (String(tab) === 'fivefingers') {
      const step = typeof params?.fiveFingersStep === 'string' ? params.fiveFingersStep : null;
      const stepTitles: Record<string, string> = {
        intro: 'Introdução',
        thumb: 'Polegar',
        index: 'Indicador',
        middle: 'Médio',
        ring: 'Anelar',
        little: 'Mínimo',
        final: 'Síntese final',
      };
      if (step && stepTitles[step]) {
        return {
          title: stepTitles[step],
          sub: 'Método dos 5 Dedos',
        };
      }
    }

    return {
      title: baseItem.title,
      sub: baseItem.sub,
    };
  }, [continueMap, meditationTitleById]);
  const continuePrimary =
    (safeHomeContinueState.lastTab && continueMap.has(String(safeHomeContinueState.lastTab))
      ? { tab: String(safeHomeContinueState.lastTab), params: safeHomeContinueState.lastParams || {} }
      : null) ||
    (safeHomeContinueState.pinnedTab && continueMap.has(String(safeHomeContinueState.pinnedTab))
      ? { tab: String(safeHomeContinueState.pinnedTab), params: {} }
      : null) ||
    (quickAccessIds.find((tab) => continueMap.has(String(tab)))
      ? { tab: String(quickAccessIds.find((tab) => continueMap.has(String(tab)))), params: {} }
      : null);
  const continueCards = [
    continuePrimary
      ? { ...continuePrimary, role: 'Continue' }
      : null,
    mostUsedTab && continueMap.has(String(mostUsedTab))
      ? { tab: String(mostUsedTab), params: {}, role: 'Mais usada' }
      : null,
    suggestedTab && continueMap.has(String(suggestedTab))
      ? { tab: String(suggestedTab), params: {}, role: personalizedReason }
      : null,
  ]
    .filter((item): item is { tab: string; params: Record<string, any>; role: string } => Boolean(item))
    .filter((item, index, arr) => arr.findIndex((entry) => entry.tab === item.tab) === index);
  const continueFeatures = [
    ...continueCards.reduce<Array<{ id: string; title: string; tab: Tab; icon: string; value: string | number; sub?: string; desc?: string; role: string; params?: Record<string, any> }>>((acc, { tab, params, role }) => {
      const item = continueMap.get(tab);
      if (!item) return acc;
      const presentation = resolveContinuePresentation(tab, params);
      acc.push({
        ...item,
        title: presentation?.title || item.title,
        sub: presentation?.sub || item.sub,
        desc: presentation?.sub || item.sub,
        role,
        params,
      });
      return acc;
    }, []),
    ...spotlightFeatures.map((item) => ({
      ...item,
      role: 'Continue',
      params: undefined,
    })),
  ].filter((item, index, arr) => arr.findIndex((x) => String(x.tab) === String(item.tab)) === index).slice(0, 3);
  const ritualMap = new Map(panelOptions.map((item) => [String(item.tab), item]));
  const ritualAccessibleTabs = new Set(
    features
      .filter((feature) => hasUnlimitedAccess || !feature.hasUnlimitedAccess)
      .map((feature) => String(feature.tab)),
  );
  const isNightRitualWindow = nowHour >= 18 || nowHour < 5;
  const tabPreferenceRank = [
    ...safeFavoriteTabs,
    safeHomeContinueState.lastTab,
    safeHomeContinueState.mostUsedTab,
  ].filter((tab, index, arr): tab is string => Boolean(tab) && arr.indexOf(tab) === index);
  const pickRitualTab = (candidates: Tab[], used: string[]) => {
    const uniqueCandidates = candidates.filter((tab, index, arr) => arr.indexOf(tab) === index);
    const rankedCandidates = [...uniqueCandidates].sort((a, b) => {
      const aIndex = tabPreferenceRank.indexOf(String(a));
      const bIndex = tabPreferenceRank.indexOf(String(b));
      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;
      return safeA - safeB;
    });
    return rankedCandidates.find((tab) => ritualMap.has(String(tab)) && ritualAccessibleTabs.has(String(tab)) && !used.includes(String(tab)))
      || uniqueCandidates.find((tab) => ritualMap.has(String(tab)) && ritualAccessibleTabs.has(String(tab)) && !used.includes(String(tab)))
      || null;
  };
  const morningRitualStages: Array<{ role: string; tone: string; candidates: Tab[] }> = [
    {
      role: noCheckInToday ? 'Entender o momento' : 'Abrir o dia com clareza',
      tone: noCheckInToday ? 'Comece olhando para dentro antes de acelerar o dia.' : 'Antes de agir, vale alinhar o que você sente e o que precisa hoje.',
      candidates: noCheckInToday ? ['mood', 'diary', 'gratitude'] : ['mood', 'diary', 'gratitude'],
    },
    {
      role: moodIntensity >= 4 ? 'Regular primeiro' : 'Regular o corpo',
      tone: moodIntensity >= 4 ? 'Seu estado atual pede cuidado antes de qualquer cobrança.' : 'Um passo curto para corpo e mente entrarem no mesmo ritmo.',
      candidates: moodIntensity >= 4 ? ['breathing', 'meditation', 'sos', 'timer', 'mixer'] : ['breathing', 'meditation', 'timer', 'mixer', 'sos'],
    },
    {
      role: lowConsistency ? 'Retomar o ritmo' : 'Dar direção ao dia',
      tone: lowConsistency ? 'Feche o ritual com um compromisso simples e possível.' : 'Escolha uma continuação prática para o resto do dia.',
      candidates: lowConsistency ? ['habits', 'gratitude', 'diary'] : ['habits', 'gratitude', 'diary'],
    },
  ];
  const nightRitualStages: Array<{ role: string; tone: string; candidates: Tab[] }> = [
    {
      role: hasRecentWriting ? 'Fechar por dentro' : 'Descarregar o dia',
      tone: hasRecentWriting ? 'Você já se expressou hoje. Agora vale acolher e fechar o ciclo.' : 'Antes de pousar, solte um pouco do que ficou acumulado.',
      candidates: hasRecentWriting ? ['gratitude', 'diary', 'mood'] : ['diary', 'gratitude', 'mood'],
    },
    {
      role: moodIntensity >= 4 ? 'Desacelerar com cuidado' : 'Desacelerar',
      tone: moodIntensity >= 4 ? 'Hoje a noite pede regulação mais nítida antes do descanso.' : 'Reduza o ritmo e prepare corpo e mente para baixar o tom.',
      candidates: moodIntensity >= 4 ? ['breathing', 'meditation', 'yoga', 'timer', 'mixer'] : ['breathing', 'meditation', 'yoga', 'timer', 'mixer'],
    },
    {
      role: 'Pousar a noite',
      tone: 'Feche com o recurso que mais ajuda você a encerrar o dia com presença.',
      candidates: ['sleep', 'gratitude', 'timer'],
    },
  ];
  const ritualStagesBase = isNightRitualWindow ? nightRitualStages : morningRitualStages;
  const usedRitualTabs: string[] = [];
  const ritualSteps = ritualStagesBase
    .map((stage, index) => {
      const pickedTab = pickRitualTab(stage.candidates, usedRitualTabs);
      if (!pickedTab) return null;
      usedRitualTabs.push(String(pickedTab));
      const item = ritualMap.get(String(pickedTab));
      if (!item) return null;
      return {
        ...item,
        stageLabel: `Passo ${index + 1}`,
        stageRole: stage.role,
        stageTone: stage.tone,
      };
    })
    .filter((item): item is ((typeof panelOptions)[number] & { stageLabel: string; stageRole: string; stageTone: string }) => Boolean(item));
  const ritualLabel = isNightRitualWindow ? 'Ritual da noite' : 'Ritual da manhã';
  const ritualDescription = isNightRitualWindow
    ? moodIntensity >= 4
      ? 'Hoje a noite pede regulação primeiro e pouso depois.'
      : 'Feche o dia com desaceleração, presença e um pouso mais leve.'
    : noCheckInToday
      ? 'Comece o dia entendendo como você está e criando ritmo.'
      : 'Abra o dia com check-in, regulação e um passo simples de constância.';
  const homeFavoriteSummary = spotlightFeatures.slice(0, 4);
  const selectedInboxItem = inboxItems.find((item) => item.id === selectedInboxId) || null;
  const inboxTone = (item: HomeInboxItem) => {
    if (item.kind === 'mensagem') {
      return darkMode
        ? {
            shell: item.seen ? 'bg-violet-950/18 border-violet-500/12' : 'bg-violet-500/10 border-violet-400/25',
            badge: 'bg-violet-500/15 text-violet-200 border border-violet-400/20',
          }
        : {
            shell: item.seen ? 'bg-[linear-gradient(180deg,#ffffff_0%,#fbf8ff_100%)] border-violet-200' : 'bg-[linear-gradient(180deg,#faf5ff_0%,#ffffff_100%)] border-violet-300',
            badge: 'bg-violet-100 text-violet-700 border border-violet-200',
          };
    }
    if (item.kind === 'lembrete') {
      return darkMode
        ? {
            shell: item.seen ? 'bg-sky-950/18 border-sky-500/12' : 'bg-sky-500/10 border-sky-400/25',
            badge: 'bg-sky-500/15 text-sky-200 border border-sky-400/20',
          }
        : {
            shell: item.seen ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] border-sky-200' : 'bg-[linear-gradient(180deg,#eff8ff_0%,#ffffff_100%)] border-sky-300',
            badge: 'bg-sky-100 text-sky-700 border border-sky-200',
          };
    }
    return darkMode
      ? {
          shell: item.seen ? 'bg-emerald-950/18 border-emerald-500/12' : 'bg-emerald-500/10 border-emerald-400/25',
          badge: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20',
        }
      : {
          shell: item.seen ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fffb_100%)] border-emerald-200' : 'bg-[linear-gradient(180deg,#eefdf6_0%,#ffffff_100%)] border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        };
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-32">
      {showBirthdayCelebration && (
        <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-start justify-center p-4 pt-16" onClick={() => setShowBirthdayCelebration(false)}>
          <div className={`relative w-full max-w-xl rounded-[2rem] p-8 text-center border overflow-hidden ${darkMode ? 'bg-[#0f1828] border-cyan-900/30 text-slate-100' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute text-xl animate-[fallConfetti_3.4s_linear_infinite]"
                  style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 0.18}s` }}
                >
                  {['🎉', '✨', '🎊', '💛', '🩵'][i % 5]}
                </span>
              ))}
            </div>

            <div className="relative z-10">
              <p className="text-5xl mb-2">🎂</p>
              <h3 className={`text-3xl font-black ${darkMode ? 'text-yellow-300' : 'text-indigo-700'}`}>Feliz Aniversário!</h3>
              <p className={`mt-2 text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Hoje é seu dia! 🥳
              </p>
              <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Que seu novo ciclo venha leve, feliz e especial! ✨
              </p>
              <p className="text-6xl mt-4">🎂🎉🎈</p>
              <p className="text-2xl mt-2">🥳</p>
              <button onClick={() => setShowBirthdayCelebration(false)} className="mt-5 px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold">Continuar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fallConfetti {
          0% { transform: translateY(-18px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(460px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* Header Greeting */}
      <div className="pt-3 animate-fade-in">
        <div className="mb-5">
          <div className="min-w-0">
            <h1 className={`sereno-title whitespace-nowrap text-[clamp(1.7rem,6vw,2.35rem)] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{greetingText}{userName ? ` ${userName}` : ''}</h1>
          </div>
          <div className="mt-3 flex">
            <button
              onClick={() => onShowPlans()}
              className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden px-3 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.14em] active:scale-95 transition-all ${darkMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_10px_24px_rgba(79,70,229,0.18)]' : 'bg-indigo-600 text-white border border-indigo-600 shadow-[0_10px_24px_rgba(79,70,229,0.18)]'}`}
            >
              <span className={`pointer-events-none absolute inset-0 rounded-2xl ${darkMode ? 'bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_28%,rgba(255,255,255,0.16)_42%,transparent_62%)] animate-[serenoPlanSheen_3.8s_ease-in-out_infinite]' : 'bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.12)_28%,rgba(255,255,255,0.28)_42%,transparent_62%)] animate-[serenoPlanSheen_3.8s_ease-in-out_infinite]'}`} />
              <span className={`pointer-events-none absolute inset-[1px] rounded-[15px] ${darkMode ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_58%)]' : 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_58%)]'}`} />
              <SparklePremiumIcon className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10">{plansButtonLabel}</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes serenoPlanSheen {
          0% { transform: translateX(-135%); opacity: 0; }
          12% { opacity: 1; }
          52% { transform: translateX(135%); opacity: 1; }
          100% { transform: translateX(135%); opacity: 0; }
        }
      `}</style>


      {isBirthdayToday && (
        <button
          type="button"
          onClick={() => { playBirthdayPartyFx(); setShowBirthdayCelebration(true); }}
          className={`group w-full relative overflow-hidden rounded-[1.8rem] border px-5 py-5 text-left transition-all active:scale-[0.99] ${darkMode ? 'border-fuchsia-400/25 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.18),transparent_30%),linear-gradient(135deg,#111933_0%,#1a2149_54%,#251539_100%)] text-white shadow-[0_22px_48px_rgba(20,14,46,0.5)]' : 'border-amber-200/80 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.16),transparent_34%),linear-gradient(135deg,#fff8ea_0%,#fffdf7_52%,#fff4fb_100%)] text-slate-900 shadow-[0_18px_42px_rgba(251,191,36,0.16)]'}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className={`absolute inset-0 ${darkMode ? 'bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_32%,rgba(255,255,255,0.12)_46%,transparent_64%)] opacity-90 animate-[serenoPlanSheen_5.6s_ease-in-out_infinite]' : 'bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.34)_32%,rgba(255,255,255,0.62)_46%,transparent_64%)] opacity-80 animate-[serenoPlanSheen_5.6s_ease-in-out_infinite]'}`} />
            <div className={`absolute inset-[1px] rounded-[1.65rem] ${darkMode ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_58%)]' : 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.52),transparent_60%)]'}`} />
            <div className={`absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full blur-3xl ${darkMode ? 'bg-amber-300/14' : 'bg-amber-200/55'}`} />
            <div className={`absolute -right-5 bottom-0 h-24 w-24 rounded-full blur-3xl ${darkMode ? 'bg-fuchsia-400/18' : 'bg-fuchsia-200/55'}`} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.45rem] border text-[2rem] backdrop-blur-md ${darkMode ? 'border-white/10 bg-white/8 shadow-[0_10px_24px_rgba(0,0,0,0.22)]' : 'border-white/80 bg-white/80 shadow-[0_12px_24px_rgba(148,163,184,0.18)]'}`}>
              🎂
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'bg-amber-300/12 text-amber-200 border border-amber-300/20' : 'bg-amber-100/90 text-amber-800 border border-amber-200'}`}>
                  Dia especial
                </span>
              </div>
              <p className={`mt-3 text-[1.25rem] font-black leading-none tracking-[-0.03em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Feliz aniversário</p>
              <p className={`mt-2 text-[0.96rem] font-semibold leading-relaxed ${darkMode ? 'text-white/84' : 'text-slate-700'}`}>Hoje o dia é todo seu. Que ele seja leve, bonito e especial. ✨</p>
            </div>
          </div>
        </button>
      )}

      <section className={`relative overflow-hidden rounded-[2.1rem] border p-5 sm:p-6 shadow-[0_18px_38px_rgba(15,23,42,0.12)] ${darkMode ? 'border-cyan-900/40' : 'border-sky-100 bg-[radial-gradient(circle_at_top,#dff4ff_0%,transparent_38%),linear-gradient(135deg,#eef8ff_0%,#edf6ff_48%,#f7fbff_100%)]'}`} style={darkMode ? conquestsStyle : undefined}>
        <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${darkMode ? 'bg-cyan-400/12' : 'bg-sky-200/60'}`} />
        <div className="flex items-start justify-between gap-3">
          <div className="relative z-10">
            <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-indigo-200/85' : 'text-indigo-700/70'}`}>Resumo do dia</p>
            <h3 className={`mt-2 max-w-[10ch] text-[1.9rem] font-black leading-[1] tracking-[-0.04em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Seu ritmo de hoje</h3>
            {todayMood?.primaryEmotion ? (
              <p className={`mt-2.5 text-[14px] font-semibold leading-relaxed ${darkMode ? 'text-white/80' : 'text-slate-600'}`}>
                {`${todayMood.primaryEmotion} • intensidade ${todayMood.intensity}/5`}
              </p>
            ) : null}
          </div>
          <button
            onClick={() => onNavigate(summaryAction.tab)}
            className={`relative z-10 shrink-0 min-w-[146px] rounded-[1.35rem] px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] active:scale-95 transition-all ${darkMode ? 'bg-white/8 text-white border border-white/8' : 'bg-white/92 text-slate-900 border border-white shadow-sm'}`}
          >
            {summaryAction.label}
          </button>
        </div>

        <div className="relative z-10 mt-5">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em]">
            <span className={darkMode ? 'text-white/80' : 'text-slate-700'}>Meta diária</span>
            <span className={darkMode ? 'text-white' : 'text-slate-700'}>{formatPracticeMinutes(todayMinutes || 0)}/{todayGoalMinutes || 0} min</span>
          </div>
          <div className={`mt-2 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/15' : 'bg-slate-200'}`}>
            <div
              className="sereno-progress-trail h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
              style={{ width: `${todayProgressWidth}%` }}
            />
          </div>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-3 gap-3">
          <div className={`rounded-[1.35rem] border p-3.5 min-h-[98px] ${darkMode ? 'bg-white/7 border-white/8 text-white' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-700 shadow-sm'}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-white/65' : 'text-slate-500'}`}>Minutos</p>
            <p className={`mt-3 text-[2rem] font-black leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatPracticeMinutes(todayMinutes || 0)}</p>
          </div>
          <div className={`rounded-[1.35rem] border p-3.5 min-h-[98px] ${darkMode ? 'bg-white/7 border-white/8 text-white' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-700 shadow-sm'}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-white/65' : 'text-slate-500'}`}>Sequência</p>
            <p className={`mt-3 text-[2rem] font-black leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{hideStreaks ? '—' : (practiceSequenceCycleDays || 0)}</p>
          </div>
          <div className={`rounded-[1.35rem] border p-3.5 min-h-[98px] ${darkMode ? 'bg-white/7 border-white/8 text-white' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-700 shadow-sm'}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-white/65' : 'text-slate-500'}`}>Meta</p>
            <p className={`mt-3 text-[1.45rem] font-black leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {`${todayProgressPercent}%`}
            </p>
          </div>
        </div>
      </section>

      <section className={`rounded-[2rem] border p-4 sm:p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${darkMode ? 'bg-gradient-to-br from-slate-900/80 via-cyan-950/30 to-slate-900/80 border-white/6' : 'bg-[radial-gradient(circle_at_top_right,#d8f7f2_0%,transparent_32%),linear-gradient(135deg,#f1fcfa_0%,#e9fbff_55%,#f7fcff_100%)] border-cyan-100'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-cyan-200/85' : 'text-cyan-700'}`}>Rituais</p>
            <h3 className={`mt-1.5 text-[1.1rem] font-black tracking-[-0.025em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ritualLabel}</h3>
            <p className={`mt-1 text-[13px] leading-relaxed ${darkMode ? 'text-slate-300/85' : 'text-slate-600'}`}>{ritualDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(ritualSteps[0]?.tab || 'mood')}
            className={`group relative shrink-0 overflow-hidden rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-all ${darkMode ? 'bg-white/8 text-slate-100 border border-white/8' : 'bg-white text-slate-700 border border-slate-200 shadow-sm'}`}
          >
            <span className={`pointer-events-none absolute inset-0 ${darkMode ? 'bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.06)_28%,rgba(255,255,255,0.16)_42%,transparent_62%)] animate-[serenoPlanSheen_3.6s_ease-in-out_infinite]' : 'bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.18)_28%,rgba(255,255,255,0.34)_42%,transparent_62%)] animate-[serenoPlanSheen_3.6s_ease-in-out_infinite]'}`} />
            <span className="relative z-10 inline-flex items-center gap-2">
              <span>Começar</span>
              <span className={`inline-flex text-[13px] transition-transform duration-300 group-hover:translate-x-0.5 ${darkMode ? 'text-cyan-200' : 'text-cyan-700'}`}>→</span>
            </span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {ritualSteps.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.tab)}
              className={`rounded-[1.55rem] border p-4 min-h-[154px] text-left transition-all active:scale-[0.98] shadow-sm ${index === ritualSteps.length - 1 && ritualSteps.length % 2 === 1 ? 'col-span-2' : ''} ${darkMode ? 'bg-slate-900/88 border-white/6 text-slate-100' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-800'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[24px] leading-none ${darkMode ? 'bg-white/6 border border-white/8' : 'bg-white/85 border border-slate-200'}`}>{item.icon}</span>
                <span className={`inline-flex min-h-[30px] items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-white/6 text-slate-300 border border-white/8' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {item.stageLabel}
                </span>
              </div>
              <p className={`mt-3.5 text-[15px] font-black leading-tight tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
              <p className={`mt-1 text-[12px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-cyan-200/80' : 'text-cyan-700/80'}`}>{item.stageRole}</p>
              <p className={`mt-1 text-[12px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.stageTone}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${darkMode ? 'bg-gradient-to-br from-slate-900/80 via-cyan-950/30 to-slate-900/80 border-white/6' : 'bg-[radial-gradient(circle_at_top_right,#d8f7f2_0%,transparent_32%),linear-gradient(135deg,#f1fcfa_0%,#e9fbff_55%,#f7fcff_100%)] border-cyan-100'}`}>
        <div className="flex items-start gap-3">
          <div>
            <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-cyan-200/85' : 'text-cyan-700'}`}>Acesso Rápido</p>
            <p className={`mt-1.5 text-[13px] leading-relaxed ${darkMode ? 'text-slate-300/85' : 'text-slate-600'}`}>Seus favoritos mais próximos, com gestão completa no Perfil.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {homeFavoriteSummary.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.tab)}
              className={`rounded-[1.55rem] border p-4 text-left transition-all active:scale-[0.98] shadow-sm ${darkMode ? 'bg-slate-900/88 border-white/6 text-slate-100' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-800'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[24px] leading-none ${darkMode ? 'bg-white/6 border border-white/8' : 'bg-white/85 border border-slate-200'}`}>{item.icon}</span>
              </div>
              <p className={`mt-3.5 text-[15px] font-black leading-tight tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
              {item.sub ? (
                <p className={`mt-1 text-[12px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.sub}</p>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${darkMode ? 'bg-gradient-to-br from-slate-900/80 via-emerald-950/20 to-slate-900/80 border-white/6' : 'bg-[radial-gradient(circle_at_top_left,#e7f8da_0%,transparent_34%),linear-gradient(135deg,#f7fcf1_0%,#eefaf1_50%,#f3fbf7_100%)] border-emerald-100'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-emerald-200/85' : 'text-emerald-700'}`}>Continue</p>
            <h3 className={`mt-1.5 text-[1.1rem] font-black tracking-[-0.025em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Volte ao que faz mais sentido hoje</h3>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {continueFeatures.map((item, index) => (
            <button
              key={`continue-${item.id}`}
              onClick={() => onNavigate(item.tab, item.params)}
              className={`w-full rounded-[1.55rem] border p-4 text-left transition-all active:scale-[0.99] shadow-sm ${darkMode ? 'bg-slate-900/88 border-white/6 text-slate-100' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 text-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-[22px] leading-none ${darkMode ? 'bg-white/6 border border-white/8' : 'bg-white/80 border border-slate-200'}`}>{item.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-emerald-200/80' : 'text-emerald-700/80'}`}>
                      {item.role}
                    </p>
                    <p className={`text-[15px] font-black truncate tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                    {item.sub ? (
                      <p className={`mt-0.5 text-[12px] leading-relaxed truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.sub}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={`relative overflow-hidden rounded-[2rem] border px-5 py-5 shadow-[0_14px_28px_rgba(99,102,241,0.10)] ${darkMode ? 'bg-gradient-to-br from-fuchsia-950/25 via-indigo-950/20 to-cyan-950/15 border-fuchsia-900/40 text-slate-100' : 'bg-gradient-to-br from-fuchsia-50 via-indigo-50 to-cyan-50 border-fuchsia-200 text-slate-700'}`}>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,#a855f7,transparent_38%),radial-gradient(circle_at_bottom_left,#06b6d4,transparent_34%)]" />
        <div className="relative">
          <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-fuchsia-200/85' : 'text-fuchsia-700'}`}>Inspiração de hoje</p>
          <div className={`mt-4 relative rounded-[1.65rem] border p-5 pl-6 ${darkMode ? 'bg-white/6 border-white/10' : 'bg-white/75 border-white/70'} shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]`}>
            <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-full ${darkMode ? 'bg-fuchsia-400/80' : 'bg-fuchsia-500'}`} />
            <span className={`absolute left-4 top-3 text-4xl font-black leading-none ${darkMode ? 'text-white/10' : 'text-fuchsia-200'}`}>“</span>
            <p className={`pl-6 pr-2 text-[1.15rem] leading-[1.6] font-semibold tracking-[-0.015em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {quote?.text}
            </p>
          </div>
        </div>
      </section>

      <button
        onClick={() => onNavigate('esperanca')}
        className={`w-full relative overflow-hidden rounded-[1.9rem] border p-5 text-left shadow-[0_12px_24px_rgba(15,23,42,0.08)] active:scale-[0.99] transition-all ${darkMode ? 'bg-gradient-to-br from-pink-950/25 via-fuchsia-950/15 to-indigo-950/15 border-pink-900/40 text-slate-100' : 'bg-gradient-to-br from-pink-50 via-rose-50 to-indigo-50 border-pink-200 text-slate-800'}`}
      >
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,#fb7185,transparent_32%),radial-gradient(circle_at_bottom_right,#818cf8,transparent_34%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${darkMode ? 'bg-white/8 border-white/10' : 'bg-white/80 border-pink-100'}`}>
              💌
            </div>
            <div>
            <h3 className={`text-[1.08rem] font-black leading-tight tracking-[-0.025em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mural de Esperança</h3>
              <p className={`mt-1 text-sm font-medium ${darkMode ? 'text-slate-300/90' : 'text-slate-600'}`}>Leia ou envie apoio com delicadeza.</p>
            </div>
          </div>
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-white/10 text-pink-200' : 'bg-white text-pink-600 border border-pink-100'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </button>

      {inboxOpen && (
        <div className="fixed inset-0 z-[120] bg-black/50 p-4" onClick={() => setInboxOpen(false)}>
          <div className={`max-w-md mx-auto mt-16 rounded-[2rem] border max-h-[76vh] overflow-y-auto shadow-[0_24px_60px_rgba(15,23,42,0.3)] ${darkMode ? 'bg-[radial-gradient(circle_at_top,#1a3147_0%,transparent_42%),linear-gradient(180deg,#0f1828_0%,#132136_100%)] border-cyan-900/30 text-slate-100' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] border-slate-200 text-slate-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`sticky top-0 z-10 border-b px-4 py-4 backdrop-blur-xl ${darkMode ? 'bg-[#102033]/85 border-white/8' : 'bg-white/90 border-slate-200/90'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-sky-200' : 'text-sky-700'}`}>Central do app</p>
                  <h4 className="mt-1 text-[1.1rem] font-black tracking-[-0.02em]">Avisos</h4>
                  <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {unseenInboxCount > 0 ? `${unseenInboxCount} novo${unseenInboxCount === 1 ? '' : 's'} esperando por você.` : 'Tudo em dia por aqui.'}
                  </p>
                </div>
                <button onClick={() => setInboxOpen(false)} className={`h-10 w-10 shrink-0 rounded-2xl text-sm font-black ${darkMode ? 'bg-white/6 text-slate-200 border border-white/8' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                className={`text-[11px] px-2 py-1 rounded-lg font-bold ${darkMode ? 'bg-blue-500/20 border border-blue-400/20 text-blue-100' : 'bg-blue-600 text-white'}`}
                onClick={() => {
                  setAcknowledgedInboxIds((prev) => Array.from(new Set([...prev, ...inboxItems.map((item) => item.id)])));
                  setInboxItems((prev) => prev.map((item) => ({ ...item, seen: true })));
                }}
              >
                Marcar tudo como visto
              </button>
              <button className={`text-[11px] px-2 py-1 rounded-lg font-bold ${darkMode ? 'bg-red-900/40 text-red-200' : 'bg-red-100 text-red-700'}`} onClick={dismissAllInboxItems}>Excluir tudo</button>
            </div>
            <div className="space-y-2">
              {inboxItems.length === 0 && (
                <div className={`rounded-[1.5rem] border p-5 text-center ${darkMode ? 'bg-white/5 border-white/8 text-slate-300' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <p className="text-3xl">🔔</p>
                  <p className="mt-3 text-sm font-semibold">Sem avisos por enquanto.</p>
                </div>
              )}
              {orderedInboxItems.map((item) => (
                <div
                  key={item.id}
                  className={`w-full text-left p-3 rounded-[1.4rem] border transition-all ${inboxTone(item).shell}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedInboxId(item.id);
                        markInboxSeen(item.id);
                      }}
                      className="text-left flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${inboxTone(item).badge}`}>{item.kind}</span>
                        {!item.seen && <span className={`inline-flex h-2.5 w-2.5 rounded-full ${darkMode ? 'bg-white' : 'bg-slate-900'}`} />}
                      </div>
                      <p className="font-black text-[15px] mt-2 leading-tight">{item.title}</p>
                      <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <p className={`text-[13px] mt-2 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.id === selectedInboxId || selectedInboxItem?.id === item.id ? item.body : `${item.body}`}
                      </p>
                    </button>
                    <button onClick={() => dismissInboxItem(item.id)} className={`text-xs px-2.5 py-1.5 rounded-xl font-bold ${darkMode ? 'bg-white/6 text-slate-200 border border-white/8' : 'bg-white border border-slate-200 text-slate-600'}`}>Excluir</button>
                  </div>
                  {(item.actionTab || item.linkUrl) && (
                    <div className="mt-3 flex gap-2">
                      {item.actionTab && (
                        <button
                          onClick={() => {
                            markInboxSeen(item.id);
                            setInboxOpen(false);
                            if (!item.actionTab) return;
                            if (item.actionTab === 'plans') {
                              onShowPlans({
                                title: item.actionParams?.paywallReason?.title,
                                desc: item.actionParams?.paywallReason?.desc,
                                focus: item.actionParams?.focus,
                              });
                              return;
                            }
                            onNavigate(item.actionTab, item.actionParams);
                          }}
                          className={`text-xs px-3 py-2 rounded-xl font-black ${darkMode ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/20' : 'bg-indigo-600 text-white'}`}
                        >
                          Abrir agora
                        </button>
                      )}
                      {item.linkUrl && (
                        <button
                          onClick={() => {
                            markInboxSeen(item.id);
                            window.open(item.linkUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className={`text-xs px-3 py-2 rounded-xl font-black ${darkMode ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/20' : 'bg-cyan-600 text-white'}`}
                        >
                          Abrir link
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1">
            <p className={`text-[12px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Biblioteca do app</p>
            <div className={`mt-3 flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 ${darkMode ? 'bg-white/6 border-white/8' : 'bg-white/85 border-slate-200 shadow-sm'}`}>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>⌕</span>
              <input
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Buscar atividade ou recurso"
                className={`w-full bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`}
              />
            </div>
            {autoCompleteSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {autoCompleteSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setLibrarySearch(suggestion)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${darkMode ? 'bg-white/6 text-slate-200 border border-white/8' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setAllCategoriesOpen(!allCategoriesExpanded)} className={`shrink-0 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${darkMode ? 'bg-white/6 text-slate-300 border border-white/8' : 'bg-white/80 text-slate-600 border border-slate-200 shadow-sm'}`}>
            {allCategoriesExpanded ? 'Recolher' : 'Expandir'}
          </button>
        </div>
        {librarySearch ? (
          <div className="grid grid-cols-2 gap-3">
            {searchResults.length > 0 ? (
              searchResults.map((f) => {
                const fav = safeFavoriteTabs.includes(String(f.tab));
                const favoritesLimitReached = safeFavoriteTabs.length >= 4 && !fav;
                const showLimitHint = favoriteLimitCardId === String(f.tab);
                return (
                  <div
                    key={`search-${f.title}`}
                    onClick={(e) => openLibraryFeature(f, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openLibraryFeature(f, e.currentTarget as HTMLElement);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    data-card-glyph={f.icon}
                    data-allow-overflow="true"
                    className={`sereno-ornament-card group relative rounded-[1.6rem] text-left border overflow-visible shadow-sm transition-all duration-300 ${darkMode ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(10,15,24,0.94)_100%)] border-white/6' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] border-slate-200 hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]'}`}
                  >
                    <div className="w-full p-4 min-h-[132px] flex flex-col justify-between text-left">
                      <div className="relative flex items-start justify-between gap-2">
                        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[24px] leading-none transition-all ${darkMode ? 'bg-white/6 border border-white/6' : 'bg-slate-50 border border-slate-200/80 group-hover:bg-white'}`}>{f.icon}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (favoritesLimitReached) {
                              setFavoriteLimitCardId(String(f.tab));
                              return;
                            }
                            toggleFavorite(f.tab);
                          }}
                          className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-2xl border px-3 text-[18px] font-black leading-none transition-all ${
                            fav
                              ? darkMode
                                ? 'bg-amber-400/14 text-amber-300 border-amber-300/20'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                              : favoritesLimitReached
                                ? darkMode
                                  ? 'bg-slate-900/70 text-slate-500 border-slate-800/70'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                                : darkMode
                                  ? 'bg-white/6 text-slate-300 border-white/8 hover:bg-white/10'
                                  : 'bg-slate-200/90 text-slate-700 border-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.72)] hover:bg-slate-100 hover:text-amber-700'
                          }`}
                          aria-label={fav ? `Remover ${f.title} dos favoritos` : `Adicionar ${f.title} aos favoritos`}
                        >
                          {fav ? '★' : '☆'}
                        </button>
                      </div>
                      <div className="mt-3 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-[15px] font-black leading-tight tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{f.title}</p>
                          {f.hasUnlimitedAccess ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-400/20' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'}`}>
                              {f.previewMode === 'inline' ? 'Expande no Pro' : 'Exclusivo Pro'}
                            </span>
                          ) : null}
                        </div>
                        <p className={`mt-1 text-[12px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
                      </div>
                    </div>
                    {showLimitHint && (
                      <div className={`absolute right-3 top-3 z-20 w-[12.5rem] max-w-[calc(100vw-4rem)] translate-y-12 rounded-[1.15rem] border p-3 shadow-xl ${darkMode ? 'bg-[#0c2841] border-cyan-900/40 text-cyan-50' : 'bg-cyan-50 border-cyan-200 text-cyan-900'}`}>
                        <p className="text-[12px] font-black uppercase tracking-[0.12em]">Limite de favoritos</p>
                        <p className="mt-1 text-[13px] leading-relaxed whitespace-normal break-words">Você pode salvar até 4. Remova um favorito atual para escolher outro.</p>
                      </div>
                    )}
                    {lockedLibraryPreview?.key === String(f.tab) && (
                      <div
                          className={`absolute z-30 w-[17.25rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border p-5 shadow-[0_22px_55px_rgba(15,23,42,0.28)] top-full mt-2 ${
                          lockedLibraryPreview.alignX === 'right' ? 'right-0' : 'left-0'
                        } ${
                          darkMode
                            ? 'bg-[linear-gradient(180deg,rgba(22,14,40,0.98)_0%,rgba(12,11,28,0.99)_100%)] border-fuchsia-500/20 text-slate-100'
                            : 'bg-[linear-gradient(180deg,#fff7fe_0%,#ffffff_100%)] border-fuchsia-200 text-slate-800'
                        }`}
                      >
                        <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.14),transparent_32%)]' : 'bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.12),transparent_34%)]'}`} />
                        <div className="relative flex items-start gap-4 pr-12">
                          <div className="flex items-start gap-4">
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border text-[28px] ${darkMode ? 'bg-white/8 border-white/10' : 'bg-white border-fuchsia-100 shadow-sm'}`}>
                              {lockedLibraryPreview.icon || '💎'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-[0.76rem] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-fuchsia-300' : 'text-fuchsia-600'}`}>Exclusivo no Pro</p>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/20' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'}`}>
                                  Veja antes de desbloquear
                                </span>
                              </div>
                              <h3 className={`mt-2 text-[1.3rem] font-black leading-tight tracking-[-0.03em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {lockedLibraryPreview.title}
                              </h3>
                              <p className={`mt-2 text-[14px] font-semibold leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                {lockedLibraryPreview.desc || 'Esse recurso faz parte da camada Pro do Sereno.'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLockedLibraryPreview(null);
                            }}
                            aria-label="Fechar prévia premium"
                            className={`absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-[18px] font-black ${darkMode ? 'bg-white/6 text-slate-200 border-white/10' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}
                          >
                            ×
                          </button>
                        </div>
                        {lockedLibraryPreview.highlights?.length ? (
                          <div className="relative mt-4 grid gap-2.5">
                            {lockedLibraryPreview.highlights.map((item) => (
                              <div
                                key={item}
                                className={`flex items-start gap-2 rounded-2xl border px-3.5 py-3 text-[12px] font-semibold leading-relaxed ${
                                  darkMode
                                    ? 'bg-white/5 border-white/8 text-slate-200'
                                    : 'bg-white/80 border-fuchsia-100 text-slate-700'
                                }`}
                              >
                                <span className={`${darkMode ? 'text-fuchsia-300' : 'text-fuchsia-600'}`}>•</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="relative mt-4 flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShowPlans({
                                title: lockedLibraryPreview.title,
                                desc: `Desbloqueie ${lockedLibraryPreview.title} e os outros recursos completos do Sereno Pro.`,
                                focus: 'comparison',
                              });
                              setLockedLibraryPreview(null);
                            }}
                            className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 text-[14px] font-black ${darkMode ? 'bg-fuchsia-500 text-white shadow-[0_12px_24px_rgba(217,70,239,0.28)]' : 'bg-fuchsia-600 text-white shadow-[0_12px_24px_rgba(192,38,211,0.22)]'}`}
                          >
                            Desbloquear no Pro
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLockedLibraryPreview(null);
                            }}
                            className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 text-[14px] font-black ${darkMode ? 'bg-white/6 text-slate-200 border border-white/10' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                          >
                            Depois eu vejo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={`col-span-2 rounded-[1.6rem] border p-5 text-sm ${darkMode ? 'bg-white/6 border-white/8 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                Nenhum recurso próximo foi encontrado para essa busca.
              </div>
            )}
          </div>
        ) : (
          <>
        {categoryGroups.map((group) => {
          const key = group.name;
          const open = !!openCategories[key];
          const groupFeatures = features.filter((f) => group.items.includes(f.title)).filter((f) =>
            fuzzyMatch(librarySearch, f.title, f.desc || '', group.name, group.subtitle),
          );
          const visibleFeatures = open ? groupFeatures : [];
          const remainingCount = groupFeatures.length;
          if (!groupFeatures.length) return null;
          return (
            <div key={group.name} className={`rounded-[2.05rem] border overflow-visible shadow-[0_14px_30px_rgba(15,23,42,0.09)] bg-gradient-to-br ${toneClass(group.tone)} ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <button
                onClick={() => toggleSingleCategory(key)}
                className="w-full p-5 min-h-[114px] flex items-center justify-between gap-4 text-left"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-13 h-13 shrink-0 rounded-[1.15rem] flex items-center justify-center text-[24px] border ${darkMode ? 'bg-white/8 border-white/10' : 'bg-white/85 border-white/75 shadow-sm'}`}>
                    {group.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[1.2rem] font-black leading-tight tracking-[-0.03em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{group.name}</p>
                    <p className={`mt-1 text-[13px] leading-relaxed ${darkMode ? 'text-slate-300/85' : 'text-slate-600'}`}>{group.subtitle}</p>
                  </div>
                </div>
                <span className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm transition-transform ${open ? '' : 'rotate-180'} ${darkMode ? 'bg-white/6 text-slate-300 border border-white/8' : 'bg-white/80 text-slate-700 border border-white/70 shadow-sm'}`}>⌃</span>
              </button>

              <div className="px-4 pb-4">
                {open && (
                  <div className="grid grid-cols-2 gap-3">
                    {visibleFeatures.map((f) => {
                      const fav = safeFavoriteTabs.includes(String(f.tab));
                      const favoritesLimitReached = safeFavoriteTabs.length >= 4 && !fav;
                      const showLimitHint = favoriteLimitCardId === String(f.tab);
                      return (
                        <div
                          key={f.title}
                          onClick={(e) => openLibraryFeature(f, e.currentTarget)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openLibraryFeature(f, e.currentTarget as HTMLElement);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          data-card-glyph={f.icon}
                          data-allow-overflow="true"
                          className={`sereno-ornament-card group relative rounded-[1.6rem] text-left border overflow-visible shadow-sm transition-all duration-300 ${darkMode ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.88)_0%,rgba(10,15,24,0.94)_100%)] border-white/6' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] border-slate-200 hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]'}`}
                        >
                          <div className="w-full p-4 min-h-[132px] flex flex-col justify-between text-left">
                            <div className="relative flex items-start justify-between gap-2">
                              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[24px] leading-none transition-all ${darkMode ? 'bg-white/6 border border-white/6' : 'bg-slate-50 border border-slate-200/80 group-hover:bg-white'}`}>{f.icon}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (favoritesLimitReached) {
                                    setFavoriteLimitCardId(String(f.tab));
                                    return;
                                  }
                                  toggleFavorite(f.tab);
                                }}
                                className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-2xl border px-3 text-[18px] font-black leading-none transition-all ${
                                  fav
                                    ? darkMode
                                      ? 'bg-amber-400/14 text-amber-300 border-amber-300/20'
                                      : 'bg-amber-50 text-amber-600 border-amber-200'
                                    : favoritesLimitReached
                                      ? darkMode
                                        ? 'bg-white/5 text-slate-500 border-white/8 opacity-55 cursor-not-allowed'
                                        : 'bg-slate-100 text-slate-300 border-slate-200 opacity-70 cursor-not-allowed'
                                    : darkMode
                                      ? 'bg-white/6 text-slate-300 border-white/8 hover:bg-white/10 active:scale-95'
                                      : 'bg-slate-200/90 text-slate-700 border-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.72)] hover:bg-slate-100 hover:text-slate-900 active:scale-95'
                                }`}
                                aria-label={
                                  favoritesLimitReached
                                    ? `Limite de 4 favoritos atingido para ${f.title}`
                                    : fav
                                      ? `Remover ${f.title} dos favoritos`
                                      : `Favoritar ${f.title}`
                                }
                              >
                                {fav ? '★' : '☆'}
                              </button>
                            </div>
                            <div className="text-left mt-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-[14px] font-black leading-tight tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{f.title}</p>
                                {f.hasUnlimitedAccess ? (
                                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-400/20' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'}`}>
                                    {f.previewMode === 'inline' ? 'Expande no Pro' : 'Exclusivo Pro'}
                                  </span>
                                ) : null}
                              </div>
                              <p className={`text-[12px] mt-1.5 leading-relaxed ${darkMode ? 'text-slate-300/80' : 'text-slate-500'}`}>{f.desc}</p>
                            </div>
                            {showLimitHint && (
                              <div className={`absolute left-3 right-3 top-full mt-2 z-20 rounded-2xl border p-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.18)] ${
                                darkMode
                                  ? 'bg-[#102033] border-cyan-900/30 text-slate-100'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}>
                                <p className={`text-[12px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Limite de favoritos</p>
                                <p className={`mt-2 text-[13px] leading-relaxed whitespace-normal break-words ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                  Você pode salvar até 4. Remova um favorito atual para escolher outro.
                                </p>
                              </div>
                            )}
                            {lockedLibraryPreview?.key === String(f.tab) && (
                              <div
                                className={`absolute z-30 w-[17.25rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2rem] border p-5 shadow-[0_22px_55px_rgba(15,23,42,0.28)] top-full mt-2 ${
                                  lockedLibraryPreview.alignX === 'right' ? 'right-0' : 'left-0'
                                } ${
                                  darkMode
                                    ? 'bg-[linear-gradient(180deg,rgba(22,14,40,0.98)_0%,rgba(12,11,28,0.99)_100%)] border-fuchsia-500/20 text-slate-100'
                                    : 'bg-[linear-gradient(180deg,#fff7fe_0%,#ffffff_100%)] border-fuchsia-200 text-slate-800'
                                }`}
                              >
                                <div className={`absolute inset-0 ${darkMode ? 'bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.14),transparent_32%)]' : 'bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.12),transparent_34%)]'}`} />
                                <div className="relative flex items-start gap-4 pr-12">
                                  <div className="flex items-start gap-4">
                                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] border text-[28px] ${darkMode ? 'bg-white/8 border-white/10' : 'bg-white border-fuchsia-100 shadow-sm'}`}>
                                      {lockedLibraryPreview.icon || '💎'}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className={`text-[0.76rem] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-fuchsia-300' : 'text-fuchsia-600'}`}>Exclusivo no Pro</p>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${darkMode ? 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/20' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'}`}>
                                          Veja antes de desbloquear
                                        </span>
                                      </div>
                                      <h3 className={`mt-2 text-[1.3rem] font-black leading-tight tracking-[-0.03em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {lockedLibraryPreview.title}
                                      </h3>
                                      <p className={`mt-2 text-[14px] font-semibold leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {lockedLibraryPreview.desc || 'Esse recurso faz parte da camada Pro do Sereno.'}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLockedLibraryPreview(null);
                                    }}
                                    aria-label="Fechar prévia premium"
                                    className={`absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-[18px] font-black ${darkMode ? 'bg-white/6 text-slate-200 border-white/10' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}
                                  >
                                    ×
                                  </button>
                                </div>
                                {lockedLibraryPreview.highlights?.length ? (
                                  <div className="relative mt-4 grid gap-2.5">
                                    {lockedLibraryPreview.highlights.map((item) => (
                                      <div
                                        key={item}
                                        className={`flex items-start gap-2 rounded-2xl border px-3.5 py-3 text-[12px] font-semibold leading-relaxed ${
                                          darkMode
                                            ? 'bg-white/5 border-white/8 text-slate-200'
                                            : 'bg-white/80 border-fuchsia-100 text-slate-700'
                                        }`}
                                      >
                                        <span className={`${darkMode ? 'text-fuchsia-300' : 'text-fuchsia-600'}`}>•</span>
                                        <span>{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                <div className="relative mt-4 flex items-center gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onShowPlans({
                                        title: lockedLibraryPreview.title,
                                        desc: `Desbloqueie ${lockedLibraryPreview.title} e os outros recursos completos do Sereno Pro.`,
                                        focus: 'comparison',
                                      });
                                      setLockedLibraryPreview(null);
                                    }}
                                    className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 text-[14px] font-black ${darkMode ? 'bg-fuchsia-500 text-white shadow-[0_12px_24px_rgba(217,70,239,0.28)]' : 'bg-fuchsia-600 text-white shadow-[0_12px_24px_rgba(192,38,211,0.22)]'}`}
                                  >
                                    Desbloquear no Pro
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLockedLibraryPreview(null);
                                    }}
                                    className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl px-4 text-[14px] font-black ${darkMode ? 'bg-white/6 text-slate-200 border border-white/10' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                                  >
                                    Depois eu vejo
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!open && remainingCount > 0 && (
                  <button
                    onClick={() => {
                      setForceAllCategoriesOpen(null);
                      setOpenCategories((prev: Record<string, boolean>) => ({ ...prev, [key]: true }));
                    }}
                    className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-black ${darkMode ? 'bg-white/6 text-slate-300 border border-white/8' : 'bg-white text-slate-700 border border-slate-200 shadow-sm'}`}
                  >
                    Ver {remainingCount} recursos
                  </button>
                )}
              </div>
            </div>
          );
        })}
          </>
        )}
      </section>

      <button
        onClick={() => onNavigate('suggestions')}
        className={`w-full relative overflow-hidden rounded-[1.9rem] border p-5 text-left shadow-[0_12px_24px_rgba(15,23,42,0.08)] active:scale-[0.99] transition-all ${darkMode ? 'bg-gradient-to-br from-cyan-950/30 via-sky-950/25 to-indigo-950/25 border-cyan-800/40 text-slate-100' : 'bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50 border-cyan-200 text-slate-800'}`}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#22d3ee,transparent_34%),radial-gradient(circle_at_bottom_left,#6366f1,transparent_32%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${darkMode ? 'bg-white/8 border-white/10' : 'bg-white/80 border-cyan-100'}`}>
              💡
            </div>
            <div>
              <h3 className={`text-[1.08rem] font-black leading-tight tracking-[-0.025em] ${darkMode ? 'text-white' : 'text-slate-900'}`}>Sugestões</h3>
              <p className={`mt-1 text-sm font-medium ${darkMode ? 'text-slate-300/90' : 'text-slate-600'}`}>Ideias e melhorias para o app.</p>
            </div>
          </div>
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-white/10 text-cyan-200' : 'bg-white text-cyan-600 border border-cyan-100'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </button>

    </div>
  );
}



function SosAnxietySection({ onNavigate, darkMode: dm }: { onNavigate: (t: Tab, params?: any) => void, darkMode?: boolean }) {
  return (
    <div className={`p-4 animate-fade-in pb-32 ${dm ? 'text-slate-100' : 'text-gray-800'}`}>
      <div className="max-w-lg mx-auto mb-8 pt-4">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Crise e regulação"
          title="SOS Ansiedade"
          description="Ferramentas rápidas para baixar a ativação, se orientar no momento e voltar ao corpo."
          icon="🆘"
        />
      </div>

      <div className="space-y-5 max-w-lg mx-auto">
        <button
          onClick={() => onNavigate('breathing', { exerciseId: '333', from: 'sos' })}
          data-card-glyph="🌬️"
          className={`sereno-ornament-card w-full p-6 rounded-3xl flex items-center justify-between transition-all duration-300 active:scale-95 text-left border shadow-sm hover:shadow-md group relative overflow-hidden ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-md' : 'bg-white border-blue-50 hover:border-blue-100'}`}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors duration-500 ${dm ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-blue-500/5 group-hover:bg-blue-500/10'}`}></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 duration-300 ${dm ? 'bg-slate-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
              🌬️
            </div>
            <div>
              <h3 className={`font-extrabold text-lg mb-0.5 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Respiração 3-3-3</h3>
              <p className={`text-sm font-medium ${dm ? 'text-blue-400' : 'text-blue-600'}`}>Anti-Ansiedade e Pânico</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${dm ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
          </div>
        </button>

        <button
          onClick={() => onNavigate('calm')}
          data-card-glyph="🧘"
          className={`sereno-ornament-card w-full p-6 rounded-3xl flex items-center justify-between transition-all duration-300 active:scale-95 text-left border shadow-sm hover:shadow-md group relative overflow-hidden ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-md' : 'bg-white border-pink-50 hover:border-pink-100'}`}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors duration-500 ${dm ? 'bg-pink-500/10 group-hover:bg-pink-500/20' : 'bg-pink-500/5 group-hover:bg-pink-500/10'}`}></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 duration-300 ${dm ? 'bg-slate-700' : 'bg-gradient-to-br from-pink-50 to-rose-50'}`}>
              🌍
            </div>
            <div>
              <h3 className={`font-extrabold text-lg mb-0.5 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Aterramento 5-4-3-2-1</h3>
              <p className={`text-sm font-medium ${dm ? 'text-pink-400' : 'text-pink-600'}`}>Volte para o momento presente</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${dm ? 'bg-slate-700 text-pink-400' : 'bg-pink-50 text-pink-600'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
          </div>
        </button>

        <button
          onClick={() => onNavigate('acalmese')}
          data-card-glyph="📓"
          className={`sereno-ornament-card w-full p-6 rounded-3xl flex items-center justify-between transition-all duration-300 active:scale-95 text-left border shadow-sm hover:shadow-md group relative overflow-hidden ${dm ? 'bg-slate-800/80 border-slate-700 backdrop-blur-md' : 'bg-white border-teal-50 hover:border-teal-100'}`}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors duration-500 ${dm ? 'bg-teal-500/10 group-hover:bg-teal-500/20' : 'bg-teal-500/5 group-hover:bg-teal-500/10'}`}></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 duration-300 ${dm ? 'bg-slate-700' : 'bg-gradient-to-br from-teal-50 to-emerald-50'}`}>
              🧠
            </div>
            <div>
              <h3 className={`font-extrabold text-lg mb-0.5 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>A.C.A.L.M.E.-S.E.</h3>
              <p className={`text-sm font-medium ${dm ? 'text-teal-400' : 'text-teal-600'}`}>Enfrente a crise sem resistir</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${dm ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"></path></svg>
          </div>
        </button>

        <div className={`pt-6 mt-8 border-t ${dm ? 'border-slate-800' : 'border-gray-100'}`}>
          <button
            onClick={() => onNavigate('home', { forceInsomnia: true })}
            className={`w-full p-5 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 text-center font-bold border ${dm ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/60 shadow-sm' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100 shadow-sm'}`}
          >
            <span className="text-2xl filter drop-shadow-sm">🌙</span>
            Módulo Noturno SOS Insônia
          </button>
        </div>

        <div className={`pt-4 mt-4 border-t ${dm ? 'border-slate-800' : 'border-gray-100'}`}>
          <button
            onClick={() => onNavigate('safety')}
            className={`w-full p-5 rounded-3xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 text-center font-extrabold border ${dm ? 'bg-red-900/40 text-red-100 border-red-500/30 hover:bg-red-900/60 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-red-600 text-white border-red-500 hover:bg-red-700 shadow-[0_10px_20px_rgba(220,38,38,0.3)]'}`}
          >
            <span className="text-2xl filter drop-shadow-md">🚨</span>
            PLANO DE EMERGÊNCIA & CVV 188
          </button>
        </div>
      </div>
    </div>
  );
}// ==================== CALM SECTION (5-4-3-2-1 Technique) ====================
function CalmSection({ onNavigateBack, darkMode: dm, initialStep, onStepChange, onComplete }: { onNavigateBack?: () => void, darkMode?: boolean, initialStep?: number, onStepChange?: (step: number) => void, onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(initialStep ?? -1);

  useEffect(() => {
    if (initialStep !== undefined && initialStep !== currentStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  const changeStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (onStepChange) onStepChange(newStep);
  };
  const [inputs, setInputs] = useState<string[]>(['', '', '', '', '']);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { sense: 'VER', count: 5, emoji: '👁️', color: 'from-blue-200 to-indigo-300', darkColor: 'from-blue-900 to-indigo-900', instruction: 'Olhe ao redor e nomeie 5 coisas que você pode VER' },
    { sense: 'TOCAR', count: 4, emoji: '✋', color: 'from-green-200 to-emerald-300', darkColor: 'from-emerald-900 to-green-900', instruction: 'Toque e nomeie 4 coisas que você pode TOCAR' },
    { sense: 'OUVIR', count: 3, emoji: '👂', color: 'from-yellow-200 to-amber-300', darkColor: 'from-amber-900 to-yellow-900', instruction: 'Escute e nomeie 3 coisas que você pode OUVIR' },
    { sense: 'CHEIRAR', count: 2, emoji: '👃', color: 'from-pink-200 to-rose-300', darkColor: 'from-rose-900 to-pink-900', instruction: 'Identifique 2 coisas que você pode CHEIRAR' },
    { sense: 'SABOREAR', count: 1, emoji: '👅', color: 'from-purple-200 to-fuchsia-300', darkColor: 'from-purple-900 to-fuchsia-900', instruction: 'Identifique 1 coisa que você pode SABOREAR' },
  ];

  const startExercise = () => {
    changeStep(0);
    setInputs(['', '', '', '', '']);
    setIsComplete(false);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      changeStep(currentStep + 1);
    } else {
      onComplete?.();
      setIsComplete(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      changeStep(currentStep - 1);
    }
  };

  const resetExercise = () => {
    changeStep(-1);
    setInputs(['', '', '', '', '']);
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <div className={`h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-6 animate-fade-in ${dm ? 'bg-gradient-to-b from-slate-900 to-purple-950' : 'bg-gradient-to-b from-pink-50 to-purple-100'}`}>
        <div className="text-center relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>
          <span className="text-7xl mb-6 block animate-bounce filter drop-shadow-lg relative z-10">🎉</span>
          <h2 className={`text-4xl font-extrabold mb-3 tracking-tight relative z-10 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>Parabéns!</h2>
          <p className={`font-medium mb-10 text-lg relative z-10 ${dm ? 'text-slate-300' : 'text-gray-600'}`}>Você completou a técnica de Aterramento!</p>
        </div>

        <div className={`backdrop-blur-xl rounded-[2rem] p-8 max-w-sm w-full mb-10 shadow-lg border relative z-10 ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-white'}`}>
          <h3 className={`font-bold mb-6 text-center text-lg ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Seu resumo:</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className={`pb-4 last:pb-0 last:border-0 border-b ${dm ? 'border-slate-700' : 'border-gray-100'}`}>
                <p className={`text-sm font-bold tracking-wide uppercase flex items-center gap-2 mb-1.5 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
                  <span className="text-lg">{step.emoji}</span> {step.sense}
                </p>
                <p className={`font-medium ${dm ? 'text-slate-200' : 'text-gray-800'}`}>{inputs[index] || <span className="text-gray-400 italic">Nada listado</span>}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={resetExercise}
          className={`px-10 py-5 w-full max-w-sm rounded-3xl font-extrabold shadow-lg hover:shadow-xl transition-all active:scale-95 text-white ${dm ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-[0_0_20px_rgba(192,38,211,0.3)]' : 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_10px_20px_rgba(217,70,239,0.3)]'}`}
        >
          Fazer Novamente
        </button>
      </div>
    );
  }

  if (currentStep === -1) {
    return (
      <div className="p-4 animate-fade-in max-w-lg mx-auto pb-32">
        {/* Redundant back button removed */}
        <div className="text-center mb-8 pt-4">
          <h2 className={`text-4xl font-extrabold tracking-tight mb-2 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>Aterramento</h2>
          <p className={`font-medium ${dm ? 'text-slate-400' : 'text-gray-600'}`}>Técnica 5-4-3-2-1 para redução de ansiedade</p>
        </div>

        <div className={`backdrop-blur-xl rounded-[2rem] p-8 border shadow-sm mb-8 ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`font-extrabold text-xl mb-4 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>Como funciona:</h3>
          <p className={`leading-relaxed mb-6 font-medium ${dm ? 'text-slate-300' : 'text-gray-600'}`}>
            Esta técnica de grounding ajuda a trazer você de volta ao momento presente,
            reduzindo sentimentos de ansiedade e estresse.
          </p>
          <div className="space-y-5">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${dm ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  {step.emoji}
                </div>
                <span className={`font-bold ${dm ? 'text-slate-300' : 'text-gray-700'}`}>{step.count} coisas que você pode <span className={`uppercase font-extrabold ${dm ? 'text-pink-400' : 'text-pink-600'}`}>{step.sense}</span></span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={startExercise}
          className={`w-full py-5 text-white rounded-3xl font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 ${dm ? 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-[0_0_20px_rgba(192,38,211,0.3)]' : 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_10px_20px_rgba(217,70,239,0.3)]'}`}
        >
          Começar Exercício
        </button>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className={`h-[calc(100vh-5rem)] flex flex-col p-4 animate-fade-in ${dm ? 'bg-slate-900' : 'bg-gradient-to-b from-pink-50 to-purple-100'}`}>
      {/* Progress */}
      <div className="flex gap-2 mb-10 pt-6 max-w-md mx-auto w-full">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${index <= currentStep ? (dm ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-gradient-to-r from-pink-500 to-purple-500') : (dm ? 'bg-slate-800' : 'bg-gray-200/50')
              }`}
          />
        ))}
      </div>

      {/* Current Step */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-50 bg-gradient-to-br ${dm ? step.darkColor : step.color}`}></div>
        <div className={`w-36 h-36 rounded-[2.5rem] bg-gradient-to-br ${dm ? step.darkColor : step.color} flex items-center justify-center mb-8 animate-float shadow-2xl relative z-10 border-4 ${dm ? 'border-slate-800' : 'border-white'}`}>
          <span className="text-6xl filter drop-shadow-md">{step.emoji}</span>
        </div>

        <h2 className={`text-6xl font-black mb-2 animate-scale-in relative z-10 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>{step.count}</h2>
        <p className={`text-2xl font-bold tracking-tight mb-6 relative z-10 ${dm ? 'text-slate-300' : 'text-gray-600'}`}>coisas que você pode <span className={`uppercase text-transparent bg-clip-text bg-gradient-to-r ${dm ? 'from-pink-400 to-purple-400' : 'from-pink-600 to-purple-600'}`}>{step.sense}</span></p>

        <p className={`text-center font-medium mb-8 max-w-xs relative z-10 text-lg ${dm ? 'text-slate-400' : 'text-gray-600'}`}>{step.instruction}</p>

        <div className="w-full max-w-sm relative z-10">
          <textarea
            value={inputs[currentStep]}
            onChange={(e) => {
              const newInputs = [...inputs];
              newInputs[currentStep] = e.target.value;
              setInputs(newInputs);
            }}
            placeholder={`Liste ${step.count} coisas aqui...`}
            className={`w-full p-5 rounded-3xl border focus:outline-none focus:ring-4 focus:ring-purple-500/50 min-h-[140px] resize-none transition-all shadow-sm text-lg font-medium ${dm ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-white text-gray-800 placeholder-gray-400'}`}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pb-8 max-w-md mx-auto w-full">
        {currentStep > 0 && (
          <button onClick={prevStep} className={`flex-1 py-4 rounded-2xl border font-bold transition-all active:scale-95 ${dm ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white'}`}>
            Voltar
          </button>
        )}
        <button
          onClick={nextStep}
          className={`${currentStep > 0 ? 'flex-[2]' : 'w-full'} py-4 rounded-2xl text-white font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 ${dm ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
        >
          {currentStep === 4 ? 'Finalizar' : 'Próximo Passo'}
        </button>
      </div>
    </div>
  );
}

// ==================== A.C.A.L.M.E.-S.E. SECTION ====================
function AcalmeseSection({ onNavigateBack, darkMode: dm, initialStep, onStepChange, onComplete }: { onNavigateBack?: () => void, darkMode?: boolean, initialStep?: number, onStepChange?: (step: number) => void, onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(initialStep ?? -1);

  useEffect(() => {
    if (initialStep !== undefined && initialStep !== currentStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  const changeStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (onStepChange) onStepChange(newStep);
  };
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      letter: 'A',
      title: 'ACEITE a sua ansiedade',
      emoji: '🤝',
      color: 'from-blue-200 to-indigo-300', darkColor: 'from-blue-900 to-indigo-900',
      description: 'Aceite as sensações no seu corpo como aceitaria um visitante inesperado. Não lute contra elas — resistir prolonga e intensifica o desconforto. Aceitar não é desistir, é permitir-se sentir sem julgamento.',
      action: 'Diga para si: "Eu aceito o que estou sentindo agora. Isso vai passar."',
    },
    {
      letter: 'C',
      title: 'CONTEMPLE as coisas ao redor',
      emoji: '👀',
      color: 'from-green-200 to-emerald-300', darkColor: 'from-emerald-900 to-green-900',
      description: 'Tire o foco de dentro de si e observe o ambiente externo. Descreva mentalmente o que você vê: cores, formas, objetos. Lembre-se: você não é a sua ansiedade.',
      action: 'Olhe ao redor e descreva 3 objetos em detalhes: cor, textura, tamanho.',
    },
    {
      letter: 'A',
      title: 'AJA com sua ansiedade',
      emoji: '🚶',
      color: 'from-yellow-200 to-amber-300', darkColor: 'from-amber-900 to-yellow-900',
      description: 'Continue fazendo o que estava fazendo, mesmo que em ritmo mais lento. Não fuja da situação — se fugir, a ansiedade pode baixar, mas o medo aumentará e voltará mais forte.',
      action: 'Mantenha-se ativo. Diminua o ritmo se precisar, mas não pare.',
    },
    {
      letter: 'L',
      title: 'LIBERE o ar dos pulmões',
      emoji: '🌬️',
      color: 'from-cyan-200 to-blue-300', darkColor: 'from-cyan-900 to-blue-900',
      description: 'Respire devagar: inspire pelo nariz contando até 3 e expire pela boca contando até 6. Deixe o ar ir para o abdômen. Não sopre — deixe o ar sair suavemente.',
      action: 'Faça 5 respirações lentas agora: inspire (1-2-3) → expire (1-2-3-4-5-6).',
    },
    {
      letter: 'M',
      title: 'MANTENHA os passos anteriores',
      emoji: '🔄',
      color: 'from-purple-200 to-fuchsia-300', darkColor: 'from-purple-900 to-fuchsia-900',
      description: 'Continue repetindo: aceite, contemple, aja e respire. Continue até que a ansiedade diminua para um nível confortável. E ela vai diminuir.',
      action: 'Repita mentalmente: Aceitar → Contemplar → Agir → Respirar.',
    },
    {
      letter: 'E',
      title: 'EXAMINE seus pensamentos',
      emoji: '🔍',
      color: 'from-orange-200 to-red-300', darkColor: 'from-orange-900 to-red-900',
      description: 'Observe o que você está dizendo para si mesmo. Esses pensamentos são verdadeiros? Você tem provas? Há outras maneiras de entender a situação? Lembre-se: você está apenas ansioso(a) — é desagradável, mas vai passar.',
      action: 'Pergunte: "O que penso é um fato ou uma interpretação?"',
    },
    {
      letter: 'S',
      title: 'SORRIA, você conseguiu!',
      emoji: '😊',
      color: 'from-pink-200 to-rose-300', darkColor: 'from-rose-900 to-pink-900',
      description: 'Você está conseguindo se acalmar sozinho(a)! Reconheça essa conquista. Não é uma vitória contra um inimigo — é a compreensão de um visitante de hábitos estranhos que agora você sabe receber.',
      action: 'Dê um sorriso genuíno. Você merece reconhecimento.',
    },
    {
      letter: 'E',
      title: 'ESPERE o futuro com aceitação',
      emoji: '🌅',
      color: 'from-teal-200 to-cyan-300', darkColor: 'from-teal-900 to-cyan-900',
      description: 'Não espere nunca mais sentir ansiedade — ela é natural e atinge todos. Ao invés disso, surpreenda-se com a forma como você acabou de lidar com ela. Agora você sabe o caminho.',
      action: 'Confie: se acontecer de novo, você saberá o que fazer.',
    },
  ];

  const startExercise = () => {
    changeStep(0);
    setIsComplete(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      changeStep(currentStep + 1);
    } else {
      onComplete?.();
      setIsComplete(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      changeStep(currentStep - 1);
    }
  };

  const resetExercise = () => {
    changeStep(-1);
    setIsComplete(false);
  };

  // ---- Completion Screen ----
  if (isComplete) {
    return (
      <div className={`h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-6 animate-fade-in ${dm ? 'bg-gradient-to-b from-slate-900 to-teal-950' : 'bg-gradient-to-b from-teal-50 to-cyan-100'}`}>
        <div className="text-center relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl"></div>
          <span className="text-7xl mb-6 block animate-bounce filter drop-shadow-lg relative z-10">🎉</span>
          <h2 className={`text-4xl font-extrabold mb-3 tracking-tight relative z-10 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>Parabéns!</h2>
          <p className={`font-medium mb-4 text-lg relative z-10 ${dm ? 'text-slate-300' : 'text-gray-600'}`}>Você completou a técnica A.C.A.L.M.E.-S.E!</p>
          <p className={`text-sm mb-10 max-w-sm relative z-10 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>
            Você conseguiu se acalmar usando seus próprios recursos.
            Lembre-se: a ansiedade é um visitante — agora você sabe como recebê-lo.
          </p>
        </div>

        <div className={`backdrop-blur-xl rounded-[2rem] p-6 max-w-sm w-full mb-10 shadow-lg border relative z-10 ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-white'}`}>
          <h3 className={`font-bold mb-4 text-center text-sm uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Resumo dos passos:</h3>
          <div className="grid grid-cols-4 gap-3">
            {steps.map((step, i) => (
              <div key={i} className={`flex flex-col items-center justify-center p-3 rounded-2xl ${dm ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-2xl block mb-1">{step.emoji}</span>
                <p className={`text-sm font-black ${dm ? 'text-teal-400' : 'text-teal-600'}`}>{step.letter}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={resetExercise}
          className={`px-10 py-5 w-full max-w-sm rounded-3xl font-extrabold shadow-lg hover:shadow-xl transition-all active:scale-95 text-white ${dm ? 'bg-gradient-to-r from-teal-600 to-cyan-600 shadow-[0_0_20px_rgba(13,148,136,0.3)]' : 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-[0_10px_20px_rgba(20,184,166,0.3)]'}`}
        >
          Fazer Novamente
        </button>
      </div>
    );
  }

  // ---- Intro Screen ----
  if (currentStep === -1) {
    return (
      <div className="p-4 animate-fade-in overflow-y-auto pb-32 max-w-lg mx-auto">
        {/* Redundant back button removed */}
        <div className="text-center mb-8 pt-4">
          <span className="text-6xl mb-4 block filter drop-shadow-md">🧠</span>
          <h2 className={`text-4xl font-extrabold tracking-tight mb-2 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>A.C.A.L.M.E.-S.E.</h2>
          <p className={`font-medium ${dm ? 'text-slate-400' : 'text-gray-600'}`}>Técnica da Terapia Cognitivo-Comportamental</p>
        </div>

        <div className={`backdrop-blur-xl rounded-[2rem] p-6 border shadow-sm mb-5 animate-slide-up ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`font-extrabold text-lg mb-3 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>📖 O que é?</h3>
          <p className={`text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-gray-600'}`}>
            A técnica A.C.A.L.M.E.-S.E. é uma estratégia da Psicoterapia Cognitivo-Comportamental
            criada para ajudar no manejo de crises de ansiedade ou angústia. Cada letra representa
            um passo prático para lidar com situações percebidas como ameaçadoras.
          </p>
          <p className={`text-xs mt-4 italic ${dm ? 'text-slate-500' : 'text-gray-400'}`}>
            Adaptada por Bernard Rangé (UFRJ) de Beck, Emery e Greenberg (1985).
          </p>
        </div>

        <div className={`rounded-[2rem] p-6 border mb-5 animate-slide-up ${dm ? 'bg-slate-800/60 border-teal-900/50' : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100'}`} style={{ animationDelay: '0.05s' }}>
          <h3 className={`font-extrabold text-lg mb-4 ${dm ? 'text-teal-200' : 'text-teal-900'}`}>🔤 Os 8 Passos</h3>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm font-black text-lg ${dm ? 'bg-slate-700 text-teal-400' : 'bg-white text-teal-600'}`}>
                  {step.letter}
                </div>
                <span className={`font-bold ${dm ? 'text-slate-300' : 'text-gray-700'}`}>{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-[2rem] p-6 border mb-5 animate-slide-up ${dm ? 'bg-emerald-900/20 border-emerald-900/50' : 'bg-green-50 border-green-100'}`} style={{ animationDelay: '0.1s' }}>
          <h3 className={`font-extrabold text-lg mb-3 ${dm ? 'text-emerald-300' : 'text-emerald-800'}`}>✨ Quando usar?</h3>
          <ul className="space-y-3">
            <li className={`flex items-start gap-3 text-sm font-medium ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
              <span className="text-emerald-500 mt-0.5">✓</span> Crises de ansiedade ou pânico
            </li>
            <li className={`flex items-start gap-3 text-sm font-medium ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
              <span className="text-emerald-500 mt-0.5">✓</span> Momentos de angústia intensa
            </li>
            <li className={`flex items-start gap-3 text-sm font-medium ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
              <span className="text-emerald-500 mt-0.5">✓</span> Situações percebidas como ameaçadoras
            </li>
            <li className={`flex items-start gap-3 text-sm font-medium ${dm ? 'text-slate-300' : 'text-gray-700'}`}>
              <span className="text-emerald-500 mt-0.5">✓</span> Quando sentir que está perdendo o controle
            </li>
          </ul>
        </div>

        <div className={`rounded-[2rem] p-5 border mb-8 animate-slide-up ${dm ? 'bg-amber-900/20 border-amber-900/50' : 'bg-amber-50 border-amber-100'}`} style={{ animationDelay: '0.15s' }}>
          <p className={`text-sm font-medium leading-relaxed ${dm ? 'text-amber-300/80' : 'text-amber-800'}`}>💡 Você pode praticar sozinho(a) a qualquer momento. A técnica funciona por autoaplicação — não precisa de ajuda externa.</p>
        </div>

        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-50">
          <button
            onClick={startExercise}
            className={`w-full py-5 text-white rounded-3xl font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 ${dm ? 'bg-gradient-to-r from-teal-600 to-cyan-600 shadow-[0_0_20px_rgba(13,148,136,0.3)]' : 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-[0_10px_20px_rgba(20,184,166,0.3)]'}`}
          >
            ▶️ Iniciar Técnica
          </button>
        </div>
      </div>
    );
  }

  // ---- Step-by-step Screen ----
  const step = steps[currentStep];

  return (
    <div className={`h-[calc(100vh-5rem)] flex flex-col p-4 animate-fade-in ${dm ? 'bg-slate-900' : 'bg-gradient-to-b from-teal-50 to-cyan-100'}`}>
      {/* Progress */}
      <div className="flex gap-1.5 mb-6 pt-6 max-w-md mx-auto w-full">
        {steps.map((s, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`h-2 w-full rounded-full transition-all duration-500 ${index <= currentStep ? (dm ? 'bg-gradient-to-r from-teal-500 to-cyan-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-gradient-to-r from-teal-500 to-cyan-500') : (dm ? 'bg-slate-800' : 'bg-gray-200/50')
                }`}
            />
            <span className={`text-xs font-black transition-colors ${index <= currentStep ? (dm ? 'text-teal-400' : 'text-teal-600') : (dm ? 'text-slate-600' : 'text-gray-400')}`}>
              {s.letter}
            </span>
          </div>
        ))}
      </div>

      {/* Current Step */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-50 bg-gradient-to-br ${dm ? step.darkColor : step.color}`}></div>

        <div className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${dm ? step.darkColor : step.color} flex items-center justify-center mb-8 animate-float shadow-2xl relative z-10 border-4 ${dm ? 'border-slate-800' : 'border-white'}`}>
          <span className="text-5xl filter drop-shadow-md">{step.emoji}</span>
        </div>

        <div className={`backdrop-blur-xl rounded-full px-6 py-2.5 mb-6 shadow-sm relative z-10 border ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-white'}`}>
          <p className={`text-sm font-black tracking-wide ${dm ? 'text-teal-400' : 'text-teal-700'}`}>{step.letter} — <span className={dm ? 'text-slate-200' : 'text-gray-800'}>{step.title}</span></p>
        </div>

        <div className={`rounded-[2rem] p-6 max-w-sm w-full mb-5 shadow-sm relative z-10 border ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-base leading-relaxed font-medium ${dm ? 'text-slate-300' : 'text-gray-600'}`}>{step.description}</p>
        </div>

        <div className={`rounded-2xl p-5 max-w-sm w-full relative z-10 border ${dm ? 'bg-teal-900/20 border-teal-900/50' : 'bg-teal-50 border-teal-100'}`}>
          <p className={`text-sm font-bold flex gap-3 ${dm ? 'text-teal-300' : 'text-teal-800'}`}>
            <span className="text-xl">👉</span>
            <span className="mt-0.5">{step.action}</span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 pb-8 max-w-md mx-auto w-full relative z-20">
        {currentStep > 0 && (
          <button onClick={prevStep} className={`flex-1 py-4 rounded-3xl border font-bold transition-all active:scale-95 ${dm ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white'}`}>
            Voltar
          </button>
        )}
        <button
          onClick={nextStep}
          className={`${currentStep > 0 ? 'flex-[2]' : 'w-full'} py-4 rounded-3xl text-white font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 ${dm ? 'bg-gradient-to-r from-teal-600 to-cyan-600' : 'bg-gradient-to-r from-teal-500 to-cyan-500'}`}
        >
          {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo Passo'}
        </button>
      </div>
    </div>
  );
}

// ==================== DIARY SECTION (Diário de Emoções) ====================
function DiarySection({ diaryEntries, setDiaryEntries }: { diaryEntries: EmotionEntry[]; setDiaryEntries: (value: EmotionEntry[]) => void }) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [situation, setSituation] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [emotion, setEmotion] = useState('');
  const [customEmotion, setCustomEmotion] = useState('');
  const [level, setLevel] = useState(5);
  const [feelings, setFeelings] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const emotionOptions = [
    { label: 'Ansiedade', emoji: '😰' },
    { label: 'Tristeza', emoji: '😢' },
    { label: 'Raiva', emoji: '😠' },
    { label: 'Medo', emoji: '😨' },
    { label: 'Alegria', emoji: '😊' },
    { label: 'Frustração', emoji: '😤' },
    { label: 'Vergonha', emoji: '😳' },
    { label: 'Culpa', emoji: '😔' },
    { label: 'Solidão', emoji: '🥺' },
    { label: 'Esperança', emoji: '🌟' },
    { label: 'Gratidão', emoji: '🙏' },
    { label: 'Amor', emoji: '❤️' },
    { label: 'Outra', emoji: '💭' },
  ];

  const saveEntry = () => {
    if (!situation.trim() || (!emotion && !customEmotion.trim())) return;

    const newEntry: EmotionEntry = {
      id: Date.now().toString(),
      situation: situation.trim(),
      date,
      time,
      emotion: emotion === 'Outra' ? customEmotion.trim() : emotion,
      level,
      feelings: feelings.trim(),
      createdAt: new Date().toISOString(),
    };

    setDiaryEntries([newEntry, ...diaryEntries]);
    resetForm();
    setView('list');
  };

  const deleteEntry = (id: string) => {
    setDiaryEntries(diaryEntries.filter(e => e.id !== id));
  };

  const resetForm = () => {
    setSituation('');
    setDate(new Date().toISOString().split('T')[0]);
    const now = new Date();
    setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    setEmotion('');
    setCustomEmotion('');
    setLevel(5);
    setFeelings('');
  };

  const getLevelColor = (lvl: number) => {
    if (lvl <= 3) return 'text-green-600';
    if (lvl <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLevelLabel = (lvl: number) => {
    if (lvl === 0) return 'Nenhuma';
    if (lvl <= 2) return 'Leve';
    if (lvl <= 4) return 'Moderada';
    if (lvl <= 6) return 'Considerável';
    if (lvl <= 8) return 'Intensa';
    return 'Extrema';
  };

  const getEmotionEmoji = (emotionName: string) => {
    const found = emotionOptions.find(e => e.label === emotionName);
    return found ? found.emoji : '💭';
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // ---- FORM VIEW ----
  if (view === 'form') {
    return (
      <div className="p-4 animate-fade-in overflow-y-auto pb-24">
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button
            onClick={() => { resetForm(); setView('list'); }}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Novo Registro</h2>
        </div>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <label className="text-sm text-gray-600 font-medium block mb-2">📅 Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <label className="text-sm text-gray-600 font-medium block mb-2">🕐 Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Situation */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">📍 Situação</label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Descreva brevemente a situação que ocorreu..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[80px] resize-none text-sm"
            />
          </div>

          {/* Emotion Selection */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-3">💭 Que emoção você sentiu?</label>
            <div className="grid grid-cols-3 gap-2">
              {emotionOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { setEmotion(opt.label); if (opt.label !== 'Outra') setCustomEmotion(''); }}
                  className={`px-2 py-2 rounded-xl text-xs font-medium transition-all ${emotion === opt.label
                    ? 'bg-amber-100 border-2 border-amber-400 text-amber-800 scale-105'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span className="text-lg block">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            {emotion === 'Outra' && (
              <input
                type="text"
                value={customEmotion}
                onChange={(e) => setCustomEmotion(e.target.value)}
                placeholder="Qual emoção?"
                className="w-full mt-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            )}
          </div>

          {/* Emotion Level */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">
              📊 Nível da Emoção: <span className={`font-bold ${getLevelColor(level)}`}>{level}/10</span>
              <span className="text-gray-400 ml-2">({getLevelLabel(level)})</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full mt-2 accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 - Nenhuma</span>
              <span>10 - Extrema</span>
            </div>
          </div>

          {/* Physical/Psychological Feelings */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">🧠🫀 Como se sentiu? (psicológica ou fisicamente)</label>
            <textarea
              value={feelings}
              onChange={(e) => setFeelings(e.target.value)}
              placeholder="Ex: coração acelerado, tensão muscular, pensamentos negativos, dificuldade de concentração..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px] resize-none text-sm"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4">
          <button
            onClick={saveEntry}
            disabled={!situation.trim() || (!emotion && !customEmotion.trim())}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            💾 Salvar Registro
          </button>
        </div>
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="p-4 animate-fade-in overflow-y-auto pb-24">
      <div className="text-center mb-6 pt-4">
        <h2 className="text-2xl font-bold text-gray-800">Diário de Emoções</h2>
        <p className="text-gray-600 mt-2">Registre e acompanhe suas emoções</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { resetForm(); setView('form'); }}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Registro
        </button>
        {diaryEntries.length > 0 && (
          <button
            onClick={() => {
              const content = diaryEntries.map(e => [
                { label: 'Data/Hora', value: `${e.date.split('-').reverse().join('/')} as ${e.time}` },
                { label: 'Situacao', value: e.situation },
                { label: 'Emocao', value: `${e.emotion} (${e.level}/10)` },
                { label: 'Como se sentiu', value: e.feelings },
              ]);
              generatePDF('Diario de Emocoes', content);
            }}
            className="px-4 bg-white border border-gray-200 rounded-2xl text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50"
          >
            📄 PDF
          </button>
        )}
      </div>

      {diaryEntries.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">{diaryEntries.length} registro{diaryEntries.length !== 1 ? 's' : ''}</p>
      )}

      {diaryEntries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center animate-slide-up">
          <span className="text-5xl block mb-4">📓</span>
          <h3 className="font-semibold text-gray-800 mb-2">Nenhum registro ainda</h3>
          <p className="text-sm text-gray-500">
            Comece a registrar suas emoções para acompanhar seus padrões emocionais ao longo do tempo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {diaryEntries.map((entry, index) => {
            const isExpanded = expandedEntry === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <button
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  className="w-full p-4 text-left flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <span className="text-2xl">{getEmotionEmoji(entry.emotion)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800 truncate">{entry.emotion}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.level <= 3 ? 'bg-green-100 text-green-700' :
                        entry.level <= 6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {entry.level}/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(entry.date)} às {entry.time}
                    </p>
                  </div>
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 animate-fade-in">
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">📍 Situação</p>
                        <p className="text-sm text-gray-700">{entry.situation}</p>
                      </div>
                      {entry.feelings && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">🧠 Como se sentiu</p>
                          <p className="text-sm text-gray-700">{entry.feelings}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">📊 Intensidade</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${entry.level <= 3 ? 'bg-green-500' :
                              entry.level <= 6 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                            style={{ width: `${entry.level * 10}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${getLevelColor(entry.level)}`}>{entry.level}/10</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors mt-2"
                      >
                        🗑️ Excluir registro
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 bg-amber-50 rounded-2xl p-4 border border-amber-100">
        <p className="text-sm text-amber-800">
          💡 Registrar suas emoções ajuda a identificar padrões e gatilhos emocionais.
          Tente fazer ao menos um registro por dia.
        </p>
      </div>
    </div>
  );
}

// ==================== PDF UTILITY ====================
async function generatePDF(title: string, content: { label: string; value: string }[][]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  content.forEach((entry, index) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Registro ${index + 1}`, 14, y);
    y += 8;

    entry.forEach(field => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${field.label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(field.value || '-', pageWidth - 35);
      doc.text(lines, 14, y + 5);
      y += 5 + (lines.length * 5);
    });
    y += 8;
    doc.setDrawColor(200);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==================== RPD SECTION (Registro de Pensamentos) ====================
function RPDSection({ thoughtRecords, setThoughtRecords }: { thoughtRecords: ThoughtRecord[]; setThoughtRecords: (value: ThoughtRecord[]) => void }) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [situation, setSituation] = useState('');
  const [automaticThought, setAutomaticThought] = useState('');
  const [emotion, setEmotion] = useState('');
  const [emotionLevel, setEmotionLevel] = useState(5);
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [alternativeThought, setAlternativeThought] = useState('');
  const [newEmotionLevel, setNewEmotionLevel] = useState(3);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });

  const saveRecord = () => {
    if (!situation.trim() || !automaticThought.trim()) return;
    const record: ThoughtRecord = {
      id: Date.now().toString(), date, time,
      situation: situation.trim(), automaticThought: automaticThought.trim(),
      emotion: emotion.trim(), emotionLevel, evidenceFor: evidenceFor.trim(),
      evidenceAgainst: evidenceAgainst.trim(), alternativeThought: alternativeThought.trim(),
      newEmotionLevel, createdAt: new Date().toISOString(),
    };
    setThoughtRecords([record, ...thoughtRecords]);
    resetForm();
    setView('list');
  };

  const resetForm = () => {
    setSituation(''); setAutomaticThought(''); setEmotion(''); setEmotionLevel(5);
    setEvidenceFor(''); setEvidenceAgainst(''); setAlternativeThought(''); setNewEmotionLevel(3);
    setDate(new Date().toISOString().split('T')[0]);
    const now = new Date();
    setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
  };

  const deleteRecord = (id: string) => setThoughtRecords(thoughtRecords.filter(r => r.id !== id));

  const exportPDF = () => {
    const content = thoughtRecords.map(r => [
      { label: 'Data/Hora', value: `${r.date.split('-').reverse().join('/')} as ${r.time}` },
      { label: 'Situacao', value: r.situation },
      { label: 'Pensamento Automatico', value: r.automaticThought },
      { label: 'Emocao', value: `${r.emotion} (${r.emotionLevel}/10)` },
      { label: 'Evidencias a Favor', value: r.evidenceFor },
      { label: 'Evidencias Contra', value: r.evidenceAgainst },
      { label: 'Pensamento Alternativo', value: r.alternativeThought },
      { label: 'Novo Nivel da Emocao', value: `${r.newEmotionLevel}/10` },
    ]);
    generatePDF('Registro de Pensamentos Disfuncionais', content);
  };

  const formatDate = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
  const getLevelColor = (l: number) => l <= 3 ? 'text-green-600' : l <= 6 ? 'text-yellow-600' : 'text-red-600';

  if (view === 'form') {
    return (
      <div className="p-4 animate-fade-in overflow-y-auto pb-24">
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button onClick={() => { resetForm(); setView('list'); }} className="p-2 rounded-xl hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">Novo Registro de Pensamento</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <label className="text-sm text-gray-600 font-medium block mb-2">📅 Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <label className="text-sm text-gray-600 font-medium block mb-2">🕐 Hora</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">📍 1. Situação</label>
            <p className="text-xs text-gray-400 mb-2">O que aconteceu? Onde você estava? Com quem?</p>
            <textarea value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="Descreva a situação..." className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[70px] resize-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">💭 2. Pensamento Automático</label>
            <p className="text-xs text-gray-400 mb-2">O que passou pela sua cabeça naquele momento?</p>
            <textarea value={automaticThought} onChange={(e) => setAutomaticThought(e.target.value)} placeholder="Qual foi o pensamento?" className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[70px] resize-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">😢 3. Emoção</label>
            <input type="text" value={emotion} onChange={(e) => setEmotion(e.target.value)} placeholder="Ex: ansiedade, tristeza, raiva..." className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
            <label className="text-sm text-gray-600 font-medium block mt-3 mb-1">Intensidade: <span className={`font-bold ${getLevelColor(emotionLevel)}`}>{emotionLevel}/10</span></label>
            <input type="range" min="0" max="10" value={emotionLevel} onChange={(e) => setEmotionLevel(Number(e.target.value))} className="w-full accent-rose-500" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">✅ 4. Evidências a FAVOR do pensamento</label>
            <p className="text-xs text-gray-400 mb-2">Que fatos apoiam esse pensamento?</p>
            <textarea value={evidenceFor} onChange={(e) => setEvidenceFor(e.target.value)} placeholder="O que confirma esse pensamento?" className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[60px] resize-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">❌ 5. Evidências CONTRA o pensamento</label>
            <p className="text-xs text-gray-400 mb-2">Que fatos contradizem esse pensamento?</p>
            <textarea value={evidenceAgainst} onChange={(e) => setEvidenceAgainst(e.target.value)} placeholder="O que contradiz esse pensamento?" className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[60px] resize-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">🔄 6. Pensamento Alternativo</label>
            <p className="text-xs text-gray-400 mb-2">Como você pode repensar a situação de forma mais equilibrada?</p>
            <textarea value={alternativeThought} onChange={(e) => setAlternativeThought(e.target.value)} placeholder="Um pensamento mais realista e equilibrado..." className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[60px] resize-none text-sm" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            <label className="text-sm text-gray-600 font-medium block mb-2">📊 7. Novo nível da emoção: <span className={`font-bold ${getLevelColor(newEmotionLevel)}`}>{newEmotionLevel}/10</span></label>
            <p className="text-xs text-gray-400 mb-2">Após refletir, como está a intensidade da emoção agora?</p>
            <input type="range" min="0" max="10" value={newEmotionLevel} onChange={(e) => setNewEmotionLevel(Number(e.target.value))} className="w-full accent-rose-500" />
          </div>
        </div>

        <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4">
          <button onClick={saveRecord} disabled={!situation.trim() || !automaticThought.trim()} className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50">
            💾 Salvar Registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in overflow-y-auto pb-24">
      <div className="text-center mb-6 pt-4">
        <h2 className="text-2xl font-bold text-gray-800">Registro de Pensamentos</h2>
        <p className="text-gray-600 mt-2">Reestruturação Cognitiva (RPD)</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => { resetForm(); setView('form'); }} className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-4 font-medium shadow-lg flex items-center justify-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Novo Registro
        </button>
        {thoughtRecords.length > 0 && (
          <button onClick={exportPDF} className="px-4 bg-white border border-gray-200 rounded-2xl text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50">
            📄 PDF
          </button>
        )}
      </div>

      {thoughtRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center animate-slide-up">
          <span className="text-5xl block mb-4">📋</span>
          <h3 className="font-semibold text-gray-800 mb-2">Nenhum registro ainda</h3>
          <p className="text-sm text-gray-500">O RPD ajuda a identificar e reestruturar pensamentos disfuncionais.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {thoughtRecords.map((record, index) => {
            const isExpanded = expandedEntry === record.id;
            return (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <button onClick={() => setExpandedEntry(isExpanded ? null : record.id)} className="w-full p-4 text-left flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                    <span className="text-2xl">💭</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate text-sm">{record.situation}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(record.date)} às {record.time}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold ${getLevelColor(record.emotionLevel)}`}>{record.emotionLevel}/10</span>
                      <span className="text-gray-300">→</span>
                      <span className={`text-xs font-bold ${getLevelColor(record.newEmotionLevel)}`}>{record.newEmotionLevel}/10</span>
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6,9 12,15 18,9" /></svg>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 animate-fade-in">
                    <div className="mt-3 space-y-3 text-sm">
                      <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">💭 Pensamento automático</p><p className="text-gray-700">{record.automaticThought}</p></div>
                      <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">😢 Emoção: {record.emotion} ({record.emotionLevel}/10)</p></div>
                      {record.evidenceFor && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">✅ Evidências a favor</p><p className="text-gray-700">{record.evidenceFor}</p></div>}
                      {record.evidenceAgainst && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">❌ Evidências contra</p><p className="text-gray-700">{record.evidenceAgainst}</p></div>}
                      {record.alternativeThought && <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">🔄 Pensamento alternativo</p><p className="text-gray-700">{record.alternativeThought}</p></div>}
                      <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">📊 Novo nível: {record.newEmotionLevel}/10</p></div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-600 transition-all active:scale-95 hover:bg-red-100 mt-2"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 bg-rose-50 rounded-2xl p-4 border border-rose-100">
        <p className="text-sm text-rose-800">💡 O RPD é uma ferramenta da TCC que ajuda a questionar pensamentos automáticos negativos e desenvolver interpretações mais equilibradas.</p>
      </div>
    </div>
  );
}

// ==================== SAFETY PLAN SECTION ====================
function SafetyPlanSection({ safetyPlan, setSafetyPlan, darkMode: dm }: { safetyPlan: SafetyPlan; setSafetyPlan: (value: SafetyPlan) => void; darkMode?: boolean }) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempInput, setTempInput] = useState('');
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [agendaSupported, setAgendaSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setAgendaSupported(Boolean((navigator as Navigator & {
      contacts?: {
        select?: (
          properties: string[],
          options?: { multiple?: boolean }
        ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
      };
    }).contacts?.select));
  }, []);

  useEffect(() => {
    if ((safetyPlan.professionalName || safetyPlan.professionalPhone) || !safetyPlan.professionalContact) return;
    const legacyValue = safetyPlan.professionalContact.trim();
    if (!legacyValue) return;

    const phoneMatch = legacyValue.match(/(\+?\d[\d\s().-]{6,})$/);
    const extractedPhone = phoneMatch ? phoneMatch[1].trim() : '';
    const extractedName = extractedPhone
      ? legacyValue.slice(0, phoneMatch!.index).replace(/[-–]\s*$/, '').trim()
      : legacyValue;

    setSafetyPlan({
      ...safetyPlan,
      professionalName: extractedName,
      professionalPhone: extractedPhone,
    });
  }, [safetyPlan, setSafetyPlan]);

  const cleanPhone = (phone: string) => phone.replace(/[^\d+]/g, '');

  const addToList = (key: 'warningSignals' | 'copingStrategies' | 'reasonsToLive') => {
    if (!tempInput.trim()) return;
    setSafetyPlan({ ...safetyPlan, [key]: [...safetyPlan[key], tempInput.trim()] });
    setTempInput('');
  };

  const removeFromList = (key: 'warningSignals' | 'copingStrategies' | 'reasonsToLive', index: number) => {
    setSafetyPlan({ ...safetyPlan, [key]: safetyPlan[key].filter((_, i) => i !== index) });
  };

  const addContact = () => {
    if (!tempName.trim() || !tempPhone.trim()) return;
    setSafetyPlan({ ...safetyPlan, emergencyContacts: [...safetyPlan.emergencyContacts, { name: tempName.trim(), phone: tempPhone.trim() }] });
    setTempName(''); setTempPhone('');
  };

  const removeContact = (index: number) => {
    setSafetyPlan({ ...safetyPlan, emergencyContacts: safetyPlan.emergencyContacts.filter((_, i) => i !== index) });
  };

  const importContactFromDevice = async () => {
    if (typeof navigator === 'undefined') return;
    const contactsApi = (navigator as Navigator & {
      contacts?: {
        select?: (
          properties: string[],
          options?: { multiple?: boolean }
        ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
      };
    }).contacts;

    if (!contactsApi?.select) return;

    try {
      const [contact] = await contactsApi.select(['name', 'tel'], { multiple: false });
      const importedName = contact?.name?.[0]?.trim() || '';
      const importedPhone = contact?.tel?.[0]?.trim() || '';
      if (!importedName && !importedPhone) return;
      setTempName(importedName);
      setTempPhone(importedPhone);
      setEditingSection('contacts');
    } catch {
      // User canceled or browser blocked the picker.
    }
  };

  const professionalName = safetyPlan.professionalName || '';
  const professionalPhone = safetyPlan.professionalPhone || '';
  const startEditingSection = (key: string, value = '') => {
    setEditingSection(key);
    setTempInput(value);
  };

  const quickActions = [
    { title: 'Respire por 1 minuto', desc: 'Baixe o ritmo do corpo.', icon: '🌬️' },
    { title: 'Saia do ambiente gatilho', desc: 'Vá para um lugar mais seguro.', icon: '🚪' },
    { title: 'Ligue para alguém de confiança', desc: 'Não atravesse isso sozinho(a).', icon: '📞' },
    { title: 'Se o risco subir, ligue 188', desc: 'Apoio humano 24h.', icon: '🆘' },
  ];

  const sections = [
    {
      key: 'warningSignals' as const,
      title: '⚠️ Sinais de Alerta',
      desc: 'O que costuma sinalizar que estou piorando',
      color: dm ? 'bg-amber-900/20 border-amber-800/50' : 'bg-yellow-50 border-yellow-200',
      titleColor: dm ? 'text-amber-300' : 'text-gray-800',
      btnColor: 'text-amber-500',
      suggestions: ['Estou acelerando demais', 'Quero me isolar', 'Pensamentos muito negativos', 'Discussões ou ambiente gatilho'],
    },
    {
      key: 'copingStrategies' as const,
      title: '🛡️ Estratégias de Enfrentamento',
      desc: 'O que posso fazer para baixar a crise',
      color: dm ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200',
      titleColor: dm ? 'text-blue-300' : 'text-gray-800',
      btnColor: 'text-blue-500',
      suggestions: ['Respiração guiada', 'Banho morno ou água no rosto', 'Música calma', 'Ir para um lugar seguro'],
    },
    {
      key: 'reasonsToLive' as const,
      title: '💛 Motivos para Viver',
      desc: 'Razões e vínculos que me mantêm aqui',
      color: dm ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-green-50 border-green-200',
      titleColor: dm ? 'text-emerald-300' : 'text-gray-800',
      btnColor: 'text-green-600',
      suggestions: ['Minha família', 'Quem ama minha presença', 'Meus sonhos ainda vivos', 'Tudo que ainda posso construir'],
    },
  ];

  return (
    <div className="p-4 animate-fade-in overflow-y-auto pb-24 max-w-lg mx-auto">
      <div className="mb-6 pt-4">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Cuidado em crise"
          title="Plano de Segurança"
          description="Seu plano de apoio para momentos de crise ou risco emocional, com passos claros e contatos-chave."
          icon="🎯"
        />
      </div>

      <div className={`rounded-[2rem] border p-4 mb-6 shadow-sm ${dm ? 'bg-[linear-gradient(180deg,#1c1530_0%,#111827_100%)] border-fuchsia-500/20' : 'bg-[linear-gradient(180deg,#fff8ff_0%,#ffffff_100%)] border-fuchsia-200'}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>Ação imediata</p>
        <h3 className={`mt-2 text-[1.35rem] font-black leading-tight tracking-[-0.03em] ${dm ? 'text-white' : 'text-slate-900'}`}>Se eu perceber que estou entrando em crise</h3>
        <div className="mt-4 grid gap-3">
          {quickActions.map((item, idx) => (
            <div key={item.title} className={`rounded-[1.4rem] border px-4 py-3 flex items-start gap-3 ${dm ? 'bg-white/6 border-white/8' : 'bg-white/85 border-slate-200'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg ${dm ? 'bg-white/8 border border-white/10' : 'bg-fuchsia-50 border border-fuchsia-100'}`}>{item.icon}</div>
              <div className="min-w-0">
                <p className={`text-sm font-black ${dm ? 'text-white' : 'text-slate-900'}`}>{idx + 1}. {item.title}</p>
                <p className={`mt-1 text-[12px] leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crisis Line */}
      <div className={`rounded-3xl p-5 border mb-6 animate-slide-up shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 ${dm ? 'bg-red-900/40 border-red-800/60' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${dm ? 'bg-red-900/50' : 'bg-white'}`}>🆘</div>
          <div>
            <p className={`font-bold text-lg mb-0.5 ${dm ? 'text-red-300' : 'text-red-800'}`}>CVV - Ligar 188</p>
            <p className={`text-sm font-medium ${dm ? 'text-red-400/80' : 'text-red-600'}`}>Centro de Valorização da Vida (24h)</p>
          </div>
        </div>
        <a href="tel:188" className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-extrabold text-sm text-center shadow-lg active:scale-95 transition-all ${dm ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/50' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30'}`}>Ligar Agora</a>
      </div>

      {/* Editable Sections */}
      {sections.map((section, idx) => (
        <div key={section.key} className={`${section.color} rounded-3xl p-5 border mb-4 animate-slide-up shadow-sm`} style={{ animationDelay: `${idx * 0.05}s` }}>
          <h3 className={`font-bold mb-1 ${section.titleColor}`}>{section.title}</h3>
          <p className={`text-sm mb-4 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{section.desc}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {section.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => startEditingSection(section.key, suggestion)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black tracking-[0.04em] transition-all active:scale-95 ${
                  dm
                    ? 'bg-white/8 text-slate-200 border border-white/10 hover:bg-white/12'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {safetyPlan[section.key].length > 0 && (
            <div className="space-y-2 mb-4">
              {safetyPlan[section.key].map((item, i) => (
                <div key={i} className={`flex items-center justify-between gap-2 rounded-2xl px-4 py-3 shadow-sm ${dm ? 'bg-slate-800/80' : 'bg-white/80 backdrop-blur-sm'}`}>
                  <span className={`text-sm font-medium ${dm ? 'text-slate-200' : 'text-gray-700'}`}>{item}</span>
                  <button onClick={() => removeFromList(section.key, i)} className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all active:scale-95 flex-shrink-0 ${dm ? 'bg-red-950/40 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {editingSection === section.key ? (
            <div className="flex gap-2 animate-fade-in">
              <input type="text" value={tempInput} onChange={(e) => setTempInput(e.target.value)} placeholder="Adicionar item..." className={`flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 shadow-sm ${dm ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-white border-gray-200 focus:ring-blue-500 text-gray-800'}`} onKeyDown={(e) => { if (e.key === 'Enter') addToList(section.key); }} />
              <button onClick={() => addToList(section.key)} className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 ${dm ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>Salvar</button>
              <button onClick={() => { setEditingSection(null); setTempInput(''); }} className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 ${dm ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancelar</button>
            </div>
          ) : (
            <button onClick={() => startEditingSection(section.key)} className={`text-sm font-bold flex items-center gap-1 active:scale-95 transition-all ${section.btnColor}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Adicionar
            </button>
          )}
        </div>
      ))}

      {/* Emergency Contacts */}
      <div className={`rounded-3xl p-5 border mb-4 animate-slide-up shadow-sm ${dm ? 'bg-[linear-gradient(180deg,#231633_0%,#15192a_100%)] border-purple-500/25' : 'bg-[linear-gradient(180deg,#faf5ff_0%,#ffffff_100%)] border-purple-200'}`} style={{ animationDelay: '0.15s' }}>
        <h3 className={`font-bold mb-1 ${dm ? 'text-purple-300' : 'text-purple-800'}`}>📞 Contatos de Emergência</h3>
        <p className={`text-sm mb-4 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Quem pode me atender rápido em uma crise.</p>

        {safetyPlan.emergencyContacts.length > 0 && (
          <div className="space-y-2 mb-4">
            {safetyPlan.emergencyContacts.map((c, i) => (
              <div key={i} className={`rounded-2xl px-4 py-4 shadow-sm ${dm ? 'bg-slate-800/80' : 'bg-white/80 backdrop-blur-sm'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${dm ? 'text-slate-200' : 'text-gray-800'}`}>{c.name}</p>
                    <p className={`text-xs font-medium ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{c.phone}</p>
                  </div>
                  <button onClick={() => removeContact(i)} className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all active:scale-95 flex-shrink-0 ${dm ? 'bg-red-950/40 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                    Remover
                  </button>
                </div>
                <div className="mt-3">
                  <a href={`tel:${cleanPhone(c.phone)}`} className={`inline-flex w-full items-center justify-center px-4 py-3 rounded-2xl text-sm font-extrabold text-center shadow-lg active:scale-95 transition-all ${dm ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/50' : 'bg-purple-500 text-white hover:bg-purple-600 shadow-purple-500/30'}`}>
                    Ligar Agora
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingSection === 'contacts' ? (
          <div className="space-y-3 animate-fade-in">
            <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Nome" className={`w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 shadow-sm ${dm ? 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500/50' : 'bg-white border-gray-200 focus:ring-purple-500 text-gray-800'}`} />
            <div className="flex gap-2">
              <input type="tel" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} placeholder="Telefone" className={`flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 shadow-sm ${dm ? 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500/50' : 'bg-white border-gray-200 focus:ring-purple-500 text-gray-800'}`} />
              <button onClick={addContact} className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 ${dm ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-purple-500 text-white hover:bg-purple-600'}`}>Salvar</button>
              <button onClick={() => { setEditingSection(null); setTempName(''); setTempPhone(''); }} className={`px-4 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95 ${dm ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancelar</button>
            </div>
            <button
              type="button"
              onClick={importContactFromDevice}
              disabled={!agendaSupported}
              className={`w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                agendaSupported
                  ? (dm ? 'bg-white/10 text-purple-200 border border-purple-500/30 hover:bg-white/15' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100')
                  : (dm ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed')
              }`}
            >
              {agendaSupported ? 'Buscar na agenda do celular' : 'Agenda indisponível neste aparelho'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setEditingSection('contacts')} className={`text-sm font-bold flex items-center gap-1 active:scale-95 transition-all ${dm ? 'text-purple-400' : 'text-purple-600'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Adicionar contato
            </button>
            <button
              type="button"
              onClick={importContactFromDevice}
              disabled={!agendaSupported}
              className={`w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                agendaSupported
                  ? (dm ? 'bg-white/10 text-purple-200 border border-purple-500/30 hover:bg-white/15' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100')
                  : (dm ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed')
              }`}
            >
              {agendaSupported ? 'Buscar na agenda do celular' : 'Agenda indisponível neste aparelho'}
            </button>
          </div>
        )}
      </div>

      {/* Safe Place & Professional */}
      <div className={`rounded-3xl p-5 border mb-4 animate-slide-up shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`} style={{ animationDelay: '0.2s' }}>
        <h3 className={`font-bold mb-3 ${dm ? 'text-blue-300' : 'text-blue-800'}`}>🏠 Lugar Seguro</h3>
        <p className={`text-sm mb-3 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Para onde posso ir se eu precisar sair do ambiente atual.</p>
        <input type="text" value={safetyPlan.safePlace} onChange={(e) => setSafetyPlan({ ...safetyPlan, safePlace: e.target.value })} placeholder="Onde me sinto seguro(a)..." className={`w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 shadow-sm transition-all ${dm ? 'bg-slate-700 text-white border border-slate-600 focus:ring-blue-500' : 'bg-white border border-white focus:ring-blue-500'}`} />
      </div>

      <div className={`rounded-3xl p-5 border mb-8 animate-slide-up shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100'}`} style={{ animationDelay: '0.25s' }}>
        <h3 className={`font-bold mb-3 ${dm ? 'text-teal-300' : 'text-teal-800'}`}>👨‍⚕️ Profissional de Saúde</h3>
        <p className={`text-sm mb-3 ${dm ? 'text-slate-400' : 'text-gray-500'}`}>Deixo esse contato pronto se eu tiver acompanhamento.</p>
        <div className="space-y-3">
          <input
            type="text"
            value={professionalName}
            onChange={(e) => setSafetyPlan({ ...safetyPlan, professionalName: e.target.value, professionalContact: [e.target.value, professionalPhone].filter(Boolean).join(' - ') })}
            placeholder="Nome do profissional"
            className={`w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 shadow-sm transition-all ${dm ? 'bg-slate-700 text-white border border-slate-600 focus:ring-teal-500' : 'bg-white border border-white focus:ring-teal-500'}`}
          />
          <input
            type="tel"
            value={professionalPhone}
            onChange={(e) => setSafetyPlan({ ...safetyPlan, professionalPhone: e.target.value, professionalContact: [professionalName, e.target.value].filter(Boolean).join(' - ') })}
            placeholder="Telefone do profissional"
            className={`w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 shadow-sm transition-all ${dm ? 'bg-slate-700 text-white border border-slate-600 focus:ring-teal-500' : 'bg-white border border-white focus:ring-teal-500'}`}
          />
          {professionalPhone && (
            <a
              href={`tel:${cleanPhone(professionalPhone)}`}
              className={`inline-flex w-full items-center justify-center px-4 py-3 rounded-2xl text-sm font-extrabold text-center shadow-lg active:scale-95 transition-all ${dm ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-teal-900/50' : 'bg-teal-500 text-white hover:bg-teal-600 shadow-teal-500/30'}`}
            >
              Ligar para o profissional
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== STATS SECTION ====================


// ==================== REMINDERS SECTION ====================
function RemindersSection({ settings, setSettings, darkMode: dm }: { settings: ReminderSettings; setSettings: (value: ReminderSettings) => void; darkMode?: boolean }) {
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [healthyMessages] = useAppPersistence<{ id: string; text: string; createdAt: string }[]>('psico_healthy_self', []);
  const [lastNotifyKey, setLastNotifyKey] = useState<string>('');
  const [noticeModal, setNoticeModal] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
    }
  };

  const toggleReminder = (key: 'moodReminder' | 'breathingReminder' | 'yogaReminder' | 'diaryReminder' | 'healthySelfReminder' | 'meditationReminder' | 'badgesReminder' | 'gratitudeReminder' | 'sleepReminder' | 'missionsReminder' | 'microtasksReminder' | 'mindmapReminder' | 'psychoeduReminder' | 'adaptiveSuggestionReminder') => {
    if (permissionStatus !== 'granted') {
      requestPermission();
      return;
    }
    if (key === 'healthySelfReminder' && healthyMessages.length === 0) {
      setNoticeModal({
        open: true,
        title: 'Ainda falta uma mensagem salva',
        message: 'Salve pelo menos 1 mensagem em “Eu Mais Saudável” para ativar esse lembrete.',
      });
      return;
    }
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const updateTime = (key: 'moodTime' | 'breathingTime' | 'yogaTime' | 'diaryTime' | 'healthySelfTime' | 'meditationTime' | 'badgesTime' | 'gratitudeTime' | 'sleepTime' | 'missionsTime' | 'microtasksTime' | 'mindmapTime' | 'psychoeduTime' | 'adaptiveSuggestionTime', value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  // Simple reminder check using interval
  useEffect(() => {
    const checkReminders = () => {
      if (permissionStatus !== 'granted') return;
      if (settings.doNotDisturb) return;
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const minuteKey = `${now.toISOString().slice(0, 10)}-${currentTime}`;

      if (lastNotifyKey === minuteKey) return;

      if (settings.moodReminder && currentTime === settings.moodTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Lembrete', { body: '📊 Hora de registrar seu humor! Como você está se sentindo?', icon: '🧠' });
        return;
      }
      if (settings.breathingReminder && currentTime === settings.breathingTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Lembrete', { body: '🌬️ Que tal uma pausa para respirar? Um exercício rápido pode ajudar.', icon: '🧠' });
        return;
      }
      if (settings.yogaReminder && currentTime === settings.yogaTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Yoga Nidra', { body: '🌙 Um relaxamento profundo pode combinar com este momento.', icon: '🧠' });
        return;
      }
      if (settings.diaryReminder && currentTime === settings.diaryTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Lembrete', { body: '📓 Hora de registrar suas emoções no diário!', icon: '🧠' });
        return;
      }
      if (settings.meditationReminder && currentTime === settings.meditationTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Meditação', { body: '🧘 Reserve alguns minutos para desacelerar e meditar.', icon: '🧠' });
        return;
      }
      if (settings.badgesReminder && currentTime === settings.badgesTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Progresso', { body: '📈 Veja como seu progresso está se acumulando no app.', icon: '🧠' });
        return;
      }
      if (settings.gratitudeReminder && currentTime === settings.gratitudeTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Gratidão', { body: '🙏 Anote 1 coisa boa do seu dia agora.', icon: '🧠' });
        return;
      }
      if (settings.sleepReminder && currentTime === settings.sleepTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Sono', { body: '🌙 Hora de desacelerar: luz baixa, tela off e respiração leve.', icon: '🧠' });
        return;
      }
      if (settings.missionsReminder && currentTime === settings.missionsTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Missões', { body: '🎯 Faça 1 etapa da sua missão de hoje para manter consistência.', icon: '🧠' });
        return;
      }
      if (settings.microtasksReminder && currentTime === settings.microtasksTime) {
        const microtasksReminder = getMicrotasksReminderContext();
        setLastNotifyKey(minuteKey);
        new Notification(`SerenAI - ${microtasksReminder.title}`, { body: `🌿 ${microtasksReminder.body}`, icon: '🧠' });
        return;
      }
      if (settings.mindmapReminder && currentTime === settings.mindmapTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Mapa Mental Emocional', { body: '🗺️ Vale olhar os padrões emocionais que estão se formando.', icon: '🧠' });
        return;
      }
      if (settings.psychoeduReminder && currentTime === settings.psychoeduTime) {
        setLastNotifyKey(minuteKey);
        new Notification('SerenAI - Psicoeducação', { body: '📚 Um conteúdo curto pode te ajudar a entender melhor este momento.', icon: '🧠' });
        return;
      }
      if (settings.healthySelfReminder && currentTime === settings.healthySelfTime && healthyMessages.length > 0) {
        const picked = healthyMessages[Math.floor(Math.random() * healthyMessages.length)];
        setLastNotifyKey(minuteKey);
        new Notification('💬 Mensagem do seu Eu Saudável', { body: picked.text, icon: '🧠' });
        return;
      }
      if (settings.adaptiveSuggestionReminder && currentTime === settings.adaptiveSuggestionTime) {
        setLastNotifyKey(minuteKey);
        new Notification('✨ Sugestão adaptativa', { body: 'Abra o Sereno para ver uma sugestão pensada para o seu momento.', icon: '🧠' });
      }
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [settings, permissionStatus, healthyMessages, lastNotifyKey]);

  const reminders = [
    { key: 'moodReminder' as const, timeKey: 'moodTime' as const, title: '📊 Registro de Humor', desc: 'Lembrete para registrar seu humor diário', emoji: '📊', color: dm ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-200' },
    { key: 'breathingReminder' as const, timeKey: 'breathingTime' as const, title: '🌬️ Respiração Diária', desc: 'Lembrete para fazer um exercício de respiração', emoji: '🌬️', color: dm ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200' },
    { key: 'yogaReminder' as const, timeKey: 'yogaTime' as const, title: '🌙 Yoga Nidra', desc: 'Lembrete para relaxamento profundo no fim do dia', emoji: '🌙', color: dm ? 'bg-indigo-900/20 border-indigo-800/50' : 'bg-indigo-50 border-indigo-200' },
    { key: 'diaryReminder' as const, timeKey: 'diaryTime' as const, title: '📓 Registro no Diário', desc: 'Lembrete para registrar suas emoções', emoji: '📓', color: dm ? 'bg-teal-900/20 border-teal-800/50' : 'bg-teal-50 border-teal-200' },
    { key: 'healthySelfReminder' as const, timeKey: 'healthySelfTime' as const, title: '💬 Eu Mais Saudável', desc: healthyMessages.length > 0 ? 'Envia mensagem pessoal aleatória de autoapoio' : 'Salve mensagens em “Eu Mais Saudável” para ativar', emoji: '💬', color: dm ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200' },
    { key: 'meditationReminder' as const, timeKey: 'meditationTime' as const, title: '🧘 Meditação', desc: 'Lembrete para uma pausa de meditação', emoji: '🧘', color: dm ? 'bg-violet-900/20 border-violet-800/50' : 'bg-violet-50 border-violet-200' },
    { key: 'badgesReminder' as const, timeKey: 'badgesTime' as const, title: '📈 Progresso', desc: 'Lembrete para revisar estatísticas e marcos', emoji: '📈', color: dm ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200' },
    { key: 'gratitudeReminder' as const, timeKey: 'gratitudeTime' as const, title: '🙏 Gratidão', desc: 'Lembrete para registrar gratidão do dia', emoji: '🙏', color: dm ? 'bg-yellow-900/20 border-yellow-800/50' : 'bg-yellow-50 border-yellow-200' },
    { key: 'sleepReminder' as const, timeKey: 'sleepTime' as const, title: '🌙 Sono', desc: 'Lembrete de desaceleração para dormir melhor', emoji: '🌙', color: dm ? 'bg-indigo-900/20 border-indigo-800/50' : 'bg-indigo-50 border-indigo-200' },
    { key: 'missionsReminder' as const, timeKey: 'missionsTime' as const, title: '🎯 Missões', desc: 'Lembrete para avançar uma etapa das missões', emoji: '🎯', color: dm ? 'bg-lime-900/20 border-lime-800/50' : 'bg-lime-50 border-lime-200' },
    { key: 'microtasksReminder' as const, timeKey: 'microtasksTime' as const, title: '🌿 Microtarefas', desc: 'Lembrete para fazer uma microação de 5 min', emoji: '🌿', color: dm ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-200' },
    { key: 'mindmapReminder' as const, timeKey: 'mindmapTime' as const, title: '🗺️ Mapa Mental Emocional', desc: 'Lembrete para revisar padrões emocionais', emoji: '🗺️', color: dm ? 'bg-cyan-900/20 border-cyan-800/50' : 'bg-cyan-50 border-cyan-200' },
    { key: 'psychoeduReminder' as const, timeKey: 'psychoeduTime' as const, title: '📚 Psicoeducação', desc: 'Lembrete para um conteúdo curto de apoio', emoji: '📚', color: dm ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-200' },
    { key: 'adaptiveSuggestionReminder' as const, timeKey: 'adaptiveSuggestionTime' as const, title: '✨ Sugestão adaptativa', desc: 'Entrega uma sugestão personalizada no melhor horário', emoji: '✨', color: dm ? 'bg-violet-900/20 border-violet-800/50' : 'bg-violet-50 border-violet-200' },
  ];

  return (
    <div className="p-4 animate-fade-in overflow-y-auto pb-24 max-w-lg mx-auto">
      <AppNoticeModal
        open={noticeModal.open}
        title={noticeModal.title}
        message={noticeModal.message}
        onClose={() => setNoticeModal({ open: false, title: '', message: '' })}
        darkMode={dm}
        icon="🔔"
        eyebrow="Lembretes"
      />
      <div className="text-center mb-8 pt-4">
        <span className="text-5xl block mb-4 filter drop-shadow-md">🔔</span>
        <h2 className={`text-3xl font-extrabold tracking-tight mb-2 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>Lembretes</h2>
        <p className={`font-medium ${dm ? 'text-slate-400' : 'text-gray-600'}`}>Configure notificações diárias</p>
      </div>

      {/* Permission Status */}
      {permissionStatus !== 'granted' && (
        <div className={`rounded-3xl p-5 border mb-6 animate-slide-up shadow-sm ${dm ? 'bg-yellow-900/20 border-yellow-800/50' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm font-medium mb-4 ${dm ? 'text-yellow-400' : 'text-yellow-800'}`}>
            {permissionStatus === 'denied'
              ? '❌ As notificações foram bloqueadas. Habilite nas configurações do navegador.'
              : '🔔 Para receber lembretes, permita as notificações do navegador.'}
          </p>
          {permissionStatus !== 'denied' && (
            <button onClick={requestPermission} className="w-full sm:w-auto px-5 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-95">
              Permitir Notificações
            </button>
          )}
        </div>
      )}

      {/* Reminder Cards */}
      <div className="space-y-4">
        {reminders.map((reminder, idx) => (
          <div key={reminder.key} className={`${reminder.color} rounded-3xl p-6 border animate-slide-up shadow-sm`} style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 pr-4">
                <h3 className={`font-bold mb-1 ${dm ? 'text-slate-200' : 'text-gray-800'}`}>{reminder.title}</h3>
                <p className={`text-sm ${dm ? 'text-slate-400' : 'text-gray-500'}`}>{reminder.desc}</p>
              </div>
              <button
                onClick={() => toggleReminder(reminder.key)}
                className={`w-14 h-8 rounded-full transition-all flex items-center shadow-inner ${settings[reminder.key] ? 'bg-green-500' : dm ? 'bg-slate-700' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform transform ${settings[reminder.key] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ${settings[reminder.key] ? 'max-h-20 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3">
                <span className={`text-sm font-bold flex items-center gap-2 ${dm ? 'text-slate-800' : 'text-gray-700'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Horário:
                </span>
                <input
                  type="time"
                  value={settings[reminder.timeKey]}
                  onChange={(e) => updateTime(reminder.timeKey, e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 font-bold shadow-sm ${dm ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-white border-gray-200 focus:ring-blue-500 text-gray-800'}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-6 rounded-3xl p-5 border shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-bold ${dm ? 'text-slate-200' : 'text-slate-800'}`}>Pausar Lembretes</p>
            <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Não enviar notificações temporariamente</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, doNotDisturb: !settings.doNotDisturb })}
            className={`w-14 h-8 rounded-full transition-all flex items-center shadow-inner ${settings.doNotDisturb ? 'bg-rose-500' : dm ? 'bg-slate-700' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform transform ${settings.doNotDisturb ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className={`mt-8 rounded-3xl p-5 border shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100'}`}>
        <p className={`text-sm font-medium ${dm ? 'text-slate-400' : 'text-violet-800'}`}>💡 Os lembretes funcionam enquanto o app estiver aberto no navegador. Para melhores resultados, mantenha a aba aberta.</p>
      </div>
    </div>
  );
}

// ==================== YOGA NIDRA SECTION ====================

// SRT subtitles for female voice
const yogaNidraSubsFeminino = [
  { start: 0.166, end: 0.966, text: 'Iniciando' },
  { start: 1.2, end: 2.866, text: 'Deite-se em um lugar tranquilo' },
  { start: 3.4, end: 6.2, text: 'Feche os olhos e permita-se um momento só seu' },
  { start: 6.666, end: 8.666, text: 'Este é um espaço de descanso profundo' },
  { start: 8.8, end: 12.1, text: 'De acolhimento e de reconexão com sua força interior' },
  { start: 121.066, end: 122.8, text: 'Intenção — Sankalpa' },
  { start: 123.0, end: 125.7, text: 'Estabeleça uma intenção carinhosa para esta prática' },
  { start: 126.033, end: 128.533, text: 'Como "eu me fortaleço a cada respiração"' },
  { start: 128.7, end: 129.033, text: 'Ou' },
  { start: 129.033, end: 131.533, text: '"Encontro equilíbrio em meio a minhas responsabilidades"' },
  { start: 132.633, end: 134.266, text: 'Repita mentalmente três vezes' },
  { start: 134.533, end: 135.933, text: 'Com fé e suavidade' },
  { start: 241.066, end: 242.4, text: 'Consciência Corporal' },
  { start: 245.366, end: 247.166, text: 'Traga sua atenção para o corpo' },
  { start: 247.433, end: 249.633, text: 'Reconhecendo cada parte com gentileza' },
  { start: 250.6, end: 252.933, text: 'Pés… tornozelos… dedos…' },
  { start: 361.3, end: 362.733, text: 'Pernas… joelhos…' },
  { start: 363.066, end: 366.0, text: 'Coxas… sinta o apoio da terra sobre você' },
  { start: 420.333, end: 421.066, text: 'Quadril…' },
  { start: 421.066, end: 422.433, text: 'Pelve… abdômen…' },
  { start: 422.933, end: 424.233, text: 'Solte as tensões' },
  { start: 450.033, end: 450.833, text: 'Peito…' },
  { start: 450.833, end: 452.5, text: 'Sinta a respiração gentil' },
  { start: 480.133, end: 481.3, text: 'Mãos… braços…' },
  { start: 481.833, end: 484.066, text: 'Ombros… libere o peso que carrega' },
  { start: 510.233, end: 511.033, text: 'Pescoço…' },
  { start: 511.166, end: 512.666, text: 'Mandíbula… rosto…' },
  { start: 513.966, end: 516.633, text: 'Relaxe… suavize a expressão' },
  { start: 540.233, end: 541.366, text: 'Todo o corpo inteiro' },
  { start: 541.6, end: 542.8, text: 'Entregue ao descanso' },
  { start: 660.6, end: 661.9, text: 'Atenção à respiração' },
  { start: 662.533, end: 663.733, text: 'Respire profundamente' },
  { start: 664.4, end: 665.5, text: 'A cada inspiração' },
  { start: 665.7, end: 667.933, text: 'Sinta a energia e leveza entrando' },
  { start: 668.933, end: 670.0, text: 'A cada expiração' },
  { start: 670.3, end: 671.633, text: 'Solte a exaustão' },
  { start: 671.766, end: 673.433, text: 'O peso da autocobrança' },
  { start: 673.7, end: 674.533, text: 'Das preocupações' },
  { start: 674.933, end: 675.733, text: 'Os medos' },
  { start: 675.8, end: 677.7, text: 'As angústias e ansiedades' },
  { start: 679.166, end: 681.8, text: 'Sinta o fluxo natural da vida dentro de você' },
  { start: 810.066, end: 811.866, text: 'Visualize agora' },
  { start: 812.166, end: 814.333, text: 'Visualize um ambiente que traga paz' },
  { start: 814.766, end: 817.033, text: 'Pode ser um campo verde ou uma praia' },
  { start: 817.766, end: 820.666, text: 'Sinta-se em segurança e em tranquilidade neste lugar' },
  { start: 821.233, end: 822.633, text: 'Imagine-se com leveza' },
  { start: 822.933, end: 824.766, text: 'Sem pressões ou preocupações' },
  { start: 1020.0, end: 1021.366, text: 'Liberação de pensamentos' },
  { start: 1022.066, end: 1024.033, text: 'Se pensamentos difíceis surgirem' },
  { start: 1024.266, end: 1026.5, text: 'Observe-os como nuvens que passam no céu' },
  { start: 1027.233, end: 1028.133, text: 'Reconheça-os' },
  { start: 1028.3, end: 1029.3, text: 'Mas não se prenda' },
  { start: 1029.866, end: 1031.5, text: 'Deixe que sigam o seu caminho' },
  { start: 1031.733, end: 1034.133, text: 'Enquanto você permanece neste espaço de paz' },
  { start: 1180.8, end: 1181.6, text: 'Retorno' },
  { start: 1181.833, end: 1182.633, text: 'Aos poucos' },
  { start: 1182.733, end: 1185.2, text: 'Traga a atenção de volta ao corpo físico' },
  { start: 1185.966, end: 1187.633, text: 'Sinta o contato com o chão' },
  { start: 1188.0, end: 1190.966, text: 'Movimente suavemente os dedos das mãos e dos pés' },
  { start: 1192.4, end: 1194.8, text: 'Respire fundo e quando se sentir pronto' },
  { start: 1195.2, end: 1196.666, text: 'Abra os olhos devagar' },
  { start: 1197.433, end: 1199.733, text: 'Volte a este espaço sempre que precisar' },
];

// SRT subtitles for male voice
const yogaNidraSubsMasculino = [
  { start: 0.133, end: 0.866, text: 'Iniciando' },
  { start: 0.866, end: 2.3, text: 'Deite-se em um lugar tranquilo' },
  { start: 2.7, end: 5.966, text: 'Feche os olhos e permita-se um momento só seu' },
  { start: 6.2, end: 8.133, text: 'Este é um espaço de descanso profundo' },
  { start: 8.2, end: 9.566, text: 'De acolhimento e de' },
  { start: 10.266, end: 12.1, text: 'Reconexão com sua força interior' },
  { start: 121.066, end: 121.766, text: 'A intenção' },
  { start: 122.066, end: 122.866, text: 'Sankalpa' },
  { start: 123.066, end: 125.466, text: 'Estabeleça uma intenção carinhosa para esta prática' },
  { start: 125.9, end: 128.9, text: 'Como "eu me fortaleço a cada respiração"' },
  { start: 129.1, end: 131.333, text: 'Ou "encontro equilíbrio em meio a minhas"' },
  { start: 131.9, end: 132.7, text: 'Responsabilidades' },
  { start: 133.066, end: 134.533, text: 'Repita mentalmente três vezes' },
  { start: 135.066, end: 136.3, text: 'Com fé e suavidade' },
  { start: 241.066, end: 241.266, text: 'Primeiro' },
  { start: 241.266, end: 242.433, text: 'Consciência corporal' },
  { start: 242.766, end: 244.366, text: 'Traga sua atenção para o corpo' },
  { start: 244.766, end: 245.933, text: 'Reconhecendo cada parte' },
  { start: 246.866, end: 247.7, text: 'Por gentileza' },
  { start: 248.633, end: 250.333, text: 'Pés… tornozelos…' },
  { start: 250.566, end: 251.533, text: 'Dedos… pés…' },
  { start: 361.333, end: 362.533, text: 'Pernas… joelhos…' },
  { start: 362.766, end: 365.433, text: 'Coxas… sinta o apoio da terra sobre você' },
  { start: 420.1, end: 420.9, text: 'Quadril…' },
  { start: 420.933, end: 422.233, text: 'Pelve… abdômen…' },
  { start: 422.466, end: 423.9, text: 'Solte as tensões' },
  { start: 450.3, end: 452.633, text: 'Peito… sinta a respiração gentil' },
  { start: 480.066, end: 481.0, text: 'Mãos… braços…' },
  { start: 481.166, end: 483.4, text: 'Ombros… libere o peso que carrega' },
  { start: 510.4, end: 511.0, text: 'Pescoço…' },
  { start: 511.0, end: 511.766, text: 'Mandíbula…' },
  { start: 511.766, end: 512.633, text: 'Rosto… relaxe…' },
  { start: 512.866, end: 514.1, text: 'Suavize a expressão' },
  { start: 540.166, end: 542.733, text: 'Todo corpo inteiro entregue ao descanso' },
  { start: 660.6, end: 660.8, text: 'Atenção' },
  { start: 660.8, end: 661.766, text: 'Atenção à respiração' },
  { start: 662.1, end: 663.233, text: 'Respire profundamente' },
  { start: 663.8, end: 664.833, text: 'A cada inspiração' },
  { start: 665.233, end: 666.2, text: 'Sinta a energia' },
  { start: 666.7, end: 668.5, text: 'E leveza entrando' },
  { start: 668.633, end: 669.533, text: 'A cada expiração' },
  { start: 669.733, end: 670.933, text: 'Solte a exaustão' },
  { start: 671.033, end: 672.566, text: 'O peso da autocobrança' },
  { start: 672.8, end: 674.533, text: 'As preocupações… medos…' },
  { start: 674.833, end: 675.633, text: 'Angústias…' },
  { start: 675.933, end: 676.733, text: 'Ansiedades…' },
  { start: 676.966, end: 679.333, text: 'Sinta o fluxo natural da vida dentro de você' },
  { start: 810.166, end: 810.966, text: 'Visualização' },
  { start: 811.3, end: 813.6, text: 'Agora visualize um ambiente que traga paz' },
  { start: 813.833, end: 815.9, text: 'Pode ser um campo verde ou uma praia' },
  { start: 816.166, end: 818.933, text: 'Sinta-se em segurança e em tranquilidade neste lugar' },
  { start: 819.4, end: 820.8, text: 'Imagine-se com leveza' },
  { start: 820.933, end: 822.833, text: 'Sem pressões ou preocupações' },
  { start: 1020.0, end: 1021.4, text: 'Liberação de pensamentos' },
  { start: 1021.9, end: 1023.766, text: 'Se pensamentos difíceis surgirem' },
  { start: 1024.0, end: 1026.266, text: 'Observe-os como nuvens que passam no céu' },
  { start: 1026.6, end: 1027.466, text: 'Reconheça-os' },
  { start: 1027.566, end: 1028.433, text: 'Mas não se prenda' },
  { start: 1028.666, end: 1030.2, text: 'Deixe que sigam o seu caminho' },
  { start: 1030.8, end: 1033.166, text: 'Enquanto você permanece neste espaço de paz' },
  { start: 1185.633, end: 1186.4, text: 'Retorno' },
  { start: 1186.4, end: 1186.933, text: 'Aos poucos' },
  { start: 1186.933, end: 1188.866, text: 'Traga a atenção de volta ao corpo físico' },
  { start: 1189.133, end: 1190.333, text: 'Sinta o contato com o…' },
  { start: 1190.333, end: 1193.533, text: 'Chão. Movimente suavemente os dedos das mãos e dos pés' },
  { start: 1193.866, end: 1196.0, text: 'Respire fundo e quando se sentir pronto' },
  { start: 1196.3, end: 1197.666, text: 'Abra os olhos devagar' },
  { start: 1198.466, end: 1200.433, text: 'Volte a esse espaço sempre que precisar' },
];

// Yoga Nidra environments
type YogaEnvironmentOption = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  musicIds: string[];
  gradient: string;
  customMix?: Record<string, number>;
};

const natureToAmbientSoundId: Record<string, string> = {
  chuva1: 'chuva',
  chuva2: 'chuva-janela',
  chuva3: 'chuva-janela-longa',
  fogueira: 'fogueira',
  lareira1: 'lareira',
  lareira2: 'lareira-1',
  lareira3: 'lareira',
  freq1: 'om',
  freq2: 'om-1',
  meditacao: 'meditacao',
  dor: 'dormir',
  resp: 'vento',
  vento1: 'vento',
  vento2: 'vento-1',
  mar1: 'mar',
  mar2: 'agua-mar',
  praia: 'praia',
  floresta1: 'floresta',
  floresta2: 'floresta-profunda',
  grilo1: 'grilo',
  grilo2: 'noite',
  noite1: 'noite',
  noite2: 'noite-1',
  noite3: 'noite',
  dia: 'dia',
  passaro1: 'passaros-1',
  passaro2: 'passaros-2',
  passaro3: 'passaros-3',
  riacho1: 'riacho',
  riacho2: 'riacho-2',
  riacho3: 'riacho-3',
  riacho4: 'riacho',
};

const customYogaGradients = [
  'from-fuchsia-600 via-indigo-600 to-slate-900',
  'from-emerald-500 via-teal-600 to-slate-900',
  'from-cyan-500 via-blue-600 to-slate-900',
  'from-amber-500 via-orange-600 to-slate-900',
  'from-violet-500 via-purple-700 to-slate-900',
  'from-sky-500 via-indigo-500 to-slate-900',
];

const buildYogaMixEnvironments = (presets: NatureMixPreset[]): YogaEnvironmentOption[] =>
  presets.flatMap((preset, index) => {
      const mixEntries = Object.entries(preset.mix)
        .filter(([, volume]) => volume > 0)
        .sort((a, b) => b[1] - a[1]);

      const musicIds = mixEntries
        .map(([id]) => natureToAmbientSoundId[id])
        .filter((id): id is string => Boolean(id));

      if (!musicIds.length) return [];

      const leadTrack = natureMixerTracks.find((track) => track.id === mixEntries[0]?.[0]);
      const cleanName = preset.label.replace(/^⭐\s*/, '').trim();

      return [{
        id: `nature-mix-${index}-${cleanName.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
        name: cleanName,
        emoji: leadTrack?.icon || '🎛️',
        desc: `${musicIds.length} sons do seu Mixer da Natureza`,
        musicIds,
        gradient: customYogaGradients[index % customYogaGradients.length],
        customMix: musicIds.reduce<Record<string, number>>((acc, soundId, soundIndex) => {
          const originalVolume = mixEntries[soundIndex]?.[1] ?? 30;
          acc[soundId] = originalVolume;
          return acc;
        }, {}),
      }];
    });

const yogaEnvironments: YogaEnvironmentOption[] = [
  { id: 'praia', name: 'Praia', emoji: '🏖️', desc: 'Ondas do mar e brisa', musicIds: ['mar', 'agua-mar', 'praia'], gradient: 'from-cyan-400 to-blue-500' },
  { id: 'floresta', name: 'Floresta', emoji: '🌲', desc: 'Sons da natureza e pássaros', musicIds: ['floresta', 'floresta-profunda', 'passaros-1'], gradient: 'from-green-500 to-emerald-600' },
  { id: 'noite', name: 'Noite Estrelada', emoji: '🌙', desc: 'Silêncio e grilos noturnos', musicIds: ['noite-1', 'noite', 'grilo'], gradient: 'from-indigo-600 to-purple-800' },
  { id: 'chuva', name: 'Chuva', emoji: '🌧️', desc: 'Chuva suave e aconchegante', musicIds: ['chuva-janela-longa', 'chuva', 'chuva-janela'], gradient: 'from-slate-500 to-gray-600' },
  { id: 'lareira', name: 'Lareira', emoji: '🔥', desc: 'Crepitar do fogo acolhedor', musicIds: ['lareira', 'lareira-1', 'fogueira'], gradient: 'from-orange-500 to-red-600' },
  { id: 'riacho', name: 'Riacho', emoji: '💧', desc: 'Água corrente e serenidade', musicIds: ['riacho-2', 'riacho', 'riacho-3'], gradient: 'from-teal-400 to-cyan-600' },
  { id: 'meditacao', name: 'Meditação', emoji: '🧘', desc: 'Melodia calma e profunda', musicIds: ['meditacao', 'om', 'dormir'], gradient: 'from-violet-500 to-purple-600' },
  { id: 'vento', name: 'Vento', emoji: '🌬️', desc: 'Brisa suave nos campos', musicIds: ['vento', 'vento-1'], gradient: 'from-sky-400 to-blue-400' },
  { id: 'tempestade', name: 'Tempestade Tropical', emoji: '⛈️', desc: 'Chuva intensa e vento nas árvores', musicIds: ['chuva-janela-longa', 'vento-1', 'floresta'], gradient: 'from-blue-600 to-cyan-800' },
  { id: 'amanhecer', name: 'Amanhecer no Campo', emoji: '🌄', desc: 'Pássaros e brisa matinal fresca', musicIds: ['passaros-2', 'vento', 'dia'], gradient: 'from-orange-400 to-sky-400' },
  { id: 'cabana', name: 'Cabana na Montanha', emoji: '🛖', desc: 'Lareira e chuva suave na janela', musicIds: ['lareira-1', 'chuva-janela', 'vento-1'], gradient: 'from-amber-800 to-orange-900' },
  { id: 'costa', name: 'Noite na Costa', emoji: '🌊', desc: 'Ondas, grilos e brisa noturna', musicIds: ['mar', 'grilo', 'noite-1'], gradient: 'from-slate-900 to-indigo-900' },
  { id: 'zen', name: 'Jardim Zen', emoji: '⛲', desc: 'Cascata relaxante e pássaros zen', musicIds: ['riacho-3', 'passaros-3', 'om'], gradient: 'from-teal-500 to-emerald-700' },
  { id: 'pico', name: 'Pico do Silêncio', emoji: '🏔️', desc: 'Vento de altitude e mantra om', musicIds: ['vento', 'om-1', 'noite'], gradient: 'from-slate-400 to-blue-500' },
  { id: 'espaco', name: 'Espaço Profundo', emoji: '🌌', desc: 'Flutuar no silêncio cósmico', musicIds: ['dormir', 'noite-1', 'om'], gradient: 'from-gray-950 via-purple-950 to-indigo-950' },
];

// Yoga Nidra full narration text (~20 min with pauses)
const yogaNidraFullText = `Deite-se em um lugar tranquilo. Feche os olhos e permita-se um momento só seu. Este é um espaço de descanso profundo, de acolhimento e de reconexão com sua força interior.
Respire fundo pelo nariz e solte devagar pela boca. Mais uma vez, puxe o ar com calma e solte lentamente. Deixe o corpo começar a relaxar.
Agora, estabeleça uma intenção carinhosa para esta prática. Pode ser algo como "eu me fortaleço a cada respiração" ou "encontro equilíbrio em meio às minhas responsabilidades". Repita mentalmente três vezes, com fé e suavidade.
Traga sua atenção para o corpo. Reconhecendo cada parte com gentileza. Comece pelos pés. Sinta os dedos dos pés, a sola, o tornozelo. Permita que relaxem completamente.
Suba a atenção para as pernas. Sinta as panturrilhas, os joelhos, as coxas. Sinta o apoio da terra sobre você. Deixe as pernas ficarem pesadas e relaxadas.
Agora perceba o quadril, a pelve, o abdômen. Solte todas as tensões que você carrega nessa região. Deixe a barriga ficar macia e relaxada.
Sinta o peito. Perceba a respiração gentil que sobe e desce. Não tente controlá-la. Apenas observe esse movimento natural e reconfortante.
Traga a atenção para as mãos, os braços e os ombros. Libere o peso que você carrega nos ombros. Deixe os braços ficarem pesados e soltos ao lado do corpo.
Perceba o pescoço, a mandíbula, o rosto. Relaxe a testa, suavize a expressão dos olhos, solte a mandíbula. Deixe todo o rosto em paz.
Agora sinta todo o corpo inteiro. Entregue-se ao descanso. Você está seguro, você está amparado. Nada precisa ser feito agora.
Traga a atenção para a respiração. Respire profundamente. A cada inspiração, sinta a energia e a leveza entrando no seu corpo. A cada expiração, solte a exaustão, o peso da autocobrança, as preocupações, os medos, as angústias e ansiedades.
Sinta o fluxo natural da vida dentro de você. Cada respiração é um presente. Cada momento é uma oportunidade de renovação.
Agora, visualize um ambiente que traga paz. Pode ser um campo verde sob o céu azul, uma praia com ondas suaves, ou uma floresta silenciosa. Sinta-se em segurança e em tranquilidade neste lugar.
Imagine-se neste lugar com leveza, sem pressões ou preocupações. Sinta o calor do sol na pele, a brisa suave no rosto, os sons da natureza ao redor.
Permaneça neste espaço de paz por alguns instantes. Deixe que a tranquilidade preencha cada célula do seu corpo. Você merece este momento de descanso.
Se pensamentos difíceis surgirem, observe-os como nuvens que passam no céu. Reconheça-os, mas não se prenda a eles. Deixe que sigam o seu caminho, enquanto você permanece neste espaço de paz.
Você é maior do que seus pensamentos. Você é mais forte do que suas preocupações. Neste momento, você escolhe a calma.
Agora, lentamente, traga a atenção de volta ao corpo físico. Sinta o contato com o chão. Perceba o peso do corpo sendo sustentado.
Movimente suavemente os dedos das mãos e dos pés. Respire fundo e, quando se sentir pronto, abra os olhos devagar.
Volte a este espaço sempre que precisar. Esta paz está sempre dentro de você. Namastê.`;

function YogaNidraSection({ onComplete, darkMode: dm, onCheckAccess, defaultVoice, setDefaultVoice }: { onComplete?: () => void; darkMode?: boolean; onCheckAccess: (feature: string, action?: string) => boolean; defaultVoice: 'masculino' | 'feminino' | 'nenhuma'; setDefaultVoice: (v: 'masculino' | 'feminino' | 'nenhuma') => void }) {
  const [sessionRunning, setSessionRunning] = useState(false);
  const selectedVoice = defaultVoice;
  const setSelectedVoice = (v: 'masculino' | 'feminino' | 'nenhuma') => setDefaultVoice(v);
  const [selectedEnv, setSelectedEnv] = useState<YogaEnvironmentOption | null>(null);
  const [savedNatureMixes, setSavedNatureMixes] = useState<NatureMixPreset[]>([]);
  const yogaEnvironmentOptions = useMemo(
    () => [...yogaEnvironments, ...buildYogaMixEnvironments(savedNatureMixes)],
    [savedNatureMixes]
  );

  // Narration system states (same as MeditationSection)
  const [malePiperVoice, setMalePiperVoice] = useAppPersistence<string>('yoga_piper_voice_male', 'pt_BR-cadu-medium');
  const [femalePiperVoice, setFemalePiperVoice] = useAppPersistence<string>('yoga_piper_voice_female', 'pt-BR-FranciscaNeural');
  const [deviceSpeaking, setDeviceSpeaking] = useState(false);
  const [piperLoading, setPiperLoading] = useState(false);
  const [currentCueIndex, setCurrentCueIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [speedMode, setSpeedMode] = useAppPersistence<'0.9' | '1.0' | '1.1'>('yoga_speed_mode', '1.0');
  const [pauseMode, setPauseMode] = useAppPersistence<'curta' | 'normal' | 'profunda'>('yoga_pause_mode', 'profunda');
  const [captionOnly, setCaptionOnly] = useAppPersistence<boolean>('yoga_caption_only', false);
  const [sessionDone, setSessionDone] = useState(false);
  const [yogaPreparationActive, setYogaPreparationActive] = useState(false);
  const [yogaPreparationPaused, setYogaPreparationPaused] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);

  // Background sound states
  const [bgEnabled, setBgEnabled] = useAppPersistence<boolean>('yoga_bg_enabled', true);
  const [bgSoundId, setBgSoundId] = useAppPersistence<string>('yoga_bg_sound', 'meditacao');
  const [bgVolume, setBgVolume] = useAppPersistence<number>('yoga_bg_volume', 26);
  const [bgMixerEnabled, setBgMixerEnabled] = useAppPersistence<boolean>('yoga_bg_mixer', true);
  const [bgMixerTracks, setBgMixerTracks] = useAppPersistence<Record<string, number>>('yoga_bg_mixer_tracks', {});
  const [previewingBg, setPreviewingBg] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'voz' | 'sons' | 'ritmo'>('sons');

  const piperAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgPreviewRef = useRef<HTMLAudioElement | null>(null);
  const mixerPreviewRefs = useRef<Record<string, HTMLAudioElement>>({});
  const mixerAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const cueTickerRef = useRef<any>(null);
  const cueItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const narrationRunRef = useRef(0);

  const targetMs = 20 * 60 * 1000; // 20 minutes
  const yogaNidraGuidance = {
    greeting: 'Antes do play, prepare o corpo para descanso profundo.',
    intro: 'Yoga Nidra costuma ser praticado deitado, com o corpo bem apoiado e a respiração livre. A ideia é reduzir esforço físico para que a prática não comece em estado de alerta.',
    items: [
      'Deite-se de costas, com braços ao lado do corpo e palmas voltadas para cima, se isso for confortável.',
      'Use apoio sob a cabeça ou sob os joelhos se isso aliviar lombar, pescoço ou pernas.',
      'Deixe a respiração seguir natural, sem forçar profundidade. Primeiro acomode o corpo; depois aperte play.',
    ],
  };
  const yogaPreparationNarration = [
    yogaNidraGuidance.greeting,
    yogaNidraGuidance.intro,
    ...yogaNidraGuidance.items,
  ].join(' ');
  const yogaClosingNarration = 'Sessão concluída. Você terminou seu Yoga Nidra de hoje. Vá retornando com suavidade e leve esse estado de descanso profundo com você.';

  useEffect(() => {
    setSavedNatureMixes(loadNatureMixPresets());
    const syncPresets = () => setSavedNatureMixes(loadNatureMixPresets());
    window.addEventListener('nature-mix-presets-updated', syncPresets);
    return () => window.removeEventListener('nature-mix-presets-updated', syncPresets);
  }, []);

  type YogaNarrativeCue = { idx: number; text: string; speechMs: number; startMs: number; endMs: number; pauseMs: number };

  const buildYogaNarrativeCues = useCallback((speechDurationsMs?: number[]) => {
    const raw = yogaNidraFullText.replace(/\s+/g, ' ').trim();
    if (!raw) return [] as YogaNarrativeCue[];

    const sentences = (raw.match(/[^.!?]+[.!?]?/g) || []).map(s => s.trim()).filter(Boolean);

    const base = sentences.map((s, idx) => {
      const words = s.split(/\s+/).filter(Boolean).length;
      const speechMs = speechDurationsMs?.[idx] ?? Math.max(1000, words * 320);
      let pauseMs = /[!?]$/.test(s) ? 1700 : 1300;
      if (/respire|inspira|expire|feche os olhos|permaneça|relaxe|solte|sinta|perceba|observe/i.test(s)) pauseMs = 3200;
      if (/visualize|imagine|namastê/i.test(s)) pauseMs = 4000;
      if (pauseMode === 'curta') pauseMs = Math.round(pauseMs * 0.75);
      if (pauseMode === 'profunda') pauseMs = Math.round(pauseMs * 1.45);
      return { idx, text: s, speechMs, pauseMs };
    });

    const totalSpeech = base.reduce((a, b) => a + b.speechMs, 0);
    const totalPause = base.reduce((a, b) => a + b.pauseMs, 0);
    const adjustedPauseTotal = Math.max(0, targetMs - totalSpeech);
    const pauseScale = totalPause > 0 ? adjustedPauseTotal / totalPause : 1;

    let cursor = 0;
    let remainingPauseBudget = adjustedPauseTotal;
    return base.map((b, index) => {
      const pauseMs = index === base.length - 1
        ? Math.max(0, remainingPauseBudget)
        : Math.max(300, Math.round(b.pauseMs * pauseScale));
      const startMs = cursor;
      const endMs = cursor + b.speechMs;
      cursor = endMs + pauseMs;
      remainingPauseBudget = Math.max(0, remainingPauseBudget - pauseMs);
      return { idx: b.idx, text: b.text, speechMs: b.speechMs, startMs, endMs, pauseMs };
    });
  }, [pauseMode, targetMs]);
  const narrativeCues = useMemo(() => buildYogaNarrativeCues(), [buildYogaNarrativeCues]);
  const [runtimeNarrativeCues, setRuntimeNarrativeCues] = useState<YogaNarrativeCue[]>([]);
  const activeNarrativeCues = runtimeNarrativeCues.length ? runtimeNarrativeCues : narrativeCues;

  const formatClock = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // ---- Background Sound Functions ----
  const stopAllBgSounds = () => {
    if (bgAudioRef.current) { bgAudioRef.current.pause(); bgAudioRef.current.currentTime = 0; }
    Object.values(mixerAudioRefs.current).forEach(a => { a.pause(); a.currentTime = 0; });
    mixerAudioRefs.current = {};
  };

  const startMixerTracks = (mix: Record<string, number>) => {
    if (bgAudioRef.current) { bgAudioRef.current.pause(); bgAudioRef.current.currentTime = 0; }
    Object.values(mixerAudioRefs.current).forEach(a => { a.pause(); a.currentTime = 0; });
    mixerAudioRefs.current = {};
    Object.entries(mix).forEach(([soundId, vol]) => {
      const sound = ambientSounds.find(s => s.id === soundId && s.file);
      if (!sound?.file) return;
      const a = new Audio(encodeURI(sound.file));
      a.loop = true;
      a.volume = Math.max(0, Math.min(1, (vol / 100) * (bgVolume / 100)));
      mixerAudioRefs.current[soundId] = a;
      a.play().catch(() => {});
    });
  };

  const applyBackgroundDucking = (duck: boolean) => {
    if (!bgEnabled) return;
    const factor = duck ? 0.7 : 1;
    if (bgAudioRef.current) {
      const normal = Math.max(0, Math.min(1, bgVolume / 100));
      bgAudioRef.current.volume = normal * factor;
    }
    Object.entries(mixerAudioRefs.current).forEach(([soundId, audio]) => {
      const trackVol = bgMixerTracks[soundId] || 30;
      const normal = Math.max(0, Math.min(1, (trackVol / 100) * (bgVolume / 100)));
      audio.volume = normal * factor;
    });
  };

  const stopPreviewSounds = () => {
    if (bgPreviewRef.current) {
      bgPreviewRef.current.pause();
      bgPreviewRef.current.currentTime = 0;
      bgPreviewRef.current = null;
    }
    Object.values(mixerPreviewRefs.current).forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    mixerPreviewRefs.current = {};
    setPreviewingBg(false);
  };

  const previewBackgroundSound = (id: string) => {
    const s = ambientSounds.find((x) => x.id === id && x.file);
    if (!s?.file) return;
    if (previewingBg) {
      stopPreviewSounds();
      return;
    }
    const a = new Audio(encodeURI(s.file));
    a.volume = Math.max(0, Math.min(1, Math.max(18, bgVolume) / 100));
    bgPreviewRef.current = a;
    setPreviewingBg(true);
    a.play().catch(() => setPreviewingBg(false));
    const stop = () => stopPreviewSounds();
    a.onended = stop;
    setTimeout(stop, 7000);
  };

  const previewMixerSelection = () => {
    const activeEntries = Object.entries(bgMixerTracks).filter(([, vol]) => vol > 0);
    if (!activeEntries.length) return;

    if (previewingBg) {
      stopPreviewSounds();
      return;
    }

    stopPreviewSounds();
    setPreviewingBg(true);

    activeEntries.forEach(([soundId, vol]) => {
      const sound = ambientSounds.find((s) => s.id === soundId && s.file);
      if (!sound?.file) return;
      const a = new Audio(encodeURI(sound.file));
      a.loop = true;
      a.volume = Math.max(0, Math.min(1, (vol / 100) * (bgVolume / 100)));
      mixerPreviewRefs.current[soundId] = a;
      a.play().catch(() => {});
    });

    setTimeout(() => stopPreviewSounds(), 7000);
  };

  // ---- Piper TTS Narration ----
  const stopPiperAudio = () => {
    narrationRunRef.current += 1;
    if (piperAudioRef.current) { piperAudioRef.current.pause(); piperAudioRef.current.currentTime = 0; }
    if (cueTickerRef.current) { clearInterval(cueTickerRef.current); cueTickerRef.current = null; }
    applyBackgroundDucking(false);
    setDeviceSpeaking(false);
    setPiperLoading(false);
    setYogaPreparationActive(false);
    setYogaPreparationPaused(false);
  };

  const speakWithPiper = async (
    text: string,
    opts?: { gender?: 'masculino' | 'feminino'; voice?: string; onEnd?: () => void }
  ) => {
    if (!text?.trim()) return;
    if (deviceSpeaking) { stopPiperAudio(); return; }

    const gender = opts?.gender || (selectedVoice === 'masculino' ? 'masculino' : 'feminino');
    let voice = opts?.voice || (gender === 'masculino' ? malePiperVoice : femalePiperVoice);
    if (gender === 'feminino') {
      const allowed = ['pt-BR-FranciscaNeural', 'pt-BR-ThalitaMultilingualNeural'];
      if (!allowed.includes(String(voice))) voice = 'pt-BR-FranciscaNeural';
    }

    setPiperLoading(true);
    try {
      const res = await fetch('/api/piper-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, gender, voice }),
      });
      if (!res.ok) {
        const spoken = await speakBrowserText(text, {
          voice: gender,
          volume: 80,
        });
        if (spoken) opts?.onEnd?.();
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      piperAudioRef.current = audio;
      const speed = Number(speedMode || '1.0');
      if (Number.isFinite(speed) && speed > 0) audio.playbackRate = speed;
      setDeviceSpeaking(true);
      audio.onended = () => { setDeviceSpeaking(false); applyBackgroundDucking(false); URL.revokeObjectURL(url); opts?.onEnd?.(); };
      audio.onerror = () => { setDeviceSpeaking(false); applyBackgroundDucking(false); URL.revokeObjectURL(url); opts?.onEnd?.(); };
      await audio.play();
      applyBackgroundDucking(true);
    } catch {
      const spoken = await speakBrowserText(text, {
        voice: gender,
        volume: 80,
      });
      if (spoken) opts?.onEnd?.();
    } finally {
      setPiperLoading(false);
    }
  };

  const startNarrationFromCue = async (cueIdx: number, options?: { includePreparation?: boolean; includeClosing?: boolean }) => {
    if (!activeNarrativeCues.length) return;
    const safeIdx = Math.max(0, Math.min(cueIdx, activeNarrativeCues.length - 1));
    stopPiperAudio();
    setSessionDone(false);
    if (!sessionStartedAt) setSessionStartedAt(Date.now());

    const runId = narrationRunRef.current + 1;
    narrationRunRef.current = runId;
    if (cueTickerRef.current) { clearInterval(cueTickerRef.current); cueTickerRef.current = null; }

    const genderForRun = selectedVoice === 'masculino' ? 'masculino' : 'feminino';
    let voiceForRun = genderForRun === 'masculino' ? malePiperVoice : femalePiperVoice;
    if (genderForRun === 'feminino') {
      const allowed = ['pt-BR-FranciscaNeural', 'pt-BR-ThalitaMultilingualNeural'];
      if (!allowed.includes(String(voiceForRun))) voiceForRun = 'pt-BR-FranciscaNeural';
    }

    let preparedNarrativeCues = activeNarrativeCues;
    let elapsed = activeNarrativeCues[safeIdx].startMs;
    setElapsedMs(elapsed);

    if (options?.includePreparation && selectedVoice !== 'nenhuma') {
      setYogaPreparationActive(true);
      setYogaPreparationPaused(false);
      await new Promise<void>((resolve) => {
        speakWithPiper(yogaPreparationNarration, {
          gender: genderForRun,
          voice: voiceForRun,
          onEnd: () => resolve(),
        });
      });
      setYogaPreparationActive(false);
      setYogaPreparationPaused(false);
      if (narrationRunRef.current !== runId) return;
    }

    if (!captionOnly && selectedVoice !== 'nenhuma') {
      const speed = Number(speedMode || '1.0');
      setPiperLoading(true);
      try {
        const measuredSpeechDurations = await Promise.all(
          narrativeCues.map(async (cue) => {
            const res = await fetch('/api/piper-tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: cue.text, gender: genderForRun, voice: voiceForRun }),
            });
            if (!res.ok || narrationRunRef.current !== runId) {
              throw new Error('Failed to preload Yoga Nidra cue');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const durationMs = await new Promise<number>((resolve) => {
              const probe = new Audio(url);
              const finalize = () => {
                const rawDurationMs = Number.isFinite(probe.duration) && probe.duration > 0
                  ? probe.duration * 1000
                  : Math.max(1000, cue.text.split(/\s+/).filter(Boolean).length * 320);
                probe.src = '';
                URL.revokeObjectURL(url);
                resolve(rawDurationMs / (speed > 0 ? speed : 1));
              };
              probe.onloadedmetadata = finalize;
              probe.onerror = finalize;
            });
            return durationMs;
          }),
        );
        if (narrationRunRef.current !== runId) return;
        preparedNarrativeCues = buildYogaNarrativeCues(measuredSpeechDurations);
        setRuntimeNarrativeCues(preparedNarrativeCues);
        elapsed = preparedNarrativeCues[safeIdx]?.startMs || 0;
        setElapsedMs(elapsed);
      } finally {
        setPiperLoading(false);
      }
    } else {
      preparedNarrativeCues = buildYogaNarrativeCues();
      setRuntimeNarrativeCues(preparedNarrativeCues);
      elapsed = preparedNarrativeCues[safeIdx]?.startMs || 0;
      setElapsedMs(elapsed);
    }

    for (let i = safeIdx; i < preparedNarrativeCues.length; i++) {
      if (narrationRunRef.current !== runId) return;
      const cue = preparedNarrativeCues[i];
      setCurrentCueIndex(i);

      if (!captionOnly) {
        await new Promise<void>((resolve) => {
          speakWithPiper(cue.text, {
            gender: genderForRun,
            voice: voiceForRun,
            onEnd: () => resolve(),
          });
        });
      } else {
        const speed = Number(speedMode || '1.0');
        const simulatedMs = Math.max(800, Math.round(cue.endMs - cue.startMs) / (speed > 0 ? speed : 1));
        await new Promise((r) => setTimeout(r, simulatedMs));
      }

      if (narrationRunRef.current !== runId) return;
      elapsed = cue.endMs;
      setElapsedMs(elapsed);

      // Pause between cues
      await new Promise((r) => setTimeout(r, cue.pauseMs));
      elapsed += cue.pauseMs;
      setElapsedMs(elapsed);
    }

    if (narrationRunRef.current === runId) {
      setDeviceSpeaking(false);
      setSessionDone(true);
      if (options?.includeClosing && selectedVoice !== 'nenhuma') {
        await new Promise<void>((resolve) => {
          speakWithPiper(yogaClosingNarration, {
            gender: selectedVoice === 'masculino' ? 'masculino' : 'feminino',
            onEnd: () => resolve(),
          });
        });
      }
      if (onComplete) onComplete();
    }
  };

  const toggleYogaPreparationPause = async () => {
    if (!yogaPreparationActive || !piperAudioRef.current) return;
    if (yogaPreparationPaused) {
      try {
        await piperAudioRef.current.play();
        setYogaPreparationPaused(false);
      } catch {}
      return;
    }
    piperAudioRef.current.pause();
    setYogaPreparationPaused(true);
  };

  // Manage bg sounds
  useEffect(() => {
    if (!sessionRunning || !sessionStartedAt || !bgEnabled) { stopAllBgSounds(); return; }
    if (bgMixerEnabled && Object.keys(bgMixerTracks).length > 0) {
      if (bgAudioRef.current) { bgAudioRef.current.pause(); bgAudioRef.current.currentTime = 0; }
      // Check if mixer tracks already match what's playing to avoid restart glitch
      const currentIds = Object.keys(mixerAudioRefs.current).sort().join(',');
      const targetIds = Object.keys(bgMixerTracks).filter(k => bgMixerTracks[k] > 0).sort().join(',');
      if (currentIds === targetIds) {
        // Just update volumes
        Object.entries(mixerAudioRefs.current).forEach(([soundId, audio]) => {
          const trackVol = bgMixerTracks[soundId] || 30;
          audio.volume = Math.max(0, Math.min(1, (trackVol / 100) * (bgVolume / 100)));
        });
        return;
      }
      startMixerTracks(bgMixerTracks);
      return;
    }
    Object.values(mixerAudioRefs.current).forEach(a => { a.pause(); a.currentTime = 0; });
    mixerAudioRefs.current = {};
    const sound = ambientSounds.find((s) => s.id === bgSoundId && s.file);
    if (!sound?.file) return;
    if (!bgAudioRef.current || !bgAudioRef.current.src.includes(encodeURI(sound.file))) {
      if (bgAudioRef.current) bgAudioRef.current.pause();
      const a = new Audio(encodeURI(sound.file)); a.loop = true; bgAudioRef.current = a; a.play().catch(() => {});
    }
    if (bgAudioRef.current) bgAudioRef.current.volume = Math.max(0, Math.min(1, bgVolume / 100));
  }, [sessionRunning, sessionStartedAt, bgEnabled, bgSoundId, bgVolume, bgMixerEnabled, bgMixerTracks]);

  // Auto-scroll cue
  useEffect(() => {
    const el = cueItemRefs.current[currentCueIndex];
    try { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
  }, [currentCueIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopPiperAudio(); stopAllBgSounds(); stopPreviewSounds(); };
  }, []);

  const stopAll = () => {
    stopPiperAudio();
    stopAllBgSounds();
    setSessionRunning(false);
    setSessionDone(false);
    setElapsedMs(0);
    setCurrentCueIndex(0);
    setSessionStartedAt(null);
    setRuntimeNarrativeCues([]);
  };

  const getSuggestedMixForEnv = (env: YogaEnvironmentOption): Record<string, number> => {
    if (env.customMix && Object.keys(env.customMix).length > 0) {
      return env.customMix;
    }

    const allAmbient = ambientSounds.filter((s) => s.file);
    const exists = (id: string) => allAmbient.some((s) => s.id === id);

    const targetCountByEnv: Record<string, number> = {
      vento: 2,
      riacho: 2,
      lareira: 2,
      chuva: 3,
      praia: 3,
      floresta: 3,
      noite: 3,
      meditacao: 3,
      tempestade: 4,
      amanhecer: 4,
      cabana: 4,
      costa: 4,
      zen: 4,
      pico: 4,
      espaco: 4,
    };

    const coherentExtrasByEnv: Record<string, string[]> = {
      praia: ['mar', 'agua-mar', 'praia', 'vento'],
      floresta: ['floresta', 'floresta-profunda', 'passaros-1', 'passaros-2'],
      noite: ['noite-1', 'noite', 'grilo', 'vento-1'],
      chuva: ['chuva-janela-longa', 'chuva', 'chuva-janela', 'vento-1'],
      lareira: ['lareira', 'lareira-1', 'fogueira'],
      riacho: ['riacho-2', 'riacho', 'riacho-3'],
      meditacao: ['meditacao', 'om', 'om-1', 'dormir'],
      vento: ['vento', 'vento-1'],
      tempestade: ['chuva-janela-longa', 'vento-1', 'floresta', 'trovao', 'noite'],
      amanhecer: ['passaros-2', 'dia', 'vento', 'passaros-3'],
      cabana: ['lareira-1', 'chuva-janela', 'vento-1', 'lareira'],
      costa: ['mar', 'grilo', 'noite-1', 'vento'],
      zen: ['riacho-3', 'passaros-3', 'om', 'meditacao'],
      pico: ['vento', 'om-1', 'noite', 'vento-1'],
      espaco: ['dormir', 'noite-1', 'om', 'om-1'],
    };

    const orderedCandidates = [
      ...env.musicIds,
      ...(coherentExtrasByEnv[env.id] || []),
    ].filter((id, idx, arr) => arr.indexOf(id) === idx && exists(id));

    const desiredCount = Math.max(2, Math.min(4, targetCountByEnv[env.id] ?? env.musicIds.length ?? 3));
    const selectedIds = orderedCandidates.slice(0, desiredCount);

    const baseVolumes = [38, 30, 22, 16];
    return selectedIds.reduce((acc, id, i) => {
      acc[id] = baseVolumes[i] ?? 14;
      return acc;
    }, {} as Record<string, number>);
  };

  const mixerPresets: Array<{ id: string; name: string; mix: Record<string, number> }> = [
    { id: 'deep-focus', name: 'Foco Profundo', mix: { chuva: 34, vento: 22, om: 18, noite: 14 } },
    { id: 'deep-sleep', name: 'Sono Profundo', mix: { dormir: 36, noite: 24, chuva: 18, om: 12 } },
    { id: 'forest-zen', name: 'Floresta Zen', mix: { floresta: 34, 'passaros-2': 20, riacho: 22, vento: 14 } },
    { id: 'cozy-rain', name: 'Chuva Aconchegante', mix: { 'chuva-janela-longa': 36, lareira: 20, vento: 12, noite: 10 } },
    { id: 'ocean-calm', name: 'Calmaria do Mar', mix: { mar: 34, praia: 22, vento: 16, om: 12 } },
  ];

  const applyMixerPreset = (mix: Record<string, number>) => {
    setBgMixerEnabled(true);
    setBgMixerTracks(mix);
    const first = Object.keys(mix)[0];
    if (first) setBgSoundId(first);
    if (bgEnabled) startMixerTracks(mix);
  };

  const startSession = (env: YogaEnvironmentOption) => {
    setSelectedEnv(env);
    setSessionRunning(true);
    setSessionDone(false);
    setElapsedMs(0);
    setCurrentCueIndex(0);
    setSessionStartedAt(null);
    const suggestedMix = getSuggestedMixForEnv(env);
    setBgMixerEnabled(true);
    setBgMixerTracks(suggestedMix);
    setBgSoundId(env.musicIds[0] || 'meditacao');
    stopAllBgSounds();
  };

  useEffect(() => {
    if (!selectedEnv) return;
    const stillExists = yogaEnvironmentOptions.find((env) => env.id === selectedEnv.id);
    if (stillExists) return;

    const fallbackEnv = yogaEnvironments[0];
    const fallbackMix = getSuggestedMixForEnv(fallbackEnv);
    setSelectedEnv(fallbackEnv);
    setBgMixerEnabled(true);
    setBgMixerTracks(fallbackMix);
    setBgSoundId(fallbackEnv.musicIds[0] || 'meditacao');
    if (sessionRunning && bgEnabled) {
      startMixerTracks(fallbackMix);
    }
  }, [bgEnabled, selectedEnv, sessionRunning, yogaEnvironmentOptions]);

  const jumpBySeconds = (deltaSec: number) => {
    const target = Math.max(0, elapsedMs + deltaSec * 1000);
    const idx = activeNarrativeCues.findIndex((c) => target >= c.startMs && target < c.endMs + c.pauseMs);
    startNarrationFromCue(idx >= 0 ? idx : (deltaSec > 0 ? activeNarrativeCues.length - 1 : 0));
  };

  // ---- SESSION RUNNING ----
  if (sessionRunning && selectedEnv) {
    return (
      <div className={`p-4 animate-fade-in max-w-lg mx-auto pb-32 ${dm ? 'text-white' : ''}`}>
        <button type="button" onClick={stopAll} className={`mb-3 w-full px-4 py-3 rounded-2xl text-sm font-bold ${dm ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
          ← Voltar para seleção de ambiente
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <span className="text-4xl">{selectedEnv.emoji}</span>
          <h2 className={`text-xl font-extrabold mt-1 ${dm ? 'text-slate-100' : 'text-gray-900'}`}>Yoga Nidra — {selectedEnv.name}</h2>
          <p className={`text-xs mt-1 ${dm ? 'text-indigo-400' : 'text-indigo-600'}`}>Sono Yógico — 20 minutos</p>
        </div>

        <div className={`mb-4 rounded-[2rem] border px-4 py-4 ${dm ? 'border-white/10 bg-white/[0.04] text-slate-100' : 'border-slate-200 bg-white/90 text-slate-800 shadow-sm'}`}>
          <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Antes de começar</p>
          <h3 className="mt-3 text-lg font-[1000] tracking-tight">{yogaNidraGuidance.greeting}</h3>
          <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{yogaNidraGuidance.intro}</p>
          <div className="mt-4 space-y-2.5">
            {yogaNidraGuidance.items.map((item) => (
              <div key={item} className={`flex items-start gap-3 rounded-[1.2rem] px-3.5 py-3 text-sm font-semibold leading-relaxed ${dm ? 'bg-white/[0.03] text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                <span className={`mt-0.5 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className={`mt-4 text-xs font-semibold ${dm ? 'text-slate-400' : 'text-slate-500'}`}>A sessão só começa quando você apertar play. Se sair desta tela, a narração e os sons param junto.</p>
        </div>

        {/* Timer */}
        <div className="flex justify-center gap-4 mb-4">
          <span className={`px-3 py-1.5 rounded-xl text-sm font-black ${dm ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
            ⏱ {formatClock(Math.max(0, targetMs - elapsedMs))}
          </span>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${dm ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
            Frase {Math.min(activeNarrativeCues.length, currentCueIndex + 1)} de {activeNarrativeCues.length}
          </span>
        </div>

        {/* Settings panel */}
        <div className={`rounded-2xl border mb-4 overflow-hidden ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'}`}>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-full flex items-center justify-between p-4 text-left">
            <div>
              <h3 className={`font-bold text-sm ${dm ? 'text-slate-200' : 'text-gray-800'}`}>⚙️ Configurações</h3>
              <p className={`text-xs mt-0.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Voz: {selectedVoice} • {selectedEnv.emoji} {selectedEnv.name} • Pausa: {pauseMode}</p>
            </div>
            <span className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {settingsOpen && (
            <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700 space-y-3">

              {/* Quick Environment Switch */}
              <div>
                <p className={`text-xs font-black mb-2 ${dm ? 'text-teal-300' : 'text-teal-700'}`}>🌍 Trocar Ambiente</p>
                <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {yogaEnvironmentOptions.map((env) => {
                    const isCurrent = env.id === selectedEnv.id;
                    return (
                      <button
                        key={env.id}
                        type="button"
                        onClick={() => {
                          if (isCurrent) return;
                          stopAllBgSounds();
                          setSelectedEnv(env);
                          const suggestedMix = getSuggestedMixForEnv(env);
                          setBgMixerEnabled(true);
                          setBgMixerTracks(suggestedMix);
                          setBgSoundId(env.musicIds[0] || 'meditacao');
                          // Start sounds immediately from user gesture to avoid autoplay block
                          if (bgEnabled) {
                            startMixerTracks(suggestedMix);
                          }
                        }}
                        className={`py-2 px-1.5 rounded-xl text-center transition-all active:scale-95 ${
                          isCurrent
                            ? `bg-gradient-to-br ${env.gradient} text-white shadow-md ring-2 ring-white/40`
                            : (dm ? 'bg-slate-900/60 text-slate-400 hover:bg-slate-700/60' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')
                        }`}
                      >
                        <span className="text-lg block">{env.emoji}</span>
                        <span className="text-[10px] font-bold leading-tight block mt-0.5">{env.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['voz', 'sons', 'ritmo'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSettingsTab(tab)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border ${settingsTab === tab ? 'bg-indigo-600 text-white border-indigo-600' : (dm ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600')}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {settingsTab === 'voz' && (
              <>
              {/* Quick Voice Switch */}
              <div>
                <p className={`text-xs font-black mb-2 ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>🎙️ Voz</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setSelectedVoice('feminino'); setCaptionOnly(false); }} className={`min-h-[40px] py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${selectedVoice === 'feminino' ? (dm ? 'bg-pink-500/20 border-pink-400 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-700') : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')}`}>👩 Feminina</button>
                  <button onClick={() => { setSelectedVoice('masculino'); setCaptionOnly(false); }} className={`min-h-[40px] py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${selectedVoice === 'masculino' ? (dm ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700') : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')}`}>👨 Masculina</button>
                  <button onClick={() => { setSelectedVoice('nenhuma'); setCaptionOnly(true); }} className={`min-h-[40px] py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${selectedVoice === 'nenhuma' ? (dm ? 'bg-slate-700 border-slate-500 text-slate-200' : 'bg-slate-200 border-slate-400 text-slate-700') : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')}`}>🔇 Sem Voz</button>
                </div>
              </div>

              {/* Voice picker */}
              {selectedVoice !== 'nenhuma' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className={`p-2 rounded-xl border ${dm ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] font-black mb-1 ${dm ? 'text-blue-300' : 'text-blue-700'}`}>Voz Masculina</p>
                    <select value={malePiperVoice} onChange={(e) => setMalePiperVoice(e.target.value)} className={`w-full p-1.5 rounded-lg text-xs ${dm ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
                      <option value="pt_BR-cadu-medium">Cadu</option>
                      <option value="pt_BR-edresson-low">Edresson</option>
                      <option value="pt_BR-jeff-medium">Jeff</option>
                      <option value="pt_BR-faber-medium">Faber</option>
                      <option value="pt-BR-AntonioNeural">Antonio</option>
                    </select>
                  </div>
                  <div className={`p-2 rounded-xl border ${dm ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] font-black mb-1 ${dm ? 'text-pink-300' : 'text-pink-700'}`}>Voz Feminina</p>
                    <select value={femalePiperVoice} onChange={(e) => setFemalePiperVoice(e.target.value)} className={`w-full p-1.5 rounded-lg text-xs ${dm ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
                      <option value="pt-BR-FranciscaNeural">Francisca</option>
                      <option value="pt-BR-ThalitaMultilingualNeural">Thalita</option>
                    </select>
                  </div>
                </div>
              )}
              </>
              )}

              {settingsTab === 'ritmo' && (
              <>
              <button
                type="button"
                onClick={() => setShowAdvancedSettings((v) => !v)}
                className={`w-full py-2 rounded-xl text-xs font-bold border ${dm ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                {showAdvancedSettings ? 'Ocultar ajustes avançados' : 'Mostrar ajustes avançados'}
              </button>

              {showAdvancedSettings && (
                <>
                  {/* Speed & Pause */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className={`text-[10px] font-black mb-1 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Velocidade</p>
                      <div className="flex gap-1">
                        {(['0.9', '1.0', '1.1'] as const).map(s => (
                          <button key={s} onClick={() => setSpeedMode(s)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${speedMode === s ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-[10px] font-black mb-1 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Pausas</p>
                      <div className="flex gap-1">
                        {(['curta', 'normal', 'profunda'] as const).map(p => (
                          <button key={p} onClick={() => setPauseMode(p)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize ${pauseMode === p ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>


                </>
              )}


              {/* Background Sound */}
              <div className={`p-3 rounded-2xl border ${dm ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-xs font-black mb-3 ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>🎵 Fundo Musical</p>
                <div className="flex items-center gap-2 mb-3">
                  <button type="button" onClick={() => setBgEnabled(!bgEnabled)} className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${bgEnabled ? 'bg-emerald-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700 border border-slate-200')}`}>
                    {bgEnabled ? '🔊 ON' : '🔇 OFF'}
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    <input type="range" min={0} max={100} value={bgVolume} onChange={(e) => setBgVolume(Number(e.target.value))} className="w-full" />
                    <span className="text-xs font-bold min-w-[32px] text-right">{bgVolume}%</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setBgMixerEnabled(false)} className={`flex-1 min-h-[34px] py-1.5 rounded-xl text-xs font-bold ${!bgMixerEnabled ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 border border-slate-200')}`}>🎵 Som Único</button>
                  <button type="button" onClick={() => setBgMixerEnabled(true)} className={`flex-1 min-h-[34px] py-1.5 rounded-xl text-xs font-bold ${bgMixerEnabled ? 'bg-purple-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 border border-slate-200')}`}>🎛️ Mixer</button>
                </div>
                {!bgMixerEnabled && (
                  <div className="space-y-2">
                    <select value={bgSoundId} onChange={(e) => setBgSoundId(e.target.value)} className={`w-full min-h-[40px] p-2 rounded-xl text-sm ${dm ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
                      {Object.entries(ambientSounds.filter(s => s.file).reduce((acc, s) => { if (!acc[s.category]) acc[s.category] = []; acc[s.category].push(s); return acc; }, {} as Record<string, typeof ambientSounds>)).map(([cat, sounds]) => (
                        <optgroup key={cat} label={cat}>{sounds.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}</optgroup>
                      ))}
                    </select>
                    <button type="button" onClick={() => previewBackgroundSound(bgSoundId)} className={`w-full min-h-[36px] py-1.5 rounded-xl text-xs font-bold ${dm ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700 border border-slate-200'}`}>{previewingBg ? '⏹️ Parar prévia' : '🔊 Ouvir prévia'}</button>
                  </div>
                )}
                {bgMixerEnabled && (
                  <div className="space-y-2">
                    <p className={`text-[11px] ${dm ? 'text-purple-300' : 'text-purple-600'}`}>Ajuste cada som:</p>
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {ambientSounds.filter(s => s.file).map((s) => {
                        const vol = bgMixerTracks[s.id] || 0;
                        const isActive = vol > 0;
                        return (
                          <div key={s.id} className={`flex items-center gap-2 p-1.5 rounded-xl ${isActive ? (dm ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-50 border border-purple-200') : ''}`}>
                            <button type="button" onClick={() => { const n = { ...bgMixerTracks }; if (isActive) delete n[s.id]; else n[s.id] = 30; setBgMixerTracks(n); }} className={`w-7 h-7 rounded-lg text-xs shrink-0 flex items-center justify-center ${isActive ? 'bg-purple-600 text-white' : (dm ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400')}`}>{isActive ? '✓' : '+'}</button>
                            <span className="text-[11px] font-medium flex-1 leading-tight break-words" title={s.name}>{s.emoji} {s.name}</span>
                            {isActive && <div className="flex-1 flex items-center gap-1"><input type="range" min={5} max={100} value={vol} onChange={(e) => setBgMixerTracks({ ...bgMixerTracks, [s.id]: Number(e.target.value) })} className="w-full" /><span className="text-[10px] font-bold min-w-[24px] text-right">{vol}%</span></div>}
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(bgMixerTracks).filter(k => bgMixerTracks[k] > 0).length > 0 && (
                      <div className={`space-y-2 pt-2 border-t ${dm ? 'border-slate-700' : 'border-slate-200'}`}>
                        <button
                          type="button"
                          onClick={previewMixerSelection}
                          className={`w-full py-2 rounded-xl text-xs font-bold ${dm ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white'}`}
                        >
                          {previewingBg ? '⏹️ Parar prévia do mixer' : '🎧 Ouvir como ficou'}
                        </button>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] flex-1 ${dm ? 'text-purple-300' : 'text-purple-600'}`}>🎛️ {Object.keys(bgMixerTracks).filter(k => bgMixerTracks[k] > 0).length} sons ativos</span>
                          <button type="button" onClick={() => setBgMixerTracks({})} className={`text-[11px] px-2 py-1 rounded-lg font-bold ${dm ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>Limpar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}
        </div>

        {/* Narration cues */}
        <div className={`rounded-2xl p-4 border mb-4 ${dm ? 'bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-indigo-800/30 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 border-indigo-200'}`}>
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
            {activeNarrativeCues.map((cue, i) => {
              const isActive = i === currentCueIndex && (deviceSpeaking || captionOnly);
              const isPast = i < currentCueIndex;
              return (
                <button
                  key={cue.idx}
                  ref={(el) => { cueItemRefs.current[i] = el; }}
                  type="button"
                  onClick={() => startNarrationFromCue(i)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                    isActive
                      ? (dm ? 'bg-indigo-600/30 text-indigo-200 font-bold scale-[1.02] shadow-lg' : 'bg-indigo-100 text-indigo-900 font-bold scale-[1.02] shadow-md')
                      : isPast
                        ? (dm ? 'text-slate-500 opacity-50' : 'text-gray-400 opacity-50')
                        : (dm ? 'text-slate-300 hover:bg-slate-700/30' : 'text-gray-600 hover:bg-white/50')
                  }`}
                >
                  {cue.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {!deviceSpeaking && !captionOnly && selectedVoice !== 'nenhuma' && !yogaPreparationActive && (
            <button onClick={() => startNarrationFromCue(currentCueIndex, { includePreparation: currentCueIndex === 0 && !sessionStartedAt, includeClosing: true })} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
              {piperLoading ? '⏳ Carregando...' : (sessionStartedAt ? '▶️ Retomar narração' : '▶️ Iniciar com preparação')}
            </button>
          )}
          {!deviceSpeaking && captionOnly && (
            <button onClick={() => startNarrationFromCue(currentCueIndex)} className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold">
              ▶️ Iniciar Legendas
            </button>
          )}
          {!deviceSpeaking && !captionOnly && !sessionStartedAt && !yogaPreparationActive && (
            <button onClick={() => startNarrationFromCue(0, { includePreparation: false, includeClosing: true })} className={`px-4 py-2.5 rounded-xl text-xs font-bold ${dm ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
              Pular preparação
            </button>
          )}
          {yogaPreparationActive && (
            <>
              <button onClick={stopPiperAudio} className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold">
                Parar preparação
              </button>
              <button onClick={toggleYogaPreparationPause} className={`px-4 py-2.5 rounded-xl text-xs font-bold ${dm ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                {yogaPreparationPaused ? 'Retomar preparação' : 'Pausar preparação'}
              </button>
              <button onClick={() => startNarrationFromCue(0, { includePreparation: false, includeClosing: true })} className={`px-4 py-2.5 rounded-xl text-xs font-bold ${dm ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                Pular preparação
              </button>
            </>
          )}
          {deviceSpeaking && !yogaPreparationActive && (
            <button onClick={stopPiperAudio} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold">
              ⏸️ Pausar
            </button>
          )}
          <button onClick={() => jumpBySeconds(-30)} className={`px-3 py-2.5 rounded-xl text-xs font-bold ${dm ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>-30s</button>
          <button onClick={() => jumpBySeconds(30)} className={`px-3 py-2.5 rounded-xl text-xs font-bold ${dm ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>+30s</button>
        </div>

        {sessionDone && (
          <div className={`rounded-2xl border p-4 text-center ${dm ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="font-black text-sm">✅ Sessão concluída</p>
            <p className="text-xs mt-1">Parabéns! Yoga Nidra de 20 minutos completo. Namastê 🙏</p>
          </div>
        )}
      </div>
    );
  }

  // ---- PRE-SESSION: Explanation + Environment Selection ----
  return (
    <div className="p-4 animate-fade-in overflow-y-auto pb-32 max-w-lg mx-auto">
      <div className="mb-6 pt-4">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Escolha sua sessão"
          title="Yoga Nidra"
          description="Entre em um relaxamento profundo, escolha o ambiente e prepare o corpo para desacelerar com suavidade."
          icon="🌙"
        />
      </div>

      {/* Explanation */}
      <div className={`rounded-3xl p-6 mb-6 border shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'}`}>
        <h3 className={`font-bold mb-3 flex items-center gap-2 ${dm ? 'text-indigo-300' : 'text-indigo-800'}`}>O que é Yoga Nidra?</h3>
        <p className={`text-sm leading-relaxed mb-4 ${dm ? 'text-slate-400' : 'text-gray-600'}`}>
          Yoga Nidra é uma prática milenar de <strong>relaxamento profundo</strong> que significa &ldquo;sono yógico&rdquo;.
          Diferente da meditação, você pratica deitado(a), sendo guiado(a) por uma narração.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { icon: '😴', text: 'Melhora o sono' },
            { icon: '😌', text: 'Reduz ansiedade' },
            { icon: '🧠', text: 'Clareza mental' },
            { icon: '💪', text: 'Restaura energia' },
          ].map(benefit => (
            <div key={benefit.text} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm ${dm ? 'bg-slate-900/50' : 'bg-white/80'}`}>
              <span className="text-xl">{benefit.icon}</span>
              <span className={`text-xs font-bold ${dm ? 'text-slate-300' : 'text-gray-700'}`}>{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/45 backdrop-blur-sm animate-fade-in" onPointerDown={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
          <div className={`absolute left-1/2 top-[42%] w-[94%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl p-4 border max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl ${dm ? 'bg-[radial-gradient(circle_at_top,#1a3147_0%,transparent_42%),linear-gradient(180deg,#0f1828_0%,#132136_100%)] border-cyan-900/30 text-slate-100' : 'bg-white border-slate-200'}`}>
            <div className="w-12 h-1.5 bg-slate-400/40 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-black ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Ajustes da Sessão</h4>
              <button type="button" onClick={() => setSettingsOpen(false)} className={`px-3 py-1 rounded-lg text-xs font-bold ${dm ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>Fechar</button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['voz', 'sons', 'ritmo'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setSettingsTab(tab)} className={`py-2 rounded-xl text-xs font-bold capitalize border ${settingsTab === tab ? 'bg-indigo-600 text-white border-indigo-600' : (dm ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600')}`}>{tab}</button>
              ))}
            </div>

            {settingsTab === 'voz' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setSelectedVoice('feminino'); setCaptionOnly(false); }} className={`min-h-[40px] py-2 rounded-xl text-xs font-bold border ${selectedVoice === 'feminino' ? (dm ? 'bg-pink-500/20 border-pink-400 text-pink-300' : 'bg-pink-50 border-pink-200 text-pink-700') : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')}`}>Feminina</button>
                  <button onClick={() => { setSelectedVoice('masculino'); setCaptionOnly(false); }} className={`min-h-[40px] py-2 rounded-xl text-xs font-bold border ${selectedVoice === 'masculino' ? (dm ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700') : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')}`}>Masculina</button>
                  <button onClick={() => { setSelectedVoice('nenhuma'); setCaptionOnly(true); }} className={`min-h-[40px] py-2 rounded-xl text-xs font-bold border ${selectedVoice === 'nenhuma' ? (dm ? 'bg-slate-700 border-slate-500 text-slate-200' : 'bg-slate-200 border-slate-400 text-slate-700') : (dm ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-500')}`}>Sem voz</button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => speakWithPiper('Olá, esta é uma prévia da voz masculina.', { gender: 'masculino', voice: malePiperVoice })}
                      className={`py-2 rounded-xl text-xs font-bold ${dm ? 'bg-blue-900/40 text-blue-200 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}
                    >
                      Ouvir prévia (masc)
                    </button>
                    <button
                      type="button"
                      onClick={() => speakWithPiper('Olá, esta é uma prévia da voz feminina.', { gender: 'feminino', voice: femalePiperVoice })}
                      className={`py-2 rounded-xl text-xs font-bold ${dm ? 'bg-pink-900/40 text-pink-200 border border-pink-700' : 'bg-pink-100 text-pink-700 border border-pink-200'}`}
                    >
                      Ouvir prévia (fem)
                    </button>
                  </div>
                  <div className={`p-2 rounded-xl border ${dm ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[11px] font-black mb-1 ${dm ? 'text-blue-300' : 'text-blue-700'}`}>Voz masculina</p>
                    <select value={malePiperVoice} onChange={(e) => setMalePiperVoice(e.target.value)} className={`w-full p-2 rounded-lg text-xs ${dm ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
                      <option value="pt_BR-cadu-medium">Cadu</option><option value="pt_BR-edresson-low">Edresson</option><option value="pt_BR-jeff-medium">Jeff</option><option value="pt_BR-faber-medium">Faber</option><option value="pt-BR-AntonioNeural">Antonio</option>
                    </select>
                  </div>
                  <div className={`p-2 rounded-xl border ${dm ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[11px] font-black mb-1 ${dm ? 'text-pink-300' : 'text-pink-700'}`}>Voz feminina</p>
                    <select value={femalePiperVoice} onChange={(e) => setFemalePiperVoice(e.target.value)} className={`w-full p-2 rounded-lg text-xs ${dm ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
                      <option value="pt-BR-FranciscaNeural">Francisca</option><option value="pt-BR-ThalitaMultilingualNeural">Thalita</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'sons' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setBgEnabled(!bgEnabled)} className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold ${bgEnabled ? 'bg-emerald-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700 border border-slate-200')}`}>{bgEnabled ? 'ON' : 'OFF'}</button>
                  <div className="flex-1 grid grid-cols-3 gap-1">
                    {[30,50,100].map(v => <button key={v} type="button" onClick={() => setBgVolume(v)} className={`py-1.5 rounded-lg text-[10px] font-bold ${bgVolume===v ? 'bg-emerald-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600')}`}>{v===30?'Baixo':v===50?'Médio':'Alto'}</button>)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBgMixerEnabled(false)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${!bgMixerEnabled ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600')}`}>Som único</button>
                  <button type="button" onClick={() => setBgMixerEnabled(true)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${bgMixerEnabled ? 'bg-purple-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 text-slate-600')}`}>Mixer</button>
                </div>

                {!bgMixerEnabled && (
                  <div className="space-y-2">
                    <select value={bgSoundId} onChange={(e) => setBgSoundId(e.target.value)} className={`w-full min-h-[40px] p-2 rounded-xl text-sm ${dm ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
                      {Object.entries(ambientSounds.filter(s => s.file).reduce((acc, s) => { if (!acc[s.category]) acc[s.category] = []; acc[s.category].push(s); return acc; }, {} as Record<string, typeof ambientSounds>)).map(([cat, sounds]) => (
                        <optgroup key={cat} label={cat}>{sounds.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}</optgroup>
                      ))}
                    </select>
                    <button type="button" onClick={() => previewBackgroundSound(bgSoundId)} className={`w-full py-2 rounded-xl text-xs font-bold ${dm ? 'bg-slate-700 text-slate-200' : 'bg-white border border-slate-200 text-slate-700'}`}>{previewingBg ? 'Parar prévia' : 'Ouvir prévia'}</button>
                  </div>
                )}

                {bgMixerEnabled && (
                  <>
                    <div className="space-y-2">
                      <p className={`text-[11px] font-bold ${dm ? 'text-purple-300' : 'text-purple-700'}`}>Mixers pré-definidos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {mixerPresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyMixerPreset(preset.mix)}
                            className={`py-2 px-2 rounded-xl text-[11px] font-bold border ${dm ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {ambientSounds.filter(s => s.file).map((s) => {
                        const isActive = (bgMixerTracks[s.id] || 0) > 0;
                        return (
                          <div key={s.id} className={`p-2 rounded-xl border ${isActive ? 'bg-purple-600/20 border-purple-500' : (dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200')}`}>
                            <button type="button" onClick={() => {
                              const n = { ...bgMixerTracks };
                              if (isActive) delete n[s.id]; else n[s.id] = 30;
                              setBgMixerTracks(n);
                            }} className={`w-full text-left ${isActive ? 'text-purple-100' : (dm ? 'text-slate-200' : 'text-slate-700')}`}>
                              <span className="text-base block">{s.emoji}</span>
                              <span className="text-[11px] font-bold leading-tight break-words">{s.name}</span>
                            </button>

                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={previewMixerSelection}
                        disabled={Object.keys(bgMixerTracks).filter(k => bgMixerTracks[k] > 0).length === 0}
                        className={`w-full py-2 rounded-xl text-xs font-bold ${Object.keys(bgMixerTracks).filter(k => bgMixerTracks[k] > 0).length === 0 ? (dm ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400') : (dm ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white')}`}
                      >
                        {previewingBg ? '⏹️ Parar prévia do mixer' : '🎧 Ouvir como ficou'}
                      </button>
                      <p className={`text-[11px] ${dm ? 'text-purple-300' : 'text-purple-600'}`}>{Object.keys(bgMixerTracks).filter(k => bgMixerTracks[k] > 0).length} sons ativos</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {settingsTab === 'ritmo' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className={`text-[10px] font-black mb-1 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Velocidade</p><div className="flex gap-1">{(['0.9','1.0','1.1'] as const).map(s => <button key={s} onClick={() => setSpeedMode(s)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${speedMode===s ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>{s}x</button>)}</div></div>
                  <div><p className={`text-[10px] font-black mb-1 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Pausas</p><div className="flex gap-1">{(['curta','normal','profunda'] as const).map(p => <button key={p} onClick={() => setPauseMode(p)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize ${pauseMode===p ? 'bg-indigo-600 text-white' : (dm ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>{p}</button>)}</div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Environment Selection */}
      <div className="mb-8">
        <h3 className={`font-bold mb-2 flex items-center gap-2 text-lg ${dm ? 'text-slate-200' : 'text-gray-800'}`}>🌍 Escolha o Ambiente</h3>
        <p className={`text-sm font-medium mb-4 ${dm ? 'text-slate-500' : 'text-gray-500'}`}>Selecione o ambiente que você quer deixar pronto. A prática só começa quando você apertar play.</p>
        <div className="grid grid-cols-2 gap-3">
          {yogaEnvironmentOptions.map((env) => (
            <button key={env.id} onClick={() => startSession(env)} className={`bg-gradient-to-br ${env.gradient} rounded-3xl p-5 text-left text-white shadow-md hover:shadow-lg transition-all active:scale-95 relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-white/20"></div>
              <span className="text-4xl block mb-2 filter drop-shadow-sm group-hover:scale-110 transition-transform">{env.emoji}</span>
              <h4 className="font-extrabold mb-0.5">{env.name}</h4>
              <p className="text-white/80 text-[11px] font-medium leading-tight">{env.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl p-5 border shadow-sm ${dm ? 'bg-slate-800/80 border-slate-700' : 'bg-indigo-50 border-indigo-100'}`}>
        <p className={`text-sm font-medium text-center ${dm ? 'text-slate-400' : 'text-indigo-800'}`}>💡 Encontre um local tranquilo, coloque seus fones de ouvido e deite-se confortavelmente.</p>
      </div>
    </div>
  );
}





