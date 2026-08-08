import { NextResponse } from "next/server";
import { getMovies, getBaseCount, getDeltaCount, getCategories, getScrapedAt } from "@/lib/data";
import { scheduleBackgroundRefresh, getRefreshStatus } from "@/lib/refresh";

let timerScheduled = false;

export async function GET() {
  if (!timerScheduled) {
    timerScheduled = true;
    scheduleBackgroundRefresh();
  }

  return NextResponse.json({
    totalMovies: getMovies().length,
    baseMovies: getBaseCount(),
    deltaMovies: getDeltaCount(),
    totalCategories: getCategories().length,
    scrapedAt: getScrapedAt(),
    refresh: getRefreshStatus(),
    version: process.env.BUILD_VERSION || "unknown",
    buildTime: process.env.BUILD_TIME || null,
  });
}
