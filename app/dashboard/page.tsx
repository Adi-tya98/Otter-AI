"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  fetchWorkflowsList,
  createBackendWorkflow,
  renameWorkflowBackend,
  deleteWorkflowBackend,
  BackendWorkflowItem,
  BackendWorkflowNode,
  checkBackendHealth,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Sparkles,
  Plus,
  Search,
  Zap,
  Clock,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  RefreshCw,
  Terminal,
  MessageSquare,
  Globe,
  Radio,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, token, openAuthModal } = useAuthStore();

  const [workflows, setWorkflows] = useState<BackendWorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowTrigger, setNewWorkflowTrigger] = useState<
    "chat" | "webhook" | "discord" | "telegram"
  >("chat");
  const [isCreating, setIsCreating] = useState(false);

  const [renameTarget, setRenameTarget] = useState<BackendWorkflowItem | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BackendWorkflowItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Load workflows from database
  const loadWorkflows = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchWorkflowsList(undefined, token || undefined);
      setWorkflows(data.items || []);
    } catch (err: any) {
      console.error("Failed to load workflows:", err);
      setError(err.message || "Failed to load workflows from server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, [token]);

  // Filter workflows by search query
  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const query = searchQuery.toLowerCase();
    return workflows.filter(
      (wf) =>
        wf.name.toLowerCase().includes(query) ||
        (wf.description && wf.description.toLowerCase().includes(query)) ||
        wf.id.toLowerCase().includes(query),
    );
  }, [workflows, searchQuery]);

  // Calculate statistics
  const activeCount = useMemo(
    () => workflows.filter((w) => w.is_active).length,
    [workflows],
  );

  // Handle Create Workflow
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    setIsCreating(true);
    try {
      const slug = newWorkflowName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const workflowId = `${slug || "workflow"}-${Date.now().toString().slice(-6)}`;

      // Default starter document with Chat trigger
      const starterDoc = {
        id: workflowId,
        name: newWorkflowName.trim(),
        description: `Autonomous agent workflow for ${newWorkflowName.trim()}`,
        status: "draft",
        trigger: {
          type: "chat",
          config: {
            placeholder: "Type a query or command...",
            contextRetention: true,
          },
          samplePayload: {
            message: "Hello agent, what tasks can you help me with?",
          },
        },
        agent: {
          model: "claude-3-7-sonnet",
          temperature: 0.2,
          maxTokens: 4096,
          systemPrompt: `You are an autonomous AI Agent designed for ${newWorkflowName.trim()}. Analyze inputs and run tools as needed.`,
          tools: [],
          storage: {
            enabled: true,
            storageId: "local_memory",
            collectionName: workflowId,
          },
        },
        output: {
          responseType: "streaming_chat",
          format: "markdown",
        },
      };

      const starterNodes: BackendWorkflowNode[] = [
        {
          id: "agent-1",
          type: "agent",
          config: {
            model: "claude-3-7-sonnet",
            temperature: 0.2,
            max_iterations: 10,
            system_prompt: `You are an autonomous AI Agent designed for ${newWorkflowName.trim()}. Analyze inputs and run tools as needed.`,
          },
          tool: [],
        },
      ];

      await createBackendWorkflow({
        id: workflowId,
        name: newWorkflowName.trim(),
        nodes: starterNodes,
        edges: [],
        graph: {
          nodes: starterNodes,
          edges: [],
          document: starterDoc,
        },
      } as any);

      setIsCreateModalOpen(false);
      setNewWorkflowName("");
      // Navigate to the newly created studio document
      router.push(`/docs/${workflowId}`);
    } catch (err: any) {
      alert(`Error creating workflow: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Rename Workflow
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;

    setIsRenaming(true);
    try {
      await renameWorkflowBackend(
        renameTarget.id,
        renameValue.trim(),
        undefined,
        token || undefined,
      );
      setWorkflows((prev) =>
        prev.map((wf) =>
          wf.id === renameTarget.id ? { ...wf, name: renameValue.trim() } : wf,
        ),
      );
      setRenameTarget(null);
      setRenameValue("");
    } catch (err: any) {
      alert(`Failed to rename workflow: ${err.message}`);
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle Delete Workflow
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteWorkflowBackend(
        deleteTarget.id,
        undefined,
        token || undefined,
      );
      setWorkflows((prev) => prev.filter((wf) => wf.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(`Failed to delete workflow: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isAuthenticated && user && (
                <span className="text-xs text-slate-400 font-mono">
                  Owner: {user.email}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Workflows Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadWorkflows(true)}
              disabled={refreshing}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              title="Refresh workflows"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin text-cyan-400" : ""}`}
              />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-amber-400 via-amber-300 to-cyan-400 hover:brightness-110 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Workflow</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Workflows</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {workflows.length}
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Active Deployments</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{activeCount}</div>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Execution</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows by title or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Workflows Grid / States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-center my-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <h3 className="font-semibold text-base mb-1">
              Failed to load workflows
            </h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto mb-4">
              {error}
            </p>
            <button
              onClick={() => loadWorkflows()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {searchQuery
                ? "No matching workflows found"
                : "No workflows created yet"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              {searchQuery
                ? `No workflows matched "${searchQuery}". Try a different search term or clear the filter.`
                : "Get started by creating your first autonomous AI agent workflow canvas."}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white transition-colors"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 text-xs font-bold rounded-xl hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create First Workflow</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorkflows.map((wf) => {
              const nodeCount = wf.graph?.nodes?.length || 0;
              const formattedDate = wf.updated_at
                ? new Date(wf.updated_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recently";

              return (
                <div
                  key={wf.id}
                  className="group relative flex flex-col justify-between p-5 bg-[#090e1a]/80 hover:bg-[#0d1424] border border-slate-800/90 hover:border-slate-700 rounded-2xl shadow-lg shadow-black/20 transition-all duration-200"
                >
                  <div>
                    {/* Card Header & Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            wf.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              wf.is_active
                                ? "bg-emerald-400 animate-pulse"
                                : "bg-slate-500"
                            }`}
                          />
                          {wf.is_active ? "Active" : "Draft"}
                        </span>

                        <span className="text-[11px] font-mono text-slate-500">
                          {nodeCount} {nodeCount === 1 ? "Node" : "Nodes"}
                        </span>
                      </div>

                      {/* Dropdown Options */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === wf.id ? null : wf.id,
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                          aria-label="Workflow menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === wf.id && (
                          <div
                            className="absolute right-0 mt-1 w-36 py-1 bg-[#0b101f] border border-slate-800 rounded-xl shadow-2xl z-20 animate-in fade-in zoom-in-95"
                            onMouseLeave={() => setActiveMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setRenameTarget(wf);
                                setRenameValue(wf.name);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeleteTarget(wf);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1.5">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {wf.description ||
                        "Generalized autonomous multi-stage workflow pipeline."}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>

                    <Link
                      href={`/docs/${wf.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 hover:border-cyan-600 text-cyan-300 hover:text-white text-xs font-semibold transition-all group/btn"
                    >
                      <span>Open Studio</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Create Workflow Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-white mb-1">
              Create New Workflow
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Initialize a new autonomous agent workflow stored in PostgreSQL with Chat interface enabled by default.
            </p>

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g., Customer Support Triage Agent"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newWorkflowName.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-cyan-400 hover:brightness-110 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create & Launch Studio</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Rename Workflow Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setRenameTarget(null)}
          />
          <div className="relative w-full max-w-sm bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-white mb-1">
              Rename Workflow
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Update the display title for this workflow.
            </p>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Workflow name..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !renameValue.trim()}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {isRenaming ? "Saving..." : "Save Title"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Delete Confirmation Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm bg-[#0a0f1d] border border-rose-900/60 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-white mb-1">
              Delete Workflow
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to delete{" "}
              <strong className="text-rose-400 font-semibold">
                {deleteTarget.name}
              </strong>
              ? This will permanently remove the workflow and all associated
              deployment history from PostgreSQL.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
