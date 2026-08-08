import { NextResponse } from "next/server";
import { refreshFromSource, scheduleBackgroundRefresh, getRefreshStatus } from "@/lib/refresh";

export async function POST() {
  scheduleBackgroundRefresh();
  const result = await refreshFromSource();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  scheduleBackgroundRefresh();
  return NextResponse.json(getRefreshStatus());
}
