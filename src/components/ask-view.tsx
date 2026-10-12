"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toExperimentMarkdown } from "@/lib/experiment-log";
import { retrieve, type RetrievedChunk } from "@/lib/retrieval";
import type { Doc } from "@/lib/types";
import { DocPicker } from "./doc-picker";
import { Highlight } from "./highlight";
import { useSelection } from "./use-selection";

const EXAMPLES = ["1단계 검색 방식은 무엇으로 결정했나?", "임베딩 저장소 후보", "청킹할 때 조각 크기 문제"];

export function AskView({ docs }: { docs: Doc[] }) {
  const { selected } = useSelection();
  const chosen = useMemo(
    () => selected.map((s) => docs.find((d) => d.slug === s)).filter((d): d is Doc => d !== undefined),
    [selected, docs],
  );
  const scope = chosen.length > 0 ? chosen : docs;

  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<{ question: string; scope: string[]; results: RetrievedChunk[] } | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setAsked({ question: trimmed, scope: scope.map((d) => d.slug), results: retrieve(trimmed, scope, 5) });
    setLog(null);
    setCopied(false);
  };

  const makeLog = async () => {
    if (!asked) return;
    const md = toExperimentMarkdown({
      question: asked.question,
      documents: asked.scope,
      results: asked.results,
      date: new Date().toISOString().slice(0, 10),
    });
    setLog(md);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const terms = asked ? asked.results.flatMap((r) => r.matched) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <h2 className="text-sm font-semibold">질문 대상 문서</h2>
        <p className="text-xs text-zinc-500">
          {chosen.length > 0 ? `선택한 문서 ${chosen.length}개에서 찾습니다.` : `선택한 문서가 없어 전체 ${docs.length}개에서 찾습니다.`}
        </p>
        <DocPicker docs={docs} />
      </aside>

      <section className="min-w-0 space-y-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="문서에 대해 질문하기"
            aria-label="질문"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
            찾기
          </button>
        </form>
        <div className="flex flex-wrap gap-2 text-xs">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => ask(ex)} className="rounded-full border border-zinc-300 px-2.5 py-1 text-zinc-600 hover:border-indigo-400 dark:border-zinc-700 dark:text-zinc-400">
              {ex}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
          1단계에서는 AI 답변을 만들지 않고, 질문과 관련된 <b>근거 문단</b>만 찾습니다(RAG의 검색 단계). 3단계에서 이 문단들을 근거로 답변을 생성합니다.
        </div>

        {asked && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">근거 문단 {asked.results.length}개</h3>
              <button type="button" onClick={makeLog} className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:border-indigo-400 dark:border-zinc-700">
                실험 기록용 Markdown 만들기
              </button>
            </div>
            {asked.results.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                관련 문단을 찾지 못했습니다. 다른 단어로 물어보거나 대상 문서를 늘려 보세요.
              </p>
            ) : (
              <ol className="space-y-2">
                {asked.results.map((r, i) => (
                  <li key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/docs/${r.slug}`} className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                        {i + 1}. {r.docTitle}
                        {r.heading && <span className="text-zinc-500"> › {r.heading}</span>}
                      </Link>
                      <span className="shrink-0 text-xs tabular-nums text-zinc-400">점수 {r.score}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                      <Highlight text={r.text} terms={terms} />
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {log && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              {copied ? "클립보드에 복사했습니다. " : ""}
              <code>experiments/</code> 폴더에 새 <code>.md</code> 파일로 저장하면 실험 기록에 나타납니다.
            </p>
            <textarea
              readOnly
              value={log}
              rows={14}
              aria-label="실험 기록 Markdown"
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        )}
      </section>
    </div>
  );
}
