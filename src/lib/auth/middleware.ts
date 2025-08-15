import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { AuthenticationError, AuthorizationError } from '@/lib/errors'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'

export interface AuthenticatedRequest extends NextRequest {
  user: User
  profile: Profile
}

/**
 * Extract JWT token from request headers
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  // Check for Bearer token
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return authHeader
}

/**
 * Validate JWT token and get user information
 */
export async function validateToken(token: string): Promise<{ user: User; profile: Profile }> {
  try {
    // Verify JWT token with Supabase
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      throw new AuthenticationError('Invalid or expired token')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new AuthenticationError('User profile not found')
    }

    return { user, profile }
  } catch (error) {
    console.error('Token validation error:', error)
    throw error instanceof AuthenticationError ? error : new AuthenticationError('Token validation failed')
  }
}

/**
 * Middleware to authenticate API requests
 */
export async function authenticateRequest(request: NextRequest): Promise<{ user: User; profile: Profile }> {
  const token = extractToken(request)

  if (!token) {
    throw new AuthenticationError('Authentication token required')
  }

  return await validateToken(token)
}

/**
 * Middleware to check if user has admin role
 */
export async function requireAdmin(request: NextRequest): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await authenticateRequest(request)

  if (profile.role !== 'admin') {
    throw new AuthorizationError('Admin access required')
  }

  return { user, profile }
}

/**
 * Middleware to check if user owns the resource or is admin
 */
export async function requireOwnershipOrAdmin(
  request: NextRequest,
  resourceUserId: string
): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await authenticateRequest(request)

  if (profile.role !== 'admin' && user.id !== resourceUserId) {
    throw new AuthorizationError('Access denied: insufficient permissions')
  }

  return { user, profile }
}

/**
 * Optional authentication - doesn't throw if no token provided
 */
export async function optionalAuth(request: NextRequest): Promise<{ user: User; profile: Profile } | null> {
  try {
    const token = extractToken(request)
    
    if (!token) {
      return null
    }

    return await validateToken(token)
  } catch (error) {
    // Log error but don't throw for optional auth
    console.error('Optional auth error:', error)
    return null
  }
}

/**
 * Get user from request (for use in API routes)
 */
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    const auth = await optionalAuth(request)
    return auth?.user || null
  } catch (error) {
    console.error('Get user from request error:', error)
    return null
  }
}

/**
 * Check if user can access profile based on visibility settings
 */
export async function canAccessProfile(
  targetProfile: Profile,
  currentUser: User | null
): Promise<boolean> {
  // Public profiles are accessible to everyone
  if (targetProfile.profile_visibility === 'public') {
    return true
  }

  // Private and followers_only profiles require authentication
  if (!currentUser) {
    return false
  }

  // Users can always access their own profile
  if (currentUser.id === targetProfile.id) {
    return true
  }

  // Admins can access all profiles
  const { data: currentProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  if (currentProfile?.role === 'admin') {
    return true
  }

  // For followers_only, check if current user follows the target user
  if (targetProfile.profile_visibility === 'followers_only') {
    const { data: followRelation } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', targetProfile.id)
      .single()

    return !!followRelation
  }

  // Private profiles are only accessible to the owner and admins
  return false
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}