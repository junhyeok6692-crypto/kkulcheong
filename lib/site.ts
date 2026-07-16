// 사이트 기준 URL (sitemap / canonical / OG 에 사용)
//
// 우선순위
//  1) NEXT_PUBLIC_SITE_URL      — 커스텀 도메인 (예: https://kkulcheong.com)
//  2) VERCEL_PROJECT_PRODUCTION_URL — Vercel 프로덕션 주소 (예: kkulcheong.vercel.app)
//  3) localhost                 — 로컬 개발
//
// 2) 덕분에 도메인을 사기 전에 배포해도 sitemap 에 localhost 가 박히지 않는다.

function resolve(): string {
  const custom = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (custom) return custom.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolve();
