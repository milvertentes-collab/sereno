import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

export type HopeMessageStatus = 'active' | 'blocked' | 'archived';

export type HopeWallMessageRecord = {
  id: string;
  text: string;
  createdAt: string;
  status: HopeMessageStatus;
  moderated: boolean;
  anonymousAlias?: string;
  accountId: string;
  deviceId: string;
  favoritedCount: number;
  deliveryCount: number;
  lastDeliveredAt?: string | null;
  reportCount?: number;
};

export type HopeWallDeliveryRecord = {
  id: string;
  messageId: string;
  recipientAccountId: string;
  recipientDeviceId: string;
  createdAt: string;
  favorite: boolean;
};

type HopeWallFile = {
  messages: HopeWallMessageRecord[];
  deliveries: HopeWallDeliveryRecord[];
  reports: HopeWallReportRecord[];
};

export type HopeWallReportRecord = {
  id: string;
  messageId: string;
  reporterAccountId: string;
  reporterDeviceId: string;
  createdAt: string;
  reason?: string;
};

const HOPE_FILE = 'hope-wall.json';
const MIN_SEND_INTERVAL_MS = 60_000;
const MAX_SENDS_PER_30_MIN = 3;
const MAX_SENDS_PER_DAY = 10;

const forbiddenWords = [
  'pornografia', 'porno', 'nude', 'nudes', 'pedof', 'criança sexy', 'infantil sexy',
  'racista', 'racismo', 'homofobia', 'transfobia', 'machista', 'nazista', 'xenofobia', 'capacitista', 'elitista',
  'traveco', 'macaco', 'favelado', 'mulher inferior', 'homem inferior', 'gente inferior',
  'suicidio', 'suicídio', 'automutilacao', 'automutilação',
  'cassino', 'aposta', 'bet', 'blaze', 'tigrinho',
  'pix', 'cupom', 'desconto', 'marketing', 'consultoria', 'mentoria',
];

const forbiddenPatterns = [
  /\b(vote|votem|votem em|faça campanha|faca campanha)\b/i,
  /\b(converta-se|se converta|aceite jesus|ore agora|reza obrigatoria|reze obrigatoriamente)\b/i,
  /\b(voce tem que|você tem que|deve obedecer|obedeça|obedeca|pare de ser|tem que parar)\b/i,
  /\b(morra|deveria morrer|merece morrer|acabe com sua vida)\b/i,
  /\b(discrimin[a-z]*|inferior|raça inferior|raca inferior|classe inferior|gente inferior|cor inferior)\b/i,
  /\b(odeio (crente|evangelico|evangélico|catolico|católico|ateu|ateus|muçulmano|mulcumano|judeu|judeus))\b/i,
  /\b(odeio (pobre|ricos|rico|negro|negra|branco|branca|gay|lésbica|lesbica|trans|travesti|mulher|homem))\b/i,
  /\b(religiao de pobre|religião de pobre|religiao lixo|religião lixo)\b/i,
  /\b(spam|corrente|encaminhe para|envie para 10 pessoas)\b/i,
  /\b(http:\/\/|https:\/\/|www\.|bit\.ly|tinyurl|t\.me\/|wa\.me\/)\b/i,
  /\b(linktr\.ee)\b/i,
  /\b(chama no|me chama no|fala comigo no|entra em contato|me procura no|me chama no whatsapp|me chama no zap|me chama no telegram|me chama no insta|direct|dm|pv)\b/i,
  /(^|\s)@[a-z0-9._-]{2,}/i,
  /\b(instagram|insta|facebook|face|twitter|x\.com|twitter\.com)\b/i,
  /\b(ameaca|ameaça|vou te pegar|vou acabar com|merece apanhar)\b/i,
  /\b(pare de tomar|larga esse rem[eé]dio|abandona seu tratamento)\b/i,
  /\b(aposte|entra na bet|ganha dinheiro facil|ganhe dinheiro facil|ganhe dinheiro fácil)\b/i,
  /\b(se corta|me corto|me cortar|corta seu corpo)\b/i,
  /\b(me passa seu|manda seu|envia seu|qual seu numero|qual seu número|me passa teu|me manda teu)\b/i,
  /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-.\s]?\d{4})/i,
  /\b(rua|avenida|av\.|travessa|trav\.|alameda|bairro|cep|numero|número|casa|apto|apartamento|condominio|condomínio)\b.{0,30}\d+/i,
  /\b(zero|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove)\b(?:[\s,.-]+\b(zero|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove)\b){5,}/i,
  /\b(meu nome e|meu nome é|me chamo|sou o|sou a|eu sou o|eu sou a|assinado por)\b/i,
];

const careKeywords = [
  'amor', 'carinho', 'cuidado', 'apoio', 'acolhimento', 'gentil', 'gentileza', 'força', 'forca', 'esperança', 'esperanca',
  'calma', 'respire', 'respiro', 'leveza', 'bem-estar', 'bem estar', 'saúde mental', 'saude mental', 'presença', 'presenca',
  'motivação', 'motivacao', 'aprendizado', 'educativo', 'afeto', 'descanso', 'abraço', 'abraco', 'sereno', 'paz',
];

const blockedNames = [
  'ana', 'maria', 'joao', 'joão', 'jose', 'josé', 'paulo', 'carlos', 'carlos', 'pedro', 'lucas', 'gabriel', 'rafael',
  'fernanda', 'camila', 'julia', 'júlia', 'bruna', 'amanda', 'beatriz', 'mariana', 'leticia', 'letícia', 'bianca',
  'rodrigo', 'felipe', 'thiago', 'tiago', 'diego', 'gustavo', 'ricardo', 'eduardo', 'daniel', 'matheus', 'mateus',
  'renata', 'patricia', 'patrícia', 'vanessa', 'aline', 'karina', 'carolina', 'gabriela', 'larissa', 'talita',
  'luana', 'isabela', 'isabella', 'helena', 'valentina', 'miguel', 'arthur', 'enzo', 'davi', 'henrique', 'vinicius', 'vinícius',
  'luiz', 'luis', 'otavio', 'otávio', 'vitor', 'victor', 'caio', 'andre', 'andré', 'marcelo', 'marcio', 'márcio', 'leonardo',
  'samuel', 'ian', 'kaua', 'kauã', 'yuri', 'bruno', 'alexandre', 'alex', 'cesar', 'césar', 'wilson', 'wesley', 'renan',
  'yasmin', 'yasmim', 'sofia', 'sophia', 'alice', 'clara', 'manuela', 'laura', 'lorena', 'ester', 'rafaela', 'raquel',
  'elaine', 'simone', 'monica', 'mônica', 'claudia', 'cláudia', 'juliana', 'priscila', 'priscilla', 'tatiane', 'taina', 'tainá',
  'debora', 'débora', 'elisangela', 'elisângela', 'regina', 'adriana', 'silvia', 'sílvia', 'fabiana', 'fabio', 'fábio', 'jaqueline',
];

const seededMessages: HopeWallMessageRecord[] = [
  'Você não precisa resolver tudo hoje. Um passo gentil já vale muito.',
  'Respire fundo. Seu corpo também merece ouvir que está tudo bem desacelerar.',
  'Mesmo num dia difícil, ainda existe cuidado possível para agora.',
  'Você não está atrasado. Está vivendo no tempo que consegue sustentar.',
  'Se hoje estiver pesado, faça só o próximo gesto de cuidado.',
].map((text, index): HopeWallMessageRecord => ({
  id: `seed-${index + 1}`,
  text,
  createdAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 6).toISOString(),
  status: 'active' as const,
  moderated: true,
  anonymousAlias: `Luz serena ${index + 1}`,
  accountId: 'system',
  deviceId: 'system',
  favoritedCount: 0,
  deliveryCount: 0,
  lastDeliveredAt: null,
}));

function normalizeIdentity(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function identityKey(accountId?: string | null, deviceId?: string | null) {
  return normalizeIdentity(accountId) || normalizeIdentity(deviceId);
}

function createAlias(seed: string) {
  const left = ['Brisa', 'Luz', 'Aurora', 'Maré', 'Calma', 'Nuvem', 'Raiz', 'Abraço'];
  const right = ['Gentil', 'Serena', 'Azul', 'Macia', 'Viva', 'Clara', 'Leve', 'Doce'];
  const base = seed || 'sereno';
  const sum = base.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${left[sum % left.length]} ${right[sum % right.length]}`;
}

function moderateText(text: string) {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const normalizedLeet = normalized
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z0-9\s:/._-]/g, '');

  const blockedByWord = forbiddenWords.some((word) => normalizedLeet.includes(word));
  const blockedByPattern = forbiddenPatterns.some((pattern) => pattern.test(text) || pattern.test(normalizedLeet));
  const blockedByName = blockedNames.some((name) => new RegExp(`\\b${name.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')}\\b`, 'i').test(normalizedLeet));
  const hasCareSignal = careKeywords.some((word) => normalized.includes(word));
  const hasLink = /(http:\/\/|https:\/\/|www\.|bit\.ly|tinyurl|t\.me\/|wa\.me\/)/i.test(text);
  const hasEnoughSupportiveContent = text.trim().length >= 10 && (hasCareSignal || text.trim().split(/\s+/).length >= 6);
  const blocked = blockedByWord || blockedByPattern || blockedByName || hasLink || !hasEnoughSupportiveContent;
  let reason:
    | 'unsafe_content'
    | 'links_not_allowed'
    | 'personal_identity_not_allowed'
    | 'outside_wall_purpose'
    | null = null;

  if (hasLink) reason = 'links_not_allowed';
  else if (blockedByName) reason = 'personal_identity_not_allowed';
  else if (blockedByWord || blockedByPattern) reason = 'unsafe_content';
  else if (!hasEnoughSupportiveContent) reason = 'outside_wall_purpose';

  return {
    allowed: !blocked,
    moderated: !blocked,
    reason,
  };
}

async function readStore() {
  if (isSupabaseAdminConfigured) {
    const supabase = getSupabaseAdmin();
    const [
      { data: messageRows, error: messageError },
      { data: deliveryRows, error: deliveryError },
      { data: reportRows, error: reportError },
    ] = await Promise.all([
      supabase
        .from('hope_wall_messages')
        .select('id, text, created_at, status, moderated, anonymous_alias, account_id, device_id, favorited_count, delivery_count, last_delivered_at, report_count')
        .order('created_at', { ascending: false }),
      supabase
        .from('hope_wall_deliveries')
        .select('id, message_id, recipient_account_id, recipient_device_id, created_at, favorite')
        .order('created_at', { ascending: false }),
      supabase
        .from('hope_wall_reports')
        .select('id, message_id, reporter_account_id, reporter_device_id, created_at, reason')
        .order('created_at', { ascending: false }),
    ]);

    if (messageError) throw messageError;
    if (deliveryError) throw deliveryError;
    if (reportError) throw reportError;

    const remoteMessages = Array.isArray(messageRows)
      ? messageRows.map((row): HopeWallMessageRecord => ({
          id: row.id,
          text: row.text,
          createdAt: row.created_at,
          status: row.status,
          moderated: Boolean(row.moderated),
          anonymousAlias: row.anonymous_alias || undefined,
          accountId: row.account_id || '',
          deviceId: row.device_id,
          favoritedCount: Number(row.favorited_count || 0),
          deliveryCount: Number(row.delivery_count || 0),
          lastDeliveredAt: row.last_delivered_at || null,
          reportCount: Number(row.report_count || 0),
        }))
      : [];
    const remoteDeliveries = Array.isArray(deliveryRows)
      ? deliveryRows.map((row): HopeWallDeliveryRecord => ({
          id: row.id,
          messageId: row.message_id,
          recipientAccountId: row.recipient_account_id || '',
          recipientDeviceId: row.recipient_device_id,
          createdAt: row.created_at,
          favorite: Boolean(row.favorite),
        }))
      : [];
    const remoteReports = Array.isArray(reportRows)
      ? reportRows.map((row): HopeWallReportRecord => ({
          id: row.id,
          messageId: row.message_id,
          reporterAccountId: row.reporter_account_id || '',
          reporterDeviceId: row.reporter_device_id,
          createdAt: row.created_at,
          reason: row.reason || undefined,
        }))
      : [];

    if (remoteMessages.length > 0) {
      return {
        messages: remoteMessages,
        deliveries: remoteDeliveries,
        reports: remoteReports,
      } satisfies HopeWallFile;
    }
  }

  const file = await readJsonFile<HopeWallFile>(HOPE_FILE, {
    messages: seededMessages,
    deliveries: [],
      reports: [] as HopeWallReportRecord[],
    });

  if (!Array.isArray(file.messages) || file.messages.length === 0) {
    return {
      messages: seededMessages,
      deliveries: [] as HopeWallDeliveryRecord[],
      reports: [] as HopeWallReportRecord[],
    } satisfies HopeWallFile;
  }

  const normalized = {
    messages: file.messages,
    deliveries: Array.isArray(file.deliveries) ? file.deliveries : [],
    reports: Array.isArray(file.reports) ? file.reports : [],
  } satisfies HopeWallFile;

  if (isSupabaseAdminConfigured) {
    await writeStore(normalized);
  }

  return normalized;
}

async function writeStore(file: HopeWallFile) {
  if (isSupabaseAdminConfigured) {
    const supabase = getSupabaseAdmin();
    await supabase.from('hope_wall_reports').delete().neq('id', '');
    await supabase.from('hope_wall_deliveries').delete().neq('id', '');
    await supabase.from('hope_wall_messages').delete().neq('id', '');

    if (file.messages.length > 0) {
      const { error } = await supabase
        .from('hope_wall_messages')
        .insert(file.messages.map((message) => ({
          id: message.id,
          text: message.text,
          created_at: message.createdAt,
          status: message.status,
          moderated: message.moderated,
          anonymous_alias: message.anonymousAlias || null,
          account_id: message.accountId || '',
          device_id: message.deviceId,
          favorited_count: message.favoritedCount,
          delivery_count: message.deliveryCount,
          last_delivered_at: message.lastDeliveredAt || null,
          report_count: message.reportCount || 0,
        })));
      if (error) throw error;
    }

    if (file.deliveries.length > 0) {
      const { error } = await supabase
        .from('hope_wall_deliveries')
        .insert(file.deliveries.map((delivery) => ({
          id: delivery.id,
          message_id: delivery.messageId,
          recipient_account_id: delivery.recipientAccountId || '',
          recipient_device_id: delivery.recipientDeviceId,
          created_at: delivery.createdAt,
          favorite: delivery.favorite,
        })));
      if (error) throw error;
    }

    if (file.reports.length > 0) {
      const { error } = await supabase
        .from('hope_wall_reports')
        .insert(file.reports.map((report) => ({
          id: report.id,
          message_id: report.messageId,
          reporter_account_id: report.reporterAccountId || '',
          reporter_device_id: report.reporterDeviceId,
          created_at: report.createdAt,
          reason: report.reason || null,
        })));
      if (error) throw error;
    }

    return;
  }

  await writeJsonFile(HOPE_FILE, file);
}

export async function createHopeMessage(params: {
  text: string;
  accountId?: string | null;
  deviceId: string;
  anonymousAlias?: string | null;
}) {
  const trimmed = String(params.text || '').trim();
  const file = await readStore();
  const moderation = moderateText(trimmed);
  if (!moderation.allowed) {
    return { ok: false as const, reason: 'blocked_by_moderation' as const, moderationReason: moderation.reason };
  }

  const now = new Date().toISOString();
  const accountId = normalizeIdentity(params.accountId);
  const senderMessages = file.messages
    .filter((message) => (accountId ? normalizeIdentity(message.accountId) === accountId : message.deviceId === params.deviceId))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const nowMs = Date.now();
  const mostRecent = senderMessages[0];
  if (mostRecent && nowMs - new Date(mostRecent.createdAt).getTime() < MIN_SEND_INTERVAL_MS) {
    return { ok: false as const, reason: 'rate_limited' as const, retryAfterMs: MIN_SEND_INTERVAL_MS - (nowMs - new Date(mostRecent.createdAt).getTime()) };
  }
  const sentIn30Min = senderMessages.filter((message) => nowMs - new Date(message.createdAt).getTime() <= 30 * 60 * 1000).length;
  if (sentIn30Min >= MAX_SENDS_PER_30_MIN) {
    return { ok: false as const, reason: 'rate_limited_window' as const };
  }
  const sentToday = senderMessages.filter((message) => String(message.createdAt).slice(0, 10) === now.slice(0, 10)).length;
  if (sentToday >= MAX_SENDS_PER_DAY) {
    return { ok: false as const, reason: 'daily_limit' as const };
  }

  const alias = String(params.anonymousAlias || '').trim() || createAlias(accountId || params.deviceId);
  const record: HopeWallMessageRecord = {
    id: crypto.randomUUID(),
    text: trimmed,
    createdAt: now,
    status: 'active',
    moderated: true,
    anonymousAlias: alias,
    accountId,
    deviceId: params.deviceId,
    favoritedCount: 0,
    deliveryCount: 0,
    lastDeliveredAt: null,
    reportCount: 0,
  };

  file.messages.unshift(record);
  await writeStore(file);

  return { ok: true as const, item: record };
}

export async function listHopeWallMessages(limit = 24) {
  const file = await readStore();
  const items = file.messages
    .filter((item) => item.status === 'active' && item.moderated)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
  return items;
}

export async function receiveRandomHopeMessage(params: {
  accountId?: string | null;
  deviceId: string;
}) {
  const file = await readStore();
  const viewerKey = identityKey(params.accountId, params.deviceId);
  const recentDeliveries = file.deliveries
    .filter((delivery) => identityKey(delivery.recipientAccountId, delivery.recipientDeviceId) === viewerKey)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const recentMessageIds = new Set(recentDeliveries.slice(0, 12).map((entry) => entry.messageId));

  const pool = file.messages.filter((message) => {
    if (message.status !== 'active' || !message.moderated) return false;
    if (message.accountId && normalizeIdentity(message.accountId) === normalizeIdentity(params.accountId)) return false;
    if (!message.accountId && message.deviceId === params.deviceId) return false;
    if (recentMessageIds.has(message.id)) return false;
    return true;
  });

  const fallbackPool = pool.length
    ? pool
    : file.messages.filter((message) => {
        if (message.status !== 'active' || !message.moderated) return false;
        if (message.accountId && normalizeIdentity(message.accountId) === normalizeIdentity(params.accountId)) return false;
        if (!message.accountId && message.deviceId === params.deviceId) return false;
        return true;
      });

  if (!fallbackPool.length) return null;

  const nowTs = Date.now();
  const weighted = fallbackPool.map((message) => {
    const ageDays = Math.max(1, (nowTs - new Date(message.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const freshnessBoost = Math.min(ageDays, 14) * 0.08;
    const lowDeliveryBoost = Math.max(0, 4 - message.deliveryCount) * 1.35;
    const favoriteBoost = Math.min(Number(message.favoritedCount || 0), 5) * 0.28;
    const kindnessBoost = Math.min(
      careKeywords.reduce((acc, keyword) => acc + (message.text.toLowerCase().includes(keyword) ? 1 : 0), 0),
      4,
    ) * 0.22;
    const randomBoost = Math.random() * 1.2;
    const score = lowDeliveryBoost + freshnessBoost + favoriteBoost + kindnessBoost + randomBoost;
    return { message, score };
  });

  weighted.sort((a, b) => b.score - a.score);
  const picked = weighted[0].message;

  const delivery: HopeWallDeliveryRecord = {
    id: crypto.randomUUID(),
    messageId: picked.id,
    recipientAccountId: normalizeIdentity(params.accountId),
    recipientDeviceId: params.deviceId,
    createdAt: new Date().toISOString(),
    favorite: false,
  };

  file.deliveries.unshift(delivery);
  file.messages = file.messages.map((message) =>
    message.id === picked.id
      ? {
          ...message,
          deliveryCount: Number(message.deliveryCount || 0) + 1,
          lastDeliveredAt: delivery.createdAt,
        }
      : message,
  );

  await writeStore(file);

  return picked;
}

export async function getHopeHistory(params: {
  accountId?: string | null;
  deviceId: string;
}) {
  const file = await readStore();
  const accountId = normalizeIdentity(params.accountId);
  const viewerKey = identityKey(accountId, params.deviceId);

  const sent = file.messages
    .filter((message) => {
      if (accountId) return normalizeIdentity(message.accountId) === accountId;
      return !message.accountId && message.deviceId === params.deviceId;
    })
    .map((message) => ({
      ...message,
      source: 'sent' as const,
      favorite: false,
      date: new Date(message.createdAt).getTime(),
    }));

  const messageMap = new Map<string, HopeWallMessageRecord>(file.messages.map((message): [string, HopeWallMessageRecord] => [message.id, message]));
  const received = file.deliveries
    .filter((delivery) => identityKey(delivery.recipientAccountId, delivery.recipientDeviceId) === viewerKey)
    .map((delivery) => {
      const message = messageMap.get(delivery.messageId);
      if (!message) return null;
      return {
        ...message,
        source: 'received' as const,
        favorite: delivery.favorite,
        date: new Date(delivery.createdAt).getTime(),
      };
    })
    .filter(Boolean) as Array<HopeWallMessageRecord & { source: 'received'; favorite: boolean; date: number }>;

  return [...sent, ...received].sort((a, b) => b.date - a.date).slice(0, 80);
}

export async function setHopeFavorite(params: {
  messageId: string;
  accountId?: string | null;
  deviceId: string;
  favorite: boolean;
}) {
  const file = await readStore();
  const viewerKey = identityKey(params.accountId, params.deviceId);
  let favoriteDelta = 0;

  file.deliveries = file.deliveries.map((delivery) => {
    if (delivery.messageId !== params.messageId) return delivery;
    if (identityKey(delivery.recipientAccountId, delivery.recipientDeviceId) !== viewerKey) return delivery;
    if (delivery.favorite === params.favorite) return delivery;
    favoriteDelta += params.favorite ? 1 : -1;
    return { ...delivery, favorite: params.favorite };
  });

  if (favoriteDelta !== 0) {
    file.messages = file.messages.map((message) =>
      message.id === params.messageId
        ? { ...message, favoritedCount: Math.max(0, Number(message.favoritedCount || 0) + favoriteDelta) }
        : message,
    );
  }

  await writeStore(file);
  return { ok: true as const };
}

export async function reportHopeMessage(params: {
  messageId: string;
  accountId?: string | null;
  deviceId: string;
  reason?: string | null;
}) {
  const file = await readStore();
  const viewerKey = identityKey(params.accountId, params.deviceId);
  const alreadyReported = file.reports.some(
    (report) =>
      report.messageId === params.messageId &&
      identityKey(report.reporterAccountId, report.reporterDeviceId) === viewerKey,
  );
  if (alreadyReported) return { ok: true as const, alreadyReported: true };

  const report: HopeWallReportRecord = {
    id: crypto.randomUUID(),
    messageId: params.messageId,
    reporterAccountId: normalizeIdentity(params.accountId),
    reporterDeviceId: params.deviceId,
    createdAt: new Date().toISOString(),
    reason: String(params.reason || '').trim() || undefined,
  };
  file.reports.unshift(report);
  file.messages = file.messages.map((message) => {
    if (message.id !== params.messageId) return message;
    const nextReportCount = Number(message.reportCount || 0) + 1;
    return {
      ...message,
      reportCount: nextReportCount,
      status: nextReportCount >= 3 ? 'blocked' : message.status,
    };
  });
  await writeStore(file);
  return { ok: true as const, alreadyReported: false };
}
