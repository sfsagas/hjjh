import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url);
  const content = await page.content();
  await browser.close();
  res.send({ html: content });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
