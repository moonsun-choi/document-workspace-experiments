import { countOccurrences } from "./search";
import { keywordTokens } from "./text";
import { toPlainText } from "./markdown";
import type { Doc } from "./types";

/**
 * 질문 → 근거 문단 검색. RAG의 "검색" 단계만 먼저 구현한 것.
 * 3단계에서는 여기서 고른 청크를 LLM 프롬프트의 근거로 넘긴다.
 */

export interface Chunk {
  id: string;
  slug: string;
  docTitle: string;
  heading: string | null;
  text: string;
}

export interface RetrievedChunk extends Chunk {
  score: number;
  matched: string[];
}

const MAX_CHUNK_CHARS = 600;

/** `#`/`##`/`###` 제목 단위로 자르고, 긴 섹션은 문단 단위로 다시 자른다. */
export function chunkDoc(doc: Pick<Doc, "slug" | "title" | "body"> & Partial<Pick<Doc, "linkLabels">>): Chunk[] {
  const labels = doc.linkLabels ?? {};
  const sections: { heading: string | null; lines: string[] }[] = [{ heading: null, lines: [] }];
  let inFence = false;
  for (const line of doc.body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^#{1,3}\s+(.+)$/);
    if (h) sections.push({ heading: h[1].trim(), lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const text = toPlainText(section.lines.join("\n"), (t) => labels[t] ?? t);
    if (!text) continue;
    const pieces = text.length <= MAX_CHUNK_CHARS ? [text] : packParagraphs(text.split(/\n\s*\n/));
    for (const piece of pieces) {
      chunks.push({
        id: `${doc.slug}#${chunks.length}`,
        slug: doc.slug,
        docTitle: doc.title,
        heading: section.heading,
        text: piece,
      });
    }
  }
  return chunks;
}

function packParagraphs(paragraphs: string[]): string[] {
  const out: string[] = [];
  let current = "";
  for (const p of paragraphs.map((s) => s.trim()).filter(Boolean)) {
    if (current && current.length + p.length > MAX_CHUNK_CHARS) {
      out.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) out.push(current);
  return out;
}

/** 질문 키워드가 많이, 그리고 다양하게 나온 청크일수록 높은 점수. 섹션 제목 일치는 가중치를 준다. */
export function retrieve(question: string, docs: Doc[], limit = 5): RetrievedChunk[] {
  const terms = [...new Set(keywordTokens(question))];
  if (terms.length === 0) return [];

  return docs
    .flatMap((d) => chunkDoc(d))
    .map<RetrievedChunk>((chunk) => {
      const body = chunk.text.toLowerCase();
      const heading = (chunk.heading ?? "").toLowerCase();
      const matched = terms.filter((t) => body.includes(t) || heading.includes(t));
      const hits = terms.reduce(
        (acc, t) => acc + Math.min(countOccurrences(body, t), 3) + (heading.includes(t) ? 3 : 0),
        0,
      );
      // 서로 다른 키워드를 많이 맞힌 청크를 우선한다.
      const score = matched.length === 0 ? 0 : hits * (matched.length / terms.length);
      return { ...chunk, score: Math.round(score * 100) / 100, matched };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
