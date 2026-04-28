const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const targetUrl = 'https://campus-trace-frontend.onrender.com';
  
  console.log('Visiting ' + targetUrl);
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Take a screenshot
    const screenshotPath = 'C:/Users/udayk/AppData/Local/Temp/zencoder/playwright_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to ' + screenshotPath);

    // Check for images
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth
      }));
    });
    
    console.log('Images found count: ' + images.length);
    images.forEach((img, i) => {
      console.log('Image ' + i + ': ' + img.src + ' | Complete: ' + img.complete + ' | NaturalWidth: ' + img.naturalWidth);
    });
  } catch (e) {
    console.error('Error: ' + e.message);
  }
  
  await browser.close();
})();
