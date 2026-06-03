export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
}

type ConfirmHandler = (options: ConfirmOptions) => Promise<boolean>

let handler: ConfirmHandler | null = null

export function registerConfirmHandler(next: ConfirmHandler) {
  handler = next
}

export async function appConfirm(options: ConfirmOptions): Promise<boolean> {
  if (handler) {
    return handler(options)
  }
  if (typeof window !== 'undefined') {
    return window.confirm(`${options.title}\n\n${options.message}`)
  }
  return false
}

/** Drop-in for simple confirm(message) strings */
export async function appConfirmMessage(message: string, title = 'Confirm'): Promise<boolean> {
  return appConfirm({ title, message })
}
