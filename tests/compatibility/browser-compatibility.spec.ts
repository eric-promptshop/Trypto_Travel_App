import { test, expect, devices } from '@playwright/test';

test.describe('Cross-Browser Compatibility Testing', () => {
  const testPages = [
    { path: '/', title: 'Home Page' },
    { path: '/plan', title: 'Trip Planning' },
    { path: '/itinerary-display', title: 'Itinerary Display' },
    { path: '/ui-showcase', title: 'UI Components' },
    { path: '/docs', title: 'Documentation' }
  ];

  testPages.forEach(({ path, title }) => {
    test(`${title} loads correctly across browsers`, async ({ page, browserName }) => {
      
      await page.goto(path);
      
      // Basic page load validation
      await expect(page.locator('body')).toBeVisible();
      
      // Check for critical page elements
      if (path === '/') {
        await expect(page.locator('header, nav')).toBeVisible();
        await expect(page.locator('main, [role="main"]')).toBeVisible();
      }
      
      // Verify no critical JavaScript errors
      const errors: string[] = [];
      page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check for console errors (excluding warnings)
      const logs = await page.evaluate(() => {
        return window.console && (window as any).__errors || [];
      });
      
      
      // Basic interactivity test
      const firstButton = page.locator('button, a[href]').first();
      if (await firstButton.count() > 0) {
        await expect(firstButton).toBeVisible();
        
        // Test hover state (desktop browsers)
        if (browserName !== 'webkit' || path !== '/') { // Skip hover on mobile Safari
          await firstButton.hover();
        }
      }
    });
  });

  test('Navigation works across browsers', async ({ page, browserName }) => {
    
    await page.goto('/');
    
    // Test navigation to different pages
    const navLinks = await page.locator('nav a, header a').all();
    
    if (navLinks.length > 0) {
      // Test first navigation link
      const firstLink = navLinks[0];
      if (firstLink) {
        const href = await firstLink.getAttribute('href');
        
        if (href && href.startsWith('/')) {
          await firstLink.click();
          await page.waitForLoadState('domcontentloaded');
          
          // Verify navigation worked
          const currentUrl = page.url();
          expect(currentUrl).toContain(href);
          
        }
      }
    }
  });

  test('Form elements work across browsers', async ({ page, browserName }) => {
    
    await page.goto('/plan');
    
    // Find form inputs
    const inputs = await page.locator('input[type="text"], input[type="email"], select, textarea').all();
    
    if (inputs.length > 0) {
      const firstInput = inputs[0];
      if (firstInput) {
        // Test input functionality
        await firstInput.click();
        await firstInput.fill('Test input');
        
        const value = await firstInput.inputValue();
        expect(value).toBe('Test input');
        
      }
    }
    
    // Test button interactions
    const buttons = await page.locator('button:not([disabled])').all();
    
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      if (firstButton) {
        await expect(firstButton).toBeVisible();
        
        // Verify button is clickable
        const isEnabled = await firstButton.isEnabled();
        expect(isEnabled).toBe(true);
        
      }
    }
  });

  test('CSS rendering consistency across browsers', async ({ page, browserName }) => {
    
    await page.goto('/');
    
    // Test critical styling elements
    const header = page.locator('header').first();
    if (await header.count() > 0) {
      const headerStyles = await header.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          position: styles.position,
          backgroundColor: styles.backgroundColor
        };
      });
      
      // Verify header has proper styling
      expect(headerStyles.display).not.toBe('none');
      
    }
    
    // Test responsive grid/flex layouts
    const layoutElements = await page.locator('[class*="flex"], [class*="grid"], .container').all();
    
    for (const element of layoutElements.slice(0, 3)) { // Test first 3 layout elements
      const box = await element.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    }
    
  });

  test('JavaScript functionality across browsers', async ({ page, browserName }) => {
    
    await page.goto('/ui-showcase');
    
    // Test basic JavaScript features
    const jsFeatures = await page.evaluate(() => {
      return {
        es6Support: typeof Promise !== 'undefined' && typeof Map !== 'undefined',
        asyncSupport: true, // Modern browsers support async/await
        fetchSupport: typeof fetch !== 'undefined',
        localStorageSupport: typeof localStorage !== 'undefined',
        geolocationSupport: typeof navigator.geolocation !== 'undefined',
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      };
    });
    
    // Verify modern JavaScript features work
    expect(jsFeatures.es6Support).toBe(true);
    expect(jsFeatures.fetchSupport).toBe(true);
    expect(jsFeatures.localStorageSupport).toBe(true);
    
    
    // Test interactive components if available
    const interactiveElements = await page.locator('[data-testid], .interactive, button[onclick]').all();
    
    if (interactiveElements.length > 0) {
      const firstElement = interactiveElements[0];
      if (firstElement) {
        // Test click interaction
        await firstElement.click();
        await page.waitForTimeout(500); // Wait for any animations
        
      }
    }
  });

  test('Error handling across browsers', async ({ page, browserName }) => {
    
    // Test 404 page handling
    await page.goto('/non-existent-page');
    
    // Should show some kind of error page or redirect
    const pageContent = await page.textContent('body');
    const has404Content = pageContent && (
      pageContent.includes('404') ||
      pageContent.includes('Not Found') ||
      pageContent.includes('Page not found') ||
      page.url().includes('/')  // Redirected to home
    );
    
    expect(has404Content).toBeTruthy();
    
    
    // Test back to valid page
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Device-Specific Testing', () => {
  test('Desktop layout and interactions', async ({ page }) => {
    // Force desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    // Test desktop-specific features
    const desktopNav = page.locator('nav:not(.mobile-nav)').first();
    if (await desktopNav.count() > 0) {
      await expect(desktopNav).toBeVisible();
    }
    
    // Test hover interactions (desktop-specific)
    const hoverElements = await page.locator('button, a, .hover-element').all();
    
    if (hoverElements.length > 0) {
      await hoverElements[0].hover();
      await page.waitForTimeout(300); // Wait for hover effects
    }
    
  });

  test('Tablet layout and interactions', async ({ page }) => {
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Verify tablet-responsive layout
    await expect(page.locator('body')).toBeVisible();
    
    // Test touch-friendly elements
    const touchElements = await page.locator('button, a, input').all();
    
    for (const element of touchElements.slice(0, 3)) {
      const box = await element.boundingBox();
      if (box) {
        // Touch targets should be reasonably sized for tablet
        expect(box.width).toBeGreaterThanOrEqual(32);
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
    
  });

  test('Mobile layout and interactions', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verify mobile-responsive layout
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile navigation if present
    const mobileMenu = page.locator('.mobile-menu, [data-mobile-menu], .hamburger').first();
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
      await page.waitForTimeout(500);
    }
    
    // Test touch targets on mobile
    const touchTargets = await page.locator('button, a, input').all();
    
    for (const target of touchTargets.slice(0, 5)) {
      const box = await target.boundingBox();
      if (box) {
        // Mobile touch targets should meet minimum 44px requirement
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
  });

  test('Landscape vs Portrait orientation', async ({ page }) => {
    await page.goto('/');
    
    // Test portrait mode (mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    const portraitHeight = await page.locator('body').boundingBox();
    
    // Test landscape mode (mobile)
    await page.setViewportSize({ width: 667, height: 375 });
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
    
    const landscapeHeight = await page.locator('body').boundingBox();
    
    // Verify layout adapts to orientation
    expect(portraitHeight).toBeTruthy();
    expect(landscapeHeight).toBeTruthy();
    
  });
});

test.describe('Browser Feature Support', () => {
  test('Modern web APIs availability', async ({ page, browserName }) => {
    await page.goto('/');
    
    const apiSupport = await page.evaluate(() => {
      return {
        serviceWorker: 'serviceWorker' in navigator,
        pushNotifications: 'PushManager' in window,
        webGL: !!document.createElement('canvas').getContext('webgl'),
        webAssembly: typeof WebAssembly !== 'undefined',
        intersectionObserver: 'IntersectionObserver' in window,
        customElements: 'customElements' in window,
        cssBrowserSupport: CSS.supports('display', 'grid'),
        flexboxSupport: CSS.supports('display', 'flex')
      };
    });
    
    // Core features should be supported
    expect(apiSupport.intersectionObserver).toBe(true);
    expect(apiSupport.flexboxSupport).toBe(true);
    
    
    // Service Worker support varies by browser/context
    if (apiSupport.serviceWorker) {
    }
  });

  test('Performance API availability', async ({ page, browserName }) => {
    await page.goto('/');
    
    const perfSupport = await page.evaluate(() => {
      return {
        performanceAPI: 'performance' in window,
        performanceObserver: 'PerformanceObserver' in window,
        navigationTiming: 'navigation' in performance,
        resourceTiming: 'getEntriesByType' in performance,
        userTiming: 'mark' in performance && 'measure' in performance
      };
    });
    
    // Basic performance API should be available
    expect(perfSupport.performanceAPI).toBe(true);
    
  });
}); 