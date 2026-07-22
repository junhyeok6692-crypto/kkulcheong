// 정부지원사업 공고 데이터를 JSON으로 제공 — 블로그 자동화 파이프라인 등 외부 스크립트가
// sitemap+HTML 스크래핑 대신 이 엔드포인트로 직접 데이터를 가져갈 수 있도록 한다.
// 예: https://kkulcheong.com/api/policies?category=창업&limit=80
//     https://kkulcheong.com/api/policies?from=2026-07-20&to=2026-07-25

import { getAllPolicies } from "@/lib/policies";
import { daysLeft } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Number(searchParams.get("limit")) || 80;

  try {
    const policies = await getAllPolicies();

    let items = policies.filter((p) => {
      const d = daysLeft(p.endDate);
      if (d === null || d < 0) return false; // 상시/마감 제외
      if (category && category !== "전체" && p.category !== category) return false;
      if (from && (!p.endDate || p.endDate < from)) return false;
      if (to && (!p.endDate || p.endDate > to)) return false;
      return true;
    });

    if (!from && !to) items = items.slice(0, limit);

    const out = items.map((p) => ({
      title: p.title,
      org: p.org,
      category: p.category,
      area: p.regions.length ? p.regions.join(", ") : "전국",
      url: `https://kkulcheong.com/policy/${p.id}`,
      deadline: p.endDate,
      days_left: daysLeft(p.endDate),
    }));

    return Response.json(
      { count: out.length, items: out },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (e) {
    // 내부 오류 상세(e.message)는 로그로만 남기고, 응답에는 그대로 노출하지 않는다.
    console.error("[api/policies] 오류:", e);
    return Response.json(
      { error: "데이터를 불러오지 못했습니다." },
      { status: 502 }
    );
  }
}

