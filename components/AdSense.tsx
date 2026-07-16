// 게시자 ID (예: ca-pub-1234567890123456) — .env 에 넣으면 자동으로 활성화됨
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/**
 * 애드센스 로더. root layout 에서 한 번만 렌더한다.
 * 게시자 ID가 없으면 아무것도 렌더하지 않아 심사 전에는 완전히 무해하다.
 *
 * next/script 를 쓰지 않는 이유:
 *   afterInteractive  → HTML 에 <link rel="preload"> 만 남고 script 는 JS 로 주입
 *   beforeInteractive → self.__next_s 로더 큐에 push 하는 형태로만 남음
 *   둘 다 HTML 안에 진짜 <script src="...adsbygoogle.js"> 태그가 없어서
 *   애드센스 소유권 확인 크롤러가 코드를 못 찾을 수 있다.
 *
 * 순수 <script> 엘리먼트를 렌더하면 React 19 가 <head> 로 호이스팅하면서
 * 서버 HTML 에 실제 태그를 그대로 출력한다.
 */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
