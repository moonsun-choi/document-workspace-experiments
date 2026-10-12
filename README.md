# 문서 작업 공간 실험

Markdown 문서를 폴더별로 모아 두고 **검색 · 태그 필터 · 비교/요약 · 연결 그래프 · 문서 기반 질문 · 실험 기록**을 해 보는 실험용 앱입니다.

- 스택: Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- 1단계는 **AI API 없이** 샘플 문서로 UI와 검색을 만듭니다. 임베딩·RAG는 이후 단계에서 붙입니다.
- 공개 저장소이므로 `content/`, `experiments/`에는 **가상의 샘플 문서만** 둡니다.

## 실행

```bash
npm install
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

## 문서 작성 규칙

```markdown
---
title: 문서 제목
tags: [태그1, 태그2]
date: 2026-10-01
---

본문. 다른 문서는 [[파일이름]] 또는 [[폴더/파일이름|보여 줄 글자]]로 연결합니다.
```

실험 기록(`experiments/*.md`) 머리말: `title`, `date`, `status`(완료/진행 중/기록), `method`, `documents`(문서 파일 이름 목록), `tags`.

## 실제 문서로 돌려 보기 (커밋하지 않음)

`private/`는 `.gitignore`에 들어 있습니다. 실제 문서는 그 안에 두고 환경 변수로 가리키세요.

```bash
CONTENT_DIR=private/content EXPERIMENTS_DIR=private/experiments npm run dev
```

여러 컴퓨터에서 이어서 작업하려면 `private/`를 **별도의 비공개 저장소**로 clone해 두는 방식을 권장합니다.

## 구조

```
content/                샘플 문서 (폴더 = 분류)
experiments/            실험 기록
src/lib/                UI와 분리된 순수 로직 (테스트 대상)
  markdown.ts           frontmatter, 위키 링크, 일반 텍스트 변환
  workspace.ts          문서 색인: 링크 해석, 백링크, 태그, 폴더 트리
  content.ts            파일 시스템에서 읽기 (서버 전용)
  search.ts             키워드 검색 (부분 문자열 + 제목/태그 가중치)
  text.ts               조사·어미 제거, 키워드, 추출 요약
  compare.ts            문서 비교
  retrieval.ts          청킹 + 근거 문단 검색 (RAG의 검색 단계)
  graph.ts              그래프 간선 + d3-force 배치(서버에서 계산)
  experiment-log.ts     질문 결과 → 실험 기록 Markdown
src/components/         클라이언트 UI
src/app/                라우트
```

## 다음 단계

1. **임베딩 + 하이브리드 검색**: `retrieval.ts`의 `chunkDoc` 결과를 임베딩하고, 키워드 점수(`search.ts`, `retrieve`)와 벡터 점수를 합칩니다.
2. **RAG 질의응답**: `/ask`에서 찾은 근거 문단을 프롬프트에 넣어 답변을 생성하고, 답변마다 근거를 표시합니다.
3. **실험 자동 기록**: 질문·프롬프트·모델·결과를 `experiments/`에 바로 저장합니다(지금은 Markdown을 복사해 직접 저장).
4. **LLM 요약 vs 추출 요약** 비교를 비교 화면에 추가합니다.
