'use client'

import { supabase } from '@/lib/supabase/client'
import { handleAuthError, AuthenticationError, ConflictError, AuthorizationError, ValidationError } from '@/lib/errors'
import type { RegisterFormData, LoginFormData } from '@/types'
import type { User } from '@supabase/supabase-js'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to check if a user is authenticated
 */
export async function authenticateRequest(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res: NextResponse.next() })
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new AuthenticationError('No session found')
  }

  return session
}

/**
 * Middleware to check if a user is an admin
 */
export async function requireAdmin(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res: NextResponse.next() })
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new AuthenticationError('No session found')
  }
  
  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new AuthorizationError('Admin access required')
  }

  return session
}

/**
 * Optional authentication middleware - doesn't throw if no session
 */
export async function optionalAuth(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res: NextResponse.next() })
  
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Validates a username format
 */
function validateUsername(username: string): boolean {
  // Username should be 3-30 characters long and contain only letters, numbers, and underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Register a new user with email verification
 */
export async function registerUser(data: RegisterFormData) {
  try {
    // Validate username format
    if (!validateUsername(data.username)) {
      throw new ValidationError(
        'Username must be 3-30 characters long and can only contain letters, numbers, and underscores'
      );
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username // This will be used by the database trigger
        }
      }
    })

    if (authError) {
      throw handleAuthError(authError)
    }

    if (!authData.user) {
      throw new AuthenticationError('Failed to create user account')
    }

    return {
      user: authData.user,
      needsEmailVerification: !authData.user.email_confirmed_at
    }
  } catch (error) {
    throw error
  }
}

/**
 * Sign in user with email and password
 */
export async function loginUser(data: LoginFormData) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (authError) {
      throw handleAuthError(authError)
    }

    if (!authData.user) {
      throw new AuthenticationError('Failed to sign in')
    }

    return authData.user
  } catch (error) {
    throw error
  }
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw handleAuthError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password/confirm`
    })

    if (error) {
      throw handleAuthError(error)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Update user password
 */
export async function changeUserPassword(_data: unknown) {
  // Removed in MVP. Keep signature stubbed for backwards compatibility.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  try {
    // First verify current password by attempting to sign in
    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.email) {
      throw new AuthenticationError('User not authenticated')
    }

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.user.email,
      password: ''
    })

    if (verifyError) {
      throw new AuthenticationError('Current password is incorrect')
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: ''
    })

    if (updateError) {
      throw handleAuthError(updateError)
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return null
    }

    return session
  } catch (error) {
    return null
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      throw handleAuthError(error)
    }

    return session
  } catch (error) {
    throw error
  }
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string) {
  try {
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

// React hook to get current user and loading state
import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 10000)
    
    const getUser = async () => {
      setIsLoading(true)
      
      try {
        // Use getSession() instead of getUser() to properly detect existing sessions
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          clearTimeout(timeoutId)
          return
        }

        if (session?.user) {
          setUser(session.user)
          // Fetch profile if user exists
          try {
            const profileData = await getUserProfile(session.user.id)
            setProfile(profileData)
          } catch (error) {
            setProfile(null)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setIsLoading(false)
        clearTimeout(timeoutId)
      } catch (error) {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      
      if (session?.user) {
        setUser(session.user)
        try {
          const profileData = await getUserProfile(session.user.id)
          setProfile(profileData)
        } catch (error) {
          setProfile(null)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {}, [user, profile, isLoading])

  return { user, profile, isLoading, signOut }
}