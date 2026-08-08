import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["cheerio", "firebase-admin"],
};

export default nextConfig;
