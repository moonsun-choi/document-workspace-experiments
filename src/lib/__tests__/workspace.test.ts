import { describe, expect, it } from "vitest";
import { extractWikiLinks, replaceWikiLinks, toPlainText } from "../markdown";
import { buildWorkspace } from "../workspace";

const file = (path: string, front: string, body: string) => ({ path, raw: `---\n${front}\n---\n${body}` });

describe("위키 링크", () => {
  it("코드 안의 [[링크]]는 무시한다", () => {
    const md = "본문 [[a]] 와 `[[b]]`\n\n```\n[[c]]\n```\n끝 [[d|라벨]]";
    expect(extractWikiLinks(md)).toEqual(["a", "d"]);
  });

  it("해석된 링크는 Markdown 링크로, 못 찾은 링크는 표시용으로 바꾼다", () => {
    const out = replaceWikiLinks("[[a]] [[x|엑스]]", (t) => (t === "a" ? "dir/a" : null), (s) => `/docs/${s}`);
    expect(out).toBe("[a](/docs/dir/a) [엑스](#broken-link)");
  });

  it("일반 텍스트 변환은 기호를 걷어 낸다", () => {
    expect(toPlainText("# 제목\n\n- **굵게** [[a|링크]]\n")).toBe("제목\n\n굵게 링크");
  });
});

describe("buildWorkspace", () => {
  const ws = buildWorkspace([
    file("research/alpha.md", "title: 알파\ntags: [ai, 검색]\ndate: 2026-10-01", "[[beta]] 그리고 [[없는문서]]"),
    file("planning/beta.md", "title: 베타\ntags: [ai]", "[[research/alpha]] [[beta]]"),
    file("gamma.md", "tags: 기타", "# 감마 제목\n본문"),
  ]);

  it("파일 이름과 전체 경로 모두로 링크를 해석하고 자기 자신은 뺀다", () => {
    const alpha = ws.docs.find((d) => d.slug === "research/alpha")!;
    const beta = ws.docs.find((d) => d.slug === "planning/beta")!;
    expect(alpha.links).toEqual(["planning/beta"]);
    expect(alpha.brokenLinks).toEqual(["없는문서"]);
    expect(beta.links).toEqual(["research/alpha"]);
  });

  it("백링크, 태그 개수, 폴더 트리를 만든다", () => {
    expect(ws.backlinks["research/alpha"]).toEqual(["planning/beta"]);
    expect(ws.tags[0]).toEqual({ tag: "ai", count: 2 });
    expect(ws.tree.folders.map((f) => f.name)).toEqual(["planning", "research"]);
    expect(ws.tree.docs.map((d) => d.slug)).toEqual(["gamma"]);
  });

  it("title이 없으면 첫 제목, 날짜는 문자열로", () => {
    expect(ws.docs.find((d) => d.slug === "gamma")!.title).toBe("감마 제목");
    expect(ws.docs.find((d) => d.slug === "research/alpha")!.date).toBe("2026-10-01");
  });
});
