import { create } from "zustand";
import {
  checkBackendHealth,
  compileBackendWorkflow,
  executeBackendWorkflow,
  fetchAvailableTools,
  DEFAULT_BACKEND_URL,
  startDiscordTrigger,
  stopDiscordTrigger,
  startTelegramTrigger,
  stopTelegramTrigger,
  fetchBackendWorkflow,
  saveWorkflowBackend,
  DeploymentInfo,
  activateWorkflowDeployment,
  deactivateWorkflowDeployment,
  fetchWorkflowDeployment,
  regenerateWebhookApiKey,
  fetchWorkflowExecutions,
  clearWorkflowExecutions,
  StoredExecutionItem,
  StoragePolicy,
} from "@/lib/api";
import {
  agentDocumentToBackendWorkflow,
  agentDocumentToBackendSavePayload,
  backendWorkflowToAgentDocument,
  extractTriggerInput,
  backendExecutionToLogs,
  resolveBackendModel,
} from "@/lib/workflowAdapter";

export type ComponentStage = "trigger" | "agent" | "output";

// Generalized Triggers (for now: chat, webhook, telegram, discord)
export type TriggerType = "chat" | "webhook" | "telegram" | "discord";

// Output Actions are tied directly to respective trigger points
export type OutputType =
  | "chat_response"
  | "webhook_response"
  | "telegram_response"
  | "discord_reply";

// ==========================================
// BACKEND DUMMY DATA: AVAILABLE STORAGE OPTIONS
// ==========================================
export interface AvailableStorage {
  id: string;
  name: string;
  category: "memory" | "cache" | "database" | "vector";
  provider: string;
  description: string;
  iconName: string;
  features: string[];
  defaultConfig: Record<string, any>;
}

export const AVAILABLE_MODELS = [
  "whisper-large-v3-turbo",
  "groq/compound",
  "groq/compound-mini",
  "canopylabs/orpheus-v1-english",
  "openai/gpt-oss-120b",
  "whisper-large-v3",
  "allam-2-7b",
  "meta-llama/llama-prompt-guard-2-86m",
  "meta-llama/llama-prompt-guard-2-22m",
  "openai/gpt-oss-safeguard-20b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "canopylabs/orpheus-arabic-saudi",
];

export const AVAILABLE_STORAGE_OPTIONS: AvailableStorage[] = [
  {
    id: "memory-disabled",
    name: "Stateless (Memory Switched Off)",
    category: "memory",
    provider: "Stateless Engine",
    description:
      "Cross-execution workflow memory is currently switched off. Each workflow run executes independently without retaining context between runs.",
    iconName: "Zap",
    features: [
      "Stateless execution",
      "Memory switched off for now",
      "Independent workflow runs",
    ],
    defaultConfig: {
      enabled: false,
    },
  },
  {
    id: "memory-buffer",
    name: "In-Memory Session Window (Switched Off)",
    category: "memory",
    provider: "Local Worker Daemon",
    description:
      "Short-term sliding window of conversation turns (Switched off for multi-execution workflows).",
    iconName: "Zap",
    features: [
      "Switched off for now",
      "Sliding window of 10 messages",
      "Session-isolated",
    ],
    defaultConfig: {
      maxMessages: 10,
      ttlSeconds: 3600,
    },
  },
  {
    id: "redis-cache",
    name: "Redis State & Memory Cache (Switched Off)",
    category: "cache",
    provider: "Redis / Upstash",
    description:
      "Distributed key-value store with sub-millisecond retrieval (Switched off for now).",
    iconName: "Database",
    features: [
      "Switched off for now",
      "Configurable TTL",
      "Multi-replica persistence",
    ],
    defaultConfig: {
      connectionKey: "REDIS_URL_DEFAULT",
      ttlHours: 24,
      keyPrefix: "otter_agent_sess:",
    },
  },
  {
    id: "postgres-store",
    name: "PostgreSQL Relational Store (Switched Off)",
    category: "database",
    provider: "Postgres / Supabase",
    description:
      "ACID-compliant relational database for long-term customer logs (Switched off for now).",
    iconName: "Layers",
    features: ["Switched off for now", "Audit logs", "SQL joins"],
    defaultConfig: {
      tableName: "agent_conversation_history",
      autoCreateSchema: true,
    },
  },
  {
    id: "pinecone-vector",
    name: "Pinecone Vector Knowledge Base (Switched Off)",
    category: "vector",
    provider: "Pinecone",
    description:
      "Semantic vector memory for RAG document retrieval (Switched off for now).",
    iconName: "Sparkles",
    features: ["Switched off for now", "Top-K retrieval", "Automatic chunking"],
    defaultConfig: {
      indexName: "company-knowledge-prod",
      dimension: 1536,
      topK: 4,
    },
  },
];

// ==========================================
// BACKEND DUMMY DATA: AVAILABLE TOOLS (like n8n)
// ==========================================
export interface ToolFieldSchema {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "boolean"
    | "key-value"
    | "json";
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface AvailableTool {
  id: string;
  name: string;
  category: "network" | "database" | "ai" | "utility" | "communication";
  description: string;
  iconName: string;
  badge: string;
  isConfigurable: boolean;
  fields: ToolFieldSchema[];
  defaultValues: Record<string, any>;
  sampleExecutionOutput: Record<string, any>;
}

export const AVAILABLE_TOOLS: AvailableTool[] = [
  {
    id: "node_http_request",
    name: "HTTP Request",
    category: "network",
    description:
      "Make custom HTTP/REST API calls (GET, POST, PUT, DELETE, PATCH) with headers, auth, query params & body.",
    iconName: "Globe",
    badge: "Backend Native",
    isConfigurable: true,
    fields: [
      {
        key: "method",
        label: "HTTP Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
          { label: "PATCH", value: "PATCH" },
        ],
        defaultValue: "GET",
        required: true,
      },
      {
        key: "url",
        label: "Endpoint URL",
        type: "text",
        placeholder: "https://dummyjson.com/products/category-list or https://api.example.com/{variable}",
        defaultValue: "https://dummyjson.com/products/category-list",
        description: "Supports template variables in {brackets}",
        required: true,
      },
      {
        key: "headers",
        label: "Custom HTTP Headers",
        type: "key-value",
        description: "Additional headers passed with the request",
        defaultValue: [
          { key: "Content-Type", value: "application/json" },
          { key: "Accept", value: "application/json" },
        ],
      },
      {
        key: "body",
        label: "JSON / Text Body Template",
        type: "textarea",
        placeholder: '{\n  "query": "{variable}"\n}',
        defaultValue: "",
        description: "Payload sent with POST/PUT/PATCH requests",
      },
      {
        key: "authToken",
        label: "Auth Token / API Key",
        type: "text",
        placeholder: "Bearer token or API Key",
        defaultValue: "",
        description: "Optional authorization token passed to Authorization header",
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue: "Make HTTP requests to external APIs or services.",
        description: "System description provided to the LLM agent for when to call this tool",
      },
    ],
    defaultValues: {
      method: "GET",
      url: "https://dummyjson.com/products/category-list",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Accept", value: "application/json" },
      ],
      body: "",
      authToken: "",
      tool_desc: "Make HTTP requests to external APIs or services.",
    },
    sampleExecutionOutput: {
      status: 200,
      response: '["beauty", "fragrances", "furniture"]',
    },
  },
  {
    id: "http_request",
    name: "HTTP Request (Legacy Alias)",
    category: "network",
    description:
      "Make custom HTTP/REST API calls (GET, POST, PUT, DELETE, PATCH) with headers, auth, query params & body.",
    iconName: "Globe",
    badge: "Backend Native",
    isConfigurable: true,
    fields: [
      {
        key: "method",
        label: "HTTP Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
          { label: "PATCH", value: "PATCH" },
        ],
        defaultValue: "GET",
        required: true,
      },
      {
        key: "url",
        label: "Endpoint URL",
        type: "text",
        placeholder: "https://dummyjson.com/products/category-list or https://api.example.com/{variable}",
        defaultValue: "https://dummyjson.com/products/category-list",
        description: "Supports template variables in {brackets}",
        required: true,
      },
      {
        key: "headers",
        label: "Custom HTTP Headers",
        type: "key-value",
        description: "Additional headers passed with the request",
        defaultValue: [
          { key: "Content-Type", value: "application/json" },
          { key: "Accept", value: "application/json" },
        ],
      },
      {
        key: "body",
        label: "JSON / Text Body Template",
        type: "textarea",
        placeholder: '{\n  "query": "{variable}"\n}',
        defaultValue: "",
        description: "Payload sent with POST/PUT/PATCH requests",
      },
      {
        key: "authToken",
        label: "Auth Token / API Key",
        type: "text",
        placeholder: "Bearer token or API Key",
        defaultValue: "",
        description: "Optional authorization token passed to Authorization header",
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue: "Make HTTP requests to external APIs or services.",
        description: "System description provided to the LLM agent for when to call this tool",
      },
    ],
    defaultValues: {
      method: "GET",
      url: "https://dummyjson.com/products/category-list",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Accept", value: "application/json" },
      ],
      body: "",
      authToken: "",
      tool_desc: "Make HTTP requests to external APIs or services.",
    },
    sampleExecutionOutput: {
      status: 200,
      response: '["beauty", "fragrances", "furniture"]',
    },
  },
  {
    id: "get_weather",
    name: "Weather Information",
    category: "network",
    description:
      "Built-in Python backend tool to fetch real-time weather information for any city.",
    iconName: "Compass",
    badge: "Backend Native",
    isConfigurable: true,
    fields: [
      {
        key: "city",
        label: "Default City",
        type: "text",
        defaultValue: "London",
        description: "City to query for weather",
        required: true,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue: "Get the weather for a specific city.",
        description: "Explains to the AI Agent when to invoke this tool",
      },
    ],
    defaultValues: {
      city: "London",
      tool_desc: "Get the weather for a specific city.",
    },
    sampleExecutionOutput: {
      city: "London",
      temperature: "22",
      unit: "celsius",
    },
  },
  {
    id: "json_transform",
    name: "JSON Transform Extractor",
    category: "utility",
    description:
      "Built-in Python backend tool to extract specific keys from incoming data payloads.",
    iconName: "Code2",
    badge: "Backend Native",
    isConfigurable: true,
    fields: [
      {
        key: "key",
        label: "Target Key to Extract",
        type: "text",
        defaultValue: "output",
        description: "Key inside the JSON structure to extract",
        required: true,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue: "Extract a specific key from JSON data.",
        description: "Explains to the AI Agent how to extract specific JSON properties",
      },
    ],
    defaultValues: {
      key: "output",
      tool_desc: "Extract a specific key from JSON data.",
    },
    sampleExecutionOutput: {
      value: "Extracted property value",
    },
  },
  {
    id: "currency_converter",
    name: "Currency & Exchange Rates",
    category: "utility",
    description:
      "Real-time foreign exchange rates, currency conversion (USD, EUR, GBP, JPY, INR, etc.) and crypto spot prices.",
    iconName: "Coins",
    badge: "Live Finance",
    isConfigurable: true,
    fields: [
      {
        key: "base_currency",
        label: "Default Base Currency",
        type: "text",
        placeholder: "USD",
        defaultValue: "USD",
        description: "3-letter currency code to convert from (e.g. USD, EUR, GBP, INR)",
        required: true,
      },
      {
        key: "target_currencies",
        label: "Default Target Currencies",
        type: "text",
        placeholder: "EUR,GBP,JPY,CAD,INR",
        defaultValue: "EUR,GBP,JPY,CAD,INR",
        description: "Target currency code(s) or comma-separated list",
        required: true,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue:
          "Get live currency exchange rates and convert monetary amounts between currencies.",
        description: "Guides the AI agent on when and how to invoke this tool",
      },
    ],
    defaultValues: {
      base_currency: "USD",
      target_currencies: "EUR,GBP,JPY,CAD,INR",
      tool_desc:
        "Get live currency exchange rates and convert monetary amounts between currencies.",
    },
    sampleExecutionOutput: {
      base: "USD",
      amount: 100.0,
      converted_amount: 87.26,
      rates: { EUR: 0.8726, GBP: 0.7494, JPY: 157.89 },
    },
  },
  {
    id: "resend_email",
    name: "Resend Email Dispatcher",
    category: "communication",
    description:
      "Send dynamic transactional emails via Resend. The AI agent generates subject, content, and recipient address (supporting 'mail me').",
    iconName: "Mail",
    badge: "Resend API",
    isConfigurable: true,
    fields: [
      {
        key: "api_key",
        label: "Resend API Key",
        type: "text",
        placeholder: "re_123456789... or env:RESEND_API_KEY",
        defaultValue: "",
        description: "Your API key from resend.com/api-keys (supports env:VARIABLE)",
        required: true,
      },
      {
        key: "from_email",
        label: "Sender Email (From)",
        type: "text",
        placeholder: "onboarding@resend.dev or updates@yourdomain.com",
        defaultValue: "onboarding@resend.dev",
        description: "Verified sender address or onboarding@resend.dev for test mode",
        required: true,
      },
      {
        key: "default_user_email",
        label: "Default User Email ('Mail Me')",
        type: "text",
        placeholder: "user@example.com or @trigger.customer_email",
        defaultValue: "",
        description: "Destination email when user prompt says 'mail me' or asks to send to themselves",
        required: false,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue:
          "Send an email. Provide 'subject', 'content' (HTML or text), and 'to' (specify 'me' if user says mail me).",
        description: "Explains to the AI Agent when and how to invoke this tool",
        required: true,
      },
    ],
    defaultValues: {
      api_key: "",
      from_email: "onboarding@resend.dev",
      default_user_email: "",
      tool_desc:
        "Send an email. Provide 'subject', 'content' (HTML or text), and 'to' (specify 'me' if user says mail me).",
    },
    sampleExecutionOutput: {
      success: true,
      id: "email_resend_8829104",
      to: "user@example.com",
      from: "onboarding@resend.dev",
      subject: "Executive Summary & Report",
    },
  },
  {
    id: "web_search",
    name: "Live Web Search",
    category: "utility",
    description:
      "Real-time web search for current events, news, articles, and facts powered by DuckDuckGo (zero-auth, no API key required).",
    iconName: "Search",
    badge: "DuckDuckGo",
    isConfigurable: true,
    fields: [
      {
        key: "max_results",
        label: "Max Search Results",
        type: "number",
        placeholder: "5",
        defaultValue: 5,
        description: "Maximum number of search results to return to the agent (1-10)",
        required: false,
      },
      {
        key: "api_key",
        label: "Tavily API Key (Optional)",
        type: "text",
        placeholder: "tvly-xxx (Leave blank for free DuckDuckGo)",
        defaultValue: "",
        description: "Optional Tavily API key. If empty, uses free DuckDuckGo search.",
        required: false,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue:
          "Search the live web for recent news, facts, documentation, and current events using DuckDuckGo. Provide a specific search query.",
        description: "Guides the AI agent on when and how to perform web searches",
        required: true,
      },
    ],
    defaultValues: {
      max_results: 5,
      api_key: "",
      tool_desc:
        "Search the live web for recent news, facts, documentation, and current events using DuckDuckGo. Provide a specific search query.",
    },
    sampleExecutionOutput: {
      success: true,
      query: "latest AI developments",
      count: 2,
      results: [
        {
          title: "Artificial Intelligence Advances & Breakthroughs",
          url: "https://example.com/ai-news",
          snippet: "Researchers announce major milestones in autonomous reasoning workflows...",
        },
        {
          title: "State of AI Ecosystem Overview",
          url: "https://example.org/ai-overview",
          snippet: "Comprehensive analysis of modern agentic frameworks and tool orchestration...",
        },
      ],
    },
  },
  {
    id: "jina_reader",
    name: "Jina AI Webpage Reader",
    category: "utility",
    description:
      "Read and convert any webpage URL into clean, semantic Markdown using Jina AI Reader (r.jina.ai).",
    iconName: "BookOpen",
    badge: "r.jina.ai",
    isConfigurable: true,
    fields: [
      {
        key: "max_chars",
        label: "Max Content Characters",
        type: "number",
        placeholder: "4000",
        defaultValue: 4000,
        description: "Maximum characters to extract from page to preserve LLM token context",
        required: false,
      },
      {
        key: "api_key",
        label: "Jina API Key (Optional)",
        type: "text",
        placeholder: "jina_xxx (Leave blank for free public tier)",
        defaultValue: "",
        description: "Optional Jina AI Reader API key. If blank, uses free public tier.",
        required: false,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue:
          "Read and extract clean, readable Markdown content from any webpage URL using Jina AI Reader. Provide a valid URL.",
        description: "Instructs the AI agent on when and how to read web pages",
        required: true,
      },
    ],
    defaultValues: {
      max_chars: 4000,
      api_key: "",
      tool_desc:
        "Read and extract clean, readable Markdown content from any webpage URL using Jina AI Reader. Provide a valid URL.",
    },
    sampleExecutionOutput: {
      success: true,
      url: "https://example.com/docs",
      title: "Documentation Overview",
      returned_char_count: 1850,
      truncated: false,
      content: "# Documentation Overview\n\nThis guide explains how to configure and execute autonomous pipelines...",
    },
  },
  {
    id: "discord_webhook",
    name: "Discord Webhook",
    category: "communication",
    description:
      "Send formatted messages, alerts, and rich embed cards directly to any Discord channel with zero-auth setup.",
    iconName: "MessageSquare",
    badge: "Discord API",
    isConfigurable: true,
    fields: [
      {
        key: "webhook_url",
        label: "Discord Webhook URL",
        type: "text",
        placeholder: "https://discord.com/api/webhooks/... or env:DISCORD_WEBHOOK_URL",
        defaultValue: "",
        description: "Channel Webhook URL from Discord (Channel Settings > Integrations > Webhooks)",
        required: true,
      },
      {
        key: "bot_username",
        label: "Bot Display Name (Optional)",
        type: "text",
        placeholder: "Otter Agent",
        defaultValue: "Otter Agent",
        description: "Display name appearing on the Discord message",
        required: false,
      },
      {
        key: "avatar_url",
        label: "Bot Avatar URL (Optional)",
        type: "text",
        placeholder: "https://example.com/avatar.png",
        defaultValue: "",
        description: "Optional image URL for the Discord bot avatar",
        required: false,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue:
          "Send formatted notifications, alerts, or rich embed cards to a Discord channel via Webhook. Supports markdown text, custom titles, color accents, and key-value fields.",
        description: "Explains to the AI Agent when and how to post to Discord",
        required: true,
      },
    ],
    defaultValues: {
      webhook_url: "",
      bot_username: "Otter Agent",
      avatar_url: "",
      tool_desc:
        "Send formatted notifications, alerts, or rich embed cards to a Discord channel via Webhook. Supports markdown text, custom titles, color accents, and key-value fields.",
    },
    sampleExecutionOutput: {
      success: true,
      bot_username: "Otter Agent",
      title: "Daily Automation Summary",
      status: "Message successfully posted to Discord.",
    },
  },
  {
    id: "notion_page",
    name: "Notion",
    category: "utility",
    description:
      "Perform granular operations in Notion across Blocks, Database Pages, Pages, Databases, and Workspace Search.",
    iconName: "BookOpen",
    badge: "Notion API",
    isConfigurable: true,
    fields: [
      {
        key: "api_key",
        label: "Notion Integration Token",
        type: "text",
        placeholder: "secret_... or ntn_... or env:NOTION_API_KEY",
        defaultValue: "",
        description: "Internal integration secret from notion.so/my-integrations",
        required: true,
      },
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Page", value: "page" },
          { label: "Database Page", value: "database_page" },
          { label: "Block", value: "block" },
          { label: "Database", value: "database" },
          { label: "Data Source (Search)", value: "data_source" },
          { label: "Custom API Call", value: "custom_api_call" },
        ],
        defaultValue: "page",
        description: "The Notion resource entity to interact with",
        required: true,
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Create (Page / Row)", value: "create" },
          { label: "Get (Retrieve Details)", value: "get" },
          { label: "Update", value: "update" },
          { label: "Archive (Delete)", value: "archive" },
          { label: "Append After (Blocks)", value: "append_after" },
          { label: "Get Markdown (Blocks to MD)", value: "get_markdown" },
          { label: "Get Many (Raw Blocks)", value: "get_many" },
          { label: "Query (Filter Database)", value: "query" },
          { label: "Search (Workspace)", value: "search" },
          { label: "Custom Call", value: "custom_call" },
        ],
        defaultValue: "create",
        description: "The operation to perform on the selected resource",
        required: true,
      },
      {
        key: "parent_id",
        label: "Parent Page ID / URL",
        type: "text",
        placeholder: "32-char UUID or full Notion URL (https://notion.so/...)",
        defaultValue: "",
        description: "Destination parent page for creating subpages",
      },
      {
        key: "database_id",
        label: "Database ID / URL",
        type: "text",
        placeholder: "32-char UUID or full Notion URL (https://notion.so/...)",
        defaultValue: "",
        description: "Target Notion Database for rows or queries",
      },
      {
        key: "block_id",
        label: "Block ID / URL",
        type: "text",
        placeholder: "32-char UUID or full Notion URL (https://notion.so/...)",
        defaultValue: "",
        description: "Target block or page to append or read blocks from",
      },
      {
        key: "page_id",
        label: "Page ID / URL",
        type: "text",
        placeholder: "32-char UUID or full Notion URL (https://notion.so/...)",
        defaultValue: "",
        description: "Target page ID for get, update, or archive operations",
      },
      {
        key: "search_query",
        label: "Default Search Query",
        type: "text",
        placeholder: "e.g. quarterly goals or leave empty for agent input",
        defaultValue: "",
        description: "Optional fixed search term for workspace search",
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue:
          "Perform granular operations in Notion across Blocks, Database Pages, Pages, Databases, and Workspace Search.",
        description: "Guides the AI agent on when and how to invoke this Notion operation",
        required: true,
      },
    ],
    defaultValues: {
      api_key: "",
      resource: "page",
      operation: "create",
      parent_id: "",
      database_id: "",
      block_id: "",
      page_id: "",
      search_query: "",
      filter_type: "all",
      tool_desc:
        "Perform granular operations in Notion across Blocks, Database Pages, Pages, Databases, and Workspace Search.",
    },
    sampleExecutionOutput: {
      success: true,
      resource: "page",
      operation: "create",
      page_id: "9a38f192-3b4a-4e89-b2c3-9840218fa201",
      url: "https://notion.so/9a38f1923b4a4e89b2c39840218fa201",
      title: "Autonomous Research Report",
      icon: "📄",
      blocks_count: 14,
      status: "Successfully created Notion page 'Autonomous Research Report'.",
    },
  },
  {
    id: "discord_read_messages",
    name: "Discord Message Reader",
    category: "communication",
    description:
      "Read and fetch recent chat messages from a Discord channel using a Discord Bot Token.",
    iconName: "MessageSquare",
    badge: "Discord Bot API",
    isConfigurable: true,
    fields: [
      {
        key: "bot_token",
        label: "Discord Bot Token",
        type: "text",
        placeholder: "Bot OTcw... or env:DISCORD_BOT_TOKEN",
        defaultValue: "",
        description: "Bot Token from discord.com/developers/applications (supports env:VARIABLE)",
        required: true,
      },
      {
        key: "channel_id",
        label: "Default Channel ID",
        type: "text",
        placeholder: "128491029481928401",
        defaultValue: "",
        description: "Right click channel in Discord > Copy Channel ID",
        required: true,
      },
      {
        key: "default_limit",
        label: "Default Message Limit",
        type: "number",
        placeholder: "10",
        defaultValue: 10,
        description: "Number of recent messages to fetch (1-50)",
        required: false,
      },
      {
        key: "tool_desc",
        label: "Tool Description for LLM",
        type: "text",
        defaultValue:
          "Read and fetch recent chat messages from a Discord channel. Allows the AI agent to read what users said, check questions, or review conversations.",
        description: "Guides the AI agent on when and how to read Discord channel history",
        required: true,
      },
    ],
    defaultValues: {
      bot_token: "",
      channel_id: "",
      default_limit: 10,
      tool_desc:
        "Read and fetch recent chat messages from a Discord channel. Allows the AI agent to read what users said, check questions, or review conversations.",
    },
    sampleExecutionOutput: {
      success: true,
      channel_id: "128491029481928401",
      count: 2,
      messages: [
        {
          id: "128491029481928401",
          author: "alex_developer",
          display_name: "Alex",
          content: "Payment webhook is throwing 500 errors around 10am UTC.",
          timestamp: "2026-09-24T18:15:30Z",
          attachments: [],
        },
      ],
      status: "Successfully retrieved 2 messages.",
    },
  },
];

// ==========================================
// CONFIGURED TOOL INSTANCE ON AN AGENT
// ==========================================
export interface ConfiguredTool {
  instanceId: string;
  toolId: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

// ==========================================
// TRIGGER CONFIGURATIONS
// ==========================================
export interface TriggerConfig {
  id: string;
  type: TriggerType;
  title: string;
  subtitle: string;
  app: string;
  badgeColor: string;
  // Chat Interface settings
  chatSettings?: {
    welcomeMessage: string;
    placeholder: string;
    streamingEnabled: boolean;
    requireAuth: boolean;
  };
  // Webhook settings
  webhookEndpoint?: string;
  webhookSecret?: string;
  httpMethod?: "POST" | "PUT";
  filterRule?: string;
  // Telegram Bot settings (Pure push webhook via ngrok)
  telegramSettings?: {
    botUsername?: string;
    botToken: string;
    webhookBaseUrl?: string; // ngrok public URL: e.g. https://xxxx.ngrok-free.app
    allowedChatIds?: string;
    commandPrefix?: string;
    autoReply: boolean;
    pollingMode?: "webhook" | "polling";
  };
  // Discord Bot settings (HTTP Interactions Webhook via ngrok)
  discordSettings?: {
    applicationId?: string;
    publicKey?: string;
    webhookBaseUrl?: string; // ngrok public URL: e.g. https://xxxx.ngrok-free.app
    commandName?: string;
    autoReply: boolean;
    botToken?: string;
    channelId?: string;
    triggerMode?: "mention_only" | "specific_channels" | "prefix" | "direct_messages";
    commandPrefix?: string;
  };
  samplePayload: Record<string, any>;
}

// ==========================================
// AI AGENT CONFIGURATION
// ==========================================
export interface AgentConfig {
  id: string;
  title: string;
  subtitle: string;
  model: string; // Refers to AvailableModel.id
  storage: {
    storageId: string; // Refers to AvailableStorage.id
    config: Record<string, any>;
  };
  systemPrompt: string;
  temperature: number;
  reasoningMode: "fast" | "balanced" | "deep";
  tools: ConfiguredTool[]; // Generalized configured tools!
  responseFormat: "markdown" | "json" | "text";
  sampleOutput: Record<string, any>;
}

// ==========================================
// OUTPUT ACTION CONFIGURATION (Tied to Trigger!)
// ==========================================
export interface OutputConfig {
  id: string;
  type: OutputType;
  title: string;
  subtitle: string;
  targetTrigger: TriggerType; // Strictly bound to trigger point!
  badgeColor: string;
  // Output specifics per trigger point
  chatResponseConfig?: {
    streamChunks: boolean;
    renderMarkdown: boolean;
    suggestedChips: string[];
  };
  webhookResponseConfig?: {
    statusCode: number;
    contentType: "application/json" | "text/plain";
    responseTemplate: string;
  };
  telegramResponseConfig?: {
    parseMode: "MarkdownV2" | "HTML";
    replyToMessage: boolean;
    inlineButtons?: { text: string; callbackData: string }[];
  };
  discordResponseConfig?: {
    replyToMessage: boolean;
    autoReply: boolean;
  };
  sampleResult: Record<string, any>;
}

// ==========================================
// AGENT DOCUMENT (Generalized 3-Component Pipeline)
// ==========================================
export interface AgentDocument {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft" | "paused";
  updatedAt: string;
  // Execution & Logs Retention Policy
  executionStorage?: StoragePolicy;
  executionLogStorage?: StoragePolicy;
  // Generalized 3-Stage Pipeline:
  // 1. Trigger (Chat / Webhook / Telegram)
  // 2. Agent Core (Model + Storage + Configurable Tools)
  // 3. Output Action (Outputs back to the respective trigger point!)
  trigger: TriggerConfig;
  agent: AgentConfig;
  output: OutputConfig;
}

export interface ExecutionLog {
  stage: ComponentStage | "tool_call" | "storage";
  timestamp: string;
  status: "pending" | "running" | "success" | "error";
  durationMs: number;
  summary: string;
  data: Record<string, any>;
}

export interface WorkflowChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  durationMs?: number;
}

interface AgentStoreState {
  // Collection & Active Agent
  agents: AgentDocument[];
  activeAgentId: string;
  selectedComponent: ComponentStage;

  // Chat Sidebar State
  isChatSidebarOpen: boolean;
  chatMessages: WorkflowChatMessage[];

  // Modals & Active Tool Editing
  configuringToolInstanceId: string | null;
  isAddToolModalOpen: boolean;

  // Execution & Simulation state
  isRunning: boolean;
  activeExecutionStage: ComponentStage | "tool_call" | "storage" | null;
  executedStages: string[];
  executionLogs: ExecutionLog[];

  // Backend Integration State (FastAPI :8000)
  backendUrl: string;
  backendStatus: "checking" | "connected" | "offline";
  backendError: string | null;
  isCompiling: boolean;
  compiledWorkflowId: string | null;
  backendNodeCount: number | null;
  executionMode: "auto" | "backend" | "simulation";
  customTriggerInput: string;

  // Database Persistence State
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  isLoadingWorkflow: boolean;

  loadWorkflowFromBackend: (docId: string) => Promise<boolean>;
  saveWorkflowToBackend: (
    docId?: string,
  ) => Promise<{ success: boolean; error?: string }>;

  // Getters & Tool State
  availableTools: AvailableTool[];
  loadBackendTools: () => Promise<void>;
  getActiveAgent: () => AgentDocument;
  getAvailableToolById: (id: string) => AvailableTool | undefined;
  getAvailableModelById: () => string[];
  getAvailableStorageById: (id: string) => AvailableStorage | undefined;

  // Setters & Stage selection
  setActiveAgent: (id: string) => void;
  setSelectedComponent: (component: ComponentStage) => void;
  setTriggerType: (type: TriggerType) => void;
  setBackendUrl: (url: string) => void;
  setExecutionMode: (mode: "auto" | "backend" | "simulation") => void;
  setCustomTriggerInput: (input: string) => void;

  // Pipeline Config Updaters
  updateMetadata: (metadata: {
    name?: string;
    description?: string;
    status?: "active" | "draft" | "paused";
  }) => void;
  updateTrigger: (updates: Partial<TriggerConfig>) => void;
  updateAgent: (updates: Partial<AgentConfig>) => void;
  updateOutput: (updates: Partial<OutputConfig>) => void;

  // Tool Management (n8n-style)
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

  // Model & Storage Pickers
  selectModel: (modelId: string) => void;
  selectStorage: (
    storageId: string,
    configUpdates?: Record<string, any>,
  ) => void;

  // Agent Document Lifecycle
  createAgent: (name?: string, triggerType?: TriggerType) => string;
  duplicateAgent: (agentId: string) => string;
  deleteAgent: (agentId: string) => void;
  loadPreset: (presetId: string) => void;

  // Backend Actions (FastAPI)
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

  // Deployment & Production Links
  deploymentInfo: DeploymentInfo | null;
  loadDeploymentInfo: (workflowId?: string) => Promise<void>;
  regenerateApiKey: (workflowId?: string) => Promise<string | null>;

  // Execution & Logs Retention Policy
  setExecutionStorage: (policy: StoragePolicy) => void;
  setExecutionLogStorage: (policy: StoragePolicy) => void;
  storedExecutions: StoredExecutionItem[];
  isLoadingExecutions: boolean;
  loadStoredExecutions: (workflowId?: string) => Promise<void>;
  clearStoredExecutions: (workflowId?: string) => Promise<void>;

  // Execution & Simulation
  runSimulation: (overrideInput?: string) => Promise<void>;
  resetSimulation: () => void;

  // Chat Interface Actions
  openChatSidebar: (initialPrompt?: string) => void;
  closeChatSidebar: () => void;
  clearChatMessages: () => void;
  sendWorkflowChatMessage: (message: string) => Promise<void>;
}

// Helper to construct tied output configuration for a trigger
export function createTiedOutputConfig(
  triggerType: TriggerType,
  customSummary?: string,
): OutputConfig {
  switch (triggerType) {
    case "chat":
      return {
        id: `out-chat-${Date.now()}`,
        type: "chat_response",
        title: "Chat Interface Response",
        subtitle:
          "Delivers live streamed AI reply back to active chat conversation",
        targetTrigger: "chat",
        badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        chatResponseConfig: {
          streamChunks: true,
          renderMarkdown: true,
          suggestedChips: [
            "Tell me more",
            "Speak with Human Agent",
            "View Documentation",
          ],
        },
        sampleResult: {
          delivery_channel: "Chat UI Client",
          streaming: true,
          latency_ms: 142,
          completion_tokens: 184,
          rendered_bubble:
            customSummary ||
            "Hello! Your inquiry has been processed and verified against enterprise CRM records.",
        },
      };

    case "webhook":
      return {
        id: `out-wh-${Date.now()}`,
        type: "webhook_response",
        title: "HTTP Webhook Synchronous Response",
        subtitle:
          "Returns HTTP 200 OK JSON response directly to the webhook caller",
        targetTrigger: "webhook",
        badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        webhookResponseConfig: {
          statusCode: 200,
          contentType: "application/json",
          responseTemplate:
            '{\n  "success": true,\n  "status": "processed",\n  "data": @agent.sampleOutput\n}',
        },
        sampleResult: {
          status_code: 200,
          content_type: "application/json",
          latency_ms: 186,
          response_payload: {
            success: true,
            status: "processed",
            tier: "Enterprise VIP",
            routed_to: "account_executive",
          },
        },
      };

    case "telegram":
      return {
        id: `out-tg-${Date.now()}`,
        type: "telegram_response",
        title: "Telegram Bot Message Reply",
        subtitle:
          "Dispatches formatted Markdown message to originating Telegram chat (@chat_id)",
        targetTrigger: "telegram",
        badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        telegramResponseConfig: {
          parseMode: "MarkdownV2",
          replyToMessage: true,
          inlineButtons: [
            { text: "✅ Acknowledge", callbackData: "ack_incident" },
            { text: "📊 View Metrics", callbackData: "view_k8s" },
          ],
        },
        sampleResult: {
          ok: true,
          chat_id: "98427192",
          message_id: 84920,
          parse_mode: "MarkdownV2",
          sent_at: "Just now",
        },
      };

    case "discord":
      return {
        id: `out-discord-${Date.now()}`,
        type: "discord_reply",
        title: "Discord Bot Channel Reply",
        subtitle:
          "Dispatches formatted AI response directly back to the triggering Discord channel/thread",
        targetTrigger: "discord",
        badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
        discordResponseConfig: {
          replyToMessage: true,
          autoReply: true,
        },
        sampleResult: {
          channel_id: "123456789012345678",
          message_id: "987654321098765432",
          author: "OtterBot#0000",
          content:
            customSummary ||
            "Task completed successfully. Results posted back to Discord channel.",
          sent_at: "Just now",
        },
      };
  }
}

// Helper to construct a default trigger for a type
export function createDefaultTriggerConfig(
  triggerType: TriggerType,
  idPrefix = "trig",
): TriggerConfig {
  switch (triggerType) {
    case "chat":
      return {
        id: `${idPrefix}-chat-${Date.now()}`,
        type: "chat",
        title: "Customer Support Web Chat Widget",
        subtitle:
          "Embedded interactive chat receiving real-time customer questions",
        app: "Chat Widget",
        badgeColor: "bg-violet-500/20 text-violet-400 border-violet-500/30",
        chatSettings: {
          welcomeMessage:
            "Hi there! How can our autonomous agent assist you today?",
          placeholder:
            "Ask anything about subscriptions, billing, or technical specs...",
          streamingEnabled: true,
          requireAuth: false,
        },
        samplePayload: {
          session_id: "sess_chat_882",
          user_id: "usr_vip_948",
          user_name: "Sarah Chen",
          message:
            "Can you look up my current subscription tier and verify our SLA response time?",
          timestamp: "2026-09-20T01:10:00Z",
        },
      };

    case "webhook":
      return {
        id: `${idPrefix}-wh-${Date.now()}`,
        type: "webhook",
        title: "Inbound Event HTTP Webhook",
        subtitle:
          "Receives raw JSON event submissions from external servers or payment gateways",
        app: "Webhooks",
        badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        webhookEndpoint: "https://api.otter.ai/wh/v1_order_events",
        webhookSecret: "whsec_live_9837f481c9a1",
        httpMethod: "POST",
        filterRule: "amount >= 10000 && event == 'charge.completed'",
        samplePayload: {
          event: "charge.completed",
          customer_email: "alex@fintechlab.co",
          user_id: "usr_vip_948",
          amount: 29900,
          currency: "usd",
          plan_name: "Enterprise Pro",
        },
      };

    case "telegram":
      return {
        id: `${idPrefix}-tg-${Date.now()}`,
        type: "telegram",
        title: "Telegram On-Call Alert Bot",
        subtitle:
          "Pure push webhook via ngrok receiving commands (/status, /check) & messages",
        app: "Telegram",
        badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        telegramSettings: {
          botUsername: "@OtterEnterpriseBot",
          botToken: "",
          webhookBaseUrl: "",
          allowedChatIds: "",
          commandPrefix: "",
          autoReply: true,
          pollingMode: "webhook",
        },
        samplePayload: {
          update_id: 1049281,
          chat_id: "98427192",
          from_user: "@sarah_dev",
          command: "/status cluster",
          message: "Fatal connection pool timeout in worker-daemon on node-04",
        },
      };

    case "discord":
      return {
        id: `${idPrefix}-discord-${Date.now()}`,
        type: "discord",
        title: "Discord Bot (HTTP Interactions Webhook)",
        subtitle:
          "Loop-free HTTP Interactions receiving slash commands (/ask, /run) via ngrok",
        app: "Discord Bot",
        badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
        discordSettings: {
          applicationId: "",
          publicKey: "",
          webhookBaseUrl: "",
          commandName: "ask",
          autoReply: true,
        },
        samplePayload: {
          id: "123456789012345678",
          channel_id: "987654321098765432",
          guild_id: "112233445566778899",
          author: {
            id: "554433221100998877",
            username: "alex_dev",
            discriminator: "0001",
          },
          content: "/ask summarize latest incident reports and check status",
          timestamp: "2026-09-24T18:30:00Z",
        },
      };
  }
}

// ==========================================
// PRESET GENERALIZED AGENTS
// ==========================================
export const PRESET_AGENTS: AgentDocument[] = [
  {
    id: "chat-crm-support-agent",
    name: "Chat Interface → Qwen 3.8 (HTTP REST Tool) → Chat Response",
    description:
      "Real-time conversational agent that invokes live Python backend tools (HTTP Request) and synthesizes replies via Groq.",
    status: "draft",
    updatedAt: "Just now",
    trigger: createDefaultTriggerConfig("chat", "trig-preset-1"),
    agent: {
      id: "core-agent-1",
      title: "Enterprise Solutions & CRM Lookup Agent",
      subtitle:
        "Qwen 3.8 27B orchestrating live HTTP tool calls on FastAPI backend",
      model: "qwen/qwen3.8-27b",
      storage: {
        storageId: "memory-disabled",
        config: { enabled: false },
      },
      systemPrompt:
        "You are the Otter AI Enterprise Assistant. When a customer asks about products, inventory, or categories, invoke the HTTP Request tool to fetch live data. Synthesize a concise, helpful response.",
      temperature: 0.2,
      reasoningMode: "fast",
      tools: [
        {
          instanceId: "tool-inst-http-crm",
          toolId: "http_request",
          name: "Fetch Product Categories (HTTP Request)",
          enabled: true,
          config: {
            method: "GET",
            url: "https://dummyjson.com/products/category-list",
            authType: "none",
            authToken: "",
            headers: [{ key: "Accept", value: "application/json" }],
            queryParams: [],
            bodyType: "none",
            body: "",
            timeoutMs: 5000,
          },
        },
        {
          instanceId: "tool-inst-weather-check",
          toolId: "get_weather",
          name: "Regional Weather Lookup",
          enabled: true,
          config: {
            city: "London",
            tool_desc: "Get current weather info for regional branch locations.",
          },
        },
      ],
      responseFormat: "markdown",
      sampleOutput: {
        customer_tier: "Enterprise Pro ($499/mo)",
        account_status: "Active - VIP",
        sla_guarantee: "15-minute response SLA (99.99% uptime)",
        assigned_rep: "Sarah Chen",
        agent_answer:
          "Hi Sarah! You are on the **Enterprise Pro Tier** with 45 active seats. Your contract includes our **15-minute dedicated SLA** and 24/7 emergency escalation.",
      },
    },
    output: createTiedOutputConfig(
      "chat",
      "Hi Sarah! You are on the Enterprise Pro Tier with 45 active seats. Your contract includes our 15-minute dedicated SLA.",
    ),
  },
  {
    id: "webhook-event-router",
    name: "Webhook Inbound → GPT-4o (HTTP Enrichment + JSON Transform) → Webhook 200 OK",
    description:
      "Inbound HTTP webhook parser that extracts payload properties and calls an external enrichment API before returning synchronous JSON response.",
    status: "draft",
    updatedAt: "15 mins ago",
    trigger: createDefaultTriggerConfig("webhook", "trig-preset-2"),
    agent: {
      id: "core-agent-2",
      title: "Event Qualification & Enrichment Engine",
      subtitle:
        "GPT-4o orchestrating HTTP enrichment and JSON field extraction",
      model: "gpt-4o",
      storage: {
        storageId: "memory-disabled",
        config: { enabled: false },
      },
      systemPrompt:
        "Inspect incoming webhook @trigger.event. If amount > $100, trigger HTTP Request to enrich domain and verify payload fields using JSON transform.",
      temperature: 0.1,
      reasoningMode: "balanced",
      tools: [
        {
          instanceId: "tool-inst-http-enrich",
          toolId: "http_request",
          name: "Enrich Domain via Clearbit API",
          enabled: true,
          config: {
            method: "POST",
            url: "https://api.enrichment.io/v2/companies/lookup",
            authType: "api_key",
            authToken: "env:ENRICHMENT_API_KEY",
            headers: [{ key: "Content-Type", value: "application/json" }],
            queryParams: [],
            bodyType: "json",
            body: '{\n  "email": "@trigger.customer_email"\n}',
            timeoutMs: 3000,
          },
        },
        {
          instanceId: "tool-inst-json-check",
          toolId: "json_transform",
          name: "Extract Webhook Customer Email",
          enabled: true,
          config: {
            key: "customer_email",
            tool_desc: "Extract customer_email field from JSON payload.",
          },
        },
      ],
      responseFormat: "json",
      sampleOutput: {
        qualification_tier: "Tier-1 Enterprise",
        estimated_deal_size: "$29,900 ARR",
        verified_in_db: true,
        recommended_action: "Dispatch instant onboarding calendar invite",
      },
    },
    output: createTiedOutputConfig("webhook"),
  },
  {
    id: "telegram-devops-sentinel",
    name: "Telegram Bot (/status) → DeepSeek R1 (HTTP Monitor + JSON Transform) → Telegram Reply",
    description:
      "Telegram ops assistant that triggers Kubernetes cluster health checks via HTTP and extracts status keys from JSON telemetry.",
    status: "draft",
    updatedAt: "1 hour ago",
    trigger: createDefaultTriggerConfig("telegram", "trig-preset-3"),
    agent: {
      id: "core-agent-3",
      title: "Autonomous DevOps & Incident Sentinel",
      subtitle:
        "DeepSeek R1 executing HTTP telemetry probes and JSON extraction",
      model: "deepseek-r1",
      storage: {
        storageId: "memory-disabled",
        config: { enabled: false },
      },
      systemPrompt:
        "You are the DevOps Sentinel for Telegram. When @trigger.command or @trigger.message is received, execute the HTTP Request tool against internal health endpoints and extract status attributes from JSON health reports.",
      temperature: 0.1,
      reasoningMode: "deep",
      tools: [
        {
          instanceId: "tool-inst-http-k8s",
          toolId: "http_request",
          name: "Kubernetes Metrics HTTP Probe",
          enabled: true,
          config: {
            method: "GET",
            url: "https://k8s-telemetry.internal/api/v1/clusters/production/health",
            authType: "bearer",
            authToken: "env:K8S_SERVICE_TOKEN",
            headers: [{ key: "Accept", value: "application/json" }],
            queryParams: [{ key: "subsystem", value: "worker-daemons" }],
            bodyType: "none",
            body: "",
            timeoutMs: 2500,
          },
        },
        {
          instanceId: "tool-inst-json-status",
          toolId: "json_transform",
          name: "Extract Cluster Status Key",
          enabled: true,
          config: {
            key: "status",
            tool_desc: "Extract status property from JSON cluster telemetry.",
          },
        },
      ],
      responseFormat: "markdown",
      sampleOutput: {
        incident_id: "INC-8921",
        subsystem: "worker-daemon connection pool",
        severity: "HIGH - Pool Exhaustion",
        mitigation: "kubectl rollout restart deployment/worker-daemon-prod",
      },
    },
    output: createTiedOutputConfig("telegram"),
  },
];

// ==========================================
// ZUSTAND STORE
// ==========================================
export const useAgentStore = create<AgentStoreState>((set, get) => ({
  agents: PRESET_AGENTS,
  activeAgentId: PRESET_AGENTS[0].id,
  selectedComponent: "agent",

  // Chat Sidebar
  isChatSidebarOpen: false,
  chatMessages: [],

  configuringToolInstanceId: null,
  isAddToolModalOpen: false,

  isRunning: false,
  activeExecutionStage: null,
  executedStages: [],
  executionLogs: [],

  // Backend Integration State (FastAPI :8000)
  backendUrl: DEFAULT_BACKEND_URL,
  backendStatus: "checking",
  backendError: null,
  isCompiling: false,
  compiledWorkflowId: null,
  backendNodeCount: null,
  executionMode: "auto",
  customTriggerInput: "",

  // Database Persistence State
  isSaving: false,
  hasUnsavedChanges: false,
  lastSavedAt: null,
  isLoadingWorkflow: false,

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
      console.warn(`Workflow ${docId} not found in backend DB, initializing local document.`);
      // If doc exists in local state, activate it
      const localDoc = get().agents.find((a) => a.id === docId);
      if (localDoc) {
        set({ activeAgentId: localDoc.id, isLoadingWorkflow: false });
        // Save it to DB so it exists in DB from now on
        get().saveWorkflowToBackend(docId);
        return true;
      }
      // Otherwise create a fresh default chat workflow
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

      // Immediately persist this new workflow to PostgreSQL
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
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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

  setBackendUrl: (url: string) => set({ backendUrl: url }),
  setExecutionMode: (mode: "auto" | "backend" | "simulation") =>
    set({ executionMode: mode }),
  setCustomTriggerInput: (input: string) => set({ customTriggerInput: input }),

  availableTools: AVAILABLE_TOOLS,

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

  getActiveAgent: () => {
    const { agents, activeAgentId } = get();
    return agents.find((a) => a.id === activeAgentId) || agents[0];
  },

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

  // Switching trigger dynamically re-binds output action to match!
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

  // Tool Management
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
      const existingSameTools = activeAgent.agent.tools.filter((t) => t.toolId === toolId);
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
      configuringToolInstanceId: instanceId, // Open config drawer right after adding!
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

  // BACKEND ACTIONS (FastAPI :8000)
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
        // If trigger is Discord, configure HTTP Interactions webhook
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
        }
        // If trigger is Telegram, register webhook via ngrok URL
        else if (doc.trigger?.type === "telegram") {
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

        // Deploy to PostgreSQL deployments table & obtain shareable URL / API key
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

  deploymentInfo: null,

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
          : ag
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
          : ag
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
      // Step 1: Ensure workflow is compiled on backend
      const backendWf = agentDocumentToBackendWorkflow(doc);
      set({ activeExecutionStage: "storage" });
      const compileRes = await compileBackendWorkflow(backendWf, backendUrl);
      set({
        compiledWorkflowId: backendWf.id,
        backendNodeCount: compileRes.node_count,
        executedStages: ["trigger", "storage"],
        activeExecutionStage: "agent",
      });

      // Step 2: Execute on FastAPI backend
      const result = await executeBackendWorkflow(
        backendWf.id,
        input,
        backendUrl,
      );
      const durationMs = Date.now() - startTime;

      // Step 3: Parse response into logs
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

  // UNIFIED EXECUTION (Backend or Simulated Fallback)
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
      }
      // If backend was unreachable or failed, smoothly fallback to high-fidelity client simulation
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
          durationMs: 28,
          summary: `Trigger Verified: Received ${Object.keys(current.trigger.samplePayload).length} fields from ${current.trigger.app}`,
          data: current.trigger.samplePayload,
        },
        {
          stage: "storage",
          timestamp: new Date().toLocaleTimeString(),
          status: "running",
          durationMs: 0,
          summary: `Checking Execution Memory: Switched off (Stateless mode)`,
          data: { crossExecutionMemory: "Disabled", status: "Switched off for now" },
        },
      ],
    }));

    // Step 2: Storage Memory checked (switched off)
    await new Promise((resolve) => setTimeout(resolve, 400));
    const activeTools = current.agent.tools.filter((t) => t.enabled);

    set((state) => ({
      executedStages: ["trigger", "storage"],
      activeExecutionStage: activeTools.length > 0 ? "tool_call" : "agent",
      executionLogs: [
        state.executionLogs[0],
        {
          stage: "storage",
          timestamp: new Date().toLocaleTimeString(),
          status: "success",
          durationMs: 14,
          summary: `Execution Memory: Switched off (Running in stateless mode)`,
          data: {
            crossExecutionMemory: "Disabled",
            mode: "Stateless per workflow execution",
            storageEngine: storageOption?.name || "Stateless (Memory Switched Off)",
          },
        },
        ...(activeTools.length > 0
          ? [
              {
                stage: "tool_call" as const,
                timestamp: new Date().toLocaleTimeString(),
                status: "running" as const,
                durationMs: 0,
                summary: `Invoking ${activeTools.length} Configured Tool${activeTools.length > 1 ? "s" : ""} (${activeTools.map((t) => t.name).join(", ")})...`,
                data: activeTools.map((t) => ({
                  name: t.name,
                  config: t.config,
                })),
              },
            ]
          : []),
      ],
    }));

    // Step 3: Tool Execution (e.g. HTTP Request, Database, Vector Search)
    if (activeTools.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const simulatedToolOutputs = activeTools.map((t) => {
        const toolDef = AVAILABLE_TOOLS.find((def) => def.id === t.toolId);
        return {
          tool: t.name,
          toolId: t.toolId,
          parameters: t.config,
          response: toolDef?.sampleExecutionOutput || {
            status: 200,
            message: "OK",
          },
        };
      });

      set((state) => ({
        executedStages: ["trigger", "storage", "tool_call"],
        activeExecutionStage: "agent",
        executionLogs: [
          state.executionLogs[0],
          state.executionLogs[1],
          {
            stage: "tool_call",
            timestamp: new Date().toLocaleTimeString(),
            status: "success",
            durationMs: 168,
            summary: `Tools Executed: Successfully received responses from ${activeTools.length} tool(s)`,
            data: { executedTools: simulatedToolOutputs },
          },
          {
            stage: "agent",
            timestamp: new Date().toLocaleTimeString(),
            status: "running",
            durationMs: 0,
            summary: `Model ${current.agent.model} reasoning over trigger payload & tool outputs...`,
            data: {},
          },
        ],
      }));
    }

    // Step 4: AI Model Reasoning
    await new Promise((resolve) => setTimeout(resolve, 700));
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

  // Chat Interface Actions
  openChatSidebar: (initialPrompt?: string) => {
    const current = get().getActiveAgent();
    set({ isChatSidebarOpen: true });

    // Initialize with welcoming greeting if chat is empty
    if (get().chatMessages.length === 0) {
      const welcome =
        current.trigger.chatSettings?.welcomeMessage ||
        `Hi! I'm connected to ${current.name}. How can I assist you with this workflow today?`;
      set({
        chatMessages: [
          {
            id: `msg-welcome-${Date.now()}`,
            role: "agent",
            content: welcome,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ],
      });
    }

    if (initialPrompt && initialPrompt.trim()) {
      get().sendWorkflowChatMessage(initialPrompt.trim());
    }
  },

  closeChatSidebar: () => {
    set({ isChatSidebarOpen: false });
  },

  clearChatMessages: () => {
    const current = get().getActiveAgent();
    const welcome =
      current.trigger.chatSettings?.welcomeMessage ||
      `Hi! I'm connected to ${current.name}. How can I assist you with this workflow today?`;
    set({
      chatMessages: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: "agent",
          content: welcome,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    });
  },

  sendWorkflowChatMessage: async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || get().isRunning) return;

    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: WorkflowChatMessage = {
      id: userMsgId,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
    }));

    const startTime = Date.now();

    // Execute through unified execution (Backend or fallback simulation)
    await get().runSimulation(trimmed);

    const durationMs = Date.now() - startTime;
    const currentDoc = get().getActiveAgent();

    // Extract reply text from sampleOutput or output sampleResult
    const rawReply =
      currentDoc.agent.sampleOutput?.final_output ||
      currentDoc.output.sampleResult?.rendered_reply ||
      currentDoc.agent.sampleOutput?.agent_answer ||
      currentDoc.output.sampleResult?.rendered_bubble ||
      "Workflow executed successfully.";

    const replyText =
      typeof rawReply === "object"
        ? JSON.stringify(rawReply, null, 2)
        : String(rawReply ?? "");

    const rawTools =
      currentDoc.agent.sampleOutput?.tools_used ||
      currentDoc.agent.tools.filter((t) => t.enabled).map((t) => t.name);

    const toolsUsed = Array.isArray(rawTools)
      ? rawTools.map((t: any) =>
          typeof t === "string" ? t : (t?.name || "tool")
        )
      : undefined;

    const agentMsg: WorkflowChatMessage = {
      id: `msg-agent-${Date.now()}`,
      role: "agent",
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      toolsUsed: toolsUsed && toolsUsed.length > 0 ? toolsUsed : undefined,
      durationMs,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, agentMsg],
    }));
  },
}));
