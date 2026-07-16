// 내 기본정보(프로필) 기반 맞춤 매칭
import type { PolicyListItem } from "@/lib/types";

export const REGION_OPTIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

// 대상 유형 (bizinfo 데이터에서 느슨하게 매칭)
export const TARGET_OPTIONS = [
  "예비창업자", "1인·개인기업", "소상공인", "중소기업", "중견기업", "청년",
];

const TARGET_KEYWORDS: Record<string, string[]> = {
  예비창업자: ["예비창업", "예비 창업"],
  "1인·개인기업": ["1인", "1인창조", "개인", "프리랜서"],
  소상공인: ["소상공인", "자영업"],
  중소기업: ["중소기업"],
  중견기업: ["중견기업"],
  청년: ["청년"],
};

// 관심 분야 (각 소스의 분야 대분류를 그대로 사용)
export const INTEREST_OPTIONS = [
  // 정부지원사업(기업마당)
  "창업", "금융", "기술", "경영", "인력", "수출", "내수",
  // 청년정책(온통청년)
  "일자리", "주거", "교육･직업훈련", "금융･복지･문화", "참여･기반",
];

export type Profile = {
  region: string; // "" = 미설정
  targets: string[];
  interests: string[];
};

export const EMPTY_PROFILE: Profile = { region: "", targets: [], interests: [] };
export const PROFILE_KEY = "policyhub.profile";

export function isProfileSet(p: Profile): boolean {
  return !!p.region || p.targets.length > 0 || p.interests.length > 0;
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return EMPTY_PROFILE;
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

// 이 정책이 내 프로필에 해당되는가?
export function matchPolicy(p: PolicyListItem, profile: Profile): boolean {
  // 지역: 정책에 지역 태그가 있으면 내 지역 또는 '전국'이 포함돼야 통과.
  //       지역 태그가 아예 없으면 전국 대상으로 보고 통과.
  if (profile.region && p.regions.length > 0) {
    if (!p.regions.includes(profile.region) && !p.regions.includes("전국")) {
      return false;
    }
  }

  // 대상: 선택한 대상 키워드가 정책 어딘가에 등장해야 통과 (느슨한 매칭)
  if (profile.targets.length > 0) {
    const hay = `${p.target} ${p.title} ${p.summary} ${p.tags.join(" ")}`;
    const hit = profile.targets.some((t) =>
      (TARGET_KEYWORDS[t] ?? [t]).some((k) => hay.includes(k))
    );
    if (!hit) return false;
  }

  // 관심분야: 선택했으면 정책 분야가 그 안에 있어야 통과
  if (profile.interests.length > 0 && !profile.interests.includes(p.category)) {
    return false;
  }

  return true;
}
