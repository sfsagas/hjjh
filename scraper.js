import express from 'express';
import { chromium } from 'playwright';
import cors from 'cors';

const app  = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

app.get('/scrape', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) throw new Error('Query param ?url is required');

    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page    = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const html    = await page.content();
    await browser.close();

    res.json({ html });
  } catch (err) {
    next(err);          // bubble to the error handler
  }
});

// basic health check
app.get('/', (_req, res) => res.send('OK'));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`🚀  listening on ${PORT}`));
