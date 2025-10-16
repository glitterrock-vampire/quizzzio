// ============================================
// Login Form Inspector Script
// ============================================

import { chromium } from 'playwright';

async function inspectLoginForm() {
  console.log('🔍 Inspecting login form elements...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Check localhost first
    console.log('📍 Checking localhost: http://localhost:3000');
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Inspect login form elements
    const emailInputs = await page.locator('input[type="email"], input[type="text"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').count();

    console.log('📊 Localhost Login Form Elements:');
    console.log(`   - Email/Text inputs: ${emailInputs}`);
    console.log(`   - Password inputs: ${passwordInputs}`);
    console.log(`   - Submit buttons: ${submitButtons}`);

    // Get detailed information about these elements
    if (emailInputs > 0) {
      const emailElement = await page.locator('input[type="email"], input[type="text"]').first();
      console.log('   - Email input details:', await emailElement.evaluate(el => ({
        tagName: el.tagName,
        type: el.type,
        id: el.id,
        className: el.className,
        placeholder: el.placeholder,
        'data-testid': el.getAttribute('data-testid')
      })));
    }

    if (passwordInputs > 0) {
      const passwordElement = await page.locator('input[type="password"]').first();
      console.log('   - Password input details:', await passwordElement.evaluate(el => ({
        tagName: el.tagName,
        type: el.type,
        id: el.id,
        className: el.className,
        placeholder: el.placeholder,
        'data-testid': el.getAttribute('data-testid')
      })));
    }

    if (submitButtons > 0) {
      const submitElement = await page.locator('button[type="submit"], input[type="submit"]').first();
      console.log('   - Submit button details:', await submitElement.evaluate(el => ({
        tagName: el.tagName,
        type: el.type,
        id: el.id,
        className: el.className,
        textContent: el.textContent,
        'data-testid': el.getAttribute('data-testid')
      })));
    }

    // Also check for common login form patterns
    const formElements = await page.locator('form').count();
    console.log(`   - Forms found: ${formElements}`);

  } catch (error) {
    console.log('❌ Error inspecting localhost:', error.message);
  }

  await browser.close();
}

// Run the inspector
inspectLoginForm().catch(console.error);
