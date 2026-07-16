// 관심공고(찜) — 서버 없이 브라우저 localStorage 에만 저장한다.

export const SAVED_KEY = "policyhub.saved";

export function loadSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveSaved(ids: string[]) {
  if (typeof window !== "undefined")
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}
