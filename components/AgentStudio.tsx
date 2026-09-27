"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useAgentStore,
  ComponentStage,
  TriggerType,
  AVAILABLE_MODELS,
  AVAILABLE_STORAGE_OPTIONS,
  AVAILABLE_TOOLS,
} from "@/store/agentStore";
import {
  getDiscordTriggerStatus,
  simulateDiscordTrigger,
  getTelegramTriggerStatus,
  simulateTelegramTrigger,
} from "@/lib/api";
import { ToolConfigModal } from "@/components/ToolConfigModal";
import { AddToolModal } from "@/components/AddToolModal";
import { WorkflowChatSidebar } from "@/components/WorkflowChatSidebar";
import { OtterLogo } from "@/components/OtterLogo";
import { WorkflowActiveToggle } from "@/components/WorkflowActiveToggle";
import {
  ArrowLeft,
  Play,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Bot,
  Zap,
  MessageSquare,
  Globe,
  Terminal,
  Settings2,
  Copy,
  Check,
  Send,
  Database,
  Layers,
  BookOpen,
  Code2,
  Compass,
  Calculator,
  Plus,
  Trash2,
  Sliders,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  Info,
  AlertCircle,
  Coins,
  Mail,
  Search,
  Hash,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  X,
} from "lucide-react";

interface AgentStudioProps {
  initialDocId?: string;
}

export function AgentStudio({ initialDocId }: AgentStudioProps) {
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
    updateMetadata,
    updateTrigger,
    updateAgent,
    updateOutput,
    openAddToolModal,
    openToolConfig,
    toggleToolStatus,
    removeToolFromAgent,
    selectModel,
    selectStorage,
    createAgent,
    runSimulation,
    resetSimulation,
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
    availableTools,
    openChatSidebar,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    isLoadingWorkflow,
    loadWorkflowFromBackend,
    saveWorkflowToBackend,
    deploymentInfo,
    loadDeploymentInfo,
    regenerateApiKey,
    setExecutionStorage,
    setExecutionLogStorage,
    storedExecutions,
    isLoadingExecutions,
    loadStoredExecutions,
    clearStoredExecutions,
  } = useAgentStore();

  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedDiscordUrl, setCopiedDiscordUrl] = useState(false);
  const [copiedTelegramUrl, setCopiedTelegramUrl] = useState(false);
  const [copiedPublicChat, setCopiedPublicChat] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [confirmClearExecutions, setConfirmClearExecutions] = useState(false);
  const [isClearingExecutions, setIsClearingExecutions] = useState(false);
  const [activeTab, setActiveTab] = useState<ComponentStage | "logs" | "storage">("agent");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  // Check backend health on mount
  useEffect(() => {
    checkBackendStatus();
  }, [checkBackendStatus]);

  // Load workflow from backend database when initialDocId is provided
  useEffect(() => {
    if (initialDocId) {
      loadWorkflowFromBackend(initialDocId);
    }
  }, [initialDocId, loadWorkflowFromBackend]);

  const activeDoc = getActiveAgent();

  // Debounced auto-save hook to persist all changes to PostgreSQL
  useEffect(() => {
    if (!hasUnsavedChanges || !activeDoc || isLoadingWorkflow || isSaving)
      return;
    const timer = setTimeout(() => {
      saveWorkflowToBackend(activeDoc.id);
    }, 10000);
    return () => clearTimeout(timer);
  }, [
    hasUnsavedChanges,
    activeDoc,
    isLoadingWorkflow,
    isSaving,
    saveWorkflowToBackend,
  ]);

  const [discordListening, setDiscordListening] = useState(false);
  const [discordSimulateLoading, setDiscordSimulateLoading] = useState(false);
  const [discordStatusMsg, setDiscordStatusMsg] = useState<string | null>(null);
  const [discordSimulateInput, setDiscordSimulateInput] = useState("");

  useEffect(() => {
    if (!activeDoc || activeDoc.trigger.type !== "discord") return;
    let isMounted = true;
    getDiscordTriggerStatus(activeDoc.id, backendUrl)
      .then((res) => {
        if (isMounted) setDiscordListening(Boolean(res?.is_running));
      })
      .catch(() => {
        if (isMounted) setDiscordListening(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeDoc?.id, activeDoc?.trigger?.type, activeDoc?.status, backendUrl]);

  const handleSimulateDiscordMessage = async () => {
    if (!activeDoc) return;
    setDiscordSimulateLoading(true);
    setDiscordStatusMsg(null);
    try {
      const msg =
        discordSimulateInput.trim() ||
        activeDoc.trigger.samplePayload?.content ||
        activeDoc.trigger.samplePayload?.message ||
        "/ask What is the status of the cluster?";
      await simulateDiscordTrigger(
        activeDoc.id,
        msg,
        "simulated-channel",
        "DiscordUser#1337",
        backendUrl,
      );
      setDiscordStatusMsg(`Simulated message dispatched: "${msg}"`);
      await executeOnBackend(msg);
    } catch (err: any) {
      setDiscordStatusMsg(`Simulation error: ${err.message || String(err)}`);
    } finally {
      setDiscordSimulateLoading(false);
    }
  };

  const [telegramActive, setTelegramActive] = useState(false);
  const [telegramSimulateLoading, setTelegramSimulateLoading] = useState(false);
  const [telegramStatusMsg, setTelegramStatusMsg] = useState<string | null>(
    null,
  );
  const [telegramSimulateInput, setTelegramSimulateInput] = useState("");

  useEffect(() => {
    if (!activeDoc || activeDoc.trigger.type !== "telegram") return;
    let isMounted = true;
    getTelegramTriggerStatus(activeDoc.id, backendUrl)
      .then((res) => {
        if (isMounted) setTelegramActive(Boolean(res.is_active));
      })
      .catch(() => {
        if (isMounted) setTelegramActive(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeDoc?.id, activeDoc?.trigger?.type, activeDoc?.status, backendUrl]);

  const handleSimulateTelegramMessage = async () => {
    if (!activeDoc) return;
    setTelegramSimulateLoading(true);
    setTelegramStatusMsg(null);
    try {
      const text =
        telegramSimulateInput.trim() ||
        activeDoc.trigger.samplePayload?.command ||
        activeDoc.trigger.samplePayload?.message ||
        "/status cluster-prod";
      await simulateTelegramTrigger(
        activeDoc.id,
        text,
        "12345678",
        "TelegramUser",
        backendUrl,
      );
      setTelegramStatusMsg(`Simulated Telegram message dispatched: "${text}"`);
      await executeOnBackend(text);
    } catch (err: any) {
      setTelegramStatusMsg(`Simulation error: ${err.message || String(err)}`);
    } finally {
      setTelegramSimulateLoading(false);
    }
  };

  useEffect(() => {
    setTitleInput(activeDoc.name);
  }, [activeDoc.id, activeDoc.name]);

  useEffect(() => {
    if (activeTab !== "logs" && activeTab !== "storage") {
      setSelectedComponent(activeTab as ComponentStage);
    }
  }, [activeTab, setSelectedComponent]);

  const handleSelectComponent = (comp: ComponentStage) => {
    setSelectedComponent(comp);
    setActiveTab(comp);
  };

  // Automatically load deployment details from PostgreSQL when workflow is active
  useEffect(() => {
    if (activeDoc?.id && activeDoc.status === "active") {
      loadDeploymentInfo(activeDoc.id);
    }
  }, [activeDoc?.id, activeDoc?.status, loadDeploymentInfo]);

  const webhookFullUrl = activeDoc
    ? `${backendUrl}/api/v1/deployments/webhook/${activeDoc.id}`
    : "";

  const publicChatFullUrl =
    typeof window !== "undefined" && activeDoc
      ? `${window.location.origin}/chat/${activeDoc.id}`
      : activeDoc
        ? `/chat/${activeDoc.id}`
        : "";

  const handleCopyWebhookUrl = () => {
    if (typeof navigator !== "undefined" && webhookFullUrl) {
      navigator.clipboard.writeText(webhookFullUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  const handleCopyApiKey = () => {
    const key = deploymentInfo?.api_key || activeDoc.trigger.webhookSecret;
    if (typeof navigator !== "undefined" && key) {
      navigator.clipboard.writeText(key);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const handleCopyPublicChat = () => {
    if (typeof navigator !== "undefined" && publicChatFullUrl) {
      navigator.clipboard.writeText(publicChatFullUrl);
      setCopiedPublicChat(true);
      setTimeout(() => setCopiedPublicChat(false), 2000);
    }
  };

  const handleRegenerateKey = async () => {
    if (!activeDoc) return;
    setIsRegeneratingKey(true);
    try {
      const newKey = await regenerateApiKey(activeDoc.id);
      if (newKey) {
        updateTrigger({ webhookSecret: newKey });
      }
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const handleCopyEndpoint = () => {
    const target = webhookFullUrl || activeDoc.trigger.webhookEndpoint;
    if (typeof navigator !== "undefined" && target) {
      navigator.clipboard.writeText(target);
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
  };

  const handleTitleSubmit = () => {
    if (titleInput.trim() && activeDoc) {
      updateMetadata({ name: titleInput.trim() });
      saveWorkflowToBackend(activeDoc.id);
    }
    setIsEditingTitle(false);
  };

  // Helper to insert a variable tag into prompt
  const insertVariableIntoPrompt = (varTag: string) => {
    updateAgent({
      systemPrompt: `${activeDoc.agent.systemPrompt} @trigger.${varTag}`,
    });
  };

  // Helper to get tool icon
  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "Globe":
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case "Database":
        return <Database className="w-4 h-4 text-indigo-400" />;
      case "BookOpen":
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case "Code2":
        return <Code2 className="w-4 h-4 text-amber-400" />;
      case "Compass":
        return <Compass className="w-4 h-4 text-purple-400" />;
      case "Calculator":
        return <Calculator className="w-4 h-4 text-pink-400" />;
      case "Coins":
        return <Coins className="w-4 h-4 text-amber-400" />;
      case "Mail":
        return <Mail className="w-4 h-4 text-rose-400" />;
      case "Search":
        return <Search className="w-4 h-4 text-sky-400" />;
      case "MessageSquare":
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  if (!activeDoc) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-white">
          Loading Workflow from Database...
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Restoring agent configuration & graph state
        </p>
      </div>
    );
  }

  const currentModelDef = AVAILABLE_MODELS.find(
    (m: string) => m === activeDoc.agent.model,
  );
  const currentStorageDef = AVAILABLE_STORAGE_OPTIONS.find(
    (s) => s.id === activeDoc.agent.storage.storageId,
  );

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Tool Configuration Modal & Add Tool Modal */}
      <ToolConfigModal />
      <AddToolModal />
      <WorkflowChatSidebar />

      {/* Webhook cURL & Code Integration Modal */}
      {showCurlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCurlModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Webhook API Integration
                  </h3>
                  <p className="text-xs text-slate-400">
                    Trigger this workflow from external services, scripts, or apps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCurlModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 my-5">
              {/* Endpoint */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  HTTP POST Endpoint
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookFullUrl}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 select-all"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-medium rounded-xl text-slate-200 shrink-0 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedWebhook ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedWebhook ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Authentication Secret Key
                  </label>
                  <button
                    onClick={handleRegenerateKey}
                    disabled={isRegeneratingKey}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isRegeneratingKey ? "animate-spin" : ""}`}
                    />
                    <span>Regenerate Key</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      deploymentInfo?.api_key ||
                      activeDoc.trigger.webhookSecret ||
                      "Will be auto-generated when made active"
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 select-all"
                  />
                  <button
                    onClick={handleCopyApiKey}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-medium rounded-xl text-slate-200 shrink-0 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedApiKey ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedApiKey ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* cURL Example Code Block */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  cURL Example
                </label>
                <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre>{`curl -X POST "${webhookFullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${deploymentInfo?.api_key || activeDoc.trigger.webhookSecret || "YOUR_SECRET_KEY"}" \\
  -d '{"message": "Hello agent, process this request"}'`}</pre>
                </div>
              </div>

              {/* Python Example */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Python (requests)
                </label>
                <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300/90 overflow-x-auto">
                  <pre>{`import requests

url = "${webhookFullUrl}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${deploymentInfo?.api_key || activeDoc.trigger.webhookSecret || "YOUR_SECRET_KEY"}"
}
payload = {"message": "Hello agent"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCurlModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Studio Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 shrink-0" />

          <Link href="/" className="shrink-0">
            <OtterLogo
              size={22}
              textClassName="text-sm font-bold tracking-tight text-white hidden md:inline"
            />
          </Link>

          <div className="h-4 w-px bg-slate-800 shrink-0 hidden md:block" />

          {/* Editable Agent Document Title */}
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
                autoFocus
                className="bg-slate-900 border border-cyan-500/50 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-cyan-300 transition-colors truncate text-left"
                title="Click to rename agent"
              >
                <span className="truncate max-w-55 sm:max-w-md">
                  {activeDoc.name}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ✎
                </span>
              </button>
            )}

            {/* Status Badge */}
            <span
              className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                activeDoc.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-800/80 text-slate-400 border-slate-750"
              }`}
            >
              {activeDoc.status === "active" ? "● Live Active" : "○ Draft"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Backend Connection Status Badge */}
          <button
            type="button"
            onClick={() => checkBackendStatus()}
            title="Click to check FastAPI backend connectivity (http://localhost:8000)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
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

          {/* Save to PostgreSQL Status & Action */}
          <button
            onClick={() => saveWorkflowToBackend(activeDoc.id)}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              hasUnsavedChanges
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title={
              lastSavedAt
                ? `Saved to PostgreSQL at ${lastSavedAt}`
                : "Save workflow configurations to PostgreSQL"
            }
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">Save to DB</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            )}
          </button>

          {/* Active Workflow Toggle (n8n-style, compiles graph) */}
          <WorkflowActiveToggle size="md" />

          {/* Test Execution Button */}
          {activeDoc.status === "active" && (
            <button
              onClick={() => openChatSidebar(customPrompt.trim() || undefined)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer bg-linear-to-r from-emerald-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-emerald-500/20"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Run Agent</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Syncing with PostgreSQL Banner */}
      {isLoadingWorkflow && (
        <div className="bg-cyan-950/60 border-b border-cyan-800/40 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-cyan-300 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>
            Synchronizing workflow configurations with PostgreSQL database...
          </span>
        </div>
      )}

      {/* 🚀 Active Deployment Action & End-User Access Bar */}
      {activeDoc.status === "active" && (
        <div className="bg-[#070b16] border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
          {activeDoc.trigger.type === "chat" ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px] shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Chat Deployed & Live
                </span>
                <span className="text-slate-400 shrink-0 font-medium">Public End-User Link:</span>
                <code className="text-emerald-300 font-mono text-xs truncate bg-black/50 px-2.5 py-1 rounded-lg border border-emerald-500/20 max-w-xs sm:max-w-md select-all">
                  {publicChatFullUrl}
                </code>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPublicChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  {copiedPublicChat ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedPublicChat ? "Link Copied" : "Copy Link"}</span>
                </button>
                <a
                  href={`/chat/${activeDoc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-sm shadow-emerald-500/20"
                >
                  <span>Open End-User Chat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : activeDoc.trigger.type === "webhook" ? (
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold text-[11px] shrink-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Webhook Deployed
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                  POST
                </span>
                <code className="text-cyan-300 font-mono text-xs truncate bg-black/50 px-2.5 py-1 rounded-lg border border-cyan-500/20 max-w-[220px] sm:max-w-sm select-all">
                  {webhookFullUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  title="Copy Webhook Endpoint URL"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {(deploymentInfo?.api_key || activeDoc.trigger.webhookSecret) && (
                  <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
                    <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      Key:
                    </span>
                    <code className="text-amber-300 font-mono text-xs bg-black/50 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      {showApiKey
                        ? (deploymentInfo?.api_key || activeDoc.trigger.webhookSecret)
                        : `${(deploymentInfo?.api_key || activeDoc.trigger.webhookSecret || "").slice(0, 14)}••••••`}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      title={showApiKey ? "Hide key" : "Show key"}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyApiKey}
                      title="Copy Secret API Key"
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {copiedApiKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCurlModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>cURL & Code Snippet</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  disabled={isRegeneratingKey}
                  title="Regenerate Secret API Key"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRegeneratingKey ? "animate-spin text-cyan-400" : ""}`} />
                  <span className="hidden sm:inline">Regenerate Key</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold text-[11px] shrink-0">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  {activeDoc.trigger.type === "telegram" ? "Telegram Bot Active" : "Discord Bot Active"}
                </span>
                <span className="text-slate-300 truncate text-xs">
                  {activeDoc.trigger.type === "telegram"
                    ? "Inbound Telegram updates listener active via FastAPI webhook"
                    : "Discord Interaction listener active on /ask slash command"}
                </span>
              </div>
              {activeDoc.trigger.type === "telegram" && activeDoc.trigger.telegramSettings?.botUsername && (
                <a
                  href={`https://t.me/${activeDoc.trigger.telegramSettings.botUsername.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shrink-0"
                >
                  <span>Open Bot in Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trigger Prompt & Execution Query Bar */}
      {activeDoc.status === "active" && (
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-slate-400 font-mono shrink-0">
              Test Input:
            </span>
            <input
              type="text"
              placeholder={
                activeDoc.trigger.samplePayload?.message ||
                "Type query for the agent (e.g. What product categories are available?)..."
              }
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  openChatSidebar(customPrompt.trim() || undefined);
                  setCustomPrompt("");
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setCustomPrompt(
                  "What product categories are available? Fetch them.",
                )
              }
              className="px-2 py-1 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
            >
              Categories Query
            </button>
            <div className="text-[11px] font-mono text-emerald-400">
              Channel: {activeDoc.output.type}
            </div>
          </div>
        </div>
      )}

      {backendError && (
        <div className="px-4 sm:px-6 py-2 bg-rose-950/40 border-b border-rose-900/50 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Workflow Compilation Error: {backendError}</span>
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

      {/* 3. Main Workspace: The 3 Pipeline Cards + Config Inspector */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* THREE PIPELINE CARDS (Trigger → AI Agent Core → Tied Output) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative">
          {/* COMPONENT 1: TRIGGER */}
          <div
            onClick={() => handleSelectComponent("trigger")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedComponent === "trigger" && activeTab === "trigger"
                ? "bg-slate-900 border-indigo-500/80 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                : "bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono">
                    1
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                      Stage 01: Inbound
                    </span>
                    <h3 className="text-sm font-bold text-white">Trigger</h3>
                  </div>
                </div>

                <div className="shrink-0">
                  {executedStages.includes("trigger") ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Received</span>
                    </div>
                  ) : activeExecutionStage === "trigger" ? (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Listening</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${activeDoc.trigger.badgeColor}`}
                  >
                    {activeDoc.trigger.app}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-semibold truncate">
                    Type: {activeDoc.trigger.type}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">
                  {activeDoc.trigger.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {activeDoc.trigger.subtitle}
                </p>
              </div>
            </div>

            {/* Bottom Payload Variables Preview */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                Inbound Payload Keys:
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(activeDoc.trigger.samplePayload)
                  .slice(0, 3)
                  .map((key) => (
                    <span
                      key={key}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700"
                    >
                      @{key}
                    </span>
                  ))}
                {Object.keys(activeDoc.trigger.samplePayload).length > 3 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    +{Object.keys(activeDoc.trigger.samplePayload).length - 3}{" "}
                    more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COMPONENT 2: AI AGENT CORE (Model + Storage + Configurable Tools) */}
          <div
            onClick={() => handleSelectComponent("agent")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedComponent === "agent" && activeTab === "agent"
                ? "bg-slate-900 border-amber-500/80 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/50"
                : "bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                    2
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                      Stage 02: Core
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      AI Agent & Tools
                    </h3>
                  </div>
                </div>

                <div className="shrink-0">
                  {executedStages.includes("agent") ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Synthesized</span>
                    </div>
                  ) : activeExecutionStage === "agent" ||
                    activeExecutionStage === "tool_call" ? (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>
                        {activeExecutionStage === "tool_call"
                          ? "Calling Tools"
                          : "Reasoning"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                    {currentModelDef || activeDoc.agent.model}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded border bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-mono">
                    {currentStorageDef?.name || "Session Memory"}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("storage");
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                      (activeDoc.executionStorage || "all") === "none"
                        ? "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                        : (activeDoc.executionStorage || "all") === "errors_only"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                    title="Execution Storage Policy: Click to configure"
                  >
                    Storage: {(activeDoc.executionStorage || "all") === "errors_only" ? "Errors Only" : (activeDoc.executionStorage || "all") === "none" ? "None" : "All Runs"}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">
                  {activeDoc.agent.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {activeDoc.agent.subtitle}
                </p>
              </div>
            </div>

            {/* Bottom Configured Tools Preview */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="  text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                <span>Active Tools ({activeDoc.agent.tools.length}):</span>
              </div>
            </div>
          </div>

          {/* COMPONENT 3: OUTPUT ACTION (Tied to Trigger Point) */}
          <div
            onClick={() => handleSelectComponent("output")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedComponent === "output" && activeTab === "output"
                ? "bg-slate-900 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/50"
                : "bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs font-mono">
                    3
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                      Stage 03: Return
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Tied Output
                    </h3>
                  </div>
                </div>

                <div className="shrink-0">
                  {executedStages.includes("output") ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Returned</span>
                    </div>
                  ) : activeExecutionStage === "output" ? (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Sending</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
                      Ready
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${activeDoc.output.badgeColor}`}
                  >
                    {activeDoc.output.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    → Bound to: @{activeDoc.output.targetTrigger}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">
                  {activeDoc.output.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {activeDoc.output.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Configuration Panel (Tabs for Trigger, Agent & Tools, Output, and Live Logs) */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectComponent("trigger")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "trigger"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center text-[10px] font-mono">
                  1
                </div>
                <span>Configure Trigger ({activeDoc.trigger.type})</span>
              </button>

              <button
                onClick={() => handleSelectComponent("agent")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "agent"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="w-4 h-4 rounded bg-amber-500/20 flex items-center justify-center text-[10px] font-mono">
                  2
                </div>
                <span>
                  Configure Agent & Tools ({activeDoc.agent.tools.length})
                </span>
              </button>

              <button
                onClick={() => handleSelectComponent("output")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "output"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-[10px] font-mono">
                  3
                </div>
                <span>Configure Tied Output</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab("storage");
                  loadStoredExecutions(activeDoc.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === "storage"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>Storage & Retention</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    (activeDoc.executionStorage || "all") === "errors_only"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : (activeDoc.executionStorage || "all") === "none"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {(activeDoc.executionStorage || "all") === "errors_only"
                    ? "Errors"
                    : (activeDoc.executionStorage || "all") === "none"
                    ? "None"
                    : "All"}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === "logs"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Logs ({executionLogs.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TRIGGER CONFIGURATION */}
          {activeTab === "trigger" && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>Inbound Trigger Settings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select between Chat Interface, HTTP Webhook, Telegram Bot,
                    or Discord Bot.
                  </p>
                </div>
              </div>

              {/* Trigger Type Selection Pill Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Inbound Trigger Source
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      type: "chat" as TriggerType,
                      title: "Chat Interface",
                      desc: "Web chat widget for direct human-to-agent conversations",
                      icon: (
                        <MessageSquare className="w-5 h-5 text-violet-400" />
                      ),
                    },
                    {
                      type: "webhook" as TriggerType,
                      title: "HTTP Webhook",
                      desc: "Inbound REST POST request with raw JSON payload",
                      icon: <Globe className="w-5 h-5 text-cyan-400" />,
                    },
                    {
                      type: "telegram" as TriggerType,
                      title: "Telegram Bot",
                      desc: "Receives messages and commands from Telegram chats",
                      icon: <Send className="w-5 h-5 text-blue-400" />,
                    },
                    {
                      type: "discord" as TriggerType,
                      title: "Discord Bot",
                      desc: "Listens for mentions, commands, or channel messages",
                      icon: <Hash className="w-5 h-5 text-indigo-400" />,
                    },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setTriggerType(t.type)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        activeDoc.trigger.type === t.type
                          ? "bg-indigo-500/20 border-indigo-500/60 text-white shadow-lg shadow-indigo-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        {t.icon}
                        <span className="font-bold text-sm text-white">
                          {t.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger-Specific Form Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-7 space-y-4">
                  {/* Common Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Trigger Title
                      </label>
                      <input
                        type="text"
                        value={activeDoc.trigger.title}
                        onChange={(e) =>
                          updateTrigger({ title: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Trigger Subtitle
                      </label>
                      <input
                        type="text"
                        value={activeDoc.trigger.subtitle}
                        onChange={(e) =>
                          updateTrigger({ subtitle: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 1. CHAT INTERFACE SPECIFICS */}
                  {activeDoc.trigger.type === "chat" && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                        Chat Interface Configuration
                      </h4>
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Welcome Message
                        </label>
                        <input
                          type="text"
                          value={
                            activeDoc.trigger.chatSettings?.welcomeMessage || ""
                          }
                          onChange={(e) =>
                            updateTrigger({
                              chatSettings: {
                                ...(activeDoc.trigger.chatSettings || {
                                  welcomeMessage: "",
                                  placeholder: "",
                                  streamingEnabled: true,
                                  requireAuth: false,
                                }),
                                welcomeMessage: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">
                          Input Placeholder
                        </label>
                        <input
                          type="text"
                          value={
                            activeDoc.trigger.chatSettings?.placeholder || ""
                          }
                          onChange={(e) =>
                            updateTrigger({
                              chatSettings: {
                                ...(activeDoc.trigger.chatSettings || {
                                  welcomeMessage: "",
                                  placeholder: "",
                                  streamingEnabled: true,
                                  requireAuth: false,
                                }),
                                placeholder: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. WEBHOOK SPECIFICS */}
                  {activeDoc.trigger.type === "webhook" && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-300">
                            Inbound Webhook Endpoint URL
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCurlModal(true)}
                            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <Terminal className="w-3 h-3" />
                            <span>View cURL / Python Snippet</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={webhookFullUrl || activeDoc.trigger.webhookEndpoint || ""}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 select-all"
                          />
                          <button
                            type="button"
                            onClick={handleCopyWebhookUrl}
                            className="shrink-0 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedWebhook ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedWebhook ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-300">
                            Authentication API Key (X-API-Key / Bearer)
                          </label>
                          <button
                            type="button"
                            onClick={handleRegenerateKey}
                            disabled={isRegeneratingKey}
                            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isRegeneratingKey ? "animate-spin" : ""}`}
                            />
                            <span>Regenerate API Key</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={
                              deploymentInfo?.api_key ||
                              activeDoc.trigger.webhookSecret ||
                              "Auto-generated when workflow is activated"
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 select-all"
                          />
                          <button
                            type="button"
                            onClick={handleCopyApiKey}
                            className="shrink-0 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedApiKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedApiKey ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. TELEGRAM BOT SPECIFICS (Push Webhook via ngrok) */}
                  {activeDoc.trigger.type === "telegram" && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                          <Send className="w-4 h-4 text-blue-400" />
                          Telegram Bot Webhook (Push API)
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border ${
                            activeDoc.status === "active" && telegramActive
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activeDoc.status === "active" && telegramActive
                                ? "bg-emerald-400 animate-ping"
                                : "bg-slate-500"
                            }`}
                          />
                          {activeDoc.status === "active" && telegramActive
                            ? "Webhook Live"
                            : "Webhook Inactive"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Telegram Bot Token
                          </label>
                          <input
                            type="password"
                            placeholder="123456:ABC-DEF... (from @BotFather)"
                            value={
                              activeDoc.trigger.telegramSettings?.botToken || ""
                            }
                            onChange={(e) =>
                              updateTrigger({
                                telegramSettings: {
                                  ...(activeDoc.trigger.telegramSettings || {
                                    botToken: "",
                                    webhookBaseUrl: "",
                                    autoReply: true,
                                  }),
                                  botToken: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            ngrok Public Webhook Base URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://xxxx.ngrok-free.app"
                            value={
                              activeDoc.trigger.telegramSettings
                                ?.webhookBaseUrl || ""
                            }
                            onChange={(e) =>
                              updateTrigger({
                                telegramSettings: {
                                  ...(activeDoc.trigger.telegramSettings || {
                                    botToken: "",
                                    webhookBaseUrl: "",
                                    autoReply: true,
                                  }),
                                  webhookBaseUrl: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Allowed Chat IDs (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 12345678, -100123456789"
                            value={
                              activeDoc.trigger.telegramSettings
                                ?.allowedChatIds || ""
                            }
                            onChange={(e) =>
                              updateTrigger({
                                telegramSettings: {
                                  ...(activeDoc.trigger.telegramSettings || {
                                    botToken: "",
                                    webhookBaseUrl: "",
                                    autoReply: true,
                                  }),
                                  allowedChatIds: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Command Filter Prefix (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. /status or /ask (Leave blank for all)"
                            value={
                              activeDoc.trigger.telegramSettings
                                ?.commandPrefix || ""
                            }
                            onChange={(e) =>
                              updateTrigger({
                                telegramSettings: {
                                  ...(activeDoc.trigger.telegramSettings || {
                                    botToken: "",
                                    webhookBaseUrl: "",
                                    autoReply: true,
                                  }),
                                  commandPrefix: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Auto-Reply Switch */}
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={
                            activeDoc.trigger.telegramSettings?.autoReply ??
                            true
                          }
                          onChange={(e) =>
                            updateTrigger({
                              telegramSettings: {
                                ...(activeDoc.trigger.telegramSettings || {
                                  botToken: "",
                                  webhookBaseUrl: "",
                                  autoReply: true,
                                }),
                                autoReply: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300">
                          <strong className="text-white">
                            Auto-Reply to Telegram Message
                          </strong>{" "}
                          – Automatically sends the workflow output back to the
                          originating chat.
                        </span>
                      </label>

                      {/* Real-Time Webhook Status */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                        {activeDoc.status === "active" ? (
                          <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                            <div className="flex items-center gap-2.5">
                              <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                              </span>
                              <div>
                                <p className="text-xs font-bold text-emerald-300">
                                  Telegram Push Webhook is Active
                                </p>
                                <p className="text-[11px] text-emerald-400/80">
                                  Telegram is pushing updates directly to your
                                  ngrok webhook endpoint. Zero polling loops.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              Active
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-slate-300">
                                  Telegram Webhook is Inactive
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Toggle this workflow to{" "}
                                  <strong className="text-emerald-400">
                                    Active
                                  </strong>{" "}
                                  in the top header to automatically register
                                  the webhook with Telegram.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                              Inactive (Draft)
                            </span>
                          </div>
                        )}

                        {/* Telegram Simulation Bar */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            Simulate Telegram Inbound Event
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type a simulated message, e.g. /status cluster-prod"
                              value={telegramSimulateInput}
                              onChange={(e) =>
                                setTelegramSimulateInput(e.target.value)
                              }
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={handleSimulateTelegramMessage}
                              disabled={telegramSimulateLoading}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                            >
                              <Play className="w-3 h-3" />
                              {telegramSimulateLoading
                                ? "Testing..."
                                : "Test Event"}
                            </button>
                          </div>
                        </div>

                        {telegramStatusMsg && (
                          <p className="text-[11px] font-mono text-cyan-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                            {telegramStatusMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. DISCORD BOT SPECIFICS (HTTP Interactions Webhook via ngrok) */}
                  {activeDoc.trigger.type === "discord" && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                          <Hash className="w-4 h-4 text-indigo-400" />
                          Discord HTTP Interactions Webhook
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border ${
                            activeDoc.status === "active" && discordListening
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activeDoc.status === "active" && discordListening
                                ? "bg-emerald-400 animate-ping"
                                : "bg-slate-500"
                            }`}
                          />
                          {activeDoc.status === "active" && discordListening
                            ? "Interactions Live"
                            : "Interactions Inactive"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Application ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 106482910293847291"
                            value={
                              activeDoc.trigger.discordSettings
                                ?.applicationId || ""
                            }
                            onChange={(e) =>
                              updateTrigger({
                                discordSettings: {
                                  ...(activeDoc.trigger.discordSettings || {
                                    applicationId: "",
                                    publicKey: "",
                                    webhookBaseUrl: "",
                                    commandName: "ask",
                                    autoReply: true,
                                  }),
                                  applicationId: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Public Key (Ed25519 Verification)
                          </label>
                          <input
                            type="password"
                            placeholder="64-character hex key from Discord Developer Portal"
                            value={
                              activeDoc.trigger.discordSettings?.publicKey || ""
                            }
                            onChange={(e) =>
                              updateTrigger({
                                discordSettings: {
                                  ...(activeDoc.trigger.discordSettings || {
                                    applicationId: "",
                                    publicKey: "",
                                    webhookBaseUrl: "",
                                    commandName: "ask",
                                    autoReply: true,
                                  }),
                                  publicKey: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            ngrok Public Webhook Base URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://xxxx.ngrok-free.app"
                            value={
                              activeDoc.trigger.discordSettings
                                ?.webhookBaseUrl || ""
                            }
                            onChange={(e) =>
                              updateTrigger({
                                discordSettings: {
                                  ...(activeDoc.trigger.discordSettings || {
                                    applicationId: "",
                                    publicKey: "",
                                    webhookBaseUrl: "",
                                    commandName: "ask",
                                    autoReply: true,
                                  }),
                                  webhookBaseUrl: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Slash Command Name
                          </label>
                          <input
                            type="text"
                            placeholder="ask (will match /ask)"
                            value={
                              activeDoc.trigger.discordSettings?.commandName ||
                              "ask"
                            }
                            onChange={(e) =>
                              updateTrigger({
                                discordSettings: {
                                  ...(activeDoc.trigger.discordSettings || {
                                    applicationId: "",
                                    publicKey: "",
                                    webhookBaseUrl: "",
                                    commandName: "ask",
                                    autoReply: true,
                                  }),
                                  commandName: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Copyable Interactions Endpoint URL Box */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Your Discord Interactions Endpoint URL:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const base =
                                activeDoc.trigger.discordSettings?.webhookBaseUrl?.trim() ||
                                "https://your-ngrok.ngrok-free.app";
                              const fullUrl = `${base.replace(/\/+$/, "")}/api/v1/triggers/discord/interactions/${activeDoc.id}`;
                              navigator.clipboard.writeText(fullUrl);
                              setCopiedDiscordUrl(true);
                              setTimeout(
                                () => setCopiedDiscordUrl(false),
                                2000,
                              );
                            }}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono cursor-pointer"
                          >
                            {copiedDiscordUrl ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-sans">
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy URL</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 font-mono text-xs text-indigo-300 break-all select-all">
                          {(
                            activeDoc.trigger.discordSettings?.webhookBaseUrl?.trim() ||
                            "https://your-ngrok.ngrok-free.app"
                          ).replace(/\/+$/, "")}
                          /api/v1/triggers/discord/interactions/{activeDoc.id}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Paste this URL in{" "}
                          <a
                            href="https://discord.com/developers/applications"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline"
                          >
                            discord.com/developers/applications
                          </a>{" "}
                          &gt; General Information &gt; Interactions Endpoint
                          URL.
                        </p>
                      </div>

                      {/* Auto-Reply Switch */}
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={
                            activeDoc.trigger.discordSettings?.autoReply ?? true
                          }
                          onChange={(e) =>
                            updateTrigger({
                              discordSettings: {
                                ...(activeDoc.trigger.discordSettings || {
                                  applicationId: "",
                                  publicKey: "",
                                  webhookBaseUrl: "",
                                  commandName: "ask",
                                  autoReply: true,
                                }),
                                autoReply: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300">
                          <strong className="text-white">
                            Auto-Reply to Slash Command
                          </strong>{" "}
                          – Automatically edits the deferred interaction
                          response with the final workflow output.
                        </span>
                      </label>

                      {/* Real-time Status & Test Event */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                        {activeDoc.status === "active" ? (
                          <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                            <div className="flex items-center gap-2.5">
                              <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                              </span>
                              <div>
                                <p className="text-xs font-bold text-emerald-300">
                                  Discord Interaction Webhook is Active
                                </p>
                                <p className="text-[11px] text-emerald-400/80">
                                  Discord pushes HTTP interaction requests
                                  directly to your endpoint. Zero polling loops.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              Active
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-slate-300">
                                  Discord Interaction Webhook is Inactive
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Toggle this workflow to{" "}
                                  <strong className="text-emerald-400">
                                    Active
                                  </strong>{" "}
                                  in the top header to activate.
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                              Inactive (Draft)
                            </span>
                          </div>
                        )}

                        {/* Simulation Bar */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            Simulate Discord Slash Command Event
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type a simulated command, e.g. /ask check system status"
                              value={discordSimulateInput}
                              onChange={(e) =>
                                setDiscordSimulateInput(e.target.value)
                              }
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={handleSimulateDiscordMessage}
                              disabled={discordSimulateLoading}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                            >
                              <Play className="w-3 h-3" />
                              {discordSimulateLoading
                                ? "Testing..."
                                : "Test Event"}
                            </button>
                          </div>
                        </div>

                        {discordStatusMsg && (
                          <p className="text-[11px] font-mono text-cyan-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                            {discordStatusMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Sample Inbound Payload */}
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Sample Incoming Payload (@trigger.*)
                      </label>
                      <span className="text-[10px] font-mono text-indigo-400">
                        Auto-mapped
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto space-y-1.5 shadow-inner">
                      {Object.entries(activeDoc.trigger.samplePayload).map(
                        ([key, val]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between gap-2 border-b border-slate-900 pb-1"
                          >
                            <span className="text-cyan-400 font-medium">
                              @{key}:
                            </span>
                            <span className="text-slate-300 text-right truncate">
                              {JSON.stringify(val)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300">
                    <p className="font-semibold mb-1">
                      Output Binding Assurance:
                    </p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Because this trigger is set to{" "}
                      <strong className="text-indigo-400 font-mono">
                        {activeDoc.trigger.type}
                      </strong>
                      , Stage 3 Output is automatically bound to return
                      responses directly back to this trigger point.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI AGENT CORE & CONFIGURABLE TOOLS (like n8n) */}
          {activeTab === "agent" && (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>AI Agent Core, Model & Configurable Tools</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select the model intelligence, backend storage/memory, and
                    add configurable tools (like making HTTP requests).
                  </p>
                </div>
              </div>

              {/* SECTION A: TARGET INTELLIGENCE MODEL (Backend Dummy Registry) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select LLM Model
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {AVAILABLE_MODELS.length} Models Available
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={activeDoc.agent.model}
                    onChange={(e) => selectModel(e.target.value)}
                    className="w-full appearance-none px-3.5 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 cursor-pointer"
                  >
                    {AVAILABLE_MODELS.map((m: string) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* Dropdown arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* SECTION B: MEMORY & STORAGE (Backend Dummy Registry) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Agent Memory & Storage Engine
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {AVAILABLE_STORAGE_OPTIONS.length} Storage Providers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {AVAILABLE_STORAGE_OPTIONS.map((st) => {
                    const isSelected =
                      activeDoc.agent.storage.storageId === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => selectStorage(st.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-indigo-500/20 border-indigo-500/60 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white mb-0.5">
                            {st.name}
                          </div>
                          <div className="text-[10px] text-indigo-400 font-mono mb-1">
                            {st.provider}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {st.description}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                          {st.features[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION C: CONFIGURABLE TOOLS (n8n-style) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                      <span>
                        Configured Agent Tools ({activeDoc.agent.tools.length})
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Equip your agent with custom HTTP Requests, Database
                      queries, Vector search, and code runners.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openAddToolModal}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tool</span>
                  </button>
                </div>

                {/* List of Configured Tools */}
                {activeDoc.agent.tools.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-300">
                      No tools configured yet
                    </div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Add the HTTP Request, Weather, or JSON Transform tools to
                      enable backend integrations.
                    </p>
                    <button
                      type="button"
                      onClick={openAddToolModal}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 cursor-pointer"
                    >
                      + Browse Available Tools
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeDoc.agent.tools.map((tool) => {
                      const toolDef =
                        availableTools?.find((def) => def.id === tool.toolId) ||
                        AVAILABLE_TOOLS.find((def) => def.id === tool.toolId);

                      return (
                        <div
                          key={tool.instanceId}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            tool.enabled
                              ? "bg-slate-950/90 border-slate-800 hover:border-slate-700 shadow-sm"
                              : "bg-slate-950/40 border-slate-900 opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                              {getToolIcon(toolDef?.iconName || "Sparkles")}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-white truncate">
                                  {tool.name}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                  {toolDef?.category}
                                </span>
                                {!tool.enabled && (
                                  <span className="text-[10px] text-amber-400 font-mono">
                                    Disabled
                                  </span>
                                )}
                              </div>

                              {/* Tool Parameter Snippet Summary */}
                              <div className="text-[11px] text-slate-400 font-mono truncate mt-1">
                                {tool.toolId === "http_request" ||
                                tool.toolId === "node_http_request" ? (
                                  <span className="flex items-center gap-1.5">
                                    <strong className="text-cyan-400 font-semibold">
                                      [{tool.config?.method || "GET"}]
                                    </strong>
                                    <span className="text-slate-300 truncate">
                                      {tool.config?.url}
                                    </span>
                                  </span>
                                ) : tool.toolId === "get_weather" ? (
                                  <span>
                                    City:{" "}
                                    <strong className="text-purple-300">
                                      {tool.config?.city || "London"}
                                    </strong>
                                  </span>
                                ) : tool.toolId === "json_transform" ? (
                                  <span>
                                    Key:{" "}
                                    <strong className="text-amber-300">
                                      {tool.config?.key || "output"}
                                    </strong>
                                  </span>
                                ) : tool.toolId === "currency_converter" ? (
                                  <span>
                                    Base:{" "}
                                    <strong className="text-amber-300">
                                      {tool.config?.base_currency || "USD"}
                                    </strong>{" "}
                                    → Targets:{" "}
                                    <span className="text-slate-300 truncate">
                                      {tool.config?.target_currencies ||
                                        "EUR,GBP,JPY,CAD,INR"}
                                    </span>
                                  </span>
                                ) : tool.toolId === "resend_email" ? (
                                  <span>
                                    Sender:{" "}
                                    <strong className="text-rose-300">
                                      {tool.config?.from_email ||
                                        "onboarding@resend.dev"}
                                    </strong>{" "}
                                    | User Fallback:{" "}
                                    <span className="text-slate-300 truncate">
                                      {tool.config?.default_user_email ||
                                        "Not configured ('mail me' will prompt)"}
                                    </span>
                                  </span>
                                ) : tool.toolId === "notion_page" || tool.toolId === "notion" ? (
                                  <span className="flex items-center gap-1.5 text-xs">
                                    <span className="text-cyan-300 font-semibold capitalize">
                                      {tool.config?.resource || "page"}
                                    </span>
                                    <span className="text-slate-500">➔</span>
                                    <span className="text-emerald-300 font-mono font-medium">
                                      {tool.config?.operation || "create"}
                                    </span>
                                  </span>
                                ) : (
                                  <span>
                                    Configured with{" "}
                                    {Object.keys(tool.config || {}).length}{" "}
                                    parameters
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tool Action Controls */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {/* Configure Button (Opens Modal) */}
                            <button
                              type="button"
                              onClick={() => openToolConfig(tool.instanceId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                            >
                              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Configure</span>
                            </button>

                            {/* Enable/Disable Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleToolStatus(tool.instanceId)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                tool.enabled
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
                              }`}
                              title={
                                tool.enabled ? "Disable tool" : "Enable tool"
                              }
                            >
                              {tool.enabled ? "Active" : "Off"}
                            </button>

                            {/* Remove Tool */}
                            <button
                              type="button"
                              onClick={() =>
                                removeToolFromAgent(tool.instanceId)
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Tool"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION D: SYSTEM INSTRUCTIONS & HYPERPARAMETERS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      System Instructions & Agent Context
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Supports @trigger.* variables
                    </span>
                  </div>

                  {/* Variable Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-[11px] text-slate-500">
                      Inject variable:
                    </span>
                    {Object.keys(activeDoc.trigger.samplePayload).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => insertVariableIntoPrompt(key)}
                        className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
                      >
                        + @trigger.{key}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={6}
                    value={activeDoc.agent.systemPrompt}
                    onChange={(e) =>
                      updateAgent({ systemPrompt: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="lg:col-span-4 space-y-4">
                  {/* Temperature Slider */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        Temperature
                      </label>
                      <span className="text-xs font-mono text-amber-400">
                        {activeDoc.agent.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={activeDoc.agent.temperature}
                      onChange={(e) =>
                        updateAgent({ temperature: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.0 (Deterministic)</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>

                  {/* Reasoning Mode */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Reasoning Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["fast", "balanced", "deep"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateAgent({ reasoningMode: mode })}
                          className={`py-1 text-center text-xs font-medium rounded-lg capitalize transition-all cursor-pointer ${
                            activeDoc.agent.reasoningMode === mode
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIED OUTPUT ACTION CONFIGURATION */}
          {activeTab === "output" && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Tied Output Action Settings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Outputs are strictly bound to return directly to the trigger
                    source (Chat, Webhook, or Telegram).
                  </p>
                </div>
              </div>

              {/* Binding Information Callout */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300">
                      Active Output Channel:{" "}
                    </span>
                    <span className="text-white font-mono">
                      {activeDoc.output.title}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Originating Trigger:{" "}
                      <strong className="text-cyan-300 uppercase">
                        {activeDoc.output.targetTrigger}
                      </strong>
                    </p>
                  </div>
                </div>

                <span className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  ● Tied & Guaranteed
                </span>
              </div>

              {/* Trigger-Specific Output Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  {/* 1. CHAT RESPONSE SETTINGS */}
                  {activeDoc.output.targetTrigger === "chat" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          Chat Interface Response Settings
                        </h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-white">
                              Stream Chunks Live
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Send tokens in real-time as the model generates
                              inference
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={
                              activeDoc.output.chatResponseConfig
                                ?.streamChunks ?? true
                            }
                            onChange={(e) =>
                              updateOutput({
                                chatResponseConfig: {
                                  ...(activeDoc.output.chatResponseConfig || {
                                    streamChunks: true,
                                    renderMarkdown: true,
                                    suggestedChips: [],
                                  }),
                                  streamChunks: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                          <div>
                            <div className="text-xs font-semibold text-white">
                              Render Rich Markdown
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Format bold, tables, links, and code snippets in
                              the chat UI
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={
                              activeDoc.output.chatResponseConfig
                                ?.renderMarkdown ?? true
                            }
                            onChange={(e) =>
                              updateOutput({
                                chatResponseConfig: {
                                  ...(activeDoc.output.chatResponseConfig || {
                                    streamChunks: true,
                                    renderMarkdown: true,
                                    suggestedChips: [],
                                  }),
                                  renderMarkdown: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. WEBHOOK RESPONSE SETTINGS */}
                  {activeDoc.output.targetTrigger === "webhook" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                          HTTP Webhook Response Settings
                        </h4>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            HTTP Status Code Returned
                          </label>
                          <select
                            value={
                              activeDoc.output.webhookResponseConfig
                                ?.statusCode || 200
                            }
                            onChange={(e) =>
                              updateOutput({
                                webhookResponseConfig: {
                                  ...(activeDoc.output
                                    .webhookResponseConfig || {
                                    statusCode: 200,
                                    contentType: "application/json",
                                    responseTemplate: "",
                                  }),
                                  statusCode: parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                          >
                            <option value="200">
                              200 OK (Standard Success)
                            </option>
                            <option value="201">201 Created</option>
                            <option value="202">
                              202 Accepted (Async Processing)
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Response JSON Template
                          </label>
                          <textarea
                            rows={4}
                            value={
                              activeDoc.output.webhookResponseConfig
                                ?.responseTemplate || ""
                            }
                            onChange={(e) =>
                              updateOutput({
                                webhookResponseConfig: {
                                  ...(activeDoc.output
                                    .webhookResponseConfig || {
                                    statusCode: 200,
                                    contentType: "application/json",
                                    responseTemplate: "",
                                  }),
                                  responseTemplate: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. TELEGRAM BOT SETTINGS */}
                  {activeDoc.output.targetTrigger === "telegram" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                          Telegram Reply Settings
                        </h4>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Parse Mode
                          </label>
                          <select
                            value={
                              activeDoc.output.telegramResponseConfig
                                ?.parseMode || "MarkdownV2"
                            }
                            onChange={(e) =>
                              updateOutput({
                                telegramResponseConfig: {
                                  ...(activeDoc.output
                                    .telegramResponseConfig || {
                                    parseMode: "MarkdownV2",
                                    replyToMessage: true,
                                  }),
                                  parseMode: e.target.value as any,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                          >
                            <option value="MarkdownV2">
                              MarkdownV2 (Supported)
                            </option>
                            <option value="HTML">HTML</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. DISCORD BOT SETTINGS */}
                  {activeDoc.output.targetTrigger === "discord" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Hash className="w-4 h-4 text-indigo-400" />
                            Discord Channel Auto-Reply
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Channel Thread Reply
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={
                                activeDoc.output.discordResponseConfig
                                  ?.replyToMessage ?? true
                              }
                              onChange={(e) =>
                                updateOutput({
                                  discordResponseConfig: {
                                    ...(activeDoc.output
                                      .discordResponseConfig || {
                                      replyToMessage: true,
                                      autoReply: true,
                                    }),
                                    replyToMessage: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900 cursor-pointer"
                            />
                            <span className="text-slate-300">
                              <strong className="text-white">
                                Direct Message Reference
                              </strong>{" "}
                              – Replies directly referencing the trigger message
                              ID.
                            </span>
                          </label>

                          <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-slate-300">
                            <p className="leading-relaxed">
                              When a Discord message triggers this workflow, the
                              final agent response will automatically chunk at
                              2,000 characters and reply back to the originating
                              channel thread.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Sample Result Receipt */}
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Sample Output Delivery Receipt
                    </label>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5 shadow-inner">
                      {Object.entries(activeDoc.output.sampleResult).map(
                        ([key, val]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between gap-2 border-b border-slate-900 pb-1"
                          >
                            <span className="text-emerald-400 font-medium">
                              {key}:
                            </span>
                            <span className="text-slate-300 text-right truncate">
                              {JSON.stringify(val)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXECUTION & LOG STORAGE RETENTION POLICIES */}
          {activeTab === "storage" && (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>Execution & Log Storage Policy</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Control database storage consumption by choosing whether to store all runs, only errors, or none at all.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadStoredExecutions(activeDoc.id)}
                    disabled={isLoadingExecutions}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExecutions ? "animate-spin" : ""}`} />
                    <span>Refresh History</span>
                  </button>
                  {storedExecutions.length > 0 && (
                    confirmClearExecutions ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            setIsClearingExecutions(true);
                            await clearStoredExecutions(activeDoc.id);
                            setIsClearingExecutions(false);
                            setConfirmClearExecutions(false);
                          }}
                          disabled={isClearingExecutions}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {isClearingExecutions ? "Purging..." : "Confirm Purge"}
                        </button>
                        <button
                          onClick={() => setConfirmClearExecutions(false)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearExecutions(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Stored Executions</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 1. Workflow Execution Storage Policy */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      1. Workflow Execution Storage
                    </h4>
                    <p className="text-xs text-slate-400">
                      Governs recording execution summaries (status, inputs, duration, final outputs) in the database.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Current: {activeDoc.executionStorage || "all"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option: all */}
                  <div
                    onClick={() => setExecutionStorage("all")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      (activeDoc.executionStorage || "all") === "all"
                        ? "bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/50 shadow-lg"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-purple-400" />
                          <span>Store All Executions</span>
                        </span>
                        {(activeDoc.executionStorage || "all") === "all" && (
                          <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Records every single run (successful and failed). Provides a complete audit trail of inputs and responses.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">DB Footprint:</span>
                      <span className="text-amber-400 font-medium">Full Audit (Higher DB Usage)</span>
                    </div>
                  </div>

                  {/* Option: errors_only */}
                  <div
                    onClick={() => setExecutionStorage("errors_only")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      activeDoc.executionStorage === "errors_only"
                        ? "bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50 shadow-lg"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Store Errors Only</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Only saves execution records if the agent fails or throws an exception. Keeps your database slim and clean.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">DB Footprint:</span>
                      <span className="text-emerald-400 font-medium">⚡ Lightweight</span>
                    </div>
                  </div>

                  {/* Option: none */}
                  <div
                    onClick={() => setExecutionStorage("none")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      activeDoc.executionStorage === "none"
                        ? "bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/50 shadow-lg"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-rose-400" />
                          <span>Store None</span>
                        </span>
                        {activeDoc.executionStorage === "none" && (
                          <CheckCircle2 className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Never writes execution records to PostgreSQL. Ideal for maximum privacy and zero database storage.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">DB Footprint:</span>
                      <span className="text-cyan-400 font-medium">Zero Storage (Ephemeral)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Granular Execution Log Storage Policy */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      2. Granular Execution Log Storage
                    </h4>
                    <p className="text-xs text-slate-400">
                      Controls whether individual tool call arguments, outputs, and node steps are written to `execution_logs`.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Current: {activeDoc.executionLogStorage || "all"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option: all */}
                  <div
                    onClick={() => setExecutionLogStorage("all")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      (activeDoc.executionLogStorage || "all") === "all"
                        ? "bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Store All Logs</span>
                        </span>
                        {(activeDoc.executionLogStorage || "all") === "all" && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Saves every tool execution, tool arguments, and tool outputs for all persisted runs.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">Detail Level:</span>
                      <span className="text-amber-400 font-medium">Deep Diagnostics</span>
                    </div>
                  </div>

                  {/* Option: errors_only */}
                  <div
                    onClick={() => setExecutionLogStorage("errors_only")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      activeDoc.executionLogStorage === "errors_only"
                        ? "bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50 shadow-lg"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Store Error Logs Only</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Granular step and tool call logs are only saved when a failure occurs. Keeps high-volume runs fast and clean.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">Detail Level:</span>
                      <span className="text-emerald-400 font-medium">⚡ Failure Trace Only</span>
                    </div>
                  </div>

                  {/* Option: none */}
                  <div
                    onClick={() => setExecutionLogStorage("none")}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      activeDoc.executionLogStorage === "none"
                        ? "bg-rose-950/30 border-rose-500 ring-1 ring-rose-500/50 shadow-lg"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-rose-400" />
                          <span>Store None</span>
                        </span>
                        {activeDoc.executionLogStorage === "none" && (
                          <CheckCircle2 className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Never writes granular tool call rows to `execution_logs`. Completely avoids log table growth.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">Detail Level:</span>
                      <span className="text-cyan-400 font-medium">Zero Log Rows</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Stored Executions History & Live Inspector */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Stored Executions History</span>
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {storedExecutions.length} runs in DB
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Live records currently stored in PostgreSQL for this workflow.
                    </p>
                  </div>
                </div>

                {isLoadingExecutions ? (
                  <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Loading execution history from database...</span>
                  </div>
                ) : storedExecutions.length === 0 ? (
                  <div className="py-12 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-500">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
                    <p className="text-xs text-slate-400 font-medium">No stored executions in database</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      {(activeDoc.executionStorage || "all") === "none"
                        ? "Storage is set to 'None'. Executions will not be stored in PostgreSQL."
                        : (activeDoc.executionStorage || "all") === "errors_only"
                        ? "Storage is set to 'Errors Only'. Only failed executions will be recorded."
                        : "Executions will appear here once the workflow is triggered or tested."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {storedExecutions.map((exec) => (
                      <div
                        key={exec.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs font-mono space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                exec.status === "completed"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {exec.status}
                            </span>
                            <span className="text-slate-300 font-semibold truncate max-w-[200px]" title={exec.id}>
                              ID: {exec.id.substring(0, 8)}...
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                            {exec.duration_ms !== undefined && (
                              <span>{exec.duration_ms}ms</span>
                            )}
                            <span className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                              {exec.logs_count} log{exec.logs_count !== 1 ? "s" : ""}
                            </span>
                            <span>{new Date(exec.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {exec.error_message && (
                          <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[11px]">
                            Error: {exec.error_message}
                          </div>
                        )}

                        {exec.trigger_input && (
                          <div className="text-[11px] text-slate-400 truncate">
                            <span className="text-slate-500">Input:</span>{" "}
                            {typeof exec.trigger_input === "object"
                              ? JSON.stringify(exec.trigger_input.input || exec.trigger_input)
                              : String(exec.trigger_input)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE LOGS & EXECUTION TRACE */}
          {activeTab === "logs" && (
            <div className="p-6 sm:p-8 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-sm">
                    Pipeline Execution Audit Log
                  </h3>
                </div>
                <button
                  onClick={resetSimulation}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>

              {executionLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No test executions yet.</p>
                  <p className="text-[11px] mt-1 text-slate-600">
                    Click "Run Test Agent" in the top bar to simulate the full
                    pipeline with trigger, memory, and tool calls.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executionLogs.map((log, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase ${
                              log.stage === "trigger"
                                ? "bg-indigo-500/20 text-indigo-400"
                                : log.stage === "storage"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : log.stage === "tool_call"
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : log.stage === "agent"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {log.stage}
                          </span>
                          <span className="text-slate-300">{log.summary}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          {log.durationMs > 0 && (
                            <span>{log.durationMs}ms</span>
                          )}
                          <span>{log.timestamp}</span>
                        </div>
                      </div>

                      {log.data && Object.keys(log.data).length > 0 && (
                        <div className="p-2.5 rounded bg-slate-900/90 text-slate-300 text-[11px] overflow-x-auto">
                          <pre>{JSON.stringify(log.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
