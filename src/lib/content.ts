import "server-only";
import fs from "node:fs";
import path from "node:path";
import { asString, asStringList, parseFrontmatter } from "./markdown";
import type { Experiment, Workspace } from "./types";
import { buildWorkspace, type SourceFile } from "./workspace";
import { resolveWorkspacePaths, type WorkspacePaths } from "./workspace-paths";

/** 매 호출마다 확인해서, 개발 중 workspace/를 새로 만들어도 서버를 재시작할 필요가 없게 한다. */
export function getWorkspacePaths(): WorkspacePaths {
  return resolveWorkspacePaths({
    cwd: process.cwd(),
    workspaceDir: process.env.WORKSPACE_DIR
      ? path.resolve(/* turbopackIgnore: true */ process.env.WORKSPACE_DIR)
      : undefined,
    exists: (dir) => fs.existsSync(dir),
    staticExport: process.env.STATIC_EXPORT === "1",
  });
}

// 동기 파일 읽기는 프리렌더 중에 완료되는 "예측 가능한 값"으로 취급된다(Cache Components).
function readMarkdownFiles(root: string): SourceFile[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter((rel) => rel.toLowerCase().endsWith(".md"))
    .map((rel) => ({
      path: rel.split(path.sep).join("/"),
      raw: fs.readFileSync(path.join(root, rel), "utf8"),
    }));
}

export function getWorkspace(): Workspace {
  return buildWorkspace(readMarkdownFiles(getWorkspacePaths().docsDir));
}

export function getExperiments(): Experiment[] {
  return readMarkdownFiles(getWorkspacePaths().experimentsDir)
    .map(({ path: rel, raw }) => {
      const { data, body } = parseFrontmatter(raw);
      const id = rel.replace(/\.md$/i, "");
      return {
        id,
        title: asString(data.title) ?? id,
        date: asString(data.date),
        status: asString(data.status) ?? "기록",
        method: asString(data.method) ?? "",
        documents: asStringList(data.documents),
        tags: asStringList(data.tags),
        body,
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.id.localeCompare(a.id));
}
