import { StateCreator } from "zustand";
import {
  AgentDocument,
  ComponentStage,
  TriggerType,
  TriggerConfig,
  AgentConfig,
  OutputConfig,
  createDefaultTriggerConfig,
  createTiedOutputConfig,
} from "../types/agentTypes";
import { PRESET_AGENTS } from "../constants/presets";
import { AVAILABLE_STORAGE_OPTIONS } from "../constants/models";
import { stopDiscordTrigger, stopTelegramTrigger } from "@/lib/api";
import type { AgentStoreState } from "../agentStore";

export interface WorkflowSlice {
  agents: AgentDocument[];
  activeAgentId: string;
  selectedComponent: ComponentStage;

  getActiveAgent: () => AgentDocument;
  setActiveAgent: (id: string) => void;
  setSelectedComponent: (component: ComponentStage) => void;
  setTriggerType: (type: TriggerType) => void;

  updateMetadata: (metadata: {
    name?: string;
    description?: string;
    status?: "active" | "draft" | "paused";
  }) => void;
  updateTrigger: (updates: Partial<TriggerConfig>) => void;
  updateAgent: (updates: Partial<AgentConfig>) => void;
  updateOutput: (updates: Partial<OutputConfig>) => void;

  selectModel: (modelId: string) => void;
  selectStorage: (
    storageId: string,
    configUpdates?: Record<string, any>,
  ) => void;

  createAgent: (name?: string, triggerType?: TriggerType) => string;
  duplicateAgent: (agentId: string) => string;
  deleteAgent: (agentId: string) => void;
  loadPreset: (presetId: string) => void;
}

export const createWorkflowSlice: StateCreator<
  AgentStoreState,
  [],
  [],
  WorkflowSlice
> = (set, get) => ({
  agents: PRESET_AGENTS,
  activeAgentId: PRESET_AGENTS[0].id,
  selectedComponent: "agent",

  getActiveAgent: () => {
    const { agents, activeAgentId } = get();
    return agents.find((a) => a.id === activeAgentId) || agents[0];
  },

  setActiveAgent: (id: string) => {
    set({
      activeAgentId: id,
      selectedComponent: "agent",
      configuringToolInstanceId: null,
      isAddToolModalOpen: false,
      isRunning: false,
      activeExecutionStage: null,
      executedStages: [],
      executionLogs: [],
    });
  },

  setSelectedComponent: (component: ComponentStage) => {
    set({ selectedComponent: component });
  },

  // Switching trigger dynamically re-binds output action to match
  setTriggerType: (newType: TriggerType) => {
    const currentDoc = get().getActiveAgent();
    if (
      currentDoc &&
      currentDoc.status === "active" &&
      currentDoc.trigger.type === "discord" &&
      newType !== "discord"
    ) {
      stopDiscordTrigger(currentDoc.id, get().backendUrl).catch((err) =>
        console.error("Failed to stop Discord trigger on type change:", err),
      );
    }

    if (
      currentDoc &&
      currentDoc.status === "active" &&
      currentDoc.trigger.type === "telegram" &&
      newType !== "telegram"
    ) {
      stopTelegramTrigger(currentDoc.id, get().backendUrl).catch((err) =>
        console.error("Failed to stop Telegram trigger on type change:", err),
      );
    }

    set((state) => ({
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          const updatedTrigger = createDefaultTriggerConfig(
            newType,
            agent.trigger.id,
          );
          const updatedOutput = createTiedOutputConfig(newType);
          return {
            ...agent,
            updatedAt: "Just now",
            trigger: updatedTrigger,
            output: updatedOutput,
          };
        }
        return agent;
      }),
    }));
  },

  updateMetadata: (metadata) => {
    set((state) => ({
      hasUnsavedChanges: true,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            ...metadata,
            updatedAt: "Just now",
          };
        }
        return agent;
      }),
    }));
  },

  updateTrigger: (updates) => {
    set((state) => ({
      hasUnsavedChanges: true,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            updatedAt: "Just now",
            trigger: {
              ...agent.trigger,
              ...updates,
            },
          };
        }
        return agent;
      }),
    }));
  },

  updateAgent: (updates) => {
    set((state) => ({
      hasUnsavedChanges: true,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              ...updates,
            },
          };
        }
        return agent;
      }),
    }));
  },

  updateOutput: (updates) => {
    set((state) => ({
      hasUnsavedChanges: true,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            updatedAt: "Just now",
            output: {
              ...agent.output,
              ...updates,
            },
          };
        }
        return agent;
      }),
    }));
  },

  selectModel: (modelId: string) => {
    get().updateAgent({ model: modelId });
  },

  selectStorage: (storageId: string, configUpdates = {}) => {
    const storageDef = AVAILABLE_STORAGE_OPTIONS.find(
      (s) => s.id === storageId,
    );
    get().updateAgent({
      storage: {
        storageId,
        config: {
          ...(storageDef?.defaultConfig || {}),
          ...configUpdates,
        },
      },
    });
  },

  createAgent: (
    name = "Untitled Autonomous Agent",
    triggerType: TriggerType = "chat",
  ) => {
    const newId = `agent-${Date.now()}`;
    const newDoc: AgentDocument = {
      id: newId,
      name,
      description:
        "Generalized 3-stage agent pipeline with configurable tools and memory storage.",
      status: "draft",
      updatedAt: "Just now",
      trigger: createDefaultTriggerConfig(triggerType, `trig-${Date.now()}`),
      agent: {
        id: `core-${Date.now()}`,
        title: "Autonomous Decision Core",
        subtitle:
          "Processes trigger payload, queries storage, and executes configurable tools",
        model: "claude-3-7-sonnet",
        storage: {
          storageId: "memory-disabled",
          config: { enabled: false },
        },
        systemPrompt:
          "You are an Otter AI agent. Examine the incoming @trigger payload, execute required tools, and synthesize a clear result.",
        temperature: 0.2,
        reasoningMode: "fast",
        tools: [
          {
            instanceId: `tool-${Date.now()}-http`,
            toolId: "http_request",
            name: "HTTP Request",
            enabled: true,
            config: {
              method: "POST",
              url: "https://api.crm.example.com/v1/customers/@trigger.user_id",
              authType: "bearer",
              authToken: "env:CRM_SECRET_TOKEN",
              headers: [{ key: "Content-Type", value: "application/json" }],
              queryParams: [],
              bodyType: "json",
              body: '{\n  "user_id": "@trigger.user_id"\n}',
              timeoutMs: 4000,
            },
          },
        ],
        responseFormat: "markdown",
        sampleOutput: {
          status: "Success",
          summary: "Request processed with active tool calls.",
          confidence: "99%",
        },
      },
      output: createTiedOutputConfig(triggerType),
    };

    set((state) => ({
      agents: [newDoc, ...state.agents],
      activeAgentId: newId,
      selectedComponent: "agent",
      configuringToolInstanceId: null,
      isAddToolModalOpen: false,
      isRunning: false,
      activeExecutionStage: null,
      executedStages: [],
      executionLogs: [],
    }));

    return newId;
  },

  duplicateAgent: (agentId: string) => {
    const { agents } = get();
    const source = agents.find((a) => a.id === agentId);
    if (!source) return agentId;

    const newId = `agent-${Date.now()}`;
    const duplicated: AgentDocument = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (Copy)`,
      updatedAt: "Just now",
      status: "draft",
    };

    set((state) => ({
      agents: [duplicated, ...state.agents],
      activeAgentId: newId,
    }));

    return newId;
  },

  deleteAgent: (agentId: string) => {
    set((state) => {
      const remaining = state.agents.filter((a) => a.id !== agentId);
      const fallback =
        remaining.length > 0 ? remaining[0].id : state.activeAgentId;
      return {
        agents: remaining.length > 0 ? remaining : state.agents,
        activeAgentId:
          state.activeAgentId === agentId ? fallback : state.activeAgentId,
      };
    });
  },

  loadPreset: (presetId: string) => {
    const preset = PRESET_AGENTS.find((p) => p.id === presetId);
    if (preset) {
      get().setActiveAgent(preset.id);
    }
  },
});
