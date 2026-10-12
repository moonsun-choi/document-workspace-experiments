import type { RetrievedChunk } from "./retrieval";

/** 질문 화면의 결과를 experiments/ 폴더 형식의 Markdown으로 만든다. */
export function toExperimentMarkdown(input: {
  question: string;
  documents: string[];
  results: RetrievedChunk[];
  date: string;
  method?: string;
}): string {
  const docs = input.documents.map((d) => d.split("/").pop()).join(", ");
  const lines = [
    "---",
    `title: ${JSON.stringify(`질문: ${input.question}`)}`,
    `date: ${input.date}`,
    "status: 기록",
    `method: ${input.method ?? "섹션 단위 청킹 + 키워드 매칭 (AI 없음)"}`,
    `documents: [${docs}]`,
    "tags: [질문]",
    "---",
    "",
    "## 프롬프트 / 설정",
    "",
    `- 질문: ${input.question}`,
    `- 대상 문서: ${input.documents.length}개`,
    "",
    "## 결과",
    "",
    ...(input.results.length === 0
      ? ["- 관련 문단을 찾지 못했다."]
      : input.results.flatMap((r, i) => [
          `${i + 1}. **${r.docTitle}${r.heading ? ` › ${r.heading}` : ""}** (점수 ${r.score}, 일치: ${r.matched.join(", ")})`,
          `   > ${r.text.replace(/\s+/g, " ").slice(0, 200)}`,
        ])),
    "",
    "## 메모",
    "",
    "",
  ];
  return lines.join("\n");
}
