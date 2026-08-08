import { getMovies, addMovies, type Movie } from "./data";

export const BASE_URL = "https://www.nunghd4k.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// --- WP Category ID cache ---
let _catSlugToId: Map<string, number> | null = null;

async function getWpCategoryMap(): Promise<Map<string, number>> {
  if (_catSlugToId) return _catSlugToId;
  _catSlugToId = new Map();
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
        const s = c.slug.toLowerCase();
        if (!_catSlugToId.has(s)) _catSlugToId.set(s, c.id);
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
    return (p.replace(/\/+$/, "").split("/").pop() || null)?.toLowerCase() ?? null;
  } catch {
    const m = url.match(/\/([^/]+)\/?$/);
    return m ? m[1].toLowerCase() : null;
  }
}

// Mode → WP category ID mapping (for REST API pagination)
const MODE_CATEGORY_IDS: Record<string, number> = {
  home:   0,      // 0 = all posts (no filter)
  online: 22,     // ดูหนังออนไลน์
  netflix: 1,     // netflix
  thai:   7353,   // หนังไทย (thaimovie)
  new:    7352,   // หนังใหม่ชนโรง (recommend-new-movies)
};

const MODE_CACHE_TTL = 5 * 60 * 1000; // 5 min
const modeCache = new Map<string, SearchedMovies>();

/** Fetch movies for a nav mode using WP REST API — supports pagination correctly */
export async function fetchModeLive(mode: string, page: number): Promise<LiveSearchResult> {
  const catId = MODE_CATEGORY_IDS[mode];
  if (catId === undefined) throw new Error(`Unknown mode: ${mode}`);

  const cacheKey = `mode:${mode}:${page}`;
  const cached = modeCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < MODE_CACHE_TTL) {
    return {
      movies: cached.movies, page,
      totalPages: cached.totalPages, totalMovies: cached.totalMovies,
      source: "live-cache",
    };
  }

  const endpoint = catId === 0 ? "" : `categories=${catId}`;
  const { movies, totalMovies, totalPages } = await fetchWpPosts(endpoint, 32, page);

  modeCache.set(cacheKey, { movies, totalPages, totalMovies, fetchedAt: Date.now() });
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
    + "&per_page=" + perPage + "&page=" + page + "&_embed"
    + "&orderby=date&order=desc";

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

  let catId: number | undefined;
  const catMap = await getWpCategoryMap();
  catId = catMap.get(slug);

  // Fallback: direct WP API lookup by slug
  if (!catId) {
    try {
      const lookupRes = await fetch(
        BASE_URL + "/wp-json/wp/v2/categories?slug=" + slug,
        { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
      );
      if (lookupRes.ok) {
        const cats: Array<{ id: number }> = await lookupRes.json();
        if (cats.length > 0) {
          catId = cats[0].id;
          catMap.set(slug, catId); // cache for next time
        }
      }
    } catch { /* keep going */ }
  }

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
