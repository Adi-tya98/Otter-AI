import { create } from "zustand";
import { WorkflowSlice, createWorkflowSlice } from "./slices/workflowSlice";
import { ToolsSlice, createToolsSlice } from "./slices/toolsSlice";
import { BackendSlice, createBackendSlice } from "./slices/backendSlice";
import { ExecutionSlice, createExecutionSlice } from "./slices/executionSlice";
import { ChatSlice, createChatSlice } from "./slices/chatSlice";

// ==========================================
// COMPOSITE STORE STATE TYPE
// ==========================================
export type AgentStoreState = WorkflowSlice &
  ToolsSlice &
  BackendSlice &
  ExecutionSlice &
  ChatSlice;

// ==========================================
// ROOT ZUSTAND STORE (SLICES PATTERN)
// ==========================================
export const useAgentStore = create<AgentStoreState>()((...a) => ({
  ...createWorkflowSlice(...a),
  ...createToolsSlice(...a),
  ...createBackendSlice(...a),
  ...createExecutionSlice(...a),
  ...createChatSlice(...a),
}));

// ==========================================
// RE-EXPORTS FOR 100% BACKWARDS COMPATIBILITY
// ==========================================
export * from "./types/agentTypes";
export * from "./constants/models";
export * from "./constants/tools";
export * from "./constants/presets";
export * from "./slices/workflowSlice";
export * from "./slices/toolsSlice";
export * from "./slices/backendSlice";
export * from "./slices/executionSlice";
export * from "./slices/chatSlice";
