/**
 * Smart Markdown Renderer with Automatic Embeds
 * Detects standalone URLs in paragraphs and converts them to embeds
 * Uses ReactMarkdown for safe rendering (no dangerouslySetInnerHTML)
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmbedFromURL from '../embeds/EmbedFromURL';

type AnyNode = any;

/**
 * Checks if a paragraph node contains only a single URL
 * Returns the URL if found, null otherwise
 */
function maybeEmbedFromParagraph(node: AnyNode): string | null {
  if (!node?.children || node.children.length !== 1) {
    return null;
  }

  const onlyChild = node.children[0];

  // Case 1: Markdown link [text](url)
  if (onlyChild?.tagName === 'a' && typeof onlyChild?.properties?.href === 'string') {
    return String(onlyChild.properties.href);
  }

  // Case 2: Plain text URL (not linkified)
  if (onlyChild?.type === 'text' && typeof onlyChild?.value === 'string') {
    const text = onlyChild.value.trim();
    if (text.startsWith('http://') || text.startsWith('https://')) {
      return text;
    }
  }

  return null;
}

interface SmartMarkdownProps {
  content: string;
}

export default function SmartMarkdown({ content }: SmartMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml={true} // Skip HTML for security
      components={{
        // Custom paragraph renderer - detect and embed URLs
        p({ node, children, ...props }) {
          const url = maybeEmbedFromParagraph(node as any);
          if (url) {
            return <EmbedFromURL url={url} />;
          }
          return <p className="text-lg leading-relaxed mb-4" {...props}>{children}</p>;
        },
        // Open links in new tab
        a({ href, children, ...props }) {
          return (
            <a
              {...props}
              href={href as string}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        // Style headings
        h1({ children, ...props }) {
          return <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>;
        },
        h2({ children, ...props }) {
          return <h2 className="text-2xl font-bold mt-6 mb-3" {...props}>{children}</h2>;
        },
        h3({ children, ...props }) {
          return <h3 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h3>;
        },
        // Style lists
        ul({ children, ...props }) {
          return <ul className="list-disc list-inside mb-4 space-y-2" {...props}>{children}</ul>;
        },
        ol({ children, ...props }) {
          return <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>{children}</ol>;
        },
        // Style blockquotes
        blockquote({ children, ...props }) {
          return (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground" {...props}>
              {children}
            </blockquote>
          );
        },
        // Style code blocks
        code({ inline, children, ...props }: any) {
          if (inline) {
            return <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
          }
          return <code className="block bg-muted p-4 rounded-lg my-4 overflow-x-auto" {...props}>{children}</code>;
        },
        // Style strong/em
        strong({ children, ...props }) {
          return <strong className="font-bold" {...props}>{children}</strong>;
        },
        em({ children, ...props }) {
          return <em className="italic" {...props}>{children}</em>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

