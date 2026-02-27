import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ['mimi.nmco.dpdns.org', 'nmco.dpdns.org', '122.117.166.16'],
  experimental: {
    serverActions: {
      allowedOrigins: ['mimi.nmco.dpdns.org', 'nmco.dpdns.org', '122.117.166.16']
    }
  }
};

export default nextConfig;
