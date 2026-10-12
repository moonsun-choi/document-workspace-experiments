"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { inFolder, searchDocs, tokenizeQuery } from "@/lib/search";
import type { Doc, FolderNode } from "@/lib/types";
import { FolderTree } from "./folder-tree";
import { Highlight } from "./highlight";
import { SelectButton } from "./select-button";
import { Tag } from "./tag";

interface Props {
  docs: Doc[];
  tree: FolderNode;
  tags: { tag: string; count: number }[];
}

/** 검색 상태는 URL(?q=&tag=&folder=)에도 남겨 새로고침·공유 시 유지되게 한다. */
function writeUrl(q: string, tags: string[], folder: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  tags.forEach((t) => params.append("tag", t));
  if (folder) params.set("folder", folder);
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

export function WorkspaceView({ docs, tree, tags }: Props) {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [activeTags, setActiveTags] = useState<string[]>(() => params.getAll("tag"));
  const [folder, setFolder] = useState(() => params.get("folder") ?? "");

  const update = (next: { q?: string; tags?: string[]; folder?: string }) => {
    const q = next.q ?? query;
    const t = next.tags ?? activeTags;
    const f = next.folder ?? folder;
    setQuery(q);
    setActiveTags(t);
    setFolder(f);
    writeUrl(q, t, f);
  };

  const hits = useMemo(() => searchDocs(docs, { query, tags: activeTags, folder }), [docs, query, activeTags, folder]);
  const terms = tokenizeQuery(query);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { "": docs.length };
    const walk = (node: FolderNode) => {
      counts[node.path] = docs.filter((d) => inFolder(d, node.path)).length;
      node.folders.forEach(walk);
    };
    tree.folders.forEach(walk);
    return counts;
  }, [docs, tree]);

  const toggleTag = (tag: string) =>
    update({ tags: activeTags.includes(tag) ? activeTags.filter((t) => t !== tag) : [...activeTags, tag] });

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">폴더</h2>
        <FolderTree tree={tree} counts={folderCounts} active={folder} onSelect={(f) => update({ folder: f })} />
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="제목, 태그, 본문 검색 (여러 단어는 모두 포함)"
            aria-label="문서 검색"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map(({ tag, count }) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={activeTags.includes(tag)}>
              <Tag active={activeTags.includes(tag)}>
                {tag} <span className="ml-1 opacity-60">{count}</span>
              </Tag>
            </button>
          ))}
          {(activeTags.length > 0 || query || folder) && (
            <button
              type="button"
              onClick={() => update({ q: "", tags: [], folder: "" })}
              className="ml-1 text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              조건 초기화
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500">
          {hits.length}개 문서{terms.length > 0 ? " · 관련도 순" : " · 최신 순"}
        </p>

        <ul className="space-y-2">
          {hits.map(({ doc, snippet }) => (
            <li key={doc.slug}>
              {/* 카드 전체가 링크처럼 동작하되, 선택 버튼은 링크 밖에 둔다(a 안에 button 금지). */}
              <article className="relative rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium">
                      <Link href={`/docs/${doc.slug}`} className="after:absolute after:inset-0">
                        <Highlight text={doc.title} terms={terms} />
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {doc.folder || "(최상위)"}
                      {doc.date && ` · ${doc.date}`}
                    </p>
                  </div>
                  <SelectButton slug={doc.slug} className="relative z-10" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Highlight text={snippet} terms={terms} />
                </p>
                {doc.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.tags.map((t) => (
                      <Tag key={t} active={activeTags.includes(t)}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>

        {hits.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            조건에 맞는 문서가 없습니다.
          </p>
        )}
      </section>
    </div>
  );
}
