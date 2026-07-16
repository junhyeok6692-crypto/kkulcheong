// 여러 소스를 합쳐 하나의 목록으로 제공 (+ 메모리 캐시)

import type { Policy } from "./types";
import { fetchBizinfoPolicies } from "./bizinfo";
import { fetchYouthPolicies } from "./youth";

const TTL_MS = 60 * 60 * 1000; // 1시간
let cache: { at: number; data: Policy[] } | null = null;
let inflight: Promise<Policy[]> | null = null;

async function fetchAll(): Promise<Policy[]> {
  // 한 소스가 실패해도 나머지는 살린다
  const results = await Promise.allSettled([
    fetchBizinfoPolicies(),
    fetchYouthPolicies(),
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
      (new Date(p.endDate + "T23:59:59").getTime() - Date.now()) / 86400000
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
