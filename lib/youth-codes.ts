// 온통청년 API 코드표 (출처: youthcenter.go.kr /downloadform/API코드정보.xlsx)
// 자격 자가진단에 사용한다.

export const EARN_CND: Record<string, string> = {
  "0043001": "무관",
  "0043002": "연소득",
  "0043003": "기타",
};

export const JOB_CD: Record<string, string> = {
  "0013001": "재직자",
  "0013002": "자영업자",
  "0013003": "미취업자",
  "0013004": "프리랜서",
  "0013005": "일용근로자",
  "0013006": "(예비)창업자",
  "0013007": "단기근로자",
  "0013008": "영농종사자",
  "0013009": "기타",
  "0013010": "제한없음",
};

export const SCHOOL_CD: Record<string, string> = {
  "0049001": "고졸 미만",
  "0049002": "고교 재학",
  "0049003": "고졸 예정",
  "0049004": "고교 졸업",
  "0049005": "대학 재학",
  "0049006": "대졸 예정",
  "0049007": "대학 졸업",
  "0049008": "석·박사",
  "0049009": "기타",
  "0049010": "제한없음",
};

export const MARRIAGE_CD: Record<string, string> = {
  "0055001": "기혼",
  "0055002": "미혼",
  "0055003": "제한없음",
};

export const SPECIAL_CD: Record<string, string> = {
  "0014001": "중소기업",
  "0014002": "여성",
  "0014003": "기초생활수급자",
  "0014004": "한부모가정",
  "0014005": "장애인",
  "0014006": "농업인",
  "0014007": "군인",
  "0014008": "지역인재",
  "0014009": "기타",
  "0014010": "제한없음",
};

// 사용자가 자가진단에서 고르는 선택지 (자주 쓰는 것만 노출)
export const JOB_CHOICES = [
  "재직자", "미취업자", "자영업자", "프리랜서", "(예비)창업자", "단기근로자",
];
export const SCHOOL_CHOICES = [
  "고교 재학", "고교 졸업", "대학 재학", "대학 졸업", "석·박사",
];

// "제한없음"/"기타" 계열은 조건 없음으로 간주
const NO_LIMIT = new Set(["제한없음", "무관", "기타"]);

export const codeNames = (raw: string, table: Record<string, string>): string[] =>
  raw
    .split(",")
    .map((c) => table[c.trim()])
    .filter((v): v is string => Boolean(v));

/** 정책의 코드 목록이 사용자 선택을 허용하는지. 조건이 없거나 '제한없음'이면 통과. */
export function codeAllows(names: string[], mine: string): boolean {
  if (!names.length) return true;
  if (names.some((n) => NO_LIMIT.has(n))) return true;
  return names.includes(mine);
}
