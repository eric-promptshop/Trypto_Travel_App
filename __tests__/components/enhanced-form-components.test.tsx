import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  ValidationMessage,
  EnhancedFormField,
  EnhancedInput,
  EnhancedTextarea,
  FormValidationSummary,
  ValidationStatusBadge,
  ValidationToast
} from '@/components/travel-forms/enhanced-form-components'

describe('ValidationMessage', () => {
  it('should render error messages with icons', () => {
    render(
      <ValidationMessage 
        errors={['Field is required', 'Invalid format']}
        showIcon={true}
      />
    )

    expect(screen.getByText('Field is required')).toBeInTheDocument()
    expect(screen.getByText('Invalid format')).toBeInTheDocument()
    // Check for error icons
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('should render warning messages', () => {
    render(
      <ValidationMessage 
        warnings={['This field may be incorrect']}
        showIcon={true}
      />
    )

    expect(screen.getByText('This field may be incorrect')).toBeInTheDocument()
  })

  it('should render success message', () => {
    render(
      <ValidationMessage 
        success="Field is valid"
        showIcon={true}
      />
    )

    expect(screen.getByText('Field is valid')).toBeInTheDocument()
  })

  it('should not render when no messages provided', () => {
    const { container } = render(<ValidationMessage />)
    expect(container.firstChild).toBeNull()
  })

  it('should hide icons when showIcon is false', () => {
    render(
      <ValidationMessage 
        errors={['Error message']}
        showIcon={false}
      />
    )

    expect(screen.getByText('Error message')).toBeInTheDocument()
    // Should have fewer icons when showIcon is false
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBe(0)
  })
})

describe('EnhancedFormField', () => {
  it('should render label with required indicator', () => {
    render(
      <EnhancedFormField
        label="Email Address"
        required={true}
        fieldName="email"
      >
        <input name="email" />
      </EnhancedFormField>
    )

    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should render description', () => {
    render(
      <EnhancedFormField
        label="Password"
        description="Must be at least 8 characters long"
        fieldName="password"
      >
        <input name="password" />
      </EnhancedFormField>
    )

    expect(screen.getByText('Must be at least 8 characters long')).toBeInTheDocument()
  })

  it('should show validation state indicators', () => {
    const { rerender } = render(
      <EnhancedFormField
        label="Test Field"
        state="validating"
        fieldName="test"
      >
        <input name="test" />
      </EnhancedFormField>
    )

    // Validating state should show spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()

    // Valid state should show checkmark
    rerender(
      <EnhancedFormField
        label="Test Field"
        state="valid"
        fieldName="test"
      >
        <input name="test" />
      </EnhancedFormField>
    )

    expect(document.querySelector('svg')).toBeInTheDocument()

    // Invalid state with errors should show error icon
    rerender(
      <EnhancedFormField
        label="Test Field"
        state="invalid"
        errors={['Field is invalid']}
        fieldName="test"
      >
        <input name="test" />
      </EnhancedFormField>
    )

    expect(screen.getByText('Field is invalid')).toBeInTheDocument()
  })

  it('should apply error styling to label', () => {
    render(
      <EnhancedFormField
        label="Error Field"
        errors={['This field has an error']}
        fieldName="error"
      >
        <input name="error" />
      </EnhancedFormField>
    )

    const label = screen.getByText('Error Field')
    expect(label).toHaveClass('text-destructive')
  })
})

describe('EnhancedInput', () => {
  it('should apply error styling when errors present', () => {
    render(
      <EnhancedInput
        name="test"
        errors={['Field is required']}
        data-testid="enhanced-input"
      />
    )

    const input = screen.getByTestId('enhanced-input')
    expect(input).toHaveClass('border-destructive')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should apply warning styling when warnings present', () => {
    render(
      <EnhancedInput
        name="test"
        warnings={['Field may be incorrect']}
        data-testid="enhanced-input"
      />
    )

    const input = screen.getByTestId('enhanced-input')
    expect(input).toHaveClass('border-amber-500')
  })

  it('should apply valid styling when state is valid', () => {
    render(
      <EnhancedInput
        name="test"
        state="valid"
        data-testid="enhanced-input"
      />
    )

    const input = screen.getByTestId('enhanced-input')
    expect(input).toHaveClass('border-green-500')
  })

  it('should apply validating styling when state is validating', () => {
    render(
      <EnhancedInput
        name="test"
        state="validating"
        data-testid="enhanced-input"
      />
    )

    const input = screen.getByTestId('enhanced-input')
    expect(input).toHaveClass('border-primary')
  })
})

describe('EnhancedTextarea', () => {
  it('should apply same validation styling as EnhancedInput', () => {
    render(
      <EnhancedTextarea
        name="test"
        errors={['Field is required']}
        data-testid="enhanced-textarea"
      />
    )

    const textarea = screen.getByTestId('enhanced-textarea')
    expect(textarea).toHaveClass('border-destructive')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('FormValidationSummary', () => {
  it('should not render when no errors or warnings', () => {
    const { container } = render(
      <FormValidationSummary 
        errors={{}}
        warnings={{}}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render error summary', () => {
    const errors = {
      email: ['Email is required', 'Invalid email format'],
      password: ['Password is too short']
    }

    render(
      <FormValidationSummary 
        errors={errors}
        warnings={{}}
      />
    )

    expect(screen.getByText('2 errors found')).toBeInTheDocument()
    expect(screen.getByText(/email: Email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password: Password is too short/i)).toBeInTheDocument()
  })

  it('should render warning summary', () => {
    const warnings = {
      phone: ['Phone number format may be incorrect']
    }

    render(
      <FormValidationSummary 
        errors={{}}
        warnings={warnings}
      />
    )

    expect(screen.getByText('1 warning')).toBeInTheDocument()
    expect(screen.getByText(/phone: Phone number format may be incorrect/i)).toBeInTheDocument()
  })

  it('should call onFieldClick when error is clicked', () => {
    const onFieldClick = jest.fn()
    const errors = {
      email: ['Email is required']
    }

    render(
      <FormValidationSummary 
        errors={errors}
        warnings={{}}
        onFieldClick={onFieldClick}
      />
    )

    const errorButton = screen.getByText(/email: Email is required/i)
    fireEvent.click(errorButton)

    expect(onFieldClick).toHaveBeenCalledWith('email')
  })
})

describe('ValidationStatusBadge', () => {
  it('should not render for idle state', () => {
    const { container } = render(
      <ValidationStatusBadge state="idle" />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render validating badge', () => {
    render(<ValidationStatusBadge state="validating" />)
    expect(screen.getByText('Validating...')).toBeInTheDocument()
  })

  it('should render valid badge', () => {
    render(<ValidationStatusBadge state="valid" />)
    expect(screen.getByText('Valid')).toBeInTheDocument()
  })

  it('should render invalid badge with error count', () => {
    render(<ValidationStatusBadge state="invalid" errorCount={3} />)
    expect(screen.getByText('3 errors')).toBeInTheDocument()
  })

  it('should render invalid badge without count', () => {
    render(<ValidationStatusBadge state="invalid" />)
    expect(screen.getByText('Invalid')).toBeInTheDocument()
  })
})

describe('ValidationToast', () => {
  it('should render toast message', () => {
    render(
      <ValidationToast 
        message="Form submitted successfully"
        type="success"
      />
    )

    expect(screen.getByText('Form submitted successfully')).toBeInTheDocument()
  })

  it('should render close button when onClose provided', () => {
    const onClose = jest.fn()

    render(
      <ValidationToast 
        message="Test message"
        type="info"
        onClose={onClose}
      />
    )

    const closeButton = screen.getByRole('button')
    expect(closeButton).toBeInTheDocument()
    
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })

  it('should auto-close after specified duration', async () => {
    const onClose = jest.fn()

    render(
      <ValidationToast 
        message="Auto close message"
        type="info"
        onClose={onClose}
        autoClose={true}
        duration={100}
      />
    )

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    }, { timeout: 200 })
  })

  it('should not auto-close when autoClose is false', async () => {
    const onClose = jest.fn()

    render(
      <ValidationToast 
        message="No auto close"
        type="info"
        onClose={onClose}
        autoClose={false}
        duration={100}
      />
    )

    // Wait longer than duration to ensure it doesn't auto-close
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should apply correct styling for different types', () => {
    const { rerender } = render(
      <ValidationToast message="Error" type="error" data-testid="toast" />
    )

    let toast = screen.getByTestId('toast')
    expect(toast).toHaveClass('bg-red-50', 'text-red-800')

    rerender(
      <ValidationToast message="Warning" type="warning" data-testid="toast" />
    )

    toast = screen.getByTestId('toast')
    expect(toast).toHaveClass('bg-amber-50', 'text-amber-800')

    rerender(
      <ValidationToast message="Success" type="success" data-testid="toast" />
    )

    toast = screen.getByTestId('toast')
    expect(toast).toHaveClass('bg-green-50', 'text-green-800')

    rerender(
      <ValidationToast message="Info" type="info" data-testid="toast" />
    )

    toast = screen.getByTestId('toast')
    expect(toast).toHaveClass('bg-blue-50', 'text-blue-800')
  })
}) 