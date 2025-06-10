import { test, expect } from '@playwright/test';

test.describe('Traveler AI-Assisted Itinerary Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full AI-assisted itinerary creation flow', async ({ page }) => {
    // Start journey from landing page
    await expect(page.locator('h1')).toContainText(/AI-Powered Travel/);
    await page.getByRole('button', { name: /Start Planning|Get Started/i }).click();

    // AI Chat Interface
    await expect(page.locator('[data-testid="ai-chat-interface"]')).toBeVisible();
    
    // Initial AI conversation
    await page.getByPlaceholder(/Tell us about your dream trip/i).fill(
      'I want to plan a 7-day trip to Peru focusing on cultural experiences and adventure activities'
    );
    await page.getByRole('button', { name: /Send|Submit/i }).click();

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });

    // Fill in AI-suggested form fields
    await page.getByLabel(/Destination/i).fill('Peru');
    await page.getByRole('button', { name: /Add Peru/i }).click();
    
    // Select dates using AI suggestions
    await page.getByLabel(/Start Date/i).click();
    await page.getByRole('gridcell', { name: '15' }).first().click();
    await page.getByLabel(/End Date/i).click();
    await page.getByRole('gridcell', { name: '22' }).first().click();

    // Set travelers and budget
    await page.getByLabel(/Number of Travelers/i).fill('2');
    await page.getByLabel(/Budget per person/i).fill('3000');
    
    // Select interests suggested by AI
    const interests = ['Cultural Experiences', 'Adventure', 'Photography', 'Local Cuisine'];
    for (const interest of interests) {
      await page.getByRole('checkbox', { name: interest }).click();
    }

    // Generate AI itinerary
    await page.getByRole('button', { name: /Generate Itinerary/i }).click();

    // Wait for itinerary generation with loading state
    await expect(page.locator('[data-testid="generating-itinerary"]')).toBeVisible();
    await expect(page.locator('[data-testid="itinerary-viewer"]')).toBeVisible({ timeout: 15000 });

    // Verify AI-generated itinerary structure
    await expect(page.locator('[data-testid="itinerary-day"]')).toHaveCount(7);
    
    // Check AI-powered features
    await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="weather-forecast"]')).toBeVisible();

    // Interact with AI customization
    await page.getByRole('button', { name: /Customize with AI/i }).click();
    await page.getByPlaceholder(/Ask AI to modify/i).fill('Add more adventure activities');
    await page.getByRole('button', { name: /Apply Changes/i }).click();

    // Wait for AI to update itinerary
    await expect(page.locator('[data-testid="updating-itinerary"]')).toBeVisible();
    await expect(page.locator('[data-testid="update-complete"]')).toBeVisible({ timeout: 10000 });

    // Save itinerary
    await page.getByRole('button', { name: /Save Itinerary/i }).click();
    
    // Sign up/Login flow
    await page.getByLabel(/Email/i).fill('traveler@example.com');
    await page.getByLabel(/Password/i).fill('SecurePassword123!');
    await page.getByRole('button', { name: /Continue|Sign Up/i }).click();

    // Verify saved itinerary
    await expect(page).toHaveURL(/\/trips/);
    await expect(page.locator('[data-testid="trip-card"]').first()).toContainText('Peru Adventure');
  });

  test('should use voice input for AI interaction', async ({ page }) => {
    await page.goto('/plan');
    
    // Check for voice input support
    const voiceButton = page.getByRole('button', { name: /Voice Input/i });
    
    if (await voiceButton.isVisible()) {
      await voiceButton.click();
      
      // Mock voice input permission
      await page.context().grantPermissions(['microphone']);
      
      // Verify voice recording UI
      await expect(page.locator('[data-testid="voice-recording"]')).toBeVisible();
      
      // Simulate voice input completion
      await page.getByRole('button', { name: /Stop Recording/i }).click();
      
      // Verify AI processes voice input
      await expect(page.locator('[data-testid="processing-voice"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should provide real-time pricing updates', async ({ page }) => {
    await page.goto('/plan');
    
    // Start planning
    await page.getByRole('button', { name: /Quick Plan/i }).click();
    
    // Fill basic details
    await page.getByLabel(/Destination/i).fill('Tokyo');
    await page.getByLabel(/Duration/i).selectOption('5');
    await page.getByLabel(/Budget/i).fill('2000');
    
    // Watch pricing update in real-time
    const initialPrice = await page.locator('[data-testid="estimated-price"]').textContent();
    
    // Change accommodation level
    await page.getByRole('radio', { name: /Luxury/i }).click();
    
    // Verify price updates
    await expect(page.locator('[data-testid="price-updating"]')).toBeVisible();
    const updatedPrice = await page.locator('[data-testid="estimated-price"]').textContent();
    expect(initialPrice).not.toBe(updatedPrice);
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    await page.goto('/plan');
    
    // Create initial itinerary
    await page.getByRole('button', { name: /Quick Plan/i }).click();
    await page.getByLabel(/Destination/i).fill('Paris');
    await page.getByRole('button', { name: /Generate/i }).click();
    
    // Wait for generation
    await expect(page.locator('[data-testid="itinerary-viewer"]')).toBeVisible({ timeout: 15000 });
    
    // Go offline
    await context.setOffline(true);
    
    // Try to modify itinerary
    await page.getByRole('button', { name: /Add Activity/i }).first().click();
    
    // Verify offline handling
    await expect(page.locator('[data-testid="offline-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-queue"]')).toContainText(/Changes will sync/i);
    
    // Go back online
    await context.setOffline(false);
    
    // Verify sync
    await expect(page.locator('[data-testid="syncing"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible({ timeout: 5000 });
  });

  test('should provide AI-powered activity recommendations', async ({ page }) => {
    await page.goto('/trips/sample-trip');
    
    // Open AI recommendations
    await page.getByRole('button', { name: /AI Recommendations/i }).click();
    
    // Verify recommendation categories
    await expect(page.locator('[data-testid="recommendations-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendation-category"]')).toHaveCount(4);
    
    // Select a recommendation
    await page.locator('[data-testid="activity-recommendation"]').first().click();
    await page.getByRole('button', { name: /Add to Day 3/i }).click();
    
    // Verify activity added with AI insights
    await expect(page.locator('[data-testid="day-3-activities"]')).toContainText(/Added from AI/i);
    await expect(page.locator('[data-testid="ai-activity-insights"]')).toBeVisible();
  });
});