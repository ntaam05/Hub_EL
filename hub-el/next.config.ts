import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Tên miền ảnh của Google
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // 🚨 ĐÃ THÊM: Tên miền ảnh của GitHub
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;