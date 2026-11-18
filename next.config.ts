import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function nextConfig(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next' : 'dist',
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
}
