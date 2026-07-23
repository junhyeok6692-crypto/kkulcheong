// 여러 소스를 합쳐 하나의 목록으로 제공 (+ Redis 공유 캐시 + 인스턴스 메모리 캐시)
//
// 이전에는 인스턴스별 메모리 변수(let cache)만 썼는데, Vercel 서버리스는 요청마다
// 다른 인스턴스로 갈 수 있어 인스턴스가 바뀌면 캐시가 없는 것처럼 매번 외부 API를
// 새로 불러야 했다(그래서 어떤 요청은 빠르고 어떤 요청은 몇 초씩 걸리는 문제 발생).
// 이제 모든 인스턴스가 공유하는 Redis에 결과를 저장해 이 문제를 없앤다.
// 또한 캐시가 오래됐어도(신선하지 않아도) 일단 있는 데이터를 즉시 반환하고,
// 새로고침은 응답을 보낸 뒤 백그라운드에서 진행한다(stale-while-revalidate) —
// 사용자가 외부 API 응답을 기다리는 경우를 최소화한다.

import { after } from "next/server";
import type { Policy, PolicyListItem } from "./types";
import { daysLeft, toListItem } from "./types";
import { fetchBizinfoPolicies } from "./bizinfo";
import { fetchYouthPolicies } from "./youth";
import { fetchKstartupPolicies } from "./kstartup";
import { kvGetJson, kvSetJson } from "./kv";

const TTL_MS = 60 * 60 * 1000; // 1시간 - 이 안이면 "신선"하다고 보고 바로 반환
const STALE_TTL_SECONDS = 6 * 60 * 60; // 6시간 - Redis에는 이만큼 더 오래 들고 있는다
const KV_KEY = "kkulcheong:policies:v1";
// 목록 화면은 상세 필드(전문 설명·첨부파일 등)가 필요 없다. 콜드 인스턴스가 Redis에서
// 매번 전체 데이터를 받아 파싱하는 비용을 줄이려고, 이미 축약한 목록 전용 캐시를 따로 둔다.
const LIST_KV_KEY = "kkulcheong:policies:list:v1";

let cache: { at: number; data: Policy[] } | null = null;
let listCache: { at: number; data: PolicyListItem[] } | null = null;
let inflight: Promise<Policy[]> | null = null;
let refreshing = false; // 같은 인스턴스에서 백그라운드 새로고침 중복 방지

const CAPITAL_REGIONS = ["서울", "인천", "경기"];

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

  // 마감임박순 (상시/마감은 뒤로), 같은 마감일이면 수도권(서울·인천·경기) 우선
  const rank = (p: Policy) => {
    const d = daysLeft(p.endDate);
    if (d === null) return Infinity;
    return d < 0 ? Infinity : d;
  };
  const isCapital = (p: Policy) =>
    p.regions.some((r) => CAPITAL_REGIONS.includes(r));
  return merged.sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    const ca = isCapital(a);
    const cb = isCapital(b);
    if (ca !== cb) return ca ? -1 : 1;
    return 0;
  });
}

async function refreshAndStore(): Promise<Policy[]> {
  const data = await fetchAll();
  const at = Date.now();
  const entry = { at, data };
  cache = entry;
  const listEntry = { at, data: data.map(toListItem) };
  listCache = listEntry;
  await Promise.all([
    kvSetJson(KV_KEY, entry, STALE_TTL_SECONDS),
    kvSetJson(LIST_KV_KEY, listEntry, STALE_TTL_SECONDS),
  ]);
  return data;
}

function fetchFresh(): Promise<Policy[]> {
  if (inflight) return inflight; // 동시 요청 합치기
  inflight = refreshAndStore().finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function getAllPolicies(): Promise<Policy[]> {
  // 1. 이 인스턴스가 이미 최근에 받아온 데이터가 있으면 그대로 반환 (가장 빠름)
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  // 2. 다른 인스턴스가 Redis에 저장해둔 데이터가 있는지 확인 (인스턴스 간 공유)
  const shared = await kvGetJson<{ at: number; data: Policy[] }>(KV_KEY);
  if (shared) {
    cache = shared; // 이 인스턴스 메모리에도 채워서 다음 요청부터는 1번으로 빠지게 함
    if (Date.now() - shared.at < TTL_MS) {
      return shared.data; // 신선함 - 바로 반환
    }
    // 오래됐지만 있음 - 일단 그대로 보여주고, 응답 이후 백그라운드에서 새로고침
    if (!refreshing) {
      refreshing = true;
      after(() =>
        fetchFresh()
          .catch((e) => console.error("[policies] 백그라운드 새로고침 실패:", e))
          .finally(() => {
            refreshing = false;
          })
      );
    }
    return shared.data;
  }

  // 3. 어디에도 캐시가 없음 - 정말 처음이라 어쩔 수 없이 기다려야 한다
  return fetchFresh();
}

/**
 * 목록 화면 전용 — 축약된 필드만 담긴 캐시를 우선 사용해 콜드 인스턴스에서도
 * Redis 전송·파싱량을 줄인다. 축약 캐시가 아직 없으면(첫 배포 직후 등)
 * getAllPolicies()로 폴백하고, 그 결과가 다음부터는 축약 캐시도 채운다.
 */
export async function getAllPolicyListItems(): Promise<PolicyListItem[]> {
  if (listCache && Date.now() - listCache.at < TTL_MS) return listCache.data;

  const shared = await kvGetJson<{ at: number; data: PolicyListItem[] }>(LIST_KV_KEY);
  if (shared) {
    listCache = shared;
    if (Date.now() - shared.at < TTL_MS) return shared.data;
    if (!refreshing) {
      refreshing = true;
      after(() =>
        fetchFresh()
          .catch((e) => console.error("[policies] 백그라운드 새로고침 실패:", e))
          .finally(() => {
            refreshing = false;
          })
      );
    }
    return shared.data;
  }

  const all = await fetchFresh();
  return all.map(toListItem);
}

export async function getPolicy(id: string): Promise<Policy | null> {
  const all = await getAllPolicies();
  return all.find((p) => p.id === id) ?? null;
}

// 서로 다른 분야라도 실제로 같이 신청하면 시너지가 있는 조합.
// (예: 직업훈련을 받는 사람은 훈련 기간 생활비 지원과, 창업을 준비하는 사람은
// 자금·인력 지원과 함께 보면 도움이 되는 경우가 많다는 실무 판단을 반영)
// 값은 대칭이 아니어도 된다 — getRelated에서 양방향으로 조회한다.
const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  창업: ["금융", "기술", "인력"],
  금융: ["창업", "경영"],
  기술: ["창업", "수출"],
  경영: ["금융", "인력", "내수"],
  인력: ["창업", "경영", "교육･직업훈련"],
  수출: ["기술", "경영"],
  내수: ["경영"],
  일자리: ["교육･직업훈련", "창업"],
  주거: ["일자리"],
  "교육･직업훈련": ["일자리", "인력"],
  "금융･복지･문화": ["일자리", "주거"],
  "참여･기반": ["교육･직업훈련"],
};

function isComplementary(a: string, b: string): boolean {
  return (
    (COMPLEMENTARY_CATEGORIES[a] ?? []).includes(b) ||
    (COMPLEMENTARY_CATEGORIES[b] ?? []).includes(a)
  );
}

/**
 * 유사 정책 추천 — 같은 분야 > 태그 겹침 > 보완 분야 > 같은 지역 > 마감임박 순으로 점수를 매긴다.
 * 상세페이지 하단에 노출해 다음 공고로 이어지게 한다.
 */
export async function getRelated(id: string, limit = 5): Promise<Policy[]> {
  const all = await getAllPolicies();
  const me = all.find((p) => p.id === id);
  if (!me) return [];

  const dleft = (p: Policy) => daysLeft(p.endDate);

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

      // 태그 겹침 (분야는 달라도 실제 내용이 비슷한 경우를 잡아낸다)
      const sharedTags = p.tags.filter((t) => me.tags.includes(t)).length;
      score += Math.min(sharedTags, 3) * 3;

      // 분야는 다르지만 같이 신청하면 시너지가 있는 조합
      if (p.category !== me.category && isComplementary(me.category, p.category)) {
        score += 6;
      }

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


