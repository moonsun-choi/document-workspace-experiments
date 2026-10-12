import type { Metadata } from "next";
import Link from "next/link";
import { SelectionBadge } from "@/components/selection-badge";
import { getWorkspacePaths } from "@/lib/content";
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
  const { mode } = getWorkspacePaths();
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
        {mode === "sample" && (
          <div className="border-b border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="mx-auto max-w-7xl px-4 py-2 text-xs">
              저장소에 포함된 <b>가상 샘플 문서</b>를 보여 주는 중입니다(읽기 전용). 내 문서를 쓰려면{" "}
              <code className="font-mono">npm run workspace:init</code>으로 로컬 작업 폴더를 만드세요. 그 폴더는 저장소에 올라가지 않습니다.
            </p>
          </div>
        )}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
