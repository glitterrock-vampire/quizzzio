// ============================================
// Playwright Demo User Data Capture Script
// ============================================

import { chromium } from 'playwright';

async function captureDemoUserData() {
  console.log('🚀 Starting Playwright automation...\n');

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // ============================================
  // PRODUCTION SITE
  // ============================================
  console.log('📍 Testing Production Site: https://quizzzio.onrender.com');

  const prodPage = await context.newPage();
  await prodPage.goto('https://quizzzio.onrender.com');

  try {
    // Wait for login form to load
    await prodPage.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });

    // Fill in demo credentials
    await prodPage.fill('input[type="email"], input[type="text"]', 'demo@quizmaster.com');
    await prodPage.fill('input[type="password"]', 'demo123');

    // Submit login
    await prodPage.click('button[type="submit"], input[type="submit"]');

    // Wait for dashboard/profile to load
    await prodPage.waitForLoadState('networkidle', { timeout: 10000 });

    console.log('✅ Production Login: SUCCESS');
    console.log('📊 Production Demo User Data:');
    console.log('   - URL:', prodPage.url());
    console.log('   - Title:', await prodPage.title());

    // Try to capture user stats (adjust selectors based on your UI)
    const userStats = await prodPage.evaluate(() => {
      // This will depend on your actual UI structure
      const statsElements = document.querySelectorAll('.user-stats, .profile-info, .dashboard-stats');
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
  // LOCALHOST SITE
  // ============================================
  console.log('\n📍 Testing Localhost: http://localhost:3000');

  const localPage = await context.newPage();
  await localPage.goto('http://localhost:3000');

  try {
    // Wait for login form to load
    await localPage.waitForSelector('input[type="email"], input[type="text"]', { timeout: 10000 });

    // Fill in demo credentials
    await localPage.fill('input[type="email"], input[type="text"]', 'demo@quizmaster.com');
    await localPage.fill('input[type="password"]', 'demo123');

    // Submit login
    await localPage.click('button[type="submit"], input[type="submit"]');

    // Wait for dashboard/profile to load
    await localPage.waitForLoadState('networkidle', { timeout: 10000 });

    console.log('✅ Localhost Login: SUCCESS');
    console.log('📊 Localhost Demo User Data:');
    console.log('   - URL:', localPage.url());
    console.log('   - Title:', await localPage.title());

    // Try to capture user stats (adjust selectors based on your UI)
    const userStats = await localPage.evaluate(() => {
      // This will depend on your actual UI structure
      const statsElements = document.querySelectorAll('.user-stats, .profile-info, .dashboard-stats');
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

  // Close browser
  await browser.close();
  console.log('\n✅ Automation completed!');
}

// ============================================
// HOW TO USE:
// ============================================
//
// 1. Save this file as: demo-user-test.js
//
// 2. Make sure your local server is running:
//    npm run dev
//
// 3. Run the script:
//    node demo-user-test.js
//
// 4. The script will:
//    - Open browser (headless: false for visibility)
//    - Log into production site
//    - Log into localhost site
//    - Capture and compare demo user data
//

// Run the automation
captureDemoUserData().catch(console.error);
