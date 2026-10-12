"use client";

import type { FolderNode } from "@/lib/types";

interface Props {
  tree: FolderNode;
  counts: Record<string, number>;
  active: string;
  onSelect: (folder: string) => void;
}

/** 폴더만 보여 주는 트리. 문서 목록은 오른쪽 결과 영역이 담당한다. */
export function FolderTree({ tree, counts, active, onSelect }: Props) {
  return (
    <ul className="space-y-0.5 text-sm">
      <li>
        <FolderButton label="전체" count={counts[""] ?? 0} depth={0} active={active === ""} onClick={() => onSelect("")} />
      </li>
      {tree.folders.map((f) => (
        <Folder key={f.path} node={f} depth={1} counts={counts} active={active} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function Folder({ node, depth, counts, active, onSelect }: Omit<Props, "tree"> & { node: FolderNode; depth: number }) {
  return (
    <li>
      <FolderButton
        label={node.name}
        count={counts[node.path] ?? 0}
        depth={depth}
        active={active === node.path}
        onClick={() => onSelect(node.path)}
      />
      {node.folders.length > 0 && (
        <ul className="space-y-0.5">
          {node.folders.map((f) => (
            <Folder key={f.path} node={f} depth={depth + 1} counts={counts} active={active} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FolderButton(props: { label: string; count: number; depth: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{ paddingLeft: `${0.5 + props.depth * 0.9}rem` }}
      className={`flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-2 text-left ${
        props.active
          ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      <span className="truncate">{props.depth === 0 ? props.label : `📁 ${props.label}`}</span>
      <span className="text-xs tabular-nums text-zinc-400">{props.count}</span>
    </button>
  );
}
