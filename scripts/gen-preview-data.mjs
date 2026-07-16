// 미리보기용 실데이터 생성: 기업마당 + 온통청년 → preview-data.js
// 실행: npm run gen:preview

import { writeFileSync } from "node:fs";

const BIZ_KEY = process.env.BIZINFO_API_KEY;
const YOUTH_KEY = process.env.YOUTH_API_KEY;

const SIDO = {
  "11":"서울","26":"부산","27":"대구","28":"인천","29":"광주","30":"대전","31":"울산","36":"세종",
  "41":"경기","42":"강원","51":"강원","43":"충북","44":"충남","45":"전북","52":"전북",
  "46":"전남","47":"경북","48":"경남","50":"제주",
};
const REGION_TOKENS = [...new Set(Object.values(SIDO)), "전국"];

const s = (v) => (v == null ? "" : String(v).trim());
const htmlToText = (h) =>
  s(h).replace(/<br\s*\/?>/gi,"\n").replace(/<\/p>/gi,"\n\n").replace(/<\/div>/gi,"\n")
    .replace(/<\/li>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
const collapse = (r) => {
  const u = [...new Set(r)];
  return u.filter((x) => x !== "전국").length >= 8 ? ["전국"] : u;
};
const endOf = (period) => {
  const p = s(period).split("~");
  const m = (p[1] ?? p[0] ?? "").trim().match(/(\d{4})[-.]?(\d{2})[-.]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

async function bizinfo() {
  if (!BIZ_KEY) return [];
  const r = await fetch(`https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${BIZ_KEY}&dataType=json&searchCnt=2000`);
  const j = await r.json();
  return (j.jsonArray ?? []).map((it) => {
    const tags = s(it.hashtags).split(/[,\s]+/).filter(Boolean);
    const full = htmlToText(it.bsnsSumryCn);
    const period = s(it.reqstBeginEndDe);
    return {
      id: s(it.pblancId), source: "기업마당",
      t: s(it.pblancNm), cat: s(it.pldirSportRealmLclasCodeNm) || "기타",
      rgn: collapse(tags.filter((x) => REGION_TOKENS.includes(x))),
      org: s(it.jrsdInsttNm), execOrg: s(it.excInsttNm), target: s(it.trgetNm) || "중소기업",
      end: endOf(period), period,
      sum: full.replace(/\s+/g," ").slice(0,120), full,
      applyMethod: htmlToText(it.reqstMthPapersCn), contact: htmlToText(it.refrncNm),
      applyUrl: s(it.rceptEngnHmpgUrl), fileUrl: s(it.flpthNm), fileName: s(it.fileNm),
      url: s(it.pblancUrl), extra: [],
    };
  }).filter((d) => d.id && d.t);
}

async function youth() {
  if (!YOUTH_KEY) return [];
  const r = await fetch(`https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${YOUTH_KEY}&pageNum=1&pageSize=3000&rtnType=json`);
  const j = await r.json();
  return (j.result?.youthPolicyList ?? []).map((it) => {
    const no = s(it.plcyNo);
    const expln = htmlToText(it.plcyExplnCn), sprt = htmlToText(it.plcySprtCn);
    const full = [expln, sprt].filter(Boolean).join("\n\n");
    const minA = Number(it.sprtTrgtMinAge) || 0, maxA = Number(it.sprtTrgtMaxAge) || 0;
    const noLimit = s(it.sprtTrgtAgeLmtYn) === "Y";
    const extra = [];
    if (!noLimit && (minA || maxA)) extra.push({ label:"지원 연령", value:`만 ${minA}세 ~ ${maxA}세` });
    const scale = Number(it.sprtSclCnt) || 0;
    if (scale) extra.push({ label:"지원 규모", value:`${scale.toLocaleString()}명` });
    const cond = htmlToText(it.addAplyQlfcCndCn); if (cond) extra.push({ label:"추가 자격요건", value:cond });
    const etc = htmlToText(it.etcMttrCn); if (etc) extra.push({ label:"기타 사항", value:etc });
    const ref = s(it.refUrlAddr1); if (ref) extra.push({ label:"참고 링크", value:ref });
    const codes = s(it.zipCd).split(",").map((c) => c.trim()).filter(Boolean);
    return {
      id: `YTH-${no}`, source: "온통청년",
      t: s(it.plcyNm), cat: s(it.lclsfNm) || "기타",
      rgn: collapse(codes.map((c) => SIDO[c.slice(0,2)]).filter(Boolean)),
      org: s(it.sprvsnInstCdNm), execOrg: s(it.operInstCdNm),
      target: noLimit || (!minA && !maxA) ? "청년" : `만 ${minA}~${maxA}세 청년`,
      end: endOf(s(it.aplyYmd)),
      period: s(it.aplyYmd).replace(/(\d{4})(\d{2})(\d{2})/g, (_,y,m,d)=>`${y}-${m}-${d}`),
      sum: (expln || sprt).replace(/\s+/g," ").slice(0,120), full,
      applyMethod: htmlToText(it.plcyAplyMthdCn), contact: s(it.operInstCdNm),
      applyUrl: s(it.aplyUrlAddr), fileUrl: "", fileName: "",
      url: `https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch/ythPlcyDetail/${no}`,
      extra,
    };
  }).filter((d) => d.t && d.id !== "YTH-");
}

const [b, y] = await Promise.all([bizinfo(), youth()]);
const data = [...b, ...y];
const out = `// 자동 생성 (scripts/gen-preview-data.mjs) — 기업마당 ${b.length} + 온통청년 ${y.length} = ${data.length}건\nvar DATA = ${JSON.stringify(data)};\n`;
writeFileSync(new URL("../preview-data.js", import.meta.url), out, "utf8");
console.log(`preview-data.js saved: bizinfo=${b.length}, youth=${y.length}, total=${data.length}`);
