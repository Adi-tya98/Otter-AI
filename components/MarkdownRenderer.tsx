"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: any;
  isUser?: boolean;
}

/**
 * Clean, zero-dependency Markdown renderer tailored for AI chat messages.
 * Handles:
 * - Code blocks with copy-to-clipboard & language tags
 * - Inline code with syntax pill styling
 * - Headings (H1 - H4)
 * - Bullet and numbered lists
 * - Blockquotes
 * - Tables
 * - Bold, italic, strikethrough
 * - Hyperlinks with external open
 * - Raw JSON objects / arrays
 */
export function MarkdownRenderer({ content, isUser = false }: MarkdownRendererProps) {
  if (content === null || content === undefined) {
    return <span className="text-slate-500 italic">Empty response</span>;
  }

  // If content is an object, format as JSON code block
  if (typeof content === "object") {
    const jsonStr = JSON.stringify(content, null, 2);
    return <CodeBlock language="json" code={jsonStr} isUser={isUser} />;
  }

  const text = String(content);

  // Split into code blocks vs non-code blocks
  const segments = parseCodeBlocks(text);

  return (
    <div className={`space-y-2 text-xs leading-relaxed ${isUser ? "text-white" : "text-slate-200"}`}>
      {segments.map((seg, idx) => {
        if (seg.type === "code") {
          return (
            <CodeBlock
              key={idx}
              language={seg.language || "text"}
              code={seg.code}
              isUser={isUser}
            />
          );
        }
        return <TextBlock key={idx} text={seg.text} isUser={isUser} />;
      })}
    </div>
  );
}

// ----------------------------------------------------
// CODE BLOCK COMPONENT WITH COPY FUNCTIONALITY
// ----------------------------------------------------
interface CodeBlockProps {
  language: string;
  code: string;
  isUser?: boolean;
}

function CodeBlock({ language, code, isUser }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`my-2.5 rounded-xl overflow-hidden border font-mono text-[11px] shadow-md ${
        isUser
          ? "bg-slate-950/90 border-cyan-400/30 text-cyan-100"
          : "bg-slate-950 border-slate-800 text-slate-200"
      }`}
    >
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300 lowercase">
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>{language || "code"}</span>
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ----------------------------------------------------
// TEXT BLOCK & STRUCTURE PARSER
// ----------------------------------------------------
interface TextBlockProps {
  text: string;
  isUser?: boolean;
}

function TextBlock({ text, isUser }: TextBlockProps) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      index++;
      continue;
    }

    // Horizontal Rule: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <hr
          key={`hr-${index}`}
          className={`my-3 border-t ${isUser ? "border-cyan-400/30" : "border-slate-800"}`}
        />
      );
      index++;
      continue;
    }

    // Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      elements.push(renderHeading(level, content, index, isUser));
      index++;
      continue;
    }

    // Blockquote: > text
    if (line.startsWith("> ") || line === ">") {
      const quoteLines: string[] = [];
      while (index < lines.length && (lines[index].startsWith("> ") || lines[index] === ">")) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index++;
      }
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className={`my-2 pl-3 py-1 border-l-2 italic text-xs ${
            isUser
              ? "border-cyan-300 bg-cyan-900/30 text-cyan-100"
              : "border-cyan-500/80 bg-slate-900/50 text-slate-300 rounded-r"
          }`}
        >
          {quoteLines.map((ql, qidx) => (
            <p key={qidx}>{renderInline(ql, isUser)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Markdown Table: | Col | Col | ...
    if (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const tableRows: string[] = [];
      while (index < lines.length && lines[index].includes("|")) {
        tableRows.push(lines[index]);
        index++;
      }
      elements.push(renderTable(tableRows, `table-${index}`, isUser));
      continue;
    }

    // Unordered List: - item or * item
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        listItems.push(lines[index].replace(/^\s*[-*+]\s+/, ""));
        index++;
      }
      elements.push(
        <ul key={`ul-${index}`} className="my-1.5 pl-4 list-disc space-y-1">
          {listItems.map((item, lidx) => (
            <li key={lidx} className="marker:text-cyan-400">
              {renderInline(item, isUser)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List: 1. item
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        listItems.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index++;
      }
      elements.push(
        <ol key={`ol-${index}`} className="my-1.5 pl-4 list-decimal space-y-1">
          {listItems.map((item, lidx) => (
            <li key={lidx} className="marker:text-cyan-400 marker:font-mono">
              {renderInline(item, isUser)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p key={`p-${index}`} className="my-1 leading-relaxed">
        {renderInline(line, isUser)}
      </p>
    );
    index++;
  }

  return <div className="space-y-1">{elements}</div>;
}

// ----------------------------------------------------
// HELPERS & INLINE PARSER
// ----------------------------------------------------

function renderHeading(level: number, text: string, key: number, isUser?: boolean) {
  const content = renderInline(text, isUser);
  switch (level) {
    case 1:
      return (
        <h1
          key={`h1-${key}`}
          className={`text-sm font-bold mt-3 mb-1.5 pb-1 border-b ${
            isUser ? "text-white border-cyan-400/40" : "text-white border-slate-800"
          }`}
        >
          {content}
        </h1>
      );
    case 2:
      return (
        <h2
          key={`h2-${key}`}
          className={`text-xs font-bold mt-2.5 mb-1 ${isUser ? "text-white" : "text-slate-100"}`}
        >
          {content}
        </h2>
      );
    case 3:
      return (
        <h3
          key={`h3-${key}`}
          className={`text-xs font-semibold mt-2 mb-0.5 ${
            isUser ? "text-cyan-100" : "text-cyan-300"
          }`}
        >
          {content}
        </h3>
      );
    default:
      return (
        <h4
          key={`h4-${key}`}
          className={`text-[11px] font-semibold uppercase tracking-wider mt-1.5 text-slate-400`}
        >
          {content}
        </h4>
      );
  }
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(line);
}

function renderTable(rows: string[], key: string, isUser?: boolean) {
  if (rows.length < 2) return null;

  const parseRow = (rowStr: string) =>
    rowStr
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

  const headerCells = parseRow(rows[0]);
  const bodyRows = rows.slice(2).map(parseRow);

  return (
    <div key={key} className="my-2.5 overflow-x-auto rounded-xl border border-slate-800 shadow-sm">
      <table className="w-full text-[11px] border-collapse text-left">
        <thead className={isUser ? "bg-cyan-900/40 text-white" : "bg-slate-950 text-slate-300"}>
          <tr>
            {headerCells.map((cell, idx) => (
              <th
                key={idx}
                className="px-2.5 py-1.5 font-semibold border-b border-slate-800 text-cyan-300"
              >
                {renderInline(cell, isUser)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isUser ? "divide-y divide-cyan-800/30" : "divide-y divide-slate-800/70"}>
          {bodyRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className={
                rIdx % 2 === 0
                  ? isUser
                    ? "bg-transparent"
                    : "bg-slate-900/40"
                  : isUser
                  ? "bg-cyan-950/20"
                  : "bg-slate-900/80"
              }
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-2.5 py-1.5">
                  {renderInline(cell, isUser)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Parses inline formatting: code (`...`), bold/italic (***, **, *), links ([text](url))
 */
export function renderInline(text: string, isUser?: boolean): React.ReactNode {
  if (!text) return null;

  // Regex tokenizing inline elements:
  // 1. `code`
  // 2. [link text](url)
  // 3. ***bold+italic***
  // 4. **bold**
  // 5. *italic*
  // 6. ~~strikethrough~~
  const regex =
    /(`[^`]+`)|(\[[^\]]+\]\([^\)]+\))|(\*\*\*[^*]+\*\*\*)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)/g;

  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }

    const token = match[0];

    // Inline Code: `code`
    if (token.startsWith("`") && token.endsWith("`")) {
      const code = token.slice(1, -1);
      parts.push(
        <code
          key={match.index}
          className={`px-1 py-0.5 rounded font-mono text-[10.5px] border ${
            isUser
              ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-200"
              : "bg-slate-950 border-slate-700/60 text-cyan-300"
          }`}
        >
          {code}
        </code>
      );
    }
    // Markdown Link: [text](url)
    else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-medium break-all"
          >
            <span>{linkText}</span>
            <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    // Bold + Italic: ***text***
    else if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={match.index} className="font-bold italic">
          {token.slice(3, -3)}
        </strong>
      );
    }
    // Bold: **text**
    else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic: *text*
    else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Strikethrough: ~~text~~
    else if (token.startsWith("~~") && token.endsWith("~~")) {
      parts.push(
        <del key={match.index} className="line-through text-slate-500">
          {token.slice(2, -2)}
        </del>
      );
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Extracts fenced code blocks: ```lang ... ```
 */
function parseCodeBlocks(
  rawText: string
): Array<{ type: "text"; text: string } | { type: "code"; language: string; code: string }> {
  const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;
  const segments: Array<{ type: "text"; text: string } | { type: "code"; language: string; code: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: rawText.substring(lastIndex, match.index),
      });
    }

    segments.push({
      type: "code",
      language: match[1].trim() || "text",
      code: match[2].replace(/\n$/, ""),
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    segments.push({
      type: "text",
      text: rawText.substring(lastIndex),
    });
  }

  return segments;
}
