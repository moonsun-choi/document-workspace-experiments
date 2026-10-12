"use client";

import { useState } from "react";
import { searchDocs } from "@/lib/search";
import type { Doc } from "@/lib/types";
import { SelectButton } from "./select-button";

/** 선택 바구니에 문서를 넣고 빼는 작은 목록. 비교·질문 화면에서 같이 쓴다. */
export function DocPicker({ docs }: { docs: Doc[] }) {
  const [query, setQuery] = useState("");
  const hits = searchDocs(docs, { query });
  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="문서 찾기"
        aria-label="선택할 문서 찾기"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {hits.map(({ doc }) => (
          <li key={doc.slug} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              {doc.title}
              <span className="ml-1.5 text-xs text-zinc-400">{doc.folder}</span>
            </span>
            <SelectButton slug={doc.slug} />
          </li>
        ))}
      </ul>
    </div>
  );
}
