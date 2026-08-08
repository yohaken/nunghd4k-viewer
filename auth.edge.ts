import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth, handlers } = NextAuth({
  providers: [
    Credentials({
      name: "firebase",
      credentials: { idToken: { label: "Firebase ID Token", type: "text" } },
      // Minimal stub — real verification happens in auth.ts via server route
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth) return true;
      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false; // redirect to signIn page
      }

      return true;
    },
  },
});
