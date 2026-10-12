"use client";

import Link from "next/link";
import { useMemo } from "react";
import { compareDocs } from "@/lib/compare";
import type { Doc } from "@/lib/types";
import { DocPicker } from "./doc-picker";
import { Tag } from "./tag";
import { useSelection } from "./use-selection";

export function CompareView({ docs }: { docs: Doc[] }) {
  const { selected, clear } = useSelection();
  const chosen = useMemo(
    () => selected.map((s) => docs.find((d) => d.slug === s)).filter((d): d is Doc => d !== undefined),
    [selected, docs],
  );
  const result = useMemo(() => compareDocs(chosen), [chosen]);
  const titleOf = (slug: string) => docs.find((d) => d.slug === slug)?.title ?? slug;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">비교할 문서 ({chosen.length})</h2>
          {chosen.length > 0 && (
            <button type="button" onClick={clear} className="text-xs text-zinc-500 underline underline-offset-2">
              모두 해제
            </button>
          )}
        </div>
        <DocPicker docs={docs} />
      </aside>

      <section className="min-w-0 space-y-8">
        {chosen.length < 2 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            왼쪽에서 문서를 2개 이상 선택하면 공통점과 핵심 문장을 비교합니다.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <h3 className="mb-1 text-xs font-semibold text-zinc-500">모든 문서의 공통 태그</h3>
                <div className="flex flex-wrap gap-1">
                  {result.sharedTags.length ? result.sharedTags.map((t) => <Tag key={t}>{t}</Tag>) : <span className="text-zinc-400">없음</span>}
                </div>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold text-zinc-500">선택한 문서끼리의 직접 링크</h3>
                {result.links.length ? (
                  <ul className="space-y-0.5">
                    {result.links.map((l) => (
                      <li key={`${l.from}-${l.to}`}>
                        {titleOf(l.from)} → {titleOf(l.to)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-zinc-400">없음</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">문서별 요약 (추출식)</h3>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))` }}>
                {result.digests.map((d) => (
                  <article key={d.slug} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h4 className="font-medium">
                      <Link href={`/docs/${d.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                        {d.title}
                      </Link>
                    </h4>
                    <p className="mt-0.5 text-xs text-zinc-400">{d.charCount.toLocaleString()}자</p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-4 text-zinc-700 dark:text-zinc-300">
                      {d.summary.length ? d.summary.map((s, i) => <li key={i}>{s}</li>) : <li className="text-zinc-400">요약할 문장이 부족합니다.</li>}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {d.keywords.map((k) => (
                        <span key={k.term} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {k.term} {k.count}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                AI 없이 문서 안에서 자주 나온 키워드를 많이 담은 문장을 고릅니다. 3단계에서 LLM 요약을 붙일 때 비교 기준으로 씁니다.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">키워드 분포</h3>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">키워드</th>
                      {result.digests.map((d) => (
                        <th key={d.slug} className="max-w-40 truncate px-3 py-2 text-right font-medium" title={d.title}>
                          {d.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.keywordMatrix.map((row) => (
                      <tr key={row.term} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-3 py-1.5">{row.term}</td>
                        {row.counts.map((c, i) => (
                          <td key={i} className="px-3 py-1.5 text-right tabular-nums">
                            {c > 0 ? (
                              <span
                                className="inline-block min-w-7 rounded px-1.5 text-indigo-900 dark:text-indigo-100"
                                style={{ background: `color-mix(in oklab, var(--color-indigo-500) ${Math.min(15 + c * 12, 70)}%, transparent)` }}
                              >
                                {c}
                              </span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
