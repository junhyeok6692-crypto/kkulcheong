// 여러 소스(기업마당, 온통청년...)를 담는 공용 데이터 모델

export type Source = "기업마당" | "온통청년";

export type Policy = {
  id: string; // 소스별 고유 ID (온통청년은 YTH- 접두)
  source: Source;
  title: string;
  org: string; // 소관/주관기관
  execOrg: string; // 수행/운영기관
  category: string; // 분야 (소스별 분류 체계)
  target: string; // 지원대상
  summary: string; // 목록용 짧은 요약(한 줄)
  summaryFull: string; // 상세용 본문(문단 유지)
  applyMethod: string; // 신청방법
  contact: string; // 문의처
  applyUrl: string; // 신청/접수 링크
  fileUrl: string; // 첨부파일
  fileName: string;
  regions: string[]; // 시·도
  tags: string[];
  url: string; // 원문 공고 링크
  period: string; // 신청기간 원문
  endDate: string | null; // 마감일 (YYYY-MM-DD)
  createdAt: string;
  views: number;
  extra?: { label: string; value: string }[]; // 소스별 추가 정보(상세페이지 표)
  elig?: Eligibility; // 자격 조건 (청년정책만 제공)
};

/** 자격 자가진단용 조건. 값이 없으면 '조건 없음'으로 본다. */
export type Eligibility = {
  minAge: number | null;
  maxAge: number | null;
  ageLimitNone: boolean;
  earnKind: string; // 무관 | 연소득 | 기타
  earnMin: number; // 만원
  earnMax: number; // 만원
  jobs: string[]; // 재직자, 미취업자 ...
  schools: string[]; // 대학 재학, 대졸 ...
  marriage: string[]; // 기혼 | 미혼 | 제한없음
  specials: string[]; // 여성, 장애인 ...
};

// 목록 화면에 필요한 필드만 추린 형태.
// 상세 전용 필드(summaryFull, applyMethod, contact, extra 등)는 용량이 커서
// 목록에 내려보내지 않는다. (공고 4,000여 건 × 본문 = 수 MB 절감)
export type PolicyListItem = Pick<
  Policy,
  | "id"
  | "source"
  | "title"
  | "org"
  | "category"
  | "target"
  | "summary"
  | "regions"
  | "tags"
  | "url"
  | "period"
  | "endDate"
  | "elig"
>;

export function toListItem(p: Policy): PolicyListItem {
  return {
    id: p.id,
    source: p.source,
    title: p.title,
    org: p.org,
    category: p.category,
    target: p.target,
    summary: p.summary,
    regions: p.regions,
    tags: p.tags,
    url: p.url,
    period: p.period,
    endDate: p.endDate,
    elig: p.elig,
  };
}

// 시·도 (지역 필터 기준)
export const REGION_LIST = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

// HTML → 텍스트 (문단 유지, 태그 제거로 XSS 안전)
export function htmlToText(html: string): string {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const str = (v: unknown) => (v == null ? "" : String(v).trim());

// 외부 API가 주는 URL은 http/https 만 허용한다.
// (javascript:, data: 등이 href 에 들어가면 XSS 가 되므로 차단)
export function safeUrl(v: unknown): string {
  const s = str(v);
  if (!/^https?:\/\//i.test(s)) return "";
  try {
    return new URL(s).toString();
  } catch {
    return "";
  }
}

// 지역이 8곳 이상이면 사실상 전국
export function collapseNationwide(regions: string[]): string[] {
  const r = [...new Set(regions)];
  return r.filter((x) => x !== "전국").length >= 8 ? ["전국"] : r;
}
