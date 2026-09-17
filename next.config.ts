import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (githubPages ? "/rando-ranx" : "");

const nextConfig: NextConfig = {
  output: githubPages ? "export" : undefined,
  trailingSlash: githubPages,
  images: {
    unoptimized: githubPages,
  },
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
