import type { Metadata } from "next";
import { Suspense } from "react";
import { GraphView } from "@/components/graph-view";
import { getWorkspace } from "@/lib/content";
import { buildGraph, layoutGraph } from "@/lib/graph";

export const metadata: Metadata = { title: "그래프" };

export default function GraphPage() {
  const { docs, tags } = getWorkspace();
  const linkOnly = layoutGraph(buildGraph(docs));
  const withTags = layoutGraph(buildGraph(docs, { tagEdges: true }));
  const folders = [...new Set(docs.map((d) => d.folder))].sort();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">문서 연결 그래프</h1>
        <p className="mt-1 text-sm text-zinc-500">
          <code>[[문서]]</code> 위키 링크로 연결된 문서 {docs.length}개, 링크 {linkOnly.edges.length}개
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">그래프를 그리는 중…</p>}>
        <GraphView linkOnly={linkOnly} withTags={withTags} folders={folders} tags={tags.map((t) => t.tag)} />
      </Suspense>
    </div>
  );
}
