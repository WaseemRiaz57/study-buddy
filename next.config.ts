import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { resolve } from "node:path";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: ws: wss:",
  "media-src 'self' blob: data:",
  "frame-src 'self' https:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  // Spline ships modern modules that need to pass through Next's compiler.
  // Keep Next's default conditionNames so ESM imports and CommonJS require()
  // calls resolve the correct package export for their dependency type.
  transpilePackages: ["@splinetool/react-spline"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // react-spline 4.1 only exposes an `import` condition. Resolve this one
      // package explicitly instead of forcing ESM conditions on CommonJS code.
      "@splinetool/react-spline$": resolve(
        process.cwd(),
        "node_modules/@splinetool/react-spline/dist/react-spline.js"
      ),
    };
    return config;
  },
  allowedDevOrigins: ["waseem-study-app.loca.lt"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withPWA(nextConfig);
