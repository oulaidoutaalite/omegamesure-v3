import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromAddress = process.env.EMAIL_FROM ?? 'Omega Mesure <noreply@omegamesure.com>'

let client: Resend | null = null
function getClient(): Resend | null {
  if (!apiKey) return null
  if (!client) client = new Resend(apiKey)
  return client
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean }

/**
 * Send an email via Resend. If no RESEND_API_KEY is set the call is logged
 * to the console and reported as { ok:false, skipped:true } — handy for dev.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const c = getClient()
  if (!c) {
    // eslint-disable-next-line no-console
    console.warn('[email] RESEND_API_KEY not configured — message NOT sent\n', {
      to: input.to,
      subject: input.subject,
    })
    return { ok: false, error: 'RESEND_API_KEY not configured', skipped: true }
  }

  try {
    const res = await c.emails.send({
      from: fromAddress,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    })
    if (res.error) return { ok: false, error: res.error.message }
    return { ok: true, id: res.data?.id ?? 'unknown' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

// ─── HTML helpers ───────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function wrapEmail(content: string, options: { title?: string } = {}): string {
  const title = options.title ?? 'Omega Mesure'
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;">
      <tr><td align="center" style="padding:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="background:#185FA5;color:#fff;padding:20px 28px;font-size:16px;font-weight:600;letter-spacing:0.2px;">
            Omega Mesure
          </td></tr>
          <tr><td style="padding:28px;font-size:14px;line-height:1.6;">
            ${content}
          </td></tr>
          <tr><td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
            Omega Mesure et instrumentation · N°35 Lotissement Doha, Bouskoura, Maroc<br />
            <a href="mailto:contact@omegamesure.com" style="color:#185FA5;">contact@omegamesure.com</a>
            &nbsp;·&nbsp;+212 664 323 049
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}
