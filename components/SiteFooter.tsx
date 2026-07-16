import Link from "next/link";

// 애드센스 심사에 필요한 필수 페이지 링크를 모든 페이지에 노출
export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-ink-faint">
        <nav className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link href="/training" className="hover:text-primary">
            훈련과정
          </Link>
          <Link href="/guide" className="hover:text-primary">
            가이드
          </Link>
          <Link href="/about" className="hover:text-primary">
            소개
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-primary">
            이용약관
          </Link>
          <Link href="/contact" className="hover:text-primary">
            문의
          </Link>
        </nav>
        <p>
          데이터 출처: 기업마당 · 온통청년 · K-Startup · 고용24 · 1시간마다 자동 갱신
        </p>
        <p className="mt-1">
          © 2026 꿀청 · 공고의 최종 내용은 각 기관의 원문 공고를 확인해 주세요.
        </p>
      </div>
    </footer>
  );
}
