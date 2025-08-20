import { AuthError, PostgrestError } from '@supabase/supabase-js'

export interface APIError {
  message: string
  code?: string
  details?: ValidationError[]
}

export interface APIResponse<T> {
  data: T
  error?: APIError
  status: number
}

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

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed') {
    super(message, 400, 'FILE_UPLOAD_ERROR')
    this.name = 'FileUploadError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 503, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error occurred') {
    super(message, 500, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

/**
 * Helper function to create consistent API responses
 */
export function createAPIResponse<T>(data: T, error?: APIError | null, status: number = 200): APIResponse<T> {
  return {
    data,
    error: error || undefined,
    status
  }
}

/**
 * Helper function to create error responses
 */
export function createAPIErrorResponse(error: AppError | AuthError | Error): APIResponse<null> {
  const statusCode = error instanceof AppError ? error.statusCode : 500
  const code = error instanceof AppError ? error.code : 'INTERNAL_SERVER_ERROR'

  return {
    data: null,
    error: {
      message: error.message,
      code
    },
    status: statusCode
  }
}

/**
 * Helper function to handle API errors
 */
export function handleAPIError(error: unknown): never {
  if (error instanceof AppError) {
    throw error
  }
  if (error instanceof AuthError) {
    throw new AuthenticationError(error.message)
  }
  if (error instanceof Error) {
    throw new AppError(error.message)
  }
  if (typeof error === 'string') {
    throw new AppError(error)
  }
  throw new AppError('An unexpected error occurred')
}

/**
 * Helper function to handle Supabase database errors
 */
export function handleDatabaseError(error: PostgrestError | Error): never {
  if ('code' in error) {
    // Handle specific Postgres error codes
    switch (error.code) {
      case '23505': // unique_violation
        throw new ConflictError(error.message)
      case '23503': // foreign_key_violation
        throw new ValidationError(error.message)
      default:
        throw new DatabaseError(error.message)
    }
  }
  throw new DatabaseError(error.message)
}

/**
 * Helper function to handle authentication errors
 */
export function handleAuthError(error: AuthError | Error): never {
  if (error instanceof AuthError) {
    // Map Supabase auth errors to more user-friendly messages
    switch (error.status) {
      case 400:
        if (error.message.includes('email already taken')) {
          throw new ConflictError('This email is already registered')
        }
        if (error.message.includes('password')) {
          throw new ValidationError('Password must be at least 6 characters long')
        }
        break
      case 401:
        throw new AuthenticationError('Invalid email or password')
      case 422:
        throw new ValidationError('Invalid email format')
    }
    // Default error message
    throw new AuthenticationError(error.message)
  }
  throw error
}
