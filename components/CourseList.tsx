"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/training";
import { APTITUDES } from "@/lib/ncs";

const won = (n: number) => (n > 0 ? `${n.toLocaleString()}원` : "무료");
const APT_KEY = "policyhub.aptitude";

export default function CourseList({ courses }: { courses: Course[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [apts, setApts] = useState<string[]>([]); // 선택한 적성 key
  const [showApt, setShowApt] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  // 선택 저장/복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(APT_KEY);
      if (raw) setApts(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(APT_KEY, JSON.stringify(apts));
  }, [apts, loaded]);

  // 선택한 적성 → NCS 분야 코드
  const wantNcs = useMemo(() => {
    const s = new Set<string>();
    for (const a of APTITUDES) if (apts.includes(a.key)) a.ncs.forEach((n) => s.add(n));
    return s;
  }, [apts]);

  const regions = useMemo(
    () => [...new Set(courses.map((c) => c.region).filter(Boolean))].sort(),
    [courses]
  );

  const visible = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (wantNcs.size && !wantNcs.has(c.ncs1)) return false;
      if (region && c.region !== region) return false;
      if (kw && !(c.title + c.inst + c.field).toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [courses, q, region, wantNcs]);

  useEffect(() => {
    setPage(1);
  }, [q, region, perPage, apts]);

  const pageCount = Math.max(1, Math.ceil(visible.length / perPage));
  const curPage = Math.min(page, pageCount);
  const paged = visible.slice((curPage - 1) * perPage, curPage * perPage);
  const goPage = (n: number) => {
    setPage(Math.min(Math.max(1, n), pageCount));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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

  const toggleApt = (k: string) =>
    setApts((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <div>
      {/* 적성으로 찾기 */}
      <div className="mb-4 rounded-[12px] border border-hairline bg-surface">
        <button
          onClick={() => setShowApt((s) => !s)}
          aria-expanded={showApt}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ink"
        >
          <span>내 적성으로 찾기</span>
          {apts.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {APTITUDES.filter((a) => apts.includes(a.key))
                .map((a) => a.label)
                .slice(0, 2)
                .join(" · ")}
              {apts.length > 2 ? " …" : ""}
            </span>
          )}
          <span className="ml-auto text-ink-faint">{showApt ? "▲" : "▼"}</span>
        </button>

        {showApt && (
          <div className="border-t border-hairline px-4 py-4">
            <p className="mb-3 text-xs leading-relaxed text-ink-faint">
              하고 싶은 일을 고르면 그 분야의 훈련과정만 보여드립니다. 여러 개
              선택할 수 있어요.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {APTITUDES.map((a) => {
                const on = apts.includes(a.key);
                const n = courses.filter((c) => a.ncs.includes(c.ncs1)).length;
                return (
                  <button
                    key={a.key}
                    onClick={() => toggleApt(a.key)}
                    aria-pressed={on}
                    disabled={n === 0}
                    className={`rounded-[12px] border p-3 text-left transition disabled:opacity-40 ${
                      on
                        ? "border-primary bg-primary/5"
                        : "border-hairline hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`block text-sm font-semibold ${
                        on ? "text-primary" : "text-ink"
                      }`}
                    >
                      {a.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-faint">
                      {a.desc}
                    </span>
                    <span className="mt-1 block text-xs text-ink-muted">{n}개</span>
                  </button>
                );
              })}
            </div>
            {apts.length > 0 && (
              <button
                onClick={() => setApts([])}
                className="mt-3 text-xs text-ink-faint underline"
              >
                선택 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* 검색 + 지역 + 개수 */}
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
            전체 지역
          </button>
          {regions.map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={btn(region === r)}>
              {r}
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
            <div className="relative rounded-[12px] border border-hairline bg-surface p-4 transition hover:shadow-soft">
              {/* 카드 전체 클릭 → 상세페이지 (고용24 버튼만 예외) */}
              <Link
                href={`/training/${c.id}`}
                className="absolute inset-0 rounded-[12px]"
                aria-label={`${c.title} 상세보기`}
              />
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {c.score > 0 && (
                  <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-xs font-semibold text-accent-green">
                    만족도 {c.score}점
                  </span>
                )}
                <span className="rounded-full border border-hairline px-2 py-0.5 text-xs text-ink-secondary">
                  {c.field}
                </span>
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
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="relative z-10 ml-auto shrink-0 rounded-lg border border-hairline px-2 py-1 font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5"
                >
                  고용24에서 보기 ↗
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="py-16 text-center text-ink-faint">
          조건에 맞는 과정이 없습니다. 적성이나 지역 선택을 넓혀보세요.
        </p>
      )}

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

