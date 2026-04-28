const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const targetUrl = 'https://campus-trace-frontend.onrender.com';
  
  console.log('Visiting ' + targetUrl);
  
  const failedRequests = [];
  page.on('requestfailed', request => {
    if (request.resourceType() === 'image') {
      failedRequests.push({ url: request.url(), error: request.failure().errorText });
    }
  });

  page.on('response', response => {
    if (response.request().resourceType() === 'image' && !response.ok()) {
      failedRequests.push({ url: response.url(), status: response.status() });
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Check for images in the DOM
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        isVisible: img.offsetParent !== null
      }));
    });
    
    console.log('--- Page Image Status ---');
    console.log('URL: ' + targetUrl);
    console.log('Title: ' + await page.title());
    console.log('Images found in DOM: ' + images.length);
    images.forEach((img, i) => {
      console.log(`Img ${i}: ${img.src} | Visible: ${img.isVisible} | Loaded: ${img.complete && img.naturalWidth > 0}`);
    });

    if (failedRequests.length > 0) {
      console.log('\n--- Failed Image Requests ---');
      console.log(JSON.stringify(failedRequests, null, 2));
    } else {
      console.log('\nNo failed image requests detected.');
    }

    // Take a screenshot to visually confirm
    const screenshotPath = 'C:/Users/udayk/AppData/Local/Temp/zencoder/playwright_final_check.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('\nScreenshot saved to ' + screenshotPath);

  } catch (e) {
    console.error('Error during check: ' + e.message);
  }
  
  await browser.close();
})();
