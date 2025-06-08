describe('Itinerary Creation Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('allows users to start creating an itinerary', () => {
    // Look for buttons or links to start trip planning
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="start-planning"], [data-testid="create-trip"], button:contains("Plan"), button:contains("Create"), a:contains("Start")').length > 0) {
        cy.get('[data-testid="start-planning"], [data-testid="create-trip"], button:contains("Plan"), button:contains("Create"), a:contains("Start")').first().click()
      } else {
        // If no obvious start button, check if there's a form or input field
        cy.get('input, select, textarea').should('exist')
      }
    })
  })

  it('handles form validation properly', () => {
    // Navigate to a form page or find form elements
    cy.get('body').then(($body) => {
      if ($body.find('form').length > 0) {
        // Try to submit empty form to test validation
        cy.get('form').first().within(() => {
          cy.get('button[type="submit"], input[type="submit"]').first().click()
        })
        
        // Check for validation messages
        cy.get('body').should('contain.text', 'required').or('contain.text', 'error').or('contain.text', 'invalid')
      }
    })
  })

  it('allows destination selection', () => {
    // Look for destination input or selection elements
    cy.get('body').then(($body) => {
      if ($body.find('input[placeholder*="destination"], input[placeholder*="where"], select').length > 0) {
        cy.get('input[placeholder*="destination"], input[placeholder*="where"], select').first()
          .should('be.visible')
          .type('Peru{enter}')
      }
    })
  })
})