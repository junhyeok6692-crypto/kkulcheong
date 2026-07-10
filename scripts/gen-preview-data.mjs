// 미리보기용 실데이터 생성: 기업마당 API → preview-data.js 파일로 저장
// 실행: node --env-file=.env.local scripts/gen-preview-data.mjs

import { writeFileSync } from "node:fs";

const key = process.env.BIZINFO_API_KEY;
const COUNT = 2000; // 전체 공고 (현재 약 1500건)
const REGIONS = ["서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주","전국"];

const s = (v) => (v == null ? "" : String(v).trim());
const stripHtml = (h) => s(h).replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&[a-z]+;/gi," ").replace(/\s+/g," ").trim();
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
    // 지역 8곳 이상 = 사실상 전국
    if (rgn.filter((r) => r !== "전국").length >= 8) rgn = ["전국"];
    const sum = stripHtml(it.bsnsSumryCn).slice(0, 90);
    return {
      t: s(it.pblancNm),
      cat: s(it.pldirSportRealmLclasCodeNm) || "기타",
      rgn,
      org: s(it.jrsdInsttNm),
      target: s(it.trgetNm) || "중소기업",
      end: endDate(it.reqstBeginEndDe),
      sum: sum + (sum.length >= 90 ? "…" : ""),
      url: s(it.pblancUrl),
    };
  })
  .filter((d) => d.t && d.url);

const out = `// 자동 생성 파일 (scripts/gen-preview-data.mjs) — 기업마당 실데이터 ${data.length}건\nvar DATA = ${JSON.stringify(data, null, 2)};\n`;
writeFileSync(new URL("../preview-data.js", import.meta.url), out, "utf8");
console.log(`preview-data.js 저장 완료: ${data.length}건`);
