export { auth as middleware } from "@/auth.edge";

export const config = {
  matcher: ["/((?!api/|login|_next/static|_next/image|favicon.ico).*)"],
};
