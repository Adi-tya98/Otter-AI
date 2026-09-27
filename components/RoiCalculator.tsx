"use client";

import React, { useState } from "react";
import { Calculator, Clock, DollarSign, Sparkles, TrendingUp, Zap } from "lucide-react";

export function RoiCalculator() {
  const [workflowCount, setWorkflowCount] = useState<number>(12);
  const [teamSize, setTeamSize] = useState<number>(3);

  // Math:
  // With n8n/Zapier, average maintenance per workflow is ~3.5 hours/month (debugging schema changes, checking logs, re-authenticating tokens).
  // With Otter, maintenance drops to ~0.5 hours/month.
  const hoursSavedPerWorkflow = 3.0;
  const totalHoursSaved = Math.round(workflowCount * hoursSavedPerWorkflow);
  
  // Assuming average engineering/ops hourly cost $75/hr
  const laborSavings = totalHoursSaved * 75;
  
  // Zapier costs around $300 - $600/month for that volume vs Otter $19/mo
  const zapierCostEstimate = Math.max(150, workflowCount * 35);
  const otterCost = 19;
  const saasBillSavings = zapierCostEstimate - otterCost;

  const totalMonthlySavings = laborSavings + saasBillSavings;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive ROI Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Calculate your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              engineering time recovered
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            See how much time your team reclaims every month by eliminating brittle node graphs and
            cryptic JSON debugging.
          </p>
        </div>

        <div className="max-w-4xl mx-auto p-6 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders (Left 6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Slider 1: Workflows */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-white">Active Business Workflows</span>
                  <span className="font-mono text-cyan-400 font-bold text-base">
                    {workflowCount} workflows
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={workflowCount}
                  onChange={(e) => setWorkflowCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>2 workflows</span>
                  <span>20</span>
                  <span>40 workflows</span>
                </div>
              </div>

              {/* Slider 2: Team Size */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-white">Team Members Building / Managing</span>
                  <span className="font-mono text-amber-400 font-bold text-base">
                    {teamSize} people
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>1 person</span>
                  <span>8</span>
                  <span>15 people</span>
                </div>
              </div>

              {/* Bullet notes */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>No more spending Friday nights fixing broken Zapier loops</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Self-healing AI handles unexpected API schema changes</span>
                </div>
              </div>
            </div>

            {/* Results Display (Right 6 cols) */}
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 text-center shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                Estimated Monthly Value
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                ${totalMonthlySavings.toLocaleString()}
                <span className="text-sm font-normal text-slate-400"> / mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">in recovered engineering hours + tool savings</p>

              <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-left">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Time Saved</span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {totalHoursSaved} hrs <span className="text-xs font-normal text-slate-400">/ mo</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SaaS Bill Relief</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    ${saasBillSavings} <span className="text-xs font-normal text-slate-400">/ mo</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="#pricing"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Start Free & Reclaim Your Time</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
