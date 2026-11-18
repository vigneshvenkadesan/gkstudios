import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: '.next',
  allowedDevOrigins: [
    '**.run.app',
    '*.run.app',
    '**.aistudio.google.com',
    'aistudio.google.com',
    '**.googleusercontent.com',
    'localhost',
    '127.0.0.1',
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
