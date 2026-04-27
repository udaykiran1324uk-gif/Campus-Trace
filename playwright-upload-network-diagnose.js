const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const IMAGE_PATH = 'C:/Users/udayk/web projects/photo.JPG';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 40 });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.log(`[pageerror] ${err.message}`);
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('firebasestorage') || url.includes('googleapis')) {
      console.log(`[requestfailed] ${req.failure()?.errorText || 'unknown'} :: ${url}`);
    }
  });

  try {
    const stamp = Date.now();
    const email = `uploadnet${stamp}@campus.edu`;
    const username = `unet${stamp}`;
    const password = 'Test@12345';

    await page.goto(`${TARGET_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="name"]', 'Upload Net Diagnose');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', '9876543212');
    await page.fill('input[name="department"]', 'Computer Science');
    await page.fill('input[name="studentId"]', `CS${String(stamp).slice(-6)}`);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 20000 });

    await page.goto(`${TARGET_URL}/post`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[placeholder="e.g. Blue Nike Backpack"]', 'Network Diagnostic Upload');
    const selects = page.locator('select');
    await selects.nth(0).selectOption({ label: 'Documents' });
    await selects.nth(1).selectOption({ label: 'Main Library' });
    await page.fill('textarea', 'Network diagnostics for stuck upload.');
    await page.setInputFiles('input[type="file"]', IMAGE_PATH);
    await page.click('button:has-text("Share with Campus")');
    await page.waitForTimeout(25000);
    console.log('Completed 25s capture window.');
  } catch (error) {
    console.error(`Network diagnostic automation error: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
