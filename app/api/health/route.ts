// 배포 진단용 엔드포인트 — 키 값은 노출하지 않고 "있는지/작동하는지"만 보고한다.
// 예: https://kkulcheong.vercel.app/api/health

import { fetchBizinfoPolicies } from "@/lib/bizinfo";
import { fetchYouthPolicies } from "@/lib/youth";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic"; // 항상 실시간 확인
export const maxDuration = 60;

const mask = (v?: string) =>
  !v ? "(없음)" : `${v.slice(0, 2)}***${v.slice(-2)} (${v.length}자)`;

export async function GET() {
  const t0 = Date.now();
  const [biz, youth] = await Promise.allSettled([
    fetchBizinfoPolicies(),
    fetchYouthPolicies(),
  ]);

  const body = {
    siteUrl: SITE_URL,
    env: {
      BIZINFO_API_KEY: mask(process.env.BIZINFO_API_KEY),
      YOUTH_API_KEY: mask(process.env.YOUTH_API_KEY),
      VERCEL_PROJECT_PRODUCTION_URL:
        process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "(없음)",
    },
    sources: {
      기업마당:
        biz.status === "fulfilled"
          ? { ok: true, count: biz.value.length }
          : { ok: false, error: String(biz.reason).slice(0, 300) },
      온통청년:
        youth.status === "fulfilled"
          ? { ok: true, count: youth.value.length }
          : { ok: false, error: String(youth.reason).slice(0, 300) },
    },
    tookMs: Date.now() - t0,
  };

  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
