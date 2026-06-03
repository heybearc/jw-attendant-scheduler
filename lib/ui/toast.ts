export type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

let api: ToastApi | null = null

export function registerToastApi(next: ToastApi) {
  api = next
}

function fallback(message: string, tone: keyof ToastApi) {
  if (typeof window !== 'undefined') {
    console.warn(`[toast:${tone}]`, message)
  }
}

export const toast: ToastApi = {
  success: (message) => api?.success(message) ?? fallback(message, 'success'),
  error: (message) => api?.error(message) ?? fallback(message, 'error'),
  info: (message) => api?.info(message) ?? fallback(message, 'info'),
}

/** Maps legacy alert() messages to the appropriate toast tone. */
export function notifyAlert(message: string): void {
  const trimmed = message.trim()
  const isSuccess =
    /^✅/.test(trimmed) ||
    /successfully/i.test(trimmed) ||
    /permanently deleted/i.test(trimmed) ||
    /^Event deleted/i.test(trimmed) ||
    /^Assignment (created|updated|deleted)/i.test(trimmed) ||
    /^Position (created|updated|deleted)/i.test(trimmed)
  const isInfo = /^⚠️/.test(trimmed) && !/failed/i.test(trimmed)

  if (isSuccess) {
    toast.success(trimmed.replace(/^✅\s*/, ''))
    return
  }
  if (isInfo) {
    toast.info(trimmed.replace(/^⚠️\s*/, ''))
    return
  }
  toast.error(trimmed.replace(/^❌\s*/, ''))
}
