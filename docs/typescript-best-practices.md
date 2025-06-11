# TypeScript Best Practices for Travel Itinerary Builder

## Overview

This document outlines TypeScript best practices and patterns used in the Travel Itinerary Builder project. We use strict TypeScript configuration to catch errors early and maintain code quality.

## TypeScript Configuration

Our `tsconfig.json` includes strict settings for better type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Key Patterns and Solutions

### 1. Handling Optional Properties with `exactOptionalPropertyTypes`

With `exactOptionalPropertyTypes: true`, TypeScript distinguishes between:
- `property?: T` (property can be omitted)
- `property: T | undefined` (property must be present but can be undefined)

**✅ DO:**
```typescript
// Conditional property spreading
const props = {
  required: "value",
  ...(optional !== undefined && { optional })
};

// Props interface with proper optionals
interface Props {
  title: string;
  description?: string; // Can be omitted entirely
}
```

**❌ DON'T:**
```typescript
// This fails with exactOptionalPropertyTypes
const props = {
  required: "value",
  optional: maybeUndefined // Error if maybeUndefined is undefined
};
```

### 2. Null and Undefined Checks

Always check for null/undefined before accessing properties:

**✅ DO:**
```typescript
// Using optional chaining
const value = data?.property?.nested || defaultValue;

// Explicit null checks
if (!data) return null;
const { property } = data;

// Type guards
function isValidData(data: unknown): data is ValidData {
  return data !== null && typeof data === 'object' && 'required' in data;
}
```

**❌ DON'T:**
```typescript
// Accessing without checks
const value = data.property.nested; // Runtime error if data is null
```

### 3. Array Access with `noUncheckedIndexedAccess`

Array and object index access can return undefined:

**✅ DO:**
```typescript
// Check array element exists
const item = array[index];
if (!item) return null;

// Use optional chaining
const value = array[0]?.property;

// Destructure with defaults
const [first = defaultValue] = array;
```

**❌ DON'T:**
```typescript
// Direct access without checks
const value = array[0].property; // Error: Object is possibly 'undefined'
```

### 4. Type Guards and Narrowing

Create type guards for runtime type checking:

```typescript
// Type guard for non-empty arrays
function isNonEmptyArray<T>(arr: T[] | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

// Type guard for required properties
function hasRequiredProps<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  props: K[]
): obj is T & Required<Pick<T, K>> {
  return !!obj && props.every(prop => prop in obj && obj[prop] !== undefined);
}

// Usage
if (isNonEmptyArray(items)) {
  items.forEach(item => process(item)); // Safe to use
}
```

### 5. React Component Props

Handle optional props correctly in React components:

```typescript
interface ComponentProps {
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

function Component({ title, subtitle, onClick }: ComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {onClick && <button onClick={onClick}>Click</button>}
    </div>
  );
}
```

### 6. API Response Handling

Type API responses properly and handle edge cases:

```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    total?: number;
  };
}

async function fetchData(): Promise<ApiResponse<User[]>> {
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    return { data };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Usage with proper checks
const result = await fetchData();
if (result.error) {
  console.error(result.error);
  return;
}

if (!result.data) {
  console.warn('No data received');
  return;
}

// Now TypeScript knows result.data is defined
result.data.forEach(user => console.log(user));
```

### 7. Environment Variables

Type environment variables and provide defaults:

```typescript
// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      DATABASE_URL: string;
      NEXTAUTH_SECRET?: string;
    }
  }
}

// Usage with defaults
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const authSecret = process.env.NEXTAUTH_SECRET || 'development-secret';
```

### 8. Async Error Handling

Properly type and handle errors in async functions:

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiCall<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new ApiError(
        'API request failed',
        response.status,
        'API_ERROR'
      );
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle known API errors
      console.error(`API Error ${error.statusCode}: ${error.message}`);
      throw error;
    }
    
    // Handle unknown errors
    console.error('Unknown error:', error);
    throw new ApiError('Unknown error occurred', 500, 'UNKNOWN_ERROR');
  }
}
```

## Testing with TypeScript

Configure Jest and Testing Library with proper types:

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';

// types/jest-dom.d.ts
/// <reference types="@testing-library/jest-dom" />

// Test example with proper typing
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/atoms/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });
});
```

## IDE Configuration

Recommended VS Code settings for the project:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

## Common Pitfalls to Avoid

1. **Don't use `any`** - Use `unknown` and type guards instead
2. **Don't ignore TypeScript errors** - Fix them properly
3. **Don't overuse type assertions** - Let TypeScript infer when possible
4. **Don't create overly complex types** - Keep types simple and readable
5. **Don't forget to handle edge cases** - null, undefined, empty arrays

## Continuous Improvement

- Run `npx tsc --noEmit` before committing to catch type errors
- Keep TypeScript and @types packages up to date
- Review and refactor types as the codebase evolves
- Share new patterns and solutions with the team

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/) 