import { describe, expect, it } from "vitest";
import { compareDocs } from "../compare";
import { buildGraph } from "../graph";
import { chunkDoc, retrieve } from "../retrieval";
import { searchDocs, splitHighlights } from "../search";
import { extractiveSummary, keywordTokens } from "../text";
import { buildWorkspace } from "../workspace";

const { docs } = buildWorkspace([
  {
    path: "research/embed.md",
    raw: "---\ntitle: 임베딩 정리\ntags: [ai, 검색]\n---\n임베딩은 텍스트를 벡터로 바꾼 것이다. 임베딩 검색은 동의어에 강하다. [[korean]]",
  },
  {
    path: "research/korean.md",
    raw: "---\ntitle: 한국어 검색\ntags: [검색]\n---\n## 문제\n조사가 붙으면 검색이 어렵다.\n\n## 결정\n1단계는 부분 문자열 매칭으로 검색하기로 결정했다.",
  },
  { path: "planning/plan.md", raw: "---\ntitle: 계획\ntags: [계획]\n---\n임베딩은 2단계에서 붙인다." },
]);

describe("searchDocs", () => {
  it("조사가 붙은 단어도 찾고, 제목 일치를 우선한다", () => {
    const hits = searchDocs(docs, { query: "임베딩" });
    expect(hits.map((h) => h.doc.slug)).toEqual(["research/embed", "planning/plan"]);
  });

  it("여러 검색어는 모두 포함해야 한다", () => {
    expect(searchDocs(docs, { query: "임베딩 동의어" }).map((h) => h.doc.slug)).toEqual(["research/embed"]);
  });

  it("태그는 모두 가진 문서만, 폴더는 하위 포함", () => {
    expect(searchDocs(docs, { query: "", tags: ["ai", "검색"] }).map((h) => h.doc.slug)).toEqual(["research/embed"]);
    expect(searchDocs(docs, { query: "", folder: "research" })).toHaveLength(2);
  });

  it("강조 조각은 대소문자를 무시한다", () => {
    expect(splitHighlights("RAG와 rag", ["rag"])).toEqual([
      { text: "RAG", match: true },
      { text: "와 ", match: false },
      { text: "rag", match: true },
    ]);
  });
});

describe("텍스트 처리", () => {
  it("조사를 떼고 불용어를 거른다", () => {
    expect(keywordTokens("임베딩은 검색에서 어떻게 쓰나")).toEqual(["임베딩", "검색", "쓰나"]);
  });

  it("질문 어미를 떼어 섹션 제목과 맞춘다", () => {
    expect(keywordTokens("무엇으로 결정했나? 유사도는")).toEqual(["결정", "유사도"]);
  });

  it("추출 요약은 원래 순서를 지킨다", () => {
    const summary = extractiveSummary(
      "임베딩 벡터 검색은 중요하다. 날씨가 좋다. 임베딩 벡터는 검색 품질을 좌우한다. 끝.",
      2,
    );
    expect(summary).toEqual(["임베딩 벡터 검색은 중요하다.", "임베딩 벡터는 검색 품질을 좌우한다."]);
  });
});

describe("retrieve", () => {
  it("제목 단위로 청크를 나눈다", () => {
    const korean = docs.find((d) => d.slug === "research/korean")!;
    expect(chunkDoc(korean).map((c) => c.heading)).toEqual(["문제", "결정"]);
  });

  it("근거 문단의 위키 링크는 파일 이름 대신 문서 제목으로 보여 준다", () => {
    const embed = docs.find((d) => d.slug === "research/embed")!;
    expect(chunkDoc(embed)[0].text).toContain("한국어 검색");
    expect(embed.text).not.toContain("korean");
  });

  it("질문과 가장 관련된 청크를 먼저 준다", () => {
    const [top] = retrieve("1단계 검색 방식은 뭘로 결정했어?", docs);
    expect(top.slug).toBe("research/korean");
    expect(top.heading).toBe("결정");
  });
});

describe("비교와 그래프", () => {
  it("공통 태그와 직접 링크를 찾는다", () => {
    const c = compareDocs(docs.filter((d) => d.folder === "research"));
    expect(c.sharedTags).toEqual(["검색"]);
    expect(c.links).toEqual([{ from: "research/embed", to: "research/korean" }]);
  });

  it("링크 간선과 태그 간선을 중복 없이 만든다", () => {
    const g = buildGraph(docs, { tagEdges: true });
    expect(g.edges).toEqual([
      { source: "research/embed", target: "research/korean", kind: "link" },
    ]);
    expect(g.nodes.find((n) => n.id === "planning/plan")!.degree).toBe(0);
  });
});
