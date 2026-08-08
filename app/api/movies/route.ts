import { NextRequest, NextResponse } from "next/server";
import { filterMovies } from "@/lib/data";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "48", 10);

  const result = filterMovies({ search, page, limit });
  return NextResponse.json({
    total: result.total,
    page,
    movies: result.movies,
  });
}
