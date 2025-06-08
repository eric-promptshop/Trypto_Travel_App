import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is authenticated and has admin role
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/admin')
  }
  
  // For now, allow any authenticated user to access admin
  // TODO: Add proper role-based access control
  if (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN') {
    // For development, allow access but show warning
    console.warn(`User ${session.user?.email} accessed admin without admin role`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  )
} 