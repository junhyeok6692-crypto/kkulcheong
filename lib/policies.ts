// 여러 소스를 합쳐 하나의 목록으로 제공 (+ 메모리 캐시)

import type { Policy } from "./types";
import { daysLeft } from "./types";
import { fetchBizinfoPolicies } from "./bizinfo";
import { fetchYouthPolicies } from "./youth";
import { fetchKstartupPolicies } from "./kstartup";

const TTL_MS = 60 * 60 * 1000; // 1시간
let cache: { at: number; data: Policy[] } | null = null;
let inflight: Promise<Policy[]> | null = null;

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
