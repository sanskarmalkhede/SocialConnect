'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-helpers'
import { ROUTES } from '@/constants'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo 
}: AuthGuardProps) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Redirect if authentication is required but user is not authenticated
  if (requireAuth && !user) {
    router.push(redirectTo || ROUTES.LOGIN)
    return null
  }

  // Redirect if admin access is required but user is not admin
  if (requireAdmin && (!profile || profile.role !== 'admin')) {
    router.push(ROUTES.HOME)
    return null
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && user) {
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