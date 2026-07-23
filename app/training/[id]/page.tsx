import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getRelatedCourses } from "@/lib/training";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TimetableToggle from "@/components/TimetableToggle";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

const won = (n: number) => (n > 0 ? `${n.toLocaleString()}원` : "무료");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getCourse(id);
  if (!c) return { title: "과정을 찾을 수 없습니다 | 꿀청" };
  const desc = `${c.inst} · ${c.field} · 만족도 ${c.score}점 · 수강료 ${won(c.cost)}. 국민내일배움카드로 지원받아 수강할 수 있는 훈련과정입니다.`;
  return {
    title: `${c.title} | 꿀청`,
    description: desc,
    alternates: { canonical: `/training/${c.id}` },
    openGraph: { title: c.title, description: desc, type: "article" },
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

export default async function TrainingDetail({ params }: Props) {
  const { id } = await params;
  const c = await getCourse(id);
  if (!c) notFound();
  const related = await getRelatedCourses(id, 5);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: BASE },
        { "@type": "ListItem", position: 2, name: "내일배움카드 훈련과정", item: `${BASE}/training` },
        { "@type": "ListItem", position: 3, name: c.title },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: c.title,
      description: `${c.field} 분야 훈련과정`,
      provider: { "@type": "Organization", name: c.inst },
      url: `${BASE}/training/${c.id}`,
    },
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <article className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
          <span className="mx-1.5">›</span>
          <Link href="/training" className="hover:text-primary">
            내일배움카드 훈련과정
          </Link>
          <span className="mx-1.5">›</span>
          <span>{c.field}</span>
        </nav>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {c.score > 0 && (
            <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-xs font-semibold text-accent-green">
              만족도 {c.score}점
            </span>
          )}
          <span className="rounded-full border border-hairline bg-surface px-2 py-0.5 text-xs text-ink-secondary">
            {c.field}
          </span>
          {c.region && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted ring-1 ring-hairline">
              {c.region}
            </span>
          )}
          <span className="text-xs font-medium text-ink-muted">
            {c.start} ~ {c.end}
          </span>
        </div>

        <h1 className="mb-4 text-2xl font-bold leading-snug tracking-[-0.02em] text-ink sm:text-3xl">
          {c.title}
        </h1>

        <dl className="mb-6 rounded-[12px] border border-hairline bg-surface px-4 py-1">
          <Row label="훈련기관" value={c.inst} />
          <Row label="주소" value={c.address} />
          <Row label="훈련기간" value={`${c.start} ~ ${c.end}`} />
          <Row label="수강료" value={won(c.cost)} />
          {c.capacity > 0 && (
            <Row label="정원·신청" value={`정원 ${c.capacity}명 · 신청 ${c.enrolled}명`} />
          )}
          <Row label="지원대상" value={c.target} />
          <Row label="문의전화" value={c.tel} />
        </dl>

        <div className="mb-6 rounded-lg bg-surface px-4 py-3 text-sm leading-relaxed text-ink-secondary ring-1 ring-hairline">
          <p className="mb-1 font-semibold text-ink">국민내일배움카드로 수강 가능</p>
          <p>
            표시된 수강료는 <b>전체 금액</b>입니다. 국민내일배움카드로 지원받으면 실제
            부담액은 이보다 적으며, 자부담 비율은 과정 유형과 카드 잔여 한도에 따라
            달라집니다. 정확한 결제 금액과 신청 절차는 고용24 원문에서 확인해 주세요.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary"
          >
            고용24에서 신청하기
          </a>
        </div>

        <TimetableToggle url={c.url} />

        {related.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-ink">같은 분야의 다른 과정</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/training/${r.id}`}
                    className="block rounded-[12px] border border-hairline bg-surface p-3 transition hover:shadow-soft"
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-ink-muted">
                      {r.score > 0 && (
                        <span className="rounded-full border border-hairline px-2 py-0.5">
                          만족도 {r.score}점
                        </span>
                      )}
                      {r.region && <span>{r.region}</span>}
                      <span className="ml-auto">
                        {r.start} ~ {r.end}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-ink">{r.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="rounded-lg bg-surface px-4 py-3 text-xs leading-relaxed text-ink-faint ring-1 ring-hairline">
          이 페이지는 고용24(work24.go.kr)의 공개 데이터를 보기 쉽게 정리한 것입니다.
          수강료·정원·일정 등 최종 내용은 반드시 고용24 원문에서 확인해 주세요.
        </p>

        <div className="mt-8">
          <Link href="/training" className="text-sm text-primary hover:underline">
            ← 다른 훈련과정 보러가기
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}

