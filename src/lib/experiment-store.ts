import fs from "node:fs";
import path from "node:path";
import { asString, parseFrontmatter } from "./markdown";

/**
 * 실험 기록을 디스크에 쓰는 부분. 파일 이름은 사용자 입력에서 직접 받지 않고
 * 날짜 + 제목으로 만들어서 경로 조작(../ 등)이 불가능하게 한다.
 */

export const MAX_EXPERIMENT_BYTES = 100_000;

export type SaveResult = { ok: true; id: string; file: string } | { ok: false; error: string };

/** 한글·영문·숫자만 남기고 나머지는 "-"로. 너무 길면 자른다. */
export function slugifyTitle(title: string, maxLength = 40): string {
  const slug = title
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/, "");
  return slug || "experiment";
}

export function validateExperiment(markdown: string): { title: string; date: string | null } | { error: string } {
  if (Buffer.byteLength(markdown, "utf8") > MAX_EXPERIMENT_BYTES) {
    return { error: `기록이 너무 깁니다 (최대 ${MAX_EXPERIMENT_BYTES / 1000}KB).` };
  }
  if (!/^---\r?\n/.test(markdown)) return { error: "맨 위에 --- 로 시작하는 머리말(frontmatter)이 필요합니다." };
  let data: Record<string, unknown>;
  try {
    data = parseFrontmatter(markdown).data;
  } catch {
    return { error: "머리말(YAML)을 읽을 수 없습니다. 형식을 확인하세요." };
  }
  const title = asString(data.title);
  if (!title) return { error: "머리말에 title이 필요합니다." };
  return { title, date: asString(data.date) };
}

/** 같은 이름이 있으면 -2, -3…을 붙인다. 'wx' 플래그로 기존 파일은 절대 덮어쓰지 않는다. */
export function writeExperimentFile(dir: string, markdown: string, today: string): SaveResult {
  const checked = validateExperiment(markdown);
  if ("error" in checked) return { ok: false, error: checked.error };

  const date = /^\d{4}-\d{2}-\d{2}$/.test(checked.date ?? "") ? checked.date! : today;
  const base = `${date}-${slugifyTitle(checked.title)}`;
  fs.mkdirSync(dir, { recursive: true });

  for (let n = 1; n <= 100; n++) {
    const id = n === 1 ? base : `${base}-${n}`;
    const file = path.join(dir, `${id}.md`);
    try {
      fs.writeFileSync(file, markdown.endsWith("\n") ? markdown : `${markdown}\n`, { encoding: "utf8", flag: "wx" });
      return { ok: true, id, file };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") {
        return { ok: false, error: `파일을 쓰지 못했습니다: ${(e as Error).message}` };
      }
    }
  }
  return { ok: false, error: "같은 이름의 기록이 너무 많습니다. 제목을 바꿔 주세요." };
}
