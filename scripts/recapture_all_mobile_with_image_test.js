const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

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

async function main() {
  console.log('=== Step 1: Seeding Demo Data with Real [image test] Photos ===');
  execSync('node scripts/seed_demo_data.js', { stdio: 'inherit' });

  const edgePath = findEdgeExecutable();
  console.log('\n=== Step 2: Launching Browser ===', edgePath);

  const mobileDir = path.resolve(__dirname, '..', 'presentation_screenshots', 'mobile');
  const artifactMobileDir = 'C:\\Users\\BeboyPC\\.gemini\\antigravity\\brain\\7fd7c8c5-66d2-4866-b1a3-baad6f2c4e71\\mobile';
  [mobileDir, artifactMobileDir].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

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

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('subai_pwa_dismissed_at', '9999999999999');
    localStorage.setItem('subai_pwa_suppress', 'true');
  });

  const cleanPwa = async () => {
    await page.evaluate(() => {
      document.querySelectorAll('[data-pwa-banner], .pwa-install-banner').forEach((el) => el.remove());
      const prompts = document.querySelectorAll('*');
      for (const el of prompts) {
        if (el.textContent && el.textContent.includes('Install SubAI Application') && el.parentElement) {
          let container = el;
          while (container && !container.classList.contains('fixed')) {
            container = container.parentElement;
          }
          if (container) container.remove();
        }
      }
    });
  };

  const saveScreen = async (filename) => {
    const p1 = path.join(mobileDir, filename);
    const p2 = path.join(artifactMobileDir, filename);
    await page.screenshot({ path: p1 });
    fs.copyFileSync(p1, p2);
    console.log(`  [Saved] ${filename}`);
  };

  console.log('\n=== Step 3: Capturing Mobile Screenshots ===');

  // 1. Landing Home
  console.log('-> 01_landing_home.png');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1200);
  await cleanPwa();
  await saveScreen('01_landing_home.png');

  // 1b. Portal Login (with prefilled credentials)
  console.log('-> 01b_portal_login.png');
  try {
    const emailInput = await page.$('input[name="email"], input[type="text"], input[placeholder*="email" i], input[placeholder*="username" i]');
    if (emailInput) await emailInput.type('admin', { delay: 40 });
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) await passwordInput.type('subai123', { delay: 40 });
  } catch (e) {}
  await wait(600);
  await cleanPwa();
  await saveScreen('01b_portal_login.png');

  // 2. Report Citizen (Clean Form)
  console.log('-> 02_report_citizen.png');
  await page.goto('http://localhost:3000/report', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1200);
  await cleanPwa();
  await saveScreen('02_report_citizen.png');

  // 2b. Report with AI Vision Analysis (image test upload)
  console.log('-> 02b_report_ai_analysis.png (uploading image test/images (3).jpg)');
  const testImg = path.resolve(__dirname, '..', 'image test', 'images (3).jpg');
  const fileInput = await page.$('input[type="file"]:not([capture])');
  if (fileInput) {
    await fileInput.uploadFile(testImg);
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes('AI Vision Analysis') || document.body.innerText.includes('Culvert') || document.body.innerText.includes('PET'),
        { timeout: 15000 }
      );
    } catch (e) {
      await wait(5000);
    }
    await wait(1500);
    await cleanPwa();
    await saveScreen('02b_report_ai_analysis.png');
  }

  // 3. GIS Map
  console.log('-> 03_gis_map.png');
  await page.goto('http://localhost:3000/map', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2500); // allow leaflet tiles & pins to render
  await cleanPwa();
  await saveScreen('03_gis_map.png');

  // 4. Operations Dashboard
  console.log('-> 04_operations_dashboard.png');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1800);
  await cleanPwa();
  await saveScreen('04_operations_dashboard.png');

  // 5. Review Queue (Submitted Tab) - Uses real image test photos!
  console.log('-> 05_review_queue_submitted.png');
  await page.goto('http://localhost:3000/review', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  const reviewButtons = await page.$$('button');
  for (const btn of reviewButtons) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('Submitted')) {
      await btn.click();
      break;
    }
  }
  await wait(1200);
  await cleanPwa();
  await saveScreen('05_review_queue_submitted.png');

  // 5b. Review Queue (Verified Tab)
  console.log('-> 05b_review_queue_verified.png');
  const reviewButtons2 = await page.$$('button');
  for (const btn of reviewButtons2) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('Verified')) {
      await btn.click();
      break;
    }
  }
  await wait(1200);
  await cleanPwa();
  await saveScreen('05b_review_queue_verified.png');

  // 6. Review Triage Modal
  console.log('-> 06_review_triage_modal.png');
  // Click first triage button
  const triageBtns = await page.$$('button');
  for (const btn of triageBtns) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('Triage')) {
      await btn.click();
      break;
    }
  }
  await wait(1200);
  await cleanPwa();
  await saveScreen('06_review_triage_modal.png');

  // 7. Review Handovers (Step 6)
  console.log('-> 07_review_handovers_step6.png');
  await page.goto('http://localhost:3000/review', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  const hoBtns = await page.$$('button');
  for (const btn of hoBtns) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('Handovers')) {
      await btn.click();
      break;
    }
  }
  await wait(1200);
  await cleanPwa();
  await saveScreen('07_review_handovers_step6.png');

  // 8. Collector Tasks (Active)
  console.log('-> 08_collector_tasks_active.png');
  await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  await cleanPwa();
  await saveScreen('08_collector_tasks_active.png');

  // 8b. Collector Tasks (Completed)
  console.log('-> 08b_collector_tasks_completed.png');
  const taskTabBtns = await page.$$('button');
  for (const btn of taskTabBtns) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('Completed')) {
      await btn.click();
      break;
    }
  }
  await wait(1200);
  await cleanPwa();
  await saveScreen('08b_collector_tasks_completed.png');

  // 9. Collector Weigh Modal
  console.log('-> 09_collector_weigh_modal.png');
  await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  const weighBtns = await page.$$('button');
  for (const btn of weighBtns) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && (text.includes('Weigh & Evidence') || text.includes('Weigh'))) {
      await btn.click();
      break;
    }
  }
  await wait(1200);
  await cleanPwa();
  await saveScreen('09_collector_weigh_modal.png');

  // 10. Collector Handover Modal
  console.log('-> 10_collector_handover_modal.png');
  await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  const taskTabBtns2 = await page.$$('button');
  for (const btn of taskTabBtns2) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('Completed')) {
      await btn.click();
      break;
    }
  }
  await wait(1000);
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const text = await page.evaluate((el) => el.innerText, btn);
    if (text && text.includes('Hand Over')) {
      await btn.click();
      break;
    }
  }
  await wait(1200);
  await cleanPwa();
  await saveScreen('10_collector_handover_modal.png');

  // 11. Rain Bank
  console.log('-> 11_rain_bank.png');
  await page.goto('http://localhost:3000/rain-bank', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  await cleanPwa();
  await saveScreen('11_rain_bank.png');

  // 12. Admin Roles
  console.log('-> 12_admin_roles.png');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);
  await cleanPwa();
  await saveScreen('12_admin_roles.png');

  await browser.close();
  console.log('\nAll Mobile Screenshots Successfully Recaptured!');

  console.log('\n=== Step 4: Erasing All Operational Data from Database ===');
  execSync('node scripts/reset_database_for_demo.js', { stdio: 'inherit' });
  console.log('\nDatabase completely cleaned and ready for live demo!');
}

main().catch((err) => {
  console.error('Fatal error in recapture process:', err);
  process.exit(1);
});
