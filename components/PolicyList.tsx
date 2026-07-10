"use client";

import { useEffect, useMemo, useState } from "react";
import type { Policy } from "@/lib/bizinfo";
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

// 분야별 카테고리 dot 색상 (장식 전용 스티커 팔레트)
const CAT_DOT: Record<string, string> = {
  창업: "bg-accent-purple",
  금융: "bg-accent-sky",
  기술: "bg-accent-teal",
  경영: "bg-accent-orange",
  인력: "bg-accent-pink",
  수출: "bg-accent-green",
  내수: "bg-accent-brown",
  기타: "bg-ink-faint",
};

// 마감까지 남은 일수 (null이면 상시/미정)
function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate + "T23:59:59");
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

function Dday({ endDate }: { endDate: string | null }) {
  const d = daysLeft(endDate);
  if (d === null) return <span className="text-xs text-ink-faint">상시·미정</span>;
  if (d < 0) return <span className="text-xs text-ink-faint">마감</span>;
  return (
    <span className={`text-xs font-semibold ${d <= 7 ? "text-accent-orange" : "text-ink-muted"}`}>
      D-{d}
    </span>
  );
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

function Card({ p }: { p: Policy }) {
  const dot = CAT_DOT[p.category] ?? "bg-ink-faint";
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-[12px] border border-hairline bg-surface p-4 transition hover:shadow-soft"
    >
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
        <span className="ml-auto">
          <Dday endDate={p.endDate} />
        </span>
      </div>
      <h3 className="mb-1 font-semibold leading-snug text-ink">{p.title}</h3>
      {p.summary && (
        <p className="mb-2 line-clamp-2 text-sm text-ink-muted">{p.summary}</p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-faint">
        <span>🏛 {p.org}</span>
        {p.target && <span>🎯 {p.target}</span>}
        {p.period && <span>📅 {p.period}</span>}
      </div>
    </a>
  );
}

// 지역별 그룹핑
function groupByRegion(list: Policy[]) {
  const map = new Map<string, Policy[]>();
  for (const p of list) {
    const keys = p.regions.length ? p.regions : ["전국·공통"];
    for (const k of keys) {
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
  }
  const order = [...REGION_OPTIONS, "전국", "전국·공통"];
  return [...map.entries()].sort(
    (a, b) =>
      (order.indexOf(a[0]) === -1 ? 99 : order.indexOf(a[0])) -
      (order.indexOf(b[0]) === -1 ? 99 : order.indexOf(b[0]))
  );
}

export default function PolicyList({ policies }: { policies: Policy[] }) {
  const [q, setQ] = useState("");
  const [hideExpired, setHideExpired] = useState(true);
  const [byRegion, setByRegion] = useState(false);
  const [matchMine, setMatchMine] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // 프로필 (localStorage 연동)
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setMatchMine(isProfileSet(p));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveProfile(profile);
  }, [profile, loaded]);

  const toggle = (key: "targets" | "interests", v: string) =>
    setProfile((p) => ({
      ...p,
      [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v],
    }));

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return policies
      .filter((p) => {
        if (matchMine && isProfileSet(profile) && !matchPolicy(p, profile)) return false;
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
  }, [policies, q, hideExpired, matchMine, profile]);

  const grouped = useMemo(() => groupByRegion(filtered), [filtered]);
  const profileSet = isProfileSet(profile);

  return (
    <div>
      {/* 내 정보 패널 */}
      <div className="mb-4 rounded-[12px] border border-hairline bg-surface">
        <button
          onClick={() => setShowProfile((s) => !s)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ink"
        >
          <span>🙋 내 정보로 맞춤 찾기</span>
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
            {profileSet && (
              <button
                onClick={() => setProfile(EMPTY_PROFILE)}
                className="text-xs text-ink-faint underline"
              >
                내 정보 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* 검색 + 보기 옵션 */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-hairline bg-canvas/90 px-4 py-4 backdrop-blur">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="사업명·키워드 검색 (예: 창업, 자금, 청년)"
          className="mb-3 w-full rounded border border-hairline bg-surface px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary focus:shadow-soft"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setMatchMine((v) => !v)}
            disabled={!profileSet}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              matchMine && profileSet
                ? "bg-primary text-on-primary"
                : "border border-hairline bg-surface text-ink-muted disabled:opacity-40"
            }`}
          >
            ✨ 내 맞춤만
          </button>
          <button
            onClick={() => setByRegion((v) => !v)}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              byRegion
                ? "bg-ink text-surface"
                : "border border-hairline bg-surface text-ink-muted"
            }`}
          >
            🗺 지역별 보기
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
          <span className="ml-auto text-ink-faint">{filtered.length}건</span>
        </div>
      </div>

      {/* 목록 */}
      {byRegion ? (
        <div className="space-y-8">
          {grouped.map(([region, items]) => (
            <section key={region}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
                <span className="rounded-md bg-primary px-2 py-0.5 text-sm text-on-primary">{region}</span>
                <span className="text-sm font-normal text-ink-faint">{items.length}건</span>
              </h2>
              <ul className="space-y-3">
                {items.map((p) => (
                  <li key={p.id + region}>
                    <Card p={p} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <Card p={p} />
            </li>
          ))}
        </ul>
      )}

      {filtered.length === 0 && (
        <p className="py-16 text-center text-ink-faint">
          조건에 맞는 지원사업이 없습니다.
          {matchMine && " 내 정보 조건을 넓혀보세요."}
        </p>
      )}
    </div>
  );
}
