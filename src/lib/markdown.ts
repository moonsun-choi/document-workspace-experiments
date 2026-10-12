import matter from "gray-matter";

const WIKI_LINK = /\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;
const FENCE = /^(```|~~~)/;

/**
 * 코드 블록과 인라인 코드는 건드리지 않고 나머지 텍스트에만 fn을 적용한다.
 * 문서 작성 규칙처럼 `[[이름]]`을 예시로 보여 주는 코드가 링크로 바뀌지 않게 하기 위함.
 */
export function mapOutsideCode(markdown: string, fn: (text: string) => string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inFence = false;
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join("\n");
    // 인라인 코드(`...`)는 홀수 번째 조각이다.
    out.push(
      text
        .split(/(`[^`\n]*`)/)
        .map((part, i) => (i % 2 === 1 ? part : fn(part)))
        .join(""),
    );
    buffer = [];
  };

  for (const line of lines) {
    if (FENCE.test(line.trimStart())) {
      if (!inFence) flush();
      inFence = !inFence;
      out.push(line);
    } else if (inFence) {
      out.push(line);
    } else {
      buffer.push(line);
    }
  }
  flush();
  return out.join("\n");
}

export function extractWikiLinks(markdown: string): string[] {
  const targets: string[] = [];
  mapOutsideCode(markdown, (text) => {
    for (const m of text.matchAll(WIKI_LINK)) targets.push(m[1].trim());
    return text;
  });
  return targets;
}

/** `[[target|label]]`을 일반 Markdown 링크로 바꾼다. 해석 실패 시 표시용 span 링크로 남긴다. */
export function replaceWikiLinks(
  markdown: string,
  resolve: (target: string) => string | null,
  hrefFor: (slug: string) => string,
): string {
  return mapOutsideCode(markdown, (text) =>
    text.replace(WIKI_LINK, (_, target: string, label?: string) => {
      const shown = (label ?? target).trim();
      const slug = resolve(target.trim());
      return slug ? `[${shown}](${hrefFor(slug)})` : `[${shown}](#broken-link)`;
    }),
  );
}

/** 검색과 요약에 쓸 일반 텍스트. 완벽할 필요는 없고 기호만 걷어 낸다. */
export function toPlainText(markdown: string, labelFor: (target: string) => string = (t) => t): string {
  return mapOutsideCode(markdown, (text) =>
    text.replace(WIKI_LINK, (_, target: string, label?: string) => (label ?? labelFor(target.trim())).trim()),
  )
    .replace(/^(```|~~~).*$/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*>[ \t]?/gm, "")
    .replace(/^[ \t]*([-*+]|\d+\.)[ \t]+(\[[ xX]\][ \t]+)?/gm, "")
    .replace(/^[ \t]*\|?[ \t]*:?-{3,}.*$/gm, "")
    .replace(/\|/g, " ")
    .replace(/[*_`~]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface ParsedFile {
  data: Record<string, unknown>;
  body: string;
}

export function parseFrontmatter(raw: string): ParsedFile {
  const { data, content } = matter(raw);
  return { data, body: content.replace(/^\s*\n/, "") };
}

export function asString(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

export function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asString).filter((v): v is string => v !== null);
  const single = asString(value);
  return single ? single.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

/** 본문의 첫 `# 제목`. frontmatter에 title이 없을 때 쓴다. */
export function firstHeading(markdown: string): string | null {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

/** 본문 맨 앞의 `# 제목`은 화면 상단 제목과 겹치므로 뺀다. */
export function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^\s*#[ \t]+.+\n?/, "").replace(/^\s*\n/, "");
}
