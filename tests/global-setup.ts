import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {

  // Check if the application is running
  const baseURL = 'http://localhost:3000';
  
  try {
    // Launch a browser to check if the app is running
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Try to navigate to the application
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Check if the page loaded successfully
    const title = await page.title();
    
    // Perform any additional setup tasks
    await setupTestEnvironment(page);
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function setupTestEnvironment(page: any) {
  // Add any environment-specific setup here
  
  // Example: Clear any existing test data
  // Example: Seed test data
  // Example: Set up authentication tokens
  
  // Check if critical features are available
  await page.evaluate(() => {
    // Check for critical globals or features
    if (typeof window !== 'undefined') {
    }
  });
  
}

export default globalSetup; 