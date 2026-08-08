import NextAuth from "next-auth";

export const { auth } = NextAuth({
  providers: [],
  secret: process.env.AUTH_SECRET,
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
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
});
