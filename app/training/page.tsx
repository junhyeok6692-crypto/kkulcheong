import type { Metadata } from "next";
import Link from "next/link";
import { getAllCourses } from "@/lib/training";
import CourseList from "@/components/CourseList";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "국민내일배움카드 훈련과정 추천 | 꿀청",
  description:
    "국민내일배움카드로 들을 수 있는 훈련과정 중 수강생 만족도가 높은 과정만 골라 정리했습니다. 지역·과정명으로 검색하고 고용24에서 바로 신청하세요.",
  alternates: { canonical: "/training" },
};

export default async function TrainingPage() {
  let courses: Awaited<ReturnType<typeof getAllCourses>> = [];
  let error = "";
  try {
    courses = await getAllCourses();
  } catch (e) {
    error = e instanceof Error ? e.message : "훈련과정을 불러오지 못했습니다.";
  }

  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
          <span className="mx-1.5">›</span>
          <span>훈련과정</span>
        </nav>

        <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">
          국민내일배움카드 훈련과정 추천
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-muted">
          고용24에 등록된 훈련과정은 17만 개가 넘습니다. 그중{" "}
          <b className="text-ink">국민내일배움카드로 들을 수 있고, 수강생 만족도가 집계된 과정</b>
          만 <b className="text-ink">분야별로</b> 골라 만족도 높은 순으로 정리했습니다.
          앞으로 3개월 내 시작하는 과정입니다.
        </p>

        <div className="mb-6 rounded-[12px] border border-hairline bg-surface p-4 text-sm leading-relaxed text-ink-secondary">
          <p className="mb-1 font-semibold text-ink">국민내일배움카드란?</p>
          <p>
            직업훈련비를 <b>5년간 300~500만원</b> 지원하는 카드입니다. 재직자·구직자
            모두 신청할 수 있고, 카드를 발급받으면 아래 과정들을 수강료 일부(또는
            전액) 지원받아 들을 수 있습니다.{" "}
            <Link href="/guide/hrd-card" className="text-primary hover:underline">
              발급 방법과 과정 고르는 법 →
            </Link>
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-hairline bg-surface p-4 text-sm text-ink-muted">
            훈련과정을 불러오지 못했어요: {error}
          </div>
        ) : (
          <CourseList courses={courses} />
        )}

        <p className="mt-8 rounded-lg bg-surface px-4 py-3 text-xs leading-relaxed text-ink-faint ring-1 ring-hairline">
          <b>수강료 안내</b> — 표시된 금액은 과정의 <b>전체 수강료</b>입니다. 국민내일배움카드로
          지원받으면 실제 부담액은 이보다 훨씬 적지만, 자부담 비율은 과정 유형(국가기간전략산업직종
          등은 0%, 일반 과정은 최대 55%)과 남은 카드 한도에 따라 달라집니다. 고용24 API 는 자부담
          정보를 제공하지 않으므로, <b>정확한 결제 금액은 고용24 원문에서 확인해 주세요.</b>
          <br />
          <br />
          데이터 출처: 고용24(work24.go.kr) 공개 API · 1시간마다 갱신. 만족도는 기존 수강생 평가를
          집계한 값이며, 수강료·정원은 변동될 수 있습니다.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}

