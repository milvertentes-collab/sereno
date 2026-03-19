'use client';

import { useEffect, useMemo, useState } from 'react';
import AppNoticeModal from '@/components/AppNoticeModal';
import { PLAN_DEFINITIONS, type BillingPlanKey, type SubscriptionRecord } from '@/lib/subscriptionPlans';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { buildAdminPreparedAccount, getConfiguredAdminEmails, hasAdminAccess } from '@/lib/adminAccess';

type LifetimeResponse = {
  ok: boolean;
  config?: { enabled: boolean; startsAt: string | null; endsAt: string | null };
  state?: { isActive: boolean; hasStarted: boolean; hasEnded: boolean; msRemaining: number };
};

type PromoAccessCampaign = {
  id: string;
  title: string;
  durationDays: number;
  audience: 'all' | 'email' | 'women' | 'men';
  targetEmail?: string;
  grantedByEmail?: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

type AdminBroadcastItem = {
  id: string;
  title: string;
  body: string;
  startsAt?: string | null;
  active?: boolean;
  audience?: 'all' | 'email' | 'women' | 'men';
  targetEmail?: string;
  actionTab?: string;
  linkUrl?: string;
  sendPush?: boolean;
  pushDeliveredAt?: string | null;
};

type AdminAuditEntry = {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  targetEmail?: string;
  createdAt: string;
};

type SeatMember = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'member';
  status: 'active' | 'invited';
};

type SeatGroup = {
  id: string;
  ownerEmail: string;
  ownerName: string;
  planKey: BillingPlanKey;
  seatLimit: number;
  members: SeatMember[];
};

const grantablePlans = (Object.keys(PLAN_DEFINITIONS) as BillingPlanKey[]).filter((key) => key !== 'free');
const BRASILIA_TIMEZONE = 'America/Sao_Paulo';
const ADMIN_SELECT_OPTION_CLASS = 'bg-slate-100 text-slate-950';

function formatAdminCountdown(msRemaining: number) {
  if (!msRemaining || msRemaining <= 0) return 'Encerrado';
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

function isoToLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRASILIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date).replace(' ', 'T');
}

function localInputToIso(value: string) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) + 3, Number(minute)));
  if (Number.isNaN(utcDate.getTime())) return null;
  return utcDate.toISOString();
}

function formatBrasiliaDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const appDestinations = [
  { value: '', label: 'Sem abrir tela' },
  { value: 'home', label: 'Início' },
  { value: 'mood', label: 'Diário de Humor' },
  { value: 'diary', label: 'Diário' },
  { value: 'breathing', label: 'Respiração' },
  { value: 'sos', label: 'SOS' },
  { value: 'habits', label: 'Hábitos' },
  { value: 'microtasks', label: 'Microtarefas' },
  { value: 'missions', label: 'Missões' },
  { value: 'artemotion', label: 'Modo Arte' },
  { value: 'destravar', label: 'Destravar' },
  { value: 'mapavida', label: 'Mapa da Minha Vida' },
  { value: 'tracks', label: 'Trilhas' },
  { value: 'emocional', label: 'Inteligência Emocional' },
  { value: 'psychoedu', label: 'Psicoeducação' },
  { value: 'dictionary', label: 'Dicionário Emocional' },
  { value: 'healthymessages', label: 'Mensagens do Eu Saudável' },
  { value: 'therapycalendar', label: 'Calendário Terapêutico' },
  { value: 'login', label: 'Perfil' },
  { value: 'stats', label: 'Estatísticas' },
  { value: 'practices', label: 'Práticas' },
];

export default function SerenoAdminPage() {
  const adminEmails = useMemo(() => getConfiguredAdminEmails(), []);
  const [accessChecked, setAccessChecked] = useState(false);
  const [canAccessByAccount, setCanAccessByAccount] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    tone: 'success' | 'error';
    title: string;
    message: string;
  }>({
    open: false,
    tone: 'success',
    title: '',
    message: '',
  });
  const [dangerModal, setDangerModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    action: null | { type: 'promo'; id: string } | { type: 'notice'; id: string } | { type: 'audit'; id: string } | { type: 'admin-email'; email: string };
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Excluir',
    action: null,
  });

  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerStartsAt, setOfferStartsAt] = useState('');
  const [offerEndsAt, setOfferEndsAt] = useState('');
  const [offerState, setOfferState] = useState<{ isActive: boolean; hasStarted: boolean; hasEnded: boolean; msRemaining: number }>({
    isActive: false,
    hasStarted: false,
    hasEnded: false,
    msRemaining: 0,
  });

  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notifyAudience, setNotifyAudience] = useState<'all' | 'email' | 'women' | 'men'>('all');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyActionTab, setNotifyActionTab] = useState('');
  const [notifyLinkUrl, setNotifyLinkUrl] = useState('');
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyStartsAt, setNotifyStartsAt] = useState('');
  const [notifyEditId, setNotifyEditId] = useState('');
  const [scheduledNotices, setScheduledNotices] = useState<AdminBroadcastItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantName, setGrantName] = useState('');
  const [grantPlanKey, setGrantPlanKey] = useState<BillingPlanKey>('vitalicio');
  const [grantExpiresAt, setGrantExpiresAt] = useState('');
  const [managedAdminEmails, setManagedAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [promoCampaigns, setPromoCampaigns] = useState<PromoAccessCampaign[]>([]);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDurationDays, setPromoDurationDays] = useState(7);
  const [promoAudience, setPromoAudience] = useState<'all' | 'email' | 'women' | 'men'>('all');
  const [promoTargetEmail, setPromoTargetEmail] = useState('');
  const [promoStartsAt, setPromoStartsAt] = useState('');
  const [promoEditId, setPromoEditId] = useState('');
  const [auditEntries, setAuditEntries] = useState<AdminAuditEntry[]>([]);
  const [auditQuery, setAuditQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | string>('all');
  const [auditPage, setAuditPage] = useState(1);

  const campaignStatusLabel = useMemo(() => {
    if (offerState.isActive) return `Ativa agora • ${formatAdminCountdown(offerState.msRemaining)}`;
    if (offerEnabled && !offerState.hasStarted) return 'Agendada';
    if (offerState.hasEnded) return 'Encerrada';
    return 'Desativada';
  }, [offerEnabled, offerState]);

  const subscriptionSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of subscriptions) {
      const label = PLAN_DEFINITIONS[record.planKey]?.shortLabel || record.planKey;
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, 'pt-BR'));
  }, [subscriptions]);

  const auditActionOptions = useMemo(() => {
    return Array.from(new Set(auditEntries.map((entry) => entry.action))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [auditEntries]);

  const filteredAuditEntries = useMemo(() => {
    const query = auditQuery.trim().toLowerCase();
    return auditEntries.filter((entry) => {
      const matchesAction = auditActionFilter === 'all' || entry.action === auditActionFilter;
      if (!matchesAction) return false;
      if (!query) return true;
      return [entry.summary, entry.actorEmail, entry.targetEmail, entry.action]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [auditActionFilter, auditEntries, auditQuery]);

  const auditPageSize = 8;
  const auditPageCount = Math.max(1, Math.ceil(filteredAuditEntries.length / auditPageSize));
  const pagedAuditEntries = useMemo(() => {
    const startIndex = (auditPage - 1) * auditPageSize;
    return filteredAuditEntries.slice(startIndex, startIndex + auditPageSize);
  }, [auditPage, filteredAuditEntries]);

  const openFeedback = (tone: 'success' | 'error', title: string, message: string) => {
    setFeedbackModal({ open: true, tone, title, message });
  };

  const requestDangerAction = (params: {
    title: string;
    message: string;
    confirmLabel: string;
    action: NonNullable<typeof dangerModal.action>;
  }) => {
    setDangerModal({
      open: true,
      title: params.title,
      message: params.message,
      confirmLabel: params.confirmLabel,
      action: params.action,
    });
  };

  const getAdminFetchHeaders = async (includeJson = false) => {
    const headers: Record<string, string> = {};
    if (includeJson) headers['Content-Type'] = 'application/json';

    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return headers;
  };

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          const user = data.session?.user;
          if (user) {
            const metadata = user.user_metadata || {};
            const appMetadata = user.app_metadata || {};
            const account = buildAdminPreparedAccount({
              email: user.email || '',
              role: String(appMetadata.role || metadata.role || 'user'),
              adminAccess: Boolean(appMetadata.admin_access || metadata.admin_access),
            }, adminEmails);
            const accessRes = await fetch(`/api/admin/access?email=${encodeURIComponent(String(user.email || '').trim().toLowerCase())}`, { cache: 'no-store' });
            const accessData = await accessRes.json().catch(() => ({ allowed: false }));
            setCanAccessByAccount(Boolean(accessData?.allowed) && hasAdminAccess(account, adminEmails));
            setAccessChecked(true);
            return;
          }
        }

        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem('userAccount');
          if (raw) {
            const parsed = JSON.parse(raw);
            const account = buildAdminPreparedAccount(parsed, adminEmails);
            const email = String(parsed?.email || '').trim().toLowerCase();
            const accessRes = await fetch(`/api/admin/access?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
            const accessData = await accessRes.json().catch(() => ({ allowed: false }));
            setCanAccessByAccount(Boolean(accessData?.allowed) && hasAdminAccess(account, adminEmails));
          } else {
            setCanAccessByAccount(false);
          }
        }
      } catch {
        setCanAccessByAccount(false);
      } finally {
        setAccessChecked(true);
      }
    };

    checkAdminSession().catch(() => {
      setCanAccessByAccount(false);
      setAccessChecked(true);
    });
  }, [adminEmails]);

  useEffect(() => {
    if (!accessChecked) return;
    if (canAccessByAccount) return;
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  }, [accessChecked, canAccessByAccount]);

  const loadAdminData = async () => {
    const res = await fetch('/api/admin/lifetime-offer', {
      cache: 'no-store',
      headers: await getAdminFetchHeaders(),
    });
    if (!res.ok) {
      setAuthenticated(false);
      return;
    }
    const data: LifetimeResponse = await res.json();
    setAuthenticated(true);
    const isLifetimeEnabled = Boolean(data.config?.enabled);
    setOfferEnabled(isLifetimeEnabled);
    setOfferStartsAt(isLifetimeEnabled ? isoToLocalInput(data.config?.startsAt) : '');
    setOfferEndsAt(isLifetimeEnabled ? isoToLocalInput(data.config?.endsAt) : '');
    setOfferState({
      isActive: Boolean(data.state?.isActive),
      hasStarted: Boolean(data.state?.hasStarted),
      hasEnded: Boolean(data.state?.hasEnded),
      msRemaining: Number(data.state?.msRemaining || 0),
    });

    const subscriptionsRes = await fetch('/api/admin/subscriptions', {
      cache: 'no-store',
      headers: await getAdminFetchHeaders(),
    });
    if (subscriptionsRes.ok) {
      const subscriptionsData = await subscriptionsRes.json().catch(() => ({ records: [] }));
      setSubscriptions(Array.isArray(subscriptionsData?.records) ? subscriptionsData.records : []);
    }

    const settingsRes = await fetch('/api/admin/settings', {
      cache: 'no-store',
      headers: await getAdminFetchHeaders(),
    });
    if (settingsRes.ok) {
      const settingsData = await settingsRes.json().catch(() => ({ adminEmails: [] }));
      setManagedAdminEmails(Array.isArray(settingsData?.adminEmails) ? settingsData.adminEmails : []);
    }

    const promoRes = await fetch('/api/admin/promo-access', {
      cache: 'no-store',
      headers: await getAdminFetchHeaders(),
    });
    if (promoRes.ok) {
      const promoData = await promoRes.json().catch(() => ({ campaigns: [] }));
      setPromoCampaigns(Array.isArray(promoData?.campaigns) ? promoData.campaigns : []);
    }

    const noticesRes = await fetch('/api/admin/notify', {
      cache: 'no-store',
      headers: await getAdminFetchHeaders(),
    });
    if (noticesRes.ok) {
      const noticesData = await noticesRes.json().catch(() => ({ items: [] }));
      setScheduledNotices(Array.isArray(noticesData?.items) ? noticesData.items : []);
    }

    const auditRes = await fetch('/api/admin/audit', {
      cache: 'no-store',
      headers: await getAdminFetchHeaders(),
    });
    if (auditRes.ok) {
      const auditData = await auditRes.json().catch(() => ({ items: [] }));
      setAuditEntries(Array.isArray(auditData?.items) ? auditData.items : []);
    }

  };

  useEffect(() => {
    if (!accessChecked || !canAccessByAccount) return;
    loadAdminData().catch(() => undefined);
  }, [accessChecked, canAccessByAccount]);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => {
      loadAdminData().catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [authenticated]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditActionFilter, auditQuery]);

  const handleLogin = async () => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.error || 'Senha inválida.';
        setAuthError(message);
        openFeedback('error', 'Falha no acesso ao painel', message);
        return;
      }
      setPassword('');
      await loadAdminData();
      openFeedback('success', 'Painel liberado', 'O acesso ao painel admin foi liberado com sucesso.');
    } catch (error: any) {
      const message = error?.message || 'Não foi possível autenticar no painel admin.';
      setAuthError(message);
      openFeedback('error', 'Falha no acesso ao painel', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE', headers: await getAdminFetchHeaders() });
    setAuthenticated(false);
  };

  const saveLifetimeOffer = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/lifetime-offer', {
        method: 'POST',
        headers: await getAdminFetchHeaders(true),
        body: JSON.stringify({
          enabled: offerEnabled,
          startsAt: offerEnabled ? localInputToIso(offerStartsAt) : null,
          endsAt: offerEnabled ? localInputToIso(offerEndsAt) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao salvar campanha vitalícia', data?.error || 'Não foi possível salvar a campanha.');
        return;
      }
      const message = data?.broadcastAdded
        ? data?.pushError
          ? `Campanha do vitalício atualizada. Aviso salvo no app, mas o push falhou: ${data.pushError}`
          : `Campanha do vitalício atualizada. Aviso salvo no app e push entregue para ${data?.pushResult?.sent || 0} dispositivo(s).`
        : 'Campanha do vitalício atualizada com sucesso.';
      openFeedback('success', 'Campanha vitalícia salva', message);
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao salvar campanha vitalícia', error?.message || 'Não foi possível salvar a campanha.');
    } finally {
      setLoading(false);
    }
  };

  const sendNotice = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: await getAdminFetchHeaders(true),
        body: JSON.stringify({
          id: notifyEditId || undefined,
          title: notifyTitle,
          body: notifyBody,
          audience: notifyAudience,
          targetEmail: notifyAudience === 'email' ? notifyEmail : undefined,
          actionTab: notifyActionTab || undefined,
          linkUrl: notifyLinkUrl || undefined,
          sendPush: notifyPush,
          startsAt: notifyStartsAt ? localInputToIso(notifyStartsAt) : null,
          active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao enviar aviso', data?.error || 'Não foi possível enviar o aviso.');
        return;
      }
      openFeedback(
        'success',
        notifyEditId ? 'Aviso atualizado' : 'Aviso enviado',
        data?.scheduled
          ? 'Aviso salvo em modo agendado. Ele será liberado no app quando chegar o horário.'
          : `Mensagem enviada para o app. Push entregue para ${data?.pushResult?.sent || 0} dispositivo(s).`,
      );
      setNotifyTitle('');
      setNotifyBody('');
      setNotifyEmail('');
      setNotifyActionTab('');
      setNotifyLinkUrl('');
      setNotifyStartsAt('');
      setNotifyEditId('');
      setNotifyAudience('all');
      } catch (error: any) {
      openFeedback('error', 'Falha ao enviar aviso', error?.message || 'Não foi possível enviar o aviso.');
    } finally {
      setLoading(false);
      await loadAdminData().catch(() => undefined);
    }
  };

  const grantAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: await getAdminFetchHeaders(true),
        body: JSON.stringify({
          email: grantEmail,
          customerName: grantName,
          planKey: grantPlanKey,
          expiresAt: grantExpiresAt ? localInputToIso(grantExpiresAt) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao conceder acesso', data?.error || 'Não foi possível conceder o acesso.');
        return;
      }
      openFeedback('success', 'Acesso concedido', 'O plano foi atualizado manualmente com sucesso.');
      setGrantEmail('');
      setGrantName('');
      setGrantExpiresAt('');
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao conceder acesso', error?.message || 'Não foi possível conceder o acesso.');
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: await getAdminFetchHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao revogar acesso', data?.error || 'Não foi possível revogar o acesso.');
        return;
      }
      openFeedback('success', 'Acesso revogado', `O acesso de ${email} foi revogado com sucesso.`);
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao revogar acesso', error?.message || 'Não foi possível revogar o acesso.');
    } finally {
      setLoading(false);
    }
  };

  const saveAdminSettings = async () => {
    setLoading(true);
    try {
      const payload = {
        adminEmails: managedAdminEmails,
        newPassword: newAdminPassword || undefined,
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: await getAdminFetchHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao salvar dados do admin', data?.error || 'Não foi possível atualizar os dados do admin.');
        return;
      }
      setManagedAdminEmails(Array.isArray(data?.adminEmails) ? data.adminEmails : managedAdminEmails);
      setNewAdminPassword('');
      openFeedback('success', 'Configurações salvas', 'Os e-mails do admin e a senha do painel foram atualizados com sucesso.');
    } catch (error: any) {
      openFeedback('error', 'Falha ao salvar dados do admin', error?.message || 'Não foi possível atualizar os dados do admin.');
    } finally {
      setLoading(false);
    }
  };

  const addAdminEmail = () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    if (managedAdminEmails.includes(email)) {
      setNewAdminEmail('');
      return;
    }
    setManagedAdminEmails((prev) => [...prev, email]);
    setNewAdminEmail('');
  };

  const removeAdminEmail = (email: string) => {
    requestDangerAction({
      title: 'Remover e-mail admin',
      message: `Remover ${email} da lista de acesso ao painel admin?`,
      confirmLabel: 'Remover e-mail',
      action: { type: 'admin-email', email },
    });
  };

  const createPromoCampaign = async () => {
    setLoading(true);
    try {
      const startsAt = promoStartsAt ? localInputToIso(promoStartsAt) : new Date().toISOString();
      const res = await fetch('/api/admin/promo-access', {
        method: 'POST',
        headers: await getAdminFetchHeaders(true),
        body: JSON.stringify({
          id: promoEditId || undefined,
          title: promoTitle || `Acesso Pro liberado por ${promoDurationDays} dias`,
          durationDays: promoDurationDays,
          audience: promoAudience,
          targetEmail: promoAudience === 'email' ? promoTargetEmail : undefined,
          startsAt,
          active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao criar promoção temporária', data?.error || 'Não foi possível criar a promoção.');
        return;
      }
      setPromoTitle('');
      setPromoTargetEmail('');
      setPromoStartsAt('');
      setPromoEditId('');
      setPromoAudience('all');
      openFeedback('success', promoEditId ? 'Promoção atualizada' : 'Promoção criada', `A promoção temporária foi salva com sucesso e o push alcançou ${data?.pushResult?.sent || 0} dispositivo(s).`);
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao criar promoção temporária', error?.message || 'Não foi possível criar a promoção.');
    } finally {
      setLoading(false);
    }
  };

  const startEditingPromo = (campaign: PromoAccessCampaign) => {
    setPromoEditId(campaign.id);
    setPromoTitle(campaign.title);
    setPromoDurationDays(campaign.durationDays);
    setPromoAudience(campaign.audience);
    setPromoTargetEmail(campaign.targetEmail || '');
    setPromoStartsAt(isoToLocalInput(campaign.startsAt));
  };

  const togglePromoCampaign = async (campaign: PromoAccessCampaign, active: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-access', {
        method: 'PATCH',
        headers: await getAdminFetchHeaders(true),
        body: JSON.stringify({ id: campaign.id, active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao atualizar promoção', data?.error || 'Não foi possível atualizar a promoção.');
        return;
      }
      openFeedback('success', active ? 'Promoção reativada' : 'Promoção encerrada', active ? 'A promoção foi reativada.' : 'A promoção foi encerrada antes do prazo.');
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao atualizar promoção', error?.message || 'Não foi possível atualizar a promoção.');
    } finally {
      setLoading(false);
    }
  };

  const executeDeletePromoCampaign = async (campaignId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/promo-access?id=${encodeURIComponent(campaignId)}`, {
        method: 'DELETE',
        headers: await getAdminFetchHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao excluir promoção', data?.error || 'Não foi possível excluir a promoção.');
        return;
      }
      if (promoEditId === campaignId) {
        setPromoEditId('');
        setPromoTitle('');
        setPromoDurationDays(7);
        setPromoAudience('all');
        setPromoTargetEmail('');
        setPromoStartsAt('');
      }
      openFeedback('success', 'Promoção excluída', 'A promoção foi removida com sucesso.');
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao excluir promoção', error?.message || 'Não foi possível excluir a promoção.');
    } finally {
      setLoading(false);
    }
  };

  const deletePromoCampaign = (campaign: PromoAccessCampaign) => {
    requestDangerAction({
      title: 'Excluir promoção temporária',
      message: `Excluir a promoção "${campaign.title}" permanentemente?`,
      confirmLabel: 'Excluir promoção',
      action: { type: 'promo', id: campaign.id },
    });
  };

  const startEditingNotice = (item: AdminBroadcastItem) => {
    setNotifyEditId(item.id);
    setNotifyTitle(item.title);
    setNotifyBody(item.body);
    setNotifyAudience(item.audience || 'all');
    setNotifyEmail(item.targetEmail || '');
    setNotifyActionTab(item.actionTab || '');
    setNotifyLinkUrl(item.linkUrl || '');
    setNotifyPush(item.sendPush !== false);
    setNotifyStartsAt(isoToLocalInput(item.startsAt || null));
  };

  const executeDeleteNotice = async (itemId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notify?id=${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: await getAdminFetchHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao excluir aviso', data?.error || 'Não foi possível excluir o aviso.');
        return;
      }
      if (notifyEditId === itemId) {
        setNotifyEditId('');
        setNotifyTitle('');
        setNotifyBody('');
        setNotifyAudience('all');
        setNotifyEmail('');
        setNotifyActionTab('');
        setNotifyLinkUrl('');
        setNotifyPush(true);
        setNotifyStartsAt('');
      }
      openFeedback('success', 'Aviso excluído', 'O aviso foi removido com sucesso.');
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao excluir aviso', error?.message || 'Não foi possível excluir o aviso.');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotice = (item: AdminBroadcastItem) => {
    requestDangerAction({
      title: 'Excluir aviso',
      message: `Excluir o aviso "${item.title}" permanentemente?`,
      confirmLabel: 'Excluir aviso',
      action: { type: 'notice', id: item.id },
    });
  };

  const executeDeleteAuditEntry = async (entryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?id=${encodeURIComponent(entryId)}`, {
        method: 'DELETE',
        headers: await getAdminFetchHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        openFeedback('error', 'Falha ao excluir histórico', data?.error || 'Não foi possível excluir esse registro.');
        return;
      }
      openFeedback('success', 'Histórico excluído', 'O registro do histórico foi removido com sucesso.');
      await loadAdminData();
    } catch (error: any) {
      openFeedback('error', 'Falha ao excluir histórico', error?.message || 'Não foi possível excluir esse registro.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAuditEntry = (entryId: string) => {
    requestDangerAction({
      title: 'Excluir registro do histórico',
      message: 'Excluir este item do histórico do admin?',
      confirmLabel: 'Excluir registro',
      action: { type: 'audit', id: entryId },
    });
  };

  const confirmDangerAction = async () => {
    const action = dangerModal.action;
    setDangerModal((prev) => ({ ...prev, open: false }));
    if (!action) return;

    if (action.type === 'promo') {
      await executeDeletePromoCampaign(action.id);
      return;
    }
    if (action.type === 'notice') {
      await executeDeleteNotice(action.id);
      return;
    }
    if (action.type === 'audit') {
      await executeDeleteAuditEntry(action.id);
      return;
    }
    if (action.type === 'admin-email') {
      setManagedAdminEmails((prev) => prev.filter((item) => item !== action.email));
      openFeedback('success', 'E-mail removido', `${action.email} saiu da lista de acesso ao painel.`);
    }
  };

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f2a53_0%,#07101f_45%,#04070f_100%)] text-white flex items-center justify-center p-6">
        <div className="rounded-[2rem] border border-cyan-400/10 bg-slate-950/70 px-6 py-5 text-sm text-slate-300">
          Verificando acesso...
        </div>
      </div>
    );
  }

  if (!canAccessByAccount) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f2a53_0%,#07101f_45%,#04070f_100%)] text-white flex items-center justify-center p-6">
        <div className="relative w-full max-w-md overflow-hidden rounded-[2.2rem] border border-cyan-400/15 bg-slate-950/80 p-7 shadow-[0_30px_80px_-30px_rgba(34,211,238,0.25)] backdrop-blur-2xl">
          <div className="absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.8rem] border border-white/10 bg-white/5 text-3xl shadow-inner">🛡️</div>
            <p className="mt-5 text-center text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Painel privado</p>
            <h1 className="mt-2 text-center text-4xl font-[1000] tracking-tight">Sereno Admin</h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-400">Controle campanhas, avisos e ações operacionais sem expor nada no app do usuário.</p>
            <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">Senha do admin</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              {authError && <p className="mt-3 text-sm font-semibold text-rose-300">{authError}</p>}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_40px_-18px_rgba(34,211,238,0.85)] disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#132f5c_0%,#0a1426_40%,#04070f_100%)] text-white p-5 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-cyan-400/10 bg-slate-950/70 p-6 shadow-[0_35px_100px_-35px_rgba(34,211,238,0.35)] backdrop-blur-2xl">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Painel privado</p>
                <h1 className="mt-2 text-4xl font-[1000] tracking-tight md:text-5xl">Sereno Admin</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Centro de operação para campanhas premium, ativações temporárias e avisos enviados diretamente para o app e para o celular dos usuários.</p>
              </div>
              <button onClick={handleLogout} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-100 transition-all hover:bg-white/10">
                Sair
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.8rem] border border-cyan-400/10 bg-cyan-400/10 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">Campanha vitalícia</p>
                <p className="mt-3 text-2xl font-[1000] tracking-tight">{campaignStatusLabel}</p>
                <p className="mt-2 text-sm text-cyan-50/75">Leitura automática do estado atual da oferta.</p>
              </div>
              <div className="rounded-[1.8rem] border border-emerald-400/10 bg-emerald-400/10 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">Push externo</p>
                <p className="mt-3 text-2xl font-[1000] tracking-tight">{notifyPush ? 'Ativo' : 'Desligado'}</p>
                <p className="mt-2 text-sm text-emerald-50/75">Os avisos podem sair do app e chegar no celular.</p>
              </div>
              <div className="rounded-[1.8rem] border border-violet-400/10 bg-violet-400/10 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-200">Audiência atual</p>
                <p className="mt-3 text-2xl font-[1000] tracking-tight">{notifyAudience === 'all' ? 'Todos' : 'Pessoa específica'}</p>
                <p className="mt-2 text-sm text-violet-50/75">Escolha entre envio amplo ou mensagem direcionada.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Promoções ativas</p>
                <p className="mt-2 text-xl font-[1000] tracking-tight text-white">{promoCampaigns.filter((item) => item.active).length}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Avisos ativos</p>
                <p className="mt-2 text-xl font-[1000] tracking-tight text-white">{scheduledNotices.filter((item) => item.active !== false).length}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Planos</p>
                <p className="mt-2 text-xl font-[1000] tracking-tight text-white">{subscriptions.length}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Histórico</p>
                <p className="mt-2 text-xl font-[1000] tracking-tight text-white">{auditEntries.length}</p>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 grid gap-6">
          <div className="space-y-6">
            <section className="rounded-[2.2rem] border border-amber-300/12 bg-slate-950/70 p-6 shadow-[0_24px_70px_-35px_rgba(251,191,36,0.35)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">Campanha vitalícia</p>
                <h2 className="mt-2 text-3xl font-[1000] tracking-tight">Controle do Acesso Vitalício</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Este painel controla só o aviso fixo e automático do Vitalício. Ao ativar a campanha, o app mantém esse aviso separado dos avisos personalizados.</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/80">Datas e horas em horário de Brasília</p>
              </div>
              <div className={`rounded-2xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${offerState.isActive ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/5 text-slate-300'}`}>
                {campaignStatusLabel}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Ativar campanha</span>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-200">{offerEnabled ? 'Ligada' : 'Desligada'}</span>
                  <input
                    type="checkbox"
                    checked={offerEnabled}
                    onChange={(e) => {
                      const nextEnabled = e.target.checked;
                      setOfferEnabled(nextEnabled);
                      if (!nextEnabled) {
                        setOfferStartsAt('');
                        setOfferEndsAt('');
                      }
                    }}
                    className="h-5 w-5 accent-amber-400"
                  />
                </div>
              </label>
              <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Início</span>
                <input type="datetime-local" value={offerStartsAt} onChange={(e) => setOfferStartsAt(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
              </label>
              <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Fim</span>
                <input type="datetime-local" value={offerEndsAt} onChange={(e) => setOfferEndsAt(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
              </label>
            </div>

            <button onClick={saveLifetimeOffer} disabled={loading} className="mt-5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_40px_-18px_rgba(251,191,36,0.85)] disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar campanha'}
            </button>
            </section>

            <section className="rounded-[2.2rem] border border-emerald-300/12 bg-slate-950/70 p-6 shadow-[0_24px_70px_-35px_rgba(74,222,128,0.28)] backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">Promoções temporárias</p>
                  <h2 className="mt-2 text-3xl font-[1000] tracking-tight">Liberar Pro por tempo limitado</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Crie campanhas como 7, 15 ou 30 dias de acesso Pro para todo mundo, para um público específico ou para um e-mail só.</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/80">Datas e horas em horário de Brasília</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Título</span>
                  <input value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} placeholder="Ex.: Semana do cuidado" className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                </label>
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Duração</span>
                  <select value={promoDurationDays} onChange={(e) => setPromoDurationDays(Number(e.target.value))} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none">
                    <option className={ADMIN_SELECT_OPTION_CLASS} value={7}>7 dias</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value={15}>15 dias</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value={30}>30 dias</option>
                  </select>
                </label>
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Público</span>
                  <select value={promoAudience} onChange={(e) => setPromoAudience(e.target.value as 'all' | 'email' | 'women' | 'men')} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none">
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="all">Todos</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="women">Mulheres</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="men">Homens</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="email">E-mail específico</option>
                  </select>
                </label>
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Início</span>
                  <input type="datetime-local" value={promoStartsAt} onChange={(e) => setPromoStartsAt(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                </label>
              </div>

              {promoAudience === 'email' && (
                <label className="mt-4 block rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">E-mail alvo</span>
                  <input value={promoTargetEmail} onChange={(e) => setPromoTargetEmail(e.target.value)} placeholder="pessoa@email.com" className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                </label>
              )}

              <button onClick={createPromoCampaign} disabled={loading} className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-300 via-lime-300 to-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_40px_-18px_rgba(74,222,128,0.85)] disabled:opacity-60">
                {loading ? 'Criando...' : promoEditId ? 'Salvar promoção' : 'Criar promoção Pro'}
              </button>

              <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Preview da promoção</p>
                <div className="mt-4 rounded-[1.5rem] border border-emerald-400/15 bg-slate-950/80 p-4">
                  <p className="text-base font-black text-white">{promoTitle || `Acesso Pro liberado por ${promoDurationDays} dias`}</p>
                  <p className="mt-2 text-sm text-slate-300">Público: {promoAudience === 'all' ? 'Todos' : promoAudience === 'email' ? promoTargetEmail || 'E-mail específico' : promoAudience === 'women' ? 'Mulheres' : 'Homens'}</p>
                  <p className="mt-2 text-sm text-slate-300">Início: {promoStartsAt || 'Agora'} • Duração: {promoDurationDays} dias</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {promoCampaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-base font-black tracking-tight text-white">{campaign.title}</p>
                        <p className="mt-2 text-sm text-slate-400">
                          {campaign.durationDays} dias • {campaign.audience === 'all' ? 'Todos' : campaign.audience === 'email' ? campaign.targetEmail : campaign.audience === 'women' ? 'Mulheres' : 'Homens'}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                        De {formatBrasiliaDateTime(campaign.startsAt)} até {formatBrasiliaDateTime(campaign.endsAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${campaign.active ? 'bg-emerald-400/15 text-emerald-200 border border-emerald-400/20' : 'bg-white/5 text-slate-300 border border-white/10'}`}>
                          {campaign.active ? 'Ativa' : 'Encerrada'}
                        </span>
                        <button onClick={() => startEditingPromo(campaign)} type="button" className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                          Editar
                        </button>
                        <button onClick={() => togglePromoCampaign(campaign, !campaign.active)} type="button" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                          {campaign.active ? 'Encerrar' : 'Reativar'}
                        </button>
                        <button onClick={() => deletePromoCampaign(campaign)} type="button" className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-rose-200">
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[2.2rem] border border-emerald-300/12 bg-slate-950/70 p-6 shadow-[0_24px_70px_-35px_rgba(52,211,153,0.35)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">Avisos e push</p>
                <h2 className="mt-2 text-3xl font-[1000] tracking-tight">Enviar aviso personalizado</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Este painel é independente do Vitalício. Tudo o que você enviar aqui aparece só como aviso personalizado, com opção de guia interna, link externo e segmentação por público.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Título do aviso</span>
                <input value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder="Ex.: Campanha relâmpago liberada" className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
              </label>

              <label className="block rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Mensagem</span>
                <textarea value={notifyBody} onChange={(e) => setNotifyBody(e.target.value)} placeholder="Mensagem que aparecerá no inbox do app e também no push." className="mt-4 min-h-[150px] w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
              </label>

              <div className="grid gap-4">
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Audiência</span>
                  <select value={notifyAudience} onChange={(e) => setNotifyAudience(e.target.value as 'all' | 'email' | 'women' | 'men')} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none">
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="all">Todos</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="women">Mulheres</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="men">Homens</option>
                    <option className={ADMIN_SELECT_OPTION_CLASS} value="email">Pessoa específica</option>
                  </select>
                </label>
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">E-mail alvo</span>
                  <input value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="user@email.com" disabled={notifyAudience !== 'email'} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none disabled:opacity-40" />
                </label>
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Abrir tela do app</span>
                  <select value={notifyActionTab} onChange={(e) => setNotifyActionTab(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none">
                    {appDestinations.map((option) => (
                      <option className={ADMIN_SELECT_OPTION_CLASS} key={option.value || 'none'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Link externo opcional</span>
                  <input value={notifyLinkUrl} onChange={(e) => setNotifyLinkUrl(e.target.value)} placeholder="https://..." className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                </label>
              </div>

              <label className="block rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Agendar para</span>
                <input type="datetime-local" value={notifyStartsAt} onChange={(e) => setNotifyStartsAt(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                <p className="mt-3 text-xs text-slate-400">Se deixar vazio, o aviso sai agora. Se preencher, ele fica agendado para esse horário de Brasília.</p>
              </label>

              <label className="flex items-center gap-3 rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100">
                <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} className="h-5 w-5 accent-emerald-400" />
                Enviar também push para fora do app
              </label>
            </div>

            <button onClick={sendNotice} disabled={loading} className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_40px_-18px_rgba(52,211,153,0.85)] disabled:opacity-60">
              {loading ? 'Enviando...' : notifyEditId ? 'Salvar aviso' : 'Enviar aviso'}
            </button>

            <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Preview do aviso</p>
              <div className="mt-4 rounded-[1.5rem] border border-emerald-400/15 bg-slate-950/80 p-4">
                <p className="text-base font-black text-white">{notifyTitle || 'Título do aviso'}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{notifyBody || 'A mensagem aparece aqui antes do envio.'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1">{notifyAudience === 'all' ? 'Todos' : notifyAudience === 'email' ? 'E-mail' : notifyAudience === 'women' ? 'Mulheres' : 'Homens'}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{notifyStartsAt ? `Agendado ${notifyStartsAt}` : 'Envio imediato'}</span>
                  {notifyPush && <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Com push</span>}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Avisos salvos e agendados</p>
              {scheduledNotices.map((item) => (
                <div key={item.id} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-base font-black text-white">{item.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{item.body}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.startsAt ? `Agendado para ${formatBrasiliaDateTime(item.startsAt)}` : 'Envio imediato'} • {item.active === false ? 'Desativado' : 'Ativo'}
                      </p>
                    </div>
                    <button onClick={() => startEditingNotice(item)} type="button" className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100">
                      Editar
                    </button>
                    <button onClick={() => deleteNotice(item)} type="button" className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-200">
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6">
          <section className="rounded-[2.2rem] border border-violet-300/12 bg-slate-950/70 p-6 shadow-[0_24px_70px_-35px_rgba(167,139,250,0.35)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-300">Acesso manual</p>
                <h2 className="mt-2 text-3xl font-[1000] tracking-tight">Conceder plano</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Use para liberar Pro ou Vitalício sem checkout. Isso é o caminho para bônus, testes, suporte e cortesia.</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/80">Expiração em horário de Brasília</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">E-mail</span>
                <input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="pessoa@email.com" className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
              </label>
              <label className="block rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Nome opcional</span>
                <input value={grantName} onChange={(e) => setGrantName(e.target.value)} placeholder="Nome da pessoa" className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
              </label>
              <div className="grid gap-4">
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Plano</span>
                  <select value={grantPlanKey} onChange={(e) => setGrantPlanKey(e.target.value as BillingPlanKey)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none">
                    {grantablePlans.map((planKey) => (
                      <option className={ADMIN_SELECT_OPTION_CLASS} key={planKey} value={planKey}>{PLAN_DEFINITIONS[planKey].label}</option>
                    ))}
                  </select>
                </label>
                <label className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Expira em</span>
                  <input type="datetime-local" value={grantExpiresAt} onChange={(e) => setGrantExpiresAt(e.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none" />
                </label>
              </div>
            </div>

            <button onClick={grantAccess} disabled={loading} className="mt-5 rounded-2xl bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_40px_-18px_rgba(216,180,254,0.85)] disabled:opacity-60">
              {loading ? 'Salvando...' : 'Conceder acesso'}
            </button>
          </section>

          <section className="rounded-[2.2rem] border border-cyan-300/12 bg-slate-950/70 p-6 shadow-[0_24px_70px_-35px_rgba(34,211,238,0.35)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">Assinaturas</p>
                <h2 className="mt-2 text-3xl font-[1000] tracking-tight">Resumo por plano</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Visão rápida da quantidade de assinaturas por tipo de plano, sem expor nomes ou e-mails.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
                {subscriptions.length} assinatura(s)
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {subscriptionSummary.length === 0 && (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                  Nenhuma assinatura salva ainda.
                </div>
              )}
              {subscriptionSummary.map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">Plano</p>
                  <p className="mt-2 text-lg font-[1000] tracking-tight text-white">{item.label}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-300">{item.total} assinatura(s)</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6">
          <section className="rounded-[2.2rem] border border-fuchsia-300/12 bg-slate-950/70 p-6 shadow-[0_24px_70px_-35px_rgba(217,70,239,0.28)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-300">Admin do painel</p>
                <h2 className="mt-2 text-3xl font-[1000] tracking-tight">E-mails e senha</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">Aqui você troca a senha do segundo login do painel e define quais e-mails podem sequer ver e abrir essa área exclusiva.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">E-mails com acesso ao painel</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {managedAdminEmails.map((email) => (
                    <span key={email} className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold text-fuchsia-100">
                      {email}
                      {managedAdminEmails.length > 1 && (
                        <button type="button" onClick={() => removeAdminEmail(email)} className="text-fuchsia-200/80 hover:text-white">×</button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <input
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="novo-admin@email.com"
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                  />
                  <button onClick={addAdminEmail} type="button" className="rounded-2xl bg-fuchsia-500 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Nova senha do painel</p>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Nova senha do segundo login"
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                />
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Essa senha é a do segundo login do painel admin. O acesso continua exigindo também o login pela conta autorizada.
                </p>
              </div>
            </div>

            <button onClick={saveAdminSettings} disabled={loading || managedAdminEmails.length === 0} className="mt-5 rounded-2xl bg-gradient-to-r from-fuchsia-300 via-pink-300 to-rose-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_18px_40px_-18px_rgba(244,114,182,0.85)] disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar configurações do admin'}
            </button>
          </section>
        </div>

        <div className="mt-6">
          <section className="rounded-[2.2rem] border border-amber-300/12 bg-slate-950/70 p-6 shadow-[0_24px_70px_-35px_rgba(251,191,36,0.24)] backdrop-blur-2xl">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">Histórico do admin</p>
              <h2 className="mt-2 text-3xl font-[1000] tracking-tight">Últimas ações</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Aqui você vê quem fez o quê e quando no painel admin.</p>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">Buscar no histórico</p>
                <input
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  placeholder="Buscar por ação, resumo ou e-mail..."
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">Filtrar por ação</p>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none"
                >
                  <option className={ADMIN_SELECT_OPTION_CLASS} value="all">Todas</option>
                  {auditActionOptions.map((action) => (
                    <option className={ADMIN_SELECT_OPTION_CLASS} key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-amber-100/80">
              <span>{filteredAuditEntries.length} resultado(s)</span>
              <span>Página {auditPage} de {auditPageCount}</span>
            </div>

            <div className="mt-4 space-y-3">
              {pagedAuditEntries.map((entry) => (
                <div key={entry.id} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-sm font-black text-white">{entry.summary}</p>
                      <p className="mt-1 text-xs text-slate-400">{entry.actorEmail} • {entry.targetEmail || 'sem alvo direto'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-amber-100/80">{formatBrasiliaDateTime(entry.createdAt)}</span>
                      <button
                        onClick={() => deleteAuditEntry(entry.id)}
                        type="button"
                        className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-rose-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pagedAuditEntries.length === 0 && (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
                  Nenhum registro encontrado com os filtros atuais.
                </div>
              )}
            </div>

            {auditPageCount > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                  disabled={auditPage === 1}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-100 disabled:opacity-40"
                >
                  Página anterior
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: auditPageCount }, (_, index) => index + 1)
                    .slice(Math.max(0, auditPage - 3), Math.max(0, auditPage - 3) + 5)
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => setAuditPage(page)}
                        className={`rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${page === auditPage ? 'bg-amber-300 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-200'}`}
                      >
                        {page}
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setAuditPage((prev) => Math.min(auditPageCount, prev + 1))}
                  disabled={auditPage === auditPageCount}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-100 disabled:opacity-40"
                >
                  Próxima página
                </button>
              </div>
            )}
          </section>
        </div>

      </div>
      <AppNoticeModal
        open={feedbackModal.open}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
        darkMode
        eyebrow={feedbackModal.tone === 'error' ? 'Falha' : 'Concluído'}
        icon={feedbackModal.tone === 'error' ? '⚠️' : '✅'}
        primaryLabel="Fechar"
        secondaryLabel={feedbackModal.tone === 'error' ? 'Copiar erro' : undefined}
        onSecondary={
          feedbackModal.tone === 'error'
            ? () => {
                if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(feedbackModal.message).catch(() => undefined);
                }
              }
            : undefined
        }
      />
      <AppNoticeModal
        open={dangerModal.open}
        title={dangerModal.title}
        message={dangerModal.message}
        onClose={() => setDangerModal((prev) => ({ ...prev, open: false, action: null }))}
        darkMode
        eyebrow="Confirmação"
        icon="🗑️"
        primaryLabel={dangerModal.confirmLabel}
        onPrimary={() => {
          confirmDangerAction().catch(() => undefined);
        }}
        secondaryLabel="Cancelar"
      />
    </div>
  );
}
