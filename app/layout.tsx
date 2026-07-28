import type { Metadata } from "next";
import "./globals.css";
import { AdSenseScript } from "@/components/AdSense";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "꿀청 · 정부지원사업 모아보기",
  description:
    "전국 정부지원사업 공고를 한 곳에서. 분야·지역 필터, 마감임박 정렬, 내 정보 기반 맞춤 검색.",
  verification: {
    // 네이버 서치어드바이저 사이트 소유확인용 태그
    other: { "naver-site-verification": "ab8d3e0769bee526c39a50451c75a4a4479613ba" },
  },
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
        {/* 게시자 ID(NEXT_PUBLIC_ADSENSE_CLIENT)가 있을 때만 로드 */}
        <AdSenseScript />
      </body>
    </html>
  );
}

