// 로컬 작업 폴더(workspace/)를 만든다. 이 폴더는 .gitignore에 들어 있어 커밋되지 않는다.
//   npm run workspace:init                 빈 작업 폴더 + 시작 안내 문서
//   npm run workspace:init -- --samples    샘플 문서까지 복사
// WORKSPACE_DIR 환경 변수로 다른 위치(예: 클라우드 드라이브 동기화 폴더)를 지정할 수 있다.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.env.WORKSPACE_DIR ?? "workspace");
const withSamples = process.argv.includes("--samples");

if (fs.existsSync(root)) {
  console.log(`이미 있습니다: ${root}`);
  process.exit(0);
}

fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.mkdirSync(path.join(root, "experiments"), { recursive: true });

if (withSamples) {
  fs.cpSync("samples/docs", path.join(root, "docs"), { recursive: true });
  fs.cpSync("samples/experiments", path.join(root, "experiments"), { recursive: true });
} else {
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    path.join(root, "docs", "시작하기.md"),
    `---
title: 시작하기
tags: [안내]
date: ${today}
---

# 시작하기

이 폴더(\`${path.relative(process.cwd(), root) || root}/docs\`)에 Markdown 문서를 넣으면 앱에 나타납니다.
하위 폴더는 그대로 분류가 됩니다. 이 폴더는 로컬에만 있고 저장소에는 올라가지 않습니다.

문서 작성 규칙은 저장소의 \`samples/docs/references/markdown-conventions.md\`를 참고하세요.
`,
  );
}

console.log(`작업 폴더를 만들었습니다: ${root}${withSamples ? " (샘플 복사)" : ""}`);
console.log("npm run dev 를 다시 실행하거나 새로고침하면 이 폴더의 문서가 보입니다.");
