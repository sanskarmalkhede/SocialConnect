'use client'

import { useAuth } from './AuthGuard'
import { ROUTES } from '@/constants'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ('user' | 'admin')[]
  fallbackRoute?: string
  showFallback?: boolean
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackRoute = ROUTES.HOME,
  showFallback = false 
}: RoleGuardProps) {
  const { user, profile, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
      return
    }

    if (!isLoading && profile && !allowedRoles.includes(profile.role)) {
      if (showFallback) {
        return
      }
      router.push(fallbackRoute)
    }
  }, [isLoading, isAuthenticated, profile, allowedRoles, fallbackRoute, showFallback, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null
  }

  // No profile found
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Profile not found</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  // User doesn't have required role
  if (!allowedRoles.includes(profile.role)) {
    if (showFallback) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}

// HOC for admin-only components
export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children' | 'allowedRoles'> = {}
) {
  return function AdminGuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={['admin']} {...options}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}

// HOC for user-only components (excludes admin)
export function withUserGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children' | 'allowedRoles'> = {}
) {
  return function UserGuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={['user']} {...options}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}

// HOC for components accessible to both users and admins
export function withAnyRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children' | 'allowedRoles'> = {}
) {
  return function AnyRoleGuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={['user', 'admin']} {...options}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}