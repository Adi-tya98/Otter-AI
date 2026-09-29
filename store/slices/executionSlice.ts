import { StateCreator } from "zustand";
import { ComponentStage, ExecutionLog } from "../types/agentTypes";
import { AVAILABLE_STORAGE_OPTIONS } from "../constants/models";
import {
  StoragePolicy,
  StoredExecutionItem,
  fetchWorkflowExecutions,
  clearWorkflowExecutions,
} from "@/lib/api";
import type { AgentStoreState } from "../agentStore";

export interface ExecutionSlice {
  isRunning: boolean;
  activeExecutionStage: ComponentStage | "tool_call" | "storage" | null;
  executedStages: string[];
  executionLogs: ExecutionLog[];

  storedExecutions: StoredExecutionItem[];
  isLoadingExecutions: boolean;

  setExecutionStorage: (policy: StoragePolicy) => void;
  setExecutionLogStorage: (policy: StoragePolicy) => void;
  loadStoredExecutions: (workflowId?: string) => Promise<void>;
  clearStoredExecutions: (workflowId?: string) => Promise<void>;

  runSimulation: (overrideInput?: string) => Promise<void>;
  resetSimulation: () => void;
}

export const createExecutionSlice: StateCreator<
  AgentStoreState,
  [],
  [],
  ExecutionSlice
> = (set, get) => ({
  isRunning: false,
  activeExecutionStage: null,
  executedStages: [],
  executionLogs: [],

  storedExecutions: [],
  isLoadingExecutions: false,

  setExecutionStorage: (policy: StoragePolicy) => {
    set((state) => {
      const active = state.getActiveAgent();
      if (!active) return state;
      const updatedAgents = state.agents.map((ag) =>
        ag.id === active.id
          ? {
              ...ag,
              executionStorage: policy,
              updatedAt: "Just now",
            }
          : ag,
      );
      return {
        agents: updatedAgents,
        hasUnsavedChanges: true,
      };
    });
    const active = get().getActiveAgent();
    if (active) {
      get().saveWorkflowToBackend(active.id);
    }
  },

  setExecutionLogStorage: (policy: StoragePolicy) => {
    set((state) => {
      const active = state.getActiveAgent();
      if (!active) return state;
      const updatedAgents = state.agents.map((ag) =>
        ag.id === active.id
          ? {
              ...ag,
              executionLogStorage: policy,
              updatedAt: "Just now",
            }
          : ag,
      );
      return {
        agents: updatedAgents,
        hasUnsavedChanges: true,
      };
    });
    const active = get().getActiveAgent();
    if (active) {
      get().saveWorkflowToBackend(active.id);
    }
  },

  loadStoredExecutions: async (workflowId?: string) => {
    const id = workflowId || get().getActiveAgent()?.id;
    if (!id) return;
    set({ isLoadingExecutions: true });
    try {
      const data = await fetchWorkflowExecutions(id, 50, get().backendUrl);
      set({
        storedExecutions: data.executions || [],
        isLoadingExecutions: false,
      });
    } catch (err) {
      console.warn("Could not load stored executions:", err);
      set({ isLoadingExecutions: false });
    }
  },

  clearStoredExecutions: async (workflowId?: string) => {
    const id = workflowId || get().getActiveAgent()?.id;
    if (!id) return;
    set({ isLoadingExecutions: true });
    try {
      await clearWorkflowExecutions(id, get().backendUrl);
      set({
        storedExecutions: [],
        isLoadingExecutions: false,
      });
    } catch (err) {
      console.error("Failed to clear stored executions:", err);
      set({ isLoadingExecutions: false });
    }
  },

  runSimulation: async (overrideInput?: string) => {
    const { executionMode, executeOnBackend, checkBackendStatus } = get();
    const current = get().getActiveAgent();
    if (get().isRunning) return;

    // 1. If explicit Backend mode, run on backend directly
    if (executionMode === "backend") {
      await executeOnBackend(undefined, overrideInput);
      return;
    }

    // 2. If Auto mode, attempt backend execution if reachable
    if (executionMode === "auto") {
      const isHealthy = await checkBackendStatus();
      if (isHealthy) {
        const res = await executeOnBackend(undefined, overrideInput);
        if (res.success) {
          return;
        }
        return;
      }
    }

    // 3. Fallback Client Simulation
    set({
      isRunning: true,
      activeExecutionStage: "trigger",
      executedStages: [],
      executionLogs: [
        {
          stage: "trigger",
          timestamp: new Date().toLocaleTimeString(),
          status: "running",
          durationMs: 0,
          summary: `Receiving Inbound Trigger: [${current.trigger.app}] ${current.trigger.title}`,
          data: current.trigger.samplePayload,
        },
      ],
    });

    // Step 1: Trigger Received
    await new Promise((resolve) => setTimeout(resolve, 500));
    const storageOption = AVAILABLE_STORAGE_OPTIONS.find(
      (s) => s.id === current.agent.storage.storageId,
    );

    set((state) => ({
      executedStages: ["trigger"],
      activeExecutionStage: "storage",
      executionLogs: [
        {
          stage: "trigger",
          timestamp: new Date().toLocaleTimeString(),
          status: "success",
          durationMs: 48,
          summary: `Inbound Payload Parsed: ${Object.keys(current.trigger.samplePayload).length} keys mapped`,
          data: current.trigger.samplePayload,
        },
        {
          stage: "storage",
          timestamp: new Date().toLocaleTimeString(),
          status: "running",
          durationMs: 0,
          summary: `Querying Storage Backend: ${storageOption?.name || "Session Memory"}...`,
          data: current.agent.storage.config,
        },
      ],
    }));

    // Step 2: Storage Loaded
    await new Promise((resolve) => setTimeout(resolve, 600));
    set((state) => ({
      executedStages: ["trigger", "storage"],
      activeExecutionStage: "tool_call",
      executionLogs: [
        ...state.executionLogs.slice(0, -1),
        {
          stage: "storage",
          timestamp: new Date().toLocaleTimeString(),
          status: "success",
          durationMs: 62,
          summary: `Storage Verified: State synchronized with ${storageOption?.provider || "Engine"}`,
          data: {
            storage_id: current.agent.storage.storageId,
            status: "active",
          },
        },
        {
          stage: "tool_call",
          timestamp: new Date().toLocaleTimeString(),
          status: "running",
          durationMs: 0,
          summary: `Evaluating ${current.agent.tools.length} configured tools...`,
          data: {
            active_tools: current.agent.tools.map((t) => t.name),
          },
        },
      ],
    }));

    // Step 3: Tool Execution (if any enabled)
    await new Promise((resolve) => setTimeout(resolve, 750));
    const activeTools = current.agent.tools.filter((t) => t.enabled);
    const toolSummary =
      activeTools.length > 0
        ? `Executed [${activeTools.map((t) => t.name).join(", ")}] successfully`
        : "No active tools required for this pipeline";

    set((state) => ({
      executedStages: ["trigger", "storage", "tool_call"],
      activeExecutionStage: "agent",
      executionLogs: [
        ...state.executionLogs.slice(0, -1),
        {
          stage: "tool_call",
          timestamp: new Date().toLocaleTimeString(),
          status: "success",
          durationMs: 112,
          summary: toolSummary,
          data: {
            tools_executed: activeTools.map((t) => ({
              id: t.toolId,
              name: t.name,
              config: t.config,
            })),
          },
        },
        {
          stage: "agent",
          timestamp: new Date().toLocaleTimeString(),
          status: "running",
          durationMs: 0,
          summary: `Reasoning with ${current.agent.model} (${current.agent.reasoningMode} mode)...`,
          data: {},
        },
      ],
    }));

    // Step 4: LLM Agent Synthesizes response
    await new Promise((resolve) => setTimeout(resolve, 900));
    set((state) => ({
      executedStages: ["trigger", "storage", "tool_call", "agent"],
      activeExecutionStage: "output",
      executionLogs: [
        ...state.executionLogs.slice(0, -1),
        {
          stage: "agent",
          timestamp: new Date().toLocaleTimeString(),
          status: "success",
          durationMs: 380,
          summary: `Model Inference Complete: ${current.agent.model} synthesized structured response`,
          data: current.agent.sampleOutput,
        },
        {
          stage: "output",
          timestamp: new Date().toLocaleTimeString(),
          status: "running",
          durationMs: 0,
          summary: `Dispatching Output to Trigger Origin: ${current.output.title} (${current.output.targetTrigger})...`,
          data: {},
        },
      ],
    }));

    // Step 5: Output dispatched to Trigger Point
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      isRunning: false,
      activeExecutionStage: null,
      executedStages: ["trigger", "storage", "tool_call", "agent", "output"],
      executionLogs: [
        ...state.executionLogs.slice(0, -1),
        {
          stage: "output",
          timestamp: new Date().toLocaleTimeString(),
          status: "success",
          durationMs: 44,
          summary: `Delivered Successfully to ${current.output.title} (${current.output.targetTrigger})`,
          data: current.output.sampleResult,
        },
      ],
    }));
  },

  resetSimulation: () => {
    set({
      isRunning: false,
      activeExecutionStage: null,
      executedStages: [],
      executionLogs: [],
      backendError: null,
    });
  },
});
