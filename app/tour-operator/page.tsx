import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import TourOperatorDashboard from '@/components/tour-operator/TourOperatorDashboard'

export default async function TourOperatorPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is authenticated
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/tour-operator')
  }
  
  // Check if user has tour operator role
  if (session.user?.role !== 'TOUR_OPERATOR' && session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN') {
    redirect('/')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TourOperatorDashboard />
    </div>
  )
}