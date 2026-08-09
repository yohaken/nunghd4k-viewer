import { load } from "cheerio";
import type { Movie } from "./data";

export interface MovieDetail {
  slug: string;
  movieId: string | null;
  fast168Url: string | null;
  vidPhpUrl: string | null;
  youtubeUrl: string | null;
  playerUrls: string[];
  allIframes: string[];
  m3u8Url: string | null;
  fallbackM3u8Urls: string[];
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

function extractMovieId(str: string): string | null {
  const idMatch = str.match(/[?&]id=([\w-]+)/);
  if (idMatch && idMatch[1] !== "nunghd4k") return idMatch[1];
  return null;
}

export async function fetchM3u8Urls(movieId: string): Promise<{ m3u8Url: string | null; fallbackM3u8Urls: string[] }> {
  try {
    const fast168Html = await fetchHTML(
      `https://play.gan-play.com/embed/fast168.php?key=nunghd4k&id=${movieId}&ep=&type=`
    );

    const workerMatch = fast168Html.match(/WORKER_URL\s*=\s*"([^"]*)"/);
    const m3u8Url = workerMatch && workerMatch[1] ? workerMatch[1] : null;

    const fallbackMatch = fast168Html.match(/FALLBACK_URLS\s*=\s*(\[[^\]]*\])/);
    let fallbackM3u8Urls: string[] = [];
    if (fallbackMatch) {
      const urls = fallbackMatch[1].match(/"([^"]+)"/g);
      if (urls) {
        fallbackM3u8Urls = urls.map(u => u.replace(/"/g, ""));
      }
    }

    return { m3u8Url, fallbackM3u8Urls };
  } catch {
    return { m3u8Url: null, fallbackM3u8Urls: [] };
  }
}

export async function extractMovieDetail(movie: Movie): Promise<MovieDetail> {
  const slug = movie.slug;
  const html = await fetchHTML(movie.url);
  const $ = load(html);

  // Collect ALL iframes
  const allIframesRaw: string[] = [];
  $("iframe").each((_i, el) => {
    const src = $(el).attr("src") || "";
    if (src.length > 10 &&
        !src.includes("facebook.com") &&
        !src.includes("googletagmanager") &&
        !src.includes("google-analytics") &&
        !src.includes("doubleclick") &&
        !src.includes("ajax.google")) {
      allIframesRaw.push(src);
    }
  });
  const allIframes = [...new Set(allIframesRaw)];

  // Extract movieId — PRIORITIZE vid.php links (real numeric IDs)
  let movieId: string | null = null;

  // 1. Search for vid.php links in onclick handlers (most reliable)
  $("button[onclick*=\"changePlayer\"]").each((_i, el) => {
    const onclick = $(el).attr("onclick") || "";
    const vidMatch = onclick.match(/vid\.php\?key=nunghd4k&id=(\d+)/);
    if (vidMatch && !movieId) {
      movieId = vidMatch[1];
    }
  });

  // 2. Search entire HTML for vid.php with numeric id
  if (!movieId) {
    const vidMatch = html.match(/vid\.php\?key=nunghd4k&id=(\d+)/);
    if (vidMatch) movieId = vidMatch[1];
  }

  // 3. Search scripts for apiurl pattern
  if (!movieId) {
    $("script").each((_i, el) => {
      const text = $(el).html() || "";
      const apiMatch = text.match(/id=(\d+)/);
      if (apiMatch && !movieId) movieId = apiMatch[1];
    });
  }

  // 4. Last resort: any id from iframes
  if (!movieId) {
    for (const src of allIframes) {
      const id = extractMovieId(src);
      if (id && /^\d+$/.test(id)) { movieId = id; break; }
    }
  }

  // 5. Fallback to any id (alphanumeric)
  if (!movieId) {
    for (const src of allIframes) {
      const id = extractMovieId(src);
      if (id) { movieId = id; break; }
    }
  }

  // ── Build player URLs ─────────────────────────────────────────
  const fast168Url = movieId
    ? `https://play.gan-play.com/embed/fast168.php?key=nunghd4k&id=${movieId}&ep=&type=`
    : null;

  const vidPhpUrl = movieId
    ? `https://www.nunghd4k.com/play/vid.php?key=nunghd4k&id=${movieId}`
    : null;

  // ── Fetch m3u8 stream URLs ────────────────────────────────────
  let m3u8Url: string | null = null;
  let fallbackM3u8Urls: string[] = [];
  if (movieId) {
    const m3u8Data = await fetchM3u8Urls(movieId);
    m3u8Url = m3u8Data.m3u8Url;
    fallbackM3u8Urls = m3u8Data.fallbackM3u8Urls;
  }

  // ── YouTube ───────────────────────────────────────────────────
  let youtubeUrl: string | null = null;
  for (const src of allIframes) {
    if ((src.includes("youtube.com/embed/") || src.includes("youtu.be/")) && !youtubeUrl) {
      youtubeUrl = src;
    }
  }

  // ── changePlayer backup URLs ──────────────────────────────────
  const playerUrls: string[] = [];
  $("button[onclick*=\"changePlayer\"]").each((_i, el) => {
    const onclick = $(el).attr("onclick") || "";
    const m = onclick.match(/changePlayer\('([^']+)'/);
    if (m && m[1] && !playerUrls.includes(m[1])) playerUrls.push(m[1]);
  });

  return { slug, movieId, fast168Url, vidPhpUrl, youtubeUrl, playerUrls, allIframes, m3u8Url, fallbackM3u8Urls };
}
