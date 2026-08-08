import { NextResponse } from "next/server";
import { getMovies, getCategories, getScrapedAt } from "@/lib/data";
import { scheduleBackgroundRefresh, getRefreshStatus } from "@/lib/refresh";

let timerScheduled = false;

export async function GET() {
  if (!timerScheduled) {
    timerScheduled = true;
    scheduleBackgroundRefresh();
  }

  return NextResponse.json({
    totalMovies: getMovies().length,
    totalCategories: getCategories().length,
    scrapedAt: getScrapedAt(),
    refresh: getRefreshStatus(),
  });
}
