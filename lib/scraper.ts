import { load } from "cheerio";
import type { Movie } from "./data";

export interface MovieDetail {
  slug: string;
  movieId: string | null;
  fast168Url: string | null;
  vidPhpUrl: string | null;
  youtubeUrl: string | null;
  playerUrls: string[];
  allIframes: string[];  // every iframe found on the page
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

/**
 * Try to extract a movie ID from a URL or string.
 * Handles many formats: id=abc123, id=mD0r555643, /embed/123, vid.php?id=..., etc.
 */
function extractMovieId(str: string): string | null {
  // Standard id=<value> in query string
  const idMatch = str.match(/[?&]id=([\w-]+)/);
  if (idMatch && idMatch[1] !== "nunghd4k") return idMatch[1];

  // vid.php endpoint
  const vidMatch = str.match(/id\/([\w-]+)/);
  if (vidMatch && vidMatch[1] !== "nunghd4k") return vidMatch[1];

  return null;
}

/**
 * Check if a URL looks like a real movie/video embed (not ad, tracker, etc.)
 */
function isVideoUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  const lower = url.toLowerCase();
  // Skip ads, trackers, images, social media embeds
  const skip = ["facebook.com", "googletagmanager", "google-analytics", "doubleclick",
    ".gif", ".jpg", ".png", ".svg", ".webp", "ajax.google", "connect.facebook"];
  for (const s of skip) {
    if (lower.includes(s)) return false;
  }
  return true;
}

export async function extractMovieDetail(movie: Movie): Promise<MovieDetail> {
  const slug = movie.slug;
  const html = await fetchHTML(movie.url);
  const $ = load(html);

  // ── Collect ALL iframe srcs on the page ───────────────────────
  const allIframesRaw: string[] = [];
  $("iframe").each((_i, el) => {
    const src = $(el).attr("src") || "";
    if (isVideoUrl(src)) allIframesRaw.push(src);
  });

  // Deduplicate
  const allIframes = [...new Set(allIframesRaw)];

  // ── Extract movieId from as many sources as possible ──────────
  let movieId: string | null = null;

  // 1. Try dedicated player selectors first
  const playerSelectors = [
    $("#player-wrapper iframe[id]").first().attr("src"),
    $("#player-iframe").attr("src"),
    $("#player-url").attr("src"),
    $("iframe[id]").first().attr("src"),
    $("[class*='player'] iframe").first().attr("src"),
    $("[id*='player'] iframe").first().attr("src"),
  ];

  for (const src of playerSelectors) {
    if (!src) continue;
    const id = extractMovieId(src);
    if (id) { movieId = id; break; }
  }

  // 2. Try all iframes
  if (!movieId) {
    for (const src of allIframes) {
      const id = extractMovieId(src);
      if (id) { movieId = id; break; }
    }
  }

  // 3. Try changePlayer button onclick attributes
  if (!movieId) {
    $("button[onclick*=\"changePlayer\"]").each((_i, el) => {
      const onclick = $(el).attr("onclick") || "";
      const id = extractMovieId(onclick);
      if (id && !movieId) movieId = id;
    });
  }

  // 4. Try inline scripts for player initialization
  if (!movieId) {
    $("script").each((_i, el) => {
      const text = $(el).html() || "";
      const id = extractMovieId(text);
      if (id && !movieId) movieId = id;
    });
  }

  // 5. Last resort: search entire HTML for vid.php with id
  if (!movieId) {
    const m = html.match(/vid\.php\?[^"']*?[?&;]id=([\w-]+)/);
    if (m && m[1] !== "nunghd4k") movieId = m[1];
  }

  // ── Build player URLs ─────────────────────────────────────────
  const fast168Url = movieId
    ? `https://play.gan-play.com/embed/fast168.php?key=nunghd4k&id=${movieId}&ep=&type=`
    : null;

  const vidPhpUrl = movieId
    ? `https://www.nunghd4k.com/play/vid.php?key=nunghd4k&id=${movieId}`
    : null;

  // ── YouTube (trailers) ────────────────────────────────────────
  let youtubeUrl: string | null = null;
  for (const src of allIframes) {
    if ((src.includes("youtube.com/embed/") || src.includes("youtu.be/")) && !youtubeUrl) {
      youtubeUrl = src;
    }
  }

  // ── changePlayer button URLs ──────────────────────────────────
  const playerUrls: string[] = [];
  $("button[onclick*=\"changePlayer\"]").each((_i, el) => {
    const onclick = $(el).attr("onclick") || "";
    const m = onclick.match(/changePlayer\('([^']+)'/);
    if (m && m[1] && !playerUrls.includes(m[1])) playerUrls.push(m[1]);
  });

  // ── Fallback: if no movieId found, use the best iframe directly
  //    This handles movies with non-standard embed formats
  if (!movieId && !playerUrls.length) {
    for (const src of allIframes) {
      const lower = src.toLowerCase();
      if (lower.includes("vid.php") || lower.includes("embed") || lower.includes("play") || lower.includes("player")) {
        if (!playerUrls.includes(src)) playerUrls.push(src);
      }
    }
  }

  return { slug, movieId, fast168Url, vidPhpUrl, youtubeUrl, playerUrls, allIframes };
}
