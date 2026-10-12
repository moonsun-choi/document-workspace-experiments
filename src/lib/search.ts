import type { Doc } from "./types";

/**
 * 1단계 검색: 부분 문자열 매칭 + 제목/태그 가중치.
 * 한국어는 조사가 붙어도("임베딩은") 부분 문자열로 찾을 수 있다.
 * 2단계에서 임베딩 점수를 섞을 때 이 점수를 키워드 점수로 그대로 쓴다.
 */

export interface SearchOptions {
  query: string;
  /** 고른 태그를 모두 가진 문서만 */
  tags?: string[];
  /** 이 폴더(하위 포함)의 문서만. ""이면 전체 */
  folder?: string;
}

export interface SearchHit {
  doc: Doc;
  score: number;
  /** 본문에서 검색어 주변을 잘라 낸 미리보기. 검색어가 없으면 문서 앞부분 */
  snippet: string;
}

const WEIGHT = { title: 10, tag: 6, body: 1 } as const;
const MAX_BODY_HITS = 5;

export function tokenizeQuery(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length > 0),
    ),
  ];
}

export function countOccurrences(haystack: string, needle: string, limit = Infinity): number {
  if (!needle) return 0;
  let count = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1 && count < limit) {
    count++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return count;
}

/** 모든 검색어가 어딘가(제목·태그·본문)에 있어야 점수를 준다. 하나라도 없으면 0. */
export function scoreText(
  terms: string[],
  fields: { title: string; tags: string[]; body: string },
): number {
  const title = fields.title.toLowerCase();
  const tags = fields.tags.map((t) => t.toLowerCase());
  const body = fields.body.toLowerCase();
  let total = 0;
  for (const term of terms) {
    let s = 0;
    if (title.includes(term)) s += WEIGHT.title;
    if (tags.some((t) => t.includes(term))) s += WEIGHT.tag;
    s += WEIGHT.body * countOccurrences(body, term, MAX_BODY_HITS);
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

export function makeSnippet(text: string, terms: string[], radius = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const lower = flat.toLowerCase();
  const positions = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0);
  if (positions.length === 0) return flat.length > radius * 2 ? `${flat.slice(0, radius * 2)}…` : flat;
  const at = Math.min(...positions);
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + radius);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

export function inFolder(doc: Doc, folder: string | undefined): boolean {
  if (!folder) return true;
  return doc.folder === folder || doc.folder.startsWith(`${folder}/`);
}

export function searchDocs(docs: Doc[], options: SearchOptions): SearchHit[] {
  const terms = tokenizeQuery(options.query);
  const wanted = options.tags ?? [];
  const hits: SearchHit[] = [];

  for (const doc of docs) {
    if (!inFolder(doc, options.folder)) continue;
    if (!wanted.every((t) => doc.tags.includes(t))) continue;
    const score = terms.length === 0 ? 0 : scoreText(terms, { title: doc.title, tags: doc.tags, body: doc.text });
    if (terms.length > 0 && score === 0) continue;
    hits.push({ doc, score, snippet: makeSnippet(doc.text, terms) });
  }

  // 검색어가 없으면 최신 문서 순, 있으면 점수 순
  return hits.sort((a, b) =>
    terms.length === 0
      ? (b.doc.date ?? "").localeCompare(a.doc.date ?? "") || a.doc.title.localeCompare(b.doc.title)
      : b.score - a.score || a.doc.title.localeCompare(b.doc.title),
  );
}

/** 화면에서 검색어를 강조하기 위해 텍스트를 [일반, 일치, 일반, ...] 조각으로 나눈다. */
export function splitHighlights(text: string, terms: string[]): { text: string; match: boolean }[] {
  const usable = terms.filter(Boolean);
  if (usable.length === 0) return [{ text, match: false }];
  const escaped = usable
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return text
    .split(new RegExp(`(${escaped.join("|")})`, "gi"))
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, match: usable.includes(part.toLowerCase()) }));
}
