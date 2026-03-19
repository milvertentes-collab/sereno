'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { buildAdminPreparedAccount, getConfiguredAdminEmails } from '@/lib/adminAccess';

interface UserAccount {
  name: string;
  email: string;
  avatar: string;
  role?: 'user' | 'admin';
  adminAccess?: boolean;
}

interface LoginScreenProps {
  onLogin: (account: UserAccount) => void;
  desktopMode?: boolean;
}

const providerButtons: Array<{
  id: 'google';
  label: string;
  tone: string;
}> = [
  { id: 'google', label: 'Entrar com Google', tone: 'bg-white/95 text-slate-800 border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.08)]' },
];

function ProviderIcon({ provider }: { provider: 'google' }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
        <path fill="#EA4335" d="M12.23 10.2v3.95h5.5c-.24 1.27-.97 2.35-2.04 3.08l3.3 2.56c1.93-1.77 3.04-4.38 3.04-7.49 0-.73-.07-1.44-.2-2.1z" />
        <path fill="#4285F4" d="M12 22c2.76 0 5.08-.91 6.77-2.48l-3.3-2.56c-.92.62-2.1 1-3.47 1-2.66 0-4.91-1.8-5.71-4.22H2.88v2.64A9.99 9.99 0 0 0 12 22z" />
        <path fill="#FBBC05" d="M6.29 13.74A5.98 5.98 0 0 1 5.97 12c0-.6.11-1.18.32-1.74V7.62H2.88A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.08 4.38z" />
        <path fill="#34A853" d="M12 6.04c1.5 0 2.84.52 3.89 1.53l2.91-2.91C17.07 3.04 14.75 2 12 2A9.99 9.99 0 0 0 2.88 7.62l3.41 2.64C7.09 7.84 9.34 6.04 12 6.04z" />
      </svg>
    );
  }
}

const localAdminEmails = getConfiguredAdminEmails();

function buildAccountFromUser(user: User): UserAccount {
  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};
  const displayName =
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    (user.email ? user.email.split('@')[0] : 'Usuário');

  return buildAdminPreparedAccount({
    name: String(displayName),
    email: user.email || '',
    avatar: String(metadata.avatar_url || metadata.picture || '👤'),
    role: (appMetadata.role || metadata.role || 'user') as 'user' | 'admin',
    adminAccess: Boolean(appMetadata.admin_access || metadata.admin_access),
  }, localAdminEmails);
}

export default function LoginScreen({ onLogin, desktopMode = false }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const premiumPoints = [
    { title: 'Respiração guiada', detail: 'protocolos para crise, foco e sono' },
    { title: 'Diário emocional', detail: 'registro com mais clareza e continuidade' },
    { title: 'Meditações', detail: 'práticas guiadas e momentos silenciosos' },
  ];
  const normalizedEmail = email.trim().toLowerCase();
  const isLocalAdminEmail = localAdminEmails.includes(normalizedEmail);

  const isRecoveryUrl = () => {
    if (typeof window === 'undefined') return false;
    return /type=recovery/i.test(window.location.search || '') || /type=recovery/i.test(window.location.hash || '');
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!mounted || !user) return;
      if (isRecoveryUrl()) {
        setMode('recovery');
        setSuccessMessage('Defina sua nova senha para concluir a recuperação da conta.');
        return;
      }
      onLogin(buildAccountFromUser(user));
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery');
        setError('');
        setSuccessMessage('Defina sua nova senha para concluir a recuperação da conta.');
        return;
      }
      if (session?.user) {
        if (isRecoveryUrl()) {
          setMode('recovery');
          return;
        }
        onLogin(buildAccountFromUser(session.user));
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [onLogin]);

  const handleSubmit = async () => {
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Preencha seu nome.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('A confirmação da senha não confere.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      if (mode === 'login' && isLocalAdminEmail) {
        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'Não foi possível autenticar o administrador local.');
        }
        onLogin(buildAdminPreparedAccount({
          name: name.trim() || sanitizedEmail.split('@')[0] || 'Administrador',
          email: sanitizedEmail,
          avatar: '👑',
          role: 'admin',
          adminAccess: true,
        }, localAdminEmails));
        return;
      }

      if (!isSupabaseConfigured) {
        setError('Supabase não está configurado.');
        return;
      }

      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              full_name: name.trim(),
            },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session?.user) {
          onLogin(buildAccountFromUser(data.session.user));
        } else if (data.user) {
          setSuccessMessage('Conta criada. Confira seu e-mail para confirmar o acesso antes de entrar.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          onLogin(buildAccountFromUser(data.user));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Não foi possível autenticar agora.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail) {
      setError('Digite seu e-mail para receber o link de redefinição.');
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Supabase não está configurado.');
      return;
    }

    setResetLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
      if (resetError) throw resetError;
      setSuccessMessage('Enviamos um link para redefinir sua senha. Confira seu e-mail.');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar o link de redefinição agora.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleRecoverySubmit = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError('Preencha e confirme a nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('A confirmação da nova senha não confere.');
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Supabase não está configurado.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setSuccessMessage('Senha redefinida com sucesso. Você já pode continuar no app.');
      setNewPassword('');
      setConfirmNewPassword('');

      if (data.user) {
        onLogin(buildAccountFromUser(data.user));
      }
    } catch (err: any) {
      setError(err?.message || 'Não foi possível redefinir a senha agora.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    if (!isSupabaseConfigured) {
      setError('Supabase não está configurado.');
      return;
    }

    setOauthLoading(provider);
    setError('');
    try {
      const redirectTo = typeof window !== 'undefined'
        ? (() => {
            const callbackUrl = new URL('/auth/callback', window.location.origin);
            const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (next && next !== '/auth/callback') {
              callbackUrl.searchParams.set('next', next);
            }
            return callbackUrl.toString();
          })()
        : undefined;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err?.message || 'Não foi possível iniciar esse login agora.');
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top_left,#bfdbfe_0%,transparent_28%),radial-gradient(circle_at_top_right,#ddd6fe_0%,transparent_24%),radial-gradient(circle_at_bottom,#99f6e4_0%,transparent_26%),linear-gradient(180deg,#f8fbff_0%,#eef2ff_42%,#f8fafc_100%)] px-5 py-8">
      <div className={`mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col justify-center ${desktopMode ? 'max-w-6xl lg:grid lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:items-center' : 'max-w-md'}`}>
        {desktopMode && (
          <div className="hidden lg:block">
            <div className="rounded-[2.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(248,250,252,0.92)_100%)] p-8 shadow-[0_30px_90px_rgba(79,70,229,0.12)] backdrop-blur-xl">
              <p className="sereno-kicker">Sereno no navegador</p>
              <h2 className="mt-3 text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-900">
                A mesma conta,
                <span className="block bg-[linear-gradient(135deg,#38bdf8_0%,#4f46e5_55%,#14b8a6_100%)] bg-clip-text text-transparent">o mesmo cuidado,</span>
                <span className="block">mais espaço na tela.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                Entre no Sereno para continuar suas práticas, registros, progresso, planos e recursos premium entre celular e desktop.
              </p>
              <div className="mt-8 grid gap-4">
                {premiumPoints.map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
                    <p className="text-sm font-black text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={desktopMode ? 'mx-auto w-full max-w-xl' : ''}>
        <div className="sereno-card-primary relative overflow-hidden rounded-[2.25rem] border-white/70 p-6 backdrop-blur-xl shadow-[0_28px_90px_rgba(79,70,229,0.12)]">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,#818cf8_0%,transparent_72%)] opacity-35" />
          <div className="absolute -right-10 top-20 h-36 w-36 rounded-full bg-[radial-gradient(circle,#38bdf8_0%,transparent_70%)] opacity-20 blur-2xl" />
          <div className="absolute -left-12 bottom-16 h-28 w-28 rounded-full bg-[radial-gradient(circle,#14b8a6_0%,transparent_72%)] opacity-20 blur-2xl" />

          <div className="relative">
            <div className="mb-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(145deg,#38bdf8_0%,#4f46e5_58%,#14b8a6_100%)] text-2xl text-white shadow-[0_18px_36px_rgba(79,70,229,0.28)]">
                  ☁
                </div>
                <div className="min-w-0">
                  <p className="sereno-kicker">Sereno</p>
                  <h1 className="text-[clamp(1.9rem,1.45rem+1.2vw,2.45rem)] font-black leading-[0.98] tracking-[-0.05em] text-violet-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
                    Seu espaço de cuidado
                  </h1>
                </div>
              </div>

              <p className="sereno-subtitle mt-1 max-w-[32rem] text-[15px]">
                Um lugar para respirar, sentir e seguir.
              </p>

            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 rounded-[2rem] border border-white/75 bg-white/72 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                <div className="space-y-1">
                  <p className="sereno-kicker">{mode === 'recovery' ? 'Recuperar acesso' : 'Acesso com e-mail'}</p>
                  <p className="text-[13px] font-medium text-slate-500">
                    {mode === 'recovery' ? 'Crie uma nova senha para voltar para sua conta.' : 'Entre com e-mail e senha ou crie sua conta.'}
                  </p>
                </div>

                {mode !== 'recovery' && (
                  <div className="grid grid-cols-2 gap-2 rounded-[1.2rem] bg-slate-100/85 p-1.5">
                  <button
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMessage('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setConfirmPassword('');
                    }}
                    className={`rounded-[1rem] py-3 text-sm font-black transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setMode('register');
                      setError('');
                      setSuccessMessage('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setConfirmPassword('');
                    }}
                    className={`rounded-[1rem] py-3 text-sm font-black transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    Criar conta
                  </button>
                  </div>
                )}

                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (mode === 'recovery') {
                      handleRecoverySubmit();
                      return;
                    }
                    handleSubmit();
                  }}
                >
                  {mode === 'recovery' ? (
                    <>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Nova senha"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          className="sereno-input w-full rounded-[1.1rem] px-4 py-3.5 pr-16 text-[15px] outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirmar nova senha"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="sereno-input w-full rounded-[1.1rem] px-4 py-3.5 text-[15px] outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                      />
                    </>
                  ) : (
                    <>
                  {mode === 'register' && (
                    <input
                      type="text"
                      placeholder="Como você quer ser chamado(a)?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="sereno-input w-full rounded-[1.1rem] px-4 py-3.5 text-[15px] outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                  )}
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="sereno-input w-full rounded-[1.1rem] px-4 py-3.5 text-[15px] outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="sereno-input w-full rounded-[1.1rem] px-4 py-3.5 pr-16 text-[15px] outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  {mode === 'register' && (
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirmar senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="sereno-input w-full rounded-[1.1rem] px-4 py-3.5 text-[15px] outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                  )}
                    </>
                  )}

                  {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 w-full rounded-[1.25rem] bg-[linear-gradient(135deg,#38bdf8_0%,#4f46e5_55%,#14b8a6_100%)] px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_36px_rgba(79,70,229,0.24)] transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? 'Carregando...' : mode === 'recovery' ? 'Salvar nova senha' : mode === 'login' ? 'Entrar e continuar' : 'Criar conta e começar'}
                  </button>

                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetLoading || loading}
                      className="text-center text-[12px] font-semibold text-indigo-700 transition hover:text-indigo-900 disabled:opacity-60"
                    >
                      {resetLoading ? 'Enviando link...' : 'Esqueci minha senha'}
                    </button>
                  )}

                  {mode === 'recovery' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError('');
                        setSuccessMessage('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                      }}
                      className="text-center text-[12px] font-semibold text-slate-500 transition hover:text-slate-700"
                    >
                      Voltar para entrar
                    </button>
                  )}
                </form>

                <p className="text-center text-[11px] leading-relaxed text-slate-400">
                  Ao continuar, sua rotina e preferências ficam salvas na sua conta.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(248,250,252,0.88)_100%)] p-4 shadow-[0_16px_38px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200/80" />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">ou continuar com</span>
                  <div className="h-px flex-1 bg-slate-200/80" />
                </div>

                <div className="space-y-3">
                  {providerButtons.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleOAuthLogin(provider.id)}
                      disabled={oauthLoading !== null}
                      className={`${provider.tone} flex w-full items-center justify-between rounded-[1.15rem] px-4 py-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60`}
                    >
                        <span className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${provider.id === 'google' ? 'bg-white' : 'bg-black/5'} text-current`}>
                          <ProviderIcon provider={provider.id} />
                        </span>
                        <span>{oauthLoading === provider.id ? 'Abrindo...' : provider.label}</span>
                      </span>
                      <span className="text-base opacity-55">→</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/75 bg-slate-950/[0.035] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
                <p className="sereno-kicker mb-3">O que segue com você</p>
                <div className="space-y-3">
                  {premiumPoints.map((item) => (
                    <div key={item.title} className="flex items-start gap-3 rounded-[1.2rem] bg-white/72 px-3.5 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                      <span className="mt-0.5 text-[15px]">✦</span>
                      <div>
                        <p className="text-[13px] font-black text-slate-800">{item.title}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
