// 자격 자가진단 — 내 조건으로 "받을 수 있는지" 판정

import type { PolicyListItem } from "./types";
import { codeAllows } from "./youth-codes";

export type MyInfo = {
  birthYear: number | null; // 나이 계산용
  job: string; // "" = 미선택
  school: string; // "" = 미선택
  income: number | null; // 연소득(만원)
};

export const EMPTY_INFO: MyInfo = {
  birthYear: null,
  job: "",
  school: "",
  income: null,
};

export const INFO_KEY = "policyhub.myinfo";

export function isInfoSet(m: MyInfo): boolean {
  return !!(m.birthYear || m.job || m.school || m.income !== null);
}

export function loadInfo(): MyInfo {
  if (typeof window === "undefined") return EMPTY_INFO;
  try {
    const raw = localStorage.getItem(INFO_KEY);
    return raw ? { ...EMPTY_INFO, ...JSON.parse(raw) } : EMPTY_INFO;
  } catch {
    return EMPTY_INFO;
  }
}

export function saveInfo(m: MyInfo) {
  if (typeof window !== "undefined")
    localStorage.setItem(INFO_KEY, JSON.stringify(m));
}

/** 만 나이 (연도 기준 근사 — 생일 미입력이라 ±1 오차 가능) */
export function ageOf(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

export type Verdict = "eligible" | "ineligible" | "unknown";

export type Judgement = {
  verdict: Verdict;
  reasons: string[]; // 불가/확인필요 사유
};

/**
 * 판정 규칙
 *  - 정책에 자격 데이터가 없으면(기업마당 등) unknown
 *  - 내가 입력한 항목만 검사한다 (미입력 항목은 건너뜀)
 *  - 하나라도 명확히 어긋나면 ineligible
 *  - 다 통과하면 eligible (단, 나이 조건이 아예 없으면 unknown 쪽으로 보수적)
 */
export function judge(p: PolicyListItem, me: MyInfo): Judgement {
  const e = p.elig;
  if (!e) return { verdict: "unknown", reasons: ["이 공고는 자격 정보를 제공하지 않습니다"] };

  const reasons: string[] = [];
  let checked = 0;

  // 나이
  if (me.birthYear && !e.ageLimitNone && (e.minAge || e.maxAge)) {
    checked++;
    const age = ageOf(me.birthYear);
    if (e.minAge && age < e.minAge) reasons.push(`나이 미달 (만 ${e.minAge}세 이상)`);
    else if (e.maxAge && age > e.maxAge) reasons.push(`나이 초과 (만 ${e.maxAge}세 이하)`);
  }

  // 취업상태
  if (me.job) {
    checked++;
    if (!codeAllows(e.jobs, me.job))
      reasons.push(`취업상태 불일치 (대상: ${e.jobs.join(", ")})`);
  }

  // 학력
  if (me.school) {
    checked++;
    if (!codeAllows(e.schools, me.school))
      reasons.push(`학력 불일치 (대상: ${e.schools.join(", ")})`);
  }

  // 소득 (연소득 조건이 있고 상한이 지정된 경우만)
  if (me.income !== null && e.earnKind === "연소득" && e.earnMax > 0) {
    checked++;
    if (me.income > e.earnMax)
      reasons.push(`소득 초과 (연 ${e.earnMax.toLocaleString()}만원 이하)`);
    else if (e.earnMin > 0 && me.income < e.earnMin)
      reasons.push(`소득 미달 (연 ${e.earnMin.toLocaleString()}만원 이상)`);
  }

  if (reasons.length) return { verdict: "ineligible", reasons };
  if (checked === 0)
    return { verdict: "unknown", reasons: ["대조할 조건이 없습니다"] };
  return { verdict: "eligible", reasons: [] };
}
