import { AuthError } from '@supabase/supabase-js'
import type { APIResponse } from './validations'

export class AppError extends Error {
  public statusCode: number
  public code?: string

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export class ValidationError extends AppError {
  public field?: string

  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
    this.field = field
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR')
    this.name = 'ConflictError'
  }
}

/**
 * Handle Supabase Auth errors and convert to appropriate AppError
 */
export function handleAuthError(error: AuthError): AppError {
  switch (error.message) {
    case 'Invalid login credentials':
      return new AuthenticationError('Invalid email or password')
    case 'Email not confirmed':
      return new AuthenticationError('Please verify your email address before signing in')
    case 'User already registered':
      return new ConflictError('An account with this email already exists')
    case 'Password should be at least 6 characters':
      return new ValidationError('Password must be at least 6 characters')
    default:
      return new AppError(error.message, 400, 'AUTH_ERROR')
  }
}

/**
 * Handle database errors and convert to appropriate AppError
 */
export function handleDatabaseError(error: any): AppError {
  if (error.code === '23505') {
    // Unique constraint violation
    if (error.constraint?.includes('username')) {
      return new ConflictError('Username is already taken')
    }
    return new ConflictError('Resource already exists')
  }
  
  if (error.code === '23503') {
    // Foreign key constraint violation
    return new ValidationError('Referenced resource does not exist')
  }
  
  if (error.code === '23514') {
    // Check constraint violation
    return new ValidationError('Invalid data provided')
  }
  
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR')
}

/**
 * Create a standardized API response
 */
export function createAPIResponse<T>(
  data?: T,
  error?: { message: string; code?: string; details?: any }
): APIResponse<T> {
  return {
    data,
    error,
    success: !error
  }
}

/**
 * Create an error API response from an AppError
 */
export function createErrorResponse(error: AppError): APIResponse {
  return createAPIResponse(undefined, {
    message: error.message,
    code: error.code,
    details: error instanceof ValidationError && error.field ? [{ field: error.field, message: error.message }] : undefined
  })
}

/**
 * Handle and format errors for API responses
 */
export function handleAPIError(error: unknown): APIResponse {
  console.error('API Error:', error)
  
  if (error instanceof AppError) {
    return createErrorResponse(error)
  }
  
  if (error instanceof AuthError) {
    return createErrorResponse(handleAuthError(error))
  }
  
  // Handle Supabase database errors
  if (error && typeof error === 'object' && 'code' in error) {
    return createErrorResponse(handleDatabaseError(error))
  }
  
  // Generic error fallback
  return createAPIResponse(undefined, {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  })
}