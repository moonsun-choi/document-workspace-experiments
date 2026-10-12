import { extractiveSummary, topKeywords } from "./text";
import type { Doc } from "./types";

export interface DocDigest {
  slug: string;
  title: string;
  keywords: { term: string; count: number }[];
  summary: string[];
  charCount: number;
}

export interface Comparison {
  digests: DocDigest[];
  /** 모든 문서에 공통인 태그 */
  sharedTags: string[];
  /** 키워드 × 문서 표. 두 문서 이상에 나온 키워드가 위로 온다 */
  keywordMatrix: { term: string; counts: number[] }[];
  /** 선택한 문서끼리 직접 링크한 관계 */
  links: { from: string; to: string }[];
}

export function compareDocs(docs: Doc[], keywordsPerDoc = 8): Comparison {
  const digests = docs.map<DocDigest>((d) => ({
    slug: d.slug,
    title: d.title,
    keywords: topKeywords(d.text, keywordsPerDoc),
    summary: extractiveSummary(d.text, 3),
    charCount: d.text.length,
  }));

  const sharedTags = docs.length === 0 ? [] : docs[0].tags.filter((t) => docs.every((d) => d.tags.includes(t)));

  const terms = [...new Set(digests.flatMap((d) => d.keywords.map((k) => k.term)))];
  const keywordMatrix = terms
    .map((term) => ({
      term,
      counts: docs.map((d) => countTerm(d.text, term)),
    }))
    .sort((a, b) => present(b.counts) - present(a.counts) || sum(b.counts) - sum(a.counts));

  const selected = new Set(docs.map((d) => d.slug));
  const links = docs.flatMap((d) => d.links.filter((to) => selected.has(to)).map((to) => ({ from: d.slug, to })));

  return { digests, sharedTags, keywordMatrix, links };
}

function countTerm(text: string, term: string): number {
  return text.toLowerCase().split(term).length - 1;
}
const present = (counts: number[]) => counts.filter((c) => c > 0).length;
const sum = (counts: number[]) => counts.reduce((a, b) => a + b, 0);
