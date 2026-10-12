/** 클라이언트로 넘겨도 되는(직렬화 가능한) 문서 정보. */
export interface Doc {
  /** 확장자를 뺀 문서 폴더(docs/) 기준 경로. 예: "research/embeddings" */
  slug: string;
  /** 파일 이름. 위키 링크 `[[name]]`으로 이 이름을 쓴다. */
  name: string;
  /** 상위 폴더 경로. 최상위면 "" */
  folder: string;
  title: string;
  tags: string[];
  date: string | null;
  /** 원본 Markdown 본문 (frontmatter 제외) */
  body: string;
  /** 검색·요약용 일반 텍스트 */
  text: string;
  /** 이 문서가 링크하는 문서들의 slug (중복 없음) */
  links: string[];
  /** 위키 링크 대상 → 표시할 제목. 검색·근거 문단 텍스트에서 파일 이름 대신 제목을 보여 준다 */
  linkLabels: Record<string, string>;
  /** 해석하지 못한 위키 링크 대상 */
  brokenLinks: string[];
}

export interface FolderNode {
  name: string;
  path: string;
  folders: FolderNode[];
  docs: { slug: string; title: string }[];
}

export interface Workspace {
  docs: Doc[];
  tree: FolderNode;
  /** 태그 → 문서 수, 많은 순 */
  tags: { tag: string; count: number }[];
  /** slug → 이 문서를 링크하는 문서 slug 목록 */
  backlinks: Record<string, string[]>;
}

export interface Experiment {
  id: string;
  title: string;
  date: string | null;
  status: string;
  method: string;
  documents: string[];
  tags: string[];
  body: string;
}
