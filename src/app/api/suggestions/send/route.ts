import { NextResponse } from 'next/server';

type SuggestionType = 'sugestao' | 'melhoria' | 'bug' | 'elogio' | 'recurso';

const TYPE_LABELS: Record<SuggestionType, string> = {
  sugestao: 'Sugestão',
  melhoria: 'Melhoria',
  bug: 'Bug',
  elogio: 'Elogio',
  recurso: 'Pedido de recurso',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, title, message, where, expected, meta } = body as {
      type: SuggestionType;
      title: string;
      message: string;
      where?: string;
      expected?: string;
      meta?: {
        source?: string;
        platform?: string;
        userAgent?: string;
        language?: string;
        viewport?: string;
        currentUrl?: string;
        sentAt?: string;
      };
    };

    if (!type || !title?.trim() || !message?.trim()) {
      return NextResponse.json({ ok: false, error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.SUGGESTIONS_TO_EMAIL;
    const from = process.env.SUGGESTIONS_FROM_EMAIL;

    if (!apiKey || !to || !from) {
      return NextResponse.json(
        {
          ok: false,
          code: 'email_config_missing',
          error: 'Configuração de e-mail ausente. Defina RESEND_API_KEY, SUGGESTIONS_TO_EMAIL e SUGGESTIONS_FROM_EMAIL.',
          fallbackTo: to || null,
        },
        { status: 500 }
      );
    }

    const lines = [
      `Tipo: ${TYPE_LABELS[type]}`,
      `Título: ${title.trim()}`,
      '',
      'Mensagem:',
      message.trim(),
    ];

    if (where?.trim()) {
      lines.push('', 'Onde isso aconteceu:', where.trim());
    }

    if (expected?.trim()) {
      lines.push('', type === 'bug' ? 'O que você esperava / o que deu errado:' : 'O que você esperava:');
      lines.push(expected.trim());
    }

    const metaLines = [
      meta?.source ? `Origem: ${meta.source}` : '',
      meta?.platform ? `Plataforma: ${meta.platform}` : '',
      meta?.language ? `Idioma: ${meta.language}` : '',
      meta?.viewport ? `Viewport: ${meta.viewport}` : '',
      meta?.currentUrl ? `URL atual: ${meta.currentUrl}` : '',
      meta?.sentAt ? `Enviado em: ${meta.sentAt}` : '',
      meta?.userAgent ? `User-Agent: ${meta.userAgent}` : '',
    ].filter(Boolean);

    if (metaLines.length > 0) {
      lines.push('', 'Contexto técnico:', ...metaLines);
    }

    const text = lines.join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin:0 0 16px;">${TYPE_LABELS[type]} - Sereno</h2>
        <p><strong>Título:</strong> ${escapeHtml(title.trim())}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${escapeHtml(message.trim()).replace(/\n/g, '<br/>')}</p>
        ${where?.trim() ? `<p><strong>Onde isso aconteceu:</strong><br/>${escapeHtml(where.trim()).replace(/\n/g, '<br/>')}</p>` : ''}
        ${expected?.trim() ? `<p><strong>${type === 'bug' ? 'O que você esperava / o que deu errado' : 'O que você esperava'}:</strong><br/>${escapeHtml(expected.trim()).replace(/\n/g, '<br/>')}</p>` : ''}
        ${metaLines.length > 0 ? `<p><strong>Contexto técnico:</strong><br/>${metaLines.map((line) => escapeHtml(line)).join('<br/>')}</p>` : ''}
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[${TYPE_LABELS[type]}] ${title.trim()} - Sereno`,
        text,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      return NextResponse.json({ ok: false, error: resendError || 'Falha ao enviar e-mail.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
