import type { NextConfig } from "next";

function gatewayHost() {
  const def = "https://ipfs.io/ipfs/";
  try {
    const u = new URL(process.env.NEXT_PUBLIC_IPFS_GATEWAY || def);
    return u.host;
  } catch {
    return new URL(def).host;
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: gatewayHost(), pathname: "/**" },
      { protocol: "https", hostname: "ipfs.io", pathname: "/**" },
      { protocol: "https", hostname: "gateway.pinata.cloud", pathname: "/**" },
      { protocol: "https", hostname: "cloudflare-ipfs.com", pathname: "/**" },
      { protocol: "https", hostname: "nftstorage.link", pathname: "/**" }
    ]
  }
};

export default nextConfig;
