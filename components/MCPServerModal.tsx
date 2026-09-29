"use client";

import React, { useState, useEffect } from "react";
import { useAgentStore, MCPServerConfig } from "@/store/agentStore";
import { discoverMcpToolsApi } from "@/lib/api";
import {
  X,
  Server,
  Terminal,
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
  Search,
} from "lucide-react";

export function MCPServerModal() {
  const {
    isMcpModalOpen,
    editingMcpServerId,
    closeMcpModal,
    addMcpServerToAgent,
    updateMcpServer,
    getActiveAgent,
    backendUrl,
  } = useAgentStore();

  const activeDoc = getActiveAgent();
  const editingServer = activeDoc?.agent?.mcpServers?.find(
    (s) => s.id === editingMcpServerId,
  );

  const [name, setName] = useState("");
  const [transport, setTransport] = useState<"http" | "sse" | "stdio">("http");
  const [url, setUrl] = useState("http://localhost:8000/sse");
  const [command, setCommand] = useState("");
  const [argsText, setArgsText] = useState("");
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: "Authorization", value: "" },
  ]);
  const [enabled, setEnabled] = useState(true);

  // Live Discovery State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tools?: Array<{ name: string; description: string; inputSchema: any }>;
    latencyMs?: number;
  } | null>(null);

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolSearch, setToolSearch] = useState("");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  useEffect(() => {
    if (editingServer) {
      setName(editingServer.name || "");
      setTransport(editingServer.transport || "http");
      setUrl(editingServer.url || "http://localhost:8000/sse");
      setCommand(editingServer.command || "");
      setArgsText((editingServer.args || []).join(" "));
      setEnabled(editingServer.enabled !== false);
      const hList = Object.entries(editingServer.headers || {}).map(
        ([key, value]) => ({ key, value }),
      );
      setHeaders(hList.length > 0 ? hList : [{ key: "", value: "" }]);
      if (editingServer.discoveredTools && editingServer.discoveredTools.length > 0) {
        setTestResult({
          success: true,
          message: `Previously discovered ${editingServer.discoveredTools.length} tools.`,
          tools: editingServer.discoveredTools,
        });
        if (editingServer.selectedTools && editingServer.selectedTools.length > 0) {
          setSelectedTools(editingServer.selectedTools);
        } else if (editingServer.discoveredTools.length <= 40) {
          setSelectedTools(editingServer.discoveredTools.map((t) => t.name));
        } else {
          // Default to top 25 tools to avoid exceeding LLM 128 tools limit
          setSelectedTools(editingServer.discoveredTools.slice(0, 25).map((t) => t.name));
        }
      } else {
        setTestResult(null);
        setSelectedTools([]);
      }
    } else {
      setName("");
      setTransport("http");
      setUrl("http://localhost:8000/sse");
      setCommand("");
      setArgsText("");
      setEnabled(true);
      setHeaders([{ key: "", value: "" }]);
      setTestResult(null);
      setSelectedTools([]);
    }
    setToolSearch("");
    setExpandedTool(null);
  }, [editingServer, isMcpModalOpen]);

  if (!isMcpModalOpen) return null;

  const handleAddHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (idx: number) => {
    setHeaders(headers.filter((_, i) => i !== idx));
  };

  const handleHeaderChange = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...headers];
    updated[idx][field] = val;
    setHeaders(updated);
  };

  const getCleanHeaders = () => {
    const obj: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key.trim()) {
        obj[h.key.trim()] = h.value;
      }
    });
    return obj;
  };

  const handleTestAndDiscover = async () => {
    setIsTesting(true);
    setTestResult(null);

    const cleanHeaders = getCleanHeaders();
    const parsedArgs = argsText
      .split(" ")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await discoverMcpToolsApi(
        {
          server_id: editingMcpServerId || "test-mcp",
          name: name.trim() || "MCP Server",
          transport,
          url: transport !== "stdio" ? url.trim() : undefined,
          headers: cleanHeaders,
          command: transport === "stdio" ? command.trim() : undefined,
          args: transport === "stdio" ? parsedArgs : undefined,
          timeout: 12,
        },
        backendUrl,
      );

      const discTools = res.tools || [];
      setTestResult({
        success: true,
        message: res.message || `Discovered ${res.tool_count} tools.`,
        tools: discTools,
        latencyMs: res.latency_ms,
      });

      if (discTools.length <= 40) {
        setSelectedTools(discTools.map((t: any) => t.name));
      } else {
        // Automatically default to top 25 tools to prevent breaching Groq 128 tools limit
        setSelectedTools(discTools.slice(0, 25).map((t: any) => t.name));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect to MCP server.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleanHeaders = getCleanHeaders();
    const parsedArgs = argsText
      .split(" ")
      .map((s) => s.trim())
      .filter(Boolean);

    const serverData: Partial<MCPServerConfig> = {
      name: name.trim() || "MCP Server",
      transport,
      url: transport !== "stdio" ? url.trim() : undefined,
      headers: cleanHeaders,
      command: transport === "stdio" ? command.trim() : undefined,
      args: transport === "stdio" ? parsedArgs : undefined,
      enabled,
      discoveredTools: testResult?.tools || editingServer?.discoveredTools || [],
      selectedTools: selectedTools.length > 0 ? selectedTools : undefined,
    };

    if (editingMcpServerId) {
      updateMcpServer(editingMcpServerId, serverData);
    } else {
      addMcpServerToAgent(serverData);
    }
    closeMcpModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{editingMcpServerId ? "Edit MCP Server" : "Add MCP Server"}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold">
                  Model Context Protocol
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Connect external tool servers to expand your agent&apos;s capabilities dynamically.
              </p>
            </div>
          </div>

          <button
            onClick={closeMcpModal}
            className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Server Name & Enable toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Server Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GitHub Tools, File System, Postgres MCP"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status</label>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  enabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                  }`}
                />
                <span>{enabled ? "Active & Enabled" : "Disabled"}</span>
              </button>
            </div>
          </div>

          {/* Transport Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Protocol Transport</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransport("http")}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  transport === "http" || transport === "sse"
                    ? "bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-500/10"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>HTTP / SSE Endpoint</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Remote cloud or local daemon via Streamable HTTP/SSE.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTransport("stdio")}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  transport === "stdio"
                    ? "bg-purple-950/20 border-purple-500/50 shadow-md shadow-purple-500/10"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Stdio (Local Command)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    CLI subprocess communicating via stdin/stdout lines.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Transport Specific Config */}
          {transport !== "stdio" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Server Endpoint URL
                  </label>
                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setName("Vercel MCP");
                        setTransport("http");
                        setUrl("https://mcp.vercel.com");
                        setHeaders([{ key: "Authorization", value: "" }]);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
                    >
                      ▲ Vercel MCP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName("AgentMail MCP");
                        setTransport("http");
                        setUrl("https://api.agentmail.to/mcp");
                        setHeaders([{ key: "Authorization", value: "Bearer " }]);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      ✉️ AgentMail MCP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName("Supermetrics MCP");
                        setTransport("http");
                        setUrl("https://mcp.supermetrics.com/mcp");
                        setHeaders([{ key: "Authorization", value: "Bearer " }]);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
                    >
                      📊 Supermetrics MCP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName("Local MCP");
                        setTransport("http");
                        setUrl("http://localhost:8000/sse");
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Local SSE
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://mcp.vercel.com or http://localhost:8000/sse"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Custom Headers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    HTTP Headers / Auth Tokens
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHeader}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Header</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Authorization"
                        value={h.key}
                        onChange={(e) => handleHeaderChange(i, "key", e.target.value)}
                        className="w-1/3 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Bearer <your-token> or raw token"
                        value={h.value}
                        onChange={(e) => handleHeaderChange(i, "value", e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                      {headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHeader(i)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Command</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setName("MongoDB MCP");
                        setTransport("stdio");
                        setCommand("npx");
                        setArgsText("-y mongodb-mcp-server@latest");
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      🍃 MongoDB MCP
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="npx or python or uvx"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Arguments (space-separated)
                </label>
                <input
                  type="text"
                  value={argsText}
                  onChange={(e) => setArgsText(e.target.value)}
                  placeholder="-y @modelcontextprotocol/server-filesystem /workspace"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Test & Discover Tools Action */}
          <div className="p-4 rounded-2xl bg-purple-950/10 border border-purple-900/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Verify Connection & Discover Tools</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pings the server and queries its available JSON-RPC tools schema.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestAndDiscover}
                disabled={isTesting}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "Connecting..." : "Test & Discover"}</span>
              </button>
            </div>

            {/* Test Feedback */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex flex-col gap-2 ${
                  testResult.success
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/30 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                  {testResult.latencyMs && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 ml-auto">
                      {testResult.latencyMs}ms
                    </span>
                  )}
                </div>

                {/* Discovered Tools Selection & Filtering */}
                {testResult.tools && testResult.tools.length > 0 && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 flex-wrap">
                        <Wrench className="w-3.5 h-3.5 text-purple-400" />
                        <span>Active Tools:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            selectedTools.length > 100
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {selectedTools.length} of {testResult.tools.length} active
                        </span>
                      </div>

                      {/* Quick Selection Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!testResult.tools) return;
                            setSelectedTools(testResult.tools.map((t) => t.name));
                          }}
                          className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!testResult.tools) return;
                            setSelectedTools(testResult.tools.slice(0, 25).map((t) => t.name));
                          }}
                          className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Top 25
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTools([])}
                          className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Warning if tool selection is high */}
                    {selectedTools.length > 100 && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Groq & OpenAI enforce a maximum of 128 tools per request. Keep active tools under 100 to leave headroom for other local tools.
                        </span>
                      </div>
                    )}

                    {/* Filter search input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search discovered tools..."
                        value={toolSearch}
                        onChange={(e) => setToolSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px] focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>

                    {/* Tools list with individual checkboxes */}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {testResult.tools
                        .filter((t) => {
                          if (!toolSearch.trim()) return true;
                          const q = toolSearch.toLowerCase();
                          return (
                            t.name.toLowerCase().includes(q) ||
                            (t.description && t.description.toLowerCase().includes(q))
                          );
                        })
                        .map((t, idx) => {
                          const isExpanded = expandedTool === t.name;
                          const isChecked = selectedTools.includes(t.name);

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border text-[11px] transition-colors ${
                                isChecked
                                  ? "bg-slate-900/90 border-purple-500/40"
                                  : "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedTools(selectedTools.filter((name) => name !== t.name));
                                      } else {
                                        setSelectedTools([...selectedTools, t.name]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 bg-slate-950 border-slate-700 cursor-pointer accent-purple-600"
                                  />
                                  <span
                                    className={`font-mono font-bold truncate ${
                                      isChecked ? "text-purple-300" : "text-slate-400"
                                    }`}
                                  >
                                    {t.name}
                                  </span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => setExpandedTool(isExpanded ? null : t.name)}
                                  className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer shrink-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <div className="text-[10px] text-slate-400 mt-1 pl-5.5">
                                {t.description || "No description provided."}
                              </div>

                              {isExpanded && t.inputSchema?.properties && (
                                <div className="mt-2 ml-5.5 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                                  <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1 font-bold">
                                    Arguments Schema:
                                  </div>
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(t.inputSchema.properties, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={closeMcpModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{editingMcpServerId ? "Update Server" : "Save & Attach Server"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
