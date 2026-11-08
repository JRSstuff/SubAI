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

  const mobileDir = path.resolve(__dirname, '..', 'presentation_screenshots', 'mobile');
  const artifactMobileDir = 'C:\\Users\\BeboyPC\\.gemini\\antigravity\\brain\\7fd7c8c5-66d2-4866-b1a3-baad6f2c4e71\\mobile';

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

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

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);

  // Clean out PWA banners immediately
  await page.evaluate(() => {
    document.querySelectorAll('[data-pwa-banner], .pwa-install-banner').forEach((el) => el.remove());
  });

  // Focus and type admin credentials into the login inputs to make it look great
  try {
    const emailInput = await page.$('input[name="email"], input[type="text"], input[placeholder*="email" i], input[placeholder*="username" i]');
    if (emailInput) {
      await emailInput.type('admin', { delay: 50 });
    }
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type('subai123', { delay: 50 });
    }
  } catch (err) {
    console.log('Optional input typing skipped:', err.message);
  }

  await wait(1000);

  const outMobilePath = path.join(mobileDir, '01b_portal_login.png');
  await page.screenshot({ path: outMobilePath });
  console.log('Saved corrected mobile login screenshot:', outMobilePath);

  // Also copy to artifact dir
  if (fs.existsSync(artifactMobileDir)) {
    fs.copyFileSync(outMobilePath, path.join(artifactMobileDir, '01b_portal_login.png'));
    console.log('Copied to artifact directory:', path.join(artifactMobileDir, '01b_portal_login.png'));
  }

  // Also ensure 01_landing_home.png is refreshed
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  const outHomePath = path.join(mobileDir, '01_landing_home.png');
  await page.screenshot({ path: outHomePath });
  if (fs.existsSync(artifactMobileDir)) {
    fs.copyFileSync(outHomePath, path.join(artifactMobileDir, '01_landing_home.png'));
  }

  await browser.close();
  console.log('Login screenshots fixed and updated successfully!');
}

run().catch((err) => {
  console.error('Error running capture:', err);
  process.exit(1);
});
