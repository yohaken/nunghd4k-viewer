import { NextRequest, NextResponse } from "next/server";
import { fetchLivePage, searchMovies } from "@/lib/source";
import { getMovies } from "@/lib/data";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") || "home";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "32", 10);

  // Search: use movies.json + delta index (fast, full catalog)
  if (search) {
    const results = searchMovies(search);
    const total = results.length;
    const start = (page - 1) * limit;
    return NextResponse.json({
      total,
      page,
      movies: results.slice(start, start + limit),
      source: "index",
    });
  }

  // TOP IMDb: sort base+delta by rating
  if (mode === "imdb") {
    const all = getMovies()
      .filter((m) => m.rating && !isNaN(parseFloat(m.rating)))
      .sort((a, b) => parseFloat(b.rating!) - parseFloat(a.rating!));
    const total = all.length;
    const start = (page - 1) * limit;
    return NextResponse.json({
      total,
      page,
      movies: all.slice(start, start + limit),
      source: "index",
      totalPages: Math.ceil(total / limit),
    });
  }

  // Live fetch from nunghd4k.com
  try {
    const result = await fetchLivePage(mode, page);
    return NextResponse.json({
      total: result.totalMovies,
      page: result.page,
      movies: result.movies,
      source: result.source,
      totalPages: result.totalPages,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Fallback: return from base+delta
    const base = getMovies();
    const start = (page - 1) * limit;
    return NextResponse.json({
      total: base.length,
      page,
      movies: base.slice(start, start + limit),
      source: "fallback",
      totalPages: Math.ceil(base.length / limit),
      error: msg,
    });
  }
}
