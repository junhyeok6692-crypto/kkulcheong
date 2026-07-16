import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "꿀청 소개 | 정부지원사업 모아보기",
  description:
    "꿀청은 전국에 흩어진 정부지원사업 공고를 한 곳에 모아, 내 조건에 맞는 지원사업만 골라 보여주는 서비스입니다.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <main>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-bold text-ink">꿀청 소개</h1>

        <p className="mb-8 text-[15px] leading-relaxed text-ink-secondary">
          정부지원사업은 매일 쏟아지지만, 기관별·지역별로 흩어져 있어 정작 나에게
          해당되는 공고를 놓치기 쉽습니다. <b>꿀청</b>은 전국의 지원사업 공고를 한
          곳에 모아, <b>마감이 임박한 순서</b>로 정리하고 <b>내 조건에 맞는 것만</b>{" "}
          골라 보여주는 서비스입니다.
        </p>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-ink">이런 점이 다릅니다</h2>
          <ul className="space-y-3 text-[15px] leading-relaxed text-ink-secondary">
            <li>
              <b className="text-ink">내 정보 기반 맞춤 필터</b> — 지역·대상·관심
              분야를 한 번 설정해두면, 해당되는 공고만 자동으로 걸러서 보여줍니다.
              설정값은 내 브라우저에만 저장되어 회원가입이 필요 없습니다.
            </li>
            <li>
              <b className="text-ink">마감임박 강조</b> — 마감이 5일 이내로 남은
              공고를 눈에 띄게 표시해, 놓치는 기회를 줄입니다.
            </li>
            <li>
              <b className="text-ink">지역별 보기</b> — 내 지역 공고만 버튼 하나로
              모아볼 수 있습니다.
            </li>
            <li>
              <b className="text-ink">한눈에 보는 정리</b> — 소관기관·지원대상·
              신청기간·신청방법·문의처를 공고마다 정리해 원문을 일일이 뒤지지 않아도
              핵심을 파악할 수 있습니다.
            </li>
            <li>
              <b className="text-ink">매일 자동 갱신</b> — 공공데이터를 주기적으로
              가져와 항상 최신 상태를 유지합니다.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-ink">데이터 출처</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            중소벤처기업부{" "}
            <a
              className="text-primary hover:underline"
              href="https://www.bizinfo.go.kr"
              target="_blank"
              rel="noopener noreferrer"
            >
              기업마당(bizinfo.go.kr)
            </a>
            의 공개 오픈API를 사용합니다. 꿀청은 지원사업의 운영 주체가 아니며,
            신청·심사·지급 등 행정 절차에는 관여하지 않습니다. 최종 내용은 반드시
            각 기관의 원문 공고를 확인해 주세요.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-ink">문의</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            제안·오류 신고는{" "}
            <Link className="text-primary hover:underline" href="/contact">
              문의 페이지
            </Link>
            를 이용해 주세요.
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
