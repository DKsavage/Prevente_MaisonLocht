import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'otlhqcducuqnllsoaczy.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    // Upload de photos via Server Actions (défaut 1 MB → trop petit pour une photo)
    serverActions: { bodySizeLimit: '12mb' },
  },
};

export default nextConfig;
