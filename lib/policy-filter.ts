// 정책 목록 필터링/정렬에 쓰이는 순수 함수 — 서버(API route)와 클라이언트(PolicyList)가
// 동일한 지역 순서·수도권 우선 규칙을 쓰도록 여기 한 곳에 모아둔다.

import type { PolicyListItem } from "./types";
import { REGION_OPTIONS } from "./profile";

// 마감임박 정렬 시, 같은 마감일이면 수도권(서울·인천·경기) 공고를 우선 배치
export const CAPITAL_REGIONS = ["서울", "인천", "경기"];
export function isCapitalArea(p: PolicyListItem): boolean {
  return p.regions.some((r) => CAPITAL_REGIONS.includes(r));
}

// 정책이 속한 지역 키 (지역 태그 없으면 전국·공통)
export const REGION_ORDER = [...REGION_OPTIONS, "전국", "전국·공통"];
export const NATIONWIDE = ["전국", "전국·공통"];
export function policyRegions(p: PolicyListItem): string[] {
  return p.regions.length ? p.regions : ["전국·공통"];
}
