// 기업마당(정부지원사업) API 수집 + 정규화
// 실제 응답: { "jsonArray": [ {항목}, ... ] }

export type Policy = {
  id: string; // pblancId
  title: string; // pblancNm
  org: string; // jrsdInsttNm (소관기관)
  execOrg: string; // excInsttNm (수행기관)
  category: string; // pldirSportRealmLclasCodeNm (분야)
  target: string; // trgetNm (대상)
  summary: string; // bsnsSumryCn (HTML 제거)
  regions: string[]; // hashtags에서 추출한 지역
  tags: string[]; // hashtags 전체
  url: string; // pblancUrl (상세)
  period: string; // reqstBeginEndDe 원문
  endDate: string | null; // 마감일 (YYYY-MM-DD) — 정렬용
  createdAt: string; // creatPnttm
  views: number; // inqireCo
};

// 대한민국 광역 지역 토큰 (hashtags 안에서 지역만 골라내기)
const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "전국",
];

// 지원 분야 대분류
export const CATEGORIES = [
  "금융", "기술", "인력", "수출", "내수", "창업", "경영", "기타",
];

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "2026-07-06 ~ 2026-07-16" → "2026-07-16" / 상시·예산소진 등은 null
function parseEndDate(period: string): string | null {
  if (!period) return null;
  const parts = period.split("~");
  const raw = (parts[1] ?? parts[0] ?? "").trim();
  const m = raw.match(/(\d{4})[-.]?(\d{2})[-.]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function normalize(item: Record<string, unknown>): Policy {
  const s = (v: unknown) => (v == null ? "" : String(v).trim());
  const tags = s(item.hashtags)
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  let regions = [...new Set(tags.filter((t) => REGIONS.includes(t)))];
  // 지역이 8곳 이상 붙은 공고는 사실상 전국 대상 → '전국'으로 정리
  if (regions.filter((r) => r !== "전국").length >= 8) regions = ["전국"];
  const period = s(item.reqstBeginEndDe);

  return {
    id: s(item.pblancId),
    title: s(item.pblancNm),
    org: s(item.jrsdInsttNm),
    execOrg: s(item.excInsttNm),
    category: s(item.pldirSportRealmLclasCodeNm) || "기타",
    target: s(item.trgetNm),
    summary: stripHtml(s(item.bsnsSumryCn)),
    regions,
    tags,
    url: s(item.pblancUrl),
    period,
    endDate: parseEndDate(period),
    createdAt: s(item.creatPnttm),
    views: Number(item.inqireCo) || 0,
  };
}

export async function fetchPolicies(count = 100): Promise<Policy[]> {
  const key = process.env.BIZINFO_API_KEY;
  if (!key) throw new Error("BIZINFO_API_KEY 환경변수가 없습니다.");

  const url = `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${key}&dataType=json&searchCnt=${count}`;

  // 1시간마다 재검증 (ISR) — 매 요청마다 외부 API를 때리지 않음
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`기업마당 API 오류: ${res.status}`);

  const json = (await res.json()) as { jsonArray?: Record<string, unknown>[] };
  const items = Array.isArray(json.jsonArray) ? json.jsonArray : [];
  return items.map(normalize).filter((p) => p.id && p.title);
}
