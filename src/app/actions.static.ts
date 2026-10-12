import type { SaveResult } from "@/lib/experiment-store";

/**
 * 정적 배포(STATIC_EXPORT=1)용 대체 모듈. 서버가 없으므로 저장하지 않는다.
 * next.config.ts의 resolveAlias가 "@/app/actions"를 이 파일로 바꿔 끼운다.
 */
export async function saveExperiment(markdown: string): Promise<SaveResult & { location?: string }> {
  void markdown;
  return { ok: false, error: "배포된 사이트에서는 저장할 수 없습니다. 로컬에서 npm run dev로 실행하세요." };
}
