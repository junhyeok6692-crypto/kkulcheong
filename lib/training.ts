// 국민내일배움카드 훈련과정 (고용24 OPEN-API)
//
// 전체는 17만 건이 넘지만 그대로 노출하지 않는다.
//  - 상세페이지를 만들지 않고 원문(고용24)으로 링크한다  → 얇은 페이지 양산 방지
//  - '국민내일배움카드(일반)' + 만족도 보유 과정만 골라 만족도순으로 큐레이션한다
// 목적은 카탈로그가 아니라 "괜찮은 과정 추천"이다.

import { str } from "./types";

const BASE =
  "https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do";

const PAGES = 10; // 100건 x 10 = 1,000건을 훑어 그중에서 고른다
const PAGE_SIZE = 100;
export const MAX_COURSES = 120;

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
  target: string; // 국민내일배움카드(일반) 등
};

const SIDO = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

/** "경기 성남시 분당구" → "경기" / "전남광주 광산구" 같은 변형도 처리 */
function toRegion(address: string): string {
  const head = str(address).split(/\s+/)[0] ?? "";
  return SIDO.find((s) => head.startsWith(s)) ?? SIDO.find((s) => head.includes(s)) ?? "";
}

const num = (v: string) => Number(str(v).replace(/[^\d.]/g, "")) || 0;

// XML 파서 대신 태그 추출 (의존성 없이 가볍게)
function pick(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function parse(xml: string): Course[] {
  const blocks = xml.match(/<scn_list>[\s\S]*?<\/scn_list>/g) ?? [];
  return blocks.map((b) => {
    const address = pick(b, "address");
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
  until.setMonth(until.getMonth() + 3); // 앞으로 3개월 내 시작하는 과정

  const one = async (page: number) => {
    const p = new URLSearchParams({
      authKey: key,
      returnType: "XML",
      outType: "1",
      pageNum: String(page),
      pageSize: String(PAGE_SIZE),
      srchTraStDt: ymd(now),
      srchTraEndDt: ymd(until),
      sort: "ASC",
      sortCol: "TRNG_BGDE",
    });
    const res = await fetch(`${BASE}?${p}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`고용24 API 오류: ${res.status}`);
    return parse(await res.text());
  };

  const results = await Promise.allSettled(
    Array.from({ length: PAGES }, (_, i) => one(i + 1))
  );
  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // 중복 제거
  const seen = new Set<string>();
  const uniq = all.filter((c) => {
    if (!c.id || !c.title || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // 큐레이션: 개인이 쓰는 내일배움카드 과정 + 만족도가 집계된 과정만
  return uniq
    .filter((c) => c.target.includes("국민내일배움카드") && c.score > 0)
    .sort((a, b) => b.score - a.score || a.start.localeCompare(b.start))
    .slice(0, MAX_COURSES);
}
