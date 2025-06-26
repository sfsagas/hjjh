import express from 'express';
import { chromium } from 'playwright';
import cors from 'cors';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox','--disable-setuid-sandbox']
});

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// /scrape?url=https://example.com
app.get('/scrape', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) throw new Error('Query param ?url is required');

 



const page = await browser.newPage();

await page.close();           



    /* ---------- structured extraction ---------- */
    const data = await page.evaluate(() => {
      /* helper to get cleaned innerText */
      const txt = el => el?.innerText?.trim() ?? '';

      return {
        url       : location.href,
        title     : document.title,
        headings  : Array.from(document.querySelectorAll('h1,h2,h3'))
                        .map(h => ({ tag: h.tagName, text: txt(h) })),
        paragraphs: Array.from(document.querySelectorAll('p'))
                        .map(p => txt(p))
                        .filter(t => t.length > 40),          // drop very short noise
        links     : Array.from(document.querySelectorAll('a[href^="http"]'))
                        .map(a => ({ text: txt(a), href: a.href }))
      };
    });
    /* ------------------------------------------- */

    await browser.close();
    res.json(data);
  } catch (err) {
    next(err);                // bubble to the error handler
  }
});

/* health-check + basic error handler */
app.get('/', (_req, res) => res.send('OK'));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`⚡️ listening on ${PORT}`));
