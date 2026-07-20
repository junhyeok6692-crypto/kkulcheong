"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PolicyListItem } from "@/lib/types";
import {
  EMPTY_INFO, isInfoSet, loadInfo, saveInfo, judge, ageOf, type MyInfo,
} from "@/lib/eligibility";
import { JOB_CHOICES, SCHOOL_CHOICES } from "@/lib/youth-codes";
import { loadSaved, saveSaved } from "@/lib/saved";
import {
  REGION_OPTIONS,
  TARGET_OPTIONS,
  INTEREST_OPTIONS,
  EMPTY_PROFILE,
  isProfileSet,
  loadProfile,
  saveProfile,
  matchPolicy,
  type Profile,
} from "@/lib/profile";

// 소스 표시 이름
const SOURCE_LABEL: Record<string, string> = {
  기업마당: "정부지원사업",
  온통청년: "청년정책",
  "K-Startup": "창업지원",
};

// 분야별 카테고리 dot 색상 (장식 전용 스티커 팔레트)
const CAT_DOT: Record<string, string> = {
  // 정부지원사업(기업마당)
  창업: "bg-accent-purple",
  금융: "bg-accent-sky",
  기술: "bg-accent-teal",
  경영: "bg-accent-orange",
  인력: "bg-accent-pink",
  수출: "bg-accent-green",
  내수: "bg-accent-brown",
  기타: "bg-ink-faint",
  // 청년정책(온통청년)
  일자리: "bg-accent-teal",
  주거: "bg-accent-orange",
  "교육･직업훈련": "bg-accent-purple",
  "금융･복지･문화": "bg-accent-pink",
  "참여･기반": "bg-accent-green",
  // 창업지원(K-Startup)
  사업화: "bg-accent-purple",
  "기술개발(R&D)": "bg-accent-teal",
  창업교육: "bg-accent-sky",
  "멘토링ㆍ컨설팅ㆍ교육": "bg-accent-sky",
  "시설ㆍ공간ㆍ보육": "bg-accent-orange",
  "융자ㆍ보증": "bg-accent-green",
  "판로ㆍ해외진출": "bg-accent-pink",
  글로벌: "bg-accent-pink",
  "행사ㆍ네트워크": "bg-accent-brown",
};

// 마감까지 남은 일수 (null이면 상시/미정)
function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate + "T23:59:59+09:00");
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

// 마감임박 기준: D-5 이내
const URGENT_DAYS = 5;
function isUrgent(endDate: string | null): boolean {
  const d = daysLeft(endDate);
  return d !== null && d >= 0 && d <= URGENT_DAYS;
}

function Dday({ endDate }: { endDate: string | null }) {
  const d = daysLeft(endDate);
  if (d === null) return <span className="text-xs text-ink-faint">상시·미정</span>;
  if (d < 0) return <span className="text-xs text-ink-faint">마감</span>;
  if (d <= URGENT_DAYS)
    return (
      <span className="rounded-full bg-accent-orange px-2 py-0.5 text-xs font-semibold text-white">
        마감임박 D-{d}
      </span>
    );
  return <span className="text-xs font-medium text-ink-muted">D-{d}</span>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-hairline bg-surface text-ink-muted hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function Card({
  p,
  saved,
  onToggleSave,
  verdict,
}: {
  p: PolicyListItem;
  saved: boolean;
  onToggleSave: (id: string) => void;
  verdict?: "eligible" | "ineligible" | "unknown";
}) {
  const dot = CAT_DOT[p.category] ?? "bg-ink-faint";
  const urgent = isUrgent(p.endDate);
  return (
    <div
      className={`relative rounded-[12px] border bg-surface p-4 transition hover:shadow-soft ${
        urgent ? "border-accent-orange/50 ring-1 ring-accent-orange/25" : "border-hairline"
      }`}
    >
      {/* 카드 전체 클릭 → 상세페이지 (원문 버튼만 예외) */}
      <Link
        href={`/policy/${p.id}`}
        className="absolute inset-0 rounded-[12px]"
        aria-label={`${p.title} 상세보기`}
      />
      <div className="mb-1.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2 py-0.5 text-xs text-ink-secondary">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {p.category}
        </span>
        {p.regions.slice(0, 2).map((r) => (
          <span key={r} className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-muted">
            {r}
          </span>
        ))}
        {verdict === "eligible" && (
          <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-xs font-medium text-accent-green">
            받을 수 있어요
          </span>
        )}
        {verdict === "ineligible" && (
          <span className="rounded-full bg-ink-faint/15 px-2 py-0.5 text-xs text-ink-faint">
            조건 불일치
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <Dday endDate={p.endDate} />
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(p.id);
            }}
            aria-pressed={saved}
            aria-label={saved ? "관심공고 해제" : "관심공고 저장"}
            className={`relative z-10 text-base leading-none ${
              saved ? "text-accent-orange" : "text-ink-faint hover:text-accent-orange"
            }`}
          >
            {saved ? "★" : "☆"}
          </button>
        </span>
      </div>
      <h3 className="mb-1 font-semibold leading-snug text-ink">{p.title}</h3>
      {p.summary && (
        <p className="mb-2 line-clamp-2 text-sm text-ink-muted">{p.summary}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span>{p.org}</span>
        {p.target && <span>대상 {p.target}</span>}
        {p.period && <span>{p.period}</span>}
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 ml-auto shrink-0 rounded-lg border border-hairline px-2 py-1 font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5"
        >
          원문 공고 ↗
        </a>
      </div>
    </div>
  );
}

// 정책이 속한 지역 키 (지역 태그 없으면 전국·공통)
const REGION_ORDER = [...REGION_OPTIONS, "전국", "전국·공통"];
const NATIONWIDE = ["전국", "전국·공통"];
function policyRegions(p: PolicyListItem): string[] {
  return p.regions.length ? p.regions : ["전국·공통"];
}
const regionBtnCls = (active: boolean) =>
  `rounded-full px-3 py-1 text-sm transition ${
    active
      ? "bg-primary text-on-primary"
      : "border border-hairline bg-surface text-ink-muted hover:border-primary/40"
  }`;

export default function PolicyList({ policies }: { policies: PolicyListItem[] }) {
  const [q, setQ] = useState("");
  const [hideExpired, setHideExpired] = useState(true);
  const [regionMode, setRegionMode] = useState(false);
  const [regionFilter, setRegionFilter] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<"" | PolicyListItem["source"]>("");
  const [myInfo, setMyInfo] = useState<MyInfo>(EMPTY_INFO);
  const [eligOnly, setEligOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // 프로필 (localStorage 연동)
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setProfile(loadProfile());
    setMyInfo(loadInfo());
    setSavedIds(loadSaved());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveProfile(profile);
  }, [profile, loaded]);
  useEffect(() => {
    if (loaded) saveInfo(myInfo);
  }, [myInfo, loaded]);
  // 필터/페이지 크기가 바뀌면 1페이지로 초기화
  useEffect(() => {
    setPage(1);
  }, [q, hideExpired, profile, regionFilter, sourceFilter, perPage, eligOnly, savedOnly, myInfo]);

  const toggleSave = (id: string) => {
    const next = savedIds.includes(id)
      ? savedIds.filter((x) => x !== id)
      : [...savedIds, id];
    setSavedIds(next);
    saveSaved(next);
  };

  const toggle = (key: "targets" | "interests", v: string) =>
    setProfile((p) => ({
      ...p,
      [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v],
    }));

  // 소스/지역 필터를 제외한 나머지 필터 적용 (소스 버튼 카운트의 기준)
  const preBase = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return policies
      .filter((p) => {
        if (savedOnly && !savedIds.includes(p.id)) return false;
        if (eligOnly && isInfoSet(myInfo) && judge(p, myInfo).verdict === "ineligible")
          return false;
        if (isProfileSet(profile) && !matchPolicy(p, profile)) return false;
        if (hideExpired) {
          const d = daysLeft(p.endDate);
          if (d !== null && d < 0) return false;
        }
        if (kw) {
          const hay = (p.title + p.summary + p.tags.join(" ")).toLowerCase();
          if (!hay.includes(kw)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = daysLeft(a.endDate);
        const db = daysLeft(b.endDate);
        const va = da === null || da < 0 ? Infinity : da;
        const vb = db === null || db < 0 ? Infinity : db;
        return va - vb;
      });
  }, [policies, q, hideExpired, profile, eligOnly, myInfo, savedOnly, savedIds]);

  // 소스별 건수 (버튼용)
  const sourceCounts = useMemo(() => {
    const c: Record<string, number> = { 기업마당: 0, 온통청년: 0, "K-Startup": 0 };
    for (const p of preBase) c[p.source] = (c[p.source] ?? 0) + 1;
    return c;
  }, [preBase]);

  // 소스 필터 적용 (지역 버튼 카운트의 기준)
  const base = useMemo(
    () => (sourceFilter ? preBase.filter((p) => p.source === sourceFilter) : preBase),
    [preBase, sourceFilter]
  );

  // 지역별 건수 (버튼용)
  const regionButtons = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of base)
      for (const r of policyRegions(p)) counts[r] = (counts[r] ?? 0) + 1;
    return REGION_ORDER.filter((r) => counts[r]).map((r) => ({ r, n: counts[r] }));
  }, [base]);

  // 선택 지역 적용
  const visible = useMemo(
    () =>
      regionFilter
        ? base.filter((p) => policyRegions(p).includes(regionFilter))
        : base,
    [base, regionFilter]
  );

  const profileSet = isProfileSet(profile);

  // 페이지네이션
  const pageCount = Math.max(1, Math.ceil(visible.length / perPage));
  const curPage = Math.min(page, pageCount);
  const paged = visible.slice((curPage - 1) * perPage, curPage * perPage);
  const goPage = (n: number) => {
    setPage(Math.min(Math.max(1, n), pageCount));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // 표시할 페이지 번호(현재 주변 + 처음/끝)
  const pageNums: (number | "…")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - curPage) <= 2) pageNums.push(i);
    else if (pageNums[pageNums.length - 1] !== "…") pageNums.push("…");
  }

  return (
    <div>
      {/* 내 정보 패널 */}
      <div className="mb-4 rounded-[12px] border border-hairline bg-surface">
        <button
          onClick={() => setShowProfile((s) => !s)}
          aria-expanded={showProfile}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ink"
        >
          <span>내 정보로 맞춤 찾기</span>
          {profileSet && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {[profile.region, ...profile.interests].filter(Boolean).slice(0, 3).join(" · ")}
              {profile.interests.length > 2 ? " …" : ""}
            </span>
          )}
          <span className="ml-auto text-ink-faint">{showProfile ? "▲" : "▼"}</span>
        </button>

        {showProfile && (
          <div className="space-y-4 border-t border-hairline px-4 py-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-muted">지역</p>
              <select
                value={profile.region}
                onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))}
                aria-label="내 지역 선택"
                className="rounded border border-hairline bg-surface px-3 py-1.5 text-sm text-ink"
              >
                <option value="">선택 안 함</option>
                {REGION_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-muted">대상 (복수 선택)</p>
              <div className="flex flex-wrap gap-2">
                {TARGET_OPTIONS.map((t) => (
                  <Chip key={t} active={profile.targets.includes(t)} onClick={() => toggle("targets", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-muted">관심 분야 (복수 선택)</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((i) => (
                  <Chip key={i} active={profile.interests.includes(i)} onClick={() => toggle("interests", i)}>
                    {i}
                  </Chip>
                ))}
              </div>
            </div>
            {/* 자격 자가진단 */}
            <div className="border-t border-hairline pt-4">
              <p className="mb-1 text-xs font-semibold text-ink-muted">
                자격 자가진단 <span className="font-normal">(청년정책에 적용)</span>
              </p>
              <p className="mb-3 text-xs text-ink-faint">
                입력하면 조건이 맞는 공고에 &quot;받을 수 있어요&quot; 표시가 붙습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="출생연도 (예: 1998)"
                  aria-label="출생연도"
                  value={myInfo.birthYear ?? ""}
                  onChange={(e) =>
                    setMyInfo((m) => ({
                      ...m,
                      birthYear: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-40 rounded border border-hairline bg-surface px-3 py-1.5 text-sm text-ink"
                />
                <select
                  aria-label="취업 상태"
                  value={myInfo.job}
                  onChange={(e) => setMyInfo((m) => ({ ...m, job: e.target.value }))}
                  className="rounded border border-hairline bg-surface px-3 py-1.5 text-sm text-ink"
                >
                  <option value="">취업상태</option>
                  {JOB_CHOICES.map((j) => (
                    <option key={j}>{j}</option>
                  ))}
                </select>
                <select
                  aria-label="학력"
                  value={myInfo.school}
                  onChange={(e) => setMyInfo((m) => ({ ...m, school: e.target.value }))}
                  className="rounded border border-hairline bg-surface px-3 py-1.5 text-sm text-ink"
                >
                  <option value="">학력</option>
                  {SCHOOL_CHOICES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="연소득(만원)"
                  aria-label="연소득(만원)"
                  value={myInfo.income ?? ""}
                  onChange={(e) =>
                    setMyInfo((m) => ({
                      ...m,
                      income: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-36 rounded border border-hairline bg-surface px-3 py-1.5 text-sm text-ink"
                />
              </div>
              {myInfo.birthYear && (
                <p className="mt-2 text-xs text-ink-muted">
                  만 {ageOf(myInfo.birthYear)}세로 계산합니다.
                </p>
              )}
            </div>

            {(profileSet || isInfoSet(myInfo)) && (
              <button
                onClick={() => {
                  setProfile(EMPTY_PROFILE);
                  setMyInfo(EMPTY_INFO);
                }}
                className="text-xs text-ink-faint underline"
              >
                내 정보 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* 검색 + 보기 옵션 */}
      {/* z-30: 카드 안의 '원문 공고' 버튼(z-10)이 스크롤 시 이 바를 뚫고 나오지 않도록 위에 둔다 */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-hairline bg-canvas/90 px-4 py-4 backdrop-blur">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="사업명·키워드 검색 (예: 창업, 자금, 청년)"
          aria-label="지원사업 검색"
          className="mb-3 w-full rounded border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:shadow-soft"
        />

        {/* 구분: 정부지원사업 / 청년정책 */}
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <button onClick={() => setSourceFilter("")} className={regionBtnCls(sourceFilter === "")}>
            전체 {preBase.length}
          </button>
          {(["기업마당", "온통청년", "K-Startup"] as const).map((s) =>
            sourceCounts[s] ? (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={regionBtnCls(sourceFilter === s)}
              >
                {SOURCE_LABEL[s]} {sourceCounts[s]}
              </button>
            ) : null
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => {
              setRegionMode((v) => !v);
              setRegionFilter("");
            }}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              regionMode
                ? "bg-ink text-surface"
                : "border border-hairline bg-surface text-ink-muted"
            }`}
          >
            지역별 보기
          </button>
          {isInfoSet(myInfo) && (
            <button
              onClick={() => setEligOnly((v) => !v)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                eligOnly
                  ? "bg-accent-green text-white"
                  : "border border-hairline bg-surface text-ink-muted"
              }`}
            >
              받을 수 있는 것만
            </button>
          )}
          <button
            onClick={() => setSavedOnly((v) => !v)}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              savedOnly
                ? "bg-accent-orange text-white"
                : "border border-hairline bg-surface text-ink-muted"
            }`}
          >
            ★ 관심공고 {savedIds.length > 0 && savedIds.length}
          </button>
          <label className="flex items-center gap-1.5 text-ink-muted">
            <input
              type="checkbox"
              checked={hideExpired}
              onChange={(e) => setHideExpired(e.target.checked)}
              className="accent-primary"
            />
            마감 제외
          </label>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-ink-faint">{visible.length}건</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-lg border border-hairline bg-surface px-2 py-1 text-ink-muted"
              aria-label="페이지당 개수"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}개씩
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 지역 버튼 바 */}
        {regionMode && (
          <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
            {/* 윗줄: 전체 · 전국 · 전국·공통 */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setRegionFilter("")} className={regionBtnCls(regionFilter === "")}>
                전체 {base.length}
              </button>
              {regionButtons
                .filter(({ r }) => NATIONWIDE.includes(r))
                .map(({ r, n }) => (
                  <button key={r} onClick={() => setRegionFilter(r)} className={regionBtnCls(regionFilter === r)}>
                    {r} {n}
                  </button>
                ))}
            </div>
            {/* 아랫줄: 시·도 */}
            <div className="flex flex-wrap gap-2">
              {regionButtons
                .filter(({ r }) => REGION_OPTIONS.includes(r))
                .map(({ r, n }) => (
                  <button key={r} onClick={() => setRegionFilter(r)} className={regionBtnCls(regionFilter === r)}>
                    {r} {n}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 선택 지역 표시 */}
      {regionMode && regionFilter && (
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
          <span className="rounded-md bg-primary px-2 py-0.5 text-sm text-on-primary">
            {regionFilter}
          </span>
          <span className="text-sm font-normal text-ink-faint">{visible.length}건</span>
        </h2>
      )}

      {/* 목록 */}
      <ul className="space-y-3">
        {paged.map((p) => (
          <li key={p.id}>
            <Card
              p={p}
              saved={savedIds.includes(p.id)}
              onToggleSave={toggleSave}
              verdict={isInfoSet(myInfo) ? judge(p, myInfo).verdict : undefined}
            />
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="py-16 text-center text-ink-faint">
          조건에 맞는 지원사업이 없습니다.
          {profileSet && " 내 정보 조건을 넓혀보세요."}
        </p>
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
