const express = require("express");
const { chromium } = require("playwright");
const app = express();

const PORT = process.env.PORT || 3001;     // ← dynamic for Render

app.get("/scrape", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const content = await page.evaluate(() => {
    const p   = [...document.querySelectorAll("p")].map(el => el.innerText);
    const a   = [...document.querySelectorAll("a")].map(el => ({ text: el.innerText, href: el.href }));
    return { text: p.filter(Boolean), links: a };
  });

  await browser.close();
  res.json(content);
});

app.listen(PORT, () => console.log(`🧪 Scraper running on ${PORT}`));
