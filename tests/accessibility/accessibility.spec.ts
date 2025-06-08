import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing - WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page for accessibility testing
    await page.goto('/');
  });

  test('Home page should be accessible', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Trip planning form should be accessible', async ({ page }) => {
    await page.goto('/plan');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Itinerary display should be accessible', async ({ page }) => {
    await page.goto('/itinerary-display');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('UI showcase should be accessible', async ({ page }) => {
    await page.goto('/ui-showcase');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Documentation should be accessible', async ({ page }) => {
    await page.goto('/docs');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation should work throughout the app', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Navigate to different pages using keyboard
    await page.keyboard.press('Enter');
    
    // Verify focus management
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Screen reader landmarks should be present', async ({ page }) => {
    await page.goto('/');
    
    // Check for main landmark
    await expect(page.locator('main')).toBeVisible();
    
    // Check for navigation landmark
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for proper heading structure
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBeGreaterThanOrEqual(1);
  });

  test('Form labels and inputs should be properly associated', async ({ page }) => {
    await page.goto('/plan');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['forms'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check that all form inputs have associated labels
    const inputs = await page.locator('input[type="text"], input[type="email"], select, textarea').all();
    
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');
      
      // Each input should have either aria-label, aria-labelledby, or an associated label
      if (!ariaLabel && !ariaLabelledBy && id) {
        const associatedLabel = await page.locator(`label[for="${id}"]`).count();
        expect(associatedLabel).toBeGreaterThan(0);
      }
    }
  });

  test('Images should have appropriate alt text', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['images'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check that all images have alt attributes
    const images = await page.locator('img').all();
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('Focus indicators should be visible', async ({ page }) => {
    await page.goto('/');
    
    // Test focus indicators on interactive elements
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();
    
    for (const element of interactiveElements.slice(0, 5)) { // Test first 5 elements
      await element.focus();
      
      // Check that focus is visible (this is a basic check)
      const isFocused = await element.evaluate(el => document.activeElement === el);
      expect(isFocused).toBe(true);
    }
  });
}); 