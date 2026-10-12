"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { getWorkspacePaths } from "@/lib/content";
import { writeExperimentFile, type SaveResult } from "@/lib/experiment-store";

/**
 * 서버 액션은 화면 밖에서도 POST로 호출할 수 있다. 로그인 기능이 없으므로
 * 기본적으로 개발 서버(npm run dev)에서만 파일 쓰기를 허용한다.
 * 운영 서버에서 쓰려면 ENABLE_FILE_WRITE=1 을 설정한다(외부에 공개된 서버라면 권장하지 않음).
 */
function writeAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_FILE_WRITE === "1";
}

export async function saveExperiment(markdown: string): Promise<SaveResult & { location?: string }> {
  if (!writeAllowed()) {
    return {
      ok: false,
      error: "이 서버에서는 파일 쓰기가 꺼져 있습니다. npm run dev로 실행하거나 ENABLE_FILE_WRITE=1을 설정하세요.",
    };
  }
  const paths = getWorkspacePaths();
  if (!paths.writable) {
    return {
      ok: false,
      error: "지금은 저장소의 샘플을 보는 중이라 저장하지 않습니다. npm run workspace:init 으로 로컬 작업 폴더를 만든 뒤 다시 시도하세요.",
    };
  }
  if (typeof markdown !== "string") return { ok: false, error: "잘못된 요청입니다." };

  const result = writeExperimentFile(paths.experimentsDir, markdown, new Date().toISOString().slice(0, 10));
  if (!result.ok) return result;

  // 실험 기록 목록은 빌드 때 정적으로 만들어지므로 새 파일이 보이도록 무효화한다.
  revalidatePath("/experiments");
  return {
    ...result,
    file: path.basename(result.file),
    location: path.relative(process.cwd(), paths.experimentsDir) || paths.experimentsDir,
  };
}
