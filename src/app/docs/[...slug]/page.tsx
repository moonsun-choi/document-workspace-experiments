import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
import { SelectButton } from "@/components/select-button";
import { Tag } from "@/components/tag";
import { getWorkspace } from "@/lib/content";
import { stripLeadingH1 } from "@/lib/markdown";
import { createLinkResolver } from "@/lib/workspace";

export function generateStaticParams() {
  return getWorkspace().docs.map((d) => ({ slug: d.slug.split("/") }));
}

function findDoc(slug: string[]) {
  const ws = getWorkspace();
  const key = slug.map(decodeURIComponent).join("/");
  const doc = ws.docs.find((d) => d.slug === key);
  return doc ? { ws, doc } : null;
}

export async function generateMetadata({ params }: PageProps<"/docs/[...slug]">): Promise<Metadata> {
  const found = findDoc((await params).slug);
  return { title: found?.doc.title ?? "문서 없음" };
}

export default async function DocPage({ params }: PageProps<"/docs/[...slug]">) {
  const found = findDoc((await params).slug);
  if (!found) notFound();
  const { ws, doc } = found;
  const bySlug = new Map(ws.docs.map((d) => [d.slug, d]));
  const backlinks = ws.backlinks[doc.slug] ?? [];
  const resolve = createLinkResolver(ws.docs);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <article className="min-w-0">
        <nav className="mb-3 text-xs text-zinc-500">
          <Link href="/" className="hover:underline">
            문서
          </Link>
          {doc.folder.split("/").filter(Boolean).map((part, i, all) => (
            <span key={i}>
              {" / "}
              <Link href={`/?folder=${encodeURIComponent(all.slice(0, i + 1).join("/"))}`} className="hover:underline">
                {part}
              </Link>
            </span>
          ))}
        </nav>
        <header className="mb-6 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
              {doc.date && <span className="mr-1">{doc.date}</span>}
              {doc.tags.map((t) => (
                <Link key={t} href={`/?tag=${encodeURIComponent(t)}`}>
                  <Tag>{t}</Tag>
                </Link>
              ))}
            </div>
          </div>
          <SelectButton slug={doc.slug} />
        </header>
        <MarkdownView markdown={stripLeadingH1(doc.body)} resolve={resolve} />
      </article>

      <aside className="space-y-6 text-sm lg:sticky lg:top-20 lg:self-start">
        <LinkList
          title="이 문서가 링크하는 문서"
          items={doc.links.map((s) => bySlug.get(s)).filter((d) => d !== undefined)}
          empty="없음"
        />
        <LinkList
          title="이 문서를 참조하는 문서 (백링크)"
          items={backlinks.map((s) => bySlug.get(s)).filter((d) => d !== undefined)}
          empty="아직 이 문서를 링크한 문서가 없습니다."
        />
        {doc.brokenLinks.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold text-rose-600">찾지 못한 링크</h2>
            <ul className="space-y-1 text-zinc-500">
              {doc.brokenLinks.map((l) => (
                <li key={l}>[[{l}]]</li>
              ))}
            </ul>
          </section>
        )}
        <Link href={`/graph?focus=${encodeURIComponent(doc.slug)}`} className="inline-block text-indigo-600 hover:underline dark:text-indigo-400">
          그래프에서 보기 →
        </Link>
      </aside>
    </div>
  );
}

function LinkList({ title, items, empty }: { title: string; items: { slug: string; title: string; folder: string }[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold text-zinc-500">{title}</h2>
      {items.length === 0 ? (
        <p className="text-zinc-400">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((d) => (
            <li key={d.slug}>
              <Link href={`/docs/${d.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                {d.title}
              </Link>
              <span className="ml-1.5 text-xs text-zinc-400">{d.folder}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
