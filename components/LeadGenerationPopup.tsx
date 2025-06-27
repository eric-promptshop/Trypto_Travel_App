"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Mail, 
  Sparkles, 
  Lock,
  CheckCircle,
  Gift,
  Zap,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useAnalytics } from '@/lib/analytics/analytics-service'

interface LeadGenerationPopupProps {
  isOpen: boolean
  onClose: () => void
  triggerReason?: 'exit_intent' | 'time_based' | 'scroll' | 'save_itinerary'
  itineraryContext?: {
    destination?: string
    duration?: number
    travelers?: number
  }
}

export function LeadGenerationPopup({
  isOpen,
  onClose,
  triggerReason = 'time_based',
  itineraryContext
}: LeadGenerationPopupProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(true)
  const { track } = useAnalytics()

  useEffect(() => {
    if (isOpen) {
      track('lead_popup_shown', { 
        trigger_reason: triggerReason,
        has_itinerary: !!itineraryContext 
      })
    }
  }, [isOpen, triggerReason, itineraryContext, track])

  const benefits = [
    {
      icon: Gift,
      title: 'Exclusive Deals',
      description: 'Get access to member-only travel deals'
    },
    {
      icon: Zap,
      title: 'Save Your Progress',
      description: 'Never lose your itinerary planning'
    },
    {
      icon: Shield,
      title: 'Free Forever',
      description: 'No credit card required'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      // Submit lead to API
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          acceptMarketing,
          source: 'lead_popup',
          triggerReason,
          itineraryContext,
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      const data = await response.json()

      // Track conversion
      track('lead_popup_converted', {
        trigger_reason: triggerReason,
        has_itinerary: !!itineraryContext,
        accept_marketing: acceptMarketing
      })

      // Mark as converted immediately
      localStorage.setItem('lead_popup_converted', 'true')
      localStorage.setItem('lead_popup_email', email)
      
      // Show success message
      toast.success('Welcome aboard! Check your email for next steps.')

      // If user has itinerary, save it to their account
      if (itineraryContext && data.userId) {
        localStorage.setItem('pending_user_id', data.userId)
      }

      // Close popup immediately
      onClose()

    } catch (error) {
      console.error('Error capturing lead:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getHeadline = () => {
    if (itineraryContext?.destination) {
      return `Save Your ${itineraryContext.destination} Trip`
    }
    
    switch (triggerReason) {
      case 'exit_intent':
        return "Wait! Don't Lose Your Progress"
      case 'save_itinerary':
        return 'Save Your Itinerary Forever'
      case 'scroll':
        return 'Unlock Premium Travel Features'
      default:
        return 'Join 50,000+ Smart Travelers'
    }
  }

  const getSubheadline = () => {
    if (itineraryContext?.destination) {
      return `Keep your ${itineraryContext.duration || 7}-day itinerary and get exclusive ${itineraryContext.destination} travel tips`
    }
    
    return 'Get instant access to AI-powered trip planning and exclusive travel deals'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-[#1f5582] to-[#2d6ba3] p-6 text-white">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
              
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  {getHeadline()}
                </DialogTitle>
                <DialogDescription className="text-white/90 text-base mt-2">
                  {getSubheadline()}
                </DialogDescription>
              </DialogHeader>

              {/* Decorative element */}
              <div className="absolute -bottom-1 left-0 right-0 h-8 bg-white rounded-t-[2rem]" />
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <benefit.icon className="h-6 w-6 text-[#1f5582]" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">{benefit.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{benefit.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={acceptMarketing}
                    onCheckedChange={(checked) => setAcceptMarketing(checked as boolean)}
                  />
                  <Label
                    htmlFor="marketing"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Send me exclusive travel deals and destination guides
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#1f5582] to-[#2d6ba3] hover:from-[#1a4a73] hover:to-[#265a94] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {itineraryContext ? 'Save My Itinerary' : 'Get Started Free'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      localStorage.setItem('lead_popup_skipped', 'true')
                      localStorage.setItem('lead_popup_skip_time', Date.now().toString())
                      onClose()
                    }}
                    className="px-6"
                  >
                    Skip for now
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  <Lock className="inline h-3 w-3 mr-1" />
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </form>

              {/* Social proof */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"
                          style={{
                            backgroundImage: `url(https://i.pravatar.cc/24?img=${i})`,
                            backgroundSize: 'cover'
                          }}
                        />
                      ))}
                    </div>
                    <span className="ml-2">50k+ travelers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★★★★★</span>
                    <span>4.9/5</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}