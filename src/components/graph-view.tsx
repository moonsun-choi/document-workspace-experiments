"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { GraphEdge, PositionedNode } from "@/lib/graph";
import { Tag } from "./tag";

interface Layout {
  nodes: PositionedNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

interface Props {
  linkOnly: Layout;
  withTags: Layout;
  folders: string[];
  tags: string[];
}

// 폴더별 색. 폴더가 더 많으면 반복한다.
const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#ec4899"];

export function GraphView({ linkOnly, withTags, folders, tags }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const focus = params.get("focus");
  const [showTagEdges, setShowTagEdges] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const layout = showTagEdges ? withTags : linkOnly;
  const color = (folder: string) => PALETTE[Math.max(0, folders.indexOf(folder)) % PALETTE.length];
  const pos = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);

  // 강조 기준: 마우스를 올린 노드 → 없으면 URL의 focus 노드
  const center = hover ?? (focus && pos.has(focus) ? focus : null);
  const neighbors = useMemo(() => {
    if (!center) return null;
    const set = new Set([center]);
    for (const e of layout.edges) {
      if (e.source === center) set.add(e.target);
      if (e.target === center) set.add(e.source);
    }
    return set;
  }, [center, layout]);

  const isDim = (n: PositionedNode) =>
    (neighbors !== null && !neighbors.has(n.id)) || (tag !== null && !n.tags.includes(tag));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showTagEdges} onChange={(e) => setShowTagEdges(e.target.checked)} />
          태그를 공유하는 문서도 연결 (점선)
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500">태그 강조:</span>
          {tags.map((t) => (
            <button key={t} type="button" onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t}>
              <Tag active={tag === t}>{t}</Tag>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        {folders.map((f) => (
          <span key={f} className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: color(f) }} />
            {f || "(최상위)"}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="h-auto w-full"
          role="img"
          aria-label="문서 연결 그래프"
        >
          <g>
            {layout.edges.map((e) => {
              const a = pos.get(e.source);
              const b = pos.get(e.target);
              if (!a || !b) return null;
              const active = center !== null && (e.source === center || e.target === center);
              const dim = (center !== null && !active) || (tag !== null && !(a.tags.includes(tag) && b.tags.includes(tag)));
              return (
                <line
                  key={`${e.source}-${e.target}-${e.kind}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  strokeWidth={active ? 2 : 1.2}
                  strokeDasharray={e.kind === "tag" ? "4 4" : undefined}
                  className={active ? "stroke-indigo-500" : "stroke-zinc-300 dark:stroke-zinc-700"}
                  opacity={dim ? 0.25 : 1}
                >
                  {e.tags && <title>공유 태그: {e.tags.join(", ")}</title>}
                </line>
              );
            })}
          </g>
          <g>
            {layout.nodes.map((n) => {
              const r = 7 + Math.min(n.degree, 6) * 1.6;
              const label = n.title.length > 14 ? `${n.title.slice(0, 13)}…` : n.title;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  opacity={isDim(n) ? 0.2 : 1}
                  className="cursor-pointer"
                  role="link"
                  tabIndex={0}
                  aria-label={n.title}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(n.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => router.push(`/docs/${n.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/docs/${n.id}`)}
                >
                  <title>{`${n.title} (${n.folder || "최상위"}) · 연결 ${n.degree}개`}</title>
                  <circle
                    r={r}
                    fill={color(n.folder)}
                    className="stroke-white dark:stroke-zinc-900"
                    strokeWidth={center === n.id ? 3 : 2}
                  />
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    className="fill-zinc-700 text-[12px] dark:fill-zinc-300"
                    style={{ paintOrder: "stroke", strokeWidth: 3 }}
                    stroke="var(--background)"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <p className="text-xs text-zinc-500">
        원 크기는 연결 수, 색은 폴더입니다. 노드에 마우스를 올리면 이웃 문서가 강조되고, 클릭하면 문서로 이동합니다.
      </p>
    </div>
  );
}
