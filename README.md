# 문서 작업 공간 실험

Markdown 문서를 폴더별로 모아 두고 **검색 · 태그 필터 · 비교/요약 · 연결 그래프 · 문서 기반 질문 · 실험 기록**을 해 보는 실험용 앱입니다.

- 스택: Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- 1단계는 **AI API 없이** UI와 검색을 만듭니다. 임베딩·RAG는 이후 단계에서 붙입니다.
- **앱 코드만 저장소(클라우드)에 두고, 실제 Markdown 문서는 로컬 `workspace/`에만 둡니다.** 이 폴더는 `.gitignore`에 들어 있어 커밋되지 않습니다.

## 실행

```bash
npm install
npm run workspace:init              # 로컬 작업 폴더 workspace/ 생성 (처음 한 번)
npm run workspace:init -- --samples # 또는 샘플 문서를 복사해서 시작
npm run dev        # http://localhost:3000
npm test           # 핵심 로직 단위 테스트 (vitest)
npm run lint
npm run typecheck
npm run build
```

## 화면

| 경로 | 기능 |
| --- | --- |
| `/` | 폴더 트리, 검색(제목·태그·본문), 태그 필터(AND). 조건은 URL `?q=&tag=&folder=`에 남음 |
| `/docs/<경로>` | 문서 보기, 나가는 링크, 백링크, 찾지 못한 링크 |
| `/graph` | `[[위키 링크]]` 연결 그래프. 태그 공유 간선, 태그 강조, `?focus=<slug>` |
| `/compare` | 선택한 문서들의 공통 태그·직접 링크·추출 요약·키워드 분포 |
| `/ask` | 선택한 문서(없으면 전체)에서 질문과 관련된 근거 문단 찾기 + 실험 기록 Markdown 생성 |
| `/experiments` | `experiments/` 폴더의 실험 기록 |

문서 카드의 **선택** 버튼으로 담은 문서(오른쪽 위 "선택 n")는 비교·질문 화면에서 함께 씁니다. 선택 상태는 브라우저 localStorage에만 저장됩니다.

## 문서는 어디에 있나

| 위치 | 저장소에 올라가나 | 내용 |
| --- | --- | --- |
| `workspace/docs/` | ❌ (gitignore) | 내 실제 문서. 하위 폴더가 그대로 분류가 됩니다 |
| `workspace/experiments/` | ❌ (gitignore) | 실험 기록. 질문 화면의 **실험 기록으로 저장** 버튼이 여기에 파일을 씁니다 |
| `samples/` | ✅ | 데모·테스트용 가상 샘플. `workspace/`가 없을 때 읽기 전용으로 보여 줍니다 |

- 작업 폴더 위치는 `WORKSPACE_DIR`로 바꿀 수 있습니다. `.env.local`(커밋되지 않음)에 적어 두면 편합니다.

  ```bash
  # .env.local
  WORKSPACE_DIR=/Users/me/Library/Mobile Documents/com~apple~CloudDocs/notes
  ```

- **여러 컴퓨터에서 이어서 작업하려면** `WORKSPACE_DIR`을 iCloud·Google Drive·Dropbox 같은 동기화 폴더로 지정하거나, 작업 폴더를 별도의 **비공개** Git 저장소로 관리하세요. 앱 코드는 이 저장소에서 받습니다.
- 내 문서는 로컬에서 실행할 때만 보입니다. 클라우드 배포판은 샘플 데모입니다(아래 "Cloudflare 배포").

### 파일 쓰기

- 저장은 개발 서버(`npm run dev`)에서만 켜져 있습니다. 로그인 기능이 없어서, 서버에 접근할 수 있는 사람은 누구나 저장 요청을 보낼 수 있기 때문입니다.
- 로컬에서 `npm run build && npm start`로 쓸 때는 `ENABLE_FILE_WRITE=1`을 설정하세요. 외부에 공개된 서버에서는 켜지 마세요.
- 파일 이름은 `날짜-제목.md`로 자동으로 만들어지고, 같은 이름이 있으면 `-2`를 붙입니다. 기존 파일은 덮어쓰지 않습니다.
- 샘플 모드(`workspace/` 없음)에서는 저장하지 않습니다.

## Cloudflare 배포 (샘플 데모)

배포판은 서버 없는 **정적 사이트**입니다. `STATIC_EXPORT=1`로 빌드하면 로컬 `workspace/`가 있어도 **항상 `samples/`만** 들어가므로, 내 문서가 공개될 일은 없습니다. 검색·비교·그래프·질문은 그대로 동작하고, 저장 기능만 꺼집니다.

```bash
npm run build:static     # out/ 생성
npm run preview:static   # Cloudflare 런타임으로 로컬 미리보기 (http://localhost:8787)
```

**방법 1. Cloudflare 대시보드에서 GitHub 연결 (권장, push하면 자동 배포)**

1. Cloudflare 대시보드 → Workers & Pages → Create → **Import a repository** → 이 저장소 선택
2. 빌드 설정
   - Build command: `npm run build:static`
   - Deploy command: `npx wrangler deploy`
   - Node 버전은 저장소의 `.node-version`(22)을 자동으로 읽으므로 따로 넣지 않아도 됩니다.
3. 배포할 브랜치를 고르고 저장하면 `document-workspace-experiments.<계정>.workers.dev` 주소로 배포됩니다.

**방법 2. 내 컴퓨터에서 직접**

```bash
npx wrangler login
npm run deploy
```

## 문서 작성 규칙

```markdown
---
title: 문서 제목
tags: [태그1, 태그2]
date: 2026-10-01
---

본문. 다른 문서는 [[파일이름]] 또는 [[폴더/파일이름|보여 줄 글자]]로 연결합니다.
```

실험 기록(`workspace/experiments/*.md`) 머리말: `title`, `date`, `status`(완료/진행 중/기록), `method`, `documents`(문서 파일 이름 목록), `tags`.

## 구조

```
samples/                가상 샘플 (docs/, experiments/) — 저장소에 포함
workspace/              내 문서 (docs/, experiments/) — 로컬 전용, gitignore
scripts/init-workspace.mjs
src/lib/                UI와 분리된 순수 로직 (테스트 대상)
  markdown.ts           frontmatter, 위키 링크, 일반 텍스트 변환
  workspace.ts          문서 색인: 링크 해석, 백링크, 태그, 폴더 트리
  workspace-paths.ts    작업 폴더/샘플 중 어디를 쓸지 결정
  content.ts            파일 시스템에서 읽기 (서버 전용)
  experiment-store.ts   실험 기록 파일 쓰기 (이름 생성, 덮어쓰기 방지)
  search.ts             키워드 검색 (부분 문자열 + 제목/태그 가중치)
  text.ts               조사·어미 제거, 키워드, 추출 요약
  compare.ts            문서 비교
  retrieval.ts          청킹 + 근거 문단 검색 (RAG의 검색 단계)
  graph.ts              그래프 간선 + d3-force 배치(서버에서 계산)
  experiment-log.ts     질문 결과 → 실험 기록 Markdown
src/components/         클라이언트 UI
src/app/                라우트 (actions.ts: 저장 서버 액션, actions.static.ts: 배포판 대체)
wrangler.jsonc          Cloudflare 설정 (out/ 정적 파일을 올림)
worker/index.js         정적 파일 앞단 Worker: Next 파일 이름의 "$" 경로를 리다이렉트 없이 응답
```

## 다음 단계

1. **임베딩 + 하이브리드 검색**: `retrieval.ts`의 `chunkDoc` 결과를 임베딩하고, 키워드 점수(`search.ts`, `retrieve`)와 벡터 점수를 합칩니다.
2. **RAG 질의응답**: `/ask`에서 찾은 근거 문단을 프롬프트에 넣어 답변을 생성하고, 답변마다 근거를 표시합니다.
3. **실험 자동 기록**: LLM 답변이 붙으면 프롬프트·모델·답변까지 함께 저장합니다.
4. **LLM 요약 vs 추출 요약** 비교를 비교 화면에 추가합니다.
