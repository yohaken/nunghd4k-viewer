import { NextRequest, NextResponse } from "next/server";
import { fetchLivePage, searchMovies, searchLiveFromSource, fetchCategoryLive } from "@/lib/source";
import { getMovies } from "@/lib/data";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") || "home";
  const search = searchParams.get("search") || "";
  const cat = searchParams.get("cat") || ""; // category URL from movies.json
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "32", 10);

  // Category: live fetch from category WP endpoint
  if (cat) {
    try {
      const live = await fetchCategoryLive(cat, page);
      return NextResponse.json({
        total: live.totalMovies,
        page: live.page,
        movies: live.movies,
        source: live.source,
        totalPages: live.totalPages,
      });
    } catch {
      // Fallback to internal index search
      const slug = cat.split("/").filter(Boolean).pop() || "";
      const readable = decodeURIComponent(slug).replace(/-/g, " ");
      const results = searchMovies(readable);
      const total = results.length;
      const start = (page - 1) * limit;
      return NextResponse.json({
        total,
        page,
        movies: results.slice(start, start + limit),
        source: "index-fallback",
        totalPages: Math.ceil(total / limit) || 1,
      });
    }
  }

  // Keyword search: try live WP search from nunghd4k.com, fall back to internal index
  if (search) {
    try {
      const live = await searchLiveFromSource(search, page);
      return NextResponse.json({
        total: live.totalMovies,
        page: live.page,
        movies: live.movies,
        source: live.source,
        totalPages: live.totalPages,
      });
    } catch {
      const results = searchMovies(search);
      const total = results.length;
      const start = (page - 1) * limit;
      return NextResponse.json({
        total,
        page,
        movies: results.slice(start, start + limit),
        source: "index",
        totalPages: Math.ceil(total / limit) || 1,
      });
    }
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

  // Live nav-modes: fetch from nunghd4k.com
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
    const base = getMovies();
    const start = (page - 1) * limit;
    return NextResponse.json({
      total: base.length,
      page,
      movies: base.slice(start, start + limit),
      source: "fallback",
      totalPages: Math.ceil(base.length / limit),
    });
  }
}
