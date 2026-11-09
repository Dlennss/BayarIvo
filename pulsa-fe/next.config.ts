import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.platform === "win32" ? undefined : "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    // Legacy screens contain fixed category IDs and sample providers.
    const catalogAliases: Record<string, string> = {
      pulsa: "Pulsa", "pulsa-data": "", "paket-data": "Paket Data",
      ewallet: "E-Wallet", listrik: "PLN", game: "Game", tv: "TV & Streaming",
      pdam: "Tagihan Air", pgn: "Tagihan Gas", bpjs: "BPJS",
      "hp-pascabayar": "Pascabayar", "internet-pascabayar": "Internet & Telco",
      "paket-telepon": "Telepon & SMS", "transfer-bank": "Transfer Bank",
      "aktivasi-perdana": "", "masa-aktif": "",
    };
    return [
      ...["", "/user"].flatMap(prefix => Object.entries(catalogAliases).map(([slug, query]) => ({
        source: `${prefix}/${slug}/:path*`,
        destination: `${prefix}/kategori${query ? `?q=${encodeURIComponent(query)}` : ""}`,
        permanent: false,
      }))),
      {
        source: "/admin",
        destination: "/dashboard/admin",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/dashboard/admin/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
