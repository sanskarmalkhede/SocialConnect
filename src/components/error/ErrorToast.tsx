'use client'

import { useEffect } from 'react'
import { toast, Toaster } from 'sonner'
import { APIError } from '@/types' // Import APIError

export interface ToastOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const errorToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    })
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    })
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    })
  },

  // Specialized error toasts
  validation: (errors: Array<{ field: string; message: string }>) => {
    const message = errors.length === 1 
      ? errors[0].message 
      : `${errors.length} validation errors`
    
    const description = errors.length > 1 
      ? errors.map(e => `${e.field}: ${e.message}`).join('\n')
      : undefined

    toast.error(message, {
      description,
      duration: 6000
    })
  },

  network: (action?: string) => {
    toast.error('Network Error', {
      description: `Failed to ${action || 'complete request'}. Please check your connection.`, 
      duration: 6000,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    })
  },

  authentication: () => {
    toast.error('Authentication Required', {
      description: 'Please sign in to continue.',
      duration: 6000,
      action: {
        label: 'Sign In',
        onClick: () => window.location.href = '/auth/login'
      }
    })
  },

  authorization: () => {
    toast.error('Access Denied', {
      description: 'You don\'t have permission to perform this action.',
      duration: 6000
    })
  },

  rateLimit: () => {
    toast.error('Rate Limit Exceeded', {
      description: 'Too many requests. Please wait a moment and try again.',
      duration: 8000
    })
  },

  maintenance: () => {
    toast.warning('Maintenance Mode', {
      description: 'Some features may be temporarily unavailable.',
      duration: 10000
    })
  }
}

// Global error handler for API responses
export function handleAPIError(error: unknown, context?: string) {
  console.error('API Error:', error)

  if (!error) {
    errorToast.error('Unknown error occurred')
    return
  }

  // Simpler type guard for APIError
  const isSimpleAPIError = (err: unknown): err is { error: { message: string, code?: string, details?: any } } => {
    return typeof err === 'object' && err !== null && 'error' in err &&
           typeof (err as any).error === 'object' && (err as any).error !== null &&
           'message' in (err as any).error;
  };

  if (isSimpleAPIError(error)) {
    const { message, code, details } = error.error

    switch (code) {
      case 'VALIDATION_ERROR':
        if (details && Array.isArray(details)) {
          errorToast.validation(details)
        } else {
          errorToast.error(message || 'Validation failed')
        }
        break

      case 'AUTHENTICATION_ERROR':
        errorToast.authentication()
        break

      case 'AUTHORIZATION_ERROR':
        errorToast.authorization()
        break

      case 'RATE_LIMIT_ERROR':
        errorToast.rateLimit()
        break

      case 'NETWORK_ERROR':
        errorToast.network(context)
        break

      default:
        errorToast.error(message || 'An error occurred', {
          description: context ? `Failed to ${context}` : undefined
        })
    }
  } else if (error instanceof Error) {
    errorToast.error(error.message, {
      description: context ? `Failed to ${context}` : undefined
    })
  } else {
    errorToast.error('An unexpected error occurred', {
      description: context ? `Failed to ${context}` : undefined
    })
  }
}

// React hook for handling errors in components
export function useErrorHandler() {
  return {
    handleError: (error: unknown, context?: string) => {
      handleAPIError(error, context)
    },
    
    handleAsyncError: async <T>(asyncFn: () => Promise<T>, context?: string): Promise<T | undefined> => {
      try {
        return await asyncFn()
      } catch (error) {
        handleAPIError(error, context)
        throw error // Re-throw so component can handle it if needed
      }
    }
  }
}

// Custom Toaster component with better styling
export function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
        className: 'my-toast',
        duration: 4000,
      }}
    />
  )
}

// Error boundary integration
export function useErrorBoundary() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      handleAPIError(event.reason, 'background operation')
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      errorToast.error('An unexpected error occurred', {
        description: 'Please refresh the page if the problem persists.'
      })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])
}

// Utility functions for common error scenarios
export const errorUtils = {
  // Handle form submission errors
  handleFormError: (error: unknown, formName?: string) => {
    handleAPIError(error, formName ? `submit ${formName}` : 'submit form')
  },

  // Handle data loading errors
  handleLoadError: (error: unknown, resourceName?: string) => {
    handleAPIError(error, resourceName ? `load ${resourceName}` : 'load data')
  },

  // Handle save/update errors
  handleSaveError: (error: unknown, resourceName?: string) => {
    handleAPIError(error, resourceName ? `save ${resourceName}` : 'save changes')
  },

  // Handle delete errors
  handleDeleteError: (error: unknown, resourceName?: string) => {
    handleAPIError(error, resourceName ? `delete ${resourceName}` : 'delete item')
  },

  // Show success message for operations
  showSuccess: (message: string, resourceName?: string) => {
    errorToast.success(message, {
      description: resourceName ? `${resourceName} operation completed` : undefined
    })
  }
}