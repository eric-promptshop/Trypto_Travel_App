import { test, expect } from '@playwright/test'

test.describe('Complete User Journey - E2E Flow', () => {
  test('completes full trip planning journey from landing to itinerary', async ({ page }) => {
    // Step 1: Navigate to landing page
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Travel planning made simple')
    
    // Click Get Started
    await page.getByRole('button', { name: 'Get Started' }).click()
    await expect(page).toHaveURL(/.*\/plan/)

    // Step 2: Fill out trip planning form
    // Select destinations
    await page.getByTestId('destination-selector').click()
    await page.getByText('Peru').click()
    await page.getByText('Brazil').click()
    await page.keyboard.press('Escape')

    // Set travel dates
    await page.getByTestId('date-range-picker').click()
    await page.getByTestId('start-date').fill('2024-06-15')
    await page.getByTestId('end-date').fill('2024-06-22')

    // Set travelers
    await page.getByTestId('adults-increment').click()
    await page.getByTestId('adults-increment').click()
    await expect(page.getByTestId('travelers-count')).toContainText('2 adults')

    // Set budget
    const budgetSlider = page.getByTestId('budget-slider')
    await budgetSlider.locator('input[type="range"]').first().fill('2000')
    await budgetSlider.locator('input[type="range"]').last().fill('3000')

    // Select interests
    await page.getByTestId('interest-tag').filter({ hasText: 'Adventure' }).click()
    await page.getByTestId('interest-tag').filter({ hasText: 'Culture' }).click()
    await page.getByTestId('interest-tag').filter({ hasText: 'Food' }).click()

    // Add special requirements
    await page.getByTestId('special-requirements').fill('Vegetarian meals preferred. Need wheelchair accessible accommodations.')

    // Submit form
    await page.getByRole('button', { name: 'Create Itinerary' }).click()

    // Step 3: Verify itinerary page
    await expect(page).toHaveURL(/.*\/itinerary/)
    await expect(page.getByTestId('itinerary-title')).toContainText('Peru')
    await expect(page.getByTestId('trip-duration')).toContainText('7 days')
    await expect(page.getByTestId('traveler-count')).toContainText('2 travelers')

    // Check daily activities are visible
    await page.getByTestId('day-1').click()
    const activities = page.getByTestId('activity-card')
    await expect(activities).toHaveCount(await activities.count())
    expect(await activities.count()).toBeGreaterThan(0)

    // Step 4: Test customization
    await page.getByRole('button', { name: 'Edit Trip' }).click()
    
    // Add activity
    await page.getByTestId('add-activity').click()
    await page.getByTestId('activity-search').fill('Machu Picchu')
    await page.waitForTimeout(500) // Wait for search results
    await page.getByTestId('activity-result').first().click()
    await page.getByRole('button', { name: 'Add to Day 2' }).click()

    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click()

    // Step 5: Verify final state
    await expect(page.getByTestId('budget-progress')).toBeVisible()
    await expect(page.getByTestId('total-cost')).toContainText('$')

    // Test share functionality
    await page.getByRole('button', { name: 'Share' }).click()
    await expect(page.getByTestId('share-link')).toBeVisible()
  })

  test('handles form validation errors', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Get Started' }).click()

    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Itinerary' }).click()

    // Check for validation errors
    await expect(page.getByTestId('error-message')).toContainText('Please select at least one destination')

    // Fill required fields
    await page.getByTestId('destination-selector').click()
    await page.getByText('Peru').click()
    await page.keyboard.press('Escape')

    await page.getByTestId('date-range-picker').click()
    await page.getByTestId('start-date').fill('2024-06-15')
    await page.getByTestId('end-date').fill('2024-06-22')

    // Should now submit successfully
    await page.getByRole('button', { name: 'Create Itinerary' }).click()
    await expect(page).toHaveURL(/.*\/itinerary/)
  })

  test('responsive mobile experience', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    
    // Mobile navigation should be visible
    await expect(page.getByTestId('mobile-menu')).toBeVisible()
    
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Check mobile-specific UI
    await expect(page.getByTestId('bottom-navigation')).toBeVisible()
    
    // Form should be mobile-optimized
    const destinationSelector = page.getByTestId('destination-selector')
    await expect(destinationSelector).toHaveCSS('width', '100%')
  })

  test('trip management dashboard', async ({ page }) => {
    await page.goto('/trips')
    
    // Should show trip list
    await expect(page.getByText('Your Trips')).toBeVisible()
    
    // Create new trip button
    await expect(page.getByRole('button', { name: 'Create New Trip' })).toBeVisible()
    
    // Search functionality
    await page.getByPlaceholder('Search trips').fill('Peru')
    await page.waitForTimeout(300) // Debounce delay
    
    // Filter options
    await page.getByRole('button', { name: 'All Trips' }).click()
    await page.getByRole('option', { name: 'Upcoming' }).click()
    
    // Sort options
    await page.getByRole('button', { name: 'Sort' }).click()
    await page.getByRole('option', { name: 'Date (Newest)' }).click()
  })

  test('analytics dashboard access', async ({ page }) => {
    await page.goto('/analytics')
    
    // Check main dashboard elements
    await expect(page.getByText('Analytics Dashboard')).toBeVisible()
    await expect(page.getByText('Total Trips')).toBeVisible()
    await expect(page.getByText('Active Users')).toBeVisible()
    await expect(page.getByText('Conversion Rate')).toBeVisible()
    await expect(page.getByText('Avg Trip Value')).toBeVisible()
    
    // Charts should be visible
    await expect(page.getByText('Trip Volume')).toBeVisible()
    await expect(page.getByText('Popular Destinations')).toBeVisible()
    await expect(page.getByText('User Engagement')).toBeVisible()
  })
})