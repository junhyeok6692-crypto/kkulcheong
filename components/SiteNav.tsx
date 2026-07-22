"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "지원사업" },
  { href: "/training", label: "내일배움카드" },
  { href: "/guide", label: "가이드" },
];

/** 모든 페이지 상단에 노출되는 주 내비게이션 */
export default function SiteNav() {
  const path = usePathname() || "/";
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="주 메뉴">
      {ITEMS.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={active(it.href) ? "page" : undefined}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            active(it.href)
              ? "bg-[#4a330a] text-[#fff7da]"
              : "text-[#6b4d14] hover:bg-white/70"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

