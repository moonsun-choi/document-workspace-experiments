import type { Metadata } from "next";
import Link from "next/link";
import { SelectionBadge } from "@/components/selection-badge";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "문서 작업 공간", template: "%s · 문서 작업 공간" },
  description: "Markdown 문서 탐색·검색·비교·그래프·질문 실험",
};

const NAV = [
  { href: "/", label: "문서" },
  { href: "/graph", label: "그래프" },
  { href: "/compare", label: "비교" },
  { href: "/ask", label: "질문" },
  { href: "/experiments", label: "실험 기록" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-background/90 backdrop-blur dark:border-zinc-800">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-6">
            <Link href="/" className="shrink-0 font-semibold tracking-tight">
              문서 작업 공간
            </Link>
            <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-md px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <SelectionBadge />
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
