// 국민내일배움카드 훈련과정 (고용24 OPEN-API)
//
// 전체는 17만 건이 넘지만 그대로 노출하지 않는다.
//  - 상세페이지를 만들지 않고 원문(고용24)으로 링크한다  → 얇은 페이지 양산 방지
//  - NCS 분야별로 나눠 조회해 분야 쏠림을 막는다
//  - '국민내일배움카드' + 만족도가 집계된 과정만 골라 만족도순으로 큐레이션한다
// 목적은 카탈로그가 아니라 "분야별 괜찮은 과정 추천"이다.

import { str } from "./types";
import { FETCH_NCS, ncsName } from "./ncs";

const BASE =
  "https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do";

const PAGE_SIZE = 100; // API 최대
const PAGES_PER_NCS = 4; // 분야당 400건을 훑는다 (1페이지만 보면 걸러지고 남는 게 거의 없음)
const PER_NCS = 14; // 분야당 최대 노출 수 (쏠림 방지)

export type Course = {
  id: string;
  title: string;
  inst: string; // 훈련기관
  region: string; // 시·도
  address: string;
  start: string; // YYYY-MM-DD
  end: string;
  cost: number; // 수강료(원)
  capacity: number; // 정원
  enrolled: number; // 신청인원
  score: number; // 만족도(100점)
  tel: string;
  url: string; // 고용24 상세
  target: string;
  ncs1: string; // NCS 대분류 코드 2자리
  field: string; // 분야명
};

const SIDO = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

function toRegion(address: string): string {
  const head = str(address).split(/\s+/)[0] ?? "";
  return SIDO.find((s) => head.startsWith(s)) ?? SIDO.find((s) => head.includes(s)) ?? "";
}

const num = (v: string) => Number(str(v).replace(/[^\d.]/g, "")) || 0;

function pick(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function parse(xml: string): Course[] {
  const blocks = xml.match(/<scn_list>[\s\S]*?<\/scn_list>/g) ?? [];
  return blocks.map((b) => {
    const address = pick(b, "address");
    const ncs = pick(b, "ncsCd");
    return {
      id: `${pick(b, "trprId")}-${pick(b, "trprDegr")}`,
      title: pick(b, "title"),
      inst: pick(b, "subTitle"),
      region: toRegion(address),
      address,
      start: pick(b, "traStartDate"),
      end: pick(b, "traEndDate"),
      cost: num(pick(b, "courseMan")),
      capacity: num(pick(b, "yardMan")),
      enrolled: num(pick(b, "regCourseMan")),
      score: num(pick(b, "stdgScor")),
      tel: pick(b, "telNo"),
      url: pick(b, "titleLink").replace(/&amp;/g, "&"),
      target: pick(b, "trainTarget"),
      ncs1: ncs.slice(0, 2),
      field: ncsName(ncs),
    };
  });
}

const ymd = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;

export async function fetchCourses(): Promise<Course[]> {
  const key = process.env.WORK24_API_KEY;
  if (!key) return [];

  const now = new Date();
  const until = new Date(now);
  until.setMonth(until.getMonth() + 3); // 앞으로 3개월 내 시작

  const page = async (ncs: string, pageNum: number) => {
    const p = new URLSearchParams({
      authKey: key,
      returnType: "XML",
      outType: "1",
      pageNum: String(pageNum),
      pageSize: String(PAGE_SIZE),
      srchTraStDt: ymd(now),
      srchTraEndDt: ymd(until),
      srchNcs1: ncs,
      sort: "ASC",
      sortCol: "TRNG_BGDE",
    });
    const res = await fetch(`${BASE}?${p}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`고용24 API 오류: ${res.status}`);
    return parse(await res.text());
  };

  // NCS 분야별로 각각 조회 → 분야 쏠림 방지.
  // 한 페이지(100건)만 보면 카드과정+만족도 조건을 통과하는 게 거의 없어서 여러 페이지를 훑는다.
  const one = async (ncs: string) => {
    const out: Course[] = [];
    for (let i = 1; i <= PAGES_PER_NCS; i++) {
      try {
        out.push(...(await page(ncs, i)));
      } catch {
        break; // 그 분야만 중단, 나머지 분야는 계속
      }
    }
    return out;
  };

  const results = await Promise.allSettled(FETCH_NCS.map(one));

  const seen = new Set<string>();
  const out: Course[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const picked = r.value
      .filter(
        (c) =>
          c.id &&
          c.title &&
          c.target.includes("국민내일배움카드") &&
          c.score > 0 &&
          !seen.has(c.id)
      )
      .sort((a, b) => b.score - a.score || a.start.localeCompare(b.start))
      .slice(0, PER_NCS);
    for (const c of picked) {
      seen.add(c.id);
      out.push(c);
    }
  }

  return out.sort((a, b) => b.score - a.score || a.start.localeCompare(b.start));
}

// lib/policies.ts와 동일한 패턴: Redis 공유 캐시 + 인스턴스 메모리 캐시 +
// stale-while-revalidate (오래된 캐시라도 즉시 반환하고 새로고침은 백그라운드에서)
import { after } from "next/server";
import { kvGetJson, kvSetJson } from "./kv";

const TTL_MS = 60 * 60 * 1000; // 1시간
const STALE_TTL_SECONDS = 6 * 60 * 60; // 6시간
const KV_KEY = "kkulcheong:courses:v1";

let cache: { at: number; data: Course[] } | null = null;
let inflight: Promise<Course[]> | null = null;
let refreshing = false;

async function refreshAndStore(): Promise<Course[]> {
  const data = await fetchCourses();
  const entry = { at: Date.now(), data };
  cache = entry;
  await kvSetJson(KV_KEY, entry, STALE_TTL_SECONDS);
  return data;
}

function fetchFresh(): Promise<Course[]> {
  if (inflight) return inflight;
  inflight = refreshAndStore().finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function getAllCourses(): Promise<Course[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const shared = await kvGetJson<{ at: number; data: Course[] }>(KV_KEY);
  if (shared) {
    cache = shared;
    if (Date.now() - shared.at < TTL_MS) return shared.data;
    if (!refreshing) {
      refreshing = true;
      after(() =>
        fetchFresh()
          .catch((e) => console.error("[training] 백그라운드 새로고침 실패:", e))
          .finally(() => {
            refreshing = false;
          })
      );
    }
    return shared.data;
  }

  return fetchFresh();
}

export async function getCourse(id: string): Promise<Course | null> {
  const all = await getAllCourses();
  return all.find((c) => c.id === id) ?? null;
}

/** 같은 분야(NCS 대분류)의 다른 과정을 만족도순으로 추천 */
export async function getRelatedCourses(id: string, limit = 5): Promise<Course[]> {
  const all = await getAllCourses();
  const me = all.find((c) => c.id === id);
  if (!me) return [];
  return all
    .filter((c) => c.id !== me.id && c.ncs1 === me.ncs1)
    .sort((a, b) => b.score - a.score || a.start.localeCompare(b.start))
    .slice(0, limit);
}


