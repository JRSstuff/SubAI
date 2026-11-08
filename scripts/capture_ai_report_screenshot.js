const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

function findEdgeExecutable() {
  const edgeCoreDir = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore';
  if (fs.existsSync(edgeCoreDir)) {
    const subdirs = fs.readdirSync(edgeCoreDir);
    for (const subdir of subdirs) {
      const exePath = path.join(edgeCoreDir, subdir, 'msedge.exe');
      if (fs.existsSync(exePath)) return exePath;
    }
  }
  const standardEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(standardEdge)) return standardEdge;
  return null;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const edgePath = findEdgeExecutable();
  console.log('Using browser executable:', edgePath);
  if (!edgePath) {
    throw new Error('Edge executable not found');
  }

  const mobileDir = path.resolve(__dirname, '..', 'presentation_screenshots', 'mobile');
  const desktopDir = path.resolve(__dirname, '..', 'presentation_screenshots', 'desktop');
  if (!fs.existsSync(mobileDir)) fs.mkdirSync(mobileDir, { recursive: true });
  if (!fs.existsSync(desktopDir)) fs.mkdirSync(desktopDir, { recursive: true });

  const testImagePath = path.resolve(__dirname, '..', 'image test', 'images (3).jpg');
  console.log('Target test image:', testImagePath);

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Mobile Viewport: 412x915
  const page = await browser.newPage();
  await page.setViewport({
    width: 412,
    height: 915,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });

  // Suppress PWA
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('subai_pwa_dismissed_at', '9999999999999');
    localStorage.setItem('subai_pwa_suppress', 'true');
  });

  console.log('Navigating to http://localhost:3000/report ...');
  await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);

  // Remove PWA banners
  await page.evaluate(() => {
    document.querySelectorAll('[data-pwa-banner], .pwa-install-banner').forEach((el) => el.remove());
  });

  // Find file input
  console.log('Uploading test image to file input...');
  const fileInput = await page.$('input[type="file"]:not([capture])');
  if (!fileInput) {
    console.error('Could not find file input!');
  } else {
    await fileInput.uploadFile(testImagePath);
    console.log('Uploaded image, waiting for Gemini Vision analysis...');
    
    // Wait for the AI analysis card to appear or up to 10 seconds
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes('AI Vision Analysis') || document.body.innerText.includes('AI Scan Result') || document.body.innerText.includes('Detected Materials') || document.body.innerText.includes('Confidence') || document.body.innerText.includes('Culvert') || document.body.innerText.includes('Canal'),
        { timeout: 15000 }
      );
      console.log('AI Analysis card detected on page!');
    } catch (e) {
      console.log('Wait timeout or text not found, continuing after 6s wait...');
      await wait(6000);
    }
  }

  await wait(2000);

  const mobileScreenshotPath = path.join(mobileDir, '02b_report_ai_analysis.png');
  await page.screenshot({ path: mobileScreenshotPath });
  console.log('Saved mobile screenshot:', mobileScreenshotPath);

  // Also capture clean 02_report_citizen.png
  await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  await page.screenshot({ path: path.join(mobileDir, '02_report_citizen.png') });

  // Also capture clean 01_landing_home.png
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  await page.screenshot({ path: path.join(mobileDir, '01_landing_home.png') });

  // Also capture login screen
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  await page.screenshot({ path: path.join(mobileDir, '01b_portal_login.png') });

  await browser.close();
  console.log('Capture finished successfully!');
}

run().catch((err) => {
  console.error('Error running capture:', err);
  process.exit(1);
});
