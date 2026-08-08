import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth, handlers } = NextAuth({
  providers: [
    Credentials({
      name: "firebase",
      credentials: { idToken: { label: "Firebase ID Token", type: "text" } },
      // authorize is only used during sign-in (Node.js API route),
      // the middleware just verifies session tokens.
      // The actual allowlist check happens in auth.ts (the server-side config).
      async authorize(credentials) {
        if (!credentials?.idToken) return null;
        // Minimal stub — real verification happens in auth.ts
        return { id: "pending", email: "pending", name: "pending" };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
});
