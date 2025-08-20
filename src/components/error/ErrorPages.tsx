'use client'

import { AlertTriangle, Home, RefreshCw, Search, Lock, Wifi, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorPageProps {
  title: string
  description: string
  icon: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

function ErrorPage({ title, description, icon, actions, className }: ErrorPageProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-background ${className}`}>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        
        {actions && (
          <CardContent>
            {actions}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <ErrorPage
      title="Page Not Found"
      description="The page you&apos;re looking for doesn&apos;t exist or has been moved."
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
      actions={
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.history.back()} className="w-full">
            Go Back
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      }
    />
  )
}

export function UnauthorizedPage() {
  return (
    <ErrorPage
      title="Access Denied"
      description="You don&apos;t have permission to access this page. Please sign in or contact an administrator."
      icon={<Lock className="h-8 w-8 text-muted-foreground" />}
      actions={
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.location.href = '/auth/login'} className="w-full">
            Sign In
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      }
    />
  )
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      title="Server Error"
      description="Something went wrong on our end. We&apos;re working to fix it. Please try again later."
      icon={<Server className="h-8 w-8 text-muted-foreground" />}
      actions={
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      }
    />
  )
}

export function NetworkErrorPage() {
  return (
    <ErrorPage
      title="Connection Problem"
      description="Unable to connect to our servers. Please check your internet connection and try again."
      icon={<Wifi className="h-8 w-8 text-muted-foreground" />}
      actions={
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      }
    />
  )
}

export function MaintenancePage() {
  return (
    <ErrorPage
      title="Under Maintenance"
      description="We&apos;re currently performing scheduled maintenance. We&apos;ll be back shortly."
      icon={<AlertTriangle className="h-8 w-8 text-muted-foreground" />}
      actions={
        <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Check Again
        </Button>
      }
    />
  )
}

interface CustomErrorPageProps {
  error?: {
    status?: number
    message?: string
    code?: string
  }
}

export function CustomErrorPage({ error }: CustomErrorPageProps) {
  const getErrorContent = () => {
    switch (error?.status) {
      case 404:
        return {
          title: 'Page Not Found',
          description: 'The page you\'re looking for doesn\'t exist.',
          icon: <Search className="h-8 w-8 text-muted-foreground" />
        }
      case 401:
        return {
          title: 'Authentication Required',
          description: 'Please sign in to access this page.',
          icon: <Lock className="h-8 w-8 text-muted-foreground" />
        }
      case 403:
        return {
          title: 'Access Forbidden',
          description: 'You don\'t have permission to access this resource.',
          icon: <Lock className="h-8 w-8 text-muted-foreground" />
        }
      case 500:
        return {
          title: 'Server Error',
          description: 'Something went wrong on our end.',
          icon: <Server className="h-8 w-8 text-muted-foreground" />
        }
      default:
        return {
          title: 'Something went wrong',
          description: error?.message || 'An unexpected error occurred.',
          icon: <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        }
    }
  }

  const { title, description, icon } = getErrorContent()

  return (
    <ErrorPage
      title={title}
      description={description}
      icon={icon}
      actions={
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      }
    />
  )
}