'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { useSession } from 'next-auth/react'
import { 
  Home, 
  Plane, 
  Map, 
  Calendar, 
  Settings, 
  User,
  BookOpen,
  BarChart3,
  Palette,
  Building2,
  Compass
} from 'lucide-react'

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  adminOnly?: boolean
  requiresAuth?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    description: 'Start planning your next adventure'
  },
  {
    href: '/tours',
    label: 'Explore Tours',
    icon: Compass,
    description: 'Browse amazing tours worldwide'
  },
  {
    href: '/plan',
    label: 'Plan Trip',
    icon: Plane,
    description: 'Create a new travel itinerary'
  },
  {
    href: '/trips',
    label: 'My Trips',
    icon: Map,
    description: 'View and manage your saved trips',
    requiresAuth: true
  },
  {
    href: '/ui-showcase',
    label: 'UI Components',
    icon: Palette,
    description: 'Explore TripNav UI components'
  },
  {
    href: '/docs',
    label: 'Guide',
    icon: BookOpen,
    description: 'Learn how to use the platform'
  },
  {
    href: '/onboarding',
    label: 'White Label',
    icon: Building2,
    description: 'Set up your branded platform'
  },
]

const adminItems: NavigationItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Administrative dashboard',
    adminOnly: true
  },
  {
    href: '/admin/crm',
    label: 'CRM',
    icon: User,
    description: 'Customer relationship management',
    adminOnly: true
  },
]

export function MainNavigation() {
  const pathname = usePathname()
  const { track } = useAnalytics()
  const { data: session } = useSession()

  const handleNavClick = (item: NavigationItem) => {
    track('main_nav_click', {
      item: item.label,
      href: item.href,
      from_page: pathname
    })
  }

  // Don't show navigation on certain pages
  const hideNavigation = ['/admin'].some(path => pathname.startsWith(path))
  
  if (hideNavigation) {
    return null
  }

  // Filter navigation items based on authentication status
  const visibleItems = navigationItems.filter(item => {
    // If item requires auth and user is not authenticated, hide it
    if (item.requiresAuth && !session) {
      return false
    }
    return true
  })

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Main Navigation */}
          <div className="flex items-center space-x-8 overflow-x-auto py-4">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Secondary Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/settings"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => track('nav_settings_click')}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}