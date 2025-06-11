'use client';

import { useErrorHandler } from './error-boundary';

export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T) => boolean;
  message: string;
  required?: boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[] | ValidationSchema;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value: any;
}

export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  fallback?: T | undefined;
}

class DataValidator {
  private rules = new Map<string, ValidationRule[]>();
  
  // Built-in validation rules
  static readonly BUILT_IN_RULES = {
    required: {
      name: 'required',
      validate: (value: any) => value !== null && value !== undefined && value !== '',
      message: 'This field is required',
      required: true,
    },
    
    string: {
      name: 'string',
      validate: (value: any) => typeof value === 'string',
      message: 'Must be a string',
    },
    
    number: {
      name: 'number',
      validate: (value: any) => typeof value === 'number' && !isNaN(value),
      message: 'Must be a valid number',
    },
    
    integer: {
      name: 'integer',
      validate: (value: any) => Number.isInteger(value),
      message: 'Must be an integer',
    },
    
    positive: {
      name: 'positive',
      validate: (value: any) => typeof value === 'number' && value > 0,
      message: 'Must be a positive number',
    },
    
    email: {
      name: 'email',
      validate: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: 'Must be a valid email address',
    },
    
    url: {
      name: 'url',
      validate: (value: string) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Must be a valid URL',
    },
    
    array: {
      name: 'array',
      validate: (value: any) => Array.isArray(value),
      message: 'Must be an array',
    },
    
    object: {
      name: 'object',
      validate: (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value),
      message: 'Must be an object',
    },
    
    date: {
      name: 'date',
      validate: (value: any) => {
        const date = new Date(value);
        return !isNaN(date.getTime());
      },
      message: 'Must be a valid date',
    },
    
    minLength: (min: number): ValidationRule => ({
      name: 'minLength',
      validate: (value: string | any[]) => !!(value && value.length >= min),
      message: `Must be at least ${min} characters/items`,
    }),
    
    maxLength: (max: number): ValidationRule => ({
      name: 'maxLength',
      validate: (value: string | any[]) => !value || value.length <= max,
      message: `Must be no more than ${max} characters/items`,
    }),
    
    min: (min: number): ValidationRule => ({
      name: 'min',
      validate: (value: number) => typeof value === 'number' && value >= min,
      message: `Must be at least ${min}`,
    }),
    
    max: (max: number): ValidationRule => ({
      name: 'max',
      validate: (value: number) => typeof value === 'number' && value <= max,
      message: `Must be no more than ${max}`,
    }),
    
    pattern: (regex: RegExp, message?: string): ValidationRule => ({
      name: 'pattern',
      validate: (value: string) => regex.test(value),
      message: message || 'Invalid format',
    }),
    
    oneOf: (allowedValues: any[], message?: string): ValidationRule => ({
      name: 'oneOf',
      validate: (value: any) => allowedValues.includes(value),
      message: message || `Must be one of: ${allowedValues.join(', ')}`,
    }),
  };
  
  validate<T extends Record<string, any>>(
    data: T,
    schema: ValidationSchema,
    options: { stopOnFirstError?: boolean; includeWarnings?: boolean } = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const validateField = (
      value: any,
      rules: ValidationRule[],
      fieldPath: string
    ): void => {
      for (const rule of rules) {
        try {
          const isValid = rule.validate(value);
          
          if (!isValid) {
            const error: ValidationError = {
              field: fieldPath,
              rule: rule.name,
              message: rule.message,
              value,
            };
            
            if (rule.required) {
              errors.push(error);
              if (options.stopOnFirstError) return;
            } else if (options.includeWarnings) {
              warnings.push(error);
            }
          }
        } catch (error) {
          console.warn(`Validation rule '${rule.name}' failed for field '${fieldPath}':`, error);
        }
      }
    };
    
    const validateObject = (obj: any, schema: ValidationSchema, prefix = ''): void => {
      for (const [key, rules] of Object.entries(schema)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        const value = obj?.[key];
        
        if (Array.isArray(rules)) {
          validateField(value, rules, fieldPath);
        } else if (typeof rules === 'object') {
          // Nested schema
          if (value && typeof value === 'object') {
            validateObject(value, rules, fieldPath);
          }
        }
        
        if (options.stopOnFirstError && errors.length > 0) {
          break;
        }
      }
    };
    
    validateObject(data, schema);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  safeParseJSON<T>(json: string, fallback?: T): SafeParseResult<T> {
    try {
      const data = JSON.parse(json);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        fallback,
      };
    }
  }
  
  safeGetProperty<T>(
    obj: any,
    path: string,
    fallback?: T
  ): SafeParseResult<T> {
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current === null || current === undefined) {
          throw new Error(`Property '${key}' does not exist`);
        }
        current = current[key];
      }
      
      return {
        success: true,
        data: current,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        fallback,
      };
    }
  }
  
  sanitizeInput(value: any, type: 'string' | 'number' | 'boolean' | 'array' | 'object'): any {
    switch (type) {
      case 'string':
        if (typeof value === 'string') return value.trim();
        return String(value || '').trim();
        
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
        
      case 'boolean':
        if (typeof value === 'boolean') return value;
        return value === 'true' || value === '1' || value === 1;
        
      case 'array':
        return Array.isArray(value) ? value : [];
        
      case 'object':
        return typeof value === 'object' && value !== null ? value : {};
        
      default:
        return value;
    }
  }
  
  deepClone<T>(obj: T): T {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.warn('Failed to deep clone object:', error);
      return obj;
    }
  }
  
  isEmptyValue(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
  
  getValueOrFallback<T>(value: any, fallback: T, validator?: (val: any) => boolean): T {
    if (validator) {
      return validator(value) ? value : fallback;
    }
    return this.isEmptyValue(value) ? fallback : value;
  }
}

// Global validator instance
export const dataValidator = new DataValidator();

// React hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  schema: ValidationSchema
) {
  const { reportError } = useErrorHandler();
  
  const validateForm = (data: T): ValidationResult => {
    try {
      return dataValidator.validate(data, schema, { includeWarnings: true });
    } catch (error) {
      reportError(error as Error, 'useFormValidation.validateForm');
      return {
        isValid: false,
        errors: [{
          field: 'form',
          rule: 'validation',
          message: 'Validation failed due to an error',
          value: data,
        }],
        warnings: [],
      };
    }
  };
  
  const sanitizeFormData = (data: T): T => {
    try {
      const sanitized = { ...data };
      
      for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string') {
          (sanitized as any)[key] = value.trim();
        }
      }
      
      return sanitized;
    } catch (error) {
      reportError(error as Error, 'useFormValidation.sanitizeFormData');
      return data;
    }
  };
  
  return {
    validate: validateForm,
    sanitize: sanitizeFormData,
    rules: DataValidator.BUILT_IN_RULES,
  };
}

// Hook for safe data operations
export function useSafeData() {
  const { reportError } = useErrorHandler();
  
  const safeParseJSON = <T,>(json: string, fallback?: T): SafeParseResult<T> => {
    try {
      return dataValidator.safeParseJSON(json, fallback);
    } catch (error) {
      reportError(error as Error, 'useSafeData.safeParseJSON');
      return {
        success: false,
        error: error as Error,
        fallback,
      };
    }
  };
  
  const safeGetProperty = <T,>(obj: any, path: string, fallback?: T): SafeParseResult<T> => {
    try {
      return dataValidator.safeGetProperty(obj, path, fallback);
    } catch (error) {
      reportError(error as Error, 'useSafeData.safeGetProperty');
      return {
        success: false,
        error: error as Error,
        fallback,
      };
    }
  };
  
  const sanitizeInput = (value: any, type: 'string' | 'number' | 'boolean' | 'array' | 'object') => {
    try {
      return dataValidator.sanitizeInput(value, type);
    } catch (error) {
      reportError(error as Error, 'useSafeData.sanitizeInput');
      return value;
    }
  };
  
  const getValueOrFallback = <T,>(value: any, fallback: T, validator?: (val: any) => boolean): T => {
    try {
      return dataValidator.getValueOrFallback(value, fallback, validator);
    } catch (error) {
      reportError(error as Error, 'useSafeData.getValueOrFallback');
      return fallback;
    }
  };
  
  return {
    safeParseJSON,
    safeGetProperty,
    sanitizeInput,
    getValueOrFallback,
    deepClone: dataValidator.deepClone,
    isEmptyValue: dataValidator.isEmptyValue,
  };
}

// Utility functions
export const createSchema = (schema: ValidationSchema): ValidationSchema => schema;

export const createRule = (rule: ValidationRule): ValidationRule => rule;

export const combineSchemas = (...schemas: ValidationSchema[]): ValidationSchema => {
  return schemas.reduce((combined, schema) => ({ ...combined, ...schema }), {});
};

export { DataValidator };

export default dataValidator; 