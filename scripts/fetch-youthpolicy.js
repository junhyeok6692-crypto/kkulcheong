// 온통청년(youthcenter.go.kr) 오픈API를 호출해 data/youthpolicy.json을 생성/갱신합니다.
// 실행: node scripts/fetch-youthpolicy.js
// 필요 환경변수: YOUTH_POLICY_API_KEY (청년정책 목록 조회용 인증키)
//
// 엔드포인트는 공식 문서(youthcenter.go.kr 오픈API 안내 페이지)에 명시된 것과 실제 동작이 달라,
// 직접 호출해서 실측한 값을 사용합니다: https://www.youthcenter.go.kr/go/ythip/getPlcy

const fs = require('fs');
const path = require('path');

loadDotEnvIfPresent();

const POLICY_KEY = process.env.YOUTH_POLICY_API_KEY;
const POLICY_URL = 'https://www.youthcenter.go.kr/go/ythip/getPlcy';

const PAGE_SIZE = 100;
const MAX_PAGES = 15; // 안전장치: 최대 1500건까지만 수집

// 온통청년 대분류(lclsfNm)/중분류(mclsfNm) -> 꿀청 카테고리 매핑
function mapCategory(lclsfNm, mclsfNm) {
  const m = mclsfNm || '';
  if (m.includes('창업')) return 'startup';
  if (m.includes('주택') || m.includes('거주')) return 'housing';
  if (m.includes('취업') || m.includes('재직자')) return 'job';
  if (m.includes('금융') || m.includes('취약계층')) return 'finance';
  if (m.includes('문화') || m.includes('예술')) return 'culture';
  if (m.includes('교육') || m.includes('역량')) return 'edu';

  const byLcls = {
    '주거': 'housing',
    '일자리': 'job',
    '교육･직업훈련': 'edu',
    '금융･복지･문화': 'finance',
    '참여･기반': 'culture'
  };
  return byLcls[lclsfNm] || 'edu';
}

function loadDotEnvIfPresent() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function formatPeriod(aplyYmd, bizPrdEtcCn) {
  const raw = clean(aplyYmd);
  if (!raw) return clean(bizPrdEtcCn) || '상시 접수(공고 확인 필요)';
  const fmt = (d) => (d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : d);
  return raw.split('~').map((s) => fmt(s.trim())).join(' ~ ');
}

function buildTarget(it) {
  const minAge = Number(it.sprtTrgtMinAge) || 0;
  const maxAge = Number(it.sprtTrgtMaxAge) || 0;
  const ageRange = minAge && maxAge ? `만 ${minAge}~${maxAge}세` : '';
  const extra = clean(it.addAplyQlfcCndCn) || clean(it.ptcpPrpTrgtCn);
  if (ageRange && extra) return `${ageRange} (${extra.slice(0, 60)})`;
  return ageRange || extra.slice(0, 80) || '공고 상세 확인 필요';
}

function buildTags(it) {
  const tags = [];
  if (it.plcyKywdNm) tags.push(...it.plcyKywdNm.split(/[,·]/).map(clean).filter(Boolean));
  if (it.mclsfNm) tags.push(clean(it.mclsfNm));
  return Array.from(new Set(tags)).slice(0, 5);
}

function mapPolicy(it) {
  return {
    id: `youth-${it.plcyNo}`,
    category: mapCategory(it.lclsfNm, it.mclsfNm),
    title: it.plcyNm,
    org: it.sprvsnInstCdNm || it.rgtrInstCdNm || '기관 확인 필요',
    target: buildTarget(it),
    support: clean(it.plcySprtCn || it.plcyExplnCn).slice(0, 140),
    region: '전국',
    period: formatPeriod(it.aplyYmd, it.bizPrdEtcCn),
    link: it.aplyUrlAddr || it.refUrlAddr1 || it.refUrlAddr2 || 'https://www.youthcenter.go.kr',
    tags: buildTags(it),
    source: '온통청년',
    views: Number(it.inqCnt) || 0
  };
}

async function fetchAllPages() {
  const collected = [];
  let total = Infinity;
  for (let pageNum = 1; pageNum <= MAX_PAGES && collected.length < total; pageNum++) {
    const url = `${POLICY_URL}?apiKeyNm=${encodeURIComponent(POLICY_KEY)}&pageNum=${pageNum}&pageSize=${PAGE_SIZE}&rtnType=json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API 호출 실패 (${res.status}): ${POLICY_URL}`);
    }
    const data = await res.json();
    if (data.resultCode !== 200) {
      throw new Error(`API 응답 오류: ${data.resultCode} ${data.resultMessage}`);
    }
    const list = (data.result && data.result.youthPolicyList) || [];
    total = (data.result && data.result.pagging && data.result.pagging.totCount) || list.length;
    collected.push(...list);
    if (list.length < PAGE_SIZE) break; // 마지막 페이지
  }
  return { items: collected, total };
}

async function main() {
  if (!POLICY_KEY) {
    console.error('YOUTH_POLICY_API_KEY가 설정되어 있지 않습니다.');
    process.exit(1);
  }

  console.log('온통청년 청년정책 API 호출 중...');
  const { items, total } = await fetchAllPages();
  console.log(`청년정책 ${items.length}건 수집 (전체 ${total}건 중 안전장치로 최대 ${PAGE_SIZE * MAX_PAGES}건까지만)`);

  const output = {
    meta: {
      note: '온통청년(youthcenter.go.kr) 오픈API에서 자동 수집한 실시간 청년정책 정보입니다.',
      generatedAs: 'live',
      fetchedAt: new Date().toISOString(),
      totalAvailable: total,
      count: items.length
    },
    items: items.map(mapPolicy)
  };

  const outPath = path.join(__dirname, '..', 'data', 'youthpolicy.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`총 ${items.length}건을 ${outPath} 에 저장했습니다.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
