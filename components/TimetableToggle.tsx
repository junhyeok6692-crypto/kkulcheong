"use client";

import { useState } from "react";

export default function TimetableToggle({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="rounded-full border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:shadow-soft"
      >
        {open ? "시간표 닫기 ▲" : "시간표 보기 ▼"}
      </button>

      {open && (
        <div className="mt-3 rounded-[12px] border border-hairline bg-surface p-4 text-sm leading-relaxed text-ink-secondary">
          <p className="mb-3">
            요일·시간대별 세부 시간표는 고용24 원문 페이지의 &quot;시간표&quot; 탭에서
            확인할 수 있습니다.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
          >
            고용24에서 시간표 확인하기 ↗
          </a>
        </div>
      )}
    </div>
  );
}
