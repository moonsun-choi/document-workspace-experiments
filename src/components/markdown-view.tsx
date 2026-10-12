import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { replaceWikiLinks } from "@/lib/markdown";

interface Props {
  markdown: string;
  /** 위키 링크 대상 → slug. 없으면 위키 링크를 깨진 링크로 표시한다. */
  resolve?: (target: string) => string | null;
}

export function MarkdownView({ markdown, resolve = () => null }: Props) {
  const source = replaceWikiLinks(markdown, resolve, (slug) => `/docs/${slug}`);
  return (
    <div className="doc-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = "", children }) => {
            if (href === "#broken-link") {
              return (
                <a className="broken-link" title="연결할 문서를 찾지 못했습니다">
                  {children}
                </a>
              );
            }
            if (href.startsWith("/")) return <Link href={href}>{children}</Link>;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
