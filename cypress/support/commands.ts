// Custom Cypress commands
// Example:
// Cypress.Commands.add('login', (email, password) => { ... })

declare global {
  namespace Cypress {
    interface Chainable {
      // Define custom command types here
    }
  }
}

export {} // Make this file a module