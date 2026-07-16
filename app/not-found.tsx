import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 | 꿀청",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-3 text-5xl font-bold tracking-tight text-[#c05600]">404</p>
        <h1 className="mb-3 text-xl font-bold text-ink">
          찾으시는 페이지가 없습니다
        </h1>
        <p className="mb-8 text-[15px] leading-relaxed text-ink-muted">
          주소가 잘못되었거나, 공고가 마감되어 내려갔을 수 있어요.
          <br />
          지금 모집 중인 지원사업을 확인해 보세요.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-on-primary"
        >
          지원사업 보러가기
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
