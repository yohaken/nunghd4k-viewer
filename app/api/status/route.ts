import { NextResponse } from "next/server";
import { getMovies, getCategories, getScrapedAt } from "@/lib/data";
import { scheduleBackgroundRefresh, refreshFromSource, getRefreshStatus } from "@/lib/refresh";

let firstRefreshDone = false;

export async function GET() {
  // Lazy-init: on first status call, do the refresh
  if (!firstRefreshDone) {
    firstRefreshDone = true;
    scheduleBackgroundRefresh();
    refreshFromSource().catch(() => {});
  }

  return NextResponse.json({
    totalMovies: getMovies().length,
    totalCategories: getCategories().length,
    scrapedAt: getScrapedAt(),
    refresh: getRefreshStatus(),
  });
}
