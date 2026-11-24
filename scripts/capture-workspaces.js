const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mxdaf\\.gemini\\antigravity\\brain\\a49c5adb-8541-4ef0-acac-384e241e1b8f';
const PUBLIC_SS = path.join(__dirname, '..', 'public', 'screenshots');

const WORKSPACE_ROUTES = [
  { name: 'ws_doctor', path: '/workspaces/doctor' },
  { name: 'ws_pharmacist', path: '/workspaces/pharmacist' },
  { name: 'ws_patient', path: '/workspaces/patient' },
  { name: 'ws_admin', path: '/workspaces/admin' },
  { name: 'ws_documents', path: '/workspaces/documents' },
  { name: 'ws_graph', path: '/workspaces/graph' },
  { name: 'ws_medications', path: '/workspaces/medications' },
  { name: 'ws_handoffs', path: '/workspaces/handoffs' },
  { name: 'ws_alerts', path: '/workspaces/alerts' },
  { name: 'ws_discharge', path: '/workspaces/discharge' },
  { name: 'ws_review', path: '/workspaces/review' },
];

async function captureWorkspaces() {
  console.log('Capturing workspace screenshots...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  // Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  for (const r of WORKSPACE_ROUTES) {
    await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle0' });
    const ssPath = path.join(ARTIFACT_DIR, `${r.name}_desktop.png`);
    await page.screenshot({ path: ssPath });
    if (fs.existsSync(PUBLIC_SS)) {
      fs.copyFileSync(ssPath, path.join(PUBLIC_SS, `${r.name}_desktop.png`));
    }
    console.log(`Saved desktop: ${r.name}`);
  }

  // Mobile (390x844) for Doctor & Provenance Graph & Patient
  await page.setViewport({ width: 390, height: 844 });
  for (const r of ['ws_doctor', 'ws_graph', 'ws_patient', 'ws_admin']) {
    const route = WORKSPACE_ROUTES.find(x => x.name === r);
    await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'networkidle0' });
    const ssPath = path.join(ARTIFACT_DIR, `${r}_mobile.png`);
    await page.screenshot({ path: ssPath });
    if (fs.existsSync(PUBLIC_SS)) {
      fs.copyFileSync(ssPath, path.join(PUBLIC_SS, `${r}_mobile.png`));
    }
    console.log(`Saved mobile: ${r}`);
  }

  await browser.close();
  console.log('Workspace screenshots captured successfully.');
}

captureWorkspaces().catch(console.error);
