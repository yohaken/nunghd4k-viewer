import { NextRequest, NextResponse } from "next/server";
import { findMovieBySlug } from "@/lib/data";
import { extractMovieDetail, fetchM3u8Urls } from "@/lib/scraper";

const CACHE = new Map<string, { data: any; ts: number }>();
const TTL = 10 * 60 * 1000; // 10 min

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const movie = findMovieBySlug(slug);
  if (!movie) return NextResponse.json({ error: "Movie not found" }, { status: 404 });

  const cached = CACHE.get(slug);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const detail = await extractMovieDetail(movie);

    const data = {
      slug,
      title: movie.title,
      image: movie.image,
      url: movie.url,
      movieId: detail.movieId,
      m3u8Url: detail.m3u8Url,
      fallbackM3u8Urls: detail.fallbackM3u8Urls,
      fast168Url: detail.fast168Url,
      vidPhpUrl: detail.vidPhpUrl,
      youtubeUrl: detail.youtubeUrl,
      playerUrls: detail.playerUrls,
      allIframes: detail.allIframes,
    };

    CACHE.set(slug, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
