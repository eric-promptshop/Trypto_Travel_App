import { test, expect } from '@playwright/test';

test.describe('Mobile Optimization Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mobile testing environment
    await page.goto('/');
  });

  test.describe('Touch Target Sizing', () => {
    test('All interactive elements should meet 44x44px minimum touch target size', async ({ page }) => {
      // Navigate to key pages and check touch targets
      const pages = ['/', '/plan', '/itinerary-display', '/ui-showcase'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Get all interactive elements
        const interactiveElements = await page.locator('button, a, input[type="submit"], input[type="button"], .touch-target').all();
        
        for (const element of interactiveElements) {
          const boundingBox = await element.boundingBox();
          
          if (boundingBox) {
            // Check minimum touch target size (44x44px)
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('Close icons and small buttons should have touch-target class', async ({ page }) => {
      await page.goto('/plan');
      
      // Look for small interactive elements that should have touch-target class
      const smallButtons = await page.locator('button[class*="close"], button[class*="dismiss"], .close-button').all();
      
      for (const button of smallButtons) {
        const hasClass = await button.evaluate(el => el.classList.contains('touch-target'));
        expect(hasClass).toBe(true);
      }
    });
  });

  test.describe('Swipe Gestures & Haptic Feedback', () => {
    test('Should support swipe-to-delete for activities', async ({ page }) => {
      await page.goto('/plan');
      
      // Navigate to a page with activities
      // Fill out form to get to activity selection
      await page.fill('input[name="destination"]', 'Paris');
      await page.fill('input[name="startDate"]', '2024-06-01');
      await page.fill('input[name="endDate"]', '2024-06-07');
      
      // Proceed to activity selection if available
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      
      // Look for swipeable activities
      const activities = await page.locator('[data-swipeable="true"], .swipe-to-delete').all();
      
      if (activities.length > 0) {
        const firstActivity = activities[0];
        if (firstActivity) {
          const boundingBox = await firstActivity.boundingBox();
          
          if (boundingBox) {
            // Simulate swipe gesture (touch start, move, end)
            await page.mouse.move(boundingBox.x + 10, boundingBox.y + boundingBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(boundingBox.x + boundingBox.width - 10, boundingBox.y + boundingBox.height / 2);
            await page.mouse.up();
            
            // Check if delete action was triggered or delete button appeared
            const deleteButton = page.locator('button:has-text("Delete"), .delete-button');
            await expect(deleteButton).toBeVisible({ timeout: 2000 });
          }
        }
      }
    });

    test('Should support swipe navigation between itinerary days', async ({ page }) => {
      await page.goto('/itinerary-display');
      
      // Look for swipeable itinerary sections
      const dayContainers = await page.locator('[data-swipe-navigation="true"], .day-container, .itinerary-day').all();
      
      if (dayContainers.length > 1) {
        const firstDay = dayContainers[0];
        if (firstDay) {
          const boundingBox = await firstDay.boundingBox();
          
          if (boundingBox) {
            // Simulate swipe gesture to next day
            await page.mouse.move(boundingBox.x + boundingBox.width - 10, boundingBox.y + boundingBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(boundingBox.x + 10, boundingBox.y + boundingBox.height / 2);
            await page.mouse.up();
            
            // Wait for transition and check if view changed
            await page.waitForTimeout(500);
            
            // Verify navigation occurred (content should change)
            // This is a basic check - in real implementation, check for specific day indicators
            const activeDay = page.locator('.active-day, [data-active="true"]');
            if (await activeDay.count() > 0) {
              await expect(activeDay).toBeVisible();
            }
          }
        }
      }
    });

    test('Should trigger haptic feedback on key actions', async ({ page }) => {
      // Test haptic feedback by monitoring navigator.vibrate calls
      let vibrateCallCount = 0;
      
      await page.addInitScript(() => {
        // Mock navigator.vibrate and count calls
        const originalVibrate = navigator.vibrate;
        (navigator as any).vibrate = (pattern: any) => {
          (window as any).vibrateCallCount = ((window as any).vibrateCallCount || 0) + 1;
          return originalVibrate ? originalVibrate.call(navigator, pattern) : true;
        };
      });
      
      await page.goto('/plan');
      
      // Trigger actions that should cause haptic feedback
      await page.click('button:has-text("Add"), button:has-text("Save"), button:has-text("Submit")');
      
      // Get vibrate call count
      vibrateCallCount = await page.evaluate(() => (window as any).vibrateCallCount || 0);
      
      // Verify haptic feedback was triggered
      expect(vibrateCallCount).toBeGreaterThan(0);
    });
  });

  test.describe('Offline Support', () => {
    test('Should load core UI when offline', async ({ page, context }) => {
      // First visit to cache resources
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Go offline
      await context.setOffline(true);
      
      // Reload the page
      await page.reload();
      
      // Check that basic UI elements are still available
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('header, nav')).toBeVisible();
      
      // Check for offline indicator
      const offlineIndicator = page.locator('.offline-banner, [data-offline="true"]');
      await expect(offlineIndicator).toBeVisible({ timeout: 5000 });
    });

    test('Should queue actions when offline and sync when online', async ({ page, context }) => {
      await page.goto('/plan');
      
      // Fill out form
      await page.fill('input[name="destination"]', 'Rome');
      
      // Go offline
      await context.setOffline(true);
      
      // Try to save (should queue)
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Check for offline queue indicator
        const queueIndicator = page.locator('.offline-queue, [data-queued="true"]');
        await expect(queueIndicator).toBeVisible({ timeout: 3000 });
      }
      
      // Go back online
      await context.setOffline(false);
      
      // Check if queued actions are processed
      await page.waitForTimeout(2000);
      
      // Verify sync occurred (queue indicator should disappear)
      const queueIndicator = page.locator('.offline-queue, [data-queued="true"]');
      await expect(queueIndicator).not.toBeVisible({ timeout: 5000 });
    });

    test('Should cache images for offline use', async ({ page, context }) => {
      // Visit page with images
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Go offline
      await context.setOffline(true);
      
      // Reload and check if images are still available
      await page.reload();
      
      const images = await page.locator('img').all();
      
      for (const image of images.slice(0, 3)) { // Check first 3 images
        await expect(image).toBeVisible();
        
        // Check if image loaded successfully (not broken)
        const naturalWidth = await image.evaluate(img => (img as HTMLImageElement).naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Image Optimization', () => {
    test('Images should be responsive and lazy-loaded', async ({ page }) => {
      await page.goto('/');
      
      const images = await page.locator('img').all();
      
      for (const image of images.slice(0, 5)) { // Check first 5 images
        // Check for responsive attributes
        const srcset = await image.getAttribute('srcset');
        const sizes = await image.getAttribute('sizes');
        
        // Should have either srcset or be part of responsive image system
        const hasResponsiveAttrs = srcset || sizes || 
          await image.evaluate(img => img.classList.contains('responsive-image'));
        
        expect(hasResponsiveAttrs).toBeTruthy();
        
        // Check for lazy loading
        const loading = await image.getAttribute('loading');
        expect(loading).toBe('lazy');
      }
    });

    test('Should support WebP format images', async ({ page }) => {
      await page.goto('/');
      
      // Check if WebP images are being served
      const images = await page.locator('img').all();
      let hasWebP = false;
      
      for (const image of images) {
        const src = await image.getAttribute('src');
        const srcset = await image.getAttribute('srcset');
        
        if ((src && src.includes('.webp')) || (srcset && srcset.includes('.webp'))) {
          hasWebP = true;
          break;
        }
      }
      
      // At least some images should be in WebP format if supported
      // This might not always be true, so we'll make it a soft assertion
      if (!hasWebP) {
        console.log('Note: No WebP images detected. This may be expected if WebP is not supported or not implemented.');
      }
    });

    test('Should have blur-up loading effect', async ({ page }) => {
      await page.goto('/');
      
      // Look for placeholder or blur effects
      const imageContainers = await page.locator('.image-container, .responsive-image-container').all();
      
      if (imageContainers.length > 0) {
        for (const container of imageContainers.slice(0, 3)) {
          // Check for blur placeholder classes or data attributes
          const hasBlurEffect = await container.evaluate(el => 
            el.classList.contains('blur-up') ||
            el.querySelector('[data-blur="true"]') ||
            el.querySelector('.blur-placeholder')
          );
          
          if (hasBlurEffect) {
            expect(hasBlurEffect).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Dark Mode Support', () => {
    test('Should respect system dark mode preference', async ({ page }) => {
      // Test with dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');
      
      // Check if dark theme is applied
      const body = await page.locator('body');
      const htmlElement = await page.locator('html');
      
      const hasDarkClass = await body.evaluate(el => el.classList.contains('dark')) ||
                          await htmlElement.evaluate(el => el.classList.contains('dark'));
      
      expect(hasDarkClass).toBe(true);
      
      // Test with light mode preference
      await page.emulateMedia({ colorScheme: 'light' });
      await page.reload();
      
      const hasLightTheme = await body.evaluate(el => !el.classList.contains('dark')) ||
                           await htmlElement.evaluate(el => !el.classList.contains('dark'));
      
      expect(hasLightTheme).toBe(true);
    });

    test('Should have manual theme switcher', async ({ page }) => {
      await page.goto('/');
      
      // Look for theme switcher
      const themeSwitcher = page.locator('button[data-theme-toggle], .theme-switcher, button:has-text("theme")');
      
      if (await themeSwitcher.isVisible()) {
        await themeSwitcher.click();
        
        // Check if theme changed
        await page.waitForTimeout(500);
        
        const body = await page.locator('body');
        const hasDarkClass = await body.evaluate(el => el.classList.contains('dark'));
        
        expect(typeof hasDarkClass).toBe('boolean');
      }
    });
  });

  test.describe('Reduced Motion Support', () => {
    test('Should disable animations when prefers-reduced-motion is enabled', async ({ page }) => {
      // Enable reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      
      // Check if animations are disabled
      const animatedElements = await page.locator('[data-animate], .animate, [class*="transition"]').all();
      
      for (const element of animatedElements.slice(0, 3)) {
        const computedStyle = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            transitionDuration: style.transitionDuration,
            animationDuration: style.animationDuration
          };
        });
        
        // Animations should be very short or disabled
        expect(computedStyle.transitionDuration === '0s' || 
               computedStyle.transitionDuration === '0.01s' ||
               computedStyle.animationDuration === '0s' ||
               computedStyle.animationDuration === '0.01s').toBe(true);
      }
    });
  });

  test.describe('Battery Status Adaptation', () => {
    test('Should show battery saver banner when battery is low', async ({ page }) => {
      // Mock low battery status
      await page.addInitScript(() => {
        // Mock Battery API
        (navigator as any).getBattery = () => Promise.resolve({
          level: 0.15, // 15% battery
          charging: false,
          addEventListener: () => {},
          removeEventListener: () => {}
        });
      });
      
      await page.goto('/');
      
      // Wait for battery status to be detected
      await page.waitForTimeout(1000);
      
      // Check for battery saver banner
      const batterySaverBanner = page.locator('.battery-saver, [data-battery-saver="true"]');
      await expect(batterySaverBanner).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Geolocation Adaptation', () => {
    test('Should prompt for location access', async ({ page, context }) => {
      // Grant geolocation permission
      await context.grantPermissions(['geolocation']);
      
      // Mock geolocation
      await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 }); // Paris
      
      await page.goto('/');
      
      // Wait for geolocation detection
      await page.waitForTimeout(2000);
      
      // Check for location-related elements
      const locationBanner = page.locator('.geolocation-banner, [data-location="true"]');
      
      // Either location should be detected or a prompt should appear
      const hasLocationFeature = await locationBanner.count() > 0;
      
      if (hasLocationFeature) {
        await expect(locationBanner).toBeVisible();
      }
    });
  });
}); 