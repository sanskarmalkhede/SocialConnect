import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema, ZodError } from 'zod'
import { createAPIResponse } from '@/lib/errors'

/**
 * Validation middleware for API routes
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest, handler: (data: T) => Promise<NextResponse>) => {
    try {
      let data: any

      // Handle different content types
      const contentType = request.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        data = await request.json()
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData()
        data = Object.fromEntries(formData.entries())
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        data = Object.fromEntries(formData.entries())
      } else {
        // Try to parse as JSON by default
        try {
          data = await request.json()
        } catch {
          data = {}
        }
      }

      // Validate data against schema
      const validatedData = schema.parse(data)
      
      // Call the handler with validated data
      return await handler(validatedData)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          createAPIResponse(undefined, {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }),
          { status: 400 }
        )
      }

      // Re-throw other errors
      throw error
    }
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>, request: NextRequest): T {
  const { searchParams } = new URL(request.url)
  const queryData = Object.fromEntries(searchParams.entries())
  
  try {
    return schema.parse(queryData)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Query validation failed: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

/**
 * Validate file uploads
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
    required?: boolean
  } = {}
): void {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB default
    allowedTypes = ['image/jpeg', 'image/png'],
    required = false
  } = options

  if (!file) {
    if (required) {
      throw new Error('File is required')
    }
    return
  }

  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`)
  }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(content: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 1000) // Limit length to prevent abuse
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  // This would typically use Redis or a database in production
  // For now, using in-memory storage (not suitable for production)
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
  
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

/**
 * Custom validation schemas for specific use cases
 */

// Pagination validation
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).pipe(z.number().min(1).max(100))
})

// Search validation
export const searchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  category: z.enum(['general', 'announcement', 'question']).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'like_count', 'comment_count']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// ID validation
export const idSchema = z.object({
  id: z.string().uuid('Invalid ID format')
})

// Bulk operations validation
export const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.string().min(1)
})

// Admin filters validation
export const adminFiltersSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

/**
 * Validation error formatter
 */
export function formatValidationErrors(errors: ZodError): Array<{ field: string; message: string }> {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message
  }))
}

/**
 * Custom validation rules
 */
export const customValidations = {
  // Username validation with availability check
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .refine(async (username) => {
      // This would check username availability in a real app
      return true
    }, 'Username is already taken'),

  // Strong password validation
  strongPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number')
    .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character'),

  // URL validation with protocol
  urlWithProtocol: z.string()
    .url('Please enter a valid URL')
    .refine(url => url.startsWith('http://') || url.startsWith('https://'), 
      'URL must include http:// or https://'),

  // File size validation
  fileSize: (maxSizeMB: number) => z.instanceof(File)
    .refine(file => file.size <= maxSizeMB * 1024 * 1024, 
      `File size must be less than ${maxSizeMB}MB`),

  // Image file validation
  imageFile: z.instanceof(File)
    .refine(file => file.type.startsWith('image/'), 'File must be an image')
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed')
}

/**
 * Environment-specific validation
 */
export const envValidation = {
  development: {
    // More lenient validation for development
    password: z.string().min(6),
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  production: {
    // Strict validation for production
    password: customValidations.strongPassword,
    fileSize: 2 * 1024 * 1024 // 2MB
  }
}