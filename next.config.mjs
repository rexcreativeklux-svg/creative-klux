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