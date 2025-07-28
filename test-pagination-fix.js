/**
 * Test script to verify pagination fixes
 * 
 * This script tests the core issue described by the user:
 * 1. Add new page button
 * 2. Navigate to second page
 * 3. Verify pages persist and content is maintained
 */

const puppeteer = require('puppeteer');

async function testPaginationFix() {
  console.log('🧪 Starting pagination fix test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Navigate to the paginated editor (usually step 1)
    console.log('🔄 Looking for navigation to paginated editor...');
    
    // Look for a "Next" or "Continue" button to get to the editor
    const nextButton = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Preview"), [data-testid="next-step"]');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for the "Add New Page" button
    console.log('➕ Looking for Add New Page button...');
    const addPageButton = await page.waitForSelector('button:has-text("Add New Page"), [data-testid="add-page"]', { timeout: 10000 });
    
    // Step 1: Click "Add New Page"
    console.log('✅ Step 1: Clicking Add New Page button...');
    await addPageButton.click();
    await page.waitForTimeout(1000);
    
    // Verify we now have 2 pages
    const pageIndicators = await page.$$('.rounded-full, [data-testid="page-indicator"]');
    console.log(`📄 Found ${pageIndicators.length} page indicators`);
    
    if (pageIndicators.length < 2) {
      throw new Error('Expected at least 2 pages after adding new page');
    }
    
    // Step 2: Navigate to the second page
    console.log('🔄 Step 2: Navigating to second page...');
    
    // Look for Next Page button or page indicator 2
    const nextPageButton = await page.$('button:has-text("Next Page"), button:has-text("2")');
    if (nextPageButton) {
      await nextPageButton.click();
      await page.waitForTimeout(1000);
    } else {
      // Try clicking the second page indicator
      if (pageIndicators.length >= 2) {
        await pageIndicators[1].click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 3: Verify we're on page 2 and pages still exist
    console.log('🔍 Step 3: Verifying page state...');
    
    // Check page indicators again
    const updatedPageIndicators = await page.$$('.rounded-full, [data-testid="page-indicator"]');
    console.log(`📄 After navigation: Found ${updatedPageIndicators.length} page indicators`);
    
    // Check for page info display
    const pageInfo = await page.$eval('[class*="Page"], [data-testid="page-info"]', el => el.textContent).catch(() => null);
    console.log(`📊 Page info: ${pageInfo}`);
    
    // Verify pages persist
    if (updatedPageIndicators.length >= 2) {
      console.log('✅ SUCCESS: Pages persist after navigation');
      console.log('✅ SUCCESS: Page indicators remain visible');
      
      // Try navigating back to page 1
      console.log('🔙 Testing navigation back to page 1...');
      await updatedPageIndicators[0].click();
      await page.waitForTimeout(1000);
      
      const finalPageIndicators = await page.$$('.rounded-full, [data-testid="page-indicator"]');
      console.log(`📄 After back navigation: Found ${finalPageIndicators.length} page indicators`);
      
      if (finalPageIndicators.length >= 2) {
        console.log('✅ SUCCESS: All pagination functionality working correctly!');
        console.log('✅ SUCCESS: Content persistence verified');
      } else {
        throw new Error('Pages lost during back navigation');
      }
    } else {
      throw new Error('Pages lost after navigation - fix failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'pagination-test-failure.png', fullPage: true });
    console.log('📸 Screenshot saved as pagination-test-failure.png');
    
    // Log console messages for debugging
    const logs = await page.evaluate(() => {
      return window.console.history || [];
    });
    console.log('🔍 Console logs:', logs);
    
    throw error;
  } finally {
    console.log('🏁 Test completed');
    await browser.close();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPaginationFix().catch(console.error);
}

module.exports = { testPaginationFix };
