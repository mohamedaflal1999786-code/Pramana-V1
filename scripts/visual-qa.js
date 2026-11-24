const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'screenshots');
const ARTIFACT_DIR = 'C:\\Users\\mxdaf\\.gemini\\antigravity\\brain\\a49c5adb-8541-4ef0-acac-384e241e1b8f';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_1920', width: 1920, height: 1080 },
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'laptop_1366', width: 1366, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_390', width: 390, height: 844 },
  { name: 'mobile_360', width: 360, height: 780 },
];

async function runVisualQA() {
  console.log('🚀 Starting Chrome Visual QA via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  // Test Computed Styles comparison at 1440x900
  await page.setViewport({ width: 1440, height: 900 });

  console.log('\n--- Comparing Computed Styles (1440x900) ---');
  await page.goto('http://localhost:3000/original.html', { waitUntil: 'networkidle0' });
  const originalStyles = await getStyles(page);

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  const nextjsStyles = await getStyles(page);

  const styleKeys = Object.keys(originalStyles);
  let differencesFound = 0;
  for (const key of styleKeys) {
    const orig = originalStyles[key];
    const curr = nextjsStyles[key];
    if (JSON.stringify(orig) !== JSON.stringify(curr)) {
      differencesFound++;
      console.log(`⚠️ Difference in [${key}]:`);
      for (const prop of Object.keys(orig)) {
        if (orig[prop] !== curr[prop]) {
          console.log(`   ${prop}: Original="${orig[prop]}" vs NextJS="${curr[prop]}"`);
        }
      }
    } else {
      console.log(`✅ [${key}] matches perfectly.`);
    }
  }

  if (differencesFound === 0) {
    console.log('🎉 ALL inspected computed styles match 100%!');
  }

  // Capture screenshots across viewports
  console.log('\n--- Capturing Viewport Screenshots ---');
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });

    // Original
    await page.goto('http://localhost:3000/original.html', { waitUntil: 'networkidle0' });
    const origVpPath = path.join(SCREENSHOT_DIR, `original_${vp.name}.png`);
    const origFull = path.join(SCREENSHOT_DIR, `original_${vp.name}_full.png`);
    await page.screenshot({ path: origVpPath });
    await page.screenshot({ path: origFull, fullPage: true });

    // Next.js
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const nextVpPath = path.join(SCREENSHOT_DIR, `nextjs_${vp.name}.png`);
    const nextFull = path.join(SCREENSHOT_DIR, `nextjs_${vp.name}_full.png`);
    await page.screenshot({ path: nextVpPath });
    await page.screenshot({ path: nextFull, fullPage: true });

    console.log(`📸 Captured: ${vp.name} (viewport & fullpage)`);

    // For mobile 390, test menu interaction
    if (vp.name === 'mobile_390') {
      // Test original menu open
      await page.goto('http://localhost:3000/original.html', { waitUntil: 'networkidle0' });
      await page.click('.menu');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `original_mobile_menu_open.png`) });

      // Test nextjs menu open
      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
      await page.click('.menu');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `nextjs_mobile_menu_open.png`) });
      console.log(`📸 Captured: mobile_390 menu open interaction`);
    }
  }

  // Copy key screenshots to artifact directory for embedding in response
  if (fs.existsSync(ARTIFACT_DIR)) {
    const files = fs.readdirSync(SCREENSHOT_DIR);
    for (const f of files) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, f), path.join(ARTIFACT_DIR, f));
    }
    console.log(`📁 Synced ${files.length} screenshots to artifact directory.`);
  }

  await browser.close();
  console.log('\n✨ Visual QA execution completed successfully.');
}

async function getStyles(page) {
  return await page.evaluate(() => {
    function pick(el, props) {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      const res = {};
      props.forEach(p => res[p] = cs.getPropertyValue(p));
      return res;
    }

    return {
      body: pick(document.body, ['font-family', 'font-size', 'line-height', 'color', 'background-color']),
      header: pick(document.querySelector('header'), ['position', 'background-color', 'backdrop-filter', 'border-bottom-width', 'border-bottom-color']),
      nav: pick(document.querySelector('nav'), ['min-height', 'display', 'justify-content', 'align-items', 'gap']),
      brand: pick(document.querySelector('.brand'), ['font-size', 'font-weight', 'letter-spacing', 'display', 'align-items', 'gap']),
      btn: pick(document.querySelector('.btn'), ['display', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-radius', 'background-color', 'color', 'font-weight']),
      hero: pick(document.querySelector('.hero'), ['display', 'grid-template-columns', 'gap', 'padding-top', 'padding-bottom']),
      eyebrow: pick(document.querySelector('.eyebrow'), ['font-size', 'letter-spacing', 'text-transform', 'font-weight', 'color']),
      h1: pick(document.querySelector('h1'), ['font-size', 'line-height', 'letter-spacing', 'margin-top', 'margin-bottom', 'font-weight']),
      h1_em: pick(document.querySelector('h1 em'), ['font-family', 'font-weight', 'font-style', 'color']),
      lead: pick(document.querySelector('.lead'), ['font-size', 'color', 'max-width']),
      actions: pick(document.querySelector('.actions'), ['display', 'gap', 'margin-top']),
      art: pick(document.querySelector('.art'), ['background-color', 'border-radius', 'aspect-ratio']),
      strip: pick(document.querySelector('.strip'), ['border-top-width', 'border-bottom-width', 'padding-top', 'padding-bottom']),
      section: pick(document.querySelector('.section'), ['padding-top', 'padding-bottom', 'scroll-margin-top']),
      section_h2: pick(document.querySelector('.section h2'), ['font-size', 'line-height', 'letter-spacing', 'font-weight', 'margin-top', 'margin-bottom']),
      features: pick(document.querySelector('.features'), ['display', 'grid-template-columns', 'gap', 'margin-top']),
      tile_big: pick(document.querySelector('.tile.big'), ['background-color', 'border-radius', 'padding-top', 'padding-right']),
      workflow: pick(document.querySelector('#workflow'), ['background-color', 'color']),
      workflow_steps: pick(document.querySelector('.steps'), ['display', 'grid-template-columns', 'gap', 'margin-top']),
      split: pick(document.querySelector('.split'), ['display', 'grid-template-columns', 'gap', 'align-items']),
      rule: pick(document.querySelector('.rule'), ['padding-top', 'padding-bottom', 'border-bottom-width']),
      details: pick(document.querySelector('details'), ['padding-top', 'padding-bottom', 'border-bottom-width']),
      summary: pick(document.querySelector('summary'), ['cursor', 'font-weight']),
      footer: pick(document.querySelector('footer'), ['border-top-width', 'padding-top', 'padding-bottom', 'font-size', 'color']),
    };
  });
}

runVisualQA().catch(err => {
  console.error('Error running Visual QA:', err);
  process.exit(1);
});
