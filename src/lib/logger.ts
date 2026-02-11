/**
 * Environment-aware logging utility
 * Logs are only output in development mode or when DEBUG environment variable is set
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugMode = process.env.DEBUG === 'true'

export const logger = {
  /**
   * Log debug information (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Log informational messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.info('[INFO]', ...args)
    }
  },

  /**
   * Log warnings (always logged)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Log errors (always logged)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },

  /**
   * Log API requests (only in development)
   */
  api: (method: string, path: string, data?: any) => {
    if (isDevelopment || isDebugMode) {
      console.log(`[API] ${method} ${path}`, data ? data : '')
    }
  }
}
