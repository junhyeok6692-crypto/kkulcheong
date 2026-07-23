// 홈 화면(PolicyList)이 클라이언트에서 비동기로 불러오는 목록 API.
//
// 이전에는 정책 전체(1,700여 건, ~1.5MB)를 매번 통째로 내려보내고 필터/페이지는
// 클라이언트에서 계산했다. 이제 검색/필터/페이지 조건을 쿼리 파라미터로 받아
// 서버에서 걸러낸 뒤 해당 페이지 분량만 반환한다 — 매 요청 전송량이 훨씬 작다.
//
// 자격 자가진단(myInfo)·맞춤 프로필은 원래 localStorage에만 있던 값인데, 이제
// 필터링을 위해 요청 쿼리로 서버에 전달된다(자체 서버로만 가고 별도 저장은 하지 않음).

import { getAllPolicyListItems } from "@/lib/policies";
import { daysLeft } from "@/lib/types";
import { judge, type MyInfo } from "@/lib/eligibility";
import { matchPolicy, type Profile } from "@/lib/profile";
import { isCapitalArea, REGION_ORDER, policyRegions } from "@/lib/policy-filter";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function csv(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const hideExpired = searchParams.get("hideExpired") !== "0";
  const source = searchParams.get("source") ?? "";
  const region = searchParams.get("region") ?? "";

  const savedOnly = searchParams.get("savedOnly") === "1";
  const savedIds = csv(searchParams.get("savedIds"));

  const eligOnly = searchParams.get("eligOnly") === "1";
  const myInfo: MyInfo = {
    birthYear: searchParams.get("birthYear") ? Number(searchParams.get("birthYear")) : null,
    job: searchParams.get("job") ?? "",
    school: searchParams.get("school") ?? "",
    income: searchParams.get("income") ? Number(searchParams.get("income")) : null,
  };
  const infoSet = !!(myInfo.birthYear || myInfo.job || myInfo.school || myInfo.income !== null);

  const profile: Profile = {
    region: searchParams.get("profileRegion") ?? "",
    targets: csv(searchParams.get("profileTargets")),
    interests: csv(searchParams.get("profileInterests")),
  };
  const profileSet = !!(profile.region || profile.targets.length || profile.interests.length);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Number(searchParams.get("perPage")) || 10;

  try {
    const items = await getAllPolicyListItems();

    // 소스/지역 필터를 제외한 나머지 필터 적용 (소스 버튼 카운트의 기준)
    const preBase = items
      .filter((p) => {
        if (savedOnly && !savedIds.includes(p.id)) return false;
        if (eligOnly && infoSet && judge(p, myInfo).verdict === "ineligible") return false;
        if (profileSet && !matchPolicy(p, profile)) return false;
        if (hideExpired) {
          const d = daysLeft(p.endDate);
          if (d !== null && d < 0) return false;
        }
        if (q) {
          const hay = (p.title + p.summary + p.tags.join(" ")).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = daysLeft(a.endDate);
        const db = daysLeft(b.endDate);
        const va = da === null || da < 0 ? Infinity : da;
        const vb = db === null || db < 0 ? Infinity : db;
        if (va !== vb) return va - vb;
        const ca = isCapitalArea(a);
        const cb = isCapitalArea(b);
        if (ca !== cb) return ca ? -1 : 1;
        return 0;
      });

    const sourceCounts: Record<string, number> = { 기업마당: 0, 온통청년: 0, "K-Startup": 0 };
    for (const p of preBase) sourceCounts[p.source] = (sourceCounts[p.source] ?? 0) + 1;

    // 소스 필터 적용 (지역 버튼 카운트의 기준)
    const base = source ? preBase.filter((p) => p.source === source) : preBase;

    const regionCountsMap: Record<string, number> = {};
    for (const p of base) for (const r of policyRegions(p)) regionCountsMap[r] = (regionCountsMap[r] ?? 0) + 1;
    const regionCounts = REGION_ORDER.filter((r) => regionCountsMap[r]).map((r) => ({ r, n: regionCountsMap[r] }));

    // 선택 지역 적용
    const visible = region ? base.filter((p) => policyRegions(p).includes(region)) : base;

    const total = visible.length;
    const pageCount = Math.max(1, Math.ceil(total / perPage));
    const curPage = Math.min(page, pageCount);
    const paged = visible.slice((curPage - 1) * perPage, curPage * perPage);

    const out = paged.map((p) => ({
      ...p,
      verdict: infoSet ? judge(p, myInfo).verdict : undefined,
    }));

    return Response.json({
      items: out,
      total,
      preBaseTotal: preBase.length,
      baseTotal: base.length,
      sourceCounts,
      regionCounts,
      pageCount,
      curPage,
    });
  } catch (e) {
    console.error("[api/policies/list] 오류:", e);
    return Response.json({ error: "데이터를 불러오지 못했습니다." }, { status: 502 });
  }
}
