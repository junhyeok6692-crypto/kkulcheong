import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide, type Block } from "@/lib/guides";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return { title: "가이드를 찾을 수 없습니다 | 꿀청" };
  return {
    title: `${g.title} | 꿀청`,
    description: g.description,
    alternates: { canonical: `/guide/${g.slug}` },
    openGraph: { title: g.title, description: g.description, type: "article" },
  };
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === "h2")
          return (
            <h2 key={i} className="mt-8 mb-3 text-lg font-bold text-ink">
              {b.v}
            </h2>
          );
        if (b.t === "p")
          return (
            <p key={i} className="mb-4 text-[15px] leading-[1.8] text-ink-secondary">
              {b.v}
            </p>
          );
        if (b.t === "tip")
          return (
            <p
              key={i}
              className="mb-4 rounded-lg border-l-[3px] border-accent-orange bg-surface px-4 py-3 text-sm leading-relaxed text-ink-secondary ring-1 ring-hairline"
            >
              💡 {b.v}
            </p>
          );
        if (b.t === "ul")
          return (
            <ul key={i} className="mb-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.8] text-ink-secondary">
              {b.v.map((x, j) => (
                <li key={j}>{x}</li>
              ))}
            </ul>
          );
        return (
          <ol key={i} className="mb-4 list-decimal space-y-2 pl-5 text-[15px] leading-[1.8] text-ink-secondary">
            {b.v.map((x, j) => (
              <li key={j}>{x}</li>
            ))}
          </ol>
        );
      })}
    </>
  );
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function GuideArticle({ params }: Props) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    dateModified: g.updated,
    author: { "@type": "Organization", name: "꿀청" },
    publisher: { "@type": "Organization", name: "꿀청" },
    mainEntityOfPage: `${BASE}/guide/${g.slug}`,
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
          <span className="mx-1.5">›</span>
          <Link href="/guide" className="hover:text-primary">
            가이드
          </Link>
        </nav>

        <h1 className="mb-2 text-2xl font-bold leading-snug tracking-[-0.02em] text-ink sm:text-3xl">
          {g.title}
        </h1>
        <p className="mb-8 text-xs text-ink-faint">
          약 {g.readMin}분 · {g.updated} 업데이트
        </p>

        <Blocks blocks={g.blocks} />

        <div className="mt-10 rounded-[12px] border border-hairline bg-surface p-5 text-center">
          <p className="mb-3 text-sm text-ink-muted">
            지금 모집 중인 지원사업을 확인해 보세요
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-on-primary"
          >
            지원사업 보러가기
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/guide" className="text-sm text-primary hover:underline">
            ← 다른 가이드 보기
          </Link>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
