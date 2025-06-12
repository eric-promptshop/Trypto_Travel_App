'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TripNavLogo } from '@/components/ui/TripNavLogo'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  // Map NextAuth error codes to user-friendly messages
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'OAuthSignin':
        return 'Error occurred during sign in. Please try again.'
      case 'OAuthCallback':
        return 'Error occurred during authentication. Please try again.'
      case 'OAuthCreateAccount':
        return 'Could not create user account. Please try a different sign in method.'
      case 'EmailCreateAccount':
        return 'Could not create user account. Please try a different sign in method.'
      case 'Callback':
        return 'Error occurred during authentication callback. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'This account is already linked to another sign in method.'
      case 'EmailSignin':
        return 'The email could not be sent. Please try again.'
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue-50 to-brand-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <TripNavLogo size="xl" animated={true} className="mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Authentication Error</h1>
          <p className="text-gray-600 mt-2">We encountered a problem signing you in</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Sign In Error
            </CardTitle>
            <CardDescription>
              Something went wrong during the authentication process
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            {error === 'CredentialsSignin' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Demo Account:</strong><br />
                  Email: demo@example.com<br />
                  Password: demo123
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button
              asChild
              className="w-full"
            >
              <Link href="/auth/signin">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
              className="w-full"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/docs" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
              View documentation
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}