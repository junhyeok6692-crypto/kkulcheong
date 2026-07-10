import { fetchPolicies } from "@/lib/bizinfo";
import PolicyList from "@/components/PolicyList";

export const metadata = {
  title: "정부지원사업 모아보기 | 매일 갱신되는 지원사업·정책",
  description:
    "전국 정부지원사업 공고를 한 곳에서. 분야·지역별 필터, 마감임박 정렬로 놓치는 지원금 없이 확인하세요.",
};

// 1시간마다 페이지 재생성 (ISR)
export const revalidate = 3600;

export default async function Home() {
  let policies: Awaited<ReturnType<typeof fetchPolicies>> = [];
  let error = "";
  try {
    policies = await fetchPolicies(100);
  } catch (e) {
    error = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          🏛 정부지원사업 모아보기
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          전국 지원사업 공고를 매일 모아드려요 · 총 {policies.length}건
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          데이터를 불러오지 못했어요: {error}
        </div>
      ) : (
        <PolicyList policies={policies} />
      )}

      <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-800">
        데이터 출처: 기업마당(bizinfo.go.kr) · 1시간마다 갱신
      </footer>
    </main>
  );
}
