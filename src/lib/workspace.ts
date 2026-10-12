import {
  asString,
  asStringList,
  extractWikiLinks,
  firstHeading,
  parseFrontmatter,
  stripLeadingH1,
  toPlainText,
} from "./markdown";
import type { Doc, FolderNode, Workspace } from "./types";

export interface SourceFile {
  /** content/ 기준 상대 경로. 예: "research/embeddings.md" */
  path: string;
  raw: string;
}

/**
 * 위키 링크 대상을 slug로 바꾼다. 전체 경로("research/embeddings")를 먼저 보고,
 * 없으면 파일 이름("embeddings")으로 찾는다. 이름이 여러 문서에 겹치면 해석하지 않는다.
 */
export function createLinkResolver(docs: Pick<Doc, "slug" | "name">[]) {
  const bySlug = new Set(docs.map((d) => d.slug));
  const byName = new Map<string, string | null>();
  for (const d of docs) {
    const key = d.name.toLowerCase();
    byName.set(key, byName.has(key) ? null : d.slug);
  }
  return (target: string): string | null => {
    const clean = target.replace(/\.md$/i, "").replace(/^\/+/, "").split("#")[0].trim();
    if (bySlug.has(clean)) return clean;
    return byName.get(clean.toLowerCase()) ?? null;
  };
}

export function buildWorkspace(files: SourceFile[]): Workspace {
  const partial = files
    .filter((f) => f.path.toLowerCase().endsWith(".md"))
    .map((f) => {
      const slug = f.path.replace(/\\/g, "/").replace(/\.md$/i, "");
      const parts = slug.split("/");
      const name = parts[parts.length - 1];
      const { data, body } = parseFrontmatter(f.raw);
      return {
        slug,
        name,
        folder: parts.slice(0, -1).join("/"),
        title: asString(data.title) ?? firstHeading(body) ?? name,
        tags: [...new Set(asStringList(data.tags))],
        date: asString(data.date),
        body,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const resolve = createLinkResolver(partial);
  const titleBySlug = new Map(partial.map((d) => [d.slug, d.title]));
  const docs: Doc[] = partial.map((d) => {
    const links = new Set<string>();
    const brokenLinks = new Set<string>();
    const linkLabels: Record<string, string> = {};
    for (const target of extractWikiLinks(d.body)) {
      const slug = resolve(target);
      if (slug === null) brokenLinks.add(target);
      else {
        linkLabels[target] = titleBySlug.get(slug) ?? target;
        if (slug !== d.slug) links.add(slug);
      }
    }
    // 본문 맨 앞 제목은 title과 겹치므로 검색 미리보기에서 뺀다.
    const text = toPlainText(stripLeadingH1(d.body), (t) => linkLabels[t] ?? t);
    return { ...d, text, links: [...links], linkLabels, brokenLinks: [...brokenLinks] };
  });

  const backlinks: Record<string, string[]> = Object.fromEntries(docs.map((d) => [d.slug, []]));
  for (const d of docs) for (const target of d.links) backlinks[target].push(d.slug);

  const tagCounts = new Map<string, number>();
  for (const d of docs) for (const t of d.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = [...tagCounts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return { docs, tree: buildTree(docs), tags, backlinks };
}

function buildTree(docs: Doc[]): FolderNode {
  const root: FolderNode = { name: "", path: "", folders: [], docs: [] };
  for (const d of docs) {
    let node = root;
    for (const part of d.folder ? d.folder.split("/") : []) {
      const path = node.path ? `${node.path}/${part}` : part;
      let child = node.folders.find((f) => f.name === part);
      if (!child) {
        child = { name: part, path, folders: [], docs: [] };
        node.folders.push(child);
      }
      node = child;
    }
    node.docs.push({ slug: d.slug, title: d.title });
  }
  const sort = (n: FolderNode) => {
    n.folders.sort((a, b) => a.name.localeCompare(b.name));
    n.docs.sort((a, b) => a.title.localeCompare(b.title));
    n.folders.forEach(sort);
  };
  sort(root);
  return root;
}
