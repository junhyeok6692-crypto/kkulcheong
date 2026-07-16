// 상태 확인용 엔드포인트 — 소스별 수집 건수만 보고한다.
// (키 정보는 노출하지 않는다)
// 예: https://kkulcheong.vercel.app/api/health

import { fetchBizinfoPolicies } from "@/lib/bizinfo";
import { fetchYouthPolicies } from "@/lib/youth";
import { fetchKstartupPolicies } from "@/lib/kstartup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const t0 = Date.now();
  const [biz, youth, kst] = await Promise.allSettled([
    fetchBizinfoPolicies(),
    fetchYouthPolicies(),
    fetchKstartupPolicies(),
  ]);

  const stat = (r: PromiseSettledResult<unknown[]>) =>
    r.status === "fulfilled"
      ? { ok: true, count: r.value.length }
      : { ok: false, count: 0 };

  const sources = { bizinfo: stat(biz), youth: stat(youth), kstartup: stat(kst) };
  const healthy =
    sources.bizinfo.count + sources.youth.count + sources.kstartup.count > 0;

  return Response.json(
    { status: healthy ? "ok" : "no-data", sources, tookMs: Date.now() - t0 },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
