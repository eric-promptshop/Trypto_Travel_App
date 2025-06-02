"use client"

import * as React from "react"
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FormItem, FormControl, FormDescription } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ValidationState } from "@/lib/validation/form-validation"

// Enhanced validation message component
interface ValidationMessageProps {
  errors?: string[]
  warnings?: string[]
  success?: string | undefined
  className?: string
  showIcon?: boolean
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  errors = [],
  warnings = [],
  success,
  className,
  showIcon = true
}) => {
  if (!errors.length && !warnings.length && !success) {
    return null
  }

  return (
    <div className={cn("space-y-1", className)}>
      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          {showIcon && <CheckCircle className="h-4 w-4" />}
          {success}
        </div>
      )}

      {/* Error messages */}
      {errors.map((error, index) => (
        <div key={`error-${index}`} className="flex items-center gap-2 text-sm text-destructive">
          {showIcon && <AlertCircle className="h-4 w-4" />}
          {error}
        </div>
      ))}

      {/* Warning messages */}
      {warnings.map((warning, index) => (
        <div key={`warning-${index}`} className="flex items-center gap-2 text-sm text-amber-600">
          {showIcon && <AlertTriangle className="h-4 w-4" />}
          {warning}
        </div>
      ))}
    </div>
  )
}

// Enhanced form field wrapper with validation states
interface EnhancedFormFieldProps {
  children: React.ReactNode
  label: string
  description?: string
  errors?: string[]
  warnings?: string[]
  success?: string
  state?: ValidationState
  required?: boolean
  className?: string
  fieldName?: string
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  children,
  label,
  description,
  errors = [],
  warnings = [],
  success,
  state = 'idle',
  required = false,
  className,
  fieldName
}) => {
  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const hasSuccess = !!success

  return (
    <FormItem className={cn("space-y-2", className)} data-field={fieldName}>
      <Label className={cn(
        "flex items-center gap-1",
        hasErrors && "text-destructive",
        hasWarnings && !hasErrors && "text-amber-600",
        hasSuccess && !hasErrors && !hasWarnings && "text-green-600"
      )}>
        {label}
        {required && <span className="text-destructive">*</span>}
        
        {/* Validation state indicator */}
        <div className="ml-auto">
          {state === 'validating' && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
          )}
          {state === 'valid' && !hasErrors && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {state === 'invalid' && hasErrors && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </Label>

      <FormControl>
        {children}
      </FormControl>

      {description && (
        <FormDescription>
          {description}
        </FormDescription>
      )}

      <ValidationMessage 
        errors={errors}
        warnings={warnings}
        success={success || undefined}
      />
    </FormItem>
  )
}

// Enhanced Input with validation states
interface EnhancedInputProps extends React.ComponentProps<"input"> {
  state?: ValidationState
  errors?: string[]
  warnings?: string[]
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, state = 'idle', errors = [], warnings = [], ...props }, ref) => {
    const hasErrors = errors.length > 0
    const hasWarnings = warnings.length > 0

    return (
      <Input
        ref={ref}
        className={cn(
          // Base styles
          "transition-all duration-200",
          // Validation state styles
          hasErrors && "border-destructive focus-visible:ring-destructive",
          hasWarnings && !hasErrors && "border-amber-500 focus-visible:ring-amber-500",
          state === 'valid' && !hasErrors && !hasWarnings && "border-green-500 focus-visible:ring-green-500",
          state === 'validating' && "border-primary focus-visible:ring-primary",
          className
        )}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? `${props.name}-error` : undefined}
        {...props}
      />
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

// Enhanced Textarea with validation states
interface EnhancedTextareaProps extends React.ComponentProps<"textarea"> {
  state?: ValidationState
  errors?: string[]
  warnings?: string[]
}

export const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ className, state = 'idle', errors = [], warnings = [], ...props }, ref) => {
    const hasErrors = errors.length > 0
    const hasWarnings = warnings.length > 0

    return (
      <Textarea
        ref={ref}
        className={cn(
          // Base styles
          "transition-all duration-200",
          // Validation state styles
          hasErrors && "border-destructive focus-visible:ring-destructive",
          hasWarnings && !hasErrors && "border-amber-500 focus-visible:ring-amber-500",
          state === 'valid' && !hasErrors && !hasWarnings && "border-green-500 focus-visible:ring-green-500",
          state === 'validating' && "border-primary focus-visible:ring-primary",
          className
        )}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? `${props.name}-error` : undefined}
        {...props}
      />
    )
  }
)
EnhancedTextarea.displayName = "EnhancedTextarea"

// Form validation summary component
interface FormValidationSummaryProps {
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  onFieldClick?: (fieldName: string) => void
  className?: string
}

export const FormValidationSummary: React.FC<FormValidationSummaryProps> = ({
  errors,
  warnings,
  onFieldClick,
  className
}) => {
  const errorCount = Object.keys(errors).length
  const warningCount = Object.keys(warnings).length

  if (errorCount === 0 && warningCount === 0) {
    return null
  }

  return (
    <Alert className={cn("space-y-3", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          {/* Summary header */}
          <div className="font-medium">
            {errorCount > 0 && (
              <span className="text-destructive">
                {errorCount} error{errorCount > 1 ? 's' : ''} found
              </span>
            )}
            {errorCount > 0 && warningCount > 0 && <span className="mx-2">•</span>}
            {warningCount > 0 && (
              <span className="text-amber-600">
                {warningCount} warning{warningCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Error list */}
          {errorCount > 0 && (
            <div className="space-y-1">
              {Object.entries(errors).map(([fieldName, fieldErrors]) => (
                <div key={fieldName} className="space-y-1">
                  {fieldErrors.map((error, index) => (
                    <button
                      key={`${fieldName}-error-${index}`}
                      type="button"
                      onClick={() => onFieldClick?.(fieldName)}
                      className="block text-left text-sm text-destructive hover:underline focus:outline-none focus:underline"
                    >
                      <strong>{fieldName}:</strong> {error}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Warning list */}
          {warningCount > 0 && (
            <div className="space-y-1">
              {Object.entries(warnings).map(([fieldName, fieldWarnings]) => (
                <div key={fieldName} className="space-y-1">
                  {fieldWarnings.map((warning, index) => (
                    <button
                      key={`${fieldName}-warning-${index}`}
                      type="button"
                      onClick={() => onFieldClick?.(fieldName)}
                      className="block text-left text-sm text-amber-600 hover:underline focus:outline-none focus:underline"
                    >
                      <strong>{fieldName}:</strong> {warning}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Field validation status badge
interface ValidationStatusBadgeProps {
  state: ValidationState
  errorCount?: number
  warningCount?: number
  className?: string
}

export const ValidationStatusBadge: React.FC<ValidationStatusBadgeProps> = ({
  state,
  errorCount = 0,
  warningCount = 0,
  className
}) => {
  if (state === 'idle') {
    return null
  }

  const getVariantAndContent = () => {
    switch (state) {
      case 'validating':
        return { variant: 'secondary', content: 'Validating...', icon: Info }
      case 'valid':
        return { variant: 'default', content: 'Valid', icon: CheckCircle }
      case 'invalid':
        return { 
          variant: 'destructive', 
          content: errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : 'Invalid',
          icon: AlertCircle 
        }
      default:
        return { variant: 'secondary', content: 'Unknown', icon: Info }
    }
  }

  const { variant, content, icon: Icon } = getVariantAndContent()

  return (
    <Badge 
      variant={variant as any} 
      className={cn("gap-1 text-xs", className)}
    >
      <Icon className="h-3 w-3" />
      {content}
    </Badge>
  )
}

// Toast-style validation notification
interface ValidationToastProps {
  message: string
  type: 'error' | 'warning' | 'success' | 'info'
  onClose?: () => void
  autoClose?: boolean
  duration?: number
  className?: string
}

export const ValidationToast: React.FC<ValidationToastProps> = ({
  message,
  type,
  onClose,
  autoClose = true,
  duration = 5000,
  className
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  const getStyles = () => {
    switch (type) {
      case 'error':
        return { 
          bgColor: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800', 
          textColor: 'text-red-800 dark:text-red-200', 
          icon: AlertCircle 
        }
      case 'warning':
        return { 
          bgColor: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', 
          textColor: 'text-amber-800 dark:text-amber-200', 
          icon: AlertTriangle 
        }
      case 'success':
        return { 
          bgColor: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800', 
          textColor: 'text-green-800 dark:text-green-200', 
          icon: CheckCircle 
        }
      case 'info':
      default:
        return { 
          bgColor: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800', 
          textColor: 'text-blue-800 dark:text-blue-200', 
          icon: Info 
        }
    }
  }

  const { bgColor, textColor, icon: Icon } = getStyles()

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-md backdrop-blur-sm",
      bgColor,
      textColor,
      className
    )}>
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn("shrink-0 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm", textColor)}
        >
          <X className="h-4 w-4 touch-target" />
          <span className="sr-only">Close notification</span>
        </button>
      )}
    </div>
  )
} 