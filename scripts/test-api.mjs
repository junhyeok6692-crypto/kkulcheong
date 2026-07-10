// API 연결 테스트 스크립트
// 실행: node --env-file=.env.local scripts/test-api.mjs
//
// 목적: 발급받은 키로 청년정책/정부지원사업 API가 실제로 어떤 데이터를
//       돌려주는지 원본을 확인한다. 이 결과를 보고 수집기(collector)의
//       필드 매핑을 확정한다.

const YOUTH_KEY = process.env.YOUTH_API_KEY?.trim();
const BIZ_KEY = process.env.BIZINFO_API_KEY?.trim();

const line = (s = "") => console.log(s);
const hr = () => line("─".repeat(60));

async function tryFetch(label, url) {
  line(`\n▶ ${label}`);
  line(`  GET ${url.replace(/(Key[A-Za-z]*=)[^&]+/gi, "$1***")}`);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();
    line(`  status: ${res.status} ${res.statusText}`);
    line(`  length: ${text.length} bytes`);
    // JSON이면 예쁘게, 아니면 앞부분만
    let preview = text;
    try {
      preview = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* XML 등 */
    }
    line("  ── body (앞부분) ──");
    line(preview.slice(0, 1500));
    if (preview.length > 1500) line("  ...(생략)");
  } catch (e) {
    line(`  ✗ 요청 실패: ${e.message}`);
  }
}

async function main() {
  hr();
  line("API 연결 테스트");
  hr();

  // ── 청년정책 (온통청년) ──
  if (!YOUTH_KEY) {
    line("\n⚠  YOUTH_API_KEY 없음 — .env.local 에 키를 넣어주세요.");
  } else {
    // 신 버전 (JSON)
    await tryFetch(
      "청년정책 [신버전 getPlcy · JSON]",
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${YOUTH_KEY}&pageNum=1&pageSize=5&rtnType=json`
    );
    // 구 버전 (XML) — 신버전이 안 되면 이쪽을 사용
    await tryFetch(
      "청년정책 [구버전 youthPlcyList · XML]",
      `https://www.youthcenter.go.kr/opi/youthPlcyList.do?openApiVlak=${YOUTH_KEY}&pageIndex=1&display=5`
    );
  }

  // ── 정부지원사업 (기업마당) ──
  if (!BIZ_KEY) {
    line("\n⚠  BIZINFO_API_KEY 없음 — .env.local 에 키를 넣어주세요.");
  } else {
    await tryFetch(
      "정부지원사업 [기업마당 · JSON]",
      `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${BIZ_KEY}&dataType=json&searchCnt=5`
    );
  }

  hr();
  line("완료. 위 응답 body를 보고 필드 매핑을 확정합니다.");
  hr();
}

main();
