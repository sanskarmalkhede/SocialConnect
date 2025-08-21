import { z } from 'zod'
import { CONTENT_LIMITS, POST_CATEGORIES } from '@/constants'

/**
 * Post content validation
 */
export function validatePostContent(content: string): { isValid: boolean; error?: string } {
  if (!content || !content.trim()) {
    return {
      isValid: false,
      error: 'Post content is required'
    }
  }

  if (content.length > CONTENT_LIMITS.POST_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Post content must be at most ${CONTENT_LIMITS.POST_MAX_LENGTH} characters`
    }
  }

  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /https?:\/\/[^\s]+/gi, // Multiple URLs (basic check)
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        error: 'Post content appears to be spam'
      }
    }
  }

  return { isValid: true }
}

/**
 * Post category validation
 */
export function validatePostCategory(category: string): { isValid: boolean; error?: string } {
  const validCategories = Object.values(POST_CATEGORIES)
  
  if (!validCategories.includes(category)) {
    return {
      isValid: false,
      error: 'Invalid post category'
    }
  }

  return { isValid: true }
}

/**
 * Complete post validation
 */
export function validatePostData(data: {
  content: string
  category: string
  image_url?: string
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate content
  const contentValidation = validatePostContent(data.content)
  if (!contentValidation.isValid) {
    errors.content = contentValidation.error || 'Invalid content'
  }

  // Validate category
  const categoryValidation = validatePostCategory(data.category)
  if (!categoryValidation.isValid) {
    errors.category = categoryValidation.error || 'Invalid category'
  }

  // Validate image URL if provided
  if (data.image_url) {
    try {
      new URL(data.image_url)
    } catch {
      errors.image_url = 'Invalid image URL'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Post form schema for client-side validation
 */
export const postFormSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content is required')
    .max(CONTENT_LIMITS.POST_MAX_LENGTH, `Post content must be at most ${CONTENT_LIMITS.POST_MAX_LENGTH} characters`)
    .refine(
      (content) => content.trim().length > 0,
      'Post content cannot be empty'
    ),
  category: z.enum(['general', 'announcement', 'question']),
  image_url: z
    .string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal(''))
})

/**
 * Post update schema (allows partial updates)
 */
export const postUpdateSchema = postFormSchema.partial()

/**
 * Check for inappropriate content (basic implementation)
 */
export function checkInappropriateContent(content: string): { isAppropriate: boolean; reason?: string } {
  const inappropriateWords = [
    'spam', 'scam', 'fake', 'bot', 'hack', 'cheat',
    // Add more inappropriate words as needed
  ]

  const lowerContent = content.toLowerCase()
  
  for (const word of inappropriateWords) {
    if (lowerContent.includes(word)) {
      return {
        isAppropriate: false,
        reason: 'Content contains inappropriate language'
      }
    }
  }

  // Check for excessive capitalization
  const upperMatches = (content.match(/[A-Z]/g) || []).length
  const capsRatio = content.length > 0 ? upperMatches / content.length : 0
  if (capsRatio > 0.7 && content.length > 20) {
    return {
      isAppropriate: false,
      reason: 'Excessive use of capital letters'
    }
  }

  return { isAppropriate: true }
}

/**
 * Validate post for creation
 */
export async function validatePostForCreation(data: {
  content: string
  category: string
  image_url?: string
}): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {}

  // Basic validation
  const basicValidation = validatePostData(data)
  if (!basicValidation.isValid) {
    Object.assign(errors, basicValidation.errors)
  }

  // Content appropriateness check
  const appropriatenessCheck = checkInappropriateContent(data.content)
  if (!appropriatenessCheck.isAppropriate) {
    errors.content = appropriatenessCheck.reason || 'Inappropriate content detected'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate post for update
 */
export async function validatePostForUpdate(data: {
  content?: string
  category?: string
  image_url?: string
}): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {}

  // Validate content if provided
  if (data.content !== undefined) {
    const contentValidation = validatePostContent(data.content)
    if (!contentValidation.isValid) {
      errors.content = contentValidation.error || 'Invalid content'
    } else {
      // Check appropriateness
      const appropriatenessCheck = checkInappropriateContent(data.content)
      if (!appropriatenessCheck.isAppropriate) {
        errors.content = appropriatenessCheck.reason || 'Inappropriate content detected'
      }
    }
  }

  // Validate category if provided
  if (data.category !== undefined) {
    const categoryValidation = validatePostCategory(data.category)
    if (!categoryValidation.isValid) {
      errors.category = categoryValidation.error || 'Invalid category'
    }
  }

  // Validate image URL if provided
  if (data.image_url !== undefined && data.image_url) {
    try {
      new URL(data.image_url)
    } catch {
      errors.image_url = 'Invalid image URL'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}