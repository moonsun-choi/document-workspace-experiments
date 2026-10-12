import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Tag } from "@/components/tag";
import { getExperiments } from "@/lib/content";

export const metadata: Metadata = { title: "실험 기록" };

export default function ExperimentsPage() {
  const experiments = getExperiments();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">실험 기록</h1>
        <p className="mt-1 text-sm text-zinc-500">
          작업 폴더의 <code>experiments/</code>에 있는 Markdown 파일입니다. 질문 화면에서 바로 저장할 수 있습니다.
        </p>
      </div>
      {experiments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">아직 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {experiments.map((e) => (
            <li key={e.id}>
              <Link
                href={`/experiments/${e.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium">{e.title}</h2>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {e.date ?? "날짜 없음"}
                  {e.method && ` · ${e.method}`}
                </p>
                {e.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
