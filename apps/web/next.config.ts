import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // standalone is used for Docker builds; set via NEXT_OUTPUT env var
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
};

export default nextConfig;
