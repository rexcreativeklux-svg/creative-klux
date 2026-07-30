/** @type {import('next').NextConfig} */
const nextConfig = {
  // Old flat URLs → new section URLs (sidebar restructure: Ad Intelligence,
  // Social Content and Ads Content became sections with a secondary sidebar).
  // Kept non-permanent (307) so cached 308s can't bite if routes move again.
  async redirects() {
    return [
      { source: '/ad-performance', destination: '/ad-intelligence/ad-performance', permanent: false },
      { source: '/market-spy', destination: '/ad-intelligence/market-spy', permanent: false },
      { source: '/ad-guard-ai', destination: '/ad-intelligence/ad-guard-ai', permanent: false },
      { source: '/ad-scorer-ai', destination: '/ad-intelligence/ad-scorer-ai', permanent: false },
      { source: '/creative-comparison', destination: '/ad-intelligence/creative-comparison', permanent: false },
      { source: '/social-publishing', destination: '/social-content/publishing', permanent: false },
      { source: '/social-calendar', destination: '/social-content/calendar', permanent: false },
      { source: '/social-analytics', destination: '/social-content/analytics', permanent: false },
      { source: '/ads-publishing', destination: '/ads-content/publishing', permanent: false },
      { source: '/ads-calendar', destination: '/ads-content/calendar', permanent: false },
      { source: '/ads-analytics', destination: '/ads-content/analytics', permanent: false },
    ];
  },
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
  // onnxruntime-web (the on-device AI engine) runs ONLY in the browser/worker.
  // Keep its heavy WASM payloads — and any node-only ORT/sharp variants it may
  // reference — out of the serverless function bundle so tracing stays small.
  outputFileTracingExcludes: {
    '*': [
      'node_modules/onnxruntime-web/**',
      'node_modules/onnxruntime-node/**',
      'node_modules/onnxruntime-common/**',
      'node_modules/@img/**',
      'node_modules/sharp/**',
    ],
  },
  // Next 16 runs Turbopack by default. An empty config opts in explicitly and
  // silences the "webpack config with no turbopack config" error. The engine
  // imports only `onnxruntime-web` (a browser package) and loads the ORT WASM
  // runtime from the static `/ort/` path — no custom bundler rules are needed,
  // so Turbopack works out of the box here.
  turbopack: {},
};

export default nextConfig;