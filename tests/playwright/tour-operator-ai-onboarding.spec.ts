import { test, expect } from '@playwright/test';

test.describe('Tour Operator AI-Enhanced Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
  });

  test('should complete full tour operator onboarding with AI assistance', async ({ page }) => {
    // Welcome screen
    await expect(page.locator('h1')).toContainText(/Welcome to TripNav/);
    await page.getByRole('button', { name: /Get Started/i }).click();

    // Company Profile with AI assistance
    await expect(page.locator('[data-testid="company-profile-step"]')).toBeVisible();
    
    // Use AI to generate company description
    await page.getByLabel(/Company Name/i).fill('Adventure Peru Tours');
    await page.getByRole('button', { name: /Generate Description with AI/i }).click();
    
    // Wait for AI generation
    await expect(page.locator('[data-testid="ai-generating"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toHaveValue(/.+/, { timeout: 10000 });
    
    // Fill remaining fields
    await page.getByLabel(/Website/i).fill('https://adventureperu.com');
    await page.getByLabel(/Phone/i).fill('+1-555-0123');
    await page.getByLabel(/Primary Market/i).selectOption('adventure-travel');
    
    // Upload logo with AI optimization
    const logoInput = page.locator('input[type="file"]');
    await logoInput.setInputFiles('tests/fixtures/sample-logo.png');
    
    // AI logo optimization
    await expect(page.locator('[data-testid="ai-optimizing-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="logo-preview"]')).toBeVisible({ timeout: 5000 });
    
    await page.getByRole('button', { name: /Continue/i }).click();

    // Branding Customization with AI
    await expect(page.locator('[data-testid="branding-step"]')).toBeVisible();
    
    // AI color scheme generation
    await page.getByRole('button', { name: /Generate Color Scheme/i }).click();
    await expect(page.locator('[data-testid="ai-color-analysis"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-palette"]')).toBeVisible({ timeout: 5000 });
    
    // Select AI-suggested theme
    await page.locator('[data-testid="theme-option"]').first().click();
    
    // Customize with AI assistance
    await page.getByRole('button', { name: /AI Customize/i }).click();
    await page.getByPlaceholder(/Describe your brand style/i).fill('Modern, adventurous, trustworthy');
    await page.getByRole('button', { name: /Apply AI Suggestions/i }).click();
    
    await expect(page.locator('[data-testid="preview-updating"]')).toBeVisible();
    await expect(page.locator('[data-testid="theme-preview"]')).toBeVisible({ timeout: 5000 });
    
    await page.getByRole('button', { name: /Continue/i }).click();

    // Content Import with AI processing
    await expect(page.locator('[data-testid="content-import-step"]')).toBeVisible();
    
    // Choose AI-assisted import
    await page.getByRole('radio', { name: /Import from Website/i }).click();
    await page.getByLabel(/Website URL/i).fill('https://adventureperu.com');
    await page.getByRole('button', { name: /Analyze with AI/i }).click();
    
    // AI content analysis
    await expect(page.locator('[data-testid="ai-analyzing-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-analysis-results"]')).toBeVisible({ timeout: 15000 });
    
    // Review AI-extracted content
    await expect(page.locator('[data-testid="extracted-trips"]')).toContainText(/Found \d+ trips/);
    await expect(page.locator('[data-testid="extracted-activities"]')).toContainText(/Found \d+ activities/);
    
    // Select content to import
    await page.getByRole('checkbox', { name: /Select All Trips/i }).click();
    await page.getByRole('button', { name: /Import Selected/i }).click();
    
    await expect(page.locator('[data-testid="importing-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-complete"]')).toBeVisible({ timeout: 20000 });
    
    await page.getByRole('button', { name: /Continue/i }).click();

    // Pricing Configuration with AI insights
    await expect(page.locator('[data-testid="pricing-step"]')).toBeVisible();
    
    // Get AI pricing recommendations
    await page.getByRole('button', { name: /Get AI Recommendations/i }).click();
    await expect(page.locator('[data-testid="ai-analyzing-market"]')).toBeVisible();
    await expect(page.locator('[data-testid="pricing-recommendations"]')).toBeVisible({ timeout: 10000 });
    
    // Apply AI-suggested pricing
    await page.getByRole('button', { name: /Apply Recommended Pricing/i }).click();
    
    // Set commission and margins
    await page.getByLabel(/Default Commission/i).fill('15');
    await page.getByLabel(/Minimum Margin/i).fill('20');
    
    // Enable dynamic pricing
    await page.getByRole('checkbox', { name: /Enable AI Dynamic Pricing/i }).click();
    
    await page.getByRole('button', { name: /Continue/i }).click();

    // CRM Integration
    await expect(page.locator('[data-testid="integrations-step"]')).toBeVisible();
    
    // Select CRM
    await page.getByRole('radio', { name: /HubSpot/i }).click();
    await page.getByLabel(/API Key/i).fill('test-api-key-12345');
    
    // Test connection with AI validation
    await page.getByRole('button', { name: /Test Connection/i }).click();
    await expect(page.locator('[data-testid="testing-connection"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-successful"]')).toBeVisible({ timeout: 5000 });
    
    // AI field mapping
    await page.getByRole('button', { name: /Auto-Map Fields/i }).click();
    await expect(page.locator('[data-testid="ai-mapping-fields"]')).toBeVisible();
    await expect(page.locator('[data-testid="field-mappings"]')).toBeVisible({ timeout: 5000 });
    
    await page.getByRole('button', { name: /Continue/i }).click();

    // Review and Launch
    await expect(page.locator('[data-testid="review-step"]')).toBeVisible();
    
    // AI readiness check
    await page.getByRole('button', { name: /Run AI Readiness Check/i }).click();
    await expect(page.locator('[data-testid="ai-checking-readiness"]')).toBeVisible();
    await expect(page.locator('[data-testid="readiness-report"]')).toBeVisible({ timeout: 10000 });
    
    // Review checklist
    const checklistItems = page.locator('[data-testid="checklist-item"]');
    await expect(checklistItems).toHaveCount(6);
    
    // All items should be checked
    for (let i = 0; i < 6; i++) {
      await expect(checklistItems.nth(i).locator('[data-testid="check-icon"]')).toBeVisible();
    }
    
    // Launch platform
    await page.getByRole('button', { name: /Launch My Platform/i }).click();
    
    // Deployment process
    await expect(page.locator('[data-testid="deploying"]')).toBeVisible();
    await expect(page.locator('[data-testid="deployment-progress"]')).toBeVisible();
    
    // Success screen
    await expect(page.locator('[data-testid="launch-success"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h1')).toContainText(/Congratulations/);
    await expect(page.locator('[data-testid="platform-url"]')).toContainText(/adventureperu\.tripnav\.io/);
    
    // Access admin dashboard
    await page.getByRole('button', { name: /Go to Admin Dashboard/i }).click();
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should handle AI content generation for tour packages', async ({ page }) => {
    // Navigate directly to content import step
    await page.goto('/onboarding/content-import');
    
    // Choose AI generation
    await page.getByRole('radio', { name: /Generate with AI/i }).click();
    
    // Describe business for AI
    await page.getByLabel(/Describe your tours/i).fill(
      'We offer adventure tours in Peru including Machu Picchu treks, Amazon rainforest expeditions, and cultural experiences in Cusco'
    );
    
    // Select tour types
    await page.getByRole('checkbox', { name: /Adventure/i }).click();
    await page.getByRole('checkbox', { name: /Cultural/i }).click();
    await page.getByRole('checkbox', { name: /Nature/i }).click();
    
    // Generate content
    await page.getByRole('button', { name: /Generate Tour Packages/i }).click();
    
    // Wait for AI generation
    await expect(page.locator('[data-testid="ai-generating-packages"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-packages"]')).toBeVisible({ timeout: 20000 });
    
    // Review generated packages
    const packages = page.locator('[data-testid="package-card"]');
    await expect(packages).toHaveCount({ min: 3, max: 10 });
    
    // Edit AI-generated package
    await packages.first().getByRole('button', { name: /Edit/i }).click();
    await expect(page.locator('[data-testid="package-editor"]')).toBeVisible();
    
    // Use AI to enhance description
    await page.getByRole('button', { name: /Enhance with AI/i }).click();
    await expect(page.locator('[data-testid="ai-enhancing"]')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Description/i })).toHaveValue(/.+/, { timeout: 5000 });
    
    // Save changes
    await page.getByRole('button', { name: /Save Package/i }).click();
  });

  test('should set up AI-powered customer service', async ({ page }) => {
    await page.goto('/onboarding/integrations');
    
    // Enable AI chat
    await page.getByRole('checkbox', { name: /Enable AI Customer Service/i }).click();
    
    // Configure AI personality
    await page.getByRole('button', { name: /Configure AI Assistant/i }).click();
    await expect(page.locator('[data-testid="ai-config-modal"]')).toBeVisible();
    
    // Set AI parameters
    await page.getByLabel(/Assistant Name/i).fill('Peru Travel Expert');
    await page.getByLabel(/Personality/i).selectOption('friendly-professional');
    await page.getByLabel(/Knowledge Focus/i).selectOption('adventure-travel');
    
    // Train on company data
    await page.getByRole('button', { name: /Train on My Content/i }).click();
    await expect(page.locator('[data-testid="ai-training"]')).toBeVisible();
    await expect(page.locator('[data-testid="training-complete"]')).toBeVisible({ timeout: 15000 });
    
    // Test AI assistant
    await page.getByRole('button', { name: /Test Assistant/i }).click();
    await page.getByPlaceholder(/Ask a question/i).fill('What are the best months to visit Machu Picchu?');
    await page.getByRole('button', { name: /Send/i }).click();
    
    // Verify AI response
    await expect(page.locator('[data-testid="ai-assistant-response"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="ai-assistant-response"]')).toContainText(/dry season|May|September/i);
    
    // Save configuration
    await page.getByRole('button', { name: /Save Configuration/i }).click();
  });
});