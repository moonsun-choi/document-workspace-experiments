import path from "node:path";

/**
 * 문서를 어디서 읽고 쓸지 정한다.
 *
 * - 로컬 작업 폴더(기본 ./workspace, WORKSPACE_DIR로 변경)가 있으면 그 안의 docs/, experiments/를 쓴다.
 *   이 폴더는 .gitignore에 들어 있어 저장소에 올라가지 않는다.
 * - 없으면 저장소에 포함된 가상 샘플(samples/)을 읽기 전용으로 보여 준다.
 */
export interface WorkspacePaths {
  mode: "local" | "sample";
  root: string;
  docsDir: string;
  experimentsDir: string;
  /** 파일 쓰기 가능 여부. 샘플은 저장소에 커밋되는 파일이므로 쓰지 않는다 */
  writable: boolean;
}

export function resolveWorkspacePaths(options: {
  cwd: string;
  /** WORKSPACE_DIR 환경 변수 값 */
  workspaceDir?: string;
  exists: (dir: string) => boolean;
}): WorkspacePaths {
  const { cwd, workspaceDir, exists } = options;
  const localRoot = workspaceDir ? path.resolve(cwd, workspaceDir) : path.join(cwd, "workspace");
  if (exists(localRoot)) {
    return {
      mode: "local",
      root: localRoot,
      docsDir: path.join(localRoot, "docs"),
      experimentsDir: path.join(localRoot, "experiments"),
      writable: true,
    };
  }
  const sampleRoot = path.join(cwd, "samples");
  return {
    mode: "sample",
    root: sampleRoot,
    docsDir: path.join(sampleRoot, "docs"),
    experimentsDir: path.join(sampleRoot, "experiments"),
    writable: false,
  };
}
