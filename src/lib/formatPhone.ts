/**
 * Format a phone number to (XXX) XXX-XXXX format
 * Handles paste/typing of digits, dashes, dots, spaces, and optional +1 / leading 1.
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return ''

  let numbers = value.replace(/\D/g, '')

  // US/Canada: drop country code when pasted as 1XXXXXXXXXX or +1...
  if (numbers.length === 11 && numbers.startsWith('1')) {
    numbers = numbers.slice(1)
  }
  if (numbers.length > 10 && numbers.startsWith('1')) {
    numbers = numbers.slice(1, 11)
  } else if (numbers.length > 10) {
    numbers = numbers.slice(0, 10)
  }

  if (numbers.length === 0) return ''
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
}

/**
 * Strip formatting from phone number to get raw digits
 */
export function unformatPhoneNumber(value: string): string {
  let numbers = value.replace(/\D/g, '')
  if (numbers.length === 11 && numbers.startsWith('1')) {
    numbers = numbers.slice(1)
  }
  return numbers.slice(0, 10)
}

/**
 * Validate if a phone number is complete (10 digits)
 */
export function isValidPhoneNumber(value: string): boolean {
  return unformatPhoneNumber(value).length === 10
}

/**
 * Normalize for storage: empty → ''; otherwise (XXX) XXX-XXXX when possible.
 */
export function normalizePhoneForStorage(value: string | null | undefined): string {
  if (value == null) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  return formatPhoneNumber(trimmed)
}
