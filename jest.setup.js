import '@testing-library/jest-dom'

// Polyfill for Request and Response (needed for Next.js API route testing)
if (typeof globalThis.Request === 'undefined') {
  const { Request, Response } = require('undici');
  Object.assign(globalThis, { Request, Response });
}

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'; 