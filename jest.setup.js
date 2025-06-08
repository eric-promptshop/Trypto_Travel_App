import '@testing-library/jest-dom'

// Add polyfills for Node.js environment
global.TextEncoder = global.TextEncoder || require('util').TextEncoder
global.TextDecoder = global.TextDecoder || require('util').TextDecoder

// Add Request/Response polyfills for Next.js API testing
if (typeof global.Request === 'undefined') {
  // Use a simple mock implementation for tests
  global.Request = class Request {
    constructor(url, options) {
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true,
        configurable: true
      })
      this.method = options?.method || 'GET'
      this.headers = new Map(Object.entries(options?.headers || {}))
      this.body = options?.body
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
  }
  
  global.Response = class Response {
    constructor(body, options) {
      this.body = body
      this.status = options?.status || 200
      this.statusText = options?.statusText || 'OK'
      this.headers = new Map(Object.entries(options?.headers || {}))
      this.ok = this.status >= 200 && this.status < 300
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
  }
}

// Mock fetch for tests
global.fetch = global.fetch || jest.fn()

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class NextRequest extends global.Request {
    constructor(url, options) {
      super(url, options)
      this.nextUrl = new URL(url)
    }
  },
  NextResponse: {
    json: (data, init) => {
      const response = new global.Response(JSON.stringify(data), {
        ...init,
        headers: {
          ...init?.headers,
          'content-type': 'application/json',
        }
      })
      response.json = async () => data
      return response
    },
    redirect: (url) => {
      return new global.Response(null, {
        status: 307,
        headers: {
          Location: url.toString()
        }
      })
    }
  }
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    query: {},
    pathname: '/',
    asPath: '/',
  }),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
})) 