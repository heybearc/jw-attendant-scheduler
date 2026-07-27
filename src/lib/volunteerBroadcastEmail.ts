export interface VolunteerBroadcastEmailData {
  firstName: string
  eventName: string
  eventStartDate?: string
  eventEndDate?: string
  dashboardUrl: string
  messageHtml: string
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Plain-text message converted to HTML paragraphs (preserves blank lines). */
export function formatPlainMessageAsHtml(
  message: string,
  options?: { color?: string; marginBottom?: string }
): string {
  const color = options?.color ?? '#374151'
  const marginBottom = options?.marginBottom ?? '12px'
  const escaped = escapeHtml(String(message ?? '').replace(/\r\n/g, '\n').trim())
  if (!escaped) return ''
  return escaped
    .split('\n')
    .map(
      (line) =>
        `<p style="margin:0 0 ${marginBottom} 0;color:${color};line-height:1.6;">${line || '&nbsp;'}</p>`
    )
    .join('')
}

export function generateVolunteerBroadcastEmail(data: VolunteerBroadcastEmailData): string {
  const eventWindow =
    data.eventStartDate && data.eventEndDate
      ? `${data.eventStartDate} – ${data.eventEndDate}`
      : data.eventStartDate || data.eventEndDate || ''

  const eventMeta =
    eventWindow &&
    `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <p style="margin:0;color:#1e3a8a;font-size:14px;"><strong>Event:</strong> ${escapeHtml(data.eventName)}</p>
      <p style="margin:8px 0 0 0;color:#1e3a8a;font-size:14px;"><strong>Dates:</strong> ${escapeHtml(eventWindow)}</p>
    </div>`

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#2563eb;color:#fff;padding:24px 20px;text-align:center;">
          <h1 style="margin:0;font-size:22px;">Message about your event</h1>
          <p style="margin:10px 0 0 0;font-size:15px;opacity:.95;">${escapeHtml(data.eventName)}</p>
        </div>
        <div style="padding:24px 20px;">
          <p style="margin:0 0 14px 0;color:#374151;">Hello ${escapeHtml(data.firstName)},</p>
          ${eventMeta || ''}
          <div style="margin:18px 0;">
            ${data.messageHtml}
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">
              Open volunteer dashboard
            </a>
          </div>
          <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;">
            You received this email because you are on the volunteer roster for this event in TheoShift.
          </p>
        </div>
        <div style="background:#374151;color:#d1d5db;padding:18px 20px;text-align:center;">
          <p style="margin:0;font-size:13px;">TheoShift</p>
        </div>
      </div>
    </body>
    </html>
  `
}
