// 기업마당(정부지원사업) API 수집 + 정규화
// 응답: { "jsonArray": [ {항목}, ... ] }

import {
  type Policy,
  REGION_LIST,
  htmlToText,
  str,
  safeUrl,
  collapseNationwide,
} from "./types";

export type { Policy };

// hashtags 안에서 지역만 골라내기 (전국 포함)
const REGION_TOKENS = [...REGION_LIST, "전국"];

// 정부지원사업 분야 대분류
export const BIZ_CATEGORIES = [
  "창업", "금융", "기술", "경영", "인력", "수출", "내수", "기타",
];

// "2026-07-06 ~ 2026-07-16" → "2026-07-16" / 상시·예산소진 등은 null
function parseEndDate(period: string): string | null {
  if (!period) return null;
  const parts = period.split("~");
  const raw = (parts[1] ?? parts[0] ?? "").trim();
  const m = raw.match(/(\d{4})[-.]?(\d{2})[-.]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function normalize(item: Record<string, unknown>): Policy {
  const tags = str(item.hashtags)
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const regions = collapseNationwide(
    tags.filter((t) => REGION_TOKENS.includes(t))
  );
  const period = str(item.reqstBeginEndDe);
  const full = htmlToText(str(item.bsnsSumryCn));

  return {
    id: str(item.pblancId),
    source: "기업마당",
    title: str(item.pblancNm),
    org: str(item.jrsdInsttNm),
    execOrg: str(item.excInsttNm),
    category: str(item.pldirSportRealmLclasCodeNm) || "기타",
    target: str(item.trgetNm),
    summary: full.replace(/\s+/g, " ").slice(0, 120),
    summaryFull: full,
    applyMethod: htmlToText(str(item.reqstMthPapersCn)),
    contact: htmlToText(str(item.refrncNm)),
    applyUrl: safeUrl(item.rceptEngnHmpgUrl),
    fileUrl: safeUrl(item.flpthNm),
    fileName: str(item.fileNm),
    regions,
    tags,
    url: safeUrl(item.pblancUrl),
    period,
    endDate: parseEndDate(period),
    createdAt: str(item.creatPnttm),
    views: Number(item.inqireCo) || 0,
  };
}

export async function fetchBizinfoPolicies(count = 700): Promise<Policy[]> {
  const key = process.env.BIZINFO_API_KEY;
  if (!key) return []; // 키가 없으면 이 소스만 조용히 건너뜀

  const url = `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${key}&dataType=json&searchCnt=${count}`;
  // 실측 결과 count=1000일 때도 응답이 약 2.49MB로 Next fetch 캐시 한도(2MB)를
  // 넘어 캐시가 전혀 적용되지 않고 있었다(콜드 인스턴스마다 6~7초씩 걸리는 원인).
  // count=700(약 1.7MB)로 줄여 실제로 캐시가 걸리도록 했다. 실제 캐싱은 이 fetch
  // 캐시(1시간) + 페이지 ISR + lib/policies.ts 의 메모리 캐시가 함께 담당한다.
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`기업마당 API 오류: ${res.status}`);

  const json = (await res.json()) as { jsonArray?: Record<string, unknown>[] };
  const items = Array.isArray(json.jsonArray) ? json.jsonArray : [];
  return items.map(normalize).filter((p) => p.id && p.title);
}


