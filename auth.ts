import NextAuth from "next-auth";
import Email from "next-auth/providers/email";
import { isAllowed } from "@/lib/allowed-emails";
import "@/lib/firebase-admin";

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  providers: [
    Email({
      server: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "yohaken@gmail.com",
          pass: process.env.EMAIL_PASSWORD,
        },
      },
      from: "NUNGHD4K <yohaken@gmail.com>",
    }),
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      return isAllowed(user.email);
    },
  },
}));
