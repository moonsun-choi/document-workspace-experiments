import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
import { StatusBadge } from "@/components/status-badge";
import { Tag } from "@/components/tag";
import { getExperiments, getWorkspace } from "@/lib/content";
import { createLinkResolver } from "@/lib/workspace";

export function generateStaticParams() {
  return getExperiments().map((e) => ({ id: e.id }));
}

const find = (id: string) => getExperiments().find((e) => e.id === decodeURIComponent(id));

export async function generateMetadata({ params }: PageProps<"/experiments/[id]">): Promise<Metadata> {
  return { title: find((await params).id)?.title ?? "실험 없음" };
}

export default async function ExperimentPage({ params }: PageProps<"/experiments/[id]">) {
  const experiment = find((await params).id);
  if (!experiment) notFound();
  const { docs } = getWorkspace();
  const resolve = createLinkResolver(docs);
  const bySlug = new Map(docs.map((d) => [d.slug, d]));

  return (
    <article className="mx-auto w-full max-w-3xl">
      <Link href="/experiments" className="text-xs text-zinc-500 hover:underline">
        ← 실험 기록
      </Link>
      <header className="mt-3 mb-6 space-y-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{experiment.title}</h1>
          <StatusBadge status={experiment.status} />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-500">날짜</dt>
          <dd>{experiment.date ?? "-"}</dd>
          <dt className="text-zinc-500">방법</dt>
          <dd>{experiment.method || "-"}</dd>
          <dt className="text-zinc-500">대상 문서</dt>
          <dd className="flex flex-wrap gap-x-3">
            {experiment.documents.length === 0 && "-"}
            {experiment.documents.map((name) => {
              const slug = resolve(name);
              return slug ? (
                <Link key={name} href={`/docs/${slug}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                  {bySlug.get(slug)?.title ?? name}
                </Link>
              ) : (
                <span key={name} className="text-zinc-400">
                  {name}
                </span>
              );
            })}
          </dd>
        </dl>
        {experiment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {experiment.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </header>
      <MarkdownView markdown={experiment.body} resolve={resolve} />
    </article>
  );
}
