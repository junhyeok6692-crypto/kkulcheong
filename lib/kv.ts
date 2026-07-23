// Upstash Redis REST API를 fetch로 직접 호출하는 아주 작은 래퍼.
// (별도 npm 패키지 설치 없이, Vercel의 Storage 연동이 자동으로 넣어주는
// KV_REST_API_URL / KV_REST_API_TOKEN 환경변수만으로 동작한다.)
//
// 여러 서버리스 인스턴스가 각자 다른 메모리(let cache)를 가지는 문제를 해결하기
// 위해, 모든 인스턴스가 공통으로 보는 저장소로 사용한다.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function command(cmd: (string | number)[]): Promise<unknown> {
  if (!KV_URL || !KV_TOKEN) return null; // Redis 미설정 시 조용히 비활성화
  try {
    const res = await fetch(KV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown };
    return data.result ?? null;
  } catch {
    return null; // Redis 장애는 캐시 미스로만 취급하고, 호출자는 원본 fetch로 폴백한다
  }
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const raw = await command(["GET", key]);
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** ttlSeconds 이후 자동 만료되는 값으로 저장 */
export async function kvSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  await command(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
}
