import { fetchPolicies } from "@/lib/bizinfo";
import PolicyList from "@/components/PolicyList";

export const metadata = {
  title: "정부지원사업 모아보기 | 매일 갱신되는 지원사업·정책",
  description:
    "전국 정부지원사업 공고를 한 곳에서. 분야·지역별 필터, 마감임박 정렬, 내 정보 기반 맞춤 검색으로 놓치는 지원금 없이 확인하세요.",
};

// 1시간마다 페이지 재생성 (ISR)
export const revalidate = 3600;

// 히어로 밤하늘용 장식 sticker dots (장식 전용)
const STARS = [
  { c: "bg-accent-sky", top: "18%", left: "12%", s: 8 },
  { c: "bg-accent-pink", top: "30%", left: "84%", s: 10 },
  { c: "bg-accent-purple", top: "62%", left: "22%", s: 7 },
  { c: "bg-accent-teal", top: "70%", left: "72%", s: 9 },
  { c: "bg-accent-orange", top: "12%", left: "60%", s: 6 },
  { c: "bg-accent-green", top: "48%", left: "48%", s: 6 },
];

export default async function Home() {
  let policies: Awaited<ReturnType<typeof fetchPolicies>> = [];
  let error = "";
  try {
    policies = await fetchPolicies(100);
  } catch (e) {
    error = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
  }

  return (
    <main>
      {/* 딥 인디고 'night' 히어로 밴드 — 페이지의 단 하나의 어두운 섬 */}
      <section className="relative overflow-hidden bg-secondary text-white">
        {/* 장식용 glowing sticker dots */}
        <div className="pointer-events-none absolute inset-0">
          {STARS.map((s, i) => (
            <span
              key={i}
              className={`absolute rounded-full ${s.c} blur-[2px]`}
              style={{
                top: s.top,
                left: s.left,
                width: s.s,
                height: s.s,
                opacity: 0.8,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.01em] text-white/90 ring-1 ring-white/15">
            매일 자동 갱신 · 총 {policies.length}건
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            정부지원사업,
            <br />
            흩어진 공고를 한 곳에서
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
            전국 지원사업을 모아 마감임박순으로 정리했어요. 내 정보를 넣으면
            나에게 해당되는 것만 골라 보여드립니다.
          </p>
        </div>
      </section>

      {/* 본문 — 따뜻한 캔버스 */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {error ? (
          <div className="rounded-xl border border-hairline bg-surface p-4 text-sm text-ink-muted">
            데이터를 불러오지 못했어요: {error}
          </div>
        ) : (
          <PolicyList policies={policies} />
        )}
      </div>

      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-ink-faint">
          데이터 출처: 기업마당(bizinfo.go.kr) · 1시간마다 갱신
        </div>
      </footer>
    </main>
  );
}
