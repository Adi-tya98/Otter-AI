import { StoragePolicy } from "@/lib/api";

export type ComponentStage = "trigger" | "agent" | "output";

// Generalized Triggers (chat, webhook, telegram, discord, agentmail)
export type TriggerType = "chat" | "webhook" | "telegram" | "discord" | "agentmail";

// Output Actions are tied directly to respective trigger points
export type OutputType =
  | "chat_response"
  | "webhook_response"
  | "telegram_response"
  | "discord_reply"
  | "agentmail_reply";

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
  category: "network" | "database" | "ai" | "utility" | "communication" | "marketing" | "productivity";
  description: string;
  iconName: string;
  badge: string;
  isConfigurable: boolean;
  fields: ToolFieldSchema[];
  defaultValues: Record<string, any>;
  sampleExecutionOutput: Record<string, any>;
}

export interface ConfiguredTool {
  instanceId: string;
  toolId: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

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
    webhookBaseUrl?: string;
    allowedChatIds?: string;
    commandPrefix?: string;
    autoReply: boolean;
    pollingMode?: "webhook" | "polling";
  };
  // Discord Bot settings (HTTP Interactions Webhook via ngrok)
  discordSettings?: {
    applicationId?: string;
    publicKey?: string;
    webhookBaseUrl?: string;
    commandName?: string;
    autoReply: boolean;
    botToken?: string;
    channelId?: string;
    triggerMode?: "mention_only" | "specific_channels" | "prefix" | "direct_messages";
    commandPrefix?: string;
  };
  // AgentMail settings (Inbound email webhook & replies via agentmail.to)
  agentmailSettings?: {
    inboxId?: string;
    inboxEmail?: string;
    apiKey?: string;
    webhookSecret?: string;
    webhookBaseUrl?: string;
    autoReply?: boolean;
  };
  samplePayload: Record<string, any>;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: "http" | "sse" | "stdio";
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
  discoveredTools?: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, any>;
  }>;
  selectedTools?: string[];
}

export interface GuardrailSettings {
  enabled: boolean;
  blockPromptInjection: boolean;
  blockDestructiveTools: boolean;
  blockSsrf: boolean;
  maskSecrets: boolean;
  useLlamaGuard: boolean;
}

export interface AgentConfig {
  id: string;
  title: string;
  subtitle: string;
  model: string;
  storage: {
    storageId: string;
    config: Record<string, any>;
  };
  systemPrompt: string;
  temperature: number;
  reasoningMode: "fast" | "balanced" | "deep";
  tools: ConfiguredTool[];
  mcpServers?: MCPServerConfig[];
  responseFormat: "markdown" | "json" | "text";
  deterministic?: boolean;
  seed?: number;
  guardrails?: GuardrailSettings;
  sampleOutput: Record<string, any>;
}

export interface OutputConfig {
  id: string;
  type: OutputType;
  title: string;
  subtitle: string;
  targetTrigger: TriggerType;
  badgeColor: string;
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
  agentmailResponseConfig?: {
    replyToThread: boolean;
    autoReply: boolean;
  };
  sampleResult: Record<string, any>;
}

export interface AgentDocument {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft" | "paused";
  updatedAt: string;
  executionStorage?: StoragePolicy;
  executionLogStorage?: StoragePolicy;
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

    case "agentmail":
      return {
        id: `out-agentmail-${Date.now()}`,
        type: "agentmail_reply",
        title: "AgentMail Threaded Email Reply",
        subtitle:
          "Dispatches threaded email response directly back to the sender via AgentMail (agentmail.to)",
        targetTrigger: "agentmail",
        badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        agentmailResponseConfig: {
          autoReply: true,
          replyToThread: true,
        },
        sampleResult: {
          success: true,
          message_id: "msg_out_9921",
          thread_id: "th_customer_inquiry_441",
          recipient: "sarah.chen@enterprise.io",
          subject: "Re: Enterprise SLA and billing terms",
          body:
            customSummary ||
            "Hi Sarah, your enterprise SLA includes 15-minute response times and 99.99% uptime guarantee.",
          sent_at: "Just now",
        },
      };
  }
}

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

    case "agentmail":
      return {
        id: `${idPrefix}-agentmail-${Date.now()}`,
        type: "agentmail",
        title: "AgentMail Inbound Email Trigger",
        subtitle:
          "Dedicated agent inbox receiving real-time incoming emails via webhooks (agentmail.to)",
        app: "AgentMail",
        badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        agentmailSettings: {
          inboxId: "",
          inboxEmail: "agent-inbox@agentmail.to",
          apiKey: "",
          webhookSecret: "",
          webhookBaseUrl: "",
          autoReply: true,
        },
        samplePayload: {
          id: "msg_in_8829102",
          thread_id: "th_customer_inquiry_441",
          from: "sarah.chen@enterprise.io",
          sender_name: "Sarah Chen",
          subject: "Enterprise SLA response time and billing inquiries",
          body: "Hi Otter Team, can you confirm our current subscription tier and verify the SLA response time for priority support?",
          timestamp: "2026-09-28T10:15:00Z",
        },
      };
  }
}

