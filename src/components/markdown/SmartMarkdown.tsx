/**
 * Smart Markdown Renderer with Token-Based Embeds
 * Primary: Detects [[EMBED:...]] tokens and converts to React components
 * Fallback: Detects standalone URLs in paragraphs and converts to embeds
 * Uses ReactMarkdown for safe rendering (no dangerouslySetInnerHTML)
 */

import React, { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmbedFromURL, { EmbedFromToken } from '../embeds/EmbedFromURL';

type AnyNode = any;

// Regex to detect embed tokens: [[EMBED:TYPE:DATA]]
const TOKEN_REGEX = /^\s*\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):.+\]\]\s*$/i;
const GLOBAL_TOKEN_REGEX = /\[\[EMBED:(TIKTOK|TWEET|YOUTUBE):([^\]]+)\]\]/g;

/**
 * Checks if a paragraph contains an embed token
 * Returns the token if found, null otherwise
 */
function maybeEmbedToken(node: AnyNode): string | null {
  if (!node?.children || node.children.length !== 1) {
    return null;
  }

  const onlyChild = node.children[0];

  // Check if it's a text node containing a token
  if (onlyChild?.type === 'text' && typeof onlyChild?.value === 'string') {
    const text = onlyChild.value.trim();
    if (TOKEN_REGEX.test(text)) {
      return text;
    }
  }

  return null;
}

/**
 * Checks if a paragraph node contains only a single URL (fallback for legacy content)
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

/**
 * Extract TL;DR and Key Highlights from content
 * Returns { tldr: string | null, highlights: string[], remainingContent: string }
 */
function extractTLDRAndHighlights(content: string) {
  const tldrMatch = content.match(/^TL;DR:\s*(.+?)(?=\n\nKey Highlights:|$)/is);
  const highlightsMatch = content.match(/Key Highlights:\s*\n((?:•\s*.+\n?)+)/i);
  
  let tldr: string | null = null;
  let highlights: string[] = [];
  let remainingContent = content;
  
  if (tldrMatch) {
    tldr = tldrMatch[1].trim();
    // Remove TL;DR section from content
    remainingContent = remainingContent.replace(/^TL;DR:.*?(?=\n\nKey Highlights:|$)/is, '').trim();
  }
  
  if (highlightsMatch) {
    const highlightsText = highlightsMatch[1];
    highlights = highlightsText
      .split(/\n/)
      .map(line => line.replace(/^•\s*/, '').trim())
      .filter(line => line.length > 0);
    // Remove Key Highlights section from content
    remainingContent = remainingContent.replace(/Key Highlights:\s*\n((?:•\s*.+\n?)+)/i, '').trim();
  }
  
  return { tldr, highlights, remainingContent };
}

interface SmartMarkdownProps {
  content: string;
}

export default function SmartMarkdown({ content }: SmartMarkdownProps) {
  // PRE-PROCESS: Extract tokens and split content
  const tokens: Array<{ type: string; payload: string; fullToken: string }> = [];
  const tokenMatches = content.matchAll(GLOBAL_TOKEN_REGEX);
  
  for (const match of tokenMatches) {
    tokens.push({
      type: match[1],
      payload: match[2],
      fullToken: match[0]
    });
  }
  
  // If no tokens, render normally
  if (tokens.length === 0) {
    return renderMarkdown(content);
  }
  
  // Split content by tokens
  const parts: Array<{ type: 'markdown' | 'embed'; content: string; embedData?: any }> = [];
  let lastIndex = 0;
  
  for (const token of tokens) {
    const tokenIndex = content.indexOf(token.fullToken, lastIndex);
    
    if (tokenIndex > lastIndex) {
      // Add markdown before token
      parts.push({
        type: 'markdown',
        content: content.substring(lastIndex, tokenIndex)
      });
    }
    
    // Add embed
    parts.push({
      type: 'embed',
      content: token.fullToken,
      embedData: { type: token.type, payload: token.payload }
    });
    
    lastIndex = tokenIndex + token.fullToken.length;
  }
  
  // Add remaining markdown
  if (lastIndex < content.length) {
    parts.push({
      type: 'markdown',
      content: content.substring(lastIndex)
    });
  }
  
  // Render parts
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'embed' && part.embedData) {
          return <EmbedFromToken key={index} token={part.content} />;
        } else {
          return <Fragment key={index}>{renderMarkdown(part.content)}</Fragment>;
        }
      })}
    </>
  );
}

function renderMarkdown(content: string) {
  // Extract TL;DR and highlights if present
  const { tldr, highlights, remainingContent } = extractTLDRAndHighlights(content);
  
  return (
    <div>
      {/* TL;DR Section */}
      {tldr && (
        <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-3">
            TL;DR
          </h3>
          <p className="text-lg leading-relaxed text-justify">
            {tldr}
          </p>
        </div>
      )}
      
      {/* Key Highlights Section */}
      {highlights.length > 0 && (
        <div className="bg-accent/5 border-l-4 border-accent rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-3">
            Key Highlights
          </h3>
          <ul className="space-y-2">
            {highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1" aria-hidden="true">•</span>
                <span className="text-lg leading-relaxed flex-1 text-justify">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Main Article Content */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          p({ node, children, ...props }) {
            // Check for standalone URL (fallback for legacy content)
            const url = maybeEmbedFromParagraph(node as any);
            if (url) {
              return <EmbedFromURL url={url} />;
            }
            
            return <p className="text-lg leading-relaxed mb-4 text-justify" {...props}>{children}</p>;
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
          return <ul className="list-disc list-inside mb-4 space-y-2 text-justify" {...props}>{children}</ul>;
        },
        ol({ children, ...props }) {
          return <ol className="list-decimal list-inside mb-4 space-y-2 text-justify" {...props}>{children}</ol>;
        },
        // Style blockquotes
        blockquote({ children, ...props }) {
          return (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground text-justify" {...props}>
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
          return <strong className="font-bold text-foreground" {...props}>{children}</strong>;
        },
        em({ children, ...props }) {
          return <em className="italic" {...props}>{children}</em>;
        },
        // Style list items
        li({ children, ...props }) {
          return <li {...props}>{children}</li>;
        },
      }}
    >
      {remainingContent}
    </ReactMarkdown>
    </div>
  );
}

