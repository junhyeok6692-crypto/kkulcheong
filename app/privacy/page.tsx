import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 꿀청",
  description:
    "꿀청의 개인정보처리방침입니다. 수집하는 정보, 쿠키 및 광고(Google AdSense) 관련 사항을 안내합니다.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <main>
      <SiteHeader />
      <article className="prose-hunny mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-ink">개인정보처리방침</h1>
        <p className="mb-8 text-sm text-ink-faint">최종 수정일: 2026년 7월 16일</p>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">1. 개요</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            꿀청(이하 &quot;사이트&quot;)은 정부·공공기관이 공개한 지원사업 공고
            정보를 모아 보기 쉽게 제공하는 정보 서비스입니다. 사이트는 이용자의
            개인정보를 소중히 여기며, 본 방침을 통해 어떤 정보가 어떻게 처리되는지
            안내합니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">2. 수집하는 정보</h2>
          <p className="mb-2 text-[15px] leading-relaxed text-ink-secondary">
            사이트는 회원가입을 요구하지 않으며, 이름·연락처 등 개인을 식별할 수
            있는 정보를 서버에 수집·저장하지 않습니다.
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-secondary">
            <li>
              <b>맞춤 설정 정보</b>: 이용자가 입력한 지역·대상·관심분야는 이용자
              브라우저의 로컬 저장소(localStorage)에만 저장되며, 서버로 전송되지
              않습니다. 브라우저 데이터를 삭제하면 함께 삭제됩니다.
            </li>
            <li>
              <b>자동 수집 정보</b>: 서비스 운영·통계 및 광고 제공 과정에서 접속
              기록, 기기·브라우저 정보, 쿠키 등이 자동으로 수집될 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">3. 쿠키 및 광고</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-secondary">
            <li>
              사이트는 제3자 광고 제공업체(Google 등)를 이용할 수 있으며, 이들은
              쿠키를 사용하여 이용자의 이 사이트 및 다른 사이트 방문 기록을 바탕으로
              맞춤 광고를 게재할 수 있습니다.
            </li>
            <li>
              Google은 광고 쿠키를 사용하여 이용자에게 광고를 게재합니다. 이용자는{" "}
              <a
                className="text-primary hover:underline"
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 광고 설정
              </a>
              에서 맞춤 광고를 해제할 수 있습니다.
            </li>
            <li>
              제3자 공급업체의 쿠키 사용에 대한 자세한 내용은{" "}
              <a
                className="text-primary hover:underline"
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 광고 정책
              </a>
              을 참고하세요.
            </li>
            <li>
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우
              일부 기능 이용에 제한이 있을 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">4. 이용 목적</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            수집된 정보는 서비스 제공 및 개선, 이용 통계 분석, 광고 게재 목적으로만
            이용되며, 그 외의 목적으로 이용하지 않습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">5. 제3자 제공</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            사이트는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다.
            다만 법령에 따른 요구가 있는 경우에는 예외로 합니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">6. 보유 및 파기</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            맞춤 설정 정보는 이용자의 브라우저에 보관되며 이용자가 직접 삭제할 수
            있습니다. 자동 수집 정보는 통계·광고 목적 달성 후 관련 법령이 정한 기간에
            따라 처리됩니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">7. 이용자의 권리</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            이용자는 언제든지 브라우저 설정에서 쿠키 및 로컬 저장소 데이터를
            삭제하거나, 광고 설정에서 맞춤 광고를 해제할 수 있습니다.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2 text-lg font-bold text-ink">8. 정보의 정확성</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            사이트가 제공하는 지원사업 정보는 공공기관이 공개한 데이터를 기반으로
            하며, 정확성과 최신성을 보장하지 않습니다. 최종 내용은 반드시 각 기관의
            원문 공고를 확인해 주세요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink">9. 문의</h2>
          <p className="text-[15px] leading-relaxed text-ink-secondary">
            본 방침에 대한 문의는{" "}
            <a className="text-primary hover:underline" href="mailto:junhyeok6692@gmail.com">
              junhyeok6692@gmail.com
            </a>
            으로 연락해 주세요.
          </p>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
