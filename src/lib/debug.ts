/**
 * Debug Logging Utility for TheoShift
 * 
 * Provides configurable debug logging with different levels and contexts.
 * Can be enabled via environment variables for troubleshooting.
 */

export enum DebugLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export enum DebugContext {
  API = 'API',
  DATABASE = 'DATABASE',
  AUTH = 'AUTH',
  EMAIL = 'EMAIL',
  EVENTS = 'EVENTS',
  ASSIGNMENTS = 'ASSIGNMENTS',
  PRISMA = 'PRISMA',
  GENERAL = 'GENERAL'
}

interface DebugConfig {
  enabled: boolean
  level: DebugLevel
  contexts: Set<DebugContext>
  logToFile: boolean
  logFilePath: string
  includeTimestamp: boolean
  includeStackTrace: boolean
}

class DebugLogger {
  private config: DebugConfig

  constructor() {
    this.config = {
      enabled: process.env.DEBUG_ENABLED === 'true',
      level: this.parseDebugLevel(process.env.DEBUG_LEVEL || 'INFO'),
      contexts: this.parseDebugContexts(process.env.DEBUG_CONTEXTS || '*'),
      logToFile: process.env.DEBUG_LOG_TO_FILE === 'true',
      logFilePath: process.env.DEBUG_LOG_PATH || '/tmp/theoshift-debug.log',
      includeTimestamp: process.env.DEBUG_INCLUDE_TIMESTAMP !== 'false',
      includeStackTrace: process.env.DEBUG_INCLUDE_STACK === 'true'
    }
  }

  private parseDebugLevel(level: string): DebugLevel {
    const levelMap: Record<string, DebugLevel> = {
      ERROR: DebugLevel.ERROR,
      WARN: DebugLevel.WARN,
      INFO: DebugLevel.INFO,
      DEBUG: DebugLevel.DEBUG,
      TRACE: DebugLevel.TRACE
    }
    return levelMap[level.toUpperCase()] ?? DebugLevel.INFO
  }

  private parseDebugContexts(contexts: string): Set<DebugContext> {
    if (contexts === '*') {
      return new Set(Object.values(DebugContext))
    }
    const contextList = contexts.split(',').map(c => c.trim().toUpperCase())
    return new Set(
      contextList
        .filter(c => Object.values(DebugContext).includes(c as DebugContext))
        .map(c => c as DebugContext)
    )
  }

  private shouldLog(level: DebugLevel, context: DebugContext): boolean {
    if (!this.config.enabled) return false
    if (level > this.config.level) return false
    if (!this.config.contexts.has(context)) return false
    return true
  }

  private formatMessage(
    level: DebugLevel,
    context: DebugContext,
    message: string,
    data?: any
  ): string {
    const parts: string[] = []

    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`)
    }

    parts.push(`[${DebugLevel[level]}]`)
    parts.push(`[${context}]`)
    parts.push(message)

    if (data !== undefined) {
      parts.push('\n' + JSON.stringify(data, null, 2))
    }

    if (this.config.includeStackTrace && level === DebugLevel.ERROR) {
      const stack = new Error().stack
      if (stack) {
        parts.push('\nStack trace:\n' + stack)
      }
    }

    return parts.join(' ')
  }

  private writeLog(message: string): void {
    // Console output
    console.log(message)

    // File output (server-side only)
    if (this.config.logToFile && typeof window === 'undefined') {
      try {
        const fs = require('fs')
        fs.appendFileSync(this.config.logFilePath, message + '\n')
      } catch (error) {
        console.error('Failed to write to debug log file:', error)
      }
    }
  }

  error(context: DebugContext, message: string, data?: any): void {
    if (this.shouldLog(DebugLevel.ERROR, context)) {
      this.writeLog(this.formatMessage(DebugLevel.ERROR, context, message, data))
    }
  }

  warn(context: DebugContext, message: string, data?: any): void {
    if (this.shouldLog(DebugLevel.WARN, context)) {
      this.writeLog(this.formatMessage(DebugLevel.WARN, context, message, data))
    }
  }

  info(context: DebugContext, message: string, data?: any): void {
    if (this.shouldLog(DebugLevel.INFO, context)) {
      this.writeLog(this.formatMessage(DebugLevel.INFO, context, message, data))
    }
  }

  debug(context: DebugContext, message: string, data?: any): void {
    if (this.shouldLog(DebugLevel.DEBUG, context)) {
      this.writeLog(this.formatMessage(DebugLevel.DEBUG, context, message, data))
    }
  }

  trace(context: DebugContext, message: string, data?: any): void {
    if (this.shouldLog(DebugLevel.TRACE, context)) {
      this.writeLog(this.formatMessage(DebugLevel.TRACE, context, message, data))
    }
  }

  // Convenience method for Prisma queries
  prismaQuery(operation: string, model: string, args?: any): void {
    this.debug(DebugContext.PRISMA, `${operation} on ${model}`, args)
  }

  // Convenience method for API endpoints
  apiRequest(method: string, path: string, data?: any): void {
    this.info(DebugContext.API, `${method} ${path}`, data)
  }

  // Convenience method for database operations
  dbOperation(operation: string, details?: any): void {
    this.debug(DebugContext.DATABASE, operation, details)
  }
}

// Singleton instance
export const debugLogger = new DebugLogger()

// Export convenience functions
export const debug = {
  error: (context: DebugContext, message: string, data?: any) => 
    debugLogger.error(context, message, data),
  warn: (context: DebugContext, message: string, data?: any) => 
    debugLogger.warn(context, message, data),
  info: (context: DebugContext, message: string, data?: any) => 
    debugLogger.info(context, message, data),
  debug: (context: DebugContext, message: string, data?: any) => 
    debugLogger.debug(context, message, data),
  trace: (context: DebugContext, message: string, data?: any) => 
    debugLogger.trace(context, message, data),
  prismaQuery: (operation: string, model: string, args?: any) => 
    debugLogger.prismaQuery(operation, model, args),
  apiRequest: (method: string, path: string, data?: any) => 
    debugLogger.apiRequest(method, path, data),
  dbOperation: (operation: string, details?: any) => 
    debugLogger.dbOperation(operation, details)
}
