import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["cheerio", "firebase-admin", "nodemailer"],
};

export default nextConfig;
