import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * Optional authentication middleware that doesn't throw if no session is found.
 * Supports cookie-based sessions and Bearer tokens passed via Authorization header.
 */
export async function optionalAuthMiddleware(req: NextRequest) {
  // First try cookie-based session (middleware client)
  try {
    const supabaseMiddleware = createMiddlewareClient({ req, res: NextResponse.next() })
    const { data: { session } } = await supabaseMiddleware.auth.getSession()
    if (session) return session
  } catch (_err) {
    // ignore and fallback to header-based token
  }

  // Fallback: check Authorization header for Bearer token
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const { data, error } = await supabase.auth.getUser(token)
      if (error || !data.user) return null
      // Return a minimal session-like object compatible with callers
      return { user: data.user, access_token: token }
    } catch (_err) {
      return null
    }
  }

  return null
}

/**
 * Required authentication middleware that throws if no session is found
 */
export async function requireAuthMiddleware(req: NextRequest) {
  const session = await optionalAuthMiddleware(req)
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}
