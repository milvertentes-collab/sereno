'use client';

import { useState, useEffect, useMemo } from 'react';

interface MicroTask {
    id: string;
    text: string;
    icon: string;
    completed: boolean;
    linkedTab?: string;
}

interface MicroTasksSectionProps {
    darkMode?: boolean;
    onNavigate?: (tab: any, params?: Record<string, any>) => void;
}

const INITIAL_TASKS: MicroTask[] = [
    { id: 'water', text: 'Beba um copo de água', icon: '💧' , completed: false },
    { id: 'breath', text: 'Faça 3 respirações profundas', icon: '🌬️', completed: false, linkedTab: 'breathing' },
    { id: 'face', text: 'Lave o rosto com água fresca', icon: '🚿', completed: false },
    { id: 'bed', text: 'Arrume sua cama', icon: '🛏️', completed: false },
    { id: 'music', text: 'Ouça uma música relaxante', icon: '🎵', completed: false, linkedTab: 'mixer' },
    { id: 'gratitude', text: 'Liste 3 coisas pelas quais é grato', icon: '🙏', completed: false, linkedTab: 'gratitude' },
    { id: 'phone', text: 'Desconecte do celular por 5 min', icon: '📱', completed: false },
    { id: 'stretch', text: 'Faça um pequeno alongamento', icon: '🙆', completed: false },
    { id: 'window', text: 'Olhe pela janela por um minuto', icon: '🪟', completed: false },
    { id: 'sun', text: 'Sinta o sol (ou a luz natural) por um momento', icon: '☀️', completed: false },
];

const DYNAMIC_POOL: Array<{ id: string; text: string; icon: string; linkedTab?: string }> = [
    { id: 'dyn-1', text: 'Escreva 1 frase no diário', icon: '📓', linkedTab: 'diary' },
    { id: 'dyn-2', text: 'Faça 1 técnica de grounding', icon: '🆘', linkedTab: 'sos' },
    { id: 'dyn-3', text: 'Registre seu humor agora', icon: '📊', linkedTab: 'mood' },
    { id: 'dyn-4', text: 'Faça uma microtarefa de 5 min', icon: '🌿', linkedTab: 'microtasks' },
    { id: 'dyn-5', text: 'Respire por 1 minuto em silêncio', icon: '🫁', linkedTab: 'breathing' },
    { id: 'dyn-6', text: 'Faça 1 gesto de autocuidado gentil', icon: '💜' },
];

const ESSENTIAL_TASK_IDS = ['water', 'breath', 'face', 'window'];

const localDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function MicroTasksSection({ darkMode: dm, onNavigate }: MicroTasksSectionProps) {
    const [tasks, setTasks] = useState<MicroTask[]>([]);
    const [isDifficultDay, setIsDifficultDay] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [lastCompleted, setLastCompleted] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('sereno_micro_tasks_v2');
        const savedMode = localStorage.getItem('sereno_difficult_day');
        const savedDate = localStorage.getItem('sereno_micro_tasks_date');

        const today = localDateKey();
        const daySeed = today.split('-').join('').split('').reduce((s, n) => s + Number(n), 0);
        const dyn = DYNAMIC_POOL[daySeed % DYNAMIC_POOL.length];

        const buildDaily = () => {
            const base = INITIAL_TASKS.map(t => ({ ...t, completed: false }));
            base.unshift({ id: dyn.id, text: `Tarefa do dia: ${dyn.text}`, icon: dyn.icon, linkedTab: dyn.linkedTab, completed: false });
            return base;
        };

        if (saved && savedDate === today) {
            setTasks(JSON.parse(saved));
        } else {
            const daily = buildDaily();
            setTasks(daily);
            localStorage.setItem('sereno_micro_tasks_v2', JSON.stringify(daily));
            localStorage.setItem('sereno_micro_tasks_date', today);
        }

        if (savedMode) setIsDifficultDay(JSON.parse(savedMode));
    }, []);

    useEffect(() => {
        if (tasks.length > 0) {
            localStorage.setItem('sereno_micro_tasks_v2', JSON.stringify(tasks));
            localStorage.setItem('sereno_micro_tasks_date', localDateKey());
        }
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('sereno_difficult_day', JSON.stringify(isDifficultDay));
    }, [isDifficultDay]);

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                if (!t.completed) {
                    setLastCompleted(t.text);
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 2200);
                }
                return { ...t, completed: !t.completed };
            }
            return t;
        }));
    };

    const toggleDifficultDay = () => setIsDifficultDay(prev => !prev);

    const resetTasks = () => {
        setTasks(prev => prev.map(t => ({ ...t, completed: false })));
    };

    const markMinimumDone = () => {
        setTasks(prev => prev.map(t => ESSENTIAL_TASK_IDS.includes(t.id) ? { ...t, completed: true } : t));
        setLastCompleted('Mínimo de hoje concluído');
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2200);
    };

    const c = (base: string, dark: string) => dm ? dark : base;
    const essentialTasks = tasks.filter(t => ESSENTIAL_TASK_IDS.includes(t.id));
    const visibleTasks = isDifficultDay ? (essentialTasks.length > 0 ? essentialTasks : tasks.slice(0, 4)) : tasks;

    const doneCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const dayPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

    const difficultDone = useMemo(() => {
        const essentials = tasks.filter(t => ESSENTIAL_TASK_IDS.includes(t.id));
        if (!essentials.length) return 0;
        return essentials.filter(t => t.completed).length;
    }, [tasks]);

    return (
        <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
            <div className="text-center mb-6 pt-4">
                <span className="text-5xl block mb-4 filter drop-shadow-md">🌿</span>
                <h2 className={`text-3xl font-extrabold tracking-tight ${c('text-gray-900', 'text-slate-100')}`}>Pequenas Vitórias</h2>
                <p className={`mt-2 font-medium ${c('text-gray-600', 'text-slate-400')}`}>Um passo de cada vez importa.</p>
            </div>

            <div className={`rounded-3xl p-4 mb-6 border ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="flex justify-between items-center">
                    <p className="text-sm font-bold">Progresso de hoje</p>
                    <p className="text-sm font-black">{doneCount}/{totalCount}</p>
                </div>
                <div className={`h-2 rounded-full mt-2 ${c('bg-slate-100', 'bg-slate-700')}`}>
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${dayPct}%` }} />
                </div>
                <p className={`text-[11px] mt-1 ${c('text-slate-600', 'text-slate-300')}`}>Hoje: {dayPct}% concluído</p>
            </div>

            <div className={`rounded-3xl p-6 mb-6 border transition-all ${isDifficultDay ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : c('bg-white border-gray-100', 'bg-slate-800/80 border-slate-700')}`}>
                <div className="flex items-center justify-between" role="group" aria-label="Alternar modo dia difícil">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{isDifficultDay ? '⛈️' : '🌤️'}</span>
                        <div>
                            <h3 className="font-bold">Modo "Dia Difícil"</h3>
                            <p className="text-xs opacity-70">Simplifica para focar no essencial.</p>
                        </div>
                    </div>
                    <button type="button" onClick={toggleDifficultDay} className={`w-20 h-9 rounded-full relative transition-all duration-300 font-black text-[10px] tracking-wider uppercase ${isDifficultDay ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200'}`} aria-pressed={isDifficultDay}>
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">{isDifficultDay ? 'ON' : 'OFF'}</span>
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${isDifficultDay ? 'left-12' : 'left-1'}`} />
                    </button>
                </div>
                {isDifficultDay && (
                    <div className="mt-3 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-extrabold text-red-700 dark:text-red-300 uppercase tracking-wider">Modo Dia Difícil ATIVO</p>
                        <p className="text-xs font-medium mt-1 opacity-90">Essenciais concluídas: {difficultDone}/{ESSENTIAL_TASK_IDS.length}</p>
                        <button onClick={markMinimumDone} className="mt-2 w-full py-2 rounded-xl bg-red-600 text-white text-xs font-black">Fiz o mínimo de hoje ✅</button>
                    </div>
                )}
            </div>

            <div className={`space-y-4 mb-8 ${isDifficultDay ? 'ring-2 ring-red-400/60 rounded-3xl p-2' : ''}`}>
                {visibleTasks.map((task, index) => (
                    <div key={task.id} className={`w-full p-5 rounded-[2rem] border transition-all flex items-center gap-4 ${task.completed ? 'bg-green-50 border-green-200 opacity-70 dark:bg-green-900/10 dark:border-green-800/30' : isDifficultDay ? 'bg-white border-gray-200 py-6 dark:bg-slate-800 dark:border-slate-700 shadow-lg' : c('bg-white border-gray-100 hover:border-blue-200 shadow-sm', 'bg-slate-800/80 border-slate-700 hover:border-blue-800 shadow-sm')}`} style={{ animationDelay: `${index * 0.05}s` }}>
                        <button onClick={() => toggleTask(task.id)} className="flex items-center gap-4 flex-1 text-left">
                            <span className={`text-2xl ${task.completed ? 'grayscale' : ''}`}>{task.completed ? '✅' : task.icon}</span>
                            <span className={`font-bold ${task.completed ? 'line-through opacity-70' : ''}`}>{task.text}</span>
                        </button>
                        {task.linkedTab && (
                            <button onClick={() => onNavigate?.(task.linkedTab as any)} className={`px-3 py-2 rounded-xl text-xs font-bold ${c('bg-indigo-100 text-indigo-700', 'bg-indigo-900/30 text-indigo-300')}`}>Abrir</button>
                        )}
                    </div>
                ))}
            </div>

            {showCelebration && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-in text-center p-7 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-4 border-yellow-400">
                    <span className="text-6xl mb-3 block">🏆</span>
                    <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-1">Incrível!</h4>
                    <p className="font-bold opacity-80 italic">"{lastCompleted}"</p>
                </div>
            )}

            <div className="text-center">
                <button onClick={resetTasks} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">Reiniciar tarefas do dia</button>
            </div>
        </div>
    );
}
