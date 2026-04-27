const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const IMAGE_PATH = 'C:/Users/udayk/web projects/photo.JPG';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage();

  try {
    const stamp = Date.now();
    const email = `uploadtest${stamp}@campus.edu`;
    const username = `upload${stamp}`;
    const password = 'Test@12345';

    await page.goto(`${TARGET_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="name"]', 'Upload Tester');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="department"]', 'Computer Science');
    await page.fill('input[name="studentId"]', `CS${String(stamp).slice(-6)}`);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 20000 });
    console.log(`Signed up and logged in: ${email}`);

    await page.goto(`${TARGET_URL}/post`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[placeholder="e.g. Blue Nike Backpack"]', 'Test Lost ID Card');

    const selects = page.locator('select');
    await selects.nth(0).selectOption({ label: 'Documents' });
    await selects.nth(1).selectOption({ label: 'Main Library' });

    await page.fill('textarea', 'Testing upload with provided photo image.');
    await page.setInputFiles('input[type="file"]', IMAGE_PATH);

    await page.waitForSelector('button:has-text("Share with Campus")');
    await page.click('button:has-text("Share with Campus")');

    const result = await Promise.race([
      page.waitForSelector('text=Post Published!', { timeout: 45000 }).then(() => 'success'),
      page.waitForSelector('text=Upload failed', { timeout: 45000 }).then(() => 'upload_failed'),
      page.waitForSelector('text=Upload stalled', { timeout: 45000 }).then(() => 'upload_stalled'),
      page.waitForSelector('text=Permission denied', { timeout: 45000 }).then(() => 'permission_denied'),
      page.waitForSelector('text=Image saved, but post failed', { timeout: 45000 }).then(() => 'db_failed')
    ]);

    console.log(`Upload test result: ${result}`);
    await page.screenshot({
      path: 'C:/Users/udayk/web projects/upload-test-result.png',
      fullPage: true
    });
    console.log('Screenshot saved to C:/Users/udayk/web projects/upload-test-result.png');
  } catch (error) {
    console.error(`Automation error: ${error.message}`);
    await page.screenshot({
      path: 'C:/Users/udayk/web projects/upload-test-error.png',
      fullPage: true
    });
    console.log('Error screenshot saved to C:/Users/udayk/web projects/upload-test-error.png');
  } finally {
    await browser.close();
  }
})();
