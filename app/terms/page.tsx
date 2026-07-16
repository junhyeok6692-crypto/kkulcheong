import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "이용약관 | 꿀청",
  description: "꿀청 서비스 이용약관입니다.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <main>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-ink">이용약관</h1>
        <p className="mb-8 text-sm text-ink-faint">최종 수정일: 2026년 7월 16일</p>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">제1조 (목적)</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            본 약관은 꿀청(이하 &quot;사이트&quot;)이 제공하는 정부지원사업 정보
            제공 서비스의 이용 조건과 절차를 정함을 목적으로 합니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">제2조 (서비스의 내용)</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            사이트는 기업마당 등 공공기관이 공개한 지원사업 공고 데이터를 수집하여
            검색·필터·정렬 등의 형태로 보기 쉽게 제공합니다. 사이트는 지원사업의
            운영 주체가 아니며, 신청 접수·심사·지급 등 어떠한 행정 절차에도
            관여하지 않습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">제3조 (정보의 정확성)</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            사이트가 제공하는 정보는 공공데이터를 기반으로 자동 갱신되며, 원문과
            차이가 있거나 최신이 아닐 수 있습니다. 이용자는 신청 전 반드시 각
            기관의 원문 공고를 확인해야 하며, 사이트는 정보의 정확성·완전성을
            보증하지 않습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">제4조 (책임의 제한)</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            사이트는 이용자가 본 서비스의 정보를 신뢰하여 취한 행동으로 발생한
            직·간접적 손해에 대하여 책임을 지지 않습니다. 또한 천재지변, 외부 API
            장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">제5조 (저작권)</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            원문 공고의 저작권은 각 공공기관에 있습니다. 사이트가 제작한 편집·분류·
            요약·디자인 등 창작 요소의 권리는 사이트에 있으며, 무단 복제·배포를
            금합니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">제6조 (광고)</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            사이트는 서비스 운영을 위해 광고를 게재할 수 있습니다. 광고와 관련한
            자세한 사항은 개인정보처리방침을 참고해 주세요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink">제7조 (약관의 변경)</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            사이트는 필요 시 본 약관을 변경할 수 있으며, 변경 시 본 페이지에
            게시합니다.
          </p>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
