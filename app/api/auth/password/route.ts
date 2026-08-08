import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "@/lib/rate-limit";

const PASSWORD = "0884818817";
const COOKIE_NAME = "nunghd_auth";
const SECRET = process.env.AUTH_SECRET || "z093JRgNBIUWB4woHYVoVsj/fg34DR/7EeajvDL/Mv8=";

function signToken(): string {
  const ts = Date.now();
  const crypto = require("crypto") as typeof import("crypto");
  const sig = crypto.createHmac("sha256", SECRET).update(String(ts)).digest("hex").slice(0, 16);
  return `${ts}:${sig}`;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { password } = await request.json().catch(() => ({ password: "" }));

  // Correct password always wins — bypass rate limit
  if (password === PASSWORD) {
    resetAttempts(ip);
    const token = signToken();

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({ ok: true });
  }

  // Wrong password — check rate limit
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    const mins = limit.blockedUntil
      ? Math.ceil((limit.blockedUntil - Date.now()) / 60000)
      : 60;
    return NextResponse.json(
      { error: `ถูกบล็อคชั่วคราว กรุณาลองใหม่ใน ${mins} นาที`, remaining: 0, blocked: true },
      { status: 429 }
    );
  }

  const result = recordFailedAttempt(ip);
  const msg = result.blocked
    ? `รหัสผ่านไม่ถูกต้อง ถูกบล็อค 1 ชั่วโมง`
    : `รหัสผ่านไม่ถูกต้อง เหลืออีก ${result.remaining} ครั้ง`;
  return NextResponse.json(
    { error: msg, remaining: result.remaining, blocked: result.blocked },
    { status: 401 }
  );
}
