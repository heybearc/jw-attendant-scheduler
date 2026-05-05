export interface ChatEnabledEmailData {
  firstName: string
  eventName: string
  eventStartDate?: string
  eventEndDate?: string
  dashboardUrl: string
  customMessage?: string
}

export function generateChatEnabledEmail(data: ChatEnabledEmailData): string {
  const eventWindow =
    data.eventStartDate && data.eventEndDate
      ? `${data.eventStartDate} - ${data.eventEndDate}`
      : data.eventStartDate || data.eventEndDate || 'See dashboard for details'

  const messageBlock = data.customMessage
    ? `
      <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 12px 14px; border-radius: 6px; margin: 18px 0;">
        <p style="margin: 0; color: #5b21b6; font-size: 14px; line-height: 1.5;"><strong>Message from your oversight team:</strong><br/>${data.customMessage}</p>
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Chat Is Available</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#2563eb;color:#fff;padding:28px 20px;text-align:center;">
          <h1 style="margin:0;font-size:24px;">💬 Event Chat Is Now Available</h1>
          <p style="margin:10px 0 0 0;font-size:15px;opacity:.95;">Real-time updates are now available in your TheoShift dashboard.</p>
        </div>
        <div style="padding:24px 20px;">
          <p style="margin:0 0 14px 0;color:#374151;">Hello ${data.firstName},</p>
          <p style="margin:0 0 14px 0;color:#4b5563;line-height:1.6;">
            Event chat has been enabled for <strong>${data.eventName}</strong>. You can now receive announcements and coordinate in real time using your existing magic-link dashboard access.
          </p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin:16px 0;">
            <p style="margin:0;color:#1e3a8a;font-size:14px;"><strong>Event:</strong> ${data.eventName}</p>
            <p style="margin:8px 0 0 0;color:#1e3a8a;font-size:14px;"><strong>Dates:</strong> ${eventWindow}</p>
          </div>
          ${messageBlock}
          <div style="margin:18px 0;">
            <p style="margin:0;color:#4b5563;line-height:1.6;">Inside chat you will see channels such as:</p>
            <ul style="margin:8px 0 0 20px;color:#4b5563;line-height:1.6;">
              <li>Event Announcements</li>
              <li>Event General</li>
              <li>Position-specific channels (when assigned)</li>
            </ul>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">
              Open Dashboard
            </a>
          </div>
        </div>
        <div style="background:#374151;color:#d1d5db;padding:18px 20px;text-align:center;">
          <p style="margin:0;font-size:13px;">TheoShift - Supporting Theocratic Event Coordination</p>
        </div>
      </div>
    </body>
    </html>
  `
}
