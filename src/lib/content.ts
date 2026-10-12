import "server-only";
import fs from "node:fs";
import path from "node:path";
import { asString, asStringList, parseFrontmatter } from "./markdown";
import type { Experiment, Workspace } from "./types";
import { buildWorkspace, type SourceFile } from "./workspace";

/**
 * 문서 루트. 기본은 공개 샘플(content/).
 * 로컬에서 실제 문서로 돌려 보려면 CONTENT_DIR 환경 변수로 다른 폴더를 가리킨다.
 */
const CONTENT_DIR = process.env.CONTENT_DIR
  ? path.resolve(/* turbopackIgnore: true */ process.env.CONTENT_DIR)
  : path.join(process.cwd(), "content");
const EXPERIMENTS_DIR = process.env.EXPERIMENTS_DIR
  ? path.resolve(/* turbopackIgnore: true */ process.env.EXPERIMENTS_DIR)
  : path.join(process.cwd(), "experiments");

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
  return buildWorkspace(readMarkdownFiles(CONTENT_DIR));
}

export function getExperiments(): Experiment[] {
  return readMarkdownFiles(EXPERIMENTS_DIR)
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
