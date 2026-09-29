import { StateCreator } from "zustand";
import {
  AvailableTool,
  ConfiguredTool,
  MCPServerConfig,
  AvailableStorage,
} from "../types/agentTypes";
import { AVAILABLE_TOOLS } from "../constants/tools";
import { AVAILABLE_MODELS, AVAILABLE_STORAGE_OPTIONS } from "../constants/models";
import { fetchAvailableTools } from "@/lib/api";
import type { AgentStoreState } from "../agentStore";

export interface ToolsSlice {
  availableTools: AvailableTool[];
  configuringToolInstanceId: string | null;
  isAddToolModalOpen: boolean;
  isMcpModalOpen: boolean;
  editingMcpServerId: string | null;

  getAvailableToolById: (id: string) => AvailableTool | undefined;
  getAvailableModelById: () => string[];
  getAvailableStorageById: (id: string) => AvailableStorage | undefined;
  loadBackendTools: () => Promise<void>;

  openAddToolModal: () => void;
  closeAddToolModal: () => void;
  openToolConfig: (instanceId: string) => void;
  closeToolConfig: () => void;

  addToolToAgent: (toolId: string, customName?: string) => string;
  removeToolFromAgent: (instanceId: string) => void;
  toggleToolStatus: (instanceId: string) => void;
  updateToolConfigValues: (
    instanceId: string,
    updates: { name?: string; config?: Record<string, any> },
  ) => void;

  openAddMcpModal: () => void;
  openEditMcpModal: (serverId: string) => void;
  closeMcpModal: () => void;
  addMcpServerToAgent: (server: Partial<MCPServerConfig>) => string;
  updateMcpServer: (serverId: string, patch: Partial<MCPServerConfig>) => void;
  removeMcpServer: (serverId: string) => void;
  toggleMcpServer: (serverId: string) => void;
}

export const createToolsSlice: StateCreator<
  AgentStoreState,
  [],
  [],
  ToolsSlice
> = (set, get) => ({
  availableTools: AVAILABLE_TOOLS,
  configuringToolInstanceId: null,
  isAddToolModalOpen: false,
  isMcpModalOpen: false,
  editingMcpServerId: null,

  getAvailableToolById: (id: string) => {
    return (
      get().availableTools.find((t) => t.id === id) ||
      AVAILABLE_TOOLS.find((t) => t.id === id)
    );
  },

  getAvailableModelById: () => {
    return AVAILABLE_MODELS;
  },

  getAvailableStorageById: (id: string) => {
    return AVAILABLE_STORAGE_OPTIONS.find((s) => s.id === id);
  },

  loadBackendTools: async () => {
    try {
      const backendTools = await fetchAvailableTools(get().backendUrl);
      if (Array.isArray(backendTools) && backendTools.length > 0) {
        set((state) => {
          const currentList = [...state.availableTools];
          for (const bt of backendTools) {
            const toolId = bt.id || bt.name;
            const existingIdx = currentList.findIndex((t) => t.id === toolId);
            const toolItem: AvailableTool = {
              id: toolId,
              name: bt.name,
              category: (bt.category as any) || "network",
              description: bt.description,
              iconName: bt.iconName || "Sparkles",
              badge: bt.badge || "Backend Native",
              isConfigurable: bt.isConfigurable ?? true,
              fields: (bt.fields as any) || [
                {
                  key: "tool_desc",
                  label: "Tool Description for LLM",
                  type: "text",
                  defaultValue: bt.description,
                  description: "Explains to the AI Agent when to invoke this tool",
                },
              ],
              defaultValues: bt.defaultValues || { tool_desc: bt.description },
              sampleExecutionOutput: { status: 200, result: "Success" },
            };
            if (existingIdx >= 0) {
              currentList[existingIdx] = { ...currentList[existingIdx], ...toolItem };
            } else {
              currentList.unshift(toolItem);
            }
          }
          return { availableTools: currentList };
        });
      }
    } catch {
      // Keep existing tools if backend is unreachable
    }
  },

  openAddToolModal: () => {
    set({ isAddToolModalOpen: true });
    get().loadBackendTools();
  },

  closeAddToolModal: () => set({ isAddToolModalOpen: false }),

  openToolConfig: (instanceId: string) =>
    set({ configuringToolInstanceId: instanceId }),

  closeToolConfig: () => set({ configuringToolInstanceId: null }),

  addToolToAgent: (toolId: string, customName?: string) => {
    const toolDef =
      get().availableTools.find((t) => t.id === toolId) ||
      AVAILABLE_TOOLS.find((t) => t.id === toolId);
    if (!toolDef) return "";

    const activeAgent = get().agents.find((a) => a.id === get().activeAgentId);
    let resolvedName = customName || toolDef.name;
    if (!customName && activeAgent) {
      const existingSameTools = activeAgent.agent.tools.filter(
        (t) => t.toolId === toolId,
      );
      if (existingSameTools.length > 0) {
        resolvedName = `${toolDef.name} ${existingSameTools.length + 1}`;
      }
    }

    const instanceId = `tool-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTool: ConfiguredTool = {
      instanceId,
      toolId,
      name: resolvedName,
      enabled: true,
      config: JSON.parse(JSON.stringify(toolDef.defaultValues || {})),
    };

    set((state) => ({
      isAddToolModalOpen: false,
      configuringToolInstanceId: instanceId,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              tools: [...agent.agent.tools, newTool],
            },
          };
        }
        return agent;
      }),
    }));

    return instanceId;
  },

  removeToolFromAgent: (instanceId: string) => {
    set((state) => ({
      configuringToolInstanceId:
        state.configuringToolInstanceId === instanceId
          ? null
          : state.configuringToolInstanceId,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              tools: agent.agent.tools.filter(
                (t) => t.instanceId !== instanceId,
              ),
            },
          };
        }
        return agent;
      }),
    }));
  },

  toggleToolStatus: (instanceId: string) => {
    set((state) => ({
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              tools: agent.agent.tools.map((t) =>
                t.instanceId === instanceId ? { ...t, enabled: !t.enabled } : t,
              ),
            },
          };
        }
        return agent;
      }),
    }));
  },

  updateToolConfigValues: (
    instanceId: string,
    updates: { name?: string; config?: Record<string, any> },
  ) => {
    set((state) => ({
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              tools: agent.agent.tools.map((t) => {
                if (t.instanceId === instanceId) {
                  return {
                    ...t,
                    name: updates.name !== undefined ? updates.name : t.name,
                    config:
                      updates.config !== undefined
                        ? { ...t.config, ...updates.config }
                        : t.config,
                  };
                }
                return t;
              }),
            },
          };
        }
        return agent;
      }),
    }));
  },

  openAddMcpModal: () => set({ isMcpModalOpen: true, editingMcpServerId: null }),

  openEditMcpModal: (serverId: string) =>
    set({ isMcpModalOpen: true, editingMcpServerId: serverId }),

  closeMcpModal: () => set({ isMcpModalOpen: false, editingMcpServerId: null }),

  addMcpServerToAgent: (server: Partial<MCPServerConfig>) => {
    const id = `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newServer: MCPServerConfig = {
      id,
      name: server.name || "MCP Server",
      transport: server.transport || "http",
      url: server.url || "http://localhost:8000/sse",
      headers: server.headers || {},
      command: server.command || "",
      args: server.args || [],
      env: server.env || {},
      enabled: true,
      discoveredTools: server.discoveredTools || [],
    };

    set((state) => ({
      hasUnsavedChanges: true,
      isMcpModalOpen: false,
      editingMcpServerId: null,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          const currentServers = agent.agent.mcpServers || [];
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              mcpServers: [...currentServers, newServer],
            },
          };
        }
        return agent;
      }),
    }));
    return id;
  },

  updateMcpServer: (serverId: string, patch: Partial<MCPServerConfig>) => {
    set((state) => ({
      hasUnsavedChanges: true,
      isMcpModalOpen: false,
      editingMcpServerId: null,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          const currentServers = agent.agent.mcpServers || [];
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              mcpServers: currentServers.map((s) =>
                s.id === serverId ? { ...s, ...patch } : s,
              ),
            },
          };
        }
        return agent;
      }),
    }));
  },

  removeMcpServer: (serverId: string) => {
    set((state) => ({
      hasUnsavedChanges: true,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          const currentServers = agent.agent.mcpServers || [];
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              mcpServers: currentServers.filter((s) => s.id !== serverId),
            },
          };
        }
        return agent;
      }),
    }));
  },

  toggleMcpServer: (serverId: string) => {
    set((state) => ({
      hasUnsavedChanges: true,
      agents: state.agents.map((agent) => {
        if (agent.id === state.activeAgentId) {
          const currentServers = agent.agent.mcpServers || [];
          return {
            ...agent,
            updatedAt: "Just now",
            agent: {
              ...agent.agent,
              mcpServers: currentServers.map((s) =>
                s.id === serverId ? { ...s, enabled: !s.enabled } : s,
              ),
            },
          };
        }
        return agent;
      }),
    }));
  },
});
