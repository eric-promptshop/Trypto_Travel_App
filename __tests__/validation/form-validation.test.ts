import { z } from 'zod'
import {
  validationUtils,
  ValidationState,
  FieldValidationResult,
  ValidationResult,
  FormValidationOrchestrator,
  createDebouncedValidator,
  focusManagement
} from '@/lib/validation/form-validation'

describe('Validation Utils', () => {
  describe('required', () => {
    it('should require non-empty string', () => {
      const schema = validationUtils.required('Test Field')
      
      expect(() => schema.parse('')).toThrow('Test Field is required')
      expect(() => schema.parse('valid')).not.toThrow()
    })
  })

  describe('email', () => {
    it('should validate email format', () => {
      const schema = validationUtils.email()
      
      expect(() => schema.parse('invalid-email')).toThrow()
      expect(() => schema.parse('test@example.com')).not.toThrow()
      expect(() => schema.parse('user.name+tag@domain.co.uk')).not.toThrow()
    })

    it('should use custom error message', () => {
      const schema = validationUtils.email('Custom email error')
      
      expect(() => schema.parse('invalid')).toThrow('Custom email error')
    })
  })

  describe('phone', () => {
    it('should validate phone number format', () => {
      const schema = validationUtils.phone()
      
      expect(() => schema.parse('123')).toThrow('Phone number must be at least 10 digits')
      expect(() => schema.parse('1234567890')).not.toThrow()
      expect(() => schema.parse('+1 (555) 123-4567')).not.toThrow()
    })
  })

  describe('dateRange', () => {
    it('should validate date range', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-02')
      const schema = validationUtils.dateRange(startDate, endDate)
      
      const validData = {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-02')
      }
      
      const invalidData = {
        startDate: new Date('2024-06-02'),
        endDate: new Date('2024-06-01')
      }
      
      expect(() => schema.parse(validData)).not.toThrow()
      expect(() => schema.parse(invalidData)).toThrow('End date must be after start date')
    })
  })

  describe('budgetRange', () => {
    it('should validate budget range', () => {
      const schema = validationUtils.budgetRange(0, 100000)
      
      const validData = {
        budgetMin: 1000,
        budgetMax: 5000
      }
      
      const invalidData = {
        budgetMin: 5000,
        budgetMax: 1000
      }
      
      expect(() => schema.parse(validData)).not.toThrow()
      expect(() => schema.parse(invalidData)).toThrow('Maximum budget must be greater than or equal to minimum budget')
    })
  })

  describe('travelerCount', () => {
    it('should validate traveler counts', () => {
      const schema = validationUtils.travelerCount(10)
      
      const validData = {
        adults: 2,
        children: 1,
        infants: 0
      }
      
      const invalidData = {
        adults: 8,
        children: 8,
        infants: 8
      }
      
      expect(() => schema.parse(validData)).not.toThrow()
      expect(() => schema.parse(invalidData)).toThrow('Total travelers cannot exceed 10')
    })
  })

  describe('interests', () => {
    it('should validate interest selection', () => {
      const schema = validationUtils.interests(1, 5)
      
      expect(() => schema.parse([])).toThrow('Please select at least 1 interest')
      expect(() => schema.parse(['beach'])).not.toThrow()
      expect(() => schema.parse(['a', 'b', 'c', 'd', 'e', 'f'])).toThrow('Please select no more than 5 interests')
    })
  })
})

describe('FormValidationOrchestrator', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be 18 or older')
  })

  let orchestrator: FormValidationOrchestrator

  beforeEach(() => {
    orchestrator = new FormValidationOrchestrator(testSchema)
  })

  describe('validateForm', () => {
    it('should validate valid form data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      }

      const result = await orchestrator.validateForm(validData)

      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
      expect(result.touchedFields).toEqual(['name', 'email', 'age'])
    })

    it('should return errors for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: 15
      }

      const result = await orchestrator.validateForm(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveProperty('name')
      expect(result.errors).toHaveProperty('email')
      expect(result.errors).toHaveProperty('age')
      expect(result.firstErrorField).toBeDefined()
    })
  })

  describe('validateField', () => {
    it('should validate individual field', async () => {
      const result = await orchestrator.validateField('name', 'John Doe')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.state).toBe('valid')
    })

    it('should handle custom validators', async () => {
      const customValidator = jest.fn().mockResolvedValue({
        isValid: false,
        errors: ['Custom error'],
        warnings: [],
        state: 'invalid' as ValidationState
      })

      orchestrator.addCustomValidator('name', customValidator)

      const result = await orchestrator.validateField('name', 'test')

      expect(customValidator).toHaveBeenCalledWith('test')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Custom error')
    })
  })

  describe('step validation', () => {
    it('should validate specific step', async () => {
      const stepContext = {
        currentStep: 0,
        totalSteps: 2,
        stepFields: {
          0: ['name', 'email'],
          1: ['age']
        },
        requiredFields: {
          0: ['name', 'email'],
          1: ['age']
        },
        optionalFields: {
          0: [],
          1: []
        }
      }

      const stepOrchestrator = new FormValidationOrchestrator(testSchema, stepContext)

      const stepData = {
        name: 'John',
        email: 'john@example.com',
        age: 25 // This should be ignored for step 0
      }

      const result = await stepOrchestrator.validateStep(0, stepData)

      expect(result.isValid).toBe(true)
      // Should only validate step 0 fields
      expect(result.touchedFields).toEqual(['name', 'email'])
    })
  })
})

describe('createDebouncedValidator', () => {
  it('should debounce validation calls', async () => {
    const mockValidator = jest.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      state: 'valid' as ValidationState
    })

    const debouncedValidator = createDebouncedValidator(mockValidator, 100)

    // Make multiple rapid calls
    debouncedValidator('value1')
    debouncedValidator('value2')
    const result = await debouncedValidator('value3')

    // Should only call the validator once with the last value
    expect(mockValidator).toHaveBeenCalledTimes(1)
    expect(mockValidator).toHaveBeenCalledWith('value3')
    expect(result.isValid).toBe(true)
  })
})

describe('focusManagement', () => {
  // Mock DOM methods
  beforeEach(() => {
    document.querySelector = jest.fn()
    Element.prototype.focus = jest.fn()
    Element.prototype.scrollIntoView = jest.fn()
  })

  describe('focusFirstError', () => {
    it('should focus first error field', () => {
      const mockElement = {
        focus: jest.fn(),
        scrollIntoView: jest.fn()
      } as any

      ;(document.querySelector as jest.Mock).mockReturnValue(mockElement)

      const errors = {
        email: ['Invalid email'],
        name: ['Name required']
      }

      const result = focusManagement.focusFirstError(errors)

      expect(result).toBe(true)
      expect(document.querySelector).toHaveBeenCalledWith('[name="email"]')
      expect(mockElement.focus).toHaveBeenCalled()
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      })
    })

    it('should return false if no element found', () => {
      ;(document.querySelector as jest.Mock).mockReturnValue(null)

      const errors = { email: ['Invalid email'] }
      const result = focusManagement.focusFirstError(errors)

      expect(result).toBe(false)
    })
  })

  describe('focusField', () => {
    it('should focus specific field', () => {
      const mockElement = {
        focus: jest.fn(),
        scrollIntoView: jest.fn()
      } as any

      ;(document.querySelector as jest.Mock).mockReturnValue(mockElement)

      const result = focusManagement.focusField('email')

      expect(result).toBe(true)
      expect(document.querySelector).toHaveBeenCalledWith('[name="email"]')
      expect(mockElement.focus).toHaveBeenCalled()
    })
  })

  describe('scrollToFirstError', () => {
    it('should scroll to first error using data-field attribute', () => {
      const mockElement = {
        scrollIntoView: jest.fn()
      } as any

      ;(document.querySelector as jest.Mock).mockReturnValue(mockElement)

      const errors = { email: ['Invalid email'] }
      const result = focusManagement.scrollToFirstError(errors)

      expect(result).toBe(true)
      expect(document.querySelector).toHaveBeenCalledWith('[data-field="email"]')
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      })
    })
  })
}) 