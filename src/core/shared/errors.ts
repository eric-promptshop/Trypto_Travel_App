/**
 * Base domain error class
 */
export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends DomainError {
  constructor(
    message: string, 
    public readonly field?: string,
    public readonly errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR');
  }
}

/**
 * Error when a resource is not found
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND');
  }
}

/**
 * Error for unauthorized access
 */
export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}

/**
 * Error for forbidden access
 */
export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN');
  }
}

/**
 * Error for business rule violations
 */
export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}

/**
 * Error for conflicts (e.g., duplicate resources)
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

/**
 * Error for external service failures
 */
export class ExternalServiceError extends DomainError {
  constructor(service: string, message: string) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR');
  }
}