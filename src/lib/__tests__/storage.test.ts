import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { slugifyTitle, writeExperimentFile } from "../experiment-store";
import { resolveWorkspacePaths } from "../workspace-paths";

describe("resolveWorkspacePaths", () => {
  it("작업 폴더가 있으면 그곳을 쓰기 가능하게 쓴다", () => {
    const p = resolveWorkspacePaths({ cwd: "/app", exists: () => true });
    expect(p).toMatchObject({ mode: "local", docsDir: "/app/workspace/docs", writable: true });
  });

  it("WORKSPACE_DIR은 cwd 기준 상대 경로도 받는다", () => {
    const p = resolveWorkspacePaths({ cwd: "/app", workspaceDir: "../notes", exists: () => true });
    expect(p.experimentsDir).toBe("/notes/experiments");
  });

  it("작업 폴더가 없으면 샘플을 읽기 전용으로", () => {
    const p = resolveWorkspacePaths({ cwd: "/app", exists: () => false });
    expect(p).toMatchObject({ mode: "sample", docsDir: "/app/samples/docs", writable: false });
  });
});

describe("writeExperimentFile", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "dwx-"));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  const md = (title: string, extra = "") => `---\ntitle: ${JSON.stringify(title)}\n${extra}---\n\n본문`;

  it("날짜 + 제목으로 파일을 만들고, 같은 이름은 덮어쓰지 않는다", () => {
    const a = writeExperimentFile(dir, md("질문: 검색 방식?"), "2026-10-12");
    const b = writeExperimentFile(dir, md("질문: 검색 방식?"), "2026-10-12");
    expect(a).toMatchObject({ ok: true, id: "2026-10-12-질문-검색-방식" });
    expect(b).toMatchObject({ ok: true, id: "2026-10-12-질문-검색-방식-2" });
    expect(fs.readdirSync(dir).sort()).toEqual(["2026-10-12-질문-검색-방식-2.md", "2026-10-12-질문-검색-방식.md"]);
  });

  it("머리말의 date를 우선하고, 제목의 경로 문자는 파일 이름에 남지 않는다", () => {
    const r = writeExperimentFile(dir, md("../../etc/passwd", "date: 2026-01-02\n"), "2026-10-12");
    expect(r).toMatchObject({ ok: true, id: "2026-01-02-etc-passwd" });
    expect(fs.readdirSync(dir)).toEqual(["2026-01-02-etc-passwd.md"]);
  });

  it("머리말이나 title이 없으면 거부한다", () => {
    expect(writeExperimentFile(dir, "그냥 글", "2026-10-12")).toMatchObject({ ok: false });
    expect(writeExperimentFile(dir, "---\ndate: 2026-10-12\n---\n본문", "2026-10-12")).toMatchObject({ ok: false });
    expect(fs.readdirSync(dir)).toEqual([]);
  });

  it("제목에 쓸 글자가 없으면 기본 이름", () => {
    expect(slugifyTitle("???")).toBe("experiment");
  });
});
