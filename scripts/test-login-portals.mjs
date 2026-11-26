import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
const base=process.env.PORTAL_TEST_URL || "http://127.0.0.1:3137";
const browser=await puppeteer.launch({executablePath:process.env.CHROMIUM_PATH || "/usr/bin/chromium",headless:true,pipe:true,args:["--no-sandbox"]});
try {
  const page=await browser.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  for (const width of [390,1440]) {
    await page.setViewport({width,height:844});
    for (const role of ["admin","doctor","pharmacist","patient"]) {
      const response=await page.goto(base+"/login/"+role,{waitUntil:"networkidle0"});
      assert.equal(response.status(),200);
      assert.ok(await page.$("input[autocomplete='current-password']"));
      assert.ok(await page.$("input[type=email]"));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.goto(base+"/workspaces/"+role,{waitUntil:"domcontentloaded"});
      assert.equal(new URL(page.url()).pathname,"/auth/signin");
    }
  }
  assert.deepEqual(errors,[]);
  console.log("Four login portals and anonymous workspace redirects passed at 390px and 1440px.");
} finally {await browser.close();}
