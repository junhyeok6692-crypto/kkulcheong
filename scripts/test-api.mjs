// API 연결 테스트 스크립트
// 실행: npm run test:api
//
// 목적: 발급받은 키로 각 API가 실제로 어떤 데이터를 돌려주는지 원본을 확인한다.
//       이 결과를 보고 수집기(collector)의 필드 매핑을 확정한다.

const BIZ_KEY = process.env.BIZINFO_API_KEY?.trim();
const YOUTH_KEY = process.env.YOUTH_API_KEY?.trim();
const DATA_KEY = process.env.DATA_GO_KR_KEY?.trim(); // 공공데이터포털 (K-Startup, 복지서비스 공용)

const line = (s = "") => console.log(s);
const hr = () => line("-".repeat(60));

async function tryFetch(label, url) {
  line(`\n> ${label}`);
  line(`  GET ${url.replace(/((?:crtfcKey|apiKeyNm|serviceKey)=)[^&]+/gi, "$1***")}`);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();
    line(`  status: ${res.status} ${res.statusText}  |  ${text.length} bytes`);
    let preview = text;
    try {
      preview = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* XML 등 */
    }
    line("  -- body --");
    line(preview.slice(0, 1200));
    if (preview.length > 1200) line("  ...(생략)");
  } catch (e) {
    line(`  X 요청 실패: ${e.message}`);
  }
}

async function main() {
  hr();
  line("API 연결 테스트");
  hr();

  // 1) 기업마당 (정부지원사업) — 연결 완료
  if (!BIZ_KEY) line("\n!  BIZINFO_API_KEY 없음");
  else
    await tryFetch(
      "정부지원사업 [기업마당]",
      `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${BIZ_KEY}&dataType=json&searchCnt=3`
    );

  // 2) 온통청년 (청년정책)
  //    키 발급: https://www.youthcenter.go.kr/myPage/openapi
  if (!YOUTH_KEY)
    line("\n!  YOUTH_API_KEY 없음 — 온통청년 마이페이지>OPEN API 에서 발급");
  else
    await tryFetch(
      "청년정책 [온통청년]",
      `https://www.youthcenter.go.kr/go/ythip/getPlcy?apiKeyNm=${YOUTH_KEY}&pageNum=1&pageSize=3&rtnType=json`
    );

  // 3) 공공데이터포털 키가 필요한 소스들
  if (!DATA_KEY) {
    line("\n!  DATA_GO_KR_KEY 없음 — data.go.kr 에서 아래 API 활용신청 후 일반 인증키(Decoding) 사용");
    line("     - K-Startup 사업공고: https://www.data.go.kr/data/15125364/openapi.do");
    line("     - 중앙부처 복지서비스: https://www.data.go.kr/data/15090532/openapi.do");
  } else {
    await tryFetch(
      "창업지원사업 [K-Startup]",
      `https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01?serviceKey=${encodeURIComponent(
        DATA_KEY
      )}&page=1&perPage=3&returnType=json`
    );
    await tryFetch(
      "중앙부처 복지서비스 [복지로]",
      `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001?serviceKey=${encodeURIComponent(
        DATA_KEY
      )}&pageNo=1&numOfRows=3&callTp=L`
    );
  }

  hr();
  line("완료. 위 응답 body를 보고 필드 매핑을 확정합니다.");
  hr();
}

main();
