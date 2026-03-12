'use client';

interface UserProgress {
    meditationsCompleted: number;
    breathingCompleted: number;
    yogaCompleted: number;
    totalMinutes: number;
    streak: number;
    lastActiveDate: string;
    badgesEarned: string[];
}

interface BadgesSectionProps {
    userProgress: UserProgress;
    darkMode: boolean;
}

const allBadges = [
    { id: 'first_meditation', name: 'Primeira Meditação', emoji: '🧘', desc: 'Completou sua primeira meditação', condition: (p: UserProgress) => p.meditationsCompleted >= 1 },
    { id: 'first_breathing', name: 'Primeira Respiração', emoji: '🌬️', desc: 'Completou seu primeiro exercício de respiração', condition: (p: UserProgress) => p.breathingCompleted >= 1 },
    { id: 'first_yoga', name: 'Primeiro Yoga Nidra', emoji: '🌙', desc: 'Completou sua primeira sessão de Yoga Nidra', condition: (p: UserProgress) => p.yogaCompleted >= 1 },
    { id: 'med_5', name: 'Meditador(a)', emoji: '🏅', desc: 'Completou 5 meditações', condition: (p: UserProgress) => p.meditationsCompleted >= 5 },
    { id: 'med_10', name: 'Mente Serena', emoji: '☮️', desc: 'Completou 10 meditações', condition: (p: UserProgress) => p.meditationsCompleted >= 10 },
    { id: 'med_25', name: 'Mestre Zen', emoji: '🕉️', desc: 'Completou 25 meditações', condition: (p: UserProgress) => p.meditationsCompleted >= 25 },
    { id: 'breath_5', name: 'Respiração Consciente', emoji: '💨', desc: 'Completou 5 exercícios de respiração', condition: (p: UserProgress) => p.breathingCompleted >= 5 },
    { id: 'breath_10', name: 'Pulmões de Aço', emoji: '🫁', desc: 'Completou 10 exercícios de respiração', condition: (p: UserProgress) => p.breathingCompleted >= 10 },
    { id: 'yoga_5', name: 'Sono Tranquilo', emoji: '😴', desc: 'Completou 5 sessões de Yoga Nidra', condition: (p: UserProgress) => p.yogaCompleted >= 5 },
    { id: 'total_10', name: 'Iniciante Dedicado', emoji: '⭐', desc: 'Completou 10 atividades no total', condition: (p: UserProgress) => p.meditationsCompleted + p.breathingCompleted + p.yogaCompleted >= 10 },
    { id: 'total_25', name: 'Guerreiro(a) Mental', emoji: '🛡️', desc: 'Completou 25 atividades no total', condition: (p: UserProgress) => p.meditationsCompleted + p.breathingCompleted + p.yogaCompleted >= 25 },
    { id: 'total_50', name: 'Lenda Viva', emoji: '👑', desc: 'Completou 50 atividades no total', condition: (p: UserProgress) => p.meditationsCompleted + p.breathingCompleted + p.yogaCompleted >= 50 },
    { id: 'all_types', name: 'Explorador(a)', emoji: '🗺️', desc: 'Experimentou meditação, respiração e Yoga Nidra', condition: (p: UserProgress) => p.meditationsCompleted >= 1 && p.breathingCompleted >= 1 && p.yogaCompleted >= 1 },
    { id: 'total_100', name: 'Iluminado(a)', emoji: '🌟', desc: '100 atividades! Você é incrível!', condition: (p: UserProgress) => p.meditationsCompleted + p.breathingCompleted + p.yogaCompleted >= 100 },
];

export default function BadgesSection({ userProgress, darkMode: dm }: BadgesSectionProps) {
    const c = (l: string, d: string) => dm ? d : l;
    const earned = allBadges.filter(b => b.condition(userProgress));
    const locked = allBadges.filter(b => !b.condition(userProgress));
    const totalActivities = userProgress.meditationsCompleted + userProgress.breathingCompleted + userProgress.yogaCompleted;

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <div className="text-center mb-8 pt-4">
                <span className="text-6xl block mb-4 filter drop-shadow-md">🏆</span>
                <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Conquistas</h2>
                <p className={`mt-2 font-medium ${c('text-gray-600', 'text-slate-400')}`}>{earned.length}/{allBadges.length} conquistadas</p>
            </div>

            {/* Stats */}
            <div className={`rounded-3xl p-6 mb-8 border shadow-sm backdrop-blur-sm relative overflow-hidden ${c('bg-gradient-to-br from-purple-100 to-blue-100 border-purple-200/50', 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-800/30')}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                    <div className="flex flex-col items-center">
                        <p className={`text-2xl font-extrabold drop-shadow-sm ${c('text-gray-900', 'text-slate-100')}`} suppressHydrationWarning>{totalActivities}</p>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase mt-1 ${c('text-gray-500', 'text-slate-400')}`}>Total</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className={`text-2xl font-extrabold drop-shadow-sm ${c('text-purple-700', 'text-purple-400')}`} suppressHydrationWarning>{userProgress.meditationsCompleted}</p>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase mt-1 ${c('text-purple-600/70', 'text-purple-400/70')}`}>Meditações</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className={`text-2xl font-extrabold drop-shadow-sm ${c('text-blue-700', 'text-blue-400')}`} suppressHydrationWarning>{userProgress.breathingCompleted}</p>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase mt-1 ${c('text-blue-600/70', 'text-blue-400/70')}`}>Respiração</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className={`text-2xl font-extrabold drop-shadow-sm ${c('text-indigo-700', 'text-indigo-400')}`} suppressHydrationWarning>{userProgress.yogaCompleted}</p>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase mt-1 ${c('text-indigo-600/70', 'text-indigo-400/70')}`}>Yoga</p>
                    </div>
                </div>
            </div>

            {/* Earned */}
            {earned.length > 0 && (
                <div className="mb-8">
                    <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${c('text-green-700', 'text-green-400')}`}>
                        <span className="text-xl">✅</span> Conquistadas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {earned.map(badge => (
                            <div key={badge.id} className={`rounded-3xl p-5 text-center transition-all hover:scale-[1.02] cursor-default border shadow-sm ${c('bg-green-50/80 border-green-200 shadow-green-100/50', 'bg-green-900/20 border-green-800/50')}`}>
                                <span className="text-5xl block mb-3 filter drop-shadow-md">{badge.emoji}</span>
                                <p className={`font-extrabold text-sm mb-1 ${c('text-green-800', 'text-green-300')}`}>{badge.name}</p>
                                <p className={`text-xs font-medium leading-relaxed ${c('text-green-600', 'text-green-400/80')}`}>{badge.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
                <div>
                    <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${c('text-gray-500', 'text-gray-400')}`}>
                        <span className="text-xl">🔒</span> A conquistar
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {locked.map(badge => (
                            <div key={badge.id} className={`rounded-3xl p-5 text-center opacity-70 transition-all border ${c('bg-gray-100/50 border-gray-200', 'bg-slate-800/50 border-slate-700')}`}>
                                <span className="text-4xl block mb-3 filter grayscale opacity-50">🔒</span>
                                <p className={`font-bold text-sm mb-1 ${c('text-gray-600', 'text-slate-400')}`}>{badge.name}</p>
                                <p className={`text-xs font-medium leading-relaxed ${c('text-gray-500', 'text-slate-500')}`}>{badge.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
