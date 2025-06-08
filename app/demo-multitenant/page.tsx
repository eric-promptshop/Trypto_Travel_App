import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Globe, Palette, Shield, Rocket, ExternalLink, Settings } from 'lucide-react'
import Link from 'next/link'

export default function MultiTenantDemo() {
  const tenantDemos = [
    {
      name: 'Adventure Tours Co',
      slug: 'adventure-tours',
      url: '/client/adventure-tours',
      theme: 'Adventure Theme',
      colors: 'Green & Emerald',
      description: 'Outdoor adventure travel company focusing on hiking, climbing, and extreme sports.',
      features: ['Custom Branding', 'Path-based Routing', 'Theme Isolation'],
      bgColor: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-200'
    },
    {
      name: 'Luxury Escapes',
      slug: 'luxury-escapes',
      url: '/client/luxury-escapes',
      theme: 'Luxury Theme',
      colors: 'Purple & Violet',
      description: 'Premium luxury travel experiences with high-end accommodations and services.',
      features: ['Custom Branding', 'Enterprise Features', 'Premium Support'],
      bgColor: 'from-purple-500 to-violet-600',
      borderColor: 'border-purple-200'
    },
    {
      name: 'Budget Backpackers',
      slug: 'budget-backpackers',
      url: '/client/budget-backpackers',
      theme: 'Budget Theme',
      colors: 'Red & Orange',
      description: 'Affordable travel options for budget-conscious backpackers and students.',
      features: ['Cost-effective Solutions', 'Essential Features', 'Community Focus'],
      bgColor: 'from-red-500 to-orange-600',
      borderColor: 'border-red-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Multi-tenant Demo</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our white-label travel itinerary platform with tenant-specific branding, 
            custom themes, and isolated deployments.
          </p>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            Phase 3 Implementation Complete
          </Badge>
        </div>

        {/* Features Overview */}
        <Card className="border-2 border-blue-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Multi-tenant Architecture Features
            </CardTitle>
            <CardDescription>
              Built-in capabilities for white-label deployments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Tenant Routing</h3>
                <p className="text-sm text-gray-600">Path-based, subdomain, and custom domain support</p>
              </div>
              <div className="text-center p-4">
                <Palette className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">Custom Themes</h3>
                <p className="text-sm text-gray-600">Tenant-specific branding and color schemes</p>
              </div>
              <div className="text-center p-4">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Data Isolation</h3>
                <p className="text-sm text-gray-600">Secure tenant data separation</p>
              </div>
              <div className="text-center p-4">
                <Rocket className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold">Easy Deployment</h3>
                <p className="text-sm text-gray-600">Automated white-label instance creation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Demonstrations */}
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
          {tenantDemos.map((tenant) => (
            <Card key={tenant.slug} className={`border-2 ${tenant.borderColor} hover:shadow-lg transition-shadow`}>
              <CardHeader>
                <div className={`w-full h-32 bg-gradient-to-r ${tenant.bgColor} rounded-lg mb-4 flex items-center justify-center`}>
                  <div className="text-white text-center">
                    <Globe className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-semibold">{tenant.theme}</div>
                  </div>
                </div>
                <CardTitle className="text-lg">{tenant.name}</CardTitle>
                <CardDescription className="text-sm">
                  {tenant.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {tenant.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Theme Colors:</h4>
                  <p className="text-sm text-gray-600">{tenant.colors}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">URL Path:</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {tenant.url}
                  </code>
                </div>

                <Button asChild className="w-full">
                  <Link href={tenant.url}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit {tenant.name}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Access */}
        <Card className="border-2 border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin Management
            </CardTitle>
            <CardDescription>
              Access the admin dashboard to manage tenants and deployments
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Manage clients, configure deployments, and customize themes for each tenant.
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                /admin
              </code>
            </div>
            <Button asChild>
              <Link href="/admin">
                <Settings className="w-4 h-4 mr-2" />
                Open Admin Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card className="border-2 border-indigo-200 bg-white">
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
            <CardDescription>
              Technical architecture powering the multi-tenant system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">🏗️ Architecture</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Next.js 15 App Router with middleware</li>
                  <li>• Prisma + PostgreSQL (Supabase)</li>
                  <li>• Tenant-aware database schema</li>
                  <li>• Real-time theme switching</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">🚀 Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Path-based tenant routing</li>
                  <li>• Dynamic CSS variable injection</li>
                  <li>• Tenant isolation and security</li>
                  <li>• Automated deployment management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Multi-tenant Travel Itinerary Builder • Phase 3 Complete ✅</p>
        </div>
      </div>
    </div>
  )
} 