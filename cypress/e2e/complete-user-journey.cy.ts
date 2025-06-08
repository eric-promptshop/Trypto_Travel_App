describe('Complete User Journey - Trip Creation to Booking', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('completes full trip planning journey', () => {
    // Step 1: Landing Page
    cy.get('h1').should('contain', 'Travel planning made simple')
    cy.get('button').contains('Get Started').click()

    // Step 2: Fill Trip Form
    cy.url().should('include', '/plan')
    
    // Select destinations
    cy.get('[data-testid="destination-selector"]').click()
    cy.get('[data-testid="destination-option"]').contains('Peru').click()
    cy.get('[data-testid="destination-option"]').contains('Brazil').click()
    cy.get('body').click(0, 0) // Close dropdown

    // Set travel dates
    cy.get('[data-testid="date-range-picker"]').click()
    cy.get('[data-testid="start-date"]').type('2024-06-15')
    cy.get('[data-testid="end-date"]').type('2024-06-22')
    
    // Set travelers
    cy.get('[data-testid="adults-increment"]').click()
    cy.get('[data-testid="adults-increment"]').click()
    cy.get('[data-testid="travelers-count"]').should('contain', '2 adults')
    
    // Set budget
    cy.get('[data-testid="budget-slider"]').within(() => {
      cy.get('input[type="range"]').first().invoke('val', 2000).trigger('change')
      cy.get('input[type="range"]').last().invoke('val', 3000).trigger('change')
    })
    
    // Select interests
    cy.get('[data-testid="interest-tag"]').contains('Adventure').click()
    cy.get('[data-testid="interest-tag"]').contains('Culture').click()
    cy.get('[data-testid="interest-tag"]').contains('Food').click()
    
    // Add special requirements
    cy.get('[data-testid="special-requirements"]').type('Vegetarian meals preferred. Need wheelchair accessible accommodations.')
    
    // Submit form
    cy.get('button').contains('Create Itinerary').click()

    // Step 3: View Generated Itinerary
    cy.url().should('include', '/itinerary')
    cy.get('[data-testid="itinerary-title"]').should('contain', 'Peru')
    cy.get('[data-testid="trip-duration"]').should('contain', '7 days')
    cy.get('[data-testid="traveler-count"]').should('contain', '2 travelers')
    
    // Check daily activities
    cy.get('[data-testid="day-1"]').click()
    cy.get('[data-testid="activity-card"]').should('have.length.greaterThan', 0)
    
    // Step 4: Customize Itinerary
    cy.get('button').contains('Edit Trip').click()
    
    // Add an activity
    cy.get('[data-testid="add-activity"]').click()
    cy.get('[data-testid="activity-search"]').type('Machu Picchu')
    cy.get('[data-testid="activity-result"]').first().click()
    cy.get('button').contains('Add to Day 2').click()
    
    // Remove an activity
    cy.get('[data-testid="day-3"]').click()
    cy.get('[data-testid="activity-card"]').first().within(() => {
      cy.get('[data-testid="remove-activity"]').click()
    })
    cy.get('button').contains('Confirm').click()
    
    // Save changes
    cy.get('button').contains('Save Changes').click()

    // Step 5: Review Final Itinerary
    cy.get('[data-testid="budget-progress"]').should('be.visible')
    cy.get('[data-testid="total-cost"]').should('contain', '$')
    
    // Step 6: Share/Export
    cy.get('button').contains('Share').click()
    cy.get('[data-testid="share-link"]').should('be.visible')
    cy.get('button').contains('Copy Link').click()
    
    // Download PDF
    cy.get('button').contains('Download PDF').click()
    cy.readFile('cypress/downloads/Peru-Adventure-Itinerary.pdf').should('exist')
  })

  it('handles form validation correctly', () => {
    cy.get('button').contains('Get Started').click()
    
    // Try to submit without filling required fields
    cy.get('button').contains('Create Itinerary').click()
    
    // Should show validation errors
    cy.get('[data-testid="error-message"]').should('contain', 'Please select at least one destination')
    
    // Fill minimum required fields
    cy.get('[data-testid="destination-selector"]').click()
    cy.get('[data-testid="destination-option"]').contains('Peru').click()
    cy.get('body').click(0, 0)
    
    cy.get('[data-testid="date-range-picker"]').click()
    cy.get('[data-testid="start-date"]').type('2024-06-15')
    cy.get('[data-testid="end-date"]').type('2024-06-22')
    
    // Should now be able to submit
    cy.get('button').contains('Create Itinerary').click()
    cy.url().should('include', '/itinerary')
  })

  it('saves and resumes trip planning', () => {
    cy.get('button').contains('Get Started').click()
    
    // Fill partial form
    cy.get('[data-testid="destination-selector"]').click()
    cy.get('[data-testid="destination-option"]').contains('Japan').click()
    cy.get('body').click(0, 0)
    
    // Save draft
    cy.get('button').contains('Save Draft').click()
    cy.get('[data-testid="success-message"]').should('contain', 'Draft saved')
    
    // Navigate away and come back
    cy.visit('/')
    cy.get('button').contains('Continue Planning').should('be.visible')
    cy.get('button').contains('Continue Planning').click()
    
    // Should restore form state
    cy.get('[data-testid="selected-destinations"]').should('contain', 'Japan')
  })

  it('handles mobile responsiveness', () => {
    // Set mobile viewport
    cy.viewport('iphone-x')
    
    cy.get('h1').should('be.visible')
    cy.get('button').contains('Get Started').click()
    
    // Mobile-specific UI elements
    cy.get('[data-testid="mobile-menu"]').should('be.visible')
    cy.get('[data-testid="bottom-navigation"]').should('be.visible')
    
    // Form should be mobile-optimized
    cy.get('[data-testid="destination-selector"]').should('have.css', 'width').and('match', /100%|full/)
  })
})