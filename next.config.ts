import type { NextConfig } from "next";

// STATIC_EXPORT=1 이면 서버 없이 올릴 수 있는 정적 사이트(out/)를 만든다. Cloudflare 배포용.
// 이 빌드는 항상 samples/만 읽는다(src/lib/workspace-paths.ts).
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // 정적 내보내기는 PPR(Cache Components)과 함께 쓸 수 없어 배포 빌드에서만 끈다.
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  ...(staticExport && { output: "export" as const, trailingSlash: true }),
  turbopack: {
    // 정적 사이트에는 서버 액션이 없으므로 저장 기능을 대체 모듈로 바꾼다.
    resolveAlias: staticExport ? { "@/app/actions": "./src/app/actions.static.ts" } : {},
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
