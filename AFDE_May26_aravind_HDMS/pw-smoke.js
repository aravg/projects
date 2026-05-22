const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "screenshots");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  const routes = [
    { name: "dashboard",   url: "http://localhost:5173/" },
    { name: "tickets",     url: "http://localhost:5173/tickets" },
    { name: "create",      url: "http://localhost:5173/create" },
    { name: "etl-manager", url: "http://localhost:5173/etl" },
    { name: "analytics",   url: "http://localhost:5173/analytics" },
  ];

  for (const { name, url } of routes) {
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      const file = path.join(OUT, `${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`OK  ${name}: ${file}`);
    } catch (e) {
      console.log(`ERR ${name}: ${e.message}`);
    }
  }

  await browser.close();
})();
