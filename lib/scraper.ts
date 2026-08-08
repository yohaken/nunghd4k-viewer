import { load } from "cheerio";
import type { Movie, MovieDetail } from "./data";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function extractMovieDetail(movie: Movie): Promise<MovieDetail> {
  const slug = movie.slug;
  const html = await fetchHTML(movie.url);
  const $ = load(html);

  let movieId: string | null = null;
  const playerSrc = $("#player-iframe").attr("src") || "";
  const idMatch = playerSrc.match(/id=(\d+)/);
  if (idMatch) movieId = idMatch[1];
  if (!movieId) {
    $('button[onclick*="changePlayer"]').each((_i, el) => {
      const onclick = $(el).attr("onclick") || "";
      const m = onclick.match(/id=(\d+)/);
      if (m && !movieId) movieId = m[1];
    });
  }

  const hlsEmbedUrl = movieId
    ? `https://play.gan-play.com/embed/fast168.php?key=nunghd4k&id=${movieId}&ep=&type=`
    : null;

  let youtubeUrl: string | null = null;
  $("iframe").each((_i, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes("youtube.com/embed/") || src.includes("youtu.be/")) {
      if (!youtubeUrl) youtubeUrl = src;
    }
  });

  const playerUrls: string[] = [];
  $('button[onclick*="changePlayer"]').each((_i, el) => {
    const onclick = $(el).attr("onclick") || "";
    const m = onclick.match(/changePlayer\('([^']+)'/);
    if (m && m[1]) playerUrls.push(m[1]);
  });

  return { slug, movieId, hlsEmbedUrl, youtubeUrl, playerUrls };
}
