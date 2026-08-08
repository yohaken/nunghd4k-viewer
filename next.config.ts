import type { NextConfig } from "next";
import { execSync } from "child_process";

const BUILD_VERSION = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
})();

const BUILD_TIME = new Date().toISOString();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["cheerio", "firebase-admin"],
  env: {
    BUILD_VERSION,
    BUILD_TIME,
  },
};

export default nextConfig;
