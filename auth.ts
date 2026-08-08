import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getAuth } from "firebase-admin/auth";
import { isAllowed } from "@/lib/allowed-emails";
import "@/lib/firebase-admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "firebase",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        const idToken = credentials?.idToken;
        if (typeof idToken !== "string" || !idToken) return null;

        try {
          const decoded = await getAuth().verifyIdToken(idToken);
          if (!decoded.email) return null;
          if (!await isAllowed(decoded.email)) return null;

          return {
            id: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email.split("@")[0],
            image: decoded.picture || "",
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
