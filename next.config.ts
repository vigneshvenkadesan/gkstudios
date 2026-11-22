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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
