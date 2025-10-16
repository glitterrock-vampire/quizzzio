// ============================================
// Playwright Demo User Test - Using Existing Chrome Browser
// ============================================

import { chromium } from 'playwright';

async function captureDemoUserData() {
  console.log('🚀 Starting Playwright automation with existing Chrome...\n');

  // Connect to existing Chrome instance instead of launching new one
  const browser = await chromium.connectOverCDP('http://localhost:9222');

  // Get the first available page (existing tab)
  const pages = browser.contexts()[0]?.pages() || [];
  if (pages.length === 0) {
    console.log('❌ No existing Chrome tabs found. Please open a Chrome tab first.');
    await browser.close();
    return;
  }

  const existingPage = pages[0];
  console.log('✅ Connected to existing Chrome tab');

  // ============================================
  // PRODUCTION SITE
  // ============================================
  console.log('📍 Testing Production Site: https://quizzzio.onrender.com');

  try {
    // Navigate to production site in existing tab
    await existingPage.goto('https://quizzzio.onrender.com');

    // Wait for login form to load
    await existingPage.waitForSelector('input[type="email"], input[type="text"], [data-testid="email-input"]', { timeout: 15000 });

    // Fill in demo credentials
    await existingPage.fill('input[type="email"], input[type="text"], [data-testid="email-input"]', 'demo@quizmaster.com');
    await existingPage.fill('input[type="password"], [data-testid="password-input"]', 'demo123');

    // Submit login
    await existingPage.click('button[type="submit"], input[type="submit"], [data-testid="login-button"]');

    // Wait for dashboard/profile to load
    await existingPage.waitForLoadState('networkidle', { timeout: 15000 });

    console.log('✅ Production Login: SUCCESS');
    console.log('📊 Production Demo User Data:');
    console.log('   - URL:', existingPage.url());
    console.log('   - Title:', await existingPage.title());

    // Try to capture user stats (adjust selectors based on your UI)
    const userStats = await existingPage.evaluate(() => {
      // Look for common UI patterns
      const statsElements = document.querySelectorAll('.user-stats, .profile-info, .dashboard-stats, .user-profile, [data-testid="user-stats"]');
      return Array.from(statsElements).map(el => el.textContent?.trim()).filter(Boolean);
    });

    if (userStats.length > 0) {
      console.log('   - Stats:', userStats.join(', '));
    } else {
      console.log('   - Stats: Unable to capture (check UI selectors)');
    }

  } catch (error) {
    console.log('❌ Production Login: FAILED');
    console.log('   Error:', error.message);
  }

  // ============================================
  // LOCALHOST SITE (New Tab)
  // ============================================
  console.log('\n📍 Testing Localhost: http://localhost:5175');

  try {
    // Open new tab for localhost
    const localContext = await browser.newContext();
    const localPage = await localContext.newPage();

    // Navigate to login page first
    await localPage.goto('http://localhost:5175/login');

    // Wait for login form to load
    await localPage.waitForSelector('input[type="email"], input[type="text"], #email-address', { timeout: 15000 });

    // Fill in demo credentials
    await localPage.fill('#email-address', 'demo@quizmaster.com');
    await localPage.fill('#password', 'demo123');

    // Submit login
    await localPage.click('button[type="submit"]');

    // Wait for dashboard/profile to load
    await localPage.waitForLoadState('networkidle', { timeout: 15000 });

    console.log('✅ Localhost Login: SUCCESS');
    console.log('📊 Localhost Demo User Data:');
    console.log('   - URL:', localPage.url());
    console.log('   - Title:', await localPage.title());

    // Try to capture user stats (adjust selectors based on your UI)
    const userStats = await localPage.evaluate(() => {
      // Look for common UI patterns
      const statsElements = document.querySelectorAll('.user-stats, .profile-info, .dashboard-stats, .user-profile, [data-testid="user-stats"]');
      return Array.from(statsElements).map(el => el.textContent?.trim()).filter(Boolean);
    });

    if (userStats.length > 0) {
      console.log('   - Stats:', userStats.join(', '));
    } else {
      console.log('   - Stats: Unable to capture (check UI selectors)');
    }

  } catch (error) {
    console.log('❌ Localhost Login: FAILED');
    console.log('   Error:', error.message);
  }

  // ============================================
  // COMPARISON
  // ============================================
  console.log('\n🔍 Data Comparison:');
  console.log('   - Both environments should show the same demo user data');
  console.log('   - Check for differences in question counts, user stats, etc.');

  // Close browser connection (don't close the actual Chrome)
  await browser.close();
  console.log('\n✅ Automation completed!');
}

// ============================================
// SETUP INSTRUCTIONS:
// ============================================
//
// 1. Open Chrome and go to: chrome://inspect
// 2. Click "Open dedicated DevTools for Node"
// 3. Note the WebSocket URL (looks like: ws://localhost:9222/...)
// 4. Run this script: node demo-user-test-existing-browser.js
//
// OR use this command to start Chrome with remote debugging:
//    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
//

// Run the automation
captureDemoUserData().catch(console.error);
