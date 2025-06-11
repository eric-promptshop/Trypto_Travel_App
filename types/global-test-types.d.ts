/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Ensure Jest types take precedence
import '@testing-library/jest-dom';
import 'jest';

// Extend Jest matchers if needed for custom assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add any custom matchers here
    }
  }
}

// Ensure module declaration
export {};