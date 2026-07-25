import type { NextConfig } from "next";

const isEmbeddedBuild = process.env.SUB2API_EMBEDDED === "1";
const assetPrefix = isEmbeddedBuild ? "/imgx-studio" : process.env.NEXT_ASSET_PREFIX;

const nextConfig: NextConfig = {
  output: isEmbeddedBuild ? "export" : "standalone",
  assetPrefix: assetPrefix || undefined,
  basePath: isEmbeddedBuild ? "/imgx-studio" : undefined,
  images: { unoptimized: isEmbeddedBuild },
  trailingSlash: isEmbeddedBuild,
};

export default nextConfig;
