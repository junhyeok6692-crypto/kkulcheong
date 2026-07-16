"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/training";

const won = (n: number) => (n > 0 ? `${n.toLocaleString()}원` : "무료");

export default function CourseList({ courses }: { courses: Course[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");

  const regions = useMemo(
    () => [...new Set(courses.map((c) => c.region).filter(Boolean))].sort(),
    [courses]
  );

  const visible = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (region && c.region !== region) return false;
      if (kw && !(c.title + c.inst).toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [courses, q, region]);

  const btn = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm transition ${
      active
        ? "bg-primary text-on-primary"
        : "border border-hairline bg-surface text-ink-muted hover:border-primary/40"
    }`;

  return (
    <div>
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="과정명·훈련기관 검색 (예: 코딩, 회계)"
          aria-label="훈련과정 검색"
          className="mb-3 w-full rounded border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRegion("")} className={btn(region === "")}>
            전체 {courses.length}
          </button>
          {regions.map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={btn(region === r)}>
              {r} {courses.filter((c) => c.region === r).length}
            </button>
          ))}
          <span className="ml-auto self-center text-sm text-ink-faint">
            {visible.length}개
          </span>
        </div>
      </div>

      <ul className="space-y-3">
        {visible.map((c) => (
          <li key={c.id}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[12px] border border-hairline bg-surface p-4 transition hover:shadow-soft"
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {c.score > 0 && (
                  <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-xs font-semibold text-accent-green">
                    만족도 {c.score}점
                  </span>
                )}
                {c.region && (
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-muted">
                    {c.region}
                  </span>
                )}
                <span className="ml-auto text-xs text-ink-muted">
                  {c.start} ~ {c.end}
                </span>
              </div>

              <h3 className="mb-1 font-semibold leading-snug text-ink">{c.title}</h3>
              <p className="mb-2 text-sm text-ink-muted">{c.inst}</p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-faint">
                <span>수강료 {won(c.cost)}</span>
                {c.capacity > 0 && (
                  <span>
                    정원 {c.capacity}명 · 신청 {c.enrolled}명
                  </span>
                )}
                {c.tel && <span>{c.tel}</span>}
                <span className="ml-auto font-medium text-primary">
                  고용24에서 보기 ↗
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="py-16 text-center text-ink-faint">조건에 맞는 과정이 없습니다.</p>
      )}
    </div>
  );
}
