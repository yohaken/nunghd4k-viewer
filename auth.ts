import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowed } from "@/lib/allowed-emails";
import "@/lib/firebase-admin";

// Lazy config: reads env vars at runtime, not build time
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  return {
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    ],
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    pages: {
      signIn: "/login",
      error: "/login",
    },
    callbacks: {
      async signIn({ user }) {
        if (!user.email) return false;
        return isAllowed(user.email);
      },
    },
  };
});
