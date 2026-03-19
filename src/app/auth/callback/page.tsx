'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith('/')) return '/';
  if (value.startsWith('/auth/callback')) return '/';
  return value;
}

export default function AuthCallbackPage() {
  const [errorMessage, setErrorMessage] = useState('');

  const callbackState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { code: null as string | null, next: '/' };
    }

    const url = new URL(window.location.href);
    return {
      code: url.searchParams.get('code'),
      next: sanitizeNextPath(url.searchParams.get('next')),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const waitForSession = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          return data.session;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }

      return null;
    };

    const finalizeLogin = async () => {
      console.info('[sereno-auth] callback:start', {
        hasCode: Boolean(callbackState.code),
        next: callbackState.next,
      });

      if (!callbackState.code) {
        window.location.replace(callbackState.next);
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(callbackState.code);

      if (cancelled) return;

      if (error) {
        console.error('[sereno-auth] callback:exchange-error', error.message);
        setErrorMessage(error.message || 'Nao foi possivel concluir o login com Google.');
        return;
      }

      console.info('[sereno-auth] callback:exchange-ok', {
        hasSession: Boolean(data.session?.user),
      });

      const session = data.session?.user ? data.session : await waitForSession();

      if (!session?.user) {
        console.error('[sereno-auth] callback:missing-session-after-exchange');
        setErrorMessage('O login com Google voltou, mas a sessao nao ficou disponivel no navegador.');
        return;
      }

      console.info('[sereno-auth] callback:redirect', {
        userId: session.user.id,
        next: callbackState.next,
      });
      window.location.replace(callbackState.next);
    };

    finalizeLogin().catch((error) => {
      if (cancelled) return;
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel concluir o login com Google.');
    });

    return () => {
      cancelled = true;
    };
  }, [callbackState]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fbff_0%,#eef2ff_42%,#f8fafc_100%)] px-6 text-slate-900">
      <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_30px_90px_rgba(79,70,229,0.12)] backdrop-blur-xl">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-600">Sereno</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">Concluindo seu login</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {errorMessage || 'Estamos validando sua conta Google e te levando de volta para o app.'}
        </p>
      </div>
    </main>
  );
}
