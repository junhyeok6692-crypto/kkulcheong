import type { MetadataRoute } from "next";
import { getAllPolicies } from "@/lib/policies";
import { GUIDES } from "@/lib/guides";

export const revalidate = 3600;

// 배포 시 NEXT_PUBLIC_SITE_URL 에 실제 도메인을 넣으세요 (예: https://kkulcheong.com)
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function toDate(s: string): Date {
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/guide`, changeFrequency: "monthly", priority: 0.7 },
    ...GUIDES.map((g) => ({
      url: `${BASE}/guide/${g.slug}`,
      lastModified: toDate(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const all = await getAllPolicies();
    const policyPages: MetadataRoute.Sitemap = all.map((p) => ({
      url: `${BASE}/policy/${p.id}`,
      lastModified: toDate(p.createdAt),
      changeFrequency: "daily",
      priority: 0.8,
    }));
    return [...staticPages, ...policyPages];
  } catch {
    return staticPages; // API 실패 시에도 사이트맵은 유지
  }
}
