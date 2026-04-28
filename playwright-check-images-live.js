const { chromium } = require('playwright');

const TARGET_URL = 'https://campus-trace-frontend.onrender.com/login';
const USERNAME = 'DATA';
const PASSWORD = 'Create@123';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.fill('input[placeholder="Email or Username"]', USERNAME);
    await page.fill('input[placeholder="••••••••"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 60000 });
    await page.waitForTimeout(5000);

    const imageReport = await page.evaluate(() => {
      const cardImages = Array.from(document.querySelectorAll('img'))
        .filter((img) => img.closest('.group') || img.closest('.rounded-3xl'))
        .map((img) => ({
          src: img.currentSrc || img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }));

      const broken = cardImages.filter((img) => !img.complete || img.naturalWidth === 0);
      return {
        total: cardImages.length,
        broken: broken.length,
        brokenSrcs: broken.map((b) => b.src).slice(0, 10),
        sampleLoadedSrcs: cardImages
          .filter((img) => img.complete && img.naturalWidth > 0)
          .map((img) => img.src)
          .slice(0, 10)
      };
    });

    console.log(`total_images=${imageReport.total}`);
    console.log(`broken_images=${imageReport.broken}`);
    console.log(`broken_srcs=${JSON.stringify(imageReport.brokenSrcs)}`);
    console.log(`loaded_srcs=${JSON.stringify(imageReport.sampleLoadedSrcs)}`);

    await page.screenshot({
      path: 'C:/Users/udayk/web projects/campus-trace-live-image-check.png',
      fullPage: true
    });
    console.log('screenshot=C:/Users/udayk/web projects/campus-trace-live-image-check.png');
  } catch (error) {
    console.error(`live_check_error=${error.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
