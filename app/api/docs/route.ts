import { NextResponse } from 'next/server';

const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'Trypto Travel API',
    version: '1.0.0',
    description: 'API documentation for the Trypto AI Trip Builder application',
    contact: {
      name: 'API Support',
      email: 'api@trypto.com'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Version 1 API'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      }
    },
    schemas: {
      Trip: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          location: { type: 'string', minLength: 2, maxLength: 100 },
          participants: { type: 'array', items: { type: 'string', format: 'uuid' } },
          status: { type: 'string', enum: ['draft', 'active', 'completed', 'cancelled'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          userId: { type: 'string', format: 'uuid' }
        },
        required: ['id', 'title', 'startDate', 'endDate', 'location', 'status', 'userId']
      },
      ApiResponse: {
        type: 'object',
        properties: {
          data: { type: 'object' },
          error: { type: 'string' },
          details: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              totalPages: { type: 'number' }
            }
          }
        }
      },
      CreateTripRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          location: { type: 'string', minLength: 2, maxLength: 100 },
          participants: { type: 'array', items: { type: 'string', format: 'uuid' } }
        },
        required: ['title', 'startDate', 'endDate', 'location']
      }
    }
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/trips': {
      get: {
        summary: 'List trips',
        description: 'Get a paginated list of trips for the authenticated user',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default: 1)',
            required: false,
            schema: { type: 'integer', minimum: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page (default: 10, max: 100)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by trip status',
            required: false,
            schema: { type: 'string', enum: ['draft', 'active', 'completed', 'cancelled'] }
          },
          {
            name: 'location',
            in: 'query',
            description: 'Filter by location (partial match)',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'List of trips',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Trip' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new trip',
        description: 'Create a new trip for the authenticated user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTripRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Trip created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Trip' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          },
          '422': {
            description: 'Validation error'
          }
        }
      }
    },
    '/auth/signin': {
      post: {
        summary: 'Sign in',
        description: 'Authenticate user and return JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Authentication successful'
          },
          '401': {
            description: 'Invalid credentials'
          }
        }
      }
    }
  }
};

export async function GET() {
  return NextResponse.json(apiDocumentation, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 