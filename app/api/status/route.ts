import { NextResponse } from "next/server";
import { getMovies, getScrapedAt } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    totalMovies: getMovies().length,
    totalCategories: getMovies().length > 0 ? 76 : 0,
    scrapedAt: getScrapedAt(),
  });
}
