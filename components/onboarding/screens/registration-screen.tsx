"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboarding } from "@/contexts/onboarding-context"
import { ChevronLeft, ChevronRight, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"
import { signIn } from "next-auth/react"
import bcrypt from "bcryptjs"

interface RegistrationData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phoneNumber: string
  acceptTerms: boolean
}

export function RegistrationScreen() {
  const { onboardingData, updateOnboardingData, navigateToNextStep, navigateToPrevStep } = useOnboarding()
  
  const [formData, setFormData] = useState<RegistrationData>({
    email: onboardingData.companyProfile?.contactEmail || "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: onboardingData.companyProfile?.phoneNumber || "",
    acceptTerms: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const handleChange = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    if (!formData.firstName) newErrors.firstName = "First name is required"
    if (!formData.lastName) newErrors.lastName = "Last name is required"
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    
    setIsLoading(true)
    
    try {
      // Create the user account
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`,
          role: 'TOUR_OPERATOR',
          companyName: onboardingData.companyProfile?.companyName,
          tenantId: onboardingData.tenantId || 'default',
          phoneNumber: formData.phoneNumber,
          onboardingData: onboardingData
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }
      
      const result = await response.json()
      
      // Update onboarding data with user info
      updateOnboardingData({
        registration: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userId: result.userId,
          completed: true
        }
      })
      
      // Sign in the user automatically
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })
      
      if (signInResult?.error) {
        throw new Error('Failed to sign in after registration')
      }
      
      setRegistrationComplete(true)
      
      // Wait a moment to show success state
      setTimeout(() => {
        navigateToNextStep()
      }, 2000)
      
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationComplete) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary-blue mb-2">Registration Complete!</h2>
          <p className="text-slate-600">Your account has been created successfully.</p>
          <p className="text-sm text-slate-500 mt-2">Redirecting to final steps...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary-blue mb-6">Create Your Account</h2>
      <p className="text-slate-600 mb-8">
        Set up your login credentials to access your tour operator dashboard.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>Your login credentials and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address*</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="john@company.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Password Setup</CardTitle>
            <CardDescription>Choose a secure password for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password*</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password*</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => handleChange("acceptTerms", e.target.checked)}
            className="rounded border-slate-300 text-accent-orange focus:ring-accent-orange"
          />
          <span className="ml-2 text-sm text-slate-600">
            I accept the{" "}
            <a href="/terms" target="_blank" className="text-primary-blue hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" className="text-primary-blue hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>}
      </div>

      {errors.submit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-between mt-10">
        <Button 
          variant="ghost" 
          onClick={navigateToPrevStep} 
          className="text-primary-blue hover:bg-blue-50"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-accent-orange hover:bg-orange-600 text-white"
          style={{ backgroundColor: "#ff6b35" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}