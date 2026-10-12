import type { Metadata } from "next";
import { CompareView } from "@/components/compare-view";
import { getWorkspace } from "@/lib/content";

export const metadata: Metadata = { title: "비교" };

export default function ComparePage() {
  const { docs } = getWorkspace();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">여러 문서 비교·요약</h1>
      <CompareView docs={docs} />
    </div>
  );
}
