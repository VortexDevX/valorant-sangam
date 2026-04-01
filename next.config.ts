import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [48, 56, 60, 70, 75],
  },
};

export default nextConfig;
