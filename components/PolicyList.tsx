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

// 마감까지 남은 일수 (null이면 상시/미정)
function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate + "T23:59:59");
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

function Dday({ endDate }: { endDate: string | null }) {
  const d = daysLeft(endDate);
  if (d === null) return <span className="text-xs text-gray-400">상시·미정</span>;
  if (d < 0) return <span className="text-xs text-gray-400">마감</span>;
  return (
    <span className={`text-xs font-semibold ${d <= 7 ? "text-red-500" : "text-emerald-600"}`}>
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
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-gray-300 text-gray-600 hover:border-emerald-400 dark:border-gray-700 dark:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function Card({ p }: { p: Policy }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-gray-200 p-4 transition hover:border-emerald-400 hover:shadow-sm dark:border-gray-800 dark:hover:border-emerald-600"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          {p.category}
        </span>
        {p.regions.slice(0, 2).map((r) => (
          <span
            key={r}
            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          >
            {r}
          </span>
        ))}
        <span className="ml-auto">
          <Dday endDate={p.endDate} />
        </span>
      </div>
      <h3 className="mb-1 font-semibold leading-snug">{p.title}</h3>
      {p.summary && (
        <p className="mb-2 line-clamp-2 text-sm text-gray-500">{p.summary}</p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
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
    setMatchMine(isProfileSet(p)); // 프로필 있으면 맞춤 자동 on
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
      <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowProfile((s) => !s)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium"
        >
          <span>🙋 내 정보로 맞춤 찾기</span>
          {profileSet && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {[profile.region, ...profile.interests].filter(Boolean).slice(0, 3).join(" · ")}
              {profile.interests.length > 2 ? " …" : ""}
            </span>
          )}
          <span className="ml-auto text-gray-400">{showProfile ? "▲" : "▼"}</span>
        </button>

        {showProfile && (
          <div className="space-y-4 border-t border-gray-100 px-4 py-4 dark:border-gray-800">
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">지역</p>
              <select
                value={profile.region}
                onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">선택 안 함</option>
                {REGION_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">대상 (복수 선택)</p>
              <div className="flex flex-wrap gap-2">
                {TARGET_OPTIONS.map((t) => (
                  <Chip key={t} active={profile.targets.includes(t)} onClick={() => toggle("targets", t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">관심 분야 (복수 선택)</p>
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
                className="text-xs text-gray-400 underline"
              >
                내 정보 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* 검색 + 보기 옵션 */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="사업명·키워드 검색 (예: 창업, 자금, 청년)"
          className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setMatchMine((v) => !v)}
            disabled={!profileSet}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              matchMine && profileSet
                ? "bg-emerald-500 text-white"
                : "border border-gray-300 text-gray-600 disabled:opacity-40 dark:border-gray-700"
            }`}
          >
            ✨ 내 맞춤만
          </button>
          <button
            onClick={() => setByRegion((v) => !v)}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              byRegion ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : "border border-gray-300 text-gray-600 dark:border-gray-700"
            }`}
          >
            🗺 지역별 보기
          </button>
          <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={hideExpired}
              onChange={(e) => setHideExpired(e.target.checked)}
              className="accent-emerald-500"
            />
            마감 제외
          </label>
          <span className="ml-auto text-gray-500">{filtered.length}건</span>
        </div>
      </div>

      {/* 목록 */}
      {byRegion ? (
        <div className="space-y-8">
          {grouped.map(([region, items]) => (
            <section key={region}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span className="rounded bg-emerald-500 px-2 py-0.5 text-sm text-white">{region}</span>
                <span className="text-sm font-normal text-gray-400">{items.length}건</span>
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
        <p className="py-16 text-center text-gray-400">
          조건에 맞는 지원사업이 없습니다.
          {matchMine && " 내 정보 조건을 넓혀보세요."}
        </p>
      )}
    </div>
  );
}
