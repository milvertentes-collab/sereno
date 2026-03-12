'use client';

import { useState } from 'react';

interface UserAccount {
    name: string;
    email: string;
    avatar: string;
}

interface LoginScreenProps {
    onLogin: (account: UserAccount) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!email || !password) {
            setError('Preencha todos os campos');
            return;
        }
        if (mode === 'register' && !name) {
            setError('Preencha seu nome');
            return;
        }
        // Save to localStorage as simple auth
        const account: UserAccount = {
            name: mode === 'register' ? name : email.split('@')[0],
            email,
            avatar: '😊',
        };

        if (mode === 'register') {
            localStorage.setItem(`user_${email}`, JSON.stringify({ ...account, password }));
        } else {
            const saved = localStorage.getItem(`user_${email}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.password !== password) {
                    setError('Senha incorreta');
                    return;
                }
                account.name = parsed.name;
                account.avatar = parsed.avatar;
            }
        }

        onLogin(account);
    };

    const handleGoogleLogin = () => {
        // Simulated Google login
        const account: UserAccount = {
            name: 'Usuário Google',
            email: 'user@gmail.com',
            avatar: '👤'
        };
        onLogin(account);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <span className="text-4xl">🧠</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Sereno
                </h1>
                <p className="text-gray-500 mt-1">Cuidando da sua saúde mental</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => { setMode('register'); setError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                    >
                        Cadastrar
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-3">
                    {mode === 'register' && (
                        <input
                            type="text"
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm"
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
                )}

                <button
                    onClick={handleSubmit}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                    {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">ou continue com</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google Login */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                    </svg>
                    Entrar com Google
                </button>
            </div>

            <p className="text-gray-400 text-xs mt-6 text-center">
                Seus dados ficam salvos apenas neste dispositivo
            </p>
        </div>
    );
}
