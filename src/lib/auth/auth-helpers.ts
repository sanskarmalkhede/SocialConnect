import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import { handleAuthError, AuthenticationError, ConflictError } from '@/lib/errors'
import type { RegisterFormData, LoginFormData, ChangePasswordFormData } from '@/types'
import type { User } from '@supabase/supabase-js'

/**
 * Register a new user with email verification
 */
export async function registerUser(data: RegisterFormData) {
  try {
    // Check if username is already taken
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', data.username)
      .single()

    if (existingProfile) {
      throw new ConflictError('Username is already taken')
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username
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
    console.error('Registration error:', error)
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
    console.error('Login error:', error)
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
    console.error('Logout error:', error)
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
    console.error('Password reset error:', error)
    throw error
  }
}

/**
 * Update user password
 */
export async function changeUserPassword(data: ChangePasswordFormData) {
  try {
    // First verify current password by attempting to sign in
    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.email) {
      throw new AuthenticationError('User not authenticated')
    }

    // Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.user.email,
      password: data.currentPassword
    })

    if (verifyError) {
      throw new AuthenticationError('Current password is incorrect')
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword
    })

    if (updateError) {
      throw handleAuthError(updateError)
    }
  } catch (error) {
    console.error('Password change error:', error)
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
      console.error('Get user error:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Get current user error:', error)
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
      console.error('Get session error:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('Get current session error:', error)
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
    console.error('Refresh session error:', error)
    throw error
  }
}

/**
 * Create user profile after successful registration
 */
export async function createUserProfile(userId: string, username: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        role: 'user',
        profile_visibility: 'public'
      })
      .select()
      .single()

    if (error) {
      console.error('Create profile error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Create user profile error:', error)
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
      console.error('Get profile error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}