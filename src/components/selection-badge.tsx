"use client";

import Link from "next/link";
import { useSelection } from "./use-selection";

export function SelectionBadge() {
  const { selected } = useSelection();
  return (
    <Link
      href="/compare"
      title="선택한 문서는 비교·질문 화면에서 사용합니다"
      className="shrink-0 rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-indigo-300"
    >
      선택 <span className="font-semibold tabular-nums">{selected.length}</span>
    </Link>
  );
}
