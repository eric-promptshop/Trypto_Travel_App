import { test, expect } from '@playwright/test';

test('Mobile touch targets should meet 44x44px minimum size', async ({ page }) => {
  await page.goto('/');
  
  // Get all interactive elements
  const buttons = await page.locator('button, a, input[type="submit"], input[type="button"]').all();
  
  
  for (const button of buttons.slice(0, 5)) { // Test first 5 elements
    const boundingBox = await button.boundingBox();
    
    if (boundingBox) {
      
      // Check minimum touch target size (44x44px)
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test('Page should load successfully on mobile', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads
  await expect(page.locator('body')).toBeVisible();
  
  // Check for basic navigation elements
  const nav = page.locator('nav, header');
  await expect(nav).toBeVisible();
  
}); 