import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "nunghd_auth";

function verifyCookie(cookieValue: string): boolean {
  const parts = cookieValue.split(":");
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  if (!ts || !sig || sig.length < 8) return false;

  const age = Date.now() - Number(ts);
  if (isNaN(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1000) return false;

  return true;
}

export default function middleware(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  const url = request.nextUrl.clone();

  if (cookie && verifyCookie(cookie.value)) {
    return NextResponse.next();
  }

  url.pathname = "/login";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api/|login|_next/static|_next/image|favicon.ico).*)"],
};
