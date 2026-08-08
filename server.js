const express = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_URL = 'https://www.nunghd4k.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Load pre-scraped data
let staticData = { movies: [], categories: [], scrapedAt: null };
try {
  const raw = fs.readFileSync(path.join(__dirname, 'movies.json'), 'utf8');
  staticData = JSON.parse(raw);
  console.log(`Loaded ${staticData.movies.length} movies, ${staticData.categories.length} categories (scraped ${staticData.scrapedAt})`);
} catch (e) {
  console.log('No movies.json found — starting empty');
}

const moviesCache = staticData.movies;
const categoriesCache = staticData.categories;
let movieDetailsCache = {};

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8' },
    timeout: 15000,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function extractMovieDetail(movie) {
  const url = movie.url || `${BASE_URL}/${movie.slug}/`;
  const slug = movie.slug;
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  let movieId = null;
  const playerSrc = $('#player-iframe').attr('src') || '';
  const idMatch = playerSrc.match(/id=(\d+)/);
  if (idMatch) movieId = idMatch[1];
  if (!movieId) {
    $('button[onclick*="changePlayer"]').each((i, el) => {
      const onclick = $(el).attr('onclick') || '';
      const m = onclick.match(/id=(\d+)/);
      if (m && !movieId) movieId = m[1];
    });
  }

  const hlsEmbedUrl = movieId ? `https://play.gan-play.com/embed/fast168.php?key=nunghd4k&id=${movieId}&ep=&type=` : null;

  let youtubeUrl = null;
  $('iframe').each((i, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('youtube.com/embed/') || src.includes('youtu.be/')) {
      if (!youtubeUrl) youtubeUrl = src;
    }
  });

  const playerUrls = [];
  $('button[onclick*="changePlayer"]').each((i, el) => {
    const onclick = $(el).attr('onclick') || '';
    const m = onclick.match(/changePlayer\('([^']+)'/);
    if (m && m[1]) playerUrls.push(m[1]);
  });

  return { slug, movieId, hlsEmbedUrl, youtubeUrl, playerUrls };
}

// --- API ---

app.get('/api/movies', (req, res) => {
  const { search, page = 1, limit = 48 } = req.query;
  let movies = [...moviesCache];

  if (search) {
    const q = search.toLowerCase().trim();
    if (q) {
      movies = movies.filter(m => {
        const t = (m.title || '').toLowerCase();
        const s = (m.slug || '').toLowerCase().replace(/-/g, ' ');
        return t.includes(q) || s.includes(q);
      });
    }
  }

  const total = movies.length;
  const start = (Number(page) - 1) * Number(limit);
  const paged = movies.slice(start, start + Number(limit));

  res.json({ total, page: Number(page), movies: paged });
});

app.get('/api/movie/:slug', async (req, res) => {
  let slug = req.params.slug;
  let movie = moviesCache.find(m => m.slug === slug);
  if (!movie) {
    slug = encodeURIComponent(slug).toLowerCase();
    movie = moviesCache.find(m => m.slug.toLowerCase() === slug);
  }
  if (!movie) return res.json({ slug: req.params.slug, error: 'Movie not found' });

  if (movieDetailsCache[slug]) return res.json({ ...movie, ...movieDetailsCache[slug] });

  try {
    const detail = await extractMovieDetail(movie);
    movieDetailsCache[slug] = detail;
    res.json({ ...movie, ...detail });
  } catch (err) {
    console.error(`[detail] ${slug}: ${err.message}`);
    res.json({ ...movie, hlsEmbedUrl: null, youtubeUrl: null, playerUrls: [], error: err.message });
  }
});

app.get('/api/categories', (req, res) => { res.json(categoriesCache); });
app.get('/api/status', (req, res) => {
  res.json({
    totalMovies: moviesCache.length,
    totalCategories: categoriesCache.length,
    scrapedAt: staticData.scrapedAt,
    cachedDetails: Object.keys(movieDetailsCache).length,
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT} (${moviesCache.length} movies)`);
});
