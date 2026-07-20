// 여러 소스를 합쳐 하나의 목록으로 제공 (+ 메모리 캐시)

import type { Policy } from "./types";
import { fetchBizinfoPolicies } from "./bizinfo";
import { fetchYouthPolicies } from "./youth";
import { fetchKstartupPolicies } from "./kstartup";

const TTL_MS = 60 * 60 * 1000; // 1시간
let cache: { at: number; data: Policy[] } | null = null;
let inflight: Promise<Policy[]> | null = null;

async function fetchAll(): Promise<Policy[]> {
  // 한 소스가 실패해도 나머지는 살린다
  const results = await Promise.allSettled([
    fetchBizinfoPolicies(),
    fetchYouthPolicies(),
    fetchKstartupPolicies(),
  ]);

  const merged: Policy[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") merged.push(...r.value);
    else console.error("[policies] 소스 수집 실패:", r.reason);
  }

  // 마감임박순 (상시/마감은 뒤로)
  const rank = (p: Policy) => {
    if (!p.endDate) return Infinity;
    const d = Math.ceil(
      (new Date(p.endDate + "T23:59:59+09:00").getTime() - Date.now()) / 86400000
    );
    return d < 0 ? Infinity : d;
  };
  return merged.sort((a, b) => rank(a) - rank(b));
}

export async function getAllPolicies(): Promise<Policy[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  if (inflight) return inflight; // 동시 요청 합치기
  inflight = fetchAll()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function getPolicy(id: string): Promise<Policy | null> {
  const all = await getAllPolicies();
  return all.find((p) => p.id === id) ?? null;
}

/**
 * 유사 정책 추천 — 같은 분야 > 같은 지역 > 마감임박 순으로 점수를 매긴다.
 * 상세페이지 하단에 노출해 다음 공고로 이어지게 한다.
 */
export async function getRelated(id: string, limit = 5): Promise<Policy[]> {
  const all = await getAllPolicies();
  const me = all.find((p) => p.id === id);
  if (!me) return [];

  const now = Date.now();
  const dleft = (p: Policy) =>
    p.endDate
      ? Math.ceil((new Date(p.endDate + "T23:59:59+09:00").getTime() - now) / 86400000)
      : null;

  return all
    .filter((p) => {
      if (p.id === me.id) return false;
      const d = dleft(p);
      return d === null || d >= 0; // 마감된 건 추천하지 않음
    })
    .map((p) => {
      let score = 0;
      if (p.category === me.category) score += 10;
      if (p.source === me.source) score += 2;
      const shared = p.regions.filter((r) => me.regions.includes(r)).length;
      score += Math.min(shared, 2) * 4;
      if (me.regions.length === 0 || p.regions.includes("전국")) score += 1;
      const d = dleft(p);
      if (d !== null && d <= 14) score += 2; // 마감 임박한 것 우선
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = dleft(a.p) ?? 9999;
      const db = dleft(b.p) ?? 9999;
      return da - db;
    })
    .slice(0, limit)
    .map((x) => x.p);
}
