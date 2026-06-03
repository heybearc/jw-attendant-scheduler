export type PromptOptions = {
  title: string
  message: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  requiredValue?: string
  inputLabel?: string
  tone?: 'danger' | 'default'
}

type PromptHandler = (options: PromptOptions) => Promise<string | null>

let handler: PromptHandler | null = null

export function registerPromptHandler(next: PromptHandler) {
  handler = next
}

export async function appPrompt(options: PromptOptions): Promise<string | null> {
  if (handler) {
    return handler(options)
  }
  if (typeof window !== 'undefined') {
    return window.prompt(`${options.title}\n\n${options.message}`, options.defaultValue ?? '')
  }
  return null
}
