/**
 * Standardized error handling utility
 * Provides consistent error handling patterns across all services
 */

import { framer } from 'framer-plugin'
import { debugLog } from './debugLog'

export interface ServiceError {
  message: string
  code?: string
  context?: Record<string, unknown>
  originalError?: unknown
}

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Create a standardized error object
 */
export function createServiceError(
  message: string,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  context?: Record<string, unknown>,
  originalError?: unknown
): ServiceError {
  return {
    message,
    code,
    context,
    originalError
  }
}

/**
 * Extract error message from unknown error type
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'Unknown error occurred'
}

/**
 * Handle service errors with consistent logging and user notification
 */
export function handleServiceError(
  error: unknown,
  context: string,
  options: {
    notifyUser?: boolean
    logLevel?: 'error' | 'warn' | 'info'
    defaultMessage?: string
    code?: ErrorCode
  } = {}
): ServiceError {
  const {
    notifyUser = false,
    logLevel = 'error',
    defaultMessage = 'An error occurred',
    code = ErrorCode.UNKNOWN_ERROR
  } = options

  const message = extractErrorMessage(error)
  const serviceError = createServiceError(
    message || defaultMessage,
    code,
    { context },
    error
  )

  // Log error
  if (logLevel === 'error') {
    debugLog.error(`[${context}] ${message}`, { error, context })
  } else if (logLevel === 'warn') {
    debugLog.warn(`[${context}] ${message}`, { error, context })
  } else {
    debugLog.info(`[${context}] ${message}`, { error, context })
  }

  // Notify user if requested
  if (notifyUser) {
    framer.notify(message || defaultMessage, { variant: 'error' })
  }

  return serviceError
}

/**
 * Wrap async function with standardized error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  options: {
    notifyUser?: boolean
    logLevel?: 'error' | 'warn' | 'info'
    defaultMessage?: string
    fallbackValue?: T
  } = {}
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleServiceError(error, context, {
      notifyUser: options.notifyUser ?? false,
      logLevel: options.logLevel ?? 'error',
      defaultMessage: options.defaultMessage
    })
    return options.fallbackValue ?? null
  }
}

/**
 * Handle errors that should return empty arrays (non-critical)
 */
export async function withEmptyArrayFallback<T>(
  fn: () => Promise<T[]>,
  context: string
): Promise<T[]> {
  try {
    return await fn()
  } catch (error) {
    handleServiceError(error, context, {
      notifyUser: false,
      logLevel: 'warn',
      defaultMessage: `Failed to ${context}, returning empty array`
    })
    return []
  }
}

/**
 * Handle errors that should return null (non-critical)
 */
export async function withNullFallback<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    handleServiceError(error, context, {
      notifyUser: false,
      logLevel: 'warn',
      defaultMessage: `Failed to ${context}, returning null`
    })
    return null
  }
}

