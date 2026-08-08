import { NextRequest, NextResponse } from "next/server";
import { findMovieBySlug } from "@/lib/data";
import { extractMovieDetail } from "@/lib/scraper";
import type { MovieDetail } from "@/lib/data";

const detailCache = new Map<string, MovieDetail>();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const movie = findMovieBySlug(slug);
  if (!movie) return NextResponse.json({ slug, error: "Movie not found" });

  if (detailCache.has(slug)) {
    return NextResponse.json({ ...movie, ...detailCache.get(slug) });
  }

  try {
    const detail = await extractMovieDetail(movie);
    detailCache.set(slug, detail);
    return NextResponse.json({ ...movie, ...detail });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[detail] ${slug}: ${msg}`);
    return NextResponse.json({
      ...movie,
      hlsEmbedUrl: null,
      youtubeUrl: null,
      playerUrls: [],
      error: msg,
    });
  }
}
