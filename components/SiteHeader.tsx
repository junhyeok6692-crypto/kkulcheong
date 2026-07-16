import Link from "next/link";

// 서브페이지용 상단 바 (홈은 히어로가 대신함)
export default function SiteHeader() {
  return (
    <header className="border-b border-[#f2e2ae] bg-gradient-to-b from-[#fff7da] to-[#fdeec2]">
      <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
        <Link href="/" aria-label="꿀청 홈">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-v3.png"
            alt="꿀청"
            className="h-10 w-auto"
            style={{ filter: "drop-shadow(0 1px 2px rgba(80,55,0,0.25))" }}
          />
        </Link>
      </div>
    </header>
  );
}
