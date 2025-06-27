import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import TourOperatorDashboard from '@/components/tour-operator/TourOperatorDashboard'

export const dynamic = 'force-dynamic'

export default async function OperatorPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is authenticated
  if (!session) {
    redirect('/auth/signin')
  }
  
  // Check if user has operator access
  const hasOperatorAccess = 
    session.user?.role === 'TOUR_OPERATOR' || 
    session.user?.role === 'AGENT' ||
    session.user?.role === 'ADMIN'
  
  if (!hasOperatorAccess) {
    redirect('/')
  }
  
  // Check if user has an operator ID
  if (!session.user?.operatorId && session.user?.role !== 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            No Operator Account
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You don't have an operator account associated with your profile.
            Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TourOperatorDashboard />
    </div>
  )
}