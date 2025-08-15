import { supabase } from '@/lib/supabase/client'
import { handleAuthError, AuthenticationError } from '@/lib/errors'

/**
 * Send email verification to user
 */
export async function sendEmailVerification(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`
      }
    })

    if (error) {
      throw handleAuthError(error)
    }
  } catch (error) {
    console.error('Send email verification error:', error)
    throw error
  }
}

/**
 * Verify email with token from URL
 */
export async function verifyEmail(token: string, email: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
      email
    })

    if (error) {
      throw handleAuthError(error)
    }

    return data
  } catch (error) {
    console.error('Email verification error:', error)
    throw error
  }
}

/**
 * Confirm password reset with new password
 */
export async function confirmPasswordReset(token: string, newPassword: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    })

    if (error) {
      throw handleAuthError(error)
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      throw handleAuthError(updateError)
    }

    return data
  } catch (error) {
    console.error('Password reset confirmation error:', error)
    throw error
  }
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user?.email_confirmed_at
  } catch (error) {
    console.error('Check email verification error:', error)
    return false
  }
}

/**
 * Get email verification status and send verification if needed
 */
export async function handleEmailVerification(): Promise<{
  isVerified: boolean
  verificationSent?: boolean
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new AuthenticationError('User not authenticated')
    }

    const isVerified = !!user.email_confirmed_at

    if (!isVerified && user.email) {
      await sendEmailVerification(user.email)
      return { isVerified: false, verificationSent: true }
    }

    return { isVerified }
  } catch (error) {
    console.error('Handle email verification error:', error)
    throw error
  }
}