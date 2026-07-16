// K-Startup(창업진흥원) 창업지원사업 공고 수집 + 정규화
// 출처: 공공데이터포털 apis.data.go.kr/B552735/kisedKstartupService01
// 전체 29,000여 건 중 모집중(rcrt_prgs_yn=Y)만 가져온다 (약 260건).

import {
  type Policy,
  htmlToText,
  str,
  safeUrl,
  collapseNationwide,
} from "./types";

const BASE =
  "https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01";

// 지원지역 → 시·도 (우리 지역 필터 기준에 맞춤)
const REGION_FIX: Record<string, string> = {
  서울: "서울", 부산: "부산", 대구: "대구", 인천: "인천", 광주: "광주",
  대전: "대전", 울산: "울산", 세종: "세종", 경기: "경기", 강원: "강원",
  충북: "충북", 충남: "충남", 전북: "전북", 전남: "전남", 경북: "경북",
  경남: "경남", 제주: "제주", 전국: "전국",
};

// API 가 HTML 엔티티를 그대로 준다 (예: "기술개발(R&amp;D)")
const unescape = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

// "20260715" → "2026-07-15"
const fmt = (d: string) => {
  const m = str(d).match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

function normalize(it: Record<string, unknown>): Policy {
  const sn = str(it.pbanc_sn);
  const begin = fmt(str(it.pbanc_rcpt_bgng_dt));
  const end = fmt(str(it.pbanc_rcpt_end_dt));
  const period = begin && end ? `${begin} ~ ${end}` : begin || end;

  // detl_pg_url 이 "www.k-startup.go.kr/..." 처럼 스킴 없이 오는 경우가 있다
  const raw = str(it.detl_pg_url);
  const detail = raw
    ? safeUrl(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    : "";

  // 접수 방법 (온라인/이메일/방문/팩스/기타)
  const methods = [
    ["온라인", str(it.aply_mthd_onli_rcpt_istc)],
    ["이메일", str(it.aply_mthd_eml_rcpt_istc)],
    ["방문", str(it.aply_mthd_pssr_rcpt_istc)],
    ["팩스", str(it.aply_mthd_fax_rcpt_istc)],
    ["기타", str(it.aply_mthd_etc_istc)],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);

  const regions = collapseNationwide(
    unescape(str(it.supt_regin))
      .split(/[,·]/)
      .map((r) => REGION_FIX[r.trim()])
      .filter(Boolean) as string[]
  );

  const extra: { label: string; value: string }[] = [];
  const enyy = unescape(str(it.biz_enyy));
  if (enyy) extra.push({ label: "업력", value: enyy });
  const age = unescape(str(it.biz_trgt_age));
  if (age) extra.push({ label: "대상 연령", value: age });
  const dept = str(it.biz_prch_dprt_nm);
  if (dept) extra.push({ label: "담당 부서", value: dept });
  const inst = str(it.sprv_inst);
  if (inst) extra.push({ label: "감독기관", value: inst });

  const body = htmlToText(unescape(str(it.pbanc_ctnt)));
  const target =
    unescape(str(it.aply_trgt_ctnt)) || unescape(str(it.aply_trgt)) || "창업자";

  return {
    id: `KST-${sn}`,
    source: "K-Startup",
    title: unescape(str(it.biz_pbanc_nm)),
    org: str(it.pbanc_ntrp_nm) || "창업진흥원",
    execOrg: dept,
    category: unescape(str(it.supt_biz_clsfc)) || "기타",
    target,
    summary: body.replace(/\s+/g, " ").slice(0, 120),
    summaryFull: body,
    applyMethod: methods.join("\n"),
    contact: str(it.prch_cnpl_no),
    applyUrl: safeUrl(str(it.aply_mthd_onli_rcpt_istc)),
    fileUrl: "",
    fileName: "",
    regions,
    tags: [unescape(str(it.supt_biz_clsfc))].filter(Boolean),
    url: detail || "https://www.k-startup.go.kr",
    period,
    endDate: end || null,
    createdAt: begin,
    views: 0,
    extra,
  };
}

export async function fetchKstartupPolicies(): Promise<Policy[]> {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) return []; // 키가 없으면 이 소스만 조용히 건너뜀

  const params = new URLSearchParams({
    serviceKey: key,
    returnType: "json",
    page: "1",
    perPage: "1000",
    "cond[rcrt_prgs_yn::EQ]": "Y", // 모집중만
  });
  const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`K-Startup API 오류: ${res.status}`);

  const json = (await res.json()) as { data?: Record<string, unknown>[] };
  const items = Array.isArray(json.data) ? json.data : [];
  return items.map(normalize).filter((p) => p.title && p.id !== "KST-");
}
