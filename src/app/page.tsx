import { Suspense } from "react";
import { WorkspaceView } from "@/components/workspace-view";
import { getWorkspace } from "@/lib/content";

export default function Home() {
  const { docs, tree, tags } = getWorkspace();
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">문서를 불러오는 중…</p>}>
      <WorkspaceView docs={docs} tree={tree} tags={tags} />
    </Suspense>
  );
}
