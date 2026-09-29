"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAgentStore, AvailableTool } from "@/store/agentStore";
import {
  X,
  Search,
  Plus,
  Globe,
  Database,
  BookOpen,
  Code2,
  Compass,
  Calculator,
  Sparkles,
  ArrowRight,
  Zap,
  Coins,
  Mail,
  MessageSquare,
  ExternalLink,
  Megaphone,
  Kanban,
  Table,
  Send,
  CheckSquare,
  Bot,
  Clock,
  ListTodo,
} from "lucide-react";

function getToolDocsSlug(toolId: string): string {
  const map: Record<string, string> = {
    notion_page: "notion",
    discord_webhook: "discord",
    http_request: "node_http_request",
    resend: "resend_email",
    jina: "jina_reader",
    forty_two_min: "42min",
    seven_todos: "7todos",
  };
  return map[toolId] || toolId;
}

export function AddToolModal() {
  const {
    isAddToolModalOpen,
    closeAddToolModal,
    addToolToAgent,
    availableTools,
    loadBackendTools,
  } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (isAddToolModalOpen) {
      loadBackendTools();
    }
  }, [isAddToolModalOpen, loadBackendTools]);

  if (!isAddToolModalOpen) return null;

  const categories = [
    { id: "all", label: "All Tools" },
    { id: "productivity", label: "Productivity & Tasks" },
    { id: "marketing", label: "Marketing & Growth" },
    { id: "database", label: "Databases & Storage" },
    { id: "communication", label: "Email & Communication" },
    { id: "network", label: "Network & REST" },
    { id: "utility", label: "Utility & Scraping" },
  ];

  const toolsList = availableTools && availableTools.length > 0 ? availableTools : [];

  const filteredTools = toolsList.filter((t) => {
    const matchesCat = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "Globe":
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case "Database":
        return <Database className="w-5 h-5 text-indigo-400" />;
      case "BookOpen":
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case "Code2":
        return <Code2 className="w-5 h-5 text-amber-400" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-purple-400" />;
      case "Calculator":
        return <Calculator className="w-5 h-5 text-pink-400" />;
      case "Coins":
        return <Coins className="w-5 h-5 text-amber-400" />;
      case "Mail":
        return <Mail className="w-5 h-5 text-rose-400" />;
      case "Search":
        return <Search className="w-5 h-5 text-sky-400" />;
      case "MessageSquare":
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case "Megaphone":
        return <Megaphone className="w-5 h-5 text-fuchsia-400" />;
      case "Kanban":
        return <Kanban className="w-5 h-5 text-blue-400" />;
      case "Table":
        return <Table className="w-5 h-5 text-teal-400" />;
      case "Send":
        return <Send className="w-5 h-5 text-emerald-400" />;
      case "CheckSquare":
        return <CheckSquare className="w-5 h-5 text-violet-400" />;
      case "Bot":
        return <Bot className="w-5 h-5 text-orange-400" />;
      case "Clock":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "ListTodo":
        return <ListTodo className="w-5 h-5 text-lime-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Available Tools</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a tool to equip your AI Agent with external capabilities (like n8n nodes).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
              title="Open documentation portal"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Docs Catalog</span>
              <ExternalLink className="w-3 h-3 text-cyan-400/80" />
            </Link>

            <button
              onClick={closeAddToolModal}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-950/90 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getToolIcon(tool.iconName)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tool.name}
                      </h4>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {tool.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2">{tool.description}</p>

              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <Link
                  href={`/docs?slug=tools/${getToolDocsSlug(tool.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Docs</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => addToolToAgent(tool.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Agent</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredTools.length} tools available</span>
          <button
            onClick={closeAddToolModal}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
