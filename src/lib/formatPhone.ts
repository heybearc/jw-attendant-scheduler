/**
 * Format a phone number to (XXX) XXX-XXXX format
 * Handles various input formats and returns formatted string
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return ''
  
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Format based on length
  if (numbers.length === 0) return ''
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
  if (numbers.length <= 10) return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`
  
  // Limit to 10 digits
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
}

/**
 * Strip formatting from phone number to get raw digits
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Validate if a phone number is complete (10 digits)
 */
export function isValidPhoneNumber(value: string): boolean {
  const numbers = value.replace(/\D/g, '')
  return numbers.length === 10
}
