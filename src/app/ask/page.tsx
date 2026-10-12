import type { Metadata } from "next";
import { AskView } from "@/components/ask-view";
import { getWorkspace, getWorkspacePaths } from "@/lib/content";

export const metadata: Metadata = { title: "질문" };

export default function AskPage() {
  const { docs } = getWorkspace();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">선택한 문서에 질문하기</h1>
      <AskView docs={docs} canSave={getWorkspacePaths().writable} />
    </div>
  );
}
