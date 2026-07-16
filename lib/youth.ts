// 온통청년(청년정책) API 수집 + 정규화
// 응답: { resultCode, result: { pagging:{totCount}, youthPolicyList:[...] } }

import {
  type Policy,
  htmlToText,
  str,
  collapseNationwide,
} from "./types";

// 법정동코드 앞 2자리 → 시·도
const SIDO: Record<string, string> = {
  "11": "서울", "26": "부산", "27": "대구", "28": "인천", "29": "광주",
  "30": "대전", "31": "울산", "36": "세종", "41": "경기",
  "42": "강원", "51": "강원", // 42=강원도(구), 51=강원특별자치도
  "43": "충북", "44": "충남",
  "45": "전북", "52": "전북", // 45=전라북도(구), 52=전북특별자치도
  "46": "전남", "47": "경북", "48": "경남", "50": "제주",
};

// 청년정책 대분류
export const YOUTH_CATEGORIES = [
  "일자리", "주거", "교육･직업훈련", "금융･복지･문화", "참여･기반",
];

// lclsfNm 이 "금융･복지･문화,금융･복지･문화" 처럼 중복 나열되거나
// "참여권리","복지문화","교육" 등 구 분류로 오는 경우가 있어 정리한다.
const LEGACY_CATEGORY: Record<string, string> = {
  참여권리: "참여･기반",
  복지문화: "금융･복지･문화",
  교육: "교육･직업훈련",
  진로: "교육･직업훈련",
};
function cleanCategory(raw: string): string {
  const first = [...new Set(str(raw).split(",").map((v) => v.trim()).filter(Boolean))][0];
  if (!first) return "기타";
  return LEGACY_CATEGORY[first] ?? first;
}

// "20260707 ~ 20260731" → "2026-07-31"
function parseEnd(period: string): string | null {
  const parts = str(period).split("~");
  const raw = (parts[1] ?? parts[0] ?? "").trim();
  const m = raw.match(/(\d{4})[-.]?(\d{2})[-.]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// "20260707 ~ 20260731" → "2026-07-07 ~ 2026-07-31"
function prettyPeriod(period: string): string {
  return str(period).replace(
    /(\d{4})(\d{2})(\d{2})/g,
    (_, y, m, d) => `${y}-${m}-${d}`
  );
}

function regionsFromZip(zipCd: unknown): string[] {
  const codes = str(zipCd).split(",").map((c) => c.trim()).filter(Boolean);
  const names = codes.map((c) => SIDO[c.slice(0, 2)]).filter(Boolean) as string[];
  return collapseNationwide(names);
}

function normalize(it: Record<string, unknown>): Policy {
  const no = str(it.plcyNo);
  const expln = htmlToText(str(it.plcyExplnCn));
  const sprt = htmlToText(str(it.plcySprtCn));
  const full = [expln, sprt].filter(Boolean).join("\n\n");

  const minAge = Number(it.sprtTrgtMinAge) || 0;
  const maxAge = Number(it.sprtTrgtMaxAge) || 0;
  const ageLimitNone = str(it.sprtTrgtAgeLmtYn) === "Y"; // Y = 연령 제한 없음
  const ageText =
    ageLimitNone || (!minAge && !maxAge)
      ? "청년"
      : `만 ${minAge}~${maxAge}세 청년`;

  const extra: { label: string; value: string }[] = [];
  if (!ageLimitNone && (minAge || maxAge))
    extra.push({ label: "지원 연령", value: `만 ${minAge}세 ~ ${maxAge}세` });
  const scale = Number(it.sprtSclCnt) || 0;
  if (scale) extra.push({ label: "지원 규모", value: `${scale.toLocaleString()}명` });
  const cond = htmlToText(str(it.addAplyQlfcCndCn));
  if (cond) extra.push({ label: "추가 자격요건", value: cond });
  const etc = htmlToText(str(it.etcMttrCn));
  if (etc) extra.push({ label: "기타 사항", value: etc });
  const ref = str(it.refUrlAddr1);
  if (ref) extra.push({ label: "참고 링크", value: ref });

  return {
    id: `YTH-${no}`,
    source: "온통청년",
    title: str(it.plcyNm),
    org: str(it.sprvsnInstCdNm), // 주관기관
    execOrg: str(it.operInstCdNm), // 운영기관
    category: cleanCategory(str(it.lclsfNm)),
    target: ageText,
    summary: (expln || sprt).replace(/\s+/g, " ").slice(0, 120),
    summaryFull: full,
    applyMethod: htmlToText(str(it.plcyAplyMthdCn)),
    contact: str(it.operInstCdNm), // 별도 연락처 필드가 없어 운영기관으로 대체
    applyUrl: str(it.aplyUrlAddr),
    fileUrl: "",
    fileName: "",
    regions: regionsFromZip(it.zipCd),
    tags: str(it.plcyKywdNm).split(/[,\s]+/).filter(Boolean),
    url: `https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch/ythPlcyDetail/${no}`,
    period: prettyPeriod(str(it.aplyYmd)),
    endDate: parseEnd(str(it.aplyYmd)),
    createdAt: str(it.frstRegDt),
    views: Number(it.inqCnt) || 0,
    extra,
  };
}

export async function fetchYouthPolicies(): Promise<Policy[]> {
  const key = process.env.YOUTH_API_KEY;
  if (!key) return []; // 키가 없으면 이 소스만 조용히 건너뜀

  const url = `https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${key}&pageNum=1&pageSize=3000&rtnType=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`온통청년 API 오류: ${res.status}`);

  const json = (await res.json()) as {
    resultCode?: number;
    result?: { youthPolicyList?: Record<string, unknown>[] };
  };
  const items = json.result?.youthPolicyList ?? [];
  return items.map(normalize).filter((p) => p.title && p.id !== "YTH-");
}
