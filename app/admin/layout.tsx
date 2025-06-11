import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <div className="flex gap-4">
              <Link href="/admin/crm" className="text-blue-600 hover:text-blue-800">
                CRM Management
              </Link>
              <Link href="/admin/white-label" className="text-blue-600 hover:text-blue-800">
                White-Label Config
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="py-8">
        {children}
      </main>
    </div>
  );
} 