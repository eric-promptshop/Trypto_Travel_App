'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Building2, AlertCircle, Check } from 'lucide-react'
import { toast } from 'sonner'

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

export default function OperatorSignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'info' | 'details' | 'confirmation'>('info')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  
  const [formData, setFormData] = useState({
    // Basic info
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    
    // Business details
    businessName: '',
    website: '',
    phone: '',
    description: '',
    timezone: 'UTC',
    languages: [] as string[],
    
    // Address
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (step === 'info') {
      // Validate basic info
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }
      setError(null)
      setStep('details')
      return
    }
    
    if (step === 'details') {
      // Validate business details
      if (!formData.businessName || !formData.city || !formData.country) {
        setError('Please fill in all required fields')
        return
      }
      setError(null)
      setStep('confirmation')
      return
    }
    
    // Final submission
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/operator/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName,
          website: formData.website || undefined,
          phone: formData.phone || undefined,
          description: formData.description || undefined,
          address: {
            street: formData.street || undefined,
            city: formData.city,
            state: formData.state || undefined,
            country: formData.country,
            postalCode: formData.postalCode || undefined,
          },
          timezone: formData.timezone,
          languages: formData.languages.length > 0 ? formData.languages : ['English'],
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      toast.success('Account created successfully! Please check your email to verify your account.')
      router.push('/auth/operator/signin')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Join as a Tour Operator</h1>
          <p className="mt-2 text-gray-600">Create your operator account to start managing tours and leads</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'info' && 'Basic Information'}
              {step === 'details' && 'Business Details'}
              {step === 'confirmation' && 'Confirm Your Information'}
            </CardTitle>
            <CardDescription>
              {step === 'info' && 'Let\'s start with your account information'}
              {step === 'details' && 'Tell us about your tour business'}
              {step === 'confirmation' && 'Review your information before creating your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 'info' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="operator@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}
              
              {step === 'details' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateFormData('businessName', e.target.value)}
                      placeholder="Amazing Tours Inc."
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (optional)</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateFormData('website', e.target.value)}
                        placeholder="https://example.com"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="+1 234 567 8900"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Tell us about your tour business..."
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Business Address</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <Input
                        placeholder="Country"
                        value={formData.country}
                        onChange={(e) => updateFormData('country', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Time Zone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => updateFormData('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {step === 'confirmation' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">Account Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Name:</span>
                      <span>{formData.firstName} {formData.lastName}</span>
                      <span className="text-gray-600">Email:</span>
                      <span>{formData.email}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">Business Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">Business Name:</span>
                      <span>{formData.businessName}</span>
                      <span className="text-gray-600">Location:</span>
                      <span>{formData.city}, {formData.country}</span>
                      {formData.website && (
                        <>
                          <span className="text-gray-600">Website:</span>
                          <span>{formData.website}</span>
                        </>
                      )}
                      <span className="text-gray-600">Time Zone:</span>
                      <span>{TIMEZONES.find(tz => tz.value === formData.timezone)?.label}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                {step !== 'info' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setError(null)
                      setStep(step === 'confirmation' ? 'details' : 'info')
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || (step === 'confirmation' && !agreeToTerms)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      {step === 'info' && 'Continue'}
                      {step === 'details' && 'Continue'}
                      {step === 'confirmation' && 'Create Account'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          {step === 'info' && (
            <CardFooter className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/operator/signin"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}