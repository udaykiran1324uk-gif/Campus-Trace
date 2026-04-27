const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const IMAGE_PATH = 'C:/Users/udayk/web projects/photo.JPG';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const stamp = Date.now();
    const email = `uploaddiag${stamp}@campus.edu`;
    const username = `udiag${stamp}`;
    const password = 'Test@12345';

    await page.goto(`${TARGET_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="name"]', 'Upload Diagnose');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', '9876543211');
    await page.fill('input[name="department"]', 'Computer Science');
    await page.fill('input[name="studentId"]', `CS${String(stamp).slice(-6)}`);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 20000 });

    await page.goto(`${TARGET_URL}/post`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[placeholder="e.g. Blue Nike Backpack"]', 'Diagnostic Upload Test');
    const selects = page.locator('select');
    await selects.nth(0).selectOption({ label: 'Documents' });
    await selects.nth(1).selectOption({ label: 'Main Library' });
    await page.fill('textarea', 'Diagnostic run for stuck upload.');
    await page.setInputFiles('input[type="file"]', IMAGE_PATH);
    await page.click('button:has-text("Share with Campus")');

    await page.waitForTimeout(30000);

    const buttonText = (await page.locator('button[type="submit"]').innerText()).trim();
    const errLoc = page.locator('div:has-text("Upload")');
    let visibleError = '';
    if (await errLoc.first().isVisible().catch(() => false)) {
      visibleError = (await errLoc.first().innerText()).trim();
    }

    console.log(`Button text after 30s: ${buttonText}`);
    if (visibleError) console.log(`Visible message: ${visibleError}`);
    await page.screenshot({ path: 'C:/Users/udayk/web projects/upload-diagnose.png', fullPage: true });
    console.log('Screenshot saved to C:/Users/udayk/web projects/upload-diagnose.png');
  } catch (error) {
    console.error(`Diagnostic automation error: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
