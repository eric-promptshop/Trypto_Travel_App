import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Mail } from 'lucide-react'

export default function OperatorSuspendedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Account Suspended</CardTitle>
          <CardDescription>
            Your operator account is currently suspended or inactive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="mb-2">Your account may be suspended due to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Pending verification or approval</li>
              <li>Outstanding payment issues</li>
              <li>Terms of service violations</li>
              <li>Account maintenance</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button className="w-full" variant="default">
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            
            <Button className="w-full" variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
          
          <p className="text-xs text-center text-gray-500">
            If you believe this is an error, please contact our support team at{' '}
            <a href="mailto:support@tripnav.ai" className="text-blue-600 hover:underline">
              support@tripnav.ai
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}