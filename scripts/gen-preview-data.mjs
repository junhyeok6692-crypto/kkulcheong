// 미리보기용 실데이터 생성: 기업마당 API → preview-data.js 파일로 저장
// 실행: node --env-file=.env.local scripts/gen-preview-data.mjs

import { writeFileSync } from "node:fs";

const key = process.env.BIZINFO_API_KEY;
const COUNT = 2000; // 전체 공고 (현재 약 1500건)
const REGIONS = ["서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주","전국"];

const s = (v) => (v == null ? "" : String(v).trim());

// HTML → 텍스트 (문단 유지) — lib/bizinfo.ts 와 동일 규칙
const htmlToText = (h) =>
  s(h)
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

function endDate(period) {
  const p = s(period).split("~");
  const raw = (p[1] ?? p[0] ?? "").trim();
  const m = raw.match(/(\d{4})[-.]?(\d{2})[-.]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const url = `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${key}&dataType=json&searchCnt=${COUNT}`;
const res = await fetch(url);
const json = await res.json();
const items = Array.isArray(json.jsonArray) ? json.jsonArray : [];

const data = items
  .map((it) => {
    const tags = s(it.hashtags).split(/[,\s]+/).filter(Boolean);
    let rgn = [...new Set(tags.filter((t) => REGIONS.includes(t)))];
    if (rgn.filter((r) => r !== "전국").length >= 8) rgn = ["전국"];
    const full = htmlToText(it.bsnsSumryCn);
    return {
      id: s(it.pblancId),
      t: s(it.pblancNm),
      cat: s(it.pldirSportRealmLclasCodeNm) || "기타",
      rgn,
      org: s(it.jrsdInsttNm),
      execOrg: s(it.excInsttNm),
      target: s(it.trgetNm) || "중소기업",
      end: endDate(it.reqstBeginEndDe),
      period: s(it.reqstBeginEndDe),
      sum: full.replace(/\s+/g, " ").slice(0, 120),
      full,                                   // 상세: 사업개요
      applyMethod: htmlToText(it.reqstMthPapersCn), // 상세: 신청방법
      contact: htmlToText(it.refrncNm),             // 상세: 문의처
      applyUrl: s(it.rceptEngnHmpgUrl),             // 상세: 접수 홈페이지
      fileUrl: s(it.flpthNm),                       // 상세: 첨부파일
      fileName: s(it.fileNm),
      url: s(it.pblancUrl),
    };
  })
  .filter((d) => d.t && d.url && d.id);

const out = `// 자동 생성 파일 (scripts/gen-preview-data.mjs) — 기업마당 실데이터 ${data.length}건\nvar DATA = ${JSON.stringify(data, null, 2)};\n`;
writeFileSync(new URL("../preview-data.js", import.meta.url), out, "utf8");
console.log(`preview-data.js saved: ${data.length} items`);
