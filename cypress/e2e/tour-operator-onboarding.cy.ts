describe('Tour Operator Onboarding E2E Journey', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('completes full tour operator onboarding flow', () => {
    // Step 1: Navigate from landing page
    cy.contains('h1', 'Travel planning made simple').should('be.visible')
    
    // Find and click tour operator CTA
    cy.get('button, a').contains(/tour operator|for businesses|white label/i).click()
    
    // Verify redirect to onboarding
    cy.url().should('include', '/onboarding')
    cy.contains('Welcome to TripNav White Label').should('be.visible')
    
    // Step 2: Company Profile
    cy.get('button').contains('Get Started').click()
    
    // Fill company details
    cy.get('input[name="companyName"]').type('Adventure Tours International')
    cy.get('input[name="businessEmail"]').type('admin@adventuretours.com')
    cy.get('input[name="phoneNumber"]').type('+1 (555) 123-4567')
    cy.get('input[name="website"]').type('www.adventuretours.com')
    
    // Select business type and size
    cy.get('select[name="businessType"]').select('tour-operator')
    cy.get('select[name="companySize"]').select('11-50')
    
    // Add description
    cy.get('textarea[name="companyDescription"]').type(
      'We specialize in adventure tours across South America, offering unique experiences in Peru, Brazil, and Argentina.'
    )
    
    cy.get('button').contains('Continue').click()
    
    // Step 3: Branding
    cy.contains('Customize Your Brand').should('be.visible')
    
    // Upload logo
    cy.get('input[type="file"][name="logo"]').selectFile('public/placeholder-logo.png')
    
    // Set colors
    cy.get('input[name="primaryColor"]').clear().type('#2C5F2D')
    cy.get('input[name="secondaryColor"]').clear().type('#97BC62')
    cy.get('input[name="accentColor"]').clear().type('#FFB627')
    
    // Typography
    cy.get('select[name="headingFont"]').select('montserrat')
    cy.get('select[name="bodyFont"]').select('open-sans')
    
    // Preview and continue
    cy.get('button').contains('Preview Brand').click()
    cy.get('[data-testid="brand-preview"]').should('be.visible')
    cy.get('button').contains('Close Preview').click()
    cy.get('button').contains('Continue').click()
    
    // Step 4: Content Import
    cy.contains('Import Your Content').should('be.visible')
    
    // Select CSV upload
    cy.get('input[type="radio"][value="csv"]').click()
    
    // Create and upload CSV
    const csvContent = `Tour Name,Destination,Duration,Price,Description
Machu Picchu Explorer,Peru,7 days,2500,Discover the ancient Inca citadel
Amazon Rainforest Adventure,Brazil,5 days,1800,Explore the world's largest rainforest
Patagonia Trek,Argentina,10 days,3500,Hike through stunning landscapes`
    
    cy.get('input[type="file"][name="tourCatalog"]').selectFile({
      contents: Cypress.Buffer.from(csvContent),
      fileName: 'tours.csv',
      mimeType: 'text/csv'
    })
    
    // Map columns
    cy.get('select[name="tourNameColumn"]').select('Tour Name')
    cy.get('select[name="destinationColumn"]').select('Destination')
    cy.get('select[name="durationColumn"]').select('Duration')
    cy.get('select[name="priceColumn"]').select('Price')
    
    // Import
    cy.get('button').contains('Preview Import').click()
    cy.contains('3 tours will be imported').should('be.visible')
    cy.get('button').contains('Import Tours').click()
    cy.contains('Import successful!').should('be.visible')
    cy.get('button').contains('Continue').click()
    
    // Step 5: CRM Integration
    cy.contains('Connect Your Tools').should('be.visible')
    
    // Select HubSpot
    cy.get('button').contains('HubSpot').click()
    
    // Configure integration
    cy.get('input[name="apiKey"]').type('test-hubspot-api-key-12345')
    cy.get('button').contains('Test Connection').click()
    cy.contains('Connection successful!').should('be.visible')
    
    // Sync settings
    cy.get('select[name="syncFrequency"]').select('hourly')
    cy.get('input[type="checkbox"][name="syncContacts"]').check()
    cy.get('input[type="checkbox"][name="syncBookings"]').check()
    cy.get('input[type="checkbox"][name="syncInquiries"]').check()
    
    cy.get('button').contains('Save Integration').click()
    cy.get('button').contains('Continue').click()
    
    // Step 6: Pricing
    cy.contains('Set Your Pricing').should('be.visible')
    
    // Pricing rules
    cy.get('input[name="baseMarkup"]').type('20')
    cy.get('input[name="peakSeasonMarkup"]').type('35')
    
    // Payment options
    cy.get('input[type="checkbox"][name="creditCard"]').check()
    cy.get('input[type="checkbox"][name="bankTransfer"]').check()
    cy.get('input[type="checkbox"][name="paypal"]').check()
    
    // Cancellation policy
    cy.get('select[name="cancellationPolicy"]').select('flexible')
    cy.get('input[name="refundWindow"]').type('14')
    
    cy.get('button').contains('Continue').click()
    
    // Step 7: Review & Launch
    cy.contains('Review Your Setup').should('be.visible')
    
    // Verify completion checkmarks
    cy.get('[data-testid="company-profile-check"]').should('have.class', 'completed')
    cy.get('[data-testid="branding-check"]').should('have.class', 'completed')
    cy.get('[data-testid="content-check"]').should('have.class', 'completed')
    cy.get('[data-testid="integrations-check"]').should('have.class', 'completed')
    cy.get('[data-testid="pricing-check"]').should('have.class', 'completed')
    
    // Choose subdomain
    cy.get('input[name="subdomain"]').type('adventuretours')
    cy.get('button').contains('Check Availability').click()
    cy.contains('adventuretours.tripnav.io is available!').should('be.visible')
    
    // Accept terms
    cy.get('input[type="checkbox"][name="termsOfService"]').check()
    cy.get('input[type="checkbox"][name="privacyPolicy"]').check()
    
    // Launch
    cy.get('button').contains('Launch My Site').click()
    
    // Verify redirect to admin dashboard
    cy.url().should('include', '/admin')
    cy.contains('Welcome to Your White Label Dashboard').should('be.visible')
    cy.contains('Adventure Tours International').should('be.visible')
  })

  it('allows editing white label settings after onboarding', () => {
    // Skip to admin (assuming already onboarded)
    cy.visit('/admin')
    // cy.loginAsWhiteLabelAdmin('admin@adventuretours.com', 'testpassword123')
    // TODO: Implement login flow or custom command
    
    // Navigate to theme editor
    cy.get('a').contains('Theme Editor').click()
    
    // Update hero section
    cy.get('input[name="heroTitle"]').clear().type('Discover Amazing Adventures')
    cy.get('input[name="heroSubtitle"]').clear().type('Your journey begins here')
    cy.get('textarea[name="heroDescription"]').clear().type(
      'Experience the world with our expertly crafted adventure tours'
    )
    
    // Update features section
    cy.get('button').contains('Features Section').click()
    cy.get('input[name="feature1Title"]').clear().type('Expert Guides')
    cy.get('input[name="feature1Description"]').clear().type('Local experts with years of experience')
    
    // Save changes
    cy.get('button').contains('Save Theme').click()
    cy.contains('Theme updated successfully').should('be.visible')
    
    // Preview changes
    cy.get('button').contains('Preview Site').click()
    
    // Verify in new window
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen')
    })
    cy.get('@windowOpen').should('be.calledWith', Cypress.sinon.match(/adventuretours\.tripnav\.io/))
  })

  it('handles onboarding validation and errors', () => {
    cy.get('button, a').contains(/tour operator|for businesses|white label/i).click()
    cy.get('button').contains('Get Started').click()
    
    // Try to continue without filling fields
    cy.get('button').contains('Continue').click()
    
    // Check validation messages
    cy.contains('Company name is required').should('be.visible')
    cy.contains('Business email is required').should('be.visible')
    cy.contains('Phone number is required').should('be.visible')
    
    // Test email validation
    cy.get('input[name="businessEmail"]').type('invalid-email')
    cy.get('button').contains('Continue').click()
    cy.contains('Please enter a valid email address').should('be.visible')
    
    // Test subdomain availability (skip to review step)
    cy.visit('/onboarding/review')
    cy.get('input[name="subdomain"]').type('demo') // Assuming 'demo' is taken
    cy.get('button').contains('Check Availability').click()
    cy.contains('This subdomain is already taken').should('be.visible')
    
    // Suggest alternatives
    cy.contains('Suggested alternatives:').should('be.visible')
    cy.get('[data-testid="subdomain-suggestion"]').should('have.length.at.least', 3)
  })

  it('manages tours in white label admin', () => {
    cy.visit('/admin')
    // cy.loginAsWhiteLabelAdmin('admin@adventuretours.com', 'testpassword123')
    // TODO: Implement login flow or custom command
    
    // Navigate to tours
    cy.get('a').contains('Tours').click()
    
    // Verify imported tours
    cy.contains('Machu Picchu Explorer').should('be.visible')
    cy.contains('Amazon Rainforest Adventure').should('be.visible')
    cy.contains('Patagonia Trek').should('be.visible')
    
    // Add new tour
    cy.get('button').contains('Add New Tour').click()
    
    // Fill tour details
    cy.get('input[name="tourName"]').type('Galapagos Island Cruise')
    cy.get('input[name="destination"]').type('Ecuador')
    cy.get('input[name="duration"]').type('8 days')
    cy.get('input[name="basePrice"]').type('4200')
    cy.get('textarea[name="description"]').type('Experience unique wildlife on the enchanted islands')
    
    // Add itinerary day
    cy.get('button').contains('Add Day').click()
    cy.get('input[name="day1Title"]').type('Arrival in Quito')
    cy.get('textarea[name="day1Description"]').type('Arrive in Quito and transfer to hotel')
    
    // Upload tour image
    cy.get('input[type="file"][name="tourImage"]').selectFile('public/placeholder.jpg')
    
    // Set availability
    cy.get('input[name="maxGroupSize"]').type('16')
    cy.get('input[type="checkbox"][name="yearRound"]').check()
    
    // Save tour
    cy.get('button').contains('Save Tour').click()
    cy.contains('Tour added successfully').should('be.visible')
    
    // Verify tour appears in list
    cy.contains('Galapagos Island Cruise').should('be.visible')
    cy.contains('$4,200').should('be.visible')
  })

  it('tracks analytics for white label site', () => {
    cy.visit('/admin')
    // cy.loginAsWhiteLabelAdmin('admin@adventuretours.com', 'testpassword123')
    // TODO: Implement login flow or custom command
    
    // Navigate to analytics
    cy.get('a').contains('Analytics').click()
    
    // Check dashboard sections
    cy.contains('Tour Performance').should('be.visible')
    cy.contains('Booking Trends').should('be.visible')
    cy.contains('Customer Insights').should('be.visible')
    cy.contains('Revenue Analytics').should('be.visible')
    
    // Interact with date range
    cy.get('select[name="dateRange"]').select('last30days')
    
    // Verify charts render
    cy.get('[data-testid="tour-performance-chart"]').should('be.visible')
    cy.get('[data-testid="booking-trends-chart"]').should('be.visible')
    
    // Check top tours
    cy.get('[data-testid="top-tours-table"]').within(() => {
      cy.contains('Tour Name').should('be.visible')
      cy.contains('Bookings').should('be.visible')
      cy.contains('Revenue').should('be.visible')
    })
    
    // Export report
    cy.get('button').contains('Export Report').click()
    cy.get('select[name="exportFormat"]').select('pdf')
    cy.get('button').contains('Download').click()
    
    // Verify download started
    cy.readFile('cypress/downloads/analytics-report.pdf').should('exist')
  })
})

// Custom command for white label admin login
// Cypress.Commands.add('loginAsWhiteLabelAdmin', (email: string, password: string) => {
//   cy.get('input[name="email"]').type(email)
//   cy.get('input[name="password"]').type(password)
//   cy.get('button').contains('Login').click()
//   cy.contains('Dashboard').should('be.visible')
// })

// Note: Custom commands should be defined in cypress/support/commands.ts
// and typed in cypress/support/index.d.ts