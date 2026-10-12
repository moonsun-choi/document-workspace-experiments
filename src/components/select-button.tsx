"use client";

import { useSelection } from "./use-selection";

export function SelectButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { has, toggle } = useSelection();
  const on = has(slug);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
        on
          ? "border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600"
          : "border-zinc-300 text-zinc-600 hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-indigo-300"
      } ${className}`}
    >
      {on ? "선택됨" : "선택"}
    </button>
  );
}
