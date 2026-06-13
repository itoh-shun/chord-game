import type { NextConfig } from "next";

// GitHub Pages(プロジェクトページ)向けの静的書き出し設定。
// Actions では GITHUB_PAGES=true をセットしてサブパス配信にする。
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "chord-game";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isPages ? `/${repo}` : "",
  assetPrefix: isPages ? `/${repo}/` : "",
  trailingSlash: true,
  // public/ 配下(サンプル音源など)を参照するためのベースパス
  env: { NEXT_PUBLIC_BASE_PATH: isPages ? `/${repo}` : "" },
};

export default nextConfig;
