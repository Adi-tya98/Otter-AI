"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useAgentStore,
  ComponentStage,
  TriggerType,
  AVAILABLE_MODELS,
  AVAILABLE_STORAGE_OPTIONS,
} from "@/store/agentStore";
import { WorkflowActiveToggle } from "@/components/WorkflowActiveToggle";
import { WorkflowChatSidebar } from "@/components/WorkflowChatSidebar";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Bot,
  Zap,
  Layers,
  Code2,
  RefreshCw,
  ArrowRight,
  Sliders,
  Globe,
  MessageSquare,
  Send,
  Database,
  BookOpen,
  Settings2,
  Server,
  Activity,
  Check,
  ChevronDown,
} from "lucide-react";

export function InteractiveWorkflowEditor() {
  const [viewMode, setViewMode] = useState<"otter" | "spaghetti">("otter");
  const [customInputText, setCustomInputText] = useState("");
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  const {
    agents,
    activeAgentId,
    selectedComponent,
    isRunning,
    activeExecutionStage,
    executedStages,
    executionLogs,
    getActiveAgent,
    setActiveAgent,
    setSelectedComponent,
    setTriggerType,
    runSimulation,
    backendUrl,
    backendStatus,
    backendError,
    backendNodeCount,
    isCompiling,
    compiledWorkflowId,
    executionMode,
    setExecutionMode,
    checkBackendStatus,
    compileToBackend,
    executeOnBackend,
    openChatSidebar,
  } = useAgentStore();

  const activeDoc = getActiveAgent();

  // Check backend health on mount
  useEffect(() => {
    checkBackendStatus();
  }, [checkBackendStatus]);

  const handleStageClick = (stage: ComponentStage) => {
    setSelectedComponent(stage);
  };

  const handleExecuteWithPrompt = async () => {
    openChatSidebar(customInputText.trim() || undefined);
  };

  const currentModel = AVAILABLE_MODELS.find((m) => m === activeDoc.agent.model);
  const currentStorage = AVAILABLE_STORAGE_OPTIONS.find(
    (s) => s.id === activeDoc.agent.storage.storageId
  );

  return (
    <section id="demo" className="relative py-20 overflow-hidden">
      {/* Workflow Chat Sidebar */}
      <WorkflowChatSidebar />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generalized Agent Pipeline Sandbox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Configurable Tools, Tied Outputs,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-400">
              Zero Spaghetti
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Otter AI generalizes autonomous agent architecture. Select your trigger{" "}
            <strong className="text-violet-300 font-mono">(Chat / Webhook / Telegram)</strong>, attach backend tools like HTTP Requests, and outputs automatically return to the respective trigger point.
          </p>
        </div>

        {/* View Switcher: Generalized 3-Stage Pipeline vs Spaghetti Canvas */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md">
            <button
              onClick={() => setViewMode("otter")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "otter"
                  ? "bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Otter AI: Generalized 3-Stage Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode("spaghetti")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "spaghetti"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-md"
                  : "text-slate-400 hover:text-rose-300"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Traditional n8n / Zapier (Spaghetti Chaos)</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Sandbox */}
        {viewMode === "otter" ? (
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800/80 bg-slate-950/60">
              {/* Workflow Pipeline Identity */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  <span className="text-xs font-bold text-white tracking-tight">
                    {activeDoc.name.split("→")[0].trim() || activeDoc.name}
                  </span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-400">
                  <span className="text-cyan-400 font-semibold">{activeDoc.trigger.type.toUpperCase()}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-amber-400 font-semibold">{activeDoc.agent.tools.length} Tools</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-emerald-400 font-semibold">{activeDoc.output.type.toUpperCase()}</span>
                </div>
              </div>

              {/* Execution Controls & Link to Studio */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Backend Connection Status Badge */}
                <button
                  type="button"
                  onClick={() => checkBackendStatus()}
                  title="Click to re-check Python backend connectivity (http://localhost:8000)"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    backendStatus === "connected"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      : backendStatus === "checking"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      backendStatus === "connected"
                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                        : backendStatus === "checking"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  />
                  <span>
                    {backendStatus === "connected"
                      ? "FastAPI :8000"
                      : backendStatus === "checking"
                      ? "Checking..."
                      : "Backend Offline"}
                  </span>
                </button>

                {/* Active Workflow Toggle (n8n-style, compiles graph) */}
                <WorkflowActiveToggle size="sm" />

                <Link
                  href={`/docs/${activeDoc.id}`}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:border-cyan-600 transition-colors"
                >
                  <span>Studio Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={handleExecuteWithPrompt}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    isRunning
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-emerald-500/20"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing on Backend...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Test Execution</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {backendError && (
              <div className="px-6 py-2 bg-rose-950/40 border-b border-rose-900/50 flex items-center justify-between text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Compilation Error: {backendError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => useAgentStore.setState({ backendError: null })}
                  className="text-rose-400 hover:text-white font-bold ml-2 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Custom Trigger Input & Quick Execution Query Bar */}
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-slate-400 font-mono shrink-0">Trigger Input:</span>
                <input
                  type="text"
                  placeholder={
                    activeDoc.trigger.samplePayload?.message ||
                    "Ask question or type input payload..."
                  }
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExecuteWithPrompt()}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setCustomInputText("What product categories are available? Fetch them.")
                  }
                  className="px-2 py-1 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 font-mono transition-colors"
                >
                  Demo Query
                </button>
                <div className="text-[11px] font-mono text-emerald-400">
                  Target: {activeDoc.output.type}
                </div>
              </div>
            </div>

            {/* Backend Offline Guidance Alert if needed */}
            {backendStatus === "offline" && (
              <div className="px-6 py-2 bg-amber-950/30 border-b border-amber-900/40 flex items-center justify-between text-[11px] text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Backend at <code className="font-mono text-white">{backendUrl}</code> is offline. Start backend server:{" "}
                    <code className="bg-amber-950/60 px-1 py-0.5 rounded font-mono text-amber-200">
                      python3 -m uvicorn app.main:app
                    </code>{" "}
                    for live Groq execution.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => checkBackendStatus()}
                  className="text-amber-200 underline hover:text-white font-semibold cursor-pointer shrink-0 ml-2"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Workspace: 3 Cards Left + Inspector Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Column: The 3 Pipeline Cards (7 cols) */}
              <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-dots-pattern">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{activeDoc.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeDoc.description}</p>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    Generalized Pipeline
                  </span>
                </div>

                {/* 3 Component Stack */}
                <div className="space-y-4 relative">
                  {/* 1. TRIGGER COMPONENT */}
                  <div className="relative">
                    <div
                      onClick={() => handleStageClick("trigger")}
                      className={`relative z-10 p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                        selectedComponent === "trigger"
                          ? "bg-slate-800/90 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                          : "bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-mono">
                            1
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${activeDoc.trigger.badgeColor}`}>
                                {activeDoc.trigger.app}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">Stage 1: Inbound Trigger</span>
                            </div>
                            <h4 className="text-sm font-semibold text-white mt-1">
                              {activeDoc.trigger.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{activeDoc.trigger.subtitle}</p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {executedStages.includes("trigger") ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>200 OK</span>
                            </div>
                          ) : activeExecutionStage === "trigger" ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Receiving...</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-800/40">
                              Ready
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inputs mapped */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500 text-[11px]">Inputs mapped:</span>
                        {Object.keys(activeDoc.trigger.samplePayload).map((key) => (
                          <span
                            key={key}
                            className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] font-mono hover:border-cyan-500/50 transition-colors"
                          >
                            @{key}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Connecting Line 1 to 2 */}
                    <div className="flex justify-center -my-2 relative z-0">
                      <div
                        className={`w-0.5 h-6 transition-colors duration-500 ${
                          executedStages.includes("trigger")
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : "bg-slate-700/60"
                        }`}
                      />
                    </div>
                  </div>

                  {/* 2. AI AGENT CORE & TOOLS COMPONENT */}
                  <div className="relative">
                    <div
                      onClick={() => handleStageClick("agent")}
                      className={`relative z-10 p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                        selectedComponent === "agent"
                          ? "bg-slate-800/90 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
                          : "bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border bg-amber-500/10 border-amber-500/30 text-amber-400 font-mono">
                            2
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                                {currentModel || activeDoc.agent.model}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">Stage 2: Model & Tools</span>
                            </div>
                            <h4 className="text-sm font-semibold text-white mt-1">
                              {activeDoc.agent.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{activeDoc.agent.subtitle}</p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {executedStages.includes("agent") ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reasoned</span>
                            </div>
                          ) : activeExecutionStage === "agent" || activeExecutionStage === "tool_call" ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>
                                {activeExecutionStage === "tool_call" ? "Calling Tools..." : "Thinking..."}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-800/40">
                              Ready
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Configured Tools Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500 text-[11px]">Configured Tools ({activeDoc.agent.tools.length}):</span>
                        {activeDoc.agent.tools.map((t) => (
                          <span
                            key={t.instanceId}
                            className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-cyan-300 text-[11px] font-mono flex items-center gap-1"
                          >
                            <span>✦</span>
                            <span>{t.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Connecting Line 2 to 3 */}
                    <div className="flex justify-center -my-2 relative z-0">
                      <div
                        className={`w-0.5 h-6 transition-colors duration-500 ${
                          executedStages.includes("agent")
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : "bg-slate-700/60"
                        }`}
                      />
                    </div>
                  </div>

                  {/* 3. TIED OUTPUT ACTION COMPONENT */}
                  <div className="relative">
                    <div
                      onClick={() => handleStageClick("output")}
                      className={`relative z-10 p-4 sm:p-5 rounded-xl border transition-all cursor-pointer ${
                        selectedComponent === "output"
                          ? "bg-slate-800/90 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                          : "bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono">
                            3
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${activeDoc.output.badgeColor}`}>
                                {activeDoc.output.type}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">Stage 3: Tied Output</span>
                            </div>
                            <h4 className="text-sm font-semibold text-white mt-1">
                              {activeDoc.output.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{activeDoc.output.subtitle}</p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {executedStages.includes("output") ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Delivered</span>
                            </div>
                          ) : activeExecutionStage === "output" ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Delivering...</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-800/40">
                              Ready
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Target */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Bound directly to @{activeDoc.output.targetTrigger}</span>
                        <span className="text-emerald-400">Zero routing errors</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Assurance */}
                <div className="mt-6 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/30 flex items-center gap-2.5 text-xs text-cyan-200/90">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Generalized Architecture:</strong> Triggers support Chat, Webhook, or Telegram. Tools (like HTTP requests) execute dynamically, and responses return strictly to the caller.
                  </span>
                </div>
              </div>

              {/* Right Column: Node Inspector & Live Data (5 cols) */}
              <div className="lg:col-span-5 p-6 bg-slate-950/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <h4 className="text-sm font-bold text-white capitalize">
                        Stage Config: {selectedComponent}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedComponent === "trigger" ? "1 of 3" : selectedComponent === "agent" ? "2 of 3" : "3 of 3"}
                    </span>
                  </div>

                  {/* Component Specific Settings Display */}
                  <div className="mt-4 space-y-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Active Parameters
                    </h5>

                    {selectedComponent === "trigger" && (
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[11px] mb-0.5">Trigger Channel</div>
                          <div className="text-slate-200 font-mono">{activeDoc.trigger.app} ({activeDoc.trigger.type})</div>
                        </div>
                        {activeDoc.trigger.webhookEndpoint && (
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400 text-[11px] mb-0.5">Inbound Endpoint</div>
                            <div className="text-cyan-300 font-mono text-[11px] truncate">{activeDoc.trigger.webhookEndpoint}</div>
                          </div>
                        )}
                        {activeDoc.trigger.chatSettings && (
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400 text-[11px] mb-0.5">Chat Welcome Note</div>
                            <div className="text-slate-300 text-[11px] truncate">{activeDoc.trigger.chatSettings.welcomeMessage}</div>
                          </div>
                        )}
                        {activeDoc.trigger.telegramSettings && (
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400 text-[11px] mb-0.5">Telegram Bot</div>
                            <div className="text-blue-400 font-mono text-[11px] truncate">{activeDoc.trigger.telegramSettings.botUsername}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedComponent === "agent" && (
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[11px] mb-0.5">Intelligence Model & Storage</div>
                          <div className="text-slate-200 font-mono">
                            {currentModel || activeDoc.agent.model} + {currentStorage?.name || "Session Memory"}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[11px] mb-0.5">Configured Tools (like n8n)</div>
                          <div className="space-y-1">
                            {activeDoc.agent.tools.map((t) => (
                              <div key={t.instanceId} className="text-cyan-300 font-mono text-[11px] flex items-center justify-between">
                                <span>✦ {t.name}</span>
                                <span className="text-slate-500">{t.toolId}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[11px] mb-0.5">System Prompt</div>
                          <div className="text-slate-300 font-mono text-[11px] line-clamp-2">{activeDoc.agent.systemPrompt}</div>
                        </div>
                      </div>
                    )}

                    {selectedComponent === "output" && (
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[11px] mb-0.5">Return Channel</div>
                          <div className="text-emerald-300 font-mono">{activeDoc.output.title}</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[11px] mb-0.5">Originating Trigger Point</div>
                          <div className="text-slate-200 font-mono">@{activeDoc.output.targetTrigger}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sample Live Output Payload */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {selectedComponent === "trigger"
                            ? "Sample Inbound Data"
                            : selectedComponent === "agent"
                            ? "AI Inference Response"
                            : "Return Delivery Sample"}
                        </span>
                      </h5>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Auto-Valid
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1.5 shadow-inner max-h-44 overflow-y-auto">
                      {Object.entries(
                        selectedComponent === "trigger"
                          ? activeDoc.trigger.samplePayload
                          : selectedComponent === "agent"
                          ? activeDoc.agent.sampleOutput
                          : activeDoc.output.sampleResult
                      ).map(([key, val]) => (
                        <div key={key} className="flex items-start justify-between gap-2">
                          <span className="text-cyan-400 font-semibold shrink-0">@{key}:</span>
                          <span className="text-slate-300 text-right truncate">{JSON.stringify(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Open Full Studio Button */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
                  <Link
                    href={`/docs/${activeDoc.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    <span>Open in Full Studio Canvas</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Spaghetti Canvas View */
          <div className="rounded-2xl bg-slate-950 border-2 border-rose-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-rose-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              The Spaghetti Hell
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    What building this looks like in traditional workflow builders
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    23 nodes, 8 JavaScript snippets, 4 JSON schema transformations, and 1 random syntax error that halts your business.
                  </p>
                </div>
              </div>

              {/* Tangled Mockup */}
              <div className="relative p-6 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs overflow-hidden">
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 50,40 C 150,150 200,-20 350,100 C 450,220 550,20 700,120"
                    stroke="#F43F5E"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 120,180 C 250,50 380,250 500,80 C 600,-30 750,180 850,90"
                    stroke="#EAB308"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                  <div className="p-3 bg-slate-950 border border-rose-500/60 rounded-lg text-rose-300">
                    <div className="text-[10px] text-rose-400 font-bold">Webhook 1</div>
                    <div className="text-[11px] truncate">Raw Webhook Listener</div>
                    <div className="text-[9px] text-slate-500 mt-1">Status: Listening</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                    <div className="text-[10px] text-amber-400 font-bold">FunctionItem</div>
                    <div className="text-[11px] truncate">JSON.parse(data[0])</div>
                    <div className="text-[9px] text-slate-500 mt-1">42 lines of JS</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-rose-500/80 rounded-lg text-rose-200 bg-rose-950/20">
                    <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                      <span>Set Node 3</span>
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                    </div>
                    <div className="text-[10px] text-rose-400 truncate">
                      TypeError: Cannot read body
                    </div>
                    <div className="text-[9px] text-rose-500 mt-1">CRASHED</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                    <div className="text-[10px] text-cyan-400 font-bold">HTTP Request</div>
                    <div className="text-[11px] truncate">Bearer {`{{$env.TOKEN}}`}</div>
                    <div className="text-[9px] text-slate-500 mt-1">OAuth Expired</div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                  <strong>Console Error:</strong>{" "}
                  <code>
                    ExpressionError: Can't get property 'customer' of undefined in
                    &#123;&#123;$node["HTTP_Req"].json["data"]["attributes"][0]&#125;&#125;
                  </code>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setViewMode("otter")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Switch back to Otter AI Generalized Pipeline</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
