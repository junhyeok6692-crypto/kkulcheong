import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "지원사업 가이드 | 꿀청",
  description:
    "정부지원사업·청년정책을 신청하기 전에 알아두면 좋은 내용을 정리했습니다. 자격 확인부터 탈락 사유까지.",
  alternates: { canonical: "/guide" },
};

export default function GuideIndex() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-ink">지원사업 가이드</h1>
        <p className="mb-8 text-[15px] leading-relaxed text-ink-muted">
          공고만 봐서는 알기 어려운 것들을 정리했습니다. 신청 전에 한 번 읽어보시면
          헛수고를 줄일 수 있어요.
        </p>

        <ul className="space-y-3">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guide/${g.slug}`}
                className="block rounded-[12px] border border-hairline bg-surface p-5 transition hover:shadow-soft"
              >
                <h2 className="mb-1.5 text-lg font-bold leading-snug text-ink">
                  {g.title}
                </h2>
                <p className="mb-3 text-sm leading-relaxed text-ink-muted">
                  {g.description}
                </p>
                <p className="text-xs text-ink-faint">
                  약 {g.readMin}분 · {g.updated} 업데이트
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← 지원사업 보러가기
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
