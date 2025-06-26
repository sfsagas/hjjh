// scraper.js  (≈ 60 lines total)
import express   from 'express';
import cors      from 'cors';
import { chromium } from 'playwright';

const PORT        = process.env.PORT || 3000;
const MAX_PAGES   = 3;        // <-- adjust: how many pages can run in parallel
const queue       = [];       // simple FIFO queue
let activePages   = 0;

const app = express();
app.use(cors());

/* ---------- start one global browser on bootstrap ---------- */
const browser = await chromium.launch({ args: ['--no-sandbox'] });
process.on('exit', () => browser.close());

/* ---------- helper: acquire / release a page slot ---------- */
const acquire = () =>
  new Promise(res => {
    const tryNext = () => {
      if (activePages < MAX_PAGES) {
        activePages++;
        res();
      } else queue.push(tryNext);
    };
    tryNext();
  });

const release = () => {
  activePages--;
  if (queue.length) queue.shift()();
};

/* ---------- /scrape ---------------- */
app.get('/scrape', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing ?url' });

  await acquire();                      // wait for an available slot
  const context = await browser.newContext();
  const page    = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    const data = await page.evaluate(() => {
      const txt = el => el?.innerText?.trim() ?? '';
      return {
        url      : location.href,
        title    : document.title,
        headings : Array.from(document.querySelectorAll('h1,h2,h3'))
                     .map(h => ({ tag: h.tagName, text: txt(h) })),
        paragraphs : Array.from(document.querySelectorAll('p'))
                     .map(p => txt(p)).filter(t => t.length > 40),
        links    : Array.from(document.querySelectorAll('a[href^="http"]'))
                     .map(a => ({ text: txt(a), href: a.href }))
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await page.close();     // DO NOT close browser
    await context.close();
    release();
  }
});

/* ---------- health-check root ---------- */
app.get('/', (_req, res) => res.send('OK'));

app.listen(PORT, () => console.log('⚡️ listening on', PORT));
