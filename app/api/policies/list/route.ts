// 홈 화면(PolicyList)이 클라이언트에서 비동기로 불러오는 전체 목록.
// 서버 렌더링 시 페이지 하나에 정책 전체(1,700여 건)를 통째로 실어 보내던 것을
// 분리해, 히어로 영역은 바로 뜨고 목록은 첫 페인트 이후 이 엔드포인트로 채운다.

import { getAllPolicies } from "@/lib/policies";
import { toListItem } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const policies = await getAllPolicies();
    return Response.json(
      { items: policies.map(toListItem) },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (e) {
    console.error("[api/policies/list] 오류:", e);
    return Response.json({ error: "데이터를 불러오지 못했습니다." }, { status: 502 });
  }
}
