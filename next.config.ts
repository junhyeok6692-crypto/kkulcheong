import type { NextConfig } from "next";

// 보안 헤더 — 애드센스 광고(iframe)와 공존 가능한 수준으로 설정
const securityHeaders = [
  // MIME 스니핑 차단
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 다른 사이트가 우리 페이지를 iframe 으로 감싸는 것 차단(클릭재킹)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // 외부로 나갈 때 전체 URL 대신 도메인만 전달
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 불필요한 브라우저 권한 차단
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HTTPS 강제 (배포 후 유효)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // X-Powered-By: Next.js 노출 제거
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
