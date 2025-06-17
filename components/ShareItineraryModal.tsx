"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  Mail,
  Share2,
  Link,
  QrCode,
  FileText,
  Lock,
  Users,
  Check,
  Loader2,
  User,
  Facebook,
  Twitter,
  MessageCircle,
  Copy
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { generatePDF } from '@/lib/utils/pdf-generator'
import { usePlanStore } from '@/store/planStore'

interface ShareItineraryModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  tripTitle: string
  destination: string
  startDate: string
  endDate: string
}

export function ShareItineraryModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  destination,
  startDate,
  endDate
}: ShareItineraryModalProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('share')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  
  const itinerary = usePlanStore((state) => state.itinerary)

  // Generate shareable link
  const shareableLink = `${window.location.origin}/shared-itinerary?id=${tripId}&title=${encodeURIComponent(tripTitle)}&destination=${encodeURIComponent(destination)}&dates=${startDate}_${endDate}`

  // Generate QR code on mount
  React.useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(shareableLink, { width: 200 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err))
    }
  }, [isOpen, shareableLink])

  // Handle download as PDF
  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true)
      
      if (!session && !showSignUpPrompt) {
        setShowSignUpPrompt(true)
        return
      }

      // Generate PDF
      await generatePDF({
        tripId,
        tripTitle,
        destination,
        startDate,
        endDate,
        itinerary
      })
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle download as JSON
  const handleDownloadJSON = () => {
    try {
      if (!session && !showSignUpPrompt) {
        setShowSignUpPrompt(true)
        return
      }

      const data = {
        tripId,
        tripTitle,
        destination,
        startDate,
        endDate,
        itinerary,
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tripTitle.replace(/\s+/g, '-').toLowerCase()}-itinerary.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Itinerary downloaded successfully!')
    } catch (error) {
      console.error('Error downloading JSON:', error)
      toast.error('Failed to download itinerary')
    }
  }

  // Handle email sharing
  const handleEmailShare = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    try {
      setIsLoading(true)

      if (!session && !showSignUpPrompt) {
        setShowSignUpPrompt(true)
        return
      }

      // Send email via API
      const response = await fetch('/api/share/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tripId,
          tripTitle,
          destination,
          startDate,
          endDate,
          shareableLink
        })
      })

      if (!response.ok) throw new Error('Failed to send email')

      toast.success(`Itinerary sent to ${email}`)
      setEmail('')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink)
    setCopiedLink(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopiedLink(false), 3000)
  }

  // Handle social media sharing
  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const text = `Check out my ${destination} itinerary: ${tripTitle}`
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareableLink)}`
    }

    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  // Handle sign up
  const handleSignUp = () => {
    // Store current itinerary in sessionStorage before redirecting
    sessionStorage.setItem('pendingItinerary', JSON.stringify({
      tripId,
      tripTitle,
      destination,
      startDate,
      endDate,
      itinerary
    }))
    
    router.push('/auth/signup?redirect=/plan/' + tripId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Share Your Itinerary</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </TabsTrigger>
            <TabsTrigger value="download">
              <Download className="h-4 w-4 mr-2" />
              Download
            </TabsTrigger>
            <TabsTrigger value="save">
              <Lock className="h-4 w-4 mr-2" />
              Save
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="share" className="mt-4 space-y-4">
              {/* Copy Link */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Share Link
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={shareableLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant={copiedLink ? "default" : "outline"}
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Email Share */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send via Email
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleEmailShare}
                    disabled={isLoading || !email}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send Itinerary
                  </Button>
                </div>
              </Card>

              {/* Social Media */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Social Media
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('facebook')}
                    className="flex-1"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('twitter')}
                    className="flex-1"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('whatsapp')}
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </Card>

              {/* QR Code */}
              {qrCodeUrl && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </h3>
                  <div className="flex justify-center">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Scan to view itinerary on mobile
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="download" className="mt-4 space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Download Options
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isLoading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Download as PDF
                    <span className="ml-auto text-sm text-gray-500">
                      Printable format
                    </span>
                  </Button>
                  
                  <Button
                    onClick={handleDownloadJSON}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download as JSON
                    <span className="ml-auto text-sm text-gray-500">
                      For backup
                    </span>
                  </Button>
                </div>
              </Card>

              {!session && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-800 mb-3">
                    Sign up to unlock additional download formats and cloud backup
                  </p>
                  <Button onClick={handleSignUp} className="w-full">
                    Sign Up for Free
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="save" className="mt-4 space-y-4">
              {session ? (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Saved to Your Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This itinerary is automatically saved to your account and can be accessed from "My Trips".
                  </p>
                  <Button
                    onClick={() => router.push('/trips')}
                    variant="outline"
                    className="w-full"
                  >
                    View My Trips
                  </Button>
                </Card>
              ) : (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Save to Your Account
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create a free account to save your itinerary and access it from any device.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Access from any device
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Edit and update anytime
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Share with travel companions
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Get personalized recommendations
                    </li>
                  </ul>
                  <Button onClick={handleSignUp} className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Sign Up & Save
                  </Button>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Sign Up Prompt Modal */}
        <AnimatePresence>
          {showSignUpPrompt && !session && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSignUpPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-3">Sign Up to Continue</h3>
                <p className="text-gray-600 mb-4">
                  Create a free account to download your itinerary and access additional features.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSignUpPrompt(false)}
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                  <Button
                    onClick={handleSignUp}
                    className="flex-1"
                  >
                    Sign Up
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}