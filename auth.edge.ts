import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth } = NextAuth({
  providers: [
    Credentials({
      name: "firebase",
      credentials: { idToken: { label: "Firebase ID Token", type: "text" } },
      async authorize() {
        // Middleware never calls authorize — real auth happens in auth.ts
        return null;
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `__Secure-authjs.session-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
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

      return isLoggedIn;
    },
  },
});
