'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getUserProfile } from '@/lib/auth/auth-helpers'
import { ROUTES } from '@/constants'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo 
}: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false
  })
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          const profile = await getUserProfile(session.user.id)
          
          if (!mounted) return

          setAuthState({
            user: session.user,
            profile,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          const profile = await getUserProfile(session.user.id)
          
          if (!mounted) return

          setAuthState({
            user: session.user,
            profile,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Show loading spinner while checking auth
  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Redirect if authentication is required but user is not authenticated
  if (requireAuth && !authState.isAuthenticated) {
    router.push(redirectTo || ROUTES.LOGIN)
    return null
  }

  // Redirect if admin access is required but user is not admin
  if (requireAdmin && (!authState.profile || authState.profile.role !== 'admin')) {
    router.push(ROUTES.HOME)
    return null
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && authState.isAuthenticated) {
    router.push(redirectTo || ROUTES.FEED)
    return null
  }

  return <>{children}</>
}

// HOC version for easier use
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Hook to use auth state in components
export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          const profile = await getUserProfile(session.user.id)
          
          if (!mounted) return

          setAuthState({
            user: session.user,
            profile,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          const profile = await getUserProfile(session.user.id)
          
          if (!mounted) return

          setAuthState({
            user: session.user,
            profile,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return authState
}