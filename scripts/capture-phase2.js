const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mxdaf\\.gemini\\antigravity\\brain\\a49c5adb-8541-4ef0-acac-384e241e1b8f';

const ROUTES_TO_CAPTURE = [
  { name: 'platform', path: '/platform' },
  { name: 'how_it_works', path: '/how-it-works' },
  { name: 'about', path: '/about' },
  { name: 'security_privacy', path: '/security-privacy' },
  { name: 'contact', path: '/contact' },
  { name: 'auth_signin', path: '/auth/signin' },
  { name: 'auth_signup', path: '/auth/signup' },
  { name: 'auth_mfa', path: '/auth/mfa' },
  { name: 'auth_pending', path: '/auth/pending-approval' },
];

async function capturePhase2() {
  console.log('Capturing Phase 2 screenshots...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  // Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  for (const r of ROUTES_TO_CAPTURE) {
    await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle0' });
    const ssPath = path.join(ARTIFACT_DIR, `phase2_desktop_${r.name}.png`);
    await page.screenshot({ path: ssPath });
    console.log(`Saved desktop: ${r.name}`);
  }

  // Mobile (390x844)
  await page.setViewport({ width: 390, height: 844 });
  for (const r of ['platform', 'auth_signin', 'auth_signup', 'contact']) {
    await page.goto(`http://localhost:3000/${r.replace('_', '/')}`, { waitUntil: 'networkidle0' });
    const ssPath = path.join(ARTIFACT_DIR, `phase2_mobile_${r}.png`);
    await page.screenshot({ path: ssPath });
    console.log(`Saved mobile: ${r}`);
  }

  await browser.close();
  console.log('All Phase 2 screenshots captured.');
}

capturePhase2().catch(console.error);
