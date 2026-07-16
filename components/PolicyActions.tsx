"use client";

import { useEffect, useState } from "react";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { loadSaved, saveSaved } from "@/lib/saved";

/** 상세페이지의 찜하기 + 캘린더 담기 버튼 */
export default function PolicyActions({
  id,
  title,
  endDate,
  org,
  url,
}: {
  id: string;
  title: string;
  endDate: string | null;
  org: string;
  url: string;
}) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(loadSaved().includes(id));
    setReady(true);
  }, [id]);

  const toggle = () => {
    const cur = loadSaved();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    saveSaved(next);
    setSaved(next.includes(id));
  };

  const addCalendar = () => {
    if (!endDate) return;
    downloadIcs(
      `${id}.ics`,
      buildIcs({ id, title, endDate, org, url: `https://kkulcheong.com/policy/${id}` })
    );
  };

  if (!ready) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={toggle}
        aria-pressed={saved}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
          saved
            ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
            : "border-hairline bg-surface text-ink-muted hover:border-primary/40"
        }`}
      >
        {saved ? "★ 관심공고 저장됨" : "☆ 관심공고 저장"}
      </button>

      {endDate && (
        <button
          onClick={addCalendar}
          className="rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-primary/40"
        >
          마감일 캘린더에 추가
        </button>
      )}
    </div>
  );
}
