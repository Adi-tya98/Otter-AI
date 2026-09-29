export interface BackendToolDef {
  type: string;
  name?: string;
  config: Record<string, any>;
}

export interface BackendWorkflowNode {
  id: string;
  type: "agent";
  config: {
    model: string;
    temperature: number;
    max_iterations?: number;
    system_prompt: string;
    mcp_servers?: any[];
    deterministic?: boolean;
    seed?: number;
    response_format?: string;
    guardrails?: Record<string, any>;
    [key: string]: any;
  };
  tool?: BackendToolDef[];
  mcp_servers?: any[];
}

export interface BackendEdge {
  from: string;
  to: string;
}

export interface BackendWorkflow {
  id: string;
  nodes: BackendWorkflowNode[];
  edges: BackendEdge[];
}

export interface BackendCompileResponse {
  status: "compiled" | string;
  workflow_id: string;
  node_count: number;
}

export interface BackendExecuteResponseNode {
  node_id: string;
  output: string;
  tools_used: {
    name: string;
    args: string;
    result: any;
  }[];
  iterations: number;
}

export type BackendExecuteResponse = Record<string, BackendExecuteResponseNode>;

export interface BackendHealthResponse {
  status: string;
  message?: string;
}

export const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/**
 * Health check to verify if the FastAPI backend is running and reachable.
 */
export async function checkBackendHealth(
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ ok: boolean; status: string; url: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { ok: true, status: data.status || "healthy", url: backendUrl };
    }
    return {
      ok: false,
      status: `HTTP ${res.status}`,
      url: backendUrl,
      error: `Backend returned HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: "unreachable",
      url: backendUrl,
      error:
        err.name === "AbortError"
          ? "Connection timed out"
          : err.message || "Failed to reach backend",
    };
  }
}

export type StoragePolicy = "all" | "errors_only" | "none";

export interface BackendWorkflowItem {
  id: string;
  name: string;
  description?: string | null;
  graph: {
    nodes?: any[];
    edges?: any[];
  };
  is_active: boolean;
  execution_storage?: StoragePolicy;
  execution_log_storage?: StoragePolicy;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const effectiveToken =
    token ||
    (typeof window !== "undefined"
      ? (() => {
          try {
            const stored = localStorage.getItem("otter_auth_storage");
            if (stored) {
              const parsed = JSON.parse(stored);
              return parsed?.state?.token;
            }
          } catch {}
          return null;
        })()
      : null);

  if (effectiveToken) {
    headers["Authorization"] = `Bearer ${effectiveToken}`;
  }
  return headers;
}

/**
 * Fetch all workflows with item details from backend database.
 */
export async function fetchWorkflowsList(
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<{ items: BackendWorkflowItem[]; total: number; compiled: number }> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/workflows/`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to list workflows: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Save or update workflow nodes, edges, and configs in the database.
 */
export async function saveWorkflowBackend(
  workflowId: string,
  payload: {
    name?: string;
    description?: string;
    graph?: { nodes: any[]; edges: any[] };
    is_active?: boolean;
  },
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<{ status: string; workflow_id: string; name?: string }> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/workflows/${workflowId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to save workflow: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Rename a workflow in the database.
 */
export async function renameWorkflowBackend(
  workflowId: string,
  name: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<{ status: string; workflow_id: string; name: string }> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/workflows/${workflowId}/rename`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to rename workflow: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Delete a workflow from the database.
 */
export async function deleteWorkflowBackend(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<{ status: string; workflow_id: string }> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/workflows/${workflowId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete workflow: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch all workflows currently stored in backend in-memory registry.
 */
export async function fetchBackendWorkflows(
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ workflows: Record<string, any>; compiled: number }> {
  const res = await fetch(`${backendUrl}/api/v1/workflows/`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to list workflows: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch a single workflow by ID.
 */
export async function fetchBackendWorkflow(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<BackendWorkflow> {
  const res = await fetch(`${backendUrl}/api/v1/workflows/${workflowId}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Workflow '${workflowId}' not found on backend (HTTP ${res.status})`,
    );
  }
  return res.json();
}

/**
 * Store a workflow definition on the backend.
 */
export async function createBackendWorkflow(
  workflow: BackendWorkflow,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ status: string; workflow_id: string }> {
  const res = await fetch(`${backendUrl}/api/v1/workflows/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to create workflow on backend: ${errorText || res.statusText}`,
    );
  }
  return res.json();
}

/**
 * Compile a workflow on the backend (performs topological sort and instantiates nodes).
 */
export async function compileBackendWorkflow(
  workflow: BackendWorkflow,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<BackendCompileResponse> {
  const res = await fetch(`${backendUrl}/api/v1/workflows/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow }),
  });
  if (!res.ok) {
    let errorDetail = "";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(
      `Backend compilation failed: ${errorDetail || res.statusText}`,
    );
  }
  return res.json();
}

/**
 * Execute a compiled workflow on the backend with a trigger input string.
 */
export async function executeBackendWorkflow(
  workflowId: string,
  triggerInput: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
  timeoutMs: number = 60000,
): Promise<BackendExecuteResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `${backendUrl}/api/v1/workflows/execute/${workflowId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_input: triggerInput }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorDetail = "";
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch {
        errorDetail = await res.text();
      }
      throw new Error(
        `Execution error (HTTP ${res.status}): ${errorDetail || res.statusText}`,
      );
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Execution timed out after 60 seconds.");
    }
    throw err;
  }
}

/**
 * Initialize / start workflow state memory.
 */
export async function startBackendWorkflow(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ data: string }> {
  const res = await fetch(
    `${backendUrl}/api/v1/workflows/${workflowId}/start`,
    {
      method: "PATCH",
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to start workflow: HTTP ${res.status}`);
  }
  return res.json();
}

export interface BackendToolField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "boolean" | "key-value" | "json";
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: string } | string>;
  required?: boolean;
}

export interface BackendAvailableTool {
  id?: string;
  name: string;
  description: string;
  category?: "network" | "database" | "ai" | "utility" | "communication";
  iconName?: string;
  badge?: string;
  isConfigurable?: boolean;
  fields?: BackendToolField[];
  defaultValues?: Record<string, any>;
}

export async function fetchAvailableTools(
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<BackendAvailableTool[]> {
  const res = await fetch(`${backendUrl}/api/v1/agent/tools`, {
    method: "GET",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch tools from backend: HTTP ${res.status}`);
  }
  return res.json();
}

export const getAvailableToolsName = fetchAvailableTools;

/**
 * Configure and start Discord HTTP Interactions webhook on backend.
 */
export async function startDiscordTrigger(
  config: {
    workflow_id: string;
    application_id?: string;
    public_key?: string;
    webhook_base_url?: string;
    command_name?: string;
    auto_reply?: boolean;
    // Backwards compatibility
    bot_token?: string;
    channel_id?: string;
  },
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; status: string; workflow_id: string; interactions_url?: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/discord/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to start Discord trigger: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Stop or deactivate Discord trigger for a workflow.
 */
export async function stopDiscordTrigger(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; status: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/discord/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_id: workflowId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to stop Discord trigger: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Get live status of Discord interaction trigger for a workflow.
 */
export async function getDiscordTriggerStatus(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ workflow_id: string; status: string; is_active?: boolean; is_running?: boolean; interactions_url?: string; messages_processed: number }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/discord/status/${workflowId}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to get Discord trigger status: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Simulate an inbound Discord slash command / interaction against a workflow.
 */
export async function simulateDiscordTrigger(
  workflowId: string,
  content: string,
  channelId: string = "simulated-channel",
  authorUsername: string = "SimulatedUser",
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; simulated: boolean; workflow_id: string; input: string; status?: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/discord/simulate/${workflowId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      channel_id: channelId,
      author_username: authorUsername,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to simulate Discord trigger: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Register Telegram Webhook on backend (calls Telegram setWebhook via ngrok URL).
 */
export async function startTelegramTrigger(
  config: {
    workflow_id: string;
    bot_token?: string;
    webhook_base_url?: string;
    allowed_chat_ids?: string;
    command_prefix?: string;
    auto_reply?: boolean;
    secret_token?: string;
  },
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; status: string; workflow_id: string; webhook_url?: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/telegram/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to start Telegram trigger: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Stop/deregister Telegram Webhook for a workflow (calls Telegram deleteWebhook).
 */
export async function stopTelegramTrigger(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; status: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/telegram/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_id: workflowId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to stop Telegram trigger: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Get live status of Telegram webhook trigger for a workflow.
 */
export async function getTelegramTriggerStatus(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ workflow_id: string; status: string; is_active?: boolean; webhook_url?: string; messages_processed: number }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/telegram/status/${workflowId}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to get Telegram trigger status: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Simulate an inbound Telegram message update against a workflow.
 */
export async function simulateTelegramTrigger(
  workflowId: string,
  text: string,
  chatId: string = "12345678",
  username: string = "test_user",
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; simulated: boolean; workflow_id: string; input: string; result?: any }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/telegram/simulate/${workflowId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      chat_id: chatId,
      username,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to simulate Telegram trigger: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Register AgentMail Webhook on backend.
 */
export async function startAgentMailTrigger(
  config: {
    workflow_id: string;
    inbox_id?: string;
    inbox_email?: string;
    api_key?: string;
    webhook_secret?: string;
    webhook_base_url?: string;
    auto_reply?: boolean;
  },
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; status: string; workflow_id: string; webhook_url?: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/agentmail/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    throw new Error(`Failed to start AgentMail trigger: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Deactivate AgentMail trigger on backend.
 */
export async function stopAgentMailTrigger(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; workflow_id: string; status: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/agentmail/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_id: workflowId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to stop AgentMail trigger: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Get AgentMail trigger status.
 */
export async function getAgentMailTriggerStatus(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{
  workflow_id: string;
  status: string;
  is_active: boolean;
  webhook_url?: string;
  inbox_email?: string;
  inbox_id?: string;
  messages_processed: number;
}> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/agentmail/status/${workflowId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to get AgentMail trigger status: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Simulate an inbound email arrival via AgentMail.
 */
export async function simulateAgentMailTrigger(
  workflowId: string,
  sender: string = "sarah.chen@enterprise.io",
  subject: string = "Enterprise SLA Inquiry",
  body: string = "Hi! Can you confirm our active plan and response SLA?",
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ success: boolean; workflow_id: string; sender: string; subject: string; agent_response: string }> {
  const res = await fetch(`${backendUrl}/api/v1/triggers/agentmail/simulate/${workflowId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender,
      subject,
      body,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to simulate AgentMail email: HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================================
// 🚀 WORKFLOW DEPLOYMENT & PUBLIC AGENT INTERACTION APIS
// ============================================================================

export interface DeploymentInfo {
  id?: string;
  workflow_id: string;
  workflow_name: string;
  description?: string;
  status: "active" | "paused" | "inactive";
  is_active?: boolean;
  trigger_type: "chat" | "webhook" | "discord" | "telegram" | "agentmail";
  shareable_url?: string;
  webhook_url?: string;
  api_key?: string;
  require_api_key?: boolean;
  deployed_at?: string;
}

export interface PublicAgentInfo {
  workflow_id: string;
  name: string;
  description?: string;
  status: "active" | "paused";
  model?: string;
  welcome_message?: string;
  sample_prompts: string[];
}

/**
 * Deploy and activate a workflow in PostgreSQL.
 */
export async function activateWorkflowDeployment(
  workflowId: string,
  triggerType?: string,
  config?: Record<string, any>,
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<DeploymentInfo> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/deployments/${workflowId}/activate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      trigger_type: triggerType,
      trigger_config: config,
      require_api_key: config?.require_api_key ?? true,
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to activate deployment: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Pause / deactivate a workflow deployment.
 */
export async function deactivateWorkflowDeployment(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<{ status: string; workflow_id: string }> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/deployments/${workflowId}/deactivate`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to pause deployment: ${errorText || res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch current deployment configuration and URLs.
 */
export async function fetchWorkflowDeployment(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<DeploymentInfo> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/deployments/${workflowId}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch deployment info: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Regenerate the secure API key for a webhook deployment.
 */
export async function regenerateWebhookApiKey(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
  token?: string,
): Promise<{ status: string; api_key: string }> {
  const headers = getAuthHeaders(token);
  const res = await fetch(`${backendUrl}/api/v1/deployments/${workflowId}/regenerate-key`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to regenerate API key: ${err || res.statusText}`);
  }
  return res.json();
}

/**
 * Public execution endpoint for the standalone end-user /chat/[workflowId] interface.
 */
export async function executePublicChat(
  workflowId: string,
  message: string,
  sessionId?: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ response: string; execution_id: string; duration_ms: number }> {
  const res = await fetch(`${backendUrl}/api/v1/deployments/${workflowId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) {
    let errDetail = "";
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errDetail = await res.text();
    }
    throw new Error(errDetail || `Chat execution failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch public metadata (agent name, description, sample prompts) for the end-user chat UI.
 */
export async function fetchPublicAgentInfo(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<PublicAgentInfo> {
  const res = await fetch(`${backendUrl}/api/v1/deployments/${workflowId}/public-info`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch public agent info: HTTP ${res.status}`);
  }
  return res.json();
}

export interface StoredExecutionItem {
  id: string;
  workflow_id: string;
  deployment_id?: string | null;
  status: "completed" | "failed" | "running";
  trigger_input?: any;
  final_output?: any;
  duration_ms?: number;
  error_message?: string | null;
  logs_count: number;
  created_at: string;
}

/**
 * Fetch stored execution history for a workflow.
 */
export async function fetchWorkflowExecutions(
  workflowId: string,
  limit: number = 50,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ workflow_id: string; total: number; executions: StoredExecutionItem[] }> {
  const res = await fetch(`${backendUrl}/api/v1/workflows/${workflowId}/executions?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch workflow executions: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Clear/purge stored executions and logs for a workflow.
 */
export async function clearWorkflowExecutions(
  workflowId: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ status: string; deleted_count: number; message: string }> {
  const res = await fetch(`${backendUrl}/api/v1/workflows/${workflowId}/executions`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to clear workflow executions: HTTP ${res.status}`);
  }
  return res.json();
}

export interface MCPDiscoverPayload {
  server_id?: string;
  name: string;
  transport: "http" | "sse" | "stdio";
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

export interface MCPDiscoverResponse {
  status: string;
  server_name: string;
  transport: string;
  tool_count: number;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, any>;
  }>;
  latency_ms: number;
  message: string;
}

/**
 * Test connection and discover tools from an MCP server via backend.
 */
export async function discoverMcpToolsApi(
  payload: MCPDiscoverPayload,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<MCPDiscoverResponse> {
  const res = await fetch(`${backendUrl}/api/v1/mcp/discover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to discover MCP tools: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Test direct execution of an MCP tool via backend.
 */
export async function callMcpToolApi(
  payload: {
    server_id?: string;
    name: string;
    transport: string;
    url?: string;
    headers?: Record<string, string>;
    command?: string;
    args?: string[];
    tool_name: string;
    arguments?: Record<string, any>;
  },
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ status: string; tool_name: string; result: any; latency_ms: number }> {
  const res = await fetch(`${backendUrl}/api/v1/mcp/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to call MCP tool: HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Docs API Client: Fetch full documentation navigation tree
 */
export async function fetchDocsNavigation(
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{ categories: any[]; total_tools: number; total_guides: number }> {
  const res = await fetch(`${backendUrl}/api/v1/docs`, {
    method: "GET",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch docs navigation: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.data;
}

/**
 * Docs API Client: Fetch single document page content by slug
 */
export async function fetchDocContent(
  slug: string,
  backendUrl: string = DEFAULT_BACKEND_URL,
): Promise<{
  status: string;
  type: "guide" | "tool";
  slug: string;
  tool_id?: string;
  title: string;
  category: string;
  badge?: string;
  icon?: string;
  description?: string;
  content_markdown: string;
  parameters_schema?: any[];
  operations?: any[];
  sample_output?: any;
}> {
  const cleanSlug = slug.replace(/^\/+/, "");
  const res = await fetch(`${backendUrl}/api/v1/docs/${cleanSlug}`, {
    method: "GET",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch document: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.data;
}
