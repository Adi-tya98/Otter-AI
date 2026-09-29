import {
  AgentDocument,
  createTiedOutputConfig,
  createDefaultTriggerConfig,
} from "../types/agentTypes";

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
  {
    id: "agentmail-support-assistant",
    name: "AgentMail Inbound Email → Groq Compound (CRM & Knowledge Lookup) → Threaded Email Reply",
    description:
      "Autonomous email support agent with a dedicated AgentMail inbox that parses inbound customer inquiries, queries live tools, and dispatches threaded email replies.",
    status: "draft",
    updatedAt: "Just now",
    trigger: createDefaultTriggerConfig("agentmail", "trig-preset-agentmail"),
    agent: {
      id: "core-agent-agentmail",
      title: "AgentMail Autonomous Support Dispatcher",
      subtitle:
        "Groq Compound Model orchestrating email actions & knowledge retrieval",
      model: "groq/compound",
      storage: {
        storageId: "memory-disabled",
        config: { enabled: false },
      },
      systemPrompt:
        "You are the AgentMail Enterprise Support Specialist. An email has arrived at the agent's inbox. Review the customer inquiry, use tools if necessary to look up status, and compose a professional, friendly, and complete threaded reply.",
      temperature: 0.2,
      reasoningMode: "balanced",
      tools: [
        {
          instanceId: "tool-inst-agentmail-action",
          toolId: "agentmail",
          name: "AgentMail Dispatcher",
          enabled: true,
          config: {
            api_key: "env:AGENTMAIL_API_KEY",
            operation: "reply_message",
            tool_desc: "Send emails and reply to active email threads via AgentMail (agentmail.to).",
          },
        },
        {
          instanceId: "tool-inst-web-search",
          toolId: "web_search",
          name: "Company Knowledge Lookup",
          enabled: true,
          config: {
            query: "Enterprise SLA and support policies",
            tool_desc: "Search internal docs and public guidelines for accurate customer answers.",
          },
        },
      ],
      responseFormat: "markdown",
      sampleOutput: {
        status: "Email replied successfully",
        recipient: "sarah.chen@enterprise.io",
        thread_id: "th_customer_inquiry_441",
        reply_preview:
          "Hi Sarah! Thank you for reaching out. Your Enterprise tier includes our dedicated 15-minute SLA guarantee and 24/7 priority escalation.",
      },
    },
    output: createTiedOutputConfig("agentmail"),
  },
];
