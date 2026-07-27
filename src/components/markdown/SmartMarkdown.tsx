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
import { getOptimizedImageUrl, IMAGE_PRESETS } from '../../lib/utils/imageProxy';
import { stripSourceSocialLeaks } from '../../../scripts/embeds/cleanMarkdownEmbeds.js';

interface MarkdownNode {
  children?: Array<{
    type?: string;
    value?: string;
    tagName?: string;
    properties?: Record<string, unknown>;
  }>;
}

// Regex to detect embed tokens: [[EMBED:TYPE:DATA]]
const TOKEN_REGEX = /^\s*\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):.+\]\]\s*$/i;
const GLOBAL_TOKEN_REGEX = /\[\[EMBED:(TIKTOK|TWEET|YOUTUBE):([^\]]+)\]\]/gi;

function sanitizeContentArtifacts(content: string) {
  const seenTokens = new Set<string>();

  const withoutArtifacts = stripSourceSocialLeaks(content)
    .replace(/`(\[\[EMBED:(?!TIKTOK|TWEET|YOUTUBE)[^\]]+\]\])`/gi, '')
    .replace(/\[\[EMBED:(?!TIKTOK|TWEET|YOUTUBE)[^\]]+\]\]/gi, '')
    .replace(/__WIDGET_\d+__/g, '')
    .replace(/\bWIDGET_\d+\b/g, '')
    .replace(/^\s*(?:Twitter|TikTok)\s+Embed\s*$/gim, '')
    .replace(/^\s*(?:YouTube Widget|Twitter Widget Iframe|Widget Iframe|Instagram Widget|Social Media Widget)\s*$/gim, '');

  const dedupedTokens = withoutArtifacts.replace(
    /\[\[EMBED:(TIKTOK|TWEET|YOUTUBE):([^\]]+)\]\]/gi,
    (match, type, payload) => {
      const key = `${String(type).toUpperCase()}:${String(payload).trim()}`;
      if (seenTokens.has(key)) {
        return '';
      }
      seenTokens.add(key);
      return `[[EMBED:${String(type).toUpperCase()}:${String(payload).trim()}]]`;
    },
  );

  return dedupedTokens.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Checks if a paragraph contains an embed token
 * Returns the token if found, null otherwise
 */
function maybeEmbedToken(node: MarkdownNode): string | null {
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
function maybeEmbedFromParagraph(node: MarkdownNode): string | null {
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
 * Supports multiple formats:
 * - Old format: "TL;DR: text" and "Key Highlights:\n• point"
 * - New format: "## TL;DR\ntext" and "### Key Highlights\n- point"
 * Returns { tldr: string | null, highlights: string[], remainingContent: string }
 */
function extractTLDRAndHighlights(content: string) {
  let tldr: string | null = null;
  let highlights: string[] = [];
  let remainingContent = content;
  
  // Try new markdown format first: ## TL;DR or ## TL;DR (with semicolon typo)
  let tldrMatch = content.match(/^##\s*TL[;:]?DR\s*\n+(.+?)(?=\n+###?\s*Key Highlights|\n+---|\n\n#|\n\n\n|$)/is);
  
  // Fallback to old format: TL;DR: text
  if (!tldrMatch) {
    tldrMatch = content.match(/^TL;DR:\s*(.+?)(?=\n\nKey Highlights:|$)/is);
  }
  // Bare format: TL;DR\ntext (no ## or :)
  if (!tldrMatch) {
    tldrMatch = content.match(/^TL;DR\s*\n+(.+?)(?=\n\nKey Highlights|\n+---|\n\n\n|$)/is);
  }
  
  if (tldrMatch) {
    tldr = tldrMatch[1].trim();
    remainingContent = remainingContent.replace(/^##\s*TL[;:]?DR\s*\n+.+?(?=\n+###?\s*Key Highlights|\n+---|\n\n#|\n\n\n|$)/is, '').trim();
    remainingContent = remainingContent.replace(/^TL;DR:.*?(?=\n\nKey Highlights:|$)/is, '').trim();
    remainingContent = remainingContent.replace(/^TL;DR\s*\n+.+?(?=\n\nKey Highlights|\n+---|\n\n\n|$)/is, '').trim();
  }
  
  // Try new markdown format: ### Key Highlights with - bullets
  let highlightsMatch = content.match(/###?\s*Key Highlights\s*\n+((?:[-•*]\s*.+\n?)+)/i);
  
  // Fallback to old format: Key Highlights: with • bullets
  if (!highlightsMatch) {
    highlightsMatch = content.match(/Key Highlights:\s*\n((?:•\s*.+\n?)+)/i);
  }
  // Bare format: Key Highlights\n (no ### or :)
  if (!highlightsMatch) {
    highlightsMatch = content.match(/^Key Highlights\s*\n((?:[•\-*]\s*.+\n?)+)/im);
  }
  
  if (highlightsMatch) {
    const highlightsText = highlightsMatch[1];
    highlights = highlightsText
      .split(/\n/)
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
    remainingContent = remainingContent.replace(/###?\s*Key Highlights\s*\n+((?:[-•*]\s*.+\n?)+)/i, '').trim();
    remainingContent = remainingContent.replace(/Key Highlights:\s*\n((?:•\s*.+\n?)+)/i, '').trim();
    remainingContent = remainingContent.replace(/^Key Highlights\s*\n((?:[•\-*]\s*.+\n?)+)/im, '').trim();
  }
  
  // Clean up any remaining --- separators at the start
  remainingContent = remainingContent.replace(/^---\s*\n+/gm, '').trim();
  
  return { tldr, highlights, remainingContent };
}

interface SmartMarkdownProps {
  content: string;
}

export default function SmartMarkdown({ content }: SmartMarkdownProps) {
  // PRE-PROCESS: Clean up tokens wrapped in backticks (e.g., `[[EMBED:...]]`)
  let cleanedContent = content.replace(/`(\[\[EMBED:(?:TIKTOK|TWEET|YOUTUBE):[^\]]+\]\])`/gi, '$1');
  cleanedContent = sanitizeContentArtifacts(cleanedContent);

  // Extract TL;DR and highlights FIRST globally before splitting
  const { tldr, highlights, remainingContent } = extractTLDRAndHighlights(cleanedContent);

  // PRE-PROCESS: Extract tokens and split the remaining content
  const tokens: Array<{ type: string; payload: string; fullToken: string }> = [];
  const tokenMatches = remainingContent.matchAll(GLOBAL_TOKEN_REGEX);
  
  for (const match of tokenMatches) {
    tokens.push({
      type: match[1],
      payload: match[2],
      fullToken: match[0]
    });
  }
  
  // Split content by tokens
  const parts: Array<{ type: 'markdown' | 'embed'; content: string; embedData?: { type: string; payload: string } }> = [];
  let lastIndex = 0;
  
  for (const token of tokens) {
    const tokenIndex = remainingContent.indexOf(token.fullToken, lastIndex);
    
    if (tokenIndex > lastIndex) {
      // Add markdown before token
      parts.push({
        type: 'markdown',
        content: remainingContent.substring(lastIndex, tokenIndex)
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
  if (lastIndex < remainingContent.length) {
    parts.push({
      type: 'markdown',
      content: remainingContent.substring(lastIndex)
    });
  }
  
  // Render parts
  return (
    <div>
      {/* TL;DR — editorial mono label + hairline (no tinted cards) */}
      {tldr && (
        <section className="article-editorial-block mb-8 border-b border-hairline pb-6">
          <h3 className="font-mono text-[11px] font-medium tracking-[0.14em] text-signal">
            TL;DR
          </h3>
          <p className="mt-3 text-[1.0625rem] leading-[1.65] text-ink-70">{tldr}</p>
        </section>
      )}

      {/* Key Highlights — editorial list */}
      {highlights.length > 0 && (
        <section className="article-editorial-block mb-8 border-b border-hairline pb-6">
          <h3 className="font-mono text-[11px] font-medium tracking-[0.14em] text-signal">
            KEY HIGHLIGHTS
          </h3>
          <ul className="mt-3 list-none space-y-2.5 p-0">
            {highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3">
                <span
                  className="mt-[0.55em] block h-px w-3 shrink-0 bg-hairline-strong"
                  aria-hidden="true"
                />
                <span className="article-highlight-text flex-1 text-[1.0625rem] leading-[1.65] text-ink-70">
                  {highlight}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {parts.map((part, index) => {
        if (part.type === 'embed' && part.embedData) {
          return <EmbedFromToken key={index} token={part.content} />;
        } else {
          return <Fragment key={index}>{renderMarkdownContent(part.content)}</Fragment>;
        }
      })}
    </div>
  );
}

function renderMarkdownContent(content: string) {
  return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          p({ node, children, ...props }) {
            // Check for standalone URL (fallback for legacy content)
            const url = maybeEmbedFromParagraph(node as MarkdownNode);
            if (url) {
              return <EmbedFromURL url={url} />;
            }
            
            return (
              <p className="mb-4 text-[1.0625rem] leading-[1.65]" {...props}>
                {children}
              </p>
            );
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
          return (
            <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
              {children}
            </ol>
          );
        },
        // Style blockquotes
        blockquote({ children, ...props }) {
          return (
            <blockquote
              className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground"
              {...props}
            >
              {children}
            </blockquote>
          );
        },
        // Style code blocks
        code({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; className?: string }) {
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
        // Route body images through the proxy with a one-time fallback to the original source
        img({ node, src, alt, ...props }) {
          void node;
          const originalSrc = typeof src === 'string' ? src : '';
          if (!originalSrc) {
            return null;
          }

          return (
            <img
              {...props}
              src={getOptimizedImageUrl(originalSrc, IMAGE_PRESETS.hero)}
              alt={typeof alt === 'string' ? alt : ''}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="rounded-lg my-4 max-w-full h-auto"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackApplied !== 'true') {
                  img.dataset.fallbackApplied = 'true';
                  img.src = originalSrc;
                  return;
                }
                img.style.display = 'none';
              }}
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

