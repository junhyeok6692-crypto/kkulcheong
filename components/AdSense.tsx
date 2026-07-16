import Script from "next/script";

// 게시자 ID (예: ca-pub-1234567890123456) — .env 에 넣으면 자동으로 활성화됨
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/**
 * 애드센스 로더. layout 에서 한 번만 렌더한다.
 * 게시자 ID가 없으면 아무것도 렌더하지 않아 개발/심사 전에는 완전히 무해하다.
 */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
