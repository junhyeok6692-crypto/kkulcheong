import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "꿀청 · 정부지원사업 모아보기",
  description:
    "전국 정부지원사업 공고를 한 곳에서. 분야·지역 필터, 마감임박 정렬, 내 정보 기반 맞춤 검색.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        {/* Pretendard (한글 최적화 폰트) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendard-variable-dynamic-subset.min.css"
        />
        {children}
      </body>
    </html>
  );
}
