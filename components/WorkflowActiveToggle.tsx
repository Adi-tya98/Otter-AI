"use client";

import React, { useState } from "react";
import { useAgentStore } from "@/store/agentStore";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

interface WorkflowActiveToggleProps {
  size?: "sm" | "md";
  className?: string;
  showNodeCount?: boolean;
}

export function WorkflowActiveToggle({
  size = "md",
  className = "",
  showNodeCount = true,
}: WorkflowActiveToggleProps) {
  const {
    getActiveAgent,
    isCompiling,
    compiledWorkflowId,
    backendNodeCount,
    toggleWorkflowActive,
    backendError,
  } = useAgentStore();

  const [lastActionError, setLastActionError] = useState<string | null>(null);

  const activeDoc = getActiveAgent();
  const isActive = activeDoc?.status === "active";
  const isCompiled =
    compiledWorkflowId === activeDoc?.id?.replace(/[^a-zA-Z0-9_-]/g, "_");

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCompiling) return;
    setLastActionError(null);

    const res = await toggleWorkflowActive(activeDoc?.id);
    if (!res.success && res.error) {
      setLastActionError(res.error || "Failed to toggle workflow state");
    }
  };

  const isSmall = size === "sm";

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isCompiling}
        aria-pressed={isActive}
        title={
          isCompiling
            ? "Compiling workflow graph on Python backend via topological sort..."
            : isActive
            ? `Workflow is Active${
                backendNodeCount ? ` (${backendNodeCount} node graph compiled)` : ""
              }. Click to deactivate.`
            : "Workflow is Inactive. Click to compile graph and make active."
        }
        className={`group relative inline-flex items-center gap-2.5 rounded-xl border font-medium transition-all select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-75 disabled:cursor-not-allowed ${
          isSmall ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
        } ${
          isCompiling
            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse"
            : isActive
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.18)] hover:bg-emerald-900/30 hover:border-emerald-400"
            : "bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800/80"
        }`}
      >
        {/* Status Indicator Icon / Radar Dot */}
        {isCompiling ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
        ) : isActive ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-slate-400 transition-colors shrink-0" />
        )}

        {/* State Label */}
        <span className="font-semibold tracking-wide">
          {isCompiling ? "Compiling..." : isActive ? "Active" : "Inactive"}
        </span>

        {/* n8n-Style Toggle Switch (Track & Thumb) */}
        <div
          className={`relative rounded-full transition-all duration-200 flex items-center shrink-0 ${
            isSmall ? "w-7 h-3.5 p-0.5" : "w-8 h-4 p-0.5"
          } ${
            isActive
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              : "bg-slate-800 border border-slate-750 group-hover:bg-slate-750"
          }`}
        >
          <div
            className={`rounded-full transition-all duration-200 shadow-sm ${
              isSmall ? "w-2.5 h-2.5" : "w-3 h-3"
            } ${
              isActive
                ? isSmall
                  ? "translate-x-3.5 bg-white"
                  : "translate-x-4 bg-white"
                : "translate-x-0 bg-slate-400 group-hover:bg-slate-300"
            }`}
          />
        </div>

        {/* Compiled Node Count Pill (when active and compiled) */}
        {showNodeCount && isActive && (backendNodeCount || isCompiled) && (
          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Check className="w-2.5 h-2.5" />
            <span>{backendNodeCount || 1}N</span>
          </span>
        )}
      </button>

      {/* Optional Inactive Helper Tooltip / Compile Notice */}
      {lastActionError && (
        <div
          className="absolute top-full left-0 mt-2 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/90 border border-rose-600/50 text-[11px] text-rose-300 shadow-xl whitespace-nowrap"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{lastActionError}</span>
          <button
            onClick={() => setLastActionError(null)}
            className="ml-1 text-rose-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
