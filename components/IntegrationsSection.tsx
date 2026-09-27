"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  MessageSquare,
  CreditCard,
  Database,
  GitPullRequest,
  Mail,
  FileSpreadsheet,
  Globe,
  Radio,
  Send,
  Layers,
  CheckCircle2,
  Search,
  Check
} from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  category: "ai" | "comms" | "data" | "dev";
  iconName: string;
  description: string;
  badge: string;
  popularAction: string;
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    iconName: "bot",
    description: "GPT-4o & embeddings for zero-shot text classification, synthesis and structured extraction.",
    badge: "AI Core",
    popularAction: "Generate structured JSON summary",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    category: "ai",
    iconName: "sparkles",
    description: "Claude 3.7 Sonnet with deep reasoning, code analysis, and document parsing.",
    badge: "AI Core",
    popularAction: "Complex customer intent triage",
  },
  {
    id: "slack",
    name: "Slack",
    category: "comms",
    iconName: "message-square",
    description: "Post rich interactive cards, threaded replies, and one-click manual approval buttons.",
    badge: "Essential",
    popularAction: "Post interactive deal alert",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "dev",
    iconName: "credit-card",
    description: "Instant webhooks for checkout completion, subscription churn, and disputed charges.",
    badge: "Revenue",
    popularAction: "Trigger on successful payment",
  },
  {
    id: "notion",
    name: "Notion",
    category: "data",
    iconName: "database",
    description: "Create pages, update database properties, and append meeting or lead summaries.",
    badge: "Productivity",
    popularAction: "Add verified lead to CRM board",
  },
  {
    id: "resend",
    name: "Resend",
    category: "comms",
    iconName: "mail",
    description: "Deliver high-converting, crisp transactional emails without spam-folder headaches.",
    badge: "Email",
    popularAction: "Send personalized welcome email",
  },
  {
    id: "postgres",
    name: "PostgreSQL & Supabase",
    category: "data",
    iconName: "database",
    description: "Direct parameter-safe queries, CDC event hooks, and real-time record inserts.",
    badge: "Database",
    popularAction: "Insert customer telemetry row",
  },
  {
    id: "github",
    name: "GitHub",
    category: "dev",
    iconName: "git-pull-request",
    description: "Listen for issues, PR merges, release tags, and automated repo triage.",
    badge: "DevOps",
    popularAction: "Parse bug issue & auto-label",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    category: "data",
    iconName: "file-spreadsheet",
    description: "Append rows, lookup cells, and keep live marketing spreadsheets synchronized.",
    badge: "Spreadsheet",
    popularAction: "Append row on form submission",
  },
  {
    id: "discord",
    name: "Discord",
    category: "comms",
    iconName: "message-square",
    description: "Channel announcements, developer alert embeds, and community greeting bots.",
    badge: "Community",
    popularAction: "Send formatted webhook embed",
  },
  {
    id: "airtable",
    name: "Airtable",
    category: "data",
    iconName: "layers",
    description: "Manage visual relational bases, status automations, and sync records.",
    badge: "Operations",
    popularAction: "Update stage to 'Closed Won'",
  },
  {
    id: "linear",
    name: "Linear",
    category: "dev",
    iconName: "check-circle",
    description: "Create issues, track sprints, and sync customer bug reports straight to backlog.",
    badge: "Engineering",
    popularAction: "Create prioritized issue with AI tags",
  },
  {
    id: "telegram",
    name: "Telegram",
    category: "comms",
    iconName: "send",
    description: "Ultra-fast push notifications, VIP founder alerts, and custom bot commands.",
    badge: "Instant Alert",
    popularAction: "Send direct push message to founder",
  },
  {
    id: "smart-webhook",
    name: "Smart Inbound Webhook",
    category: "dev",
    iconName: "radio",
    description: "Catch any payload from any provider. Otter AI automatically normalizes the schema.",
    badge: "Universal",
    popularAction: "Catch raw JSON & auto-map @keys",
  },
  {
    id: "smart-http",
    name: "Smart Outbound HTTP",
    category: "dev",
    iconName: "globe",
    description: "Call any REST API with automatic OAuth refresh, exponential backoff, and AI payload format.",
    badge: "Universal",
    popularAction: "Call custom API with auto-bearer auth",
  },
];

export function IntegrationsSection() {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIntegrations = INTEGRATIONS.filter((item) => {
    const matchesCategory = filter === "all" || item.category === filter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="integrations" className="py-24 relative bg-slate-950/50 border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated For Zero Breakage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            The Curated 15 Apps.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
              Tested daily. Zero rot.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Other tools boast 800+ integrations where half are broken or unmaintained. We focus on
            the 15 platforms that run 95% of modern tech workflows.
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === "all"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All 15 Apps
            </button>
            <button
              onClick={() => setFilter("ai")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === "ai"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              AI & Reasoning
            </button>
            <button
              onClick={() => setFilter("comms")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === "comms"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Messaging & Alerts
            </button>
            <button
              onClick={() => setFilter("data")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === "data"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Data & CRM
            </button>
            <button
              onClick={() => setFilter("dev")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === "dev"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Dev & Webhooks
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIntegrations.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                      {item.category === "ai" && <Bot className="w-5 h-5 text-amber-400" />}
                      {item.category === "comms" && <MessageSquare className="w-5 h-5 text-cyan-400" />}
                      {item.category === "data" && <Database className="w-5 h-5 text-purple-400" />}
                      {item.category === "dev" && <GitPullRequest className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">{item.badge}</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                    <Check className="w-3 h-3" />
                    <span>Tested</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Popular:</span>
                <span className="text-slate-300 font-mono truncate max-w-[200px]">
                  {item.popularAction}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Universal Fallback Callout */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Need an app outside the 15?</h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Our <strong>Smart Universal Webhook & HTTP</strong> block connects to any API on the
                web. Otter's AI automatically parses headers, formats bodies, and handles OAuth.
              </p>
            </div>
          </div>
          <a
            href="#demo"
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-cyan-400 hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
          >
            Try In Sandbox
          </a>
        </div>
      </div>
    </section>
  );
}
