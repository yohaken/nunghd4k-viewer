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
    version: process.env.BUILD_VERSION || "—",
    buildTime: process.env.BUILD_TIME || null,
    debug: {
      nodeEnv: process.env.NODE_ENV,
      authUrl: process.env.AUTH_URL || "(not set)",
      authSecret: process.env.AUTH_SECRET ? "present" : "MISSING",
      authGoogleId: process.env.AUTH_GOOGLE_ID ? "present" : "MISSING",
      authGoogleSecret: process.env.AUTH_GOOGLE_SECRET ? "present" : "MISSING",
    },
  });
}
