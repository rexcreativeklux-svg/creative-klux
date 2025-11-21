/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Production image CDN
      {
        protocol: 'https',
        hostname: 'images.weviy.com',
      },
      // Your API (for brand logos, etc.)
      {
        protocol: 'https',
        hostname: 'api.weviy.com',
      },
      // Local development (optional but helpful)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000', // adjust if your backend runs on different port
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
      },
    ],
  },
};

export default nextConfig;