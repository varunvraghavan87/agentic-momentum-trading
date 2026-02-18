import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // standalone is used for Docker builds; set via NEXT_OUTPUT env var
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};

export default nextConfig;
