import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError } from '@supabase/supabase-js'
import { AppError } from '@/lib/errors'
import { 
  ErrorWithCode,
  APIResponse,
  APIError,
  ValidationError
} from '@/types'

/**
 * Helper to create API responses for route handlers
 */
export function createAPIResponse<T>(data: T, status: number = 200): NextResponse {
  const response: APIResponse<T> = {
    data,
    status
  }
  return NextResponse.json(response, { status })
}

/**
 * Helper to create error responses for route handlers
 */
export function createErrorResponse(error: APIError, status: number): NextResponse {
  const response: APIResponse<undefined> = {
    data: undefined,
    error,
    status
  }
  return NextResponse.json(response, { status })
}

/**
 * Global API error handler middleware
 */
export function withErrorHandler(
  handler: (request: NextRequest, params?: unknown) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, params)
    } catch (error) {
      return handleAPIError(error, request)
    }
  }
}

/**
 * Comprehensive API error handler
 */
export function handleAPIError(error: unknown, request?: NextRequest): NextResponse {
  console.error('API Error:', {
    error,
    url: request?.url,
    method: request?.method,
    timestamp: new Date().toISOString()
  })

  // Log error details for monitoring (in production, send to logging service)
  if (process.env.NODE_ENV === 'production') {
    logErrorToService(error, request)
  }

  // Handle known error types
  if (error instanceof AppError) {
    return createErrorResponse({
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }, error.statusCode)
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors: ValidationError[] = error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
    
    return createErrorResponse({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors
    }, 400)
  }

  // Handle Supabase Auth errors
  if (error instanceof AuthError) {
    const { message, status } = mapAuthError(error)
    return createErrorResponse({
      message,
      code: 'AUTH_ERROR'
    }, status)
  }

  // Handle database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as ErrorWithCode
    const { message, status, code } = mapDatabaseError(dbError)
    
    return createErrorResponse({
      message,
      code
    }, status)
  }

  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createErrorResponse({
      message: 'Network request failed',
      code: 'NETWORK_ERROR'
    }, 503)
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return createErrorResponse({
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    }, 400)
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return createErrorResponse({
      message: 'Request timeout',
      code: 'TIMEOUT_ERROR'
    }, 408)
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return createErrorResponse({
    message: isDevelopment && error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && error instanceof Error && {
      stack: error.stack
    })
  }, 500)
}

/**
 * Map Supabase Auth errors to appropriate responses
 */
function mapAuthError(error: AuthError): { message: string; status: number } {
  switch (error.message) {
    case 'Invalid login credentials':
      return { message: 'Invalid email or password', status: 401 }
    case 'Email not confirmed':
      return { message: 'Please verify your email address', status: 401 }
    case 'User already registered':
      return { message: 'An account with this email already exists', status: 409 }
    case 'Password should be at least 6 characters':
      return { message: 'Password must be at least 6 characters', status: 400 }
    case 'Invalid refresh token':
      return { message: 'Session expired, please sign in again', status: 401 }
    case 'Token has expired':
      return { message: 'Session expired, please sign in again', status: 401 }
    default:
      return { message: error.message || 'Authentication error', status: 401 }
  }
}

/**
 * Database error with code property
 */
interface DatabaseError {
  code: string
  message: string
  constraint?: string
}

/**
 * Map database errors to appropriate responses
 */
function mapDatabaseError(error: ErrorWithCode): { message: string; status: number; code: string } {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      if (error.constraint?.includes('username')) {
        return { message: 'Username is already taken', status: 409, code: 'USERNAME_TAKEN' }
      }
      if (error.constraint?.includes('email')) {
        return { message: 'Email is already registered', status: 409, code: 'EMAIL_TAKEN' }
      }
      return { message: 'Resource already exists', status: 409, code: 'DUPLICATE_ENTRY' }
    
    case '23503': // Foreign key violation
      return { message: 'Referenced resource does not exist', status: 400, code: 'INVALID_REFERENCE' }
    
    case '23514': // Check violation
      return { message: 'Data violates database constraints', status: 400, code: 'CONSTRAINT_VIOLATION' }
    
    case '23502': // Not null violation
      return { message: 'Required field is missing', status: 400, code: 'MISSING_REQUIRED_FIELD' }
    
    case '42P01': // Undefined table
      return { message: 'Database table not found', status: 500, code: 'DATABASE_SCHEMA_ERROR' }
    
    case '42703': // Undefined column
      return { message: 'Database column not found', status: 500, code: 'DATABASE_SCHEMA_ERROR' }
    
    case '53300': // Too many connections
      return { message: 'Database connection limit reached', status: 503, code: 'DATABASE_OVERLOAD' }
    
    case '57014': // Query canceled
      return { message: 'Database query timeout', status: 408, code: 'DATABASE_TIMEOUT' }
    
    default:
      return { message: 'Database operation failed', status: 500, code: 'DATABASE_ERROR' }
  }
}

/**
 * Rate limiting error handler
 */
export function handleRateLimit(identifier: string, limit: number, windowMs: number): NextResponse | null {
  // Simple in-memory rate limiting (use Redis in production)
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
  
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return null // No rate limit exceeded
  }

  if (record.count >= limit) {
    return createErrorResponse({
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    }, 429)
  }

  record.count++
  return null // No rate limit exceeded
}

/**
 * CORS error handler
 */
export function handleCORS(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

  if (origin && !allowedOrigins.includes(origin)) {
    return createErrorResponse({
      message: 'CORS policy violation',
      code: 'CORS_ERROR'
    }, 403)
  }

  return null // CORS check passed
}

/**
 * Request size validation
 */
export function validateRequestSize(request: NextRequest, maxSizeBytes: number = 10 * 1024 * 1024): NextResponse | null {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return createErrorResponse({
      message: `Request body too large. Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
      code: 'REQUEST_TOO_LARGE'
    }, 413)
  }

  return null // Size check passed
}

/**
 * Log errors to external service (implement based on your logging service)
 */
function logErrorToService(error: unknown, request?: NextRequest) {
  // Example implementation - replace with your logging service
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    },
    request: request ? {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      userAgent: request.headers.get('user-agent')
    } : undefined,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  }

  // In production, send to logging service like Sentry, LogRocket, etc.
  console.error('Error logged:', errorLog)
}

/**
 * Health check for error monitoring
 */
export function createHealthCheckResponse(): NextResponse {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV
  })
}

/**
 * Middleware wrapper for API routes with comprehensive error handling
 */
export function createAPIRoute(
  handler: (request: NextRequest, params?: unknown) => Promise<NextResponse>,
  options: {
    rateLimit?: { limit: number; windowMs: number }
    maxRequestSize?: number
    requireAuth?: boolean
    requireAdmin?: boolean
  } = {}
) {
  return async (request: NextRequest, params?: unknown): Promise<NextResponse> => {
    try {
      // CORS check
      const corsError = handleCORS(request)
      if (corsError) return corsError

      // Request size validation
      if (options.maxRequestSize) {
        const sizeError = validateRequestSize(request, options.maxRequestSize)
        if (sizeError) return sizeError
      }

      // Rate limiting
      if (options.rateLimit) {
        const clientIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown'
        const rateLimitError = handleRateLimit(
          clientIP, 
          options.rateLimit.limit, 
          options.rateLimit.windowMs
        )
        if (rateLimitError) return rateLimitError
      }

      // Execute the handler
      return await handler(request, params)
    } catch (error) {
      return handleAPIError(error, request)
    }
  }
}