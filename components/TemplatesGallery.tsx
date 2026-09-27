"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAgentStore } from "@/store/agentStore";
import {
  Sparkles,
  ArrowRight,
  Zap,
  CreditCard,
  MessageSquare,
  Database,
  Mail,
  GitPullRequest,
  CheckCircle2,
  Clock
} from "lucide-react";

interface TemplateItem {
  id: string;
  presetDocId: string;
  title: string;
  category: "Revenue" | "Support" | "DevOps" | "Growth";
  description: string;
  executionSpeed: string;
  steps: { name: string; type: "Trigger" | "AI Agent" | "Output" }[];
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "lead-alert",
    presetDocId: "chat-crm-support-agent",
    title: "Live Chat Support Agent with HTTP CRM & Vector RAG",
    category: "Support",
    description: "Web chat agent that queries customer account data via REST HTTP request, searches vector policies, and streams answers.",
    executionSpeed: "~140ms",
    steps: [
      { name: "Web Chat Trigger", type: "Trigger" },
      { name: "Claude 3.7 + HTTP CRM & Vector", type: "AI Agent" },
      { name: "Chat Stream Reply", type: "Output" },
    ],
  },
  {
    id: "customer-onboard",
    presetDocId: "webhook-event-router",
    title: "Webhook Inbound Enricher & SQL Account Validator",
    category: "Revenue",
    description: "Inbound HTTP webhook parser that enriches customer domains via external API and checks PostgreSQL subscription records.",
    executionSpeed: "~185ms",
    steps: [
      { name: "Inbound HTTP Webhook", type: "Trigger" },
      { name: "GPT-4o + Clearbit & Postgres", type: "AI Agent" },
      { name: "Webhook 200 OK JSON", type: "Output" },
    ],
  },
  {
    id: "bug-triage",
    presetDocId: "telegram-devops-sentinel",
    title: "Telegram DevOps On-Call & Kubernetes Sentinel",
    category: "DevOps",
    description: "Telegram bot that executes Kubernetes cluster health probes via HTTP and runs Python crash trace analysis in a sandbox.",
    executionSpeed: "~120ms",
    steps: [
      { name: "Telegram Bot (/status)", type: "Trigger" },
      { name: "DeepSeek R1 + HTTP Probe & Python", type: "AI Agent" },
      { name: "Telegram Chat Reply", type: "Output" },
    ],
  },
  {
    id: "churn-recovery",
    presetDocId: "webhook-event-router",
    title: "Failed Payment Event Processor",
    category: "Revenue",
    description: "Detects failed billing events via webhook, calculates recovery discount via Math tool, and replies with 200 OK.",
    executionSpeed: "~160ms",
    steps: [
      { name: "Stripe Webhook Event", type: "Trigger" },
      { name: "AI Agent + Math Evaluator", type: "AI Agent" },
      { name: "Synchronous Webhook Response", type: "Output" },
    ],
  },
  {
    id: "support-triage",
    presetDocId: "chat-crm-support-agent",
    title: "Enterprise VIP Tier Escalator",
    category: "Growth",
    description: "Conversational chat agent checking customer ARR tiers via HTTP and offering instant meeting booking to VIPs.",
    executionSpeed: "~195ms",
    steps: [
      { name: "Chat Interface", type: "Trigger" },
      { name: "Claude 3.7 + HTTP API Lookup", type: "AI Agent" },
      { name: "Streamed VIP Chat Card", type: "Output" },
    ],
  },
  {
    id: "daily-brief",
    presetDocId: "telegram-devops-sentinel",
    title: "Telegram Infrastructure Health Monitor",
    category: "DevOps",
    description: "Telegram command processor that pings internal monitoring APIs and responds with markdown service uptime stats.",
    executionSpeed: "~210ms",
    steps: [
      { name: "Telegram Command Trigger", type: "Trigger" },
      { name: "DeepSeek R1 + HTTP Telemetry", type: "AI Agent" },
      { name: "Telegram Bot Response", type: "Output" },
    ],
  },
];

export function TemplatesGallery() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { setActiveAgent } = useAgentStore();

  const categories = ["All", "Revenue", "Support", "DevOps", "Growth"];

  const filteredTemplates =
    activeCategory === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUseTemplate = (tpl: TemplateItem) => {
    setActiveAgent(tpl.presetDocId);
    setCopiedId(tpl.id);
    setTimeout(() => {
      setCopiedId(null);
      // scroll to sandbox
      const el = document.getElementById("demo");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 400);
  };

  return (
    <section className="py-24 relative bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Ready-To-Run Agent Blueprints</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Pre-built agents for what you{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400">
              actually need
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Otter AI is an AI-agent application builder. No workflow construction required.
            Every agent follows the fixed architecture:{" "}
            <strong className="text-white font-mono">Trigger → AI Agent → Output</strong>.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-slate-800 text-white border border-slate-700 shadow-md"
                    : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {tpl.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{tpl.executionSpeed}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {tpl.title}
                </h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{tpl.description}</p>

                {/* Steps Chain Preview */}
                <div className="mt-5 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Fixed 3 Components:
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {tpl.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 shrink-0">
                            {sIdx + 1}
                          </span>
                          <span className="truncate">{step.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase">{step.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Active in Sandbox!</span>
                    </>
                  ) : (
                    <>
                      <span>Try in Sandbox</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <Link
                  href={`/${tpl.presetDocId}`}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-400 hover:text-white transition-colors"
                  title="Open in Studio"
                >
                  <Sparkles className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
