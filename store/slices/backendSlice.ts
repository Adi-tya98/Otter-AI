import { StateCreator } from "zustand";
import {
  DEFAULT_BACKEND_URL,
  DeploymentInfo,
  checkBackendHealth,
  compileBackendWorkflow,
  executeBackendWorkflow,
  startDiscordTrigger,
  stopDiscordTrigger,
  startTelegramTrigger,
  stopTelegramTrigger,
  fetchBackendWorkflow,
  saveWorkflowBackend,
  activateWorkflowDeployment,
  deactivateWorkflowDeployment,
  fetchWorkflowDeployment,
  regenerateWebhookApiKey,
} from "@/lib/api";
import {
  agentDocumentToBackendWorkflow,
  agentDocumentToBackendSavePayload,
  backendWorkflowToAgentDocument,
  extractTriggerInput,
  backendExecutionToLogs,
} from "@/lib/workflowAdapter";
import { AgentDocument, createDefaultTriggerConfig } from "../types/agentTypes";
import type { AgentStoreState } from "../agentStore";

export interface BackendSlice {
  backendUrl: string;
  backendStatus: "checking" | "connected" | "offline";
  backendError: string | null;
  isCompiling: boolean;
  compiledWorkflowId: string | null;
  backendNodeCount: number | null;
  executionMode: "auto" | "backend" | "simulation";
  customTriggerInput: string;

  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  isLoadingWorkflow: boolean;
  deploymentInfo: DeploymentInfo | null;

  setBackendUrl: (url: string) => void;
  setExecutionMode: (mode: "auto" | "backend" | "simulation") => void;
  setCustomTriggerInput: (input: string) => void;

  loadWorkflowFromBackend: (docId: string) => Promise<boolean>;
  saveWorkflowToBackend: (
    docId?: string,
  ) => Promise<{ success: boolean; error?: string }>;

  checkBackendStatus: () => Promise<boolean>;
  compileToBackend: (
    agentId?: string,
  ) => Promise<{ success: boolean; nodeCount?: number; error?: string }>;
  executeOnBackend: (
    agentId?: string,
    customInput?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  toggleWorkflowActive: (agentId?: string) => Promise<{
    success: boolean;
    active: boolean;
    nodeCount?: number;
    error?: string;
  }>;

  loadDeploymentInfo: (workflowId?: string) => Promise<void>;
  regenerateApiKey: (workflowId?: string) => Promise<string | null>;
}

export const createBackendSlice: StateCreator<
  AgentStoreState,
  [],
  [],
  BackendSlice
> = (set, get) => ({
  backendUrl: DEFAULT_BACKEND_URL,
  backendStatus: "checking",
  backendError: null,
  isCompiling: false,
  compiledWorkflowId: null,
  backendNodeCount: null,
  executionMode: "auto",
  customTriggerInput: "",

  isSaving: false,
  hasUnsavedChanges: false,
  lastSavedAt: null,
  isLoadingWorkflow: false,
  deploymentInfo: null,

  setBackendUrl: (url: string) => set({ backendUrl: url }),
  setExecutionMode: (mode: "auto" | "backend" | "simulation") =>
    set({ executionMode: mode }),
  setCustomTriggerInput: (input: string) => set({ customTriggerInput: input }),

  loadWorkflowFromBackend: async (docId: string) => {
    if (!docId) return false;
    set({ isLoadingWorkflow: true, backendError: null });
    try {
      const backendWf = await fetchBackendWorkflow(docId, get().backendUrl);
      if (backendWf) {
        const loadedDoc = backendWorkflowToAgentDocument(backendWf);
        set((state) => {
          const existsIdx = state.agents.findIndex((a) => a.id === docId);
          let newAgents = [...state.agents];
          if (existsIdx >= 0) {
            newAgents[existsIdx] = loadedDoc;
          } else {
            newAgents = [loadedDoc, ...newAgents];
          }
          return {
            agents: newAgents,
            activeAgentId: loadedDoc.id,
            isLoadingWorkflow: false,
            hasUnsavedChanges: false,
            lastSavedAt: "Synced with DB",
          };
        });
        get().loadStoredExecutions(docId);
        return true;
      }
      set({ isLoadingWorkflow: false });
      return false;
    } catch (err: any) {
      console.warn("Workflow not found in backend or error, initializing fresh doc:", err);
      const existing = get().agents.find((a) => a.id === docId);
      if (existing) {
        set({
          activeAgentId: docId,
          isLoadingWorkflow: false,
          hasUnsavedChanges: false,
        });
        get().loadStoredExecutions(docId);
        return true;
      }

      // Create fresh default chat workflow
      const newDoc: AgentDocument = {
        id: docId,
        name: docId.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: "Autonomous AI agent workflow pipeline.",
        status: "draft",
        updatedAt: "Just now",
        trigger: createDefaultTriggerConfig("chat", `trig-${docId}`),
        agent: {
          id: `core-${docId}`,
          title: "Autonomous Decision Core",
          subtitle: "Processes trigger payload, queries storage, and executes configurable tools",
          model: "qwen/qwen3.8-27b",
          storage: { storageId: "memory-disabled", config: { enabled: false } },
          systemPrompt: "You are an Otter AI agent. Examine the incoming @trigger payload, execute required tools, and synthesize a clear result.",
          temperature: 0.2,
          reasoningMode: "fast",
          tools: [],
          responseFormat: "markdown",
          sampleOutput: { status: "Success", summary: "Request processed." },
        },
        output: {
          id: `out-${docId}`,
          type: "chat_response",
          title: "Chat Widget Response Stream",
          subtitle: "Delivers synthesized answers back to the user chat session",
          targetTrigger: "chat",
          badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          chatResponseConfig: {
            streamChunks: true,
            renderMarkdown: true,
            suggestedChips: [],
          },
          sampleResult: {
            format: "markdown",
            streaming: true,
          },
        },
      };

      set((state) => ({
        agents: [newDoc, ...state.agents],
        activeAgentId: newDoc.id,
        isLoadingWorkflow: false,
        hasUnsavedChanges: false,
      }));

      get().saveWorkflowToBackend(docId);
      return true;
    }
  },

  saveWorkflowToBackend: async (docId?: string) => {
    const doc = docId
      ? get().agents.find((a) => a.id === docId) || get().getActiveAgent()
      : get().getActiveAgent();
    if (!doc) return { success: false, error: "No active workflow to save" };

    set({ isSaving: true });
    try {
      const payload = agentDocumentToBackendSavePayload(doc);
      await saveWorkflowBackend(doc.id, payload, get().backendUrl);
      const nowStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      set({
        isSaving: false,
        hasUnsavedChanges: false,
        lastSavedAt: nowStr,
      });
      return { success: true };
    } catch (err: any) {
      console.error("Failed to save workflow to backend:", err);
      set({ isSaving: false });
      return { success: false, error: err.message || "Failed to save workflow" };
    }
  },

  checkBackendStatus: async () => {
    const { backendUrl } = get();
    set({ backendStatus: "checking", backendError: null });
    const health = await checkBackendHealth(backendUrl);
    if (health.ok) {
      set({ backendStatus: "connected", backendError: null });
      get().loadBackendTools();
      return true;
    } else {
      set({
        backendStatus: "offline",
        backendError: health.error || "Backend unreachable",
      });
      return false;
    }
  },

  compileToBackend: async (agentId?: string) => {
    const doc = agentId
      ? get().agents.find((a) => a.id === agentId) || get().getActiveAgent()
      : get().getActiveAgent();
    const { backendUrl } = get();
    set({ isCompiling: true, backendError: null });

    try {
      const backendWf = agentDocumentToBackendWorkflow(doc);
      const res = await compileBackendWorkflow(backendWf, backendUrl);
      set({
        isCompiling: false,
        backendStatus: "connected",
        compiledWorkflowId: res.workflow_id,
        backendNodeCount: res.node_count,
        backendError: null,
      });
      return { success: true, nodeCount: res.node_count };
    } catch (err: any) {
      set({
        isCompiling: false,
        backendError: err.message || "Failed to compile workflow",
      });
      return { success: false, error: err.message };
    }
  },

  toggleWorkflowActive: async (agentId?: string) => {
    const doc = agentId
      ? get().agents.find((a) => a.id === agentId) || get().getActiveAgent()
      : get().getActiveAgent();

    if (doc.status === "active") {
      // Deactivating: Clean up webhook registrations
      if (doc.trigger?.type === "discord") {
        try {
          await stopDiscordTrigger(doc.id, get().backendUrl);
        } catch (err) {
          console.error("Failed to deactivate Discord trigger:", err);
        }
      } else if (doc.trigger?.type === "telegram") {
        try {
          await stopTelegramTrigger(doc.id, get().backendUrl);
        } catch (err) {
          console.error("Failed to delete Telegram webhook:", err);
        }
      }

      // Mark deployment paused in PostgreSQL
      try {
        await deactivateWorkflowDeployment(doc.id, get().backendUrl);
        set((state) => ({
          deploymentInfo: state.deploymentInfo
            ? { ...state.deploymentInfo, status: "paused", is_active: false }
            : null,
        }));
      } catch (err) {
        console.error("Failed to pause deployment:", err);
      }

      get().updateMetadata({ status: "draft" });
      return { success: true, active: false };
    } else {
      // Activating: First compile workflow graph on backend
      const res = await get().compileToBackend(doc.id);
      if (res.success) {
        if (doc.trigger?.type === "discord") {
          try {
            const settings = doc.trigger.discordSettings || {
              applicationId: "",
              publicKey: "",
              webhookBaseUrl: "",
              commandName: "ask",
              autoReply: true,
            };
            await startDiscordTrigger(
              {
                workflow_id: doc.id,
                application_id: settings.applicationId?.trim() || "mock",
                public_key: settings.publicKey?.trim() || "mock",
                webhook_base_url: settings.webhookBaseUrl?.trim() || "http://localhost:8000",
                command_name: settings.commandName?.trim() || "ask",
                auto_reply: settings.autoReply ?? true,
                bot_token: settings.botToken?.trim() || "mock",
                channel_id: settings.channelId?.trim() || "mock",
              },
              get().backendUrl,
            );
          } catch (err: any) {
            console.error("Failed to activate Discord trigger:", err);
          }
        } else if (doc.trigger?.type === "telegram") {
          try {
            const settings = doc.trigger.telegramSettings || {
              botToken: "",
              webhookBaseUrl: "",
              allowedChatIds: "",
              commandPrefix: "",
              autoReply: true,
            };
            await startTelegramTrigger(
              {
                workflow_id: doc.id,
                bot_token: settings.botToken?.trim() || "mock",
                webhook_base_url: settings.webhookBaseUrl?.trim() || "http://localhost:8000",
                allowed_chat_ids: settings.allowedChatIds?.trim(),
                command_prefix: settings.commandPrefix?.trim(),
                auto_reply: settings.autoReply ?? true,
              },
              get().backendUrl,
            );
          } catch (err: any) {
            console.error("Failed to register Telegram webhook:", err);
          }
        }

        try {
          const triggerConfig = {
            chatSettings: doc.trigger?.chatSettings,
            webhookSecret: doc.trigger?.webhookSecret,
            telegramSettings: doc.trigger?.telegramSettings,
            discordSettings: doc.trigger?.discordSettings,
            samplePayload: doc.trigger?.samplePayload,
          };
          const depData = await activateWorkflowDeployment(
            doc.id,
            doc.trigger?.type,
            triggerConfig,
            get().backendUrl,
          );
          set({ deploymentInfo: depData });
        } catch (depErr) {
          console.error("Failed to register deployment in database:", depErr);
        }

        get().updateMetadata({ status: "active" });
        return { success: true, active: true, nodeCount: res.nodeCount };
      } else {
        return { success: false, active: false, error: res.error };
      }
    }
  },

  executeOnBackend: async (agentId?: string, customInput?: string) => {
    const doc = agentId
      ? get().agents.find((a) => a.id === agentId) || get().getActiveAgent()
      : get().getActiveAgent();
    const { backendUrl } = get();
    const input = extractTriggerInput(
      doc,
      customInput || get().customTriggerInput,
    );
    const startTime = Date.now();

    set({
      isRunning: true,
      activeExecutionStage: "trigger",
      executedStages: [],
      backendError: null,
      executionLogs: [
        {
          stage: "trigger",
          timestamp: new Date().toLocaleTimeString(),
          status: "running",
          durationMs: 0,
          summary: `Inbound Trigger [${doc.trigger.app}]: "${input.substring(0, 50)}${input.length > 50 ? "..." : ""}"`,
          data: { triggerInput: input },
        },
      ],
    });

    try {
      const backendWf = agentDocumentToBackendWorkflow(doc);
      set({ activeExecutionStage: "storage" });
      const compileRes = await compileBackendWorkflow(backendWf, backendUrl);
      set({
        compiledWorkflowId: backendWf.id,
        backendNodeCount: compileRes.node_count,
        executedStages: ["trigger", "storage"],
        activeExecutionStage: "agent",
      });

      const result = await executeBackendWorkflow(
        backendWf.id,
        input,
        backendUrl,
      );
      const durationMs = Date.now() - startTime;

      const logs = backendExecutionToLogs(doc, input, result, durationMs);
      const agentOutput = result["agent_core"] || Object.values(result)[0];

      if (agentOutput && agentOutput.output) {
        get().updateAgent({
          sampleOutput: {
            ...doc.agent.sampleOutput,
            final_output: agentOutput.output,
            tools_used: agentOutput.tools_used,
            iterations: agentOutput.iterations,
          },
        });
        get().updateOutput({
          sampleResult: {
            ...doc.output.sampleResult,
            rendered_reply: agentOutput.output,
            response_payload: {
              output: agentOutput.output,
              iterations: agentOutput.iterations,
            },
          },
        });
      }

      set({
        isRunning: false,
        activeExecutionStage: null,
        executedStages: ["trigger", "storage", "tool_call", "agent", "output"],
        executionLogs: logs,
        backendStatus: "connected",
        backendError: null,
      });

      return { success: true };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      set({
        isRunning: false,
        activeExecutionStage: null,
        backendError: err.message,
        executionLogs: [
          ...get().executionLogs,
          {
            stage: "agent",
            timestamp: new Date().toLocaleTimeString(),
            status: "error",
            durationMs,
            summary: `Backend execution error: ${err.message}`,
            data: { error: err.message },
          },
        ],
      });
      return { success: false, error: err.message };
    }
  },

  loadDeploymentInfo: async (workflowId?: string) => {
    const id = workflowId || get().getActiveAgent()?.id;
    if (!id) return;
    try {
      const info = await fetchWorkflowDeployment(id, get().backendUrl);
      set({ deploymentInfo: info });
    } catch (err) {
      console.warn("Could not load deployment info:", err);
    }
  },

  regenerateApiKey: async (workflowId?: string) => {
    const id = workflowId || get().getActiveAgent()?.id;
    if (!id) return null;
    try {
      const res = await regenerateWebhookApiKey(id, get().backendUrl);
      set((state) => ({
        deploymentInfo: state.deploymentInfo
          ? { ...state.deploymentInfo, api_key: res.api_key }
          : null,
      }));
      return res.api_key;
    } catch (err) {
      console.error("Failed to regenerate API key:", err);
      return null;
    }
  },
});
