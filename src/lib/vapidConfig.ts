type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export function getVapidConfig(): VapidConfig {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || '';

  if (!publicKey || !privateKey || !subject) {
    throw new Error('Push não configurado. Defina NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT.');
  }

  return { publicKey, privateKey, subject };
}

export function getPublicVapidKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

export function getPushDispatchSecret() {
  const secret = process.env.PUSH_DISPATCH_SECRET || '';
  if (!secret) {
    throw new Error('Push dispatch não configurado. Defina PUSH_DISPATCH_SECRET.');
  }
  return secret;
}

