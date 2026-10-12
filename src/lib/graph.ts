import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import type { Doc } from "./types";

export interface GraphNode {
  id: string;
  title: string;
  folder: string;
  tags: string[];
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: "link" | "tag";
  /** kind가 tag일 때 공유하는 태그들 */
  tags?: string[];
}

/**
 * 링크 간선은 위키 링크(방향 무시, 중복 제거), 태그 간선은 태그를 minShared개 이상 공유한 문서 쌍.
 */
export function buildGraph(docs: Doc[], options: { tagEdges?: boolean; minSharedTags?: number } = {}) {
  const { tagEdges = false, minSharedTags = 1 } = options;
  const ids = new Set(docs.map((d) => d.slug));
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const key = (a: string, b: string) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);

  for (const d of docs) {
    for (const target of d.links) {
      if (!ids.has(target) || seen.has(key(d.slug, target))) continue;
      seen.add(key(d.slug, target));
      edges.push({ source: d.slug, target, kind: "link" });
    }
  }

  if (tagEdges) {
    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const shared = docs[i].tags.filter((t) => docs[j].tags.includes(t));
        if (shared.length >= minSharedTags && !seen.has(key(docs[i].slug, docs[j].slug))) {
          edges.push({ source: docs[i].slug, target: docs[j].slug, kind: "tag", tags: shared });
        }
      }
    }
  }

  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  const nodes: GraphNode[] = docs.map((d) => ({
    id: d.slug,
    title: d.title,
    folder: d.folder,
    tags: d.tags,
    degree: degree.get(d.slug) ?? 0,
  }));
  return { nodes, edges };
}

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

/**
 * 서버에서 배치를 미리 계산해 클라이언트로 넘긴다. d3-force는 고정 시드를 쓰므로
 * 같은 입력이면 항상 같은 배치가 나온다.
 */
export function layoutGraph(graph: { nodes: GraphNode[]; edges: GraphEdge[] }): { nodes: PositionedNode[]; edges: GraphEdge[]; width: number; height: number } {
  const simNodes = graph.nodes.map((n) => ({ ...n })) as (GraphNode & SimulationNodeDatum)[];
  const simLinks = graph.edges.map((e) => ({ source: e.source, target: e.target, kind: e.kind }));

  forceSimulation(simNodes)
    .force(
      "link",
      forceLink<GraphNode & SimulationNodeDatum, (typeof simLinks)[number]>(simLinks)
        .id((d) => d.id)
        .distance((l) => (l.kind === "link" ? 150 : 210))
        .strength((l) => (l.kind === "link" ? 0.7 : 0.15)),
    )
    .force("charge", forceManyBody().strength(-700))
    .force("collide", forceCollide(62))
    .force("x", forceX(0).strength(0.04))
    .force("y", forceY(0).strength(0.07))
    .stop()
    .tick(400);

  const xs = simNodes.map((n) => n.x ?? 0);
  const ys = simNodes.map((n) => n.y ?? 0);
  // 라벨이 노드 아래·옆으로 나가므로 그만큼 여백을 둔다.
  const padX = 110;
  const padY = 50;
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const width = Math.max(480, maxX - minX + padX * 2);
  const height = Math.max(320, maxY - minY + padY * 2 + 20);
  const offsetX = (width - (maxX - minX)) / 2 - minX;
  const offsetY = padY - minY;

  return {
    nodes: simNodes.map(({ id, title, folder, tags, degree, x = 0, y = 0 }) => ({
      id,
      title,
      folder,
      tags,
      degree,
      x: Math.round((x + offsetX) * 10) / 10,
      y: Math.round((y + offsetY) * 10) / 10,
    })),
    edges: graph.edges,
    width: Math.round(width),
    height: Math.round(height),
  };
}
