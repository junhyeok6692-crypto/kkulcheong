import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicy, getRelated } from "@/lib/policies";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";
import PolicyActions from "@/components/PolicyActions";

export const revalidate = 3600;

const CAT_DOT: Record<string, string> = {
  창업: "bg-accent-purple",
  금융: "bg-accent-sky",
  기술: "bg-accent-teal",
  경영: "bg-accent-orange",
  인력: "bg-accent-pink",
  수출: "bg-accent-green",
  내수: "bg-accent-brown",
  기타: "bg-ink-faint",
  일자리: "bg-accent-teal",
  주거: "bg-accent-orange",
  "교육･직업훈련": "bg-accent-purple",
  "금융･복지･문화": "bg-accent-pink",
  "참여･기반": "bg-accent-green",
};

function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate + "T23:59:59");
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPolicy(id);
  if (!p) return { title: "공고를 찾을 수 없습니다 | 꿀청" };
  const desc = `${p.org}${p.target ? ` · 지원대상 ${p.target}` : ""}${
    p.period ? ` · 신청기간 ${p.period}` : ""
  }. ${p.summary}`.slice(0, 155);
  return {
    title: `${p.title} | 꿀청`,
    description: desc,
    alternates: { canonical: `/policy/${p.id}` },
    openGraph: { title: p.title, description: desc, type: "article" },
  };
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 border-b border-hairline py-2.5 last:border-0">
      <dt className="w-24 shrink-0 text-sm text-ink-faint">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

const BASE = SITE_URL;

export default async function PolicyDetail({ params }: Props) {
  const { id } = await params;
  const p = await getPolicy(id);
  if (!p) notFound();
  const related = await getRelated(id, 5);

  const d = daysLeft(p.endDate);
  const urgent = d !== null && d >= 0 && d <= 5;
  const dot = CAT_DOT[p.category] ?? "bg-ink-faint";

  // 구조화 데이터 (검색결과에 경로 노출 + 서비스 정보 전달)
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: BASE },
        { "@type": "ListItem", position: 2, name: p.title },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "GovernmentService",
      name: p.title,
      description: p.summary,
      serviceType: p.category,
      provider: { "@type": "GovernmentOrganization", name: p.org },
      audience: { "@type": "Audience", audienceType: p.target },
      areaServed: p.regions.length ? p.regions.join(", ") : "대한민국",
      url: `${BASE}/policy/${p.id}`,
    },
  ];

  return (
    <main>
      {/* </script> 로 빠져나가는 것을 막기 위해 < 를 이스케이프 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-4 py-8">
        {/* breadcrumb */}
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
          <span className="mx-1.5">›</span>
          <span>{p.category}</span>
        </nav>

        {/* 태그 + 마감 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2 py-0.5 text-xs text-ink-secondary">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {p.category}
          </span>
          {p.regions.map((r) => (
            <span
              key={r}
              className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted ring-1 ring-hairline"
            >
              {r}
            </span>
          ))}
          {d === null ? (
            <span className="text-xs text-ink-faint">상시·미정</span>
          ) : d < 0 ? (
            <span className="text-xs text-ink-faint">마감됨</span>
          ) : urgent ? (
            <span className="rounded-full bg-accent-orange px-2 py-0.5 text-xs font-semibold text-white">
              마감임박 D-{d}
            </span>
          ) : (
            <span className="text-xs font-medium text-ink-muted">D-{d}</span>
          )}
        </div>

        <h1 className="mb-4 text-2xl font-bold leading-snug tracking-[-0.02em] text-ink sm:text-3xl">
          {p.title}
        </h1>

        {/* 핵심 정보 */}
        <dl className="mb-6 rounded-[12px] border border-hairline bg-surface px-4 py-1">
          <Row label="소관기관" value={p.org} />
          <Row label="수행기관" value={p.execOrg} />
          <Row label="지원대상" value={p.target} />
          <Row label="신청기간" value={p.period} />
          <Row label="지원분야" value={p.category} />
          {/* 소스별 추가 정보 (청년정책: 연령·지원규모·자격요건 등) */}
          {p.extra?.map((e) => (
            <Row key={e.label} label={e.label} value={e.value} />
          ))}
        </dl>

        {/* 찜 + 캘린더 */}
        <PolicyActions
          id={p.id}
          title={p.title}
          endDate={p.endDate}
          org={p.org}
          url={p.url}
        />

        {/* 사업개요 */}
        {p.summaryFull && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold text-ink">사업 개요</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-secondary">
              {p.summaryFull}
            </p>
          </section>
        )}

        {/* 신청방법 */}
        {p.applyMethod && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold text-ink">신청 방법</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-secondary">
              {p.applyMethod}
            </p>
          </section>
        )}

        {/* 문의처 */}
        {p.contact && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold text-ink">문의처</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-secondary">
              {p.contact}
            </p>
          </section>
        )}

        {/* 첨부파일 */}
        {p.fileUrl && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-bold text-ink">첨부파일</h2>
            <a
              href={p.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary hover:border-primary/40"
            >
              {p.fileName || "첨부파일 내려받기"}
            </a>
          </section>
        )}

        {/* CTA */}
        <div className="mb-6 flex flex-wrap gap-2">
          {p.applyUrl && (
            <a
              href={p.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary"
            >
              접수 홈페이지로 이동
            </a>
          )}
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-hairline bg-surface px-5 py-2.5 text-sm font-medium text-ink-muted hover:border-primary/40"
          >
            {p.source} 원문 공고 보기
          </a>
        </div>

        {/* 이런 공고는 어때요 */}
        {related.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-ink">이런 지원사업도 있어요</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/policy/${r.id}`}
                    className="block rounded-[12px] border border-hairline bg-surface p-3 transition hover:shadow-soft"
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-ink-muted">
                      <span className="rounded-full border border-hairline px-2 py-0.5">
                        {r.category}
                      </span>
                      {r.regions.slice(0, 1).map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                      {r.period && <span className="ml-auto">{r.period}</span>}
                    </div>
                    <p className="text-sm font-medium leading-snug text-ink">
                      {r.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="rounded-lg bg-surface px-4 py-3 text-xs leading-relaxed text-ink-faint ring-1 ring-hairline">
          이 페이지는 {p.source}의 공개 데이터를 보기 쉽게 정리한 것입니다. 신청
          자격·제출서류 등 최종 내용은 반드시 원문 공고와 소관기관 안내를 확인해
          주세요.
        </p>

        <div className="mt-8">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← 다른 지원사업 보러가기
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
