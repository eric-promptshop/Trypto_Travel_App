import { NextRequest } from 'next/server'
import { POST } from '@/app/api/generate-itinerary/route'

describe('/api/generate-itinerary', () => {
  it('requires valid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-itinerary', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('validates required fields', async () => {
    const invalidData = {
      destination: '',
      duration: 0
    }
    
    const request = new NextRequest('http://localhost:3000/api/generate-itinerary', {
      method: 'POST',
      body: JSON.stringify(invalidData),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  it('generates itinerary with valid data', async () => {
    const validData = {
      destination: 'Peru',
      duration: 7,
      travelers: 2,
      budget: 3000,
      interests: ['culture', 'nature']
    }
    
    const request = new NextRequest('http://localhost:3000/api/generate-itinerary', {
      method: 'POST',
      body: JSON.stringify(validData),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const response = await POST(request)
    expect([200, 201]).toContain(response.status)
    
    const data = await response.json()
    expect(data).toHaveProperty('itinerary')
  })
})