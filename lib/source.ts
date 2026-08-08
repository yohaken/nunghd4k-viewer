import { load } from "cheerio";
import { getMovies, addMovies, getAllSlugs, type Movie } from "./data";

export const BASE_URL = "https://www.nunghd4k.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// --- WP Category ID cache ---
let _catSlugToId: Map<string, number> | null = null;

async function getWpCategoryMap(): Promise<Map<string, number>> {
  if (_catSlugToId) return _catSlugToId;
  _catSlugToId = new Map();
  const slugs = new Set<string>();
  try {
    let page = 1;
    while (true) {
      const res = await fetch(BASE_URL + "/wp-json/wp/v2/categories?per_page=100&page=" + page, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const cats: Array<{ id: number; slug: string; name: string }> = await res.json();
      if (cats.length === 0) break;
      for (const c of cats) {
        slugs.add(c.slug);
        if (!_catSlugToId.has(c.slug)) _catSlugToId.set(c.slug, c.id);
      }
      if (cats.length < 100) break;
      page++;
    }
  } catch { /* keep empty map on error */ }
  return _catSlugToId;
}

/** Extract category slug from a nunghd4k category URL */
export function slugFromCatUrl(url: string): string | null {
  try {
    const p = new URL(url).pathname;
    return p.replace(/\/+$/, "").split("/").pop() || null;
  } catch {
    const m = url.match(/\/([^/]+)\/?$/);
    return m ? m[1] : null;
  }
}

// URL mapping for top nav modes → nunghd4k.com pages
export const MODE_URLS: Record<string, string> = {
  home:    BASE_URL + "/",
  online:  BASE_URL + "/%E0%B8%94%E0%B8%B9%E0%B8%AB%E0%B8%99%E0%B8%B1%E0%B8%87%E0%B8%AD%E0%B8%AD%E0%B8%99%E0%B9%84%E0%B8%A5%E0%B8%99%E0%B9%8C/",
  netflix: BASE_URL + "/netflix/",
  thai:    BASE_URL + "/thaimovie/",
  new:     BASE_URL + "/recommend-new-movies/",
  imdb:    BASE_URL + "/top-imdb/",
};

// Cache per URL: { html, movies, totalPages, fetchedAt }
const CACHE_TTL = 2 * 60 * 1000; // 2 min
const pageCache = new Map<string, { movies: Movie[]; totalPages: number; totalMovies: number; fetchedAt: number }>();

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

function buildPageUrl(mode: string, page: number): string {
  const base = MODE_URLS[mode] || MODE_URLS["home"];
  return page <= 1 ? base : base + `page/${page}/`;
}

function extractMoviesFromHTML(html: string): Movie[] {
  const $ = load(html);
  const movies: Movie[] = [];
  const seen = new Set<string>();

  $(".grid-movie .box").each((_i, el) => {
    const linkEl = $(el).find("a").first();
    const href = linkEl.attr("href");
    if (!href) return;
    const slug = href.replace(BASE_URL + "/", "").replace(/\/$/, "").split("/").pop()!;
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

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
  });

  return movies;
}

function extractPagination(html: string): { totalPages: number; totalMovies: number } {
  const $ = load(html);
  let totalPages = 1;
  const pageNums: number[] = [];
  $(".pagination .page-numbers").each((_i, el) => {
    const n = parseInt($(el).text(), 10);
    if (!isNaN(n)) pageNums.push(n);
  });
  if (pageNums.length > 0) totalPages = Math.max(...pageNums);

  // Estimate total movies (32 per page is typical for nunghd4k)
  const totalMovies = totalPages * 32;

  return { totalPages, totalMovies };
}

export interface LivePage {
  movies: Movie[];
  page: number;
  totalPages: number;
  totalMovies: number;
  source: "live" | "cache";
}

export async function fetchLivePage(mode: string, page: number): Promise<LivePage> {
  const url = buildPageUrl(mode, page);
  const cached = pageCache.get(url);

  // Return cache if still fresh
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return {
      movies: cached.movies,
      page,
      totalPages: cached.totalPages,
      totalMovies: cached.totalMovies,
      source: "cache",
    };
  }

  // Fetch live
  const html = await fetchHTML(url);
  const movies = extractMoviesFromHTML(html);
  const { totalPages, totalMovies } = extractPagination(html);

  // Cache it
  pageCache.set(url, { movies, totalPages, totalMovies, fetchedAt: Date.now() });

  // Auto-merge new movies into the persistent delta
  addMovies(movies);

  return { movies, page, totalPages, totalMovies, source: "live" };
}

/** Search across base + delta (fast, full catalog) */
export function searchMovies(q: string): Movie[] {
  const term = q.toLowerCase().trim();
  if (!term) return [];

  return getMovies().filter((m) => {
    const t = (m.title || "").toLowerCase();
    const s = (m.slug || "").toLowerCase().replace(/-/g, " ");
    return t.includes(term) || s.includes(term);
  });
}

// --- Live search from nunghd4k.com (via WordPress REST API) ---

const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 min
const searchCache = new Map<string, SearchedMovies>();
const catCache = new Map<string, SearchedMovies>();

interface SearchedMovies {
  movies: Movie[];
  totalPages: number;
  totalMovies: number;
  fetchedAt: number;
}

interface WpPost {
  slug: string;
  link: string;
  title: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
  };
}

function mapWpPosts(posts: WpPost[]): Movie[] {
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title.rendered
      .replace(/&#8211;/g, "–")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, "\u201C")
      .replace(/&#8221;/g, "\u201D")
      .replace(/&#038;/g, "&")
      .replace(/&amp;/g, "&")
      .replace(/&#8230;/g, "\u2026"),
    image: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "",
    rating: null,
    quality: null,
    language: null,
    url: p.link,
  }));
}

async function fetchWpPosts(endpoint: string, perPage: number, page: number): Promise<{
  movies: Movie[];
  totalMovies: number;
  totalPages: number;
}> {
  const url = BASE_URL + "/wp-json/wp/v2/posts?" + endpoint
    + "&per_page=" + perPage + "&page=" + page + "&_embed";

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`WP API HTTP ${res.status}`);

  const posts: WpPost[] = await res.json();
  const totalMovies = parseInt(res.headers.get("X-WP-Total") || "0", 10);
  const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);

  return { movies: mapWpPosts(posts), totalMovies, totalPages };
}

export interface LiveSearchResult {
  movies: Movie[];
  page: number;
  totalPages: number;
  totalMovies: number;
  source: string;
}

export async function searchLiveFromSource(query: string, page: number): Promise<LiveSearchResult> {
  const cacheKey = `${query}::${page}`;
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < SEARCH_CACHE_TTL) {
    return {
      movies: cached.movies, page,
      totalPages: cached.totalPages, totalMovies: cached.totalMovies,
      source: "live-search-cache",
    };
  }

  const { movies, totalMovies, totalPages } = await fetchWpPosts("search=" + encodeURIComponent(query), 32, page);

  searchCache.set(cacheKey, { movies, totalPages, totalMovies, fetchedAt: Date.now() });
  addMovies(movies);

  return { movies, page, totalPages, totalMovies, source: "live-search" };
}

/** Fetch movies from a specific WP category — live from nunghd4k.com */
export async function fetchCategoryLive(catUrlOrSlug: string, page: number): Promise<LiveSearchResult> {
  const slug = slugFromCatUrl(catUrlOrSlug);
  if (!slug) throw new Error("Invalid category URL");

  const catMap = await getWpCategoryMap();
  const catId = catMap.get(slug);
  if (!catId) throw new Error(`Category not found: ${slug}`);

  const cacheKey = `cat:${catId}:${page}`;
  const cached = catCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < SEARCH_CACHE_TTL) {
    return {
      movies: cached.movies, page,
      totalPages: cached.totalPages, totalMovies: cached.totalMovies,
      source: "live-cat-cache",
    };
  }

  const { movies, totalMovies, totalPages } = await fetchWpPosts("categories=" + catId, 32, page);

  catCache.set(cacheKey, { movies, totalPages, totalMovies, fetchedAt: Date.now() });
  addMovies(movies);

  return { movies, page, totalPages, totalMovies, source: "live-cat" };
}
