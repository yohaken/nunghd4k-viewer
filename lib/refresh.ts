import { load } from "cheerio";
import { getMovies, addMovies, type Movie } from "./data";

const BASE_URL = "https://www.nunghd4k.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const REFRESH_PAGES = 3;
const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000;

type RefreshResult = {
  newMovies: number;
  totalMovies: number;
  pagesScraped: number;
  lastRefresh: Date;
};

let lastRefresh: Date | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let newMoviesFound = 0;

async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export function extractMoviesFromPage(html: string): Movie[] {
  const $ = load(html);
  const movies: Movie[] = [];
  const existingSlugs = new Set(getMovies().map((m) => m.slug));

  $(".grid-movie .box").each((_i, el) => {
    const linkEl = $(el).find("a").first();
    const href = linkEl.attr("href");
    if (!href) return;
    const slug = href.replace(BASE_URL + "/", "").replace(/\/$/, "").split("/").pop()!;
    if (!slug || existingSlugs.has(slug)) return;

    let image: string | null = null;
    const noscriptImg = $(el).find("noscript img").first();
    if (noscriptImg.length) image = noscriptImg.attr("src") || null;
    if (!image) {
      const lazyImg = $(el).find("img[data-lazy-src]").first();
      if (lazyImg.length) image = lazyImg.attr("data-lazy-src") || null;
    }

    const title = $(el).find(".p2").text().trim();
    const rating = $(el).find(".info1 p").first().text().trim() || null;
    const quality = $(el).find(".movie-corner").text().trim() || null;
    const language = $(el).find(".p1").text().trim() || null;

    movies.push({ slug, title, image: image || "", rating, quality, language, url: href });
    existingSlugs.add(slug);
  });

  return movies;
}

async function scrapePage(pageNum: number): Promise<Movie[]> {
  const pageUrl = pageNum === 1 ? BASE_URL + "/" : `${BASE_URL}/page/${pageNum}/`;
  const html = await fetchHTML(pageUrl);
  return extractMoviesFromPage(html);
}

async function doRefresh(): Promise<RefreshResult> {
  let totalNew = 0;

  for (let page = 1; page <= REFRESH_PAGES; page++) {
    try {
      const movies = await scrapePage(page);
      if (movies.length > 0) {
        addMovies(movies);
        totalNew += movies.length;
      }
    } catch (err) {
      console.error(`[refresh] Page ${page} failed:`, err);
    }
  }

  lastRefresh = new Date();
  newMoviesFound = totalNew;
  return {
    newMovies: totalNew,
    totalMovies: getMovies().length,
    pagesScraped: REFRESH_PAGES,
    lastRefresh,
  };
}

/** Thread-safe refresh: concurrent callers await the same promise */
export async function refreshFromSource(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export function getRefreshStatus() {
  return {
    lastRefresh,
    inProgress: !!refreshPromise,
    newMoviesFound,
    refreshPages: REFRESH_PAGES,
    intervalMs: REFRESH_INTERVAL_MS,
  };
}

export function scheduleBackgroundRefresh() {
  if (refreshTimer) return;

  const runAndReschedule = async () => {
    try {
      const result = await refreshFromSource();
      if (result.newMovies > 0) {
        console.log(`[bg-refresh] +${result.newMovies} new movies, total: ${result.totalMovies}`);
      } else {
        console.log(`[bg-refresh] No new movies, total: ${result.totalMovies}`);
      }
    } catch (err) {
      console.error("[bg-refresh] Failed:", err);
    }
    refreshTimer = setTimeout(runAndReschedule, REFRESH_INTERVAL_MS);
  };

  refreshTimer = setTimeout(runAndReschedule, REFRESH_INTERVAL_MS);
  console.log(`[refresh] Background refresh every ${REFRESH_INTERVAL_MS / 60000} min`);
}
