import { z } from 'zod'

// Common validation patterns
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phonePattern = /^\+?[\d\s\-\(\)]+$/
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Validation utility functions
export const validationUtils = {
  // Required field validation
  required: (fieldName: string) => 
    z.string().min(1, `${fieldName} is required`),

  // Email validation
  email: (message?: string) => 
    z.string()
      .email(message || 'Please enter a valid email address')
      .refine(email => emailPattern.test(email), {
        message: message || 'Please enter a valid email address'
      }),

  // Phone validation
  phone: (message?: string) => 
    z.string()
      .min(10, 'Phone number must be at least 10 digits')
      .refine(phone => phonePattern.test(phone), {
        message: message || 'Please enter a valid phone number'
      }),

  // Password validation
  password: (message?: string) => 
    z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine(password => passwordPattern.test(password), {
        message: message || 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),

  // Date range validation
  dateRange: (startDate: Date, endDate: Date, message?: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return z.object({
      startDate: z.date()
        .min(today, 'Start date cannot be in the past'),
      endDate: z.date()
    }).refine(data => data.endDate > data.startDate, {
      message: message || 'End date must be after start date',
      path: ['endDate']
    })
  },

  // Budget range validation
  budgetRange: (min: number = 0, max: number = 1000000, message?: string) => 
    z.object({
      budgetMin: z.number()
        .min(min, `Minimum budget cannot be less than ${min}`)
        .max(max, `Minimum budget cannot exceed ${max}`),
      budgetMax: z.number()
        .min(min, `Maximum budget cannot be less than ${min}`)
        .max(max, `Maximum budget cannot exceed ${max}`)
    }).refine(data => data.budgetMax >= data.budgetMin, {
      message: message || 'Maximum budget must be greater than or equal to minimum budget',
      path: ['budgetMax']
    }),

  // Traveler count validation
  travelerCount: (maxTotal: number = 20) => 
    z.object({
      adults: z.number()
        .min(1, 'At least one adult is required')
        .max(maxTotal, `Cannot exceed ${maxTotal} adults`),
      children: z.number()
        .min(0, 'Children count cannot be negative')
        .max(maxTotal, `Cannot exceed ${maxTotal} children`),
      infants: z.number()
        .min(0, 'Infants count cannot be negative')
        .max(maxTotal, `Cannot exceed ${maxTotal} infants`)
    }).refine(data => (data.adults + data.children + data.infants) <= maxTotal, {
      message: `Total travelers cannot exceed ${maxTotal}`,
      path: ['adults']
    }),

  // Destination validation
  destination: (message?: string) => 
    z.string()
      .min(2, 'Destination must be at least 2 characters')
      .max(100, 'Destination cannot exceed 100 characters')
      .refine(dest => dest.trim().length > 0, {
        message: message || 'Please enter a valid destination'
      }),

  // Interest selection validation
  interests: (minSelections: number = 1, maxSelections: number = 10) => 
    z.array(z.string())
      .min(minSelections, `Please select at least ${minSelections} interest${minSelections > 1 ? 's' : ''}`)
      .max(maxSelections, `Please select no more than ${maxSelections} interest${maxSelections > 1 ? 's' : ''}`),

  // Custom validation
  custom: <T>(
    validator: (value: T) => boolean,
    message: string
  ) => z.any().refine(validator, { message })
}

// Field validation states
export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

export interface FieldValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  state: ValidationState
}

// Enhanced validation result with metadata
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  touchedFields: string[]
  validatedFields: string[]
  firstErrorField?: string | undefined
}

// Validation context for step-based forms
export interface StepValidationContext {
  currentStep: number
  totalSteps: number
  stepFields: Record<number, string[]>
  requiredFields: Record<number, string[]>
  optionalFields: Record<number, string[]>
}

// Real-time validation debounce utility
export const createDebouncedValidator = (
  validationFn: (value: any) => Promise<FieldValidationResult> | FieldValidationResult,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout

  return (value: any): Promise<FieldValidationResult> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        const result = await validationFn(value)
        resolve(result)
      }, delay)
    })
  }
}

// Form validation orchestrator
export class FormValidationOrchestrator {
  private schema: z.ZodSchema
  private stepContext: StepValidationContext | undefined
  private customValidators: Map<string, (value: any) => Promise<FieldValidationResult>>

  constructor(
    schema: z.ZodSchema,
    stepContext?: StepValidationContext | undefined
  ) {
    this.schema = schema
    this.stepContext = stepContext
    this.customValidators = new Map()
  }

  // Add custom field validator
  addCustomValidator(
    fieldName: string,
    validator: (value: any) => Promise<FieldValidationResult>
  ): void {
    this.customValidators.set(fieldName, validator)
  }

  // Validate single field
  async validateField(fieldName: string, value: any): Promise<FieldValidationResult> {
    try {
      // Check custom validators first
      const customValidator = this.customValidators.get(fieldName)
      if (customValidator) {
        return await customValidator(value)
      }

      // Use schema validation
      const fieldSchema = this.extractFieldSchema(fieldName)
      if (fieldSchema) {
        fieldSchema.parse(value)
        return {
          isValid: true,
          errors: [],
          warnings: [],
          state: 'valid'
        }
      }

      return {
        isValid: true,
        errors: [],
        warnings: [],
        state: 'idle'
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => err.message),
          warnings: [],
          state: 'invalid'
        }
      }

      return {
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
        state: 'invalid'
      }
    }
  }

  // Validate entire form
  async validateForm(data: Record<string, any>): Promise<ValidationResult> {
    try {
      this.schema.parse(data)
      
      return {
        isValid: true,
        errors: {},
        warnings: {},
        touchedFields: Object.keys(data),
        validatedFields: Object.keys(data)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {}
        const warnings: Record<string, string[]> = {}
        let firstErrorField: string | undefined = undefined

        error.errors.forEach(err => {
          const fieldName = err.path.join('.')
          if (!errors[fieldName]) {
            errors[fieldName] = []
          }
          errors[fieldName].push(err.message)
          
          if (firstErrorField === undefined) {
            firstErrorField = fieldName
          }
        })

        return {
          isValid: false,
          errors,
          warnings,
          touchedFields: Object.keys(data),
          validatedFields: Object.keys(errors),
          firstErrorField
        }
      }

      return {
        isValid: false,
        errors: { general: ['Validation failed'] },
        warnings: {},
        touchedFields: Object.keys(data),
        validatedFields: [],
        firstErrorField: 'general'
      }
    }
  }

  // Validate current step
  async validateStep(stepNumber: number, data: Record<string, any>): Promise<ValidationResult> {
    if (!this.stepContext) {
      return this.validateForm(data)
    }

    const stepFields = this.stepContext.stepFields[stepNumber] || []
    const stepData = Object.fromEntries(
      Object.entries(data).filter(([key]) => stepFields.includes(key))
    )

    return this.validateForm(stepData)
  }

  // Extract field schema from main schema (simplified implementation)
  private extractFieldSchema(fieldName: string): z.ZodSchema | null {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd need more sophisticated schema introspection
      return z.any()
    } catch {
      return null
    }
  }
}

// Utility for focus management
export const focusManagement = {
  // Focus first error field
  focusFirstError: (errors: Record<string, string[]>): boolean => {
    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
      if (element) {
        element.focus()
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return true
      }
    }
    return false
  },

  // Focus specific field
  focusField: (fieldName: string): boolean => {
    const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return true
    }
    return false
  },

  // Scroll to first error
  scrollToFirstError: (errors: Record<string, string[]>): boolean => {
    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField) {
      const element = document.querySelector(`[data-field="${firstErrorField}"]`) as HTMLElement
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return true
      }
    }
    return false
  }
} 