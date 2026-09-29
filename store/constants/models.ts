import { AvailableStorage } from "../types/agentTypes";

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
