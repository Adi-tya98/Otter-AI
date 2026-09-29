"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useAgentStore,
  AVAILABLE_TOOLS,
  ConfiguredTool,
  AvailableTool,
} from "@/store/agentStore";

function getToolDocsSlug(toolId: string): string {
  const map: Record<string, string> = {
    notion_page: "notion",
    discord_webhook: "discord",
    http_request: "node_http_request",
    resend: "resend_email",
    jina: "jina_reader",
    forty_two_min: "42min",
    seven_todos: "7todos",
  };
  return map[toolId] || toolId;
}
import {
  X,
  Play,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Globe,
  Database,
  BookOpen,
  Code2,
  Compass,
  Calculator,
  RefreshCw,
  ExternalLink,
  Info,
  ShieldCheck,
  Coins,
  Mail,
  Search,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  Megaphone,
  Kanban,
  Table,
  Send,
  CheckSquare,
  Bot,
  Clock,
  ListTodo,
} from "lucide-react";

export const NOTION_RESOURCES = [
  { id: "page", label: "Page", icon: "📄", desc: "Create, retrieve, update or archive pages" },
  { id: "database_page", label: "Database Page", icon: "📋", desc: "Create rows with column properties, update or query" },
  { id: "block", label: "Block", icon: "🧱", desc: "Append children, get as markdown, or delete blocks" },
  { id: "database", label: "Database", icon: "🗄️", desc: "Retrieve database schema or query records" },
  { id: "data_source", label: "Data Source", icon: "🔍", desc: "Search across pages and databases in workspace" },
  { id: "custom_api_call", label: "Custom API Call", icon: "⚡", desc: "Send custom HTTP requests to Notion API" },
];

export const NOTION_OPERATIONS: Record<string, { id: string; label: string; desc: string; defaultPrompt: string }[]> = {
  page: [
    { id: "create", label: "Create Subpage", desc: "Create a new subpage with title, icon, and markdown body", defaultPrompt: "Create a formatted subpage in Notion with a title, emoji icon, and structured Markdown body." },
    { id: "get", label: "Get Page", desc: "Retrieve page metadata and properties", defaultPrompt: "Retrieve details and properties of a specific Notion page." },
    { id: "update", label: "Update Page", desc: "Update page title or icon", defaultPrompt: "Update the title or icon of an existing Notion page." },
    { id: "archive", label: "Archive Page", desc: "Archive or delete a Notion page", defaultPrompt: "Archive (delete) a specific Notion page." },
  ],
  database_page: [
    { id: "create", label: "Create Row", desc: "Create a new row in a database with column properties & body", defaultPrompt: "Create a new row entry in a Notion database with custom column properties and body content." },
    { id: "update", label: "Update Properties", desc: "Update column properties of a database row", defaultPrompt: "Update column properties (e.g. Status, Priority) of a database entry in Notion." },
    { id: "get", label: "Get Row", desc: "Retrieve a specific database page row", defaultPrompt: "Retrieve column values and details of a database entry row in Notion." },
    { id: "archive", label: "Archive Row", desc: "Archive or remove a database entry row", defaultPrompt: "Archive (delete) a specific row from a Notion database." },
  ],
  block: [
    { id: "append_after", label: "Append After", desc: "Append formatted Markdown blocks to a page or block", defaultPrompt: "Append formatted Markdown content as child blocks to a specified Notion block or page." },
    { id: "get_markdown", label: "Get as Markdown", desc: "Fetch block children and convert to clean Markdown", defaultPrompt: "Fetch the content of a Notion block or page and parse it into clean Markdown text." },
    { id: "get_many", label: "Get Many Blocks", desc: "Fetch raw block children list with pagination", defaultPrompt: "Fetch child block items from a Notion block or page." },
    { id: "delete", label: "Delete Block", desc: "Delete / archive a specific Notion block", defaultPrompt: "Delete or archive a specific block in Notion." },
  ],
  database: [
    { id: "get", label: "Get Schema", desc: "Retrieve database column definitions & metadata", defaultPrompt: "Retrieve the schema, column definitions, and metadata of a Notion database." },
    { id: "query", label: "Query Rows", desc: "Search and filter rows in a database", defaultPrompt: "Query and filter records within a Notion database." },
  ],
  data_source: [
    { id: "search", label: "Search Workspace", desc: "Search titles and text across the entire workspace", defaultPrompt: "Search across all pages and databases in the Notion workspace by keyword query." },
  ],
  custom_api_call: [
    { id: "custom_call", label: "Custom REST Request", desc: "Direct HTTP call to any Notion API endpoint", defaultPrompt: "Execute an arbitrary Notion REST API call with custom endpoint and payload." },
  ],
};

export function ToolConfigModal() {
  const {
    configuringToolInstanceId,
    closeToolConfig,
    getActiveAgent,
    updateToolConfigValues,
    getAvailableToolById,
  } = useAgentStore();

  const activeDoc = getActiveAgent();
  const configuredTool = activeDoc.agent.tools.find(
    (t) => t.instanceId === configuringToolInstanceId
  );

  const toolDef = configuredTool
    ? getAvailableToolById(configuredTool.toolId) ||
      AVAILABLE_TOOLS.find((t) => t.id === configuredTool.toolId)
    : undefined;

  const [toolName, setToolName] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<Record<string, any> | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (configuredTool) {
      setToolName(configuredTool.name);
      setFormData({ ...(configuredTool.config || {}) });
      setTestResult(null);
    }
  }, [configuredTool]);

  if (!configuringToolInstanceId || !configuredTool || !toolDef) {
    return null;
  }

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotionResourceChange = (resId: string) => {
    const defaultOp = NOTION_OPERATIONS[resId]?.[0]?.id || "get";
    const defaultPrompt = NOTION_OPERATIONS[resId]?.[0]?.defaultPrompt || "";
    setFormData((prev) => ({
      ...prev,
      resource: resId,
      operation: defaultOp,
      tool_desc: defaultPrompt,
    }));
  };

  const handleNotionOperationChange = (opId: string) => {
    const currentRes = formData.resource || "page";
    const opDef = NOTION_OPERATIONS[currentRes]?.find((o) => o.id === opId);
    setFormData((prev) => ({
      ...prev,
      operation: opId,
      tool_desc: opDef?.defaultPrompt || prev.tool_desc,
    }));
  };

  // Helper for key-value array fields (headers, queryParams)
  const handleKeyValueChange = (
    fieldKey: string,
    index: number,
    keyOrVal: "key" | "value",
    val: string
  ) => {
    const currentList: { key: string; value: string }[] = [
      ...(formData[fieldKey] || []),
    ];
    if (currentList[index]) {
      currentList[index] = { ...currentList[index], [keyOrVal]: val };
      handleFieldChange(fieldKey, currentList);
    }
  };

  const addKeyValueRow = (fieldKey: string) => {
    const currentList: { key: string; value: string }[] = [
      ...(formData[fieldKey] || []),
    ];
    currentList.push({ key: "", value: "" });
    handleFieldChange(fieldKey, currentList);
  };

  const removeKeyValueRow = (fieldKey: string, index: number) => {
    const currentList: { key: string; value: string }[] = [
      ...(formData[fieldKey] || []),
    ];
    currentList.splice(index, 1);
    handleFieldChange(fieldKey, currentList);
  };

  const handleSave = () => {
    updateToolConfigValues(configuredTool.instanceId, {
      name: toolName.trim() || toolDef.name,
      config: formData,
    });
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      closeToolConfig();
    }, 400);
  };

  const handleTestRun = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if ((toolDef.id === "http_request" || toolDef.id === "node_http_request") && formData.url) {
        let testUrl = formData.url;
        if (testUrl.includes("crm.example.com") || testUrl.includes("@trigger")) {
          testUrl = "https://dummyjson.com/products/category-list";
        }
        const method = formData.method || "GET";
        const res = await fetch(testUrl, {
          method,
          headers: Array.isArray(formData.headers)
            ? Object.fromEntries(formData.headers.filter((h: any) => h.key).map((h: any) => [h.key, h.value]))
            : undefined,
        });
        const contentType = res.headers.get("content-type") || "";
        let data: any;
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          data = await res.text();
        }
        setTestResult({
          status: res.status,
          statusText: res.statusText,
          url: testUrl,
          data: typeof data === "object" ? data : data.substring(0, 400),
        });
      } else if (toolDef.id === "notion_page" || toolDef.id === "notion") {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const res = formData.resource || "page";
        const op = formData.operation || "create";
        let mockData: any = {};
        if (res === "block") {
          if (op === "get_markdown") {
            mockData = {
              markdown: "# Sample Notion Document\n\n- [x] Initial design review\n- [ ] Deploy staging pipeline\n\n> 💡 All systems operational.",
              blocks_count: 8,
              status: "Successfully converted blocks to Markdown"
            };
          } else if (op === "append_after") {
            mockData = {
              blocks_appended: 3,
              target_block_id: formData.block_id || "9a38f192-3b4a-4e89-b2c3-9840218fa201",
              status: "Successfully appended blocks to target"
            };
          } else {
            mockData = { count: 4, status: `Operation '${op}' executed for block` };
          }
        } else if (res === "database_page") {
          mockData = {
            page_id: "row_8392104",
            database_id: formData.database_id || "db_roadmap_123",
            title: "Task: Implement Search Filter",
            url: "https://notion.so/row_8392104",
            status: `Database page ${op} executed successfully`
          };
        } else if (res === "data_source") {
          mockData = {
            query: formData.search_query || "roadmap",
            results_count: 3,
            results: [
              { object: "page", title: "Engineering Roadmap 2026", url: "https://notion.so/page_1" },
              { object: "database", title: "Customer Success Tasks", url: "https://notion.so/db_1" },
            ]
          };
        } else {
          mockData = {
            resource: res,
            operation: op,
            page_id: "page_98214",
            url: "https://notion.so/page_98214",
            status: `Notion ${res} ${op} executed successfully.`
          };
        }
        setTestResult({
          status: 200,
          statusText: "Success (Preview)",
          resource: res,
          operation: op,
          data: mockData,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setTestResult(toolDef.sampleExecutionOutput);
      }
    } catch {
      setTestResult({
        status: 200,
        statusText: "Simulated Output",
        data: toolDef.sampleExecutionOutput,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Variable injection into inputs
  const insertVariableIntoField = (fieldKey: string, varName: string) => {
    const currentVal = formData[fieldKey] || "";
    handleFieldChange(fieldKey, `${currentVal} @trigger.${varName}`);
  };

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "Globe":
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case "Database":
        return <Database className="w-5 h-5 text-indigo-400" />;
      case "BookOpen":
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case "Code2":
        return <Code2 className="w-5 h-5 text-amber-400" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-purple-400" />;
      case "Calculator":
        return <Calculator className="w-5 h-5 text-pink-400" />;
      case "Coins":
        return <Coins className="w-5 h-5 text-amber-400" />;
      case "Mail":
        return <Mail className="w-5 h-5 text-rose-400" />;
      case "Search":
        return <Search className="w-5 h-5 text-sky-400" />;
      case "MessageSquare":
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case "Megaphone":
        return <Megaphone className="w-5 h-5 text-fuchsia-400" />;
      case "Kanban":
        return <Kanban className="w-5 h-5 text-blue-400" />;
      case "Table":
        return <Table className="w-5 h-5 text-teal-400" />;
      case "Send":
        return <Send className="w-5 h-5 text-emerald-400" />;
      case "CheckSquare":
        return <CheckSquare className="w-5 h-5 text-violet-400" />;
      case "Bot":
        return <Bot className="w-5 h-5 text-orange-400" />;
      case "Clock":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "ListTodo":
        return <ListTodo className="w-5 h-5 text-lime-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header (n8n Node Config style) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {getToolIcon(toolDef.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="bg-transparent font-bold text-white text-base focus:outline-none focus:bg-slate-800/80 px-2 py-0.5 -ml-2 rounded border border-transparent focus:border-cyan-500/50"
                  placeholder="Tool Name..."
                />
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {toolDef.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{toolDef.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/docs?slug=tools/${getToolDocsSlug(toolDef.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all group"
              title="Open documentation & API key guide"
            >
              <BookOpen className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-cyan-400" />
              <span>Tool Docs</span>
              <ExternalLink className="w-3 h-3 text-cyan-400/80" />
            </Link>

            <button
              onClick={closeToolConfig}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Parameters (like n8n node parameters) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Documentation Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Need setup instructions or an API key for <strong className="text-white">{toolDef.name}</strong>?
              </span>
            </div>
            <Link
              href={`/docs?slug=tools/${getToolDocsSlug(toolDef.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 flex items-center gap-1 shrink-0"
            >
              <span>View Setup & Credentials Guide</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Quick Info & Trigger Payload Variables */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Available trigger variables can be referenced via{" "}
                <code className="text-cyan-300 font-mono">@trigger.[field]</code>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.keys(activeDoc.trigger.samplePayload).slice(0, 4).map((k) => (
                <span
                  key={k}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700"
                >
                  @{k}
                </span>
              ))}
            </div>
          </div>

          {/* Render Tool-Specific Form Fields */}
          {toolDef.id === "notion_page" || toolDef.id === "notion" ? (
            <div className="space-y-6">
              {/* 1. Notion API Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Notion Integration Token <span className="text-rose-400">*</span>
                  </label>
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Secret Token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={formData.api_key || ""}
                  placeholder="secret_... or ntn_... or env:NOTION_API_KEY"
                  onChange={(e) => handleFieldChange("api_key", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 2. PAIRED DYNAMIC SELECTORS (Resource & Operation) */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dynamic Selector 1: Resource */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Resource</span>
                        <span className="text-rose-400">*</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Entity</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.resource || "page"}
                        onChange={(e) => handleNotionResourceChange(e.target.value)}
                        className="w-full appearance-none bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 cursor-pointer pr-10 shadow-inner"
                      >
                        {NOTION_RESOURCES.map((r) => (
                          <option key={r.id} value={r.id} className="bg-slate-900 text-white py-1">
                            {r.icon} {r.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Selector 2: Operation (strictly filtered by Resource) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Operation</span>
                        <span className="text-rose-400">*</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {(NOTION_OPERATIONS[formData.resource || "page"] || []).length} available
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.operation || (NOTION_OPERATIONS[formData.resource || "page"]?.[0]?.id || "create")}
                        onChange={(e) => handleNotionOperationChange(e.target.value)}
                        className="w-full appearance-none bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer pr-10 shadow-inner"
                      >
                        {(NOTION_OPERATIONS[formData.resource || "page"] || []).map((op) => (
                          <option key={op.id} value={op.id} className="bg-slate-900 text-emerald-300 py-1">
                            {op.label} — {op.desc}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Flow Breadcrumb & Action Explanation */}
                {(() => {
                  const currentRes = formData.resource || "page";
                  const currentOp = formData.operation || (NOTION_OPERATIONS[currentRes]?.[0]?.id || "create");
                  const resDef = NOTION_RESOURCES.find((r) => r.id === currentRes) || NOTION_RESOURCES[0];
                  const opDef = NOTION_OPERATIONS[currentRes]?.find((o) => o.id === currentOp) || NOTION_OPERATIONS[currentRes]?.[0];
                  return (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono text-[11px] border border-cyan-500/30 flex items-center gap-1">
                          <span>{resDef.icon}</span>
                          <span className="font-semibold">{resDef.label}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[11px] border border-emerald-500/30 font-semibold">
                          {opDef?.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {opDef?.desc}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* 4. Contextual Parameters Group */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Operation Parameters &amp; Targets
                </h5>

                {/* Target Parent Page ID (for page.create) */}
                {(formData.resource || "page") === "page" && (formData.operation || "create") === "create" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Parent Page ID / URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="32-char UUID or full Notion URL (https://notion.so/...)"
                      value={formData.parent_id || ""}
                      onChange={(e) => handleFieldChange("parent_id", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500">Destination parent page under which new subpages are placed.</p>
                  </div>
                )}

                {/* Target Page ID (for page.get, page.update, page.archive, or database_page.update, get, archive) */}
                {(((formData.resource || "page") === "page" && ["get", "update", "archive"].includes(formData.operation || "")) ||
                  ((formData.resource || "page") === "database_page" && ["update", "get", "archive"].includes(formData.operation || ""))) && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Page ID / URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="32-char UUID or full Notion URL (https://notion.so/...)"
                      value={formData.page_id || ""}
                      onChange={(e) => handleFieldChange("page_id", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500">The specific page to {formData.operation || "target"}.</p>
                  </div>
                )}

                {/* Target Database ID (for database_page.create, database.get, database.query) */}
                {(((formData.resource || "page") === "database_page" && (formData.operation || "create") === "create") ||
                  (formData.resource || "page") === "database") && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Database ID / URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="32-char UUID or full Notion Database URL"
                      value={formData.database_id || ""}
                      onChange={(e) => handleFieldChange("database_id", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500">Target Notion Database for records or queries.</p>
                  </div>
                )}

                {/* Target Block ID (for block operations) */}
                {(formData.resource || "page") === "block" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Block or Page ID / URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="32-char UUID or full Notion URL"
                      value={formData.block_id || ""}
                      onChange={(e) => handleFieldChange("block_id", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      {(formData.operation || "") === "get_markdown"
                        ? "Children of this block or page will be fetched and converted into clean Markdown for the AI agent."
                        : "Target block to execute the block operation against."}
                    </p>
                  </div>
                )}

                {/* Properties JSON (for database_page create/update) */}
                {(formData.resource || "page") === "database_page" && ["create", "update"].includes(formData.operation || "") && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Default Column Properties JSON (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder='{"Status": "In Progress", "Priority": "High"}'
                      value={typeof formData.properties_json === "object" ? JSON.stringify(formData.properties_json, null, 2) : formData.properties_json || ""}
                      onChange={(e) => handleFieldChange("properties_json", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500">Fixed column defaults. The AI agent can also dynamically supply custom properties.</p>
                  </div>
                )}

                {/* Search Parameters (for data_source.search) */}
                {(formData.resource || "page") === "data_source" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Default Search Query (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. roadmap or leave blank for dynamic query"
                        value={formData.search_query || ""}
                        onChange={(e) => handleFieldChange("search_query", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Filter Object Type
                      </label>
                      <div className="flex gap-1.5">
                        {[
                          { val: "all", label: "All" },
                          { val: "page", label: "Pages" },
                          { val: "database", label: "Databases" },
                        ].map((f) => (
                          <button
                            key={f.val}
                            type="button"
                            onClick={() => handleFieldChange("filter_type", f.val)}
                            className={`flex-1 py-1.5 text-xs rounded-lg font-medium border transition-colors ${
                              (formData.filter_type || "all") === f.val
                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-200"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom API Call Parameters */}
                {(formData.resource || "page") === "custom_api_call" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">HTTP Method</label>
                        <div className="flex gap-1">
                          {["GET", "POST", "PATCH", "DELETE"].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleFieldChange("custom_method", m)}
                              className={`flex-1 py-1 text-xs font-mono font-semibold rounded-lg border ${
                                (formData.custom_method || "GET") === m
                                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-200"
                                  : "bg-slate-900 border-slate-800 text-slate-400"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">Endpoint Path</label>
                        <input
                          type="text"
                          placeholder="/v1/users or /v1/blocks/{id}/children"
                          value={formData.custom_endpoint || "/v1/users"}
                          onChange={(e) => handleFieldChange("custom_endpoint", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">JSON Request Body (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder='{"page_size": 10}'
                        value={typeof formData.custom_body === "object" ? JSON.stringify(formData.custom_body, null, 2) : formData.custom_body || ""}
                        onChange={(e) => handleFieldChange("custom_body", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Tool Description for AI Agent */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tool Description for AI Agent <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentRes = formData.resource || "page";
                      const currentOp = formData.operation || "create";
                      const opDef = NOTION_OPERATIONS[currentRes]?.find((o) => o.id === currentOp);
                      if (opDef?.defaultPrompt) {
                        handleFieldChange("tool_desc", opDef.defaultPrompt);
                      }
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Reset to Recommended</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={formData.tool_desc || ""}
                  onChange={(e) => handleFieldChange("tool_desc", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500">
                  Guides the LLM on when and why to invoke this Notion operation during the workflow.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {toolDef.fields.map((field) => {
                const val = formData[field.key] !== undefined ? formData[field.key] : field.defaultValue;

                // 1. SELECT FIELD (Method, Engine, AuthType, etc.)
                if (field.type === "select" && field.options) {
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {field.options.map((opt: any) => {
                          const optVal = typeof opt === "string" ? opt : opt.value;
                          const optLabel = typeof opt === "string" ? opt : opt.label;
                          const isSelected = val === optVal;
                          const isMethod = field.key === "method";
                          const methodColor =
                            optVal === "GET"
                              ? "border-emerald-500/50 text-emerald-300 bg-emerald-500/20"
                              : optVal === "POST"
                              ? "border-cyan-500/50 text-cyan-300 bg-cyan-500/20"
                              : optVal === "PUT" || optVal === "PATCH"
                              ? "border-amber-500/50 text-amber-300 bg-amber-500/20"
                              : "border-rose-500/50 text-rose-300 bg-rose-500/20";

                          return (
                            <button
                              key={optVal}
                              type="button"
                              onClick={() => handleFieldChange(field.key, optVal)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? isMethod
                                    ? methodColor
                                    : "bg-cyan-500/20 border border-cyan-500/60 text-cyan-200 shadow-sm"
                                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {optLabel}
                            </button>
                          );
                        })}
                      </div>
                      {field.description && (
                        <p className="text-[11px] text-slate-500">{field.description}</p>
                      )}
                    </div>
                  );
                }

                // 2. TEXT FIELD (URL, Auth Token, Index Name, etc.)
                if (field.type === "text") {
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300">
                          {field.label} {field.required && <span className="text-rose-400">*</span>}
                        </label>
                        {field.key === "url" && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-500">Inject:</span>
                            {Object.keys(activeDoc.trigger.samplePayload).slice(0, 2).map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => insertVariableIntoField("url", k)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 text-[10px] font-mono border border-slate-700"
                              >
                                + @trigger.{k}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={val || ""}
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                      {field.description && (
                        <p className="text-[11px] text-slate-500">{field.description}</p>
                      )}
                    </div>
                  );
                }

                // 3. TEXTAREA / JSON / SCRIPT FIELD
                if (field.type === "textarea" || field.type === "json") {
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300">
                          {field.label} {field.required && <span className="text-rose-400">*</span>}
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">
                          Plaintext / JSON / Expressions
                        </span>
                      </div>
                      <textarea
                        rows={field.key === "script" || field.key === "body" ? 5 : 3}
                        value={val || ""}
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                      />
                      {field.description && (
                        <p className="text-[11px] text-slate-500">{field.description}</p>
                      )}
                    </div>
                  );
                }

                // 4. KEY-VALUE LIST (Headers, Query Parameters like n8n)
                if (field.type === "key-value" || (field.type as string) === "key-value-list") {
                  const list: { key: string; value: string }[] = Array.isArray(val) ? val : [];
                  return (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-300">
                          {field.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => addKeyValueRow(field.key)}
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Field</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {list.length === 0 ? (
                          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 text-[11px] text-slate-500 text-center">
                            No {field.label.toLowerCase()} configured. Click "Add Field" to attach key-value pairs.
                          </div>
                        ) : (
                          list.map((row, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Name / Header Key"
                                value={row.key}
                                onChange={(e) =>
                                  handleKeyValueChange(field.key, idx, "key", e.target.value)
                                }
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                              />
                              <input
                                type="text"
                                placeholder="Value (e.g. application/json)"
                                value={row.value}
                                onChange={(e) =>
                                  handleKeyValueChange(field.key, idx, "value", e.target.value)
                                }
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeKeyValueRow(field.key, idx)}
                                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                }

                // 5. NUMBER FIELD (Timeout, TopK, MaxRows)
                if (field.type === "number") {
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        value={val !== undefined ? val : ""}
                        onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
                        className="w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                      {field.description && (
                        <p className="text-[11px] text-slate-500">{field.description}</p>
                      )}
                    </div>
                  );
                }

                // 6. BOOLEAN TOGGLE
                if (field.type === "boolean") {
                  return (
                    <div key={field.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{field.label}</div>
                        {field.description && (
                          <div className="text-[11px] text-slate-500">{field.description}</div>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={!!val}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* Test Step Node Section (like n8n "Test step" button) */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  <span>Dry Run / Test Tool Call</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Simulate executing this tool with current parameters and inspect sample response.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestRun}
                disabled={isTesting}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Request...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Tool Step</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-48 shadow-inner animate-in fade-in duration-150">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Simulated Output Response:</span>
                  <span className="text-slate-500">200 OK</span>
                </div>
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={closeToolConfig}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {savedToast && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
