"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
} from "lucide-react";

interface DocsMarkdownRendererProps {
  content: string;
}

/**
 * Enterprise documentation Markdown renderer supporting:
 * - Fenced code blocks with language tags & copy-to-clipboard
 * - GitHub-style callouts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
 * - Markdown tables with styled headers & borders
 * - Headings H1 to H4 with visual accents
 * - Ordered & unordered lists with nested formatting
 * - Bold, italic, strikethrough, inline code pills, and external links
 */
export function DocsMarkdownRenderer({ content }: DocsMarkdownRendererProps) {
  if (!content) {
    return <div className="text-slate-500 italic">No content available.</div>;
  }

  const rawBlocks = splitIntoMarkdownBlocks(content);

  return (
    <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-sans">
      {rawBlocks.map((block, idx) => (
        <MarkdownBlockRenderer key={idx} block={block} blockIndex={idx} />
      ))}
    </div>
  );
}

// ----------------------------------------------------
// BLOCK PARSER
// ----------------------------------------------------

type BlockType =
  | { type: "code"; language: string; code: string }
  | { type: "callout"; alertType: "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION"; text: string }
  | { type: "table"; rows: string[] }
  | { type: "heading"; level: number; text: string }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string };

function splitIntoMarkdownBlocks(rawText: string): BlockType[] {
  const blocks: BlockType[] = [];
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Fenced Code Block: ```lang ... ```
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // Skip closing ```
      blocks.push({
        type: "code",
        language: lang,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // 2. Callout Block: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
    if (trimmed.startsWith("> [!")) {
      const match = trimmed.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      const alertType = (match ? match[1].toUpperCase() : "NOTE") as
        | "NOTE"
        | "TIP"
        | "IMPORTANT"
        | "WARNING"
        | "CAUTION";
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        calloutLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "callout",
        alertType,
        text: calloutLines.join("\n").trim(),
      });
      continue;
    }

    // 3. Regular Blockquote (single or multi-line without [!ALERT])
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "callout",
        alertType: "NOTE",
        text: quoteLines.join("\n").trim(),
      });
      continue;
    }

    // 4. Horizontal Rule: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // 5. Headings: #, ##, ###, ####, #####, ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 6. Markdown Table: lines containing | with a delimiter row
    if (trimmed.startsWith("|") && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push({
        type: "table",
        rows: tableLines,
      });
      continue;
    }

    // 7. Unordered List: - item or * item
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && (/^\s*[-*+]\s+/.test(lines[i]) || (lines[i].startsWith("  ") && listItems.length > 0))) {
        if (/^\s*[-*+]\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        } else {
          // Multiline or sub-bullet item append
          listItems[listItems.length - 1] += "\n" + lines[i].trim();
        }
        i++;
      }
      blocks.push({
        type: "list",
        ordered: false,
        items: listItems,
      });
      continue;
    }

    // 8. Ordered List: 1. item
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && (/^\s*\d+\.\s+/.test(lines[i]) || (lines[i].startsWith("  ") && listItems.length > 0))) {
        if (/^\s*\d+\.\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        } else {
          listItems[listItems.length - 1] += "\n" + lines[i].trim();
        }
        i++;
      }
      blocks.push({
        type: "list",
        ordered: true,
        items: listItems,
      });
      continue;
    }

    // 9. Regular Paragraph
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !(lines[i].trim().startsWith("|") && i + 1 < lines.length && isTableDelimiter(lines[i + 1]))
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    blocks.push({
      type: "paragraph",
      text: paraLines.join(" "),
    });
  }

  return blocks;
}

function isTableDelimiter(line: string): boolean {
  return /^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$/.test(line);
}

// ----------------------------------------------------
// BLOCK RENDERER COMPONENT
// ----------------------------------------------------

function MarkdownBlockRenderer({
  block,
  blockIndex,
}: {
  block: BlockType;
  blockIndex: number;
}) {
  switch (block.type) {
    case "code":
      return <DocsCodeBlock language={block.language} code={block.code} />;

    case "callout":
      return <DocsCallout alertType={block.alertType} text={block.text} />;

    case "table":
      return <DocsTable rows={block.rows} />;

    case "heading":
      return <DocsHeading level={block.level} text={block.text} />;

    case "hr":
      return <hr className="my-6 border-t border-slate-800" />;

    case "list":
      if (block.ordered) {
        return (
          <ol className="my-3 pl-5 list-decimal space-y-2 text-slate-300 marker:text-cyan-400 marker:font-mono">
            {block.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineDocs(item)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="my-3 pl-5 list-disc space-y-2 text-slate-300 marker:text-cyan-400">
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineDocs(item)}
            </li>
          ))}
        </ul>
      );

    case "paragraph":
      return (
        <p className="my-2 text-slate-300 leading-relaxed text-sm">
          {renderInlineDocs(block.text)}
        </p>
      );

    default:
      return null;
  }
}

// ----------------------------------------------------
// HEADINGS
// ----------------------------------------------------

function DocsHeading({ level, text }: { level: number; text: string }) {
  const content = renderInlineDocs(text);
  switch (level) {
    case 1:
      return (
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-2 pb-2 border-b border-slate-800 flex items-center gap-2">
          <span>{content}</span>
        </h1>
      );
    case 2:
      return (
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight pt-6 pb-2 border-b border-slate-800/80 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span>{content}</span>
        </h2>
      );
    case 3:
      return (
        <h3 className="text-base font-semibold text-cyan-200 pt-4 pb-1 flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-xs">#</span>
          <span>{content}</span>
        </h3>
      );
    case 4:
      return (
        <h4 className="text-sm font-semibold text-slate-200 pt-3 pb-0.5">
          {content}
        </h4>
      );
    default:
      return (
        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2">
          {content}
        </h5>
      );
  }
}

// ----------------------------------------------------
// CALLOUT BOXES
// ----------------------------------------------------

function DocsCallout({
  alertType,
  text,
}: {
  alertType: "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";
  text: string;
}) {
  const styles = {
    NOTE: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-950/20",
      titleColor: "text-cyan-300",
      icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
    },
    TIP: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-950/20",
      titleColor: "text-emerald-300",
      icon: <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />,
    },
    IMPORTANT: {
      border: "border-purple-500/30",
      bg: "bg-purple-950/20",
      titleColor: "text-purple-300",
      icon: <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />,
    },
    WARNING: {
      border: "border-amber-500/30",
      bg: "bg-amber-950/20",
      titleColor: "text-amber-300",
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    },
    CAUTION: {
      border: "border-rose-500/30",
      bg: "bg-rose-950/20",
      titleColor: "text-rose-300",
      icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />,
    },
  }[alertType] || {
    border: "border-slate-700",
    bg: "bg-slate-900",
    titleColor: "text-slate-300",
    icon: <Info className="w-4 h-4 text-slate-400 shrink-0" />,
  };

  return (
    <div
      className={`my-4 p-4 rounded-xl border ${styles.border} ${styles.bg} shadow-lg`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {styles.icon}
        <span className={`text-[11px] font-bold uppercase tracking-wider ${styles.titleColor}`}>
          {alertType}
        </span>
      </div>
      <div className="text-xs text-slate-300 leading-relaxed pl-6 space-y-1">
        {text.split("\n").map((line, lIdx) => (
          <p key={lIdx}>{renderInlineDocs(line)}</p>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// CODE BLOCK WITH COPY BUTTON
// ----------------------------------------------------

function DocsCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#060911] shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-2 uppercase font-semibold text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language || "code"}</span>
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-sans"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ----------------------------------------------------
// TABLES
// ----------------------------------------------------

function DocsTable({ rows }: { rows: string[] }) {
  if (rows.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

  const headers = parseRow(rows[0]);
  const dataRows = rows.slice(2).map(parseRow);

  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 shadow-xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-200 font-semibold uppercase tracking-wider text-[10.5px]">
          <tr>
            {headers.map((h, hIdx) => (
              <th key={hIdx} className="px-4 py-3">
                {renderInlineDocs(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {dataRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              className={
                rIdx % 2 === 0
                  ? "bg-transparent hover:bg-slate-900/40 transition-colors"
                  : "bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
              }
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5 whitespace-pre-wrap">
                  {renderInlineDocs(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------
// INLINE FORMATTING PARSER
// ----------------------------------------------------

/**
 * Parses inline Markdown elements:
 * - `code`
 * - [link](url)
 * - ***bold+italic***
 * - **bold**
 * - *italic*
 * - ~~strikethrough~~
 */
export function renderInlineDocs(text: string): React.ReactNode {
  if (!text) return null;

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
          className="px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] bg-slate-900 border border-slate-700/80 text-cyan-300"
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
        const isExternal = linkUrl.startsWith("http");

        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-medium"
          >
            <span>{linkText}</span>
            {isExternal && <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />}
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    // Bold + Italic: ***text***
    else if (token.startsWith("***") && token.endsWith("***")) {
      parts.push(
        <strong key={match.index} className="font-bold italic text-white">
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
        <em key={match.index} className="italic text-slate-200">
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
