import { z } from 'zod'
import { CONTENT_LIMITS } from '@/constants'
import { isUsernameAvailable } from './profile-service'

/**
 * Username validation regex
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

/**
 * URL validation function
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Profile form validation schema
 */
export const profileFormSchema = z.object({
  username: z
    .string()
    .min(CONTENT_LIMITS.USERNAME_MIN_LENGTH, `Username must be at least ${CONTENT_LIMITS.USERNAME_MIN_LENGTH} characters`)
    .max(CONTENT_LIMITS.USERNAME_MAX_LENGTH, `Username must be at most ${CONTENT_LIMITS.USERNAME_MAX_LENGTH} characters`)
    .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, and underscores')
    .refine(
      (username) => !username.startsWith('_') && !username.endsWith('_'),
      'Username cannot start or end with underscore'
    ),
  bio: z
    .string()
    .max(CONTENT_LIMITS.BIO_MAX_LENGTH, `Bio must be at most ${CONTENT_LIMITS.BIO_MAX_LENGTH} characters`)
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .refine(
      (url) => !url || isValidUrl(url),
      'Please enter a valid URL'
    )
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  profile_visibility: z.enum(['public', 'private', 'followers_only'])
})

/**
 * Validate username format
 */
export function validateUsernameFormat(username: string): { isValid: boolean; error?: string } {
  if (username.length < CONTENT_LIMITS.USERNAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at least ${CONTENT_LIMITS.USERNAME_MIN_LENGTH} characters`
    }
  }

  if (username.length > CONTENT_LIMITS.USERNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Username must be at most ${CONTENT_LIMITS.USERNAME_MAX_LENGTH} characters`
    }
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores'
    }
  }

  if (username.startsWith('_') || username.endsWith('_')) {
    return {
      isValid: false,
      error: 'Username cannot start or end with underscore'
    }
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'api', 'www', 'mail', 'ftp',
    'support', 'help', 'info', 'contact', 'about', 'privacy', 'terms',
    'login', 'register', 'signup', 'signin', 'logout', 'profile',
    'settings', 'account', 'dashboard', 'feed', 'home', 'search',
    'notifications', 'messages', 'follow', 'followers', 'following',
    'posts', 'post', 'comment', 'comments', 'like', 'likes', 'share',
    'report', 'block', 'unblock', 'delete', 'edit', 'update', 'create'
  ]

  if (reservedUsernames.includes(username.toLowerCase())) {
    return {
      isValid: false,
      error: 'This username is reserved and cannot be used'
    }
  }

  return { isValid: true }
}

/**
 * Validate username availability (async)
 */
export async function validateUsernameAvailability(
  username: string, 
  excludeUserId?: string
): Promise<{ isAvailable: boolean; error?: string }> {
  try {
    // First check format
    const formatValidation = validateUsernameFormat(username)
    if (!formatValidation.isValid) {
      return {
        isAvailable: false,
        error: formatValidation.error
      }
    }

    // Check availability
    const isAvailable = await isUsernameAvailable(username, excludeUserId)
    
    if (!isAvailable) {
      return {
        isAvailable: false,
        error: 'This username is already taken'
      }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Username availability check error:', error)
    return {
      isAvailable: false,
      error: 'Unable to check username availability'
    }
  }
}

/**
 * Validate bio content
 */
export function validateBio(bio: string): { isValid: boolean; error?: string } {
  if (bio.length > CONTENT_LIMITS.BIO_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Bio must be at most ${CONTENT_LIMITS.BIO_MAX_LENGTH} characters`
    }
  }

  // Check for inappropriate content (basic check)
  const inappropriateWords = ['spam', 'scam', 'fake', 'bot']
  const lowerBio = bio.toLowerCase()
  
  for (const word of inappropriateWords) {
    if (lowerBio.includes(word)) {
      return {
        isValid: false,
        error: 'Bio contains inappropriate content'
      }
    }
  }

  return { isValid: true }
}

/**
 * Validate website URL
 */
export function validateWebsiteUrl(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: true } // Empty URL is valid
  }

  if (!isValidUrl(url)) {
    return {
      isValid: false,
      error: 'Please enter a valid URL'
    }
  }

  // Check for suspicious URLs
  const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'short.link']
  const urlObj = new URL(url)
  
  if (suspiciousDomains.includes(urlObj.hostname)) {
    return {
      isValid: false,
      error: 'Shortened URLs are not allowed'
    }
  }

  return { isValid: true }
}

/**
 * Validate complete profile data
 */
export async function validateProfileData(
  data: {
    username: string
    bio?: string
    website?: string
    location?: string
    profile_visibility: 'public' | 'private' | 'followers_only'
  },
  excludeUserId?: string
): Promise<{ isValid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {}

  // Validate username
  const usernameValidation = await validateUsernameAvailability(data.username, excludeUserId)
  if (!usernameValidation.isAvailable) {
    errors.username = usernameValidation.error || 'Invalid username'
  }

  // Validate bio
  if (data.bio) {
    const bioValidation = validateBio(data.bio)
    if (!bioValidation.isValid) {
      errors.bio = bioValidation.error || 'Invalid bio'
    }
  }

  // Validate website
  if (data.website) {
    const websiteValidation = validateWebsiteUrl(data.website)
    if (!websiteValidation.isValid) {
      errors.website = websiteValidation.error || 'Invalid website URL'
    }
  }

  // Validate location
  if (data.location && data.location.length > 100) {
    errors.location = 'Location must be at most 100 characters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}