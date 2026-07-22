// 상태 확인용 엔드포인트 — 소스별 수집 건수만 보고한다.
// (키 정보는 노출하지 않는다)
// 예: https://kkulcheong.vercel.app/api/health
//
// 소스별 fetch 함수를 매 요청마다 직접 호출하면, 이 엔드포인트를 반복 호출하는
// 것만으로 캐시 없이 외부 API(기업마당/온통청년/K-Startup)를 매번 새로 부르게
// 되어 무료 호출 한도 소진·비용 증가로 이어질 수 있다. 짧은 캐시(1분)를 둬서
// 반복 호출로 인한 외부 API 증폭을 막는다. (lib/policies.ts의 1시간 캐시와는
// 별도 — 헬스체크는 개별 소스 성공/실패를 그대로 보고해야 하므로 분리한다.)

import { fetchBizinfoPolicies } from "@/lib/bizinfo";
import { fetchYouthPolicies } from "@/lib/youth";
import { fetchKstartupPolicies } from "@/lib/kstartup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type HealthResult = {
  status: string;
  sources: Record<string, { ok: boolean; count: number }>;
  tookMs: number;
};

const CACHE_TTL_MS = 60 * 1000; // 1분
let cache: { at: number; data: HealthResult } | null = null;
let inflight: Promise<HealthResult> | null = null;

async function computeHealth(): Promise<HealthResult> {
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

  return { status: healthy ? "ok" : "no-data", sources, tookMs: Date.now() - t0 };
}

async function getHealth(): Promise<HealthResult> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  if (inflight) return inflight;
  inflight = computeHealth()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function GET() {
  const result = await getHealth();
  const healthy = result.status === "ok";
  return Response.json(result, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

