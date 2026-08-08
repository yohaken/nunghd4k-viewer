import { NextRequest, NextResponse } from "next/server";
import { findMovieBySlug } from "@/lib/data";
import { extractMovieDetail } from "@/lib/scraper";
import type { MovieDetail } from "@/lib/scraper";

interface CachedDetail extends MovieDetail {
  cachedAt: number;
}

const detailCache = new Map<string, CachedDetail>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const movie = findMovieBySlug(slug);
  if (!movie) return NextResponse.json({ slug, error: "Movie not found" }, { status: 404 });

  const cached = detailCache.get(slug);
  if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL_MS) {
    const { cachedAt, ...detail } = cached;
    return NextResponse.json({ ...movie, ...detail });
  }

  try {
    const detail = await extractMovieDetail(movie);
    detailCache.set(slug, { ...detail, cachedAt: Date.now() });

    // Log if no sources found
    if (!detail.movieId && !detail.playerUrls.length && !detail.youtubeUrl) {
      console.warn(`[detail] ${slug}: no video sources found`);
    }

    return NextResponse.json({ ...movie, ...detail });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[detail] ${slug}: ${msg}`);

    // Return whatever we have in cache if it exists, even if stale
    const stale = detailCache.get(slug);
    if (stale) {
      const { cachedAt, ...detail } = stale;
      return NextResponse.json({ ...movie, ...detail, stale: true });
    }

    return NextResponse.json({
      ...movie,
      fast168Url: null,
      vidPhpUrl: null,
      youtubeUrl: null,
      playerUrls: [],
      allIframes: [],
      error: msg,
    });
  }
}
