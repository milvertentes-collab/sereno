'use client';

import { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cancelBrowserSpeech, speakBrowserText } from '@/lib/browserSpeech';
import AppNoticeModal from './AppNoticeModal';
import { BillingPlanKey, getPlanDefinition } from '@/lib/subscriptionPlans';
import { SubscriptionSeatGroup, getSeatSummary } from '@/lib/subscriptionSeats';
import { supabase } from '@/lib/supabase';

interface UserProgress {
    meditationsCompleted: number;
    breathingCompleted: number;
    yogaCompleted: number;
    totalMinutes: number;
    streak: number;
    lastActiveDate: string;
    badgesEarned: string[];
}

interface UserAccount {
    name: string;
    nickname?: string; // Como o usuário quer ser chamado
    email: string;
    avatar: string; // Isso pode ser uma string base64 ou um emoji
    birthdate?: string; // YYYY-MM-DD
    sex?: string;
    role?: 'user' | 'admin';
    adminAccess?: boolean;
}

interface ProfileSectionProps {
    account: UserAccount | null;
    onLogout: () => void;
    onSwitchAccount?: () => void;
    onNavigate?: (tab: any, params?: Record<string, any>) => void;
    updateAccount: (updates: Partial<UserAccount>) => void;
    userProgress: UserProgress;
    practiceStreak: number;
    todayMinutes: number;
    moodHistory: any[];
    diaryEntries: any[];
    thoughtRecords: any[];
    gratitudeEntries: any[];
    soltaEntries: any[];
    darkMode: boolean;

    // Settings passed from parent
    dailyGoal: number;
    setDailyGoal: (val: number) => void;
    reminderSettings: any;
    setReminderSettings: (val: any) => void;
    privacySettings: any;
    setPrivacySettings: (val: any) => void;
    audioSettings: any;
    setAudioSettings: (val: any) => void;
    wellbeingSettings: any;
    setWellbeingSettings: (val: any) => void;
    defaultVoice: 'feminino' | 'masculino' | 'nenhuma';
    setDefaultVoice: (val: 'feminino' | 'masculino' | 'nenhuma') => void;
    subscriptionData: any;
    onShowPlans: () => void;
    onOpenRecommendApp: () => void;
    onCheckAccess: (feature: string) => boolean;
    onIncrementUsage: (feature: 'aiChat' | 'muralSend' | 'muralReceive' | 'sharing' | 'exportData') => void;
    desktopMode?: boolean;
}

type ReminderResumeSnapshot = {
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
};

function SparklePremiumIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3.5 13.7 8.3 18.5 10 13.7 11.7 12 16.5 10.3 11.7 5.5 10 10.3 8.3 12 3.5Z" />
            <path d="M18.5 4.5 19.1 6.1 20.7 6.7 19.1 7.3 18.5 8.9 17.9 7.3 16.3 6.7 17.9 6.1 18.5 4.5Z" />
            <path d="M6 15.8 6.6 17.4 8.2 18 6.6 18.6 6 20.2 5.4 18.6 3.8 18 5.4 17.4 6 15.8Z" />
        </svg>
    );
}

type EmotionalAvatarPreset = {
    id: string;
    label: string;
    mood: string;
    vibe: string;
    gender: 'feminino' | 'masculino';
    skin: string;
    hair: string;
    accent: string;
    face: 'sereno' | 'esperancoso' | 'confiante' | 'sensivel';
};

const emotionalAvatarPresets: EmotionalAvatarPreset[] = [
    { id: 'serena-f', label: 'Serena', mood: 'Serenidade', vibe: 'Calma, estável e presente.', gender: 'feminino', skin: '#f4c7a1', hair: '#5b3a2e', accent: '#8b5cf6', face: 'sereno' },
    { id: 'sereno-m', label: 'Sereno', mood: 'Serenidade', vibe: 'Calmo, estável e presente.', gender: 'masculino', skin: '#d9a67f', hair: '#433026', accent: '#6366f1', face: 'sereno' },
    { id: 'esperancosa-f', label: 'Esperançosa', mood: 'Esperança', vibe: 'Leve, aberta e luminosa.', gender: 'feminino', skin: '#f1c9ae', hair: '#3b2f6b', accent: '#22c55e', face: 'esperancoso' },
    { id: 'esperancoso-m', label: 'Esperançoso', mood: 'Esperança', vibe: 'Leve, aberto e luminoso.', gender: 'masculino', skin: '#c9936e', hair: '#2f3a5b', accent: '#14b8a6', face: 'esperancoso' },
    { id: 'confiante-f', label: 'Confiante', mood: 'Confiança', vibe: 'Firme, segura e centrada.', gender: 'feminino', skin: '#efbf9a', hair: '#2d2a4a', accent: '#ec4899', face: 'confiante' },
    { id: 'confiante-m', label: 'Confiante', mood: 'Confiança', vibe: 'Firme, seguro e centrado.', gender: 'masculino', skin: '#b98763', hair: '#2e2e2e', accent: '#f59e0b', face: 'confiante' },
    { id: 'sensivel-f', label: 'Sensível', mood: 'Sensibilidade', vibe: 'Delicada, atenta e profunda.', gender: 'feminino', skin: '#f3cdb2', hair: '#6d4c41', accent: '#38bdf8', face: 'sensivel' },
    { id: 'sensivel-m', label: 'Sensível', mood: 'Sensibilidade', vibe: 'Delicado, atento e profundo.', gender: 'masculino', skin: '#c18c67', hair: '#4b362f', accent: '#0ea5e9', face: 'sensivel' },
];

function createAvatarSvg(preset: EmotionalAvatarPreset) {
    const moodDetails = {
        sereno: {
            faceShape: '<ellipse cx="44" cy="48" rx="18" ry="20" fill="CURRENT_SKIN"/>',
            mouth: '<path d="M42 49c4 2 9 2 13 0" stroke="#5b4636" stroke-width="2.2" stroke-linecap="round"/>',
            brows: '<path d="M38 38.4l5 0.4" stroke="#5b4636" stroke-width="1.6" stroke-linecap="round"/><path d="M51 38.8l5-0.4" stroke="#5b4636" stroke-width="1.6" stroke-linecap="round"/>',
            eyes: '<path d="M38 43c1.2-1.2 3.1-1.2 4.3 0" stroke="#243047" stroke-width="1.5" stroke-linecap="round"/><path d="M48 43c1.2-1.2 3.1-1.2 4.3 0" stroke="#243047" stroke-width="1.5" stroke-linecap="round"/>',
            nose: '<path d="M45 44.5c-0.5 2 0.2 3.4 1.2 4.2" stroke="#9a6e55" stroke-width="1.2" stroke-linecap="round"/>',
        },
        esperancoso: {
            faceShape: '<path d="M27 47c0-12 7-21 17-21s17 9 17 21c0 11-7 19-17 19S27 58 27 47Z" fill="CURRENT_SKIN"/>',
            mouth: '<path d="M41 48c4.5 4.5 11.5 4.5 16 0" stroke="#5b4636" stroke-width="2.2" stroke-linecap="round"/>',
            brows: '<path d="M38 38l5 0.9" stroke="#5b4636" stroke-width="1.5" stroke-linecap="round"/><path d="M51 38.9l5-0.9" stroke="#5b4636" stroke-width="1.5" stroke-linecap="round"/>',
            eyes: '<circle cx="40.5" cy="43" r="1.6" fill="#243047"/><circle cx="50.5" cy="43" r="1.6" fill="#243047"/>',
            nose: '<circle cx="45" cy="47" r="1.1" fill="#a77459" opacity="0.8"/>',
        },
        confiante: {
            faceShape: '<path d="M29 45c0-12 6-20 15-20h1c9 0 15 8 15 20 0 12-7 21-15.5 21S29 57 29 45Z" fill="CURRENT_SKIN"/>',
            mouth: '<path d="M42 48c4 1.5 8 1.5 14-1" stroke="#5b4636" stroke-width="2.3" stroke-linecap="round"/>',
            brows: '<path d="M37.5 39.2 43 38" stroke="#5b4636" stroke-width="1.9" stroke-linecap="round"/><path d="M51 38l5.5 1.2" stroke="#5b4636" stroke-width="1.9" stroke-linecap="round"/>',
            eyes: '<ellipse cx="40.5" cy="43" rx="1.8" ry="1.4" fill="#243047"/><ellipse cx="50.5" cy="43" rx="1.8" ry="1.4" fill="#243047"/>',
            nose: '<path d="M45 44l1.4 4.7-2.2 0.4" stroke="#99684d" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>',
        },
        sensivel: {
            faceShape: '<path d="M28 47c0-13 6.8-21.5 16-21.5S60 34 60 47c0 12-6.5 20.5-16 20.5S28 59 28 47Z" fill="CURRENT_SKIN"/>',
            mouth: '<path d="M43 50c3 0.8 6 0.8 9 0" stroke="#5b4636" stroke-width="2.1" stroke-linecap="round"/><path d="M41 49.2c1.2-1.2 2.8-1.8 4.5-1.8" stroke="#5b4636" stroke-width="1.2" stroke-linecap="round" opacity="0.75"/>',
            brows: '<path d="M38 39.4l5-0.5" stroke="#5b4636" stroke-width="1.5" stroke-linecap="round"/><path d="M51 38.9l5 0.5" stroke="#5b4636" stroke-width="1.5" stroke-linecap="round"/>',
            eyes: '<path d="M38 43.5c1.4-0.9 2.9-0.9 4.3 0" stroke="#243047" stroke-width="1.4" stroke-linecap="round"/><path d="M48 43.5c1.4-0.9 2.9-0.9 4.3 0" stroke="#243047" stroke-width="1.4" stroke-linecap="round"/>',
            nose: '<path d="M45 44.5c0.5 1.8 0.2 3.2-0.5 4" stroke="#9b6e56" stroke-width="1.1" stroke-linecap="round"/>',
        },
    }[preset.face];
    const hair =
        preset.gender === 'feminino'
            ? preset.face === 'esperancoso'
                ? `<path d="M22 35c0-16 9-25 22-25 10 0 20 7 21 23-3-3-8-6-13-6-3-6-9-9-16-9-6 0-12 3-15 8l1 29c-4-3-6-7-6-12V35Z" fill="${preset.hair}"/>`
                : preset.face === 'confiante'
                    ? `<path d="M24 35c0-15 8-24 20-24 11 0 20 8 20 23v8c0 4-2 8-5 11V31c0-7-6-12-15-12S29 24 29 31v22c-3-3-5-7-5-11v-7Z" fill="${preset.hair}"/>`
                    : `<path d="M23 34c0-15 9-24 21-24s21 9 21 24v8c0 5-2 9-6 12V32c0-8-6-14-15-14S29 24 29 32v22c-4-3-6-7-6-12V34Z" fill="${preset.hair}"/>`
            : preset.face === 'sensivel'
                ? `<path d="M26 34c0-14 8-22 18-22 9 0 17 6 18 18-4-4-9-5-13-5-4-4-8-5-14-5-4 0-7 1-10 3l1 24c-2-2-3-5-3-8v-5Z" fill="${preset.hair}"/>`
                : `<path d="M26 34c0-14 8-22 18-22s18 8 18 22v4c0 3-1 6-3 8V33c0-7-6-12-15-12S29 26 29 33v13c-2-2-3-5-3-8v-4Z" fill="${preset.hair}"/>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${preset.accent}" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect width="88" height="88" rx="44" fill="url(#bg)"/>
  ${moodDetails.faceShape.replace('CURRENT_SKIN', preset.skin)}
  ${hair}
  <path d="M33 59c2 7 7 11 11 11s9-4 11-11" fill="${preset.gender === 'feminino' ? '#f4d7c7' : '#efd0bc'}" opacity="0.9"/>
  ${moodDetails.eyes}
  ${moodDetails.brows}
  ${moodDetails.nose}
  ${moodDetails.mouth}
  <circle cx="26" cy="22" r="8" fill="white" opacity="0.16"/>
</svg>`)}`
}

function ModernTimePicker({
    value,
    onChange,
    darkMode,
}: {
    value: string;
    onChange: (value: string) => void;
    darkMode: boolean;
}) {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement | null>(null);
    const [hour = '12', minute = '00'] = (value || '12:00').split(':');
    const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
    const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const updateHour = (nextHour: string) => onChange(`${nextHour}:${minute}`);
    const updateMinute = (nextMinute: string) => onChange(`${hour}:${nextMinute}`);

    return (
        <div ref={pickerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={`flex min-w-[92px] items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                    darkMode
                        ? 'border-slate-600 bg-slate-950/60 text-slate-100 hover:border-indigo-400'
                        : 'border-slate-300 bg-white/90 text-slate-700 hover:border-indigo-500'
                }`}
            >
                <span>{value}</span>
                <span className={`text-[10px] ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`}>🕒</span>
            </button>

            {open && (
                <div
                    className={`absolute right-0 z-30 mt-2 w-[290px] overflow-hidden rounded-3xl border p-4 shadow-2xl ${
                        darkMode
                            ? 'border-indigo-900/40 bg-[#091324]/96'
                            : 'border-slate-200 bg-white/98'
                    }`}
                >
                    <div className="mb-4 flex items-center justify-between rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${darkMode ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Horário</p>
                            <p className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${
                                darkMode ? 'bg-white/8 text-slate-200' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            Fechar
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hora</p>
                            <div className={`grid max-h-56 grid-cols-3 gap-2.5 overflow-y-auto rounded-2xl p-2 ${darkMode ? 'bg-white/4' : 'bg-slate-50'}`}>
                                {hours.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => updateHour(option)}
                                        className={`rounded-xl px-2 py-3 text-base font-bold transition ${
                                            option === hour
                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                : darkMode
                                                    ? 'bg-slate-900/70 text-slate-200 hover:bg-slate-800'
                                                    : 'bg-white text-slate-700 hover:bg-indigo-50'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.14em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Minuto</p>
                            <div className={`grid max-h-56 grid-cols-2 gap-2.5 overflow-y-auto rounded-2xl p-2 ${darkMode ? 'bg-white/4' : 'bg-slate-50'}`}>
                                {minutes.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => updateMinute(option)}
                                        className={`rounded-xl px-2 py-3 text-base font-bold transition ${
                                            option === minute
                                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                                                : darkMode
                                                    ? 'bg-slate-900/70 text-slate-200 hover:bg-slate-800'
                                                    : 'bg-white text-slate-700 hover:bg-cyan-50'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProfileSection({
    account, onLogout, onSwitchAccount, onNavigate, updateAccount, userProgress, practiceStreak, todayMinutes, moodHistory, diaryEntries, thoughtRecords, gratitudeEntries, soltaEntries, darkMode: dm,
    dailyGoal, setDailyGoal,
    reminderSettings, setReminderSettings,
    privacySettings, setPrivacySettings,
    audioSettings, setAudioSettings,
    wellbeingSettings, setWellbeingSettings,
    defaultVoice, setDefaultVoice,
    subscriptionData, onShowPlans, onOpenRecommendApp, onCheckAccess, onIncrementUsage, desktopMode = false
}: ProfileSectionProps) {
    if (!account) return null;

    // Modals

    // Modais
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [noticeMessage, setNoticeMessage] = useState('');
    const [permissionStatus, setPermissionStatus] = useState<string>('default');
    const [healthyMessages] = useLocalStorage<{ id: string; text: string; createdAt: string }[]>('psico_healthy_self', []);
    const [favoriteTabs] = useLocalStorage<string[]>('home_favorite_tabs', []);
    const [doNotDisturbSnapshot, setDoNotDisturbSnapshot] = useLocalStorage<ReminderResumeSnapshot | null>('sereno_reminders_resume_v1', null);
    const [pinEditorOpen, setPinEditorOpen] = useState(false);
    const [currentPinInput, setCurrentPinInput] = useState('');
    const [newPinInput, setNewPinInput] = useState('');
    const [pinMessage, setPinMessage] = useState<string | null>(null);
    const [pinGuardMessage, setPinGuardMessage] = useState<string | null>(null);
    const [healthySelfGuardMessage, setHealthySelfGuardMessage] = useState<string | null>(null);
    const [pendingPinActivation, setPendingPinActivation] = useState(false);
    const [activationPinInput, setActivationPinInput] = useState('');
    const [identityMenuOpen, setIdentityMenuOpen] = useState(false);
    const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
    const [notificationsExpanded, setNotificationsExpanded] = useState({
        routine: true,
        support: false,
        therapy: false,
    });
    const [profileSectionsExpanded, setProfileSectionsExpanded] = useState({
        subscription: true,
        settings: true,
        privacy: false,
        immersion: false,
        data: false,
    });
    const [birthdateCalendarOpen, setBirthdateCalendarOpen] = useState(false);
    const [pendingAccountAction, setPendingAccountAction] = useState<'logout' | 'switch' | null>(null);
    const [birthdateDraft, setBirthdateDraft] = useState(account.birthdate || '');
    const [previewingProfileVoice, setPreviewingProfileVoice] = useState<'feminino' | 'masculino' | null>(null);
    const [currentSeatGroup, setCurrentSeatGroup] = useState<SubscriptionSeatGroup | null>(null);
    const [seatGroupIsOwner, setSeatGroupIsOwner] = useState(false);
    const [seatGroupLoading, setSeatGroupLoading] = useState(false);
    const [seatInviteName, setSeatInviteName] = useState('');
    const [seatInviteEmail, setSeatInviteEmail] = useState('');
    const [seatJoinCode, setSeatJoinCode] = useState('');
    const [seatManagerMessage, setSeatManagerMessage] = useState<string | null>(null);
    const profileVoicePreviewRef = useRef<HTMLAudioElement | null>(null);

    const totalActivities = userProgress.meditationsCompleted + userProgress.breathingCompleted + userProgress.yogaCompleted;
    const displayName = account.nickname?.trim() || account.name;
    const hasValidPin = /^\d{4}$/.test(privacySettings?.appLockPin || '');
    const displayInitial = (displayName || account.email || 'S').trim().charAt(0).toUpperCase();
    const hasUploadedAvatar = Boolean(account.avatar?.startsWith('data:image'));
    const favoriteResourceCatalog: Record<string, { icon: string; title: string; subtitle: string }> = {
        sos: { icon: '🆘', title: 'SOS Ansiedade', subtitle: 'apoio imediato' },
        breathing: { icon: '🌬️', title: 'Respiração', subtitle: 'regular rápido' },
        meditation: { icon: '🧘', title: 'Meditação', subtitle: 'presença guiada' },
        mood: { icon: '📊', title: 'Diário de Humor', subtitle: 'entender o momento' },
        diary: { icon: '📘', title: 'Diário (RPD)', subtitle: 'organizar por escrito' },
        gratitude: { icon: '🙏', title: 'Gratidão', subtitle: 'virar o clima do dia' },
        timer: { icon: '⏳', title: 'Time Livre', subtitle: 'prática silenciosa' },
        sleep: { icon: '🌙', title: 'Modo Sono', subtitle: 'desacelerar à noite' },
        calm: { icon: '🧭', title: 'SOS Acalme-se', subtitle: 'baixar ativação' },
        mixer: { icon: '🎚️', title: 'Mixer Sonoro', subtitle: 'ambiente para cuidar' },
        microtasks: { icon: '🌿', title: 'Microtarefas', subtitle: 'passos curtos' },
        habits: { icon: '✅', title: 'Meus Hábitos', subtitle: 'consistência diária' },
        missions: { icon: '🎯', title: 'Missões', subtitle: 'ciclos de cuidado' },
        stats: { icon: '📈', title: 'Estatísticas', subtitle: 'progresso e marcos' },
        yoga: { icon: '🌙', title: 'Yoga Nidra', subtitle: 'relaxamento profundo' },
        hooponopono: { icon: '🙏', title: "Ho'oponopono", subtitle: 'limpeza emocional' },
    };
    const savedFavoriteItems = (favoriteTabs || [])
        .map((tab) => ({
            tab,
            ...(favoriteResourceCatalog[tab] || {
                icon: '⭐',
                title: tab,
                subtitle: 'recurso salvo por você',
            }),
        }))
        .slice(0, 4);
    const currentPlanKey = (subscriptionData?.planKey || 'free') as BillingPlanKey;
    const currentPlanDefinition = getPlanDefinition(currentPlanKey);
    const seatSummary = getSeatSummary(currentSeatGroup);
    const currentSeatMember = currentSeatGroup?.members.find((member) => member.email.toLowerCase() === account.email.toLowerCase()) || null;
    const supportsSeatManagement = subscriptionData?.plan === 'pro';
    const isSoloSubscription = currentPlanDefinition?.seatLimit === 1;

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (profileVoicePreviewRef.current) {
                profileVoicePreviewRef.current.pause();
                profileVoicePreviewRef.current.src = '';
            }
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadSeatGroup = async () => {
            if (!account?.email) return;
            setSeatGroupLoading(true);
            try {
                const session = await supabase.auth.getSession();
                const token = session.data.session?.access_token;
                if (!token) {
                    if (!cancelled) {
                        setCurrentSeatGroup(null);
                        setSeatGroupIsOwner(false);
                    }
                    return;
                }

                if (supportsSeatManagement && currentPlanDefinition && currentPlanDefinition.seatLimit > 1) {
                    await fetch('/api/subscription/group', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ action: 'ensure-owner-group' }),
                    }).catch(() => null);
                }

                const response = await fetch('/api/subscription/group', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                });
                const data = await response.json().catch(() => null);
                if (!cancelled) {
                    setCurrentSeatGroup(data?.group || null);
                    setSeatGroupIsOwner(Boolean(data?.isOwner));
                }
            } catch {
                if (!cancelled) {
                    setCurrentSeatGroup(null);
                    setSeatGroupIsOwner(false);
                }
            } finally {
                if (!cancelled) setSeatGroupLoading(false);
            }
        };

        loadSeatGroup();
        return () => {
            cancelled = true;
        };
    }, [account?.email, currentPlanDefinition, supportsSeatManagement]);

    const handleAddSeatMember = async () => {
        if (!currentSeatGroup) return;
        const name = seatInviteName.trim();
        const email = seatInviteEmail.trim().toLowerCase();

        if (!name || !email) {
            setSeatManagerMessage('Preencha nome e e-mail para reservar uma vaga.');
            return;
        }

        if (currentSeatGroup.members.some((member) => member.email.toLowerCase() === email)) {
            setSeatManagerMessage('Esse e-mail já ocupa ou já foi convidado para uma vaga.');
            return;
        }

        if (seatSummary.occupiedSeats >= currentSeatGroup.seatLimit) {
            setSeatManagerMessage('Todas as vagas deste plano já estão ocupadas.');
            return;
        }

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error('Faça login novamente para gerenciar as vagas.');

            const response = await fetch('/api/subscription/group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'invite-member',
                    memberName: name,
                    memberEmail: email,
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.ok) throw new Error(data?.error || 'Não foi possível reservar a vaga.');

            setCurrentSeatGroup(data.group || null);
            setSeatInviteName('');
            setSeatInviteEmail('');
            setSeatManagerMessage('Vaga reservada com sucesso.');
        } catch (error) {
            setSeatManagerMessage(error instanceof Error ? error.message : 'Não foi possível reservar a vaga.');
        }
    };

    const handleRemoveSeatMember = async (memberEmail: string) => {
        if (!currentSeatGroup) return;
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error('Faça login novamente para gerenciar as vagas.');

            const response = await fetch(`/api/subscription/group?memberEmail=${encodeURIComponent(memberEmail)}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.ok) throw new Error(data?.error || 'Não foi possível remover o membro.');
            setCurrentSeatGroup(data.group || null);
            setSeatManagerMessage('Membro removido com sucesso.');
        } catch (error) {
            setSeatManagerMessage(error instanceof Error ? error.message : 'Não foi possível remover o membro.');
        }
    };

    const handleJoinSeatGroup = async () => {
        const inviteCode = (seatJoinCode.trim() || currentSeatGroup?.inviteCode || '').toUpperCase();
        if (!inviteCode) {
            setSeatManagerMessage('Digite o código do convite para entrar no plano compartilhado.');
            return;
        }

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) throw new Error('Faça login novamente para entrar no plano compartilhado.');

            const response = await fetch('/api/subscription/group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'join-by-code',
                    inviteCode,
                }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.ok) throw new Error(data?.error || 'Não foi possível entrar no plano compartilhado.');
            setCurrentSeatGroup(data.group || null);
            setSeatJoinCode('');
            setSeatManagerMessage('Agora esta conta já faz parte do plano compartilhado.');
            window.dispatchEvent(new Event('sereno:refresh-subscription'));
        } catch (error) {
            setSeatManagerMessage(error instanceof Error ? error.message : 'Não foi possível entrar no plano compartilhado.');
        }
    };

    const handleClearData = () => {
        localStorage.clear();
        window.location.reload();
    };

    const buildExportText = () => {
        const latestMoods = (moodHistory || []).slice(0, 20).map((entry: any, index: number) => `${index + 1}. ${entry.date || '-'} | ${entry.primaryEmotion || entry.emotion || '-'} | intensidade: ${entry.intensity ?? entry.level ?? '-'}`);
        const latestDiary = (diaryEntries || []).slice(0, 20).map((entry: any, index: number) => `${index + 1}. ${entry.date || entry.createdAt || '-'} | ${entry.emotion || entry.title || 'Registro'} | ${(entry.text || entry.content || entry.situation || '').toString().replace(/\s+/g, ' ').slice(0, 220)}`);
        const latestThoughts = (thoughtRecords || []).slice(0, 20).map((entry: any, index: number) => `${index + 1}. ${entry.date || '-'} | ${entry.situation || 'Pensamento'} | automático: ${(entry.automaticThought || '').toString().replace(/\s+/g, ' ').slice(0, 180)} | alternativo: ${(entry.alternativeThought || '').toString().replace(/\s+/g, ' ').slice(0, 180)}`);
        const latestGratitude = (gratitudeEntries || []).slice(0, 20).map((entry: any, index: number) => `${index + 1}. ${entry.date || entry.createdAt || '-'} | ${(entry.text || entry.content || entry.gratitude || '').toString().replace(/\s+/g, ' ').slice(0, 220)}`);
        const latestSolta = (soltaEntries || []).slice(0, 20).map((entry: any, index: number) => `${index + 1}. ${entry.date || entry.createdAt || '-'} | ${(entry.text || entry.content || entry.message || '').toString().replace(/\s+/g, ' ').slice(0, 220)}`);
        return `=== Sereno - Histórico Pessoal ===
Usuário: ${account.name}
Email: ${account.email}
Data: ${new Date().toLocaleDateString('pt-BR')}
Apelido: ${account.nickname || '-'}
Data de nascimento: ${account.birthdate || '-'}
Identidade: ${account.sex || '-'}

--- Progresso ---
Meditações: ${userProgress.meditationsCompleted}
Exercícios de Respiração: ${userProgress.breathingCompleted}
Sessões Yoga Nidra: ${userProgress.yogaCompleted}
Total de Atividades: ${totalActivities}
Minutos Totais de Cuidado: ${userProgress.totalMinutes}
Minutos de hoje: ${todayMinutes}
Sequência atual: ${practiceStreak}
Meta diária: ${dailyGoal} min
Badges conquistados: ${userProgress.badgesEarned.length}
Favoritos: ${(favoriteTabs || []).length ? favoriteTabs.join(', ') : 'Nenhum'}

--- Humor ---
${latestMoods.length ? latestMoods.join('\n') : 'Nenhum registro'}

--- Diário ---
${latestDiary.length ? latestDiary.join('\n') : 'Nenhum registro'}

--- Pensamentos ---
${latestThoughts.length ? latestThoughts.join('\n') : 'Nenhum registro'}

--- Gratidão ---
${latestGratitude.length ? latestGratitude.join('\n') : 'Nenhum registro'}

--- Solta Aqui ---
${latestSolta.length ? latestSolta.join('\n') : 'Nenhum registro'}

* Gerado automaticamente pelo Sereno | App de bem-estar`.trim();
    };

    const handleExportTXT = () => {
        if (!onCheckAccess('export_data')) return;
        const content = buildExportText();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        triggerDownload(blob, `sereno-relatorio-${new Date().toISOString().split('T')[0]}.txt`);
        onIncrementUsage('exportData');
    };

    const handleExportCSV = () => {
        if (!onCheckAccess('export_data')) return;
        const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = [
            ['resumo', 'meditacoes', '', '', userProgress.meditationsCompleted],
            ['resumo', 'respiracoes', '', '', userProgress.breathingCompleted],
            ['resumo', 'yoga_nidra', '', '', userProgress.yogaCompleted],
            ['resumo', 'atividades_totais', '', '', totalActivities],
            ['resumo', 'minutos_totais', '', '', userProgress.totalMinutes],
            ['resumo', 'minutos_hoje', '', '', todayMinutes],
            ['resumo', 'sequencia', '', '', practiceStreak],
            ['resumo', 'meta_diaria', '', '', dailyGoal],
            ['resumo', 'badges', '', '', userProgress.badgesEarned.length],
            ...(favoriteTabs || []).map((tab) => ['favoritos', tab, '', '', tab]),
            ...(moodHistory || []).map((entry: any) => ['humor', entry.id || '', entry.date || '', entry.primaryEmotion || entry.emotion || '', entry.intensity ?? entry.level ?? '']),
            ...(diaryEntries || []).map((entry: any) => ['diario', entry.id || '', entry.date || entry.createdAt || '', entry.emotion || entry.title || '', (entry.text || entry.content || entry.situation || '').toString().replace(/\s+/g, ' ').slice(0, 400)]),
            ...(thoughtRecords || []).map((entry: any) => ['pensamentos', entry.id || '', entry.date || '', entry.situation || '', `${(entry.automaticThought || '').toString().replace(/\s+/g, ' ').slice(0, 180)} | ${(entry.alternativeThought || '').toString().replace(/\s+/g, ' ').slice(0, 180)}`]),
            ...(gratitudeEntries || []).map((entry: any) => ['gratidao', entry.id || '', entry.date || entry.createdAt || '', '', (entry.text || entry.content || entry.gratitude || '').toString().replace(/\s+/g, ' ').slice(0, 400)]),
            ...(soltaEntries || []).map((entry: any) => ['solta_aqui', entry.id || '', entry.date || entry.createdAt || '', '', (entry.text || entry.content || entry.message || '').toString().replace(/\s+/g, ' ').slice(0, 400)]),
        ];
        const headers = "Secao,Id,Data,Titulo,Conteudo\n";
        const csvBody = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');

        const blob = new Blob([headers + csvBody], { type: 'text/csv;charset=utf-8' });
        triggerDownload(blob, `sereno-dados-${new Date().toISOString().split('T')[0]}.csv`);
        onIncrementUsage('exportData');
    };

    const handleExportPDF = () => {
        if (!onCheckAccess('export_data')) return;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const lines = doc.splitTextToSize(buildExportText(), 520);
        let y = 48;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Sereno - Historico Pessoal', 40, y);
        y += 28;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        lines.forEach((line: string) => {
            if (y > 790) {
                doc.addPage();
                y = 40;
            }
            doc.text(line, 40, y);
            y += 14;
        });
        doc.save(`sereno-relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
        onIncrementUsage('exportData');
    };

    const handleShareExport = (channel: 'whatsapp' | 'telegram' | 'email') => {
        if (!onCheckAccess('export_data')) return;
        const text = encodeURIComponent(buildExportText().slice(0, 3500));
        if (channel === 'whatsapp') {
            window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
            onIncrementUsage('exportData');
            return;
        }
        if (channel === 'telegram') {
            window.open(`https://t.me/share/url?text=${text}`, '_blank', 'noopener,noreferrer');
            onIncrementUsage('exportData');
            return;
        }
        window.location.href = `mailto:?subject=${encodeURIComponent('Meu histórico no Sereno')}&body=${text}`;
        onIncrementUsage('exportData');
    };

    const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
        <label className="relative inline-flex items-center cursor-pointer ml-3">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none transition-colors ${checked ? 'bg-indigo-500' : (dm ? 'bg-slate-700' : 'bg-gray-300')} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
        </label>
    );

    const requestNotificationPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return false;
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
        return result === 'granted';
    };

    const handleReminderToggle = async (key: string, value: boolean) => {
        if (value && permissionStatus !== 'granted') {
            await requestNotificationPermission();
        }
        if (key === 'healthySelfReminder' && value && healthyMessages.length === 0) {
            setHealthySelfGuardMessage('Salve pelo menos 1 mensagem em “Eu Mais Saudável” antes de ativar este lembrete.');
            return;
        }
        if (key === 'healthySelfReminder') {
            setHealthySelfGuardMessage(null);
        }
        setReminderSettings({ ...reminderSettings, [key]: value });
    };

    const handleDoNotDisturbToggle = (value: boolean) => {
        if (!value) {
            setReminderSettings({
                ...reminderSettings,
                ...(doNotDisturbSnapshot || {}),
                doNotDisturb: false,
            });
            setDoNotDisturbSnapshot(null);
            return;
        }

        setDoNotDisturbSnapshot({
            moodReminder: reminderSettings.moodReminder,
            moodTime: reminderSettings.moodTime,
            breathingReminder: reminderSettings.breathingReminder,
            breathingTime: reminderSettings.breathingTime,
            yogaReminder: reminderSettings.yogaReminder,
            yogaTime: reminderSettings.yogaTime,
            diaryReminder: reminderSettings.diaryReminder,
            diaryTime: reminderSettings.diaryTime,
            healthySelfReminder: reminderSettings.healthySelfReminder,
            healthySelfTime: reminderSettings.healthySelfTime,
            meditationReminder: reminderSettings.meditationReminder,
            meditationTime: reminderSettings.meditationTime,
            badgesReminder: reminderSettings.badgesReminder,
            badgesTime: reminderSettings.badgesTime,
            gratitudeReminder: reminderSettings.gratitudeReminder,
            gratitudeTime: reminderSettings.gratitudeTime,
            sleepReminder: reminderSettings.sleepReminder,
            sleepTime: reminderSettings.sleepTime,
            missionsReminder: reminderSettings.missionsReminder,
            missionsTime: reminderSettings.missionsTime,
            microtasksReminder: reminderSettings.microtasksReminder,
            microtasksTime: reminderSettings.microtasksTime,
            mindmapReminder: reminderSettings.mindmapReminder,
            mindmapTime: reminderSettings.mindmapTime,
            psychoeduReminder: reminderSettings.psychoeduReminder,
            psychoeduTime: reminderSettings.psychoeduTime,
            adaptiveSuggestionReminder: reminderSettings.adaptiveSuggestionReminder,
            adaptiveSuggestionTime: reminderSettings.adaptiveSuggestionTime,
        });
        setReminderSettings({
            ...reminderSettings,
            doNotDisturb: true,
            moodReminder: false,
            breathingReminder: false,
            diaryReminder: false,
            healthySelfReminder: false,
            meditationReminder: false,
            yogaReminder: false,
            gratitudeReminder: false,
            sleepReminder: false,
            missionsReminder: false,
            microtasksReminder: false,
            adaptiveSuggestionReminder: false,
            badgesReminder: false,
            mindmapReminder: false,
            psychoeduReminder: false,
        });
    };

    const handleAppLockToggle = (value: boolean) => {
        if (value && !hasValidPin) {
            setPinGuardMessage('Defina um PIN de 4 dígitos para ativar o bloqueio do app.');
            setPinEditorOpen(true);
            setPendingPinActivation(true);
            return;
        }
        setPrivacySettings({ ...privacySettings, appLockEnabled: value });
        if (value) {
            setActivationPinInput('');
            setPinMessage(null);
        }
        setPinGuardMessage(null);
        setPendingPinActivation(false);
    };

    const handleSavePin = () => {
        const storedPin = String(privacySettings?.appLockPin || '');
        const hadPinBefore = /^\d{4}$/.test(storedPin);
        const sanitizedCurrentPin = currentPinInput.replace(/\D/g, '').slice(0, 4);
        const sanitizedNewPin = newPinInput.replace(/\D/g, '').slice(0, 4);
        if (!/^\d{4}$/.test(sanitizedNewPin)) {
            setPinMessage('O novo PIN precisa ter 4 dígitos.');
            return;
        }
        if (hadPinBefore && sanitizedCurrentPin !== storedPin) {
            setPinMessage('Digite o PIN anterior corretamente para trocar.');
            return;
        }
        setPrivacySettings({
            ...privacySettings,
            appLockPin: sanitizedNewPin,
            appLockEnabled: !hadPinBefore && pendingPinActivation ? true : privacySettings.appLockEnabled,
        });
        setCurrentPinInput('');
        setNewPinInput('');
        setActivationPinInput('');
        setPinEditorOpen(false);
        setPinGuardMessage(null);
        if (!hadPinBefore && pendingPinActivation) {
            setPinMessage('PIN salvo e bloqueio ativado com sucesso.');
        } else if (hadPinBefore) {
            setPinMessage('PIN atualizado com sucesso.');
        } else {
            setPinMessage('PIN salvo com sucesso.');
        }
        setPendingPinActivation(false);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateAccount({ avatar: base64String });
            };
            // Limitando o tamanho para não sobrecarregar o localStorage
            if (file.size > 2 * 1024 * 1024) {
                setNoticeMessage('A imagem é muito grande. Escolha uma imagem menor, com até 2MB.');
                return;
            }
            reader.readAsDataURL(file);
        }
    };

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (updateAccount) {
            updateAccount({ nickname: e.target.value });
        }
    };
    const handlePresetAvatarSelect = (preset: EmotionalAvatarPreset) => {
        updateAccount({ avatar: createAvatarSvg(preset) });
        setAvatarPickerOpen(false);
    };
    const previewProfileVoice = async (voice: 'feminino' | 'masculino') => {
        if (previewingProfileVoice === voice) {
            profileVoicePreviewRef.current?.pause();
            if (profileVoicePreviewRef.current) profileVoicePreviewRef.current.currentTime = 0;
            cancelBrowserSpeech();
            setPreviewingProfileVoice(null);
            return;
        }

        if (profileVoicePreviewRef.current) {
            profileVoicePreviewRef.current.pause();
            profileVoicePreviewRef.current.currentTime = 0;
        }
        cancelBrowserSpeech();

        setPreviewingProfileVoice(voice);
        try {
            const response = await fetch('/api/piper-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `Oi, como vai? Sou a voz ${voice === 'masculino' ? 'Sereno' : 'Serena'}.`,
                    gender: voice,
                    voice: voice === 'masculino' ? 'pt-BR-AntonioNeural' : 'pt-BR-FranciscaNeural',
                }),
            });
            if (!response.ok) {
                const spoken = await speakBrowserText(`Oi, como vai? Sou a voz ${voice === 'masculino' ? 'Sereno' : 'Serena'}.`, {
                    voice,
                    volume: audioSettings.voiceVolume,
                });
                setPreviewingProfileVoice(null);
                if (!spoken) throw new Error('Falha ao gerar prévia');
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = Math.max(0, Math.min(1, audioSettings.voiceVolume / 100));
            audio.onended = () => {
                URL.revokeObjectURL(url);
                setPreviewingProfileVoice(null);
            };
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                setPreviewingProfileVoice(null);
            };
            profileVoicePreviewRef.current = audio;
            await audio.play();
        } catch {
            void speakBrowserText(`Oi, como vai? Sou a voz ${voice === 'masculino' ? 'Sereno' : 'Serena'}.`, {
                voice,
                volume: audioSettings.voiceVolume,
            }).finally(() => setPreviewingProfileVoice(null));
            setPreviewingProfileVoice(null);
        }
    };

    const formattedBirthdate = account.birthdate
        ? new Date(`${account.birthdate}T00:00:00`).toLocaleDateString('pt-BR')
        : 'Selecionar data';
    const parsedBirthdate = account.birthdate ? new Date(`${account.birthdate}T00:00:00`) : null;
    const [birthdateViewDate, setBirthdateViewDate] = useState<Date>(() => parsedBirthdate && !Number.isNaN(parsedBirthdate.getTime()) ? parsedBirthdate : new Date());
    const monthLabel = birthdateViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const monthStart = new Date(birthdateViewDate.getFullYear(), birthdateViewDate.getMonth(), 1);
    const startWeekday = monthStart.getDay();
    const calendarStartOffset = (startWeekday + 6) % 7;
    const calendarStartDate = new Date(monthStart);
    calendarStartDate.setDate(monthStart.getDate() - calendarStartOffset);
    const birthdateCalendarDays = Array.from({ length: 42 }, (_, index) => {
        const day = new Date(calendarStartDate);
        day.setDate(calendarStartDate.getDate() + index);
        return day;
    });
    const identityOptions = [
        { id: 'prefiro_nao_informar', label: 'Prefiro não informar' },
        { id: 'mulher', label: 'Mulher' },
        { id: 'homem', label: 'Homem' },
        { id: 'mulher_trans', label: 'Mulher trans' },
        { id: 'homem_trans', label: 'Homem trans' },
        { id: 'nao_binario', label: 'Não binário' },
        { id: 'pessoa_com_ciclo', label: 'Pessoa com ciclo menstrual' },
        { id: 'lesbica', label: 'Lésbica' },
        { id: 'gay', label: 'Gay' },
        { id: 'bissexual', label: 'Bissexual' },
        { id: 'pansexual', label: 'Pansexual' },
        { id: 'assexual', label: 'Assexual' },
    ];
    const selectedIdentityLabel = identityOptions.find((option) => option.id === (account.sex || 'prefiro_nao_informar'))?.label || 'Prefiro não informar';
    const toggleNotificationGroup = (key: 'routine' | 'support' | 'therapy') => {
        setNotificationsExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const toggleProfileSection = (key: 'subscription' | 'settings' | 'privacy' | 'immersion' | 'data') => {
        setProfileSectionsExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const handleBirthdateSelect = (date: Date) => {
        const pad = (value: number) => String(value).padStart(2, '0');
        const nextBirthdate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        updateAccount({ birthdate: nextBirthdate });
        setBirthdateDraft(nextBirthdate);
        setBirthdateViewDate(date);
        setBirthdateCalendarOpen(false);
    };
    const handleBirthdateDraftSave = () => {
        if (!birthdateDraft) {
            updateAccount({ birthdate: '' });
            setBirthdateCalendarOpen(false);
            return;
        }
        const parsed = new Date(`${birthdateDraft}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) return;
        updateAccount({ birthdate: birthdateDraft });
        setBirthdateViewDate(parsed);
        setBirthdateCalendarOpen(false);
    };
    const sectionCardClass = `rounded-[2rem] border shadow-sm backdrop-blur-sm ${dm ? 'border-white/8 bg-slate-950/45' : 'border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]'}`;
    const sectionHeaderLabelClass = `text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-slate-500'}`;
    const sectionTitleClass = `text-base font-black tracking-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`;

    return (
        <div className={`p-4 animate-fade-in pb-24 ${desktopMode ? 'max-w-6xl mx-auto lg:px-8' : 'max-w-lg mx-auto'} ${dm ? 'text-white' : ''}`}>
            <AppNoticeModal
                open={Boolean(noticeMessage)}
                title="Não consegui usar essa imagem"
                message={noticeMessage}
                onClose={() => setNoticeMessage('')}
                darkMode={dm}
                icon="🖼️"
                eyebrow="Perfil"
            />
            {/* Profile Header */}
            <div className={`rounded-[2.5rem] p-6 mb-6 shadow-[0_18px_50px_rgba(30,41,59,0.16)] relative overflow-hidden ${dm ? 'bg-gradient-to-br from-purple-900/80 to-blue-900/80 border border-purple-800/50' : 'border border-slate-200 bg-[radial-gradient(circle_at_top,#dbeafe_0%,transparent_35%),linear-gradient(135deg,#eef4ff_0%,#e8eeff_55%,#f7f8ff_100%)]'} ${dm ? 'text-white' : 'text-slate-900'}`}>
                <div className={`absolute top-0 left-0 w-full h-full pointer-events-none ${dm ? 'bg-white/5 backdrop-blur-3xl' : 'bg-white/30'}`} />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative group cursor-pointer mb-4">
                        <input
                            type="file"
                            accept="image/*"
                            id="avatar-upload"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <label htmlFor="avatar-upload" className={`group block w-24 h-24 rounded-full flex items-center justify-center cursor-pointer overflow-hidden transition-transform active:scale-95 ${dm ? 'bg-white/20 backdrop-blur-md shadow-inner border border-white/20' : 'bg-white shadow-[0_12px_24px_rgba(148,163,184,0.22)] border border-slate-200'}`}>
                            {hasUploadedAvatar ? (
                                <img src={account.avatar} alt="Avatar do Usuário" className="w-full h-full object-cover" />
                            ) : (
                                <div className={`relative flex h-full w-full items-center justify-center ${dm ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%),linear-gradient(135deg,rgba(129,140,248,0.35),rgba(34,211,238,0.18))]' : 'bg-[radial-gradient(circle_at_top,#ffffff_0%,transparent_48%),linear-gradient(135deg,#dbeafe_0%,#e9d5ff_100%)]'}`}>
                                    <span className={`text-3xl font-black tracking-tight ${dm ? 'text-white' : 'text-slate-700'}`}>{displayInitial}</span>
                                </div>
                            )}

                            {/* Overlay de edição (visível ao passar o mouse ou em dispositivos tocáveis) */}
                            <div className={`absolute inset-0 flex items-end justify-center opacity-100 transition-opacity rounded-full pb-3 ${dm ? 'bg-black/30' : 'bg-slate-900/12'}`}>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${dm ? 'bg-black/45 text-white' : 'bg-white/92 text-slate-700 border border-slate-200'}`}>{hasUploadedAvatar ? '📷 Mudar' : '✨ Escolher'}</span>
                            </div>
                        </label>
                    </div>
                    <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAvatarPickerOpen(true)}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition-all active:scale-95 ${dm ? 'border border-white/15 bg-white/10 text-white/80 hover:bg-white/15' : 'border border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50'}`}
                        >
                            Avatares emocionais
                        </button>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'border border-white/20 bg-white/10 text-white/80' : 'border border-slate-200 bg-white/85 text-slate-600'}`}>
                        <span>Conta e cuidado</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPendingAccountAction((current) => current === 'switch' ? null : 'switch')}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition-all active:scale-95 ${dm ? 'border border-white/15 bg-white/10 text-white/85 hover:bg-white/15' : 'border border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50'}`}
                        >
                            Trocar conta
                        </button>
                        <button
                            type="button"
                            onClick={() => setPendingAccountAction((current) => current === 'logout' ? null : 'logout')}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition-all active:scale-95 ${dm ? 'border border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15' : 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                            Sair
                        </button>
                    </div>
                    {pendingAccountAction && (
                        <div className={`mt-3 w-full max-w-sm rounded-2xl border px-4 py-3 text-center ${dm ? 'border-white/12 bg-black/20 text-white' : 'border-slate-200 bg-white/85 text-slate-700'}`}>
                            <p className="text-sm font-bold">
                                {pendingAccountAction === 'switch' ? 'Trocar para outra conta agora?' : 'Sair da sua conta agora?'}
                            </p>
                            <p className={`mt-1 text-xs leading-relaxed ${dm ? 'text-white/70' : 'text-slate-500'}`}>
                                {pendingAccountAction === 'switch'
                                    ? 'Você volta para a tela de login e pode entrar com outro e-mail.'
                                    : 'Você encerra a sessão atual até entrar novamente.'}
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPendingAccountAction(null)}
                                    className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] ${dm ? 'bg-white/10 text-white/85' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const action = pendingAccountAction;
                                        setPendingAccountAction(null);
                                        if (action === 'switch') {
                                            (onSwitchAccount || onLogout)();
                                            return;
                                        }
                                        onLogout();
                                    }}
                                    className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] ${pendingAccountAction === 'switch' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'}`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                    <h2 className={`mt-3 text-2xl font-extrabold tracking-tight text-center ${dm ? 'text-white' : 'text-slate-900'}`}>{displayName}</h2>
                    <p className={`mt-2 text-sm text-center max-w-xs leading-relaxed ${dm ? 'text-white/70' : 'text-slate-600'}`}>Tudo o que apoia seu ritmo, em um só lugar.</p>

                    <div className="mt-5 w-full max-w-[240px] relative">
                        <input
                            type="text"
                            placeholder="Como quer ser chamado?"
                            value={account.nickname || ''}
                            onChange={handleNicknameChange}
                            className={`w-full rounded-xl px-3 py-2 text-sm text-center focus:outline-none transition-all ${dm ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:bg-white/20' : 'bg-white/90 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100'}`}
                        />
                        <span className={`block text-[11px] mt-1 uppercase tracking-[0.14em] font-bold ${dm ? 'text-white/60' : 'text-slate-500'}`}>Apelido no App</span>
                    </div>

                    <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setBirthdateDraft(account.birthdate || '');
                                    setBirthdateCalendarOpen(true);
                                }}
                                className={`w-full rounded-xl px-4 py-3 text-left transition-all ${dm ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:bg-white/20' : 'bg-white/90 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100'}`}
                            >
                                <span className="flex items-center justify-between gap-3">
                                    <span className={`text-sm font-semibold ${dm ? (account.birthdate ? 'text-white' : 'text-white/65') : (account.birthdate ? 'text-slate-800' : 'text-slate-400')}`}>{formattedBirthdate}</span>
                                    <span className="text-base">🗓️</span>
                                </span>
                            </button>
                            <span className={`block text-[11px] mt-1 uppercase tracking-[0.14em] font-bold text-center ${dm ? 'text-white/60' : 'text-slate-500'}`}>Data de nascimento</span>
                        </div>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIdentityMenuOpen((prev) => !prev)}
                                className={`w-full rounded-xl px-4 py-3 text-left transition-all ${dm ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:bg-white/20' : 'bg-white/90 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100'}`}
                            >
                                <span className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold">{selectedIdentityLabel}</span>
                                    <span className={`text-sm transition-transform ${identityMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                                </span>
                            </button>
                            {identityMenuOpen && (
                                <div className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border p-2 shadow-2xl max-h-64 overflow-y-auto ${dm ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                                    <div className="grid grid-cols-1 gap-2">
                                        {identityOptions.map((option) => {
                                            const active = (account.sex || 'prefiro_nao_informar') === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => {
                                                        updateAccount({ sex: option.id });
                                                        setIdentityMenuOpen(false);
                                                    }}
                                                    className={`rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${active
                                                        ? (dm ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200')
                                                        : (dm ? 'text-slate-200 hover:bg-white/5 border border-transparent' : 'text-slate-700 hover:bg-slate-50 border border-transparent')}`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <span className={`block text-[11px] mt-1 uppercase tracking-[0.14em] font-bold text-center ${dm ? 'text-white/60' : 'text-slate-500'}`}>Identidade / orientação</span>
                        </div>
                    </div>

                    <div className={`mt-4 rounded-2xl px-4 py-3 text-center w-full ${dm ? 'border border-white/15 bg-white/10' : 'border border-slate-200 bg-white/88 shadow-sm'}`}>
                        <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-white/55' : 'text-slate-500'}`}>Conta</p>
                        <p className={`mt-1 text-sm font-semibold break-all ${dm ? 'text-white/80' : 'text-slate-700'}`}>{account.email}</p>
                    </div>

                    <div className="mt-4 grid w-full grid-cols-3 gap-2.5">
                        <div className={`rounded-2xl px-3 py-3 text-center ${dm ? 'border border-white/10 bg-white/8' : 'border border-slate-200 bg-white/88'}`}>
                            <p className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-900'}`}>{userProgress.badgesEarned?.length || 0}</p>
                            <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${dm ? 'text-white/55' : 'text-slate-500'}`}>Badges</p>
                        </div>
                        <div className={`rounded-2xl px-3 py-3 text-center ${dm ? 'border border-white/10 bg-white/8' : 'border border-slate-200 bg-white/88'}`}>
                            <p className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-900'}`}>{wellbeingSettings.hideStreaks ? '—' : (practiceStreak || 0)}</p>
                            <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${dm ? 'text-white/55' : 'text-slate-500'}`}>Sequência</p>
                        </div>
                        <div className={`rounded-2xl px-3 py-3 text-center ${dm ? 'border border-white/10 bg-white/8' : 'border border-slate-200 bg-white/88'}`}>
                            <p className={`text-lg font-black ${dm ? 'text-white' : 'text-slate-900'}`}>{Math.round(todayMinutes || 0)}</p>
                            <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.14em] ${dm ? 'text-white/55' : 'text-slate-500'}`}>Minutos</p>
                        </div>
                    </div>

                    <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-4">
                        <button
                            onClick={onShowPlans}
                            className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all active:scale-95 animate-shimmer ${dm ? 'border border-white/30 bg-white/15 text-white hover:bg-white/25 shadow-[0_0_24px_rgba(255,255,255,0.12)]' : 'border border-slate-200 bg-slate-900 text-white hover:bg-slate-800 shadow-sm'}`}
                        >
                            <SparklePremiumIcon className={`h-3.5 w-3.5 ${dm ? 'text-white' : 'text-white'}`} />
                            Planos
                        </button>
                    </div>
                </div>
            </div>

            {avatarPickerOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-24 pb-4">
                    <div className={`w-full max-w-md rounded-[2rem] border p-5 shadow-2xl ${dm ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-violet-300/80' : 'text-violet-700/70'}`}>Escolha um avatar</p>
                                <h3 className={`mt-1 text-xl font-black tracking-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Semblantes emocionais</h3>
                                <p className={`mt-2 text-sm leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Escolha o rosto que mais combina com o seu momento. Você ainda pode usar uma foto se quiser.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAvatarPickerOpen(false)}
                                className={`rounded-full px-3 py-1.5 text-xs font-black ${dm ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
                            >
                                Fechar
                            </button>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            {emotionalAvatarPresets.map((preset) => {
                                const avatarSrc = createAvatarSvg(preset);
                                const active = account.avatar === avatarSrc;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handlePresetAvatarSelect(preset)}
                                        className={`rounded-[1.5rem] border p-3 text-left transition-all active:scale-[0.98] ${active
                                            ? (dm ? 'border-violet-400 bg-violet-500/10' : 'border-violet-300 bg-violet-50')
                                            : (dm ? 'border-white/8 bg-white/5 hover:bg-white/8' : 'border-slate-200 bg-slate-50/80 hover:bg-white')}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={avatarSrc} alt={preset.label} className="h-14 w-14 rounded-full border border-white/20 object-cover" />
                                            <div className="min-w-0">
                                                <p className={`text-sm font-black ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{preset.label}</p>
                                                <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{preset.gender}</p>
                                                <p className={`mt-1 text-xs ${dm ? 'text-slate-400' : 'text-slate-600'}`}>{preset.mood}</p>
                                                <p className={`mt-1 text-[11px] leading-snug ${dm ? 'text-slate-500' : 'text-slate-500'}`}>{preset.vibe}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {birthdateCalendarOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-20 pb-4">
                    <div className={`w-full max-w-sm rounded-[2rem] border p-4 shadow-2xl ${dm ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>Data de nascimento</p>
                                <h3 className={`mt-1 text-lg font-black tracking-tight capitalize ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{monthLabel}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBirthdateCalendarOpen(false)}
                                className={`rounded-full px-3 py-1.5 text-xs font-black ${dm ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
                            >
                                Fechar
                            </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => setBirthdateViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition-all ${dm ? 'bg-indigo-500/12 text-indigo-200 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setBirthdateViewDate(new Date())}
                                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition-all ${dm ? 'bg-white/8 text-slate-300 hover:bg-white/12' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Hoje
                            </button>
                            <button
                                type="button"
                                onClick={() => setBirthdateViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition-all ${dm ? 'bg-indigo-500/12 text-indigo-200 hover:bg-indigo-500/20' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                            >
                                Próximo
                            </button>
                        </div>

                        <div className={`mt-4 rounded-[1.5rem] border p-3 ${dm ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
                            <label className={`block text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                                Digitar data
                            </label>
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="date"
                                    value={birthdateDraft}
                                    onChange={(e) => setBirthdateDraft(e.target.value)}
                                    className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none transition-all ${dm ? 'border-white/10 bg-slate-900/80 text-slate-100 focus:border-indigo-400' : 'border-slate-200 bg-white text-slate-800 focus:border-indigo-400'}`}
                                />
                                <button
                                    type="button"
                                    onClick={handleBirthdateDraftSave}
                                    className={`rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition-all ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
                            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day) => (
                                <span key={day} className={`py-2 text-[11px] font-black uppercase ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {day}
                                </span>
                            ))}
                            {birthdateCalendarDays.map((day) => {
                                const isCurrentMonth = day.getMonth() === birthdateViewDate.getMonth();
                                const isoDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                const isSelected = account.birthdate === isoDate;
                                const isToday = isoDate === new Date().toLocaleDateString('en-CA');
                                return (
                                    <button
                                        key={isoDate}
                                        type="button"
                                        onClick={() => handleBirthdateSelect(day)}
                                        className={`h-10 rounded-2xl text-sm font-bold transition-all ${isSelected
                                            ? (dm ? 'bg-indigo-500 text-white shadow-[0_10px_24px_rgba(99,102,241,0.32)]' : 'bg-indigo-600 text-white shadow-[0_10px_24px_rgba(99,102,241,0.24)]')
                                            : isToday
                                                ? (dm ? 'border border-indigo-400/40 bg-indigo-500/10 text-indigo-200' : 'border border-indigo-200 bg-indigo-50 text-indigo-700')
                                                : isCurrentMonth
                                                    ? (dm ? 'text-slate-200 hover:bg-white/8' : 'text-slate-800 hover:bg-slate-100')
                                                    : (dm ? 'text-slate-600 hover:bg-white/4' : 'text-slate-400 hover:bg-slate-50')}`}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* --- SEÇÃO DE PREFERÊNCIAS OTIMIZADA --- */}

            {/* 0. Assinatura e Plano */}
            <div className={`${sectionCardClass} p-5 mb-4 relative overflow-hidden`}>
                <button type="button" onClick={() => toggleProfileSection('subscription')} className="mb-4 flex w-full items-center justify-between text-left">
                    <div>
                        <p className={sectionHeaderLabelClass}>Sua assinatura</p>
                        <h3 className={sectionTitleClass}>Plano e acesso</h3>
                    </div>
                    <span className={`text-sm transition-transform ${profileSectionsExpanded.subscription ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${profileSectionsExpanded.subscription ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`rounded-3xl p-6 border shadow-sm backdrop-blur-sm relative overflow-hidden ${dm ? 'bg-[radial-gradient(circle_at_top,#243b63_0%,transparent_45%),linear-gradient(135deg,#101a2d_0%,#16253d_60%,#1b2440_100%)] border-indigo-400/20' : 'bg-indigo-50/80 border-indigo-100'}`}>
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black uppercase tracking-widest ${dm ? 'text-indigo-300' : 'text-indigo-600'}`}>Plano Atual</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <h4 className={`min-w-0 text-2xl font-black leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
                                <span className={dm ? 'text-violet-300' : 'text-violet-700'}>Sereno</span>{' '}
                                <span>{subscriptionData?.plan === 'pro' ? (subscriptionData?.planLabel?.replace(/^Sereno\s+/i, '') || 'Pro') : 'Gratuito'}</span>
                            </h4>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${subscriptionData?.plan === 'pro'
                                ? (dm ? 'bg-violet-500/15 text-violet-200 border border-violet-400/30' : 'bg-violet-100 text-violet-700 border border-violet-200')
                                : (dm ? 'bg-sky-500/15 text-sky-200 border border-sky-400/30' : 'bg-sky-100 text-sky-700 border border-sky-200')}`}>
                                {subscriptionData?.plan === 'pro' ? 'PRO' : 'FREE'}
                            </span>
                        </div>
                        {subscriptionData?.status === 'pending' && subscriptionData?.pendingPlanKey && (
                            <p className={`text-xs mt-2 ${dm ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>Pagamento em análise para {String(subscriptionData.pendingPlanKey).replaceAll('_', ' ')}. O plano ativa automaticamente após confirmação.</p>
                        )}
                        {account.role === 'admin' && (
                            <p className={`mt-2 max-w-full text-xs leading-relaxed tracking-[-0.01em] ${dm ? 'text-amber-200/80' : 'text-amber-700'}`}>
                                Acesso administrativo permanente ativo. Seu acesso completo não depende da assinatura comum.
                            </p>
                        )}
                        {subscriptionData.plan === 'free' && subscriptionData?.status !== 'pending' && (
                            <p className={`mt-2 max-w-full text-xs leading-relaxed tracking-[-0.01em] ${dm ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>Essencial liberado agora. O Pro amplia sua&nbsp;experiência.</p>
                        )}
                    </div>
                    <button
                        onClick={onShowPlans}
                        className={`self-start rounded-2xl px-4 py-2.5 text-center text-xs font-black transition-all active:scale-95 shadow-md animate-shimmer ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        {subscriptionData.plan === 'pro' ? 'Ver plano' : 'Ver planos'}
                    </button>
                </div>
            </div>
            {(account.role === 'admin' || account.adminAccess) && (
                <div className={`mt-4 rounded-3xl p-5 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#251539]/82 border-fuchsia-900/25' : 'bg-[linear-gradient(180deg,#fff7fb_0%,#ffffff_100%)] border-fuchsia-200'}`}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-fuchsia-300/80' : 'text-fuchsia-700/80'}`}>Admin exclusivo</p>
                            <h4 className={`mt-1 text-base font-black tracking-[-0.02em] ${dm ? 'text-white' : 'text-slate-900'}`}>Painel operacional</h4>
                            <p className={`mt-2 text-xs leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>
                                Só aparece para sua conta administrativa. Ao abrir, o painel ainda pede um segundo login com senha.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => window.location.assign('/sereno-admin')}
                            className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition-all active:scale-95 ${dm ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500' : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'}`}
                        >
                            Abrir painel
                        </button>
                    </div>
                </div>
            )}
            {((supportsSeatManagement && !isSoloSubscription) || currentSeatGroup || subscriptionData?.plan === 'free') && (
                <div className={`mt-4 rounded-3xl p-5 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#111d31]/82 border-cyan-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-cyan-300/80' : 'text-cyan-700/80'}`}>Vagas do plano</p>
                            <h4 className={`mt-1 text-base font-black tracking-[-0.02em] ${dm ? 'text-white' : 'text-slate-900'}`}>
                                {seatGroupIsOwner ? 'Grupo de acesso' : currentSeatGroup ? 'Plano compartilhado' : 'Entrar em plano compartilhado'}
                            </h4>
                            <p className={`mt-2 text-xs leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                                {currentSeatGroup
                                    ? `${seatSummary.occupiedSeats}/${currentSeatGroup.seatLimit} vagas ocupadas • ${seatSummary.remainingSeats} disponíveis`
                                    : 'Digite o código que o titular compartilhou com você para usar este plano na sua conta.'}
                            </p>
                        </div>
                        {currentSeatGroup && (
                            <div className={`rounded-2xl border px-3 py-2 text-right ${dm ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100' : 'border-cyan-200 bg-cyan-50 text-cyan-700'}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.14em]">Código</p>
                                <p className="mt-1 text-sm font-black">{currentSeatGroup.inviteCode}</p>
                            </div>
                        )}
                    </div>

                    {seatGroupLoading && (
                        <p className={`mt-4 text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Carregando informações do plano compartilhado...</p>
                    )}

                    {currentSeatGroup && (
                    <div className="mt-4 space-y-3">
                        {currentSeatGroup.members.map((member) => (
                            <div key={member.id} className={`rounded-2xl border px-4 py-3 ${dm ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className={`text-sm font-black ${dm ? 'text-slate-100' : 'text-slate-900'}`}>{member.name}</p>
                                        <p className={`mt-1 text-xs break-all ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{member.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${member.status === 'active'
                                            ? (dm ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                                            : (dm ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20' : 'bg-amber-50 text-amber-700 border border-amber-200')}`}>
                                            {member.role === 'owner' ? 'Titular' : member.status === 'active' ? 'Ativo' : 'Convidado'}
                                        </span>
                                        {member.role !== 'owner' && seatGroupIsOwner && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSeatMember(member.email)}
                                                className={`rounded-xl px-3 py-2 text-[11px] font-black ${dm ? 'bg-white/8 text-slate-200' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                Remover
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}

                    {seatGroupIsOwner && currentSeatGroup && (
                        <div className={`mt-4 rounded-2xl border p-4 ${dm ? 'border-white/8 bg-black/10' : 'border-slate-200 bg-slate-50/80'}`}>
                            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-slate-300' : 'text-slate-600'}`}>Adicionar membro</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <input
                                    value={seatInviteName}
                                    onChange={(e) => setSeatInviteName(e.target.value)}
                                    placeholder="Nome da pessoa"
                                    className={`w-full rounded-2xl border px-4 py-3 text-sm ${dm ? 'border-slate-700 bg-slate-950/70 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}
                                />
                                <input
                                    value={seatInviteEmail}
                                    onChange={(e) => setSeatInviteEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    className={`w-full rounded-2xl border px-4 py-3 text-sm ${dm ? 'border-slate-700 bg-slate-950/70 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}
                                />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleAddSeatMember}
                                    className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition-all active:scale-95 ${dm ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
                                >
                                    Reservar vaga
                                </button>
                                <p className={`text-xs leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Use este espaço para acompanhar e organizar as vagas do plano compartilhado.
                                </p>
                            </div>
                        </div>
                    )}

                    {!seatGroupIsOwner && (!currentSeatGroup || currentSeatMember?.status !== 'active') && (
                        <div className={`mt-4 rounded-2xl border p-4 ${dm ? 'border-white/8 bg-black/10' : 'border-slate-200 bg-slate-50/80'}`}>
                            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{currentSeatGroup ? 'Confirmar entrada' : 'Entrar com código'}</p>
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                <input
                                    value={seatJoinCode}
                                    onChange={(e) => setSeatJoinCode(e.target.value.toUpperCase())}
                                    placeholder={currentSeatGroup?.inviteCode || 'Código do convite'}
                                    className={`w-full rounded-2xl border px-4 py-3 text-sm ${dm ? 'border-slate-700 bg-slate-950/70 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}
                                />
                                <button
                                    type="button"
                                    onClick={handleJoinSeatGroup}
                                    className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition-all active:scale-95 ${dm ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
                                >
                                    Entrar
                                </button>
                            </div>
                        </div>
                    )}

                    {seatManagerMessage && (
                        <p className={`mt-3 text-xs leading-relaxed ${dm ? 'text-cyan-200/85' : 'text-cyan-700'}`}>{seatManagerMessage}</p>
                    )}
                </div>
            )}
            <div className={`mt-4 rounded-3xl p-5 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#12261f]/82 border-emerald-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f7fcfa_100%)] border-slate-200'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h4 className={`font-bold text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Indicar o Sereno</h4>
                        <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Compartilhe o Sereno de um jeito leve e cuidadoso.</p>
                    </div>
                    <button
                        onClick={onOpenRecommendApp}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.12em] transition-all active:scale-95 ${dm ? 'bg-teal-600 text-white hover:bg-teal-500' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                    >
                        Indicar
                    </button>
                </div>
            </div>
                </div>
            </div>

            <div className={`${sectionCardClass} p-5 mb-4`}>
                <button type="button" onClick={() => toggleProfileSection('settings')} className="mb-4 flex w-full items-center justify-between text-left">
                    <div>
                        <p className={sectionHeaderLabelClass}>Ajustes do seu espaço</p>
                        <h3 className={sectionTitleClass}>Rotina e preferências</h3>
                    </div>
                    <span className={`text-sm transition-transform ${profileSectionsExpanded.settings ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                <div className={`transition-all duration-300 ${profileSectionsExpanded.settings ? 'max-h-[2600px] overflow-visible opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
            {/* 1. Bem-estar (Meta Diária) */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#101a2d]/82 border-indigo-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] border-slate-200'}`}>
                <div className="flex justify-between items-center mb-2">
                    <label className={`font-semibold text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Meta Diária (minutos)</label>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${dm ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{dailyGoal} min</span>
                </div>
                <input type="range" min="5" max="60" step="5" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full h-3 mt-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-indigo-300 to-indigo-500 accent-indigo-600" />
                <div className="flex justify-between text-[11px] mt-1 text-gray-400">
                    <span>5 min</span><span>60 min</span>
                </div>
            </div>

            {/* 2. Notificações */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#10212a]/82 border-cyan-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfc_100%)] border-slate-200'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Notificações e Lembretes</h4>
                <p className={`text-xs mb-4 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Esses controles valem para os lembretes do dispositivo e para os avisos automáticos relacionados dentro do app.</p>

                <div className="space-y-3">
                    <div>
                        <button
                            type="button"
                            onClick={() => toggleNotificationGroup('routine')}
                            className={`mb-3 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left ${dm ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}
                        >
                            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Rotina e constância</p>
                            <span className={`text-sm transition-transform ${notificationsExpanded.routine ? 'rotate-180' : ''}`}>⌄</span>
                        </button>
                        <div className={`space-y-3 transition-all duration-300 ${notificationsExpanded.routine ? 'max-h-[1200px] overflow-visible opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#0f1b29]/72 border-cyan-950/30' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">📊</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Diário de Humor</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.moodReminder && <ModernTimePicker value={reminderSettings.moodTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, moodTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.moodReminder} onChange={(val) => handleReminderToggle('moodReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#0f1b29]/72 border-cyan-950/30' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🌬️</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Respiração Diária</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.breathingReminder && <ModernTimePicker value={reminderSettings.breathingTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, breathingTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.breathingReminder} onChange={(val) => handleReminderToggle('breathingReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#121d2a]/72 border-indigo-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">📓</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Registro no Diário</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.diaryReminder && <ModernTimePicker value={reminderSettings.diaryTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, diaryTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.diaryReminder} onChange={(val) => handleReminderToggle('diaryReminder', val)} />
                        </div>
                    </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={() => toggleNotificationGroup('support')}
                            className={`mb-3 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left ${dm ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}
                        >
                            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Apoio emocional</p>
                            <span className={`text-sm transition-transform ${notificationsExpanded.support ? 'rotate-180' : ''}`}>⌄</span>
                        </button>
                        <div className={`space-y-3 transition-all duration-300 ${notificationsExpanded.support ? 'max-h-[2200px] overflow-visible opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                    <div className={`rounded-2xl border p-3 ${dm ? 'bg-[#0f1b29]/72 border-cyan-950/30' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3"><span className="text-lg">💬</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Eu Mais Saudável</span></div>
                            <div className="flex items-center gap-2">
                                {reminderSettings.healthySelfReminder && <ModernTimePicker value={reminderSettings.healthySelfTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, healthySelfTime: nextValue })} darkMode={dm} />}
                                <ToggleSwitch checked={reminderSettings.healthySelfReminder} onChange={(val) => handleReminderToggle('healthySelfReminder', val)} />
                            </div>
                        </div>
                        {healthySelfGuardMessage && (
                            <div className={`mt-3 rounded-2xl border px-4 py-3 ${dm ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-emerald-100 bg-emerald-50'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 text-base">💬</span>
                                        <div>
                                            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-emerald-300/85' : 'text-emerald-700/80'}`}>Antes de ativar</p>
                                            <p className={`mt-1 text-xs leading-relaxed ${dm ? 'text-slate-200' : 'text-slate-700'}`}>{healthySelfGuardMessage}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setHealthySelfGuardMessage(null)}
                                        className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${dm ? 'bg-white/8 text-slate-200' : 'bg-white text-slate-600 shadow-sm'}`}
                                    >
                                        Entendi
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#0f1f23]/72 border-emerald-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🧘</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Meditação</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.meditationReminder && <ModernTimePicker value={reminderSettings.meditationTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, meditationTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.meditationReminder} onChange={(val) => handleReminderToggle('meditationReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#121d2a]/72 border-indigo-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🌙</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Yoga Nidra</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.yogaReminder && <ModernTimePicker value={reminderSettings.yogaTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, yogaTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.yogaReminder} onChange={(val) => handleReminderToggle('yogaReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#0f1f23]/72 border-emerald-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🙏</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Gratidão</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.gratitudeReminder && <ModernTimePicker value={reminderSettings.gratitudeTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, gratitudeTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.gratitudeReminder} onChange={(val) => handleReminderToggle('gratitudeReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#121d2a]/72 border-indigo-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🌙</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Sono</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.sleepReminder && <ModernTimePicker value={reminderSettings.sleepTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, sleepTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.sleepReminder} onChange={(val) => handleReminderToggle('sleepReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#121d2a]/72 border-indigo-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🎯</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Missões</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.missionsReminder && <ModernTimePicker value={reminderSettings.missionsTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, missionsTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.missionsReminder} onChange={(val) => handleReminderToggle('missionsReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#0f1b29]/72 border-cyan-950/30' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🌿</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Microtarefas</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.microtasksReminder && <ModernTimePicker value={reminderSettings.microtasksTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, microtasksTime: nextValue })} darkMode={dm} />}
                            <ToggleSwitch checked={reminderSettings.microtasksReminder} onChange={(val) => handleReminderToggle('microtasksReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#171c31]/72 border-violet-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-lg">✨</span>
                            <div>
                                <span className={`block text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Sugestão adaptativa</span>
                                <span className={`block text-[11px] mt-0.5 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Receber 1 sugestão personalizada por dia.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.adaptiveSuggestionReminder && (
                                <ModernTimePicker value={reminderSettings.adaptiveSuggestionTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, adaptiveSuggestionTime: nextValue })} darkMode={dm} />
                            )}
                            <ToggleSwitch checked={reminderSettings.adaptiveSuggestionReminder} onChange={(val) => handleReminderToggle('adaptiveSuggestionReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#0f1b29]/72 border-cyan-950/30' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-lg">🗺️</span>
                            <div>
                                <span className={`block text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Mapa Mental Emocional</span>
                                <span className={`block text-[11px] mt-0.5 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Lembrete para revisar padrões emocionais recentes.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.mindmapReminder && (
                                <ModernTimePicker value={reminderSettings.mindmapTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, mindmapTime: nextValue })} darkMode={dm} />
                            )}
                            <ToggleSwitch checked={reminderSettings.mindmapReminder} onChange={(val) => handleReminderToggle('mindmapReminder', val)} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-[#111d31]/72 border-blue-950/25' : 'bg-slate-50/90 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-lg">📚</span>
                            <div>
                                <span className={`block text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Psicoeducação</span>
                                <span className={`block text-[11px] mt-0.5 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Lembrete para abrir um conteúdo curto ou prática rápida.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.psychoeduReminder && (
                                <ModernTimePicker value={reminderSettings.psychoeduTime} onChange={(nextValue) => setReminderSettings({ ...reminderSettings, psychoeduTime: nextValue })} darkMode={dm} />
                            )}
                            <ToggleSwitch checked={reminderSettings.psychoeduReminder} onChange={(val) => handleReminderToggle('psychoeduReminder', val)} />
                        </div>
                    </div>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-4 ${dm ? 'bg-[#111c30]/82 border-indigo-900/25' : 'bg-indigo-50/80 border-indigo-100'}`}>
                        <button
                            type="button"
                            onClick={() => toggleNotificationGroup('therapy')}
                            className="mb-3 flex w-full items-center justify-between text-left"
                        >
                            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${dm ? 'text-indigo-300/70' : 'text-indigo-700/60'}`}>Terapia e acompanhamento</p>
                            <span className={`text-sm transition-transform ${notificationsExpanded.therapy ? 'rotate-180' : ''}`}>⌄</span>
                        </button>
                        <div className={`transition-all duration-300 ${notificationsExpanded.therapy ? 'max-h-[320px] overflow-visible opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📅</span>
                                <div>
                                    <span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Sessões de terapia</span>
                                    <p className={`text-[11px] mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Avisos no app para 1 dia antes e 1h antes.</p>
                                </div>
                            </div>
                            <ToggleSwitch checked={reminderSettings.therapyReminder} onChange={(val) => handleReminderToggle('therapyReminder', val)} />
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ${reminderSettings.therapyReminder ? 'max-h-72 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setReminderSettings({ ...reminderSettings, therapyReminderDayBefore: !reminderSettings.therapyReminderDayBefore })}
                                    className={`py-2.5 rounded-xl text-xs font-black border ${reminderSettings.therapyReminderDayBefore ? 'bg-blue-600 text-white border-blue-500' : (dm ? 'bg-[#0f1828] border-cyan-900/25 text-slate-300' : 'bg-white border-gray-200 text-gray-600')}`}
                                >
                                    1 dia antes
                                </button>
                                <button
                                    onClick={() => setReminderSettings({ ...reminderSettings, therapyReminderHourBefore: !reminderSettings.therapyReminderHourBefore })}
                                    className={`py-2.5 rounded-xl text-xs font-black border ${reminderSettings.therapyReminderHourBefore ? 'bg-indigo-600 text-white border-indigo-500' : (dm ? 'bg-[#111d31] border-indigo-900/25 text-slate-300' : 'bg-white border-gray-200 text-gray-600')}`}
                                >
                                    1h antes
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Do Not Disturb Toggle */}
                    <div className={`mt-4 pt-4 border-t flex items-center justify-between ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div>
                            <p className={`text-sm font-bold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Pausar Lembretes</p>
                            <p className={`text-[11px] ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Não enviar notificações temporariamente</p>
                        </div>
                        <ToggleSwitch checked={reminderSettings.doNotDisturb} onChange={handleDoNotDisturbToggle} />
                    </div>
                </div>
            </div>

                </div>
            </div>

            {/* 3. Privacidade e Segurança */}
            <div className={`${sectionCardClass} p-5 mb-4`}>
                <button type="button" onClick={() => toggleProfileSection('privacy')} className="mb-4 flex w-full items-center justify-between text-left">
                    <div>
                        <p className={sectionHeaderLabelClass}>Privacidade</p>
                        <h3 className={sectionTitleClass}>Segurança e controle</h3>
                    </div>
                    <span className={`text-sm transition-transform ${profileSectionsExpanded.privacy ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${profileSectionsExpanded.privacy ? 'max-h-[1400px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#171c31]/82 border-violet-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] border-slate-200'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Privacidade e Segurança</h4>
                <div className="space-y-4">
                    <div className={`rounded-2xl border p-4 ${dm ? 'bg-[#14182a]/82 border-violet-950/25' : 'bg-amber-50/80 border-amber-100'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Bloqueio do App por PIN</p>
                            <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Adicione uma camada extra de segurança para abrir o app.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setPinEditorOpen((prev) => !prev);
                                    setPinMessage(null);
                                    setPinGuardMessage(null);
                                    setPendingPinActivation(false);
                                    setActivationPinInput('');
                                    setCurrentPinInput('');
                                    setNewPinInput('');
                                }}
                                className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 ${dm ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {privacySettings.appLockPin ? 'Mudar PIN' : 'Definir PIN'}
                            </button>
                            <ToggleSwitch checked={privacySettings.appLockEnabled} onChange={handleAppLockToggle} />
                        </div>
                    </div>
                    {pinGuardMessage && (
                        <div className={`mt-3 rounded-[1.4rem] border p-4 shadow-sm animate-fade-in ${dm ? 'border-violet-500/20 bg-[linear-gradient(135deg,rgba(91,33,182,0.24),rgba(15,23,42,0.9))]' : 'border-violet-100 bg-[linear-gradient(135deg,#faf5ff_0%,#eef2ff_100%)]'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${dm ? 'bg-violet-500/15 text-violet-200' : 'bg-violet-100 text-violet-700'}`}>
                                    <span className="text-lg">🔐</span>
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-black ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Antes de ativar o bloqueio</p>
                                    <p className={`mt-1 text-xs leading-relaxed ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{pinGuardMessage}</p>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPinEditorOpen(true);
                                                setPinGuardMessage(null);
                                            }}
                                            className={`rounded-xl px-3 py-2 text-xs font-black transition-all active:scale-95 ${dm ? 'bg-violet-500 text-white hover:bg-violet-400' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                                        >
                                            Definir agora
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPinGuardMessage(null)}
                                            className={`rounded-xl px-3 py-2 text-xs font-black transition-all active:scale-95 ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {pinEditorOpen && (
                        <div className={`mt-3 rounded-2xl border p-3 space-y-3 ${dm ? 'bg-[#14182a]/72 border-violet-950/25' : 'bg-gray-50 border-gray-200'}`}>
                            {privacySettings.appLockPin ? (
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="PIN anterior"
                                    value={currentPinInput}
                                    onChange={(e) => {
                                        setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                                        setPinMessage(null);
                                    }}
                                    className={`w-full text-center text-sm px-3 py-2 rounded-xl bg-transparent border outline-none font-mono tracking-[0.35em] ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`}
                                />
                            ) : null}
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder={privacySettings.appLockPin ? 'Novo PIN' : 'Digite um PIN de 4 dígitos'}
                                value={newPinInput}
                                onChange={(e) => {
                                    setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                                    setPinMessage(null);
                                }}
                                className={`w-full text-center text-sm px-3 py-2 rounded-xl bg-transparent border outline-none font-mono tracking-[0.35em] ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSavePin}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                    Salvar
                                </button>
                                <button
                                    onClick={() => {
                                        setPinEditorOpen(false);
                                        setCurrentPinInput('');
                                        setNewPinInput('');
                                        setPinMessage(null);
                                    }}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${dm ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                    {pinMessage && (
                        <p className={`text-[11px] mt-2 ${pinMessage.includes('sucesso') ? (dm ? 'text-emerald-300' : 'text-emerald-700') : (dm ? 'text-amber-300' : 'text-amber-700')}`}>{pinMessage}</p>
                    )}
                    {!hasValidPin && (
                        <p className={`text-[11px] mt-2 ${dm ? 'text-amber-300' : 'text-amber-700'}`}>Defina um PIN de 4 dígitos para o bloqueio entrar em funcionamento.</p>
                    )}
                    </div>

                </div>
            </div>

                </div>
            </div>

            <div className={`${sectionCardClass} p-5 mb-4`}>
                <button type="button" onClick={() => toggleProfileSection('immersion')} className="mb-4 flex w-full items-center justify-between text-left">
                    <div>
                        <p className={sectionHeaderLabelClass}>Acessibilidade e imersão</p>
                        <h3 className={sectionTitleClass}>Áudio e conforto</h3>
                    </div>
                    <span className={`text-sm transition-transform ${profileSectionsExpanded.immersion ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${profileSectionsExpanded.immersion ? 'max-h-[1400px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#171b2f]/82 border-violet-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] border-slate-200'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Áudio e Imersão</h4>

                <div className="mb-5">
                    <label className={`block font-semibold text-sm mb-3 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Voz Padrão de Narração</label>
                    <div className="flex gap-2">
                        {[
                            { id: 'feminino', label: 'SERENA', icon: '👩' },
                            { id: 'masculino', label: 'SERENO', icon: '👨' },
                            { id: 'nenhuma', label: 'Silêncio', icon: '🔇' }
                        ].map(voice => (
                            <div key={voice.id} className={`relative flex-1 overflow-hidden rounded-2xl border text-xs font-bold transition-all ${voice.id === 'feminino'
                                ? (defaultVoice === voice.id ? (dm ? 'border-pink-400/50 bg-pink-500/12 text-pink-200' : 'border-pink-300 bg-pink-50 text-pink-700') : (dm ? 'border-pink-500/15 bg-pink-950/20 text-pink-200/80' : 'border-pink-100 bg-pink-50/70 text-pink-600'))
                                : voice.id === 'masculino'
                                    ? (defaultVoice === voice.id ? (dm ? 'border-sky-400/50 bg-sky-500/12 text-sky-200' : 'border-sky-300 bg-sky-50 text-sky-700') : (dm ? 'border-sky-500/15 bg-sky-950/20 text-sky-200/80' : 'border-sky-100 bg-sky-50/70 text-sky-600'))
                                    : (defaultVoice === voice.id ? (dm ? 'border-red-400/50 bg-red-500/12 text-red-200' : 'border-red-300 bg-red-50 text-red-700') : (dm ? 'border-red-500/15 bg-red-950/20 text-red-200/80' : 'border-red-100 bg-red-50/70 text-red-600'))
                            }`}>
                                <button type="button" onClick={() => setDefaultVoice(voice.id as any)} className="flex min-h-[88px] w-full flex-col items-center justify-center gap-1.5 px-3 py-4">
                                    <span className="text-lg">{voice.icon}</span>
                                    <span>{voice.label}</span>
                                </button>
                                {voice.id !== 'nenhuma' && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            previewProfileVoice(voice.id as 'feminino' | 'masculino');
                                        }}
                                        aria-label={`Ouvir prévia da voz ${voice.label}`}
                                        className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95 ${voice.id === 'feminino'
                                            ? (dm ? 'border-pink-400/30 bg-pink-950/50 text-pink-100' : 'border-pink-200 bg-white/90 text-pink-600')
                                            : (dm ? 'border-sky-400/30 bg-sky-950/50 text-sky-100' : 'border-sky-200 bg-white/90 text-sky-600')
                                        }`}
                                    >
                                        {previewingProfileVoice === voice.id ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="7" y="7" width="10" height="10" rx="1.5" />
                                            </svg>
                                        ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={`rounded-2xl border px-4 py-3 ${dm ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white/80'}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className={`text-sm font-semibold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Música de fundo</p>
                                <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Escolha se os sons ambientes acompanham as práticas.</p>
                            </div>
                            <span className={`text-[11px] font-black uppercase tracking-[0.14em] ${audioSettings.backgroundMusicEnabled ? (dm ? 'text-cyan-200' : 'text-cyan-700') : (dm ? 'text-slate-400' : 'text-slate-500')}`}>
                                {audioSettings.backgroundMusicEnabled ? 'Ligada' : 'Desligada'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setAudioSettings({ ...audioSettings, backgroundMusicEnabled: true })}
                                className={`rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-[0.14em] transition-all ${audioSettings.backgroundMusicEnabled ? (dm ? 'border border-cyan-400/40 bg-cyan-500/10 text-cyan-200' : 'border border-cyan-200 bg-cyan-50 text-cyan-700') : (dm ? 'border border-white/10 bg-slate-800 text-slate-400' : 'border border-slate-200 bg-slate-50 text-slate-500')}`}
                            >
                                Com música
                            </button>
                            <button
                                type="button"
                                onClick={() => setAudioSettings({ ...audioSettings, backgroundMusicEnabled: false })}
                                className={`rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-[0.14em] transition-all ${!audioSettings.backgroundMusicEnabled ? (dm ? 'border border-red-400/40 bg-red-500/10 text-red-200' : 'border border-red-200 bg-red-50 text-red-700') : (dm ? 'border border-white/10 bg-slate-800 text-slate-400' : 'border border-slate-200 bg-slate-50 text-slate-500')}`}
                            >
                                Sem música
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1"><span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Música de Fundo</span><span className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{audioSettings.musicVolume}%</span></div>
                        <input type="range" min="0" max="100" value={audioSettings.musicVolume} onChange={(e) => setAudioSettings({ ...audioSettings, musicVolume: Number(e.target.value) })} className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-blue-300 to-indigo-400 accent-indigo-500" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1"><span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Volume da Voz</span><span className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{audioSettings.voiceVolume}%</span></div>
                        <input type="range" min="0" max="100" value={audioSettings.voiceVolume} onChange={(e) => setAudioSettings({ ...audioSettings, voiceVolume: Number(e.target.value) })} className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-purple-300 to-pink-400 accent-pink-500" />
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t flex items-center justify-between border-gray-100 dark:border-gray-700">
                    <p className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Vibrações do Aplicativo (Haptics)</p>
                    <ToggleSwitch checked={audioSettings.hapticsEnabled} onChange={(val) => setAudioSettings({ ...audioSettings, hapticsEnabled: val })} />
                </div>
            </div>

            <div className={`rounded-3xl p-6 mb-8 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#10212f]/82 border-cyan-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfc_100%)] border-slate-200'}`}>
                <h4 className={`font-bold text-sm mb-4 flex items-center gap-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>❤️ Tranquilidade</h4>
                <div className="flex items-center justify-between">
                    <div className="pr-4">
                        <p className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Ocultar Sequência de Dias</p>
                        <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Se você não gosta da pressão de contar dias consecutivos, ative isso.</p>
                    </div>
                    <ToggleSwitch checked={wellbeingSettings.hideStreaks} onChange={(val) => setWellbeingSettings({ ...wellbeingSettings, hideStreaks: val })} />
                </div>
            </div>
                </div>
            </div>

            <div className={`${sectionCardClass} p-5 mb-6`}>
                <button type="button" onClick={() => toggleProfileSection('data')} className="mb-4 flex w-full items-center justify-between text-left">
                    <div>
                        <p className={sectionHeaderLabelClass}>Seus dados</p>
                        <h3 className={sectionTitleClass}>Exportação e ações da conta</h3>
                    </div>
                    <span className={`text-sm transition-transform ${profileSectionsExpanded.data ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${profileSectionsExpanded.data ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`rounded-3xl p-6 mb-6 border shadow-sm backdrop-blur-sm ${dm ? 'bg-[#0f1828]/84 border-cyan-900/25' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200'}`}>
                <h4 className={`font-bold text-sm mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Seus dados</h4>
                <p className={`text-xs mb-4 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Exporte seu histórico com segurança antes de tomar qualquer ação irreversível.</p>
                <button onClick={() => setShowExportModal(true)}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm hover:shadow-md ${dm ? 'bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                    <span className="text-xl">📤</span> Exportar Meus Dados
                </button>
                {showExportModal && (
                    <div className={`mt-4 rounded-[1.8rem] border p-4 animate-fade-in ${dm ? 'border-slate-700 bg-slate-900/90' : 'border-slate-200 bg-white shadow-md'}`}>
                        <div className="mb-4">
                            <p className={`text-sm font-black ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Exportar Meus Dados</p>
                            <p className={`mt-1 text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Baixe ou compartilhe seu histórico sem sair dessa área.</p>
                            <p className={`mt-2 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-indigo-300/80' : 'text-indigo-700/70'}`}>
                                {subscriptionData?.plan === 'pro' ? 'Exportação ilimitada no seu plano atual' : 'No grátis: 2 exportações por mês'}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button onClick={handleExportTXT} className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${dm ? 'bg-slate-800/70 border-slate-700 hover:bg-slate-800' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className={`font-bold text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Documento de Texto (TXT)</p>
                                    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Histórico legível, detalhado e fácil de levar para a terapia.</p>
                                </div>
                            </button>
                            <button onClick={handleExportCSV} className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${dm ? 'bg-slate-800/70 border-slate-700 hover:bg-slate-800' : 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                                <span className="text-2xl">📊</span>
                                <div>
                                    <p className={`font-bold text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Planilha de Dados (CSV)</p>
                                    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Histórico em linhas e colunas, pronto para Excel e análise.</p>
                                </div>
                            </button>
                            <button onClick={handleExportPDF} className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${dm ? 'bg-slate-800/70 border-slate-700 hover:bg-slate-800' : 'bg-[linear-gradient(180deg,#ffffff_0%,#fffaf3_100%)] border-slate-200 hover:bg-amber-50 hover:border-amber-200'}`}>
                                <span className="text-2xl">🧾</span>
                                <div>
                                    <p className={`font-bold text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Relatório em PDF</p>
                                    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Versão pronta para salvar, imprimir ou compartilhar.</p>
                                </div>
                            </button>
                        </div>
                        <div className="mt-4">
                            <p className={`mb-2 text-[11px] font-black uppercase tracking-[0.14em] ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Compartilhar</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleShareExport('whatsapp')} className="rounded-xl bg-emerald-500 px-3 py-3 text-xs font-black text-white transition-all active:scale-95">WhatsApp</button>
                                <button onClick={() => handleShareExport('telegram')} className="rounded-xl bg-sky-500 px-3 py-3 text-xs font-black text-white transition-all active:scale-95">Telegram</button>
                                <button onClick={() => handleShareExport('email')} className="rounded-xl bg-slate-800 px-3 py-3 text-xs font-black text-white transition-all active:scale-95">E-mail</button>
                            </div>
                        </div>
                        <button onClick={() => setShowExportModal(false)} className={`mt-4 w-full rounded-xl py-3 text-sm font-bold transition-all ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                            Fechar
                        </button>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className={`rounded-3xl p-6 mb-8 border shadow-sm backdrop-blur-sm ${dm ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50/50 border-red-100'}`}>
                <h3 className={`font-bold text-base mb-2 flex items-center gap-2 ${dm ? 'text-red-400' : 'text-red-700'}`}>
                    <span>⚠️</span> Gerenciar Dados
                </h3>
                <p className={`text-xs mb-4 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Estes dados ficam salvos apenas neste dispositivo. Limpar os dados apagará todas as suas anotações, diário, métricas e favoritos (ação irreversível).</p>

                {!showClearConfirm ? (
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${dm ? 'bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}
                    >
                        Apagar Todo o Histórico
                    </button>
                ) : (
                    <div className={`mt-4 p-4 rounded-2xl animate-fade-in border ${dm ? 'bg-red-900/40 border-red-700' : 'bg-white border-red-200 shadow-md'}`}>
                        <p className={`text-sm font-bold mb-3 text-center ${dm ? 'text-red-300' : 'text-red-600'}`}>Tem certeza que deseja apagar?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearData}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm active:scale-95"
                            >
                                Sim
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors active:scale-95"
                            >
                                Não
                            </button>
                        </div>
                    </div>
                )}
            </div>
                </div>
            </div>
            <p className="text-center text-xs text-gray-400/70 mt-8 mb-4">Sereno App v1.2.0</p>
        </div>
    );
}
