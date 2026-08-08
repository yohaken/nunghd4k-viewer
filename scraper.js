const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.nunghd4k.com';
const CONCURRENCY = 5;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let totalNungPages = 232;
let seenSlugs = new Set();
let allMovies = [];
let categories = [];
let done = 0;
let errors = 0;

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8' },
    timeout: 20000,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function extractPage(html) {
  const $ = cheerio.load(html);
  const movies = [];

  $('.grid-movie .box').each((i, el) => {
    const linkEl = $(el).find('a').first();
    const href = linkEl.attr('href');
    if (!href) return;
    const slug = href.replace(BASE_URL + '/', '').replace(/\/$/, '').split('/').pop();
    if (!slug || seenSlugs.has(slug)) return;

    let image = null;
    const noscriptImg = $(el).find('noscript img').first();
    if (noscriptImg.length) image = noscriptImg.attr('src');
    if (!image) {
      const lazyImg = $(el).find('img[data-lazy-src]').first();
      if (lazyImg.length) image = lazyImg.attr('data-lazy-src');
    }

    const title = $(el).find('.p2').text().trim();
    const rating = $(el).find('.info1 p').first().text().trim();
    const qualityBadge = $(el).find('.movie-corner').text().trim();
    const language = $(el).find('.p1').text().trim();

    seenSlugs.add(slug);
    movies.push({ slug, title, image, rating: rating || null, quality: qualityBadge || null, language: language || null, url: href });
  });

  return movies;
}

async function scrapePage(pageNum) {
  const pageUrl = pageNum === 1 ? BASE_URL + '/' : `${BASE_URL}/page/${pageNum}/`;
  try {
    const html = await fetchHTML(pageUrl);
    const movies = extractPage(html);

    if (pageNum === 1) {
      const $ = cheerio.load(html);
      // Categories
      $('.ve-cat-widget-listing li a').each((i, el) => {
        const href = $(el).attr('href');
        const name = $(el).text().trim();
        if (href && name) categories.push({ name, url: href });
      });
      // Max pages
      $('.pagination .page-numbers').each((i, el) => {
        const n = parseInt($(el).text(), 10);
        if (!isNaN(n) && n > totalNungPages) totalNungPages = n;
      });
    }

    return movies;
  } catch (err) {
    errors++;
    console.error(`[FAIL] Page ${pageNum}: ${err.message}`);
    return [];
  }
}

async function runQueue(queue) {
  for (const pageNum of queue) {
    const movies = await scrapePage(pageNum);
    allMovies.push(...movies);
    done++;
    process.stdout.write(`\r  Scraping... ${done}/${totalNungPages} pages | ${allMovies.length} movies | ${errors} errors`);
  }
}

async function main() {
  console.log('=== NUNGHD4K Full Scraper ===\n');

  // Discover real max page from page 1 first
  console.log('Discovering total pages...');
  try {
    const html = await fetchHTML(BASE_URL + '/');
    const $ = cheerio.load(html);
    $('.pagination .page-numbers').each((i, el) => {
      const n = parseInt($(el).text(), 10);
      if (!isNaN(n) && n > totalNungPages) totalNungPages = n;
    });
    // Also extract page 1 categories
    $('.ve-cat-widget-listing li a').each((i, el) => {
      const href = $(el).attr('href');
      const name = $(el).text().trim();
      if (href && name) categories.push({ name, url: href });
    });
    console.log(`  Max page: ${totalNungPages}\n`);
  } catch (err) {
    console.log(`  Could not discover, using default: ${totalNungPages}\n`);
  }

  // Build page queue
  const pages = [];
  for (let i = 1; i <= totalNungPages; i++) pages.push(i);

  // Run in parallel batches
  const chunkSize = Math.ceil(pages.length / CONCURRENCY);
  const queues = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    queues.push(pages.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  console.log(`Scraping ${pages.length} pages with ${CONCURRENCY} workers...\n`);
  const startTime = Date.now();
  await Promise.all(queues.map(queue => runQueue(queue)));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\nDone! ${allMovies.length} movies, ${categories.length} categories in ${elapsed}s`);
  if (errors > 0) console.log(`  (${errors} pages had errors)`);

  // Save
  const out = {
    scrapedAt: new Date().toISOString(),
    totalMovies: allMovies.length,
    totalCategories: categories.length,
    totalPages: totalNungPages,
    categories,
    movies: allMovies,
  };

  const outPath = path.join(__dirname, 'movies.json');
  fs.writeFileSync(outPath, JSON.stringify(out));
  console.log(`\nSaved to movies.json (${(JSON.stringify(out).length / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
