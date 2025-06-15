'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, Settings, LogOut, X, Map, BookOpen, Building2, Plane, Briefcase } from 'lucide-react'
import { useAnalytics } from '@/lib/analytics/analytics-service'
import { TripNavLogo } from '@/components/ui/TripNavLogo'
import { cn } from '@/lib/utils'

export function MainHeader() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { track } = useAnalytics()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignIn = () => {
    track('user_sign_in_attempt')
    signIn('credentials', { callbackUrl: '/trips' })
  }

  const handleSignOut = () => {
    track('user_sign_out')
    signOut()
  }

  const navigationItems = [
    { href: '/plan', label: 'Plan Trip', icon: Map },
    { href: '/onboarding', label: 'Tour Operator', icon: Building2 },
    { href: '/docs', label: 'Guide', icon: BookOpen },
  ]

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "py-2" : "py-4"
    )}>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav 
          data-state={mobileMenuOpen ? 'active' : undefined}
          className={cn(
            "group relative z-20 w-full rounded-xl border border-white/10 backdrop-blur-md transition-all duration-300",
            scrolled 
              ? "bg-brand-neutral-50/95 shadow-glass border-brand-blue-200/20" 
              : "bg-brand-neutral-50/80",
          )}
        >
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2"
                  onClick={() => track('header_logo_click')}
                >
                  <TripNavLogo 
                    size="md" 
                    animated={true}
                    variant="default"
                    className="transition-transform duration-200 hover:scale-105"
                  />
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-center space-x-6">
                  {navigationItems.map((item) => (
                    <motion.div 
                      key={item.href}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center space-x-1 text-sm font-medium text-brand-blue-700 hover:text-brand-orange-500 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-brand-orange-50"
                        onClick={() => track('header_nav_click', { item: item.label })}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* User Actions */}
              <div className="flex items-center space-x-4">
                {status === 'loading' ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-brand-neutral-200" />
                ) : session ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-brand-orange-50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                          <AvatarFallback className="bg-brand-blue-100 text-brand-blue-700">
                            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-brand-neutral-50/95 backdrop-blur-md border-brand-blue-200/20" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-brand-blue-800">{session.user?.name}</p>
                          <p className="text-xs leading-none text-brand-blue-600">
                            {session.user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-brand-blue-200/30" />
                      {session.user?.role === 'AGENT' ? (
                        <DropdownMenuItem asChild className="hover:bg-brand-orange-50">
                          <Link href="/tour-operator" className="flex items-center text-brand-blue-700">
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>My Tours</span>
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild className="hover:bg-brand-orange-50">
                          <Link href="/trips" className="flex items-center text-brand-blue-700">
                            <Plane className="mr-2 h-4 w-4" />
                            <span>My Trips</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild className="hover:bg-brand-orange-50">
                        <Link href="/profile" className="flex items-center text-brand-blue-700">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="hover:bg-brand-orange-50">
                        <Link href="/settings" className="flex items-center text-brand-blue-700">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-brand-blue-200/30" />
                      <DropdownMenuItem onClick={handleSignOut} className="hover:bg-brand-orange-50 text-brand-blue-700">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    onClick={handleSignIn} 
                    size="sm"
                    className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-800 hover:from-brand-blue-700 hover:to-brand-blue-900 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Sign In
                  </Button>
                )}

                {/* Mobile Menu Toggle */}
                <div className="md:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                    className="relative z-20 -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-brand-blue-700 hover:bg-brand-orange-50 transition-colors duration-200"
                  >
                    <Menu className={cn(
                      "h-6 w-6 transition-all duration-300",
                      mobileMenuOpen ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
                    )} />
                    <X className={cn(
                      "absolute h-6 w-6 transition-all duration-300",
                      mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
                    )} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="md:hidden border-t border-brand-blue-200/20"
                >
                  <div className="space-y-1 px-4 pb-4 pt-4">
                    {navigationItems.map((item) => (
                      <motion.div
                        key={item.href}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-brand-blue-700 hover:bg-brand-orange-50 transition-colors duration-200"
                          onClick={() => {
                            setMobileMenuOpen(false)
                            track('mobile_nav_click', { item: item.label })
                          }}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    ))}
                    
                    {session && (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
                        <hr className="my-4 border-brand-blue-200/30" />
                        {session.user?.role === 'TOUR_OPERATOR' ? (
                          <Link
                            href="/tour-operator"
                            className="flex items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-brand-blue-700 hover:bg-brand-orange-50 transition-colors duration-200"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Briefcase className="h-5 w-5" />
                            <span>My Tours</span>
                          </Link>
                        ) : (
                          <Link
                            href="/trips"
                            className="flex items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-brand-blue-700 hover:bg-brand-orange-50 transition-colors duration-200"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Plane className="h-5 w-5" />
                            <span>My Trips</span>
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-brand-blue-700 hover:bg-brand-orange-50 transition-colors duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="h-5 w-5" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-brand-blue-700 hover:bg-brand-orange-50 transition-colors duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="h-5 w-5" />
                          <span>Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false)
                            handleSignOut()
                          }}
                          className="flex w-full items-center space-x-2 rounded-md px-3 py-3 text-base font-medium text-brand-blue-700 hover:bg-brand-orange-50 transition-colors duration-200 text-left"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Log out</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
        
        {/* Glass Effect Background */}
        {scrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 -z-10 rounded-xl bg-glass-gradient backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            }}
          />
        )}
      </div>
    </header>
  )
}