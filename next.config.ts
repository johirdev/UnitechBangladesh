import type { NextConfig } from "next";

// NEXT_PUBLIC_API_URL দিলে /api/v1 সেখানে প্রক্সি হয় (যেমন localhost থেকে Vercel এর API)।
// না দিলে (Vercel এ) src/pages/api/v1 এর ভেতরের Express API নিজেই উত্তর দেয়।
// Vercel এ API নিজের ভেতরেই আছে — সেখানে প্রক্সি করলে নিজেকেই কল করে 508 লুপ হয়, তাই Vercel এ কখনো প্রক্সি নয়
const API_URL = process.env.VERCEL ? "" : (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  // ব্রাউজার সবসময় একই ডোমেইনে /api/v1 কল করে — কুকি first-party থাকে (নিরাপদ)
  async rewrites() {
    if (!API_URL) return [];
    return { beforeFiles: [{ source: "/api/v1/:path*", destination: `${API_URL}/api/v1/:path*` }], afterFiles: [], fallback: [] };
  },
  async redirects() {
    return [{ source: "/unitech-architctural", destination: "/unitech-architectural", permanent: true }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
