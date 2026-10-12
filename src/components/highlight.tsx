import { splitHighlights } from "@/lib/search";

export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {splitHighlights(text, terms).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-sm bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-500/30">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
