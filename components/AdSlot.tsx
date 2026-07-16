"use client";

import { useEffect, useRef } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/**
 * 광고 한 칸. 승인 후 slot ID 를 받아 배치한다.
 * 게시자 ID가 없으면 렌더하지 않는다(심사 전 빈 광고 영역 노출 방지).
 */
export default function AdSlot({
  slot,
  format = "auto",
  className = "",
}: {
  slot: string;
  format?: string;
  className?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || pushed.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* 광고 차단기 등 — 조용히 무시 */
    }
  }, []);

  if (!CLIENT || !slot) return null;

  return (
    <div className={`my-6 text-center ${className}`}>
      <p className="mb-1 text-[10px] tracking-wide text-ink-faint">광고</p>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
