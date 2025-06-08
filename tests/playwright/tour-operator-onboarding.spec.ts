import { test, expect } from '@playwright/test'

test.describe('Tour Operator Onboarding Journey', () => {
  test('completes full tour operator onboarding and white label setup', async ({ page }) => {
    // Step 1: Navigate to landing page and select tour operator option
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Travel planning made simple')
    
    // Click on "For Tour Operators" or similar button
    await page.getByRole('button', { name: /tour operator|for businesses|white label/i }).click()
    
    // Should redirect to onboarding welcome
    await expect(page).toHaveURL(/.*\/onboarding/)
    await expect(page.getByText('Welcome to TripNav White Label')).toBeVisible()
    
    // Step 2: Company Profile Setup
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Fill company information
    await page.getByLabel('Company Name').fill('Adventure Tours International')
    await page.getByLabel('Business Email').fill('admin@adventuretours.com')
    await page.getByLabel('Phone Number').fill('+1 (555) 123-4567')
    await page.getByLabel('Website').fill('www.adventuretours.com')
    
    // Select business type
    await page.getByLabel('Business Type').selectOption('tour-operator')
    
    // Select number of employees
    await page.getByLabel('Company Size').selectOption('11-50')
    
    // Add company description
    await page.getByLabel('Company Description').fill('We specialize in adventure tours across South America, offering unique experiences in Peru, Brazil, and Argentina.')
    
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 3: Branding Customization
    await expect(page.getByText('Customize Your Brand')).toBeVisible()
    
    // Upload logo
    await page.getByLabel('Company Logo').setInputFiles('public/placeholder-logo.png')
    
    // Set brand colors
    await page.getByLabel('Primary Color').fill('#2C5F2D')
    await page.getByLabel('Secondary Color').fill('#97BC62')
    await page.getByLabel('Accent Color').fill('#FFB627')
    
    // Set typography preferences
    await page.getByLabel('Heading Font').selectOption('montserrat')
    await page.getByLabel('Body Font').selectOption('open-sans')
    
    // Preview branding
    await page.getByRole('button', { name: 'Preview Brand' }).click()
    await expect(page.getByTestId('brand-preview')).toBeVisible()
    await page.getByRole('button', { name: 'Close Preview' }).click()
    
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 4: Content Import
    await expect(page.getByText('Import Your Content')).toBeVisible()
    
    // Choose import method
    await page.getByRole('radio', { name: 'Upload CSV' }).click()
    
    // Upload tour catalog
    const csvContent = `Tour Name,Destination,Duration,Price,Description
Machu Picchu Explorer,Peru,7 days,2500,Discover the ancient Inca citadel
Amazon Rainforest Adventure,Brazil,5 days,1800,Explore the world's largest rainforest
Patagonia Trek,Argentina,10 days,3500,Hike through stunning landscapes`
    
    const csvFile = new File([csvContent], 'tours.csv', { type: 'text/csv' })
    await page.getByLabel('Upload Tour Catalog').setInputFiles({
      name: 'tours.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    })
    
    // Map CSV columns
    await page.getByLabel('Tour Name Column').selectOption('Tour Name')
    await page.getByLabel('Destination Column').selectOption('Destination')
    await page.getByLabel('Duration Column').selectOption('Duration')
    await page.getByLabel('Price Column').selectOption('Price')
    
    // Preview import
    await page.getByRole('button', { name: 'Preview Import' }).click()
    await expect(page.getByText('3 tours will be imported')).toBeVisible()
    
    await page.getByRole('button', { name: 'Import Tours' }).click()
    await expect(page.getByText('Import successful!')).toBeVisible()
    
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 5: CRM Integrations
    await expect(page.getByText('Connect Your Tools')).toBeVisible()
    
    // Select CRM
    await page.getByRole('button', { name: 'HubSpot' }).click()
    
    // Enter API credentials
    await page.getByLabel('API Key').fill('test-hubspot-api-key-12345')
    await page.getByRole('button', { name: 'Test Connection' }).click()
    await expect(page.getByText('Connection successful!')).toBeVisible()
    
    // Configure sync settings
    await page.getByLabel('Sync Frequency').selectOption('hourly')
    await page.getByRole('checkbox', { name: 'Sync Contacts' }).check()
    await page.getByRole('checkbox', { name: 'Sync Bookings' }).check()
    await page.getByRole('checkbox', { name: 'Sync Inquiries' }).check()
    
    await page.getByRole('button', { name: 'Save Integration' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 6: Pricing Configuration
    await expect(page.getByText('Set Your Pricing')).toBeVisible()
    
    // Set pricing rules
    await page.getByLabel('Base Markup (%)').fill('20')
    await page.getByLabel('Peak Season Markup (%)').fill('35')
    
    // Configure payment options
    await page.getByRole('checkbox', { name: 'Credit Card' }).check()
    await page.getByRole('checkbox', { name: 'Bank Transfer' }).check()
    await page.getByRole('checkbox', { name: 'PayPal' }).check()
    
    // Set cancellation policy
    await page.getByLabel('Cancellation Policy').selectOption('flexible')
    await page.getByLabel('Refund Window (days)').fill('14')
    
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 7: Review and Launch
    await expect(page.getByText('Review Your Setup')).toBeVisible()
    
    // Verify all sections completed
    await expect(page.getByTestId('company-profile-check')).toHaveClass(/completed/)
    await expect(page.getByTestId('branding-check')).toHaveClass(/completed/)
    await expect(page.getByTestId('content-check')).toHaveClass(/completed/)
    await expect(page.getByTestId('integrations-check')).toHaveClass(/completed/)
    await expect(page.getByTestId('pricing-check')).toHaveClass(/completed/)
    
    // Choose subdomain
    await page.getByLabel('Choose Your Subdomain').fill('adventuretours')
    await page.getByRole('button', { name: 'Check Availability' }).click()
    await expect(page.getByText('adventuretours.tripnav.io is available!')).toBeVisible()
    
    // Accept terms
    await page.getByRole('checkbox', { name: 'I agree to the terms of service' }).check()
    await page.getByRole('checkbox', { name: 'I agree to the privacy policy' }).check()
    
    // Launch white label site
    await page.getByRole('button', { name: 'Launch My Site' }).click()
    
    // Step 8: Verify white label admin dashboard
    await expect(page).toHaveURL(/.*\/admin/)
    await expect(page.getByText('Welcome to Your White Label Dashboard')).toBeVisible()
    await expect(page.getByText('Adventure Tours International')).toBeVisible()
    
    // Check dashboard sections
    await expect(page.getByRole('link', { name: 'Bookings' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tours' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Customers' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
    
    // Step 9: Test white label customization features
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('tab', { name: 'Appearance' }).click()
    
    // Update theme
    await page.getByLabel('Theme Mode').selectOption('dark')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Theme updated successfully')).toBeVisible()
    
    // Test tour management
    await page.getByRole('link', { name: 'Tours' }).click()
    await expect(page.getByText('Machu Picchu Explorer')).toBeVisible()
    await expect(page.getByText('Amazon Rainforest Adventure')).toBeVisible()
    await expect(page.getByText('Patagonia Trek')).toBeVisible()
    
    // Add new tour
    await page.getByRole('button', { name: 'Add New Tour' }).click()
    await page.getByLabel('Tour Name').fill('Galapagos Island Cruise')
    await page.getByLabel('Destination').fill('Ecuador')
    await page.getByLabel('Duration').fill('8 days')
    await page.getByLabel('Base Price').fill('4200')
    await page.getByLabel('Description').fill('Experience unique wildlife on the enchanted islands')
    await page.getByRole('button', { name: 'Save Tour' }).click()
    await expect(page.getByText('Tour added successfully')).toBeVisible()
    
    // Step 10: Preview customer-facing site
    await page.getByRole('button', { name: 'Preview Site' }).click()
    
    // New tab opens with white label site
    const customerPage = await page.waitForEvent('popup')
    await expect(customerPage).toHaveURL(/adventuretours\.tripnav\.io/)
    
    // Verify branding
    await expect(customerPage.locator('body')).toHaveCSS('--primary-color', 'rgb(44, 95, 45)')
    await expect(customerPage.getByAltText(/Adventure Tours/)).toBeVisible()
    
    // Verify tours are displayed
    await expect(customerPage.getByText('Our Tours')).toBeVisible()
    await expect(customerPage.getByText('Machu Picchu Explorer')).toBeVisible()
    await expect(customerPage.getByText('$2,500')).toBeVisible()
    
    await customerPage.close()
  })

  test('handles onboarding errors gracefully', async ({ page }) => {
    await page.goto('/onboarding')
    
    // Try to proceed without filling required fields
    await page.getByRole('button', { name: 'Get Started' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Should show validation errors
    await expect(page.getByText('Company name is required')).toBeVisible()
    await expect(page.getByText('Business email is required')).toBeVisible()
    
    // Test duplicate subdomain
    await page.getByLabel('Company Name').fill('Test Company')
    await page.getByLabel('Business Email').fill('test@example.com')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Skip to subdomain selection
    await page.goto('/onboarding/review')
    await page.getByLabel('Choose Your Subdomain').fill('demo') // Assuming 'demo' is taken
    await page.getByRole('button', { name: 'Check Availability' }).click()
    await expect(page.getByText('This subdomain is already taken')).toBeVisible()
  })

  test('saves progress and allows resuming onboarding', async ({ page }) => {
    await page.goto('/onboarding')
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Fill partial information
    await page.getByLabel('Company Name').fill('Partial Tours Co')
    await page.getByLabel('Business Email').fill('partial@example.com')
    
    // Save and exit
    await page.getByRole('button', { name: 'Save & Exit' }).click()
    await expect(page.getByText('Progress saved')).toBeVisible()
    
    // Return to onboarding
    await page.goto('/onboarding')
    await expect(page.getByText('Welcome back! Continue where you left off')).toBeVisible()
    await page.getByRole('button', { name: 'Continue Setup' }).click()
    
    // Verify data was saved
    await expect(page.getByLabel('Company Name')).toHaveValue('Partial Tours Co')
    await expect(page.getByLabel('Business Email')).toHaveValue('partial@example.com')
  })

  test('white label admin features work correctly', async ({ page }) => {
    // Assume already onboarded, go directly to admin
    await page.goto('/admin')
    
    // Login as white label admin
    await page.getByLabel('Email').fill('admin@adventuretours.com')
    await page.getByLabel('Password').fill('testpassword123')
    await page.getByRole('button', { name: 'Login' }).click()
    
    // Test theme customization
    await page.getByRole('link', { name: 'Theme Editor' }).click()
    await page.getByLabel('Hero Title').fill('Discover Amazing Adventures')
    await page.getByLabel('Hero Subtitle').fill('Your journey begins here')
    await page.getByRole('button', { name: 'Save Theme' }).click()
    
    // Test analytics access
    await page.getByRole('link', { name: 'Analytics' }).click()
    await expect(page.getByText('Tour Performance')).toBeVisible()
    await expect(page.getByText('Booking Trends')).toBeVisible()
    await expect(page.getByText('Customer Insights')).toBeVisible()
    
    // Test customer management
    await page.getByRole('link', { name: 'Customers' }).click()
    await page.getByRole('button', { name: 'Export Customers' }).click()
    await expect(page.getByText('Export started')).toBeVisible()
  })
})