import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'

export const metadata: Metadata = {
  title: 'Change Password - SocialConnect',
  description: 'Change your SocialConnect account password'
}

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SocialConnect
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Change your password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Change your password</CardTitle>
            <CardDescription>
              Enter your current password and new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
            
            <div className="mt-6 text-center text-sm">
              <Link 
                href="/feed" 
                className="text-primary hover:underline font-medium"
              >
                Back to Feed
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}