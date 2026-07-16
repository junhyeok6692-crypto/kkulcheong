import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "문의하기 | 꿀청",
  description:
    "꿀청에 대한 제안, 오류 신고, 제휴 문의는 이메일로 연락해 주세요.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <main>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-bold text-ink">문의하기</h1>

        <p className="mb-8 text-[15px] leading-relaxed text-ink-secondary">
          꿀청을 이용하시면서 불편한 점, 잘못된 정보, 추가되었으면 하는 기능이
          있다면 언제든 알려주세요. 최대한 빠르게 확인하고 반영하겠습니다.
        </p>

        <div className="mb-8 rounded-[12px] border border-hairline bg-surface p-5">
          <p className="mb-1 text-xs text-ink-faint">이메일</p>
          <a
            href="mailto:junhyeok6692@gmail.com"
            className="text-lg font-semibold text-primary hover:underline"
          >
            junhyeok6692@gmail.com
          </a>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            보통 영업일 기준 2~3일 이내에 답변드립니다.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-ink">이런 문의를 받습니다</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-secondary">
            <li>공고 정보 오류 신고 (내용이 원문과 다른 경우)</li>
            <li>기능 제안 및 개선 요청</li>
            <li>제휴·광고 문의</li>
            <li>기타 서비스 관련 문의</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-ink">
            지원사업 신청 문의는 받지 않습니다
          </h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            꿀청은 정보를 정리해 보여주는 서비스일 뿐, 지원사업의 운영 주체가
            아닙니다. 신청 자격·제출서류·심사 결과 등은 각 공고에 안내된{" "}
            <b>소관기관 문의처</b>로 연락해 주세요. 공고 상세페이지에서 기관
            연락처를 확인하실 수 있습니다.
          </p>
        </section>

        <Link href="/" className="text-sm text-primary hover:underline">
          ← 지원사업 보러가기
        </Link>
      </article>
      <SiteFooter />
    </main>
  );
}
