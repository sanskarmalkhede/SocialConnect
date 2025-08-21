import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reset Password - SocialConnect',
  description: 'Reset your SocialConnect account password'
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SocialConnect
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Reset your password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email address below and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
            
            <div className="mt-6 text-center text-sm">
              <Link 
                href="/auth/login" 
                className="text-primary hover:underline font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}