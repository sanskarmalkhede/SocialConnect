import { supabaseAdmin } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Create user profile after successful registration
 * This must be called from a server context (API route or server component)
 */
export async function createUserProfileServer(user: User, username: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        username,
        role: 'user',
        profile_visibility: 'public'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}
