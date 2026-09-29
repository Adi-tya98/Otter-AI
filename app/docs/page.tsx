"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchDocsNavigation, fetchDocContent } from "@/lib/api";
import { DocsMarkdownRenderer } from "@/components/DocsMarkdownRenderer";
import {
  Sparkles,
  Search,
  BookOpen,
  Cpu,
  Zap,
  ArrowRight,
  Terminal,
  Database,
  BarChart3,
  Mail,
  MessageSquare,
  Globe,
  Coins,
  Boxes,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Layers,
  Sliders,
  AlertCircle,
  HelpCircle,
  Menu,
  X,
  FileText,
  Code,
  Shield,
  Clock,
  Megaphone,
  Kanban,
  Table,
  Send,
  CheckSquare,
  Bot,
  ListTodo,
} from "lucide-react";

// ============================================================================
// FALLBACK OFFLINE NAVIGATION & DEFAULT DOCUMENT
// ============================================================================

const FALLBACK_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      { slug: "agent-setup", title: "Agent Setup & Architecture", badge: "Essential", icon: "Cpu" },
      { slug: "triggers", title: "Triggers & Event Listeners", badge: "Core", icon: "Zap" },
      { slug: "outputs", title: "Outputs & Threaded Continuity", badge: "Core", icon: "ArrowRight" },
      { slug: "mcp-servers", title: "Model Context Protocol (MCP)", badge: "Enterprise", icon: "Terminal" },
    ],
  },
  {
    id: "tools-catalog",
    title: "Tools Reference & Integrations",
    items: [
      { slug: "tools/supermetrics", title: "Supermetrics Marketing", badge: "100+ Ad Sources", icon: "BarChart3" },
      { slug: "tools/mongodb", title: "MongoDB & Atlas", badge: "Database & Atlas", icon: "Database" },
      { slug: "tools/agentmail", title: "AgentMail Inbound/Outbound", badge: "agentmail.to", icon: "Mail" },
      { slug: "tools/mautic", title: "Mautic Marketing", badge: "Marketing Cloud", icon: "Megaphone" },
      { slug: "tools/jira", title: "Jira Software", badge: "Issue Tracker", icon: "Kanban" },
      { slug: "tools/airtable", title: "Airtable Relational DB", badge: "No-Code DB", icon: "Table" },
      { slug: "tools/sendgrid", title: "SendGrid Email Engine", badge: "Email API", icon: "Send" },
      { slug: "tools/clickup", title: "ClickUp Tasks", badge: "Productivity", icon: "CheckSquare" },
      { slug: "tools/todoist", title: "Todoist Task Manager", badge: "Task Manager", icon: "CheckSquare" },
      { slug: "tools/apify", title: "Apify Web Scraping", badge: "Web Scraping", icon: "Bot" },
      { slug: "tools/aimfox", title: "Aimfox LinkedIn Outreach", badge: "B2B Outreach", icon: "Send" },
      { slug: "tools/42min", title: "42min Meeting AI", badge: "Meeting AI", icon: "Clock" },
      { slug: "tools/wekan", title: "Wekan Kanban Board", badge: "Open Source", icon: "Kanban" },
      { slug: "tools/7todos", title: "7todos Weekly Focus", badge: "Weekly Planner", icon: "ListTodo" },
      { slug: "tools/notion", title: "Notion Workspace", badge: "Granular Blocks", icon: "Boxes" },
      { slug: "tools/discord", title: "Discord Integration", badge: "Bot & Webhooks", icon: "MessageSquare" },
      { slug: "tools/telegram", title: "Telegram Bot", badge: "Community Chat", icon: "MessageSquare" },
      { slug: "tools/node_http_request", title: "HTTP Request", badge: "Rest API", icon: "Globe" },
      { slug: "tools/web_search", title: "Live Web Search", badge: "DuckDuckGo", icon: "Search" },
      { slug: "tools/jina_reader", title: "Jina AI Reader", badge: "Web Scraper", icon: "Cpu" },
      { slug: "tools/currency_converter", title: "Currency Converter", badge: "Live FX Rates", icon: "Coins" },
      { slug: "tools/json_transform", title: "JSON Transform", badge: "Data Schema", icon: "Code" },
      { slug: "tools/resend_email", title: "Resend Email", badge: "Transactional", icon: "Mail" },
    ],
  },
];

interface DocDetail {
  status: string;
  type: "guide" | "tool";
  slug: string;
  tool_id?: string;
  title: string;
  category: string;
  badge?: string;
  icon?: string;
  description?: string;
  content_markdown: string;
  parameters_schema?: any[];
  operations?: any[];
  sample_output?: any;
}

// Helper to choose Lucide icon
function getIconComponent(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case "barchart3":
      return <BarChart3 className="w-4 h-4" />;
    case "database":
      return <Database className="w-4 h-4" />;
    case "mail":
      return <Mail className="w-4 h-4" />;
    case "boxes":
      return <Boxes className="w-4 h-4" />;
    case "messagesquare":
      return <MessageSquare className="w-4 h-4" />;
    case "globe":
      return <Globe className="w-4 h-4" />;
    case "search":
      return <Search className="w-4 h-4" />;
    case "coins":
      return <Coins className="w-4 h-4" />;
    case "code":
      return <Code className="w-4 h-4" />;
    case "terminal":
      return <Terminal className="w-4 h-4" />;
    case "zap":
      return <Zap className="w-4 h-4" />;
    case "cpu":
      return <Cpu className="w-4 h-4" />;
    case "megaphone":
      return <Megaphone className="w-4 h-4" />;
    case "kanban":
      return <Kanban className="w-4 h-4" />;
    case "table":
      return <Table className="w-4 h-4" />;
    case "send":
      return <Send className="w-4 h-4" />;
    case "checksquare":
      return <CheckSquare className="w-4 h-4" />;
    case "bot":
      return <Bot className="w-4 h-4" />;
    case "clock":
      return <Clock className="w-4 h-4" />;
    case "listtodo":
      return <ListTodo className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
}

function ParameterBreakdownSection({ parameters }: { parameters?: any[] }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!parameters || parameters.length === 0) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4 my-8 p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Interactive Input Field Guide & Parameters
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          {parameters.length} Fields
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-1">
        {parameters.map((p, idx) => {
          const key = p.key || `param-${idx}`;
          const isRequired = !!p.required;
          const defaultValue =
            p.defaultValue !== undefined && p.defaultValue !== ""
              ? String(p.defaultValue)
              : null;

          return (
            <div
              key={key}
              className="p-4 rounded-xl bg-[#090d16] border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                    {p.key}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {p.label || p.name || p.key}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {p.type || "string"}
                  </span>
                  {isRequired ? (
                    <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 font-semibold">
                      Required
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700">
                      Optional
                    </span>
                  )}
                </div>
              </div>

              {/* Purpose */}
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="text-slate-400 font-medium">Purpose: </span>
                <span>
                  {p.purpose ||
                    p.description ||
                    "Parameter input for tool execution."}
                </span>
              </div>

              {/* Where to find / Format row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                {p.where_to_find && (
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Where to Find
                    </span>
                    <span className="text-slate-300">{p.where_to_find}</span>
                  </div>
                )}
                {p.format_notes && (
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                      Syntax & Format
                    </span>
                    <span className="font-mono text-cyan-300">
                      {p.format_notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Example and default value */}
              {(p.example || defaultValue) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  {p.example && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">
                        Example:
                      </span>
                      <code className="text-cyan-200 font-mono text-[10.5px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {p.example}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.example, key)}
                        className="text-slate-400 hover:text-white p-0.5 transition-colors"
                        title="Copy example"
                      >
                        {copiedKey === key ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                  {defaultValue && (
                    <div className="text-slate-500 text-[10px]">
                      Default:{" "}
                      <code className="text-slate-400 font-mono">
                        {defaultValue}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CLIENT COMPONENT WITH SEARCH PARAMS SUSPENSE
// ============================================================================

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] text-white flex items-center justify-center font-sans">
          <div className="flex items-center gap-3 text-cyan-400 text-sm font-semibold">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>Loading Documentation Portal...</span>
          </div>
        </div>
      }
    >
      <DocsPortalInner />
    </Suspense>
  );
}

function DocsPortalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active slug in URL (defaults to "agent-setup")
  const activeSlug = searchParams.get("slug") || "agent-setup";

  // Navigation data
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active doc state
  const [docDetail, setDocDetail] = useState<DocDetail | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Load navigation on mount
  useEffect(() => {
    let isMounted = true;
    fetchDocsNavigation()
      .then((data) => {
        if (isMounted && data?.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        // Fallback to static offline catalog gracefully
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load active document content when activeSlug changes
  useEffect(() => {
    let isMounted = true;
    setLoadingDoc(true);
    setErrorMsg(null);

    fetchDocContent(activeSlug)
      .then((data) => {
        if (isMounted) {
          setDocDetail(data as DocDetail);
          setLoadingDoc(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err.message || "Failed to load document content.");
          setLoadingDoc(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSlug]);

  // Navigate to a document slug
  const handleSelectSlug = (slug: string) => {
    router.push(`/docs?slug=${encodeURIComponent(slug)}`);
    setMobileMenuOpen(false);
  };

  // Filter categories and items based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();

    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item: any) =>
            item.title.toLowerCase().includes(q) ||
            item.slug.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Navbar />

      <div className="flex-1 pt-20 flex">
        {/* =============================================================== */}
        {/* LEFT SIDEBAR NAVIGATION (Desktop) */}
        {/* =============================================================== */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-slate-800/80 bg-[#060911]/90 backdrop-blur-xl shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
          {/* Search Header */}
          <div className="p-4 border-b border-slate-800/80 sticky top-0 bg-[#060911]/95 backdrop-blur-md z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides & tools..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Categorized List */}
          <div className="p-4 space-y-6 flex-1">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center justify-between">
                  <span>{cat.title}</span>
                  <span className="text-[9px] font-mono text-slate-600">{cat.items.length}</span>
                </h4>

                <div className="space-y-0.5">
                  {cat.items.map((item: any) => {
                    const isActive = activeSlug === item.slug || activeSlug === `tools/${item.slug}`;
                    return (
                      <button
                        key={item.slug}
                        onClick={() => handleSelectSlug(item.slug)}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10"
                            : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={isActive ? "text-cyan-400" : "text-slate-500"}>
                            {getIconComponent(item.icon)}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 ${
                              isActive
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-slate-800/80 text-slate-400 border border-slate-700/60"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer Link */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Open Workflow Studio</span>
            </Link>
          </div>
        </aside>

        {/* =============================================================== */}
        {/* MOBILE SIDEBAR DRAWER */}
        {/* =============================================================== */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-3.5 rounded-full bg-cyan-500 text-slate-950 shadow-xl shadow-cyan-500/30 flex items-center gap-2 font-bold text-xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Docs Navigation</span>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex">
            <div className="w-80 bg-[#060911] h-full border-r border-slate-800 p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">Documentation</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter list */}
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {cat.title}
                    </h5>
                    {cat.items.map((item: any) => (
                      <button
                        key={item.slug}
                        onClick={() => handleSelectSlug(item.slug)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                      >
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* =============================================================== */}
        {/* MAIN DOCUMENTATION CONTENT */}
        {/* =============================================================== */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {loadingDoc ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <h3 className="text-sm font-semibold text-white">Loading Document</h3>
              <p className="text-xs text-slate-400 mt-1">Fetching live schema from backend documentation engine...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-left">
              <AlertCircle className="w-6 h-6 text-rose-400 mb-2" />
              <h3 className="text-sm font-bold text-white">Document Not Found</h3>
              <p className="text-xs text-rose-300 mt-1">{errorMsg}</p>
              <button
                onClick={() => handleSelectSlug("agent-setup")}
                className="mt-4 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                Return to Agent Setup Guide
              </button>
            </div>
          ) : docDetail ? (
            <div className="space-y-8">
              {/* Breadcrumb & Action Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Link href="/docs" className="hover:text-cyan-400 transition-colors">
                    Docs
                  </Link>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="text-slate-400">{docDetail.category}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="text-cyan-300 font-semibold">{docDetail.title}</span>
                </div>

                {/* Quick Action: Configure in Studio */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Configure in Studio</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                  </Link>
                </div>
              </div>

              {/* Document Markdown Content */}
              <DocsMarkdownRenderer content={docDetail.content_markdown} />

              {/* Interactive Parameter Guide (if tool has parameters) */}
              {docDetail.type === "tool" &&
                docDetail.parameters_schema &&
                docDetail.parameters_schema.length > 0 && (
                  <ParameterBreakdownSection
                    parameters={docDetail.parameters_schema}
                  />
                )}

              {/* Bottom Navigation */}
              <div className="pt-8 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
                <Link
                  href="/usecases"
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Explore Real-World Use Cases</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>Build Workflow in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <Footer />
    </div>
  );
}
