import { test, expect } from '@playwright/test'

test.describe('Multi-tenant Functionality', () => {
  test('loads correct theme for tenant domain', async ({ page }) => {
    // Test default tenant
    await page.goto('http://localhost:3000')
    await expect(page.locator('body')).toHaveCSS('--primary', 'rgb(59, 130, 246)') // Default blue
    
    // Test custom tenant (assuming demo.localhost:3000 is configured)
    await page.goto('http://demo.localhost:3000')
    await expect(page.locator('body')).toHaveCSS('--primary', 'rgb(34, 197, 94)') // Custom green
  })

  test('displays correct branding for tenant', async ({ page }) => {
    // Default tenant
    await page.goto('http://localhost:3000')
    await expect(page.getByTestId('logo')).toHaveAttribute('alt', 'TripNav')
    await expect(page.locator('h1')).toContainText('Travel planning made simple')
    
    // Custom tenant
    await page.goto('http://demo.localhost:3000')
    await expect(page.getByTestId('logo')).toHaveAttribute('alt', 'Demo Travel Co')
    await expect(page.locator('h1')).toContainText('Your journey starts here')
  })

  test('tenant data isolation', async ({ page }) => {
    // Create trip on default tenant
    await page.goto('http://localhost:3000/trips')
    await page.getByRole('button', { name: 'Create New Trip' }).click()
    await page.getByTestId('trip-name').fill('Default Tenant Trip')
    await page.getByRole('button', { name: 'Save' }).click()
    
    // Switch to demo tenant
    await page.goto('http://demo.localhost:3000/trips')
    
    // Should not see the trip from default tenant
    await expect(page.getByText('Default Tenant Trip')).not.toBeVisible()
    
    // Create trip on demo tenant
    await page.getByRole('button', { name: 'Create New Trip' }).click()
    await page.getByTestId('trip-name').fill('Demo Tenant Trip')
    await page.getByRole('button', { name: 'Save' }).click()
    
    // Go back to default tenant
    await page.goto('http://localhost:3000/trips')
    
    // Should not see demo tenant trip
    await expect(page.getByText('Demo Tenant Trip')).not.toBeVisible()
    // Should still see default tenant trip
    await expect(page.getByText('Default Tenant Trip')).toBeVisible()
  })

  test('tenant-specific features', async ({ page }) => {
    // Default tenant - standard features
    await page.goto('http://localhost:3000')
    await expect(page.getByRole('link', { name: 'Plan Trip' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Analytics' })).not.toBeVisible() // Premium feature
    
    // Premium tenant with analytics
    await page.goto('http://premium.localhost:3000')
    await expect(page.getByRole('link', { name: 'Plan Trip' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'White Label Admin' })).toBeVisible()
  })

  test('custom domain routing', async ({ page }) => {
    // Test custom domain (requires DNS/hosts file setup)
    // This would be configured in production
    const customDomains = [
      { domain: 'travel-co.example.com', tenant: 'travel-co' },
      { domain: 'adventure-tours.example.com', tenant: 'adventure-tours' }
    ]
    
    for (const { domain, tenant } of customDomains) {
      // In real tests, you'd navigate to the actual domain
      // For local testing, we simulate with subdomain
      await page.goto(`http://${tenant}.localhost:3000`)
      
      // Verify tenant-specific content loads
      const tenantMeta = await page.locator('meta[name="tenant-id"]').getAttribute('content')
      expect(tenantMeta).toBe(tenant)
    }
  })

  test('admin panel tenant management', async ({ page }) => {
    // Login as super admin
    await page.goto('http://localhost:3000/admin')
    await page.getByTestId('email').fill('admin@tripnav.com')
    await page.getByTestId('password').fill('admin123')
    await page.getByRole('button', { name: 'Login' }).click()
    
    // Navigate to client management
    await page.getByRole('link', { name: 'Client Management' }).click()
    
    // Create new tenant
    await page.getByRole('button', { name: 'Add New Client' }).click()
    await page.getByTestId('company-name').fill('Test Travel Agency')
    await page.getByTestId('subdomain').fill('test-agency')
    await page.getByTestId('admin-email').fill('admin@test-agency.com')
    await page.getByRole('button', { name: 'Create Client' }).click()
    
    // Verify tenant created
    await expect(page.getByText('Client created successfully')).toBeVisible()
    await expect(page.getByText('Test Travel Agency')).toBeVisible()
    
    // Test theme customization
    await page.getByRole('button', { name: 'Customize Theme' }).click()
    await page.getByTestId('primary-color').fill('#FF6B6B')
    await page.getByTestId('logo-upload').setInputFiles('public/placeholder-logo.png')
    await page.getByRole('button', { name: 'Save Theme' }).click()
    
    // Preview tenant site
    await page.getByRole('button', { name: 'Preview Site' }).click()
    const newTab = await page.waitForEvent('popup')
    await expect(newTab).toHaveURL(/test-agency\.localhost/)
    await expect(newTab.locator('body')).toHaveCSS('--primary', 'rgb(255, 107, 107)')
  })

  test('consolidated components work across tenants', async ({ page }) => {
    const tenants = ['localhost:3000', 'demo.localhost:3000', 'premium.localhost:3000']
    
    for (const tenant of tenants) {
      await page.goto(`http://${tenant}`)
      
      // Test logo component
      await expect(page.getByTestId('logo')).toBeVisible()
      
      // Test form component
      await page.getByRole('button', { name: 'Get Started' }).click()
      await expect(page.getByTestId('destination-selector')).toBeVisible()
      await expect(page.getByTestId('date-range-picker')).toBeVisible()
      
      // Test itinerary viewer (using the new ModernItineraryViewer)
      await page.goto(`http://${tenant}/itinerary-display`)
      await expect(page.getByText('Peru Adventure')).toBeVisible()
      await expect(page.getByTestId('day-1')).toBeVisible()
      
      // Go back to home
      await page.goto(`http://${tenant}`)
    }
  })

  test('tenant API isolation', async ({ request }) => {
    // Create trip via API for default tenant
    const defaultResponse = await request.post('http://localhost:3000/api/v1/trips', {
      headers: { 'X-Tenant-ID': 'default' },
      data: {
        name: 'API Test Trip - Default',
        destination: 'Peru',
        startDate: '2024-06-15',
        endDate: '2024-06-22'
      }
    })
    expect(defaultResponse.ok()).toBeTruthy()
    const defaultTrip = await defaultResponse.json()
    
    // Try to access from different tenant
    const demoResponse = await request.get(`http://demo.localhost:3000/api/v1/trips/${defaultTrip.id}`, {
      headers: { 'X-Tenant-ID': 'demo' }
    })
    expect(demoResponse.status()).toBe(404) // Should not find trip from other tenant
    
    // Create trip for demo tenant
    const demoCreateResponse = await request.post('http://demo.localhost:3000/api/v1/trips', {
      headers: { 'X-Tenant-ID': 'demo' },
      data: {
        name: 'API Test Trip - Demo',
        destination: 'Japan',
        startDate: '2024-07-10',
        endDate: '2024-07-20'
      }
    })
    expect(demoCreateResponse.ok()).toBeTruthy()
    
    // List trips for each tenant
    const defaultList = await request.get('http://localhost:3000/api/v1/trips', {
      headers: { 'X-Tenant-ID': 'default' }
    })
    const defaultTrips = await defaultList.json()
    expect(defaultTrips.data.some(t => t.name === 'API Test Trip - Default')).toBeTruthy()
    expect(defaultTrips.data.some(t => t.name === 'API Test Trip - Demo')).toBeFalsy()
    
    const demoList = await request.get('http://demo.localhost:3000/api/v1/trips', {
      headers: { 'X-Tenant-ID': 'demo' }
    })
    const demoTrips = await demoList.json()
    expect(demoTrips.data.some(t => t.name === 'API Test Trip - Demo')).toBeTruthy()
    expect(demoTrips.data.some(t => t.name === 'API Test Trip - Default')).toBeFalsy()
  })
})