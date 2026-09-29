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
  getAgentMailTriggerStatus,
  simulateAgentMailTrigger,
} from "@/lib/api";
import { ToolConfigModal } from "@/components/ToolConfigModal";
import { AddToolModal } from "@/components/AddToolModal";
import { MCPServerModal } from "@/components/MCPServerModal";
import { WorkflowChatSidebar } from "@/components/WorkflowChatSidebar";
import { OtterLogo } from "@/components/OtterLogo";
import { WorkflowActiveToggle } from "@/components/WorkflowActiveToggle";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
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
  Server,
  Wrench,
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
  ChevronDown,
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
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Share2,
  Megaphone,
  Kanban,
  Table,
  CheckSquare,
  Clock,
  ListTodo,
} from "lucide-react";

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
    openAddMcpModal,
    openEditMcpModal,
    toggleMcpServer,
    removeMcpServer,
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
    chatMessages,
    sendWorkflowChatMessage,
    clearChatMessages,
  } = useAgentStore();

  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedDiscordUrl, setCopiedDiscordUrl] = useState(false);
  const [copiedTelegramUrl, setCopiedTelegramUrl] = useState(false);
  const [copiedAgentMailUrl, setCopiedAgentMailUrl] = useState(false);
  const [isSimulatingEmail, setIsSimulatingEmail] = useState(false);
  const [copiedPublicChat, setCopiedPublicChat] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [confirmClearExecutions, setConfirmClearExecutions] = useState(false);
  const [isClearingExecutions, setIsClearingExecutions] = useState(false);
  
  // Split-pane & Contextual Inspector State
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"config" | "chat" | "storage" | "logs">("config");
  const [testChatInput, setTestChatInput] = useState("");

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

  const [agentmailActive, setAgentmailActive] = useState(false);
  const [agentmailSimulateLoading, setAgentmailSimulateLoading] = useState(false);
  const [agentmailStatusMsg, setAgentmailStatusMsg] = useState<string | null>(null);
  const [agentmailSimulateSender, setAgentmailSimulateSender] = useState("sarah.chen@enterprise.io");
  const [agentmailSimulateSubject, setAgentmailSimulateSubject] = useState("Enterprise SLA and billing inquiry");
  const [agentmailSimulateBody, setAgentmailSimulateBody] = useState("Hi team, could you please verify our SLA response guarantee and send over current incident logs?");

  useEffect(() => {
    if (!activeDoc || activeDoc.trigger.type !== "agentmail") return;
    let isMounted = true;
    getAgentMailTriggerStatus(activeDoc.id, backendUrl)
      .then((res) => {
        if (isMounted) setAgentmailActive(Boolean(res?.is_active));
      })
      .catch(() => {
        if (isMounted) setAgentmailActive(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeDoc?.id, activeDoc?.trigger?.type, activeDoc?.status, backendUrl]);

  const handleSimulateAgentMail = async () => {
    if (!activeDoc) return;
    setAgentmailSimulateLoading(true);
    setAgentmailStatusMsg(null);
    try {
      const sender = agentmailSimulateSender.trim() || "sarah.chen@enterprise.io";
      const subject = agentmailSimulateSubject.trim() || "Enterprise SLA Inquiry";
      const body = agentmailSimulateBody.trim() || "Hi team, please check our current tier.";
      const res = await simulateAgentMailTrigger(
        activeDoc.id,
        sender,
        subject,
        body,
        backendUrl,
      );
      setAgentmailStatusMsg(`✔ Inbound email processed! Agent replied: "${(res.agent_response || '').substring(0, 90)}..."`);
      await executeOnBackend(
        activeDoc.id,
        `Inbound Email from ${sender}\nSubject: ${subject}\n\n${body}`,
      );
    } catch (err: any) {
      setAgentmailStatusMsg(`Simulation error: ${err.message || String(err)}`);
    } finally {
      setAgentmailSimulateLoading(false);
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
    setActiveRightTab("config");
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

  const handleCopyEmbed = () => {
    if (typeof navigator !== "undefined" && publicChatFullUrl) {
      const embedCode = `<iframe src="${publicChatFullUrl}" width="100%" height="650" frameborder="0" style="border-radius:12px;border:1px solid #1e293b;"></iframe>`;
      navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  const handleCopyCurlCommand = () => {
    if (typeof navigator !== "undefined" && webhookFullUrl) {
      const curlCmd = `curl -X POST "${webhookFullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${deploymentInfo?.api_key || activeDoc.trigger.webhookSecret || "YOUR_SECRET_KEY"}" \\
  -d '${JSON.stringify(activeDoc.trigger.samplePayload || { message: "Hello agent" })}'`;
      navigator.clipboard.writeText(curlCmd);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
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
      case "Megaphone":
        return <Megaphone className="w-4 h-4 text-fuchsia-400" />;
      case "Kanban":
        return <Kanban className="w-4 h-4 text-blue-400" />;
      case "Table":
        return <Table className="w-4 h-4 text-teal-400" />;
      case "Send":
        return <Send className="w-4 h-4 text-emerald-400" />;
      case "CheckSquare":
        return <CheckSquare className="w-4 h-4 text-violet-400" />;
      case "Bot":
        return <Bot className="w-4 h-4 text-orange-400" />;
      case "Clock":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "ListTodo":
        return <ListTodo className="w-4 h-4 text-lime-400" />;
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
      {/* Tool Configuration Modal, Add Tool Modal & MCP Server Modal */}
      <ToolConfigModal />
      <AddToolModal />
      <MCPServerModal />
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

      {/* 1. Studio Top Navigation Bar (Unified Sleek Single-Tier Header) */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 sm:px-5 py-2.5 flex items-center justify-between sticky top-0 z-40 gap-3">
        {/* Left Side: Brand, Breadcrumbs, Editable Name & Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors shrink-0"
            title="Back to Landing"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 shrink-0" />

          <Link href="/" className="shrink-0 flex items-center">
            <OtterLogo
              size={22}
              textClassName="text-sm font-bold tracking-tight text-white hidden md:inline"
            />
          </Link>

          <div className="h-4 w-px bg-slate-800 shrink-0 hidden md:block" />

          {/* Breadcrumb & Editable Agent Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs sm:text-sm">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-slate-200 transition-colors font-medium shrink-0 hidden sm:inline"
            >
              Dashboard
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>

            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
                autoFocus
                className="bg-slate-900 border border-cyan-500/60 rounded-lg px-2 py-0.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-[160px] sm:min-w-[220px]"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 font-bold text-white hover:text-cyan-300 transition-colors truncate text-left group cursor-pointer"
                title="Click to rename workflow"
              >
                <span className="truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                  {activeDoc.name}
                </span>
                <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors font-normal">
                  ✎
                </span>
              </button>
            )}

            {/* Status Pill */}
            <span
              className={`text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border shrink-0 ${
                activeDoc.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-800/80 text-slate-400 border-slate-750"
              }`}
            >
              {activeDoc.status === "active" ? "● Live Active" : "○ Draft"}
            </span>
          </div>
        </div>

        {/* Right Side: Fast Actions (Backend, Save, Pipeline Toggle, Deploy & Share, Test Chat) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Backend Connection Status Badge */}
          <button
            type="button"
            onClick={() => checkBackendStatus()}
            title="Click to check FastAPI backend connectivity (http://localhost:8000)"
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
              backendStatus === "connected"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : backendStatus === "checking"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
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
                  : "Offline"}
            </span>
          </button>

          {/* Save to PostgreSQL Status & Action */}
          <button
            onClick={() => saveWorkflowToBackend(activeDoc.id)}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
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
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">Save</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Saved</span>
              </>
            )}
          </button>

          {/* Active Workflow Toggle (Compiles graph on live status) */}
          <WorkflowActiveToggle size="md" />

          {/* Left Pane Collapse / Expand Toggle */}
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title={isLeftCollapsed ? "Expand pipeline pane" : "Collapse pipeline pane"}
          >
            {isLeftCollapsed ? (
              <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden lg:inline">{isLeftCollapsed ? "Show Flow" : "Collapse"}</span>
          </button>

          {/* Deploy & Share Modal Trigger Button */}
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/30 transition-all cursor-pointer shadow-xs"
            title="Open Deployment & Sharing Details"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Deploy & Share</span>
            {activeDoc.status === "active" && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Test Agent Quick Launch */}
          <button
            onClick={() => setActiveRightTab("chat")}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer bg-linear-to-r from-emerald-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-emerald-500/20"
            title="Open Interactive Test Chat"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Agent</span>
          </button>
        </div>
      </header>

      {/* Syncing with PostgreSQL Banner */}
      {isLoadingWorkflow && (
        <div className="bg-cyan-950/60 border-b border-cyan-800/40 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-cyan-300 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Synchronizing workflow configurations with PostgreSQL database...</span>
        </div>
      )}

      {/* Backend Error Banner */}
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

      {/* 🚀 DEPLOY & SHARE MODAL DIALOG */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Deploy & Share Agent</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        activeDoc.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {activeDoc.status === "active" ? "● Active & Live" : "○ Draft Mode"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Distribution endpoints and channels for "{activeDoc.name}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {activeDoc.status !== "active" ? (
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Agent is in Draft Mode</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    This workflow is currently inactive. Toggle the <strong>Live Active</strong> switch in the studio header to activate the real-time public chat URL, webhook listeners, or bot integrations.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <WorkflowActiveToggle size="md" />
                    <span className="text-[11px] text-slate-400 font-mono">
                      Click to activate immediately
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* CHAT TRIGGER DEPLOYMENT */}
                  {activeDoc.trigger.type === "chat" && (
                    <div className="space-y-4">
                      {/* Public End-User Chat Link */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            <span className="font-semibold text-white">Public End-User Chat URL</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Live & Ready
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">
                          Share this link with your users or teammates. They will access a clean, full-screen chat interface to converse with your AI agent.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black/60 px-3 py-2 rounded-lg border border-slate-800 text-emerald-300 font-mono text-xs truncate select-all">
                            {publicChatFullUrl}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyPublicChat}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            {copiedPublicChat ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPublicChat ? "Copied" : "Copy Link"}</span>
                          </button>
                          <a
                            href={`/chat/${activeDoc.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold hover:brightness-110 transition-all shrink-0 shadow-xs"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Embeddable Iframe Widget */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-cyan-400" />
                            <span className="font-semibold text-white">Embed Iframe Widget</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyEmbed}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {copiedEmbed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedEmbed ? "Copied" : "Copy Snippet"}</span>
                          </button>
                        </div>
                        <p className="text-slate-400 text-xs">
                          Embed this agent directly into your website, dashboard, or internal tool:
                        </p>
                        <pre className="bg-black/60 p-3 rounded-lg border border-slate-800 text-cyan-300 font-mono text-[11px] overflow-x-auto select-all">
{`<iframe
  src="${publicChatFullUrl}"
  width="100%"
  height="650"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #1e293b;"
></iframe>`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* WEBHOOK TRIGGER DEPLOYMENT */}
                  {activeDoc.trigger.type === "webhook" && (
                    <div className="space-y-4">
                      {/* Webhook Endpoint */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-400" />
                            <span className="font-semibold text-white">HTTP Webhook Endpoint</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                            POST
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black/60 px-3 py-2 rounded-lg border border-slate-800 text-cyan-300 font-mono text-xs truncate select-all">
                            {webhookFullUrl}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyWebhookUrl}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedWebhook ? "Copied" : "Copy URL"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Secret API Key */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-400" />
                            <span className="font-semibold text-white">Secret Bearer API Key</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRegenerateKey}
                            disabled={isRegeneratingKey}
                            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRegeneratingKey ? "animate-spin text-cyan-400" : ""}`} />
                            <span>Regenerate Key</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black/60 px-3 py-2 rounded-lg border border-slate-800 text-amber-300 font-mono text-xs truncate select-all">
                            {showApiKey
                              ? (deploymentInfo?.api_key || activeDoc.trigger.webhookSecret)
                              : `${(deploymentInfo?.api_key || activeDoc.trigger.webhookSecret || "").slice(0, 14)}••••••••••••••••`}
                          </code>
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title={showApiKey ? "Hide key" : "Show key"}
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyApiKey}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            {copiedApiKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedApiKey ? "Copied" : "Copy Key"}</span>
                          </button>
                        </div>
                      </div>

                      {/* cURL Example */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white font-mono text-xs">cURL Snippet</span>
                          <button
                            type="button"
                            onClick={handleCopyCurlCommand}
                            className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 cursor-pointer"
                          >
                            {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCurl ? "Copied" : "Copy cURL"}</span>
                          </button>
                        </div>
                        <pre className="bg-black/60 p-3 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto select-all">
{`curl -X POST "${webhookFullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${deploymentInfo?.api_key || activeDoc.trigger.webhookSecret || "YOUR_SECRET_KEY"}" \\
  -d '${JSON.stringify(activeDoc.trigger.samplePayload || { message: "Hello agent" })}'`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* TELEGRAM OR DISCORD BOT DEPLOYMENT */}
                  {(activeDoc.trigger.type === "telegram" || activeDoc.trigger.type === "discord") && (
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="w-5 h-5 text-indigo-400" />
                          <h4 className="font-bold text-white text-sm">
                            {activeDoc.trigger.type === "telegram" ? "Telegram Bot Listener" : "Discord Bot Listener"}
                          </h4>
                        </div>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Active Listener
                        </span>
                      </div>

                      <p className="text-slate-400 text-xs leading-relaxed">
                        {activeDoc.trigger.type === "telegram"
                          ? "Your FastAPI backend is actively listening for incoming webhook events from Telegram. Any messages or commands directed to the configured bot will be executed by this agent."
                          : "Your Discord bot listener is connected and listening for slash interactions (/ask). Incoming commands will be processed by the agent core and replied to in Discord."}
                      </p>

                      {activeDoc.trigger.type === "telegram" && activeDoc.trigger.telegramSettings?.botUsername && (
                        <div className="pt-2">
                          <a
                            href={`https://t.me/${activeDoc.trigger.telegramSettings.botUsername.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-sm shadow-sky-500/20"
                          >
                            <span>Open @{activeDoc.trigger.telegramSettings.botUsername.replace(/^@/, "")} on Telegram</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Real-time compilation and execution powered by FastAPI & Groq
              </span>
              <button
                type="button"
                onClick={() => setIsDeployModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer ml-auto"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SPLIT-PANE CONTAINER (Sequential Left Flow + Right Contextual Inspector) */}
      <div className="flex-1 w-full flex overflow-hidden min-h-[calc(100vh-57px)]">
        {/* ================= LEFT PANE: SEQUENTIAL WORKFLOW PIPELINE ================= */}
        {isLeftCollapsed ? (
          /* Mini Collapsed Rail (64px) */
          <div className="w-16 shrink-0 border-r border-slate-800/80 bg-slate-950 flex flex-col items-center py-4 gap-4 select-none">
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
              title="Expand Sequential Pipeline"
            >
              <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
            </button>

            <div className="w-8 h-px bg-slate-800" />

            {/* Mini Step 1: Trigger */}
            <button
              onClick={() => handleSelectComponent("trigger")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono transition-all cursor-pointer relative group ${
                selectedComponent === "trigger" && activeRightTab === "config"
                  ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
              title={`Stage 01: Trigger (${activeDoc.trigger.type})`}
            >
              1
              <span className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-lg">
                Stage 01: Trigger ({activeDoc.trigger.app})
              </span>
            </button>

            {/* Connector */}
            <div className="w-0.5 h-5 bg-slate-800/80 rounded-full" />

            {/* Mini Step 2: Agent & Tools */}
            <button
              onClick={() => handleSelectComponent("agent")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono transition-all cursor-pointer relative group ${
                selectedComponent === "agent" && activeRightTab === "config"
                  ? "bg-amber-500/25 text-amber-300 border border-amber-500 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
              title={`Stage 02: AI Agent & Tools (${activeDoc.agent.tools.length} tools)`}
            >
              2
              <span className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-lg">
                Stage 02: Agent & Tools ({activeDoc.agent.tools.length})
              </span>
            </button>

            {/* Connector */}
            <div className="w-0.5 h-5 bg-slate-800/80 rounded-full" />

            {/* Mini Step 3: Tied Output */}
            <button
              onClick={() => handleSelectComponent("output")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono transition-all cursor-pointer relative group ${
                selectedComponent === "output" && activeRightTab === "config"
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
              title={`Stage 03: Tied Output (${activeDoc.output.type})`}
            >
              3
              <span className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-lg">
                Stage 03: Output ({activeDoc.output.type})
              </span>
            </button>

            <div className="mt-auto flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  setActiveRightTab("storage");
                  loadStoredExecutions(activeDoc.id);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative group ${
                  activeRightTab === "storage"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500"
                    : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                }`}
                title="Storage & Retention"
              >
                <Database className="w-4 h-4" />
                <span className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-lg">
                  Storage & Retention
                </span>
              </button>

              <button
                onClick={() => setActiveRightTab("logs")}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative group ${
                  activeRightTab === "logs"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500"
                    : "bg-slate-900 text-slate-400 hover:text-white border-slate-800"
                }`}
                title="Live Audit Logs"
              >
                <Terminal className="w-4 h-4" />
                <span className="absolute left-full ml-3 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-lg">
                  Live Audit Logs
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Full Sequential Stepper Left Pane */
          <div className="w-full md:w-[380px] lg:w-[410px] shrink-0 border-r border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 flex flex-col gap-3.5 overflow-y-auto">
            {/* Pipeline Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Sequential Pipeline
                </span>
              </div>
              <button
                onClick={() => setIsLeftCollapsed(true)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                title="Collapse Pipeline Pane"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </button>
            </div>

            {/* STEP 1: TRIGGER */}
            <div
              onClick={() => handleSelectComponent("trigger")}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedComponent === "trigger" && activeRightTab === "config"
                  ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                  : "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/90 hover:border-slate-750"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs font-mono">
                      1
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                        Stage 01: Inbound
                      </span>
                      <h3 className="text-xs font-bold text-white">Trigger</h3>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {executedStages.includes("trigger") ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Received</span>
                      </div>
                    ) : activeExecutionStage === "trigger" ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Listening</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-800/60 px-1.5 py-0.5 rounded">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${activeDoc.trigger.badgeColor}`}>
                      {activeDoc.trigger.app}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      Type: {activeDoc.trigger.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 truncate">
                    {activeDoc.trigger.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {activeDoc.trigger.subtitle}
                  </p>
                </div>
              </div>

              {/* Payload keys summary */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center gap-1 overflow-hidden">
                <span className="text-[10px] text-slate-500 font-mono shrink-0">Payload:</span>
                {Object.keys(activeDoc.trigger.samplePayload || {}).slice(0, 2).map((key) => (
                  <span key={key} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 truncate max-w-[90px]">
                    @{key}
                  </span>
                ))}
                {Object.keys(activeDoc.trigger.samplePayload || {}).length > 2 && (
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                    +{Object.keys(activeDoc.trigger.samplePayload).length - 2}
                  </span>
                )}
              </div>
            </div>

            {/* FLOW CONNECTOR 1 -> 2 */}
            <div className="flex items-center justify-center -my-1.5 py-0.5 text-slate-600">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-3 bg-indigo-500/40" />
                <ChevronDown className="w-4 h-4 text-indigo-400 -mt-1" />
              </div>
            </div>

            {/* STEP 2: AGENT & TOOLS */}
            <div
              onClick={() => handleSelectComponent("agent")}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedComponent === "agent" && activeRightTab === "config"
                  ? "bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
                  : "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/90 hover:border-slate-750"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                      2
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                        Stage 02: Core
                      </span>
                      <h3 className="text-xs font-bold text-white">AI Agent & Tools</h3>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {executedStages.includes("agent") ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Synthesized</span>
                      </div>
                    ) : activeExecutionStage === "agent" || activeExecutionStage === "tool_call" ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>{activeExecutionStage === "tool_call" ? "Tools" : "Reasoning"}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-800/60 px-1.5 py-0.5 rounded">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30 truncate max-w-[140px]">
                      {currentModelDef || activeDoc.agent.model}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-mono">
                      {currentStorageDef?.name || "Session"}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 truncate">
                    {activeDoc.agent.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {activeDoc.agent.subtitle}
                  </p>
                </div>
              </div>

              {/* Tools count & policy */}
              <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">
                  Tools: <strong className="text-cyan-300">{activeDoc.agent.tools.length} active</strong>
                </span>
                <span className="text-slate-400">
                  Retention: <strong className="text-purple-300">{(activeDoc.executionStorage || "all") === "errors_only" ? "Errors" : (activeDoc.executionStorage || "all") === "none" ? "None" : "All"}</strong>
                </span>
              </div>
            </div>

            {/* FLOW CONNECTOR 2 -> 3 */}
            <div className="flex items-center justify-center -my-1.5 py-0.5 text-slate-600">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-3 bg-amber-500/40" />
                <ChevronDown className="w-4 h-4 text-amber-400 -mt-1" />
              </div>
            </div>

            {/* STEP 3: TIED OUTPUT */}
            <div
              onClick={() => handleSelectComponent("output")}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedComponent === "output" && activeRightTab === "config"
                  ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                  : "bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/90 hover:border-slate-750"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs font-mono">
                      3
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                        Stage 03: Return
                      </span>
                      <h3 className="text-xs font-bold text-white">Tied Output</h3>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {executedStages.includes("output") ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Returned</span>
                      </div>
                    ) : activeExecutionStage === "output" ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Sending</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-800/60 px-1.5 py-0.5 rounded">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${activeDoc.output.badgeColor}`}>
                      {activeDoc.output.type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono truncate">
                      → Bound: @{activeDoc.output.targetTrigger}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 truncate">
                    {activeDoc.output.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {activeDoc.output.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Target: @{activeDoc.output.targetTrigger}</span>
                <span className="text-emerald-400">Direct Return</span>
              </div>
            </div>

            {/* Bottom Retention & Log quick buttons */}
            <div className="mt-auto pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setActiveRightTab("storage");
                  loadStoredExecutions(activeDoc.id);
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  activeRightTab === "storage"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  <span>Execution Storage</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {(activeDoc.executionStorage || "all") === "errors_only" ? "Errors Only" : (activeDoc.executionStorage || "all") === "none" ? "None" : "All Runs"}
                </span>
              </button>

              <button
                onClick={() => setActiveRightTab("logs")}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  activeRightTab === "logs"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Live Audit Logs</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">
                  {executionLogs.length} events
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ================= RIGHT PANE: CONTEXTUAL INSPECTOR & CHAT RUNNER ================= */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-slate-900/40">
          {/* Top Sticky Inspector Tab Bar */}
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-1.5">
              {/* Tab 1: Step Config */}
              <button
                onClick={() => setActiveRightTab("config")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeRightTab === "config"
                    ? "bg-slate-800 text-white border border-slate-700 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Step Config</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    activeTab === "trigger"
                      ? "bg-indigo-500/20 text-indigo-300"
                      : activeTab === "agent"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {activeTab === "trigger" ? "01: Trigger" : activeTab === "agent" ? "02: Agent" : "03: Output"}
                </span>
              </button>

              {/* Tab 2: Test & Chat */}
              <button
                onClick={() => setActiveRightTab("chat")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeRightTab === "chat"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test & Chat</span>
                {chatMessages.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              {/* Tab 3: Storage & Retention */}
              <button
                onClick={() => {
                  setActiveRightTab("storage");
                  loadStoredExecutions(activeDoc.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeRightTab === "storage"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>Storage & Retention</span>
              </button>

              {/* Tab 4: Live Logs */}
              <button
                onClick={() => setActiveRightTab("logs")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeRightTab === "logs"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Logs ({executionLogs.length})</span>
              </button>
            </div>

            {/* Quick Context Actions */}
            <div className="flex items-center gap-2">
              {activeRightTab === "chat" && (
                <>
                  {chatMessages.length > 0 && (
                    <button
                      onClick={clearChatMessages}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-900/50 transition-colors cursor-pointer"
                      title="Clear Chat Messages"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Clear Chat</span>
                    </button>
                  )}
                  <button
                    onClick={() => openChatSidebar()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                    title="Open in Slide-over Drawer"
                  >
                    <Maximize2 className="w-3 h-3 text-cyan-400" />
                    <span className="hidden sm:inline">Drawer Mode</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sub-bar for Step Config (Allows fast switching right in the inspector) */}
          {activeRightTab === "config" && (
            <div className="px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Step Config:
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleSelectComponent("trigger")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      activeTab === "trigger"
                        ? "bg-indigo-500/20 text-indigo-300 font-semibold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    1. Trigger ({activeDoc.trigger.app})
                  </button>
                  <button
                    onClick={() => handleSelectComponent("agent")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      activeTab === "agent"
                        ? "bg-amber-500/20 text-amber-300 font-semibold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    2. Agent & Tools ({activeDoc.agent.tools.length})
                  </button>
                  <button
                    onClick={() => handleSelectComponent("output")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      activeTab === "output"
                        ? "bg-emerald-500/20 text-emerald-300 font-semibold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    3. Tied Output ({activeDoc.output.type})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: TRIGGER CONFIGURATION */}
          {activeRightTab === "config" && activeTab === "trigger" && (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                    {
                      type: "agentmail" as TriggerType,
                      title: "AgentMail",
                      desc: "Dedicated inbox receiving real-time emails via webhooks",
                      icon: <Mail className="w-5 h-5 text-emerald-400" />,
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

                  {/* 5. AGENTMAIL INBOUND EMAIL WEBHOOK */}
                  {activeDoc.trigger.type === "agentmail" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-emerald-400" />
                          AgentMail Inbound Email Configuration
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border ${
                            activeDoc.status === "active" && agentmailActive
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activeDoc.status === "active" && agentmailActive
                                ? "bg-emerald-400 animate-ping"
                                : "bg-slate-500"
                            }`}
                          />
                          {activeDoc.status === "active" && agentmailActive
                            ? "AgentMail Live"
                            : "Waiting for Inbound"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Agent Dedicated Email Address
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. support-agent@agentmail.to"
                            value={activeDoc.trigger.agentmailSettings?.inboxEmail || ""}
                            onChange={(e) =>
                              updateTrigger({
                                agentmailSettings: {
                                  ...(activeDoc.trigger.agentmailSettings || {}),
                                  inboxEmail: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Inbox ID (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="inbox_..."
                            value={activeDoc.trigger.agentmailSettings?.inboxId || ""}
                            onChange={(e) =>
                              updateTrigger({
                                agentmailSettings: {
                                  ...(activeDoc.trigger.agentmailSettings || {}),
                                  inboxId: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            AgentMail API Key
                          </label>
                          <input
                            type="password"
                            placeholder="am_... or env:AGENTMAIL_API_KEY"
                            value={activeDoc.trigger.agentmailSettings?.apiKey || ""}
                            onChange={(e) =>
                              updateTrigger({
                                agentmailSettings: {
                                  ...(activeDoc.trigger.agentmailSettings || {}),
                                  apiKey: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Webhook Secret (Optional Verification)
                          </label>
                          <input
                            type="text"
                            placeholder="Optional secret header"
                            value={activeDoc.trigger.agentmailSettings?.webhookSecret || ""}
                            onChange={(e) =>
                              updateTrigger({
                                agentmailSettings: {
                                  ...(activeDoc.trigger.agentmailSettings || {}),
                                  webhookSecret: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          ngrok / Public Webhook Base URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://xxxx.ngrok-free.app or https://api.yourdomain.com"
                          value={activeDoc.trigger.agentmailSettings?.webhookBaseUrl || ""}
                          onChange={(e) =>
                            updateTrigger({
                              agentmailSettings: {
                                ...(activeDoc.trigger.agentmailSettings || {}),
                                webhookBaseUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Copyable Webhook URL Box */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Your AgentMail Inbound Webhook URL:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const base =
                                activeDoc.trigger.agentmailSettings?.webhookBaseUrl?.trim() ||
                                "https://your-ngrok.ngrok-free.app";
                              const fullUrl = `${base.replace(/\/+$/, "")}/api/v1/triggers/agentmail/webhook/${activeDoc.id}`;
                              navigator.clipboard.writeText(fullUrl);
                              setCopiedAgentMailUrl(true);
                              setTimeout(() => setCopiedAgentMailUrl(false), 2000);
                            }}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
                          >
                            {copiedAgentMailUrl ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-sans">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy URL</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 font-mono text-xs text-emerald-300 break-all select-all">
                          {(
                            activeDoc.trigger.agentmailSettings?.webhookBaseUrl?.trim() ||
                            "https://your-ngrok.ngrok-free.app"
                          ).replace(/\/+$/, "")}
                          /api/v1/triggers/agentmail/webhook/{activeDoc.id}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Paste this URL in the{" "}
                          <a
                            href="https://console.agentmail.to"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline"
                          >
                            AgentMail Console
                          </a>{" "}
                          under Webhooks to receive incoming email notifications instantly.
                        </p>
                      </div>

                      {/* Auto-Reply to Thread toggle */}
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeDoc.trigger.agentmailSettings?.autoReply ?? true}
                          onChange={(e) =>
                            updateTrigger({
                              agentmailSettings: {
                                ...(activeDoc.trigger.agentmailSettings || {}),
                                autoReply: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300">
                          <strong className="text-white">Auto-Reply to Email Threads</strong> – Automatically dispatches the agent's completed answer back to the sender within the ongoing conversation thread.
                        </span>
                      </label>

                      {/* Simulation Section */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            Simulate Incoming Email Event
                          </label>
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Sender Email"
                                value={agentmailSimulateSender}
                                onChange={(e) => setAgentmailSimulateSender(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder="Subject Line"
                                value={agentmailSimulateSubject}
                                onChange={(e) => setAgentmailSimulateSubject(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Simulated email body inquiry..."
                                value={agentmailSimulateBody}
                                onChange={(e) => setAgentmailSimulateBody(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={handleSimulateAgentMail}
                                disabled={agentmailSimulateLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                              >
                                <Play className="w-3 h-3" />
                                {agentmailSimulateLoading ? "Testing..." : "Test Event"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {agentmailStatusMsg && (
                          <p className="text-[11px] font-mono text-emerald-300 bg-slate-950/60 p-2 rounded border border-slate-800">
                            {agentmailStatusMsg}
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
          {activeRightTab === "config" && activeTab === "agent" && (
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

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Link
                      href="/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                      title="Open full tools documentation catalog"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Tools Docs</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400/80" />
                    </Link>

                    <button
                      type="button"
                      onClick={openAddToolModal}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tool</span>
                    </button>
                  </div>
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
                            {/* Docs Link */}
                            <Link
                              href={`/docs?slug=tools/${getToolDocsSlug(tool.toolId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
                              title="View tool setup and credentials guide"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Docs</span>
                            </Link>

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

              {/* SECTION C.2: MODEL CONTEXT PROTOCOL (MCP) SERVERS */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-purple-400" />
                      <span>
                        Model Context Protocol (MCP) Servers ({(activeDoc.agent.mcpServers || []).length})
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Connect remote HTTP/SSE or local Stdio MCP servers. Discovered tools are dynamically loaded into your agent.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openAddMcpModal}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add MCP Server</span>
                  </button>
                </div>

                {/* List of Configured MCP Servers */}
                {(!activeDoc.agent.mcpServers || activeDoc.agent.mcpServers.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                    <Server className="w-7 h-7 text-slate-600 mx-auto" />
                    <div className="text-xs font-semibold text-slate-300">
                      No MCP Servers Attached
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Attach external MCP servers (e.g. GitHub, Filesystem, Slack, Database) to expand your agent&apos;s toolset automatically.
                    </p>
                    <button
                      type="button"
                      onClick={openAddMcpModal}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-purple-300 transition-colors cursor-pointer"
                    >
                      + Connect MCP Server
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeDoc.agent.mcpServers.map((server) => {
                      const toolCount = server.discoveredTools?.length || 0;
                      return (
                        <div
                          key={server.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            server.enabled
                              ? "bg-slate-950/90 border-slate-800 hover:border-purple-500/30 shadow-sm"
                              : "bg-slate-950/40 border-slate-900 opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                              {server.transport === "stdio" ? (
                                <Terminal className="w-4 h-4" />
                              ) : (
                                <Globe className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-white truncate">
                                  {server.name}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-950/50 border border-purple-500/30 text-purple-300 font-semibold">
                                  {server.transport}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                                  {toolCount} {toolCount === 1 ? "tool" : "tools"}
                                </span>
                                {!server.enabled && (
                                  <span className="text-[10px] text-amber-400 font-mono">
                                    Disabled
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-400 font-mono truncate mt-1">
                                {server.transport !== "stdio" ? (
                                  <span className="text-slate-300 truncate">
                                    {server.url}
                                  </span>
                                ) : (
                                  <span>
                                    Command:{" "}
                                    <strong className="text-indigo-300">
                                      {server.command} {(server.args || []).join(" ")}
                                    </strong>
                                  </span>
                                )}
                              </div>

                              {/* Tool names preview */}
                              {server.discoveredTools && server.discoveredTools.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {server.discoveredTools.slice(0, 5).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                                    >
                                      {t.name}
                                    </span>
                                  ))}
                                  {server.discoveredTools.length > 5 && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500">
                                      +{server.discoveredTools.length - 5} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleMcpServer(server.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                server.enabled
                                  ? "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300"
                                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              }`}
                            >
                              {server.enabled ? "Disable" : "Enable"}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditMcpModal(server.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
                            >
                              Edit / Inspect
                            </button>

                            <button
                              type="button"
                              onClick={() => removeMcpServer(server.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete MCP Server"
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

                {/* Deterministic Mode & Guardrails Shield Section */}
                <div className="lg:col-span-12 p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Guardrails & Deterministic Execution</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Enterprise Safety
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Enforce input sanitization, block destructive mutations, and guarantee reproducible outputs.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.agent.deterministic ?? true}
                          onChange={(e) =>
                            updateAgent({
                              deterministic: e.target.checked,
                              temperature: e.target.checked ? 0.0 : 0.2,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-2 text-xs font-semibold text-slate-300">
                          Deterministic Mode (seed=42)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Guardrail 1: Prompt Injection Defense */}
                    <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="guard_prompt_injection"
                        checked={activeDoc.agent.guardrails?.blockPromptInjection ?? true}
                        onChange={(e) =>
                          updateAgent({
                            guardrails: {
                              enabled: true,
                              blockPromptInjection: e.target.checked,
                              blockDestructiveTools: activeDoc.agent.guardrails?.blockDestructiveTools ?? true,
                              blockSsrf: activeDoc.agent.guardrails?.blockSsrf ?? true,
                              maskSecrets: activeDoc.agent.guardrails?.maskSecrets ?? true,
                              useLlamaGuard: activeDoc.agent.guardrails?.useLlamaGuard ?? false,
                            },
                          })
                        }
                        className="mt-0.5 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                      <label htmlFor="guard_prompt_injection" className="cursor-pointer space-y-1">
                        <span className="block text-xs font-semibold text-slate-200">
                          Prompt Injection Defense
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          Blocks jailbreak instructions, prompt leaks, and unauthorized overrides.
                        </span>
                      </label>
                    </div>

                    {/* Guardrail 2: Destructive Tools & SSRF Defense */}
                    <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="guard_destructive_tools"
                        checked={activeDoc.agent.guardrails?.blockDestructiveTools ?? true}
                        onChange={(e) =>
                          updateAgent({
                            guardrails: {
                              enabled: true,
                              blockPromptInjection: activeDoc.agent.guardrails?.blockPromptInjection ?? true,
                              blockDestructiveTools: e.target.checked,
                              blockSsrf: e.target.checked,
                              maskSecrets: activeDoc.agent.guardrails?.maskSecrets ?? true,
                              useLlamaGuard: activeDoc.agent.guardrails?.useLlamaGuard ?? false,
                            },
                          })
                        }
                        className="mt-0.5 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                      <label htmlFor="guard_destructive_tools" className="cursor-pointer space-y-1">
                        <span className="block text-xs font-semibold text-slate-200">
                          Tool Safety & SSRF Shield
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          Blocks DROP TABLE, cloud metadata probes (169.254.169.254), and mass deletes.
                        </span>
                      </label>
                    </div>

                    {/* Guardrail 3: Secret Leak Masking */}
                    <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="guard_mask_secrets"
                        checked={activeDoc.agent.guardrails?.maskSecrets ?? true}
                        onChange={(e) =>
                          updateAgent({
                            guardrails: {
                              enabled: true,
                              blockPromptInjection: activeDoc.agent.guardrails?.blockPromptInjection ?? true,
                              blockDestructiveTools: activeDoc.agent.guardrails?.blockDestructiveTools ?? true,
                              blockSsrf: activeDoc.agent.guardrails?.blockSsrf ?? true,
                              maskSecrets: e.target.checked,
                              useLlamaGuard: activeDoc.agent.guardrails?.useLlamaGuard ?? false,
                            },
                          })
                        }
                        className="mt-0.5 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                      <label htmlFor="guard_mask_secrets" className="cursor-pointer space-y-1">
                        <span className="block text-xs font-semibold text-slate-200">
                          Credential & Secret Masking
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          Redacts API keys, PATs, and credentials before returning final output.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Output Format Selector */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400 font-medium">Output Deterministic Format:</span>
                    <div className="flex items-center gap-2">
                      {(["markdown", "json", "text"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => updateAgent({ responseFormat: fmt })}
                          className={`px-3 py-1 rounded-md text-xs font-medium uppercase transition-colors cursor-pointer ${
                            (activeDoc.agent.responseFormat || "markdown") === fmt
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIED OUTPUT ACTION CONFIGURATION */}
          {activeRightTab === "config" && activeTab === "output" && (
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

                  {/* 5. AGENTMAIL EMAIL REPLY SETTINGS */}
                  {activeDoc.output.targetTrigger === "agentmail" && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            AgentMail Threaded Reply Settings
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            agentmail.to
                          </span>
                        </div>

                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-2.5 text-xs cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={
                                activeDoc.output.agentmailResponseConfig?.autoReply ?? true
                              }
                              onChange={(e) =>
                                updateOutput({
                                  agentmailResponseConfig: {
                                    ...(activeDoc.output.agentmailResponseConfig || {
                                      autoReply: true,
                                      replyToThread: true,
                                    }),
                                    autoReply: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 rounded border-slate-700 text-emerald-600 bg-slate-900 cursor-pointer"
                            />
                            <span className="text-slate-300">
                              <strong className="text-white">Auto-Reply to Originating Email</strong>{" "}
                              – Immediately sends an email reply once the agent finishes.
                            </span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={
                                activeDoc.output.agentmailResponseConfig?.replyToThread ?? true
                              }
                              onChange={(e) =>
                                updateOutput({
                                  agentmailResponseConfig: {
                                    ...(activeDoc.output.agentmailResponseConfig || {
                                      autoReply: true,
                                      replyToThread: true,
                                    }),
                                    replyToThread: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 rounded border-slate-700 text-emerald-600 bg-slate-900 cursor-pointer"
                            />
                            <span className="text-slate-300">
                              <strong className="text-white">Maintain Conversation Threading</strong>{" "}
                              – Retains the Thread-ID and In-Reply-To headers so replies group in the user's email client.
                            </span>
                          </label>

                          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300 mt-2">
                            <p className="leading-relaxed">
                              When an inbound email triggers this workflow, the agent's synthesized response will be formatted in clean HTML & Markdown and dispatched back via AgentMail to the sender's thread.
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

          {/* TAB: INTERACTIVE TEST & CHAT RUNNER */}
          {activeRightTab === "chat" && (
            <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-4xl mx-auto w-full">
              {/* Chat Sub-header inside panel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{activeDoc.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {activeDoc.agent.model.split("/").pop()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Live testing directly against compiled workflow pipeline ({activeDoc.trigger.type} trigger)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Interactive Runner
                  </span>
                  <button
                    onClick={() => openChatSidebar()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                    title="Expand to Full Height Slide-over Drawer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Drawer Mode</span>
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[360px]">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 my-auto">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-200 text-sm mb-1">
                      Ready to Test "{activeDoc.name}"
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
                      Send a test query to verify your agent's reasoning, tool execution, and tied outputs. Click a quick starter below:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                      {[
                        activeDoc.trigger.samplePayload?.message || "What product categories are available?",
                        "What active tools do you have access to?",
                        "Summarize your role and configuration",
                        "Calculate a sample test problem",
                      ].map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setTestChatInput(suggestion);
                            sendWorkflowChatMessage(suggestion);
                          }}
                          className="p-3 text-left rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
                        >
                          <span className="text-emerald-400 mr-2 group-hover:translate-x-0.5 inline-block transition-transform">→</span>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm ${
                            msg.role === "user"
                              ? "bg-cyan-600/20 text-cyan-100 border border-cyan-500/30 rounded-br-none"
                              : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-md"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-mono text-slate-400">
                            {msg.role === "user" ? (
                              <span className="flex items-center gap-1 font-semibold text-cyan-300">
                                <User className="w-3 h-3" />
                                You
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                <Bot className="w-3 h-3" />
                                Agent
                              </span>
                            )}
                            <span>•</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.durationMs && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono">{msg.durationMs}ms</span>
                              </>
                            )}
                          </div>

                          {msg.role === "user" ? (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : (
                            <div className="prose prose-invert prose-xs sm:prose-sm max-w-none">
                              <MarkdownRenderer content={msg.content} />
                            </div>
                          )}

                          {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono text-slate-400">Tools:</span>
                              {msg.toolsUsed.map((tool, ti) => (
                                <span
                                  key={ti}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isRunning && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 w-fit text-xs text-slate-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Agent is executing tools & synthesizing response...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!testChatInput.trim() || isRunning) return;
                  const prompt = testChatInput.trim();
                  setTestChatInput("");
                  sendWorkflowChatMessage(prompt);
                }}
                className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Type a test message or query for this agent... (Press Enter)"
                  value={testChatInput}
                  onChange={(e) => setTestChatInput(e.target.value)}
                  disabled={isRunning}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!testChatInput.trim() || isRunning}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB: EXECUTION & LOG STORAGE RETENTION POLICIES */}
          {(activeRightTab === "storage" || activeTab === "storage") && (
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
          {(activeRightTab === "logs" || activeTab === "logs") && (
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

                      {log.stage === "tool_call" && log.data?.executedTools ? (
                        <div className="space-y-2 mt-2">
                          {log.data.executedTools.map((t: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white font-mono">
                                    {t.displayName || t.name}
                                  </span>
                                  {t.source === "mcp" ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      MCP: {t.serverName || "server"}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      LOCAL
                                    </span>
                                  )}
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                                      t.status === "error"
                                        ? "bg-rose-500/20 text-rose-400"
                                        : "bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    {t.status || "success"}
                                  </span>
                                </div>

                                {t.durationMs !== undefined && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {t.durationMs}ms
                                  </span>
                                )}
                              </div>

                              {t.arguments && (
                                <div className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-900 overflow-x-auto">
                                  <span className="text-slate-500 uppercase font-semibold">Args: </span>
                                  {typeof t.arguments === "object"
                                    ? JSON.stringify(t.arguments)
                                    : String(t.arguments)}
                                </div>
                              )}

                              {t.result && (
                                <div className="text-[10px] font-mono text-cyan-300/90 bg-slate-950 p-2 rounded border border-slate-900 overflow-x-auto max-h-32">
                                  <span className="text-slate-500 uppercase font-semibold">Output: </span>
                                  {typeof t.result === "object"
                                    ? JSON.stringify(t.result, null, 2)
                                    : String(t.result)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        log.data && Object.keys(log.data).length > 0 && (
                          <div className="p-2.5 rounded bg-slate-900/90 text-slate-300 text-[11px] overflow-x-auto mt-2">
                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                          </div>
                        )
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
