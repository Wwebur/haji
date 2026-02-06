import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // already present
  trailingSlash: true, // optional but convenient on Apache
  images: {
    unoptimized: true, // ← ❶ THIS turns off /_next/image
  },
};

export default nextConfig;
