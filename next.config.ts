import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour les images externes (Screenscraper)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.screenscraper.fr',
        pathname: '/**'},
      {
        protocol: 'https',
        hostname: 'media.screenscraper.fr',
        pathname: '/**'},
      {
        protocol: 'https',
        hostname: 'screenscraper.fr',
        pathname: '/**'},
      {
        protocol: 'https',
        hostname: 'neoclone.screenscraper.fr',
        pathname: '/**'},
      {
        protocol: 'https',
        hostname: 'api.screenscraper.fr',
        pathname: '/**'}
    ],
    // Cache optimisé pour les images externes
    minimumCacheTTL: 86400, // 24 heures de cache
    formats: ['image/webp', 'image/avif'], // Formats modernes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Permettre les SVG depuis Screenscraper (logos)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Optimisations expérimentales pour le streaming
  experimental: {
    // Optimisations PPR (Partial Prerendering) pour Next.js 15
    ppr: false // Désactivé pour éviter les problèmes avec les images externes
  },
  
  // External packages pour les Server Components
  serverExternalPackages: ['prisma'],
  
  // Optimisations du build
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'},
  
  // Headers pour les performances et le cache
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400'},
        ]},
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800'},
        ]},
    ];
  }};

export default nextConfig;
