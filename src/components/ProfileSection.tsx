'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
}

interface ProfileSectionProps {
    account: UserAccount | null;
    onLogout: () => void;
    updateAccount: (updates: Partial<UserAccount>) => void;
    userProgress: UserProgress;
    darkMode: boolean;
    onToggleTheme: () => void;

    // Settings passed from parent
    dailyGoal: number;
    setDailyGoal: (val: number) => void;
    reminderSettings: any;
    setReminderSettings: (val: any) => void;
    privacySettings: any;
    setPrivacySettings: (val: any) => void;
    visualSettings: any;
    setVisualSettings: (val: any) => void;
    audioSettings: any;
    setAudioSettings: (val: any) => void;
    wellbeingSettings: any;
    setWellbeingSettings: (val: any) => void;
    defaultVoice: 'feminino' | 'masculino' | 'nenhuma';
    setDefaultVoice: (val: 'feminino' | 'masculino' | 'nenhuma') => void;
    subscriptionData: any;
    onShowPlans: () => void;
}

function DiamondIcon({ className = "w-4 h-4 text-indigo-400" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12l4 5-10 13L2 8z" />
            <path d="M11 3 8 8l2 13" />
            <path d="M13 3l3 5-2 13" />
        </svg>
    );
}

export default function ProfileSection({
    account, onLogout, updateAccount, userProgress, darkMode: dm, onToggleTheme,
    dailyGoal, setDailyGoal,
    reminderSettings, setReminderSettings,
    privacySettings, setPrivacySettings,
    visualSettings, setVisualSettings,
    audioSettings, setAudioSettings,
    wellbeingSettings, setWellbeingSettings,
    defaultVoice, setDefaultVoice,
    subscriptionData, onShowPlans
}: ProfileSectionProps) {
    if (!account) return null;

    // Modals

    // Modais
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const totalActivities = userProgress.meditationsCompleted + userProgress.breathingCompleted + userProgress.yogaCompleted;

    const handleClearData = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleExportTXT = () => {
        const content = `=== Sereno - Relatório de Progresso ===
Usuário: ${account.name}
Email: ${account.email}
Data: ${new Date().toLocaleDateString('pt-BR')}

--- Atividades Completadas ---
Meditações: ${userProgress.meditationsCompleted}
Exercícios de Respiração: ${userProgress.breathingCompleted}
Sessões Yoga Nidra: ${userProgress.yogaCompleted}
Total de Atividades: ${totalActivities}
Minutos Totais de Cuidado: ${userProgress.totalMinutes}

* Gerado automaticamente pelo Sereno | App de Bem-estar`.trim();

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        triggerDownload(blob, `sereno-relatorio-${new Date().toISOString().split('T')[0]}.txt`);
        setShowExportModal(false);
    };

    const handleExportCSV = () => {
        const headers = "Categoria,Quantidade\n";
        const rows = `Meditacoes,${userProgress.meditationsCompleted}\nRespiracoes,${userProgress.breathingCompleted}\nYogaNidra,${userProgress.yogaCompleted}\nAtividadesTotais,${totalActivities}\nMinutosTotais,${userProgress.totalMinutes}`;

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8' });
        triggerDownload(blob, `sereno-dados-${new Date().toISOString().split('T')[0]}.csv`);
        setShowExportModal(false);
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
                alert('A imagem é muito grande. Por favor, escolha uma imagem menor (até 2MB).');
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

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            {/* Modal de Exportação */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className={`w-full max-w-sm rounded-[2rem] p-6 animate-scale-in shadow-2xl ${dm ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                        <div className="text-center mb-6">
                            <span className="text-4xl mb-2 block">📥</span>
                            <h3 className={`font-bold text-xl ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Exportar Meus Dados</h3>
                            <p className={`text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Como você prefere baixar o seu relatório?</p>
                        </div>

                        <div className="space-y-3">
                            <button onClick={handleExportTXT} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${dm ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className={`font-bold text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Documento de Texto (TXT)</p>
                                    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Fácil leitura humana. Ideal para levar à terapia.</p>
                                </div>
                            </button>
                            <button onClick={handleExportCSV} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${dm ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                                <span className="text-2xl">📊</span>
                                <div>
                                    <p className={`font-bold text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Planilha de Dados (CSV)</p>
                                    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Estruturado em colunas. Ideal para Excel genérico.</p>
                                </div>
                            </button>
                        </div>

                        <button onClick={() => setShowExportModal(false)} className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all ${dm ? 'text-gray-300 bg-slate-800 hover:bg-slate-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Profile Header */}
            <div className={`rounded-[2.5rem] p-8 mb-8 text-center shadow-md relative overflow-hidden ${dm ? 'bg-gradient-to-br from-purple-900/80 to-blue-900/80 border border-purple-800/50' : 'bg-gradient-to-br from-purple-600 to-blue-600'} text-white`}>
                <div className="absolute top-0 left-0 w-full h-full bg-white/5 backdrop-blur-3xl pointer-events-none" />

                {/* Floating Plans Button */}
                <div className="absolute top-6 left-6 z-20">
                    <button
                        onClick={onShowPlans}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg bg-white/20 border border-white/30 backdrop-blur-md text-white hover:bg-white/30`}
                    >
                        <DiamondIcon className="w-3 h-3 text-white" />
                        Planos
                    </button>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative group cursor-pointer mb-4">
                        <input
                            type="file"
                            accept="image/*"
                            id="avatar-upload"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <label htmlFor="avatar-upload" className="block w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-5xl shadow-inner border border-white/20 cursor-pointer overflow-hidden transition-transform group-hover:scale-105">
                            {account.avatar.startsWith('data:image') ? (
                                <img src={account.avatar} alt="Avatar do Usuário" className="w-full h-full object-cover" />
                            ) : (
                                <span>{account.avatar === '🌐' ? '👤' : (account.avatar || '👤')}</span>
                            )}

                            {/* Overlay de edição (visível ao passar o mouse ou em dispositivos tocáveis) */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <span className="text-white text-sm font-bold">📷 Mudar</span>
                            </div>
                        </label>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{account.name}</h2>
                    <div className="mt-2 w-full max-w-[200px] relative">
                        <input
                            type="text"
                            placeholder="Como quer ser chamado?"
                            value={account.nickname || ''}
                            onChange={handleNicknameChange}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/50 text-center focus:outline-none focus:bg-white/20 transition-all"
                        />
                        <span className="block text-[10px] text-white/60 mt-1 uppercase tracking-widest font-bold">Apelido no App</span>
                    </div>
                    <div className="mt-4 w-full max-w-[200px] relative">
                        <input
                            type="date"
                            value={account.birthdate || ''}
                            onChange={(e) => updateAccount({ birthdate: e.target.value })}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/50 text-center focus:outline-none focus:bg-white/20 transition-all [color-scheme:dark]"
                        />
                        <span className="block text-[10px] text-white/60 mt-1 uppercase tracking-widest font-bold">Sua Data de Nascimento</span>
                    </div>
                    <p className="text-white/80 font-medium mt-1">{account.email}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={`rounded-3xl p-6 mb-8 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>
                    <span>📊</span> Seu Progresso
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-2xl p-4 text-center transition-all ${dm ? 'bg-purple-900/30 border border-purple-800/50' : 'bg-purple-50/80 border border-purple-100 shadow-sm'}`}>
                        <span className="text-3xl block filter drop-shadow-sm mb-1">🧘</span>
                        <p className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-300" suppressHydrationWarning>{userProgress.meditationsCompleted}</p>
                        <p className={`text-xs font-medium mt-1 ${dm ? 'text-purple-400/80' : 'text-purple-600/80'}`}>Meditações</p>
                    </div>
                    <div className={`rounded-2xl p-4 text-center transition-all ${dm ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50/80 border border-blue-100 shadow-sm'}`}>
                        <span className="text-3xl block filter drop-shadow-sm mb-1">🌬️</span>
                        <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300" suppressHydrationWarning>{userProgress.breathingCompleted}</p>
                        <p className={`text-xs font-medium mt-1 ${dm ? 'text-blue-400/80' : 'text-blue-600/80'}`}>Respirações</p>
                    </div>
                    <div className={`rounded-2xl p-4 text-center transition-all ${dm ? 'bg-indigo-900/30 border border-indigo-800/50' : 'bg-indigo-50/80 border border-indigo-100 shadow-sm'}`}>
                        <span className="text-3xl block filter drop-shadow-sm mb-1">🌙</span>
                        <p className="text-2xl font-bold mt-1 text-indigo-700 dark:text-indigo-300" suppressHydrationWarning>{userProgress.yogaCompleted}</p>
                        <p className={`text-xs font-medium mt-1 ${dm ? 'text-indigo-400/80' : 'text-indigo-600/80'}`}>Yoga Nidra</p>
                    </div>
                    {!wellbeingSettings.hideStreaks && (
                        <div className={`rounded-2xl p-4 text-center transition-all ${dm ? 'bg-orange-900/30 border border-orange-800/50' : 'bg-orange-50/80 border border-orange-100 shadow-sm'}`}>
                            <span className="text-3xl block filter drop-shadow-sm mb-1">🔥</span>
                            <p className="text-2xl font-bold mt-1 text-orange-700 dark:text-orange-300" suppressHydrationWarning>{userProgress.streak} Dias</p>
                            <p className={`text-xs font-medium mt-1 ${dm ? 'text-orange-400/80' : 'text-orange-600/80'}`}>Constância</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- SEÇÃO DE PREFERÊNCIAS OTIMIZADA --- */}

            {/* 0. Assinatura e Plano */}
            <h3 className={`font-bold text-lg mb-5 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'} px-2`}>
                <span>💎</span> Sua Assinatura
            </h3>
            <div className={`rounded-3xl p-6 mb-8 border shadow-sm backdrop-blur-sm relative overflow-hidden ${dm ? 'bg-indigo-900/40 border-indigo-500/30' : 'bg-indigo-50/80 border-indigo-100'}`}>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className={`text-xs font-black uppercase tracking-widest ${dm ? 'text-indigo-300' : 'text-indigo-600'}`}>Plano Atual</p>
                        <h4 className={`text-2xl font-black mt-1 ${dm ? 'text-white' : 'text-slate-900'}`}>
                            Sereno {subscriptionData.plan === 'pro' ? 'Pro 💎' : 'Gratuito 🆓'}
                        </h4>
                        {subscriptionData.plan === 'free' && (
                            <p className={`text-xs mt-2 ${dm ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>Limites diários e recursos básicos ativos.</p>
                        )}
                    </div>
                    <button
                        onClick={onShowPlans}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md ${dm ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        {subscriptionData.plan === 'pro' ? 'Ver Benefícios' : 'Fazer Upgrade'}
                    </button>
                </div>
            </div>

            <h3 className={`font-bold text-lg mb-5 flex items-center gap-2 ${dm ? 'text-gray-200' : 'text-gray-800'} px-2`}>
                <span>⚙️</span> Configurações de Aplicativo
            </h3>

            {/* 1. Bem-estar (Meta Diária) */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <div className="flex justify-between items-center mb-2">
                    <label className={`font-semibold text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Meta Diária (minutos)</label>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${dm ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{dailyGoal} min</span>
                </div>
                <input type="range" min="5" max="60" step="5" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full h-2 mt-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-indigo-300 to-indigo-500 accent-indigo-600" />
                <div className="flex justify-between text-[10px] mt-1 text-gray-400">
                    <span>5 min</span><span>60 min</span>
                </div>
            </div>

            {/* 2. Notificações */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Notificações e Lembretes</h4>

                <div className="space-y-3">
                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">📊</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Diário de Humor</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.moodReminder && <input type="time" value={reminderSettings.moodTime} onChange={(e) => setReminderSettings({ ...reminderSettings, moodTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.moodReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, moodReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🌬️</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Respiração Diária</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.breathingReminder && <input type="time" value={reminderSettings.breathingTime} onChange={(e) => setReminderSettings({ ...reminderSettings, breathingTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.breathingReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, breathingReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">📓</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Registro no Diário</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.diaryReminder && <input type="time" value={reminderSettings.diaryTime} onChange={(e) => setReminderSettings({ ...reminderSettings, diaryTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.diaryReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, diaryReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">💬</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Eu Mais Saudável</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.healthySelfReminder && <input type="time" value={reminderSettings.healthySelfTime} onChange={(e) => setReminderSettings({ ...reminderSettings, healthySelfTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.healthySelfReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, healthySelfReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🧘</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Meditação</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.meditationReminder && <input type="time" value={reminderSettings.meditationTime} onChange={(e) => setReminderSettings({ ...reminderSettings, meditationTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.meditationReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, meditationReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🙏</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Gratidão</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.gratitudeReminder && <input type="time" value={reminderSettings.gratitudeTime} onChange={(e) => setReminderSettings({ ...reminderSettings, gratitudeTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.gratitudeReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, gratitudeReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🌙</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Sono</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.sleepReminder && <input type="time" value={reminderSettings.sleepTime} onChange={(e) => setReminderSettings({ ...reminderSettings, sleepTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.sleepReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, sleepReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🎯</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Missões</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.missionsReminder && <input type="time" value={reminderSettings.missionsTime} onChange={(e) => setReminderSettings({ ...reminderSettings, missionsTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.missionsReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, missionsReminder: val })} />
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-2xl border ${dm ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3"><span className="text-lg">🌿</span><span className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Microtarefas</span></div>
                        <div className="flex items-center gap-2">
                            {reminderSettings.microtasksReminder && <input type="time" value={reminderSettings.microtasksTime} onChange={(e) => setReminderSettings({ ...reminderSettings, microtasksTime: e.target.value })} className={`text-xs px-2 py-1 rounded bg-transparent border outline-none ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />}
                            <ToggleSwitch checked={reminderSettings.microtasksReminder} onChange={(val) => setReminderSettings({ ...reminderSettings, microtasksReminder: val })} />
                        </div>
                    </div>

                    {/* Do Not Disturb Toggle */}
                    <div className={`mt-4 pt-4 border-t flex items-center justify-between ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div>
                            <p className={`text-sm font-bold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Pausar Lembretes</p>
                            <p className={`text-[10px] ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Não enviar notificações temporariamente</p>
                        </div>
                        <ToggleSwitch checked={reminderSettings.doNotDisturb} onChange={(val) => setReminderSettings({ ...reminderSettings, doNotDisturb: val })} />
                    </div>
                </div>
            </div>

            {/* 2.5 Conquistas e Lembretes */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Conquistas e Lembretes</h4>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className={`p-3 rounded-2xl text-center ${dm ? 'bg-slate-800/60' : 'bg-gray-50'}`}>
                        <p className="text-xl font-black">{userProgress.badgesEarned?.length || 0}</p>
                        <p className={`text-[10px] uppercase font-bold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Badges</p>
                    </div>
                    <div className={`p-3 rounded-2xl text-center ${dm ? 'bg-slate-800/60' : 'bg-gray-50'}`}>
                        <p className="text-xl font-black">{userProgress.streak || 0}</p>
                        <p className={`text-[10px] uppercase font-bold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Sequência</p>
                    </div>
                    <div className={`p-3 rounded-2xl text-center ${dm ? 'bg-slate-800/60' : 'bg-gray-50'}`}>
                        <p className="text-xl font-black">{userProgress.totalMinutes || 0}</p>
                        <p className={`text-[10px] uppercase font-bold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Minutos</p>
                    </div>
                </div>
                <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Todas as configurações de lembretes ficam nesta tela de perfil.</p>
            </div>

            {/* 3. Privacidade e Segurança */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Privacidade e Segurança</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Bloqueio do App por PIN</p>
                            <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Proteger abertura do aplicativo</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {privacySettings.appLockEnabled && (
                                <input type="password" maxLength={4} placeholder="1234" value={privacySettings.appLockPin} onChange={(e) => setPrivacySettings({ ...privacySettings, appLockPin: e.target.value })} className={`w-16 text-center text-sm px-2 py-1 rounded-lg bg-transparent border outline-none font-mono tracking-widest ${dm ? 'border-slate-600 text-gray-300 focus:border-indigo-400' : 'border-gray-300 text-gray-700 focus:border-indigo-500'}`} />
                            )}
                            <ToggleSwitch checked={privacySettings.appLockEnabled} onChange={(val) => setPrivacySettings({ ...privacySettings, appLockEnabled: val })} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium pr-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Modo Discreto</p>
                            <p className={`text-[10px] mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Oculta o conteúdo na tela de recentes (multitarefa) do seu celular.</p>
                        </div>
                        <ToggleSwitch checked={privacySettings.discreetMode} onChange={(val) => setPrivacySettings({ ...privacySettings, discreetMode: val })} />
                    </div>
                </div>
            </div>

            {/* 4. Personalização Visual */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Personalização e Acessibilidade</h4>

                <div className="flex justify-between items-center mb-5">
                    <label className={`font-semibold text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Modo de Exibição</label>
                    <button onClick={onToggleTheme} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${dm ? 'bg-slate-700 text-amber-300 hover:bg-slate-600' : 'bg-gray-100 text-indigo-700 hover:bg-gray-200'}`}>
                        {dm ? '☀️ Claro' : '🌙 Escuro'}
                    </button>
                </div>

                <div className="mb-5">
                    <label className={`block font-semibold text-sm mb-3 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Tamanho da Fonte Textual</label>
                    <div className="flex gap-2 flex-wrap">
                        {['small', 'medium', 'large', 'extra-large'].map(size => (
                            <button key={size} onClick={() => setVisualSettings({ ...visualSettings, fontSize: size })} className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs font-bold transition-all border ${visualSettings.fontSize === size ? (dm ? 'bg-indigo-900/50 border-indigo-500 text-indigo-300' : 'bg-indigo-100 border-indigo-500 text-indigo-700') : (dm ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500')}`}>
                                {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : size === 'large' ? 'Grande' : 'Giga'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-2">
                    <label className={`block font-semibold text-sm mb-3 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Estilo da Fonte (Tipografia)</label>
                    <div className="flex gap-2">
                        {[
                            { id: 'sans', label: 'Padrão', icon: 'Ab' },
                            { id: 'serif', label: 'Elegante', icon: 'Ab' },
                            { id: 'dyslexic', label: 'Acessível', icon: 'Ab' }
                        ].map(family => (
                            <button
                                key={family.id}
                                onClick={() => setVisualSettings({ ...visualSettings, fontFamily: family.id })}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${visualSettings.fontFamily === family.id ? (dm ? 'bg-indigo-900/50 border-indigo-500 text-indigo-300' : 'bg-indigo-100 border-indigo-500 text-indigo-700') : (dm ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500')}`}
                                style={{ fontFamily: family.id === 'sans' ? 'sans-serif' : family.id === 'serif' ? 'serif' : 'Arial' }}
                            >
                                <span className="text-sm">{family.icon}</span>
                                {family.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 5. Áudio e Imersão */}
            <div className={`rounded-3xl p-6 mb-4 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h4 className={`font-bold text-sm mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Áudio e Imersão</h4>

                <div className="mb-5">
                    <label className={`block font-semibold text-sm mb-3 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Voz Padrão de Narração</label>
                    <div className="flex gap-2">
                        {[
                            { id: 'feminino', label: 'Feminina', icon: '👩' },
                            { id: 'masculino', label: 'Masculina', icon: '👨' },
                            { id: 'nenhuma', label: 'Silêncio', icon: '🔇' }
                        ].map(voice => (
                            <button key={voice.id} onClick={() => setDefaultVoice(voice.id as any)} className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl font-bold transition-all text-xs border ${defaultVoice === voice.id ? (dm ? 'bg-purple-900/40 border-purple-500 text-purple-300' : 'bg-purple-100 border-purple-500 text-purple-700') : (dm ? 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100')}`}>
                                <span className="text-base">{voice.icon}</span> {voice.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1"><span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Música de Fundo</span><span className={`text-[10px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{audioSettings.musicVolume}%</span></div>
                        <input type="range" min="0" max="100" value={audioSettings.musicVolume} onChange={(e) => setAudioSettings({ ...audioSettings, musicVolume: Number(e.target.value) })} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-300 to-indigo-400 accent-indigo-500" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1"><span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Volume da Voz</span><span className={`text-[10px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{audioSettings.voiceVolume}%</span></div>
                        <input type="range" min="0" max="100" value={audioSettings.voiceVolume} onChange={(e) => setAudioSettings({ ...audioSettings, voiceVolume: Number(e.target.value) })} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-purple-300 to-pink-400 accent-pink-500" />
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t flex items-center justify-between border-gray-100 dark:border-gray-700">
                    <p className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Vibrações do Aplicativo (Haptics)</p>
                    <ToggleSwitch checked={audioSettings.hapticsEnabled} onChange={(val) => setAudioSettings({ ...audioSettings, hapticsEnabled: val })} />
                </div>
            </div>

            {/* 6. Controle de Ansiedade */}
            <div className={`rounded-3xl p-6 mb-8 border shadow-sm backdrop-blur-sm ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-100'}`}>
                <h4 className={`font-bold text-sm mb-4 flex items-center gap-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>❤️ Tranquilidade</h4>
                <div className="flex items-center justify-between">
                    <div className="pr-4">
                        <p className={`text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Ocultar Sequência de Dias</p>
                        <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Se você não gosta da pressão de contar dias consecutivos, ative isso.</p>
                    </div>
                    <ToggleSwitch checked={wellbeingSettings.hideStreaks} onChange={(val) => setWellbeingSettings({ ...wellbeingSettings, hideStreaks: val })} />
                </div>
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
                    <div className={`p-4 rounded-2xl animate-fade-in border ${dm ? 'bg-red-900/40 border-red-700' : 'bg-white border-red-200 shadow-md'}`}>
                        <p className={`text-sm font-bold mb-3 text-center ${dm ? 'text-red-300' : 'text-red-600'}`}>Tem certeza absoluta?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearData}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm active:scale-95"
                            >
                                Sim, Apagar
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors active:scale-95 ${dm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
                <button onClick={() => setShowExportModal(true)}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm hover:shadow-md ${dm ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                    <span className="text-xl">📤</span> Exportar Meus Dados
                </button>

                <button onClick={onLogout}
                    className="w-full py-4 rounded-2xl font-bold text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
                >
                    <span className="text-xl">🚪</span> Sair da Conta
                </button>
            </div>

            <p className="text-center text-[10px] text-gray-400/60 mt-8 mb-4">Sereno App v1.2.0 • Feito com cuidado.</p>
        </div>
    );
}
