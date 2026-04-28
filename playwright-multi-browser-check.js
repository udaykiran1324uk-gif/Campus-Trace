const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const targetUrl = 'https://campus-trace-frontend.onrender.com';
  
  const testDevice = async (deviceName, deviceConfig) => {
    console.log(`Testing on ${deviceName}...`);
    const context = await browser.newContext(deviceConfig);
    const page = await context.newPage();
    
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({ url: request.url(), error: request.failure().errorText });
    });

    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
      const screenshotPath = `C:/Users/udayk/AppData/Local/Temp/zencoder/check_${deviceName.toLowerCase().replace(/\s+/g, '_')}.png`;
      await page.screenshot({ path: screenshotPath });
      console.log(`  - Screenshot saved: ${screenshotPath}`);
      console.log(`  - Title: ${await page.title()}`);
      
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => img.src);
      });
      console.log(`  - Images found: ${images.length}`);
      
      if (failedRequests.length > 0) {
        console.log(`  - ❌ Failed requests: ${failedRequests.length}`);
      } else {
        console.log(`  - ✅ All assets loaded successfully.`);
      }
    } catch (e) {
      console.log(`  - ❌ Error: ${e.message}`);
    }
    await context.close();
  };

  // 1. Desktop Chrome
  await testDevice('Desktop Chrome', { viewport: { width: 1280, height: 720 } });
  
  // 2. iPhone 13 (Mobile)
  await testDevice('iPhone 13', devices['iPhone 13']);

  await browser.close();
})();
