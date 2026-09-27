"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAgentStore } from "@/store/agentStore";
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  RefreshCw,
  Wrench,
  Clock,
  Zap,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export function WorkflowChatSidebar() {
  const {
    isChatSidebarOpen,
    closeChatSidebar,
    chatMessages,
    sendWorkflowChatMessage,
    clearChatMessages,
    getActiveAgent,
    isRunning,
    backendStatus,
    activeExecutionStage,
  } = useAgentStore();

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeDoc = getActiveAgent();

  // Auto-scroll to bottom whenever messages update or agent is running
  useEffect(() => {
    if (isChatSidebarOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isRunning, isChatSidebarOpen]);

  // Focus input on open
  useEffect(() => {
    if (isChatSidebarOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isChatSidebarOpen]);

  if (!isChatSidebarOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isRunning) return;
    const msg = inputVal.trim();
    setInputVal("");
    sendWorkflowChatMessage(msg);
  };

  const handleChipClick = (promptText: string) => {
    if (isRunning) return;
    sendWorkflowChatMessage(promptText);
  };

  const quickChips = [
    "What product categories are available?",
    "Convert 250 USD to EUR",
    "Mail me a status summary",
    "What is the weather in London?",
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
        onClick={closeChatSidebar}
      />

      {/* Slide-over Sidebar Panel */}
      <aside className="fixed top-0 right-0 h-full w-full sm:w-115 z-50 bg-[#090d16] border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white truncate">
                  {activeDoc.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                  {activeDoc.agent.model.split("/").pop()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendStatus === "connected"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-amber-400"
                  }`}
                />
                <span className="font-mono text-[10px]">
                  {backendStatus === "connected"
                    ? "Live FastAPI Backend (:8000)"
                    : "Simulated Engine (Offline)"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={clearChatMessages}
              title="Clear conversation"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={closeChatSidebar}
              title="Close chat"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {chatMessages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-sm ${
                    isUser
                      ? "bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-br-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {/* Message content (Markdown rendered) */}
                  <div className="font-sans text-xs">
                    <MarkdownRenderer content={msg.content} isUser={isUser} />
                  </div>

                  {/* Tools Used Badge (if agent called tools) */}
                  {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="flex items-center gap-1 text-slate-400 font-mono">
                        <Wrench className="w-3 h-3 text-amber-400" />
                        <span>Tools Invoked:</span>
                      </span>
                      {msg.toolsUsed.map((toolItem: any, idx: number) => {
                        const toolName =
                          typeof toolItem === "string"
                            ? toolItem
                            : toolItem?.name || "tool";
                        return (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-[10px]"
                            title={
                              typeof toolItem === "object"
                                ? JSON.stringify(toolItem, null, 2)
                                : undefined
                            }
                          >
                            {toolName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Timestamp & Duration */}
                  <div
                    className={`flex items-center justify-end gap-2 text-[10px] font-mono pt-1 ${
                      isUser ? "text-cyan-200/70" : "text-slate-500"
                    }`}
                  >
                    {msg.durationMs ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {msg.durationMs}ms
                      </span>
                    ) : null}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-900/50 border border-cyan-700/50 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking / Running Indicator */}
          {isRunning && (
            <div className="flex gap-3 text-xs justify-start animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-bl-none p-3.5 space-y-1.5 shadow-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-mono text-[11px] text-cyan-300">
                    Agent is thinking & executing workflow...
                  </span>
                </div>
                {activeExecutionStage && (
                  <div className="text-[10px] font-mono text-slate-500 capitalize">
                    Current stage: [{activeExecutionStage}]
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (when quiet) */}
        {!isRunning && chatMessages.length <= 2 && (
          <div className="px-5 py-2 border-t border-slate-850/60 bg-slate-950/40 shrink-0">
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-1.5">
              Suggested Prompts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors text-left truncate cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-800 bg-slate-950 shrink-0"
        >
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isRunning}
              placeholder={
                isRunning
                  ? "Workflow is executing..."
                  : "Message agent or give instruction..."
              }
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/80 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isRunning}
              className={`absolute right-1.5 p-2 rounded-lg transition-all cursor-pointer ${
                inputVal.trim() && !isRunning
                  ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
              title="Send Message"
            >
              {isRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              Stateless Workflow Run
            </span>
            <span>Press Enter ↵ to send</span>
          </div>
        </form>
      </aside>
    </>
  );
}
