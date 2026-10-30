const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\156.0.4314.50\\msedge.exe';
const baseOutputDir = path.resolve(__dirname, '..', 'presentation_screenshots');
const desktopDir = path.join(baseOutputDir, 'desktop');
const mobileDir = path.join(baseOutputDir, 'mobile');

[desktopDir, mobileDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const screens = [
  {
    url: 'http://localhost:3000',
    filename: '01_landing_home.png',
    title: 'Slide 1: Home Landing Page',
  },
  {
    url: 'http://localhost:3000/report',
    filename: '02_report_citizen.png',
    title: 'Slide 2: Step 1 - Citizen Obstruction Report',
  },
  {
    url: 'http://localhost:3000/map',
    filename: '03_gis_map.png',
    title: 'Slide 3: Interactive GIS Drainage & Hotspot Map',
    actions: async (p) => {
      await wait(1800); // Wait for map tiles and markers to render
    },
  },
  {
    url: 'http://localhost:3000/dashboard',
    filename: '04_operations_dashboard.png',
    title: 'Slide 4: Operations & Material Recovery Dashboard',
  },
  // --- REVIEW QUEUE FILTERS ---
  {
    url: 'http://localhost:3000/review',
    filename: '05_review_queue_submitted.png',
    title: 'Slide 5A: Review Queue (Submitted Tab)',
    actions: async (p) => {
      const buttons = await p.$$('button');
      for (const btn of buttons) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && text.includes('Submitted')) {
          await btn.click();
          break;
        }
      }
    },
  },
  {
    url: 'http://localhost:3000/review',
    filename: '05b_review_queue_verified.png',
    title: 'Slide 5B: Review Queue (Verified Tab)',
    actions: async (p) => {
      const buttons = await p.$$('button');
      for (const btn of buttons) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && text.includes('Verified')) {
          await btn.click();
          break;
        }
      }
    },
  },
  {
    url: 'http://localhost:3000/review',
    filename: '06_review_triage_modal.png',
    title: 'Slide 6: Step 2 & 3 - Priority Matrix & Dispatch Modal',
    actions: async (p) => {
      const triageButtons = await p.$$('button');
      for (const btn of triageButtons) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && text.includes('Triage')) {
          await btn.click();
          break;
        }
      }
    },
  },
  {
    url: 'http://localhost:3000/review',
    filename: '07_review_handovers_step6.png',
    title: 'Slide 7: Step 6 - Recycler Handover Confirmation & Balance Custody',
    actions: async (p) => {
      const buttons = await p.$$('button');
      for (const btn of buttons) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && text.includes('Handovers')) {
          await btn.click();
          break;
        }
      }
    },
  },
  // --- TASKS FILTERS ---
  {
    url: 'http://localhost:3000/tasks',
    filename: '08_collector_tasks_active.png',
    title: 'Slide 8A: Field Collector Task Board (Active Tasks)',
  },
  {
    url: 'http://localhost:3000/tasks',
    filename: '08b_collector_tasks_completed.png',
    title: 'Slide 8B: Field Collector Task Board (Completed Tasks)',
    actions: async (p) => {
      const buttons = await p.$$('button');
      for (const btn of buttons) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && text.includes('Completed')) {
          await btn.click();
          break;
        }
      }
    },
  },
  {
    url: 'http://localhost:3000/tasks',
    filename: '09_collector_weigh_modal.png',
    title: 'Slide 9: Step 4 - Material Category Batch Weighing & Clearance',
    actions: async (p) => {
      const buttons = await p.$$('button');
      for (const btn of buttons) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && (text.includes('Weigh & Evidence') || text.includes('Weigh'))) {
          await btn.click();
          break;
        }
      }
    },
  },
  {
    url: 'http://localhost:3000/tasks',
    filename: '10_collector_handover_modal.png',
    title: 'Slide 10: Step 5 - Recipient Handover & Remaining Balance',
    actions: async (p) => {
      // First switch to Completed tasks tab to show Hand Over button
      const buttons = await p.$$('button');
      for (const btn of buttons) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && text.includes('Completed')) {
          await btn.click();
          await wait(800);
          break;
        }
      }
      // Click Hand Over button on completed card
      const allBtns = await p.$$('button');
      for (const btn of allBtns) {
        const text = await p.evaluate((el) => el.innerText, btn);
        if (text && text.includes('Hand Over')) {
          await btn.click();
          break;
        }
      }
    },
  },
  {
    url: 'http://localhost:3000/rain-bank',
    filename: '11_rain_bank.png',
    title: 'Slide 11: Rain Bank & Stormwater Harvesting',
  },
  {
    url: 'http://localhost:3000/admin',
    filename: '12_admin_roles.png',
    title: 'Slide 12: Admin Security & Role-Based Access',
  },
];

async function captureViewport(browser, mode, viewportConfig, targetDir) {
  console.log(`\n========================================`);
  console.log(`Capturing in [${mode.toUpperCase()}] mode (${viewportConfig.width}x${viewportConfig.height})`);
  console.log(`Output folder: ${targetDir}`);
  console.log(`========================================`);

  const page = await browser.newPage();
  await page.setViewport(viewportConfig);

  // Permanently suppress PWA popup on every page navigation
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('subai_pwa_dismissed_at', '9999999999999');
    localStorage.setItem('subai_pwa_suppress', 'true');
  });

  for (const item of screens) {
    console.log(`[${mode}] Capturing: ${item.title} -> ${item.filename}`);
    try {
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 25000 });

      // Clean out PWA banners immediately
      await page.evaluate(() => {
        document.querySelectorAll('[data-pwa-banner], .pwa-install-banner').forEach((el) => el.remove());
      });

      await wait(1400);

      if (item.actions) {
        await item.actions(page);
        await wait(1000);
      }

      // Check and remove any PWA prompt that might have appeared after wait
      await page.evaluate(() => {
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

      const outPath = path.join(targetDir, item.filename);
      await page.screenshot({ path: outPath });
      console.log(`  -> Saved: ${outPath}`);
    } catch (err) {
      console.error(`  -> Failed [${item.filename}]:`, err.message);
    }
  }

  await page.close();
}

async function run() {
  console.log('Starting Capture with Populated Presentation Demo Data...');

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. DESKTOP VIEWPORT: 1440 x 900 (High DPI 2x)
  await captureViewport(
    browser,
    'desktop',
    {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
    desktopDir
  );

  // 2. MOBILE VIEWPORT: 412 x 915 (Google Pixel / Samsung Galaxy, High DPI 2x)
  await captureViewport(
    browser,
    'mobile',
    {
      width: 412,
      height: 915,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
    mobileDir
  );

  await browser.close();
  console.log('\nAll Populated Screenshots Captured Successfully!');
}

run().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
