"use client";

import { useEffect, useMemo, useState } from "react";
import type { Course } from "@/lib/training";

const won = (n: number) => (n > 0 ? `${n.toLocaleString()}원` : "무료");

export default function CourseList({ courses }: { courses: Course[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

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

  // 필터/개수 변경 시 1페이지로
  useEffect(() => {
    setPage(1);
  }, [q, region, perPage]);

  const pageCount = Math.max(1, Math.ceil(visible.length / perPage));
  const curPage = Math.min(page, pageCount);
  const paged = visible.slice((curPage - 1) * perPage, curPage * perPage);
  const goPage = (n: number) => {
    setPage(Math.min(Math.max(1, n), pageCount));
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const pageNums: (number | "…")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - curPage) <= 2) pageNums.push(i);
    else if (pageNums[pageNums.length - 1] !== "…") pageNums.push("…");
  }

  const btn = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm transition ${
      active
        ? "bg-primary text-on-primary"
        : "border border-hairline bg-surface text-ink-muted hover:border-primary/40"
    }`;

  return (
    <div>
      {/* 검색 + 필터 */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-hairline bg-canvas/90 px-4 py-4 backdrop-blur">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="과정명·훈련기관 검색 (예: 코딩, 회계)"
          aria-label="훈련과정 검색"
          className="mb-3 w-full rounded border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setRegion("")} className={btn(region === "")}>
            전체 {courses.length}
          </button>
          {regions.map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={btn(region === r)}>
              {r} {courses.filter((c) => c.region === r).length}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-ink-faint">{visible.length}개</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              aria-label="페이지당 개수"
              className="rounded-lg border border-hairline bg-surface px-2 py-1 text-ink-muted"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}개씩
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <ul className="space-y-3">
        {paged.map((c) => (
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

      {/* 페이지네이션 */}
      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1 text-sm">
          <button
            onClick={() => goPage(curPage - 1)}
            disabled={curPage === 1}
            className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-ink-muted disabled:opacity-40"
          >
            이전
          </button>
          {pageNums.map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-2 text-ink-faint">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => goPage(n)}
                aria-label={`${n}페이지`}
                aria-current={n === curPage ? "page" : undefined}
                className={`min-w-9 rounded-lg px-3 py-1.5 transition ${
                  n === curPage
                    ? "bg-primary text-on-primary"
                    : "border border-hairline bg-surface text-ink-muted hover:border-primary/40"
                }`}
              >
                {n}
              </button>
            )
          )}
          <button
            onClick={() => goPage(curPage + 1)}
            disabled={curPage === pageCount}
            className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-ink-muted disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
